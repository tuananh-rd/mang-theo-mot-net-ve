import {createRequire} from 'node:module';
import fs from 'node:fs';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const page=await browser.newPage(),base='http://127.0.0.1:4322',dir='docs/evidence/C01-ui';
const out={};
try{
await page.setViewport({width:375,height:1000,isMobile:true,hasTouch:true});
await page.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
out.expenseCards=await page.$$eval('.mobile-expense-card',els=>els.length);
out.separators=await page.$$eval('.mobile-sub-sep',els=>els.map(e=>({text:e.textContent,ariaHidden:e.getAttribute('aria-hidden')})));
await page.$eval('.mobile-expense-list',e=>e.scrollIntoView());
await page.screenshot({path:`${dir}/reviewer-finance-375-detail.png`});
await page.setViewport({width:768,height:1024,isMobile:true,hasTouch:true});
await page.goto(base+'/san-pham',{waitUntil:'networkidle0'});
await page.$eval('.plan-mobile-list',e=>e.scrollIntoView());
await page.screenshot({path:`${dir}/reviewer-products-768-detail.png`});
await page.setViewport({width:1440,height:1000});
await page.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
await page.$eval('.expense-table',e=>e.scrollIntoView()).catch(()=>page.$eval('table',e=>e.scrollIntoView()));
await page.screenshot({path:`${dir}/reviewer-finance-1440-detail.png`});
out.pass=out.expenseCards===19&&out.separators.length===19&&out.separators.every(s=>s.ariaHidden==='true'&&s.text==='•');
fs.writeFileSync(`${dir}/reviewer-details.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out));
}finally{await browser.close();}
