import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dir='docs/evidence/T03';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)])}
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
const patterns={rawDocument:/\.docx|docs[\\/]source|de-xuat-du-an/i,emailAddress:/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,phoneAction:/tel:|mailto:/i,credentials:/[?&]key=|AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY/i,forms:/<form(?:\s|>)/i,unconfirmedSale:/Chưa mở bán chính thức|Hiện tại sản phẩm chưa mở bán/i,internalCopy:/giá trị thực tế giữ null|không tạo nhật ký giả|website không tạo danh sách nhân sự giả|tồn kho thực tế hiện chưa phát sinh/i,privateMembers:/Tuấn Anh|Chí Trung|Như Huy|Bình Trọng|Anh Khoa|Ngọc Khoa|Hiển Lân/i};
const files=walk(path.join(root,'dist'));const matches=[];
for(const file of files){const body=fs.readFileSync(file,'utf8');for(const [label,re] of Object.entries(patterns))if(re.test(body))matches.push({file:path.relative(root,file),label});}
const source='docs/source/de-xuat-du-an.docx';
const {PRODUCTS,CAMPAIGN_PROJECT,FINANCE_OVERVIEW}=await import('../../../src/data/campaign.ts');
const result={sha,checkedAt:new Date().toISOString(),files:files.map(file=>({path:path.relative(root,file),bytes:fs.statSync(file).size,sha256:hash(file)})),matches,rawSourceHash:hash(source),rawSourceTracked:execFileSync('git',['ls-files','docs/source'],{encoding:'utf8'}).trim(),appWorkingDiff:execFileSync('git',['diff','--name-only','HEAD','--','src','public','package.json','package-lock.json','astro.config.mjs','tsconfig.json'],{encoding:'utf8'}).trim(),diffNames:execFileSync('git',['diff','--name-only','da890a212e029249e29545aa1606e71027034674..'+sha],{encoding:'utf8'}).trim().split('\n'),packageHash:hash('package.json'),lockfileHash:hash('package-lock.json'),claudeReportHash:hash('reports/ui-review-claude.md'),screenshots:walk(dir).filter(f=>f.includes('reviewer-'+sha.slice(0,7))&&f.endsWith('.png')).map(file=>{const b=fs.readFileSync(file);return {path:file,bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:hash(file)}})};
result.products=PRODUCTS.map(p=>({name:p.name,referencePrice:p.referencePrice,plannedQuantity:p.plannedQuantity,actualStock:p.actualStock,saleStatus:p.saleStatus,assetId:p.assetId,originVerification:p.originVerification}));
result.unknownActualPreserved=PRODUCTS.length===3&&PRODUCTS.every(p=>p.actualStock===null&&p.saleStatus==='unconfirmed'&&p.assetId===null&&p.referencePrice.kind==='planned'&&p.referencePrice.verification==='unverified'&&p.referencePrice.publicApproval==='pending'&&p.referencePrice.updatedAt===null)&&CAMPAIGN_PROJECT.executionStatus==='unknown'&&FINANCE_OVERVIEW.actualCashBalance===null&&FINANCE_OVERVIEW.actualInKindLedger===null;
result.ciInputsMatchT01=result.packageHash==='d973d845f877c0f515cb8ccc33cb971f0eb003ba17dc2157d7ff189d91f742c9'&&result.lockfileHash==='ff3aa78d6644ec76e50748e34a2f502b578be8b80ed52391a7d7b9f03d487058';
fs.writeFileSync(dir+'/reviewer-audit-'+sha.slice(0,7)+'.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({sha,files:result.files.length,matches,rawSourceHash:result.rawSourceHash,rawSourceTracked:result.rawSourceTracked,appWorkingDiff:result.appWorkingDiff,claudeReportHash:result.claudeReportHash,screenshots:result.screenshots.length},null,2));
if(matches.length||result.rawSourceTracked||result.appWorkingDiff||!result.unknownActualPreserved||!result.ciInputsMatchT01||result.rawSourceHash!=='83c038c04ad7cff87f616c98529a1df788a2467451b83d95e890bfba0f4307d5'||result.claudeReportHash!=='9a7a438e4b53204b1b71ea1ca1bb774c14cc36f208d0f706a9461823cb344b6b')process.exitCode=1;
