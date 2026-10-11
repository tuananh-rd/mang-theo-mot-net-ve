# Online Full-Site Content Studio (Task C17)

Content Studio trực tuyến cho dự án **Mang Theo Một Nét Vẽ**, được thiết kế theo kiến trúc phi máy chủ (Serverless) độc lập, bảo mật nhiều lớp với Cloudflare Access, Cloudflare D1 Database, Cloudflare R2 Storage và cơ chế giả lập cục bộ bền vững trên đĩa.

---

## 1. Kiến trúc hệ thống & Luồng bảo mật

Hệ thống hoạt động dưới dạng Cloudflare Worker độc lập tại `apps/studio/`, cách ly hoàn toàn với mã nguồn hiển thị của website Astro công khai:

```
[Người dùng / Trình duyệt]
        │
        ▼ (HTTPS)
[Cloudflare Access Edge] ── (Zero Trust Policy / SSO)
        │
        ▼ (Thêm Header Cf-Access-Jwt-Assertion / Cookie CF_Authorization)
[Studio Worker (`apps/studio/src/worker.ts`)]
        │
        ├─ 1. Xác thực RS256 JWT qua Web Crypto (`src/auth/jwt.ts`)
        │     - Kiểm tra Issuer: https://<team>.cloudflareaccess.com
        │     - Kiểm tra Audience (AUD) khớp với Cloudflare Access Application
        │     - Kiểm tra thời hạn hiệu lực (exp, nbf)
        │     - Tải và xác thực chữ ký số bằng Public Key từ /cdn-cgi/access/certs
        │     - Fail-Secure Deny: Từ chối dứt khoát nếu thiếu cấu hình hoặc dùng giá trị placeholder
        │
        ├─ 2. Phân quyền vai trò Server-side RBAC (`src/auth/rbac.ts`)
        │     - Admin: Toàn quyền chỉnh sửa, duyệt, xuất bản, quản lý người dùng
        │     - Editor: Soạn thảo bản nháp, tải ảnh lên, gửi yêu cầu xuất bản (không được tự duyệt)
        │     - Reviewer: Thẩm định bản nháp, kiểm tra đối soát, ký duyệt xuất bản (không sửa trực tiếp)
        │
        ├─ 3. Quản lý Dữ liệu Bản nháp & Khóa Lạc quan (`src/db/client.ts`)
        │     - Optimistic Concurrency Control: Kiểm tra mã băm SHA-256 (báo lỗi 409 Conflict khi đụng độ)
        │     - Revisions History: Lưu trữ toàn bộ các phiên bản đã sửa, cho phép khôi phục an toàn
        │     - Audit Logs: Ghi nhật ký mọi hành động sửa đổi, tải tệp, thẩm định
        │
        ├─ 4. Lưu trữ Media an toàn (`src/storage/media-sniffer.ts`)
        │     - Xác thực Magic Bytes thực tế (JPEG, PNG, WebP, AVIF)
        │     - Từ chối dứt khoát SVG, HTML, Script để phòng chống tấn công XSS
        │     - Giới hạn kích thước tối đa 5MB
        │     - Kiểm tra liên kết tham chiếu: Không cho phép xóa tệp đang được sử dụng trong các bản nháp
        │
        └─ 5. Xuất bản & Nguyên tắc Bốn Mắt (Four-Eyes Principle)
              - Tạo bản chụp bất biến (Immutable Snapshot) độc lập được làm sạch hoàn toàn
              - Không làm thay đổi `src/data/` hoặc `dist/` của website công khai cho đến khi duyệt xong
              - Phân hệ tài chính bắt buộc phải qua 2 người duyệt độc lập ký xác nhận; nghiêm cấm tự duyệt (self-review)
```

---

## 2. Các phân hệ nghiệp vụ (Dedicated Forms)

Studio cung cấp giao diện trực quan tiếng Việt áp dụng bảng màu phẳng C16, với biểu mẫu chuyên biệt cho toàn bộ 8 phân hệ (không dùng raw JSON editor mặc định):

1. **Tổng quan (Dashboard):** Thống kê xuất bản, trạng thái đồng bộ, liên kết nhanh tới 7 phân hệ, tóm tắt audit logs gần nhất.
2. **Dự án & Thông điệp (Project Narrative):** Chỉnh sửa Tiêu đề, Khẩu hiệu, Tóm tắt, Trạng thái (unknown, in_progress, completed), Hoạt động (4 hoạt động), Các giai đoạn triển khai, Nhu cầu & Thực hành an toàn.
3. **Nhật ký hành trình (Journal):** Quản lý danh sách bài viết thực địa, form biên tập (Tiêu đề, Tóm tắt, Danh mục, Ngày công bố, Khối nội dung, Ảnh bìa kèm caption và credit), tách biệt bài nháp (draft isolation).
4. **Thư viện Media (Media Library):** Tải ảnh lên R2, xác thực Magic Bytes, quản lý Alt text tiếp cận, Chú thích (Caption), Tác quyền (Credit), kiểm tra ràng buộc tham chiếu trước khi xóa.
5. **Sản phẩm & Mở bán (Products):** Cấu hình mở bán từng SKU (`chuon-chuon-tre-kem-de`, `moc-khoa`): Trạng thái mở bán (unconfirmed, open, closed), Giá niêm yết chính thức (VND), Số lượng tồn kho sẵn có, Kênh phân phối, Chính sách đổi trả, Phê duyệt công khai.
6. **Tài chính & Sao kê (Finance & Reconciliation):** Quản lý đối soát sao kê: Toggle trạng thái đối soát (reconciled: true/false), Ngày chốt đối soát, Phê duyệt công khai, Form tải lên CSV sao kê ngân hàng với bộ kiểm định RFC 4180 và số tiền nghiêm ngặt, bảng xem trước giao dịch che mã PII an toàn (`...XXXX`).
7. **Nhóm, FAQ & SEO (Team/FAQ/SEO):** Form thông tin 7 thành viên nhóm Lăng Kính, Nguyên tắc hoạt động, Phân công 5 mảng việc, Câu hỏi thường gặp FAQ, Cấu hình thẻ SEO Meta (Title, Description, og:image).
8. **Lịch sử & Xuất bản (Publish/History):** Tạo bản chụp xuất bản độc lập (Snapshot SHA-256), So sánh khác biệt (Diff viewer), Quy trình phê duyệt Bốn Mắt (Người duyệt 1, Người duyệt 2 độc lập), Lịch sử xuất bản kèm trạng thái triển khai (unknown, building, success, failed).

---

## 3. Khởi chạy và Kiểm thử cục bộ (Local Development)

### 3.1. Chạy Studio cục bộ trên cổng 4330
Hệ thống sử dụng `node:sqlite` (`DatabaseSync`) có sẵn trong Node 22+ và hệ thống tệp cục bộ tại `apps/studio/data/` để giả lập D1 và R2, đảm bảo dữ liệu **hoàn toàn bền vững qua các lần khởi động lại máy chủ**:

```bash
# Khởi chạy từ thư mục gốc
npm run studio:start

# Hoặc khởi chạy từ apps/studio
cd apps/studio
npm start
```
Truy cập: `http://127.0.0.1:4330`

> **Lưu ý về cổng:**
> - Cổng `4322`: Máy chủ Astro Preview website công khai.
> - Cổng `4323`: Công cụ Content Studio CLI nội bộ trước đây.
> - Cổng `4330`: Content Studio trực tuyến Cloudflare Worker độc lập.

### 3.2. Chuyển đổi vai trò kiểm thử (Dev Role Switcher)
Trong môi trường phát triển cục bộ (`STUDIO_ENVIRONMENT=development`), có thể kiểm thử quyền hạn RBAC bằng cách:
- Chọn vai trò trên thanh chọn góc trái phía dưới thanh điều hướng (Admin, Editor, Reviewer).
- Hoặc thêm query parameter: `http://127.0.0.1:4330/?dev_role=editor` (hoặc `dev_role=reviewer`, `dev_role=admin`).

### 3.3. Kiểm thử tự động (Test Suite)
```bash
# Chạy toàn bộ 23 unit tests của Studio
npm run studio:test

# Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt
npm run studio:typecheck

# Biên dịch mã nguồn Studio
npm run studio:build
```

---

## 4. Hướng dẫn Kích hoạt & Triển khai lên Cloudflare (Production Checklist)

Hệ thống được thiết kế **Fail-Secure**: Nếu triển khai lên Cloudflare mà thiếu cấu hình thực tế, Worker sẽ từ chối toàn bộ yêu cầu với mã lỗi 500/401 và không để lộ dữ liệu.

Khi được quản trị viên cấp phép triển khai chính thức, thực hiện các bước sau:

### Bước 1: Tạo cơ sở dữ liệu Cloudflare D1
```bash
npx wrangler d1 create studio-d1
```
Sao chép `database_id` nhận được và cập nhật vào file `apps/studio/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "studio-d1"
database_id = "<DATABASE_ID_THỰC_TẾ>"
```

Chạy migration tạo bảng trên Cloudflare:
```bash
npx wrangler d1 execute studio-d1 --remote --file=./migrations/0001_initial_schema.sql
```

### Bước 2: Tạo Cloudflare R2 Bucket
```bash
npx wrangler r2 bucket create studio-media
```
Bucket `studio-media` đã được khai báo trong `apps/studio/wrangler.toml`:
```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "studio-media"
```

### Bước 3: Cấu hình Cloudflare Zero Trust (Access)
1. Đăng nhập vào trang quản trị Cloudflare One: `https://one.dash.cloudflare.com/`
2. Tạo Application mới dạng **Self-hosted**:
   - Application Name: `Content Studio - Mang Theo Một Nét Vẽ`
   - Application domain: `studio.mangtheomotnetve.vn` (hoặc domain chỉ định)
3. Cấu hình Policy chỉ cho phép các email trong danh sách quản trị viên và biên tập viên đăng nhập qua mã OTP gửi về email.
4. Lấy các thông số bảo mật:
   - **Team Domain:** `<your-team-name>.cloudflareaccess.com`
   - **Application AUD Tag:** Dãy mã Audience 64 ký tự trong phần Overview của Application.
5. Cập nhật vào `apps/studio/wrangler.toml`:
```toml
[vars]
STUDIO_ENVIRONMENT = "production"
CF_ACCESS_TEAM_DOMAIN = "<your-team-name>.cloudflareaccess.com"
CF_ACCESS_AUD = "<APPLICATION_AUD_64_KÝ_TỰ>"
```

### Bước 4: Khởi tạo tài khoản Quản trị viên đầu tiên (Bootstrap User)
Để bảo mật tuyệt đối, email quản trị viên **không được lưu vào file mã nguồn công khai**. Thay vào đó, chèn bản ghi trực tiếp vào D1 qua lệnh bảo mật từ terminal của quản trị viên:
```bash
npx wrangler d1 execute studio-d1 --remote --command="INSERT INTO users (id, email, role, created_at, updated_at) VALUES ('usr-admin-01', '<EMAIL_QUAN_TRI_VIEN>', 'admin', datetime('now'), datetime('now'));"
```

### Bước 5: Triển khai Worker lên Cloudflare
```bash
cd apps/studio
npx wrangler deploy
```
Sau khi triển khai, truy cập qua domain Cloudflare Access đã thiết lập. Trình duyệt sẽ yêu cầu đăng nhập SSO, sau đó chuyển hướng vào Content Studio với đầy đủ quyền hạn tương ứng.
