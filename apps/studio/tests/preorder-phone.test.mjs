import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LocalD1Database } from '../dist/db/emulator.js';
import { createPreorder, handlePublicPreorderRequest, normalizePreorderPhone } from '../dist/preorders/service.js';
import { handlePreorderAdminRequest } from '../dist/preorders/admin.js';

const schema = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8');
const createDb = () => new LocalD1Database(':memory:', schema);
const openProduct = async (db, price = 40000) => db.prepare(
  'UPDATE preorder_products SET is_open = 1, official_price = ?, pickup = ? WHERE product_id = ?'
).bind(price, 'Nhận tại FPT Hòa Lạc', 'chuon-chuon-tre-kem-de').run();
const goodInput = (overrides = {}) => ({
  productId: 'chuon-chuon-tre-kem-de', quantity: 2, name: 'Nguyễn An', contactType: 'email',
  contact: 'an@example.test', email: 'an@example.test', phone: '0912345678', pickup: 'Nhận tại FPT Hòa Lạc', note: '', consent: true, ...overrides,
});
const post = (db, input, key, extra = {}, ip = '203.0.113.1') => handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key, 'CF-Connecting-IP': ip }, body: JSON.stringify(input),
}), db, extra);

test('phone: vector chuẩn hóa dùng chung với biểu mẫu công khai', () => {
  const accepted = [['0984 441 726', '0984441726'], ['+84984441726', '+84984441726'], ['+84 984 441 726', '+84984441726'], ['(098) 444-1726', '0984441726'], ['0984.441.726', '0984441726'], ['84984441726', '+84984441726'], ['+1 415 555 2671', '+14155552671']];
  for (const [input, stored] of accepted) assert.equal(normalizePreorderPhone(input), stored, input);
  for (const bad of ['', '   ', ' - . ( ) ', '0984abc726', '09844', '098+4441726', '++84984441726', '+849844417261234567', '0984441726<script>', '+0123456789']) assert.equal(normalizePreorderPhone(bad), null, JSON.stringify(bad));
});

test('phone: bắt buộc cho đơn mới; thiếu/null/rỗng/khoảng trắng/không phải chuỗi/không hợp lệ bị từ chối 400 trước khi lưu và trước khi gửi email', async () => {
  const db = createDb();
  await openProduct(db);
  const sent = [];
  const emailConfig = { binding: { send: async (message) => { sent.push(message); } }, from: 'no-reply@example.test', notifyTo: 'team@example.test' };
  const missing = goodInput();
  delete missing.phone;
  const cases = [
    ['thiếu trường phone', missing, /nhập số điện thoại/],
    ['phone null', goodInput({ phone: null }), /nhập số điện thoại/],
    ['phone rỗng', goodInput({ phone: '' }), /nhập số điện thoại/],
    ['phone khoảng trắng', goodInput({ phone: '   ' }), /nhập số điện thoại/],
    ['phone là số', goodInput({ phone: 984441726 }), /nhập số điện thoại/],
    ['phone là mảng', goodInput({ phone: ['0984441726'] }), /nhập số điện thoại/],
    ['chỉ ký tự phân cách', goodInput({ phone: ' - . ( ) ' }), /chưa hợp lệ/],
    ['chứa chữ cái', goodInput({ phone: '0984abc726' }), /chưa hợp lệ/],
    ['quá ngắn', goodInput({ phone: '09844' }), /chưa hợp lệ/],
    ['dấu + không ở đầu', goodInput({ phone: '098+4441726' }), /chưa hợp lệ/],
    ['quá dài', goodInput({ phone: '+849844417261234567' }), /chưa hợp lệ/],
    ['ký tự HTML', goodInput({ phone: '0984441726<script>' }), /chưa hợp lệ/],
  ];
  for (const [label, input, message] of cases) {
    const response = await post(db, input, 'bad-' + cases.findIndex((c) => c[0] === label), { emailConfig });
    assert.equal(response.status, 400, label);
    assert.match((await response.json()).error, message, label);
  }
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM preorders').first()).count, 0);
  assert.equal(sent.length, 0, 'không gửi email khi số điện thoại bị từ chối');
  db.close();
});

test('phone: định dạng hợp lệ được chuẩn hóa khi lưu; email vẫn bắt buộc; giá vẫn do máy chủ quyết định; contactType=phone/contact không thay được phone', async () => {
  const db = createDb();
  await openProduct(db, 40000);
  const accepted = [['0984 441 726', '0984441726'], ['+84984441726', '+84984441726'], ['(098) 444-1726', '0984441726'], ['+1 415 555 2671', '+14155552671']];
  let n = 0;
  for (const [input, stored] of accepted) {
    const response = await post(db, goodInput({ phone: input, price: 1 }), 'ok-' + n, {}, '198.51.100.' + n);
    const body = await response.json();
    assert.equal(response.status, 201, input);
    assert.equal(body.preorder.unitPrice, 40000);
    assert.equal((await db.prepare('SELECT customer_phone FROM preorder_email_state WHERE preorder_id = ?').bind(body.preorder.id).first()).customer_phone, stored, input);
    n++;
  }
  await assert.rejects(createPreorder({ db, input: goodInput({ email: '' }), idempotencyKey: 'no-email', ipAddress: '10.9.9.9' }), /Email/);
  // Dạng gửi cũ (contactType='phone' + contact) KHÔNG còn thay thế được trường phone: thiếu hoặc null vẫn bị từ chối.
  const missingWithLegacyContact = goodInput({ contactType: 'phone', contact: '0912 345 678' });
  delete missingWithLegacyContact.phone;
  await assert.rejects(createPreorder({ db, input: missingWithLegacyContact, idempotencyKey: 'legacy-missing', ipAddress: '10.9.9.8' }), /nhập số điện thoại/);
  await assert.rejects(createPreorder({ db, input: goodInput({ contactType: 'phone', contact: '0912 345 678', phone: null }), idempotencyKey: 'legacy-null', ipAddress: '10.9.9.8' }), /nhập số điện thoại/);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM preorders').first()).count, accepted.length);
  db.close();
});

test('phone: thử lại hợp lệ vẫn idempotent; yêu cầu bị từ chối vì số điện thoại không tạo đơn; giới hạn tốc độ vẫn áp dụng', async () => {
  const db = createDb();
  await openProduct(db);
  const options = { db, input: goodInput({ phone: '0984 441 726' }), idempotencyKey: 'retry-phone', ipAddress: '10.0.1.1' };
  const first = await createPreorder(options);
  const retry = await createPreorder(options);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.preorder.id, first.preorder.id);
  await assert.rejects(createPreorder({ db, input: goodInput({ phone: 'xyz' }), idempotencyKey: 'bad-phone-retry', ipAddress: '10.0.1.2' }), /Số điện thoại/);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM preorders').first()).count, 1);
  for (let i = 0; i < 8; i++) assert.equal((await post(db, goodInput(), 'rate-' + i, { rateLimitSalt: 'salt' }, '203.0.113.99')).status, 201);
  assert.equal((await post(db, goodInput(), 'rate-9', { rateLimitSalt: 'salt' }, '203.0.113.99')).status, 429);
  db.close();
});

test('phone: đơn lịch sử không có số điện thoại vẫn đọc, quản lý, gửi lại email và xuất CSV; không backfill', async () => {
  const db = createDb();
  await openProduct(db);
  const legacy = (id, code, product, name, qty, price, hash, email) => db.prepare(`INSERT INTO preorders (id, order_code, product_id, product_name, quantity, customer_name, contact_type, contact_value, pickup, unit_price, status, is_test, idempotency_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'email', ?, 'Nhận tại FPT Hòa Lạc', ?, 'new', 1, ?, '2026-10-20T00:00:00.000Z', '2026-10-20T00:00:00.000Z')`).bind(id, code, product, name, qty, 'Khách ' + id, email, price, hash).run();
  await legacy('legacy-1', 'MTMNV-LEGACY01', 'chuon-chuon-tre-kem-de', 'Chuồn chuồn tre 12 cm kèm đế', 1, 40000, 'legacy-hash-1', 'cu@example.test');
  await db.prepare("INSERT INTO preorder_email_state (preorder_id, customer_email, customer_phone, email_status, email_attempts) VALUES ('legacy-1', 'cu@example.test', NULL, 'pending', 0)").run();
  await legacy('legacy-2', 'MTMNV-LEGACY02', 'moc-khoa', 'Móc khóa Lăng Kính', 3, 10000, 'legacy-hash-2', 'cu2@example.test');
  const session = (role) => ({ user: { email: `${role}@example.test`, role }, isDev: true, expiresAt: Date.now() + 10000 });
  const request = (url, method = 'GET', body) => new Request('http://127.0.0.1' + url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const list = await handlePreorderAdminRequest(request('/api/preorders?test=true'), db, session('reviewer'));
  assert.equal(list.status, 200);
  assert.equal((await list.json()).preorders.length, 2);
  const detail = await handlePreorderAdminRequest(request('/api/preorders/legacy-1'), db, session('reviewer'));
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).preorder.customer_phone, null);
  assert.equal((await handlePreorderAdminRequest(request('/api/preorders/legacy-1/status', 'POST', { status: 'contacted' }), db, session('reviewer'))).status, 200);
  const csv = await handlePreorderAdminRequest(request('/api/preorders/export.csv?test=true'), db, session('admin'));
  assert.equal(csv.status, 200);
  assert.match(new TextDecoder().decode(new Uint8Array(await csv.arrayBuffer())), /MTMNV-LEGACY02/);
  const messages = [];
  const retry = await handlePreorderAdminRequest(request('/api/preorders/legacy-1/email/retry', 'POST', {}), db, session('reviewer'), { binding: { send: async (m) => messages.push(m) }, from: 'no-reply@example.test', notifyTo: 'team@example.test' });
  assert.equal(retry.status, 200);
  assert.match(messages[1].text, /Không cung cấp/);
  assert.equal((await db.prepare("SELECT customer_phone FROM preorder_email_state WHERE preorder_id = 'legacy-1'").first()).customer_phone, null);
  db.close();
});
