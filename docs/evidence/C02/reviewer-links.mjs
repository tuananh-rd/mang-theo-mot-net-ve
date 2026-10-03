import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const base='http://127.0.0.1:4322',out={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks:[],external:[]};const check=(name,pass,value)=>out.checks.push({name,pass:!!pass,value});
try{
 const p=await browser.newPage();await p.setCacheEnabled(false);const targets=new Set();
 for(const route of ['/','/du-an/mang-theo-mot-net-ve','/san-pham','/minh-bach','/ve-nhom','/dong-hanh']){
  await p.goto(base+route,{waitUntil:'networkidle0'});
  const links=await p.$$eval('a[href]',els=>els.map(e=>({href:e.href,target:e.target,rel:e.rel})));
  for(const l of links){const u=new URL(l.href);if(u.origin===base)targets.add(u.pathname+u.hash);else{out.external.push(l);check('Approved external source '+route,u.hostname==='www.pexels.com',l.href);}}
 }
 for(const dest of targets){await p.goto('about:blank');const r=await p.goto(base+dest,{waitUntil:'networkidle0'});check('Internal destination '+dest,r.status()===200,r.status());const hash=new URL(base+dest).hash;if(hash){const id=decodeURIComponent(hash.slice(1));check('Anchor exists '+dest,await p.evaluate(id=>!!document.getElementById(id),id),id);}}
 await p.setViewport({width:375,height:812,isMobile:true,hasTouch:true});await p.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
 const details=await p.$$('details');check('Finance FAQ present',details.length>=4,details.length);
 if(details.length){await details[0].evaluate(e=>e.querySelector('summary').focus());await p.keyboard.press('Enter');check('FAQ keyboard opens',await details[0].evaluate(e=>e.open),null);await p.keyboard.press('Space');check('FAQ keyboard closes',await details[0].evaluate(e=>!e.open),null);}
}finally{await browser.close();}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync('docs/evidence/C02/reviewer-links.json',JSON.stringify(out,null,2));console.log(JSON.stringify({checks:out.checks.length,failed:out.failed,externalCount:out.external.length}));process.exitCode=out.failed.length?1:0;


