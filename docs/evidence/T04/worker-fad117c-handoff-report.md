# Báo cáo Bàn giao Kỹ thuật Task T04 — Hoàn thiện Bản xem trước (Preview Polish)

- **Mã Task:** T04
- **Nhánh triển khai:** `task/t04-preview-polish`
- **Base commit:** `1b6d678203a89cc8f2f384d08e50ee65e88a02a4`
- **Final commit SHA:** `fad117c7e12a80775b0dbd0ad93ff464db60fcb9`
- **Model:** Gemini 3.8 Flash (High)
- **Môi trường:** Windows PowerShell, Node.js v24.19.0, Astro 7.3.5, Chrome Headless (Puppeteer-Core)
- **Preview Server Daemon:** `task-957` (PID 2888) lắng nghe loopback `http://127.0.0.1:4321/`

---

## 1. Nội dung Triển khai và Giải quyết Feedback R04

### 1.1. Giải quyết Finding 1 từ R04: Đồng nhất nguồn số lượng và đơn giá sản phẩm
- **Loại bỏ hai nguồn số:** Xóa bỏ hoàn toàn thuộc tính hardcode `planQuantityText` (vốn chứa hardcoded các chuỗi "30 bộ bán dự kiến", "20 chiếc dự kiến", "Tối đa 8 chiếc").
- **Tách bạch số lượng và tiền tố định tính:**
  - Trong `src/data/campaign.ts`, trường `Product` dùng `quantityPrefix?: string` để lưu qualifier định tính (ví dụ: `'Tối đa '` cho túi vải; chuồn chuồn tre và túi bút không có prefix).
  - Số lượng chỉ lấy từ một nguồn duy nhất: `plannedQuantity.value` (30, 20, 8).
  - Đơn vị tính lấy từ `plannedQuantity.unit` ('bộ bán dự kiến', 'chiếc dự kiến', 'chiếc').
- **Tập trung hóa helper hiển thị trong `src/lib/finance.ts`:**
  - `formatProductQuantity(product)`: Dẫn xuất `${prefix}${value} ${unit}`. Khi `plannedQuantity.value` là `null`, trả về `'Chưa xác nhận'` mà không tự suy diễn số cũ.
  - `formatProductPrice(product)`: Khi `referencePrice.value` là `null`, trả về thuần `'Chưa xác nhận'`, **tuyệt đối không tự ghép thêm đơn vị `/bộ` hay `/chiếc`**.
- **Đồng bộ toàn bộ view:** Bảng desktop/tablet tại `/san-pham`, danh sách thẻ mobile tại `/san-pham`, và thẻ component `ProductCard.astro` tại trang chủ `/` cùng `/san-pham` đều sử dụng chung helper này (trang `/dong-hanh` sử dụng các thẻ phương thức đồng hành riêng, không dùng `ProductCard`).

### 1.2. Giải quyết Finding 2 từ R04: Bảo toàn dấu và trạng thái chênh lệch ngân sách trên trang chủ
- **Loại bỏ fallback che giấu trạng thái:** Không sử dụng nhánh fallback `else '0đ'` vốn gây sai lệch khi số liệu unknown hoặc có số dư dương.
- **Helper `formatScenarioBalance(result)` trong `src/lib/finance.ts`:**
  - **Trạng thái âm (< 0):** Trả về chuỗi định dạng (ví dụ: `-220.000đ`), class CSS `diff-negative`.
  - **Trạng thái cân bằng (= 0):** Trả về chuỗi `'0đ'`, class CSS `diff-neutral`.
  - **Trạng thái dương (> 0):** Trả về chuỗi có dấu cộng (ví dụ: `+280.000đ`), class CSS `diff-positive`.
  - **Trạng thái chưa xác nhận (null / unknown):** Trả về `'Chưa xác nhận'`, class CSS `diff-neutral`, không tự ý ép về 0đ.
- **Cập nhật giao diện `src/pages/index.astro`:** Markup hiển thị `<span class={balanceDisplay.diffClass}>{balanceDisplay.text}</span>` và định dạng CSS tương ứng cho cả 3 class.

### 1.3. Chuẩn hóa Page Titles (Toàn bộ 6 trang + 404)
Cập nhật `src/layouts/Layout.astro` và các trang để loại bỏ hoàn toàn việc lặp tên dự án:
- `/` -> `Trang chủ | Mang Theo Một Nét Vẽ — Lăng Kính`
- `/du-an/mang-theo-mot-net-ve` -> `Câu chuyện dự án | Mang Theo Một Nét Vẽ — Lăng Kính`
- `/ve-nhom` -> `Về nhóm Lăng Kính | Mang Theo Một Nét Vẽ`
- `/san-pham` -> `Sản phẩm gây quỹ dự kiến | Mang Theo Một Nét Vẽ — Lăng Kính`
- `/minh-bach` -> `Minh bạch thu chi | Mang Theo Một Nét Vẽ — Lăng Kính`
- `/dong-hanh` -> `Đồng hành cùng dự án | Mang Theo Một Nét Vẽ — Lăng Kính`
- `/404.html` -> `Không tìm thấy trang (404) | Mang Theo Một Nét Vẽ — Lăng Kính`

---

## 2. Bằng chứng Kiểm tra Kỹ thuật (Verification Evidence)

| Lệnh kiểm tra | Exit Code | Kết quả chi tiết | File log lưu trữ |
| :--- | :---: | :--- | :--- |
| `npm.cmd run check` | **0** | 37 files checked: **0 errors, 0 warnings, 0 hints** | `handoff-t04/raw-check.log` |
| `node --test tests/finance.test.mjs` | **0** | 3 test suites, **16 tests passed**, 0 failed | `handoff-t04/raw-test.log` |
| `npm.cmd run build` | **0** | 7 static HTML pages biên dịch thành công trong 478ms | `handoff-t04/raw-build.log` |
| Lockfile Hash Audit | **MATCH** | SHA256 `ff3aa78d...` khớp 100% với Clean-CI từ T01 | `handoff-t04/clean-ci-evidence.json` |
| Bundle & Dist Audit | **PASS** | 15 dist files; 7 HTML pages đều có `noindex, nofollow`; 0 tài liệu thô/bí mật | `dist/` |
| Browser Puppeteer Audit | **0** | **117/117 assertions passed**, 0 failed | `handoff-t04/browser-audit-results.json` |

---

## 3. Danh mục Ảnh chụp Nghiệm thu (Artifacts trong `handoff-t04/`)

### 3.1. 21 Ảnh Chụp Toàn Trang (Full-page Screenshots: 7 trang × 3 kích thước 375, 768, 1440)
1. **Trang chủ (`/`):**
   - `home-mobile-375-full.png` (375×8723px)
   - `home-tablet-768-full.png` (768×7323px)
   - `home-desktop-1440-full.png` (1440×5451px)
2. **Câu chuyện dự án (`/du-an/mang-theo-mot-net-ve`):**
   - `project-mobile-375-full.png` (375×6432px)
   - `project-tablet-768-full.png` (768×5252px)
   - `project-desktop-1440-full.png` (1440×4267px)
3. **Về nhóm Lăng Kính (`/ve-nhom`):**
   - `team-mobile-375-full.png` (375×4746px)
   - `team-tablet-768-full.png` (768×3750px)
   - `team-desktop-1440-full.png` (1440×3298px)
4. **Sản phẩm gây quỹ dự kiến (`/san-pham`):**
   - `product-mobile-375-full.png` (375×5782px)
   - `product-tablet-768-full.png` (768×4381px)
   - `product-desktop-1440-full.png` (1440×3708px)
5. **Minh bạch thu chi (`/minh-bach`):**
   - `transparency-mobile-375-full.png` (375×9048px)
   - `transparency-tablet-768-full.png` (768×6165px)
   - `transparency-desktop-1440-full.png` (1440×5573px)
6. **Đồng hành cùng dự án (`/dong-hanh`):**
   - `support-mobile-375-full.png` (375×6105px)
   - `support-tablet-768-full.png` (768×5133px)
   - `support-desktop-1440-full.png` (1440×4157px)
7. **Trang 404 (`/404.html`):**
   - `404-mobile-375-full.png` (375×1405px)
   - `404-tablet-768-full.png` (768×1170px)
   - `404-desktop-1440-full.png` (1440×1125px)

### 3.2. Ảnh Tương tác Giao diện
- `mobile-375-menu-open.png` (375×812px): Minh chứng Mobile Navigation Drawer mở đầy đủ link và đóng khi nhấn phím Escape.
- `minh-bach-faq-open.png` (1440×900px): Minh chứng FAQ accordion mở câu trả lời trực quan.

---

## 4. Tài liệu Vận hành Ngoài Repo
- Đã hoàn thành file `handoff-t04/operations-notes.md` hướng dẫn chi tiết cách cập nhật dữ liệu, bảo trì nguồn số đơn nhất, quy trình build/preview, xử lý định tuyến 404 trên static host và checklist thẩm duyệt trước khi go-live.

---

## 5. Trạng thái Bàn giao
- Antigravity Worker đã hoàn tất toàn bộ yêu cầu của Task T04 và xử lý triệt để 2 feedback từ R04.
- Duy trì trạng thái **HOLD**, giữ nguyên Preview Server `task-957` (PID 2888) lắng nghe trên `http://127.0.0.1:4321/`.
- Sẵn sàng bàn giao cho Codex Brain thẩm định R04.
