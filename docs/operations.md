# Vận hành bản xem trước

## Hiện hành sau C01

App ead94a482e590cf1c5ef4eb1e0829c99e30d378c, [RC01 PASS](reviews/RC01-ead94a4.md). Nguồn cập nhật: [materials-intake.md](materials-intake.md); sourcePDF vẫnngoàiGit/bundle. Không dùng danh mục/dự toánT04 làm nguồn mới. Giữ preview/noindex và mốc public riêng.

Tài liệu Codex sở hữu, đối chiếu app T04 `fad117c`, [R04 PASS](reviews/R04-fad117c.md). Đây là hướng dẫn cho website Astro static hiện tại; chưa phải quyết định hosting hoặc duyệt phát hành. [Thông tin cần chủ dự án xác nhận](open-questions.md) vẫn còn mở. Khi giao cập nhật, Antigravity triển khai code theo task và Codex review đúng commit trước khi thay bản đã nghiệm thu.

## Chạy và kiểm tra

Yêu cầu môi trường hiện đã kiểm: Node 24.19.0, npm 11.17.0. Dùng npm cùng `package-lock.json`; không đổi package manager hoặc xóa lockfile để xử lý lỗi. `node --test` hiện chạy test tài chính `.mjs` nhập TypeScript bằng hỗ trợ native của Node; bản Node khác cần kiểm tương thích trước khi sử dụng.

Trong thư mục repo, cài dependency khi không còn dev/preview giữ compiler native trên Windows. Nếu lỗi khóa file, kiểm task/PID server đang dùng rồi dừng chính process đó; không kill toàn bộ Node hoặc xóa workspace. Chạy tuần tự:

```powershell
npm.cmd ci
npm.cmd run check
node --test tests/finance.test.mjs
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4321
```

Mở `http://127.0.0.1:4321/`; dừng bằng Ctrl+C ở terminal sở hữu server. Review dùng build từ `dist`, không dùng dev server làm bằng chứng output sản xuất. Không serve gốc repo. `noindex, nofollow` và banner xem trước hiện áp dụng mọi trang; noindex không phải cơ chế bảo vệ dữ liệu riêng tư. Preview chỉ bind loopback; chưa bật tunnel hoặc link public.

Kiểm sáu route trực tiếp/reload, URL không tồn tại, menu mobile bằng chuột/bàn phím, skip link, FAQ, nội dung số liệu và layout 375/768/1440. Sau đổi logic tài chính phải kiểm thêm unknown/null và kịch bản; build pass không thay visual review. Lưu lệnh, exit code, commit, ảnh thật và inventory/hash output; không điền pass từ lần chạy cũ. Khi package/lockfile không đổi, có thể dẫn chứng clean-ci đã kiểm trước đó, nêu rõ không phải lần cài mới.

## Nguồn nội dung và dữ liệu

| Phần | Nguồn hiện tại | Khi cập nhật |
| --- | --- | --- |
| Dự án, hoạt động, giai đoạn, nhóm tổng quát | `src/data/campaign.ts`, các trang `.astro` | Giai đoạn là dự kiến; ngày/trạng thái/người liên hệ chỉ đổi từ xác nhận thật và quyền công bố |
| Giá và số lượng sản phẩm | `PRODUCTS` trong campaign data, `formatProductPrice`/`formatProductQuantity` | Giá là tham khảo đề xuất; plannedQuantity không phải tồn kho. `quantityPrefix` chỉ qualifier, không chứa số thứ hai. C01 có craft30chuồnchuồn/100móckhóa, food quantity null; nguồn gốc trang trí chưa xác nhận |
| Chi phí dự toán | `PLANNED_EXPENSES` | Đối chiếu từng khoản, nguồn, giả định; tổng dẫn xuất qua helper finance |
| Doanh thu giả định | Hai sản phẩm category craft tính qua calculateCraftRevenue; foodPlannedRevenueAssumption là QuantitativeFact; calculateCombinedPlannedRevenue trong `src/lib/finance.ts` | Food4.500.000đ là mục tiêu giả định trang18, chưa phân bổ số lượng từng món. null/undefined phải giữunknown; không tổngPRODUCTS bằng cách bỏ mónnull; không suy thành tiền nhận hoặc cam kết |
| Hiện vật thay chi tiền | `FINANCE_SCENARIOS` | Chỉ trừ phần chi tiền được thay, không cộng vào doanh thu tiền mặt. Kiểm lại mô tả và phạm vi khoản được thay khi đổi giá trị |
| Thu chi/hiện vật thực tế | `ACTUAL_FINANCE`; overview cũ còn `FINANCE_OVERVIEW` | Chưa có nguồn thì null. Trước bổ sung actual cần task thống nhất overview trang chủ và trang Minh bạch, không chỉ điền một object rồi coi đã công bố đúng |
| Liên hệ | `OFFICIAL_CONTACT`, copy trang Đồng hành và các CTA | Hiện null/unconfirmed, không có kênh tiếp nhận. Điền contact không tự bật form/QR/đơn/tiền; cần task và review kênh thật đã được phép |
| Tiêu đề và description | Props từng trang, `src/layouts/Layout.astro` | Giữ title riêng, tên dự án một lần; noindex chưa được bỏ trong preview |
| Ảnh/minh họa | `PlaceholderIllustration.astro`, `public/images/logo_option5_horizontal.png`, `public/images/logo_lang_kinh_2048.png` | Minh họa có nhãn, không phải ảnh sự kiện. Asset thật cần nguồn, alt, phạm vi quyền dùng và bằng chứng chủ dự án duyệt |

`QuantitativeFact` giữ value/kind/unit/verification/sourceRef/updatedAt/publicApproval. Số biết chính xác bằng0 khác dữ liệu chưa biết null. Dữ liệu planned hiện có thể hiển thị vì được ghi rõ là đề xuất chưa xác nhận; metadata pending không chứng minh quyền đăng actual hoặc ảnh cá nhân. Không giả định renderer tự kiểm quyền công bố mọi trường: người vận hành phải đối chiếu nguồn và giao task bổ sung điều kiện hiển thị khi cần trước khi thêm dữ liệu thật.

Tiền cuối kỳ cần tiền đầu kỳ + thu thực nhận − chi thực trả; nếu thiếu tiền đầu kỳ, không tự coi0. Tách tiền mặt/hiện vật, doanh thu/số dư, tồn kho/đơn/tiền nhận. Hiện vật chưa giao và số lượng hàng chưa thanh toán không phải kết quả tiền. Với snapshotPDF mớiC01:19khoảnchi4.935.000đ; craft2.200.000đ cộngfoodgiảđịnh4.500.000đ thành6.700.000đ; sốdưgiảđịnh1.765.000đ. Các gói hiện vật chưa đối chiếu khôngrender nhưđãchốt. Khi đổi proposal, kiểm tất cả con số và mô tả phụ thuộc, gồm `FINANCE_OVERVIEW` và FAQ; không chỉ cập nhật kết quả tổng.

## Tài nguyên, output và quyền công bố

Hồ sơ DOCX, chứng từ thô, tên/ảnh chưa được phép, evidence review, secrets và dependency không được nằm trong public hoặc bundle. `.gitignore` giữ nguồn DOCX ngoài Git. `public/images/README.md` là ghi chú tài nguyên; hook build hiện loại ghi chú này khỏi output. Chỉ thêm asset được duyệt, kiểm `dist` sau build thật và xác minh không nhập nhầm tài liệu nguồn. Không dùng ảnh AI để giả hoạt động đã diễn ra.

GitHub hiện là repo private để lưu code/review; push code không phát hành website hoặc xác nhận quyền đăng nội dung thật. Khi upload nội dung/evidence đã biên tập, kiểm không có credentials, thông tin riêng của trẻ hoặc dữ liệu nhạy cảm.

## Chuẩn bị phát hành sau khi được duyệt

R04 nghiệm thu preview trước; RC01 nghiệm thu bản cập nhật nội dung/logo. T05 chỉ mở sau chủ dự án duyệt public và chọn hosting/domain. Gói phát hành chỉ là output `dist`, gồm sáu trang và `404.html` cùng CSS/favicon. Cấu hình host phải phục vụ đường dẫn thư mục tĩnh/direct reload và trả HTTP404 với trang404 cho URL không tồn tại; không dùng fallback trả200 cho mọi URL. Quy tắc mapping thực tế phải kiểm lại trên host đã chọn.

Trước T05 cần xác nhận trạng thái/ngày dự án, quyền ảnh/nội dung, contact và nhu cầu thật nếu muốn bật kênh tiếp nhận. Ảnh placeholder được xử lý theo quyết định public của chủ dự án, không tự gọi là ảnh thật. Canonical/OG URL chỉ điền từ domain thật. Đổi robots/indexing, banner preview hoặc hành động nhận hỗ trợ thuộc task phát hành riêng. Sau phát hành kiểm URL/HTTPS, direct reload,404, asset, menu, metadata và dữ liệu đúng bản đã duyệt; không ghi đã kiểm public khi chỉ xem loopback.
