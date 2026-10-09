/**
 * Logic ủng hộ trực tuyến (C07 vòng 3).
 * - Chỉ coi kênh ủng hộ là mở khi tài khoản có đủ thông tin thật và status 'active'.
 * - Sao kê chỉ gồm giao dịch đã đối soát; số tiền là số nguyên VND dương.
 * - Không đổi dữ liệu thiếu thành 0: khi kênh chưa mở, tổng ủng hộ là null.
 */

import type { DonationAccount, DonationEntry } from '../data/campaign';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Kênh ủng hộ mở khi status 'active' và đủ ngân hàng, số tài khoản, chủ tài khoản, ảnh QR. */
export function isDonationOpen(account: DonationAccount): boolean {
  const filled = (v: string | null) => typeof v === 'string' && v.trim().length > 0;
  return (
    account.status === 'active' &&
    filled(account.bankName) &&
    filled(account.accountNumber) &&
    filled(account.accountHolder) &&
    filled(account.qrImage)
  );
}

/** Kiểm tra một dòng sao kê; ném lỗi nếu dữ liệu không hợp lệ thay vì âm thầm bỏ qua. */
export function validateDonation(entry: DonationEntry): void {
  if (!isValidIsoDate(entry.date)) {
    throw new Error(`Ngày ủng hộ không hợp lệ: "${entry.date}" (cần YYYY-MM-DD).`);
  }
  if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
    throw new Error(`Số tiền ủng hộ phải là số nguyên dương: ${entry.amount}.`);
  }
  if (typeof entry.donor !== 'string' || entry.donor.trim().length === 0) {
    throw new Error('Tên hiển thị không được để trống (dùng "Ẩn danh" nếu cần).');
  }
}

export interface DonationSummary {
  /** null khi kênh ủng hộ chưa mở: chưa thể có số liệu, không phải 0đ */
  total: number | null;
  count: number | null;
  latestDate: string | null;
}

/** Tổng hợp sao kê. Kênh chưa mở thì trả null; đã mở mà chưa có giao dịch thì 0. */
export function summarizeDonations(entries: DonationEntry[], open: boolean): DonationSummary {
  entries.forEach(validateDonation);
  if (!open) {
    if (entries.length > 0) {
      throw new Error('Có dòng sao kê nhưng kênh ủng hộ chưa được kích hoạt.');
    }
    return { total: null, count: null, latestDate: null };
  }
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const latestDate = entries.reduce<string | null>((max, e) => (max === null || e.date > max ? e.date : max), null);
  return { total, count: entries.length, latestDate };
}

/** Sắp xếp mới nhất trước; không làm thay đổi mảng gốc. */
export function sortDonationsNewestFirst(entries: DonationEntry[]): DonationEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** YYYY-MM-DD -> DD/MM/YYYY */
export function formatViDate(value: string | null): string {
  if (!value || !isValidIsoDate(value)) return 'Chưa cập nhật';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
