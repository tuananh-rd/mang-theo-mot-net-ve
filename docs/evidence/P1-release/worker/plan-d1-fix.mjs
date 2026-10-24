// Bản vá khứ-khứ-an-toàn cho khóa media móc khóa (phát hiện ở review): UI chọn ảnh dùng '/' + r2_key, còn publication-request chỉ chấp nhận r2_key trần, id và '/media/<id>'.
// Chọn r2_key = 'media/<id>' (không đuôi) ⇒ '/' + r2_key = '/media/<id>' khớp cả lựa chọn trên UI lẫn khóa được duyệt; không cần triển khai lại Studio.
// Chạy: node docs/evidence/P1-release/worker/plan-d1-fix.mjs <backup.sql> <p1-release-d1.sql> <out-dir> [--db-file <studio.sqlite>]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const [backupPath, firstSqlPath, outDir] = args;
const dbFile = args.includes('--db-file') ? args[args.indexOf('--db-file') + 1] : ':memory:';
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');

const ACTOR = 'claude-release@internal';
const NOTE = 'P1 release 24/10/2026 (sua khoa media cho UI Studio, owner da cho phep; Codex review)';
const ASSET_ID = 'asset-moc-khoa-mau-chu-du-an';
const OLD_R2 = 'media/images/san-pham/moc-khoa-mau-chu-du-an.webp';
const NEW_R2 = `media/${ASSET_ID}`;
const NEW_KEY = `/media/${ASSET_ID}`;
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

if (fs.existsSync(dbFile) && dbFile !== ':memory:') fs.rmSync(dbFile);
const db = new LocalD1Database(dbFile, fs.readFileSync(backupPath, 'utf8'));
await db.exec(fs.readFileSync(firstSqlPath, 'utf8')); // tái tạo trạng thái production sau bản phát hành đầu
const one = (sql, ...b) => db.prepare(sql).bind(...b).first();
const all = async (sql, ...b) => (await db.prepare(sql).bind(...b).all()).results;

const draftRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const drafts = Object.fromEntries(draftRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
const beforeProductsHash = drafts.products.hash;
const beforeProjectHash = drafts.project.hash;
if (drafts.products.data['moc-khoa'].mediaKey !== OLD_R2) throw new Error('mediaKey hiện tại không như dự kiến');
if (!(await one('SELECT 1 x FROM media_assets WHERE id = ? AND r2_key = ?', ASSET_ID, OLD_R2))) throw new Error('media_assets không như dự kiến');

const products = structuredClone(drafts.products.data);
products['moc-khoa'].mediaKey = NEW_KEY;
const productsJson = JSON.stringify(products);
const newProductsHash = await calculateDataHash(products);
const now = new Date().toISOString();
const stamp = Date.now();
const productsVer = ((await one("SELECT MAX(version) v FROM revisions WHERE module_key = 'products'")).v) + 1;

// Snapshot mới (đã áp dụng sửa) — phải hợp lệ theo đúng bộ khóa được duyệt của router
const nextDrafts = Object.fromEntries(Object.entries(drafts).map(([k, v]) => [k, v.data]));
nextDrafts.products = products;
const approvedKeys = new Set();
for (const reg of APPROVED_MEDIA_REGISTRY) { approvedKeys.add(reg.publicPath); approvedKeys.add(reg.r2Key); approvedKeys.add(reg.id); approvedKeys.add(`/media/${reg.id}`); }
for (const a of await all("SELECT id, r2_key FROM media_assets WHERE status = 'approved'")) {
  const r2Key = a.id === ASSET_ID ? NEW_R2 : a.r2_key;
  approvedKeys.add(r2Key); approvedKeys.add(a.id); approvedKeys.add(`/media/${a.id}`);
  const reg = APPROVED_MEDIA_REGISTRY.find((r) => r.id === a.id || r.r2Key === r2Key);
  if (reg) approvedKeys.add(reg.publicPath);
}
const snap = await createPublicationSnapshot(nextDrafts, `v${stamp}`, approvedKeys);
if (!snap.isEligibleForPublish) throw new Error('snapshot không hợp lệ: ' + JSON.stringify(snap.validationErrors));
const prodMedia = snap.snapshot.modules.products['moc-khoa']?.mediaKey;
if (prodMedia !== NEW_KEY) throw new Error('snapshot làm rơi mediaKey: ' + prodMedia);
const snapshotJson = JSON.stringify(snap.snapshot);
const pubId = `pub-${stamp}-p1r2`;
const idemKey = `p1-release-fix-${newProductsHash.slice(0, 12)}`;
const oldPending = await all("SELECT id FROM publications WHERE status = 'pending_review'");
if (oldPending.length !== 1 || !oldPending[0].id.endsWith('-p1r1')) throw new Error('pending_review không như dự kiến ' + JSON.stringify(oldPending));
const SUPERSEDED = 'Thay thế bởi bản vá khóa media P1 (24/10/2026); snapshot cũ giữ nguyên, không được công bố.';
const guard = `(SELECT revision_hash FROM drafts WHERE module_key = 'products') = ${q(newProductsHash)} AND (SELECT revision_hash FROM drafts WHERE module_key = 'project') = ${q(beforeProjectHash)}`;
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

const parts = [];
parts.push(`UPDATE media_assets SET r2_key = ${q(NEW_R2)} WHERE id = ${q(ASSET_ID)} AND r2_key = ${q(OLD_R2)} AND status = 'approved';`);
parts.push(audit(`aud-${stamp}-fixmedia`, 'FIX_MEDIA_KEY', 'media', { assetId: ASSET_ID, from: OLD_R2, to: NEW_R2, note: NOTE }) + ` EXISTS (SELECT 1 FROM media_assets WHERE id = ${q(ASSET_ID)} AND r2_key = ${q(NEW_R2)});`);
parts.push(`UPDATE drafts SET data_json = ${q(productsJson)}, revision_hash = ${q(newProductsHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'products' AND revision_hash = ${q(beforeProductsHash)} AND EXISTS (SELECT 1 FROM media_assets WHERE id = ${q(ASSET_ID)} AND r2_key = ${q(NEW_R2)} AND status = 'approved');`);
parts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-products-${productsVer}-${stamp}`)}, 'products', ${productsVer}, ${q(productsJson)}, ${q(newProductsHash)}, ${q(ACTOR)}, ${q(now)}, ${q('Dùng khóa media /media/<id> để UI Studio chọn đúng và lưu lại không mất ảnh móc khóa (P1 release)')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'products' AND version = ${productsVer});`);
parts.push(audit(`aud-${stamp}-prod`, 'SAVE_DRAFT', 'products', { version: productsVer, revisionHash: newProductsHash, comment: NOTE }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'products' AND version = ${productsVer} AND revision_hash = ${q(newProductsHash)});`);
parts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(oldPending[0].id)} AND status = 'pending_review' AND ${guard};`);
parts.push(audit(`aud-${stamp}-rej`, 'REJECT_PUBLICATION', 'publish', { publicationId: oldPending[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(oldPending[0].id)} AND error_message = ${q(SUPERSEDED)});`);
parts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(snapshotJson)}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
parts.push(audit(`aud-${stamp}-req`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);
const sql = parts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'p1-release-d1-fix.sql'), sql);

const counts = async () => ({ revisions: (await one('SELECT COUNT(*) c FROM revisions')).c, publications: (await one('SELECT COUNT(*) c FROM publications')).c, audit: (await one('SELECT COUNT(*) c FROM audit_logs')).c, media: (await one('SELECT COUNT(*) c FROM media_assets')).c, preorders: (await one('SELECT COUNT(*) c FROM preorders')).c });
const c0 = await counts();
await db.exec(sql);
const c1 = await counts();
const after = { productsDraft: (await one("SELECT revision_hash h FROM drafts WHERE module_key='products'")).h, projectDraft: (await one("SELECT revision_hash h FROM drafts WHERE module_key='project'")).h, asset: await one('SELECT id, r2_key, status FROM media_assets WHERE id = ?', ASSET_ID), pubs: await all('SELECT id, status FROM publications ORDER BY created_at') };
const ok = after.productsDraft === newProductsHash && after.projectDraft === beforeProjectHash && after.asset.r2_key === NEW_R2 && c1.revisions === c0.revisions + 1 && c1.publications === c0.publications + 1 && c1.audit === c0.audit + 4 && c1.media === c0.media && c1.preorders === c0.preorders;
const summary = { beforeProductsHash, newProductsHash, productsVer, publicationId: pubId, snapshotSha256: snap.snapshot.sha256, c0, c1, ok, pubs: after.pubs.map((p) => `${p.id}:${p.status}`), sqlSha256: crypto.createHash('sha256').update(sql).digest('hex') };
fs.writeFileSync(path.join(outDir, 'p1-release-d1-fix-plan.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 1));
