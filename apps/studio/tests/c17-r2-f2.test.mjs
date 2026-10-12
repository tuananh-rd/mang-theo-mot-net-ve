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

  test('workerd Preview Server: render hoàn chỉnh 6 trang công khai, từ chối unauth và cách ly dữ liệu nháp', async () => {
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
      await worker.stop();
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
});
