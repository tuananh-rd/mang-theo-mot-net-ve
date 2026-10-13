# Báo cáo Triển khai Task C17-R2-F3-R1 — Đóng Triệt để các Phát hiện Review RC17-R2-F3

- **Người thực hiện:** Antigravity (Dispatched Worker)
- **Người quản lý / Điều phối:** Claude (`term_6eea08ab-4962-47cc-af7a-93a72441b264`)
- **Task ID:** `task_05156cd744ea`
- **Dispatch ID:** `ctx_f831b53272d6`
- **Baseline:** `db51b9dfef6eece7f0655e05a30e7fc954845a70` (Review RC17-R2-F3 CHANGES_REQUIRED va spec F3-R1)
- **Điểm kiểm tra origin/main:** `0848d1212ea8a2177e76f076a9171c519155dd8a` (Bảo toàn hero assets và Techcombank 19072950239011)
- **Code Commit SHA:** `17cd429d9b2bdb81d7f1a849dc6e2f6001190b26` (`17cd429`)
- **Trạng thái:** Hoàn thành (Succeeded) — 100% Quality Gates Exit 0

---

## 1. Tóm tắt Thực thi (Executive Summary)

1. **Khắc phục Phát hiện 1 (Verifier bắt buộc Commit SHA):**
   - Đã cập nhật logic trong [apps/studio/src/publish/verifier.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/verifier.ts): trạng thái `success` chỉ được thiết lập khi **cả hai** giá trị `sha256` của snapshot và `commitSha` của bản build đều hiện diện và khớp chính xác với yêu cầu.
   - Khi artifact trên live thiếu `commitSha` hoặc bản ghi xuất bản chưa có commit kỳ vọng: trả về `pending` với thông điệp trung thực, không bao giờ đánh dấu `success`. Khi `commitSha` khác biệt: trả về `mismatch` (`mismatch commit`).
   - Đã bổ sung bộ kiểm thử tự động toàn diện bao phủ 7 kịch bản: `success`, `missing commit`, `missing expected commit`, `mismatch commit`, `stale`, `mismatch hash`, `unreachable` (HTTP 503), `malformed` (JSON hỏng), và `webhook secret auth`.

2. **Khắc phục Phát hiện 2 (Bộ phát Artifact Trạng thái Public Build):**
   - Đã tạo endpoint tĩnh [src/pages/_meta/snapshot-status.json.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/src/pages/_meta/snapshot-status.json.ts) và tích hợp qua hook `injectRoute` trong [astro.config.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/astro.config.mjs) và [astro.preview.config.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/astro.preview.config.mjs).
   - Khi biên dịch công khai (`npm run build` và `npx astro build --config astro.preview.config.mjs`), Astro sinh tệp tĩnh `dist/_meta/snapshot-status.json` chứa 4 trường chuẩn: `sha256`, `commitSha` (từ `CF_PAGES_COMMIT_SHA` / `GITHUB_SHA`), `generatedAt`, và `schemaVersion`.
   - Kiểm thử tự động khẳng định không làm thay đổi giao diện, không thêm route người dùng, và tuyệt đối không rò rỉ bất kỳ trường nhạy cảm nào (`modules`, `users`, `token`, `reconciled`).

3. **Khắc phục Phát hiện 3 (Gia cố Kịch bản Khởi động Sản xuất Bootstrap):**
   - Đã hoàn thiện [tools/content-studio/bootstrap-production.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/bootstrap-production.mjs): bổ sung hàm `validateEmail` kiểm tra nghiêm ngặt (từ chối dấu nháy, khoảng trắng, ký tự điều khiển, dấu chấm phẩy), hàm thoát ký tự SQL `escapeSqlString`, và chuyển toàn bộ mã định danh `revId` sang dạng tất định (`rev-${modKey}-1-${revHash.slice(0, 12)}`, không còn `Date.now()`).
   - Kịch bản chỉ ghi preview SQL khi có tham số `--out`, mặc định trỏ vào thư mục bằng chứng `docs/evidence/C17/R2-F3-R1/worker/bootstrap-preview.sql`, không làm bẩn cây repo.
   - Đã kiểm thử thực thi toàn bộ kịch bản SQL sinh ra trên cơ sở dữ liệu SQLite in-memory cô lập (`node:sqlite`): tạo đầy đủ các bảng, khởi tạo đúng 5 bản nháp, 5 revision, 22 tài sản media chuẩn tắc, và chỉ đúng 2 tài khoản quản trị được cấu hình (0 người dùng giả lập).

4. **Khắc phục Phát hiện 4 (Công cụ Phân tích Release Delta Chỉ đọc):**
   - Đã tạo công cụ chỉ đọc [tools/content-studio/release-delta.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/release-delta.mjs): đối soát nhánh hiện tại với `origin/main` (`0848d1212ea8a2177e76f076a9171c519155dd8a`), đối chiếu theo danh sách cho phép (Allowlist) gồm đúng 12 tệp consumer công khai.
   - Khẳng định loại trừ tuyệt đối toàn bộ 2.921 tệp tin nội bộ (`apps/`, `tools/`, `docs/`, `reports/`, test fixtures).
   - Khẳng định bảo toàn 100% hình ảnh hero `chuon-chuon-go-xanh`, mã QR và số tài khoản Techcombank `19072950239011` trong `src/data/campaign.ts`.
   - Sinh tệp patch xem trước `docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch` (53.029 bytes). Tuyệt đối không thực hiện `git push` hay tạo nhánh remote.

---

## 2. Chi tiết Sửa đổi Kỹ thuật

### 2.1. Yêu cầu Bắt buộc Commit SHA trong Live Verifier
- **Tệp nguồn:** [apps/studio/src/publish/verifier.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/verifier.ts)
- **Logic cập nhật:**
  ```typescript
  // 1. Kiểm tra hash
  if (deployedSha256 !== expectedSha256) {
    if (deployedTimestamp > 0 && publicationTimestamp > 0 && deployedTimestamp < publicationTimestamp) {
      return { verified: false, deployStatus: 'stale', ... };
    }
    return { verified: false, deployStatus: 'mismatch', ... };
  }

  // 2. Yêu cầu bắt buộc commitSha: thành công chỉ khi cả sha256 VÀ commitSha đều hiện diện và khớp
  if (!deployedCommitSha) {
    return {
      verified: false,
      deployStatus: 'pending',
      message: 'Artifact kiểm chứng chưa có thông tin commitSha của bản build. Trạng thái triển khai giữ nguyên là pending.',
    };
  }

  if (!expectedCommitSha) {
    return {
      verified: false,
      deployStatus: 'pending',
      message: 'Bản ghi xuất bản chưa có commitSha kỳ vọng để đối soát. Trạng thái triển khai giữ nguyên là pending.',
    };
  }

  if (expectedCommitSha.trim().toLowerCase() !== deployedCommitSha.trim().toLowerCase()) {
    return {
      verified: false,
      deployStatus: 'mismatch',
      message: `Commit SHA triển khai không khớp (mismatch commit): '${deployedCommitSha}' !== '${expectedCommitSha}'.`,
    };
  }

  // 3. Thành công tuyệt đối
  return {
    verified: true,
    deployStatus: 'success',
    message: 'Xác thực triển khai Live thành công: Cả mã băm sha256 và commitSha đều khớp chính xác.',
    verifiedAt: new Date().toISOString(),
  };
  ```

### 2.2. Public Status Endpoint (`/_meta/snapshot-status.json`)
- **Tệp nguồn:** [src/pages/_meta/snapshot-status.json.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/src/pages/_meta/snapshot-status.json.ts)
- **Tệp cấu hình:** [astro.config.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/astro.config.mjs), [astro.preview.config.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/astro.preview.config.mjs)
- **Cơ chế:** Sử dụng `injectRoute({ pattern: '/_meta/snapshot-status.json', entrypoint: './src/pages/_meta/snapshot-status.json.ts' })` để vượt qua quy tắc bỏ qua thư mục `_` mặc định của Astro, sinh ra tệp tĩnh `dist/_meta/snapshot-status.json` trong quá trình build SSG.
- **Nội dung trả về:**
  ```json
  {
    "sha256": null,
    "commitSha": null,
    "generatedAt": null,
    "schemaVersion": "1.0.0"
  }
  ```

### 2.3. Gia cố Production Bootstrap
- **Tệp nguồn:** [tools/content-studio/bootstrap-production.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/bootstrap-production.mjs)
- **Xác thực email:** Biểu thức chính quy `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`, từ chối ký tự `['"\\;\s]`.
- **Thoát SQL:** Thay thế `'` bằng `''`.
- **Tính tất định:** Sử dụng `revId = rev-${modKey}-1-${revHash.slice(0, 12)}` và `options.timestamp || '2026-10-13T00:00:00.000Z'`, giúp 2 lần chạy liên tiếp sinh ra chuỗi SQL giống hệt nhau từng byte.
- **Thư mục xuất tệp:** Mặc định lưu vào `docs/evidence/C17/R2-F3-R1/worker/bootstrap-preview.sql`.

### 2.4. Công cụ Chỉ đọc Release Delta
- **Tệp nguồn:** [tools/content-studio/release-delta.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/release-delta.mjs)
- **Allowlist 12 tệp:**
  1. `src/components/Footer.astro`
  2. `src/components/ProductGrid.astro`
  3. `src/data/campaign.ts`
  4. `src/data/journal.ts`
  5. `src/data/lib/snapshot-loader.ts`
  6. `src/data/published-snapshot.json`
  7. `src/layouts/Layout.astro`
  8. `src/lib/products.ts`
  9. `src/pages/_meta/snapshot-status.json.ts`
  10. `src/pages/nhat-ky/[slug].astro`
  11. `src/pages/san-pham/[slug].astro`
  12. `src/pages/ve-nhom.astro`
- **Tệp Patch Xem trước:** `docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch`

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

### 3.3. Biên dịch Trang Tĩnh Astro (`npm run build`)
- **Lệnh:** `npm run build`
- **Mã thoát:** 0
```
> mang-theo-mot-net-ve@0.0.1 build
> astro build

08:18:59 [build] output: "static"
08:18:59 [build] mode: "static"
08:18:59 [build] directory: C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\dist\
08:18:59 [build] Collecting build info...
08:18:59 [build] ✓ Completed in 145ms.
08:18:59 [build] Building static entrypoints...
08:19:00 [vite] ✓ built in 206ms
08:19:00 [vite] ✓ built in 29ms
08:19:00 [build] Rearranging server assets...

 generating static routes 
08:19:00   ├─ /_meta/snapshot-status.json (+5ms) 
08:19:00   ├─ /404.html (+6ms) 
08:19:00   ├─ /dong-hanh/index.html (+8ms) 
08:19:00   ├─ /du-an/mang-theo-mot-net-ve/index.html (+5ms) 
08:19:00   ├─ /minh-bach/index.html (+4ms) 
08:19:00   ├─ /nhat-ky/ke-hoach-bon-goc-choi/index.html (+3ms) 
08:19:00   ├─ /nhat-ky/gioi-thieu-qua-luu-niem-gay-quy/index.html (+2ms) 
08:19:00   ├─ /nhat-ky/index.html (+3ms) 
08:19:00   ├─ /san-pham/chuon-chuon-tre-kem-de/index.html (+3ms) 
08:19:00   ├─ /san-pham/chuon-chuon-tre/index.html (+2ms) 
08:19:00   ├─ /san-pham/moc-khoa/index.html (+2ms) 
08:19:00   ├─ /san-pham/index.html (+4ms) 
08:19:00   ├─ /ve-nhom/index.html (+2ms) 
08:19:00   ├─ /index.html (+3ms) 
08:19:00 ✓ Completed in 79ms.

08:19:00 [build] ✓ Completed in 382ms.
08:19:00 [build] 13 page(s) built in 535ms
08:19:00 [build] Complete!
```

### 3.4. Biên dịch Máy chủ Xem trước Cloudflare Preview (`npx astro build --config astro.preview.config.mjs`)
- **Lệnh:** `npx astro build --config astro.preview.config.mjs`
- **Mã thoát:** 0
```
08:19:02 [build] output: "server"
08:19:02 [build] mode: "server"
08:19:02 [build] directory: C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\dist-preview\
08:19:02 [build] adapter: @astrojs/cloudflare
08:19:02 [build] Collecting build info...
08:19:02 [build] ✓ Completed in 201ms.
08:19:02 [build] Building server entrypoints...
08:19:02 [vite] ✓ built in 132ms
08:19:02 [vite] ✓ built in 234ms
08:19:02 [vite] ✓ built in 29ms

 prerendering static routes 
08:19:03   ├─ /_meta/snapshot-status.json (+13ms) 
08:19:03 ✓ Completed in 430ms.

08:19:03 [build] Rearranging server assets...
08:19:03 [build] ✓ Completed in 935ms.
08:19:03 [@astrojs/cloudflare] Injected immutable Cache-Control for /_astro/* into _headers.
08:19:03 [build] Server built in 1.16s
08:19:03 [build] Complete!
```

### 3.5. Kiểm tra Cú pháp Toàn diện Dự án Gốc (`npm run check`)
- **Lệnh:** `npm run check`
- **Mã thoát:** 0
```
Result (248 files): 
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
ℹ duration_ms 449.6595
```

### 3.7. Bộ Kiểm thử Toàn diện Studio (`npm run studio:test`)
- **Lệnh:** `npm run studio:test`
- **Mã thoát:** 0
- **Kết quả:** 82/82 tests pass trên 4 suites (bao gồm 18 bài kiểm thử hợp đồng nhà xuất bản, live verifier, bootstrap và release delta):
```
✔ Live Verifier: Xác thực thành công khi artifact khớp chính xác cả SHA-256 và commitSha (0.4805ms)
✔ Live Verifier: Trả về pending khi artifact thiếu commitSha (0.2867ms)
✔ Live Verifier: Trả về pending khi publication thiếu expectedCommitSha (0.2554ms)
✔ Live Verifier: Phát hiện không khớp commitSha (mismatch commit) (0.3038ms)
✔ Live Verifier: Phát hiện bản triển khai cũ (Stale) và không khớp mã băm (Mismatch Hash) (0.3873ms)
✔ Live Verifier: Xử lý máy chủ không thể kết nối (Unreachable) và phản hồi sai lệch (Malformed JSON) (0.319ms)
✔ Live Verifier: Webhook Secret Authentication (Bảo vệ bí mật) (2.0473ms)
✔ Snapshot Exporter: Thẩm định sâu, từ chối bài draft và ghi tệp an toàn (9.671ms)
✔ Production Config: wrangler.production.toml cấu hình chuẩn và fail-secure (0.5986ms)
✔ Production Bootstrap: Validate email, SQL escaping, ID tất định và áp dụng sạch sẽ trên D1/SQLite (6.9564ms)
✔ Status Artifact Producer: /_meta/snapshot-status.json trong bản build chứa đúng định dạng và không rò rỉ trường nhạy cảm (0.4815ms)
✔ Release Delta: Chỉ đọc, lọc đúng 12 tệp consumer công khai, loại trừ nghiêm ngặt các tệp cấm và bảo toàn Hero & Techcombank 19072950239011 (186.8851ms)
...
✔ Worker Bundle Verification: Kiểm tra Worker không chứa module Node-only trong toàn bộ dependency graph (17.5374ms)
ℹ tests 82
ℹ suites 4
ℹ pass 82
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 7157.7609
```

### 3.8. Thực thi Công cụ Release Delta (`node tools/content-studio/release-delta.mjs`)
- **Lệnh:** `node tools/content-studio/release-delta.mjs`
- **Mã thoát:** 0
```
=== PHÂN TÍCH DELTA BẢN PHÁT HÀNH CÔNG KHAI (RELEASE DELTA) ===
- Base origin/main commit: 0848d1212ea8a2177e76f076a9171c519155dd8a
- Số tệp consumer công khai hợp lệ: 12
  Danh sách tệp:
    + src/components/Footer.astro
    + src/components/ProductGrid.astro
    + src/data/campaign.ts
    + src/data/journal.ts
    + src/data/lib/snapshot-loader.ts
    + src/data/published-snapshot.json
    + src/layouts/Layout.astro
    + src/lib/products.ts
    + src/pages/_meta/snapshot-status.json.ts
    + src/pages/nhat-ky/[slug].astro
    + src/pages/san-pham/[slug].astro
    + src/pages/ve-nhom.astro
- Tệp bị loại trừ an toàn (Studio/Docs/Evidence): 2921
- Bảo toàn Hero & Techcombank 19072950239011: ĐẠT
- Tệp patch xem trước: docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch (53029 bytes)
```

---

## 4. Phân định Rõ ràng: Kiểm thử qua Fixture vs. Tích hợp Thực tế

1. **Đã Kiểm thử Cục bộ (Local Isolated Tested Scenarios):**
   - Live Verifier: kiểm thử qua các phản hồi HTTP giả lập (mock `fetchFn`) theo chuẩn RFC, bao phủ toàn bộ các trường hợp thành công, thiếu commit, sai commit, bản cũ, sai hash, mạng ngắt, JSON hỏng.
   - Endpoint tĩnh `/_meta/snapshot-status.json`: kiểm thử quá trình sinh tệp build SSG thực tế, đối soát cấu trúc và khẳng định không rò rỉ dữ liệu nhạy cảm.
   - Bootstrap Production: kiểm thử cú pháp SQL và thực thi DDL/DML trực tiếp trên SQLite in-memory, xác thực email và tính tất định.
   - Release Delta: kiểm thử đối soát mã Git đối chiếu trực tiếp với ref `origin/main` (`0848d1212ea8a2177e76f076a9171c519155dd8a`).

2. **Chưa Thực hiện & Cần Kích hoạt Thực tế (Untested Real Integration / Prerequisites):**
   - **Chưa đẩy PR release delta lên GitHub remote:** Cần người quản lý duyệt tệp `public-consumer-release.patch` và tạo PR lên `main`.
   - **Chưa tạo tài nguyên đám mây:** Chưa khởi tạo Cloudflare D1 `studio-d1-prod` và Cloudflare R2 `studio-media-prod`.
   - **Chưa cấu hình Cloudflare Access:** Chưa thiết lập Team Domain và Application AUD cho `studio.mangtheomotnetve.website`.
   - **Chưa trỏ DNS & Chưa deploy Worker:** Chưa chạy `wrangler deploy` môi trường production.

---

## 5. Danh mục Tệp tin Bàn giao

1. **Mã nguồn Ứng dụng & Hợp đồng:**
   - [apps/studio/src/publish/verifier.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/src/publish/verifier.ts)
   - [src/pages/_meta/snapshot-status.json.ts](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/src/pages/_meta/snapshot-status.json.ts)
   - [astro.config.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/astro.config.mjs)
   - [astro.preview.config.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/astro.preview.config.mjs)
2. **Công cụ Khởi tạo & Phân tích:**
   - [tools/content-studio/bootstrap-production.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/bootstrap-production.mjs)
   - [tools/content-studio/release-delta.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/tools/content-studio/release-delta.mjs)
3. **Kiểm thử Tự động:**
   - [apps/studio/tests/publisher-contract.test.mjs](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/apps/studio/tests/publisher-contract.test.mjs)
4. **Bằng chứng & Báo cáo:**
   - [docs/evidence/C17/R2-F3-R1/worker/verification-results.json](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R2-F3-R1/worker/verification-results.json)
   - [docs/evidence/C17/R2-F3-R1/worker/bootstrap-preview.sql](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R2-F3-R1/worker/bootstrap-preview.sql)
   - [docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R2-F3-R1/worker/public-consumer-release.patch)
   - [reports/c17-r2-f3-r1-antigravity.md](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/reports/c17-r2-f3-r1-antigravity.md)

---

## 6. Cam kết Tuân thủ Nguyên tắc Dự án

1. **Bảo tồn Dữ liệu & Tài sản Hiện hữu:** Giữ nguyên 100% tài sản hero `0848d12`, mã QR và tài khoản Techcombank `19072950239011`, và thiết kế trang công khai C16.
2. **Không Đụng chạm Tệp Ngoài Phạm vi:** Không chỉnh sửa hoặc xóa các tài liệu quy hoạch `docs/*` hay `README.md` do Quản lý sở hữu. Giữ nguyên các tệp dirty có sẵn.
3. **Chỉ Đọc & Không Thực hiện Thao tác Đám mây Trái phép:** Không có `git push`, không tạo nhánh remote, không tạo tài nguyên Cloudflare thực tế trong cột mốc này.
