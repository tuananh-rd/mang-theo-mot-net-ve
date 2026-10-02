import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const puppeteer=req('puppeteer-core');
const root='C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve';
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const results={sha,startedAt:new Date().toISOString(),routes:[],responsive:[],menu:{},errors:[]};
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
try{
results.browser=await browser.version();
const page=await browser.newPage();
page.on('pageerror',e=>results.errors.push(e.message));
for(const route of ['/','/du-an/mang-theo-mot-net-ve','/san-pham','/minh-bach','/ve-nhom','/dong-hanh','/review-route-does-not-exist']){
const response=await page.goto('http://127.0.0.1:4321'+route,{waitUntil:'networkidle0'});
const info=await page.evaluate(()=>({title:document.title,lang:document.documentElement.lang,h1:document.querySelectorAll('h1').length,robots:document.querySelector('meta[name=robots]')?.content,main:document.querySelectorAll('main').length,header:!!document.querySelector('header'),footer:!!document.querySelector('footer'),forms:document.querySelectorAll('form').length}));
const reload=await page.reload({waitUntil:'networkidle0'});
results.routes.push({route,status:response.status(),reloadStatus:reload.status(),...info});
}
for(const [width,height] of [[375,812],[768,1024],[1440,1000]]){
await page.setViewport({width,height,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4321/',{waitUntil:'networkidle0'});
await page.screenshot({path:root+'/docs/evidence/T01/reviewer-'+sha.slice(0,7)+'-'+width+'-viewport.png'});
await page.screenshot({path:root+'/docs/evidence/T01/reviewer-'+sha.slice(0,7)+'-'+width+'-full.png',fullPage:true});
const info=await page.evaluate(()=>{
function lum(c){return c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
const failures=[];
for(const el of document.querySelectorAll('body *')){
if(el.closest('svg')||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
const r=el.getBoundingClientRect(),s=getComputedStyle(el);
if(!r.width||!r.height||s.visibility==='hidden')continue;
let b=el,bg=[255,255,255,1];
while(b){const c=rgb(getComputedStyle(b).backgroundColor);if(c.length>=3&&(c[3]??1)>0){bg=c;break}b=b.parentElement}
const fg=rgb(s.color);if(fg.length<3)continue;
const a=lum(fg),z=lum(bg),ratio=(Math.max(a,z)+.05)/(Math.min(a,z)+.05);
const size=parseFloat(s.fontSize),large=size>=24||(size>=18.66&&parseInt(s.fontWeight)>=700),threshold=large?3:4.5;
if(ratio+0.001<threshold)failures.push({tag:el.tagName,text:el.textContent.trim().slice(0,80),color:s.color,bg:JSON.stringify(bg),size,ratio,threshold});
}
return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,grids:['.activities-grid','.products-grid','.stages-grid'].map(sel=>({sel,columns:getComputedStyle(document.querySelector(sel)).gridTemplateColumns})),contrastFailures:failures,ctaHeight:document.querySelector('.cta-btn').getBoundingClientRect().height,toggleHeight:document.querySelector('#mobile-nav-toggle').getBoundingClientRect().height,captionSizes:[...document.querySelectorAll('.card-note small,.notes-info small,.illustration-caption')].map(x=>getComputedStyle(x).fontSize)};
});
results.responsive.push(info);
}
await page.setViewport({width:375,height:812,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4321/',{waitUntil:'networkidle0'});
await page.keyboard.press('Tab');
results.menu.skipTab=await page.evaluate(()=>document.activeElement.className);
await page.keyboard.press('Enter');
results.menu.skipEnter=await page.evaluate(()=>document.activeElement.id);
await page.click('#mobile-nav-toggle');
results.menu.open=await page.$eval('#mobile-nav-panel',e=>!e.hidden);
await page.screenshot({path:root+'/docs/evidence/T01/reviewer-'+sha.slice(0,7)+'-375-menu-open.png'});
await page.keyboard.press('Tab');
results.menu.firstTab=await page.evaluate(()=>({text:document.activeElement.textContent.trim(),inside:!!document.activeElement.closest('#mobile-nav-panel'),outline:getComputedStyle(document.activeElement).outline}));
await page.keyboard.press('Escape');
results.menu.escape=await page.evaluate(()=>({hidden:document.getElementById('mobile-nav-panel').hidden,expanded:document.getElementById('mobile-nav-toggle').getAttribute('aria-expanded'),focus:document.activeElement.id}));
await page.keyboard.press('Tab');
results.menu.closedTab=await page.evaluate(()=>({inside:!!document.activeElement.closest('#mobile-nav-panel'),href:document.activeElement.getAttribute('href')}));
await page.click('#mobile-nav-toggle');
await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('#mobile-nav-panel a[href="/san-pham"]')]);
results.menu.link=await page.evaluate(()=>({url:location.pathname,expanded:document.getElementById('mobile-nav-toggle').getAttribute('aria-expanded')}));
await page.goto('http://127.0.0.1:4321/',{waitUntil:'networkidle0'});
await page.click('#mobile-nav-toggle');
await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
results.menu.resize=await page.evaluate(()=>({panelVisible:!document.getElementById('mobile-nav-panel').hidden&&getComputedStyle(document.getElementById('mobile-nav-panel')).display!=='none',desktopNavVisible:getComputedStyle(document.querySelector('.desktop-nav')).display!=='none'}));
await page.setViewport({width:375,height:812,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4321/',{waitUntil:'networkidle0'});
for(const [selector,label] of [['.section-products','products'],['.section-transparency','transparency'],['footer','footer']]){
await page.$eval(selector,x=>x.scrollIntoView());
await page.screenshot({path:root+'/docs/evidence/T01/reviewer-'+sha.slice(0,7)+'-375-'+label+'.png'});
}
const nojs=await browser.newPage();await nojs.setJavaScriptEnabled(false);await nojs.setViewport({width:375,height:812});await nojs.goto('http://127.0.0.1:4321/',{waitUntil:'networkidle0'});
results.nojsFooterRoutes=await nojs.$$eval('footer a',els=>els.map(x=>x.getAttribute('href')));
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);results.reducedMotion=await page.$eval('.btn',e=>getComputedStyle(e).transitionDuration);
}finally{await browser.close()}
results.endedAt=new Date().toISOString();
results.shaAtEnd=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const file=root+'/docs/evidence/T01/reviewer-browser-'+sha.slice(0,7)+'.json';
fs.writeFileSync(file,JSON.stringify(results,null,2));
console.log(JSON.stringify({file,sha,shaAtEnd:results.shaAtEnd,routes:results.routes,contrastFailures:results.responsive.map(x=>({width:x.width,count:x.contrastFailures.length,examples:x.contrastFailures.slice(0,3)})),responsive:results.responsive.map(({contrastFailures,...rest})=>rest),menu:results.menu,nojsFooterRoutes:results.nojsFooterRoutes,errors:results.errors,reducedMotion:results.reducedMotion},null,2));
