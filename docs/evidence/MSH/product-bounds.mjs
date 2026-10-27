// Đo vùng ảnh nguồn 730px của /san-pham và vị trí nút/chữ so với ảnh ở nhiều cỡ; thử focus nút.
import fs from 'node:fs/promises';
import { viewport, go, evaluate, pause, close } from './browser.mjs';
const R = [];
for (const [w, h] of [[320, 640], [375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) { await viewport(w, h); await go('/san-pham'); await pause(300);
  const r = await evaluate(`(()=>{const f=document.querySelector('.page-hero-image').getBoundingClientRect();const img=document.querySelector('.page-hero-image img');const btn=document.querySelector('.page-hero .btn');const b=btn.getBoundingClientRect();const m=document.querySelector('.page-hero-main').getBoundingClientRect();btn.focus();const fb=btn.getBoundingClientRect();const bar=document.querySelector('.mobile-sticky-bar');const bt=bar&&getComputedStyle(bar).display!=='none'?bar.getBoundingClientRect().top:9999;const d=document.documentElement;
   return {photoW:Math.round(f.width),photoH:Math.round(f.height),naturalW:img.naturalWidth,renderedOverNatural:+(f.width/img.naturalWidth).toFixed(2),photoBottom:Math.round(f.bottom+scrollY),btnTop:Math.round(b.top+scrollY),btnBottom:Math.round(b.bottom+scrollY),panelBottom:Math.round(m.bottom+scrollY),btnInsidePhoto:b.bottom<=f.bottom+0.5&&b.top>=f.top,btnClippedX:b.left<0||b.right>d.clientWidth,overflow:Math.max(0,d.scrollWidth-d.clientWidth),focusedOk:document.activeElement===btn,focusUnderBar:fb.bottom>bt}})()`);
  R.push({ vp: `${w}x${h}`, ...r }); }
await fs.writeFile('docs/evidence/MSH/after-v2/product-bounds.json', JSON.stringify(R, null, 1));
for (const r of R) console.log(JSON.stringify(r)); close();
