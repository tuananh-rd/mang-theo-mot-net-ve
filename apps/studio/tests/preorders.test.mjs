import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalD1Database } from '../dist/db/emulator.js';
import { createPreorder, handlePublicPreorderRequest } from '../dist/preorders/service.js';
import { handlePreorderAdminRequest } from '../dist/preorders/admin.js';
import worker from '../dist/worker.js';
import { listPreorderProducts } from '../dist/preorders/service.js';
import { isSafeEmailAddress, escapeEmailHtml } from '../dist/preorders/email.js';

const schema = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8');
const openProduct = async (db, price = null, pickup = 'Nhận tại FPT Hòa Lạc') => db.prepare(
  'UPDATE preorder_products SET is_open = 1, official_price = ?, pickup = ? WHERE product_id = ?'
).bind(price, pickup, 'chuon-chuon-tre-kem-de').run();
const goodInput = (overrides = {}) => ({
  productId: 'chuon-chuon-tre-kem-de', quantity: 2, name: 'Nguyễn An', contactType: 'phone',
  contact: '0912345678', email: 'an@example.test', phone: '0912345678', pickup: 'Nhận tại FPT Hòa Lạc', note: '', consent: true, ...overrides,
});

function createDb() {
  return new LocalD1Database(':memory:', schema);
}

test('preorder: persists customer order across emulator restart and ignores client price', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c20-preorder-'));
  const file = path.join(dir, 'preorders.sqlite');
  let db = new LocalD1Database(file, schema);
  await openProduct(db, null);
  const created = await createPreorder({ db, input: goodInput({ price: 1, total: 2 }), idempotencyKey: 'persist-1', ipAddress: '127.0.0.1', isTest: true });
  assert.equal(created.preorder.unitPrice, null);
  assert.equal(created.preorder.isTest, true);
  assert.match(created.preorder.orderCode, /^MTMNV-[A-F0-9]{8}$/);
  db.close();
  db = new LocalD1Database(file);
  const persisted = await db.prepare('SELECT id, order_code, unit_price, is_test, customer_name FROM preorders').first();
  assert.equal(persisted.id, created.preorder.id);
  assert.equal(persisted.order_code, created.preorder.orderCode);
  assert.equal(persisted.unit_price, null);
  assert.equal(persisted.is_test, 1);
  assert.equal(persisted.customer_name, 'Nguyễn An');
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('preorder migration: D1 migration can be applied more than once', async () => {
  const db = createDb();
  const migration = fs.readFileSync(new URL('../migrations/0002_preorders.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM preorder_products').first();
  assert.equal(count.count, 2);
  const defaultConfig = await db.prepare("SELECT is_open, official_price FROM preorder_products WHERE product_id = 'chuon-chuon-tre-kem-de'").first();
  assert.equal(defaultConfig.is_open, 0);
  assert.equal(defaultConfig.official_price, null);
  const emailMigration = fs.readFileSync(new URL('../migrations/0003_preorder_email.sql', import.meta.url), 'utf8');
  await db.exec(emailMigration);
  await db.exec(emailMigration);
  db.close();
});

test('preorder: idempotency returns the original order and does not duplicate', async () => {
  const db = createDb();
  await openProduct(db, 15000);
  const options = { db, input: goodInput({ price: 999999 }), idempotencyKey: 'same-key', ipAddress: '10.0.0.1' };
  const first = await createPreorder(options);
  const duplicate = await createPreorder(options);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.preorder.id, first.preorder.id);
  assert.equal(first.preorder.unitPrice, 15000);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM preorders').first();
  assert.equal(count.count, 1);
  db.close();
});

test('preorder: validates consent, honeypot, product state, quantity, and contact', async () => {
  const db = createDb();
  await openProduct(db);
  const reject = async (input, key) => assert.rejects(createPreorder({ db, input, idempotencyKey: key, ipAddress: '10.0.0.2' }));
  await reject(goodInput({ consent: false }), 'bad-consent');
  await reject(goodInput({ website: 'bot' }), 'honeypot');
  await reject(goodInput({ quantity: 51 }), 'too-many');
  await reject(goodInput({ email: 'bad\r\nBcc: someone@example.test' }), 'bad-contact');
  await reject(goodInput({ productId: 'set-do-an' }), 'unknown-product');
  await db.prepare("UPDATE preorder_products SET is_open = 0 WHERE product_id = 'chuon-chuon-tre-kem-de'").run();
  await reject(goodInput(), 'closed');
  db.close();
});

test('preorder API: strict CORS, server-side pricing, body and request rate limits', async () => {
  const db = createDb();
  await openProduct(db, 42000);
  const foreign = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.invalid', 'Idempotency-Key': 'cors' }, body: JSON.stringify(goodInput()),
  }), db, { siteOrigin: 'https://mangtheomotnetve.website' });
  assert.equal(foreign.status, 403);
  const first = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://mangtheomotnetve.website', 'Idempotency-Key': 'api-order', 'CF-Connecting-IP': '203.0.113.8' }, body: JSON.stringify(goodInput({ officialPrice: 1 })),
  }), db, { siteOrigin: 'https://mangtheomotnetve.website', rateLimitSalt: 'test-secret' });
  assert.equal(first.status, 201);
  const firstResult = await first.json();
  assert.equal(firstResult.emailStatus, 'skipped');
  const order = firstResult.preorder;
  assert.equal(order.unitPrice, 42000);
  const duplicate = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://mangtheomotnetve.website', 'Idempotency-Key': 'api-order', 'CF-Connecting-IP': '203.0.113.8' }, body: JSON.stringify(goodInput()),
  }), db, { siteOrigin: 'https://mangtheomotnetve.website', rateLimitSalt: 'test-secret' });
  assert.equal(duplicate.status, 200);
  const tooLarge = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Idempotency-Key': 'large' }, body: JSON.stringify(goodInput({ note: 'x'.repeat(13000) })),
  }), db);
  assert.equal(tooLarge.status, 413);
  for (let i = 0; i < 8; i++) {
    const response = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'rate-' + i, 'CF-Connecting-IP': '203.0.113.8' }, body: JSON.stringify(goodInput()),
    }), db, { rateLimitSalt: 'test-secret' });
    if (i < 7) assert.equal(response.status, 201);
    else assert.equal(response.status, 429);
  }
  db.close();
});

test('preorder email: fake binding sends customer and internal mail after persistence', async () => {
  const db = createDb();
  await openProduct(db, 40000);
  const sent = [];
  const binding = { send: async (message) => { sent.push(message); } };
  const response = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'email-test' },
    body: JSON.stringify(goodInput({ name: 'An & Bùi' })),
  }), db, { emailConfig: { binding, from: 'no-reply@example.test', notifyTo: 'team@example.test' } });
  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.emailStatus, 'sent');
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, 'an@example.test');
  assert.equal(sent[1].to, 'team@example.test');
  assert.match(sent[0].html, /An &amp; Bùi/);
  assert.match(sent[0].text, /40\.000/);
  assert.match(sent[0].text, /chưa thanh toán/i);
  assert.match(sent[0].text, /không.*cam kết ngày giao hàng/i);
  assert.ok(!JSON.stringify(sent).includes('19077352683012'));
  assert.ok(!JSON.stringify(sent).toLowerCase().includes('mã giao dịch'));
  const duplicate = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'email-test' },
    body: JSON.stringify(goodInput({ name: 'An & Bùi' })),
  }), db, { emailConfig: { binding, from: 'no-reply@example.test', notifyTo: 'team@example.test' } });
  assert.equal((await duplicate.json()).duplicate, true);
  assert.equal(sent.length, 2);
  const state = await db.prepare('SELECT email_status, email_attempts FROM preorder_email_state WHERE preorder_id = ?').bind(result.preorder.id).first();
  assert.equal(state.email_status, 'sent');
  assert.equal(state.email_attempts, 1);
  assert.equal(isSafeEmailAddress('bad\r\nBcc:x@y.test'), false);
  assert.equal(escapeEmailHtml('<safe>'), '&lt;safe&gt;');
  db.close();
});

test('preorder email: delivery failure leaves durable order with sanitized status', async () => {
  const db = createDb();
  await openProduct(db, 10000);
  const response = await handlePublicPreorderRequest(new Request('https://mangtheomotnetve.website/api/preorders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'email-fail' }, body: JSON.stringify(goodInput()),
  }), db, { emailConfig: { binding: { send: async () => { const error = new Error('private provider detail'); error.code = 'TEMP_FAIL'; throw error; } }, from: 'no-reply@example.test', notifyTo: 'team@example.test' } });
  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.emailStatus, 'failed');
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM preorders').first()).count, 1);
  const state = await db.prepare('SELECT email_status, email_last_error FROM preorder_email_state WHERE preorder_id = ?').bind(result.preorder.id).first();
  assert.equal(state.email_status, 'failed');
  assert.equal(state.email_last_error, 'TEMP_FAIL');
  assert.equal((await db.prepare('SELECT email_attempts FROM preorder_email_state WHERE preorder_id = ?').bind(result.preorder.id).first()).email_attempts, 3);
  db.close();
});

test('preorder Studio API: RBAC, status audit, CSV injection, and test-only archive', async () => {
  const db = createDb();
  await openProduct(db);
  const created = await createPreorder({ db, input: goodInput({ name: '=SUM(1,1)' }), idempotencyKey: 'studio-one', ipAddress: '10.0.0.3', isTest: true });
  const session = (role) => ({ user: { email: `${role}@example.test`, role }, isDev: true, expiresAt: Date.now() + 10000 });
  const request = (url, method = 'GET', body) => new Request('http://127.0.0.1' + url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const denied = await handlePreorderAdminRequest(request('/api/preorders'), db, session('editor'));
  assert.equal(denied.status, 403);
  const list = await handlePreorderAdminRequest(request('/api/preorders?test=true'), db, session('reviewer'));
  assert.equal((await list.json()).preorders.length, 1);
  const changed = await handlePreorderAdminRequest(request(`/api/preorders/${created.preorder.id}/status`, 'POST', { status: 'contacted' }), db, session('reviewer'));
  assert.equal(changed.status, 200);
  const resendMessages = [];
  const resent = await handlePreorderAdminRequest(request(`/api/preorders/${created.preorder.id}/email/retry`, 'POST', {}), db, session('reviewer'), {
    binding: { send: async (message) => resendMessages.push(message) }, from: 'no-reply@example.test', notifyTo: 'team@example.test',
  });
  assert.equal(resent.status, 200);
  assert.equal((await resent.json()).status, 'sent');
  assert.equal(resendMessages.length, 2);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'RETRY_PREORDER_EMAIL'").first()).count, 1);
  const csv = await handlePreorderAdminRequest(request('/api/preorders/export.csv?test=true'), db, session('admin'));
  const csvBytes = new Uint8Array(await csv.arrayBuffer());
  assert.deepEqual([...csvBytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  const csvText = new TextDecoder().decode(csvBytes);
  assert.ok(csvText.includes("'=SUM(1,1)"));
  assert.ok(csvText.includes('customer_email'));
  const audit = await db.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'EXPORT_PREORDERS_CSV'").first();
  assert.equal(audit.count, 1);
  const archive = await handlePreorderAdminRequest(request(`/api/preorders/${created.preorder.id}/archive-test`, 'POST', {}), db, session('admin'));
  assert.equal(archive.status, 200);
  const archived = await db.prepare('SELECT archived_at FROM preorders WHERE id = ?').bind(created.preorder.id).first();
  assert.ok(archived.archived_at);
  db.close();
});

test('preorder privacy: unauthenticated Studio access is denied and public config excludes customer fields', async () => {
  const db = createDb();
  await openProduct(db);
  await createPreorder({ db, input: goodInput({ name: 'Privacy Marker', contactType: 'email', contact: 'privacy@example.invalid' }), idempotencyKey: 'privacy-test', ipAddress: '10.0.0.4' });
  const response = await worker.fetch(new Request('https://studio.mangtheomotnetve.website/api/preorders'), {
    DB: db, BUCKET: {}, STUDIO_ENVIRONMENT: 'production',
  }, {});
  assert.notEqual(response.status, 200);
  const publicConfig = JSON.stringify(await listPreorderProducts(db));
  assert.ok(!publicConfig.includes('Privacy Marker'));
  assert.ok(!publicConfig.includes('privacy@example.invalid'));
  db.close();
});
