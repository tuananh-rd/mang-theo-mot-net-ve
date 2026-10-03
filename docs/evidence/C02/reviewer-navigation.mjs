import {createRequire} from 'node:module';
import fs from 'node:fs';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const out={checks:[]};const check=(name,pass,value)=>out.checks.push({name,pass:!!pass,value});
try{
 const p=await browser.newPage();await p.setCacheEnabled(false);await p.setViewport({width:375,height:812,isMobile:true,hasTouch:true});
 const base='http://127.0.0.1:4322';
 for(const route of ['/','/du-an/mang-theo-mot-net-ve','/san-pham','/minh-bach','/ve-nhom','/dong-hanh','/no-c01-ui-route']){
  const expected=route==='/no-c01-ui-route'?404:200;
  check('Direct '+route,(await p.goto(base+route,{waitUntil:'networkidle0'})).status()===expected,expected);
  check('Reload '+route,(await p.reload({waitUntil:'networkidle0'})).status()===expected,expected);
 }
 await p.goto(base+'/',{waitUntil:'networkidle0'});
 await p.keyboard.press('Tab');check('Skip link first',await p.evaluate(()=>document.activeElement.getAttribute('href')==='#main-content'),null);
 await p.keyboard.press('Enter');check('Skip moves to main',await p.evaluate(()=>document.activeElement.id==='main-content'),await p.evaluate(()=>document.activeElement.id));
 await p.focus('#mobile-nav-toggle');await p.keyboard.press('Space');
 check('Menu opens with keyboard',await p.$eval('#mobile-nav-toggle',e=>e.getAttribute('aria-expanded')==='true'),null);
 await p.keyboard.press('Tab');check('Menu links reachable by Tab',await p.evaluate(()=>!!document.activeElement.closest('#mobile-nav-panel')),null);
 await p.keyboard.press('Escape');check('Escape closes and restores focus',await p.evaluate(()=>document.activeElement.id==='mobile-nav-toggle'&&document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded')==='false'),null);
 await p.click('#mobile-nav-toggle');await Promise.all([p.waitForNavigation({waitUntil:'networkidle0'}),p.click('#mobile-nav-panel a[href="/san-pham"]')]);
 check('Choosing link navigates and closes menu',await p.evaluate(()=>location.pathname==='/san-pham'&&document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded')==='false'),null);
}finally{await browser.close();}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync('docs/evidence/C02/reviewer-navigation.json',JSON.stringify(out,null,2));console.log(JSON.stringify({checks:out.checks.length,failed:out.failed}));process.exitCode=out.failed.length?1:0;
