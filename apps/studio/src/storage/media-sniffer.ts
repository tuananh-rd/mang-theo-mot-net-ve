/**
 * Bộ kiểm tra an toàn tệp tải lên (Media Sniffer) - Task C17
 * Xác thực Magic Bytes thực tế, từ chối định dạng độc hại (SVG, Script, HTML),
 * kiểm soát kích thước tối đa 5MB và kiểm tra liên kết tham chiếu trước khi xóa.
 */

export interface SniffResult {
  valid: boolean;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | null;
  extension: 'jpg' | 'png' | 'webp' | 'avif' | null;
  error?: string;
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Kiểm tra mảng byte đầu tiên của tệp để xác định định dạng ảnh thực tế
 */
export function sniffImageFormat(buffer: Uint8Array): SniffResult {
  if (buffer.length < 12) {
    return { valid: false, contentType: null, extension: null, error: 'Tệp quá nhỏ hoặc rỗng.' };
  }

  // 1. Kiểm tra JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, contentType: 'image/jpeg', extension: 'jpg' };
  }

  // 2. Kiểm tra PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, contentType: 'image/png', extension: 'png' };
  }

  // 3. Kiểm tra WebP: RIFF (bytes 0-3) và WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, contentType: 'image/webp', extension: 'webp' };
  }

  // 4. Kiểm tra AVIF: ....ftypavif hoặc ....ftypavis
  if (buffer.length >= 16) {
    const boxType = String.fromCharCode(...buffer.slice(4, 12));
    if (boxType.startsWith('ftypavi') || boxType.startsWith('ftypMA1B')) {
      return { valid: true, contentType: 'image/avif', extension: 'avif' };
    }
  }

  // 5. Kiểm tra và từ chối các định dạng độc hại dạng văn bản / script (SVG, HTML, XML, JS)
  const headerText = new TextDecoder('utf-8', { fatal: false })
    .decode(buffer.slice(0, 512))
    .toLowerCase();

  if (
    headerText.includes('<svg') ||
    headerText.includes('<?xml') ||
    headerText.includes('<html') ||
    headerText.includes('<script') ||
    headerText.includes('xmlns="http://www.w3.org/2000/svg"')
  ) {
    return {
      valid: false,
      contentType: null,
      extension: null,
      error: 'Từ chối định dạng SVG hoặc tệp chứa mã thực thi/HTML/script vì lý do an toàn bảo mật.',
    };
  }

  return {
    valid: false,
    contentType: null,
    extension: null,
    error: 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận định dạng ảnh raster: JPEG, PNG, WebP, AVIF.',
  };
}

/**
 * Kiểm tra xem tệp ảnh có đang được phân hệ nào sử dụng hay không
 */
export function checkAssetUsageInDrafts(
  assetIdentifier: string,
  drafts: Record<string, unknown>
): { inUse: boolean; usedIn: string[] } {
  const usedIn: string[] = [];
  const searchNeedle = assetIdentifier.toLowerCase();

  for (const [moduleKey, draftData] of Object.entries(drafts)) {
    if (!draftData) continue;
    const jsonString = JSON.stringify(draftData).toLowerCase();
    if (jsonString.includes(searchNeedle)) {
      usedIn.push(moduleKey);
    }
  }

  return {
    inUse: usedIn.length > 0,
    usedIn,
  };
}
