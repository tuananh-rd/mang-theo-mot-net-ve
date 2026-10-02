# Brief website

## Thông tin từ hồ sơ

- Tên: Mang Theo Một Nét Vẽ.
- Nhóm: Lăng Kính, 7 sinh viên lớp AI2015, học phần SSG105, Đại học FPT Hà Nội.
- Thông điệp: “Một buổi chơi phù hợp, một món quà đúng nhu cầu”.
- Địa điểm dự kiến: Mái ấm Thánh Tâm Xuy Xá và campus FPT Hòa Lạc.
- Kế hoạch: 4 tuần, 2 buổi tại Mái ấm: giao lưu/workshop và trao tặng.
- Hoạt động: trang trí chuồn chuồn tre, tô tượng, hát, bowling nhẹ, chuyền bóng, thẻ màu/ghép hình; người tham gia có quyền chọn hoạt động, quan sát hoặc nghỉ.
- Gây quỹ: chuồn chuồn tre có đế, túi bút nhóm hoàn thiện, túi vải số lượng nhỏ theo đơn.
- Hồ sơ ghi 17 trẻ và 2 người cao tuổi; đây là thông tin nhóm có, cần xác nhận trước công bố, không phải số người đã tham dự.

## Mục tiêu website

Giúp người xem hiểu nhóm, dự án, lựa chọn đồng hành và cách nguồn lực được sử dụng. Ưu tiên xem sản phẩm gây quỹ, hỗ trợ vật tư và liên hệ nhóm. Không mặc định tuyển người đến Mái ấm vì cộng tác viên cần cơ sở đồng ý.

## Phạm vi MVP

- `/`: trang chủ chiến dịch, giới thiệu nhóm ngắn, hoạt động, sản phẩm, kế hoạch và lời mời đồng hành.
- `/ve-nhom`: sứ mệnh và thành viên.
- `/du-an/mang-theo-mot-net-ve`: câu chuyện, hoạt động, 4 giai đoạn, cập nhật và kết quả khi có.
- `/san-pham`: danh mục 3 loại hàng; giá tham khảo, nguồn gốc và trạng thái mở bán rõ ràng.
- `/minh-bach`: dự toán, nguồn tài trợ, thu chi và bàn giao; tách kế hoạch với thực tế.
- `/dong-hanh`: các cách hỗ trợ và kênh liên hệ đã xác nhận.

Không tạo danh sách chiến dịch giả để lấp UI. Hoạt động/cập nhật có thể nằm trong trang dự án. Chưa cần tài khoản, giỏ hàng, thanh toán, CMS hay dashboard quản trị.

## Giới hạn nội dung

- Không nói mọi sản phẩm do trẻ làm; túi bút do nhóm hoàn thiện, chuồn chuồn có nguồn gốc từng món.
- Trẻ không có chỉ tiêu sản xuất; tô tượng là hoạt động vui chơi, không phải hàng bán.
- Không hứa trị liệu, cải thiện sức khỏe hoặc tác động dài hạn.
- Không dùng ảnh/chuyện riêng của trẻ hoặc tình trạng khuyết tật để thúc đẩy mua hàng.
- Hỗ trợ vật tư khác với tiền nhận; doanh thu khác với số dư mua quà.
- Số liệu chưa xác nhận không xuất hiện như thành tích ở hero hoặc bộ đếm.

## Hướng kỹ thuật

Codex kiểm tra repo trước. Nếu trống, chọn giải pháp nhỏ phục vụ nội dung và routing; ưu tiên nội dung tĩnh có cấu trúc, responsive, dễ deploy. Ghi lựa chọn vào `docs/architecture.md` trước khi Antigravity cài đặt. Chưa khóa framework hoặc nhà cung cấp hosting trong bộ tài liệu này.
