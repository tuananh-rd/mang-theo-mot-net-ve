import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer = require('puppeteer-core');

const outputDir = path.resolve('docs/evidence/C17/R2/worker/browser');
fs.mkdirSync(outputDir, { recursive: true });

const tabs = ['dashboard', 'project', 'journal', 'media', 'products', 'finance', 'team', 'publish'];
const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '375', width: 375, height: 812 },
];

const results = {
  sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  capturedAt: new Date().toISOString(),
  viewports: [],
};

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  page.on('dialog', dialog => dialog.accept());

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:4330/?dev_role=admin', { waitUntil: 'networkidle0', timeout: 30000 });

    const vpResults = { viewport: vp.name, width: vp.width, height: vp.height, tabs: [] };

    for (const tab of tabs) {
      // If mobile or tablet, ensure sidebar is visible or click tab button directly
      if (vp.width <= 768) {
        const sidebarOpen = await page.evaluate(() => document.getElementById('sidebar')?.classList.contains('open'));
        if (!sidebarOpen) {
          const toggleBtn = await page.$('#toggleSidebarBtn');
          if (toggleBtn && (await toggleBtn.isIntersectingViewport())) {
            await toggleBtn.click();
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }

      const tabBtn = await page.$(`[data-tab="${tab}"]`);
      if (tabBtn) {
        await tabBtn.click();
        await new Promise(r => setTimeout(r, 350));
      }

      // Close sidebar if on mobile/tablet so main content is visible for screenshot
      if (vp.width <= 768) {
        await page.evaluate(() => {
          document.getElementById('sidebar')?.classList.remove('open');
        });
        await new Promise(r => setTimeout(r, 150));
      }

      const metrics = await page.evaluate((t) => {
        return {
          tab: t,
          title: document.title,
          formControls: document.querySelectorAll('main input, main textarea, main select').length,
          buttons: document.querySelectorAll('main button').length,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      }, tab);

      const shotPath = path.join(outputDir, `${tab}-${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });

      vpResults.tabs.push({ ...metrics, screenshot: `${tab}-${vp.name}.png` });
    }

    results.viewports.push(vpResults);
  }

  fs.writeFileSync(path.join(outputDir, 'worker-browser-evidence.json'), JSON.stringify(results, null, 2));
  console.log('Worker browser evidence captured successfully!');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
