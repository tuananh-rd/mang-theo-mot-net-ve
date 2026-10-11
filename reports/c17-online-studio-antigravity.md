# Báo cáo triển khai Task C17: Content Studio Trực tuyến (Cloudflare Access, D1, R2)

- **Người thực hiện:** Antigravity (Application & Infrastructure Worker)
- **Quản lý & Reviewer:** Codex (Coordinator)
- **Nhánh thực hiện:** `task/c17-online-studio`
- **Mã Task Orchestration:** `task_433a9e96bd49`
- **Mã Dispatch Context:** `ctx_344fb2d316b5`
- **Mã Run ID:** `run_2d9a78aa172e`
- **Terminal Worker:** `term_d5e2a3fc-8366-4cc8-9ff1-60f502e1f1aa`
- **Terminal Coordinator:** `term_6ea3ea53-bf27-4516-9467-2dfeebda674b`
- **Mã Baseline SHA:** `89e82e65eece577d36c77f76798a8f009fb13e18`
- **Mã Code Commit SHA:** `5198f6a1aba702e761a8730bd031ea52e949c777` (commit `5198f6a`)
- **Ngày hoàn thành:** 11/10/2026

---

## 1. Tóm tắt kết quả thực hiện (Executive Summary)

1. **Đã thực hiện & Khắc phục toàn diện mọi phát hiện của Reviewer (RC17-0022308, RC17-7c60615, RC17-5745030 và Delivery c0970eca54b6):**
   - **Xung đột đồng thời xác định (Deterministic Race Condition) & Giao dịch OCC nguyên tử:** Sử dụng mệnh đề `WHERE changes() = 1` trong câu lệnh `INSERT INTO revisions` và `INSERT INTO audit_logs` thuộc D1 atomic batch. Khi `draftStmt` cập nhật 0 dòng do lệch revision hash, SQLite tự động đánh giá `changes() = 1` là sai, ngăn chặn hoàn toàn việc sinh revision rác ("ghost revision") hoặc audit log thừa ngay cả khi dữ liệu bên thua hoàn toàn trùng khớp với bên thắng (`sameTargetData === true`). Loại bỏ triệt để nhánh sequential fallback không nguyên tử.
   - **Khôi phục Phiên bản có Khóa Lạc quan (OCC Stale Restore Guard):** Bổ sung tham số `expectedHash` vào API `POST /api/revisions/:moduleKey/:id/restore` và phương thức `dbClient.restoreRevision()`. Khi người dùng khôi phục phiên bản dựa trên một bản nháp cũ đã bị người khác sửa đổi, hệ thống trả về mã lỗi HTTP 409 `ConcurrencyConflictError`, giữ nguyên dữ liệu bên thắng, không sinh revision mồ côi và không sinh audit log thừa (`reviewer-restore-concurrency-probe.mjs` PASS cả 2 chế độ `stale` và `current`).
   - **Xác thực Lịch & Mã băm Bản chụp Nghiêm ngặt (`snapshot-loader.ts`):** Kiểm tra chặt chẽ chuỗi thời gian ISO với hàm `isValidCalendarIsoDate`, đối chiếu ngày dương lịch thực tế (ngăn chặn roll-over ngày ảo như `2026-02-31`), kiểm tra kiểu dữ liệu sâu từng trường con của phân hệ `project` (bắt buộc `title`, `slug`, `summary`... là string, không chấp nhận đối tượng sai kiểu), và tính toán lại mã băm SHA-256 từ `JSON.stringify(modules)` để từ chối dứt khoát mọi bản chụp bị can thiệp dữ liệu (`tampered hash`).
   - **Bảo vệ tính Idempotent & Gating của GitHub Publisher:** Loại bỏ biến môi trường `env.GITHUB_SIMULATE` khỏi production fallback; chế độ giả lập chỉ được kích hoạt khi có cờ tường minh `options.simulateFixture === true`. Kiểm tra trạng thái HTTP (`patchRefRes.ok`) khi cập nhật branch ref (PATCH) và bảo toàn tính toàn vẹn khi tạo PR.
   - **Khả năng tiếp cận Bảng & Khắc phục Cắt cột trên Di động:** Nâng cấp toàn bộ các bảng dữ liệu (`.table-container`) với `tabindex="0"`, `role="region"`, nhãn tiếp cận `aria-label` mô tả rõ ràng, thiết lập `min-width: 640px` cho `table.data-table`, và bổ sung gợi ý cuộn ngang trực quan (`table-scroll-hint`), bảo đảm bàn phím tiếp cận đầy đủ các nút thao tác mà không bị cắt xén trên màn hình 375px. Drawer menu trên di động có `visibility: hidden` khi đóng và phím `Escape` tự động đóng drawer an toàn.
   - **Mở rộng Nghiệp vụ Biểu mẫu Chuyên sâu (8 Phân hệ):**
     - *Phân hệ Sản phẩm:* Bổ sung trường câu chuyện / ý nghĩa gây quỹ (`narrative`), khóa hình ảnh (`mediaKey`) kèm xem trước ảnh trực quan.
     - *Phân hệ Tài chính:* Bổ sung nút "Áp dụng vào sổ sao kê (Apply CSV)" sau khi kiểm tra hợp lệ để ghi dòng vào bản nháp, bổ sung thẻ xác nhận Quy tắc 2 người (Two-Person Policy: Người lập vs Người kiểm tra độc lập), và các bảng con Doanh thu bán hàng (`f.sales`), Khoản chi dự án (`f.expenses`), Tiếp nhận hiện vật (`f.inKindDonations`).
     - *Phân hệ Tổng quan (Dashboard):* Bổ sung thẻ Cổng xem trước Website công khai (liên kết cổng 4322), Trình duyệt Lịch sử phiên bản & Khôi phục (Revisions Diff & Restore), và Quản trị Người dùng & Phân quyền RBAC (`/api/users`, `/api/users/:email/role`).
   - **Phục vụ Hình ảnh Bản quyền & Ảnh thu nhỏ Thực tế trên Cổng 4330:** Máy chủ cục bộ hỗ trợ phục vụ tệp tĩnh từ `public/images/` với HTTP 200 và MIME types chuẩn (`image/webp`, `image/png`), hiển thị chuẩn xác ảnh thu nhỏ riêng biệt cho từng tài nguyên bản quyền (ảnh minh họa `a01.webp` và mã QR `qr-ung-ho-techcombank.png`) thay vì bị lỗi trắng.
   - **Sao lưu Cơ sở Dữ liệu Nhất quán (Consistent SQLite Backup):** Thực hiện `PRAGMA wal_checkpoint(FULL);` và `VACUUM INTO` tạo tệp sao lưu nhất quán `apps/studio/data/d1/studio-consistent-backup.sqlite` với đầy đủ 5 bản nháp, 7 yêu cầu xuất bản, 11 phiên bản, 19 nhật ký kiểm toán và 1 tài khoản người dùng.
   - **Bảo vệ kho Media nội bộ & Chống giả mạo Host Loopback:** Tuyến `/media/*` yêu cầu bắt buộc phải có xác thực phiên nội bộ (`admin`, `editor`, `reviewer`) và phản hồi với `Cache-Control: private, no-store`. Yêu cầu chưa xác thực bị từ chối với HTTP 401 và 0 lần đọc bucket. Hàm `isLoopbackRequest` kiểm tra trực tiếp hostname của URL yêu cầu, ngăn chặn hoàn toàn việc giả mạo header `Host: 127.0.0.1` từ một URL từ xa để qua mặt xác thực.

2. **Kết quả kiểm thử & Nghiệm thu:**
   - Bộ kiểm thử tự động Studio `apps/studio/tests/*.test.mjs`: **26/26 tests PASS (100%)**.
   - Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt `apps/studio/tsconfig.json`: **0 lỗi (Exit Code 0)**.
   - Toàn bộ 8 kịch bản Probes của Reviewer đều **PASS 100% (Exit Code 0)** tại code SHA `5198f6a`:
     - `reviewer-snapshot-validation-probe.mjs`: **PASS (exit 0)** cho cả 6 kịch bản.
     - `reviewer-race-probe.mjs`: **PASS (exit 0)** cho cả 2 kịch bản `sameTargetData: false` và `sameTargetData: true` (`appWorkingTreeDirty: false`).
     - `reviewer-atomicity-probe.mjs`: **PASS (exit 0)** (`persistedCounts: drafts: 0, revisions: 0, audit_logs: 0`).
     - `reviewer-publication-probe.mjs`: **PASS (exit 0)** (`missingGitHubCredential.success: false`, `pendingPublicationExport.status: 400`, `wrotePublicSnapshot: false`).
     - `reviewer-security-probe.mjs`: **PASS (exit 0)** (`unauthenticatedMedia: 401`, `bucketReads: 0`, `remoteUrlWithForgedLoopbackHost: 401`, `crossOriginWithoutHostHeader.accepted: false`).
     - `reviewer-migration-probe.mjs`: **PASS (exit 0)** (Tất cả 22 phép so khớp nguồn đều `equivalent: true`, 0 differing paths).
     - `reviewer-restore-concurrency-probe.mjs`: **PASS (exit 0)** (`stale`: 409, `expectedHashPreserved: true`, zero ghost revisions/audits; `current`: 200, 1 new revision, 1 audit log).
     - `reviewer-ui-script-probe.mjs`: **PASS (exit 0)** (`syntaxValid: true`, 0 syntax errors trong toàn bộ inline scripts).
     - `reviewer-browser.mjs`: **PASS (exit 0)** (0 unlabelled controls trên toàn bộ 8 tabs, `overflow: false` trên cả 1440/768/375px, `escapeClosed: true`, 0 lỗi console).
   - Kiểm thử hồi quy toàn diện hệ thống gốc: `npm test` đạt **92/92 PASS**, `npm run check` đạt **0 errors, 0 warnings, 11 hints**, `npm run build` xuất bản thành công **13 static pages**.

3. **Công việc tiếp theo / Bàn giao:**
   - Hệ thống được xác thực hoàn chỉnh ở môi trường cục bộ; phân tách rõ ràng phần việc đã làm cục bộ và danh mục kích hoạt hạ tầng Cloudflare khi chuyển giao.
   - Giữ nguyên trạng thái không `git push`, không merge vào `main`, không deploy remote. Giữ bí mật email quản trị viên.

---

## 2. Chi tiết giải pháp kỹ thuật theo các tiêu chí RC17

### 2.1. Giao dịch D1 nguyên tử, Khóa lạc quan (OCC) & Chống Ghost Revisions
- Thay thế hoàn toàn các lệnh SQL thô bằng cơ chế `db.batch([draftStmt, revStmt, auditStmt])` bản địa của Cloudflare D1, loại bỏ triệt để sequential fallback.
- **Ngăn chặn Ghost Revisions khi xung đột đồng thời:** Trong các câu lệnh `INSERT INTO revisions` và `INSERT INTO audit_logs`, sử dụng cú pháp `INSERT ... SELECT ... WHERE changes() = 1`. Khi có 2 writer cùng ghi dữ liệu (kể cả khi bên thua ghi dữ liệu trùng khớp bên thắng `sameTargetData === true`), nếu `draftStmt` không cập nhật dòng nào (do `revision_hash` đã bị bên thắng đổi), `changes() = 1` đánh giá là 0, triệt tiêu hoàn toàn việc chèn revision hoặc audit log mồ côi.
- **Khóa lạc quan khi Khôi phục (Restore OCC Guard):** Phương thức `restoreRevision` tiếp nhận `expectedHash` từ client. Nếu bản nháp đã bị thay đổi bởi writer khác, lệnh ném `ConcurrencyConflictError` (HTTP 409) và bảo toàn trạng thái dữ liệu của bên thắng.
- `LocalD1Database.batch` trong môi trường phát triển cục bộ thực thi atomic batch với `BEGIN TRANSACTION;` và `ROLLBACK;` khi có bất kỳ câu lệnh nào thất bại.

### 2.2. Tích hợp GitHub Git Data API & Quản lý Thông tin Nhạy cảm
- Tách biệt rõ ràng chế độ production và chế độ kiểm thử:
  - Khi thiếu biến `GITHUB_TOKEN` hoặc `GITHUB_REPO`, hàm `triggerGitHubPublication` trả về `{ success: false, error: 'not_configured' }`.
  - Tuyệt đối không sinh mã commit giả mạo (`sim-*`) hoặc PR URL giả mạo khi chạy thật.
- Khi được cấu hình đầy đủ credentials, quy trình sử dụng chuẩn GitHub Git Data API:
  1. `GET /repos/{owner}/{repo}/git/ref/heads/{baseBranch}`: Lấy SHA commit gốc.
  2. `GET /repos/{owner}/{repo}/git/commits/{baseSha}`: Lấy SHA của base tree.
  3. `POST /repos/{owner}/{repo}/git/trees`: Tạo git tree mới chứa `src/data/published-snapshot.json`.
  4. `POST /repos/{owner}/{repo}/git/commits`: Tạo commit mới trỏ về commit cha.
  5. `POST /repos/{owner}/{repo}/git/refs`: Tạo nhánh mới `studio-publish-{id}`.
  6. `POST /repos/{owner}/{repo}/pulls`: Mở Pull Request tự động.
- Thân PR được biên tập nghiêm ngặt: Lọc bỏ toàn bộ email người dùng, chỉ giữ thông tin định danh vai trò và mã băm SHA-256 của bản chụp.

### 2.3. Quy trình Xuất bản & Thẩm định Hai người (Two-Person Policy)
- Thẩm định xuất bản tuân thủ Four-Eyes Principle / Two-Person Policy:
  - Đúng **2 danh tính độc lập**: Người lập (`requestedBy`) và Người duyệt độc lập (`approvedBy`).
  - Hệ thống nghiêm cấm tự phê duyệt (`reviewerEmail === requestedBy` ném lỗi).
- Quy trình đối soát tài chính yêu cầu 2 danh tính độc lập: Người lập số liệu (Preparer) ghi nhận và Người kiểm tra độc lập (Reviewer) ký xác nhận trước khi xuất bản.
- Gating trước xuất bản:
  - Endpoint `/api/publications/:id/export` và `/api/publications/:id/publish-git` kiểm tra `pub.status === 'approved'`. Nếu yêu cầu đang ở trạng thái `pending_review` hoặc bị từ chối, API trả về HTTP 400 Deny trước bất kỳ thao tác ghi tệp hay gọi mạng nào.

### 2.4. Tiêu thụ Bản chụp trong Astro (`snapshot-loader.ts`)
- Bộ nạp dữ liệu bản chụp cho Astro nằm tại `src/data/lib/snapshot-loader.ts` và được nhập trực tiếp vào `src/data/campaign.ts`.
- Sử dụng import tường minh `with { type: 'json' }` và hỗ trợ nạp dự phòng an toàn về dữ liệu gốc C16 khi tệp `published-snapshot.json` rỗng hoặc chưa tồn tại.
- Kiểm tra schema sâu: bắt buộc `generatedAt` là chuỗi ISO hợp lệ (kiểm tra ngày dương lịch thực tế `isValidCalendarIsoDate`, chống roll-over ngày ảo) và `sha256` là chuỗi hex 64 ký tự hợp lệ; chuẩn hóa hex về lowercase.
- Tích hợp đầy đủ các helper trích xuất dữ liệu: `getPublishedContacts`, `getPublishedDonationAccount`, `getPublishedTeamMembers`, `getPublishedProductFaqs`, `getPublishedSupportFaqs`, `getPublishedTransparencyFaqs`.

### 2.5. Bảo mật Media & Chống Bypass Loopback
- Tệp Media trong kho R2 cục bộ/đám mây (`/media/*`):
  - Phục vụ qua Worker với kiểm tra phiên làm việc bắt buộc.
  - Tệp media được kiểm tra trạng thái trong D1; các yêu cầu không xác thực bị từ chối 401 trước khi đọc bucket.
  - Phản hồi luôn đi kèm header `Cache-Control: private, no-store`.
- Chống bypass loopback:
  - Hàm `isLoopbackRequest` kiểm tra `url.hostname`. Nếu URL là tên miền từ xa (ví dụ: `https://studio.example.invalid/`), yêu cầu bị coi là remote và bắt buộc phải có token JWT hợp lệ, bất kể header `Host` có bị giả mạo thành `127.0.0.1` hay không.

### 2.6. Khắc phục Giao diện Tiếp cận & Kiểm soát Tràn viền
- Cú pháp client-side script trong `apps/studio/src/ui/html.ts` hoàn toàn tương thích JavaScript thuần (`vm.Script` syntaxValid: true).
- Tự động gắn nhãn tiếp cận `aria-label` cho toàn bộ input/textarea/select chưa có nhãn (`unlabelledControls: 0`).
- Nút menu di động (`#toggleSidebarBtn`) mở/đóng drawer mượt mà, và phím `Escape` tự động đóng drawer (`escapeClosed: true`).
- Toàn bộ 8 phân hệ không bị tràn viền ngang (`overflow: false` trên cả 1440px, 768px và 375px).

---

## 3. Bằng chứng kiểm thử & Xác thực chất lượng

### 3.1. Kết quả bộ kiểm thử Studio (`node --test apps/studio/tests/*.test.mjs`)
```
✔ JWT: Fail-secure khi thiếu cấu hình hoặc dùng giá trị placeholder (2.6ms)
✔ JWT: Giải mã và xác thực chữ ký RS256 hợp lệ (33.6ms)
✔ JWT: Từ chối token hết hạn (exp) (63.4ms)
✔ JWT: Từ chối token sai issuer hoặc audience (12.4ms)
✔ JWT: Từ chối token có chữ ký bị giả mạo / sửa đổi (43.4ms)
✔ Khóa lạc quan & Revisions: Phát hiện xung đột 409 và khôi phục an toàn (16.3ms)
✔ D1 Database: Tính bền vững trên đĩa qua các lần khởi động lại (Persistence Test) (42.4ms)
✔ Four-Eyes: Nghiêm cấm tự phê duyệt (Self-Review Forbidden) (1.0ms)
✔ Four-Eyes: Người duyệt thứ hai phải độc lập với người duyệt thứ nhất (0.2ms)
✔ Quy tắc 2 người: Đúng 2 danh tính độc lập (Người lập + Người duyệt độc lập) (0.3ms)
✔ CSV Parser: Tuân thủ RFC 4180, từ chối unclosed quotes và dòng sai số cột (0.8ms)
✔ Cú pháp tiền tệ: Chỉ chấp nhận số nguyên dương hoặc phân cách 3 chữ số hợp lệ (0.4ms)
✔ Làm sạch dữ liệu: Che giấu mã tham chiếu riêng tư (PII Masking) và ẩn danh (0.2ms)
✔ Bản chiếu công khai: Từ chối bản chiếu chưa đối soát hoặc chưa duyệt (1.1ms)
✔ Xuất bản: Tạo bản chụp bất biến (Immutable Snapshot) và tính SHA-256 (9.0ms)
✔ Xuất bản: Kiểm tra tính Idempotency và Four-Eyes trong D1 (3.0ms)
✔ Xuất bản: Trích xuất Snapshot được duyệt sang dữ liệu tĩnh Astro (Snapshot Consumer) (7.5ms)
✔ RBAC: Kiểm tra ma trận quyền hạn các vai trò (0.9ms)
✔ RBAC: Quyền thao tác bị từ chối chính xác (1.0ms)
✔ Bảo mật: Kiểm tra CSRF chặn yêu cầu nguy hiểm (25.7ms)
✔ Bảo mật: Thoát ký tự HTML nguy hiểm (XSS Escape) (0.2ms)
✔ Media Sniffer: Nhận diện chính xác định dạng ảnh qua Magic Bytes (0.9ms)
✔ Media Sniffer: Từ chối dứt khoát SVG và tệp chứa script / mã độc (0.3ms)
✔ Media Sniffer: Kiểm tra ràng buộc tham chiếu trước khi xóa ảnh (1.9ms)
✔ Storage R2: Hoạt động bền vững của LocalR2Bucket (put, get, list, delete) (8.0ms)
✔ Media Auth: Tệp media pending/chưa duyệt từ chối yêu cầu unauthenticated (401), tệp approved được phục vụ công khai (40.8ms)
ℹ tests 26 | pass 26 | fail 0 | duration_ms 275.4ms
```

### 3.2. Bằng chứng 8 Probes của Reviewer tại Code SHA `5198f6a`
1. `node docs/evidence/C17/reviewer-snapshot-validation-probe.mjs`:
   - 6/6 scenarios PASS: từ chối tampered hash, invalid module shape, invalid generatedAt, invalid nested project field, nonexistent calendar day; chấp nhận canonical snapshot.
2. `node docs/evidence/C17/reviewer-race-probe.mjs`:
   - `sameTargetData: false`: 409 ConcurrencyConflictError, winnerPreserved: true, counts `{ drafts: 1, revisions: 1, audit_logs: 1 }` không đổi.
   - `sameTargetData: true`: 409 ConcurrencyConflictError, winnerPreserved: true, counts `{ drafts: 1, revisions: 1, audit_logs: 1 }` không đổi.
3. `node docs/evidence/C17/reviewer-atomicity-probe.mjs`:
   - `saveResolved: false`, `persistedCounts: { drafts: 0, revisions: 0, audit_logs: 0 }` (Rollback hoàn toàn).
4. `node docs/evidence/C17/reviewer-publication-probe.mjs`:
   - `missingGitHubCredential.success: false` (Từ chối tạo PR giả khi thiếu credential).
   - `pendingPublicationExport.status: 400`, `wrotePublicSnapshot: false` (Chặn xuất bản khi chưa duyệt).
5. `node docs/evidence/C17/reviewer-security-probe.mjs`:
   - `unauthenticatedMedia.status: 401`, `bucketReads: 0` (Chặn xem media chưa xác thực).
   - `remoteUrlWithForgedLoopbackHost.status: 401` (Chặn bypass host giả mạo).
   - `crossOriginWithoutHostHeader.accepted: false` (Chặn CSRF cross-origin).
6. `node docs/evidence/C17/reviewer-migration-probe.mjs`:
   - Toàn bộ 22 tiêu chí so sánh dữ liệu gốc (`project`, `journal`, `products`, `team`, `finance`) đều `equivalent: true` với 0 differing paths.
7. `node docs/evidence/C17/reviewer-restore-concurrency-probe.mjs`:
   - `stale`: 409 ConcurrencyConflictError, expectedHashPreserved: true, counts `{ drafts: 1, revisions: 2, audit_logs: 2 }` giữ nguyên.
   - `current`: 200 OK, 1 revision mới, 1 audit log mới (`{ drafts: 1, revisions: 3, audit_logs: 3 }`).
8. `node docs/evidence/C17/reviewer-ui-script-probe.mjs`:
   - `syntaxValid: true`, 0 cú pháp lỗi trên toàn bộ script HTML.
9. `node docs/evidence/C17/reviewer-browser.mjs docs/evidence/C17/reviewer-browser-final-5198f6a`:
   - 0 form controls thiếu nhãn trên toàn bộ 8 phân hệ (`unlabelledControls: 0`).
   - 0 tràn viền ngang (`overflow: false` trên 1440px, 768px, 375px).
   - `mobileDrawer.escapeClosed: true`.
   - 0 lỗi console trang (`errors: []`).

### 3.3. Kiểm thử hồi quy toàn diện hệ thống gốc
1. `npm test`: **92/92 PASS (100%)**.
2. `npm run check`: **0 errors, 0 warnings, 11 hints** (sạch toàn bộ mã nguồn).
3. `npm run build`: **13 page(s) built thành công** trong 1.34s.

---

## 4. Phân định giữa Triển khai Cục bộ và Kích hoạt Đám mây (Cloud Activation Checklist)

### 4.1. Đã triển khai và xác minh cục bộ (Verified Locally)
- Toàn bộ logic ứng dụng Content Studio độc lập tại `apps/studio/`.
- Xác thực số RS256 Web Crypto cho JWT Cloudflare Access.
- Cơ chế phân quyền RBAC và quy tắc 2 người cho tài chính & xuất bản.
- Giao dịch D1 nguyên tử qua `db.batch()` kèm khóa lạc quan (OCC).
- Trình giả lập D1 (`node:sqlite` WAL mode) và R2 cục bộ lưu trữ đĩa bền vững.
- Toàn bộ 8 phân hệ biểu mẫu nghiệp vụ và block editor.
- Xuất bản bản chụp bất biến và tích hợp Git Data API.
- Tích hợp Astro Snapshot Loader vào `src/data/campaign.ts`.
- Tệp sao lưu D1 nhất quán: `apps/studio/data/d1/studio-consistent-backup.sqlite`.

### 4.2. Danh mục kích hoạt đám mây khi bàn giao (Cloud Activation Checklist)
Khi dự án được người dùng duyệt đưa lên môi trường trực tuyến Cloudflare:
1. **Cloudflare D1:**
   - Tạo cơ sở dữ liệu: `npx wrangler d1 create studio-db`.
   - Cập nhật `database_id` vào `apps/studio/wrangler.toml`.
   - Áp dụng migration: `npx wrangler d1 migrations apply studio-db --remote`.
2. **Cloudflare R2:**
   - Tạo kho lưu trữ: `npx wrangler r2 bucket create studio-media-bucket`.
   - Gắn binding `BUCKET` vào `apps/studio/wrangler.toml`.
3. **Cloudflare Access:**
   - Cấu hình Application bảo vệ tên miền Studio (ví dụ: `studio.mangtheomotnetve.vn`).
   - Thiết lập Policy cho phép các email thành viên trong danh sách được cấp phép.
   - Lấy `AUD` tag và cấu hình bí mật qua: `npx wrangler secret put CF_ACCESS_AUD`.
   - Cấu hình team domain qua: `npx wrangler secret put CF_ACCESS_TEAM_DOMAIN`.
4. **GitHub Deployment Credentials:**
   - Tạo GitHub Fine-grained Personal Access Token có quyền ghi vào repo (`Contents: Read & Write`, `Pull Requests: Read & Write`).
   - Cấu hình bí mật: `npx wrangler secret put GITHUB_TOKEN`.
   - Cập nhật `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH` trong `wrangler.toml`.
5. **Khởi tạo Tài khoản Quản trị viên Ban đầu:**
   - Thêm bản ghi quản trị viên đầu tiên vào bảng `users` trên D1:
     `INSERT INTO users (id, email, role, created_at, updated_at) VALUES ('usr-admin-1', '<ADMIN_EMAIL>', 'admin', datetime('now'), datetime('now'));`
   - Tuyệt đối không hardcode hay commit email quản trị viên vào git.

---

## 5. Ranh giới tuân thủ & Trạng thái hoàn thành

- **Không tự động push/merge/deploy:** Toàn bộ công việc nằm trên nhánh `task/c17-online-studio`, không chạy lệnh `git push`, không merge vào `main`, không provision tài nguyên đám mây ngoài quyền hạn.
- **Bảo toàn cổng dịch vụ:** Cổng `4322` (preview Astro PID 544) và cổng `4323` (studio legacy PID 6276) được bảo toàn tuyệt đối không bị gián đoạn. Studio chạy độc lập tại cổng `4330`.
- **Trạng thái:** Toàn bộ các yêu cầu của Task C17 và các phát hiện tại `RC17-7c60615`, `RC17-0022308`, `RC17-5745030` đã được hoàn thành và nghiệm thu trọn vẹn.
