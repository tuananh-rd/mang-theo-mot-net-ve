# Báo cáo bàn giao Task T03 — Minh bạch và Đồng hành

- **Thời điểm bàn giao:** 03/10/2026 (UTC+7)
- **Implementer:** Antigravity Worker, model Gemini 3.8 Flash (High).
- **Workspace:** `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`
- **Nhánh triển khai:** `task/t03-finance-support`
- **Base commit:** [`da890a212e029249e29545aa1606e71027034674`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve)
- **Final App SHA:** [`e563de405acd8b9b71091b12a5953ba85342aed2`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve)
- **Trạng thái App Working Tree:** Hoàn toàn sạch (`0` uncommitted changes trong `src/`, `public/`, `tests/`).
- **Tài liệu Codex Brain:** Giữ nguyên trạng thái uncommitted của Brain, không stage/commit hay can thiệp.

---

## 1. Nội dung triển khai theo đặc tả `docs/task-specs/T03.md`

### 1.1. Trang Minh bạch (`src/pages/minh-bach.astro`)
- **Breadcrumb & Hero:** Đường dẫn `Trang chủ / Minh bạch`, H1 “Minh bạch thu chi”. Hai huy hiệu: *“Dự toán trong đề xuất”* và *“Chưa có số liệu thực tế được xác nhận”*.
- **Hai số nổi bật:**
  - **3.120.000đ chi dự kiến:** Dẫn xuất trực tiếp từ hàm `sumPlannedExpenses(PLANNED_EXPENSES)`, tổng hợp 6 khoản mục dự toán.
  - **2.900.000đ doanh thu kịch bản bán đủ hàng:** Dẫn xuất từ `calculateTotalRevenueScenario(PRODUCTS)`, tính theo giá tham khảo và số lượng kế hoạch.
  - Kèm điều kiện tường minh ngay cạnh: Chưa mở bán chính thức, doanh thu dự kiến không phải tiền đã nhận hay mục tiêu được duyệt, không sử dụng thanh tiến độ.
- **Bảng dự toán chi (6 khoản mục):**
  - Render từ cùng mảng `PLANNED_EXPENSES` với đầy đủ nguồn gốc và ghi chú kế hoạch:
    1. 40 phôi chuồn chuồn tre × 13.500đ = 540.000đ (Phôi theo dự toán, không tồn kho thực tế).
    2. 30 chân đế × 18.000đ = 540.000đ (Theo dự toán).
    3. 20 tượng thạch cao × 14.000đ = 280.000đ (Giá giả định; hoạt động chơi, không hàng bán).
    4. Màu vẽ, cọ, mút xốp, bóng, chốt = 300.000đ (Chi phí giả định).
    5. 20 túi bút × 20.000đ + 8 túi vải × 35.000đ = 680.000đ (Kế hoạch chuẩn bị, không số đã sản xuất).
    6. Gói hàng 80.000đ + mẫu 100.000đ + di chuyển 600.000đ = 780.000đ (Theo dự toán).
  - **Hiển thị Responsive:** Desktop/tablet hiển thị bảng `<table>` hoàn chỉnh; Mobile (< 768px) hiển thị danh sách thẻ dọc `.mobile-expense-list` với nhãn rõ ràng, đọc trọn vẹn số tiền mà **không cần cuộn ngang**.
- **Doanh thu kịch bản và 3 kịch bản tài chính:**
  - Trình bày công thức: `30 × 40.000 + 20 × 55.000 + 8 × 75.000 = 2.900.000đ`.
  - Phân tích 3 kịch bản dẫn xuất từ hàm `calculateScenario`:
    1. *Chưa tính tài trợ:* Hiện vật 0đ, Chi tiền còn lại 3.120.000đ, Số dư giả định: **Thiếu 220.000đ** (nhãn rõ ràng, không chỉ dựa vào màu sắc).
    2. *Hiện vật thay một phần chi:* Hiện vật 500.000đ, Chi tiền còn lại 2.620.000đ, Số dư giả định: **Dư 280.000đ** (dự kiến).
    3. *Hiện vật thay chi workshop:* Hiện vật 1.120.000đ, Chi tiền còn lại 2.000.000đ, Số dư giả định: **Dư 900.000đ** (dự kiến).
  - Nêu rõ nguyên tắc: Hiện vật thay chi chỉ làm giảm chi tiền một lần, tuyệt đối không cộng vào doanh thu tiền; không cam kết 100% doanh thu mua quà mà trang trải vật tư/vận hành, số dư sau đối soát mới dùng hỗ trợ hiện vật.
- **Báo cáo thực tế và nguyên tắc quản trị:**
  - Khung theo dõi 5 thẻ: Tiền thực nhận, Chi tiền thực trả, Số dư tiền thực tế, Hiện vật tiếp nhận & bàn giao, Chứng từ & Hóa đơn. Toàn bộ hiển thị tự nhiên *“Chưa xác nhận”* / *“Chờ đối soát”*, không in từ khóa kỹ thuật `null`.
  - Empty state khẳng định không tạo nhật ký giả định, nhà tài trợ giả hay link tải báo cáo giả.
  - 4 nguyên tắc quản trị: Công thức dòng tiền chuẩn xác; Tách bạch tiền mặt và hiện vật; Đối soát chéo 2 thành viên; Biên tập chứng từ bảo vệ riêng tư.
- **FAQ tài chính:** 4 câu hỏi giải đáp thắc mắc từ `TRANSPARENCY_FAQS`.
- **CTA điều hướng:** Dẫn thật tới `/dong-hanh` và `/du-an/mang-theo-mot-net-ve`.

---

### 1.2. Trang Đồng hành (`src/pages/dong-hanh.astro`)
- **Breadcrumb & Hero:** Đường dẫn `Trang chủ / Đồng hành`, H1 “Đồng hành cùng dự án”. Slogan: *“Một buổi chơi phù hợp, một món quà đúng nhu cầu.”* Hai huy hiệu: *“Tiếp nhận có lựa chọn”* và *“Chưa mở tiếp nhận trực tuyến”*.
- **3 phương thức đồng hành dự kiến:**
  1. *Hỗ trợ vật tư thiết yếu:* Nêu rõ chỉ tiếp nhận theo danh mục nhóm và Mái ấm thống nhất; danh mục chính thức đang chờ đối chiếu. Ví dụ vật tư góc chơi được gắn nhãn rõ *“Ví dụ theo đề xuất, chưa phải yêu cầu chính thức”*. CTA dẫn tới `/minh-bach`.
  2. *Tìm hiểu sản phẩm gây quỹ:* Thông báo giá tham khảo, số lượng và kênh mở bán chờ duyệt; CTA dẫn tới `/san-pham`. Tuyệt đối không có nút “Mua ngay”, không giỏ hàng, không nhận đơn.
  3. *Kết nối và hỗ trợ truyền thông:* Lan tỏa thông điệp an toàn theo nội dung đã thống nhất; cam kết không dùng chuyện riêng hay ảnh chưa phép của trẻ. Không social URL giả.
- **Quy trình tiếp nhận 3 bước:**
  - Bước 1: Làm rõ nhu cầu thực tế.
  - Bước 2: Thống nhất phương thức & Bàn giao.
  - Bước 3: Đối soát & Cập nhật công khai.
  - Ghi chú: Quy trình trong đề xuất, không tuyên bố nhóm đã tiếp nhận hay đã đối chiếu xong.
- **Kênh liên hệ chính thức:**
  - Thông báo tự nhiên: *“Kênh liên hệ chính thức chưa được xác nhận. Thông tin sẽ được cập nhật sau khi được phép công bố.”*
  - Ẩn hoàn toàn `mailto:`, `tel:`, form nhập liệu, mã QR, chat hay nhận tiền; không tạo nút disabled giả hay hash link `#`.
- **FAQ đồng hành:** 4 câu hỏi từ `SUPPORT_FAQS`.
- **CTA điều hướng:** Dẫn thật tới `/minh-bach`, `/ve-nhom`, `/du-an/mang-theo-mot-net-ve`.

---

## 2. Kiểm thử logic tài chính (`tests/finance.test.mjs`)

Chạy trên Node 24 native test runner (`node --test tests/finance.test.mjs`), không thêm bất kỳ package bên ngoài nào:
- **Số lượng tests:** 13/13 tests PASS (2 test suites, duration ~138ms, exit code 0).
- **Các ca kiểm thử trọng tâm:**
  - Tổng 6 khoản mục dự toán chi đúng 3.120.000đ.
  - `sumPlannedExpenses` ném lỗi khi gặp giá trị `null` thay vì tự ý ép về `0đ`.
  - Doanh thu từng sản phẩm tính đúng: Chuồn chuồn 1.200.000đ, Túi bút 1.100.000đ, Túi vải 600.000đ. Tổng doanh thu kịch bản đúng 2.900.000đ.
  - Kịch bản 1: Không tài trợ -> Chi tiền 3.120.000đ, Thu 2.900.000đ, Số dư: **Thiếu 220.000đ** (`isDeficit: true`).
  - Kịch bản 2: Hiện vật 500.000đ -> Chi tiền 2.620.000đ, Số dư: **Dư 280.000đ** (`isDeficit: false`). Doanh thu giữ nguyên 2.900.000đ (không cộng dồn hiện vật vào tiền thu).
  - Kịch bản 3: Hiện vật 1.120.000đ -> Chi tiền 2.000.000đ, Số dư: **Dư 900.000đ** (`isDeficit: false`).
  - `calculateScenario` trả về `null` khi thiếu đầu vào cần thiết (không tự ép thành 0).
  - `calculateScenario` ném lỗi khi hiện vật vượt quá tổng chi hoặc là số âm.
  - `formatVND` chuẩn hóa số nguyên, 0 và trả về *“Chưa xác nhận”* cho `null`/`undefined`.
  - Khởi tạo toàn bộ số liệu thực tế (`ACTUAL_FINANCE`, `FINANCE_OVERVIEW`) và liên hệ (`OFFICIAL_CONTACT`) nghiêm ngặt ở giá trị `null`.

---

## 3. Kiểm tra TypeScript, Static Build & Deterministic Output

- **Astro Check (`npm.cmd run check`):**
  - Kết quả: `31 files checked, 0 errors, 0 warnings, 0 hints`. Exit code 0.
- **Astro Build (`npm.cmd run build`):**
  - Kết quả: `7 static routes built in 515ms`. Exit code 0.
- **Tính bất biến của các trang đã duyệt (Deterministic Bundle):**
  - So sánh SHA-256 của `dist/` với bản nghiệm thu T02:
    - `dist/404.html`: `b695525dd529442c5a7d73592152c0a1b2cfb673b123a12405de1cbd80337bef` (trùng khớp 100%)
    - `dist/index.html`: `64360ec4da1523873a4e95f087576dac01b15d8e62e0a87b589066e78fcd3c36` (trùng khớp 100%)
    - `dist/du-an/mang-theo-mot-net-ve/index.html`: `ae65a8c646b0bc23a11f55498874fb656215fc52dc4ff620dcf075eecfe7b8f0` (trùng khớp 100%)
    - `dist/san-pham/index.html`: `cb7abe9a72d02669848efd4e2e9eb7c2c9787510d8bf74b8755e4473f525fe01` (trùng khớp 100%)
    - `dist/ve-nhom/index.html`: `e703d8fcb3cfaac6092ee6cbbdf513fa153ce9d5f818ee5552018b868c95a935` (trùng khớp 100%)
    - Các file CSS chung (`index.*.css`, `Layout.*.css`, v.v.) và favicon giữ nguyên SHA-256.
  - Zero regression trên toàn bộ các route đã nghiệm thu!

---

## 4. Kiểm tra Trình duyệt & Visual Audit (55/55 Assertions Pass)

Thực hiện tự động qua Puppeteer-core với Google Chrome 154:
- **Routes & Status:** Cả 6 route chính thức phản hồi HTTP 200/304; route không tồn tại trả HTTP 404 chuẩn.
- **Landmarks & Metadata:** `lang="vi"`, `robots="noindex, nofollow"`, 1 thẻ `<h1>`, 1 thẻ `<main>`, `header` & `footer` đầy đủ, 0 thẻ `<form>`. Active link header chính xác trên từng route.
- **Responsive & Spacing (320px, 375px, 768px, 1024px, 1440px):**
  - Không có hiện tượng tràn ngang (`scrollWidth <= clientWidth`).
  - Mọi font chữ nội dung đều `>= 14px` (`0.875rem`).
  - Zero contrast failures theo công thức chuẩn WCAG.
- **Mobile Menu Interaction (375px):**
  - Mở menu, phím `Escape` đóng menu và hoàn trả focus về `#mobile-nav-toggle`.
  - Resize sang Desktop (>= 1024px) chuyển đổi mượt mà giữa mobile panel và desktop nav.
- **No-JS Fallback:** Khi tắt JavaScript, nút toggle tự ẩn (`display: none`), footer cung cấp đầy đủ liên kết điều hướng đến mọi trang.

---

## 5. Danh mục ảnh và tài liệu bàn giao tại `handoff-t03/`

Thư mục bàn giao độc lập: [`handoff-t03/`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/)
1. **6 ảnh full-page chụp 2 trang mới trên 3 viewport chuẩn:**
   - [`minh-bach-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/minh-bach-mobile-375-full.png) (375 × 8.929px, 431.515 bytes)
   - [`minh-bach-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/minh-bach-tablet-768-full.png) (768 × 6.064px, 429.462 bytes)
   - [`minh-bach-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/minh-bach-desktop-1440-full.png) (1440 × 5.505px, 439.527 bytes)
   - [`dong-hanh-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/dong-hanh-mobile-375-full.png) (375 × 6.108px, 295.411 bytes)
   - [`dong-hanh-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/dong-hanh-tablet-768-full.png) (768 × 5.133px, 313.995 bytes)
   - [`dong-hanh-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/dong-hanh-desktop-1440-full.png) (1440 × 4.181px, 324.296 bytes)
2. **1 ảnh Mobile Menu mở trên trang Minh bạch:**
   - [`minh-bach-mobile-375-menu-open.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/minh-bach-mobile-375-menu-open.png) (375 × 812px, 33.124 bytes)
3. **Các file log thô và dữ liệu kiểm chứng:**
   - [`raw-check.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/raw-check.log): Output kiểm tra Astro Check (exit 0)
   - [`raw-test.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/raw-test.log): Output kiểm thử Node 24 (13 tests pass, exit 0)
   - [`raw-build.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/raw-build.log): Output build tĩnh production (exit 0)
   - [`check-build-metadata.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/check-build-metadata.json): Toàn bộ metadata, SHA, hash từng file trong `dist/`
   - [`clean-ci-evidence.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/clean-ci-evidence.json): Bằng chứng tái sử dụng clean-ci với hash lockfile bất biến
   - [`browser-audit-results.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/browser-audit-results.json): Báo cáo chi tiết 55/55 assertions của audit trình duyệt

---

## 6. Trạng thái máy chủ Preview & Quy tắc bàn giao

- **Máy chủ preview production:** Tiếp tục duy trì daemon `task-957` (PID **2888**) lắng nghe tại `http://127.0.0.1:4321/`, phục vụ bản build mới nhất của `dist/`.
- **Trạng thái HOLD:**
  - Không tự ý sửa tiếp mã nguồn.
  - Không mở Task T04.
  - Không thực hiện `git push`, không phát hành public.
  - Chờ kết luận review R03 từ Codex Brain.
