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
  UserRole,
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

    // 1. Kiểm tra mã băm kỳ vọng (Bắt buộc phải cung cấp khi draft đã tồn tại)
    if (current) {
      if (!expectedHash || !expectedHash.trim()) {
        throw new ConcurrencyConflictError(
          `Bắt buộc phải cung cấp mã băm phiên bản (expectedHash) khi lưu bản nháp phân hệ '${moduleKey}'.`,
          current.revisionHash
        );
      }
      if (current.revisionHash !== expectedHash) {
        throw new ConcurrencyConflictError(
          `Xung đột chỉnh sửa ở phân hệ '${moduleKey}'. Phiên bản trên máy chủ đã thay đổi.`,
          current.revisionHash
        );
      }
    }

    const sanitizedData = structuredClone(data);
    if (moduleKey === 'finance') {
      const f = sanitizedData as any;
      f.reconciled = false;
      f.publicApproval = 'pending';
      f.reconciledAt = null;
      f.reconciledBy = [];
      f.firstSigner = null;
      f.secondSigner = null;
    }

    const newHash = await calculateDataHash(sanitizedData);
    const now = new Date().toISOString();
    const dataJson = JSON.stringify(sanitizedData);

    // 2. Tính số thứ tự version mới
    const maxVerRow = await this.db
      .prepare('SELECT MAX(version) as max_version FROM revisions WHERE module_key = ?')
      .bind(moduleKey)
      .first<{ max_version: number | null }>();

    const nextVersion = (maxVerRow?.max_version ?? 0) + 1;
    const revisionId = `rev-${moduleKey}-${nextVersion}-${Date.now()}`;
    const auditId = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 3. Thực thi giao dịch nguyên tử (Atomic Transaction):
    // Sử dụng Cloudflare D1 batch API (https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).
    // D1 batch() thực thi toàn bộ statements trong một transaction duy nhất và rollback nếu có lỗi.
    const draftStmt = current
      ? this.db
          .prepare(
            `UPDATE drafts
             SET data_json = ?, revision_hash = ?, updated_by = ?, updated_at = ?
             WHERE module_key = ? AND revision_hash = ?`
          )
          .bind(dataJson, newHash, userEmail, now, moduleKey, expectedHash)
      : this.db
          .prepare(
            `INSERT INTO drafts (module_key, data_json, revision_hash, updated_by, updated_at)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(moduleKey, dataJson, newHash, userEmail, now);

    const revStmt = this.db
      .prepare(
        `INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
         WHERE changes() = 1`
      )
      .bind(revisionId, moduleKey, nextVersion, dataJson, newHash, userEmail, now, comment || null);

    const auditStmt = this.db
      .prepare(
        `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at)
         SELECT ?, ?, ?, ?, ?, ?
         WHERE changes() = 1`
      )
      .bind(
        auditId,
        userEmail,
        'SAVE_DRAFT',
        moduleKey,
        JSON.stringify({ version: nextVersion, revisionHash: newHash, comment }),
        now
      );

    if (typeof this.db.batch === 'function') {
      const batchResults = await this.db.batch([draftStmt, revStmt, auditStmt]);
      for (const res of batchResults) {
        if (res && res.success === false) {
          throw new Error(res.error || 'Lỗi khi thực thi giao dịch hàng loạt (D1 Batch)');
        }
      }
      const draftResult = batchResults[0];
      if (current && (!draftResult?.meta?.changes || draftResult.meta.changes === 0)) {
        const latest = await this.getDraft(moduleKey);
        throw new ConcurrencyConflictError(
          `Xung đột đồng thời (Race condition) tại phân hệ '${moduleKey}'. Dữ liệu đã bị ghi đè bởi phiên khác.`,
          latest?.revisionHash
        );
      }
    } else {
      throw new Error('D1 database batch API is required for atomic draft operations.');
    }

    const draftRecord: DraftRecord<T> = {
      moduleKey,
      data: sanitizedData as T,
      revisionHash: newHash,
      updatedBy: userEmail,
      updatedAt: now,
    };

    const revisionRecord: RevisionRecord<T> = {
      id: revisionId,
      moduleKey,
      version: nextVersion,
      data: sanitizedData as T,
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

  /** Lấy chi tiết một phiên bản lịch sử cụ thể */
  async getRevision<T = unknown>(moduleKey: ModuleKey, revisionId: string): Promise<RevisionRecord<T> | null> {
    const r = await this.db
      .prepare(
        `SELECT id, module_key, version, data_json, revision_hash, created_by, created_at, comment
         FROM revisions
         WHERE module_key = ? AND id = ?`
      )
      .bind(moduleKey, revisionId)
      .first<{
        id: string;
        module_key: ModuleKey;
        version: number;
        data_json: string;
        revision_hash: string;
        created_by: string;
        created_at: string;
        comment: string | null;
      }>();

    if (!r) return null;

    return {
      id: r.id,
      moduleKey: r.module_key,
      version: r.version,
      data: JSON.parse(r.data_json) as T,
      revisionHash: r.revision_hash,
      createdBy: r.created_by,
      createdAt: r.created_at,
      comment: r.comment || undefined,
    };
  }

  /** Lấy danh sách tài khoản người dùng */
  async listUsers(): Promise<Array<{ id: string; email: string; role: UserRole; createdAt: string; updatedAt: string }>> {
    const result = await this.db
      .prepare('SELECT id, email, role, created_at, updated_at FROM users ORDER BY created_at ASC')
      .all<{ id: string; email: string; role: UserRole; created_at: string; updated_at: string }>();

    return (result.results || []).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));
  }

  /** Cập nhật vai trò người dùng */
  async updateUserRole(email: string, role: UserRole): Promise<boolean> {
    const now = new Date().toISOString();
    await this.db
      .prepare('UPDATE users SET role = ?, updated_at = ? WHERE email = ?')
      .bind(role, now, email)
      .run();
    return true;
  }

  /** Khôi phục một phiên bản cũ thành bản nháp hiện tại */
  async restoreRevision<T = unknown>(
    moduleKey: ModuleKey,
    revisionId: string,
    userEmail: string,
    expectedHash?: string | null
  ): Promise<DraftRecord<T>> {
    const row = await this.db
      .prepare('SELECT data_json, version FROM revisions WHERE id = ? AND module_key = ?')
      .bind(revisionId, moduleKey)
      .first<{ data_json: string; version: number }>();

    if (!row) {
      throw new Error(`Không tìm thấy phiên bản '${revisionId}' của phân hệ '${moduleKey}'.`);
    }

    const current = await this.getDraft(moduleKey);
    if (expectedHash !== undefined && expectedHash !== null) {
      if (current && current.revisionHash !== expectedHash) {
        throw new ConcurrencyConflictError(
          `Xung đột phiên bản: Bản nháp hiện tại (${current.revisionHash}) không khớp với expectedHash (${expectedHash}).`,
          current.revisionHash
        );
      }
    }
    const expected = expectedHash || (current?.revisionHash || null);
    const data = JSON.parse(row.data_json) as T;
    const saveResult = await this.saveDraft(
      moduleKey,
      data,
      expected,
      userEmail,
      `Khôi phục từ phiên bản v${row.version}`
    );

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

  /** Lấy chi tiết một yêu cầu xuất bản theo ID */
  async getPublication(publicationId: string): Promise<PublicationRecord | null> {
    const r = await this.db
      .prepare(
        `SELECT id, snapshot_json, status, requested_by, approved_by, second_reviewer,
                published_at, git_ref, deploy_status, error_message, idempotency_key,
                deployment_verified_at, created_at
         FROM publications
         WHERE id = ?`
      )
      .bind(publicationId)
      .first<any>();

    if (!r) return null;
    return {
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
    };
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
        .prepare("UPDATE publications SET status = 'draft', error_message = ? WHERE id = ?")
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

    // Four-Eyes Principle / Two-Person Policy: Người yêu cầu không được tự duyệt
    if (reviewerEmail.toLowerCase() === pub.requested_by.toLowerCase()) {
      throw new Error('Vi phạm nguyên tắc Bốn Mắt (Four-Eyes): Người tạo yêu cầu không được tự duyệt.');
    }

    const now = new Date().toISOString();
    await this.db
      .prepare("UPDATE publications SET approved_by = ?, status = 'approved' WHERE id = ?")
      .bind(reviewerEmail, publicationId)
      .run();

    await this.recordAuditLog(reviewerEmail, 'APPROVE_PUBLICATION', 'publish', {
      publicationId,
      requestedBy: pub.requested_by,
      approvedBy: reviewerEmail,
      comment,
    });

    return {
      ...pub,
      snapshot: JSON.parse(pub.snapshot_json),
      approvedBy: reviewerEmail,
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

  /** Cập nhật trạng thái duyệt của Media Asset */
  async updateMediaAssetStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await this.db.prepare('UPDATE media_assets SET status = ? WHERE id = ?').bind(status, id).run();
  }

  /** Xóa Media Asset */
  async deleteMediaAsset(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  }

  /**
   * Kiểm tra liên kết tham chiếu ảnh trên toàn bộ hệ thống (Drafts, Revisions, Publications)
   */
  async checkAssetUsageAcrossSystem(assetIdentifier: string): Promise<{ inUse: boolean; usedIn: string[] }> {
    const usedIn: string[] = [];
    const searchNeedle = assetIdentifier.toLowerCase();

    // 1. Kiểm tra drafts
    const draftRows = await this.db
      .prepare('SELECT module_key, data_json FROM drafts')
      .all<{ module_key: string; data_json: string }>();
    for (const row of draftRows.results || []) {
      if (row.data_json && row.data_json.toLowerCase().includes(searchNeedle)) {
        usedIn.push(`Bản nháp ${row.module_key}`);
      }
    }

    // 2. Kiểm tra revisions
    const revRows = await this.db
      .prepare('SELECT id, module_key, data_json FROM revisions')
      .all<{ id: string; module_key: string; data_json: string }>();
    for (const row of revRows.results || []) {
      if (row.data_json && row.data_json.toLowerCase().includes(searchNeedle)) {
        usedIn.push(`Lịch sử ${row.module_key} (${row.id})`);
      }
    }

    // 3. Kiểm tra publications
    const pubRows = await this.db
      .prepare('SELECT id, snapshot_json FROM publications')
      .all<{ id: string; snapshot_json: string }>();
    for (const row of pubRows.results || []) {
      if (row.snapshot_json && row.snapshot_json.toLowerCase().includes(searchNeedle)) {
        usedIn.push(`Xuất bản (${row.id})`);
      }
    }

    return {
      inUse: usedIn.length > 0,
      usedIn,
    };
  }

  /**
   * Xác nhận / Ký duyệt phân hệ Tài chính gắn với phiên bản bất biến (Two-Person Policy)
   */
  async attestFinanceDraft(
    signerEmail: string,
    signerRole: UserRole,
    expectedHash: string
  ): Promise<{
    draft: DraftRecord<any>;
    status: 'pending_second_signer' | 'approved';
    message: string;
  }> {
    const current = await this.getDraft<any>('finance');
    if (!current) {
      throw new Error('Chưa tìm thấy bản nháp phân hệ tài chính.');
    }

    if (current.revisionHash !== expectedHash) {
      throw new ConcurrencyConflictError(
        `Phiên bản tài chính đã bị thay đổi (${current.revisionHash}). Vui lòng tải lại trước khi ký duyệt.`,
        current.revisionHash
      );
    }

    // Lấy phiên bản bất biến mới nhất từ bảng revisions
    const rev = await this.db
      .prepare(
        `SELECT id, version, revision_hash FROM revisions
         WHERE module_key = 'finance'
         ORDER BY version DESC LIMIT 1`
      )
      .first<{ id: string; version: number; revision_hash: string }>();

    if (!rev) {
      throw new Error('Chưa có phiên bản bất biến nào trong lịch sử để đối chiếu.');
    }

    const data = structuredClone(current.data);
    const now = new Date().toISOString();
    let status: 'pending_second_signer' | 'approved' = 'pending_second_signer';
    let message = '';

    if (!data.firstSigner) {
      // Ký lần 1 (Người lập / Preparer)
      data.firstSigner = {
        name: signerEmail,
        role: signerRole,
        signedAt: now,
        revisionId: rev.id,
        revisionHash: rev.revision_hash,
      };
      data.secondSigner = null;
      data.reconciled = false;
      data.publicApproval = 'pending';
      data.reconciledBy = [signerEmail];
      status = 'pending_second_signer';
      message = 'Đã ký xác nhận Người lập (Preparer). Đang chờ Người kiểm tra độc lập (Reviewer) thứ hai ký duyệt.';
    } else {
      // Đã có Người ký lần 1
      if (data.firstSigner.revisionId !== rev.id || data.firstSigner.revisionHash !== rev.revision_hash) {
        // Chữ ký 1 đã cũ/lỗi thời so với phiên bản sửa đổi mới
        data.firstSigner = {
          name: signerEmail,
          role: signerRole,
          signedAt: now,
          revisionId: rev.id,
          revisionHash: rev.revision_hash,
        };
        data.secondSigner = null;
        data.reconciled = false;
        data.publicApproval = 'pending';
        data.reconciledBy = [signerEmail];
        status = 'pending_second_signer';
        message = 'Phiên bản đã thay đổi so với lần ký trước. Chữ ký trước bị hủy, đã ghi nhận chữ ký Người lập mới.';
      } else {
        // Chữ ký 1 hợp lệ -> Kiểm tra Four-Eyes / Chặn tự duyệt (Self-Review)
        if (data.firstSigner.name.trim().toLowerCase() === signerEmail.trim().toLowerCase()) {
          throw new Error('Quy tắc 2 người (Two-Person Policy): Người lập số liệu không được tự phê duyệt lần 2. Cần người duyệt độc lập khác.');
        }

        // Ký lần 2 (Người kiểm tra độc lập / Reviewer)
        data.secondSigner = {
          name: signerEmail,
          role: signerRole,
          signedAt: now,
          revisionId: rev.id,
          revisionHash: rev.revision_hash,
        };
        data.reconciled = true;
        data.reconciledAt = now.slice(0, 10);
        data.publicApproval = 'approved';
        data.reconciledBy = [data.firstSigner.name, signerEmail];
        status = 'approved';
        message = 'Đã hoàn tất xác nhận 2 người (Two-Person Attestation). Dữ liệu tài chính đã sẵn sàng xuất bản.';
      }
    }

    // Cập nhật lại bản nháp vào bảng drafts
    const newHash = await calculateDataHash(data);
    const dataJson = JSON.stringify(data);
    const auditId = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const updateDraftStmt = this.db
      .prepare(
        `UPDATE drafts
         SET data_json = ?, revision_hash = ?, updated_by = ?, updated_at = ?
         WHERE module_key = 'finance' AND revision_hash = ?`
      )
      .bind(dataJson, newHash, signerEmail, now, expectedHash);

    const auditStmt = this.db
      .prepare(
        `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at)
         VALUES (?, ?, ?, 'finance', ?, ?)`
      )
      .bind(
        auditId,
        signerEmail,
        status === 'approved' ? 'FINANCE_SECOND_SIGN' : 'FINANCE_FIRST_SIGN',
        JSON.stringify({
          revisionId: rev.id,
          revisionHash: rev.revision_hash,
          status,
          firstSigner: data.firstSigner?.name,
          secondSigner: data.secondSigner?.name,
        }),
        now
      );

    if (typeof this.db.batch === 'function') {
      await this.db.batch([updateDraftStmt, auditStmt]);
    } else {
      await updateDraftStmt.run();
      await auditStmt.run();
    }

    const updatedDraft: DraftRecord<any> = {
      moduleKey: 'finance',
      data,
      revisionHash: newHash,
      updatedBy: signerEmail,
      updatedAt: now,
    };

    return { draft: updatedDraft, status, message };
  }
}
