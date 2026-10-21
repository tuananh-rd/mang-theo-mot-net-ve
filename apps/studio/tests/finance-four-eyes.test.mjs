import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFourEyesApproval } from '../dist/auth/rbac.js';
import {
  validateDonationCSV,
  parseCSVRFC4180,
  parseMonetaryAmount,
  sanitizeDonationEntry,
  validateDonationProjection,
} from '../../../tools/content-studio/csv-validator.mjs';

test('Four-Eyes: Nghiêm cấm tự phê duyệt (Self-Review Forbidden)', () => {
  const result = validateFourEyesApproval({
    currentReviewerEmail: 'finance-lead@mangtheomotnetve.vn',
    authorEmail: 'finance-lead@mangtheomotnetve.vn',
  });
  assert.equal(result.isValid, false);
  assert.match(result.error, /Tác giả bản nháp tài chính không được tự phê duyệt/);
});

test('Four-Eyes: Người duyệt thứ hai phải độc lập với người duyệt thứ nhất', () => {
  const duplicateReviewer = validateFourEyesApproval({
    currentReviewerEmail: 'reviewer-1@mangtheomotnetve.vn',
    authorEmail: 'editor@mangtheomotnetve.vn',
    firstReviewerEmail: 'reviewer-1@mangtheomotnetve.vn',
  });
  assert.equal(duplicateReviewer.isValid, false);
  assert.match(duplicateReviewer.error, /Người duyệt thứ hai phải là một thành viên độc lập khác/);

  const validIndependent = validateFourEyesApproval({
    currentReviewerEmail: 'reviewer-2@mangtheomotnetve.vn',
    authorEmail: 'editor@mangtheomotnetve.vn',
    firstReviewerEmail: 'reviewer-1@mangtheomotnetve.vn',
    isFinalPublication: true,
  });
  assert.equal(validIndependent.isValid, true);
});

test('Quy tắc 2 người: Đúng 2 danh tính độc lập (Người lập + Người duyệt độc lập)', async () => {
  const { validateTwoPersonFinanceApproval } = await import('../dist/auth/rbac.js');

  // Trùng người lập và duyệt -> Từ chối
  const selfReview = validateTwoPersonFinanceApproval({
    preparerEmail: 'lead@mangtheomotnetve.vn',
    reviewerEmail: 'lead@mangtheomotnetve.vn',
  });
  assert.equal(selfReview.isValid, false);
  assert.match(selfReview.error, /Người lập tài chính không được tự phê duyệt/);

  // 2 người độc lập -> Hợp lệ (không cần người thứ 3)
  const validTwo = validateTwoPersonFinanceApproval({
    preparerEmail: 'lead@mangtheomotnetve.vn',
    reviewerEmail: 'reviewer@mangtheomotnetve.vn',
  });
  assert.equal(validTwo.isValid, true);
});

test('CSV Parser: Tuân thủ RFC 4180, từ chối unclosed quotes và dòng sai số cột', () => {
  // Unclosed quotes
  const unclosed = 'id,date,amount\n1,2026-10-10,"50000';
  const parseUnclosed = parseCSVRFC4180(unclosed);
  assert.ok(parseUnclosed.error);
  assert.match(parseUnclosed.error, /unclosed quote/);

  // Dòng sai số cột
  const mismatchedColumns = 'id,date,amount\n1,2026-10-10,50000,extra_column';
  const valResult = validateDonationCSV(mismatchedColumns);
  assert.equal(valResult.isValid, false);
  assert.match(valResult.errors[0].message, /không khớp với tiêu đề/);
});

test('Cú pháp tiền tệ: Chỉ chấp nhận số nguyên dương hoặc phân cách 3 chữ số hợp lệ', () => {
  assert.equal(parseMonetaryAmount('50000').isValid, true);
  assert.equal(parseMonetaryAmount('50.000').isValid, true);
  assert.equal(parseMonetaryAmount('1,500,000').isValid, true);

  // Từ chối số mũ, số thực lẻ, số âm
  assert.equal(parseMonetaryAmount('5e4').isValid, false);
  assert.equal(parseMonetaryAmount('50.50').isValid, false);
  assert.equal(parseMonetaryAmount('-10000').isValid, false);
  assert.equal(parseMonetaryAmount('50.5').isValid, false);
});

test('Làm sạch dữ liệu: Che giấu mã tham chiếu riêng tư (PII Masking) và ẩn danh', () => {
  const namedEntry = {
    date: '2026-10-10',
    amount: 100000,
    donor: 'Nguyễn Văn A',
    reference: 'MBVCB123456789',
  };
  const sanitizedNamed = sanitizeDonationEntry(namedEntry);
  assert.equal(sanitizedNamed.donor, 'Nguyễn Văn A');
  assert.equal(Object.hasOwn(sanitizedNamed, 'reference'), false);

  const anonEntry = {
    date: '2026-10-10',
    amount: 50000,
    donor: 'Ẩn danh',
    reference: 'SECRET9999',
  };
  const sanitizedAnon = sanitizeDonationEntry(anonEntry);
  assert.equal(sanitizedAnon.donor, 'Ẩn danh');
  assert.equal(Object.hasOwn(sanitizedAnon, 'reference'), false);
});

test('Bản chiếu công khai: Từ chối bản chiếu chưa đối soát hoặc chưa duyệt', () => {
  // Reconciled: true nhưng publicApproval chưa approved
  const unapproved = {
    reconciled: true,
    reconciledAt: '2026-10-31',
    publicApproval: 'pending',
    reconciledBy: ['Admin'],
    entries: [{ date: '2026-10-15', amount: 50000, donor: 'Ẩn danh', reference: null }],
  };
  const valUnapproved = validateDonationProjection(unapproved);
  assert.equal(valUnapproved.isValid, false);

  // Reconciled: false nhưng lại có entries
  const falseWithEntries = {
    reconciled: false,
    reconciledAt: null,
    publicApproval: 'pending',
    reconciledBy: [],
    entries: [{ date: '2026-10-15', amount: 50000, donor: 'Ẩn danh', reference: null }],
  };
  const valFalseWithEntries = validateDonationProjection(falseWithEntries);
  assert.equal(valFalseWithEntries.isValid, false);
});
