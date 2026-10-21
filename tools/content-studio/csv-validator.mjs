/**
 * Module kiểm tra và xử lý tệp CSV đối soát sao kê ủng hộ (Task C14).
 * Tuân thủ RFC 4180 và các yêu cầu thẩm định tài chính nghiêm ngặt:
 * - Xử lý UTF-8 BOM, kiểm tra đóng mở ngoặc kép hợp lệ (từ chối unclosed quotes).
 * - Bắt buộc số lượng cột ở mọi dòng phải khớp chính xác với dòng tiêu đề.
 * - Từ chối các cột tiêu đề trùng lặp.
 * - Kiểm tra chặt chẽ cú pháp số tiền (chỉ chấp nhận số nguyên dương hoặc nhóm phân cách hàng nghìn 3 chữ số; từ chối số thực 50.50, số mũ 5e4).
 * - Kiểm tra mốc ngày đối soát và ẩn danh hóa an toàn cho người ủng hộ.
 */

/**
 * Phân tích dòng CSV theo chuẩn RFC 4180 nghiêm ngặt.
 * @param {string} text
 * @returns {{ rows: string[][], error: string | null }}
 */
export function parseCSVRFC4180(text) {
  if (typeof text !== 'string') {
    return { rows: [], error: 'Dữ liệu CSV phải là chuỗi ký tự.' };
  }

  // Loại bỏ UTF-8 BOM nếu có
  const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  if (!cleanText.trim()) {
    return { rows: [], error: null };
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let quoteOpenedAtLine = 1;
  let currentLine = 1;
  let fieldHasQuotes = false;

  let i = 0;
  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '\n') {
      currentLine++;
    }

    if (char === '"') {
      if (!insideQuotes) {
        // Mở ngoặc kép: trường này phải bắt đầu bằng ngoặc kép
        if (currentField.length > 0) {
          return {
            rows: [],
            error: `Cú pháp không hợp lệ tại dòng ${currentLine}: Dấu ngoặc kép xuất hiện giữa trường không được trích dẫn.`,
          };
        }
        insideQuotes = true;
        fieldHasQuotes = true;
        quoteOpenedAtLine = currentLine;
        i++;
      } else {
        // Đang trong ngoặc kép
        if (nextChar === '"') {
          // Thoát dấu ngoặc kép RFC 4180: "" -> "
          currentField += '"';
          i += 2;
        } else {
          // Đóng ngoặc kép
          insideQuotes = false;
          i++;
          // Ký tự kế tiếp sau dấu đóng ngoặc kép phải là dấu phẩy, xuống dòng hoặc kết thúc chuỗi
          if (i < cleanText.length && cleanText[i] !== ',' && cleanText[i] !== '\r' && cleanText[i] !== '\n') {
            return {
              rows: [],
              error: `Cú pháp không hợp lệ tại dòng ${currentLine}: Ký tự không hợp lệ sau dấu đóng ngoặc kép.`,
            };
          }
        }
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(fieldHasQuotes ? currentField : currentField.trim());
      currentField = '';
      fieldHasQuotes = false;
      i++;
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(fieldHasQuotes ? currentField : currentField.trim());
      currentField = '';
      fieldHasQuotes = false;
      // Bỏ qua dòng trống hoàn toàn
      if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
    } else {
      currentField += char;
      i++;
    }
  }

  if (insideQuotes) {
    return {
      rows: [],
      error: `Cú pháp không hợp lệ: Dấu ngoặc kép mở tại dòng ${quoteOpenedAtLine} chưa được đóng (unclosed quote).`,
    };
  }

  // Xử lý trường cuối cùng nếu không kết thúc bằng newline
  if (currentField.length > 0 || fieldHasQuotes || currentRow.length > 0) {
    currentRow.push(fieldHasQuotes ? currentField : currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return { rows, error: null };
}

// Giữ lại alias tương thích ngược
export function parseCSV(text) {
  const result = parseCSVRFC4180(text);
  if (result.error) {
    // Nếu có lỗi cú pháp, trả về mảng rỗng để validator báo lỗi chi tiết
    return [];
  }
  return result.rows;
}

/**
 * Kiểm tra ngữ pháp số tiền nguyên dương (VND).
 * Chấp nhận:
 * - Chuỗi chỉ chứa chữ số nguyên: ^\d+$
 * - Chuỗi có phân cách hàng nghìn đúng chuẩn 3 chữ số: ^\d{1,3}(?:[.,]\d{3})+$
 * Từ chối:
 * - Số mũ (5e4, 1e6)
 * - Số thập phân lẻ (50.50, 10.5)
 * - Phân cách hàng nghìn sai quy cách (50.5, 1.2345)
 * - Ký tự chữ hoặc số âm
 * @param {string} rawAmount
 * @returns {{ isValid: boolean, value: number | null }}
 */
export function parseMonetaryAmount(rawAmount) {
  if (!rawAmount || typeof rawAmount !== 'string') {
    return { isValid: false, value: null };
  }

  const clean = rawAmount.trim().replace(/đ$/i, '').trim();

  // Từ chối ký hiệu khoa học (5e4)
  if (/[eE]/.test(clean)) {
    return { isValid: false, value: null };
  }

  // 1. Số nguyên thuần không phân cách: e.g. "50000"
  if (/^\d+$/.test(clean)) {
    const val = parseInt(clean, 10);
    return val > 0 ? { isValid: true, value: val } : { isValid: false, value: null };
  }

  // 2. Định dạng có phân cách hàng nghìn bằng dấu chấm: e.g. "50.000" hoặc "1.500.000"
  if (/^\d{1,3}(?:\.\d{3})+$/.test(clean)) {
    const val = parseInt(clean.replace(/\./g, ''), 10);
    return val > 0 ? { isValid: true, value: val } : { isValid: false, value: null };
  }

  // 3. Định dạng có phân cách hàng nghìn bằng dấu phẩy: e.g. "50,000" hoặc "1,500,000"
  if (/^\d{1,3}(?:,\d{3})+$/.test(clean)) {
    const val = parseInt(clean.replace(/,/g, ''), 10);
    return val > 0 ? { isValid: true, value: val } : { isValid: false, value: null };
  }

  return { isValid: false, value: null };
}

/**
 * Chuẩn hóa tiêu đề cột sang trường dữ liệu chuẩn.
 * @param {string} header
 * @returns {string|null}
 */
function normalizeHeader(header) {
  const h = header.toLowerCase().replace(/[\s_\-]/g, '');
  if (['id', 'magiaodich', 'transactionid', 'ma'].includes(h)) return 'id';
  if (['date', 'ngay', 'ngaygiaodich', 'time'].includes(h)) return 'date';
  if (['amount', 'sotien', 'tien', 'value'].includes(h)) return 'amount';
  if (['donorname', 'ten', 'tennguoiungho', 'nguoiungho', 'donor'].includes(h)) return 'donorName';
  if (['reference', 'noidung', 'noidunggiao dich', 'noidungchuyenkhoan', 'memo'].includes(h)) return 'reference';
  if (['consentpublic', 'dongycongkhai', 'congkhai', 'consent', 'public'].includes(h)) return 'consentPublic';
  if (['notes', 'ghichu', 'note'].includes(h)) return 'notes';
  return null;
}

/**
 * Chuẩn hóa chuỗi ngày YYYY-MM-DD hoặc DD/MM/YYYY thành YYYY-MM-DD.
 * @param {string} rawDate
 * @returns {string|null}
 */
export function normalizeDate(rawDate) {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();

  // Định dạng YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (isValidDateValues(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // Định dạng DD/MM/YYYY
  const viMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (viMatch) {
    const d = parseInt(viMatch[1], 10);
    const m = parseInt(viMatch[2], 10);
    const y = parseInt(viMatch[3], 10);
    if (isValidDateValues(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

function isValidDateValues(year, month, day) {
  if (year < 2020 || year > 2030) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Kiểm tra toàn diện tệp CSV sao kê ủng hộ theo các tiêu chuẩn thẩm định.
 * @param {string} csvText
 * @param {object} [options]
 * @param {string} [options.reconciledAt] Ngày chốt đối soát (YYYY-MM-DD)
 * @param {boolean} [options.requireReconciledDate] Bắt buộc phải có ngày chốt đối soát
 * @returns {object} Kết quả xác thực
 */
export function validateDonationCSV(csvText, options = {}) {
  const { reconciledAt, requireReconciledDate = false } = options;
  const errors = [];
  const warnings = [];
  const rows = [];
  const seenIds = new Set();

  if (!csvText || !csvText.trim()) {
    return {
      isValid: false,
      rows: [],
      errors: [{ row: 0, message: 'Nội dung tệp CSV trống.' }],
      warnings: [],
      stats: { totalRows: 0, validRows: 0, totalAmount: 0, anonymousCount: 0 },
    };
  }

  // 1. Phân tích cú pháp RFC 4180
  const parseResult = parseCSVRFC4180(csvText);
  if (parseResult.error) {
    return {
      isValid: false,
      rows: [],
      errors: [{ row: 1, message: parseResult.error }],
      warnings: [],
      stats: { totalRows: 0, validRows: 0, totalAmount: 0, anonymousCount: 0 },
    };
  }

  const rawRows = parseResult.rows;
  if (rawRows.length < 2) {
    return {
      isValid: false,
      rows: [],
      errors: [{ row: 1, message: 'Tệp CSV cần ít nhất một dòng tiêu đề và một dòng dữ liệu.' }],
      warnings: [],
      stats: { totalRows: 0, validRows: 0, totalAmount: 0, anonymousCount: 0 },
    };
  }

  // 2. Kiểm tra dòng tiêu đề và phát hiện duplicate header
  const headerRow = rawRows[0];
  const fieldMapping = {};
  const seenHeaderFields = new Set();

  for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
    const rawHeaderCol = headerRow[colIdx].trim();
    const field = normalizeHeader(rawHeaderCol);
    if (field) {
      if (seenHeaderFields.has(field)) {
        errors.push({
          row: 1,
          column: rawHeaderCol,
          message: `Cột tiêu đề '${rawHeaderCol}' bị lặp lại hoặc xung đột trường ${field}.`,
        });
      } else {
        seenHeaderFields.add(field);
        fieldMapping[field] = colIdx;
      }
    }
  }

  // Kiểm tra các cột bắt buộc
  if (fieldMapping.id === undefined) {
    errors.push({ row: 1, column: 'id', message: 'Thiếu cột mã giao dịch (id / ma_giao_dich).' });
  }
  if (fieldMapping.date === undefined) {
    errors.push({ row: 1, column: 'date', message: 'Thiếu cột ngày giao dịch (date / ngay).' });
  }
  if (fieldMapping.amount === undefined) {
    errors.push({ row: 1, column: 'amount', message: 'Thiếu cột số tiền (amount / so_tien).' });
  }

  // Kiểm tra yêu cầu ngày đối soát nếu bắt buộc
  if (requireReconciledDate && !reconciledAt) {
    errors.push({
      row: 1,
      message: 'Mốc ngày đối soát (reconciledAt) là bắt buộc khi xuất dữ liệu sao kê chính thức.',
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      rows: [],
      errors,
      warnings,
      stats: { totalRows: rawRows.length - 1, validRows: 0, totalAmount: 0, anonymousCount: 0 },
    };
  }

  const expectedColumnCount = headerRow.length;
  let totalAmount = 0;
  let anonymousCount = 0;

  // 3. Kiểm tra từng dòng dữ liệu
  for (let rowIdx = 1; rowIdx < rawRows.length; rowIdx++) {
    const rawRow = rawRows[rowIdx];
    const rowNum = rowIdx + 1; // 1-indexed

    // Kiểm tra độ rộng dòng (row width)
    if (rawRow.length !== expectedColumnCount) {
      errors.push({
        row: rowNum,
        message: `Số lượng cột ở dòng ${rowNum} (${rawRow.length}) không khớp với tiêu đề (${expectedColumnCount}).`,
      });
      continue;
    }

    const idRaw = (rawRow[fieldMapping.id] || '').trim();
    const dateRaw = (rawRow[fieldMapping.date] || '').trim();
    const amountRaw = (rawRow[fieldMapping.amount] || '').trim();
    const donorNameRaw = fieldMapping.donorName !== undefined ? (rawRow[fieldMapping.donorName] || '').trim() : '';
    const referenceRaw = fieldMapping.reference !== undefined ? (rawRow[fieldMapping.reference] || '').trim() : '';
    const consentRaw = fieldMapping.consentPublic !== undefined ? (rawRow[fieldMapping.consentPublic] || '').trim() : '';
    const notesRaw = fieldMapping.notes !== undefined ? (rawRow[fieldMapping.notes] || '').trim() : '';

    // Kiểm tra ID giao dịch
    if (!idRaw) {
      errors.push({ row: rowNum, column: 'id', message: 'Mã giao dịch không được để trống.' });
    } else {
      const lowerId = idRaw.toLowerCase();
      if (seenIds.has(lowerId)) {
        errors.push({ row: rowNum, column: 'id', message: `Mã giao dịch '${idRaw}' bị trùng lặp.` });
      } else {
        seenIds.add(lowerId);
      }
    }

    // Từ chối dữ liệu mẫu/placeholder trong bản đối soát (Task C14 early-review-11)
    if (
      idRaw.toUpperCase().includes('SAMPLE') ||
      donorNameRaw.includes('[DỮ LIỆU MẪU') ||
      donorNameRaw.includes('[MẪU') ||
      notesRaw.includes('[BẢN MẪU') ||
      notesRaw.includes('[MẪU')
    ) {
      errors.push({
        row: rowNum,
        column: 'id',
        message: `Dòng ${rowNum} chứa dữ liệu mẫu định dạng ('${idRaw}'). Không được áp dụng dữ liệu mẫu vào sổ đối soát thực tế. Vui lòng nhập dữ liệu sao kê ngân hàng thật.`,
      });
    }

    // Kiểm tra ngày giao dịch
    const parsedDate = normalizeDate(dateRaw);
    if (!parsedDate) {
      errors.push({
        row: rowNum,
        column: 'date',
        message: `Ngày '${dateRaw}' không hợp lệ (cần YYYY-MM-DD hoặc DD/MM/YYYY).`,
      });
    } else if (reconciledAt && parsedDate > reconciledAt) {
      errors.push({
        row: rowNum,
        column: 'date',
        message: `Ngày giao dịch (${parsedDate}) sau ngày đối soát (${reconciledAt}).`,
      });
    }

    // Kiểm tra số tiền bằng ngữ pháp tiền tệ nghiêm ngặt
    const parsedAmount = parseMonetaryAmount(amountRaw);
    if (!parsedAmount.isValid || parsedAmount.value === null) {
      errors.push({
        row: rowNum,
        column: 'amount',
        message: `Số tiền '${amountRaw}' không hợp lệ. Phải là số nguyên dương (e.g. 50000 hoặc 50.000). Không chấp nhận số thực lẻ, số mũ hoặc số âm.`,
      });
    }

    // Kiểm tra quyền công khai / Ẩn danh
    const consentLower = consentRaw.toLowerCase();
    const isConsentGiven = ['1', 'true', 'yes', 'có', 'co', 'dongy', 'đồng ý'].includes(consentLower);
    let finalDonorName = donorNameRaw;
    let isAnonymous = false;

    if (!donorNameRaw || !isConsentGiven || ['ẩn danh', 'an danh', 'anonymous'].includes(donorNameRaw.toLowerCase())) {
      finalDonorName = 'Ẩn danh';
      isAnonymous = true;
      anonymousCount++;
    }

    if (errors.filter((e) => e.row === rowNum).length === 0 && parsedAmount.value !== null && parsedDate) {
      totalAmount += parsedAmount.value;
      rows.push({
        id: idRaw,
        date: parsedDate,
        amount: parsedAmount.value,
        donorName: finalDonorName,
        isAnonymous,
        reference: referenceRaw,
        notes: notesRaw,
      });
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    rows: isValid ? rows : [],
    errors,
    warnings,
    stats: {
      totalRows: rawRows.length - 1,
      validRows: rows.length,
      totalAmount: isValid ? totalAmount : 0,
      anonymousCount: isValid ? anonymousCount : 0,
    },
  };
}

/**
 * Kiểm tra chuỗi ngày ISO YYYY-MM-DD hợp lệ theo lịch chuẩn.
 * @param {any} value
 * @returns {boolean}
 */
export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Chuẩn hóa và làm sạch một dòng giao dịch sao kê công khai (Task C14).
 * - Loại bỏ toàn bộ trường thô không thuộc allowlist.
 * - Không đưa mã tham chiếu riêng tư vào bản chiếu công khai.
 * @param {any} entry
 * @returns {{ date: string, amount: number, donor: string } | null}
 */
export function sanitizeDonationEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const rawDonor = typeof entry.donor === 'string' ? entry.donor.trim() : '';
  const isAnonymous = !rawDonor || ['ẩn danh', 'an danh', 'anonymous'].includes(rawDonor.toLowerCase());
  return {
    date: entry.date,
    amount: entry.amount,
    donor: isAnonymous ? 'Ẩn danh' : rawDonor,
  };
}

/**
 * Xác thực cấu trúc bản chiếu sổ ủng hộ JSON (reconciled-donations.json).
 * Từ chối bản chiếu chưa được phê duyệt công khai (publicApproval != approved) khi reconciled là true.
 * Từ chối bản chiếu có giao dịch khi reconciled là false.
 * @param {any} payload
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateDonationProjection(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['Bản chiếu sao kê phải là một đối tượng JSON.'] };
  }
  if (typeof payload.reconciled !== 'boolean') {
    errors.push('Thuộc tính reconciled phải là boolean.');
  }
  if (payload.reconciled) {
    if (!payload.reconciledAt || typeof payload.reconciledAt !== 'string' || !isValidIsoDate(payload.reconciledAt)) {
      errors.push('reconciledAt phải là ngày hợp lệ định dạng YYYY-MM-DD khi reconciled là true.');
    }
    if (payload.publicApproval !== 'approved') {
      errors.push('publicApproval phải là "approved" khi reconciled là true.');
    }
    if (!Array.isArray(payload.reconciledBy) || payload.reconciledBy.length === 0) {
      errors.push('reconciledBy phải là mảng chứa vai trò/người đối soát.');
    }
  } else {
    if (payload.reconciledAt !== null && payload.reconciledAt !== undefined) {
      errors.push('reconciledAt phải là null khi reconciled là false.');
    }
    if (payload.publicApproval !== undefined && payload.publicApproval !== 'pending') {
      errors.push('publicApproval phải là "pending" khi reconciled là false.');
    }
    if (Array.isArray(payload.entries) && payload.entries.length > 0) {
      errors.push('entries phải là mảng rỗng khi reconciled là false.');
    }
  }
  if (!Array.isArray(payload.entries)) {
    errors.push('entries phải là một mảng danh sách giao dịch.');
  } else {
    payload.entries.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') {
        errors.push(`Giao dịch [${idx + 1}] không hợp lệ.`);
        return;
      }
      if (!entry.date || typeof entry.date !== 'string' || !isValidIsoDate(entry.date)) {
        errors.push(`Giao dịch [${idx + 1}]: Ngày giao dịch '${entry.date}' không hợp lệ (cần YYYY-MM-DD).`);
      } else if (payload.reconciled && payload.reconciledAt && entry.date > payload.reconciledAt) {
        errors.push(`Giao dịch [${idx + 1}]: Ngày giao dịch '${entry.date}' sau ngày chốt đối soát '${payload.reconciledAt}'.`);
      }
      if (typeof entry.amount !== 'number' || !Number.isInteger(entry.amount) || entry.amount <= 0) {
        errors.push(`Giao dịch [${idx + 1}]: Số tiền '${entry.amount}' phải là số nguyên dương.`);
      }
      if (!entry.donor || typeof entry.donor !== 'string') {
        errors.push(`Giao dịch [${idx + 1}]: Tên người ủng hộ không được để trống.`);
      }
      if (entry.reference !== null && typeof entry.reference !== 'string') {
        errors.push(`Giao dịch [${idx + 1}]: Mã tham chiếu phải là chuỗi hoặc null.`);
      }
    });
  }
  return { isValid: errors.length === 0, errors };
}
