/**
 * Trình định tuyến API REST cho Content Studio (Task C17)
 * Quản lý Drafts, Revisions, Media, Finance CSV, Audit Logs, và Publications.
 */

import type { Env, AuthSession, ModuleKey, MediaAssetRecord, UserRole } from '../types.js';
import { StudioDbClient, ConcurrencyConflictError } from '../db/client.js';
import { assertCanEdit, assertCanReview, assertCanPublish, assertCanManageUsers } from '../auth/rbac.js';
import { validateCsrf } from '../auth/middleware.js';
import { getDefaultModuleData, validateModuleData, type FinanceModuleData, type DonationEntry } from '../schemas/index.js';
import { sniffImageFormat, MAX_FILE_SIZE_BYTES, checkAssetUsageInDrafts, stripImageMetadata } from '../storage/media-sniffer.js';
import { decodeAndSanitizeRaster } from '../storage/media-sanitizer.js';
import { createPublicationSnapshot } from '../publish/adapter.js';
import { triggerGitHubPublication } from '../publish/github.js';
import { verifyLiveDeployment, verifyDeploymentWebhookSecret } from '../publish/verifier.js';
import { validateDonationCSV } from '../../../../tools/content-studio/csv-validator.mjs';
import { importApprovedRegistryIntoDb, APPROVED_MEDIA_REGISTRY } from '../storage/media-registry.js';
import { handlePreorderAdminRequest } from '../preorders/admin.js';

const VALID_MODULES: ModuleKey[] = ['project', 'journal', 'products', 'finance', 'team'];

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function errorResponse(message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ error: message, success: false, ...extra }, status);
}

export async function handleApiRequest(
  request: Request,
  env: Env,
  session: AuthSession
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const dbClient = new StudioDbClient(env.DB);
  const user = session.user;

  if (path.startsWith('/api/preorders') || path.startsWith('/api/preorder-products')) {
    const preorderResponse = await handlePreorderAdminRequest(request, env.DB, session, { binding: env.EMAIL, from: env.PREORDER_MAIL_FROM, notifyTo: env.PREORDER_NOTIFY_TO, replyTo: env.PREORDER_REPLY_TO });
    if (preorderResponse) return preorderResponse;
  }

  // 1. Thông tin phiên người dùng hiện tại
  if (path === '/api/me' && method === 'GET') {
    return jsonResponse({
      user,
      isDev: session.isDev,
      expiresAt: session.expiresAt,
    });
  }

  // 2. Lấy bản nháp của phân hệ: GET /api/drafts/:moduleKey
  const draftMatch = path.match(/^\/api\/drafts\/([a-z0-9-]+)$/);
  if (draftMatch && method === 'GET') {
    const rawModuleKey = draftMatch[1];
    if (!VALID_MODULES.includes(rawModuleKey as ModuleKey)) {
      return errorResponse(`Phân hệ '${rawModuleKey}' không hợp lệ hoặc không được hỗ trợ.`, 400);
    }
    const moduleKey = rawModuleKey as ModuleKey;
    let draft = await dbClient.getDraft(moduleKey);
    if (!draft) {
      // Khởi tạo dữ liệu hạt giống nếu chưa có
      const defaultData = getDefaultModuleData(moduleKey);
      const saveResult = await dbClient.saveDraft(
        moduleKey,
        defaultData,
        null,
        'system-bootstrap@internal',
        'Khởi tạo hạt giống phân hệ ban đầu'
      );
      draft = saveResult.draft;
    } else if (moduleKey === 'journal' && Array.isArray(draft.data)) {
      // Nâng cấp hạt giống cũ được nhận diện (khoi-dong-du-an, khao-sat-thuc-te) nếu chưa qua chỉnh sửa người dùng
      const isObsolete = (draft.data as any[]).some((a: any) => a.slug === 'khoi-dong-du-an' || a.slug === 'khao-sat-thuc-te');
      if (isObsolete && (draft.updatedBy === 'system-bootstrap@internal' || draft.updatedBy === 'system-migration@internal')) {
        const canonicalData = getDefaultModuleData('journal');
        const saveResult = await dbClient.saveDraft(
          'journal',
          canonicalData,
          draft.revisionHash,
          'system-migration@internal',
          'Nâng cấp hạt giống nhật ký lên cấu trúc chuẩn C17'
        );
        draft = saveResult.draft;
      }
    }
    return jsonResponse({ draft, success: true });
  }

  // 3. Lưu bản nháp: POST /api/drafts/:moduleKey
  if (draftMatch && method === 'POST') {
    validateCsrf(request);
    assertCanEdit(user.role);

    const rawModuleKey = draftMatch[1];
    if (!VALID_MODULES.includes(rawModuleKey as ModuleKey)) {
      return errorResponse(`Phân hệ '${rawModuleKey}' không hợp lệ hoặc không được hỗ trợ.`, 400);
    }
    const moduleKey = rawModuleKey as ModuleKey;
    const body = await request.json() as { data: unknown; expectedHash?: string; comment?: string };

    if (!body || body.data === undefined) {
      return errorResponse('Thiếu trường dữ liệu data trong payload.', 400);
    }

    let payloadData = body.data;
    if (moduleKey === 'finance' && payloadData && typeof payloadData === 'object') {
      const f = payloadData as any;
      f.reconciled = false;
      f.publicApproval = 'pending';
      f.reconciledAt = null;
      f.reconciledBy = [];
      f.firstSigner = null;
      f.secondSigner = null;
    }

    // Kiểm thực dữ liệu theo schema phân hệ
    const validation = validateModuleData(moduleKey, payloadData);
    if (!validation.isValid) {
      return errorResponse('Dữ liệu không vượt qua kiểm tra tính hợp lệ.', 400, {
        validationErrors: validation.errors,
      });
    }

    try {
      const result = await dbClient.saveDraft(
        moduleKey,
        payloadData,
        body.expectedHash || null,
        user.email,
        body.comment
      );
      return jsonResponse({
        success: true,
        draft: result.draft,
        revision: result.revision,
      });
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError) {
        return errorResponse(err.message, 409, {
          conflict: true,
          currentHash: err.currentHash,
        });
      }
      return errorResponse(err.message || 'Lỗi lưu bản nháp.', 500);
    }
  }

  // 4. Lịch sử phiên bản: GET /api/revisions/:moduleKey
  const revisionsMatch = path.match(/^\/api\/revisions\/([a-z0-9-]+)$/);
  if (revisionsMatch && method === 'GET') {
    const rawModuleKey = revisionsMatch[1];
    if (!VALID_MODULES.includes(rawModuleKey as ModuleKey)) {
      return errorResponse(`Phân hệ '${rawModuleKey}' không hợp lệ hoặc không được hỗ trợ.`, 400);
    }
    const moduleKey = rawModuleKey as ModuleKey;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const revisions = await dbClient.listRevisions(moduleKey, limit);
    return jsonResponse({ revisions, success: true });
  }

  // 4b. Chi tiết một phiên bản: GET /api/revisions/:moduleKey/:id
  const revisionDetailMatch = path.match(/^\/api\/revisions\/([a-z0-9-]+)\/([^/]+)$/);
  if (revisionDetailMatch && method === 'GET') {
    const rawModuleKey = revisionDetailMatch[1];
    if (!VALID_MODULES.includes(rawModuleKey as ModuleKey)) {
      return errorResponse(`Phân hệ '${rawModuleKey}' không hợp lệ hoặc không được hỗ trợ.`, 400);
    }
    const moduleKey = rawModuleKey as ModuleKey;
    const revisionId = revisionDetailMatch[2];
    const revision = await dbClient.getRevision(moduleKey, revisionId);
    if (!revision) {
      return errorResponse(`Không tìm thấy phiên bản '${revisionId}' của phân hệ '${moduleKey}'.`, 404);
    }
    return jsonResponse({ revision, success: true });
  }

  // 5. Khôi phục phiên bản: POST /api/revisions/:moduleKey/:id/restore
  const restoreMatch = path.match(/^\/api\/revisions\/([a-z0-9-]+)\/([^/]+)\/restore$/);
  if (restoreMatch && method === 'POST') {
    validateCsrf(request);
    assertCanEdit(user.role);

    const moduleKey = restoreMatch[1] as ModuleKey;
    const revisionId = restoreMatch[2];
    const body = (await request.json().catch(() => ({}))) as { expectedHash?: string };

    if (!body.expectedHash || typeof body.expectedHash !== 'string' || !body.expectedHash.trim()) {
      return errorResponse('Bắt buộc phải cung cấp expectedHash của bản nháp hiện tại để chống ghi đè (OCC).', 400);
    }

    try {
      const restoredDraft = await dbClient.restoreRevision(
        moduleKey,
        revisionId,
        user.email,
        body.expectedHash.trim()
      );
      return jsonResponse({ success: true, draft: restoredDraft });
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError) {
        return errorResponse(err.message, 409, {
          conflict: true,
          currentHash: err.currentHash,
        });
      }
      return errorResponse(err.message || 'Không thể khôi phục phiên bản.', 400);
    }
  }

  // 6. Danh sách Media Assets: GET /api/media (Pure read, không gây side-effect import)
  if (path === '/api/media' && method === 'GET') {
    const assets = await dbClient.listMediaAssets(200);
    return jsonResponse({ assets, success: true });
  }

  // 6a. Đọc tệp Media từ R2 đã xác thực: GET /api/media/:id/file
  const mediaFileMatch = path.match(/^\/api\/media\/([^/]+)\/file$/);
  if (mediaFileMatch && method === 'GET') {
    const assetId = mediaFileMatch[1];
    const asset = await dbClient.getMediaAsset(assetId);
    if (!asset) {
      return errorResponse('Không tìm thấy tài sản media.', 404);
    }
    if (env.BUCKET) {
      const obj = await env.BUCKET.get(asset.r2Key);
      if (obj) {
        return new Response(obj.body, {
          status: 200,
          headers: {
            'Content-Type': asset.contentType,
            'Cache-Control': 'private, no-store',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        });
      }
    }
    return errorResponse('Tệp media chưa có sẵn trong kho lưu trữ R2.', 404);
  }

  // 6b. Nhập danh mục Media đã duyệt: POST /api/media/import-registry
  if (path === '/api/media/import-registry' && method === 'POST') {
    validateCsrf(request);
    assertCanEdit(user.role);
    try {
      const result = await importApprovedRegistryIntoDb(env.DB, env.BUCKET);
      return jsonResponse({ success: true, ...result });
    } catch (err: any) {
      return errorResponse(err.message || 'Lỗi nhập danh mục media đã duyệt', 400);
    }
  }

  // 7. Tải lên tệp Media: POST /api/media/upload
  if (path === '/api/media/upload' && method === 'POST') {
    validateCsrf(request);
    assertCanEdit(user.role);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const alt = (formData.get('alt') as string || '').trim();
    const caption = (formData.get('caption') as string || '').trim();
    const creditName = (formData.get('creditName') as string || '').trim();
    const creditUrl = (formData.get('creditUrl') as string || '').trim();
    const source = (formData.get('source') as string || '').trim();
    const isIllustration = formData.get('isIllustration') === 'true';

    if (!file) {
      return errorResponse('Thiếu tệp tin tải lên (file).', 400);
    }

    if (!alt) {
      return errorResponse('Mô tả hình ảnh (alt) là bắt buộc cho khả năng tiếp cận.', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (bytes.length > MAX_FILE_SIZE_BYTES) {
      return errorResponse('Kích thước tệp vượt quá giới hạn cho phép (tối đa 5MB).', 400);
    }

    const processed = decodeAndSanitizeRaster(bytes);
    if (!processed.success || !processed.sanitizedBytes || !processed.contentType || !processed.extension) {
      return errorResponse(processed.error || 'Tệp ảnh không hợp lệ hoặc bị từ chối.', 400);
    }

    const assetId = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const r2Key = `media/${assetId}.${processed.extension}`;

    // Lưu vào R2 (chỉ lưu các byte ảnh đã được giải mã và mã hóa lại sạch sẽ)
    if (env.BUCKET) {
      await env.BUCKET.put(r2Key, processed.sanitizedBytes, {
        httpMetadata: { contentType: processed.contentType },
        customMetadata: { alt, uploadedBy: user.email },
      });
    }

    const assetRecord: MediaAssetRecord = {
      id: assetId,
      filename: file.name,
      contentType: processed.contentType,
      sizeBytes: processed.sanitizedBytes.length,
      r2Key,
      status: 'pending',
      alt,
      caption: caption || undefined,
      creditName: creditName || undefined,
      creditUrl: creditUrl || undefined,
      source: source || undefined,
      isIllustration,
      focalX: 50,
      focalY: 50,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
    };

    await dbClient.saveMediaAsset(assetRecord);
    await dbClient.recordAuditLog(user.email, 'UPLOAD_MEDIA', 'media', {
      assetId,
      filename: file.name,
      r2Key,
      sizeBytes: bytes.length,
      status: 'pending',
    });

    return jsonResponse({ asset: assetRecord, success: true }, 201);
  }

  // 8. Duyệt / Từ chối tệp Media: POST /api/media/:id/review
  const reviewMediaMatch = path.match(/^\/api\/media\/([^/]+)\/review$/);
  if (reviewMediaMatch && method === 'POST') {
    validateCsrf(request);
    assertCanReview(user.role);

    const assetId = reviewMediaMatch[1];
    const body = (await request.json().catch(() => ({}))) as { action: 'approve' | 'reject' };

    if (!['approve', 'reject'].includes(body.action)) {
      return errorResponse('Hành động duyệt (action) phải là "approve" hoặc "reject".', 400);
    }

    const newStatus = body.action === 'approve' ? 'approved' : 'rejected';
    await dbClient.updateMediaAssetStatus(assetId, newStatus);
    await dbClient.recordAuditLog(user.email, 'REVIEW_MEDIA', 'media', { assetId, status: newStatus });

    return jsonResponse({ success: true, assetId, status: newStatus });
  }

  // 9. Xóa Media Asset: DELETE /api/media/:id
  const deleteMediaMatch = path.match(/^\/api\/media\/([^/]+)$/);
  if (deleteMediaMatch && method === 'DELETE') {
    validateCsrf(request);
    assertCanEdit(user.role);

    const assetId = deleteMediaMatch[1];
    const usage = await dbClient.checkAssetUsageAcrossSystem(assetId);

    if (usage.inUse) {
      return errorResponse(
        `Không thể xóa ảnh vì đang được tham chiếu sử dụng trong: ${usage.usedIn.join(', ')}.`,
        400,
        { inUse: true, usedIn: usage.usedIn }
      );
    }

    await dbClient.deleteMediaAsset(assetId);
    await dbClient.recordAuditLog(user.email, 'DELETE_MEDIA', 'media', { assetId });

    return jsonResponse({ success: true, deletedId: assetId });
  }

  // 9. Nhật ký kiểm toán: GET /api/audit-logs
  if (path === '/api/audit-logs' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const logs = await dbClient.listAuditLogs(limit);
    return jsonResponse({ logs, success: true });
  }

  // 10. Danh sách yêu cầu xuất bản: GET /api/publications
  if (path === '/api/publications' && method === 'GET') {
    const publications = await dbClient.listPublications(20);
    return jsonResponse({ publications, success: true });
  }

  // 11. Tạo yêu cầu xuất bản: POST /api/publications/request
  if (path === '/api/publications/request' && method === 'POST') {
    validateCsrf(request);
    assertCanPublish(user.role);

    const body = (await request.json().catch(() => ({}))) as { idempotencyKey?: string };
    const allDrafts = await dbClient.getAllDrafts();
    const dbAssets = await dbClient.listMediaAssets(500);
    const approvedKeys = new Set<string>();
    for (const reg of APPROVED_MEDIA_REGISTRY) {
      approvedKeys.add(reg.publicPath);
      approvedKeys.add(reg.r2Key);
      approvedKeys.add(reg.id);
      approvedKeys.add(`/media/${reg.id}`);
    }
    for (const a of dbAssets) {
      if (a.status === 'approved') {
        approvedKeys.add(a.r2Key);
        approvedKeys.add(a.id);
        approvedKeys.add(`/media/${a.id}`);
        const reg = APPROVED_MEDIA_REGISTRY.find((r) => r.id === a.id || r.r2Key === a.r2Key);
        if (reg) {
          approvedKeys.add(reg.publicPath);
        }
      }
    }
    const snapshotResult = await createPublicationSnapshot(allDrafts, `v${Date.now()}`, approvedKeys);

    if (!snapshotResult.isEligibleForPublish) {
      return errorResponse(
        'Không thể tạo yêu cầu xuất bản do có lỗi dữ liệu trong một hoặc nhiều phân hệ.',
        400,
        { validationErrors: snapshotResult.validationErrors }
      );
    }

    const pub = await dbClient.createPublicationRequest(
      snapshotResult.snapshot,
      user.email,
      body.idempotencyKey
    );

    return jsonResponse({ publication: pub, success: true }, 201);
  }

  // 12. Duyệt yêu cầu xuất bản (Four-Eyes Principle): POST /api/publications/:id/review
  const reviewMatch = path.match(/^\/api\/publications\/([^/]+)\/review$/);
  if (reviewMatch && method === 'POST') {
    validateCsrf(request);
    assertCanReview(user.role);

    const pubId = reviewMatch[1];
    const body = (await request.json()) as { action: 'approve' | 'reject'; comment?: string };

    if (!['approve', 'reject'].includes(body.action)) {
      return errorResponse('Hành động duyệt (action) phải là "approve" hoặc "reject".', 400);
    }

    try {
      const updatedPub = await dbClient.reviewPublication(
        pubId,
        user.email,
        body.action,
        body.comment
      );
      return jsonResponse({ publication: updatedPub, success: true });
    } catch (err: any) {
      return errorResponse(err.message || 'Lỗi thẩm định yêu cầu xuất bản.', 400);
    }
  }

  // 13. Đối soát tệp CSV tài chính: POST /api/finance/import-csv
  if (path === '/api/finance/import-csv' && method === 'POST') {
    validateCsrf(request);
    assertCanEdit(user.role);

    const formData = await request.formData();
    const csvFile = formData.get('file') as File | null;
    const reconciledAt = formData.get('reconciledAt') as string | null;

    if (!csvFile) {
      return errorResponse('Thiếu tệp CSV tải lên.', 400);
    }

    const csvText = await csvFile.text();
    const valResult = validateDonationCSV(csvText, {
      reconciledAt: reconciledAt || undefined,
      requireReconciledDate: Boolean(reconciledAt),
    });

    if (!valResult.isValid) {
      return errorResponse('Tệp CSV chứa lỗi cấu trúc hoặc dữ liệu không hợp lệ.', 400, {
        errors: valResult.errors,
        warnings: valResult.warnings,
      });
    }

    return jsonResponse({
      success: true,
      rows: valResult.rows,
      stats: valResult.stats,
    });
  }

  // 13b. Áp dụng các dòng CSV đã kiểm thực vào bản nháp tài chính: POST /api/finance/apply-csv
  if (path === '/api/finance/apply-csv' && method === 'POST') {
    validateCsrf(request);
    assertCanEdit(user.role);

    const body = (await request.json().catch(() => ({}))) as {
      rows?: DonationEntry[];
      reconciledAt?: string;
      expectedHash?: string;
    };

    if (!body.expectedHash || typeof body.expectedHash !== 'string' || !body.expectedHash.trim()) {
      return errorResponse('Bắt buộc phải cung cấp mã băm phiên bản (expectedHash) để chống ghi đè khi áp dụng CSV.', 400);
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return errorResponse('Thiếu danh sách giao dịch rows hoặc mảng giao dịch rỗng.', 400);
    }

    const rowErrors: string[] = [];
    for (let i = 0; i < body.rows.length; i++) {
      const e = body.rows[i];
      if (!e || typeof e !== 'object') {
        rowErrors.push(`Dòng ${i + 1} không phải là đối tượng.`);
        continue;
      }
      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || isNaN(Date.parse(e.date))) {
        rowErrors.push(`Dòng ${i + 1} có ngày không hợp lệ (${e.date}).`);
      }
      if (typeof e.amount !== 'number' || e.amount <= 0 || !Number.isInteger(e.amount)) {
        rowErrors.push(`Dòng ${i + 1} có số tiền không hợp lệ (${e.amount}).`);
      }
      if (typeof e.donor !== 'string' || !e.donor.trim()) {
        rowErrors.push(`Dòng ${i + 1} thiếu người ủng hộ (donor).`);
      }
    }

    if (rowErrors.length > 0) {
      return errorResponse(`Dữ liệu dòng giao dịch không hợp lệ: ${rowErrors.join('; ')}`, 400, { rowErrors });
    }

    const currentFinance = await dbClient.getDraft<FinanceModuleData>('finance');
    if (!currentFinance) {
      return errorResponse('Chưa tìm thấy bản nháp phân hệ tài chính.', 404);
    }

    const currentHash = body.expectedHash.trim();
    const updatedData: FinanceModuleData = {
      ...currentFinance.data,
      entries: body.rows,
      reconciled: false,
      publicApproval: 'pending',
      reconciledAt: null,
      reconciledBy: [],
      firstSigner: null,
      secondSigner: null,
    };

    try {
      const saveResult = await dbClient.saveDraft(
        'finance',
        updatedData,
        currentHash,
        user.email,
        `Áp dụng sổ sao kê từ CSV (${body.rows.length} dòng)`
      );

      return jsonResponse({
        success: true,
        draft: saveResult.draft,
        message: `Đã áp dụng thành công ${body.rows.length} dòng sao kê. Trạng thái: Chờ ký xác thực 2 người.`,
      });
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError) {
        return errorResponse(err.message, 409, { conflict: true, currentHash: err.currentHash });
      }
      return errorResponse(err.message || 'Lỗi lưu bản nháp.', 500);
    }
  }

  // 13c. Xác thực 2 người cho tài chính (Two-Person Attestation): POST /api/finance/attest hoặc POST /api/finance/sign
  if ((path === '/api/finance/attest' || path === '/api/finance/sign') && method === 'POST') {
    validateCsrf(request);

    const body = (await request.json().catch(() => ({}))) as { expectedHash?: string };
    if (!body.expectedHash || typeof body.expectedHash !== 'string' || !body.expectedHash.trim()) {
      return errorResponse('Bắt buộc phải cung cấp mã băm phiên bản (expectedHash) để chống xung đột.', 400);
    }

    const currentFin = await dbClient.getDraft<FinanceModuleData>('finance');
    if (!currentFin) {
      return errorResponse('Chưa tìm thấy bản nháp phân hệ tài chính.', 404);
    }

    try {
      if (currentFin.data.firstSigner) {
        // Đã có người ký 1 -> Bước 2 yêu cầu quyền phê duyệt độc lập (reviewer hoặc admin)
        assertCanReview(user.role);
      } else {
        // Bước 1 yêu cầu quyền lập số liệu / biên tập (editor hoặc admin)
        assertCanEdit(user.role);
      }

      const attestResult = await dbClient.attestFinanceDraft(
        user.email,
        user.role,
        body.expectedHash.trim()
      );
      return jsonResponse({
        success: true,
        draft: attestResult.draft,
        status: attestResult.status,
        message: attestResult.message,
      });
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError) {
        return errorResponse(err.message, 409, {
          conflict: true,
          currentHash: err.currentHash,
        });
      }
      return errorResponse(err.message || 'Lỗi khi ký xác nhận tài chính.', 400);
    }
  }

  // 14. Trích xuất Bản chụp đã duyệt: POST /api/publications/:id/export
  const exportMatch = path.match(/^\/api\/publications\/([^/]+)\/export$/);
  if (exportMatch && method === 'POST') {
    validateCsrf(request);
    assertCanPublish(user.role);

    const pubId = exportMatch[1];
    const pub = await dbClient.getPublication(pubId);
    if (!pub) {
      return errorResponse('Không tìm thấy yêu cầu xuất bản.', 404);
    }

    if (pub.status !== 'approved') {
      return errorResponse(`Yêu cầu xuất bản chưa được phê duyệt (trạng thái: ${pub.status}). Chỉ có thể xuất bản bản chụp đã được duyệt.`, 400);
    }

    await dbClient.recordAuditLog(user.email, 'EXPORT_SNAPSHOT', 'system', {
      pubId,
      snapshotHash: pub.snapshot.sha256,
    });

    return jsonResponse({
      success: true,
      pubId,
      snapshotHash: pub.snapshot.sha256,
      exportedFiles: {
        'published-snapshot.json': pub.snapshot,
        'journal-entries.json': pub.snapshot.modules?.journal || [],
        'product-sales-config.json': pub.snapshot.modules?.products || {},
      },
    });
  }

  // 15. Tạo Pull Request GitHub hoặc kích hoạt triển khai: POST /api/publications/:id/publish-git
  const publishGitMatch = path.match(/^\/api\/publications\/([^/]+)\/publish-git$/);
  if (publishGitMatch && method === 'POST') {
    validateCsrf(request);
    assertCanPublish(user.role);

    const pubId = publishGitMatch[1];
    const pub = await dbClient.getPublication(pubId);
    if (!pub) {
      return errorResponse('Không tìm thấy yêu cầu xuất bản.', 404);
    }

    if (pub.status !== 'approved') {
      return errorResponse(`Yêu cầu xuất bản chưa được phê duyệt (trạng thái: ${pub.status}). Chỉ có thể xuất bản lên GitHub khi đã được duyệt.`, 400);
    }

    const body = (await request.json().catch(() => ({}))) as { options?: any };
    const gitResult = await triggerGitHubPublication(pub, env, body.options);
    if (!gitResult.success) {
      const statusCode = gitResult.errorCode === 'not_configured' ? 503 : gitResult.errorCode === 'conflicting_branch' ? 409 : 500;
      return errorResponse(`Lỗi tích hợp GitHub: ${gitResult.error || gitResult.message}`, statusCode, {
        gitResult,
      });
    }

    // Cập nhật git_ref trong D1
    await dbClient.updatePublicationDeployStatus(pubId, 'building', gitResult.branchName);

    await dbClient.recordAuditLog(user.email, 'TRIGGER_GIT_PUBLISH', 'system', {
      pubId,
      branchName: gitResult.branchName,
      commitSha: gitResult.commitSha,
      prUrl: gitResult.prUrl,
      isSimulated: gitResult.isSimulated,
    });

    return jsonResponse({ success: true, gitResult });
  }

  // 15b. Xác thực Triển khai Live Thực tế: POST /api/publications/:id/verify-deploy
  const verifyDeployMatch = path.match(/^\/api\/publications\/([^/]+)\/verify-deploy$/);
  if (verifyDeployMatch && method === 'POST') {
    validateCsrf(request);
    assertCanPublish(user.role);

    const pubId = verifyDeployMatch[1];
    const pub = await dbClient.getPublication(pubId);
    if (!pub) {
      return errorResponse('Không tìm thấy yêu cầu xuất bản.', 404);
    }

    const body = (await request.json().catch(() => ({}))) as { options?: any };
    const verifyResult = await verifyLiveDeployment(pub, env, body.options);

    if (verifyResult.verified) {
      await dbClient.updatePublicationDeployStatus(
        pubId,
        'success',
        verifyResult.deployedCommitSha || pub.gitRef || undefined,
        undefined,
        verifyResult.verifiedAt
      );
      await dbClient.recordAuditLog(user.email, 'VERIFY_DEPLOYMENT_SUCCESS', 'publish', {
        pubId,
        deployedSha256: verifyResult.deployedSha256,
        deployedCommitSha: verifyResult.deployedCommitSha,
      });
    } else {
      await dbClient.updatePublicationDeployStatus(
        pubId,
        verifyResult.deployStatus as any,
        undefined,
        verifyResult.message
      );
      await dbClient.recordAuditLog(user.email, 'VERIFY_DEPLOYMENT_FAILED', 'publish', {
        pubId,
        deployStatus: verifyResult.deployStatus,
        message: verifyResult.message,
      });
    }

    return jsonResponse({ success: true, verifyResult });
  }

  // 15c. Webhook tiếp nhận thông báo triển khai từ máy chủ CI/CD: POST /api/publications/webhook/deployment
  if (path === '/api/publications/webhook/deployment' && method === 'POST') {
    const isWebhookAuthorized = verifyDeploymentWebhookSecret(request, env.DEPLOYMENT_WEBHOOK_SECRET);
    if (!isWebhookAuthorized) {
      return errorResponse('Truy cập bị từ chối: Webhook secret không hợp lệ hoặc thiếu cấu hình.', 401);
    }

    const body = (await request.json().catch(() => null)) as any;
    if (!body || typeof body !== 'object' || !body.publicationId) {
      return errorResponse('Dữ liệu webhook thiếu publicationId.', 400);
    }

    const pubId = String(body.publicationId);
    const pub = await dbClient.getPublication(pubId);
    if (!pub) {
      return errorResponse(`Không tìm thấy yêu cầu xuất bản '${pubId}'.`, 404);
    }

    const webhookSha = String(body.snapshotSha256 || '').trim().toLowerCase();
    const expectedSha = pub.snapshot.sha256.trim().toLowerCase();

    if (webhookSha !== expectedSha) {
      await dbClient.updatePublicationDeployStatus(
        pubId,
        'mismatch',
        undefined,
        `Mã băm trong webhook không khớp: '${webhookSha.slice(0, 8)}' !== '${expectedSha.slice(0, 8)}'.`
      );
      return errorResponse('Mã SHA-256 của bản chụp không khớp với yêu cầu xuất bản.', 400, {
        expectedSha,
        providedSha: webhookSha,
      });
    }

    const now = new Date().toISOString();
    await dbClient.updatePublicationDeployStatus(
      pubId,
      'success',
      body.commitSha || pub.gitRef || undefined,
      undefined,
      now
    );

    await dbClient.recordAuditLog('webhook@deployment.system', 'WEBHOOK_DEPLOYMENT_VERIFIED', 'publish', {
      pubId,
      snapshotSha256: webhookSha,
      commitSha: body.commitSha,
    });

    return jsonResponse({
      success: true,
      message: 'Ghi nhận triển khai thành công qua webhook.',
      pubId,
      verifiedAt: now,
    });
  }

  // 16. Quản lý người dùng: GET /api/users
  if (path === '/api/users' && method === 'GET') {
    assertCanManageUsers(user.role);
    const users = await dbClient.listUsers();
    return jsonResponse({ users, success: true });
  }

  // 17. Cập nhật vai trò người dùng: POST /api/users/:email/role
  const userRoleMatch = path.match(/^\/api\/users\/([^/]+)\/role$/);
  if (userRoleMatch && method === 'POST') {
    validateCsrf(request);
    assertCanManageUsers(user.role);
    const targetEmail = decodeURIComponent(userRoleMatch[1]);
    const body = (await request.json()) as { role: UserRole };
    const validRoles: UserRole[] = ['admin', 'editor', 'reviewer'];
    if (!body || !validRoles.includes(body.role)) {
      return errorResponse(`Vai trò '${body?.role}' không hợp lệ. Cho phép: ${validRoles.join(', ')}`, 400);
    }
    await dbClient.updateUserRole(targetEmail, body.role);
    await dbClient.recordAuditLog(user.email, 'UPDATE_USER_ROLE', 'system', {
      targetEmail,
      newRole: body.role,
    });
    return jsonResponse({ success: true, email: targetEmail, role: body.role });
  }

  return errorResponse('API endpoint không tồn tại.', 404);
}
