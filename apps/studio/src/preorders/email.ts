import type { D1Database, SendEmailBinding } from '../types.js';
import { DEFAULT_PROJECT_DATA } from '../schemas/index.js';

export type PreorderEmailStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface PreorderEmailConfig {
  binding?: SendEmailBinding;
  from?: string;
  notifyTo?: string;
  replyTo?: string;
}

interface PreorderMailRow {
  id: string;
  order_code: string;
  product_name: string;
  quantity: number;
  customer_name: string;
  pickup: string;
  unit_price: number | null;
  customer_email: string;
  customer_phone: string | null;
  email_status: PreorderEmailStatus;
  email_attempts: number;
  email_sent_at: string | null;
  team_notified_at: string | null;
}

const MAX_EMAIL_ATTEMPTS = 3;
const PICKUP_COPY = 'Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước.';
const NO_PAYMENT_COPY = 'Đây là đơn đặt trước, chưa thanh toán. Email này không xác nhận thanh toán hoặc cam kết ngày giao hàng.';
const CONTACTS = DEFAULT_PROJECT_DATA.contacts!;

export function isSafeEmailAddress(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && !/[\r\n\u0000-\u001f<>]/.test(value)
    && /^[^\s@,;:]+@[^\s@,;:]+\.[^\s@,;:]+$/.test(value);
}

export function escapeEmailHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

function emailErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && /^[A-Z0-9_-]{1,40}$/i.test(code) ? code : 'SEND_FAILED';
}

function validConfiguration(config: PreorderEmailConfig): boolean {
  return Boolean(config.binding && isSafeEmailAddress(config.from) && isSafeEmailAddress(config.notifyTo)
    && (!config.replyTo || isSafeEmailAddress(config.replyTo)));
}

export async function sendPreorderEmails(
  db: D1Database,
  preorderId: string,
  config: PreorderEmailConfig,
  options: { explicitResend?: boolean } = {},
): Promise<{ status: PreorderEmailStatus; errorCode?: string }> {
  const order = await db.prepare(`SELECT p.id, p.order_code, p.product_name, p.quantity, p.customer_name, p.pickup, p.unit_price,
      e.customer_email, e.customer_phone, e.email_status, e.email_attempts, e.email_sent_at, e.team_notified_at
    FROM preorders p LEFT JOIN preorder_email_state e ON e.preorder_id = p.id
    WHERE p.id = ? AND p.archived_at IS NULL`).bind(preorderId).first<PreorderMailRow>();
  if (!order || !order.customer_email) return { status: 'skipped' };

  const priorStatus = order.email_status || 'skipped';
  if (priorStatus === 'sent' && !options.explicitResend) return { status: 'sent' };
  if (!validConfiguration(config)) {
    await db.prepare("UPDATE preorder_email_state SET email_status = 'skipped', email_last_error = 'CONFIG_MISSING' WHERE preorder_id = ?")
      .bind(preorderId).run();
    return { status: 'skipped', errorCode: 'CONFIG_MISSING' };
  }
  let attempts = options.explicitResend ? 0 : Number(order.email_attempts || 0);
  if (attempts >= MAX_EMAIL_ATTEMPTS) {
    return { status: priorStatus === 'sent' ? 'sent' : 'failed', errorCode: 'RETRY_LIMIT' };
  }

  const now = new Date().toISOString();
  let emailSentAt = order.email_sent_at;
  let teamNotifiedAt = order.team_notified_at;
  if (options.explicitResend) {
    emailSentAt = null;
    teamNotifiedAt = null;
    await db.prepare("UPDATE preorder_email_state SET email_status = 'pending', email_attempts = 0, email_last_error = NULL, email_sent_at = NULL, team_notified_at = NULL WHERE preorder_id = ?")
      .bind(preorderId).run();
  }

  const total = order.unit_price === null ? null : order.unit_price * order.quantity;
  const money = (amount: number | null) => amount === null ? 'Chưa có giá chốt; nhóm sẽ xác nhận khi liên hệ.' : `${amount.toLocaleString('vi-VN')}đ`;
  const phoneLines = CONTACTS.people.map((person) => `${person.name}: ${person.phone}`).join('\n');
  const htmlContacts = CONTACTS.people.map((person) => `<li>${escapeEmailHtml(person.name)}: ${escapeEmailHtml(person.phone)}</li>`).join('');
  const htmlPickup = escapeEmailHtml(PICKUP_COPY);
  const htmlNoPayment = escapeEmailHtml(NO_PAYMENT_COPY);
  const customerText = [
    `Xin chào ${order.customer_name},`,
    `Nhóm đã ghi nhận đơn đặt trước ${order.order_code}.`,
    `Sản phẩm: ${order.product_name}`,
    `Số lượng: ${order.quantity}`,
    `Đơn giá: ${money(order.unit_price)}`,
    `Tạm tính: ${money(total)}`,
    PICKUP_COPY,
    NO_PAYMENT_COPY,
    'Liên hệ nhóm:', phoneLines, `Fanpage: ${CONTACTS.fanpageUrl}`,
  ].join('\n');
  const customerHtml = `<p>Xin chào ${escapeEmailHtml(order.customer_name)},</p><p>Nhóm đã ghi nhận đơn đặt trước <strong>${escapeEmailHtml(order.order_code)}</strong>.</p><ul><li>Sản phẩm: ${escapeEmailHtml(order.product_name)}</li><li>Số lượng: ${escapeEmailHtml(order.quantity)}</li><li>Đơn giá: ${escapeEmailHtml(money(order.unit_price))}</li><li>Tạm tính: ${escapeEmailHtml(money(total))}</li></ul><p>${htmlPickup}</p><p>${htmlNoPayment}</p><p>Liên hệ nhóm:</p><ul>${htmlContacts}</ul><p>Fanpage: <a href="${escapeEmailHtml(CONTACTS.fanpageUrl)}">${escapeEmailHtml(CONTACTS.fanpageUrl)}</a></p>`;
  const teamText = [
    `Đơn đặt trước mới: ${order.order_code}`,
    `Sản phẩm: ${order.product_name}`,
    `Số lượng: ${order.quantity}`,
    `Đơn giá: ${money(order.unit_price)}`,
    `Tạm tính: ${money(total)}`,
    `Người đặt: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    `Điện thoại: ${order.customer_phone || 'Không cung cấp'}`,
    `Cách nhận: ${order.pickup}`,
    NO_PAYMENT_COPY,
  ].join('\n');
  const teamHtml = `<p>Đơn đặt trước mới: <strong>${escapeEmailHtml(order.order_code)}</strong></p><ul><li>Sản phẩm: ${escapeEmailHtml(order.product_name)}</li><li>Số lượng: ${escapeEmailHtml(order.quantity)}</li><li>Đơn giá: ${escapeEmailHtml(money(order.unit_price))}</li><li>Tạm tính: ${escapeEmailHtml(money(total))}</li><li>Người đặt: ${escapeEmailHtml(order.customer_name)}</li><li>Email: ${escapeEmailHtml(order.customer_email)}</li><li>Điện thoại: ${escapeEmailHtml(order.customer_phone || 'Không cung cấp')}</li><li>Cách nhận: ${escapeEmailHtml(order.pickup)}</li></ul><p>${htmlNoPayment}</p>`;
  const common = { from: config.from!, ...(config.replyTo ? { replyTo: config.replyTo } : {}) };

  let lastCode = 'SEND_FAILED';
  while (attempts < MAX_EMAIL_ATTEMPTS) {
    attempts += 1;
    await db.prepare("UPDATE preorder_email_state SET email_status = 'pending', email_attempts = ?, email_last_error = NULL WHERE preorder_id = ?")
      .bind(attempts, preorderId).run();
    try {
      if (!emailSentAt) {
        await config.binding!.send({ ...common, to: order.customer_email, subject: `Đã ghi nhận đơn đặt trước ${order.order_code}`, text: customerText, html: customerHtml });
        emailSentAt = now;
        await db.prepare('UPDATE preorder_email_state SET email_sent_at = ? WHERE preorder_id = ?').bind(now, preorderId).run();
      }
      if (!teamNotifiedAt) {
        await config.binding!.send({ ...common, to: config.notifyTo!, subject: `Có đơn đặt trước mới ${order.order_code}`, text: teamText, html: teamHtml });
        teamNotifiedAt = now;
        await db.prepare('UPDATE preorder_email_state SET team_notified_at = ? WHERE preorder_id = ?').bind(now, preorderId).run();
      }
      await db.prepare("UPDATE preorder_email_state SET email_status = 'sent', email_last_error = NULL WHERE preorder_id = ?").bind(preorderId).run();
      return { status: 'sent' };
    } catch (error) {
      lastCode = emailErrorCode(error);
      await db.prepare("UPDATE preorder_email_state SET email_status = 'failed', email_last_error = ? WHERE preorder_id = ?")
        .bind(lastCode, preorderId).run();
      if (attempts < MAX_EMAIL_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, attempts * 100));
    }
  }
  return { status: 'failed', errorCode: lastCode };
}
