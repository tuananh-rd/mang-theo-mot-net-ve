# Backlog

T00 đã hoàn thành phần tài liệu ngày 02/10/2026, với giới hạn khảo sát UI được ghi rõ. T01 đã được gửi qua **Antigravity MCP fallback** theo quyền chủ dự án; hiện **BLOCKED** với ACK_BLOCKED vì worker không có filesystem/shell/browser tools. Không có Git/commit/code/build/preview bàn giao. Không có agent thứ ba; không có hai job T01 chạy đồng thời.

Task triển khai duy nhất: [T01 — khung và trang chủ mẫu](task-specs/T01.md). Commit xuất phát hiện **NONE** vì chưa có Git; Antigravity cần báo baseline B0 thật theo task trước khi code. Giữ nguyên task để giao lại khi có môi trường thực thi workspace; không mở T02.

Kiểm tra trước gửi 02/10: Antigravity MCP phản hồi model catalog và `No jobs recorded yet.`; Orca CLI không có. Dispatch 1: **agy-c1dfa488**, **Gemini 3.1 Pro (High)**, running → FAILED do connector dùng nhãn model có khoảng trắng trong URL; không ACK. Dispatch 2 sau khi job 1 kết thúc: **agy-2379cdec**, mặc định **gemini-flash-lite-latest**, pending → COMPLETED nhưng output **ACK_BLOCKED**. Xem [request/response và ACK](evidence/T01/dispatch.md). COMPLETED job không đồng nghĩa hoàn thành T01.

| ID | Chủ trách nhiệm | Phụ thuộc | Đầu ra và nghiệm thu |
| --- | --- | --- | --- |
| T00 | Codex | Không | DONE_WITH_LIMITATIONS: đọc nguồn, khảo sát repo; architecture + UI đề xuất + T01; chưa xác minh UI nguồn hoặc kênh Orca, xem evidence/T00/survey.md |
| T01 | Antigravity | T00 | BLOCKED: đã gửi MCP và nhận ACK_BLOCKED thiếu công cụ thực thi; chưa B0/code/build/preview |
| R01 | Codex | T01 | BLOCKED: chưa có commit/diff/preview để review; không chứng nhận UI PASS |
| T02 | Antigravity | R01 đạt | Trang dự án, nhóm và sản phẩm; dữ liệu có nguồn, giá tham khảo, không giả tồn kho hay thành tích |
| R02 | Codex | T02 | Review routing, dữ liệu, nội dung, responsive |
| T03 | Antigravity | R02 đạt | Minh bạch và đồng hành; phép tính đúng; trường hợp thiếu dữ liệu rõ; chỉ dùng liên hệ thật |
| R03 | Codex | T03 | Review tách tiền/hiện vật, kế hoạch/thực tế, hành động và quyền công bố |
| T04 | Antigravity | R03 | Sửa lỗi, metadata, 404, accessibility cơ bản, tối ưu ảnh, hướng dẫn vận hành |
| R04 | Codex | T04 | Nghiệm thu preview hoàn chỉnh, báo giới hạn và các thông tin còn thiếu |
| T05 | Antigravity | R04 + chủ dự án duyệt public | Phát hành lên môi trường được chọn, kiểm URL public và hành vi |

## Mẫu task Codex giao

Task ID:
Commit xuất phát:
Mục tiêu:
File/phần được sửa:
Yêu cầu UI và hành vi:
Dữ liệu/nguồn:
Không thuộc phạm vi:
Tiêu chí nghiệm thu:
Kiểm tra cần chạy:
Bàn giao cần có:

Không gộp toàn bộ website thành một task. Khi review yêu cầu sửa, tiếp tục task hiện tại cho tới nghiệm thu, không bỏ lỗi sang bước sau.

## Review kế tiếp

R01 **BLOCKED**, không có commit ứng dụng để review. Sau khi nhận B0 và SHA bàn giao, Codex đọc diff và preview thực tế; PASS chỉ khi đủ bằng chứng code/UI/hành vi/nội dung. Nếu không xem được preview, ghi BLOCKED ở phạm vi chưa kiểm chứng. Không chứng nhận UI giống ShareTheMeal khi chưa có bằng chứng nguồn. Sau PASS, chủ dự án duyệt hướng UI mới mở T02.
