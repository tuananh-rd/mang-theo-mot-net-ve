/**
 * Kiểm thử ủng hộ trực tuyến (Task C07 vòng 3).
 * Chạy: node --test tests/donations.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { DONATION_ACCOUNT, DONATIONS } from '../src/data/campaign.ts';
import {
  isDonationOpen,
  validateDonation,
  summarizeDonations,
  sortDonationsNewestFirst,
  formatViDate,
} from '../src/lib/donations.ts';

const activeAccount = {
  status: 'active',
  bankName: 'Ngân hàng thử',
  accountNumber: '0000',
  accountHolder: 'TEN THU',
  qrImage: '/images/ung-ho/qr.png',
  transferPrefix: 'MTMNV',
  ledgerUpdatedAt: '2026-11-01',
};

describe('Ủng hộ trực tuyến (Task C07)', () => {
  test('Dữ liệu hiện tại: kênh chưa mở, chưa có tài khoản, QR hay dòng sao kê nào', () => {
    assert.equal(DONATION_ACCOUNT.status, 'pending');
    assert.equal(DONATION_ACCOUNT.accountNumber, null);
    assert.equal(DONATION_ACCOUNT.qrImage, null);
    assert.equal(isDonationOpen(DONATION_ACCOUNT), false);
    assert.deepEqual(DONATIONS, []);
  });

  test('isDonationOpen chỉ đúng khi status active và đủ 4 trường', () => {
    assert.equal(isDonationOpen(activeAccount), true);
    for (const key of ['bankName', 'accountNumber', 'accountHolder', 'qrImage']) {
      assert.equal(isDonationOpen({ ...activeAccount, [key]: null }), false, key);
      assert.equal(isDonationOpen({ ...activeAccount, [key]: '  ' }), false, key);
    }
    assert.equal(isDonationOpen({ ...activeAccount, status: 'pending' }), false);
  });

  test('Kênh chưa mở: tổng là null (không phải 0đ); có dòng sao kê thì báo lỗi', () => {
    assert.deepEqual(summarizeDonations([], false), { total: null, count: null, latestDate: null });
    assert.throws(() => summarizeDonations([{ date: '2026-11-01', donor: 'A', amount: 50000, reference: null }], false));
  });

  test('Kênh đã mở: cộng đúng tổng, đếm lượt, lấy ngày mới nhất; chưa có giao dịch thì 0', () => {
    assert.deepEqual(summarizeDonations([], true), { total: 0, count: 0, latestDate: null });
    const rows = [
      { date: '2026-11-02', donor: 'Ẩn danh', amount: 100000, reference: 'A1B2' },
      { date: '2026-11-05', donor: 'Bạn B', amount: 50000, reference: null },
    ];
    assert.deepEqual(summarizeDonations(rows, true), { total: 150000, count: 2, latestDate: '2026-11-05' });
  });

  test('validateDonation từ chối số tiền không hợp lệ, ngày sai định dạng và tên trống', () => {
    const ok = { date: '2026-11-02', donor: 'A', amount: 1000, reference: null };
    assert.doesNotThrow(() => validateDonation(ok));
    assert.throws(() => validateDonation({ ...ok, amount: 0 }));
    assert.throws(() => validateDonation({ ...ok, amount: -5000 }));
    assert.throws(() => validateDonation({ ...ok, amount: 1500.5 }));
    assert.throws(() => validateDonation({ ...ok, date: '02/11/2026' }));
    assert.throws(() => validateDonation({ ...ok, date: '2026-02-30' }));
    assert.throws(() => validateDonation({ ...ok, donor: '  ' }));
  });

  test('Sắp xếp mới nhất trước, không đổi mảng gốc; định dạng ngày tiếng Việt', () => {
    const rows = [
      { date: '2026-11-01', donor: 'A', amount: 1, reference: null },
      { date: '2026-11-03', donor: 'B', amount: 1, reference: null },
    ];
    const sorted = sortDonationsNewestFirst(rows);
    assert.deepEqual(sorted.map((r) => r.donor), ['B', 'A']);
    assert.equal(rows[0].donor, 'A');
    assert.equal(formatViDate('2026-11-03'), '03/11/2026');
    assert.equal(formatViDate(null), 'Chưa cập nhật');
  });
});
