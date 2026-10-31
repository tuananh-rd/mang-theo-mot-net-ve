# L5 — cập nhật sổ ủng hộ theo bảng tính update_saoke_1 (Claude, người triển khai duy nhất)

Báo cáo đã loại tên bị ẩn, mã tham chiếu, số điện thoại/tài khoản, mô tả giao dịch và tệp thô. Nguồn, bản sao lưu, gói SQL và bản đồ dòng nằm NGOÀI Git (`Documents/Codex/2026-11-01/L5-ledger-private/`). Không sửa UI.

## Nguồn
- `update_saoke_1.xlsx` 17.256 byte, sha256 `AEE39E15…FC8F` (băm hai lần, ổn định), mở read-only sau khi hết khóa; 1 sheet, không công thức. Cột thật: ngày (A), đối tác (F), ngân hàng đối tác (K), diễn giải (Q), số tiền ghi có (AA). **Không có** mã bút toán, giờ, số dư, tiền ra → không có đối soát số dư; khử trùng theo ngày + số tiền + mô tả chuẩn hóa (băm, riêng tư).
- 32 dòng ghi có (26/10 ×11, 28/10 ×21; không có 27/10), tổng 1.177.615đ. Nội dung trùng từng dòng (ngày/số tiền/mô tả) với phạm vi 26–28/10 của bản sao kê cũ dùng ở L4 đã hoàn tác; theo chỉ thị mới nhất của chủ dự án vẫn áp dụng, nhưng bảng tính mới là nguồn. Không dùng lại tệp Excel cũ.

## Kết quả
| Hạng mục | Số liệu |
| --- | --- |
| Thêm vào sổ công khai | **31 khoản, 1.027.615đ** (26/10: 10; 28/10: 21) |
| Chờ xác nhận (staging riêng tư, KHÔNG công bố) | 1 khoản 150.000đ 26/10: người gửi trùng tên chủ tài khoản nhận |
| Trùng / bỏ qua | 0 / 0 (mọi ngày mới sau 23/10; 21 khoản cũ không bị sửa hay xóa) |
| Tổng trước → sau | 1.011.222đ (21) → **2.038.837đ (52)**, tiến độ 14,4% → 29,1% của 7.000.000đ |
| Tên hiển thị / Ẩn danh | 8 / 23 |

Phạm vi: `coveredTo` 2026-10-28 (ngày muộn nhất có trong nguồn), `verifiedAt` 2026-11-01; không có dữ liệu 27/10 nên không điền 0đ. Quy tắc tên giữ như L1–L4: chỉ hiển thị khi cột đối tác là cá nhân và khớp mô tả; còn lại "Ẩn danh"; không lấy tên từ mô tả. Không có tên trong nguồn trùng khoản đã công khai. Không phải đối soát đầy đủ (`reconciled=false`, không số dư/chi).

## D1 / Studio
Sao lưu ngay trước ghi sha256 `29f49edd…d195` = baseline rollback (finance `387b542c…`, v10). Gói SQL CAS 7 câu lệnh, `wrangler d1 execute --remote` exit 0. Finance v11 hash `c577afe4…c9b9`; revisions/publications/audit 29/9/49 → 30/10/52; media 23, preorders 2, 4 module khác không đổi. Đọc lại: 52 khoản / 2.038.837đ, không khóa trùng, giống byte-for-byte dữ liệu công khai repo. Publication `l4rb1` → draft; mới `pub-1793467617868-l5r1` **pending_review** (snapshot `62fa335c…39f9`, không có khóa nội bộ). Không duyệt/công bố.

## Kiểm thử
`npm test` exit 0 (139/139); `npm run check` exit 0; `npm run build` exit 0. Quét `dist`: 0 mã bút toán, 0 MoMo/ZaloPay/MBVCB/"chuyen tien", 0 số điện thoại, 0 tên bị ẩn.

## Hạn chế
Không có mã bút toán/số dư trong nguồn nên không kiểm liên tục số dư; 150.000đ chờ chủ dự án; chưa chụp ảnh responsive; Studio chưa kiểm qua Access.
