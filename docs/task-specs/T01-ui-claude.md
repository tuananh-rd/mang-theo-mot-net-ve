# T01 — vòng sửa UI theo review Claude

**DONE; R01 PASS** tại `285f695e6c385ee0de6dff30d89c06aa92f46639`. [Review final](../reviews/R01-ui-285f695.md) ghi bằng chứng và quyết định cap visual165px; T02 vẫn chờ duyệt UI mới.

Task ID vẫn **T01**, không mở T02. Worker duy nhất: Antigravity hiện có tại `net-ve-worker`; Brain/spec/reviewer: Codex. Người dùng đã yêu cầu sửa theo Claude ngày 02/10/2026, bao gồm tối ưu mobile; không hỏi lại quyền cho các điều chỉnh này.

Base triển khai: **e6aa96505c4368eca3e0d32a3cf41b1a7910a1db**, nhánh `task/t01-home-shell`; app ở base giống commit R01 cũ c27fea2. B0 gốc không đổi. Giữ report người dùng [ui-review-claude.md](../../reports/ui-review-claude.md) nguyên vẹn. Chỉ code/config/assets/checks thuộc worker; không sửa/stage README, docs, reports. Nếu HEAD/app diff khác base khi nhận, báo Brain trước khi ghi đè.

Workspace: `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`. Orca runtime đã đổi; Brain sẽ gửi tới handle được re-list/đọc xác minh, không gửi handle lịch sử hoặc launch worker khác. Báo ACK với base/branch/app status/model thực và khả năng đọc/sửa/shell.

## Quyết định sửa trong T01

| Nhóm Claude | Yêu cầu triển khai và điều kiện đạt |
| --- | --- |
| B1, U1, L4, R3 | Bỏ nhãn cảnh báo dài lặp trên từng ProductCard, loại hẳn span inline border bị vỡ. Thứ tự: minh họa → tên → giá tham khảo → mô tả/nguồn gốc/ghi chú. Một notice chung section sản phẩm: **“Trạng thái mở bán chưa được xác nhận. Bản xem trước chưa nhận đơn/tiền.”** Không đổi thành “Chưa mở bán” vì dữ liệu thực tế vẫn unknown. Giá tham khảo, nguồn gốc và notes cần thiết vẫn được giữ. |
| U1, U2, R1 | Banner mobile **“Bản xem trước — chờ xác nhận”**, bản dài desktop có thể giữ. Footer một đoạn ngắn giải thích kế hoạch/ảnh minh họa/kênh thật chờ xác nhận, không lặp ba đoạn cảnh báo. Bỏ badge hero trùng banner, hoặc dùng nhãn trung tính không chấm live/role status. Mỗi minh họa vẫn có nhãn “Minh họa…”; hero ghi rõ chưa phải ảnh hoạt động. Không xóa thông tin unknown hay biến dự toán thành thực tế để giảm cảnh báo. |
| T1–T4, C1 | Style trực tiếp p của section-footer-note: 14px, line-height >=1.5, font-style normal. Các price-label/support status/footer/brand phụ >=14px. Chỉ caption minh họa giữ italic; các note khác chữ thường. Muted phải nhạt hơn secondary hoặc bằng secondary nhưng mọi chữ thường >=4.5:1 trên nền render thực. `text-wrap: balance` cho heading/slogan để tránh dòng lẻ khi khả thi. |
| L2, U3 | Mobile dưới 768: card hoạt động/sản phẩm dùng visual **16:9** (ratio đã được component hỗ trợ), SVG contain không bóp méo/cắt chủ thể. Không carousel/hide nội dung. Hero mobile có dải minh họa gọn phía trên chữ (visual cao khoảng 140–180px, caption 14px), bỏ badge trùng, summary rút ngắn nhưng vẫn dự kiến và buổi chơi có lựa chọn. 375×812: H1/slogan và một phần visual, CTA chính trong viewport đầu. Homepage 375 giảm ít nhất 15% so với 10.496px (mục tiêu <=8.920px) bằng layout/copy gọn; không giảm chữ dưới14 hoặc cắt nguyên tắc/nguồn gốc. 320 không tràn, vẫn dễ đọc. |
| L3, L1, U5 | Hero tablet 768–1023 visual max-width khoảng560px, canh giữa; desktop vẫn 2 cột. Section nhóm desktop canh giữa khối ~800px, không bịa nội dung/ảnh phụ. Meta nhóm là dòng/danh sách chữ, không pill giống filter. |
| S1–S3, C2–C3, R2 | Minh bạch badge cách H2 12–16px; ghi chú/nút kết section có nhịp nhất quán. Giảm khoảng hở hero→hoạt động desktop một cách vừa phải. Secondary button có viền rõ hơn hoặc nền trắng trên kem; vẫn focus/hover rõ. Chênh lệch giả định -220.000đ dùng màu trung tính, giữ nhãn giả định. Support grid tablet có2cột/desktop3/mobile1. |
| B2, E2 | Active path đúng tất cả6route; CTA Đồng hành desktop/mobile có aria-current=page và kiểu active khi ở /dong-hanh. 404 không đánh dấu Trang chủ hoặc bất kỳ route nào current. Không default path về / cho route lạ. |
| B3, B4, B5, B6 | Hamburger đổi X khi mở. Footer link có target cao >=44px. Nhãn CTA minh bạch **“Xem dự toán chi tiết”**, không “chi chi” hoặc pill quá dài. Khi tắt JS, toggle Menu ẩn (hoặc fallback hoạt động thật); footer sáu link vẫn dùng được. Preserve mở/đóng/link/Tab/Escape/focus/resize và reduced motion. |
| U-F1, T5, U4 | Support card không mời “Đăng ký…” khi không có kênh nhận; mô tả thông tin/đăng ký chỉ sau khi kênh được xác nhận. Shell sản phẩm dùng tên **“túi bút”** theo brief; không tự thêm chất liệu chưa xác nhận. Năm route phụ vẫn chỉ shell, chưa triển khai T02/T03 hoặc form. |
| E1, favicon, a11y | 404 giảm số quá nặng nếu cần, thêm lối về Dự án/Sản phẩm qua route thật. Favicon SVG riêng từ motif minh họa hiện có, link icon trỏ resource HTTP200; không claim logo thương hiệu đã duyệt. Mọi figcaption phải thuộc figure, SVG decorative aria-hidden; bỏ aria-label trên div số stage không role và role=status của nội dung tĩnh. |

Palette minh họa nhiều màu (C4) được giữ cho buổi chơi/mẫu, không tự tạo ảnh thật hoặc đổi thương hiệu. U4 trang phụ hoàn chỉnh, form/validation T03, ảnh/thông tin nhóm thật và dữ liệu thực tế vẫn hoãn theo phạm vi; không mở rộng task vì review nhắc tới.

## Kiểm tra/bàn giao bắt buộc

Quyết định review candidate 285f695: visual mobile ưu tiên 16:9, chấp nhận giới hạn cao 165px để thu gọn trang. Ở 375px, khung thực tế 307×165 (~1,86:1); ở320 là252×141,75 (16:9). Codex đã xem ảnh thật: SVG contain đầy đủ, không méo/cắt; mục tiêu giảm chiều dài trang đạt16,89%. Đây là điều chỉnh tiêu chí bố cục được ghi rõ, không claim khung375 chính xác16:9. Bản assert ban đầu đánh dấu sai tỷ lệ ở375; sau quyết định này, kiểm kích thước dương, cao<=165,5px và tỷ lệ từ16:9 đến dưới2:1, kết hợp visual review.

1. Cài từ lockfile, check/build exit code thật. Tránh npm ci trong repo khi preview/dev khác đang giữ compiler Windows; dùng thư mục kiểm sạch ngoài repo hoặc phối hợp dừng đúng tiến trình đã xác minh. Không kill mọi node, không reset/xóa nguồn hoặc sửa stack. Kiểm base→final SHA thực, stage chỉ app/config/assets. Không push; Brain review và push sau nếu đạt.
2. Production preview loopback 127.0.0.1 (ưu tiên4321 nếu còn khả dụng). Report dev Claude dùng4399; không claim dev screenshot là production. Screenshot full-page 320/375/768/1024/1440 + menu375, metadata browser/version/zoom/DPR/viewport/timestamp/SHA và dimensions thật; trước/sau/height375 để đánh giá giảm chiều dài.
3. Sáu route và404 direct/reload; aria-current đúng mỗi route, 404 none; icon resource200; noindex/nofollow. Menu/no-JS/Escape/Tab/resize/focus, contrast, smallfont, no horizontaloverflow nămviewport. Các semantics figure/stage/staticbanner được kiểm.
4. Audit dist không DOCX/docs/ảnh riêng/contact/secret/form/QR; favicon minh họa tự tạo là asset public duy nhất thêm. Planned/actual/null/giá tham khảo nguồn gốc vẫn đúng. Không nhận đơn/tiền/public deploy.
5. Handoff final SHA, app status sạch, diff stat, lệnh/exit, measured heights/fold/fonts/contrast/routes, URL giữ preview và file TEMP ngoài repo. Mapping từng nhóm Claude: fixed hoặc deferred với lý do, không claim mọi góp ý đã làm nếu chỉ xử lý nhóm ưu tiên. Brain xem diff/ảnh/preview thật rồi kết luận R01 mới.

Giữ task duy nhất T01, giữ worker hiện có. Dừng sau bàn giao/sửa review; T02 vẫn chờ chủ dự án duyệt hướng UI mới. Không tự sửa tài liệu/report Claude hoặc kích hoạt agent khác.
