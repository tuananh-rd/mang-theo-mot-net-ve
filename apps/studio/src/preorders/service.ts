import type { D1Database } from '../types.js';
import { sendPreorderEmails, type PreorderEmailConfig } from './email.js';

export const PREORDER_STATUSES = ['new', 'contacted', 'confirmed', 'delivered', 'cancelled'] as const;
export type PreorderStatus = (typeof PREORDER_STATUSES)[number];

export interface PreorderProductConfig {
  productId: string;
  isOpen: boolean;
  officialPrice: number | null;
  pickup: string | null;
  updatedAt: string;
  updatedBy: string;
}

export interface CreatePreorderInput {
  productId: unknown;
  quantity: unknown;
  name: unknown;
  contactType: unknown;
  contact: unknown;
  email?: unknown;
  phone?: unknown;
  pickup: unknown;
  note?: unknown;
  consent: unknown;
  website?: unknown;
}

const ALLOWED_PRODUCTS = new Set(['chuon-chuon-tre-kem-de', 'moc-khoa']);
const MAX_BODY_BYTES = 12_000;
const MAX_NOTE_LENGTH = 240;
const MAX_DAILY_REQUESTS_PER_IP = 8;

export class PreorderError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = 'PreorderError';
  }
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function listPreorderProducts(db: D1Database): Promise<PreorderProductConfig[]> {
  const result = await db.prepare(
    'SELECT product_id, is_open, official_price, pickup, updated_at, updated_by FROM preorder_products ORDER BY product_id'
  ).all<any>();
  return (result.results || []).map((row) => ({
    productId: row.product_id,
    isOpen: row.is_open === 1,
    officialPrice: row.official_price === null ? null : Number(row.official_price),
    pickup: row.pickup,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }));
}

export async function createPreorder(options: {
  db: D1Database;
  input: CreatePreorderInput;
  idempotencyKey: string;
  ipAddress: string;
  now?: Date;
  isTest?: boolean;
  rateLimitSalt?: string;
}): Promise<{ preorder: Record<string, unknown>; duplicate: boolean }> {
  const { db, input } = options;
  const idempotencyKey = options.idempotencyKey.trim();
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > MAX_BODY_BYTES) throw new PreorderError('Nội dung gửi quá lớn.', 413);
  if (!idempotencyKey || idempotencyKey.length > 120) throw new PreorderError('Thiếu mã gửi đơn hợp lệ. Vui lòng thử lại.', 400);
  if (typeof input.website === 'string' && input.website.trim()) throw new PreorderError('Không thể tiếp nhận yêu cầu này.', 400);
  if (input.consent !== true) throw new PreorderError('Bạn cần đồng ý để nhóm xử lý thông tin liên hệ.', 400);
  if (typeof input.productId !== 'string' || !ALLOWED_PRODUCTS.has(input.productId)) throw new PreorderError('Sản phẩm không hợp lệ.', 400);
  if (!Number.isInteger(input.quantity) || Number(input.quantity) < 1 || Number(input.quantity) > 50) throw new PreorderError('Số lượng phải từ 1 đến 50.', 400);

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 2 || name.length > 100 || /[<>\u0000-\u001f]/.test(name)) throw new PreorderError('Họ tên cần từ 2 đến 100 ký tự hợp lệ.', 400);
  const email = typeof input.email === 'string' ? input.email.trim() : input.contactType === 'email' && typeof input.contact === 'string' ? input.contact.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : input.contactType === 'phone' && typeof input.contact === 'string' ? input.contact.trim() : '';
  if (/[\r\n\u0000-\u001f<>]/.test(email) || email.length > 254 || !/^[^\s@,;:]+@[^\s@,;:]+\.[^\s@,;:]+$/.test(email)) throw new PreorderError('Email nhận xác nhận đơn không đúng định dạng.', 400);
  if (phone && !/^\+?[0-9][0-9 ()\-]{7,18}$/.test(phone)) throw new PreorderError('Số điện thoại không đúng định dạng.', 400);
  const contact = email;
  const pickup = typeof input.pickup === 'string' ? input.pickup.trim() : '';
  if (!pickup || pickup.length > 120 || /[<>\u0000-\u001f]/.test(pickup)) throw new PreorderError('Chọn cách nhận hàng.', 400);
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length > MAX_NOTE_LENGTH || /[<>\u0000-\u001f]/.test(note)) throw new PreorderError('Ghi chú tối đa 240 ký tự và không chứa ký tự không hợp lệ.', 400);

  const idemHash = await sha256(idempotencyKey);
  const duplicate = await db.prepare('SELECT id, order_code, product_id, quantity, status, created_at FROM preorders WHERE idempotency_hash = ?')
    .bind(idemHash).first<any>();
  if (duplicate) return { preorder: publicOrder(duplicate), duplicate: true };

  const config = await db.prepare('SELECT product_id, is_open, official_price, pickup FROM preorder_products WHERE product_id = ?')
    .bind(input.productId).first<any>();
  if (!config || config.is_open !== 1) throw new PreorderError('Sản phẩm hiện chưa mở đặt trước.', 409);
  if (config.pickup && pickup !== config.pickup) throw new PreorderError('Cách nhận hàng đã thay đổi. Vui lòng tải lại biểu mẫu.', 409);

  const now = options.now || new Date();
  const day = now.toISOString().slice(0, 10);
  const ipHash = await sha256(`${options.rateLimitSalt || 'local-only-rate-limit'}:${day}:${options.ipAddress || 'unknown'}`);
  const rate = await db.prepare('SELECT request_count FROM preorder_rate_limits WHERE bucket_hash = ? AND bucket_day = ?').bind(ipHash, day).first<{ request_count: number }>();
  if ((rate?.request_count || 0) >= MAX_DAILY_REQUESTS_PER_IP) throw new PreorderError('Đã đạt giới hạn yêu cầu trong ngày. Hãy liên hệ nhóm trực tiếp.', 429);

  const id = crypto.randomUUID();
  const orderCode = `MTMNV-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const createdAt = now.toISOString();
  const nameByProduct: Record<string, string> = {
    'chuon-chuon-tre-kem-de': 'Chuồn chuồn tre 12 cm kèm đế',
    'moc-khoa': 'Móc khóa Lăng Kính',
  };
  const statements = [
    db.prepare(`INSERT INTO preorders (id, order_code, product_id, product_name, quantity, customer_name, contact_type, contact_value, pickup, customer_note, unit_price, status, is_test, idempotency_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`)
      .bind(id, orderCode, input.productId, nameByProduct[input.productId], input.quantity, name, 'email', contact, pickup, note || null, config.official_price, options.isTest ? 1 : 0, idemHash, createdAt, createdAt),
    db.prepare(`INSERT INTO preorder_email_state (preorder_id, customer_email, customer_phone, email_status, email_attempts) VALUES (?, ?, ?, 'pending', 0)`)
      .bind(id, email, phone || null),
    db.prepare(`INSERT INTO preorder_events (id, preorder_id, actor, action, old_value, new_value, note, created_at) VALUES (?, ?, ?, 'created', NULL, 'new', NULL, ?)`)
      .bind(crypto.randomUUID(), id, 'public-form', createdAt),
    db.prepare(`INSERT INTO preorder_rate_limits (bucket_hash, bucket_day, request_count) VALUES (?, ?, 1)
      ON CONFLICT(bucket_hash, bucket_day) DO UPDATE SET request_count = request_count + 1`)
      .bind(ipHash, day),
  ];
  try {
    const results = await db.batch(statements);
    if (results.some((result) => result.success === false)) throw new Error('D1 batch failed');
  } catch {
    const retried = await db.prepare('SELECT id, order_code, product_id, quantity, status, created_at FROM preorders WHERE idempotency_hash = ?')
      .bind(idemHash).first<any>();
    if (retried) return { preorder: publicOrder(retried), duplicate: true };
    throw new PreorderError('Không thể lưu đơn lúc này. Vui lòng thử lại sau.', 503);
  }
  return { preorder: { id, orderCode, productId: input.productId, quantity: input.quantity, status: 'new', unitPrice: config.official_price, isTest: Boolean(options.isTest), createdAt }, duplicate: false };
}

function publicOrder(row: any): Record<string, unknown> {
  return { id: row.id, orderCode: row.order_code, productId: row.product_id, quantity: row.quantity, status: row.status, createdAt: row.created_at };
}

export async function handlePublicPreorderRequest(request: Request, db: D1Database, options: {
  siteOrigin?: string; extraOrigins?: string[]; rateLimitSalt?: string; isTest?: boolean;
  emailConfig?: PreorderEmailConfig; waitUntil?: (promise: Promise<unknown>) => void;
} = {}): Promise<Response> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = options.siteOrigin || 'https://mangtheomotnetve.website';
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' });
  if (origin && origin !== allowedOrigin && !(options.extraOrigins || []).includes(origin)) return new Response(JSON.stringify({ error: 'Nguồn gửi không được phép.' }), { status: 403, headers });
  if (origin) headers.set('Access-Control-Allow-Origin', allowedOrigin);
  if (origin && options.extraOrigins?.includes(origin)) headers.set('Access-Control-Allow-Origin', origin);
  if (request.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
    headers.set('Access-Control-Max-Age', '600');
    return new Response(null, { status: 204, headers });
  }
  const pathname = new URL(request.url).pathname;
  if (request.method === 'GET' && pathname === '/api/preorders/config') {
    const products = await listPreorderProducts(db);
    const publicProducts = products.filter((item) => item.isOpen).map((item) => ({
      productId: item.productId,
      name: item.productId === 'chuon-chuon-tre-kem-de' ? 'Chuồn chuồn tre 12 cm kèm đế' : 'Móc khóa Lăng Kính',
      officialPrice: item.officialPrice,
      pickup: item.pickup,
    }));
    return new Response(JSON.stringify({ products: publicProducts }), { status: 200, headers });
  }
  if (request.method !== 'POST' || pathname !== '/api/preorders') return new Response(JSON.stringify({ error: 'Không tìm thấy API.' }), { status: 404, headers });
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) return new Response(JSON.stringify({ error: 'Nội dung gửi quá lớn.' }), { status: 413, headers });
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return new Response(JSON.stringify({ error: 'Nội dung gửi quá lớn.' }), { status: 413, headers });
    if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
      return new Response(JSON.stringify({ error: 'Định dạng yêu cầu không được hỗ trợ.' }), { status: 415, headers });
    }
    let body: CreatePreorderInput;
    try { body = JSON.parse(rawBody) as CreatePreorderInput; }
    catch { return new Response(JSON.stringify({ error: 'Nội dung gửi không hợp lệ.' }), { status: 400, headers }); }
    const result = await createPreorder({
      db, input: body, idempotencyKey: request.headers.get('Idempotency-Key') || '',
      ipAddress: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown',
      isTest: Boolean(options.isTest),
      rateLimitSalt: options.rateLimitSalt,
    });
    let emailStatus = result.duplicate ? undefined : 'pending';
    if (!result.duplicate) {
      const sending = sendPreorderEmails(db, String(result.preorder.id), options.emailConfig || {});
      if (options.waitUntil && options.emailConfig?.binding) options.waitUntil(sending);
      else emailStatus = (await sending).status;
    }
    return new Response(JSON.stringify({ success: true, duplicate: result.duplicate, preorder: result.preorder, ...(emailStatus ? { emailStatus } : {}) }), { status: result.duplicate ? 200 : 201, headers });
  } catch (error) {
    const known = error instanceof PreorderError;
    const status = known ? error.status : 503;
    return new Response(JSON.stringify({ success: false, error: known ? error.message : 'Không thể tiếp nhận yêu cầu lúc này.' }), { status, headers });
  }
}
