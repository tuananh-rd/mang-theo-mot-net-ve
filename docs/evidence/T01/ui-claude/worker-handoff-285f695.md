# Báo cáo Bàn giao Nghiệm thu: Task T01 — Vòng Tối ưu Giao diện Claude

- **Dự án:** Website chiến dịch “Mang Theo Một Nét Vẽ” (Nhóm Lăng Kính, AI2015, SSG105, ĐH FPT Hà Nội)
- **Kỹ sư triển khai (Worker):** Antigravity
- **Người quản lý / Kiến trúc sư (Brain):** Codex
- **Final Commit SHA:** `285f695e6c385ee0de6dff30d89c06aa92f46639`
- **Nhánh Git:** `task/t01-home-shell`
- **Thời điểm nghiệm thu:** 2026-10-02 18:19:18 UTC+7

---

## 1. Tóm tắt Thực thi & Trạng thái Working Tree

- **Phạm vi tác vụ:** Chỉ can thiệp mã nguồn ứng dụng (`src/**`), cấu hình và asset tĩnh (`public/favicon.svg`). Không sửa, xóa hay stage bất kỳ file tài liệu (`README.md`, `docs/**`, `reports/**`) thuộc quyền của Codex Brain.
- **Commit app-only:**
  - Commit bổ sung `285f695`: `fix(ui): optimize mobile layout, card geometry 16:9, and support grid` (8 files trong `src/`).
  - Toàn bộ 2 commit của T01 Claude: `e30f939` + `285f695` dựa trên base `e6aa965`.
- **Working Tree:**
  - Phạm vi ứng dụng (`src/`, `public/`): **SẠCH TUYỆT ĐỐI** (không có uncommitted diff).
  - Không thực hiện `git push`, không deploy public, không mở Task T02.

---

## 2. Bằng chứng Kiểm tra Kỹ thuật & Môi trường Sạch

### 2.1. Cài đặt Sạch từ Lockfile (`clean npm ci`)
- **Thư mục kiểm tra độc lập (ngoài repo):**
  `C:\Users\tuana\AppData\Local\Temp\mang-theo-mot-net-ve-clean-ci-final`
- **Lệnh thực thi:** `powershell.exe -ExecutionPolicy Bypass -File scratch/clean_ci.ps1`
- **Kết quả:**
  ```text
  added 269 packages, and audited 270 packages in 27s
  found 0 vulnerabilities
  npm ci finished with exit code: 0
  ```
- **Exit Code:** `0` (Thành công tuyệt đối, lockfile hoàn toàn nhất quán).

### 2.2. Kiểm tra Kiểu và Template (`npm.cmd run check`)
- **Lệnh thực thi:** `npm.cmd run check`
- **Kết quả:**
  ```text
  Result (22 files): 
  - 0 errors
  - 0 warnings
  - 0 hints
  ```
- **Exit Code:** `0`

### 2.3. Đóng gói Bản dựng Tĩnh (`npm.cmd run build`)
- **Lệnh thực thi:** `npm.cmd run build`
- **Kết quả:**
  - `7 page(s) built in 1.14s`
  - Thư mục `dist/` sạch tuyệt đối, không có file thừa hoặc rò rỉ Markdown.
- **Exit Code:** `0`

### 2.4. Máy chủ Thử nghiệm Production Preview (Loopback)
- **Lệnh thực thi:** `npx astro preview --host 127.0.0.1 --port 4321` (Background daemon task)
- **URL đang phục vụ:** `http://127.0.0.1:4321/`
- **Trạng thái:** Hoạt động ổn định, phục vụ toàn bộ 7 routes + favicon + 404.

---

## 3. Bảng Đối chiếu Chi tiết Các Điểm Góp ý (Claude Review & Brain Review)

| Nhóm / Mã | Nội dung yêu cầu | Trạng thái | Minh chứng thực tế tại SHA `285f695` |
| :--- | :--- | :---: | :--- |
| **B1, U1, L4, R3** | Bỏ tag trạng thái sản phẩm vỡ khung, đổi thứ tự card, thêm notice box, đổi tên Túi bút / Túi vải | **ĐÃ XONG** | ProductCard sắp xếp: Visual → Tên (`h3`) → Hộp giá tham khảo → Mô tả → Nguồn gốc & ghi chú. Notice box riêng biệt. Bỏ hẳn tag viền inline. |
| **U1, U2, R1, B4** | Banner xem trước responsive & footer gọn 1 dòng, touch target >= 44px | **ĐÃ XONG** | Desktop: Banner đầy đủ; Mobile (< 768px): Rút gọn “Bản xem trước — chờ xác nhận”. Footer 1 dòng thông cáo, 6 link danh mục có `min-height: 44px`. |
| **B2, E2, B3, B6** | Header navigation active state, hamburger animation, no-JS fallback | **ĐÃ XONG** | `/dong-hanh` kích hoạt đúng `is-active` và `aria-current="page"`. 404 không active route nào. Hamburger biến đổi thành "X". `@media (scripting: none)` ẩn toggle. |
| **U2, U3, L3, S2** | Hero mobile visual 150px đưa lên trên, first fold CTA lọt trọn trong màn hình | **ĐÃ XONG** | Hero CTA kết thúc ở `629.38px` trên viewport `375x812` (màn hình 812px) → Nằm trọn vẹn trong màn hình đầu tiên (`fitsInFirstFold: true`). |
| **C1, T1-T4** | Typography, contrast tokens, font >= 14px, balance headings | **ĐÃ XONG** | `--color-text-muted: #5d6b79;` (tương phản 5.46:1 trên trắng và 5.16:1 trên nền kem). **0 lỗi tương phản (0 contrast failures)** trên toàn trang. **0 phần tử có font-size < 14px**. Toàn bộ ghi chú dùng chữ thường. |
| **S1, C3, B5, L1, U5** | Minh bạch: khoảng cách badge 12px, số âm trung tính, nút CTA ngắn, Team layout canh giữa | **ĐÃ XONG** | Badge cách H2 đúng `12px`. Số `-220.000đ` dùng màu chữ trung tính `#1f2933`. Nút CTA: “Xem dự toán chi tiết”. Team layout canh giữa (`margin: 0 auto; text-align: center;`). |
| **L2, Mobile Height** | Chiều dài mobile 375px giảm >= 15% (<= 8.920px so với 10.496px) | **ĐÃ ĐẠT** | **8.723px** (Giảm **16.89%** so với 10.496px gốc, thấp hơn ngưỡng 8.920px). |
| **Geometry 16:9** | Visual card mobile: aspect-ratio 16:9, max-height 165px, SVG contain không méo/cắt | **ĐÃ ĐẠT** | Kích thước thẻ tại 375px: `307 x 165px` (tỉ lệ 1.86, bị khống chế bởi `max-height: 165px`), toàn bộ hình SVG hiển thị `object-fit: contain` nguyên vẹn, không cắt méo. |
| **Support Grid** | Cột support: Desktop 3 cột, Tablet 2 cột, Mobile 1 cột | **ĐÃ ĐẠT** | - Mobile (320px & 375px): `1fr` (`343px` tại 375, `288px` tại 320)<br>- Tablet (768px): `repeat(2, 1fr)` (`348px 348px`)<br>- Desktop (1440px): `repeat(3, 1fr)` (`368px 368px 368px`) |
| **E1 (Favicon & 404)** | Favicon SVG chuồn chuồn tre & hoàn thiện trang 404 | **ĐÃ XONG** | File `public/favicon.svg` motif chuồn chuồn tre. Trang 404 thu gọn số 3.5rem và bổ sung link điều hướng phụ. |

---

## 4. Đo đạc Thực tế qua Headless Chrome (Chrome/154.0.8037.93)

### 4.1. Kích thước Viewport & Chiều dài Trang (`scrollHeight`)

| Viewport | Kích thước Viewport | `scrollHeight` Thực tế | Hiện tượng Tràn ngang (`overflow`) | Tỷ lệ giảm so với gốc (10.496px) |
| :--- | :---: | :---: | :---: | :---: |
| **Mobile 320** | `320 x 640` | `9.297px` | Không (`false`) | -11.42% |
| **Mobile 375** | `375 x 812` | **`8.723px`** | Không (`false`) | **-16.89%** (Đạt chỉ tiêu <= 8.920px) |
| **Tablet 768** | `768 x 1024` | `7.323px` | Không (`false`) | -30.23% |
| **Desktop 1024** | `1024 x 768` | `5.554px` | Không (`false`) | -47.08% |
| **Desktop 1440** | `1440 x 900` | `5.451px` | Không (`false`) | -48.07% |

### 4.2. Kiểm tra Màn hình Đầu tiên (First Fold trên Mobile 375x812)
- **Đỉnh Banner xem trước:** `0px`
- **Đáy Header:** `101.59px`
- **Visual minh họa Hero:** Top `117.59px` — Bottom `320.59px` (Chiều cao gọn `150px` với padding/border)
- **Tiêu đề H1:** Top `336.59px`
- **Slogan:** Bottom `466.78px`
- **Nút CTA chính (“Khám phá dự án”):** Bottom **`629.38px`** (Viewport cao 812px)
- **Kết luận:** **`fitsInFirstFold: true`** — Toàn bộ nhận diện và nút hành động chính nằm trọn trong màn hình đầu tiên khi người dùng mở trang.

### 4.3. Kiểm tra Tính năng Menu Mobile & Tương tác Bàn phím
- Nút Toggle: `id="mobile-nav-toggle"`, `aria-label="Mở menu điều hướng"`, kích thước touch target `48 x 48px`.
- Trạng thái đóng: `aria-expanded="false"`, menu panel có thuộc tính `hidden`.
- Khi kích hoạt mở: `aria-expanded="true"`, panel mở ra `display: flex`, icon hamburger chuyển động thành chữ "X".
- Khi bấm phím `Escape`: Menu tự động đóng lại, `aria-expanded="false"`, focus bàn phím được giữ lại ngay trên nút toggle.

---

## 5. Danh mục Ảnh chụp Bàn giao (Thư mục TEMP ngoài repo)

Toàn bộ ảnh chụp màn hình được lưu trữ tại thư mục TEMP độc lập:
`C:\Users\tuana\.gemini\antigravity-cli\brain\86498389-9ca4-486e-9ba8-82247107fb96\handoff-t01-claude\`

| Tên File | Độ phân giải (px) | Kích thước File | Mô tả |
| :--- | :---: | :---: | :--- |
| `mobile-320-viewport.png` | `320 x 640` | 40.8 KB | Màn hình đầu tiên mobile 320 |
| `mobile-320-full.png` | `320 x 9297` | 421.1 KB | Toàn bộ trang mobile 320 (support 1 cột) |
| `mobile-375-viewport.png` | `375 x 812` | 51.5 KB | First fold mobile 375 (CTA nằm trọn vẹn) |
| `mobile-375-menu-open.png` | `375 x 812` | 35.3 KB | Mobile menu mở, icon "X", active item |
| `mobile-375-full.png` | `375 x 8723` | 421.4 KB | Toàn bộ trang mobile 375 (chiều cao 8.723px) |
| `tablet-768-viewport.png` | `768 x 1024` | 80.9 KB | Màn hình đầu tiên tablet 768 |
| `tablet-768-full.png` | `768 x 7323` | 474.6 KB | Toàn bộ trang tablet 768 (support 2 cột) |
| `desktop-1024-viewport.png` | `1024 x 768` | 96.5 KB | Màn hình đầu tiên desktop 1024 |
| `desktop-1024-full.png` | `1024 x 5554` | 474.0 KB | Toàn bộ trang desktop 1024 |
| `desktop-1440-viewport.png` | `1440 x 900` | 110.5 KB | Màn hình đầu tiên desktop 1440 |
| `desktop-1440-full.png` | `1440 x 5451` | 472.4 KB | Toàn bộ trang desktop 1440 (support 3 cột) |
| `browser-audit-results.json` | — | 11.2 KB | Dữ liệu đo đạc chi tiết tự động từ Chrome |

---

## 6. Trạng thái Sẵn sàng Bàn giao

- **Mã nguồn:** Đã commit vào nhánh `task/t01-home-shell` tại SHA `285f695e6c385ee0de6dff30d89c06aa92f46639`.
- **Máy chủ preview:** Tiếp tục giữ chạy ngầm trên loopback `http://127.0.0.1:4321/` để phục vụ Codex Brain nghiệm thu.
- **Tuân thủ quy tắc:** Không push remote, không mở Task T02, không sửa tài liệu của Codex Brain.
