import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const reviewerRequire=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const puppeteer=reviewerRequire('puppeteer-core');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dir='docs/evidence/C01',base='http://127.0.0.1:4321';
const report={sha,startedAt:new Date().toISOString(),checks:[],views:[],errors:[],failedRequests:[],externalRequests:[],screenshots:[]};
const check=(name,pass,observed)=>report.checks.push({name,pass:!!pass,observed});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
try{
report.browser=await browser.version();
const page=await browser.newPage();
page.on('pageerror',e=>report.errors.push(e.message));
page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),failure:r.failure()}));
page.on('request',r=>{if(new URL(r.url()).origin!==base)report.externalRequests.push(r.url())});
const targets=[['home','/'],['project','/du-an/mang-theo-mot-net-ve'],['products','/san-pham'],['finance','/minh-bach'],['team','/ve-nhom'],['support','/dong-hanh'],['404','/c01-no-such-route']];
const internal=new Set(),titles=[];
for(const [name,route] of targets){
  const r=await page.goto(base+route,{waitUntil:'networkidle0'}),reload=await page.reload({waitUntil:'networkidle0'});
  check('Direct/reload '+name,r.status()===(name==='404'?404:200)&&(name==='404'?reload.status()===404:[200,304].includes(reload.status())),[r.status(),reload.status()]);
  for(const width of [375,768,1440]){
    await page.setViewport({width,height:width===375?812:1000,deviceScaleFactor:1});
    await page.goto(base+route,{waitUntil:'networkidle0'});
    const v=await page.evaluate(()=>{
      const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const contrast=[];for(const e of document.querySelectorAll('body *')){if(e.closest('svg')||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||!e.getBoundingClientRect().height||!e.getBoundingClientRect().width||getComputedStyle(e).visibility==='hidden')continue;const s=getComputedStyle(e);let p=e,bg=[255,255,255];while(p){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length>=3&&(c[3]??1)>0){bg=c;break}p=p.parentElement}const a=lum(rgb(s.color)),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(s.fontSize),minimum=size>=24||(size>=18.66&&parseInt(s.fontWeight)>=700)?3:4.5;if(ratio+.001<minimum)contrast.push({text:e.textContent.trim().slice(0,70),ratio,minimum})}
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,lang:document.documentElement.lang,robots:document.querySelector('meta[name=robots]')?.content,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,form:document.querySelectorAll('form').length,text:document.querySelector('main')?.innerText,contrast,images:[...document.images].map(i=>({src:i.getAttribute('src'),alt:i.alt,complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,objectFit:getComputedStyle(i).objectFit})),icon:document.querySelector('link[rel=icon]')?.getAttribute('href'),links:[...document.querySelectorAll('a[href]')].map(a=>({url:a.href,same:new URL(a.href).origin===location.origin,anchor:!new URL(a.href).hash||!!document.getElementById(decodeURIComponent(new URL(a.href).hash.slice(1)))}))};
    });
    report.views.push({name,route,...v});if(width===375)titles.push(v.title);
    check('Overflow '+name+' '+width,v.scrollWidth<=width,v.scrollWidth);
    check('Contrast '+name+' '+width,v.contrast.length===0,v.contrast);
    check('Preview/a11y '+name+' '+width,v.lang==='vi'&&v.robots==='noindex, nofollow'&&v.h1===1&&v.main===1&&v.form===0,{lang:v.lang,robots:v.robots,h1:v.h1,main:v.main,form:v.form});
    check('No stale content '+name+' '+width,!/túi bút|túi vải|3\.120\.000|2\.900\.000|220\.000|55\.000|75\.000đ\s*\/chiếc|chưa hòa vốn/i.test(v.text),null);
    const visible=v.images.filter(i=>i.width&&i.height);
    check('Loaded/undistorted logos '+name+' '+width,visible.length>=2&&visible.every(i=>i.complete&&i.naturalWidth>0&&(i.objectFit==='contain'||Math.abs((i.width/i.height)/(i.naturalWidth/i.naturalHeight)-1)<.02)),visible);
    if(name==='home'||name==='finance')check('Plan amounts '+name+' '+width,['4.935.000','6.700.000','1.765.000'].every(x=>v.text.includes(x))&&/giả định/i.test(v.text)&&/chưa.*xác nhận/i.test(v.text),v.text);
    if(name==='finance')check('Food assumption disclosure '+width,/4\.500\.000/.test(v.text)&&/cơ cấu|phân bổ/i.test(v.text)&&/hiện vật/i.test(v.text),v.text);
    if(name==='finance'){const fonts=await page.$$eval('.formula-subnote',es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)));check('RC01 readable formula notes '+width,fonts.length===2&&fonts.every(v=>v>=14),fonts)}
    if(name==='products')check('New catalogue/prices '+width,/móc khóa/i.test(v.text)&&/su kem/i.test(v.text)&&['40.000','10.000','79.000','60.000','20.000'].every(x=>v.text.includes(x))&&/chưa.*xác nhận/i.test(v.text),v.text);
    for(const l of v.links){if(l.same){internal.add(l.url.split('#')[0]);check('Anchor '+name+' '+width+' '+l.url,l.anchor,null)}}
    if(['home','products','finance','team'].includes(name)){const path=`${dir}/reviewer-${sha.slice(0,7)}-${name}-${width}-full.png`;await page.screenshot({path,fullPage:true});report.screenshots.push(path)}
  }
}
for(const url of internal){const r=await page.goto(url,{waitUntil:'domcontentloaded'});const expected404=new URL(url).pathname==='/c01-no-such-route';check('Internal link '+url,expected404?r.status()===404:[200,304].includes(r.status()),r.status())}
await page.setViewport({width:375,height:812,deviceScaleFactor:1});await page.goto(base,{waitUntil:'networkidle0'});
await page.keyboard.press('Tab');check('Skip link focused',await page.evaluate(()=>document.activeElement.className.includes('skip-link')),null);
await page.keyboard.press('Enter');check('Skip link target',await page.evaluate(()=>document.activeElement.id==='main-content'),null);
await page.click('#mobile-nav-toggle');check('Menu opens',await page.$eval('#mobile-nav-toggle',e=>e.getAttribute('aria-expanded')==='true'),null);
await page.screenshot({path:`${dir}/reviewer-${sha.slice(0,7)}-menu-375.png`,fullPage:true});report.screenshots.push(`${dir}/reviewer-${sha.slice(0,7)}-menu-375.png`);
await page.focus('#mobile-nav-toggle');await page.keyboard.press('Tab');check('Menu keyboard enters links',await page.evaluate(()=>!!document.activeElement.closest('#mobile-nav-panel')),null);
await page.keyboard.press('Escape');check('Menu Escape/return focus',await page.evaluate(()=>document.querySelector('#mobile-nav-panel').hidden&&document.activeElement.id==='mobile-nav-toggle'),null);
await page.click('#mobile-nav-toggle');await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('#mobile-nav-panel a[href="/san-pham"]')]);check('Menu selected link closes',await page.evaluate(()=>location.pathname==='/san-pham'&&document.querySelector('#mobile-nav-panel').hidden),null);
await page.click('#mobile-nav-toggle');await page.setViewport({width:1440,height:1000});check('Menu desktop resize',await page.$eval('#mobile-nav-panel',e=>getComputedStyle(e).display==='none'),null);
await page.goto(base+'/minh-bach',{waitUntil:'networkidle0'});const summary=await page.$('main details summary');if(summary){await summary.focus();await page.keyboard.press('Enter');check('FAQ keyboard opens',await page.$eval('main details',e=>e.open),null);await page.keyboard.press('Space');check('FAQ keyboard closes',await page.$eval('main details',e=>!e.open),null)}
await page.setCacheEnabled(false);const icon=report.views[0].icon;const iconRes=await page.goto(base+icon,{waitUntil:'networkidle0'});check('Active favicon',iconRes.status()===200,{icon,status:iconRes.status()});
check('Unique titles',new Set(titles).size===7,titles);check('No browser errors',report.errors.length===0,report.errors);check('No broken requests',report.failedRequests.length===0,report.failedRequests);check('No external requests',report.externalRequests.length===0,report.externalRequests);
}finally{await browser.close()}
report.finishedAt=new Date().toISOString();report.failed=report.checks.filter(c=>!c.pass);fs.writeFileSync(`${dir}/reviewer-browser-${sha.slice(0,7)}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({sha,checks:report.checks.length,failed:report.failed,screenshots:report.screenshots.length}));process.exitCode=report.failed.length?1:0;
