/**
 * Trình dựng giao diện HTML tiếng Việt cho Content Studio (Task C17)
 * Áp dụng bảng màu phẳng C16, thanh điều hướng sidebar/drawer đa thiết bị (375/768/1440),
 * biểu mẫu nghiệp vụ chuyên biệt cho toàn bộ 8 phân hệ (không dùng raw JSON editor mặc định),
 * trình so sánh khác biệt (diff viewer), cảnh báo thay đổi chưa lưu, và chuyển đổi vai trò kiểm thử.
 */

import type { AuthSession, UserRole } from '../types.js';
import { escapeHtml } from '../auth/rbac.js';
import { getDefaultModuleData, type ProjectModuleData } from '../schemas/index.js';
import { APPROVED_MEDIA_REGISTRY } from '../storage/media-registry.js';

export function renderStudioHtml(session: AuthSession): string {
  const user = session.user;
  const isDev = session.isDev;
  const defaultProjectData = getDefaultModuleData('project') as ProjectModuleData;

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
      padding: 10px 14px;
      color: #CBD5E0;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.92rem;
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
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-neutral-dark);
      white-space: nowrap;
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

    /* Modal Dialogs */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal-content {
      background: #FFFFFF;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
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
      -webkit-overflow-scrolling: touch;
      border-radius: 6px;
      border: 1px solid var(--color-neutral-light);
    }
    .table-container:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    .table-scroll-hint {
      font-size: 0.75rem;
      color: var(--color-neutral-mid);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    table.data-table {
      width: 100%;
      min-width: 640px;
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
        visibility: hidden;
        transition: left 0.2s ease, visibility 0.2s ease;
      }
      .studio-sidebar.open {
        left: 0;
        visibility: visible;
      }
      .mobile-menu-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .top-left {
        gap: 10px;
        min-width: 0;
      }
      .content-area {
        padding: 16px;
      }
      .page-title {
        font-size: 1rem;
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .top-bar {
        padding: 10px 14px;
        gap: 8px;
      }
      .user-pill {
        padding: 4px 8px;
        font-size: 0.75rem;
      }
      .user-pill .user-email {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="studio-sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">Content Studio</div>
      <div class="sidebar-subtitle">Mang Theo Một Nét Vẽ</div>
    </div>
    <ul class="nav-list">
      <li class="nav-item">
        <a class="nav-link active" data-tab="dashboard" href="#dashboard" tabindex="0">
          <span>1. Tổng quan</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="project" href="#project" tabindex="0">
          <span>2. Dự án & Thông điệp</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="journal" href="#journal" tabindex="0">
          <span>3. Nhật ký hành trình</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="media" href="#media" tabindex="0">
          <span>4. Thư viện Media</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="products" href="#products" tabindex="0">
          <span>5. Sản phẩm & Mở bán</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="preorders" href="#preorders" tabindex="0">
          <span>6. Đơn đặt trước</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="finance" href="#finance" tabindex="0">
          <span>7. Tài chính & Sao kê</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="team" href="#team" tabindex="0">
          <span>8. Nhóm, FAQ & SEO</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-tab="publish" href="#publish" tabindex="0">
          <span>9. Lịch sử & Xuất bản</span>
        </a>
      </li>
    </ul>
    ${
      isDev
        ? `
    <div style="padding: 16px; border-top: 1px solid #2D3748;">
      <label for="devRoleSelect" style="display: block; font-size: 0.75rem; color: #A0AEC0; margin-bottom: 6px; text-transform: uppercase; font-weight: 700;">Chế độ Dev: Chuyển vai trò</label>
      <select id="devRoleSelect" class="form-control" aria-label="Chế độ Dev: Chuyển vai trò" style="background: #2D3748; color: #FFFFFF; border-color: #4A5568; font-size: 0.85rem;">
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
        <button class="mobile-menu-btn" id="toggleSidebarBtn" aria-label="Mở menu" aria-expanded="false">Mở menu</button>
        <h1 class="page-title" id="pageHeading">Tổng quan hệ thống</h1>
      </div>
      <div class="top-right">
        <div class="dirty-indicator" id="dirtyIndicator">
          <span>Có thay đổi chưa lưu</span>
        </div>
        <div class="user-pill">
          <span class="user-email">${escapeHtml(user.email)}</span>
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
    window.DEFAULT_PROJECT_DATA = ${JSON.stringify(defaultProjectData).replace(/</g, '\\u003c')};
    window.APPROVED_MEDIA_REGISTRY = ${JSON.stringify(APPROVED_MEDIA_REGISTRY).replace(/</g, '\\u003c')};

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
        toast.innerHTML = '<span>' + escapeHtml(message) + '</span><button style=\"background: none; border: 1px solid rgba(255,255,255,0.4); color: #fff; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; cursor: pointer;\" aria-label=\"Đóng\">Đóng</button>';
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

      function updateSidebarToggle(isOpen) {
        if (!sidebar) return;
        if (isOpen) {
          sidebar.classList.add('open');
          if (toggleSidebarBtn) {
            toggleSidebarBtn.textContent = 'Đóng menu';
            toggleSidebarBtn.setAttribute('aria-label', 'Đóng menu');
            toggleSidebarBtn.setAttribute('aria-expanded', 'true');
          }
        } else {
          sidebar.classList.remove('open');
          if (toggleSidebarBtn) {
            toggleSidebarBtn.textContent = 'Mở menu';
            toggleSidebarBtn.setAttribute('aria-label', 'Mở menu');
            toggleSidebarBtn.setAttribute('aria-expanded', 'false');
          }
        }
      }

      // Toggle Sidebar Mobile & Keyboard Escape Handler
      if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
          const isOpen = sidebar.classList.contains('open');
          updateSidebarToggle(!isOpen);
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
          updateSidebarToggle(false);
          toggleSidebarBtn?.focus();
        }
      });

      function ensureAccessibleLabels() {
        document.querySelectorAll('main input, main textarea, main select').forEach((el, index) => {
          if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && (!el.labels || !el.labels.length)) {
            const parentLabel = el.closest('label');
            if (parentLabel) {
              return;
            }
            const formGroup = el.closest('.form-group');
            const prevLabel = formGroup ? formGroup.querySelector('label') : null;
            if (prevLabel) {
              const id = el.id || ('ctrl_' + (el.name || 'input') + '_' + index);
              el.id = id;
              prevLabel.htmlFor = id;
              const text = prevLabel.textContent.trim().replace(/\\*$/, '').trim();
              el.setAttribute('aria-label', text);
            } else {
              const fallback = el.placeholder || el.name || ('Trường nhập liệu ' + index);
              el.setAttribute('aria-label', fallback);
            }
          }
        });
      }

      const contentObserver = new MutationObserver(() => {
        ensureAccessibleLabels();
      });
      if (tabContent) {
        contentObserver.observe(tabContent, { childList: true, subtree: true });
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
            updateSidebarToggle(false);
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
          case 'preorders':
            pageHeading.textContent = '6. Đơn đặt trước';
            await renderPreorders();
            break;
          case 'finance':
            pageHeading.textContent = '7. Tài chính & Sao kê';
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
        ensureAccessibleLabels();
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
              <button class="btn btn-primary" onclick="document.querySelector('[data-tab=publish]').click()">Xem quy trình duyệt xuất bản</button>
            </div>
          </div>

          <div class="card" style="border-left: 4px solid var(--color-teal);">
            <div class="card-title">
              <span>Xem trước Bản nháp Nội bộ (Private Draft Preview)</span>
              <span class="role-badge" style="background:#E6FFFA; color:#2C7A7B;">Bản xem trước bảo mật</span>
            </div>
            <p style="color: var(--color-neutral-mid); font-size: 0.9rem; margin-bottom: 12px;">
              Xem trước trực quan giao diện thực tế của toàn bộ các trang với dữ liệu bản nháp mới nhất trước khi quyết định xuất bản. Trang xem trước chỉ mở cho tài khoản nội bộ đã đăng nhập, không lưu bộ nhớ đệm công khai và ngăn công cụ tìm kiếm lập chỉ mục.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
              <a href="/preview/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Trang chủ (/)</a>
              <a href="/preview/du-an/mang-theo-mot-net-ve" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Dự án (/du-an)</a>
              <a href="/preview/dong-hanh" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Đồng hành (/dong-hanh)</a>
              <a href="/preview/minh-bach" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Minh bạch (/minh-bach)</a>
              <a href="/preview/san-pham" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Sản phẩm (/san-pham)</a>
              <a href="/preview/ve-nhom" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Về nhóm (/ve-nhom)</a>
              <a href="/preview/nhat-ky" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Nhật ký (/nhat-ky)</a>
              <a href="/preview/404" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="text-align:center;">Trang 404 (/404)</a>
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
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng nhật ký kiểm toán gần đây">
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

          <!-- Thẻ Lịch sử Phiên bản -->
          <div class="card">
            <div class="card-title">
              <span>Lịch sử Phiên bản & Khôi phục (Revisions)</span>
            </div>
            <div class="form-row" style="margin-bottom: 12px;">
              <div class="form-group" style="flex: 1;">
                <label for="historyModuleSelect">Chọn phân hệ xem lịch sử</label>
                <select id="historyModuleSelect" class="form-control" name="historyModuleSelect">
                  <option value="project">2. Dự án & Thông điệp (project)</option>
                  <option value="journal">3. Nhật ký hành trình (journal)</option>
                  <option value="products">5. Sản phẩm & Mở bán (products)</option>
                  <option value="finance">6. Tài chính & Sao kê (finance)</option>
                  <option value="team">7. Nhóm & SEO (team)</option>
                </select>
              </div>
              <div class="form-group" style="display: flex; align-items: flex-end;">
                <button type="button" class="btn btn-secondary" id="loadRevisionsBtn">Tải lịch sử</button>
              </div>
            </div>
            <div id="revisionsListArea"></div>
          </div>

          <!-- Thẻ Quản trị Người dùng -->
          <div class="card">
            <div class="card-title">
              <span>Quản trị Người dùng & Phân quyền (RBAC)</span>
              <button type="button" class="btn btn-secondary btn-sm" id="loadUsersBtn">Tải danh sách</button>
            </div>
            <div id="usersListArea">
              <p style="color: var(--color-neutral-mid); font-size: 0.9rem;">Bấm "Tải danh sách" để xem và phân quyền các tài khoản quản trị.</p>
            </div>
          </div>
        \`;

        let displayedDraftHashes = {};

        // Sự kiện tải lịch sử phiên bản
        document.getElementById('loadRevisionsBtn')?.addEventListener('click', async () => {
          const modSelect = document.getElementById('historyModuleSelect');
          const modKey = modSelect ? modSelect.value : 'project';
          const [revRes, draftRes] = await Promise.all([
            fetchApi('/api/revisions/' + modKey + '?limit=10'),
            fetchApi('/api/drafts/' + modKey)
          ]);
          const area = document.getElementById('revisionsListArea');
          if (!area) return;
          if (!revRes.ok) {
            area.innerHTML = '<div class="alert alert-danger">Không thể tải lịch sử phiên bản: ' + (revRes.data.error || '') + '</div>';
            return;
          }
          const currentDraftHash = (draftRes.ok && draftRes.data && draftRes.data.draft) ? draftRes.data.draft.revisionHash : '';
          displayedDraftHashes[modKey] = currentDraftHash;

          const revs = revRes.data.revisions || [];
          if (revs.length === 0) {
            area.innerHTML = '<p style="color: var(--color-neutral-mid);">Chưa có phiên bản lịch sử nào cho phân hệ này.</p>';
            return;
          }
          area.innerHTML = \`
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột và thao tác khôi phục</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng lịch sử phiên bản phân hệ">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Phiên bản</th>
                    <th>Thời gian</th>
                    <th>Người lưu</th>
                    <th>Ghi chú</th>
                    <th>Mã băm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${revs.map((r, rIdx) => \`
                    <tr>
                      <td><strong>v\${r.version}</strong></td>
                      <td>\${new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                      <td>\${escapeHtml(r.createdBy)}</td>
                      <td>\${escapeHtml(r.comment || '(Không có ghi chú)')}</td>
                      <td><code>\${escapeHtml(r.revisionHash ? r.revisionHash.substring(0, 10) + '...' : '')}</code></td>
                      <td>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="restoreRev('\${modKey}', '\${r.id}')" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Khôi phục</button>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          \`;
        });

        window.restoreRev = async function(modKey, revId) {
          if (!confirm('Bạn có chắc chắn muốn khôi phục phân hệ ' + modKey + ' về phiên bản này không?')) return;
          const expectedHash = displayedDraftHashes[modKey] || '';
          if (!expectedHash) {
            showToast('Không xác định được mã phiên bản hiện tại (expectedHash). Vui lòng bấm Tải lịch sử trước khi khôi phục.', 'error');
            return;
          }
          const res = await fetchApi('/api/revisions/' + modKey + '/' + revId + '/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expectedHash: expectedHash })
          });
          if (res.ok) {
            showToast('Đã khôi phục phiên bản thành công!', 'success');
            renderDashboard();
          } else if (res.status === 409) {
            if (confirm('Xung đột phiên bản (409): Phân hệ đã có chỉnh sửa mới hơn kể từ khi bạn mở danh sách. Bạn có muốn tải lại danh sách phiên bản mới nhất không?')) {
              document.getElementById('loadRevisionsBtn')?.click();
            }
          } else {
            showToast('Lỗi khôi phục: ' + (res.data.error || 'Lỗi không xác định'), 'error');
          }
        };

        // Sự kiện tải danh sách người dùng
        document.getElementById('loadUsersBtn')?.addEventListener('click', async () => {
          const uRes = await fetchApi('/api/users');
          const area = document.getElementById('usersListArea');
          if (!area) return;
          if (!uRes.ok) {
            area.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách người dùng (yêu cầu quyền admin): ' + (uRes.data.error || '') + '</div>';
            return;
          }
          const users = uRes.data.users || [];
          area.innerHTML = \`
            <div class="table-scroll-hint"><span>Cuộn ngang để xem danh sách tài khoản</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng quản trị người dùng">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Vai trò hiện tại</th>
                    <th>Ngày tạo</th>
                    <th>Thay đổi vai trò</th>
                  </tr>
                </thead>
                <tbody>
                  \${users.map((u, uIdx) => \`
                    <tr>
                      <td><strong>\${escapeHtml(u.email)}</strong></td>
                      <td><span class="role-badge" style="background:#EBF8FF; color:#2B6CB0;">\${escapeHtml(u.role)}</span></td>
                      <td>\${new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div style="display: flex; gap: 6px; align-items: center;">
                          <label for="u_role_\${uIdx}" style="display: none;">Vai trò \${escapeHtml(u.email)}</label>
                          <select id="u_role_\${uIdx}" class="form-control" aria-label="Vai trò cho \${escapeHtml(u.email)}" style="padding: 4px 8px; font-size: 0.85rem; width: auto;">
                            <option value="admin" \${u.role === 'admin' ? 'selected' : ''}>admin</option>
                            <option value="editor" \${u.role === 'editor' ? 'selected' : ''}>editor</option>
                            <option value="reviewer" \${u.role === 'reviewer' ? 'selected' : ''}>reviewer</option>
                          </select>
                          <button type="button" class="btn btn-primary btn-sm" onclick="changeUserRole('\${escapeHtml(u.email)}', 'u_role_\${uIdx}')">Lưu</button>
                        </div>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          \`;
        });

        window.changeUserRole = async function(email, selectId) {
          const selectEl = document.getElementById(selectId);
          if (!selectEl) return;
          const newRole = selectEl.value;
          const res = await fetchApi('/api/users/' + encodeURIComponent(email) + '/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
          });
          if (res.ok) {
            showToast('Đã cập nhật vai trò cho ' + email + ' thành ' + newRole, 'success');
            document.getElementById('loadUsersBtn')?.click();
          } else {
            showToast('Lỗi cập nhật vai trò: ' + (res.data.error || 'Lỗi không xác định'), 'error');
          }
        };
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
        const defaultProj = window.DEFAULT_PROJECT_DATA || {};
        const prog = p.progress || defaultProj.progress || { currentWeek: 1, totalWeeks: 5, currentStageIndex: 1, updatedAt: '2026-10-09' };
        const activities = (Array.isArray(p.activities) && p.activities.length > 0) ? p.activities : (defaultProj.activities || []);
        const stages = (Array.isArray(p.plannedStages) && p.plannedStages.length > 0) ? p.plannedStages : (defaultProj.plannedStages || []);
        const needs = (Array.isArray(p.needs) && p.needs.length > 0) ? p.needs : (defaultProj.needs || []);
        const sessions = (Array.isArray(p.plannedSessions) && p.plannedSessions.length > 0) ? p.plannedSessions : (defaultProj.plannedSessions || []);
        const contacts = p.contacts !== undefined ? p.contacts : (defaultProj.contacts !== undefined ? defaultProj.contacts : null);

        tabContent.innerHTML = \`
          <form id="projectForm" class="card">
            <div class="card-title">
              <span>Thông tin chung về Dự án & Thông điệp</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu bản nháp</button>
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
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Bốn góc Hoạt động Dự án (Project Activities)</h3>
              <div id="projectActivitiesContainer">
                \${activities.map((a, idx) => \`
                  <div class="activity-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <input type="hidden" name="act_id_\${idx}" value="\${escapeHtml(a.id || '')}">
                    <div class="form-row">
                      <div class="form-group" style="flex: 2;">
                        <label for="act_title_\${idx}">Tên hoạt động *</label>
                        <input type="text" id="act_title_\${idx}" class="form-control act-title" name="act_title_\${idx}" value="\${escapeHtml(a.title || '')}" required>
                      </div>
                      <div class="form-group" style="flex: 1;">
                        <label for="act_badge_\${idx}">Nhãn góc (Badge)</label>
                        <input type="text" id="act_badge_\${idx}" class="form-control act-badge" name="act_badge_\${idx}" value="\${escapeHtml(a.badge || '')}">
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="act_desc_\${idx}">Mô tả hoạt động</label>
                      <input type="text" id="act_desc_\${idx}" class="form-control act-desc" name="act_desc_\${idx}" value="\${escapeHtml(a.description || '')}">
                    </div>
                    <div class="form-group">
                      <label for="act_note_\${idx}">Ghi chú thêm</label>
                      <input type="text" id="act_note_\${idx}" class="form-control act-note" name="act_note_\${idx}" value="\${escapeHtml(a.note || '')}">
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Lộ trình & Các Giai đoạn Thực hiện (Progress Stages)</h3>
              <div id="projectStagesContainer">
                \${stages.map((st, idx) => \`
                  <div class="stage-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <div class="form-row">
                      <div class="form-group" style="flex: 0.5;">
                        <label for="stage_step_\${idx}">Bước (Step)</label>
                        <input type="text" id="stage_step_\${idx}" class="form-control stage-step" name="stage_step_\${idx}" value="\${escapeHtml(st.step || '')}">
                      </div>
                      <div class="form-group" style="flex: 2;">
                        <label for="stage_title_\${idx}">Tên giai đoạn *</label>
                        <input type="text" id="stage_title_\${idx}" class="form-control stage-title" name="stage_title_\${idx}" value="\${escapeHtml(st.title || '')}" required>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="stage_desc_\${idx}">Mô tả giai đoạn</label>
                      <input type="text" id="stage_desc_\${idx}" class="form-control stage-desc" name="stage_desc_\${idx}" value="\${escapeHtml(st.description || '')}">
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">Danh mục Nhu cầu Thực tế tại Mái ấm (Project Needs)</h3>
              <div id="projectNeedsContainer">
                \${needs.map((nd, idx) => \`
                  <div class="need-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <div class="form-group">
                      <label for="need_title_\${idx}">Nhu cầu / Hạng mục *</label>
                      <input type="text" id="need_title_\${idx}" class="form-control need-title" name="need_title_\${idx}" value="\${escapeHtml(nd.title || '')}" required>
                    </div>
                    <div class="form-group">
                      <label for="need_desc_\${idx}">Mô tả chi tiết</label>
                      <input type="text" id="need_desc_\${idx}" class="form-control need-desc" name="need_desc_\${idx}" value="\${escapeHtml(nd.description || '')}">
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>

            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0;">Đầu mối Liên hệ Chính thức (Official Contacts)</h3>
                <button type="button" class="btn btn-danger btn-sm" id="toggleContactBtn">
                  \${contacts !== null ? 'Ẩn thông tin liên hệ chính thức' : 'Bật hiển thị thông tin liên hệ'}
                </button>
              </div>

              <input type="hidden" id="contactActiveState" name="contact_is_active" value="\${contacts !== null ? '1' : '0'}">

              <div id="contactFieldsWrapper" style="\${contacts === null ? 'display: none;' : ''}">
                <div class="form-row">
                  <div class="form-group">
                    <label>Trưởng dự án</label>
                    <input type="text" class="form-control" name="contact_name_0" value="\${escapeHtml(contacts?.people?.[0]?.name ?? '')}">
                  </div>
                  <div class="form-group">
                    <label>Số điện thoại</label>
                    <input type="text" class="form-control" name="contact_phone_0" value="\${escapeHtml(contacts?.people?.[0]?.phone ?? '')}">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Đại diện đối ngoại</label>
                    <input type="text" class="form-control" name="contact_name_1" value="\${escapeHtml(contacts?.people?.[1]?.name ?? '')}">
                  </div>
                  <div class="form-group">
                    <label>Số điện thoại</label>
                    <input type="text" class="form-control" name="contact_phone_1" value="\${escapeHtml(contacts?.people?.[1]?.phone ?? '')}">
                  </div>
                </div>
                <div class="form-group">
                  <label>Trang Facebook / Fanpage Dự án</label>
                  <input type="url" class="form-control" name="contact_fanpage" value="\${escapeHtml(contacts?.fanpageUrl ?? '')}">
                </div>
              </div>

              <div id="contactNullNotice" style="\${contacts === null ? '' : 'display: none;'} background: #FFF5F5; border: 1px solid #FEB2B2; border-radius: 6px; padding: 12px; color: #C53030; font-size: 0.9rem;">
                <strong>Đầu mối liên hệ đang tạm ẩn:</strong> Nút kêu gọi hành động (CTA) và kênh liên hệ sẽ không hiển thị trên website công khai và bản xem trước để bảo vệ thông tin khi chưa sẵn sàng tiếp nhận.
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu toàn bộ bản nháp phân hệ Dự án</button>
            </div>
          </form>
        \`;

        const form = document.getElementById('projectForm');
        const toggleBtn = document.getElementById('toggleContactBtn');
        const contactWrapper = document.getElementById('contactFieldsWrapper');
        const contactNotice = document.getElementById('contactNullNotice');
        const contactState = document.getElementById('contactActiveState');

        if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
            const isCurrentlyActive = contactState.value === '1';
            if (isCurrentlyActive) {
              contactState.value = '0';
              contactWrapper.style.display = 'none';
              contactNotice.style.display = 'block';
              toggleBtn.textContent = 'Bật hiển thị thông tin liên hệ';
            } else {
              contactState.value = '1';
              contactWrapper.style.display = 'block';
              contactNotice.style.display = 'none';
              toggleBtn.textContent = 'Ẩn thông tin liên hệ chính thức';
            }
            setDirty(true);
          });
        }

        form.addEventListener('input', () => setDirty(true));
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const isContactActive = fd.get('contact_is_active') === '1';

          // Kiểm thực tường minh các trường bắt buộc, không âm thầm phục hồi
          const projTitle = fd.has('title') ? String(fd.get('title')).trim() : String(p.title || '').trim();
          if (!projTitle) {
            showToast('Tiêu đề dự án không được để trống.', 'error');
            return;
          }
          const projSummary = fd.has('summary') ? String(fd.get('summary')).trim() : String(p.summary || '').trim();
          if (!projSummary) {
            showToast('Tóm tắt dự án không được để trống.', 'error');
            return;
          }

          for (let idx = 0; idx < activities.length; idx++) {
            const a = activities[idx];
            const actTitle = fd.has(\`act_title_\${idx}\`) ? String(fd.get(\`act_title_\${idx}\`)).trim() : String(a.title || '').trim();
            if (!actTitle) {
              showToast(\`Tên hoạt động #\${idx + 1} không được để trống.\`, 'error');
              return;
            }
          }

          for (let idx = 0; idx < stages.length; idx++) {
            const st = stages[idx];
            const stTitle = fd.has(\`stage_title_\${idx}\`) ? String(fd.get(\`stage_title_\${idx}\`)).trim() : String(st.title || '').trim();
            if (!stTitle) {
              showToast(\`Tên giai đoạn #\${idx + 1} không được để trống.\`, 'error');
              return;
            }
          }

          for (let idx = 0; idx < needs.length; idx++) {
            const nd = needs[idx];
            const ndTitle = fd.has(\`need_title_\${idx}\`) ? String(fd.get(\`need_title_\${idx}\`)).trim() : String(nd.title || '').trim();
            if (!ndTitle) {
              showToast(\`Tiêu đề nhu cầu #\${idx + 1} không được để trống.\`, 'error');
              return;
            }
          }

          for (let idx = 0; idx < sessions.length; idx++) {
            const s = sessions[idx];
            const sessTitle = fd.has(\`sess_title_\${idx}\`) ? String(fd.get(\`sess_title_\${idx}\`)).trim() : String(s.title || '').trim();
            if (!sessTitle) {
              showToast(\`Tiêu đề buổi hoạt động #\${idx + 1} không được để trống.\`, 'error');
              return;
            }
          }

          const updated = {
            ...activeDraft.data,
            title: projTitle,
            slogan: fd.has('slogan') ? String(fd.get('slogan')).trim() : (p.slogan || ''),
            summary: projSummary,
            location: fd.has('location') ? String(fd.get('location')).trim() : (p.location || ''),
            executionStatus: fd.has('executionStatus') ? fd.get('executionStatus') : (p.executionStatus || 'in_progress'),
            statusNotice: fd.has('statusNotice') ? String(fd.get('statusNotice')).trim() : (p.statusNotice || ''),
            previewNotice: '',
            progress: {
              currentWeek: parseInt(fd.get('prog_currentWeek'), 10),
              totalWeeks: parseInt(fd.get('prog_totalWeeks'), 10),
              currentStageIndex: parseInt(fd.get('prog_currentStageIndex'), 10),
              updatedAt: fd.get('prog_updatedAt'),
            },
            plannedSessions: sessions.map((s, idx) => ({
              ...s,
              id: s.id,
              title: fd.has(\`sess_title_\${idx}\`) ? String(fd.get(\`sess_title_\${idx}\`)).trim() : s.title,
              date: fd.has(\`sess_date_\${idx}\`) ? String(fd.get(\`sess_date_\${idx}\`)).trim() : (s.date || ''),
              time: fd.has(\`sess_time_\${idx}\`) ? String(fd.get(\`sess_time_\${idx}\`)).trim() : (s.time || ''),
              weekday: fd.has(\`sess_weekday_\${idx}\`) ? String(fd.get(\`sess_weekday_\${idx}\`)).trim() : (s.weekday || ''),
              description: fd.has(\`sess_desc_\${idx}\`) ? String(fd.get(\`sess_desc_\${idx}\`)).trim() : (s.description || ''),
            })),
            activities: activities.map((a, idx) => ({
              id: fd.has(\`act_id_\${idx}\`) ? String(fd.get(\`act_id_\${idx}\`)).trim() : a.id,
              title: fd.has(\`act_title_\${idx}\`) ? String(fd.get(\`act_title_\${idx}\`)).trim() : a.title,
              badge: fd.has(\`act_badge_\${idx}\`) ? String(fd.get(\`act_badge_\${idx}\`)).trim() : (a.badge || ''),
              description: fd.has(\`act_desc_\${idx}\`) ? String(fd.get(\`act_desc_\${idx}\`)).trim() : (a.description || ''),
              note: fd.has(\`act_note_\${idx}\`) ? String(fd.get(\`act_note_\${idx}\`)).trim() : (a.note || ''),
            })),
            plannedStages: stages.map((st, idx) => ({
              step: fd.has(\`stage_step_\${idx}\`) ? String(fd.get(\`stage_step_\${idx}\`)).trim() : st.step,
              title: fd.has(\`stage_title_\${idx}\`) ? String(fd.get(\`stage_title_\${idx}\`)).trim() : st.title,
              description: fd.has(\`stage_desc_\${idx}\`) ? String(fd.get(\`stage_desc_\${idx}\`)).trim() : (st.description || ''),
            })),
            needs: needs.map((nd, idx) => ({
              title: fd.has(\`need_title_\${idx}\`) ? String(fd.get(\`need_title_\${idx}\`)).trim() : nd.title,
              description: fd.has(\`need_desc_\${idx}\`) ? String(fd.get(\`need_desc_\${idx}\`)).trim() : (nd.description || ''),
            })),
            contacts: isContactActive ? {
              status: p.contacts?.status || 'unconfirmed',
              people: [
                {
                  name: fd.has('contact_name_0') ? String(fd.get('contact_name_0')).trim() : '',
                  role: 'Trưởng dự án',
                  phone: fd.has('contact_phone_0') ? String(fd.get('contact_phone_0')).trim() : '',
                  phoneE164: '+84' + String(fd.get('contact_phone_0') || '').replace(/\\D/g, '').replace(/^0/, ''),
                },
                {
                  name: fd.has('contact_name_1') ? String(fd.get('contact_name_1')).trim() : '',
                  role: 'Đại diện đối ngoại',
                  phone: fd.has('contact_phone_1') ? String(fd.get('contact_phone_1')).trim() : '',
                  phoneE164: '+84' + String(fd.get('contact_phone_1') || '').replace(/\\D/g, '').replace(/^0/, ''),
                },
              ].filter(person => Boolean(person.name && String(person.name).trim())),
              fanpageUrl: fd.has('contact_fanpage') ? String(fd.get('contact_fanpage')).trim() : '',
              sourceRef: p.contacts?.sourceRef || 'proposal-v3',
              updatedAt: p.contacts?.updatedAt || new Date().toISOString().slice(0, 10),
            } : null,
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
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột và thao tác</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng danh sách bài viết nhật ký thực địa">
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
                        <button class="btn btn-secondary btn-sm" onclick="openArticleEditor(\${idx})" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Sửa bài viết</button>
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
              <button class="btn btn-secondary btn-sm" id="backToJournalListBtn">Quay lại danh sách</button>
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
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeArticleBlock(\${articleIdx}, \${bIdx})">Xóa khối</button>
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
                <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu bài viết vào bản nháp</button>
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
        const dbAssets = res.ok ? res.data.assets || [] : [];

        // Hợp nhất danh mục media từ D1 và các tài nguyên chiến dịch đã được phê duyệt từ APPROVED_MEDIA_REGISTRY
        const approvedRegistry = (window.APPROVED_MEDIA_REGISTRY || []).filter(function(a) { return a.status === 'approved'; });
        const allAssets = [...dbAssets];
        for (const def of approvedRegistry) {
          if (!allAssets.some(a => a.id === def.id || a.filename === def.filename || (def.publicPath && a.publicPath === def.publicPath))) {
            allAssets.push(def);
          }
        }

        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">Tải lên tệp Media an toàn (R2 Storage & Magic Bytes Guard)</div>
            <form id="mediaUploadForm" enctype="multipart/form-data">
              <div class="form-row">
                <div class="form-group">
                  <label for="media_file">Chọn tệp ảnh (JPEG, PNG - Tối đa 5MB) *</label>
                  <input type="file" id="media_file" name="file" class="form-control" aria-label="Chọn tệp ảnh" accept="image/jpeg,image/png" required>
                  <div class="hint">Hệ thống giải mã và tái mã hóa raster an toàn, tự động loại bỏ siêu dữ liệu riêng tư.</div>
                </div>
                <div class="form-group">
                  <label for="media_alt">Mô tả ảnh cho khả năng tiếp cận (Alt Text) *</label>
                  <input type="text" id="media_alt" name="alt" class="form-control" aria-label="Mô tả ảnh cho khả năng tiếp cận" placeholder="Mô tả cụ thể nội dung bức ảnh..." required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="media_caption">Chú thích (Caption)</label>
                  <input type="text" id="media_caption" name="caption" class="form-control" aria-label="Chú thích" placeholder="Chú thích hiển thị dưới ảnh...">
                </div>
                <div class="form-group">
                  <label for="media_creditName">Tác giả / Nguồn ảnh (Credit Name)</label>
                  <input type="text" id="media_creditName" name="creditName" class="form-control" aria-label="Tác giả hoặc nguồn ảnh" placeholder="Ví dụ: Nhóm Lăng Kính">
                </div>
                <div class="form-group">
                  <label for="media_creditUrl">Liên kết nguồn (Credit URL)</label>
                  <input type="url" id="media_creditUrl" name="creditUrl" class="form-control" aria-label="Liên kết nguồn" placeholder="https://...">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="media_focalX">Điểm tiêu cự X (%)</label>
                  <input type="number" id="media_focalX" name="focalX" class="form-control" aria-label="Điểm tiêu cự X" min="0" max="100" value="50">
                </div>
                <div class="form-group">
                  <label for="media_focalY">Điểm tiêu cự Y (%)</label>
                  <input type="number" id="media_focalY" name="focalY" class="form-control" aria-label="Điểm tiêu cự Y" min="0" max="100" value="50">
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 26px;">
                  <input type="checkbox" id="media_isIllustration" name="isIllustration" aria-label="Là ảnh minh họa">
                  <label for="media_isIllustration" style="margin-bottom: 0;">Là ảnh minh họa (Illustration)</label>
                </div>
              </div>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Tải lên thư viện Media</button>
            </form>
          </div>

          <div class="card">
            <div class="card-title">
              <span>Danh mục Media đã đăng ký & Bản quyền (Media Registry & Rights) (\${allAssets.length})</span>
            </div>
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột, tác quyền và thao tác</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng danh mục media đã đăng ký và bản quyền">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ảnh xem trước</th>
                    <th>Tên tệp & R2 Key</th>
                    <th>Định dạng & Dung lượng</th>
                    <th>Tác quyền (Rights / Credit)</th>
                    <th>Tiêu cự (Focal)</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${allAssets.map(a => \`
                    <tr>
                      <td style="width: 80px;">
                        <img src="\${a.r2Key ? '/' + a.r2Key : '/images/illustrations/a01.webp'}" alt="\${escapeHtml(a.alt)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-neutral-light);" onerror="this.src='/images/illustrations/a01.webp'">
                      </td>
                      <td>
                        <strong>\${escapeHtml(a.filename)}</strong>
                        <div style="font-size: 0.75rem; color: var(--color-neutral-mid); font-family: monospace;">\${escapeHtml(a.r2Key || a.id)}</div>
                        <div style="font-size: 0.75rem; color: #4A5568;">Alt: \${escapeHtml(a.alt)}</div>
                      </td>
                      <td>
                        <span class="badge" style="background:#EDF2F7; color:#4A5568;">\${escapeHtml(a.contentType)}</span>
                        <div style="font-size: 0.75rem; color: var(--color-neutral-mid); margin-top: 4px;">\${(a.sizeBytes / 1024).toFixed(1)} KB</div>
                      </td>
                      <td>
                        <div><strong>\${escapeHtml(a.creditName || 'Chưa có')}</strong></div>
                        <div style="font-size: 0.75rem; color: var(--color-neutral-mid);">\${escapeHtml(a.source || 'Nội bộ')}</div>
                      </td>
                      <td>
                        <div style="font-size: 0.85rem; font-family: monospace;">X: \${a.focalX || 50}% / Y: \${a.focalY || 50}%</div>
                      </td>
                      <td>
                        <span class="badge badge-\${a.status === 'approved' ? 'approved' : a.status === 'rejected' ? 'draft' : 'pending'}">\${escapeHtml(a.status || 'approved')}</span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          \${(currentUserRole === 'reviewer' || currentUserRole === 'admin') ?
                            ('<button type="button" class="btn btn-secondary btn-sm" onclick="reviewMedia(\\'' + escapeHtml(a.id) + '\\', \\'approve\\')">Duyệt</button>' +
                             '<button type="button" class="btn btn-secondary btn-sm" onclick="reviewMedia(\\'' + escapeHtml(a.id) + '\\', \\'reject\\')">Từ chối</button>') : ''}
                          \${(currentUserRole === 'editor' || currentUserRole === 'admin') ?
                            ('<button type="button" class="btn btn-secondary btn-sm" style="color: #E53E3E;" onclick="deleteMedia(\\'' + escapeHtml(a.id) + '\\')">Xóa</button>') : ''}
                        </div>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
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
            showToast('Tải tệp lên thành công! Tệp được chuyển vào trạng thái chờ duyệt.', 'success');
            renderMediaLibrary();
          } else {
            showToast('Lỗi tải tệp: ' + (json.error || 'Từ chối bởi hệ thống'), 'error');
          }
        });
      }

      window.reviewMedia = async function(id, action) {
        const reviewRes = await fetch('/api/media/' + id + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        const json = await reviewRes.json();
        if (reviewRes.ok) {
          showToast('Đã ' + (action === 'approve' ? 'phê duyệt' : 'từ chối') + ' tệp media!', 'success');
          renderMediaLibrary();
        } else {
          showToast('Lỗi duyệt media: ' + (json.error || 'Thất bại'), 'error');
        }
      };

      window.deleteMedia = async function(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa tệp media này?')) return;
        const delRes = await fetch('/api/media/' + id, { method: 'DELETE' });
        const json = await delRes.json();
        if (delRes.ok) {
          showToast('Đã xóa tệp media thành công.', 'success');
          renderMediaLibrary();
        } else {
          showToast('Lỗi xóa media: ' + (json.error || 'Thất bại'), 'error');
        }
      };

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

        // Nạp thư viện Media đã phê duyệt (Approved Media Registry)
        const mediaRes = await fetchApi('/api/media');
        const dbAssets = mediaRes.ok ? (mediaRes.data.assets || []) : [];
        const approvedDbAssets = dbAssets.filter(function(a) { return a.status === 'approved'; });

        const mediaOptions = [
          { path: '/images/san-pham/chuon-chuon-tre.webp', label: 'Chuồn chuồn tre kèm đế (Mẫu gốc)' }
        ];

        for (var i = 0; i < approvedDbAssets.length; i++) {
          var a = approvedDbAssets[i];
          var cleanKey = a.r2Key ? (a.r2Key.charAt(0) === '/' ? a.r2Key.substring(1) : a.r2Key) : '';
          var p = a.r2Key ? ('/' + cleanKey) : ('/media/' + a.id);
          var exists = false;
          for (var j = 0; j < mediaOptions.length; j++) {
            if (mediaOptions[j].path === p) { exists = true; break; }
          }
          if (!exists) {
            mediaOptions.push({ path: p, label: (a.alt || a.filename) + ' (Thư viện đã duyệt)' });
          }
        }

        const ccMediaVal = chuonChuon.mediaKey || '/images/san-pham/chuon-chuon-tre.webp';
        const mkMediaVal = mocKhoa.mediaKey || '';

        var ccOptionsHtml = '<option value=""' + (!ccMediaVal ? ' selected' : '') + '>-- Không sử dụng ảnh đại diện --</option>' + mediaOptions.map(function(opt) {
          return '<option value="' + escapeHtml(opt.path) + '"' + (ccMediaVal === opt.path ? ' selected' : '') + '>' + escapeHtml(opt.label) + ' (' + escapeHtml(opt.path) + ')</option>';
        }).join('');

        var mkOptionsHtml = '<option value=""' + (!mkMediaVal ? ' selected' : '') + '>-- Chưa có ảnh đại diện (Chờ ảnh thật) --</option>' + mediaOptions.map(function(opt) {
          return '<option value="' + escapeHtml(opt.path) + '"' + (mkMediaVal === opt.path ? ' selected' : '') + '>' + escapeHtml(opt.label) + ' (' + escapeHtml(opt.path) + ')</option>';
        }).join('');

        tabContent.innerHTML = \`
          <form id="productsForm" class="card">
            <div class="card-title">
              <span>Cấu hình Mở bán Sản phẩm Gây quỹ</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu cấu hình mở bán</button>
            </div>

            <div class="alert alert-info">
              Nguyên tắc thẩm định C14/C17: Sản phẩm chỉ được phép mở bán (open) khi có giá niêm yết chính thức > 0, số lượng tồn kho >= 0, chính sách đổi trả rõ ràng và được phê duyệt công khai.
            </div>

            <!-- Sản phẩm 1: Chuồn chuồn tre -->
            <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 16px; margin-bottom: 20px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">1. Chuồn chuồn tre 12 cm kèm đế (chuon-chuon-tre-kem-de)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="cc_name">Tên sản phẩm *</label>
                  <input type="text" id="cc_name" class="form-control" name="cc_name" value="\${escapeHtml(chuonChuon.name || 'Chuồn chuồn tre 12 cm kèm đế')}">
                </div>
                <div class="form-group">
                  <label for="cc_originText">Nguồn gốc / Xuất xứ</label>
                  <input type="text" id="cc_originText" class="form-control" name="cc_originText" value="\${escapeHtml(chuonChuon.originText || 'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận')}">
                </div>
              </div>
              <div class="form-group">
                <label for="cc_description">Mô tả sản phẩm</label>
                <textarea id="cc_description" class="form-control" name="cc_description" rows="2">\${escapeHtml(chuonChuon.description || 'Phôi tre mộc mạc cân bằng trên mỏ, đi kèm chân đế trưng bày trang nhã.')}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="cc_saleStatus">Trạng thái mở bán *</label>
                  <select id="cc_saleStatus" class="form-control" name="cc_saleStatus">
                    <option value="unconfirmed" \${chuonChuon.saleStatus === 'unconfirmed' ? 'selected' : ''}>Chưa xác nhận (unconfirmed)</option>
                    <option value="open" \${chuonChuon.saleStatus === 'open' ? 'selected' : ''}>Đang mở bán (open)</option>
                    <option value="closed" \${chuonChuon.saleStatus === 'closed' ? 'selected' : ''}>Đã đóng (closed)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="cc_officialPrice">Giá niêm yết chính thức (VNĐ)</label>
                  <input type="number" id="cc_officialPrice" class="form-control" name="cc_officialPrice" value="\${chuonChuon.officialPrice || ''}" placeholder="Ví dụ: 40000">
                </div>
                <div class="form-group">
                  <label for="cc_stockAvailable">Số lượng sẵn có (Tồn kho)</label>
                  <input type="number" id="cc_stockAvailable" class="form-control" name="cc_stockAvailable" value="\${chuonChuon.stockAvailable !== null ? chuonChuon.stockAvailable : ''}" placeholder="Ví dụ: 30">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="cc_salesChannel">Kênh / Địa điểm giao nhận</label>
                  <input type="text" id="cc_salesChannel" class="form-control" name="cc_salesChannel" value="\${escapeHtml(chuonChuon.salesChannel || 'FPT Hòa Lạc')}">
                </div>
                <div class="form-group">
                  <label for="cc_publicApproval">Phê duyệt công khai</label>
                  <select id="cc_publicApproval" class="form-control" name="cc_publicApproval">
                    <option value="pending" \${chuonChuon.publicApproval === 'pending' ? 'selected' : ''}>Chờ duyệt (pending)</option>
                    <option value="approved" \${chuonChuon.publicApproval === 'approved' ? 'selected' : ''}>Đã phê duyệt (approved)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="cc_returnPolicy">Chính sách đổi trả / hoàn hủy</label>
                <input type="text" id="cc_returnPolicy" class="form-control" name="cc_returnPolicy" value="\${escapeHtml(chuonChuon.returnPolicy || '')}" placeholder="Chính sách đổi trả khi mở bán...">
              </div>
              <div class="form-group">
                <label for="cc_narrative">Câu chuyện / ý nghĩa gây quỹ</label>
                <textarea id="cc_narrative" class="form-control" name="cc_narrative" rows="2" placeholder="Mô tả ý nghĩa chuồn chuồn tre mộc mạc...">\${escapeHtml(chuonChuon.narrative || '')}</textarea>
              </div>
              <div class="form-group">
                <label for="cc_mediaKey">Hình ảnh sản phẩm được duyệt (Approved Media Registry) *</label>
                <select id="cc_mediaKey" class="form-control" name="cc_mediaKey">
                  \${ccOptionsHtml}
                </select>
                <div id="cc_mediaPreview" style="margin-top: 8px; display: flex; align-items: center; gap: 12px; padding: 8px; background: #f8fafc; border-radius: 4px; border: 1px solid var(--color-neutral-light);">
                  <img id="cc_mediaThumb" src="\${escapeHtml(ccMediaVal)}" alt="Xem trước ảnh chuồn chuồn tre" style="max-height: 80px; max-width: 120px; border-radius: 4px; border: 1px solid var(--color-neutral-light); object-fit: contain; background: #ffffff; \${ccMediaVal ? '' : 'display: none;'}">
                  <span id="cc_mediaLabel" style="font-size: 0.82rem; color: var(--color-neutral-mid); font-family: monospace; \${ccMediaVal ? '' : 'font-style: italic;'}">\${escapeHtml(ccMediaVal || 'Chưa gán ảnh (Trống)')}</span>
                </div>
              </div>
            </div>

            <!-- Sản phẩm 2: Móc khóa -->
            <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-primary);">2. Móc khóa Lăng Kính (moc-khoa)</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="mk_name">Tên sản phẩm *</label>
                  <input type="text" id="mk_name" class="form-control" name="mk_name" value="\${escapeHtml(mocKhoa.name || 'Móc khóa Lăng Kính')}">
                </div>
                <div class="form-group">
                  <label for="mk_originText">Nguồn gốc / Xuất xứ</label>
                  <input type="text" id="mk_originText" class="form-control" name="mk_originText" value="\${escapeHtml(mocKhoa.originText || 'Nhóm Lăng Kính chuẩn bị và hoàn thiện mẫu')}">
                </div>
              </div>
              <div class="form-group">
                <label for="mk_description">Mô tả sản phẩm</label>
                <textarea id="mk_description" class="form-control" name="mk_description" rows="2">\${escapeHtml(mocKhoa.description || 'Móc khóa lưu niệm nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện theo kế hoạch.')}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="mk_saleStatus">Trạng thái mở bán *</label>
                  <select id="mk_saleStatus" class="form-control" name="mk_saleStatus">
                    <option value="unconfirmed" \${mocKhoa.saleStatus === 'unconfirmed' ? 'selected' : ''}>Chưa xác nhận (unconfirmed)</option>
                    <option value="open" \${mocKhoa.saleStatus === 'open' ? 'selected' : ''}>Đang mở bán (open)</option>
                    <option value="closed" \${mocKhoa.saleStatus === 'closed' ? 'selected' : ''}>Đã đóng (closed)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="mk_officialPrice">Giá niêm yết chính thức (VNĐ)</label>
                  <input type="number" id="mk_officialPrice" class="form-control" name="mk_officialPrice" value="\${mocKhoa.officialPrice || ''}" placeholder="Ví dụ: 10000">
                </div>
                <div class="form-group">
                  <label for="mk_stockAvailable">Số lượng sẵn có (Tồn kho)</label>
                  <input type="number" id="mk_stockAvailable" class="form-control" name="mk_stockAvailable" value="\${mocKhoa.stockAvailable !== null ? mocKhoa.stockAvailable : ''}" placeholder="Ví dụ: 100">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="mk_salesChannel">Kênh / Địa điểm giao nhận</label>
                  <input type="text" id="mk_salesChannel" class="form-control" name="mk_salesChannel" value="\${escapeHtml(mocKhoa.salesChannel || 'FPT Hòa Lạc')}">
                </div>
                <div class="form-group">
                  <label for="mk_publicApproval">Phê duyệt công khai</label>
                  <select id="mk_publicApproval" class="form-control" name="mk_publicApproval">
                    <option value="pending" \${mocKhoa.publicApproval === 'pending' ? 'selected' : ''}>Chờ duyệt (pending)</option>
                    <option value="approved" \${mocKhoa.publicApproval === 'approved' ? 'selected' : ''}>Đã phê duyệt (approved)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="mk_returnPolicy">Chính sách đổi trả / hoàn hủy</label>
                <input type="text" id="mk_returnPolicy" class="form-control" name="mk_returnPolicy" value="\${escapeHtml(mocKhoa.returnPolicy || '')}" placeholder="Chính sách đổi trả khi mở bán...">
              </div>
              <div class="form-group">
                <label for="mk_narrative">Câu chuyện / ý nghĩa gây quỹ</label>
                <textarea id="mk_narrative" class="form-control" name="mk_narrative" rows="2" placeholder="Mô tả ý nghĩa móc khóa Lăng Kính...">\${escapeHtml(mocKhoa.narrative || '')}</textarea>
              </div>
              <div class="form-group">
                <label for="mk_mediaKey">Hình ảnh sản phẩm được duyệt (Approved Media Registry) *</label>
                <select id="mk_mediaKey" class="form-control" name="mk_mediaKey">
                  \${mkOptionsHtml}
                </select>
                <div id="mk_mediaPreview" style="margin-top: 8px; display: flex; align-items: center; gap: 12px; padding: 8px; background: #f8fafc; border-radius: 4px; border: 1px solid var(--color-neutral-light);">
                  <img id="mk_mediaThumb" src="\${escapeHtml(mkMediaVal)}" alt="Xem trước ảnh móc khóa" style="max-height: 80px; max-width: 120px; border-radius: 4px; border: 1px solid var(--color-neutral-light); object-fit: contain; background: #ffffff; \${mkMediaVal ? '' : 'display: none;'}">
                  <span id="mk_mediaLabel" style="font-size: 0.82rem; color: var(--color-neutral-mid); font-family: monospace; \${mkMediaVal ? '' : 'font-style: italic;'}">\${escapeHtml(mkMediaVal || 'Chưa gán ảnh (Trống)')}</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu cấu hình mở bán</button>
            </div>
          </form>
        \`;

        const ccSelect = document.getElementById('cc_mediaKey');
        const ccThumb = document.getElementById('cc_mediaThumb');
        const ccLabel = document.getElementById('cc_mediaLabel');
        if (ccSelect && ccThumb && ccLabel) {
          ccSelect.addEventListener('change', function() {
            var val = ccSelect.value;
            if (val) {
              ccThumb.src = val;
              ccThumb.style.display = 'block';
              ccLabel.textContent = val;
              ccLabel.style.fontStyle = 'normal';
            } else {
              ccThumb.src = '';
              ccThumb.style.display = 'none';
              ccLabel.textContent = 'Chưa gán ảnh (Trống)';
              ccLabel.style.fontStyle = 'italic';
            }
            setDirty(true);
          });
        }

        const mkSelect = document.getElementById('mk_mediaKey');
        const mkThumb = document.getElementById('mk_mediaThumb');
        const mkLabel = document.getElementById('mk_mediaLabel');
        if (mkSelect && mkThumb && mkLabel) {
          mkSelect.addEventListener('change', function() {
            var val = mkSelect.value;
            if (val) {
              mkThumb.src = val;
              mkThumb.style.display = 'block';
              mkLabel.textContent = val;
              mkLabel.style.fontStyle = 'normal';
            } else {
              mkThumb.src = '';
              mkThumb.style.display = 'none';
              mkLabel.textContent = 'Chưa gán ảnh (Trống)';
              mkLabel.style.fontStyle = 'italic';
            }
            setDirty(true);
          });
        }

        const form = document.getElementById('productsForm');
        form.addEventListener('input', () => setDirty(true));
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const updated = {
            'chuon-chuon-tre-kem-de': {
              name: fd.get('cc_name') ? String(fd.get('cc_name')).trim() : null,
              description: fd.get('cc_description') ? String(fd.get('cc_description')).trim() : null,
              originText: fd.get('cc_originText') ? String(fd.get('cc_originText')).trim() : null,
              saleStatus: fd.get('cc_saleStatus'),
              officialPrice: fd.get('cc_officialPrice') ? parseInt(fd.get('cc_officialPrice'), 10) : null,
              stockAvailable: fd.get('cc_stockAvailable') ? parseInt(fd.get('cc_stockAvailable'), 10) : null,
              salesChannel: fd.get('cc_salesChannel'),
              returnPolicy: fd.get('cc_returnPolicy') || null,
              publicApproval: fd.get('cc_publicApproval'),
              narrative: fd.get('cc_narrative') || null,
              mediaKey: fd.get('cc_mediaKey') || null,
            },
            'moc-khoa': {
              name: fd.get('mk_name') ? String(fd.get('mk_name')).trim() : null,
              description: fd.get('mk_description') ? String(fd.get('mk_description')).trim() : null,
              originText: fd.get('mk_originText') ? String(fd.get('mk_originText')).trim() : null,
              saleStatus: fd.get('mk_saleStatus'),
              officialPrice: fd.get('mk_officialPrice') ? parseInt(fd.get('mk_officialPrice'), 10) : null,
              stockAvailable: fd.get('mk_stockAvailable') ? parseInt(fd.get('mk_stockAvailable'), 10) : null,
              salesChannel: fd.get('mk_salesChannel'),
              returnPolicy: fd.get('mk_returnPolicy') || null,
              publicApproval: fd.get('mk_publicApproval'),
              narrative: fd.get('mk_narrative') || null,
              mediaKey: fd.get('mk_mediaKey') || null,
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

      // Tab 6: Preorders (restricted to Admin and Reviewer by the API).
      async function renderPreorders() {
        if (currentUserRole === 'editor') {
          tabContent.innerHTML = '<div class="alert alert-danger">Mục này chỉ dành cho Admin và Reviewer.</div>';
          return;
        }
        const productsRes = await fetchApi('/api/preorder-products');
        const configs = productsRes.ok ? productsRes.data.products || [] : [];
        const mayConfigure = currentUserRole === 'admin';
        tabContent.innerHTML = \`
          <section class="card">
            <h2 style="margin-top:0">Cấu hình đặt trước</h2>
            <p>Giá chốt để trống nghĩa là giá tham khảo; đơn lưu đơn giá null và nhóm xác nhận khi liên hệ. Đơn đặt trước chưa thanh toán.</p>
            <div id="preorderConfigList" style="display:grid;gap:16px"></div>
          </section>
          <section class="card">
            <h2 style="margin-top:0">Danh sách đơn</h2>
            <form id="preorderFilterForm" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end">
              <div class="form-group"><label for="preorderQ">Tìm kiếm</label><input id="preorderQ" name="q" class="form-control" placeholder="Mã đơn, tên hoặc liên hệ"></div>
              <div class="form-group"><label for="preorderStatus">Trạng thái</label><select id="preorderStatus" name="status" class="form-control"><option value="">Tất cả</option><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="confirmed">Đã xác nhận</option><option value="delivered">Đã giao</option><option value="cancelled">Đã hủy</option></select></div>
              <div class="form-group"><label for="preorderProduct">Sản phẩm</label><select id="preorderProduct" name="product" class="form-control"><option value="">Tất cả</option><option value="chuon-chuon-tre-kem-de">Chuồn chuồn tre</option><option value="moc-khoa">Móc khóa</option></select></div>
              <div class="form-group"><label for="preorderTest">Loại đơn</label><select id="preorderTest" name="test" class="form-control"><option value="">Tất cả</option><option value="false">Đơn thật</option><option value="true">Đơn test</option></select></div>
              <div class="form-group"><label for="preorderFrom">Từ ngày</label><input id="preorderFrom" name="from" type="date" class="form-control"></div>
              <div class="form-group"><label for="preorderTo">Đến ngày</label><input id="preorderTo" name="to" type="date" class="form-control"></div>
              <button type="submit" class="btn btn-primary">Lọc đơn</button>
              <a id="preorderCsvLink" class="btn btn-secondary" href="/api/preorders/export.csv">Tải CSV</a>
            </form>
            <div id="preorderList" role="status" aria-live="polite" style="overflow-x:auto;margin-top:16px"></div>
            <div id="preorderDetail" style="margin-top:20px"></div>
          </section>\`;

        const configContainer = document.getElementById('preorderConfigList');
        if (!productsRes.ok) {
          configContainer.innerHTML = '<p role="status">Không thể tải cấu hình đặt trước.</p>';
        } else {
          const productNames = { 'chuon-chuon-tre-kem-de': 'Chuồn chuồn tre 12 cm kèm đế', 'moc-khoa': 'Móc khóa Lăng Kính' };
          configContainer.innerHTML = configs.map((item) => \`
            <form class="preorder-product-config" data-product="\${escapeHtml(item.productId)}" style="border:1px solid var(--color-neutral-light);border-radius:8px;padding:14px;display:grid;gap:10px">
              <h3 style="margin:0">\${escapeHtml(productNames[item.productId] || item.productId)}</h3>
              <label><input name="isOpen" type="checkbox" \${item.isOpen ? 'checked' : ''} \${mayConfigure ? '' : 'disabled'}> Mở nhận đặt trước</label>
              <div class="form-group"><label>Giá chốt (để trống nếu chưa xác nhận)</label><input name="officialPrice" class="form-control" inputmode="numeric" type="number" min="1" step="1" value="\${item.officialPrice ?? ''}" \${mayConfigure ? '' : 'disabled'}></div>
              <div class="form-group"><label>Cách nhận hàng</label><input name="pickup" class="form-control" maxlength="120" value="\${escapeHtml(item.pickup || '')}" placeholder="Để trống đến khi nhóm xác nhận" \${mayConfigure ? '' : 'disabled'}></div>
              \${mayConfigure ? '<button class="btn btn-primary" type="submit">Lưu cấu hình</button>' : ''}
            </form>\`).join('');
          configContainer.querySelectorAll('.preorder-product-config').forEach((form) => form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const fd = new FormData(form);
            const priceText = String(fd.get('officialPrice') || '').trim();
            const response = await fetchApi('/api/preorder-products/' + encodeURIComponent(form.dataset.product), {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isOpen: fd.get('isOpen') === 'on', officialPrice: priceText ? Number(priceText) : null, pickup: String(fd.get('pickup') || '').trim() || null })
            });
            showToast(response.ok ? 'Đã lưu cấu hình đặt trước.' : (response.data.error || 'Không thể lưu cấu hình.'), response.ok ? 'success' : 'error');
          }));
        }

        const list = document.getElementById('preorderList');
        const detail = document.getElementById('preorderDetail');
        const filterForm = document.getElementById('preorderFilterForm');
        async function loadOrders() {
          const fd = new FormData(filterForm);
          const params = new URLSearchParams();
          for (const [key, value] of fd.entries()) if (String(value).trim()) params.set(key, String(value).trim());
          const suffix = params.toString();
          const result = await fetchApi('/api/preorders' + (suffix ? '?' + suffix : ''));
          document.getElementById('preorderCsvLink').href = '/api/preorders/export.csv' + (suffix ? '?' + suffix : '');
          if (!result.ok) { list.innerHTML = '<p role="alert">' + escapeHtml(result.data.error || 'Không thể tải danh sách.') + '</p>'; return; }
          const rows = result.data.preorders || [];
          if (!rows.length) { list.innerHTML = '<p>Chưa có đơn phù hợp với bộ lọc.</p>'; return; }
          list.innerHTML = \`<table style="width:100%;border-collapse:collapse"><thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Số lượng</th><th>Trạng thái email</th><th>Trạng thái đơn</th><th>Ngày</th><th>Loại</th></tr></thead><tbody>\${rows.map((order) => \`<tr><td><button type="button" class="btn btn-secondary btn-sm preorder-open-detail" data-id="\${escapeHtml(order.id)}">\${escapeHtml(order.order_code)}</button></td><td>\${escapeHtml(order.product_name)}</td><td>\${escapeHtml(order.quantity)}</td><td>\${escapeHtml(order.email_status || 'skipped')} · \${escapeHtml(order.email_attempts || 0)} lần</td><td>\${escapeHtml(order.status)}</td><td>\${escapeHtml(new Date(order.created_at).toLocaleString('vi-VN'))}</td><td>\${order.is_test ? 'Test' : 'Thật'}</td></tr>\`).join('')}</tbody></table>\`;
          list.querySelectorAll('.preorder-open-detail').forEach((button) => button.addEventListener('click', () => loadDetail(button.dataset.id)));
        }
        async function loadDetail(id) {
          const result = await fetchApi('/api/preorders/' + encodeURIComponent(id));
          if (!result.ok) { detail.innerHTML = '<p role="alert">' + escapeHtml(result.data.error || 'Không thể tải chi tiết.') + '</p>'; return; }
          const order = result.data.preorder;
          const events = result.data.events || [];
          detail.innerHTML = \`<article class="card"><h3>Đơn \${escapeHtml(order.order_code)} \${order.is_test ? '(đơn test)' : ''}</h3>
            <dl><dt>Sản phẩm</dt><dd>\${escapeHtml(order.product_name)} × \${escapeHtml(order.quantity)}</dd><dt>Người đặt</dt><dd>\${escapeHtml(order.customer_name)}</dd><dt>Email</dt><dd>\${escapeHtml(order.customer_email || 'Không có')}</dd><dt>Điện thoại</dt><dd>\${escapeHtml(order.customer_phone || 'Không cung cấp')}</dd><dt>Email xác nhận</dt><dd>\${escapeHtml(order.email_status || 'skipped')} · \${escapeHtml(order.email_attempts || 0)} lần\${order.email_last_error ? ' · ' + escapeHtml(order.email_last_error) : ''}</dd><dt>Nhận hàng</dt><dd>\${escapeHtml(order.pickup)}</dd><dt>Đơn giá chốt</dt><dd>\${order.unit_price === null ? 'Giá tham khảo; nhóm xác nhận khi liên hệ' : escapeHtml(order.unit_price.toLocaleString('vi-VN') + 'đ')}</dd><dt>Ghi chú của khách</dt><dd>\${escapeHtml(order.customer_note || 'Không có')}</dd></dl>
            <button id="retryPreorderEmail" class="btn btn-secondary" type="button" style="margin-top:8px">Gửi lại email xác nhận</button>
            <form id="preorderStatusForm" style="display:flex;gap:8px;flex-wrap:wrap"><label for="preorderStatusUpdate">Trạng thái</label><select id="preorderStatusUpdate" class="form-control" name="status"><option value="new" \${order.status === 'new' ? 'selected' : ''}>Mới</option><option value="contacted" \${order.status === 'contacted' ? 'selected' : ''}>Đã liên hệ</option><option value="confirmed" \${order.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option><option value="delivered" \${order.status === 'delivered' ? 'selected' : ''}>Đã giao</option><option value="cancelled" \${order.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option></select><button class="btn btn-primary">Cập nhật trạng thái</button></form>
            <form id="preorderNoteForm" style="display:grid;gap:8px;margin-top:12px"><label for="preorderInternalNote">Ghi chú nội bộ</label><textarea id="preorderInternalNote" class="form-control" name="note" maxlength="500" required></textarea><button class="btn btn-secondary">Lưu ghi chú</button></form>
            \${order.is_test && currentUserRole === 'admin' ? '<button id="archivePreorderTest" class="btn btn-secondary" type="button" style="margin-top:12px">Ẩn đơn test</button>' : ''}
            <h4>Lịch sử xử lý</h4><ol>\${events.map((event) => \`<li>\${escapeHtml(event.created_at)} · \${escapeHtml(event.action)} · \${escapeHtml(event.actor)}\${event.note ? ': ' + escapeHtml(event.note) : ''}</li>\`).join('')}</ol></article>\`;
          document.getElementById('preorderStatusForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const status = new FormData(event.currentTarget).get('status');
            const changed = await fetchApi('/api/preorders/' + encodeURIComponent(id) + '/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            showToast(changed.ok ? 'Đã cập nhật trạng thái.' : (changed.data.error || 'Không thể cập nhật.'), changed.ok ? 'success' : 'error');
            if (changed.ok) { await loadOrders(); await loadDetail(id); }
          });
          document.getElementById('retryPreorderEmail')?.addEventListener('click', async () => {
            if (!confirm('Gửi lại email cho khách và thông báo nhóm?')) return;
            const resent = await fetchApi('/api/preorders/' + encodeURIComponent(id) + '/email/retry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            showToast(resent.ok && resent.data.success ? 'Đã gửi lại email.' : (resent.data.error || 'Không thể gửi lại email.'), resent.ok && resent.data.success ? 'success' : 'error');
            await loadOrders(); await loadDetail(id);
          });
          document.getElementById('preorderNoteForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const note = new FormData(event.currentTarget).get('note');
            const saved = await fetchApi('/api/preorders/' + encodeURIComponent(id) + '/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
            showToast(saved.ok ? 'Đã lưu ghi chú nội bộ.' : (saved.data.error || 'Không thể lưu ghi chú.'), saved.ok ? 'success' : 'error');
            if (saved.ok) await loadDetail(id);
          });
          document.getElementById('archivePreorderTest')?.addEventListener('click', async () => {
            if (!confirm('Ẩn đơn test này khỏi danh sách? Đơn thật không bị ảnh hưởng.')) return;
            const archived = await fetchApi('/api/preorders/' + encodeURIComponent(id) + '/archive-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            showToast(archived.ok ? 'Đã ẩn đơn test.' : (archived.data.error || 'Không thể ẩn đơn.'), archived.ok ? 'success' : 'error');
            if (archived.ok) { detail.innerHTML = ''; await loadOrders(); }
          });
        }
        filterForm.addEventListener('submit', async (event) => { event.preventDefault(); detail.innerHTML = ''; await loadOrders(); });
        await loadOrders();
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
          accountNumber: '19077352683012',
          accountHolder: 'NGUYEN CHI TRUNG',
          qrImage: '/images/ung-ho/qr-ung-ho-techcombank-nguyen-chi-trung.png',
          transferPrefix: 'MTMNV',
          goalAmount: 7000000,
        };
        const steps = f.ledgerProcess || [
          { title: 'Một tài khoản riêng cho dự án', description: 'Mọi khoản ủng hộ chuyển vào tài khoản Techcombank đã công bố, nội dung bắt đầu bằng MTMNV để dễ nhận diện.' },
          { title: 'Hai người đối chiếu', description: 'Thành viên tài chính và một thành viên khác cùng đối chiếu từng khoản với sao kê ngân hàng trước khi ghi sổ.' },
          { title: 'Ghi sổ tối thiểu', description: 'Bản công khai gồm ngày, số tiền và tên người ủng hộ đồng ý hiển thị; không ghi tên thì để Ẩn danh. Mã tham chiếu chỉ lưu nội bộ trong Studio.' },
          { title: 'Chỉ công bố sau đối soát', description: 'Sổ được cập nhật lên website định kỳ sau mỗi lần đối soát, kèm ngày đối soát thật. Website không kết nối tự động với ngân hàng.' },
          { title: 'Xử lý nhầm, trùng, hoàn tiền', description: 'Mã giao dịch chỉ dùng nội bộ để đối soát và chống trùng. Khoản chuyển nhầm được hoàn lại theo yêu cầu và không tính vào tổng; chỉnh sửa được ghi chú ở lần cập nhật sau.' },
          { title: 'Tôn trọng riêng tư', description: 'Không công khai số tài khoản, ngân hàng hay thông tin cá nhân của người gửi; chứng từ chỉ công bố bản đã che thông tin.' },
        ];

        const ov = f.overview || {};

        tabContent.innerHTML = \`
          <!-- Thẻ 1: Cấu hình Tài khoản Tiếp nhận & Mục tiêu Gây quỹ -->
          <form id="donationAccountForm" class="card">
            <div class="card-title">
              <span>Cấu hình Tài khoản Tiếp nhận & Mục tiêu Gây quỹ</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu tài khoản & mục tiêu</button>
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
                <input type="number" class="form-control" name="acc_goalAmount" value="\${acc.goalAmount || 7000000}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Ngân hàng tiếp nhận *</label>
                <input type="text" class="form-control" name="acc_bankName" value="\${escapeHtml(acc.bankName || 'Techcombank')}" required>
              </div>
              <div class="form-group">
                <label>Số tài khoản *</label>
                <input type="text" class="form-control" name="acc_accountNumber" value="\${escapeHtml(acc.accountNumber || '19077352683012')}" required>
              </div>
              <div class="form-group">
                <label>Tên chủ tài khoản *</label>
                <input type="text" class="form-control" name="acc_accountHolder" value="\${escapeHtml(acc.accountHolder || 'NGUYEN CHI TRUNG')}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tiền tố chuyển khoản (Transfer Prefix) *</label>
                <input type="text" class="form-control" name="acc_transferPrefix" value="\${escapeHtml(acc.transferPrefix || 'MTMNV')}" required>
              </div>
              <div class="form-group">
                <label>Đường dẫn mã QR (qrImage)</label>
                <input type="text" class="form-control" name="acc_qrImage" value="\${escapeHtml(acc.qrImage || '/images/ung-ho/qr-ung-ho-techcombank-nguyen-chi-trung.png')}">
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
                <label for="csvFileInput">Tải lên tệp CSV sao kê ngân hàng đối soát (RFC 4180) *</label>
                <input type="file" id="csvFileInput" name="file" class="form-control" accept=".csv" required>
              </div>
              <div class="form-group">
                <label for="csvReconciledAt">Mốc ngày chốt đối soát (YYYY-MM-DD)</label>
                <input type="date" id="csvReconciledAt" name="reconciledAt" class="form-control" value="\${escapeHtml(f.reconciledAt || '2026-10-31')}">
              </div>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Thẩm định tệp CSV</button>
            </form>
            <div id="csvPreviewArea" style="display: none; margin-top: 12px;"></div>
          </div>

          <!-- Thẻ 2b: Xác nhận Quy tắc 2 Người (Two-Person Policy) -->
          <div class="card">
            <div class="card-title">Xác nhận Quy tắc 2 Người (Two-Person Policy)</div>
            <div class="alert alert-info">
              Quy tắc 2 người: Bắt buộc tối thiểu 2 danh tính độc lập khác nhau: 1 Người lập (Preparer) và 1 Người kiểm tra độc lập (Independent Reviewer). Nghiêm cấm tự phê duyệt (Người lập !== Người duyệt).
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 12px;">
              <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 14px; background: var(--color-bg-app);">
                <h4 style="font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">1. Người lập số liệu (Preparer / Author)</h4>
                \${f.firstSigner ? \`
                  <p><strong>Người ký:</strong> \${escapeHtml(f.firstSigner.name)}</p>
                  <p><strong>Vai trò:</strong> \${escapeHtml(f.firstSigner.role)}</p>
                  <p><strong>Thời điểm:</strong> \${new Date(f.firstSigner.signedAt).toLocaleString('vi-VN')}</p>
                \` : \`
                  <p style="color: var(--color-neutral-mid); margin-bottom: 8px;">Chưa ký xác nhận nguồn.</p>
                  <button type="button" class="btn btn-secondary btn-sm" id="signFirstBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Ký xác nhận Người lập</button>
                \`}
              </div>
              <div style="border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 14px; background: var(--color-bg-app);">
                <h4 style="font-weight: 700; color: var(--color-teal); margin-bottom: 8px;">2. Người kiểm tra độc lập (Independent Reviewer)</h4>
                \${f.secondSigner ? \`
                  <p><strong>Người ký:</strong> \${escapeHtml(f.secondSigner.name)}</p>
                  <p><strong>Vai trò:</strong> \${escapeHtml(f.secondSigner.role)}</p>
                  <p><strong>Thời điểm:</strong> \${new Date(f.secondSigner.signedAt).toLocaleString('vi-VN')}</p>
                \` : \`
                  <p style="color: var(--color-neutral-mid); margin-bottom: 8px;">Chưa ký kiểm tra độc lập.</p>
                  <button type="button" class="btn btn-secondary btn-sm" id="signSecondBtn" \${currentUserRole === 'editor' ? 'disabled' : ''}>Ký kiểm tra độc lập</button>
                \`}
              </div>
            </div>
          </div>

          <!-- Thẻ 2c: Tổng quan Kế hoạch Tài chính & Dự toán (Finance Overview) -->
          <form id="financeOverviewForm" class="card">
            <div class="card-title">
              <span>Tổng quan Kế hoạch Tài chính & Dự toán (Finance Overview)</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu tổng quan dự toán</button>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Tổng chi phí dự toán (plannedExpenseTotal)</label>
                <input type="number" class="form-control" name="ov_plannedExpenseTotal" value="\${ov.plannedExpenseTotal !== null && ov.plannedExpenseTotal !== undefined ? ov.plannedExpenseTotal : ''}" placeholder="Dự toán (VNĐ)">
              </div>
              <div class="form-group">
                <label>Doanh thu thủ công dự kiến (craftPlannedRevenue)</label>
                <input type="number" class="form-control" name="ov_craftPlannedRevenue" value="\${ov.craftPlannedRevenue !== null && ov.craftPlannedRevenue !== undefined ? ov.craftPlannedRevenue : ''}" placeholder="Doanh thu thủ công (VNĐ)">
              </div>
              <div class="form-group">
                <label>Doanh thu đồ ăn dự kiến (foodPlannedRevenue)</label>
                <input type="number" class="form-control" name="ov_foodPlannedRevenue" value="\${ov.foodPlannedRevenue !== null && ov.foodPlannedRevenue !== undefined ? ov.foodPlannedRevenue : ''}" placeholder="Doanh thu đồ ăn (VNĐ)">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Doanh thu kịch bản cơ sở (plannedRevenueScenario)</label>
                <input type="number" class="form-control" name="ov_plannedRevenueScenario" value="\${ov.plannedRevenueScenario !== null && ov.plannedRevenueScenario !== undefined ? ov.plannedRevenueScenario : ''}" placeholder="Kịch bản cơ sở (VNĐ)">
              </div>
              <div class="form-group">
                <label>Số dư dự kiến chưa tài trợ (unfundedProjectedBalance)</label>
                <input type="number" class="form-control" name="ov_unfundedProjectedBalance" value="\${ov.unfundedProjectedBalance !== null && ov.unfundedProjectedBalance !== undefined ? ov.unfundedProjectedBalance : ''}" placeholder="Số dư dự kiến (VNĐ)">
              </div>
            </div>
            <div class="form-group">
              <label>Thông báo trạng thái thực tế (actualStatusNotice)</label>
              <input type="text" class="form-control" name="ov_actualStatusNotice" value="\${escapeHtml(ov.actualStatusNotice ?? '')}" placeholder="Thông báo trạng thái thực tế">
            </div>
            <div class="form-group">
              <label>Tuyên bố miễn trừ & giải trình (disclaimer)</label>
              <textarea class="form-control" name="ov_disclaimer" placeholder="Tuyên bố giải trình">\${escapeHtml(ov.disclaimer ?? '')}</textarea>
            </div>
          </form>

          <!-- Thẻ 3: Bản chiếu giao dịch sao kê -->
          <div class="card">
            <div class="card-title">
              <span>Bản chiếu giao dịch sao kê đã xử lý (\${(f.entries || []).length} khoản)</span>
            </div>
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột giao dịch</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng bản chiếu giao dịch sao kê đã xử lý">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Số tiền (VNĐ)</th>
                    <th>Người ủng hộ</th>
                    <th>Mã tham chiếu nội bộ</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${(f.entries || []).map((e, eIdx) => \`
                    <tr>
                      <td>\${escapeHtml(e.date)}</td>
                      <td><strong>\${Number(e.amount).toLocaleString('vi-VN')} đ</strong></td>
                      <td>\${escapeHtml(e.donor)}</td>
                      <td><code>\${escapeHtml(e.reference || '(Trống)')}</code></td>
                      <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteFinanceEntry(\${eIdx})" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa</button>
                      </td>
                    </tr>
                  \`).join('')}
                  \${(f.entries || []).length === 0 ? '<tr><td colspan="5" style="text-align: center; color: var(--color-neutral-mid);">Chưa có khoản ủng hộ nào được phê duyệt công khai.</td></tr>' : ''}
                </tbody>
              </table>
            </div>

            <!-- Thêm khoản ủng hộ thủ công -->
            <form id="addEntryForm" style="margin-top: 16px; padding: 12px; background: var(--color-bg-app); border-radius: 6px; border: 1px solid var(--color-neutral-light);">
              <strong style="display: block; margin-bottom: 8px; color: var(--color-primary);">Thêm dòng ủng hộ thủ công</strong>
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Ngày (YYYY-MM-DD) *</label>
                  <input type="date" class="form-control" name="entry_date" required value="\${new Date().toISOString().slice(0, 10)}">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Số tiền (VNĐ) *</label>
                  <input type="number" class="form-control" name="entry_amount" required min="1000" step="1000" placeholder="50000">
                </div>
                <div class="form-group" style="flex: 1.5;">
                  <label>Người ủng hộ *</label>
                  <input type="text" class="form-control" name="entry_donor" required placeholder="Nguyễn Văn A / Ẩn danh">
                </div>
                <div class="form-group" style="flex: 1.5;">
                  <label>Mã tham chiếu nội bộ (không xuất bản)</label>
                  <input type="text" class="form-control" name="entry_reference" placeholder="Nội bộ Studio">
                </div>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm khoản ủng hộ</button>
            </form>
          </div>

          <!-- Thẻ 4: Doanh thu bán hàng gây quỹ -->
          <div class="card">
            <div class="card-title">
              <span>Doanh thu bán hàng gây quỹ (\${(f.sales || []).length} mục)</span>
            </div>
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột doanh thu</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng doanh thu bán hàng gây quỹ">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm / Mặt hàng</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                    <th>Kênh bán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${(f.sales || []).map((s, sIdx) => \`
                    <tr>
                      <td>\${escapeHtml(s.item)}</td>
                      <td>\${s.quantity}</td>
                      <td>\${Number(s.unitPrice).toLocaleString('vi-VN')} đ</td>
                      <td><strong>\${Number(s.totalAmount).toLocaleString('vi-VN')} đ</strong></td>
                      <td>\${escapeHtml(s.channel)}</td>
                      <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteFinanceSale(\${sIdx})" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa</button>
                      </td>
                    </tr>
                  \`).join('')}
                  \${(f.sales || []).length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--color-neutral-mid);">Chưa có dữ liệu bán hàng gây quỹ được ghi nhận.</td></tr>' : ''}
                </tbody>
              </table>
            </div>

            <form id="addSaleForm" style="margin-top: 16px; padding: 12px; background: var(--color-bg-app); border-radius: 6px; border: 1px solid var(--color-neutral-light);">
              <strong style="display: block; margin-bottom: 8px; color: var(--color-primary);">Thêm mặt hàng bán gây quỹ</strong>
              <div class="form-row">
                <div class="form-group" style="flex: 2;">
                  <label>Mặt hàng *</label>
                  <input type="text" class="form-control" name="sale_item" required placeholder="Móc khóa len / Bánh su kem">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Số lượng *</label>
                  <input type="number" class="form-control" name="sale_quantity" required min="1" value="1">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Đơn giá (VNĐ) *</label>
                  <input type="number" class="form-control" name="sale_unitPrice" required min="1000" step="1000" placeholder="20000">
                </div>
                <div class="form-group" style="flex: 1.5;">
                  <label>Kênh bán</label>
                  <input type="text" class="form-control" name="sale_channel" placeholder="Quầy trực tiếp / Đặt trước">
                </div>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm mặt hàng bán</button>
            </form>
          </div>

          <!-- Thẻ 5: Khoản chi dự án -->
          <div class="card">
            <div class="card-title">
              <span>Khoản chi dự án (\${(f.expenses || []).length} khoản)</span>
            </div>
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột chi phí</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng chi phí dự án">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th>Nội dung chi</th>
                    <th>Số tiền</th>
                    <th>Hình thức</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${(f.expenses || []).map((ex, exIdx) => \`
                    <tr>
                      <td>\${escapeHtml(ex.category)}</td>
                      <td>\${escapeHtml(ex.item)}</td>
                      <td><strong>\${Number(ex.amount).toLocaleString('vi-VN')} đ</strong></td>
                      <td>\${ex.isCash ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                      <td>\${escapeHtml(ex.notes || '')}</td>
                      <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteFinanceExpense(\${exIdx})" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa</button>
                      </td>
                    </tr>
                  \`).join('')}
                  \${(f.expenses || []).length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--color-neutral-mid);">Chưa có khoản chi nào được ghi nhận.</td></tr>' : ''}
                </tbody>
              </table>
            </div>

            <form id="addExpenseForm" style="margin-top: 16px; padding: 12px; background: var(--color-bg-app); border-radius: 6px; border: 1px solid var(--color-neutral-light);">
              <strong style="display: block; margin-bottom: 8px; color: var(--color-primary);">Thêm khoản chi dự án</strong>
              <div class="form-row">
                <div class="form-group" style="flex: 1.5;">
                  <label>Danh mục *</label>
                  <input type="text" class="form-control" name="exp_category" required placeholder="Vật tư / Quà tặng / Di chuyển">
                </div>
                <div class="form-group" style="flex: 2;">
                  <label>Nội dung chi *</label>
                  <input type="text" class="form-control" name="exp_item" required placeholder="Mua bút màu / Thuê xe">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Số tiền (VNĐ) *</label>
                  <input type="number" class="form-control" name="exp_amount" required min="1000" step="1000" placeholder="150000">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Hình thức</label>
                  <select class="form-control" name="exp_isCash">
                    <option value="true">Tiền mặt</option>
                    <option value="false">Chuyển khoản</option>
                  </select>
                </div>
                <div class="form-group" style="flex: 2;">
                  <label>Ghi chú</label>
                  <input type="text" class="form-control" name="exp_notes" placeholder="Hóa đơn VAT số...">
                </div>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm khoản chi</button>
            </form>
          </div>

          <!-- Thẻ 6: Tiếp nhận ủng hộ hiện vật -->
          <div class="card">
            <div class="card-title">
              <span>Tiếp nhận ủng hộ hiện vật (\${(f.inKindDonations || []).length} hiện vật)</span>
            </div>
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột hiện vật</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng tiếp nhận ủng hộ hiện vật">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Hiện vật / Trang thiết bị</th>
                    <th>Số lượng</th>
                    <th>Ước tính giá trị</th>
                    <th>Đơn vị / Cá nhân ủng hộ</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${(f.inKindDonations || []).map((k, kIdx) => \`
                    <tr>
                      <td>\${escapeHtml(k.item)}</td>
                      <td>\${k.quantity}</td>
                      <td>\${Number(k.estimatedValue).toLocaleString('vi-VN')} đ</td>
                      <td>\${escapeHtml(k.donorName)}</td>
                      <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteFinanceInKind(\${kIdx})" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa</button>
                      </td>
                    </tr>
                  \`).join('')}
                  \${(f.inKindDonations || []).length === 0 ? '<tr><td colspan="5" style="text-align: center; color: var(--color-neutral-mid);">Chưa có hiện vật nào được tiếp nhận.</td></tr>' : ''}
                </tbody>
              </table>
            </div>

            <form id="addInKindForm" style="margin-top: 16px; padding: 12px; background: var(--color-bg-app); border-radius: 6px; border: 1px solid var(--color-neutral-light);">
              <strong style="display: block; margin-bottom: 8px; color: var(--color-primary);">Thêm hiện vật tiếp nhận</strong>
              <div class="form-row">
                <div class="form-group" style="flex: 2;">
                  <label>Hiện vật / Vật tư *</label>
                  <input type="text" class="form-control" name="ink_item" required placeholder="Bút màu / Giấy vẽ / Bánh kẹo">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Số lượng *</label>
                  <input type="number" class="form-control" name="ink_quantity" required min="1" value="1">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Giá trị ước tính (VNĐ)</label>
                  <input type="number" class="form-control" name="ink_estimatedValue" min="0" step="1000" placeholder="200000">
                </div>
                <div class="form-group" style="flex: 1.5;">
                  <label>Người / Tổ chức tặng *</label>
                  <input type="text" class="form-control" name="ink_donorName" required placeholder="Nhà hảo tâm X">
                </div>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm hiện vật</button>
            </form>
          </div>
        \`;

        async function saveFinanceDraft(newData, comment) {
          const saveRes = await fetchApi('/api/drafts/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: newData,
              expectedHash: activeDraft.revisionHash,
              comment: comment
            })
          });
          if (saveRes.ok) {
            setDirty(false);
            activeDraft = saveRes.data.draft;
            showToast('Đã lưu thành công: ' + comment, 'success');
            renderFinanceEditor();
          } else {
            showToast('Lỗi lưu: ' + (saveRes.data.error || 'Lỗi không xác định'), 'error');
          }
        }

        window.deleteFinanceEntry = async function(idx) {
          if (!confirm('Bạn có chắc chắn muốn xóa dòng sao kê này không?')) return;
          const list = [...(f.entries || [])];
          list.splice(idx, 1);
          await saveFinanceDraft({ ...activeDraft.data, entries: list }, 'Xóa dòng sao kê');
        };

        window.deleteFinanceSale = async function(idx) {
          if (!confirm('Bạn có chắc chắn muốn xóa mặt hàng này không?')) return;
          const list = [...(f.sales || [])];
          list.splice(idx, 1);
          await saveFinanceDraft({ ...activeDraft.data, sales: list }, 'Xóa mặt hàng bán gây quỹ');
        };

        window.deleteFinanceExpense = async function(idx) {
          if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này không?')) return;
          const list = [...(f.expenses || [])];
          list.splice(idx, 1);
          await saveFinanceDraft({ ...activeDraft.data, expenses: list }, 'Xóa khoản chi dự án');
        };

        window.deleteFinanceInKind = async function(idx) {
          if (!confirm('Bạn có chắc chắn muốn xóa hiện vật này không?')) return;
          const list = [...(f.inKindDonations || [])];
          list.splice(idx, 1);
          await saveFinanceDraft({ ...activeDraft.data, inKindDonations: list }, 'Xóa hiện vật tiếp nhận');
        };

        const ovForm = document.getElementById('financeOverviewForm');
        ovForm?.addEventListener('input', () => setDirty(true));
        ovForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(ovForm);
          const parseNumOrNull = (val) => {
            if (val === null || val === undefined) return null;
            const str = String(val).trim();
            if (str === '') return null;
            const num = parseInt(str, 10);
            return isNaN(num) ? null : num;
          };
          const updatedOverview = {
            ...(f.overview || {}),
            plannedExpenseTotal: parseNumOrNull(fd.get('ov_plannedExpenseTotal')),
            craftPlannedRevenue: parseNumOrNull(fd.get('ov_craftPlannedRevenue')),
            foodPlannedRevenue: parseNumOrNull(fd.get('ov_foodPlannedRevenue')),
            plannedRevenueScenario: parseNumOrNull(fd.get('ov_plannedRevenueScenario')),
            unfundedProjectedBalance: parseNumOrNull(fd.get('ov_unfundedProjectedBalance')),
            actualStatusNotice: String(fd.get('ov_actualStatusNotice') || '').trim(),
            disclaimer: String(fd.get('ov_disclaimer') || '').trim(),
          };
          await saveFinanceDraft({ ...activeDraft.data, overview: updatedOverview }, 'Cập nhật tổng quan dự toán tài chính');
        });

        const addEntryForm = document.getElementById('addEntryForm');
        addEntryForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(addEntryForm);
          const newEntry = {
            date: fd.get('entry_date'),
            amount: parseInt(fd.get('entry_amount'), 10),
            donor: fd.get('entry_donor'),
            reference: fd.get('entry_reference') || undefined,
          };
          const list = [...(f.entries || []), newEntry];
          await saveFinanceDraft({ ...activeDraft.data, entries: list }, 'Thêm dòng sao kê thủ công');
        });

        const addSaleForm = document.getElementById('addSaleForm');
        addSaleForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(addSaleForm);
          const qty = parseInt(fd.get('sale_quantity'), 10) || 1;
          const uPrice = parseInt(fd.get('sale_unitPrice'), 10) || 0;
          const newSale = {
            item: fd.get('sale_item'),
            quantity: qty,
            unitPrice: uPrice,
            totalAmount: qty * uPrice,
            channel: fd.get('sale_channel') || 'Quầy trực tiếp',
          };
          const list = [...(f.sales || []), newSale];
          await saveFinanceDraft({ ...activeDraft.data, sales: list }, 'Thêm mặt hàng bán gây quỹ');
        });

        const addExpForm = document.getElementById('addExpenseForm');
        addExpForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(addExpForm);
          const newExp = {
            category: fd.get('exp_category'),
            item: fd.get('exp_item'),
            amount: parseInt(fd.get('exp_amount'), 10) || 0,
            isCash: fd.get('exp_isCash') === 'true',
            notes: fd.get('exp_notes') || undefined,
          };
          const list = [...(f.expenses || []), newExp];
          await saveFinanceDraft({ ...activeDraft.data, expenses: list }, 'Thêm khoản chi dự án');
        });

        const addInkForm = document.getElementById('addInKindForm');
        addInkForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(addInkForm);
          const newInk = {
            item: fd.get('ink_item'),
            quantity: parseInt(fd.get('ink_quantity'), 10) || 1,
            estimatedValue: parseInt(fd.get('ink_estimatedValue'), 10) || 0,
            donorName: fd.get('ink_donorName'),
          };
          const list = [...(f.inKindDonations || []), newInk];
          await saveFinanceDraft({ ...activeDraft.data, inKindDonations: list }, 'Thêm hiện vật tiếp nhận');
        });

        const accForm = document.getElementById('donationAccountForm');
        accForm?.addEventListener('input', () => setDirty(true));
        accForm?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(accForm);

          for (let idx = 0; idx < steps.length; idx++) {
            const st = steps[idx];
            const stepTitle = fd.has(\`step_title_\${idx}\`) ? String(fd.get(\`step_title_\${idx}\`)).trim() : String(st.title || '').trim();
            if (!stepTitle) {
              showToast(\`Tiêu đề bước #\${idx + 1} không được để trống.\`, 'error');
              return;
            }
          }

          const updatedSteps = steps.map((st, idx) => ({
            title: fd.has(\`step_title_\${idx}\`) ? String(fd.get(\`step_title_\${idx}\`)).trim() : st.title,
            description: fd.has(\`step_desc_\${idx}\`) ? String(fd.get(\`step_desc_\${idx}\`)).trim() : (st.description || ''),
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

          await saveFinanceDraft(updated, 'Cập nhật tài khoản ủng hộ và quy trình đối soát');
        });

        // Xử lý ký xác nhận Quy tắc 2 người (Two-Person Policy)
        document.getElementById('signFirstBtn')?.addEventListener('click', async () => {
          const attestRes = await fetchApi('/api/finance/attest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expectedHash: activeDraft.revisionHash,
            })
          });
          if (attestRes.ok) {
            showToast('Đã ký xác nhận Người lập thành công! ' + (attestRes.data.message || ''), 'success');
            renderFinanceEditor();
          } else {
            showToast('Lỗi ký: ' + (attestRes.data.error || 'Không thể ký'), 'error');
          }
        });

        document.getElementById('signSecondBtn')?.addEventListener('click', async () => {
          if (f.firstSigner && f.firstSigner.name === currentUserEmail) {
            showToast('Quy tắc 2 người: Người kiểm tra độc lập không được trùng với Người lập!', 'error');
            return;
          }
          const attestRes = await fetchApi('/api/finance/attest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expectedHash: activeDraft.revisionHash,
            })
          });
          if (attestRes.ok) {
            showToast('Đã ký xác nhận Người kiểm tra độc lập thành công! ' + (attestRes.data.message || ''), 'success');
            renderFinanceEditor();
          } else {
            showToast('Lỗi ký: ' + (attestRes.data.error || 'Không thể ký'), 'error');
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
            window.pendingCsvRows = json.rows;
            window.pendingReconciledAt = fd.get('reconciledAt');
            const previewEl = document.getElementById('csvPreviewArea');
            if (previewEl) {
              previewEl.style.display = 'block';
              previewEl.innerHTML = \`
                <div class="alert alert-success" style="margin-top: 12px;">
                  Đã thẩm định CSV thành công! Tìm thấy <strong>\${json.rows.length}</strong> dòng hợp lệ, tổng tiền: <strong>\${Number(json.stats.totalAmount).toLocaleString('vi-VN')} đ</strong>.
                  <div style="margin-top: 8px;">
                    <button type="button" class="btn btn-success btn-sm" id="applyCsvBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Áp dụng vào sổ sao kê & Lưu nháp</button>
                  </div>
                </div>
              \`;
              document.getElementById('applyCsvBtn')?.addEventListener('click', async () => {
                const applyRes = await fetchApi('/api/finance/apply-csv', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    rows: window.pendingCsvRows,
                    reconciledAt: window.pendingReconciledAt || '2026-10-31',
                    expectedHash: activeDraft.revisionHash,
                  })
                });
                if (applyRes.ok) {
                  setDirty(false);
                  showToast(applyRes.data.message || 'Đã áp dụng và lưu sổ sao kê thành công!', 'success');
                  renderFinanceEditor();
                } else {
                  showToast('Lỗi lưu sổ sao kê: ' + (applyRes.data.error || 'Lỗi không xác định'), 'error');
                }
              });
            }
            showToast('Thẩm định CSV thành công! Tìm thấy ' + json.rows.length + ' dòng hợp lệ.', 'success');
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
          { question: 'Giá trên trang có phải giá bán chính thức?', answer: 'Đã có giá chốt: 40.000đ/bộ chuồn chuồn tre kèm đế và 10.000đ/chiếc móc khóa cho đặt trước. Đặt trước chưa phải thanh toán online. Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước; hiện chưa cam kết ngày giao.' },
          { question: 'Ai làm các sản phẩm này?', answer: 'Toàn bộ sản phẩm gây quỹ do nhóm Lăng Kính chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo, không gắn với sản xuất hàng bán; các em giữ lại sản phẩm do mình làm ra. Tranh của các em chỉ được in lên móc khóa khi có sự đồng ý phù hợp.' },
          { question: 'Khi nào có thể đặt mua?', answer: 'Đang nhận đặt trước hai sản phẩm thủ công. Đặt trước chưa phải thanh toán; nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước. Chưa cam kết ngày giao.' },
          { question: 'Tiền bán hàng được dùng thế nào?', answer: 'Trước hết bù chi phí nguyên liệu và tổ chức. Phần còn lại dùng mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.' },
        ];
        const sFaqs = t.supportFaqs || [
          { question: 'Làm sao để tên tôi xuất hiện trong sao kê?', answer: 'Ghi nội dung chuyển khoản theo mẫu MTMNV và tên bạn muốn hiển thị. Nếu không ghi tên hoặc ghi “An danh”, khoản ủng hộ hiển thị là Ẩn danh. Website không hiển thị số tài khoản hay thông tin ngân hàng của người gửi.' },
          { question: 'Khi nào khoản ủng hộ của tôi được cập nhật?', answer: 'Sau mỗi lần thành viên tài chính cùng một thành viên khác đối chiếu với sao kê ngân hàng. Website không kết nối tự động với ngân hàng; khi sổ được công bố, ngày đối soát gần nhất sẽ hiển thị ở đầu bảng. Khoản ủng hộ được cập nhật định kỳ sau khi đối soát xong. Bạn có thể đối chiếu theo ngày chuyển, số tiền và nội dung bắt đầu bằng MTMNV; nếu cần, hãy liên hệ nhóm.' },
          { question: 'Làm sao nhận ra khoản ủng hộ của tôi trong sao kê?', answer: 'Bạn có thể đối chiếu theo ngày chuyển và số tiền; nội dung chuyển khoản bắt đầu bằng MTMNV. Nếu cần trợ giúp, hãy liên hệ nhóm và cung cấp các thông tin này.' },
          { question: 'Tôi chuyển nhầm số tiền hoặc chuyển trùng thì sao?', answer: 'Hãy liên hệ nhóm kèm ngày chuyển, số tiền và nội dung chuyển khoản bắt đầu bằng MTMNV. Nhóm đối chiếu với sao kê và hoàn lại nếu bạn yêu cầu; khoản đã hoàn không được tính vào tổng ủng hộ.' },
          { question: 'Tiền ủng hộ được dùng vào việc gì?', answer: 'Cho vật tư buổi chơi, quà cho các em và di chuyển; phần còn lại mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.' },
          { question: 'Tôi có thể cùng đến Mái ấm không?', answer: 'Chỉ khi Mái ấm đồng ý trước. Nhóm không tuyển người tự do đến Mái ấm, để bảo đảm an toàn và riêng tư cho các em.' },
        ];
        const tFaqs = t.transparencyFaqs || [
          { question: 'Vì sao tổng ủng hộ đang ghi “Chưa cập nhật”?', answer: 'Tổng chỉ được tính từ sổ đã đối chiếu với sao kê ngân hàng. Khi nhóm chưa công bố sổ đã đối soát chính thức, website không hiển thị con số (kể cả 0đ) để tránh hiểu lầm là chưa nhận được khoản ủng hộ nào.' },
          { question: 'Tiền bán quà lưu niệm có cộng vào tổng ủng hộ không?', answer: 'Không. Thanh tiến độ chỉ tính các khoản ủng hộ qua tài khoản dự án đã đối soát. Tiền bán quà được ghi riêng.' },
          { question: 'Trường hợp số tiền ủng hộ vượt mục tiêu 7.000.000đ thì xử lý thế nào?', answer: 'Website vẫn ghi đúng tổng thực tế đã đối soát. Phần vượt mục tiêu sẽ được dùng mua thêm vật phẩm theo danh mục Mái ấm xác nhận và ghi rõ trong báo cáo tổng kết.' },
          { question: 'Khi nào nhóm công bố báo cáo tổng kết dự án?', answer: 'Sau buổi trao quà và khi thành viên tài chính cùng một thành viên khác hoàn tất đối soát. Chứng từ chỉ công bố bản đã che thông tin riêng tư.' },
        ];

        tabContent.innerHTML = \`
          <form id="teamForm" class="card">
            <div class="card-title">
              <span>Thông tin Nhóm, Thành viên, FAQs & SEO</span>
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu phân hệ Nhóm</button>
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
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0;">Hồ sơ Thành viên Nhóm (Team Members)</h3>
                <button type="button" class="btn btn-secondary btn-sm" id="addMemberBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm thành viên</button>
              </div>
              <div id="teamMembersContainer">
                \${members.map((m, mIdx) => \`
                  <div class="member-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <strong>Thành viên: \${escapeHtml(m.name)} (\${escapeHtml(m.role)})</strong>
                      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.member-card').remove(); setDirty(true);" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa thành viên</button>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Họ và tên</label>
                        <input type="text" class="form-control mem-name" value="\${escapeHtml(m.name)}">
                      </div>
                      <div class="form-group">
                        <label>Vai trò phụ trách</label>
                        <input type="text" class="form-control mem-role" value="\${escapeHtml(m.role)}">
                      </div>
                      <div class="form-group">
                        <label>Đường dẫn ảnh đại diện</label>
                        <input type="text" class="form-control mem-photo" value="\${escapeHtml(m.photo)}">
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Mô tả nhiệm vụ & đóng góp</label>
                      <input type="text" class="form-control mem-desc" value="\${escapeHtml(m.description)}">
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>

            <!-- 3 Nhóm FAQs -->
            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0;">1. FAQ Sản phẩm (Product FAQs)</h3>
                <button type="button" class="btn btn-secondary btn-sm" id="addPFaqBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm FAQ Sản phẩm</button>
              </div>
              <div id="pfaqContainer">
                \${pFaqs.map((q, qIdx) => \`
                  <div class="faq-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <strong>Câu hỏi \${qIdx + 1}</strong>
                      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.faq-card').remove(); setDirty(true);" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa câu hỏi</button>
                    </div>
                    <div class="form-group">
                      <label>Câu hỏi</label>
                      <input type="text" class="form-control pfaq-q" value="\${escapeHtml(q.question)}">
                    </div>
                    <div class="form-group">
                      <label>Câu trả lời</label>
                      <textarea class="form-control pfaq-a">\${escapeHtml(q.answer)}</textarea>
                    </div>
                  </div>
                \`).join('')}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0 12px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0;">2. FAQ Đồng hành & Tiếp nhận Ủng hộ (Support FAQs)</h3>
                <button type="button" class="btn btn-secondary btn-sm" id="addSFaqBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm FAQ Đồng hành</button>
              </div>
              <div id="sfaqContainer">
                \${sFaqs.map((q, qIdx) => \`
                  <div class="faq-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <strong>Câu hỏi \${qIdx + 1}</strong>
                      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.faq-card').remove(); setDirty(true);" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa câu hỏi</button>
                    </div>
                    <div class="form-group">
                      <label>Câu hỏi</label>
                      <input type="text" class="form-control sfaq-q" value="\${escapeHtml(q.question)}">
                    </div>
                    <div class="form-group">
                      <label>Câu trả lời</label>
                      <textarea class="form-control sfaq-a">\${escapeHtml(q.answer)}</textarea>
                    </div>
                  </div>
                \`).join('')}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0 12px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0;">3. FAQ Minh bạch & Sao kê (Transparency FAQs)</h3>
                <button type="button" class="btn btn-secondary btn-sm" id="addTFaqBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>+ Thêm FAQ Minh bạch</button>
              </div>
              <div id="tfaqContainer">
                \${tFaqs.map((q, qIdx) => \`
                  <div class="faq-card" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <strong>Câu hỏi \${qIdx + 1}</strong>
                      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.faq-card').remove(); setDirty(true);" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Xóa câu hỏi</button>
                    </div>
                    <div class="form-group">
                      <label>Câu hỏi</label>
                      <input type="text" class="form-control tfaq-q" value="\${escapeHtml(q.question)}">
                    </div>
                    <div class="form-group">
                      <label>Câu trả lời</label>
                      <textarea class="form-control tfaq-a">\${escapeHtml(q.answer)}</textarea>
                    </div>
                  </div>
                \`).join('')}
              </div>
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

            <!-- Cấu hình Per-Route SEO -->
            <div style="border-top: 1px solid var(--color-neutral-light); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 6px; color: var(--color-primary);">Cấu hình SEO theo từng tuyến đường (Per-Route SEO)</h3>
              <p style="font-size: 0.85rem; color: var(--color-neutral-mid); margin-bottom: 12px;">
                Tùy chỉnh tiêu đề trang (&lt;title&gt;) và mô tả tìm kiếm (&lt;meta name="description"&gt;) riêng cho từng trang. Nếu để trống, hệ thống sẽ sử dụng tiêu đề và mô tả mặc định của trang.
              </p>
              <div id="routeSeoContainer">
                \${[
                  { path: '/', label: 'Trang chủ (/)' },
                  { path: '/du-an/mang-theo-mot-net-ve', label: 'Giới thiệu dự án (/du-an/mang-theo-mot-net-ve)' },
                  { path: '/dong-hanh', label: 'Đồng hành & Quyên góp (/dong-hanh)' },
                  { path: '/san-pham', label: 'Sản phẩm gây quỹ (/san-pham)' },
                  { path: '/minh-bach', label: 'Sao kê & Minh bạch (/minh-bach)' },
                  { path: '/ve-nhom', label: 'Về nhóm Lăng Kính (/ve-nhom)' },
                  { path: '/nhat-ky', label: 'Nhật ký hành trình (/nhat-ky)' },
                ].map((r) => {
                  const rData = (t.siteMeta?.routeSeo && t.siteMeta.routeSeo[r.path]) || {};
                  const safeKey = r.path === '/' ? 'root' : r.path.replace(/[^a-zA-Z0-9]/g, '_');
                  return \`
                    <div class="route-seo-card" data-route="\${escapeHtml(r.path)}" style="background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                        <strong style="color: var(--color-neutral-dark); font-size: 0.95rem; word-break: break-word;">\${escapeHtml(r.label)}</strong>
                        <code style="font-size: 0.8rem; background: var(--color-neutral-light); padding: 2px 6px; border-radius: 4px; word-break: break-all;">\${escapeHtml(r.path)}</code>
                      </div>
                      <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                          <label for="route_seo_title_\${safeKey}">Tiêu đề trang (Route SEO Title)</label>
                          <input type="text" class="form-control route-seo-title" id="route_seo_title_\${safeKey}" name="route_seo_title_\${safeKey}" data-route="\${escapeHtml(r.path)}" value="\${escapeHtml(rData.title || '')}" placeholder="Tiêu đề trang \${escapeHtml(r.path)}">
                        </div>
                        <div class="form-group" style="flex: 1.5;">
                          <label for="route_seo_desc_\${safeKey}">Mô tả tìm kiếm (Route SEO Description)</label>
                          <input type="text" class="form-control route-seo-desc" id="route_seo_desc_\${safeKey}" name="route_seo_desc_\${safeKey}" data-route="\${escapeHtml(r.path)}" value="\${escapeHtml(rData.description || '')}" placeholder="Mô tả meta description cho \${escapeHtml(r.path)}">
                        </div>
                      </div>
                    </div>
                  \`;
                }).join('')}
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Lưu toàn bộ phân hệ Nhóm, Thành viên & FAQs</button>
            </div>
          </form>
        \`;

        // Sự kiện thêm thành viên
        document.getElementById('addMemberBtn')?.addEventListener('click', () => {
          const container = document.getElementById('teamMembersContainer');
          if (!container) return;
          const newCard = document.createElement('div');
          newCard.className = 'member-card';
          newCard.style.cssText = 'background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;';
          newCard.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong>Thành viên mới</strong>
              <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.member-card').remove(); setDirty(true);">Xóa thành viên</button>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Họ và tên</label>
                <input type="text" class="form-control mem-name" placeholder="Nguyễn Văn A">
              </div>
              <div class="form-group">
                <label>Vai trò phụ trách</label>
                <input type="text" class="form-control mem-role" placeholder="Tình nguyện viên">
              </div>
              <div class="form-group">
                <label>Đường dẫn ảnh đại diện</label>
                <input type="text" class="form-control mem-photo" placeholder="/images/thanh-vien/avatar.webp">
              </div>
            </div>
            <div class="form-group">
              <label>Mô tả nhiệm vụ & đóng góp</label>
              <input type="text" class="form-control mem-desc" placeholder="Đóng góp cho dự án...">
            </div>
          \`;
          container.appendChild(newCard);
          setDirty(true);
        });

        // Sự kiện thêm FAQ Sản phẩm
        document.getElementById('addPFaqBtn')?.addEventListener('click', () => {
          const container = document.getElementById('pfaqContainer');
          if (!container) return;
          const newCard = document.createElement('div');
          newCard.className = 'faq-card';
          newCard.style.cssText = 'background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;';
          newCard.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong>Câu hỏi mới</strong>
              <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.faq-card').remove(); setDirty(true);">Xóa câu hỏi</button>
            </div>
            <div class="form-group">
              <label>Câu hỏi</label>
              <input type="text" class="form-control pfaq-q" placeholder="Câu hỏi về sản phẩm...">
            </div>
            <div class="form-group">
              <label>Câu trả lời</label>
              <textarea class="form-control pfaq-a" placeholder="Câu trả lời..."></textarea>
            </div>
          \`;
          container.appendChild(newCard);
          setDirty(true);
        });

        // Sự kiện thêm FAQ Đồng hành
        document.getElementById('addSFaqBtn')?.addEventListener('click', () => {
          const container = document.getElementById('sfaqContainer');
          if (!container) return;
          const newCard = document.createElement('div');
          newCard.className = 'faq-card';
          newCard.style.cssText = 'background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;';
          newCard.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong>Câu hỏi mới</strong>
              <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.faq-card').remove(); setDirty(true);">Xóa câu hỏi</button>
            </div>
            <div class="form-group">
              <label>Câu hỏi</label>
              <input type="text" class="form-control sfaq-q" placeholder="Câu hỏi về đồng hành...">
            </div>
            <div class="form-group">
              <label>Câu trả lời</label>
              <textarea class="form-control sfaq-a" placeholder="Câu trả lời..."></textarea>
            </div>
          \`;
          container.appendChild(newCard);
          setDirty(true);
        });

        // Sự kiện thêm FAQ Minh bạch
        document.getElementById('addTFaqBtn')?.addEventListener('click', () => {
          const container = document.getElementById('tfaqContainer');
          if (!container) return;
          const newCard = document.createElement('div');
          newCard.className = 'faq-card';
          newCard.style.cssText = 'background: var(--color-bg-app); border: 1px solid var(--color-neutral-light); border-radius: 6px; padding: 10px; margin-bottom: 10px;';
          newCard.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong>Câu hỏi mới</strong>
              <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.faq-card').remove(); setDirty(true);">Xóa câu hỏi</button>
            </div>
            <div class="form-group">
              <label>Câu hỏi</label>
              <input type="text" class="form-control tfaq-q" placeholder="Câu hỏi về sao kê minh bạch...">
            </div>
            <div class="form-group">
              <label>Câu trả lời</label>
              <textarea class="form-control tfaq-a" placeholder="Câu trả lời..."></textarea>
            </div>
          \`;
          container.appendChild(newCard);
          setDirty(true);
        });

        const form = document.getElementById('teamForm');
        form?.addEventListener('input', () => setDirty(true));
        form?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);

          const memCards = document.querySelectorAll('#teamMembersContainer .member-card');
          const updatedMembers = Array.from(memCards).map(card => ({
            name: card.querySelector('.mem-name')?.value || '',
            role: card.querySelector('.mem-role')?.value || '',
            photo: card.querySelector('.mem-photo')?.value || '',
            description: card.querySelector('.mem-desc')?.value || '',
          })).filter(m => m.name.trim().length > 0);

          const pFaqCards = document.querySelectorAll('#pfaqContainer .faq-card');
          const updatedPFaqs = Array.from(pFaqCards).map(card => ({
            question: card.querySelector('.pfaq-q')?.value || '',
            answer: card.querySelector('.pfaq-a')?.value || '',
          })).filter(q => q.question.trim().length > 0);

          const sFaqCards = document.querySelectorAll('#sfaqContainer .faq-card');
          const updatedSFaqs = Array.from(sFaqCards).map(card => ({
            question: card.querySelector('.sfaq-q')?.value || '',
            answer: card.querySelector('.sfaq-a')?.value || '',
          })).filter(q => q.question.trim().length > 0);

          const tFaqCards = document.querySelectorAll('#tfaqContainer .faq-card');
          const updatedTFaqs = Array.from(tFaqCards).map(card => ({
            question: card.querySelector('.tfaq-q')?.value || '',
            answer: card.querySelector('.tfaq-a')?.value || '',
          })).filter(q => q.question.trim().length > 0);

          const routeSeoCards = document.querySelectorAll('#routeSeoContainer .route-seo-card');
          const existingRouteSeo = (activeDraft.data && activeDraft.data.siteMeta && typeof activeDraft.data.siteMeta.routeSeo === 'object' && !Array.isArray(activeDraft.data.siteMeta.routeSeo))
            ? { ...activeDraft.data.siteMeta.routeSeo }
            : {};
          const updatedRouteSeo = { ...existingRouteSeo };
          routeSeoCards.forEach(card => {
            const route = card.getAttribute('data-route');
            if (!route) return;
            const titleInput = card.querySelector('.route-seo-title');
            const descInput = card.querySelector('.route-seo-desc');
            const title = (titleInput?.value || '').trim();
            const description = (descInput?.value || '').trim();
            if (title || description) {
              updatedRouteSeo[route] = {
                ...(title ? { title } : {}),
                ...(description ? { description } : {})
              };
            } else {
              delete updatedRouteSeo[route];
            }
          });

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
              routeSeo: updatedRouteSeo,
            }
          };

          const saveRes = await fetchApi('/api/drafts/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: updated,
              expectedHash: activeDraft.revisionHash,
              comment: 'Cập nhật thông tin nhóm, danh sách thành viên và các nhóm FAQs'
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
        const [pubsRes, usersRes] = await Promise.all([
          fetchApi('/api/publications'),
          currentUserRole === 'admin' ? fetchApi('/api/users') : Promise.resolve({ ok: false, data: { users: [] } })
        ]);
        const pubs = pubsRes.ok ? pubsRes.data.publications || [] : [];
        const users = usersRes.ok ? usersRes.data.users || [] : [];

        tabContent.innerHTML = \`
          <div class="card">
            <div class="card-title">Quy trình Xuất bản & Phê duyệt Bốn Mắt (Four-Eyes Principle)</div>
            <div class="alert alert-info">
              Hệ thống tạo bản chụp bất biến (Immutable Snapshot) độc lập được làm sạch hoàn toàn. Yêu cầu xuất bản cần được phê duyệt bởi 2 tài khoản độc lập trước khi triển khai thực tế.
            </div>
            <div style="margin-bottom: 20px;">
              <button class="btn btn-primary" id="requestPublishBtn" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Tạo yêu cầu xuất bản mới</button>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Danh sách yêu cầu xuất bản (\${pubs.length})</div>
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột, người duyệt và thao tác</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng danh sách yêu cầu xuất bản">
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
                  \${pubs.map(p => \`
                    <tr>
                      <td><code>\${p.id}</code></td>
                      <td>\${new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                      <td>\${p.requestedBy}</td>
                      <td>\${p.approvedBy || '<em>(Chưa duyệt)</em>'}</td>
                      <td>\${p.secondReviewer || '<em>(Chưa duyệt)</em>'}</td>
                      <td><span class="role-badge" style="background:#EBF8FF; color:#2B6CB0;">\${p.status}</span></td>
                      <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          \${p.status === 'pending_review' ? (
                            '<button class="btn btn-success btn-sm" onclick="reviewPub(\\'' + p.id + '\\', \\'approve\\')" ' + (currentUserRole === 'editor' ? 'disabled' : '') + '>Duyệt</button>' +
                            '<button class="btn btn-danger btn-sm" onclick="reviewPub(\\'' + p.id + '\\', \\'reject\\')" ' + (currentUserRole === 'editor' ? 'disabled' : '') + '>Từ chối</button>'
                          ) : ''}
                          <button class="btn btn-secondary btn-sm" onclick="exportPub('\${p.id}')" title="Trích xuất snapshot sang thư mục Astro">Xuất sang Astro</button>
                          <button class="btn btn-secondary btn-sm" onclick="gitPublish('\${p.id}')" title="Tạo PR GitHub hoặc mô phỏng">Tạo PR Git</button>
                        </div>
                      </td>
                    </tr>
                  \`).join('')}
                  \${pubs.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--color-neutral-mid);">Chưa có yêu cầu xuất bản nào.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Thẻ 3: Lịch sử Phiên bản & So sánh Thay đổi (Revisions & Diff Viewer) -->
          <div class="card">
            <div class="card-title">
              <span>Lịch sử Phiên bản & So sánh Thay đổi (Revisions & Diff Viewer)</span>
            </div>
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
              <label style="font-weight: 600;">Chọn phân hệ:</label>
              <select id="pubModuleSelect" class="form-control" style="max-width: 200px;">
                <option value="project">Dự án (project)</option>
                <option value="finance">Tài chính (finance)</option>
                <option value="products">Sản phẩm (products)</option>
                <option value="journal">Nhật ký (journal)</option>
                <option value="team">Nhóm & SEO (team)</option>
              </select>
              <button type="button" class="btn btn-secondary btn-sm" id="loadPubRevisionsBtn">Tải lịch sử phiên bản</button>
            </div>
            <div id="pubRevisionsArea">
              <p style="color: var(--color-neutral-mid);">Nhấn "Tải lịch sử phiên bản" để xem các phiên bản đã lưu.</p>
            </div>
          </div>

          <!-- Thẻ 4: Quản trị Người dùng & Phân quyền (/api/users) -->
          <div class="card">
            <div class="card-title">
              <span>Quản trị Người dùng & Phân quyền (Role Administration - /api/users)</span>
            </div>
            \${currentUserRole === 'admin' ? \`
              <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột người dùng</span></div>
              <div class="table-container" tabindex="0" role="region" aria-label="Bảng quản trị người dùng">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Email Người dùng</th>
                      <th>Vai trò hiện tại</th>
                      <th>Cập nhật vai trò mới</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${users.map((u, uIdx) => \`
                      <tr>
                        <td><strong>\${escapeHtml(u.email)}</strong></td>
                        <td><span class="role-badge" style="background:#E2E8F0; color:#2D3748;">\${u.role}</span></td>
                        <td>
                          <select id="userRoleSelect_\${uIdx}" class="form-control" style="max-width: 160px; display: inline-block;">
                            <option value="admin" \${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="editor" \${u.role === 'editor' ? 'selected' : ''}>Editor</option>
                            <option value="reviewer" \${u.role === 'reviewer' ? 'selected' : ''}>Reviewer</option>
                          </select>
                        </td>
                        <td>
                          <button type="button" class="btn btn-primary btn-sm" onclick="updateUserRoleAction('\${u.email}', 'userRoleSelect_\${uIdx}')">Lưu vai trò</button>
                        </td>
                      </tr>
                    \`).join('')}
                    \${users.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:var(--color-neutral-mid);">Chưa có danh sách người dùng.</td></tr>' : ''}
                  </tbody>
                </table>
              </div>
            \` : \`
              <div class="alert alert-info">
                Chỉ tài khoản Quản trị viên (Admin) mới có quyền xem và thay đổi phân quyền người dùng trong hệ thống.
              </div>
            \`}
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

        document.getElementById('loadPubRevisionsBtn')?.addEventListener('click', async () => {
          const modSelect = document.getElementById('pubModuleSelect');
          const modKey = modSelect ? modSelect.value : 'project';
          const area = document.getElementById('pubRevisionsArea');
          if (!area) return;
          area.innerHTML = '<p>Đang tải...</p>';

          const [revRes, draftRes] = await Promise.all([
            fetchApi('/api/revisions/' + modKey + '?limit=10'),
            fetchApi('/api/drafts/' + modKey)
          ]);
          if (!revRes.ok) {
            area.innerHTML = '<div class="alert alert-danger">Lỗi tải lịch sử phiên bản: ' + (revRes.data.error || '') + '</div>';
            return;
          }
          const revs = revRes.data.revisions || [];
          const currentDraftHash = (draftRes.ok && draftRes.data && draftRes.data.draft) ? draftRes.data.draft.revisionHash : '';

          if (revs.length === 0) {
            area.innerHTML = '<p style="color: var(--color-neutral-mid);">Chưa có phiên bản lịch sử nào cho phân hệ này.</p>';
            return;
          }

          area.innerHTML = \`
            <div class="table-scroll-hint"><span>Cuộn ngang để xem đầy đủ cột phiên bản</span></div>
            <div class="table-container" tabindex="0" role="region" aria-label="Bảng phiên bản phân hệ">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Phiên bản</th>
                    <th>Thời gian</th>
                    <th>Người lưu</th>
                    <th>Ghi chú</th>
                    <th>Mã băm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  \${revs.map(r => \`
                    <tr>
                      <td><strong>v\${r.version}</strong></td>
                      <td>\${new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                      <td>\${escapeHtml(r.createdBy)}</td>
                      <td>\${escapeHtml(r.comment || '(Không có ghi chú)')}</td>
                      <td><code>\${escapeHtml(r.revisionHash ? r.revisionHash.substring(0, 10) + '...' : '')}</code></td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          <button type="button" class="btn btn-secondary btn-sm" onclick="showDiffModal('\${modKey}', '\${r.id}')">So sánh Diff</button>
                          <button type="button" class="btn btn-secondary btn-sm" onclick="restorePubRevision('\${modKey}', '\${r.id}', '\${currentDraftHash}')" \${currentUserRole === 'reviewer' ? 'disabled' : ''}>Khôi phục</button>
                        </div>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          \`;
        });

        window.showDiffModal = async function(modKey, revId) {
          const [revRes, draftRes] = await Promise.all([
            fetchApi('/api/revisions/' + modKey + '/' + revId),
            fetchApi('/api/drafts/' + modKey)
          ]);
          if (!revRes.ok || !draftRes.ok) {
            showToast('Không thể tải dữ liệu để so sánh diff.', 'error');
            return;
          }
          const rev = revRes.data.revision;
          const currentDraft = draftRes.data.draft;
          const revJson = JSON.stringify(rev.data, null, 2);
          const currentJson = JSON.stringify(currentDraft.data, null, 2);

          const overlay = document.createElement('div');
          overlay.className = 'modal-overlay';
          overlay.id = 'diffModalOverlay';
          overlay.innerHTML = \`
            <div class="modal-content">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; color:var(--color-primary);">So sánh Phiên bản v\${rev.version} & Bản nháp Hiện tại (\${modKey})</h3>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('diffModalOverlay').remove()">Đóng</button>
              </div>
              <p><strong>Người tạo:</strong> \${escapeHtml(rev.createdBy)} | <strong>Thời gian:</strong> \${new Date(rev.createdAt).toLocaleString('vi-VN')}</p>
              <p><strong>Ghi chú:</strong> \${escapeHtml(rev.comment || 'Không có ghi chú')}</p>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:12px;">
                <div>
                  <h4 style="margin-bottom:6px; color:#2B6CB0;">Phiên bản v\${rev.version} (Hash: \${escapeHtml(rev.revisionHash ? rev.revisionHash.substring(0, 8) : '')})</h4>
                  <pre style="background:#F7FAFC; padding:12px; border:1px solid #E2E8F0; border-radius:6px; font-size:0.8rem; max-height:400px; overflow:auto;">\${escapeHtml(revJson)}</pre>
                </div>
                <div>
                  <h4 style="margin-bottom:6px; color:#2F855A;">Bản nháp Hiện tại (Hash: \${escapeHtml(currentDraft.revisionHash ? currentDraft.revisionHash.substring(0, 8) : '')})</h4>
                  <pre style="background:#F7FAFC; padding:12px; border:1px solid #E2E8F0; border-radius:6px; font-size:0.8rem; max-height:400px; overflow:auto;">\${escapeHtml(currentJson)}</pre>
                </div>
              </div>
              <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('diffModalOverlay').remove()">Đóng</button>
                <button type="button" class="btn btn-primary" onclick="restoreFromModal('\${modKey}', '\${rev.id}', '\${currentDraft.revisionHash}')">Khôi phục về phiên bản này</button>
              </div>
            </div>
          \`;
          document.body.appendChild(overlay);
        };

        window.restoreFromModal = async function(modKey, revId, expectedHash) {
          document.getElementById('diffModalOverlay')?.remove();
          await restorePubRevision(modKey, revId, expectedHash);
        };

        window.restorePubRevision = async function(modKey, revId, expectedHash) {
          if (!confirm('Bạn có chắc chắn muốn khôi phục phân hệ ' + modKey + ' về phiên bản này không?')) return;
          const res = await fetchApi('/api/revisions/' + modKey + '/' + revId + '/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expectedHash })
          });
          if (res.ok) {
            showToast('Đã khôi phục phiên bản thành công!', 'success');
            renderPublishView();
          } else if (res.status === 409) {
            showToast('Xung đột phiên bản (409): Phân hệ đã có chỉnh sửa mới hơn kể từ khi bạn mở danh sách.', 'error');
          } else {
            showToast('Lỗi khôi phục: ' + (res.data.error || 'Lỗi không xác định'), 'error');
          }
        };

        window.updateUserRoleAction = async function(email, selectId) {
          const sel = document.getElementById(selectId);
          if (!sel) return;
          const newRole = sel.value;
          const res = await fetchApi('/api/users/' + encodeURIComponent(email) + '/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
          });
          if (res.ok) {
            showToast('Đã cập nhật vai trò người dùng ' + email + ' thành ' + newRole, 'success');
            renderPublishView();
          } else {
            showToast('Lỗi phân quyền: ' + (res.data.error || 'Lỗi không xác định'), 'error');
          }
        };

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

