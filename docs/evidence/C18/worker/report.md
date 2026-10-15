# Báo cáo Thực hiện Task C18: Cập nhật nội dung công khai theo đề xuất V3 (40 trang)

- **Người thực hiện**: Antigravity (Dispatched Worker)
- **Quản lý / Reviewer**: Claude (Coordinator)
- **Task ID**: `task_64bee2381e79`
- **Dispatch ID**: `ctx_096e052a4d84`
- **Thời gian hoàn thành**: 15/10/2026
- **Worktree**: `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve-c18-v3` (nhánh `task/c18-v3-content`, base `origin/main 0848d12`)

---

## 1. Tóm tắt công việc đã thực hiện

Đã thực hiện cập nhật toàn diện nội dung công khai của website chiến dịch theo đề xuất dự án V3 (40 trang, tháng 10/2026) căn cứ đặc tả `docs/task-specs/C18-V3-content.md` và tài liệu delta `docs/source-intake/V3-40-trang-delta-20261015.md`.

Toàn bộ các yêu cầu từ Mục A (A1–A11), Mục B, Mục C, Mục D đã hoàn thành chính xác. Quá trình triển khai phát hiện quy tắc tranh móc khóa cũ xuất hiện tại 3 tệp ngoài danh mục chỉ định ban đầu (`src/components/ProductGrid.astro`, `src/lib/products.ts`, `src/pages/san-pham.astro`); đã xin ý kiến và được Quản lý Claude chấp thuận phê duyệt sửa đổi đúng chuỗi quy tắc tranh móc khóa A8 qua Orca orchestration.

---

## 2. Bảng đối chiếu các thay đổi chính

| Hạng mục | Trước thay đổi (Final PDF / C06–C07S) | Sau thay đổi (Đề xuất V3 / C18) | Căn cứ V3 / Ghi chú |
| :--- | :--- | :--- | :--- |
| **Lịch tổ chức** | 24/10/2026 & 31/10/2026 (14:00 Thứ Bảy) | **31/10/2026 & 07/11/2026** (14:00 Thứ Bảy) | V3 tr. 10, 13–14. Giờ 14:00 giữ theo thông tin 09/10 chờ xác nhận. |
| **4 hoạt động buổi sinh hoạt** | 4 góc chơi cố định (vẽ tranh tự do, thẻ màu ghép hình...) | 1. Trang trí chuồn chuồn tre<br>2. Tô tượng và giấy ước mơ<br>3. Hát, trò chuyện và chia sẻ<br>4. Trò chơi vận động nhẹ (bowling bóng mềm, chuyền bóng theo nhạc) | V3 tr. 13–14. Agenda 180 phút, 2 phiên sáng tạo 50 phút, 2 lần nghỉ chung. |
| **Tiến độ dự án** | Tuần 1 / 5, cập nhật 09/10/2026 | **Đang triển khai · tuần 2** / 5, cập nhật **2026-10-12** | Đồng bộ bản nháp Studio production ngày 13/10. |
| **Vai trò & mô tả 7 thành viên** | Bản phân công sơ bộ | Cập nhật đầy đủ 7 thành viên và 5 mảng phụ trách | V3 tr. 28. Giữ nguyên 7 họ tên và 7 ảnh đại diện. |
| **Quy trình buổi chơi (`PLAY_FLOW`)** | Quy trình chung 4 góc chơi | Đúng 3 phần: Làm quen & chơi kết nối (35p), Hai phiên sáng tạo (50p/phiên), Giao lưu & đổi quà (25p) | V3 tr. 13–14. |
| **Thực hành an toàn (`SAFETY_PRACTICES`)** | 4 mục an toàn cơ bản | Cập nhật mục 3 (bóng mềm, chơi khi ngồi), bổ sung mục 5 (con dấu tích điểm trên da chỉ dùng khi em đồng ý & Mái ấm chấp thuận) | V3 tr. 14, 21. |
| **Kế hoạch bán hàng (`SALES_PLAN`)** | Danh sách kế hoạch chưa tách tuần | 4 mốc rõ ràng: Đặt trước tuần 6, Mở bán chính tuần 7–8, Đồ ăn chia 2 đợt (≤25 set/đợt), Sau tuần 8 ngừng mở mới | V3 tr. 15. |
| **Quy tắc tranh móc khóa** | "in tranh các em vẽ, chỉ thực hiện khi có sự đồng ý phù hợp từ Mái ấm" | "móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, không dùng tranh của các em trong buổi sinh hoạt" | V3 tr. 37. Áp dụng đồng bộ tại `campaign.ts`, `journal-entries.json`, `ProductGrid.astro`, `products.ts`, `san-pham.astro`. |
| **Nguồn tham chiếu chi phí & kịch bản** | `proposal-final:page-29/30/31/32` | `proposal-v3:page-34`, `proposal-v3:page-35-36`, `proposal-v3:page-37`, `proposal-v3:page-37-38` | V3 tr. 34–38. |
| **Bài viết nhật ký** | Nhắc ngày 24/10 và nội dung 4 góc chơi cũ | Cập nhật `ke-hoach-bon-goc-choi` (ngày 31/10/2026, 4 hoạt động V3); cập nhật `gioi-thieu-qua-luu-niem-gay-quy` (quy tắc móc khóa A8, đặt trước tuần 6, bán chính tuần 7–8) | Khớp nội dung website. |
| **Trang chủ (`index.astro`)** | Dẫn xuất cứng ngày 24/10 và 31/10 | Dẫn xuất động ngày từ `PLANNED_SESSIONS` (hiển thị 31/10 và 07/11, "bốn hoạt động") | Tự động đồng bộ với cấu hình lịch. |

---

## 3. Nhật ký phê duyệt mở rộng phạm vi (Scope Extension Tracking)

- **Vấn đề phát hiện**: Khi rà soát quy tắc tranh móc khóa theo Mục A8, phát hiện chuỗi cũ `"Chưa có ảnh mẫu: móc khóa dự kiến in tranh các em vẽ, chỉ thực hiện khi có sự đồng ý phù hợp từ Mái ấm."` còn tồn tại ở 3 tệp ngoài danh mục A/B/C:
  1. `src/components/ProductGrid.astro:40`
  2. `src/lib/products.ts:89, 95`
  3. `src/pages/san-pham.astro:71`
- **Xử lý**: Tuân thủ nghiêm ngặt nguyên tắc "dừng và báo" tại dòng 10 của `C18-V3-content.md`, worker đã gửi câu hỏi xin ý kiến Quản lý Claude qua `orca orchestration ask` (Message ID: `msg_1ff5872eafe2`).
- **Phê duyệt**: Quản lý Claude đã chấp thuận với chỉ đạo:
  > *"Sửa 3 file này, NHƯNG CHỈ ĐỂ cập nhật quy tắc tranh móc khóa theo A8 ("móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, không dùng tranh của các em trong buổi sinh hoạt"), không đổi logic/layout/styles: Cập nhật test tương ứng nếu có test nào phụ thuộc vào chuỗi cũ, chạy full test + check + build, và ghi rõ trong report việc sửa 3 file này theo chỉ đạo để truy vết."*
- **Thực thi**: Đã thay thế chính xác chuỗi quy tắc A8 tại cả 3 tệp, không can thiệp logic, layout hay styling.

---

## 4. Kết quả kiểm tra và thẩm định (Acceptance Gates)

### 4.1. TypeScript & Astro Typecheck (`npm run check`)
```
> mang-theo-mot-net-ve@0.0.1 check
> astro check

[types] Generated 107ms
[check] Getting diagnostics for Astro files in ...\mang-theo-mot-net-ve-c18-v3...
Result (101 files): 
- 0 errors
- 0 warnings
- 0 hints
```
**Kết quả**: Đạt (0 errors, 0 warnings, 0 hints trên toàn bộ 101 tệp).

### 4.2. Toàn bộ Unit & Integration Tests (`npm test`)
Chạy kiểm thử trên Node native test runner (`node --test tests/*.test.mjs`):
- `tests/content-studio.test.mjs`: 31 tests passed
- `tests/donations.test.mjs`: 14 tests passed (đã cập nhật lịch 31/10 & 07/11, tuần 2, `updatedAt: 2026-10-12`, kiểm tra thứ tự thời gian tăng dần và thứ Bảy, kiểm tra `SALES_PLAN.length === 4`, kiểm tra 7 thành viên 7 ảnh 7 tên khác nhau, kiểm tra không còn ngày cũ `24/10` hay `proposal-final` trong `src/`)
- `tests/finance.test.mjs`: 33 tests passed (đã cập nhật `proposal-v3:page-34`, `page-35-36`, `page-37`, `page-37-38`, tiêu đề kịch bản tài trợ trang 37–38)
- `tests/journal.test.mjs`: 8 tests passed
- `tests/products.test.mjs`: 7 tests passed
**Tổng cộng**: **93 tests passed**, 0 failed, 0 skipped trên 13 suites.

### 4.3. Kiểm tra Build tĩnh (`npm run build`)
```
> mang-theo-mot-net-ve@0.0.1 build
> astro build

[types] Generated 68ms
[build] output: "static"
[build] mode: "static"
[build] directory: ...\dist\
[build] Collecting build info...
[build] ✓ Completed in 104ms.
[build] Building static entrypoints...
[vite] ✓ built in 382ms
[vite] ✓ built in 34ms
[build] Rearranging server assets...
 generating static routes 
  ├─ /404.html (+9ms) 
  ├─ /dong-hanh/index.html (+10ms) 
  ├─ /du-an/mang-theo-mot-net-ve/index.html (+6ms) 
  ├─ /minh-bach/index.html (+5ms) 
  ├─ /nhat-ky/ke-hoach-bon-goc-choi/index.html (+3ms) 
  ├─ /nhat-ky/gioi-thieu-qua-luu-niem-gay-quy/index.html (+2ms) 
  ├─ /nhat-ky/index.html (+3ms) 
  ├─ /san-pham/chuon-chuon-tre-kem-de/index.html (+2ms) 
  ├─ /san-pham/chuon-chuon-tre/index.html (+2ms) 
  ├─ /san-pham/moc-khoa/index.html (+2ms) 
  ├─ /san-pham/index.html (+4ms) 
  ├─ /ve-nhom/index.html (+3ms) 
  ├─ /index.html (+4ms) 
✓ Completed in 78ms.
[build] 13 page(s) built in 683ms
[build] Complete!
```
**Kết quả**: Build thành công 13/13 trang tĩnh, exit code 0.

### 4.4. Quét chuỗi cấm (Grep Verification)
- Lệnh: `git grep -n -E "24/10|2026-10-24|proposal-final|vẽ tranh tự do|thẻ màu ghép hình" src`
  - Kết quả: Duy nhất 1 dòng ví dụ trong chú thích kiểu dữ liệu tại `src/data/journal.ts:45` (`eventDate: string | null; // YYYY-MM-DD | null - Mốc thời gian sự kiện (nếu có, ví dụ 2026-10-24)`). Hoàn toàn không còn chuỗi cũ trong nội dung hay dữ liệu chiến dịch.
- Lệnh: `git grep -n -E "24/10|proposal-final" src/data/campaign.ts src/data/journal-entries.json src/pages/index.astro`
  - Kết quả: 0 kết quả (exit code 1).
- Lệnh: `git grep -n -i "đồng ý phù hợp từ Mái ấm và người giám hộ"`
  - Kết quả: 0 kết quả (exit code 1).

---

## 5. Xác nhận bảo toàn các bất biến (Invariants Verification)

1. **Mục tiêu ủng hộ**: Giữ nguyên đúng 3.000.000đ (`DONATION_ACCOUNT.goalAmount === 3000000`).
2. **Tài khoản thụ hưởng**: Giữ nguyên Techcombank `19072950239011`, chủ tài khoản `NGUYEN NGOC KHOA`, ảnh QR không đổi.
3. **Sổ đối soát**: Giữ nguyên `reconciled: false`, `reconciledAt: null`, `entries: []`.
4. **Sản phẩm & Giá**:
   - Chuồn chuồn tre: 40.000đ/bộ, 30 bộ dự kiến.
   - Móc khóa: 10.000đ/chiếc, 100 chiếc dự kiến.
   - `officialPrice: null`, `actualStock: null`, `saleStatus: 'unconfirmed'`.
5. **Dữ liệu thực tế**: Mọi trường `actual*` trong `ACTUAL_FINANCE` và `FINANCE_OVERVIEW` đều là `null`.
6. **Kênh liên hệ**: Hai số điện thoại (`+84984441726`, `+84343999199`) và fanpage giữ nguyên.
7. **Thành viên nhóm**: Đúng 7 thành viên, 7 họ tên, 7 ảnh đại diện giữ nguyên; chỉ cập nhật vai trò và mô tả nhiệm vụ theo V3 tr. 28.
8. **Dự toán tài chính**: Tổng dự toán chi 5.470.000đ (24 khoản mục), doanh thu cơ sở 7.150.000đ, số dư dự kiến 1.680.000đ, doanh thu ẩm thực 4.950.000đ, doanh thu thủ công 2.200.000đ, lãi ẩm thực 2.070.000đ, lãi thủ công 740.000đ và 5 kịch bản tài trợ bảo toàn nguyên vẹn. Khoản chênh lệch 400.000đ được bảo lưu đúng nguyên tắc.
9. **An toàn tệp**: Không sửa bất kỳ tệp nào trong `public/`, `apps/studio/`, `tools/`, lockfile, ảnh, QR hay `reconciled-donations.json`.

---

## 6. Danh sách tệp sửa đổi trong commit

Nhánh: `task/c18-v3-content` (worktree `mang-theo-mot-net-ve-c18-v3`):
1. `src/components/ProductGrid.astro` (A8 - phê duyệt theo chỉ đạo)
2. `src/data/campaign.ts` (A1..A11)
3. `src/data/journal-entries.json` (B)
4. `src/lib/products.ts` (A8 - phê duyệt theo chỉ đạo)
5. `src/pages/index.astro` (C)
6. `src/pages/san-pham.astro` (A8 - phê duyệt theo chỉ đạo)
7. `tests/donations.test.mjs` (D)
8. `tests/finance.test.mjs` (D)
