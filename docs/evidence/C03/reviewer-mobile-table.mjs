import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dir='docs/evidence/C03',out={sha,checks:[],views:[]};
if(execFileSync('git',['status','--porcelain','--','src','public','tests'],{encoding:'utf8'}).trim())throw new Error('Require committed app');
const check=(name,pass,value)=>out.checks.push({name,pass:!!pass,value});
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
try{
 const p=await browser.newPage();await p.setCacheEnabled(false);
 for(const w of [375,768,900]){
  await p.setViewport({width:w,height:900,isMobile:true,hasTouch:true});await p.goto('http://127.0.0.1:4322/san-pham',{waitUntil:'networkidle0'});
  await p.focus('#mobile-plan-details summary');await p.keyboard.press('Enter');
  await p.evaluate(async()=>{for(const i of document.images){i.loading='eager';await i.decode().catch(()=>{});}});
  const metrics=await p.$eval('#mobile-plan-details table',t=>({width:t.getBoundingClientRect().width,rows:t.tBodies[0].rows.length,columns:t.tHead.rows[0].cells.length,heights:[...t.tBodies[0].rows].map(r=>r.getBoundingClientRect().height),notesWidths:[...t.querySelectorAll('td.col-notes')].map(c=>c.getBoundingClientRect().width),overflowCells:[...t.querySelectorAll('th,td')].filter(c=>c.scrollWidth>c.clientWidth+1).map(c=>({text:c.innerText,client:c.clientWidth,scroll:c.scrollWidth})),pageWidth:document.documentElement.scrollWidth}));
  check('Expanded rows readable '+w,metrics.rows===7&&metrics.columns===5&&metrics.width>=900&&Math.max(...metrics.heights)<320&&Math.min(...metrics.notesWidths)>=240&&metrics.pageWidth<=w,metrics);
  // scrollWidth includes padding; spilling into unused adjacent padding is not text overlap.
  // Preserve the original diagnostic separately and measure actual text rectangles.
  const textOverlaps=await p.$eval('#mobile-plan-details table',t=>[...t.querySelectorAll('th,td')].flatMap(c=>{
    const next=c.nextElementSibling;if(!next)return [];
    const range=document.createRange();range.selectNodeContents(c);
    const boundary=next.getBoundingClientRect().left+parseFloat(getComputedStyle(next).paddingLeft);
    const right=Math.max(...[...range.getClientRects()].map(r=>r.right));
    return right>boundary+1?[{text:c.innerText,right,boundary}]:[];
  }));
  check('No cell text overlap '+w,!textOverlaps.length,{textOverlaps,paddingOverflowDiagnostic:metrics.overflowCells});
  await p.screenshot({path:`${dir}/table-${sha.slice(0,7)}-${w}-open-full.png`,fullPage:true});
  const region=await p.$('#mobile-plan-details .table-responsive');await region.focus();await region.screenshot({path:`${dir}/table-${sha.slice(0,7)}-${w}-left.png`});
  for(let i=0;i<60;i++){await p.keyboard.press('ArrowRight');await new Promise(r=>setTimeout(r,20));}await new Promise(r=>setTimeout(r,250));
  const scrolled=await region.evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth,active:document.activeElement===e,outline:getComputedStyle(e).outline,pageWidth:document.documentElement.scrollWidth}));
  check('Keyboard reaches last columns '+w,scrolled.active&&scrolled.left>=scrolled.max-2&&scrolled.pageWidth<=w&&/solid/.test(scrolled.outline),scrolled);
  await region.screenshot({path:`${dir}/table-${sha.slice(0,7)}-${w}-right.png`});out.views.push({w,metrics,scrolled});
 }
}finally{await browser.close();}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync(`${dir}/reviewer-mobile-table-${sha.slice(0,7)}.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out));process.exitCode=out.failed.length?1:0;
