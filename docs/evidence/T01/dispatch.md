# Bàn giao qua Antigravity MCP — T01

Ngày: 02/10/2026. Người giao: Codex. Chủ dự án đã cho phép fallback MCP trong AGENTS.md và yêu cầu trực tiếp; không phải Orca dispatch.

## Kiểm tra trước gửi

Đã đọc lại AGENTS.md, docs/tasks.md và task T01. `list_active_jobs({limit:20})` trả `No jobs recorded yet.`; `list_available_models({})` trả 14 model, có `Gemini 3.1 Pro (High)`. Không dispatch song song hoặc tạo agent thứ ba. Catalog phản hồi chưa chứng minh worker có quyền thực thi workspace.

## Lần gửi 1

- Task: T01; model yêu cầu: `Gemini 3.1 Pro (High)` đúng nhãn catalog.
- Request lưu lúc 2026-10-02 02:36:47 UTC (09:36:47 giờ Việt Nam), gồm system/task và 12 đường dẫn tài liệu: [request](dispatch-request.json).
- Response connector: `Subagent dispatched`, job `agy-c1dfa488`, model `Gemini 3.1 Pro (High)`, status `running`: [response](dispatch-response.json).
- Kiểm tra sau gửi: job **FAILED**, không còn running. Logs báo đọc 12 context file, gom 48.622 ký tự, rồi gọi Gemini REST endpoint và lỗi `URL can't contain control characters` do nhãn model có khoảng trắng được đưa vào URL. Không có output ACK của worker, B0, commit hoặc bằng chứng code/build.
- [Response kiểm job](job-check-01.json) đã che credential có trong lỗi connector. Không đưa credential vào bản bàn giao hoặc bundle.
- ACK: **NOT_RECEIVED**. Không coi xác nhận tạo job là ACK.

## Xử lý

Không đoán machine model ID/provider và không sửa connector hay code ứng dụng. Sau khi job lỗi đã kết thúc, có thể thử một lần bỏ tham số model để dùng default được tool mô tả; vẫn chỉ T01 và một job hoạt động. Mọi lần thử phải lưu request/response và model thực trả. Nếu connector vẫn lỗi hoặc chỉ có LLM sinh văn bản không có công cụ triển khai, ghi BLOCKED và không claim đã triển khai.

## Lần gửi 2 — mặc định được tool hỗ trợ

- Chỉ thử sau khi job agy-c1dfa488 đã FAILED. Không có hai job T01 chạy song song.
- [Request lần 2](dispatch-request-02.json): cùng task/system/context_files, bỏ model argument theo default được tool mô tả; không đoán model ID.
- [Response lần 2](dispatch-response-02.json): job **agy-2379cdec**, model thực trả **gemini-flash-lite-latest**, trạng thái tạo job **pending**. Model này do connector chọn; không nói đây là model đã có trong catalog 14 nhãn.
- [Kiểm job lần 2](job-check-02.json): **COMPLETED**, thời lượng connector báo 1.8 giây. COMPLETED ở đây là job trả lời xong, không phải task triển khai xong.
- ACK nguyên văn của worker:

> ACK_BLOCKED
> Môi trường hiện tại không có công cụ filesystem, terminal shell hoặc browser tools cần thiết để Antigravity thực thi, kiểm tra và ghi code trực tiếp cho task T01.
> Theo đúng hướng dẫn: trả ACK_BLOCKED ngay với giới hạn này, không sinh một bản code dài để Codex tự áp dụng. Chủ dự án có thể chuyển trạng thái hoặc giao thủ công.

## Trạng thái cuối

| Trường | Giá trị |
| --- | --- |
| Task | T01 |
| Kênh | Antigravity MCP / gemini_worker fallback đã được cho phép |
| Job 1 / model / trạng thái | agy-c1dfa488 / Gemini 3.1 Pro (High) / FAILED trước ACK |
| Job 2 / model / trạng thái | agy-2379cdec / gemini-flash-lite-latest / COMPLETED với ACK_BLOCKED |
| ACK triển khai | BLOCKED: thiếu filesystem/shell/browser tools |
| Task status | BLOCKED, không phải DONE hoặc IN_PROGRESS |
| Baseline B0 / final SHA | Chưa có; không có Git/commit do worker tạo |
| Code/build/preview/screenshot | Chưa có bằng chứng triển khai |

Không hỏi lại quyền MCP, không tự sửa code hoặc tạo thêm agent. Việc tiếp theo cần môi trường Antigravity thực thi có công cụ đọc/sửa workspace, shell và khả năng trả báo cáo/preview; có thể chuyển nguyên task đến phiên IDE có quyền đó. Sau khi kênh thực thi được khắc phục, kiểm trạng thái job trước khi giao lại chính T01. Không mở T02 và không yêu cầu duyệt public. R01 BLOCKED vì chưa có SHA/diff/preview để review.
