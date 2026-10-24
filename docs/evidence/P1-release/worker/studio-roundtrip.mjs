// Kiểm chứng UI Studio thật (chế độ dev cục bộ, dữ liệu = production sau bản vá khóa media): chọn ảnh đúng và lưu lại không làm mất ảnh móc khóa.
// Chạy: node docs/evidence/P1-release/worker/studio-roundtrip.mjs  (cần Studio cục bộ trên 4391 và Chrome CDP 9384)
import fs from 'node:fs/promises';
import { viewport, go, evaluate, pause, screenshot, close, base } from './browser-studio.mjs';

const R = {};
await viewport(1440, 900);
await go('/'); await pause(800);
await evaluate(`document.querySelector('a[data-tab="products"]').click()`); await pause(1500);
R.before = await evaluate(`(()=>{const s=document.getElementById('mk_mediaKey');const opts=[...s.options].map(o=>({v:o.value,sel:o.selected}));return{value:s.value,selectedOption:opts.find(o=>o.sel)?.v,hasMatchingOption:opts.some(o=>o.v===s.value&&o.v!==''),label:document.getElementById('mk_mediaLabel').textContent,options:opts.map(o=>o.v)}})()`);
await screenshot('docs/evidence/P1-release/worker/after/studio-products-before-save.png');
// Lưu lại biểu mẫu không đổi gì (đúng thao tác mà biên tập viên làm)
const draftBefore = await (await fetch(base + '/api/drafts/products')).json();
await evaluate(`document.getElementById('productsForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))`); await pause(2000);
const draftAfter = await (await fetch(base + '/api/drafts/products')).json();
R.save = {
  versionHashBefore: draftBefore.draft.revisionHash.slice(0, 16), versionHashAfter: draftAfter.draft.revisionHash.slice(0, 16),
  mocKhoaMediaKeyBefore: draftBefore.draft.data['moc-khoa'].mediaKey, mocKhoaMediaKeyAfter: draftAfter.draft.data['moc-khoa'].mediaKey,
  chuonChuonMediaKeyAfter: draftAfter.draft.data['chuon-chuon-tre-kem-de'].mediaKey,
  pricesAfter: [draftAfter.draft.data['chuon-chuon-tre-kem-de'].officialPrice, draftAfter.draft.data['moc-khoa'].officialPrice],
};
R.photoPreserved = R.save.mocKhoaMediaKeyAfter === R.save.mocKhoaMediaKeyBefore && !!R.save.mocKhoaMediaKeyAfter;
await fs.writeFile('docs/evidence/P1-release/worker/studio-roundtrip.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));
close();
