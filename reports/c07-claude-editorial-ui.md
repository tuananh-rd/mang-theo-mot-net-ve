# C07 — Claude biên tập nội dung và triển khai UI

- **Người thực hiện:** Claude Opus 5.5 (`claude-opus-5-5`), người viết code duy nhất của C07 theo `docs/task-specs/C07.md`. Antigravity HOLD; không tạo worker; không giao lại.
- **Ngày:** 08/10/2026. **Nhánh** `task/c07-claude-editorial-ui`, tạo từ HEAD đã kiểm.
- **Baseline** `80ff81b37356d345aead982f0bab20266cc9e5c5` (app sạch khi nhận) → **app final `be7ae45e4147bacdee64c35374b052eaa343a49a`**.
- **Phạm vi diff app** (`git diff --stat 80ff81b be7ae45`): 20 file trong `src/` và `tests/`, +2.575/−4.163 dòng. Không đổi `package.json`, lockfile, `astro.config.mjs`, `tsconfig.json`, `public/`; không thêm dependency, font hay ảnh.
- Các thay đổi tài liệu/evidence có sẵn (README, docs/*, reports/* do Codex sở hữu) được giữ nguyên, không stage, không commit, không reset.

## 1. Nguồn đã dùng

- `D:\Downloads\Mang_Theo_Mot_Net_Ve_Final.pdf`, 34 trang, SHA256 `5d27391e…4c0` (kiểm lại khớp). Tôi tự đọc toàn văn bằng pypdf cài vào scratchpad phiên, ngoài repo. Bản trích xuất không vào Git, `public/` hay bundle.
- Đã đọc: AGENTS.md, C07 spec, final-pdf-intake.md, RC06-80ff81b.md, source-calculations.json, architecture.md, open-questions.md, group-content-request.md, brief/workflow/content.
- Trước khi sửa, tôi xem thực tế cả sáu trang ở baseline qua preview `http://127.0.0.1:4322/` (Chrome 154, 375/768/1440). Số đo baseline nằm trong `height-comparison.json`.
- Báo cáo C03 cũ chỉ dùng làm lịch sử. Không khôi phục số 4.935.000 / 4.500.000 / 550.000đ; audit xác nhận bundle không còn các số này.

## 2. Chẩn đoán bản baseline

Bản C06 đúng số liệu, nhưng bề mặt chính bị phủ bởi chi tiết vận hành học phần và cảnh báo lặp lại:

- Minh bạch dài 15.442px ở 375 và 10.610px ở 1440. Ba khối chênh lệch/đối chiếu lặp cùng một ý.
- Trang chủ nhắc "lưu ý đối chiếu ẩm thực" ngay trong phần giới thiệu.
- Sản phẩm hiển thị 7 thẻ ảnh trống "Chưa có ảnh mẫu" rồi lặp lại toàn bộ trong một bảng.
- Về nhóm có khối "Thành viên" gần như rỗng.

Ngoài ra có một số câu **không có trong nguồn Final**:

- Phương án "thời tiết/chuyển vào trong nhà".
- Quy tắc "chi phí phát sinh chỉ giải ngân khi nhóm đồng thuận".
- Bảng lãi ghi chênh 400.000đ là "trừ 2 lần chi phí su kem" như một kết luận.

## 3. Quyết định biên tập

Nguyên tắc: mỗi trang có một mục đích và một hành động chính. Con số và trạng thái đứng trước, phép tính và chi tiết tra cứu nằm trong phần mở rộng (`<details>`). Mỗi disclaimer chỉ xuất hiện một lần ở đúng chỗ. Không lấp chỗ trống bằng ảnh hay placeholder.

| Trang | Giữ / nổi bật | Gộp / rút gọn | Chuyển vào phần mở rộng | Ẩn khỏi bề mặt công chúng | Lý do |
|---|---|---|---|---|---|
| **Trang chủ** | Hero; dải 4 thông tin (nhóm, địa điểm, **5 tuần học phần**, trạng thái); 4 góc chơi dạng danh sách icon; 3 con số kế hoạch kèm nhãn Kế hoạch/Giả định; danh mục 4 mặt hàng cơ sở có tổng; lộ trình 4 chặng; nhóm + đồng hành | Gộp "Minh bạch" và "Sản phẩm" thành một phần "Tiền gây quỹ được tính và dùng thế nào" | — | Ô "Nội dung xem trước"; cảnh báo đối chiếu ẩm thực; 3 thẻ sản phẩm có ảnh trống; ghi chú lặp dưới mỗi section | Người xem lần đầu cần biết dự án là gì, đang ở đâu, tiền đi đâu. Bất định chi tiết thuộc trang Minh bạch |
| **Dự án** | H1 riêng "Một buổi chơi có lựa chọn"; 3 nhu cầu đã trao đổi với Mái ấm (tr.5); 4 góc chơi + ghi chú quyền chọn; thực hành an toàn (tr.7, 11, 20, phụ lục A); quyền quyết định của Mái ấm (tr.26); lộ trình; cách đánh giá (tr.22–25) | "Câu chuyện" + "Mục tiêu" → một phần "Vì sao có dự án"; "Cập nhật" + "Khung đánh giá" → "Cách nhóm sẽ đánh giá" có chip "Chưa có kết quả thực tế" | **Agenda 180 phút** (tr.12–13, mới); **Chỉ tiêu học phần và truyền thông** (8 bài, 300 theo dõi, 200 tương tác, tiếp cận tối thiểu 3.000/phấn đấu 4.000, buổi campus 25 sinh viên) | Thanh mục lục neo; đoạn dài về buổi chia sẻ campus trên bề mặt | Agenda giúp người xem hình dung buổi chơi; chỉ tiêu học phần chỉ dành cho người cần tra cứu, kèm nhãn "không phải thành tích" |
| **Sản phẩm** | **Một bảng danh mục duy nhất**: 4 mặt hàng cơ sở (giá, số lượng, doanh thu nếu bán đủ) + 3 combo có chip "Không tính" + tổng 7.150.000đ; nguồn gốc; kế hoạch bán (tr.14: đặt trước tuần 6, bán tuần 7–8, đồ ăn 2 đợt ≤25 set, điều kiện an toàn thực phẩm) | 7 thẻ + bảng tổng hợp → một bảng (desktop là bảng, mobile xếp dòng có nhãn) | — | 7 khung ảnh "Chưa có ảnh mẫu" (thay bằng icon nhỏ + một dòng ghi chú) | Bảng giá kiểu menu giúp so sánh nhanh và không làm nổi phần chưa có ảnh |
| **Minh bạch** | 4 con số (chi 5.470.000 Kế hoạch; doanh thu 7.150.000 Giả định; còn lại trước quà +1.680.000 Giả định; thực tế "Chưa xác nhận"); **phép tính dạng hàng** 2.200.000 + 4.950.000 − 5.470.000 = +1.680.000; kịch bản hiện vật (6 dòng, gồm dòng "không đủ tài trợ → không cam kết"); "Những điểm hồ sơ chưa thống nhất"; sổ thực tế null; công thức quỹ trước quà / số dư sau bàn giao (tr.23) | 3 cảnh báo + chú giải + 2 khối công thức → 1 phép tính + 1 danh sách "Cần làm rõ"; 2 cột nguyên tắc → 4 dòng | **24 khoản dự toán** (3 nhóm, mở từng nhóm, tổng phụ luôn hiện); **bảng đối chiếu lãi theo nhóm** | Rủi ro "thời tiết", quy tắc "chi phí phát sinh" (không có trong nguồn) | Giữ đủ dự toán, cơ sở tính và bất định; người xem thấy kết luận trước, tra cứu sau. Trang ngắn khoảng một nửa mà không bỏ số liệu nào |
| **Về nhóm** | **7 vai trò theo bảng nhân sự tr.26** (không tên); 5 nguyên tắc; "Ai duyệt và hỗ trợ dự án" (Mái ấm, giảng viên, nhà cung cấp, nhà hỗ trợ — tr.26) | "Thành viên" (rỗng) + "5 nhóm việc" → "Bảy vai trò trong nhóm", ghi rõ hồ sơ có danh sách, tên/ảnh chờ từng người đồng ý | — | Khối thành viên rỗng | Trả lời "ai làm gì" bằng dữ liệu nguồn mà không công bố tên chưa duyệt; không gọi là "chưa có danh sách" |
| **Đồng hành** | Ô "Hiện tại bạn có thể" (3 việc làm được ✓, 1 việc chờ ○); trạng thái liên hệ; 3 cách đồng hành (link chữ); quy trình 3 bước; nguyên tắc vận động nguồn lực (tr.15) | 2 khối liên hệ/thông báo → 1 khối | — | FAQ "các em có bắt buộc tham gia" (đã nằm ở Dự án); nhiều nút ngang hàng | Người muốn giúp cần biết ngay cái gì làm được hôm nay và cái gì đang chờ |

**FAQ** được viết lại: 5 câu cho Sản phẩm, 4 cho Minh bạch, 4 cho Đồng hành. Đây là các câu người xem thực sự hỏi: giá chính thức chưa, ai làm hàng, vì sao combo không tính, khi nào đặt mua, 100% doanh thu?, hiện vật tính thế nào, thiếu tiền trước buổi 1, khi nào có số liệu thực tế, có được đến Mái ấm không, ghi nhận nhà hỗ trợ (mức logo chỉ khi giảng viên đồng ý).

**Hệ thị giác:** giữ hướng B đã duyệt (tokens, chip trạng thái, header, footer). Thêm thành phần dùng chung:

- `KeyFigures`: dải số liệu có nhãn trạng thái.
- `ProductCatalog`: bảng danh mục, mobile xếp dòng có nhãn.
- `ActivityList`, `Timeline`, `Icon`: icon nét tự vẽ, không asset mới.
- `editorial.css`: link mũi tên, ghi chú nguồn, danh sách kẻ dòng, disclosure, bảng xếp dòng mobile, dải CTA theo ngữ cảnh.

`PageHero` cho phép bỏ panel tóm tắt (Minh bạch dùng 4 con số thay cho panel lặp). Xóa `ProductCard`, `ActivityCard`, `StageCard` vì không còn dùng.

**Chiều cao trang** (baseline → final, đo cùng Chrome 154; chi tiết trong `height-comparison.json`):

| Trang | 375 | 768 | 1440 |
|---|---|---|---|
| Trang chủ | 10.401 → 6.285 | 7.755 → 5.068 | 5.838 → 4.006 |
| Dự án | 8.840 → 7.474 | 6.370 → 5.919 | 5.452 → 4.838 |
| Sản phẩm | 8.946 → 6.055 | 7.325 → 4.706 | 6.014 → 3.953 |
| Minh bạch | 15.442 → 7.993 | 13.297 → 6.372 | 10.610 → 5.295 |
| Về nhóm | 5.493 → 4.865 | 4.485 → 4.230 | 3.929 → 3.317 |
| Đồng hành | 7.639 → 4.808 | 6.140 → 4.338 | 4.642 → 3.381 |

Dự án giảm ít vì có thêm nội dung nguồn hữu ích (nhu cầu, an toàn, agenda). Chiều cao đo khi các phần mở rộng đang đóng.

## 4. Số liệu và ràng buộc đã giữ

- Dự toán **24 khoản 5.470.000đ** (14/7/3 khoản: 2.480.000 / 1.860.000 / 1.130.000đ), dẫn xuất từ data, không ghi cứng.
- Doanh thu cơ sở **7.150.000đ** = thủ công 2.200.000 + đồ ăn 4.950.000 (50 × 79.000 + 50 × 20.000). Còn lại trước quà **+1.680.000đ**. Mọi số mang nhãn Kế hoạch/Giả định.
- Không còn cảnh báo 4.500.000/550.000đ.
- Ba combo 60 suất/món: hiển thị với chip "Không tính"; helper mới `buildProductCatalog` luôn trả doanh thu `null` cho combo.
- Lãi trích nguồn 2.070.000/740.000đ so với 2.470.000/340.000đ: trình bày trung thực, mỗi cặp lệch 400.000đ và bù trừ nhau; ghi "không số nào là lãi sản phẩm chính thức".
  - Tôi ghi thêm một quan sát số học kiểm được từ bảng tr.30: khoản su kem 400.000đ xuất hiện ở cả dòng set (3.950.000 − 2.480.000 = 1.470.000) lẫn dòng su kem (1.000.000 − 400.000 = 600.000).
  - Tôi không gọi đó là kết luận, và đã sửa comment trong `finance.ts` cho đúng tinh thần này.
- Kịch bản 500.000đ: ghi rõ bảng chi chỉ có bánh kẹo 340.000 và đồ tặng truyền thông 60.000, danh mục thay chi chưa rõ.
- Hiện vật không cộng vào doanh thu.
- Lịch: "5 tuần học phần, tuần 5–9", ghi chú một số phần còn ghi 4 tuần. Không có ngày cụ thể.
- Actual, contact, tồn kho giữ `null` và hiển thị "Chưa xác nhận". Không form, QR, tài khoản, email hay số điện thoại. Không tên hay ảnh thành viên.
- Không đưa số 17/6 trẻ, "khuyết tật" hay 35 lượt lên giao diện (audit kiểm).
- Câu chuyện nguồn gốc dùng nội dung tr.4–5 ("qua trao đổi với quản lý Mái ấm…"). Tôi không dùng giai thoại "vẽ túi" vì giai thoại này chỉ nằm trong thư dự thảo phụ lục B, vốn ghi "chỉ dùng sau khi Mái ấm duyệt".
- A01 vẫn là ảnh minh họa duy nhất, kèm caption và credit. Không A06–A11; không tải font hay ảnh mới.
- Tests: giữ nguyên 31 test C06; thêm 2 test cho danh mục: combo không vào cơ sở, tổng bằng 7.150.000đ, và null lan truyền thay vì bị bỏ qua. Tổng 33/33.

## 5. Kiểm tra (lệnh thật, exit code)

Chạy trên app đã commit sạch `be7ae45` (log có SHA và timestamp trong `docs/evidence/C07/claude/logs/`):

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm.cmd ci` | 0 | cài theo lockfile |
| `npm.cmd run check` | 0 | 117 files, 0 errors / 0 warnings / 0 hints |
| `node --test tests/finance.test.mjs` | 0 | 33 tests, 6 suites, 0 fail |
| `npm.cmd run build` | 0 | 7 trang, 20 file dist |
| `node docs/evidence/C07/claude/audit-bundle.mjs` | 0 | 14/14 |
| `node docs/evidence/C07/claude/qa-browser.mjs …` | 0 | 223/223 |

**Audit bundle** (`audit-bundle.json`):

- 20/20 file preview phục vụ trùng byte với dist build từ `be7ae45`.
- Không có tên thành viên, số liệu nhạy cảm về trẻ, số tài chính cũ, email/điện thoại/MXH/tài khoản, tên file PDF/nguồn thô, ảnh A06–A11, form hay câu thanh toán.
- Mọi HTML có `noindex, nofollow`.
- Minh bạch đủ 24 dòng, 5 số kế hoạch và các ô thực tế "Chưa xác nhận".

**QA trình duyệt** (`qa-results.json`, Chrome 154.0.8037.98 headless, 375/768 có mobile + touch, 1440 desktop):

- Sáu route trả 200, 404 trả 404; reload trực tiếp được; mỗi trang đúng một H1.
- Không tràn ngang ở 375/768/1440, kể cả khi mở mọi `details` ở 375/768/1024.
- Chữ ≥14px; tương phản computed đạt; ảnh tải đủ, có alt, không méo.
- Không có form, lỗi console, request hỏng hay request ra ngoài.
- Mọi link nội bộ và anchor đều tồn tại; link ngoài chỉ là credit Pexels.
- Skip link nhận focus đầu và đưa focus vào main.
- Menu mobile: mở được; Tab vào trong menu; Escape đóng và trả focus về nút; chọn link thì chuyển trang.
- FAQ và phần mở rộng (dự toán, đối chiếu lãi, agenda) mở/đóng bằng Enter, có vòng focus ở 375 và 1440.
- Vòng focus desktop nhìn thấy được.

**Đã tự xem ảnh:** full-page sáu trang ở 1440, Minh bạch ở 768, cùng các đoạn cắt 375 của Trang chủ, Sản phẩm và Minh bạch (kể cả dự toán mở), menu mở, bảng lãi mở, agenda mở, 404.

**Chẩn đoán trong quá trình làm** (ghi trung thực, chi tiết trong `metadata.json`):

1. Lượt QA đầu báo bảng kịch bản tràn ở 768 (783/768px). Tôi sửa trong app: cho tiêu đề cột xuống dòng và giảm padding dưới 1024px; bản sửa nằm trong commit `be7ae45`.
2. Kiểm tra skip link ban đầu đọc vị trí giữa lúc chuyển động 150ms. Test được sửa để chờ 400ms; app không đổi.
3. Ảnh menu/disclosure lần đầu chụp giữa lúc icon đang xoay, nên đã chụp lại sau 400ms; kết quả kiểm không đổi.

## 6. Preview

`http://127.0.0.1:4322/`: server tĩnh có sẵn, PID **28852**, chỉ bind 127.0.0.1 (đã kiểm bằng `Get-NetTCPConnection`), phục vụ thư mục `dist/` vừa build từ `be7ae45`. Tôi không khởi động hay dừng server. Không deploy public, không push GitHub.

## 7. Nội dung chỉ nhóm có thể cung cấp

Đối chiếu với `docs/group-content-request.md`, các mục sau vẫn còn mở. Giao diện đã có chỗ hiển thị và nhãn chờ cho từng mục.

1. **Lịch chính thức**: thống nhất 4 hay 5 tuần, ngày hai buổi, có ngày duyệt. Vị trí: dải thông tin Trang chủ, panel Dự án, Timeline.
2. **Combo 60 suất/món** bán thêm hay thay cho 50 set, kèm bảng nguyên liệu tương ứng. Vị trí: bảng Sản phẩm, "Cần làm rõ".
3. **Phân bổ lãi** đồ ăn/thủ công (lệch 400.000đ mỗi nhóm).
4. **Danh mục thay chi 500.000đ** và hình thức tiền/hiện vật.
5. **Quy cách** bột chiên xù, dầu ăn; cách chia đợt khoai tây, dưa chuột.
6. **Đồng ý công bố tên/ảnh** của 7 thành viên. Khi có, thêm tên vào thẻ vai trò ở Về nhóm.
7. **Ảnh mẫu thật** của 4 mặt hàng cơ sở, chụp cùng nền và góc. Vị trí: ô icon trong bảng danh mục.
8. **Kênh liên hệ đã duyệt** (`OFFICIAL_CONTACT`). Trang Đồng hành tự hiện chip "Đã xác nhận" khi status là confirmed và có email/điện thoại.
9. **Danh mục hiện vật** Mái ấm xác nhận; số liệu thực tế sau đối soát; quyền dùng tranh của các em trên móc khóa.

## 8. Giới hạn

- Chỉ kiểm bằng Chrome headless với touch emulation. Chưa kiểm thiết bị thật, Safari/Firefox, trình đọc màn hình; chưa phải audit WCAG đầy đủ.
- Script QA dùng puppeteer-core có sẵn trong thư mục scratch của Antigravity trên máy. Đó không phải dependency của app; chạy lại trên máy khác cần trỏ lại đường dẫn này.
- Chiều cao "after" đo khi các phần mở rộng đang đóng; mở toàn bộ thì trang dài hơn (đã kiểm không tràn ngang).
- Ghi chú từng dòng dự toán giữ nguyên chữ trong data C06; một số dòng chỉ nhắc lại tên khoản. Tôi không sửa để tránh đổi dữ liệu nguồn ngoài phạm vi cần thiết.

## 9. Bằng chứng

`docs/evidence/C07/claude/`:

- `metadata.json`: SHA, lệnh, preview, chẩn đoán.
- `logs/npm-ci.log`, `logs/check.log`, `logs/test.log`, `logs/build.log`.
- `audit-bundle.mjs` / `audit-bundle.json`.
- `qa-browser.mjs` / `qa-results.json`: headSha `be7ae45`, appTreeClean true.
- `height-comparison.json`.
- `screens/`: 21 ảnh full-page (6 trang + 404 × 375/768/1440), menu mở 375, FAQ ba trang, dự toán/đối chiếu lãi/agenda mở, focus 1440.

**Trạng thái: HOLD.** Chờ Codex review. Không có task triển khai mới, không deploy hay push.
