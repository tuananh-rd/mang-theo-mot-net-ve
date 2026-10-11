/**
 * Trình truy cập cơ sở dữ liệu D1 trung tâm (Task C17)
 * Quản lý Drafts, Revisions, Audit Logs, Media Assets, và Publications với Optimistic Concurrency Control.
 */

import type {
  D1Database,
  DraftRecord,
  RevisionRecord,
  AuditLogRecord,
  MediaAssetRecord,
  PublicationRecord,
  PublicationSnapshot,
  ModuleKey,
} from '../types.js';

export class ConcurrencyConflictError extends Error {
  constructor(
    message: string = 'Dữ liệu đã bị sửa đổi bởi người dùng khác kể từ lần tải cuối. Vui lòng làm mới trang trước khi lưu.',
    public readonly currentHash?: string
  ) {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

/** Tính mã băm SHA-256 cho đối tượng dữ liệu để kiểm soát xung đột */
export async function calculateDataHash(data: unknown): Promise<string> {
  const json = JSON.stringify(data);
  const msgUint8 = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class StudioDbClient {
  constructor(private db: D1Database) {}

  /** Lấy bản nháp hiện tại của một phân hệ */
  async getDraft<T = unknown>(moduleKey: ModuleKey): Promise<DraftRecord<T> | null> {
    const row = await this.db
      .prepare('SELECT module_key, data_json, revision_hash, updated_by, updated_at FROM drafts WHERE module_key = ?')
      .bind(moduleKey)
      .first<{
        module_key: ModuleKey;
        data_json: string;
        revision_hash: string;
        updated_by: string;
        updated_at: string;
      }>();

    if (!row) return null;

    return {
      moduleKey: row.module_key,
      data: JSON.parse(row.data_json) as T,
      revisionHash: row.revision_hash,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    };
  }

  /** Lấy toàn bộ các bản nháp đang có */
  async getAllDrafts(): Promise<Record<string, unknown>> {
    const result = await this.db
      .prepare('SELECT module_key, data_json FROM drafts')
      .all<{ module_key: string; data_json: string }>();

    const map: Record<string, unknown> = {};
    for (const row of result.results || []) {
      try {
        map[row.module_key] = JSON.parse(row.data_json);
      } catch {
        map[row.module_key] = null;
      }
    }
    return map;
  }

  /** Lưu bản nháp với cơ chế khóa lạc quan (Optimistic Concurrency Control) */
  async saveDraft<T = unknown>(
    moduleKey: ModuleKey,
    data: T,
    expectedHash: string | null,
    userEmail: string,
    comment?: string
  ): Promise<{ draft: DraftRecord<T>; revision: RevisionRecord<T> }> {
    const current = await this.getDraft(moduleKey);

    // Kiểm tra xung đột: nếu đã có bản nháp trên server mà client gửi hash khác
    if (current && expectedHash && current.revisionHash !== expectedHash) {
      throw new ConcurrencyConflictError(
        `Xung đột chỉnh sửa ở phân hệ '${moduleKey}'. Phiên bản trên máy chủ đã thay đổi.`,
        current.revisionHash
      );
    }

    const newHash = await calculateDataHash(data);
    const now = new Date().toISOString();
    const dataJson = JSON.stringify(data);

    // Tính số thứ tự version mới
    const maxVerRow = await this.db
      .prepare('SELECT MAX(version) as max_version FROM revisions WHERE module_key = ?')
      .bind(moduleKey)
      .first<{ max_version: number | null }>();

    const nextVersion = (maxVerRow?.max_version ?? 0) + 1;
    const revisionId = `rev-${moduleKey}-${nextVersion}-${Date.now()}`;

    // Lưu bản nháp
    await this.db
      .prepare(
        `INSERT INTO drafts (module_key, data_json, revision_hash, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(module_key) DO UPDATE SET
           data_json = excluded.data_json,
           revision_hash = excluded.revision_hash,
           updated_by = excluded.updated_by,
           updated_at = excluded.updated_at`
      )
      .bind(moduleKey, dataJson, newHash, userEmail, now)
      .run();

    // Lưu vào lịch sử phiên bản
    await this.db
      .prepare(
        `INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(revisionId, moduleKey, nextVersion, dataJson, newHash, userEmail, now, comment || null)
      .run();

    // Ghi audit log
    await this.recordAuditLog(
      userEmail,
      'SAVE_DRAFT',
      moduleKey,
      { version: nextVersion, revisionHash: newHash, comment }
    );

    const draftRecord: DraftRecord<T> = {
      moduleKey,
      data,
      revisionHash: newHash,
      updatedBy: userEmail,
      updatedAt: now,
    };

    const revisionRecord: RevisionRecord<T> = {
      id: revisionId,
      moduleKey,
      version: nextVersion,
      data,
      revisionHash: newHash,
      createdBy: userEmail,
      createdAt: now,
      comment,
    };

    return { draft: draftRecord, revision: revisionRecord };
  }

  /** Lấy danh sách lịch sử phiên bản */
  async listRevisions<T = unknown>(moduleKey: ModuleKey, limit = 20): Promise<RevisionRecord<T>[]> {
    const result = await this.db
      .prepare(
        `SELECT id, module_key, version, data_json, revision_hash, created_by, created_at, comment
         FROM revisions
         WHERE module_key = ?
         ORDER BY version DESC
         LIMIT ?`
      )
      .bind(moduleKey, limit)
      .all<{
        id: string;
        module_key: ModuleKey;
        version: number;
        data_json: string;
        revision_hash: string;
        created_by: string;
        created_at: string;
        comment: string | null;
      }>();

    return (result.results || []).map((r) => ({
      id: r.id,
      moduleKey: r.module_key,
      version: r.version,
      data: JSON.parse(r.data_json) as T,
      revisionHash: r.revision_hash,
      createdBy: r.created_by,
      createdAt: r.created_at,
      comment: r.comment || undefined,
    }));
  }

  /** Khôi phục một phiên bản cũ thành bản nháp hiện tại */
  async restoreRevision<T = unknown>(
    moduleKey: ModuleKey,
    revisionId: string,
    userEmail: string
  ): Promise<DraftRecord<T>> {
    const row = await this.db
      .prepare('SELECT data_json, version FROM revisions WHERE id = ? AND module_key = ?')
      .bind(revisionId, moduleKey)
      .first<{ data_json: string; version: number }>();

    if (!row) {
      throw new Error(`Không tìm thấy phiên bản '${revisionId}' của phân hệ '${moduleKey}'.`);
    }

    const data = JSON.parse(row.data_json) as T;
    const saveResult = await this.saveDraft(
      moduleKey,
      data,
      null, // bỏ qua hash kiểm tra khi chủ động khôi phục
      userEmail,
      `Khôi phục từ phiên bản v${row.version}`
    );

    await this.recordAuditLog(userEmail, 'RESTORE_REVISION', moduleKey, {
      restoredFromId: revisionId,
      restoredFromVersion: row.version,
    });

    return saveResult.draft;
  }

  /** Ghi nhật ký kiểm toán */
  async recordAuditLog(
    userEmail: string,
    action: string,
    moduleKey: ModuleKey | 'system' | 'auth',
    details: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userEmail, action, moduleKey, JSON.stringify(details), ipAddress || null, now)
      .run();
  }

  /** Lấy danh sách nhật ký kiểm toán */
  async listAuditLogs(limit = 50, offset = 0): Promise<AuditLogRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT id, user_email, action, module_key, details_json, ip_address, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<{
        id: string;
        user_email: string;
        action: string;
        module_key: ModuleKey | 'system' | 'auth';
        details_json: string;
        ip_address: string | null;
        created_at: string;
      }>();

    return (result.results || []).map((r) => ({
      id: r.id,
      userEmail: r.user_email,
      action: r.action,
      moduleKey: r.module_key,
      details: JSON.parse(r.details_json),
      ipAddress: r.ip_address || undefined,
      createdAt: r.created_at,
    }));
  }

  /** Tạo yêu cầu xuất bản (Publication) có kiểm tra Idempotency Key */
  async createPublicationRequest(
    snapshot: PublicationSnapshot,
    requestedBy: string,
    idempotencyKey?: string
  ): Promise<PublicationRecord> {
    if (idempotencyKey) {
      const existing = await this.db
        .prepare('SELECT * FROM publications WHERE idempotency_key = ?')
        .bind(idempotencyKey)
        .first<any>();

      if (existing) {
        return {
          id: existing.id,
          snapshot: JSON.parse(existing.snapshot_json),
          status: existing.status,
          requestedBy: existing.requested_by,
          approvedBy: existing.approved_by,
          secondReviewer: existing.second_reviewer,
          publishedAt: existing.published_at,
          gitRef: existing.git_ref,
          deployStatus: existing.deploy_status,
          errorMessage: existing.error_message,
          idempotencyKey: existing.idempotency_key,
          deploymentVerifiedAt: existing.deployment_verified_at,
          createdAt: existing.created_at,
        };
      }
    }

    const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const snapshotJson = JSON.stringify(snapshot);

    await this.db
      .prepare(
        `INSERT INTO publications (
           id, snapshot_json, status, requested_by, approved_by, second_reviewer,
           published_at, git_ref, deploy_status, error_message, idempotency_key,
           deployment_verified_at, created_at
         ) VALUES (?, ?, 'pending_review', ?, NULL, NULL, NULL, NULL, 'unknown', NULL, ?, NULL, ?)`
      )
      .bind(id, snapshotJson, requestedBy, idempotencyKey || null, now)
      .run();

    await this.recordAuditLog(requestedBy, 'REQUEST_PUBLICATION', 'publish', {
      publicationId: id,
      snapshotSha256: snapshot.sha256,
      idempotencyKey,
    });

    return {
      id,
      snapshot,
      status: 'pending_review',
      requestedBy,
      approvedBy: null,
      secondReviewer: null,
      publishedAt: null,
      gitRef: null,
      deployStatus: 'unknown',
      errorMessage: null,
      idempotencyKey: idempotencyKey || null,
      deploymentVerifiedAt: null,
      createdAt: now,
    };
  }

  /** Lấy danh sách lịch sử xuất bản */
  async listPublications(limit = 20): Promise<PublicationRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT id, snapshot_json, status, requested_by, approved_by, second_reviewer,
                published_at, git_ref, deploy_status, error_message, idempotency_key,
                deployment_verified_at, created_at
         FROM publications
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<any>();

    return (result.results || []).map((r) => ({
      id: r.id,
      snapshot: JSON.parse(r.snapshot_json),
      status: r.status,
      requestedBy: r.requested_by,
      approvedBy: r.approved_by,
      secondReviewer: r.second_reviewer,
      publishedAt: r.published_at,
      gitRef: r.git_ref,
      deployStatus: r.deploy_status,
      errorMessage: r.error_message,
      idempotencyKey: r.idempotency_key,
      deploymentVerifiedAt: r.deployment_verified_at,
      createdAt: r.created_at,
    }));
  }

  /** Duyệt yêu cầu xuất bản tuân thủ Four-Eyes Principle */
  async reviewPublication(
    publicationId: string,
    reviewerEmail: string,
    action: 'approve' | 'reject',
    comment?: string
  ): Promise<PublicationRecord> {
    const pub = await this.db
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind(publicationId)
      .first<any>();

    if (!pub) {
      throw new Error(`Không tìm thấy yêu cầu xuất bản '${publicationId}'.`);
    }

    if (pub.status !== 'pending_review') {
      throw new Error(`Yêu cầu xuất bản đang ở trạng thái '${pub.status}', không thể duyệt tiếp.`);
    }

    if (action === 'reject') {
      const now = new Date().toISOString();
      await this.db
        .prepare('UPDATE publications SET status = "draft", error_message = ? WHERE id = ?')
        .bind(comment || 'Từ chối bởi người duyệt', publicationId)
        .run();

      await this.recordAuditLog(reviewerEmail, 'REJECT_PUBLICATION', 'publish', {
        publicationId,
        comment,
      });

      return {
        ...pub,
        snapshot: JSON.parse(pub.snapshot_json),
        status: 'draft',
        errorMessage: comment || 'Từ chối bởi người duyệt',
      };
    }

    // Four-Eyes Principle: Người yêu cầu không được tự duyệt
    if (reviewerEmail.toLowerCase() === pub.requested_by.toLowerCase()) {
      throw new Error('Vi phạm nguyên tắc Bốn Mắt (Four-Eyes): Người tạo yêu cầu không được tự duyệt.');
    }

    // Người duyệt 1
    if (!pub.approved_by) {
      await this.db
        .prepare('UPDATE publications SET approved_by = ? WHERE id = ?')
        .bind(reviewerEmail, publicationId)
        .run();

      await this.recordAuditLog(reviewerEmail, 'APPROVE_PUBLICATION_STAGE_1', 'publish', {
        publicationId,
        comment,
      });

      return {
        ...pub,
        snapshot: JSON.parse(pub.snapshot_json),
        approvedBy: reviewerEmail,
      };
    }

    // Người duyệt 2 (Independent Reviewer)
    if (reviewerEmail.toLowerCase() === pub.approved_by.toLowerCase()) {
      throw new Error('Vi phạm nguyên tắc Bốn Mắt: Cần người duyệt thứ hai độc lập, không được lặp lại người duyệt trước.');
    }

    const now = new Date().toISOString();
    await this.db
      .prepare(
        'UPDATE publications SET second_reviewer = ?, status = "approved" WHERE id = ?'
      )
      .bind(reviewerEmail, publicationId)
      .run();

    await this.recordAuditLog(reviewerEmail, 'APPROVE_PUBLICATION_STAGE_2', 'publish', {
      publicationId,
      firstReviewer: pub.approved_by,
      comment,
    });

    return {
      ...pub,
      snapshot: JSON.parse(pub.snapshot_json),
      secondReviewer: reviewerEmail,
      status: 'approved',
    };
  }

  /** Cập nhật trạng thái triển khai / xuất bản thực tế */
  async updatePublicationDeployStatus(
    publicationId: string,
    deployStatus: 'building' | 'success' | 'failed',
    gitRef?: string,
    errorMessage?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    let publishedAt: string | null = null;
    let verifiedAt: string | null = null;
    let status = 'approved';

    if (deployStatus === 'success') {
      publishedAt = now;
      verifiedAt = now;
      status = 'published';
    } else if (deployStatus === 'failed') {
      status = 'approved';
    }

    await this.db
      .prepare(
        `UPDATE publications
         SET deploy_status = ?, git_ref = COALESCE(?, git_ref),
             error_message = ?, published_at = COALESCE(?, published_at),
             deployment_verified_at = COALESCE(?, deployment_verified_at),
             status = ?
         WHERE id = ?`
      )
      .bind(
        deployStatus,
        gitRef || null,
        errorMessage || null,
        publishedAt,
        verifiedAt,
        status,
        publicationId
      )
      .run();
  }

  /** Quản lý Media Asset trong cơ sở dữ liệu */
  async saveMediaAsset(asset: MediaAssetRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO media_assets (
           id, filename, content_type, size_bytes, r2_key, status, alt, caption,
           credit_name, credit_url, source, is_illustration, focal_x, focal_y,
           created_by, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        asset.id,
        asset.filename,
        asset.contentType,
        asset.sizeBytes,
        asset.r2Key,
        asset.status,
        asset.alt,
        asset.caption || null,
        asset.creditName || null,
        asset.creditUrl || null,
        asset.source || null,
        asset.isIllustration ? 1 : 0,
        asset.focalX,
        asset.focalY,
        asset.createdBy,
        asset.createdAt
      )
      .run();
  }

  /** Lấy danh sách Media Assets */
  async listMediaAssets(limit = 50): Promise<MediaAssetRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM media_assets ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all<any>();

    return (result.results || []).map((r) => ({
      id: r.id,
      filename: r.filename,
      contentType: r.content_type,
      sizeBytes: r.size_bytes,
      r2Key: r.r2_key,
      status: r.status,
      alt: r.alt,
      caption: r.caption || undefined,
      creditName: r.credit_name || undefined,
      creditUrl: r.credit_url || undefined,
      source: r.source || undefined,
      isIllustration: Boolean(r.is_illustration),
      focalX: r.focal_x,
      focalY: r.focal_y,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }));
  }

  /** Xóa Media Asset */
  async deleteMediaAsset(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  }
}
