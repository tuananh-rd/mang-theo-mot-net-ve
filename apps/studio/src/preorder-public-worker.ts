import type { D1Database } from './types.js';
import { handlePublicPreorderRequest } from './preorders/service.js';

interface Env {
  DB: D1Database;
  PRODUCTION_SITE_ORIGIN?: string;
  RATE_LIMIT_SALT?: string;
  PREORDER_TEST_MODE?: string;
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (!env.RATE_LIMIT_SALT) {
      return Promise.resolve(new Response(JSON.stringify({ success: false, error: 'Dịch vụ đặt trước chưa sẵn sàng.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      }));
    }
    return handlePublicPreorderRequest(request, env.DB, {
      siteOrigin: env.PRODUCTION_SITE_ORIGIN || 'https://mangtheomotnetve.website',
      rateLimitSalt: env.RATE_LIMIT_SALT,
      isTest: env.PREORDER_TEST_MODE === 'true',
    });
  },
};
