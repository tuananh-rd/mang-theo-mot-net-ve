// API cục bộ CHỈ dùng làm bằng chứng/fixture: bộ nhớ SQLite trong tiến trình, không D1/R2/email thật, không cấu hình production.
// Chạy sau `npm run studio:build`: node docs/evidence/P1-api/worker/local-preorder-fixture.mjs  → http://127.0.0.1:4331
import http from 'node:http';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const studio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../apps/studio');
const { LocalD1Database } = await import('file:///' + path.join(studio, 'dist/db/emulator.js').replace(/\\/g, '/'));
const { handlePublicPreorderRequest } = await import('file:///' + path.join(studio, 'dist/preorders/service.js').replace(/\\/g, '/'));
const schema = fs.readFileSync(path.join(studio, 'src/db/schema.sql'), 'utf8');
const db = new LocalD1Database(':memory:', schema);
const open = (id, price) => db.prepare('UPDATE preorder_products SET is_open = 1, official_price = ?, pickup = ? WHERE product_id = ?').bind(price, 'Nhóm xác nhận cách nhận hàng khi liên hệ', id).run();
await open('chuon-chuon-tre-kem-de', 40000);
await open('moc-khoa', 10000);
const origins = ['http://127.0.0.1:4383', 'http://localhost:4383'];
const port = Number(process.env.PORT || 4331);

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const init = { method: req.method, headers: req.headers };
  if (!['GET', 'HEAD'].includes(req.method)) init.body = Buffer.concat(chunks);
  const request = new Request(`http://127.0.0.1:${port}${req.url}`, init);
  const response = await handlePublicPreorderRequest(request, db, { siteOrigin: origins[0], extraOrigins: origins, rateLimitSalt: 'local-fixture', isTest: true });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, '127.0.0.1', () => console.log(`Fixture preorder API http://127.0.0.1:${port} (in-memory, isTest=1, no email) pid=${process.pid}`));
