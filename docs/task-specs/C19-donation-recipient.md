# C19 — Đổi người nhận ủng hộ (chủ dự án chỉ đạo 20/10/2026) + hoàn tất C18-S

Người thực hiện duy nhất: Antigravity. Lệnh PAUSE của chủ dự án ngày 15/10 đã được chủ dự án thu hồi cho phạm vi này (resume 20/10). Claude là quản lý/reviewer.

## Sự thật đã được Claude giải mã độc lập (không đoán)

Nguồn: ảnh chụp ứng dụng ngân hàng do chủ dự án cung cấp, bản sao riêng tại `C:/Users/tuana/.mtmnv-private/donation-20261020/source.jpg` (1290×2796, 242449 byte). **Không đưa ảnh gốc vào repo/public/bundle/GitHub.**

- Chữ hiển thị: TECHCOMBANK · NGUYEN CHI TRUNG · `1907 7352 6830 12`.
- Payload VietQR giải mã (jsqr): `00020101021138580010A000000727012800069704070114190773526830120208QRIBFTTA53037045802VN8300840063045A5F`
  - BIN `970407` (Techcombank), tài khoản `19077352683012` (14 chữ số), dịch vụ `QRIBFTTA`, tiền tệ 704, quốc gia VN, không có số tiền (QR tĩnh), CRC16-CCITT `5A5F` **đã tính lại và khớp**.
- Số chuẩn hóa dùng cho web: **`19077352683012`** (14 chữ số, khớp chữ hiển thị và QR). Lưu ý: tin nhắn chuyển tiếp ghi `1907352683012` (13 chữ số) là gõ thiếu; KHÔNG dùng số đó.
- Chủ tài khoản: `NGUYEN CHI TRUNG`. Ngân hàng: `Techcombank`. Mục tiêu `3.000.000đ`, `transferPrefix: 'MTMNV'` giữ nguyên.

## Phần 1 — Hoàn tất C18-S (xem `docs/task-specs/C18-S-studio-sync.md`)

Tiếp tục từ trạng thái đã bảo tồn trong workspace chính (cherry-pick -n 41bea91 đã stage; `apps/studio/src/schemas/index.ts`, `html.ts`, `tests/proxy-invariants.test.mjs` đang sửa dở). Kiểm tra tiến độ thật, hoàn tất đúng spec C18-S (gồm bài kiểm thử chống lệch), chạy đủ cổng, **commit 1** chỉ gồm danh sách tệp tường minh của C18-S. Không `git add -A`, không reset/clean/stash. Báo cáo: `docs/evidence/C18/studio-sync/worker/report.md`.

## Phần 2 — Đổi người nhận trong nhánh Studio (commit 2, workspace chính)

1. Tạo tài sản QR sạch từ ảnh nguồn bằng công cụ có sẵn trong repo (`sharp` hoặc công cụ tương đương; không vẽ lại bằng AI, không làm mờ/nén phá QR): cắt đúng **thẻ QR** (logo TECHCOMBANK, mã QR, VietQR/napas 247) khỏi giao diện ứng dụng — không có đồng hồ, pin, tên, số tài khoản, nút, nền vàng. Thẻ trong ảnh nguồn nằm xấp xỉ x 238–1053, y 689–1601 (px gốc); cắt vào trong mép bo góc khoảng 10–15 px để không lộ bóng/nền. Giữ vùng im lặng (quiet zone) trắng ≥ 4 module quanh QR, cùng bố cục như `qr-ung-ho-techcombank.png` hiện có. Xuất PNG. Giải mã lại tệp kết quả bằng bộ giải mã (jsqr trong thư mục tạm NGOÀI repo hoặc công cụ repo có sẵn) và xác nhận payload **bằng đúng chuỗi ở trên**; ghi vào báo cáo.
2. Tên tệp mới: `public/images/ung-ho/qr-ung-ho-techcombank-nguyen-chi-trung.png` (tên cũ không dùng lại để tránh bộ đệm CDN trả mã cũ). **Xóa tệp QR cũ khỏi public/** bằng `git rm` (tệp cũ vẫn nằm trong lịch sử git; không viết lại lịch sử).
3. Cập nhật mọi nơi dùng tài khoản/QR cũ (đã grep: `src/data/campaign.ts` `BASELINE_DONATION_ACCOUNT`, `apps/studio/src/schemas/index.ts` mặc định, `apps/studio/src/ui/html.ts`, `tools/content-studio/release-delta.mjs` dòng ~118–125 kiểm tra QR, `tests/donations.test.mjs`, `apps/studio/tests/publisher-contract.test.mjs`, các thành phần `DonationPanel.astro`/trang `dong-hanh`/văn bản alt, nút sao chép, nút tải QR, hướng dẫn trong Studio). Tự grep lại toàn bộ `src apps tools tests public` với các chuỗi `19072950239011`, `1907 2950 2390 11`, `NGUYEN NGOC KHOA`, `NGUYỄN NGỌC KHOA`, `qr-ung-ho-techcombank.png`; không để sót trong luồng ủng hộ đang hoạt động. Tài liệu lịch sử/bằng chứng cũ (`docs/evidence`, `reports`) KHÔNG sửa.
4. Đăng ký/băm media đã duyệt: nếu repo có sổ đăng ký media hoặc băm (grep `sha256`, `media`, `manifest`, `README` trong `public/images`, `release-delta.mjs`), cập nhật cho tệp mới; nêu rõ nơi nào.
5. Kiểm thử: cập nhật bài kiểm thử gắn cứng tài khoản cũ sang tài khoản mới (nêu lý do), thêm bài khẳng định: số tài khoản = `19077352683012`, chủ tài khoản = `NGUYEN CHI TRUNG`, tệp QR tồn tại, không còn chuỗi cũ trong dữ liệu mặc định/baseline, `goalAmount === 3000000`, `ledger` vẫn `reconciled:false/entries:[]`. Nếu có thể, thêm bài giải mã QR (chỉ khi không thêm phụ thuộc vào repo; nếu không, ghi giải mã vào báo cáo bằng tệp tạm).
6. Không sửa giao dịch, sao kê, số tiền nhận. Không đổi nội dung khác.
7. Cổng: `npm run studio:build`, `studio:typecheck`, `studio:test`, `check`, `test`, `build`; ghi exit code. Báo cáo: `docs/evidence/C19/worker/report.md`. **Commit 2** chỉ gồm danh sách tệp tường minh.

## Phần 3 — Bản công khai trên nền `origin/main` (commit 3, worktree `...-c18-v3`)

Trong worktree `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve-c18-v3` (nhánh `task/c18-v3-content`, HEAD `41bea91`, cùng gốc với `origin/main`): áp dụng đúng các thay đổi công khai tương đương Phần 2 (tên hằng trên main là tên cũ, không phải `BASELINE_*`): dữ liệu tài khoản, tài sản QR mới (cùng byte với Phần 2), xóa QR cũ, kiểm thử liên quan; không đưa mã Studio. Chạy `npm run check`, `npm test`, `npm run build` và xác nhận `public/` chỉ đổi đúng: +QR mới, −QR cũ. **Commit 3** (một commit nội dung, tệp tường minh). Không push.

## Không làm

Không push, không deploy, không chạm D1/R2/Cloudflare, không đổi `wrangler*`, không tạo token, không chạm Access, không dọn rác hàng loạt, không sửa tệp tài liệu của Codex. Khi xong cả 3 commit: báo cáo + `worker_done` + dừng. Claude sẽ review, cập nhật D1 production và phát hành.
