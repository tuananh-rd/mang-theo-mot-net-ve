# Quan sát focus candidate92 — ghi lại từ output, không phải raw log

Lượt Codex kiểm ban đầu trên app92f1c4f trả exit1, cả năm checks đều thất bại: summary FAQ ở Sản phẩm/Minh bạch/Đồng hành, summary bảng sản phẩm và vùng cuộn bảng đều focus được nhưng computed outline là `rgb(31, 41, 51) none 3px`. Các FAQ/summary mở được bằng bàn phím. Candidate có17 usages của CSS tokens chưa định nghĩa.

File raw JSON và ảnh focus92 đã bị worker chạy lại harness trên working tree đã sửa nhưng chưa commit22ba026 ghi đè. Không khôi phục hoặc giả lập raw output/timestamp. Bản ghi đè được giữ tại worker-focus-before-22ba026-commit.json, phân loại worker precommit, không phải Codex independent candidate PASS. Ảnh candidate-92f1c4f-products-faq-focus.png từ lượt capture riêng và source token audit vẫn là bằng chứng bổ trợ. Các lượt final952d753 có raw JSON độc lập mới và yêu cầu app committed clean trước khi chạy.
