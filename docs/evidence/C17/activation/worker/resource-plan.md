# Kế hoạch Tài nguyên Kích hoạt Trực tuyến (Online Activation Resource Plan)

- **Mã Task:** `task_64964b7b8698` / `C17-activation-online`
- **Mã Dispatch:** `ctx_2599327dc2bb`
- **Thời điểm kiểm kê:** 2026-10-13T01:33:59.290Z
- **Tài khoản Cloudflare:** `ce11030376680d55523c6636de073814`
- **Zone:** `mangtheomotnetve.website` (ID: `5465be90f8c8232f598e38017c49165a`, status: active)

---

## 1. Kết quả Kiểm kê Hiện trạng (Read-only Inventory)

- **Cloudflare Pages:** 1 dự án (`mang-theo-mot-net-ve`, domains: `mang-theo-mot-net-ve.pages.dev`, `mangtheomotnetve.website`). **Giữ nguyên 100%, không can thiệp.**
- **Cơ sở dữ liệu D1:** 0 cơ sở dữ liệu hiện hữu.
- **Kho lưu trữ R2:** 0 bucket hiện hữu.
- **Cloudflare Workers:** 0 worker scripts hiện hữu.
- **Cloudflare Access Applications:** 0 ứng dụng hiện hữu.
- **Kết luận:** Tài khoản hoàn toàn sạch sẽ, không có tài nguyên Studio nào tồn tại trước đó, không có nguy cơ ghi đè tài nguyên ngoài phạm vi.

---

## 2. Danh mục Tài nguyên Dự kiến Khởi tạo (Resource Plan)

| Loại tài nguyên | Tên định danh dự kiến | Phạm vi / Ràng buộc |
| :--- | :--- | :--- |
| **D1 Database** | `studio-d1-prod` | Chuyên dụng cho Studio sản xuất. Áp dụng schema chính thức và nạp canonical defaults (5 phân hệ, 22 media, 2 người dùng quản trị/duyệt). |
| **R2 Bucket** | `studio-media-prod` | Riêng tư (Private), không public domain. Lưu trữ 22 tệp media nhị phân đã duyệt theo đúng `r2_key`. Phục vụ qua Worker sau khi kiểm tra quyền. |
| **Worker Application** | `mang-theo-mot-net-ve-studio-prod` | Triển khai từ bundle `apps/studio`. Môi trường `production`, từ chối 100% `x-dev-user` / `dev_role` / dev bypass. |
| **Tên miền Định tuyến** | `studio.mangtheomotnetve.website` | Custom domain trên Worker gắn với zone `mangtheomotnetve.website`. |
| **Cloudflare Access App** | `Mang Theo Mot Net Ve - Content Studio` | Self-hosted trên domain `studio.mangtheomotnetve.website`. Xác thực One-Time PIN (OTP). Chính sách Allow chỉ cấp quyền cho đúng 2 email định danh từ tệp riêng tư (`<admin>`, `<reviewer>`). |
| **Access AUD & Team Domain** | Khám phá thực tế từ ứng dụng | Team Domain lấy từ chuyển hướng thực tế (`Location: https://<team>.cloudflareaccess.com/...`), AUD lấy từ thuộc tính `aud` của Access App vừa tạo. |

---

## 3. Thứ tự Kích hoạt Chi tiết

1. **Gate 1:** Kiểm kê hiện trạng (đã hoàn tất, ghi nhận tại `inventory-20261013.json`).
2. **Gate 2:** Khẳng định tệp build deployable của Worker bằng test local runtime thật với cờ `production`.
3. **Gate 3:**
   - Tạo D1 `studio-d1-prod` và cập nhật binding ID vào cấu hình production.
   - Tạo R2 `studio-media-prod`.
   - Thực thi kịch bản `tools/content-studio/bootstrap-production.mjs` nạp dữ liệu sạch vào D1 từ danh tính bí mật (`C:\Users\tuana\.mtmnv-private\studio-identities.json`).
   - Tải 22 tệp media chuẩn tắc từ `public/images/` lên R2 `studio-media-prod`.
   - Truy vấn đối soát số lượng từ xa (5 drafts, 5 revisions, 22 media, 2 users).
4. **Gate 4:**
   - Tạo Access Application và Policy cho 2 email.
   - Lấy AUD và Team Domain thực tế.
   - Cập nhật biến môi trường Worker và deploy Worker với custom domain `studio.mangtheomotnetve.website`.
5. **Gate 5:**
   - Thử nghiệm truy cập unauthenticated -> Xác nhận redirect 302 về trang đăng nhập Cloudflare Access.
   - Thử nghiệm gửi header giả mạo dev -> Xác nhận 401 Unauthorized.
   - Thử nghiệm truy cập `/media/*` unauthenticated -> Xác nhận 401 Unauthorized.
   - Ghi nhận Deployment ID, Artifact Hash, Git Commit SHA.
6. **Gate 6:** Tổng hợp bằng chứng đã làm sạch PII và lập báo cáo bàn giao.
