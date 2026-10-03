import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const list=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(p,e.name)):[path.join(p,e.name)]);
const report={sha,time:new Date().toISOString(),checks:[]};
for(const file of list('dist')){
  let urlPath='/'+file.replaceAll('\\','/').replace(/^dist\//,'');
  const expectedStatus=urlPath==='/404.html'?404:200;
  if(urlPath==='/404.html')urlPath='/c01-no-such-route';
  else if(urlPath.endsWith('/index.html'))urlPath=urlPath.slice(0,-11)||'/';
  const r=await fetch('http://127.0.0.1:4321'+urlPath,{headers:{'Cache-Control':'no-cache'}});
  const actual=digest(Buffer.from(await r.arrayBuffer())),expected=digest(fs.readFileSync(file));
  report.checks.push({file,urlPath,status:r.status,expectedStatus,expected,actual,pass:r.status===expectedStatus&&actual===expected});
}
report.failed=report.checks.filter(c=>!c.pass);fs.writeFileSync(`docs/evidence/C01/reviewer-serve-${sha.slice(0,7)}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({sha,checks:report.checks.length,failed:report.failed}));process.exitCode=report.failed.length?1:0;
