import type { AuthSession, D1Database } from '../types.js';
import { assertCanPublish, assertCanReview } from '../auth/rbac.js';
import { validateCsrf } from '../auth/middleware.js';
import { StudioDbClient } from '../db/client.js';
import { getDefaultModuleData } from '../schemas/index.js';
import { listPreorderProducts, PREORDER_STATUSES, type PreorderStatus } from './service.js';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
});

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function filters(url: URL) {
  const status = url.searchParams.get('status');
  const product = url.searchParams.get('product');
  const isTest = url.searchParams.get('test');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (status && PREORDER_STATUSES.includes(status as PreorderStatus)) { clauses.push('status = ?'); values.push(status); }
  if (product && ['chuon-chuon-tre-kem-de', 'moc-khoa'].includes(product)) { clauses.push('product_id = ?'); values.push(product); }
  if (isTest === 'true' || isTest === 'false') { clauses.push('is_test = ?'); values.push(isTest === 'true' ? 1 : 0); }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) { clauses.push('created_at >= ?'); values.push(`${from}T00:00:00.000Z`); }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) { clauses.push('created_at < ?'); values.push(`${to}T23:59:59.999Z`); }
  if (q) { clauses.push('(order_code LIKE ? OR customer_name LIKE ? OR contact_value LIKE ?)'); values.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  clauses.push('archived_at IS NULL');
  return { where: clauses.join(' AND '), values };
}

export async function handlePreorderAdminRequest(request: Request, db: D1Database, session: AuthSession): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const user = session.user;
  if (!path.startsWith('/api/preorders') && !path.startsWith('/api/preorder-products')) return null;

  try {
    assertCanReview(user.role);
    if (path === '/api/preorders' && method === 'GET') {
      const filter = filters(url);
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
      const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
      const result = await db.prepare(`SELECT id, order_code, product_id, product_name, quantity, customer_name, contact_type, contact_value, pickup, customer_note, unit_price, status, is_test, created_at, updated_at FROM preorders WHERE ${filter.where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...filter.values, limit, offset).all<any>();
      return json({ success: true, preorders: result.results || [], limit, offset });
    }
    if (path === '/api/preorders/export.csv' && method === 'GET') {
      const filter = filters(url);
      const result = await db.prepare(`SELECT order_code, product_name, quantity, customer_name, contact_type, contact_value, pickup, customer_note, unit_price, status, is_test, created_at FROM preorders WHERE ${filter.where} ORDER BY created_at DESC LIMIT 5000`)
        .bind(...filter.values).all<any>();
      await db.prepare("INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) VALUES (?, ?, 'EXPORT_PREORDERS_CSV', 'preorders', ?, ?)")
        .bind(crypto.randomUUID(), user.email, JSON.stringify({ count: (result.results || []).length, filters: { status: url.searchParams.get('status'), product: url.searchParams.get('product'), test: url.searchParams.get('test') } }), new Date().toISOString()).run();
      const columns = ['order_code', 'product_name', 'quantity', 'customer_name', 'contact_type', 'contact_value', 'pickup', 'customer_note', 'unit_price', 'status', 'is_test', 'created_at'];
      const rows = [columns, ...(result.results || []).map((row) => columns.map((column) => row[column]))];
      const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="don-dat-truoc.csv"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    const detailsMatch = path.match(/^\/api\/preorders\/([^/]+)$/);
    if (detailsMatch && method === 'GET') {
      const order = await db.prepare('SELECT * FROM preorders WHERE id = ? AND archived_at IS NULL').bind(detailsMatch[1]).first<any>();
      if (!order) return json({ success: false, error: 'Không tìm thấy đơn đặt trước.' }, 404);
      const events = await db.prepare('SELECT actor, action, old_value, new_value, note, created_at FROM preorder_events WHERE preorder_id = ? ORDER BY created_at DESC').bind(order.id).all();
      return json({ success: true, preorder: order, events: events.results || [] });
    }
    const statusMatch = path.match(/^\/api\/preorders\/([^/]+)\/status$/);
    if (statusMatch && method === 'POST') {
      validateCsrf(request);
      const body = await request.json() as { status?: string; note?: string };
      if (!PREORDER_STATUSES.includes(body.status as PreorderStatus)) return json({ success: false, error: 'Trạng thái không hợp lệ.' }, 400);
      if (body.note && (body.note.length > 500 || /[<>\u0000-\u001f]/.test(body.note))) return json({ success: false, error: 'Ghi chú tối đa 500 ký tự.' }, 400);
      const current = await db.prepare('SELECT status FROM preorders WHERE id = ? AND archived_at IS NULL').bind(statusMatch[1]).first<{ status: string }>();
      if (!current) return json({ success: false, error: 'Không tìm thấy đơn đặt trước.' }, 404);
      const now = new Date().toISOString();
      const update = db.prepare('UPDATE preorders SET status = ?, updated_at = ? WHERE id = ? AND status = ? AND archived_at IS NULL').bind(body.status, now, statusMatch[1], current.status);
      const event = db.prepare(`INSERT INTO preorder_events (id, preorder_id, actor, action, old_value, new_value, note, created_at)
        SELECT ?, ?, ?, 'status_changed', ?, ?, ?, ? WHERE changes() = 1`)
        .bind(crypto.randomUUID(), statusMatch[1], user.email, current.status, body.status, body.note || null, now);
      const audit = db.prepare(`INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at)
        SELECT ?, ?, 'UPDATE_PREORDER_STATUS', 'preorders', ?, ? WHERE changes() = 1`)
        .bind(crypto.randomUUID(), user.email, JSON.stringify({ preorderId: statusMatch[1], from: current.status, to: body.status }), now);
      await db.batch([update, event, audit]);
      return json({ success: true, status: body.status });
    }
    const noteMatch = path.match(/^\/api\/preorders\/([^/]+)\/notes$/);
    if (noteMatch && method === 'POST') {
      validateCsrf(request);
      const body = await request.json() as { note?: string };
      const note = typeof body.note === 'string' ? body.note.trim() : '';
      if (!note || note.length > 500 || /[<>\u0000-\u001f]/.test(note)) return json({ success: false, error: 'Ghi chú nội bộ cần từ 1 đến 500 ký tự.' }, 400);
      const order = await db.prepare('SELECT id FROM preorders WHERE id = ? AND archived_at IS NULL').bind(noteMatch[1]).first();
      if (!order) return json({ success: false, error: 'Không tìm thấy đơn đặt trước.' }, 404);
      const now = new Date().toISOString();
      await db.prepare("INSERT INTO preorder_events (id, preorder_id, actor, action, note, created_at) VALUES (?, ?, ?, 'internal_note', ?, ?)")
        .bind(crypto.randomUUID(), noteMatch[1], user.email, note, now).run();
      await db.prepare("INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) VALUES (?, ?, 'ADD_PREORDER_NOTE', 'preorders', ?, ?)")
        .bind(crypto.randomUUID(), user.email, JSON.stringify({ preorderId: noteMatch[1] }), now).run();
      return json({ success: true });
    }
    const archiveMatch = path.match(/^\/api\/preorders\/([^/]+)\/archive-test$/);
    if (archiveMatch && method === 'POST') {
      validateCsrf(request);
      assertCanPublish(user.role);
      const order = await db.prepare('SELECT is_test FROM preorders WHERE id = ? AND archived_at IS NULL').bind(archiveMatch[1]).first<{ is_test: number }>();
      if (!order) return json({ success: false, error: 'Không tìm thấy đơn đặt trước.' }, 404);
      if (order.is_test !== 1) return json({ success: false, error: 'Chỉ có thể ẩn đơn được đánh dấu isTest.' }, 403);
      const now = new Date().toISOString();
      await db.batch([
        db.prepare('UPDATE preorders SET archived_at = ?, updated_at = ? WHERE id = ? AND is_test = 1 AND archived_at IS NULL').bind(now, now, archiveMatch[1]),
        db.prepare("INSERT INTO preorder_events (id, preorder_id, actor, action, created_at) VALUES (?, ?, ?, 'archived_test', ?)").bind(crypto.randomUUID(), archiveMatch[1], user.email, now),
        db.prepare("INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) VALUES (?, ?, 'ARCHIVE_TEST_PREORDER', 'preorders', ?, ?)").bind(crypto.randomUUID(), user.email, JSON.stringify({ preorderId: archiveMatch[1] }), now),
      ]);
      return json({ success: true });
    }
    if (path === '/api/preorder-products' && method === 'GET') return json({ success: true, products: await listPreorderProducts(db) });
    const configMatch = path.match(/^\/api\/preorder-products\/([a-z0-9-]+)$/);
    if (configMatch && method === 'POST') {
      validateCsrf(request);
      assertCanPublish(user.role);
      const productId = configMatch[1];
      if (!['chuon-chuon-tre-kem-de', 'moc-khoa'].includes(productId)) return json({ success: false, error: 'Sản phẩm không hợp lệ.' }, 404);
      const body = await request.json() as { isOpen?: boolean; officialPrice?: number | null; pickup?: string | null };
      if (typeof body.isOpen !== 'boolean') return json({ success: false, error: 'Thiếu trạng thái mở đặt trước.' }, 400);
      const price = body.officialPrice == null ? null : body.officialPrice;
      if (price !== null && (!Number.isInteger(price) || price <= 0 || price > 100_000_000)) return json({ success: false, error: 'Giá chốt phải là số nguyên dương hoặc để trống.' }, 400);
      const pickup = body.pickup === null ? null : typeof body.pickup === 'string' ? body.pickup.trim() : '';
      if (pickup && (pickup.length > 120 || /[<>\u0000-\u001f]/.test(pickup))) return json({ success: false, error: 'Cách nhận hàng tối đa 120 ký tự.' }, 400);
      if (body.isOpen && !pickup) return json({ success: false, error: 'Cần xác định cách nhận trước khi mở đặt trước.' }, 400);
      const now = new Date().toISOString();
      const client = new StudioDbClient(db);
      const draft = await client.getDraft<any>('products');
      const products = draft?.data || getDefaultModuleData('products');
      products[productId] = { ...products[productId], preorderOpen: body.isOpen, officialPrice: price, pickup: pickup || null };
      const save = await client.saveDraft('products', products, draft?.revisionHash || null, user.email, `Cập nhật cấu hình đặt trước: ${productId}`);
      await db.prepare(`INSERT INTO preorder_products (product_id, is_open, official_price, pickup, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(product_id) DO UPDATE SET is_open = excluded.is_open, official_price = excluded.official_price, pickup = excluded.pickup, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
        .bind(productId, body.isOpen ? 1 : 0, price, pickup || null, now, user.email).run();
      await db.prepare("INSERT INTO audit_logs (id, user_email, action, module_key, details_json, created_at) VALUES (?, ?, 'UPDATE_PREORDER_PRODUCT', 'preorders', ?, ?)")
        .bind(crypto.randomUUID(), user.email, JSON.stringify({ productId, isOpen: body.isOpen }), now).run();
      return json({ success: true, product: (await listPreorderProducts(db)).find((item) => item.productId === productId), revisionHash: save.draft.revisionHash });
    }
    return json({ success: false, error: 'Không tìm thấy API.' }, 404);
  } catch (error) {
    const status = typeof (error as any)?.status === 'number' ? (error as any).status : 403;
    return json({ success: false, error: status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : 'Không thể xử lý yêu cầu.' }, status);
  }
}
