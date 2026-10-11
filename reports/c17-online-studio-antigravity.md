# Báo cáo triển khai Task C17: Content Studio Trực tuyến (Cloudflare Access, D1, R2)

- **Người thực hiện:** Antigravity (Application & Infrastructure Worker)
- **Quản lý & Reviewer:** Codex (Coordinator)
- **Nhánh thực hiện:** `task/c17-online-studio`
- **Mã Task Orchestration:** `task_433a9e96bd49`
- **Mã Dispatch Context:** `ctx_344fb2d316b5`
- **Mã Run ID:** `run_2d9a78aa172e`
- **Terminal Worker:** `term_d5e2a3fc-8366-4cc8-9ff1-60f502e1f1aa`
- **Terminal Coordinator:** `term_e13006d0-5301-46a1-a539-870175ca971e`
- **Mã Baseline SHA:** `89e82e65eece577d36c77f76798a8f009fb13e18`
- **Mã Code Commit SHA:** `764f28caedd95ffab46f958be85ba7c3f0aa5118`
- **Ngày hoàn thành:** 11/10/2026

---

## 1. Tóm tắt kết quả thực hiện (Executive Summary)

1. **Đã thực hiện:**
   - Xây dựng hoàn chỉnh ứng dụng Content Studio độc lập tại thư mục `apps/studio/` dưới dạng Cloudflare Worker, tích hợp xác thực chữ ký số **RS256 Web Crypto** cho Cloudflare Access JWT, phân quyền vai trò **Server-side RBAC** (`admin`, `editor`, `reviewer`), quy tắc **Bốn Mắt (Four-Eyes Principle)** đối với thẩm định tài chính, lưu trữ bền vững với **D1 Database** và **R2 Storage**, cơ chế **Khóa lạc quan (Optimistic Concurrency Control)** chống xung đột ghi đè, và bộ lọc **Magic Bytes Media Sniffer** từ chối SVG/mã độc.
   - Xây dựng giao diện trực quan tiếng Việt chuẩn bảng màu phẳng C16 với thanh điều hướng đa thiết bị (Desktop 1440px, Tablet 768px, Mobile 375px kèm mobile drawer), trang bị **biểu mẫu nghiệp vụ chuyên biệt cho toàn bộ 8 phân hệ** (không dùng raw JSON editor mặc định).
   - Thiết lập máy chủ HTTP cục bộ độc lập trên cổng **4330**, sử dụng `node:sqlite` (`DatabaseSync`) và hệ thống tệp cục bộ để giả lập D1 và R2 bền vững qua các lần khởi động lại máy chủ; bảo toàn tuyệt đối 2 cổng dịch vụ đang chạy: cổng `4322` (Astro preview) và cổng `4323` (Local studio legacy).

2. **Kết quả kiểm thử & Nghiệm thu:**
   - Bộ kiểm thử tự động độc lập `apps/studio/tests/*.test.mjs` đạt **23/23 tests PASS (100%)** bao gồm: JWT RS256 Web Crypto, Fail-secure Deny khi thiếu cấu hình, RBAC permissions, CSRF, XSS escaping, Magic bytes sniffing & SVG rejection, R2 emulator CRUD, Four-Eyes principle, RFC 4180 CSV parser & PII masking, Optimistic Concurrency Control (409 Conflict), Snapshot immutability & SHA-256, và D1 disk persistence across restarts.
   - Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt `apps/studio/tsconfig.json`: **0 lỗi**.
   - Kiểm tra hồi quy toàn diện hệ thống gốc: `npm test` đạt **92/92 PASS**, `npm run check` đạt **0 errors, 0 warnings, 8 hints**, `npm run build` xuất bản thành công **13 static pages**.
   - Chụp toàn bộ bằng chứng màn hình xác thực đa thiết bị tại `docs/evidence/C17/worker/screens/` và nhật ký kiểm thử tích hợp tại `docs/evidence/C17/worker/verification-results.json`.

3. **Công việc tiếp theo / Bàn giao:**
   - Hệ thống sẵn sàng cho bước kích hoạt đám mây khi có cấu hình Cloudflare chính thức từ quản trị viên (theo checklist chi tiết trong `apps/studio/README.md`).
   - Giữ nguyên trạng thái không `git push`, không `git merge`, không deploy remote. Giữ bí mật email quản trị viên đầu tiên.

---

## 2. Chi tiết kiến trúc và các phân hệ đã triển khai

### 2.1. Xác thực Cloudflare Access & Fail-Secure Policy (`src/auth/jwt.ts`, `src/auth/middleware.ts`)
- **Thuật toán chữ ký số:** RS256 sử dụng Web Crypto API (`crypto.subtle.importKey`, `crypto.subtle.verify`).
- **Xác thực toàn diện các claims:**
  - `iss`: Bắt buộc khớp chuẩn `https://<team-domain>.cloudflareaccess.com`.
  - `aud`: Khớp chính xác Application Audience Tag được cấu hình.
  - `exp` & `nbf`: Kiểm tra thời hạn và thời điểm hiệu lực của token.
  - `identity`: Trích xuất email người dùng từ payload. Không bao giờ tin tưởng header `Cf-Access-Authenticated-User-Email` mà không có chữ ký số hợp lệ.
- **Fail-Secure Deny:** Khi chạy ở chế độ Production (`STUDIO_ENVIRONMENT=production`), nếu thiếu biến `CF_ACCESS_TEAM_DOMAIN` hoặc `CF_ACCESS_AUD`, hoặc nếu các biến này giữ giá trị placeholder (`example-team...`, `000000...`), hệ thống lập tức từ chối truy cập (HTTP 500/401) để ngăn chặn rò rỉ dữ liệu.
- **Local Dev Mode:** Hỗ trợ chuyển đổi vai trò (`admin`, `editor`, `reviewer`) linh hoạt phục vụ kiểm thử cục bộ thông qua header `x-dev-user`, cookie `studio_dev_role`, hoặc query parameter `?dev_role=...`.

### 2.2. Phân quyền Server-Side RBAC & Quy tắc Bốn Mắt (`src/auth/rbac.ts`)
- **Ma trận vai trò:**
  - `admin`: Toàn quyền chỉnh sửa bản nháp, thẩm định, kích hoạt xuất bản toàn trang, và quản lý tài khoản.
  - `editor`: Soạn thảo và lưu bản nháp, tải ảnh lên thư viện, gửi yêu cầu xuất bản (bị chặn quyền tự duyệt).
  - `reviewer`: Thẩm định nội dung, kiểm tra đối soát, phê duyệt yêu cầu xuất bản (bị chặn quyền sửa trực tiếp bản nháp).
- **Quy tắc Bốn Mắt (Four-Eyes Principle) trên dữ liệu tài chính:**
  - Người tạo đề xuất đối soát tài chính không được tự phê duyệt (`currentReviewer !== author`).
  - Phê duyệt chính thức bắt buộc phải có đủ **2 người duyệt độc lập khác nhau** (`firstReviewer !== secondReviewer`).
- **Phòng chống tấn công:**
  - CSRF: Kiểm tra nghiêm ngặt `Sec-Fetch-Site: cross-site` và so khớp `Origin` với `Host` trên toàn bộ các endpoint thay đổi dữ liệu.
  - XSS: Lọc và thoát các ký tự HTML nguy hiểm (`escapeHtml`).

### 2.3. Cơ sở dữ liệu D1 & Khóa lạc quan (`src/db/emulator.ts`, `src/db/client.ts`, `migrations/0001_initial_schema.sql`)
- **Schema D1 SQLite:**
  - `users`: Quản lý định danh email và vai trò RBAC (`admin`, `editor`, `reviewer`).
  - `drafts`: Lưu trữ bản nháp làm việc của 8 phân hệ kèm mã băm `revision_hash` (SHA-256).
  - `revisions`: Lưu lịch sử phiên bản chi tiết (version 1, 2, 3...) cho từng phân hệ, hỗ trợ khôi phục không phá hủy.
  - `publications`: Quản lý yêu cầu xuất bản, snapshot JSON, trạng thái 2 cấp phê duyệt, trạng thái triển khai, lỗi và `idempotency_key` chống nhân đôi yêu cầu.
  - `audit_logs`: Ghi nhận lịch sử kiểm toán toàn bộ hành động (ai làm gì, thời điểm nào, chi tiết thay đổi, IP).
  - `media_assets`: Quản lý metadata hình ảnh, alt text, caption, credit tác quyền, trạng thái minh họa / ảnh thật.
- **Optimistic Concurrency Control (OCC):**
  - Trước khi lưu bản nháp, client gửi kèm `expectedHash`. Nếu bản nháp trên server đã bị người khác lưu trước (mã băm thay đổi), server ném lỗi `ConcurrencyConflictError` (HTTP 409 Conflict), bảo vệ dữ liệu không bị vô tình ghi đè.
- **Giả lập D1 cục bộ bền vững:**
  - Sử dụng module gốc `node:sqlite` (`DatabaseSync`) của Node.js 22/24 với chế độ `PRAGMA journal_mode = WAL;`.
  - Dữ liệu lưu vào tệp đĩa `apps/studio/data/d1/studio.sqlite`, hoàn toàn bền vững qua các lần khởi động lại máy chủ.

### 2.4. Lưu trữ Media & Bộ lọc Magic Bytes (`src/storage/emulator.ts`, `src/storage/media-sniffer.ts`)
- **Xác thực Magic Bytes:**
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - WebP: `52 49 46 46` ... `57 45 42 50`
  - AVIF: `....ftypavif` / `....ftypavis`
- **Từ chối SVG & Script:** Loại bỏ dứt khoát tệp chứa cú pháp `<svg`, `<script`, `<?xml`, `<html` vì nguy cơ chứa mã JavaScript thực thi.
- **Kiểm soát kích thước:** Giới hạn tối đa 5MB mỗi tệp.
- **Kiểm tra ràng buộc sử dụng (Asset Usage Guard):** Trước khi xóa một tệp ảnh trong thư viện, hệ thống quét toàn bộ các bản nháp đang có; nếu ảnh đang được liên kết trong bất kỳ phân hệ nào, yêu cầu xóa sẽ bị từ chối với thông báo rõ ràng về phân hệ đang sử dụng.
- **Giả lập R2 cục bộ:** Lưu trữ blob và metadata `.meta.json` tại `apps/studio/data/r2/`.

### 2.5. Biểu mẫu nghiệp vụ chuyên biệt cho 8 phân hệ (`src/ui/html.ts`)
1. **Phân hệ 1: Tổng quan (Dashboard):** Thống kê xuất bản, trạng thái đồng bộ, liên kết nhanh tới 7 phân hệ, tóm tắt audit logs gần nhất.
2. **Phân hệ 2: Dự án & Thông điệp (Project):** Form chỉnh sửa Tiêu đề, Khẩu hiệu, Tóm tắt, Trạng thái (unknown, in_progress, completed), 4 hoạt động góc chơi, các giai đoạn triển khai, nhu cầu và thực hành an toàn.
3. **Phân hệ 3: Nhật ký hành trình (Journal):** Quản lý danh sách bài viết thực địa, form biên tập (Tiêu đề, Tóm tắt, Danh mục, Ngày công bố, Khối nội dung, Ảnh bìa kèm caption và credit), tách biệt bài nháp (draft isolation).
4. **Phân hệ 4: Thư viện Media (Media Library):** Tải ảnh lên R2, xác thực Magic Bytes, quản lý Alt text tiếp cận, Chú thích (Caption), Tác quyền (Credit), kiểm tra ràng buộc tham chiếu trước khi xóa.
5. **Phân hệ 5: Sản phẩm & Mở bán (Products):** Cấu hình mở bán từng SKU (`chuon-chuon-tre-kem-de`, `moc-khoa`): Trạng thái mở bán (unconfirmed, open, closed), Giá niêm yết chính thức (VND), Số lượng tồn kho sẵn có, Kênh phân phối, Chính sách đổi trả, Phê duyệt công khai.
6. **Phân hệ 6: Tài chính & Sao kê (Finance & Reconciliation):** Quản lý đối soát sao kê: Toggle trạng thái đối soát (reconciled: true/false), Ngày chốt đối soát, Phê duyệt công khai, Form tải lên CSV sao kê ngân hàng với bộ kiểm định RFC 4180 và số tiền nghiêm ngặt, bảng xem trước giao dịch che mã PII an toàn (`...XXXX`).
7. **Phân hệ 7: Nhóm, FAQ & SEO (Team/FAQ/SEO):** Form thông tin 7 thành viên nhóm Lăng Kính, Nguyên tắc hoạt động, Phân công 5 mảng việc, Câu hỏi thường gặp FAQ, Cấu hình thẻ SEO Meta (Title, Description, og:image).
8. **Phân hệ 8: Lịch sử & Xuất bản (Publish/History):** Tạo bản chụp xuất bản độc lập (Snapshot SHA-256), So sánh khác biệt (Diff viewer), Quy trình phê duyệt Bốn Mắt (Người duyệt 1, Người duyệt 2 độc lập), Lịch sử xuất bản kèm trạng thái triển khai (unknown, building, success, failed).
- **Cảnh báo thay đổi chưa lưu:** Sử dụng sự kiện `beforeunload` và chỉ báo trực quan màu cam ở thanh tiêu đề khi form đang dirty.

### 2.6. Tạo bản chụp xuất bản (Publication Snapshot Adapter - `src/publish/adapter.ts`)
- Khi yêu cầu xuất bản được tạo, hệ thống trích xuất dữ liệu từ các bản nháp và thực hiện làm sạch nghiêm ngặt:
  - Loại bỏ toàn bộ bài viết có trạng thái `draft` khỏi danh mục bài viết công khai.
  - Đối với phân hệ tài chính: Nếu chưa đối soát hoặc chưa được duyệt (`publicApproval !== 'approved'`), danh sách giao dịch công khai bắt buộc phải để rỗng; khi đã đối soát xong, toàn bộ mã tham chiếu cá nhân đều được che giấu an toàn (`...XXXX`).
  - Tính mã băm toàn vẹn SHA-256 của toàn bộ dữ liệu xuất bản.
  - Dữ liệu website công khai trong `src/data/` hoặc `dist/` được giữ nguyên vẹn cho đến khi quy trình duyệt 2 cấp hoàn tất và kích hoạt build.

---

## 3. Bằng chứng kiểm thử & Xác thực chất lượng

### 3.1. Kết quả bộ kiểm thử Studio (`npm run studio:test`)
Chạy qua lệnh `node --test apps/studio/tests/*.test.mjs`:
```
✔ JWT: Fail-secure khi thiếu cấu hình hoặc dùng giá trị placeholder (3.3ms)
✔ JWT: Giải mã và xác thực chữ ký RS256 hợp lệ (59.5ms)
✔ JWT: Từ chối token hết hạn (exp) (113.6ms)
✔ JWT: Từ chối token sai issuer hoặc audience (23.9ms)
✔ JWT: Từ chối token có chữ ký bị giả mạo / sửa đổi (49.9ms)
✔ Khóa lạc quan & Revisions: Phát hiện xung đột 409 và khôi phục an toàn (15.3ms)
✔ D1 Database: Tính bền vững trên đĩa qua các lần khởi động lại (Persistence Test) (49.2ms)
✔ Four-Eyes: Nghiêm cấm tự phê duyệt (Self-Review Forbidden) (1.0ms)
✔ Four-Eyes: Người duyệt thứ hai phải độc lập với người duyệt thứ nhất (0.2ms)
✔ CSV Parser: Tuân thủ RFC 4180, từ chối unclosed quotes và dòng sai số cột (0.8ms)
✔ Cú pháp tiền tệ: Chỉ chấp nhận số nguyên dương hoặc phân cách 3 chữ số hợp lệ (0.4ms)
✔ Làm sạch dữ liệu: Che giấu mã tham chiếu riêng tư (PII Masking) và ẩn danh (0.3ms)
✔ Bản chiếu công khai: Từ chối bản chiếu chưa đối soát hoặc chưa duyệt (1.1ms)
✔ Xuất bản: Tạo bản chụp bất biến (Immutable Snapshot) và tính SHA-256 (8.5ms)
✔ Xuất bản: Kiểm tra tính Idempotency và Four-Eyes trong D1 (2.9ms)
✔ RBAC: Kiểm tra ma trận quyền hạn các vai trò (1.0ms)
✔ RBAC: Quyền thao tác bị từ chối chính xác (0.7ms)
✔ Bảo mật: Kiểm tra CSRF chặn yêu cầu nguy hiểm (24.9ms)
✔ Bảo mật: Thoát ký tự HTML nguy hiểm (XSS Escape) (0.2ms)
✔ Media Sniffer: Nhận diện chính xác định dạng ảnh qua Magic Bytes (0.9ms)
✔ Media Sniffer: Từ chối dứt khoát SVG và tệp chứa script / mã độc (0.3ms)
✔ Media Sniffer: Kiểm tra ràng buộc tham chiếu trước khi xóa ảnh (0.9ms)
✔ Storage R2: Hoạt động bền vững của LocalR2Bucket (put, get, list, delete) (9.8ms)
ℹ tests 23 | pass 23 | fail 0 | duration_ms 342.1ms
```

### 3.2. Kết quả kiểm tra kiểu dữ liệu TypeScript (`npm run studio:typecheck`)
- Lệnh: `tsc --noEmit -p apps/studio/tsconfig.json`
- Kết quả: **0 lỗi (Exit Code 0)**.

### 3.3. Kiểm thử hồi quy toàn diện hệ thống gốc
1. `npm test`: **92/92 PASS (100%)**.
2. `npm run check`: **0 errors, 0 warnings, 8 hints** (khớp chuẩn baseline).
3. `npm run build`: **13 page(s) built thành công** (Exit Code 0).

### 3.4. Bằng chứng kiểm thử tích hợp máy chủ cổng 4330
Chạy qua kịch bản `docs/evidence/C17/worker/verify-studio.mjs`:
- `[PASS]` UI HTML: Trả về HTTP 200 và đủ 8 phân hệ điều hướng
- `[PASS]` API Auth: `/api/me` trả về thông tin người dùng dev-admin
- `[PASS]` API Drafts: `/api/drafts/project` nạp thành công và có mã băm revision
- `[PASS]` API Drafts: `/api/drafts/journal` nạp thành công và có mã băm revision
- `[PASS]` API Drafts: `/api/drafts/products` nạp thành công và có mã băm revision
- `[PASS]` API Drafts: `/api/drafts/finance` nạp thành công và có mã băm revision
- `[PASS]` API Drafts: `/api/drafts/team` nạp thành công và có mã băm revision
- `[PASS]` API Drafts: Lưu bản nháp thành công có khóa lạc quan
- `[PASS]` API OCC: Báo lỗi 409 Conflict khi gửi mã băm cũ
- `[PASS]` API Publication: Tạo yêu cầu xuất bản và duy trì Idempotency
- `[PASS]` API Audit Logs: Ghi nhật ký đầy đủ các hành động

### 3.5. Danh mục ảnh chụp màn hình xác thực giao diện đa thiết bị
Lưu tại thư mục `docs/evidence/C17/worker/screens/`:
1. `studio-dashboard-1440.png`: Màn hình Tổng quan trên Desktop 1440px.
2. `studio-project-1440.png`: Form biên tập phân hệ Dự án & Thông điệp trên Desktop 1440px.
3. `studio-products-1440.png`: Form cấu hình Mở bán Sản phẩm trên Desktop 1440px.
4. `studio-finance-1440.png`: Form Thẩm định & Đối soát Sao kê CSV trên Desktop 1440px.
5. `studio-publish-1440.png`: Giao diện Tạo yêu cầu xuất bản & Quy trình Bốn Mắt trên Desktop 1440px.
6. `studio-dashboard-768.png`: Giao diện Tổng quan trên Tablet 768px.
7. `studio-drawer-open-375.png`: Giao diện Drawer điều hướng mở trên Mobile 375px.
8. `studio-dashboard-375.png`: Giao diện Tổng quan trên Mobile 375px.

---

## 4. Danh mục tệp tin được tạo mới / sửa đổi

### 4.1. Ứng dụng Content Studio (`apps/studio/`)
- `apps/studio/package.json`: Khai báo gói, dependencies, và các lệnh npm.
- `apps/studio/package-lock.json`: Lockfile v3 reproducible.
- `apps/studio/tsconfig.json`: Cấu hình biên dịch TypeScript nghiêm ngặt (ES2022/Bundler).
- `apps/studio/wrangler.toml`: Cấu hình Cloudflare Worker, D1 database binding, R2 bucket binding, và biến môi trường Access.
- `apps/studio/README.md`: Hướng dẫn vận hành, kiến trúc, kiểm thử và checklist kích hoạt Cloudflare.
- `apps/studio/local-server.mjs`: Entrypoint khởi chạy máy chủ Node cục bộ cổng 4330.
- `apps/studio/migrations/0001_initial_schema.sql`: D1 migration tạo 6 bảng dữ liệu (`users`, `drafts`, `revisions`, `publications`, `audit_logs`, `media_assets`).
- `apps/studio/src/types.ts`: Hệ thống kiểu dữ liệu trung tâm cho Auth, D1, R2, Modules, Snapshots.
- `apps/studio/src/types/csv-validator.d.ts`: Khai báo kiểu dữ liệu cho module kiểm tra CSV.
- `apps/studio/src/auth/jwt.ts`: Trình giải mã và xác thực chữ ký số RS256 Web Crypto, kiểm tra issuer, aud, exp, nbf, JWKS certs, và fail-secure deny.
- `apps/studio/src/auth/rbac.ts`: Phân quyền vai trò RBAC, quy tắc Bốn Mắt cho tài chính, XSS escape.
- `apps/studio/src/auth/middleware.ts`: Middleware xác thực request, nhận diện token hoặc dev user, kiểm tra CSRF.
- `apps/studio/src/db/emulator.ts`: `LocalD1Database` tương thích D1Database backed by `node:sqlite` (`DatabaseSync`) với WAL mode và disk persistence.
- `apps/studio/src/db/schema.sql`: Tệp schema đồng bộ cho máy chủ cục bộ.
- `apps/studio/src/db/client.ts`: `StudioDbClient` quản lý drafts, khóa lạc quan (OCC), revisions, audit logs, publications có idempotency và four-eyes, media assets.
- `apps/studio/src/storage/emulator.ts`: `LocalR2Bucket` tương thích R2Bucket lưu trữ tệp trên đĩa cục bộ.
- `apps/studio/src/storage/media-sniffer.ts`: Bộ kiểm tra Magic bytes (JPEG, PNG, WebP, AVIF), từ chối SVG/script/HTML, kiểm tra giới hạn 5MB, kiểm tra ràng buộc tham chiếu trước khi xóa.
- `apps/studio/src/schemas/index.ts`: Định nghĩa schema, validator và default seed data loader cho toàn bộ 8 phân hệ.
- `apps/studio/src/publish/adapter.ts`: Bộ tạo bản chụp xuất bản (Publication Snapshot) độc lập, làm sạch dữ liệu, tính SHA-256.
- `apps/studio/src/api/router.ts`: REST API router xử lý auth, drafts, revisions, media, CSV import, audit logs, publications.
- `apps/studio/src/ui/html.ts`: Trình dựng giao diện HTML tiếng Việt phẳng C16 đa thiết bị với biểu mẫu nghiệp vụ cho toàn bộ 8 phân hệ, diff viewer, dirty warning, dev-role switcher.
- `apps/studio/src/worker.ts`: Cloudflare Worker entrypoint với `fetch(request, env, ctx)` handler.
- `apps/studio/src/server.ts`: Máy chủ HTTP cục bộ chạy cổng 4330 sử dụng Node `http` và Web Request/Response adapter.

### 4.2. Bộ kiểm thử (`apps/studio/tests/`)
- `apps/studio/tests/auth-jwt.test.mjs`: Kiểm thử xác thực RS256 JWT, exp, nbf, issuer, audience, forged signature, fail-secure deny.
- `apps/studio/tests/rbac-security.test.mjs`: Kiểm thử phân quyền RBAC, phòng chống CSRF, XSS escaping.
- `apps/studio/tests/storage-media.test.mjs`: Kiểm thử magic bytes sniffing, từ chối SVG, kiểm tra ràng buộc tham chiếu, LocalR2Bucket.
- `apps/studio/tests/finance-four-eyes.test.mjs`: Kiểm thử quy tắc Bốn Mắt, RFC 4180 CSV parser, ngữ pháp tiền tệ, PII masking.
- `apps/studio/tests/concurrency-revisions.test.mjs`: Kiểm thử khóa lạc quan (409 Conflict), lịch sử revisions, khôi phục an toàn.
- `apps/studio/tests/publication-snapshot.test.mjs`: Kiểm thử tạo snapshot bất biến, SHA-256, cách ly bản nháp, idempotency key.
- `apps/studio/tests/d1-persistence.test.mjs`: Kiểm thử độ bền vững của cơ sở dữ liệu D1 qua các lần khởi động lại máy chủ.

### 4.3. Cấu hình gốc dự án
- `package.json`: Bổ sung các lệnh npm tiện ích (`studio:start`, `studio:test`, `studio:typecheck`, `studio:build`).
- `tsconfig.json`: Bổ sung `"exclude": ["apps"]` để phân định môi trường biên dịch của Astro và Worker.

### 4.4. Bằng chứng kiểm thử & Báo cáo
- `docs/evidence/C17/worker/verify-studio.mjs`: Kịch bản kiểm thử tích hợp trên cổng 4330.
- `docs/evidence/C17/worker/verification-results.json`: Kết quả chi tiết của kịch bản kiểm thử tích hợp.
- `docs/evidence/C17/worker/capture-studio-screens.mjs`: Kịch bản chụp màn hình tự động đa kích thước.
- `docs/evidence/C17/worker/screens/*.png`: 8 ảnh chụp màn hình hoàn chỉnh.
- `reports/c17-online-studio-antigravity.md`: Báo cáo chi tiết hiện tại.

---

## 5. Ranh giới tuân thủ & Trạng thái hoàn thành

- **Không tự động push/merge/deploy:** Toàn bộ công việc được thực hiện trên nhánh `task/c17-online-studio`, không chạy lệnh `git push`, không merge vào `main`, không provision cloud resources.
- **Bảo toàn dữ liệu gốc:** Không sửa đổi các tệp dữ liệu công khai trong `src/data/`, không sửa đổi layout Astro công khai.
- **Bảo toàn cổng dịch vụ:** Cổng `4322` (preview PID 544) và cổng `4323` (studio legacy PID 6276) giữ nguyên vẹn không bị gián đoạn. Studio mới hoạt động độc lập trên cổng `4330`.
- **Trạng thái:** Toàn bộ tiêu chí nghiệm thu của Task C17 đã hoàn tất xuất sắc.
