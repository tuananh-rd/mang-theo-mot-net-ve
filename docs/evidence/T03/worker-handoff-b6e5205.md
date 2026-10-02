# Báo cáo bàn giao Task T03 (Final) — Minh bạch và Đồng hành

- **Thời điểm bàn giao:** 03/10/2026 (UTC+7)
- **Implementer:** Antigravity Worker, model Gemini 3.8 Flash (High).
- **Workspace:** `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`
- **Nhánh triển khai:** `task/t03-finance-support`
- **Base commit:** [`da890a212e029249e29545aa1606e71027034674`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve)
- **Previous Candidate SHA:** [`e563de405acd8b9b71091b12a5953ba85342aed2`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve)
- **Final App SHA:** [`b6e5205c6cfd19b6bae592e7148c49385c671e8d`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve)
- **Trạng thái App Working Tree:** Hoàn toàn sạch (`0` uncommitted changes trong `src/`, `public/`, `tests/`).
- **Tài liệu Codex Brain:** Giữ nguyên trạng thái uncommitted của Brain, không can thiệp, không stage/commit.

---

## 1. Các điểm đã khắc phục theo kết luận R03 (`docs/reviews/R03-e563de4.md`)

| STT | Vị trí | Vấn đề tại candidate `e563de4` | Khắc phục tại final `b6e5205` |
| --- | --- | --- | --- |
| 1 | `src/data/campaign.ts:491` | Kịch bản thiếu 220k mô tả toàn bộ chi thanh toán từ nguồn thu sản phẩm | Nêu rõ không tính tài trợ, chi tiền theo toàn bộ dự toán 3.120.000đ; doanh thu giả định còn thiếu 220.000đ. Không tự ý thêm nguồn bù thiếu. |
| 2 | `src/data/campaign.ts:521,531` | 1.120.000đ bị gọi thay toàn bộ 4 khoản góc chơi (trong khi 4 khoản có cả 540k chân đế tổng 1.660.000đ) | Giữ số 1.120.000đ theo nguồn gốc, mô tả thay 3 khoản vật tư góc chơi: 540k phôi chuồn chuồn + 280k tượng + 300k họa cụ màu vẽ. |
| 3 | `src/pages/minh-bach.astro:82`<br>`src/pages/dong-hanh.astro:113` | Cụm “chưa mở bán chính thức” khẳng định trạng thái bán thực tế chưa xác nhận | Đổi thành “Trạng thái mở bán chưa được xác nhận; bản xem trước chưa nhận đơn/tiền” (hành vi chính xác của preview). |
| 4 | `src/pages/minh-bach.astro:349` | Mô tả số dư tiền thực tế thiếu số dư đầu kỳ, lệch với section nguyên tắc | Sửa thành: “Số dư đầu kỳ + tiền thực nhận − chi tiền thực trả; số dư đầu kỳ và số liệu phát sinh đều chưa được xác nhận.” |
| 5 | `src/pages/minh-bach.astro:90,340,377` | Checklist kỹ thuật/agent (“Không sử dụng thanh tiến độ”, “không tạo giao dịch giả”...) xuất hiện trên UI | Diễn đạt tự nhiên về phân định kế hoạch và thực tế, kế hoạch lưu trữ hóa đơn chứng từ đối soát, bảo vệ riêng tư khi công bố. |
| 6 | `src/pages/dong-hanh.astro:177,215` | Checklist quy trình; hứa đăng liên hệ đại diện Mái ấm hoặc tự thêm thủ tục | Diễn đạt tự nhiên về kế hoạch phối hợp chờ thống nhất cùng Mái ấm; kênh liên hệ chính thức sẽ cập nhật sau khi hoàn tất xác nhận và được cấp quyền công bố. |
| 7 | `src/pages/minh-bach.astro:212` | Operands phép tính doanh thu hardcode string | Render các toán hạng trực tiếp từ `PRODUCTS` (`{revenueFormulaText} = {formatVND(totalPlannedRevenue)}`), đảm bảo đồng bộ hoàn toàn khi data thay đổi. |
| 8 | CSS hai trang (`minh-bach` & `dong-hanh`) | Sử dụng các custom property không tồn tại: `--color-surface`, `--color-surface-soft`, `--radius-full` | Thay thế triệt để bằng các tokens thật trong `tokens.css`: `--color-surface-card`, `--color-canvas-soft`, `--radius-pill`. Quét sạch 100% token lỗi. |

---

## 2. Kết quả kiểm thử kỹ thuật và tính toán độc lập

### 2.1. Logic tài chính (`tests/finance.test.mjs`)
- Lệnh: `node --test tests/finance.test.mjs`
- Kết quả: **13/13 tests pass** (2 suites, exit code 0).
- Tổng dự toán chi: 3.120.000đ.
- Tổng doanh thu kịch bản bán đủ hàng: 2.900.000đ.
- Số dư 3 kịch bản: Thiếu 220.000đ / Dư 280.000đ / Dư 900.000đ.
- Phép tính kiểm tra null-safety nghiêm ngặt, format số tiền an toàn.

### 2.2. Astro Diagnostics (`npm.cmd run check`)
- Lệnh: `npm.cmd run check`
- Kết quả: **32 files checked, 0 errors, 0 warnings, 0 hints**. Exit code 0.

### 2.3. Production Static Build (`npm.cmd run build`)
- Lệnh: `npm.cmd run build`
- Kết quả: **7 static routes built in 446ms**. Exit code 0.
- Các trang tĩnh được xuất: `/`, `/du-an/mang-theo-mot-net-ve`, `/ve-nhom`, `/san-pham`, `/minh-bach`, `/dong-hanh`, `/404.html`.

---

## 3. Kiểm tra Trình duyệt & Visual Audit (55/55 Assertions Pass)

Thực hiện tự động qua Puppeteer-core với Google Chrome 154 (Headless) trên máy chủ Preview `http://127.0.0.1:4321`:
- **Routes & Status:** Cả 6 route chính thức phản hồi HTTP 200/304; route kiểm thử 404 trả về HTTP 404 chuẩn.
- **Landmarks & Metadata:** `lang="vi"`, `robots="noindex, nofollow"`, 1 thẻ `<h1>`, 1 thẻ `<main>`, `header` & `footer` đầy đủ, 0 thẻ `<form>`. Active link header chính xác trên từng route.
- **Responsive & Spacing (320px, 375px, 768px, 1024px, 1440px):**
  - Không có hiện tượng tràn ngang (`scrollWidth <= clientWidth` trên tất cả 5 mốc màn hình cho cả 2 trang).
  - Toàn bộ font chữ nội dung đều `>= 14px` (`0.875rem`).
  - Đảm bảo tương phản màu chữ theo tokens chuẩn (`--color-text-primary`, `--color-text-secondary`, `--color-text-accent`, `--color-text-muted`).
- **Mobile Menu Interaction (375px):**
  - Mở menu trên mobile, phím `Escape` đóng menu và hoàn trả focus về `#mobile-nav-toggle`.
  - Resize sang Desktop (>= 1024px) chuyển đổi mượt mà giữa mobile panel và desktop nav.
- **No-JS Fallback:** Khi tắt JavaScript, nút toggle tự ẩn (`display: none`), footer cung cấp đầy đủ liên kết điều hướng đến mọi trang.

---

## 4. Danh mục ảnh và tài liệu bàn giao tại `handoff-t03-final/`

Thư mục bàn giao độc lập mới: [`handoff-t03-final/`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/) (giữ nguyên thư mục candidate cũ [`handoff-t03/`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03/) để đối chiếu lịch sử):

1. **6 ảnh full-page chụp 2 trang mới trên 3 viewport chuẩn:**
   - [`minh-bach-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/minh-bach-mobile-375-full.png) (375 × 9.048px, 449.062 bytes)
   - [`minh-bach-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/minh-bach-tablet-768-full.png) (768 × 6.165px, 452.374 bytes)
   - [`minh-bach-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/minh-bach-desktop-1440-full.png) (1440 × 5.573px, 458.485 bytes)
   - [`dong-hanh-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/dong-hanh-mobile-375-full.png) (375 × 6.105px, 298.969 bytes)
   - [`dong-hanh-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/dong-hanh-tablet-768-full.png) (768 × 5.133px, 318.102 bytes)
   - [`dong-hanh-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/dong-hanh-desktop-1440-full.png) (1440 × 4.157px, 324.345 bytes)

2. **1 ảnh Mobile Menu mở trên trang Minh bạch:**
   - [`minh-bach-mobile-375-menu-open.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/minh-bach-mobile-375-menu-open.png) (375 × 812px, 33.217 bytes)

3. **Các file log thô và dữ liệu kiểm chứng:**
   - [`raw-check.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/raw-check.log): Output kiểm tra Astro Check (32 files, 0 errors, 0 warnings, 0 hints, exit code 0)
   - [`raw-test.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/raw-test.log): Output kiểm thử Node 24 native runner (13/13 tests pass, exit code 0)
   - [`raw-build.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/raw-build.log): Output build tĩnh production (7 routes built, exit code 0)
   - [`check-build-metadata.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/check-build-metadata.json): Toàn bộ metadata, commit SHA, hash từng file trong `dist/`
   - [`clean-ci-evidence.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/clean-ci-evidence.json): Bằng chứng tái sử dụng clean-ci với hash lockfile bất biến
   - [`browser-audit-results.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t03-final/browser-audit-results.json): Báo cáo chi tiết 55/55 assertions của audit trình duyệt

---

## 5. Trạng thái máy chủ Preview & Trạng thái HOLD

- **Máy chủ preview production:** Daemon `task-957` (PID **2888**) vẫn đang chạy ổn định, bind tại `http://127.0.0.1:4321/`, phục vụ trực tiếp bản build hoàn thiện từ `dist/`.
- **Trạng thái HOLD:**
  - Không tự ý chỉnh sửa thêm mã nguồn hay tài liệu.
  - Không mở Task T04.
  - Không chạy `git push`, không phát hành public.
  - Chờ kết quả nghiệm thu từ Codex Brain.
