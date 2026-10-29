# L4 — cập nhật sao kê 26–29/10/2026 lên sổ ủng hộ công khai (Claude, người triển khai duy nhất)

Báo cáo đã loại tên người gửi bị ẩn, mã bút toán, số điện thoại/tài khoản, mô tả giao dịch và tệp thô. Tệp Excel gốc, bản sao lưu D1, gói SQL (có tên) và bản đồ dòng nằm NGOÀI Git (`Documents/Codex/2026-10-29/L4-ledger-private/`). Không sửa UI; chỉ đổi dữ liệu công khai + test.

## Nguồn và phạm vi
- Sao kê Techcombank xuất 29/10/2026 10:59, kỳ 31/08–29/10/2026, 51.446 byte, mở read-only (không ghi đè, không sao chép vào repo). 55 dòng giao dịch, mã bút toán không trùng; số dư chạy liên tục 55/55 dòng, số dư cuối kỳ khớp.
- Phạm vi cập nhật: ngày giao dịch 26/10–29/10/2026 gồm: 26/10 ×11, 28/10 ×21; **27/10 và 29/10: 0 giao dịch** (ngày giao dịch = ngày làm việc kế tiếp; sao kê in lúc 10:59 ngày 29/10). Không điền 0đ cho ngày thiếu; UI ghi phạm vi `13/10–29/10`.
- Không có khoản ghi nợ nào trong 26–29/10 (tổng nợ cả kỳ = 50.000đ ngày 13/10, ngoài phạm vi, không đổi).

## Kết quả
| Hạng mục | Số liệu |
| --- | --- |
| Dòng trong phạm vi | 32 khoản ghi có, 0 ghi nợ |
| Thêm vào sổ công khai | **31 khoản, 1.027.615đ** (26/10: 10 khoản; 28/10: 21 khoản) |
| Chờ xác nhận (staging riêng tư, KHÔNG công bố, không tính vào tổng) | **1 khoản 150.000đ** ngày 26/10: người gửi trùng tên chủ tài khoản nhận → chưa đủ bằng chứng là ủng hộ (có thể là tự nạp tiền) |
| Trùng loại bỏ | 0 (ngày mới đều sau 23/10; mã bút toán không trùng; khóa nội bộ mới không trùng khóa cũ) |
| Tổng trước / sau | 1.011.222đ (21 khoản) → **2.038.837đ (52 khoản)**, tiến độ 14,4% → **29,1%** của mục tiêu 7.000.000đ |
| Khoản có tên hiển thị / Ẩn danh | 8 / 23 |

Quy tắc tên: chỉ hiển thị khi cột "Đối tác" của ngân hàng là cá nhân và khớp mô tả; tên chỉ có trong phần mô tả (chuyển liên ngân hàng, MoMo, ZaloPay, QR) → **Ẩn danh**, không suy tên từ mô tả. Chủ dự án có thể cho phép từng tên sau; việc đó là cập nhật riêng.

Ghi chú đối chiếu trước 26/10 (chỉ báo, không sửa): tổng ghi có từ 13–23/10 trên sao kê là 1.061.222đ (và 1 khoản nợ 50.000đ), trong khi sổ công khai cũ là 1.011.222đ; chênh 50.000đ là một khoản ghi có 13/10 chưa nằm trong sổ công khai (liên quan quyết định trước đó về dòng đã xóa). Chưa xác định; chờ chủ dự án.

## Không phải đối soát đầy đủ
`reconciled=false`, `entries=[]`, không số dư/chi/tổng cả tài khoản. Số dư ngân hàng ≠ tổng ủng hộ; ghi nợ ≠ chi phí dự kiến. Mục tiêu 7.000.000đ, giá 40.000/10.000đ, QR/tài khoản, đặt trước, Stage 2 không đổi.

## D1 / Studio
Sao lưu ngay trước ghi sha256 `0877c269b14082895f60235a28bfd79bf47429e0b79244318159c06323c79c09` (trùng bản sau-L3 → không đổi giữa chừng). Gói SQL CAS 7 câu lệnh `wrangler d1 execute --remote` exit 0 (cùng hình dạng L3). Finance v8 `387b542c…6633` → v9 `2d133a0b…5f35`; revisions/publications/audit 27/7/43 → 28/8/46; media 23 và preorders 2 không đổi; 4 module khác giữ nguyên hash. Đọc lại sau ghi: 52 khoản / 2.038.837đ / không khóa trùng / giống byte-for-byte dữ liệu công khai của repo. Publication L3 `pending_review` được chuyển về draft (thay thế); publication mới `…-l4r1` **pending_review** (snapshot sha256 `44091e8f…ac288`, đã quét không có khóa nội bộ/mã bút toán). Không duyệt/công bố/giả chữ ký Studio; trang công khai vẫn tĩnh nên số liệu công khai đến từ commit.

## Kiểm thử
`npm test` exit 0 (139/139); `npm run check` exit 0 (0 lỗi/0 cảnh báo); `npm run build` exit 0 (13 trang). Quét gói `dist`: 0 mã bút toán, 0 "MoMo/ZaloPay/MBVCB/chuyen tien", 0 số điện thoại, 0 tên bị ẩn/khoản chờ xác nhận. Các trang hiển thị 2.038.837đ, 29,1%, 52 dòng.

## Hạn chế
Đây không phải đối soát hai người; chưa chụp ảnh responsive; Studio production chưa kiểm bằng đăng nhập Access (kiểm bằng đọc lại D1). 150.000đ chờ xác nhận; 27/10 và 29/10 chưa có giao dịch tại thời điểm in sao kê.
