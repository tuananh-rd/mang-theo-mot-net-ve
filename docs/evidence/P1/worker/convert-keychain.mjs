import {createRequire} from 'node:module';const sharp=createRequire(import.meta.url)('file:///C:/Users/tuana/orca/workspaces/mang-theo-mot-net-ve-atelier/public-owner-fixes/node_modules/sharp/dist/index.cjs'.replace('file:///',''));
import fs from 'node:fs';import crypto from 'node:crypto';
const src='D:/Downloads/materials web mtmnv/ảnh móc khóa.jpg';
const out='C:/Users/tuana/orca/workspaces/mang-theo-mot-net-ve-atelier/public-owner-fixes/public/images/san-pham/moc-khoa-mau-chu-du-an.webp';
const m=await sharp(src).metadata();
console.log('original',m.width,m.height,m.format,'orientation',m.orientation,'exif',!!m.exif,'xmp',!!m.xmp,'icc',!!m.icc);
const info=await sharp(src).rotate().webp({quality:84,effort:6}).toFile(out); // không withMetadata => xóa EXIF/XMP/ICC; không resize/upscale
const om=await sharp(out).metadata();
const h=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
console.log(JSON.stringify({outBytes:info.size,w:info.width,h:info.height,exif:!!om.exif,xmp:!!om.xmp,icc:!!om.icc,srcBytes:fs.statSync(src).size,srcSha:h(src),outSha:h(out)}));
