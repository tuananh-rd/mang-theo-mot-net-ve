# Báo cáo Bàn giao Nghiệm thu Task T02: Ba Trang Nội Dung Dự án, Nhóm và Sản phẩm

- **Dự án:** Website chiến dịch “Mang Theo Một Nét Vẽ” (Nhóm Lăng Kính, AI2015, SSG105, ĐH FPT Hà Nội)
- **Kỹ sư triển khai (Worker):** Antigravity
- **Người quản lý / Kiến trúc sư (Brain):** Codex
- **Final Commit SHA:** `311dc33f472b8969de99872927822b0f7f566679`
- **Commit Base:** `fff88b2209e3c2836c06125bad1a7084bdc50590`
- **Nhánh Git:** `task/t02-content-pages`
- **Model thực tế:** Gemini 3.8 Flash (High)
- **Thời điểm nghiệm thu:** 2026-10-02 21:57:39 UTC+7

---

## 1. Tóm tắt Phạm vi Thực hiện & Git Stat

- **Phạm vi tác vụ:** Thay thế hoàn toàn 3 trang shell tạm thời bằng 3 trang nội dung đầy đủ theo đặc tả [`docs/task-specs/T02.md`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/task-specs/T02.md):
  1. `/du-an/mang-theo-mot-net-ve` (Trang dự án)
  2. `/ve-nhom` (Trang nhóm Lăng Kính)
  3. `/san-pham` (Trang sản phẩm gây quỹ dự kiến)
- **Các trang & thành phần giữ nguyên:**
  - Trang chủ (`/`), Header, Footer, Trang 404: Duy trì trọn vẹn styling, tokens, tương tác menu đã nghiệm thu trong R01 UI Claude.
  - `/minh-bach` và `/dong-hanh`: Giữ nguyên dạng shell chờ Task T03 theo đúng kế hoạch phân kỳ.
- **Git Commit Stat:**
  ```text
  Commit 311dc33: feat(pages): implement project, team, and product content pages for T02
  4 files changed, 1398 insertions(+), 97 deletions(-)
  modified:   src/data/campaign.ts
  modified:   src/pages/du-an/mang-theo-mot-net-ve.astro
  modified:   src/pages/san-pham.astro
  modified:   src/pages/ve-nhom.astro
  ```
- **Working Tree:**
  - Phạm vi ứng dụng (`src/**`, `public/**`): **SẠCH TUYỆT ĐỐI** (không có uncommitted diff).
  - Không sửa, không stage hay commit các file tài liệu/bằng chứng thuộc quyền của Codex Brain (`README.md`, `docs/tasks.md`, `docs/evidence/T02/`, `docs/task-specs/T02.md`).
  - Không thực hiện `git push`, không deploy public, không mở Task T03.

---

## 2. Chi tiết Triển khai Ba Trang Nội Dung Mới

### 2.1. Trang Dự án (`/du-an/mang-theo-mot-net-ve`)
- **Cấu trúc & Ngữ nghĩa:**
  - Semantic breadcrumb: `<nav aria-label="Đường dẫn trang">` (Trang chủ / Dự án).
  - Duy nhất 1 thẻ H1: `Mang Theo Một Nét Vẽ`.
  - Slogan: *“Một buổi chơi phù hợp, một món quà đúng nhu cầu.”*
  - Badge trạng thái đề xuất: *“Bản xem trước — nội dung đề xuất”*.
  - Visual hero: Minh họa compact (khống chế `max-width: 560px` trên tablet và `150px` trên mobile).
  - Hai nút CTA: “Xem sản phẩm gây quỹ” (`/san-pham`) và “Xem các góc hoạt động” (`#buoi-choi`).
- **Nội dung câu chuyện 2 đoạn ngắn:** Dùng đúng ngữ cảnh *“Trong đề xuất ban đầu…”* và *“nhóm Lăng Kính dự kiến…”*, không viết như sự kiện đã diễn ra; nêu rõ việc lắng nghe người chăm sóc để tạo ra nhiều lựa chọn vui chơi.
- **Section Buổi chơi có lựa chọn:** Tái sử dụng `ActivityCard.astro` cho 4 góc hoạt động (Chuồn chuồn tre, Tô tượng sắc màu, Hát cùng nhau, Trò chơi tương tác nhẹ). Nhấn mạnh quyền chọn làm, quan sát hoặc nghỉ; ghi rõ tô tượng là hoạt động vui chơi tại chỗ, không bán gây quỹ.
- **Section Hành trình dự kiến:** Tái sử dụng `StageCard.astro` cho 4 giai đoạn. Bổ sung ghi chú nổi bật: *“Đề xuất dự kiến 4 tuần, với 2 buổi tại Mái ấm; lịch cụ thể chờ xác nhận.”* Không tự ý gán mốc ngày tháng hay tick hoàn thành giả.
- **Section Nguồn lực & Minh bạch:** Mô tả trách nhiệm chuẩn bị, hoàn thiện sản phẩm và liên kết điều hướng sang `/minh-bach`.
- **Section Cập nhật & Kết quả:** Empty state chuẩn mực: *“Chưa có cập nhật thực tế được xác nhận. Kết quả và báo cáo sẽ được công bố sau khi đối soát và được phép.”* Không bịa nhật ký hay tin tức giả.

### 2.2. Trang Nhóm Lăng Kính (`/ve-nhom`)
- **Cấu trúc & Bố cục:**
  - Breadcrumb: `Trang chủ / Về nhóm`.
  - Duy nhất 1 thẻ H1: `Về nhóm Lăng Kính`.
  - Bố cục canh giữa trang nhã, thông tin lớp AI2015, học phần SSG105, 7 sinh viên Đại học FPT Hà Nội.
  - Sứ mệnh: Kết nối buổi chơi có nhiều lựa chọn với hỗ trợ hiện vật đúng nhu cầu thực tế.
- **5 Nguyên tắc cốt lõi của nhóm (Grid 3/2):**
  1. Tôn trọng quyền lựa chọn của người tham gia.
  2. Chuẩn bị an toàn và chu đáo (kiểm tra họa cụ, phôi tre, tượng).
  3. Sản phẩm do nhóm hoàn thiện (tuyệt đối không giao chỉ tiêu cho trẻ).
  4. Đối soát rõ ràng và độc lập (cơ chế 2 người đối soát theo đề xuất).
  5. Bảo vệ quyền riêng tư (không công bố thông tin/hình ảnh khi chưa được phép).
- **Cách nhóm phối hợp (5 nhóm việc dự kiến):** Điều phối/đối ngoại, Chuẩn bị góc chơi, Chuẩn bị/hoàn thiện sản phẩm, Hậu cần/vật tư, Tài chính/đối soát. Nêu rõ đây là mô tả phân công theo kế hoạch đề xuất, không phải chức danh nhân sự công khai.
- **Bảo vệ thông tin thành viên:** Hộp thông báo rõ ràng việc danh sách họ tên chi tiết và hình ảnh cá nhân sẽ được cập nhật sau khi được chủ dự án và nhà trường phê duyệt công bố. **Tuyệt đối không render tên cá nhân chưa duyệt, không tạo 7 avatar giả hay số liệu thành tích ảo.**
- **Điều hướng:** Hai nút CTA dẫn tới `/du-an/mang-theo-mot-net-ve` và `/san-pham`. Không tạo form hay nút liên hệ rỗng khi chưa có kênh liên hệ thật.

### 2.3. Trang Sản phẩm Gây quỹ Dự kiến (`/san-pham`)
- **Cấu trúc & Cảnh báo:**
  - Breadcrumb: `Trang chủ / Sản phẩm`.
  - Duy nhất 1 thẻ H1: `Sản phẩm gây quỹ dự kiến`.
  - Hộp thông báo quan trọng: **“Trạng thái mở bán chưa được xác nhận. Bản xem trước chưa nhận đơn/tiền.”**
- **Danh mục 3 sản phẩm thủ công:** Tái sử dụng `ProductCard.astro`:
  1. *Chuồn chuồn tre 12 cm kèm đế:* Giá tham khảo trong đề xuất `40.000đ/bộ`, dự kiến bán 30 bộ (trong 40 phôi chuẩn bị, 10 chiếc để lại Mái ấm). Phôi tre mộc; nguồn gốc trang trí chưa xác nhận.
  2. *Túi bút:* Giá tham khảo trong đề xuất `55.000đ/chiếc`, dự kiến 20 chiếc. Nhóm sinh viên tự tay chuẩn bị và hoàn thiện.
  3. *Túi vải:* Giá tham khảo trong đề xuất `75.000đ/chiếc`, số lượng theo kế hoạch tối đa 8 chiếc (sản xuất số lượng nhỏ theo đơn trong kế hoạch, mẫu và giá cuối chưa chốt).
  - Tồn kho thực tế giữ giá trị `null` (không hiển thị “còn hàng / đã bán / 0”).
- **Bảng tổng hợp kế hoạch số lượng:** Bảng responsive hiển thị đầy đủ tên, giá tham khảo, số lượng kế hoạch, nguồn gốc & ghi chú, trạng thái bán (Chờ xác nhận).
- **Hỏi đáp về sản phẩm (FAQ):** 4 mục FAQ semantic (H3 + Paragraph) giải thích minh bạch:
  - Giá là giá tham khảo trong đề xuất ban đầu.
  - Túi bút do nhóm hoàn thiện; chuồn chuồn tre có nguồn gốc rõ ràng; tô tượng là trò chơi tại chỗ, không bán.
  - Thời điểm và kênh mở bán chính thức sẽ được công bố khi được phê duyệt.
  - Doanh thu dự toán bù đắp chi phí vật tư/vận hành; số dư sau đối soát sẽ dùng để trao tặng hiện vật theo nhu cầu.
- **Không có form mua hàng, giỏ hàng hay mã QR thanh toán giả.**

---

## 3. Bằng chứng Kỹ thuật & Đo đạc Trình duyệt

### 3.1. Bằng chứng Cài đặt Sạch (`clean npm ci`)
- Do `package.json` và `package-lock.json` không thay đổi trong Task T02, toàn bộ mã băm SHA256 hoàn toàn trùng khớp với bằng chứng cài đặt sạch từ Task T01:
  - `package.json`: `D973D845F877C0F515CB8CCC33CB971F0EB003BA17DC2157D7FF189D91F742C9`
  - `package-lock.json`: `FF3AA78D6644EC76E50748E34A2F502B578BE8B80ED52391A7D7B9F03D487058`
- File bằng chứng đã xuất tại: [`clean-ci-evidence.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/clean-ci-evidence.json).

### 3.2. Kiểm tra Template & Kiểu (`npm.cmd run check`)
- Lệnh: `npm.cmd run check`
- Kết quả: `Result (25 files): 0 errors, 0 warnings, 1 hint` (hint thuộc file test của Brain trong `docs/`, 0 lỗi/cảnh báo trong app `src/`). Exit code: **`0`**.

### 3.3. Đóng gói Bản dựng Tĩnh (`npm.cmd run build`)
- Lệnh: `npm.cmd run build`
- Kết quả: Đóng gói 7 routes tĩnh trong **`529ms`**. Exit code: **`0`**.

### 3.4. Chứng minh Máy chủ Preview Lắng nghe trên `127.0.0.1:4321`
- **Tiến trình:** `task-855` (Astro preview daemon).
- **Socket binding thực tế:**
  ```text
  LocalAddress LocalPort  State OwningProcess
  ------------ ---------  ----- -------------
  127.0.0.1         4321 Listen         17984
  ```
- **Phản hồi HTTP:** Cả 6 route chính đều trả về `HTTP/1.1 200 OK` (Cache-Control: no-cache).

---

## 4. Đo đạc Layout & Kiểm thử Trình duyệt (Chrome/154.0.8037.93)

### 4.1. Tổng hợp Kích thước & Tràn ngang trên 3 Viewport

| Trang | Viewport | `scrollHeight` (px) | Tràn ngang (`overflow`) | Số lượng H1 | Lỗi Font < 14px | Lỗi Tương phản (WCAG AA) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dự án** (`/du-an/mang-theo-mot-net-ve`) | Mobile `375 x 812` | **6.426** | Không (`false`) | 1 | 0 | 0 |
| **Dự án** (`/du-an/mang-theo-mot-net-ve`) | Tablet `768 x 1024` | **5.246** | Không (`false`) | 1 | 0 | 0 |
| **Dự án** (`/du-an/mang-theo-mot-net-ve`) | Desktop `1440 x 900` | **4.261** | Không (`false`) | 1 | 0 | 0 |
| **Về nhóm** (`/ve-nhom`) | Mobile `375 x 812` | **4.794** | Không (`false`) | 1 | 0 | 0 |
| **Về nhóm** (`/ve-nhom`) | Tablet `768 x 1024` | **3.775** | Không (`false`) | 1 | 0 | 0 |
| **Về nhóm** (`/ve-nhom`) | Desktop `1440 x 900` | **3.323** | Không (`false`) | 1 | 0 | 0 |
| **Sản phẩm** (`/san-pham`) | Mobile `375 x 812` | **5.285** | Không (`false`) | 1 | 0 | 0 |
| **Sản phẩm** (`/san-pham`) | Tablet `768 x 1024` | **4.357** | Không (`false`) | 1 | 0 | 0 |
| **Sản phẩm** (`/san-pham`) | Desktop `1440 x 900` | **3.684** | Không (`false`) | 1 | 0 | 0 |

### 4.2. Kiểm tra Menu Mobile từ Trang Dự án
- Mở menu qua nút `#mobile-nav-toggle`: `aria-expanded="true"`, hamburger xoay thành "X", panel chuyển sang hiển thị.
- Nhấn phím `Escape`: Menu tự động ẩn (`aria-expanded="false"`, `panelHidden: true`), focus bàn phím duy trì chính xác tại nút `#mobile-nav-toggle`.

---

## 5. Danh mục Ảnh chụp Bàn giao (Thư mục TEMP ngoài repo)

Toàn bộ ảnh chụp màn hình và dữ liệu kiểm thử được lưu trữ tại thư mục TEMP độc lập:
`C:\Users\tuana\.gemini\antigravity-cli\brain\86498389-9ca4-486e-9ba8-82247107fb96\handoff-t02\`

| Tên File | Độ phân giải (px) | Kích thước File | Nội dung mô tả |
| :--- | :---: | :---: | :--- |
| [`project-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/project-mobile-375-full.png) | `375 × 6426` | 313.9 KB | Full-page Trang Dự án trên Mobile 375 |
| [`project-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/project-tablet-768-full.png) | `768 × 5246` | 367.6 KB | Full-page Trang Dự án trên Tablet 768 |
| [`project-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/project-desktop-1440-full.png) | `1440 × 4261` | 386.1 KB | Full-page Trang Dự án trên Desktop 1440 |
| [`project-mobile-375-menu-open.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/project-mobile-375-menu-open.png) | `375 × 812` | 33.9 KB | Trạng thái mở menu mobile từ Trang Dự án |
| [`team-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/team-mobile-375-full.png) | `375 × 4794` | 249.0 KB | Full-page Trang Về nhóm trên Mobile 375 |
| [`team-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/team-tablet-768-full.png) | `768 × 3775` | 269.0 KB | Full-page Trang Về nhóm trên Tablet 768 |
| [`team-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/team-desktop-1440-full.png) | `1440 × 3323` | 279.6 KB | Full-page Trang Về nhóm trên Desktop 1440 |
| [`products-mobile-375-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/products-mobile-375-full.png) | `375 × 5285` | 243.3 KB | Full-page Trang Sản phẩm trên Mobile 375 |
| [`products-tablet-768-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/products-tablet-768-full.png) | `768 × 4357` | 281.8 KB | Full-page Trang Sản phẩm trên Tablet 768 |
| [`products-desktop-1440-full.png`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/products-desktop-1440-full.png) | `1440 × 3684` | 302.3 KB | Full-page Trang Sản phẩm trên Desktop 1440 |
| [`browser-audit-results.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/browser-audit-results.json) | — | 9.8 KB | Chi tiết dữ liệu đo đạc tự động từ Chrome |
| [`clean-ci-evidence.json`](file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/handoff-t02/clean-ci-evidence.json) | — | 0.8 KB | Bằng chứng tái sử dụng clean CI khớp mã băm |

---

## 6. Trạng thái Sẵn sàng Bàn giao

- **Mã nguồn:** Đã đóng băng tại commit [`311dc33f472b8969de99872927822b0f7f566679`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve).
- **Máy chủ preview:** Đang tiếp tục chạy ngầm và phục vụ ổn định trên `http://127.0.0.1:4321/`.
- **Tuân thủ quy tắc:** Không push remote, không mở Task T03, sẵn sàng chờ kết quả review nghiệm thu R02 từ Codex Brain.
