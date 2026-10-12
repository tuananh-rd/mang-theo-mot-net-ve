# Báo Cáo Hoàn Thành Nhiệm Vụ C17-R2 — Functional Content Studio Online Readiness

- **Thực hiện:** Antigravity (Sole Application Developer)
- **Quản lý & Review:** Codex (Coordinator & Reviewer)
- **Mã nhiệm vụ (Task ID):** `task_150eee84b651`
- **Mã điều phối (Dispatch ID):** `ctx_a8a66b2e0b52`
- **Baseline Git:** `3657a44dbbf46ea9564016248f3daacd9d45cbd0` (Kế thừa từ R1 baseline `b5a4d4f`, đính chính commit lịch sử `e0bef` không phải HEAD ban đầu của R2)
- **Thời gian hoàn thành:** 12/10/2026

---

## 1. Tóm Tắt Điều Hành (Executive Summary)

1. **Những việc đã thực hiện (What was done):**
   - Triển khai cơ chế xác thực tài chính 2 người (Two-Person Attestation / Four-Eyes Principle): gắn chặt chữ ký số nội bộ (Người lập - Preparer và Người duyệt độc lập - Reviewer) với mã băm phiên bản bất biến (`revisionId` và `revisionHash`), chặn triệt để việc máy khách tự gửi cờ duyệt `reconciled`/`publicApproval`/`firstSigner`/`secondSigner` khi lưu nháp.
   - Bổ sung quy trình máy chủ áp dụng sao kê thực tế từ CSV (`POST /api/finance/apply-csv`), kiểm tra cú pháp RFC 4180, tiền tệ và ngày tháng, tự động đặt lại trạng thái duyệt về `pending`.
   - Xây dựng bộ lọc làm sạch siêu dữ liệu ảnh raster (`stripImageMetadata` loại bỏ APP1 EXIF/GPS khỏi JPEG và các chunk văn bản riêng tư `tEXt`/`zTXt`/`iTXt`/`eXIf` khỏi PNG), kiểm tra cấu trúc raster (loại bỏ tệp cắt cụt hoặc thiếu IHDR trước khi lưu vào R2) và kiểm tra liên kết tham chiếu toàn hệ thống (`checkAssetUsageAcrossSystem`) để ngăn chặn việc xóa tài sản truyền thông đang được dùng trong bản nháp, lịch sử hoặc xuất bản.
   - Hoàn thiện bộ kết nối xuất bản GitHub (`apps/studio/src/publish/adapter.ts`): trả về mã lỗi chuẩn `not_configured` khi chưa cấu hình token bí mật thay vì giả lập trạng thái Live hoặc giả mạo SHA commit; đồng thời ghi nhận đúng `git_ref` khi kích hoạt.
   - Cập nhật logic trích xuất bản chụp công khai (`src/data/lib/snapshot-loader.ts`): phân biệt rõ ràng giữa việc xóa liên hệ (trả về unconfirmed, ẩn CTA liên hệ) và trường hợp thiếu dữ liệu gốc, ngăn chặn hiện tượng phục hồi (resurrection) thông tin baseline ngoài ý muốn.
   - Cập nhật giao diện Content Studio (`apps/studio/src/ui/html.ts`): hiển thị thẻ xem trước động (phân biệt localhost `http://127.0.0.1:4322/` và tên miền công khai `https://mangtheomotnetve.website/`), tích hợp đầy đủ nút ký 2 bước và nạp CSV vào giao diện phân hệ Tài chính.

2. **Những phát hiện và giải pháp kỹ thuật (What was found):**
   - *Tính toàn vẹn mã băm khi ký (Hash Integrity):* Khi cập nhật đối tượng chữ ký vào bản nháp, `drafts.revision_hash` phải được đồng bộ với `calculateDataHash(draft.data)` để đảm bảo bất biến và chống giả mạo.
   - *Phân quyền 4 mắt (Four-Eyes Role Enforcement):* Bước 1 (Người lập) yêu cầu quyền `assertCanEdit` (editor/admin), Bước 2 (Người duyệt độc lập) bắt buộc yêu cầu quyền `assertCanReview` (reviewer/admin) và cấm người có cùng email tự duyệt lại chính mình. Tài khoản vai trò `editor` cố tình thực hiện Bước 2 bị từ chối chính xác bằng mã 400/403.
   - *Cách ly số liệu thực tế:* Khi thiếu người duyệt thứ hai, số liệu thu chi thực tế bị che giấu hoàn toàn khỏi bản chiếu công khai (`entries: []`, `reconciled: false`, `publicApproval: 'pending'`), nhưng không ngăn cản việc biên tập và xuất bản các phân hệ độc lập khác (như Dự án, Nhật ký, Sản phẩm).
   - *Kiểm soát định dạng ảnh raster:* Bộ lọc phát hiện chính xác các tệp PNG bị hỏng cấu trúc (độ dài chunk đầu tiên khác 13 bytes hoặc thiếu chunk IHDR) và từ chối ở tầng tải lên (400) trước khi ghi vào kho lưu trữ R2.

3. **Phạm vi còn lại cho bước kích hoạt (What's left):**
   - Đã sẵn sàng 100% về mặt mã nguồn, kiểm thử tự động, giao diện và bảo mật cục bộ.
   - Bước tiếp theo (Activation task) sẽ do người dùng cấp phép để thiết lập Cloudflare Access Service Token, tạo binding D1/R2 chính thức trên tài khoản Cloudflare và triển khai online tại `studio.mangtheomotnetve.website`.

---

## 2. Chi Tiết Kiến Trúc & Cải Tiến

### 2.1. Phân Hệ Tài Chính (Finance Authority & Two-Person Attestation)
- **Tập tin:** `apps/studio/src/db/client.ts`, `apps/studio/src/api/router.ts`, `apps/studio/src/publish/adapter.ts`.
- **Luồng ký 2 bước:**
  1. `POST /api/finance/apply-csv`: Nhập dữ liệu CSV hợp lệ, cập nhật danh sách `entries`, gán cờ `publicApproval: 'pending'`, `reconciled: false`, xóa các chữ ký cũ.
  2. `POST /api/finance/attest` (Bước 1): Người lập (vai trò `editor` hoặc `admin`) ký xác nhận. Hệ thống ghi nhận `firstSigner` gắn liền với `revisions.id` và `revisions.revision_hash` mới nhất, cập nhật trạng thái `pending_second_signer`.
  3. `POST /api/finance/attest` (Bước 2): Người duyệt độc lập (vai trò `reviewer` hoặc `admin`, có email khác với Người lập) ký xác nhận. Hệ thống ghi nhận `secondSigner`, gán `publicApproval: 'approved'`, `reconciled: true`.
- **Bảo vệ chống giả mạo:**
  - Mọi yêu cầu `POST /api/drafts/finance` thông thường từ máy khách đều bị máy chủ loại bỏ các cờ `reconciled`, `publicApproval`, `firstSigner`, `secondSigner`.
  - Mọi chỉnh sửa nội dung tài chính sau khi đã ký sẽ tự động hủy bỏ toàn bộ chữ ký cũ, đưa trạng thái về `pending`.
  - Hàm `sanitizeFinanceForPublic` trong bộ adapter xuất bản chỉ cho phép hiển thị số liệu `entries` khi cả 2 chữ ký đều hợp lệ và khớp chính xác với mã băm phiên bản bất biến. Nếu không, trả về `entries: []`.

### 2.2. Xử Lý & Bảo Vệ Tài Sản Truyền Thông (Media Protection & Stripping)
- **Tập tin:** `apps/studio/src/storage/media-sniffer.ts`, `apps/studio/src/db/client.ts`, `apps/studio/src/api/router.ts`.
- **Làm sạch Metadata:**
  - `stripImageMetadata(bytes, 'image/jpeg')`: Bỏ qua các segment APP1 (marker `0xFF 0xE1`) chứa thông tin EXIF, GPS và thiết bị chụp.
  - `stripImageMetadata(bytes, 'image/png')`: Loại bỏ các ancillary chunks (`tEXt`, `zTXt`, `iTXt`, `eXIf`), chỉ giữ lại các chunk hiển thị hình ảnh chuẩn.
- **Ràng buộc tham chiếu toàn hệ thống:**
  - Hàm `checkAssetUsageAcrossSystem` kiểm tra chéo chuỗi định danh ảnh trên bảng `drafts` (toàn bộ phân hệ), bảng `revisions` (lịch sử) và bảng `publications` (bản xuất bản).
  - Khi ảnh đang được tham chiếu tại bất kỳ đâu, API `DELETE /api/media/:id` từ chối với mã 400 kèm danh sách vị trí đang sử dụng, ngăn chặn việc phá vỡ liên kết hiển thị.

### 2.3. Hợp Đồng Nhà Xuất Bản (Publisher Adapter Contract)
- **Tập tin:** `apps/studio/src/publish/adapter.ts`, `apps/studio/src/api/router.ts`.
- Khi chưa có biến môi trường `GITHUB_TOKEN`, phương thức `publishSnapshotToGitHub` trả về `{ success: false, error: 'not_configured' }`.
- API `POST /api/publications/:id/publish-git` kiểm tra trạng thái và trả về 400 kèm thông báo cấu hình rõ ràng, tuyệt đối không tạo SHA commit giả hoặc đánh dấu Live giả lập.

### 2.4. Khắc Phục Lỗi Phục Hồi Dữ Liệu Công Khai (Public Snapshot Consumer)
- **Tập tin:** `src/data/lib/snapshot-loader.ts`.
- Sửa hàm `getPublishedContacts`: Khi bản chụp chứa phân hệ `project` nhưng `contacts` là `null` hoặc rỗng (do người dùng chủ động xóa), hệ thống trả về danh sách trống và trạng thái `unconfirmed`, giúp các component giao diện (`ContactCard.astro`, `Footer.astro`) tự động ẩn phần CTA liên hệ mà không tự ý lấy lại dữ liệu baseline cũ.

---

## 3. Kết Quả Kiểm Thử Toàn Diện (Verification Results)

### 3.1. Bộ Kiểm Thử Content Studio (`apps/studio`)
- Lệnh thực thi: `npm test` trong thư mục `apps/studio`
- Kết quả: **42/42 tests PASS**, thời gian 14.47s, mã thoát: **0**.
- Bao gồm các bài kiểm thử:
  - `finance-authority-adversarial.test.mjs`: 7/7 adversarial tests PASS (chặn client spoofing cờ, chặn spoofing signer, chặn self-review, kiểm tra thiếu reviewer không chặn module khác, kiểm tra Two-Person workflow che PII, kiểm tra EXIF stripping, kiểm tra ràng buộc xóa ảnh).
  - `auth-jwt.test.mjs`: 5/5 tests PASS (RS256, expiration, audience, tampered token).
  - `concurrency-revisions.test.mjs`: 1/1 test PASS (OCC 409 conflict & safe restore).
  - `d1-persistence.test.mjs`: 1/1 test PASS (D1 disk persistence).
  - `finance-four-eyes.test.mjs`: 8/8 tests PASS (RFC 4180 CSV, currency syntax, PII masking, projection gating).
  - `publication-snapshot.test.mjs`: 3/3 tests PASS (Immutable snapshot, D1 idempotency, snapshot consumer).
  - `rbac-security.test.mjs`: 4/4 tests PASS (RBAC matrix, CSRF protection, HTML XSS escaping).
  - `storage-media.test.mjs`: 5/5 tests PASS (Magic bytes, SVG/script rejection, asset usage, R2 persistence, auth media routing).
  - `supported-runtime.test.mjs`: 8/8 tests PASS (D1 draft OCC, race conditions, atomicity rollback, miniflare D1/R2, unstable_dev real worker runtime, bundle clean verification).

### 3.2. Bộ Kiểm Thử Toàn Dự Án (Root Test Suite)
- Lệnh thực thi: `npm test` (root)
- Kết quả: **92/92 tests PASS**, thời gian 708ms, mã thoát: **0**.
- Toàn bộ các kiểm thử hồi quy về dữ liệu, logic tài chính C06 (5.470.000đ), kịch bản tài trợ, nhật ký C14 và sản phẩm C14 đều đạt chuẩn tuyệt đối.

### 3.3. Xây Dựng Bản Tĩnh Astro (Astro Build)
- Lệnh thực thi: `npm run build`
- Kết quả: **13 trang tĩnh** biên dịch hoàn tất trong 1.12s, mã thoát: **0**.

### 3.4. Các Đầu Dò Đánh Giá Của Reviewer (`docs/evidence/C17/reviewer-*.mjs`)
Tất cả các probe độc lập do Reviewer thiết lập đều đạt kết quả kỳ vọng:
1. `reviewer-r2-finance-media-probe.mjs`:
   - `draftDataHashMatchesStoredHash: true`
   - `editorSecondApproved: false` (editor bị chặn ký bước 2)
   - `invalidRasterUploadStatus: 400` (ảnh PNG hỏng bị từ chối)
   - Kết quả: **PASS**
2. `reviewer-finance-authority-probe.mjs`:
   - `unsignedActualEntryIncluded: false`
   - Kết quả: **PASS** (Số liệu thực tế không bị rò rỉ khi chưa ký duyệt)
3. `reviewer-publication-probe.mjs`:
   - `missingGitHubCredential: { success: false, isSimulated: false, fakeCommitReturned: false }`
   - `pendingPublicationExport: 400`
   - Kết quả: **PASS**
4. `reviewer-snapshot-validation-probe.mjs`:
   - 6/6 kịch bản (tampered hash, invalid shape, invalid ISO date, valid canonical, nested field, invalid day) được xác thực chính xác.
   - Kết quả: **PASS**
5. `reviewer-security-probe.mjs`:
   - 401 unauthenticated media, 401 root, 401 forged loopback host, chặn cross-origin.
   - Kết quả: **PASS**
6. `reviewer-atomicity-probe.mjs`:
   - Rollback nguyên tử khi audit log thất bại, không để lại ghost draft.
   - Kết quả: **PASS**
7. `reviewer-race-probe.mjs`:
   - Phát hiện xung đột OCC đồng thời, từ chối bản lưu thua.
   - Kết quả: **PASS**
8. `reviewer-restore-concurrency-probe.mjs`:
   - Từ chối khôi phục khi hash cũ hoặc thiếu (409/400), chấp nhận khi hash hợp lệ (200).
   - Kết quả: **PASS**
9. `reviewer-migration-probe.mjs`:
   - Đối chiếu tương đương dữ liệu nguồn hạt giống (Seed equivalence).
   - Kết quả: **PASS**
10. `reviewer-functional-browser.mjs`:
    - Lưu form thực tế qua trình duyệt Chrome thật, nạp lại và khôi phục thành công.
    - Kết quả: **PASS**
11. `reviewer-cloud-readiness.mjs`:
    - Kiểm tra read-only Cloudflare API: Zone 200, Pages 200 (1 dự án), R2 200 (0 bucket hiện tại).
12. `reviewer-r2-supported-sign-race.mjs`:
    - Xung đột đồng thời trong D1 runtime được phát hiện và xử lý chuẩn xác: khi có bản lưu xen ngang làm thay đổi `revision_hash`, lệnh cập nhật khớp 0 bản ghi (`changes() = 0`), audit log được bảo vệ bằng mệnh đề `WHERE changes() = 1` không bị ghi nhận oan (`attestationAuditCount: 0`), ném đúng lỗi `ConcurrencyConflictError` (`attestationReturnedSuccess: false`) và bảo tồn nguyên vẹn bản lưu cạnh tranh (`competingEditActuallyPersisted: true`).
    - Kết quả: **PASS**
13. `reviewer-r2-finance-media-probe.mjs` (Bộ đối chứng mở rộng):
    - `invalidRasterUploadStatus: 400`
    - `truncatedPngWithValidHeaderUploadStatus: 400` (loại bỏ tệp PNG cắt cụt thiếu IDAT/IEND)
    - `csvApplyMissingHashStatus: 400` (bắt buộc expectedHash chống xung đột khi áp dụng CSV)
    - `csvApplyInvalidRowsStatus: 400` (từ chối dòng sai định dạng ngày hoặc số tiền âm)
    - Kết quả: **PASS**

### 3.5. Kiểm Tra Giao Diện Trình Duyệt 8 Phân Hệ (Browser 8 Tabs Desktop / Mobile / Tablet)
- Lệnh thực thi: `node docs/evidence/C17/R2/worker/capture-worker-evidence.mjs`
- Đã chụp ảnh màn hình đầy đủ cả 8 tab (`dashboard`, `project`, `journal`, `media`, `products`, `finance`, `team`, `publish`) trên 3 kích thước:
  - Desktop 1440px: 8 ảnh, không vỡ layout (`overflow: false`).
  - Tablet 768px: 8 ảnh, không vỡ layout (`overflow: false`).
  - Mobile 375px: 8 ảnh, không vỡ layout (`overflow: false`).
- Bằng chứng lưu tại: `docs/evidence/C17/R2/worker/browser/` và `docs/evidence/C17/R2/worker/test-results.json`.

---

## 4. Danh Sách Tệp Thay Đổi Của Ứng Dụng (Files Modified)

Các tệp thuộc quyền sở hữu của Antigravity được chỉnh sửa và bổ sung:
- `apps/studio/src/api/router.ts`: Bổ sung `/api/finance/apply-csv`, `/api/finance/attest`, làm sạch EXIF ảnh tải lên, ràng buộc xóa ảnh, ghi nhận git_ref.
- `apps/studio/src/db/client.ts`: Triển khai `attestFinanceDraft`, `checkAssetUsageAcrossSystem`, tự động xóa cờ duyệt client trong `saveDraft`.
- `apps/studio/src/publish/adapter.ts`: Triển khai `sanitizeFinanceForPublic` bảo vệ số liệu tài chính bất biến.
- `apps/studio/src/schemas/index.ts`: Bổ sung kiểu `FinanceSigner` và cấu trúc chữ ký 2 bước.
- `apps/studio/src/storage/media-sniffer.ts`: Triển khai `stripImageMetadata` và kiểm tra tính hợp lệ của raster PNG/JPEG.
- `apps/studio/src/ui/html.ts`: Thẻ xem trước động (URL linh hoạt theo môi trường), giao diện Two-Person Policy và CSV apply.
- `apps/studio/tests/finance-authority-adversarial.test.mjs`: Bộ test adversarial chuyên sâu cho cơ chế phân quyền tài chính và an toàn media.
- `src/data/lib/snapshot-loader.ts`: Cập nhật `getPublishedContacts` xử lý an toàn việc xóa liên hệ.
- `docs/evidence/C17/R2/worker/**`: Thư mục bằng chứng độc lập của worker (ảnh chụp giao diện, tổng hợp kết quả kiểm thử).
- `reports/c17-r2-online-readiness-antigravity.md`: Báo cáo bàn giao nhiệm vụ này.

*(Lưu ý: Giữ nguyên vẹn toàn bộ các tài liệu điều phối và đánh giá chưa commit của Codex theo đúng quy tắc phối hợp AGENTS.md).*

---

## 5. Trạng Thái Máy Chủ Phục Vụ Review (Active Servers)

Hệ thống đang duy trì 2 máy chủ cục bộ sẵn sàng để phối hợp kiểm tra:
1. **Content Studio:** Đang lắng nghe tại cổng `http://127.0.0.1:4330/`
2. **Astro Site Preview:** Đang lắng nghe tại cổng `http://127.0.0.1:4322/`
