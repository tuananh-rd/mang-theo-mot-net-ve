# Hướng dẫn sử dụng Công cụ Cập nhật Nội bộ (Content Studio)

Tài liệu hướng dẫn dành cho nhóm sinh viên Lăng Kính thực hiện biên tập bài viết nhật ký, cập nhật trạng thái mở bán quà lưu niệm và đối soát sổ ủng hộ ngân hàng cho dự án "Mang Theo Một Nét Vẽ".

---

## 1. Giới thiệu và Nguyên tắc An toàn

Content Studio là công cụ nội bộ chạy **cục bộ (local loopback `127.0.0.1:4323`)**, không mở ra Internet và không nằm trong bundle tĩnh của website công khai.

### Các nguyên tắc bắt buộc:
1. **Quy trình kiểm tra 2 người (Four-eyes principle):**
   - Mọi dữ liệu sao kê ngân hàng đối soát hoặc cấu hình mở bán quà lưu niệm trước khi công bố bắt buộc phải được ít nhất 2 thành viên độc lập trong nhóm (ví dụ: Thành viên tài chính và Trưởng nhóm) cùng đối chiếu và ký duyệt.
2. **Bảo mật thông tin cá nhân (PII):**
   - Tuyệt đối không đưa nội dung giao dịch ngân hàng thô, số tài khoản cá nhân, ghi chú riêng hoặc tên cá nhân người đối soát vào website công khai.
   - Các khoản ủng hộ chưa có sự đồng ý công khai danh tính mặc định được chuẩn hóa thành **"Ẩn danh"**. Mã giao dịch hiển thị dưới dạng che giấu hậu tố (`...${id.slice(-4)}`).
3. **Sao lưu tự động & Chống xung đột dữ liệu (Stale-baseline protection):**
   - Mọi thao tác ghi đè dữ liệu đều tự động tạo bản sao lưu trong `tools/content-studio/backups/`.
   - CLI và API bắt buộc kiểm tra mã băm SHA-256 (`--expected-hash`) trước khi ghi để chống ghi đè dữ liệu cũ ngoài ý muốn.
4. **Quyền riêng tư kho mã nguồn:**
   - Thư mục sao lưu `tools/content-studio/backups/` và các tệp kiểm thử tạm `scratch/` được cấu hình loại trừ (`.gitignore`), không được commit vào Git repository.

---

## 2. Cách khởi chạy công cụ

### Cách 1: Sử dụng Giao diện Web (Khuyến nghị)
Mở cửa sổ dòng lệnh tại thư mục dự án và chạy:
```bash
npm run content:studio
```
Sau đó mở trình duyệt web và truy cập địa chỉ:
👉 **`http://127.0.0.1:4323`**

### Cách 2: Sử dụng Dòng lệnh (CLI)
Cú pháp dòng lệnh:
```bash
# Xem hướng dẫn
node tools/content-studio/cli.mjs --help

# Xem CSV mẫu
node tools/content-studio/cli.mjs sample

# 1. Kiểm tra tính hợp lệ dữ liệu (Validate)
node tools/content-studio/cli.mjs validate <file.csv> --target donations [--reconciled-at YYYY-MM-DD]
node tools/content-studio/cli.mjs validate <file.json> --target donations
node tools/content-studio/cli.mjs validate <file.json> --target journal
node tools/content-studio/cli.mjs validate <file.json> --target products

# 2. Chạy thử trước khi ghi đĩa (Dry-run mặc định)
node tools/content-studio/cli.mjs apply <file.json> --target journal
node tools/content-studio/cli.mjs apply <file.json> --target products
node tools/content-studio/cli.mjs apply <file.csv> --target donations --reconciled-at YYYY-MM-DD --reviewers "Người 1, Người 2"

# 3. Áp dụng thực tế vào site (Bắt buộc --apply và --expected-hash)
node tools/content-studio/cli.mjs apply <file.json> --target journal --apply --expected-hash <sha256>
node tools/content-studio/cli.mjs apply <file.json> --target products --apply --expected-hash <sha256>
node tools/content-studio/cli.mjs apply <file.csv> --target donations --apply --expected-hash <sha256> --reconciled-at YYYY-MM-DD --reviewers "Người 1, Người 2"
node tools/content-studio/cli.mjs apply <file.json> --target donations --apply --expected-hash <sha256> --reconciled-at YYYY-MM-DD --reviewers "Người 1, Người 2"
```

---

## 3. Hướng dẫn các tính năng trên Giao diện Web

### 3.1. Biên tập Bài viết Nhật ký (Tab 1: Nhật ký)
1. **Thông tin chung:**
   - **Slug:** Định dạng kebab-case viết thường (ví dụ: `ke-hoach-bon-goc-choi`).
   - **Danh mục:** Chọn một trong 4 danh mục: *Kế hoạch, Chuẩn bị, Hoạt động, Bàn giao*.
   - **Tiêu đề & Tóm tắt:** Ngắn gọn, trung thực, phản ánh đúng kế hoạch hoạt động.
   - **Ngày công bố & Ngày sự kiện:** Định dạng `YYYY-MM-DD`.
   - **Trạng thái sự kiện:** Chọn `planned`, `in_progress`, hoặc `completed`. Khi sửa bài cũ, trạng thái hiện có được bảo toàn nguyên vẹn.
   - **Trạng thái phát hành:** `published` (công bố) hoặc `draft` (bản nháp nội bộ). Bài viết `draft` bị cách ly hoàn toàn, không tạo route tĩnh và không xuất hiện trên website công khai.
   - **Ảnh bìa:** Chỉ cho phép chọn từ danh mục ảnh đã duyệt của dự án.
2. **Khối nội dung có cấu trúc:**
   - Thêm các khối: *Đoạn văn, Tiêu đề mục (H2/H3), Khối lưu ý, Danh sách, Trích dẫn*.
3. **Xem trước và áp dụng:**
   - Bấm **"Kiểm tra & Xuất JSON"**: Giao diện hiển thị bản xem trước trực quan (Article Preview) với đầy đủ định dạng thẻ, ảnh, tóm tắt và khối nội dung.
   - Bấm **"Áp dụng vào Site"**: Hệ thống kiểm tra hash và tự động sao lưu trước khi ghi vào `src/data/journal-entries.json`.

### 3.2. Cập nhật Trạng thái Mở bán Quà lưu niệm (Tab 2: Sản phẩm)
Hệ thống cho phép cấu hình 2 sản phẩm thủ công: `chuon-chuon-tre-kem-de` và `moc-khoa`.
1. **Các trường cấu hình:**
   - **Trạng thái mở bán (`saleStatus`):** `unconfirmed` (chờ mở bán), `open` (đang mở bán), `closed` (đã kết thúc).
   - **Giá niêm yết chính thức (`officialPrice`):** Phải là số nguyên dương VND khi trạng thái là `open`.
   - **Số lượng có sẵn (`stockAvailable`):** Số nguyên không âm hoặc để trống nếu chưa xác nhận. Nếu bằng 0, hệ thống tự động khóa luồng đặt mua. Khi có số lượng cụ thể, số lượng đặt mua bị giới hạn tối đa theo số lượng kho có sẵn.
   - **Kênh tiếp nhận & giao quà (`salesChannel`):** Bắt buộc điền khi mở bán (ví dụ: khuôn viên ĐH FPT Hòa Lạc).
   - **Chính sách đổi/trả/hủy (`returnPolicy`):** Bắt buộc điền khi mở bán.
   - **Phê duyệt công khai (`publicApproval`):** Chọn `approved` sau khi nhóm thống nhất.
2. **Quy tắc kích hoạt luồng mua:**
   - Form soạn yêu cầu mua (`/san-pham/[slug]`) CHỈ xuất hiện khi thỏa mãn đồng thời: `saleStatus === 'open'`, giá chính thức > 0, `publicApproval === 'approved'`, có kênh bán, có chính sách đổi trả và `stockAvailable !== 0`.

### 3.3. Đối soát Sao kê Ngân hàng qua CSV và JSON (Tab 3: Đối soát Sao kê CSV)
1. **Chuẩn bị dữ liệu:**
   - Cột chuẩn CSV: `ma_giao_dich,ngay,so_tien,ten_nguoi_ung_ho,noi_dung,dong_y_cong_khai,ghi_chu`.
   - Bấm **"Nạp CSV mẫu"** để tham khảo cấu trúc định dạng chuẩn RFC 4180. Tệp mẫu chứa các trường giữ chỗ (`SAMPLE_...`, số tiền 0đ) và hệ thống chủ động chặn áp dụng các dòng mẫu này vào sổ thực tế cho đến khi người dùng nhập dữ liệu đối soát ngân hàng thật.
2. **Kiểm tra dữ liệu & Quy tắc thẩm định:**
   - Nhập ngày chốt đối soát (`YYYY-MM-DD`). Ngày giao dịch không được diễn ra sau ngày chốt đối soát.
   - Bắt buộc chỉ định ít nhất 2 thành viên đối soát chéo độc lập khác nhau (`--reviewers "Người 1, Người 2"`).
   - Tích chọn xác nhận phê duyệt công bố sổ ủng hộ.
   - Bấm **"Kiểm tra tính hợp lệ CSV"** để phát hiện các lỗi định dạng, số tiền hoặc ngày tháng.
   - Bản chiếu JSON đầu vào bắt buộc phải có `reconciled: true` và `publicApproval: 'approved'`; hệ thống từ chối tự động nâng cấp trạng thái từ pending/unreconciled thành approved.
3. **Xuất JSON hoặc Áp dụng:**
   - Bấm **"Xuất JSON đối soát"** để lưu tệp `reconciled-donations.json`.
   - Bấm **"Áp dụng bản chiếu công khai"** để nạp trực tiếp vào `src/data/reconciled-donations.json`. Dữ liệu ghi ra được tách biệt an toàn theo allowlist, mã giao dịch che giấu hậu tố (`...${id.slice(-4)}`), người ủng hộ ẩn danh được bảo vệ (`reference: null`), và tên riêng của người đối soát không đưa vào public bundle (chỉ lưu nhãn vai trò đại diện).

---

## 4. Quy trình Khôi phục từ Bản sao lưu (Restore Backup)

Khi cần khôi phục lại dữ liệu về trạng thái trước:
1. Mở thư mục `tools/content-studio/backups/`.
2. Xác định tệp sao lưu theo thời gian và đối tượng (ví dụ: `donations-2026-10-11T...json`).
3. Sao chép nội dung tệp sao lưu đè lại vào tệp nguồn tương ứng trong `src/data/`:
   - `src/data/journal-entries.json`
   - `src/data/product-sales-config.json`
   - `src/data/reconciled-donations.json`
4. Chạy lệnh `npm run test` và `npm run check` để đảm bảo hệ thống đồng bộ.
