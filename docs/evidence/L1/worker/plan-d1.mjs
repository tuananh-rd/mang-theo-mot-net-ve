// L1: tạo gói SQL cho D1 production — chỉ thêm khối finance.verifiedReceipts (khoản đã xác minh một phần) qua quy trình revision/hash/CAS.
// Chạy trên emulator nạp từ bản sao lưu (an toàn), xuất SQL + báo cáo đã loại dữ liệu riêng tư.
// Chạy: node docs/evidence/L1/worker/plan-d1.mjs <backup.sql> <private-manifest.json> <out-dir> [--db-file <sqlite>]
// Không ghi tên người gửi/mô tả thô ra bất kỳ tệp báo cáo nào; manifest riêng tư chỉ đọc để sinh khóa trùng nội bộ.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const [backupPath, manifestPath, outDir] = args;
const dbFile = args.includes('--db-file') ? args[args.indexOf('--db-file') + 1] : ':memory:';
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');
const { validateFinanceModuleData } = await load('dist/schemas/index.js');
const { mergeReceipts } = await import(pathToFileURL(path.resolve('tools/content-studio/receipt-dedup.mjs')).href);

const ACTOR = 'claude-release@internal';
const NOTE = 'L1 24/10/2026: nhập 6 khoản ủng hộ đã xác minh một phần từ ảnh sao kê do chủ dự án cung cấp (không phải đối soát đầy đủ; không ký hai người)';
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
// Khóa trùng nội bộ: ngày + giờ + số tiền + băm mô tả chuẩn hóa (ở đây mô tả = tên hiển thị trên sao kê, chỉ băm, không lưu)
const candidates = manifest.dated.map((d) => ({ date: d.date, time: d.time, amount: d.amount, description: d.privateDonor }));

if (fs.existsSync(dbFile) && dbFile !== ':memory:') fs.rmSync(dbFile);
const db = new LocalD1Database(dbFile, fs.readFileSync(backupPath, 'utf8'));
const one = (sql, ...b) => db.prepare(sql).bind(...b).first();
const all = async (sql, ...b) => (await db.prepare(sql).bind(...b).all()).results;

const draftRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const drafts = Object.fromEntries(draftRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
const fin = drafts.finance;
const beforeHashes = Object.fromEntries(Object.entries(drafts).map(([k, v]) => [k, v.hash]));

const existingKeys = (fin.data.verifiedReceipts?.entries || []).map((e) => e.internalKey).filter(Boolean);
const { added, duplicates } = mergeReceipts(existingKeys, candidates);
if (fin.data.entries.length !== 0) throw new Error('finance.entries không rỗng như dự kiến');
if (fin.data.reconciled !== false || fin.data.firstSigner || fin.data.secondSigner) throw new Error('trạng thái đối soát không như dự kiến');
if (added.length === 0) throw new Error('không có dòng mới để nhập');

const prevEntries = fin.data.verifiedReceipts?.entries || [];
const entries = [
  ...prevEntries,
  ...added.map((a) => ({ date: a.date, amount: a.amount, donor: 'Ẩn danh', internalKey: a.key, sourceTag: 'owner-screenshots-l1' })),
].sort((x, y) => (x.date + x.internalKey < y.date + y.internalKey ? -1 : 1));
const dates = entries.map((e) => e.date).sort();
const next = structuredClone(fin.data);
next.verifiedReceipts = {
  scope: 'partial-verified-receipts',
  publicApproval: 'approved',
  verifiedAt: '2026-10-24',
  coveredFrom: dates[0],
  coveredTo: dates[dates.length - 1],
  basis: 'owner-provided-bank-statement-screenshots',
  verifiedBy: ['Chủ dự án (cung cấp và chỉ định khoản)', 'Rà soát nội bộ độc lập của nhóm hỗ trợ kỹ thuật'],
  entries,
};
const val = validateFinanceModuleData(next);
if (!val.isValid) throw new Error('finance không hợp lệ: ' + val.errors.join('; '));

const dataJson = JSON.stringify(next);
const newHash = await calculateDataHash(next);
const now = new Date().toISOString();
const stamp = Date.now();
const finVer = ((await one("SELECT MAX(version) v FROM revisions WHERE module_key = 'finance'")).v) + 1;

// Bản chụp mới (toàn bộ module: giữ nguyên P1 stage/ảnh móc khóa) — hợp lệ theo bộ khóa media được duyệt
const nextDrafts = Object.fromEntries(Object.entries(drafts).map(([k, v]) => [k, v.data]));
nextDrafts.finance = next;
const approvedKeys = new Set();
for (const reg of APPROVED_MEDIA_REGISTRY) { approvedKeys.add(reg.publicPath); approvedKeys.add(reg.r2Key); approvedKeys.add(reg.id); approvedKeys.add(`/media/${reg.id}`); }
for (const a of await all("SELECT id, r2_key FROM media_assets WHERE status = 'approved'")) {
  approvedKeys.add(a.r2_key); approvedKeys.add(a.id); approvedKeys.add(`/media/${a.id}`);
  const reg = APPROVED_MEDIA_REGISTRY.find((r) => r.id === a.id || r.r2Key === a.r2_key);
  if (reg) approvedKeys.add(reg.publicPath);
}
const snap = await createPublicationSnapshot(nextDrafts, `v${stamp}`, approvedKeys);
if (!snap.isEligibleForPublish) throw new Error('snapshot không hợp lệ: ' + JSON.stringify(snap.validationErrors));
const pf = snap.snapshot.modules.finance;
if (!pf.verifiedReceipts || pf.verifiedReceipts.entries.length !== entries.length) throw new Error('snapshot làm rơi verifiedReceipts');
if (pf.reconciled !== false || pf.entries.length !== 0) throw new Error('snapshot giả lập đối soát');
const snapText = JSON.stringify(snap.snapshot);
for (const bad of ['internalKey', 'sourceTag', 'l1:20']) if (snapText.includes(bad)) throw new Error('snapshot rò rỉ ' + bad);
const names = [...manifest.dated, ...manifest.pending, manifest.neverRestore].map((x) => x.privateDonor).filter((n) => n && n !== 'NGUYEN CHI TRUNG');
for (const n of names) if (snapText.toUpperCase().includes(n)) throw new Error('snapshot rò rỉ tên người gửi');
const snapshotJson = snapText;

const pendings = await all("SELECT id FROM publications WHERE status = 'pending_review'");
if (pendings.length !== 1 || !pendings[0].id.endsWith('-p1r2')) throw new Error('pending_review không như dự kiến ' + JSON.stringify(pendings));
const SUPERSEDED = 'Thay thế bởi bản chụp L1 (khoản đã xác minh một phần, 24/10/2026); snapshot cũ giữ nguyên, không được công bố.';
const pubId = `pub-${stamp}-l1r1`;
const idemKey = `l1-verified-receipts-${newHash.slice(0, 12)}`;
const guard = `(SELECT revision_hash FROM drafts WHERE module_key = 'finance') = ${q(newHash)}` +
  ['project', 'products', 'journal', 'team'].map((m) => ` AND (SELECT revision_hash FROM drafts WHERE module_key = '${m}') = ${q(beforeHashes[m])}`).join('');
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

const parts = [];
parts.push(`UPDATE drafts SET data_json = ${q(dataJson)}, revision_hash = ${q(newHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'finance' AND revision_hash = ${q(fin.hash)};`);
parts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-finance-${finVer}-${stamp}`)}, 'finance', ${finVer}, ${q(dataJson)}, ${q(newHash)}, ${q(ACTOR)}, ${q(now)}, ${q('Nhập 6 khoản ủng hộ đã xác minh một phần từ ảnh sao kê (L1); không phải đối soát đầy đủ')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer});`);
parts.push(audit(`aud-${stamp}-fin`, 'SAVE_DRAFT', 'finance', { version: finVer, revisionHash: newHash, comment: NOTE, added: added.length, duplicatesSkipped: duplicates.length }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer} AND revision_hash = ${q(newHash)});`);
parts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(pendings[0].id)} AND status = 'pending_review' AND ${guard};`);
parts.push(audit(`aud-${stamp}-rej`, 'REJECT_PUBLICATION', 'publish', { publicationId: pendings[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pendings[0].id)} AND error_message = ${q(SUPERSEDED)});`);
parts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(snapshotJson)}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
parts.push(audit(`aud-${stamp}-req`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);
const sql = parts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'l1-release-d1.sql'), sql);

const counts = async () => ({ revisions: (await one('SELECT COUNT(*) c FROM revisions')).c, publications: (await one('SELECT COUNT(*) c FROM publications')).c, audit: (await one('SELECT COUNT(*) c FROM audit_logs')).c, media: (await one('SELECT COUNT(*) c FROM media_assets')).c, preorders: (await one('SELECT COUNT(*) c FROM preorders')).c });
const c0 = await counts();
await db.exec(sql);
const c1 = await counts();
const afterRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const after = Object.fromEntries(afterRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
const { verifiedReceipts: _v, ...finBefore } = fin.data;
const { verifiedReceipts: _w, ...finAfter } = after.finance.data;
const protectedOk = ['project', 'products', 'journal', 'team'].every((m) => after[m].hash === beforeHashes[m]) && JSON.stringify(finBefore) === JSON.stringify(finAfter);
const ok = protectedOk && after.finance.hash === newHash && c1.revisions === c0.revisions + 1 && c1.publications === c0.publications + 1 && c1.audit === c0.audit + 3 && c1.media === c0.media && c1.preorders === c0.preorders
  && after.finance.data.reconciled === false && after.finance.data.entries.length === 0 && !after.finance.data.firstSigner && !after.finance.data.secondSigner;
const summary = {
  beforeFinanceHash: fin.hash, newFinanceHash: newHash, financeVersion: finVer, publicationId: pubId, snapshotSha256: snap.snapshot.sha256,
  dedup: { candidates: candidates.length, added: added.length, duplicatesSkipped: duplicates.length, existingVerified: prevEntries.length },
  amounts: { added: added.reduce((a, x) => a + x.amount, 0), total: entries.reduce((a, x) => a + x.amount, 0) },
  coverage: { from: dates[0], to: dates[dates.length - 1] },
  beforeHashes, c0, c1, protectedOk, ok,
  pubs: (await all('SELECT id, status FROM publications ORDER BY created_at')).map((p) => `${p.id}:${p.status}`),
  sqlSha256: crypto.createHash('sha256').update(sql).digest('hex'),
};
fs.writeFileSync(path.join(outDir, 'l1-release-d1-plan.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 1));
