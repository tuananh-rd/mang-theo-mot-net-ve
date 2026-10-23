/**
 * Điểm vào (Entrypoint) Cloudflare Worker cho Content Studio (Task C17)
 */

import type { Env } from './types.js';
import { authenticateRequest } from './auth/middleware.js';
import { handleApiRequest } from './api/router.js';
import { renderStudioHtml } from './ui/html.js';
import { AuthError, AuthConfigMissingError } from './auth/jwt.js';
import { StudioDbClient } from './db/client.js';
import { createPublicationSnapshot, createPrivateDraftSnapshot } from './publish/adapter.js';
import { APPROVED_MEDIA_REGISTRY } from './storage/media-registry.js';
import { renderPrivateDraftPreview, getCustomAstroHandler } from './preview/renderer.js';
import { handlePublicPreorderRequest } from './preorders/service.js';

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Public preorder endpoints are separate from Access-protected Studio APIs.
    // Local development may reach these through the Studio emulator only.
    if (path === '/api/preorders/config' || (path === '/api/preorders' && ['POST', 'OPTIONS'].includes(request.method.toUpperCase()))) {
      return handlePublicPreorderRequest(request, env.DB, {
        siteOrigin: env.PRODUCTION_SITE_ORIGIN || 'https://mangtheomotnetve.website',
        extraOrigins: env.STUDIO_ENVIRONMENT === 'development'
          ? ['http://127.0.0.1:4321', 'http://localhost:4321']
          : [],
        rateLimitSalt: env.RATE_LIMIT_SALT,
        isTest: env.STUDIO_ENVIRONMENT === 'development' && env.PREORDER_TEST_MODE !== 'false',
        emailConfig: { binding: env.EMAIL, from: env.PREORDER_MAIL_FROM, notifyTo: env.PREORDER_NOTIFY_TO, replyTo: env.PREORDER_REPLY_TO },
        waitUntil: (promise) => ctx.waitUntil(promise),
      });
    }

    // 1. Phục vụ tệp media từ R2 kho lưu trữ nội bộ của Studio (bắt buộc xác thực)
    if (path.startsWith('/media/')) {
      const key = path.slice(1); // bỏ dấu / đầu (ví dụ: media/abc.jpg)
      let session;
      try {
        session = await authenticateRequest(request, env);
      } catch {
        return new Response(
          JSON.stringify({
            error: 'Truy cập bị từ chối: Tệp media trong kho lưu trữ Studio yêu cầu đăng nhập nội bộ.',
            code: 'UNAUTHORIZED_MEDIA',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      if (!session || !['admin', 'editor', 'reviewer'].includes(session.user.role)) {
        return new Response(
          JSON.stringify({ error: 'Không đủ quyền hạn xem tệp media riêng tư.', code: 'FORBIDDEN_MEDIA' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'private, no-store, no-cache, must-revalidate',
              'X-Robots-Tag': 'noindex, nofollow',
            },
          }
        );
      }

      if (env.BUCKET) {
        const object = await env.BUCKET.get(key);
        if (object) {
          return new Response(object.body as any, {
            headers: {
              'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
              'ETag': object.etag,
              'Cache-Control': 'private, no-store',
              'X-Robots-Tag': 'noindex, nofollow',
              'X-Studio-Private-Preview': 'true',
            },
          });
        }
      }
      return new Response('Media Not Found', {
        status: 404,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
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

    // 4. Phục vụ tài nguyên tĩnh của Astro (CSS, JS, hình ảnh được xác thực)
    const astroHandler = getCustomAstroHandler();
    if (
      astroHandler &&
      (path.startsWith('/_astro/') ||
        path.startsWith('/favicon.') ||
        path.startsWith('/images/') ||
        /\.(css|js|svg|png|jpg|jpeg|webp|ico|woff|woff2|ttf)$/i.test(path))
    ) {
      const assetRes = await astroHandler(request, env, ctx);
      if (assetRes && assetRes.status !== 404) {
        const headers = new Headers(assetRes.headers);
        headers.set('Cache-Control', 'private, no-store');
        headers.set('X-Robots-Tag', 'noindex, nofollow');
        headers.set('X-Studio-Private-Preview', 'true');
        return new Response(assetRes.body, {
          status: assetRes.status,
          statusText: assetRes.statusText,
          headers,
        });
      }
    }

    // 5. Phân luồng Xem trước Bản nháp Riêng tư (Authenticated Private Draft Preview)
    if (path === '/preview' || path.startsWith('/preview/')) {
      const dbClient = new StudioDbClient(env.DB);
      const allDrafts = await dbClient.getAllDrafts();
      const dbAssets = await dbClient.listMediaAssets(500);
      const approvedKeys = new Set<string>();
      for (const reg of APPROVED_MEDIA_REGISTRY) {
        approvedKeys.add(reg.publicPath);
        approvedKeys.add(reg.r2Key);
        approvedKeys.add(reg.id);
        approvedKeys.add(`/media/${reg.id}`);
      }
      for (const a of dbAssets) {
        if (a.status === 'approved') {
          approvedKeys.add(a.r2Key);
          approvedKeys.add(a.id);
          approvedKeys.add(`/media/${a.id}`);
          const reg = APPROVED_MEDIA_REGISTRY.find((r) => r.id === a.id || r.r2Key === a.r2Key);
          if (reg) approvedKeys.add(reg.publicPath);
        }
      }
      const previewSnapshot = await createPrivateDraftSnapshot(allDrafts, `preview-${Date.now()}`, approvedKeys);

      const subPath = path.replace(/^\/preview/, '') || '/';
      return renderPrivateDraftPreview(request, subPath, previewSnapshot, env, ctx);
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
