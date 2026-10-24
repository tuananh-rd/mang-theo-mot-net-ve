# P1 release — báo cáo phụ trợ API/D1/Studio (checkout cô lập `public-phone-api`)

Báo cáo chính: `public-owner-fixes/docs/evidence/P1-release/worker/report.md`. Nhánh `tuananh-rd/public-phone-api` (mã ứng dụng `63c45f7`, báo cáo P1 `f4adafb`) được đẩy lên GitHub như **nhánh riêng** để truy vết, KHÔNG hợp nhất vào `main` và không đưa Layout/site Studio vào bản công khai.

- Worker `mang-theo-mot-net-ve-preorder-api`: `03dd63c9` → `29fe7433-3d76-49a5-8a7e-bc3ac391f5f0`; bindings/vars/secret giữ nguyên (dry-run trùng bản đang chạy); không triển khai lại Studio.
- D1: `plan-d1.mjs` (project v7, products v3, media_assets, publication snapshot) và `plan-d1-fix.mjs` (khóa media `/media/<id>` để UI Studio chọn đúng và lưu không mất ảnh; products v4; publication thay thế). Hai gói SQL có CAS theo hash; kiểm thử trên emulator nạp bản sao lưu trước khi chạy `wrangler d1 execute --remote --file`. Gói SQL chứa snapshot nên giữ ngoài Git; tóm tắt/hash ở `p1-release-d1-plan.json`, `p1-release-d1-fix-plan.json`.
- Kết quả trạng thái: drafts project `e2756679…`, products `c2314a1a…`; revisions 21→24; publications 2→4 (một `pending_review`: `pub-1792851097528-p1r2`); media 22→23; audit 25→34; đơn hàng 2→2.
- UI Studio (mã thật, dev cục bộ): `studio-roundtrip.mjs`/`.json` — chọn đúng ảnh, lưu lại giữ nguyên `mediaKey`.
- R2: `media/asset-moc-khoa-mau-chu-du-an` sha256 `bcd18df918f976e6ec805351399712e544204d5214e677532bdf69e05f91a2d1`.
- Kiểm thử đã chạy: `studio:test` 98/98 (cần `dist-preview`), `npm test` 101/101, `npm run check` 0 lỗi (P1-API).
