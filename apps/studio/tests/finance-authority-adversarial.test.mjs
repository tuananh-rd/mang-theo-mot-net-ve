import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { StudioDbClient, ConcurrencyConflictError } from '../dist/db/client.js';
import { LocalD1Database } from '../dist/db/emulator.js';
import { LocalR2Bucket } from '../dist/storage/emulator.js';
import { handleApiRequest } from '../dist/api/router.js';
import { stripImageMetadata } from '../dist/storage/media-sniffer.js';
import { getDefaultModuleData } from '../dist/schemas/index.js';

function createTestHarness() {
  const schemaSql = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf-8');
  const d1 = new LocalD1Database(':memory:', schemaSql);
  const r2 = new LocalR2Bucket();
  const dbClient = new StudioDbClient(d1);
  const env = { DB: d1, BUCKET: r2, STUDIO_ENVIRONMENT: 'development' };

  async function api(path, options = {}) {
    const {
      method = 'GET',
      body,
      role = 'admin',
      email = 'admin@internal.local',
      origin = 'https://studio.example.local',
    } = options;

    const headers = {
      Origin: origin,
      'Content-Type': 'application/json',
    };
    const req = new Request(`${origin}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const session = {
      user: { email, role, id: `user-${email}` },
      isDev: true,
    };
    const res = await handleApiRequest(req, env, session);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  return { d1, r2, dbClient, env, api };
}

test('Adversarial: Client spoofing reconciled & publicApproval flags in draft save cannot authorize projection', async () => {
  const { api } = createTestHarness();

  // 1. Seed defaults
  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    await api(`/api/drafts/${mod}`);
  }

  // 2. Editor sends forged finance payload with spoofed approval flags
  const initial = (await api('/api/drafts/finance')).data.draft;
  const forged = structuredClone(initial.data);
  forged.reconciled = true;
  forged.reconciledAt = '2026-10-12';
  forged.publicApproval = 'approved';
  forged.reconciledBy = ['SYNTHETIC_SPOOFED_NAME'];
  forged.entries = [
    { date: '2026-10-12', amount: 500000, donor: 'SPOOFED_DONOR', reference: 'REF123456' },
  ];
  delete forged.firstSigner;
  delete forged.secondSigner;

  const saveRes = await api('/api/drafts/finance', {
    method: 'POST',
    role: 'editor',
    email: 'editor@internal.local',
    body: { data: forged, expectedHash: initial.revisionHash },
  });
  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.data.draft.data.reconciled, false, 'Server must reset reconciled to false');
  assert.equal(saveRes.data.draft.data.publicApproval, 'pending', 'Server must reset publicApproval to pending');

  // 3. Request publication -> finance entries MUST be withheld
  const pubRes = await api('/api/publications/request', {
    method: 'POST',
    role: 'admin',
    body: { idempotencyKey: 'test-adversarial-1' },
  });
  assert.equal(pubRes.status, 201);
  const finSnapshot = pubRes.data.publication.snapshot.modules.finance;
  assert.equal(finSnapshot.reconciled, false);
  assert.equal(finSnapshot.publicApproval, 'pending');
  assert.deepEqual(finSnapshot.entries, [], 'Unsigned actual entries must NEVER be projected into public snapshot');
});

test('Adversarial: Client spoofing signer objects in draft save are stripped by server', async () => {
  const { api } = createTestHarness();

  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    await api(`/api/drafts/${mod}`);
  }

  const initial = (await api('/api/drafts/finance')).data.draft;
  const forged = structuredClone(initial.data);
  forged.firstSigner = {
    name: 'spoofed-signer-1@internal.local',
    role: 'editor',
    signedAt: '2026-10-12T00:00:00Z',
    revisionId: 'fake-rev-id',
    revisionHash: 'fake-hash',
  };
  forged.secondSigner = {
    name: 'spoofed-signer-2@internal.local',
    role: 'reviewer',
    signedAt: '2026-10-12T00:00:00Z',
    revisionId: 'fake-rev-id',
    revisionHash: 'fake-hash',
  };
  forged.entries = [
    { date: '2026-10-12', amount: 1000000, donor: 'SPOOFED_DONOR_2', reference: 'REF999' },
  ];

  const saveRes = await api('/api/drafts/finance', {
    method: 'POST',
    role: 'editor',
    email: 'editor@internal.local',
    body: { data: forged, expectedHash: initial.revisionHash },
  });
  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.data.draft.data.firstSigner, null, 'Client-entered firstSigner must be stripped');
  assert.equal(saveRes.data.draft.data.secondSigner, null, 'Client-entered secondSigner must be stripped');

  const pubRes = await api('/api/publications/request', {
    method: 'POST',
    role: 'admin',
    body: { idempotencyKey: 'test-adversarial-2' },
  });
  assert.equal(pubRes.status, 201);
  const finSnapshot = pubRes.data.publication.snapshot.modules.finance;
  assert.deepEqual(finSnapshot.entries, []);
});

test('Adversarial: Self-review attempt (same email as first and second signer) is rejected', async () => {
  const { api } = createTestHarness();

  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    await api(`/api/drafts/${mod}`);
  }

  const current = (await api('/api/drafts/finance')).data.draft;

  // Step 1: User 1 signs as preparer
  const sign1Res = await api('/api/finance/attest', {
    method: 'POST',
    role: 'editor',
    email: 'preparer@internal.local',
    body: { expectedHash: current.revisionHash },
  });
  assert.equal(sign1Res.status, 200);
  assert.equal(sign1Res.data.status, 'pending_second_signer');

  // Step 2: Same User 1 attempts to sign as independent reviewer -> MUST fail
  const sign2Res = await api('/api/finance/attest', {
    method: 'POST',
    role: 'admin',
    email: 'preparer@internal.local', // Trùng người lập
    body: { expectedHash: sign1Res.data.draft.revisionHash },
  });
  assert.equal(sign2Res.status, 400);
  assert.match(sign2Res.data.error, /Quy tắc 2 người/);
});

test('Adversarial: Missing second reviewer holds finance projection without blocking other modules', async () => {
  const { api } = createTestHarness();

  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    await api(`/api/drafts/${mod}`);
  }

  // Chỉnh sửa phân hệ Project
  const projDraft = (await api('/api/drafts/project')).data.draft;
  const updatedProj = structuredClone(projDraft.data);
  updatedProj.title = 'Dự án Cập nhật Mới';
  await api('/api/drafts/project', {
    method: 'POST',
    role: 'editor',
    email: 'editor@internal.local',
    body: { data: updatedProj, expectedHash: projDraft.revisionHash },
  });

  // Ký lần 1 cho tài chính nhưng thiếu người ký lần 2
  const finDraft = (await api('/api/drafts/finance')).data.draft;
  await api('/api/finance/attest', {
    method: 'POST',
    role: 'editor',
    email: 'lead@internal.local',
    body: { expectedHash: finDraft.revisionHash },
  });

  // Yêu cầu xuất bản: Vẫn thành công cho Project, nhưng Finance giữ ở trạng thái pending
  const pubRes = await api('/api/publications/request', {
    method: 'POST',
    role: 'admin',
    body: { idempotencyKey: 'test-missing-reviewer' },
  });
  assert.equal(pubRes.status, 201);
  assert.equal(pubRes.data.publication.snapshot.modules.project.title, 'Dự án Cập nhật Mới');
  assert.equal(pubRes.data.publication.snapshot.modules.finance.publicApproval, 'pending');
  assert.deepEqual(pubRes.data.publication.snapshot.modules.finance.entries, []);
});

test('Workflow: Valid Two-Person Attestation authorizes sanitized projection with PII stripped', async () => {
  const { api } = createTestHarness();

  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    await api(`/api/drafts/${mod}`);
  }

  // 1. Áp dụng sao kê qua API apply-csv
  const finDraft = (await api('/api/drafts/finance')).data.draft;
  const rawRows = [
    { date: '2026-10-10', amount: 100000, donor: 'Nguyễn Văn A', reference: 'MBVCB123456789' },
    { date: '2026-10-11', amount: 200000, donor: 'Ẩn danh', reference: 'SECRET999' },
  ];
  const applyRes = await api('/api/finance/apply-csv', {
    method: 'POST',
    role: 'editor',
    email: 'preparer@internal.local',
    body: { rows: rawRows, expectedHash: finDraft.revisionHash },
  });
  assert.equal(applyRes.status, 200);
  const currentHash = applyRes.data.draft.revisionHash;

  // 2. Người lập ký (Preparer)
  const sign1 = await api('/api/finance/attest', {
    method: 'POST',
    role: 'editor',
    email: 'preparer@internal.local',
    body: { expectedHash: currentHash },
  });
  assert.equal(sign1.status, 200);
  assert.equal(sign1.data.status, 'pending_second_signer');

  // 3. Người duyệt độc lập ký (Reviewer)
  const sign2 = await api('/api/finance/attest', {
    method: 'POST',
    role: 'reviewer',
    email: 'independent-reviewer@internal.local',
    body: { expectedHash: sign1.data.draft.revisionHash },
  });
  assert.equal(sign2.status, 200);
  assert.equal(sign2.data.status, 'approved');

  // 4. Xuất bản -> Dữ liệu được chiếu công khai, che mã tham chiếu và ẩn danh
  const pubRes = await api('/api/publications/request', {
    method: 'POST',
    role: 'admin',
    body: { idempotencyKey: 'test-two-person-approved' },
  });
  assert.equal(pubRes.status, 201);
  const finSnapshot = pubRes.data.publication.snapshot.modules.finance;
  assert.equal(finSnapshot.reconciled, true);
  assert.equal(finSnapshot.publicApproval, 'approved');
  assert.equal(finSnapshot.entries.length, 2);

  // Kiểm tra che PII
  const [e1, e2] = finSnapshot.entries;
  assert.equal(e1.donor, 'Nguyễn Văn A');
  assert.equal(e1.reference, '...6789', 'Mã tham chiếu phải được che, chỉ giữ 4 số cuối');
  assert.equal(e2.donor, 'Ẩn danh');
  assert.equal(e2.reference, null, 'Ẩn danh phải có reference null');

  // 5. Chỉnh sửa tiếp theo hủy bỏ ngay các chữ ký cũ (Invalidate Old Approvals)
  const modifiedData = structuredClone(sign2.data.draft.data);
  modifiedData.entries.push({ date: '2026-10-12', amount: 50000, donor: 'Người mới', reference: null });
  const editRes = await api('/api/drafts/finance', {
    method: 'POST',
    role: 'editor',
    email: 'preparer@internal.local',
    body: { data: modifiedData, expectedHash: sign2.data.draft.revisionHash },
  });
  assert.equal(editRes.status, 200);
  assert.equal(editRes.data.draft.data.reconciled, false);
  assert.equal(editRes.data.draft.data.publicApproval, 'pending');
  assert.equal(editRes.data.draft.data.firstSigner, null);
  assert.equal(editRes.data.draft.data.secondSigner, null);
});

test('Security: Media Sniffer strips EXIF and private metadata chunks', () => {
  // 1. Tạo buffer JPEG giả lập chứa segment APP1 (EXIF)
  // Header: FF D8 | APP1: FF E1 00 0A 'EXIF_DATA' | SOS: FF DA | Data: 12 34 | EOI: FF D9
  const exifPayload = new TextEncoder().encode('EXIF_DATA');
  const app1Len = 2 + exifPayload.length;
  const jpegWithExif = new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe1, (app1Len >> 8) & 0xff, app1Len & 0xff, ...exifPayload,
    0xff, 0xda, 0x12, 0x34,
    0xff, 0xd9,
  ]);

  const cleanedJpeg = stripImageMetadata(jpegWithExif, 'image/jpeg');
  const text = new TextDecoder().decode(cleanedJpeg);
  assert.equal(text.includes('EXIF_DATA'), false, 'EXIF segment must be stripped from cleaned JPEG');
  assert.equal(cleanedJpeg[0], 0xff);
  assert.equal(cleanedJpeg[1], 0xd8);

  // 2. Tạo buffer PNG giả lập chứa chunk tEXt
  // Sig: 89 50 4E 47 0D 0A 1A 0A | Chunk tEXt len 4 | type 'tEXt' | 'TEST' | crc 00 00 00 00
  const pngWithText = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x04,
    0x74, 0x45, 0x58, 0x74,
    0x54, 0x45, 0x53, 0x54,
    0x00, 0x00, 0x00, 0x00,
  ]);
  const cleanedPng = stripImageMetadata(pngWithText, 'image/png');
  const pngText = new TextDecoder().decode(cleanedPng);
  assert.equal(pngText.includes('tEXt'), false, 'tEXt metadata chunk must be stripped from cleaned PNG');
});

test('Integrity: Prevent deleting media assets referenced anywhere in system', async () => {
  const { api, dbClient } = createTestHarness();

  // Tạo asset mẫu
  const assetRecord = {
    id: 'asset-test-used-1',
    filename: 'test.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 1024,
    r2Key: 'media/asset-test-used-1.jpg',
    status: 'approved',
    alt: 'Ảnh thử nghiệm',
    isIllustration: true,
    focalX: 50,
    focalY: 50,
    createdBy: 'admin@internal.local',
    createdAt: new Date().toISOString(),
  };
  await dbClient.saveMediaAsset(assetRecord);

  // Tham chiếu asset vào phân hệ journal
  for (const mod of ['project', 'journal', 'products', 'finance', 'team']) {
    await api(`/api/drafts/${mod}`);
  }
  const journalDraft = (await api('/api/drafts/journal')).data.draft;
  const updatedJournal = [
    {
      slug: 'bai-viet-test',
      title: 'Bài viết có ảnh',
      summary: 'Tóm tắt',
      category: 'ke-hoach',
      publishedAt: '2026-10-12',
      status: 'published',
      coverImage: {
        src: '/media/asset-test-used-1.jpg',
        alt: 'Ảnh bài viết',
        caption: 'Chú thích',
      },
      content: [{ type: 'paragraph', text: 'Nội dung' }],
    },
  ];
  await api('/api/drafts/journal', {
    method: 'POST',
    role: 'editor',
    body: { data: updatedJournal, expectedHash: journalDraft.revisionHash },
  });

  // Cố xóa asset -> Bị từ chối do đang được tham chiếu
  const delRes = await api('/api/media/asset-test-used-1', {
    method: 'DELETE',
    role: 'admin',
  });
  assert.equal(delRes.status, 400);
  assert.match(delRes.data.error, /Không thể xóa ảnh vì đang được tham chiếu/);
});
