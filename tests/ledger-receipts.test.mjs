/**
 * Kiểm thử khoản ủng hộ đã xác minh một phần (L1).
 * Chạy: node --test tests/ledger-receipts.test.mjs
 * Dòng ứng viên dưới đây là dữ liệu thử tổng hợp, không phải dữ liệu riêng tư.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { DONATION_ACCOUNT, DONATION_LEDGER } from '../src/data/campaign.ts';
import { summarizeLedger, validateLedger, isLedgerReconciled } from '../src/lib/donations.ts';
import { validateDonationProjection, sanitizeVerifiedReceipts, validateVerifiedReceipts, isPublicDonorName } from '../tools/content-studio/csv-validator.mjs';
import { receiptKey, mergeReceipts, normalizeDescription } from '../tools/content-studio/receipt-dedup.mjs';

const raw = JSON.parse(fs.readFileSync(new URL('../src/data/reconciled-donations.json', import.meta.url), 'utf8'));
const base = () => structuredClone(raw);

describe('Dữ liệu công khai đã xác minh một phần', () => {
  test('sáu khoản, tổng 492.222đ, đúng ngày và số tiền được chỉ định', () => {
    const e = raw.verifiedReceipts.entries;
    assert.deepEqual(
      e.map((x) => `${x.date}:${x.amount}`),
      ['2026-10-13:50000', '2026-10-20:20000', '2026-10-20:200000', '2026-10-20:100000', '2026-10-21:100000', '2026-10-21:22222'],
    );
    assert.equal(e.reduce((a, x) => a + x.amount, 0), 492222);
  });

  test('không phải đối soát đầy đủ: reconciled=false, entries rỗng, không có số dư/chi/tổng toàn bộ', () => {
    assert.equal(raw.reconciled, false);
    assert.deepEqual(raw.entries, []);
    assert.equal(isLedgerReconciled(DONATION_LEDGER), false);
    const keys = Object.keys(raw.verifiedReceipts).sort();
    assert.deepEqual(keys, ['basis', 'coveredFrom', 'coveredTo', 'donorNamesApproval', 'entries', 'publicApproval', 'scope', 'verifiedAt', 'verifiedBy']);
    assert.ok(!/balance|so du|số dư|expense|chi phí|outgoing/i.test(JSON.stringify(raw)));
  });

  test('tóm tắt đồng nhất ở mọi nơi: partial, 6 khoản, không đạt mục tiêu', () => {
    const s = summarizeLedger(DONATION_LEDGER, DONATION_ACCOUNT.goalAmount);
    assert.deepEqual([s.scope, s.total, s.count, s.percent, s.reachedGoal], ['partial', 492222, 6, 7, null]);
    assert.equal(DONATION_ACCOUNT.goalAmount, 7000000);
  });

  test('chỉ ngày/tên/số tiền; tên được chủ dự án cho phép; không giờ, mã tham chiếu, mô tả, điện thoại', () => {
    assert.equal(raw.verifiedReceipts.donorNamesApproval, 'owner-authorized');
    for (const e of raw.verifiedReceipts.entries) {
      assert.deepEqual(Object.keys(e).sort(), ['amount', 'date', 'donor']);
      assert.ok(isPublicDonorName(e.donor), 'tên hiển thị hợp lệ');
      assert.notEqual(e.donor, 'Ẩn danh');
    }
    assert.equal(new Set(raw.verifiedReceipts.entries.map((e) => e.donor)).size, 6, 'sáu tên khác nhau, không dòng trùng');
    const text = JSON.stringify(raw);
    assert.ok(!/\d{4}-\d{2}-\d{2}T|\b\d{2}:\d{2}\b|\b0\d{9}\b|\+84|MoMo|chuyen tien|153\d{8}/i.test(text));
  });

  test('khoản chuyển ra 13/10 13:48 và khoản 09/10 đã xóa không có trong dữ liệu', () => {
    const ds = raw.verifiedReceipts.entries.map((x) => `${x.date}:${x.amount}`);
    assert.ok(!ds.includes('2026-10-09:50000'));
    assert.equal(ds.filter((x) => x === '2026-10-13:50000').length, 1, 'chỉ một dòng 13/10, là khoản nhận');
    assert.ok(raw.verifiedReceipts.coveredFrom >= '2026-10-13');
  });
});

describe('Xác thực lược đồ một phần', () => {
  test('bản gốc hợp lệ', () => {
    assert.deepEqual(validateDonationProjection(base()), { isValid: true, errors: [] });
    assert.doesNotThrow(() => validateLedger(DONATION_LEDGER));
  });

  const mutations = {
    'trường lạ trong khối (mã tham chiếu)': (p) => { p.verifiedReceipts.reference = 'X'; },
    'trường lạ trong dòng (giờ)': (p) => { p.verifiedReceipts.entries[0].time = '13:50'; },
    'trường lạ trong dòng (mô tả)': (p) => { p.verifiedReceipts.entries[0].description = 'abc'; },
    'tên khi chưa có donorNamesApproval': (p) => { delete p.verifiedReceipts.donorNamesApproval; },
    'donorNamesApproval sai giá trị': (p) => { p.verifiedReceipts.donorNamesApproval = 'yes'; },
    'tên chứa chữ số (số định danh)': (p) => { p.verifiedReceipts.entries[0].donor = 'NGUYEN VAN A 0912345678'; },
    'tên là email': (p) => { p.verifiedReceipts.entries[0].donor = 'a@b.vn'; },
    'tên là URL': (p) => { p.verifiedReceipts.entries[0].donor = 'http://x.vn'; },
    'tên rỗng': (p) => { p.verifiedReceipts.entries[0].donor = ''; },
    'chưa phê duyệt công khai': (p) => { p.verifiedReceipts.publicApproval = 'pending'; },
    'sai phạm vi (scope)': (p) => { p.verifiedReceipts.scope = 'full'; },
    'ngày ngoài phạm vi': (p) => { p.verifiedReceipts.entries[0].date = '2026-10-09'; },
    'khoảng ngày đảo ngược': (p) => { p.verifiedReceipts.coveredFrom = '2026-10-22'; },
    'bao phủ vượt ngày xác minh': (p) => { p.verifiedReceipts.coveredTo = '2026-10-25'; },
    'email trong người xác minh': (p) => { p.verifiedReceipts.verifiedBy = ['a@b.c']; },
    'số tiền không nguyên': (p) => { p.verifiedReceipts.entries[0].amount = 1.5; },
    'danh sách rỗng': (p) => { p.verifiedReceipts.entries = []; },
    'dùng cùng sổ đối soát đầy đủ': (p) => { p.reconciled = true; p.reconciledAt = '2026-10-24'; p.publicApproval = 'approved'; p.reconciledBy = ['x']; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    test(`từ chối: ${name}`, () => {
      const p = base();
      mutate(p);
      assert.equal(validateDonationProjection(p).isValid, false);
    });
  }

  test('số tiền không an toàn và tổng tràn số nguyên an toàn bị từ chối', () => {
    const big = Number.MAX_SAFE_INTEGER;
    const over = base();
    over.verifiedReceipts.entries = [{ date: '2026-10-20', donor: 'Ẩn danh', amount: big }, { date: '2026-10-20', donor: 'Ẩn danh', amount: 5 }];
    assert.equal(validateDonationProjection(over).isValid, false);
    assert.match(validateDonationProjection(over).errors.join(' '), /an toàn/);
    const unsafe = base();
    unsafe.verifiedReceipts.entries[0].amount = 2 ** 53;
    assert.equal(validateDonationProjection(unsafe).isValid, false);
    const ledgerOver = { ...DONATION_LEDGER, verifiedReceipts: { ...DONATION_LEDGER.verifiedReceipts, entries: over.verifiedReceipts.entries } };
    assert.throws(() => validateLedger(ledgerOver), /an toàn/);
  });

  test('reconciled=false vẫn không cho dòng ở entries (không giả lập sổ đầy đủ)', () => {
    const p = base();
    p.entries = [{ date: '2026-10-20', donor: 'Ẩn danh', amount: 1000 }];
    assert.equal(validateDonationProjection(p).isValid, false);
    assert.throws(() => validateLedger({ ...DONATION_LEDGER, entries: [{ date: '2026-10-20', donor: 'Ẩn danh', amount: 1000 }] }));
  });

  test('sanitizeVerifiedReceipts chỉ giữ allowlist; tên chỉ khi đã được cho phép', () => {
    const dirty = base().verifiedReceipts;
    dirty.entries[0] = { ...dirty.entries[0], reference: 'R', time: '13:50', donor: 'Tên Hợp Lệ' };
    const clean = sanitizeVerifiedReceipts(dirty);
    assert.deepEqual(Object.keys(clean.entries[0]).sort(), ['amount', 'date', 'donor']);
    assert.equal(clean.entries[0].donor, 'Tên Hợp Lệ');
    assert.deepEqual(validateVerifiedReceipts(clean, false), []);
    const noApproval = base().verifiedReceipts;
    delete noApproval.donorNamesApproval;
    const anon = sanitizeVerifiedReceipts(noApproval);
    assert.ok(anon.entries.every((e) => e.donor === 'Ẩn danh'));
    assert.equal('donorNamesApproval' in anon, false);
    const badName = base().verifiedReceipts;
    badName.entries[1].donor = 'A 0912345678';
    assert.equal(sanitizeVerifiedReceipts(badName).entries[1].donor, 'Ẩn danh');
  });

  test('validateLedger (runtime) từ chối tên khi thiếu cho phép hoặc tên không hợp lệ', () => {
    const noApproval = structuredClone(DONATION_LEDGER);
    delete noApproval.verifiedReceipts.donorNamesApproval;
    assert.throws(() => validateLedger(noApproval), /chủ dự án/);
    const bad = structuredClone(DONATION_LEDGER);
    bad.verifiedReceipts.entries[0].donor = 'X 0912345678';
    assert.throws(() => validateLedger(bad), /chủ dự án/);
  });

  test('isPublicDonorName: chấp nhận tên có dấu/viết hoa, từ chối số, email, URL, khoảng trắng thừa', () => {
    for (const ok of ['PHAM HOANG LONG', 'Nguyễn Thị Hải Yến', "O'Brien-Lê"]) assert.equal(isPublicDonorName(ok), true, ok);
    for (const bad of ['', ' A', 'A  B', 'A1', 'a@b.c', 'http://x', 'A\nB', 'A_B', 'Ẩn']) assert.equal(isPublicDonorName(bad), bad === 'Ẩn', bad);
  });

  test('tóm tắt không bao giờ gọi là đã đối soát khi chỉ có khối một phần', () => {
    const s = summarizeLedger({ ...DONATION_LEDGER }, 7000000);
    assert.equal(s.reconciledAt, null);
    assert.equal(s.scope, 'partial');
  });
});

describe('Khử trùng và idempotence (nhập từ ảnh sao kê)', () => {
  const r = (date, time, amount, description) => ({ date, time, amount, description });
  const a = r('2026-10-20', '21:24', 100000, 'NGUYEN A chuyen tien');
  const aSecondScreenshot = r('2026-10-20', '21:24', 100000, 'Nguyen  A  chuyển tiền');
  const b = r('2026-10-21', '09:13', 100000, 'B chuyen tien');
  const sameAmountOtherTime = r('2026-10-20', '21:25', 100000, 'NGUYEN A chuyen tien');

  test('chuẩn hóa mô tả bỏ dấu/khoảng trắng/chữ hoa', () => {
    assert.equal(normalizeDescription('Nguyễn  Đức  chuyển-tiền'), 'NGUYEN DUC CHUYEN TIEN');
    assert.equal(receiptKey(a), receiptKey(aSecondScreenshot));
  });

  test('cùng giao dịch xuất hiện ở hai ảnh chỉ tính một lần', () => {
    const { added, duplicates } = mergeReceipts([], [a, aSecondScreenshot, b]);
    assert.equal(added.length, 2);
    assert.equal(duplicates.length, 1);
  });

  test('khác giờ hoặc khác số tiền là giao dịch khác', () => {
    assert.notEqual(receiptKey(a), receiptKey(sameAmountOtherTime));
    assert.notEqual(receiptKey(a), receiptKey({ ...a, amount: 100001 }));
    assert.equal(mergeReceipts([], [a, sameAmountOtherTime]).added.length, 2);
  });

  test('idempotent: nhập lại không thêm dòng nào; tổng không đổi', () => {
    const first = mergeReceipts([], [a, b]);
    const second = mergeReceipts(first.keys, [a, b, aSecondScreenshot]);
    assert.equal(second.added.length, 0);
    assert.equal(second.duplicates.length, 3);
    assert.equal(first.added.reduce((s, x) => s + x.amount, 0), 200000);
  });

  test('khóa nội bộ không chứa tên hay mã tham chiếu', () => {
    const key = receiptKey(a);
    assert.ok(!/NGUYEN|chuyen/i.test(key));
    assert.match(key, /^l1:\d{4}-\d{2}-\d{2}:\d{2}:\d{2}:\d+:[0-9a-f]{8}$/);
  });
});

describe('Quét riêng tư mã nguồn và tài liệu (C21)', () => {
  const root = path.resolve('.');
  const scanDirs = ['src', 'public', 'tools', 'tests', 'docs'];
  const skip = new Set(['node_modules', 'dist', '.astro']);
  function walk(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(full));
      else if (/\.(ts|mjs|astro|json|md|txt|html|js|css|map|csv)$/.test(e.name)) out.push(full);
    }
    return out;
  }
  const privateManifest = 'C:/Users/tuana/Documents/Codex/2026-10-24/L1-ledger-private/coordinator-visual-review.json';

  test('không có tên người gửi của khoản chưa công bố trong repo (nếu có manifest riêng trên máy này)', { skip: !fs.existsSync(privateManifest) }, () => {
    const m = JSON.parse(fs.readFileSync(privateManifest, 'utf8'));
    // Sáu khoản có ngày đã được chủ dự án cho phép hiển thị tên; chỉ quét các khoản chưa công bố và khoản không khôi phục.
    const names = [...m.pending, m.neverRestore].map((x) => x.privateDonor).filter(Boolean)
      .filter((n) => n !== DONATION_ACCOUNT.accountHolder); // chủ tài khoản nhận ủng hộ đã được công bố công khai theo chỉ đạo chủ dự án
    for (const dir of scanDirs) {
      for (const f of walk(path.join(root, dir))) {
        const text = fs.readFileSync(f, 'utf8').toUpperCase();
        for (const n of names) {
          assert.ok(!text.includes(n.toUpperCase()), `${path.relative(root, f)} chứa tên người gửi riêng tư`);
        }
      }
    }
  });

  test('không có ảnh sao kê hay tệp JPG nguồn trong public/', () => {
    const bad = [];
    (function scan(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) scan(full);
        else if (/^1792773391\d+_/.test(e.name) || /sao-?ke|statement|bien-dong/i.test(e.name)) bad.push(full);
      }
    })(path.join(root, 'public'));
    assert.deepEqual(bad, []);
  });
});
