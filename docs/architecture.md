# Kiến trúc — quyết định T00

Ngày khảo sát: 02/10/2026. Chủ tài liệu: Codex. Người triển khai: Antigravity.

## Hiện trạng đã kiểm tra

Repo chỉ có AGENTS.md, README.md, docs/ và public/images/README.md; không có .git, package.json, src/, lockfile, ứng dụng hoặc ảnh website. `git status --short --branch` và `git rev-parse HEAD` đều trả `fatal: not a git repository (or any of the parent directories): .git`. Không có commit xuất phát để ghi SHA.

Máy hiện có Node 24.19.0, npm 11.17.0, Git 2.55.0.windows.5. Chưa kiểm chứng cài dependency, build hoặc runtime. Chưa chọn hosting/tên miền.

## Quyết định

Chọn Astro ở chế độ xuất tĩnh, TypeScript strict, CSS thuần và npm với package-lock.json. Sáu trang nội dung không cần React, SPA router, backend hoặc cơ sở dữ liệu. HTML được build trước, menu mobile là phần tương tác nhỏ. Không thêm Tailwind, UI kit, thư viện animation, CMS hoặc analytics trong T01.

Tài liệu chính thức đã kiểm tra ngày khảo sát: [cài Astro](https://docs.astro.build/en/install-and-setup/) và [pages/routing](https://docs.astro.build/en/basics/astro-pages/). Trang cài đặt yêu cầu Node >=22.12.0; Node hiện có đáp ứng ngưỡng này. Antigravity xác minh phiên bản stable và engines thực tế khi cài, ghi phiên bản trong bàn giao, pin qua lockfile; không tự chọn prerelease hay đổi stack khi gặp lỗi.

## Cấu trúc dự kiến

| Vùng | Trách nhiệm |
| --- | --- |
| src/pages/ | Sáu route, 404; T01 chỉ hoàn chỉnh trang chủ và shell cho các route còn lại |
| src/layouts/ | HTML tiếng Việt, metadata preview, header/main/footer |
| src/components/ | Header, mobile navigation, hero, section heading, activity/product card, trạng thái thiếu dữ liệu |
| src/styles/ | Tokens, global, responsive; không cần hệ design tổng quát lớn |
| src/data/ | Bản nội dung được chọn để hiển thị, có kiểu dữ liệu và nguồn; không import hồ sơ gốc |
| src/assets/ | Minh họa do nhóm triển khai tự tạo và ảnh đã được phép, nếu có |
| public/ | Chỉ tài nguyên public được duyệt; README ảnh không đưa vào output |
| docs/ | Codex sở hữu đặc tả, task, review, registry quyền ảnh và bằng chứng |
| dist/ | Output build, không commit; chỉ output này là ứng viên phát hành |

## Routing và tiến độ

| URL | Nội dung hoàn chỉnh về sau | T01 |
| --- | --- | --- |
| / | Một dự án, hoạt động, sản phẩm, minh bạch, nhóm và đồng hành | Trang mẫu hoàn chỉnh theo ui-reference |
| /du-an/mang-theo-mot-net-ve | Câu chuyện, bốn giai đoạn dự kiến, cập nhật được xác nhận | Shell có tiêu đề + thông báo preview + quay về trang chủ |
| /san-pham | Ba dòng hàng, nguồn gốc, giá/trạng thái | Shell tương tự |
| /minh-bach | Dự toán tách thu chi thực tế, chứng từ public đã biên tập | Shell tương tự |
| /ve-nhom | Giới thiệu và thành viên đã duyệt quyền công bố | Shell tương tự |
| /dong-hanh | Các cách hỗ trợ, kênh thật đủ cấu hình | Shell tương tự, không form/contact giả |

URL dùng thống nhất không slash cuối; Antigravity xử lý đường dẫn nội bộ theo cấu hình Astro. T01 kiểm direct navigation và reload mỗi route; không dùng link chết để giả routing. Route lạ trả trang 404 với link về trang chủ. T02/T03 mở rộng nội dung sau R01 và chủ dự án duyệt hướng UI.

## Hợp đồng dữ liệu

- QuantitativeFact: value (số nguyên VND hoặc số lượng, có thể null), unit, kind planned/actual, verification unverified/confirmed, sourceRef, updatedAt (null nếu chưa có ngày thật), publicApproval pending/approved. Unknown luôn là null, không tự đổi thành 0.
- Project: slug cố định, title, summary, location dự kiến, executionStatus unknown lúc đầu; activities và plannedStages. Không suy ra đang diễn ra/đã hoàn thành từ tháng trong hồ sơ. Không tạo project array để lấp campaign grid.
- Product: id, name, description, referencePrice (Fact), plannedQuantity (Fact), actualStock null, saleStatus unconfirmed, originText, originVerification, assetId null. Không suy ra còn hàng từ số lượng kế hoạch. Giá 40.000/55.000/75.000đ chỉ ghi giá tham khảo trong đề xuất.
- Asset: path, alt, source, permissionStatus, permittedUse, approvalEvidence. Ảnh thật chỉ render khi quyền và mục đích public đã được duyệt. Preview dùng minh họa ghi nhãn, không tạo ảnh sự kiện hoặc chân dung.
- Contact: confirmed channel hoặc null; canReceiveOrders/canReceiveMoney mặc định false. Thiếu kênh thật thì chỉ hiển thị thông tin đang cập nhật, không đặt nút có hành vi giả.
- Update/Team/Evidence: chỉ bản chọn lọc được duyệt mới render public; không suy ra quyền công bố tên/ảnh từ việc có trong DOCX.
- Finance: plannedBudget, hypotheticalScenarios, actualCashLedger null, actualInKindLedger null, actualInventory null, actualHandover null. Chưa có báo cáo khác với báo cáo ghi toàn số 0. Actual phải có chứng cứ, đối soát và quyền public.

`sourceRef` có thể là mã `proposal:section-12`, không phải href tải DOCX. Ngày 02/10/2026 là ngày khảo sát tài liệu, không phải ngày xác minh số liệu dự án. Nội dung T01 là bản nháp preview; publicApproval không được tự chuyển approved.

## Ràng buộc tài chính

Dự toán 3.120.000đ. Kịch bản bán đủ: 2.900.000đ; số dư không tài trợ -220.000đ. Nếu hiện vật thay chi tiền 500.000đ: số dư giả định 280.000đ; thay 1.120.000đ: 900.000đ. Chưa có cam kết tài trợ hoặc giao dịch thực tế. Thuật toán sau này: tiền cuối kỳ = tiền đầu kỳ + thu bán hàng thực nhận + tài trợ tiền thực nhận - chi tiền thực trả. Hiện vật, tồn kho, đơn chưa thanh toán và bàn giao ghi riêng. Không có progress bar hoặc tuyên bố 100% doanh thu mua quà.

## Git và phạm vi riêng tư

Antigravity khởi tạo Git trong folder hiện tại nếu vẫn chưa có, tạo nhánh main và commit baseline chỉ gồm tài liệu đã bàn giao + cấu hình ignore do Antigravity tạo. Ghi SHA baseline B0 thật trước khi triển khai ứng dụng; sau đó tạo nhánh task/t01-home-shell từ B0. Không chạy scaffold đè folder đang có. Nếu Git đã xuất hiện trước lúc nhận task, báo HEAD/trạng thái và chờ Codex điều chỉnh baseline; không reset hay ghi đè thay đổi khác.

.gitignore do Antigravity sở hữu: bỏ node_modules/, dist/, .astro/, .env và secrets, profile/log tạm, docs/source/ và chứng từ thô chưa biên tập. Hồ sơ DOCX giữ nguyên trên máy; không đưa vào commit baseline hoặc public. Không thêm remote/push/deploy trong T01. Nếu thiếu Git identity, báo lỗi; không tự bịa tên/email.

Đường build chỉ đọc src/ và tài nguyên public đã chọn. Không copy docs/, DOCX, source extraction, screenshot khảo sát hoặc public/images/README.md vào dist. Không glob import docs hay serve project root làm website. Chưa bật form, QR, thanh toán, đặt hàng hoặc thu thập thông tin người dùng. Preview local chỉ bind loopback; robots noindex/nofollow trên tất cả trang preview. Noindex không thay thế quyền riêng tư; không dùng public preview link cho tài liệu gốc.

## Review và phát hành

R01 review SHA baseline..SHA bàn giao trên nhánh task, build/check, duyệt UI thực tế ở 375/768/1440, kiểm navigation bàn phím và audit dist. Build pass không tự suy ra UI PASS. Antigravity bàn giao URL local và screenshot đủ trang, không chỉ hero. Codex không sửa code; CHANGES_REQUIRED chuyển lại Antigravity trong cùng T01. Khi chưa xem được preview hoặc không xác định được commit, R01 BLOCKED với giới hạn cụ thể.

Mốc duyệt hướng UI sau R01 chưa phải duyệt public. Chỉ sau preview đầy đủ, nội dung/ảnh/liên hệ thật được xác nhận, R04 và chủ dự án duyệt public mới giao T05. Hosting chọn ở mốc đó.
