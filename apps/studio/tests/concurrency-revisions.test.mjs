import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { StudioDbClient, ConcurrencyConflictError } from '../dist/db/client.js';
import { LocalD1Database } from '../dist/db/emulator.js';

test('Khóa lạc quan & Revisions: Phát hiện xung đột 409 và khôi phục an toàn', async () => {
  const schemaSql = fs.readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf-8');
  const d1 = new LocalD1Database(':memory:', schemaSql);
  const client = new StudioDbClient(d1);

  // 1. Lưu bản nháp đầu tiên (v1)
  const initialData = { title: 'Bản thảo ban đầu', progress: 10 };
  const v1 = await client.saveDraft('project', initialData, null, 'editor1@test.vn', 'Bản thảo v1');

  assert.equal(v1.draft.moduleKey, 'project');
  assert.equal(v1.revision.version, 1);
  assert.ok(v1.draft.revisionHash);

  // 2. Client A đọc dữ liệu và chuẩn bị lưu bản v2
  const hashA = v1.draft.revisionHash;
  const dataA = { title: 'Bản sửa đổi của A', progress: 50 };

  // 3. Client B cũng đọc v1 và lưu trước thành công
  const dataB = { title: 'Bản sửa đổi của B (lưu trước)', progress: 70 };
  const v2B = await client.saveDraft('project', dataB, hashA, 'editor2@test.vn', 'B lưu trước');
  assert.equal(v2B.revision.version, 2);

  // 4. Client A gửi lưu muộn với hash cũ -> Phải ném lỗi ConcurrencyConflictError
  await assert.rejects(
    async () => {
      await client.saveDraft('project', dataA, hashA, 'editor1@test.vn', 'A cố lưu ghi đè');
    },
    ConcurrencyConflictError
  );

  // Kiểm tra tính nguyên tử: Giao dịch bị rollback, không tạo revision rác hay audit log rác
  const revsDuringConflict = await client.listRevisions('project', 10);
  assert.equal(revsDuringConflict.length, 2); // Chỉ giữ đúng 2 revision v1 và v2, không tạo v3 bị lỗi
  const auditLogs = await client.listAuditLogs(10);
  assert.equal(auditLogs.filter((l) => l.details?.comment === 'A cố lưu ghi đè').length, 0);

  // 5. Kiểm tra danh sách Revisions
  const revs = await client.listRevisions('project', 10);
  assert.equal(revs.length, 2);
  assert.equal(revs[0].version, 2);
  assert.equal(revs[1].version, 1);

  // 6. Khôi phục phiên bản 1
  const rev1Id = revs[1].id;
  const restoredDraft = await client.restoreRevision('project', rev1Id, 'admin@test.vn');
  assert.equal(restoredDraft.data.title, 'Bản thảo ban đầu');

  // Bản khôi phục tạo phiên bản mới v3 trong lịch sử, không xóa v2
  const revsAfterRestore = await client.listRevisions('project', 10);
  assert.equal(revsAfterRestore.length, 3);
  assert.equal(revsAfterRestore[0].version, 3);
});
