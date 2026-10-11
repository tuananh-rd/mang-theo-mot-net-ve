import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LocalD1Database } from '../dist/db/emulator.js';
import { StudioDbClient } from '../dist/db/client.js';

test('D1 Database: Tính bền vững trên đĩa qua các lần khởi động lại (Persistence Test)', async () => {
  const testDir = path.resolve(process.cwd(), 'apps/studio/data/test-d1-' + Date.now());
  const sqliteFile = path.join(testDir, 'studio-persist-test.sqlite');
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'apps/studio/src/db/schema.sql'), 'utf-8');

  try {
    // 1. Khởi tạo instance 1 và lưu dữ liệu
    const d1_first = new LocalD1Database(sqliteFile, schemaSql);
    const client_first = new StudioDbClient(d1_first);

    await client_first.saveDraft(
      'project',
      { title: 'Dữ liệu bền vững 2026', milestone: 'Giai đoạn 1' },
      null,
      'test-author@internal.vn',
      'Lưu thử nghiệm độ bền vững'
    );

    // Đóng kết nối
    d1_first.close();

    // 2. Khởi tạo instance 2 trên cùng tệp SQLite (Mô phỏng máy chủ khởi động lại)
    const d1_second = new LocalD1Database(sqliteFile); // không cần schemaSql vì bảng đã tồn tại
    const client_second = new StudioDbClient(d1_second);

    // Đọc lại dữ liệu
    const loadedDraft = await client_second.getDraft('project');
    assert.ok(loadedDraft);
    assert.equal(loadedDraft.data.title, 'Dữ liệu bền vững 2026');
    assert.equal(loadedDraft.data.milestone, 'Giai đoạn 1');
    assert.equal(loadedDraft.updatedBy, 'test-author@internal.vn');

    // Kiểm tra lịch sử phiên bản cũng được lưu bền vững
    const revs = await client_second.listRevisions('project', 5);
    assert.equal(revs.length, 1);
    assert.equal(revs[0].data.title, 'Dữ liệu bền vững 2026');

    d1_second.close();
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
});
