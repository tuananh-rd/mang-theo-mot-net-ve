import type { D1Database, SendEmailBinding } from './types.js';
import { handlePublicPreorderRequest } from './preorders/service.js';

interface Env {
  DB: D1Database;
  PRODUCTION_SITE_ORIGIN?: string;
  RATE_LIMIT_SALT?: string;
  PREORDER_TEST_MODE?: string;
  EMAIL?: SendEmailBinding;
  PREORDER_MAIL_FROM?: string;
  PREORDER_NOTIFY_TO?: string;
  PREORDER_REPLY_TO?: string;
}

export default {
  fetch(request: Request, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response> {
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
      emailConfig: { binding: env.EMAIL, from: env.PREORDER_MAIL_FROM, notifyTo: env.PREORDER_NOTIFY_TO, replyTo: env.PREORDER_REPLY_TO },
      waitUntil: (promise) => ctx.waitUntil(promise),
    });
  },
};
