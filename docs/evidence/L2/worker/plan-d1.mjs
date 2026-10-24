// L2: thay tên hiển thị công khai (đã được chủ dự án cho phép) cho 6 khoản có ngày tuyệt đối trong finance.verifiedReceipts của D1 production.
// Chạy trên emulator nạp từ bản sao lưu (dry-run an toàn); xuất gói SQL + báo cáo KHÔNG chứa tên; bản đồ dòng có tên chỉ ghi ra thư mục riêng tư.
// Chạy: node docs/evidence/L2/worker/plan-d1.mjs <backup.sql> <source.csv> <out-dir> <private-out-dir> <public-csv-validator.mjs>
// Không bao giờ ghi tên/ghi chú của CSV vào báo cáo công khai; 16 dòng chưa có ngày chỉ được đếm, không nhập.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const [backupPath, csvPath, outDir, privDir, publicValidatorPath] = process.argv.slice(2);
const pub = await import(pathToFileURL(path.resolve(publicValidatorPath)).href);
const studio = path.resolve('apps/studio');
const load = (p) => import(pathToFileURL(path.join(studio, p)).href);
const { LocalD1Database } = await load('dist/db/emulator.js');
const { calculateDataHash } = await load('dist/db/client.js');
const { createPublicationSnapshot } = await load('dist/publish/adapter.js');
const { APPROVED_MEDIA_REGISTRY } = await load('dist/storage/media-registry.js');
const { validateFinanceModuleData, isPublicDonorName } = await load('dist/schemas/index.js');
const { receiptKey, normalizeDescription } = await import(pathToFileURL(path.resolve('tools/content-studio/receipt-dedup.mjs')).href);

const ACTOR = 'claude-release@internal';
const AUTH_NOTE = 'Chủ dự án chỉ thị 24/10/2026 (phiên điều phối Orca): thay danh sách công khai bằng nội dung CSV, hiển thị tên người ủng hộ cho các dòng có ngày tuyệt đối; các dòng chưa có ngày giữ riêng tư.';
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

// --- CSV (riêng tư) ---
const text = fs.readFileSync(csvPath, 'utf8');
const csvSha = crypto.createHash('sha256').update(fs.readFileSync(csvPath)).digest('hex');
const rows = [];
{
  const t = text.replace(/^﻿/, '');
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
const recs = data.map((r) => ({ id: r[col.ma_giao_dich], date: r[col.ngay], amount: Number(r[col.so_tien]), name: r[col.ten_nguoi_ung_ho].trim(), note: r[col.ghi_chu] }));
const dated = recs.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
const undated = recs.filter((r) => !r.date);
if (recs.length !== 22 || dated.length !== 6 || undated.length !== 16) throw new Error(`CSV không như dự kiến: ${recs.length}/${dated.length}/${undated.length}`);
if (dated.reduce((a, r) => a + r.amount, 0) !== 492222) throw new Error('tổng dòng có ngày khác 492.222');
const timeOf = (r) => (r.note.split(';')[0] || '').trim();
// Dedup dòng chưa có ngày: giờ + số tiền + tên chuẩn hóa
const seenU = new Map();
for (const r of undated) {
  const k = `${timeOf(r)}|${r.amount}|${normalizeDescription(r.name)}`;
  if (!seenU.has(k)) seenU.set(k, r);
}
const undatedUnique = [...seenU.values()];
const undatedSum = undatedUnique.reduce((a, r) => a + r.amount, 0);
if (undatedUnique.length !== 15 || undatedSum !== 519000) throw new Error(`chưa có ngày sau dedup: ${undatedUnique.length}/${undatedSum}`);
for (const r of dated) if (!isPublicDonorName(r.name)) throw new Error(`tên dòng ${r.id} không hợp lệ để hiển thị`);

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
if (!prev || prev.entries.length !== 6 || prev.entries.some((e) => e.donor !== 'Ẩn danh' || e.donorPublic !== undefined)) throw new Error('verifiedReceipts hiện tại không như dự kiến (6 khoản ẩn danh)');

// Ánh xạ từng dòng CSV → dòng D1 bằng khóa trùng nội bộ (ngày+giờ+số tiền+băm tên); phải 1–1, không dòng dư/thiếu
const byKey = new Map(prev.entries.map((e) => [e.internalKey, e]));
const used = new Set();
const mapRows = dated.map((r) => {
  const key = receiptKey({ date: r.date, time: timeOf(r), amount: r.amount, description: r.name });
  const hit = byKey.get(key);
  if (!hit) throw new Error(`dòng ${r.id} không khớp dòng nào trong D1 (sẽ là dòng mới)`);
  if (used.has(key)) throw new Error(`dòng ${r.id} trùng khóa với dòng CSV khác`);
  used.add(key);
  if (hit.date !== r.date || hit.amount !== r.amount) throw new Error(`dòng ${r.id} lệch ngày/số tiền so với D1`);
  return { csvId: r.id, date: r.date, amount: r.amount, internalKey: key, action: 'replace-name', name: r.name };
});
if (used.size !== prev.entries.length) throw new Error('còn dòng D1 không có trong CSV');

const next = structuredClone(fin.data);
next.verifiedReceipts.entries = prev.entries.map((e) => {
  const m = mapRows.find((x) => x.internalKey === e.internalKey);
  return { date: e.date, amount: e.amount, donor: m.name, donorPublic: true, internalKey: e.internalKey, sourceTag: e.sourceTag };
});
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
const expectPub = prev.entries.map((e) => ({ date: e.date, donor: mapRows.find((x) => x.internalKey === e.internalKey).name, amount: e.amount }));
if (JSON.stringify(pf.verifiedReceipts.entries) !== JSON.stringify(expectPub)) throw new Error('snapshot công khai không đúng 6 dòng (ngày, tên, số tiền) mong đợi');
// Tích hợp: bản chụp Studio phải đi qua validator/sanitizer công khai (repo public) và cho đúng 6 dòng ngày/tên/số tiền từ CSV
const vrPub = pf.verifiedReceipts;
if (vrPub.donorNamesApproval !== 'owner-authorized') throw new Error('bản chụp thiếu donorNamesApproval');
const pubErrors = pub.validateVerifiedReceipts(vrPub, false);
if (pubErrors.length) throw new Error('validator công khai từ chối bản chụp Studio: ' + pubErrors.join('; '));
const projErrors = pub.validateDonationProjection({ reconciled: false, reconciledAt: null, publicApproval: 'pending', entries: [], verifiedReceipts: vrPub });
if (!projErrors.isValid) throw new Error('validateDonationProjection từ chối: ' + projErrors.errors.join('; '));
if (JSON.stringify(pub.sanitizeVerifiedReceipts(vrPub)) !== JSON.stringify(vrPub)) throw new Error('sanitize công khai làm đổi bản chụp Studio');
const csvRowsOut = dated.map((r) => ({ date: r.date, donor: r.name, amount: r.amount }));
const norm = (a) => JSON.stringify([...a].sort((x, y) => (x.date + x.amount + x.donor).localeCompare(y.date + y.amount + y.donor)));
if (norm(csvRowsOut) !== norm(vrPub.entries)) throw new Error('6 dòng bản chụp khác CSV (ngày/tên/số tiền)');
if (JSON.stringify(Object.keys(vrPub).sort()) !== JSON.stringify(['basis', 'coveredFrom', 'coveredTo', 'donorNamesApproval', 'entries', 'publicApproval', 'scope', 'verifiedAt', 'verifiedBy'])) throw new Error('khối công khai có khóa ngoài allowlist');
const integration = { studioSnapshotPassesPublicValidator: true, publicSanitizeIdempotent: true, rowsEqualCsv: true, marker: vrPub.donorNamesApproval, blockKeys: Object.keys(vrPub).sort(), entryKeys: [...new Set(vrPub.entries.flatMap((e) => Object.keys(e)))].sort() };
const snapText = JSON.stringify(snap.snapshot);
for (const bad of ['internalKey', 'sourceTag', 'donorPublic', 'l1:20', 'NOIBO']) if (snapText.includes(bad)) throw new Error('snapshot rò rỉ ' + bad);
const HOLDER = String(next.donationAccount?.accountHolder || '').toUpperCase();
for (const r of undated) {
  if (r.name && r.name.toUpperCase() !== HOLDER && snapText.toUpperCase().includes(r.name.toUpperCase())) throw new Error('snapshot rò rỉ tên dòng chưa có ngày');
  if (r.note && snapText.includes(r.note)) throw new Error('snapshot rò rỉ ghi chú CSV');
}

const pendings = await all("SELECT id FROM publications WHERE status = 'pending_review'");
if (pendings.length !== 1 || !pendings[0].id.endsWith('-l1r1')) throw new Error('pending_review không như dự kiến ' + JSON.stringify(pendings));
const SUPERSEDED = 'Thay thế bởi bản chụp L2 (tên người ủng hộ được chủ dự án cho phép, 24/10/2026); snapshot cũ giữ nguyên, không được công bố.';
const pubId = `pub-${stamp}-l2r1`;
const idemKey = `l2-donor-names-${newHash.slice(0, 12)}`;
const guard = `(SELECT revision_hash FROM drafts WHERE module_key = 'finance') = ${q(newHash)}` +
  ['project', 'products', 'journal', 'team'].map((m) => ` AND (SELECT revision_hash FROM drafts WHERE module_key = '${m}') = ${q(beforeHashes[m])}`).join('');
const audit = (id, action, module, details) => `INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) SELECT ${q(id)}, ${q(ACTOR)}, ${q(action)}, ${q(module)}, ${q(JSON.stringify(details))}, ${q(now)} WHERE`;

const parts = [];
parts.push(`UPDATE drafts SET data_json = ${q(dataJson)}, revision_hash = ${q(newHash)}, updated_by = ${q(ACTOR)}, updated_at = ${q(now)} WHERE module_key = 'finance' AND revision_hash = ${q(fin.hash)};`);
parts.push(`INSERT INTO revisions (id, module_key, version, data_json, revision_hash, created_by, created_at, comment) SELECT ${q(`rev-finance-${finVer}-${stamp}`)}, 'finance', ${finVer}, ${q(dataJson)}, ${q(newHash)}, ${q(ACTOR)}, ${q(now)}, ${q('L2: hiển thị tên 6 khoản có ngày tuyệt đối theo chỉ thị chủ dự án; không đổi ngày/số tiền; không phải đối soát đầy đủ')} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer});`);
parts.push(audit(`aud-${stamp}-fin`, 'SAVE_DRAFT', 'finance', { version: finVer, revisionHash: newHash, comment: AUTH_NOTE, namesPublished: mapRows.length, rowsAdded: 0, undatedRowsExcluded: undated.length }) + ` EXISTS (SELECT 1 FROM revisions WHERE module_key = 'finance' AND version = ${finVer} AND revision_hash = ${q(newHash)});`);
parts.push(`UPDATE publications SET status = 'draft', error_message = ${q(SUPERSEDED)} WHERE id = ${q(pendings[0].id)} AND status = 'pending_review' AND ${guard};`);
parts.push(audit(`aud-${stamp}-rej`, 'REJECT_PUBLICATION', 'publish', { publicationId: pendings[0].id, comment: SUPERSEDED }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pendings[0].id)} AND error_message = ${q(SUPERSEDED)});`);
parts.push(`INSERT INTO publications (id, snapshot_json, status, requested_by, approved_by, second_reviewer, published_at, git_ref, deploy_status, error_message, idempotency_key, deployment_verified_at, created_at) SELECT ${q(pubId)}, ${q(JSON.stringify(snap.snapshot))}, 'pending_review', ${q(ACTOR)}, NULL, NULL, NULL, NULL, 'unknown', NULL, ${q(idemKey)}, NULL, ${q(now)} WHERE ${guard} AND NOT EXISTS (SELECT 1 FROM publications WHERE idempotency_key = ${q(idemKey)});`);
parts.push(audit(`aud-${stamp}-req`, 'REQUEST_PUBLICATION', 'publish', { publicationId: pubId, snapshotSha256: snap.snapshot.sha256, idempotencyKey: idemKey }) + ` EXISTS (SELECT 1 FROM publications WHERE id = ${q(pubId)});`);
const sql = parts.join('\n') + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(privDir, { recursive: true });
fs.writeFileSync(path.join(privDir, 'l2-release-d1.sql'), sql); // gói SQL chứa tên → chỉ ở thư mục riêng tư

const counts = async () => ({ revisions: (await one('SELECT COUNT(*) c FROM revisions')).c, publications: (await one('SELECT COUNT(*) c FROM publications')).c, audit: (await one('SELECT COUNT(*) c FROM audit_logs')).c, media: (await one('SELECT COUNT(*) c FROM media_assets')).c, preorders: (await one('SELECT COUNT(*) c FROM preorders')).c });
const c0 = await counts();
await db.exec(sql);
const c1 = await counts();
const afterRows = await all('SELECT module_key, data_json, revision_hash FROM drafts');
const after = Object.fromEntries(afterRows.map((r) => [r.module_key, { data: JSON.parse(r.data_json), hash: r.revision_hash }]));
// Mọi trường finance khác verifiedReceipts.entries giống byte-for-byte; mỗi dòng chỉ đổi donor/donorPublic
const strip = (d) => { const c = structuredClone(d); c.verifiedReceipts.entries = c.verifiedReceipts.entries.map((e) => ({ date: e.date, amount: e.amount, internalKey: e.internalKey, sourceTag: e.sourceTag })); return JSON.stringify(c); };
const finOk = strip(fin.data) === strip(after.finance.data);
const protectedOk = ['project', 'products', 'journal', 'team'].every((m) => after[m].hash === beforeHashes[m]);
const ok = finOk && protectedOk && after.finance.hash === newHash && c1.revisions === c0.revisions + 1 && c1.publications === c0.publications + 1 && c1.audit === c0.audit + 3 && c1.media === c0.media && c1.preorders === c0.preorders
  && after.finance.data.reconciled === false && after.finance.data.entries.length === 0 && !after.finance.data.firstSigner && !after.finance.data.secondSigner;

const summary = {
  csv: { sha256: csvSha, rows: recs.length, dated: dated.length, datedSum: 492222, undatedRaw: undated.length, undatedUniqueAfterDedup: undatedUnique.length, undatedUniqueSum: undatedSum, duplicatesRemoved: undated.length - undatedUnique.length },
  rowMap: mapRows.map(({ name, ...rest }) => rest), // không có tên
  replace: { matchedExistingD1Rows: mapRows.length, newRows: 0, duplicateRows: 0, unmatchedD1Rows: 0, namesChanged: mapRows.length },
  beforeFinanceHash: fin.hash, newFinanceHash: newHash, financeVersion: finVer, publicationId: pubId, supersededPublication: pendings[0].id, snapshotSha256: snap.snapshot.sha256,
  integration, beforeHashes, c0, c1, finOk, protectedOk, ok,
  pubs: (await all('SELECT id, status FROM publications ORDER BY created_at')).map((p) => `${p.id}:${p.status}`),
  sqlSha256: crypto.createHash('sha256').update(sql).digest('hex'),
};
fs.writeFileSync(path.join(outDir, 'l2-release-d1-plan.json'), JSON.stringify(summary, null, 2));
// Bản đồ có tên: chỉ riêng tư
fs.writeFileSync(path.join(privDir, 'l2-row-map-private.json'), JSON.stringify({ dated: mapRows, undatedPending: undatedUnique.map((r) => ({ csvId: r.id, amount: r.amount, time: timeOf(r) })), undatedDuplicateIds: undated.filter((r) => !undatedUnique.includes(r)).map((r) => r.id) }, null, 2));
console.log(JSON.stringify(summary, null, 1));
if (!ok) process.exit(1);
