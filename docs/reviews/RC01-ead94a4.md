# RC01 — ead94a4 — PASS cho preview cập nhật materials

Base `113069636c653cb7bbb255c33d681cbbbd940b19`; candidate `7e16cf3c73b5d450247240dab5da8210c450c4d4`; final app **`ead94a482e590cf1c5ef4eb1e0829c99e30d378c`**, nhánh `task/c01-materials`. Codex review diff đúng base..final; Antigravity là người sửa toàn bộ app/assets/tests. Hai điểm trong [review candidate](RC01-7e16cf3.md) đã sửa: chú thích tài chính14px và số lượng thủ công dẫn xuất từ PRODUCTS. Diff candidate..final chỉ trang Minh bạch,5thêm/2xóa.

## Kết quả

- Hai PNG logo khớp SHA256 tệp người dùng cung cấp; logo ngang vào header/footer/nhóm, logo vuông làm favicon. CSS contain giữ tỷ lệ hình trong box; alt và link home giữ tên accessible.
- Bảy sản phẩm gồm hai món thủ công và năm mức giá đồ ăn. Danh mục túi cũ không còn trong nội dung HTML; minh họa vẫn có nhãn, chưa phải ảnh sản phẩm/sự kiện thật. Năm món ăn có plannedQuantity null, tất cả actualStock null/saleStatus unconfirmed.
- 19khoản chi đúng tên, số tiền và trang nguồn24/25/26; tổng4.935.000đ. Thủ công giả định2.200.000đ cộng mục tiêu đồ ăn giả định4.500.000đ (trang18, metadata planned/unverified/pending) =6.700.000đ; số dư cơ sở giả định1.765.000đ. Food assumption chưa biết trảnull, không âm thầm bỏ SKU thiếu số lượng. Hiện vật chưa đối chiếu không được render như kịch bản đã chốt. Actual/contact vẫnnull; không form/QR/nhận tiền hoặc cam kết100% doanh thu mua quà.
- Không thay stack, dependency, package hoặc lockfile. Không đưa nguồnPDF/DOCX, dữ liệu riêng, ảnh trẻ hoặc contact giả vào dist/Git thay đổi C01. Routing sáu trang và404, menu/skiplink/keyboard, metadata noindex,nofollow và loopback được giữ.

## Bằng chứng độc lập

| Kiểm | Kết quả | Bằng chứng |
| --- | --- | --- |
| npm run check | exit0,44files,0errors/0warnings/0hints | [raw](../evidence/C01/reviewer-ead94a4-check.log), [commands](../evidence/C01/reviewer-checks-ead94a4.json) |
| node --test tests/finance.test.mjs | exit0,18/18 | [raw](../evidence/C01/reviewer-ead94a4-test.log) |
| npm run build | exit0,7pages | [raw](../evidence/C01/reviewer-ead94a4-build.log) |
| Đối chiếu nguồn và logic | 6/6 | [oracle/review](../evidence/C01/reviewer-finance-ead94a4.json) |
| Browser | **655/655**,7routes×375/768/1440, canonical direct/reload, anchors/internal links, menu/Tab/Escape/select/resize, skiplink, FAQ, logo/fonts/contrast/overflow, activefavicon, noerrors/broken/externalrequests | [JSON](../evidence/C01/reviewer-browser-ead94a4.json) |
| Bundle/assets/source boundaries | 38/38 | [audit](../evidence/C01/reviewer-audit-ead94a4.json) |
| Dist ổn định sau rebuild | 17/17hash không đổi, app committed clean | [commands/inventory](../evidence/C01/reviewer-checks-ead94a4.json) |
| HTTP body khớp dist | 17/17, gồm7HTML/7CSS/SVG+2PNG; unknownroute404 | [serve](../evidence/C01/reviewer-serve-ead94a4.json) |
| Visual | Đã xem12full-page Home/Sản phẩm/Minh bạch/Nhóm ở375/768/1440 và menu375 tại finalSHA | 13PNG reviewer-ead94a4 trong [evidence](../evidence/C01/) |

Node24.19.0/npm11.17.0/Astro7.3.5; Chrome154.0.8037.93 headless,DPR1/defaultzoom, không touch emulation. Preview127.0.0.1:4321/PID2888. Package/lock hash không đổi so với T04, dùng nền cài từ lockfile đã kiểm trước; không claim một lần npm ci mới C01. git diff --check base..final exit0. Kiểm contrast dựa computed colors cho text hiển thị, không phải chứng nhận đầy đủ WCAG hoặc audit bảo mật/hiệu năng.

## Những lần công cụ kiểm cần sửa

Giữ [browser candidate](../evidence/C01/reviewer-browser-7e16cf3.json):629/652đạt;23flags do checker bỏ qua object-fit contain, kỳ vọng200 cho link tự trỏ404 và bỏ qua favicon304. Sửa tiêu chí đúng, không đổi app để né flags; final655đạt bao gồm3check chữ14px mới. Hai lỗi app thực sự được sửa theo RC01 và bàn giao SHA mới.

Reviewer serve ban đầu gọi native fetch Response.status như hàm gây TypeError; đã sửa thành thuộc tính. Lần tiếp theo tự thêm trailing slash cho route cấu hình never, tạo5flags404; giữ [JSON đầu](../evidence/C01/reviewer-serve-ead94a4-initial.json). Sửa mapping theo sáu route canonical đã đặc tả, final17bodieskhớp. Không claim trailing-slash URL đạt; routing/redirect trên host public cần task phát hành riêng. Worker cũng sửa harness cache304 và selector menu sai, không coi mọi lần chụp ban đầu là đạt.

## Giới hạn và bước tiếp theo

Hồ sơ mới vẫn là đề xuất, phụ lục xác nhận Mái ấm còn chờ xác nhận. Cơ cấu bán đồ ăn, phạm vi tài trợ hiện vật, lịch/thời lượng, quyền ảnh/sản phẩm và contact chưa chốt. Không đưa số người/chỉ tiêu học phần thành thành tích. [Đối chiếu nguồn](../materials-intake.md) giữ danh sách mâu thuẫn.

**C01 DONE; RC01 PASS cho bản preview.** T05 chưa giao; chưa deploy public hoặc bỏ noindex. Worker HOLD sau bàn giao, duy trì loopback. GitHub private là nơi lưu code/review, không thay thế quyền phát hành website.
