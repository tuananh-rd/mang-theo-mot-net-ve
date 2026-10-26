// Cuộn từng khối hero/nút vào khung nhìn bằng scrollIntoView({block:'end'}) và Tab; kiểm tra không nằm dưới thanh cố định (320x640).
import fs from 'node:fs/promises';
import { viewport, go, evaluate, screenshot, pause, close } from './browser.mjs';
const out = process.env.MSH_OUT; await viewport(320, 640); const R = [];
for (const [n, p] of [['home', '/'], ['project', '/du-an/mang-theo-mot-net-ve'], ['journal', '/nhat-ky'], ['products', '/san-pham'], ['finance', '/minh-bach'], ['support', '/dong-hanh']]) {
  await go(p); await pause(300);
  const res = await evaluate(`(async()=>{const bar=document.querySelector('.mobile-sticky-bar');const out=[];
   const els=[...document.querySelectorAll('.page-hero-main > *, .hero-card > *, .page-hero a[href], .hero-section a[href], .page-hero-bottom a')];
   for(const e of els){e.scrollIntoView({block:'end',behavior:'instant'});await new Promise(r=>setTimeout(r,40));const r=e.getBoundingClientRect(),b=bar.getBoundingClientRect();if(r.height&&r.bottom>b.top+1&&!bar.hasAttribute('inert'))out.push((e.className||e.tagName)+' '+(e.textContent||'').trim().slice(0,24)+' bottom='+Math.round(r.bottom)+' bar='+Math.round(b.top))}
   // focus + scroll tới mọi liên kết/nút trong hero
   for(const e of document.querySelectorAll('main a[href], main button')){if(!e.closest('.page-hero, .hero-section'))continue;e.focus();await new Promise(r=>setTimeout(r,60));const r=e.getBoundingClientRect(),b=bar.getBoundingClientRect();if(r.bottom>b.top+1&&!bar.hasAttribute('inert'))out.push('FOCUS '+(e.textContent||'').trim().slice(0,24)+' bottom='+Math.round(r.bottom))}
   return out})()`);
  R.push({ page: n, obscured: res });
  await evaluate(`scrollTo({top:0,behavior:'instant'})`);
}
await fs.writeFile(`${out}/clearance-320x640.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); close();
