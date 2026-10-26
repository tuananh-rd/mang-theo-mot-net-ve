// Đo nút/liên kết trong lần xem đầu (scrollY=0) bị thanh cố định che ở 320x640 (chỉ đọc).
import { viewport, go, evaluate, screenshot, pause, close } from './browser.mjs';
const out = process.env.MSH_OUT; const [w, h] = (process.env.MSH_VP || '320x640').split('x').map(Number);
await viewport(w, h);
for (const [n, p] of [['home', '/'], ['project', '/du-an/mang-theo-mot-net-ve'], ['journal', '/nhat-ky'], ['products', '/san-pham'], ['finance', '/minh-bach'], ['support', '/dong-hanh'], ['team', '/ve-nhom']]) {
  await go(p); await pause(300);
  console.log(n, await evaluate(`(()=>{const b=document.querySelector('.mobile-sticky-bar').getBoundingClientRect();const hd=document.querySelector('.site-header').getBoundingClientRect();return JSON.stringify([...document.querySelectorAll('main a[href],main button')].map(e=>({t:(e.textContent||'').trim().slice(0,24),r:e.getBoundingClientRect()})).filter(x=>x.r.height&&x.r.bottom>b.top&&x.r.top<b.top+0&&x.r.top>hd.bottom).map(x=>x.t+' '+Math.round(x.r.top)+'-'+Math.round(x.r.bottom)+' bar@'+Math.round(b.top)))})()`));
  if (out) await screenshot(`${out}/after-${n}-${w}x${h}-fold.png`);
}
close();
