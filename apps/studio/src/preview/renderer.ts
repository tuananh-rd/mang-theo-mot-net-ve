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

let cachedServerEntry: any = null;

async function getAstroServerEntry(): Promise<any> {
  if (cachedServerEntry) return cachedServerEntry;

  // Thử nạp từ dist-preview (Astro Cloudflare SSR build)
  try {
    const previewEntryPath = ['..', '..', '..', '..', 'dist-preview', 'server', 'entry.mjs'].join('/');
    // @ts-ignore
    const entry = await import(/* @vite-ignore */ previewEntryPath);
    if (entry && entry.default && typeof entry.default.fetch === 'function') {
      cachedServerEntry = entry.default;
      return cachedServerEntry;
    }
  } catch {}

  // Dự phòng từ dist/server (nếu build không chỉ định outDir riêng)
  try {
    const serverEntryPath = ['..', '..', '..', '..', 'dist', 'server', 'entry.mjs'].join('/');
    // @ts-ignore
    const entry = await import(/* @vite-ignore */ serverEntryPath);
    if (entry && entry.default && typeof entry.default.fetch === 'function') {
      cachedServerEntry = entry.default;
      return cachedServerEntry;
    }
  } catch {}

  return null;
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

  const entry = await getAstroServerEntry();

  if (!entry) {
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
    return entry.fetch(previewReq, workerEnv, executionCtx);
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
    bodyText = bodyText.replace(/href="(\/(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?)"/g, (match, p1) => {
      if (p1.startsWith('/_astro') || p1.startsWith('/preview') || p1.startsWith('/api') || p1.startsWith('/favicon')) {
        return match;
      }
      return `href="/preview${p1 === '/' ? '/' : p1}"`;
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
