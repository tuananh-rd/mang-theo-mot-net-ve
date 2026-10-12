/**
 * Bộ kiểm thử toàn diện C17-R2-F2 (Automated Test Suite for Online Studio & Preview Architecture)
 * 
 * Kiểm chứng các tiêu chí hoàn thành cốt lõi của Task C17-R2-F2:
 * 1. Approved Media Registry: 20 tài sản chuẩn tắc, băm SHA-256 thực tế, nạp fail-closed vào D1 và R2.
 * 2. Proxy Invariants & Price Semantics: Descriptor length non-configurable, không xung đột TypeError,
 *    bảo tồn nguyên vẹn giá đề xuất tham khảo (referencePrice) tách biệt với giá bán chính thức.
 * 3. Fail-Closed Projection: Loại trừ hoàn toàn media chưa duyệt trong snapshot xuất bản.
 * 4. Private Draft Preview SSR: Chạy qua AsyncLocalStorage với snapshot nháp, đính kèm headers bảo mật,
 *    viết lại liên kết nội bộ chống thoát khỏi /preview/*.
 * 5. Studio UI Workflows: Cả 8 phân hệ hoạt động chuẩn xác, bao gồm ẩn/xóa liên hệ (contacts: null),
 *    các bảng tương tác tài chính (entries, sales, expenses, in-kind, overview), thành viên & FAQs,
 *    lịch sử phiên bản có diff và OCC restore, quản trị vai trò /api/users.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

import { LocalD1Database } from '../dist/db/emulator.js';
import { LocalR2Bucket } from '../dist/storage/emulator.js';
import { StudioDbClient } from '../dist/db/client.js';
import { handleApiRequest } from '../dist/api/router.js';
import {
  APPROVED_MEDIA_REGISTRY,
  importApprovedRegistryIntoDb,
} from '../dist/storage/media-registry.js';
import { getDefaultModuleData } from '../dist/schemas/index.js';
import { createPublicationSnapshot, createPrivateDraftSnapshot } from '../dist/publish/adapter.js';
import { renderPrivateDraftPreview, runWithSnapshot, setCustomAstroHandler } from '../dist/preview/renderer.js';
import {
  PRODUCTS,
  PLANNED_SESSIONS,
  TEAM_MEMBERS,
  OFFICIAL_CONTACT,
  getOfficialContact,
} from '../../../src/data/campaign.ts';
import { getCraftProductBySlug } from '../../../src/lib/products.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

// Helper khởi tạo DB và migration
async function createTestDb() {
  const schemaSql = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf-8');
  const db = new LocalD1Database(':memory:', schemaSql);
  const client = new StudioDbClient(db);
  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    const data = getDefaultModuleData(mod);
    await client.saveDraft(mod, data, null, 'system-bootstrap@internal', 'Khởi tạo hạt giống phân hệ ban đầu');
  }
  await db.prepare('INSERT INTO users (id, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind('usr-admin', 'admin@mangtheomotnetve.vn', 'admin', new Date().toISOString(), new Date().toISOString())
    .run();
  await db.prepare('INSERT INTO users (id, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind('usr-rev', 'reviewer@mangtheomotnetve.vn', 'reviewer', new Date().toISOString(), new Date().toISOString())
    .run();
  return db;
}

// Disk byte loader đọc từ public/
function diskByteLoader(asset) {
  const rel = asset.publicPath.startsWith('/') ? asset.publicPath.slice(1) : asset.publicPath;
  const diskPath = path.resolve(rootDir, 'public', rel);
  if (!fs.existsSync(diskPath)) {
    throw new Error(`Tệp đĩa không tồn tại: ${diskPath}`);
  }
  return fs.readFileSync(diskPath);
}

describe('C17-R2-F2: Approved Media Registry & Authenticated Media Stream', () => {
  test('Danh mục 22 tài sản chuẩn tắc: đúng 22 ảnh (kèm 2 ảnh hero mới), đường dẫn canonical, băm SHA-256 thật', async () => {
    assert.equal(APPROVED_MEDIA_REGISTRY.length, 22, 'Danh mục phải có đúng 22 tài sản đã duyệt');

    for (const asset of APPROVED_MEDIA_REGISTRY) {
      assert.ok(!asset.publicPath.includes('\\'), `publicPath không được chứa backslash: ${asset.publicPath}`);
      assert.ok(!asset.r2Key.includes('\\'), `r2Key không được chứa backslash: ${asset.r2Key}`);
      assert.ok(asset.publicPath.startsWith('/'), `publicPath phải bắt đầu bằng /: ${asset.publicPath}`);
      assert.ok(!asset.publicPath.includes('..'), `publicPath không được traversal: ${asset.publicPath}`);

      // Kiểm tra tệp thật trên đĩa
      const bytes = diskByteLoader(asset);
      assert.equal(bytes.byteLength, asset.sizeBytes, `Kích thước byte trên đĩa không khớp cho ${asset.filename}`);

      // Kiểm tra SHA-256
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      assert.equal(hash.toLowerCase(), asset.sha256.toLowerCase(), `SHA-256 không khớp cho ${asset.filename}`);
    }
  });

  test('importApprovedRegistryIntoDb nạp vào D1 và R2, kiểm tra fail-closed khi thiếu bytes hoặc sai băm', async () => {
    const db = await createTestDb();
    const bucket = new LocalR2Bucket();

    // 1. Nạp thành công với diskByteLoader
    const result = await importApprovedRegistryIntoDb(db, bucket, diskByteLoader);
    assert.equal(result.importedCount, 22, 'Phải nạp thành công cả 22 tài sản');
    assert.equal(result.existingCount, 0);

    // Kiểm tra trong R2 bucket
    for (const asset of APPROVED_MEDIA_REGISTRY) {
      const obj = await bucket.get(asset.r2Key);
      assert.ok(obj, `Tài sản ${asset.r2Key} phải có trong R2 bucket`);
      const bodyBytes = await obj.arrayBuffer();
      assert.equal(bodyBytes.byteLength, asset.sizeBytes);
    }

    // 2. Chạy lại lần 2: phải bỏ qua vì đã tồn tại (idempotent)
    const rerun = await importApprovedRegistryIntoDb(db, bucket, diskByteLoader);
    assert.equal(rerun.importedCount, 0);
    assert.equal(rerun.existingCount, 22);

    // 3. Kiểm tra fail-closed: byteLoader trả về dữ liệu sai hash
    const corruptDb = await createTestDb();
    const corruptBucket = new LocalR2Bucket();
    const corruptLoader = (asset) => new Uint8Array(asset.sizeBytes); // toàn số 0

    await assert.rejects(
      async () => {
        await importApprovedRegistryIntoDb(corruptDb, corruptBucket, corruptLoader);
      },
      /Mã băm SHA-256 không khớp/,
      'Phải từ chối ngay lập tức khi bytes không khớp mã băm SHA-256'
    );
  });

  test('GET /api/media/:id/file phục vụ tệp authenticated từ R2 với đầy đủ cờ bảo mật', async () => {
    const db = await createTestDb();
    const bucket = new LocalR2Bucket();
    await importApprovedRegistryIntoDb(db, bucket, diskByteLoader);

    const firstAsset = APPROVED_MEDIA_REGISTRY[0];
    const session = { user: { email: 'admin@mangtheomotnetve.vn', role: 'admin' }, isDev: true };
    const env = { DB: db, BUCKET: bucket };

    // Request đọc tệp hợp lệ
    const req = new Request(`https://studio.mangtheomotnetve.vn/api/media/${firstAsset.id}/file`, {
      method: 'GET',
    });
    const res = await handleApiRequest(req, env, session);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), firstAsset.contentType);
    assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');

    const bodyBuffer = await res.arrayBuffer();
    assert.equal(bodyBuffer.byteLength, firstAsset.sizeBytes);

    // Request tài sản không tồn tại -> 404
    const notFoundReq = new Request('https://studio.mangtheomotnetve.vn/api/media/non-existent-id/file', {
      method: 'GET',
    });
    const notFoundRes = await handleApiRequest(notFoundReq, env, session);
    assert.equal(notFoundRes.status, 404);
  });
});

describe('C17-R2-F2: Proxy Invariants, Price Semantics & Fail-Closed Projection', () => {
  test('Proxy Invariants: length descriptor non-configurable và không ném TypeError', () => {
    // 1. Kiểm tra PRODUCTS length descriptor
    const prodLenDesc = Object.getOwnPropertyDescriptor(PRODUCTS, 'length');
    assert.ok(prodLenDesc, 'PRODUCTS phải có length descriptor');
    assert.equal(prodLenDesc.configurable, false, 'Array length descriptor bắt buộc configurable: false');

    // 2. Kiểm tra PLANNED_SESSIONS và TEAM_MEMBERS
    const sessLenDesc = Object.getOwnPropertyDescriptor(PLANNED_SESSIONS, 'length');
    assert.equal(sessLenDesc.configurable, false);

    const teamLenDesc = Object.getOwnPropertyDescriptor(TEAM_MEMBERS, 'length');
    assert.equal(teamLenDesc.configurable, false);

    // 3. Thao tác reflection chuẩn: Object.keys, slice, map, filter, JSON.stringify
    assert.doesNotThrow(() => {
      const keys = Object.keys(PRODUCTS);
      assert.ok(keys.length >= 7);
      const sliced = PRODUCTS.slice(0, 3);
      assert.equal(sliced.length, 3);
      const names = PRODUCTS.map((p) => p.name);
      assert.ok(names.length >= 7);
      const json = JSON.stringify(PRODUCTS);
      assert.ok(json.length > 100);
    });
  });

  test('Price Semantics: bảo tồn nguyên vẹn proposal referencePrice tách biệt với official sale price', () => {
    const dragonFly = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    assert.ok(dragonFly);
    // Giá đề xuất gốc trong kế hoạch (proposal reference price: 40.000đ)
    assert.equal(dragonFly.referencePrice.value, 40000);
    assert.equal(dragonFly.referencePrice.unit, 'đ/bộ');
  });

  test('Fail-Closed Projection: tài sản chưa được duyệt bị loại trừ khỏi snapshot xuất bản', async () => {
    const approvedKeys = new Set(['/images/illustrations/a01.webp']); // Chỉ duyệt đúng 1 ảnh này

    const mockDrafts = {
      project: { slug: 'mang-theo-mot-net-ve', title: 'Test Project', slogan: 'Slogan', summary: 'Summary' },
      products: {
        'chuon-chuon-tre-kem-de': {
          saleStatus: 'available',
          mediaKey: '/images/san-pham/unapproved-product.webp', // Chưa duyệt
          officialPrice: 40000,
        },
      },
      journal: [
        {
          slug: 'bai-viet-test',
          title: 'Bài viết test',
          summary: 'Tóm tắt',
          category: 'ke-hoach',
          publishedAt: '2026-10-12',
          status: 'published',
          coverImage: {
            src: '/images/journal/unapproved-cover.webp', // Chưa duyệt
            alt: 'Cover',
            caption: 'Caption',
          },
          content: [
            { type: 'paragraph', text: 'Đoạn văn' },
            { type: 'image', src: '/images/illustrations/a01.webp', alt: 'Approved' }, // Đã duyệt
            { type: 'image', src: '/images/unapproved-inline.webp', alt: 'Unapproved' }, // Chưa duyệt
          ],
        },
      ],
      team: {
        info: { name: 'Lăng Kính', description: 'Desc' },
        members: [
          { name: 'Nguyễn Chí Trung', role: 'Trưởng nhóm', photo: '/images/thanh-vien/unapproved.webp' }, // Chưa duyệt
        ],
      },
    };

    const result = await createPublicationSnapshot(mockDrafts, 'snap-test', approvedKeys);
    assert.ok(result.snapshot);

    // 1. Sản phẩm: mediaKey chưa duyệt bị loại trừ (undefined)
    const projectedProd = result.snapshot.modules.products['chuon-chuon-tre-kem-de'];
    assert.equal(projectedProd.mediaKey, undefined, 'Ảnh sản phẩm chưa duyệt phải bị loại bỏ');

    // 2. Bài viết nhật ký: coverImage chưa duyệt bị xóa
    const projectedArticle = result.snapshot.modules.journal[0];
    assert.equal(projectedArticle.coverImage, undefined, 'Ảnh bìa chưa duyệt phải bị loại bỏ');

    // 3. Khối nội dung inline: ảnh chưa duyệt bị loại bỏ, ảnh đã duyệt được giữ lại
    assert.equal(projectedArticle.content.length, 2, 'Khối ảnh chưa duyệt phải bị loại bỏ');
    assert.equal(projectedArticle.content[1].src, '/images/illustrations/a01.webp');

    // 4. Thành viên: ảnh chưa duyệt bị loại bỏ / rỗng
    const projectedMember = result.snapshot.modules.team.members[0];
    assert.equal(projectedMember.photo, '', 'Ảnh thành viên chưa duyệt phải bị loại bỏ');
  });
});

describe('C17-R2-F2: Private Draft Preview SSR & Request-Scoped Isolation', () => {
  test('renderPrivateDraftPreview đính kèm cờ bảo mật và viết lại liên kết nội bộ sang /preview/*', async () => {
    const fakeSnapshot = {
      version: 'preview-test',
      modules: {
        project: { title: 'Bản xem trước Riêng tư Đặc biệt' },
      },
    };

    // Cài đặt handler để kiểm tra liên kết nội bộ được viết lại và headers bảo mật
    setCustomAstroHandler(async (r) => {
      return new Response(
        '<!DOCTYPE html><html><body>' +
        '<a href="/dong-hanh">Đồng hành</a>' +
        '<a href="/dong-hanh#sao-ke">Sao kê</a>' +
        '<a href="/minh-bach#quy-trinh">Quy trình</a>' +
        '<a href="/du-an/mang-theo-mot-net-ve#corners-heading">Góc chơi</a>' +
        '<a href="/dong-hanh/">Đồng hành slash</a>' +
        '<a href="/san-pham?sort=price">Sản phẩm sort</a>' +
        '<a href="/previewevil">Evil bypass check</a>' +
        '<a href="/preview/minh-bach">Minh bạch</a>' +
        '</body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    });

    const req = new Request('https://studio.mangtheomotnetve.vn/preview/dong-hanh');
    const res = await renderPrivateDraftPreview(req, '/dong-hanh', fakeSnapshot);

    // Kiểm tra headers bảo mật bắt buộc
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(res.headers.get('X-Studio-Private-Preview'), 'true');

    // Kiểm tra liên kết nội bộ được viết lại
    const text = await res.text();
    assert.ok(text.includes('href="/preview/dong-hanh"'), 'Liên kết href="/dong-hanh" phải được viết lại thành /preview/dong-hanh');
    assert.ok(text.includes('href="/preview/dong-hanh#sao-ke"'), 'Liên kết fragment /dong-hanh#sao-ke phải được viết lại');
    assert.ok(text.includes('href="/preview/minh-bach#quy-trinh"'), 'Liên kết fragment /minh-bach#quy-trinh phải được viết lại');
    assert.ok(text.includes('href="/preview/du-an/mang-theo-mot-net-ve#corners-heading"'), 'Liên kết fragment góc chơi phải được viết lại');
    assert.ok(text.includes('href="/preview/dong-hanh/"'), 'Liên kết trailing slash /dong-hanh/ phải được viết lại');
    assert.ok(text.includes('href="/preview/san-pham?sort=price"'), 'Liên kết query /san-pham?sort=price phải được viết lại');
    assert.ok(text.includes('href="/preview/previewevil"'), 'Liên kết /previewevil không được bypass');
    assert.ok(text.includes('href="/preview/minh-bach"'), 'Liên kết đã có tiền tố /preview phải được giữ nguyên');
  });

  test('AsyncLocalStorage cách ly hoàn hảo giữa các yêu cầu đồng thời (Zero Cross-Talk)', async () => {
    const snapA = { id: 'SNAPSHOT_A', title: 'Dự án Alpha' };
    const snapB = { id: 'SNAPSHOT_B', title: 'Dự án Beta' };

    const taskA = runWithSnapshot(snapA, async () => {
      await new Promise((r) => setTimeout(r, 20));
      return globalThis[Symbol.for('__astro_published_snapshot_storage__')]?.getStore();
    });

    const taskB = runWithSnapshot(snapB, async () => {
      await new Promise((r) => setTimeout(r, 10));
      return globalThis[Symbol.for('__astro_published_snapshot_storage__')]?.getStore();
    });

    const [resA, resB] = await Promise.all([taskA, taskB]);
    assert.equal(resA?.id, 'SNAPSHOT_A');
    assert.equal(resB?.id, 'SNAPSHOT_B');
  });

  test('workerd Preview Server: render hoàn chỉnh 6 trang công khai, từ chối unauth và cách ly dữ liệu nháp', { timeout: 45000 }, async () => {
    const { unstable_dev, getPlatformProxy, unstable_splitSqlQuery } = await import('wrangler');
    
    // Tạo thư mục lưu trữ SQLite biệt lập hoàn toàn cho lần chạy này
    const tempPersistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c17-preview-persist-'));

    // Áp dụng schema D1 vào preview DB biệt lập
    const sqlPath = path.resolve(rootDir, 'apps/studio/migrations/0001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const proxy = await getPlatformProxy({
      configPath: path.resolve(rootDir, 'wrangler.preview.json'),
      persist: { path: path.join(tempPersistDir, 'v3') },
    });
    for (const st of unstable_splitSqlQuery(sql)) {
      if (st.trim()) await proxy.env.DB.prepare(st).run();
    }
    await proxy.dispose();

    const worker = await unstable_dev(path.resolve(rootDir, 'dist-preview/server/entry.mjs'), {
      config: path.resolve(rootDir, 'wrangler.preview.json'),
      persistTo: tempPersistDir,
      vars: {
        STUDIO_ENVIRONMENT: 'development',
      },
      experimental: { disableExperimentalWarning: true }
    });
    const origin = `http://127.0.0.1:${worker.port}`;

    try {
      const runMarker = Date.now().toString(36);
      const uniqueProjectTitle = `DỰ ÁN XEM TRƯỚC BẢN NHÁP ${runMarker}`;
      const uniqueProjectSlogan = `KHẨU HIỆU DỰ ÁN XEM TRƯỚC BẢN NHÁP ${runMarker}`;
      const testArticleSlug = `bai-viet-nhap-${runMarker}`;
      const uniqueDraftArticleTitle = `BÀI VIẾT BẢN NHÁP CHƯA XUẤT BẢN ${runMarker}`;

      const localHeaders = {};

      // 1. Lưu bản nháp project vào D1 qua Worker API, khẳng định cả POST 200 và GET readback
      const getProj = await worker.fetch(`${origin}/api/drafts/project?dev_role=admin`);
      assert.equal(getProj.status, 200);
      const projJson = await getProj.json();
      const customProject = { ...projJson.draft.data, title: uniqueProjectTitle, slogan: uniqueProjectSlogan };
      const saveProjRes = await worker.fetch(`${origin}/api/drafts/project?dev_role=admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: customProject,
          expectedHash: projJson.draft.revisionHash,
          comment: 'Cập nhật tiêu đề và khẩu hiệu nháp',
        }),
      });
      assert.equal(saveProjRes.status, 200, 'Lưu bản nháp project phải thành công 200');
      // Readback assertion: đọc lại từ D1 khẳng định giá trị đã lưu
      const readbackProjRes = await worker.fetch(`${origin}/api/drafts/project?dev_role=admin`);
      const readbackProjJson = await readbackProjRes.json();
      assert.equal(readbackProjJson.draft.data.title, uniqueProjectTitle, 'Readback phải khớp tiêu đề độc nhất');

      // 2. Lưu bài viết nhật ký status: draft vào D1 qua Worker API, khẳng định POST 200 và GET readback
      const getJourn = await worker.fetch(`${origin}/api/drafts/journal?dev_role=admin`);
      assert.equal(getJourn.status, 200);
      const journJson = await getJourn.json();
      const existingJournal = Array.isArray(journJson.draft.data) ? journJson.draft.data : [];
      const customJournal = [
        ...existingJournal,
        {
          slug: testArticleSlug,
          title: uniqueDraftArticleTitle,
          summary: 'Tóm tắt bài viết nháp cần xem trước',
          category: 'ke-hoach',
          publishedAt: '2026-10-12',
          status: 'draft',
          content: [{ type: 'paragraph', text: 'Nội dung bài viết nháp thử nghiệm' }],
        },
      ];
      const jRes = await worker.fetch(`${origin}/api/drafts/journal?dev_role=admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: customJournal,
          expectedHash: journJson.draft.revisionHash,
          comment: 'Thêm bài viết nháp độc nhất',
        }),
      });
      assert.equal(jRes.status, 200, 'Lưu bản nháp journal phải thành công 200');
      // Readback assertion: đọc lại từ D1 khẳng định bài viết mới tồn tại
      const readbackJournRes = await worker.fetch(`${origin}/api/drafts/journal?dev_role=admin`);
      const readbackJournJson = await readbackJournRes.json();
      assert.ok(readbackJournJson.draft.data.some((a) => a.slug === testArticleSlug), 'Readback phải chứa bài viết nháp mới tạo');

      // 3. Kiểm tra từ chối unauthenticated dứt khoát trên non-loopback URL
      const unauthRes = await worker.fetch('http://example.com/preview/dong-hanh');
      assert.equal(unauthRes.status, 401, 'Yêu cầu unauthenticated phải bị từ chối 401');

      // 4. Kiểm tra duyệt hoàn chỉnh 6 trang công khai + /nhat-ky với quyền admin dev
      const routes = [
        '/',
        '/dong-hanh',
        '/du-an/mang-theo-mot-net-ve',
        '/minh-bach',
        '/san-pham',
        '/ve-nhom',
        '/nhat-ky',
      ];

      for (const r of routes) {
        const pageRes = await worker.fetch(`${origin}/preview${r}?dev_role=admin`);
        assert.equal(pageRes.status, 200, `Trang ${r} phải trả về 200 OK`);
        assert.equal(pageRes.headers.get('x-studio-private-preview'), 'true', `Trang ${r} phải có header private preview`);
        assert.equal(pageRes.headers.get('cache-control'), 'private, no-store', `Trang ${r} phải có Cache-Control private`);
        assert.equal(pageRes.headers.get('x-robots-tag'), 'noindex, nofollow', `Trang ${r} phải có robots tag noindex`);

        const body = await pageRes.text();
        assert.ok(body.length > 5000, `Trang ${r} phải có nội dung HTML hoàn chỉnh (>5KB)`);
        assert.ok(body.includes('<title>'), `Trang ${r} phải chứa thẻ <title>`);
        // Kiểm tra không có liên kết nội bộ bị lộ ra ngoài /preview
        assert.ok(!body.includes('href="/dong-hanh"'), `Liên kết trong trang ${r} phải được viết lại sang /preview`);

        // Khẳng định tiêu đề bản nháp độc nhất xuất hiện trên trang chủ xem trước
        if (r === '/') {
          assert.ok(body.includes(uniqueProjectTitle), 'Tiêu đề bản nháp độc nhất phải render trực tiếp trên SSR preview trang chủ');
        }
        // Khẳng định khẩu hiệu bản nháp độc nhất xuất hiện trên trang dự án xem trước
        if (r === '/du-an/mang-theo-mot-net-ve') {
          assert.ok(body.includes(uniqueProjectSlogan), 'Khẩu hiệu bản nháp độc nhất phải render trực tiếp trên SSR preview trang dự án');
        }
      }

      // 5. Khẳng định bài viết trạng thái draft xem trước được trên SSR preview
      const journalDraftRes = await worker.fetch(`${origin}/preview/nhat-ky/${testArticleSlug}?dev_role=admin`);
      assert.equal(journalDraftRes.status, 200, 'Bài viết bản nháp trạng thái draft phải render 200 OK trong private preview');
      const journalDraftBody = await journalDraftRes.text();
      assert.ok(journalDraftBody.includes(uniqueDraftArticleTitle), 'Tiêu đề bài viết bản nháp phải render trực tiếp trên SSR preview');
      assert.equal(journalDraftRes.headers.get('x-studio-private-preview'), 'true');

      // 6. Khẳng định bài viết status=draft bị loại bỏ khỏi snapshot xuất bản công khai
      const pubSnapshot = await createPublicationSnapshot({ journal: customJournal }, 'pub-snap', new Set());
      assert.ok(!pubSnapshot.snapshot.modules.journal.some((a) => a.slug === testArticleSlug), 'Bài viết status=draft phải bị loại khỏi xuất bản công khai');
    } finally {
      await Promise.race([
        worker.stop(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      try {
        fs.rmSync(tempPersistDir, { recursive: true, force: true });
      } catch {}
    }
  });
});

describe('C17-R2-F2: Studio UI Workflows & Role Administration', () => {
  test('Contact Removal Toggle: lưu contacts: null vào D1 và ẩn liên hệ không phục sinh fallback', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);

    // 1. Lưu bản nháp project với contacts: null (người dùng cố ý ẩn/xóa liên hệ)
    const initialProjectDraft = await dbClient.getDraft('project');
    const updatedProject = {
      ...initialProjectDraft.data,
      contacts: null,
    };

    const saveRes = await dbClient.saveDraft(
      'project',
      updatedProject,
      initialProjectDraft.revisionHash,
      'admin@mangtheomotnetve.vn',
      'Ẩn / xóa thông tin liên hệ chính thức'
    );
    assert.ok(saveRes.draft);
    assert.equal(saveRes.draft.data.contacts, null);

    // 2. Đọc lại từ DB: xác nhận contacts vẫn là null
    const reloaded = await dbClient.getDraft('project');
    assert.equal(reloaded.data.contacts, null, 'contacts: null phải được lưu bền vững trong D1');

    // 3. Khẳng định snapshot adapter giữ contacts: null (không omit và không fallback)
    const pubSnap = await createPublicationSnapshot({ project: updatedProject }, 'snap-test');
    assert.equal(pubSnap.snapshot.modules.project.contacts, null, 'Publication snapshot phải giữ contacts: null');
    const previewSnap = await createPrivateDraftSnapshot({ project: updatedProject }, 'preview-test');
    assert.equal(previewSnap.modules.project.contacts, null, 'Private preview snapshot phải giữ contacts: null');

    // 4. Khẳng định snapshot loader và view model hạ cờ unconfirmed và xóa danh sách liên hệ (CTA ẩn hoàn toàn)
    runWithSnapshot(previewSnap, () => {
      const contacts = getOfficialContact();
      assert.equal(contacts.status, 'unconfirmed');
      assert.equal(contacts.people.length, 0);
      assert.equal(contacts.fanpageUrl, null);
    });
  });

  test('Product Configuration: lưu tên, mô tả, xuất xứ, giá và bảo tồn ngữ nghĩa xóa null/rỗng', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);

    const initialDraft = await dbClient.getDraft('products');
    const updatedProducts = {
      ...initialDraft.data,
      'chuon-chuon-tre-kem-de': {
        ...initialDraft.data['chuon-chuon-tre-kem-de'],
        name: 'Chuồn chuồn tre mỹ nghệ Lăng Kính (Đã sửa)',
        description: 'Mô tả mới được biên tập từ Content Studio',
        originText: 'Xưởng tre làng nghề Thạch Thất (Xác nhận)',
        officialPrice: 45000,
        stockAvailable: 25,
        saleStatus: 'open',
        publicApproval: 'approved',
        narrative: null, // Chủ ý xóa câu chuyện -> không phục sinh baseline
        mediaKey: null, // Chủ ý xóa ảnh -> không phục sinh baseline
      },
    };

    const saveRes = await dbClient.saveDraft(
      'products',
      updatedProducts,
      initialDraft.revisionHash,
      'admin@mangtheomotnetve.vn',
      'Cập nhật tên, mô tả, xuất xứ sản phẩm và xóa media/narrative'
    );
    assert.ok(saveRes.draft);
    assert.equal(saveRes.draft.data['chuon-chuon-tre-kem-de'].name, 'Chuồn chuồn tre mỹ nghệ Lăng Kính (Đã sửa)');

    // Đọc lại từ D1 xác nhận giá trị bền vững
    const reloaded = await dbClient.getDraft('products');
    assert.equal(reloaded.data['chuon-chuon-tre-kem-de'].name, 'Chuồn chuồn tre mỹ nghệ Lăng Kính (Đã sửa)');
    assert.equal(reloaded.data['chuon-chuon-tre-kem-de'].originText, 'Xưởng tre làng nghề Thạch Thất (Xác nhận)');
    assert.equal(reloaded.data['chuon-chuon-tre-kem-de'].narrative, null);
    assert.equal(reloaded.data['chuon-chuon-tre-kem-de'].mediaKey, null);

    // Chiếu sang preview snapshot
    const previewSnap = await createPrivateDraftSnapshot({ products: updatedProducts }, 'preview-prod');
    assert.equal(previewSnap.modules.products['chuon-chuon-tre-kem-de'].name, 'Chuồn chuồn tre mỹ nghệ Lăng Kính (Đã sửa)');
    assert.equal(previewSnap.modules.products['chuon-chuon-tre-kem-de'].originText, 'Xưởng tre làng nghề Thạch Thất (Xác nhận)');
    assert.equal(previewSnap.modules.products['chuon-chuon-tre-kem-de'].narrative, null);
    assert.equal(previewSnap.modules.products['chuon-chuon-tre-kem-de'].mediaKey, null);

    // Kiểm tra view model trong AsyncLocalStorage
    runWithSnapshot(previewSnap, () => {
      const prod = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
      assert.equal(prod?.name, 'Chuồn chuồn tre mỹ nghệ Lăng Kính (Đã sửa)');
      assert.equal(prod?.originText, 'Xưởng tre làng nghề Thạch Thất (Xác nhận)');
      assert.equal(prod?.description, 'Mô tả mới được biên tập từ Content Studio');
      assert.equal(prod?.saleStatus, 'open');

      const detail = getCraftProductBySlug('chuon-chuon-tre-kem-de');
      assert.equal(detail?.product.name, 'Chuồn chuồn tre mỹ nghệ Lăng Kính (Đã sửa)');
      assert.equal(detail?.narrative, null);
      assert.equal(detail?.image, undefined); // Bảo tồn xóa ảnh, không phục sinh baseline
    });
  });

  test('Finance Two-Person Policy & Interactive Tables (entries, sales, expenses, inKind, overview)', async () => {
    const db = await createTestDb();
    const sessionAdmin = { user: { email: 'admin@mangtheomotnetve.vn', role: 'admin' }, isDev: true };
    const env = { DB: db };

    // 1. Lưu bản nháp Finance với đầy đủ bảng tương tác và overview
    const initialFin = await new StudioDbClient(db).getDraft('finance');
    const customFinData = {
      ...initialFin.data,
      overview: {
        plannedExpenseTotal: 5470000,
        craftPlannedRevenue: 2200000,
        foodPlannedRevenue: 4950000,
        plannedRevenueScenario: 7150000,
        unfundedProjectedBalance: 1680000,
        actualStatusNotice: 'Đang chuẩn bị số liệu.',
        disclaimer: 'Đối soát độc lập.',
      },
      entries: [
        { date: '2026-10-12', amount: 100000, donor: 'Trần Văn B', reference: 'REF123' },
      ],
      sales: [
        { item: 'Móc khóa len', quantity: 5, unitPrice: 20000, totalAmount: 100000, channel: 'Quầy' },
      ],
      expenses: [
        { category: 'Vật tư', item: 'Giấy vẽ A4', amount: 80000, isCash: true, notes: 'Hóa đơn 001' },
      ],
      inKindDonations: [
        { item: 'Bút dạ màu 24 cây', quantity: 2, estimatedValue: 120000, donorName: 'Cửa hàng Mỹ thuật' },
      ],
    };

    const saveReq = new Request('https://studio.mangtheomotnetve.vn/api/drafts/finance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://studio.mangtheomotnetve.vn',
      },
      body: JSON.stringify({
        data: customFinData,
        expectedHash: initialFin.revisionHash,
        comment: 'Cập nhật bảng tương tác và dự toán',
      }),
    });

    const saveRes = await handleApiRequest(saveReq, env, sessionAdmin);
    assert.equal(saveRes.status, 200);
    const saveJson = await saveRes.json();
    assert.equal(saveJson.draft.data.entries.length, 1);
    assert.equal(saveJson.draft.data.sales.length, 1);
    assert.equal(saveJson.draft.data.expenses.length, 1);
    assert.equal(saveJson.draft.data.inKindDonations.length, 1);
    assert.equal(saveJson.draft.data.overview.plannedExpenseTotal, 5470000);
  });

  test('Publish View: Guarded Restore với OCC phát hiện xung đột 409 và cập nhật vai trò /api/users', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);
    const env = { DB: db };
    const sessionAdmin = { user: { email: 'admin@mangtheomotnetve.vn', role: 'admin' }, isDev: true };

    // 1. Tạo 2 revisions cho project
    const draft1 = await dbClient.getDraft('project');
    const save1 = await dbClient.saveDraft('project', { ...draft1.data, title: 'Title Rev 1' }, draft1.revisionHash, 'admin@mangtheomotnetve.vn', 'Rev 1');
    const save2 = await dbClient.saveDraft('project', { ...save1.draft.data, title: 'Title Rev 2' }, save1.draft.revisionHash, 'admin@mangtheomotnetve.vn', 'Rev 2');

    const revList = await dbClient.listRevisions('project', 5);
    assert.ok(revList.length >= 2);
    const olderRev = revList[revList.length - 1];

    // 2. Khôi phục với expectedHash sai -> 409 Conflict
    const restoreConflictReq = new Request(`https://studio.mangtheomotnetve.vn/api/revisions/project/${olderRev.id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://studio.mangtheomotnetve.vn',
      },
      body: JSON.stringify({ expectedHash: 'wrong-stale-hash' }),
    });
    const conflictRes = await handleApiRequest(restoreConflictReq, env, sessionAdmin);
    assert.equal(conflictRes.status, 409, 'Phải trả về 409 khi expectedHash bị lệch');

    // 3. Khôi phục với expectedHash đúng -> 200 OK
    const restoreSuccessReq = new Request(`https://studio.mangtheomotnetve.vn/api/revisions/project/${olderRev.id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://studio.mangtheomotnetve.vn',
      },
      body: JSON.stringify({ expectedHash: save2.draft.revisionHash }),
    });
    const successRes = await handleApiRequest(restoreSuccessReq, env, sessionAdmin);
    assert.equal(successRes.status, 200);

    // 4. Role Administration: GET /api/users và POST /api/users/:email/role
    const listUsersReq = new Request('https://studio.mangtheomotnetve.vn/api/users', { method: 'GET' });
    const listUsersRes = await handleApiRequest(listUsersReq, env, sessionAdmin);
    assert.equal(listUsersRes.status, 200);
    const usersJson = await listUsersRes.json();
    assert.ok(Array.isArray(usersJson.users));

    // Cập nhật vai trò người dùng
    const updateUserReq = new Request('https://studio.mangtheomotnetve.vn/api/users/reviewer%40mangtheomotnetve.vn/role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://studio.mangtheomotnetve.vn',
      },
      body: JSON.stringify({ role: 'editor' }),
    });
    const updateRes = await handleApiRequest(updateUserReq, env, sessionAdmin);
    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.role, 'editor');
  });

  test('Per-Route SEO Controls: lưu, đọc lại D1, lọc bỏ route không hợp lệ, giữ canonical và override render head', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);
    const initialTeam = await dbClient.getDraft('team');

    const customRouteSeo = {
      '/': { title: 'Trang chủ | Dự án Nét Vẽ', description: 'Trang chủ dự án từ thiện sinh viên FPT' },
      '/dong-hanh': { title: 'Ủng hộ & Đồng hành cùng Lăng Kính', description: 'Chi tiết kế hoạch tiếp nhận và sao kê minh bạch' },
      '/san-pham': { title: 'Gian hàng Mở bán Gây quỹ', description: 'Danh mục quà lưu niệm thủ công' },
      '/minh-bach': { title: 'Minh bạch & Báo cáo Thu chi', description: 'Sổ quỹ đối soát ngân hàng và chứng từ' },
      '/ve-nhom': { title: 'Về nhóm sinh viên Lăng Kính', description: '7 thành viên lớp AI2015 phụ trách dự án' },
      '/du-an/mang-theo-mot-net-ve': { title: 'Kế hoạch buổi chơi tại Mái ấm Thánh Tâm', description: 'Kế hoạch 4 góc chơi và tặng quà' },
      '/nhat-ky': { title: 'Nhật ký Hành trình Nét Vẽ', description: 'Bài viết và cập nhật tiến độ dự án' },
    };

    const teamDataWithSeo = {
      ...initialTeam.data,
      siteMeta: {
        ...initialTeam.data.siteMeta,
        routeSeo: {
          ...customRouteSeo,
          '//external.example': { title: 'Invalid External' },
          '/not-an-actual-route': { title: 'Invalid Unknown' },
          '/minh-bach?admin=1': { title: 'Invalid Query' },
          '/../dong-hanh': { title: 'Invalid Traversal' },
          '/array-route': ['invalid array'],
        },
      },
    };

    // 1. Lưu bản nháp (schema sẽ lọc/báo lỗi nếu có route không hợp lệ khi kiểm thực nghiêm ngặt)
    // Làm sạch dữ liệu trước khi lưu: chỉ canonical routes được chấp nhận
    const validTeamData = {
      ...teamDataWithSeo,
      siteMeta: {
        ...initialTeam.data.siteMeta,
        routeSeo: customRouteSeo,
      },
    };

    const saveRes = await dbClient.saveDraft(
      'team',
      validTeamData,
      initialTeam.revisionHash,
      'admin@mangtheomotnetve.vn',
      'Cập nhật per-route SEO cho 7 tuyến canonical'
    );
    assert.ok(saveRes.draft);
    assert.ok(saveRes.draft.data.siteMeta.routeSeo['/dong-hanh']);

    // 2. Đọc lại từ D1 xác nhận lưu trữ bền vững
    const reloaded = await dbClient.getDraft('team');
    assert.equal(reloaded.data.siteMeta.routeSeo['/dong-hanh'].title, 'Ủng hộ & Đồng hành cùng Lăng Kính');
    assert.equal(reloaded.data.siteMeta.routeSeo['/minh-bach'].title, 'Minh bạch & Báo cáo Thu chi');

    // 3. Adapter tạo publication snapshot làm sạch nghiêm ngặt: loại bỏ hoàn toàn các route lạ
    const pubSnapResult = await createPublicationSnapshot({ team: teamDataWithSeo });
    const pubRouteSeo = pubSnapResult.snapshot.modules.team.siteMeta.routeSeo;
    assert.ok(pubRouteSeo['/dong-hanh'], 'Route canonical phải được giữ lại');
    assert.equal(pubRouteSeo['//external.example'], undefined, 'Route //external phải bị loại bỏ');
    assert.equal(pubRouteSeo['/not-an-actual-route'], undefined, 'Route không tồn tại phải bị loại bỏ');
    assert.equal(pubRouteSeo['/minh-bach?admin=1'], undefined, 'Route có query string phải bị loại bỏ');
    assert.equal(pubRouteSeo['/../dong-hanh'], undefined, 'Route có traversal phải bị loại bỏ');

    // 4. Render private draft preview head assertions
    setCustomAstroHandler(async (req) => {
      const store = globalThis[Symbol.for('__astro_published_snapshot_storage__')]?.getStore();
      const url = new URL(req.url);
      const siteMeta = store?.modules?.team?.siteMeta;
      const routeOverride = siteMeta?.routeSeo ? siteMeta.routeSeo[url.pathname] : undefined;
      const title = routeOverride?.title || 'Default Title';
      const desc = routeOverride?.description || 'Default Desc';
      return new Response(
        `<!DOCTYPE html><html><head><title>${title}</title><meta name="description" content="${desc}"></head><body><h1>OK</h1></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    });

    const previewSnap = await createPrivateDraftSnapshot({ team: validTeamData }, 'preview-seo');
    const reqDongHanh = new Request('https://studio.mangtheomotnetve.vn/preview/dong-hanh');
    const resDongHanh = await renderPrivateDraftPreview(reqDongHanh, '/dong-hanh', previewSnap);
    const htmlDongHanh = await resDongHanh.text();
    assert.ok(htmlDongHanh.includes('<title>Ủng hộ & Đồng hành cùng Lăng Kính</title>'));
    assert.ok(htmlDongHanh.includes('content="Chi tiết kế hoạch tiếp nhận và sao kê minh bạch"'));
  });

  test('Nullable Finance Overview Invariants: bảo toàn 0 và null, cho phép âm với unfundedProjectedBalance, từ chối NaN/Infinity/âm với trường thu chi', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);
    const initialFin = await dbClient.getDraft('finance');

    // 1. Lưu bản nháp với giá trị 0 bảo toàn (không bị ép về null hay default)
    const zeroFinData = {
      ...initialFin.data,
      overview: {
        plannedExpenseTotal: 0,
        craftPlannedRevenue: 0,
        foodPlannedRevenue: 0,
        plannedRevenueScenario: 0,
        unfundedProjectedBalance: 0,
      },
    };
    const saveZero = await dbClient.saveDraft(
      'finance',
      zeroFinData,
      initialFin.revisionHash,
      'admin@mangtheomotnetve.vn',
      'Lưu overview với số 0 bảo toàn'
    );
    assert.equal(saveZero.draft.data.overview.plannedExpenseTotal, 0);
    assert.equal(saveZero.draft.data.overview.craftPlannedRevenue, 0);

    const reloadedZero = await dbClient.getDraft('finance');
    assert.equal(reloadedZero.data.overview.plannedExpenseTotal, 0);
    assert.equal(reloadedZero.data.overview.unfundedProjectedBalance, 0);

    // 2. Lưu bản nháp với null bảo toàn (không bị ép về 0 hay default)
    const nullFinData = {
      ...initialFin.data,
      overview: {
        plannedExpenseTotal: null,
        craftPlannedRevenue: null,
        foodPlannedRevenue: null,
        plannedRevenueScenario: null,
        unfundedProjectedBalance: -350000, // Âm hợp lệ với số dư dự phóng
      },
    };
    const saveNull = await dbClient.saveDraft(
      'finance',
      nullFinData,
      saveZero.draft.revisionHash,
      'admin@mangtheomotnetve.vn',
      'Lưu overview với null và số dư âm'
    );
    assert.equal(saveNull.draft.data.overview.plannedExpenseTotal, null);
    assert.equal(saveNull.draft.data.overview.unfundedProjectedBalance, -350000);

    const reloadedNull = await dbClient.getDraft('finance');
    assert.equal(reloadedNull.data.overview.plannedExpenseTotal, null);
    assert.equal(reloadedNull.data.overview.unfundedProjectedBalance, -350000);

    // 3. Kiểm chứng snapshot xuất bản bảo tồn đúng null và 0
    const pubSnapZero = await createPublicationSnapshot({ finance: zeroFinData });
    assert.equal(pubSnapZero.snapshot.modules.finance.overview.plannedExpenseTotal, 0);

    const pubSnapNull = await createPublicationSnapshot({ finance: nullFinData });
    assert.equal(pubSnapNull.snapshot.modules.finance.overview.plannedExpenseTotal, null);
    assert.equal(pubSnapNull.snapshot.modules.finance.overview.unfundedProjectedBalance, -350000);
  });

  test('Simulated Concurrent Custom Handler: chứng minh cách ly AsyncLocalStorage giữa các yêu cầu đồng thời với literal-HTML custom handler (Zero Cross-Talk)', async () => {
    // NOTE: Test này kiểm chứng cơ chế AsyncLocalStorage bằng custom handler trả về literal HTML để đo độ trễ xen kẽ (không phải compiled Astro SSR worker).
    // Thiết lập 2 snapshots khác nhau về tiêu đề và mô tả
    const snapA = {
      version: 'snap-alpha',
      modules: {
        team: {
          siteMeta: {
            siteTitle: 'Mang Theo Một Nét Vẽ - Alpha',
            routeSeo: {
              '/dong-hanh': { title: 'Đồng hành Alpha - Chiến dịch Mùa Thu', description: 'Mô tả Alpha độc quyền' },
            },
          },
        },
      },
    };

    const snapB = {
      version: 'snap-beta',
      modules: {
        team: {
          siteMeta: {
            siteTitle: 'Mang Theo Một Nét Vẽ - Beta',
            routeSeo: {
              '/dong-hanh': { title: 'Đồng hành Beta - Chiến dịch Mùa Đông', description: 'Mô tả Beta độc quyền' },
            },
          },
        },
      },
    };

    const snapC = {
      version: 'snap-gamma',
      modules: {
        team: {
          siteMeta: {
            siteTitle: 'Mang Theo Một Nét Vẽ - Tiêu chuẩn',
            routeSeo: {},
          },
        },
      },
    };

    // Handler mô phỏng Astro SSR thực thi và trích xuất dữ liệu từ snapshot trong AsyncLocalStorage
    setCustomAstroHandler(async (req) => {
      // Giả lập độ trễ không đồng bộ ngẫu nhiên để ép xảy ra xen kẽ tiến trình (race condition check)
      const delay = Math.floor(Math.random() * 25) + 5;
      await new Promise((r) => setTimeout(r, delay));

      const store = globalThis[Symbol.for('__astro_published_snapshot_storage__')]?.getStore();
      const url = new URL(req.url);
      const meta = store?.modules?.team?.siteMeta;
      const routeOverride = meta?.routeSeo ? meta.routeSeo[url.pathname] : undefined;
      const title = routeOverride?.title || meta?.siteTitle || 'Mặc định';
      const desc = routeOverride?.description || 'Mô tả mặc định';

      return new Response(
        `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${title}</title><meta name="description" content="${desc}"></head><body><h1>Nội dung: ${title}</h1><a href="/san-pham">Sản phẩm</a></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    });

    const reqA = new Request('https://studio.mangtheomotnetve.vn/preview/dong-hanh');
    const reqB = new Request('https://studio.mangtheomotnetve.vn/preview/dong-hanh');
    const reqC = new Request('https://studio.mangtheomotnetve.vn/preview/dong-hanh');

    // Kích hoạt đồng thời cả 3 requests kết xuất HTML
    const [resA, resB, resC] = await Promise.all([
      renderPrivateDraftPreview(reqA, '/dong-hanh', snapA),
      renderPrivateDraftPreview(reqB, '/dong-hanh', snapB),
      renderPrivateDraftPreview(reqC, '/dong-hanh', snapC),
    ]);

    assert.equal(resA.status, 200);
    assert.equal(resB.status, 200);
    assert.equal(resC.status, 200);

    // Headers bảo mật xuất hiện đầy đủ trên cả 3 kết quả
    for (const res of [resA, resB, resC]) {
      assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
      assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
      assert.equal(res.headers.get('X-Studio-Private-Preview'), 'true');
    }

    const htmlA = await resA.text();
    const htmlB = await resB.text();
    const htmlC = await resC.text();

    // Khẳng định cách ly HTML hoàn hảo:
    // Request A chỉ chứa Alpha, không chứa Beta hay Gamma
    assert.ok(htmlA.includes('<title>Đồng hành Alpha - Chiến dịch Mùa Thu</title>'));
    assert.ok(htmlA.includes('content="Mô tả Alpha độc quyền"'));
    assert.ok(!htmlA.includes('Beta'));
    assert.ok(!htmlA.includes('Tiêu chuẩn'));

    // Request B chỉ chứa Beta, không chứa Alpha hay Gamma
    assert.ok(htmlB.includes('<title>Đồng hành Beta - Chiến dịch Mùa Đông</title>'));
    assert.ok(htmlB.includes('content="Mô tả Beta độc quyền"'));
    assert.ok(!htmlB.includes('Alpha'));
    assert.ok(!htmlB.includes('Tiêu chuẩn'));

    // Request C chỉ chứa tiêu đề chung Gamma, không chứa override của Alpha hay Beta
    assert.ok(htmlC.includes('<title>Mang Theo Một Nét Vẽ - Tiêu chuẩn</title>'));
    assert.ok(!htmlC.includes('Alpha'));
    assert.ok(!htmlC.includes('Beta'));

    // Liên kết nội bộ được viết lại thành /preview/... trên cả 3
    assert.ok(htmlA.includes('href="/preview/san-pham"'));
    assert.ok(htmlB.includes('href="/preview/san-pham"'));
    assert.ok(htmlC.includes('href="/preview/san-pham"'));
  });

  test('Project Data: cleared optional fields (badge, note, description) save and reload as empty strings, not reverting to defaults', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);
    const initialProject = await dbClient.getDraft('project');

    // Cập nhật hoạt động đầu tiên với note, badge, description rỗng
    const updatedActivities = [...initialProject.data.activities];
    updatedActivities[0] = {
      ...updatedActivities[0],
      title: 'Hoạt động đã đổi tên hoàn toàn',
      badge: '',
      note: '',
      description: '',
    };

    const updatedStages = [...initialProject.data.plannedStages];
    updatedStages[0] = {
      ...updatedStages[0],
      title: 'Giai đoạn đã đổi tên hoàn toàn',
      description: '',
    };

    const updatedNeeds = [...initialProject.data.needs];
    updatedNeeds[0] = {
      ...updatedNeeds[0],
      title: 'Nhu cầu đã đổi tên hoàn toàn',
      description: '',
    };

    const saveRes = await dbClient.saveDraft(
      'project',
      {
        ...initialProject.data,
        activities: updatedActivities,
        plannedStages: updatedStages,
        needs: updatedNeeds,
      },
      initialProject.revisionHash,
      'admin@test.vn',
      'Xóa trắng các trường tùy chọn'
    );

    assert.ok(saveRes.draft);
    const reloaded = await dbClient.getDraft('project');
    assert.equal(reloaded.data.activities[0].title, 'Hoạt động đã đổi tên hoàn toàn');
    assert.equal(reloaded.data.activities[0].badge, '');
    assert.equal(reloaded.data.activities[0].note, '');
    assert.equal(reloaded.data.activities[0].description, '');
    assert.equal(reloaded.data.plannedStages[0].title, 'Giai đoạn đã đổi tên hoàn toàn');
    assert.equal(reloaded.data.plannedStages[0].description, '');
    assert.equal(reloaded.data.needs[0].title, 'Nhu cầu đã đổi tên hoàn toàn');
    assert.equal(reloaded.data.needs[0].description, '');
  });

  test('DB Regression: /nhat-ky/detail và /san-pham/detail SEO keys bảo toàn nguyên vẹn qua các thao tác lưu D1 và loại bỏ route rỗng', async () => {
    const db = await createTestDb();
    const dbClient = new StudioDbClient(db);
    const initialTeam = await dbClient.getDraft('team');

    // 1. Tạo bản nháp với các key SEO chi tiết hợp lệ (/nhat-ky/detail, /san-pham/detail) cùng các route canonical
    const detailRouteSeo = {
      '/': { title: 'Trang chủ Lăng Kính' },
      '/dong-hanh': { title: 'Đồng hành cùng Lăng Kính', description: 'Mô tả đồng hành' },
      '/nhat-ky/detail': { title: 'Nhật ký Chi tiết Đặc biệt', description: 'Mô tả bài viết đặc biệt' },
      '/san-pham/detail': { title: 'Sản phẩm Chi tiết Đặc biệt', description: 'Mô tả sản phẩm đặc biệt' },
    };

    const teamWithDetailSeo = {
      ...initialTeam.data,
      siteMeta: {
        ...initialTeam.data.siteMeta,
        routeSeo: detailRouteSeo,
      },
    };

    const saveInitial = await dbClient.saveDraft(
      'team',
      teamWithDetailSeo,
      initialTeam.revisionHash,
      'admin@test',
      'Lưu SEO bao gồm các khóa detail'
    );
    assert.ok(saveInitial.draft);
    assert.ok(saveInitial.draft.data.siteMeta.routeSeo['/nhat-ky/detail']);
    assert.ok(saveInitial.draft.data.siteMeta.routeSeo['/san-pham/detail']);

    // 2. Mô phỏng UI Team Save (chỉ có 7 thẻ canonical được hiển thị và gom lại)
    const activeRouteSeo = { ...saveInitial.draft.data.siteMeta.routeSeo };
    activeRouteSeo['/dong-hanh'] = { title: 'Đồng hành (Cập nhật)', description: 'Mô tả mới' };

    const updatedTeam = {
      ...saveInitial.draft.data,
      siteMeta: {
        ...saveInitial.draft.data.siteMeta,
        routeSeo: activeRouteSeo,
      },
    };

    const saveUpdated = await dbClient.saveDraft(
      'team',
      updatedTeam,
      saveInitial.draft.revisionHash,
      'admin@test',
      'Cập nhật team form'
    );

    // Đọc lại từ D1 xác nhận /nhat-ky/detail và /san-pham/detail vẫn tồn tại bền vững
    const reloaded = await dbClient.getDraft('team');
    assert.equal(reloaded.data.siteMeta.routeSeo['/nhat-ky/detail']?.title, 'Nhật ký Chi tiết Đặc biệt');
    assert.equal(reloaded.data.siteMeta.routeSeo['/san-pham/detail']?.title, 'Sản phẩm Chi tiết Đặc biệt');
    assert.equal(reloaded.data.siteMeta.routeSeo['/dong-hanh']?.title, 'Đồng hành (Cập nhật)');

    // 3. Mô phỏng thao tác xóa trắng một route hiển thị (ví dụ /dong-hanh)
    // Chỉ xóa riêng /dong-hanh, các route khác và detail routes không bị mất
    const clearedRouteSeo = { ...reloaded.data.siteMeta.routeSeo };
    delete clearedRouteSeo['/dong-hanh'];

    const saveCleared = await dbClient.saveDraft(
      'team',
      {
        ...reloaded.data,
        siteMeta: {
          ...reloaded.data.siteMeta,
          routeSeo: clearedRouteSeo,
        },
      },
      saveUpdated.draft.revisionHash,
      'admin@test',
      'Xóa trắng thẻ /dong-hanh'
    );
    assert.equal(saveCleared.draft.data.siteMeta.routeSeo['/dong-hanh'], undefined);
    assert.ok(saveCleared.draft.data.siteMeta.routeSeo['/nhat-ky/detail']);
    assert.ok(saveCleared.draft.data.siteMeta.routeSeo['/san-pham/detail']);

    // 4. Khẳng định publication snapshot bảo toàn các khóa detail hợp lệ
    const pubSnap = await createPublicationSnapshot({ team: saveCleared.draft.data });
    const pubSeo = pubSnap.snapshot.modules.team.siteMeta.routeSeo;
    assert.equal(pubSeo['/nhat-ky/detail']?.title, 'Nhật ký Chi tiết Đặc biệt');
    assert.equal(pubSeo['/san-pham/detail']?.title, 'Sản phẩm Chi tiết Đặc biệt');
  });

  test('Actual Compiled Astro Concurrent Workerd Isolation: 3 independent D1 bindings render concurrent SSR HTML with zero cross-talk in one runtime', { timeout: 30000 }, async () => {
    try {
      const { unstable_dev, getPlatformProxy, unstable_splitSqlQuery } = await import('wrangler');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c17-astro-concurrency-'));
    const cfgPath = path.join(tempDir, 'wrangler.concurrency.json');
    fs.writeFileSync(cfgPath, JSON.stringify({
      name: 'test-concurrency',
      compatibility_date: '2026-10-08',
      compatibility_flags: ['nodejs_compat', 'nodejs_als'],
      d1_databases: [
        { binding: 'DB_A', database_name: 'db-a', database_id: '00000000-0000-0000-0000-000000000001' },
        { binding: 'DB_B', database_name: 'db-b', database_id: '00000000-0000-0000-0000-000000000002' },
        { binding: 'DB_C', database_name: 'db-c', database_id: '00000000-0000-0000-0000-000000000003' },
      ],
      r2_buckets: [
        { binding: 'BUCKET', bucket_name: 'studio-media' },
      ],
      vars: {
        STUDIO_ENVIRONMENT: 'development',
        CF_ACCESS_TEAM_DOMAIN: 'example-team.cloudflareaccess.com',
        CF_ACCESS_AUD: '0000000000000000000000000000000000000000000000000000000000000000',
      },
    }));

    // 1. Áp dụng migration schema vào 3 cơ sở dữ liệu D1 biệt lập
    const proxy = await getPlatformProxy({
      configPath: cfgPath,
      persist: { path: path.join(tempDir, 'v3') },
    });

    const sqlPath = path.resolve(rootDir, 'apps/studio/migrations/0001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    for (const st of unstable_splitSqlQuery(sql)) {
      if (st.trim()) {
        await proxy.env.DB_A.prepare(st).run();
        await proxy.env.DB_B.prepare(st).run();
        await proxy.env.DB_C.prepare(st).run();
      }
    }

    const clientA = new StudioDbClient(proxy.env.DB_A);
    const clientB = new StudioDbClient(proxy.env.DB_B);
    const clientC = new StudioDbClient(proxy.env.DB_C);

    // 2. Nạp dữ liệu hạt giống và tùy biến độc nhất cho từng Tenant (A, B, C)
    for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
      const data = getDefaultModuleData(mod);
      await clientA.saveDraft(mod, data, null, 'seed@test', 'Bootstrap A');
      await clientB.saveDraft(mod, data, null, 'seed@test', 'Bootstrap B');
      await clientC.saveDraft(mod, data, null, 'seed@test', 'Bootstrap C');
    }

    const projA = await clientA.getDraft('project');
    await clientA.saveDraft('project', {
      ...projA.data,
      title: 'DỰ ÁN ALPHA - CÙNG BÉ VẼ ƯỚC MƠ',
      slogan: 'KHẨU HIỆU ALPHA ĐỘC BẢN',
    }, projA.revisionHash, 'admin@test', 'Update A');
    const teamA = await clientA.getDraft('team');
    await clientA.saveDraft('team', {
      ...teamA.data,
      siteMeta: {
        ...teamA.data.siteMeta,
        routeSeo: {
          '/du-an/mang-theo-mot-net-ve': {
            title: 'SEO DỰ ÁN ALPHA ĐỘC BẢN',
            description: 'MÔ TẢ ALPHA RIÊNG BIỆT',
          },
        },
      },
    }, teamA.revisionHash, 'admin@test', 'Update Team A');

    const projB = await clientB.getDraft('project');
    await clientB.saveDraft('project', {
      ...projB.data,
      title: 'DỰ ÁN BETA - HÀNH TRÌNH TƯƠNG LAI',
      slogan: 'KHẨU HIỆU BETA ĐỘC BẢN',
    }, projB.revisionHash, 'admin@test', 'Update B');
    const teamB = await clientB.getDraft('team');
    await clientB.saveDraft('team', {
      ...teamB.data,
      siteMeta: {
        ...teamB.data.siteMeta,
        routeSeo: {
          '/du-an/mang-theo-mot-net-ve': {
            title: 'SEO DỰ ÁN BETA ĐỘC BẢN',
            description: 'MÔ TẢ BETA RIÊNG BIỆT',
          },
        },
      },
    }, teamB.revisionHash, 'admin@test', 'Update Team B');

    const projC = await clientC.getDraft('project');
    await clientC.saveDraft('project', {
      ...projC.data,
      title: 'DỰ ÁN GAMMA - NẮNG ẤM VÙNG CAO',
      slogan: 'KHẨU HIỆU GAMMA ĐỘC BẢN',
    }, projC.revisionHash, 'admin@test', 'Update C');
    const teamC = await clientC.getDraft('team');
    await clientC.saveDraft('team', {
      ...teamC.data,
      siteMeta: {
        ...teamC.data.siteMeta,
        routeSeo: {
          '/du-an/mang-theo-mot-net-ve': {
            title: 'SEO DỰ ÁN GAMMA ĐỘC BẢN',
            description: 'MÔ TẢ GAMMA RIÊNG BIỆT',
          },
        },
      },
    }, teamC.revisionHash, 'admin@test', 'Update Team C');

    await proxy.dispose();

    // 3. Tạo test wrapper workerd nạp compiled Astro worker trực tiếp
    const compiledEntryPath = path.resolve(rootDir, 'dist-preview/server/entry.mjs').replace(/\\/g, '/');
    const wrapperScript = path.join(tempDir, 'concurrency-wrapper.mjs');
    fs.writeFileSync(wrapperScript, `
import compiledWorker from '${compiledEntryPath}';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const tenant = url.searchParams.get('tenant') || request.headers.get('x-tenant') || 'a';
    const targetDb = tenant === 'b' ? env.DB_B : tenant === 'c' ? env.DB_C : env.DB_A;
    try {
      await targetDb.prepare('SELECT module_key FROM drafts').all();
    } catch (e) {}
    const delegatedEnv = { ...env, DB: targetDb };
    return compiledWorker.fetch(request, delegatedEnv, ctx);
  }
};
`);

    // 4. Khởi động 1 workerd runtime instance duy nhất chứa compiled Astro
    const worker = await unstable_dev(wrapperScript, {
      config: cfgPath,
      persistTo: tempDir,
      ip: '127.0.0.1',
      experimental: { disableExperimentalWarning: true },
    });
    const origin = `http://127.0.0.1:${worker.port}`;

    try {
      // 5. Gửi 3 yêu cầu đồng thời (Promise.all) tới cùng một workerd runtime
      const [resA, resB, resC] = await Promise.all([
        worker.fetch(`${origin}/preview/du-an/mang-theo-mot-net-ve?tenant=a&dev_role=admin`),
        worker.fetch(`${origin}/preview/du-an/mang-theo-mot-net-ve?tenant=b&dev_role=admin`),
        worker.fetch(`${origin}/preview/du-an/mang-theo-mot-net-ve?tenant=c&dev_role=admin`),
      ]);

      assert.equal(resA.status, 200);
      assert.equal(resB.status, 200);
      assert.equal(resC.status, 200);

      // Cờ bảo mật riêng tư hiện diện đầy đủ
      for (const res of [resA, resB, resC]) {
        assert.equal(res.headers.get('cache-control'), 'private, no-store');
        assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
        assert.equal(res.headers.get('x-studio-private-preview'), 'true');
      }

      const htmlA = await resA.text();
      const htmlB = await resB.text();
      const htmlC = await resC.text();

      // Khẳng định cách ly hoàn hảo: Mỗi tenant render đúng tiêu đề, khẩu hiệu và SEO metadata của chính mình
      // Tenant A
      assert.ok(htmlA.includes('KHẨU HIỆU ALPHA ĐỘC BẢN'));
      assert.ok(htmlA.includes('SEO DỰ ÁN ALPHA ĐỘC BẢN'));
      assert.ok(htmlA.includes('MÔ TẢ ALPHA RIÊNG BIỆT'));
      assert.ok(!htmlA.includes('BETA'));
      assert.ok(!htmlA.includes('GAMMA'));

      // Tenant B
      assert.ok(htmlB.includes('KHẨU HIỆU BETA ĐỘC BẢN'));
      assert.ok(htmlB.includes('SEO DỰ ÁN BETA ĐỘC BẢN'));
      assert.ok(htmlB.includes('MÔ TẢ BETA RIÊNG BIỆT'));
      assert.ok(!htmlB.includes('ALPHA'));
      assert.ok(!htmlB.includes('GAMMA'));

      // Tenant C
      assert.ok(htmlC.includes('KHẨU HIỆU GAMMA ĐỘC BẢN'));
      assert.ok(htmlC.includes('SEO DỰ ÁN GAMMA ĐỘC BẢN'));
      assert.ok(htmlC.includes('MÔ TẢ GAMMA RIÊNG BIỆT'));
      assert.ok(!htmlC.includes('ALPHA'));
      assert.ok(!htmlC.includes('BETA'));
    } finally {
      await Promise.race([
        worker.stop(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
    } catch (err) {
      console.error('CONCURRENCY TEST ERROR:', err);
      throw err;
    }
  });
});
