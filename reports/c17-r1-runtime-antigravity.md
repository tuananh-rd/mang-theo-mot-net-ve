# Báo cáo bàn giao C17-R1 — Supported Local Worker/D1/R2 Runtime

- **Nhiệm vụ:** C17-R1 — Supported local Worker/D1/R2 runtime ([docs/task-specs/C17-R1.md](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/task-specs/C17-R1.md))
- **Mã Task:** `task_c34bd3408d61`
- **Mã Dispatch:** `ctx_fe2e2fd6ebac`
- **Coordinator Terminal:** `term_7551b6c8-8044-4c53-be69-79c173d2ff28`
- **Worker Terminal:** `term_f2ffa9f0-759b-4a25-96bd-88e4c249bde7`
- **Baseline HEAD:** `e0bef661b3a18ec37a1aac0c9ed28a39db07fe4e`
- **Code Checkpoint:** `b5a4d4f382ded911d487b3c6e46ae9298651f5fa` (kế thừa C17 icons đã PASS)
- **Nhánh làm việc:** `task/c17-online-studio`

---

## 1. Tóm tắt kết quả thực hiện

Antigravity đã hoàn thành gói kỹ thuật C17-R1 giải quyết toàn diện các yêu cầu về môi trường chạy Cloudflare Worker, D1 và R2 cục bộ theo chuẩn chính thức của Cloudflare:
1. **Wrangler & Miniflare:** Đã tích hợp các gói phụ thuộc chính thức `wrangler@4.149.0`, `miniflare@5.20261006.1-alpha`, `workerd@1.20261006.1` và `esbuild@0.28.2` trong `apps/studio/package.json` và `apps/studio/package-lock.json`. `npm ci` thực thi sạch (exit 0).
2. **Khởi chạy Worker thực:** Đã kiểm thử khởi chạy `src/worker.ts` trên cổng cục bộ qua `unstable_dev` của Wrangler kết nối bindings thật `env.DB` (D1) và `env.BUCKET` (R2) của Miniflare.
3. **Cách ly dữ liệu:** Toàn bộ kiểm thử và fixture sử dụng thư mục TEMP cô lập (`fs.mkdtempSync` trong `os.tmpdir()`), kiểm tra vùng hợp lệ trước khi dọn dẹp, tuyệt đối không xâm phạm dữ liệu thật tại `apps/studio/data` và không kết nối đám mây.
4. **Chứng minh D1 Atomicity & Concurrency:**
   - Kiểm tra `saveDraft` bắt buộc `expectedHash`, từ chối hash cũ.
   - Giả lập cuộc đua ghi đè đồng thời giữa precheck và conditional batch (`sameTargetData` cả true và false): từ chối `ConcurrencyConflictError`, số lượng revisions và audit_logs giữ nguyên (0 ghost records), bản nháp của bên thắng được bảo toàn.
   - Kiểm tra tính nguyên tử (Atomicity Rollback): tiêm lỗi trigger tại `audit_logs` khiến `saveDraft` thất bại, toàn bộ giao dịch batch rollback hoàn toàn (0 drafts, 0 revisions, 0 audit_logs).
   - Kiểm tra khôi phục phiên bản (OCC Restore): stale hash và missing hash bị từ chối 409/400 mà không sinh revision hoặc audit log thừa; current hash khôi phục thành công sinh đúng 1 revision và audit log mới.
5. **Chứng minh R2 & Persistence qua Restart:**
   - Thao tác `put`, `get`, `list`, `delete` trên R2 bucket thành công.
   - Khởi động lại runtime (dispose phiên 1 và mở lại phiên 2 trên cùng thư mục lưu trữ TEMP) chứng minh tính bền vững trên đĩa của cả D1 và R2.
6. **Bảo mật & Phân tích Bundle:**
   - Yêu cầu từ xa hoặc giả mạo Host header đều bị chặn 401 Unauthorized trước khi đọc bucket.
   - Yêu cầu nội bộ loopback xác thực thành công vai trò `admin`, phục vụ media riêng tư với `Cache-Control: private, no-store`.
   - Phân tích cây phụ thuộc bundle (`esbuild` metafile) xác nhận bundle Worker hoàn toàn không chứa các module Node-only cấm (`node:fs`, `node:http`, `node:net`, `node:sqlite`, `node:child_process`) và không import các adapter emulator.

---

## 2. Bằng chứng kiểm thử và mã thoát (Exit Codes)

| Lệnh kiểm thử | Thư mục | Kết quả | Mã thoát | Chi tiết |
| :--- | :--- | :--- | :---: | :--- |
| `npm ci` | `apps/studio` | Thành công | 0 | Đã cài đặt 37 packages từ package-lock, 0 lỗ hổng bảo mật. |
| `npm run typecheck` | `apps/studio` | Thành công | 0 | `tsc --noEmit` 0 lỗi type. |
| `npm run build` | `apps/studio` | Thành công | 0 | Biên dịch TypeScript ra thư mục `dist/` hoàn tất. |
| `npm run test:supported` | `apps/studio` | 8/8 PASS | 0 | Đầy đủ 8/8 bài test integration trên supported runtime Wrangler/D1/R2. |
| `npm test` | `apps/studio` | 34/34 PASS | 0 | Bao gồm 26 unit tests và 8 supported integration tests. |
| `npm test` | Root workspace | 92/92 PASS | 0 | Bộ kiểm thử hồi quy toàn site của dự án giữ nguyên 100% xanh. |

### Tập tin bằng chứng (Evidence Artifacts)

Tất cả kết quả chạy probe độc lập đã được lưu trữ tại [`docs/evidence/C17/R1/worker/`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/):
- [`supported-runtime-test-run.txt`](file:///C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve/docs/evidence/C17/R1/worker/supported-runtime-test-run.txt): Nhật ký thực thi 8/8 test cases của `apps/studio/tests/supported-runtime.test.mjs`.
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
- `apps/studio/tests/supported-runtime.test.mjs`: Tệp kiểm thử tích hợp chuyên sâu cho supported runtime (D1 atomicity trigger rollback, D1 race condition batch, OCC restore stale/missing rollback, R2/D1 persistence restart, unstable_dev auth loopback/media, và esbuild bundle dependency graph analysis).
- `apps/studio/tests/concurrency-revisions.test.mjs`: Cập nhật nạp schema SQL an toàn qua `import.meta.url`.
- `apps/studio/tests/d1-persistence.test.mjs`: Cách ly thư mục kiểm thử vào `os.tmpdir()` thay vì `apps/studio/data`.
- `apps/studio/tests/publication-snapshot.test.mjs`: Cập nhật nạp schema SQL an toàn qua `import.meta.url`.
- `apps/studio/tests/storage-media.test.mjs`: Cách ly thư mục kiểm thử vào `os.tmpdir()` thay vì `apps/studio/data`.
- `reports/c17-r1-runtime-antigravity.md`: Báo cáo bàn giao nhiệm vụ R1.
- `docs/evidence/C17/R1/worker/*`: Các tệp JSON và txt ghi nhận kết quả kiểm thử thực tế.

---

## 4. Giới hạn & Trạng thái C17

- **Phạm vi hoàn tất:** Đợt sửa R1 này chỉ đóng cổng môi trường thực thi (Supported Local Worker/D1/R2 Runtime Gate).
- **Phạm vi chưa nghiệm thu:** Không tuyên bố hoàn thành toàn bộ C17 Content Studio; các phân hệ biên tập chuyên sâu (Finance CSV apply, Public renderer consumer thật, Media registry/focal editor, Two-person signature UI và GitHub publisher production) vẫn thuộc các cổng review tiếp theo của C17.
- **Ràng buộc an toàn:** Không đẩy mã nguồn lên remote git (`git push`), không deploy Cloudflare, giữ nguyên trạng thái Preview 4330.
