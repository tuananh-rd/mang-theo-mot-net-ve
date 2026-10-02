import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve';
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)])}
const files=walk(path.join(root,'dist'));
const patterns={rawDocument:/\.docx|docs[\\/]source|de-xuat-du-an/i,emailAddress:/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,phoneAction:/tel:|mailto:/i,credentials:/[?&]key=|AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY/i,forms:/<form(?:\s|>)/i,unconfirmedSale:/Chưa mở bán chính thức|Hiện tại sản phẩm chưa mở bán/i};
const matches=[];
for(const file of files){const body=fs.readFileSync(file,'utf8');for(const [label,re] of Object.entries(patterns))if(re.test(body))matches.push({file:path.relative(root,file),label});}
const source=path.join(root,'docs/source/de-xuat-du-an.docx');
const result={sha,checkedAt:new Date().toISOString(),files:files.map(file=>({path:path.relative(root,file),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')})),matches,rawSourceHash:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),rawSourceTracked:execFileSync('git',['ls-files','docs/source'],{cwd:root,encoding:'utf8'}).trim(),appWorkingDiff:execFileSync('git',['diff','--name-only','HEAD','--','src','package.json','package-lock.json','astro.config.mjs','tsconfig.json'],{cwd:root,encoding:'utf8'}).trim(),diffNames:execFileSync('git',['diff','--name-only','ef102c8c1908f1dcd843d8d9f6741848dcb43d63..'+sha],{cwd:root,encoding:'utf8'}).trim().split('\n')};
const file=path.join(root,'docs/evidence/T01/reviewer-audit-'+sha.slice(0,7)+'.json');fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(JSON.stringify({file,...result},null,2));

