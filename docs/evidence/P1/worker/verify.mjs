// Kiểm chứng P1 trên bản xem trước 4383 (Chrome headless CDP, DPR 1). API biểu mẫu = fixture cục bộ 127.0.0.1:4331 (bộ nhớ, isTest, không email).
// Chạy: node docs/evidence/P1/worker/verify.mjs
import fs from 'node:fs/promises';
import { send, viewport, go, evaluate, screenshot, pause, close } from './browser.mjs';
import { inspect } from './scan.mjs';

const out = 'docs/evidence/P1/worker/after';
const R = { measuredAt: new Date().toISOString(), method: 'Chrome headless CDP, DPR 1, mobile emulation <=768, scrollbars hidden; preorder API = local in-memory fixture (isTest)', pages: [], checks: {} };
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const sizes = [[375, 812], [768, 1024], [1440, 900]];
const full = async (name, w) => {
  await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60));}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));scrollTo({top:0,behavior:'instant'});return true})()`);
  await pause(200); await screenshot(`${out}/${name}-${w}-fullpage.png`, true);
};
const element = async (name, w, selector) => {
  const box = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  if (!box) { R.checks[`${name}-${w}-missing`] = selector; return; }
  await pause(300); await screenshot(`${out}/${name}-${w}-viewport.png`);
};
const routes = [['home', '/'], ['project', '/du-an/mang-theo-mot-net-ve'], ['products', '/san-pham'], ['keychain', '/san-pham/moc-khoa'], ['dragonfly', '/san-pham/chuon-chuon-tre-kem-de']];
for (const [w, h] of sizes) {
  await viewport(w, h);
  for (const [name, path] of routes) {
    await go(path); await pause(500);
    const row = await evaluate(`(${inspect.toString()})()`); row.name = name; row.path = path; row.viewport = `${w}x${h}`;
    row.overflowPage = row.overflow;
    R.pages.push(row);
    await screenshot(`${out}/${name}-${w}-viewport.png`); await full(name, w);
  }
  // Home: các mục bị ảnh hưởng
  await go('/'); await pause(400);
  R.checks[`home-${w}`] = await evaluate(`(()=>{const q=s=>document.querySelector(s);const txt=document.body.innerText;const heroImg=q('.hero-media img');return{planHeading:q('#plan-glance-heading')?.textContent,planLabels:[...document.querySelectorAll('.stat-label')].map(e=>e.textContent.trim()),planNotes:[...document.querySelectorAll('.stat-note')].map(e=>e.textContent.trim()),heroCaptionBoxPresent:!!q('.hero-caption')||txt.includes('Ảnh minh họa chuồn chuồn gỗ họa tiết dân gian do chủ dự án cung cấp'),heroImgAlt:heroImg?.alt,statusChip:q('.facts dd .status-chip, .facts dd')?.textContent.trim(),footerStatus:q('.site-footer')?.textContent.match(/CHẶNG[^()]*\\([^)]*\\)/)?.[0]||null,staleStatus:/Đang triển khai · tuần|Chặng 01/.test(txt)}})()`);
  await element('home-plan', w, '#plan-glance-heading');
  // Dự án: tiến độ/timeline
  await go('/du-an/mang-theo-mot-net-ve'); await pause(400);
  R.checks[`project-${w}`] = await evaluate(`(()=>{const txt=document.body.innerText;const cur=document.querySelector('.progress-current-stage')?.textContent.replace(/\\s+/g,' ').trim();return{progressNow:document.querySelector('.progress-now')?.textContent.replace(/\\s+/g,' ').trim(),currentStage:cur,updated:document.querySelector('.progress-updated')?.textContent.trim(),stale:/Chặng 01[^\\n]*Đang thực hiện|Đang triển khai · tuần/.test(txt),chip:document.querySelector('.status-chip, .status-badge')?.textContent.trim()}})()`);
  await element('project-progress', w, '.progress');
  // Quà lưu niệm: thẻ móc khóa đầy đủ
  await go('/san-pham'); await pause(400);
  R.checks[`catalogue-${w}`] = await evaluate(`(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));const imgs=[...document.querySelectorAll('.catalogue-card img')].map(i=>{const r=i.getBoundingClientRect(),cs=getComputedStyle(i);const box=i.parentElement.getBoundingClientRect();const natural=i.naturalWidth/i.naturalHeight;const fitW=Math.min(r.width,r.height*natural);return{src:i.src.split('/').pop(),fit:cs.objectFit,naturalW:i.naturalWidth,naturalH:i.naturalHeight,renderW:Math.round(r.width),renderH:Math.round(r.height),inContainer:r.right<=box.right+1&&r.left>=box.left-1,aspectPreserved:Math.abs((r.width/r.height)-natural)<0.02||cs.objectFit==='contain'}});return{imgs,placeholders:document.querySelectorAll('.catalogue-placeholder').length}})()`);
  await evaluate(`document.querySelector('.catalogue-card:nth-child(2)')?.scrollIntoView({block:'center',behavior:'instant'})`); await pause(300); await screenshot(`${out}/catalogue-keychain-${w}-viewport.png`);
  // Chi tiết móc khóa
  await go('/san-pham/moc-khoa'); await pause(500);
  R.checks[`keychain-detail-${w}`] = await evaluate(`(()=>{const i=document.querySelector('.product-figure-main img');const r=i.getBoundingClientRect();const cs=getComputedStyle(i);return{src:i.src.split('/').pop(),objectFit:cs.objectFit,naturalW:i.naturalWidth,naturalH:i.naturalHeight,renderW:Math.round(r.width),renderH:Math.round(r.height),caption:document.querySelector('.product-caption')?.textContent.trim(),placeholderShown:!!document.querySelector('.product-placeholder'),alt:i.alt}})()`);
  await element('keychain-detail-figure', w, '.product-figure-main');
}
// Biểu mẫu: chọn móc khóa, ảnh xem trước từ nguồn chung, kiểm tra điện thoại
await viewport(375, 812); await go('/san-pham?sanpham=moc-khoa'); await pause(1200);
R.checks.formSelection = await evaluate(`(()=>{const sel=document.querySelector('#preorderProduct');const p=document.querySelector('#preorderProductPreview');const i=document.querySelector('#preorderProductImage');return{formVisible:!document.querySelector('#preorderForm').hidden,selected:sel.value,options:[...sel.options].map(o=>o.textContent),previewVisible:!p.hidden,previewSrc:i.src.split('/').pop(),previewFit:getComputedStyle(i).objectFit,previewCaption:document.querySelector('#preorderProductCaption').textContent,phoneLabel:document.querySelector('label[for=preorderPhone]').textContent,phoneRequired:document.querySelector('#preorderPhone').required,hasOptionalText:document.body.innerText.includes('không bắt buộc)')&&document.querySelector('label[for=preorderPhone]').textContent.includes('không bắt buộc')}})()`);
await evaluate(`document.querySelector('#preorderProductPreview').scrollIntoView({block:'center',behavior:'instant'})`); await pause(300); await screenshot(`${out}/form-keychain-selected-375-viewport.png`);
await evaluate(`document.querySelector('#preorderProduct').value='chuon-chuon-tre-kem-de';document.querySelector('#preorderProduct').dispatchEvent(new Event('change'))`); await pause(300);
R.checks.formSwitchDragonfly = await evaluate(`({previewSrc:document.querySelector('#preorderProductImage').src.split('/').pop(),fit:getComputedStyle(document.querySelector('#preorderProductImage')).objectFit})`);
await evaluate(`document.querySelector('#preorderProduct').value='moc-khoa';document.querySelector('#preorderProduct').dispatchEvent(new Event('change'))`);
// Kiểm tra điện thoại phía máy khách: submit trống/không hợp lệ KHÔNG gửi request
await evaluate(`window.__posts=0;const of=window.fetch;window.fetch=(...a)=>{if(a[1]&&a[1].method==='POST')window.__posts++;return of(...a)}`);
const fill = (name, value) => evaluate(`(()=>{const f=document.querySelector('#preorderForm');const e=f.elements[${JSON.stringify(name)}];e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
await fill('name', 'Nguyễn Thử Nghiệm'); await fill('email', 'thu@example.invalid');
await evaluate(`document.querySelector('#preorderForm').elements['consent'].checked=true`);
const clickSubmit = () => evaluate(`document.querySelector('#preorderSubmit').click()`);
const phoneState = () => evaluate(`(()=>{const p=document.querySelector('#preorderPhone');return{message:p.validationMessage,valid:p.validity.valid,posts:window.__posts,errorBox:document.querySelector('#preorderError').textContent}})()`);
R.checks.phoneClient = {};
for (const [label, value] of [['rong', ''], ['khoang-trang', '   '], ['chi-phan-cach', ' - . '], ['co-chu', '0984abc726'], ['qua-ngan', '09844']]) {
  await fill('phone', value); await clickSubmit(); await pause(150);
  R.checks.phoneClient[label] = await phoneState();
  if (label === 'rong') await screenshot(`${out}/form-phone-empty-375-viewport.png`);
  if (label === 'co-chu') await screenshot(`${out}/form-phone-invalid-375-viewport.png`);
}
// Hợp lệ → gửi tới fixture cục bộ; sau đó thử lại cùng khóa idempotency không áp dụng ở UI (form đóng) nên chỉ kiểm thành công
await fill('phone', '0984 441 726'); await clickSubmit(); await pause(1200);
R.checks.phoneClient.valid = { ...(await phoneState()), success: await evaluate(`document.querySelector('#preorderSuccess').textContent`), formHidden: await evaluate(`document.querySelector('#preorderForm').hidden`) };
await screenshot(`${out}/form-success-375-viewport.png`);
// Phía máy chủ (fixture): POST trực tiếp không phone / null / sai → 400 tiếng Việt; hợp lệ → 201
const direct = async (body, key) => { const r = await fetch('http://127.0.0.1:4331/api/preorders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key, Origin: 'http://127.0.0.1:4383' }, body: JSON.stringify({ productId: 'moc-khoa', quantity: 1, name: 'Máy Chủ', email: 'mc@example.invalid', pickup: 'Nhóm xác nhận cách nhận hàng khi liên hệ', consent: true, ...body }) }); return { status: r.status, body: await r.json() }; };
R.checks.phoneServer = { missing: await direct({}, 'p1-a'), nullPhone: await direct({ phone: null }, 'p1-b'), legacyContactOnly: await direct({ contactType: 'phone', contact: '0912345678' }, 'p1-c'), invalid: await direct({ phone: 'abc' }, 'p1-d'), valid: await direct({ phone: '+84 984 441 726' }, 'p1-e') };
await fs.writeFile('docs/evidence/P1/worker/verification.json', JSON.stringify(R, null, 2));
const bad = R.pages.map((p) => ({ n: p.name, vp: p.viewport, ovf: p.overflowPage, h1: p.h1Count, clip: p.clipped.length, short: p.shortTargets.length, lowC: p.contrast.filter((c) => c.ratio < 4.5).length }));
console.log(JSON.stringify(bad.filter((b) => b.ovf || b.h1 !== 1 || b.clip || b.lowC)), 'pages', bad.length);
console.log(JSON.stringify(R.checks.home - 0 || R.checks['home-375']));
console.log(JSON.stringify(R.checks['project-375']));
console.log(JSON.stringify(R.checks['catalogue-375']));
console.log(JSON.stringify(R.checks['keychain-detail-375']));
console.log(JSON.stringify(R.checks.formSelection));
console.log(JSON.stringify(R.checks.phoneClient));
console.log(JSON.stringify(R.checks.phoneServer).slice(0, 900));
close();
