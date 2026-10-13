# Báo cáo Triển khai Task C17-R2-F3 — Hợp đồng Nhà xuất bản GitHub và Khởi động Sản xuất An toàn

- **Người thực hiện:** Antigravity (Dispatched Worker)
- **Người quản lý / Điều phối:** Claude (`term_6eea08ab-4962-47cc-af7a-93a72441b264`)
- **Task ID:** `task_42bbb8eeb1db`
- **Dispatch ID:** `ctx_761ae8a6eafa`
- **Baseline:** `40491cf54199fcb63bc0d9841f3e7b2693895e69` (Review RC17-R2-F2-R3 PASS)
- **Điểm kiểm tra main nguồn (Checkpoint origin/main):** `0848d1212ea8a2177e76f076a9171c519155dd8a` (Bảo toàn tài sản hero và QR Techcombank 19072950239011)
- **Code Commit SHA:** `e7e74b953aac73edfbae4e6da16d4b8b6e4e2bd3` (`e7e74b9`)
- **Trạng thái:** Hoàn thành (Succeeded) — 100% Quality Gates Exit 0

---

## 1. Tóm tắt Thực thi (Executive Summary)

1. **Hoàn thiện Hợp đồng Xuất bản GitHub (Publisher Contract) & Bảo toàn Nhánh Main:**
   - Đã xây dựng adapter GitHub API (`apps/studio/src/publish/github.ts`) thực hiện chu trình 7 bước xuất bản: kiểm tra cấu hình -> đọc ref nhánh gốc `origin/main` -> lấy base commit -> tạo blob cho snapshot và approved assets -> tạo Git tree hợp nhất với base tree -> tạo Git commit mang parent duy nhất -> cập nhật/tạo nhánh nội dung chuyên biệt -> mở/tái sử dụng Pull Request.
   - Nghiêm cấm tuyệt đối việc đẩy trực tiếp lên `main` hoặc dùng cờ `--force`. Thực hiện so sánh lịch sử nhánh (`/compare/{existingSha}...{newCommitSha}`): cho phép fast-forward an toàn hoặc tái sử dụng nhánh khi commit trùng khớp, nhưng từ chối dứt khoát với mã lỗi 409 (`conflicting_branch`) khi nhánh có commit phân kỳ xung đột.
   - Thực hiện làm sạch token bảo mật (Token Scrubbing) triệt để trong mọi thông báo lỗi và chuỗi URL. Trả về `not_configured` trung thực khi thiếu `GITHUB_TOKEN`, không thực hiện bất kỳ mô phỏng ngầm nào.

2. **Xác thực Triển khai Thực tế Độc lập (Live Deployment Verifier) & Tách bạch Trạng thái:**
   - Tách biệt rõ ràng 4 trạng thái: Trạng thái yêu cầu (`publicationStatus`), Trạng thái PR (`prStatus`), Trạng thái biên dịch (`buildStatus`), và Trạng thái triển khai thực tế (`deployStatus`: `unknown`, `pending`, `building`, `success`, `failed`, `mismatch`, `stale`).
   - Xây dựng bộ xác thực trực tiếp `verifyLiveDeployment` (`apps/studio/src/publish/verifier.ts`): chủ động tải tệp tin artifacts `/.well-known/publication-deployment.json` từ `PRODUCTION_SITE_ORIGIN`, đối soát độc lập mã băm `publicationHash` và `commitSha`. Từ chối hoàn toàn việc nhận cờ boolean hoặc SHA từ phía client mà không kiểm chứng.
   - Hỗ trợ xác thực webhook triển khai an toàn theo thời gian hằng số (`timingSafeEqual`) với bí mật `DEPLOYMENT_WEBHOOK_SECRET`.

3. **Xuất Coherent Snapshot & Khởi động Sản xuất An toàn (Safe Production Bootstrap):**
   - Hoàn thiện `exportApprovedSnapshot` (`apps/studio/src/publish/consumer.ts`): bắt buộc chỉ định thư mục đích cách ly rõ ràng, thẩm định sâu schema toàn diện trước khi ghi, nghiêm cấm xuất bài viết bản nháp (`draft`) hoặc dữ liệu tài chính chưa đối soát/chưa phê duyệt, dọn dẹp nguyên tử khi xảy ra lỗi, và đảm bảo đồ thị Worker không chứa module hệ thống tệp tin `node:fs`.
   - Cung cấp tệp cấu hình sản xuất `apps/studio/wrangler.production.toml` cho miền `studio.mangtheomotnetve.website` với liên kết D1/R2 sản xuất riêng biệt, cấu hình Cloudflare Access chuẩn, và hoàn toàn loại bỏ các cờ DEV bypass/role spoofing.
   - Cung cấp kịch bản khởi sinh sản xuất sạch `tools/content-studio/bootstrap-production.mjs`: khởi tạo schema D1, nạp 22 tài sản media chuẩn tắc từ `APPROVED_MEDIA_REGISTRY`, cấu hình mặc định ban đầu và quản trị viên từ biến môi trường/cấu hình ngoài, không sao chép dữ liệu thử nghiệm hay tài khoản giả lập từ máy cục bộ.

---

## 2. Chi tiết Triển khai 5 Hạng mục C17-R2-F3

### 2.1. Hạng mục 1 & 2: Hợp đồng Nhà xuất bản GitHub & Khả năng Phục hồi Từng phần
- **Vị trí tệp:** [apps/studio/src/publish/github.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/github.ts)
- **Chu trình Xuất bản 7 Giai đoạn:**
  1. `init`: Xác thực cấu hình `GITHUB_TOKEN` và `GITHUB_REPO`. Nếu thiếu, trả về `{ success: false, error: 'not_configured' }`.
  2. `base_ref`: Đọc ref chuẩn tắc `GET /repos/{repo}/git/ref/heads/{baseBranch}` (mặc định `main`).
  3. `base_commit`: Đọc commit chi tiết `GET /repos/{repo}/git/commits/{sha}` để lấy `baseTreeSha`.
  4. `blobs`: Tạo các Git blob cho dữ liệu `snapshot.json` và toàn bộ các tệp nhị phân của tài sản đã duyệt (`APPROVED_MEDIA_REGISTRY`).
  5. `tree`: Tạo Git tree mới `POST /repos/{repo}/git/trees` dựa trên `base_tree: baseTreeSha`, bảo toàn 100% các tệp tin hiện hữu của nhánh `main` (bao gồm hero assets và Techcombank QR).
  6. `commit`: Tạo Git commit `POST /repos/{repo}/git/commits` trỏ về `parents: [baseCommitSha]`.
  7. `branch_ref` & `pull_request`: Kiểm tra nhánh `heads/{contentBranch}`:
     - Nếu chưa tồn tại: Tạo mới ref.
     - Nếu đã tồn tại và commit trùng khớp (`existingSha === newCommitSha`): Giữ nguyên (idempotent).
     - Nếu đã tồn tại và commit khác biệt: So sánh `GET /repos/{repo}/compare/{existingSha}...{newCommitSha}`. Nếu commit mới tiến thẳng (`ahead`), cập nhật ref theo kiểu fast-forward (`force: false`). Nếu phân kỳ (`diverged` hoặc `behind`), từ chối với mã lỗi 409 `conflicting_branch`.
     - Tìm kiếm hoặc mở mới PR `POST /repos/{repo}/pulls` mô tả thay đổi, ghi nhận URL PR và SHA commit vào D1.
- **Làm sạch Token (Token Scrubbing):**
  Hàm `scrubToken(message, token)` thay thế toàn bộ token GitHub (chuỗi cấu hình và regex `gh[pousr]_[A-Za-z0-9_]{36,}`) bằng `[REDACTED_TOKEN]`.

### 2.2. Hạng mục 3: Trích xuất Coherent Snapshot & Tài sản Đã duyệt
- **Vị trí tệp:** [apps/studio/src/publish/consumer.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/consumer.ts)
- Bắt buộc kiểm tra `targetDirectory`: Không được rỗng hoặc trỏ vào đường dẫn gốc nguy hiểm.
- Thẩm định sâu Schema trước khi xuất:
  - Kiểm tra 5 phân hệ: `project`, `finance`, `journal`, `products`, `media`.
  - Phân hệ nhật ký: Kiểm tra mọi bài viết, nếu có bài ở trạng thái `draft` lập tức từ chối xuất với lỗi `Cannot export unpublished draft article: {slug}`.
  - Phân hệ tài chính: Bắt buộc `reconciled === true` và `publicApproval === true`.
- Ghi tệp nguyên tử và tự động dọn dẹp:
  - Nếu quá trình ghi tệp hoặc ghi media gặp sự cố, toàn bộ thư mục đích sẽ được dọn dẹp sạch sẽ (`rmSync(targetDir, { recursive: true, force: true })`), không bao giờ để lại trạng thái thư mục dở dang.
  - Đảm bảo trong môi trường Worker, module `apps/studio/src/publish/consumer.ts` không nằm trong luồng thực thi của Worker chính (Worker bundle test xác nhận 0 module `node:fs`).

### 2.3. Hạng mục 4: Tách bạch Trạng thái & Live Deployment Verifier
- **Vị trí tệp:** [apps/studio/src/publish/verifier.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/verifier.ts), [apps/studio/src/api/router.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/api/router.ts)
- Mở rộng kiểu dữ liệu `deployStatus`:
  `'unknown' | 'pending' | 'building' | 'success' | 'failed' | 'mismatch' | 'stale'`
- Tuyến API `/api/publications/:id/verify-deploy`:
  - Lấy bản ghi xuất bản từ D1 theo `id`.
  - Nếu chưa có `PRODUCTION_SITE_ORIGIN`, trả về trạng thái `pending` kèm chỉ dẫn trung thực `No production site origin configured for live deployment verification`.
  - Tải tệp `${siteOrigin}/.well-known/publication-deployment.json`.
  - Đối soát độc lập:
    - Nếu mã băm không khớp: Cập nhật `deployStatus = 'mismatch'`.
    - Nếu thời gian bản triển khai cũ hơn thời điểm xuất bản: Cập nhật `deployStatus = 'stale'`.
    - Nếu khớp chính xác cả mã băm và commit: Cập nhật `deployStatus = 'success'` và ghi nhận `verifiedAtTimestamp`.
- Tuyến Webhook `/api/publications/webhook/deployment`:
  - Xác thực tiêu đề `X-Deployment-Webhook-Secret` bằng hàm thời gian không đổi `timingSafeEqual`.
  - Không tin tưởng mù quáng payload: Gọi trực tiếp hàm xác thực live verifier để kiểm chứng trước khi cập nhật trạng thái.

### 2.4. Hạng mục 5: Cấu hình Sản xuất Chuẩn tắc & Kịch bản Khởi động An toàn
- **Tệp Cấu hình Sản xuất:** [apps/studio/wrangler.production.toml](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/wrangler.production.toml)
  - Tên ứng dụng: `mang-theo-mot-net-ve-studio-prod`
  - Miền định tuyến: `routes = [{ pattern = "studio.mangtheomotnetve.website/*", zone_name = "mangtheomotnetve.website" }]`
  - Cơ sở dữ liệu D1 sản xuất: `database_name = "studio-d1-prod"`
  - Kho lưu trữ R2 sản xuất: `bucket_name = "studio-media-prod"`
  - Khóa bảo mật môi trường: `STUDIO_ENVIRONMENT = "production"`, `CF_ACCESS_TEAM_DOMAIN = "<PROD_ACCESS_TEAM_DOMAIN>"`, `CF_ACCESS_AUD = "<PROD_ACCESS_AUD>"`.
  - Khẳng định: Hoàn toàn không chứa các cờ `DEV_BYPASS_AUTH`, không chứa tài khoản giả định.
- **Kịch bản Khởi động Sản xuất:** [tools/content-studio/bootstrap-production.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/bootstrap-production.mjs)
  - Khởi tạo đầy đủ cấu trúc bảng D1: `drafts`, `draft_revisions`, `audit_logs`, `publications`, `media_assets`, `user_roles`.
  - Nạp 22 tài sản media chuẩn tắc từ `APPROVED_MEDIA_REGISTRY` (ở trạng thái `approved`, danh mục, MIME type, kích thước chuẩn xác).
  - Khởi tạo các phân hệ nội dung ban đầu từ `getDefaultModuleData()`: dự án, ẩm thực, sản phẩm, nhật ký, tài chính đã đối soát ban đầu.
  - Thiết lập quản trị viên ban đầu dựa trên tham số `--admin-email` hoặc biến môi trường `STUDIO_ADMIN_EMAIL` (mặc định `admin@mangtheomotnetve.website`).
  - Hỗ trợ chế độ sinh câu lệnh SQL (`--sql`) hoặc xuất ra tệp an toàn (`--out <path>`) để thực thi qua `wrangler d1 execute`.

---

## 3. Bằng chứng Thực thi Quality Gates (Toàn bộ Exit Code 0 & Raw Logs)

### 3.1. Biên dịch TypeScript Studio (`npm run studio:build`)
- **Lệnh:** `npm run studio:build`
- **Mã thoát:** 0
```
> mang-theo-mot-net-ve@0.0.1 studio:build
> tsc -p apps/studio/tsconfig.json
```

### 3.2. Kiểm tra Kiểu TypeScript Studio (`npm run studio:typecheck`)
- **Lệnh:** `npm run studio:typecheck`
- **Mã thoát:** 0
```
> mang-theo-mot-net-ve@0.0.1 studio:typecheck
> tsc --noEmit -p apps/studio/tsconfig.json
```

### 3.3. Biên dịch Máy chủ Xem trước Astro Cloudflare (`npx astro build --config astro.preview.config.mjs`)
- **Lệnh:** `npx astro build --config astro.preview.config.mjs`
- **Mã thoát:** 0
```
07:55:18 [vite] Re-optimizing dependencies because vite config has changed
07:55:18 [types] Generated 276ms
07:55:18 [build] output: "server"
07:55:18 [build] mode: "server"
07:55:18 [build] directory: C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\dist-preview\
07:55:18 [build] adapter: @astrojs/cloudflare
07:55:18 [build] Collecting build info...
07:55:18 [build] ✓ Completed in 322ms.
07:55:18 [build] Building server entrypoints...
07:55:18 [vite] ✓ built in 171ms
07:55:19 [build] Rearranging server assets...
07:55:19 [build] ✓ Completed in 1.55s.
07:55:19 [@astrojs/cloudflare] Injected immutable Cache-Control for /_astro/* into _headers.
07:55:19 [build] Server built in 1.89s
07:55:19 [build] Complete!
```

### 3.4. Biên dịch Giao diện Tĩnh Gốc Astro (`npm run build`)
- **Lệnh:** `npm run build`
- **Mã thoát:** 0
```
> mang-theo-mot-net-ve@0.0.1 build
> astro build

07:55:25 [types] Generated 176ms
07:55:25 [build] output: "static"
07:55:25 [build] directory: C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\dist\
07:55:25 [build] Collecting build info...
07:55:25 [build] ✓ Completed in 216ms.
07:55:25 [build] Building static entrypoints...
07:55:25 [vite] ✓ built in 233ms
07:55:25 [build] Rearranging server assets...

 generating static routes 
07:55:25   ├─ /404.html (+11ms) 
07:55:25   ├─ /dong-hanh/index.html (+10ms) 
07:55:25   ├─ /du-an/mang-theo-mot-net-ve/index.html (+7ms) 
07:55:25   ├─ /minh-bach/index.html (+6ms) 
07:55:25   ├─ /nhat-ky/ke-hoach-bon-goc-choi/index.html (+4ms) 
07:55:25   ├─ /nhat-ky/gioi-thieu-qua-luu-niem-gay-quy/index.html (+2ms) 
07:55:25   ├─ /nhat-ky/index.html (+7ms) 
07:55:25   ├─ /san-pham/chuon-chuon-tre-kem-de/index.html (+6ms) 
07:55:25   ├─ /san-pham/chuon-chuon-tre/index.html (+4ms) 
07:55:25   ├─ /san-pham/moc-khoa/index.html (+4ms) 
07:55:25   ├─ /san-pham/index.html (+8ms) 
07:55:25   ├─ /ve-nhom/index.html (+6ms) 
07:55:25   ├─ /index.html (+5ms) 
07:55:25 ✓ Completed in 106ms.

07:55:25 [build] ✓ Completed in 466ms.
07:55:25 [build] 13 page(s) built in 709ms
07:55:25 [build] Complete!
```

### 3.5. Kiểm tra Cú pháp Toàn diện Dự án Gốc (`npm run check`)
- **Lệnh:** `npm run check`
- **Mã thoát:** 0
```
Result (246 files): 
- 0 errors
- 0 warnings
- 40 hints
```

### 3.6. Bộ Kiểm thử Gốc (`npm test`)
- **Lệnh:** `npm test`
- **Mã thoát:** 0
```
ℹ tests 96
ℹ suites 13
ℹ pass 96
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 520.1225
```

### 3.7. Bộ Kiểm thử Studio & Hợp đồng Xuất bản (`npm run studio:test`)
- **Lệnh:** `npm run studio:test`
- **Mã thoát:** 0
- **Kết quả:** 76/76 bài kiểm thử đạt tuyệt đối trên 4 suites (bao gồm 12 bài kiểm thử mới cho Hợp đồng Nhà xuất bản):
```
✔ Publisher: Thiếu GITHUB_TOKEN trả về not_configured và không mô phỏng ngầm (3.7835ms)
✔ Publisher: Thành công end-to-end với đầy đủ chu trình ref -> commit -> tree -> commit -> ref -> PR (45.9846ms)
✔ Publisher: Xóa bỏ token (Token Scrubbing) trong mọi phản hồi lỗi (1.005ms)
✔ Publisher: Phát hiện phản hồi sai lệch (Malformed Response) tại từng bước (0.9885ms)
✔ Publisher: Idempotent Retry tái sử dụng nhánh và Pull Request đã có (1.7615ms)
✔ Publisher: Từ chối ghi đè khi nhánh đã có commit phân kỳ xung đột (Conflicting Branch) (1.4544ms)
✔ Live Verifier: Xác thực thành công khi artifact khớp chính xác SHA-256 (0.7041ms)
✔ Live Verifier: Phát hiện bản triển khai cũ (Stale) và không khớp (Mismatch) (0.5856ms)
✔ Live Verifier: Webhook Secret Authentication (Bảo vệ bí mật) (2.3496ms)
✔ Snapshot Exporter: Thẩm định sâu, từ chối bài draft và ghi tệp an toàn (10.9188ms)
✔ Production Config: wrangler.production.toml cấu hình chuẩn và fail-secure (0.6408ms)
✔ Production Bootstrap: generateProductionBootstrapSql sinh đúng kịch bản schema, RBAC, 5 phân hệ và 22 media (7.8486ms)
...
✔ Worker Bundle Verification: Kiểm tra Worker không chứa module Node-only trong toàn bộ dependency graph (22.57ms)
ℹ tests 76
ℹ suites 4
ℹ pass 76
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 10463.6849
```

---

## 4. Phân định Rõ ràng: Kiểm thử qua Fixture vs. Tích hợp Thực tế

1. **Đã Kiểm thử qua Fixtures Cô lập (Local Isolated Tested Scenarios):**
   - Hành vi tương tác GitHub API (7 giai đoạn, phân nhánh, so sánh commit `compare`, tái sử dụng nhánh, token scrubbing) được kiểm thử mô phỏng với môi trường inject `fetchFn` chính xác theo RFC GitHub REST API v3.
   - Hành vi xác thực Live Deployment (`verifyLiveDeployment`) được kiểm thử với các kịch bản khớp SHA, stale thời gian, và mismatch artifact băm.
   - Hành vi xác thực Webhook Secret được kiểm thử theo thuật toán `timingSafeEqual`.
   - Hành vi xuất bản snapshot được kiểm thử với thư mục tạm cách ly, chặn đứng các bài viết bản nháp `draft` và dữ liệu tài chính chưa duyệt.
   - Toàn bộ cơ sở dữ liệu D1 và kho R2 được kiểm thử trên SQLite Miniflare cục bộ và Worker runtime thật (`unstable_dev`).

2. **Chưa Thực hiện & Cần Kích hoạt Thực tế (Untested Real Integration / Prerequisites):**
   - **Chưa đẩy commit hay mở PR thật lên GitHub remote:** Chưa cấu hình PAT `GITHUB_TOKEN` thật của tổ chức.
   - **Chưa tạo tài nguyên Đám mây thật trên Cloudflare:** Chưa tạo D1 database `studio-d1-prod` và R2 bucket `studio-media-prod`.
   - **Chưa kích hoạt Cloudflare Access thật:** Chưa tạo Access Application cho `studio.mangtheomotnetve.website`, chưa điền `CF_ACCESS_TEAM_DOMAIN` và `CF_ACCESS_AUD` vào Secrets của Cloudflare Worker.
   - **Chưa trỏ DNS:** Chưa cấu hình CNAME cho tên miền phụ `studio.mangtheomotnetve.website`.
   - **Chưa thực hiện triển khai Worker thật:** Chưa chạy `wrangler deploy` lên môi trường sản xuất công khai.

---

## 5. Danh mục Tệp tin Bàn giao

1. **Mã nguồn Ứng dụng & Hợp đồng Xuất bản:**
   - [apps/studio/src/types.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/types.ts)
   - [apps/studio/src/db/client.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/db/client.ts)
   - [apps/studio/src/publish/github.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/github.ts)
   - [apps/studio/src/publish/verifier.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/verifier.ts)
   - [apps/studio/src/publish/consumer.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/consumer.ts)
   - [apps/studio/src/api/router.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/api/router.ts)
2. **Cấu hình & Kịch bản Sản xuất:**
   - [apps/studio/wrangler.production.toml](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/wrangler.production.toml)
   - [tools/content-studio/bootstrap-production.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/bootstrap-production.mjs)
3. **Kiểm thử Tự động:**
   - [apps/studio/tests/publisher-contract.test.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/tests/publisher-contract.test.mjs)
4. **Bằng chứng & Báo cáo:**
   - [docs/evidence/C17/R2-F3/worker/publisher-contract-results.json](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R2-F3/worker/publisher-contract-results.json)
   - [reports/c17-r2-f3-antigravity.md](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/reports/c17-r2-f3-antigravity.md)

---

## 6. Giới hạn & Tuân thủ Nguyên tắc Dự án

1. **Bảo tồn Tài sản Hiện hữu:** Giữ nguyên vẹn 100% hình ảnh hero `0848d12`, mã QR Techcombank `19072950239011`, và thiết kế trang công khai C16.
2. **Không Can thiệp Tệp Ngoài Phạm vi:** Không chỉnh sửa các tài liệu kế hoạch `docs/*` hay `README.md` do Quản lý sở hữu. Không xóa các thư mục `apps/studio/test-race-*`.
3. **Tính Bền vững & An toàn:** 0 module `node:fs` trong bundle Worker Cloudflare. Không để lọt token hay mật khẩu vào log hoặc tệp cấu hình sản xuất.
