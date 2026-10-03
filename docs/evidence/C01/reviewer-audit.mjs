import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const report={sha,time:new Date().toISOString(),checks:[],files:[]};
const check=(name,pass,observed)=>report.checks.push({name,pass:!!pass,observed});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const list=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(p,e.name)):[path.join(p,e.name)]);
const oracle=JSON.parse(fs.readFileSync('docs/evidence/C01/source-calculations.json','utf8'));
check('Source group arithmetic',oracle.expenseGroups.every(g=>g.amounts.reduce((s,v)=>s+v,0)===g.total),oracle.expenseGroups);
check('Source total arithmetic',oracle.expenseGroups.reduce((s,g)=>s+g.total,0)===4935000,null);
check('Source revenue/balance arithmetic',30*40000+100*10000===2200000&&2200000+4500000===6700000&&6700000-4935000===1765000,null);
const expected={'logo_option5_horizontal.png':'e078e7ea7bd8debae74d2c573fe4391fd55aee57a167ca4eb63534b17ee56db9','logo_lang_kinh_2048.png':'06f63ac9d41c079827d794b13ffec468ea30be7b818755b4ba96bc819f7facbc'};
for(const [name,value]of Object.entries(expected)){const p=path.join('public/images',name);check('Exact supplied asset '+name,fs.existsSync(p)&&hash(p)===value,fs.existsSync(p)?hash(p):null)}
const files=list('dist');
const badNames=files.filter(p=>/\.(pdf|docx|json|map|log|env|pem)$/i.test(p)||/source|handoff|proposal|receipt/i.test(p));check('No raw/private document files',badNames.length===0,badNames);
for(const p of files){const bytes=fs.readFileSync(p);report.files.push({path:p,bytes:bytes.length,sha256:hash(p)});if(!/\.(html|css|js|svg)$/i.test(p))continue;const text=bytes.toString('utf8');check('Bundle privacy '+p,!/D:\\Downloads|de-xuat-du-an|MANG THEO MỘT NÉT VẼ\.pdf|Nguyễn Chí Trung|11\/17|khuyết tật|AIza[\w-]{20}|gh[pousr]_[\w]{20}|BEGIN (?:RSA |EC )?PRIVATE KEY/i.test(text),null);if(p.endsWith('.html')){check('No stale catalogue '+p,!/túi bút|túi vải|3\.120\.000|2\.900\.000|chưa hòa vốn/i.test(text),null);check('Preview robots '+p,/name="robots" content="noindex, nofollow"/.test(text),null)}}
check('Seven emitted HTML pages',files.filter(p=>p.endsWith('.html')).length===7,files.filter(p=>p.endsWith('.html')));
const appDiff=execFileSync('git',['status','--porcelain','--untracked-files=all','--','src','public','tests','package.json','package-lock.json','astro.config.mjs','tsconfig.json'],{encoding:'utf8'}).trim();check('App committed clean',!appDiff,appDiff);
const changes=execFileSync('git',['diff','--name-only','113069636c653cb7bbb255c33d681cbbbd940b19',sha],{encoding:'utf8'}).trim().split('\n').filter(Boolean);check('Worker changed only app/assets/tests',changes.every(p=>/^(src\/|public\/|tests\/)/.test(p)),changes);
report.failed=report.checks.filter(c=>!c.pass);fs.writeFileSync(`docs/evidence/C01/reviewer-audit-${sha.slice(0,7)}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({sha,checks:report.checks.length,failed:report.failed,distFiles:files.length}));process.exitCode=report.failed.length?1:0;
