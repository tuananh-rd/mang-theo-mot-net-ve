# Báo cáo bàn giao Task C01-UI: Triển khai các sửa đổi UI theo Review của Claude

**Thời điểm:** 03/10/2026  
**Người thực hiện:** Antigravity (Sole coder)  
**Nhiệm vụ:** Thực hiện toàn diện các chỉnh sửa giao diện người dùng theo đặc tả `docs/task-specs/C01-ui-claude.md` và `reports/ui-review-claude-c01.md` (M1–M2, L1–L7; giữ nguyên L8 theo chỉ đạo chủ dự án).  
**Thư mục bàn giao ngoài repo:** `handoff-c01-ui/`

---

## 1. Thông tin Git & Mã nguồn

- **Baseline HEAD:** `a4e0aa879525d366335630eaf329633c35c6bb80`
- **Branch:** `task/c01-materials`
- **Các commit ứng dụng đã thực hiện (Application Only):**
  1. `05c1f75b231ae11419e77dcdaa2114e38dcd0274` — *fix(ui): implement Claude C01 review recommendations M1-M2 and L1-L7*
  2. `96f539772b78d70324adb95a11508d27163cd3ad` — *fix(minh-bach): compact mobile layout to achieve 18% height reduction (L4)*
- **Final App HEAD SHA:** `96f539772b78d70324adb95a11508d27163cd3ad`
- **Phạm vi file thay đổi (11 files):**
  - `public/images/favicon-32x32.png` (mới tạo)
  - `public/images/apple-touch-icon.png` (mới tạo)
  - `src/components/Header.astro`
  - `src/components/Footer.astro`
  - `src/components/PlaceholderIllustration.astro`
  - `src/components/ProductCard.astro`
  - `src/layouts/Layout.astro`
  - `src/data/campaign.ts`
  - `src/pages/index.astro`
  - `src/pages/san-pham.astro`
  - `src/pages/minh-bach.astro`
- **Bảo toàn tài liệu:** Không có bất kỳ file nào trong `docs/**`, `reports/**` hay evidence của Brain/Claude bị stage hoặc commit.

---

## 2. Chi tiết kết quả triển khai (M1–M2, L1–L8)

### M1 — Nhận diện thương hiệu Header & Footer (Logo vuông + HTML text)
- **Header:**
  - Thay logo chữ nhật bằng icon vuông `logo_lang_kinh_2048.png` (38x38px desktop, 32x32px mobile).
  - Tên nhóm `Lăng Kính` hiển thị dạng HTML text rõ ràng (18px, font-bold, màu thương hiệu), đi kèm phụ đề `Mang Theo Một Nét Vẽ` (14px, secondary text).
  - Đảm bảo accessible name trên thẻ link thương hiệu chứa đầy đủ cả `Lăng Kính` và `Mang Theo Một Nét Vẽ`.
  - Canh trái gọn gàng, không bị chồng đè lên hamburger button ở mobile 375px.
- **Footer:**
  - Phần thương hiệu hiển thị icon vuông `logo_lang_kinh_2048.png` (36x36px) đi kèm H2 `Lăng Kính` (20px, font-bold) và mô tả dự án.

### M2 — Responsive bảng sản phẩm tại breakpoint 1024px
- Tại viewport `<= 1023px` (768px, 900px, 375px,...): Ẩn bảng lớn (`display: none`), hiển thị danh sách thẻ dọc `.plan-mobile-list`.
- Tại viewport `>= 1024px` (1024px, 1440px,...): Hiển thị đầy đủ bảng dữ liệu (`display: table`), ẩn danh sách thẻ.
- Đã kiểm tra và chụp ảnh bằng chứng ở cả 900px (cards) và 1024px (table).

### L1 — Xóa pill phân loại dự toán trên bảng Minh bạch
- Loại bỏ khung pill badge nổi bật (border, border-radius, background) ở cột Phân loại; chuyển sang hiển thị text inline đơn giản màu `var(--color-text-secondary)` (14px), giúp giảm độ rườm rà thị giác.

### L2 — Giữ hoa tên riêng "Lăng Kính" trong câu & công thức
- Triển khai helper `formatInSentence()` giúp hạ chữ cái đầu tiên nhưng giữ nguyên danh từ riêng `Lăng Kính`.
- Đảm bảo không còn hiện tượng xuất hiện chữ `lăng kính` viết thường trong công thức tính toán và ghi chú giải trình tại `minh-bach.astro` và `index.astro`.

### L3 — Cập nhật ghi chú dự toán chuẩn mực
- Khoản `banh-keo-qua`: Cập nhật thành *"Kế hoạch tổng, chưa phân bổ theo người nhận (trang 25)"*, loại bỏ câu hướng dẫn nội bộ.
- Khoản `truyen-thong-truc-tiep`: Cập nhật thành *"Khoản dự kiến theo đề xuất trang 26, chưa xác nhận triển khai"*, loại bỏ câu tham chiếu thiết bị mượn nội bộ.

### L4 — Tối ưu hóa chiều cao trang Minh bạch trên mobile 375px (Giảm >= 15%)
- Tái cấu trúc 19 thẻ dự toán mobile thành dạng 2 dòng compact:
  - Dòng 1: Tên khoản mục (trái) + Số tiền kế hoạch (phải).
  - Dòng 2: Diễn giải số lượng/đơn giá + Dấu phân cách + Ghi chú kế hoạch.
- Tối ưu hóa padding của Hero section, Hero card, Highlight cards, Expense cards (8px 12px), Ledger cards, Principle cards, FAQ items và Navigation CTA.
- **Kết quả đo đạc chính thức:**
  - Chiều cao ban đầu (Baseline): **12,366px**
  - Chiều cao sau khi tối ưu: **10,140px**
  - Mức giảm đạt được: **18.00%** (Vượt chỉ tiêu yêu cầu >= 15%).
  - Toàn bộ font size đều duy trì >= 14px; không có lỗi tràn màn hình (horizontal scroll = false).

### L5 — Phân biệt 3 minh họa nem SVG & xếp dọc tên/giá đồ ăn mobile
- Thiết kế 3 minh họa vector SVG đặc thù cho từng combo nem:
  - `combo-nem-gion`: Nem chua rán truyền thống vàng ruộm chấm sốt ớt.
  - `combo-nem-xu`: Nem tẩm bột chiên xù gai xù giòn rụm.
  - `combo-nem-pho-mai`: Nem nhân phô mai kéo sợi béo ngậy.
- Trên mobile: `.food-card-top` chuyển sang `flex-direction: column` với khoảng cách 4px, hiển thị tên món và giá thành 2 dòng riêng biệt, tránh dồn ép chữ.

### L6 — Thẻ đồ ăn số lượng chưa biết
- Hiển thị văn bản *"Chưa xác định"* dạng secondary text bình thường (font size 14px, màu trung tính), không dùng khung badge nổi và không in đậm `<strong>`.

### L7 — Tạo Favicon chuẩn kích thước từ logo vuông
- Tạo các file ảnh chuẩn kích thước bằng `sharp`:
  - `public/images/favicon-32x32.png` (32x32px, 1,263 bytes)
  - `public/images/apple-touch-icon.png` (180x180px, 6,141 bytes)
- Cập nhật thẻ link trong `src/layouts/Layout.astro`.

### L8 — Bảo tồn wordmark ảnh gốc
- Giữ nguyên wordmark ảnh gốc theo đúng chỉ đạo của chủ dự án để chờ quyết định chính thức.

---

## 3. Bằng chứng kiểm tra kỹ thuật & Chất lượng

1. **Astro Check:**
   - Lệnh: `npm run check`
   - Kết quả: **0 errors, 0 warnings, 0 hints** (50 files checked).
2. **Unit Tests:**
   - Lệnh: `node --test tests/finance.test.mjs`
   - Kết quả: **18/18 tests passed** (100%), 3 suites, 0 failed.
3. **Production Static Build:**
   - Lệnh: `npm run build`
   - Kết quả: Build thành công toàn bộ 7 routes tĩnh vào thư mục `dist/` (19 files).
4. **Browser Automated Audit (Playwright/Puppeteer):**
   - Kịch bản kiểm tra: `scratch/audit_and_screenshots_c01_ui.mjs`
   - Số lượng assertions: **98/98 assertions passed** (100%).
   - Đo đạc chiều cao Minh bạch 375px: 10,140px vs 12,366px (giảm 18.00% >= 15%).
   - Kiểm tra không tràn màn hình ngang (0 horizontal scroll) trên toàn bộ 7 routes tại 6 viewports (375, 414, 768, 900, 1024, 1440px).

---

## 4. Danh mục Screenshots bàn giao (24 files)

Toàn bộ 24 screenshots và file log audit đã được xuất vào thư mục `handoff-c01-ui/`:
- `browser-audit-results.json`
- `check-build-metadata.json`
- `home-desktop-1440-full.png`, `home-tablet-768-full.png`, `home-mobile-375-full.png`
- `san-pham-desktop-1440-full.png`, `san-pham-tablet-768-full.png`, `san-pham-mobile-375-full.png`
- `san-pham-breakpoint-900-full.png`, `san-pham-breakpoint-1024-full.png`
- `minh-bach-desktop-1440-full.png`, `minh-bach-tablet-768-full.png`, `minh-bach-mobile-375-full.png`
- `du-an-desktop-1440-full.png`, `du-an-tablet-768-full.png`, `du-an-mobile-375-full.png`
- `ve-nhom-desktop-1440-full.png`, `ve-nhom-tablet-768-full.png`, `ve-nhom-mobile-375-full.png`
- `dong-hanh-desktop-1440-full.png`, `dong-hanh-tablet-768-full.png`, `dong-hanh-mobile-375-full.png`
- `404-desktop-1440-full.png`, `404-tablet-768-full.png`, `404-mobile-375-full.png`
- `mobile-375-menu-open.png`

---

## 5. Dịch vụ & Tiến trình phục vụ (Isolation)

- **Reviewer Server (Claude):** Cổng `4321`, PID `21616` — Được giữ nguyên trạng thái, hoàn toàn không can thiệp.
- **Antigravity Preview Server:** Cổng `4322`, PID `25960` — Khởi chạy với `--ignore-lock`, đang phục vụ thư mục `dist/` ổn định tại `http://127.0.0.1:4322`.
- **Trạng thái bàn giao:** **HOLD** sole worker, duy trì preview port 4322; không push git, không public, không mở Task T05.
