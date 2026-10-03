# Hướng dẫn Vận hành và Bảo trì Bản xem trước “Mang Theo Một Nét Vẽ”

Tài liệu này được lưu trữ ngoài repository theo quy tắc phân định quyền quản lý (Codex sở hữu tài liệu kế hoạch, đặc tả, review; Antigravity phụ trách mã nguồn ứng dụng và ghi chú vận hành bàn giao).

---

## 1. Tổng quan Dự án và Trạng thái Hiện tại

- **Dự án:** Chiến dịch “Mang Theo Một Nét Vẽ”
- **Đơn vị thực hiện:** Nhóm sinh viên Lăng Kính (7 sinh viên lớp AI2015, học phần SSG105 — Kỹ năng làm việc nhóm, Đại học FPT Hà Nội)
- **Địa điểm dự kiến:** Mái ấm Thánh Tâm Xuy Xá (xã Xuy Xá, huyện Mỹ Đức, Hà Nội)
- **Trạng thái:** **Bản xem trước nội bộ (Internal Preview)** phục vụ lấy ý kiến đóng góp, thẩm định học phần và chuẩn bị hồ sơ. Website **chưa mở bán, chưa tiếp nhận đơn hàng, chưa nhận tiền đóng góp hay tài trợ**.
- **Chỉ thị tìm kiếm:** Toàn bộ 7 trang HTML đều được cấu hình `<meta name="robots" content="noindex, nofollow">` để tránh lập chỉ mục ngoài ý muốn.

---

## 2. Nguồn Dữ liệu Đơn nhất (Single Source of Truth)

Toàn bộ dữ liệu được quản lý tập trung và định kiểu chặt chẽ (Strict TypeScript) trong file `src/data/campaign.ts`:

1. **Thông tin Dự án (`CAMPAIGN_PROJECT`):**
   - Chứa thông tin về bối cảnh, đối tượng thụ hưởng (trẻ em có hoàn cảnh đặc biệt tại Mái ấm Thánh Tâm Xuy Xá), thời gian và địa điểm dự kiến.
2. **Sản phẩm Gây quỹ Dự kiến (`PRODUCTS`):**
   - Gồm 3 sản phẩm: Chuồn chuồn tre kèm chân đế (30 bộ, 40.000đ/bộ), Túi bút (20 chiếc, 55.000đ/chiếc), Túi vải (tối đa 8 chiếc, 75.000đ/chiếc).
   - **Quy tắc số liệu:** `plannedQuantity.value` và `referencePrice.value` là nguồn số duy nhất. Tiền tố định tính (như `'Tối đa '`) được lưu ở `quantityPrefix`. Các hàm helper trong `src/lib/finance.ts` (`formatProductQuantity`, `formatProductPrice`) tự động dẫn xuất hiển thị. Nếu giá trị là `null`, hệ thống hiển thị chính xác `'Chưa xác nhận'` mà không tự gắn thêm đơn vị (`/bộ`, `/chiếc`).
   - `actualStock` hiện đang là `null`, `saleStatus` là `'unconfirmed'`.
3. **Dự toán Chi phí (`PLANNED_EXPENSES`):**
   - 6 khoản mục dự toán chi tiết với tổng kinh phí là **3.120.000đ**.
4. **Kịch bản Tài chính (`FINANCE_SCENARIOS`):**
   - Kịch bản 1 (Chưa tính tài trợ): Chi tiền 3.120.000đ, Thu từ sản phẩm 2.900.000đ => **Chênh lệch giả định thiếu 220.000đ**.
   - Kịch bản 2 (Hiện vật thay một phần 500.000đ): Chi tiền còn 2.620.000đ => **Dư 280.000đ**.
   - Kịch bản 3 (Hiện vật thay chi workshop 1.120.000đ): Chi tiền còn 2.000.000đ => **Dư 900.000đ**.
5. **Dữ liệu Thực tế và Kênh Liên hệ (`ACTUAL_FINANCE`, `OFFICIAL_CONTACT`):**
   - Toàn bộ giá trị thực tế (`actualCashReceived`, `actualCashSpent`, `actualCashBalance`, `actualInKindReceived`, `actualInKindDelivered`, `vouchersCount`) được khởi tạo là `null`.
   - `OFFICIAL_CONTACT` gồm email, điện thoại, đại diện đều là `null` với trạng thái `'unconfirmed'`.

---

## 3. Hướng dẫn Đồng bộ khi Dữ liệu Thay đổi

Khi có cập nhật từ đề xuất thực tế, người vận hành chỉ cần chỉnh sửa tại `src/data/campaign.ts`, hệ thống sẽ tự động đồng bộ trên toàn bộ giao diện:

| Nội dung thay đổi | Vị trí cập nhật trong `src/data/campaign.ts` | Các khu vực tự động cập nhật |
| :--- | :--- | :--- |
| **Giá / Số lượng sản phẩm** | `PRODUCTS[i].referencePrice.value`, `PRODUCTS[i].plannedQuantity.value` | - Bảng kế hoạch & thẻ sản phẩm tại `/san-pham`<br>- Thẻ sản phẩm nổi bật tại trang chủ `/`<br>- Thẻ sản phẩm tại `/dong-hanh`<br>- Doanh thu kịch bản bán đủ hàng tại `/minh-bach` và `/` |
| **Khoản chi dự toán** | `PLANNED_EXPENSES[i].amount.value` | - Danh mục dự toán chi tại `/minh-bach`<br>- Tổng chi dự toán tại trang chủ `/`<br>- Các kịch bản cân đối ngân sách tại `/minh-bach` |
| **Phát sinh số liệu thực tế** | `ACTUAL_FINANCE.*` (chuyển từ `null` sang số thực tế sau đối soát) | - Khối "Tình hình thu chi thực tế" tại `/minh-bach` sẽ tự động hiển thị số tiền/chứng từ thay vì hiển thị banner "chờ đối soát và cấp phép". |
| **Kênh liên hệ chính thức** | `OFFICIAL_CONTACT.*` (cập nhật email/phone và `status: 'confirmed'`) | - Khối liên hệ tại `/dong-hanh` sẽ hiển thị thông tin chính thức thay vì thông báo "chờ xác nhận và quyền công bố". |

---

## 4. Danh mục Cần Thẩm duyệt Trước khi Công bố (Pre-Launch Checklist)

Trước khi chuyển website từ chế độ Xem trước (Preview) sang Công khai (Public), cần hoàn thành các bước sau:

1. **Phê duyệt từ Mái ấm và Nhà trường:**
   - Biên bản làm việc hoặc xác nhận chính thức từ Mái ấm Thánh Tâm Xuy Xá về kế hoạch tổ chức, nhu cầu vật tư và danh mục quà tặng.
   - Ý kiến chấp thuận của giảng viên hướng dẫn học phần SSG105 (Đại học FPT Hà Nội).
2. **Quyền riêng tư và Hình ảnh:**
   - Chỉ sử dụng hình ảnh minh họa CSS/SVG dạng placeholder hoặc hình ảnh đã được sự đồng ý bằng văn bản của người giám hộ/đại diện Mái ấm.
   - Thẩm duyệt danh sách 7 thành viên nhóm Lăng Kính trước khi đưa họ tên và hình ảnh cá nhân lên `/ve-nhom`.
3. **Kênh Tiếp nhận và Tài khoản:**
   - Xác định rõ tư cách pháp lý và đầu mối tiếp nhận tài trợ/quyên góp.
   - Không đăng tải số tài khoản cá nhân hoặc mã QR thanh toán khi chưa có quy chế quản lý quỹ được phê duyệt.
4. **Cấu hình Tìm kiếm & Tên miền:**
   - Khi có tên miền chính thức, cập nhật `site` trong `astro.config.mjs`.
   - Cập nhật thẻ meta trong `src/layouts/Layout.astro` từ `<meta name="robots" content="noindex, nofollow">` sang `<meta name="robots" content="index, follow">`.

---

## 5. Quy trình Kiểm tra và Build Website

Để đảm bảo website luôn đạt chất lượng kỹ thuật cao nhất:

```powershell
# 1. Kiểm tra tĩnh TypeScript và cú pháp Astro (phải đạt 0 errors, 0 warnings, 0 hints)
npm.cmd run check

# 2. Chạy bộ kiểm thử tự động về tính toàn vẹn tài chính và helper
node --test tests/finance.test.mjs

# 3. Biên dịch bản phân phối tĩnh (Static HTML Bundle)
npm.cmd run build

# 4. Chạy Preview Server cục bộ để nghiệm thu
npx astro preview --host 127.0.0.1 --port 4321
```

---

## 6. Lưu ý Cấu hình Máy chủ Tĩnh (Static Hosting) và Trang 404

- Dự án áp dụng `trailingSlash: 'never'` trong `astro.config.mjs`. Các URL dạng `/san-pham/` sẽ được máy chủ redirect hoặc trả về 404 nếu không cấu hình định tuyến phù hợp. Luôn liên kết bằng URL chuẩn `/san-pham`, `/minh-bach`, v.v.
- File `dist/404.html` đã được tạo sẵn với đầy đủ giao diện, nút quay lại trang chủ và tuân thủ chuẩn thương hiệu. Khi triển khai lên GitHub Pages, Cloudflare Pages, Netlify, hoặc AWS S3, hãy cấu hình tài liệu lỗi (Error Document) trỏ về `/404.html`.
