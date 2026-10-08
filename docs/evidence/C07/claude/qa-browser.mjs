// C07 QA: điều hướng, tràn ngang, cỡ chữ, tương phản, ảnh, link/anchor, menu, skip link, FAQ/details, bảng, console/request.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer=req('puppeteer-core');
const [outDir, repo]=process.argv.slice(2);
const shotDir=outDir+'/screens'; fs.mkdirSync(shotDir,{recursive:true});
const base='http://127.0.0.1:4322';
const routes=[['home','/'],['project','/du-an/mang-theo-mot-net-ve'],['products','/san-pham'],['finance','/minh-bach'],['team','/ve-nhom'],['support','/dong-hanh'],['404','/c07-khong-ton-tai']];
const vps=[[375,812,true],[768,1024,true],[1440,900,false]];
const git=(...a)=>execFileSync('git',['-C',repo,...a],{encoding:'utf8'}).trim();
const out={headSha:git('rev-parse','HEAD'),appTreeClean:git('status','--porcelain','--','src','public','tests','astro.config.mjs','package.json','package-lock.json','tsconfig.json')==='',base,startedAt:new Date().toISOString(),pages:[],checks:[],console:[],failed:[],external:[]};
const check=(name,pass,detail)=>out.checks.push({name,pass:!!pass,detail});
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
out.browser=await b.version();
const metrics=()=>{
  const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b2]=m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return {L:.2126*r+.7152*g+.0722*b2,a:m[3]===undefined?1:+m[3]}};
  const bgOf=el=>{for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);const l=lum(s.backgroundColor);if(l&&l.a>.5)return l.L;if(s.backgroundImage!=='none')return null}return 1};
  const small=[],low=[];
  for(const el of document.querySelectorAll('body *')){
    if(el.closest('[aria-hidden="true"]')||el.closest('.sr-only')||(el.closest('details:not([open])')&&!el.closest('summary')))continue;
    if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none')continue;
    const fs=parseFloat(s.fontSize),t=el.textContent.trim().slice(0,40);
    if(fs<14)small.push({tag:el.tagName,fs,t});
    const fg=lum(s.color),bg=bgOf(el);if(fg&&bg!=null){const cr=(Math.max(fg.L,bg)+.05)/(Math.min(fg.L,bg)+.05);const large=fs>=24||(fs>=18.66&&+s.fontWeight>=700);if(cr<(large?3:4.5))low.push({tag:el.tagName,cr:+cr.toFixed(2),fs,t})}
  }
  const imgs=[...document.images].map(i=>({src:i.getAttribute('src'),alt:i.alt,ok:i.complete&&i.naturalWidth>0,w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height,nw:i.naturalWidth,nh:i.naturalHeight,fit:getComputedStyle(i).objectFit}));
  return {title:document.title,robots:document.querySelector('meta[name=robots]')?.content,scrollW:document.documentElement.scrollWidth,vw:document.documentElement.clientWidth,height:document.documentElement.scrollHeight,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),small,low,imgs,
    links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),
    ids:[...document.querySelectorAll('[id]')].map(e=>e.id),
    forms:document.querySelectorAll('form,input,textarea,select').length,
    textSample:document.querySelector('main')?.innerText.length};
};
const allLinks=new Map();
for(const [n,r] of routes)for(const [w,h,m] of vps){
  const p=await b.newPage();
  p.on('console',msg=>{if(['error','warning'].includes(msg.type()))out.console.push({page:n,w,type:msg.type(),text:msg.text().slice(0,200)})});
  p.on('requestfailed',rq=>out.failed.push({page:n,w,url:rq.url()}));
  p.on('request',rq=>{if(!rq.url().startsWith(base)&&!rq.url().startsWith('data:'))out.external.push({page:n,url:rq.url()})});
  await p.setViewport({width:w,height:h,isMobile:m,hasTouch:m,deviceScaleFactor:1});
  const resp=await p.goto(base+r,{waitUntil:'networkidle0'});
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,15))}scrollTo(0,0);await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  const d=await p.evaluate(metrics);
  d.status=resp.status();
  out.pages.push({n,w,...d,links:undefined,ids:undefined});
  d.links.forEach(l=>{if(!allLinks.has(l))allLinks.set(l,new Set());allLinks.get(l).add(r)});
  check(`${n}@${w} status`, n==='404'?d.status===404:d.status===200, d.status);
  check(`${n}@${w} no horizontal overflow`, d.scrollW<=d.vw, `${d.scrollW}/${d.vw}`);
  check(`${n}@${w} one h1`, d.h1.length===1, d.h1);
  check(`${n}@${w} text >=14px`, d.small.length===0, d.small.slice(0,5));
  check(`${n}@${w} contrast`, d.low.length===0, d.low.slice(0,5));
  check(`${n}@${w} images loaded, alt set, not distorted`, d.imgs.every(i=>i.ok&&typeof i.alt==='string'&&(i.fit==='cover'||i.fit==='contain'||Math.abs(i.w/i.h-i.nw/i.nh)<0.02)), d.imgs.map(i=>`${i.src}:${i.ok}:${i.fit}`));
  check(`${n}@${w} noindex`, d.robots==='noindex, nofollow', d.robots);
  check(`${n}@${w} no forms`, d.forms===0, d.forms);
  await p.screenshot({path:`${shotDir}/${n}-${w}-full.png`,fullPage:true});
  await p.close();
}
// Links + anchors
const ctx=await b.newPage();
for(const [href,from] of allLinks){
  if(/^https?:/.test(href)){check(`external link allowed ${href}`, /pexels\.com/.test(href), [...from]);continue}
  const url=new URL(href,base+[...from][0]);
  const res=await ctx.goto(url.href,{waitUntil:'domcontentloaded'});
  let ok=res.status()===200;
  if(url.hash){ok=ok&&await ctx.evaluate(id=>!!document.getElementById(decodeURIComponent(id)),url.hash.slice(1))}
  check(`link ${href}`, ok, {status:res.status(),from:[...from]});
}
// Direct reload
for(const [n,r] of routes.slice(0,6)){const res=await ctx.goto(base+r);const res2=await ctx.reload();check(`reload ${n}`, res.status()===200&&res2.status()===200, [res.status(),res2.status()]);}
await ctx.close();
// Mobile menu + skip link
{
  const p=await b.newPage();await p.setViewport({width:375,height:812,isMobile:true,hasTouch:true});await p.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
  await p.keyboard.press('Tab');
  await new Promise(r=>setTimeout(r,400)); // chờ transition top 150ms của skip link
  const skip=await p.evaluate(()=>{const a=document.activeElement;return {cls:a.className,top:a.getBoundingClientRect().top}});
  check('skip link first focus and visible', skip.cls.includes('skip-link')&&skip.top>=0, skip);
  await p.keyboard.press('Enter');
  const mainFocus=await p.evaluate(()=>document.activeElement.id);
  check('skip link moves focus to main', mainFocus==='main-content', mainFocus);
  await p.click('#mobile-nav-toggle');
  const open=await p.evaluate(()=>({exp:document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded'),hidden:document.querySelector('#mobile-nav-panel').hidden}));
  check('menu opens', open.exp==='true'&&!open.hidden, open);
  await new Promise(r=>setTimeout(r,400)); // chờ icon menu hết transition trước khi chụp
  await p.screenshot({path:`${shotDir}/menu-375-open.png`});
  await p.keyboard.press('Tab');
  const inPanel=await p.evaluate(()=>!!document.activeElement.closest('#mobile-nav-panel'));
  check('Tab enters open menu', inPanel, inPanel);
  await p.keyboard.press('Escape');
  const closed=await p.evaluate(()=>({exp:document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded'),hidden:document.querySelector('#mobile-nav-panel').hidden,focus:document.activeElement.id}));
  check('Escape closes menu and returns focus', closed.exp==='false'&&closed.hidden&&closed.focus==='mobile-nav-toggle', closed);
  await p.click('#mobile-nav-toggle');
  await Promise.all([p.waitForNavigation(),p.click('#mobile-nav-panel a[href="/san-pham"]')]);
  check('menu link navigates', p.url().endsWith('/san-pham'), p.url());
  await p.close();
}
// FAQ + disclosures by keyboard, tables at mobile
for(const [n,r,sel] of [['products','/san-pham','.faq-item'],['finance','/minh-bach','.faq-item'],['support','/dong-hanh','.faq-item'],['finance-ledger','/minh-bach','details.ledger-group'],['finance-profit','/minh-bach','details.profit-detail'],['project-agenda','/du-an/mang-theo-mot-net-ve','details.disclosure']]){
  for(const w of [375,1440]){
    const p=await b.newPage();await p.setViewport({width:w,height:900,isMobile:w<1024,hasTouch:w<1024});await p.goto(base+r,{waitUntil:'networkidle0'});
    const count=await p.$$eval(sel,e=>e.length);
    await p.focus(`${sel} > summary`);
    const focusVisible=await p.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2});
    await p.keyboard.press('Enter');
    const opened=await p.$eval(sel,e=>e.open);
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth);
    if(w===375||n.startsWith('finance-')) {await p.$eval(sel,e=>e.scrollIntoView());await new Promise(r=>setTimeout(r,400));await p.screenshot({path:`${shotDir}/${n}-${w}-open.png`});}
    await p.keyboard.press('Enter');
    const closedAgain=await p.$eval(sel,e=>!e.open);
    check(`${n}@${w} keyboard open/close (${count} items)`, count>0&&opened&&closedAgain&&focusVisible&&ov, {count,opened,closedAgain,focusVisible,ov});
    await p.close();
  }
}
// Open every disclosure at 375 and check no overflow
for(const [n,r] of routes.slice(0,6))for(const w of [375,768,1024]){const p=await b.newPage();await p.setViewport({width:w,height:900,isMobile:w<1024,hasTouch:w<1024});await p.goto(base+r,{waitUntil:'networkidle0'});
  await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
  const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,h:document.documentElement.scrollHeight}));
  check(`${n}@${w} all details open no overflow`, o.sw<=o.cw, o);await p.close();}
// Desktop focus ring
{const p=await b.newPage();await p.setViewport({width:1440,height:900});await p.goto(base+'/',{waitUntil:'networkidle0'});
  const rings=[];for(let i=0;i<6;i++){await p.keyboard.press('Tab');rings.push(await p.evaluate(()=>{const e=document.activeElement;const s=getComputedStyle(e);return {t:e.textContent.trim().slice(0,30),o:s.outlineStyle,w:s.outlineWidth}}))}
  check('desktop keyboard focus visible', rings.slice(1).every(r=>r.o!=='none'&&parseFloat(r.w)>=2), rings);
  await p.keyboard.press('Tab');await p.screenshot({path:`${shotDir}/focus-1440.png`});await p.close();}
await b.close();
check('no console errors (excluding intentional 404)', out.console.filter(c=>!(c.page==='404'&&/404/.test(c.text))).length===0, out.console);
check('no failed requests', out.failed.length===0, out.failed);
check('no external requests', out.external.length===0, out.external);
out.finishedAt=new Date().toISOString();
out.summary={total:out.checks.length,pass:out.checks.filter(c=>c.pass).length,fail:out.checks.filter(c=>!c.pass).map(c=>c.name)};
fs.writeFileSync(outDir+'/qa-results.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(out.summary,null,1));
console.log(out.pages.map(p=>`${p.n}@${p.w}: ${p.height}px`).join('\n'));
