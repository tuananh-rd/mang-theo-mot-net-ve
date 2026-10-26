# MSH — hero di động cho các trang con (bản xem trước, chưa triển khai)

Nhánh `tuananh-rd/mobile-subpage-heroes`, nền production `3666a18`. Chỉ CSS/props hero; không đổi dữ liệu, tuyến, biểu mẫu, desktop.

## Phạm vi
- Ảnh nền + chữ/CTA trên một tấm phủ trắng đặc 88% (không gradient) ở <=767px cho: Dự án, Nhật ký, Ủng hộ (/dong-hanh), Minh bạch. Ảnh phủ kín toàn khối hero (breadcrumb nằm ngoài, trên nền sáng).
- Mỗi ảnh có điểm lấy nét di động riêng (`mobilePosition`) và độ đẩy `--hero-shift`: dự án 72% 50%, nhật ký 70% 55%, ủng hộ 42% 50%, minh bạch 35% 62%.
- Quà lưu niệm (/san-pham): KHÔNG chuyển thành nền; giữ nguyên ảnh tiền cảnh. Ảnh 730px không bị phóng.
- /ve-nhom: vẫn chỉ chữ, không đổi. Trang bài viết và chi tiết sản phẩm không dùng PageHero nên không đổi.
- Trang chủ: chỉ thêm quy tắc cho màn thấp (<=700px) và `scroll-margin` tính safe-area (motion.css) để thanh cố định không che nút/tiêu điểm.

## Kiểm chứng (preview http://127.0.0.1:4384, noindex)
- `npm ci` 0; `npm run check` 0 (0 lỗi); `npm test` 0 (139/139); `npm run build` 0.
- 9 trang x 7 cỡ (320x640, 375x812, 390x844, 430x932, 767x900, 768x1024, 1440x900): không tràn ngang, 1 H1; ảnh before/ và after/.
- Desktop 768/1440: khác biệt điểm ảnh tối đa 0,35% (hoạt ảnh vào trang), chiều cao trang giống hệt.
- Phóng chữ 200%, Tab, reduced-motion (a11y.json): không tràn; chỉ "skip link" nằm trên header theo thiết kế; không hoạt ảnh chạy.
- Thanh cố định 320x640 (clearance-320x640.json): cuộn/focus từng khối và liên kết hero đều nằm trên thanh. Ở lần xem đầu, nút "Tìm hiểu dự án" trang chủ lấn thanh ~1px, các trang con không có nút bị che.
- Tương phản chữ so với tấm phủ ≥5,76:1 (đo bằng nền xếp lớp, không tính ảnh); xấu nhất phía sau là ảnh đen => ~224/255 nền, chữ mực vẫn rõ. Không khẳng định WCAG AA hay CWV.
- Giai đoạn 2 và sổ L3 1.011.222đ không đổi (4 lần xuất hiện, giống bản trước).

## Hạn chế
- Hộp hero cao nên ảnh bị cắt ngang (cover); chủ thể nằm trong phần ảnh lộ phía trên, phần dưới ảnh mờ sau tấm phủ.
- Chưa kiểm thử trên thiết bị thật/safe-area thật; chưa có số liệu CWV.
