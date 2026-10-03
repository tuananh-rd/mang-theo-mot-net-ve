// RV-C01-CLAUDE: measure /san-pham plan-table vs scroll container at several widths (read-only).
import {createRequire} from 'node:module';import fs from 'node:fs';
const p=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs')('puppeteer-core');
const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const pg=await b.newPage();const out=[];
for(const w of [768,900,1024,1280,1440]){await pg.setViewport({width:w,height:900});await pg.goto('http://127.0.0.1:4321/san-pham',{waitUntil:'networkidle0'});
out.push({w,...await pg.evaluate(()=>{const c=document.querySelector('.table-responsive'),t=c&&c.querySelector('table');const s=t&&t.querySelector('.col-status');return c?{visible:c.offsetParent!==null,containerW:c.clientWidth,tableW:t.scrollWidth,hiddenPx:t.scrollWidth-c.clientWidth,statusRight:s&&Math.round(s.getBoundingClientRect().right),containerRight:Math.round(c.getBoundingClientRect().right),tabindex:c.getAttribute('tabindex')}:null})});}
await b.close();fs.writeFileSync('docs/evidence/Claude-C01/claude-table-widths.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
