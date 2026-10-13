#!/usr/bin/env node
/**
 * Công cụ Khởi tạo và Nạp dữ liệu Cơ sở cho Production D1 (Production Bootstrap & Seed Tool) - Task C17-R2-F3
 * Khởi tạo bảng D1, phân quyền quản trị viên ban đầu và nạp dữ liệu chuẩn tắc (Canonical Defaults).
 * Tuân thủ nguyên tắc:
 * - Không sao chép cơ sở dữ liệu kiểm thử cục bộ hay tài khoản giả mạo (No Synthetic Data).
 * - Sử dụng nguồn chuẩn tắc: getDefaultModuleData và APPROVED_MEDIA_REGISTRY.
 * - Hỗ trợ chế độ --dry-run an toàn để duyệt trước toàn bộ câu lệnh SQL trước khi kích hoạt.
 * - Email quản trị và người duyệt lấy từ tham số truyền vào hoặc biến môi trường riêng.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

function computeRevisionHash(data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Tạo toàn bộ kịch bản SQL khởi tạo cho Production
 */
export async function generateProductionBootstrapSql(options = {}) {
  const adminEmail = (options.adminEmail || process.env.STUDIO_ADMIN_EMAIL || '').trim().toLowerCase();
  const reviewerEmail = (options.reviewerEmail || process.env.STUDIO_REVIEWER_EMAIL || '').trim().toLowerCase();

  // 1. Đọc Schema D1 chính thức
  const schemaPath = path.resolve(ROOT_DIR, 'apps/studio/src/db/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Không tìm thấy tệp schema D1 tại: ${schemaPath}`);
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // 2. Nạp dữ liệu chuẩn tắc (Canonical Defaults) từ build dist
  const defaultsModule = await import(pathToFileURL(path.resolve(ROOT_DIR, 'apps/studio/dist/schemas/index.js')).href);
  const mediaModule = await import(pathToFileURL(path.resolve(ROOT_DIR, 'apps/studio/dist/storage/media-registry.js')).href);

  const getDefaultModuleData = defaultsModule.getDefaultModuleData;
  const APPROVED_MEDIA_REGISTRY = mediaModule.APPROVED_MEDIA_REGISTRY;

  const now = new Date().toISOString();
  const sqlStatements = [];

  // Schema DDL
  sqlStatements.push('-- === BƯỚC 1: KHỞI TẠO CẤU TRÚC BẢNG (SCHEMA DDL) ===');
  sqlStatements.push(schemaSql.trim());

  // Người dùng ban đầu (RBAC)
  sqlStatements.push('\n-- === BƯỚC 2: KHỞI TẠO NGƯỜI DÙNG QUẢN TRỊ VÀ DUYỆT (RBAC) ===');
  if (adminEmail) {
    const adminId = `usr-admin-${createHash('sha256').update(adminEmail).digest('hex').slice(0, 8)}`;
    sqlStatements.push(
      `INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at) VALUES ('${adminId}', '${adminEmail}', 'admin', '${now}', '${now}');`
    );
  }
  if (reviewerEmail && reviewerEmail !== adminEmail) {
    const reviewerId = `usr-rev-${createHash('sha256').update(reviewerEmail).digest('hex').slice(0, 8)}`;
    sqlStatements.push(
      `INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at) VALUES ('${reviewerId}', '${reviewerEmail}', 'reviewer', '${now}', '${now}');`
    );
  }

  // Khởi tạo bản nháp 5 phân hệ chuẩn tắc
  sqlStatements.push('\n-- === BƯỚC 3: KHỞI TẠO BẢN NHÁP VÀ PHIÊN BẢN CƠ SỞ (CANONICAL DRAFTS & REVISIONS) ===');
  const modules = ['project', 'journal', 'products', 'finance', 'team'];

  for (const modKey of modules) {
    const data = getDefaultModuleData(modKey);
    const dataJson = JSON.stringify(data);
    const escapedJson = dataJson.replace(/'/g, "''");
    const revHash = computeRevisionHash(data);
    const creator = adminEmail || 'system-bootstrap@internal';

    // Insert draft
    sqlStatements.push(
      `INSERT OR IGNORE INTO drafts (module_key, data_json, revision_hash, updated_by, updated_at) VALUES ('${modKey}', '${escapedJson}', '${revHash}', '${creator}', '${now}');`
    );

    // Insert initial revision v1
    const revId = `rev-${modKey}-1-${Date.now()}`;
    sqlStatements.push(
      `INSERT OR IGNORE INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) VALUES ('${revId}', '${modKey}', 1, '${escapedJson}', '${revHash}', '${creator}', '${now}', 'Phiên bản khởi tạo từ nguồn chuẩn tắc (Bootstrap)');`
    );
  }

  // Khởi tạo Danh mục Media đã được phê duyệt
  sqlStatements.push('\n-- === BƯỚC 4: NẠP DANH MỤC MEDIA ĐÃ ĐƯỢC PHÊ DUYỆT (APPROVED MEDIA REGISTRY) ===');
  for (const asset of APPROVED_MEDIA_REGISTRY) {
    const escapedAlt = (asset.alt || '').replace(/'/g, "''");
    const escapedCaption = (asset.caption || '').replace(/'/g, "''");
    const escapedCredit = (asset.creditName || '').replace(/'/g, "''");
    const escapedSource = (asset.source || '').replace(/'/g, "''");
    const creator = adminEmail || 'system-bootstrap@internal';

    sqlStatements.push(
      `INSERT OR IGNORE INTO media_assets (id, filename, content_type, size_bytes, r2_key, status, alt, caption, credit_name, credit_url, source, is_illustration, focal_x, focal_y, created_by, created_at) VALUES ('${asset.id}', '${asset.filename}', '${asset.contentType}', ${asset.sizeBytes}, '${asset.r2Key}', 'approved', '${escapedAlt}', '${escapedCaption}', '${escapedCredit}', NULL, '${escapedSource}', ${asset.isIllustration ? 1 : 0}, ${asset.focalX || 50}, ${asset.focalY || 50}, '${creator}', '${now}');`
    );
  }

  return {
    sql: sqlStatements.join('\n'),
    adminConfigured: Boolean(adminEmail),
    reviewerConfigured: Boolean(reviewerEmail),
    modulesInitialized: modules.length,
    mediaAssetsInitialized: APPROVED_MEDIA_REGISTRY.length,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--execute');
  const adminIdx = args.indexOf('--admin-email');
  const adminEmail = adminIdx !== -1 ? args[adminIdx + 1] : process.env.STUDIO_ADMIN_EMAIL;
  const reviewerIdx = args.indexOf('--reviewer-email');
  const reviewerEmail = reviewerIdx !== -1 ? args[reviewerIdx + 1] : process.env.STUDIO_REVIEWER_EMAIL;

  console.log('=== KHỞI TẠO DỮ LIỆU CHUẨN TẮC CHO PRODUCTION D1 ===');
  const result = await generateProductionBootstrapSql({ adminEmail, reviewerEmail });

  console.log(`- Cấu hình Admin: ${result.adminConfigured ? adminEmail : '[CHƯA CẤU HÌNH]'}`);
  console.log(`- Cấu hình Reviewer: ${result.reviewerConfigured ? reviewerEmail : '[CHƯA CẤU HÌNH]'}`);
  console.log(`- Số phân hệ nạp bản nháp: ${result.modulesInitialized}`);
  console.log(`- Số tài sản media nạp: ${result.mediaAssetsInitialized}`);

  if (isDryRun) {
    console.log('\n[CHẾ ĐỘ DRY-RUN] Không thực thi ghi dữ liệu thực tế. Xuất kịch bản SQL an toàn.');
    const outPath = path.resolve(ROOT_DIR, 'tools/content-studio/bootstrap-preview.sql');
    fs.writeFileSync(outPath, result.sql, 'utf-8');
    console.log(`Kịch bản SQL đã được ghi vào: ${outPath} (${result.sql.length} ký tự).`);
  } else {
    console.log('\n[CHẾ ĐỘ THỰC THI] Yêu cầu kích hoạt qua lệnh wrangler D1 execute.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Lỗi khởi tạo bootstrap production:', err);
    process.exit(1);
  });
}
