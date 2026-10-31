# L5b — hiển thị đầy đủ tên người gửi (sửa L5)

Chủ dự án (01/11/2026) trực tiếp cho phép công khai tên NGƯỜI GỬI có trong nguồn, thay quy tắc thận trọng của L4/L5. Không public mã giao dịch, SĐT, số tài khoản, mã tham chiếu hay mô tả thô; C21 giữ nguyên. Báo cáo này không liệt kê tên; bản đồ từng dòng (trước/sau/quy tắc) nằm ngoài Git (`Documents/Codex/2026-11-01/L5-ledger-private/l5b-name-map-private.json`).

## Quy tắc ánh xạ (từ cột Diễn giải của `update_saoke_1.xlsx`, sha256 `AEE39E15…FC8F`)
- Tên người gửi = phần trước "chuyen tien"; bỏ tiền tố `QR - `, mã dạng số-số của MoMo, phần trước dấu `;` của chuyển liên ngân hàng, mã tham chiếu `MBVCB.…` và `ZP…`, nhãn chiến dịch `MTMNV`, hậu tố QR/Zalopay.
- Tên người NHẬN (chủ tài khoản) không bao giờ bị coi là người gửi. Giữ nguyên chính tả/chữ hoa-thường của nguồn (không thêm dấu, không tách họ, không hoàn chỉnh chữ viết tắt). Cột Đối tác nền tảng (MoMo, ZaloPay) bị bỏ qua khi diễn giải có tên người gửi rõ; không có mâu thuẫn tên giữa cột Đối tác và diễn giải ở 31 dòng mới.
- Quy tắc áp dụng: 26 dòng "trước chuyen tien", 2 dòng Vietcombank (giữa mã tham chiếu và "chuyen tien"), 1 dòng ZaloPay, 1 dòng sau nhãn chiến dịch, 1 dòng không có tên.

## Trước / sau (52 khoản, 2.038.837đ — không đổi)
| | Có tên | Ẩn danh |
| --- | --- | --- |
| Trước (L5) | 28 | 24 |
| **Sau (L5b)** | **50** | **2** |

22 dòng đổi tên hiển thị (đều trong 31 dòng 26–28/10). Ngày, số tiền, số dòng, thứ tự và khóa riêng tư không đổi.

**Còn Ẩn danh (2)**: (1) 28/10 50.000đ — diễn giải không nêu tên người gửi; (2) 23/10 20.000đ (cũ) — diễn giải "ủng hộ…" không có tên, CSV chủ dự án cũng để trống.

**21 khoản cũ**: không đổi. Đối chiếu với sao kê: các tên cũ do chủ dự án cung cấp nên giữ nguyên. **Cần chủ dự án xác nhận 1 mâu thuẫn thật**: dòng 13/10 50.000đ đang công khai theo CSV chủ dự án với một họ khác với họ trong diễn giải sao kê (chỉ khác họ) — không tự chọn, giữ nguyên. Khoản 150.000đ (26/10, người gửi trùng tên chủ tài khoản) vẫn chờ xác nhận, KHÔNG công bố.

## D1 / Studio
Sao lưu ngay trước ghi sha256 `9b2e3348…5437` = bản sau L5. finance v11 `c577afe4…` → v12 `73736b95…2aac` (CAS), SQL 7 câu lệnh exit 0; revisions/publications/audit 30/10/52 → 31/11/55; media 23, preorders 2, 4 module khác không đổi. Đọc lại: 52 khoản / 2.038.837đ, khớp byte-for-byte dữ liệu công khai repo. Publication `l5r1` → draft; mới `pub-1793468314664-l5br1` **pending_review** (snapshot `0a91c153…919f`). Không duyệt/công bố.

## Kiểm thử
`npm test` exit 0 (139/139, test cập nhật: 30/31 có tên, 2 Ẩn danh); `npm run check` exit 0; `npm run build` exit 0. Quét `dist`: 0 mã bút toán, 0 MoMo/ZaloPay/MBVCB/"chuyen tien", 0 số điện thoại. Tên đã được duyệt không còn bị coi là dữ liệu riêng tư.
