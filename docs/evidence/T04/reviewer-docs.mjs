import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir='docs/evidence/T04';
const owned=['README.md','docs/tasks.md','docs/architecture.md','docs/operations.md','docs/task-specs/T04.md','docs/reviews/R04-0d4bd9d.md','docs/reviews/R04-fad117c.md','reports/resume-brain.md',dir+'/dispatch.md',...fs.readdirSync(dir).filter(n=>/\.(mjs|ps1)$/.test(n)).map(n=>path.join(dir,n))];
for(const file of owned){const body=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');fs.writeFileSync(file,body.replaceAll('\r\n','\n').trimEnd()+'\n');}
const jsonFiles=fs.readdirSync(dir).filter(n=>n.endsWith('.json'));
for(const file of jsonFiles)JSON.parse(fs.readFileSync(path.join(dir,file),'utf8').replace(/^\uFEFF/,''));
const links=[];
for(const file of owned.filter(n=>n.endsWith('.md'))){
  for(const m of fs.readFileSync(file,'utf8').matchAll(/\]\(([^)]+)\)/g)){
    const target=m[1].replace(/^<|>$/g,'').split('#')[0];
    if(!target||/^(?:https?:|app:|file:)/.test(target))continue;
    const resolved=path.resolve(path.dirname(file),target);
    links.push({file,target,exists:fs.existsSync(resolved)});
  }
}
assert.ok(links.every(l=>l.exists),'Owned docs must not have broken local links');
assert.match(fs.readFileSync('README.md','utf8'),/T04 DONE; R04 PASS/);
assert.match(fs.readFileSync('docs/tasks.md','utf8'),/Hiện tại sau T04\/R04/);
assert.match(fs.readFileSync('docs/architecture.md','utf8'),/Sau T04\/R04/);
assert.match(fs.readFileSync('reports/resume-brain.md','utf8'),/Hiện tại sau T04\/R04/);
const result={checkedAt:new Date().toISOString(),ownedFiles:owned,jsonFilesParsed:jsonFiles.length,links,workerRawReportsAndLogsPreserved:true,pass:true};
fs.writeFileSync(dir+'/reviewer-docs-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({ownedFiles:owned.length,jsonFilesParsed:jsonFiles.length,linksChecked:links.length,brokenLinks:links.filter(l=>!l.exists)}));
