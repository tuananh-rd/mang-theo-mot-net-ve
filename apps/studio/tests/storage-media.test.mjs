import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sniffImageFormat, checkAssetUsageInDrafts } from '../dist/storage/media-sniffer.js';
import { LocalR2Bucket } from '../dist/storage/emulator.js';

test('Media Sniffer: Nhận diện chính xác định dạng ảnh qua Magic Bytes', () => {
  // JPEG: FF D8 FF
  const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const jpegResult = sniffImageFormat(jpegBytes);
  assert.equal(jpegResult.valid, true);
  assert.equal(jpegResult.contentType, 'image/jpeg');
  assert.equal(jpegResult.extension, 'jpg');

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const pngResult = sniffImageFormat(pngBytes);
  assert.equal(pngResult.valid, true);
  assert.equal(pngResult.contentType, 'image/png');
  assert.equal(pngResult.extension, 'png');

  // WebP: RIFF....WEBP
  const webpBytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
  ]);
  const webpResult = sniffImageFormat(webpBytes);
  assert.equal(webpResult.valid, true);
  assert.equal(webpResult.contentType, 'image/webp');
  assert.equal(webpResult.extension, 'webp');
});

test('Media Sniffer: Từ chối dứt khoát SVG và tệp chứa script / mã độc', () => {
  const svgText = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>';
  const svgBytes = new TextEncoder().encode(svgText);
  const svgResult = sniffImageFormat(svgBytes);
  assert.equal(svgResult.valid, false);
  assert.match(svgResult.error, /Từ chối định dạng SVG/);

  const scriptText = '<?xml version="1.0"?><script>alert("hack")</script>';
  const scriptBytes = new TextEncoder().encode(scriptText);
  const scriptResult = sniffImageFormat(scriptBytes);
  assert.equal(scriptResult.valid, false);
});

test('Media Sniffer: Kiểm tra ràng buộc tham chiếu trước khi xóa ảnh', () => {
  const drafts = {
    project: {
      title: 'Mang Theo Một Nét Vẽ',
      bannerImage: 'media/asset-mai-am-1.webp',
    },
    journal: [
      {
        slug: 'khoi-dong',
        coverImage: { src: '/images/illustrations/a01.webp' },
      },
    ],
  };

  const inUse = checkAssetUsageInDrafts('asset-mai-am-1', drafts);
  assert.equal(inUse.inUse, true);
  assert.deepEqual(inUse.usedIn, ['project']);

  const notInUse = checkAssetUsageInDrafts('unrelated-photo-99', drafts);
  assert.equal(notInUse.inUse, false);
  assert.equal(notInUse.usedIn.length, 0);
});

test('Storage R2: Hoạt động bền vững của LocalR2Bucket (put, get, list, delete)', async () => {
  const testDir = path.resolve(process.cwd(), 'apps/studio/data/test-r2-' + Date.now());
  const bucket = new LocalR2Bucket(testDir);

  try {
    const key = 'media/test-image.jpg';
    const content = Buffer.from('hello-r2-image-binary-content');

    // Put
    const putRes = await bucket.put(key, content, {
      httpMetadata: { contentType: 'image/jpeg' },
      customMetadata: { author: 'unit-tester' },
    });
    assert.equal(putRes.key, key);
    assert.equal(putRes.size, content.length);

    // Get
    const getRes = await bucket.get(key);
    assert.ok(getRes);
    assert.equal(getRes.key, key);
    assert.equal(getRes.httpMetadata?.contentType, 'image/jpeg');
    const text = await getRes.text();
    assert.equal(text, 'hello-r2-image-binary-content');

    // List
    const listRes = await bucket.list({ prefix: 'media/' });
    assert.equal(listRes.objects.length, 1);
    assert.equal(listRes.objects[0].key, key);

    // Delete
    await bucket.delete(key);
    const afterDelete = await bucket.get(key);
    assert.equal(afterDelete, null);
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
});
