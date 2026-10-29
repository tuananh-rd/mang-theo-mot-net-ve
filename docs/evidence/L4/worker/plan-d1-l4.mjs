// L4: thêm 31 khoản ủng hộ 26–28/10/2026 (1.027.615đ) vào finance.verifiedReceipts của D1 production; 21 khoản cũ giữ nguyên byte-for-byte.
// Chạy: node plan-d1-l4.mjs <backup.sql> <tx.json> <staging.json> <outDir> <privDir> <public-csv-validator.mjs> <public-reconciled-donations.json>   (cwd = worktree Studio có apps/studio/dist)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const [backupPath, txPath, stagingPath, outDir, privDir, publicValidatorPath, publicJsonPath] = process.argv.slice(2);
const pub = await import(pathToFileURL(path.resolve(publicValidatorPath)).href);
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');
const { validateFinanceModuleData } = await load('dist/schemas/index.js');

const isPublicDonorName = pub.isPublicDonorName;
const ACTOR = 'claude-release@internal';
const SOURCE_TAG = 'owner-statement-l4';
const COVERED_TO = '2026-10-29';
const VERIFIED_AT = '2026-10-29';
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const AUTH_NOTE = 'Chủ dự án chỉ thị 29/10/2026 (phiên điều phối Orca): cập nhật sao kê Techcombank ngày 26–29/10/2026; chỉ tên người gửi được ngân hàng ghi rõ và khớp mô tả mới hiển thị, còn lại Ẩn danh; khoản cùng tên chủ tài khoản chờ xác nhận, không công bố.';

const tx = JSON.parse(fs.readFileSync(txPath, 'utf8'));
const staging = JSON.parse(fs.readFileSync(stagingPath, 'utf8'));
const txByRow = new Map(tx.map((t) => [t.row, t]));
const unique = staging.out.map((e) => {
  const t = txByRow.get(e.row);
  const key = `l4:${e.date}:${e.amount}:${crypto.createHash('sha256').update(t.txno).digest('hex').slice(0, 12)}`;
  return { ...e, key };
});
if (unique.length !== 31 || new Set(unique.map((u) => u.key)).size !== 31) throw new Error('31 khóa duy nhất không như dự kiến');
if (new Set(tx.map((t) => t.txno)).size !== tx.length) throw new Error('mã bút toán trùng trong sao kê');
const uniqueSum = unique.reduce((a, r) => a + r.amount, 0);
if (uniqueSum !== 1027615) throw new Error('tổng 31 khoản khác 1.027.615: ' + uniqueSum);
for (const r of unique) if (r.donor !== 'Ẩn danh' && !isPublicDonorName(r.donor)) throw new Error('tên không hợp lệ để hiển thị, dòng ' + r.row);

// --- D1 (bản sao lưu → emulator) ---
const db = new LocalD1Database(':memory:', fs.readFileSync(backupPath, 'utf8'));
const one = (sql, ...b) => db.prepare(sql).bind(...b).first();
const all = async (sql, ...b) => (await db.prepare(sql).bind(...b).all()).results;
const draftRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const drafts = Object.fromEntries(draftRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
const fin = drafts.finance;
const beforeHashes = Object.fromEntries(Object.entries(drafts).map(([k, v]) => [k, v.hash]));
if (fin.data.entries.length !== 0 || fin.data.reconciled !== false || fin.data.firstSigner || fin.data.secondSigner) throw new Error('trạng thái finance không như dự kiến');
const prev = fin.data.verifiedReceipts;
if (!prev || prev.entries.length !== 21 || prev.entries.reduce((s, e) => s + e.amount, 0) !== 1011222) throw new Error('verifiedReceipts hiện tại không như dự kiến (21 khoản, 1.011.222đ)');
if (prev.coveredTo !== '2026-10-23' || prev.verifiedAt !== '2026-10-25') throw new Error('metadata phạm vi hiện tại không như dự kiến');
// Dedup: khóa l4 (ngày+số tiền+băm mã bút toán riêng tư) không thể trùng khóa cũ; mọi ngày mới đều sau phạm vi cũ nên cũng không trùng theo ngày+số tiền+tên
const oldKeys = new Set(prev.entries.map((e) => e.internalKey));
for (const u of unique) { if (oldKeys.has(u.key)) throw new Error('khóa trùng'); if (u.date <= prev.coveredTo) throw new Error('ngày mới không sau phạm vi cũ'); }
const newEntries = unique.map((r) => r.donor === 'Ẩn danh'
  ? { date: r.date, amount: r.amount, donor: 'Ẩn danh', internalKey: r.key, sourceTag: SOURCE_TAG }
  : { date: r.date, amount: r.amount, donor: r.donor, donorPublic: true, internalKey: r.key, sourceTag: SOURCE_TAG });
const added = newEntries;
const anon = unique.filter((r) => r.donor === 'Ẩn danh');
const duplicates = [];

const next = structuredClone(fin.data);
next.verifiedReceipts.coveredTo = COVERED_TO;
next.verifiedReceipts.verifiedAt = VERIFIED_AT;
next.verifiedReceipts.entries = [...prev.entries, ...newEntries]; // 21 dòng cũ giữ nguyên; dòng mới theo ngày tăng dần
const val = validateFinanceModuleData(next);
if (!val.isValid) throw new Error('finance không hợp lệ: ' + val.errors.join('; '));
const dataJson = JSON.stringify(next);
const newHash = await calculateDataHash(next);
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
const csvRowsOut = [...prev.entries.map(({ date, donor, amount }) => ({ date, donor, amount })), ...unique.map((r) => ({ date: r.date, donor: r.donor, amount: r.amount }))];
const norm = (a) => JSON.stringify([...a].sort((x, y) => (x.date + x.amount + x.donor).localeCompare(y.date + y.amount + y.donor)));
if (norm(csvRowsOut) !== norm(vrPub.entries)) throw new Error('52 dòng bản chụp khác sao kê (ngày/tên/số tiền)');
const repoVr = JSON.parse(fs.readFileSync(publicJsonPath, 'utf8')).verifiedReceipts;
if (JSON.stringify(repoVr) !== JSON.stringify(vrPub)) throw new Error('bản chụp Studio khác byte-for-byte với dữ liệu công khai của repo');
if (vrPub.entries.length !== 52 || vrPub.entries.reduce((a, e) => a + e.amount, 0) !== 2038837) throw new Error('bản chụp không phải 52 khoản / 2.038.837đ');
if (JSON.stringify(Object.keys(vrPub).sort()) !== JSON.stringify(['basis', 'coveredFrom', 'coveredTo', 'donorNamesApproval', 'entries', 'publicApproval', 'scope', 'verifiedAt', 'verifiedBy'])) throw new Error('khối công khai có khóa ngoài allowlist');
const integration = { studioSnapshotPassesPublicValidator: true, publicSanitizeIdempotent: true, rowsEqualCsv: true, snapshotEqualsRepoPublicData: true, marker: vrPub.donorNamesApproval, blockKeys: Object.keys(vrPub).sort(), entryKeys: [...new Set(vrPub.entries.flatMap((e) => Object.keys(e)))].sort() };
const snapText = JSON.stringify(snap.snapshot);
for (const bad of ['internalKey', 'sourceTag', 'donorPublic', 'l1:20', 'NOIBO', SOURCE_TAG]) if (snapText.includes(bad)) throw new Error('snapshot rò rỉ ' + bad);
for (const t of tx) { const id = t.txno.split(/[\/]/)[0]; if (id && snapText.includes(id)) throw new Error('snapshot rò rỉ mã bút toán'); }

const pendings = await all("SELECT id FROM publications WHERE status = 'pending_review'");
if (pendings.length !== 1 || !pendings[0].id.endsWith('-l3r1')) throw new Error('pending_review không như dự kiến ' + JSON.stringify(pendings));
const SUPERSEDED = 'Thay thế bởi bản chụp L4 (52 khoản ủng hộ, chủ dự án chỉ thị 29/10/2026); snapshot cũ giữ nguyên, không được công bố.';
const pubId = `pub-${stamp}-l4r1`;
const idemKey = `l4-oct26-29-${newHash.slice(0, 12)}`;
const guard = `(SELECT revision_hash FROM drafts WHERE module_key = 'finance') = ${q(newHash)}` +
  ['project', 'products', 'journal', 'team'].map((m) => ` AND (SELECT revision_hash FROM drafts WHERE module_key = '${m}') = ${q(beforeHashes[m])}`).join('');
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

const parts = [];
parts.push(`UPDATE drafts SET data_json = ${q(dataJson)}, revision_hash = ${q(newHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'finance' AND revision_hash = ${q(fin.hash)};`);
parts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-finance-${finVer}-${stamp}`)}, 'finance', ${finVer}, ${q(dataJson)}, ${q(newHash)}, ${q(ACTOR)}, ${q(now)}, ${q('L4: thêm 31 khoản ủng hộ (1.027.615đ; 10 khoản 26/10, 21 khoản 28/10) theo sao kê Techcombank đến 29/10; 21 khoản cũ không đổi; không phải đối soát đầy đủ')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer});`);
parts.push(audit(`aud-${stamp}-fin`, 'SAVE_DRAFT', 'finance', { version: finVer, revisionHash: newHash, comment: AUTH_NOTE, rowsAdded: added.length, rowsAddedSum: 1027615, duplicatesRemoved: 0, totalRows: 52, totalSum: 2038837, coveredTo: COVERED_TO, verifiedAt: VERIFIED_AT }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer} AND revision_hash = ${q(newHash)});`);
parts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(pendings[0].id)} AND status = 'pending_review' AND ${guard};`);
parts.push(audit(`aud-${stamp}-rej`, 'REJECT_PUBLICATION', 'publish', { publicationId: pendings[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pendings[0].id)} AND error_message = ${q(SUPERSEDED)});`);
parts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(JSON.stringify(snap.snapshot))}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
parts.push(audit(`aud-${stamp}-req`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);
const sql = parts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(privDir, { recursive: true });
fs.writeFileSync(path.join(privDir, 'l4-release-d1.sql'), sql); // gói SQL chứa tên → chỉ ở thư mục riêng tư

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
  source: { statementRows: tx.length, inScopeRows: unique.length + staging.pending.length, addedRows: unique.length, addedSum: uniqueSum, pendingRows: staging.pending.length, duplicatesRemoved: 0 },
  rowMap: added.map((m) => ({ date: m.date, amount: m.amount, action: 'add' })),
  counts: { existingUnchanged: prev.entries.length, added: added.length, addedSum: uniqueSum, addedOn20261026: added.filter((m) => m.date === '2026-10-26').length, addedOn20261028: added.filter((m) => m.date === '2026-10-28').length, namedRows: added.filter((m) => m.donorPublic).length, anonymousRows: anon.length },
  metadata: { coveredFrom: next.verifiedReceipts.coveredFrom, coveredTo: COVERED_TO, verifiedAt: VERIFIED_AT, reconciled: next.reconciled, publicEntries: next.entries.length },
  beforeFinanceHash: fin.hash, newFinanceHash: newHash, financeVersion: finVer, publicationId: pubId, supersededPublication: pendings[0].id, snapshotSha256: snap.snapshot.sha256,
  integration, beforeHashes, c0, c1, finOk, oldRowsOk, protectedOk, ok,
  pubs: (await all('SELECT id, status FROM publications ORDER BY created_at')).map((p) => `${p.id}:${p.status}`),
  sqlSha256: crypto.createHash('sha256').update(sql).digest('hex'),
};
fs.writeFileSync(path.join(outDir, 'l4-release-d1-plan.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(privDir, 'l4-row-map-private.json'), JSON.stringify({ rows: unique.map((u) => ({ row: u.row, date: u.date, amount: u.amount, internalKey: u.key, donor: u.donor })), pending: staging.pending.map((x) => ({ row: x.row, date: x.iso, amount: x.credit || x.debit, reason: x.reason })) }, null, 2));
console.log(JSON.stringify(summary, null, 1));
if (!ok) process.exit(1);
