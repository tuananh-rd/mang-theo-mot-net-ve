# Workflow Codex → Antigravity → Review

## Quyền sở hữu

Codex là người điều phối, quyết định kỹ thuật và review. Antigravity là người triển khai code. Chủ dự án xác nhận nội dung và duyệt public. Codex sửa tài liệu; Antigravity sửa code. Không tự phát thêm tính năng.

## Vòng lặp

1. Codex giao một task có commit xuất phát, mục tiêu, phạm vi file, yêu cầu UI/hành vi, điều kiện loại trừ và tiêu chí nghiệm thu.
2. Antigravity xác nhận; triển khai; kiểm tra; commit; báo cáo.
3. Codex đọc diff đúng commit, xem preview và kiểm tra bằng chứng. Kết luận PASS / CHANGES_REQUIRED / BLOCKED.
4. Antigravity sửa theo review và bàn giao commit mới.
5. Codex nghiệm thu rồi giao task tiếp theo.

Ưu tiên Orca khi kênh Antigravity đã được xác minh. Khi terminal không có Orca CLI và Antigravity MCP đã trả model catalog/trạng thái job, chủ dự án đã cho phép dùng MCP làm fallback cho task có đặc tả. Ghi request/response, task ID, model, job ID/trạng thái và ACK; không gọi là Orca dispatch. Nếu cả hai kênh chưa xác minh, xuất task để chuyển thủ công. Không coi gửi thành công là người nhận đã đọc hoặc task đã xong. Không cần thêm agent thứ ba.

## Các mốc

- Mốc A: Codex hoàn thành brief, khảo sát UI và quyết định kiến trúc. Antigravity triển khai trang chủ mẫu.
- Mốc B: chủ dự án duyệt hướng UI; triển khai dự án, nhóm, sản phẩm.
- Mốc C: minh bạch, liên hệ, cập nhật và trạng thái chưa có dữ liệu.
- Mốc D: review code/chức năng/giao diện; sửa lỗi; preview hoàn chỉnh và hướng dẫn vận hành.
- Mốc E: chủ dự án duyệt public; mới thực hiện phát hành.

Không hỏi xác nhận cho mọi lựa chọn nhỏ. Trong lúc chờ nội dung thật, tiếp tục layout và mô hình dữ liệu; không bật hành động phụ thuộc vào dữ liệu chưa có.

## Bàn giao Antigravity

Task; commit; thay đổi và file; kết quả build/check phù hợp; preview; screenshot desktop/mobile nếu có; phần chưa kiểm chứng; quyết định cần Codex xử lý. Không gửi log chứa thông tin riêng.

## Nghiệm thu

- Routing, liên kết, menu mobile và thao tác bàn phím hoạt động.
- UI kiểm ở 375/768/1440 px; không tràn ngang; ảnh không méo.
- Dự toán và thực tế hiển thị tách biệt; tổng dự toán và kịch bản đúng.
- Không có số liệu nhạy cảm/chưa xác nhận được hiển thị như thành tích.
- Sản phẩm ghi nguồn gốc, giá tham khảo và tình trạng đúng dữ liệu.
- Form chỉ báo thành công khi có nơi nhận thật; nếu MVP chỉ có link liên hệ thì kiểm link.
- Ảnh public có nguồn và quyền dùng đã xác nhận; tài liệu nội bộ không lọt bundle.
- Chạy build và kiểm tra phù hợp; tests tập trung vào tính toán/trạng thái/hành vi có rủi ro, không viết test chỉ lặp lại nội dung tĩnh.
- Preview được xem thực tế; nếu chưa xem được, ghi rõ hạn chế thay vì claim UI PASS.
- Có hướng dẫn chạy, cập nhật nội dung và deploy; không chọn hosting thay người dùng khi chưa có yêu cầu.
