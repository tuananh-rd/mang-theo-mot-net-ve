# P1-API — Số điện thoại bắt buộc cho đơn mới và mặc định chặng 2 (backend cô lập)

Checkout `.../public-phone-api`, nhánh `tuananh-rd/public-phone-api`, nền C23 `fd79daa`, SHA code `63c45f7aa93ab9555a2c732d8c7d0bf75c180ebe`, SHA bằng chứng `c90cb8919b478d5dfe7b4cdf29950e3a6b2c6400`. Task `task_dda3c1fd9763` / `ctx_a9bf520a2a7d`. Không merge vào/không copy sang public; không deploy; không D1/R2/email thật.

## Thay đổi (tệp)
- `apps/studio/src/preorders/service.ts`: thêm `normalizePreorderPhone()` (quy tắc chung với biểu mẫu công khai) và **bắt buộc** trường `phone` (chuỗi) cho đơn mới. Thiếu, `null`, rỗng, khoảng trắng, không phải chuỗi (số/mảng/object), chỉ ký tự phân cách, ký tự cấm, quá ngắn/dài → `400` tiếng Việt (“Vui lòng nhập số điện thoại…” / “Số điện thoại chưa hợp lệ. Ví dụ: 0984 441 726 hoặc +84 984 441 726.”) **trước** khi tra idempotency/ghi D1/gửi email/đếm giới hạn. **Không còn** suy số từ `contactType='phone'`+`contact` (đã bỏ theo hướng dẫn review): thiếu/null `phone` bị từ chối kể cả khi `contact` là số. Số lưu dạng chuẩn hóa (`0984441726`, `+84984441726`). Email vẫn bắt buộc; giá do máy chủ; idempotency/rate limit/pickup/honeypot không đổi.
- `apps/studio/src/schemas/index.ts`, `apps/studio/src/ui/html.ts` (giá trị dự phòng) và `src/data/campaign.ts` (BASELINE dùng bởi test chống lệch): `statusNotice` = `CHẶNG 2 — Gây quỹ`, `currentStageIndex` = `1`; không đổi tuần/ngày/số tiền. Bắt buộc đổi cả BASELINE vì `drift-prevention.test.mjs` yêu cầu mặc định Studio khớp nguồn site.
- `apps/studio/tests/preorder-phone.test.mjs` (mới, 5 test): vector chuẩn hóa; 12 ca bị từ chối (không lưu đơn, không gửi email); định dạng hợp lệ được chuẩn hóa, email vẫn bắt buộc, giá máy chủ (client `price:1` bị bỏ qua), **`contactType='phone'` + `contact` không thay được `phone`** (thiếu và null đều 400); thử lại hợp lệ idempotent, yêu cầu bị từ chối không tạo đơn, giới hạn tốc độ vẫn áp dụng (8 đơn rồi 429); đơn lịch sử `customer_phone` NULL (kể cả không có dòng email_state) vẫn liệt kê/chi tiết/đổi trạng thái/xuất CSV/gửi lại email (“Không cung cấp”) và **không bị backfill**. Không migration mới; schema giữ `customer_phone` nullable.

## Lệnh và kết quả
`npm ci` (gốc và `apps/studio`) 0; `npm run studio:typecheck` exit 0; `npm run studio:build` exit 0; `npm run build` (Astro, site C23) exit 0; `astro build --config astro.preview.config.mjs` (tạo `dist-preview`, cần cho test workerd) exit 0; `npm run studio:test` **98/98** exit 0 (log `studio-test-3.log`; hai lần đầu có 2 test workerd lỗi vì chưa có `dist-preview`, và 1 test drift lỗi cho tới khi đồng bộ BASELINE — `studio-test.log`, `studio-test-2.log`); `npm test` gốc 101/101 exit 0; `npm run check` 0 lỗi. Tiến trình `workerd/esbuild` treo của lần chạy đầu do tôi chạy đã được dừng.
Fixture HTTP cục bộ (`local-preorder-fixture.mjs`, cổng 4331, không email): POST thiếu phone, `phone:null`, chỉ `contactType/contact` → 400; `abc` → 400; `+84 984 441 726` → 201, `unitPrice` 10.000 từ cấu hình; biểu mẫu công khai (4383) → 201 với số `0984 441 726`.

## Ánh xạ trường và đồng bộ sau này
`project.statusNotice`, `project.progress.currentStageIndex` được `publish/adapter.ts` chép vào snapshot; vá mặc định **không** đổi D1 hiện có. Khi chủ dự án duyệt: đặt hai trường trên (giữ `currentWeek`, `totalWeeks`, `updatedAt`), tạo revision, công bố lại snapshot qua quy trình băm/xác thực hiện có (không bỏ qua kiểm tra toàn vẹn, không đặt thời điểm giả). Ảnh móc khóa: chỉ cần tải WebP lên R2 + duyệt `mediaKey` (không làm ở đây).

## Cần triển khai độc lập
Worker/Studio từ nhánh này (đóng gói hiện có), sau khi chủ dự án duyệt; trước đó API đang chạy (nếu có) vẫn nhận đơn không số. Mã nguồn không chứng minh trạng thái triển khai. Không có tác động production từ công việc này.

## Hạn chế
Test chạy trên emulator D1 cục bộ, không D1/Workers thật; không kiểm bản Worker đang chạy; chưa có migration NOT NULL (cố ý, để lịch sử đọc được).
