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

// @ts-ignore: node:crypto có sẵn trong môi trường Node.js SSG
import { createHash } from 'node:crypto';
// @ts-ignore: node:async_hooks có sẵn trong Node.js / Cloudflare AsyncLocalStorage
import { AsyncLocalStorage } from 'node:async_hooks';
import rawSnapshot from '../published-snapshot.json' with { type: 'json' };

const SNAPSHOT_STORAGE_SYMBOL = Symbol.for('__astro_published_snapshot_storage__');
export const snapshotStorage: AsyncLocalStorage<LoadedSnapshot | null> =
  ((globalThis as any)[SNAPSHOT_STORAGE_SYMBOL] ??= new AsyncLocalStorage<LoadedSnapshot | null>());

export function runWithSnapshot<R>(snapshot: LoadedSnapshot | null, fn: () => R): R {
  return snapshotStorage.run(snapshot, fn);
}

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
  needs?: any[];
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

function isValidCalendarIsoDate(isoStr: string): boolean {
  if (typeof isoStr !== 'string') return false;
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return false;
  if (date.getUTCFullYear() !== year || (date.getUTCMonth() + 1) !== month || date.getUTCDate() !== day) {
    return false;
  }
  return true;
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

  if (typeof snap.generatedAt !== 'string' || !isValidCalendarIsoDate(snap.generatedAt)) {
    throw new Error('Malformed Published Snapshot: Trường "generatedAt" bắt buộc phải là chuỗi thời gian ISO hợp lệ.');
  }

  if (typeof snap.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(snap.sha256)) {
    throw new Error('Malformed Published Snapshot: Trường "sha256" bắt buộc là chuỗi băm hex 64 ký tự hợp lệ.');
  }

  if (!snap.modules || typeof snap.modules !== 'object' || Array.isArray(snap.modules)) {
    throw new Error('Malformed Published Snapshot: Trường "modules" bắt buộc phải là một đối tượng phân hệ.');
  }

  // Xác thực sâu cấu trúc từng phân hệ (Deep Canonical Module Schema)
  if (snap.modules.project !== undefined) {
    const p = snap.modules.project;
    if (typeof p !== 'object' || p === null || Array.isArray(p)) {
      throw new Error('Malformed Published Snapshot: Phân hệ "project" không đúng định dạng đối tượng.');
    }
    const stringFields = ['slug', 'title', 'slogan', 'summary', 'location', 'executionStatus', 'statusNotice', 'previewNotice'];
    for (const f of stringFields) {
      if (p[f] !== undefined && typeof p[f] !== 'string') {
        throw new Error(`Malformed Published Snapshot: Trường "project.${f}" phải là chuỗi ký tự.`);
      }
    }
    const arrayFields = ['activities', 'plannedStages', 'safetyPractices', 'plannedSessions'];
    for (const f of arrayFields) {
      if (p[f] !== undefined && !Array.isArray(p[f])) {
        throw new Error(`Malformed Published Snapshot: Trường "project.${f}" phải là một mảng.`);
      }
    }
    if (p.progress !== undefined && (typeof p.progress !== 'object' || p.progress === null || Array.isArray(p.progress))) {
      throw new Error('Malformed Published Snapshot: Trường "project.progress" phải là một đối tượng.');
    }
    if (p.contacts !== undefined && p.contacts !== null && (typeof p.contacts !== 'object' || Array.isArray(p.contacts))) {
      throw new Error('Malformed Published Snapshot: Trường "project.contacts" phải là một đối tượng hoặc null.');
    }
  }
  if (snap.modules.journal !== undefined && !Array.isArray(snap.modules.journal)) {
    throw new Error('Malformed Published Snapshot: Phân hệ "journal" phải là một mảng bài viết.');
  }
  if (snap.modules.products !== undefined) {
    if (typeof snap.modules.products !== 'object' || snap.modules.products === null || Array.isArray(snap.modules.products)) {
      throw new Error('Malformed Published Snapshot: Phân hệ "products" không đúng định dạng đối tượng.');
    }
    for (const [prodId, prod] of Object.entries(snap.modules.products)) {
      if (typeof prod !== 'object' || prod === null || Array.isArray(prod)) {
        throw new Error(`Malformed Published Snapshot: Dữ liệu sản phẩm "${prodId}" không đúng định dạng đối tượng.`);
      }
      const p = prod as Record<string, any>;
      if (p.name !== undefined && p.name !== null && typeof p.name !== 'string') {
        throw new Error(`Malformed Published Snapshot: Trường "products.${prodId}.name" phải là chuỗi ký tự.`);
      }
      if (p.description !== undefined && p.description !== null && typeof p.description !== 'string') {
        throw new Error(`Malformed Published Snapshot: Trường "products.${prodId}.description" phải là chuỗi ký tự.`);
      }
      if (p.originText !== undefined && p.originText !== null && typeof p.originText !== 'string') {
        throw new Error(`Malformed Published Snapshot: Trường "products.${prodId}.originText" phải là chuỗi ký tự.`);
      }
      if (p.narrative !== undefined && p.narrative !== null && typeof p.narrative !== 'string') {
        throw new Error(`Malformed Published Snapshot: Trường "products.${prodId}.narrative" phải là chuỗi ký tự.`);
      }
      if (p.mediaKey !== undefined && p.mediaKey !== null && typeof p.mediaKey !== 'string') {
        throw new Error(`Malformed Published Snapshot: Trường "products.${prodId}.mediaKey" phải là chuỗi ký tự.`);
      }
    }
  }
  if (snap.modules.finance !== undefined && (typeof snap.modules.finance !== 'object' || snap.modules.finance === null || Array.isArray(snap.modules.finance))) {
    throw new Error('Malformed Published Snapshot: Phân hệ "finance" không đúng định dạng đối tượng.');
  }
  if (snap.modules.team !== undefined && (typeof snap.modules.team !== 'object' || snap.modules.team === null || Array.isArray(snap.modules.team))) {
    throw new Error('Malformed Published Snapshot: Phân hệ "team" không đúng định dạng đối tượng.');
  }

  // Tái tính toán và kiểm tra mã băm sha256 đối chiếu với JSON.stringify(modules)
  const computedHash = createHash('sha256').update(JSON.stringify(snap.modules)).digest('hex');
  if (snap.sha256.toLowerCase() !== computedHash.toLowerCase()) {
    throw new Error(`Malformed Published Snapshot: Mã băm sha256 (${snap.sha256}) không khớp với nội dung phân hệ (${computedHash}).`);
  }

  return {
    version: snap.version,
    generatedAt: snap.generatedAt,
    sha256: snap.sha256.toLowerCase(),
    modules: snap.modules as SnapshotModules,
  };
}

const activeSnapshot = loadValidatedSnapshot();

/**
 * Lấy đối tượng Snapshot đang hoạt động (theo request-context hoặc baseline tĩnh)
 */
export function getActiveSnapshot(): LoadedSnapshot | null {
  const store = snapshotStorage.getStore();
  if (store !== undefined) {
    return store;
  }
  return activeSnapshot;
}

/**
 * Áp dụng dữ liệu dự án từ bản chụp xuất bản lên đối tượng cơ sở (baseline)
 * Bảo toàn ngữ nghĩa của các giá trị rỗng hoặc null do người dùng chủ ý thiết lập.
 */
export function getPublishedProject<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.project) {
    return baseline;
  }

  const p = snap.modules.project;
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
  const snap = getActiveSnapshot();
  if (!snap?.modules?.project?.progress) {
    return baseline;
  }
  return { ...baseline, ...snap.modules.project.progress };
}

/**
 * Áp dụng danh sách các buổi hoạt động từ bản chụp
 */
export function getPublishedSessions<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.project?.plannedSessions)) {
    return snap.modules.project.plannedSessions as T[];
  }
  return baseline;
}

/**
 * Áp dụng thông tin liên hệ chính thức từ bản chụp
 */
export function getPublishedContacts<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.project) {
    return baseline;
  }
  const snapContacts = snap.modules.project.contacts;
  if (snapContacts === null) {
    return {
      ...baseline,
      status: 'unconfirmed',
      people: [],
      fanpageUrl: null,
    };
  }
  if (snapContacts !== undefined) {
    return {
      status: snapContacts.status ?? 'unconfirmed',
      people: Array.isArray(snapContacts.people) ? snapContacts.people : [],
      fanpageUrl: snapContacts.fanpageUrl ?? null,
      sourceRef: snapContacts.sourceRef ?? 'studio:snapshot',
      updatedAt: snapContacts.updatedAt ?? (snap.generatedAt ? snap.generatedAt.slice(0, 10) : '2026-10-12'),
    } as unknown as T;
  }
  return baseline;
}

/**
 * Áp dụng thông tin tài khoản quyên góp từ bản chụp
 */
export function getPublishedDonationAccount<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.finance?.donationAccount) {
    return baseline;
  }
  return { ...baseline, ...snap.modules.finance.donationAccount };
}

/**
 * Áp dụng danh sách thành viên nhóm từ bản chụp
 */
export function getPublishedTeamMembers<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.team?.members)) {
    return snap.modules.team.members as T[];
  }
  return baseline;
}

export function getPublishedProductFaqs<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.team?.productFaqs)) {
    return snap.modules.team.productFaqs as T[];
  }
  return baseline;
}

export function getPublishedSupportFaqs<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.team?.supportFaqs)) {
    return snap.modules.team.supportFaqs as T[];
  }
  return baseline;
}

export function getPublishedTransparencyFaqs<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.team?.transparencyFaqs)) {
    return snap.modules.team.transparencyFaqs as T[];
  }
  return baseline;
}

/**
 * Áp dụng danh sách câu hỏi thường gặp FAQ từ bản chụp
 */
export function getPublishedFaqs<T extends { productFaqs: any[]; supportFaqs: any[]; transparencyFaqs: any[] }>(baseline: T): T {
  const snap = getActiveSnapshot();
  const team = snap?.modules?.team;
  if (!team) return baseline;

  return {
    ...baseline,
    productFaqs: Array.isArray(team.productFaqs) ? team.productFaqs : baseline.productFaqs,
    supportFaqs: Array.isArray(team.supportFaqs) ? team.supportFaqs : baseline.supportFaqs,
    transparencyFaqs: Array.isArray(team.transparencyFaqs) ? team.transparencyFaqs : baseline.transparencyFaqs,
  };
}

/**
 * Lấy cấu hình mở bán sản phẩm đã xuất bản (bao gồm narrative và mediaKey)
 */
export function getPublishedProductConfig(productId: string): {
  name?: string | null;
  description?: string | null;
  originText?: string | null;
  saleStatus?: 'unconfirmed' | 'open' | 'closed';
  officialPrice?: number | null;
  stockAvailable?: number | null;
  salesChannel?: string;
  returnPolicy?: string | null;
  publicApproval?: 'pending' | 'approved';
  preorderOpen?: boolean;
  pickup?: string | null;
  narrative?: string | null;
  mediaKey?: string | null;
} | null {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.products) {
    return null;
  }
  return (snap.modules.products as Record<string, any>)[productId] || null;
}

/**
 * Áp dụng cấu hình sản phẩm từ bản chụp xuất bản lên danh mục baseline
 */
export function getPublishedProducts<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.products) {
    return baseline;
  }
  const snapProds = snap.modules.products as Record<string, any>;
  const result: any = { ...baseline };
  for (const [id, conf] of Object.entries(snapProds)) {
    if (result[id]) {
      result[id] = { ...result[id], ...conf };
    } else {
      result[id] = conf;
    }
  }
  return result as T;
}

/**
 * Áp dụng sổ thu chi quyên góp từ phân hệ tài chính của bản chụp
 */
export function getPublishedFinanceLedger<T extends { reconciled: boolean; reconciledAt: string | null; entries: any[] }>(baseline: T): T {
  const snap = getActiveSnapshot();
  const fin = snap?.modules?.finance;
  if (!fin || !Array.isArray(fin.entries)) {
    return baseline;
  }
  return {
    ...baseline,
    reconciled: Boolean(fin.reconciled),
    reconciledAt: fin.reconciledAt || null,
    entries: fin.entries,
  };
}

/**
 * Áp dụng tổng quan dự toán tài chính từ bản chụp
 */
export function getPublishedFinanceOverview<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  const fin = snap?.modules?.finance;
  if (!fin || !fin.overview) {
    return baseline;
  }
  return {
    ...baseline,
    ...fin.overview,
  };
}

/**
 * Áp dụng danh sách nhu cầu dự án từ bản chụp
 */
export function getPublishedProjectNeeds<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.project?.needs)) {
    return snap.modules.project.needs as T[];
  }
  return baseline;
}

/**
 * Áp dụng thông tin nhóm từ bản chụp
 */
export function getPublishedTeamInfo<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.team?.info) {
    return baseline;
  }
  return { ...baseline, ...snap.modules.team.info };
}

/**
 * Áp dụng các nguyên tắc nhóm từ bản chụp
 */
export function getPublishedTeamPrinciples<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.team?.principles)) {
    return snap.modules.team.principles as T[];
  }
  return baseline;
}

/**
 * Áp dụng các mảng phân công nhóm từ bản chụp
 */
export function getPublishedTeamAreas<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.team?.areas)) {
    return snap.modules.team.areas as T[];
  }
  return baseline;
}

/**
 * Áp dụng danh mục dự toán chi từ bản chụp
 */
export function getPublishedPlannedExpenses<T>(baseline: T[]): T[] {
  const snap = getActiveSnapshot();
  if (Array.isArray(snap?.modules?.finance?.plannedExpenses)) {
    return snap.modules.finance.plannedExpenses as T[];
  }
  return baseline;
}

/**
 * Lấy cấu hình metadata SEO từ bản chụp
 */
export function getPublishedSiteMeta<T extends Record<string, any>>(baseline: T): T {
  const snap = getActiveSnapshot();
  if (!snap?.modules?.team?.siteMeta) {
    return baseline;
  }
  return { ...baseline, ...snap.modules.team.siteMeta };
}

