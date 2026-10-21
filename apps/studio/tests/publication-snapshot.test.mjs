import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createPublicationSnapshot, computeSha256 } from '../dist/publish/adapter.js';
import { StudioDbClient } from '../dist/db/client.js';
import { LocalD1Database } from '../dist/db/emulator.js';
import {
  DEFAULT_PROJECT_DATA,
  DEFAULT_JOURNAL_DATA,
  DEFAULT_PRODUCTS_DATA,
  DEFAULT_FINANCE_DATA,
  DEFAULT_TEAM_DATA,
} from '../dist/schemas/index.js';

test('Xuất bản: Tạo bản chụp bất biến (Immutable Snapshot) và tính SHA-256', async () => {
  const drafts = {
    project: DEFAULT_PROJECT_DATA,
    journal: [
      ...DEFAULT_JOURNAL_DATA,
      {
        slug: 'bai-nhap-noi-bo',
        title: 'Bài nháp chưa được duyệt',
        summary: 'Tóm tắt bài nháp',
        category: 'ke-hoach',
        publishedAt: '2026-10-15',
        status: 'draft', // Bản nháp nội bộ
        content: [{ type: 'paragraph', text: 'Nội dung chưa công bố' }],
      },
    ],
    products: DEFAULT_PRODUCTS_DATA,
    finance: DEFAULT_FINANCE_DATA,
    team: DEFAULT_TEAM_DATA,
  };

  const result = await createPublicationSnapshot(drafts, 'v20261011-01');

  assert.equal(result.isEligibleForPublish, true);
  assert.equal(result.snapshot.version, 'v20261011-01');
  assert.ok(result.snapshot.sha256);
  assert.equal(result.snapshot.sha256.length, 64);

  // Bài viết có status draft bị loại bỏ khỏi bản chiếu công khai
  const publicJournal = result.snapshot.modules.journal;
  assert.equal(publicJournal.length, 2);
  assert.equal(publicJournal.some((j) => j.slug === 'bai-nhap-noi-bo'), false);

  // Tài chính chưa đối soát (reconciled: false) thì entries công khai phải rỗng
  const publicFinance = result.snapshot.modules.finance;
  assert.equal(publicFinance.reconciled, false);
  assert.equal(publicFinance.entries.length, 0);
});

test('Xuất bản: cấu hình đặt trước và giá chốt giữ nguyên khi chiếu từ dữ liệu Studio', async () => {
  const result = await createPublicationSnapshot({
    project: DEFAULT_PROJECT_DATA,
    journal: DEFAULT_JOURNAL_DATA,
    products: DEFAULT_PRODUCTS_DATA,
    finance: DEFAULT_FINANCE_DATA,
    team: DEFAULT_TEAM_DATA,
  }, 'preorder-parity');

  assert.equal(result.isEligibleForPublish, true);
  for (const [productId, price] of [['chuon-chuon-tre-kem-de', 40000], ['moc-khoa', 10000]]) {
    const product = result.snapshot.modules.products[productId];
    assert.equal(product.saleStatus, 'unconfirmed');
    assert.equal(product.preorderOpen, true);
    assert.equal(product.officialPrice, price);
    assert.equal(product.pickup, 'Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước');
  }
});

test('Xuất bản: Kiểm tra tính Idempotency và Four-Eyes trong D1', async () => {
  const schemaSql = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf-8');
  const d1 = new LocalD1Database(':memory:', schemaSql);
  const client = new StudioDbClient(d1);

  const snapshot = {
    version: 'v1',
    generatedAt: new Date().toISOString(),
    sha256: 'abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    modules: {
      project: {},
      journal: [],
      products: {},
      finance: {},
      team: {},
    },
  };

  const idempotencyKey = 'req-key-unique-001';

  // Yêu cầu lần 1
  const pub1 = await client.createPublicationRequest(snapshot, 'requester@test.vn', idempotencyKey);
  assert.equal(pub1.status, 'pending_review');

  // Yêu cầu lần 2 với cùng Idempotency Key -> trả về cùng bản ghi, không nhân đôi
  const pub2 = await client.createPublicationRequest(snapshot, 'requester@test.vn', idempotencyKey);
  assert.equal(pub2.id, pub1.id);

  // Four-Eyes: Người yêu cầu không được tự duyệt
  await assert.rejects(
    async () => {
      await client.reviewPublication(pub1.id, 'requester@test.vn', 'approve');
    },
    /Người tạo yêu cầu không được tự duyệt/
  );

  // Người duyệt độc lập (Independent Reviewer) -> Chuyển trạng thái sang approved
  const approved = await client.reviewPublication(pub1.id, 'reviewer1@test.vn', 'approve');
  assert.equal(approved.approvedBy, 'reviewer1@test.vn');
  assert.equal(approved.status, 'approved');
});

test('Xuất bản: Trích xuất Snapshot được duyệt sang dữ liệu tĩnh Astro (Snapshot Consumer)', async () => {
  const { exportApprovedSnapshot } = await import('../dist/publish/consumer.js');
  const tempDir = path.resolve(process.cwd(), 'apps/studio/data/test-export-' + Date.now());

  try {
    const mockSnapshot = {
      snapshotHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      createdAt: new Date().toISOString(),
      modules: ['project', 'journal', 'products', 'finance', 'team'],
      journal: [{ slug: 'bai-1', title: 'Bài 1', status: 'published', content: [] }],
      products: { 'chuon-chuon-tre-kem-de': { status: 'open' } },
      project: { title: 'Dự án MTMNV' },
      finance: { reconciled: false },
      team: { members: [] },
    };

    const res = exportApprovedSnapshot(mockSnapshot, tempDir);
    assert.equal(res.success, true);
    assert.equal(res.filesWritten.length, 3);
    assert.ok(fs.existsSync(path.join(tempDir, 'src/data/published-snapshot.json')));
    assert.ok(fs.existsSync(path.join(tempDir, 'src/data/journal-entries.json')));
    assert.ok(fs.existsSync(path.join(tempDir, 'src/data/product-sales-config.json')));
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});
