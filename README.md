# Mang Theo Một Nét Vẽ

Cập nhật 03/10/2026: **C02 DONE; RC02 PASS cho preview local** tại app `221eafa73661cb822b3f8017b7fe1bf367106349`, baseline `5cdc624`, nhánh `task/c02-images-content`. Đã bổ sung A01–A05 có nhãn minh họa, đồng bộ nội dung và ghi rõ khoản chênh đồ ăn 550.000đ cần xác nhận. Check, 24 tests và build đạt; đủ sáu trang đã xem ở 375/768/1440px, menu/FAQ/link/ảnh/bundle đã kiểm. Preview hiện tại: http://127.0.0.1:4322/ — loopback PID 25960. Worker HOLD; không T05 hoặc deploy public.

[Review C02](docs/reviews/RC02-221eafa.md) · [Thông tin và ảnh cần nhóm gửi](docs/group-content-request.md). Các mốc bên dưới là lịch sử; dùng URL/commit hiện tại ở trên.


Cập nhật03/10/2026: **C01-UI DONE; RC01-UI PASS** tại app96f539772b78d70324adb95a11508d27163cd3ad (basea4e0aa8), sửa M1/M2 vàL1–L7 theo Claude; L8 giữ ảnh gốc chờ chủ dự án. Preview mới http://127.0.0.1:4322/ (loopbackPID25960), thay thông tin4321/PID2888 lịch sử phía dưới. Minh bạch375 giảm18%; check/18tests/build0,38targeted+20navigation+6finance+38bundle và19servedhash đạt. Review: docs/reviews/RC01-ui-96f5397.md. Worker HOLD, không T05/public.


## C01 cập nhật materials — 03/10/2026

Đã đưa hồ sơ PDF mới và logo Lăng Kính vào preview: chuồn chuồn, móc khóa và thực đơn gây quỹ; dự toán19khoản4.935.000đ. **C01 DONE; RC01 PASS** tại app ead94a482e590cf1c5ef4eb1e0829c99e30d378c, nhánh task/c01-materials. [Review](docs/reviews/RC01-ead94a4.md), [nguồn mới](docs/materials-intake.md). Độc lập655browser/18tests/check/build đạt,13ảnh đã xem,17HTTPbody khớpdist. Preview http://127.0.0.1:4321/; actual/contact còn chưa xác nhận, noindex/nofollow, chưa public. Các mốc T04 dưới đây là lịch sử.

Mã nguồn: [tuananh-rd/mang-theo-mot-net-ve](https://github.com/tuananh-rd/mang-theo-mot-net-ve) — repository private. Lưu code trên GitHub không thay mốc duyệt hướng UI hoặc duyệt phát hành website.

**T04 DONE; R04 PASS** tại app SHA `fad117c7e12a80775b0dbd0ad93ff464db60fcb9`. Sáu trang và 404 đã được kiểm tổng thể, title không lặp, giá/số lượng và dự toán home dùng cùng nguồn dữ liệu. Check,16tests,build và410browser assertions độc lập đạt;21full-page đã xem. [Review cuối](docs/reviews/R04-fad117c.md), [đặc tả](docs/task-specs/T04.md), [vận hành](docs/operations.md), [bàn giao hiện tại](reports/resume-brain.md). Giữ hướng UI đã duyệt sau sửa [Claude](reports/ui-review-claude.md); website chưa public, T05 chờ chủ dự án xác nhận nội dung và duyệt phát hành.

Bộ tài liệu khởi động website của **nhóm Lăng Kính – AI2015, SSG105, Đại học FPT Hà Nội**. Website giới thiệu nhóm và một dự án trọng tâm tại Mái ấm Thánh Tâm Xuy Xá, với UI tham khảo https://sharethemeal.org/fr.

## Chạy bản xem trước trên Windows

Trong thư mục dự án, dừng preview/dev đang chạy trước khi cài lại dependency (Windows có thể khóa compiler native), rồi chạy lần lượt:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4322
```

Mở `http://127.0.0.1:4321/`. Preview chỉ bind loopback, mọi trang có noindex/nofollow. Sáu route và 404 hoạt động; thông tin liên hệ, nhu cầu và actual chưa xác nhận nên chưa bật nhận đơn/tiền. Dừng server bằng Ctrl+C ở terminal giữ server. `npm.cmd run dev -- --host 127.0.0.1` dùng khi worker phát triển; review dùng bản build. Không serve gốc repository hoặc share public từ bước này.

Ứng dụng dùng Astro static, TypeScript strict và CSS thuần. Nội dung chọn lọc nằm ở `src/data/campaign.ts`; cập nhật theo task của Antigravity, giữ giá tham khảo/planned tách actual và unknown=null. Chỉ thêm ảnh public sau khi xác nhận quyền; giữ hồ sơ gốc, chứng từ thô và evidence review ngoài public/dist. Hosting/deploy chưa được chọn hoặc thực hiện.

Card, bảng desktop/tablet và thẻ mobile lấy giá/số lượng trực tiếp từ PRODUCTS qua helpers `formatProductPrice`/`formatProductQuantity`. Tiền tố “Tối đa” không lặp số kế hoạch. Home và Minh bạch cùng tính chi/doanh thu từ data; unknown không đổi thành0. Chưa có tồn kho hoặc trạng thái mở bán được xác nhận. Khi cập nhật dữ liệu, kiểm lại copy/FAQ/kịch bản có con số theo [hướng dẫn vận hành](docs/operations.md).

Minh bạch dùng `PLANNED_EXPENSES`, `FINANCE_SCENARIOS` và helper `src/lib/finance.ts`, render table/mobile từ cùng data; doanh thu lấy giá×số lượng PRODUCTS. `ACTUAL_FINANCE` tách khỏi kế hoạch, `OFFICIAL_CONTACT` hiện null/unconfirmed. Cập nhật dữ liệu đã được phép theo task worker, đồng bộ overview trang chủ nếu bổ sung actual; chưa tự bật kênh tiếp nhận. Kiểm logic tài chính bằng `node --test tests/finance.test.mjs`.

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

