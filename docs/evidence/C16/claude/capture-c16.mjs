// C16 chụp ảnh preview: node capture-c16.mjs <outDir> <repo> [widths=1440,375] [routeNames=all]
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer=req('puppeteer-core');
const [outDir,repo,widthsArg,namesArg]=process.argv.slice(2);
const widths=(widthsArg||'1440,375').split(',').map(Number);
const only=namesArg&&namesArg!=='all'?namesArg.split(','):null;
fs.mkdirSync(outDir,{recursive:true});
const base=process.env.C16_BASE||'http://127.0.0.1:4322';
const routes=[['home','/'],['project','/du-an/mang-theo-mot-net-ve'],['products','/san-pham'],['finance','/minh-bach'],['team','/ve-nhom'],['support','/dong-hanh'],['journal','/nhat-ky'],['journal-detail-1','/nhat-ky/ke-hoach-bon-goc-choi'],['journal-detail-2','/nhat-ky/gioi-thieu-qua-luu-niem-gay-quy'],['product-detail-1','/san-pham/chuon-chuon-tre-kem-de'],['product-detail-2','/san-pham/moc-khoa'],['not-found','/khong-ton-tai-c16']];
const git=(...a)=>execFileSync('git',['-C',repo,...a],{encoding:'utf8'}).trim();
const meta={headSha:git('rev-parse','HEAD'),appDirty:git('status','--porcelain','--','src','public','tools','tests','package.json','package-lock.json','astro.config.mjs'),at:new Date().toISOString(),shots:[]};
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
meta.browser=await b.version();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(const [name,path] of routes){
  if(only&&!only.includes(name))continue;
  for(const w of widths){
    const p=await b.newPage();await p.setCacheEnabled(false);
    await p.setViewport({width:w,height:w<768?812:900,isMobile:w<768,hasTouch:w<768});
    const res=await p.goto(base+path,{waitUntil:'networkidle0'});
    await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=300){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,40))}await Promise.all([...document.images].map(i=>i.complete?i.decode().catch(()=>{}):new Promise(r=>{i.onload=i.onerror=r})));window.scrollTo({top:0,behavior:'instant'})});
    await wait(1400);
    await p.screenshot({path:`${outDir}/${name}-${w}-fold.png`});
    await p.addStyleTag({content:'.site-header{position:relative !important}.mobile-sticky-bar{position:static !important}'});
    const h=await p.evaluate(()=>document.documentElement.scrollHeight);
    if(h>7800){ // tránh ảnh quá lớn: chia khúc
      let i=0;for(let y=0;y<h;y+=3900){await p.screenshot({path:`${outDir}/${name}-${w}-full-p${++i}.png`,clip:{x:0,y,width:w,height:Math.min(3900,h-y)},captureBeyondViewport:true})}
    } else await p.screenshot({path:`${outDir}/${name}-${w}-full.png`,fullPage:true});
    meta.shots.push({name,path,w,status:res.status(),docH:h});
    await p.close();
  }
}
await b.close();
fs.writeFileSync(`${outDir}/capture-meta.json`,JSON.stringify(meta,null,1));
console.log('done',meta.shots.length);
