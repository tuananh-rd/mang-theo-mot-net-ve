# Báo cáo triển khai C17 — Gỡ toàn bộ Icon/Emoji khỏi Content Studio Local

- **Worker:** Antigravity (dispatched worker)
- **Task ID:** `task_962927dbaced`
- **Dispatch ID:** `ctx_405910752089`
- **Baseline HEAD:** `e0bef661b3a18ec37a1aac0c9ed28a39db07fe4e`
- **Tập tin thay đổi duy nhất trong ứng dụng:** `apps/studio/src/ui/html.ts`
- **Thư mục bằng chứng:** `docs/evidence/C17/icons/worker/`
- **Thời gian hoàn thành:** 11/10/2026 (local runtime verification)

---

## 1. Tóm tắt điều hành (Executive Summary)

1. **Những gì đã thực hiện:** Đã gỡ bỏ toàn bộ biểu tượng cảm xúc (emoji), icon trang trí và khoảng trống dư thừa trong toàn bộ 8 phân hệ Content Studio tại `apps/studio/src/ui/html.ts`, cân chỉnh padding/gap cho sidebar, toolbar, bảng và nút bấm trên cả 3 kích thước viewport (1440px desktop, 768px tablet, 375px mobile), chuyển nút menu mobile từ `☰` thành nút chữ "Mở menu" / "Đóng menu" có đầy đủ `aria-label`, `aria-expanded` và khôi phục focus khi nhấn phím Escape.
2. **Những gì đã kiểm chứng:** Đã biên dịch TypeScript thành công (`studio:typecheck` và `studio:build` exit 0), chạy toàn bộ 34 bài kiểm tra backend/runtime của Studio (`npm test` pass 34/34), khởi chạy máy chủ Studio trên cổng `4330` và kiểm tra tự động trình duyệt Chrome headless qua 8 phân hệ trên cả 3 độ phân giải (1440, 768, 375) với 25 lượt quan sát (0 lỗi, 0 tràn ngang, 0 emoji/icon còn sót lại, chụp đầy đủ 26 ảnh màn hình và lưu `results.json`).
3. **Hiện trạng và phần còn lại:** Chỉ lưu thay đổi ở `apps/studio/src/ui/html.ts`, tạo báo cáo này và ghi bằng chứng vào `docs/evidence/C17/icons/worker/`; toàn bộ dữ liệu mẫu, cơ sở dữ liệu SQLite, cấu hình và các tệp dirty ngoài phạm vi của R1 đều được bảo toàn nguyên vẹn; không thực hiện push, deploy hay sửa đổi website công khai. Sẵn sàng bàn giao cho coordinator Codex review.

---

## 2. Chi tiết các hạng mục thay đổi giao diện

### A. Thanh điều hướng Sidebar
- **Tiêu đề Sidebar (`.sidebar-title`):** Gỡ bỏ emoji bảng màu `🎨`. Cân lại kiểu hiển thị chữ đơn giản, trang nhã.
- **Danh mục 8 phân hệ (`.nav-link`):**
  - Gỡ bỏ hoàn toàn thẻ `<span class="nav-icon">` và emoji tại cả 8 mục:
    - 1. Tổng quan (`📊`)
    - 2. Dự án & Thông điệp (`📖`)
    - 3. Nhật ký hành trình (`📝`)
    - 4. Thư viện Media (`🖼️`)
    - 5. Sản phẩm & Mở bán (`🛍️`)
    - 6. Tài chính & Sao kê (`💰`)
    - 7. Nhóm, FAQ & SEO (`👥`)
    - 8. Lịch sử & Xuất bản (`🚀`)
  - Xóa bỏ class `.nav-icon` trong CSS.
  - Cân chỉnh padding thanh điều hướng (`padding: 10px 14px`), căn chỉnh lề thẳng hàng và đọc rõ trên cả 3 độ phân giải.

### B. Thanh tiêu đề trên cùng (Top Bar) & Điều khiển Mobile
- **Nút mở menu trên Mobile (`#toggleSidebarBtn`):**
  - Chuyển từ ký tự `☰` thành nút chữ thuần túy: `"Mở menu"` (khi đóng, `aria-expanded="false"`) và `"Đóng menu"` (khi mở drawer, `aria-expanded="true"`).
  - Bổ sung hàm quản lý trạng thái `updateSidebarToggle(isOpen)` để đồng bộ văn bản hiển thị và thuộc tính tiếp cận.
  - Xử lý phím `Escape`: Khi đóng drawer bằng phím Escape, tự động trả focus về `#toggleSidebarBtn`.
  - Khi click chuyển tab trên màn hình di động (`<= 768px`), tự động đóng drawer và cập nhật lại nút về `"Mở menu"`.
- **Chỉ báo thay đổi chưa lưu (`.dirty-indicator`):**
  - Gỡ bỏ emoji cảnh báo `⚠️`, giữ lại nhãn chữ tiếng Việt `"Có thay đổi chưa lưu"`.
- **Thông báo Toast (`showToast`):**
  - Chuyển nút đóng thông báo từ biểu tượng `&times;` thành nút chữ rõ ràng `"Đóng"` kèm `aria-label="Đóng"`.

### C. Các phân hệ nghiệp vụ (Tabs 1–8)

1. **Phân hệ 1 — Tổng quan (Dashboard):**
   - Nút CTA xuất bản: Đổi `"Xem quy trình duyệt xuất bản 🚀"` thành `"Xem quy trình duyệt xuất bản"`.
   - Cổng xem trước: Gỡ emoji `🌐` khỏi tiêu đề thẻ (`"Cổng xem trước Website công khai"`) và gỡ mũi tên `↗` khỏi nút mở website (`"Mở website (Cổng 4322)"`).
   - Gợi ý cuộn bảng: Gỡ bỏ `↔️` khỏi `.table-scroll-hint` trong bảng nhật ký kiểm toán, lịch sử phiên bản và quản trị người dùng.
   - Nút thao tác: Gỡ `🔄` khỏi `"Tải lịch sử"`, gỡ `👥` khỏi `"Tải danh sách"`, gỡ `🔄` khỏi `"Khôi phục"`.

2. **Phân hệ 2 — Dự án & Thông điệp:**
   - Nút lưu: Đổi `"Lưu bản nháp 💾"` thành `"Lưu bản nháp"`.

3. **Phân hệ 3 — Nhật ký hành trình:**
   - Bảng danh sách: Gỡ `↔️` khỏi gợi ý cuộn ngang; đổi `"Sửa bài viết ✏️"` thành `"Sửa bài viết"`.
   - Trình soạn bài viết: Đổi `"← Quay lại danh sách"` thành `"Quay lại danh sách"`; đổi `"Xóa khối 🗑️"` thành `"Xóa khối"`; đổi `"Lưu bài viết vào bản nháp 💾"` thành `"Lưu bài viết vào bản nháp"`.

4. **Phân hệ 4 — Thư viện Media:**
   - Nút tải lên: Đổi `"Tải lên thư viện Media 📤"` thành `"Tải lên thư viện Media"`.
   - Bảng danh mục media: Gỡ `↔️` khỏi gợi ý cuộn ngang; đổi `"Duyệt ✅"` thành `"Duyệt"`; đổi `"Từ chối ❌"` thành `"Từ chối"`; đổi `"Xóa 🗑️"` thành `"Xóa"`.

5. **Phân hệ 5 — Sản phẩm & Mở bán:**
   - Nút lưu: Đổi `"Lưu cấu hình mở bán 💾"` thành `"Lưu cấu hình mở bán"`.

6. **Phân hệ 6 — Tài chính & Sao kê:**
   - Cấu hình tài khoản: Đổi `"Lưu tài khoản & mục tiêu 💾"` thành `"Lưu tài khoản & mục tiêu"`.
   - Thẩm định CSV: Đổi `"Thẩm định tệp CSV 📋"` thành `"Thẩm định tệp CSV"`; đổi `"Áp dụng vào sổ sao kê & Lưu nháp 💾"` thành `"Áp dụng vào sổ sao kê & Lưu nháp"`.
   - Xác nhận 2 người: Đổi `"Ký xác nhận Người lập ✍️"` thành `"Ký xác nhận Người lập"`; đổi `"Ký kiểm tra độc lập ✍️"` thành `"Ký kiểm tra độc lập"`.
   - Bảng biểu: Gỡ `↔️` khỏi toàn bộ 4 gợi ý cuộn ngang của bảng sao kê, doanh thu, chi phí và hiện vật.

7. **Phân hệ 7 — Nhóm, FAQ & SEO:**
   - Nút lưu: Đổi `"Lưu phân hệ Nhóm 💾"` thành `"Lưu phân hệ Nhóm"`.

8. **Phân hệ 8 — Lịch sử & Xuất bản:**
   - Nút yêu cầu: Đổi `"Tạo yêu cầu xuất bản mới 📦"` thành `"Tạo yêu cầu xuất bản mới"`.
   - Bảng lịch sử xuất bản: Gỡ `↔️` khỏi gợi ý cuộn ngang; đổi `"Xuất sang Astro 🚀"` thành `"Xuất sang Astro"`; đổi `"Tạo PR Git 🐙"` thành `"Tạo PR Git"`.

### D. Nguyên tắc bảo toàn (Preservation)
- Giữ nguyên toàn bộ hình ảnh nhận diện, ảnh minh họa nội dung (A01–A05, sản phẩm, QR), nhãn trạng thái và dữ liệu thực tế.
- Giữ nguyên logic an toàn tệp SVG và magic bytes trong `storage/media-sniffer.ts`.

---

## 3. Kết quả kiểm thử & Bằng chứng nghiệm thu

### A. Biên dịch TypeScript
- Lệnh: `npm run studio:typecheck` -> Mã thoát: `0`
- Lệnh: `npm run studio:build` -> Mã thoát: `0`

### B. Kiểm tra tự động Backend / Runtime
- Lệnh: `npm test` tại `apps/studio`
- Kết quả: `pass 34 / fail 0` (100% đạt), thời gian thực thi: ~7.35s.

### C. Kiểm tra Trình duyệt Chrome Headless (Viewport 1440, 768, 375)
- Bộ script kiểm tra: Khởi chạy trên cổng phục vụ thực tế `http://127.0.0.1:4330/`.
- Kết quả từ `results.json`:
  - Tổng số phân hệ kiểm tra: 8/8 phân hệ.
  - Tổng lượt quan sát: 25 lượt.
  - Lỗi JavaScript trang (`errors`): 0.
  - Hiện tượng tràn ngang (`overflow`): `false` trên toàn bộ 8 phân hệ tại 1440, 768 và 375.
  - Trường nhập liệu thiếu nhãn tiếp cận (`unlabelledControls`): 0.
  - Thẻ biểu tượng `.nav-icon`: 0.
  - Ký tự emoji/icon trang trí còn sót lại: 0 (`elementsWithEmoji: []`).
  - Chu kỳ Drawer Mobile:
    - Ban đầu (closed): nhãn `"Mở menu"`, `aria-label="Mở menu"`, `aria-expanded="false"`, `sidebarOpen: false`.
    - Mở (opened): nhãn `"Đóng menu"`, `aria-label="Đóng menu"`, `aria-expanded="true"`, `sidebarOpen: true`.
    - Phím Escape: đóng drawer thành công, trả nhãn về `"Mở menu"`, trả focus về nút điều khiển (`activeElementId: "toggleSidebarBtn"`).
- Danh sách hình ảnh bàn giao trong `docs/evidence/C17/icons/worker/`:
  - `dashboard-1440.png`, `dashboard-768.png`, `dashboard-375-closed.png`, `mobile-menu-375-open.png`, `dashboard-375.png`
  - `project-1440.png`, `project-768.png`, `project-375.png`
  - `journal-1440.png`, `journal-768.png`, `journal-375.png`
  - `media-1440.png`, `media-768.png`, `media-375.png`
  - `products-1440.png`, `products-768.png`, `products-375.png`
  - `finance-1440.png`, `finance-768.png`, `finance-375.png`
  - `team-1440.png`, `team-768.png`, `team-375.png`
  - `publish-1440.png`, `publish-768.png`, `publish-375.png`
  - `results.json`

---

## 4. Ranh giới làm việc & Bàn giao (Handoff)

- **Trạng thái máy chủ local:** Studio hiện đang phục vụ trực tiếp tại `http://127.0.0.1:4330/`.
- **Ranh giới commit:** Chỉ commit tệp mã nguồn giao diện `apps/studio/src/ui/html.ts`, báo cáo `reports/c17-icons-antigravity.md` và bằng chứng `docs/evidence/C17/icons/worker/`.
- **Bảo toàn các tệp dirty khác:** Giữ nguyên các tệp tài liệu kế hoạch và các tệp dirty thuộc chu kỳ R1 trước đó (`apps/studio/package.json`, các tệp kiểm tra R1, tài liệu gốc).
- **Không thực hiện:** Không push lên GitHub remote, không deploy, không sửa dữ liệu sản phẩm/tài chính thực tế.
