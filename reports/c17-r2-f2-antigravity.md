# Báo cáo Triển khai Task C17-R2-F2 — Online Studio: Biên tập viên, Kho ảnh Duyệt & Private Draft Preview SSR

**Người thực hiện:** Antigravity (Dispatched Worker)  
**Nhiệm vụ:** `task_7db18e179a76`  
**Phiên điều phối (Dispatch):** `ctx_977d3559c3a1`  
**Điểm mốc gốc (Baseline):** `c55315703927956794aff756dc7438606ff1408a`  
**Nhánh công việc:** `task/c17-online-studio`  
**Thời gian hoàn thành:** 12/10/2026 20:44+07:00  

---

## 1. Tóm tắt Thực thi (Executive Summary)

1. **Những việc đã làm:**
   - Hoàn thiện toàn diện quy trình giao diện cho cả 8 phân hệ Online Studio trong `apps/studio/src/ui/html.ts`, bảo toàn chính xác giá trị `0` và `null` (sử dụng helper `parseNumOrNull`, không để fallback cứng ghi đè lên dữ liệu có chủ đích của người dùng).
   - Thiết lập Kho tư liệu Chuẩn tắc (Approved Media Registry) với đúng 20 tài sản gốc, băm SHA-256 chuẩn, nạp Worker-native thuần không chứa module Node-only trong bundle runtime.
   - Xây dựng luồng Private Draft Preview SSR sử dụng bộ điều hợp Cloudflare của Astro (`@astrojs/cloudflare`), biên dịch tĩnh trực tiếp handler chính thức của Astro (`apps/studio/src/preview/worker-entry.ts` statically import `@astrojs/cloudflare/handler`), loại bỏ hoàn toàn các lệnh dynamic import runtime và `@vite-ignore`.
   - Cô lập ngữ cảnh yêu cầu bằng `AsyncLocalStorage` (ngăn chặn hoàn toàn hiện tượng cross-talk giữa các request đồng thời), tự động gắn cờ bảo mật (`Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Studio-Private-Preview: true`) và viết lại liên kết nội bộ sang `/preview/*`.
   - Khắc phục triệt để lỗi vi phạm Proxy Invariant trên thuộc tính `length` của mảng trong cả `src/data/campaign.ts` và `src/data/journal.ts` bằng cách đảm bảo cờ `configurable: false` không bị thay đổi.
   - Xác thực giao diện trình duyệt thực tế (Puppeteer) trên cả 8 phân hệ tại 3 kích thước màn hình (375px mobile, 768px tablet, 1440px desktop), xác nhận 0 lỗi console/page error, kiểm chứng bảng cuộn ngang trên mobile và bảo toàn số 0 trong form dự toán.

2. **Kết quả đo lường & Cổng chất lượng:**
   - `npm run studio:typecheck`: 0 lỗi TypeScript.
   - `npm run studio:test`: 57/57 kiểm thử vượt qua (bao gồm kiểm thử workerd preview server render 6 trang công khai, từ chối unauth 401, kiểm thử adversarial, OCC 409, persistence, bundle workerd không phụ thuộc Node).
   - `npm test`: 96/96 kiểm thử hệ thống vượt qua 100%.
   - `npm run build`: Tạo thành công toàn bộ 13 trang tĩnh công khai trong 0.88s.
   - `npx astro build --config astro.preview.config.mjs`: Biên dịch hoàn chỉnh Astro SSR Cloudflare Worker entry trong 1.47s.
   - `browser-verification.mjs`: 25 quan sát thành công, 0 lỗi trang, ảnh chụp màn hình ghi nhận tại `docs/evidence/C17/R2-F2/worker/browser-1791812603848/`.

3. **Hiện trạng bàn giao:**
   - Tất cả mã nguồn, cấu hình và bài kiểm thử thuộc phạm vi worker đã được tích hợp sạch sẽ, ghi nhận log đầy đủ tại `docs/evidence/C17/R2-F2/worker/quality-gates.txt` và metadata tại `docs/evidence/C17/R2-F2/worker/workflow-summary.json`.
   - Sẵn sàng bàn giao cho Codex Reviewer để thẩm định mốc C17-R2-F2.

---

## 2. Chi tiết 8 Phân hệ Biên tập Online Studio (Studio Sections)

| Phân hệ | Thành phần giao diện & Luồng nghiệp vụ | Xử lý Null / Zero & Bảo vệ Dữ liệu |
| :--- | :--- | :--- |
| **1. Dự án (Project)** | Hoạt động (activities), nhu cầu (needs), tiến độ và nút chuyển đổi hiển thị thông tin liên hệ chính thức. | Khi tắt liên hệ, lưu `contacts: null` vào D1; giao diện hiển thị rỗng, không tự động phục sinh fallback cứng. |
| **2. Tiến độ (Progress)** | Quản lý mốc thời gian, số tuần thực tế, tên giai đoạn hiện tại. | Nhập số tuần `0` giữ nguyên `0`; không ghi đè số tuần kế hoạch gốc. |
| **3. Sản phẩm (Products)** | Soạn thảo câu chuyện sản phẩm, cấu hình trạng thái mở bán, giá chính thức, tồn kho thực tế, gắn mediaKey. | Giữ nguyên giá tham khảo cơ sở (`referencePrice`), tách biệt hoàn toàn với giá bán chính thức (`officialPrice`). |
| **4. Tài chính (Finance)** | Cơ chế 2 người độc lập (Four-Eyes), quản lý 5 bảng: sao kê quyên góp, bán hàng gây quỹ, khoản chi, hiện vật tiếp nhận, tổng quan dự toán. | Hàm `parseNumOrNull` bảo lưu số `0` và `null` cho các trường dự toán tài chính; che mã tham chiếu riêng tư (PII Masking). |
| **5. Nhật ký (Journal)** | Danh sách bài viết, soạn thảo bài nháp, gắn ảnh bìa chuẩn, chia khối nội dung. | Chiếu riêng biệt `sanitizeJournalForPrivateDraft` cho phép xem trước bài viết trạng thái `draft` trong `/preview/nhat-ky/[slug]`, trong khi bản xuất bản công khai vẫn lọc nghiêm ngặt `status: 'published'`. |
| **6. Đội ngũ (Team)** | Hồ sơ thành viên, phân công vai trò và nguyên tắc làm việc. | Không hiển thị thông tin liên lạc nhạy cảm chưa được đồng ý. |
| **7. FAQs** | Quản lý 3 nhóm câu hỏi độc lập: Sản phẩm, Đồng hành/Hỗ trợ, Minh bạch. | Phân nhóm rành mạch, bảo toàn định danh và câu trả lời. |
| **8. Quản trị & Lịch sử (Settings/Admin)** | Phân quyền vai trò (Admin, Reviewer, Editor), xem Diff lịch sử, Guarded Restore với khóa lạc quan OCC (409 Conflict). | Bắt lỗi xung đột phiên bản `expectedHash`; tự động rollback khi ghi nhật ký kiểm toán thất bại. |

---

## 3. Kho Tư liệu Chuẩn tắc (Approved Media Registry)

- **Số lượng:** Đúng 20 tệp tư liệu chuẩn tắc theo danh mục phê duyệt C16/C17.
- **Tính toàn vẹn:** Kiểm tra băm SHA-256 đối chiếu trực tiếp với tệp nguồn thực tế.
- **Worker-Native:** Dữ liệu metadata nạp từ tệp JSON chuẩn tắc (`approved-registry.json`), không gọi `fs` hoặc các API đặc thù của Node.js trong bundle Worker.
- **Bảo mật luồng tệp:** Tuyến `GET /api/media/:id/file` phục vụ tệp authenticated từ R2 đính kèm đầy đủ tiêu đề an toàn (`X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'`).

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
   - Gắn cờ bảo mật: `Cache-Control: private, no-cache, no-store, must-revalidate`, `X-Robots-Tag: noindex, nofollow`, `X-Studio-Private-Preview: true`.
   - Viết lại liên kết nội bộ: Chuyển đổi toàn bộ đường dẫn tĩnh (`href="/..."`) sang tiền tố `/preview/...` để người kiểm duyệt duyệt toàn bộ site ở chế độ nháp mà không bị thoát ra trang công khai.
4. **Kiểm chứng workerd Thực tế (unstable_dev):**
   - Khởi chạy Worker biên dịch thật với Miniflare / workerd:
     - Yêu cầu unauthenticated: Bị từ chối 401 Unauthorized trên toàn bộ tuyến (`/preview/dong-hanh`, `/favicon.svg`, `/`).
     - Yêu cầu authenticated (quyền admin dev): Duyệt thành công cả 6 trang công khai (`/preview/`, `/preview/dong-hanh`, `/preview/du-an/mang-theo-mot-net-ve`, `/preview/minh-bach`, `/preview/san-pham`, `/preview/ve-nhom`) và `/preview/nhat-ky` với status 200, tiêu đề trang đầy đủ và cờ bảo mật private preview.

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
ℹ tests 57
ℹ suites 4
ℹ pass 57
ℹ fail 0

=== npm test ===
Exit code: 0
ℹ tests 96
ℹ suites 13
ℹ pass 96
ℹ fail 0

=== npm run build ===
Exit code: 0
13 page(s) built in 0.88s

=== npx astro build --config astro.preview.config.mjs ===
Exit code: 0
Server built in 1.47s
```

Báo cáo này hoàn thành phạm vi công việc của Task C17-R2-F2.
