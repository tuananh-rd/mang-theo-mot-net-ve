# Báo cáo Bàn giao Kỹ thuật — Task C01 (Hiệu chỉnh RC01)

**Dự án:** Mang Theo Một Nét Vẽ  
**Nhóm thực hiện:** Lăng Kính (Lớp AI2015, SSG105, ĐH FPT Hà Nội)  
**Địa bàn:** Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội)  
**Nhiệm vụ:** Task C01 — Đưa nguồn materials vào website preview  
**Thời điểm bàn giao:** 2026-10-03 (UTC)  
**Trạng thái sau bàn giao:** **HOLD** (giữ nguyên loopback preview 127.0.0.1:4321, không push, không public, chờ Codex Brain review R_C01).

---

## 1. Xác nhận Định danh & Môi trường (ACK)

- **Worker:** Antigravity (Google DeepMind Agentic Coding Assistant)
- **Base commit:** `113069636c653cb7bbb255c33d681cbbbd940b19`
- **Nhánh thực hiện:** `task/c01-materials`
- **Final App Commit SHA:** `ead94a482e590cf1c5ef4eb1e0829c99e30d378c` (sau khi xử lý hoàn tất review RC01; commit trung gian trước đó: `7e16cf3c73b5d450247240dab5da8210c450c4d4`)
- **Môi trường & Công cụ:**
  - Node.js: `v24.19.0`
  - npm: `11.17.0`
  - Astro (`node_modules/astro` và CLI): `7.3.5`
  - Browser: Headless Chrome `154.0.8037.93` (Puppeteer Core)
- **Quyền sở hữu tài liệu:**
  - Toàn bộ tài liệu kế hoạch, đặc tả và review (`docs/**`, `README.md`) thuộc quyền sở hữu của Codex Brain.
  - Antigravity chỉ stage và commit các file mã nguồn ứng dụng (`src/**`), tài nguyên hình ảnh được chọn (`public/images/**`), và kiểm thử (`tests/**`).
- **Nguồn tài liệu & Logo (Source Materials Access):**
  - Đã truy cập trực tiếp thư mục nguồn `D:\Downloads\materials`.
  - File PDF gốc `MANG THEO MỘT NÉT VẼ.pdf` chỉ dùng làm tài liệu tham khảo nội dung; tuyệt đối không copy, không stage và không bundle vào Git/public.
  - Hai file logo PNG được Codex Brain tuyển chọn từ tài liệu do chủ dự án cung cấp (`D:\Downloads\materials`) đã được tích hợp chuẩn xác:
    1. `logo_option5_horizontal.png` (SHA256: `e078e7ea7bd8debae74d2c573fe4391fd55aee57a167ca4eb63534b17ee56db9`) dùng cho Header, Footer, và trang Về nhóm.
    2. `logo_lang_kinh_2048.png` (SHA256: `06f63ac9d41c079827d794b13ffec468ea30be7b818755b4ba96bc819f7facbc`) dùng làm Favicon PNG vuông trong `Layout.astro`.
- **Preview Server Daemon:**
  - Loopback: `http://127.0.0.1:4321/`
  - Background Task: `task-957` (PID 2888) liên tục hoạt động và phục vụ trực tiếp bản build mới nhất của `dist/`.

---

## 2. Tóm tắt Nội dung Thực hiện (Implementation Scope)

### 2.1. Danh mục 7 SKUs & Phân loại Hai Nguồn Doanh thu
- **Sản phẩm thủ công (2 SKUs):**
  1. *Chuồn chuồn tre 12 cm kèm đế:* 40.000đ/bộ, kế hoạch 30 bộ bán dự kiến (trong 40 phôi chuẩn bị, 10 chiếc để lại Mái ấm làm quà).
  2. *Móc khóa Lăng Kính:* 10.000đ/chiếc, kế hoạch 100 chiếc dự kiến do nhóm sinh viên tự hoàn thiện mẫu.
  - Tổng doanh thu thủ công: **2.200.000đ**.
- **Thực đơn ẩm thực gây quỹ dự kiến (5 SKUs):**
  3. *Set đồ ăn gây quỹ:* 79.000đ/set.
  4. *Combo 5 nem vỏ giòn:* 40.000đ/set.
  5. *Combo 5 nem xù:* 40.000đ/set.
  6. *Combo 5 nem phô mai:* 60.000đ/set.
  7. *Bánh su kem:* 20.000đ/hộp.
  - Số lượng kế hoạch từng SKU: `null` (chưa có phân bổ số lượng từng món; tương đương 50 set trong phương án mục tiêu doanh thu).
  - Ghi chú khách hàng: *Hiện tại chưa mở bán* (thay cho chỉ dẫn nội bộ kỹ thuật). Chỉ triển khai khi chốt địa điểm, quy trình an toàn thực phẩm và lịch nhận.
- **Xóa bỏ hoàn toàn:** Túi bút và túi vải đã được loại bỏ khỏi toàn bộ danh mục sản phẩm, chi phí và nội dung giới thiệu.

### 2.2. Ngân sách 19 Khoản Dự toán Chi (Tổng 4.935.000đ)
Khớp chính xác từng dòng theo bảng đối chiếu trong `docs/task-specs/C01.md`:
- **Nhóm 1: Nguyên liệu gây quỹ (trang 24) — 2.245.000đ:**
  1. Nem Trần Công Châu (300 × 3.200đ): 960.000đ
  2. Bột chiên xù (10 × 12.000đ): 120.000đ
  3. Hộp đựng thức ăn (2 túi × 20.000đ/túi 50 chiếc): 40.000đ
  4. Xiên que (5 túi × 12.000đ): 60.000đ
  5. Phô mai (1kg × 140.000đ/kg): 140.000đ
  6. Khoai tây (25.000đ/kg, mua nhiều đợt, chưa chốt số kg): 75.000đ (ước tính)
  7. Dầu ăn (10 × 25.000đ): 250.000đ
  8. Nước uống tặng thêm (50 × 4.000đ): 200.000đ
  9. Bánh su kem (50 hộp × 8.000đ/hộp): 400.000đ
- **Nhóm 2: Vật tư workshop & quà tặng (trang 25) — 1.560.000đ:**
  10. Chuồn chuồn tre 12cm (40 × 10.000đ): 400.000đ
  11. Chân đế (30 × 10.000đ): 300.000đ
  12. Tượng tô 10cm (20 × 4.000đ): 80.000đ
  13. Bóng cho trò chơi (2 × 10.000đ): 20.000đ
  14. Màu vẽ sáu màu (6 × 20.000đ): 120.000đ
  15. Móc khóa (100 × 3.000đ): 300.000đ
  16. Bánh kẹo/quà (Kế hoạch tổng): 340.000đ
- **Nhóm 3: Truyền thông & Di chuyển (trang 26) — 1.130.000đ:**
  17. Truyền thông trực tiếp (standee, bánh kẹo tặng; 2 × 30.000đ): 60.000đ
  18. Di chuyển buổi 1 — thuê xe (1 × 750.000đ): 750.000đ
  19. Di chuyển buổi 2 — xe máy (4 × 80.000đ): 320.000đ

### 2.3. Logic Tính toán Tài chính & Kịch bản Cơ sở
- **Metadata QuantitativeFact cho Mục tiêu Doanh thu Ẩm thực:**
  - `foodPlannedRevenueAssumption`: giá trị 4.500.000đ, kind: `planned`, verification: `unverified`, sourceRef: `proposal:page-18`, updatedAt: `null`, publicApproval: `pending`.
- **Hàm tính toán:**
  - `calculateCraftRevenue(products)` tính riêng doanh thu thủ công (2.200.000đ).
  - `calculateCombinedPlannedRevenue(craftRev, foodAssumption)` kết hợp hai nguồn, tự động propagate `null` khi dữ liệu ẩm thực chưa biết.
  - `calculateTotalRevenueScenario` giữ nguyên cơ chế ném lỗi khi có sản phẩm với `plannedQuantity` là `null`, bảo đảm không âm thầm bỏ qua `null`.
- **Kịch bản Kế hoạch:**
  - Chỉ render duy nhất kịch bản cơ sở `chua-tinh-tai-tro` (hiện vật thay thế 0đ, chi tiền 4.935.000đ, thu kịch bản 6.700.000đ => **Số dư giả định: +1.765.000đ**).
  - Bỏ cụm từ “chưa hòa vốn” trái với phép tính số học.
  - Thay các kịch bản tài trợ cũ bằng phần thuyết minh rõ ràng: các phương án tài trợ hiện vật cần đối chiếu cụ thể danh mục và phạm vi khoản thay chi trước khi áp dụng.

### 2.4. Trải nghiệm Giao diện & Tính Dễ đọc (Typography / A11y)
- **Header:** Giữ cỡ chữ của `.brand-sub` ở mức tối thiểu 14px (0.875rem) trên cả màn hình máy tính và thiết bị di động, bảo đảm khả năng đọc rõ ràng và không gây tràn ngang.
- **Trang chủ (`/`):**
  - Phần ghi chú `transparency-sub` dẫn xuất số liệu hoàn toàn tự động từ `craftPlannedRevenue`, `craftSummaryText` ("30 chuồn chuồn tre 12 cm kèm đế và 100 móc khóa lăng kính") và `foodPlannedAssumption.value`.
  - Sử dụng từ tiếng Việt tự nhiên: "từng món" thay vì thuật ngữ kỹ thuật "SKU".
- **Trang Sản phẩm (`/san-pham`):**
  - Section 1 chia làm 2 nhóm rõ rệt: Sản phẩm thủ công (2 cards) và Thực đơn ẩm thực gây quỹ dự kiến (5 món/combo kèm badge điều kiện).
  - Bảng kế hoạch và danh sách di động hiển thị đủ 7 SKUs với trạng thái "Chờ xác nhận" và số lượng/giá chuẩn xác.
- **Quy trình & Tôn trọng quyền:**
  - Bổ sung ghi chú theo dõi phản hồi 7–10 ngày sau bàn giao hiện vật.
  - Khẳng định trẻ em tham gia hoàn toàn trên tinh thần tự nguyện (quyền lựa chọn, quan sát, nghỉ ngơi), không áp lực biểu diễn hay chỉ tiêu sản xuất; nhóm chịu trách nhiệm hoàn thiện sản phẩm.

### 2.5. Xử lý Yêu cầu Đánh giá RC01 (`RC01-7e16cf3.md`)
1. **Nâng cỡ chữ `.formula-subnote`:**
   - Điều chỉnh trong `src/pages/minh-bach.astro` từ `0.8125rem` (13px) lên `0.875rem` (14px).
   - Kiểm tra thực tế bằng Puppeteer trên cả 3 viewports: computed `font-size` đạt chính xác `14px` (`0.875rem`), không gây tràn ngang khung thẻ card (`hasOverflow: false`).
2. **Dẫn xuất số lượng sản phẩm thủ công động:**
   - Thay thế toàn bộ chuỗi literal `30/100` ghi cứng trong đoạn chú thích thủ công bằng biến `{craftSummaryText}` được map trực tiếp từ `craftProducts` (`p.plannedQuantity.value` + `p.name.toLowerCase()`).
   - Khi cập nhật số lượng hay danh mục trong `campaign.ts`, nội dung công thức và chú thích tự động đồng bộ, không lặp lại số cứng cũ.

---

## 3. Bằng chứng Kiểm định Kỹ thuật (Verification Evidence)

### 3.1. Typecheck (`npm run check`)
- **Lệnh thực thi:** `npm.cmd run check`
- **Exit code:** 0
- **Kết quả:** 44 files scanned, 0 errors, 0 warnings, 0 hints.
- **Log chi tiết:** Lưu tại `handoff-c01/raw-check.log`.

### 3.2. Unit Tests (`node --test tests/finance.test.mjs`)
- **Lệnh thực thi:** `node --test tests/finance.test.mjs`
- **Exit code:** 0
- **Kết quả:** 18 tests, 3 suites, 18 passed, 0 failed (thời gian chạy: 122ms).
  - Kiểm tra 19 khoản chi đúng 4.935.000đ theo 3 nhóm cụ thể.
  - Kiểm tra ném lỗi khi có khoản chi null.
  - Kiểm tra doanh thu craft 2.200.000đ.
  - Kiểm tra ném lỗi khi gọi calculateTotalRevenueScenario trên 7 SKUs có null.
  - Kiểm tra calculateCombinedPlannedRevenue kết hợp 2 nguồn đạt 6.700.000đ.
  - Kiểm tra propagate null khi thiếu dữ liệu ẩm thực.
  - Kiểm tra kịch bản cơ sở dư 1.765.000đ.
  - Kiểm tra metadata QuantitativeFact của `foodPlannedRevenueAssumption`.
  - Kiểm tra toàn bộ số liệu thực tế actual null / unconfirmed.
  - Kiểm tra loại bỏ hoàn toàn túi bút / túi vải.
  - Kiểm tra format helpers và formatScenarioBalance.
- **Log chi tiết:** Lưu tại `handoff-c01/raw-test.log`.

### 3.3. Build Production (`npm run build`)
- **Lệnh thực thi:** `npm.cmd run build`
- **Exit code:** 0
- **Kết quả:** 7 static routes được sinh ra trong thư mục `dist/` (thời gian build: 512ms).
  - `/404.html`
  - `/dong-hanh/index.html`
  - `/du-an/mang-theo-mot-net-ve/index.html`
  - `/minh-bach/index.html`
  - `/san-pham/index.html`
  - `/ve-nhom/index.html`
  - `/index.html`
- **Log chi tiết:** Lưu tại `handoff-c01/raw-build.log`.

### 3.4. Kiểm thử Trình duyệt Tự động (Puppeteer Chrome Headless)
- **Lệnh thực thi:** `node scratch/audit_and_screenshots_c01.mjs`
- **Browser:** Headless Chrome `154.0.8037.93`
- **Assertions:** 134 assertions kiểm tra toàn diện, **134/134 PASSED**, 0 FAILED.
  - 8 routes kiểm tra HTTP status 200 (kèm 304 khi reload cache), `lang="vi"`, meta robots `noindex, nofollow`, h1 duy nhất, main duy nhất, 0 forms, tiêu đề chuẩn không lặp thương hiệu.
  - Kiểm tra chống tràn ngang (`hasHorizontalScroll: false`) trên toàn bộ 7 trang ở 5 viewports (375px, 414px, 768px, 1024px, 1440px).
  - Kiểm tra mobile menu toggle: mở menu, thuộc tính `aria-expanded="true"`, đóng menu bằng phím Escape, thuộc tính chuyển về `false`.
  - Kiểm tra chi tiết DOM trang Home, Sản phẩm, Minh bạch: xác thực số chi 4.935.000đ, thu 6.700.000đ, số dư +1.765.000đ, 19 khoản chi, 7 SKUs sản phẩm, không có túi bút/túi vải.
  - Kiểm tra hiển thị hình ảnh logo Header/Footer nạp thành công, kích thước tự nhiên hợp lệ.
  - Kiểm tra `.formula-subnote` tại 375px, 768px, 1440px: computed style `font-size >= 14px`, thẻ card không tràn ngang, và nội dung chú thích dẫn xuất động từ `PRODUCTS`.
- **Log chi tiết:** Lưu tại `handoff-c01/browser-audit-results.json`.

### 3.5. Nhật ký Điều chỉnh Bộ kiểm thử (Browser Test Harness History)
Trong các vòng kiểm thử ban đầu, một số điều chỉnh harness kỹ thuật đã được thực hiện để bảo đảm phản ánh đúng trạng thái ứng dụng:
1. **Selector Drawer Menu di động:** Ban đầu selector click chưa trỏ đúng `#mobile-nav-toggle`, đã được điều chỉnh để kích hoạt drawer chính xác và xác nhận chu kỳ `aria-expanded="true"` / `aria-expanded="false"` khi bấm phím Escape.
2. **Xử lý Cache 304 khi Reload:** Khi reload các route tĩnh, trình duyệt trả về mã HTTP 304 (Not Modified) hợp lệ do cache header; assertion reload đã được cập nhật để chấp nhận cả `status === 200` và `status === 304`.
3. **Phân biệt Checker False Flags với Ứng dụng (đã ghi nhận trong RC01):**
   - 21 flags do script checker của reviewer so sánh tỷ lệ khung bao ngoài (element box) với ảnh gốc nhưng bỏ qua thuộc tính `object-fit: contain` (ảnh thực tế hiển thị hoàn toàn đúng tỷ lệ).
   - 1 flag liên kết tự trỏ `/404.html` bị script kỳ vọng mã 200 thay vì 404.
   - 1 flag favicon trả về mã 304 (cache hợp lệ) bị đòi mã 200.
   - Các trường hợp này là do tiêu chí kiểm định của bộ công cụ checker, không phải lỗi của mã nguồn ứng dụng.

---

## 4. Danh mục File Bàn giao Trong `handoff-c01/`

Toàn bộ tài liệu bàn giao, logs và ảnh chụp màn hình được lưu trữ ngoài repository tại:
`C:\Users\tuana\.gemini\antigravity-cli\brain\86498389-9ca4-486e-9ba8-82247107fb96\handoff-c01\`

| STT | Tên file | Kích thước | Mô tả |
| :---: | :--- | :---: | :--- |
| 1 | `handoff-report.md` | — | Báo cáo bàn giao kỹ thuật Task C01 |
| 2 | `check-build-metadata.json` | 4.3 KB | Metadata kiểm định, hashes 17 file dist và 2 logo assets |
| 3 | `raw-check.log` | 691 B | Log gốc lệnh `npm run check` |
| 4 | `raw-test.log` | 2.7 KB | Log gốc lệnh `node --test tests/finance.test.mjs` |
| 5 | `raw-build.log` | 1.6 KB | Log gốc lệnh `npm run build` |
| 6 | `browser-audit-results.json` | 48.0 KB | Báo cáo chi tiết 134 browser assertions từ Chrome headless |
| 7 | `home-desktop-1440-full.png` | 496.9 KB | Chụp full-page Trang chủ (1440px) |
| 8 | `home-tablet-768-full.png` | 496.1 KB | Chụp full-page Trang chủ (768px) |
| 9 | `home-mobile-375-full.png` | 442.9 KB | Chụp full-page Trang chủ (375px) |
| 10 | `product-desktop-1440-full.png` | 476.4 KB | Chụp full-page Sản phẩm (1440px) |
| 11 | `product-tablet-768-full.png` | 426.7 KB | Chụp full-page Sản phẩm (768px) |
| 12 | `product-mobile-375-full.png` | 455.9 KB | Chụp full-page Sản phẩm (375px) |
| 13 | `transparency-desktop-1440-full.png` | 620.1 KB | Chụp full-page Minh bạch thu chi (1440px) sau fix RC01 |
| 14 | `transparency-tablet-768-full.png` | 621.5 KB | Chụp full-page Minh bạch thu chi (768px) sau fix RC01 |
| 15 | `transparency-mobile-375-full.png` | 605.2 KB | Chụp full-page Minh bạch thu chi (375px) sau fix RC01 |
| 16 | `team-desktop-1440-full.png` | 283.0 KB | Chụp full-page Về nhóm (1440px) |
| 17 | `team-tablet-768-full.png` | 274.1 KB | Chụp full-page Về nhóm (768px) |
| 18 | `team-mobile-375-full.png` | 252.9 KB | Chụp full-page Về nhóm (375px) |
| 19 | `project-desktop-1440-full.png` | 393.3 KB | Chụp full-page Câu chuyện dự án (1440px) |
| 20 | `project-tablet-768-full.png` | 375.0 KB | Chụp full-page Câu chuyện dự án (768px) |
| 21 | `project-mobile-375-full.png` | 321.0 KB | Chụp full-page Câu chuyện dự án (375px) |
| 22 | `support-desktop-1440-full.png` | 327.5 KB | Chụp full-page Đồng hành (1440px) |
| 23 | `support-tablet-768-full.png` | 321.2 KB | Chụp full-page Đồng hành (768px) |
| 24 | `support-mobile-375-full.png` | 301.9 KB | Chụp full-page Đồng hành (375px) |
| 25 | `404-desktop-1440-full.png` | 75.1 KB | Chụp full-page Trang 404 (1440px) |
| 26 | `404-tablet-768-full.png` | 64.5 KB | Chụp full-page Trang 404 (768px) |
| 27 | `404-mobile-375-full.png` | 57.8 KB | Chụp full-page Trang 404 (375px) |
| 28 | `mobile-375-menu-open.png` | 27.1 KB | Chụp menu điều hướng mở trên thiết bị di động (375px) |
| 29 | `minh-bach-faq-open.png` | 74.5 KB | Chụp câu hỏi FAQ mở trên trang Minh bạch sau fix RC01 |

---

## 5. Trạng thái Sau Bàn giao (Post-Handoff Protocol)

1. **Cam kết phân định quyền sở hữu:** Không đụng chạm, không stage, không commit các file thuộc quyền sở hữu của Codex Brain (`docs/**`, `README.md`).
2. **Không public:** Không thực hiện `git push`, không deploy công khai, không tự ý chuyển sang Task T05.
3. **Duy trì Preview Server:** Background daemon `task-957` (PID 2888) liên tục lắng nghe tại `http://127.0.0.1:4321/` để phục vụ quy trình đánh giá R_C01 của Codex Brain.
4. **Trạng thái:** **HOLD** hoàn toàn ứng dụng và chờ phản hồi đánh giá.
