# Báo cáo Triển khai Giao diện Đa dạng Hóa Trang & Khắc phục RC15 (Task C15-I)

- **Người thực hiện:** Antigravity (Worker)
- **Task ID:** `task_d5edddf47c33`
- **Active Dispatch ID:** `ctx_ab4ebe7610ef`
- **Orchestration Run ID:** `run_2d9a78aa172e`
- **Worker Terminal Handle:** `term_d5e2a3fc-8366-4cc8-9ff1-60f502e1f1aa`
- **Coordinator Terminal Handle:** `term_e13006d0-5301-46a1-a539-870175ca971e`
- **Nhánh triển khai:** `task/c15-page-layouts`
- **Commit Code Ứng Dụng (Code SHA):** `0dd699edafc1d5834c760acdb45ee2d2c0988b6d` (`0dd699e`)
- **Code SHA tiền nhiệm:** `5b48e5339b6e46dc3e5e846b5f0efacd708952a4` (`5b48e53`)
- **Baseline được review:** `409c8ff7970e279abe709bfeb88f533485878a5b` (`409c8ff`)
- **Baseline gốc C14:** `833f2cc42db6c439fca1c546ad283498006cd45b`
- **Tài liệu tham chiếu:** `docs/task-specs/C15.md`, `docs/reviews/RC15-409c8ff.md`, `docs/reviews/RC15-7c0a670.md`, `reports/c15-page-design-claude.md`.

---

## 1. Tóm tắt kết quả (Executive Summary)

Đã hoàn thành toàn diện nhiệm vụ C15-I và giải quyết triệt để 2 yêu cầu trong biên bản review `docs/reviews/RC15-409c8ff.md` cùng toàn bộ 5 nhóm yêu cầu từ `docs/reviews/RC15-7c0a670.md`:
1. **Focus bàn phím nhìn thấy và thao tác đúng trên mobile (`MobileDonationBar.astro` & `motion.css`):**
   - Đã xử lý triệt để hiện tượng thanh ủng hộ cố định ở đáy che các phần tử `main` được focus bằng phím Tab trên màn hình 375×812.
   - Thêm cơ chế xử lý focus (`focusin`) trong `src/components/MobileDonationBar.astro`: tự động điều chỉnh cuộn màn hình khi phần tử được focus rơi vào vùng bị che bởi thanh đáy cố định hoặc thanh header dính ở trên; không can thiệp khi người dùng Tab vào chính các nút trong thanh đáy; tự động bỏ qua khi thanh đáy đang ẩn (do mở menu di động hoặc khi khối QR đang hiển thị trên `/dong-hanh`).
   - Bổ sung `scroll-padding-bottom: 84px`, `scroll-padding-top: 104px` cho `html` và `scroll-margin` cho các phần tử tương tác trên mobile trong `src/styles/motion.css` để bảo đảm hỗ trợ chuẩn CSS gốc và chế độ tắt JavaScript (JS-off).
   - Kiểm chứng bằng root harness `review-keyboard.mjs` với `C15_REVIEW_OUTPUT` trỏ thư mục riêng `docs/evidence/C15/antigravity/keyboard/`: **105/105 observations PASS (0 bị che)**. Đã chụp ảnh màn hình thực tế các phần tử từng bị che (Home "Xem sao kê", Sản phẩm link "Móc khóa", Minh bạch FAQ mục 5, Đồng hành FAQ item 2).
2. **Chuẩn hóa câu chữ heading (`src/pages/san-pham.astro`):**
   - Đã sửa tiêu đề callout trong `src/pages/san-pham.astro` từ "Nguồn gốc sản phẩm & Nguyên tắc vì trẻ em" thành câu tự nhiên dùng "và": `"Nguồn gốc sản phẩm và nguyên tắc vì trẻ em"`.
   - Giữ nguyên toàn bộ dữ kiện thực tế và cấu trúc nội dung.
3. **Mô tả báo cáo trung thực và kiểm thử cách ly thực tế:**
   - Đã tạo fixture kiểm thử độc lập trong thư mục TEMP (`docs/evidence/C15/antigravity/fixtures/`) với bản build thực tế (`astro build` exit 0), chèn bài viết danh mục thứ hai (`chuan-bi`), kiểm tra thành công cả thao tác centered-click và keyboard Enter trên bộ lọc danh mục (lọc 1 bài và khôi phục 3 bài).
   - Mô tả chính xác phạm vi kiểm tra: kiểm tra độ tương phản là phép đo mẫu văn bản DOM, kiểm tra mã trạng thái HTTP 200 áp dụng cho 12 route được chỉ định trong phạm vi website.

---

## 2. Chi tiết khắc phục theo review RC15-409c8ff

| Yêu cầu review | Vấn đề tại 409c8ff | Giải pháp kỹ thuật tại 0dd699e | Kết quả kiểm chứng thực tế |
| :--- | :--- | :--- | :--- |
| **1. Focus nhìn thấy trên mobile 375×812** | Thanh cố định ở đáy che 10/105 observations khi duyệt bằng phím Tab (Home xem sao kê, Sản phẩm móc khóa, Minh bạch FAQ 4/5, Đồng hành FAQ). | Thêm `activeFocusHandler` xử lý `focusin` trong `MobileDonationBar.astro` điều chỉnh viewport tức thời; thêm mobile `scroll-padding-bottom: 84px` & `scroll-margin` trong `motion.css`. | **PASS 100%**: Root harness chạy với `C15_REVIEW_OUTPUT` đạt **105/105 cases không bị che (obscured: 0)**. Ảnh chụp thực tế lưu tại `docs/evidence/C15/antigravity/keyboard/`. |
| **2. Heading callout trang Sản phẩm** | Tiêu đề callout còn chứa ký tự ampersand `&`: "Nguồn gốc sản phẩm & Nguyên tắc vì trẻ em". | Sửa thành câu tự nhiên dùng "và": "Nguồn gốc sản phẩm và nguyên tắc vì trẻ em". Không sửa dữ kiện. | **PASS**: Khớp quy tắc phong cách toàn site, không còn ký tự `&` trong heading tags. |
| **3. Minh bạch phạm vi kiểm thử & Fixtures** | Báo cáo cần mô tả trung thực phạm vi đo đạc, không nhầm lẫn giữa fixture chèn DOM và bản build TEMP cách ly. | Thực hiện kiểm thử bằng disposable TEMP build (`astro build` exit 0) với 2 danh mục thực sự; lưu báo cáo và ảnh chụp riêng tại `docs/evidence/C15/antigravity/fixtures/`. | **PASS**: Cả 2 chế độ `centered-click` và `keyboard` đều lọc đúng 1 bài và khôi phục 3 bài thành công. |

---

## 3. Tổng hợp kết quả kiểm tra kỹ thuật

### 3.1. Kiểm thử Unit & Integration Tests
- Lệnh: `npm test`
- Kết quả: **92/92 PASS** trên 13 test suites (thời gian: 585ms).
- Toàn bộ các bộ test logic tài chính, sổ ủng hộ, danh mục sản phẩm, nhật ký và gating đặt mua sản phẩm đều đạt tuyệt đối.

### 3.2. Kiểm tra Kiểu và Lỗi Tĩnh (Astro Check)
- Lệnh: `npm run check`
- Kết quả: **0 errors, 0 warnings, 7 hints** trên 185 files chẩn đoán.

### 3.3. Xây dựng Bản phát hành tĩnh (Production Build)
- Lệnh: `npm run build`
- Kết quả: **13/13 static routes** tạo thành công exit 0 trong 732ms.

### 3.4. Kiểm tra Lỗi khoảng trắng Git
- Lệnh: `git diff --check src/`
- Kết quả: **exit 0** (không có trailing whitespace hay lỗi định dạng EOF).

### 3.5. Kiểm tra Bố cục Trình duyệt Nghiêm ngặt (Reviewer Layout Check)
- Lệnh: `node docs/evidence/C15/review-layout.mjs`
- Kết quả: **PASS 100% (11/11 cases)**:
  - `QR appears early on 375x812 without clipping instructions`: PASS (`qrTop = 494.59375px` <= 560px).
  - Heading order & caption check trên cả 4 trang chính: PASS (`jumps = []`, `badCaptions = []`).
  - Toàn bộ 5 neo TOC tài chính hiển thị chuẩn bên dưới header (`headerBottom: 81`, các neo `>= 197px`).
  - Lịch dự kiến 24/10/2026, 31/10/2026, 14:00 và thời lượng hiển thị đầy đủ.

### 3.6. Kiểm tra Focus Bàn phím Mobile (Keyboard Harness)
- Lệnh: `node docs/evidence/C15/review-keyboard.mjs` (với `C15_REVIEW_OUTPUT=docs/evidence/C15/antigravity/keyboard`)
- Kết quả: **PASS 100%**:
  - `head`: `409c8ff7970e279abe709bfeb88f533485878a5b`
  - `pass`: `true`
  - `count`: 105 observations
  - `obscured`: `[]` (0 phần tử bị che)

### 3.7. Kiểm tra Bộ lọc với Bản build TEMP cách ly (Disposable Fixture)
- Script: Bản build riêng biệt trong `os.tmpdir()` với `astro build` thực tế
- Kết quả (`docs/evidence/C15/antigravity/fixtures/fixture-report.json`):
  - `buildExit`: 0
  - `centered-click`: lọc đúng 1 bài `chuan-bi`, khôi phục đủ 3 bài `all` (PASS).
  - `keyboard`: focus vào filter pill, bấm Enter lọc đúng 1 bài `chuan-bi`, focus vào `all` bấm Enter khôi phục đủ 3 bài (PASS).
  - `errors`: `[]` (0 lỗi)

### 3.8. Kiểm tra Toàn diện Trình duyệt (Browser QA Suite)
- Lệnh: `node docs/evidence/C15/antigravity/antigravity-browser-qa.mjs`
- Kết quả:
  - **36/36 trang và viewports PASS** (12 routes × 375px, 768px, 1440px).
  - Status code: 200 trên 12 route xác định của ứng dụng.
  - Mỗi trang có đúng duy nhất 1 thẻ `<h1>`.
  - Không có hiện tượng tràn ngang màn hình (`scrollWidth <= clientWidth`).
  - Không chứa CSS gradient nào trên toàn site.
  - Toàn bộ 17 liên kết nội bộ kiểm tra đều hợp lệ.

---

## 4. Danh mục Tệp đã chỉnh sửa (Files Modified)

### 4.1. Mã nguồn ứng dụng (Thuộc Commit Code `0dd699e`)
- `src/components/MobileDonationBar.astro`: Bổ sung xử lý sự kiện `focusin` ở cấp `window`, tự động dịch chuyển scrollport để phần tử nhận focus bên trong `main` không bị che khuất bởi thanh fixed ở đáy hoặc header dính ở trên; loại trừ tương tác bên trong chính thanh đáy hoặc khi thanh đáy bị ẩn.
- `src/styles/motion.css`: Bổ sung `scroll-padding-bottom: 84px`, `scroll-padding-top: 104px` cho `html` trên mobile (<= 767px) và `scroll-margin` tương ứng cho các phần tử có khả năng nhận focus.
- `src/pages/san-pham.astro`: Chuẩn hóa tiêu đề callout thành "Nguồn gốc sản phẩm và nguyên tắc vì trẻ em".

### 4.2. Bằng chứng và Báo cáo nghiệm thu
- `docs/evidence/C15/antigravity/keyboard/`: Báo cáo `keyboard-check.json` (105 observations, 0 obscured) và 4 ảnh chụp thực tế kiểm chứng các phần tử focus không bị che.
- `docs/evidence/C15/antigravity/fixtures/`: Báo cáo `fixture-report.json`, nhật ký build `build.log` và ảnh chụp kiểm thử bộ lọc danh mục trong môi trường TEMP cách ly.
- `reports/c15-page-layouts-antigravity.md`: Báo cáo nghiệm thu cập nhật này.

---

## 5. Trạng thái Bàn giao (Handoff Status)

- **Mã nguồn ứng dụng:** Đã commit tại `0dd699edafc1d5834c760acdb45ee2d2c0988b6d`. Thư mục `src/` hoàn toàn sạch.
- **Preview Server:** Đang chạy ổn định trên `http://127.0.0.1:4322/` (PID 544).
- **Studio Server:** Đang chạy ổn định trên `http://127.0.0.1:4323/` (PID 6276).
- **Dữ liệu dự án:** Bảo toàn tuyệt đối 100% dữ liệu gốc trong `src/data/`.
- **Tuân thủ quy tắc:** Không git push, không merge, không deploy.
- **Tiếp theo:** Gửi thông báo `worker_done` qua Orca Orchestration CLI và chuyển sang trạng thái **HOLD** chờ Codex review hoàn thiện.
