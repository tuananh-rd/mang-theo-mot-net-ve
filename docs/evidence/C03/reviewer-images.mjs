import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const dir='docs/evidence/C03',base='http://127.0.0.1:4322',out={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks:[],views:[]};
const check=(name,pass,value)=>out.checks.push({name,pass:!!pass,value});
try{
const p=await browser.newPage();await p.setCacheEnabled(false);
for(const w of [375,1440]){
 await p.setViewport({width:w,height:900,isMobile:w===375,hasTouch:w===375});
 for(const [name,route,expected]of [['home','/',5],['project','/du-an/mang-theo-mot-net-ve',4],['products','/san-pham',1]]){
  await p.goto(base+route,{waitUntil:'networkidle0'});
  await p.evaluate(async()=>{for(const i of document.images){i.loading='eager';await i.decode().catch(()=>{});}});
  const photos=await p.$$eval('img',imgs=>imgs.filter(i=>i.src.includes('/illustrations/')).map(i=>({src:i.getAttribute('src'),alt:i.alt,loaded:i.complete&&i.naturalWidth>0,caption:i.closest('figure')?.innerText||'',position:getComputedStyle(i).objectPosition,fit:getComputedStyle(i).objectFit,w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height,source:i.closest('figure')?.querySelector('a')?.href})));
  out.views.push({name,w,photos});
  check('Approved photo count '+name+w,photos.length===expected,photos.length);
  check('Loaded photos and descriptive alt '+name+w,photos.every(i=>i.loaded&&i.alt&&!/trẻ tại|hoạt động tại Mái ấm/i.test(i.alt)),photos);
  check('Context captions and credits '+name+w,photos.every(i=>/minh họa/i.test(i.caption)&&/Pexels/.test(i.caption)&&!!i.source),null);
  if(name==='products')check('Cream puffs not sale portion '+w,photos.every(i=>/không phải hộp|khẩu phần/i.test(i.caption)),photos.map(i=>i.caption));
  for(let i=0;i<photos.length;i++){
   const figures=await p.$$('figure');
   let index=0;
   for(const f of figures){if(await f.$('img[src*="/illustrations/"]')){if(index===i){await f.screenshot({path:`${dir}/reviewer-${name}-${w}-photo-${i+1}.png`});break;}index++;}}
  }
 }
}
for(const w of [375,768,900,1024,1440]){
 await p.setViewport({width:w,height:900});await p.goto(base+'/san-pham',{waitUntil:'networkidle0'});
 await p.evaluate(async()=>{for(const i of document.images){i.loading='eager';await i.decode().catch(()=>{});}});
 const m=await p.evaluate(()=>{const t=document.querySelector('.plan-table'),c=document.querySelector('.table-responsive');return {visible:!!t?.getBoundingClientRect().height,tw:t?.getBoundingClientRect().width,cw:c?.getBoundingClientRect().width,sw:document.documentElement.scrollWidth}});
 check('Product table/cards fit '+w,(w<1024?!m.visible:m.visible)&&(!m.visible||m.tw<=m.cw+1)&&m.sw<=w,m);
 if([900,1024].includes(w))await p.screenshot({path:`${dir}/reviewer-products-${w}-full.png`,fullPage:true});
}
await p.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
const text=await p.evaluate(()=>document.body.innerText);
check('Revenue reconciliation explicit', ['3.950.000','4.500.000','550.000','79.000'].every(s=>text.includes(s)),null);
check('Plan totals retained',['4.935.000','6.700.000','1.765.000'].every(s=>text.includes(s)),null);
const anchors=await p.$$eval('a[href]',els=>els.map(e=>({href:e.getAttribute('href'),blank:e.target==='_blank',rel:e.rel})));
check('External credit links protected',anchors.filter(a=>a.blank).every(a=>/noopener|noreferrer/.test(a.rel)),anchors);
}finally{await browser.close();}
const inputs=JSON.parse(fs.readFileSync('docs/evidence/C02/asset-intake.json','utf8'));
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const forbiddenHashes=new Set(inputs.filter(a=>!a.allowedIllustration).map(a=>a.sha256));
for(const file of walk('dist')){const buf=fs.readFileSync(file);check('No restricted embedded source '+file,!forbiddenHashes.has(crypto.createHash('sha256').update(buf).digest('hex')),null);if(/\.(html|css|js)$/.test(file))check('No inline source/commercial assets '+file,!/data:image|saigonmade|colormate|shopeefood|img\.susercontent|abby\.vn|Ban-giao-ra-soat/i.test(buf.toString()),null);}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync(`${dir}/reviewer-images.json`,JSON.stringify(out,null,2));console.log(JSON.stringify({sha:out.sha,checks:out.checks.length,failed:out.failed}));process.exitCode=out.failed.length?1:0;
