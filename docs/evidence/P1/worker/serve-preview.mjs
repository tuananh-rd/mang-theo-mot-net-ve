// Công cụ bằng chứng cục bộ (không phải cấu hình production): phục vụ dist của nhánh public trên loopback 4383,
// thêm X-Robots-Tag noindex và robots.txt Disallow CHỈ cho bản xem trước này. Chạy: node docs/evidence/P1/worker/serve-preview.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../dist');
const port = Number(process.env.PORT || 4383);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const base = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
  if (url.pathname === '/robots.txt') { response.writeHead(200, { ...base, 'Content-Type': types['.txt'] }); response.end('User-agent: *\nDisallow: /\n'); return; }
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) { response.writeHead(403, base); response.end('Forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) { response.writeHead(404, { ...base, 'Content-Type': types['.html'] }); response.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : 'Not found'); return; }
  response.writeHead(200, { ...base, 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`P1 preview http://127.0.0.1:${port}/ (dist=${root}) pid=${process.pid}`));
