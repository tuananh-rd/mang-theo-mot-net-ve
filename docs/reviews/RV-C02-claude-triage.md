# Codex tiếp nhận review Claude C02

Ngày 03/10/2026. [Báo cáo Claude](../../reports/ui-content-review-claude-c02.md) review app `221eafa73661cb822b3f8017b7fe1bf367106349`, HEAD `3cce1b1`. Claude đã hoàn tất và HOLD; Antigravity vẫn HOLD. Chưa giao task triển khai mới, chưa sửa app hoặc phát hành public trong lượt review này.

Kết quả: số liệu, trạng thái dữ liệu và chức năng hiện tại đạt; bố trí cần cải thiện để người xem đọc nhanh và nhận biết thông tin. Codex đã đọc toàn bộ báo cáo, đối chiếu các đề xuất nội dung với nguồn PDF và yêu cầu trực tiếp của chủ dự án. Các đề xuất dưới đây là phạm vi có thể chuẩn bị cho lần sửa tiếp theo, chưa phải tính năng đã triển khai.

## Ưu tiên bố cục có thể xử lý bằng dữ liệu hiện có

| Ưu tiên | Phạm vi | Hướng tiếp nhận |
| --- | --- | --- |
| 1 | Sản phẩm — P3, P7, P8, P12 | Một mẫu thẻ chung, rõ giá tham khảo/số lượng/trạng thái; tránh lặp chi tiết bảy món trên mobile. Bảng tổng hợp có thể mở rộng khi cần; FAQ dùng cùng tương tác thu gọn. Thống nhất nhãn null là “Chưa xác nhận”. |
| 2 | Minh bạch — P4, P5, P6, P10 | Đưa chi dự kiến, doanh thu và số dư giả định cùng điểm chênh 550.000đ lên đầu. Nhóm dự toán có tổng phụ tính từ data: 2.245.000 + 1.560.000 + 1.130.000 = 4.935.000đ. Gom trạng thái thực tế và nguyên tắc để đọc gọn; không đổi null thành 0. |
| 3 | Trang chủ/Dự án — P1, P2, P9, P11 | Giữ tên dự án, phân biệt mục đích hai trang bằng phần mở đầu và tóm tắt. Dự án bổ sung mục tiêu định tính, cách tham gia và nguyên tắc an toàn ở dạng đề xuất. Rút caption/cảnh báo lặp nhưng vẫn thấy rõ ngữ cảnh minh họa. Đoạn văn dài mobile căn trái. |
| 4 | Đồng hành/Về nhóm — P13–P16 | Nêu rõ người xem hiện có thể xem kế hoạch, sản phẩm, dự toán; không tạo CTA nhận tiền/đơn khi chưa có kênh. Một hành động chính mỗi section. Nhân sự chưa xác nhận trình bày gọn, giữ bảy thành viên như thông tin nhóm đã cung cấp. |

Mục tiêu chiều cao ≤6.500px tại P3 và ≤900px tại P5 là gợi ý của Claude, chưa phải điều kiện cứng được giao. Khi tạo spec cần cân bằng khả năng đọc, ảnh, bàn phím và đủ dữ liệu; không thu chữ dưới 14px hoặc bỏ thông tin cần thiết để đạt số đo.

## Các đề xuất cần chỉnh trước khi đưa vào đặc tả

- **P2/G3 — trạng thái:** không tự đổi thành “chờ Mái ấm xác nhận” như một tình trạng phối hợp đã biết. Hiện chỉ có thể nói đề xuất/chưa có xác nhận chính thức. Cần nhóm gửi một câu trạng thái ngắn, ngày và người duyệt; ngày build/review không phải ngày duyệt hoạt động.
- **N1 — mục tiêu:** diễn đạt “tạo điều kiện để mỗi người có lựa chọn phù hợp”, không cam kết 100% hoặc bắt mọi người tham gia. Giữ quyền chọn, quan sát và nghỉ; không giao chỉ tiêu sản xuất cho trẻ, không đưa KPI học phần thành mục tiêu tuyển người.
- **N2/N3 — an toàn:** nguồn có vai trò người chăm sóc/cơ sở. Nội dung website phải kết hợp quyền lựa chọn của người tham gia với hướng dẫn và hỗ trợ an toàn từ người chăm sóc; không chép câu nguồn theo cách tước quyền chọn. Các phương án vật liệu/trò chơi là dự kiến cần cơ sở đồng ý, không xác nhận đã chuẩn bị hoặc đã được duyệt.
- **N5/N6 — phương án tài chính/standee:** trang 26 ghi trong đề xuất “Bộ standee đã mượn được chỉ cần đồ tặng”; đây chưa là chứng cứ bàn giao hiện vật hiện hành. Có thể ghi “Theo đề xuất, khoản này dự kiến dành cho đồ tặng nếu sử dụng bộ standee mượn; tình trạng mượn cần xác nhận”. Không công bố đã mượn/đã nhận tài trợ hoặc chính sách tài chính đã có hiệu lực chỉ vì hồ sơ có câu đó.
- **N7 — đối tượng:** có thể mô tả đối tượng được nhắc trong đề xuất, không tự xác nhận số người hoặc thành phần tham gia hiện tại. Không dùng thông tin hoàn cảnh để thúc đẩy mua hàng.
- **P9 — ảnh/caption:** không áp dụng việc rút mọi caption thành credit duy nhất. A02 chỉ là họa cụ, A03 là nhạc cụ/người stock, A04 không phải bộ bowling và A05 không xác nhận hộp/khẩu phần bán. Có thể dùng caption ngắn cộng ghi chú chung ở cùng section, nhưng ngữ cảnh và nguồn vẫn nhìn thấy, không chỉ nằm trong tooltip.
- **P12/G6 — phong cách ảnh:** không loại A05 hoặc các ảnh đã được chủ dự án cho dùng chỉ để ép tất cả thành SVG. Ưu tiên đồng bộ khung, tỷ lệ, vị trí thông tin và kiểu thẻ. Không bắt nhóm phải có đủ ảnh mọi sản phẩm mới được cập nhật một ảnh đã có quyền/ngữ cảnh rõ.
- **P16 — nhân sự:** không cần thêm bảy thẻ rỗng để lấp trang. Dùng trạng thái chờ công bố gọn; tên, vai trò và ảnh thật chờ được đồng ý.
- **G2 — danh sách dữ liệu:** `group-content-request.md` đã yêu cầu thời lượng. Điểm cần bổ sung là nhắc rõ các khoảng thời lượng mâu thuẫn trong nguồn, yêu cầu chọn một bản hiệu lực; không coi thời lượng là thông tin mới hoàn toàn chưa được yêu cầu.

## Nội dung còn thiếu

Có thể bổ sung ngay ở dạng **mục tiêu/nguyên tắc đề xuất**: mục tiêu định tính, cách lựa chọn hoạt động, vai trò cơ sở/người chăm sóc, phương án an toàn và dự phòng, tổng phụ dự toán và giải thích khoản standee có điều kiện. Không chuyển các mục này thành kết quả hoặc cam kết thực tế.

Cần nhóm cung cấp: câu trạng thái có ngày; lịch/thời lượng đã thống nhất; bản phân công hiệu lực giữa các nguồn mâu thuẫn; tên/ảnh được phép; mẫu, khẩu phần và điều kiện mở bán; nhu cầu hiện vật/kênh liên hệ; bảng phân bổ giải thích 550.000đ. [Danh sách yêu cầu nhóm](../group-content-request.md) đã có quy cách ảnh và vị trí dùng, được bổ sung những điểm Claude nhắc rõ hơn.

Sau hoạt động/đối soát và được phép công bố mới có: cập nhật/ảnh thật, sổ thu chi/tồn kho/hiện vật, chứng từ và kết quả trao tặng. Mở bán, thanh toán, SEO và public tiếp tục phụ thuộc điều kiện và phê duyệt riêng.

## Bằng chứng và giới hạn

Claude kiểm 24 hash dist/HTTP, chụp sáu trang ở 375/768/1440 và Sản phẩm900/1024, xem ảnh theo lát/composite, kiểm menu/FAQ/focus. Danh sách ảnh đã xem và phần chưa xem đầy đủ nằm trong `docs/evidence/Claude-C02/claude-viewed.json`. Một số lát 768 và Sản phẩm900 chỉ đo tự động; không nói đã visual review mọi lát. Nguồn đối chiếu là text29trang có hash khớp PDF, chưa xem bố cục trang PDF. App không đổi trong review; server4322 giữ nguyên.

RC02 PASS trước đó nghiệm thu phần C02 được giao. Báo cáo lần này mở các cải thiện về phân cấp và bố trí theo yêu cầu mới của chủ dự án; không tự coi các cải thiện đó đã sửa xong.
