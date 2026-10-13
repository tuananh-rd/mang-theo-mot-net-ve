#!/usr/bin/env node
/**
 * Công cụ Phân tích Delta Bản phát hành Công khai (Public-Consumer Release Delta Tool) - Task C17-R2-F3-R1
 * Đọc so sánh giữa origin/main và các tệp consumer công khai hiện tại.
 * Tuân thủ nghiêm ngặt nguyên tắc:
 * - CHỈ ĐỌC (Read-only): Không thực hiện git push, không tạo branch trên remote.
 * - Danh sách cho phép (Allowlist): Chỉ bao gồm các tệp public consumer (src/layouts, src/data, src/data/lib, src/pages/_meta, v.v.).
 * - Nghiêm cấm tuyệt đối (Exclusion Assertion): Không bao gồm apps/, tools/, docs/, reports/, private fixtures.
 * - Bảo toàn tài sản gốc: Khẳng định bảo toàn hero assets và tài khoản / QR Techcombank 19072950239011.
 * - Xuất tệp patch xem trước vào docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export const PUBLIC_CONSUMER_ALLOWLIST = [
  'src/layouts/Layout.astro',
  'src/data/published-snapshot.json',
  'src/data/campaign.ts',
  'src/data/journal.ts',
  'src/data/lib/snapshot-loader.ts',
  'src/pages/_meta/snapshot-status.json.ts',
  'src/components/Footer.astro',
  'src/components/ProductGrid.astro',
  'src/lib/products.ts',
  'src/pages/nhat-ky/[slug].astro',
  'src/pages/san-pham/[slug].astro',
  'src/pages/ve-nhom.astro',
];

export const FORBIDDEN_PREFIXES = [
  'apps/',
  'tools/',
  'docs/',
  'reports/',
  'tests/',
  '.gemini/',
];

/**
 * Lấy commit SHA của origin/main hoặc checkpoint fallback
 */
export function resolveOriginMainSha() {
  try {
    const sha = execFileSync('git', ['rev-parse', 'origin/main'], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    }).trim();
    if (/^[a-f0-9]{40}$/i.test(sha)) return sha;
  } catch {
    // Fallback về checkpoint đã ghi nhận
  }
  return '0848d1212ea8a2177e76f076a9171c519155dd8a';
}

/**
 * Phân tích và sinh delta xem trước
 */
export async function analyzeReleaseDelta(options = {}) {
  const baseSha = options.baseSha || resolveOriginMainSha();
  const outPath = options.outPath || path.resolve(ROOT_DIR, 'docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch');

  // 1. Lấy danh sách các tệp khác biệt giữa baseSha và HEAD
  const diffOutput = execFileSync('git', ['diff', '--name-only', baseSha, 'HEAD'], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  }).trim();

  const allDiffFiles = diffOutput ? diffOutput.split(/\r?\n/).filter(Boolean) : [];

  // Thêm các tệp untracked thuộc allowlist nếu có (ví dụ: endpoint _meta mới tạo)
  const statusOutput = execFileSync('git', ['status', '--short', '-uall'], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  }).trim();
  const untrackedFiles = statusOutput
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('??'))
    .map(line => line.slice(3).trim());

  const candidateFiles = new Set([...allDiffFiles, ...untrackedFiles]);

  // 2. Lọc theo ALLOWLIST
  const matchingFiles = [];
  const excludedFiles = [];

  for (const file of candidateFiles) {
    const normalized = file.replace(/\\/g, '/');
    if (PUBLIC_CONSUMER_ALLOWLIST.includes(normalized)) {
      matchingFiles.push(normalized);
    } else {
      excludedFiles.push(normalized);
    }
  }

  // Sắp xếp danh sách tệp
  matchingFiles.sort();

  // 3. Khẳng định nghiêm ngặt: Tuyệt đối không chứa tệp cấm trong matchingFiles
  for (const file of matchingFiles) {
    for (const forbidden of FORBIDDEN_PREFIXES) {
      if (file.startsWith(forbidden)) {
        throw new Error(`VI PHẠM BẢO MẬT: Tệp '${file}' thuộc tiền tố cấm '${forbidden}' bị lọt vào release delta.`);
      }
    }
  }

  // 4. Khẳng định bảo toàn Hero Assets và Techcombank QR
  const heroPath1 = path.resolve(ROOT_DIR, 'public/images/hero/chuon-chuon-go-xanh.webp');
  const heroPath2 = path.resolve(ROOT_DIR, 'public/images/hero/chuon-chuon-go-xanh-900.webp');
  const qrPath = path.resolve(ROOT_DIR, 'public/images/ung-ho/qr-ung-ho-techcombank.png');
  const campaignPath = path.resolve(ROOT_DIR, 'src/data/campaign.ts');

  if (!fs.existsSync(heroPath1) || !fs.existsSync(heroPath2)) {
    throw new Error('Hero assets (chuon-chuon-go-xanh) không được bảo toàn.');
  }
  if (!fs.existsSync(qrPath)) {
    throw new Error('Techcombank QR (qr-ung-ho-techcombank.png) không được bảo toàn.');
  }

  const campaignContent = fs.readFileSync(campaignPath, 'utf-8');
  if (!campaignContent.includes('19072950239011')) {
    throw new Error('Tài khoản Techcombank 19072950239011 trong campaign.ts không được bảo tồn.');
  }

  // 5. Sinh nội dung git diff patch cho các tệp trong matchingFiles
  const trackedMatching = matchingFiles.filter(f => !untrackedFiles.includes(f));
  let patchContent = '';

  if (trackedMatching.length > 0) {
    patchContent += execFileSync('git', ['diff', baseSha, 'HEAD', '--', ...trackedMatching], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
  }

  // Đối với các tệp untracked trong allowlist, sinh simulated diff
  for (const untracked of matchingFiles.filter(f => untrackedFiles.includes(f))) {
    const fullPath = path.resolve(ROOT_DIR, untracked);
    const content = fs.readFileSync(fullPath, 'utf-8');
    patchContent += `\ndiff --git a/${untracked} b/${untracked}\nnew file mode 100644\n--- /dev/null\n+++ b/${untracked}\n@@ -0,0 +1,${content.split('\n').length} @@\n`;
    patchContent += content.split('\n').map(l => `+${l}`).join('\n') + '\n';
  }

  // 6. Ghi patch vào đường dẫn đích
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, patchContent, 'utf-8');

  return {
    baseSha,
    matchingFiles,
    excludedCount: excludedFiles.length,
    patchPath: outPath,
    patchSizeBytes: Buffer.byteLength(patchContent, 'utf-8'),
    heroPreserved: true,
    techcombankPreserved: true,
  };
}

async function main() {
  console.log('=== PHÂN TÍCH DELTA BẢN PHÁT HÀNH CÔNG KHAI (RELEASE DELTA) ===');
  const result = await analyzeReleaseDelta();

  console.log(`- Base origin/main commit: ${result.baseSha}`);
  console.log(`- Số tệp consumer công khai hợp lệ: ${result.matchingFiles.length}`);
  console.log('  Danh sách tệp:');
  for (const f of result.matchingFiles) {
    console.log(`    + ${f}`);
  }
  console.log(`- Tệp bị loại trừ an toàn (Studio/Docs/Evidence): ${result.excludedCount}`);
  console.log(`- Bảo toàn Hero & Techcombank 19072950239011: ${result.heroPreserved && result.techcombankPreserved ? 'ĐẠT' : 'KHÔNG'}`);
  console.log(`- Tệp patch xem trước: ${result.patchPath} (${result.patchSizeBytes} bytes)`);
  console.log('\n[CÁC BƯỚC CẦN DUYỆT TRƯỚC KHI KÍCH HOẠT SẢN XUẤT]:');
  console.log('1. Người quản lý duyệt nội dung public-consumer-release.patch.');
  console.log('2. Hợp nhất delta consumer này vào nhánh main trên GitHub thông qua Pull Request được phê duyệt.');
  console.log('3. Sau khi main có consumer integration, các PR snapshot xuất bản từ Studio sẽ cập nhật trực tiếp giao diện công khai.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Lỗi phân tích release delta:', err);
    process.exit(1);
  });
}
