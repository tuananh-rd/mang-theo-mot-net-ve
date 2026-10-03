import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const dir='docs/evidence/C03',base='http://127.0.0.1:4322';
const out={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks:[],observations:[]};
const check=(name,pass,value)=>out.checks.push({name,pass:!!pass,value});
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
try {
 const page=await browser.newPage();await page.setCacheEnabled(false);
 const readyImages=()=>page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images){i.loading='eager';await i.decode().catch(()=>{});}});
 for(const w of [375,768,900,1024,1440]){
  await page.setViewport({width:w,height:900,isMobile:w<1024,hasTouch:w<1024});
  await page.goto(base+'/san-pham',{waitUntil:'networkidle0'});
  const initial=await page.evaluate(()=>({cards:document.querySelectorAll('article.product-card').length,planOpen:document.querySelector('#mobile-plan-details').open,planVisible:!!document.querySelector('#mobile-plan-details').getBoundingClientRect().height,visibleRows:[...document.querySelectorAll('.plan-table tbody tr')].filter(e=>!e.closest('details:not([open])')&&e.getBoundingClientRect().height>0).length,sw:document.documentElement.scrollWidth}));
  check('Exactly seven shared catalog cards '+w,initial.cards===7,initial);
  check('Plan table default responsive visibility '+w,!initial.planOpen&&initial.planVisible===(w<1024)&&initial.visibleRows===(w<1024?0:7),initial);
  check('No page overflow default '+w,initial.sw<=w,initial.sw);
  if(w<1024){
   const summary=await page.$('#mobile-plan-details summary');await summary.focus();await page.keyboard.press('Enter');
   check('Plan keyboard focus visible '+w,await summary.evaluate(e=>{const s=getComputedStyle(e);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=1}),null);
   const expanded=await page.evaluate(()=>{const d=document.querySelector('#mobile-plan-details'),table=d.querySelector('table'),region=table.parentElement;return {open:d.open,rows:table.tBodies[0].rows.length,columns:table.tHead.rows[0].cells.length,sw:document.documentElement.scrollWidth,scrolling:region.scrollWidth>region.clientWidth+1,focusable:region.tabIndex>=0,label:region.getAttribute('aria-label'),hint:d.innerText}});
   check('Keyboard opens complete plan '+w,expanded.open&&expanded.rows===7&&expanded.columns>=5,expanded);
   check('Expanded plan accessible within page '+w,expanded.sw<=w&&(!expanded.scrolling||(expanded.focusable&&expanded.label&&/vuốt|cuộn|ngang/i.test(expanded.hint))),expanded);
   if(w===375){await readyImages();await page.screenshot({path:dir+'/reviewer-products-375-expanded.png',fullPage:true});}
   await summary.focus();await page.keyboard.press('Space');check('Space closes plan '+w,!(await page.$eval('#mobile-plan-details',e=>e.open)),null);
  }
 }
 await page.setViewport({width:375,height:812,isMobile:true,hasTouch:true});
 for(const [name,route]of [['products','/san-pham'],['finance','/minh-bach'],['support','/dong-hanh']]){
  await page.goto(base+route,{waitUntil:'networkidle0'});
  const faqs=await page.$$('details.faq-item');
  check('FAQ native and collapsed '+name,faqs.length>=3&&(await page.$$eval('details.faq-item',es=>es.every(e=>!e.open))),faqs.length);
  const summary=await faqs[0].$('summary');await summary.focus();await page.keyboard.press('Enter');
  check('FAQ keyboard focus visible '+name,await summary.evaluate(e=>{const s=getComputedStyle(e);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=1}),null);
  check('FAQ Enter shows answer '+name,await faqs[0].evaluate(e=>e.open&&!!e.querySelector('.faq-answer')?.getBoundingClientRect().height),null);
  await summary.screenshot({path:dir+'/reviewer-'+name+'-375-faq-focus.png'});
  await readyImages();await page.screenshot({path:dir+'/reviewer-'+name+'-375-faq-open.png',fullPage:true});
  await summary.focus();await page.keyboard.press('Space');check('FAQ Space closes '+name,!(await faqs[0].evaluate(e=>e.open)),null);
 }
 await page.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
 const groups=await page.$$('details.mobile-expense-group-card');check('Three budget groups on mobile',groups.length===3,groups.length);
 for(const group of groups){const s=await group.$('summary');await s.focus();if(await group.evaluate(e=>e.open))await page.keyboard.press('Enter');const label=await s.evaluate(e=>e.innerText);check('Closed subtotal remains visible',/2\.245\.000|1\.560\.000|1\.130\.000/.test(label),label);await page.keyboard.press('Enter');check('Group keyboard restores items',await group.evaluate(e=>e.open&&e.querySelector('.group-items-list').getBoundingClientRect().height>0),label);}
 await page.screenshot({path:dir+'/reviewer-finance-375-groups-expanded.png',fullPage:true});
 const ledger=await page.$$eval('.actual-ledger-compact .actual-row',es=>es.map(e=>e.innerText));check('Five actual fields remain explicitly unknown',ledger.length===5&&ledger.every(s=>s.includes('Chưa xác nhận')),ledger);
 const headings=await page.$$eval('h2,h3',es=>es.map(e=>({text:e.innerText,y:e.getBoundingClientRect().top+scrollY})));out.observations.push({name:'finance',headings,height:await page.evaluate(()=>document.documentElement.scrollHeight)});
 await page.goto(base+'/du-an/mang-theo-mot-net-ve',{waitUntil:'networkidle0'});check('Unique project title',await page.$eval('h1',e=>e.innerText.includes('Dự án Mang Theo Một Nét Vẽ')),null);check('Only four activity photos on project',await page.$$eval('img[src*="/illustrations/"]',es=>es.length===4),null);
 await page.goto(base+'/',{waitUntil:'networkidle0'});out.observations.push({name:'home',headings:await page.$$eval('h2',es=>es.map(e=>e.innerText))});
 check('Header action describes information',await page.$$eval('header a[href="/dong-hanh"]',es=>es.some(e=>e.innerText.includes('Cách đồng hành'))),null);
} finally {await browser.close();}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync(dir+'/reviewer-layout.json',JSON.stringify(out,null,2));console.log(JSON.stringify({sha:out.sha,checks:out.checks.length,failed:out.failed}));process.exitCode=out.failed.length?1:0;
