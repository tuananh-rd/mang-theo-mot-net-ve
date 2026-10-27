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
- Thanh cố định 320x640 (clearance-320x640.json): cuộn/focus từng khối và liên kết hero đều nằm trên thanh. (Đã sửa ở commit tiếp theo, xem "Sửa bổ sung".)
- Tương phản chữ so với tấm phủ ≥5,76:1 (đo bằng nền xếp lớp, không tính ảnh); xấu nhất phía sau là ảnh đen => ~224/255 nền, chữ mực vẫn rõ. Không khẳng định WCAG AA hay CWV.
- Giai đoạn 2 và sổ L3 1.011.222đ không đổi (4 lần xuất hiện, giống bản trước).

## Hạn chế
- Hộp hero cao nên ảnh bị cắt ngang (cover); chủ thể nằm trong phần ảnh lộ phía trên, phần dưới ảnh mờ sau tấm phủ.
- Chưa kiểm thử trên thiết bị thật/safe-area thật; chưa có số liệu CWV.

## Sửa bổ sung (sau review của Codex): CTA trang chủ ở 320x640
- Nguyên nhân: nút thứ hai của hero trang chủ chạm đáy ở y=579, trùng đỉnh thanh cố định (khoảng cách 0px).
- Sửa chỉ trong `Hero.astro`, trong media (<=767px và chiều cao <=700px): nút hero `min-height: 44px` và padding dọc `var(--space-2)`. Ảnh, chữ, liên kết, trang con không đổi.
- Đo lại (after-fix/home-probe-*.json, đỉnh thanh cố định so với đáy nút thứ hai): 320x640 -> nút 470-514 và 518-562, thanh ở 579, **khoảng cách 17px**; 360x640 -> 43px; 375x812 -> 33px. Cả hai nút đều nằm trên thanh. clearance-320x640 (cuộn + focus mọi khối/nút hero, 6 trang): không có phần tử bị che.
- `npm run check` exit 0 (0 lỗi); `npm test` exit 0 (139/139); `npm run build` exit 0. Preview 4384 vẫn chạy, có X-Robots-Tag noindex. Ảnh: after-fix/home-320x640-viewport.png, home-375x812-viewport.png.

## Mở rộng phạm vi (chủ dự án): ảnh nền + chữ/CTA trên tấm phủ ở MỌI cỡ màn hình
Quy tắc "desktop không đổi" cũ bị thay thế. Chỉ đổi `PageHero.astro` (CSS) và thuộc tính `sizes` của ảnh ở `san-pham.astro`; không thêm tài sản/phụ thuộc/dữ liệu, giữ nguyên ảnh, alt, chữ, liên kết, giá/đặt trước, sổ ủng hộ. `/ve-nhom` vẫn chỉ chữ; trang chủ không đổi.
- **Dự án, Nhật ký, Ủng hộ, Minh bạch (>=768px):** ảnh phủ kín khối (bo góc), chữ/CTA nằm trên MỘT dải trắng mờ 88% cao bằng ảnh, không gradient, không thẻ trắng tách rời, không bóng. Bề rộng dải theo trang: Dự án/Ủng hộ 46% (tối đa 540px), Nhật ký 50% (600px) đặt bên phải, Minh bạch 52% (600px) bên phải; 768–1023px dùng 56% (tối đa 540px). Ở <=767px giữ bố cục ảnh nền toàn khối đã làm trước.
- **Quà lưu niệm (mọi cỡ):** ảnh gốc 730x548 luôn hiển thị đúng 730px hoặc nhỏ hơn (đo: tỉ lệ hiển thị/kích thước nguồn = 1,00 ở 1024/1440/1920; 0,99 ở 768; ≤0,51 ở di động, tức chỉ thu nhỏ/cắt, không phóng); `sizes="730px"` để trình duyệt chọn đúng bản 730w. Tấm phủ nằm TRONG vùng ảnh. >=768px chia hai cột (tiêu đề | lead + nút | mô tả) nên cả chữ lẫn nút nằm trong ảnh. <=767px: khối cao tối thiểu 548px (chiều cao ảnh nguồn), tấm phủ neo đáy, chữ thu gọn nên cả chữ và nút nằm trong ảnh ở 375/390/430/768; ở 320px phần chữ dài hơn ảnh vài chục px nên có dải nền nhạt rất mỏng phía trên ảnh (không dùng ảnh khác). Hai em nhỏ ở di động bị tấm phủ che một phần (vẫn thấy mờ phía sau): đây là giới hạn của ảnh nguồn 730px khi phải đặt toàn bộ chữ lên ảnh mà không phóng to.
- **Đo nút đăng ký (product-bounds.json):** nút nằm trọn trong ảnh ở 320/375/768/1024/1440/1920; không tràn ngang, focus vào nút thành công và không nằm dưới thanh cố định; `clearance-320x640.json`: không phần tử hero nào bị thanh che khi cuộn/focus. Ở lần xem đầu 320x640 nút quà lưu niệm nằm dưới thanh cố định cho đến khi cuộn (không khẳng định vừa trong màn hình đầu).
- **Kiểm chứng:** 9 trang x 9 cỡ (320x640, 375x812, 390x844, 430x932, 767x900, 768x1024, 1024x768, 1440x900, 1920x1080): không tràn ngang, 1 H1, tương phản chữ so với tấm phủ ≥5,76:1 (đo nền xếp lớp, không tính ảnh); phóng chữ 200%, Tab, reduced-motion (a11y.json) không lỗi (chỉ "skip link" nằm trên header theo thiết kế). Ảnh sau ở `after-v2/` (viewport mọi cỡ + toàn trang 375/1440); ảnh trước ở `before/` (375/768/1440, mobile) và `before-extra/` (1024/1920); bộ 5 trang: project, journal, products, finance, support.
- `npm run check` exit 0 (0 lỗi), `npm test` exit 0 (139/139), `npm run build` exit 0. Giai đoạn 2 và sổ L3 1.011.222đ không đổi (4 lần xuất hiện). Preview 4384 vẫn chạy, có X-Robots-Tag noindex.
- **Hạn chế:** bản chụp trước ở 1024/1920 chỉ là viewport; không thử thiết bị thật/safe-area; không số liệu CWV; không khẳng định WCAG AA.
