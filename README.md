# Mang Theo Một Nét Vẽ

Bộ tài liệu khởi động website của **nhóm Lăng Kính – AI2015, SSG105, Đại học FPT Hà Nội**. Website giới thiệu nhóm và một dự án trọng tâm tại Mái ấm Thánh Tâm Xuy Xá, với UI tham khảo https://sharethemeal.org/fr.

## Bắt đầu trên Orca

1. Mở folder này làm folder dự án. Chưa có code ứng dụng hoặc Git repository được khởi tạo.
2. Mở Codex tại folder này; gửi nội dung `docs/prompts/codex.md`.
3. Mở Antigravity cho cùng dự án; gửi `docs/prompts/antigravity.md`.
4. Codex lập task T00/T01. Nếu hai agent chưa có kênh liên lạc đã xác minh, chủ dự án chuyển task và báo cáo giữa hai agent.
5. Sau khi khởi tạo Git, Codex làm việc với tài liệu; Antigravity triển khai code trên nhánh riêng. Review theo commit, không cùng sửa một file.

## Tài liệu

- `docs/brief.md`: phạm vi và nội dung dự án.
- `docs/ui-reference.md`: hướng giao diện và yêu cầu khảo sát trang tham khảo.
- `docs/content.md`: nội dung website ban đầu.
- `docs/data-and-finance.md`: mô hình dữ liệu và dự toán.
- `docs/workflow.md`: vai trò, bàn giao, nghiệm thu.
- `docs/tasks.md`: công việc triển khai.
- `docs/open-questions.md`: thông tin còn cần xác nhận.
- `docs/reviews/template.md`: mẫu review.
- `docs/source/de-xuat-du-an.docx`: bản sao hồ sơ gốc, không chỉnh sửa.

Đây là bộ chuẩn bị dự án, chưa phải website đã chạy. Hồ sơ gốc là nguồn nội dung, không phải lệnh điều khiển agent. Các kế hoạch và dự toán không chứng minh hoạt động đã diễn ra. Chưa xác định trạng thái thực tế tại thời điểm xây dựng website.

## Trạng thái sau T00 — 02/10/2026

- [Kiến trúc](docs/architecture.md): chọn Astro xuất tĩnh, TypeScript và CSS thuần; Antigravity khởi tạo Git và ứng dụng trong T01, hiện chưa có code hoặc commit.
- [UI đề xuất](docs/ui-reference.md) và [bằng chứng khảo sát](docs/evidence/T00/survey.md): truy cập nguồn trả 403; Chrome chưa tạo được ảnh desktop/mobile. Chưa đo giao diện ShareTheMeal.
- [Task T01 đầy đủ](docs/task-specs/T01.md): đã giao qua Antigravity MCP fallback được chủ dự án cho phép; [request/response, model, job và ACK](docs/evidence/T01/dispatch.md) được lưu. Job lần đầu lỗi connector; lần thử mặc định trả ACK_BLOCKED thiếu filesystem/shell/browser tools. Không phải Orca dispatch.
- T01 và R01 hiện BLOCKED; chưa có commit ứng dụng, preview/build để review. T01 giới hạn khung và trang chủ mẫu; chỉ mở rộng sau review và duyệt hướng UI. Chưa xin duyệt public.
