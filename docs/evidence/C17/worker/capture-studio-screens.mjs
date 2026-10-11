import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const req = createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer = req('puppeteer-core');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.resolve(process.cwd(), 'docs/evidence/C17/worker/screens');
fs.mkdirSync(outDir, { recursive: true });

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 1. Desktop 1440px - Dashboard
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4330/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'studio-dashboard-1440.png'), fullPage: true });
    console.log('[Captured] studio-dashboard-1440.png');

    // 2. Desktop 1440px - Project Form
    await page.click('[data-tab="project"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'studio-project-1440.png'), fullPage: true });
    console.log('[Captured] studio-project-1440.png');

    // 3. Desktop 1440px - Products Form
    await page.click('[data-tab="products"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'studio-products-1440.png'), fullPage: true });
    console.log('[Captured] studio-products-1440.png');

    // 4. Desktop 1440px - Finance & Reconciliation Form
    await page.click('[data-tab="finance"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'studio-finance-1440.png'), fullPage: true });
    console.log('[Captured] studio-finance-1440.png');

    // 5. Desktop 1440px - Publish Workflow Form
    await page.click('[data-tab="publish"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'studio-publish-1440.png'), fullPage: true });
    console.log('[Captured] studio-publish-1440.png');

    // 6. Tablet 768px
    await page.setViewport({ width: 768, height: 1024 });
    await page.evaluate(() => document.querySelector('[data-tab="dashboard"]').click());
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'studio-dashboard-768.png'), fullPage: true });
    console.log('[Captured] studio-dashboard-768.png');

    // 7. Mobile 375px - Mở drawer điều hướng
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.click('#toggleSidebarBtn');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outDir, 'studio-drawer-open-375.png') });
    console.log('[Captured] studio-drawer-open-375.png');

    // 8. Mobile 375px - Dashboard view sau khi đóng drawer
    await page.click('#toggleSidebarBtn');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outDir, 'studio-dashboard-375.png'), fullPage: true });
    console.log('[Captured] studio-dashboard-375.png');

    console.log('Tất cả ảnh chụp màn hình Studio đã hoàn tất!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Lỗi khi chụp màn hình Studio:', err);
  process.exit(1);
});
