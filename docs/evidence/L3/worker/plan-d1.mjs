// L3: thêm 15 khoản ủng hộ duy nhất (519.000đ) vào finance.verifiedReceipts của D1 production; 6 khoản đã có giữ nguyên byte-for-byte.
// Ngày do chủ dự án chỉ định: khoản của HUONG DUONG NGUOC NANG = 2026-10-22; mọi khoản chưa có ngày khác = 2026-10-23. Không suy ngày từ metadata.
// Chạy trên emulator nạp từ bản sao lưu (dry-run an toàn); gói SQL có tên chỉ ghi ra thư mục riêng tư; báo cáo công khai KHÔNG chứa tên.
// Chạy (cwd = worktree Studio có apps/studio/dist): node <plan-d1.mjs> <backup.sql> <source.csv> <out-dir> <private-out-dir> <public-csv-validator.mjs> <public-reconciled-donations.json>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const [backupPath, csvPath, outDir, privDir, publicValidatorPath, publicJsonPath] = process.argv.slice(2);
const pub = await import(pathToFileURL(path.resolve(publicValidatorPath)).href);
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');
const { validateFinanceModuleData, isPublicDonorName } = await load('dist/schemas/index.js');
const { receiptKey } = await import(pathToFileURL(path.resolve('tools/content-studio/receipt-dedup.mjs')).href);

const ACTOR = 'claude-release@internal';
const SOURCE_TAG = 'owner-csv-l3';
const COVERED_TO = '2026-10-23';
const VERIFIED_AT = '2026-10-25';
const HUONG = 'HUONG DUONG NGUOC NANG';
const AUTH_NOTE = 'Chủ dự án chỉ thị 25/10/2026 (phiên điều phối Orca): công bố mọi khoản tiền vào trong CSV; HUONG DUONG NGUOC NANG ngày 22/10, các khoản chưa có ngày còn lại ngày 23/10; tên người ủng hộ được phép hiển thị; khoản chuyển ra và dòng 09/10 đã xóa không đưa vào.';
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

// --- CSV (riêng tư) ---
const csvBuf = fs.readFileSync(csvPath);
const csvSha = crypto.createHash('sha256').update(csvBuf).digest('hex');
const rows = [];
{
  const t = csvBuf.toString('utf8').replace(/^﻿/, '');
  let cur = [], f = '', inq = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inq) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else inq = false; } else f += c; }
    else if (c === '"') inq = true;
    else if (c === ',') { cur.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; cur.push(f); f = ''; rows.push(cur); cur = []; }
    else f += c;
  }
  if (f || cur.length) { cur.push(f); rows.push(cur); }
}
const [header, ...data] = rows;
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const recs = data.map((r) => ({ id: r[col.ma_giao_dich], date: r[col.ngay], amount: Number(r[col.so_tien]), name: r[col.ten_nguoi_ung_ho].trim(), desc: r[col.noi_dung], note: r[col.ghi_chu] }));
const dated = recs.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
const undated = recs.filter((r) => !r.date);
if (recs.length !== 22 || dated.length !== 6 || undated.length !== 16) throw new Error(`CSV không như dự kiến: ${recs.length}/${dated.length}/${undated.length}`);
if (dated.reduce((a, r) => a + r.amount, 0) !== 492222) throw new Error('tổng dòng có ngày khác 492.222');
const timeOf = (r) => (r.note.split(';')[0] || '').trim();
// Ngày do chủ dự án chỉ định cho dòng chưa có ngày
const assign = (r) => (r.date ? r.date : r.name === HUONG ? '2026-10-22' : '2026-10-23');
const withDate = recs.map((r) => ({ ...r, date: assign(r), time: timeOf(r), desc: r.name || r.desc }));
// Khóa trùng nội bộ (ngày + giờ + số tiền + băm mô tả); trùng trong chính CSV chỉ tính một lần
const keyed = withDate.map((r) => ({ ...r, key: receiptKey({ date: r.date, time: r.time, amount: r.amount, description: r.desc }) }));
const seenK = new Map();
const duplicates = [];
for (const r of keyed) { if (seenK.has(r.key)) duplicates.push(r); else seenK.set(r.key, r); }
const unique = [...seenK.values()];
if (duplicates.length !== 1 || unique.length !== 21) throw new Error(`dedup không như dự kiến: ${duplicates.length}/${unique.length}`);
const uniqueSum = unique.reduce((a, r) => a + r.amount, 0);
if (uniqueSum !== 1011222) throw new Error('tổng 21 khoản duy nhất khác 1.011.222: ' + uniqueSum);
const huongRows = unique.filter((r) => r.name === HUONG);
if (huongRows.length !== 1 || huongRows[0].date !== '2026-10-22' || huongRows[0].amount !== 50000) throw new Error('dòng HUONG không như dự kiến');
if (unique.filter((r) => r.date === '2026-10-23').length !== 14) throw new Error('phải có 14 khoản ngày 23/10');
const anon = unique.filter((r) => !r.name);
if (anon.length !== 1 || anon[0].amount !== 20000) throw new Error('phải có đúng một khoản ẩn danh 20.000đ');
for (const r of unique) if (r.name && !isPublicDonorName(r.name)) throw new Error(`tên dòng ${r.id} không hợp lệ để hiển thị`);

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
if (!prev || prev.entries.length !== 6 || prev.entries.some((e) => e.donorPublic !== true)) throw new Error('verifiedReceipts hiện tại không như dự kiến (6 khoản có tên)');
if (prev.coveredTo !== '2026-10-21' || prev.verifiedAt !== '2026-10-24') throw new Error('metadata phạm vi hiện tại không như dự kiến');

// Ánh xạ từng khoản duy nhất → dòng D1 hiện có hoặc dòng mới; 6 khoản cũ phải khớp 1–1 (đúng ngày, số tiền, tên)
const byKey = new Map(prev.entries.map((e) => [e.internalKey, e]));
const used = new Set();
const mapRows = unique.map((r) => {
  const hit = byKey.get(r.key);
  if (hit) {
    if (used.has(r.key)) throw new Error(`khóa trùng ${r.id}`);
    used.add(r.key);
    if (hit.date !== r.date || hit.amount !== r.amount || hit.donor !== r.name) throw new Error(`dòng ${r.id} lệch so với D1`);
    return { csvId: r.id, date: r.date, amount: r.amount, internalKey: r.key, action: 'existing-unchanged' };
  }
  if (r.date !== '2026-10-22' && r.date !== '2026-10-23') throw new Error(`dòng mới ${r.id} có ngày không mong đợi ${r.date}`);
  return { csvId: r.id, date: r.date, amount: r.amount, internalKey: r.key, action: 'add' };
});
if (used.size !== prev.entries.length) throw new Error('còn dòng D1 không có trong CSV');
const added = mapRows.filter((m) => m.action === 'add');
if (added.length !== 15 || added.reduce((a, m) => a + m.amount, 0) !== 519000) throw new Error('15 khoản mới / 519.000đ không như dự kiến');

const byId = new Map(unique.map((r) => [r.id, r]));
const newEntries = [...added].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).map((m) => {
  const r = byId.get(m.csvId);
  return r.name
    ? { date: m.date, amount: m.amount, donor: r.name, donorPublic: true, internalKey: m.internalKey, sourceTag: SOURCE_TAG }
    : { date: m.date, amount: m.amount, donor: 'Ẩn danh', internalKey: m.internalKey, sourceTag: SOURCE_TAG };
});
const next = structuredClone(fin.data);
next.verifiedReceipts.coveredTo = COVERED_TO;
next.verifiedReceipts.verifiedAt = VERIFIED_AT;
next.verifiedReceipts.entries = [...prev.entries, ...newEntries]; // 6 dòng cũ giữ nguyên; dòng mới theo ngày tăng dần
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
const csvRowsOut = unique.map((r) => ({ date: r.date, donor: r.name || 'Ẩn danh', amount: r.amount }));
const norm = (a) => JSON.stringify([...a].sort((x, y) => (x.date + x.amount + x.donor).localeCompare(y.date + y.amount + y.donor)));
if (norm(csvRowsOut) !== norm(vrPub.entries)) throw new Error('21 dòng bản chụp khác CSV (ngày/tên/số tiền)');
const repoVr = JSON.parse(fs.readFileSync(publicJsonPath, 'utf8')).verifiedReceipts;
if (JSON.stringify(repoVr) !== JSON.stringify(vrPub)) throw new Error('bản chụp Studio khác byte-for-byte với dữ liệu công khai của repo');
if (vrPub.entries.length !== 21 || vrPub.entries.reduce((a, e) => a + e.amount, 0) !== 1011222) throw new Error('bản chụp không phải 21 khoản / 1.011.222đ');
if (JSON.stringify(Object.keys(vrPub).sort()) !== JSON.stringify(['basis', 'coveredFrom', 'coveredTo', 'donorNamesApproval', 'entries', 'publicApproval', 'scope', 'verifiedAt', 'verifiedBy'])) throw new Error('khối công khai có khóa ngoài allowlist');
const integration = { studioSnapshotPassesPublicValidator: true, publicSanitizeIdempotent: true, rowsEqualCsv: true, snapshotEqualsRepoPublicData: true, marker: vrPub.donorNamesApproval, blockKeys: Object.keys(vrPub).sort(), entryKeys: [...new Set(vrPub.entries.flatMap((e) => Object.keys(e)))].sort() };
const snapText = JSON.stringify(snap.snapshot);
for (const bad of ['internalKey', 'sourceTag', 'donorPublic', 'l1:20', 'NOIBO', SOURCE_TAG]) if (snapText.includes(bad)) throw new Error('snapshot rò rỉ ' + bad);
for (const r of recs) if (r.note && snapText.includes(r.note)) throw new Error('snapshot rò rỉ ghi chú CSV');

const pendings = await all("SELECT id FROM publications WHERE status = 'pending_review'");
if (pendings.length !== 1 || !pendings[0].id.endsWith('-l2r1')) throw new Error('pending_review không như dự kiến ' + JSON.stringify(pendings));
const SUPERSEDED = 'Thay thế bởi bản chụp L3 (21 khoản ủng hộ, chủ dự án chỉ thị 25/10/2026); snapshot cũ giữ nguyên, không được công bố.';
const pubId = `pub-${stamp}-l3r1`;
const idemKey = `l3-all-supporters-${newHash.slice(0, 12)}`;
const guard = `(SELECT revision_hash FROM drafts WHERE module_key = 'finance') = ${q(newHash)}` +
  ['project', 'products', 'journal', 'team'].map((m) => ` AND (SELECT revision_hash FROM drafts WHERE module_key = '${m}') = ${q(beforeHashes[m])}`).join('');
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

const parts = [];
parts.push(`UPDATE drafts SET data_json = ${q(dataJson)}, revision_hash = ${q(newHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'finance' AND revision_hash = ${q(fin.hash)};`);
parts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-finance-${finVer}-${stamp}`)}, 'finance', ${finVer}, ${q(dataJson)}, ${q(newHash)}, ${q(ACTOR)}, ${q(now)}, ${q('L3: thêm 15 khoản ủng hộ duy nhất (519.000đ; 1 khoản 22/10, 14 khoản 23/10) theo chỉ thị chủ dự án; 6 khoản cũ không đổi; không phải đối soát đầy đủ')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer});`);
parts.push(audit(`aud-${stamp}-fin`, 'SAVE_DRAFT', 'finance', { version: finVer, revisionHash: newHash, comment: AUTH_NOTE, rowsAdded: added.length, rowsAddedSum: 519000, duplicatesRemoved: duplicates.length, totalRows: 21, totalSum: 1011222, coveredTo: COVERED_TO, verifiedAt: VERIFIED_AT }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer} AND revision_hash = ${q(newHash)});`);
parts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(pendings[0].id)} AND status = 'pending_review' AND ${guard};`);
parts.push(audit(`aud-${stamp}-rej`, 'REJECT_PUBLICATION', 'publish', { publicationId: pendings[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pendings[0].id)} AND error_message = ${q(SUPERSEDED)});`);
parts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(JSON.stringify(snap.snapshot))}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
parts.push(audit(`aud-${stamp}-req`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);
const sql = parts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(privDir, { recursive: true });
fs.writeFileSync(path.join(privDir, 'l3-release-d1.sql'), sql); // gói SQL chứa tên → chỉ ở thư mục riêng tư

const counts = async () => ({ revisions: (await one('SELECT COUNT(*) c FROM revisions')).c, publications: (await one('SELECT COUNT(*) c FROM publications')).c, audit: (await one('SELECT COUNT(*) c FROM audit_logs')).c, media: (await one('SELECT COUNT(*) c FROM media_assets')).c, preorders: (await one('SELECT COUNT(*) c FROM preorders')).c });
const c0 = await counts();
await db.exec(sql);
const c1 = await counts();
const afterRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const after = Object.fromEntries(afterRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
// Mọi trường finance khác verifiedReceipts.{entries,coveredTo,verifiedAt} giống byte-for-byte; 6 dòng cũ giữ nguyên
const strip = (d) => { const c = structuredClone(d); delete c.verifiedReceipts.entries; delete c.verifiedReceipts.coveredTo; delete c.verifiedReceipts.verifiedAt; return JSON.stringify(c); };
const finOk = strip(fin.data) === strip(after.finance.data);
const oldRowsOk = JSON.stringify(after.finance.data.verifiedReceipts.entries.slice(0, 6)) === JSON.stringify(prev.entries);
const protectedOk = ['project', 'products', 'journal', 'team'].every((m) => after[m].hash === beforeHashes[m]);
const ok = finOk && oldRowsOk && protectedOk && after.finance.hash === newHash && c1.revisions === c0.revisions + 1 && c1.publications === c0.publications + 1 && c1.audit === c0.audit + 3 && c1.media === c0.media && c1.preorders === c0.preorders
  && after.finance.data.reconciled === false && after.finance.data.entries.length === 0 && !after.finance.data.firstSigner && !after.finance.data.secondSigner
  && after.finance.data.donationAccount && JSON.stringify(after.finance.data.donationAccount) === JSON.stringify(fin.data.donationAccount);

const summary = {
  csv: { sha256: csvSha, rawRows: recs.length, datedRows: dated.length, datedSum: 492222, undatedRaw: undated.length, duplicatesRemoved: duplicates.length, uniqueRows: unique.length, uniqueSum },
  rowMap: mapRows.map((m) => ({ date: m.date, amount: m.amount, action: m.action })), // không có tên, mã CSV hay khóa nội bộ (khóa chứa giờ giao dịch)
  counts: { existingUnchanged: mapRows.length - added.length, added: added.length, addedSum: 519000, addedOn20261022: added.filter((m) => m.date === '2026-10-22').length, addedOn20261023: added.filter((m) => m.date === '2026-10-23').length, anonymousRows: anon.length },
  metadata: { coveredFrom: next.verifiedReceipts.coveredFrom, coveredTo: COVERED_TO, verifiedAt: VERIFIED_AT, reconciled: next.reconciled, publicEntries: next.entries.length },
  beforeFinanceHash: fin.hash, newFinanceHash: newHash, financeVersion: finVer, publicationId: pubId, supersededPublication: pendings[0].id, snapshotSha256: snap.snapshot.sha256,
  integration, beforeHashes, c0, c1, finOk, oldRowsOk, protectedOk, ok,
  pubs: (await all('SELECT id, status FROM publications ORDER BY created_at')).map((p) => `${p.id}:${p.status}`),
  sqlSha256: crypto.createHash('sha256').update(sql).digest('hex'),
};
fs.writeFileSync(path.join(outDir, 'l3-release-d1-plan.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(privDir, 'l3-row-map-private.json'), JSON.stringify({ rows: mapRows.map((m) => ({ ...m, name: byId.get(m.csvId).name || null })), duplicateIds: duplicates.map((r) => r.id) }, null, 2));
console.log(JSON.stringify(summary, null, 1));
if (!ok) process.exit(1);
