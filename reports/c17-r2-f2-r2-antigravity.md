# Báo cáo Triển khai Task C17-R2-F2-R2 — Antigravity

- **Nhiệm vụ & Dispatch**: `task_b1913ce94a40` / `ctx_bf53e5983ac6` (C17-R2-F2-R2).
- **Mã SHA cơ sở (Baseline SHA)**: `b802390e3c60604bcb54c359380e1def1c7f2fe3` trên nhánh `task/c17-online-studio`.
- **Mã SHA triển khai (Implementation SHA)**: `d41864c282eaf4b9da03ad70d6be009fcd4d98ef` (commit `d41864c`).
- **Người thực hiện**: Antigravity (`term_bf5f1542-eb53-44fb-ba91-577238368f8f`).
- **Người quản lý / Điều phối**: Claude Coordinator (`term_41c3e57c-09e8-4ab1-b7e8-58d363fbec9a`).
- **Thời điểm hoàn thành**: 2026-10-13T01:18:00+07:00.

---

## 1. Tóm tắt Điều hành (Executive Summary)

1. **Những việc đã thực hiện**:
   - Khắc phục triệt để cơ chế SEO cho các trang chi tiết (`src/layouts/Layout.astro`): chuẩn hóa `rawPath` thành `normalizedRoute` để tra cứu độc lập trong `siteMeta.routeSeo` trong khi vẫn bảo lưu `currentPath` cho `<Header />` và `<MobileDonationBar />`; bảo toàn nguyên vẹn các khóa detail (`/nhat-ky/detail`, `/san-pham/detail`) khi chỉnh sửa 7 thẻ SEO chính hoặc các trường đội ngũ khác trong Studio UI (`apps/studio/src/ui/html.ts`), đồng thời gắn nhãn `<label for="...">` tương ứng và thiết kế thích ứng trên màn hình 375px.
   - Minh bạch hóa tên gọi kiểm thử mô phỏng (`Simulated In-Memory RequestContext isolation`), đồng thời xây dựng bộ kiểm thử cách ly thực tế trên cùng một Cloudflare workerd runtime biên dịch thật (`dist-preview/server/entry.mjs`) với 3 binding D1 độc lập (`DB_A`, `DB_B`, `DB_C`), bảo đảm tuyệt đối tính bất biến (Zero Cross-Talk), chặn race condition của singleton `AsyncLocalStorage`, và có cơ chế timeout/teardown hữu hạn.
   - Nâng cấp kịch bản kiểm thử trình duyệt Puppeteer thật (`browser-verification.mjs`) chạy trên Cloudflare workerd preview cô lập: kiểm chứng 32 quan sát thực tế bao gồm chỉnh sửa/lưu/tải lại Project (4 hoạt động, giai đoạn, 3 nhu cầu, ẩn liên hệ `contacts: null`), cả 2 sản phẩm (narrative, media đã duyệt, giá, kho, trạng thái mở bán, móc khóa không ảnh), nhật ký CRUD + thân bài + ảnh bìa + xem trước chi tiết riêng tư draft (`X-Studio-Private-Preview`, `Cache-Control: private, no-store`), hồ sơ nhóm + 3 nhóm FAQ, bảo toàn SEO main/detail và xóa cụ thể `/dong-hanh`, chọn ảnh từ Media Registry đã duyệt, kiểm tra OCC 409 Conflict khi restore bản sửa đổi cũ với stale hash, và xác thực vai trò Reviewer bị khóa hoàn toàn nút lưu.

2. **Những phát hiện & Kết quả đạt được**:
   - Tìm ra nguyên nhân gốc rễ gây nghẽn tiến trình workerd trước đây: dynamic `await import('node:async_hooks')` bên trong `runWithSnapshot()` dẫn đến race condition khởi tạo nhiều đối tượng `AsyncLocalStorage` khác nhau làm ghi đè biến toàn cục `globalThis[SNAPSHOT_STORAGE_SYMBOL]`; đã xử lý triệt để bằng singleton promise `ensureStorage()` trong `apps/studio/src/preview/renderer.ts`.
   - Toàn bộ 4 cổng chất lượng (Quality Gates) đều vượt qua với exit code 0: `npx astro check` (0 lỗi, 0 cảnh báo), `npm run studio:build` (exit 0), `npx astro build --config astro.preview.config.mjs` (exit 0), `npm run studio:test` (63/63 test PASS, exit 0 bao gồm test compiled Astro SSR concurrency 2.8s).
   - Kịch bản trình duyệt hoàn thành 32/32 quan sát, 0 lỗi console/page, 22 tài sản media chuẩn tắc khớp hoàn toàn kích thước thật, sinh 29 ảnh chụp màn hình kiểm chứng tại `docs/evidence/C17/R2-F2-R2/worker/screenshots/`.

3. **Phạm vi còn lại / Giới hạn bàn giao**:
   - Không thực hiện bất kỳ lệnh kích hoạt đám mây (Cloudflare Pages/Workers deploy) hoặc tạo tài nguyên thật trên Cloudflare (tuân thủ giới hạn không kích hoạt F3).
   - Không ghi/đẩy lên remote GitHub; bảo toàn nguyên vẹn tất cả tài liệu kế hoạch dirty của Codex (`README.md`, `docs/*`, `reports/*`) và các kho lưu trữ gốc của người dùng.

---

## 2. Chi tiết Triển khai Theo 4 Trọng tâm C17-R2-F2-R2

### 2.1. Phân định Route SEO Trang Chi tiết và Bảo toàn Cấu hình SEO trong UI
- **Khắc phục xung đột SEO giữa trang chi tiết và thanh điều hướng cha**:
  Trong `src/layouts/Layout.astro`, tách biệt rành mạch giữa tuyến đường dùng cho điều hướng (`currentPath`) và tuyến đường dùng để tra cứu SEO metadata (`normalizedRoute`):
  ```astro
  const rawPath = Astro.url.pathname;
  const normalizedRoute = rawPath !== '/' ? rawPath.replace(/\/+$/, '') : '/';
  const routeSeoMeta = (siteMeta.routeSeo && siteMeta.routeSeo[normalizedRoute]) || null;
  ```
  Nhờ đó, khi người dùng truy cập trang chi tiết sản phẩm (`/san-pham/chuon-chuon-tre-kem-de`) hoặc nhật ký (`/nhat-ky/bai-viet`), `routeSeoMeta` sẽ tra cứu chính xác thẻ SEO của tuyến đường đó thay vì bị ghi đè bởi cấu hình của trang danh sách cha `/san-pham` hay `/nhat-ky`.
- **Bảo toàn các khóa detail khi lưu 7 thẻ SEO chính**:
  Trong `apps/studio/src/ui/html.ts`, khi thu thập dữ liệu từ biểu mẫu `#teamForm`, hệ thống bảo lưu toàn bộ các tuyến đường hợp lệ không thuộc 7 thẻ canonical (như `/nhat-ky/detail`, `/san-pham/detail`) đã có sẵn trong bản nháp:
  ```typescript
  const existingRouteSeo = (activeDraft && activeDraft.data && activeDraft.data.siteMeta && activeDraft.data.siteMeta.routeSeo) || {};
  Object.keys(existingRouteSeo).forEach((r) => {
    if (!CANONICAL_SEO_ROUTES.includes(r) && existingRouteSeo[r]) {
      routeSeo[r] = existingRouteSeo[r];
    }
  });
  ```
- **Xóa tường minh chỉ ảnh hưởng tuyến đường được chọn**:
  Khi người dùng xóa trắng tiêu đề và mô tả của một tuyến đường canonical (ví dụ `/dong-hanh`), chỉ duy nhất khóa `/dong-hanh` bị loại bỏ khỏi `routeSeo`, các khóa khác kể cả khóa detail vẫn được bảo toàn nguyên vẹn.
- **Khả dụng trên di động 375px**:
  Tất cả các trường nhập liệu SEO được gắn nhãn tương ứng (`<label for="route_seo_title_${idx}">`), thẻ `<h3>` hiển thị rõ ràng và tương thích hoàn toàn trên màn hình 375px.

### 2.2. Kiểm thử Cách ly Astro Đã Biên dịch (Actual Compiled Astro Concurrency) & Đổi tên Trung thực
- **Minh bạch hóa tên gọi kiểm thử**:
  Đổi tên bài test sử dụng `setCustomAstroHandler` trong `apps/studio/tests/c17-r2-f2.test.mjs` thành `Simulated In-Memory RequestContext isolation`, phân định rõ ràng giữa bài kiểm tra unit context helper và bài kiểm tra tích hợp SSR thật.
- **Kiểm thử Concurrency trên cùng một Worker Runtime biên dịch thật**:
  Xây dựng test case `Actual Compiled Astro Concurrent Workerd Isolation: 3 independent D1 bindings render concurrent SSR HTML with zero cross-talk in one runtime`:
  - Khởi tạo 3 cơ sở dữ liệu D1 biệt lập (`DB_A`, `DB_B`, `DB_C`) nạp sẵn các tiêu đề và khẩu hiệu độc nhất (Marker A, B, C).
  - Wrapper test khởi chạy một workerd instance duy nhất nạp tệp `dist-preview/server/entry.mjs` thật (đã biên dịch bởi `@astrojs/cloudflare`).
  - Gửi đồng thời 3 yêu cầu xem trước SSR qua `worker.fetch()` với header phân luồng `x-test-tenant: tenant_a | tenant_b | tenant_c`.
  - Khẳng định:
    1. Kết quả phản hồi của Tenant A chứa Marker A, tuyệt đối KHÔNG chứa Marker B hay Marker C.
    2. Kết quả phản hồi của Tenant B chứa Marker B, tuyệt đối KHÔNG chứa Marker A hay Marker C.
    3. Kết quả phản hồi của Tenant C chứa Marker C, tuyệt đối KHÔNG chứa Marker A hay Marker B.
    4. Cả 3 phản hồi đều có header an ninh `x-studio-private-preview: true` và `cache-control: private, no-store`.
  - Tích hợp timeout cứng (15 giây) và teardown có giới hạn (`Promise.race([worker.stop(), timeout])`), bảo đảm không xảy ra hiện tượng treo tiến trình ngoài ý muốn.
- **Sửa lỗi Singleton AsyncLocalStorage trong `renderer.ts`**:
  Thay thế việc gọi dynamic `import('node:async_hooks')` độc lập mỗi lần chạy bằng singleton promise `ensureStorage()`, bảo đảm toàn bộ các yêu cầu đồng thời trong cùng một isolate đều chia sẻ chung một phiên bản `AsyncLocalStorage` duy nhất.

### 2.3. Mở rộng Harness Kiểm thử Trình duyệt Thực tế (Browser Verification)
Kịch bản `docs/evidence/C17/R2-F2-R2/worker/browser-verification.mjs` kiểm tra toàn diện 9 nhóm quy trình:
1. **Khảo sát giao diện**: Duyệt qua 8 phân hệ tại 3 độ phân giải (375x812, 768x1024, 1440x900) — tất cả bảng biểu và biểu mẫu đều hiển thị trọn vẹn.
2. **Quy trình chỉnh sửa Project**: Chỉnh sửa 4 hoạt động dự án, các giai đoạn tiến độ, 3 nhu cầu hỗ trợ, kích hoạt toggle ẩn liên hệ (`contacts: null`), lưu và tải lại giao diện; xác minh dữ liệu đọc lại khớp 100%.
3. **Quy trình chỉnh sửa Sản phẩm**:
   - Sản phẩm 1 (Chuồn chuồn tre): Cập nhật giá 45.000đ, tồn kho 35, phê duyệt công khai, mở bán (`saleStatus: open`), narrative câu chuyện mộc mạc, gán media `/images/san-pham/chuon-chuon-tre.webp`.
   - Sản phẩm 2 (Móc khóa): Cập nhật giá 15.000đ, tồn kho 80, phê duyệt công khai, mở bán (`saleStatus: open`), narrative kỷ niệm sinh viên FPT, chọn NO-PHOTO (giá trị rỗng `""`).
   - Lưu và tải lại giao diện; xác minh trạng thái no-photo và approved media được lưu bền vững.
4. **Quy trình Nhật ký (Journal CRUD & Private Preview)**: Thêm bài viết mới trạng thái `draft`, tiêu đề, tóm tắt, ảnh bìa, chỉnh sửa nội dung văn bản; lưu vào D1; mở trang xem trước riêng tư `/preview/nhat-ky/[slug]` xác nhận mã phản hồi 200 OK, header an ninh `x-studio-private-preview`, `Cache-Control: private, no-store`, tiêu đề và nội dung hiển thị chính xác.
5. **Quy trình Đội ngũ & 3 Nhóm FAQ**: Chỉnh sửa mô tả đội ngũ Lăng Kính, cập nhật đồng thời cả 3 câu hỏi FAQ (Sản phẩm, Ủng hộ, Minh bạch); lưu và đọc lại chính xác sau khi reload.
6. **Bảo toàn SEO Main/Detail & Xóa cụ thể**: Kiểm chứng `/nhat-ky/detail` và `/san-pham/detail` vẫn tồn tại sau khi lưu form; sau đó xóa trắng `/dong-hanh`, lưu và kiểm chứng chỉ có `/dong-hanh` bị xóa khỏi D1, 2 khóa detail vẫn được bảo toàn.
7. **Độc lập SEO Route Layout**: Kiểm chứng trang xem trước chi tiết sản phẩm kết xuất thẻ `<title>` chuẩn tắc độc lập với trang danh sách cha.
8. **Khôi phục Lịch sử (Guarded Restore) & OCC Conflict**: Đọc danh sách revision thực tế từ `/api/revisions/project`, gửi yêu cầu restore với `expectedHash` sai lệch (`stale-hash-...`) và khẳng định server trả về mã lỗi `409 Conflict`.
9. **Phân quyền Reviewer**: Chuyển vai trò sang `reviewer`, khẳng định toàn bộ nút Lưu tại các phân hệ Project, Products, Team đều bị vô hiệu hóa (`disabled: true`).

### 2.4. Kiểm tra Danh mục Media Đã Duyệt (Approved Media Registry)
Xác thực 22 tài sản hình ảnh chuẩn tắc trong `apps/studio/src/storage/approved-registry.json` đối chiếu với tệp thực tế trong thư mục `public/`:
- Toàn bộ 22/22 tệp đều tồn tại trên đĩa và có kích thước byte (`sizeBytes`) khớp chính xác 100%.

---

## 3. Nhật ký Quality Gates & Mã Thoát (Raw Logs & Exit Codes)

| Lệnh kiểm tra | Mục đích kiểm tra | Mã thoát (Exit Code) | Kết quả chi tiết |
| --- | --- | :---: | --- |
| `npx astro check` | Chẩn đoán toàn dự án Astro & Studio | **0** | `Result (242 files): 0 errors, 0 warnings, 27 hints` |
| `npm run studio:build` | Biên dịch TypeScript Studio | **0** | `tsc -p apps/studio/tsconfig.json` hoàn tất không lỗi |
| `npx astro build --config astro.preview.config.mjs` | Biên dịch Cloudflare SSR Preview Worker | **0** | `Server built in 1.67s. Complete!` |
| `npm run studio:test` | Toàn bộ 63 bài test tự động của Studio | **0** | `tests 63, suites 4, pass 63, fail 0` (thời gian: 10.5s) |
| `node docs/evidence/C17/R2-F2-R2/worker/browser-verification.mjs` | Kiểm thử trình duyệt thực tế Puppeteer trên workerd | **0** | 32 quan sát PASS, 0 lỗi console/page, 22 media valid |

### Trích xuất log bài kiểm thử Astro SSR Concurrency:
```text
✔ Actual Compiled Astro Concurrent Workerd Isolation: 3 independent D1 bindings render concurrent SSR HTML with zero cross-talk in one runtime (2860.5196ms)
✔ C17-R2-F2: Studio UI Workflows & Role Administration (2948.0126ms)
ℹ tests 63
ℹ suites 4
ℹ pass 63
ℹ fail 0
ℹ duration_ms 10517.5546
```

---

## 4. Danh mục Tệp Thay đổi & Bằng chứng Thu thập

### Tệp mã nguồn & cấu hình thuộc phạm vi Antigravity:
- `apps/studio/src/preview/renderer.ts`: Khởi tạo singleton promise `ensureStorage()` loại bỏ race condition `AsyncLocalStorage`.
- `apps/studio/src/ui/html.ts`: Bổ sung container cho activities, stages, needs; bảo toàn detail route SEO khi lưu và xóa cụ thể; binding nhãn input.
- `apps/studio/tests/c17-r2-f2.test.mjs`: Đổi tên test mô phỏng; thêm bài test compiled Astro SSR concurrency với 3 D1 bindings và bounded teardown.
- `src/layouts/Layout.astro`: Tách biệt `normalizedRoute` cho SEO và `currentPath` cho thanh điều hướng.
- `tsconfig.json`: Loại trừ các thư mục xem trước (`dist-preview`, `.astro-preview`, `.wrangler`).

### Tệp bằng chứng thu thập:
- `docs/evidence/C17/R2-F2-R2/worker/browser-verification.mjs`: Kịch bản Puppeteer kiểm thử 9 nhóm quy trình trên workerd.
- `docs/evidence/C17/R2-F2-R2/worker/browser-report.json`: Báo cáo dữ liệu 32 quan sát và xác thực 22 tài sản media.
- `docs/evidence/C17/R2-F2-R2/worker/screenshots/`: 29 ảnh chụp màn hình minh chứng đầy đủ các bước kiểm thử.
