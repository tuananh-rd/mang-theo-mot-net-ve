import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'docs/media-registry.json'), 'utf8'));
const routes = [
  'src/pages/du-an/mang-theo-mot-net-ve.astro',
  'src/pages/san-pham.astro',
  'src/pages/nhat-ky/index.astro',
  'src/pages/minh-bach.astro',
  'src/pages/dong-hanh.astro',
  'src/pages/ve-nhom.astro',
];

async function filesUnder(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(file) : [file];
    }))).flat();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

test('six PageHero routes reference the six approved, optimized images', async () => {
  assert.equal(new Set(registry.map((item) => item.path.split('/').at(-1).split('-')[0])).size, 6);
  for (const route of routes) {
    const source = await fs.readFile(path.join(root, route), 'utf8');
    assert.match(source, /image=\{\{/);
    assert.match(source, /\/images\/trang\//);
  }
  const heroComponent = await fs.readFile(path.join(root, 'src/components/PageHero.astro'), 'utf8');
  assert.match(heroComponent, /alt=\{image\.alt\}/);
  assert.match(heroComponent, /width=\{image\.width\}/);
  assert.match(heroComponent, /height=\{image\.height\}/);
  assert.match(heroComponent, /loading="eager"/);
  assert.match(heroComponent, /\.page-hero-grid--compact-image \.page-hero-image\s*\{[^}]*max-width:\s*560px/s);
  assert.doesNotMatch(heroComponent, /\.page-hero-grid--compact-image \.page-hero-image\s*\{[^}]*display:\s*none/s);
  assert.match(heroComponent, /@media \(min-width:\s*1024px\)\s*\{[^}]*\.page-hero-grid--compact-image \.page-hero-main > :global\(\.btn\)[^}]*\{[^}]*width:\s*auto/s);
  assert.match(heroComponent, /\.page-hero-grid--with-image \.page-hero-image\s*\{[^}]*order:\s*-1;[^}]*max-width:\s*560px/s);
  assert.match(await fs.readFile(path.join(root, 'src/pages/san-pham.astro'), 'utf8'), /href="#preorder-heading"/);
  assert.equal(registry.length, 17);
  assert.ok(registry.every((item) => item.rights.includes('chưa xác minh')));
});

test('optimized hero assets match the registry, have no metadata, and stay within 800w budget', async () => {
  for (const item of registry) {
    assert.ok(item.alt.trim().length > 0);
    assert.match(item.alt, /ảnh do chủ dự án cung cấp/);
    assert.doesNotMatch(item.alt, /Mái ấm Thánh Tâm|Xuy Xá|Lăng Kính|sự kiện/i);
    assert.equal(path.extname(item.path), '.webp');
    const file = path.join(root, 'public', item.path.replace(/^\//, ''));
    const bytes = await fs.readFile(file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    assert.equal(bytes.length, item.bytes);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, item.width);
    assert.equal(metadata.height, item.height);
    for (const field of ['exif', 'icc', 'iptc', 'xmp']) assert.equal(metadata[field], undefined, `${item.path} retains ${field}`);
    if (item.width === 800) assert.ok(item.bytes <= 150 * 1024, `${item.path} is ${item.bytes} bytes`);
  }
});

test('no original JPG/PNG source assets are copied into the public build', async () => {
  for (const directory of ['public', 'dist']) {
    const originals = (await filesUnder(path.join(root, directory))).filter((file) => /\.(jpe?g)$/i.test(file));
    assert.deepEqual(originals, [], `${directory} contains original JPEGs`);
  }
});
