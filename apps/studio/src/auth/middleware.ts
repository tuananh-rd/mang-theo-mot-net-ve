/**
 * Middleware xác thực và kiểm soát phiên làm việc cho Content Studio (Task C17)
 */

import type { Env, AuthSession, User, UserRole } from '../types.js';
import {
  verifyCloudflareAccessJwt,
  AuthError,
  AuthConfigMissingError,
  type VerifyJwtOptions,
} from './jwt.js';

export const DEV_USERS: Record<string, { email: string; role: UserRole }> = {
  admin: { email: 'dev-admin@internal.local', role: 'admin' },
  editor: { email: 'dev-editor@internal.local', role: 'editor' },
  reviewer: { email: 'dev-reviewer@internal.local', role: 'reviewer' },
};

/** Lấy giá trị cookie từ chuỗi header Cookie */
export function getCookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Trích xuất token Cloudflare Access từ request headers hoặc cookies
 */
export function extractAccessToken(request: Request): string | null {
  // 1. Header chính thức do Cloudflare Access proxy tiêm vào
  const assertionHeader = request.headers.get('Cf-Access-Jwt-Assertion');
  if (assertionHeader && assertionHeader.trim()) {
    return assertionHeader.trim();
  }

  // 2. Authorization Header thông thường (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 3. Cookie CF_Authorization do Cloudflare Access đặt trên trình duyệt
  const cookieHeader = request.headers.get('Cookie');
  const cookieToken = getCookieValue(cookieHeader, 'CF_Authorization');
  if (cookieToken && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
}

export interface AuthenticateOptions {
  verifyOptions?: Partial<VerifyJwtOptions>;
}

export function isLoopbackRequest(request: Request): boolean {
  try {
    const url = new URL(request.url);
    const host = (request.headers.get('Host') || url.host || '').toLowerCase();
    const hostname = host.split(':')[0];
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

/**
 * Xác thực request tới Content Studio và trả về thông tin phiên làm việc
 */
export async function authenticateRequest(
  request: Request,
  env: Env,
  options: AuthenticateOptions = {}
): Promise<AuthSession> {
  const isDevConfigured = env.STUDIO_ENVIRONMENT === 'development';
  const isLoopback = isLoopbackRequest(request);
  const allowDevBypass = isDevConfigured && isLoopback;
  const token = extractAccessToken(request);

  // 1. Môi trường phát triển cục bộ chỉ áp dụng cho yêu cầu loopback
  if (allowDevBypass) {
    const url = new URL(request.url);
    const devRoleParam = url.searchParams.get('dev_role');
    const devHeader = request.headers.get('x-dev-user');
    const cookieHeader = request.headers.get('Cookie');
    const devCookie = getCookieValue(cookieHeader, 'studio_dev_role');

    const selectedRole = (devRoleParam || devHeader || devCookie || 'admin').toLowerCase();
    const devProfile = DEV_USERS[selectedRole] || DEV_USERS.admin;

    // Đảm bảo người dùng dev tồn tại trong D1 cục bộ
    if (env.DB) {
      await ensureUserExists(env.DB, devProfile.email, devProfile.role);
    }

    return {
      user: {
        id: `dev-${devProfile.role}`,
        email: devProfile.email,
        role: devProfile.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isDev: true,
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };
  }

  // 2. Môi trường Production: Bắt buộc kiểm tra cấu hình (Fail-secure)
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    throw new AuthConfigMissingError(
      'Hệ thống đang chạy chế độ Production nhưng thiếu cấu hình Cloudflare Access (CF_ACCESS_TEAM_DOMAIN hoặc CF_ACCESS_AUD).'
    );
  }

  // 3. Nếu thiếu token JWT
  if (!token) {
    throw new AuthError(
      'Yêu cầu chưa được xác thực qua Cloudflare Access (Thiếu JWT assertion hoặc cookie CF_Authorization).',
      'UNAUTHORIZED',
      401
    );
  }

  // 4. Xác thực chữ ký và tính hợp lệ của JWT
  const payload = await verifyCloudflareAccessJwt(token, {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    expectedAud: env.CF_ACCESS_AUD,
    ...options.verifyOptions,
  });

  const email = (payload.email || payload.sub || '').toLowerCase().trim();
  if (!email) {
    throw new AuthError('Token không chứa định danh email người dùng.', 'INVALID_IDENTITY', 401);
  }

  // 5. Truy vấn vai trò người dùng trong D1 (Server-side RBAC)
  const user = await getUserFromDb(env.DB, email);
  if (!user) {
    throw new AuthError(
      `Tài khoản '${email}' đã xác thực qua Cloudflare Access nhưng chưa được cấp quyền trong Content Studio.`,
      'USER_NOT_REGISTERED',
      403
    );
  }

  return {
    user,
    isDev: false,
    token,
    expiresAt: payload.exp,
  };
}

/** Truy vấn thông tin người dùng từ cơ sở dữ liệu D1 */
async function getUserFromDb(db: Env['DB'], email: string): Promise<User | null> {
  if (!db) return null;
  const stmt = db.prepare('SELECT id, email, role, created_at as createdAt, updated_at as updatedAt FROM users WHERE email = ?');
  return stmt.bind(email).first<User>();
}

/** Đảm bảo tài khoản tồn tại trong cơ sở dữ liệu D1 (dùng cho bootstrap và dev) */
export async function ensureUserExists(
  db: Env['DB'],
  email: string,
  role: UserRole
): Promise<User> {
  const existing = await getUserFromDb(db, email);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  await db
    .prepare('INSERT INTO users (id, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, email, role, now, now)
    .run();

  return { id, email, role, createdAt: now, updatedAt: now };
}

/** Kiểm tra bảo vệ chống CSRF cho các yêu cầu thay đổi dữ liệu */
export function validateCsrf(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  // Kiểm tra Origin / Referer
  const origin = request.headers.get('Origin');
  const secFetchSite = request.headers.get('Sec-Fetch-Site');

  if (secFetchSite && secFetchSite === 'cross-site') {
    throw new AuthError('Yêu cầu bị từ chối do vi phạm chính sách bảo mật CSRF (Cross-site request blocked).', 'CSRF_BLOCKED', 403);
  }

  if (origin) {
    const requestHost = request.headers.get('Host') || '';
    let originUrl: URL;
    try {
      originUrl = new URL(origin);
    } catch {
      throw new AuthError('Origin header không hợp lệ.', 'INVALID_ORIGIN', 403);
    }

    if (requestHost && originUrl.host !== requestHost) {
      throw new AuthError('Yêu cầu có Origin không khớp với Host của hệ thống.', 'CSRF_ORIGIN_MISMATCH', 403);
    }
  }
}
