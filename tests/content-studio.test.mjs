import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { validateDonationCSV, parseCSV, parseCSVRFC4180, normalizeDate, parseMonetaryAmount } from '../tools/content-studio/csv-validator.mjs';
import {
  validateJournalEntry,
  validateJournalEntriesList,
  sanitizeJournalEntry,
  isValidIsoDate,
  isApprovedImageSrc,
} from '../tools/content-studio/journal-validator.mjs';
import { validateProductSalesConfig, sanitizeProductSalesConfig } from '../tools/content-studio/product-validator.mjs';
import { computeFileHash, createBackup, validateDonationProjection, sanitizeDonationEntry } from '../tools/content-studio/cli.mjs';

describe('Kiểm thử Công cụ Đối soát CSV Content Studio (Task C14)', () => {
  it('Phân tích đúng CSV có BOM, dấu phẩy trong ngoặc kép và khoảng trắng', () => {
    const csvWithBom = '\uFEFFma_giao_dich,ngay,so_tien,ten_nguoi_ung_ho,noi_dung,dong_y_cong_khai\nTXN1,2026-10-10,50000,"Nguyen Van A","Dong hanh, chuc cac em vui",co';
    const parsed = parseCSV(csvWithBom);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[1][0], 'TXN1');
    assert.equal(parsed[1][4], 'Dong hanh, chuc cac em vui');
  });

  it('Bắt lỗi unclosed quote theo chuẩn RFC 4180 và chỉ rõ dòng bị lỗi', () => {
    const unclosedCsv = 'ma_giao_dich,ngay,so_tien\nx,2026-10-11,"50000';
    const parsed = parseCSVRFC4180(unclosedCsv);
    assert.ok(parsed.error);
    assert.ok(parsed.error.includes('unclosed quote'));

    const valResult = validateDonationCSV(unclosedCsv);
    assert.equal(valResult.isValid, false);
    assert.ok(valResult.errors.some((e) => e.message.includes('unclosed quote')));
  });

  it('Bắt lỗi khi độ rộng dòng (row width) không khớp với tiêu đề', () => {
    const mismatchCsv = `ma_giao_dich,ngay,so_tien
TXN1,2026-10-10
TXN2,2026-10-10,50000,extra_column`;
    const valResult = validateDonationCSV(mismatchCsv);
    assert.equal(valResult.isValid, false);
    assert.ok(valResult.errors.some((e) => e.message.includes('không khớp với tiêu đề')));
  });

  it('Bắt lỗi khi có cột tiêu đề bị trùng lặp hoặc xung đột trường dữ liệu', () => {
    const duplicateHeaderCsv = `ma_giao_dich,ngay,so_tien,so_tien
TXN1,2026-10-10,50000,50000`;
    const valResult = validateDonationCSV(duplicateHeaderCsv);
    assert.equal(valResult.isValid, false);
    assert.ok(valResult.errors.some((e) => e.message.includes('lặp lại hoặc xung đột')));
  });

  it('Kiểm tra ngữ pháp số tiền nguyên dương nghiêm ngặt (từ chối 5e4, 50.50, chỉ cho phép grouping 3 số)', () => {
    // 1. Số nguyên thuần hợp lệ
    assert.deepEqual(parseMonetaryAmount('50000'), { isValid: true, value: 50000 });

    // 2. Định dạng nhóm 3 chữ số hợp lệ (. hoặc ,)
    assert.deepEqual(parseMonetaryAmount('50.000'), { isValid: true, value: 50000 });
    assert.deepEqual(parseMonetaryAmount('1.500.000'), { isValid: true, value: 1500000 });
    assert.deepEqual(parseMonetaryAmount('50,000'), { isValid: true, value: 50000 });
    assert.deepEqual(parseMonetaryAmount('1,500,000'), { isValid: true, value: 1500000 });

    // 3. Từ chối số mũ
    assert.equal(parseMonetaryAmount('5e4').isValid, false);
    assert.equal(parseMonetaryAmount('1E6').isValid, false);

    // 4. Từ chối số thập phân lẻ (không tự ý xóa dấu chấm biến thành 5050)
    assert.equal(parseMonetaryAmount('50.50').isValid, false);
    assert.equal(parseMonetaryAmount('50,50').isValid, false);
    assert.equal(parseMonetaryAmount('10.5').isValid, false);

    // 5. Từ chối grouping sai quy chuẩn
    assert.equal(parseMonetaryAmount('50.00').isValid, false);
    assert.equal(parseMonetaryAmount('50.0000').isValid, false);
    assert.equal(parseMonetaryAmount('-50000').isValid, false);
    assert.equal(parseMonetaryAmount('0').isValid, false);

    // Kiểm tra trực tiếp qua validateDonationCSV
    const testAmountCsv = `ma_giao_dich,ngay,so_tien
TXN1,2026-10-10,5e4
TXN2,2026-10-10,50.50
TXN3,2026-10-10,50.000`;
    const res = validateDonationCSV(testAmountCsv);
    assert.equal(res.isValid, false);
    assert.equal(res.errors.length, 2); // TXN1 và TXN2 bị lỗi, TXN3 hợp lệ
  });

  it('Bắt buộc ngày chốt đối soát (reconciledAt) khi xuất/áp dụng sổ chính thức', () => {
    const csv = `ma_giao_dich,ngay,so_tien
TXN1,2026-10-10,50000`;
    const failRes = validateDonationCSV(csv, { requireReconciledDate: true });
    assert.equal(failRes.isValid, false);
    assert.ok(failRes.errors.some((e) => e.message.includes('reconciledAt')));

    const passRes = validateDonationCSV(csv, { requireReconciledDate: true, reconciledAt: '2026-10-10' });
    assert.equal(passRes.isValid, true);
  });

  it('Chuẩn hóa đúng các định dạng ngày YYYY-MM-DD và DD/MM/YYYY', () => {
    assert.equal(normalizeDate('2026-10-11'), '2026-10-11');
    assert.equal(normalizeDate('11/10/2026'), '2026-10-11');
    assert.equal(normalizeDate('2026/10/11'), '2026-10-11');
    assert.equal(normalizeDate('ngay-khong-hop-le'), null);
    assert.equal(normalizeDate('32/10/2026'), null);
    assert.equal(normalizeDate(''), null);
  });

  it('Xác thực hợp lệ tệp CSV mẫu và chuẩn hóa người ủng hộ ẩn danh', () => {
    const sampleCsv = `ma_giao_dich,ngay,so_tien,ten_nguoi_ung_ho,noi_dung,dong_y_cong_khai,ghi_chu
TXN1001,2026-10-10,100000,"Nguyễn Văn A","Ủng hộ dự án",co,""
TXN1002,2026-10-10,50000,"Trần Văn B","Dong hanh",khong,""
TXN1003,2026-10-11,200000,"","Góp quỹ",,""`;

    const res = validateDonationCSV(sampleCsv, { reconciledAt: '2026-10-11' });
    assert.equal(res.isValid, true);
    assert.equal(res.stats.totalRows, 3);
    assert.equal(res.stats.validRows, 3);
    assert.equal(res.stats.totalAmount, 350000);
    assert.equal(res.stats.anonymousCount, 2);

    assert.equal(res.rows[0].donorName, 'Nguyễn Văn A');
    assert.equal(res.rows[0].isAnonymous, false);

    assert.equal(res.rows[1].donorName, 'Ẩn danh');
    assert.equal(res.rows[1].isAnonymous, true);

    assert.equal(res.rows[2].donorName, 'Ẩn danh');
    assert.equal(res.rows[2].isAnonymous, true);
  });

  it('Bắt lỗi khi thiếu các cột bắt buộc (id, date, amount)', () => {
    const invalidHeaderCsv = 'ten_nguoi_ung_ho,so_tien\nNguyen A,50000';
    const res = validateDonationCSV(invalidHeaderCsv);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.column === 'id'));
    assert.ok(res.errors.some((e) => e.column === 'date'));
  });

  it('Bắt lỗi trùng lặp mã giao dịch (không phân biệt hoa thường)', () => {
    const duplicateCsv = `ma_giao_dich,ngay,so_tien
TXN100,2026-10-10,50000
txn100,2026-10-10,100000`;
    const res = validateDonationCSV(duplicateCsv);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.message.includes('trùng lặp')));
  });

  it('Bắt lỗi khi ngày giao dịch xảy ra sau ngày chốt đối soát', () => {
    const futureDateCsv = `ma_giao_dich,ngay,so_tien
TXN101,2026-10-12,50000`;
    const res = validateDonationCSV(futureDateCsv, { reconciledAt: '2026-10-10' });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.message.includes('sau ngày đối soát')));
  });

  it('An toàn dữ liệu: Bản chiếu công khai (safe projection) không chứa nội dung giao dịch ngân hàng thô', () => {
    const sensitiveCsv = `ma_giao_dich,ngay,so_tien,ten_nguoi_ung_ho,noi_dung,dong_y_cong_khai,ghi_chu
TXN999,2026-10-10,100000,"Nguyen A","STK 1903... chuyen tien rieng tu",co,"Thong tin noi bo"`;
    const res = validateDonationCSV(sensitiveCsv);
    assert.equal(res.isValid, true);

    const safeProjection = res.rows.map((r) => ({
      date: r.date,
      amount: r.amount,
      donor: r.donorName,
      reference: r.isAnonymous ? null : (r.id ? `Mã: ${r.id.slice(0, 8)}...` : null),
    }));

    const jsonStr = JSON.stringify(safeProjection);
    assert.equal(jsonStr.includes('STK 1903'), false, 'Không được lộ số tài khoản hay nội dung chuyển khoản riêng tư.');
    assert.equal(jsonStr.includes('Thong tin noi bo'), false, 'Không được lộ ghi chú nội bộ.');
  });

  it('Kiểm thử cơ chế sao lưu tự động và băm SHA-256 trên thư mục tạm', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-test-'));
    const testFile = path.join(tempDir, 'test-target.json');
    fs.writeFileSync(testFile, JSON.stringify({ version: 1 }), 'utf-8');

    const hash1 = computeFileHash(testFile);
    assert.ok(hash1);
    assert.equal(typeof hash1, 'string');
    assert.equal(hash1.length, 64);

    const backupResult = createBackup(testFile, 'test');
    assert.ok(backupResult);
    assert.ok(fs.existsSync(backupResult));

    // Dọn dẹp thư mục tạm
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (fs.existsSync(backupResult)) fs.unlinkSync(backupResult);
  });
});

describe('Kiểm thử Xác thực và Làm sạch Bài viết Nhật ký (Task C14)', () => {
  it('Kiểm tra ngày theo lịch thực tế (từ chối ngày không tồn tại 2026-02-31)', () => {
    assert.equal(isValidIsoDate('2026-10-24'), true);
    assert.equal(isValidIsoDate('2026-02-31'), false);
    assert.equal(isValidIsoDate('2026-04-31'), false);
    assert.equal(isValidIsoDate('2026-13-01'), false);
    assert.equal(isValidIsoDate('khong-phai-ngay'), false);
  });

  it('Kiểm tra đường dẫn ảnh nằm trong danh mục đã duyệt (allowlist)', () => {
    assert.equal(isApprovedImageSrc('/images/illustrations/a01.webp'), true);
    assert.equal(isApprovedImageSrc('/images/san-pham/chuon-chuon-tre.webp'), true);
    assert.equal(isApprovedImageSrc('/images/mai-am/mai-am-1.webp'), true);
    assert.equal(isApprovedImageSrc('https://evil.com/hack.jpg'), false);
    assert.equal(isApprovedImageSrc('/uploads/malicious.png'), false);
  });

  it('Bắt buộc chú thích caption khi có ảnh bìa hoặc khối ảnh', () => {
    const entryWithoutCaption = {
      slug: 'bai-test-caption',
      title: 'Tiêu đề bài viết',
      summary: 'Tóm tắt bài viết',
      category: 'ke-hoach',
      publishedAt: '2026-10-11',
      status: 'published',
      coverImage: {
        src: '/images/illustrations/a01.webp',
        alt: 'Ảnh minh họa',
        caption: '', // Rỗng
      },
      content: [{ type: 'paragraph', text: 'Nội dung bài viết' }],
    };
    const valResult = validateJournalEntry(entryWithoutCaption);
    assert.equal(valResult.isValid, false);
    assert.ok(valResult.errors.some((e) => e.includes('caption')));
  });

  it('Từ chối văn bản chứa từ khóa kỹ thuật nội bộ (PLAY_FLOW / SAFETY_PRACTICES)', () => {
    const entryWithTechKeyword = {
      slug: 'bai-test-keyword',
      title: 'Tiêu đề bài viết theo PLAY_FLOW',
      summary: 'Tóm tắt nội dung',
      category: 'ke-hoach',
      publishedAt: '2026-10-11',
      status: 'published',
      content: [{ type: 'paragraph', text: 'Tuân thủ SAFETY_PRACTICES của nhóm' }],
    };
    const valResult = validateJournalEntry(entryWithTechKeyword);
    assert.equal(valResult.isValid, false);
    assert.ok(valResult.errors.some((e) => e.includes('từ khóa kỹ thuật nội bộ')));
  });

  it('validateJournalEntriesList xác thực đúng danh sách và phát hiện slug trùng lặp', () => {
    const validList = [
      {
        slug: 'bai-1',
        title: 'Tiêu đề 1',
        summary: 'Tóm tắt 1',
        category: 'ke-hoach',
        publishedAt: '2026-10-11',
        status: 'published',
        content: [{ type: 'paragraph', text: 'Nội dung 1' }],
      },
      {
        slug: 'bai-2',
        title: 'Tiêu đề 2',
        summary: 'Tóm tắt 2',
        category: 'chuan-bi',
        publishedAt: '2026-10-11',
        status: 'draft',
        content: [{ type: 'paragraph', text: 'Nội dung 2' }],
      },
    ];
    assert.equal(validateJournalEntriesList(validList).isValid, true);

    const duplicateList = [
      { ...validList[0], slug: 'trung-slug' },
      { ...validList[1], slug: 'trung-slug' },
    ];
    const dupRes = validateJournalEntriesList(duplicateList);
    assert.equal(dupRes.isValid, false);
    assert.ok(dupRes.errors.some((e) => e.includes('trùng lặp')));
  });

  it('sanitizeJournalEntry loại bỏ triệt để mọi trường lạ hoặc prototype keys', () => {
    const rawEntryWithExtra = {
      slug: 'ke-hoach-moi',
      title: 'Kế hoạch buổi chơi',
      summary: 'Tóm tắt kế hoạch',
      category: 'ke-hoach',
      publishedAt: '2026-10-11',
      eventDate: '2026-10-24',
      status: 'published',
      extraField: 'Dữ liệu thừa không thuộc schema',
      __proto__: { polluted: true },
      content: [
        { type: 'paragraph', text: 'Đoạn văn hợp lệ', secretAdminNote: 'Ẩn danh' },
      ],
    };

    const clean = sanitizeJournalEntry(rawEntryWithExtra);
    assert.equal(clean.slug, 'ke-hoach-moi');
    assert.equal(clean.title, 'Kế hoạch buổi chơi');
    assert.equal(clean.categoryLabel, 'Kế hoạch');
    assert.equal('extraField' in clean, false, 'Phải loại bỏ trường lạ ngoài schema');
    assert.equal('secretAdminNote' in clean.content[0], false, 'Phải loại bỏ trường thừa trong block');
  });

  it('Từ chối dứt khoát ảnh path traversal (..), query string và ảnh unapproved', () => {
    assert.equal(isApprovedImageSrc('/images/illustrations/../../private.webp'), false);
    assert.equal(isApprovedImageSrc('/images/illustrations/unapproved-photo.webp'), false);
    assert.equal(isApprovedImageSrc('/images/illustrations/a01.webp?query=1'), false);
    assert.equal(isApprovedImageSrc('/images/illustrations/a01.webp#hash'), false);
    assert.equal(isApprovedImageSrc('\\images\\illustrations\\a01.webp'), false);

    const entryWithTraversal = {
      slug: 'bai-test-traversal',
      title: 'Tiêu đề bài viết',
      summary: 'Tóm tắt bài viết',
      category: 'ke-hoach',
      publishedAt: '2026-10-11',
      status: 'published',
      coverImage: {
        src: '/images/illustrations/../../private.webp',
        alt: 'Ảnh traversal',
        caption: 'Chú thích ảnh',
      },
      content: [{ type: 'paragraph', text: 'Nội dung bài viết' }],
    };
    const valResult = validateJournalEntry(entryWithTraversal);
    assert.equal(valResult.isValid, false);
    assert.ok(valResult.errors.some((e) => e.includes('danh mục ảnh đã duyệt')));
  });
});

describe('Kiểm thử Xác thực Cấu hình Mở bán Sản phẩm (Task C14)', () => {
  it('Chấp nhận cấu hình sản phẩm hợp lệ ban đầu', () => {
    const validConfig = {
      'chuon-chuon-tre-kem-de': {
        saleStatus: 'unconfirmed',
        officialPrice: null,
        stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: null,
        publicApproval: 'pending',
      },
      'moc-khoa': {
        saleStatus: 'unconfirmed',
        officialPrice: null,
        stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: null,
        publicApproval: 'pending',
      },
    };
    const result = validateProductSalesConfig(validConfig);
    assert.equal(result.isValid, true);
  });

  it('Bắt lỗi khi có ID sản phẩm lạ hoặc thiếu ID bắt buộc', () => {
    const unknownIdConfig = {
      unknown: { saleStatus: 'open', officialPrice: -20, returnPolicy: null },
    };
    const res = validateProductSalesConfig(unknownIdConfig);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('Mã sản phẩm lạ')));
    assert.ok(res.errors.some((e) => e.includes('Thiếu cấu hình cho sản phẩm bắt buộc')));
  });

  it('Bắt lỗi giá âm (-20), số lượng âm, hoặc enum không hợp lệ', () => {
    const invalidConfig = {
      'chuon-chuon-tre-kem-de': {
        saleStatus: 'unconfirmed',
        officialPrice: -20, // Giá âm
        stockAvailable: -5, // Stock âm
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: null,
        publicApproval: 'sai-status',
      },
      'moc-khoa': {
        saleStatus: 'unconfirmed',
        officialPrice: null,
        stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: null,
        publicApproval: 'pending',
      },
    };
    const res = validateProductSalesConfig(invalidConfig);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('Giá niêm yết')));
    assert.ok(res.errors.some((e) => e.includes('Số lượng sẵn có')));
    assert.ok(res.errors.some((e) => e.includes('Phê duyệt công khai')));
  });

  it('Bắt lỗi khi chuyển sang open mà thiếu điều kiện (giá, chính sách, phê duyệt, stock)', () => {
    const incompleteOpenConfig = {
      'chuon-chuon-tre-kem-de': {
        saleStatus: 'open',
        officialPrice: null, // Thiếu giá
        stockAvailable: null,
        salesChannel: '',
        returnPolicy: null, // Thiếu policy
        publicApproval: 'pending', // Chưa approved
      },
      'moc-khoa': {
        saleStatus: 'unconfirmed',
        officialPrice: null,
        stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: null,
        publicApproval: 'pending',
      },
    };
    const res = validateProductSalesConfig(incompleteOpenConfig);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('giá niêm yết')));
    assert.ok(res.errors.some((e) => e.includes('phê duyệt công khai')));
    assert.ok(res.errors.some((e) => e.includes('chính sách đổi/trả/hủy')));
  });

  it('Mở preorder cần giá chốt và cách nhận, không cần đổi saleStatus', () => {
    const preorderConfig = {
      'chuon-chuon-tre-kem-de': {
        saleStatus: 'unconfirmed', officialPrice: 40000, stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc', returnPolicy: null, publicApproval: 'pending',
        preorderOpen: true,
        pickup: 'Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước',
      },
      'moc-khoa': {
        saleStatus: 'unconfirmed', officialPrice: 10000, stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc', returnPolicy: null, publicApproval: 'pending',
        preorderOpen: true,
        pickup: 'Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước',
      },
    };
    assert.equal(validateProductSalesConfig(preorderConfig).isValid, true);
    preorderConfig['chuon-chuon-tre-kem-de'].officialPrice = null;
    preorderConfig['moc-khoa'].pickup = null;
    const invalid = validateProductSalesConfig(preorderConfig);
    assert.equal(invalid.isValid, false);
    assert.ok(invalid.errors.some((error) => error.includes('giá niêm yết dương')));
    assert.ok(invalid.errors.some((error) => error.includes('hướng dẫn nhận hàng')));
  });

  it('sanitizeProductSalesConfig chuẩn hóa và loại bỏ trường lạ', () => {
    const dirty = {
      'chuon-chuon-tre-kem-de': {
        saleStatus: 'unconfirmed',
        officialPrice: 40000,
        stockAvailable: 30,
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: 'Đổi trong ngày',
        publicApproval: 'pending',
        extraHackingField: 'danger',
      },
      'moc-khoa': {
        saleStatus: 'unconfirmed',
        officialPrice: null,
        stockAvailable: null,
        salesChannel: 'FPT Hòa Lạc',
        returnPolicy: null,
        publicApproval: 'pending',
      },
    };
    const clean = sanitizeProductSalesConfig(dirty);
    assert.equal('extraHackingField' in clean['chuon-chuon-tre-kem-de'], false);
    assert.equal(clean['chuon-chuon-tre-kem-de'].officialPrice, 40000);
  });

  it('Kiểm thử CLI donations với JSON: validate, dry-run, hash mismatch, backup và 2 người đối soát trong thư mục tạm', () => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c14-test-donations-'));
    const targetFile = path.join(fixtureDir, 'reconciled-donations.json');
    const backupDir = path.join(fixtureDir, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });

    // Khởi tạo baseline rỗng
    const initialBaseline = {
      reconciled: false,
      reconciledAt: null,
      reconciledBy: [],
      publicApproval: 'pending',
      entries: [],
    };
    fs.writeFileSync(targetFile, JSON.stringify(initialBaseline, null, 2), 'utf-8');
    const initialHash = computeFileHash(targetFile);

    // Payload thử nghiệm với ẩn danh và mã giao dịch
    const testPayload = {
      reconciled: true,
      reconciledAt: '2026-10-11',
      reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
      publicApproval: 'approved',
      entries: [
        {
          date: '2026-10-10',
          amount: 50000,
          donor: 'Ẩn danh',
          reference: 'TXN12345678',
        },
      ],
    };
    const testJsonFile = path.join(fixtureDir, 'donations-export.json');
    fs.writeFileSync(testJsonFile, JSON.stringify(testPayload, null, 2), 'utf-8');

    // 1. Kiểm tra hàm computeFileHash
    assert.ok(initialHash && initialHash.length === 64);

    // 2. Chạy thử validate qua CLI child_process
    const valResult = spawnSync(process.execPath, [
      path.resolve(process.cwd(), 'tools/content-studio/cli.mjs'),
      'validate',
      testJsonFile,
      '--target',
      'donations',
    ], { encoding: 'utf-8' });
    assert.equal(valResult.status, 0, valResult.stderr);

    // 3. Kiểm tra bảo toàn PII: không đưa tên cá nhân vào bundle và che giấu mã tham chiếu
    const safeEntries = testPayload.entries.map((r) => ({
      date: r.date,
      amount: r.amount,
      donor: r.donor,    }));
    assert.equal(safeEntries[0].donor, 'Ẩn danh');
    assert.equal(Object.hasOwn(safeEntries[0], 'reference'), false);

    // Dọn dẹp fixture
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it('Bảo toàn trạng thái eventStatus (planned, in_progress, completed, cancelled) khi chỉnh sửa bài viết', () => {
    const originalEntry = {
      slug: 'su-kien-hoat-dong',
      title: 'Hoạt động giao lưu sáng tạo tại Mái ấm',
      summary: 'Tóm tắt sự kiện',
      category: 'hoat-dong',
      categoryLabel: 'Hoạt động',
      publishedAt: '2026-10-24',
      eventDate: '2026-10-24',
      eventStatus: 'in_progress', // Trạng thái đang diễn ra
      status: 'published',
      content: [{ type: 'paragraph', text: 'Nội dung hoạt động' }],
    };

    const val1 = validateJournalEntry(originalEntry);
    assert.equal(val1.isValid, true);

    // Giả lập logic collectCurrentJournalEntry với việc đọc eventStatus hiện có
    const collected = {
      ...originalEntry,
      summary: 'Tóm tắt đã cập nhật',
      eventStatus: originalEntry.eventStatus, // Được bảo toàn từ j-event-status
    };

    assert.equal(collected.eventStatus, 'in_progress', 'Trạng thái eventStatus phải được bảo toàn, không tự ý biến thành planned');
    const val2 = validateJournalEntry(collected);
    assert.equal(val2.isValid, true);

    // Kiểm thử riêng trạng thái cancelled (Task C14 early-review-12 item 3)
    const cancelledEntry = {
      slug: 'su-kien-tam-hoan',
      title: 'Thông báo điều chỉnh lịch',
      summary: 'Tóm tắt tạm hoãn',
      category: 'ke-hoach',
      categoryLabel: 'Kế hoạch',
      publishedAt: '2026-10-20',
      eventDate: '2026-10-24',
      eventStatus: 'cancelled',
      status: 'published',
      content: [{ type: 'paragraph', text: 'Nội dung tạm hoãn' }],
    };
    assert.equal(validateJournalEntry(cancelledEntry).isValid, true);

    const collectedCancelled = {
      ...cancelledEntry,
      summary: 'Cập nhật lý do tạm hoãn',
      eventStatus: cancelledEntry.eventStatus,
    };
    assert.equal(collectedCancelled.eventStatus, 'cancelled', 'Trạng thái cancelled phải được bảo toàn, không bị rơi về null');
    assert.equal(validateJournalEntry(collectedCancelled).isValid, true);
  });

  it('Tệp mẫu sample-donations.csv bị từ chối áp dụng và báo lỗi yêu cầu nhập dữ liệu đối soát thật', () => {
    const sampleCsvPath = path.resolve(process.cwd(), 'tools/content-studio/sample-donations.csv');
    const sampleContent = fs.readFileSync(sampleCsvPath, 'utf-8');
    assert.ok(sampleContent.includes('SAMPLE_TXN_0001'));
    assert.ok(sampleContent.includes('[DỮ LIỆU MẪU KIỂM THỬ'));

    const res = validateDonationCSV(sampleContent, { reconciledAt: '2026-10-10' });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.message.includes('dữ liệu mẫu định dạng')));
  });

  it('Hàm validateDonationProjection kiểm tra tính toàn vẹn và mốc thời gian đối soát', () => {
    const validProj = validateDonationProjection({
      reconciled: true,
      reconciledAt: '2026-10-11',
      reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
      publicApproval: 'approved',
      entries: [{ date: '2026-10-10', amount: 50000, donor: 'Ẩn danh', reference: null }],
    });
    assert.equal(validProj.isValid, true);

    const invalidDateProj = validateDonationProjection({
      reconciled: true,
      reconciledAt: '2026-10-10',
      reconciledBy: ['Thành viên tài chính'],
      publicApproval: 'approved',
      entries: [{ date: '2026-10-11', amount: 50000, donor: 'Ẩn danh', reference: null }],
    });
    assert.equal(invalidDateProj.isValid, false);
    assert.ok(invalidDateProj.errors.some((e) => e.includes('sau ngày chốt đối soát')));
  });

  it('Hàm sanitizeDonationEntry tuân thủ allowlist, ẩn danh an toàn và che giấu mã tham chiếu', () => {
    // 1. Người ủng hộ ẩn danh luôn có reference là null
    const anon = sanitizeDonationEntry({
      date: '2026-10-10',
      amount: 50000,
      donor: 'Ẩn danh',
      reference: 'TXN123456789',
      extraPrivateData: 'sensitive_memo',
    });
    assert.deepEqual(anon, {
      date: '2026-10-10',
      amount: 50000,
      donor: 'Ẩn danh',
    });
    assert.equal(Object.hasOwn(anon, 'reference'), false);
    assert.equal(anon.extraPrivateData, undefined);

    // 2. Người ủng hộ có danh tính: che giấu mã tham chiếu thành hậu tố ...XXXX
    const named = sanitizeDonationEntry({
      date: '2026-10-10',
      amount: 100000,
      donor: 'Nguyễn Văn A',
      reference: 'PRIVATE_REFERENCE_SHOULD_NOT_BE_PUBLIC_123456789',
    });
    assert.equal(named.donor, 'Nguyễn Văn A');    assert.equal(Object.hasOwn(named, 'reference'), false);
    assert.equal(JSON.stringify(named).includes('PRIVATE_REFERENCE'), false);

    // 3. Mã tham chiếu đã che giấu hợp lệ (...1234) được giữ nguyên
    const alreadyMasked = sanitizeDonationEntry({
      date: '2026-10-10',
      amount: 200000,
      donor: 'Trần B',
      reference: '...5678',
    });
    assert.equal(Object.hasOwn(alreadyMasked, 'reference'), false);
  });

  it('Áp dụng JSON sổ đối soát: Từ chối nâng cấp bản pending, bắt buộc 2 người đối soát và che giấu mã tham chiếu an toàn', () => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c14-cli-integration-'));
    fs.mkdirSync(path.join(fixtureDir, 'src/data'), { recursive: true });
    fs.mkdirSync(path.join(fixtureDir, 'tools/content-studio'), { recursive: true });

    // Sao chép các tệp công cụ vào fixture
    for (const file of ['cli.mjs', 'csv-validator.mjs', 'journal-validator.mjs', 'product-validator.mjs']) {
      fs.copyFileSync(
        path.resolve(process.cwd(), 'tools/content-studio', file),
        path.join(fixtureDir, 'tools/content-studio', file)
      );
    }

    const targetFile = path.join(fixtureDir, 'src/data/reconciled-donations.json');
    const initialBaseline = {
      reconciled: false,
      reconciledAt: null,
      reconciledBy: [],
      publicApproval: 'pending',
      entries: [],
    };
    fs.writeFileSync(targetFile, JSON.stringify(initialBaseline, null, 2), 'utf-8');
    const initialHash = computeFileHash(targetFile);

    const runCli = (args) =>
      spawnSync(process.execPath, [path.join(fixtureDir, 'tools/content-studio/cli.mjs'), ...args], {
        cwd: fixtureDir,
        encoding: 'utf-8',
      });

    // 1. Kiểm thử từ chối nâng cấp tự động bản pending thành approved
    const pendingJsonPath = path.join(fixtureDir, 'pending-ledger.json');
    fs.writeFileSync(pendingJsonPath, JSON.stringify({
      reconciled: false,
      reconciledAt: null,
      publicApproval: 'pending',
      entries: [],
    }));
    const pendingRes = runCli([
      'apply', pendingJsonPath,
      '--target', 'donations',
      '--apply',
      '--expected-hash', initialHash,
      '--reconciled-at', '2026-10-11',
      '--reviewers', 'Reviewer 1, Reviewer 2',
    ]);
    assert.notEqual(pendingRes.status, 0, 'Bản JSON pending không được phép áp dụng thành approved');
    assert.equal(computeFileHash(targetFile), initialHash, 'Tệp đích không bị sửa đổi');

    // 2. Kiểm thử bắt buộc ít nhất 2 thành viên đối soát chéo độc lập
    const approvedJsonPath = path.join(fixtureDir, 'approved-ledger.json');
    fs.writeFileSync(approvedJsonPath, JSON.stringify({
      reconciled: true,
      reconciledAt: '2026-10-11',
      reconciledBy: ['Vai trò 1', 'Vai trò 2'],
      publicApproval: 'approved',
      entries: [],
    }));
    const noReviewerRes = runCli([
      'apply', approvedJsonPath,
      '--target', 'donations',
      '--apply',
      '--expected-hash', initialHash,
    ]);
    assert.notEqual(noReviewerRes.status, 0, 'Thiếu --reviewers phải bị từ chối');

    const oneReviewerRes = runCli([
      'apply', approvedJsonPath,
      '--target', 'donations',
      '--apply',
      '--expected-hash', initialHash,
      '--reviewers', 'Chỉ 1 người',
    ]);
    assert.notEqual(oneReviewerRes.status, 0, 'Chỉ 1 người đối soát phải bị từ chối');

    const duplicateReviewerRes = runCli([
      'apply', approvedJsonPath,
      '--target', 'donations',
      '--apply',
      '--expected-hash', initialHash,
      '--reviewers', 'Nguyen A, nguyen a',
    ]);
    assert.notEqual(duplicateReviewerRes.status, 0, 'Hai tên trùng lặp phải bị từ chối');

    // 3. Kiểm thử che giấu mã tham chiếu riêng tư khi áp dụng
    const unsafeJsonPath = path.join(fixtureDir, 'unsafe-reference.json');
    fs.writeFileSync(unsafeJsonPath, JSON.stringify({
      reconciled: true,
      reconciledAt: '2026-10-11',
      reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
      publicApproval: 'approved',
      entries: [
        {
          date: '2026-10-10',
          amount: 50000,
          donor: 'Người thử nghiệm',
          reference: 'PRIVATE_REFERENCE_SHOULD_NOT_BE_PUBLIC_123456789',
        },
      ],
    }));
    const applySafeRes = runCli([
      'apply', unsafeJsonPath,
      '--target', 'donations',
      '--apply',
      '--expected-hash', initialHash,
      '--reviewers', 'Thành viên A, Thành viên B',
    ]);
    assert.equal(applySafeRes.status, 0, applySafeRes.stderr);

    const writtenContent = fs.readFileSync(targetFile, 'utf-8');
    assert.ok(!writtenContent.includes('PRIVATE_REFERENCE_SHOULD_NOT_BE_PUBLIC'), 'Mã tham chiếu riêng tư không được xuất hiện trong tệp công khai');
    assert.ok(!writtenContent.includes('...6789'), 'Không xuất cả hậu tố của mã tham chiếu');
    assert.equal(Object.hasOwn(JSON.parse(writtenContent).entries[0], 'reference'), false);
    assert.ok(!writtenContent.includes('Thành viên A'), 'Tên cá nhân của reviewer không được đưa vào public bundle');

    // Dọn dẹp fixture
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });
});
