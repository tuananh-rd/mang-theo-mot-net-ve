# Báo cáo Triển khai Task C17-R2-F2 — Online Studio: Biên tập viên, Kho ảnh Duyệt & Private Draft Preview SSR

**Người thực hiện:** Antigravity (Dispatched Worker)  
**Nhiệm vụ:** `task_7db18e179a76`  
**Phiên điều phối (Dispatch):** `ctx_977d3559c3a1`  
**Điểm mốc gốc (Baseline):** `c55315703927956794aff756dc7438606ff1408a`  
**Điểm mốc công khai mới nhất (Remote Main):** `0848d1212ea8a2177e76f076a9171c519155dd8a`  
**Nhánh công việc:** `task/c17-online-studio`  
**Thời gian hoàn thành:** 12/10/2026 22:25+07:00  

---

## 1. Tóm tắt Thực thi (Executive Summary)

1. **Những việc đã làm:**
   - Hoàn thiện toàn diện quy trình giao diện cho cả 8 phân hệ Online Studio trong `apps/studio/src/ui/html.ts`, bảo toàn chính xác giá trị `0` và `null` (sử dụng helper `parseNumOrNull`, xóa liên hệ lưu `contacts: null` không phục sinh fallback).
   - Khắc phục lỗi lựa chọn ảnh sản phẩm mặc định: loại bỏ đường dẫn không tồn tại `/images/san-pham/moc-khoa.webp`, bổ sung tùy chọn rỗng rõ ràng `-- Chưa có ảnh đại diện (Chờ ảnh thật) --`, hiển thị thumbnail có điều kiện và nhãn trạng thái rỗng, bảo toàn ngữ nghĩa xóa `null` và không để trình duyệt tự động gán icon/ảnh đầu tiên vào sản phẩm móc khóa.
   - Thiết lập Kho tư liệu Chuẩn tắc (Approved Media Registry) với đầy đủ 22 tài sản chuẩn tắc (bao gồm 20 tài sản lịch sử và 2 ảnh hero WebP mới do chủ dự án cung cấp), cập nhật mã QR Techcombank và tài khoản mới (`19072950239011`, `NGUYEN NGOC KHOA`) đồng bộ với remote main `0848d12`, băm SHA-256 thực tế, nạp Worker-native thuần không chứa module Node-only trong bundle runtime.
   - Xây dựng luồng Private Draft Preview SSR sử dụng bộ điều hợp Cloudflare của Astro (`@astrojs/cloudflare`), biên dịch tĩnh trực tiếp handler chính thức của Astro (`apps/studio/src/preview/worker-entry.ts` statically import `@astrojs/cloudflare/handler`), loại bỏ hoàn toàn các lệnh dynamic import runtime và `@vite-ignore`.
   - Cô lập ngữ cảnh yêu cầu bằng `AsyncLocalStorage` (ngăn chặn hoàn toàn hiện tượng cross-talk giữa các request đồng thời), tự động gắn cờ bảo mật (`Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Studio-Private-Preview: true`) trên cả trang HTML, tài nguyên tĩnh `/_astro/*`, tệp media và trang lỗi.
   - Viết lại toàn bộ liên kết nội bộ sang `/preview/*`, bảo toàn nguyên vẹn neo định vị (anchor fragments như `#sao-ke`, `#quy-trinh`, `#corners-heading`), tham số truy vấn (query params) và dấu gạch chéo cuối, đồng thời ngăn chặn bypass tiền tố (ví dụ `/previewevil`).
   - Khắc phục triệt để lỗi vi phạm Proxy Invariant trên thuộc tính `length` của mảng trong cả `src/data/campaign.ts` và `src/data/journal.ts` bằng cách đảm bảo cờ `configurable: false` không bị thay đổi.
   - Đồng bộ 100% dữ liệu hạt giống ban đầu (seed equivalence) cho cả 13 trường dữ liệu phân hệ so với dữ liệu nguồn baseline.
   - Xác thực giao diện trình duyệt thực tế (Puppeteer) trên cả 8 phân hệ tại 3 kích thước màn hình (375px mobile, 768px tablet, 1440px desktop), xác nhận 25 quan sát thành công, 0 lỗi console/page error, kiểm chứng bảng cuộn ngang trên mobile và bảo toàn số 0 trong form dự toán tài chính.

2. **Kết quả đo lường & Cổng chất lượng:**
   - `npm run studio:typecheck`: 0 lỗi TypeScript.
   - `npm run studio:test`: 58/58 kiểm thử vượt qua 100% (bao gồm kiểm thử workerd preview server render 6 trang công khai, từ chối unauth 401, kiểm thử adversarial, OCC 409, persistence D1/R2 qua khởi động lại, bundle workerd không phụ thuộc Node).
   - `npm test`: 96/96 kiểm thử hệ thống vượt qua 100%.
   - `npm run build`: Tạo thành công toàn bộ 13 trang tĩnh công khai trong <1s.
   - `npx astro check`: 0 lỗi, 0 cảnh báo trên toàn bộ 273 tệp.
   - `npx astro build --config astro.preview.config.mjs`: Biên dịch hoàn chỉnh Astro SSR Cloudflare Worker entry trong 1.38s.
   - Các probe kiểm tra của Reviewer:
     - `reviewer-asset-header-checkpoint.mjs`: PASS (`status: 200`, `cacheControl: "private, no-store"`, `robots: "noindex, nofollow"`).
     - `reviewer-preview-link-checkpoint.mjs`: PASS (6/6 tuyến đường viết lại chuẩn xác kèm neo `#sao-ke`, không bị bypass).
     - `reviewer-seed-equivalence-checkpoint.mjs`: PASS (13/13 trường phân hệ khớp 100% JSON equality).
     - `reviewer-projection-checkpoint.mjs`: PASS (`contactValue: null`, `zeroPreserved: true`).
     - `reviewer-current-main-inventory.mjs`: PASS (22 tài sản ảnh, 6/7 tệp byte-equivalent trực tiếp với `0848d12`, tệp thứ 7 đồng bộ tài khoản ngân hàng).
     - `browser-verification.mjs`: 25 quan sát thành công, 0 lỗi trang, ảnh chụp màn hình ghi nhận tại `docs/evidence/C17/R2-F2/worker/browser-1791818504616/`.

3. **Hiện trạng bàn giao:**
   - Toàn bộ mã nguồn, cấu hình và bài kiểm thử thuộc phạm vi worker đã hoàn tất sạch sẽ, không sửa các tệp tài liệu thuộc quyền sở hữu của Codex (`docs/*`, `README.md`, `reports/handoff-brain.md`), không tạo tài nguyên đám mây thật hay can thiệp người dùng thật.
   - Sẵn sàng bàn giao cho Codex Reviewer thẩm định đóng cổng mốc C17-R2-F2.

---

## 2. Chi tiết 8 Phân hệ Biên tập Online Studio (Studio Sections)

| Phân hệ | Thành phần giao diện & Luồng nghiệp vụ | Xử lý Null / Zero & Bảo vệ Dữ liệu |
| :--- | :--- | :--- |
| **1. Dự án (Project)** | Hoạt động (activities), nhu cầu (needs), tiến độ và nút chuyển đổi hiển thị thông tin liên hệ chính thức. | Khi tắt liên hệ, lưu `contacts: null` vào D1; giao diện hiển thị rỗng, không tự động phục sinh fallback cứng. |
| **2. Tiến độ (Progress)** | Quản lý mốc thời gian, số tuần thực tế, tên giai đoạn hiện tại. | Nhập số tuần `0` giữ nguyên `0`; không ghi đè số tuần kế hoạch gốc. |
| **3. Sản phẩm (Products)** | Soạn thảo câu chuyện sản phẩm, cấu hình trạng thái mở bán, giá chính thức, tồn kho thực tế, gắn mediaKey, trường tên, mô tả và xuất xứ. | Cung cấp tùy chọn rõ ràng cho sản phẩm chưa có ảnh; không tự động fallback về icon đầu danh mục; bảo tồn ngữ nghĩa xóa rỗng/null mà không phục sinh giá trị mẫu ban đầu. |
| **4. Tài chính (Finance)** | Cơ chế 2 người độc lập (Four-Eyes), quản lý 5 bảng: sao kê quyên góp, bán hàng gây quỹ, khoản chi, hiện vật tiếp nhận, tổng quan dự toán; đồng bộ tài khoản tiếp nhận Techcombank 19072950239011 NGUYEN NGOC KHOA. | Hàm `parseNumOrNull` bảo lưu số `0` và `null` cho các trường dự toán tài chính; che mã tham chiếu riêng tư (PII Masking). |
| **5. Nhật ký (Journal)** | Danh sách bài viết, soạn thảo bài nháp, gắn ảnh bìa chuẩn, chia khối nội dung. | Chiếu riêng biệt `sanitizeJournalForPrivateDraft` cho phép xem trước bài viết trạng thái `draft` trong `/preview/nhat-ky/[slug]`, trong khi bản xuất bản công khai vẫn lọc nghiêm ngặt `status: 'published'`. |
| **6. Đội ngũ (Team)** | Hồ sơ thành viên, phân công vai trò và nguyên tắc làm việc. | Khớp chuẩn xác dữ liệu ban đầu, không hiển thị thông tin liên lạc nhạy cảm chưa được đồng ý. |
| **7. FAQs** | Quản lý 3 nhóm câu hỏi độc lập: Sản phẩm, Đồng hành/Hỗ trợ, Minh bạch. | Phân nhóm rành mạch, bảo toàn định danh và câu trả lời. |
| **8. Quản trị & Lịch sử (Settings/Admin)** | Phân quyền vai trò (Admin, Reviewer, Editor), xem Diff lịch sử, Guarded Restore với khóa lạc quan OCC (409 Conflict). | Bắt lỗi xung đột phiên bản `expectedHash`; tự động rollback khi ghi nhật ký kiểm toán thất bại. |

---

## 3. Kho Tư liệu Chuẩn tắc (Approved Media Registry)

- **Số lượng:** Đầy đủ 22 tệp tư liệu chuẩn tắc (20 tệp gốc + 2 tệp hero WebP mới theo remote main `0848d12`).
- **Mã QR:** Cập nhật băm thực tế `7714d8ae9bb3146130ee36614f0f78acdfa2a80789d033f99ed77a7f7ef0d0c6` (174.683 bytes), khớp với tài khoản Techcombank 19072950239011.
- **Tính toàn vẹn:** Kiểm tra băm SHA-256 đối chiếu trực tiếp với tệp nguồn thực tế trên đĩa, nạp thành công và có tính idempotency cao.
- **Worker-Native:** Dữ liệu metadata nạp từ tệp JSON chuẩn tắc (`approved-registry.json`), không gọi `fs` hoặc các API đặc thù của Node.js trong bundle Worker runtime.
- **Bảo mật luồng tệp:** Tuyến `GET /api/media/:id/file` phục vụ tệp authenticated từ R2 đính kèm đầy đủ tiêu đề an toàn (`Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Content-Type-Options: nosniff`).

---

## 4. Kiến trúc Private Draft Preview SSR

1. **Bộ điều hợp Astro Cloudflare SSR & Entry Biên dịch Tĩnh:**
   - Cấu hình Astro: `astro.preview.config.mjs` với `output: 'server'` và bộ điều hợp `@astrojs/cloudflare`.
   - Điểm vào Worker: `apps/studio/src/preview/worker-entry.ts` statically import handler từ `@astrojs/cloudflare/handler` và đăng ký với `setCustomAstroHandler`.
   - Cấu hình Wrangler: `wrangler.preview.json` trỏ `main` tới `./apps/studio/src/preview/worker-entry.ts` với `assets.run_worker_first: true`.
   - Khi Astro biên dịch SSR, toàn bộ 13 routes và component `.astro` được biên dịch trực tiếp vào bundle workerd (`dist-preview/server/entry.mjs`), loại bỏ hoàn toàn việc tìm file động trên đĩa.
2. **Cô lập theo yêu cầu (Request-Scoped Isolation):**
   - Sử dụng `AsyncLocalStorage` của runtime Cloudflare Workers / Node.js.
   - Thử nghiệm đồng thời (`Zero Cross-Talk`): 2 yêu cầu xem trước với bản nháp khác nhau và 1 yêu cầu công khai cơ sở chạy song song đảm bảo mỗi luồng chỉ nhận đúng bản nháp của mình, không làm biến đổi bộ nhớ toàn cục.
   - Nếu môi trường runtime thiếu `AsyncLocalStorage`, renderer ném ngoại lệ rõ ràng (`fail-closed`), tuyệt đối không âm thầm chạy tiếp với dữ liệu mặc định.
3. **Tiêu đề Bảo mật & Viết lại Liên kết:**
   - Gắn cờ bảo mật: `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Studio-Private-Preview: true` áp dụng nhất quán trên trang xem trước, static assets `/_astro/*`, ảnh media và phản hồi lỗi.
   - Viết lại liên kết nội bộ: Hàm `rewritePreviewHref` chuyển đổi các đường dẫn tĩnh sang tiền tố `/preview/...` bảo tồn nguyên vẹn các neo fragment như `/dong-hanh#sao-ke`, `/minh-bach#quy-trinh`, query param `/san-pham?sort=price`, xử lý trailing slashes `/dong-hanh/`, và chặn đứng bypass `/previewevil`.
4. **Kiểm chứng workerd Thực tế (unstable_dev):**
   - Khởi chạy Worker biên dịch thật với Miniflare / workerd:
     - Yêu cầu unauthenticated: Bị từ chối 401 Unauthorized trên toàn bộ tuyến (`/preview/dong-hanh`, `/favicon.svg`, `/`).
     - Yêu cầu authenticated: Duyệt thành công cả 6 trang công khai (`/preview/`, `/preview/dong-hanh`, `/preview/du-an/mang-theo-mot-net-ve`, `/preview/minh-bach`, `/preview/san-pham`, `/preview/ve-nhom`), trang chi tiết `/preview/nhat-ky/[slug]` với status 200, tiêu đề trang đầy đủ và cờ bảo mật private preview.

---

## 5. Khắc phục Lỗi Bất biến Proxy (Proxy Invariants Fix)

- **Nguyên nhân lỗi cũ:** Trong JavaScript Proxy, khi đối tượng gốc có thuộc tính không thể cấu hình (`configurable: false`, ví dụ như thuộc tính `length` của `Array`), bẫy `getOwnPropertyDescriptor` bắt buộc phải trả về thuộc tính với `configurable: false`. Nếu trả về `configurable: true`, JavaScript engine ném ngoại lệ `TypeError: 'getOwnPropertyDescriptor' on proxy: trap returned descriptor for property 'length' that is incompatible with the existing property in the proxy target`.
- **Giải pháp áp dụng:** Cả `src/data/campaign.ts` và `src/data/journal.ts` đều áp dụng cơ chế đồng bộ:
  ```typescript
  const targetDesc = Reflect.getOwnPropertyDescriptor(_target, prop);
  if (targetDesc && !targetDesc.configurable) {
    desc.configurable = false;
  } else {
    desc.configurable = true;
  }
  ```
- **Kiểm chứng:** Kiểm thử `tests/proxy-invariants.test.mjs` xác nhận gọi `Object.getOwnPropertyDescriptor(JOURNAL_ENTRIES, 'length')` và `Object.getOwnPropertyDescriptor(PRODUCTS, 'length')` hoàn toàn bình thường, không ném lỗi.

---

## 6. Tổng hợp Minh chứng (Quality Gates Evidence)

Các lệnh kiểm tra đã được thực thi và xác nhận tại bản log `docs/evidence/C17/R2-F2/worker/quality-gates.txt`:

```bash
=== npm run studio:typecheck ===
Exit code: 0 (0 errors)

=== npm run studio:test ===
Exit code: 0
ℹ tests 58
ℹ suites 4
ℹ pass 58
ℹ fail 0

=== npm test ===
Exit code: 0
ℹ tests 96
ℹ suites 13
ℹ pass 96
ℹ fail 0

=== npm run build ===
Exit code: 0
13 page(s) built in <1s

=== npx astro check ===
Exit code: 0
0 errors, 0 warnings

=== npx astro build --config astro.preview.config.mjs ===
Exit code: 0
Server built in 1.38s
```

Báo cáo này hoàn thành đầy đủ toàn bộ phạm vi công việc của Task C17-R2-F2.
