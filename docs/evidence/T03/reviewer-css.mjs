import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const definitions=new Set();
for(const file of execFileSync('rg',['--files','src/styles'],{encoding:'utf8'}).trim().split(/\r?\n/)){
  for(const match of fs.readFileSync(file,'utf8').matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g))definitions.add(match[1]);
}
const missing=[];
for(const file of ['src/pages/minh-bach.astro','src/pages/dong-hanh.astro']){
  const content=fs.readFileSync(file,'utf8'),local=new Set([...content.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map(match=>match[1]));
  for(const match of content.matchAll(/var\((--[a-zA-Z0-9_-]+)\s*\)/g))if(!definitions.has(match[1])&&!local.has(match[1]))missing.push({file,variable:match[1]});
}
const result={sha,checkedAt:new Date().toISOString(),scope:'T03 pages, declared shared style tokens, vars without fallback',missing:[...new Map(missing.map(item=>[JSON.stringify(item),item])).values()]};
fs.writeFileSync('docs/evidence/T03/reviewer-css-'+sha.slice(0,7)+'.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));if(missing.length)process.exitCode=1;
