// Chụp ảnh viewport/full-page và đo bố cục hero. MSH_BASE=http://127.0.0.1:4385 MSH_LABEL=before MSH_OUT=dir node capture.mjs
import fs from 'node:fs/promises';
import { send, viewport, go, evaluate, screenshot, pause, close, base } from './browser.mjs';
import { inspect } from './scan.mjs';
const out = process.env.MSH_OUT, label = process.env.MSH_LABEL || 'after';
await fs.mkdir(out, { recursive: true });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const routes = [['home', '/'], ['project', '/du-an/mang-theo-mot-net-ve'], ['journal', '/nhat-ky'], ['products', '/san-pham'], ['finance', '/minh-bach'], ['support', '/dong-hanh'], ['team', '/ve-nhom'], ['article', '/nhat-ky/ke-hoach-bon-goc-choi'], ['product-detail', '/san-pham/moc-khoa']];
const fullPages = process.env.MSH_FULL !== '0';
const R = { measuredAt: new Date().toISOString(), base, rows: [] };
const sizes = (process.env.MSH_SIZES || '375x812,1440x900,320x640,390x844,430x932,767x900,768x1024').split(',').map((s) => s.split('x').map(Number));
for (const [w, h] of sizes) {
  await viewport(w, h);
  for (const [name, path] of routes) {
    await go(path); await pause(350);
    const row = await evaluate(`(${inspect.toString()})()`); row.name = name; row.size = `${w}x${h}`;
    delete row.images; delete row.fonts; delete row.links; R.rows.push(row);
    await screenshot(`${out}/${label}-${name}-${w}x${h}-viewport.png`);
    if (fullPages && (w === 375 || w === 1440)) {
      await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,40));}scrollTo({top:0,behavior:'instant'});return true})()`);
      await pause(200); await screenshot(`${out}/${label}-${name}-${w}-fullpage.png`, true);
    }
  }
}
await fs.writeFile(`${out}/${label}-metrics.json`, JSON.stringify(R, null, 2));
console.log(R.rows.filter((r) => r.overflow > 0 || r.h1Count !== 1).map((r) => `${r.name}@${r.size} overflow=${r.overflow} h1=${r.h1Count}`).join('\n') || 'no overflow/h1 issues');
close();
