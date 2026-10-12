/**
 * Trình dựng trang Xem trước Riêng tư (Authenticated Private Draft Preview - Task C17-R2-F2)
 * Thực thi các component và layout Astro nguyên bản bên trong vùng cách ly runWithSnapshot.
 * Ngăn chặn tuyệt đối việc rò rỉ dữ liệu bản nháp sang các request công khai khác (Zero Cross-Talk).
 */

const SNAPSHOT_STORAGE_SYMBOL = Symbol.for('__astro_published_snapshot_storage__');

export async function runWithSnapshot<R>(snapshot: any, fn: () => Promise<R> | R): Promise<R> {
  let storage = (globalThis as any)[SNAPSHOT_STORAGE_SYMBOL];
  if (!storage) {
    let ALS = (globalThis as any).AsyncLocalStorage;
    if (!ALS) {
      try {
        const modName = 'node:async_hooks';
        const mod = await import(/* @vite-ignore */ modName);
        ALS = mod.AsyncLocalStorage;
      } catch {}
    }
    if (ALS) {
      storage = (globalThis as any)[SNAPSHOT_STORAGE_SYMBOL] = new ALS();
    }
  }

  if (!storage || typeof storage.run !== 'function') {
    throw new Error('AsyncLocalStorage is required for private preview snapshot isolation. Refusing fallback to un-isolated global.');
  }
  return storage.run(snapshot, fn);
}

let customAstroHandler: ((req: Request, env?: any, ctx?: any) => Promise<Response>) | null = null;

export function setCustomAstroHandler(handler: ((req: Request, env?: any, ctx?: any) => Promise<Response>) | null) {
  customAstroHandler = handler;
}

export function getCustomAstroHandler() {
  return customAstroHandler;
}

/**
 * Viết lại các liên kết nội bộ trong trang xem trước để người dùng không bị thoát ra trang công khai
 */
export function rewritePreviewHref(href: string): string {
  // Bỏ qua external, protocol-relative, anchor tương đối (không bắt đầu bằng /), mailto, tel
  if (!href.startsWith('/') || href.startsWith('//')) {
    return href;
  }
  // Bỏ qua static assets, media nội bộ, API
  if (
    href.startsWith('/_astro') ||
    href.startsWith('/favicon') ||
    href.startsWith('/images/') ||
    href.startsWith('/media/') ||
    href.startsWith('/api/') ||
    href === '/api'
  ) {
    return href;
  }
  // Bỏ qua nếu đã nằm trong preview (chống bypass kiểu /previewevil bằng cách kiểm tra dấu phân cách rõ ràng)
  if (
    href === '/preview' ||
    href === '/preview/' ||
    href.startsWith('/preview/') ||
    href.startsWith('/preview?') ||
    href.startsWith('/preview#')
  ) {
    return href;
  }
  // Giữ nguyên fragment và query string đằng sau route
  return `/preview${href}`;
}

/**
 * Xử lý yêu cầu xem trước riêng tư với snapshot dữ liệu bản nháp đã xác thực
 */
export async function renderPrivateDraftPreview(
  request: Request,
  subPath: string,
  snapshot: any,
  env?: any,
  ctx?: any
): Promise<Response> {
  const url = new URL(request.url);
  // Chuẩn hóa đường dẫn nội bộ
  const normalizedPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  const targetUrl = new URL(normalizedPath, url.origin);

  // Tạo request nội bộ cho Astro SSR với đường dẫn con tương ứng
  const previewReq = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });

  const handler = getCustomAstroHandler();

  if (!handler) {
    return new Response(
      '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Chưa có bản dựng Preview SSR</title></head>' +
      '<body style="font-family:sans-serif;padding:2rem;text-align:center;">' +
      '<h2>Chưa tìm thấy bản dựng SSR Preview của Astro.</h2>' +
      '<p>Vui lòng chạy lệnh <code>npx astro build --config astro.preview.config.mjs</code> để biên dịch bản dựng xem trước.</p>' +
      '</body></html>',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
          'X-Studio-Private-Preview': 'true',
        },
      }
    );
  }

  const executionCtx = ctx ?? { waitUntil: () => {} };
  const workerEnv = env ?? {};

  // Thực thi bên trong AsyncLocalStorage của Snapshot Loader
  const response: Response = await runWithSnapshot(snapshot, async () => {
    return handler(previewReq, workerEnv, executionCtx);
  });

  // Sao chép headers và đính kèm cờ bảo mật bắt buộc
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Cache-Control', 'private, no-store');
  newHeaders.set('X-Robots-Tag', 'noindex, nofollow');
  newHeaders.set('X-Studio-Private-Preview', 'true');

  const contentType = newHeaders.get('Content-Type') || '';
  if (contentType.includes('text/html')) {
    let bodyText = await response.text();
    // Viết lại các liên kết nội bộ để người dùng điều hướng bên trong chế độ xem trước không bị thoát ra trang công khai
    bodyText = bodyText.replace(/href=(["'])(\/[^"'\s]*)\1/g, (_match, quote, p1) => {
      return `href=${quote}${rewritePreviewHref(p1)}${quote}`;
    });
    return new Response(bodyText, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
