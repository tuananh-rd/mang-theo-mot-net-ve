// L1: kiểm chứng giao diện sổ ủng hộ một phần (preview loopback hoặc production) bằng Chrome headless CDP (DPR 1).
// Chạy: L1_BASE=http://127.0.0.1:4392 L1_OUT=docs/evidence/L1/worker/after node docs/evidence/L1/worker/verify.mjs
// KHÔNG gửi đơn hay form. Chỉ đọc trang và chụp ảnh.
import fs from 'node:fs/promises';
import { send, viewport, go, evaluate, screenshot, pause, close, base } from './browser.mjs';
import { inspect } from './scan.mjs';

const out = process.env.L1_OUT || 'docs/evidence/L1/worker/after';
const label = process.env.L1_LABEL || 'preview';
await fs.mkdir(out, { recursive: true });
const R = { measuredAt: new Date().toISOString(), base, pages: [], checks: {} };
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const routes = [['home', '/'], ['project', '/du-an/mang-theo-mot-net-ve'], ['products', '/san-pham'], ['keychain', '/san-pham/moc-khoa'], ['finance', '/minh-bach'], ['support', '/dong-hanh'], ['team', '/ve-nhom'], ['journal', '/nhat-ky']];
for (const [w, h] of [[375, 812], [768, 1024], [1440, 900]]) {
  await viewport(w, h);
  for (const [name, path] of routes) {
    await go(path); await pause(500);
    const row = await evaluate(`(${inspect.toString()})()`); row.name = name; row.viewport = `${w}x${h}`;
    delete row.images; delete row.fonts; delete row.links; R.pages.push(row);
    if (['home', 'finance', 'support'].includes(name)) {
      await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,50));}scrollTo({top:0,behavior:'instant'});return true})()`);
      await pause(200); await screenshot(`${out}/${label}-${name}-${w}-fullpage.png`, true);
    }
  }
  // Số liệu sổ ủng hộ trên ba trang phải khớp nhau; không có từ ngữ gây hiểu nhầm đối soát đầy đủ
  const grab = `(()=>{const t=document.body.innerText;const money=t.match(/\\d{1,3}(?:\\.\\d{3})+\\s?đ/g)||[];return{has492:t.includes('492.222'),moneyTokens:[...new Set(money)],partialWord:/xác minh một phần/.test(t),fullClaims:/Đã ủng hộ \\(sổ đã đối soát\\)|Thực tế \\(đã đối soát\\)|Xem sao kê từng khoản đã đối soát/.test(t),balanceOrExpense:/số dư|tổng chi|chi tiêu/i.test(t.replace(/không nêu số dư[^.]*\\./gi,'')),rows:document.querySelectorAll('.donor-table tbody tr').length,searchBox:!!document.getElementById('donor-search'),qr:!!document.querySelector('img[src*="qr-ung-ho"]'),account:t.includes('19077352683012')&&t.includes('NGUYEN CHI TRUNG')&&t.includes('Techcombank'),goal:t.includes('7.000.000'),robotsMeta:!!document.querySelector('meta[name=robots]')}})()`;
  for (const [name, path] of [['home', '/'], ['finance', '/minh-bach'], ['support', '/dong-hanh']]) {
    await go(path); await pause(400);
    R.checks[`${name}-${w}`] = await evaluate(grab);
  }
}
const bad = R.pages.filter((p) => p.overflow > 0 || p.h1Count !== 1 || p.clipped.length > 0 || p.contrast.some((c) => c.ratio < 4.5));
R.summary = { pages: R.pages.length, problems: bad.map((p) => `${p.name}@${p.viewport}`) };
await fs.writeFile(`${out}/${label}-verification.json`, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R.summary), JSON.stringify(R.checks['finance-1440']), JSON.stringify(R.checks['support-375']));
close();
