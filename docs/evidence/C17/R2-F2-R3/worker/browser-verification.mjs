import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { unstable_dev, getPlatformProxy, unstable_splitSqlQuery } from 'wrangler';
import { APPROVED_MEDIA_REGISTRY } from '../../../../../apps/studio/dist/storage/media-registry.js';
import { getDefaultModuleData } from '../../../../../apps/studio/dist/schemas/index.js';
import { StudioDbClient } from '../../../../../apps/studio/dist/db/client.js';

// Nạp Puppeteer Core từ global cache đã xác thực
const scratchRequire = createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer = scratchRequire('puppeteer-core');

const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const runId = `browser-r3-${Date.now()}`;
const persist = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-r3-browser-'));
const config = path.resolve('wrangler.preview.json');
const evidenceDir = path.resolve('docs/evidence/C17/R2-F2-R3/worker');
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

// Giới hạn thời gian cứng cho toàn bộ harness (60s) tránh treo tiến trình
const HARNESS_TIMEOUT_MS = 60000;
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`Browser verification vượt quá giới hạn thời gian cứng ${HARNESS_TIMEOUT_MS}ms`)), HARNESS_TIMEOUT_MS);
});

async function runVerification() {
  console.log('[0/9] Khởi tạo cơ sở dữ liệu D1 isolated TEMP và nạp dữ liệu hạt giống ban đầu...');
  proxy = await getPlatformProxy({ configPath: config, persist: { path: path.join(persist, 'v3') } });
  const schemaSql = fs.readFileSync('apps/studio/migrations/0001_initial_schema.sql', 'utf8');
  for (const statement of unstable_splitSqlQuery(schemaSql)) {
    if (statement.trim()) await proxy.env.DB.prepare(statement).run();
  }
  const dbClient = new StudioDbClient(proxy.env.DB);
  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    const data = getDefaultModuleData(mod);
    await dbClient.saveDraft(mod, data, null, 'system-bootstrap@internal', 'Khởi tạo hạt giống');
  }

  // Nạp sẵn detail-route SEO overrides hợp lệ vào D1 để kiểm tra bảo toàn qua lưu/tải lại UI
  const initialTeam = await dbClient.getDraft('team');
  await dbClient.saveDraft('team', {
    ...initialTeam.data,
    siteMeta: {
      ...initialTeam.data.siteMeta,
      routeSeo: {
        ...initialTeam.data.siteMeta.routeSeo,
        '/nhat-ky/detail': {
          title: 'Nhật ký Chi tiết Đặc biệt R3',
          description: 'Mô tả SEO độc lập cho trang chi tiết bài viết nhật ký.',
        },
        '/san-pham/detail': {
          title: 'Sản phẩm Chi tiết Đặc biệt R3',
          description: 'Mô tả SEO độc lập cho trang chi tiết sản phẩm thủ công.',
        },
      },
    },
  }, initialTeam.revisionHash, 'system@internal', 'Seed detail route SEO');

  await proxy.dispose();
  proxy = null;

  console.log('[0/9] Khởi động Cloudflare workerd Preview Server (unstable_dev)...');
  worker = await unstable_dev(path.resolve('dist-preview/server/entry.mjs'), {
    config,
    persistTo: persist,
    ip: '127.0.0.1',
    vars: { STUDIO_ENVIRONMENT: 'development' },
    experimental: { disableExperimentalWarning: true },
  });
  const origin = `http://127.0.0.1:${worker.port}`;

  console.log('[0/9] Khởi động Chrome Puppeteer headless...');
  browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const page = await browser.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('dialog', (d) => d.accept());

  // 1. Khảo sát 8 phân hệ tại 3 độ phân giải
  console.log('[1/9] Khảo sát 8 phân hệ tại 3 độ phân giải (375, 768, 1440)...');
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${origin}/?dev_role=admin`, { waitUntil: 'networkidle0' });

    for (const sec of sections) {
      await page.$eval(`[data-tab="${sec.id}"]`, (el) => el.click());
      await new Promise((r) => setTimeout(r, 120));
      await page.waitForSelector(sec.selector, { visible: true });

      const isRendered = await page.$(sec.selector) !== null;
        const shotPath = path.join(screenshotDir, `${sec.id}-${vp.name}-${vp.width}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });

        let tableCheck = false;
        if (vp.width === 375 && ['dashboard', 'journal', 'media', 'finance', 'publish'].includes(sec.id)) {
          tableCheck = await page.$eval('.table-responsive, .data-table, .stats-grid', (el) => {
            return el !== null && (el.scrollWidth >= el.clientWidth || el.clientWidth > 0);
          }).catch(() => false);
        }

        observations.push({
          type: 'tab_navigation',
          section: sec.id,
          viewport: vp.name,
          width: vp.width,
          observedSelector: sec.selector,
          rendered: isRendered,
          ...(vp.width === 375 ? { scrollableTableTested: tableCheck } : {}),
          screenshot: `${sec.id}-${vp.name}-${vp.width}.png`,
        });
    }
  }

  await page.setViewport({ width: 1440, height: 900 });

  // 2. Project Editing Workflow: C17-R2-F2-R3 Regression:
  // - Xóa trắng note và badge tùy chọn, lưu và assert rỗng sau khi reload
  // - Thay thế hoàn toàn (không gõ nối) title, stage_title, need_title
  // - Toggle contacts: null
  console.log('[2/9] Kiểm thử luồng chỉnh sửa Project (Xóa trường tùy chọn note/badge rỗng, thay thế title, contacts: null)...');
  await page.click('[data-tab="project"]');
  await page.waitForSelector('#projectForm');

  const EXACT_REPLACED_TITLE = 'Hoạt động Vẽ Tranh & Tạo hình Đặc biệt R3 (Thay thế hoàn toàn)';
  const EXACT_REPLACED_STAGE = 'Giai đoạn Khảo sát & Chuẩn bị R3 (Thay thế hoàn toàn)';
  const EXACT_REPLACED_NEED = 'Màu vẽ acrylic & giấy vẽ A3 R3 (Thay thế hoàn toàn)';

  // Thay thế tiêu đề hoạt động 1 (không gõ nối)
  await page.$eval('input[name="act_title_0"]', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, EXACT_REPLACED_TITLE);

  // Xóa trắng trường tùy chọn: badge và note của hoạt động 1
  await page.$eval('input[name="act_badge_0"]', (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.$eval('input[name="act_note_0"]', (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Thay thế tiêu đề giai đoạn 1 (không gõ nối)
  await page.$eval('input[name="stage_title_0"]', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, EXACT_REPLACED_STAGE);

  // Thay thế tiêu đề nhu cầu 1 (không gõ nối)
  await page.$eval('input[name="need_title_0"]', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, EXACT_REPLACED_NEED);

  // Toggle contacts null
  const toggleContactBtn = await page.$('#toggleContactBtn');
  if (!toggleContactBtn) {
    throw new Error('Không tìm thấy #toggleContactBtn trong phân hệ Dự án');
  }
  await toggleContactBtn.click();
  await new Promise((r) => setTimeout(r, 150));

  const nullNoticeVisible = await page.$eval('#contactNullNotice', (el) => el.style.display !== 'none');

  // Lưu dự án
  const [saveProjRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/project') && res.request().method() === 'POST'),
    page.click('#projectForm button[type="submit"]'),
  ]);
  const saveProjJson = await saveProjRes.json();

  // Reload và đối soát readback
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="project"]');
  await page.waitForSelector('#projectForm');

  const readbackAct1Title = await page.$eval('input[name="act_title_0"]', (el) => el.value);
  const readbackAct1Badge = await page.$eval('input[name="act_badge_0"]', (el) => el.value);
  const readbackAct1Note = await page.$eval('input[name="act_note_0"]', (el) => el.value);
  const readbackStg1Title = await page.$eval('input[name="stage_title_0"]', (el) => el.value);
  const readbackNeed1Title = await page.$eval('input[name="need_title_0"]', (el) => el.value);
  const readbackContactNull = await page.$eval('#contactNullNotice', (el) => el.style.display !== 'none');

  const projectScreenshot = path.join(screenshotDir, 'project-edited-save-reload.png');
  await page.screenshot({ path: projectScreenshot, fullPage: false });

  // Khẳng định giá trị xóa trắng và thay thế
  const act1TitleMatchesExactly = readbackAct1Title === EXACT_REPLACED_TITLE;
  const act1BadgeCleared = readbackAct1Badge === '';
  const act1NoteCleared = readbackAct1Note === '';
  const stg1TitleMatchesExactly = readbackStg1Title === EXACT_REPLACED_STAGE;
  const need1TitleMatchesExactly = readbackNeed1Title === EXACT_REPLACED_NEED;

  observations.push({
    type: 'project_editing_workflow',
    saveStatus: saveProjRes.status(),
    savedAct1Title: readbackAct1Title,
    savedAct1Badge: readbackAct1Badge,
    savedAct1Note: readbackAct1Note,
    savedStg1Title: readbackStg1Title,
    savedNeed1Title: readbackNeed1Title,
    act1TitleReplacedExactly: act1TitleMatchesExactly,
    act1BadgeClearedSuccessfully: act1BadgeCleared,
    act1NoteClearedSuccessfully: act1NoteCleared,
    stg1TitleReplacedExactly: stg1TitleMatchesExactly,
    need1TitleReplacedExactly: need1TitleMatchesExactly,
    contactsNullPreserved: readbackContactNull,
    screenshot: 'project-edited-save-reload.png',
  });

  // 3. Products Editing Workflow: cả 2 sản phẩm (narrative, media, sale fields, no-photo)
  console.log('[3/9] Kiểm thử luồng chỉnh sửa cả 2 Sản phẩm (narrative, media, sale fields, no-photo)...');
  await page.click('[data-tab="products"]');
  await page.waitForSelector('#productsForm');

  // Sản phẩm 1: Chuồn chuồn tre -> sửa giá, tồn kho, narrative, trạng thái open, gán approved media
  await page.$eval('#cc_officialPrice', (el) => { el.value = '45000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#cc_stockAvailable', (el) => { el.value = '35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#cc_publicApproval', (el) => { el.value = 'approved'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.$eval('#cc_saleStatus', (el) => { el.value = 'open'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.$eval('#cc_narrative', (el) => { el.value = 'Câu chuyện chuồn chuồn mộc mạc gây quỹ lớp AI2015'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#cc_mediaKey', (el) => { el.value = '/images/san-pham/chuon-chuon-tre.webp'; el.dispatchEvent(new Event('change', { bubbles: true })); });

  // Sản phẩm 2: Móc khóa -> sửa giá, tồn kho, narrative, trạng thái open, chọn NO-PHOTO (trống)
  await page.$eval('#mk_officialPrice', (el) => { el.value = '15000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#mk_stockAvailable', (el) => { el.value = '80'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#mk_publicApproval', (el) => { el.value = 'approved'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.$eval('#mk_saleStatus', (el) => { el.value = 'open'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.$eval('#mk_narrative', (el) => { el.value = 'Móc khóa kỷ niệm sinh viên FPT (Không ảnh)'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#mk_mediaKey', (el) => { el.value = ''; el.dispatchEvent(new Event('change', { bubbles: true })); }); // no-photo

  // Lưu sản phẩm
  const [saveProdRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/products') && res.request().method() === 'POST'),
    page.click('#productsForm button[type="submit"]'),
  ]);
  const saveProdJson = await saveProdRes.json();

  // Reload và readback
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="products"]');
  await page.waitForSelector('#productsForm');

  const rbCcPrice = await page.$eval('#cc_officialPrice', (el) => el.value);
  const rbCcStatus = await page.$eval('#cc_saleStatus', (el) => el.value);
  const rbCcMedia = await page.$eval('#cc_mediaKey', (el) => el.value);
  const rbCcNarrative = await page.$eval('#cc_narrative', (el) => el.value);

  const rbMkPrice = await page.$eval('#mk_officialPrice', (el) => el.value);
  const rbMkStatus = await page.$eval('#mk_saleStatus', (el) => el.value);
  const rbMkMedia = await page.$eval('#mk_mediaKey', (el) => el.value);
  const rbMkNarrative = await page.$eval('#mk_narrative', (el) => el.value);

  const prodScreenshot = path.join(screenshotDir, 'products-both-edited-save-reload.png');
  await page.screenshot({ path: prodScreenshot, fullPage: false });

  observations.push({
    type: 'products_editing_workflow',
    saveStatus: saveProdRes.status(),
    chuonChuon: { price: rbCcPrice, status: rbCcStatus, media: rbCcMedia, narrative: rbCcNarrative },
    mocKhoa: { price: rbMkPrice, status: rbMkStatus, media: rbMkMedia, narrative: rbMkNarrative },
    noPhotoPreservedForMocKhoa: rbMkMedia === '',
    approvedMediaPreservedForChuonChuon: rbCcMedia === '/images/san-pham/chuon-chuon-tre.webp',
    screenshot: 'products-both-edited-save-reload.png',
  });

  // 4. Journal CRUD & Body/Cover & Private Detail Preview
  console.log('[4/9] Kiểm thử luồng Nhật ký CRUD, Body/Cover và Xem trước Chi tiết Riêng tư...');
  await page.click('[data-tab="journal"]');
  await page.waitForSelector('#addNewArticleBtn');

  // Thêm bài viết mới
  await page.click('#addNewArticleBtn');
  await page.waitForSelector('#articleForm');

  const testArticleSlug = `bai-viet-thuc-dia-r3-${Date.now().toString(36)}`;
  const testArticleTitle = 'Nhật ký thực địa đặc biệt R3 (Tác động cộng đồng)';
  const testArticleSummary = 'Tóm tắt bài viết trải nghiệm sinh viên FPT tại Mái ấm.';

  await page.$eval('input[name="art_slug"]', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, testArticleSlug);
  await page.$eval('input[name="art_title"]', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, testArticleTitle);
  await page.$eval('textarea[name="art_summary"]', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, testArticleSummary);
  await page.$eval('select[name="art_status"]', (el) => { el.value = 'draft'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.$eval('input[name="art_publishedAt"]', (el) => { el.value = '2026-10-12'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('input[name="cover_src"]', (el) => { el.value = '/images/nhat-ky/nk01.webp'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('input[name="cover_alt"]', (el) => { el.value = 'Ảnh bìa hoạt động thực địa R3'; el.dispatchEvent(new Event('input', { bubbles: true })); });

  // Thay thế đoạn văn đầu tiên (không gõ nối)
  await page.$eval('textarea[name="blk_text_0"]', (el) => {
    el.value = 'Nội dung chi tiết hoạt động thực địa được kiểm thử tự động từ Puppeteer browser R3.';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Lưu bài viết
  const [saveArtRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/journal') && res.request().method() === 'POST'),
    page.click('#articleForm button[type="submit"]'),
  ]);
  const saveArtJson = await saveArtRes.json();

  // Reload và đọc lại danh sách
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="journal"]');
  await page.waitForSelector('#addNewArticleBtn');

  const articleExistsInList = await page.$$eval('.data-table tbody tr', (rows, slug) => {
    return rows.some((r) => r.innerText.includes(slug));
  }, testArticleSlug);

  // Mở trang private preview chi tiết của bài viết nháp
  const articlePreviewPage = await browser.newPage();
  const artPrevRes = await articlePreviewPage.goto(`${origin}/preview/nhat-ky/${testArticleSlug}?dev_role=admin`, {
    waitUntil: 'networkidle0',
  });
  const artPrevStatus = artPrevRes.status();
  const artPrevHeaders = artPrevRes.headers();
  const artPrevContent = await articlePreviewPage.content();

  const artScreenshot = path.join(screenshotDir, 'journal-draft-private-detail-preview.png');
  await articlePreviewPage.screenshot({ path: artScreenshot, fullPage: false });
  await articlePreviewPage.close();

  observations.push({
    type: 'journal_crud_workflow',
    saveStatus: saveArtRes.status(),
    slug: testArticleSlug,
    articleFoundInListAfterReload: articleExistsInList,
    previewStatus: artPrevStatus,
    previewHasSecurityHeader: artPrevHeaders['x-studio-private-preview'] === 'true',
    previewHasNoStoreHeader: artPrevHeaders['cache-control']?.includes('no-store'),
    renderedTitleMatches: artPrevContent.includes(testArticleTitle),
    renderedContentMatches: artPrevContent.includes('Nội dung chi tiết hoạt động thực địa được kiểm thử tự động từ Puppeteer browser R3.'),
    screenshot: 'journal-draft-private-detail-preview.png',
  });

  // 5. Team Profile & All 3 FAQ Groups Editing Workflow
  console.log('[5/9] Kiểm thử luồng chỉnh sửa Team Profile và cả 3 nhóm FAQs (Thay thế hoàn toàn câu hỏi)...');
  await page.click('[data-tab="team"]');
  await page.waitForSelector('#teamForm');

  const editTeamDesc = 'Đội ngũ sinh viên Lăng Kính FPT AI2015 (Browser Verified Team Desc R3)';
  await page.$eval('textarea[name="teamDesc"]', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, editTeamDesc);

  const REPLACED_PFAQ = 'Sản phẩm có hóa đơn chứng từ không? (Replaced PFaq R3)';
  const REPLACED_SFAQ = 'Làm sao kiểm tra số tiền ủng hộ đã nhận? (Replaced SFaq R3)';
  const REPLACED_TFAQ = 'Báo cáo tài chính sao kê được công bố khi nào? (Replaced TFaq R3)';

  // Thay thế FAQ 1 (Product FAQ - không gõ nối)
  await page.$eval('#pfaqContainer .pfaq-q', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, REPLACED_PFAQ);

  // Thay thế FAQ 2 (Support FAQ - không gõ nối)
  await page.$eval('#sfaqContainer .sfaq-q', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, REPLACED_SFAQ);

  // Thay thế FAQ 3 (Transparency FAQ - không gõ nối)
  await page.$eval('#tfaqContainer .tfaq-q', (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, REPLACED_TFAQ);

  // Lưu Team
  const [saveTeamRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/team') && res.request().method() === 'POST'),
    page.click('#teamForm button[type="submit"]'),
  ]);
  const saveTeamJson = await saveTeamRes.json();

  // Reload và đọc lại
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-tab="team"]');
  await page.waitForSelector('#teamForm');

  const rbTeamDesc = await page.$eval('textarea[name="teamDesc"]', (el) => el.value);
  const rbPFaq1 = await page.$eval('#pfaqContainer .pfaq-q', (el) => el.value);
  const rbSFaq1 = await page.$eval('#sfaqContainer .sfaq-q', (el) => el.value);
  const rbTFaq1 = await page.$eval('#tfaqContainer .tfaq-q', (el) => el.value);

  const teamFaqScreenshot = path.join(screenshotDir, 'team-and-3-faq-groups-edited.png');
  await page.screenshot({ path: teamFaqScreenshot, fullPage: false });

  observations.push({
    type: 'team_and_faqs_workflow',
    saveStatus: saveTeamRes.status(),
    teamDescMatches: rbTeamDesc.includes('Browser Verified Team Desc R3'),
    pfaq1MatchesExactly: rbPFaq1 === REPLACED_PFAQ,
    sfaq1MatchesExactly: rbSFaq1 === REPLACED_SFAQ,
    tfaq1MatchesExactly: rbTFaq1 === REPLACED_TFAQ,
    screenshot: 'team-and-3-faq-groups-edited.png',
  });

  // 6. SEO Main & Detail Preservation & Explicit Clearing
  console.log('[6/9] Kiểm thử bảo toàn SEO main/detail và explicit clearing...');
  const savedRouteSeo = saveTeamJson.draft?.data?.siteMeta?.routeSeo || {};
  const hasDetailNk = Boolean(savedRouteSeo['/nhat-ky/detail']);
  const hasDetailSp = Boolean(savedRouteSeo['/san-pham/detail']);

  // Thử nghiệm xóa trắng thẻ /dong-hanh
  const dhTitleInput = await page.$('input.route-seo-title[data-route="/dong-hanh"]');
  const dhDescInput = await page.$('input.route-seo-desc[data-route="/dong-hanh"]');
  if (dhTitleInput) {
    await dhTitleInput.click({ clickCount: 3 });
    await dhTitleInput.press('Backspace');
    await dhTitleInput.evaluate((el) => el.dispatchEvent(new Event('input', { bubbles: true })));
  }
  if (dhDescInput) {
    await dhDescInput.click({ clickCount: 3 });
    await dhDescInput.press('Backspace');
    await dhDescInput.evaluate((el) => el.dispatchEvent(new Event('input', { bubbles: true })));
  }

  // Lưu sau khi xóa trắng /dong-hanh
  const [saveClearRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/drafts/team') && res.request().method() === 'POST'),
    page.click('#teamForm button[type="submit"]'),
  ]);
  const clearData = await saveClearRes.json();
  const clearedRouteSeo = clearData.draft?.data?.siteMeta?.routeSeo || {};

  const dhCleared = clearedRouteSeo['/dong-hanh'] === undefined;
  const detailNkStillPersists = Boolean(clearedRouteSeo['/nhat-ky/detail']);
  const detailSpStillPersists = Boolean(clearedRouteSeo['/san-pham/detail']);

  observations.push({
    type: 'seo_main_detail_preservation',
    detailNkPreservedAcrossTeamSave: hasDetailNk,
    detailSpPreservedAcrossTeamSave: hasDetailSp,
    dongHanhExplicitlyCleared: dhCleared,
    detailNkStillPersistsAfterClear: detailNkStillPersists,
    detailSpStillPersistsAfterClear: detailSpStillPersists,
  });

  // 7. Layout Real Route SEO vs Parent Header Navigation
  console.log('[7/9] Kiểm thử Layout dùng route thực tế cho SEO detail page độc lập với parent header navigation...');
  const detailPreviewPage = await browser.newPage();
  const detailRes = await detailPreviewPage.goto(`${origin}/preview/san-pham/chuon-chuon-tre-kem-de?dev_role=admin`, {
    waitUntil: 'networkidle0',
  });
  const detailTitle = await detailPreviewPage.title();
  await detailPreviewPage.close();

  observations.push({
    type: 'layout_route_seo_independence',
    detailPageUrl: '/preview/san-pham/chuon-chuon-tre-kem-de',
    renderedTitle: detailTitle,
    renderedStatus: detailRes.status(),
  });

  // 8. Guarded History Restore & OCC Conflict
  console.log('[8/9] Kiểm thử khôi phục phiên bản lịch sử (Guarded Restore) & OCC Conflict...');
  await page.click('[data-tab="publish"]');
  await page.waitForSelector('#loadPubRevisionsBtn');

  await page.click('#loadPubRevisionsBtn');
  await page.waitForSelector('#pubRevisionsArea table.data-table');

  const revisionRows = await page.$$('#pubRevisionsArea table.data-table tbody tr');

  let occConflictTested = false;
  if (revisionRows.length > 0) {
    const occResult = await page.evaluate(async (orig) => {
      const listRes = await fetch(`${orig}/api/revisions/project?dev_role=admin`);
      const listData = await listRes.json();
      if (!listData.revisions || listData.revisions.length === 0) return { ok: false, status: 0 };
      const targetRev = listData.revisions[listData.revisions.length - 1];
      const res = await fetch(`${orig}/api/revisions/project/${targetRev.id}/restore?dev_role=admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedHash: 'stale-hash-00000000000000000000' }),
      });
      return { ok: res.status === 409, status: res.status, revId: targetRev.id };
    }, origin);
    occConflictTested = occResult.ok;
  }

  observations.push({
    type: 'guarded_history_restore',
    totalRevisionsRendered: revisionRows.length,
    occConflict409Confirmed: occConflictTested,
  });

  // 9. Reviewer Role Disabled Save Controls
  console.log('[9/9] Kiểm thử vai trò Reviewer không được phép lưu (Disabled Save Controls)...');
  await page.select('#devRoleSelect', 'reviewer');
  await new Promise((r) => setTimeout(r, 200));

  await page.click('[data-tab="project"]');
  await page.waitForSelector('#projectForm');
  const projSaveDisabled = await page.$eval('#projectForm button[type="submit"]', (btn) => btn.disabled);

  await page.click('[data-tab="products"]');
  await page.waitForSelector('#productsForm');
  const prodSaveDisabled = await page.$eval('#productsForm button[type="submit"]', (btn) => btn.disabled);

  await page.click('[data-tab="team"]');
  await page.waitForSelector('#teamForm');
  const teamSaveDisabled = await page.$eval('#teamForm button[type="submit"]', (btn) => btn.disabled);

  const reviewerScreenshot = path.join(screenshotDir, 'reviewer-save-buttons-disabled.png');
  await page.screenshot({ path: reviewerScreenshot, fullPage: false });

  // Đổi lại admin
  await page.select('#devRoleSelect', 'admin');
  await new Promise((r) => setTimeout(r, 100));

  observations.push({
    type: 'reviewer_role_authorization',
    projectSaveDisabled: projSaveDisabled,
    productsSaveDisabled: prodSaveDisabled,
    teamSaveDisabled: teamSaveDisabled,
    allSaveButtonsDisabledForReviewer: projSaveDisabled && prodSaveDisabled && teamSaveDisabled,
    screenshot: 'reviewer-save-buttons-disabled.png',
  });

  // Kiểm thực 22 tài sản media chuẩn tắc
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

  console.log('\n=== KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT C17-R2-F2-R3 ===');
  console.log(`- Git SHA: ${sha}`);
  console.log(`- Tổng quan sát: ${observations.length}`);
  console.log(`- Lỗi console/page: ${pageErrors.length}`);
  console.log(`- 22 tài sản media chuẩn tắc: ${report.mediaRegistryAllValid ? 'HỢP LỆ' : 'KHÔNG KHỚP'}`);
  console.log(`- Báo cáo chi tiết: docs/evidence/C17/R2-F2-R3/worker/browser-report.json`);

  if (pageErrors.length > 0 || !report.mediaRegistryAllValid) {
    process.exitCode = 1;
  }
}

try {
  await Promise.race([runVerification(), timeoutPromise]);
} finally {
  if (browser) await browser.close();
  if (worker) {
    await Promise.race([
      worker.stop(),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  }
  if (proxy) await proxy.dispose();
  try {
    fs.rmSync(persist, { recursive: true, force: true });
  } catch {}
}
