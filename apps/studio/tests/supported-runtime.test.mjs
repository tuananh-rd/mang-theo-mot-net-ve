import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy, unstable_dev, unstable_splitSqlQuery } from 'wrangler';
import * as esbuild from 'esbuild';
import { StudioDbClient, ConcurrencyConflictError, calculateDataHash } from '../dist/db/client.js';

const WRANGLER_CONFIG_PATH = fileURLToPath(new URL('../wrangler.toml', import.meta.url));
const MIGRATIONS_SQL_PATH = fileURLToPath(new URL('../migrations/0001_initial_schema.sql', import.meta.url));
const WORKER_SRC_PATH = fileURLToPath(new URL('../src/worker.ts', import.meta.url));

// Tạo thư mục lưu trữ tạm thời cô lập hoàn toàn cho fixture
function createTempStorage() {
  const prefix = path.join(os.tmpdir(), 'c17-r1-test-');
  const tempDir = fs.mkdtempSync(prefix);
  return tempDir;
}

// Xóa thư mục tạm thời an toàn, xác minh chặt chẽ đường dẫn nằm trong tmpdir
function cleanupTempStorage(dir) {
  try {
    if (!dir) return;
    const resolved = path.resolve(dir);
    const resolvedTmp = path.resolve(os.tmpdir());
    if (resolved.startsWith(resolvedTmp) && path.basename(resolved).startsWith('c17-r1-test-')) {
      if (fs.existsSync(resolved)) {
        fs.rmSync(resolved, { recursive: true, force: true });
      }
    }
  } catch {
    // Bỏ qua lỗi file lock trên môi trường Windows
  }
}

// Khởi tạo schema D1 từ migration SQL chính thức
async function applyMigrations(db) {
  const sql = fs.readFileSync(MIGRATIONS_SQL_PATH, 'utf8');
  const statements = unstable_splitSqlQuery(sql);
  for (const statement of statements) {
    if (statement.trim()) {
      await db.prepare(statement).run();
    }
  }
}

test('Supported D1: draft save/read, mandatory expectedHash, và phát hiện xung đột lạc quan', async () => {
  const tempDir = createTempStorage();
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    await applyMigrations(proxy.env.DB);
    const client = new StudioDbClient(proxy.env.DB);

    // 1. Lưu bản nháp ban đầu (INSERT)
    const initialData = { title: 'Dự án C17 Supported Runtime', progress: 10 };
    const v1 = await client.saveDraft('project', initialData, null, 'editor1@test.vn', 'Khởi tạo ban đầu');

    assert.equal(v1.draft.moduleKey, 'project');
    assert.equal(v1.revision.version, 1);
    assert.ok(v1.draft.revisionHash, 'revisionHash phải tồn tại');

    // Đọc lại bản nháp từ D1
    const readDraft = await client.getDraft('project');
    assert.ok(readDraft, 'Bản nháp phải tồn tại');
    assert.equal(readDraft.data.title, 'Dự án C17 Supported Runtime');
    assert.equal(readDraft.revisionHash, v1.draft.revisionHash);

    // 2. Yêu cầu bắt buộc expectedHash khi bản nháp đã tồn tại
    await assert.rejects(
      async () => {
        await client.saveDraft('project', { title: 'Cố lưu không có hash' }, null, 'editor1@test.vn');
      },
      ConcurrencyConflictError,
      'Phải từ chối lưu khi thiếu expectedHash'
    );

    // 3. Cập nhật hợp lệ với expectedHash chính xác
    const v2Data = { title: 'Dự án C17 - Cập nhật v2', progress: 40 };
    const v2 = await client.saveDraft('project', v2Data, v1.draft.revisionHash, 'editor1@test.vn', 'Cập nhật v2');
    assert.equal(v2.revision.version, 2);

    // 4. Từ chối lưu với hash cũ (stale expectedHash)
    await assert.rejects(
      async () => {
        await client.saveDraft('project', { title: 'Cố ghi đè bằng hash cũ v1' }, v1.draft.revisionHash, 'editor2@test.vn');
      },
      ConcurrencyConflictError,
      'Phải từ chối khi expectedHash bị cũ'
    );
  } finally {
    if (proxy) await proxy.dispose();
    cleanupTempStorage(tempDir);
  }
});

test('Supported D1: Xung đột đồng thời (Race Condition) không sinh ghost revision hoặc audit log thừa', async () => {
  const tempDir = createTempStorage();
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    await applyMigrations(proxy.env.DB);

    for (const sameTargetData of [false, true]) {
      let hookBatch = null;
      const wrappedDb = new Proxy(proxy.env.DB, {
        get(target, prop, receiver) {
          if (prop === 'batch' && hookBatch) {
            return hookBatch;
          }
          return Reflect.get(target, prop, receiver);
        }
      });
      const client = new StudioDbClient(wrappedDb);

      // Khởi tạo bản nháp ban đầu
      const initial = await client.saveDraft('project', { title: `Race Initial ${sameTargetData}` }, null, 'initial@test.vn');

      const revsBefore = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM revisions WHERE module_key='project'").first()).c;
      const auditsBefore = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE module_key='project'").first()).c;

      // Giả lập cuộc đua xảy ra giữa precheck và batch thực thi
      const targetData = { title: 'Loser Draft' };
      const winnerData = sameTargetData ? targetData : { title: 'Winner Draft' };
      const winnerHash = sameTargetData ? await calculateDataHash(targetData) : 'winner-race-hash-123';

      hookBatch = async (statements) => {
        // Một tác vụ khác cập nhật draft ngay trước khi conditional batch thực thi
        await proxy.env.DB.prepare("UPDATE drafts SET data_json = ?, revision_hash = ? WHERE module_key = 'project'")
          .bind(JSON.stringify(winnerData), winnerHash)
          .run();
        return proxy.env.DB.batch(statements);
      };

      try {
        await assert.rejects(
          async () => {
            await client.saveDraft('project', targetData, initial.draft.revisionHash, 'loser@test.vn');
          },
          ConcurrencyConflictError,
          'Phải từ chối save khi có bên thắng thay đổi hash trước conditional UPDATE'
        );

        const revsAfter = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM revisions WHERE module_key='project'").first()).c;
        const auditsAfter = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE module_key='project'").first()).c;
        assert.equal(revsAfter, revsBefore, `Revisions không được tăng (sameTargetData=${sameTargetData})`);
        assert.equal(auditsAfter, auditsBefore, `Audit logs không được tăng (sameTargetData=${sameTargetData})`);

        const finalDraft = await client.getDraft('project');
        assert.equal(finalDraft.revisionHash, winnerHash, 'Bản nháp của bên thắng phải được bảo toàn nguyên vẹn');
      } finally {
        hookBatch = null;
        // Dọn dẹp để test vòng lặp tiếp theo
        await proxy.env.DB.prepare("DELETE FROM drafts WHERE module_key='project'").run();
        await proxy.env.DB.prepare("DELETE FROM revisions WHERE module_key='project'").run();
        await proxy.env.DB.prepare("DELETE FROM audit_logs WHERE module_key='project'").run();
      }
    }
  } finally {
    if (proxy) await proxy.dispose();
    cleanupTempStorage(tempDir);
  }
});

test('Supported D1: Tính nguyên tử (Atomicity Rollback) trong saveDraft khi audit log thất bại', async () => {
  const tempDir = createTempStorage();
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    await applyMigrations(proxy.env.DB);
    const client = new StudioDbClient(proxy.env.DB);

    // Tiêm trigger gây lỗi trong thao tác ghi audit_logs bên trong batch giao dịch của saveDraft
    await proxy.env.DB.prepare(
      "CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(FAIL, 'SYNTHETIC_AUDIT_FAILURE'); END;"
    ).run();

    try {
      await assert.rejects(
        async () => {
          await client.saveDraft('project', { title: 'Bản thảo thất bại nguyên tử' }, null, 'author@test.vn');
        },
        /SYNTHETIC_AUDIT_FAILURE/
      );

      // Toàn bộ transaction phải rollback: drafts, revisions và audit_logs đều phải giữ nguyên 0
      const counts = {};
      for (const table of ['drafts', 'revisions', 'audit_logs']) {
        counts[table] = (await proxy.env.DB.prepare(`SELECT COUNT(*) as c FROM ${table}`).first()).c;
      }

      assert.deepEqual(counts, { drafts: 0, revisions: 0, audit_logs: 0 }, 'Rollback hoàn toàn mọi bảng khi lỗi xảy ra trong batch');
    } finally {
      await proxy.env.DB.prepare('DROP TRIGGER IF EXISTS synthetic_audit_failure').run();
    }

    // Xác nhận sau khi gỡ trigger, saveDraft hoạt động bình thường
    const valid = await client.saveDraft('project', { title: 'Bản thảo hợp lệ sau gỡ trigger' }, null, 'author@test.vn');
    assert.equal(valid.revision.version, 1);
    const countsAfter = {};
    for (const table of ['drafts', 'revisions', 'audit_logs']) {
      countsAfter[table] = (await proxy.env.DB.prepare(`SELECT COUNT(*) as c FROM ${table}`).first()).c;
    }
    assert.deepEqual(countsAfter, { drafts: 1, revisions: 1, audit_logs: 1 });
  } finally {
    if (proxy) await proxy.dispose();
    cleanupTempStorage(tempDir);
  }
});

test('Supported D1: Khôi phục phiên bản (Restore Revision) với khóa lạc quan OCC và kiểm tra rollback khi từ chối', async () => {
  const tempDir = createTempStorage();
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    await applyMigrations(proxy.env.DB);
    const client = new StudioDbClient(proxy.env.DB);

    // Tạo v1 và v2
    const v1 = await client.saveDraft('project', { title: 'Bản thảo gốc v1' }, null, 'admin@test.vn');
    const v2 = await client.saveDraft('project', { title: 'Bản thảo sửa v2' }, v1.draft.revisionHash, 'admin@test.vn');

    const revsBaseline = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM revisions WHERE module_key='project'").first()).c;
    const auditsBaseline = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE module_key='project'").first()).c;
    assert.equal(revsBaseline, 2);
    assert.equal(auditsBaseline, 2);

    // 1. Khôi phục với expectedHash cũ (stale) -> Phải bị từ chối và không sinh bản ghi thừa
    await assert.rejects(
      async () => {
        await client.restoreRevision('project', v1.revision.id, 'admin@test.vn', v1.draft.revisionHash);
      },
      ConcurrencyConflictError,
      'Phải từ chối restore khi expectedHash không khớp bản nháp hiện tại'
    );

    const revsAfterStale = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM revisions WHERE module_key='project'").first()).c;
    const auditsAfterStale = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE module_key='project'").first()).c;
    assert.equal(revsAfterStale, 2, 'Không được sinh revision khi restore bị từ chối (stale hash)');
    assert.equal(auditsAfterStale, 2, 'Không được sinh audit log khi restore bị từ chối (stale hash)');

    // 2. Khôi phục với missing expectedHash (rỗng hoặc null) -> Phải bị từ chối và không sinh bản ghi thừa
    await assert.rejects(
      async () => {
        await client.restoreRevision('project', v1.revision.id, 'admin@test.vn', '');
      },
      ConcurrencyConflictError,
      'Phải từ chối restore khi expectedHash rỗng'
    );

    const revsAfterMissing = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM revisions WHERE module_key='project'").first()).c;
    const auditsAfterMissing = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE module_key='project'").first()).c;
    assert.equal(revsAfterMissing, 2, 'Không được sinh revision khi restore bị từ chối (missing hash)');
    assert.equal(auditsAfterMissing, 2, 'Không được sinh audit log khi restore bị từ chối (missing hash)');

    // 3. Khôi phục thành công với expectedHash hiện tại (v2) -> Sinh đúng 1 revision và audit log mới
    const restored = await client.restoreRevision('project', v1.revision.id, 'admin@test.vn', v2.draft.revisionHash);
    assert.equal(restored.data.title, 'Bản thảo gốc v1');

    // Kiểm tra lịch sử có đúng 3 phiên bản
    const revs = await client.listRevisions('project', 10);
    assert.equal(revs.length, 3);
    assert.equal(revs[0].version, 3);

    const auditsAfterRestore = (await proxy.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE module_key='project'").first()).c;
    assert.equal(auditsAfterRestore, 3, 'Chỉ sinh đúng 1 audit log cho phiên bản khôi phục mới');
  } finally {
    if (proxy) await proxy.dispose();
    cleanupTempStorage(tempDir);
  }
});

test('Supported D1 & R2: Tính bền vững trên đĩa (Persistence Test) qua các lần khởi động lại runtime', async () => {
  const tempDir = createTempStorage();
  let proxy1;
  let proxy2;
  try {
    // Phiên 1: Khởi tạo và ghi dữ liệu
    proxy1 = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    await applyMigrations(proxy1.env.DB);
    const client1 = new StudioDbClient(proxy1.env.DB);

    // Ghi D1
    const draft = await client1.saveDraft('project', { title: 'Persisted Title' }, null, 'persist-author@test.vn');
    await proxy1.env.DB.prepare(
      "INSERT INTO users (id, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind('usr-persist-1', 'persist-user@test.vn', 'admin', new Date().toISOString(), new Date().toISOString()).run();

    // Ghi R2
    await proxy1.env.BUCKET.put('media/persisted-asset.png', 'png-persisted-binary-content', {
      httpMetadata: { contentType: 'image/png' }
    });

    // Đóng phiên 1
    await proxy1.dispose();
    proxy1 = null;

    // Phiên 2: Mở lại cùng thư mục persist
    proxy2 = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    const client2 = new StudioDbClient(proxy2.env.DB);

    // Xác minh D1 vẫn nguyên vẹn
    const restoredDraft = await client2.getDraft('project');
    assert.ok(restoredDraft, 'Bản nháp D1 phải tồn tại sau restart');
    assert.equal(restoredDraft.data.title, 'Persisted Title');
    assert.equal(restoredDraft.revisionHash, draft.draft.revisionHash);

    const userRow = await proxy2.env.DB.prepare("SELECT email, role FROM users WHERE id = 'usr-persist-1'").first();
    assert.ok(userRow);
    assert.equal(userRow.email, 'persist-user@test.vn');
    assert.equal(userRow.role, 'admin');

    // Xác minh R2 vẫn nguyên vẹn
    const r2Obj = await proxy2.env.BUCKET.get('media/persisted-asset.png');
    assert.ok(r2Obj, 'Tệp R2 phải tồn tại sau restart');
    assert.equal(await r2Obj.text(), 'png-persisted-binary-content');
    assert.equal(r2Obj.httpMetadata?.contentType, 'image/png');
  } finally {
    if (proxy1) await proxy1.dispose();
    if (proxy2) await proxy2.dispose();
    cleanupTempStorage(tempDir);
  }
});

test('Supported R2: Các thao tác put, get, list, delete trên kho lưu trữ', async () => {
  const tempDir = createTempStorage();
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: tempDir }
    });

    const bucket = proxy.env.BUCKET;

    // 1. Put
    await bucket.put('test/item-1.txt', 'item-1-data', {
      httpMetadata: { contentType: 'text/plain' },
      customMetadata: { tag: 'unit-test' }
    });

    await bucket.put('test/item-2.txt', 'item-2-data', {
      httpMetadata: { contentType: 'text/plain' }
    });

    // 2. Get
    const obj1 = await bucket.get('test/item-1.txt');
    assert.ok(obj1);
    assert.equal(await obj1.text(), 'item-1-data');
    assert.equal(obj1.httpMetadata?.contentType, 'text/plain');

    // 3. List
    const listResult = await bucket.list({ prefix: 'test/' });
    assert.equal(listResult.objects.length, 2);
    const keys = listResult.objects.map((o) => o.key);
    assert.ok(keys.includes('test/item-1.txt'));
    assert.ok(keys.includes('test/item-2.txt'));

    // 4. Delete
    await bucket.delete('test/item-1.txt');
    const obj1Deleted = await bucket.get('test/item-1.txt');
    assert.equal(obj1Deleted, null, 'Tệp đã xóa phải trả về null khi get');

    const listAfterDelete = await bucket.list({ prefix: 'test/' });
    assert.equal(listAfterDelete.objects.length, 1);
  } finally {
    if (proxy) await proxy.dispose();
    cleanupTempStorage(tempDir);
  }
});

test('Supported Worker Runtime (unstable_dev): Khởi chạy Worker thật, fail-secure auth, bypass loopback và phục vụ media', async () => {
  const tempDir = createTempStorage();
  let worker;
  try {
    // 1. Khởi tạo schema D1 và nạp tệp media mẫu vào R2 trước khi Worker khởi động
    const v3Dir = path.join(tempDir, 'v3');
    const seedProxy = await getPlatformProxy({
      configPath: WRANGLER_CONFIG_PATH,
      persist: { path: v3Dir }
    });
    await applyMigrations(seedProxy.env.DB);
    await seedProxy.env.BUCKET.put('media/private-test.png', 'png-binary-synthetic-fixture', {
      httpMetadata: { contentType: 'image/png' }
    });
    await seedProxy.dispose();

    // 2. Khởi chạy Worker runtime thật với Miniflare / workerd qua unstable_dev
    worker = await unstable_dev(WORKER_SRC_PATH, {
      config: WRANGLER_CONFIG_PATH,
      persistTo: tempDir,
      vars: { STUDIO_ENVIRONMENT: 'development' },
      experimental: { disableExperimentalWarning: true }
    });

    assert.ok(worker.port, 'Worker phải khởi chạy và cấp cổng');

    // 3. Chống giả mạo Host header: Yêu cầu từ xa mang Host giả loopback vẫn phải bị từ chối
    const resRemoteForged = await worker.fetch('http://example.com/media/private-test.png', {
      headers: { Host: '127.0.0.1' }
    });
    assert.equal(resRemoteForged.status, 401, 'Yêu cầu từ xa mang Host giả mạo phải bị từ chối 401');

    // 4. Tuyến media chưa xác thực từ xa: Phải từ chối 401 Unauthorized trước khi đọc bucket
    const resMediaUnauth = await worker.fetch('http://example.com/media/private-test.png');
    assert.equal(resMediaUnauth.status, 401);
    const mediaBody = await resMediaUnauth.json();
    assert.equal(mediaBody.code, 'UNAUTHORIZED_MEDIA');

    // 5. Yêu cầu loopback nội bộ hợp lệ: Kích hoạt dev-bypass và truy vấn phiên người dùng
    const resMe = await worker.fetch(`http://127.0.0.1:${worker.port}/api/me`);
    assert.equal(resMe.status, 200);
    const meData = await resMe.json();
    assert.equal(meData.user.role, 'admin');
    assert.equal(meData.isDev, true);

    // 6. Tuyến media phục vụ thành công khi đã xác thực nội bộ
    const resMediaAuth = await worker.fetch(`http://127.0.0.1:${worker.port}/media/private-test.png`);
    assert.equal(resMediaAuth.status, 200);
    assert.equal(resMediaAuth.headers.get('content-type'), 'image/png');
    assert.equal(resMediaAuth.headers.get('cache-control'), 'private, no-store');
    assert.equal(await resMediaAuth.text(), 'png-binary-synthetic-fixture');

    // 7. Tuyến media trả về 404 khi tệp không tồn tại trong bucket (chứng minh auth đã vượt qua và đọc bucket)
    const resMedia404 = await worker.fetch(`http://127.0.0.1:${worker.port}/media/non-existent-asset.png`);
    assert.equal(resMedia404.status, 404);
  } finally {
    if (worker) await worker.stop();
    cleanupTempStorage(tempDir);
  }
});

test('Worker Bundle Verification: Kiểm tra Worker không chứa module Node-only trong toàn bộ dependency graph', async () => {
  // Biên dịch bundle thực tế bằng esbuild với metafile để phân tích cây phụ thuộc
  const buildResult = await esbuild.build({
    entryPoints: [WORKER_SRC_PATH],
    bundle: true,
    write: false,
    metafile: true,
    format: 'esm',
    target: 'es2022',
    external: ['cloudflare:*']
  });

  assert.ok(buildResult.metafile, 'Phải tạo metafile phân tích bundle');
  const inputPaths = Object.keys(buildResult.metafile.inputs).map(p => p.replaceAll('\\', '/'));

  // Đảm bảo không có module Node-only bị nhúng vào bundle Worker
  const forbiddenNodeModules = [
    'node:fs', 'fs', 'node:http', 'http', 'node:net', 'net',
    'node:sqlite', 'node:child_process', 'child_process'
  ];

  for (const forbidden of forbiddenNodeModules) {
    const hasForbidden = inputPaths.some(p => p === forbidden || p.includes(`/${forbidden}`));
    assert.ok(!hasForbidden, `Bundle không được chứa module cấm: ${forbidden}`);
  }

  // Đảm bảo không import tệp emulator trong production worker
  const hasEmulator = inputPaths.some(p => p.includes('emulator.ts') || p.includes('emulator.js'));
  assert.ok(!hasEmulator, 'Bundle không được import các adapter emulator');
});
