# Báo cáo Nghiệm thu & Bàn giao Kỹ thuật Task T01 (Vòng sửa R01 & Phục hồi Môi trường) — Antigravity (Worker)

- **Task ID:** T01 — Khởi tạo ứng dụng và trang chủ mẫu
- **Người thực hiện:** Antigravity (Kỹ sư triển khai)
- **Người tiếp nhận / Review:** Codex (Brain / Coordinator)
- **Nhánh Git:** `task/t01-home-shell`
- **Baseline SHA (B0):** `ef102c8c1908f1dcd843d8d9f6741848dcb43d63` (nhánh `main`)
- **Final Commit SHA:** `c27fea2f8d377523b2200a1630756acfe46f54a2`
- **Thời điểm bàn giao cập nhật:** 2026-10-02 10:41:00 +07:00

---

## 1. Nhật ký Phục hồi Môi trường (Environment Recovery)

Theo yêu cầu từ Codex Brain để giải quyết lỗi khóa file nhị phân native `EPERM` do tiến trình preview cũ giữ file khi chạy `npm ci`:

1. **Dừng tiến trình preview cũ:** Đã hủy tiến trình nền `task-357`. Kiểm tra giải phóng hoàn toàn cổng loopback 4321.
2. **Cài đặt sạch lại dependencies (`npm.cmd ci`):**
   - Lệnh: `npm.cmd ci`
   - Exit code: **`0`**
   - Kết quả: Đã cài đặt hoàn chỉnh và phục hồi sạch sẽ 269 packages trong 9s, 0 vulnerabilities.
3. **Kiểm tra kiểu dữ liệu & cú pháp (`npm.cmd run check`):**
   - Lệnh: `npm.cmd run check`
   - Exit code: **`0`**
   - Kết quả: `astro check` hoàn tất trên 18 files: **0 errors, 0 warnings, 0 hints**.
4. **Build lại bản tĩnh hoàn chỉnh (`npm.cmd run build`):**
   - Lệnh: `npm.cmd run build`
   - Exit code: **`0`**
   - Kết quả: Build hoàn tất trong 743ms, tạo 7 static routes trong `dist/`. Thư mục `dist/images` rỗng đã được tự động dọn sạch.
5. **Khởi chạy lại server preview:** Khởi chạy tiến trình mới tại `http://127.0.0.1:4321/` phục vụ review.

---

## 2. Trạng thái Working Tree & Phạm vi File

- **Working Tree Status:** Toàn bộ 22 files ứng dụng/cấu hình thuộc quyền sở hữu của Antigravity đã được commit sạch sẽ vào commit `c27fea2`. Các thay đổi và file mới của Codex Brain (`docs/**`, `README.md`) được giữ nguyên vẹn trên working directory, Antigravity **không can thiệp hay `git add` toàn repo**.
- **Diff Stat (`B0..HEAD`):** 22 files changed, 8033 insertions(+), 0 deletions(-).

---

## 3. Chi tiết Giải quyết Yêu cầu Sửa R01 (C01 – C07)

| ID | Vấn đề từ Review R01 | Giải pháp & Code triển khai | Trạng thái |
| :---: | :--- | :--- | :---: |
| **C01** | `saleStatus=unconfirmed` nhưng copy khẳng định chưa mở bán/chưa nhận cọc; phôi có thể hiểu là đã chuẩn bị | Đổi thành: **`'Trạng thái mở bán chưa được xác nhận; bản xem trước chưa nhận đơn/tiền'`** trên cả `ProductCard.astro`, `index.astro`, `san-pham.astro` và `campaign.ts`. Đổi ghi chú phôi: **`'Dự kiến trong 40 phôi chuẩn bị, 10 chiếc để lại Mái ấm.'`**. | **ĐẠT** |
| **C02** | Chi dự toán gọi là thực tế; claim môi trường, kiểm toán/công khai toàn bộ chứng từ chưa biên tập | `index.astro`: Đổi thành **`'vì có chi phí vật tư và vận hành trong dự toán'`**; `index.astro`, `minh-bach.astro`, `campaign.ts`: Đổi thành **`'Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.'`**; bỏ claim túi môi trường. | **ĐẠT** |
| **C03** | Muted text không đạt 4.5:1; browser default `small` bị co giảm còn 10.83px | `tokens.css`: Đổi `--color-text-muted` thành `#48535e` (đạt **7.85:1** trên trắng, **7.42:1** trên nền dịu); `global.css`: Định nghĩa `small, caption, figcaption { font-size: var(--font-size-sm); line-height: var(--line-height-sm); }` (đúng **14px** chuẩn spec, không bị co). Đã bỏ tag `small` dư thừa tại card-note và notes-info. | **ĐẠT** |
| **C04** | CTA desktop đo 43.59px, toggle 34px; mở menu ở 375 rồi resize 1440 bị lộ cả panel mobile | `Header.astro`: Đặt `.cta-btn` đạt **`min-height: 48px; height: 48px;`**; `.mobile-toggle` đạt **`min-height: 48px; height: 48px; min-width: 48px;`**; `.mobile-nav-link` đạt **`min-height: 48px;`**. Thêm listener `window.matchMedia('(min-width: 1024px)')` và CSS `@media (min-width: 1024px) { .mobile-panel { display: none !important; } }`: khi resize lên desktop, menu mobile lập tức đóng, reset `aria-expanded="false"`, ẩn panel và loại bỏ hoàn toàn khả năng tab vào panel ẩn. | **ĐẠT** |
| **C05** | `/dong-hanh` render `support-list` vượt chỉ shell | Bỏ `support-list`, chuyển `/dong-hanh` thành shell route chuẩn mực đồng nhất với 4 route phụ: Tiêu đề, subtitle, thông báo xem trước và nút quay về trang chủ `/`. | **ĐẠT** |
| **C06** | Dimension screenshot khai sai so với file thực; thiếu metadata thật | Đọc metadata thực tế trực tiếp từ header file PNG qua script kiểm tra tự động: lưu đầy đủ Browser version, viewport, zoom, timestamp và kích thước pixel thực tế chính xác. | **ĐẠT** |
| **C07** | Copy ghi chú giai đoạn và footer chứa lời điều khiển kỹ thuật | `index.astro`: Đổi thành **`'* Ghi chú: Các giai đoạn dự kiến, lịch thực hiện chờ xác nhận.'`**; `Footer.astro`: Bỏ `(Noindex / Nofollow)`, đổi thành **`'Bản xem trước phục vụ lấy ý kiến đóng góp cho dự án Mang Theo Một Nét Vẽ — Nhóm Lăng Kính (Đại học FPT Hà Nội).'`**. | **ĐẠT** |

---

## 4. Bằng chứng Trình duyệt & Kích thước Ảnh Chụp Thực tế

- **Môi trường đo lường:** Google Chrome Headless qua Puppeteer CDP
- **Phiên bản trình duyệt:** `Chrome/154.0.8037.58`
- **Mức thu phóng (Zoom):** `100%`
- **Thời điểm kiểm tra:** `2026-10-02T03:34:40.662Z` (`10:34:40 Asia/Saigon`)
- **Server Preview Loopback:** Đang duy trì chạy nền tại `http://127.0.0.1:4321/`.

### Số liệu đo lường DOM thực tế:
- **Desktop `.cta-btn`:** `width: 130.72px`, `height: 48.00px`, `minHeight: 48px`, `display: flex` (Đạt chuẩn >= 48px).
- **Mobile `#mobile-nav-toggle`:** `width: 88.56px`, `height: 48.00px`, `minHeight: 48px` (Đạt chuẩn >= 48px).
- **Mobile `.mobile-nav-link`:** `width: 335.00px`, `height: 48.00px`, `minHeight: 48px` (Đạt chuẩn >= 48px).
- **Cỡ chữ trên Mobile:**
  - `cardNoteFontSize`: `14px`
  - `notesInfoFontSize`: `14px`
  - `captionFontSize`: `14px`
  - `smallFontSize`: `14px`
- **Hành vi Resize Breakpoint:**
  - Mở menu trên mobile (375px) &rarr; resize lên desktop (1440px): `toggleAriaExpanded: false`, `toggleDisplay: none`, `panelHiddenAttr: true`, `panelDisplay: none`, `desktopNavDisplay: flex`.
  - Resize ngược lại về 375px: Menu vẫn giữ trạng thái đóng an toàn (`aria-expanded: false`, `panelDisplay: none`).

### Kích thước chính xác của các file ảnh chụp (PNG):
Toàn bộ ảnh được lưu tại thư mục TEMP ngoài repository:  
`C:\Users\tuana\.gemini\antigravity-cli\brain\86498389-9ca4-486e-9ba8-82247107fb96\handoff-t01`

1. `desktop-1440-full.png`: **`1440 × 5517 px`** (500,604 bytes)
2. `tablet-768-full.png`: **`768 × 7634 px`** (514,517 bytes)
3. `mobile-375-full.png`: **`375 × 10496 px`** (487,132 bytes)
4. `mobile-375-menu-open.png`: **`375 × 812 px`** (36,537 bytes)
5. `browser-metadata.json`: Lưu trữ toàn bộ dữ liệu đo đạc JSON thô.

---

## 5. Kết luận Bàn giao

Môi trường đã được phục hồi sạch sẽ và kiểm tra exit 0 qua toàn bộ quy trình `npm.cmd ci -> npm.cmd run check -> npm.cmd run build`. Ứng dụng tiếp tục duy trì trên commit **`c27fea2f8d377523b2200a1630756acfe46f54a2`** và server preview loopback đang hoạt động bình thường.
