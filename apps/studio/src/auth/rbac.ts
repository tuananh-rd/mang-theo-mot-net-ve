/**
 * Phân quyền dựa trên vai trò (RBAC) và kiểm soát nghiệp vụ (Task C17)
 */

import type { UserRole, ModuleKey } from '../types.js';
import { AuthError } from './jwt.js';

export const VALID_ROLES: UserRole[] = ['admin', 'editor', 'reviewer'];

export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canManageUsers: boolean;
}

/** Trả về quyền hạn chi tiết cho từng vai trò */
export function getRolePermissions(role: UserRole): PermissionCheck {
  switch (role) {
    case 'admin':
      return {
        canView: true,
        canEdit: true,
        canReview: true,
        canPublish: true,
        canManageUsers: true,
      };
    case 'editor':
      return {
        canView: true,
        canEdit: true,
        canReview: false,
        canPublish: false,
        canManageUsers: false,
      };
    case 'reviewer':
      return {
        canView: true,
        canEdit: false,
        canReview: true,
        canPublish: false,
        canManageUsers: false,
      };
    default:
      return {
        canView: false,
        canEdit: false,
        canReview: false,
        canPublish: false,
        canManageUsers: false,
      };
  }
}

/** Kiểm tra quyền chỉnh sửa phân hệ */
export function assertCanEdit(role: UserRole, moduleKey?: ModuleKey): void {
  const perms = getRolePermissions(role);
  if (!perms.canEdit) {
    throw new AuthError(`Vai trò '${role}' không có quyền chỉnh sửa${moduleKey ? ` phân hệ '${moduleKey}'` : ''}.`, 'FORBIDDEN_EDIT', 403);
  }
}

/** Kiểm tra quyền phê duyệt / review */
export function assertCanReview(role: UserRole, moduleKey?: ModuleKey): void {
  const perms = getRolePermissions(role);
  if (!perms.canReview) {
    throw new AuthError(`Vai trò '${role}' không có quyền phê duyệt${moduleKey ? ` phân hệ '${moduleKey}'` : ''}.`, 'FORBIDDEN_REVIEW', 403);
  }
}

/** Kiểm tra quyền xuất bản */
export function assertCanPublish(role: UserRole): void {
  const perms = getRolePermissions(role);
  if (!perms.canPublish) {
    throw new AuthError(`Chỉ 'admin' mới có quyền kích hoạt xuất bản toàn trang.`, 'FORBIDDEN_PUBLISH', 403);
  }
}

/** Kiểm tra quyền quản trị người dùng */
export function assertCanManageUsers(role: UserRole): void {
  const perms = getRolePermissions(role);
  if (!perms.canManageUsers) {
    throw new AuthError(`Chỉ 'admin' mới có quyền quản lý danh sách và phân quyền người dùng.`, 'FORBIDDEN_USER_MGMT', 403);
  }
}

/**
 * Thẩm định quy tắc 2 người độc lập (Four-eyes principle) cho Tài chính & Sao kê:
 * - Người duyệt không được trùng với người tạo bản nháp / đề xuất (nghiêm cấm self-review)
 * - Khi công bố sao kê ngân hàng, bắt buộc phải có đủ 2 người duyệt độc lập ký xác nhận
 */
export function validateFourEyesApproval(options: {
  currentReviewerEmail: string;
  authorEmail: string;
  firstReviewerEmail?: string | null;
  isFinalPublication?: boolean;
}): { isValid: boolean; error?: string } {
  const { currentReviewerEmail, authorEmail, firstReviewerEmail, isFinalPublication } = options;

  const cur = (currentReviewerEmail || '').trim().toLowerCase();
  const author = (authorEmail || '').trim().toLowerCase();
  const first = (firstReviewerEmail || '').trim().toLowerCase();

  // 1. Chặn tự duyệt (Self-review check)
  if (cur === author) {
    return {
      isValid: false,
      error: 'Quy tắc 2 người: Tác giả bản nháp tài chính không được tự phê duyệt nội dung của mình.',
    };
  }

  // 2. Chặn 1 người ký 2 lần
  if (first && cur === first) {
    return {
      isValid: false,
      error: 'Quy tắc 2 người: Người duyệt thứ hai phải là một thành viên độc lập khác.',
    };
  }

  // 3. Nếu là bước xuất bản chính thức, bắt buộc phải đủ 2 người ký duyệt
  if (isFinalPublication) {
    if (!first || !cur) {
      return {
        isValid: false,
        error: 'Chưa đủ điều kiện xuất bản tài chính: Cần ít nhất 2 người duyệt độc lập xác nhận.',
      };
    }
  }

  return { isValid: true };
}

/** Chống XSS: Thoát các ký tự HTML nguy hiểm */
export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
