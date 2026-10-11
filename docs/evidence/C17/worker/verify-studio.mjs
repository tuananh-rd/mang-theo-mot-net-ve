/**
 * Kịch bản kiểm tra toàn diện Content Studio trên cổng 4330 (Task C17)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

async function runStudioVerification() {
  const baseUrl = 'http://127.0.0.1:4330';
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    tests: [],
    pass: true,
  };

  function logTest(name, passed, details = {}) {
    report.tests.push({ name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
    if (!passed) report.pass = false;
  }

  try {
    // 1. Kiểm tra UI HTML
    const htmlRes = await fetch(baseUrl + '/');
    const htmlText = await htmlRes.text();
    const hasSidebar = htmlText.includes('class="studio-sidebar"');
    const has8Tabs =
      htmlText.includes('1. Tổng quan') &&
      htmlText.includes('2. Dự án & Thông điệp') &&
      htmlText.includes('3. Nhật ký hành trình') &&
      htmlText.includes('4. Thư viện Media') &&
      htmlText.includes('5. Sản phẩm & Mở bán') &&
      htmlText.includes('6. Tài chính & Sao kê') &&
      htmlText.includes('7. Nhóm, FAQ & SEO') &&
      htmlText.includes('8. Lịch sử & Xuất bản');

    logTest('UI HTML: Trả về HTTP 200 và đủ 8 phân hệ điều hướng', htmlRes.status === 200 && hasSidebar && has8Tabs, {
      status: htmlRes.status,
      contentType: htmlRes.headers.get('content-type'),
    });

    // 2. Kiểm tra API /api/me
    const meRes = await fetch(baseUrl + '/api/me');
    const meJson = await meRes.json();
    logTest('API Auth: /api/me trả về thông tin người dùng dev-admin', meRes.status === 200 && meJson.user?.role === 'admin', {
      user: meJson.user,
    });

    // 3. Kiểm tra nạp bản nháp cho cả 5 phân hệ dữ liệu
    const modules = ['project', 'journal', 'products', 'finance', 'team'];
    for (const mod of modules) {
      const dRes = await fetch(baseUrl + '/api/drafts/' + mod);
      const dJson = await dRes.json();
      const hasData = dRes.status === 200 && dJson.draft && dJson.draft.revisionHash;
      logTest(`API Drafts: /api/drafts/${mod} nạp thành công và có mã băm revision`, Boolean(hasData), {
        moduleKey: mod,
        revisionHash: dJson.draft?.revisionHash,
      });
    }

    // 4. Kiểm tra lưu bản nháp và cập nhật mã băm
    const projectDraftRes = await fetch(baseUrl + '/api/drafts/project');
    const projectDraftJson = await projectDraftRes.json();
    const currentHash = projectDraftJson.draft.revisionHash;

    const updatedProject = {
      ...projectDraftJson.draft.data,
      previewNotice: 'Bản xem trước cập nhật từ Studio lúc ' + new Date().toLocaleTimeString('vi-VN'),
    };

    const saveRes = await fetch(baseUrl + '/api/drafts/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: updatedProject,
        expectedHash: currentHash,
        comment: 'Cập nhật ghi chú xem trước',
      }),
    });
    const saveJson = await saveRes.json();
    logTest('API Drafts: Lưu bản nháp thành công có khóa lạc quan', saveRes.status === 200 && saveJson.success, {
      newHash: saveJson.draft?.revisionHash,
      version: saveJson.revision?.version,
    });

    // 5. Kiểm tra phát hiện xung đột 409 khi gửi hash cũ
    const conflictRes = await fetch(baseUrl + '/api/drafts/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: updatedProject,
        expectedHash: currentHash, // hash cũ đã bị thay thế
        comment: 'Cố tình gửi hash cũ',
      }),
    });
    logTest('API OCC: Báo lỗi 409 Conflict khi gửi mã băm cũ', conflictRes.status === 409, {
      status: conflictRes.status,
    });

    // 6. Kiểm tra tạo yêu cầu xuất bản có Idempotency Key
    const pubKey = 'idem-' + Date.now();
    const pubRes1 = await fetch(baseUrl + '/api/publications/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: pubKey }),
    });
    const pubJson1 = await pubRes1.json();

    const pubRes2 = await fetch(baseUrl + '/api/publications/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: pubKey }),
    });
    const pubJson2 = await pubRes2.json();

    const pubIdempotent = pubJson1.publication?.id && pubJson1.publication.id === pubJson2.publication?.id;
    logTest('API Publication: Tạo yêu cầu xuất bản và duy trì Idempotency', Boolean(pubIdempotent), {
      pubId: pubJson1.publication?.id,
      status: pubJson1.publication?.status,
    });

    // 7. Kiểm tra danh sách nhật ký kiểm toán
    const auditRes = await fetch(baseUrl + '/api/audit-logs?limit=5');
    const auditJson = await auditRes.json();
    logTest('API Audit Logs: Ghi nhật ký đầy đủ các hành động', auditRes.status === 200 && auditJson.logs?.length > 0, {
      totalRecentLogs: auditJson.logs?.length,
    });

    // Ghi báo cáo kết quả
    const outDir = path.resolve(process.cwd(), 'docs/evidence/C17/worker');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'verification-results.json'), JSON.stringify(report, null, 2), 'utf-8');
    console.log('[Hoàn tất] Kết quả đã được ghi vào docs/evidence/C17/worker/verification-results.json');
  } catch (err) {
    console.error('Lỗi trong quá trình kiểm thử:', err);
    process.exit(1);
  }
}

runStudioVerification();
