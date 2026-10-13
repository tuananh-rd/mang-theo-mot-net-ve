/**
 * Trình tiêu thụ và trích xuất Bản chụp Xuất bản (Publication Snapshot Consumer) - Task C17-R2-F3
 * Liên thông dữ liệu giữa Content Studio và mã nguồn website tĩnh Astro.
 * Tuân thủ nguyên tắc:
 * - Yêu cầu thư mục đích cô lập tường minh (explicit isolated destination).
 * - Thẩm định sâu toàn bộ schema và tài sản được duyệt trước khi ghi đĩa (Fail-fast).
 * - Nếu xảy ra lỗi giữa chừng, tự động dọn dẹp các tệp đã ghi để không để lại trạng thái pha trộn.
 * - Mô-đun này độc lập với Cloudflare Worker bundle (không import vào worker.ts).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PublicationSnapshot } from '../types.js';
import {
  validateProjectData,
  validateJournalModuleData,
  validateProductsModuleData,
  validateFinanceModuleData,
  validateTeamModuleData,
} from '../schemas/index.js';

export interface ExportAssetItem {
  relativePath: string;
  content: Buffer | Uint8Array | string;
}

export interface ExportOptions {
  approvedAssets?: ExportAssetItem[];
}

export interface ExportResult {
  success: boolean;
  filesWritten: string[];
  snapshotHash: string;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Trích xuất bản chụp xuất bản đã được phê duyệt thành các tệp JSON và media công khai
 */
export function exportApprovedSnapshot(
  snapshot: PublicationSnapshot,
  destinationDir: string,
  options: ExportOptions = {}
): ExportResult {
  const filesWritten: string[] = [];

  // 1. Kiểm tra thư mục đích tường minh
  if (!destinationDir || typeof destinationDir !== 'string' || !destinationDir.trim()) {
    return {
      success: false,
      filesWritten: [],
      snapshotHash: snapshot?.sha256 || '',
      error: 'Thư mục đích xuất bản (destinationDir) là bắt buộc và phải là đường dẫn cô lập hợp lệ.',
    };
  }

  // 2. Thẩm định cấu hình bản chụp
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      success: false,
      filesWritten: [],
      snapshotHash: '',
      error: 'Dữ liệu bản chụp không hợp lệ hoặc rỗng.',
    };
  }

  const hash = String(snapshot.sha256 || (snapshot as any).snapshotHash || '').trim();
  if (!hash || hash.length !== 64) {
    return {
      success: false,
      filesWritten: [],
      snapshotHash: hash,
      error: 'Mã SHA-256 của bản chụp không hợp lệ (phải là chuỗi hex 64 ký tự).',
    };
  }

  const modules = (snapshot.modules || snapshot) as Record<string, any>;
  const validationErrors: Record<string, string[]> = {};

  if (modules.project) {
    const val = validateProjectData(modules.project);
    if (!val.isValid) validationErrors.project = val.errors;
  }

  if (modules.journal && Array.isArray(modules.journal)) {
    const val = validateJournalModuleData(modules.journal);
    if (!val.isValid) validationErrors.journal = val.errors;

    // Bản xuất bản công khai tuyệt đối không được chứa bài viết ở trạng thái draft
    const hasDrafts = modules.journal.some((j: any) => j.status === 'draft');
    if (hasDrafts) {
      validationErrors.journal = validationErrors.journal || [];
      validationErrors.journal.push('Bản chụp công khai chứa bài viết nhật ký trạng thái draft (chưa xuất bản).');
    }
  }

  if (modules.products && typeof modules.products === 'object') {
    const val = validateProductsModuleData(modules.products);
    if (!val.isValid) validationErrors.products = val.errors;
  }

  if (modules.finance && typeof modules.finance === 'object') {
    const val = validateFinanceModuleData(modules.finance);
    if (!val.isValid) validationErrors.finance = val.errors;

    // Nếu chưa đối soát thì entries phải rỗng
    if (modules.finance.reconciled === false && Array.isArray(modules.finance.entries) && modules.finance.entries.length > 0) {
      validationErrors.finance = validationErrors.finance || [];
      validationErrors.finance.push('Tài chính chưa đối soát (reconciled: false) không được phép công khai các dòng sổ.');
    }
  }

  if (modules.team && typeof modules.team === 'object') {
    const val = validateTeamModuleData(modules.team);
    if (!val.isValid) validationErrors.team = val.errors;
  }

  if (Object.keys(validationErrors).length > 0) {
    return {
      success: false,
      filesWritten: [],
      snapshotHash: hash,
      validationErrors,
      error: 'Bản chụp không vượt qua kiểm định schema trước khi trích xuất.',
    };
  }

  // 3. Tiến hành ghi dữ liệu một cách an toàn (Nguyên tử & Dọn dẹp khi lỗi)
  const resolvedDest = path.resolve(destinationDir);
  const dataDir = path.join(resolvedDest, 'src/data');

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 3.1. Ghi published-snapshot.json
    const snapshotFilePath = path.join(dataDir, 'published-snapshot.json');
    fs.writeFileSync(snapshotFilePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    filesWritten.push(snapshotFilePath);

    // 3.2. Ghi journal-entries.json
    const journalData = modules.journal || [];
    const journalFilePath = path.join(dataDir, 'journal-entries.json');
    fs.writeFileSync(journalFilePath, JSON.stringify(journalData, null, 2), 'utf-8');
    filesWritten.push(journalFilePath);

    // 3.3. Ghi product-sales-config.json
    const productsData = modules.products || {};
    const productsFilePath = path.join(dataDir, 'product-sales-config.json');
    fs.writeFileSync(productsFilePath, JSON.stringify(productsData, null, 2), 'utf-8');
    filesWritten.push(productsFilePath);

    // 3.4. Ghi các tệp tài sản media đã duyệt nếu có
    if (Array.isArray(options.approvedAssets) && options.approvedAssets.length > 0) {
      for (const asset of options.approvedAssets) {
        const assetTarget = path.join(resolvedDest, asset.relativePath);
        const parentDir = path.dirname(assetTarget);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(assetTarget, asset.content as any);
        filesWritten.push(assetTarget);
      }
    }

    return {
      success: true,
      filesWritten,
      snapshotHash: hash,
    };
  } catch (err: any) {
    // Dọn dẹp mọi tệp đã ghi nếu có sự cố (không để lại tệp pha trộn)
    for (const f of filesWritten) {
      try {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f);
        }
      } catch {
        // bỏ qua lỗi dọn dẹp thứ cấp
      }
    }

    return {
      success: false,
      filesWritten: [],
      snapshotHash: hash,
      error: `Lỗi trong quá trình ghi tệp xuất bản: ${err.message}`,
    };
  }
}
