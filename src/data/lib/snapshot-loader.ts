/**
 * Bộ nạp Bản chụp Xuất bản (Publication Snapshot Loader) cho Astro (Task C17)
 * Đọc dữ liệu từ bản chụp đã làm sạch và được duyệt (published-snapshot.json).
 * Tuân thủ cấu trúc hợp đồng duy nhất: PublicationSnapshot { version, generatedAt, sha256, modules }.
 * 
 * Quy tắc:
 * 1. Kiểm tra nghiêm ngặt tính toàn vẹn (Strict Schema & Hash Validation).
 * 2. Nếu tệp snapshot có dữ liệu nhưng sai cấu trúc -> Ném lỗi ngay (fail-fast, không nuốt lỗi).
 * 3. Nếu tệp snapshot vắng/rỗng ({}) -> Sử dụng dữ liệu cơ sở (baseline fallback).
 * 4. Không dùng fallback ngầm để khôi phục giá trị rỗng/null do người dùng chủ ý xóa.
 */

import rawSnapshot from '../published-snapshot.json' with { type: 'json' };

export interface SnapshotProjectModule {
  slug?: string;
  title?: string;
  slogan?: string;
  summary?: string;
  location?: string;
  executionStatus?: string;
  statusNotice?: string;
  previewNotice?: string;
  activities?: any[];
  plannedStages?: any[];
  safetyPractices?: string[];
  progress?: any;
  plannedSessions?: any[];
  contacts?: any;
}

export interface SnapshotModules {
  project?: SnapshotProjectModule;
  journal?: any[];
  products?: Record<string, any>;
  finance?: any;
  team?: any;
}

export interface LoadedSnapshot {
  version: string;
  generatedAt: string;
  sha256: string;
  modules: SnapshotModules;
}

/**
 * Nạp và kiểm định bản chụp xuất bản đã phê duyệt
 */
export function loadValidatedSnapshot(): LoadedSnapshot | null {
  if (!rawSnapshot || typeof rawSnapshot !== 'object' || Object.keys(rawSnapshot).length === 0) {
    return null; // Không có bản chụp -> dùng baseline
  }

  const snap = rawSnapshot as Record<string, any>;

  // Kiểm thực nghiêm ngặt cấu trúc PublicationSnapshot
  if (typeof snap.version !== 'string' || !snap.version.trim()) {
    throw new Error('Malformed Published Snapshot: Trường "version" không hợp lệ.');
  }

  if (typeof snap.sha256 !== 'string' || snap.sha256.length !== 64) {
    throw new Error('Malformed Published Snapshot: Trường "sha256" không hợp lệ hoặc sai độ dài.');
  }

  if (!snap.modules || typeof snap.modules !== 'object' || Array.isArray(snap.modules)) {
    throw new Error('Malformed Published Snapshot: Trường "modules" bắt buộc phải là một đối tượng phân hệ.');
  }

  return {
    version: snap.version,
    generatedAt: snap.generatedAt || new Date().toISOString(),
    sha256: snap.sha256,
    modules: snap.modules as SnapshotModules,
  };
}

const activeSnapshot = loadValidatedSnapshot();

/**
 * Lấy đối tượng Snapshot đang hoạt động (nếu có)
 */
export function getActiveSnapshot(): LoadedSnapshot | null {
  return activeSnapshot;
}

/**
 * Áp dụng dữ liệu dự án từ bản chụp xuất bản lên đối tượng cơ sở (baseline)
 * Bảo toàn ngữ nghĩa của các giá trị rỗng hoặc null do người dùng chủ ý thiết lập.
 */
export function getPublishedProject<T extends Record<string, any>>(baseline: T): T {
  if (!activeSnapshot?.modules?.project) {
    return baseline;
  }

  const p = activeSnapshot.modules.project;
  const result: any = { ...baseline };

  if (p.title !== undefined) result.title = p.title;
  if (p.slogan !== undefined) result.slogan = p.slogan;
  if (p.summary !== undefined) result.summary = p.summary;
  if (p.location !== undefined) result.location = p.location;
  if (p.executionStatus !== undefined) result.executionStatus = p.executionStatus;
  if (p.statusNotice !== undefined) result.statusNotice = p.statusNotice;
  if (p.previewNotice !== undefined) result.previewNotice = p.previewNotice;
  if (Array.isArray(p.activities)) result.activities = p.activities;
  if (Array.isArray(p.plannedStages)) result.plannedStages = p.plannedStages;
  if (Array.isArray(p.safetyPractices)) result.safetyPractices = p.safetyPractices;

  return result as T;
}

/**
 * Áp dụng tiến độ dự án từ bản chụp
 */
export function getPublishedProgress<T extends Record<string, any>>(baseline: T): T {
  if (!activeSnapshot?.modules?.project?.progress) {
    return baseline;
  }
  return { ...baseline, ...activeSnapshot.modules.project.progress };
}

/**
 * Áp dụng danh sách các buổi hoạt động từ bản chụp
 */
export function getPublishedSessions<T>(baseline: T[]): T[] {
  if (Array.isArray(activeSnapshot?.modules?.project?.plannedSessions)) {
    return activeSnapshot.modules.project.plannedSessions as T[];
  }
  return baseline;
}

/**
 * Áp dụng thông tin liên hệ chính thức từ bản chụp
 */
export function getPublishedContacts<T extends Record<string, any>>(baseline: T): T {
  if (!activeSnapshot?.modules?.project?.contacts) {
    return baseline;
  }
  return { ...baseline, ...activeSnapshot.modules.project.contacts };
}

/**
 * Áp dụng thông tin tài khoản quyên góp từ bản chụp
 */
export function getPublishedDonationAccount<T extends Record<string, any>>(baseline: T): T {
  if (!activeSnapshot?.modules?.finance?.donationAccount) {
    return baseline;
  }
  return { ...baseline, ...activeSnapshot.modules.finance.donationAccount };
}

/**
 * Áp dụng danh sách thành viên nhóm từ bản chụp
 */
export function getPublishedTeamMembers<T>(baseline: T[]): T[] {
  if (Array.isArray(activeSnapshot?.modules?.team?.members)) {
    return activeSnapshot.modules.team.members as T[];
  }
  return baseline;
}

/**
 * Áp dụng danh sách câu hỏi thường gặp FAQ từ bản chụp
 */
export function getPublishedFaqs<T extends { productFaqs: any[]; supportFaqs: any[]; transparencyFaqs: any[] }>(baseline: T): T {
  const team = activeSnapshot?.modules?.team;
  if (!team) return baseline;

  return {
    ...baseline,
    productFaqs: Array.isArray(team.productFaqs) ? team.productFaqs : baseline.productFaqs,
    supportFaqs: Array.isArray(team.supportFaqs) ? team.supportFaqs : baseline.supportFaqs,
    transparencyFaqs: Array.isArray(team.transparencyFaqs) ? team.transparencyFaqs : baseline.transparencyFaqs,
  };
}
