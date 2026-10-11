/**
 * Module xác thực bài viết nhật ký dự án (Task C14).
 * Kiểm tra cấu trúc bài viết, tính hợp lệ của slug, danh mục, ngày tháng thực tế,
 * URL credit, ảnh đã duyệt, trạng thái sự kiện, caption và khối nội dung an toàn.
 * Hỗ trợ làm sạch (sanitize) tệp JSON để loại bỏ mọi trường thừa hoặc không an toàn.
 */

const ALLOWED_CATEGORIES = new Set(['ke-hoach', 'chuan-bi', 'hoat-dong', 'ban-giao']);
const CATEGORY_LABELS = {
  'ke-hoach': 'Kế hoạch',
  'chuan-bi': 'Chuẩn bị',
  'hoat-dong': 'Hoạt động',
  'ban-giao': 'Bàn giao',
};
const ALLOWED_EVENT_STATUSES = new Set(['planned', 'in_progress', 'completed', 'cancelled', null, undefined]);
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Kiểm tra tính hợp lệ của ngày theo lịch thực tế (YYYY-MM-DD).
 * @param {string} str
 * @returns {boolean}
 */
export function isValidIsoDate(str) {
  if (!str || typeof str !== 'string') return false;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (y < 2020 || y > 2030 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return (
    dateObj.getUTCFullYear() === y &&
    dateObj.getUTCMonth() === m - 1 &&
    dateObj.getUTCDate() === d
  );
}

/**
 * Kiểm tra tính an toàn và hợp lệ của URL credit.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidCreditUrl(url) {
  if (!url) return true; // Tùy chọn
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const EXACT_APPROVED_IMAGE_PATHS = new Set([
  '/images/illustrations/a01.webp',
  '/images/illustrations/a02.webp',
  '/images/illustrations/a03.webp',
  '/images/illustrations/a04.webp',
  '/images/illustrations/a05.webp',
  '/images/san-pham/chuon-chuon-tre.webp',
  '/images/mai-am/mai-am-1.webp',
  '/images/mai-am/mai-am-2.webp',
  '/images/thanh-vien/le-tuan-anh.webp',
  '/images/thanh-vien/nguyen-anh-khoa.webp',
  '/images/thanh-vien/nguyen-chi-trung.webp',
  '/images/thanh-vien/nguyen-ngoc-khoa.webp',
  '/images/thanh-vien/nguyen-nhu-huy.webp',
  '/images/thanh-vien/tran-binh-trong.webp',
  '/images/thanh-vien/trinh-hien-lan.webp',
]);

/**
 * Kiểm tra ảnh có thuộc danh mục ảnh đã duyệt chính xác của dự án không.
 * Từ chối dứt khoát path traversal (..), query string, backslash hoặc ảnh chưa duyệt.
 * @param {string} src
 * @returns {boolean}
 */
export function isApprovedImageSrc(src) {
  if (!src || typeof src !== 'string') return false;
  // Từ chối path traversal, query string, fragment hoặc backslash
  if (src.includes('..') || src.includes('\\') || src.includes('?') || src.includes('#')) {
    return false;
  }
  return EXACT_APPROVED_IMAGE_PATHS.has(src.trim());
}

/**
 * Kiểm tra tính an toàn của chuỗi văn bản (không chứa script, onfocus, svg xss hoặc từ khóa kỹ thuật nội bộ).
 * @param {string} str
 * @returns {boolean}
 */
export function isSafeText(str) {
  if (typeof str !== 'string') return false;
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onfocus\s*=/gi,
    /<iframe/gi,
    /<svg/gi,
  ];
  if (dangerousPatterns.some((pattern) => pattern.test(str))) return false;

  // Không đưa từ khóa kỹ thuật nội bộ vào văn bản người đọc
  if (/\bPLAY_FLOW\b/i.test(str) || /\bSAFETY_PRACTICES\b/i.test(str)) {
    return false;
  }
  return true;
}

/**
 * Làm sạch và chuẩn hóa một bài viết nhật ký, loại bỏ mọi trường lạ hoặc nguy hiểm.
 * @param {object} entry
 * @returns {object}
 */
export function sanitizeJournalEntry(entry) {
  if (!entry || typeof entry !== 'object') return {};

  const clean = {
    slug: String(entry.slug || '').trim(),
    title: String(entry.title || '').trim(),
    summary: String(entry.summary || '').trim(),
    category: String(entry.category || '').trim(),
    categoryLabel: CATEGORY_LABELS[entry.category] || entry.categoryLabel || 'Kế hoạch',
    publishedAt: String(entry.publishedAt || '').trim(),
    eventDate: entry.eventDate ? String(entry.eventDate).trim() : null,
    eventStatus: entry.eventStatus || null,
    status: entry.status === 'draft' ? 'draft' : 'published',
  };

  if (entry.coverImage && typeof entry.coverImage === 'object') {
    clean.coverImage = {
      src: String(entry.coverImage.src || '').trim(),
      alt: String(entry.coverImage.alt || '').trim(),
      caption: String(entry.coverImage.caption || '').trim(),
    };
    if (entry.coverImage.creditName) clean.coverImage.creditName = String(entry.coverImage.creditName).trim();
    if (entry.coverImage.creditSource) clean.coverImage.creditSource = String(entry.coverImage.creditSource).trim();
    if (entry.coverImage.creditUrl) clean.coverImage.creditUrl = String(entry.coverImage.creditUrl).trim();
  }

  if (Array.isArray(entry.content)) {
    clean.content = entry.content.map((block) => {
      if (!block || typeof block !== 'object') return null;
      switch (block.type) {
        case 'paragraph':
        case 'callout':
        case 'quote':
          return { type: block.type, text: String(block.text || '').trim() };
        case 'heading':
          return { type: 'heading', level: Number(block.level) === 3 ? 3 : 2, text: String(block.text || '').trim() };
        case 'list':
          return {
            type: 'list',
            items: Array.isArray(block.items) ? block.items.map((it) => String(it || '').trim()).filter(Boolean) : [],
          };
        case 'image':
          const cleanImg = {
            type: 'image',
            src: String(block.src || '').trim(),
            alt: String(block.alt || '').trim(),
            caption: String(block.caption || '').trim(),
          };
          if (block.creditName) cleanImg.creditName = String(block.creditName).trim();
          if (block.creditSource) cleanImg.creditSource = String(block.creditSource).trim();
          if (block.creditUrl) cleanImg.creditUrl = String(block.creditUrl).trim();
          return cleanImg;
        default:
          return null;
      }
    }).filter(Boolean);
  } else {
    clean.content = [];
  }

  return clean;
}

/**
 * Xác thực một bài viết nhật ký đơn lẻ.
 * @param {object} entry
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateJournalEntry(entry) {
  const errors = [];

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return { isValid: false, errors: ['Bài viết phải là một đối tượng JSON.'] };
  }

  // 1. Slug
  if (!entry.slug || typeof entry.slug !== 'string') {
    errors.push('Thiếu trường slug.');
  } else if (!SLUG_REGEX.test(entry.slug)) {
    errors.push(`Slug '${entry.slug}' không hợp lệ (phải dùng chữ thường, số và dấu gạch nối kebab-case).`);
  }

  // 2. Title & Summary
  if (!entry.title || typeof entry.title !== 'string' || !entry.title.trim()) {
    errors.push('Tiêu đề (title) không được để trống.');
  } else if (!isSafeText(entry.title)) {
    errors.push('Tiêu đề chứa ký tự nguy hiểm hoặc từ khóa kỹ thuật nội bộ (PLAY_FLOW/SAFETY_PRACTICES).');
  }

  if (!entry.summary || typeof entry.summary !== 'string' || !entry.summary.trim()) {
    errors.push('Tóm tắt (summary) không được để trống.');
  } else if (!isSafeText(entry.summary)) {
    errors.push('Tóm tắt chứa ký tự nguy hiểm hoặc từ khóa kỹ thuật nội bộ (PLAY_FLOW/SAFETY_PRACTICES).');
  }

  // 3. Category
  if (!entry.category || !ALLOWED_CATEGORIES.has(entry.category)) {
    errors.push(`Danh mục '${entry.category}' không hợp lệ. Cho phép: ${Array.from(ALLOWED_CATEGORIES).join(', ')}.`);
  }

  // 4. PublishedAt (kiểm tra ngày theo lịch thực)
  if (!entry.publishedAt || !isValidIsoDate(entry.publishedAt)) {
    errors.push(`Ngày công bố '${entry.publishedAt}' không hợp lệ hoặc không tồn tại theo lịch thực (cần YYYY-MM-DD).`);
  }

  // 5. EventDate (optional)
  if (entry.eventDate !== null && entry.eventDate !== undefined && entry.eventDate !== '') {
    if (!isValidIsoDate(entry.eventDate)) {
      errors.push(`Ngày sự kiện '${entry.eventDate}' không hợp lệ hoặc không tồn tại theo lịch thực (cần YYYY-MM-DD).`);
    }
  }

  // 6. EventStatus (optional)
  if (entry.eventStatus !== null && entry.eventStatus !== undefined && entry.eventStatus !== '') {
    if (!ALLOWED_EVENT_STATUSES.has(entry.eventStatus)) {
      errors.push(`Trạng thái sự kiện '${entry.eventStatus}' không hợp lệ. Cho phép: planned, in_progress, completed, cancelled.`);
    }
  }

  // 7. Status
  if (entry.status !== 'draft' && entry.status !== 'published') {
    errors.push(`Trạng thái '${entry.status}' không hợp lệ (phải là 'draft' hoặc 'published').`);
  }

  // 8. CoverImage (optional)
  if (entry.coverImage) {
    if (!entry.coverImage.src || typeof entry.coverImage.src !== 'string') {
      errors.push('Ảnh bìa thiếu đường dẫn src.');
    } else if (!isApprovedImageSrc(entry.coverImage.src)) {
      errors.push(`Ảnh bìa '${entry.coverImage.src}' không nằm trong danh mục ảnh đã duyệt của dự án.`);
    }

    if (!entry.coverImage.alt || typeof entry.coverImage.alt !== 'string' || !entry.coverImage.alt.trim()) {
      errors.push('Ảnh bìa thiếu mô tả alt cho khả năng tiếp cận.');
    }

    if (!entry.coverImage.caption || typeof entry.coverImage.caption !== 'string' || !entry.coverImage.caption.trim()) {
      errors.push('Ảnh bìa bắt buộc phải có chú thích caption rõ ràng.');
    }

    if (entry.coverImage.creditUrl && !isValidCreditUrl(entry.coverImage.creditUrl)) {
      errors.push(`URL nguồn ảnh bìa '${entry.coverImage.creditUrl}' không hợp lệ (cần giao thức http/https).`);
    }
  }

  // 9. Content blocks
  if (!Array.isArray(entry.content) || entry.content.length === 0) {
    errors.push('Nội dung (content) phải là một mảng các khối không rỗng.');
  } else {
    entry.content.forEach((block, idx) => {
      const blockNum = idx + 1;
      if (!block || typeof block !== 'object') {
        errors.push(`Khối nội dung [${blockNum}] không hợp lệ.`);
        return;
      }
      switch (block.type) {
        case 'paragraph':
        case 'callout':
          if (!block.text || !isSafeText(block.text)) {
            errors.push(`Khối [${blockNum} - ${block.type}] thiếu văn bản hoặc chứa mã/từ khóa kỹ thuật không an toàn.`);
          }
          break;
        case 'heading':
          if (![2, 3].includes(block.level)) {
            errors.push(`Khối [${blockNum} - heading] có level ${block.level} không hợp lệ (cần 2 hoặc 3).`);
          }
          if (!block.text || !isSafeText(block.text)) {
            errors.push(`Khối [${blockNum} - heading] thiếu văn bản hoặc chứa mã không an toàn.`);
          }
          break;
        case 'quote':
          if (!block.text || !isSafeText(block.text)) {
            errors.push(`Khối [${blockNum} - quote] thiếu văn bản hoặc chứa mã không an toàn.`);
          }
          break;
        case 'list':
          if (!Array.isArray(block.items) || block.items.length === 0) {
            errors.push(`Khối [${blockNum} - list] phải có ít nhất một mục.`);
          } else {
            block.items.forEach((item, itemIdx) => {
              if (typeof item !== 'string' || !isSafeText(item)) {
                errors.push(`Mục [${itemIdx + 1}] trong danh sách khối [${blockNum}] không an toàn.`);
              }
            });
          }
          break;
        case 'image':
          if (!block.src || !isApprovedImageSrc(block.src)) {
            errors.push(`Khối [${blockNum} - image] có src '${block.src}' không nằm trong danh mục ảnh đã duyệt.`);
          }
          if (!block.alt || typeof block.alt !== 'string' || !block.alt.trim()) {
            errors.push(`Khối [${blockNum} - image] thiếu alt tiếp cận.`);
          }
          if (!block.caption || typeof block.caption !== 'string' || !block.caption.trim()) {
            errors.push(`Khối [${blockNum} - image] bắt buộc phải có chú thích caption.`);
          }
          if (block.creditUrl && !isValidCreditUrl(block.creditUrl)) {
            errors.push(`Khối [${blockNum} - image] có URL credit không hợp lệ.`);
          }
          break;
        default:
          errors.push(`Khối [${blockNum}] có type '${block.type}' không được hỗ trợ.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Xác thực danh sách nhiều bài viết nhật ký.
 * @param {object[]} entries
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateJournalEntriesList(entries) {
  if (!Array.isArray(entries)) {
    return { isValid: false, errors: ['Dữ liệu bài viết phải là một mảng JSON.'] };
  }

  const allErrors = [];
  const seenSlugs = new Set();

  entries.forEach((entry, idx) => {
    const entryNum = idx + 1;
    if (entry && entry.slug) {
      if (seenSlugs.has(entry.slug)) {
        allErrors.push(`Bài viết [${entryNum}]: Slug '${entry.slug}' bị trùng lặp.`);
      } else {
        seenSlugs.add(entry.slug);
      }
    }

    const result = validateJournalEntry(entry);
    if (!result.isValid) {
      result.errors.forEach((err) => {
        allErrors.push(`Bài viết [${entryNum} - ${entry.slug || 'chưa có slug'}]: ${err}`);
      });
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

