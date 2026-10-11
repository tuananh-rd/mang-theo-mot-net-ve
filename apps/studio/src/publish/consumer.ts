/**
 * Trình tiêu thụ và trích xuất Bản chụp Xuất bản (Publication Snapshot Consumer)
 * Liên thông dữ liệu giữa Content Studio và mã nguồn website tĩnh Astro (Task C17).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PublicationSnapshot } from '../types.js';

export interface ExportResult {
  success: boolean;
  filesWritten: string[];
  snapshotHash: string;
  error?: string;
}

/**
 * Trích xuất bản chụp xuất bản đã được phê duyệt thành các tệp JSON công khai
 * mà Astro có thể nạp tại build-time.
 */
export function exportApprovedSnapshot(
  snapshot: PublicationSnapshot,
  rootDir: string = process.cwd()
): ExportResult {
  const filesWritten: string[] = [];

  try {
    const dataDir = path.resolve(rootDir, 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Ghi bản chụp đầy đủ (Immutable full snapshot)
    const snapshotFilePath = path.join(dataDir, 'published-snapshot.json');
    fs.writeFileSync(snapshotFilePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    filesWritten.push('src/data/published-snapshot.json');

    // 2. Ghi danh mục bài viết nhật ký đã làm sạch (chỉ bài published, không chứa draft)
    const journalData = (snapshot.modules?.journal || (snapshot as any).journal) as any;
    if (Array.isArray(journalData)) {
      const journalFilePath = path.join(dataDir, 'journal-entries.json');
      fs.writeFileSync(journalFilePath, JSON.stringify(journalData, null, 2), 'utf-8');
      filesWritten.push('src/data/journal-entries.json');
    }

    // 3. Ghi cấu hình mở bán sản phẩm đã làm sạch
    const productsData = (snapshot.modules?.products || (snapshot as any).products) as any;
    if (productsData && typeof productsData === 'object') {
      const productsFilePath = path.join(dataDir, 'product-sales-config.json');
      fs.writeFileSync(productsFilePath, JSON.stringify(productsData, null, 2), 'utf-8');
      filesWritten.push('src/data/product-sales-config.json');
    }

    return {
      success: true,
      filesWritten,
      snapshotHash: snapshot.sha256,
    };
  } catch (err: any) {
    return {
      success: false,
      filesWritten,
      snapshotHash: snapshot.sha256,
      error: err.message,
    };
  }
}
