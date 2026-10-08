// C07 audit: dist files, served == dist, không dữ liệu riêng/cũ/liên hệ giả trong bundle.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dist='dist', base='http://127.0.0.1:4322';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(dist).map(f=>f.split(path.sep).join('/'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const out={headSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),at:new Date().toISOString(),files:[],checks:[]};
const check=(name,pass,detail)=>out.checks.push({name,pass:!!pass,detail});
for(const f of files){
  const buf=fs.readFileSync(f);const rel=f.slice(dist.length);
  let url=rel.replace(/index\.html$/,'');
  const res=await fetch(base+url);const body=Buffer.from(await res.arrayBuffer());
  out.files.push({file:rel,bytes:buf.length,sha256:sha(buf),served:res.status,servedMatch:sha(body)===sha(buf)});
}
check('served bytes equal dist for every file', out.files.every(f=>f.servedMatch), out.files.filter(f=>!f.servedMatch).map(f=>f.file));
const text=files.filter(f=>/\.(html|css|js|svg|json|txt|xml)$/.test(f)).map(f=>[f,fs.readFileSync(f,'utf8')]);
const forbidden={
  memberNames:/Chí Trung|Ngọc Khoa|Như Huy|Bình Trọng|Anh Khoa|Hiển Lân|Tuấn Anh|Hà Phúc/,
  sensitiveCounts:/17 trẻ|6\/17|06 trẻ|6 em|khuyết tật|19 người thụ hưởng|35 lượt/,
  oldFinance:/4\.935\.000|4\.500\.000|550\.000|1\.765\.000|6\.700\.000/,
  contact:/[\w.+-]+@[\w-]+\.[\w.]+|(?:\+84|0)\d{9,10}|facebook\.com|zalo|momo/i,
  rawSource:/Mang_Theo_Mot_Net_Ve_Final|\.pdf|proposal-pages|materials/i,
  unapprovedAssets:/a0(6|7|8|9)\.|a1(0|1)\./,
  orderOrPayment:/<form|type="submit"|thanh toán ngay|đặt hàng ngay/i,
  foodFundraising:/set đồ ăn|nem|su kem|thực phẩm|đồ ăn/i,
};
for(const [k,re] of Object.entries(forbidden)){
  const hits=text.flatMap(([f,t])=>{const m=t.match(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'));return m?[{f,m:[...new Set(m)].slice(0,5)}]:[]});
  check(`bundle has no ${k}`, hits.length===0, hits);
}
check('no A06-A11 files in dist', !files.some(f=>/a0[6-9]|a1[01]/.test(path.basename(f))), files.filter(f=>/a0[6-9]|a1[01]/.test(path.basename(f))));
const html=text.filter(([f])=>f.endsWith('.html'));
check('every HTML has noindex,nofollow', html.every(([,t])=>t.includes('content="noindex, nofollow"')), html.length);
const req=['2.990.000đ','1.860.000đ','1.130.000đ'];
const fin=fs.readFileSync('dist/minh-bach/index.html','utf8');
check('transparency page shows required planned figures', req.every(v=>fin.includes(v)), req.filter(v=>!fin.includes(v)));
const prod=fs.readFileSync('dist/san-pham/index.html','utf8');
const donate=fs.readFileSync('dist/dong-hanh/index.html','utf8');
check('donation pending: no QR image, account number or copy button in bundle', !/class="qr-img"|class="account-number"|class="copy-btn"/.test(donate)&&donate.includes('qr-placeholder')&&!files.some(f=>/ung-ho/.test(f)), null);
check('donation ledger empty: no donor rows', !/class="[^"]*donor-table/.test(donate)&&donate.includes('ledger-empty'), null);
check('no unit/purchase prices on public pages', !html.some(([,t])=>/\d+ × [\d.]+đ/.test(t.replace(/<[^>]+>/g,' '))), null);
const internal=/trang \d+|đề xuất Final|chỉ tiêu học phần|SSG105|lượt tiếp cận|phấn đấu 4\.000|2\.070\.000|740\.000|2\.470\.000|5\.470\.000|7\.150\.000|bịt mắt|giảng viên/i;
const internalHits=html.flatMap(([f,t])=>{const m=t.replace(/<[^>]+>/g,' ').match(new RegExp(internal.source,'gi'));return m?[{f,m:[...new Set(m)].slice(0,5)}]:[]});
check('no course-report material on public pages', internalHits.length===0, internalHits);
check('actual spend and delivery shown as unconfirmed', (fin.match(/Chưa xác nhận/g)||[]).length>=2, (fin.match(/Chưa xác nhận/g)||[]).length);
out.summary={files:files.length,total:out.checks.length,pass:out.checks.filter(c=>c.pass).length,fail:out.checks.filter(c=>!c.pass).map(c=>c.name)};
fs.writeFileSync('docs/evidence/C07/claude/audit-bundle.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(out.summary,null,1));
