/**
 * Bộ kiểm thử Hợp đồng Xuất bản, Khôi phục từng bước và Xác thực Triển khai Live (Task C17-R2-F3)
 * Bao phủ:
 * 1. GitHub Publisher: Fetch fixtures, các bước ref/commit/tree/ref/pr, ancestry check, xung đột nhánh, token scrubbing.
 * 2. Live Deployment Verifier: Thành công, Stale, Mismatch, Unreachable, Webhook secret auth.
 * 3. Snapshot & Assets Exporter: Thẩm định sâu schema, cô lập thư mục, dọn dẹp khi lỗi.
 * 4. Tất cả các test đều có hard timeout và bounded teardown tránh nguy cơ treo tiến trình.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { triggerGitHubPublication, scrubToken } from '../dist/publish/github.js';
import { verifyLiveDeployment, verifyDeploymentWebhookSecret } from '../dist/publish/verifier.js';
import { exportApprovedSnapshot } from '../dist/publish/consumer.js';
import {
  DEFAULT_PROJECT_DATA,
  DEFAULT_JOURNAL_DATA,
  DEFAULT_PRODUCTS_DATA,
  DEFAULT_FINANCE_DATA,
  DEFAULT_TEAM_DATA,
} from '../dist/schemas/index.js';

const MOCK_PUBLICATION = {
  id: 'pub-test-f3-001',
  snapshot: {
    version: 'v20261013-01',
    generatedAt: '2026-10-13T06:00:00.000Z',
    sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    modules: {
      project: DEFAULT_PROJECT_DATA,
      journal: DEFAULT_JOURNAL_DATA,
      products: DEFAULT_PRODUCTS_DATA,
      finance: DEFAULT_FINANCE_DATA,
      team: DEFAULT_TEAM_DATA,
    },
  },
  status: 'approved',
  requestedBy: 'editor@test.vn',
  approvedBy: 'reviewer@test.vn',
  secondReviewer: null,
  publishedAt: null,
  gitRef: null,
  deployStatus: 'unknown',
  createdAt: '2026-10-13T05:50:00.000Z',
};

const BASE_MAIN_SHA = '0848d1212ea8a2177e76f076a9171c519155dd8a';
const BASE_TREE_SHA = 'tree_base_0848d12';

test('Publisher: Thiếu GITHUB_TOKEN trả về not_configured và không mô phỏng ngầm', { timeout: 10000 }, async () => {
  const env = { DB: {}, BUCKET: {} };
  const res = await triggerGitHubPublication(MOCK_PUBLICATION, env, { token: undefined });

  assert.equal(res.success, false);
  assert.equal(res.stage, 'init');
  assert.equal(res.errorCode, 'not_configured');
  assert.ok(res.error?.includes('GITHUB_TOKEN'));
});

test('Publisher: Thành công end-to-end với đầy đủ chu trình ref -> commit -> tree -> commit -> ref -> PR', { timeout: 10000 }, async () => {
  const env = { DB: {}, BUCKET: {}, GITHUB_TOKEN: 'ghp_secret_token_123' };
  const capturedCalls = [];

  const mockFetch = async (url, init) => {
    capturedCalls.push({ url, method: init?.method || 'GET', body: init?.body ? JSON.parse(init.body) : null });

    // 1. Đọc base ref
    if (url.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: BASE_MAIN_SHA } }), { status: 200 });
    }
    // 2. Đọc base commit
    if (url.includes(`/git/commits/${BASE_MAIN_SHA}`)) {
      return new Response(JSON.stringify({ sha: BASE_MAIN_SHA, tree: { sha: BASE_TREE_SHA } }), { status: 200 });
    }
    // 3. Tạo Git Tree
    if (url.includes('/git/trees')) {
      return new Response(JSON.stringify({ sha: 'new_tree_sha_999' }), { status: 201 });
    }
    // 4. Tạo Git Commit
    if (url.includes('/git/commits') && init?.method === 'POST') {
      return new Response(JSON.stringify({ sha: 'new_commit_sha_888' }), { status: 201 });
    }
    // 5. Tạo Git Ref (nhánh mới)
    if (url.includes('/git/refs') && init?.method === 'POST') {
      return new Response(JSON.stringify({ ref: 'refs/heads/studio/publish-pub-test-f3-001', object: { sha: 'new_commit_sha_888' } }), { status: 201 });
    }
    // 6. Tạo Pull Request
    if (url.includes('/pulls') && init?.method === 'POST') {
      return new Response(JSON.stringify({
        html_url: 'https://github.com/tuananh-rd/mang-theo-mot-net-ve/pull/101',
        number: 101,
      }), { status: 201 });
    }

    return new Response('Not Found', { status: 404 });
  };

  const res = await triggerGitHubPublication(MOCK_PUBLICATION, env, { fetchFn: mockFetch });

  assert.equal(res.success, true);
  assert.equal(res.stage, 'completed');
  assert.equal(res.commitSha, 'new_commit_sha_888');
  assert.equal(res.prNumber, 101);
  assert.equal(res.prUrl, 'https://github.com/tuananh-rd/mang-theo-mot-net-ve/pull/101');

  // Kiểm chứng tính nguyên vẹn: base_tree phải khớp BASE_TREE_SHA để không mất hero và QR Techcombank
  const treeCall = capturedCalls.find((c) => c.url.includes('/git/trees'));
  assert.ok(treeCall);
  assert.equal(treeCall.body.base_tree, BASE_TREE_SHA);
  assert.equal(treeCall.body.tree.some((t) => t.path === 'src/data/published-snapshot.json'), true);
  assert.equal(treeCall.body.tree.some((t) => t.path === 'src/data/journal-entries.json'), true);
  assert.equal(treeCall.body.tree.some((t) => t.path === 'src/data/product-sales-config.json'), true);

  // Commit phải có parent là base commit
  const commitCall = capturedCalls.find((c) => c.url.includes('/git/commits') && c.method === 'POST');
  assert.ok(commitCall);
  assert.deepEqual(commitCall.body.parents, [BASE_MAIN_SHA]);
});

test('Publisher: Xóa bỏ token (Token Scrubbing) trong mọi phản hồi lỗi', { timeout: 10000 }, async () => {
  const secretToken = 'ghp_super_secret_credentials_99999';
  const rawError = `Authentication failed for Bearer ${secretToken} at endpoint https://api.github.com`;
  const scrubbed = scrubToken(rawError, secretToken);

  assert.equal(scrubbed.includes(secretToken), false);
  assert.ok(scrubbed.includes('[REDACTED_TOKEN]'));

  // Kiểm tra qua triggerGitHubPublication khi fetch bị lỗi
  const env = { DB: {}, BUCKET: {}, GITHUB_TOKEN: secretToken };
  const failingFetch = async () => {
    return new Response(`Bad credentials with token ${secretToken}`, { status: 401 });
  };

  const res = await triggerGitHubPublication(MOCK_PUBLICATION, env, { fetchFn: failingFetch });
  assert.equal(res.success, false);
  assert.equal(res.error?.includes(secretToken), false);
  assert.ok(res.error?.includes('[REDACTED_TOKEN]'));
});

test('Publisher: Phát hiện phản hồi sai lệch (Malformed Response) tại từng bước', { timeout: 10000 }, async () => {
  const env = { DB: {}, BUCKET: {}, GITHUB_TOKEN: 'token_123' };

  // 1. Base ref thiếu sha
  const malformedRefFetch = async () => new Response(JSON.stringify({ object: {} }), { status: 200 });
  const res1 = await triggerGitHubPublication(MOCK_PUBLICATION, env, { fetchFn: malformedRefFetch });
  assert.equal(res1.success, false);
  assert.equal(res1.stage, 'base_ref');
  assert.equal(res1.errorCode, 'malformed_response');

  // 2. Base commit thiếu tree sha
  const malformedCommitFetch = async (url) => {
    if (url.includes('/git/ref/heads/main')) return new Response(JSON.stringify({ object: { sha: BASE_MAIN_SHA } }), { status: 200 });
    return new Response(JSON.stringify({ sha: BASE_MAIN_SHA, tree: {} }), { status: 200 });
  };
  const res2 = await triggerGitHubPublication(MOCK_PUBLICATION, env, { fetchFn: malformedCommitFetch });
  assert.equal(res2.success, false);
  assert.equal(res2.stage, 'base_commit');
  assert.equal(res2.errorCode, 'malformed_response');
});

test('Publisher: Idempotent Retry tái sử dụng nhánh và Pull Request đã có', { timeout: 10000 }, async () => {
  const env = { DB: {}, BUCKET: {}, GITHUB_TOKEN: 'token_123' };

  const mockFetch = async (url, init) => {
    if (url.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: BASE_MAIN_SHA } }), { status: 200 });
    }
    if (url.includes(`/git/commits/${BASE_MAIN_SHA}`)) {
      return new Response(JSON.stringify({ sha: BASE_MAIN_SHA, tree: { sha: BASE_TREE_SHA } }), { status: 200 });
    }
    if (url.includes('/git/trees')) {
      return new Response(JSON.stringify({ sha: 'tree_same_123' }), { status: 201 });
    }
    if (url.includes('/git/commits') && init?.method === 'POST') {
      return new Response(JSON.stringify({ sha: 'commit_identical_777' }), { status: 201 });
    }
    // Ref đã tồn tại -> Trả về lỗi 422
    if (url.includes('/git/refs') && init?.method === 'POST') {
      return new Response('Reference already exists', { status: 422 });
    }
    // Kiểm tra nhánh hiện có -> Đúng commit_identical_777
    if (url.includes('/git/ref/heads/studio/publish-')) {
      return new Response(JSON.stringify({ object: { sha: 'commit_identical_777' } }), { status: 200 });
    }
    // Tạo PR báo đã tồn tại -> 422
    if (url.includes('/pulls') && init?.method === 'POST') {
      return new Response('A pull request already exists for this branch', { status: 422 });
    }
    // Tra cứu danh sách PR -> Tìm thấy PR #88
    if (url.includes('/pulls') && (!init || init.method === 'GET')) {
      return new Response(JSON.stringify([{ html_url: 'https://github.com/tuananh-rd/mang-theo-mot-net-ve/pull/88', number: 88 }]), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const res = await triggerGitHubPublication(MOCK_PUBLICATION, env, { fetchFn: mockFetch });
  assert.equal(res.success, true);
  assert.equal(res.isReusedBranch, true);
  assert.equal(res.isReusedPr, true);
  assert.equal(res.prNumber, 88);
});

test('Publisher: Từ chối ghi đè khi nhánh đã có commit phân kỳ xung đột (Conflicting Branch)', { timeout: 10000 }, async () => {
  const env = { DB: {}, BUCKET: {}, GITHUB_TOKEN: 'token_123' };

  const mockFetch = async (url, init) => {
    if (url.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: BASE_MAIN_SHA } }), { status: 200 });
    }
    if (url.includes(`/git/commits/${BASE_MAIN_SHA}`)) {
      return new Response(JSON.stringify({ sha: BASE_MAIN_SHA, tree: { sha: BASE_TREE_SHA } }), { status: 200 });
    }
    if (url.includes('/git/trees')) {
      return new Response(JSON.stringify({ sha: 'tree_sha_123' }), { status: 201 });
    }
    if (url.includes('/git/commits') && init?.method === 'POST') {
      return new Response(JSON.stringify({ sha: 'new_commit_sha_555' }), { status: 201 });
    }
    // Nhánh đã tồn tại
    if (url.includes('/git/refs') && init?.method === 'POST') {
      return new Response('Reference already exists', { status: 422 });
    }
    // Nhánh trỏ tới một commit khác lạ
    if (url.includes('/git/ref/heads/studio/publish-')) {
      return new Response(JSON.stringify({ object: { sha: 'conflicting_commit_diverged' } }), { status: 200 });
    }
    // So sánh lịch sử -> diverged
    if (url.includes('/compare/conflicting_commit_diverged...new_commit_sha_555')) {
      return new Response(JSON.stringify({ status: 'diverged' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const res = await triggerGitHubPublication(MOCK_PUBLICATION, env, { fetchFn: mockFetch });
  assert.equal(res.success, false);
  assert.equal(res.stage, 'branch_ref');
  assert.equal(res.errorCode, 'conflicting_branch');
  assert.ok(res.error?.includes('xung đột lịch sử'));
});

test('Live Verifier: Xác thực thành công khi artifact khớp chính xác cả SHA-256 và commitSha', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockPub = { ...MOCK_PUBLICATION, gitRef: 'commit_target_123' };
  const mockFetch = async () => {
    return new Response(JSON.stringify({
      sha256: mockPub.snapshot.sha256,
      commitSha: 'commit_target_123',
      generatedAt: '2026-10-13T06:05:00.000Z',
    }), { status: 200 });
  };

  const res = await verifyLiveDeployment(mockPub, env, { fetchFn: mockFetch });
  assert.equal(res.verified, true);
  assert.equal(res.deployStatus, 'success');
  assert.equal(res.deployedCommitSha, 'commit_target_123');
  assert.ok(res.verifiedAt);
});

test('Live Verifier: Trả về pending khi artifact thiếu commitSha', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockPub = { ...MOCK_PUBLICATION, gitRef: 'commit_target_123' };
  const mockFetch = async () => {
    return new Response(JSON.stringify({
      sha256: mockPub.snapshot.sha256,
      // thiếu commitSha
      generatedAt: '2026-10-13T06:05:00.000Z',
    }), { status: 200 });
  };

  const res = await verifyLiveDeployment(mockPub, env, { fetchFn: mockFetch });
  assert.equal(res.verified, false);
  assert.equal(res.deployStatus, 'pending');
  assert.ok(res.message.includes('chưa có thông tin commitSha'));
});

test('Live Verifier: Trả về pending khi publication thiếu expectedCommitSha', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockPub = { ...MOCK_PUBLICATION, gitRef: null };
  const mockFetch = async () => {
    return new Response(JSON.stringify({
      sha256: mockPub.snapshot.sha256,
      commitSha: 'commit_live_123',
      generatedAt: '2026-10-13T06:05:00.000Z',
    }), { status: 200 });
  };

  const res = await verifyLiveDeployment(mockPub, env, { fetchFn: mockFetch });
  assert.equal(res.verified, false);
  assert.equal(res.deployStatus, 'pending');
  assert.ok(res.message.includes('chưa có commitSha kỳ vọng'));
});

test('Live Verifier: Phát hiện không khớp commitSha (mismatch commit)', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockPub = { ...MOCK_PUBLICATION, gitRef: 'commit_expected_111' };
  const mockFetch = async () => {
    return new Response(JSON.stringify({
      sha256: mockPub.snapshot.sha256,
      commitSha: 'commit_different_222',
      generatedAt: '2026-10-13T06:05:00.000Z',
    }), { status: 200 });
  };

  const res = await verifyLiveDeployment(mockPub, env, { fetchFn: mockFetch });
  assert.equal(res.verified, false);
  assert.equal(res.deployStatus, 'mismatch');
  assert.ok(res.message.includes('mismatch commit'));
});

test('Live Verifier: Phát hiện bản triển khai cũ (Stale) và không khớp mã băm (Mismatch Hash)', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockPub = { ...MOCK_PUBLICATION, gitRef: 'commit_123' };

  // 1. Bản cũ (Stale)
  const staleFetch = async () => {
    return new Response(JSON.stringify({
      sha256: 'old_sha_0000000000000000000000000000000000000000000000000000000000000000',
      commitSha: 'commit_123',
      generatedAt: '2026-10-10T00:00:00.000Z', // Cũ hơn generatedAt của MOCK_PUBLICATION (2026-10-13)
    }), { status: 200 });
  };
  const resStale = await verifyLiveDeployment(mockPub, env, { fetchFn: staleFetch });
  assert.equal(resStale.verified, false);
  assert.equal(resStale.deployStatus, 'stale');

  // 2. Không khớp mã băm (Mismatch Hash)
  const mismatchFetch = async () => {
    return new Response(JSON.stringify({
      sha256: 'other_sha_1111111111111111111111111111111111111111111111111111111111111111',
      commitSha: 'commit_123',
      generatedAt: '2026-10-14T00:00:00.000Z', // Mới hơn nhưng khác hash
    }), { status: 200 });
  };
  const resMismatch = await verifyLiveDeployment(mockPub, env, { fetchFn: mismatchFetch });
  assert.equal(resMismatch.verified, false);
  assert.equal(resMismatch.deployStatus, 'mismatch');
});

test('Live Verifier: Xử lý máy chủ không thể kết nối (Unreachable) và phản hồi sai lệch (Malformed JSON)', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockPub = { ...MOCK_PUBLICATION, gitRef: 'commit_123' };

  // 1. Máy chủ trả về lỗi HTTP 503
  const unreachableFetch = async () => {
    return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
  };
  const resUnreachable = await verifyLiveDeployment(mockPub, env, { fetchFn: unreachableFetch });
  assert.equal(resUnreachable.verified, false);
  assert.equal(resUnreachable.deployStatus, 'unreachable');

  // 2. Phản hồi không phải JSON
  const malformedFetch = async () => {
    return new Response('NOT_A_JSON_STRING', { status: 200 });
  };
  const resMalformed = await verifyLiveDeployment(mockPub, env, { fetchFn: malformedFetch });
  assert.equal(resMalformed.verified, false);
  assert.equal(resMalformed.deployStatus, 'failed');
  assert.ok(resMalformed.message.includes('JSON'));
});

test('Live Verifier: Webhook Secret Authentication (Bảo vệ bí mật)', { timeout: 10000 }, async () => {
  const secret = 'prod_deploy_webhook_secret_key_888';

  // Request hợp lệ với header X-Deployment-Secret
  const req1 = new Request('https://studio.test/api/publications/webhook/deployment', {
    headers: { 'X-Deployment-Secret': secret },
  });
  assert.equal(verifyDeploymentWebhookSecret(req1, secret), true);

  // Request hợp lệ với Authorization Bearer
  const req2 = new Request('https://studio.test/api/publications/webhook/deployment', {
    headers: { 'Authorization': `Bearer ${secret}` },
  });
  assert.equal(verifyDeploymentWebhookSecret(req2, secret), true);

  // Request sai secret
  const req3 = new Request('https://studio.test/api/publications/webhook/deployment', {
    headers: { 'X-Deployment-Secret': 'wrong_secret' },
  });
  assert.equal(verifyDeploymentWebhookSecret(req3, secret), false);

  // Server chưa cấu hình secret -> Luôn từ chối (Fail-secure)
  assert.equal(verifyDeploymentWebhookSecret(req1, ''), false);
  assert.equal(verifyDeploymentWebhookSecret(req1, undefined), false);
});

test('Snapshot Exporter: Thẩm định sâu, từ chối bài draft và ghi tệp an toàn', { timeout: 10000 }, async () => {
  const tempDest = path.resolve(process.cwd(), `apps/studio/data/test-f3-export-${Date.now()}`);

  try {
    // 1. Thử export với bài viết draft -> Phải bị từ chối trước khi ghi đĩa
    const badSnapshot = {
      ...MOCK_PUBLICATION.snapshot,
      modules: {
        ...MOCK_PUBLICATION.snapshot.modules,
        journal: [
          ...DEFAULT_JOURNAL_DATA,
          { slug: 'bai-nhap-chua-duyet', title: 'Draft', status: 'draft', content: [] },
        ],
      },
    };

    const failRes = exportApprovedSnapshot(badSnapshot, tempDest);
    assert.equal(failRes.success, false);
    assert.ok(failRes.validationErrors?.journal);
    assert.equal(fs.existsSync(tempDest), false, 'Không được tạo thư mục nếu kiểm định thất bại');

    // 2. Export snapshot hợp lệ cùng tài sản media đã duyệt
    const validRes = exportApprovedSnapshot(MOCK_PUBLICATION.snapshot, tempDest, {
      approvedAssets: [
        { relativePath: 'public/images/illustrations/a01.webp', content: Buffer.from('FAKE_WEBP_BYTES') },
      ],
    });

    assert.equal(validRes.success, true);
    assert.equal(validRes.filesWritten.length, 4);
    assert.ok(fs.existsSync(path.join(tempDest, 'src/data/published-snapshot.json')));
    assert.ok(fs.existsSync(path.join(tempDest, 'src/data/journal-entries.json')));
    assert.ok(fs.existsSync(path.join(tempDest, 'src/data/product-sales-config.json')));
    assert.ok(fs.existsSync(path.join(tempDest, 'public/images/illustrations/a01.webp')));
  } finally {
    if (fs.existsSync(tempDest)) {
      fs.rmSync(tempDest, { recursive: true, force: true });
    }
  }
});

test('Production Config: wrangler.production.toml cấu hình chuẩn và fail-secure', { timeout: 10000 }, async () => {
  const prodConfigPath = path.resolve(process.cwd(), 'apps/studio/wrangler.production.toml');
  assert.ok(fs.existsSync(prodConfigPath), 'wrangler.production.toml phải tồn tại');
  const content = fs.readFileSync(prodConfigPath, 'utf-8');

  assert.ok(content.includes('STUDIO_ENVIRONMENT = "production"'), 'Phải khai báo môi trường production');
  assert.ok(content.includes('database_name = "studio-d1-prod"'), 'Phải khai báo database studio-d1-prod chuyên dụng');
  assert.ok(content.includes('bucket_name = "studio-media-prod"'), 'Phải khai báo kho lưu trữ studio-media-prod chuyên dụng');
  assert.ok(content.includes('studio.mangtheomotnetve.website'), 'Phải cấu hình route tên miền chính thức');
  assert.ok(content.includes('CF_ACCESS_TEAM_DOMAIN'), 'Phải khai báo biến Cloudflare Access Team Domain');
  assert.ok(content.includes('CF_ACCESS_AUD'), 'Phải khai báo biến Cloudflare Access Application AUD');
});

test('Production Bootstrap: Validate email, SQL escaping, ID tất định và áp dụng sạch sẽ trên D1/SQLite', { timeout: 10000 }, async () => {
  const { generateProductionBootstrapSql, validateEmail } = await import('../../../tools/content-studio/bootstrap-production.mjs');
  const { DatabaseSync } = await import('node:sqlite');

  // 1. Kiểm tra xác thực email nghiêm ngặt
  assert.equal(validateEmail('admin@mangtheomotnetve.website'), 'admin@mangtheomotnetve.website');
  assert.throws(() => validateEmail("admin'--@test.com"), /illegal characters/);
  assert.throws(() => validateEmail('admin @test.com'), /illegal characters/);
  assert.throws(() => validateEmail('not-an-email'), /not a valid email/);

  // 2. Kiểm tra tính tất định (Deterministic Output)
  const res1 = await generateProductionBootstrapSql({
    adminEmail: 'admin@mangtheomotnetve.website',
    reviewerEmail: 'reviewer@mangtheomotnetve.website',
    timestamp: '2026-10-13T00:00:00.000Z',
  });
  const res2 = await generateProductionBootstrapSql({
    adminEmail: 'admin@mangtheomotnetve.website',
    reviewerEmail: 'reviewer@mangtheomotnetve.website',
    timestamp: '2026-10-13T00:00:00.000Z',
  });
  assert.equal(res1.sql, res2.sql, 'Kịch bản SQL giữa 2 lần chạy phải giống hệt nhau byte-for-byte');

  // 3. Khẳng định số lượng phân hệ và media
  assert.equal(res1.modulesInitialized, 5);
  assert.equal(res1.mediaAssetsInitialized, 22);
  assert.equal(res1.adminConfigured, true);
  assert.equal(res1.reviewerConfigured, true);

  // 4. Thực thi trực tiếp trên cơ sở dữ liệu SQLite cô lập
  const db = new DatabaseSync(':memory:');
  db.exec(res1.sql);

  const draftsCount = db.prepare('SELECT count(*) as c FROM drafts').get();
  assert.equal(draftsCount.c, 5, 'Phải tạo đúng 5 bản nháp cho 5 phân hệ');

  const revisionsCount = db.prepare('SELECT count(*) as c FROM revisions').get();
  assert.equal(revisionsCount.c, 5, 'Phải tạo đúng 5 revision ban đầu');

  const mediaCount = db.prepare('SELECT count(*) as c FROM media_assets').get();
  assert.equal(mediaCount.c, 22, 'Phải nạp đúng 22 tài sản media chuẩn tắc');

  const usersCount = db.prepare('SELECT count(*) as c FROM users').get();
  assert.equal(usersCount.c, 2, 'Chỉ chứa đúng 2 người dùng được cấu hình (admin và reviewer), không có người dùng giả lập');

  db.close();
});

test('Status Artifact Producer: /_meta/snapshot-status.json trong bản build chứa đúng định dạng và không rò rỉ trường nhạy cảm', { timeout: 10000 }, async () => {
  const artifactPath = path.resolve(process.cwd(), 'dist/_meta/snapshot-status.json');
  assert.ok(fs.existsSync(artifactPath), 'dist/_meta/snapshot-status.json phải được tạo ra sau build');

  const content = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  assert.ok('sha256' in content, 'Phải chứa trường sha256');
  assert.ok('commitSha' in content, 'Phải chứa trường commitSha');
  assert.ok('generatedAt' in content, 'Phải chứa trường generatedAt');
  assert.ok('schemaVersion' in content, 'Phải chứa trường schemaVersion');

  // Khẳng định không rò rỉ bất kỳ dữ liệu nhạy cảm nào
  const rawText = fs.readFileSync(artifactPath, 'utf-8');
  assert.equal(rawText.includes('modules'), false, 'Không được chứa trường modules');
  assert.equal(rawText.includes('users'), false, 'Không được chứa thông tin người dùng');
  assert.equal(rawText.includes('token'), false, 'Không được chứa secret/token');
  assert.equal(rawText.includes('reconciled'), false, 'Không được chứa dữ liệu tài chính nội bộ');
});

test('Release Delta: Chỉ đọc, lọc đúng 12 tệp consumer công khai, loại trừ nghiêm ngặt các tệp cấm và bảo toàn Hero & Techcombank 19077352683012', { timeout: 10000 }, async () => {
  assert.equal(DEFAULT_FINANCE_DATA.donationAccount.accountNumber, '19077352683012');
  assert.equal(DEFAULT_FINANCE_DATA.donationAccount.accountHolder, 'NGUYEN CHI TRUNG');
  assert.equal(DEFAULT_FINANCE_DATA.donationAccount.goalAmount, 7000000);
  assert.equal(DEFAULT_FINANCE_DATA.reconciled, false);
  assert.deepEqual(DEFAULT_FINANCE_DATA.entries, []);
  assert.equal(DEFAULT_FINANCE_DATA.donationAccount.qrImage, '/images/ung-ho/qr-ung-ho-techcombank-nguyen-chi-trung.png');
  assert.equal(fs.existsSync(path.resolve(process.cwd(), 'public/images/ung-ho/qr-ung-ho-techcombank-nguyen-chi-trung.png')), true);
  const { analyzeReleaseDelta, PUBLIC_CONSUMER_ALLOWLIST, FORBIDDEN_PREFIXES } = await import('../../../tools/content-studio/release-delta.mjs');
  const tempPatch = path.resolve(process.cwd(), `docs/evidence/C17/R2-F3-R1/worker/test-release-${Date.now()}.patch`);

  try {
    const res = await analyzeReleaseDelta({ outPath: tempPatch });
    assert.equal(res.matchingFiles.length, 12, 'Phải khớp đúng 12 tệp consumer công khai');
    assert.equal(res.heroPreserved, true, 'Hero assets phải được bảo toàn');
    assert.equal(res.techcombankPreserved, true, 'Tài khoản Techcombank 19077352683012 phải được bảo toàn');
    assert.ok(fs.existsSync(tempPatch), 'Tệp patch xem trước phải được tạo');
    assert.ok(res.patchSizeBytes > 0, 'Kích thước patch phải lớn hơn 0');

    // Khẳng định không có tệp nào trong matchingFiles vi phạm allowlist hoặc tiền tố cấm
    for (const f of res.matchingFiles) {
      assert.ok(PUBLIC_CONSUMER_ALLOWLIST.includes(f), `Tệp ${f} phải nằm trong allowlist`);
      for (const forbidden of FORBIDDEN_PREFIXES) {
        assert.ok(!f.startsWith(forbidden), `Tệp ${f} không được bắt đầu bằng ${forbidden}`);
      }
    }
  } finally {
    if (fs.existsSync(tempPatch)) {
      fs.unlinkSync(tempPatch);
    }
  }
});


