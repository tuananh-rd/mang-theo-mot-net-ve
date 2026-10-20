import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

const chrome = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const profile = `${process.env.TEMP}/mtmnv-c20-edge-profile`;
const site = 'http://127.0.0.1:4321/san-pham';
const studio = 'http://127.0.0.1:4331/';
const configured = await fetch('http://127.0.0.1:4331/api/preorder-products/chuon-chuon-tre-kem-de', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-dev-user': 'admin' },
  body: JSON.stringify({ isOpen: true, officialPrice: null, pickup: 'Nhận tại FPT Hòa Lạc' }),
});
assert.equal(configured.status, 200, 'Local test product config must open before browser E2E');
const edge = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=9222', 'about:blank'], { stdio: 'ignore', windowsHide: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, label) {
  for (let i = 0; i < 80; i++) {
    const value = await fn();
    if (value) return value;
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
}
async function getTarget() {
  return waitFor(async () => {
    try {
      const response = await fetch('http://127.0.0.1:9222/json/list');
      const targets = await response.json();
      return targets.find((target) => target.type === 'page');
    } catch { return null; }
  }, 'Edge DevTools target');
}

const target = await getTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let commandId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    data.error ? reject(new Error(data.error.message)) : resolve(data.result);
  }
});
function cdp(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result.value;
}
async function navigate(url) {
  await cdp('Page.navigate', { url });
  await waitFor(async () => (await evaluate('document.readyState')).includes('complete'), `page load ${url}`);
}
async function screenshot(name) {
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await fs.writeFile(new URL(`./${name}`, import.meta.url), Buffer.from(result.data, 'base64'));
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  const report = { mode: 'local emulator; synthetic isTest order only', checks: [] };

  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(site);
  await waitFor(async () => await evaluate("document.querySelector('#preorderForm')?.hidden === false"), 'desktop preorder form');
  report.checks.push({ step: 'desktop public form visible', viewport: '1440x1000', passed: true });
  await evaluate("document.querySelector('#preorderForm').scrollIntoView({block:'start'})");
  await delay(300);
  await screenshot('desktop-preorder-form.png');

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp('Page.reload', { ignoreCache: true });
  await waitFor(async () => await evaluate("document.querySelector('#preorderForm')?.hidden === false"), 'mobile preorder form');
  await evaluate("document.querySelector('#preorderForm').scrollIntoView({block:'start'})");
  await delay(300);
  const mobileLayout = await evaluate('({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, formVisible: !document.querySelector("#preorderForm").hidden})');
  assert.ok(mobileLayout.scrollWidth <= mobileLayout.width, `Mobile horizontal overflow: ${JSON.stringify(mobileLayout)}`);
  report.checks.push({ step: 'mobile public form visible with no horizontal overflow', viewport: '390x844', passed: true, ...mobileLayout });
  await screenshot('mobile-preorder-form.png');

  const submission = await evaluate(`(async () => {
    const form = document.querySelector('#preorderForm');
    form.querySelector('[name="productId"]').value = 'chuon-chuon-tre-kem-de';
    form.querySelector('[name="quantity"]').value = '2';
    form.querySelector('[name="name"]').value = 'E2E Sample';
    form.querySelector('[name="contactType"]').value = 'email';
    form.querySelector('[name="contactType"]').dispatchEvent(new Event('change', {bubbles:true}));
    form.querySelector('[name="contact"]').value = 'e2e@example.invalid';
    form.querySelector('[name="pickup"]').selectedIndex = 0;
    form.querySelector('[name="consent"]').checked = true;
    form.requestSubmit();
    for (let i=0; i<80; i++) { await new Promise(r=>setTimeout(r,250)); if (!document.querySelector('#preorderSuccess').hidden) return {success:true,text:document.querySelector('#preorderSuccess').textContent}; if (document.querySelector('#preorderError').textContent) return {success:false,error:document.querySelector('#preorderError').textContent}; }
    return {success:false,error:'timed out', availability:document.querySelector('#preorderAvailability').textContent, valid:form.checkValidity(), pickupOptions:[...form.querySelector('[name="pickup"]').options].map(o=>({value:o.value,text:o.text})), invalid:[...form.elements].filter(e=>e.willValidate && !e.checkValidity()).map(e=>({name:e.name,value:e.value,validationMessage:e.validationMessage}))};
  })()`);
  assert.equal(submission.success, true, JSON.stringify(submission));
  assert.match(submission.text, /MTMNV-[A-F0-9]{8}/);
  assert.match(submission.text, /chưa thanh toán/);
  report.checks.push({ step: 'public form creates a non-payment test preorder', passed: true });
  report.orderCode = submission.text.match(/MTMNV-[A-F0-9]{8}/)?.[0];

  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(studio);
  await waitFor(async () => await evaluate("!!document.querySelector('[data-tab=preorders]')"), 'Studio navigation');
  await evaluate("document.querySelector('[data-tab=preorders]').click()");
  await waitFor(async () => (await evaluate("document.querySelector('#preorderList')?.textContent || ''")).includes(report.orderCode), 'order visible in Studio');
  report.checks.push({ step: 'Admin Studio lists the test order', passed: true });
  await evaluate(`document.querySelector('.preorder-open-detail')?.click()`);
  await waitFor(async () => (await evaluate("document.querySelector('#preorderDetail')?.textContent || ''")).includes('E2E Sample'), 'order detail');
  await evaluate(`(async () => {
    const form=document.querySelector('#preorderStatusForm');
    form.querySelector('[name="status"]').value='contacted';
    form.requestSubmit();
  })()`);
  await waitFor(async () => (await evaluate("document.querySelector('#preorderDetail')?.textContent || ''")).includes('status_changed'), 'status history');
  report.checks.push({ step: 'Reviewer workflow changes status and records history', passed: true });
  const csv = await evaluate("fetch('/api/preorders/export.csv?test=true').then(async r => ({status:r.status, type:r.headers.get('content-type'), bytes:Array.from(new Uint8Array(await r.arrayBuffer()).slice(0,3))}))");
  assert.equal(csv.status, 200);
  assert.deepEqual(csv.bytes, [239, 187, 191]);
  report.checks.push({ step: 'Studio CSV export is authorized and UTF-8 BOM encoded', passed: true });
  await evaluate(`window.confirm=()=>true; document.querySelector('#archivePreorderTest')?.click()`);
  await waitFor(async () => !(await evaluate("document.querySelector('#preorderList')?.textContent || ''")).includes(report.orderCode), 'test order archived from Studio list');
  report.checks.push({ step: 'Admin archives only the isTest order through the confirmation control', passed: true });
  await fs.writeFile(new URL('./e2e-results.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  socket.close();
  edge.kill();
}
