import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRolePermissions,
  assertCanEdit,
  assertCanReview,
  assertCanPublish,
  assertCanManageUsers,
  escapeHtml,
} from '../dist/auth/rbac.js';
import { validateCsrf } from '../dist/auth/middleware.js';
import { AuthError } from '../dist/auth/jwt.js';

test('RBAC: Kiểm tra ma trận quyền hạn các vai trò', () => {
  const admin = getRolePermissions('admin');
  assert.equal(admin.canEdit, true);
  assert.equal(admin.canReview, true);
  assert.equal(admin.canPublish, true);
  assert.equal(admin.canManageUsers, true);

  const editor = getRolePermissions('editor');
  assert.equal(editor.canEdit, true);
  assert.equal(editor.canReview, false);
  assert.equal(editor.canPublish, false);
  assert.equal(editor.canManageUsers, false);

  const reviewer = getRolePermissions('reviewer');
  assert.equal(reviewer.canEdit, false);
  assert.equal(reviewer.canReview, true);
  assert.equal(reviewer.canPublish, false);
  assert.equal(reviewer.canManageUsers, false);
});

test('RBAC: Quyền thao tác bị từ chối chính xác', () => {
  // editor không được duyệt hoặc xuất bản
  assert.doesNotThrow(() => assertCanEdit('editor', 'project'));
  assert.throws(() => assertCanReview('editor', 'publish'), (err) => err instanceof AuthError && err.code === 'FORBIDDEN_REVIEW');
  assert.throws(() => assertCanPublish('editor'), (err) => err instanceof AuthError && err.code === 'FORBIDDEN_PUBLISH');

  // reviewer không được chỉnh sửa
  assert.throws(() => assertCanEdit('reviewer', 'finance'), (err) => err instanceof AuthError && err.code === 'FORBIDDEN_EDIT');
  assert.doesNotThrow(() => assertCanReview('reviewer', 'publish'));

  // admin có đủ quyền
  assert.doesNotThrow(() => assertCanEdit('admin', 'products'));
  assert.doesNotThrow(() => assertCanReview('admin', 'finance'));
  assert.doesNotThrow(() => assertCanPublish('admin'));
  assert.doesNotThrow(() => assertCanManageUsers('admin'));
});

test('Bảo mật: Kiểm tra CSRF chặn yêu cầu nguy hiểm', () => {
  // GET request an toàn
  const getReq = new Request('http://127.0.0.1:4330/api/drafts/project', { method: 'GET' });
  assert.doesNotThrow(() => validateCsrf(getReq));

  // Cross-site request bị từ chối
  const crossSiteReq = new Request('http://127.0.0.1:4330/api/drafts/project', {
    method: 'POST',
    headers: { 'Sec-Fetch-Site': 'cross-site' },
  });
  assert.throws(() => validateCsrf(crossSiteReq), (err) => err instanceof AuthError && err.code === 'CSRF_BLOCKED');

  // Khác Origin bị từ chối
  const badOriginReq = new Request('http://127.0.0.1:4330/api/drafts/project', {
    method: 'POST',
    headers: {
      Host: '127.0.0.1:4330',
      Origin: 'https://evil-attacker.com',
    },
  });
  assert.throws(() => validateCsrf(badOriginReq), (err) => err instanceof AuthError && err.code === 'CSRF_ORIGIN_MISMATCH');

  // Cùng Origin được chấp nhận
  const sameOriginReq = new Request('http://127.0.0.1:4330/api/drafts/project', {
    method: 'POST',
    headers: {
      Host: '127.0.0.1:4330',
      Origin: 'http://127.0.0.1:4330',
    },
  });
  assert.doesNotThrow(() => validateCsrf(sameOriginReq));
});

test('Bảo mật: Thoát ký tự HTML nguy hiểm (XSS Escape)', () => {
  const dirty = '<script>alert("xss")</script>&<img src=x onerror=1>';
  const clean = escapeHtml(dirty);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('&lt;script&gt;'), true);
  assert.equal(clean.includes('&amp;'), true);
});
