// RV-C02-CLAUDE: read-only. Compare current dist files, HTTP bodies from :4322, and RC02 reviewer-serve expectations.
import fs from 'node:fs';import crypto from 'node:crypto';
const rc=JSON.parse(fs.readFileSync('docs/evidence/C02/reviewer-serve-221eafa.json','utf8'));
const h=b=>crypto.createHash('sha256').update(b).digest('hex');
const out={time:new Date().toISOString(),base:'http://127.0.0.1:4322',rc02Sha:rc.sha,checks:[]};
for(const c of rc.checks){const p=c.file.split('\\').join('/');const dist=fs.existsSync(p)?h(fs.readFileSync(p)):null;
 const r=await fetch(out.base+c.urlPath,{cache:'no-store'});const http=h(Buffer.from(await r.arrayBuffer()));
 out.checks.push({file:c.file,url:c.urlPath,status:r.status,rc02:c.expected,dist,http,pass:dist===c.expected&&http===c.expected&&r.status===c.expectedStatus});}
out.total=out.checks.length;out.passed=out.checks.filter(c=>c.pass).length;
fs.writeFileSync('docs/evidence/Claude-C02/claude-hash.json',JSON.stringify(out,null,2));console.log(out.passed+'/'+out.total,out.checks.filter(c=>!c.pass));
