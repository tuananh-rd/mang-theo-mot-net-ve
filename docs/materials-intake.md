# Tiếp nhận nội dung chủ dự án cung cấp — 03/10/2026

**Cập nhật sau yêu cầu thêm vào website:** C01 đã hoàn thành, [RC01 PASS](reviews/RC01-ead94a4.md) tại app ead94a482e590cf1c5ef4eb1e0829c99e30d378c. Những mô tả chưa triển khai dưới đây ghi lại thời điểm tiếp nhận ban đầu.

Nguồn đọc trực tiếp: `D:\Downloads\materials`. Workspace vẫn là `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`; HEAD khi tiếp nhận `113069636c653cb7bbb255c33d681cbbbd940b19`, nhánh `task/t04-preview-polish`, working tree sạch. Tiếp nhận nguồn là công việc tài liệu của Codex; chưa phải bàn giao ứng dụng, duyệt nội dung public hoặc triển khai website.

## Tệp đã kiểm tra

| Tệp | Kiểm tra | SHA256 |
| --- | --- | --- |
| MANG THEO MỘT NÉT VẼ.pdf | 29 trang; đọc nội dung trích xuất theo trang; đề xuất tháng 10/2026 | `0007f0c7c8ac4858c2cc2cfddd7079fb473663989d47643995f43afd5f2542ea` |
| logo_lang_kinh_2048.png | Đã xem; PNG RGBA 2048×2048, biểu tượng LK không chữ | `06f63ac9d41c079827d794b13ffec468ea30be7b818755b4ba96bc819f7facbc` |
| logo_option4_prism_facet.png | Đã xem; PNG RGBA 788×987, biểu tượng và tên xếp dọc | `4873005d7460d7efd8b3de279bff95be77145134d4a120bec873ec663f2f46eb` |
| logo_option5_horizontal.png | Đã xem; PNG RGBA 1419×587, biểu tượng và tên xếp ngang | `e078e7ea7bd8debae74d2c573fe4391fd55aee57a167ca4eb63534b17ee56db9` |

Các tệp gốc giữ nguyên tại thư mục người dùng. Trích xuất PDF bằng pypdf ở thư mục TEMP, không thêm dependency vào ứng dụng. Không đưa PDF, bản trích xuất đầy đủ hoặc thông tin riêng vào public, bundle hay Git. Đây là đọc văn bản PDF và xem ba PNG, chưa kiểm trực quan bố cục từng trang PDF.

## Nội dung dùng cho bản nháp kế tiếp

- Giữ tên dự án, nhóm Lăng Kính, lớp AI2015, học phần SSG105, Đại học FPT Hà Nội và thông điệp hiện hành. PDF trang 1–4 giữ mô hình vui chơi, gây quỹ, đối soát và trao vật phẩm đúng nhu cầu.
- Trang 9–12, 16–17, 20 và 28 củng cố quyền chọn hoạt động, quan sát, nhận hỗ trợ hoặc nghỉ. Nhóm chịu trách nhiệm hoàn thiện hàng gây quỹ; không giao chỉ tiêu sản xuất cho trẻ. Tô tượng là hoạt động chơi và sản phẩm để lại cơ sở, không phải hàng bán.
- Danh mục gây quỹ mới gồm chuồn chuồn tre có đế, móc khóa và đồ ăn. Túi bút/túi vải trong nội dung cũ không còn là danh mục bán của bản đề xuất mới; không trộn hai dự toán.
- Theo trang 12, 25–26: dự kiến chuẩn bị 40 chuồn chuồn 12 cm, trong đó 30 bộ có đế dành bán, 10 chiếc để lại Mái ấm; 100 móc khóa trong kịch bản. Đây không phải hàng tồn thực tế hoặc số đã bán.
- Giá tham khảo trong đề xuất: chuồn chuồn 40.000đ/bộ (trang 25), móc khóa 10.000đ/chiếc trong kịch bản (trang 26); giá chính thức, mẫu, quyền dùng hình và lịch giao chưa xác nhận.
- Trang 24 có set đồ ăn 79.000đ/set; combo 5 nem vỏ giòn 40.000đ/set; combo 5 nem xù 40.000đ/set; combo 5 nem phô mai 60.000đ/set; bánh su kem 20.000đ/hộp. Không suy ra cơ cấu số lượng bán từ số nguyên liệu mua. Trang 12 nêu đồ ăn tương đương 50 set trong phương án doanh thu, chưa phân bổ từng loại.
- Móc khóa do nhóm hoàn thiện. Trang 25 đề cập dùng tranh trẻ để in, nhưng trang 28 tách quyền sở hữu, bán và đăng hình: chưa được phép thì không sử dụng tranh hoặc khẳng định nguồn gốc ấy trên sản phẩm bán.
- Trang 14, 17 và 20 yêu cầu đối soát doanh thu, chi phí, hiện vật, tồn kho, nguồn quỹ ròng và nhu cầu được xác nhận. Không chuyển thành cam kết 100% doanh thu mua quà.

## Dự toán mới đã kiểm phép cộng

Tất cả thuộc planned/unverified; không phải thu chi thực tế hoặc tài trợ đã nhận.

| Nhóm khoản chi | Các thành tiền trong PDF | Tổng |
| --- | --- | ---: |
| Nguyên liệu gây quỹ — trang 24 | 960.000 + 120.000 + 40.000 + 60.000 + 140.000 + 75.000 + 250.000 + 200.000 + 400.000 | 2.245.000đ |
| Chuồn chuồn, đế, tượng, bóng, màu, móc khóa, bánh kẹo — trang 25 | 400.000 + 300.000 + 80.000 + 20.000 + 120.000 + 300.000 + 340.000 | 1.560.000đ |
| Truyền thông và di chuyển — trang 26 | 60.000 + 750.000 + 320.000 | 1.130.000đ |
| Tổng suy ra từ ba bảng | 2.245.000 + 1.560.000 + 1.130.000 | **4.935.000đ** |

Trang 18 xác định mục tiêu doanh thu đồ ăn 4.500.000đ. Khi cộng kịch bản trang 26: 30×40.000 + 100×10.000 + 4.500.000 = **6.700.000đ**, khớp doanh thu dự kiến trang 27. Đây là giả định doanh thu, không phải một tổng suy ra đầy đủ từ bảng số lượng bán đồ ăn. Ví dụ 50×79.000 chỉ bằng 3.950.000đ; cần xác nhận thêm cơ cấu combo/bánh để chứng minh mức 4.500.000đ.

Phép trừ cơ sở: 6.700.000 − 4.935.000 = **1.765.000đ**. Các số dư trong trang 27 đúng phép cộng khi giả định hiện vật thay đúng khoản chi tiền tương ứng: +500.000 → 2.265.000; +1.845.000 → 3.610.000; +1.560.000 → 3.325.000; +1.130.000 → 2.895.000đ. Chưa được xem các khoản thay thế này là đã hợp lệ, đã cam kết hoặc đã nhận.

## Mâu thuẫn cần xác nhận trước khi đưa số chi tiết lên web

1. Trang 27 ghi “chưa hòa vốn” trong kịch bản có số dư dương 1.765.000đ; đây là mâu thuẫn văn bản với phép tính, không giữ câu đó như kết luận tài chính.
2. Kịch bản tài trợ bánh kẹo/quà 500.000đ ở trang 27 khác khoản bánh kẹo 340.000đ trang 25. Chưa rõ 160.000đ bổ sung thay khoản nào.
3. Kịch bản nguyên liệu 1.845.000đ khác tổng nguyên liệu 2.245.000đ. Chênh 400.000đ bằng dòng bánh su kem, nhưng việc loại dòng này mới là suy luận, cần xác nhận phạm vi.
4. Gói “vật tư workshop” 1.560.000đ gồm cả móc khóa 300.000đ và bánh kẹo 340.000đ; nhãn này không mô tả chỉ vật tư chơi. Không tính trùng các gói hiện vật.
5. Trang 23 vẫn nêu mục tiêu vật tư 1.120.000đ từ bản cũ. Không dùng thay tổng bảng mới nếu chưa đối chiếu.
6. Trang 10–12 mô tả buổi giao lưu 180 phút; trang 22 ghi 90–110 phút; mục tiêu khác trong hồ sơ nêu 90–120 phút. Không tự chọn thời lượng.
7. Mốc bốn tuần/tuần học phần khác nhau giữa các phần. Trang 8 yêu cầu báo cáo không muộn tuần 8, trong khi trang 22–23 trao quà và báo cáo tuần 9. Quy tắc recap sau cả hai buổi cũng khác lịch Bài 7 trước buổi trao quà. Chỉ giữ trình tự giai đoạn, chưa chốt ngày lịch hoặc trạng thái đã diễn ra.
8. Chỉ tiêu bài đăng khác nhau (8/10/12); trang 21 nêu ngưỡng 15 người nhưng các phần khác nêu 25. Đây là yêu cầu học phần/kế hoạch cần xác nhận, không phải thành tích hay lý do đưa thêm người đến Mái ấm.
9. Trang 18 có câu 100% doanh thu ủng hộ lại, khác nguyên tắc đối soát chi phí và quỹ ròng ở trang 17/20. Yêu cầu trực tiếp của chủ dự án vẫn ưu tiên: không công bố cam kết 100% doanh thu mua quà.
10. Trang 29, phụ lục xác nhận Mái ấm: “Chờ xác nhận”. Không biến số người, quyền ảnh, lịch, hoạt động hay đầu mối liên hệ trong đề xuất thành thông tin đã được duyệt. Tháng 10/2026 trên bìa không phải ngày thực hiện.

Không tìm thấy kênh nhận đơn/nhận tiền được xác nhận trong nội dung đã đọc. Các URL tham khảo cuối PDF không phải liên hệ dự án. Tiếp tục để actual, tồn kho, liên hệ và quyền ảnh chưa biết là null; ẩn form/QR/nhận tiền.

## Ánh xạ vào website và trạng thái

| Phần | Nội dung cần đối chiếu khi có task cập nhật |
| --- | --- |
| Trang chủ, Dự án | Giữ câu chuyện và quyền lựa chọn; bổ sung mô hình gây quỹ mới; chưa ghi lịch/thời lượng hoặc kết quả chưa xác nhận |
| Sản phẩm | Thay danh mục túi cũ bằng chuồn chuồn/móc khóa và kế hoạch đồ ăn có điều kiện; ảnh sản phẩm thực tế chưa có |
| Minh bạch | Dùng bảng dự toán mới với nguồn/trang; gắn nhãn giả định doanh thu, tách các kịch bản chưa đối chiếu |
| Về nhóm | Ba logo là phương án được cung cấp; chưa có chọn cuối. Logo ngang phù hợp để thử header, biểu tượng vuông phù hợp favicon; đây là đề xuất, chưa triển khai |
| Đồng hành | Vật tư/nhu cầu được xác nhận và nguồn gốc sản phẩm; giữ ẩn kênh liên hệ/nhận đơn/nhận tiền chưa có |

Các tài liệu [content.md](content.md) và [data-and-finance.md](data-and-finance.md) chứa bản cũ phục vụ ứng dụng T04 đã review. Đọc tài liệu tiếp nhận này trước khi tạo task cập nhật; không lấy số cũ như nguồn mới. T04/R04 vẫn là mốc ứng dụng đã nghiệm thu, chưa có thay đổi code, commit ứng dụng mới hoặc worker thực hiện cập nhật materials. Không mở T05/public bằng việc tiếp nhận nguồn.
