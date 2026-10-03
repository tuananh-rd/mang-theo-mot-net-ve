# RV-C02-CLAUDE — Review bố trí UI và nội dung sáu trang

- Người review: Claude Opus 5.5 (`claude-opus-5-5`). Review chỉ đọc: không sửa app, không build/test/install, không commit; Antigravity giữ HOLD.
- Ngày 03/10/2026. HEAD `3cce1b1a50c09275aa78c94eedd63589ef2c3a00`, app `221eafa73661cb822b3f8017b7fe1bf367106349`, nhánh `task/c02-images-content`. `git diff 221eafa..HEAD` trên `src/ public/ astro.config package*.json` rỗng.
- Preview `http://127.0.0.1:4322/` (PID 25960, Antigravity giữ). Tôi không khởi động/dừng server. Cả 24 tệp: hash dist hiện tại = hash HTTP body = hash RC02 ([claude-hash.json](../docs/evidence/Claude-C02/claude-hash.json)).
- Công cụ: một Chrome 154 headless (puppeteer-core), đã đóng sau khi chụp. 375/768 bật mobile+touch, 1440 desktop, Sản phẩm thêm 900/1024. Trước khi chụp full-page, trang được cuộn hết và chờ `img.decode()` ([claude-capture.json](../docs/evidence/Claude-C02/claude-capture.json)). Kết quả: 0 lỗi JS, 0 request lỗi, 0 request ra ngoài, không tràn ngang, không chữ < 14 px, mọi ảnh đã tải. Menu mở/đóng bằng Escape và trả focus về nút; FAQ Minh bạch/Đồng hành mở được (4 `details` mỗi trang); thứ tự focus desktop đúng, vòng focus 2–3 px.
- Nguồn đối chiếu: text PDF đã trích sẵn ngoài repo, `proposal-pages.json` (SHA nguồn `0007f0c7…42ea`, 29 trang). Không sao chép nguồn thô vào repo.

## Kết luận

**Nội dung đúng, an toàn và nhất quán số liệu. Bố trí còn nặng chữ và lặp, chưa giúp người xem nắm thông tin trong vài giây.** Không có lỗi chặn kỹ thuật; không cần thiết kế lại hướng UI đã duyệt. Các đề xuất dưới đây là sắp xếp lại, rút gọn và gom nhóm.

Trả lời 6 câu hỏi của spec:

1. **Vài giây đầu:** người xem hiểu *tên dự án* và *sẽ làm gì*. Tuy vậy **"ai, ở giai đoạn nào, có thể làm gì ngay"** chưa rõ: trạng thái chỉ nằm trong banner chữ nhỏ, và CTA chính "Đồng hành" dẫn tới trang chưa có hành động thực hiện được. Vai trò sáu trang rõ trong menu, nhưng **Trang chủ và Dự án dùng cùng hero** (cùng H1, tagline, đoạn giới thiệu, ảnh A01). Bấm "Khám phá dự án" vì thế giống như chưa sang trang mới.
2. **Thứ tự section:** hợp lý ở mức khung, nhưng mỗi trang thiếu một khối tóm tắt nhanh. Section quan trọng bị đẩy xuống (số dư ở Minh bạch, trạng thái thực tế ở Dự án). Xem bảng thứ tự đề xuất bên dưới.
3. **Hình thức:** logo, header, focus, màu và nhịp section đã ổn. Còn thiếu nhất quán ở ba điểm: (a) ảnh chụp stock (hoạt động, bánh su) lẫn với SVG phẳng (sản phẩm); (b) ba kiểu căn lề cùng tồn tại (trái / giữa / đoạn dài căn giữa trên mobile); (c) hai kiểu thẻ sản phẩm trên cùng một trang.
4. **Mobile:** Minh bạch 10.193 px, Sản phẩm 9.612 px, Trang chủ 9.082 px. Sản phẩm lặp toàn bộ 7 món hai lần (thẻ + "bảng" dạng thẻ). FAQ Sản phẩm luôn mở (1.803 px). Năm thẻ "Chưa xác nhận" cỡ chữ heading chiếm khoảng 1.300 px ở Minh bạch.
5. **Nhất quán dữ liệu:** đạt. Trang Minh bạch xác nhận 50 × 79.000 = 3.950.000đ, mục tiêu 4.500.000đ, chênh 550.000đ; không chọn số thay thế. Dự toán 4.935.000đ, doanh thu kịch bản 6.700.000đ, số dư +1.765.000đ thống nhất trên Trang chủ, Sản phẩm, Minh bạch và FAQ. Có hai lệch nhỏ về cách ghi (P8, P10).
6. **Nội dung thiếu:** xem mục "Nội dung thiếu" chia ba nhóm. Nguồn có sẵn đủ cho "Mục tiêu", "An toàn và quyền của người tham gia", "Mái ấm có quyền quyết định" và tổng phụ dự toán. Nhóm cần cung cấp lịch, nhân sự, mẫu sản phẩm, liên hệ và bảng phân bổ đồ ăn.

## Phát hiện ưu tiên

Mức: **Cao** = ảnh hưởng trực tiếp việc người xem hiểu/tìm thông tin, nên sửa trước khi chủ dự án duyệt nội dung. **TB** = nên sửa cùng đợt. **Thấp** = tinh chỉnh.

| # | Mức | Route / viewport | Bằng chứng (ảnh/vị trí) | Ảnh hưởng | Hướng sửa cụ thể | Tiêu chí nghiệm thu |
|---|---|---|---|---|---|---|
| P1 | **Cao** | `/` và `/du-an/…`, mọi viewport | `claude-home-1440-full.png` y 118–700 so với `claude-project-1440-full.png` y 179–790: cùng H1 "Mang Theo Một Nét Vẽ", tagline, đoạn giới thiệu, ảnh A01 + caption | Người xem bấm "Khám phá dự án" và gặp lại đúng nội dung vừa đọc nên tưởng trang không đổi. Trang Dự án mất chỗ để nói "dự án giải quyết gì, cho ai, thế nào" | Trang Dự án dùng hero riêng: H1 dạng "Dự án: một buổi chơi có lựa chọn + gây quỹ quà đúng nhu cầu", kèm khối 4 ô "Ở đâu / Cho ai (Mái ấm quyết định) / Gồm gì (2 buổi, 4 góc) / Trạng thái". Dùng ảnh khác A01 (ví dụ A04) hoặc không dùng ảnh. Giữ hero Trang chủ như hiện tại | Hero hai trang khác H1, đoạn mở và ảnh; trang Dự án ở 375 có đủ 4 thông tin trong màn hình đầu |
| P2 | **Cao** | `/` 375/768/1440 | `claude-home-1440-full.png` 0–700; `claude-home-375-fold.png` | Không có chỗ nào nói ngắn gọn "dự án đang ở bước nào" và "bạn có thể làm gì bây giờ". Trạng thái chỉ có trong banner 13–14 px | Thêm một dải tóm tắt ngay dưới hero (ẩn bớt trên mobile): **Nhóm** Lăng Kính, 7 SV FPT · **Địa điểm dự kiến** Mái ấm Thánh Tâm Xuy Xá · **Trạng thái** Đề xuất, chờ Mái ấm xác nhận · **Bạn có thể** xem sản phẩm/dự toán; kênh liên hệ sẽ công bố sau. Chỉ dùng dữ liệu đã có | Ở 1440 thấy dải này mà không cần cuộn; ở 375 thấy trong 1,5 màn hình; không thêm số liệu mới |
| P3 | **Cao** | `/san-pham` 375/768 | `claude-products-375-full.png` lát 0–5; `claude-products-768-full.png` lát 3–5 | 7 món hiện **hai lần** liền nhau (thẻ có ảnh rồi "Bảng tổng hợp" dạng thẻ), tổng khoảng 6.400 px ở 375. Người xem phải cuộn qua cùng giá/ghi chú hai lần | Dưới 1024 px chỉ giữ **một** cách trình bày. Đề xuất: giữ thẻ ảnh (thêm dòng trạng thái + số lượng vào thẻ). Bảng tổng hợp chuyển thành danh sách gọn (tên · giá · số lượng, một dòng) hoặc `<details>` "Xem bảng tổng hợp" | Mỗi món chỉ hiện chi tiết một lần ở 375/768; chiều cao trang 375 ≤ 6.500 px |
| P4 | **Cao** | `/minh-bach` mọi viewport | `claude-finance-1440-full.png` y 167–800 (2 ô KPI); số dư +1.765.000đ chỉ xuất hiện ở y ≈ 4.200 | Câu hỏi đầu tiên của người xem tài chính là "còn dư/thiếu bao nhiêu và có gì chưa chắc", nhưng phần đầu chỉ có chi và thu | Hero 3 ô: Chi dự kiến 4.935.000đ · Doanh thu kịch bản 6.700.000đ · **Số dư giả định +1.765.000đ**. Thêm một dòng cảnh báo có link `#doi-chieu-do-an`: "Mục tiêu đồ ăn còn 550.000đ chưa phân bổ" | Ba số và cảnh báo 550.000đ thấy trong màn hình đầu ở 1440; ở 375 thấy trong 2 màn hình |
| P5 | TB | `/minh-bach` 375 (10.193 px), 1440 | `claude-finance-375-full.png` lát 4–5; `claude-finance-1440-full.png` lát 4 | 5 thẻ "Chưa xác nhận" (chữ ~22–28 px) cộng banner trạng thái cộng 4 thẻ nguyên tắc chiếm khoảng 1.900 px ở 375, chủ yếu là trạng thái rỗng | Gộp 5 thẻ thực tế thành **một bảng "Sổ thực tế"** 5 dòng (Khoản · Trạng thái "Chờ đối soát"). Bốn nguyên tắc chuyển thành danh sách đánh số hoặc `<details>` | Section "Báo cáo thực tế" ≤ 900 px ở 375; vẫn đủ 5 khoản và 4 nguyên tắc |
| P6 | TB | `/minh-bach` mọi viewport | 19 dòng dự toán không có tổng phụ; `claude-finance-1440-full.png` lát 0–2 | Người xem khó thấy chi tiền vào đâu. Nguồn đã có 3 nhóm 2.245.000 / 1.560.000 / 1.130.000đ ([materials-intake](../docs/materials-intake.md)) | Nhóm 19 dòng theo 3 phân loại, có **tổng phụ** mỗi nhóm (dẫn xuất từ data, không lưu cứng). Mobile: mỗi nhóm có thể thu gọn | Tổng 3 nhóm = 4.935.000đ, hiển thị ở mọi viewport |
| P7 | TB | `/san-pham` 375/768/1440 | `claude-products-375-full.png` lát 5–6 (FAQ 5 mục mở sẵn, 1.803 px) và FAQ Minh bạch/Đồng hành dùng `details` | Cùng loại nội dung nhưng hai kiểu tương tác khác nhau; FAQ Sản phẩm làm trang dài | Dùng cùng component FAQ dạng `details` như Minh bạch/Đồng hành (`src/pages/san-pham.astro:250-253`) | 5 câu FAQ thu gọn mặc định, bàn phím mở/đóng được |
| P8 | TB | `/san-pham` | Thẻ món ăn ghi "Số lượng kế hoạch: **Chưa xác định**" (`san-pham.astro:126`), bảng ghi "**Chưa xác nhận**" | Cùng một trường `null` nhưng hai cách nói, dễ khiến người xem hiểu là hai trạng thái khác nhau | Dùng một nhãn duy nhất "Chưa xác nhận", màu secondary (không dùng cam đậm như giá) | Không còn chuỗi "Chưa xác định" trong 6 trang |
| P9 | TB | `/`, `/du-an/…` 375/1440 | `claude-home-1440-full.png` lát 0–1: caption ảnh trong 4 thẻ hoạt động dài 3–4 dòng; thẻ "Tô tượng" caption ngắn hơn nên badge lệch hàng (y 125 so với 145) | Caption cảnh báo chiếm nhiều chỗ hơn mô tả hoạt động; hàng thẻ lệch nhau. A01 lặp ở hero và thẻ "Tô tượng" | Rút caption trong thẻ thành 1 dòng "Ảnh minh họa · Tên tác giả/Pexels", đưa câu "không phải ảnh hoạt động thực tế" thành **một** ghi chú chung dưới grid. Cố định chiều cao vùng caption. Thẻ "Tô tượng" dùng ảnh khác hero hoặc giữ SVG | Caption mỗi thẻ ≤ 2 dòng ở 1440; badge 4 thẻ thẳng hàng; ý "ảnh minh họa" vẫn hiện rõ một lần mỗi section |
| P10 | TB | `/minh-bach` 375 | `claude-finance-375-full.png` lát 4: "Hiện vật thay chi:0đ", "Chi tiền còn lại:4.935.000đ" thiếu khoảng trắng; dòng "0đ (tham số kịch bản cơ sở…)" bị tách khỏi bảng | Trông như lỗi gõ ở khu vực con số quan trọng | Thêm gap giữa label và value (`minh-bach.astro:367-374`); đặt chú thích vào trong khối | Ở 375 label và value có khoảng cách ≥ 4 px; chú thích nằm trong khối |
| P11 | TB | `/ve-nhom`, `/du-an/…`, `/` ở 375 | `claude-team-375-full.png` lát 0 và 3; `claude-project-375-full.png` "Nguồn lực…"; `claude-home-375-full.png` "Về nhóm" | Đoạn văn 5–8 dòng căn giữa trên mobile khó đọc (mép trái nhảy) | Chỉ căn giữa heading/eyebrow; đoạn > 2 dòng căn trái từ < 768 px (`ve-nhom.astro:203,260,266,379`; `index.astro:307,410`; `du-an/…:390,416`) | Không đoạn > 2 dòng nào căn giữa ở 375 |
| P12 | TB | `/san-pham` 1440 | `claude-products-1440-full.png` lát 0–2: thẻ thủ công (hộp giá lớn, 2 thẻ trong lưới 3 cột, trống 1/3 bên phải) khác thẻ đồ ăn (giá cùng dòng tên); bánh su là ảnh chụp giữa các SVG; ba combo nem dùng cùng kiểu minh họa | Trang trông như ghép từ hai thiết kế; khó so sánh giá 7 món | Một kiểu thẻ chung (tên, giá, số lượng, trạng thái); lưới thủ công 2 cột rộng hoặc 3 cột kèm ô "Đồ ăn (5 món)" dẫn xuống. Khi chưa có ảnh thật, thống nhất toàn bộ thẻ sản phẩm cùng một kiểu (đều SVG) | Hai nhóm sản phẩm dùng chung một component; không có ô trống trong lưới ở 1440 |
| P13 | TB | Header, mọi route | Nút vàng "Đồng hành" nổi bật nhất header; `/dong-hanh` chưa có kênh nào thực hiện được (`claude-support-1440-full.png`) | CTA mạnh nhất dẫn tới chỗ "chưa có liên hệ", nên kỳ vọng hành động bị hụt | Trong giai đoạn preview, đổi nhãn thành "Cách đồng hành", hoặc giữ nhãn nhưng mở đầu `/dong-hanh` bằng khối "Hiện bạn có thể: xem nhu cầu dự kiến · xem sản phẩm · theo dõi khi có kênh chính thức" | Người dùng đến `/dong-hanh` thấy ngay 1–3 việc làm được trong màn hình đầu |
| P14 | Thấp | `/dong-hanh` 1440/375 | `claude-support-1440-full.png` lát 0–1: 3 thẻ có 3 kiểu nút khác nhau (viền / vàng / viền); cuối trang lại thêm 3 nút | Quá nhiều CTA ngang hàng, không rõ hành động chính | Trong thẻ dùng link chữ "Xem dự toán →"; giữ một CTA chính cuối trang | Mỗi section có tối đa 1 nút chính |
| P15 | Thấp | `/du-an/…` 1440 | `claude-project-1440-full.png` lát 0, 3: heading "Câu chuyện" lệch trái trong cột hẹp, "Nguồn lực" căn giữa, "Cập nhật" heading trái nhưng thẻ căn giữa | Nhịp căn lề trên cùng trang không đồng đều | Chọn một quy tắc: heading section căn trái theo container 1200 trên mọi trang nội dung; chỉ CTA cuối trang căn giữa | Các H2 của trang Dự án cùng mép trái |
| P16 | Thấp | `/ve-nhom` | `claude-team-1440-full.png`: logo lặp ngay dưới header; section "Thành viên" chỉ có câu chờ xác nhận nhưng đặt trong thẻ lớn | Trang Nhóm chưa nói nhóm là **những ai**, nên khó tạo tin cậy | Khi chưa có danh sách: chuyển "Thành viên" lên trên "5 nguyên tắc", thu thành một dòng "7 thành viên — tên và vai trò sẽ công bố khi được đồng ý" kèm 7 ô placeholder trung tính (không tên). Bỏ logo lặp trong hero | Không có tên/ảnh chưa duyệt; trang ngắn hơn 1 màn hình ở 375 |

**Đã đạt, không cần làm lại:** logo header/footer dạng icon + chữ, đọc rõ; banner preview một dòng trên mobile; menu mobile (✕ Đóng, Escape, focus); active state; vòng focus; bảng Sản phẩm 768/900/1024 không còn bị cắt; Minh bạch hiển thị đủ khối đối chiếu 3.950.000 / 4.500.000 / 550.000đ; caption và credit Pexels sát ảnh; không có form/QR/tài khoản/liên hệ bịa; không có câu "100% doanh thu mua quà" như cam kết; tô tượng ghi rõ không phải hàng bán; quyền chọn/quan sát/nghỉ xuất hiện ở các trang liên quan.

## Thứ tự section đề xuất

Ký hiệu: **Giữ** · **Rút** (ngắn lại) · **Gộp** · **Chuyển** · **Mở rộng** (dùng `details`/link sang trang chi tiết) · **Thêm** (chỉ dùng dữ liệu đã có hoặc placeholder trung tính).

| Trang | Hiện tại | Đề xuất |
|---|---|---|
| **Trang chủ** `/` | Hero → Buổi chơi (4 thẻ) → Sản phẩm (3 thẻ) → Hành trình → Minh bạch → Về nhóm → Đồng hành | 1. Hero (**Giữ**) · 2. **Thêm** dải tóm tắt nhanh (P2) · 3. Buổi chơi có lựa chọn (**Rút** caption, P9) · 4. Sản phẩm gây quỹ (**Giữ** 3 thẻ, thêm dòng "7 món · 10.000–79.000đ · chưa mở bán") · 5. Minh bạch (**Chuyển** lên trước Hành trình; 3 số chính) · 6. Hành trình 4 giai đoạn (**Giữ**) · 7. **Gộp** Về nhóm + Đồng hành thành một section "Ai thực hiện và cách đồng hành" (2 cột) |
| **Dự án** | Hero (trùng Trang chủ) → Câu chuyện → Buổi chơi → Hành trình → Nguồn lực → Cập nhật | 1. Hero riêng + 4 ô thông tin (P1) · 2. **Thêm** "Mục tiêu và nguyên tắc" (nguồn sẵn, xem N1–N2) · 3. Câu chuyện từ đề xuất (**Rút** còn 1 đoạn) · 4. Buổi chơi 4 góc (**Giữ**) · 5. Hành trình (**Giữ**; ghi chú 7–10 ngày giữ) · 6. Cập nhật và kết quả (**Chuyển** lên ngay sau Hành trình, rút thành 1 dòng trạng thái) · 7. Nguồn lực (**Rút** thành 2 dòng + link Minh bạch) |
| **Sản phẩm** | Hero → Danh mục (2 thủ công + 5 đồ ăn) → Bảng tổng hợp → FAQ | 1. Hero + lưu ý (**Giữ**, thêm tóm tắt 1 dòng) · 2. Thủ công (2 thẻ, **Gộp** trạng thái/số lượng vào thẻ) · 3. Đồ ăn (5 thẻ cùng kiểu, P12) + **Chuyển** đối chiếu 550.000đ thành 1 dòng có link · 4. Bảng tổng hợp: desktop **Giữ**; < 1024 **Mở rộng** (P3) · 5. FAQ (**Mở rộng**, P7) · 6. CTA |
| **Minh bạch** | Hero (2 KPI) → Dự toán 19 dòng → Doanh thu kịch bản + Đối chiếu đồ ăn + Kịch bản cơ sở + Lưu ý → Thực tế (5 thẻ + banner + 4 nguyên tắc) → FAQ → CTA | 1. Hero 3 KPI + cảnh báo 550.000đ (P4) · 2. Doanh thu và số dư (**Chuyển** lên trước dự toán: người đọc muốn thấy kết quả trước chi tiết) · 3. Đối chiếu đồ ăn (**Giữ**) · 4. Dự toán theo 3 nhóm có tổng phụ (P6) · 5. Sổ thực tế (**Gộp**, P5) · 6. Nguyên tắc quản trị (**Gộp** "Lưu ý quan trọng" + 4 nguyên tắc thành một danh sách) · 7. FAQ (**Giữ**) · 8. CTA |
| **Về nhóm** | Hero (logo lặp) → 5 nguyên tắc → 5 nhóm việc → Thành viên (chờ) → CTA | 1. Hero (**Rút**, bỏ logo lặp) · 2. Thành viên (**Chuyển** lên, P16) · 3. Cách nhóm phối hợp (5 nhóm việc, **Giữ**) · 4. 5 nguyên tắc (**Rút** thành danh sách 2 cột) · 5. CTA |
| **Đồng hành** | Hero → 3 phương thức → Quy trình 3 bước → Kênh liên hệ (chưa có) → FAQ → CTA | 1. Hero + "Hiện bạn có thể…" (P13) · 2. 3 phương thức (**Giữ**, CTA dạng link, P14) · 3. Kênh liên hệ (**Rút** thành 1 khối trạng thái, **Chuyển** lên trước quy trình) · 4. Quy trình tiếp nhận (**Giữ**) · 5. FAQ (**Giữ**) · 6. CTA (1 nút chính) |

## Nội dung còn thiếu

### A. Có nguồn, có thể bổ sung ngay (không cần dữ liệu mới)

| # | Nội dung | Nguồn | Vị trí dùng | Tác động |
|---|---|---|---|---|
| N1 | **Mục tiêu dự án** dạng định tính: chuẩn bị đủ điều kiện và có xác nhận của Mái ấm trước khi tổ chức; mỗi trẻ có mặt có ít nhất một cách tham gia phù hợp; không đặt chỉ tiêu sản phẩm cho trẻ; sản phẩm kiểm tra trước khi bán; bảng theo dõi làm/bán/tồn/doanh thu. **Không** đưa KPI truyền thông (12 bài, 3.000 view…) hay "25 lượt/15 người" lên như cam kết | PDF tr. 6–7 | Dự án (section mới sau hero) | Người xem đánh giá được dự án định làm tới đâu, không nhầm với thành tích |
| N2 | **An toàn và quyền của người tham gia**: duyệt mẫu vật liệu trước; mài nhẵn, kiểm tra trục/cánh chuồn chuồn; bỏ trò bịt mắt; bowling lăn bóng từ ghế, chuyền bóng không loại; **người chăm sóc quyết định mức độ tham gia**; chỉ dùng hình ảnh được cơ sở duyệt; không dùng chuyện thương cảm để bán hàng | PDF tr. 4, 19–21 | Dự án (cạnh 4 góc chơi) và FAQ Đồng hành | Hiện site chỉ nói chung "an toàn"; chưa có từ "rủi ro" hay vai trò người chăm sóc (chỉ 1 lần ở Dự án). Đây là thông tin tạo tin cậy quan trọng nhất |
| N3 | **Mái ấm có quyền quyết định**: duyệt lịch, chỗ chơi, bài hát, người chăm sóc, từng trò/vật liệu, danh mục quà, quyền dùng sản phẩm và hình ảnh | PDF tr. 9, 21 | Dự án và Đồng hành (quy trình bước 1) | Giải thích vì sao nhiều mục "chờ xác nhận", giúp trạng thái chờ có lý do rõ ràng |
| N4 | **Tổng phụ 3 nhóm dự toán** 2.245.000 / 1.560.000 / 1.130.000đ | PDF tr. 24–26; materials-intake | Minh bạch | Đọc nhanh cơ cấu chi (P6) |
| N5 | **Phương án dự phòng**: nếu Mái ấm không xác nhận thì chưa mua lớn, chưa nhận đơn, chưa thông báo lịch; không ứng tiền cá nhân; công khai hàng tồn, chỉ mua quà theo số dư thật | PDF tr. 19 | Minh bạch (nguyên tắc) hoặc FAQ | Trả lời câu hỏi "nếu bán không hết thì sao" |
| N6 | **Ghi chú standee**: khoản 60.000đ là đồ tặng, vì bộ standee đã mượn được | PDF tr. 26 | Minh bạch, ghi chú dòng "Truyền thông trực tiếp" | Ghi chú hiện tại "chưa xác nhận triển khai" chưa giải thích vì sao chi phí thấp |
| N7 | **Đối tượng thụ hưởng dạng không định danh**: "Mái ấm chăm sóc trẻ em và người cao tuổi; số người và thành phần tham gia do Mái ấm chốt". **Không** dùng 17/2/11 em hay tỉ lệ khó khăn vận động khi chưa xác nhận, và không dùng để thúc đẩy mua hàng | PDF tr. 4, 28 | Dự án (ô "Cho ai") | Trả lời "cho ai" mà không công bố số liệu nhạy cảm |

### B. Cần nhóm cung cấp hoặc xác nhận

Phần này đối chiếu với [group-content-request.md](../docs/group-content-request.md). Chỉ ghi điểm **bổ sung**, hoặc điểm ảnh hưởng UI đã nêu ở trên.

| # | Thiếu | Đầu mối | Vị trí | Ghi chú bổ sung so với danh sách hiện có |
|---|---|---|---|---|
| G1 | **Vai trò thành viên mâu thuẫn trong nguồn**: tr. 21 ghi Chí Trung trưởng nhóm, Tuấn Anh đối ngoại, Ngọc Khoa hậu cần; `docs/content.md` ghi Tuấn Anh điều phối, Ngọc Khoa và Hiển Lân tài chính | Nhóm | Về nhóm | Danh sách hiện có chỉ yêu cầu "tên, vai trò". Cần nêu rõ là nguồn đang **mâu thuẫn** để nhóm chọn một bản |
| G2 | **Thời lượng buổi chơi** (90–120 / 90–110 / 180 phút trong nguồn) và số buổi | Nhóm + Mái ấm | Dự án (ô "Gồm gì"), Hành trình | Đã có trong materials-intake #6, chưa có trong group-content-request. Cần cho P1 |
| G3 | **Câu trạng thái chính thức** (một câu, có ngày) để dùng cho dải tóm tắt P2 và hero Minh bạch | Nhóm | Trang chủ, Dự án, banner | Danh sách có "trạng thái dự án" nhưng chưa nói cần **một câu ngắn có ngày** để hiển thị |
| G4 | Bảng phân bổ doanh thu đồ ăn (giải thích 550.000đ, set/combo có trùng không) | Nhóm | Sản phẩm, Minh bạch | Đã có; tôi xác nhận là mục quan trọng nhất về số liệu |
| G5 | Danh mục nhu cầu hiện vật chính thức; kênh liên hệ đã duyệt | Nhóm + Mái ấm | Đồng hành, footer | Đã có; khi chưa có thì áp dụng P13 |
| G6 | Ảnh mẫu thật chuồn chuồn/móc khóa/đồ ăn; ảnh không gian/vật tư | Nhóm | Sản phẩm, Trang chủ, Dự án | Đã có. Ghi chú UI: khi có ảnh, thay **toàn bộ** một nhóm cùng lúc để tránh lẫn ảnh thật với SVG (P12) |
| G7 | Cách ghi tên "Lăng Kính" / "Lăng kính" (chữ trong logo) | Chủ dự án | Logo | Đã nêu từ C01 (L8), vẫn mở |

### C. Chỉ hợp lý sau hoạt động, mở bán hoặc phát hành

| # | Nội dung | Vị trí | Điều kiện |
|---|---|---|---|
| L1 | Cập nhật hoạt động, ảnh buổi chơi đã được Mái ấm duyệt, phản hồi sau 7–10 ngày | Dự án "Cập nhật và kết quả" | Sau buổi 1/2 và có quyền ảnh |
| L2 | Sổ thực tế: thu, chi, số dư, tồn kho, hiện vật đã nhận/bàn giao, chứng từ đã biên tập | Minh bạch | Sau đối soát hai người |
| L3 | Kênh đăng ký/đặt hàng, lịch nhận, đổi/hủy, thanh toán; trạng thái "đang mở bán" và số lượng còn | Sản phẩm, Đồng hành | Sau khi chốt quy trình an toàn thực phẩm và được duyệt |
| L4 | Danh sách vật phẩm đã trao và biên bản bàn giao | Minh bạch, Dự án | Sau trao tặng |
| L5 | SEO/OG image, bỏ noindex, domain | Toàn site | Khi chủ dự án duyệt phát hành (T05) |

## Hạn chế

- Không build/test/check (đúng spec); dựa vào hash dist = HTTP = RC02.
- Đây là emulation Chrome headless, không phải thiết bị thật hay Safari. Tương phản/cỡ chữ đo bằng computed style, không phải audit accessibility đầy đủ.
- Ảnh đã xem thực tế được liệt kê trong [claude-viewed.json](../docs/evidence/Claude-C02/claude-viewed.json). Chưa xem từng lát của Dự án/Về nhóm/Đồng hành ở 768 và Sản phẩm 900; các ảnh này chỉ có số đo tự động (không tràn, ảnh tải đủ).
- Không đọc ảnh trang PDF (máy không có pdftoppm). Nội dung nguồn lấy từ text đã trích, nên chưa kiểm bố cục/bảng gốc từng trang.
- Thứ tự section trong `claude-capture.json` được lấy theo cấu trúc DOM; cột "Hiện tại" của bảng đề xuất được kiểm lại bằng ảnh.

## Bằng chứng

`docs/evidence/Claude-C02/`:
- `claude-hash.mjs/.json`: 24/24 tệp khớp.
- `claude-capture.mjs/.json`: metadata, cấu trúc section, CTA, ảnh, số lần lặp từ khóa, menu/FAQ/focus.
- `claude-viewed.json`: danh sách ảnh đã xem.
- 18 ảnh full-page `claude-<route>-<375|768|1440>-full.png`, kèm `claude-products-900/1024-full.png`.
- 18 ảnh màn hình đầu `claude-*-fold.png`.
- `claude-menu-375.png`, `claude-faq-open-finance-375.png`, `claude-faq-open-support-375.png`, `claude-focus-1440.png`.

Không động vào `dispatch-*` và `reviewer-before.json`.

**Bàn giao:** review hoàn tất, Claude HOLD. Server 4322 giữ nguyên. Brain/Codex đánh giá phạm vi triển khai tiếp theo.
