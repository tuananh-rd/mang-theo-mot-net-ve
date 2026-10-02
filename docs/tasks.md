# Backlog

## Vòng sửa UI theo Claude — 02/10/2026

Theo yêu cầu sửa UI Claude của chủ dự án: **T01 DONE; R01 PASS** tại app SHA `285f695e6c385ee0de6dff30d89c06aa92f46639`, base vòng sửa `e6aa96505c4368eca3e0d32a3cf41b1a7910a1db`. [Review cuối](reviews/R01-ui-285f695.md), [review Claude nguyên vẹn](../reports/ui-review-claude.md), [addendum T01](task-specs/T01-ui-claude.md), [kênh continuity](evidence/T01/ui-claude/continuity.json). Worker Antigravity hiện có triển khai2commit e30f939/285f695; Codex đọc diff, kiểm bằng chứng và visual5viewport. Ci sạch ngoài repo/check/build exit0,92assertions đạt; mobile375 từ10.496→8.723px, giảm16,89%. Repository GitHub private hiện có lưu code, chưa public website. **T02 WAITING_UI_APPROVAL**, cần chủ dự án duyệt hướng UI mới. R01 c27fea2 và handle cũ phía dưới là lịch sử, không dùng lại handle khi runtime đã đổi.

## Tiếp nhận phiên Orca — 02/10/2026

Trạng thái hiện tại thay phần lịch sử dưới đây: **T01 DONE; R01 PASS** tại final SHA **c27fea2f8d377523b2200a1630756acfe46f54a2**. Baseline **B0 = ef102c8c1908f1dcd843d8d9f6741848dcb43d63**, nhánh `task/t01-home-shell`. Antigravity hiện có ở `net-ve-worker`, handle đã kiểm `term_b8d3b82d-bec3-4a22-b23d-b95f9e9785d9`, đã triển khai và sửa cùng T01; không tạo worker/job/dispatch mới. Codex kiểm diff, source hash, build, routing/menu/responsive/contrast và visual preview thực tế. [R01 cuối](reviews/R01-c27fea2.md), [bàn giao worker](evidence/T01/worker-handoff-c27fea2.md).

Orca 1.4.217 hoạt động; đã tải guide theo executable `orca`. Hai job MCP cũ được nhận diện và vẫn terminal: FAILED / COMPLETED với ACK_BLOCKED; không dispatch MCP lại. Phối hợp qua terminal hiện có, không gọi đây là Orca orchestration dispatch. Receipt chỉ có `input_accepted`; sau đó Codex đọc prompt, ACK và Read/Edit/Bash thực từ worker trace. [Bằng chứng tiếp nhận đã che credential](evidence/T01/resume-2026-10-02.json), [ACK và bàn giao](evidence/T01/worker-ack.md).

Preview đang chạy loopback http://127.0.0.1:4321/, noindex/nofollow. **T02 WAITING_UI_APPROVAL, chưa giao hoặc triển khai**; cần chủ dự án duyệt hướng UI sau R01 PASS. Chưa public deploy. Lỗi reviewer `npm.cmd ci` khi preview giữ compiler đã được ghi đúng exit 1 và worker phục hồi ci/check/build exit 0; không che lỗi bằng claim pass.

## Lịch sử phiên MCP trước khi tiếp nhận

T00 đã hoàn thành phần tài liệu ngày 02/10/2026, với giới hạn khảo sát UI được ghi rõ. T01 đã được gửi qua **Antigravity MCP fallback** theo quyền chủ dự án; hiện **BLOCKED** với ACK_BLOCKED vì worker không có filesystem/shell/browser tools. Không có Git/commit/code/build/preview bàn giao. Không có agent thứ ba; không có hai job T01 chạy đồng thời.

Task triển khai duy nhất: [T01 — khung và trang chủ mẫu](task-specs/T01.md). Commit xuất phát hiện **NONE** vì chưa có Git; Antigravity cần báo baseline B0 thật theo task trước khi code. Giữ nguyên task để giao lại khi có môi trường thực thi workspace; không mở T02.

Kiểm tra trước gửi 02/10: Antigravity MCP phản hồi model catalog và `No jobs recorded yet.`; Orca CLI không có. Dispatch 1: **agy-c1dfa488**, **Gemini 3.1 Pro (High)**, running → FAILED do connector dùng nhãn model có khoảng trắng trong URL; không ACK. Dispatch 2 sau khi job 1 kết thúc: **agy-2379cdec**, mặc định **gemini-flash-lite-latest**, pending → COMPLETED nhưng output **ACK_BLOCKED**. Xem [request/response và ACK](evidence/T01/dispatch.md). COMPLETED job không đồng nghĩa hoàn thành T01.

| ID | Chủ trách nhiệm | Phụ thuộc | Đầu ra và nghiệm thu |
| --- | --- | --- | --- |
| T00 | Codex | Không | DONE_WITH_LIMITATIONS: đọc nguồn, khảo sát repo; architecture + UI đề xuất + T01; chưa xác minh UI nguồn hoặc kênh Orca, xem evidence/T00/survey.md |
| T01 | Antigravity | T00 | DONE: app final285f695 sau sửa Claude, B0 ef102c8; trang chủ mẫu + 5 shell +404, preview/evidence thật |
| R01 | Codex | T01 | PASS tại285f695; các review c27fea2/a625421/e30f939 được giữ để truy vết |
| T02 | Antigravity | R01 PASS + chủ dự án duyệt hướng UI | WAITING_UI_APPROVAL, chưa giao: trang dự án, nhóm và sản phẩm; dữ liệu có nguồn, giá tham khảo, không giả tồn kho hay thành tích |
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

R01 vòng đầu **CHANGES_REQUIRED** tại `a62542196676b61fd83618f18ccf6891821f9788`; [review vòng đầu](reviews/R01-a625421.md) được giữ nguyên. Antigravity sửa qua `191adc8` và bàn giao `c27fea2`; [R01 cuối PASS](reviews/R01-c27fea2.md). Chờ chủ dự án duyệt hướng UI trước T02. Không chứng nhận UI giống hệt ShareTheMeal; khảo sát nguồn có redirect và giới hạn đã ghi. R01 PASS chỉ nghiệm thu mẫu T01, không phải duyệt public hoặc xác nhận dữ liệu thực tế.
