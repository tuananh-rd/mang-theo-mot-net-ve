/**
 * Xác thực JSON Web Token từ Cloudflare Access (Task C17)
 * Tuân thủ hướng dẫn chính thức của Cloudflare:
 * https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
 *
 * Kiểm tra đầy đủ:
 * - Thuật toán chữ ký RS256
 * - Issuer (iss) phải khớp https://<team-domain>.cloudflareaccess.com
 * - Audience (aud) phải khớp mã định danh Application AUD đã cấu hình
 * - Thời hạn (exp) và thời điểm hiệu lực (nbf)
 * - Chữ ký số mã hóa với public keys lấy từ /cdn-cgi/access/certs
 * - Fail-secure: Chế độ production thiếu cấu hình auth bắt buộc phải từ chối (deny)
 */

import type { AccessJwtHeader, AccessJwtPayload } from '../types.js';

export class AuthError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthConfigMissingError extends AuthError {
  constructor(message: string = 'Thiếu cấu hình Cloudflare Access trong môi trường Production.') {
    super(message, 'AUTH_CONFIG_MISSING', 500);
  }
}

/** Chuyển đổi chuỗi base64url sang Uint8Array */
export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Giải mã JWT không kiểm tra chữ ký (dùng để đọc header / payload) */
export function decodeJwt(token: string): { header: AccessJwtHeader; payload: AccessJwtPayload; rawSignature: string; signedData: string } {
  if (typeof token !== 'string') {
    throw new AuthError('Token phải là chuỗi ký tự.', 'INVALID_TOKEN_TYPE');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new AuthError('Cấu trúc JWT không hợp lệ (phải gồm 3 phần header.payload.signature).', 'MALFORMED_JWT');
  }

  try {
    const headerJson = new TextDecoder().decode(base64UrlToUint8Array(parts[0]));
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(parts[1]));
    const header = JSON.parse(headerJson) as AccessJwtHeader;
    const payload = JSON.parse(payloadJson) as AccessJwtPayload;

    return {
      header,
      payload,
      rawSignature: parts[2],
      signedData: `${parts[0]}.${parts[1]}`,
    };
  } catch (err) {
    throw new AuthError('Không thể phân tích dữ liệu header hoặc payload của JWT.', 'JWT_PARSE_ERROR');
  }
}

export interface VerifyJwtOptions {
  teamDomain: string;
  expectedAud: string;
  jwks?: { keys: JsonWebKey[] };
  now?: number; // Cho phép mock thời gian trong test
  fetchJwksFn?: (url: string) => Promise<{ keys: JsonWebKey[] }>;
}

let jwksCache: { [url: string]: { keys: JsonWebKey[]; expires: number } } = {};

/** Xóa cache JWKS (hữu ích cho unit test) */
export function clearJwksCache(): void {
  jwksCache = {};
}

/** Tải danh sách khóa công khai từ Cloudflare Access */
export async function getCloudflareJwks(
  teamDomain: string,
  fetchFn: (url: string) => Promise<{ keys: JsonWebKey[] }> = defaultFetchJwks
): Promise<{ keys: JsonWebKey[] }> {
  const normalizedDomain = teamDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${normalizedDomain}/cdn-cgi/access/certs`;

  const cached = jwksCache[url];
  const now = Date.now();
  if (cached && cached.expires > now) {
    return cached;
  }

  const data = await fetchFn(url);
  if (!data || !Array.isArray(data.keys) || data.keys.length === 0) {
    throw new AuthError('Không thể lấy danh sách chứng chỉ công khai từ Cloudflare Access.', 'JWKS_FETCH_FAILED', 502);
  }

  jwksCache[url] = {
    keys: data.keys,
    expires: now + 10 * 60 * 1000, // Cache 10 phút
  };

  return data;
}

async function defaultFetchJwks(url: string): Promise<{ keys: JsonWebKey[] }> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new AuthError(`Yêu cầu JWKS trả về HTTP ${response.status}`, 'JWKS_HTTP_ERROR', 502);
  }
  return response.json() as Promise<{ keys: JsonWebKey[] }>;
}

export function isPlaceholderOrUnconfigured(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return (
    v === '' ||
    v.includes('example-team') ||
    v.includes('your-team') ||
    v.includes('placeholder') ||
    /^[0-]+$/.test(v)
  );
}

/**
 * Xác thực toàn diện chữ ký số và claims của Cloudflare Access JWT
 */
export async function verifyCloudflareAccessJwt(
  token: string,
  options: VerifyJwtOptions
): Promise<AccessJwtPayload> {
  if (
    !options.teamDomain ||
    !options.expectedAud ||
    isPlaceholderOrUnconfigured(options.teamDomain) ||
    isPlaceholderOrUnconfigured(options.expectedAud)
  ) {
    throw new AuthConfigMissingError('Cấu hình Cloudflare Access chưa được thiết lập giá trị thực tế hợp lệ (fail-secure deny).');
  }

  const { header, payload, rawSignature, signedData } = decodeJwt(token);

  // 1. Kiểm tra thuật toán (Bắt buộc RS256 theo chuẩn Cloudflare Access)
  if (header.alg !== 'RS256') {
    throw new AuthError(`Thuật toán chữ ký '${header.alg}' không được hỗ trợ (chỉ chấp nhận RS256).`, 'UNSUPPORTED_ALGORITHM');
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);

  // 2. Kiểm tra thời hạn hiệu lực (exp)
  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    throw new AuthError('Phiên đăng nhập đã hết hạn (Token expired).', 'TOKEN_EXPIRED');
  }

  // 3. Kiểm tra thời điểm bắt đầu hiệu lực (nbf)
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) {
    throw new AuthError('Token chưa đến thời điểm hiệu lực (Token not yet valid).', 'TOKEN_NOT_YET_VALID');
  }

  // 4. Kiểm tra Issuer (iss)
  const normalizedTeam = options.teamDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const expectedIssuer = `https://${normalizedTeam}`;
  const actualIssuer = (payload.iss || '').replace(/\/$/, '');
  if (actualIssuer !== expectedIssuer) {
    throw new AuthError(`Issuer không hợp lệ: kỳ vọng '${expectedIssuer}', nhận '${payload.iss}'.`, 'ISSUER_MISMATCH');
  }

  // 5. Kiểm tra Audience (aud)
  const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audArray.includes(options.expectedAud)) {
    throw new AuthError(`Audience không hợp lệ (không khớp với ứng dụng Cloudflare Access).`, 'AUDIENCE_MISMATCH');
  }

  // 6. Kiểm tra sự tồn tại của Email hoặc Subject
  if (!payload.email && !payload.sub) {
    throw new AuthError('Token không chứa thông tin định danh người dùng (thiếu email hoặc sub).', 'IDENTITY_MISSING');
  }

  // 7. Lấy JWKS và xác thực chữ ký số bằng Web Crypto API
  const jwks = options.jwks || (await getCloudflareJwks(options.teamDomain, options.fetchJwksFn));
  let matchingKey: JsonWebKey | undefined;

  if (header.kid) {
    matchingKey = jwks.keys.find((k) => (k as any).kid === header.kid);
  }
  if (!matchingKey && jwks.keys.length > 0) {
    matchingKey = jwks.keys[0];
  }

  if (!matchingKey) {
    throw new AuthError('Không tìm thấy khóa công khai phù hợp để xác thực chữ ký token.', 'KEY_NOT_FOUND');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    matchingKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = base64UrlToUint8Array(rawSignature);
  const dataBytes = new TextEncoder().encode(signedData);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes as any,
    dataBytes
  );

  if (!isValid) {
    throw new AuthError('Chữ ký số của Token không hợp lệ hoặc đã bị chỉnh sửa.', 'SIGNATURE_INVALID');
  }

  return payload;
}
