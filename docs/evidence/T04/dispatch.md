# T04 — Giao việc và bằng chứng

Kênh: Orca CLI `1.4.217`, hướng dẫn `orca skills get orca-cli --json` đã đọc theo executable phiên này. Đây là input cho terminal Antigravity hiện hữu; không phải MCP dispatch, không tạo worker/job mới. Model quan sát từ TUI: `Gemini 3.8 Flash · high`; không truyền model/provider phỏng đoán.

Workspace thực tế `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`, Git sạch trước chuẩn bị spec, HEAD `1b6d678203a89cc8f2f384d08e50ee65e88a02a4`. [Spec](../../task-specs/T04.md). R03 đã PASS, worker trước giao việc HOLD; loopback4321/PID2888 hiện có. Terminal list của đúng folder context chỉ có một Antigravity:

- Handle `term_4d29ba8e-7d0b-4a74-858f-d45e9a6fb9b9`.
- Runtime `6e6114a7-3148-4dbe-b563-c2a58c95ba4d`, incarnation `2ea6694a-36ff-4841-8433-a795aeb9a8b8`.
- Context `1873b0af-5f38-4783-9ee7-c7c32705fcaf::C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve::workspace:a975a56e-0b5d-4351-b7c3-1e22cf16c0fc`.
- TaskID T04; jobID null vì không dùng job connector.

`worker-before.json`, `terminals-before.json`, `worker-hold-before.json` lưu kiểm thực tế. Không gửi vào context lịch sử cùng đường dẫn hoặc handle cũ.

Request đầu `dispatch-request.json` bị parser native Windows từ chối vì quote trong prompt; response `invalid_argument`, không accepted. Đọc lại terminal xác nhận HOLD, lưu `worker-after-rejected-input.json`. Chỉ sau lỗi xác định chưa gửi mới bỏ quote và gửi `dispatch-request-02.json`; response accepted/input_accepted, requestID `1706bd0c-2abc-412a-96bb-8ee5a51c2dba`, observation/provider unsupported. Receipt không chứng minh turn hoặc ACK, không resend do im lặng.

`worker-check-01.json` có Read spec/Layout/products và Bash thực tế; `worker-ack-trace.json` có kiểm HEAD/status và `git checkout -b task/t04-preview-polish 1b6d678...`, nhánh thực đã kiểm. Worker đã triển khai, ACK riêng chưa xuất hiện trong phần trace lúc ghi dòng này. Ghi chú metadata quantity gửi một lần qua `quantity-note-request.json`/response, chỉ dùng qualifier/prefix không lặp số kế hoạch; yêu cầu ACK ở checkpoint và không dừng công việc để trả lời.

Kết quả triển khai, ACK và R04 được bổ sung khi có bàn giao đúng SHA. Không coi trạng thái terminal running hoặc receipt accepted là task DONE.

## Bàn giao và nghiệm thu cuối

Candidate thật0d4bd9d nhận R04 CHANGES_REQUIRED hai finding; `review-request.json`/response ghi input duy nhất. Worker đọc review, sửa tại final `fad117c7e12a80775b0dbd0ad93ff464db60fcb9`; code11file task, không stage docs Brain. Candidate snapshot prefixworker-0d4bd9d giữ3PNG/check/build/test/metadata cũ; các artifact final prefixworker-fad117c riêng, không gộp kết quả.

`worker-handoff.json` và `worker-ack-final.json` chứa handoff/ACK T04, SHA fad117c, nhánh/model Gemini3.8Flash(High), task957/PID2888/loopback và HOLD. Worker thực có filesystem/shell/browser, ghi117/117assertions,16tests/check/build0 và23ảnh. Không coi receipt providerunsupported là ACK; ACK đến từ output worker sau thực thi.

`handoff-correction-request.json`/response yêu cầu sửa riêng báo cáo ngoài repo: Astro thực7.3.5 (không5.16.4), ProductCard ởhome/san-pham (khôngdong-hanh), timestamp UTC từraw-log mtime. Worker ACK và sửa metadata/report, không đổi app/build; bản final đã copy sau sửa. Codex độc lập410/410browser,check/test/build0,16tests,45PNG;15outputhash giữ sau rebuild,8servedresponse khớpdist,app sạch. R04 PASS ghi trong docs/reviews/R04-fad117c.md. Worker tiếp tụcHOLD, chưaT05/public.

Sau R04 PASS, closure-request.json/response và closure-ack.json ghi worker đã đọc review, ACK T04 DONE/R04 PASS/fad117c/HOLD, giữ previewtask957/PID2888 và không T05/push/public. Không tạo worker mới.
