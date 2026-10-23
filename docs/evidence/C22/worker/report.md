# C22 — Báo cáo worker

Ngày: 23/10/2026  
Đặc tả: `docs/task-specs/C22-hero-images.md`  
Code commit C17/Studio: `4f4ba6ad72a7f3123a6d783f8d14bd65bc72d8ea`  
Code commit C18/public: `30aba517e32ea6ec1092e8def7e1ee77975ef3a3`

## Thay đổi

- `PageHero` nhận prop ảnh tùy chọn. Desktop từ 1024px xếp chữ trái, ảnh phải theo lưới 7/5; dưới 1024px xếp breadcrumb → ảnh → cụm nội dung. Khung ảnh có chiều cao tối đa 320px tablet và 240px mobile; khoảng cách ảnh tới cụm chữ là 16px ở 768px và 12px ở 375/390px.
- Gắn ảnh cho `/du-an/mang-theo-mot-net-ve`, `/san-pham`, `/nhat-ky`, `/minh-bach`, `/dong-hanh`, `/ve-nhom`. Ảnh `/san-pham` luôn hiện; khung giới hạn tối đa 560px để không phóng lớn ảnh 730×548. Nút “Đăng ký nhận quà lưu niệm” trong cột chữ desktop có kích thước theo nội dung. Trang chủ và trang chi tiết sản phẩm không đổi.
- `tools/optimize-hero-images.mjs` đọc nguồn từ đường dẫn tuyệt đối, xoay theo EXIF, xuất WebP quality 75 theo các kích thước không vượt nguồn và ghi manifest SHA/kích thước/alt/focal/quyền sử dụng vào `docs/media-registry.json`. 17 ảnh đầu ra đều không còn EXIF/ICC/IPTC/XMP; ảnh nguồn không được chép vào repo hoặc `dist`.
- Sổ ảnh ghi nguồn là chủ dự án cung cấp, đồng ý của người trong ảnh chưa được xác minh độc lập. Alt trung tính, không nêu tên, địa điểm hoặc sự kiện. `public/images/README.md` được cập nhật để bỏ ghi chú cũ nói chưa có ảnh thật.
- Kiểm tra cơ chế xuất bản: `tools/content-studio/release-delta.mjs` chỉ lọc consumer paths và ghi patch vào evidence; `apps/studio/src/publish/consumer.ts` ghi snapshot/JSON và các `approvedAssets` vào đích cô lập. Hai luồng này không xóa hay khôi phục cây `public/`; ảnh hero là asset tĩnh trong repo, không dùng `mediaKey`. Không sửa module Studio hoặc `release-delta`.

## Ảnh 800px

| Trang | Nguồn | Dẫn xuất hiển thị | Byte | SHA-256 |
|---|---|---:|---:|---|
| `/du-an/mang-theo-mot-net-ve` | `03_Các em tập văn nghệ.jpg` (2000×1330) | 800×532 | 51,868 | `b6fb4d65975b9f8f33a0bf90c73ddaa70acf06483de463952cc7ad9c7ca86597` |
| `/san-pham` | `10_Hai em bên giàn hoa.jpg` (730×548) | 730×548 | 111,978 | `4a551fedb3fa46837c8ffa04cddfae52cac23449ff417921a3d0ad45cfbfcc8e` |
| `/nhat-ky` | `nhay_nhot.jpg` (2048×1536) | 800×600 | 58,466 | `d9c16c875b5f24c45b4f913e7db1586063c749ae6dead7e42d18bef8696c8cc2` |
| `/minh-bach` | `09_Em hái hoa bên rổ xanh.jpg` (1153×2048) | 800×599, crop ngang vùng rổ và tay ở dưới-giữa | 141,038 | `1b34e977aff18517bec49b1f0b9db74c737a13ae434055e8540a35dc26c6a32d` |
| `/dong-hanh` | `1792465511013_6949534732441527363_g2893497410154641941_f00018dd520788606057b4a3ae2f54b8.jpg` (1280×960) | 800×600 | 118,584 | `a48bd64b097a972383a18de85c807a712e0fa6ba951f2badd9da73c162429c74` |
| `/ve-nhom` | `13_Sinh hoạt với micro.jpg` (2000×1330) | 800×532 | 37,364 | `768505a3406c5528c33335879873c35c362fa9e050dbb02ebf20193556600b69` |

SHA/kích thước tất cả 17 file dẫn xuất, kể cả bản sản phẩm 480/730px, có trong `docs/media-registry.json`. Không dùng `06_Ba em nhặt rau.jpg` hoặc `14_Nhóm ngồi ghế dài.jpg`.

## Kiểm chứng giao diện

Preview là build C17 tại `http://127.0.0.1:4321`; API preorder chỉ chạy bằng Studio emulator local trên cổng 4331 với DB tạm ngoài repo, dùng hai giá/cách nhận đã được chủ dự án xác nhận. GET cấu hình trả 200; biểu mẫu hiển thị “Đang nhận đăng ký đặt trước.” và không gửi đơn. Không truy cập Cloudflare/D1 remote.

`capture-preview.mjs` chụp 7 route (6 trang chính và `/san-pham/chuon-chuon-tre-kem-de`) ở 1440×900, 768×1024, 375×812, 390×844: mỗi tổ hợp có ảnh viewport và full page, tổng 56 JPEG. Lần review này chụp lại cả 8 ảnh viewport/full-page của `/san-pham` và cập nhật 4 phép đo tương ứng trong `measurements.json`.

- 28/28 trạng thái có `scrollWidth ≤ innerWidth`; không có ảnh lỗi. Sáu tiêu đề và lead đều nằm trong viewport đầu ở cả bốn kích thước.
- `/san-pham`: ảnh hiện tại cả bốn viewport, khung rộng 453px ở 1440, 560px ở 768, 335px ở 375 và 350px ở 390; không khung nào vượt 560px. Ảnh cách cột chữ 48px theo chiều ngang desktop và cách cụm chữ 16px tablet / 12px mobile. CTA desktop rộng 251px trong cột chữ 635px; trên mobile CTA vẫn full-width theo cột 335/350px.
- Không tràn ngang ở bốn viewport sản phẩm; ảnh tải đủ và CTA nằm trong viewport đầu. Khoảng cách ảnh tới H1 lớn hơn vì có eyebrow/chip theo đúng thứ tự trong đặc tả.
- CTA đặt trước ở trang sản phẩm nằm trong viewport đầu cả bốn kích thước. Năm trang còn lại không có CTA trong nội dung `PageHero`; CTA hiện có trong header/thanh ủng hộ giữ nguyên. Trang dự án và trang ủng hộ có phần tiến độ/các bước dài nằm dưới nội dung mở đầu; tiêu đề và lead vẫn hiện trong viewport đầu.
- Menu được mở rồi đóng thành công ở 768/375/390px; mỗi trạng thái có 22 liên kết menu. Kiểm tra 16 URL nội bộ duy nhất: 16 trả 200, không có link hỏng.
- Trang chi tiết sản phẩm được chụp đủ bốn kích thước; không thêm `PageHero` theo giới hạn đặc tả.

## Cổng kiểm tra

| Worktree | `npm run check` | `npm test` | `npm run build` | Studio |
|---|---|---:|---|---|
| `task/c17-online-studio` | exit 0, 0 lỗi, 0 warning, 40 hints hiện hữu ở scripts evidence | exit 0, 101/101 | exit 0, 13 trang | `studio:build` 0; `studio:typecheck` 0; `npm exec -- astro build --config astro.preview.config.mjs` 0 (2 cảnh báo route động hiện hữu); `studio:test` 91/91 |
| `task/c18-v3-content` | exit 0, 0 lỗi/warning/hints | exit 0, 96/96 | exit 0, 13 trang | worktree không có `apps/studio` hoặc script `studio:*`; không chép mã Studio sang public |

Test mới xác minh 6 route gắn ảnh, alt không rỗng/trung tính, kích thước/byte/SHA registry, không metadata, ngưỡng ~150KiB tại 800px, và không chép JPEG gốc vào `public`/`dist`. Grep build C17 không thấy token tham chiếu giao dịch C21 (`transactionReference`, `transactionRef`, `referenceLast4`, `last4`, `maGiaoDich`). Không sửa tiền/đơn đặt trước, tài khoản nhận ủng hộ Techcombank, snapshot hoặc dữ liệu giao dịch.

## Ghi chú còn lại

Ảnh nguồn `/san-pham` rộng 730×548; khung CSS giới hạn 560px và ảnh không bị phóng lên. Consent của người xuất hiện trong ảnh chưa được xác minh; registry và alt giữ nguyên giới hạn đó.
