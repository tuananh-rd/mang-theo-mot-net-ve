// Kiểm trạng thái "đã mở nhận ủng hộ" trên bản build thử ngoài repo, phục vụ qua request interception (không mở server).
import {createRequire} from 'node:module';
import fs from 'node:fs'; import path from 'node:path';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer=req('puppeteer-core');
const [dist,out]=process.argv.slice(2); fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const res=[];
for(const w of [375,1440]){
  const p=await b.newPage(); await p.setRequestInterception(true);
  p.on('request',r=>{const u=new URL(r.url());if(u.host!=='test.local'){r.abort();return}let f=path.join(dist,decodeURIComponent(u.pathname));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){r.respond({status:404,body:'nf'});return}r.respond({status:200,contentType:types[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)})});
  await p.setViewport({width:w,height:900,isMobile:w<1024,hasTouch:w<1024});
  await p.goto('http://test.local/dong-hanh/',{waitUntil:'networkidle0'});
  const st=await p.evaluate(()=>({qr:document.querySelector('.donate-qr img')?.complete,acct:document.querySelector('.account-number')?.textContent,copy:document.querySelectorAll('.copy-btn').length,rows:[...document.querySelectorAll('.donor-table tbody tr')].map(r=>r.innerText.replace(/\s+/g,' ')),stats:[...document.querySelectorAll('.ledger-stats dd')].map(d=>d.textContent.trim()),search:!!document.getElementById('donor-search'),over:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
  await p.type('#donor-search','ẩn danh');
  const filtered=await p.evaluate(()=>[...document.querySelectorAll('.donor-table tbody tr')].filter(r=>!r.hidden).length);
  await p.evaluate(()=>{document.getElementById('donor-search').value='';document.getElementById('donor-search').dispatchEvent(new Event('input'))});
  await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,30)))}window.scrollTo({top:0,behavior:'instant'})});
  await new Promise(r=>setTimeout(r,900));
  await p.addStyleTag({content:'.site-header{position:relative !important}'});
  await p.screenshot({path:`${out}/donate-active-${w}-full.png`,fullPage:true});
  await p.goto('http://test.local/',{waitUntil:'networkidle0'});
  const home=await p.evaluate(()=>[...document.querySelectorAll('.donate-stats dd')].map(d=>d.textContent.trim()));
  res.push({w,...st,filtered,home});
  await p.close();
}
await b.close();
fs.writeFileSync(`${out}/donate-active-check.json`,JSON.stringify(res,null,1));
console.log(JSON.stringify(res,null,1));
