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
- **Mã Code Commit SHA:** `7c60615984088eda74eba3f901fb31ad527c6c36` (commit `7c60615`)
- **Ngày hoàn thành:** 11/10/2026

---

## 1. Tóm tắt kết quả thực hiện (Executive Summary)

1. **Đã thực hiện:**
   - Xây dựng hoàn chỉnh ứng dụng Content Studio độc lập tại thư mục `apps/studio/` dưới dạng Cloudflare Worker, tích hợp xác thực chữ ký số **RS256 Web Crypto** cho Cloudflare Access JWT, phân quyền vai trò **Server-side RBAC** (`admin`, `editor`, `reviewer`), quy tắc **Bốn Mắt (Two-Person Policy / Four-Eyes Principle)** đối với thẩm định tài chính, lưu trữ bền vững với **D1 Database** và **R2 Storage**, cơ chế **Khóa lạc quan (Optimistic Concurrency Control)** chống xung đột ghi đè với giao dịch nguyên tử (Atomic SQLite Transaction: Draft UPDATE + Revision INSERT + Audit Log INSERT), và bộ lọc **Magic Bytes Media Sniffer** từ chối SVG/mã độc kèm cơ chế bảo vệ ảnh nội bộ (Pending Media Auth Guard).
   - Bảo mật định tuyến tệp Media (`/media/*`): Tệp ảnh ở trạng thái `pending` hoặc `rejected` bắt buộc phải có xác thực phiên nội bộ (`admin`, `editor`, `reviewer`) và phản hồi với `Cache-Control: private, no-store`. Chỉ tệp ảnh đã được duyệt (`approved`) mới được phục vụ công khai (`Cache-Control: public, max-age=86400`).
   - Tăng cường bảo vệ CSRF: So khớp toàn bộ Origin (`originUrl.origin === requestUrl.origin`), kiểm tra Referer khi thiếu Origin, chặn yêu cầu đột biến cross-site, chặn tấn công Host-spoofing và chênh lệch scheme (HTTP vs HTTPS). Bổ sung giới hạn kích thước body (10MB cap) trong máy chủ Node cục bộ để chống cạn kiệt bộ nhớ.
   - Làm rõ quy trình tài chính 2 người: Đúng 2 danh tính được cấp quyền độc lập (Người lập bản nháp/nguồn + Người duyệt độc lập), nghiêm cấm tự phê duyệt (self-review).
   - Tách biệt kiểm định bản nháp tài chính và bản chiếu công khai: Cho phép bản nháp nội bộ lưu các giao dịch chuẩn bị/nhập từ CSV khi chưa đối soát, trong khi bản chiếu công khai (`sanitizeFinanceForPublic`) bắt buộc lọc rỗng entries khi chưa đối soát xong. Mục tiêu quyên góp nếu chưa biết (null) được giữ nguyên null, không dùng fallback số giả 3.000.000đ.
   - Chuẩn hóa form và UI: Xóa bỏ hoàn toàn các hộp thoại `alert(...)`, thay thế bằng hệ thống thông báo Toast trực quan không chặn (`showToast`). Bài viết nhật ký mới mặc định ở trạng thái `draft`, sự kiện `planned`, ngày sự kiện `null` (không tự suy thành đã hoàn thành hôm nay). Biểu mẫu liên hệ không dùng fallback ngầm khôi phục giá trị đã xóa.
   - Tích hợp tiêu thụ Bản chụp cho Astro (`src/data/lib/snapshot-loader.ts`) và mô đun trích xuất bản chụp (`apps/studio/src/publish/consumer.ts`), kèm hỗ trợ tạo Pull Request GitHub (`apps/studio/src/publish/github.ts`) qua endpoint `/api/publications/:id/export` và `/api/publications/:id/publish-git`.
   - Thiết lập máy chủ HTTP cục bộ độc lập trên cổng **4330**, bảo toàn tuyệt đối 2 cổng dịch vụ đang chạy: cổng `4322` (Astro preview) và cổng `4323` (Local studio legacy).

2. **Kết quả kiểm thử & Nghiệm thu:**
   - Bộ kiểm thử tự động độc lập `apps/studio/tests/*.test.mjs` đạt **26/26 tests PASS (100%)** bao gồm: JWT RS256 Web Crypto, Fail-secure Deny khi thiếu cấu hình, RBAC permissions, CSRF Origin/Referer matching, XSS escaping, Magic bytes sniffing & SVG rejection, Asset usage reference guard, Media access auth guard (pending 401 vs approved 200), R2 emulator CRUD, Two-Person policy (2 distinct identities), Four-Eyes principle, RFC 4180 CSV parser & PII masking, Optimistic Concurrency Control (409 Conflict) với Rollback nguyên tử, Snapshot immutability & SHA-256, D1 disk persistence across restarts, và Snapshot Consumer export.
   - Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt `apps/studio/tsconfig.json`: **0 lỗi**.
   - Kiểm tra hồi quy toàn diện hệ thống gốc: `npm test` đạt **92/92 PASS**, `npm run check` đạt **0 errors, 0 warnings, 9 hints**, `npm run build` xuất bản thành công **13 static pages**.
   - Chụp toàn bộ 12 ảnh bằng chứng màn hình xác thực đa thiết bị tại `docs/evidence/C17/worker/screens/` và nhật ký kiểm thử tích hợp 11 kịch bản tại `docs/evidence/C17/worker/verification-results.json` (11/11 PASS).

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
- **Local Dev Mode & Loopback Isolation:** Hỗ trợ chuyển đổi vai trò (`admin`, `editor`, `reviewer`) thông qua header `x-dev-user`, cookie `studio_dev_role`, hoặc query parameter `?dev_role=...`. Cơ chế dev bypass chỉ có hiệu lực trên các yêu cầu xuất phát từ loopback interface (`localhost`, `127.0.0.1`, `::1`).

### 2.2. Phân quyền Server-Side RBAC & Quy trình Tài chính 2 người (`src/auth/rbac.ts`)
- **Ma trận vai trò:**
  - `admin`: Toàn quyền chỉnh sửa bản nháp, thẩm định, kích hoạt xuất bản toàn trang, và quản lý tài khoản.
  - `editor`: Soạn thảo và lưu bản nháp, tải ảnh lên thư viện, gửi yêu cầu xuất bản (bị chặn quyền tự duyệt).
  - `reviewer`: Thẩm định nội dung, kiểm tra đối soát, phê duyệt yêu cầu xuất bản (bị chặn quyền sửa trực tiếp bản nháp).
- **Quy tắc 2 người (Two-Person Policy) trên dữ liệu tài chính:**
  - Đúng **2 danh tính được cấp quyền độc lập** (không yêu cầu 3 người):
    1. Người lập (Preparer / Author): ghi nhận xác nhận nguồn trên phiên bản bất biến.
    2. Người duyệt độc lập (Independent Reviewer): phê duyệt yêu cầu xuất bản.
  - Người lập không được tự phê duyệt nội dung của mình (`reviewer !== preparer`).
- **Phòng chống tấn công:**
  - CSRF: Kiểm tra nghiêm ngặt `Sec-Fetch-Site: cross-site`, so khớp toàn bộ `originUrl.origin === requestUrl.origin`, kiểm tra `Referer` khi thiếu `Origin`, từ chối các yêu cầu đột biến không xác thực nguồn.
  - XSS: Lọc và thoát các ký tự HTML nguy hiểm (`escapeHtml`) trên toàn bộ các trường dữ liệu hiển thị.

### 2.3. Cơ sở dữ liệu D1 & Giao dịch Nguyên tử (`src/db/emulator.ts`, `src/db/client.ts`, `migrations/0001_initial_schema.sql`)
- **Schema D1 SQLite:**
  - `users`: Quản lý định danh email và vai trò RBAC (`admin`, `editor`, `reviewer`).
  - `drafts`: Lưu trữ bản nháp làm việc của 8 phân hệ kèm mã băm `revision_hash` (SHA-256).
  - `revisions`: Lưu lịch sử phiên bản chi tiết (version 1, 2, 3...) cho từng phân hệ, hỗ trợ khôi phục không phá hủy.
  - `publications`: Quản lý yêu cầu xuất bản, snapshot JSON, trạng thái 2 cấp phê duyệt, trạng thái triển khai, lỗi và `idempotency_key` chống nhân đôi yêu cầu.
  - `audit_logs`: Ghi nhận lịch sử kiểm toán toàn bộ hành động (ai làm gì, thời điểm nào, chi tiết thay đổi, IP).
  - `media_assets`: Quản lý metadata hình ảnh, alt text, caption, credit tác quyền, trạng thái kiểm duyệt (`pending`, `approved`, `rejected`), và phân loại minh họa / ảnh thật.
- **Giao dịch Nguyên tử & Khóa lạc quan (OCC):**
  - Quá trình lưu bản nháp (`saveDraft`) bọc toàn bộ thao tác cập nhật draft có điều kiện (`WHERE module_key = ? AND revision_hash = ?`), chèn revision mới, và ghi audit log trong một giao dịch SQLite duy nhất (`BEGIN TRANSACTION;` ... `COMMIT;`).
  - Nếu phát hiện xung đột phiên bản (`changes === 0` hoặc sai `expectedHash`), giao dịch lập tức `ROLLBACK;` và ném `ConcurrencyConflictError` (HTTP 409 Conflict), không để lại revision rác hay audit log rác.
- **Giả lập D1 cục bộ bền vững:**
  - Sử dụng module gốc `node:sqlite` (`DatabaseSync`) của Node.js 22/24 với chế độ `PRAGMA journal_mode = WAL;`.
  - Dữ liệu lưu vào tệp đĩa `apps/studio/data/d1/studio.sqlite`, hoàn toàn bền vững qua các lần khởi động lại máy chủ.

### 2.4. Lưu trữ Media & Bộ lọc Magic Bytes (`src/storage/emulator.ts`, `src/storage/media-sniffer.ts`, `src/worker.ts`)
- **Xác thực Magic Bytes:**
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - WebP: `52 49 46 46` ... `57 45 42 50`
  - AVIF: `....ftypavif` / `....ftypavis`
- **Từ chối SVG & Script:** Loại bỏ dứt khoát tệp chứa cú pháp `<svg`, `<script`, `<?xml`, `<html` vì nguy cơ chứa mã JavaScript thực thi.
- **Kiểm soát kích thước & Bảo mật phục vụ:**
  - Giới hạn tải lên tối đa 5MB mỗi tệp ảnh; giới hạn payload 10MB tại server.
  - Tệp tải lên ban đầu mang trạng thái `pending`. Tuyến `/media/*` kiểm tra trạng thái trong D1: Nếu chưa được duyệt (`pending` hoặc `rejected`), người dùng chưa xác thực bị từ chối với HTTP 401; người dùng nội bộ đã đăng nhập xem với `Cache-Control: private, no-store`. Chỉ tệp `approved` mới được phục vụ công khai (`Cache-Control: public, max-age=86400`).
- **Kiểm tra ràng buộc sử dụng (Asset Usage Guard):** Trước khi xóa một tệp ảnh trong thư viện, hệ thống quét toàn bộ các bản nháp đang có; nếu ảnh đang được liên kết trong bất kỳ phân hệ nào, yêu cầu xóa sẽ bị từ chối với thông báo rõ ràng về phân hệ đang sử dụng.
- **Giả lập R2 cục bộ:** Lưu trữ blob và metadata `.meta.json` tại `apps/studio/data/r2/`.

### 2.5. Biểu mẫu nghiệp vụ chuyên biệt cho toàn bộ 8 phân hệ (`src/ui/html.ts`)
1. **Phân hệ 1: Tổng quan (Dashboard):** Thống kê xuất bản, trạng thái đồng bộ, liên kết nhanh tới 7 phân hệ, tóm tắt audit logs gần nhất.
2. **Phân hệ 2: Dự án & Thông điệp (Project):**
   - Biểu mẫu thông điệp: Tiêu đề, Khẩu hiệu, Tóm tắt, Mục tiêu quyên góp.
   - Biểu mẫu tiến độ: Tuần hiện tại / Tổng số tuần (1/5), Giai đoạn hiện tại (0), Ngày cập nhật.
   - Biểu mẫu 2 buổi hoạt động thực tế (24/10/2026 & 31/10/2026) kèm thời gian, địa điểm, nội dung chính.
   - Biểu mẫu 2 đầu mối liên hệ chính thức: inputs rỗng thực sự phản ánh giá trị rỗng, không tự động khôi phục ngầm qua fallback.
3. **Phân hệ 3: Nhật ký hành trình (Journal):**
   - Quản lý danh sách bài viết thực địa, trạng thái công bố (`published` / `draft`).
   - Tạo bài viết mới mặc định: `status: 'draft'`, `eventStatus: 'planned'`, `eventDate: null` (không suy diễn thành sự kiện đã hoàn thành).
   - Trình soạn thảo khối trực quan (Block Editor): Hỗ trợ thêm/sửa/xóa các khối nội dung: Đoạn văn (`paragraph`), Tiêu đề (`heading`), Hộp nổi bật (`callout`), Trích dẫn (`quote`), Danh sách gạch đầu dòng (`list`), và Hình ảnh kèm Chú thích/Tác quyền (`image`).
   - Tách biệt bài nháp (Draft isolation) bảo đảm bài nháp không xuất hiện trong bản chiếu công khai.
4. **Phân hệ 4: Thư viện Media (Media Library):** Tải ảnh lên R2, xác thực Magic Bytes, quản lý Alt text tiếp cận, Chú thích (Caption), Tác quyền (Credit), quy trình duyệt ảnh 2 cấp, kiểm tra ràng buộc tham chiếu trước khi xóa.
5. **Phân hệ 5: Sản phẩm & Mở bán (Products):** Cấu hình mở bán từng SKU (`chuon-chuon-tre-kem-de`, `moc-khoa`): Trạng thái mở bán (unconfirmed, open, closed), Giá niêm yết chính thức (VND), Số lượng tồn kho sẵn có, Kênh phân phối, Chính sách đổi trả, Phê duyệt công khai.
6. **Phân hệ 6: Tài chính & Sao kê (Finance & Reconciliation):**
   - Cấu hình tài khoản ủng hộ chính thức: Ngân hàng Techcombank, Số tài khoản `999927052006`, Chủ tài khoản LÊ TUẤN ANH, Cú pháp chuyển khoản `MTMNV`, Mã QR, Mục tiêu 3.000.000đ.
   - Cấu hình 6 bước quy trình đối soát minh bạch (Thu tiền, Đối soát kép, Khóa sổ, Thẩm định hai cấp, Công khai sao kê che PII, Lưu trữ chứng từ).
   - Quản lý đối soát sao kê: Cho phép soạn và nhập giao dịch trong bản nháp khi chưa đối soát (`reconciled: false`). Khi đã đối soát xong và duyệt công khai, các giao dịch mới được chuyển sang bản chiếu công khai với mã PII che an toàn (`...XXXX`).
7. **Phân hệ 7: Nhóm, FAQ & SEO (Team/FAQ/SEO):**
   - Biểu mẫu thông tin nhóm và 7 thành viên dự án Lăng Kính (họ tên, vai trò, chuyên trách, ảnh chân dung).
   - Biểu mẫu 3 nhóm câu hỏi thường gặp độc lập: Câu hỏi về Quà lưu niệm (`productFaqs` - 4 mục), Câu hỏi về Đồng hành & Quyên góp (`supportFaqs` - 5 mục), Câu hỏi về Minh bạch & Đối soát (`transparencyFaqs` - 4 mục).
   - Cấu hình thẻ SEO Meta (Title, Description, og:image).
8. **Phân hệ 8: Lịch sử & Xuất bản (Publish/History):**
   - Tạo bản chụp xuất bản độc lập (Snapshot SHA-256), So sánh khác biệt (Diff viewer), Quy trình phê duyệt Bốn Mắt (Người duyệt 1, Người duyệt 2 độc lập), Lịch sử xuất bản kèm trạng thái triển khai.
   - Nút hành động trực tiếp: "Xuất sang Astro 🚀" (`/api/publications/:id/export`) và "Tạo PR Git 🐙" (`/api/publications/:id/publish-git`).
- **Hệ thống thông báo Toast:** Thay thế hoàn toàn các hộp thoại `alert(...)` bằng thông báo Toast hiện đại (`showToast`), kèm cảnh báo thay đổi chưa lưu (`beforeunload` và dirty indicator).

### 2.6. Tạo bản chụp xuất bản & Tiêu thụ Astro (`src/publish/adapter.ts`, `src/publish/consumer.ts`, `src/data/lib/snapshot-loader.ts`)
- Khi yêu cầu xuất bản được tạo, hệ thống trích xuất dữ liệu từ các bản nháp và thực hiện làm sạch nghiêm ngặt:
  - Loại bỏ toàn bộ bài viết có trạng thái `draft` khỏi danh mục bài viết công khai.
  - Phân hệ dự án: Lọc chuẩn các trường tiến độ, buổi hoạt động và liên hệ chính thức.
  - Phân hệ tài chính: Nếu chưa đối soát hoặc chưa được duyệt (`publicApproval !== 'approved'`), danh sách giao dịch công khai bắt buộc phải để rỗng; khi đã đối soát xong, toàn bộ mã tham chiếu cá nhân đều được che giấu an toàn (`...XXXX`). Giữ nguyên vẹn thông tin tài khoản Techcombank và 6 bước quy trình đối soát.
  - Phân hệ nhóm & FAQ: Bảo toàn đầy đủ 7 thành viên và 3 nhóm FAQ độc lập.
  - Tính mã băm toàn vẹn SHA-256 của toàn bộ dữ liệu xuất bản.
- **Tiêu thụ Bản chụp trong Astro (`snapshot-loader.ts`):** Cung cấp các hàm nạp dữ liệu từ `src/data/published-snapshot.json` khi có bản xuất bản đã duyệt, đồng thời giữ cơ chế dự phòng (fallback) tự động về `src/data/campaign.ts` khi chưa xuất bản, bảo đảm website công khai không bị gián đoạn hay thay đổi ngoài ý muốn.

---

## 3. Bằng chứng kiểm thử & Xác thực chất lượng

### 3.1. Kết quả bộ kiểm thử Studio (`npm run studio:test`)
Chạy qua lệnh `node --test apps/studio/tests/*.test.mjs`:
```
✔ JWT: Fail-secure khi thiếu cấu hình hoặc dùng giá trị placeholder (1.7ms)
✔ JWT: Giải mã và xác thực chữ ký RS256 hợp lệ (74.9ms)
✔ JWT: Từ chối token hết hạn (exp) (62.5ms)
✔ JWT: Từ chối token sai issuer hoặc audience (94.0ms)
✔ JWT: Từ chối token có chữ ký bị giả mạo / sửa đổi (43.1ms)
✔ Khóa lạc quan & Revisions: Phát hiện xung đột 409 và khôi phục an toàn (15.3ms)
✔ D1 Database: Tính bền vững trên đĩa qua các lần khởi động lại (Persistence Test) (48.9ms)
✔ Four-Eyes: Nghiêm cấm tự phê duyệt (Self-Review Forbidden) (1.5ms)
✔ Four-Eyes: Người duyệt thứ hai phải độc lập với người duyệt thứ nhất (0.3ms)
✔ Quy tắc 2 người: Đúng 2 danh tính độc lập (Người lập + Người duyệt độc lập) (0.4ms)
✔ CSV Parser: Tuân thủ RFC 4180, từ chối unclosed quotes và dòng sai số cột (1.2ms)
✔ Cú pháp tiền tệ: Chỉ chấp nhận số nguyên dương hoặc phân cách 3 chữ số hợp lệ (0.6ms)
✔ Làm sạch dữ liệu: Che giấu mã tham chiếu riêng tư (PII Masking) và ẩn danh (0.3ms)
✔ Bản chiếu công khai: Từ chối bản chiếu chưa đối soát hoặc chưa duyệt (1.3ms)
✔ Xuất bản: Tạo bản chụp bất biến (Immutable Snapshot) và tính SHA-256 (10.5ms)
✔ Xuất bản: Kiểm tra tính Idempotency và Four-Eyes trong D1 (2.9ms)
✔ Xuất bản: Trích xuất Snapshot được duyệt sang dữ liệu tĩnh Astro (Snapshot Consumer) (6.5ms)
✔ RBAC: Kiểm tra ma trận quyền hạn các vai trò (0.8ms)
✔ RBAC: Quyền thao tác bị từ chối chính xác (0.6ms)
✔ Bảo mật: Kiểm tra CSRF chặn yêu cầu nguy hiểm (29.0ms)
✔ Bảo mật: Thoát ký tự HTML nguy hiểm (XSS Escape) (0.2ms)
✔ Media Sniffer: Nhận diện chính xác định dạng ảnh qua Magic Bytes (0.9ms)
✔ Media Sniffer: Từ chối dứt khoát SVG và tệp chứa script / mã độc (0.3ms)
✔ Media Sniffer: Kiểm tra ràng buộc tham chiếu trước khi xóa ảnh (0.9ms)
✔ Storage R2: Hoạt động bền vững của LocalR2Bucket (put, get, list, delete) (7.4ms)
✔ Media Auth: Tệp media pending/chưa duyệt từ chối yêu cầu unauthenticated (401), tệp approved được phục vụ công khai (42.0ms)
ℹ tests 26 | pass 26 | fail 0 | duration_ms 390.5ms
```

### 3.2. Kết quả kiểm tra kiểu dữ liệu TypeScript (`npm run studio:typecheck`)
- Lệnh: `tsc --noEmit -p apps/studio/tsconfig.json`
- Kết quả: **0 lỗi (Exit Code 0)**.

### 3.3. Kiểm thử hồi quy toàn diện hệ thống gốc
1. `npm test`: **92/92 PASS (100%)**.
2. `npm run check`: **0 errors, 0 warnings, 9 hints** (khớp chuẩn baseline).
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
Lưu tại thư mục `docs/evidence/C17/worker/screens/` (12 ảnh chụp màn hình):
1. `studio-dashboard-1440.png`: Màn hình Tổng quan trên Desktop 1440px.
2. `studio-project-1440.png`: Form biên tập phân hệ Dự án & Thông điệp trên Desktop 1440px (Tiến độ tuần 1/5, 2 Buổi hoạt động, 2 Đầu mối liên hệ).
3. `studio-journal-1440.png`: Form biên tập Nhật ký với Trình soạn thảo khối trực quan (Block Editor) trên Desktop 1440px.
4. `studio-products-1440.png`: Form cấu hình Mở bán Sản phẩm trên Desktop 1440px.
5. `studio-finance-1440.png`: Form Thẩm định Tài chính, Tài khoản Techcombank, Quy trình 6 bước, & Đối soát Sao kê CSV trên Desktop 1440px.
6. `studio-team-1440.png`: Form 7 Thành viên nhóm Lăng Kính & 3 Nhóm FAQ độc lập trên Desktop 1440px.
7. `studio-publish-1440.png`: Giao diện Tạo yêu cầu xuất bản, Quy trình Bốn Mắt, Xuất sang Astro & Tạo PR Git trên Desktop 1440px.
8. `studio-dashboard-768.png`: Giao diện Tổng quan trên Tablet 768px.
9. `studio-team-768.png`: Form 7 Thành viên & FAQ trên Tablet 768px.
10. `studio-drawer-open-375.png`: Giao diện Drawer điều hướng mở trên Mobile 375px.
11. `studio-dashboard-375.png`: Giao diện Tổng quan trên Mobile 375px.
12. `studio-project-375.png`: Form biên tập phân hệ Dự án trên Mobile 375px.

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
- `apps/studio/src/auth/rbac.ts`: Phân quyền vai trò RBAC, quy tắc 2 người cho tài chính (`validateTwoPersonFinanceApproval`), XSS escape.
- `apps/studio/src/auth/middleware.ts`: Middleware xác thực request, nhận diện token hoặc dev user, kiểm tra CSRF (origin/referer/method/host), kiểm tra loopback cho dev bypass.
- `apps/studio/src/db/emulator.ts`: `LocalD1Database` tương thích D1Database backed by `node:sqlite` (`DatabaseSync`) với WAL mode và disk persistence.
- `apps/studio/src/db/schema.sql`: Tệp schema đồng bộ cho máy chủ cục bộ.
- `apps/studio/src/db/client.ts`: `StudioDbClient` quản lý drafts với giao dịch SQLite nguyên tử (`BEGIN TRANSACTION;` ... `COMMIT;`), khóa lạc quan (OCC), revisions, audit logs, publications có idempotency và four-eyes, media assets có quản lý trạng thái kiểm duyệt (`pending`, `approved`, `rejected`), và `getPublication`.
- `apps/studio/src/storage/emulator.ts`: `LocalR2Bucket` tương thích R2Bucket lưu trữ tệp trên đĩa cục bộ.
- `apps/studio/src/storage/media-sniffer.ts`: Bộ kiểm tra Magic bytes (JPEG, PNG, WebP, AVIF), từ chối SVG/script/HTML, kiểm tra giới hạn 5MB, kiểm tra ràng buộc tham chiếu trước khi xóa.
- `apps/studio/src/schemas/index.ts`: Định nghĩa schema, validator tách biệt tính hợp lệ của draft khỏi projection công khai, default seed data loader phong phú với đầy đủ dữ liệu thực tế từ chiến dịch (Techcombank, 7 thành viên, 3 nhóm FAQ, tiến độ, 2 buổi hoạt động, 6 bước đối soát).
- `apps/studio/src/publish/adapter.ts`: Bộ tạo bản chụp xuất bản (Publication Snapshot) độc lập, làm sạch dữ liệu, che mã PII, bảo toàn null goal, tính SHA-256.
- `apps/studio/src/publish/consumer.ts`: Trình xuất khẩu bản chụp đã duyệt sang các tệp JSON tĩnh cho Astro.
- `apps/studio/src/publish/github.ts`: Tích hợp xuất bản qua Pull Request GitHub (chế độ mô phỏng hoặc API thật).
- `apps/studio/src/api/router.ts`: REST API router xử lý auth, drafts, revisions, media kiểm duyệt, CSV import, audit logs, publications, export snapshot và git publish.
- `apps/studio/src/ui/html.ts`: Trình dựng giao diện HTML tiếng Việt phẳng C16 đa thiết bị với biểu mẫu nghiệp vụ chuyên biệt cho toàn bộ 8 phân hệ, block editor cho nhật ký, diff viewer, dirty warning, dev-role switcher, escapeHtml chống Stored XSS, và hệ thống thông báo Toast (`showToast`).
- `apps/studio/src/worker.ts`: Cloudflare Worker entrypoint với kiểm soát quyền chặt chẽ trên tuyến `/media/*` (pending yêu cầu auth, approved công khai).
- `apps/studio/src/server.ts`: Máy chủ HTTP cục bộ chạy cổng 4330 sử dụng Node `http` và Web Request/Response adapter có giới hạn 10MB payload cap.

### 4.2. Bộ kiểm thử (`apps/studio/tests/`)
- `apps/studio/tests/auth-jwt.test.mjs`: Kiểm thử xác thực RS256 JWT, exp, nbf, issuer, audience, forged signature, fail-secure deny.
- `apps/studio/tests/rbac-security.test.mjs`: Kiểm thử phân quyền RBAC, phòng chống CSRF, XSS escaping.
- `apps/studio/tests/storage-media.test.mjs`: Kiểm thử magic bytes sniffing, từ chối SVG, kiểm tra ràng buộc tham chiếu, LocalR2Bucket, và media auth guard (pending 401 vs approved 200).
- `apps/studio/tests/finance-four-eyes.test.mjs`: Kiểm thử quy tắc Bốn Mắt, quy tắc 2 người (`validateTwoPersonFinanceApproval`), RFC 4180 CSV parser, ngữ pháp tiền tệ, PII masking.
- `apps/studio/tests/concurrency-revisions.test.mjs`: Kiểm thử khóa lạc quan (409 Conflict), lịch sử revisions, khôi phục an toàn, và rollback giao dịch nguyên tử khi xung đột.
- `apps/studio/tests/publication-snapshot.test.mjs`: Kiểm thử tạo snapshot bất biến, SHA-256, cách ly bản nháp, idempotency key, và Snapshot Consumer export.
- `apps/studio/tests/d1-persistence.test.mjs`: Kiểm thử độ bền vững của cơ sở dữ liệu D1 qua các lần khởi động lại máy chủ.

### 4.3. Cấu hình gốc dự án & Liên thông Astro
- `src/data/lib/snapshot-loader.ts`: Bộ nạp dữ liệu bản chụp xuất bản cho Astro, có fallback an toàn về `src/data/campaign.ts`.
- `src/data/published-snapshot.json`: Tệp lưu bản chụp xuất bản khởi tạo cho Astro.
- `package.json`: Bổ sung các lệnh npm tiện ích (`studio:start`, `studio:test`, `studio:typecheck`, `studio:build`).
- `tsconfig.json`: Bổ sung `"exclude": ["apps"]` để phân định môi trường biên dịch của Astro và Worker.

### 4.4. Bằng chứng kiểm thử & Báo cáo
- `docs/evidence/C17/worker/verify-studio.mjs`: Kịch bản kiểm thử tích hợp trên cổng 4330.
- `docs/evidence/C17/worker/verification-results.json`: Kết quả chi tiết của kịch bản kiểm thử tích hợp (11/11 PASS).
- `docs/evidence/C17/worker/capture-studio-screens.mjs`: Kịch bản chụp màn hình tự động đa kích thước (12 ảnh).
- `docs/evidence/C17/worker/screens/*.png`: 12 ảnh chụp màn hình hoàn chỉnh.
- `reports/c17-online-studio-antigravity.md`: Báo cáo chi tiết hiện tại.

---

## 5. Ranh giới tuân thủ & Trạng thái hoàn thành

- **Không tự động push/merge/deploy:** Toàn bộ công việc được thực hiện trên nhánh `task/c17-online-studio`, không chạy lệnh `git push`, không merge vào `main`, không provision cloud resources.
- **Bảo toàn dữ liệu gốc:** Không sửa đổi các tệp dữ liệu công khai trong `src/data/campaign.ts`, không sửa đổi layout Astro công khai.
- **Bảo toàn cổng dịch vụ:** Cổng `4322` (preview PID 544) và cổng `4323` (studio legacy PID 6276) giữ nguyên vẹn không bị gián đoạn. Studio mới hoạt động độc lập trên cổng `4330`.
- **Trạng thái:** Toàn bộ tiêu chí nghiệm thu của Task C17 và phản hồi của Reviewer đã hoàn tất xuất sắc.
