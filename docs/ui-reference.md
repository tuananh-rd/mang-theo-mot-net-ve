# Đặc tả tham khảo UI

## Bổ sung tại phiên tiếp nhận Orca — 02/10/2026

Browser Orca đã quan sát được nguồn sau redirect `/fr` → `/en-us`, chụp và xem viewport desktop 1440×1000, mobile 375×812; H1 computed Open Sans 48/54 px desktop và 32/40 px mobile. [Khảo sát và giới hạn mới](evidence/T00/source-orca-survey.md). Ảnh ghép toàn trang có lỗi lặp, không dùng làm bằng chứng toàn trang. Chưa xác minh bản tiếng Pháp hoặc mọi phần nguồn. Giữ nguyên **đặc tả đề xuất T01** phía dưới trong khi worker đang triển khai; không chuyển các tokens đề xuất thành số đo nguồn. Các ghi nhận chưa truy cập được trong mục T00 phía dưới là lịch sử phiên trước.

Nguồn: https://sharethemeal.org/fr. Người dùng yêu cầu UI giống trang này.

## Bằng chứng T00 — 02/10/2026

Nguồn yêu cầu: [ShareTheMeal /fr](https://sharethemeal.org/fr). Lần kiểm tra này công cụ web trả 403. Chrome headless đã thử kích thước desktop 1440×1000 và chiều rộng mobile 375×812 nhưng gặp lỗi GPU/shared context, không tạo được DOM hoặc screenshot. Kích thước là tham số yêu cầu, chưa xác nhận viewport render; chưa có mobile touch emulation. Xem [bằng chứng và lỗi cụ thể](evidence/T00/survey.md).

Chưa quan sát/đo được header, hero, tỷ lệ ảnh/chữ, card, font, palette, spacing, hiệu ứng hoặc menu mobile của nguồn. Nội dung lập chỉ mục được mô tả trong bản tài liệu trước không đủ làm bằng chứng thị giác và không được dùng để claim UI giống nguồn. Các thông số T01 phía dưới là **đề xuất của Codex cho preview**, không phải thông số ShareTheMeal.

## T00: khảo sát bắt buộc trước triển khai UI

Codex xem trang bằng trình duyệt nếu truy cập được, ghi screenshot desktop/mobile, header, hero, tỷ lệ ảnh/chữ, grid, card, button, màu, typography và spacing. Ghi nguồn, kích thước viewport và phần chưa xác minh. Nếu vẫn không truy cập được, đề nghị người dùng cung cấp ảnh tham khảo khi cần và tiếp tục brief/dữ liệu độc lập; không claim đã tái tạo chính xác.

## Áp dụng cho dự án

1. Header: nhận diện Lăng Kính, Dự án, Sản phẩm, Minh bạch, Về nhóm; CTA Đồng hành.
2. Hero: Mang Theo Một Nét Vẽ; slogan; hình hoạt động hoặc sản phẩm được phép dùng; CTA Khám phá dự án / Xem sản phẩm gây quỹ.
3. Câu chuyện: từ góp ý của người chăm sóc đến một buổi chơi có nhiều lựa chọn.
4. Hoạt động: card chuồn chuồn, tô tượng, hát và trò chơi nhẹ.
5. Sản phẩm: 3 loại sản phẩm, ảnh thật khi có, nguồn gốc, giá tham khảo và trạng thái.
6. Hành trình: 4 giai đoạn của kế hoạch, không gán ngày hay trạng thái đã hoàn thành nếu chưa có dữ liệu.
7. Minh bạch: đường dẫn tới dự toán và báo cáo; khi chưa có kết quả, hiển thị “Chưa có số liệu thực tế được xác nhận”.
8. Nhóm và CTA cuối: hỗ trợ vật tư, quan tâm sản phẩm, liên hệ.

## Định hướng đề xuất, chờ đối chiếu tham khảo

Nền sáng, chữ dễ đọc, ảnh nổi bật, khoảng thở rộng, điểm nhấn màu ấm và CTA rõ. Motif chuồn chuồn/nét màu nhẹ gắn với dự án. Dùng logo, nội dung và ảnh riêng; không sử dụng nhận diện WFP hoặc tạo liên kết tổ chức không có thật.

Không dựng số tiền chạy tăng, thanh tiến độ giả hoặc gallery stock khiến người xem tưởng là ảnh Mái ấm. Khi chưa có ảnh, preview dùng placeholder minh họa được ghi rõ.

## Nghiệm thu UI

Kiểm ở 375, 768 và 1440 px. So sánh screenshot với đặc tả đã duyệt: bố cục, tỷ lệ ảnh/chữ, spacing, typography, CTA, card, responsive. Build pass không thay thế visual review. Giữ chữ tiếng Việt đầy đủ dấu và không tràn ngang.

## Đặc tả đề xuất T01 — dựng mẫu để review hướng

Mục tiêu: một trang chủ có nhận diện riêng, dễ đọc, bốn trục nội dung buổi chơi/sản phẩm/minh bạch/đồng hành. Không có campaign carousel, bộ đếm, tiến độ quỹ hoặc chứng thực/tài trợ giả. Trạng thái preview phải nhìn thấy, không chỉ nằm trong metadata.

### Tokens và tỷ lệ

| Thuộc tính | Đề xuất T01, chưa đo từ nguồn |
| --- | --- |
| Canvas | trắng #FFFFFF; section nền dịu #FFF8E8 |
| Chữ chính/phụ | #1F2933 / #52606D; không dùng chữ vàng trên nền trắng |
| Accent | #F7C948, chữ trên CTA #1F2933; viền #D8DEE5; focus #174EA6 |
| Font | system sans-serif: system-ui, -apple-system, Segoe UI, sans-serif; chưa chọn font thương hiệu |
| Container | max-width 1200 px, canh giữa; gutter 24 px desktop/tablet và 20 px mobile |
| Spacing | nhịp 8 px; section 80 px trên/dưới desktop, 56 tablet, 40 mobile; gap nội dung 24–32 px |
| H1 | 56 px/1.08 desktop; 44 tablet; 36 mobile; weight 700, không uppercase toàn bộ |
| H2 / H3 | 36/24 px desktop; 28/22 px mobile; line-height 1.2–1.3 |
| Body / caption | 18 px/1.6 / 14 px/1.5; body mobile 16 px/1.6; prose không quá khoảng 65 ký tự/dòng |
| Button/link CTA | min-height 48 px, padding ngang 24 px, radius 999 px; secondary viền chữ tối; focus rõ |
| Cards | radius 20 px, padding 24 px, border nhẹ; ảnh/minh họa 4:3, không méo, shadow rất nhẹ hoặc bỏ |

Màu và kích thước là baseline để review, không khóa thương hiệu. Kiểm tương phản chữ thường >=4.5:1, chữ lớn >=3:1; không giả định tất cả cặp màu đã pass. CTA là link khi điều hướng, button khi đóng/mở menu. Không render action vô dụng có cursor như link.

### Header, hero và navigation

- Header cao khoảng 80 px desktop, 64 px mobile, trong luồng trang (không sticky T01). Wordmark chữ “Lăng Kính”, dòng phụ “Mang Theo Một Nét Vẽ”; không coi wordmark là logo chính thức. Dự án, Sản phẩm, Minh bạch, Về nhóm và CTA Đồng hành trỏ đúng route trong architecture.
- Dưới 1024 px dùng menu disclosure: button có tên truy cập, aria-expanded/aria-controls; panel mở ngay dưới header. Escape đóng và đưa focus về button; chọn link đóng menu; tab không lọt vào menu đang ẩn. Không dùng drawer overlay cần thêm focus trap trong T01. Không JS thì vẫn có đường tới route qua footer hoặc navigation fallback.
- Trước hero: dòng gọn “Bản xem trước — nội dung theo đề xuất, chờ xác nhận.” Tình trạng dự án dùng câu “Trạng thái thực tế chưa được xác nhận”, không badge “đang triển khai”.
- Hero desktop hai cột khoảng 5:6, gap 48 px; chữ bên trái, minh họa bên phải; không đặt chiều cao full viewport. H1 “Mang Theo Một Nét Vẽ”, slogan “Một buổi chơi phù hợp, một món quà đúng nhu cầu.”, đoạn giới thiệu từ docs/content.md có chữ “dự kiến”. Hai CTA: “Khám phá dự án” và “Xem sản phẩm gây quỹ”, lần lượt tới route dự án/sản phẩm.
- Minh họa hero ratio 4:3, motif nét màu/chuồn chuồn đồ họa do Antigravity tự tạo bằng CSS/SVG, không hình trẻ, không ảnh sự kiện/stock hoặc logo WFP. Caption nhìn thấy “Minh họa cho bản xem trước — chưa phải ảnh hoạt động”. Decorative SVG aria-hidden; không lặp caption vào alt dài.
- Dưới 1024 px hero xếp chữ rồi hình; mobile CTA xếp dọc full width, khoảng 12 px. H1 xuống dòng tự nhiên với tiếng Việt; không line-break cố định gây tràn ở 375 px.

### Thứ tự phần trang chủ mẫu

1. **Buổi chơi có lựa chọn**: đoạn ngắn theo đề xuất, luôn có quyền chọn, quan sát hoặc nghỉ. Bốn card: Chuồn chuồn tre / Tô tượng / Hát cùng nhau / Trò chơi nhẹ. Grid 4 cột desktop, 2 tablet, 1 mobile; không có số người thực dự hoặc lời hứa trị liệu. Không gắn sản phẩm bán với nghĩa vụ của trẻ.
2. **Sản phẩm gây quỹ dự kiến**: ba card Chuồn chuồn tre 12 cm kèm đế / Túi bút / Túi vải. Grid 3 desktop, 2 tablet, 1 mobile, gap 24 px. Giá ghi nguyên nhãn “Giá tham khảo trong đề xuất: …”; note mẫu và giá chưa chốt. Túi bút nhóm hoàn thiện; chuồn chuồn nguồn gốc trang trí chưa xác nhận; túi vải số lượng nhỏ theo đơn trong kế hoạch. Minh họa có nhãn, không nút Mua/Đặt/Quan tâm phụ thuộc liên hệ. Một link “Xem thông tin sản phẩm” tới /san-pham là đủ. Không cần hiển thị số lượng dự kiến trong T01.
3. **Hành trình dự kiến**: bốn giai đoạn “Xác nhận và chuẩn bị nguồn lực” / “Buổi chơi tại Mái ấm” / “Hoàn thiện và gây quỹ” / “Đối soát và trao tặng”. Chỉ số thứ tự 01–04, không tick hoàn thành/ngày/thanh progress. Grid 4/2/1 theo desktop/tablet/mobile, đoạn ngắn mỗi bước.
4. **Minh bạch từ kế hoạch đến thực tế**: panel nền dịu, đoạn “Chưa có số liệu thực tế được xác nhận.” Link “Xem dự toán và nguyên tắc thu chi” tới /minh-bach. T01 không cần bảng ngân sách; không biến số tiền kế hoạch thành KPI. Nếu thêm số dự toán phải có nhãn nguồn/planned và báo Codex trong bàn giao.
5. **Về Lăng Kính**: giới thiệu nhóm 7 sinh viên AI2015, SSG105, Đại học FPT Hà Nội theo brief, một đoạn và link /ve-nhom; không tên thành viên, ảnh chân dung hoặc logo trường chưa được duyệt.
6. **Đồng hành đúng nhu cầu**: ba cách theo đề xuất: vật tư đã xác nhận, quan tâm sản phẩm khi mở bán, kết nối/truyền thông trong phạm vi được phép. Link “Tìm hiểu cách đồng hành” tới /dong-hanh; note “Kênh liên hệ đang được cập nhật”. Không tuyển người tới Mái ấm mặc định.
7. **Footer**: nhận diện nhóm/học phần, sáu route, trạng thái preview. Không email/số điện thoại/social handle giả; không logo nhà tài trợ. Không tự chèn năm hoạt động hoặc copyright như chứng cứ kết quả.

Breakpoint mẫu: mobile <768 px; tablet 768–1023 px; desktop >=1024 px. Kiểm đúng 375/768/1440 và thêm vùng đổi breakpoint nếu thấy lỗi. Shell các route phụ dùng cùng layout, tiêu đề đúng và câu “Trang đang được hoàn thiện trong bản xem trước”; không tạo nội dung đầy đủ trước R01.

### Accessibility, hình ảnh và bằng chứng

Một H1 mỗi trang, heading tuần tự, landmarks, skip link tới main, trạng thái focus nhìn thấy. Card không phải link toàn bộ khi không có đích; không lồng anchor/button. Không animation liên tục; nếu có transition nhẹ, hỗ trợ prefers-reduced-motion. Hình có kích thước/tỷ lệ dự trữ tránh layout shift.

Antigravity bàn giao screenshot full-page 1440×1000, 768×1024, 375×812 và menu mobile mở; ghi viewport render, zoom, browser, SHA, URL và thời điểm. Codex xem preview thực tế và đối chiếu các phần trên. Chưa có bằng chứng nguồn ShareTheMeal thì chỉ kết luận mức đáp ứng đặc tả đề xuất, không kết luận giống trang gốc. R01 xong vẫn cần chủ dự án duyệt hướng UI trước T02.
