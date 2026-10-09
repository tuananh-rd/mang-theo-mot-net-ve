/**
 * Logic ủng hộ trực tuyến (C07S).
 * - isDonationOpen: tài khoản đã đủ thông tin để nhận chuyển khoản. KHÔNG nói gì về số tiền đã nhận.
 * - isLedgerReconciled: đã có sổ được đối chiếu với sao kê ngân hàng.
 * - Chưa có sổ đã đối soát → tổng/tỷ lệ là null ("Chưa cập nhật"), không phải 0đ.
 * - Tổng luôn dẫn xuất từ các dòng sổ; thanh tiến độ giới hạn 100% nhưng tổng giữ số thật.
 * - Một mã giao dịch chỉ được ghi một lần; không cộng trùng.
 */

import type { DonationAccount, DonationEntry, DonationLedger } from '../data/campaign';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string | null | undefined): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const filled = (v: string | null | undefined) => typeof v === 'string' && v.trim().length > 0;

/** Tài khoản mở khi status 'active' và đủ ngân hàng, số tài khoản, chủ tài khoản, ảnh QR. */
export function isDonationOpen(account: DonationAccount): boolean {
  return (
    account.status === 'active' &&
    filled(account.bankName) &&
    filled(account.accountNumber) &&
    filled(account.accountHolder) &&
    filled(account.qrImage)
  );
}

/** Sổ đã đối soát khi reconciled = true và có ngày đối soát hợp lệ. */
export function isLedgerReconciled(ledger: DonationLedger): boolean {
  return ledger.reconciled === true && isValidIsoDate(ledger.reconciledAt);
}

/** Kiểm một dòng sổ; ném lỗi nếu dữ liệu không hợp lệ thay vì âm thầm bỏ qua. */
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

/** Kiểm toàn bộ sổ: dòng hợp lệ, không trùng mã giao dịch, không có ngày sau ngày đối soát. */
export function validateLedger(ledger: DonationLedger): void {
  if (ledger.reconciled && !isValidIsoDate(ledger.reconciledAt)) {
    throw new Error('Sổ đã đối soát phải có ngày đối soát hợp lệ.');
  }
  if (!ledger.reconciled && ledger.entries.length > 0) {
    throw new Error('Có dòng ủng hộ nhưng sổ chưa được đánh dấu đã đối soát.');
  }
  const seen = new Set<string>();
  for (const entry of ledger.entries) {
    validateDonation(entry);
    if (ledger.reconciledAt && entry.date > ledger.reconciledAt) {
      throw new Error(`Khoản ngày ${entry.date} sau ngày đối soát ${ledger.reconciledAt}.`);
    }
    if (entry.reference) {
      const key = entry.reference.trim().toUpperCase();
      if (seen.has(key)) throw new Error(`Mã giao dịch bị ghi trùng: ${entry.reference}.`);
      seen.add(key);
    }
  }
}

export interface DonationSummary {
  /** null khi chưa có sổ đã đối soát: chưa thể biết, KHÔNG phải 0đ */
  total: number | null;
  count: number | null;
  goal: number | null;
  /** Tỷ lệ cho thanh tiến độ, 0–100; null khi chưa đối soát hoặc chưa có mục tiêu */
  percent: number | null;
  reachedGoal: boolean | null;
  reconciledAt: string | null;
}

export function summarizeLedger(ledger: DonationLedger, goal: number | null): DonationSummary {
  validateLedger(ledger);
  if (goal !== null && (!Number.isInteger(goal) || goal <= 0)) {
    throw new Error(`Mục tiêu phải là số nguyên dương: ${goal}.`);
  }
  if (!isLedgerReconciled(ledger)) {
    return { total: null, count: null, goal, percent: null, reachedGoal: null, reconciledAt: null };
  }
  const total = ledger.entries.reduce((sum, e) => sum + e.amount, 0);
  const percent = goal === null ? null : Math.min(100, Math.floor((total / goal) * 1000) / 10);
  return {
    total,
    count: ledger.entries.length,
    goal,
    percent,
    reachedGoal: goal === null ? null : total >= goal,
    reconciledAt: ledger.reconciledAt,
  };
}

/** Sắp xếp mới nhất trước; không làm thay đổi mảng gốc. */
export function sortDonationsNewestFirst(entries: DonationEntry[]): DonationEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** YYYY-MM-DD -> DD/MM/YYYY */
export function formatViDate(value: string | null | undefined): string {
  if (!isValidIsoDate(value)) return 'Chưa cập nhật';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
