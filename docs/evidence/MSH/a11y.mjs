// Kiểm tra phóng chữ 200%, tiêu điểm bàn phím, reduced-motion. Chỉ đọc trang.
import fs from 'node:fs/promises';
import { send, viewport, go, evaluate, pause, close } from './browser.mjs';
const R = [];
const pages = ['/', '/du-an/mang-theo-mot-net-ve', '/nhat-ky', '/san-pham', '/minh-bach', '/dong-hanh', '/ve-nhom'];
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
for (const [w, h] of [[320, 640], [375, 812]]) { await viewport(w, h);
  for (const p of pages) { await go(p); await pause(300);
    const zoom = await evaluate(`(()=>{document.documentElement.style.fontSize='200%';const d=document.documentElement;const h1=document.querySelector('h1').getBoundingClientRect();const g=document.querySelector('.page-hero-grid, .hero-section');const gr=g.getBoundingClientRect();return {overflow:Math.max(0,d.scrollWidth-d.clientWidth),h1Right:h1.right,vw:d.clientWidth,heroBottomGtH1:gr.bottom>=h1.bottom}})()`);
    await evaluate(`document.documentElement.style.fontSize=''`);
    let obscured = [];
    for (let i = 0; i < 14; i++) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await pause(120);
      const o = await evaluate(`(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const r=e.getBoundingClientRect();const bar=document.querySelector('.mobile-sticky-bar');const b=bar.getBoundingClientRect();const hid=bar.hasAttribute('inert');const hd=document.querySelector('.site-header').getBoundingClientRect();const inBar=bar.contains(e);const inHdr=e.closest('.site-header');return (!inBar&&!inHdr&&r.height&&!hid&&(r.bottom>b.top+1||r.top<hd.bottom-1))?(e.textContent||e.id).trim().slice(0,30)+' top='+Math.round(r.top)+' bottom='+Math.round(r.bottom):null})()`);
      if (o) obscured.push(o); }
    R.push({ w, p, zoom, obscured, reducedMotionAnimations: await evaluate(`document.getAnimations().filter(a=>a.playState==='running').length`) }); } }
await fs.writeFile('docs/evidence/MSH/after/a11y.json', JSON.stringify(R, null, 1));
console.log(R.filter((r) => r.zoom.overflow > 0 || r.obscured.length).map((r) => JSON.stringify(r)).join('\n') || 'zoom/focus: no overflow or obscured focus');
console.log('running anims max', Math.max(...R.map((r) => r.reducedMotionAnimations)));
close();
