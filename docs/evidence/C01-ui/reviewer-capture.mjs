// RV-C01-CLAUDE: read-only capture of the running loopback preview. Writes only into docs/evidence/Claude-C01/reviewer-*.
import {createRequire} from 'node:module';
import fs from 'node:fs';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const puppeteer=req('puppeteer-core');
const base=process.env.BASE||'http://127.0.0.1:4322',dir='docs/evidence/C01-ui';
const routes=[['home','/'],['project','/du-an/mang-theo-mot-net-ve'],['products','/san-pham'],['finance','/minh-bach'],['team','/ve-nhom'],['support','/dong-hanh'],['404','/reviewer-c01-khong-co']];
const vps=[[375,812,true],[768,1024,true],[1440,900,false]];
const out={base,startedAt:new Date().toISOString(),pages:[],errors:[],failed:[],external:[],menu:{},keyboard:{}};
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
out.browser=await browser.version();
const metrics=()=>{
  const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return {L:.2126*r+.7152*g+.0722*b,a:m[3]===undefined?1:+m[3]}};
  const bgOf=el=>{for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);const l=lum(s.backgroundColor);if(l&&l.a>.5)return l.L;if(s.backgroundImage!=='none')return null}return 1};
  const small=[],low=[];
  for(const el of document.querySelectorAll('body *')){
    if(!el.childNodes.length||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none')continue;
    const fs=parseFloat(s.fontSize),t=el.textContent.trim().slice(0,50);
    if(fs<14)small.push({tag:el.tagName,cls:el.className&&String(el.className).slice(0,40),fs,t});
    const fg=lum(s.color),bg=bgOf(el);if(fg&&bg!=null){const cr=(Math.max(fg.L,bg)+.05)/(Math.min(fg.L,bg)+.05);const large=fs>=24||(fs>=18.66&&+s.fontWeight>=700);if(cr<(large?3:4.5))low.push({tag:el.tagName,cls:String(el.className).slice(0,40),cr:+cr.toFixed(2),fs,t})}
  }
  const over=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&r.width>0&&getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>e.tagName+'.'+String(e.className).slice(0,30));
  const imgs=[...document.images].map(i=>{const r=i.getBoundingClientRect(),s=getComputedStyle(i);return {src:i.getAttribute('src'),alt:i.alt,w:Math.round(r.width),h:Math.round(r.height),nat:i.naturalWidth+'x'+i.naturalHeight,fit:s.objectFit,ok:i.complete&&i.naturalWidth>0}});
  const h=document.querySelector('.site-header');
  return {title:document.title,scrollW:document.documentElement.scrollWidth,vw:innerWidth,height:document.documentElement.scrollHeight,headerH:h&&Math.round(h.getBoundingClientRect().height),
    h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),current:[...document.querySelectorAll('[aria-current="page"]')].map(e=>e.textContent.trim()),
    small:small.slice(0,15),smallCount:small.length,low:low.slice(0,15),lowCount:low.length,over,imgs,
    figures:[...document.querySelectorAll('figcaption')].filter(f=>!f.closest('figure')).length,
    tables:[...document.querySelectorAll('table')].map(t=>{const r=t.getBoundingClientRect();const p=t.parentElement;return {w:Math.round(r.width),parentW:Math.round(p.getBoundingClientRect().width),parentOverflow:getComputedStyle(p).overflowX}})};
};
for(const [vw,vh,mobile] of vps){
  const page=await browser.newPage();
  await page.setViewport({width:vw,height:vh,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  page.on('pageerror',e=>out.errors.push(vw+' '+e.message));
  page.on('console',m=>{if(m.type()==='error')out.errors.push(vw+' console '+m.text())});
  page.on('requestfailed',r=>out.failed.push(r.url()));
  page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))out.external.push(r.url())});
  for(const [name,route] of routes){
    const resp=await page.goto(base+route,{waitUntil:'networkidle0'});
    await page.evaluate(()=>document.fonts.ready);
    const m=await page.evaluate(metrics);
    const shot=`${dir}/reviewer-${name}-${vw}-full.png`;
    await page.screenshot({path:shot,fullPage:true});
    out.pages.push({name,route,vw,status:resp.status(),shot,...m});
  }
  if(vw===375){
    await page.goto(base+'/san-pham',{waitUntil:'networkidle0'});
    await page.click('#mobile-nav-toggle');await new Promise(r=>setTimeout(r,300));
    out.menu.afterOpen=await page.evaluate(()=>({expanded:document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded'),hidden:document.querySelector('#mobile-nav-panel').hidden,label:document.querySelector('#mobile-nav-toggle').getAttribute('aria-label'),links:[...document.querySelectorAll('#mobile-nav-panel a')].map(a=>a.textContent.trim()+(a.getAttribute('aria-current')?'*':''))}));
    await page.screenshot({path:`${dir}/reviewer-menu-375.png`});out.menu.shot=`${dir}/reviewer-menu-375.png`;
    await page.keyboard.press('Escape');await new Promise(r=>setTimeout(r,200));
    out.menu.afterEsc=await page.evaluate(()=>({expanded:document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded'),focus:document.activeElement.id}));
    // viewport-only first screen of home on mobile
    await page.goto(base+'/',{waitUntil:'networkidle0'});
    await page.screenshot({path:`${dir}/reviewer-home-375-fold.png`});
  }
  if(vw===1440){
    await page.goto(base+'/',{waitUntil:'networkidle0'});
    const seq=[];
    for(let i=0;i<9;i++){await page.keyboard.press('Tab');seq.push(await page.evaluate(()=>{const a=document.activeElement;const s=getComputedStyle(a);return (a.textContent||a.getAttribute('aria-label')||a.tagName).trim().slice(0,40)+' | outline '+s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor}))}
    out.keyboard.home1440=seq;
    await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');
    await page.screenshot({path:`${dir}/reviewer-keyboard-focus-1440.png`});
    await page.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
    await page.screenshot({path:`${dir}/reviewer-finance-1440-fold.png`});
  }
  await page.close();
}
await browser.close();
out.finishedAt=new Date().toISOString();
fs.writeFileSync(`${dir}/reviewer-capture.json`,JSON.stringify(out,null,2));
console.log('pages',out.pages.length,'errors',out.errors.length,'failed',out.failed.length,'external',out.external.length);
for(const p of out.pages)console.log(p.name,p.vw,p.status,'h='+p.height,'sw='+p.scrollW,'small='+p.smallCount,'low='+p.lowCount,'cur='+p.current.join('/'),'over='+p.over.length,'figcap='+p.figures);
