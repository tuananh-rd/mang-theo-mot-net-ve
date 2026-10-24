/**
 * Khử trùng khoản ủng hộ nhập từ ảnh sao kê (L1).
 * Khóa trùng = ngày + giờ + số tiền + mô tả chuẩn hóa (băm). Khóa này chỉ dùng NỘI BỘ
 * (nhập liệu/Studio); không bao giờ đưa vào bản chiếu công khai và không chứa tên hay mã tham chiếu.
 */
import { createHash } from 'node:crypto';

/** Chuẩn hóa mô tả: bỏ dấu, chữ hoa, chỉ giữ chữ-số, gộp khoảng trắng. */
export function normalizeDescription(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

/**
 * @param {{ date: string, time: string, amount: number, description: string }} row
 * @returns {string} khóa nội bộ dạng l1:YYYY-MM-DD:HH:MM:amount:hash8
 */
export function receiptKey(row) {
  const hash = createHash('sha256').update(normalizeDescription(row.description)).digest('hex').slice(0, 8);
  return `l1:${row.date}:${row.time}:${row.amount}:${hash}`;
}

/**
 * Gộp các dòng ứng viên vào danh sách đã có; trả về dòng mới và dòng trùng.
 * Idempotent: chạy lại với cùng đầu vào không thêm dòng nào.
 * Trùng trong chính danh sách ứng viên (cùng một giao dịch xuất hiện ở hai ảnh) chỉ tính một lần.
 * @param {string[]} existingKeys
 * @param {Array<{ date: string, time: string, amount: number, description: string }>} candidates
 */
export function mergeReceipts(existingKeys, candidates) {
  const seen = new Set(existingKeys);
  const added = [];
  const duplicates = [];
  for (const row of candidates) {
    const key = receiptKey(row);
    if (seen.has(key)) {
      duplicates.push({ ...row, key });
      continue;
    }
    seen.add(key);
    added.push({ ...row, key });
  }
  return { added, duplicates, keys: [...seen] };
}
