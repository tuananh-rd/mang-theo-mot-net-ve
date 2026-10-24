// Tạo (và kiểm thử cục bộ) gói SQL D1 cho P1: project v7, products v3, media_assets, publication snapshot mới.
// Đọc trạng thái trước từ bản sao lưu SQL (ngoài Git), áp dụng gói vào emulator để kiểm thử, rồi ghi file SQL đã bảo vệ bằng điều kiện hash (CAS).
// Chạy: node docs/evidence/P1-release/worker/plan-d1.mjs <backup.sql> <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [backupPath, outDir] = process.argv.slice(2);
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');

const ACTOR = 'claude-release@internal';
const NOTE = 'P1 release 24/10/2026: chu du an cho phep (stage 2 + anh moc khoa); Codex preflight review';
const ASSET = {
  id: 'asset-moc-khoa-mau-chu-du-an', filename: 'moc-khoa-mau-chu-du-an.webp', contentType: 'image/webp', sizeBytes: 25214,
  r2Key: 'media/images/san-pham/moc-khoa-mau-chu-du-an.webp', status: 'approved',
  alt: 'Một bàn tay cầm móc khóa hình chữ nhật in tranh nền xanh, kèm vòng khóa và dây xích; ảnh do chủ dự án cung cấp.',
  caption: 'Ảnh mẫu móc khóa do chủ dự án cung cấp; mẫu thực tế có thể khác.', source: '', isIllustration: 0, focalX: 50, focalY: 50,
};
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

const schema = fs.readFileSync(backupPath, 'utf8');
const db = new LocalD1Database(':memory:', schema);
const one = (sql, ...b) => db.prepare(sql).bind(...b).first();
const all = async (sql, ...b) => (await db.prepare(sql).bind(...b).all()).results;

const drafts = {};
const draftRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
for (const r of draftRows) drafts[r.module_key] = { data: JSON.parse(r.data_json), hash: r.revision_hash, json: r.data_json };
const before = { projectHash: drafts.project.hash, productsHash: drafts.products.hash };
// Điều kiện tiên quyết đã biết từ preflight
if (!drafts.project.hash.startsWith('d3701007c713')) throw new Error('project draft khác kỳ vọng');
if (!drafts.products.hash.startsWith('1d719cbc3cda')) throw new Error('products draft khác kỳ vọng');
for (const key of ['project', 'products']) {
  const recomputed = await calculateDataHash(drafts[key].data);
  if (recomputed !== drafts[key].hash) throw new Error(`${key}: hash lưu ≠ hash tính lại (cần xem lại thuật toán)`);
}

// --- Dữ liệu mới: chỉ đổi đúng các trường được phép ---
const project = structuredClone(drafts.project.data);
const oldProject = { statusNotice: project.statusNotice, stage: project.progress.currentStageIndex, updatedAt: project.progress.updatedAt, week: project.progress.currentWeek, total: project.progress.totalWeeks };
project.statusNotice = 'CHẶNG 2 — Gây quỹ';
project.progress.currentStageIndex = 1;
const products = structuredClone(drafts.products.data);
const oldMedia = products['moc-khoa'].mediaKey;
products['moc-khoa'].mediaKey = ASSET.r2Key;

// diff phạm vi
const diffPaths = (a, b, p = '') => {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object') return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((k) => diffPaths(a[k], b[k], `${p}/${k}`));
  return [p];
};
const scope = { project: diffPaths(drafts.project.data, project), products: diffPaths(drafts.products.data, products) };
if (scope.project.sort().join() !== '/progress/currentStageIndex,/statusNotice' || scope.products.join() !== '/moc-khoa/mediaKey') throw new Error('phạm vi diff vượt mức cho phép: ' + JSON.stringify(scope));

const projectJson = JSON.stringify(project), productsJson = JSON.stringify(products);
const newProjectHash = await calculateDataHash(project), newProductsHash = await calculateDataHash(products);
const now = new Date().toISOString();
const ver = async (key) => ((await one('SELECT MAX(version) v FROM revisions WHERE module_key = ?', key)).v ?? 0) + 1;
const projectVer = await ver('project'), productsVer = await ver('products');
const stamp = Date.now();

// --- Bản chụp xuất bản mới từ các bản nháp hiện tại (đã áp dụng thay đổi) ---
const nextDrafts = {};
for (const [k, v] of Object.entries(drafts)) nextDrafts[k] = v.data;
nextDrafts.project = project; nextDrafts.products = products;
const approvedKeys = new Set();
for (const reg of APPROVED_MEDIA_REGISTRY) { approvedKeys.add(reg.publicPath); approvedKeys.add(reg.r2Key); approvedKeys.add(reg.id); approvedKeys.add(`/media/${reg.id}`); }
const assets = await all("SELECT id, r2_key FROM media_assets WHERE status = 'approved'");
for (const a of [...assets, { id: ASSET.id, r2_key: ASSET.r2Key }]) {
  approvedKeys.add(a.r2_key); approvedKeys.add(a.id); approvedKeys.add(`/media/${a.id}`);
  const reg = APPROVED_MEDIA_REGISTRY.find((r) => r.id === a.id || r.r2Key === a.r2_key);
  if (reg) approvedKeys.add(reg.publicPath);
}
const snap = await createPublicationSnapshot(nextDrafts, `v${stamp}`, approvedKeys);
if (!snap.isEligibleForPublish) throw new Error('snapshot không hợp lệ: ' + JSON.stringify(snap.validationErrors));
const snapshotJson = JSON.stringify(snap.snapshot);
const pubId = `pub-${stamp}-p1r1`;
const idemKey = `p1-release-${newProjectHash.slice(0, 12)}-${newProductsHash.slice(0, 12)}`;

const pending = await all("SELECT id FROM publications WHERE status = 'pending_review'");
const drafted = await all("SELECT id FROM publications WHERE status = 'draft'");
if (pending.length !== 1 || drafted.length !== 1) throw new Error('trạng thái publications khác kỳ vọng ' + JSON.stringify({ pending, drafted }));
const SUPERSEDED = 'Thay thế bởi bản phát hành P1 24/10/2026 (chặng 2 và ảnh móc khóa); snapshot cũ giữ nguyên, không được công bố.';

const sqlParts = [];
const guardProject = `(SELECT revision_hash FROM drafts WHERE module_key = 'project') = ${q(newProjectHash)}`;
const guardProducts = `(SELECT revision_hash FROM drafts WHERE module_key = 'products') = ${q(newProductsHash)}`;
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

// 1) media_assets (tệp R2 đã tải và kiểm sha256 trước đó)
sqlParts.push(`INSERT INTO media_assets (id, filename, content_type, size_bytes, r2_key, status, alt, caption, credit_name, credit_url, source, is_illustration, focal_x, focal_y, created_by, created_at) SELECT ${q(ASSET.id)}, ${q(ASSET.filename)}, ${q(ASSET.contentType)}, ${ASSET.sizeBytes}, ${q(ASSET.r2Key)}, 'approved', ${q(ASSET.alt)}, ${q(ASSET.caption)}, NULL, NULL, ${q(ASSET.source)}, 0, 50, 50, ${q(ACTOR)}, ${q(now)} WHERE NOT EXISTS (SELECT 1 FROM media_assets WHERE id = ${q(ASSET.id)} OR r2_key = ${q(ASSET.r2Key)});`);
sqlParts.push(audit(`aud-${stamp}-media`, 'UPLOAD_MEDIA', 'media', { assetId: ASSET.id, r2Key: ASSET.r2Key, sha256: 'bcd18df918f976e6ec805351399712e544204d5214e677532bdf69e05f91a2d1', note: NOTE }) + ` EXISTS (SELECT 1 FROM media_assets WHERE id = ${q(ASSET.id)} AND created_by = ${q(ACTOR)});`);
// 2) project v7 (CAS trên hash bản nháp hiện tại)
sqlParts.push(`UPDATE drafts SET data_json = ${q(projectJson)}, revision_hash = ${q(newProjectHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'project' AND revision_hash = ${q(before.projectHash)};`);
sqlParts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-project-${projectVer}-${stamp}`)}, 'project', ${projectVer}, ${q(projectJson)}, ${q(newProjectHash)}, ${q(ACTOR)}, ${q(now)}, ${q('Chặng 2 — Gây quỹ theo xác nhận của chủ dự án (P1 release); giữ tuần 2/5 và updatedAt')} WHERE ${guardProject} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'project' AND version = ${projectVer});`);
sqlParts.push(audit(`aud-${stamp}-project`, 'SAVE_DRAFT', 'project', { version: projectVer, revisionHash: newProjectHash, comment: NOTE }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'project' AND version = ${projectVer} AND revision_hash = ${q(newProjectHash)});`);
// 3) products v3
sqlParts.push(`UPDATE drafts SET data_json = ${q(productsJson)}, revision_hash = ${q(newProductsHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'products' AND revision_hash = ${q(before.productsHash)} AND EXISTS (SELECT 1 FROM media_assets WHERE r2_key = ${q(ASSET.r2Key)} AND status = 'approved');`);
sqlParts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-products-${productsVer}-${stamp}`)}, 'products', ${productsVer}, ${q(productsJson)}, ${q(newProductsHash)}, ${q(ACTOR)}, ${q(now)}, ${q('Gắn ảnh móc khóa của chủ dự án cho sản phẩm móc khóa (P1 release); không đổi giá/trạng thái')} WHERE ${guardProducts} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'products' AND version = ${productsVer});`);
sqlParts.push(audit(`aud-${stamp}-products`, 'SAVE_DRAFT', 'products', { version: productsVer, revisionHash: newProductsHash, comment: NOTE }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'products' AND version = ${productsVer} AND revision_hash = ${q(newProductsHash)});`);
// 4) publications: từ chối bản pending_review cũ (REJECT_PUBLICATION) và ghi chú bản draft cũ; không sửa snapshot_json
sqlParts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(pending[0].id)} AND status = 'pending_review' AND ${guardProject} AND ${guardProducts};`);
sqlParts.push(audit(`aud-${stamp}-rejpub`, 'REJECT_PUBLICATION', 'publish', { publicationId: pending[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pending[0].id)} AND error_message = ${q(SUPERSEDED)});`);
sqlParts.push(`UPDATE publications SET error_message = ${q(SUPERSEDED)} WHERE id = ${q(drafted[0].id)} AND status = 'draft' AND error_message IS NULL AND ${guardProject} AND ${guardProducts};`);
// 5) publication mới pending_review (không duyệt/không công bố)
sqlParts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(snapshotJson)}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guardProject} AND ${guardProducts} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
sqlParts.push(audit(`aud-${stamp}-reqpub`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);

const sql = sqlParts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'p1-release-d1.sql'), sql);

// --- Kiểm thử cục bộ: áp dụng lên emulator đã nạp bản sao lưu ---
const counts = async () => ({ revisions: (await one('SELECT COUNT(*) c FROM revisions')).c, publications: (await one('SELECT COUNT(*) c FROM publications')).c, audit: (await one('SELECT COUNT(*) c FROM audit_logs')).c, media: (await one('SELECT COUNT(*) c FROM media_assets')).c, preorders: (await one('SELECT COUNT(*) c FROM preorders')).c, users: (await one('SELECT COUNT(*) c FROM users')).c });
const c0 = await counts();
await db.exec(sql);
const c1 = await counts();
const post = {
  projectDraft: (await one("SELECT revision_hash h FROM drafts WHERE module_key='project'")).h,
  productsDraft: (await one("SELECT revision_hash h FROM drafts WHERE module_key='products'")).h,
  pubs: await all('SELECT id, status, error_message FROM publications ORDER BY created_at'),
};
const result = {
  generatedAt: now, actor: ACTOR, scope, old: { ...oldProject, mediaKey: oldMedia }, new: { statusNotice: project.statusNotice, stage: 1, mediaKey: ASSET.r2Key },
  before: { ...before, counts: c0 }, expected: { projectHash: newProjectHash, productsHash: newProductsHash, projectVer, productsVer, publicationId: pubId, snapshotSha256: snap.snapshot.sha256 },
  localAfter: { counts: c1, ...post },
  localCheck: post.projectDraft === newProjectHash && post.productsDraft === newProductsHash && c1.revisions === c0.revisions + 2 && c1.media === c0.media + 1 && c1.publications === c0.publications + 1 && c1.audit === c0.audit + 5 && c1.preorders === c0.preorders && c1.users === c0.users,
  sqlSha256: (await import('node:crypto')).createHash('sha256').update(sql).digest('hex'), sqlBytes: sql.length,
};
fs.writeFileSync(path.join(outDir, 'p1-release-d1-plan.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ scope, expected: result.expected, c0, c1, localCheck: result.localCheck, pubs: post.pubs.map((p) => p.id + ':' + p.status), sqlBytes: sql.length }, null, 1));
