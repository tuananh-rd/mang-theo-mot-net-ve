#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const dimensions = [
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '768x1024', width: 768, height: 1024, mobile: true },
  { name: '375x812', width: 375, height: 812, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
];
const routes = [
  { name: 'project', path: '/du-an/mang-theo-mot-net-ve' },
  { name: 'products', path: '/san-pham' },
  { name: 'journal', path: '/nhat-ky' },
  { name: 'transparency', path: '/minh-bach' },
  { name: 'support', path: '/dong-hanh' },
  { name: 'team', path: '/ve-nhom' },
  { name: 'product-detail', path: '/san-pham/chuon-chuon-tre-kem-de' },
];

const targets = await fetch('http://127.0.0.1:9222/json').then((res) => res.json());
const target = targets.find((item) => item.type === 'page' && item.url.startsWith('http://127.0.0.1:4321'));
if (!target) throw new Error('No headless Edge page found on debugging port 9222.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
const callbacks = new Map();
let nextId = 0;
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && callbacks.has(message.id)) {
    const { resolve, reject } = callbacks.get(message.id);
    callbacks.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

async function cdp(method, params = {}) {
  const id = ++nextId;
  const result = new Promise((resolve, reject) => callbacks.set(id, { resolve, reject }));
  ws.send(JSON.stringify({ id, method, params }));
  return result;
}

await cdp('Page.enable');
await cdp('Runtime.enable');
const observations = [];
for (const route of routes) {
  for (const viewport of dimensions) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    await cdp('Page.navigate', { url: `http://127.0.0.1:4321${route.path}` });
    await delay(800);
    await cdp('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await delay(80);
    await cdp('Runtime.evaluate', {
      expression: 'document.fonts?.ready || Promise.resolve()',
      awaitPromise: true,
      returnByValue: true,
    });
    await cdp('Runtime.evaluate', {
      expression: 'Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))',
      awaitPromise: true,
      returnByValue: true,
    });
    const metrics = await cdp('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.querySelector('.page-hero');
        const image = hero?.querySelector('.page-hero-image img');
        const title = hero?.querySelector('h1');
        const lead = hero?.querySelector('.page-hero-lead');
        const main = hero?.querySelector('.page-hero-main');
        const cta = main?.querySelector('a,button');
        const rect = (element) => element ? element.getBoundingClientRect().toJSON() : null;
        return {
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          scrollY,
          scrollWidth: document.documentElement.scrollWidth,
          hero: rect(hero),
          image: image ? { ...rect(image), alt: image.alt, complete: image.complete, naturalWidth: image.naturalWidth } : null,
          imageFrame: rect(hero?.querySelector('.page-hero-image')),
          main: rect(main),
          title: rect(title),
          lead: rect(lead),
          titleInViewport: title ? rect(title).top >= 0 && rect(title).bottom <= innerHeight : null,
          leadInViewport: lead ? rect(lead).top >= 0 && rect(lead).bottom <= innerHeight : null,
          imageToTitleGap: image ? Math.round(rect(title).top - rect(image).bottom) : null,
          imageToMainGap: image ? Math.round(rect(main).top - rect(hero?.querySelector('.page-hero-image')).bottom) : null,
          imageVisible: image ? getComputedStyle(hero.querySelector('.page-hero-image')).display !== 'none' : false,
          cta: rect(cta),
          ctaInViewport: cta ? rect(cta).bottom <= innerHeight : null,
          menu: Boolean(document.querySelector('button[aria-label*="menu" i], button[aria-label*="điều hướng" i], .nav-toggle')),
          form: Boolean(document.querySelector('form')),
          preorderFormHidden: document.querySelector('#preorderForm')?.hidden ?? null,
          preorderStatus: document.querySelector('#preorderAvailability')?.innerText || null,
          localLinks: [...document.querySelectorAll('a[href^="/"]')].length,
          localHrefs: [...new Set([...document.querySelectorAll('a[href^="/"]')].map((link) => link.getAttribute('href')).filter((href) => href && !href.startsWith('//')))],
          heading: title?.innerText || null,
        };
      })()` ,
      returnByValue: true,
    });
    const observation = { route: route.path, routeName: route.name, viewport: viewport.name, ...metrics.result.value };
    observations.push(observation);
    const stem = `${route.name}-${viewport.name}`;
    const viewportShot = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 72, fromSurface: true });
    await fs.writeFile(path.join(evidenceDir, `${stem}-hero.jpg`), Buffer.from(viewportShot.data, 'base64'));
    const layout = await cdp('Page.getLayoutMetrics');
    const content = layout.cssContentSize;
    const fullShot = await cdp('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 72,
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.min(content.width, viewport.width), height: content.height, scale: 1 },
    });
    await fs.writeFile(path.join(evidenceDir, `${stem}-full.jpg`), Buffer.from(fullShot.data, 'base64'));
    if (route.name === 'project' && viewport.mobile) {
      const menu = await cdp('Runtime.evaluate', {
        expression: `(() => {
          const button = document.querySelector('button[aria-label="Mở menu điều hướng"]');
          button?.click();
          const opened = button?.getAttribute('aria-expanded') === 'true';
          const links = document.querySelectorAll('.nav-menu a, .mobile-nav a, nav a').length;
          button?.click();
          return { viewport: '${viewport.name}', button: Boolean(button), opened, linkCount: links, closed: button?.getAttribute('aria-expanded') === 'false' };
        })()`,
        returnByValue: true,
      });
      observation.menuInteraction = menu.result.value;
    }
  }
}
const hrefs = [...new Set(observations.flatMap((item) => item.localHrefs || []))].filter((href) => !href.startsWith('/api/'));
const linkChecks = await Promise.all(hrefs.map(async (href) => {
  const response = await fetch(new URL(href, 'http://127.0.0.1:4321'), { method: 'HEAD' });
  return { href, status: response.status, ok: response.ok };
}));
await fs.writeFile(path.join(evidenceDir, 'measurements.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), baseUrl: 'http://127.0.0.1:4321', observations, linkChecks }, null, 2)}\n`);
ws.close();
console.log(JSON.stringify({ pages: routes.length, viewports: dimensions.length, screenshots: observations.length * 2, overflow: observations.filter((item) => item.scrollWidth > item.viewportWidth).length, internalLinks: linkChecks.length, brokenLinks: linkChecks.filter((item) => !item.ok).length }, null, 2));
