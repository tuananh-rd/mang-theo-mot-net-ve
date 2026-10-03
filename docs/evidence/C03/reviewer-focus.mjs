import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),out={sha,checks:[]};
if(execFileSync('git',['status','--porcelain','--','src','public','tests'],{encoding:'utf8'}).trim())throw new Error('Require committed app before assigning focus evidence to HEAD');
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
try{const p=await browser.newPage();await p.setViewport({width:375,height:812,isMobile:true,hasTouch:true});
 for(const [route,selector] of [['/san-pham','.faq-question'],['/minh-bach','.faq-question'],['/dong-hanh','.faq-question'],['/san-pham','#mobile-plan-details summary']]){
  await p.goto('http://127.0.0.1:4322'+route,{waitUntil:'networkidle0'});await p.focus(selector);await p.keyboard.press('Enter');
  await new Promise(r=>setTimeout(r,220));
  const value=await p.$eval(selector,e=>{const s=getComputedStyle(e);return {outline:s.outline,background:s.backgroundColor,focus:document.activeElement===e,open:e.closest('details').open}});
  out.checks.push({name:route+' '+selector,pass:value.focus&&value.open&&!/none|0px/.test(value.outline),value});
  await p.screenshot({path:`docs/evidence/C03/focus-${sha.slice(0,7)}-${out.checks.length}.png`});
 }
 await p.focus('#mobile-plan-details .table-responsive');const value=await p.$eval('#mobile-plan-details .table-responsive',e=>({outline:getComputedStyle(e).outline,focus:document.activeElement===e}));out.checks.push({name:'Expanded table scroll region',pass:value.focus&&!/none|0px/.test(value.outline),value});
}finally{await browser.close();}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync(`docs/evidence/C03/reviewer-focus-${sha.slice(0,7)}.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out));process.exitCode=out.failed.length?1:0;
