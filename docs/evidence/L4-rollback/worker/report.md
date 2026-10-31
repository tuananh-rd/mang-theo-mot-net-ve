# Rollback L4 — khôi phục sổ ủng hộ về bản trước import sao kê 26–29/10 (Claude, người triển khai duy nhất)

Chỉ thị chủ dự án 31/10/2026: bỏ toàn bộ cập nhật L4, KHÔNG công bố khoản 150.000đ (staging riêng tư giữ nguyên, không công bố). Báo cáo không chứa tên, mã bút toán, số điện thoại/tài khoản. Bản sao lưu, gói SQL, bản đồ dòng nằm ngoài Git (`Documents/Codex/2026-10-29/L4-ledger-private/`, `Documents/Codex/2026-10-31/L4-rollback-private/`).

## Xác minh trước khi hoàn tác
- `origin/main` = `acbb614` (không có commit nào sau L4). L4 chỉ sửa `src/data/reconciled-donations.json`, `tests/donations.test.mjs`, `tests/ledger-receipts.test.mjs` (+ tài liệu). Đích khôi phục = các tệp đó tại cha `a822b58` (đọc từ git, không suy từ lời nhắc): **21 khoản, 1.011.222đ, coveredTo 2026-10-23, verifiedAt 2026-10-25**.
- Sao lưu trước L4 sha256 `0877c269b14082895f60235a28bfd79bf47429e0b79244318159c06323c79c09` khớp báo cáo; sao lưu sau L4 `766a9afc…`. Sao lưu D1 production NGAY TRƯỚC rollback có sha256 `766a9afc2d65b8c483a330ffe7551aca85a2bfe0297152a2be2cf0ac418ba69c` = bản sau L4 → không có thay đổi nào giữa chừng. finance hiện tại `2d133a0b…5f35` (52 khoản).

## Hoàn tác
- **Git**: commit mới, khôi phục đúng 3 tệp dữ liệu/test về `a822b58` (không revert commit, không reset/force). Giữ hero/MSH/P1 và mọi thay đổi khác. Tài liệu L4 giữ để truy vết (đã gắn nhãn "ĐÃ HOÀN TÁC").
- **D1** (`studio-d1-prod`): gói SQL CAS 7 câu lệnh (điều kiện hash finance hiện tại + hash 4 module khác), `wrangler d1 execute --remote` exit 0. Revision finance mới v10 khôi phục payload v8 (hash tính lại `387b542c…6633`); revision L4 (v9) và audit cũ giữ nguyên; thêm audit SAVE_DRAFT/REJECT_PUBLICATION/REQUEST_PUBLICATION (`claude-release@internal`). Publication L4 `pub-1793278400568-l4r1` → draft (không được công bố), publication khôi phục mới `pub-1793464970754-l4rb1` **pending_review** (snapshot sha256 `ac3c530e…19b7` = đúng snapshot L3 gốc). Không duyệt/công bố/giả chữ ký.
- Đọc lại sau ghi (sao lưu sau rollback sha256 `29f49edd5e40f6595f4429df9b85f395805a671122c0d24532c85e8db57fd195`): finance hash `387b542c…`, **21 khoản / 1.011.222đ**, coveredTo 2026-10-23, verifiedAt 2026-10-25, không khóa trùng, giống byte-for-byte dữ liệu công khai của repo; project/products/journal/team giữ hash; revisions/publications/audit 28/8/46 → 29/9/49; media 23 và preorders 2 không đổi.

## Kiểm thử
`npm test` exit 0 (139/139); `npm run check` exit 0; `npm run build` exit 0 (13 trang). `git diff a822b58 -- src tests` rỗng. Dist hiển thị 1.011.222đ / 14,4%.

## Không đổi
Mục tiêu 7.000.000đ, giá 40.000/10.000đ, QR/tài khoản, đặt trước, Stage 2, hero, quyền. Worker/API không triển khai lại.
