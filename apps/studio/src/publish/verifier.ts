/**
 * Bộ kiểm chứng Triển khai Thực tế (Live Deployment Verifier) - Task C17-R2-F3
 * Xác thực trạng thái phát hành thực tế dựa trên artifact kiểm chứng đáng tin cậy
 * từ máy chủ công khai, tách biệt hoàn toàn giữa Yêu cầu (Request), PR, Build và Live.
 * Tuân thủ nguyên tắc:
 * - Không bao giờ chấp nhận cờ boolean hoặc SHA do client tự khai mà không qua xác thực.
 * - Phát hiện chính xác các trạng thái: success, mismatch, stale, unreachable, pending.
 * - Hỗ trợ xác thực webhook triển khai có ký bí mật (Deployment Webhook Secret).
 */

import type { PublicationRecord, Env } from '../types.js';

export interface DeploymentVerificationOptions {
  fetchFn?: typeof fetch;
  targetOrigin?: string;
  expectedCommitSha?: string;
  artifactPath?: string;
}

export type DeploymentVerificationStatus =
  | 'success'
  | 'building'
  | 'failed'
  | 'mismatch'
  | 'stale'
  | 'unreachable'
  | 'pending';

export interface DeploymentVerificationResult {
  verified: boolean;
  deployStatus: DeploymentVerificationStatus;
  deployedSha256?: string;
  deployedCommitSha?: string;
  expectedSha256: string;
  expectedCommitSha?: string;
  message: string;
  verifiedAt?: string;
}

/**
 * Kiểm tra tính hợp lệ của Webhook Secret bằng kỹ thuật so sánh độ dài và chuỗi an toàn
 */
export function verifyDeploymentWebhookSecret(
  request: Request,
  expectedSecret?: string
): boolean {
  if (!expectedSecret || !expectedSecret.trim()) {
    return false; // Fail-secure: nếu server chưa cấu hình secret thì từ chối mọi webhook
  }
  const secretHeader = request.headers.get('X-Deployment-Secret') || request.headers.get('X-Webhook-Secret');
  const authHeader = request.headers.get('Authorization');
  let provided = '';
  if (secretHeader) {
    provided = secretHeader.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    provided = authHeader.slice(7).trim();
  }
  if (!provided) return false;

  const exp = expectedSecret.trim();
  if (provided.length !== exp.length) return false;

  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ exp.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Thẩm tra artifact triển khai thực tế trên môi trường live production
 */
export async function verifyLiveDeployment(
  publication: PublicationRecord,
  env: Env,
  options: DeploymentVerificationOptions = {}
): Promise<DeploymentVerificationResult> {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const origin = options.targetOrigin || env.PRODUCTION_SITE_ORIGIN;
  const expectedSha256 = publication.snapshot.sha256.trim().toLowerCase();
  const expectedCommitSha = options.expectedCommitSha || publication.gitRef || undefined;

  // 1. Khi chưa cấu hình đích kiểm chứng
  if (!origin) {
    return {
      verified: false,
      deployStatus: 'pending',
      expectedSha256,
      expectedCommitSha,
      message: 'PRODUCTION_SITE_ORIGIN chưa được cấu hình. Trạng thái triển khai giữ nguyên là pending.',
    };
  }

  const cleanOrigin = origin.replace(/\/+$/, '');
  const artifactPath = options.artifactPath || '/_meta/snapshot-status.json';
  const verifierUrl = `${cleanOrigin}${artifactPath}`;

  try {
    const res = await fetchFn(verifierUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MangTheoMotNetVe-StudioVerifier/1.0',
      },
    });

    if (!res.ok) {
      return {
        verified: false,
        deployStatus: 'unreachable',
        expectedSha256,
        expectedCommitSha,
        message: `Không thể kết nối đến artifact kiểm chứng triển khai (${res.status} ${res.statusText}): ${verifierUrl}`,
      };
    }

    const artifact = (await res.json().catch(() => null)) as any;
    if (!artifact || typeof artifact !== 'object') {
      return {
        verified: false,
        deployStatus: 'failed',
        expectedSha256,
        expectedCommitSha,
        message: 'Dữ liệu phản hồi từ artifact triển khai không đúng định dạng JSON hợp lệ.',
      };
    }

    const deployedSha256 = String(artifact.sha256 || artifact.snapshotSha256 || '').trim().toLowerCase();
    const deployedCommitSha = artifact.commitSha ? String(artifact.commitSha).trim() : undefined;
    const deployedTimestamp = artifact.generatedAt || artifact.deployedAt ? new Date(artifact.generatedAt || artifact.deployedAt).getTime() : 0;
    const publicationTimestamp = publication.snapshot.generatedAt ? new Date(publication.snapshot.generatedAt).getTime() : 0;

    // 2. Kiểm tra mã SHA-256 của snapshot
    if (deployedSha256 !== expectedSha256) {
      if (deployedTimestamp > 0 && publicationTimestamp > 0 && deployedTimestamp < publicationTimestamp) {
        return {
          verified: false,
          deployStatus: 'stale',
          deployedSha256,
          deployedCommitSha,
          expectedSha256,
          expectedCommitSha,
          message: `Bản triển khai hiện tại là bản cũ (stale): mã băm '${deployedSha256.slice(0, 8)}' so với '${expectedSha256.slice(0, 8)}' của yêu cầu.`,
        };
      }
      return {
        verified: false,
        deployStatus: 'mismatch',
        deployedSha256,
        deployedCommitSha,
        expectedSha256,
        expectedCommitSha,
        message: `Mã băm bản chụp triển khai không khớp (mismatch): '${deployedSha256.slice(0, 8)}' !== '${expectedSha256.slice(0, 8)}'.`,
      };
    }

    // 3. Kiểm tra Commit SHA nếu có chỉ định kỳ vọng
    if (expectedCommitSha && deployedCommitSha && expectedCommitSha.trim() !== deployedCommitSha.trim()) {
      return {
        verified: false,
        deployStatus: 'mismatch',
        deployedSha256,
        deployedCommitSha,
        expectedSha256,
        expectedCommitSha,
        message: `Commit SHA triển khai không khớp: '${deployedCommitSha}' !== '${expectedCommitSha}'.`,
      };
    }

    // Xác thực thành công hoàn toàn
    const now = new Date().toISOString();
    return {
      verified: true,
      deployStatus: 'success',
      deployedSha256,
      deployedCommitSha,
      expectedSha256,
      expectedCommitSha,
      message: 'Xác thực triển khai Live thành công: Mã băm và artifact khớp chính xác.',
      verifiedAt: now,
    };
  } catch (err: any) {
    return {
      verified: false,
      deployStatus: 'unreachable',
      expectedSha256,
      expectedCommitSha,
      message: `Lỗi kết nối khi kiểm chứng triển khai: ${err.message}`,
    };
  }
}
