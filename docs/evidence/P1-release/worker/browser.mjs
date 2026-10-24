import fs from 'node:fs/promises';
export const base = 'https://mangtheomotnetve.website';
const targets = await (await fetch('http://127.0.0.1:9384/json')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const events = new Map();
export function onEvent(method, handler) { events.set(method, handler); }
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.method && events.has(m.method)) events.get(m.method)(m.params);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject, timer } = pending.get(m.id);
    clearTimeout(timer); pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
export function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timeout: ${method}`)); }, 30000);
    pending.set(key, { resolve, reject, timer }); ws.send(JSON.stringify({ id: key, method, params }));
  });
}
export const pause = ms => new Promise(r => setTimeout(r, ms));
export async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
export async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 768 });
  await send('Emulation.setScrollbarsHidden', { hidden: true });
}
export async function go(path = '/') {
  await send('Page.navigate', { url: `${base}${path}` });
  await send('Page.bringToFront');
  for (let n = 0; n < 100; n++) {
    await pause(80);
    if (await evaluate(`document.readyState === 'complete' && location.href.startsWith('${base}')`)) break;
  }
  await evaluate('document.fonts.ready.then(() => true)');
  await pause(250);
}
export async function screenshot(path, full = false) {
  const metrics = await send('Page.getLayoutMetrics');
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(full ? { clip: { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 } } : {}) });
  await fs.writeFile(path, Buffer.from(shot.data, 'base64'));
}
export function close() { ws.close(); }
await send('Page.enable');
await send('Runtime.enable');
