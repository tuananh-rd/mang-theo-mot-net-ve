// C16 khảo sát trang tham khảo (dữ liệu không tin cậy, chỉ đọc). Dùng: node ref-survey.mjs <outDir> [urlsJson]
import {createRequire} from 'node:module';
import fs from 'node:fs';
const req=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/x.mjs');
const puppeteer=req('puppeteer-core');
const outDir=process.argv[2];
const shots=outDir+'/ref-screens'; fs.mkdirSync(shots,{recursive:true});
const origin='https://nangbuoctuoitho.org';
const extra=process.argv[3]?JSON.parse(process.argv[3]):[];
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const out={browser:await b.version(),startedAt:new Date().toISOString(),pages:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const slug=u=>u.replace(origin,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home';
async function survey(url,vp,name){
  const p=await b.newPage();
  await p.setViewport({width:vp.w,height:vp.h,isMobile:vp.w<768,hasTouch:vp.w<768});
  const t0=new Date().toISOString();
  let status=null,err=null;
  try{const r=await p.goto(url,{waitUntil:'networkidle2',timeout:45000});status=r&&r.status()}catch(e){err=String(e).slice(0,200)}
  await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60))}window.scrollTo({top:0,behavior:'instant'})}).catch(()=>{});
  await wait(1200);
  const info=await p.evaluate(()=>{
    const cs=e=>getComputedStyle(e);
    const body=document.body;
    const fam=new Map(),bg=new Map(),fg=new Map();
    document.querySelectorAll('body *').forEach(e=>{
      if(!e.offsetParent&&cs(e).position!=='fixed')return;
      const s=cs(e);
      const t=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(t){fg.set(s.color,(fg.get(s.color)||0)+1);const f=s.fontFamily.split(',')[0];fam.set(f,(fam.get(f)||0)+1)}
      const r=e.getBoundingClientRect();
      if(s.backgroundColor!=='rgba(0, 0, 0, 0)'&&r.width*r.height>20000){bg.set(s.backgroundColor,(bg.get(s.backgroundColor)||0)+Math.round(r.width*r.height/1000))}
    });
    const top=m=>[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
    const heads=[...document.querySelectorAll('h1,h2,h3')].slice(0,30).map(h=>({tag:h.tagName,text:h.textContent.trim().replace(/\s+/g,' ').slice(0,90),size:cs(h).fontSize,weight:cs(h).fontWeight,color:cs(h).color,family:cs(h).fontFamily.split(',')[0]}));
    const buttons=[...document.querySelectorAll('a,button')].filter(e=>/btn|button|cta|donate|dong-gop|ung-ho/i.test(e.className+e.getAttribute('href'))).slice(0,10).map(e=>{const s=cs(e);return {text:e.textContent.trim().replace(/\s+/g,' ').slice(0,40),bg:s.backgroundColor,color:s.color,radius:s.borderRadius,padding:s.padding,size:s.fontSize,weight:s.fontWeight}});
    const nav=[...document.querySelectorAll('header a, nav a')].slice(0,30).map(a=>({t:a.textContent.trim().replace(/\s+/g,' ').slice(0,40),h:a.getAttribute('href')}));
    const secs=[...document.querySelectorAll('main > *, body > section, body > div > section, section')].slice(0,40).map(e=>{const r=e.getBoundingClientRect();const s=cs(e);return {tag:e.tagName.toLowerCase(),cls:String(e.className).slice(0,50),bg:s.backgroundColor,top:Math.round(r.top+scrollY),h:Math.round(r.height),pad:s.paddingTop+'/'+s.paddingBottom,head:(e.querySelector('h1,h2,h3')||{}).textContent?.trim().replace(/\s+/g,' ').slice(0,60)||null}});
    const links=[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)))].slice(0,80);
    const root=cs(document.documentElement);
    return {title:document.title,docH:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-innerWidth,bodyBg:cs(body).backgroundColor,bodyColor:cs(body).color,bodyFont:cs(body).fontFamily,bodySize:cs(body).fontSize,bodyLH:cs(body).lineHeight,fonts:top(fam),textColors:top(fg),bgAreas:top(bg),heads,buttons,nav,secs,links,imgs:document.images.length,container:(()=>{const c=document.querySelector('.container,[class*=container],main>div');return c?{w:c.getBoundingClientRect().width,maxW:cs(c).maxWidth}:null})()};
  }).catch(e=>({evalError:String(e)}));
  const f=`${shots}/${name}-${vp.w}`;
  await p.screenshot({path:f+'-fold.png'}).catch(()=>{});
  await p.screenshot({path:f+'-full.png',fullPage:true}).catch(()=>{});
  await p.close();
  return {url,viewport:vp,at:t0,status,err,...info};
}
const urls=[origin+'/',...extra];
for(const u of urls){
  for(const vp of [{w:1440,h:1000},{w:375,h:812}]){
    const r=await survey(u,vp,slug(u));
    out.pages.push(r);
    console.log(u,vp.w,r.status,r.err||'',r.docH,r.title);
  }
}
await b.close();
out.finishedAt=new Date().toISOString();
fs.writeFileSync(outDir+'/ref-survey'+(extra.length?'-2':'')+'.json',JSON.stringify(out,null,1));
