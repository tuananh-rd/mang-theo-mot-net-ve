/**
 * Danh mục Tài sản Đa phương tiện đã được duyệt (Approved Media Registry - Task C17-R2-F2)
 * Lưu trữ danh sách chính thức các tài nguyên hình ảnh được phê duyệt,
 * bao gồm dung lượng thật (size_bytes), mã băm SHA-256 thực tế, quyền sở hữu,
 * tác giả, nguồn gốc, điểm trọng tâm (focal point) và đường dẫn công khai.
 */

import approvedRegistryJson from './approved-registry.json' with { type: 'json' };
import type { D1Database } from '../types.js';

export interface ApprovedRegistryAsset {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  r2Key: string;
  publicPath: string;
  status: 'approved' | 'pending' | 'rejected';
  alt: string;
  caption: string | null;
  creditName: string | null;
  creditUrl: string | null;
  creditSource: string | null;
  isIllustration: number;
  focalX: number;
  focalY: number;
  createdBy: string;
  createdAt: string;
}

export const APPROVED_MEDIA_REGISTRY: ApprovedRegistryAsset[] = approvedRegistryJson as ApprovedRegistryAsset[];

export type ByteLoader = (
  asset: ApprovedRegistryAsset
) => Promise<Uint8Array | ArrayBuffer | null> | Uint8Array | ArrayBuffer | null;

/**
 * Nhập danh mục hình ảnh đã duyệt vào cơ sở dữ liệu D1 và R2 bucket (nếu chưa có).
 * Tuân thủ tuyệt đối quy tắc Fail-Closed:
 * 1. Hoàn toàn không chứa import node:fs / node:path trong đồ thị Worker.
 * 2. Mọi tài sản phải được nạp và xác thực kích thước thật (sizeBytes) cùng mã băm SHA-256 thực tế
 *    trước khi được phép ghi vào DB hoặc báo thành công.
 * 3. Nếu thiếu bytes hoặc sai mã băm, lập tức ném lỗi (fail-closed), không chèn DB dở dang.
 */
export async function importApprovedRegistryIntoDb(
  db: D1Database,
  bucket?: any,
  byteLoader?: ByteLoader
): Promise<{ importedCount: number; existingCount: number; assets: ApprovedRegistryAsset[] }> {
  let importedCount = 0;
  let existingCount = 0;

  for (const asset of APPROVED_MEDIA_REGISTRY) {
    // 1. Kiểm tra tính chuẩn tắc của đường dẫn canonical và R2 key (chống traversal & Windows slash)
    if (asset.publicPath.includes('\\') || asset.r2Key.includes('\\')) {
      throw new Error(`Đường dẫn tài sản không chuẩn tắc (chứa backslash): ${asset.publicPath}`);
    }
    if (!asset.publicPath.startsWith('/') || asset.publicPath.includes('..') || asset.r2Key.includes('..')) {
      throw new Error(`Đường dẫn tài sản không hợp lệ (lỗi root hoặc path traversal): ${asset.publicPath}`);
    }

    // 2. Tải bytes thực tế: hoặc từ byteLoader, hoặc từ R2 bucket hiện có
    let rawBytes: Uint8Array | null = null;

    if (byteLoader) {
      const loaded = await byteLoader(asset);
      if (loaded) {
        rawBytes = loaded instanceof Uint8Array ? loaded : new Uint8Array(loaded);
      }
    } else if (bucket && typeof bucket.get === 'function') {
      const r2Obj = await bucket.get(asset.r2Key);
      if (r2Obj) {
        const ab = await r2Obj.arrayBuffer();
        rawBytes = new Uint8Array(ab);
      }
    }

    // Fail-closed: Bắt buộc phải có bytes thực tế để xác minh
    if (!rawBytes) {
      throw new Error(`Không thể tìm thấy nguồn bytes thực tế để xác thực tài sản: ${asset.id} (${asset.r2Key})`);
    }

    // 3. Xác thực độ dài bytes chính xác
    if (rawBytes.byteLength !== asset.sizeBytes) {
      throw new Error(
        `Kích thước tệp không khớp cho ${asset.filename}: kỳ vọng ${asset.sizeBytes} bytes, nhận được ${rawBytes.byteLength} bytes`
      );
    }

    // 4. Xác thực mã băm SHA-256 thực tế
    const cryptoModule = globalThis.crypto;
    if (!cryptoModule?.subtle) {
      throw new Error('Môi trường thiếu crypto.subtle để tính toán băm SHA-256');
    }
    const digest = await cryptoModule.subtle.digest('SHA-256', rawBytes);
    const computedHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (computedHash.toLowerCase() !== asset.sha256.toLowerCase()) {
      throw new Error(
        `Mã băm SHA-256 không khớp cho ${asset.filename}: kỳ vọng ${asset.sha256}, tính được ${computedHash}`
      );
    }

    // 5. Lưu trữ tệp vào R2 bucket nếu có bucket binding và nguồn nạp từ byteLoader
    if (bucket && typeof bucket.put === 'function' && byteLoader) {
      await bucket.put(asset.r2Key, rawBytes, {
        httpMetadata: { contentType: asset.contentType },
        customMetadata: { sha256: asset.sha256, assetId: asset.id },
      });
    }

    const existing = await db
      .prepare('SELECT id FROM media_assets WHERE id = ? OR r2_key = ?')
      .bind(asset.id, asset.r2Key)
      .first<{ id: string }>();

    if (existing) {
      existingCount++;
      continue;
    }

    await db
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
        asset.caption,
        asset.creditName,
        asset.creditUrl,
        asset.creditSource,
        asset.isIllustration,
        asset.focalX,
        asset.focalY,
        asset.createdBy,
        asset.createdAt
      )
      .run();

    importedCount++;
  }

  return {
    importedCount,
    existingCount,
    assets: APPROVED_MEDIA_REGISTRY,
  };
}
