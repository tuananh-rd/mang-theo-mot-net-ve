# Báo cáo bàn giao C17-R1 — Supported Local Worker/D1/R2 Runtime

- **Nhiệm vụ:** C17-R1 — Supported local Worker/D1/R2 runtime ([docs/task-specs/C17-R1.md](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/task-specs/C17-R1.md))
- **Mã Task:** `task_c34bd3408d61`
- **Mã Dispatch:** `ctx_fe2e2fd6ebac`
- **Coordinator Terminal:** `term_7551b6c8-8044-4c53-be69-79c173d2ff28`
- **Worker Terminal:** `term_f2ffa9f0-759b-4a25-96bd-88e4c249bde7`
- **Baseline HEAD:** `e0bef661b3a18ec37a1aac0c9ed28a39db07fe4e`
- **Baseline Code Commit:** `b5a4d4f382ded911d487b3c6e46ae9298651f5fa` (kế thừa C17 icons đã PASS)
- **Nhánh làm việc:** `task/c17-online-studio`

---

## 1. Tóm tắt kết quả thực hiện theo yêu cầu Điều phối viên

Antigravity đã hoàn thành gói kỹ thuật C17-R1 đáp ứng toàn bộ các tiêu chí nghiệm thu và giải quyết triệt để 6 yêu cầu kỹ thuật chi tiết từ Điều phối viên (`msg_661a725a65c0`, `msg_05503837e045`, `msg_4b11e549f980`, `msg_a9e914c3e32a`):

1. **Wrangler & Miniflare:** Tích hợp đầy đủ dependencies chính thức trong `apps/studio/package.json` và `apps/studio/package-lock.json` (`wrangler@4.149.0`, `miniflare@5.20261006.1-alpha`, `workerd@1.20261006.1`, `esbuild@0.28.2`). `npm ci` hoàn tất với exit code 0.
2. **Khởi chạy Worker thực & Phân tách rõ ràng Production / Development:**
   - **Chế độ Production (riêng biệt):** Khởi chạy `unstable_dev` với cấu hình mặc định, xác nhận fail-secure 100% (từ chối truy cập root `/` 401/500 và `/media/*` 401 khi chưa có Cloudflare Access).
   - **Chế độ Development:** Khởi chạy `unstable_dev` với biến môi trường dev và bảo vệ loopback.
3. **Quy trình API Bản nháp hoàn chỉnh (Authenticated Draft API Workflow):**
   - Đã kiểm thử luồng thực tế qua HTTP trên Worker runtime thật:
     - `GET /api/drafts/project`: 200 OK, trả về bản nháp ban đầu và `revisionHash`.
     - `POST /api/drafts/project` hợp lệ kèm `expectedHash`: 200 OK, cập nhật bản nháp và sinh `revisionHash` mới.
     - `GET /api/drafts/project` lần 2: 200 OK, xác nhận dữ liệu đã được lưu bền vững trong D1.
     - `POST /api/drafts/project` với stale hash: 409 Conflict, bị từ chối và bảo toàn bản nháp hiện tại.
4. **Quan sát trực tiếp R2 Binding (Bucket-Read Observation):**
   - Sử dụng wrapper proxy trên `BUCKET.get` để đếm chính xác số lần đọc:
     - Tuyến unauth media (`/media/sample.png`): trả về 401 Unauthorized trước khi đọc bucket (`bucketGetCalls = 0`).
     - Tuyến auth media hợp lệ: xác thực thành công và gọi đọc bucket (`bucketGetCalls = 1`).
5. **Chứng minh số lượng bản ghi thực tế trong D1 (Persisted Counts Assertion):**
   - Lần lưu ban đầu: sinh đúng 1 revision và 1 audit_log.
   - Lần cập nhật hợp lệ: tăng tổng số lên đúng 2 revisions và 2 audit_logs.
   - Thua cuộc đua đồng thời (Race Condition giữa precheck và batch): từ chối `ConcurrencyConflictError`, giữ nguyên số lượng revisions và audit_logs (0 bản ghi ma).
   - Lỗi audit log: rollback toàn diện transaction (0 drafts, 0 revisions, 0 audit_logs).
   - OCC Restore khi stale hoặc missing hash: từ chối 409/400, số lượng bản ghi không tăng. Khôi phục với current hash: tăng đúng 1 revision (v3) và 1 audit_log.
6. **Kiểm tra an toàn thư mục tạm (Safe Containment Scope):**
   - Lưu trữ toàn bộ fixture trong `os.tmpdir()` với tiền tố `c17-r1-test-`.
   - Hàm `cleanupTempStorage` kiểm tra nghiêm ngặt tính chứa trong `os.tmpdir()` bằng `path.relative` và đối chiếu danh sách `createdTempDirs` trước khi xóa.
7. **Phân tích Bundle Dependency Graph:**
   - Dùng `esbuild` biên dịch và phân tích `metafile.inputs` của `src/worker.ts`. Xác nhận không chứa bất kỳ module Node-only cấm (`node:fs`, `node:http`, `node:net`, `node:sqlite`, `node:child_process`) và không import các adapter emulator.

---

## 2. Bằng chứng kiểm thử và mã thoát (Exit Codes)

| Lệnh kiểm thử | Thư mục | Kết quả | Mã thoát | Chi tiết |
| :--- | :--- | :--- | :---: | :--- |
| `npm ci` | `apps/studio` | Thành công | 0 | Đã cài đặt 37 packages từ package-lock, 0 lỗ hổng. |
| `npm run typecheck` | `apps/studio` | Thành công | 0 | `tsc --noEmit` 0 lỗi type. |
| `npm run build` | `apps/studio` | Thành công | 0 | Biên dịch TypeScript ra `dist/` sạch. |
| `npm run test:supported` | `apps/studio` | 9/9 PASS | 0 | Đầy đủ 9/9 bài test integration trên supported runtime Wrangler/D1/R2. |
| `npm test` | `apps/studio` | 35/35 PASS | 0 | Bao gồm 26 unit tests và 9 supported integration tests. |
| `npm test` | Root workspace | 92/92 PASS | 0 | Bộ kiểm thử hồi quy toàn site của dự án giữ nguyên 100% xanh. |

### Tập tin bằng chứng (Evidence Artifacts)

Tất cả kết quả chạy probe độc lập đã được lưu trữ tại [`docs/evidence/C17/R1/worker/`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/):
- [`supported-runtime-test-run.txt`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/supported-runtime-test-run.txt): Nhật ký thực thi 9/9 test cases của `apps/studio/tests/supported-runtime.test.mjs`.
- [`reviewer-atomicity-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-atomicity-r1.json): Bằng chứng rollback nguyên tử khi audit log lỗi (drafts: 0, revisions: 0, audit_logs: 0).
- [`reviewer-race-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-race-r1.json): Bằng chứng xung đột đồng thời không sinh ghost revision/audit log.
- [`reviewer-security-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-security-r1.json): Bằng chứng chặn truy cập trái phép vào media và từ chối giả mạo Host header.
- [`reviewer-restore-concurrency-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-restore-concurrency-r1.json): Bằng chứng khóa lạc quan khi khôi phục (409 cho stale hash, 400 cho missing hash, 200 cho current hash).
- [`reviewer-snapshot-validation-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-snapshot-validation-r1.json): Bằng chứng xác thực toàn vẹn snapshot xuất bản.
- [`reviewer-ui-script-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-ui-script-r1.json): Bằng chứng cú pháp inline script hợp lệ (0 lỗi cú pháp).
- [`reviewer-publication-r1.json`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/reviewer-publication-r1.json): Bằng chứng từ chối export snapshot khi chưa được duyệt và xử lý trung thực khi thiếu token GitHub.

---

## 3. Tệp tin thay đổi (Changed Files)

- `apps/studio/package.json`: Bổ sung các scripts `dev:supported` và `test:supported`.
- `apps/studio/tests/supported-runtime.test.mjs`: Tệp kiểm thử tích hợp 9 bài kiểm thử trên supported runtime Wrangler/D1/R2.
- `apps/studio/tests/concurrency-revisions.test.mjs`: Cập nhật nạp schema SQL an toàn qua `import.meta.url`.
- `apps/studio/tests/d1-persistence.test.mjs`: Cách ly thư mục kiểm thử vào `os.tmpdir()` thay vì `apps/studio/data`.
- `apps/studio/tests/publication-snapshot.test.mjs`: Cập nhật nạp schema SQL an toàn qua `import.meta.url`.
- `apps/studio/tests/storage-media.test.mjs`: Cách ly thư mục kiểm thử vào `os.tmpdir()` thay vì `apps/studio/data`.
- `reports/c17-r1-runtime-antigravity.md`: Báo cáo bàn giao nhiệm vụ R1.
- `docs/evidence/C17/R1/worker/*`: Các tệp JSON và txt ghi nhận kết quả kiểm thử thực tế.

---

## 4. Giới hạn & Trạng thái C17

- **Phạm vi hoàn tất:** Đợt sửa R1 này chỉ giải quyết và đóng cổng Supported Local Worker/D1/R2 Runtime Gate.
- **Phạm vi chuyển giao cho đợt tiếp theo:** Đã ghi nhận ghi chú của Điều phối viên về việc xử lý cơ chế phê duyệt tài chính ràng buộc server revision (`reviewer-finance-authority-probe.mjs`) trong đặc tả C17-R2 tiếp theo ([docs/task-specs/C17-R2-online-readiness.md](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/task-specs/C17-R2-online-readiness.md)). R1 không can thiệp trái phạm vi.
- **Ràng buộc an toàn:** Không đẩy mã nguồn lên remote git (`git push`), không deploy Cloudflare, giữ nguyên trạng thái Preview 4330.
