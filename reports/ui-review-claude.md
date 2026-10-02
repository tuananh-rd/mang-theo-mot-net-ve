# Review UI — web demo “Mang Theo Một Nét Vẽ”

- Người review: Claude (chỉ đánh giá, không sửa code)
- Ngày: 02/10/2026
- Commit: `e6aa965` (nhánh `task/t01-home-shell`; code UI giống `c27fea2`)
- Môi trường: `astro dev` tại `http://127.0.0.1:4399`, Chrome headless qua puppeteer-core, DPR 1
- Viewport đã kiểm: 1440×900, 1024×768, 768×1024 (mobile emulation), 375×812, 320×640 (mobile + touch); menu mobile mở; điều hướng bàn phím; tắt JavaScript; 6 route + 404
- Lưu ý: thanh Astro Dev Toolbar (viên thuốc đen ở cuối màn hình) chỉ có ở chế độ dev, không tính là lỗi UI.

## Tóm tắt

Bản demo sạch, nhất quán và đúng hướng đề xuất T01: nền sáng, accent vàng ấm, card bo tròn, chữ tiếng Việt hiển thị đủ dấu, **không tràn ngang ở cả 5 viewport**, grid đổi đúng 4/2/1 và 3/2/1, CTA chính cao 48–52 px, focus ring rõ. Không có lỗi JavaScript runtime.

Các vấn đề chính nằm ở **mức hoàn thiện**, không phải ở cấu trúc:

1. Nhãn trạng thái sản phẩm bị vỡ khung khi xuống dòng (thấy rõ ở mọi viewport).
2. Câu “chưa được xác nhận / chưa nhận đơn/tiền” lặp quá nhiều, làm loãng thông điệp và khiến trang nặng phần cảnh báo.
3. Trang mobile rất dài (~10.500 px ở 375 px; ~11.100 px ở 320 px) do minh họa trong card quá lớn.
4. Một số lỗi CSS nhỏ làm hệ thống chữ không nhất quán (ghi chú section hiển thị 18 px thay vì 14 px; màu “muted” đậm hơn màu “secondary”).
5. Trạng thái active của menu sai ở `/dong-hanh` và trang 404.

Không có form, không có trạng thái loading; trạng thái lỗi duy nhất là trang 404 (xem mục 8).

Mức độ: **Cao** = nên sửa trước khi chủ dự án duyệt hướng UI; **Trung bình** = nên sửa trong T02/T04; **Thấp** = tinh chỉnh.

---

## 1. Bố cục

**Điểm tốt**
- Desktop 1440: container 1200 px canh giữa, hero 2 cột 5:6 gap 48 px, minh họa 4:3; hero cao 594 px, không full viewport — đúng đặc tả.
- Thứ tự section đúng đặc tả: Hero → Buổi chơi → Sản phẩm → Hành trình → Minh bạch → Về nhóm → Đồng hành → Footer. Nền xen kẽ trắng / `#FFF8E8` tạo nhịp đọc tốt.
- Card hoạt động, sản phẩm, giai đoạn có chiều cao bằng nhau trong cùng hàng (desktop: 475 / 690 / 234 px).
- Card không phải link toàn bộ, không có nút Mua/Đặt giả — đúng tinh thần brief.

**Vấn đề**

| # | Mức | Vấn đề | Bằng chứng / gợi ý |
|---|---|---|---|
| L1 | Trung bình | Section “Về nhóm Lăng Kính” ở desktop chỉ chiếm ~800 px bên trái, nửa phải trống, trông như thiếu nội dung. | 1440 px: section cao 451 px, chỉ có 1 đoạn + 3 pill + 1 nút. Gợi ý: căn giữa khối, hoặc bổ sung cột phụ (ví dụ minh họa/nét vẽ) khi có nội dung được duyệt. |
| L2 | Trung bình | Trang chủ mobile quá dài: 10.496 px (375) và 11.102 px (320), tương đương ~13 màn hình. Riêng section Hoạt động 2.537 px, Sản phẩm 2.468 px. | Mỗi card hoạt động ~500 px, sản phẩm ~650 px vì minh họa 4:3 full width. Gợi ý: ở mobile dùng minh họa nhỏ hơn (ví dụ 16:9 hoặc icon bên trái tiêu đề cho card hoạt động), hoặc carousel cuộn ngang có scroll-snap cho 4 hoạt động. |
| L3 | Thấp | Tablet 768: minh họa hero chiếm toàn bề rộng (720×579 px) nên hero cao 1.017 px — hình lớn hơn cần thiết so với chữ. | Gợi ý: giới hạn `max-width` minh họa (~560 px) hoặc giữ 2 cột từ 768 px. |
| L4 | Thấp | Ở mobile, thứ tự trong card sản phẩm: minh họa → nhãn trạng thái → tên → giá. Nhãn trạng thái đứng trước tên làm người đọc gặp cảnh báo trước khi biết đó là sản phẩm gì. | Gợi ý: tên → giá → mô tả → nguồn gốc/trạng thái. |

## 2. Typography

**Điểm tốt**
- Font system (Segoe UI trên Windows) hiển thị dấu tiếng Việt chuẩn, không lỗi glyph.
- Thang chữ khớp token: H1 56/44/36 px, H2 36/32/28 px, body 18 px desktop / 16 px mobile, line-height 1.6. Đoạn mô tả section giới hạn 720 px (~65–75 ký tự/dòng).
- H1 “Mang Theo Một / Nét Vẽ” xuống dòng tự nhiên ở mọi kích thước.

**Vấn đề**

| # | Mức | Vấn đề | Bằng chứng / gợi ý |
|---|---|---|---|
| T1 | Trung bình | Ghi chú `* Ghi chú bản xem trước…` (sau grid Hoạt động và Hành trình) hiển thị **18 px** màu secondary, to ngang body, trong khi ý định là chú thích 14 px màu muted. | `index.astro` đặt `font-size: 0.875rem` cho `div.section-footer-note`, nhưng rule toàn cục `p { font-size: var(--font-size-body) }` ghi đè lên thẻ `<p>` con. Kết quả: ghi chú nổi bật hơn đoạn giới thiệu. |
| T2 | Thấp | Một từ bị rơi xuống dòng riêng ở tiêu đề/slogan: slogan hero ở 1440 (“…đúng nhu / cầu.”), H2 “Sản phẩm gây quỹ dự / kiến” ở 375. | Gợi ý: `text-wrap: balance` cho heading/slogan. |
| T3 | Thấp | Dùng nhiều chữ nghiêng: caption minh họa, ghi chú card, ghi chú sản phẩm, trạng thái hỗ trợ — chữ nghiêng tiếng Việt cỡ 13–14 px khó đọc hơn, và vì dùng ở khắp nơi nên không còn tác dụng làm nổi. | Giữ nghiêng cho caption minh họa; ghi chú khác dùng chữ thường màu muted. |
| T4 | Thấp | Chữ nhỏ dưới 14 px ở vài chỗ: nhãn trạng thái sản phẩm, nhãn giá, trạng thái hỗ trợ 13 px; dòng cuối footer 13 px. | Đặc tả caption là 14 px; nên thống nhất tối thiểu 14 px. |
| T5 | Thấp | Ở `/san-pham` có tên “túi bút vải”, trong khi brief gọi là “túi bút” (nhóm hoàn thiện). | Cần chủ dự án xác nhận tên sản phẩm; đây là vấn đề nội dung, không phải lỗi hiển thị. |

## 3. Màu sắc và tương phản

**Điểm tốt**
- Palette ấm, thân thiện, hợp chủ đề vẽ/chuồn chuồn; không dùng chữ vàng trên nền trắng.
- Các cặp chính đạt AA: chữ `#1F2933` trên nút vàng `#F7C948`; accent text `#B45309` trên trắng và `#FFF8E8` (~4.8:1); banner `#92400E` trên `#FEF3C7`.
- Focus ring `#174EA6` 2 px, offset 3 px, dễ thấy (đã kiểm bằng Tab).

**Vấn đề**

| # | Mức | Vấn đề | Bằng chứng / gợi ý |
|---|---|---|---|
| C1 | Trung bình | Thứ bậc màu chữ bị đảo: `--color-text-muted` (`#48535E`) **đậm hơn** `--color-text-secondary` (`#52606D`). Ghi chú “muted” vì vậy nổi hơn mô tả chính. | `tokens.css`. Chọn muted nhạt hơn secondary nhưng vẫn ≥4.5:1 trên `#FFF8E8`, hoặc gộp chung một màu. |
| C2 | Thấp | Viền nút secondary `#D8DEE5` trên nền `#FFF8E8`/trắng có tương phản ~1.3:1 nên nút trông như text trôi nổi, nhất là trên nền kem (section Sản phẩm, Minh bạch). | WCAG 1.4.11 không bắt buộc vì nhãn chữ đã nhận diện được, nhưng về UX nên dùng viền đậm hơn (ví dụ `#9AA5B1`) hoặc nền trắng cho nút trên nền kem. |
| C3 | Thấp | `-220.000đ` màu đỏ `#B91C1C` gợi cảm giác “thâm hụt/báo động”, trong khi đây chỉ là chênh lệch giả định trong kế hoạch. | Cân nhắc màu trung tính kèm chú thích; quyết định thuộc chủ dự án/Codex. |
| C4 | Thấp | Minh họa dùng nhiều màu mạnh khác nhau (xanh dương, hồng, tím, xanh lá) cạnh accent vàng nên hơi rời rạc so với palette chính. | Chấp nhận được cho placeholder; khi có ảnh thật cần chuẩn hóa. |

## 4. Responsive

**Điểm tốt**
- `scrollWidth == viewport` ở 320, 375, 768, 1024, 1440, **không phần tử nào tràn ngang**.
- Breakpoint đúng: dưới 1024 px chuyển sang nút Menu, header cao 64 px; grid 4→2→1, 3→2→1; bảng dự toán chuyển thành dạng xếp dọc ở mobile; CTA hero full width, xếp dọc, cách nhau 12 px.
- Ở 1024 px nav desktop vẫn đủ chỗ, không chồng lên nhau.

**Vấn đề**

| # | Mức | Vấn đề | Bằng chứng / gợi ý |
|---|---|---|---|
| R1 | Trung bình | Banner preview chiếm 2 dòng (62 px) ở 375 và 3 dòng (84 px) ở 320; cộng header 65 px là ~150 px chrome trước nội dung. | Gợi ý: rút gọn câu ở mobile (“Bản xem trước — chờ xác nhận”), phần đầy đủ để ở footer. |
| R2 | Thấp | Tablet 768 dùng support grid 1 cột trong khi sản phẩm/hoạt động dùng 2 cột, nhịp layout không đồng đều. | Cân nhắc 2 cột, hoặc 3 cột gọn. |
| R3 | Thấp | Ở 320 px, nhãn trạng thái sản phẩm xuống 3 dòng (74 px). | Xem B1. |

## 5. Khoảng cách (spacing)

**Điểm tốt**: nhịp 8 px nhất quán; section padding 80/56/40 px đúng token; gap grid 24 px; card padding 20 px.

**Vấn đề**

| # | Mức | Vấn đề | Bằng chứng / gợi ý |
|---|---|---|---|
| S1 | Trung bình | Section Minh bạch: badge “Nguyên tắc minh bạch” dính sát H2 (~4 px) vì `.badge-row` ở trang chủ không có style (style `.badge-row` chỉ nằm trong component ActivityCard, bị scope). | So sánh với hero, nơi badge cách H1 ~24 px. |
| S2 | Thấp | Khoảng trắng giữa hero và section đầu ở desktop khá lớn (padding hero 56 px + section 80 px = ~136 px), trông như trang bị “đứt”. | Giảm padding-bottom của hero. |
| S3 | Thấp | Ghi chú dưới grid (`margin-top: 24px`) gần grid hơn so với nút CTA của section khác (`40px`), nên nhịp kết section không đều. | Thống nhất một khoảng. |

## 6. Nút bấm và liên kết

**Điểm tốt**
- Primary vàng / secondary viền, pill 999 px, cao ≥48 px, padding 24 px; nút hero 52 px; hover có đổi màu nền.
- Toggle menu là `<button>` có `aria-expanded`, `aria-controls`, tên truy cập đổi “Mở/Đóng menu”; Escape đóng và trả focus; bấm link đóng menu; resize lên desktop thì menu tự đóng.
- Link điều hướng thật sự là `<a>`; không có action vô dụng.

**Vấn đề**

| # | Mức | Vấn đề | Bằng chứng / gợi ý |
|---|---|---|---|
| B1 | **Cao** | **Nhãn trạng thái sản phẩm bị vỡ khung**: `.product-status-tag` là `span` inline có border + padding 2 px, khi câu dài xuống dòng thì mỗi dòng có khung riêng, cạnh hở, trông như lỗi render. Thấy ở cả 3 card, mọi viewport. | `ProductCard.astro`. Dùng `display: inline-block`/`block` (hoặc `box-decoration-break: clone`) **và** rút ngắn nhãn (ví dụ “Chưa mở bán”), chi tiết để ở ghi chú chung. |
| B2 | Trung bình | Trạng thái active sai: ở `/dong-hanh` không có mục nào active (nút “Đồng hành” không có `aria-current`/kiểu active); ở trang 404 lại đánh dấu “Trang chủ” là trang hiện tại. | Do `currentPath` mặc định `/` trong Layout và CTA không kiểm `currentPath`. |
| B3 | Thấp | Icon hamburger không đổi sang “X” khi mở; class `is-open` được gắn nhưng không có CSS nào dùng. Chữ “Đóng” đã giúp phần nào. | `Header.astro`. |
| B4 | Thấp | Link footer chỉ cao 20 px, cách nhau 8 px. Vẫn đạt WCAG 2.2 AA (24 px tính cả khoảng cách) nhưng dưới khuyến nghị 44 px cho chạm. | Tăng padding dọc của link footer. |
| B5 | Thấp | Nút secondary dài ở mobile (“Xem dự toán và nguyên tắc thu chi chi tiết”) xuống 2 dòng trong pill nên hình dáng méo; nhãn còn lặp “chi chi”. | Rút gọn: “Xem dự toán chi tiết”. |
| B6 | Thấp | Không có JavaScript thì nút Menu vẫn hiện nhưng bấm không có tác dụng (vẫn vào được route qua footer). | Ẩn nút khi không có JS, hoặc dùng `<details>` làm fallback. |

## 7. Form

Không có form nào trên toàn bộ site (đã đếm `form` = 0 trên mọi route), đúng phạm vi MVP vì chưa nhận đơn/tiền. Tuy vậy:

- **U-F1 (Trung bình)**: card “Quan tâm sản phẩm gây quỹ” dùng chữ “Đăng ký quan tâm…” nhưng không có nơi đăng ký; CTA “Tìm hiểu cách đồng hành” dẫn tới trang shell không có kênh liên hệ. Người dùng muốn hành động sẽ gặp ngõ cụt. Gợi ý: đổi chữ thành “Khi mở bán, nhóm sẽ công bố kênh đăng ký” cho tới khi có kênh thật.
- Khi T03 thêm form/kênh liên hệ, cần thiết kế đủ: label hiển thị, lỗi inline gắn `aria-describedby`, trạng thái gửi/thành công/thất bại, đồng ý xử lý dữ liệu cá nhân.

## 8. Trạng thái loading / error

- **Loading**: site tĩnh, render server-side, không fetch dữ liệu; không có skeleton/spinner và cũng **không cần**. Minh họa là SVG inline có `aspect-ratio` nên không có layout shift.
- **Error (404)**: route lạ trả **HTTP 404** đúng, có trang tùy biến với tiêu đề, mô tả và nút về trang chủ. Vấn đề:
  - E1 (Thấp): số “404” cỡ 80 px, weight 900 khá nặng nhưng chỉ có một lối thoát; nên thêm link tới các trang chính (Dự án, Sản phẩm).
  - E2 (Thấp): menu đánh dấu “Trang chủ” là trang hiện tại (xem B2).
- **Tài nguyên lỗi**: mỗi trang tải `/favicon.ico` và nhận **404** (lỗi console). Thiếu favicon nên tab trình duyệt hiển thị icon mặc định.
- **Không JS**: nội dung đọc được đầy đủ; xem B6.

## 9. Trải nghiệm người dùng và nội dung hiển thị

| # | Mức | Vấn đề | Gợi ý |
|---|---|---|---|
| U1 | **Cao** | **Cảnh báo lặp quá nhiều.** Ý “chưa xác nhận / bản xem trước / chưa nhận đơn/tiền” xuất hiện ~12 lần trên trang chủ: banner, badge hero, caption minh họa ×8, nhãn sản phẩm ×3, ghi chú dưới sản phẩm, card hỗ trợ, ghi chú đồng hành, footer ×3. Người xem dễ thấy trang thiếu tự tin, và thông tin quan trọng thật (giá là tham khảo) bị chìm. | Giữ: banner + caption hero + một dòng tổng ở mỗi section. Bỏ nhãn trên từng card và rút gọn footer. Đây vẫn tuân thủ nguyên tắc không biến dự toán thành kết quả. |
| U2 | Trung bình | Badge hero “Trạng thái thực tế chưa được xác nhận” có chấm tròn kiểu đèn “đang hoạt động/live”, nên dễ đọc thành tín hiệu trạng thái. | Bỏ chấm, hoặc dùng icon “i”. |
| U3 | Trung bình | Hero ở mobile: minh họa nằm dưới fold (y≈655 px ở 375) nên màn hình đầu chỉ có chữ + 2 nút, không có điểm nhấn thị giác nào. | Cân nhắc dải minh họa nhỏ phía trên H1 ở mobile, hoặc rút ngắn đoạn giới thiệu. |
| U4 | Thấp | Trang con đều là shell “đang hoàn thiện” với một nút “← Quay lại trang chủ”; khi người dùng bấm “Khám phá dự án” ở hero thì kỳ vọng không được đáp ứng. | Đúng phạm vi T01; ghi nhận để ưu tiên T02. |
| U5 | Thấp | Pill “Lớp: AI2015 / SSG105 — Đại học FPT Hà Nội / 7 sinh viên” trông giống nút/filter bấm được. | Dùng dạng danh sách định nghĩa hoặc chữ thường có phân cách. |

## 10. Accessibility (ghi nhận kèm)

Tốt: `lang="vi"`, mỗi trang 1 H1, heading tuần tự, có landmark `header/main/footer/nav`, skip link hoạt động, focus nhìn thấy, hỗ trợ `prefers-reduced-motion`, SVG trang trí có `aria-hidden`.

Cần chỉnh (Thấp):
- `<figcaption>` nằm trong `<div>` chứ không trong `<figure>` (8 chỗ), sai HTML.
- `StageCard`: `aria-label` đặt trên `div` không có role nên bị bỏ qua/không hợp lệ; số “01” vẫn được đọc nên không mất thông tin.
- `role="status"` trên banner và badge hero tạo live region cho nội dung tĩnh; không cần thiết.

---

## Ưu tiên đề xuất

1. **B1** sửa nhãn trạng thái sản phẩm bị vỡ khung, và **U1** giảm lặp cảnh báo (nên làm cùng nhau).
2. **T1 + C1** sửa thứ bậc chữ/màu cho ghi chú.
3. **S1, B2, favicon**: các sửa nhỏ, ít rủi ro.
4. **L2, R1, U3** tối ưu độ dài và màn hình đầu ở mobile: cần chủ dự án duyệt hướng trước.
5. Phần còn lại để T02/T04.

Ảnh chụp và số đo của lần review này nằm trong scratchpad của phiên, không commit vào repo.
