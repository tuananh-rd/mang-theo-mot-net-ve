# Báo cáo Triển khai Task C14 — Bốn Nâng cấp Hệ thống Website "Mang Theo Một Nét Vẽ"

- **Người thực hiện:** Antigravity (App Worker)
- **Người review & điều phối:** Codex
- **Nhánh làm việc:** `task/c14-content-tools` (baseline `b4ed9120efe7b3f14cbef09855401167b24cbb68`)
- **Mã Task Orca:** `task_7fec7cc22816`
- **Mã Dispatch Orca:** `ctx_6fd5febf27eb`
- **Thời gian hoàn thành:** 11/10/2026

---

## 1. Tóm tắt Tổng quan (Executive Summary)

Theo đặc tả `docs/task-specs/C14.md` và các chỉ dẫn review sớm 01–12 (`docs/evidence/C14/early-review-*.txt`), Antigravity đã hoàn thành trọn vẹn 4 nâng cấp hệ thống được phê duyệt cho dự án "Mang Theo Một Nét Vẽ":
1. **Nâng cấp 1 (Project Journal):** Hệ thống Nhật ký dự án (`/nhat-ky`, `/nhat-ky/[slug]`, tích hợp Trang chủ và Trang dự án).
2. **Nâng cấp 3 (Mobile Donation Experience):** Trải nghiệm ủng hộ di động (thanh sticky bar neo đáy, chuyển tab QR / Chuyển khoản thủ công, Web Share API, safe-area offset).
3. **Nâng cấp 5 (Product Details & Purchase Inquiry Flow):** Trang chi tiết cho 2 sản phẩm thủ công (`/san-pham/[slug]`), mô hình bán hàng hiệu lực đồng bộ SSR/Client, form soạn tin nhắn đặt mua an toàn (không tạo cổng thanh toán/đơn hàng giả).
4. **Nâng cấp 6 (Local Content Studio):** Bộ công cụ quản trị nội bộ loopback-only (`http://127.0.0.1:4323` và CLI `tools/content-studio/cli.mjs`), xác thực CSV RFC 4180 và JSON sao kê, quy trình đối soát 2 người bắt buộc, bảo vệ PII nghiêm ngặt và chống xung đột mã băm SHA-256.

Toàn bộ 92 bài kiểm thử tự động đạt 100% PASS, `astro check` đạt 0 lỗi / 0 cảnh báo, 13 route tĩnh được biên dịch hoàn chỉnh trong `dist/`. Toàn bộ 11 ca kiểm thử tích hợp CLI đều đạt PASS trong môi trường fixture cô lập, và tệp nguồn dữ liệu thực tế giữ nguyên trạng thái baseline rỗng.

---

## 2. Chi tiết Triển khai Bốn Nâng cấp

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
- **Hiển thị chú thích ảnh & Bản quyền minh bạch (Visual Fix C12):**
  - Sửa đổi cấu trúc `<figure>` tại `/nhat-ky` và Trang chủ: tách biệt vùng ảnh (`aspect-ratio: 16/9; overflow: hidden`) khỏi vùng chú thích (`<figcaption>`), giúp toàn bộ chú thích và nguồn ảnh hiển thị rõ ràng 100%, không bị cắt hay che lấp ở bất kỳ kích thước màn hình nào (375px, 768px, 1440px).

### 2.2. Nâng cấp 3: Trải nghiệm Ủng hộ Di động (Mobile Donation Experience)
- **Thanh điều hướng neo đáy (`src/components/MobileDonationBar.astro`):**
  - Tự động xuất hiện trên màn hình nhỏ (<768px) tại trang `/dong-hanh` và các trang liên quan.
  - Sử dụng khoảng đệm an toàn `env(safe-area-inset-bottom, 0px)` chống che lấp nội dung và các nút điều hướng của hệ điều hành di động.
  - Tích hợp 2 nút thao tác nhanh:
    1. **Nút "Ủng hộ ngay"**: Cuộn mượt đến mục quét mã QR (`#chuyen-khoan`).
    2. **Nút "Chia sẻ" / Web Share API**: Gọi `navigator.share()` gốc trên di động; tự động chuyển sang cơ chế sao chép liên kết vào clipboard kèm thông báo trực quan (toast) nếu trình duyệt không hỗ trợ.
- **Tối ưu hóa bảng thông tin chuyển khoản (`src/components/DonationPanel.astro`):**
  - Bổ sung 2 tab lựa chọn rõ ràng: **"Quét mã QR"** (nhanh chóng qua VietQR) và **"Chuyển khoản thủ công"** (hiển thị chi tiết số tài khoản Techcombank `999927052006`, chủ tài khoản `LE TUAN ANH`).
  - Nút sao chép số tài khoản một chạm có phản hồi "Đã sao chép" tức thì.
  - Neo liên kết trực tiếp `#sao-ke` dẫn tới khu vực đối soát minh bạch.

### 2.3. Nâng cấp 5: Chi tiết Sản phẩm & Luồng Soạn Yêu cầu Mua
- **Trang chi tiết sản phẩm thủ công (`src/pages/san-pham/[slug].astro`):**
  - Chỉ tạo trang chi tiết cho 2 mặt hàng thủ công có kế hoạch làm quà lưu niệm: `chuon-chuon-tre-kem-de` và `moc-khoa`. Không tạo trang cho các mặt hàng ẩm thực cũ.
- **Mô hình bán hàng hiệu lực thống nhất (`getEffectiveProductSaleModel` trong `src/lib/products.ts`):**
  - Đồng bộ logic giữa SSR và Client script: đọc cấu hình từ `src/data/product-sales-config.json`.
  - Phân định rõ ràng: khi trạng thái là `open` và đã chốt giá chính thức, hiển thị "Giá niêm yết chính thức"; ngược lại hiển thị "Giá tham khảo (kế hoạch)".
  - Tự động giới hạn số lượng đặt mua tối đa theo số lượng kho có sẵn (`stockAvailable`).
  - Khóa hoàn toàn luồng đặt mua nếu `stockAvailable === 0`.
- **Cơ chế kích hoạt an toàn (Gating Rule):**
  - Form soạn yêu cầu mua CHỈ mở khi: `saleStatus === 'open'`, `officialPrice > 0`, `publicApproval === 'approved'`, có thông tin kênh bán, chính sách đổi trả và `stockAvailable > 0`.
  - Khi chưa đủ điều kiện, giao diện hiển thị trạng thái "Chờ mở bán" kèm thông tin kênh nhận và chính sách dự kiến.
- **Trình tạo tin nhắn yêu cầu mua (`formatPurchaseInquiry`):**
  - Tạo sẵn mẫu văn bản gửi Fanpage Facebook hoặc SMS cho thành viên nhóm phụ trách; tính toán tổng tiền tạm tính chính xác.
  - Tuyệt đối không tạo giỏ hàng thương mại điện tử giả, không lưu đơn hàng mock và không tích hợp cổng thanh toán giả lập.
- **Sửa lỗi hiển thị trạng thái (Visual Fix C12):**
  - Chuẩn hóa `summaryItems` trong PageHero: chỉ hiển thị duy nhất một `StatusChip` cho dòng trạng thái, loại bỏ việc lặp lại chữ text bên cạnh chip.

### 2.4. Nâng cấp 6: Công cụ Cập nhật Nội bộ (Local Content Studio)
- **Kiến trúc Loopback An toàn (`tools/content-studio/server.mjs`):**
  - Chạy trên `http://127.0.0.1:4323`, kiểm tra nghiêm ngặt `Host` header và cấm CORS/Origin bên ngoài.
  - Cung cấp giao diện web tiếng Việt chia làm 3 tab:
    1. **Tab Nhật ký:** Soạn thảo khối bài viết, chọn ảnh từ catalog đã duyệt, xem trước bài viết trực quan (Rich Article Preview) và xuất/áp dụng JSON.
    2. **Tab Sản phẩm:** Cập nhật giá niêm yết, số lượng có sẵn, trạng thái mở bán, kênh nhận và chính sách đổi trả.
    3. **Tab Đối soát Sao kê:** Tải lên tệp CSV sao kê ngân hàng, kiểm tra tính hợp lệ RFC 4180, kiểm tra cú pháp số tiền nguyên dương, xuất bản chiếu JSON và nạp vào site.
- **Bộ xác thực CSV chuẩn RFC 4180 (`tools/content-studio/csv-validator.mjs`):**
  - Xử lý UTF-8 BOM, kiểm tra unclosed quotes, khớp chính xác số lượng cột, chống trùng lặp cột tiêu đề.
  - Ngữ pháp tiền tệ VND chặt chẽ: chỉ chấp nhận số nguyên dương thuần túy hoặc nhóm 3 chữ số bằng dấu chấm/phẩy (`50.000` / `50,000`). Từ chối số mũ (`5e4`), số thực lẻ (`50.50`) hoặc số âm.
  - **Chặn dữ liệu mẫu (Sample Data Protection):** Tệp `sample-donations.csv` được thiết kế rõ ràng là mẫu định dạng kiểm thử với số tiền 0đ và mã `SAMPLE_TXN_0001`. Trình xác thực chủ động từ chối áp dụng tệp mẫu vào sổ thực tế, yêu cầu người dùng nhập giao dịch đối soát ngân hàng thật.
- **Công cụ CLI Quản trị (`tools/content-studio/cli.mjs`):**
  - Hỗ trợ các lệnh `validate`, `apply`, `sample`.
  - **Quy trình 2 người bắt buộc (Four-eyes Principle):** Khi áp dụng (`--apply`) sổ đối soát (cả CSV và JSON), bắt buộc phải truyền cờ `--reviewers` chứa ít nhất 2 thành viên đối soát chéo khác nhau.
  - **Chống nâng cấp trạng thái tự ý:** Bản chiếu JSON đầu vào chưa đối soát hoặc đang `pending` sẽ bị từ chối áp dụng; hệ thống cấm tự động nâng cấp trạng thái thành `approved` nếu thiếu xác nhận đối soát.
  - **Bảo mật PII & Che giấu mã tham chiếu:** Toàn bộ trường giao dịch ngoài allowlist bị loại bỏ. Mã tham chiếu riêng tư được che giấu thành hậu tố an toàn (`...${id.slice(-4)}`, tối đa 8 ký tự). Người ủng hộ ẩn danh luôn có `reference: null`. Tên cá nhân người đối soát không được đưa vào public bundle (chỉ lưu nhãn vai trò đại diện).
  - **Chống xung đột Stale Baseline:** Bắt buộc truyền cờ `--expected-hash <sha256>`. Nếu SHA-256 hiện tại của tệp đích không khớp, lệnh áp dụng bị hủy bỏ.
  - **Sao lưu tự động:** Mọi thao tác ghi đè đều tự động sao lưu dữ liệu cũ vào `tools/content-studio/backups/`. Thư mục này cùng với `scratch/` đã được cấu hình trong `.gitignore`.

---

## 3. Ma trận Kiểm thử & Bằng chứng Nghiệm thu (Verification Matrix)

| Hạng mục kiểm thử | Công cụ / Lệnh | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Kiểm tra cú pháp & Kiểu dữ liệu** | `npm run check` (Astro Check) | **0 errors, 0 warnings** (175 files) | Toàn bộ template Astro và TypeScript type check sạch sẽ |
| **Kiểm thử đơn vị tự động** | `npm test` (`node --test tests/*.test.mjs`) | **92 / 92 PASS** (13 test suites) | Bao quát toàn bộ nghiệp vụ tài chính C06/C07, sổ đối soát C07S/C10, nhật ký C14, sản phẩm C14 và Content Studio |
| **Kiểm thử tích hợp độc lập** | `node scratch/test-isolated-integration.mjs` | **11 / 11 PASS** | Xác thực quy trình CLI trong môi trường fixture tạm cô lập (chống stale baseline, 2-person rule, che giấu reference, backup) |
| **Biên dịch xuất bản tĩnh** | `npm run build` | **13 static routes** | Biên dịch thành công 13 trang HTML trong thư mục `dist/` |
| **Kiểm tra bố cục không tràn** | Puppeteer QA Script (`scrollWidth <= innerWidth`) | **100% overflow: false** | Đạt trên cả 9 trang tại 3 viewports: 375px, 768px, 1440px |
| **Kiểm tra bảng màu phẳng** | Quét CSS computed styles | **0 gradient** | Tuân thủ tuyệt đối bảng màu "Tre & Mơ" (màu phẳng, không gradient) |
| **Kiểm tra hiển thị chú thích ảnh** | Kiểm tra pixel & DOM rendered | **PASS** | Chú thích ảnh và thông tin nguồn ảnh hiển thị rõ ràng, không bị che cắt |
| **Tính toàn vẹn dữ liệu gốc** | SHA-256 so sánh tệp nguồn `src/data/` | **Khớp 100% baseline** | Tệp `reconciled-donations.json` thực tế giữ nguyên `reconciled: false`, `entries: []` |

Tất cả ảnh chụp màn hình kiểm thử giao diện được lưu tại:
👉 `docs/evidence/C14/antigravity/`

---

## 4. Danh mục Tệp Thay đổi (Files Manifest)

### 4.1. Mã nguồn Ứng dụng & Giao diện (App Source)
- `src/components/DonationPanel.astro`: Bổ sung 2 tab Quét mã QR / Chuyển khoản thủ công, copy số tài khoản một chạm, liên kết `#sao-ke`.
- `src/components/MobileDonationBar.astro`: Thành phần thanh neo đáy di động kèm Web Share API và offset safe-area.
- `src/components/PageHero.astro`: Cập nhật interface `SummaryItem`, hỗ trợ hiển thị StatusChip đơn lẻ không lặp text.
- `src/components/ProductGrid.astro`: Hiển thị giá niêm yết chính thức khi đã mở bán hoặc giá tham khảo kế hoạch.
- `src/components/Header.astro` & `Footer.astro`: Bổ sung đường dẫn điều hướng tới `/nhat-ky`.
- `src/layouts/Layout.astro`: Tích hợp `MobileDonationBar` và hỗ trợ biến CSS khoảng đệm đáy.
- `src/pages/index.astro`: Thêm section bài viết nhật ký kế hoạch trên Trang chủ kèm chú thích ảnh và nguồn ảnh.
- `src/pages/du-an/mang-theo-mot-net-ve.astro`: Tích hợp khối liên kết tới nhật ký dự án.
- `src/pages/nhat-ky/index.astro`: Danh sách bài viết nhật ký, lọc theo danh mục, sửa lỗi hiển thị chú thích ảnh.
- `src/pages/nhat-ky/[slug].astro`: Trang bài viết chi tiết dạng khối nội dung có cấu trúc.
- `src/pages/san-pham/index.astro`: Danh mục quà lưu niệm dẫn tới trang chi tiết của 2 sản phẩm thủ công.
- `src/pages/san-pham/[slug].astro`: Trang chi tiết quà lưu niệm, mô hình bán hàng hiệu lực, form soạn tin nhắn đặt mua an toàn.

### 4.2. Dữ liệu & Thư viện Nghiệp vụ (Data & Libs)
- `src/data/journal.ts` & `src/data/journal-entries.json`: Định nghĩa và lưu trữ dữ liệu nhật ký, phân loại danh mục, hỗ trợ `draft` và sắp xếp newest-first.
- `src/data/product-sales-config.json`: Cấu hình mở bán sản phẩm quà lưu niệm.
- `src/data/reconciled-donations.json`: Sổ đối soát ủng hộ (giữ nguyên trạng thái baseline rỗng `reconciled: false`, `entries: []`).
- `src/lib/products.ts`: Module tính toán mô hình bán hàng hiệu lực `getEffectiveProductSaleModel` và tạo văn bản `formatPurchaseInquiry`.

### 4.3. Công cụ Nội bộ & Kiểm thử (Tools & Tests)
- `tools/content-studio/server.mjs`: Máy chủ GUI cục bộ `127.0.0.1:4323`.
- `tools/content-studio/cli.mjs`: Công cụ CLI xác thực, chạy thử và áp dụng dữ liệu.
- `tools/content-studio/csv-validator.mjs`: Module phân tích và kiểm tra CSV chuẩn RFC 4180 và tiền tệ VND.
- `tools/content-studio/journal-validator.mjs`: Module xác thực schema bài viết nhật ký và catalog ảnh đã duyệt.
- `tools/content-studio/product-validator.mjs`: Module xác thực cấu hình mở bán quà lưu niệm.
- `tools/content-studio/sample-donations.csv`: Tệp CSV mẫu định dạng có cảnh báo dữ liệu thử nghiệm.
- `tools/content-studio/README.md`: Hướng dẫn sử dụng Content Studio và quy trình khôi phục bản sao lưu.
- `package.json`: Bổ sung scripts `test`, `content:studio`, `content:apply`.
- `.gitignore`: Bổ sung loại trừ `tools/content-studio/backups/` và `scratch/`.
- `tests/journal.test.mjs`: Bộ kiểm thử dữ liệu và schema bài viết nhật ký.
- `tests/products.test.mjs`: Bộ kiểm thử chi tiết sản phẩm và luồng soạn yêu cầu mua.
- `tests/content-studio.test.mjs`: Bộ kiểm thử toàn diện Content Studio (RFC 4180, PII protection, 2-person rule, CLI apply).

---

## 5. Kết luận & Trạng thái Bàn giao

- **Trạng thái:** Task C14 hoàn thành 100% các tiêu chí yêu cầu và tất cả các phản hồi thẩm định trực quan.
- **Cam kết phạm vi:** Không push lên GitHub remote; không merge nhánh; không sửa đổi các tài liệu Codex sở hữu (`docs/reviews/*`, `reports/*` cũ).
- **Trạng thái worker:** Bàn giao báo cáo và đưa worker vào trạng thái **HOLD**, chờ Codex thẩm định và thực hiện các bước tiếp theo.
