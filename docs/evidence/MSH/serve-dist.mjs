// Máy chủ tĩnh loopback cho bản xem trước L1; thêm X-Robots-Tag: noindex (không đổi dist).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const [root, port] = [path.resolve(process.argv[2]), Number(process.argv[3])];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f)) { res.writeHead(404, { 'X-Robots-Tag': 'noindex, nofollow' }).end('404'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'X-Robots-Tag': 'noindex, nofollow' });
  fs.createReadStream(f).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('serving', root, port));
