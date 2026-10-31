// L4: thêm 31 khoản ủng hộ 26–28/10/2026 (1.027.615đ) vào finance.verifiedReceipts của D1 production; 21 khoản cũ giữ nguyên byte-for-byte.
// Chạy: node plan-d1-l4.mjs <backup.sql> <tx.json> <staging.json> <outDir> <privDir> <public-csv-validator.mjs> <public-reconciled-donations.json>   (cwd = worktree Studio có apps/studio/dist)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const [backupPath, targetBackupPath, outDir, privDir, publicValidatorPath, publicJsonPath] = process.argv.slice(2);
const pub = await import(pathToFileURL(path.resolve(publicValidatorPath)).href);
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');
const { validateFinanceModuleData } = await load('dist/schemas/index.js');
const ACTOR = 'claude-release@internal';
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const AUTH_NOTE = 'Chủ dự án chỉ thị 31/10/2026: hủy cập nhật sao kê L4 (26–29/10), khôi phục sổ finance về bản trước L4 (v8, 21 khoản); không công bố khoản 150.000đ.';
const CUR_HASH = '2d133a0baafbc16ce00e8414d42d08a35e16795e33c1be5e14b6c5b268d75f35';
const TARGET_HASH = '387b542c4a145ce4e2e537effb04b84d314f15074a99db9bb61fde17b10d6633';

// --- D1 (bản sao lưu → emulator) ---
const db = new LocalD1Database(':memory:', fs.readFileSync(backupPath, 'utf8'));
const one = (sql, ...b) => db.prepare(sql).bind(...b).first();
const all = async (sql, ...b) => (await db.prepare(sql).bind(...b).all()).results;
const draftRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const drafts = Object.fromEntries(draftRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
const fin = drafts.finance;
const beforeHashes = Object.fromEntries(Object.entries(drafts).map(([k, v]) => [k, v.hash]));
if (fin.hash !== CUR_HASH) throw new Error('finance hiện tại không phải bản L4 đã xác minh: ' + fin.hash);
if (fin.data.verifiedReceipts.entries.length !== 52) throw new Error('hiện tại không phải 52 khoản');
const tdb = new LocalD1Database(':memory:', fs.readFileSync(targetBackupPath, 'utf8'));
const tRow = (await tdb.prepare("SELECT data_json, revision_hash FROM drafts WHERE module_key = 'finance'").first());
if (tRow.revision_hash !== TARGET_HASH) throw new Error('bản sao lưu trước L4 không có hash v8 mong đợi');
const prev = JSON.parse(tRow.data_json).verifiedReceipts;
if (prev.entries.length !== 21 || prev.entries.reduce((s, e) => s + e.amount, 0) !== 1011222 || prev.coveredTo !== '2026-10-23' || prev.verifiedAt !== '2026-10-25') throw new Error('bản v8 không như dự kiến');
// 21 dòng đầu của bản L4 phải trùng byte-for-byte bản v8 (L4 chỉ thêm cuối)
if (JSON.stringify(fin.data.verifiedReceipts.entries.slice(0, 21)) !== JSON.stringify(prev.entries)) throw new Error('21 dòng đầu khác v8');
const next = JSON.parse(tRow.data_json);
const added = fin.data.verifiedReceipts.entries.slice(21);
const anon = [];

const val = validateFinanceModuleData(next);
if (!val.isValid) throw new Error('finance không hợp lệ: ' + val.errors.join('; '));
const dataJson = tRow.data_json;
const newHash = TARGET_HASH;
if ((await calculateDataHash(next)) !== TARGET_HASH) throw new Error('hash v8 tính lại khác');
const now = new Date().toISOString();
const stamp = Date.now();
const finVer = ((await one("SELECT MAX(version) v FROM revisions WHERE module_key = 'finance'")).v) + 1;

// Bản chụp công khai mới (toàn bộ module)
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
if (pf.reconciled !== false || pf.entries.length !== 0) throw new Error('snapshot giả lập đối soát');
const vrPub = pf.verifiedReceipts;
// Tích hợp: bản chụp Studio phải đi qua validator/sanitizer công khai và khớp ĐÚNG file dữ liệu công khai của repo (ngày, tên, số tiền, metadata)
if (vrPub.donorNamesApproval !== 'owner-authorized') throw new Error('bản chụp thiếu donorNamesApproval');
const pubErrors = pub.validateVerifiedReceipts(vrPub, false);
if (pubErrors.length) throw new Error('validator công khai từ chối bản chụp Studio: ' + pubErrors.join('; '));
const projErrors = pub.validateDonationProjection({ reconciled: false, reconciledAt: null, publicApproval: 'pending', entries: [], verifiedReceipts: vrPub });
if (!projErrors.isValid) throw new Error('validateDonationProjection từ chối: ' + projErrors.errors.join('; '));
if (JSON.stringify(pub.sanitizeVerifiedReceipts(vrPub)) !== JSON.stringify(vrPub)) throw new Error('sanitize công khai làm đổi bản chụp Studio');
const csvRowsOut = prev.entries.map(({ date, donor, amount }) => ({ date, donor, amount }));
const norm = (a) => JSON.stringify([...a].sort((x, y) => (x.date + x.amount + x.donor).localeCompare(y.date + y.amount + y.donor)));
if (norm(csvRowsOut) !== norm(vrPub.entries)) throw new Error('bản chụp khác v8 (ngày/tên/số tiền)');
const repoVr = JSON.parse(fs.readFileSync(publicJsonPath, 'utf8')).verifiedReceipts;
if (JSON.stringify(repoVr) !== JSON.stringify(vrPub)) throw new Error('bản chụp Studio khác byte-for-byte với dữ liệu công khai của repo');
if (vrPub.entries.length !== 21 || vrPub.entries.reduce((a, e) => a + e.amount, 0) !== 1011222) throw new Error('bản chụp không phải 21 khoản / 1.011.222đ');
if (JSON.stringify(Object.keys(vrPub).sort()) !== JSON.stringify(['basis', 'coveredFrom', 'coveredTo', 'donorNamesApproval', 'entries', 'publicApproval', 'scope', 'verifiedAt', 'verifiedBy'])) throw new Error('khối công khai có khóa ngoài allowlist');
const integration = { studioSnapshotPassesPublicValidator: true, publicSanitizeIdempotent: true, rowsEqualCsv: true, snapshotEqualsRepoPublicData: true, marker: vrPub.donorNamesApproval, blockKeys: Object.keys(vrPub).sort(), entryKeys: [...new Set(vrPub.entries.flatMap((e) => Object.keys(e)))].sort() };
const snapText = JSON.stringify(snap.snapshot);
for (const bad of ['internalKey', 'sourceTag', 'donorPublic', 'l1:20', 'l4:20', 'owner-statement-l4']) if (snapText.includes(bad)) throw new Error('snapshot rò rỉ ' + bad);

const pendings = await all("SELECT id FROM publications WHERE status = 'pending_review'");
if (pendings.length !== 1 || !pendings[0].id.endsWith('-l4r1')) throw new Error('pending_review không như dự kiến ' + JSON.stringify(pendings));
const SUPERSEDED = 'Hủy bởi chỉ thị chủ dự án 31/10/2026 (rollback L4); snapshot L4 giữ nguyên để truy vết, không được công bố.';
const pubId = `pub-${stamp}-l4rb1`;
const idemKey = `l4-rollback-${newHash.slice(0, 12)}`;
const guard = `(SELECT revision_hash FROM drafts WHERE module_key = 'finance') = ${q(newHash)}` +
  ['project', 'products', 'journal', 'team'].map((m) => ` AND (SELECT revision_hash FROM drafts WHERE module_key = '${m}') = ${q(beforeHashes[m])}`).join('');
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

const parts = [];
parts.push(`UPDATE drafts SET data_json = ${q(dataJson)}, revision_hash = ${q(newHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'finance' AND revision_hash = ${q(fin.hash)};`);
parts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-finance-${finVer}-${stamp}`)}, 'finance', ${finVer}, ${q(dataJson)}, ${q(newHash)}, ${q(ACTOR)}, ${q(now)}, ${q('Rollback L4: khôi phục payload finance v8 (21 khoản, 1.011.222đ) theo chỉ thị chủ dự án 31/10/2026; revision L4 giữ nguyên để truy vết')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer});`);
parts.push(audit(`aud-${stamp}-fin`, 'SAVE_DRAFT', 'finance', { version: finVer, revisionHash: newHash, comment: AUTH_NOTE, restoredFromHash: TARGET_HASH, removedRows: added.length, removedSum: 1027615, totalRows: 21, totalSum: 1011222 }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer} AND revision_hash = ${q(newHash)});`);
parts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(pendings[0].id)} AND status = 'pending_review' AND ${guard};`);
parts.push(audit(`aud-${stamp}-rej`, 'REJECT_PUBLICATION', 'publish', { publicationId: pendings[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pendings[0].id)} AND error_message = ${q(SUPERSEDED)});`);
parts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(JSON.stringify(snap.snapshot))}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
parts.push(audit(`aud-${stamp}-req`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);
const sql = parts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(privDir, { recursive: true });
fs.writeFileSync(path.join(privDir, 'l4-rollback-d1.sql'), sql); // gói SQL chứa tên → chỉ ở thư mục riêng tư

const counts = async () => ({ revisions: (await one('SELECT COUNT(*) c FROM revisions')).c, publications: (await one('SELECT COUNT(*) c FROM publications')).c, audit: (await one('SELECT COUNT(*) c FROM audit_logs')).c, media: (await one('SELECT COUNT(*) c FROM media_assets')).c, preorders: (await one('SELECT COUNT(*) c FROM preorders')).c });
const c0 = await counts();
await db.exec(sql);
const c1 = await counts();
const afterRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const after = Object.fromEntries(afterRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
// Mọi trường finance khác verifiedReceipts.{entries,coveredTo,verifiedAt} giống byte-for-byte; 6 dòng cũ giữ nguyên
const strip = (d) => { const c = structuredClone(d); delete c.verifiedReceipts.entries; delete c.verifiedReceipts.coveredTo; delete c.verifiedReceipts.verifiedAt; return JSON.stringify(c); };
const finOk = strip(fin.data) === strip(after.finance.data);
const oldRowsOk = JSON.stringify(after.finance.data.verifiedReceipts.entries.slice(0, prev.entries.length)) === JSON.stringify(prev.entries);
const protectedOk = ['project', 'products', 'journal', 'team'].every((m) => after[m].hash === beforeHashes[m]);
const ok = finOk && oldRowsOk && protectedOk && after.finance.hash === newHash && c1.revisions === c0.revisions + 1 && c1.publications === c0.publications + 1 && c1.audit === c0.audit + 3 && c1.media === c0.media && c1.preorders === c0.preorders
  && after.finance.data.reconciled === false && after.finance.data.entries.length === 0 && !after.finance.data.firstSigner && !after.finance.data.secondSigner
  && after.finance.data.donationAccount && JSON.stringify(after.finance.data.donationAccount) === JSON.stringify(fin.data.donationAccount);

const summary = {
  source: { restoredFrom: 'pre-L4 backup finance v8', removedRows: added.length },
  counts: { restoredRows: 21, restoredSum: 1011222, removedRows: added.length, removedSum: 1027615 },
  metadata: { coveredFrom: next.verifiedReceipts.coveredFrom, coveredTo: next.verifiedReceipts.coveredTo, verifiedAt: next.verifiedReceipts.verifiedAt, reconciled: next.reconciled, publicEntries: next.entries.length },
  beforeFinanceHash: fin.hash, newFinanceHash: newHash, financeVersion: finVer, publicationId: pubId, supersededPublication: pendings[0].id, snapshotSha256: snap.snapshot.sha256,
  integration, beforeHashes, c0, c1, finOk, oldRowsOk, protectedOk, ok,
  pubs: (await all('SELECT id, status FROM publications ORDER BY created_at')).map((p) => `${p.id}:${p.status}`),
  sqlSha256: crypto.createHash('sha256').update(sql).digest('hex'),
};
fs.writeFileSync(path.join(outDir, 'l4-rollback-d1-plan.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 1));
if (!ok) process.exit(1);
