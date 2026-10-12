# Báo cáo Triển khai Task C17-R2-F2-R1 — Antigravity

- **Nhiệm vụ & Dispatch**: `task_ca18da0161af` / `ctx_02026e737657` (C17-R2-F2-R1).
- **Mã SHA cơ sở (Baseline SHA)**: `2a522e3644f9358a2f19cb775c83b4e1c90ddfac` trên nhánh `task/c17-online-studio`.
- **Người thực hiện**: Antigravity (Toàn quyền sở hữu triển khai mã nguồn, cấu hình và kiểm thử).
- **Người quản lý / Reviewer**: Codex (`term_3ed8af16-b251-407b-82ae-6588e708cc4c`).
- **Thời điểm hoàn thành**: 2026-10-12T22:52:00+07:00.

---

## 1. Tóm tắt Điều hành (Executive Summary)

1. **Những việc đã thực hiện**:
   - Khắc phục triệt để cấu hình SEO theo từng tuyến đường (Per-Route SEO) cho 7 tuyến đường canonical (`/`, `/du-an/mang-theo-mot-net-ve`, `/dong-hanh`, `/san-pham`, `/minh-bach`, `/ve-nhom`, `/nhat-ky`): bổ sung hàm `isValidCanonicalRoute`, cập nhật schema `TeamModuleData`, cơ chế làm sạch fail-closed `sanitizeRouteSeo` trong adapter, biểu mẫu nhập liệu và bộ thu thập dữ liệu trong Studio UI (`apps/studio/src/ui/html.ts`), cùng khẳng định thẻ `<title>` và `<meta name="description">` khi kết xuất qua `Layout.astro`.
   - Chuẩn hóa kiểu dữ liệu số có thể null (`number | null`) và kiểm thực bất biến cho tổng quan tài chính (Finance Overview): sử dụng `Number.isSafeInteger`, bảo toàn số 0 và null, cho phép số âm đối với số dư dự phóng (`unfundedProjectedBalance`), từ chối tuyệt đối `Infinity`, số thập phân và số âm đối với các trường thu/chi. Vượt qua 13/13 ca kiểm thử trong `reviewer-schema-checkpoint.mjs`.
   - Cập nhật `.gitignore` bảo vệ các thư mục bộ nhớ đệm xem trước nội bộ (`.astro-preview/`, `.wrangler/`, `dist-preview/`) mà không xóa tệp đã có.
   - Sửa selector nút liên hệ thành `#toggleContactBtn`, xây dựng kịch bản kiểm thử trình duyệt thực tế trên nền tảng Cloudflare `workerd` (`browser-verification.mjs`), thu thập 28 quan sát có kiểm tra phần tử DOM thực tế (không hardcode `rendered: true`), xác minh lưu/đọc lại `contacts: null` (ẩn 4 liên kết tel:), lưu số 0 tài chính, lưu per-route SEO và chụp ảnh màn hình đáp ứng 3 kích thước (375, 768, 1440).
   - Chứng minh cách ly yêu cầu kết xuất HTML Astro đồng thời (Concurrent Astro HTML Rendering Isolation) giữa 3 bản nháp khác nhau (Alpha, Beta, Gamma) mà không xảy ra rò rỉ dữ liệu (Zero Cross-Talk), đính kèm cờ bảo mật `Cache-Control: private, no-store`.

2. **Kết quả đạt được & Bằng chứng thực tế**:
   - `reviewer-schema-checkpoint.mjs`: 13/13 trường hợp đạt (0 sai lệch).
   - `apps/studio/tests/c17-r2-f2.test.mjs`: 16/16 test case đạt (exit 0).
   - `npm test`: 96/96 test case toàn dự án đạt (exit 0).
   - `npm run build`: 13 trang tĩnh công khai biên dịch thành công (exit 0).
   - `npx astro check`: 0 lỗi, 0 cảnh báo (exit 0).
   - `npx astro build --config astro.preview.config.mjs`: Biên dịch SSR Cloudflare Preview hoàn tất (exit 0).
   - `docs/evidence/C17/R2-F2-R1/worker/browser-verification.mjs`: 28 quan sát đạt, 0 lỗi trang/console, 22 tài sản media khớp dung lượng trên đĩa (exit 0).

3. **Phạm vi còn lại / Giới hạn bàn giao**:
   - Không thực hiện triển khai đám mây (Cloudflare Pages/Workers deploy) hoặc tạo tài nguyên thật trên Cloudflare do chưa có ủy quyền kích hoạt (F3/Activation).
   - Giữ nguyên các tài liệu kế hoạch dirty của Codex (`README.md`, `docs/*`, `reports/handoff-brain.md`) và kho lưu trữ người dùng nguyên bản.

---

## 2. Chi tiết Các Hạng mục Khắc phục theo Review RC17-R2-F2

### 2.1. Cấu hình Per-Route SEO hoàn chỉnh
- **Schema & Validation** (`apps/studio/src/schemas/index.ts`):
  - Khai báo danh sách 7 tuyến đường chuẩn tắc `CANONICAL_SEO_ROUTES`.
  - Hàm `isValidCanonicalRoute(route: string)` kiểm tra nghiêm ngặt: tuyến đường bắt đầu bằng `/`, không bắt đầu bằng `//`, không chứa `..`, `?`, `#`, `\`, ký tự khoảng trắng; thuộc danh sách canonical hoặc đường dẫn bài viết/sản phẩm hợp lệ.
  - Kiểm tra `seoVal` không được là mảng (`!Array.isArray(seoVal)`), chỉ chấp nhận đối tượng có `title` và `description` là chuỗi ký tự hoặc null.
- **Sanitizer** (`apps/studio/src/publish/adapter.ts`):
  - `sanitizeRouteSeo` duyệt và loại bỏ hoàn toàn các tuyến đường không hợp lệ, mảng hoặc đối tượng rỗng.
  - Giữ lại `routeSeo` đã làm sạch bên trong `siteMeta` của snapshot công khai và snapshot xem trước riêng tư.
- **Studio UI** (`apps/studio/src/ui/html.ts`):
  - Thêm 7 khối nhập liệu tương ứng 7 tuyến đường canonical vào phân hệ `Nhóm, FAQ & SEO`.
  - Bộ lắng nghe sự kiện form tự động gom các giá trị tiêu đề và mô tả của từng tuyến đường vào `siteMeta.routeSeo`.
- **Render Head trong Layout**:
  - `src/layouts/Layout.astro` đọc `siteMeta.routeSeo[currentPath]`, ghi đè tiêu đề trang `<title>` và thẻ `<meta name="description">`.

### 2.2. Kiểm thực Nullable Finance Overview & Tính toàn vẹn Dữ liệu
- Kiểu `FinanceOverviewData` định nghĩa các trường số là `number | null`.
- Kiểm tra tính hợp lệ trong `validateFinanceModuleData`:
  - `typeof val === 'number' && Number.isFinite(val) && Number.isSafeInteger(val)`.
  - Các trường `plannedExpenseTotal`, `craftPlannedRevenue`, `foodPlannedRevenue`, `plannedRevenueScenario` không được âm (`val >= 0`).
  - Trường `unfundedProjectedBalance` cho phép số âm (thâm hụt kế hoạch).
  - Giá trị `0` và `null` được lưu trữ và đọc lại nguyên vẹn từ D1, không bị ép kiểu ngầm.

### 2.3. Kiểm thử Trình duyệt Thực tế trên Môi trường Cloudflare workerd
- Sửa bộ chọn liên hệ thành `#toggleContactBtn`. Kiểm tra nếu không tìm thấy sẽ ném lỗi ngay (fail-fast), không bỏ qua ngầm.
- Thao tác thực tế qua Puppeteer trên nền Cloudflare `workerd` (`unstable_dev`):
  - Khảo sát 8 phân hệ tại 3 kích thước màn hình (375x812, 768x1024, 1440x900).
  - Thực hiện ẩn liên hệ `#toggleContactBtn`, lưu và đọc lại `contacts: null`.
  - Chỉnh sửa overview tài chính với giá trị `0`, lưu và kiểm tra giá trị trong ô nhập liệu sau khi reload.
  - Chỉnh sửa per-route SEO cho `/dong-hanh`, lưu và đọc lại từ giao diện.
  - Truy cập trang xem trước `/preview/dong-hanh?dev_role=admin`: kiểm tra tiêu đề và mô tả ghi đè chính xác, số liên kết `tel:` bằng 0 (liên hệ đã ẩn), headers `Cache-Control: private, no-store` và `X-Studio-Private-Preview: true` có mặt, tất cả liên kết nội bộ được viết lại thành `/preview/...`.

### 2.4. Cách ly Yêu cầu Kết xuất HTML Astro Đồng thời (Zero Cross-Talk)
- Kiểm thử trong `apps/studio/tests/c17-r2-f2.test.mjs`:
  - Kích hoạt đồng thời 3 yêu cầu kết xuất HTML Astro thông qua `renderPrivateDraftPreview` với 3 snapshot khác nhau (Alpha, Beta, Gamma) kèm độ trễ bất đồng bộ ngẫu nhiên.
  - Khẳng định nội dung HTML của kết quả Alpha chỉ chứa thông tin Alpha, kết quả Beta chỉ chứa thông tin Beta, kết quả Gamma chỉ chứa thông tin mặc định.
  - Không xảy ra hiện tượng nhiễm chéo dữ liệu giữa các luồng đồng thời.

### 2.5. Cấu hình Bỏ qua Bộ nhớ đệm Xem trước trong .gitignore
- Bổ sung các dòng sau vào `.gitignore` của kho mã:
  ```gitignore
  # Private preview / local workerd / Astro preview cache
  .astro-preview/
  .wrangler/
  dist-preview/
  ```
- Không xóa hay sửa đổi bất kỳ tệp sẵn có nào trong kho mã.

---

## 3. Nhật ký Chạy Quality Gates & Bằng chứng

| Lệnh kiểm tra | Mục đích | Mã thoát | Kết quả |
| --- | --- | --- | --- |
| `node docs/evidence/C17/R2-F2-R1/reviewer-schema-checkpoint.mjs` | Kiểm thử schema 13 trường hợp review | 0 | 13/13 PASS, 0 sai lệch |
| `npm run studio:build` | Biên dịch TypeScript Studio | 0 | Thành công |
| `npm run studio:typecheck` | Kiểm tra kiểu dữ liệu Studio | 0 | Thành công |
| `node --test apps/studio/tests/c17-r2-f2.test.mjs` | Bộ test tự động Studio (Media, Preview, SEO, Finance) | 0 | 16/16 PASS |
| `npm test` | Toàn bộ 96 bài test nghiệp vụ | 0 | 96/96 PASS |
| `npm run build` | Biên dịch trang tĩnh Astro công khai | 0 | 13 trang tĩnh PASS |
| `npx astro check` | Chẩn đoán toàn dự án Astro | 0 | 0 errors, 0 warnings |
| `npx astro build --config astro.preview.config.mjs` | Biên dịch Cloudflare Preview SSR | 0 | Server built in 1.52s PASS |
| `node docs/evidence/C17/R2-F2-R1/worker/browser-verification.mjs` | Kiểm thử trình duyệt thực tế trên workerd | 0 | 28 quan sát PASS, 0 lỗi |

Các tệp bằng chứng chi tiết:
- `docs/evidence/C17/R2-F2-R1/worker/browser-report.json`
- `docs/evidence/C17/R2-F2-R1/worker/quality-gates.txt`
- `docs/evidence/C17/R2-F2-R1/worker/workflow-summary.json`
- `docs/evidence/C17/R2-F2-R1/worker/screenshots/*` (25 ảnh chụp màn hình các phân hệ và trang xem trước)
