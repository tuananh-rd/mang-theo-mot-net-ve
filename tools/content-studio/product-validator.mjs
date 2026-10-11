/**
 * Module xác thực cấu hình mở bán sản phẩm (Task C14).
 * Kiểm tra tính hợp lệ của product-sales-config.json dùng chung cho CLI, Server và Renderer.
 */

export const ALLOWED_PRODUCT_IDS = new Set(['chuon-chuon-tre-kem-de', 'moc-khoa']);
export const ALLOWED_SALE_STATUSES = new Set(['unconfirmed', 'open', 'closed']);
export const ALLOWED_PUBLIC_APPROVALS = new Set(['pending', 'approved']);

/**
 * Kiểm tra toàn diện đối tượng cấu hình mở bán sản phẩm.
 * @param {object} config
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateProductSalesConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { isValid: false, errors: ['Cấu hình sản phẩm phải là một đối tượng JSON.'] };
  }

  // Chống prototype pollution
  if (['__proto__', 'constructor', 'prototype'].some((k) => Object.prototype.hasOwnProperty.call(config, k))) {
    errors.push('Phát hiện prototype pollution keys không hợp lệ.');
  }

  const keys = Object.keys(config);

  // Bắt buộc chỉ đúng 2 sản phẩm thủ công hợp lệ
  for (const key of keys) {
    if (!ALLOWED_PRODUCT_IDS.has(key)) {
      errors.push(`Mã sản phẩm lạ '${key}' không được phép. Chỉ cho phép: ${Array.from(ALLOWED_PRODUCT_IDS).join(', ')}.`);
    }
  }

  for (const expectedId of ALLOWED_PRODUCT_IDS) {
    if (!Object.prototype.hasOwnProperty.call(config, expectedId)) {
      errors.push(`Thiếu cấu hình cho sản phẩm bắt buộc '${expectedId}'.`);
      continue;
    }

    const item = config[expectedId];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`Cấu hình của sản phẩm '${expectedId}' phải là một đối tượng.`);
      continue;
    }

    // Kiểm tra các trường thừa ngoài schema
    const allowedFields = new Set(['saleStatus', 'officialPrice', 'stockAvailable', 'salesChannel', 'returnPolicy', 'publicApproval']);
    for (const field of Object.keys(item)) {
      if (!allowedFields.has(field)) {
        errors.push(`Sản phẩm '${expectedId}' chứa trường không xác định '${field}'.`);
      }
    }

    // 1. saleStatus
    if (!ALLOWED_SALE_STATUSES.has(item.saleStatus)) {
      errors.push(`Trạng thái mở bán '${item.saleStatus}' của '${expectedId}' không hợp lệ (cho phép: unconfirmed, open, closed).`);
    }

    // 2. publicApproval
    if (!ALLOWED_PUBLIC_APPROVALS.has(item.publicApproval)) {
      errors.push(`Phê duyệt công khai '${item.publicApproval}' của '${expectedId}' không hợp lệ (cho phép: pending, approved).`);
    }

    // 3. officialPrice
    if (item.officialPrice !== null && item.officialPrice !== undefined) {
      if (typeof item.officialPrice !== 'number' || !Number.isInteger(item.officialPrice) || item.officialPrice <= 0) {
        errors.push(`Giá niêm yết của '${expectedId}' phải là số nguyên dương (> 0). Nhận được: ${item.officialPrice}`);
      }
    }

    // 4. stockAvailable
    if (item.stockAvailable !== null && item.stockAvailable !== undefined) {
      if (typeof item.stockAvailable !== 'number' || !Number.isInteger(item.stockAvailable) || item.stockAvailable < 0) {
        errors.push(`Số lượng sẵn có (stock) của '${expectedId}' phải là số nguyên không âm (>= 0). Nhận được: ${item.stockAvailable}`);
      }
    }

    // 5. salesChannel
    if (item.salesChannel !== null && item.salesChannel !== undefined) {
      if (typeof item.salesChannel !== 'string') {
        errors.push(`Kênh giao nhận của '${expectedId}' phải là chuỗi ký tự.`);
      }
    }

    // 6. returnPolicy
    if (item.returnPolicy !== null && item.returnPolicy !== undefined) {
      if (typeof item.returnPolicy !== 'string') {
        errors.push(`Chính sách đổi trả của '${expectedId}' phải là chuỗi ký tự hoặc null.`);
      }
    }

    // Điều kiện nghiêm ngặt khi MỞ BÁN (saleStatus === 'open')
    if (item.saleStatus === 'open') {
      if (typeof item.officialPrice !== 'number' || !Number.isInteger(item.officialPrice) || item.officialPrice <= 0) {
        errors.push(`Khi mở bán ('open'), sản phẩm '${expectedId}' bắt buộc phải có giá niêm yết chính thức nguyên dương.`);
      }
      if (item.publicApproval !== 'approved') {
        errors.push(`Khi mở bán ('open'), sản phẩm '${expectedId}' bắt buộc phải được phê duyệt công khai ('approved').`);
      }
      if (!item.returnPolicy || typeof item.returnPolicy !== 'string' || !item.returnPolicy.trim()) {
        errors.push(`Khi mở bán ('open'), sản phẩm '${expectedId}' bắt buộc phải có chính sách đổi/trả/hủy rõ ràng.`);
      }
      if (!item.salesChannel || typeof item.salesChannel !== 'string' || !item.salesChannel.trim()) {
        errors.push(`Khi mở bán ('open'), sản phẩm '${expectedId}' bắt buộc phải có kênh/địa điểm giao nhận.`);
      }
      if (typeof item.stockAvailable !== 'number' || !Number.isInteger(item.stockAvailable) || item.stockAvailable < 0) {
        errors.push(`Khi mở bán ('open'), sản phẩm '${expectedId}' bắt buộc phải có số lượng sẵn có (stock >= 0).`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Làm sạch đối tượng cấu hình mở bán sản phẩm theo đúng schema.
 * @param {object} config
 * @returns {object}
 */
export function sanitizeProductSalesConfig(config) {
  const result = {};
  for (const id of ALLOWED_PRODUCT_IDS) {
    const raw = config?.[id] || {};
    result[id] = {
      saleStatus: ALLOWED_SALE_STATUSES.has(raw.saleStatus) ? raw.saleStatus : 'unconfirmed',
      officialPrice: typeof raw.officialPrice === 'number' && Number.isInteger(raw.officialPrice) && raw.officialPrice > 0 ? raw.officialPrice : null,
      stockAvailable: typeof raw.stockAvailable === 'number' && Number.isInteger(raw.stockAvailable) && raw.stockAvailable >= 0 ? raw.stockAvailable : null,
      salesChannel: String(raw.salesChannel || '').trim() || 'FPT Hòa Lạc',
      returnPolicy: raw.returnPolicy ? String(raw.returnPolicy).trim() : null,
      publicApproval: ALLOWED_PUBLIC_APPROVALS.has(raw.publicApproval) ? raw.publicApproval : 'pending',
    };
  }
  return result;
}
