import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOURNAL_ENTRIES,
  getPublishedJournalEntries,
  getJournalEntryBySlug,
  JOURNAL_CATEGORIES,
} from '../src/data/journal.ts';
import {
  validateJournalEntry,
  validateJournalEntriesList,
  isSafeText,
} from '../tools/content-studio/journal-validator.mjs';

describe('Kiểm thử Dữ liệu và Schema Nhật ký dự án (Task C14)', () => {
  it('Khởi tạo đúng 2 bài viết kế hoạch ban đầu', () => {
    assert.equal(JOURNAL_ENTRIES.length, 2);
    const slugs = JOURNAL_ENTRIES.map((e) => e.slug);
    assert.deepEqual(slugs, ['ke-hoach-bon-goc-choi', 'gioi-thieu-qua-luu-niem-gay-quy']);
  });

  it('Toàn bộ bài viết ban đầu đều ở trạng thái published và hợp lệ theo validator', () => {
    const published = getPublishedJournalEntries();
    assert.equal(published.length, 2);

    const validation = validateJournalEntriesList(JOURNAL_ENTRIES);
    assert.equal(validation.isValid, true);
    assert.equal(validation.errors.length, 0);
  });

  it('Tìm kiếm bài viết theo slug hoạt động chính xác', () => {
    const entry1 = getJournalEntryBySlug('ke-hoach-bon-goc-choi');
    assert.ok(entry1);
    assert.equal(entry1.category, 'ke-hoach');

    const entry2 = getJournalEntryBySlug('gioi-thieu-qua-luu-niem-gay-quy');
    assert.ok(entry2);

    const nonExistent = getJournalEntryBySlug('bai-viet-khong-ton-tai');
    assert.equal(nonExistent, undefined);
  });

  it('Cách ly bài viết bản nháp (draft isolation): draft không xuất hiện trong getPublishedJournalEntries', () => {
    const sampleDraft = {
      slug: 'bai-nhap-noi-bo',
      title: 'Bản nháp kế hoạch tuần tới',
      summary: 'Tóm tắt bài nháp',
      category: 'chuan-bi',
      categoryLabel: 'Chuẩn bị',
      publishedAt: '2026-10-12',
      eventDate: null,
      status: 'draft',
      content: [{ type: 'paragraph', text: 'Nội dung nháp' }],
    };

    // Kiểm tra validator chấp nhận draft
    const res = validateJournalEntry(sampleDraft);
    assert.equal(res.isValid, true);

    // Chứng minh hàm getPublishedJournalEntries thực tế lọc bỏ draft
    const testList = [...JOURNAL_ENTRIES, sampleDraft];
    const publishedOnly = getPublishedJournalEntries(testList);
    assert.equal(publishedOnly.some((e) => e.slug === 'bai-nhap-noi-bo'), false);
    assert.equal(publishedOnly.length, JOURNAL_ENTRIES.length);
  });

  it('Hàm getPublishedJournalEntries sắp xếp bài viết theo thứ tự mới nhất trước (newest-first) từ danh sách chưa sắp xếp', () => {
    const unsortedList = [
      {
        slug: 'bai-cu',
        title: 'Bài viết cũ',
        summary: 'Tóm tắt',
        category: 'ke-hoach',
        categoryLabel: 'Kế hoạch',
        publishedAt: '2026-10-01',
        eventDate: null,
        status: 'published',
        content: [{ type: 'paragraph', text: 'Nội dung' }],
      },
      {
        slug: 'bai-moi-nhat',
        title: 'Bài viết mới nhất vừa thêm qua Studio',
        summary: 'Tóm tắt mới',
        category: 'hoat-dong',
        categoryLabel: 'Hoạt động',
        publishedAt: '2026-10-15',
        eventDate: null,
        status: 'published',
        content: [{ type: 'paragraph', text: 'Nội dung' }],
      },
      {
        slug: 'bai-trung-binh',
        title: 'Bài viết ở giữa',
        summary: 'Tóm tắt giữa',
        category: 'chuan-bi',
        categoryLabel: 'Chuẩn bị',
        publishedAt: '2026-10-10',
        eventDate: null,
        status: 'published',
        content: [{ type: 'paragraph', text: 'Nội dung' }],
      },
    ];

    const sorted = getPublishedJournalEntries(unsortedList);
    assert.equal(sorted.length, 3);
    assert.equal(sorted[0].slug, 'bai-moi-nhat');
    assert.equal(sorted[1].slug, 'bai-trung-binh');
    assert.equal(sorted[2].slug, 'bai-cu');

    // Chứng minh Trang chủ lấy slice(0, 2) sẽ lấy được bài mới nhất vừa thêm
    const homeRecent = sorted.slice(0, 2);
    assert.equal(homeRecent[0].slug, 'bai-moi-nhat');
    assert.equal(homeRecent.length, 2);
  });

  it('Bắt lỗi khi bài viết vi phạm schema (slug sai, thiếu title, khối nội dung rỗng)', () => {
    const invalidEntry = {
      slug: 'SLUG_VIET_HOA_KHONG_HOP_LE',
      title: '',
      summary: 'Tóm tắt',
      category: 'danh-muc-la',
      publishedAt: '12-10-2026', // sai định dạng
      status: 'unknown',
      content: [],
    };

    const res = validateJournalEntry(invalidEntry);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.length >= 4);
  });

  it('Phát hiện và ngăn chặn mã script nguy hiểm trong nội dung (XSS protection)', () => {
    assert.equal(isSafeText('Nội dung văn bản bình thường'), true);
    assert.equal(isSafeText('<script>alert("hacked")</script>'), false);
    assert.equal(isSafeText('javascript:void(0)'), false);
    assert.equal(isSafeText('<img src="x" onerror="alert(1)">'), false);

    const maliciousEntry = {
      slug: 'bai-nguy-hiem',
      title: '<script>alert(1)</script>',
      summary: 'Tóm tắt',
      category: 'ke-hoach',
      publishedAt: '2026-10-11',
      status: 'published',
      content: [{ type: 'paragraph', text: 'An toàn' }],
    };
    const res = validateJournalEntry(maliciousEntry);
    assert.equal(res.isValid, false);
  });

  it('Các danh mục nhật ký khớp chuẩn quy định', () => {
    const ids = JOURNAL_CATEGORIES.map((c) => c.id);
    assert.deepEqual(ids, ['ke-hoach', 'chuan-bi', 'hoat-dong', 'ban-giao']);
  });
});
