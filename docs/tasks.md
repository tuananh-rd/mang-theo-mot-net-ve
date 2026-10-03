# Backlog

Cập nhật03/10/2026: **C01-UI DONE; RC01-UI PASS** tại app96f539772b78d70324adb95a11508d27163cd3ad (basea4e0aa8), sửa M1/M2 vàL1–L7 theo Claude; L8 giữ ảnh gốc chờ chủ dự án. Preview mới http://127.0.0.1:4322/ (loopbackPID25960), thay thông tin4321/PID2888 lịch sử phía dưới. Minh bạch375 giảm18%; check/18tests/build0,38targeted+20navigation+6finance+38bundle và19servedhash đạt. Review: docs/reviews/RC01-ui-96f5397.md. Worker HOLD, không T05/public.

## C01-UI — sửa theo Claude, 03/10/2026

Chủ dự án yêu cầu sửa theo [review Claude](../reports/ui-review-claude-c01.md). [Spec C01-UI](task-specs/C01-ui-claude.md) giao Antigravity duy nhất: M1/M2 và L1–L7, giữ nguyên wordmark L8 chờ chủ dự án. Baseline a4e0aa879525d366335630eaf329633c35c6bb80, task/c01-materials. Request đã nhận input, đang kiểm ACK/triển khai; chưa nghiệm thu hoặc public. Reviewer Claude đã hoàn thành chỉ đọc. Không mở T05.

## C01 hoàn thành — 03/10/2026

**C01 DONE; RC01 PASS** tại app ead94a482e590cf1c5ef4eb1e0829c99e30d378c, base113069636c653cb7bbb255c33d681cbbbd940b19, nhánh task/c01-materials. [Review](reviews/RC01-ead94a4.md), [spec](task-specs/C01.md), [nguồn](materials-intake.md).655browser,18tests/check/build0,source6/6,bundle38/38,17disthash/HTTPbody,13ảnh đãxem. Worker ACK bàn giao và HOLD, giữ preview127.0.0.1:4321. T05 chưa giao/public chưa duyệt. Các mục IN_PROGRESS và T04 dưới đây là lịch sử.

## Hiện tại C01 — cập nhật materials, 03/10/2026

**C01 IN_PROGRESS** theo yêu cầu thêm nội dung vào website. Antigravity hiện có đã đọc spec, kiểm repo/nguồn, tạo nhánh task/c01-materials từ113069636c653cb7bbb255c33d681cbbbd940b19 và bắt đầu copy logo. [Spec](task-specs/C01.md), [nguồn](materials-intake.md), [receipt](evidence/C01/dispatch-response.json), [trace](evidence/C01/worker-ack-trace.json). Receipt chỉ chứng minh input_accepted; chưa nhận ACK riêng hoặc commit bàn giao C01 tại thời điểm ghi mục này. R04 vẫn là nghiệm thu ứng dụng cũ. Không mở T05/public.

## Hiện tại sau T04/R04 — 03/10/2026

**T04 DONE; R04 PASS** tại app fad117c7e12a80775b0dbd0ad93ff464db60fcb9, base1b6d678, nhánh task/t04-preview-polish. [Review cuối](reviews/R04-fad117c.md), [spec](task-specs/T04.md), [vận hành](operations.md). 410/410browser,16tests/check/build0,21full-page đã xem và bundle/serve hash khớp. Worker HOLD giữ loopbackpreview; T05 chưa giao, chờ thông tin thật/hosting và chủ dự án duyệt public. Các mốc T03/T02/T01 bên dưới là lịch sử.

## Trạng thái hiện tại sau R03 — 03/10/2026

**T03 DONE; R03 PASS** tại app `b6e5205c6cfd19b6bae592e7148c49385c671e8d`, base `da890a212e029249e29545aa1606e71027034674`, nhánh `task/t03-finance-support`. [Review cuối](reviews/R03-b6e5205.md), [candidate yêu cầu sửa](reviews/R03-e563de4.md). Check/tests/build độc lập exit0,13tests tài chính đạt,266browser assertions được chấp nhận (264fullrun+2targetedFAQ, nguyên nhân script ghi rõ),6full-page đã xem. Cả6route nội dung preview; actual/contact vẫn chưa xác nhận. **T04 READY, chưa giao**, worker HOLD giữ preview; chưa public. Các trạng thái IN_PROGRESS/CHANGES_REQUIRED bên dưới là lịch sử.

## T03 tiếp tục — 03/10/2026

Chủ dự án nói “ok tiếp tục đi” sau T02/R02 PASS. **T03 IN_PROGRESS; R03 CHANGES_REQUIRED tại e563de4**, base `da890a212e029249e29545aa1606e71027034674`, nhánh `task/t03-finance-support`. [Đặc tả T03](task-specs/T03.md) hoàn thiện Minh bạch/Đồng hành, tách dự toán/thực tế, tiền/hiện vật và contact chưa xác nhận. [Review candidate](reviews/R03-e563de4.md); worker hiện có đã đọc review và đang sửa cùng task. [Continuity/receipt](evidence/T03/continuity.json), [trace tiếp nhận](evidence/T03/worker-ack.json); không coi input_accepted hoặc ACK HOLD của T02 là ACK T03. Không T04 hoặc public. Giữ hiện trạng T02 bên dưới để truy vết.

## Trạng thái hiện tại — 03/10/2026

**T02 DONE; R02 PASS** tại app `a317d856f51648a39fbcac33010c03bb8c7723b5`, nhánh `task/t02-content-pages`, base `fff88b2209e3c2836c06125bad1a7084bdc50590`. [Review cuối](reviews/R02-a317d85.md); [review yêu cầu sửa 311dc33](reviews/R02-311dc33.md) giữ nguyên. 279 assertions trình duyệt đạt, check/build độc lập exit 0, visual 9 ảnh full-page và audit dist đạt. Ba trang nội dung hoàn thành; hai route Minh bạch/Đồng hành còn shell. T03 READY cho bước đặc tả tiếp theo, **chưa giao hoặc triển khai**; worker hiện có HOLD sau T02. Chưa public website. Các mục resume/pause/IN_PROGRESS dưới đây là lịch sử.

## Tiếp tục R02 — 03/10/2026

Chủ dự án nói “tiếp tục đi”, kết thúc yêu cầu tạm dừng trước. **T02 bàn giao app311dc33; R02 IN_PROGRESS** trên `task/t02-content-pages`, basefff88b2. Codex đọc diff/bằng chứng, cùngworker Antigravity mở lại production preview để nghiệm thu; không triển khai lại từ đầu hoặc mở T03 trước PASS. [Tiếp nhận](evidence/T02/resume-2026-10-03.json). Giữ toàn bộ thay đổi hiện có.

## Tạm dừng theo yêu cầu chủ dự án

Chủ dự án yêu cầu “ok dừng đi”. **T02 PAUSED, R02 chưa thực hiện**. Worker đã tạo app commit `311dc33f472b8969de99872927822b0f7f566679` trên `task/t02-content-pages`; chưa được Codex nghiệm thu hoặc push trong vòng T02. Giữ mọi thay đổi đang có. Đã gửi lệnh HOLD đến worker hiện có và quan sát worker tiếp nhận; chỉ tiếp tục khi có yêu cầu mới. Các trạng thái IN_PROGRESS bên dưới là lịch sử trước khi dừng.

## T02 — đã duyệt UI, tiếp tục triển khai

Chủ dự án nói “ok đó bạn làm tiếp đi” sau R01 PASS; **hướng UI mới đã được duyệt, T02 IN_PROGRESS** tại base `fff88b2209e3c2836c06125bad1a7084bdc50590`, nhánh `task/t02-content-pages`. [Đặc tả T02](task-specs/T02.md): trang dự án/nhóm/sản phẩm; vẫn mộtworker Antigravity hiện có, Codex spec/review. [Continuity](evidence/T02/continuity.json), [ACK thực và Brain cho triển khai](evidence/T02/ack.json). Tên/ảnh/liên hệ/actual chưa xác nhận không tự public. T03 chưa mở; đây chưa phải duyệt phát hành.

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
| T02 | Antigravity | R01 PASS + chủ dự án duyệt hướng UI | DONE tại a317d85: dự án/nhóm/sản phẩm; basefff88b2, task/t02-content-pages |
| R02 | Codex | T02 | PASS tại a317d85: diff, nội dung, 279 assertions, visual, check/build và audit |
| T03 | Antigravity | R02 đạt | DONE b6e5205: Minh bạch/Đồng hành, planned/actual/contact data, helper và tests |
| R03 | Codex | T03 | PASS b6e5205 sau sửa e563de4, review source/visual/browser/finance/build/audit |
| T04 | Antigravity | R03 | DONE fad117c: metadata/data thống nhất và preview tổng thể; task/t04-preview-polish, base1b6d678 |
| R04 | Codex | T04 | PASS fad117c: diff/410browser/16tests/build/visual/audit; hướng dẫn vận hành và giới hạn đã ghi |
| T05 | Antigravity | R04 + chủ dự án duyệt public | NOT_ASSIGNED: chờ xác nhận dữ liệu/ảnh/liên hệ/hosting và duyệt phát hành |

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

R04 PASS tại fad117c; T05 chưa giao, cần chủ dự án xác nhận thông tin thật/hosting và duyệt public. Giữ preview và ẩn hành động chưa đủ thông tin. Các dòng R03/R02 dưới đây là lịch sử.

R02 PASS tại `a317d85`; bước tiếp theo là đặc tả T03. Giữ riêng planned/actual, tiền/hiện vật và contact chưa xác nhận. Không mở task trùng hoặc yêu cầu duyệt public trước preview toàn site/R04. Đoạn R01 bên dưới là lịch sử.

R01 vòng đầu **CHANGES_REQUIRED** tại `a62542196676b61fd83618f18ccf6891821f9788`; [review vòng đầu](reviews/R01-a625421.md) được giữ nguyên. Antigravity sửa qua `191adc8` và bàn giao `c27fea2`; [R01 cuối PASS](reviews/R01-c27fea2.md). Chờ chủ dự án duyệt hướng UI trước T02. Không chứng nhận UI giống hệt ShareTheMeal; khảo sát nguồn có redirect và giới hạn đã ghi. R01 PASS chỉ nghiệm thu mẫu T01, không phải duyệt public hoặc xác nhận dữ liệu thực tế.
