import {createRequire} from 'node:module';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const browser=await req('puppeteer-core').launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const dir='docs/evidence/C01-ui',base='http://127.0.0.1:4322';
const out={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks:[],measurements:[]};
const check=(name,pass,value)=>out.checks.push({name,pass:!!pass,value});
try{
const p=await browser.newPage();
for(const w of [375,768,900,1024,1440]){
 await p.setViewport({width:w,height:900,isMobile:w<1024,hasTouch:w<1024,deviceScaleFactor:1});
 await p.goto(base+'/san-pham',{waitUntil:'networkidle0'});
 const m=await p.evaluate(()=>{
  const visible=e=>e&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden';
  const table=document.querySelector('.plan-table');
  const container=document.querySelector('.table-responsive');
  const header=document.querySelector('header');
  const brands=[...document.querySelectorAll('header .brand-link,footer .footer-brand-header')].filter(visible).map(e=>({text:e.innerText,images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height}))}));
  return {scrollW:document.documentElement.scrollWidth,vw:innerWidth,brands,tableVisible:visible(table),tableW:table?.getBoundingClientRect().width,containerW:container?.getBoundingClientRect().width,headerH:header.getBoundingClientRect().height,body:document.body.innerText};
 });
 out.measurements.push({w,...m,body:undefined});
 check('No horizontal overflow '+w,m.scrollW<=w,m.scrollW);
 check('Brand name readable as HTML '+w,m.brands.length>=2&&m.brands.every(b=>b.text.includes('Lăng Kính')),m.brands);
 check('Brand icons loaded and square '+w,m.brands.every(b=>b.images.length&&b.images.every(i=>i.loaded&&Math.abs(i.w-i.h)<1)),m.brands);
 check('Plan table breakpoint '+w,w<1024?!m.tableVisible:m.tableVisible,m.tableVisible);
 check('Desktop table fits '+w,!m.tableVisible||m.tableW<=m.containerW+1,{table:m.tableW,container:m.containerW});
 check('Sale status still disclosed '+w,m.body.includes('Chờ xác nhận')||m.body.includes('Chưa mở bán'),null);
 if([768,900,1024].includes(w))await p.screenshot({path:`${dir}/reviewer-products-${w}-full.png`,fullPage:true});
 if(w===375)await p.screenshot({path:`${dir}/reviewer-brand-375.png`});
}
await p.setViewport({width:375,height:812,isMobile:true,hasTouch:true});
await p.goto(base+'/minh-bach',{waitUntil:'networkidle0'});
const finance=await p.evaluate(()=>({height:document.documentElement.scrollHeight,text:document.body.innerText}));
check('Finance mobile height reduced >=15%',finance.height<=12366*.85,{old:12366,current:finance.height,reduction:1-finance.height/12366});
check('Financial totals unchanged', ['4.935.000','6.700.000','1.765.000'].every(s=>finance.text.includes(s)),null);
check('Brand proper name retained',!finance.text.includes('móc khóa lăng kính'),null);
check('No internal instruction in public copy',!finance.text.includes('không public số trẻ'),null);
const iconLinks=await p.evaluate(()=>[...document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]')].map(e=>({rel:e.rel,href:e.href})));
for(const icon of iconLinks){const size=await p.evaluate(async href=>{const img=new Image();img.src=href;await img.decode();return [img.naturalWidth,img.naturalHeight];},icon.href);check('Icon dimensions '+icon.rel,size.every(v=>v===(icon.rel==='icon'?32:180)),size);}
check('Both favicon and touch icon configured',iconLinks.some(i=>i.rel==='icon')&&iconLinks.some(i=>i.rel==='apple-touch-icon'),iconLinks);
await p.goto(base+'/',{waitUntil:'networkidle0'});
check('Home proper name retained',!(await p.evaluate(()=>document.body.innerText)).includes('móc khóa lăng kính'),null);
}finally{await browser.close();}
out.failed=out.checks.filter(c=>!c.pass);fs.writeFileSync(`${dir}/reviewer-targeted.json`,JSON.stringify(out,null,2));
console.log(JSON.stringify({sha:out.sha,checks:out.checks.length,failed:out.failed}));process.exitCode=out.failed.length?1:0;
