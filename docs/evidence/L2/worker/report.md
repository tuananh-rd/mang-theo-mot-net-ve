# L2 — thay sổ ủng hộ công khai theo CSV của chủ dự án (Claude, người vận hành duy nhất)

Báo cáo đã loại tên người ủng hộ, ghi chú/ID CSV và dữ liệu riêng tư. Bản sao lưu D1, gói SQL và bản đồ dòng nằm NGOÀI Git (`Documents/Codex/2026-10-24/L2-ledger-private/`).

- Nguồn: CSV 22 dòng, sha256 A98D5C3E…23BA. 6 dòng có ngày (492.222đ) khớp 1–1 với 6 dòng D1 hiện có (khóa trùng nội bộ): 0 mới, 0 trùng, 0 thiếu → chỉ thay tên hiển thị. 16 dòng chưa có ngày (15 duy nhất sau khi bỏ 1 dòng 14.000đ trùng, 519.000đ) giữ riêng tư, không công bố; không suy ngày. Không khôi phục dòng 09/10.
- Ủy quyền ghi nhận chính xác: chỉ thị trực tiếp của chủ dự án (24/10/2026) cho hiển thị tên các dòng có ngày; cột đồng ý công khai trong CSV để trống và KHÔNG được coi là đồng ý của người ủng hộ.
- Public: `origin/main` 7629dcd → **95870a1** (fast-forward). Pages Production `151942d9-f941-4d98-9b81-8d150f915eeb` @95870a1, Active. Bảng 3 cột Ngày | Tên người ủng hộ | Số tiền, 6 dòng, vẫn "xác minh một phần" (492.222đ, 6 khoản, không số dư/chi/đối soát đầy đủ).
- Studio Worker `mang-theo-mot-net-ve-studio-prod`: `fd35e8e8-…` → **`f67f9d20-3425-47d9-b5da-c2b493cc3759`** (nhánh `tuananh-rd/studio-ledger-names`); bindings/biến giống hệt (diff trống); Access vẫn 302.
- D1 `studio-d1-prod`: finance v6 `6ab89c45…` → v7 `f8ac4cd8c6d30119d49ad07ece84ee225818b255ac854e2fa13d269a50e15659` (CAS). revisions 25→26, publications 5→6, audit 37→40, media 23, orders 2 không đổi. project/products/journal/team giữ nguyên hash; mọi trường finance khác ngoài entries[].donor/donorPublic giống byte-for-byte; reconciled=false, entries=[], không chữ ký. Publication l1r1 → draft (superseded); l2r1 `pending_review` (snapshot sha 576b04ad…), KHÔNG duyệt/công bố.
- Sao lưu D1: trước ghi (ngay trước thao tác, giống bản lập kế hoạch) sha256 a1fe096e…fabd; sau ghi 75744fd7…2692.
- Kiểm thử: public `npm test` 139/139, `astro check` 0/0/0, `build` 0; Studio typecheck 0, studio:test 107/107, `npm test` 101/101. Quét riêng tư repo + 16 tệp production: 0 trùng với tên chưa công bố/ID/ghi chú CSV; `/reconciled-donations.json` và CSV 404; không meta/X-Robots-Tag (khả năng lập chỉ mục không đổi); QR/Techcombank, mục tiêu 7.000.000đ giữ nguyên.
## Hạn chế
- Chưa có ảnh chụp responsive sau triển khai (Edge headless không đặt được viewport 375); đã kiểm DOM/văn bản live.
- Một dòng 20/10 có tên trùng tên chủ tài khoản nhận (đã hiển thị công khai sẵn trên trang); đưa vào theo CSV của chủ dự án.
- 15 dòng chưa có ngày vẫn chờ chủ dự án cung cấp ngày; tên giữ nguyên chữ in hoa không dấu như nguồn.
- Không phải đối soát hai người; trang công khai vẫn tĩnh nên lấy dữ liệu từ commit, không từ snapshot Studio.
