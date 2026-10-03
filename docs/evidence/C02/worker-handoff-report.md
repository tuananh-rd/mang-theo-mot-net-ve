# Báo cáo bàn giao Task C02: Tích hợp ảnh minh họa A01–A05 và Đối chiếu doanh thu ẩm thực

**Thời điểm:** 03/10/2026  
**Người thực hiện:** Antigravity (Sole coder)  
**Nhiệm vụ:** Thực hiện toàn diện Task C02 theo đặc tả [`docs/task-specs/C02.md`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/task-specs/C02.md), [`docs/review-handoff-intake.md`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/review-handoff-intake.md) và các yêu cầu chuẩn hóa nguồn dữ liệu.  
**Thư mục bàn giao ngoài repo:** `handoff-c02/`

---

## 1. Thông tin Git & Mã nguồn

- **Baseline HEAD:** `5cdc624f1bbe24d791e6386850428a3c60cb8c46`
- **Branch:** `task/c02-images-content`
- **Commit ứng dụng đã thực hiện (Application Only):**
  - SHA: `221eafa73661cb822b3f8017b7fe1bf367106349`
  - Message: `feat(c02): add A01-A05 stock illustrations and reconcile food revenue`
- **Final App HEAD SHA:** `221eafa73661cb822b3f8017b7fe1bf367106349`
- **Môi trường:** Node `v24.19.0`, Astro `7.3.5`, Chrome `154.0.8037.93`
- **Phạm vi file thay đổi (16 files):**
  - `public/images/illustrations/a01.webp` (mới)
  - `public/images/illustrations/a02.webp` (mới)
  - `public/images/illustrations/a03.webp` (mới)
  - `public/images/illustrations/a04.webp` (mới)
  - `public/images/illustrations/a05.webp` (mới)
  - `src/data/illustrations.ts` (mới)
  - `src/components/ActivityCard.astro`
  - `src/components/Hero.astro`
  - `src/components/PlaceholderIllustration.astro`
  - `src/data/campaign.ts`
  - `src/lib/finance.ts`
  - `src/pages/du-an/mang-theo-mot-net-ve.astro`
  - `src/pages/index.astro`
  - `src/pages/minh-bach.astro`
  - `src/pages/san-pham.astro`
  - `tests/finance.test.mjs`
- **Bảo toàn tài liệu:** Tuyệt đối không stage hay commit các tệp tài liệu, biên bản và evidence của Brain/Claude (`docs/tasks.md`, `docs/task-specs/C02.md`, `docs/review-handoff-intake.md`, `docs/group-content-request.md`, `docs/evidence/C02/**`).

---

## 2. Chi tiết kết quả triển khai

### A. Tích hợp ảnh minh họa Stock A01–A05
- **Chuyển đổi WebP chất lượng tối ưu (q82):**
  - `a01.webp`: 1600×1068 (100,518 bytes) — Minh họa hero và góc tô tượng.
  - `a02.webp`: 1067×1600 (30,248 bytes) — Minh họa góc trang trí chuồn chuồn tre (`objectPosition: 50% 90%`).
  - `a03.webp`: 1600×1067 (89,352 bytes) — Minh họa góc hát cùng nhau.
  - `a04.webp`: 1600×1067 (67,214 bytes) — Minh họa góc trò chơi vận động.
  - `a05.webp`: 1062×1600 (101,026 bytes) — Minh họa bánh su kem (`objectPosition: 50% 80%`).
- **Nguồn gốc & Metadata chuẩn mực (`src/data/illustrations.ts`):**
  - Xác minh đối chiếu khớp 100% SHA-256 từ `docs/evidence/C02/asset-intake.json`.
  - Alt texts mô tả chính xác chủ thể thị giác, không suy đoán sai lệch:
    - A01: *"Bảng màu nước và các loại cọ vẽ đặt trên bàn"*
    - A02: *"Màu vẽ và cọ trên nền màu pastel"*
    - A03: *"Trống lắc màu vàng"* (không giả định chất liệu kim loại).
    - A04: *"Những quả bóng nhựa nhiều màu sắc"*
    - A05: *"Bánh su kem trên đĩa trắng"* (không giả định rắc đường bột).
  - Captions hiển thị trực quan sát dưới hình ảnh, nêu rõ bản chất ảnh minh họa ngữ cảnh, không phải hoạt động hay thành tích của dự án.
  - Link tác giả dẫn tới Pexels có đầy đủ thuộc tính `target="_blank"` và `rel="noreferrer noopener"`.
- **Phân định rõ ràng ảnh Workshop vs Sản phẩm bán:**
  - Hoạt động trải nghiệm góc tạo hình chuồn chuồn dùng ảnh minh họa A02.
  - Sản phẩm bán gây quỹ `chuon-chuon-tre-kem-de`, `moc-khoa`, `set-do-an` và 3 combo nem tiếp tục hiển thị vector SVG chuyên biệt; trường `assetId` trong `PRODUCTS` giữ nguyên `null`.
- **Loại trừ tuyệt đối:** Toàn bộ A06–A11, tệp HTML intake dạng base64 và file PDF gốc được giữ ngoài thư mục mã nguồn và bundle ứng dụng.

### B. Đối chiếu doanh thu ẩm thực (Single Source / Helper)
- **Hàm tính toán độc lập `calculateFoodReconciliation` (`src/lib/finance.ts`):**
  - Loại bỏ các giá trị ngân sách mặc định cứng (`craftRevenue` và `totalExpense` mặc định `null` khi không truyền; không tự gán `2.200.000đ` hay `4.935.000đ`).
  - Hỗ trợ tham số `hypotheticalSets` là `number | QuantitativeFact | null | undefined`. Khi số lượng set chưa rõ (`null` hoặc `undefined`), tự động propagate `null` cho các trường doanh thu tính toán và khoảng chênh, không ép về 0.
  - Tính toán động chính xác:
    - 50 set × 79.000đ = **3.950.000đ**
    - Mục tiêu ẩm thực đề xuất: **4.500.000đ**
    - Khoản chênh chưa phân bổ: **550.000đ**
- **Chuẩn hóa dữ liệu `src/data/campaign.ts`:**
  - Loại bỏ các trường dẫn xuất cứng `foodCalculatedRevenueFromSets: 3950000` và `foodUnallocatedRevenueGap: 550000` khỏi `FINANCE_OVERVIEW`.
  - Giữ duy nhất nguồn số set giả định đề xuất `foodHypotheticalSets: 50`.
  - Thay thế toàn bộ số liệu văn bản lặp lại trong `disclaimer`, `set-do-an`, `PRODUCT_FAQS` và `TRANSPARENCY_FAQS` bằng câu chữ phổ quát giải thích cơ chế đối chiếu và liên kết điều hướng.
- **Thẻ `#doi-chieu-do-an` trực quan tại trang Minh bạch (`/minh-bach`):**
  - Hiển thị 3 cột số liệu đối chiếu: Doanh thu từ set giả định (3.950.000đ), Mục tiêu đề xuất (4.500.000đ), Khoản chênh chưa phân bổ (550.000đ).
  - Nêu rõ 3 điểm phân tích đối soát minh bạch: chưa có bảng phân bổ số lượng × giá từng món, cần làm rõ trùng lặp khẩu phần, và bảo toàn kịch bản cơ sở 6.700.000đ / +1.765.000đ với nhãn kế hoạch chưa kiểm chứng cơ cấu bán.
- **Đồng bộ trên cả 6 trang:**
  - `san-pham.astro`: Mô tả ẩm thực nêu rõ việc đối chiếu và liên kết anchor `/minh-bach#doi-chieu-do-an`.
  - `index.astro`: Subnote kịch bản doanh thu dẫn xuất số liệu và link sang `/minh-bach#doi-chieu-do-an`.
  - `du-an/mang-theo-mot-net-ve.astro`: Ghi chú chân trang liên kết tới bảng đối chiếu ẩm thực.
  - Hệ thống FAQs đồng bộ giải trình minh bạch.

### C. Tối ưu giao diện mobile & Tiêu chuẩn hiển thị
- **Độ cao trang Minh bạch mobile 375px:**
  - Chiều cao đo lường sau khi tích hợp `#doi-chieu-do-an` và tinh chỉnh compact: **10.193px**.
  - So với baseline (12.366px): Giảm **17.57%** (vượt chỉ tiêu $\ge 15\%$ và đạt ngưỡng $\le 10.511$px).
- **Quy chuẩn Font Size:**
  - Toàn bộ nội dung chữ, caption ảnh, ghi chú và credit link đều tuân thủ độ lớn $\ge 14\text{px}$ (`0.875rem`).
- **Kiểm thử cuộn ngang:**
  - 100% không phát sinh cuộn ngang tại 6 viewports (375px, 414px, 768px, 900px, 1024px, 1440px) trên toàn bộ 7 routes.

---

## 3. Bằng chứng kiểm thử & Xác minh kỹ thuật

1. **Astro Diagnostic Check (`npm run check`):**
   - Result: **0 errors, 0 warnings, 0 hints** trên 61 files (raw log: `handoff-c02/raw-worker-check-test-build.log`).
2. **Node Unit Test Runner (`tests/finance.test.mjs`):**
   - Result: **24/24 tests PASS** (4 suites) (raw log: `handoff-c02/raw-worker-check-test-build.log`).
   - Bao gồm đầy đủ các test cases mới: tính toán động với đơn giá/số lượng thay đổi (varied-price / varied-count), xử lý an toàn khi unknown count / null inputs, kiểm tra không lưu trữ dẫn xuất cứng trong `FINANCE_OVERVIEW`.
3. **Static Build (`npm run build`):**
   - 7 static routes sinh thành công trong 662ms (raw log: `handoff-c02/raw-worker-check-test-build.log`).
   - Thư mục `dist/` có 24 tệp (gồm 19 code/assets + 5 WebP illustrations A01–A05).
4. **Browser Test & Visual Capture Harness (`scratch/audit_and_screenshots_c02.mjs`):**
   - Chạy trên Google Chrome `154.0.8037.93` qua server preview cổng `4322`.
   - **113/113 assertions PASS (0 failed)**.
   - Đã lưu kết quả chi tiết tại `handoff-c02/browser-audit-results.json`.
   - Đã lưu metadata và SHA-256 các file dist tại `handoff-c02/check-build-metadata.json`.
   - Đã lưu log raw đầu ra lệnh tại `handoff-c02/raw-worker-check-test-build.log`.
5. **Danh mục ảnh chụp màn hình trong `handoff-c02/` (Tổng cộng đúng 33 tệp PNG):**
   - **23 Full-page screenshots:**
     - 21 ảnh tiêu chuẩn 7 routes × 3 viewports:
       - `home-desktop-1440-full.png`, `home-tablet-768-full.png`, `home-mobile-375-full.png`
       - `du-an-desktop-1440-full.png`, `du-an-tablet-768-full.png`, `du-an-mobile-375-full.png`
       - `ve-nhom-desktop-1440-full.png`, `ve-nhom-tablet-768-full.png`, `ve-nhom-mobile-375-full.png`
       - `san-pham-desktop-1440-full.png`, `san-pham-tablet-768-full.png`, `san-pham-mobile-375-full.png`
       - `minh-bach-desktop-1440-full.png`, `minh-bach-tablet-768-full.png`, `minh-bach-mobile-375-full.png`
       - `dong-hanh-desktop-1440-full.png`, `dong-hanh-tablet-768-full.png`, `dong-hanh-mobile-375-full.png`
       - `404-desktop-1440-full.png`, `404-tablet-768-full.png`, `404-mobile-375-full.png`
     - 2 ảnh full-page kiểm chứng responsive breakpoint bảng/cards sản phẩm:
       - `san-pham-breakpoint-900-full.png`, `san-pham-breakpoint-1024-full.png`
   - **1 Mobile Menu State screenshot:**
     - `mobile-375-menu-open.png`
   - **9 Crop screenshots chi tiết:**
     - `crop-hero-desktop-1440.png`, `crop-hero-mobile-375.png` (A01)
     - `crop-a02-chuonchuon-desktop.png`, `crop-a02-chuonchuon-mobile-375.png` (A02)
     - `crop-a03-hat-desktop.png` (A03)
     - `crop-a05-banhsukem-desktop.png`, `crop-a05-banhsukem-mobile-375.png` (A05)
     - `crop-reconciliation-card-desktop.png`, `crop-reconciliation-card-mobile-375.png` (`#doi-chieu-do-an`)

---

## 4. Trạng thái dịch vụ & Cam kết quy trình

- **Dịch vụ Preview Reviewer (Claude):** Cổng `4321`, PID `21616` — Bảo toàn nguyên vẹn, không can thiệp.
- **Dịch vụ Preview Antigravity:** Cổng `4322`, PID `25960` — Tiếp tục chạy nền phục vụ nghiệm thu.
- **Trạng thái Git:** Không thực hiện `git push`, không deploy công khai, không mở Task T05.
- **Trạng thái thực hiện:** Giữ trạng thái **HOLD** để Codex Brain và chủ dự án nghiệm thu.
