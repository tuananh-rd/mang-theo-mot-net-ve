import { viewport, go, screenshot, pause, close } from './browser.mjs';
const out = process.env.MSH_OUT; const pages = (process.env.MSH_PAGES || 'project:/du-an/mang-theo-mot-net-ve,journal:/nhat-ky,products:/san-pham,finance:/minh-bach,support:/dong-hanh').split(',').map((s) => s.split(':'));
for (const sz of (process.env.MSH_SIZES || '375x812,768x1024,1024x768,1440x900,1920x1080').split(',')) { const [w, h] = sz.split('x').map(Number); await viewport(w, h);
  for (const [n, p] of pages) { await go(p); await pause(300); await screenshot(`${out}/${process.env.MSH_LABEL || 'x'}-${n}-${w}x${h}.png`); } }
close();
