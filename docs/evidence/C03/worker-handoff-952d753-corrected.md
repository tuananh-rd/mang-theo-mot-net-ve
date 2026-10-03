# Báo cáo Bàn giao Task C03: Bố cục nội dung chuyên nghiệp theo Review được chọn lọc

- **Dự án:** Mang Theo Một Nét Vẽ (Nhóm Lăng Kính — AI2015, ĐH FPT Hà Nội)
- **Mã Task:** C03
- **Nhánh Git:** `task/c03-content-layout`
- **Baseline Git HEAD:** `673ba03ceb47df18f84f3362c8124d603e3dc7cf` (App SHA: `221eafa73661cb822b3f8017b7fe1bf367106349`)
- **Final App Commit SHA:** `952d7539a02e4a24d36416ba8d666cccd48aa822` (short: `952d753`)
- **App Commits:**
  1. `92f1c4f45c1d307cde0a4cb801d658b9f5395b06` — `feat(c03): implement professional content layout according to filtered review`
  2. `22ba02649134eed791c9f9ec46ad6e91d7d9ec94` — `fix(c03): resolve undefined CSS tokens, restore keyboard focus and align layout`
  3. `952d7539a02e4a24d36416ba8d666cccd48aa822` — `fix(c03): widen mobile expanded table and notes column for readability`
- **Môi trường:** Node.js `v24.19.0`, Astro `7.3.5`, OS: Windows
- **Máy chủ Preview Antigravity:** `http://127.0.0.1:4322` (PID 25960 — đang chạy nền phục vụ bản build mới nhất)
- **Trạng thái bàn giao:** **HOLD** (Sẵn sàng cho Codex hoàn tất independent browser/visual QA)

---

## 1. Kết quả xử lý phát hiện RC03 ([`docs/reviews/RC03-22ba026.md`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/reviews/RC03-22ba026.md))

### V1 — Mở rộng bảng mobile và cột ghi chú, đảm bảo trải nghiệm đọc tối ưu
- **Thực trạng phát hiện trên `22ba026`:** Khi mở `#mobile-plan-details` ở viewport di động, bảng `.mobile-expanded-table` dùng `width: 100%`, khiến cột ghi chú (`.col-notes`) bị co hẹp quá mức, gây vỡ từ và tạo hàng cao bất thường.
- **Biện pháp khắc phục đã áp dụng trong commit `952d753` (`src/pages/san-pham.astro`):**
  - Gán class cột tương ứng cho toàn bộ thẻ `<th>` trong `<thead>`: `.col-name`, `.col-price`, `.col-qty`, `.col-notes`, `.col-status`.
  - Cấu hình kích thước chuẩn cho `.mobile-expanded-table`:
    - `min-width: 960px; width: 960px; table-layout: fixed;` (nằm trong ngưỡng tối ưu 900–1000px).
  - Phân bổ chiều rộng từng cột:
    - `.col-notes`: `width: 330px; min-width: 280px; line-height: 1.55; word-break: normal; overflow-wrap: break-word;` (đảm bảo dòng văn bản thoáng, đọc rõ ràng, không ngắt cụt từng từ).
    - `.col-name`: `width: 220px; min-width: 200px;`
    - `.col-price`: `width: 130px; min-width: 120px; white-space: nowrap;`
    - `.col-qty`: `width: 120px; min-width: 110px; white-space: nowrap;`
    - `.col-status`: `width: 160px; min-width: 140px; white-space: nowrap;`
- **Kết quả nghiệm thu kỹ thuật & hình ảnh:**
  1. **Chiều cao hàng:** Chiều cao lớn nhất đo được tại 375px/768px/900px là **241.88px** (vượt xa tiêu chí an toàn $< 320\text{px}$).
  2. **Tràn trang:** `document.documentElement.scrollWidth === 375px` ở viewport 375px — **không bị tràn trang** (`pageNoOverflow: true`). Vùng cuộn ngang được đóng gói hoàn toàn trong container `.table-responsive` có nhãn và hint hướng dẫn.
  3. **Tương tác bàn phím & cuộn ngang:** Cuộn ngang được tới cột cuối cùng (`scrollLeft: 651px / maxScroll: 651px`), viền focus bàn phím giữ nguyên màu xanh `3px solid var(--color-focus)`.
  4. **Trạng thái ban đầu & Bảng desktop:** Chi tiết mặc định đóng (`defaultClosed: true`). Bảng desktop trên breakpoint $> 1024\text{px}$ giữ nguyên, không bị ảnh hưởng.
  5. **Ảnh chụp kiểm chứng thực tế:**
     - [`san-pham-375-details-open.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-c03/san-pham-375-details-open.png) (phần đầu bảng khi mở)
     - [`san-pham-375-details-scrolled.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-c03/san-pham-375-details-scrolled.png) (sau khi cuộn ngang sang các cột cuối)

---

## 2. Kết quả Kiểm tra Kỹ thuật

| Lệnh kiểm tra | Kết quả | Chi tiết |
| :--- | :---: | :--- |
| `npm run check` | **PASS (Exit 0)** | 0 errors, 0 warnings, 0 hints trên 75 files Astro/TS (14:47:11Z). |
| `node --test tests/finance.test.mjs` | **PASS (Exit 0)** | **27/27 tests PASS** trên 5 test suites (14:47:16Z). |
| `npm run build` | **PASS (Exit 0)** | Build hoàn tất 7 routes tĩnh vào thư mục `dist/` (24 files, 14:47:26Z). |

- **Log raw thực tế:** Được lưu trữ đầy đủ tại [`handoff-c03/raw-worker-check-test-build.log`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-c03/raw-worker-check-test-build.log) (bao gồm bản ghi chi tiết lần chạy mới nhất trên commit `952d753` và lưu giữ các lần chạy trước đó làm dữ liệu lịch sử).
- **Metadata & Hashes:** Bảng mã băm SHA-256 của toàn bộ 24 file trong `dist/` cùng danh mục 35 ảnh chụp kiểm chứng tại [`handoff-c03/check-build-metadata.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-c03/check-build-metadata.json) (đã cập nhật `finalAppSHA: 952d7539a02e4a24d36416ba8d666cccd48aa822`).

---

## 3. Trạng thái Quy trình

- **Commit Scope:** **APP ONLY** (Chỉ commit file ứng dụng `src/pages/san-pham.astro`, không can thiệp các file kế hoạch/review trong `docs/`).
- **Final Git Commit:** [`952d7539a02e4a24d36416ba8d666cccd48aa822`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve) (short: `952d753`) trên nhánh `task/c03-content-layout`.
- **Preview Server:** `http://127.0.0.1:4322` (PID 25960) đang phục vụ bản build mới nhất của commit `952d753`.
- **Trạng thái thực thi:** **HOLD** — Chuyển giao hoàn toàn cho Codex thực hiện independent visual/browser review.
