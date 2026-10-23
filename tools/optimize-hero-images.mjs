#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = process.argv[2];
if (!sourceDir || !path.isAbsolute(sourceDir)) {
  throw new Error('Pass the absolute, read-only source image directory as the first argument.');
}

const images = [
  { key: 'du-an', source: '03_Các em tập văn nghệ.jpg', widths: [480, 800, 1200], focal: '55% 45%', alt: 'Hai em nhỏ đang múa trong một không gian sinh hoạt có mái che; ảnh do chủ dự án cung cấp.' },
  { key: 'san-pham', source: '10_Hai em bên giàn hoa.jpg', widths: [480, 730], focal: '50% 40%', alt: 'Hai em nhỏ đứng bên giàn hoa; ảnh do chủ dự án cung cấp.' },
  { key: 'nhat-ky', source: 'nhay_nhot.jpg', widths: [480, 800, 1200], focal: '55% 55%', alt: 'Một nhóm người đang nhảy trong không gian sinh hoạt; ảnh do chủ dự án cung cấp.' },
  { key: 'minh-bach', source: '09_Em hái hoa bên rổ xanh.jpg', widths: [480, 800, 1153], focal: '50% 80%', cropAspect: 4 / 3, alt: 'Bàn tay đang hái hoa cạnh một chiếc rổ xanh; ảnh do chủ dự án cung cấp.' },
  { key: 'dong-hanh', source: '1792465511013_6949534732441527363_g2893497410154641941_f00018dd520788606057b4a3ae2f54b8.jpg', widths: [480, 800, 1200], focal: '50% 45%', alt: 'Hai người cùng đẩy một chiếc xe và mỉm cười; ảnh do chủ dự án cung cấp.' },
  { key: 've-nhom', source: '13_Sinh hoạt với micro.jpg', widths: [480, 800, 1200], focal: '55% 45%', alt: 'Một em nhỏ cầm micro trong không gian sinh hoạt; ảnh do chủ dự án cung cấp.' },
];

const outDir = path.join(root, 'public', 'images', 'trang');
await fs.mkdir(outDir, { recursive: true });
const manifest = [];
for (const image of images) {
  const input = path.join(sourceDir, image.source);
  const rotated = await sharp(input).rotate().toBuffer();
  const metadata = await sharp(rotated).metadata();
  const sourceWidth = metadata.width;
  const sourceHeight = metadata.height;
  for (const width of image.widths.filter((candidate) => candidate <= sourceWidth)) {
    const output = path.join(outDir, `${image.key}-${width}.webp`);
    let pipeline = sharp(rotated);
    if (image.cropAspect) {
      const cropHeight = Math.floor(sourceWidth / image.cropAspect);
      const [, focalY] = image.focal.split(' ').map((part) => Number.parseFloat(part) / 100);
      const top = Math.round(Math.max(0, sourceHeight - cropHeight) * focalY);
      pipeline = pipeline.extract({ left: 0, top, width: sourceWidth, height: cropHeight });
    }
    await pipeline.resize({ width, withoutEnlargement: true }).webp({ quality: 75 }).toFile(output);
    const outputMetadata = await sharp(output).metadata();
    const bytes = (await fs.stat(output)).size;
    manifest.push({
      path: `/images/trang/${image.key}-${width}.webp`,
      source: image.source,
      width: outputMetadata.width,
      height: outputMetadata.height,
      bytes,
      sha256: await hashFile(output),
      alt: image.alt,
      focal: image.focal,
      rights: 'Chủ dự án cung cấp; chưa xác minh độc lập sự đồng ý của người trong ảnh.',
      metadata: Object.keys(outputMetadata).filter((key) => ['exif', 'icc', 'iptc', 'xmp'].includes(key) && outputMetadata[key]),
    });
  }
}
await fs.writeFile(path.join(root, 'docs', 'media-registry.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Optimized ${manifest.length} hero images into ${path.relative(root, outDir)}.`);

async function hashFile(file) {
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256');
  hash.update(await fs.readFile(file));
  return hash.digest('hex');
}
