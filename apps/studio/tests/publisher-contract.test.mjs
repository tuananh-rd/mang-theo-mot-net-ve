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

test('Live Verifier: Xác thực thành công khi artifact khớp chính xác SHA-256', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };
  const mockFetch = async () => {
    return new Response(JSON.stringify({
      sha256: MOCK_PUBLICATION.snapshot.sha256,
      commitSha: 'commit_123',
      generatedAt: '2026-10-13T06:05:00.000Z',
    }), { status: 200 });
  };

  const res = await verifyLiveDeployment(MOCK_PUBLICATION, env, { fetchFn: mockFetch });
  assert.equal(res.verified, true);
  assert.equal(res.deployStatus, 'success');
  assert.ok(res.verifiedAt);
});

test('Live Verifier: Phát hiện bản triển khai cũ (Stale) và không khớp (Mismatch)', { timeout: 10000 }, async () => {
  const env = { PRODUCTION_SITE_ORIGIN: 'https://mangtheomotnetve.website' };

  // 1. Bản cũ (Stale)
  const staleFetch = async () => {
    return new Response(JSON.stringify({
      sha256: 'old_sha_0000000000000000000000000000000000000000000000000000000000000000',
      generatedAt: '2026-10-10T00:00:00.000Z', // Cũ hơn generatedAt của MOCK_PUBLICATION (2026-10-13)
    }), { status: 200 });
  };
  const resStale = await verifyLiveDeployment(MOCK_PUBLICATION, env, { fetchFn: staleFetch });
  assert.equal(resStale.verified, false);
  assert.equal(resStale.deployStatus, 'stale');

  // 2. Không khớp (Mismatch)
  const mismatchFetch = async () => {
    return new Response(JSON.stringify({
      sha256: 'other_sha_1111111111111111111111111111111111111111111111111111111111111111',
      generatedAt: '2026-10-14T00:00:00.000Z', // Mới hơn nhưng khác hash
    }), { status: 200 });
  };
  const resMismatch = await verifyLiveDeployment(MOCK_PUBLICATION, env, { fetchFn: mismatchFetch });
  assert.equal(resMismatch.verified, false);
  assert.equal(resMismatch.deployStatus, 'mismatch');
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

test('Production Bootstrap: generateProductionBootstrapSql sinh đúng kịch bản schema, RBAC, 5 phân hệ và 22 media', { timeout: 10000 }, async () => {
  const { generateProductionBootstrapSql } = await import('../../../tools/content-studio/bootstrap-production.mjs');
  const res = await generateProductionBootstrapSql({
    adminEmail: 'admin@mangtheomotnetve.website',
    reviewerEmail: 'reviewer@mangtheomotnetve.website',
  });

  assert.equal(res.adminConfigured, true);
  assert.equal(res.reviewerConfigured, true);
  assert.equal(res.modulesInitialized, 5);
  assert.equal(res.mediaAssetsInitialized, 22);

  assert.ok(res.sql.includes('CREATE TABLE IF NOT EXISTS users'));
  assert.ok(res.sql.includes('CREATE TABLE IF NOT EXISTS publications'));
  assert.ok(res.sql.includes('INSERT OR IGNORE INTO users'));
  assert.ok(res.sql.includes('admin@mangtheomotnetve.website'));
  assert.ok(res.sql.includes('reviewer@mangtheomotnetve.website'));
  assert.ok(res.sql.includes('INSERT OR IGNORE INTO drafts'));
  assert.ok(res.sql.includes('INSERT OR IGNORE INTO media_assets'));
});

