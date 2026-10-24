import fs from 'node:fs/promises';
import { viewport, go, evaluate, pause, screenshot, close } from './browser.mjs';
const out = 'docs/evidence/P1/worker/after';
const R = {};
for (const [w, h] of [[375, 812], [1440, 900]]) {
  await viewport(w, h); await go('/san-pham?sanpham=moc-khoa'); await pause(1200);
  const fill = (n, v) => evaluate(`(()=>{const e=document.querySelector('#preorderForm').elements[${JSON.stringify(n)}];e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await fill('name', 'Nguyễn Thử Nghiệm'); await fill('email', 'thu@example.invalid'); await fill('phone', '+84 984 441 726');
  await evaluate(`document.querySelector('#preorderForm').elements['consent'].checked=true;document.querySelector('#preorderSubmit').click()`);
  await pause(1500);
  R['w' + w] = await evaluate(`(()=>{const f=document.querySelector('#preorderForm');const s=document.querySelector('#preorderSuccess');const r=s.getBoundingClientRect();return{formHidden:f.hidden,formDisplay:getComputedStyle(f).display,formHeight:f.getBoundingClientRect().height,visibleFields:[...f.elements].filter(e=>e.getBoundingClientRect().height>0).length,successDisplay:getComputedStyle(s).display,successText:s.textContent.slice(0,80),successInViewport:r.top>=0&&r.bottom<=innerHeight,focused:document.activeElement===s}})()`);
  await screenshot(`${out}/form-success-${w}-viewport.png`);
}
// Form ẩn khi API chưa sẵn sàng: mô phỏng bằng cách đặt hidden lại
await fs.writeFile('docs/evidence/P1/worker/success-check.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify(R)); close();
