# C18 — Cập nhật nội dung công khai theo PDF V3 (40 trang)

Quản lý/reviewer: Claude. Người thực hiện duy nhất: Antigravity. Chủ dự án đã yêu cầu trực tiếp ngày 15/10/2026.
Căn cứ bắt buộc đọc trước: `docs/source-intake/V3-40-trang-delta-20261015.md` (bảng chênh lệch có tham chiếu trang, các mục P1–P11 chờ xác nhận). Đường dẫn tuyệt đối: `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\docs\source-intake\V3-40-trang-delta-20261015.md`.

## Phạm vi và nơi làm việc

- **Chỉ làm trong worktree** `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve-c18-v3`, nhánh `task/c18-v3-content`, nền `origin/main` `0848d12`. `node_modules` là junction sẵn có, không cài thêm.
- **Không** sửa workspace chính (nhánh `task/c17-online-studio`) ngoài thư mục bằng chứng ở dưới. **Không** sửa `apps/studio`, `tools/`, `public/`, `astro.config.mjs`, `package*.json`, lockfile, ảnh, QR, `reconciled-donations.json`, `product-sales-config.json`, `published-snapshot.json`.
- Được sửa: `src/data/campaign.ts`, `src/data/journal-entries.json`, `src/pages/index.astro`, và các kiểm thử trong `tests/` ở mức cần thiết để khớp giá trị mới. Nếu thấy một chuỗi cần đổi nằm ngoài danh sách này, **dừng và báo**, không tự mở rộng.
- Không push, không merge, không deploy, không đụng mạng/Cloudflare/GitHub. Không `git add -A`, không `reset/clean/stash`.
- Commit duy nhất trên nhánh c18, chỉ liệt kê tường minh các tệp đã sửa. Thông điệp: `feat(c18): cap nhat noi dung theo de xuat V3 (lich, hoat dong, vai tro, nguon trang)`.
- Bằng chứng và báo cáo viết vào **`C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\docs\evidence\C18\worker\`** (đường dẫn tuyệt đối, ngoài worktree c18; không commit ở nhánh c18).

## Bất biến (không được đổi)

Mục tiêu 3.000.000đ; tài khoản Techcombank `19072950239011`, `NGUYEN NGOC KHOA`, ảnh QR; sổ `reconciled:false`, `reconciledAt:null`, `entries:[]`; giá tham khảo 40.000đ/bộ và 10.000đ/chiếc; `officialPrice`, tồn kho thực tế đều `null`; `saleStatus: 'unconfirmed'`; mọi `*actual*` là `null`; hai số liên hệ và fanpage; bảy tên và ảnh thành viên; mọi số tiền dự toán (5.470.000 / 7.150.000 / 1.680.000 / 4.950.000 / 2.200.000 / 2.070.000 / 740.000 và năm kịch bản). Không thêm số liệu, ngày, liên hệ, ảnh hay tên mới ngoài danh sách dưới đây. Không dùng gradient, không thêm thư viện.

## Thay đổi cần làm (giá trị cuối cùng, chép đúng)

### A. `src/data/campaign.ts`

**A1. `CAMPAIGN_PROJECT`**
- `statusNotice`: `'Đang triển khai · tuần 2'`
- `previewNotice`: `'Bản xem trước — nội dung theo đề xuất V3 (tháng 10/2026), chờ xác nhận.'`
- `activities` (giữ `id` và `badge`, đổi các trường dưới):
  - `chuon-chuon-tre`: `title` `'Trang trí chuồn chuồn tre'`; `description` `'Phiên sáng tạo 1 (khoảng 50 phút): các em chọn màu, thêm họa tiết hoặc tô cùng sinh viên; người hỗ trợ giữ phôi khi cần. Em muốn tiếp tục vẫn được làm tiếp ở phiên sau.'`; `note` `'Mỗi em được chọn trang trí, quan sát, đổi hoạt động hoặc nghỉ; sản phẩm của các em được để khô và giữ lại Mái ấm.'`
  - `to-tuong`: `title` `'Tô tượng và giấy ước mơ'`; `description` `'Phiên sáng tạo 2 (khoảng 50 phút): tô tượng 10 cm trên khay chắc, tô từng vùng cùng sinh viên; có thêm hoạt động giấy ước mơ.'`; `note` `'Hoạt động vui chơi tại chỗ, không đặt chỉ tiêu hoàn thành và không gắn với hàng gây quỹ.'`
  - `hat-cung-nhau`: `title` `'Hát, trò chuyện và chia sẻ'`; `description` `'Hát các bài quen theo gợi ý của Mái ấm và trò chuyện; em nào muốn có thể giới thiệu sản phẩm của mình, hai cụ cùng hát hoặc trò chuyện.'`; `note` giữ nguyên.
  - `tro-choi-nhe`: `description` `'Bowling bóng mềm rồi chuyền bóng theo nhạc, lượt ngắn và có thể chơi khi ngồi; khi nhạc dừng, em cầm bóng có thể chọn một cử chỉ vui hoặc bỏ lượt. Có trò "Gương vui" nhẹ ở giờ nghỉ.'`; `note` giữ nguyên. (Dùng dấu nháy kép thẳng trong chuỗi bọc dấu nháy đơn là hợp lệ; nếu linter phàn nàn, dùng dấu nháy cong “Gương vui”.)
- `plannedStages`:
  - bước `02` mô tả: `'Tiếp nhận ủng hộ qua chuyển khoản và dự kiến bán quà lưu niệm; dự kiến mở đặt trước từ tuần 6 và bán chính ở tuần 7–8. Hai nguồn được ghi riêng; khoản ủng hộ được công bố sau đối soát.'`
  - bước `03` mô tả: `'14:00 Thứ Bảy 31/10/2026 (dự kiến). Khoảng 180 phút, bốn hoạt động và hai lần nghỉ chung; có thể rút ngắn theo ý Mái ấm.'`
  - bước `04` mô tả: `'14:00 Thứ Bảy 07/11/2026 (dự kiến). Chốt quỹ, mua vật phẩm theo danh mục Mái ấm xác nhận, gặp lại các em và trao tặng.'`

**A2. `PLANNED_SESSIONS`**: `buoi-choi` → `date '2026-10-31'`, `time '14:00'`, `description 'Bốn hoạt động, khoảng 180 phút, có hai lần nghỉ chung (dự kiến tuần 8).'`; `trao-qua` → `date '2026-11-07'`, `time '14:00'`, `description 'Gặp lại các em, trao vật phẩm theo danh mục Mái ấm xác nhận, khoảng 30–45 phút (dự kiến tuần 9).'`. `weekday` vẫn `'Thứ Bảy'` (cả hai ngày là Thứ Bảy). Cập nhật chú thích phía trên để nói nguồn là đề xuất V3 (lịch ngày đổi 15/10/2026; giờ giữ theo thông tin 09/10, chờ xác nhận).

**A3. `PROJECT_PROGRESS`**: `currentWeek: 2`, `totalWeeks: 5`, `updatedAt: '2026-10-12'`, `currentStageIndex: 0`. (Khớp bản nháp Studio production mà chủ dự án đã sửa 13/10; không đặt giai đoạn khác.)

**A4. `TEAM_MEMBERS`** (giữ `name`, `photo`; đổi `role`, `description`):
| name | role | description |
| --- | --- | --- |
| Nguyễn Chí Trung | `Trưởng dự án` | `Lịch, họp tuần, theo dõi tiến độ, làm việc với giảng viên và điều phối hoạt động nhóm.` |
| Nguyễn Ngọc Khoa | `Tài chính, thủ quỹ` | `Sổ thu chi, hóa đơn, đối soát cuối mỗi ca, báo cáo công khai và mua quà theo danh mục.` |
| Nguyễn Như Huy | `Hậu cần, phụ trách chương trình` | `Đơn đặt hàng, tồn kho, chế biến, vận chuyển, dựng quầy, an toàn thực phẩm và chương trình buổi chơi.` |
| Trịnh Hiển Lân | `Truyền thông, nội dung` | `Lịch đăng bài, viết bài, báo cáo số liệu truyền thông và duyệt hình ảnh đúng phạm vi cho phép.` |
| Trần Bình Trọng | `Thiết kế, nội dung` | `Slide, poster, infographic; lưu ảnh và video có nguồn, ngày giờ.` |
| Lê Tuấn Anh | `Đối ngoại, thiết kế` | `Đầu mối với Mái ấm và nhà tài trợ; thiết kế poster, infographic.` |
| Nguyễn Anh Khoa | `Hậu cần, bán hàng gây quỹ` | `Đơn đặt hàng, tồn kho, chế biến, vận chuyển, dựng quầy, an toàn thực phẩm và bán hàng gây quỹ.` |

`TEAM_AREAS` (giữ `title`, `members`; đổi `description`): `Điều phối` → `'Lịch, họp tuần, theo dõi tiến độ và kết nối các mảng việc của nhóm.'`; `Tài chính` → `'Sổ thu chi, hóa đơn, đối soát sau mỗi ca bán và mua quà theo danh mục.'`; `Hậu cần và chương trình` → `'Đơn hàng, tồn kho, chế biến, vận chuyển, dựng quầy, an toàn thực phẩm và chương trình buổi chơi.'`; `Nội dung và truyền thông` → `'Thiết kế ấn phẩm, viết bài, lịch đăng, báo cáo số liệu và lưu ảnh, video đúng phạm vi cho phép.'`; `Đối ngoại` → `'Đầu mối với Mái ấm và nhà tài trợ, thiết kế poster và infographic.'`.

**A5. `PLAY_FLOW`** (đúng ba phần):
1. `'Làm quen và chơi kết nối'`: `'Đón các em, giới thiệu vật mẫu, cách tích con dấu và chỗ nghỉ; sau đó chơi bowling bóng mềm rồi chuyền bóng theo nhạc (khoảng 35 phút).'`
2. `'Hai phiên sáng tạo'`: `'Phiên 1 trang trí chuồn chuồn, phiên 2 tô tượng và giấy ước mơ, mỗi phiên khoảng 50 phút; có hai lần nghỉ chung, em muốn tiếp tục chuồn chuồn vẫn được làm tiếp.'`
3. `'Giao lưu và đổi quà'`: `'Hát, trò chuyện, chia sẻ sản phẩm, đổi quà từ dấu đã tích và ăn bánh kẹo (khoảng 25 phút); mọi em đều có phần quà chung.'`
Cập nhật chú thích phía trên: agenda dự kiến 180 phút theo V3 trang 13–14.

**A6. `SAFETY_PRACTICES`**: mục 3 → `'Trò chơi vận động nhẹ với bóng mềm, có thể chơi khi ngồi, không loại người chơi.'`; thêm mục 5 → `'Con dấu tích điểm chỉ dùng khi em đồng ý, mực ghi rõ dùng trên da và được Mái ấm chấp thuận.'` Các mục 1, 2, 4 giữ nguyên.

**A7. `SALES_PLAN`** (bốn mục theo thứ tự):
1. `'Nhóm dự kiến mở đặt trước từ tuần 6, bán chính ở tuần 7–8 và giao hàng trước buổi gặp lại; bán trực tiếp tại quầy ở FPT Hòa Lạc khi được cho phép.'`
2. `'Đồ ăn dự kiến chia hai đợt, tối đa 25 set mỗi đợt, chỉ bán trong trường khi đáp ứng điều kiện an toàn thực phẩm và quy định học phần.'`
3. giữ mục cũ `'Mẫu, giá chính thức và lịch nhận hàng sẽ được công bố tại trang này khi mở bán.'`
4. giữ mục cũ `'Tiền bán quà ghi sổ riêng, không cộng vào tổng ủng hộ; công khai trong báo cáo cuối.'`

**A8. Quy tắc tranh của các em (V3 trang 9, 15)**: móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, kèm lời cảm ơn ở mặt sau; **không dùng tranh của các em trong buổi sinh hoạt**. Thay mọi chuỗi cũ nói "tranh của các em chỉ được in khi có đồng ý" bằng quy tắc mới, cụ thể:
- `PRODUCTS` `moc-khoa.planNotes`: `'Nhóm Lăng Kính chuẩn bị và hoàn thiện. Móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, kèm lời cảm ơn ở mặt sau; không dùng tranh của các em trong buổi sinh hoạt. Nhóm chịu trách nhiệm hàng bán, không giao sản lượng cho các em nhỏ.'`
- `PLANNED_EXPENSES` `moc-khoa.note`: `'Móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, kèm lời cảm ơn ở mặt sau (trang 36)'`
- `PRODUCT_FAQS[1].answer`: câu cuối thay bằng `'Móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, không dùng tranh của các em trong buổi sinh hoạt.'`; các câu trước giữ nguyên.
- Tìm thêm bằng `grep -rn "in lên móc khóa\|in tranh\|tranh của các em\|được in" src` và xử lý cùng quy tắc; báo lại các vị trí đã sửa.
- `PLANNED_EXPENSES` `mau-ve.note`: `'Trang trí chuồn chuồn và tô tượng (trang 35–36)'` (V3 không còn "vẽ tranh").

**A9. Tham chiếu nguồn (đổi tiền tố `proposal-final` → `proposal-v3`, số trang theo V3):**
- Nhóm 1 nguyên liệu thực phẩm (14 khoản): `sourceRef 'proposal-v3:page-34'`; mọi chú thích `(trang 29)` → `(trang 34)`; comment nhóm: `trang 34`.
- Nhóm 2 vật tư workshop (7 khoản): `'proposal-v3:page-35-36'`; `(trang 30)` → `(trang 35–36)`; comment: `trang 35–36`.
- Nhóm 3 phát sinh (3 khoản): `'proposal-v3:page-37'`; `(trang 31)` → `(trang 37)`.
- `FINANCE_SCENARIOS` (5 kịch bản): `'proposal-v3:page-37-38'`.
- `FINANCE_OVERVIEW.foodPlannedRevenueAssumption.sourceRef`: `'proposal-v3:page-34-35'`.
- `PRODUCTS`: `chuon-chuon-tre-kem-de` và `moc-khoa` → `'proposal-v3:page-36'` (cả `referencePrice` và `plannedQuantity`), chú thích `(trang 30)` → `(trang 36)`; `set-do-an` → `'proposal-v3:page-34'`, `(trang 34)`; `combo-nem-gion` → `'proposal-v3:page-34'`; `combo-nem-xu`, `combo-nem-pho-mai`, `banh-su-kem` → `'proposal-v3:page-35'`; các chú thích `(trang 29)` tương ứng → `(trang 34)` hoặc `(trang 35)` theo sản phẩm.
- Chú thích đầu tệp `(C06 - Final PDF)` có thể giữ; thêm một dòng: `Cập nhật nguồn sang đề xuất V3 40 trang ngày 15/10/2026 (docs/source-intake/V3-40-trang-delta-20261015.md).`

**A10. Combo và diễn giải tài chính:**
- `combo-nem-gion.planNotes`: `'Bảng giá trong đề xuất V3 ghi 60 suất nhưng không gộp vào doanh thu cơ sở; phần giải pháp bán hàng (trang 15) chỉ nêu sản lượng mục tiêu 50 set và 50 hộp su kem. Nhóm cần xác nhận có bán combo này hay không (nguyên liệu nem 300 chiếc chỉ đủ cho 50 set × 6 nem).'`
- `combo-nem-xu.planNotes` và `combo-nem-pho-mai.planNotes`: `'Bảng giá trong đề xuất V3 ghi 60 suất nhưng không gộp vào doanh thu cơ sở; phần giải pháp bán hàng (trang 15) chỉ nêu sản lượng mục tiêu 50 set và 50 hộp su kem. Nhóm cần xác nhận có bán combo này hay không.'`
- `FINANCE_OVERVIEW.disclaimer`: `'Các con số trên thuộc dự toán trong đề xuất dự án bản V3 (tháng 10/2026). Doanh thu cơ sở tính trên giả định bán đủ 30 bộ chuồn chuồn tre, 100 móc khóa, 50 set đồ ăn và 50 hộp bánh su kem. Ba combo món ăn có trong bảng giá của đề xuất nhưng không nằm trong sản lượng mục tiêu và chưa tính vào kịch bản cơ sở; nhóm cần xác nhận có bán hay không. Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.'`
- Giữ `foodProfitGap`, `craftProfitGap` và chú thích chênh lệch 400.000đ như hiện có (V3 vẫn có chênh lệch, mục P4).

**A11. `TRANSPARENCY_FAQS`**: thêm một câu hỏi vào cuối danh sách:
`question: 'Quỹ dùng để mua quà được tính như thế nào?'`, `answer: 'Theo đề xuất, quỹ có thể dùng trước khi mua quà bằng tiền bán hàng và tài trợ tiền đã nhận, trừ chi phí tổ chức và gây quỹ đã trả, chi phí còn phải trả và tiền khách đã trả cho đơn chưa hoàn tất. Mỗi khoản chỉ được trừ một lần; hiện vật chỉ giảm đúng khoản chi mà nó thay thế và không được quy thành tiền mặt.'`

### B. `src/data/journal-entries.json`

- Bài `ke-hoach-bon-goc-choi`: `eventDate` → `"2026-10-31"`; khối `paragraph` đầu → `Tại Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội), nhóm sinh viên Lăng Kính dự kiến tổ chức một buổi vui chơi sáng tạo trong khoảng 180 phút vào chiều Thứ Bảy 31/10/2026. Để buổi chơi mang lại niềm vui vừa sức, nhóm xây dựng kế hoạch gồm bốn hoạt động: trang trí chuồn chuồn, tô tượng và giấy ước mơ, trò chơi nhẹ, hát và giao lưu, xen hai lần nghỉ chung; các em tự do chọn hoạt động hoặc nghỉ ngơi.`
  Danh sách bốn mục (đúng thứ tự, tiền tố giữ):
  1. `Góc tạo hình: Trang trí chuồn chuồn tre ở phiên sáng tạo 1; các em chọn màu, thêm họa tiết hoặc tô cùng sinh viên, em muốn tiếp tục vẫn được làm tiếp.`
  2. `Góc tô màu: Tô tượng 10 cm ở phiên sáng tạo 2, kèm hoạt động giấy ước mơ; các em tự tô hoặc chọn màu để sinh viên hỗ trợ.`
  3. `Góc âm nhạc: Hát các bài quen theo gợi ý của Mái ấm, trò chuyện và chia sẻ sản phẩm, không áp lực biểu diễn.`
  4. `Góc vận động nhẹ: Bowling bóng mềm và chuyền bóng theo nhạc với lượt ngắn, có thể chơi khi ngồi; khi nhạc dừng, em cầm bóng có thể chọn một cử chỉ vui hoặc bỏ lượt.`
  Các khối còn lại (heading, callout, paragraph an toàn, quote) giữ nguyên. `publishedAt`, `coverImage`, `slug`, `title`, `summary` giữ nguyên.
- Bài `gioi-thieu-qua-luu-niem-gay-quy`: mục thứ hai của danh sách → `Móc khóa Lăng Kính: Dự kiến 100 chiếc với giá tham khảo 10.000đ/chiếc, in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, kèm lời cảm ơn ở mặt sau; không dùng tranh của các em trong buổi sinh hoạt.`; khối `callout` → `Trạng thái hiện tại: Chưa mở bán. Website hiện chưa nhận đơn đặt hàng hoặc thanh toán sản phẩm. Theo kế hoạch, nhóm dự kiến mở đặt trước từ tuần 6 và bán chính ở tuần 7–8 tại khuôn viên Đại học FPT Hòa Lạc, sau khi hoàn tất chuẩn bị mẫu và được phê duyệt.` Còn lại giữ nguyên.
- JSON phải hợp lệ và qua `validateJournalEntriesList` (build sẽ kiểm).

### C. `src/pages/index.astro`

Hai chuỗi cứng ở mảng `steps` (khoảng dòng 39 và 44) phải **sinh từ `PLANNED_SESSIONS`** thay vì gõ cứng ngày, để không lệch lại:
- Buổi chơi: `` `Dự kiến chiều Thứ Bảy ${dd/mm của buoi-choi}, khoảng 180 phút với bốn hoạt động. Mỗi em có thể lựa chọn cách tham gia phù hợp với sở thích và thể trạng, quan sát hoặc nghỉ ngơi.` ``
- Trao quà: `` `Dự kiến chiều Thứ Bảy ${dd/mm của trao-qua}, trao tặng vật phẩm theo danh mục Mái ấm xác nhận, kèm hóa đơn và biên bản bàn giao.` ``
Dùng `formatViDate(date).slice(0, 5)` như `sessionText` đã làm. Kết quả hiển thị phải là `31/10` và `07/11`.

### D. Kiểm thử (`tests/`)

- `donations.test.mjs`: phiên dự kiến → `['2026-10-31 14:00', '2026-11-07 14:00']`; `PROJECT_PROGRESS.currentWeek === 2`; thêm khẳng định `PROJECT_PROGRESS.updatedAt === '2026-10-12'`. Ví dụ `formatViDate('2026-10-24')` là kiểm thử hàm định dạng, có thể giữ.
- `finance.test.mjs`: các bộ lọc và khẳng định `proposal-final:page-29/30/31/32` → `proposal-v3:page-34`, `page-35-36`, `page-37`, `page-37-38` tương ứng; kiểm tra tiền tố `proposal-v3:page-`; tiêu đề kiểm thử nhắc "trang 32" → "trang 37–38". Tổng nhóm vẫn 2.480.000 / 1.860.000 / 1.130.000 và số khoản 14 / 7 / 3.
- Thêm kiểm thử nhỏ (nơi phù hợp): (1) hai ngày phiên là Thứ Bảy và theo đúng thứ tự thời gian; (2) không còn chuỗi `24/10` hay `proposal-final` trong `src/` (ngoại trừ chú thích lịch sử nếu có, nêu rõ); (3) `SALES_PLAN` có đúng 4 mục; (4) `TEAM_MEMBERS` vẫn 7 tên, ảnh khác nhau.
- Có thể điều chỉnh kiểm thử khác nếu giá trị mới làm chúng đỏ; mỗi điều chỉnh phải nêu lý do trong báo cáo. Không xóa kiểm thử để vượt qua.

## Cổng nghiệm thu (chạy trong worktree c18, ghi exit code và nhật ký thật)

1. `npm run check` — 0 lỗi, 0 cảnh báo.
2. `npm test` — toàn bộ pass (hiện 92 kiểm thử trên main; số có thể tăng).
3. `npm run build` — exit 0.
4. `git diff --stat origin/main..HEAD` chỉ gồm các tệp trong phạm vi.
5. `grep -rn "24/10\|2026-10-24\|proposal-final\|vẽ tranh tự do\|thẻ màu ghép hình" src` — chỉ còn kết quả được giải trình.
6. Không đổi byte nào trong `public/`.

## Báo cáo

Viết `...\docs\evidence\C18\worker\report.md` (đường dẫn tuyệt đối ở trên) gồm: SHA nền và SHA commit, danh sách tệp, từng mục A1–D đã làm/chưa làm và vì sao, kết quả bốn lệnh kèm exit code, các vị trí `grep` ở A8, mọi điều chưa chắc. Không bịa kết quả; nếu một mục không làm được thì ghi chưa làm. Sau đó gửi `worker_done` theo giao thức Orca và dừng. Mọi mâu thuẫn mới phát hiện trong PDF-không-có-trong-repo: bạn **không có PDF**, chỉ dùng bảng delta và tệp này; nếu cần thông tin chưa có, hỏi qua `orchestration ask`.
