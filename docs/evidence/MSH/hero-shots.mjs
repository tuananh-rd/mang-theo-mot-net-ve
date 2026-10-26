import { viewport, go, screenshot, pause, evaluate, close } from './browser.mjs';
const out = process.env.MSH_OUT; const label = process.env.MSH_LABEL || 'x';
const pages = (process.env.MSH_PAGES || '/du-an/mang-theo-mot-net-ve,/nhat-ky,/san-pham,/minh-bach,/dong-hanh').split(',');
for (const w of (process.env.MSH_W || '375').split(',').map(Number)) { await viewport(w, 900);
  for (const p of pages) { await go(p); await pause(300); await screenshot(`${out}/${label}-${p.replace(/\W+/g, '_')}-${w}.png`); } }
close();
