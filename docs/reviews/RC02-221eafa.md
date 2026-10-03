# RC02 — PASS cho bản xem trước local

Ngày 03/10/2026. Codex review commit ứng dụng `221eafa73661cb822b3f8017b7fe1bf367106349` do Antigravity bàn giao, so với baseline `5cdc624f1bbe24d791e6386850428a3c60cb8c46`, nhánh `task/c02-images-content`. Đã đọc diff đủ 16 file, đối chiếu 44 đầu việc của HTML với sáu trang hiện hành và xem preview thực tế. PASS áp dụng cho phần C02 có đủ dữ liệu, không xác nhận lịch, nhân sự, mẫu bán, số liệu thực tế hoặc quyền phát hành công khai.

Preview: http://127.0.0.1:4322/ — chỉ listener `127.0.0.1`, PID 25960. Worker HOLD; không giao T05, không deploy. [Danh sách dữ liệu và ảnh nhóm cần gửi](../group-content-request.md) ghi rõ thông tin, quy cách và vị trí sử dụng. [Đối chiếu từng mục](../review-handoff-intake.md) giữ các việc chưa thể chốt.

## Những phần đã hoàn thành

- A01–A05 được trích xuất từ HTML ngoài repo, chuyển thành năm WebP local, tổng 388.358 byte. Trang chủ và Dự án dùng cùng ảnh họa cụ và bốn góc hoạt động; Sản phẩm dùng A05 cho bánh su kem. Caption, credit và link nguồn hiện sát ảnh, alt mô tả đúng chủ thể; hero ưu tiên tải, ảnh phía dưới tải khi cần. Không gọi ảnh stock là người, mẫu bán, chuẩn bị hoặc hoạt động tại Mái ấm.
- Giữ SVG ở chuồn chuồn bán, móc khóa, set đồ ăn và ba combo; giữ logo ở Về nhóm. A06–A11 không được đưa vào assets hoặc bundle; HTML base64, PDF nguồn và ảnh gốc ở ngoài repo/public.
- Minh bạch có mục `#doi-chieu-do-an`: 50 × 79.000đ = 3.950.000đ, mục tiêu trong đề xuất 4.500.000đ, khoản chênh chưa phân bổ 550.000đ. Nguồn trang 12, 18, 24 đã đọc lại, chưa có bảng số lượng × giá từng món giải thích chênh lệch hoặc tránh tính trùng set/combo.
- Phép tính dùng một số set giả định, giá SKU và mục tiêu nguồn; kết quả được dẫn xuất, không lưu thêm tổng/chênh cứng. Hàm giữ `null` khi thiếu dữ liệu, ngân sách kết hợp phải truyền rõ. Test có giá/số lượng thay đổi và đầu vào chưa biết.
- Trang chủ, Dự án và Sản phẩm dẫn tới mục đối chiếu; FAQ Sản phẩm, Minh bạch và Đồng hành thống nhất trạng thái. Bảng/thẻ sản phẩm dùng chung dữ liệu, chuyển sang thẻ dưới 1024px. Về nhóm giữ thông tin đã biết và phần nhân sự chờ xác nhận.
- Giữ 19 khoản dự toán 4.935.000đ, doanh thu cơ sở 6.700.000đ và số dư +1.765.000đ như kịch bản đề xuất. Không chọn 3.950.000đ thay mục tiêu đồ ăn, không gán 50 set vào tồn kho/số phát hành SKU. Actual, contact và số lượng đồ ăn vẫn chưa xác nhận; website chưa nhận đơn/tiền, noindex/nofollow.

## Kiểm tra độc lập tại đúng commit

| Kiểm tra | Kết quả | Bằng chứng trong `docs/evidence/C02` |
| --- | --- | --- |
| `npm.cmd run check` | Exit 0, không errors/warnings/hints | `reviewer-221eafa-check.log` |
| `node --test tests/finance.test.mjs` | Exit 0; 24/24 tests | `reviewer-221eafa-test.log` |
| `npm.cmd run build` | Exit 0; 7 HTML, 24 file dist | `reviewer-221eafa-build.log` |
| Tài chính so với nguồn | 6/6 | `reviewer-finance-221eafa.json` |
| Bundle và phạm vi commit | 38/38 | `reviewer-audit-221eafa.json` |
| File trả về qua HTTP đúng byte dist | 24/24 | `reviewer-serve-221eafa.json` |
| Direct load/reload, 404, skip link, menu bàn phím | 20/20 | `reviewer-navigation.json` |
| Link nội bộ, anchor, FAQ bàn phím, nguồn ngoài | 36/36 | `reviewer-links.json` |
| Ảnh, caption, credits, breakpoint, số liệu đối chiếu, ảnh hạn chế | 66/66 | `reviewer-images.json` |
| Sáu trang + 404 tại 375/768/1440 | 21 captures; không overflow, ảnh tải được, chữ từ 14px | `reviewer-capture.json` và PNG tương ứng |

Build độc lập tạo cùng 24 file và cùng hash với dist trước build và metadata worker; nội dung HTTP cũng khớp. Package/lockfile, hai logo gốc, HTML nguồn và PDF giữ hash. App working tree sạch. Không cài lại dependency vì lockfile không đổi và môi trường cài từ lockfile trước đó vẫn dùng; không báo đã chạy `npm ci` trong C02.

Đã xem 21 ảnh full-page (sáu trang và 404 ở ba kích thước), hai ảnh Sản phẩm 900/1024, menu 375 và focus 1440. Đã xem thêm 12 crop ảnh: A01–A05 ở desktop/mobile, gồm cả hero Dự án; xem hai crop đối chiếu doanh thu worker. Crop giữ bảng màu/cọ, nhạc cụ, bóng và bánh; caption tiếng Việt không bị cắt. Các ảnh khác được lưu và đo tự động, không gọi là đã xem từng crop.

## Giới hạn và ghi chú bằng chứng

Ba console error trong capture là 404 có chủ ý, một tại mỗi viewport; không có request ảnh lỗi hoặc JavaScript runtime error. HTTP 304 ở capture đã cache là hợp lệ; harness navigation riêng kiểm direct/reload với cache tắt. 19 điểm contrast thấp chỉ là dấu chấm trang trí `.mobile-sub-sep` có `aria-hidden=true` ở Minh bạch 375; chữ nội dung không bị đánh dấu. Đây là kiểm tra contrast bằng computed styles, không phải chứng nhận accessibility đầy đủ.

Lần đầu harness links bị lỗi khi Puppeteer trả response `null` cho điều hướng cùng trang tới hash. Đã sửa harness để chuyển qua `about:blank`, chạy lại toàn bộ 36 kiểm tra; không sửa app để né lỗi. Hai screenshot Sản phẩm 900/1024 ban đầu chưa đợi ảnh lazy tải; giữ bản `initial-lazy`, rồi sửa bước chờ decode và chụp lại. Các ảnh cuối đã được xem. Raw capture giữ nguyên các cảnh báo, không lọc bỏ failure.

Worker ban đầu báo 34 PNG; đã yêu cầu sửa số đếm bàn giao thành 33 (23 full-page + 1 menu + 9 crop), giữ ACK và báo cáo sửa. Đã lưu log worker cung cấp; kết luận check/test/build dựa trên raw log và exit code do Codex chạy độc lập. `git diff --check` nêu hai dòng trắng cuối file `src/lib/finance.ts:320`, `tests/finance.test.mjs:465`; không ảnh hưởng hành vi, không tạo commit dọn file.

Link credit được kiểm URL/rel và ngữ cảnh, không tuyên bố từng trang tác giả ngoài mạng đã được tải thành công. [Pexels License](https://www.pexels.com/license/) đã đọc khi tiếp nhận; A06–A11 vẫn chưa xác minh quyền tái sử dụng. Preview mobile là Chrome headless có touch emulation, chưa phải kiểm thiết bị vật lý hay Safari.

## Những việc còn thiếu dữ liệu

Nhóm cần xác nhận trạng thái/lịch và phối hợp Mái ấm; tên, vai trò và ảnh bảy thành viên; ảnh vật tư bốn góc; mẫu chuồn chuồn/móc khóa; khẩu phần thật của set, ba combo và hộp bánh; bảng phân bổ doanh thu giải thích 550.000đ; điều kiện chế biến/mở bán; kênh liên hệ/tiếp nhận; nhu cầu hiện vật; hồ sơ và chứng từ biên tập được phép công bố. Không bổ sung suy đoán để đóng các đầu việc này. Quy cách ảnh, số lượng cần chụp và vị trí dùng nằm trong [danh sách yêu cầu nhóm](../group-content-request.md).

Website đủ để xem local phần đã sửa. Phát hành public và dữ liệu thực tế chưa được duyệt.
