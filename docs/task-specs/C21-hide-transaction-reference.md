# C21 — Không công khai mã giao dịch (chủ dự án chỉ đạo 21/10/2026)

Người thực hiện: Codex worker duy nhất (gpt-6-luna high). Claude điều phối/review. Worker sở hữu code/config/tests; Claude sở hữu tài liệu task/review.

## Yêu cầu
Chủ dự án: KHÔNG công khai mã giao dịch, kể cả dạng rút gọn (hiện sao kê công khai chỉ cho xem 4 ký tự cuối). Mã giao dịch chỉ dùng nội bộ để đối soát/chống trùng CSV trong Studio. Không xóa giao dịch, không chỉnh số tiền.

## Phạm vi
1. Public projection: loại hẳn `reference` (và mọi dạng của `id`/mã giao dịch/tham chiếu ngân hàng) khỏi dữ liệu công khai: `DonationEntry`, `DonationLedger` component, trang minh bạch/ủng hộ, snapshot (published-snapshot.json, snapshot-loader, adapter/publish projection, release-delta), bundle build, API/endpoint công khai (`/_meta/*`). Giao diện bảng sao kê công khai bỏ cột/nhãn mã tham chiếu và chữ "mã giao dịch rút gọn"; văn bản hướng dẫn/FAQ/minh bạch cập nhật: người ủng hộ tự đối chiếu bằng ngày + số tiền + nội dung chuyển khoản (tiền tố MTMNV) hoặc liên hệ nhóm; không nhắc hiển thị mã.
2. Studio giữ nguyên id/reference riêng tư (CSV import, chống trùng, giao diện nội bộ, audit). Cột `reference` trong CSV vẫn đọc được nhưng KHÔNG đi vào public projection; hướng dẫn CSV trong Studio nêu rõ "chỉ dùng nội bộ, không công khai".
3. Hai nhánh: nhánh Studio `task/c17-online-studio` (HEAD hiện tại) và public worktree `...-c18-v3` (nền origin/main d52d45f; không import mã Studio). Đồng bộ schema/default/baseline/tests để lần xuất bản từ D1 không đưa mã ra ngoài.
4. Tests: kiểm thử rằng với một sổ sao kê có reference, HTML build/snapshot/projection/release-delta KHÔNG chứa chuỗi reference nào (grep trong dist); ledger hiện `reconciled:false/entries:[]` giữ nguyên; goal 3.000.000đ, người nhận Techcombank NGUYEN CHI TRUNG 19077352683012 không đổi.
5. Cổng: studio:build/typecheck/test, check, test, build trên cả hai nhánh. Commit MỚI bằng danh sách tệp tường minh trên mỗi nhánh; không push/deploy/D1/Cloudflare; không reset/clean/stash/add -A; giữ tệp dirty của người quản lý. Báo cáo `docs/evidence/C21/worker/report.md` (ghi rõ file nào từng lộ reference). Nếu D1 production có dữ liệu cần đổi (ví dụ finance.ledger.entries chứa reference công khai), báo Claude, không tự chạm D1.
