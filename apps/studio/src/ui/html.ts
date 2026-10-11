/**
 * Trình dựng giao diện HTML tiếng Việt cho Content Studio (Task C17)
 * Áp dụng bảng màu phẳng C16, thanh điều hướng sidebar/drawer đa thiết bị (375/768/1440),
 * biểu mẫu nghiệp vụ chuyên biệt cho toàn bộ 8 phân hệ (không dùng raw JSON editor mặc định),
 * trình so sánh khác biệt (diff viewer), cảnh báo thay đổi chưa lưu, và chuyển đổi vai trò kiểm thử.
 */

import type { AuthSession, UserRole } from '../types.js';
import { escapeHtml } from '../auth/rbac.js';

export function renderStudioHtml(session: AuthSession): string {
  const user = session.user;
  const isDev = session.isDev;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Studio | Mang Theo Một Nét Vẽ</title>
  <style>
    :root {
      --color-primary: #2B6CB0;
      --color-primary-hover: #2C5282;
      --color-teal: #2C7A7B;
      --color-teal-light: #E6FFFA;
      --color-danger: #C53030;
      --color-danger-light: #FFF5F5;
      --color-warning: #DD6B20;
      --color-warning-light: #FFFAF0;
      --color-success: #38A169;
      --color-success-light: #F0FFF4;
      --color-neutral-dark: #2D3748;
      --color-neutral-mid: #718096;
      --color-neutral-light: #E2E8F0;
      --color-bg-app: #F7FAFC;
      --color-bg-card: #FFFFFF;
      --color-sidebar: #1A202C;
      --color-sidebar-text: #EDF2F7;
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--color-bg-app);
      color: var(--color-neutral-dark);
      display: flex;
      min-height: 100vh;
      font-size: 15px;
      line-height: 1.5;
    }

    /* Sidebar Navigation */
    .studio-sidebar {
      width: 260px;
      background: var(--color-sidebar);
      color: var(--color-sidebar-text);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      z-index: 100;
    }

    .sidebar-header {
      padding: 20px 16px;
      border-bottom: 1px solid #2D3748;
    }
    .sidebar-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sidebar-subtitle {
      font-size: 0.8rem;
      color: #A0AEC0;
      margin-top: 4px;
    }

    .nav-list {
      list-style: none;
      padding: 12px 8px;
      flex: 1;
    }
    .nav-item {
      margin-bottom: 4px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: #CBD5E0;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .nav-link:hover {
      background: #2D3748;
      color: #FFFFFF;
    }
    .nav-link.active {
      background: var(--color-primary);
      color: #FFFFFF;
    }
    .nav-icon {
      width: 18px;
      text-align: center;
      font-size: 1rem;
    }

    /* Main Container */
    .studio-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-y: auto;
    }

    /* Top Bar */
    .top-bar {
      background: #FFFFFF;
      border-bottom: 1px solid var(--color-neutral-light);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 90;
    }
    .top-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .mobile-menu-btn {
      display: none;
      background: none;
      border: 1px solid var(--color-neutral-light);
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.2rem;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-neutral-dark);
    }
    .top-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-bg-app);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--color-neutral-light);
      font-size: 0.85rem;
    }
    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .role-badge.admin { background: #EBF8FF; color: var(--color-primary); }
    .role-badge.editor { background: #FEFCBF; color: #B7791F; }
    .role-badge.reviewer { background: #E6FFFA; color: var(--color-teal); }

    .dirty-indicator {
      display: none;
      align-items: center;
      gap: 6px;
      color: var(--color-warning);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .dirty-indicator.visible { display: flex; }

    /* Content Area */
    .content-area {
      padding: 24px;
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }

    /* Cards and Forms */
    .card {
      background: var(--color-bg-card);
      border-radius: 8px;
      border: 1px solid var(--color-neutral-light);
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--color-neutral-dark);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--color-neutral-dark);
    }
    .form-group .hint {
      font-size: 0.8rem;
      color: var(--color-neutral-mid);
      margin-top: 4px;
    }
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-neutral-light);
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.95rem;
      background: #FFFFFF;
      transition: border-color 0.15s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary);
    }
    textarea.form-control {
      min-height: 90px;
      resize: vertical;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--color-primary);
      color: #FFFFFF;
    }
    .btn-primary:hover { background: var(--color-primary-hover); }
    .btn-secondary {
      background: #FFFFFF;
      color: var(--color-neutral-dark);
      border-color: var(--color-neutral-light);
    }
    .btn-secondary:hover { background: var(--color-bg-app); }
    .btn-danger {
      background: var(--color-danger);
      color: #FFFFFF;
    }
    .btn-danger:hover { background: #9B2C2C; }
    .btn-success {
      background: var(--color-success);
      color: #FFFFFF;
    }
    .btn-success:hover { background: #2F855A; }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }

    /* Alert Boxes */
    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }
    .alert-info { background: #EBF8FF; color: #2B6CB0; border: 1px solid #BEE3F8; }
    .alert-success { background: var(--color-success-light); color: var(--color-success); border: 1px solid #C6F6D5; }
    .alert-warning { background: var(--color-warning-light); color: #C05621; border: 1px solid #FEEBC8; }
    .alert-danger { background: var(--color-danger-light); color: var(--color-danger); border: 1px solid #FED7D7; }

    /* Tables */
    .table-container {
      overflow-x: auto;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    table.data-table th, table.data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-neutral-light);
      text-align: left;
    }
    table.data-table th {
      background: var(--color-bg-app);
      font-weight: 600;
      color: var(--color-neutral-dark);
    }

    /* Diff Viewer */
    .diff-box {
      font-family: monospace;
      font-size: 0.85rem;
      background: #2D3748;
      color: #F7FAFC;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      max-height: 400px;
    }
    .diff-line-add { color: #68D391; }
    .diff-line-del { color: #FC8181; }

    /* Responsive */
    @media (max-width: 768px) {
      .studio-sidebar {
        position: fixed;
        left: -260px;
        transition: left 0.25s ease;
      }
      .studio-sidebar.open {
        left: 0;
      }
      .mobile-menu-btn {
        display: block;
      }
      .content-area {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="studio-sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">
        <span>🎨</span>
        <span>Content Studio</span>
      </div>
      <div class="sidebar-subtitle">Mang Theo Một Nét Vẽ</div>
    </div>
    <ul class="nav-list">
      <li class="nav-item">
        <a class="nav-link active" data-tab="dashboard">
          <span class="nav-icon">📊</span>
          <span>1. Tổng quan</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="project">
          <span class="nav-icon">📖</span>
          <span>2. Dự án & Thông điệp</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="journal">
          <span class="nav-icon">📝</span>
          <span>3. Nhật ký hành trình</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="media">
          <span class="nav-icon">🖼️</span>
          <span>4. Thư viện Media</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="products">
          <span class="nav-icon">🛍️</span>
          <span>5. Sản phẩm & Mở bán</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="finance">
          <span class="nav-icon">💰</span>
          <span>6. Tài chính & Sao kê</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="team">
          <span class="nav-icon">👥</span>
          <span>7. Nhóm, FAQ & SEO</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="publish">
          <span class="nav-icon">🚀</span>
          <span>8. Lịch sử & Xuất bản</span>
        </a>
      </li>
    </ul>
    ${
      isDev
        ? `
    <div style="padding: 16px; border-top: 1px solid #2D3748;">
      <div style="font-size: 0.75rem; color: #A0AEC0; margin-bottom: 6px; text-transform: uppercase; font-weight: 700;">Chế độ Dev: Chuyển vai trò</div>
      <select id="devRoleSelect" class="form-control" style="background: #2D3748; color: #FFFFFF; border-color: #4A5568; font-size: 0.85rem;">
        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Quản trị viên (Admin)</option>
        <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Biên tập viên (Editor)</option>
        <option value="reviewer" ${user.role === 'reviewer' ? 'selected' : ''}>Người duyệt (Reviewer)</option>
      </select>
    </div>`
        : ''
    }
  </aside>

  <!-- Main Area -->
  <main class="studio-main">
    <header class="top-bar">
      <div class="top-left">
        <button class="mobile-menu-btn" id="toggleSidebarBtn" aria-label="Menu">☰</button>
        <h1 class="page-title" id="pageHeading">Tổng quan hệ thống</h1>
      </div>
      <div class="top-right">
        <div class="dirty-indicator" id="dirtyIndicator">
          <span>⚠️</span>
          <span>Có thay đổi chưa lưu</span>
        </div>
        <div class="user-pill">
          <span>${escapeHtml(user.email)}</span>
          <span class="role-badge ${escapeHtml(user.role)}">${escapeHtml(user.role)}</span>
        </div>
      </div>
    </header>

    <div class="content-area" id="tabContent">
      <!-- Loading indicator -->
      <div style="text-align: center; padding: 40px; color: var(--color-neutral-mid);">
        Đang tải phân hệ...
      </div>
    </div>
  </main>

  <script>
    // Studio Core Client Application
    (function() {
      let currentTab = 'dashboard';
      let isFormDirty = false;
      let currentUserRole = '${escapeHtml(user.role)}';

      function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function showToast(message, type) {
        let container = document.getElementById('studioToastContainer');
        if (!container) {
          container = document.createElement('div');
          container.id = 'studioToastContainer';
          container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 8px; max-width: 440px;';
          document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        const bg = type === 'success' ? '#2e7d32' : (type === 'error' ? '#c62828' : '#0288d1');
        toast.style.cssText = 'background: ' + bg + '; color: #fff; padding: 12px 16px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; justify-content: space-between; gap: 12px;';
        toast.innerHTML = '<span>' + escapeHtml(message) + '</span><button style=\"background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; line-height: 1;\" aria-label=\"Đóng\">&times;</button>';
        toast.querySelector('button').onclick = function() { toast.remove(); };
        container.appendChild(toast);
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 6000);
      }

      const sidebar = document.getElementById('sidebar');
      const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
      const pageHeading = document.getElementById('pageHeading');
      const tabContent = document.getElementById('tabContent');
      const dirtyIndicator = document.getElementById('dirtyIndicator');
      const navLinks = document.querySelectorAll('.nav-link');
      const devRoleSelect = document.getElementById('devRoleSelect');

      // Toggle Sidebar Mobile
      if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
          sidebar.classList.toggle('open');
        });
      }

      // Dev Role Switcher
      if (devRoleSelect) {
        devRoleSelect.addEventListener('change', (e) => {
          const newRole = e.target.value;
          document.cookie = 'studio_dev_role=' + newRole + '; path=/; max-age=86400';
          window.location.href = window.location.pathname + '?dev_role=' + newRole;
        });
      }

      // Unsaved Changes Guard
      window.addEventListener('beforeunload', (e) => {
        if (isFormDirty) {
          e.preventDefault();
          e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?';
        }
      });

      function setDirty(dirty) {
        isFormDirty = dirty;
        if (dirty) {
          dirtyIndicator.classList.add('visible');
        } else {
          dirtyIndicator.classList.remove('visible');
        }
      }

      // Tab Navigation
      navLinks.forEach((link) => {
        link.addEventListener('click', () => {
          const tab = link.getAttribute('data-tab');
          if (tab === currentTab) return;

          if (isFormDirty && !confirm('Bạn có thay đổi chưa lưu. Bạn có muốn chuyển tab mà không lưu?')) {
            return;
          }

          navLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
          currentTab = tab;
          setDirty(false);
          loadTab(tab);
          if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
          }
        });
      });

      async function fetchApi(path, options = {}) {
        const res = await fetch(path, {
          ...options,
          headers: {
            'Accept': 'application/json',
            ...(options.headers || {})
          }
        });
        const json = await res.json().catch(() => ({ error: 'Phản hồi không phải JSON' }));
        return { ok: res.ok, status: res.status, data: json };
      }

      // Loaders for each tab
      async function loadTab(tab) {
        tabContent.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--color-neutral-mid);">Đang tải dữ liệu phân hệ...</div>';

        switch (tab) {
          case 'dashboard':
            pageHeading.textContent = '1. Tổng quan hệ thống';
            await renderDashboard();
            break;
          case 'project':
            pageHeading.textContent = '2. Dự án & Thông điệp';
            await renderProjectEditor();
            break;
          case 'journal':
            pageHeading.textContent = '3. Nhật ký hành trình';
            await renderJournalEditor();
            break;
          case 'media':
            pageHeading.textContent = '4. Thư viện Media';
            await renderMediaLibrary();
            break;
          case 'products':
            pageHeading.textContent = '5. Sản phẩm & Mở bán';
            await renderProductsEditor();
            break;
          case 'finance':
            pageHeading.textContent = '6. Tài chính & Sao kê';
            await renderFinanceEditor();
            break;
          case 'team':
            pageHeading.textContent = '7. Nhóm, FAQ & SEO';
            await renderTeamEditor();
            break;
          case 'publish':
            pageHeading.textContent = '8. Lịch sử & Xuất bản';
            await renderPublishView();
            break;
        }
      }

      // ==========================================
      // Tab 1: Dashboard
      // ==========================================
      async function renderDashboard() {
        const [pubRes, auditRes] = await Promise.all([
          fetchApi('/api/publications'),
          fetchApi('/api/audit-logs?limit=5')
        ]);

        const pubs = pubRes.ok ? pubRes.data.publications || [] : [];
        const audits = auditRes.ok ? auditRes.data.logs || [] : [];
        const latestPub = pubs[0] || null;

        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">
              <span>Trạng thái xuất bản hiện tại</span>
              \${latestPub ? '<span class="role-badge" style="background:#EBF8FF; color:#2B6CB0;">' + latestPub.status + '</span>' : ''}
            </div>
            <p style="color: var(--color-neutral-mid); margin-bottom: 16px;">
              \${latestPub ? 'Bản xuất bản gần nhất: <strong>' + latestPub.id + '</strong> (' + new Date(latestPub.createdAt).toLocaleString('vi-VN') + '). Trạng thái triển khai: <strong>' + latestPub.deployStatus + '</strong>' : 'Chưa có bản xuất bản nào được tạo.'}
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="document.querySelector('[data-tab=publish]').click()">Xem quy trình duyệt xuất bản 🚀</button>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Lối tắt 7 phân hệ nghiệp vụ</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
              <div style="padding: 12px; border: 1px solid var(--color-neutral-light); border-radius: 6px; cursor: pointer;" onclick="document.querySelector('[data-tab=project]').click()">
                <strong>2. Dự án & Thông điệp</strong>
                <div style="font-size: 0.8rem; color: var(--color-neutral-mid);">Tiêu đề, khẩu hiệu, 4 hoạt động, giai đoạn</div>
              </div>
              <div style="padding: 12px; border: 1px solid var(--color-neutral-light); border-radius: 6px; cursor: pointer;" onclick="document.querySelector('[data-tab=journal]').click()">
                <strong>3. Nhật ký hành trình</strong>
                <div style="font-size: 0.8rem; color: var(--color-neutral-mid);">Bài viết thực địa, ảnh kèm chú thích</div>
              </div>
              <div style="padding: 12px; border: 1px solid var(--color-neutral-light); border-radius: 6px; cursor: pointer;" onclick="document.querySelector('[data-tab=media]').click()">
                <strong>4. Thư viện Media</strong>
                <div style="font-size: 0.8rem; color: var(--color-neutral-mid);">Tải ảnh R2, magic bytes, alt & tác quyền</div>
              </div>
              <div style="padding: 12px; border: 1px solid var(--color-neutral-light); border-radius: 6px; cursor: pointer;" onclick="document.querySelector('[data-tab=products]').click()">
                <strong>5. Sản phẩm & Mở bán</strong>
                <div style="font-size: 0.8rem; color: var(--color-neutral-mid);">Chuồn chuồn tre, Móc khóa, trạng thái mở bán</div>
              </div>
              <div style="padding: 12px; border: 1px solid var(--color-neutral-light); border-radius: 6px; cursor: pointer;" onclick="document.querySelector('[data-tab=finance]').click()">
                <strong>6. Tài chính & Sao kê</strong>
                <div style="font-size: 0.8rem; color: var(--color-neutral-mid);">Đối soát CSV, ẩn danh, phê duyệt 4 mắt</div>
              </div>
              <div style="padding: 12px; border: 1px solid var(--color-neutral-light); border-radius: 6px; cursor: pointer;" onclick="document.querySelector('[data-tab=team]').click()">
                <strong>7. Nhóm, FAQ & SEO</strong>
                <div style="font-size: 0.8rem; color: var(--color-neutral-mid);">Thông tin 7 thành viên, nguyên tắc, câu hỏi</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Nhật ký kiểm toán gần đây</div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người thực hiện</th>
                    <th>Hành động</th>
                    <th>Phân hệ</th>
                  </tr>
                </thead>
                <tbody>
                  \${audits.map(a => \`
                    <tr>
                      <td>\${new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                      <td>\${a.userEmail}</td>
                      <td><code>\${a.action}</code></td>
                      <td>\${a.moduleKey}</td>
                    </tr>
                  \`).join('')}
                  \${audits.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: var(--color-neutral-mid);">Chưa có nhật ký kiểm toán.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      }

      // ==========================================
      // Tab 2: Project Narrative Form
      // ==========================================
      async function renderProjectEditor() {
        const res = await fetchApi('/api/drafts/project');
        if (!res.ok) {
          tabContent.innerHTML = '<div class="alert alert-danger">Không thể tải bản nháp phân hệ Dự án.</div>';
          return;
        }
        activeDraft = res.data.draft;
        const p = activeDraft.data || {};
        const prog = p.progress || { currentWeek: 1, totalWeeks: 5, currentStageIndex: 0, updatedAt: '2026-10-09' };
        const sessions = p.plannedSessions || [
          { id: 'buoi-choi', title: 'Buổi chơi tại Mái ấm', date: '2026-10-24', time: '14:00', weekday: 'Thứ Bảy', description: 'Bốn góc hoạt động, khoảng 180 phút, có hai lần nghỉ.' },
          { id: 'trao-qua', title: 'Gặp lại và trao quà', date: '2026-10-31', time: '14:00', weekday: 'Thứ Bảy', description: 'Trao vật phẩm theo danh mục Mái ấm xác nhận, khoảng 30–45 phút.' }
        ];
        const contacts = p.contacts || {
          status: 'confirmed',
          people: [
            { name: 'Nguyễn Chí Trung', role: 'Trưởng dự án', phone: '0984 441 726', phoneE164: '+84984441726' },
            { name: 'Lê Tuấn Anh', role: 'Đại diện đối ngoại', phone: '0343 999 199', phoneE164: '+84343999199' }
          ],
          fanpageUrl: 'https://www.facebook.com/mangtheomotnetve',
          sourceRef: 'supplement-c07:muc-6',
          updatedAt: '2026-10-09'
        };

        tabContent.innerHTML = \`
          <form id="projectForm" class="card">
            <div class="card-title">
              <span>Thông tin chung về Dự án & Thông điệp</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu bản nháp 💾</button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tiêu đề dự án *</label>
                <input type="text" class="form-control" name="title" value="\${escapeHtml(p.title || '')}" required>
              </div>
              <div class="form-group">
                <label>Khẩu hiệu (Slogan)</label>
                <input type="text" class="form-control" name="slogan" value="\${escapeHtml(p.slogan || '')}">
              </div>
            </div>

            <div class="form-group">
              <label>Tóm tắt dự án *</label>
              <textarea class="form-control" name="summary" required>\${escapeHtml(p.summary || '')}</textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Địa điểm</label>
                <input type="text" class="form-control" name="location" value="\${escapeHtml(p.location || '')}">
              </div>
              <div class="form-group">
                <label>Trạng thái thực hiện</label>
                <select class="form-control" name="executionStatus">
                  <option value="in_progress" \${p.executionStatus === 'in_progress' ? 'selected' : ''}>Đang triển khai (in_progress)</option>
                  <option value="completed" \${p.executionStatus === 'completed' ? 'selected' : ''}>Đã hoàn thành (completed)</option>
                  <option value="unknown" \${p.executionStatus === 'unknown' ? 'selected' : ''}>Chưa xác định (unknown)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Thông báo trạng thái</label>
                <input type="text" class="form-control" name="statusNotice" value="\${escapeHtml(p.statusNotice || '')}">
              </div>
              <div class="form-group">
                <label>Thông báo bản xem trước</label>
                <input type="text" class="form-control" name="previewNotice" value="\${escapeHtml(p.previewNotice || '')}">
              </div>
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Tiến độ Dự án (Project Progress)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Tuần hiện tại (currentWeek)</label>
                  <input type="number" class="form-control" name="prog_currentWeek" value="\${prog.currentWeek}" min="1" max="10" required>
                </div>
                <div class="form-group">
                  <label>Tổng số tuần (totalWeeks)</label>
                  <input type="number" class="form-control" name="prog_totalWeeks" value="\${prog.totalWeeks}" min="1" max="10" required>
                </div>
                <div class="form-group">
                  <label>Chỉ số giai đoạn hiện tại (currentStageIndex: 0-3)</label>
                  <input type="number" class="form-control" name="prog_currentStageIndex" value="\${prog.currentStageIndex}" min="0" max="3" required>
                </div>
                <div class="form-group">
                  <label>Ngày cập nhật tiến độ (YYYY-MM-DD)</label>
                  <input type="date" class="form-control" name="prog_updatedAt" value="\${prog.updatedAt}" required>
                </div>
              </div>
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Lịch Hai Buổi Hoạt động tại Mái ấm (Planned Sessions)</h3>
              \${sessions.map((s, idx) => \`
                <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                  <strong style="display:block; margin-bottom: 8px;">Buổi \${idx + 1}: \${escapeHtml(s.title)} (\${escapeHtml(s.id)})</strong>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Tiêu đề</label>
                      <input type="text" class="form-control" name="sess_title_\${idx}" value="\${escapeHtml(s.title)}">
                    </div>
                    <div class="form-group">
                      <label>Ngày (YYYY-MM-DD)</label>
                      <input type="date" class="form-control" name="sess_date_\${idx}" value="\${escapeHtml(s.date)}">
                    </div>
                    <div class="form-group">
                      <label>Giờ</label>
                      <input type="text" class="form-control" name="sess_time_\${idx}" value="\${escapeHtml(s.time)}">
                    </div>
                    <div class="form-group">
                      <label>Thứ trong tuần</label>
                      <input type="text" class="form-control" name="sess_weekday_\${idx}" value="\${escapeHtml(s.weekday)}">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Mô tả buổi hoạt động</label>
                    <input type="text" class="form-control" name="sess_desc_\${idx}" value="\${escapeHtml(s.description)}">
                  </div>
                </div>
              \`).join('')}
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Đầu mối Liên hệ Chính thức (Official Contacts)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Trưởng dự án</label>
                  <input type="text" class="form-control" name="contact_name_0" value="\${escapeHtml(contacts.people[0]?.name ?? '')}">
                </div>
                <div class="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" class="form-control" name="contact_phone_0" value="\${escapeHtml(contacts.people[0]?.phone ?? '')}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Đại diện đối ngoại</label>
                  <input type="text" class="form-control" name="contact_name_1" value="\${escapeHtml(contacts.people[1]?.name ?? '')}">
                </div>
                <div class="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" class="form-control" name="contact_phone_1" value="\${escapeHtml(contacts.people[1]?.phone ?? '')}">
                </div>
              </div>
              <div class="form-group">
                <label>Trang Facebook / Fanpage Dự án</label>
                <input type="url" class="form-control" name="contact_fanpage" value="\${escapeHtml(contacts.fanpageUrl ?? '')}">
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu toàn bộ bản nháp phân hệ Dự án</button>
            </div>
          </form>
        \`;

        const form = document.getElementById('projectForm');
        form.addEventListener('input', () => setDirty(true));
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const updated = {
            ...activeDraft.data,
            title: fd.get('title'),
            slogan: fd.get('slogan'),
            summary: fd.get('summary'),
            location: fd.get('location'),
            executionStatus: fd.get('executionStatus'),
            statusNotice: fd.get('statusNotice'),
            previewNotice: fd.get('previewNotice'),
            progress: {
              currentWeek: parseInt(fd.get('prog_currentWeek'), 10),
              totalWeeks: parseInt(fd.get('prog_totalWeeks'), 10),
              currentStageIndex: parseInt(fd.get('prog_currentStageIndex'), 10),
              updatedAt: fd.get('prog_updatedAt'),
            },
            plannedSessions: sessions.map((s, idx) => ({
              ...s,
              title: fd.get(\`sess_title_\${idx}\`),
              date: fd.get(\`sess_date_\${idx}\`),
              time: fd.get(\`sess_time_\${idx}\`),
              weekday: fd.get(\`sess_weekday_\${idx}\`),
              description: fd.get(\`sess_desc_\${idx}\`),
            })),
            contacts: {
              ...contacts,
              people: [
                {
                  name: fd.get('contact_name_0'),
                  role: 'Trưởng dự án',
                  phone: fd.get('contact_phone_0'),
                  phoneE164: '+84' + String(fd.get('contact_phone_0')).replace(/\\D/g, '').replace(/^0/, ''),
                },
                {
                  name: fd.get('contact_name_1'),
                  role: 'Đại diện đối ngoại',
                  phone: fd.get('contact_phone_1'),
                  phoneE164: '+84' + String(fd.get('contact_phone_1')).replace(/\\D/g, '').replace(/^0/, ''),
                },
              ],
              fanpageUrl: fd.get('contact_fanpage'),
            },
          };

          const saveRes = await fetchApi('/api/drafts/project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: updated,
              expectedHash: activeDraft.revisionHash,
              comment: 'Cập nhật thông tin dự án, tiến độ và lịch trình'
            })
          });

          if (saveRes.ok) {
            setDirty(false);
            activeDraft = saveRes.data.draft;
            showToast('Đã lưu bản nháp dự án thành công!', 'success');
          } else {
            showToast('Lỗi lưu bản nháp: ' + (saveRes.data.error || 'Lỗi không xác định'), 'error');
          }
        });
      }

      // ==========================================
      // Tab 3: Journal Editor
      // ==========================================
      let journalArticlesCache = [];

      async function renderJournalEditor() {
        const res = await fetchApi('/api/drafts/journal');
        if (!res.ok) {
          tabContent.innerHTML = '<div class="alert alert-danger">Không thể tải phân hệ Nhật ký.</div>';
          return;
        }
        activeDraft = res.data.draft;
        journalArticlesCache = Array.isArray(activeDraft.data) ? JSON.parse(JSON.stringify(activeDraft.data)) : [];

        renderJournalListView();
      }

      function renderJournalListView() {
        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">
              <span>Danh sách bài viết nhật ký thực địa (\${journalArticlesCache.length})</span>
              <button class="btn btn-primary btn-sm" id="addNewArticleBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Viết bài mới</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Slug</th>
                    <th>Tiêu đề</th>
                    <th>Danh mục</th>
                    <th>Ngày công bố</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${journalArticlesCache.map((a, idx) => \`
                    <tr>
                      <td><code>\${escapeHtml(a.slug)}</code></td>
                      <td><strong>\${escapeHtml(a.title)}</strong></td>
                      <td>\${escapeHtml(a.categoryLabel || a.category)}</td>
                      <td>\${escapeHtml(a.publishedAt)}</td>
                      <td><span class="role-badge" style="background:\${a.status === 'published' ? '#C6F6D5' : '#FED7D7'}; color:#2D3748;">\${escapeHtml(a.status)}</span></td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="openArticleEditor(\${idx})" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Sửa bài viết ✏️</button>
                      </td>
                    </tr>
                  \`).join('')}
                  \${journalArticlesCache.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--color-neutral-mid);">Chưa có bài viết nhật ký nào.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        \`;

        const addBtn = document.getElementById('addNewArticleBtn');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            const newArt = {
              slug: 'bai-viet-moi-' + Date.now(),
              title: 'Tiêu đề bài viết mới',
              summary: 'Tóm tắt bài viết...',
              category: 'hoat-dong',
              categoryLabel: 'Hoạt động',
              publishedAt: null,
              eventDate: null,
              eventStatus: 'planned',
              status: 'draft',
              content: [{ type: 'paragraph', text: 'Nội dung đoạn văn đầu tiên...' }]
            };
            journalArticlesCache.push(newArt);
            openArticleEditor(journalArticlesCache.length - 1);
          });
        }
      }

      window.openArticleEditor = function(articleIdx) {
        const a = journalArticlesCache[articleIdx];
        if (!a) return;

        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">
              <span>Chỉnh sửa bài viết: <code>\${escapeHtml(a.slug)}</code></span>
              <button class="btn btn-secondary btn-sm" id="backToJournalListBtn">← Quay lại danh sách</button>
            </div>

            <form id="articleForm">
              <div class="form-row">
                <div class="form-group">
                  <label>Slug đường dẫn *</label>
                  <input type="text" class="form-control" name="art_slug" value="\${escapeHtml(a.slug)}" required>
                </div>
                <div class="form-group">
                  <label>Tiêu đề bài viết *</label>
                  <input type="text" class="form-control" name="art_title" value="\${escapeHtml(a.title)}" required>
                </div>
              </div>

              <div class="form-group">
                <label>Tóm tắt bài viết *</label>
                <textarea class="form-control" name="art_summary" required>\${escapeHtml(a.summary)}</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Danh mục</label>
                  <select class="form-control" name="art_category">
                    <option value="ke-hoach" \${a.category === 'ke-hoach' ? 'selected' : ''}>Kế hoạch (ke-hoach)</option>
                    <option value="chuan-bi" \${a.category === 'chuan-bi' ? 'selected' : ''}>Chuẩn bị (chuan-bi)</option>
                    <option value="hoat-dong" \${a.category === 'hoat-dong' ? 'selected' : ''}>Hoạt động (hoat-dong)</option>
                    <option value="ban-giao" \${a.category === 'ban-giao' ? 'selected' : ''}>Bàn giao (ban-giao)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Nhãn hiển thị danh mục</label>
                  <input type="text" class="form-control" name="art_categoryLabel" value="\${escapeHtml(a.categoryLabel || '')}">
                </div>
                <div class="form-group">
                  <label>Trạng thái bài viết</label>
                  <select class="form-control" name="art_status">
                    <option value="draft" \${a.status === 'draft' ? 'selected' : ''}>Bản nháp (draft)</option>
                    <option value="published" \${a.status === 'published' ? 'selected' : ''}>Đã duyệt xuất bản (published)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Ngày công bố (YYYY-MM-DD) *</label>
                  <input type="date" class="form-control" name="art_publishedAt" value="\${escapeHtml(a.publishedAt)}" required>
                </div>
                <div class="form-group">
                  <label>Ngày sự kiện thực tế</label>
                  <input type="date" class="form-control" name="art_eventDate" value="\${escapeHtml(a.eventDate || '')}">
                </div>
                <div class="form-group">
                  <label>Trạng thái sự kiện</label>
                  <select class="form-control" name="art_eventStatus">
                    <option value="planned" \${a.eventStatus === 'planned' ? 'selected' : ''}>Kế hoạch (planned)</option>
                    <option value="in_progress" \${a.eventStatus === 'in_progress' ? 'selected' : ''}>Đang diễn ra (in_progress)</option>
                    <option value="completed" \${a.eventStatus === 'completed' ? 'selected' : ''}>Đã hoàn thành (completed)</option>
                    <option value="cancelled" \${a.eventStatus === 'cancelled' ? 'selected' : ''}>Đã hủy (cancelled)</option>
                  </select>
                </div>
              </div>

              <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
                <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Ảnh bìa đại diện (Cover Image)</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>Đường dẫn ảnh bìa (src)</label>
                    <input type="text" class="form-control" name="cover_src" value="\${escapeHtml(a.coverImage?.src || '')}">
                  </div>
                  <div class="form-group">
                    <label>Alt Text (Tiếp cận)</label>
                    <input type="text" class="form-control" name="cover_alt" value="\${escapeHtml(a.coverImage?.alt || '')}">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Chú thích (Caption)</label>
                    <input type="text" class="form-control" name="cover_caption" value="\${escapeHtml(a.coverImage?.caption || '')}">
                  </div>
                  <div class="form-group">
                    <label>Tác giả / Nguồn ảnh (Credit Name)</label>
                    <input type="text" class="form-control" name="cover_creditName" value="\${escapeHtml(a.coverImage?.creditName || '')}">
                  </div>
                </div>
              </div>

              <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-primary);">Các khối nội dung bài viết (\${(a.content || []).length})</h3>
                  <button type="button" class="btn btn-secondary btn-sm" id="addBlockBtn">+ Thêm đoạn văn</button>
                </div>

                <div id="blocksContainer">
                  \${(a.content || []).map((blk, bIdx) => \`
                    <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;" data-bidx="\${bIdx}">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>Khối \${bIdx + 1}: \${escapeHtml(blk.type)}</strong>
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeArticleBlock(\${articleIdx}, \${bIdx})">Xóa khối 🗑️</button>
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label>Loại khối</label>
                          <select class="form-control" name="blk_type_\${bIdx}">
                            <option value="paragraph" \${blk.type === 'paragraph' ? 'selected' : ''}>Đoạn văn (paragraph)</option>
                            <option value="heading" \${blk.type === 'heading' ? 'selected' : ''}>Tiêu đề phụ (heading)</option>
                            <option value="callout" \${blk.type === 'callout' ? 'selected' : ''}>Hộp lưu ý (callout)</option>
                            <option value="quote" \${blk.type === 'quote' ? 'selected' : ''}>Trích dẫn (quote)</option>
                            <option value="list" \${blk.type === 'list' ? 'selected' : ''}>Danh sách (list - cách nhau dấu phẩy)</option>
                            <option value="image" \${blk.type === 'image' ? 'selected' : ''}>Ảnh trong bài (image)</option>
                          </select>
                        </div>
                        <div class="form-group" style="flex: 2;">
                          <label>Nội dung văn bản / Đường dẫn ảnh / Danh sách</label>
                          <textarea class="form-control" name="blk_text_\${bIdx}">\${escapeHtml(blk.text || (blk.items ? blk.items.join(', ') : blk.src || ''))}</textarea>
                        </div>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>

              <div style="margin-top: 20px; display: flex; gap: 12px;">
                <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu bài viết vào bản nháp 💾</button>
                <button type="button" class="btn btn-secondary" onclick="renderJournalListView()">Hủy</button>
              </div>
            </form>
          </div>
        \`;

        document.getElementById('backToJournalListBtn')?.addEventListener('click', renderJournalListView);

        document.getElementById('addBlockBtn')?.addEventListener('click', () => {
          if (!a.content) a.content = [];
          a.content.push({ type: 'paragraph', text: '' });
          openArticleEditor(articleIdx);
        });

        const artForm = document.getElementById('articleForm');
        artForm?.addEventListener('input', () => setDirty(true));
        artForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(artForm);

          const blocks = [];
          const bCount = (a.content || []).length;
          for (let i = 0; i < bCount; i++) {
            const bType = fd.get(\`blk_type_\${i}\`) || 'paragraph';
            const bRaw = fd.get(\`blk_text_\${i}\`) || '';
            if (bType === 'list') {
              blocks.push({
                type: 'list',
                items: bRaw.split(',').map(s => s.trim()).filter(Boolean)
              });
            } else if (bType === 'image') {
              blocks.push({
                type: 'image',
                src: bRaw.trim(),
                alt: 'Ảnh minh họa',
                caption: ''
              });
            } else if (bType === 'heading') {
              blocks.push({
                type: 'heading',
                level: 2,
                text: bRaw
              });
            } else {
              blocks.push({
                type: bType,
                text: bRaw
              });
            }
          }

          a.slug = fd.get('art_slug');
          a.title = fd.get('art_title');
          a.summary = fd.get('art_summary');
          a.category = fd.get('art_category');
          a.categoryLabel = fd.get('art_categoryLabel') || undefined;
          a.status = fd.get('art_status');
          a.publishedAt = fd.get('art_publishedAt');
          a.eventDate = fd.get('art_eventDate') || null;
          a.eventStatus = fd.get('art_eventStatus') || null;
          a.content = blocks.length > 0 ? blocks : [{ type: 'paragraph', text: 'Nội dung bài viết' }];

          const coverSrc = fd.get('cover_src');
          if (coverSrc) {
            a.coverImage = {
              src: coverSrc,
              alt: fd.get('cover_alt') || '',
              caption: fd.get('cover_caption') || '',
              creditName: fd.get('cover_creditName') || undefined,
            };
          }

          const saveRes = await fetchApi('/api/drafts/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: journalArticlesCache,
              expectedHash: activeDraft.revisionHash,
              comment: 'Cập nhật bài viết nhật ký: ' + a.slug
            })
          });

          if (saveRes.ok) {
            setDirty(false);
            activeDraft = saveRes.data.draft;
            showToast('Đã lưu bài viết nhật ký thành công!', 'success');
            renderJournalListView();
          } else {
            showToast('Lỗi lưu bài viết: ' + (saveRes.data.error || 'Lỗi không xác định'), 'error');
          }
        });
      };

      window.removeArticleBlock = function(articleIdx, blockIdx) {
        const a = journalArticlesCache[articleIdx];
        if (a && a.content) {
          a.content.splice(blockIdx, 1);
          openArticleEditor(articleIdx);
        }
      };

      // ==========================================
      // Tab 4: Media Library
      // ==========================================
      async function renderMediaLibrary() {
        const res = await fetchApi('/api/media');
        const assets = res.ok ? res.data.assets || [] : [];

        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">Tải lên tệp Media an toàn (R2 Storage)</div>
            <form id="mediaUploadForm" enctype="multipart/form-data">
              <div class="form-row">
                <div class="form-group">
                  <label>Chọn tệp ảnh (JPEG, PNG, WebP, AVIF - Tối đa 5MB) *</label>
                  <input type="file" name="file" class="form-control" accept="image/jpeg,image/png,image/webp,image/avif" required>
                  <div class="hint">Hệ thống kiểm tra magic bytes thực tế, từ chối mã SVG/Script/HTML.</div>
                </div>
                <div class="form-group">
                  <label>Mô tả ảnh cho khả năng tiếp cận (Alt Text) *</label>
                  <input type="text" name="alt" class="form-control" placeholder="Mô tả cụ thể nội dung bức ảnh..." required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Chú thích (Caption)</label>
                  <input type="text" name="caption" class="form-control" placeholder="Chú thích hiển thị dưới ảnh...">
                </div>
                <div class="form-group">
                  <label>Tác giả / Nguồn ảnh (Credit Name)</label>
                  <input type="text" name="creditName" class="form-control" placeholder="Ví dụ: Nhóm Lăng Kính">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Tải lên thư viện Media 📤</button>
            </form>
          </div>

          <div class="card">
            <div class="card-title">Tệp Media hiện có (\${assets.length})</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
              \${assets.map(a => \`
                <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; background: #FFF;">
                  <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${a.filename}</div>
                  <div style="font-size: 0.75rem; color: var(--color-neutral-mid); margin: 4px 0;">\${a.contentType} · \${(a.sizeBytes / 1024).toFixed(1)} KB</div>
                  <div style="font-size: 0.75rem; color: #4A5568;">Alt: \${a.alt}</div>
                </div>
              \`).join('')}
              \${assets.length === 0 ? '<div style="color: var(--color-neutral-mid);">Chưa có tệp tải lên nào.</div>' : ''}
            </div>
          </div>
        \`;

        const form = document.getElementById('mediaUploadForm');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const uploadRes = await fetch('/api/media/upload', {
            method: 'POST',
            body: fd
          });
          const json = await uploadRes.json();
          if (uploadRes.ok) {
            showToast('Tải tệp lên thành công!', 'success');
            renderMediaLibrary();
          } else {
            showToast('Lỗi tải tệp: ' + (json.error || 'Từ chối bởi hệ thống'), 'error');
          }
        });
      }

      // ==========================================
      // Tab 5: Products & Sales Configuration
      // ==========================================
      async function renderProductsEditor() {
        const res = await fetchApi('/api/drafts/products');
        if (!res.ok) {
          tabContent.innerHTML = '<div class="alert alert-danger">Không thể tải phân hệ Sản phẩm.</div>';
          return;
        }
        activeDraft = res.data.draft;
        const pConfig = activeDraft.data || {};

        const chuonChuon = pConfig['chuon-chuon-tre-kem-de'] || {};
        const mocKhoa = pConfig['moc-khoa'] || {};

        tabContent.innerHTML = \`
          <form id="productsForm" class="card">
            <div class="card-title">
              <span>Cấu hình Mở bán Sản phẩm Gây quỹ</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu cấu hình mở bán 💾</button>
            </div>

            <div class="alert alert-info">
              Nguyên tắc thẩm định C14/C17: Sản phẩm chỉ được phép mở bán (open) khi có giá niêm yết chính thức > 0, số lượng tồn kho >= 0, chính sách đổi trả rõ ràng và được phê duyệt công khai.
            </div>

            <!-- Sản phẩm 1: Chuồn chuồn tre -->
            <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 16px; margin-bottom: 20px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">1. Chuồn chuồn tre 12 cm kèm đế (chuon-chuon-tre-kem-de)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Trạng thái mở bán *</label>
                  <select class="form-control" name="cc_saleStatus">
                    <option value="unconfirmed" \${chuonChuon.saleStatus === 'unconfirmed' ? 'selected' : ''}>Chưa xác nhận (unconfirmed)</option>
                    <option value="open" \${chuonChuon.saleStatus === 'open' ? 'selected' : ''}>Đang mở bán (open)</option>
                    <option value="closed" \${chuonChuon.saleStatus === 'closed' ? 'selected' : ''}>Đã đóng (closed)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Giá niêm yết chính thức (VNĐ)</label>
                  <input type="number" class="form-control" name="cc_officialPrice" value="\${chuonChuon.officialPrice || ''}" placeholder="Ví dụ: 40000">
                </div>
                <div class="form-group">
                  <label>Số lượng sẵn có (Tồn kho)</label>
                  <input type="number" class="form-control" name="cc_stockAvailable" value="\${chuonChuon.stockAvailable !== null ? chuonChuon.stockAvailable : ''}" placeholder="Ví dụ: 30">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Kênh / Địa điểm giao nhận</label>
                  <input type="text" class="form-control" name="cc_salesChannel" value="\${chuonChuon.salesChannel || 'FPT Hòa Lạc'}">
                </div>
                <div class="form-group">
                  <label>Phê duyệt công khai</label>
                  <select class="form-control" name="cc_publicApproval">
                    <option value="pending" \${chuonChuon.publicApproval === 'pending' ? 'selected' : ''}>Chờ duyệt (pending)</option>
                    <option value="approved" \${chuonChuon.publicApproval === 'approved' ? 'selected' : ''}>Đã phê duyệt (approved)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Chính sách đổi trả / hoàn hủy</label>
                <input type="text" class="form-control" name="cc_returnPolicy" value="\${chuonChuon.returnPolicy || ''}" placeholder="Chính sách đổi trả khi mở bán...">
              </div>
            </div>

            <!-- Sản phẩm 2: Móc khóa -->
            <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">2. Móc khóa Lăng Kính (moc-khoa)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Trạng thái mở bán *</label>
                  <select class="form-control" name="mk_saleStatus">
                    <option value="unconfirmed" \${mocKhoa.saleStatus === 'unconfirmed' ? 'selected' : ''}>Chưa xác nhận (unconfirmed)</option>
                    <option value="open" \${mocKhoa.saleStatus === 'open' ? 'selected' : ''}>Đang mở bán (open)</option>
                    <option value="closed" \${mocKhoa.saleStatus === 'closed' ? 'selected' : ''}>Đã đóng (closed)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Giá niêm yết chính thức (VNĐ)</label>
                  <input type="number" class="form-control" name="mk_officialPrice" value="\${mocKhoa.officialPrice || ''}" placeholder="Ví dụ: 10000">
                </div>
                <div class="form-group">
                  <label>Số lượng sẵn có (Tồn kho)</label>
                  <input type="number" class="form-control" name="mk_stockAvailable" value="\${mocKhoa.stockAvailable !== null ? mocKhoa.stockAvailable : ''}" placeholder="Ví dụ: 100">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Kênh / Địa điểm giao nhận</label>
                  <input type="text" class="form-control" name="mk_salesChannel" value="\${mocKhoa.salesChannel || 'FPT Hòa Lạc'}">
                </div>
                <div class="form-group">
                  <label>Phê duyệt công khai</label>
                  <select class="form-control" name="mk_publicApproval">
                    <option value="pending" \${mocKhoa.publicApproval === 'pending' ? 'selected' : ''}>Chờ duyệt (pending)</option>
                    <option value="approved" \${mocKhoa.publicApproval === 'approved' ? 'selected' : ''}>Đã phê duyệt (approved)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Chính sách đổi trả / hoàn hủy</label>
                <input type="text" class="form-control" name="mk_returnPolicy" value="\${mocKhoa.returnPolicy || ''}" placeholder="Chính sách đổi trả khi mở bán...">
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu cấu hình mở bán</button>
            </div>
          </form>
        \`;

        const form = document.getElementById('productsForm');
        form.addEventListener('input', () => setDirty(true));
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const updated = {
            'chuon-chuon-tre-kem-de': {
              saleStatus: fd.get('cc_saleStatus'),
              officialPrice: fd.get('cc_officialPrice') ? parseInt(fd.get('cc_officialPrice'), 10) : null,
              stockAvailable: fd.get('cc_stockAvailable') ? parseInt(fd.get('cc_stockAvailable'), 10) : null,
              salesChannel: fd.get('cc_salesChannel'),
              returnPolicy: fd.get('cc_returnPolicy') || null,
              publicApproval: fd.get('cc_publicApproval'),
            },
            'moc-khoa': {
              saleStatus: fd.get('mk_saleStatus'),
              officialPrice: fd.get('mk_officialPrice') ? parseInt(fd.get('mk_officialPrice'), 10) : null,
              stockAvailable: fd.get('mk_stockAvailable') ? parseInt(fd.get('mk_stockAvailable'), 10) : null,
              salesChannel: fd.get('mk_salesChannel'),
              returnPolicy: fd.get('mk_returnPolicy') || null,
              publicApproval: fd.get('mk_publicApproval'),
            }
          };

          const saveRes = await fetchApi('/api/drafts/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: updated,
              expectedHash: activeDraft.revisionHash,
              comment: 'Cập nhật cấu hình sản phẩm mở bán'
            })
          });

          if (saveRes.ok) {
            setDirty(false);
            activeDraft = saveRes.data.draft;
            showToast('Đã lưu cấu hình mở bán sản phẩm thành công!', 'success');
          } else {
            showToast('Lỗi lưu cấu hình: ' + (saveRes.data.error || 'Lỗi không xác định'), 'error');
          }
        });
      }

      // ==========================================
      // Tab 6: Finance & Reconciliation
      // ==========================================
      async function renderFinanceEditor() {
        const res = await fetchApi('/api/drafts/finance');
        if (!res.ok) {
          tabContent.innerHTML = '<div class="alert alert-danger">Không thể tải phân hệ Tài chính.</div>';
          return;
        }
        activeDraft = res.data.draft;
        const f = activeDraft.data || {};
        const acc = f.donationAccount || {
          status: 'active',
          bankName: 'Techcombank',
          accountNumber: '999927052006',
          accountHolder: 'LE TUAN ANH',
          qrImage: '/images/ung-ho/qr-ung-ho-techcombank.png',
          transferPrefix: 'MTMNV',
          goalAmount: 3000000,
        };
        const steps = f.ledgerProcess || [
          { title: 'Một tài khoản riêng cho dự án', description: 'Mọi khoản ủng hộ chuyển vào tài khoản Techcombank đã công bố, nội dung bắt đầu bằng MTMNV để dễ nhận diện.' },
          { title: 'Hai người đối chiếu', description: 'Thành viên tài chính và một thành viên khác cùng đối chiếu từng khoản với sao kê ngân hàng trước khi ghi sổ.' },
          { title: 'Ghi sổ tối thiểu', description: 'Mỗi dòng gồm ngày, số tiền, mã giao dịch rút gọn và tên người ủng hộ đồng ý hiển thị; không ghi tên thì để Ẩn danh.' },
          { title: 'Chỉ công bố sau đối soát', description: 'Sổ được cập nhật lên website định kỳ sau mỗi lần đối soát, kèm ngày đối soát thật. Website không kết nối tự động với ngân hàng.' },
          { title: 'Xử lý nhầm, trùng, hoàn tiền', description: 'Mỗi mã giao dịch chỉ ghi một lần. Khoản chuyển nhầm được hoàn lại theo yêu cầu và không tính vào tổng; chỉnh sửa được ghi chú ở lần cập nhật sau.' },
          { title: 'Tôn trọng riêng tư', description: 'Không công khai số tài khoản, ngân hàng hay thông tin cá nhân của người gửi; chứng từ chỉ công bố bản đã che thông tin.' },
        ];

        tabContent.innerHTML = \`
          <!-- Thẻ 1: Cấu hình Tài khoản Tiếp nhận & Mục tiêu Gây quỹ -->
          <form id="donationAccountForm" class="card">
            <div class="card-title">
              <span>Cấu hình Tài khoản Tiếp nhận & Mục tiêu Gây quỹ</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu tài khoản & mục tiêu 💾</button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Trạng thái tiếp nhận *</label>
                <select class="form-control" name="acc_status">
                  <option value="active" \${acc.status === 'active' ? 'selected' : ''}>Đang tiếp nhận chính thức (active)</option>
                  <option value="pending" \${acc.status === 'pending' ? 'selected' : ''}>Chờ duyệt / Tạm dừng (pending)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Mục tiêu gây quỹ (VNĐ) *</label>
                <input type="number" class="form-control" name="acc_goalAmount" value="\${acc.goalAmount || 3000000}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Ngân hàng tiếp nhận *</label>
                <input type="text" class="form-control" name="acc_bankName" value="\${escapeHtml(acc.bankName || 'Techcombank')}" required>
              </div>
              <div class="form-group">
                <label>Số tài khoản *</label>
                <input type="text" class="form-control" name="acc_accountNumber" value="\${escapeHtml(acc.accountNumber || '999927052006')}" required>
              </div>
              <div class="form-group">
                <label>Tên chủ tài khoản *</label>
                <input type="text" class="form-control" name="acc_accountHolder" value="\${escapeHtml(acc.accountHolder || 'LE TUAN ANH')}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tiền tố chuyển khoản (Transfer Prefix) *</label>
                <input type="text" class="form-control" name="acc_transferPrefix" value="\${escapeHtml(acc.transferPrefix || 'MTMNV')}" required>
              </div>
              <div class="form-group">
                <label>Đường dẫn mã QR (qrImage)</label>
                <input type="text" class="form-control" name="acc_qrImage" value="\${escapeHtml(acc.qrImage || '/images/ung-ho/qr-ung-ho-techcombank.png')}">
              </div>
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Quy trình 6 Bước Quản lý & Công bố Tiền ủng hộ (Ledger Process)</h3>
              \${steps.map((st, sIdx) => \`
                <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                  <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                      <label>Bước \${sIdx + 1}: Tiêu đề</label>
                      <input type="text" class="form-control" name="step_title_\${sIdx}" value="\${escapeHtml(st.title)}">
                    </div>
                    <div class="form-group" style="flex: 2;">
                      <label>Mô tả quy trình</label>
                      <input type="text" class="form-control" name="step_desc_\${sIdx}" value="\${escapeHtml(st.description)}">
                    </div>
                  </div>
                </div>
              \`).join('')}
            </div>

            <div style="margin-top: 16px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu cấu hình tài khoản & quy trình đối soát</button>
            </div>
          </form>

          <!-- Thẻ 2: Đối soát CSV & Bốn mắt -->
          <div class="card">
            <div class="card-title">Đối soát & Thẩm định Sao kê Ủng hộ (CSV)</div>
            <div class="alert alert-warning">
              Quy tắc Bốn Mắt (Four-Eyes): Mọi cập nhật số liệu đối soát tài chính bắt buộc phải qua 2 người duyệt độc lập trước khi xuất bản ra trang web công khai.
            </div>

            <div class="form-row" style="margin-bottom: 16px;">
              <div>
                <strong>Trạng thái đối soát:</strong>
                <span class="role-badge" style="background:\${f.reconciled ? '#C6F6D5' : '#FED7D7'}; color:#2D3748;">\${f.reconciled ? 'Đã đối soát' : 'Chưa đối soát'}</span>
              </div>
              <div>
                <strong>Mốc ngày đối soát:</strong> \${escapeHtml(f.reconciledAt || 'Chưa chốt')}
              </div>
              <div>
                <strong>Phê duyệt công khai:</strong> \${escapeHtml(f.publicApproval)}
              </div>
            </div>

            <form id="csvImportForm" enctype="multipart/form-data" style="border: 1px dashed var(--color-neutral-mid); padding: 16px; border-radius: 6px;">
              <div class="form-group">
                <label>Tải lên tệp CSV sao kê ngân hàng đối soát (RFC 4180) *</label>
                <input type="file" name="file" class="form-control" accept=".csv" required>
              </div>
              <div class="form-group">
                <label>Mốc ngày chốt đối soát (YYYY-MM-DD)</label>
                <input type="date" name="reconciledAt" class="form-control" value="\${escapeHtml(f.reconciledAt || '2026-10-31')}">
              </div>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Thẩm định tệp CSV 📋</button>
            </form>
          </div>

          <!-- Thẻ 3: Bản chiếu giao dịch sao kê -->
          <div class="card">
            <div class="card-title">Bản chiếu giao dịch sao kê đã xử lý (\${(f.entries || []).length} khoản)</div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Số tiền (VNĐ)</th>
                    <th>Người ủng hộ</th>
                    <th>Mã tham chiếu (Đã che)</th>
                  </tr>
                </thead>
                <tbody>
                  \${(f.entries || []).map(e => \`
                    <tr>
                      <td>\${escapeHtml(e.date)}</td>
                      <td><strong>\${Number(e.amount).toLocaleString('vi-VN')} đ</strong></td>
                      <td>\${escapeHtml(e.donor)}</td>
                      <td><code>\${escapeHtml(e.reference || '(Trống)')}</code></td>
                    </tr>
                  \`).join('')}
                  \${(f.entries || []).length === 0 ? '<tr><td colspan="4" style="text-align: center; color: var(--color-neutral-mid);">Chưa có khoản ủng hộ nào được phê duyệt công khai.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        \`;

        const accForm = document.getElementById('donationAccountForm');
        accForm?.addEventListener('input', () => setDirty(true));
        accForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(accForm);

          const updatedSteps = steps.map((st, idx) => ({
            title: fd.get(\`step_title_\${idx}\`) || st.title,
            description: fd.get(\`step_desc_\${idx}\`) || st.description,
          }));

          const updated = {
            ...activeDraft.data,
            donationAccount: {
              status: fd.get('acc_status'),
              goalAmount: parseInt(fd.get('acc_goalAmount'), 10),
              bankName: fd.get('acc_bankName'),
              accountNumber: fd.get('acc_accountNumber'),
              accountHolder: fd.get('acc_accountHolder'),
              transferPrefix: fd.get('acc_transferPrefix'),
              qrImage: fd.get('acc_qrImage'),
            },
            ledgerProcess: updatedSteps,
          };

          const saveRes = await fetchApi('/api/drafts/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: updated,
              expectedHash: activeDraft.revisionHash,
              comment: 'Cập nhật tài khoản ủng hộ và quy trình đối soát'
            })
          });

          if (saveRes.ok) {
            setDirty(false);
            activeDraft = saveRes.data.draft;
            showToast('Đã lưu cấu hình tài khoản ủng hộ và quy trình đối soát thành công!', 'success');
          } else {
            showToast('Lỗi lưu: ' + (saveRes.data.error || 'Lỗi không xác định'), 'error');
          }
        });

        const csvForm = document.getElementById('csvImportForm');
        csvForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(csvForm);
          const valRes = await fetch('/api/finance/import-csv', {
            method: 'POST',
            body: fd
          });
          const json = await valRes.json();
          if (valRes.ok) {
            showToast('Thẩm định CSV thành công! Tìm thấy ' + json.rows.length + ' dòng hợp lệ, tổng tiền: ' + json.stats.totalAmount.toLocaleString('vi-VN') + ' đ.', 'success');
          } else {
            showToast('Lỗi kiểm tra CSV: ' + (json.error || 'Tệp không đạt tiêu chuẩn RFC 4180'), 'error');
          }
        });
      }

      // ==========================================
      // Tab 7: Team, FAQ & SEO
      // ==========================================
      async function renderTeamEditor() {
        const res = await fetchApi('/api/drafts/team');
        if (!res.ok) {
          tabContent.innerHTML = '<div class="alert alert-danger">Không thể tải phân hệ Nhóm & SEO.</div>';
          return;
        }
        activeDraft = res.data.draft;
        const t = activeDraft.data || {};
        const members = t.members || [
          { name: 'Nguyễn Chí Trung', role: 'Trưởng dự án', photo: '/images/thanh-vien/nguyen-chi-trung.webp', description: 'Lên lịch, theo dõi tiến độ và điều phối hoạt động của nhóm.' },
          { name: 'Nguyễn Ngọc Khoa', role: 'Tài chính', photo: '/images/thanh-vien/nguyen-ngoc-khoa.webp', description: 'Giữ sổ ủng hộ, đối chiếu sao kê và mua quà theo danh mục.' },
          { name: 'Nguyễn Như Huy', role: 'Hậu cần', photo: '/images/thanh-vien/nguyen-nhu-huy.webp', description: 'Chuẩn bị vật tư, đạo cụ và chương trình buổi chơi.' },
          { name: 'Trịnh Hiển Lân', role: 'Truyền thông', photo: '/images/thanh-vien/trinh-hien-lan.webp', description: 'Viết bài, quản lý lịch đăng và hình ảnh đúng phạm vi cho phép.' },
          { name: 'Trần Bình Trọng', role: 'Thiết kế', photo: '/images/thanh-vien/tran-binh-trong.webp', description: 'Thiết kế ấn phẩm, poster và nhận diện của dự án.' },
          { name: 'Lê Tuấn Anh', role: 'Đối ngoại', photo: '/images/thanh-vien/le-tuan-anh.webp', description: 'Làm việc với Mái ấm và các đơn vị hỗ trợ.' },
          { name: 'Nguyễn Anh Khoa', role: 'Hậu cần', photo: '/images/thanh-vien/nguyen-anh-khoa.webp', description: 'Chuẩn bị quà lưu niệm, quầy và di chuyển.' },
        ];
        const pFaqs = t.productFaqs || [
          { question: 'Giá trên trang có phải giá bán chính thức?', answer: 'Chưa. Đây là giá tham khảo trong kế hoạch. Giá, mẫu và số lượng chính thức sẽ được công bố khi mở bán.' },
          { question: 'Ai làm các sản phẩm này?', answer: 'Toàn bộ sản phẩm gây quỹ do nhóm Lăng Kính chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo, không gắn với sản xuất hàng bán; các em giữ lại sản phẩm do mình làm ra. Tranh của các em chỉ được in lên móc khóa khi có sự đồng ý phù hợp.' },
          { question: 'Khi nào có thể đặt mua?', answer: 'Khi kế hoạch bán được duyệt, nhóm sẽ công bố cách đặt hàng tại trang này. Hiện website chưa nhận đơn đặt hàng hoặc thanh toán sản phẩm.' },
          { question: 'Tiền bán hàng được dùng thế nào?', answer: 'Trước hết bù chi phí nguyên liệu và tổ chức. Phần còn lại dùng mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.' },
        ];
        const sFaqs = t.supportFaqs || [
          { question: 'Làm sao để tên tôi xuất hiện trong sao kê?', answer: 'Ghi nội dung chuyển khoản theo mẫu MTMNV và tên bạn muốn hiển thị. Nếu không ghi tên hoặc ghi “An danh”, khoản ủng hộ hiển thị là Ẩn danh. Website không hiển thị số tài khoản hay thông tin ngân hàng của người gửi.' },
          { question: 'Khi nào khoản ủng hộ của tôi được cập nhật?', answer: 'Sau mỗi lần thành viên tài chính cùng một thành viên khác đối chiếu với sao kê ngân hàng. Website không kết nối tự động với ngân hàng; khi sổ được công bố, ngày đối soát gần nhất sẽ hiển thị ở đầu bảng. Khoản ủng hộ được cập nhật định kỳ sau khi đối soát xong.' },
          { question: 'Tôi chuyển nhầm số tiền hoặc chuyển trùng thì sao?', answer: 'Hãy liên hệ một trong hai số điện thoại của nhóm kèm thời gian và mã giao dịch. Nhóm đối chiếu với sao kê và hoàn lại nếu bạn yêu cầu; khoản đã hoàn không được tính vào tổng ủng hộ.' },
          { question: 'Tiền ủng hộ được dùng vào việc gì?', answer: 'Cho vật tư buổi chơi, quà cho các em và di chuyển; phần còn lại mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.' },
          { question: 'Tôi có thể cùng đến Mái ấm không?', answer: 'Chỉ khi Mái ấm đồng ý trước. Nhóm không tuyển người tự do đến Mái ấm, để bảo đảm an toàn và riêng tư cho các em.' },
        ];
        const tFaqs = t.transparencyFaqs || [
          { question: 'Vì sao tổng ủng hộ đang ghi “Chưa cập nhật”?', answer: 'Tổng chỉ được tính từ sổ đã đối chiếu với sao kê ngân hàng. Khi nhóm chưa công bố sổ đã đối soát chính thức, website không hiển thị con số (kể cả 0đ) để tránh hiểu lầm là chưa nhận được khoản ủng hộ nào.' },
          { question: 'Tiền bán quà lưu niệm có cộng vào tổng ủng hộ không?', answer: 'Không. Thanh tiến độ chỉ tính các khoản ủng hộ qua tài khoản dự án đã đối soát. Tiền bán quà được ghi riêng.' },
          { question: 'Trường hợp số tiền ủng hộ vượt mục tiêu 3.000.000đ thì xử lý thế nào?', answer: 'Website vẫn ghi đúng tổng thực tế đã đối soát. Phần vượt mục tiêu sẽ được dùng mua thêm vật phẩm theo danh mục Mái ấm xác nhận và ghi rõ trong báo cáo tổng kết.' },
          { question: 'Khi nào nhóm công bố báo cáo tổng kết dự án?', answer: 'Sau buổi trao quà và khi thành viên tài chính cùng một thành viên khác hoàn tất đối soát. Chứng từ chỉ công bố bản đã che thông tin riêng tư.' },
        ];

        tabContent.innerHTML = \`
          <form id="teamForm" class="card">
            <div class="card-title">
              <span>Thông tin Nhóm, Thành viên, FAQs & SEO</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu phân hệ Nhóm 💾</button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tên nhóm *</label>
                <input type="text" class="form-control" name="teamName" value="\${escapeHtml(t.info?.name || 'Lăng Kính')}" required>
              </div>
              <div class="form-group">
                <label>Học phần / Lớp</label>
                <input type="text" class="form-control" name="course" value="\${escapeHtml(t.info?.course || 'Học phần SSG105 — Đại học FPT Hà Nội')}">
              </div>
              <div class="form-group">
                <label>Mã lớp</label>
                <input type="text" class="form-control" name="classId" value="\${escapeHtml(t.info?.classId || 'AI2015')}">
              </div>
            </div>

            <div class="form-group">
              <label>Giới thiệu nhóm *</label>
              <textarea class="form-control" name="teamDesc" required>\${escapeHtml(t.info?.description || '')}</textarea>
            </div>

            <!-- Bảy thành viên nhóm -->
            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Hồ sơ 7 Thành viên Nhóm (Team Members)</h3>
              \${members.map((m, mIdx) => \`
                <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                  <strong style="display:block; margin-bottom: 8px;">Thành viên \${mIdx + 1}: \${escapeHtml(m.name)} (\${escapeHtml(m.role)})</strong>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Họ và tên</label>
                      <input type="text" class="form-control" name="mem_name_\${mIdx}" value="\${escapeHtml(m.name)}">
                    </div>
                    <div class="form-group">
                      <label>Vai trò phụ trách</label>
                      <input type="text" class="form-control" name="mem_role_\${mIdx}" value="\${escapeHtml(m.role)}">
                    </div>
                    <div class="form-group">
                      <label>Đường dẫn ảnh đại diện</label>
                      <input type="text" class="form-control" name="mem_photo_\${mIdx}" value="\${escapeHtml(m.photo)}">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Mô tả nhiệm vụ & đóng góp</label>
                    <input type="text" class="form-control" name="mem_desc_\${mIdx}" value="\${escapeHtml(m.description)}">
                  </div>
                </div>
              \`).join('')}
            </div>

            <!-- 3 Nhóm FAQs -->
            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">1. FAQ Sản phẩm (Product FAQs - \${pFaqs.length} câu)</h3>
              \${pFaqs.map((q, qIdx) => \`
                <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                  <div class="form-group">
                    <label>Câu hỏi \${qIdx + 1}</label>
                    <input type="text" class="form-control" name="pfaq_q_\${qIdx}" value="\${escapeHtml(q.question)}">
                  </div>
                  <div class="form-group">
                    <label>Câu trả lời</label>
                    <textarea class="form-control" name="pfaq_a_\${qIdx}">\${escapeHtml(q.answer)}</textarea>
                  </div>
                </div>
              \`).join('')}

              <h3 style="font-size: 1rem; font-weight: 700; margin: 20px 0 12px; color: var(--color-primary);">2. FAQ Đồng hành & Tiếp nhận Ủng hộ (Support FAQs - \${sFaqs.length} câu)</h3>
              \${sFaqs.map((q, qIdx) => \`
                <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                  <div class="form-group">
                    <label>Câu hỏi \${qIdx + 1}</label>
                    <input type="text" class="form-control" name="sfaq_q_\${qIdx}" value="\${escapeHtml(q.question)}">
                  </div>
                  <div class="form-group">
                    <label>Câu trả lời</label>
                    <textarea class="form-control" name="sfaq_a_\${qIdx}">\${escapeHtml(q.answer)}</textarea>
                  </div>
                </div>
              \`).join('')}

              <h3 style="font-size: 1rem; font-weight: 700; margin: 20px 0 12px; color: var(--color-primary);">3. FAQ Minh bạch & Sao kê (Transparency FAQs - \${tFaqs.length} câu)</h3>
              \${tFaqs.map((q, qIdx) => \`
                <div style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                  <div class="form-group">
                    <label>Câu hỏi \${qIdx + 1}</label>
                    <input type="text" class="form-control" name="tfaq_q_\${qIdx}" value="\${escapeHtml(q.question)}">
                  </div>
                  <div class="form-group">
                    <label>Câu trả lời</label>
                    <textarea class="form-control" name="tfaq_a_\${qIdx}">\${escapeHtml(q.answer)}</textarea>
                  </div>
                </div>
              \`).join('')}
            </div>

            <!-- SEO & Social Meta -->
            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Thẻ Meta SEO & Chia sẻ Mạng Xã Hội</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Tiêu đề trang (SEO Title)</label>
                  <input type="text" class="form-control" name="siteTitle" value="\${escapeHtml(t.siteMeta?.siteTitle || 'Mang Theo Một Nét Vẽ | Dự án thiện nguyện sinh viên FPT')}">
                </div>
                <div class="form-group">
                  <label>Ảnh đại diện chia sẻ (og:image)</label>
                  <input type="text" class="form-control" name="ogImage" value="\${escapeHtml(t.siteMeta?.ogImage || '/images/illustrations/a01.webp')}">
                </div>
              </div>
              <div class="form-group">
                <label>Mô tả tìm kiếm (SEO Description)</label>
                <textarea class="form-control" name="siteDescription">\${escapeHtml(t.siteMeta?.siteDescription || '')}</textarea>
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu toàn bộ phân hệ Nhóm, Thành viên & FAQs</button>
            </div>
          </form>
        \`;

        const form = document.getElementById('teamForm');
        form?.addEventListener('input', () => setDirty(true));
        form?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);

          const updatedMembers = members.map((m, idx) => ({
            name: fd.get(\`mem_name_\${idx}\`) || m.name,
            role: fd.get(\`mem_role_\${idx}\`) || m.role,
            photo: fd.get(\`mem_photo_\${idx}\`) || m.photo,
            description: fd.get(\`mem_desc_\${idx}\`) || m.description,
          }));

          const updatedPFaqs = pFaqs.map((q, idx) => ({
            question: fd.get(\`pfaq_q_\${idx}\`) || q.question,
            answer: fd.get(\`pfaq_a_\${idx}\`) || q.answer,
          }));

          const updatedSFaqs = sFaqs.map((q, idx) => ({
            question: fd.get(\`sfaq_q_\${idx}\`) || q.question,
            answer: fd.get(\`sfaq_a_\${idx}\`) || q.answer,
          }));

          const updatedTFaqs = tFaqs.map((q, idx) => ({
            question: fd.get(\`tfaq_q_\${idx}\`) || q.question,
            answer: fd.get(\`tfaq_a_\${idx}\`) || q.answer,
          }));

          const updated = {
            ...activeDraft.data,
            info: {
              ...(activeDraft.data.info || {}),
              name: fd.get('teamName'),
              course: fd.get('course'),
              classId: fd.get('classId') || 'AI2015',
              description: fd.get('teamDesc'),
            },
            members: updatedMembers,
            productFaqs: updatedPFaqs,
            supportFaqs: updatedSFaqs,
            transparencyFaqs: updatedTFaqs,
            faqs: updatedPFaqs,
            siteMeta: {
              siteTitle: fd.get('siteTitle'),
              siteDescription: fd.get('siteDescription'),
              ogImage: fd.get('ogImage'),
            }
          };

          const saveRes = await fetchApi('/api/drafts/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: updated,
              expectedHash: activeDraft.revisionHash,
              comment: 'Cập nhật thông tin nhóm, 7 thành viên và 3 nhóm FAQs'
            })
          });

          if (saveRes.ok) {
            setDirty(false);
            activeDraft = saveRes.data.draft;
            showToast('Đã lưu phân hệ Nhóm, Thành viên & FAQs thành công!', 'success');
          } else {
            showToast('Lỗi lưu: ' + (saveRes.data.error || 'Lỗi không xác định'), 'error');
          }
        });
      }

      // ==========================================
      // Tab 8: Publish Workflow & History
      // ==========================================
      async function renderPublishView() {
        const res = await fetchApi('/api/publications');
        const pubs = res.ok ? res.data.publications || [] : [];

        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">Quy trình Xuất bản & Phê duyệt Bốn Mắt (Four-Eyes Principle)</div>
            <div class="alert alert-info">
              Hệ thống tạo bản chụp bất biến (Immutable Snapshot) độc lập được làm sạch hoàn toàn. Yêu cầu xuất bản cần được phê duyệt bởi 2 tài khoản độc lập trước khi triển khai thực tế.
            </div>
            <div style="margin-bottom: 20px;">
              <button class="btn btn-primary" id="requestPublishBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Tạo yêu cầu xuất bản mới 📦</button>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Danh sách yêu cầu xuất bản (\${pubs.length})</div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Mã yêu cầu</th>
                    <th>Thời gian</th>
                    <th>Người yêu cầu</th>
                    <th>Người duyệt 1</th>
                    <th>Người duyệt 2</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${pubs.map(p => \\\`
                    <tr>
                      <td><code>\\\${p.id}</code></td>
                      <td>\\\${new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                      <td>\\\${p.requestedBy}</td>
                      <td>\\\${p.approvedBy || '<em>(Chưa duyệt)</em>'}</td>
                      <td>\\\${p.secondReviewer || '<em>(Chưa duyệt)</em>'}</td>
                      <td><span class="role-badge" style="background:#EBF8FF; color:#2B6CB0;">\\\${p.status}</span></td>
                      <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          \\\${p.status === 'pending_review' ? \\\\\`
                            <button class="btn btn-success btn-sm" onclick="reviewPub('\\\\\\\${p.id}', 'approve')" \\\${currentUserRole === 'editor' ? 'disabled' : ''}>Duyệt</button>
                            <button class="btn btn-danger btn-sm" onclick="reviewPub('\\\\\\\${p.id}', 'reject')" \\\${currentUserRole === 'editor' ? 'disabled' : ''}>Từ chối</button>
                          \\\\\` : ''}
                          <button class="btn btn-secondary btn-sm" onclick="exportPub('\\\\\\\${p.id}')" title="Trích xuất snapshot sang thư mục Astro">Xuất sang Astro 🚀</button>
                          <button class="btn btn-secondary btn-sm" onclick="gitPublish('\\\\\\\${p.id}')" title="Tạo PR GitHub hoặc mô phỏng">Tạo PR Git 🐙</button>
                        </div>
                      </td>
                    </tr>
                  \\\`).join('')}
                  \${pubs.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--color-neutral-mid);">Chưa có yêu cầu xuất bản nào.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        \`;

        const requestBtn = document.getElementById('requestPublishBtn');
        if (requestBtn) {
          requestBtn.addEventListener('click', async () => {
            const res = await fetchApi('/api/publications/request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idempotencyKey: 'pub-req-' + Date.now() })
            });
            if (res.ok) {
              showToast('Đã tạo yêu cầu xuất bản thành công!', 'success');
              renderPublishView();
            } else {
              showToast('Lỗi: ' + (res.data.error || 'Không thể tạo yêu cầu xuất bản'), 'error');
            }
          });
        }

        window.reviewPub = async function(pubId, action) {
          const res = await fetchApi('/api/publications/' + pubId + '/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
          });
          if (res.ok) {
            showToast('Thao tác duyệt thành công!', 'success');
            renderPublishView();
          } else {
            showToast('Lỗi duyệt: ' + (res.data.error || 'Vi phạm điều kiện phê duyệt'), 'error');
          }
        };

        window.exportPub = async function(pubId) {
          const res = await fetchApi('/api/publications/' + pubId + '/export', { method: 'POST' });
          if (res.ok) {
            showToast('Đã xuất bản chụp sang Astro (' + (res.data.exportResult?.filesWritten || []).join(', ') + ')!', 'success');
          } else {
            showToast('Lỗi xuất bản chụp: ' + (res.data.error || 'Lỗi không xác định'), 'error');
          }
        };

        window.gitPublish = async function(pubId) {
          const res = await fetchApi('/api/publications/' + pubId + '/publish-git', { method: 'POST' });
          if (res.ok) {
            showToast('Tích hợp Git (' + res.data.gitResult?.branchName + '): ' + (res.data.gitResult?.isSimulated ? 'Chế độ mô phỏng PR thành công' : res.data.gitResult?.prUrl), 'success');
            renderPublishView();
          } else {
            showToast('Lỗi tích hợp Git: ' + (res.data.error || 'Lỗi không xác định'), 'error');
          }
        };
      }

      // Initial tab load
      loadTab(currentTab);
    })();
  </script>
</body>
</html>`;
}
