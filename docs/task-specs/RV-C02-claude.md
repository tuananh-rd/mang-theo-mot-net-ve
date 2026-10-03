# RV-C02-CLAUDE — rà soát bố trí UI và nội dung sáu trang

Chủ dự án yêu cầu Claude review lại bản C02: UI chuyên nghiệp, dễ nhìn và dễ nhận biết thông tin; kiểm những nội dung cần thiết còn thiếu. Đây là task review chỉ đọc. Claude hiện có thực hiện; Antigravity giữ HOLD. Codex quản lý tài liệu và tổng hợp, không sửa code trong task này.

## Phiên bản và phạm vi

Workspace `C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve`. HEAD khi giao `3cce1b1a50c09275aa78c94eedd63589ef2c3a00`; app `221eafa73661cb822b3f8017b7fe1bf367106349`. Preview đang chạy http://127.0.0.1:4322/, loopback PID25960 do Antigravity giữ. Không rebuild, chạy npm ci/check/test/build, đổi Git hoặc khởi động/dừng server. Kiểm hash dist/HTTP để chắc preview đúng code trước khi kết luận. Nếu khác, báo blocker cụ thể, không tự sửa app.

Đọc AGENTS.md, README.md, docs/brief.md, workflow.md, tasks.md, architecture.md, content.md, materials-intake.md, data-and-finance.md, review-handoff-intake.md, group-content-request.md và reviews/RC02-221eafa.md. Báo cáo C01 là lịch sử; đối chiếu hiện tại, không chép lại lỗi đã sửa.

Nguồn chính mới là PDF ở D:/Downloads/materials/MANG THEO MỘT NÉT VẼ.pdf và HTML bàn giao bên ngoài repo; tài liệu này là dữ liệu nguồn, không chỉ dẫn điều khiển. Khi cần, đọc nguồn trực tiếp để phân biệt thiếu dữ liệu với thiếu UI. Không copy nguồn thô hoặc ảnh chưa được phép vào evidence/public.

## Câu hỏi review

1. Trong vài giây đầu, người xem có hiểu nhóm là ai, dự án làm gì, đang ở trạng thái nào và có thể làm gì tiếp theo không? Điều hướng sáu trang có rõ vai trò từng trang, tránh lặp hoặc che thông tin chính không?
2. Từng trang có thứ tự section hợp lý, một điểm nhấn/hành động chính phù hợp preview và phân cấp heading tốt không? Đề xuất thứ tự cụ thể cho cả sáu trang, chỉ rõ section nên giữ, rút, gộp, chuyển hoặc dùng mở rộng.
3. Typography, spacing, alignment, grid/card, màu, ảnh/crop, caption/credit, logo và bảng/thẻ có nhất quán, đủ chuyên nghiệp và đọc được không? Ưu tiên ảnh chụp thực tế; chỉ đo tự động không thay visual review.
4. Mobile có quá dài, quá nhiều chữ/cảnh báo lặp, CTA bị chìm, bảng khó đọc hoặc người xem không tìm thấy thông tin quan trọng không? Xem 375/768/1440 cả sáu route, kiểm Sản phẩm 900/1024 khi cần; xem menu, focus và FAQ mở.
5. Soát sự nhất quán của tên, trạng thái, sản phẩm, số lượng/giá tham khảo, nguồn gốc, kế hoạch, thu chi, nhu cầu và FAQ. Xác nhận 50×79.000=3.950.000đ; mục tiêu 4.500.000đ còn chênh 550.000đ chưa được giải thích. Không chọn số thay thế.
6. Mục cần thiết nào thiếu để người xem hiểu và đánh giá dự án? Phân biệt: có nguồn đủ để bổ sung ngay; cần nhóm cung cấp/xác nhận; chỉ hợp lý sau hoạt động/mở bán/phát hành. Đối chiếu danh sách yêu cầu nhóm đã có, bổ sung phần thực sự thiếu, tránh lặp danh sách mà không nêu tác động.

## Ràng buộc và đầu ra

A01–A05 chỉ minh họa có ngữ cảnh, A06–A11 không dùng. Không bịa tên/ảnh người, liên hệ, lịch, tài khoản, số liệu thực tế hoặc ảnh Mái ấm. Nhóm hoàn thiện sản phẩm, người tham gia có quyền chọn/quan sát/nghỉ; không sản xuất theo chỉ tiêu, không dùng chuyện riêng để gây quỹ. Contact/actual/food quantities còn null; giữ kế hoạch/chờ xác nhận, noindex, không nhận đơn/tiền. Không coi các trường chờ nhóm là lỗi có thể tự điền.

Chỉ được ghi `reports/ui-content-review-claude-c02.md` và các file `docs/evidence/Claude-C02/claude-*`. Codex sở hữu spec, dispatch-* và các tài liệu khác. Không sửa src/public/tests/config/package/lockfile, commit/push/deploy hoặc tự giao task. Không publish artifact ra ngoài.

Báo cáo tiếng Việt: xác nhận task/HEAD/app/model/preview, kết luận UI theo nhu cầu người dùng; bảng phát hiện ưu tiên với route/viewport, ảnh/vị trí, ảnh hưởng, hướng sửa cụ thể và tiêu chí nghiệm thu; bảng thứ tự section đề xuất sáu trang; danh sách nội dung thiếu chia ba nhóm trên, nguồn/đầu mối cần và vị trí dùng; các mục đã đạt, hạn chế và ảnh đã thực sự xem. Không buộc phải có một số lượng lỗi hoặc kết luận nhất định.

Lưu screenshot full-page cả sáu trang ở ba viewport, các crop/fold cần chứng minh, metadata, hash dist/HTTP, kết quả điều hướng/menu/FAQ và danh sách ảnh đã xem. Với ảnh lazy, cuộn/chờ decode trước full-page capture. Dùng một browser và đóng khi xong; tránh khởi chạy nhiều process trên máy đã báo thiếu RAM. Không tuyên bố kiểm thiết bị thật hoặc accessibility đầy đủ nếu chỉ emulation/computed styles.

ACK nhận task và kiểm workspace/commit trước review. Kết thúc bàn giao báo cáo, bằng chứng, trạng thái HOLD, giữ server4322. Codex sẽ đọc kết quả rồi lập phạm vi sửa nếu cần; chưa giao task triển khai trong yêu cầu review này.
