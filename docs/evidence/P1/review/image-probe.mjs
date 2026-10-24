import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const prior=JSON.parse(fs.readFileSync('docs/evidence/P1/review/original-image.json','utf8').replace(/^\uFEFF/,''));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(prior.source),asset='public/images/san-pham/moc-khoa-mau-chu-du-an.webp',webp=fs.readFileSync(asset);
assert.equal(hash(source).toUpperCase(),prior.sha256.toUpperCase(),'original changed');assert.equal(webp.toString('ascii',0,4),'RIFF');assert.equal(webp.toString('ascii',8,12),'WEBP');
const chunks=[];let dimensions;
for(let offset=12;offset+8<=webp.length;){const type=webp.toString('ascii',offset,offset+4),bytes=webp.readUInt32LE(offset+4),start=offset+8;chunks.push({type,bytes});if(type==='VP8 ')dimensions={width:webp.readUInt16LE(start+6)&0x3fff,height:webp.readUInt16LE(start+8)&0x3fff};if(type==='VP8X')dimensions={width:webp.readUIntLE(start+4,3)+1,height:webp.readUIntLE(start+7,3)+1};if(type==='VP8L'){const bits=webp.readUInt32LE(start+1);dimensions={width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}offset=start+bytes+(bytes%2);}
assert.ok(!chunks.some(c=>['EXIF','XMP ','ICCP'].includes(c.type)),'metadata remains');assert.equal(dimensions.width,466);assert.equal(dimensions.height,622);
const result={at:new Date().toISOString(),originalUnchanged:true,originalSha256:hash(source),originalBytes:source.length,asset,assetSha256:hash(webp),bytes:webp.length,dimensions,chunks,metadataAbsent:true,method:'Independent RIFF chunk inspection and SHA256; original was visually inspected. Checks EXIF/XMP/ICC absence and original full-frame dimensions; no AI edit or conversion performed by reviewer.'};fs.writeFileSync('docs/evidence/P1/review/image-review.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
