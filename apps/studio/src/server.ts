/**
 * Máy chủ HTTP cục bộ chạy Content Studio độc lập trên cổng 4330 (Task C17)
 * Sử dụng LocalD1Database (node:sqlite) và LocalR2Bucket (local filesystem).
 */

import * as http from 'node:http';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LocalD1Database } from './db/emulator.js';
import { LocalR2Bucket } from './storage/emulator.js';
import worker from './worker.js';
import type { Env } from './types.js';

export function createStudioLocalServer(options: { port?: number; dataDir?: string } = {}) {
  const port = options.port || 4330;
  const baseDataDir = options.dataDir || path.resolve(process.cwd(), 'apps/studio/data');

  const d1Dir = path.join(baseDataDir, 'd1');
  const r2Dir = path.join(baseDataDir, 'r2');

  if (!fs.existsSync(d1Dir)) fs.mkdirSync(d1Dir, { recursive: true });
  if (!fs.existsSync(r2Dir)) fs.mkdirSync(r2Dir, { recursive: true });

  const sqlitePath = path.join(d1Dir, 'studio.sqlite');
  const schemaPath = path.resolve(process.cwd(), 'apps/studio/src/db/schema.sql');
  const schemaSql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf-8') : undefined;

  const db = new LocalD1Database(sqlitePath, schemaSql);
  const bucket = new LocalR2Bucket(r2Dir);

  const env: Env = {
    DB: db,
    BUCKET: bucket,
    STUDIO_ENVIRONMENT: 'development',
  };

  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1:' + port}`);

      const method = (req.method || 'GET').toUpperCase();

      // Phục vụ tệp tĩnh trong public/images/ cho các tài nguyên hình ảnh được phê duyệt
      if (method === 'GET' && url.pathname.startsWith('/images/')) {
        const relPath = url.pathname.replace(/^\/+/, '');
        const filePath = path.resolve(process.cwd(), 'public', relPath);
        if (filePath.startsWith(path.resolve(process.cwd(), 'public')) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.webp': 'image/webp',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.gif': 'image/gif',
          };
          res.statusCode = 200;
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      // Chuyển đổi Node incoming message sang Web standard Request
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, String(value));
          }
        }
      }

      let body: Buffer | undefined;

      if (method !== 'GET' && method !== 'HEAD') {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB giới hạn dung lượng

        for await (const chunk of req) {
          const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          totalSize += buf.length;
          if (totalSize > MAX_BODY_SIZE) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('413 Payload Too Large: Dung lượng yêu cầu vượt quá giới hạn 10MB.');
            return;
          }
          chunks.push(buf);
        }
        body = Buffer.concat(chunks);
      }

      const webRequest = new Request(url.toString(), {
        method,
        headers,
        body: body ? (body as any) : undefined,
      });

      const webResponse = await worker.fetch(webRequest, env, {});

      res.statusCode = webResponse.status;
      webResponse.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      if (webResponse.body) {
        const reader = webResponse.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) res.write(Buffer.from(value));
        }
      }
      res.end();
    } catch (err: any) {
      console.error('[Studio Local Server Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error: ' + (err.message || String(err)));
    }
  });

  return {
    server,
    port,
    start: () =>
      new Promise<void>((resolve) => {
        server.listen(port, '127.0.0.1', () => {
          console.log(`[Studio] Content Studio đang chạy tại http://127.0.0.1:${port}`);
          resolve();
        });
      }),
    stop: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}
