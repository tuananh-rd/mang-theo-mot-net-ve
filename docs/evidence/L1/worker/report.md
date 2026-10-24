# L1 — báo cáo phát hành khoản ủng hộ đã xác minh một phần (Claude, người vận hành duy nhất)

Task `task_203795804c28` / dispatch `ctx_f541955f1414`. Chủ dự án đã cho phép phát hành trong phạm vi sổ ủng hộ; Codex rà soát độc lập trước khi ghi (checkpoint được chấp thuận kèm 4 sửa nhỏ, đã làm đủ). Báo cáo đã loại bỏ tên người gửi, mô tả thô, mã tham chiếu, số điện thoại, số dư và giờ giao dịch. Bản sao lưu D1, dữ liệu chờ và gói SQL nằm NGOÀI Git.

## Kết quả đọc ảnh và phân loại (độc lập, 4 ảnh gốc đều được mở và đọc)
| Nhóm | Số khoản | Tổng | Xử lý |
| --- | ---: | ---: | --- |
| Có ngày tuyệt đối do chủ dự án chỉ định | 6 | 492.222đ | **Đã nhập mới** (đã có sẵn trong sổ production: 0; trùng bỏ qua: 0). Khoản 20/10 21:24 xuất hiện ở hai ảnh, chỉ tính một lần |
| Đã tồn tại trước đó trong sổ công khai/Studio | 0 | 0đ | — (sổ công khai và bản nháp finance đều rỗng; 5 revision finance trước đó chưa từng có dòng nào) |
| Chưa có ngày tuyệt đối (một khoản ghi "Hôm qua") | 15 | 519.000đ | **Chờ — chỉ lưu riêng tư**, không có trong repo/D1/trang công khai; không suy ngày từ tên tệp/mtime/EXIF/số dư |
| Khoản chuyển ra 13/10 13:48 | 1 | 50.000đ | **Loại**: mục đích chưa rõ, không phải ủng hộ âm, không phải chi phí dự án |
| Dòng bị cắt ở mép ảnh | — | — | **Loại**, không nhập dòng không đầy đủ |
| Khoản 09/10 50.000đ chủ dự án đã xóa trước đó | 0 | 0đ | **Không khôi phục** |

Sáu khoản đã nhập (đều hiển thị "Ẩn danh"): 13/10 +50.000; 20/10 +20.000, +200.000, +100.000; 21/10 +100.000, +22.222.

## Phạm vi và ngôn ngữ (không phải đối soát đầy đủ)
Thêm khối `verifiedReceipts` (`scope: partial-verified-receipts`) **song song** với sổ đối soát: `reconciled=false`, `entries=[]`, không chữ ký, không `reconciledAt`. Metadata thật: `verifiedAt` 2026-10-24, `coveredFrom` 2026-10-13, `coveredTo` 2026-10-21, `basis` = ảnh sao kê do chủ dự án cung cấp, `verifiedBy` là vai trò (không email). Trang Chủ/Minh bạch/Đồng hành hiển thị cùng "492.222đ · 6 khoản · 13/10–21/10/2026 · chưa phải đối soát toàn bộ tài khoản"; không nêu số dư, chi, mở đầu kỳ hay tổng cả đợt; không chữ "Thực tế (đã đối soát)" hay "đã ủng hộ (sổ đã đối soát)" khi ở chế độ một phần; bỏ ô tìm theo tên vì toàn bộ ẩn danh. Thanh tiến độ thể hiện 7% mục tiêu 7.000.000đ nhưng `reachedGoal = null`. Dữ liệu công khai chỉ có ngày, số tiền, "Ẩn danh"; validator từ chối trường lạ (giờ, mã tham chiếu, mô tả), tên thật, ngày ngoài phạm vi, số tiền không an toàn/tổng tràn, và dùng cùng sổ đã đối soát đầy đủ.

## Phát hành (thực tế)
| Hạng mục | Trước | Sau |
| --- | --- | --- |
| Git `origin/main` | `83404146918b1af311af17639e4bb9e25329f332` | `992197a3c7e5fc5882f9e43358dfe9f1a69465a7` (fast-forward, không force; chỉ tệp của L1, không có tệp review/spec của Codex) |
| Pages `mang-theo-mot-net-ve` | `a856d001-8667-468d-985c-ef4d26b56788` @8340414 | **`75638772-471b-4436-8cce-57da8004a75b`** @992197a (Production, Active) |
| Worker Studio `mang-theo-mot-net-ve-studio-prod` | `d5b3f648-7207-46c1-8576-a4982e50c283` | **`fd35e8e8-6362-4f40-9fea-e067076a84a3`** (từ nhánh backend riêng `tuananh-rd/studio-ledger-receipts` @767bb44, KHÔNG hợp nhất vào main công khai) |
| Worker preorder API | `29fe7433-…` | không đổi |
| D1 `studio-d1-prod` | 24 revisions · 4 publications · 34 audit · 23 media · 2 orders | 25 revisions · 5 publications · 37 audit · 23 media · **2 orders (không đổi)** |

Studio: cấu hình triển khai dùng `wrangler.studio-production.json` (khớp đúng bản đang chạy, không dùng toml có giá trị giữ chỗ); `versions view` cho thấy bindings của `d5b3f648` và `fd35e8e8` giống hệt (DB, BUCKET, ASSETS, 7 biến gồm CF_ACCESS_* thật; secret không bị chạm). Sau triển khai `studio.mangtheomotnetve.website` và `/api/drafts/finance` vẫn trả 302 (Cloudflare Access).

D1 (bản sao lưu `studio-d1-prod-pre-l1.sql` sha256 `5cbc4b6515a616d5898383fdd8e13f617d7ab19a8e21eb451199a6c1758b11f5`, ngoài Git; gói SQL sha256 `4ae5729ce1d7ae75c6f83eae187f6f0727de7770d11bde740496b0f39b50f63a`, ngoài Git; đã chạy thử trên emulator nạp từ bản sao lưu): chỉ `drafts.finance` v5→**v6** (hash `6c1105a5…` → `6ab89c45…`, CAS + điều kiện hash các module khác không đổi) cộng revision và audit tương ứng (tác nhân `claude-release@internal`); module project/products/journal/team giữ nguyên hash (`e2756679…`, `c2314a1a…`, `6568556e…`, `9f5f0937…`) nên stage/ảnh móc khóa P1 còn nguyên. Mọi trường finance khác `verifiedReceipts` giống byte-for-byte (có assert). Publication: `pub-1792851097528-p1r2` (pending_review cũ, không có khoản ủng hộ) chuyển `draft` với lý do "superseded", snapshot cũ nguyên vẹn; tạo `pub-1792857408876-l1r1` **pending_review** (snapshot từ adapter mới, sha256 `421163ada71dd8ab8307028a094952aa9a5307c284bd11484fc9a1c1fe050b42`, đã quét không có `internalKey`/`sourceTag`/tên người gửi). **Không duyệt/không công bố/không giả chữ ký**; site công khai vẫn là tĩnh nên số liệu công khai hiện đến từ commit 992197a, và snapshot cũ không thể ghi đè sổ mới.

## Đổi mã
Public (`public-ledger-receipts` → release `992197a`): `csv-validator.mjs` (`validateVerifiedReceipts`, `sanitizeVerifiedReceipts`), `campaign.ts`, `donations.ts` (summary `scope`), `GoalProgress`/`DonationLedger`/`minh-bach`/`index`/`dong-hanh`, `reconciled-donations.json`, `receipt-dedup.mjs`, `tests/ledger-receipts.test.mjs`. Studio (nhánh backend riêng): `schemas/index.ts` (`validateVerifiedReceiptsData`), `publish/adapter.ts` (chiếu công khai chỉ khi đã duyệt, hợp lệ, `!reconciled`; loại khóa nội bộ), thẻ chỉ đọc trong tab Tài chính, `tests/verified-receipts.test.mjs`, `docs/evidence/L1/worker/plan-d1.mjs`. Studio UI giữ khối khi lưu các thẻ khác (UI dùng `{...activeDraft.data}`; có test vòng lưu).

## Kiểm thử và mã thoát thật
Public: `npm run check` exit 0 (0/0/0), `npm test` exit 0 (**132/132**, 101 nền + 31 mới), `npm run build` exit 0. Studio: `studio:typecheck` 0, `studio:build` 0, `studio:test` 0 (**104/104**, gồm workerd), `npm test` gốc 0 (101/101), `astro build --config astro.preview.config.mjs` 0. `git push`, `wrangler deploy`, `wrangler d1 execute` hoàn tất exit 0 và được xác nhận bằng SHA, version ID, đọc lại hash/đếm. Không có thay đổi config/secret/binding.

## Kiểm chứng trực tiếp
- Preview loopback 4392 (X-Robots-Tag noindex) rồi production `https://mangtheomotnetve.website`: 8 tuyến × 3 viewport (375/768/1440) = 24 trường hợp, 1 H1, không tràn ngang, tương phản ≥4.5:1; ảnh ở `docs/evidence/L1/worker/after/` (preview) và `live/` (production). Ba trang Trang chủ/Minh bạch/Đồng hành cùng hiển thị `492.222đ`, không có nhãn đối soát đầy đủ; Đồng hành có 6 dòng "Ẩn danh"; QR, Techcombank/NGUYEN CHI TRUNG/19077352683012, mục tiêu 7.000.000đ, giá 40.000/10.000 (cấu hình đặt trước công khai), chuỗi/giai đoạn/ảnh móc khóa/điện thoại bắt buộc của P1 còn nguyên.
- Quét riêng tư production: 16 tệp (trang HTML + JS/CSS/JSON/map được liên kết) không chứa tên người gửi riêng tư; `/reconciled-donations.json` và nguồn đều 404; không `meta robots`/`X-Robots-Tag` (khả năng lập chỉ mục production không đổi).
- Một cảnh báo tự động `support@375x812` (clipped) chỉ là tiêu đề bảng ở dạng ẩn trực quan của bảng xếp chồng trên di động; không có tràn nội dung (ảnh chụp đã xem).

## Hạn chế thật
- Studio production chưa kiểm thử được bằng đăng nhập Access; bằng chứng: bản dựng chứa mã mới, bindings giống hệt, Access vẫn chặn, đọc lại D1 đúng, UI Studio thật chạy cục bộ (test vòng lưu). Không cố vượt Access.
- 15 khoản (519.000đ) vẫn chờ chủ dự án cung cấp ngày; **không công bố**. Khi có ngày, cần nhập thêm khối (dedup bằng khóa nội bộ) và phát hành lại.
- Đây không phải đối soát hai người; không có số dư, chi, số dư đầu kỳ hay tổng cả đợt. Publication mới `pending_review` chưa duyệt; chưa có bộ tiêu thụ snapshot nên trang công khai lấy dữ liệu từ commit.
- Khoản chuyển ra 50.000đ và dòng 09/10 đã xóa không thể hiện ở đâu.
- Không có số liệu CWV/Lighthouse.
