# Dữ liệu và tài chính

## Quy tắc dữ liệu

Các số dưới đây thuộc **dự toán trong hồ sơ**, không phải giao dịch thực tế hoặc mục tiêu gây quỹ đã được duyệt. Dùng VND dạng số nguyên; format khi hiển thị.

Mỗi thông tin định lượng có: giá trị, đơn vị, loại `planned/actual`, trạng thái xác minh `unverified/confirmed`, nguồn và ngày cập nhật nếu có. Không tự gán ngày cập nhật cho thông tin chưa kiểm chứng.

- Project: slug, title, summary, location, status (chưa xác nhận ban đầu), hoạt động, giai đoạn kế hoạch.
- Product: tên, mô tả, ảnh và quyền dùng ảnh, giá tham khảo, số lượng dự kiến, nguồn gốc, trạng thái bán. Hàng tồn thực tế để null khi chưa biết.
- Update: nội dung, ngày thật, bằng chứng và trạng thái duyệt public.
- Finance: kế hoạch tách khỏi thực tế; tiền thu, tài trợ hiện vật, chi tiền, tồn kho, hiện vật bàn giao là các loại riêng.
- Team: tên được duyệt, vai trò, ảnh được phép; không có dữ liệu nhận diện cá nhân của trẻ.
- Evidence: bản public đã che dữ liệu riêng và bản nội bộ ngoài bundle. Không public DOCX gốc chỉ vì file có trong repository.

## Dự toán chi

| Khoản mục | Số tiền |
| --- | ---: |
| 40 chuồn chuồn × 13.500đ | 540.000đ |
| 30 chân đế × 18.000đ | 540.000đ |
| 20 tượng × 14.000đ (giả định) | 280.000đ |
| Màu, cọ/mút, bóng/chốt (giả định) | 300.000đ |
| 20 túi bút × 20.000đ + 8 túi vải × 35.000đ | 680.000đ |
| Gói hàng 80.000đ + mẫu 100.000đ + di chuyển 600.000đ | 780.000đ |
| **Tổng dự toán** | **3.120.000đ** |

## Kịch bản bán đủ hàng

30 × 40.000 + 20 × 55.000 + 8 × 75.000 = **2.900.000đ doanh thu dự kiến**.

- Không tài trợ: 2.900.000 − 3.120.000 = **âm 220.000đ**.
- Hiện vật thay 500.000đ chi phí: chi tiền còn 2.620.000đ; số dư dự kiến **280.000đ**.
- Hiện vật thay 1.120.000đ chi phí workshop: chi tiền còn 2.000.000đ; số dư dự kiến **900.000đ**.

Không cộng hiện vật vào tiền nhận rồi lại trừ cùng khoản chi phí lần nữa. Khi báo cáo thực tế, số dư tiền = số dư đầu kỳ + doanh thu thực nhận + tài trợ tiền thực nhận − chi tiền thực trả; hiện vật được ghi riêng. Hàng tồn không phải tiền hoặc doanh thu đã thu.

Không nói “100% doanh thu dành mua quà”: đề xuất có chi phí vật tư và vận hành. Không đặt thanh tiến độ lấy doanh thu chia tổng chi phí khi chưa có định nghĩa mục tiêu được duyệt.
