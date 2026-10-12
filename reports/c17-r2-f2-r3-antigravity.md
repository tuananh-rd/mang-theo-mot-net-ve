# Báo cáo Triển khai Task C17-R2-F2-R3 — Đóng các Phát hiện F1/F2 của Review RC17-R2-F2-R2

- **Người thực hiện:** Antigravity (Dispatched Worker)
- **Người quản lý / Reviewer:** Claude (`term_41c3e57c-09e8-4ab1-b7e8-58d363fbec9a`)
- **Task ID:** `task_b98210640601`
- **Dispatch ID:** `ctx_f4d03cda20fb`
- **Baseline:** `26642ce3651d5d3944df4aa0b4efac0c783e2967` (RC review commit `8ddafce` trên nền `e5f9823`)
- **Code Commit SHA:** `d3407f1b96505b85798d4331862eef276cb7c58f`
- **Trạng thái:** Hoàn thành (Succeeded) — 100% Quality Gates Exit 0

---

## 1. Tóm tắt Thực thi (Executive Summary)

1. **Khắc phục triệt để F1 (Biểu mẫu Project & Nguồn dữ liệu Chuẩn tắc):**
   - Đã loại bỏ hoàn toàn các mảng sao chép cứng seed data bên trong script UI (`apps/studio/src/ui/html.ts`), thay bằng dữ liệu chuẩn tắc `window.DEFAULT_PROJECT_DATA` (từ `getDefaultModuleData('project')`) và `window.APPROVED_MEDIA_REGISTRY` (từ `APPROVED_MEDIA_REGISTRY`) được inject trực tiếp từ máy chủ.
   - Sửa toàn bộ logic đọc `FormData`: chuyển từ `fd.get(x) || old` sang kiểm tra hiện diện `fd.has(name)`. Khi người dùng xóa trắng các trường tùy chọn (`badge`, `note`, `description`, `slogan`, `notice`, `step_desc`), giá trị lưu trữ và hiển thị sau khi reload là chuỗi rỗng `""`, không bị revert về bản nháp cũ.
   - Bổ sung xác thực hợp lệ có cảnh báo (toast) cho các trường bắt buộc (`title`, `projectTitle`, `projectSummary`, `step_title`, v.v.), ngăn chặn lưu dữ liệu rỗng vô tình hoặc âm thầm.

2. **Khắc phục F2 & F3 (Tính trung thực SHA, Đặt tên Test & Bằng chứng Trình duyệt):**
   - Đổi tên test tầng DB trong `apps/studio/tests/c17-r2-f2.test.mjs` thành `DB Regression: /nhat-ky/detail và /san-pham/detail SEO keys bảo toàn nguyên vẹn qua các thao tác lưu D1 và loại bỏ route rỗng`.
   - Bổ sung unit test kiểm tra lưu và nạp lại chuỗi rỗng cho các trường tùy chọn trong `apps/studio/tests/c17-r2-f2.test.mjs`.
   - Xây dựng và thực thi bộ kiểm thử trình duyệt thực tế mới `docs/evidence/C17/R2-F2-R3/worker/browser-verification.mjs` trên commit SHA `d3407f1b96505b85798d4331862eef276cb7c58f`:
     - Có giới hạn thời gian cứng từng test (hard timeout 60s) và bounded teardown tránh treo tiến trình.
     - Kiểm thử chọn toàn bộ và xóa trắng (`clickCount: 3` + `Backspace`) trường `note` và `badge` tùy chọn của hoạt động, lưu vào D1, reload trang và xác nhận giá trị đúng rỗng `""`.
     - Kiểm thử thay thế toàn bộ (không phải gõ nối) cho các trường `title`, giai đoạn, nhu cầu và câu hỏi FAQ, khẳng định giá trị lưu và hiển thị khớp chính xác 100%.
     - Báo cáo kết quả `docs/evidence/C17/R2-F2-R3/worker/browser-report.json` mang dấu ấn đúng mã SHA `d3407f1b96505b85798d4331862eef276cb7c58f`.

---

## 2. Chi tiết Sửa đổi Kỹ thuật

### 2.1. Biểu mẫu Project & Nguồn dữ liệu Chuẩn tắc (`apps/studio/src/ui/html.ts`)
- **Nhập module:**
  ```typescript
  import { getDefaultModuleData } from '../core/defaults.js';
  import { APPROVED_MEDIA_REGISTRY } from '../core/media.js';
  ```
- **Serialization vào thẻ `<script>`:**
  ```typescript
  window.DEFAULT_PROJECT_DATA = ${JSON.stringify(getDefaultModuleData('project'))};
  window.APPROVED_MEDIA_REGISTRY = ${JSON.stringify(APPROVED_MEDIA_REGISTRY)};
  ```
- **Loại bỏ dữ liệu trùng lặp trong UI:**
  - `renderProjectEditor`: `const defaultProj = window.DEFAULT_PROJECT_DATA || {};` sử dụng cho các fallback khi thêm mới mục.
  - `renderMediaEditor`: `window.APPROVED_MEDIA_REGISTRY.filter(a => a.status === 'approved')` hợp nhất với media từ D1.
- **Xử lý chuỗi rỗng và kiểm tra hiện diện `fd.has`:**
  - Hoạt động: `badge: fd.has('act_badge_${idx}') ? String(fd.get('act_badge_${idx}')).trim() : (a.badge || '')`
  - Ghi chú: `note: fd.has('act_note_${idx}') ? String(fd.get('act_note_${idx}')).trim() : (a.note || '')`
  - Mô tả: `description: fd.has('act_desc_${idx}') ? String(fd.get('act_desc_${idx}')).trim() : (a.description || '')`
  - Tương tự cho `plannedStages`, `needs`, `sessions`, `contacts`, `steps`.
- **Validation trường bắt buộc:**
  - Nếu `!projectTitle` hoặc `!projectSummary`: hiển thị toast lỗi và return ngay.
  - Nếu `!activityTitle`, `!stageTitle`, `!needTitle`, `!stepTitle`: hiển thị toast lỗi chỉ rõ mục và index, không gửi POST request.

### 2.2. Kiểm thử Tự động (`apps/studio/tests/c17-r2-f2.test.mjs`)
- **Trung thực hóa tên test:**
  `DB Regression: /nhat-ky/detail và /san-pham/detail SEO keys bảo toàn nguyên vẹn qua các thao tác lưu D1 và loại bỏ route rỗng`
- **Bổ sung Unit Test xóa trắng trường tùy chọn:**
  `Project Data: cleared optional fields (badge, note, description) save and reload as empty strings, not reverting to defaults`
  - Cập nhật bản nháp với `badge: ''`, `note: ''`, `description: ''`.
  - Nạp lại từ `dbClient.getDraft('project')` và assert `assert.equal(..., '')`.

### 2.3. Harness Trình duyệt Thực tế (`docs/evidence/C17/R2-F2-R3/worker/browser-verification.mjs`)
- Tự động lấy Git SHA qua `git rev-parse HEAD` để bảo đảm tính trung thực tuyệt đối.
- Giới hạn thời gian tổng và từng bước: `PAGE_TIMEOUT_MS = 60000`, `SERVER_READY_TIMEOUT_MS = 45000`.
- Thao tác xóa trắng bằng Puppeteer:
  ```javascript
  await noteInput.click({ clickCount: 3 });
  await noteInput.press('Backspace');
  await badgeInput.click({ clickCount: 3 });
  await badgeInput.press('Backspace');
  ```
- Khẳng định sau reload:
  ```javascript
  assert.equal(savedAct1.badge, '', 'Badge phải được lưu và nạp lại là chuỗi rỗng');
  assert.equal(savedAct1.note, '', 'Note phải được lưu và nạp lại là chuỗi rỗng');
  ```
- Khẳng định thay thế toàn bộ tiêu đề:
  ```javascript
  assert.equal(savedAct1.title, newAct1Title, 'Tiêu đề hoạt động phải được thay thế hoàn toàn');
  ```

---

## 3. Bằng chứng Thực thi Quality Gates (Raw Logs & Exit Codes)

### 3.1. Biên dịch TypeScript Studio (`npm run studio:build`)
- **Lệnh:** `npm run studio:build`
- **Mã thoát:** 0
```
> mang-theo-mot-net-ve@0.0.1 studio:build
> tsc -p apps/studio/tsconfig.json
```

### 3.2. Biên dịch Astro Cloudflare Preview Server (`npx astro build --config astro.preview.config.mjs`)
- **Lệnh:** `npx astro build --config astro.preview.config.mjs`
- **Mã thoát:** 0
```
05:56:45 [types] Generated 285ms
05:56:45 [build] output: "server"
05:56:45 [build] mode: "server"
05:56:45 [build] directory: C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\dist-preview\
05:56:45 [build] adapter: @astrojs/cloudflare
05:56:45 [build] Collecting build info...
05:56:45 [build] ✓ Completed in 394ms.
05:56:45 [build] Building server entrypoints...
05:56:45 [vite] ✓ built in 324ms
05:56:46 [build] Rearranging server assets...
05:56:46 [build] ✓ Completed in 1.10s.
05:56:46 [@astrojs/cloudflare] Injected immutable Cache-Control for /_astro/* into _headers.
05:56:46 [build] Server built in 1.51s
05:56:46 [build] Complete!
```

### 3.3. Kiểm tra Toàn diện Cú pháp Dự án Root (`npm run check`)
- **Lệnh:** `npm run check`
- **Mã thoát:** 0
```
Result (244 files): 
- 0 errors
- 0 warnings
- 36 hints
```

### 3.4. Bộ Kiểm thử Root (`npm test`)
- **Lệnh:** `npm test`
- **Mã thoát:** 0
```
ℹ tests 96
ℹ suites 13
ℹ pass 96
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 833.7954
```

### 3.5. Kiểm tra Type Studio (`npm run studio:typecheck`)
- **Lệnh:** `npm run studio:typecheck`
- **Mã thoát:** 0
```
> mang-theo-mot-net-ve@0.0.1 studio:typecheck
> tsc --noEmit -p apps/studio/tsconfig.json
```

### 3.6. Bộ Kiểm thử Ứng dụng Studio (`npm run studio:test`)
- **Lệnh:** `npm run studio:test`
- **Mã thoát:** 0
```
ℹ tests 64
ℹ suites 4
ℹ pass 64
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 10962.3237
```

### 3.7. Bộ Kiểm thử Trình duyệt Thực tế (`docs/evidence/C17/R2-F2-R3/worker/browser-verification.mjs`)
- **Lệnh:** `node docs/evidence/C17/R2-F2-R3/worker/browser-verification.mjs`
- **Mã thoát:** 0
- **Dữ liệu xuất ra:**
```
=== KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT C17-R2-F2-R3 ===
- Git SHA: d3407f1b96505b85798d4331862eef276cb7c58f
- Tổng quan sát: 32
- Lỗi console/page: 0
- 22 tài sản media chuẩn tắc: HỢP LỆ
- Báo cáo chi tiết: docs/evidence/C17/R2-F2-R3/worker/browser-report.json
```
- **Xác nhận từ `browser-report.json`:**
  - `sha`: `"d3407f1b96505b85798d4331862eef276cb7c58f"`
  - `act1BadgeClearedSuccessfully`: `true` (giá trị lưu và nạp lại: `""`)
  - `act1NoteClearedSuccessfully`: `true` (giá trị lưu và nạp lại: `""`)
  - `act1TitleReplacedExactly`: `true`
  - `stg1TitleReplacedExactly`: `true`
  - `need1TitleReplacedExactly`: `true`
  - `contactsNullPreserved`: `true`
  - `noPhotoPreservedForMocKhoa`: `true`
  - `occConflict409Confirmed`: `true`
  - `allSaveButtonsDisabledForReviewer`: `true`
  - Toàn bộ 29 ảnh chụp màn hình được lưu trữ tại `docs/evidence/C17/R2-F2-R3/worker/screenshots/`.

---

## 4. Giới hạn & Tuân thủ Nguyên tắc Dự án

1. **Phạm vi Môi trường:** Toàn bộ kiểm thử được thực thi trên môi trường local cô lập (Chrome Puppeteer Headless, Cloudflare workerd qua `unstable_dev`, SQLite Miniflare D1 mô phỏng, InMemory/Local R2 Bucket).
2. **Không kích hoạt Đám mây (No F3 / No Cloud Activation):** Không kích hoạt Cloudflare Access, không tạo tài nguyên Cloudflare D1/R2 trực tiếp trên internet, không đẩy lên GitHub remote.
3. **Bảo toàn Cây làm việc:**
   - Không can thiệp hoặc xóa các thư mục `apps/studio/test-race-*`.
   - Không chỉnh sửa hoặc xóa các tài liệu quy hoạch `docs/*` và `README.md` do Quản lý sở hữu.
   - Chỉ thêm và commit đúng các tệp thuộc phạm vi được giao.
