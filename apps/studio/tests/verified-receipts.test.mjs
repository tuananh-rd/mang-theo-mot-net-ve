import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createPublicationSnapshot } from '../dist/publish/adapter.js';
import { LocalD1Database } from '../dist/db/emulator.js';
import { StudioDbClient } from '../dist/db/client.js';
import {
  DEFAULT_PROJECT_DATA,
  DEFAULT_JOURNAL_DATA,
  DEFAULT_PRODUCTS_DATA,
  DEFAULT_FINANCE_DATA,
  DEFAULT_TEAM_DATA,
  validateFinanceModuleData,
  validateVerifiedReceiptsData,
} from '../dist/schemas/index.js';

// Dữ liệu thử tổng hợp; không phải dữ liệu riêng tư.
const block = (over = {}) => ({
  scope: 'partial-verified-receipts',
  publicApproval: 'approved',
  verifiedAt: '2026-10-24',
  coveredFrom: '2026-10-13',
  coveredTo: '2026-10-21',
  basis: 'owner-provided-bank-statement-screenshots',
  verifiedBy: ['Chủ dự án (cung cấp và chỉ định khoản)', 'Rà soát nội bộ độc lập của nhóm hỗ trợ kỹ thuật'],
  entries: [
    { date: '2026-10-13', amount: 50000, donor: 'Ẩn danh', internalKey: 'l1:2026-10-13:13:50:50000:aaaaaaaa', sourceTag: 'owner-screenshots-l1' },
    { date: '2026-10-20', amount: 20000, internalKey: 'l1:2026-10-20:17:12:20000:bbbbbbbb', sourceTag: 'owner-screenshots-l1' },
  ],
  ...over,
});
const finance = (vr, over = {}) => ({ ...structuredClone(DEFAULT_FINANCE_DATA), verifiedReceipts: vr, ...over });
const drafts = (fin) => ({
  project: DEFAULT_PROJECT_DATA,
  journal: DEFAULT_JOURNAL_DATA,
  products: DEFAULT_PRODUCTS_DATA,
  finance: fin,
  team: DEFAULT_TEAM_DATA,
});

test('Bản chụp công khai giữ verifiedReceipts đã duyệt, chỉ ngày/tiền/ẩn danh, và không giả đối soát', async () => {
  const r = await createPublicationSnapshot(drafts(finance(block())), 'vL1-01');
  assert.equal(r.isEligibleForPublish, true, JSON.stringify(r.validationErrors));
  const f = r.snapshot.modules.finance;
  assert.equal(f.reconciled, false);
  assert.deepEqual(f.entries, []);
  assert.equal(f.publicApproval, 'pending');
  assert.equal(f.verifiedReceipts.scope, 'partial-verified-receipts');
  assert.deepEqual(f.verifiedReceipts.entries, [
    { date: '2026-10-13', donor: 'Ẩn danh', amount: 50000 },
    { date: '2026-10-20', donor: 'Ẩn danh', amount: 20000 },
  ]);
  const text = JSON.stringify(r.snapshot);
  assert.ok(!text.includes('internalKey') && !text.includes('sourceTag') && !text.includes('l1:2026'));
  assert.ok(!/firstSigner|secondSigner/.test(JSON.stringify(f)));
});

test('verifiedReceipts chưa duyệt công khai thì không vào bản chụp', async () => {
  const r = await createPublicationSnapshot(drafts(finance(block({ publicApproval: 'pending' }))), 'vL1-02');
  assert.equal(r.snapshot.modules.finance.verifiedReceipts, undefined);
});

test('khối không hợp lệ bị từ chối: ngoài phạm vi, email, trùng khóa, dùng cùng sổ đầy đủ', () => {
  const bad = [
    block({ entries: [{ date: '2026-10-09', amount: 50000 }] }),
    block({ verifiedBy: ['a@b.c'] }),
    block({ entries: [{ date: '2026-10-13', amount: 1, internalKey: 'k' }, { date: '2026-10-13', amount: 1, internalKey: 'k' }] }),
    block({ coveredTo: '2026-10-25' }),
    block({ scope: 'full' }),
  ];
  for (const b of bad) assert.ok(validateVerifiedReceiptsData(b, false).length > 0, JSON.stringify(b).slice(0, 80));
  assert.ok(validateVerifiedReceiptsData(block(), true).length > 0);
  assert.equal(validateFinanceModuleData(finance(block())).isValid, true);
  assert.equal(validateFinanceModuleData(finance(block({ scope: 'x' }))).isValid, false);
});

test('số tiền không an toàn và tổng tràn bị từ chối', () => {
  const big = Number.MAX_SAFE_INTEGER;
  assert.ok(validateVerifiedReceiptsData(block({ entries: [{ date: '2026-10-13', amount: big }, { date: '2026-10-13', amount: 5 }] }), false).some((e) => /an toàn/.test(e)));
  assert.ok(validateVerifiedReceiptsData(block({ entries: [{ date: '2026-10-13', amount: 2 ** 53 }] }), false).length > 0);
});

test('không có chữ ký hai người: sổ đầy đủ không thể bật bằng verifiedReceipts', async () => {
  const forged = finance(block(), { reconciled: true, reconciledAt: '2026-10-24', publicApproval: 'approved', reconciledBy: ['x'] });
  const r = await createPublicationSnapshot(drafts(forged), 'vL1-03');
  assert.equal(r.snapshot.modules.finance.reconciled, false);
  assert.equal(r.snapshot.modules.finance.verifiedReceipts, undefined);
  assert.equal(r.isEligibleForPublish, false);
});

test('Lưu bản nháp finance giữ nguyên verifiedReceipts, vòng lưu UI (spread) không làm mất', async () => {
  const dir = path.join(os.tmpdir(), 'test-vr-' + Date.now());
  const schemaSql = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf-8');
  try {
    const d1 = new LocalD1Database(path.join(dir, 'vr.sqlite'), schemaSql);
    const db = new StudioDbClient(d1);
    const first = await db.saveDraft('finance', finance(block()), null, 'editor@internal.vn', 'nhập khoản đã xác minh');
    const d = await db.getDraft('finance');
    assert.equal(d.data.verifiedReceipts.entries.length, 2);
    assert.equal(d.data.reconciled, false);
    assert.equal(d.data.firstSigner, null);
    // Mô phỏng thao tác của giao diện: { ...activeDraft.data, overview: ... }
    const overview = { ...d.data.overview, actualStatusNotice: 'Cập nhật ghi chú' };
    await db.saveDraft('finance', { ...d.data, overview }, d.revisionHash, 'editor@internal.vn', 'Cập nhật tổng quan');
    const after = await db.getDraft('finance');
    assert.deepEqual(after.data.verifiedReceipts, d.data.verifiedReceipts);
    assert.equal(first.draft.data.verifiedReceipts.entries[0].internalKey.startsWith('l1:'), true);
    d1.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
