# Khảo sát bổ sung qua Orca — 02/10/2026

Codex tiếp nhận phiên Brain; executable `orca`, app/runtime 1.4.217. Đã đọc guide và `references/browser.md` đúng phiên bản. Khảo sát nguồn độc lập, không triển khai lại T00 hoặc đổi scope T01.

- URL yêu cầu: https://sharethemeal.org/fr. Tab thực tế chuyển tới **https://sharethemeal.org/en-us**; không kết luận đã quan sát bản tiếng Pháp.
- Web open vẫn trả 403. Browser Orca tab `7ab0c813-9bd7-4e79-8150-0d04dea0b914` sau lần đầu đóng kết nối đã trả snapshot, eval và screenshot thực. Không restart hoặc mở worker khác.
- Chromium user agent quan sát: Chrome/150.0.7871.250 trên Windows. Desktop yêu cầu và `innerWidth/innerHeight` đo được 1440×1000. Mobile đo được 375×812; visualViewport scale=1, width≈375.33; deviceScaleFactor yêu cầu 1, DPR đo≈1.00000003. Đây là browser emulation, không kiểm trên điện thoại thật.

## Bằng chứng dùng được

- [Desktop viewport](source-orca-desktop-1440-viewport.png): header ngang, logo trái, navigation và CTA phải; hero chữ trái/hình phải, biên ảnh cong; nền trắng, CTA vàng, section đầu có khoảng thở rộng.
- [Mobile viewport](source-orca-mobile-375-viewport.png): header logo/CTA/menu; ảnh hero trước rồi chữ căn giữa; không tràn ngang trong viewport đo, scrollWidth=375.
- [Menu mobile sau click](source-orca-mobile-menu-375.png): thao tác click từ ref snapshot mới; khi xem ảnh thấy frame trong transition với chữ mờ phủ hero. Không coi ảnh này là menu mở đã ổn định; chưa kiểm toàn bộ flow menu hoặc accessibility trang nguồn.
- Eval desktop: H1 computed Open Sans 700, 48px/54px; H2 đầu 36px/44px; body 16px/24px; chữ heading rgb(33,37,41), nền body trắng. Mobile H1 32px/40px; nav measured height 64px. Đây là số đo tại lần render cụ thể, không khẳng định mọi breakpoint/font asset đã kiểm.

## Bằng chứng có lỗi và giới hạn

`full-screenshot` đã trả ảnh thật nhưng **ghép lặp phần đầu**, phát hiện khi Codex xem ảnh desktop. Giữ hai file `source-orca-desktop-1440.png`, `source-orca-mobile-375.png` để truy vết; không dùng làm bằng chứng toàn trang hoặc đo thứ tự/chiều cao section. Snapshot DOM cho thấy nội dung bên dưới tồn tại nhưng không thay thế visual review từng phần.

Chưa đo đầy đủ card/button/palette/spacing và mọi section. Chưa kiểm mobile touch thực tế, animation hoặc mọi hành vi menu. Không sao chép ảnh/nhận diện/số liệu/CTA nhận tiền của nguồn vào website dự án. Ảnh khảo sát chỉ nằm trong docs/evidence, ngoài public và bundle.

## Ảnh hưởng tới T01

Giữ nguyên đặc tả đề xuất đang được worker triển khai. Hero/mobile đề xuất khác thứ tự nguồn; đây là lựa chọn riêng cho trang mẫu, không claim sao chép chính xác ShareTheMeal. R01 kiểm đặc tả hiện hành và báo khác biệt nguồn; chủ dự án duyệt hướng UI sau review rồi mới mở T02. Không tự thêm campaign grid, bộ đếm, newsletter, giỏ hàng hoặc thanh toán từ nguồn tham khảo.
