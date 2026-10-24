# P1 production release — báo cáo phát hành (Claude, người vận hành phát hành duy nhất)

Task `task_3db3106c86a5` / dispatch `ctx_aff92fc7b3ae`. Chủ dự án đã cho phép phát hành; Codex rà soát nội bộ trước khi ghi (preflight được chấp thuận kèm điều kiện, đã làm đủ). Báo cáo đã loại bỏ thông tin bí mật và dữ liệu khách; bản sao lưu chứa đơn nằm NGOÀI Git.

## Phạm vi đã phát hành (giao diện cũ, năm thay đổi P1)
Ba chuỗi “Tổng quan kế hoạch / Thành viên nhóm Lăng Kính / Mỗi em được tự do chọn lựa và vui chơi”; bỏ chú thích hero (giữ `alt`); chặng 2 “CHẶNG 2 — Gây quỹ”; ảnh móc khóa của chủ dự án dùng chung ở danh mục, chi tiết, biểu mẫu; số điện thoại bắt buộc ở biểu mẫu và API. Không đổi thiết kế/màu/phụ thuộc, tài chính, liên hệ, quyền, đơn hàng.

## Biên nhận (receipts)
| Hạng mục | Trước | Sau |
| --- | --- | --- |
| Git `origin/main` | `c200813` | `cb7dc0b` (fast-forward; ứng dụng đã duyệt `d87e57c`; thêm `docs/media-registry-products.json`) |
| Pages `mang-theo-mot-net-ve` (production) | `5f1b61b9` @c200813 | **`130b5b67`** @cb7dc0b (Active) |
| Worker `mang-theo-mot-net-ve-preorder-api` | `03dd63c9` | **`29fe7433-3d76-49a5-8a7e-bc3ac391f5f0`** (từ `63c45f7`; route `mangtheomotnetve.website/api/preorders*`) |
| Worker Studio `mang-theo-mot-net-ve-studio-prod` | `d5b3f648` | **không triển khai lại** (cấu hình production có CF_ACCESS_* giữ chỗ trong mã; tránh ghi đè) |
| D1 `studio-d1-prod` | 21 revisions · 2 publications · 22 media · 25 audit · 2 orders | 24 revisions · 4 publications · 23 media · 34 audit · **2 orders (không đổi)** |
| R2 `studio-media-prod` | không có ảnh móc khóa | `media/asset-moc-khoa-mau-chu-du-an` (sha256 `bcd18df918f976e6ec805351399712e544204d5214e677532bdf69e05f91a2d1`, 25.214 B, đã tải xuống kiểm hash) |

Cấu hình Worker preorder được giữ nguyên: `wrangler deploy --dry-run` cho thấy bindings/vars trùng bản đang chạy (DB, EMAIL, `PREORDER_MAIL_FROM/NOTIFY_TO/REPLY_TO` rỗng như live, `PREORDER_TEST_MODE=false`, `PRODUCTION_SITE_ORIGIN`); secret `RATE_LIMIT_SALT` giữ nguyên. Không dùng giá trị giữ chỗ để ghi đè môi trường.

## Dữ liệu D1 (phạm vi hẹp, dùng quy trình revision/hash)
Sao lưu trước khi ghi: `studio-d1-prod-pre-p1.sql` (223.121 B, sha256 `00cc37cdbac288b6305e80c0890dba38dc6d4e176d317bb0b40227070b05c869`), lưu ngoài Git ở thư mục riêng tư. Ghi bằng gói SQL tạo từ cùng hàm băm (`calculateDataHash`) của Studio, bảo vệ CAS theo hash bản nháp, ghi `revisions` + `drafts` + `audit_logs` với tác nhân `claude-release@internal`, đã kiểm thử trước trên emulator nạp bản sao lưu (`docs/evidence/P1-release/worker/plan-d1*.mjs` ở checkout API).
- **project v7** (từ v6 do chủ dự án sửa 23/10): chỉ đổi `statusNotice` → `CHẶNG 2 — Gây quỹ` và `progress.currentStageIndex` 2 → 1; giữ tuần 2/5, `updatedAt` 2026-10-23 của D1, lịch 31/10 và 07/11, liên hệ. Hash `d3701007c713…` → `e275667990c41f78…` (đầy đủ trong `p1-release-d1-plan.json`).
- **products v3 → v4**: chỉ đổi `moc-khoa.mediaKey`. v3 dùng khóa trần `media/images/…webp`; **review phát hiện UI Studio chọn ảnh theo `'/' + r2_key` nên khóa trần không khớp lựa chọn và lần lưu kế tiếp sẽ xóa ảnh**. Sửa không cần triển khai lại Studio: đặt `r2_key = media/<id>` (không đuôi) và `mediaKey = /media/asset-moc-khoa-mau-chu-du-an` — khớp đồng thời giá trị lựa chọn của UI (`'/' + r2_key`) và khóa được duyệt của yêu cầu xuất bản (`/media/<id>`). Hash `1d719cbc3cda…` → `4d8c5610…` (v3) → `c2314a1a1adf456c…` (v4). R2 đã tải khóa mới và xóa đối tượng cũ do tôi tạo; D1 `media_assets` giữ `approved`, `is_illustration=0`, alt/caption trung thực.
- **Bằng chứng UI Studio thật** (mã Studio chế độ dev cục bộ, dữ liệu = production sau bản vá): ô chọn ảnh móc khóa hiển thị đúng `/media/asset-moc-khoa-mau-chu-du-an` (có lựa chọn khớp), bấm lưu không đổi gì ⇒ `mediaKey` giữ nguyên, giá 40.000/10.000 và ảnh chuồn chuồn không đổi (`studio-roundtrip.json`). **Chưa có bằng chứng trên Studio production** (cần Cloudflare Access).
- **publications**: `pub-1792772841370-mjt6` (pending_review cũ) và bản pending_review đầu tiên của tôi đã chuyển `draft` bằng ngữ nghĩa REJECT_PUBLICATION với lý do “superseded”, snapshot cũ nguyên vẹn; tạo `pub-1792851097528-p1r2` **pending_review** (snapshot sha256 `6a42b9ad32c3…`, hợp lệ theo bộ xác thực/khóa được duyệt của router). Không duyệt, không công bố; site công khai chưa có bộ tiêu thụ snapshot (`/_meta/snapshot-status.json` = 404).
- Không đụng tài chính, liên hệ, người dùng/quyền, đơn hàng (2 đơn, không đọc nội dung) hay lịch sử đơn.

## Kiểm chứng trực tiếp (production)
- Artifact: không có `<meta name="robots">`, không `X-Robots-Tag`, không `noindex`; không phụ thuộc máy chủ xem trước 4383 hay fixture 4331.
- Chữ/hero/chặng: `Tổng quan kế hoạch`, `Thành viên nhóm Lăng Kính`, `Mỗi em được tự do chọn lựa và vui chơi` có mặt; hộp chú thích hero vắng, `alt` còn; chip trạng thái Trang chủ, trang Dự án và chân trang đều `CHẶNG 2 — Gây quỹ`, thanh tiến độ “Chặng 02: Gây quỹ (Đang thực hiện)”, tuần 2/5, “cập nhật 12/10/2026”; không còn nhãn cũ.
- Ảnh móc khóa: tệp live `/images/san-pham/moc-khoa-mau-chu-du-an.webp` HTTP 200, sha256 khớp; thẻ danh mục render 333×420 (`contain`), trang chi tiết 333×444 (375) và 637×560 (1440), nằm trong khung; biểu mẫu `?sanpham=moc-khoa` chọn móc khóa và hiện ảnh xem trước.
- Biểu mẫu: nhãn “Số điện thoại” bắt buộc; gửi trống và số sai bị chặn ở máy khách với thông báo tiếng Việt, **0 yêu cầu POST** (`live-verification.json`). Không gửi đơn thật.
- API thật, probe an toàn không tạo đơn: thiếu `phone` **và** `pickup` rỗng trong cùng yêu cầu, email `.invalid`, có đồng ý → `HTTP 400 {"success":false,"error":"Vui lòng nhập số điện thoại để nhóm liên hệ xác nhận đơn."}`; số đơn D1 vẫn 2 trước/sau.
- Bất biến: mục tiêu 7.000.000đ, giá 40.000/10.000, người nhận/QR, mở đặt trước (cấu hình công khai trả hai sản phẩm), bảo vệ C21 không đổi; 27 trang × 375/768/1440: một H1, không tràn ngang/cắt chữ, tương phản ≥4.5:1; menu mở/Escape đóng; mọi tuyến 200.
- Ảnh chụp: `docs/evidence/P1-release/worker/after/` (375/768/1440; Trang chủ, Dự án, Quà, móc khóa, biểu mẫu).

## Lệnh/kết quả
Public: `npm run check` 0 lỗi, `npm test` 101/101, `npm run build` exit 0 (trước khi đẩy); bằng chứng P1 tái dùng cho mã không đổi (`d87e57c`). API: `studio:test` 98/98, `npm test` 101/101 (báo cáo P1-API). Đẩy: `git push origin HEAD:refs/heads/main` (FF, không force); Worker: `wrangler deploy --config wrangler.preorder.toml`; D1: `wrangler d1 execute --remote --file` (hai gói SQL có CAS); R2: `wrangler r2 object put/get/delete`.

## Hạn chế và việc còn lại
- Studio production **không được triển khai lại**; lỗi chung của Studio (khóa chọn ảnh `'/'+r2_key` so với khóa duyệt r2 trần/`/media/<id>`; ảnh tải qua UI có `r2_key = media/<id>.<ext>` sẽ bị lệch) vẫn còn — đề xuất sửa riêng ở router `approvedKeys` và triển khai Studio với cấu hình production được giữ nguyên.
- Chặng trong D1 (project v7) đã đồng bộ nhưng **chưa công bố**; ai duyệt `pub-…-p1r2` mới tạo bản công khai từ snapshot. Public chưa có bộ tiêu thụ nên không có thay đổi hiển thị nào từ D1.
- Bằng chứng chỉ ở phía public/API và UI cục bộ; không thể mở Studio production (Access). Không có số liệu CWV/Lighthouse/AA từ phát hành này.
- Xóa đối tượng R2 cũ do chính tôi tạo (không còn tham chiếu). Bản sao lưu D1 giữ ngoài Git theo yêu cầu riêng tư.
