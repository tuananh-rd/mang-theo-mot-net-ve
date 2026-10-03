# Review UI C01 — RV-C01-CLAUDE

- Người review: Claude Opus 5.5 (`claude-opus-5-5`), chỉ đọc; không sửa app/config/data/tests, không commit.
- Ngày: 03/10/2026. HEAD `a4e0aa879525d366335630eaf329633c35c6bb80`, app `ead94a482e590cf1c5ef4eb1e0829c99e30d378c`, nhánh `task/c01-materials`.
- Preview: `npx astro preview --host 127.0.0.1 --port 4321`, PID 21616, chỉ loopback. Phục vụ **dist đã lưu**, không rebuild. 17/17 SHA256 của dist khớp inventory RC01 ([claude-dist-hash.json](../docs/evidence/Claude-C01/claude-dist-hash.json)). `git diff ead94a4..HEAD` trên `src/ public/ astro.config package.json` rỗng, nên dist tương ứng với source hiện tại. 6 route trả 200, route lạ trả 404.
- Công cụ: Chrome 154 headless qua puppeteer-core, DPR 1; 375/768 bật mobile+touch, 1440 desktop. Đã chụp 21 ảnh full-page (7 route × 3 viewport), menu 375, màn hình đầu 375 và focus bàn phím 1440. Tôi đã **tự xem** ảnh của Home, Sản phẩm, Minh bạch ở cả 3 viewport, 404 và Về nhóm ở 375/1440, Dự án/Đồng hành ở 1440, Home 768 và bảng Sản phẩm 768. Các ảnh còn lại chỉ có số đo, chưa xem từng lát.
- Đo tự động trên 21 trang ([claude-capture.json](../docs/evidence/Claude-C01/claude-capture.json)): không có phần tử nào làm cả trang tràn ngang, không có chữ < 14 px, không có cặp màu chữ/nền tính được nào dưới ngưỡng AA (chỉ là kiểm computed color, không phải chứng nhận WCAG). Không có lỗi JS, request lỗi hay request ra ngoài. Lỗi console duy nhất là chính tài liệu 404 của route lạ, đúng như mong đợi.

## Kết luận: **CHANGES_REQUIRED** (nhỏ, chỉ CSS/hiển thị)

Phần nội dung và tài chính **đạt**. Dự toán 4.935.000đ (19 khoản, có trang nguồn). Doanh thu giả định gồm thủ công 2.200.000đ và đồ ăn 4.500.000đ, tổng 6.700.000đ, số dư giả định +1.765.000đ. Các số này đều gắn nhãn kế hoạch/giả định. Thực tế, liên hệ, số trẻ, ngày và số đơn đều "Chưa xác nhận". Không có form, QR, kênh nhận tiền hay cam kết 100% doanh thu. Không thấy ảnh thật hay liên hệ bịa. Không cần thiết kế lại.

Có hai lỗi hiển thị cần sửa trước khi chủ dự án duyệt preview. Cả hai đều xuất phát từ phần mới của C01:

### Cần sửa

| # | Mức | Route / viewport | Vấn đề và tác động | File:line | Gợi ý cụ thể |
|---|---|---|---|---|---|
| M1 | **Trung bình** | Mọi route, header + footer, 375/768/1440 | **Logo khó đọc và lệch.** Logo ngang chỉ cao 38 px (32 px ở mobile), nên chữ "Lăng kính" trong logo cao khoảng 6–7 px và không đọc được. Logo còn bị thụt khoảng 29 px so với dòng "Mang Theo Một Nét Vẽ" bên dưới. Nguyên nhân: `.brand-link` là flex column với `align-items: stretch` mặc định, nên hộp img bị kéo rộng 150 px và `object-fit: contain` canh logo rộng 92 px vào giữa hộp. Footer có cùng vấn đề cỡ chữ (logo 97×40). Người xem không đọc được tên nhóm ở vị trí nhận diện chính. | `src/components/Header.astro:198-212`, `:223-226`; `src/components/Footer.astro:90-97` | (1) Thêm `align-items: flex-start` cho `.brand-link`, hoặc `object-position: left center`. (2) Về độ đọc được, có hai cách: dùng biểu tượng vuông `logo_lang_kinh_2048.png` (~36 px) kèm chữ HTML "Lăng Kính", giữ nguyên tệp gốc; hoặc tăng logo ngang lên ≥ 48 px ở desktop / 40 px ở mobile. Ảnh: `claude-home-1440-full.png`, `claude-home-375-full.png` (vùng y 36–118). |
| M2 | **Trung bình** | `/san-pham`, 768–~960 px | **Bảng "Tổng hợp kế hoạch số lượng" bị cắt.** Bảng rộng 858 px nằm trong khung 670 px: 188 px bị ẩn ở 768 px và 56 px ở 900 px; từ 1024 px thì đủ chỗ. Chữ cột "Nguồn gốc & Ghi chú" bị cắt giữa từ ("số lượng b", "quy trình… q"), cột "Trạng thái bán" bị ẩn hẳn, và trên thiết bị chạm không có dấu hiệu nào cho biết có thể cuộn ngang. Người dùng tablet không thấy trạng thái bán, mà brief yêu cầu thông tin này phải rõ. | `src/pages/san-pham.astro:146-148` (container), `:516-519`, `:545-569` (`min-width` 180/240 + `nowrap`), breakpoint `:636`/`:646` | Chuyển sang dạng thẻ xếp dọc (đã có cho < 768) từ `max-width: 1023px`, giống trang Minh bạch, vốn không bị tràn ở 768. Nếu muốn giữ bảng thì bỏ `min-width` của `.col-notes`, cho `.col-status` xuống dòng, và thêm `tabindex="0"`, `role="region"`, `aria-label` cho khung cuộn. Ảnh: `claude-products-768-full.png` (lát 2–3). Số đo: [claude-table-widths.json](../docs/evidence/Claude-C01/claude-table-widths.json). |

### Nên sửa (thấp, không chặn)

| # | Route / viewport | Vấn đề | File:line | Gợi ý |
|---|---|---|---|---|
| L1 | `/minh-bach` 1440 | Nhãn phân loại "Vật tư workshop & quà tặng" và "Truyền thông & Di chuyển" xuống 2 dòng trong pill, làm pill méo thành hình bầu dục. Đây là cùng kiểu lỗi B1 cũ, nhưng ở component mới. | `src/pages/minh-bach.astro:145`, `:734-742` | `white-space: nowrap` và nới cột, hoặc hiển thị nhãn dạng chữ thường không viền. |
| L2 | `/` và `/minh-bach`, mọi viewport | Công thức ghi "100 móc khóa **lăng kính**" (viết thường) vì code gọi `name.toLowerCase()`, trong khi thẻ sản phẩm ghi "Móc khóa Lăng Kính". Tên riêng bị viết thường. | `src/pages/index.astro:33`; `src/pages/minh-bach.astro:26`, `:29` | Chỉ hạ chữ cái đầu, hoặc thêm trường tên dùng trong câu vào `campaign.ts`. |
| L3 | `/minh-bach`, mọi viewport | Ghi chú khoản "Bánh kẹo/quà": "*không public số trẻ như đã xác nhận*" đọc giống chỉ dẫn nội bộ bị lọt ra UI. Khoản "Truyền thông trực tiếp (standee, bánh kẹo tặng)" lại có ghi chú "Thiết bị mượn…", không khớp với tên khoản. | `src/data/campaign.ts:814`, `:833` | Ví dụ: "Kế hoạch tổng, chưa phân bổ theo người nhận (trang 25)". Đối chiếu lại ghi chú dòng 833 với trang 26 của PDF. |
| L4 | `/minh-bach` 375 | Trang dài 12.366 px, trong đó 19 thẻ dự toán chiếm khoảng 4.200 px (mỗi thẻ ~220 px, lặp "Thành tiền dự kiến"). Đây là cùng nhóm vấn đề L2 trước, nhưng trên trang mới. | `src/pages/minh-bach.astro:178` (khối thẻ mobile) | Dùng hàng gọn: tên và số tiền trên một dòng, phép tính/ghi chú ở dòng phụ. Có thể nhóm theo 3 phân loại kèm tổng phụ, hoặc dùng `<details>`. |
| L5 | `/san-pham` 1440/375 | Ba món nem dùng **cùng một** minh họa, nên đứng cạnh nhau trông như bị lặp. Ở 375, tên "Combo 5 / nem phô mai" bị ngắt dòng gượng vì giá chiếm chỗ. | `src/components/PlaceholderIllustration.astro`; thẻ món ăn trong `san-pham.astro` | Đổi màu/biến thể cho mỗi món, hoặc gom 4 món nem/bánh thành một thẻ "Thực đơn" có danh sách giá. Ở mobile, xếp giá xuống dưới tên. |
| L6 | `/san-pham` | Cụm "Chưa/Chờ xác nhận" xuất hiện 11 lần (Home 6, Minh bạch 8). Mỗi món ăn ghi trạng thái hai lần (thẻ + bảng), và ở mobile chữ "Chưa xác nhận" có màu cam đậm, nổi ngang giá tiền. Vấn đề U1 cũ mới được giải quyết một phần. | thẻ/bảng trong `san-pham.astro` | Ở thẻ, để "Số lượng kế hoạch" dùng màu secondary; giữ trạng thái chi tiết ở bảng và ở lưu ý đầu trang. |
| L7 | Mọi route | Favicon dùng PNG 2048×2048 (79 KB). | `src/layouts/Layout.astro:39` | Tạo bản 32/180 px khi được phép tạo tệp phái sinh. |
| L8 | Nội dung (cần chủ dự án) | Chữ trong logo là "Lăng kính" (k thường), còn website dùng "Lăng Kính". | tệp logo gốc | Chủ dự án chọn một cách viết. Coder không tự sửa tệp logo. |

## Các vấn đề review trước (`reports/ui-review-claude.md`): đã sửa hay hồi quy

| Mục cũ | Trạng thái C01 | Bằng chứng |
|---|---|---|
| B1 nhãn trạng thái vỡ khung | **Đã sửa** cho nhãn sản phẩm ("Chờ xác nhận" là pill một dòng). Cùng kiểu lỗi xuất hiện lại ở nhãn phân loại Minh bạch (L1). | products/finance 1440 |
| U1 lặp cảnh báo | **Một phần**: Home còn 6 lần (trước ~12); Sản phẩm 11 (L6). | đếm text dist |
| T1/C1 chữ và màu ghi chú | **Đã sửa**: muted `#5d6b79` nhạt hơn secondary `#52606d`; không có chữ < 14 px. | `tokens.css:12-13`, capture |
| B2/E2 active menu, 404 | **Đã sửa**: `/dong-hanh` có `aria-current` và vòng active; 404 không đánh dấu mục nào. | capture `current`, ảnh support/404 |
| B3 icon menu | **Đã sửa**: mở menu đổi sang "✕ Đóng"; Escape đóng menu và trả focus về nút. | `claude-menu-375.png`, capture `menu` |
| B4 link footer | **Đã sửa** (dãn khoảng cách khoảng 48 px). | footer 1440 |
| B5 nút dài | **Đã sửa** ("Xem dự toán chi tiết"). | home 375/1440 |
| C3 số âm màu đỏ | **Không còn áp dụng**: số dư +1.765.000đ dùng nhãn "Dư" màu xanh nhạt, trung tính. | finance 1440 |
| E1 404 một lối thoát | **Đã sửa**: có 3 nút. | `claude-404-375-full.png` |
| U3 hero mobile không có hình | **Đã sửa**: minh họa ở trên H1. | `claude-home-375-fold.png` |
| R1 banner mobile | **Đã sửa**: "Bản xem trước — chờ xác nhận" một dòng. | home 375 |
| Favicon 404 | **Đã sửa** (logo vuông); xem L7. | Layout:39 |
| figcaption ngoài figure | **Đã sửa** (0). | capture |
| L2 trang mobile dài | **Hồi quy nhẹ**: Home 8.899 px (sau T01 là 8.723); Minh bạch 12.366 px (L4). | capture `height` |
| Focus bàn phím | Giữ tốt: skip link vòng vàng 3 px, các link/nút có vòng `#174EA6` 2 px theo đúng thứ tự. | `claude-keyboard-focus-1440.png` |

## Giới hạn

- Không rebuild, không chạy `npm run check/test/build`. Phần này dựa vào RC01; dist đã được xác nhận khớp hash.
- Chưa xem từng lát ảnh của Dự án/Đồng hành ở 375/768 và Về nhóm ở 768. Các trang này chỉ có số đo tự động (không tràn, đủ cỡ chữ, không lỗi tương phản) và ảnh đầu trang 1440.
- Kiểm tương phản bỏ qua chữ trên nền gradient/ảnh. Chưa kiểm trình đọc màn hình thật, zoom 200% hay tắt JS ở vòng này.
- Preview PID 21616 chạy trong phiên shell nền của Claude và sẽ dừng khi phiên này kết thúc.

Bằng chứng (chỉ trong `docs/evidence/Claude-C01/claude-*`): `claude-capture.mjs/.json`, `claude-table-widths.mjs/.json`, `claude-dist-hash.json`, `claude-preview.json`, 21 ảnh `claude-<route>-<vw>-full.png`, `claude-menu-375.png`, `claude-home-375-fold.png`, `claude-finance-1440-fold.png`, `claude-keyboard-focus-1440.png`. Không động vào `dispatch-prompt.txt` / `dispatch-response.json` có sẵn trong thư mục này.
