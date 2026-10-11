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
 * Thẩm định quy tắc 2 người (Two-Person Policy / Four-Eyes Principle) cho Tài chính & Sao kê:
 * - Tổng cộng tối thiểu 2 danh tính được cấp quyền khác nhau (không yêu cầu 3 người):
 *   1. Người lập (Preparer / Author): ghi nhận xác nhận nguồn trên phiên bản bất biến.
 *   2. Người duyệt độc lập (Independent Reviewer): phê duyệt yêu cầu xuất bản.
 * - Người lập không được tự phê duyệt (chặn self-review: reviewerEmail !== preparerEmail).
 * - Một người không thể đóng cả hai vai; khi nội dung thay đổi, xác nhận phải được làm lại.
 */
export function validateTwoPersonFinanceApproval(options: {
  preparerEmail: string;
  reviewerEmail: string;
}): { isValid: boolean; error?: string } {
  const preparer = (options.preparerEmail || '').trim().toLowerCase();
  const reviewer = (options.reviewerEmail || '').trim().toLowerCase();

  if (!preparer) {
    return { isValid: false, error: 'Thiếu định danh người lập bản nháp/nguồn tài chính (preparer).' };
  }
  if (!reviewer) {
    return { isValid: false, error: 'Thiếu định danh người phê duyệt độc lập (reviewer).' };
  }
  if (preparer === reviewer) {
    return {
      isValid: false,
      error: 'Quy tắc 2 người: Người lập tài chính không được tự phê duyệt nội dung của mình (cần một người duyệt độc lập).',
    };
  }
  return { isValid: true };
}

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

  // 3. Nếu là bước xuất bản chính thức:
  // Cần ít nhất 2 danh tính độc lập (ví dụ author + cur reviewer, hoặc first reviewer + cur reviewer)
  if (isFinalPublication) {
    if (first && cur === first) {
      return {
        isValid: false,
        error: 'Chưa đủ điều kiện xuất bản tài chính: Cần ít nhất 2 người duyệt độc lập xác nhận.',
      };
    }
    if (!first && (!cur || cur === author)) {
      return {
        isValid: false,
        error: 'Chưa đủ điều kiện xuất bản tài chính: Cần người phê duyệt độc lập khác với tác giả.',
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
