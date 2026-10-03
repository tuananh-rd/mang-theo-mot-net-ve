import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const files=walk('src').filter(p=>/\.(css|astro)$/.test(p));
const definitions=new Set(files.flatMap(p=>Array.from(fs.readFileSync(p,'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g),m=>m[1])));
const unresolved=files.flatMap(p=>Array.from(fs.readFileSync(p,'utf8').matchAll(/var\((--[a-zA-Z0-9-]+)/g),m=>({file:p,token:m[1]})).filter(m=>!definitions.has(m.token)));
const out={sha,files:files.length,definitions:definitions.size,unresolved,pass:!unresolved.length};
fs.writeFileSync(`docs/evidence/C03/reviewer-tokens-${sha.slice(0,7)}.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out));process.exitCode=unresolved.length?1:0;
