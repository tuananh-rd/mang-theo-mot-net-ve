# Điểm cần chủ dự án xác nhận

## Nguồn PDF mới tháng10/2026

Xem [materials-intake.md](materials-intake.md): doanh thu đồ ăn4500000 chưa phân bổ, các gói hiện vật500000/1845000/1560000 có phạm vi mâu thuẫn, câu chưa hòa vốn sai với sốdưdương, lịch/thời lượng/KPI khác giữa các phần. C01 chỉ hiển thị dự toán19dòng và kịch bản cơ sở có nhãn giả định. Xác nhận Mái ấm/contact/ảnh vẫnchưa có. Các câu hỏi nguồn DOCX trước bên dưới chưa tự được giải quyết bằng việc cập nhậtPDF.

Đây là danh sách làm rõ nội dung, không phải yêu cầu dừng mọi công việc.

## Phát hiện trong hồ sơ

1. Nhiều phần ghi 11 trẻ cần hỗ trợ/khuyết tật; phần khả thi mục 7 ghi khoảng 9. Không tự chọn một số và không công bố chẩn đoán cá nhân.
2. Thư ngỏ ghi đại diện Nguyễn Chí Trung; bảng nhân sự giao Tuấn Anh đối ngoại/điều phối. Hai vai trò có thể khác nhau; cần xác nhận người liên hệ public.
3. Hồ sơ đề tháng 09/2026 nhưng chưa có ngày thực hiện cụ thể hay bằng chứng đã hoàn thành. Bốn giai đoạn không tự chuyển thành lịch ngày tháng.
4. 17 trẻ + 2 người cao tuổi = 19 cư dân theo thông tin hồ sơ; số 21 trong một đoạn không khớp. Không dùng con số đó hoặc số cư dân làm số người thực dự workshop.
5. Ngưỡng 25 người thuộc yêu cầu học phần trong hồ sơ, không phải thành tích dự án hay mục tiêu tuyển người đến Mái ấm.
6. Bán đủ hàng vẫn âm 220.000đ nếu không tài trợ. Không công bố quỹ mua quà đã có hoặc doanh thu được dành toàn bộ cho quà.

## Cần trước public

- Dự án hiện ở giai đoạn nào? Ngày nào đã được duyệt?
- Logo, màu thương hiệu, ảnh nhóm/sản phẩm/hoạt động được phép dùng.
- Cách viết tên thành viên và người liên hệ chính; kênh liên hệ thật.
- Sản phẩm nào được mở bán, giá cuối, số lượng thật, cách nhận đơn, lịch giao.
- Danh mục vật tư và hiện vật Mái ấm đã xác nhận cần.
- Quyền đăng ảnh và dùng phần sản phẩm do trẻ tham gia; phương án che thông tin riêng.
- Thu chi, tài trợ và kết quả thật nếu đã có; chứng từ nào được công bố sau biên tập.
- Tên miền và nơi hosting khi tới mốc phát hành.

Trong preview có thể dùng minh họa rõ nhãn. Bản public phải bỏ placeholder và ẩn hành động chưa đủ thông tin.

## Cách xử lý tạm thời sau T00 — không phải xác nhận nội dung

T01 vẫn thực hiện layout khi thiếu dữ liệu. Không cần chọn một số trong các mâu thuẫn để dựng mẫu:

| Thông tin chưa xác nhận | Hành vi T01 | Mốc cần xử lý |
| --- | --- | --- |
| 9/11 trẻ cần hỗ trợ, 19/21 cư dân, 25 người học phần | Không hiển thị số này/chẩn đoán/thành tích; nói về quyền chọn hoạt động | Chủ dự án kiểm nguồn trước public nếu muốn dùng số |
| Người đại diện và điều phối | Không hiển thị tên liên hệ hoặc tự chọn người nhận | Trước bật kênh liên hệ thật |
| Ngày, trạng thái thực tế | executionStatus unknown, lịch chỉ bốn giai đoạn dự kiến | Trước cập nhật public |
| Logo, ảnh và tên thành viên | Wordmark chữ và minh họa có nhãn; chỉ giới thiệu nhóm tổng quát | Trước đưa asset/thành viên public |
| Giá cuối, mở bán, tồn kho, giao hàng | Giá tham khảo đề xuất, saleStatus unconfirmed, actualStock null, ẩn nhận đơn | Trước mở bán hoặc nhận quan tâm qua kênh thật |
| Nhu cầu vật tư, thu chi, tài trợ, bàn giao | Đề xuất tách thực tế, chưa có số liệu thực tế được xác nhận | T03 và trước public |
| Hosting, domain | Loopback preview, không chọn nhà cung cấp/URL giả | Sau preview hoàn chỉnh và trước T05 |
| UI nguồn không truy cập được | Dựng theo đặc tả đề xuất, không claim đo hoặc sao chép chính xác | R01 đối chiếu nếu có nguồn; chủ dự án duyệt hướng UI trước T02 |

Các lựa chọn layout/stack nhỏ đã được Codex chốt trong architecture/ui-reference, không cần hỏi lại cho từng bước. Các mục trên còn mở; không phải bằng chứng chủ dự án đã duyệt.
