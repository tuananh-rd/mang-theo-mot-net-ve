// RV-C02-CLAUDE: read-only capture of existing preview :4322 with ONE browser. Writes only docs/evidence/Claude-C02/claude-*.
import {createRequire} from 'node:module';
import fs from 'node:fs';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const puppeteer=req('puppeteer-core');
const base='http://127.0.0.1:4322',dir='docs/evidence/Claude-C02';
const routes=[['home','/'],['project','/du-an/mang-theo-mot-net-ve'],['products','/san-pham'],['finance','/minh-bach'],['team','/ve-nhom'],['support','/dong-hanh']];
const out={base,startedAt:new Date().toISOString(),pages:[],errors:[],failed:[],external:[],extra:{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu','--renderer-process-limit=1']});
out.browser=await browser.version();
const page=await browser.newPage();
page.on('pageerror',e=>out.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')out.errors.push('console '+m.text()+' @'+page.url())});
page.on('requestfailed',r=>out.failed.push(r.url()));
page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!u.startsWith('data:'))out.external.push(u)});
async function settle(){
  await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}window.scrollTo(0,0);
    await Promise.all([...document.images].map(i=>i.decode().catch(()=>null)));await document.fonts.ready});
  await sleep(250);
}
const structure=()=>{
  const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
  const main=document.querySelector('main')||document.body;
  const sections=[...main.querySelectorAll(':scope > section, :scope > div > section, :scope > *')].filter(vis).map(s=>{const r=s.getBoundingClientRect();const h=s.querySelector('h1,h2');return {tag:s.tagName,id:s.id||null,heading:h?h.textContent.trim().replace(/\s+/g,' ').slice(0,80):null,top:Math.round(r.top+scrollY),h:Math.round(r.height)}});
  const heads=[...document.querySelectorAll('main h1, main h2, main h3')].filter(vis).map(h=>h.tagName+': '+h.textContent.trim().replace(/\s+/g,' ').slice(0,70));
  const ctas=[...document.querySelectorAll('main a.btn, main .btn, main a[class*="btn"]')].filter(vis).map(a=>a.textContent.trim().replace(/\s+/g,' '));
  const txt=document.querySelector('main').innerText;
  const count=re=>(txt.match(re)||[]).length;
  const imgs=[...document.querySelectorAll('main img')].map(i=>{const r=i.getBoundingClientRect();const f=i.closest('figure');return {src:i.getAttribute('src'),alt:i.alt,w:Math.round(r.width),h:Math.round(r.height),nat:i.naturalWidth+'x'+i.naturalHeight,loading:i.loading,ok:i.complete&&i.naturalWidth>0,caption:f&&f.querySelector('figcaption')?f.querySelector('figcaption').innerText.replace(/\s+/g,' ').slice(0,140):null}});
  return {title:document.title,height:document.documentElement.scrollHeight,scrollW:document.documentElement.scrollWidth,vw:innerWidth,
    firstFoldText:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&/^(H1|H2|P|A|BUTTON|SPAN)$/.test(e.tagName)&&e.children.length===0&&e.textContent.trim()}).map(e=>e.tagName+':'+e.textContent.trim().slice(0,60)).slice(0,25),
    sections,heads,ctas,imgs,
    counts:{chuaXacNhan:count(/ch(ưa|ờ) (được )?xác nhận/gi),duKien:count(/dự kiến/gi),giaDinh:count(/giả định/gi),minhHoa:count(/minh họa/gi),words:txt.split(/\s+/).length},
    smallText:[...document.querySelectorAll('main *')].filter(e=>vis(e)&&e.children.length===0&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<14).length,
    current:[...document.querySelectorAll('[aria-current="page"]')].map(e=>e.textContent.trim())};
};
for(const [vw,vh,mobile] of [[375,812,true],[768,1024,true],[1440,900,false]]){
  await page.setViewport({width:vw,height:vh,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  for(const [name,route] of routes){
    const resp=await page.goto(base+route,{waitUntil:'networkidle0'});
    await settle();
    const fold=`${dir}/claude-${name}-${vw}-fold.png`;await page.screenshot({path:fold});
    const s=await page.evaluate(structure);
    const shot=`${dir}/claude-${name}-${vw}-full.png`;await page.screenshot({path:shot,fullPage:true});
    out.pages.push({name,route,vw,status:resp.status(),shot,fold,...s});
  }
}
// Products 900/1024
await page.setViewport({width:900,height:900,deviceScaleFactor:1});
for(const w of [900,1024]){await page.setViewport({width:w,height:900,deviceScaleFactor:1});await page.goto(base+'/san-pham',{waitUntil:'networkidle0'});await settle();await page.screenshot({path:`${dir}/claude-products-${w}-full.png`,fullPage:true});out.extra['products'+w]=await page.evaluate(()=>({h:document.documentElement.scrollHeight,sw:document.documentElement.scrollWidth}))}
// Menu 375 + FAQ open
await page.setViewport({width:375,height:812,deviceScaleFactor:1,isMobile:true,hasTouch:true});
await page.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
await page.click('#mobile-nav-toggle');await sleep(300);
await page.screenshot({path:`${dir}/claude-menu-375.png`});
out.extra.menu=await page.evaluate(()=>({expanded:document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded'),links:[...document.querySelectorAll('#mobile-nav-panel a')].map(a=>a.textContent.trim()+(a.getAttribute('aria-current')?'*':''))}));
await page.keyboard.press('Escape');await sleep(200);
out.extra.menuAfterEsc=await page.evaluate(()=>({expanded:document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded'),focus:document.activeElement.id}));
for(const [name,route] of [['finance','/minh-bach'],['support','/dong-hanh'],['products','/san-pham']]){
  await page.goto(base+route,{waitUntil:'networkidle0'});
  const n=await page.evaluate(()=>{const d=[...document.querySelectorAll('details')];d.forEach(x=>x.open=true);return d.length});
  out.extra['faq_'+name]={details:n};
  if(n){const el=await page.$('details');await el.evaluate(e=>e.scrollIntoView({block:'start'}));await sleep(150);await page.screenshot({path:`${dir}/claude-faq-open-${name}-375.png`});}
}
// Focus sequence desktop
await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
await page.goto(base+'/',{waitUntil:'networkidle0'});
const seq=[];for(let i=0;i<10;i++){await page.keyboard.press('Tab');seq.push(await page.evaluate(()=>{const a=document.activeElement;const s=getComputedStyle(a);return (a.getAttribute('aria-label')||a.textContent||a.tagName).trim().replace(/\s+/g,' ').slice(0,40)+' | '+s.outlineStyle+' '+s.outlineWidth}))}
out.extra.focus1440=seq;await page.screenshot({path:`${dir}/claude-focus-1440.png`});
await browser.close();
out.finishedAt=new Date().toISOString();
fs.writeFileSync(`${dir}/claude-capture.json`,JSON.stringify(out,null,2));
console.log('browser closed; pages',out.pages.length,'errors',out.errors.length,'failed',out.failed.length,'external',out.external.length);
for(const p of out.pages)console.log(p.name,p.vw,p.status,'h='+p.height,'sw='+p.scrollW,'small='+p.smallText,'cnt='+JSON.stringify(p.counts),'imgs='+p.imgs.filter(i=>!i.ok).length+'bad/'+p.imgs.length);
console.log(JSON.stringify(out.extra));console.log(out.errors);
