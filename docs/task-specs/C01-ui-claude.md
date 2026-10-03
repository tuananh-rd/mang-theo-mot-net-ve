# C01-UI — sửa theo review Claude ngày 03/10/2026

Owner: Antigravity. Brain: Codex. Đây là vòng sửa C01 đã được chủ dự án yêu cầu, không mở T05/public.
Baseline: a4e0aa879525d366335630eaf329633c35c6bb80; app ead94a482e590cf1c5ef4eb1e0829c99e30d378c. Giữ nhánh task/c01-materials và tất cả file review/evidence chưa commit. Chỉ commit file ứng dụng được giao; Codex commit docs sau review. Không reset/clean/revert, không agent thứ hai, không push/deploy.

Đọc AGENTS.md, brief/workflow/tasks, reports/ui-review-claude-c01.md, docs/materials-intake.md. Giữ stack, palette, route, noindex/nofollow, null actual/contact, giá tham khảo và số tài chính hiện tại.

## Quyết định triển khai

- M1: header/footer dùng biểu tượng vuông logo_lang_kinh_2048.png (32–40px) cùng tên HTML Lăng Kính >=16px, subtitle dự án >=14px. Canh trái; giữ logo ngang ở trang nhóm nếu đang đọc được. Không sửa ảnh gốc hoặc chữ trong logo. Header 375px không đè menu; ảnh đúng tỷ lệ; accessible name chính xác.
- M2: bảng sản phẩm dùng layout thẻ hiện có cho <=1023px; >=1024px bảng đầy đủ. Mọi trường, nhất là trạng thái bán, đều đọc được ở 375/768/900/1024/1440; không cần cuộn ngang ẩn.
- L1: bỏ pill nhãn phân loại dự toán, dùng chữ thường dễ đọc/wrap tự nhiên, không gây tràn hoặc tăng cột ép các cột khác.
- L2: công thức giữ nguyên tên riêng Lăng Kính; chỉ hạ chữ cái đầu của tên khi đặt trong câu. Dẫn xuất số lượng/tên từ dữ liệu, không hardcode tổng hoặc lặp nguồn dữ liệu.
- L3: ghi chú Bánh kẹo/quà: Kế hoạch tổng, chưa phân bổ theo người nhận (trang 25). Ghi chú truyền thông trực tiếp nêu khoản dự kiến theo đề xuất trang 26, chưa xác nhận triển khai; không đưa hướng dẫn nội bộ hay khẳng định thiết bị đã mượn vào hàng này. Không đổi nhãn/số tiền/trang nguồn.
- L4: thu gọn 19 khoản dự toán ở mobile: tên + số tiền dễ đọc, phép tính/nguồn/ghi chú ở dòng phụ, giảm padding/lặp nhãn; giữ đủ 19 khoản và thông tin planned, không giấu nguồn hoặc thu nhỏ chữ dưới14px. Mục tiêu chiều cao trang Minh bạch 375 giảm ít nhất15% so với12366px, không hy sinh độ đọc được. Không cần thêm accordion hoặc tính năng mới.
- L5: phân biệt ba minh họa nem bằng biến thể SVG/CSS nhỏ, vẫn ghi minh họa chưa phải ảnh thật; không tạo ảnh sự kiện/sản phẩm giả. Mobile tên và giá xếp dọc để tên không bị ép bởi giá.
- L6: giảm cảnh báo lặp trên thẻ đồ ăn, số lượng chưa biết ghi Chưa xác định bằng màu secondary, giữ trạng thái bán đầy đủ trong bảng/thẻ tổng hợp và ghi chú đầu trang. Không che giá tham khảo/chưa mở bán hoặc đổi null thành0.
- L7: tạo favicon PNG32px và apple-touch180px từ logo vuông được cung cấp, chỉ resize giữ tỷ lệ/transparency; ghi nguồn và dimensions trong handoff. Giữ ảnh gốc. Được phép tạo phái sinh này theo task. Không thêm dependency runtime chỉ để resize.
- L8: giữ chữ HTML Lăng Kính theo tên dự án, giữ ảnh gốc nguyên vẹn; khác biệt hoa/thường trong wordmark là mục cần chủ dự án chốt, không chặn sửa UI và không sửa lại wordmark.

## File/phạm vi
src/components/Header.astro, Footer.astro, PlaceholderIllustration.astro, ProductCard.astro (nếu cần áp dụng tên/giá/trạng thái đồng nhất); src/pages/index.astro, san-pham.astro, minh-bach.astro; src/data/campaign.ts (chỉ tên dùng trong câu/ghi chú nếu cần, không thay số); src/layouts/Layout.astro; public/images/ chỉ thêm favicon phái sinh. Cho phép helper trình bày trong src/lib nếu cần, không đổi kiến trúc/dependencies/config. Không sửa docs hoặc reports của Brain/Claude.

## Nghiệm thu / bàn giao
ACK task+baseline+model+phạm vi trước sửa. Check/test/build có command/exit thật; tests hiện hữu tài chính không hồi quy, không viết tests nội dung tĩnh.
Preview loopback với SHA thật, 6routes+404; menu/tab/Escape/focus/skip link; screenshot full-page Home/Sản phẩm/Minh bạch 375/768/1440 và menu375, thêm Sản phẩm900/1024 cho breakpoint. Tự xem ảnh và báo phần chưa xem. Kiểm chữ>=14, contrast, không overflow, logo/source assethash, tiền planned4935000/revenue6700000/balance1765000, actual/contactnull, nội bộ không xuất hiện public. Favicon32/180 load đúng.
Không ghi đè evidence C01 hoặc Claude-C01: viết log/script/ảnh/handoff ngoài repo trong thư mục brain Antigravity handoff-c01-ui; Codex sẽ lưu bản được nghiệm thu. Commit application thật với danh sách file cụ thể, không git add -A; không đưa docs/source/node_modules/dist/raw PDF/secrets vào commit. Báo final SHA, diff base..final, kiểm tra, previewPID/URL, đường dẫn report/ảnh, M1/M2/L1-L8 mapping; HOLD sau bàn giao, giữ preview. Không public hoặc push.