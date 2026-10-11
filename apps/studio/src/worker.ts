/**
 * Điểm vào (Entrypoint) Cloudflare Worker cho Content Studio (Task C17)
 */

import type { Env } from './types.js';
import { authenticateRequest } from './auth/middleware.js';
import { handleApiRequest } from './api/router.js';
import { renderStudioHtml } from './ui/html.js';
import { AuthError, AuthConfigMissingError } from './auth/jwt.js';

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Phục vụ tệp media công khai từ R2
    if (path.startsWith('/media/')) {
      const key = path.slice(1); // bỏ dấu / đầu
      if (env.BUCKET) {
        const object = await env.BUCKET.get(key);
        if (object) {
          return new Response(object.body as any, {
            headers: {
              'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
              'ETag': object.etag,
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      }
      return new Response('Media Not Found', { status: 404 });
    }

    // 2. Xác thực phiên làm việc
    let session;
    try {
      session = await authenticateRequest(request, env);
    } catch (err: any) {
      if (err instanceof AuthConfigMissingError) {
        return new Response(
          JSON.stringify({
            error: err.message,
            code: 'AUTH_CONFIG_MISSING',
            tip: 'Hệ thống chạy chế độ Production nhưng chưa cấu hình Cloudflare Access (CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD). Fail-secure deny.',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      if (err instanceof AuthError) {
        return new Response(
          JSON.stringify({
            error: err.message,
            code: err.code,
          }),
          { status: err.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      return new Response(
        JSON.stringify({ error: err.message || 'Lỗi xác thực hệ thống' }),
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // 3. Phân luồng API REST
    if (path.startsWith('/api/')) {
      return handleApiRequest(request, env, session);
    }

    // 4. Phục vụ giao diện HTML Studio
    const html = renderStudioHtml(session);
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'same-origin',
      },
    });
  },
};
