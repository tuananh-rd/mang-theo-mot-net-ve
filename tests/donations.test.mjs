/**
 * Kiểm thử ủng hộ trực tuyến và sổ đã đối soát (Task C07S).
 * Chạy: node --test tests/donations.test.mjs
 * Các số tiền dưới đây là dữ liệu thử chỉ dùng trong test, không đưa vào app.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { DONATION_ACCOUNT, DONATION_LEDGER, OFFICIAL_CONTACT, PROJECT_PROGRESS, PLANNED_SESSIONS, TEAM_MEMBERS } from '../src/data/campaign.ts';
import {
  isDonationOpen,
  isLedgerReconciled,
  validateDonation,
  validateLedger,
  summarizeLedger,
  sortDonationsNewestFirst,
  formatViDate,
} from '../src/lib/donations.ts';

const entry = (date, amount, reference = null, donor = 'Ẩn danh') => ({ date, donor, amount, reference });
const ledger = (entries, reconciledAt = '2026-10-20') => ({ reconciled: true, reconciledAt, entries });

describe('Tài khoản và sổ ủng hộ hiện tại (C07S)', () => {
  test('Tài khoản Techcombank do nhóm cung cấp đang mở, mục tiêu 3.000.000đ', () => {
    assert.equal(DONATION_ACCOUNT.bankName, 'Techcombank');
    assert.equal(DONATION_ACCOUNT.accountNumber, '999927052006');
    assert.equal(DONATION_ACCOUNT.accountHolder, 'LE TUAN ANH');
    assert.equal(DONATION_ACCOUNT.goalAmount, 3000000);
    assert.equal(isDonationOpen(DONATION_ACCOUNT), true);
  });

  test('Chưa có sổ đối soát: tổng và tỷ lệ là null, không phải 0đ, dù tài khoản đã mở', () => {
    assert.equal(isLedgerReconciled(DONATION_LEDGER), false);
    assert.deepEqual(DONATION_LEDGER.entries, []);
    const s = summarizeLedger(DONATION_LEDGER, DONATION_ACCOUNT.goalAmount);
    assert.equal(s.total, null);
    assert.equal(s.percent, null);
    assert.equal(s.count, null);
    assert.equal(s.reachedGoal, null);
  });

  test('Liên hệ, lịch, tiến độ và thành viên khớp tài liệu bổ sung', () => {
    assert.deepEqual(OFFICIAL_CONTACT.people.map((p) => p.phoneE164), ['+84984441726', '+84343999199']);
    assert.equal(OFFICIAL_CONTACT.fanpageUrl, 'https://www.facebook.com/mangtheomotnetve');
    assert.deepEqual(PLANNED_SESSIONS.map((s) => `${s.date} ${s.time}`), ['2026-10-24 14:00', '2026-10-31 14:00']);
    for (const s of PLANNED_SESSIONS) assert.equal(new Date(`${s.date}T00:00:00Z`).getUTCDay(), 6, `${s.date} phải là Thứ Bảy`);
    assert.equal(PROJECT_PROGRESS.currentWeek, 1);
    assert.equal(PROJECT_PROGRESS.totalWeeks, 5);
    assert.equal(TEAM_MEMBERS.length, 7);
    assert.equal(new Set(TEAM_MEMBERS.map((m) => m.photo)).size, 7);
  });
});

describe('Logic sổ ủng hộ (C07S)', () => {
  test('isDonationOpen chỉ đúng khi active và đủ 4 trường', () => {
    for (const key of ['bankName', 'accountNumber', 'accountHolder', 'qrImage']) {
      assert.equal(isDonationOpen({ ...DONATION_ACCOUNT, [key]: null }), false, key);
      assert.equal(isDonationOpen({ ...DONATION_ACCOUNT, [key]: '  ' }), false, key);
    }
    assert.equal(isDonationOpen({ ...DONATION_ACCOUNT, status: 'pending' }), false);
  });

  test('Sổ đã đối soát nhưng chưa có khoản nào: tổng 0đ, 0%', () => {
    const s = summarizeLedger(ledger([]), 3000000);
    assert.deepEqual([s.total, s.count, s.percent, s.reachedGoal], [0, 0, 0, false]);
  });

  test('Tổng dẫn xuất từ các dòng sổ; tỷ lệ theo mục tiêu', () => {
    const s = summarizeLedger(ledger([entry('2026-10-12', 500000, 'A1'), entry('2026-10-15', 250000, 'B2')]), 3000000);
    assert.equal(s.total, 750000);
    assert.equal(s.count, 2);
    assert.equal(s.percent, 25);
    assert.equal(s.reconciledAt, '2026-10-20');
  });

  test('Vượt mục tiêu: thanh giới hạn 100% nhưng tổng giữ số thật', () => {
    const s = summarizeLedger(ledger([entry('2026-10-12', 2000000, 'A1'), entry('2026-10-13', 1500000, 'B2')]), 3000000);
    assert.equal(s.total, 3500000);
    assert.equal(s.percent, 100);
    assert.equal(s.reachedGoal, true);
  });

  test('Không cộng trùng: mã giao dịch lặp lại (không phân biệt hoa thường) bị từ chối', () => {
    assert.throws(() => summarizeLedger(ledger([entry('2026-10-12', 100000, 'ab12'), entry('2026-10-12', 100000, 'AB12')]), 3000000), /trùng/);
  });

  test('Sổ chưa đối soát mà có dòng, hoặc đối soát thiếu ngày: báo lỗi', () => {
    assert.throws(() => validateLedger({ reconciled: false, reconciledAt: null, entries: [entry('2026-10-12', 1000)] }));
    assert.throws(() => validateLedger({ reconciled: true, reconciledAt: null, entries: [] }));
    assert.throws(() => validateLedger({ reconciled: true, reconciledAt: '20/10/2026', entries: [] }));
  });

  test('Khoản có ngày sau ngày đối soát bị từ chối', () => {
    assert.throws(() => validateLedger(ledger([entry('2026-10-21', 1000)], '2026-10-20')), /sau ngày đối soát/);
  });

  test('validateDonation từ chối số tiền, ngày và tên không hợp lệ', () => {
    const ok = entry('2026-10-12', 1000);
    assert.doesNotThrow(() => validateDonation(ok));
    for (const bad of [{ amount: 0 }, { amount: -5000 }, { amount: 1500.5 }, { date: '12/10/2026' }, { date: '2026-02-30' }, { donor: '  ' }]) {
      assert.throws(() => validateDonation({ ...ok, ...bad }), JSON.stringify(bad));
    }
  });

  test('Mục tiêu không hợp lệ bị từ chối; không có mục tiêu thì không có tỷ lệ', () => {
    assert.throws(() => summarizeLedger(ledger([]), 0));
    assert.throws(() => summarizeLedger(ledger([]), -1));
    assert.equal(summarizeLedger(ledger([entry('2026-10-12', 1000)]), null).percent, null);
  });

  test('Sắp xếp mới nhất trước, không đổi mảng gốc; định dạng ngày', () => {
    const rows = [entry('2026-10-11', 1, null, 'A'), entry('2026-10-13', 1, null, 'B')];
    assert.deepEqual(sortDonationsNewestFirst(rows).map((r) => r.donor), ['B', 'A']);
    assert.equal(rows[0].donor, 'A');
    assert.equal(formatViDate('2026-10-24'), '24/10/2026');
    assert.equal(formatViDate(null), 'Chưa cập nhật');
  });
});
