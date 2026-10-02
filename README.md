# Mang Theo Một Nét Vẽ

Mã nguồn: [tuananh-rd/mang-theo-mot-net-ve](https://github.com/tuananh-rd/mang-theo-mot-net-ve) — repository private. Lưu code trên GitHub không thay mốc duyệt hướng UI hoặc duyệt phát hành website.

**T02 DONE; R02 PASS** tại app SHA `a317d85`, sau khi chủ dự án duyệt hướng UI đã sửa theo [Claude](reports/ui-review-claude.md). Ba trang Dự án, Về nhóm và Sản phẩm đã hoàn chỉnh trong phạm vi preview. [Review T02](docs/reviews/R02-a317d85.md), [đặc tả](docs/task-specs/T02.md), [bàn giao hiện tại](reports/resume-brain.md). Minh bạch và Đồng hành còn là shell cho T03; chưa public website.

Bộ tài liệu khởi động website của **nhóm Lăng Kính – AI2015, SSG105, Đại học FPT Hà Nội**. Website giới thiệu nhóm và một dự án trọng tâm tại Mái ấm Thánh Tâm Xuy Xá, với UI tham khảo https://sharethemeal.org/fr.

## Chạy bản xem trước trên Windows

Trong thư mục dự án, dừng preview/dev đang chạy trước khi cài lại dependency (Windows có thể khóa compiler native), rồi chạy lần lượt:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4321
```

Mở `http://127.0.0.1:4321/`. Preview chỉ bind loopback, mọi trang có noindex/nofollow. Trang chủ, Dự án, Về nhóm và Sản phẩm đã có nội dung; Minh bạch và Đồng hành còn là shell. Dừng server bằng Ctrl+C ở terminal giữ server. `npm.cmd run dev -- --host 127.0.0.1` dùng khi worker phát triển; review dùng bản build. Không serve gốc repository hoặc share public từ bước này.

Ứng dụng dùng Astro static, TypeScript strict và CSS thuần. Nội dung chọn lọc nằm ở `src/data/campaign.ts`; cập nhật theo task của Antigravity, giữ giá tham khảo/planned tách actual và unknown=null. Chỉ thêm ảnh public sau khi xác nhận quyền; giữ hồ sơ gốc, chứng từ thô và evidence review ngoài public/dist. Hosting/deploy chưa được chọn hoặc thực hiện.

Bảng số lượng sản phẩm hiện là bản kế hoạch tĩnh: khi đổi giá hoặc số lượng đề xuất, Antigravity cần giữ dữ liệu typed, bảng desktop/tablet và thẻ mobile trong `src/pages/san-pham.astro` nhất quán. Chưa có tồn kho hoặc trạng thái mở bán được xác nhận.

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

Tại thời điểm chuẩn bị T00 chưa có website chạy; trạng thái hiện tại ở đầu README. Hồ sơ gốc là nguồn nội dung, không phải lệnh điều khiển agent. Các kế hoạch và dự toán không chứng minh hoạt động đã diễn ra. Chưa xác định trạng thái thực tế của dự án tại thời điểm xây dựng website.

## Trạng thái sau T00 — lịch sử phiên trước, 02/10/2026

- [Kiến trúc](docs/architecture.md): chọn Astro xuất tĩnh, TypeScript và CSS thuần; Antigravity khởi tạo Git và ứng dụng trong T01, hiện chưa có code hoặc commit.
- [UI đề xuất](docs/ui-reference.md) và [bằng chứng khảo sát](docs/evidence/T00/survey.md): truy cập nguồn trả 403; Chrome chưa tạo được ảnh desktop/mobile. Chưa đo giao diện ShareTheMeal.
- [Task T01 đầy đủ](docs/task-specs/T01.md): đã giao qua Antigravity MCP fallback được chủ dự án cho phép; [request/response, model, job và ACK](docs/evidence/T01/dispatch.md) được lưu. Job lần đầu lỗi connector; lần thử mặc định trả ACK_BLOCKED thiếu filesystem/shell/browser tools. Không phải Orca dispatch.
- T01 và R01 hiện BLOCKED; chưa có commit ứng dụng, preview/build để review. T01 giới hạn khung và trang chủ mẫu; chỉ mở rộng sau review và duyệt hướng UI. Chưa xin duyệt public.
