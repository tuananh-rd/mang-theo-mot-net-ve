# Báo cáo Triển khai Task C14 — Bốn Nâng cấp Hệ thống Website "Mang Theo Một Nét Vẽ"

- **Người thực hiện:** Antigravity (App Worker)
- **Người review & điều phối:** Codex
- **Nhánh làm việc:** `task/c14-content-tools` (baseline `b4ed9120efe7b3f14cbef09855401167b24cbb68`)
- **Commit bàn giao:** `d7360e8febebde9ca0f6411e01baf9c69714f93a` (sửa từ `0e7f0f6d3583207be76882df46fa22a55d790cd1`)
- **Mã Task Orca:** `task_7fec7cc22816`
- **Mã Dispatch Orca:** `ctx_97dc3fd1c689`
- **Thời gian:** 11/10/2026

---

## 1. Tóm tắt Tổng quan (Executive Summary)

Theo đặc tả `docs/task-specs/C14.md` và các yêu cầu sửa đổi trong review `docs/reviews/RC14-0e7f0f6.md`, Antigravity đã hoàn thành triển khai 4 nâng cấp và khắc phục toàn bộ 5 mục được yêu cầu sau review RC14 trên nhánh `task/c14-content-tools`:
1. **Nâng cấp 1 (Project Journal):** Hệ thống Nhật ký dự án (`/nhat-ky`, `/nhat-ky/[slug]`, tích hợp Trang chủ và Trang dự án); bài viết kế hoạch chuẩn xác, draft cách ly hoàn toàn, sắp xếp mới nhất trước (newest-first), chú thích ảnh và nguồn ảnh hiển thị đầy đủ, không bị cắt.
2. **Nâng cấp 3 (Mobile Donation Experience):** Trải nghiệm ủng hộ di động (thanh sticky bar neo đáy `src/components/MobileDonationBar.astro`, nút chuyển khoản thủ công có copy một chạm tại `src/components/DonationPanel.astro`, nút chia sẻ chuẩn tên miền chính thức `https://mangtheomotnetve.website/`, safe-area offset).
3. **Nâng cấp 5 (Product Details & Purchase Inquiry Flow):** Trang chi tiết cho 2 sản phẩm thủ công (`/san-pham/[slug]`), mô hình bán hàng hiệu lực đồng bộ, form soạn tin nhắn đặt mua an toàn (không tạo cổng thanh toán/đơn hàng giả). Đã chỉnh bố cục form ở viewport 375px: không tràn chiều ngang (clientWidth = scrollWidth = 375px), nút sao chép kích hoạt đầy đủ và tương tác tốt bằng click/tap/keyboard.
4. **Nâng cấp 6 (Local Content Studio):** Bộ công cụ quản trị nội bộ loopback-only (`http://127.0.0.1:4323` và CLI `tools/content-studio/cli.mjs`), xác thực CSV RFC 4180 và JSON sao kê qua giao diện nhập văn bản, quy trình đối soát 2 người bắt buộc, bảo vệ PII nghiêm ngặt và chống xung đột mã băm SHA-256. Bổ sung cơ chế xác thực và chiếu công khai (public projection) tại build boundary, từ chối build xuất bản nếu sổ đối soát chưa được phê duyệt (`publicApproval !== 'approved'`).

Toàn bộ 92 bài kiểm thử tự động đạt PASS, `astro check` đạt 0 lỗi / 0 cảnh báo, 13 route tĩnh được biên dịch hoàn chỉnh trong `dist/`. Tệp dữ liệu gốc giữ nguyên trạng thái baseline rỗng (`reconciled: false`, `entries: []`).

---

## 2. Chi tiết Triển khai và Khắc phục Sau Review RC14

### 2.1. Nâng cấp 1: Nhật ký dự án (Project Journal)
- **Tách biệt dữ liệu và giao diện:**
  - Định nghĩa dữ liệu tại `src/data/journal-entries.json` và module `src/data/journal.ts`.
  - Kiểm tra schema nghiêm ngặt tại read/build boundary bằng `validateJournalEntriesList`.
- **Cấu trúc bài viết theo khối (Structured Content Blocks):**
  - Hỗ trợ các khối: `paragraph`, `heading` (h2, h3), `quote`, `callout`, `list`, `image`.
  - Khởi tạo 2 bài viết ban đầu trung thực theo dữ liệu kế hoạch: `ke-hoach-bon-goc-choi` và `gioi-thieu-qua-luu-niem-gay-quy`. Không phóng đại hay bịa đặt sự kiện thực tế.
- **Cách ly bài viết bản nháp (Draft Isolation):**
  - Các bài viết ở trạng thái `status: 'draft'` bị loại bỏ hoàn toàn khỏi `getPublishedJournalEntries()`, không sinh trang tĩnh `/nhat-ky/[slug]` và không xuất hiện trên giao diện công khai.
- **Sắp xếp thời gian & Bảo toàn trạng thái sự kiện:**
  - `getPublishedJournalEntries()` tự động sắp xếp mới nhất trước (newest-first) theo ngày biên tập `publishedAt`.
  - Khớp nối đầy đủ union trạng thái sự kiện: `'planned' | 'in_progress' | 'completed' | 'cancelled' | null` xuyên suốt TypeScript types, validator runtime và Content Studio GUI.
- **Hiển thị chú thích ảnh & Bản quyền minh bạch:**
  - Tách biệt vùng khung hình ảnh (`.journal-card-img-wrap` với 16:9 crop) khỏi `<figcaption>`, giúp toàn bộ chú thích và credit hiển thị rõ ràng, không bị clipping ở bất kỳ viewport nào.

### 2.2. Nâng cấp 3: Trải nghiệm Ủng hộ Di động (Mobile Donation Experience)
- **Thanh điều hướng neo đáy (`src/components/MobileDonationBar.astro`):**
  - Tự động xuất hiện trên màn hình nhỏ (<768px), cuộn mượt đến mục quét mã QR (`#chuyen-khoan`).
  - Sử dụng khoảng đệm an toàn `env(safe-area-inset-bottom, 0px)` chống che lấp nội dung.
  - Tích hợp nút Chia sẻ (Web Share API) với fallback sao chép URL công khai; sử dụng tên miền chính thức `https://mangtheomotnetve.website/`, không chia sẻ localhost.
- **Khối thông tin chuyển khoản (`src/components/DonationPanel.astro`):**
  - Hướng dẫn rõ ràng 2 cách ủng hộ tiện lợi: tải ảnh mã QR để quét từ thư viện ứng dụng ngân hàng, hoặc chuyển khoản thủ công.
  - Số tài khoản và nội dung chuyển khoản có nút sao chép một chạm kèm thông báo live polite.
  - Cập nhật URL chia sẻ trang về tên miền chính thức `https://mangtheomotnetve.website/` (thay thế tên miền pages.dev cũ theo RC14 mục 1).
  - Neo liên kết trực tiếp `#sao-ke` dẫn tới khu vực đối soát minh bạch.

### 2.3. Nâng cấp 5: Chi tiết Sản phẩm & Luồng Soạn Yêu cầu Mua
- **Trang chi tiết sản phẩm thủ công (`src/pages/san-pham/[slug].astro`):**
  - Tạo trang chi tiết cho 2 mặt hàng thủ công có kế hoạch làm quà lưu niệm: `chuon-chuon-tre-kem-de` và `moc-khoa`. Không tạo trang cho các mặt hàng ẩm thực cũ.
- **Mô hình bán hàng hiệu lực thống nhất (`src/lib/products.ts`):**
  - Đồng bộ logic giữa SSR và Client script: đọc cấu hình từ `src/data/product-sales-config.json`.
  - Phân định rõ ràng: khi trạng thái là `open` và đã chốt giá chính thức, hiển thị giá niêm yết; ngược lại hiển thị giá tham khảo kế hoạch.
  - Tự động giới hạn số lượng đặt mua tối đa theo số lượng kho có sẵn (`stockAvailable`).
  - Khóa hoàn toàn luồng đặt mua nếu `stockAvailable === 0`.
- **Cơ chế kích hoạt an toàn (Gating Rule):**
  - Form soạn yêu cầu mua CHỈ mở khi: `saleStatus === 'open'`, `officialPrice > 0`, `publicApproval === 'approved'`, có thông tin kênh bán, chính sách đổi trả và `stockAvailable > 0`.
  - Khi chưa đủ điều kiện, giao diện hiển thị trạng thái "Chờ mở bán" kèm thông tin kênh nhận và chính sách dự kiến.
- **Trình tạo tin nhắn yêu cầu mua (`formatPurchaseInquiry`):**
  - Tạo sẵn mẫu văn bản gửi Fanpage Facebook hoặc liên hệ trực tiếp; tính toán tổng tiền tạm tính chính xác.
  - Tuyệt đối không tạo giỏ hàng thương mại điện tử giả, không lưu đơn hàng mock và không tích hợp cổng thanh toán giả lập.
- **Khắc phục tràn 32px ở viewport 375px (RC14 mục 2):**
  - Bổ sung `min-width: 0; max-width: 100%` cho `.product-visual` và `.product-info`.
  - Điều chỉnh `.product-layout` thành `grid-template-columns: minmax(0, 1fr)`.
  - Thêm `@media (max-width: 600px)`: padding card `var(--space-4)`, bố cục `.calc-row` dạng cột linh hoạt với `.calc-qty-group`, `.calc-subtotal` trải đều, các nút bấm trong `.inquiry-actions` chiếm 100% chiều rộng để dễ thao tác trên màn hình cảm ứng.
  - Đo lường thực tế tại viewport 375px: `clientWidth: 375px`, `scrollWidth: 375px` (hoàn toàn không còn tràn).
  - Thao tác click sao chép `#copy-inquiry-btn` kích hoạt thành công, đưa đúng nội dung tin nhắn mẫu vào bộ nhớ tạm. Ảnh chụp kiểm thử lưu tại `docs/evidence/C14/antigravity/fixture-purchase-copy-375.png`.

### 2.4. Nâng cấp 6: Công cụ Cập nhật Nội bộ (Local Content Studio)
- **Kiến trúc Loopback An toàn (`tools/content-studio/server.mjs`):**
  - Chạy trên `http://127.0.0.1:4323`, kiểm tra nghiêm ngặt `Host` header và cấm CORS/Origin bên ngoài.
  - Cung cấp giao diện web tiếng Việt chia làm 3 tab:
    1. **Tab Nhật ký:** Soạn thảo khối bài viết, chọn ảnh từ catalog đã duyệt, xem trước bài viết trực quan và xuất JSON.
    2. **Tab Sản phẩm:** Cập nhật giá niêm yết, số lượng có sẵn, trạng thái mở bán, kênh nhận và chính sách đổi trả.
    3. **Tab Đối soát Sao kê:** Hướng dẫn cấu trúc tệp sao kê, nhập nội dung CSV qua vùng nhập văn bản, kiểm tra tính hợp lệ RFC 4180 và cú pháp tiền tệ VND, xuất bản chiếu JSON đề nghị cập nhật.
- **Bộ xác thực CSV chuẩn RFC 4180 (`tools/content-studio/csv-validator.mjs`):**
  - Xử lý UTF-8 BOM, kiểm tra unclosed quotes, khớp chính xác số lượng cột, chống trùng lặp cột tiêu đề.
  - Ngữ pháp tiền tệ VND chặt chẽ: chỉ chấp nhận số nguyên dương thuần túy hoặc nhóm 3 chữ số bằng dấu chấm/phẩy (`50.000` / `50,000`). Từ chối số mũ (`5e4`), số thực lẻ (`50.50`) hoặc số âm.
  - **Chặn dữ liệu mẫu (Sample Data Protection):** Tệp `sample-donations.csv` là mẫu kiểm thử với số tiền 0đ. Trình xác thực từ chối áp dụng tệp mẫu vào sổ thực tế.
- **Ranh giới Kiểm tra Build Boundary cho Sổ Đối soát (RC14 mục 3):**
  - Tích hợp hàm `validateDonationProjection` và `sanitizeDonationEntry` tại read/build boundary (`src/data/campaign.ts` và `src/lib/donations.ts`).
  - Hàm `projectPublicDonationLedger` trong `src/data/campaign.ts` thẩm định dữ liệu ngay khi nạp module.
  - Từ chối dữ liệu chưa được phê duyệt (`publicApproval !== 'approved'`) khi `reconciled === true`, khiến quá trình build thất bại (`exitCode !== 0`).
  - Loại bỏ các trường riêng tư và che giấu mã tham chiếu (`...${ref.slice(-4)}`) ở mọi đường vào; người ủng hộ Ẩn danh luôn có `reference: null`.
  - Giữ nguyên trạng thái baseline rỗng (`reconciled: false`, `reconciledAt: null`, `entries: []`).
- **Công cụ CLI Quản trị (`tools/content-studio/cli.mjs`):**
  - Hỗ trợ các lệnh `validate`, `apply`, `sample`.
  - Bắt buộc cờ `--reviewers` chứa ít nhất 2 thành viên đối soát chéo độc lập khi áp dụng sổ sao kê.
  - Bắt buộc kiểm tra mã băm SHA-256 đối chiếu (`--expected-hash`) trước khi ghi đè, tạo bản sao lưu tự động tại `tools/content-studio/backups/`.

---

## 3. Ma trận Kiểm thử & Bằng chứng Thực thi (Verification Matrix)

| Lệnh / Thao tác | Mục đích kiểm tra | Exit Code / Kết quả | Bằng chứng |
| :--- | :--- | :--- | :--- |
| `npm run check` | Kiểm tra cú pháp Astro & TypeScript types | **Exit 0** (0 errors, 0 warnings, 176 files) | `task-8417.log` |
| `npm test` | Kiểm thử đơn vị toàn bộ nghiệp vụ | **Exit 0** (92/92 tests pass, 13 suites) | Node test runner output |
| `npm run build` | Biên dịch tĩnh 13 routes trong `dist/` | **Exit 0** (13 static HTML pages) | Astro build output |
| `git diff --check -- src tests tools` | Kiểm tra định dạng khoảng trắng và EOF | **Exit 0** (không có lỗi blank EOF) | Git check sạch trên toàn bộ file app |
| `node tools/content-studio/cli.mjs validate src/data/reconciled-donations.json` | Kiểm tra tính hợp lệ của sổ baseline | **Exit 0** (Hợp lệ, 0 giao dịch) | CLI validation report |
| `node tools/content-studio/cli.mjs validate src/data/journal-entries.json --target journal` | Kiểm tra danh sách bài viết nhật ký | **Exit 0** (Hợp lệ, 2 bài viết) | CLI validation report |
| `node tools/content-studio/cli.mjs validate src/data/product-sales-config.json --target products` | Kiểm tra cấu hình mở bán sản phẩm | **Exit 0** (Hợp lệ, 2 sản phẩm) | CLI validation report |
| Fixture test: 375px Layout & Copy Interaction | Kiểm tra không tràn ở 375px và tương tác copy | **PASS** (clientWidth = scrollWidth = 375px) | `docs/evidence/C14/antigravity/fixture-purchase-copy-375.png` |
| Fixture test: Unapproved Ledger Build Failure | Kiểm tra từ chối build khi ledger pending | **PASS** (Build thất bại như kỳ vọng) | `renderer-fixture-check.json` |
| Fixture test: Domain chia sẻ chính thức | Kiểm tra URL chia sẻ trong panel ủng hộ | **PASS** (`https://mangtheomotnetve.website/`) | `renderer-fixture-check.json` |
| So sánh SHA-256 dữ liệu nguồn `src/data/` | Bảo vệ tính toàn vẹn dữ liệu gốc | **PASS** (SHA-256 khớp baseline) | `original source data untouched` |

---

## 4. Danh mục Tệp Thay đổi (Files Manifest)

### 4.1. Mã nguồn Ứng dụng & Giao diện (App Source)
- `src/components/DonationPanel.astro`: Hướng dẫn chuyển khoản, nút copy một chạm, cập nhật share URL về tên miền chính thức `https://mangtheomotnetve.website/`.
- `src/components/MobileDonationBar.astro`: Thanh neo đáy di động, Web Share API với domain chính thức `https://mangtheomotnetve.website/`.
- `src/components/PageHero.astro`: Cập nhật `StatusChip` đơn lẻ không lặp text trong `summaryItems`.
- `src/components/ProductGrid.astro`: Hiển thị giá niêm yết chính thức khi đã mở bán hoặc giá tham khảo kế hoạch.
- `src/components/Header.astro` & `Footer.astro`: Bổ sung đường dẫn điều hướng tới `/nhat-ky`.
- `src/layouts/Layout.astro`: Tích hợp `MobileDonationBar` và hỗ trợ biến CSS khoảng đệm đáy.
- `src/pages/index.astro`: Section nhật ký mới nhất trên Trang chủ kèm chú thích ảnh và nguồn ảnh.
- `src/pages/du-an/mang-theo-mot-net-ve.astro`: Khối liên kết tới nhật ký dự án.
- `src/pages/nhat-ky/index.astro`: Danh sách bài viết nhật ký, lọc theo danh mục, sửa cấu trúc figure tránh che chú thích.
- `src/pages/nhat-ky/[slug].astro`: Trang bài viết chi tiết dạng khối nội dung có cấu trúc.
- `src/pages/san-pham.astro`: Danh mục quà lưu niệm dẫn tới trang chi tiết của 2 sản phẩm thủ công.
- `src/pages/san-pham/[slug].astro`: Trang chi tiết quà lưu niệm, mô hình bán hàng hiệu lực, form soạn tin nhắn đặt mua responsive không tràn ở 375px.

### 4.2. Dữ liệu & Thư viện Nghiệp vụ (Data & Libs)
- `src/data/campaign.ts`: Tích hợp `validateDonationProjection` và `sanitizeDonationEntry` tại build boundary; bảo vệ dữ liệu công khai.
- `src/data/journal.ts`: Định nghĩa và nạp dữ liệu nhật ký, phân loại danh mục, hỗ trợ `draft` và sắp xếp newest-first.
- `src/data/product-sales-config.json`: Cấu hình mở bán sản phẩm quà lưu niệm (baseline).
- `src/data/journal-entries.json`: Dữ liệu bài viết nhật ký ban đầu (baseline 2 bài kế hoạch).
- `src/data/reconciled-donations.json`: Sổ đối soát ủng hộ (giữ nguyên baseline `reconciled: false`, `entries: []`).
- `src/lib/donations.ts`: Kiểm tra logic sổ đối soát, bổ sung kiểm tra `publicApproval` trong `validateLedger`.
- `src/lib/products.ts`: Tính toán mô hình bán hàng hiệu lực `getEffectiveProductSaleModel`, tạo văn bản `formatPurchaseInquiry`, làm sạch EOF blank lines.

### 4.3. Công cụ Nội bộ & Kiểm thử (Tools & Tests)
- `tools/content-studio/server.mjs`: Máy chủ GUI cục bộ `127.0.0.1:4323`.
- `tools/content-studio/cli.mjs`: Công cụ CLI xác thực, chạy thử và áp dụng dữ liệu, re-export hàm projection.
- `tools/content-studio/csv-validator.mjs`: Module phân tích và kiểm tra CSV chuẩn RFC 4180, hàm `validateDonationProjection` và `sanitizeDonationEntry`.
- `tools/content-studio/journal-validator.mjs`: Module xác thực schema bài viết nhật ký và catalog ảnh đã duyệt, làm sạch EOF blank lines.
- `tools/content-studio/product-validator.mjs`: Module xác thực cấu hình mở bán quà lưu niệm.
- `tools/content-studio/sample-donations.csv`: Tệp CSV mẫu định dạng có cảnh báo dữ liệu thử nghiệm.
- `tools/content-studio/README.md`: Hướng dẫn sử dụng Content Studio và quy trình khôi phục bản sao lưu.
- `tests/journal.test.mjs`: Bộ kiểm thử dữ liệu và schema bài viết nhật ký.
- `tests/products.test.mjs`: Bộ kiểm thử chi tiết sản phẩm và luồng soạn yêu cầu mua.
- `tests/content-studio.test.mjs`: Bộ kiểm thử toàn diện Content Studio (RFC 4180, PII protection, 2-person rule, CLI apply), làm sạch EOF blank lines.

---

## 5. Kết luận & Trạng thái Bàn giao

- **Trạng thái:** Task C14 đã hoàn thành triển khai và tự kiểm tra đầy đủ 4 nâng cấp và 5 mục sửa đổi sau review RC14, sẵn sàng bàn giao preview cho Codex thẩm định.
- **Cam kết phạm vi:** Không push lên GitHub remote; không merge nhánh; không sửa đổi tài liệu Codex sở hữu (`docs/reviews/*`, `reports/*` cũ).
