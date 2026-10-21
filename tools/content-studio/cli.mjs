#!/usr/bin/env node
/**
 * CLI công cụ cập nhật nội bộ Content Studio (Task C14).
 * Hỗ trợ xác thực CSV sao kê, bài viết nhật ký, cấu hình mở bán sản phẩm, chạy thử (dry-run) và áp dụng dữ liệu có sao lưu tự động.
 * Đảm bảo an toàn PII: không đưa nội dung giao dịch ngân hàng thô hoặc ghi chú riêng vào bản xuất công khai.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateDonationCSV, validateDonationProjection, sanitizeDonationEntry } from './csv-validator.mjs';
import { validateJournalEntriesList, validateJournalEntry, sanitizeJournalEntry } from './journal-validator.mjs';
import { validateProductSalesConfig, sanitizeProductSalesConfig } from './product-validator.mjs';

export { validateDonationProjection, sanitizeDonationEntry };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKUPS_DIR = path.resolve(__dirname, 'backups');

const ALLOWED_TARGETS = {
  donations: path.resolve(PROJECT_ROOT, 'src/data/reconciled-donations.json'),
  journal: path.resolve(PROJECT_ROOT, 'src/data/journal-entries.json'),
  products: path.resolve(PROJECT_ROOT, 'src/data/product-sales-config.json'),
};

function printHelp() {
  console.log(`
Công cụ CLI Content Studio — Mang Theo Một Nét Vẽ
Sử dụng:
  node tools/content-studio/cli.mjs validate <file> [--target donations|journal|products] [--reconciled-at YYYY-MM-DD]
  node tools/content-studio/cli.mjs apply <file> [--apply] [--target donations|journal|products] [--expected-hash <sha256>] [--reconciled-at YYYY-MM-DD] [--reviewers "Nguyen A, Le B"]
  node tools/content-studio/cli.mjs sample

Tùy chọn:
  --dry-run         Chỉ kiểm tra và xem trước kết quả, không ghi file (mặc định)
  --apply           Chủ động áp dụng thay đổi và tạo bản sao lưu an toàn
  --target          Mục tiêu dữ liệu ('donations', 'journal', 'products')
  --expected-hash   Mã băm SHA-256 mong muốn của tệp đích trước khi ghi (BẮT BUỘC khi --apply)
  --reconciled-at   Ngày chốt đối soát (YYYY-MM-DD)
  --reviewers       Danh sách ít nhất 2 thành viên đối soát chéo (ngăn ngừa sai sót)
`);
}

export function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function createBackup(targetPath, label = 'backup') {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${label}-${timestamp}.json`;
  const backupPath = path.resolve(BACKUPS_DIR, backupFileName);

  if (fs.existsSync(targetPath)) {
    fs.copyFileSync(targetPath, backupPath);
    return backupPath;
  }
  return null;
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function runValidate(args) {
  const filePath = args[1];
  if (!filePath) {
    console.error('Lỗi: Cần cung cấp đường dẫn đến tệp cần kiểm tra.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Lỗi: Không tìm thấy tệp tại ${resolvedPath}`);
    process.exit(1);
  }

  const targetKey = args.includes('--target') ? args[args.indexOf('--target') + 1] : 'donations';

  if (!Object.prototype.hasOwnProperty.call(ALLOWED_TARGETS, targetKey) || ['__proto__', 'constructor', 'prototype'].includes(targetKey)) {
    console.error(`Lỗi: Mục tiêu '${targetKey}' không hợp lệ.`);
    process.exit(1);
  }

  if (targetKey === 'journal') {
    let entries;
    try {
      entries = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    } catch (err) {
      console.error(`Lỗi phân tích cú pháp JSON: ${err.message}`);
      process.exit(1);
    }
    const result = Array.isArray(entries) ? validateJournalEntriesList(entries) : validateJournalEntry(entries);
    console.log(`=== BÁO CÁO KIỂM TRA BÀI VIẾT NHẬT KÝ ===`);
    console.log(`Đường dẫn tệp: ${resolvedPath}`);
    if (result.isValid) {
      console.log(`\n✅ Dữ liệu bài viết nhật ký hoàn toàn hợp lệ!`);
      process.exit(0);
    } else {
      console.log(`\n❌ Phát hiện lỗi trong bài viết nhật ký:`);
      result.errors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
      process.exit(1);
    }
  }

  if (targetKey === 'products') {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    } catch (err) {
      console.error(`Lỗi phân tích cú pháp JSON cấu hình sản phẩm: ${err.message}`);
      process.exit(1);
    }
    const result = validateProductSalesConfig(config);
    console.log(`=== BÁO CÁO KIỂM TRA CẤU HÌNH SẢN PHẨM ===`);
    console.log(`Đường dẫn tệp: ${resolvedPath}`);
    if (result.isValid) {
      console.log(`Số sản phẩm cấu hình: ${Object.keys(config).length}`);
      console.log(`\n✅ Cấu hình sản phẩm hợp lệ!`);
      process.exit(0);
    } else {
      console.log(`\n❌ Phát hiện ${result.errors.length} lỗi trong cấu hình sản phẩm:`);
      result.errors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
      process.exit(1);
    }
  }

  // Mặc định: kiểm tra donations (hỗ trợ cả JSON projection và CSV)
  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  const isJson = resolvedPath.endsWith('.json') || (fileContent.trim().startsWith('{') && fileContent.trim().endsWith('}'));

  if (isJson) {
    let payload;
    try {
      payload = JSON.parse(fileContent);
    } catch (err) {
      console.error(`Lỗi phân tích cú pháp JSON sao kê: ${err.message}`);
      process.exit(1);
    }
    const result = validateDonationProjection(payload);
    console.log(`=== BÁO CÁO KIỂM TRA BẢN CHIẾU SAO KÊ JSON ===`);
    console.log(`Đường dẫn tệp: ${resolvedPath}`);
    console.log(`Trạng thái đối soát: ${payload.reconciled ? 'Đã đối soát' : 'Chưa đối soát'}`);
    console.log(`Mốc đối soát: ${payload.reconciledAt || 'Chưa xác nhận'}`);
    console.log(`Số giao dịch: ${Array.isArray(payload.entries) ? payload.entries.length : 0}`);

    if (result.isValid) {
      console.log(`\n✅ Bản chiếu sao kê JSON hoàn toàn hợp lệ!`);
      process.exit(0);
    } else {
      console.log(`\n❌ Phát hiện ${result.errors.length} lỗi trong bản chiếu JSON:`);
      result.errors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
      process.exit(1);
    }
  }

  let reconciledAt = null;
  const recIdx = args.indexOf('--reconciled-at');
  if (recIdx !== -1 && args[recIdx + 1]) {
    reconciledAt = args[recIdx + 1];
  }

  const result = validateDonationCSV(fileContent, { reconciledAt });

  console.log(`=== BÁO CÁO KIỂM TRA TỆP SAO KÊ CSV ===`);
  console.log(`Đường dẫn tệp: ${resolvedPath}`);
  if (reconciledAt) console.log(`Mốc đối soát: ${reconciledAt}`);
  console.log(`Tổng số dòng dữ liệu: ${result.stats.totalRows}`);
  console.log(`Số dòng hợp lệ: ${result.stats.validRows}`);
  console.log(`Tổng số tiền: ${formatVND(result.stats.totalAmount)}`);
  console.log(`Số giao dịch ẩn danh: ${result.stats.anonymousCount}`);

  if (result.isValid) {
    console.log(`\n✅ Tệp CSV hoàn toàn hợp lệ! Sẵn sàng để áp dụng vào hệ thống.`);
    process.exit(0);
  } else {
    console.log(`\n❌ Phát hiện ${result.errors.length} lỗi trong tệp:`);
    result.errors.forEach((err, idx) => {
      console.log(`  [${idx + 1}] Dòng ${err.row}${err.column ? ` (cột ${err.column})` : ''}: ${err.message}`);
    });
    process.exit(1);
  }
}

function runApply(args) {
  const filePath = args[1];
  if (!filePath) {
    console.error('Lỗi: Cần cung cấp đường dẫn đến tệp dữ liệu.');
    process.exit(1);
  }

  const isExplicitApply = args.includes('--apply');
  const targetKey = args.includes('--target') ? args[args.indexOf('--target') + 1] : 'donations';

  if (!targetKey || !Object.prototype.hasOwnProperty.call(ALLOWED_TARGETS, targetKey) || ['__proto__', 'constructor', 'prototype'].includes(targetKey)) {
    console.error(`Lỗi: Mục tiêu '${targetKey}' không được phép. Chỉ cho phép: ${Object.keys(ALLOWED_TARGETS).join(', ')}`);
    process.exit(1);
  }

  const targetPath = ALLOWED_TARGETS[targetKey];
  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Lỗi: Không tìm thấy tệp tại ${resolvedPath}`);
    process.exit(1);
  }

  // Bắt buộc kiểm tra mã băm mong muốn khi --apply (chống ghi đè stale baseline)
  const expHashIdx = args.indexOf('--expected-hash');
  const expectedHash = expHashIdx !== -1 ? args[expHashIdx + 1] : null;
  const currentHash = computeFileHash(targetPath);

  if (isExplicitApply) {
    if (!expectedHash) {
      console.error(`❌ Lỗi: Cờ --expected-hash là bắt buộc khi áp dụng (--apply) để chống xung đột stale baseline.`);
      process.exit(1);
    }
    if (!currentHash || currentHash !== expectedHash) {
      console.error(`❌ Lỗi xung đột: Mã SHA-256 hiện tại (${currentHash || 'tệp chưa tồn tại'}) không khớp với mã mong muốn (${expectedHash}).`);
      process.exit(1);
    }
  }

  if (targetKey === 'journal') {
    let entries;
    try {
      entries = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    } catch (err) {
      console.error(`Lỗi phân tích cú pháp JSON bài viết: ${err.message}`);
      process.exit(1);
    }
    const result = Array.isArray(entries) ? validateJournalEntriesList(entries) : validateJournalEntry(entries);
    if (!result.isValid) {
      console.error(`❌ Không thể áp dụng vì bài viết có lỗi:`);
      result.errors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
      process.exit(1);
    }

    console.log(`=== BÁO CÁO ÁP DỤNG BÀI VIẾT NHẬT KÝ ===`);
    console.log(`Tệp nguồn: ${resolvedPath}`);
    console.log(`Tệp đích: ${targetPath}`);
    console.log(`Số bài viết: ${Array.isArray(entries) ? entries.length : 1}`);

    if (!isExplicitApply) {
      console.log(`\n⚠️  CHẾ ĐỘ DRY-RUN (MẶC ĐỊNH)`);
      console.log(`Chưa có thay đổi nào được ghi vào đĩa. Để áp dụng thực tế, hãy thêm cờ: --apply --expected-hash ${currentHash}`);
      process.exit(0);
    }

    const backupPath = createBackup(targetPath, 'journal');
    if (backupPath) console.log(`📁 Đã tạo bản sao lưu tại: ${backupPath}`);

    const rawList = Array.isArray(entries) ? entries : [entries];
    const finalPayload = rawList.map(sanitizeJournalEntry);
    fs.writeFileSync(targetPath, JSON.stringify(finalPayload, null, 2), 'utf-8');
    const newHash = computeFileHash(targetPath);
    console.log(`\n✅ Áp dụng nhật ký thành công! SHA-256 mới: ${newHash}`);
    process.exit(0);
  }

  if (targetKey === 'products') {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    } catch (err) {
      console.error(`Lỗi phân tích cú pháp cấu hình sản phẩm: ${err.message}`);
      process.exit(1);
    }

    const valResult = validateProductSalesConfig(config);
    if (!valResult.isValid) {
      console.error(`❌ Cấu hình sản phẩm không hợp lệ:`);
      valResult.errors.forEach((err, idx) => console.error(`  [${idx + 1}] ${err}`));
      process.exit(1);
    }

    console.log(`=== BÁO CÁO ÁP DỤNG CẤU HÌNH SẢN PHẨM ===`);
    console.log(`Tệp nguồn: ${resolvedPath}`);
    console.log(`Tệp đích: ${targetPath}`);

    if (!isExplicitApply) {
      console.log(`\n⚠️  CHẾ ĐỘ DRY-RUN (MẶC ĐỊNH)`);
      console.log(`Chưa có thay đổi nào được ghi vào đĩa. Để áp dụng thực tế, hãy thêm cờ: --apply --expected-hash ${currentHash}`);
      process.exit(0);
    }

    const backupPath = createBackup(targetPath, 'products');
    if (backupPath) console.log(`📁 Đã tạo bản sao lưu tại: ${backupPath}`);

    const cleanConfig = sanitizeProductSalesConfig(config);
    fs.writeFileSync(targetPath, JSON.stringify(cleanConfig, null, 2), 'utf-8');
    const newHash = computeFileHash(targetPath);
    console.log(`\n✅ Áp dụng cấu hình sản phẩm thành công! SHA-256 mới: ${newHash}`);
    process.exit(0);
  }

  // Áp dụng dữ liệu sao kê (donations) - hỗ trợ cả JSON projection và CSV
  let reconciledAt = null;
  const recIdx = args.indexOf('--reconciled-at');
  if (recIdx !== -1 && args[recIdx + 1]) {
    reconciledAt = args[recIdx + 1];
  }

  let reviewers = [];
  const revIdx = args.indexOf('--reviewers');
  if (revIdx !== -1 && args[revIdx + 1]) {
    reviewers = args[revIdx + 1].split(',').map((s) => s.trim()).filter(Boolean);
  }

  // Bắt buộc quy trình 2 người cho cả JSON và CSV khi áp dụng (--apply) sổ đối soát
  const distinctReviewers = [...new Set(reviewers.map((s) => s.trim().toLowerCase()))];
  if (isExplicitApply && (reviewers.length < 2 || distinctReviewers.length < 2)) {
    console.error(`❌ Lỗi quy trình 2 người: Khi áp dụng sổ đối soát chính thức (--apply), bắt buộc phải chỉ định ít nhất 2 thành viên đối soát chéo KHÁC NHAU qua cờ --reviewers "Người 1, Người 2".`);
    process.exit(1);
  }

  const rawFileContent = fs.readFileSync(resolvedPath, 'utf-8');
  const isJson = resolvedPath.endsWith('.json') || (rawFileContent.trim().startsWith('{') && rawFileContent.trim().endsWith('}'));

  if (isJson) {
    let payload;
    try {
      payload = JSON.parse(rawFileContent);
    } catch (err) {
      console.error(`Lỗi cú pháp JSON sao kê: ${err.message}`);
      process.exit(1);
    }

    const valResult = validateDonationProjection(payload);
    if (!valResult.isValid) {
      console.error(`❌ Không thể áp dụng vì bản chiếu JSON có lỗi:`);
      valResult.errors.forEach((err, idx) => console.error(`  [${idx + 1}] ${err}`));
      process.exit(1);
    }

    // Từ chối JSON chưa đối soát hoặc đang pending tự động nâng cấp thành approved
    if (isExplicitApply) {
      if (payload.reconciled !== true || payload.publicApproval !== 'approved' || !payload.reconciledAt) {
        console.error(`❌ Lỗi: Bản chiếu JSON chưa được đối soát hoặc chưa được duyệt công bố (yêu cầu reconciled: true, publicApproval: "approved", reconciledAt: "YYYY-MM-DD"). Không được tự động nâng cấp trạng thái từ pending thành approved.`);
        process.exit(1);
      }
    }

    const effectiveDate = reconciledAt || payload.reconciledAt;
    if (isExplicitApply && !effectiveDate) {
      console.error(`❌ Lỗi: Cần cung cấp ngày đối soát qua cờ --reconciled-at YYYY-MM-DD hoặc trong tệp JSON.`);
      process.exit(1);
    }

    if (reconciledAt && payload.reconciledAt && reconciledAt !== payload.reconciledAt) {
      console.error(`❌ Lỗi: Ngày đối soát chỉ định (${reconciledAt}) không khớp với ngày trong tệp JSON (${payload.reconciledAt}).`);
      process.exit(1);
    }

    for (const entry of payload.entries) {
      if (entry.date && effectiveDate && entry.date > effectiveDate) {
        console.error(`❌ Lỗi: Giao dịch ngày ${entry.date} diễn ra sau ngày chốt đối soát ${effectiveDate}.`);
        process.exit(1);
      }
    }

    console.log(`=== BÁO CÁO ÁP DỤNG BẢN CHIẾU SAO KÊ JSON ===`);
    console.log(`Tệp nguồn: ${resolvedPath}`);
    console.log(`Tệp đích: ${targetPath}`);
    console.log(`Số giao dịch: ${payload.entries.length}`);

    if (!isExplicitApply) {
      console.log(`\n⚠️  CHẾ ĐỘ DRY-RUN (MẶC ĐỊNH)`);
      console.log(`Chưa có thay đổi nào được ghi vào đĩa.`);
      console.log(`Để áp dụng thực tế, hãy thêm cờ: --apply --expected-hash ${currentHash} --reconciled-at YYYY-MM-DD --reviewers "Người 1, Người 2"`);
      process.exit(0);
    }

    const backupPath = createBackup(targetPath, targetKey);
    if (backupPath) console.log(`📁 Đã tạo bản sao lưu tại: ${backupPath}`);

    // Bảo toàn PII: loại mọi trường thô khỏi bản chiếu công khai và ẩn danh an toàn
    const safePublicDonations = payload.entries.map((row) => sanitizeDonationEntry(row));

    const outputPayload = {
      reconciled: true,
      reconciledAt: effectiveDate,
      reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
      publicApproval: 'approved',
      entries: safePublicDonations,
    };

    fs.writeFileSync(targetPath, JSON.stringify(outputPayload, null, 2), 'utf-8');
    const newHash = computeFileHash(targetPath);

    console.log(`\n✅ Áp dụng dữ liệu JSON sao kê thành công!`);
    console.log(`SHA-256 tệp đích: ${newHash}`);
    console.log(`Bản sao lưu an toàn được lưu trong thư mục tools/content-studio/backups/`);
    process.exit(0);
  }

  const csvContent = rawFileContent;
  const result = validateDonationCSV(csvContent, {
    reconciledAt,
    requireReconciledDate: isExplicitApply,
  });

  if (!result.isValid) {
    console.error(`❌ Không thể áp dụng vì tệp CSV có lỗi:`);
    result.errors.forEach((err, idx) => {
      console.error(`  [${idx + 1}] Dòng ${err.row}${err.column ? ` (cột ${err.column})` : ''}: ${err.message}`);
    });
    process.exit(1);
  }

  // Tách biệt an toàn: Bản chiếu công khai (public projection) CHỈ chứa các trường an toàn.
  // Bản chiếu công khai không chứa mã tham chiếu; tên cá nhân đối soát viên cũng không vào public bundle.
  const safePublicDonations = result.rows.map((row) => ({
    date: row.date,
    amount: row.amount,
    donor: row.donorName,
  }));

  console.log(`=== BÁO CÁO ÁP DỤNG DỮ LIỆU SAO KÊ ===`);
  console.log(`Tệp nguồn: ${resolvedPath}`);
  console.log(`Tệp đích: ${targetPath}`);
  console.log(`Số giao dịch: ${safePublicDonations.length}`);
  console.log(`Tổng tiền: ${formatVND(result.stats.totalAmount)}`);
  console.log(`Giao dịch ẩn danh: ${result.stats.anonymousCount}`);

  if (!isExplicitApply) {
    console.log(`\n⚠️  CHẾ ĐỘ DRY-RUN (MẶC ĐỊNH)`);
    console.log(`Chưa có thay đổi nào được ghi vào đĩa.`);
    console.log(`Để áp dụng thực tế, hãy thêm cờ: --apply --expected-hash ${currentHash} --reconciled-at YYYY-MM-DD --reviewers "Người 1, Người 2"`);
    process.exit(0);
  }

  const backupPath = createBackup(targetPath, targetKey);
  if (backupPath) console.log(`📁 Đã tạo bản sao lưu tại: ${backupPath}`);

  // Cấu trúc hợp đồng DonationLedger
  const outputPayload = {
    reconciled: true,
    reconciledAt: reconciledAt,
    reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
    publicApproval: 'approved',
    entries: safePublicDonations,
  };

  fs.writeFileSync(targetPath, JSON.stringify(outputPayload, null, 2), 'utf-8');
  const newHash = computeFileHash(targetPath);

  console.log(`\n✅ Áp dụng dữ liệu thành công!`);
  console.log(`SHA-256 tệp đích: ${newHash}`);
  console.log(`Bản sao lưu an toàn được lưu trong thư mục tools/content-studio/backups/`);
}

// Chỉ thực thi dòng lệnh khi tệp được chạy trực tiếp
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === 'validate') {
    runValidate(args);
  } else if (command === 'apply') {
    runApply(args);
  } else if (command === 'sample') {
    const samplePath = path.resolve(__dirname, 'sample-donations.csv');
    console.log(fs.readFileSync(samplePath, 'utf-8'));
  } else {
    console.error(`Lệnh '${command}' không được hỗ trợ.`);
    printHelp();
    process.exit(1);
  }
}
