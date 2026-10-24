// Kiểm chứng trực tiếp production sau phát hành P1 (Chrome headless CDP, DPR 1). KHÔNG gửi đơn: chỉ kiểm tra chặn phía trình duyệt và đếm POST.
// Chạy: node docs/evidence/P1-release/worker/verify-live.mjs
import fs from 'node:fs/promises';
import { send, viewport, go, evaluate, screenshot, pause, close } from './browser.mjs';
import { inspect } from './scan.mjs';

const out = 'docs/evidence/P1-release/worker/after';
const R = { measuredAt: new Date().toISOString(), base: 'https://mangtheomotnetve.website', pages: [], checks: {} };
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const routes = [['home', '/'], ['project', '/du-an/mang-theo-mot-net-ve'], ['products', '/san-pham'], ['keychain', '/san-pham/moc-khoa'], ['dragonfly', '/san-pham/chuon-chuon-tre-kem-de'], ['finance', '/minh-bach'], ['support', '/dong-hanh'], ['team', '/ve-nhom'], ['journal', '/nhat-ky']];
for (const [w, h] of [[375, 812], [768, 1024], [1440, 900]]) {
  await viewport(w, h);
  for (const [name, path] of routes) {
    await go(path); await pause(600);
    const row = await evaluate(`(${inspect.toString()})()`); row.name = name; row.viewport = `${w}x${h}`; R.pages.push(row);
    await screenshot(`${out}/${name}-${w}-viewport.png`);
    if (['home', 'products', 'keychain', 'project'].includes(name)) {
      await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60));}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));scrollTo({top:0,behavior:'instant'});return true})()`);
      await pause(200); await screenshot(`${out}/${name}-${w}-fullpage.png`, true);
    }
  }
  await go('/'); await pause(400);
  R.checks[`home-${w}`] = await evaluate(`(()=>{const q=s=>document.querySelector(s);const txt=document.body.innerText;return{planHeading:q('#plan-glance-heading')?.textContent,labels:[...document.querySelectorAll('.stat-label')].map(e=>e.textContent.trim()),notes:[...document.querySelectorAll('.stat-note')].map(e=>e.textContent.trim()),captionBox:!!q('.hero-caption')||txt.includes('do chủ dự án cung cấp — chưa phải sản phẩm thực tế của nhóm'),heroAlt:q('.hero-media img')?.alt,stageChips:[...document.querySelectorAll('.status-chip,.status-badge')].map(e=>e.textContent.trim()).filter(t=>/CHẶNG|Đang/.test(t)),footer:q('.site-footer')?.textContent.match(/CHẶNG[^()]*\\([^)]*\\)/)?.[0]||null,stale:/Đang triển khai · tuần|Chặng 01[^\\n]*Đang thực hiện/.test(txt),robotsMeta:!!q('meta[name=robots]'),goal:txt.includes('7.000.000'),qrNumber:null}})()`);
  await go('/du-an/mang-theo-mot-net-ve'); await pause(400);
  R.checks[`project-${w}`] = await evaluate(`({now:document.querySelector('.progress-now')?.textContent.replace(/\\s+/g,' ').trim(),updated:document.querySelector('.progress-updated')?.textContent.trim(),stale:/Đang triển khai · tuần/.test(document.body.innerText)})`);
  await go('/san-pham'); await pause(500);
  R.checks[`catalogue-${w}`] = await evaluate(`(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));return [...document.querySelectorAll('.catalogue-card img')].map(i=>{const r=i.getBoundingClientRect();return{src:i.src.split('/').pop(),fit:getComputedStyle(i).objectFit,natural:[i.naturalWidth,i.naturalHeight],render:[Math.round(r.width),Math.round(r.height)],complete:i.complete}})})()`);
  await evaluate(`document.querySelector('.catalogue-card:nth-child(2)')?.scrollIntoView({block:'center',behavior:'instant'})`); await pause(300); await screenshot(`${out}/catalogue-keychain-${w}-viewport.png`);
  await go('/san-pham/moc-khoa'); await pause(600);
  R.checks[`keychain-${w}`] = await evaluate(`(()=>{const i=document.querySelector('.product-figure-main img');const r=i.getBoundingClientRect();const box=i.parentElement.getBoundingClientRect();return{src:i.src.split('/').pop(),fit:getComputedStyle(i).objectFit,natural:[i.naturalWidth,i.naturalHeight],render:[Math.round(r.width),Math.round(r.height)],insideContainer:r.left>=box.left-1&&r.right<=box.right+1,alt:i.alt,caption:document.querySelector('.product-caption')?.textContent.trim(),placeholder:!!document.querySelector('.product-placeholder')}})()`);
  await evaluate(`document.querySelector('.product-figure-main')?.scrollIntoView({block:'center',behavior:'instant'})`); await pause(300); await screenshot(`${out}/keychain-figure-${w}-viewport.png`);
}
// Biểu mẫu: điện thoại bắt buộc ở phía khách; KHÔNG gửi đơn (đếm POST)
await viewport(375, 812); await go('/san-pham?sanpham=moc-khoa'); await pause(1500);
await evaluate(`window.__posts=0;const of=window.fetch;window.fetch=(...a)=>{if(a[1]&&String(a[1].method).toUpperCase()==='POST')window.__posts++;return of(...a)}`);
R.checks.form = await evaluate(`(()=>{const sel=document.querySelector('#preorderProduct');const p=document.querySelector('#preorderProductPreview');return{formVisible:!document.querySelector('#preorderForm').hidden,selected:sel?.value,options:sel?[...sel.options].map(o=>o.textContent):[],previewVisible:p&&!p.hidden,previewSrc:document.querySelector('#preorderProductImage')?.src.split('/').pop(),phoneLabel:document.querySelector('label[for=preorderPhone]')?.textContent,phoneRequired:document.querySelector('#preorderPhone')?.required,optionalText:/không bắt buộc/.test(document.querySelector('label[for=preorderPhone]')?.textContent||'')}})()`);
const fill = (n, v) => evaluate(`(()=>{const e=document.querySelector('#preorderForm').elements[${JSON.stringify(n)}];e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
await fill('name', 'Kiểm Tra Giao Diện'); await fill('email', 'ui-check@example.invalid');
await evaluate(`document.querySelector('#preorderForm').elements['consent'].checked=true`);
R.checks.formClient = {};
for (const [label, value] of [['rong', ''], ['khong-hop-le', '0984abc726']]) {
  await fill('phone', value); await evaluate(`document.querySelector('#preorderSubmit').click()`); await pause(200);
  R.checks.formClient[label] = await evaluate(`({message:document.querySelector('#preorderPhone').validationMessage,posts:window.__posts})`);
  await screenshot(`${out}/form-phone-${label}-375-viewport.png`);
}
// Điều hướng/menu cơ bản
await go('/'); await pause(500);
R.checks.menu = await evaluate(`(async()=>{const b=document.querySelector('[aria-controls]');const id=b.getAttribute('aria-controls');b.click();await new Promise(r=>setTimeout(r,250));const open=!document.getElementById(id).hidden;document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await new Promise(r=>setTimeout(r,250));return{open,closedByEscape:document.getElementById(id).hidden||b.getAttribute('aria-expanded')==='false'}})()`);
R.checks.links = [];
for (const [, path] of routes) { const r = await fetch('https://mangtheomotnetve.website' + path); R.checks.links.push({ path, status: r.status, xRobots: r.headers.get('x-robots-tag') }); }
await fs.writeFile('docs/evidence/P1-release/worker/live-verification.json', JSON.stringify(R, null, 2));
const bad = R.pages.map((p) => ({ n: p.name, vp: p.viewport, ovf: p.overflow, h1: p.h1Count, clip: p.clipped.length, lowC: p.contrast.filter((c) => c.ratio < 4.5).length, short: p.shortTargets.length }));
console.log('issues', JSON.stringify(bad.filter((b) => b.ovf || b.h1 !== 1 || b.clip || b.lowC)), 'pages', bad.length);
for (const k of ['home-375', 'project-375', 'catalogue-375', 'keychain-375', 'keychain-1440', 'form', 'formClient', 'menu']) console.log(k, JSON.stringify(R.checks[k]));
console.log('links', JSON.stringify(R.checks.links.filter((l) => l.status !== 200 || l.xRobots)));
close();
