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
    const firstChunkLen = (buffer[8] << 24) | (buffer[9] << 16) | (buffer[10] << 8) | buffer[11];
    if (firstChunkLen !== 13) {
      return { valid: false, contentType: null, extension: null, error: 'Tệp PNG không hợp lệ (chunk IHDR đầu tiên bắt buộc phải có độ dài 13 bytes).' };
    }
    if (buffer.length >= 16) {
      const ihdrChunkType = String.fromCharCode(...buffer.slice(12, 16));
      if (ihdrChunkType !== 'IHDR') {
        return { valid: false, contentType: null, extension: null, error: 'Tệp PNG không hợp lệ (chunk đầu tiên bắt buộc phải là IHDR).' };
      }
    }
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

/**
 * Làm sạch và loại bỏ siêu dữ liệu cá nhân (EXIF, GPS, bình luận riêng tư) khỏi tệp ảnh raster
 */
export function stripImageMetadata(buffer: Uint8Array, contentType: string): Uint8Array {
  try {
    if (contentType === 'image/jpeg' && buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      // JPEG EXIF Stripping: Bỏ qua các segment APP1 (0xFF 0xE1) chứa EXIF/GPS
      const chunks: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
      let offset = 2;
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xd9) {
          // EOI (End of Image)
          chunks.push(new Uint8Array([0xff, 0xd9]));
          break;
        }
        if (marker === 0xda) {
          // SOS (Start of Scan) - phần còn lại là luồng dữ liệu nén quét ảnh
          chunks.push(buffer.subarray(offset));
          break;
        }
        if (offset + 4 > buffer.length) break;
        const segLen = (buffer[offset + 2] << 8) | buffer[offset + 3];
        const nextOffset = offset + 2 + segLen;
        if (nextOffset > buffer.length) break;

        // Bỏ qua APP1 (0xFF 0xE1) chứa EXIF metadata
        if (marker !== 0xe1) {
          chunks.push(buffer.subarray(offset, nextOffset));
        }
        offset = nextOffset;
      }
      const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
      const cleaned = new Uint8Array(totalLen);
      let cur = 0;
      for (const c of chunks) {
        cleaned.set(c, cur);
        cur += c.length;
      }
      return cleaned;
    }

    if (contentType === 'image/png' && buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50) {
      // PNG Chunks Stripping: Bỏ qua tEXt, zTXt, iTXt, eXIf
      const sig = buffer.subarray(0, 8);
      const chunks: Uint8Array[] = [sig];
      let offset = 8;
      const strippedTypes = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf']);

      while (offset + 12 <= buffer.length) {
        const length = (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3];
        const typeStr = String.fromCharCode(...buffer.subarray(offset + 4, offset + 8));
        const chunkTotalLen = 4 + 4 + length + 4; // length + type + data + crc
        if (offset + chunkTotalLen > buffer.length) break;

        if (!strippedTypes.has(typeStr)) {
          chunks.push(buffer.subarray(offset, offset + chunkTotalLen));
        }
        offset += chunkTotalLen;
      }
      const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
      const cleaned = new Uint8Array(totalLen);
      let cur = 0;
      for (const c of chunks) {
        cleaned.set(c, cur);
        cur += c.length;
      }
      return cleaned;
    }
  } catch {
    // Nếu có lỗi giải mã định dạng, trả về buffer nguyên bản an toàn
    return buffer;
  }
  return buffer;
}

