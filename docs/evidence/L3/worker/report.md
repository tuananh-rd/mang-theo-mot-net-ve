# L3 — công bố toàn bộ khoản ủng hộ do chủ dự án cho phép (Claude, người vận hành duy nhất)

Task `task_7f6523fa6408` / dispatch `ctx_f480d2622ada`. Checkpoint (kế hoạch diff, dedup, SQL CAS) đã được Codex/chủ dự án duyệt trước khi ghi, kèm 1 sửa: khoản 30.000đ ghi đúng tên đầy đủ theo chủ dự án chép trực tiếp. Báo cáo đã loại bỏ ảnh sao kê, tệp thô, mã giao dịch, ghi chú, giờ, số điện thoại/tài khoản/số dư. Bản sao lưu D1, gói SQL (có tên) và bản đồ dòng nằm NGOÀI Git (`Documents/Codex/2026-10-24/L3-ledger-private/`).

## Nguồn và dedup
- CSV `tien_vao_day_du.csv` sha256 `a98d5c3e48f69adce8eda2668d23062eed40c469b4d164cc424599555d6223ba` (không đổi so với L2): 22 dòng = 6 dòng có ngày tuyệt đối (492.222đ) + 16 dòng chưa có ngày.
- 6 dòng có ngày khớp 1–1 với 6 dòng đã công bố ở L2 (khóa nội bộ ngày+giờ+số tiền+băm tên, và ngày/số tiền/tên): **0 mới, 0 trùng, giữ nguyên byte-for-byte**.
- 16 dòng chưa có ngày: bỏ 1 dòng 14.000đ lặp → **15 khoản duy nhất, 519.000đ**. Ngày theo chỉ thị trực tiếp của chủ dự án: khoản 50.000đ của HUONG DUONG NGUOC NANG = **22/10/2026** (1 khoản); 14 khoản còn lại = **23/10/2026**. Không suy ngày từ metadata. Một khoản 20.000đ không có tên giữ **"Ẩn danh"** (không bịa người ủng hộ).
- Loại: khoản chuyển ra 50.000đ (không có trong CSV nguồn tiền vào), dòng 09/10 đã xóa (không khôi phục).
- Kết quả: **21 khoản duy nhất, 1.011.222đ** (13/10: 1; 20/10: 3; 21/10: 2; 22/10: 1; 23/10: 14).

## Phạm vi dữ liệu (vẫn là sao kê một phần)
`coveredFrom` 2026-10-13, `coveredTo` 2026-10-21 → **2026-10-23**, `verifiedAt` 2026-10-24 → **2026-10-25**, `reconciled=false`, `entries=[]`, không chữ ký/`reconciledAt`, không số dư/chi/tổng cả tài khoản; trang vẫn ghi "chưa phải đối soát toàn bộ tài khoản"; mục tiêu 7.000.000đ giữ nguyên (tiến độ hiển thị 14,4%). Tên hiển thị là quyền đã được chủ dự án cho phép trực tiếp (`donorNamesApproval: owner-authorized`); cột đồng ý công khai trong CSV để trống và không được coi là đồng ý của người ủng hộ. Tên giữ chữ in hoa không dấu như nguồn.

## Mã/tệp đã đổi (nguồn thật, phạm vi hẹp)
`src/data/reconciled-donations.json` (+15 dòng `{date, donor, amount}`, coveredTo, verifiedAt); `tests/donations.test.mjs`, `tests/ledger-receipts.test.mjs` (21 khoản/1.011.222đ/14,4%, thứ tự, dedup, một dòng ẩn danh, phạm vi ngày, tên khoản 30.000đ); `docs/evidence/L3/worker/plan-d1.mjs`, `l3-release-d1-plan.json` (đã làm sạch: không tên, mã CSV, khóa nội bộ). **Không đổi**: validator/schema/adapter Studio (adapter `f67f9d20` đã chiếu `donorPublic` đúng), mục tiêu 7.000.000đ, QR/Techcombank, giá 40.000/10.000, đặt trước, Stage 2, C21, quyền/liên hệ/cấu hình. Không đổi dependency (chỉ `npm ci`).

## Phát hành thực tế
| Hạng mục | Trước | Sau |
| --- | --- | --- |
| Git `origin/main` | `95870a12aac7bc8687bcb180435ad71941c50349` | `82cfef8486ce34e574cc0240daa3e9060b6ea1a1` (fast-forward, không force, không amend; nhánh `tuananh-rd/l3-all-supporters-main`, cha `95870a1`) rồi thêm 1 commit báo cáo này |
| Pages `mang-theo-mot-net-ve` | `151942d9-f941-4d98-9b81-8d150f915eeb` @95870a1 | **`83f07329-e565-4292-a709-929bcfef8da8`** (Production, @82cfef8) |
| Worker Studio | `f67f9d20-3425-47d9-b5da-c2b493cc3759` | không đổi (không cần triển khai mã) |
| D1 `studio-d1-prod` finance | v7 `f8ac4cd8c6d30119d49ad07ece84ee225818b255ac854e2fa13d269a50e15659` | v8 `387b542c4a145ce4e2e537effb04b84d314f15074a99db9bb61fde17b10d6633` |
| D1 đếm (revisions/publications/audit/media/orders) | 26 / 6 / 40 / 23 / 2 | 27 / 7 / 43 / 23 / **2 (không đổi)** |

D1: sao lưu ngay trước khi ghi sha256 `75744fd74f69ee534a86239ea8fb80ba9121dd8009b32c34ecf970d939452692` (trùng bản kiểm kê và bản sau-ghi của L2 → chưa có thay đổi nào giữa chừng); gói SQL sha256 `f90c82ecdd496bb665fee57d37e27bcfade348c420308d7dfa187b541fba8ffd` (CAS theo hash finance cũ + điều kiện hash 4 module khác không đổi, 7 câu lệnh, `wrangler d1 execute --remote` exit 0); sao lưu sau ghi `0877c269b14082895f60235a28bfd79bf47429e0b79244318159c06323c79c09`. Đọc lại: project/products/journal/team giữ nguyên hash; mọi trường finance khác ngoài `verifiedReceipts.{entries,coveredTo,verifiedAt}` giống byte-for-byte; 6 dòng cũ giống nhau; 21 dòng/1.011.222đ (thêm 519.000đ), không trùng khóa; `reconciled=false`, `entries=[]`, không chữ ký; bảng users/media/preorders không đổi. Audit (tác nhân `claude-release@internal`): `SAVE_DRAFT` finance v8 (ghi lý do chỉ thị chủ dự án), `REJECT_PUBLICATION` (publication `l2r1` pending_review → draft, "superseded", snapshot cũ nguyên vẹn), `REQUEST_PUBLICATION` (`pub-1792863103621-l3r1`, **pending_review**, snapshot sha256 `ac3c530e6dfab9eea18a33659f802a3373b459f40c34e6f6cf8d5ff3de6119b7`, đã quét không có `internalKey`/`sourceTag`/`donorPublic`/ghi chú CSV). **Không duyệt, không công bố, không giả chữ ký** publication Studio; trang công khai vẫn tĩnh nên số liệu công khai đến từ commit; snapshot Studio khớp byte-for-byte dữ liệu công khai trong repo và qua validator công khai.

## Kiểm thử và mã thoát thật
`npm ci` exit 0; `npm test` exit 0 (**139/139**); `npm run check` exit 0 (0/0/0); `npm run build` exit 0; dry-run D1 trên emulator nạp từ bản sao lưu (`plan-d1.mjs`) exit 0, `ok=true`; `git push` exit 0 (95870a1..82cfef8); `wrangler d1 execute` exit 0. Sau đẩy mã, Pages build mất ~1–2 phút; ngay sau khi triển khai xong mới kiểm trực tiếp (lần đọc đầu trước khi xong vẫn thấy 492.222đ — không tính là bằng chứng).

## Kiểm chứng trực tiếp (https://mangtheomotnetve.website, sau triển khai `83f07329`)
- `/`, `/minh-bach/`, `/dong-hanh/`: HTTP 200, hiển thị **1.011.222đ**, không còn 492.222đ, tiến độ 14,4%, còn câu "chưa phải đối soát toàn bộ tài khoản".
- `/dong-hanh/`: đúng **21 dòng**, tổng cộng từ chính DOM = **1.011.222đ**; thứ tự mới nhất trước (23/10 ×14 gồm 1 "Ẩn danh", 22/10 HUONG 50.000đ, 21/10 ×2, 20/10 ×3, 13/10 ×1); khoản 30.000đ hiển thị đúng tên đã xác nhận.
- Không `meta robots`, không `X-Robots-Tag` trên 3 trang (khả năng lập chỉ mục production không đổi); `robots.txt` 200 không đổi; `/reconciled-donations.json` 404.
- QR Techcombank, tên chủ tài khoản/số tài khoản, mục tiêu 7.000.000đ, giá 40.000đ/10.000đ còn nguyên; `/san-pham/`, `/ve-nhom/`, `/nhat-ky/` 200; Studio `studio.mangtheomotnetve.website/api/drafts/finance` vẫn 302 (Cloudflare Access).
- Quét riêng tư 3 trang: 0 khớp mã giao dịch, ghi chú CSV, "MoMo", "chuyen tien", "chưa rõ mục đích".

## Hạn chế thật
- Chưa chụp ảnh responsive 375/768/1440 sau đợt này; kiểm bằng DOM/văn bản và build; Studio production chưa kiểm bằng đăng nhập Access (không vượt Access) — đã kiểm bằng đọc lại D1 và mã adapter đã triển khai.
- Đây không phải đối soát hai người; không có số dư, chi, mở đầu kỳ hay tổng cả đợt. Publication Studio L3 `pending_review` chưa duyệt.
- Ngày 22/10 và 23/10 là ngày do chủ dự án chỉ định cho các dòng không có ngày trong ảnh; không có bằng chứng ngày độc lập trong CSV.
- Tên khoản 30.000đ ("HA DOAN TRANG") dựa trên chép trực tiếp của chủ dự án thay vì bản CSV bị cắt.
- Một dòng 20/10 có tên trùng tên chủ tài khoản nhận (đã công bố từ L2). Thứ tự các khoản trong cùng ngày theo thứ tự CSV (ổn định, không sắp theo giờ).
- Không có số liệu CWV/Lighthouse.
