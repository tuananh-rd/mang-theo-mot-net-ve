# Báo cáo Triển khai Task C17-R2-F1: Khắc phục Xung đột Ký duyệt D1 và Pipeline Giải mã/Làm sạch Ảnh Raster Bounded

- **Nhiệm vụ:** Task `task_c91ae23182a2` / Dispatch `ctx_1dd1c95d7553` (C17-R2-F1)
- **Đơn vị thực hiện:** Antigravity (Sole Worker)
- **Đơn vị điều phối / Đánh giá:** Codex (Coordinator & Reviewer)
- **Mã baseline bắt đầu:** `29ca39953d66788bca8cf04a50be8813ec003f10`
- **Nhánh làm việc:** `task/c17-online-studio`
- **Trạng thái milestone:** Focused security & raster gate repair completed; **KHÔNG** tuyên bố hoàn thành 100% Studio, preview hoàn chỉnh, hoặc kích hoạt online production.

---

## 1. Mục tiêu và Phạm vi Milestone C17-R2-F1

Milestone này tập trung sửa chữa hai lỗi bảo mật trọng yếu bị từ chối tại RC17-R2 (`29ca399`), đồng thời sửa đổi báo cáo và thu thập bằng chứng trung thực:
1. **Khắc phục triệt để cuộc đua ký duyệt (Signing Race Condition) cùng nội dung / revision bất biến mới trong D1:**
   - Ngăn chặn tình trạng nội dung tài chính giống hệt nhau (`revision_hash` không đổi) nhưng xen giữa một thao tác lưu tạo ra bản ghi `revisions` mới.
   - Bảo đảm truy vấn cập nhật kiểm tra nguyên tử cả `revision_hash` và ID của revision tài chính mới nhất:
     ```sql
     UPDATE drafts
     SET data_json = ?, revision_hash = ?, updated_by = ?, updated_at = ?
     WHERE module_key = 'finance'
       AND revision_hash = ?
       AND (SELECT id FROM revisions WHERE module_key = 'finance' ORDER BY version DESC LIMIT 1) = ?
     ```
   - Đảm bảo tính nguyên tử trong batch D1: Khi cập nhật draft bị xung đột (0 dòng bị sửa), biểu thức `WHERE changes() = 1` của `INSERT INTO audit_logs` tự động ngăn chặn việc ghi audit log giả mạo (audit count = 0), đồng thời phục hồi lỗi `ConcurrencyConflictError` (HTTP 409).
2. **Xây dựng Pipeline giải mã và làm sạch ảnh raster bounded (Worker-compatible):**
   - Thay thế cơ chế kiểm tra header đơn giản bằng pipeline giải mã điểm ảnh thực tế (bounded decode) và tái mã hóa sạch sẽ (re-encode) sử dụng `upng-js` và `jpeg-js`.
   - **Preflight cấu trúc PNG:** Kiểm tra chunk IHDR đầu tiên (13 bytes), ngăn chặn duplicate IHDR, từ chối APNG (`acTL`, `fcTL`, `fdAT`), bắt buộc độ dài IEND = 0, kiểm tra CRC32 chuẩn (IEEE 802.3) trên toàn bộ chunk, và từ chối mọi dữ liệu thừa sau IEND.
   - **Bounded zlib inflate:** Giới hạn chặt chẽ luồng giải nén scanline IDAT theo đúng ngân sách tính từ thông số IHDR (hỗ trợ cả non-interlaced và Adam7 interlaced). Dừng giải nén ngay lập tức nếu vượt quá ngân sách (chống decompression bomb).
   - **Preflight & Strict JPEG:** Kiểm tra SOI, SOF (kích thước tối đa 4096, tổng điểm ảnh an toàn), kiểm tra marker kết thúc EOI (`0xFF, 0xD9`). Áp dụng `tolerantDecoding: false` trong `jpeg-js` để từ chối dứt khoát các luồng scan bị cắt cụt hoặc hỏng.
   - **Xử lý EXIF Orientation toàn diện (1 đến 8):** Trích xuất tag `0x0112` an toàn trong giới hạn segment APP1 và header TIFF. Chuẩn hóa góc xoay cho đầy đủ 8 trạng thái EXIF (1: 0°, 2: lật ngang, 3: 180°, 4: lật dọc, 5: transpose, 6: 90° CW, 7: transverse, 8: 270° CW).
   - **Tái mã hóa sạch sẽ 100%:** Loại bỏ hoàn toàn EXIF, GPS, XMP, IPTC, Comments trước khi lưu vào R2 và D1.
   - **Chính sách định dạng trung thực:** Chỉ chấp nhận PNG và JPEG qua bộ giải mã; từ chối WebP, SVG, AVIF với mã lỗi HTTP 400 rõ ràng. Tuyệt đối không trả về byte nguyên bản khi giải mã thất bại.
3. **Thu thập bằng chứng và báo cáo trung thực:**
   - Lưu trữ toàn bộ kết quả thực thi lệnh thật, mã thoát (exit code), thời gian chạy, và dữ liệu probe được phân tích tại `docs/evidence/C17/R2-F1/worker/results.json`.
   - Không tuyên bố hoàn thành toàn bộ hệ thống Studio hay kích hoạt Cloudflare.

---

## 2. Bằng chứng Thực thi Lệnh và Kết quả Đo lường

Tất cả các lệnh và probe dưới đây được chạy trực tiếp tại workspace và lưu tại `docs/evidence/C17/R2-F1/worker/results.json`:

### A. Kiểm thử Đơn vị & Tích hợp Nội bộ

| Tác vụ / Bộ kiểm thử | Lệnh thực thi | Mã thoát (Exit Code) | Kết quả chi tiết |
| :--- | :--- | :---: | :--- |
| **Studio Build & Typecheck** | `npm --prefix apps/studio run build` | `0` | TypeScript biên dịch thành công, không có lỗi kiểu. |
| **Studio Test Suite** | `node --test apps/studio/tests/*.test.mjs` | `0` | **45/45 tests PASS** (Bao gồm JWT fail-secure, OCC D1, Two-Person Finance Attestation, Raster decode/re-encode, R2, Supported D1/R2 via wrangler, và Worker bundle verification). |
| **Root Unit Tests** | `npm test` | `0` | **92/92 tests PASS** (Toàn bộ 13 test suites nghiệp vụ, đối soát tài chính, logic sản phẩm, nhật ký, dữ liệu đề xuất). |
| **Astro Static Build** | `npm run build` | `0` | **13/13 trang tĩnh tạo thành công** (Không bị ảnh hưởng bởi mã nguồn Studio). |

### B. Kết quả Đo lường từ các Probe Độc lập của Reviewer

| Bộ Probe Reviewer | Lệnh thực thi | Exit Code | Kết quả quan sát thực tế (Parsed Output) |
| :--- | :--- | :---: | :--- |
| **Supported D1 Race Probe (same-content)** | `node docs/evidence/C17/reviewer-r2-supported-sign-race.mjs same-content` | `0` | `attestationReturnedSuccess: false`<br>`exceptionName: "ConcurrencyConflictError"`<br>`competingEditActuallyPersisted: true`<br>`attestationActuallyPersisted: false`<br>`attestationAuditCount: 0`<br>Khớp 100% điều kiện kỳ vọng. |
| **Supported D1 Race Probe (different-content)** | `node docs/evidence/C17/reviewer-r2-supported-sign-race.mjs` | `0` | `attestationReturnedSuccess: false`<br>`exceptionName: "ConcurrencyConflictError"`<br>`competingEditActuallyPersisted: true`<br>`attestationActuallyPersisted: false`<br>`attestationAuditCount: 0`<br>Khớp 100% điều kiện kỳ vọng. |
| **Reviewer F1 Raster Probe (16 tiêu chí)** | `node docs/evidence/C17/reviewer-f1-raster-probe.mjs` | `0` | **16/16 observations PASS:**<br>- PNG valid roundtrip: PASS<br>- PNG header only: PASS (từ chối)<br>- PNG missing IEND: PASS (từ chối)<br>- PNG corrupt IHDR CRC: PASS (từ chối)<br>- PNG duplicate IHDR: PASS (từ chối)<br>- PNG excess decompressed scanline bytes: PASS (từ chối)<br>- JPEG valid roundtrip: PASS<br>- JPEG missing EOI: PASS (từ chối)<br>- EXIF orientations 1 đến 8: PASS (cả 8 trạng thái xoay/lật khớp chính xác vị trí pixel kỳ vọng). |
| **Finance Media Probe** | `node docs/evidence/C17/reviewer-r2-finance-media-probe.mjs` | `0` | `financeSave: 200`<br>`firstAttestation: 200`<br>`editorSecondAttestationStatus: 400` (Người duyệt độc lập bắt buộc)<br>`invalidRasterUploadStatus: 400`<br>`truncatedPngWithValidHeaderUploadStatus: 400`<br>`csvApplyMissingHashStatus: 400`<br>`csvApplyInvalidRowsStatus: 400`. |
| **Finance Authority Probe** | `node docs/evidence/C17/reviewer-finance-authority-probe.mjs` | `0` | `unsignedActualEntryIncluded: false`<br>`sourceAttestationsSupplied: 0`<br>Cờ client giả mạo không thể đưa số liệu vào bản chiếu công khai. |
| **Snapshot Validation Probe** | `node docs/evidence/C17/reviewer-snapshot-validation-probe.mjs` | `0` | 6/6 kịch bản kiểm tra toàn vẹn băm SHA-256, định dạng ISO thời gian, và cấu trúc snapshot đều PASS. |
| **Publication Probe** | `node docs/evidence/C17/reviewer-publication-probe.mjs` | `0` | `missingGitHubCredential.success: false`<br>`missingGitHubCredential.fakeCommitReturned: false`<br>`pendingPublicationExport.status: 400`<br>Không bịa đặt commit khi thiếu cấu hình GitHub; từ chối xuất bản pending. |
| **Supported Media Probe (workerd/D1/R2)** | `node docs/evidence/C17/reviewer-f1-supported-media.mjs` | `0` | **10/10 observations PASS:**<br>- Workerd PNG upload: 201 Created, pending<br>- Supported R2 PNG bytes decode & private cache: PASS (32x32)<br>- Workerd JPEG metadata upload: 201 Created, pending<br>- Supported JPEG oriented & private markers stripped: PASS (2x3, no EXIF/markers)<br>- Unauthenticated media: 401 Denied<br>- PNG header-only: 400 Rejected before storage<br>- JPEG truncated: 400 Rejected before storage<br>- SVG unsupported: 400 Rejected before storage<br>- API lists only 2 accepted assets<br>- Supported D1/R2 leave no orphan writes (media=2, audit=2, objects=2). |
| **Finance Atomicity Probe (supported D1)** | `node docs/evidence/C17/reviewer-f1-finance-atomicity.mjs` | `0` | **5/5 observations PASS:**<br>- Concurrent first signers: 1 success, 1 rejected, 1 audit (PASS)<br>- Audit-trigger failure rolls back actual signature/hash (audit=1, no signer) (PASS)<br>- Two distinct signers approve same immutable revision (PASS)<br>- Save invalidates previous approval flags/signers (PASS)<br>- Restore creates new unsigned revision (PASS). |

---

## 3. Các Tệp Mã Nguồn Đã Thay Đổi và Tạo Mới

1. `apps/studio/src/db/client.ts`:
   - Bổ sung điều kiện nguyên tử `(SELECT id FROM revisions WHERE module_key = 'finance' ORDER BY version DESC LIMIT 1) = ?` trong câu lệnh `UPDATE drafts` của phương thức `attestFinanceDraft`.
2. `apps/studio/src/storage/media-sanitizer.ts` (Mới):
   - Triển khai toàn diện `preflightValidatePng` (kiểm tra signature, IHDR length 13, cấm duplicate IHDR, CRC32, IEND length 0, cấm APNG, cấm trailing data).
   - Triển khai `decompressAndValidateIdat` sử dụng `pako.Inflate` giới hạn ngân sách scanline.
   - Triển khai `preflightValidateJpeg` (kiểm tra SOI, SOF, EOI FF D9).
   - Triển khai `getJpegExifOrientation` an toàn trong APP1 segment.
   - Triển khai `normalizeOrientation` đầy đủ 8 trạng thái EXIF.
   - Triển khai `decodeAndSanitizeRaster` với `tolerantDecoding: false`.
3. `apps/studio/src/api/router.ts`:
   - Kết nối `decodeAndSanitizeRaster` vào tuyến xử lý tải lên tệp `POST /api/media/upload`.
4. `apps/studio/src/types/pako.d.ts` (Mới):
   - Định nghĩa type interface cho `pako.Inflate` và `pako.inflate`.
5. `apps/studio/tests/finance-authority-adversarial.test.mjs`:
   - Bổ sung kịch bản kiểm thử xen ngang cùng nội dung bằng Proxy interpose `batch`.
   - Bổ sung kiểm thử từ chối tệp raster cắt cụt và định dạng chưa hỗ trợ.
6. `apps/studio/tests/storage-media.test.mjs`:
   - Mở rộng bộ kiểm thử làm sạch ảnh: kiểm tra từ chối sai CRC, thiếu EOI, định dạng không hỗ trợ, và xác thực chuẩn hóa cả 8 góc xoay EXIF.
7. `docs/evidence/C17/R2-F1/worker/results.json` (Mới):
   - Lưu trữ toàn bộ kết quả kiểm thử và probe dạng JSON có cấu trúc.

---

## 4. Các Cổng (Gates) Còn Lại của Toàn Bộ Task C17 Cần Tiếp Tục Hoàn Thiện

Milestone C17-R2-F1 chỉ giải quyết dứt điểm các lỗi cổng ký duyệt và an toàn media. Các hạng mục công việc sau đây **chưa hoàn thành** và thuộc các milestone tiếp theo:
1. **Bộ hiển thị xem trước trực tiếp bản nháp (Authenticated Astro Draft Preview Renderer):**
   - Hiện tại Studio Dashboard liên kết đến URL tĩnh công khai; chưa có pipeline render động nội dung bản nháp đã xác thực trong Astro.
2. **Quy trình chỉnh sửa tương tác hoàn chỉnh cho cả 8 phân hệ:**
   - Các bảng doanh thu, chi phí, hiện vật tài chính hiện mới hiển thị ở dạng bảng đối soát; cần hoàn thiện form chỉnh sửa đầy đủ cho toàn bộ 8 phân hệ (project, products, team, journal, media, finance sales, finance expenses, finance in-kind).
3. **Pipeline xuất nhập Media Registry và Xuất bản Snapshot:**
   - Đồng bộ danh mục ảnh tĩnh đã duyệt sang hệ thống lưu trữ R2; tích hợp đầy đủ quy trình commit Git tự động qua `github.ts` và trích xuất dữ liệu tĩnh qua `consumer.ts`.
4. **Kích hoạt Trực tuyến (Online Activation) trên Cloudflare:**
   - Cấu hình Production Cloudflare Access AUD thực tế, xác thực OTP cho hai danh tính Admin/Reviewer, và triển khai artifact Worker/D1/R2 lên hạ tầng Cloudflare.
