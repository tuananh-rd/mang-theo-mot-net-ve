# Báo cáo bàn giao phiên làm việc (Worker triển khai code)

**Thời điểm lập:** 2026-10-02  
**Người lập:** Worker triển khai code (Antigravity)  
**Tình trạng:** Sẵn sàng bàn giao sang workspace mới trong Orca  

---

## 1. Mục tiêu dự án và các yêu cầu cốt lõi

* **Dự án:** Xây dựng website cho chiến dịch “Mang Theo Một Nét Vẽ” của nhóm Lăng Kính (7 sinh viên lớp AI2015, học phần SSG105, Đại học FPT Hà Nội) tại Mái ấm Thánh Tâm Xuy Xá.
* **Mục tiêu:** Giới thiệu nhóm, dự án trọng tâm; thông điệp “Một buổi chơi phù hợp, một món quà đúng nhu cầu”; giới thiệu sản phẩm gây quỹ; tiếp nhận hỗ trợ vật tư và công khai minh bạch tài chính.
* **UI tham khảo:** https://sharethemeal.org/fr (bám sát đặc tả có bằng chứng của Codex; không tự claim tái tạo chính xác khi chưa có thông số đo lường).
* **Phạm vi MVP (6 routes tĩnh):**
  1. `/`: Trang chủ chiến dịch, tóm tắt nhóm, hoạt động, sản phẩm, kêu gọi đồng hành.
  2. `/ve-nhom`: Sứ mệnh và thông tin 7 thành viên nhóm Lăng Kính.
  3. `/du-an/mang-theo-mot-net-ve`: Câu chuyện, hoạt động có lựa chọn, 4 giai đoạn kế hoạch.
  4. `/san-pham`: Danh mục 3 sản phẩm gây quỹ (chuồn chuồn tre, túi bút, túi vải).
  5. `/minh-bach`: Dự toán chi (3.120.000đ), kịch bản doanh thu (2.900.000đ), thu chi thực tế.
  6. `/dong-hanh`: Danh mục hỗ trợ vật tư và liên hệ thật.
* **Nguyên tắc kỹ thuật & nội dung bắt buộc:**
  * Không tạo chiến dịch giả; không làm backend, không auth, không giỏ hàng, không thanh toán trực tuyến.
  * Tách bạch kế hoạch với thực tế: Số liệu thực tế chưa có phải để `null`, không gán 0 hay số dự kiến làm thành tích.
  * Tài chính: Doanh thu bán đủ 2.900.000đ trừ chi phí dự toán 3.120.000đ = âm 220.000đ nếu không có tài trợ. Tài trợ hiện vật tách riêng khỏi tiền mặt, không cộng trừ hai lần.
  * Không dùng ảnh/câu chuyện cá nhân/chẩn đoán của trẻ; không hứa hẹn trị liệu.
  * Chưa có ảnh thật thì dùng placeholder có nhãn rõ ràng trong bản preview.

---

## 2. Vai trò và quy tắc phối hợp (Brain - Worker)

* **Brain/Coordinator (Codex):** Quản lý tài liệu, đặc tả kiến trúc (`docs/architecture.md`), phân chia task (`docs/tasks.md`), review mã nguồn theo commit (`docs/reviews/`).
* **Worker triển khai (Antigravity):** Sở hữu mã nguồn ứng dụng, file cấu hình, chạy build/test và thực hiện preview responsive theo task được giao.
* **Chủ dự án:** Xác nhận thông tin thực tế, duyệt nội dung và duyệt phát hành public.
* **Quy tắc phối hợp:**
  * Không cùng sửa một file. Codex gửi yêu cầu sửa (CHANGES_REQUIRED) thay vì tự sửa code của Antigravity.
  * Antigravity không tự tiện thay đổi tài liệu của Codex hay tự sáng tạo thêm tính năng ngoài task.
  * Mỗi task triển khai phải có: Task ID, commit xuất phát, phạm vi file, yêu cầu UI/hành vi, tiêu chí nghiệm thu và commit bàn giao.
  * Không deploy public khi chưa có phê duyệt từ Chủ dự án.

---

## 3. Đường dẫn tuyệt đối

* **Thư mục dự án:** `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`
* **File báo cáo này:** `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve\reports\handoff-worker.md`

---

## 4. Task hiện tại, trạng thái và tiêu chí hoàn thành

* **Task T00 (Codex):** Khảo sát repo, đọc hồ sơ, khảo sát UI tham khảo, ban hành `docs/architecture.md`, giao task T01 → **Trạng thái: TODO / Đang chờ Codex**.
* **Task T01 (Antigravity):** Khởi tạo ứng dụng, routing cơ bản, trang chủ mẫu responsive → **Trạng thái: Đang chờ task từ Codex (Blocked by T00)**.
* **Tiêu chí hoàn thành của phiên Worker hiện tại:**
  * Hoàn tất khảo sát toàn bộ tài liệu dự án và hiện trạng repo.
  * Xác nhận môi trường kỹ thuật cục bộ.
  * Tuân thủ quy tắc không tự ý sinh code khi chưa có quyết định kiến trúc và task T01 chính thức từ Codex.
  * Lưu lại báo cáo bàn giao đầy đủ để agent mới có thể tiếp nhận ngay lập tức.

---

## 5. Công việc đã hoàn thành và bằng chứng

1. **Khảo sát toàn bộ tài liệu:**
   * Đã đọc và nắm vững các ràng buộc trong: `AGENTS.md`, `README.md`, `docs/brief.md`, `docs/ui-reference.md`, `docs/content.md`, `docs/data-and-finance.md`, `docs/workflow.md`, `docs/tasks.md`, `docs/open-questions.md`, `docs/reviews/template.md`, `docs/prompts/codex.md`, `docs/prompts/antigravity.md`.
2. **Khảo sát hiện trạng repository:**
   * Đã kiểm tra qua PowerShell: Thư mục chưa có Git (`.git` chưa tồn tại), chưa có code ứng dụng, chưa có `docs/architecture.md`.
   * Thư mục `public/images/README.md` xác nhận chưa có ảnh thật.
3. **Kiểm tra công cụ môi trường:**
   * `git version 2.55.0.windows.5`
   * `node v24.19.0`
   * `npm 11.17.0`
4. **Báo cáo sẵn sàng:**
   * Đã lập báo cáo khảo sát và gửi mẫu nhận task T01 đến Codex/Chủ dự án.

---

## 6. Các file đã sửa và lý do sửa

* **Mã nguồn dự án:** Không sửa đổi bất kỳ file nào hiện có. Giữ nguyên trạng 100% codebase để tuân thủ quy tắc phân vai.
* **File tạo mới:**
  * `reports/handoff-worker.md`: Báo cáo bàn giao phiên làm việc cho agent tiếp nhận.

---

## 7. Các lệnh kiểm tra đã chạy và kết quả

* `git status; git log -n 5 --oneline; Get-ChildItem -Path .`: Trả về `fatal: not a git repository`, danh mục gốc chỉ gồm `docs/`, `public/`, `AGENTS.md`, `README.md`.
* `Get-ChildItem -Recurse`: Xác định toàn bộ cây thư mục hiện tại.
* `git --version; node -v; npm -v`: Môi trường Node.js và Git sẵn sàng.
* **Phần chưa kiểm tra:** Do chưa có code ứng dụng, chưa thực hiện kiểm tra build, dev server hay responsive test.

---

## 8. Việc còn dang dở, lỗi và quyết định đang chờ

* **Việc đang chờ:**
  * Chờ Codex hoàn thành T00 (ban hành `docs/architecture.md` và giao task T01 với đầy đủ tiêu chí).
  * Chờ khởi tạo Git repository (Codex thực hiện hoặc giao cho Antigravity trong task T01).
* **Lỗi hiện tại:** Không có lỗi phát sinh.
* **Quyết định đang chờ từ Codex/Chủ dự án:**
  * Quyết định lựa chọn stack cho MVP (ưu tiên giải pháp nhỏ, tĩnh, dễ bảo trì, dễ deploy).
  * Đặc tả UI cụ thể từ trang tham khảo `https://sharethemeal.org/fr`.

---

## 9. Bước tiếp theo cụ thể (theo thứ tự ưu tiên)

1. **Nhận Task T01 từ Codex:** Kiểm tra xem Codex đã cung cấp file `docs/architecture.md` và thông tin task T01 chưa.
2. **Khởi tạo Git và Project (nếu được giao):** Khởi tạo Git repo (nếu chưa có), setup project theo stack mà Codex đã chốt trong `architecture.md`.
3. **Triển khai khung ứng dụng T01:**
   * Cấu hình 6 route tĩnh cơ bản theo brief.
   * Xây dựng layout trang chủ mẫu: Header (nav), Hero, Cards hoạt động/sản phẩm, Footer.
   * Áp dụng placeholder có nhãn cho hình ảnh.
4. **Kiểm tra và kiểm thử:**
   * Chạy build kiểm tra không có lỗi cú pháp/import.
   * Kiểm tra hiển thị responsive ở 3 viewport: 375px (mobile), 768px (tablet), 1440px (desktop).
5. **Commit và bàn giao:** Commit theo quy chuẩn và gửi báo cáo nghiệm thu R01 cho Codex.

---

## 10. Thông tin Orca Orchestration

* **Trạng thái kết nối:** Chưa có worker dispatch ID hoặc terminal handle trực tiếp. Giao tiếp hiện được điều phối qua Chủ dự án hoặc qua file workspace.
* **Cảnh báo cho agent tiếp nhận:** Luôn kiểm tra lại các handle/ID trước khi sử dụng; không giả định kênh tự động đang tồn tại nếu chưa được xác thực.

---

## 11. Prompt khởi động ngắn cho agent tiếp nhận

```markdown
Bạn là Worker triển khai code (Antigravity) cho dự án website “Mang Theo Một Nét Vẽ”.
Hãy đọc file reports/handoff-worker.md để nắm toàn bộ bối cảnh dự án, hiện trạng repository và quy tắc phối hợp với Codex (Brain).
Kiểm tra xem Codex đã hoàn thành task T00 và ban hành docs/architecture.md cùng task T01 chưa.
Nếu đã có task T01, hãy triển khai mã nguồn theo đúng đặc tả và tiêu chí nghiệm thu.
Nếu chưa có, hãy tiếp tục giữ nguyên repo và báo cáo sẵn sàng tiếp nhận task.
```
