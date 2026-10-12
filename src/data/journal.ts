/**
 * Dữ liệu và cấu trúc nội dung Nhật ký dự án (Task C14).
 * Tuân thủ docs/task-specs/C14.md và các phản hồi review sớm:
 * - Tách biệt dữ liệu khỏi template, schema strict, nội dung dạng khối cấu trúc.
 * - Trạng thái draft không được sinh route hoặc xuất hiện trong bundle/danh sách công khai.
 * - Khởi tạo 2 bài giới thiệu kế hoạch từ dữ liệu đã có; không bịa sự kiện/thành tích thực tế.
 * - Dữ liệu liên thông với Content Studio qua src/data/journal-entries.json.
 */

import rawEntries from './journal-entries.json' with { type: 'json' };
import { validateJournalEntriesList } from '../../tools/content-studio/journal-validator.mjs';
import { getActiveSnapshot } from './lib/snapshot-loader.ts';

// Kiểm tra schema nghiêm ngặt tại read/build boundary
const _journalValidation = validateJournalEntriesList(rawEntries);
if (!_journalValidation.isValid) {
  throw new Error(`Dữ liệu bài viết nhật ký không hợp lệ: ${_journalValidation.errors.join('; ')}`);
}

export type JournalCategory = 'ke-hoach' | 'chuan-bi' | 'hoat-dong' | 'ban-giao';

export interface JournalImage {
  src: string;
  alt: string;
  caption: string;
  creditName?: string;
  creditSource?: string;
  creditUrl?: string;
}

export type JournalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'callout'; text: string }
  | { type: 'image'; src: string; alt: string; caption: string; creditName?: string; creditSource?: string; creditUrl?: string }
  | { type: 'list'; items: string[] };

export interface JournalEntry {
  slug: string;
  title: string;
  summary: string;
  category: JournalCategory;
  categoryLabel: string;
  publishedAt: string; // YYYY-MM-DD - Ngày biên tập công bố bài viết
  eventDate: string | null; // YYYY-MM-DD | null - Mốc thời gian sự kiện (nếu có, ví dụ 2026-10-24)
  eventStatus?: 'planned' | 'in_progress' | 'completed' | 'cancelled' | null;
  status: 'draft' | 'published';
  coverImage?: JournalImage;
  content: JournalBlock[];
}

export const JOURNAL_CATEGORIES: { id: JournalCategory; label: string }[] = [
  { id: 'ke-hoach', label: 'Kế hoạch' },
  { id: 'chuan-bi', label: 'Chuẩn bị' },
  { id: 'hoat-dong', label: 'Hoạt động' },
  { id: 'ban-giao', label: 'Bàn giao' },
];

export function getCategoryLabel(category: JournalCategory): string {
  const match = JOURNAL_CATEGORIES.find((c) => c.id === category);
  return match ? match.label : category;
}

export function getAllJournalEntries(): JournalEntry[] {
  const activeSnap = getActiveSnapshot();
  if (activeSnap?.modules?.journal && Array.isArray(activeSnap.modules.journal)) {
    return activeSnap.modules.journal as JournalEntry[];
  }
  return rawEntries as JournalEntry[];
}

/**
 * Danh sách toàn bộ các bài viết nhật ký trong hệ thống (Proxy động theo request-context).
 * Bao gồm cả published và draft (nội bộ).
 */
export const JOURNAL_ENTRIES: JournalEntry[] = new Proxy(rawEntries as JournalEntry[], {
  get(_target, prop, receiver) {
    const list = getAllJournalEntries();
    const val = Reflect.get(list, prop, receiver);
    return typeof val === 'function' ? val.bind(list) : val;
  },
  has(_target, prop) {
    return Reflect.has(getAllJournalEntries(), prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getAllJournalEntries());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const desc = Object.getOwnPropertyDescriptor(getAllJournalEntries(), prop);
    if (!desc) {
      return undefined;
    }
    const targetDesc = Reflect.getOwnPropertyDescriptor(_target, prop);
    if (targetDesc && !targetDesc.configurable) {
      desc.configurable = false;
    } else {
      desc.configurable = true;
    }
    return desc;
  }
});

/**
 * Lấy danh sách các bài viết đã được duyệt công bố (published), sắp xếp mới nhất trước (newest-first).
 * Các bài draft bị loại bỏ hoàn toàn trên route công khai.
 */
export function getPublishedJournalEntries(entries?: JournalEntry[]): JournalEntry[] {
  const list = entries || getAllJournalEntries();
  return [...list]
    .filter((entry) => entry.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Lấy một bài viết đã công bố theo slug (hoặc bài draft nếu đang trong phiên xem trước preview).
 */
export function getJournalEntryBySlug(slug: string): JournalEntry | undefined {
  const list = getAllJournalEntries();
  const activeSnap = getActiveSnapshot();
  const isPreview = Boolean(activeSnap && (activeSnap as any).isPreview);
  return list.find((entry) => entry.slug === slug && (isPreview || entry.status === 'published'));
}
