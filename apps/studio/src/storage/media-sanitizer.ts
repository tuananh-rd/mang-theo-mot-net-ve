/**
 * Bộ giải mã và làm sạch ảnh raster tương thích Cloudflare Worker (Task C17-R2-F1)
 *
 * Thực hiện:
 * 1. Preflight kiểm tra bounds, chunk structure, CRC32, IDAT/IEND, SOF/EOI trước khi giải mã.
 * 2. Từ chối duplicate IHDR, sai thứ tự chunk, nonzero IEND length, và APNG (acTL/fcTL).
 * 3. Bounded zlib inflate: Giới hạn nghiêm ngặt luồng giải nén scanline IDAT theo đúng ngân sách tính từ IHDR.
 * 4. Strict JPEG decoding với tolerantDecoding: false, kiểm tra SOF và EOI.
 * 5. Chuẩn hóa góc xoay EXIF cho toàn bộ 8 orientations chuẩn (1-8).
 * 6. Bounded raster decode và re-encode sạch sẽ cho PNG và JPEG.
 * 7. Loại bỏ 100% siêu dữ liệu riêng tư (EXIF, GPS, XMP, IPTC, Comments).
 * 8. Tuyệt đối không trả về byte nguyên bản khi giải mã thất bại.
 */

import UPNG from 'upng-js';
import jpeg from 'jpeg-js';
import pako from 'pako';

export interface ProcessedImageResult {
  success: boolean;
  sanitizedBytes?: Uint8Array;
  contentType?: 'image/jpeg' | 'image/png';
  extension?: 'jpg' | 'png';
  width?: number;
  height?: number;
  error?: string;
}

export const MAX_IMAGE_DIMENSION = 2048;
export const MAX_TOTAL_PIXELS = 2048 * 2048;
export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// Bảng CRC32 (IEEE 802.3)
let crcTable: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

function calculateCrc32(buf: Uint8Array, start: number, length: number): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < length; i++) {
    crc = table[(crc ^ buf[start + i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readU32BE(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] << 24) |
      (buf[offset + 1] << 16) |
      (buf[offset + 2] << 8) |
      buf[offset + 3]) >>>
    0
  );
}

function readU16BE(buf: Uint8Array, offset: number): number {
  return (buf[offset] << 8) | buf[offset + 1];
}

/**
 * Tính toán dung lượng giải nén scanline dự kiến (bytes) từ thông số IHDR.
 */
function getExpectedPngScanlineBytes(
  width: number,
  height: number,
  bitDepth: number,
  colorType: number,
  interlaceMethod: number
): number {
  let channels = 1;
  if (colorType === 2) channels = 3;
  else if (colorType === 4) channels = 2;
  else if (colorType === 6) channels = 4;

  if (interlaceMethod === 0) {
    const bytesPerRow = Math.ceil((width * channels * bitDepth) / 8);
    return height * (1 + bytesPerRow);
  }

  // Adam7 passes:
  const startX = [0, 4, 0, 2, 0, 1, 0];
  const startY = [0, 0, 4, 0, 2, 0, 1];
  const stepX = [8, 8, 4, 4, 2, 2, 1];
  const stepY = [8, 8, 8, 4, 4, 2, 2];

  let totalBytes = 0;
  for (let p = 0; p < 7; p++) {
    const pw = width > startX[p] ? Math.floor((width - startX[p] + stepX[p] - 1) / stepX[p]) : 0;
    const ph = height > startY[p] ? Math.floor((height - startY[p] + stepY[p] - 1) / stepY[p]) : 0;
    if (pw > 0 && ph > 0) {
      const bytesPerRow = Math.ceil((pw * channels * bitDepth) / 8);
      totalBytes += ph * (1 + bytesPerRow);
    }
  }
  return totalBytes;
}

/**
 * Giải nén luồng zlib IDAT với giới hạn nghiêm ngặt theo ngân sách scanline.
 */
function decompressAndValidateIdat(
  allIdat: Uint8Array,
  expectedBytes: number
): { valid: boolean; error?: string } {
  let totalDecompressed = 0;

  const inflator = new pako.Inflate();
  inflator.onData = (chunk: Uint8Array) => {
    totalDecompressed += chunk.length;
    if (totalDecompressed > expectedBytes) {
      throw new Error(`Dữ liệu scanline IDAT giải nén vượt quá ngân sách (${totalDecompressed} > ${expectedBytes}).`);
    }
  };

  try {
    inflator.push(allIdat, true);
    if (inflator.err) {
      return {
        valid: false,
        error: inflator.msg || 'Lỗi giải nén zlib IDAT.',
      };
    }
    if (totalDecompressed !== expectedBytes) {
      return {
        valid: false,
        error: `Dữ liệu scanline IDAT giải nén không khớp kích thước dự kiến (${totalDecompressed} != ${expectedBytes}).`,
      };
    }
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Lỗi giải nén zlib IDAT.' };
  }
}

/**
 * Preflight xác thực cấu trúc PNG, kích thước trong IHDR, CRC của các chunk,
 * ngăn chặn duplicate IHDR, kiểm tra IEND length = 0, và chặn IDAT decompressed overflow.
 */
function preflightValidatePng(buffer: Uint8Array): {
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
} {
  // Signature 8 bytes
  if (
    buffer.length < 33 ||
    buffer[0] !== 0x89 ||
    buffer[1] !== 0x50 ||
    buffer[2] !== 0x4e ||
    buffer[3] !== 0x47 ||
    buffer[4] !== 0x0d ||
    buffer[5] !== 0x0a ||
    buffer[6] !== 0x1a ||
    buffer[7] !== 0x0a
  ) {
    return { valid: false, error: 'Chữ ký PNG không hợp lệ hoặc tệp quá nhỏ.' };
  }

  let offset = 8;
  let seenIhdr = false;
  let seenIdat = false;
  let idatEnded = false;
  let seenIend = false;
  let imageWidth = 0;
  let imageHeight = 0;
  let bitDepth = 8;
  let colorType = 6;
  let interlaceMethod = 0;

  const idatChunks: Uint8Array[] = [];
  let totalIdatBytes = 0;

  while (offset + 12 <= buffer.length) {
    const chunkLen = readU32BE(buffer, offset);
    if (offset + 12 + chunkLen > buffer.length) {
      return { valid: false, error: 'Chunk PNG bị cắt cụt.' };
    }

    const chunkType = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    // Kiểm tra CRC của chunk: CRC tính trên (chunkType + chunkData)
    const expectedCrc = readU32BE(buffer, offset + 8 + chunkLen);
    const calculatedCrc = calculateCrc32(buffer, offset + 4, 4 + chunkLen);
    if (expectedCrc !== calculatedCrc) {
      return { valid: false, error: `Chunk PNG [${chunkType}] bị hỏng CRC.` };
    }

    if (!seenIhdr) {
      if (chunkType !== 'IHDR' || chunkLen !== 13) {
        return { valid: false, error: 'Chunk đầu tiên của PNG bắt buộc phải là IHDR (13 bytes).' };
      }
      seenIhdr = true;
      imageWidth = readU32BE(buffer, offset + 8);
      imageHeight = readU32BE(buffer, offset + 12);
      bitDepth = buffer[offset + 16];
      colorType = buffer[offset + 17];
      const compressionMethod = buffer[offset + 18];
      const filterMethod = buffer[offset + 19];
      interlaceMethod = buffer[offset + 20];

      if (imageWidth <= 0 || imageHeight <= 0) {
        return { valid: false, error: 'Kích thước ảnh PNG không hợp lệ (<= 0).' };
      }
      if (imageWidth > MAX_IMAGE_DIMENSION || imageHeight > MAX_IMAGE_DIMENSION) {
        return {
          valid: false,
          error: `Kích thước ảnh PNG (${imageWidth}x${imageHeight}) vượt quá giới hạn tối đa (${MAX_IMAGE_DIMENSION}).`,
        };
      }
      if (imageWidth * imageHeight > MAX_TOTAL_PIXELS) {
        return { valid: false, error: 'Tổng số điểm ảnh PNG vượt quá giới hạn an toàn.' };
      }
      if (compressionMethod !== 0 || filterMethod !== 0 || (interlaceMethod !== 0 && interlaceMethod !== 1)) {
        return { valid: false, error: 'Thông số nén, lọc hoặc interlace trong IHDR không hợp lệ.' };
      }
    } else {
      // Từ chối duplicate IHDR
      if (chunkType === 'IHDR') {
        return { valid: false, error: 'Tệp PNG chứa duplicate IHDR không được phép.' };
      }

      // Từ chối APNG (ảnh động)
      if (chunkType === 'acTL' || chunkType === 'fcTL' || chunkType === 'fdAT') {
        return { valid: false, error: 'Tệp PNG dạng APNG (ảnh động) không được chấp nhận.' };
      }

      if (chunkType === 'IDAT') {
        if (idatEnded) {
          return { valid: false, error: 'Các khối IDAT phải liền kề nhau.' };
        }
        seenIdat = true;
        idatChunks.push(buffer.subarray(offset + 8, offset + 8 + chunkLen));
        totalIdatBytes += chunkLen;
      } else {
        if (seenIdat) {
          idatEnded = true;
        }

        if (chunkType === 'IEND') {
          if (chunkLen !== 0) {
            return { valid: false, error: 'Độ dài chunk IEND bắt buộc phải là 0.' };
          }
          seenIend = true;
          offset += 12 + chunkLen;
          break;
        }
      }
    }

    offset += 12 + chunkLen;
  }

  if (!seenIhdr || !seenIdat || !seenIend) {
    return { valid: false, error: 'Tệp PNG thiếu chunk IHDR, IDAT hoặc IEND.' };
  }

  // Không cho phép trailing dữ liệu thừa sau IEND
  if (offset !== buffer.length) {
    return { valid: false, error: 'Tệp PNG chứa dữ liệu thừa sau chunk IEND.' };
  }

  // Bounded scanline decompressed validation
  const expectedScanlineBytes = getExpectedPngScanlineBytes(
    imageWidth,
    imageHeight,
    bitDepth,
    colorType,
    interlaceMethod
  );

  const combinedIdat = new Uint8Array(totalIdatBytes);
  let pos = 0;
  for (const c of idatChunks) {
    combinedIdat.set(c, pos);
    pos += c.length;
  }

  const idatValidation = decompressAndValidateIdat(combinedIdat, expectedScanlineBytes);
  if (!idatValidation.valid) {
    return { valid: false, error: idatValidation.error };
  }

  return { valid: true, width: imageWidth, height: imageHeight };
}

/**
 * Preflight xác thực JPEG: kiểm tra SOI, SOF kích thước, EOI ở cuối tệp.
 */
function preflightValidateJpeg(buffer: Uint8Array): {
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
} {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return { valid: false, error: 'Chữ ký JPEG không hợp lệ.' };
  }

  // Bắt buộc kết thúc bằng EOI (FF D9)
  if (
    buffer.length < 2 ||
    buffer[buffer.length - 2] !== 0xff ||
    buffer[buffer.length - 1] !== 0xd9
  ) {
    return { valid: false, error: 'Tệp JPEG bị cắt cụt (thiếu marker EOI FF D9).' };
  }

  let offset = 2;
  let foundSof = false;
  let imageWidth = 0;
  let imageHeight = 0;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) break;
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset++;
    }
    if (offset >= buffer.length) break;

    const marker = buffer[offset];
    offset++;

    if (marker === 0xd9) {
      break;
    }
    if (marker === 0xda) {
      break;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      continue;
    }

    if (offset + 2 > buffer.length) break;
    const length = readU16BE(buffer, offset);
    if (length < 2 || offset + length > buffer.length) {
      return { valid: false, error: 'Marker JPEG có độ dài không hợp lệ hoặc bị cắt cụt.' };
    }

    // SOF0, SOF1, SOF2
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      if (length >= 7) {
        imageHeight = readU16BE(buffer, offset + 3);
        imageWidth = readU16BE(buffer, offset + 5);
        foundSof = true;

        if (imageWidth <= 0 || imageHeight <= 0) {
          return { valid: false, error: 'Kích thước ảnh JPEG không hợp lệ (<= 0).' };
        }
        if (imageWidth > MAX_IMAGE_DIMENSION || imageHeight > MAX_IMAGE_DIMENSION) {
          return {
            valid: false,
            error: `Kích thước ảnh JPEG (${imageWidth}x${imageHeight}) vượt quá giới hạn tối đa (${MAX_IMAGE_DIMENSION}).`,
          };
        }
        if (imageWidth * imageHeight > MAX_TOTAL_PIXELS) {
          return { valid: false, error: 'Tổng số điểm ảnh JPEG vượt quá giới hạn an toàn.' };
        }
      }
    }

    offset += length;
  }

  if (!foundSof) {
    return { valid: false, error: 'Không tìm thấy marker SOF hợp lệ trong tệp JPEG.' };
  }

  return { valid: true, width: imageWidth, height: imageHeight };
}

/**
 * Trích xuất orientation từ EXIF trong JPEG (1 đến 8, mặc định 1).
 * Giới hạn chặt chẽ trong phạm vi segment APP1 để không vượt bounds.
 */
export function getJpegExifOrientation(buffer: Uint8Array): number {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return 1;
  }
  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI hoặc SOS
    const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
    const app1End = offset + 2 + length;
    if (app1End > buffer.length) break;

    if (marker === 0xe1 && length >= 14) {
      const exifHeader = String.fromCharCode(...buffer.slice(offset + 4, offset + 10));
      if (exifHeader === 'Exif\0\0') {
        const tiffOffset = offset + 10;
        if (tiffOffset + 8 <= app1End) {
          const isLittleEndian = buffer[tiffOffset] === 0x49 && buffer[tiffOffset + 1] === 0x49; // II vs MM
          const readU16 = (o: number) =>
            isLittleEndian ? buffer[o] | (buffer[o + 1] << 8) : (buffer[o] << 8) | buffer[o + 1];
          const readU32 = (o: number) =>
            isLittleEndian
              ? (buffer[o] | (buffer[o + 1] << 8) | (buffer[o + 2] << 16) | (buffer[o + 3] << 24)) >>> 0
              : ((buffer[o] << 24) | (buffer[o + 1] << 16) | (buffer[o + 2] << 8) | buffer[o + 3]) >>> 0;

          const magic = readU16(tiffOffset + 2);
          if (magic === 42) {
            const firstIfdOffset = readU32(tiffOffset + 4);
            let dirOffset = tiffOffset + firstIfdOffset;
            if (dirOffset + 2 <= app1End) {
              const numEntries = readU16(dirOffset);
              dirOffset += 2;
              for (let i = 0; i < numEntries && dirOffset + 12 <= app1End; i++, dirOffset += 12) {
                const tag = readU16(dirOffset);
                if (tag === 0x0112) {
                  const val = readU16(dirOffset + 8);
                  if (val >= 1 && val <= 8) return val;
                }
              }
            }
          }
        }
      }
    }
    offset = app1End;
  }
  return 1;
}

/**
 * Xoay mảng pixel RGBA theo góc EXIF để chuẩn hóa hiển thị về góc 0 độ (orientation = 1).
 * Hỗ trợ đầy đủ toàn bộ 8 orientations theo chuẩn EXIF (1-8).
 */
export function normalizeOrientation(
  rgba: Uint8Array,
  width: number,
  height: number,
  orientation: number
): { data: Uint8Array; width: number; height: number } {
  if (orientation <= 1 || orientation > 8) {
    return { data: rgba, width, height };
  }

  // Orientation 2: Flip ngang (Horizontal Mirror)
  if (orientation === 2) {
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = (y * width + (width - 1 - x)) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width, height };
  }

  // Orientation 3: Xoay 180 độ
  if (orientation === 3) {
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = ((height - 1 - y) * width + (width - 1 - x)) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width, height };
  }

  // Orientation 4: Flip dọc (Vertical Mirror)
  if (orientation === 4) {
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = ((height - 1 - y) * width + x) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width, height };
  }

  // Orientation 5: Transpose (Flip qua đường chéo chính)
  if (orientation === 5) {
    const newWidth = height;
    const newHeight = width;
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = (x * newWidth + y) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width: newWidth, height: newHeight };
  }

  // Orientation 6: Xoay 90 độ thuận chiều kim đồng hồ
  if (orientation === 6) {
    const newWidth = height;
    const newHeight = width;
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = (x * newWidth + (height - 1 - y)) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width: newWidth, height: newHeight };
  }

  // Orientation 7: Transverse (Flip qua đường chéo phụ)
  if (orientation === 7) {
    const newWidth = height;
    const newHeight = width;
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = ((width - 1 - x) * newWidth + (height - 1 - y)) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width: newWidth, height: newHeight };
  }

  // Orientation 8: Xoay 270 độ thuận chiều kim đồng hồ (90 độ ngược chiều)
  if (orientation === 8) {
    const newWidth = height;
    const newHeight = width;
    const out = new Uint8Array(rgba.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = ((width - 1 - x) * newWidth + y) * 4;
        out[dstIdx] = rgba[srcIdx];
        out[dstIdx + 1] = rgba[srcIdx + 1];
        out[dstIdx + 2] = rgba[srcIdx + 2];
        out[dstIdx + 3] = rgba[srcIdx + 3];
      }
    }
    return { data: out, width: newWidth, height: newHeight };
  }

  return { data: rgba, width, height };
}

/**
 * Giải mã đầy đủ luồng byte và mã hóa lại sạch sẽ cho các định dạng được hỗ trợ (PNG & JPEG).
 * Preflight bounds, CRC và bounded scanline inflate trước khi giải mã.
 * Sử dụng strict tolerance (tolerantDecoding: false) cho JPEG.
 * Từ chối dứt khoát các tệp bị hỏng hoặc định dạng chưa hỗ trợ giải mã an toàn.
 */
export function decodeAndSanitizeRaster(buffer: Uint8Array): ProcessedImageResult {
  if (!buffer || buffer.length < 16) {
    return {
      success: false,
      error: 'Tệp tải lên quá nhỏ hoặc không hợp lệ (dưới 16 bytes).',
    };
  }

  if (buffer.length > MAX_UPLOAD_FILE_SIZE) {
    return {
      success: false,
      error: 'Kích thước tệp vượt quá giới hạn tối đa cho phép (5MB).',
    };
  }

  // 1. Kiểm tra JPEG: FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const preflight = preflightValidateJpeg(buffer);
    if (!preflight.valid) {
      return {
        success: false,
        error: preflight.error || 'Tệp JPEG không vượt qua bước kiểm tra cấu trúc sơ bộ.',
      };
    }

    try {
      const orientation = getJpegExifOrientation(buffer);
      // Strict decoding: tolerantDecoding: false
      const decoded = jpeg.decode(buffer, {
        useTArray: true,
        maxMemoryUsageInMB: 64,
        tolerantDecoding: false,
      });

      if (!decoded || !decoded.width || !decoded.height || decoded.width <= 0 || decoded.height <= 0) {
        return {
          success: false,
          error: 'Tệp JPEG bị hỏng, cắt cụt hoặc không thể giải mã thành dữ liệu ảnh raster hợp lệ.',
        };
      }

      if (decoded.width > MAX_IMAGE_DIMENSION || decoded.height > MAX_IMAGE_DIMENSION) {
        return {
          success: false,
          error: `Kích thước ảnh JPEG vượt quá giới hạn tối đa cho phép (${MAX_IMAGE_DIMENSION} x ${MAX_IMAGE_DIMENSION}).`,
        };
      }

      // Chuẩn hóa góc xoay EXIF nếu có
      const normalized = normalizeOrientation(decoded.data, decoded.width, decoded.height, orientation);

      // Tái mã hóa sạch sẽ với jpeg-js (Loại bỏ 100% EXIF, GPS, XMP, IPTC, Comments)
      const reencoded = jpeg.encode(
        {
          data: normalized.data,
          width: normalized.width,
          height: normalized.height,
        },
        85
      );

      return {
        success: true,
        sanitizedBytes: new Uint8Array(reencoded.data),
        contentType: 'image/jpeg',
        extension: 'jpg',
        width: normalized.width,
        height: normalized.height,
      };
    } catch {
      return {
        success: false,
        error: 'Giải mã tệp JPEG thất bại: dữ liệu luồng ảnh bị lỗi hoặc không đầy đủ.',
      };
    }
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
    const preflight = preflightValidatePng(buffer);
    if (!preflight.valid) {
      return {
        success: false,
        error: preflight.error || 'Tệp PNG không vượt qua bước kiểm tra cấu trúc sơ bộ.',
      };
    }

    try {
      const ab = toArrayBuffer(buffer);
      const decoded = UPNG.decode(ab);
      if (!decoded || !decoded.width || !decoded.height || decoded.width <= 0 || decoded.height <= 0) {
        return {
          success: false,
          error: 'Tệp PNG bị hỏng hoặc không thể giải mã thành dữ liệu ảnh raster hợp lệ.',
        };
      }

      if (decoded.width > MAX_IMAGE_DIMENSION || decoded.height > MAX_IMAGE_DIMENSION) {
        return {
          success: false,
          error: `Kích thước ảnh PNG vượt quá giới hạn tối đa cho phép (${MAX_IMAGE_DIMENSION} x ${MAX_IMAGE_DIMENSION}).`,
        };
      }

      const rgbaFrames = UPNG.toRGBA8(decoded);
      if (!rgbaFrames || rgbaFrames.length === 0) {
        return {
          success: false,
          error: 'Không tìm thấy khung hình dữ liệu raster trong tệp PNG.',
        };
      }

      const rawRgba = new Uint8Array(rgbaFrames[0]);
      if (rawRgba.length !== decoded.width * decoded.height * 4) {
        return {
          success: false,
          error: 'Kích thước dữ liệu điểm ảnh PNG không khớp với thông số chiều dài và chiều rộng.',
        };
      }

      // Tái mã hóa sạch sẽ với UPNG (Chỉ chứa IHDR, IDAT, IEND - loại bỏ 100% tEXt, zTXt, iTXt, eXIf)
      const reencoded = new Uint8Array(
        (UPNG as any).encode([rawRgba.buffer], decoded.width, decoded.height, 0, undefined, true)
      );

      return {
        success: true,
        sanitizedBytes: reencoded,
        contentType: 'image/png',
        extension: 'png',
        width: decoded.width,
        height: decoded.height,
      };
    } catch {
      return {
        success: false,
        error: 'Giải mã tệp PNG thất bại: dữ liệu điểm ảnh bị lỗi, cắt cụt hoặc thiếu khối IDAT/IEND.',
      };
    }
  }

  // 3. Từ chối định dạng khác (WebP, AVIF, SVG, HTML) với thông báo rõ ràng
  return {
    success: false,
    error: 'Định dạng tệp không được hỗ trợ. Hệ thống chỉ chấp nhận tệp ảnh raster PNG và JPEG (kích thước tối đa 5MB).',
  };
}
