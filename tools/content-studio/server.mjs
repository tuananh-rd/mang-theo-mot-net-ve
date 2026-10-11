/**
 * Máy chủ cục bộ Content Studio (Task C14).
 * Chạy trên loopback 127.0.0.1:4323, cung cấp giao diện tiếng Việt hoàn chỉnh:
 * - Soạn và sửa bài viết nhật ký, chọn ảnh đã duyệt, xem trước và xuất JSON trước khi áp dụng.
 * - Cập nhật và lưu cấu hình mở bán sản phẩm quà lưu niệm (product-sales-config.json).
 * - Tải lên và đối soát sao kê ngân hàng qua CSV theo chuẩn RFC 4180 và quy trình 2 người.
 * - Xuất dữ liệu độc lập và áp dụng có kiểm tra băm SHA-256 (expectedHash) kèm sao lưu tự động.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDonationCSV } from './csv-validator.mjs';
import { validateJournalEntriesList, validateJournalEntry, sanitizeJournalEntry } from './journal-validator.mjs';
import { validateProductSalesConfig, sanitizeProductSalesConfig } from './product-validator.mjs';
import { computeFileHash, createBackup, validateDonationProjection, sanitizeDonationEntry } from './cli.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, 'public');

const HOST = '127.0.0.1';
const PORT = 4323;

const ALLOWED_TARGETS = {
  donations: path.resolve(PROJECT_ROOT, 'src/data/reconciled-donations.json'),
  journal: path.resolve(PROJECT_ROOT, 'src/data/journal-entries.json'),
  products: path.resolve(PROJECT_ROOT, 'src/data/product-sales-config.json'),
};

// Danh mục ảnh đã duyệt trong dự án (đồng bộ đầy đủ từ illustrations.ts)
const APPROVED_IMAGES = [
  {
    id: 'A01',
    src: '/images/illustrations/a01.webp',
    name: 'Minh họa họa cụ màu nước và cọ vẽ (A01)',
    alt: 'Bảng màu nước và các loại cọ vẽ đặt trên bàn',
    caption: 'Ảnh minh họa họa cụ — chưa phải ảnh chuẩn bị hoặc hoạt động của dự án',
    creditName: 'Pavel Danilyuk',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/watercolors-and-paintbrushes-6925031/',
  },
  {
    id: 'A02',
    src: '/images/illustrations/a02.webp',
    name: 'Minh họa màu vẽ và cọ trên nền màu pastel (A02)',
    alt: 'Màu vẽ và cọ trên nền màu pastel',
    caption: 'Ảnh minh họa màu vẽ cho góc trang trí — mẫu chuồn chuồn thực tế chờ xác nhận',
    creditName: 'Kaboompics (Karola G)',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/paintbrush-and-paints-5412102/',
  },
  {
    id: 'A03',
    src: '/images/illustrations/a03.webp',
    name: 'Minh họa trống lắc màu vàng (A03)',
    alt: 'Trống lắc màu vàng',
    caption: 'Ảnh minh họa trống lắc — không phải nhạc cụ của nhóm hay người tham gia dự án',
    creditName: 'Kaboompics (Karola G)',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/close-up-shot-of-a-person-playing-tambourine-7285222/',
  },
  {
    id: 'A04',
    src: '/images/illustrations/a04.webp',
    name: 'Minh họa bóng nhiều màu sắc (A04)',
    alt: 'Những quả bóng nhựa nhiều màu sắc',
    caption: 'Ảnh minh họa bóng cho góc trò chơi — không phải bộ bowling hay ảnh hoạt động thực tế',
    creditName: 'RDNE Stock project',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/heap-of-colorful-balls-12405327/',
  },
  {
    id: 'A05',
    src: '/images/illustrations/a05.webp',
    name: 'Minh họa bánh su kem trên đĩa (A05)',
    alt: 'Bánh su kem trên đĩa trắng',
    caption: 'Ảnh minh họa bánh trên đĩa — không phải hộp/khẩu phần bán của nhóm; trà không thuộc cam kết sản phẩm',
    creditName: 'Ali Rashidi',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/photograph-of-cream-puffs-on-a-white-plate-7730442/',
  },
  {
    id: 'chuon-chuon-tre',
    src: '/images/san-pham/chuon-chuon-tre.webp',
    name: 'Ảnh chuồn chuồn tre trên khay mây',
    alt: 'Những chú chuồn chuồn tre sơn nhiều màu đặt trên khay mây, có chân đế',
    caption: 'Ảnh chuồn chuồn tre do nhóm cung cấp để tham khảo; hiện sản phẩm đang ở trạng thái chờ mở bán.',
    creditName: 'Nhóm Lăng Kính cung cấp',
    creditSource: 'Nhóm Lăng Kính',
  },
  {
    id: 'mai-am-1',
    src: '/images/mai-am/mai-am-1.webp',
    name: 'Khuôn viên Mái ấm Thánh Tâm (1)',
    alt: 'Khuôn viên Mái ấm Thánh Tâm',
    caption: 'Ảnh giới thiệu Mái ấm do nhóm cung cấp, được phép công bố. Đây không phải ảnh hoạt động dự án.',
    creditName: 'Nhóm Lăng Kính cung cấp',
    creditSource: 'Nhóm Lăng Kính',
  },
  {
    id: 'mai-am-2',
    src: '/images/mai-am/mai-am-2.webp',
    name: 'Khuôn viên Mái ấm Thánh Tâm (2)',
    alt: 'Khuôn viên Mái ấm Thánh Tâm góc nhìn thứ hai',
    caption: 'Ảnh giới thiệu Mái ấm do nhóm cung cấp, được phép công bố.',
    creditName: 'Nhóm Lăng Kính cung cấp',
    creditSource: 'Nhóm Lăng Kính',
  },
];

function isSafeHost(hostHeader) {
  if (!hostHeader) return false;
  const lower = hostHeader.toLowerCase();
  return lower === `127.0.0.1:${PORT}` || lower === `localhost:${PORT}`;
}

function isSafeOrigin(originHeader) {
  if (!originHeader) return true; // Direct GET requests often lack Origin
  const lower = originHeader.toLowerCase();
  return lower === `http://127.0.0.1:${PORT}` || lower === `http://localhost:${PORT}`;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Kích thước payload vượt quá 5MB.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Dữ liệu JSON không hợp lệ: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function getHtmlApp() {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Studio — Mang Theo Một Nét Vẽ</title>
  <style>
    :root {
      --brand: #1a5654;
      --brand-soft: #eaf2f1;
      --brand-ink: #103433;
      --surface: #ffffff;
      --surface-subtle: #f8faf9;
      --line: #d1dedc;
      --text: #1a2e2d;
      --text-muted: #536b69;
      --danger: #c53030;
      --danger-bg: #fff5f5;
      --success: #276749;
      --success-bg: #f0fff4;
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text);
      background: var(--surface-subtle);
      line-height: 1.5;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--line);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-title { font-size: 1.25rem; font-weight: 700; color: var(--brand); margin: 0; }
    .header-badge {
      font-size: 0.75rem;
      background: var(--brand-soft);
      color: var(--brand-ink);
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 600;
    }
    nav.tabs {
      display: flex;
      gap: 8px;
      padding: 12px 24px 0;
      background: #ffffff;
      border-bottom: 1px solid var(--line);
      overflow-x: auto;
    }
    .tab-btn {
      appearance: none;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      padding: 10px 16px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.9375rem;
      white-space: nowrap;
    }
    .tab-btn.is-active {
      color: var(--brand);
      border-bottom-color: var(--brand);
    }
    main { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .card {
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    h2 { font-size: 1.25rem; margin: 0 0 16px; color: var(--brand-ink); }
    h3 { font-size: 1.05rem; margin: 16px 0 8px; color: var(--brand-ink); }
    p { margin: 0 0 12px; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-group.full { grid-column: span 1 !important; }
      main { padding: 12px; }
      header { padding: 12px; }
      nav.tabs { padding: 8px 12px 0; }
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full { grid-column: span 2; }
    label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    input[type="text"], input[type="date"], input[type="number"], select, textarea {
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      font: inherit;
      background: #ffffff;
      max-width: 100%;
      box-sizing: border-box;
    }
    textarea { resize: vertical; min-height: 80px; }
    .btn {
      appearance: none;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 8px 16px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .btn-primary { background: var(--brand); color: #ffffff; }
    .btn-primary:hover { background: var(--brand-ink); }
    .btn-secondary { background: #ffffff; border-color: var(--line); color: var(--text); }
    .btn-secondary:hover { background: var(--surface-subtle); }
    .btn-danger { background: var(--danger); color: #ffffff; }
    .btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }
    .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #c6f6d5; }
    .alert-error { background: var(--danger-bg); color: var(--danger); border: 1px solid #fed7d7; }
    .table-wrap { overflow-x: auto; max-width: 100%; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; min-width: 500px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--line); }
    th { background: var(--surface-subtle); font-weight: 600; color: var(--text-muted); }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-open { background: var(--success-bg); color: var(--success); }
    .badge-unconfirmed { background: #fffaf0; color: #dd6b20; }
    .preview-box {
      background: var(--surface-subtle);
      border: 1px dashed var(--line);
      border-radius: 6px;
      padding: 16px;
      margin-top: 16px;
      overflow-x: auto;
    }
    .blocks-container { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .block-card {
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
    }
    .block-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .block-title { font-weight: 600; font-size: 0.8125rem; color: var(--text-muted); text-transform: uppercase; }
    .img-preview { max-width: 200px; height: auto; border-radius: 4px; margin-top: 8px; border: 1px solid var(--line); }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 class="header-title">Content Studio</h1>
      <small style="color:var(--text-muted)">Hệ thống biên tập & kiểm tra nội bộ (127.0.0.1:4323)</small>
    </div>
    <div class="header-badge">Dự án: Mang Theo Một Nét Vẽ</div>
  </header>

  <nav class="tabs" role="tablist">
    <button type="button" class="tab-btn is-active" data-tab="journal">1. Biên tập Nhật ký</button>
    <button type="button" class="tab-btn" data-tab="products">2. Trạng thái Mở bán Quà lưu niệm</button>
    <button type="button" class="tab-btn" data-tab="csv">3. Đối soát Sao kê CSV</button>
  </nav>

  <main>
    <!-- TAB 1: NHẬT KÝ -->
    <section id="tab-journal" class="tab-content">
      <div class="card">
        <h2>Danh sách bài viết hiện tại</h2>
        <div id="journal-list" class="table-wrap">Đang tải dữ liệu...</div>
      </div>

      <div class="card">
        <h2>Soạn / Sửa bài viết</h2>
        <div id="journal-alert"></div>
        <form id="journal-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="j-slug">Slug bài viết (kebab-case):</label>
              <input type="text" id="j-slug" required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" placeholder="vi-du-ke-hoach-moi">
            </div>
            <div class="form-group">
              <label for="j-category">Danh mục:</label>
              <select id="j-category">
                <option value="ke-hoach">Kế hoạch</option>
                <option value="chuan-bi">Chuẩn bị</option>
                <option value="hoat-dong">Hoạt động</option>
                <option value="ban-giao">Bàn giao</option>
              </select>
            </div>
            <div class="form-group full">
              <label for="j-title">Tiêu đề bài viết:</label>
              <input type="text" id="j-title" required placeholder="Nhập tiêu đề rõ ràng, không phóng đại">
            </div>
            <div class="form-group full">
              <label for="j-summary">Tóm tắt ngắn (summary):</label>
              <textarea id="j-summary" rows="2" required placeholder="Tóm tắt 1-2 câu về nội dung bài viết"></textarea>
            </div>
            <div class="form-group">
              <label for="j-published-at">Ngày công bố (YYYY-MM-DD):</label>
              <input type="date" id="j-published-at" required>
            </div>
            <div class="form-group">
              <label for="j-event-date">Ngày sự kiện (nếu có):</label>
              <input type="date" id="j-event-date">
            </div>
            <div class="form-group">
              <label for="j-event-status">Trạng thái sự kiện:</label>
              <select id="j-event-status">
                <option value="">-- Không có (null) --</option>
                <option value="planned">Đã lên kế hoạch (planned)</option>
                <option value="in_progress">Đang diễn ra (in_progress)</option>
                <option value="completed">Đã hoàn thành (completed)</option>
                <option value="cancelled">Đã hủy / Tạm hoãn (cancelled)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="j-status">Trạng thái phát hành:</label>
              <select id="j-status">
                <option value="published">Công bố (Published)</option>
                <option value="draft">Bản nháp nội bộ (Draft)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="j-image">Chọn ảnh bìa từ danh mục đã duyệt:</label>
              <select id="j-image">
                <option value="">-- Không dùng ảnh bìa --</option>
              </select>
              <div id="j-image-preview"></div>
            </div>
          </div>

          <h3>Nội dung bài viết (Khối có cấu trúc)</h3>
          <div class="btn-row" style="margin-bottom:12px">
            <button type="button" class="btn btn-secondary" onclick="addBlock('paragraph')">+ Đoạn văn</button>
            <button type="button" class="btn btn-secondary" onclick="addBlock('heading')">+ Tiêu đề mục</button>
            <button type="button" class="btn btn-secondary" onclick="addBlock('callout')">+ Khối lưu ý</button>
            <button type="button" class="btn btn-secondary" onclick="addBlock('list')">+ Danh sách</button>
            <button type="button" class="btn btn-secondary" onclick="addBlock('quote')">+ Trích dẫn</button>
          </div>

          <div id="blocks-container" class="blocks-container"></div>

          <div class="btn-row" style="margin-top:24px">
            <button type="submit" class="btn btn-primary">Kiểm tra & Xuất JSON</button>
            <button type="button" class="btn btn-secondary" id="export-journal-btn">Xuất tệp JSON</button>
            <button type="button" class="btn btn-secondary" id="apply-journal-btn">Áp dụng vào Site</button>
          </div>
        </form>

        <div id="journal-preview" class="preview-box" hidden>
          <h3>Xem trước bài viết (Article Preview)</h3>
          <div id="journal-article-preview" style="margin-bottom:16px"></div>
          <details style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px">
            <summary style="cursor:pointer;font-weight:600;color:var(--text-muted)">Xem cấu trúc JSON kỹ thuật</summary>
            <pre id="journal-json-output" style="white-space:pre-wrap;font-size:0.8125rem;max-height:300px;overflow:auto;margin-top:8px;background:#f8f9fa;padding:12px;border-radius:6px"></pre>
          </details>
        </div>
      </div>
    </section>

    <!-- TAB 2: SẢN PHẨM -->
    <section id="tab-products" class="tab-content" hidden>
      <div class="card">
        <h2>Cập nhật Trạng thái Mở bán Quà lưu niệm</h2>
        <p>Quản lý cấu hình mở bán chính thức tách biệt với giá kế hoạch cơ sở. Cần xác nhận giá, chính sách và kênh giao nhận trước khi kích hoạt luồng mua.</p>
        <div id="products-alert"></div>
        <div id="products-config-form">Đang tải cấu hình...</div>
      </div>
    </section>

    <!-- TAB 3: ĐỐI SOÁT SAO KÊ CSV -->
    <section id="tab-csv" class="tab-content" hidden>
      <div class="card">
        <h2>Đối soát Sao kê Ngân hàng qua CSV</h2>
        <p>Kiểm tra tệp CSV theo chuẩn RFC 4180 và quy trình 2 người đối soát. Không lưu số tài khoản thô hay ghi chú riêng vào website công khai.</p>
        <div id="csv-alert"></div>
        <div class="form-group" style="margin-bottom:16px">
          <label for="csv-text">Nội dung CSV:</label>
          <textarea id="csv-text" rows="8" placeholder="ma_giao_dich,ngay,so_tien,ten_nguoi_ung_ho,noi_dung,dong_y_cong_khai,ghi_chu&#10;TXN1001,2026-10-10,100000,&quot;Nguyễn Văn A&quot;,&quot;Ung ho du an&quot;,co,&quot;&quot;"></textarea>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label for="csv-reconciled-date">Ngày chốt đối soát (bắt buộc khi áp dụng, YYYY-MM-DD):</label>
            <input type="date" id="csv-reconciled-date">
          </div>
          <div class="form-group">
            <label for="csv-reviewers">Thành viên đối soát chéo (ít nhất 2 người, phân cách bằng dấu phẩy):</label>
            <input type="text" id="csv-reviewers" placeholder="Ví dụ: Nguyễn Chí Trung, Lê Tuấn Anh">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600">
            <input type="checkbox" id="csv-confirm-approved">
            Tôi xác nhận dữ liệu đã được đối soát chéo độc lập và phê duyệt công bố sổ ủng hộ
          </label>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary" id="validate-csv-btn">Kiểm tra tính hợp lệ CSV</button>
          <button type="button" class="btn btn-secondary" id="load-sample-csv-btn">Nạp CSV mẫu</button>
          <button type="button" class="btn btn-secondary" id="export-csv-json-btn" disabled>Xuất JSON đối soát</button>
          <button type="button" class="btn btn-primary" id="apply-csv-btn" style="background:#276749" disabled>Áp dụng bản chiếu công khai</button>
        </div>

        <div id="csv-result-wrap" class="preview-box" hidden>
          <h3>Kết quả kiểm tra đối soát</h3>
          <div id="csv-stats"></div>
          <div id="csv-errors"></div>
          <div id="csv-table" class="table-wrap"></div>
        </div>
      </div>
    </section>
  </main>

  <script>
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function downloadJson(filename, data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    let appCatalog = { images: [], entries: [], productsConfig: {}, hashes: {} };
    let currentBlocks = [];
    let lastValidatedCsvResult = null;
    let lastValidatedCsvText = null;

    // Chuyển đổi tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
        document.querySelectorAll('.tab-content').forEach(c => c.setAttribute('hidden', ''));
        btn.classList.add('is-active');
        const tabKey = btn.getAttribute('data-tab');
        const targetSection = document.getElementById('tab-' + tabKey);
        if (targetSection) {
          targetSection.removeAttribute('hidden');
        }
      });
    });

    async function init() {
      try {
        const res = await fetch('/api/catalog');
        appCatalog = await res.json();
        renderJournalList();
        renderImageOptions();
        renderProductsConfigForm();
      } catch (err) {
        console.error('Không thể tải catalog:', err);
      }
    }

    function renderImageOptions() {
      const select = document.getElementById('j-image');
      select.innerHTML = '<option value="">-- Không dùng ảnh bìa --</option>';
      (appCatalog.images || []).forEach(img => {
        const opt = document.createElement('option');
        opt.value = img.src;
        opt.textContent = img.name;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        const previewEl = document.getElementById('j-image-preview');
        if (select.value) {
          previewEl.innerHTML = '<img src="' + escapeHtml(select.value) + '" class="img-preview" alt="Xem trước">';
        } else {
          previewEl.innerHTML = '';
        }
      });
    }

    function renderJournalList() {
      const container = document.getElementById('journal-list');
      if (!appCatalog.entries || appCatalog.entries.length === 0) {
        container.innerHTML = '<p>Chưa có bài viết nào.</p>';
        return;
      }
      let html = '<table><thead><tr><th>Slug</th><th>Tiêu đề</th><th>Danh mục</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>';
      appCatalog.entries.forEach(entry => {
        html += \`<tr>
          <td><code>\${escapeHtml(entry.slug)}</code></td>
          <td><strong>\${escapeHtml(entry.title)}</strong></td>
          <td><span class="badge">\${escapeHtml(entry.categoryLabel || entry.category)}</span></td>
          <td>\${escapeHtml(entry.publishedAt)}</td>
          <td><span class="badge \${entry.status === 'published' ? 'badge-open' : 'badge-unconfirmed'}">\${escapeHtml(entry.status)}</span></td>
          <td><button type="button" class="btn btn-secondary" style="padding:4px 8px;font-size:0.75rem" onclick="editEntry('\${escapeHtml(entry.slug)}')">Chỉnh sửa</button></td>
        </tr>\`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }

    window.editEntry = function(slug) {
      const entry = appCatalog.entries.find(e => e.slug === slug);
      if (!entry) return;
      document.getElementById('j-slug').value = entry.slug;
      document.getElementById('j-title').value = entry.title;
      document.getElementById('j-summary').value = entry.summary;
      document.getElementById('j-category').value = entry.category;
      document.getElementById('j-published-at').value = entry.publishedAt;
      document.getElementById('j-event-date').value = entry.eventDate || '';
      document.getElementById('j-event-status').value = entry.eventStatus || '';
      document.getElementById('j-status').value = entry.status;
      if (entry.coverImage && entry.coverImage.src) {
        document.getElementById('j-image').value = entry.coverImage.src;
        document.getElementById('j-image-preview').innerHTML = '<img src="' + escapeHtml(entry.coverImage.src) + '" class="img-preview" alt="Xem trước">';
      } else {
        document.getElementById('j-image').value = '';
        document.getElementById('j-image-preview').innerHTML = '';
      }
      currentBlocks = JSON.parse(JSON.stringify(entry.content || []));
      renderBlocks();
      window.scrollTo({ top: document.getElementById('journal-form').offsetTop - 60, behavior: 'smooth' });
    };

    function renderProductsConfigForm() {
      const container = document.getElementById('products-config-form');
      const configs = appCatalog.productsConfig || appCatalog.products || {};
      const keys = Object.keys(configs);
      if (keys.length === 0) {
        container.innerHTML = '<p>Không có cấu hình sản phẩm.</p>';
        return;
      }
      let html = '';
      keys.forEach(k => {
        const item = configs[k];
        const isDragonfly = k === 'chuon-chuon-tre-kem-de';
        const labelName = isDragonfly ? 'Chuồn chuồn tre 12 cm kèm đế' : 'Móc khóa Lăng Kính';
        html += \`<div class="card" style="background:var(--surface-subtle);margin-bottom:16px" data-product-id="\${escapeHtml(k)}">
          <h3>\${escapeHtml(labelName)} (<code>\${escapeHtml(k)}</code>)</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="prod-status-\${escapeHtml(k)}">Trạng thái mở bán:</label>
              <select id="prod-status-\${escapeHtml(k)}">
                <option value="unconfirmed" \${item.saleStatus === 'unconfirmed' ? 'selected' : ''}>Chờ mở bán (unconfirmed)</option>
                <option value="open" \${item.saleStatus === 'open' ? 'selected' : ''}>Đang mở bán (open)</option>
                <option value="closed" \${item.saleStatus === 'closed' ? 'selected' : ''}>Đã kết thúc (closed)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="prod-price-\${escapeHtml(k)}">Giá niêm yết chính thức (VND):</label>
              <input type="number" id="prod-price-\${escapeHtml(k)}" value="\${item.officialPrice || ''}" placeholder="Ví dụ: \${isDragonfly ? '40000' : '10000'}">
            </div>
            <div class="form-group">
              <label for="prod-stock-\${escapeHtml(k)}">Số lượng sẵn có (stock):</label>
              <input type="number" id="prod-stock-\${escapeHtml(k)}" value="\${item.stockAvailable || ''}" placeholder="Số lượng thực">
            </div>
            <div class="form-group">
              <label for="prod-channel-\${escapeHtml(k)}">Kênh / Địa điểm giao nhận:</label>
              <input type="text" id="prod-channel-\${escapeHtml(k)}" value="\${escapeHtml(item.salesChannel || 'FPT Hòa Lạc')}">
            </div>
            <div class="form-group full">
              <label for="prod-policy-\${escapeHtml(k)}">Chính sách đổi / trả / hủy:</label>
              <textarea id="prod-policy-\${escapeHtml(k)}" rows="2" placeholder="Quy định đổi trả khi mở bán...">\${escapeHtml(item.returnPolicy || '')}</textarea>
            </div>
            <div class="form-group">
              <label for="prod-approval-\${escapeHtml(k)}">Phê duyệt công khai:</label>
              <select id="prod-approval-\${escapeHtml(k)}">
                <option value="pending" \${item.publicApproval === 'pending' ? 'selected' : ''}>Chờ duyệt (pending)</option>
                <option value="approved" \${item.publicApproval === 'approved' ? 'selected' : ''}>Đã duyệt (approved)</option>
              </select>
            </div>
          </div>
        </div>\`;
      });
      html += '<div class="btn-row"><button type="button" class="btn btn-secondary" id="export-products-btn">Xuất cấu hình JSON</button><button type="button" class="btn btn-primary" id="save-products-btn">Lưu & Áp dụng cấu hình</button></div>';
      container.innerHTML = html;

      document.getElementById('save-products-btn')?.addEventListener('click', saveProductsConfig);
      document.getElementById('export-products-btn')?.addEventListener('click', exportProductsConfig);
    }

    function collectProductsConfigFromUi() {
      const configs = appCatalog.productsConfig || appCatalog.products || {};
      const keys = Object.keys(configs);
      const updatedConfig = {};
      keys.forEach(k => {
        const statusEl = document.getElementById('prod-status-' + k);
        const priceEl = document.getElementById('prod-price-' + k);
        const stockEl = document.getElementById('prod-stock-' + k);
        const channelEl = document.getElementById('prod-channel-' + k);
        const policyEl = document.getElementById('prod-policy-' + k);
        const approvalEl = document.getElementById('prod-approval-' + k);

        const priceVal = priceEl && priceEl.value ? parseInt(priceEl.value, 10) : null;
        const stockVal = stockEl && stockEl.value ? parseInt(stockEl.value, 10) : null;

        updatedConfig[k] = {
          saleStatus: statusEl ? statusEl.value : 'unconfirmed',
          officialPrice: priceVal,
          stockAvailable: stockVal,
          salesChannel: channelEl ? channelEl.value.trim() : 'FPT Hòa Lạc',
          returnPolicy: policyEl && policyEl.value.trim() ? policyEl.value.trim() : null,
          publicApproval: approvalEl ? approvalEl.value : 'pending',
        };
      });
      return updatedConfig;
    }

    function exportProductsConfig() {
      const config = collectProductsConfigFromUi();
      downloadJson('product-sales-config.json', config);
    }

    async function saveProductsConfig() {
      const updatedConfig = collectProductsConfigFromUi();
      const expectedHash = appCatalog.hashes?.products;

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'products',
          payload: updatedConfig,
          expectedHash,
        }),
      });
      const data = await res.json();
      const alertEl = document.getElementById('products-alert');
      if (data.ok) {
        alertEl.innerHTML = '<div class="alert alert-success">✅ Đã lưu và áp dụng cấu hình mở bán sản phẩm thành công! (Mã SHA-256 mới: ' + escapeHtml(data.hash?.slice(0, 8)) + '...)</div>';
        init();
      } else {
        alertEl.innerHTML = '<div class="alert alert-error">❌ Lỗi: ' + escapeHtml(data.error) + '</div>';
      }
    }

    // Quản lý blocks
    window.addBlock = function(type) {
      if (type === 'paragraph') currentBlocks.push({ type: 'paragraph', text: '' });
      if (type === 'heading') currentBlocks.push({ type: 'heading', level: 2, text: '' });
      if (type === 'callout') currentBlocks.push({ type: 'callout', text: '' });
      if (type === 'quote') currentBlocks.push({ type: 'quote', text: '' });
      if (type === 'list') currentBlocks.push({ type: 'list', items: [''] });
      renderBlocks();
    };

    window.removeBlock = function(idx) {
      currentBlocks.splice(idx, 1);
      renderBlocks();
    };

    function renderBlocks() {
      const container = document.getElementById('blocks-container');
      container.innerHTML = '';
      currentBlocks.forEach((block, idx) => {
        const div = document.createElement('div');
        div.className = 'block-card';
        let bodyHtml = '';
        if (block.type === 'paragraph' || block.type === 'callout' || block.type === 'quote') {
          bodyHtml = \`<textarea rows="2" placeholder="Nhập nội dung \${escapeHtml(block.type)}..." oninput="currentBlocks[\${idx}].text = this.value">\${escapeHtml(block.text || '')}</textarea>\`;
        } else if (block.type === 'heading') {
          bodyHtml = \`<div style="display:flex;gap:8px">
            <select onchange="currentBlocks[\${idx}].level = parseInt(this.value)">
              <option value="2" \${block.level === 2 ? 'selected' : ''}>H2</option>
              <option value="3" \${block.level === 3 ? 'selected' : ''}>H3</option>
            </select>
            <input type="text" style="flex:1" placeholder="Tiêu đề mục..." value="\${escapeHtml(block.text || '')}" oninput="currentBlocks[\${idx}].text = this.value">
          </div>\`;
        } else if (block.type === 'list') {
          bodyHtml = \`<div>
            <textarea rows="3" placeholder="Mỗi mục một dòng..." oninput="currentBlocks[\${idx}].items = this.value.split('\\n').filter(s=>s.trim())">\${escapeHtml((block.items || []).join('\\n'))}</textarea>
          </div>\`;
        }

        div.innerHTML = \`<div class="block-header">
          <span class="block-title">\${escapeHtml(block.type)} [\${idx + 1}]</span>
          <button type="button" class="btn btn-danger" style="padding:2px 8px;font-size:0.75rem" onclick="removeBlock(\${idx})">Xóa</button>
        </div>\${bodyHtml}\`;
        container.appendChild(div);
      });
    }

    function renderArticlePreview(entry) {
      const container = document.getElementById('journal-article-preview');
      if (!container) return;
      const catLabels = { 'ke-hoach': 'Kế hoạch', 'chuan-bi': 'Chuẩn bị', 'hoat-dong': 'Hoạt động', 'ban-giao': 'Bàn giao' };
      const statusBadges = entry.status === 'published'
        ? '<span class="header-badge" style="background:#def7ec;color:#03543f">Đã công bố</span>'
        : '<span class="header-badge" style="background:#feecdc;color:#92400e">Bản nháp nội bộ</span>';
      const eventBadge = entry.eventDate
        ? \`<span class="header-badge" style="background:#e1effe;color:#1e429f">Sự kiện: \${escapeHtml(entry.eventDate)} (\${escapeHtml(entry.eventStatus || 'planned')})</span>\`
        : '';

      let blocksHtml = '';
      for (const b of (entry.content || [])) {
        if (b.type === 'paragraph') {
          blocksHtml += \`<p style="margin-bottom:12px;line-height:1.6">\${escapeHtml(b.text)}</p>\`;
        } else if (b.type === 'heading') {
          const lvl = b.level === 2 ? 'h3' : 'h4';
          blocksHtml += \`<\${lvl} style="margin:20px 0 8px;font-size:1.15rem;color:var(--brand-ink)">\${escapeHtml(b.text)}</\${lvl}>\`;
        } else if (b.type === 'callout') {
          blocksHtml += \`<div class="alert alert-info" style="margin:16px 0;border-left:4px solid var(--brand)"><strong>Lưu ý:</strong> \${escapeHtml(b.text)}</div>\`;
        } else if (b.type === 'quote') {
          blocksHtml += \`<blockquote style="border-left:3px solid var(--brand);padding:8px 16px;margin:16px 0;font-style:italic;background:#f9fafb"><p>\${escapeHtml(b.text)}</p>\${b.cite ? \`<cite style="display:block;margin-top:4px;font-size:0.875rem;color:var(--text-muted)">— \${escapeHtml(b.cite)}</cite>\` : ''}</blockquote>\`;
        } else if (b.type === 'list') {
          blocksHtml += \`<ul style="margin:12px 0 16px 24px;line-height:1.6">\${(b.items || []).map(i => \`<li>\${escapeHtml(i)}</li>\`).join('')}</ul>\`;
        } else if (b.type === 'image') {
          blocksHtml += \`<figure style="margin:16px 0"><img src="\${escapeHtml(b.src)}" alt="\${escapeHtml(b.alt)}" style="max-width:100%;border-radius:6px;border:1px solid var(--line)" /><figcaption style="font-size:0.8125rem;color:var(--text-muted);margin-top:4px">\${escapeHtml(b.caption)}</figcaption></figure>\`;
        }
      }

      const coverHtml = entry.coverImage ? \`
        <figure style="margin:16px 0 24px">
          <img src="\${escapeHtml(entry.coverImage.src)}" alt="\${escapeHtml(entry.coverImage.alt)}" style="width:100%;max-height:360px;object-fit:cover;border-radius:8px;border:1px solid var(--line)" />
          <figcaption style="font-size:0.8125rem;color:var(--text-muted);margin-top:6px">\${escapeHtml(entry.coverImage.caption)} \${entry.coverImage.creditName ? \`(Ảnh: \${escapeHtml(entry.coverImage.creditName)})\` : ''}</figcaption>
        </figure>
      \` : '';

      container.innerHTML = \`
        <div style="border:1px solid var(--line);border-radius:8px;padding:24px;background:#ffffff">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
            <span class="header-badge">\${escapeHtml(catLabels[entry.category] || entry.category)}</span>
            \${statusBadges}
            \${eventBadge}
            <span style="font-size:0.8125rem;color:var(--text-muted);margin-left:auto">Ngày công bố: \${escapeHtml(entry.publishedAt)}</span>
          </div>
          <h2 style="font-size:1.5rem;margin:0 0 12px;color:var(--brand-ink)">\${escapeHtml(entry.title)}</h2>
          <p style="font-size:1rem;color:var(--text-muted);margin-bottom:16px;font-style:italic">\${escapeHtml(entry.summary)}</p>
          \${coverHtml}
          <div class="article-content">\${blocksHtml}</div>
        </div>
      \`;
    }

    function collectCurrentJournalEntry() {
      const slug = document.getElementById('j-slug').value.trim();
      const title = document.getElementById('j-title').value.trim();
      const summary = document.getElementById('j-summary').value.trim();
      const category = document.getElementById('j-category').value;
      const publishedAt = document.getElementById('j-published-at').value;
      const eventDate = document.getElementById('j-event-date').value || null;
      const eventStatusVal = document.getElementById('j-event-status').value || null;
      const eventStatus = eventStatusVal || (eventDate ? 'planned' : null);
      const status = document.getElementById('j-status').value;
      const imageSrc = document.getElementById('j-image').value;

      let coverImage = undefined;
      if (imageSrc) {
        const found = appCatalog.images.find(img => img.src === imageSrc);
        if (found) {
          coverImage = {
            src: found.src,
            alt: found.alt || found.name,
            caption: found.caption,
            creditName: found.creditName || found.credit,
            creditSource: found.creditSource || 'Pexels',
            creditUrl: found.creditUrl,
          };
        }
      }

      const categoryLabels = {
        'ke-hoach': 'Kế hoạch',
        'chuan-bi': 'Chuẩn bị',
        'hoat-dong': 'Hoạt động',
        'ban-giao': 'Bàn giao'
      };

      return {
        slug,
        title,
        summary,
        category,
        categoryLabel: categoryLabels[category] || 'Kế hoạch',
        publishedAt,
        eventDate,
        eventStatus,
        status,
        coverImage,
        content: currentBlocks,
      };
    }

    document.getElementById('j-event-date').addEventListener('change', (e) => {
      const statusSelect = document.getElementById('j-event-status');
      if (e.target.value && !statusSelect.value) {
        statusSelect.value = 'planned';
      } else if (!e.target.value) {
        statusSelect.value = '';
      }
    });

    // Submit journal form
    document.getElementById('journal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const entry = collectCurrentJournalEntry();

      const res = await fetch('/api/validate-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const valResult = await res.json();
      const alertEl = document.getElementById('journal-alert');

      if (valResult.isValid) {
        alertEl.innerHTML = '<div class="alert alert-success">✅ Bài viết hoàn toàn hợp lệ theo schema!</div>';
        document.getElementById('journal-preview').removeAttribute('hidden');
        renderArticlePreview(entry);
        document.getElementById('journal-json-output').textContent = JSON.stringify(entry, null, 2);
      } else {
        alertEl.innerHTML = '<div class="alert alert-error">❌ Phát hiện lỗi: ' + escapeHtml(valResult.errors.join('; ')) + '</div>';
      }
    });

    // Export journal JSON
    document.getElementById('export-journal-btn').addEventListener('click', () => {
      const entry = collectCurrentJournalEntry();
      const updatedEntries = appCatalog.entries.filter(e => e.slug !== entry.slug);
      updatedEntries.push(entry);
      downloadJson('journal-entries.json', updatedEntries);
    });

    // Apply journal to site
    document.getElementById('apply-journal-btn').addEventListener('click', async () => {
      const outputEl = document.getElementById('journal-json-output');
      if (!outputEl.textContent) {
        alert('Vui lòng bấm "Kiểm tra & Xuất JSON" trước khi áp dụng.');
        return;
      }
      const newEntry = JSON.parse(outputEl.textContent);
      const updatedEntries = appCatalog.entries.filter(e => e.slug !== newEntry.slug);
      updatedEntries.push(newEntry);
      const expectedHash = appCatalog.hashes?.journal;

      if (!confirm('Bạn có chắc chắn muốn áp dụng bài viết này vào site? Hệ thống sẽ tạo bản sao lưu an toàn.')) return;

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'journal',
          payload: updatedEntries,
          expectedHash,
        }),
      });
      const applyResult = await res.json();
      if (applyResult.ok) {
        alert('✅ Áp dụng thành công bài viết vào hệ thống! Bản sao lưu đã được lưu.');
        init();
      } else {
        alert('❌ Lỗi khi áp dụng: ' + applyResult.error);
      }
    });

    // CSV Validator
    document.getElementById('validate-csv-btn').addEventListener('click', async () => {
      const csvText = document.getElementById('csv-text').value;
      const reconciledAt = document.getElementById('csv-reconciled-date').value || undefined;
      const alertEl = document.getElementById('csv-alert');
      const wrap = document.getElementById('csv-result-wrap');
      const applyBtn = document.getElementById('apply-csv-btn');
      const exportBtn = document.getElementById('export-csv-json-btn');

      const res = await fetch('/api/validate-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, reconciledAt }),
      });
      const data = await res.json();
      wrap.removeAttribute('hidden');

      if (data.isValid) {
        alertEl.innerHTML = '<div class="alert alert-success">✅ Tệp CSV hoàn toàn hợp lệ! Sẵn sàng xuất file hoặc áp dụng.</div>';
        applyBtn.removeAttribute('disabled');
        exportBtn.removeAttribute('disabled');
        lastValidatedCsvText = csvText;
        lastValidatedCsvResult = data;
      } else {
        alertEl.innerHTML = '<div class="alert alert-error">❌ Phát hiện lỗi trong tệp CSV. Vui lòng sửa theo danh sách bên dưới.</div>';
        applyBtn.setAttribute('disabled', '');
        exportBtn.setAttribute('disabled', '');
        lastValidatedCsvText = null;
        lastValidatedCsvResult = null;
      }

      document.getElementById('csv-stats').innerHTML = \`
        <p><strong>Tổng số dòng:</strong> \${escapeHtml(data.stats.totalRows)} | <strong>Hợp lệ:</strong> \${escapeHtml(data.stats.validRows)} | <strong>Tổng tiền:</strong> \${escapeHtml(new Intl.NumberFormat('vi-VN').format(data.stats.totalAmount))}đ | <strong>Ẩn danh:</strong> \${escapeHtml(data.stats.anonymousCount)}</p>
      \`;

      if (data.errors && data.errors.length > 0) {
        let errHtml = '<ul style="color:var(--danger)">';
        data.errors.forEach(err => {
          errHtml += \`<li>Dòng \${escapeHtml(err.row)}\${err.column ? ' (cột ' + escapeHtml(err.column) + ')' : ''}: \${escapeHtml(err.message)}</li>\`;
        });
        errHtml += '</ul>';
        document.getElementById('csv-errors').innerHTML = errHtml;
      } else {
        document.getElementById('csv-errors').innerHTML = '';
      }

      if (data.rows && data.rows.length > 0) {
        let tbl = '<table><thead><tr><th>Mã giao dịch</th><th>Ngày</th><th>Số tiền</th><th>Tên hiển thị</th><th>Trạng thái ẩn danh</th></tr></thead><tbody>';
        data.rows.slice(0, 15).forEach(r => {
          tbl += \`<tr>
            <td><code>\${escapeHtml(r.id)}</code></td>
            <td>\${escapeHtml(r.date)}</td>
            <td><strong>\${escapeHtml(new Intl.NumberFormat('vi-VN').format(r.amount))}đ</strong></td>
            <td>\${escapeHtml(r.donorName)}</td>
            <td>\${r.isAnonymous ? '<span class="badge badge-unconfirmed">Ẩn danh</span>' : '<span class="badge badge-open">Công khai</span>'}</td>
          </tr>\`;
        });
        tbl += '</tbody></table>';
        if (data.rows.length > 15) tbl += '<p><small>... và ' + (data.rows.length - 15) + ' giao dịch khác.</small></p>';
        document.getElementById('csv-table').innerHTML = tbl;
      } else {
        document.getElementById('csv-table').innerHTML = '';
      }
    });

    document.getElementById('export-csv-json-btn').addEventListener('click', () => {
      if (!lastValidatedCsvResult || !lastValidatedCsvResult.rows) return;
      const reconciledAt = document.getElementById('csv-reconciled-date').value || null;
      const reviewers = document.getElementById('csv-reviewers').value.split(',').map(s => s.trim()).filter(Boolean);
      const isConfirmed = document.getElementById('csv-confirm-approved')?.checked;

      if (!reconciledAt) {
        alert('Vui lòng chọn ngày chốt đối soát (không được để trống khi xuất JSON đối soát).');
        return;
      }

      const distinctReviewers = [...new Set(reviewers.map(s => s.toLowerCase()))];
      if (reviewers.length < 2 || distinctReviewers.length < 2) {
        alert('Cần ít nhất 2 thành viên đối soát chéo độc lập khác nhau để xuất bản ghi đối soát.');
        return;
      }

      if (!isConfirmed) {
        alert('Vui lòng tích chọn xác nhận đã đối soát chéo và phê duyệt công bố.');
        return;
      }

      const safeRows = lastValidatedCsvResult.rows.map(r => ({
        date: r.date,
        amount: r.amount,
        donor: r.donorName,
        reference: r.isAnonymous ? null : (r.id ? '...' + r.id.slice(-4) : null),
      }));

      const projection = {
        reconciled: true,
        reconciledAt,
        reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
        publicApproval: 'approved',
        entries: safeRows,
      };

      downloadJson('reconciled-donations.json', projection);
    });

    document.getElementById('load-sample-csv-btn').addEventListener('click', async () => {
      const res = await fetch('/api/sample-csv');
      const text = await res.text();
      document.getElementById('csv-text').value = text;
    });

    document.getElementById('apply-csv-btn').addEventListener('click', async () => {
      if (!lastValidatedCsvText) return;
      const reconciledAt = document.getElementById('csv-reconciled-date').value;
      const reviewersInput = document.getElementById('csv-reviewers').value.trim();
      const isConfirmed = document.getElementById('csv-confirm-approved')?.checked;

      if (!reconciledAt) {
        alert('Vui lòng chọn ngày chốt đối soát (bắt buộc khi áp dụng sổ chính thức).');
        return;
      }
      const reviewers = reviewersInput.split(',').map(s => s.trim()).filter(Boolean);
      const distinctReviewers = [...new Set(reviewers.map(s => s.toLowerCase()))];
      if (reviewers.length < 2 || distinctReviewers.length < 2) {
        alert('Quy trình 2 người bắt buộc: Vui lòng nhập ít nhất 2 thành viên đối soát chéo khác nhau.');
        return;
      }
      if (!isConfirmed) {
        alert('Vui lòng tích chọn xác nhận đã đối soát chéo và phê duyệt công bố.');
        return;
      }

      const expectedHash = appCatalog.hashes?.donations;

      if (!confirm('Bạn có chắc chắn muốn áp dụng dữ liệu sao kê đối soát vào site? Bản sao lưu sẽ được tạo tự động.')) return;

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'donations',
          csvText: lastValidatedCsvText,
          reconciledAt,
          reviewers,
          expectedHash,
        }),
      });
      const applyResult = await res.json();
      if (applyResult.ok) {
        alert('✅ Áp dụng sao kê thành công! Bản sao lưu đã được tạo tại: ' + applyResult.backupPath);
        init();
      } else {
        alert('❌ Lỗi khi áp dụng: ' + applyResult.error);
      }
    });

    init();
  </script>
</body>
</html>`;
}

// Khởi tạo máy chủ HTTP
const server = http.createServer(async (req, res) => {
  // 1. Kiểm tra an toàn Host header
  if (!isSafeHost(req.headers.host)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Host không được phép.');
    return;
  }

  // 2. Kiểm tra an toàn Origin header trên POST requests
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    if (origin && !isSafeOrigin(origin)) {
      sendJson(res, 403, { ok: false, error: '403 Forbidden: Origin không được phép.' });
      return;
    }
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 3. Phục vụ ảnh tĩnh đã duyệt (ngăn chặn directory traversal)
  if (req.method === 'GET' && pathname.startsWith('/images/')) {
    const safeSubPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const safeImagePath = path.join(PUBLIC_DIR, safeSubPath);
    if (!safeImagePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Truy cập tệp ngoài thư mục cho phép.');
      return;
    }
    if (fs.existsSync(safeImagePath) && fs.statSync(safeImagePath).isFile()) {
      const ext = path.extname(safeImagePath).toLowerCase();
      const contentTypes = {
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      res.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      });
      fs.createReadStream(safeImagePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Image Not Found');
      return;
    }
  }

  // 4. Phục vụ giao diện chính
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(getHtmlApp());
    return;
  }

  // 5. Phục vụ catalog dữ liệu
  if (req.method === 'GET' && pathname === '/api/catalog') {
    let entries = [];
    try {
      entries = JSON.parse(fs.readFileSync(ALLOWED_TARGETS.journal, 'utf-8'));
    } catch {
      entries = [];
    }

    let productsConfig = {};
    try {
      productsConfig = JSON.parse(fs.readFileSync(ALLOWED_TARGETS.products, 'utf-8'));
    } catch {
      productsConfig = {};
    }

    const hashes = {
      journal: computeFileHash(ALLOWED_TARGETS.journal),
      products: computeFileHash(ALLOWED_TARGETS.products),
      donations: computeFileHash(ALLOWED_TARGETS.donations),
    };

    sendJson(res, 200, {
      images: APPROVED_IMAGES,
      entries,
      products: productsConfig,
      productsConfig,
      hashes,
    });
    return;
  }

  // 6. API CSV sample
  if (req.method === 'GET' && pathname === '/api/sample-csv') {
    const samplePath = path.resolve(__dirname, 'sample-donations.csv');
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(fs.readFileSync(samplePath, 'utf-8'));
    return;
  }

  // 7. API Validate CSV
  if (req.method === 'POST' && pathname === '/api/validate-csv') {
    try {
      const { csvText, reconciledAt } = await parseJsonBody(req);
      const result = validateDonationCSV(csvText, { reconciledAt });
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 400, { isValid: false, errors: [{ row: 0, message: err.message }] });
    }
    return;
  }

  // 8. API Validate Journal
  if (req.method === 'POST' && pathname === '/api/validate-journal') {
    try {
      const entry = await parseJsonBody(req);
      const result = validateJournalEntry(entry);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 400, { isValid: false, errors: [err.message] });
    }
    return;
  }

  // 9. API Apply changes with server-side validation and backup
  if (req.method === 'POST' && pathname === '/api/apply') {
    try {
      const { target, payload, csvText, reconciledAt, reviewers, expectedHash } = await parseJsonBody(req);

      // Chống prototype pollution
      if (!target || !Object.prototype.hasOwnProperty.call(ALLOWED_TARGETS, target) || ['__proto__', 'constructor', 'prototype'].includes(target)) {
        sendJson(res, 400, { ok: false, error: 'Target không hợp lệ.' });
        return;
      }

      const targetPath = ALLOWED_TARGETS[target];

      // Bắt buộc kiểm tra hash mong muốn (stale-baseline protection)
      if (!expectedHash) {
        sendJson(res, 400, { ok: false, error: 'Mã băm baseline (expectedHash) là bắt buộc khi áp dụng để chống xung đột dữ liệu cũ.' });
        return;
      }

      const currentHash = computeFileHash(targetPath);
      if (!currentHash || currentHash !== expectedHash) {
        sendJson(res, 409, {
          ok: false,
          error: `Xung đột baseline hash: Tệp đích đã bị sửa đổi trước đó (hiện tại: ${currentHash}, mong muốn: ${expectedHash}).`,
        });
        return;
      }

      const backupPath = createBackup(targetPath, target);

      if (target === 'journal') {
        const val = validateJournalEntriesList(payload);
        if (!val.isValid) {
          sendJson(res, 400, { ok: false, error: val.errors.join('; ') });
          return;
        }
        const cleanPayload = payload.map(sanitizeJournalEntry);
        fs.writeFileSync(targetPath, JSON.stringify(cleanPayload, null, 2), 'utf-8');
      } else if (target === 'products') {
        const val = validateProductSalesConfig(payload);
        if (!val.isValid) {
          sendJson(res, 400, { ok: false, error: val.errors.join('; ') });
          return;
        }
        const cleanProducts = sanitizeProductSalesConfig(payload);
        fs.writeFileSync(targetPath, JSON.stringify(cleanProducts, null, 2), 'utf-8');
      } else if (target === 'donations') {
        if (!csvText && !payload) {
          sendJson(res, 400, { ok: false, error: 'Thiếu nội dung CSV hoặc JSON sao kê.' });
          return;
        }

        let effectiveDate = reconciledAt;
        let safeRows = [];

        const distinctReviewers = Array.isArray(reviewers)
          ? [...new Set(reviewers.map((s) => String(s || '').trim().toLowerCase()))].filter(Boolean)
          : [];
        if (!Array.isArray(reviewers) || reviewers.length < 2 || distinctReviewers.length < 2) {
          sendJson(res, 400, { ok: false, error: 'Quy trình 2 người bắt buộc: Cần ít nhất 2 thành viên đối soát chéo KHÁC NHAU.' });
          return;
        }

        if (csvText) {
          if (!reconciledAt) {
            sendJson(res, 400, { ok: false, error: 'Mốc ngày đối soát (reconciledAt) là bắt buộc.' });
            return;
          }

          const validation = validateDonationCSV(csvText, {
            reconciledAt,
            requireReconciledDate: true,
          });

          if (!validation.isValid) {
            sendJson(res, 400, { ok: false, error: validation.errors.map(e => e.message).join('; ') });
            return;
          }

          safeRows = validation.rows.map((r) => ({
            date: r.date,
            amount: r.amount,
            donor: r.donorName,
            reference: r.isAnonymous ? null : (r.id ? `...${r.id.slice(-4)}` : null),
          }));
        } else {
          if (!payload || typeof payload !== 'object' || !Array.isArray(payload.entries)) {
            sendJson(res, 400, { ok: false, error: 'Bản chiếu JSON không hợp lệ.' });
            return;
          }
          const val = validateDonationProjection(payload);
          if (!val.isValid) {
            sendJson(res, 400, { ok: false, error: val.errors.join('; ') });
            return;
          }
          if (payload.reconciled !== true || payload.publicApproval !== 'approved' || !payload.reconciledAt) {
            sendJson(res, 400, { ok: false, error: 'Bản chiếu JSON chưa được đối soát hoàn tất hoặc chưa duyệt công bố (yêu cầu reconciled: true, publicApproval: "approved", reconciledAt: "YYYY-MM-DD").' });
            return;
          }
          effectiveDate = reconciledAt || payload.reconciledAt;
          if (!effectiveDate) {
            sendJson(res, 400, { ok: false, error: 'Mốc ngày đối soát (reconciledAt) là bắt buộc.' });
            return;
          }
          if (reconciledAt && payload.reconciledAt && reconciledAt !== payload.reconciledAt) {
            sendJson(res, 400, { ok: false, error: `Ngày đối soát (${reconciledAt}) không khớp với ngày trong tệp JSON (${payload.reconciledAt}).` });
            return;
          }
          for (const entry of payload.entries) {
            if (entry.date && effectiveDate && entry.date > effectiveDate) {
              sendJson(res, 400, { ok: false, error: `Giao dịch ngày ${entry.date} diễn ra sau ngày chốt đối soát ${effectiveDate}.` });
              return;
            }
          }
          safeRows = payload.entries.map((r) => sanitizeDonationEntry(r));
        }

        const dataPayload = {
          reconciled: true,
          reconciledAt: effectiveDate,
          reconciledBy: ['Thành viên tài chính', 'Thành viên đối soát chéo'],
          publicApproval: 'approved',
          entries: safeRows,
        };

        fs.writeFileSync(targetPath, JSON.stringify(dataPayload, null, 2), 'utf-8');
      }

      sendJson(res, 200, { ok: true, backupPath, hash: computeFileHash(targetPath) });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message });
    }
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

// Khởi chạy lắng nghe
server.listen(PORT, HOST, () => {
  console.log(`Content Studio đang chạy tại: http://${HOST}:${PORT}`);
  console.log(`Nhấn Ctrl+C để dừng.`);
});

server.on('error', (err) => {
  console.error(`Lỗi khởi chạy máy chủ Content Studio: ${err.message}`);
  process.exit(1);
});
