# Bằng chứng khảo sát T00

Ngày: 02/10/2026. Người khảo sát: Codex. Không có website dự án để review tại thời điểm này.

## Repo và hồ sơ

- Đã đọc AGENTS.md, README.md, toàn bộ Markdown trong docs/ và public/images/README.md.
- Đã đọc XML nội dung, bảng và footer của docs/source/de-xuat-du-an.docx bằng zipfile/ElementTree; không chỉnh sửa DOCX hoặc xuất bản nội dung thô. SHA256: `83c038c04ad7cff87f616c98529a1df788a2467451b83d95e890bfba0f4307d5`.
- DOCX có hai ảnh nhúng; chưa có xác nhận quyền hoặc mục đích, không trích làm asset. Việc đọc nội dung XML không phải kiểm trang in/đồ họa của Word.
- Kiểm lại các đoạn về 11/9 trẻ cần hỗ trợ, 17+2/21, đại diện và điều phối khác nhau, tháng 09/2026, ngưỡng 25 người và bảng tài chính. Không có bằng chứng cho kết quả đã thực hiện. Quyết định: không hiển thị số cư dân/chẩn đoán, tên liên hệ hoặc ngày lịch chưa xác nhận.
- Kiểm số học độc lập: tổng chi 3.120.000; bán đủ 2.900.000; chênh -220.000; hai giả định thay chi bằng hiện vật cho số dư 280.000 và 900.000 VND.
- Không có .git/package.json/src/lockfile. Git báo `fatal: not a git repository (or any of the parent directories): .git`.

## ShareTheMeal

Nguồn yêu cầu: https://sharethemeal.org/fr.

| Phương thức | Kích thước yêu cầu | Kết quả |
| --- | --- | --- |
| Công cụ web open URL | Không có viewport trình duyệt | `Failed to fetch https://sharethemeal.org/fr: (403) Forbidden` |
| Chrome headless lần 1 | 1440 × 1000 | GPU process thoát liên tục; `GPU process isn't usable. Goodbye.`; không có screenshot hoặc DOM |
| Chrome headless lần 2, GPU trong process | 1440 × 1000 | `Failed to create shared context for virtualization`; không hoàn tất, không có screenshot/DOM; đã dừng process khảo sát riêng |
| Chrome headless responsive attempt | 375 × 812 | Cùng lỗi shared context; không hoàn tất, không có screenshot/DOM; đã dừng process khảo sát riêng |

Các kích thước trên là tham số yêu cầu, chưa đo được viewport render. Lần 375 px chưa phải emulation thiết bị mobile/touch. Không có screenshot trang gốc để đối chiếu, không claim đã quan sát header/hero/grid/mobile, đo màu/font/spacing hoặc tái tạo chính xác. Không dùng ảnh trống hay ảnh lỗi làm screenshot UI tham khảo.

Lệnh cơ sở đã thử: Chrome executable tại `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--headless --disable-gpu --no-first-run --no-default-browser-check --window-size=<width,height> --timeout=20000 --screenshot=<docs/evidence/T00/...png> --dump-dom https://sharethemeal.org/fr`. Lần 2 thêm `--disable-software-rasterizer --in-process-gpu` và timeout yêu cầu 15000. Profile khảo sát nằm trong TEMP, tách khỏi profile người dùng; không đưa vào repo. Sau khi không hoàn tất, chỉ dừng hai PID Chrome do khảo sát tạo (18176, 26780), không đóng trình duyệt người dùng.

UI trong ui-reference.md là đề xuất riêng cho mẫu dự án, chưa đo từ nguồn. Khi có truy cập trình duyệt hoặc ảnh chủ dự án cung cấp, bổ sung bằng chứng và đối chiếu tại R01; không chặn cấu trúc/data/T01 vì thiếu ảnh.

## Orca / Antigravity

- Đã đọc skill `C:/Users/tuana/.agents/skills/orca-cli/SKILL.md`; biến ORCA_CLI_COMMAND và ORCA_DEV_REPO_ROOT không được đặt. Theo skill, executable chọn là `orca`.
- Lệnh discovery phiên bản: `orca skills get orca-cli --json`.
- Lỗi nguyên văn chính: `orca : The term 'orca' is not recognized as the name of a cmdlet, function, script file, or operable program.`; `FullyQualifiedErrorId : CommandNotFoundException`.
- Theo skill, dừng ở executable đó; không đoán đường dẫn bản khác/provider/lệnh launch. Không tải được hướng dẫn theo phiên bản, không xác minh kênh/provider hoặc worker cũ. Chưa gửi, chưa launch và chưa nhận xác nhận task.
- Có tool worker khác được liệt kê trong phiên, nhưng không phải kênh Orca đã xác minh; không sử dụng để lách quy tắc dự án. Không khởi chạy agent thứ ba.

Fallback: chủ dự án chuyển nguyên văn docs/task-specs/T01.md kèm tài liệu hiện tại đến Antigravity hiện có. Chờ báo cáo xác nhận/bàn giao; không coi file task là bằng chứng đã nhận.

## Kiểm tra lại theo yêu cầu chủ dự án — 02/10/2026

- `orca skills get orca-cli --json` vẫn trả CommandNotFoundException; hai biến chỉ định executable vẫn không có. Chưa có kênh Orca được xác minh.
- Công cụ web mở ShareTheMeal /fr vẫn trả `403 Forbidden`. Không có bằng chứng thị giác mới; lần này chưa chạy lại Chrome, không thay đổi kết luận chưa đo UI nguồn.
- Đã phát hiện các tool đọc trạng thái của kênh **Antigravity MCP / gemini_worker** và kiểm tra chỉ đọc, không dispatch agent:
  - `list_active_jobs({limit:10})`: `No jobs recorded yet.`
  - `list_available_models({})`: phản hồi 14 model, bao gồm Gemini 3.1 Pro, Gemini 3.6/3.7/3.8 Flash, Claude Opus/Sonnet 4.6 và GPT-OSS 120B, với các mức được trả về.
- Đây là bằng chứng kênh MCP phản hồi và có catalog model; không chứng minh Orca hoạt động, không chứng minh mọi worker bên ngoài đều rảnh hoặc một phiên cụ thể đã nhận T01. Không có job được tạo, task chưa gửi, chưa ACK.
- Đã hỏi chủ dự án có cho phép dùng Antigravity MCP thay kênh Orca hay giữ chuyển thủ công. Trong lúc chưa có câu trả lời, giữ quy tắc AGENTS.md và T01 READY_TO_FORWARD. Không dùng model catalog như bằng chứng code/build/preview.
