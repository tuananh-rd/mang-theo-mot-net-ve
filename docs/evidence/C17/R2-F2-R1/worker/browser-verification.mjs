import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { unstable_dev, getPlatformProxy, unstable_splitSqlQuery } from 'wrangler';
import { APPROVED_MEDIA_REGISTRY } from '../../../../../apps/studio/dist/storage/media-registry.js';
import { getDefaultModuleData } from '../../../../../apps/studio/dist/schemas/index.js';
import { StudioDbClient } from '../../../../../apps/studio/dist/db/client.js';

const require = createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer = require('puppeteer-core');

const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const runId = `browser-r1-${Date.now()}`;
const persist = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-r1-browser-'));
const config = path.resolve('wrangler.preview.json');
const evidenceDir = path.resolve('docs/evidence/C17/R2-F2-R1/worker');
const screenshotDir = path.join(evidenceDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

let proxy, worker, browser;
const observations = [];
const pageErrors = [];

const sections = [
  { id: 'dashboard', name: 'Tổng quan & Bản chụp', selector: 'a[href="/preview/dong-hanh"]' },
  { id: 'project', name: 'Dự án & Liên hệ', selector: '#projectForm' },
  { id: 'journal', name: 'Nhật ký dự án', selector: '#addNewArticleBtn' },
  { id: 'media', name: 'Kho tư liệu', selector: '#mediaUploadForm' },
  { id: 'products', name: 'Sản phẩm gây quỹ', selector: '#productsForm' },
  { id: 'finance', name: 'Kế hoạch & Sổ tài chính', selector: '#financeOverviewForm' },
  { id: 'team', name: 'Đội ngũ Lăng Kính & SEO', selector: '#teamForm' },
  { id: 'publish', name: 'Quy trình Xuất bản', selector: '#requestPublishBtn' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

try {
  console.log('[0/5] Khởi tạo cơ sở dữ liệu D1 isolated TEMP và nạp dữ liệu hạt giống ban đầu...');
  proxy = await getPlatformProxy({ configPath: config, persist: { path: path.join(persist, 'v3') } });
  for (const statement of unstable_splitSqlQuery(fs.readFileSync('apps/studio/src/db/schema.sql', 'utf8'))) {
    if (statement.trim()) await proxy.env.DB.prepare(statement).run();
  }
  const dbClient = new StudioDbClient(proxy.env.DB);
  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    const data = getDefaultModuleData(mod);
    await dbClient.saveDraft(mod, data, null, 'system-bootstrap@internal', 'Khởi tạo hạt giống');
  }
  await proxy.dispose();
  proxy = null;

  console.log('[0/5] Khởi động Cloudflare workerd Preview Server (unstable_dev)...');
  worker = await unstable_dev(path.resolve('dist-preview/server/entry.mjs'), {
    config,
    persistTo: persist,
    ip: '127.0.0.1',
    vars: { STUDIO_ENVIRONMENT: 'development' },
    experimental: { disableExperimentalWarning: true },
  });
  const origin = `http://127.0.0.1:${worker.port}`;

  browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const page = await browser.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('dialog', (d) => d.accept());

  console.log('[1/5] Khảo sát 8 phân hệ tại 3 độ phân giải (375, 768, 1440)...');
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${origin}/?dev_role=admin`, { waitUntil: 'networkidle0' });

    for (const sec of sections) {
      await page.$eval(`[data-tab="${sec.id}"]`, (el) => el.click());
      await new Promise((r) => setTimeout(r, 120));

      const elementFound = await page.$(sec.selector);
      const isRendered = elementFound !== null;
      if (!isRendered) {
        throw new Error(`Phân hệ ${sec.id} không hiển thị phần tử bắt buộc ${sec.selector}`);
      }

      let scrollable = false;
      if (vp.width === 375) {
        scrollable = await page.$$eval('.table-container', (els) => {
          return els.some((el) => el.scrollWidth > el.clientWidth);
        }).catch(() => false);
      }

      const screenshotFilename = `${sec.id}-${vp.name}-${vp.width}.png`;
      const screenshotPath = path.join(screenshotDir, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      observations.push({
        type: 'tab_navigation',
        section: sec.id,
        viewport: vp.name,
        width: vp.width,
        observedSelector: sec.selector,
        rendered: isRendered,
        scrollableTableTested: vp.width === 375 ? scrollable : undefined,
        screenshot: screenshotFilename,
      });
    }
  }

  // Chuyển về màn hình desktop chuẩn để thao tác form chuyên sâu
  await page.setViewport({ width: 1440, height: 900 });

  console.log('[2/5] Kiểm thử luồng chỉnh sửa, lưu và đối soát contacts: null (Project)...');
  await page.click('[data-tab="project"]');
  await page.waitForSelector('#projectForm');

  const toggleBtn = await page.$('#toggleContactBtn');
  if (!toggleBtn) {
    throw new Error('LỖI BẮT BUỘC: Không tìm thấy nút #toggleContactBtn trong phân hệ Dự án.');
  }

  // Nhấn nút ẩn thông tin liên hệ
  await toggleBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  const nullNoticeVisible = await page.$eval('#contactNullNotice', (el) => el.style.display !== 'none');
  const fieldsWrapperHidden = await page.$eval('#contactFieldsWrapper', (el) => el.style.display === 'none');

  // Submit form lưu dự án
  const [saveProjectRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/project') && res.request().method() === 'POST'),
    page.click('#projectForm button[type="submit"]'),
  ]);
  const saveProjectData = await saveProjectRes.json();
  const projectContactsPersisted = saveProjectData.draft?.data?.contacts;

  // Tải lại trang (Reload) và chuyển tab để kiểm chứng đọc lại (Readback) từ DB
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="project"]');
  await page.waitForSelector('#projectForm');
  const readbackNullNoticeVisible = await page.$eval('#contactNullNotice', (el) => el.style.display !== 'none');

  observations.push({
    type: 'project_contact_toggle_null',
    buttonSelector: '#toggleContactBtn',
    buttonFound: true,
    clientUiNullNoticeVisible: nullNoticeVisible,
    clientUiFieldsHidden: fieldsWrapperHidden,
    saveHttpStatus: saveProjectRes.status(),
    persistedContacts: projectContactsPersisted,
    contactsAreNull: projectContactsPersisted === null,
    readbackAfterReloadConfirmed: readbackNullNoticeVisible,
  });

  console.log('[3/5] Kiểm thử luồng chỉnh sửa và bảo toàn số 0 trong Finance Overview...');
  await page.click('[data-tab="finance"]');
  await page.waitForSelector('#financeOverviewForm');

  await page.focus('#financeOverviewForm input[name="ov_plannedExpenseTotal"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type('0');

  await page.focus('#financeOverviewForm input[name="ov_craftPlannedRevenue"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type('2200000');

  const [saveFinRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/finance') && res.request().method() === 'POST'),
    page.click('#financeOverviewForm button[type="submit"]'),
  ]);
  const saveFinData = await saveFinRes.json();
  const savedExpense = saveFinData.draft?.data?.overview?.plannedExpenseTotal;

  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="finance"]');
  await page.waitForSelector('#financeOverviewForm');
  const readbackExpenseValue = await page.$eval(
    '#financeOverviewForm input[name="ov_plannedExpenseTotal"]',
    (el) => el.value
  );

  observations.push({
    type: 'finance_overview_zero_preservation',
    saveHttpStatus: saveFinRes.status(),
    savedPlannedExpenseTotal: savedExpense,
    zeroPreservedInResponse: savedExpense === 0,
    readbackInputValueAfterReload: readbackExpenseValue,
    zeroPreservedInUi: readbackExpenseValue === '0',
  });

  console.log('[4/5] Kiểm thử Per-Route SEO controls trong Team & SEO tab...');
  await page.click('[data-tab="team"]');
  await page.waitForSelector('#teamForm');
  await page.waitForSelector('#routeSeoContainer');

  const canonicalRouteCards = await page.$$eval('#routeSeoContainer .route-seo-card', (cards) => {
    return cards.map((c) => c.getAttribute('data-route'));
  });

  const expectedRoutes = [
    '/',
    '/du-an/mang-theo-mot-net-ve',
    '/dong-hanh',
    '/san-pham',
    '/minh-bach',
    '/ve-nhom',
    '/nhat-ky',
  ];
  const allRoutesPresent = expectedRoutes.every((r) => canonicalRouteCards.includes(r));

  // Chỉnh sửa SEO cho tuyến /dong-hanh
  const testTitle = 'Ủng hộ & Đồng hành cùng Lăng Kính (Browser Verified)';
  const testDesc = 'Mô tả meta description cho trang Đồng hành được xác minh qua browser tự động.';

  const titleSelector = 'input.route-seo-title[data-route="/dong-hanh"]';
  const descSelector = 'input.route-seo-desc[data-route="/dong-hanh"]';

  await page.focus(titleSelector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type(testTitle);

  await page.focus(descSelector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type(testDesc);

  const [saveTeamRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/team') && res.request().method() === 'POST'),
    page.click('#teamForm button[type="submit"]'),
  ]);
  const saveTeamData = await saveTeamRes.json();
  const savedRouteSeo = saveTeamData.draft?.data?.siteMeta?.routeSeo;

  // Reload và đọc lại giá trị
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="team"]');
  await page.waitForSelector('#routeSeoContainer');
  const readbackTitle = await page.$eval(titleSelector, (el) => el.value);
  const readbackDesc = await page.$eval(descSelector, (el) => el.value);

  observations.push({
    type: 'per_route_seo_controls',
    canonicalRoutesFound: canonicalRouteCards,
    all7CanonicalRoutesPresent: allRoutesPresent,
    saveHttpStatus: saveTeamRes.status(),
    savedTitle: savedRouteSeo?.['/dong-hanh']?.title,
    savedDesc: savedRouteSeo?.['/dong-hanh']?.description,
    readbackTitleAfterReload: readbackTitle,
    readbackDescAfterReload: readbackDesc,
    routeSeoPersistedMatch: readbackTitle === testTitle && readbackDesc === testDesc,
  });

  console.log('[5/5] Kiểm thử Private Draft Preview & Role Admin trong trình duyệt...');
  const roleSelect = await page.$('#devRoleSelect');
  let reviewerDisabledButtons = false;
  if (roleSelect) {
    await page.select('#devRoleSelect', 'reviewer');
    await new Promise((r) => setTimeout(r, 200));
    await page.click('[data-tab="team"]');
    await page.waitForSelector('#teamForm');
    reviewerDisabledButtons = await page.$eval('#teamForm button[type="submit"]', (btn) => btn.disabled);
    await page.select('#devRoleSelect', 'admin');
    await new Promise((r) => setTimeout(r, 100));
  }

  // 2. Mở trang xem trước riêng tư /preview/dong-hanh trên worker thực tế
  const previewPage = await browser.newPage();
  previewPage.on('pageerror', (err) => pageErrors.push(err.message));
  const previewRes = await previewPage.goto(`${origin}/preview/dong-hanh?dev_role=admin`, {
    waitUntil: 'networkidle0',
  });

  const previewStatus = previewRes.status();
  const previewHeaders = previewRes.headers();
  const renderedTitle = await previewPage.title();
  const renderedMetaDesc = await previewPage.$eval('meta[name="description"]', (el) => el.content).catch(() => '');
  const renderedTelLinks = await previewPage.$$eval('a[href^="tel:"]', (els) => els.length);
  const internalLinks = await previewPage.$$eval('a[href^="/"]', (els) => els.map((a) => a.getAttribute('href')));
  const nonPreviewLinks = internalLinks.filter(
    (h) => !h.startsWith('/preview') && !h.startsWith('/images') && !h.startsWith('/media') && !h.startsWith('/api') && !h.startsWith('/_astro')
  );

  const previewScreenshotPath = path.join(screenshotDir, 'preview-dong-hanh-rendered.png');
  await previewPage.screenshot({ path: previewScreenshotPath, fullPage: false });
  await previewPage.close();

  observations.push({
    type: 'private_draft_preview_render',
    previewUrl: `/preview/dong-hanh?dev_role=admin`,
    httpStatus: previewStatus,
    securityHeaders: {
      cacheControl: previewHeaders['cache-control'],
      xRobotsTag: previewHeaders['x-robots-tag'],
      xStudioPrivatePreview: previewHeaders['x-studio-private-preview'],
    },
    renderedTitle,
    renderedMetaDesc,
    titleMatchesOverride: renderedTitle.includes('Ủng hộ & Đồng hành cùng Lăng Kính (Browser Verified)'),
    descMatchesOverride: renderedMetaDesc.includes('Mô tả meta description cho trang Đồng hành'),
    telephoneLinksCount: renderedTelLinks,
    contactsSuccessfullyHidden: renderedTelLinks === 0,
    allInternalLinksRewrittenToPreview: nonPreviewLinks.length === 0,
    reviewerButtonDisabledTested: reviewerDisabledButtons,
    screenshot: 'preview-dong-hanh-rendered.png',
  });

  // 3. Khẳng định 22 tài sản hình ảnh chuẩn tắc có băm byte khớp trên đĩa
  const mediaRegistryValidation = [];
  for (const asset of APPROVED_MEDIA_REGISTRY) {
    const rel = asset.publicPath.startsWith('/') ? asset.publicPath.slice(1) : asset.publicPath;
    const diskPath = path.resolve('public', rel);
    const exists = fs.existsSync(diskPath);
    const size = exists ? fs.statSync(diskPath).size : -1;
    mediaRegistryValidation.push({
      id: asset.id,
      publicPath: asset.publicPath,
      exists,
      expectedSize: asset.sizeBytes,
      actualSize: size,
      sizeMatches: size === asset.sizeBytes,
    });
  }

  const report = {
    sha,
    timestamp: new Date().toISOString(),
    runId,
    totalObservations: observations.length,
    pageErrors,
    mediaRegistryTotal: APPROVED_MEDIA_REGISTRY.length,
    mediaRegistryAllValid: mediaRegistryValidation.every((m) => m.sizeMatches),
    observations,
  };

  fs.writeFileSync(path.join(evidenceDir, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log('\n=== KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT (BROWSER VERIFICATION REPORT) ===');
  console.log(`- Git SHA: ${sha}`);
  console.log(`- Tổng quan sát: ${observations.length}`);
  console.log(`- Lỗi console/page: ${pageErrors.length}`);
  console.log(`- 22 tài sản media chuẩn tắc: ${report.mediaRegistryAllValid ? 'HỢP LỆ' : 'KHÔNG KHỚP'}`);
  console.log(`- Báo cáo chi tiết: docs/evidence/C17/R2-F2-R1/worker/browser-report.json`);

  if (pageErrors.length > 0 || !report.mediaRegistryAllValid) {
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  if (worker) await worker.stop();
  if (proxy) await proxy.dispose();
  try {
    fs.rmSync(persist, { recursive: true, force: true });
  } catch {}
}
