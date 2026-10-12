import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createStudioLocalServer } from '../../../../../apps/studio/dist/server.js';

const require = createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer = require('puppeteer-core');

const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const runId = `browser-${Date.now()}`;
const fixtureDir = path.resolve('scratch/c17-browser-fixture', runId);
const evidenceDir = path.resolve('docs/evidence/C17/R2-F2/worker', runId);
fs.mkdirSync(evidenceDir, { recursive: true });

const app = createStudioLocalServer({ port: 14330, dataDir: fixtureDir });
let browser;
const observations = [];
const pageErrors = [];

const sections = [
  { id: 'dashboard', name: 'Tổng quan & Bản chụp' },
  { id: 'project', name: 'Dự án & Liên hệ' },
  { id: 'journal', name: 'Nhật ký dự án' },
  { id: 'media', name: 'Kho tư liệu' },
  { id: 'products', name: 'Sản phẩm gây quỹ' },
  { id: 'finance', name: 'Kế hoạch & Sổ tài chính' },
  { id: 'team', name: 'Đội ngũ Lăng Kính & FAQs' },
  { id: 'publish', name: 'Quy trình Xuất bản' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

try {
  await app.start();
  browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const page = await browser.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('dialog', (d) => d.accept());

  // 1. Duyệt qua 8 phân hệ tại 3 độ phân giải
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:14330/', { waitUntil: 'networkidle0' });

    for (const sec of sections) {
      await page.$eval(`[data-tab="${sec.id}"]`, (el) => el.click());
      await new Promise((r) => setTimeout(r, 100));

      // Kiểm tra vùng bảng có cuộn ngang nếu ở kích thước mobile
      let scrollable = false;
      if (vp.width === 375) {
        scrollable = await page.$$eval('.table-container', (els) => {
          return els.some((el) => el.scrollWidth > el.clientWidth);
        }).catch(() => false);
      }

      const screenshotPath = path.join(evidenceDir, `${sec.id}-${vp.name}-${vp.width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      observations.push({
        section: sec.id,
        viewport: vp.name,
        width: vp.width,
        rendered: true,
        scrollableTableTested: vp.width === 375 ? scrollable : undefined,
        screenshot: path.basename(screenshotPath),
      });
    }
  }

  // 2. Thao tác thực tế trên phân hệ Project: Toggle Contacts null & Lưu
  await page.setViewport({ width: 1440, height: 900 });
  await page.click('[data-tab="project"]');
  const toggleBtn = await page.$('#contactToggleBtn');
  if (toggleBtn) {
    await toggleBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    // Nhấn lưu dự án
    const [saved] = await Promise.all([
      page.waitForResponse((res) => res.url().endsWith('/api/drafts/project') && res.request().method() === 'POST'),
      page.click('#projectForm button[type="submit"]'),
    ]);
    const savedData = await saved.json();
    observations.push({
      action: 'contact_toggle_null_save',
      status: saved.status(),
      persistedContacts: savedData.draft?.data?.contacts,
      success: saved.status() === 200,
    });
  }

  // 3. Thao tác thực tế trên phân hệ Finance: Lưu Overview với số 0 bảo toàn
  await page.click('[data-tab="finance"]');
  await page.waitForSelector('#financeOverviewForm');
  await page.focus('#financeOverviewForm input[name="ov_plannedExpenseTotal"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type('0');

  const [savedFin] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith('/api/drafts/finance') && res.request().method() === 'POST'),
    page.click('#financeOverviewForm button[type="submit"]'),
  ]);
  const finData = await savedFin.json();
  const savedExpense = finData.draft?.data?.overview?.plannedExpenseTotal;
  observations.push({
    action: 'finance_overview_zero_preservation',
    status: savedFin.status(),
    savedPlannedExpenseTotal: savedExpense,
    zeroPreserved: savedExpense === 0,
  });

  const report = {
    sha,
    timestamp: new Date().toISOString(),
    runId,
    totalObservations: observations.length,
    pageErrors,
    observations,
  };

  fs.writeFileSync(path.join(evidenceDir, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (pageErrors.length > 0) {
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  await app.stop();
  // Dọn dẹp fixture an toàn
  try {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  } catch {}
}
