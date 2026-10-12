# C16 — UI theo hướng Nâng Bước Tuổi Thơ (Claude, thiết kế và chỉnh trực tiếp)

- Ngày 11/10/2026. Task `task_dda2fcaa800d`, dispatch `ctx_38e9d462bffa`. Claude là worker duy nhất theo ngoại lệ của C16; Antigravity HOLD.
- Baseline: HEAD `f5595bab03978d16ec64bb512696d02df82eed1e` (nhánh `task/c15-page-layouts`). Nhánh mới `task/c16-reference-ui` tạo từ HEAD đó.
- **Code cuối: `cef6634e835ba90e733dc2c5727bfc5772f3d2cd`** (hai commit ứng dụng: `d44e27b` palette/bố cục, `cef6634` sửa tràn chữ số liệu; toàn bộ kiểm tra chạy lại ở `cef6634`). Commit báo cáo/bằng chứng đi sau và chỉ chứa `reports/c16-reference-ui-claude.md` cùng `docs/evidence/C16/claude/`; commit đó không đổi `src/`. Mọi ảnh và kết quả kiểm bên dưới chụp/chạy ở HEAD = `cef6634` (ghi trong từng file JSON).
- Không push, merge, deploy; không sửa `src/data`, `src/lib`, `public`, `tools`, `tests`, dependency, lockfile, cấu hình; không đụng tài liệu/helper/bằng chứng của Codex.

## 1. Khảo sát trang tham khảo

Chrome 154 headless thật (`puppeteer-core`), đọc trang như dữ liệu không tin cậy; không có lỗi truy cập, không bị chặn.

| URL | Viewport | Thời điểm (UTC) | HTTP | Cao trang |
| --- | --- | --- | --- | --- |
| `https://nangbuoctuoitho.org/` | 1440×1000 và 375×812 | 2026-10-11 06:55 | 200 | 15461 / 15794 px |
| `/bao-cao/` (Báo cáo) | cả hai | 06:56 | 200 | 2214 / 2701 px |
| `/quyen-gop/` (Quyên góp) | cả hai | 06:56 | 200 | 2214 / 2709 px |
| `/tin-tuc/` (Tin tức) | cả hai | 06:56 | 200 | 5012 / 12105 px |
| `/cau-chuyen/` (Câu chuyện) | cả hai | 06:57 | 200 | 3968 / 7121 px |

Số đo (computed style) nằm trong `docs/evidence/C16/claude/ref-survey.json` và `ref-survey-2.json`; script `ref-survey.mjs`. Ảnh chụp của trang tham khảo được giữ cục bộ trong `docs/evidence/C16/claude/ref-screens/` và **không đưa vào commit** (có ảnh bệnh nhi và nội dung y tế của họ; chỉ dùng để đọc bố cục).

Giá trị đo được trên trang chủ tham khảo:

| Hạng mục | Giá trị |
| --- | --- |
| Phông | Quicksand (tiêu đề), Be Vietnam Pro (thân) |
| Nền | trắng; vùng navy `rgb(29,42,77)` (footer, dải thẻ tài trợ); dải xanh ngọc; vùng xanh nhạt gần trắng |
| Màu chữ | xanh ngọc `rgb(28,183,141)`, navy `rgb(33,51,96)` và `rgb(14,32,77)`, xanh dương `rgb(30,98,146)`, xám `rgb(52,58,64)` |
| Thân chữ | 14 px / 22,4 px |
| H1 trang con / H2 | 40 px / 35 px, đậm 700 |
| Nút | bo tròn 50 px, chữ 13 px đậm; nút chính nền xanh ngọc, chữ trắng; nút phụ viền hoặc nền trắng |

## 2. Những điều học được và cách áp dụng cho dự án sinh viên

| Điều học được (có bằng chứng trong ảnh/số đo) | Áp dụng cho Lăng Kính | Không áp dụng vì |
| --- | --- | --- |
| Bảng màu navy + xanh ngọc + xanh dương trên nền trắng/xanh nhạt; nút bo tròn | Palette mới "Biển & Nắng" (mục 3) | Không dùng chữ trắng trên xanh ngọc `#1cb78d` (tương phản 2,6:1); không dùng nút xanh ngọc chữ trắng |
| Tiêu đề lớn trước, ảnh rộng ngay sau | Giữ ảnh/chân dung lớn có chú thích ở Trang chủ, Quà lưu niệm, Nhật ký, Về nhóm | Không làm ảnh nền kèm lớp phủ (không filter lên ảnh) |
| Dải xanh ngọc phẳng có ba thẻ số liệu trắng cạnh ảnh lớn | Dải "Kế hoạch trong một cái nhìn" ở Trang chủ, dùng số liệu kế hoạch đã có | Không dùng số liệu thành tích; mọi ô đều ghi mục tiêu hoặc dự kiến |
| Bước đánh số nối bằng đường kẻ (quy trình, các bước quyên góp) | Dòng "Ba việc" ở Trang chủ thành 3 vòng số nối nhau | — |
| Thẻ trắng nổi, bóng nhẹ; khối liên hệ màu ở bên phải thẻ quyên góp | Thẻ liên hệ trắng trong footer navy; khung "cách chuyển khoản" của Đồng hành thành bảng xanh ngọc | Không có form quyên góp, không thanh toán, không giỏ hàng |
| Dải xanh ngọc xen kẽ vùng navy và vùng xanh nhạt | Nhịp: sáng, xanh trời, một dải xanh ngọc, navy ở Trang chủ và Dự án | Không tăng số vùng tối; mỗi trang tối đa một vùng tối giữa trang |
| Nút "Donate" cố định cạnh phải | Đã có nút Ủng hộ ở header và thanh dưới mobile; không thêm nút nổi thứ ba (sẽ che nội dung ở 1100–1300 px) | Tránh che nội dung và focus |

Không sao chép logo, ảnh, CSS, bài viết hay tên bệnh nhi của nguồn; chỉ dùng ảnh Lăng Kính đã có quyền.

## 3. Palette "Biển & Nắng" (màu phẳng, không gradient)

| Token | Trước (Tre & Mơ) | Sau | Vai trò / tương phản |
| --- | --- | --- | --- |
| `--brand-ink` | `#123c3a` | `#13264b` | Navy: footer, dải tối, tiêu đề; trắng trên navy 14,9:1 |
| `--brand` | `#0d6b63` | `#1a5d96` | Link, số chương, nhấn; 6,9:1 trên trắng, 6,2:1 trên xanh trời |
| `--brand-deep` (mới) | — | `#0d6e55` | Xanh ngọc đậm cho chữ/dấu tích; 6,2:1 trên trắng |
| `--band` (mới) | — | `#2bb58d` | Dải số liệu phẳng; chữ navy 5,8:1, chữ `--ink` 6,0:1 |
| `--cta` / hover | `#f4a261` / `#e98d45` | `#ffc43d` / `#f5b21d` | Nút chính; chữ navy 9,4:1 |
| `--surface-alt` | `#eef5f2` | `#eaf4fb` | Nền xanh trời nhạt; chữ ink-2 6,8:1 |
| `--ink` / `--ink-2` | `#1d2b2a` / `#4b5d5b` | `#16233f` / `#46556f` | Chữ chính 15,6:1; chữ phụ 7,5:1 trên trắng |
| `--line` / `--line-strong` | `#d3e0dc` / `#6a817d` | `#d2e0ec` / `#6b7f99` | Viền; viền điều khiển 4,1:1 trên trắng |
| `--focus` | `#1f5fbf` | `#13264b` | Vòng focus navy; trên nền tối vẫn trắng; trên dải xanh ngọc đặt navy |

Tỷ lệ trên tính từ giá trị hex bằng công thức WCAG (script tạm, không nằm trong evidence). Các dải tint và màu trạng thái được chỉnh theo hue xanh (`--tint-*`, `--status-plan-*`, `--banner-*`).

## 4. Thay đổi giao diện

14 file trong `src/components`, `src/pages`, `src/styles`.

| Phạm vi | Thay đổi nhìn thấy được |
| --- | --- |
| Toàn site | Palette mới; nút chính vàng nắng chữ navy; dải CTA cuối trang vàng; đường viền trên footer xanh ngọc |
| Footer | Nền navy; khối liên hệ là thẻ trắng nổi có viền trái xanh ngọc, số điện thoại lớn, link gạch chân |
| Trang chủ | Hero nền xanh trời, chữ navy, ảnh A01 lệch khối xanh dương (thay hero tối); "Ba việc" thành 3 vòng số nối nhau; thêm dải xanh ngọc "Kế hoạch trong một cái nhìn" (4 thẻ trắng); giữ dải ủng hộ navy, quà + nhật ký, nhóm |
| Dự án | Palette mới; chương 04 "Chuẩn bị kỹ lưỡng và tôn trọng Mái ấm" thành dải xanh ngọc với hai thẻ trắng nổi; giữ chương Mái ấm tối và caption |
| Quà lưu niệm + 2 chi tiết | Catalogue/phiếu giữ cấu trúc C15 với palette mới; ô giá xanh trời, chip trạng thái, placeholder nét đứt cho móc khóa chưa có ảnh |
| Minh bạch | Giữ bố cục tài liệu (mục lục, bảng kế hoạch/thực tế); sửa khoảng đệm dưới (xem mục 6) |
| Đồng hành | Khung "Cách chuyển khoản tiện lợi" thành bảng xanh ngọc chữ navy; stepper và thẻ giữ |
| Về nhóm | "Năm cam kết" thành dải xanh ngọc, số 01–05 navy; chân dung và vai trò giữ |
| Nhật ký + 2 bài | Giữ bài nổi bật/danh sách/bài đọc và "Bài khác"; sửa khoảng đệm dưới danh sách |
| Header / mobile / menu / FAQ / 404 | Đồng bộ qua token; menu mobile bản mới có mục hiện tại nền xanh trời, viền trái và chữ đậm; 404 nền xanh trời, số 404 xanh dương |

Phần cấu trúc từng trang vẫn khác nhau theo C15 (poster, hành trình, catalogue, tài liệu, tạp chí); không quay lại cùng một dải tối + thẻ.

## 5. Bất biến và kết quả kiểm

Chạy ở HEAD `cef6634` trên preview 4322 (PID 544). JSON nằm trong `docs/evidence/C16/claude/verify/`; các tệp `*.log` (build/check/test/diff-check/helper) có trong thư mục `verify/logs/` trên đĩa nhưng bị `.gitignore` nên không có trong commit, giống các lượt trước.

| Kiểm tra | Kết quả | Tệp |
| --- | --- | --- |
| `npm run build` | exit 0, 13 trang | `verify/logs/build.log` |
| `npm run check` | exit 0; 0 lỗi, 0 cảnh báo, 8 gợi ý (hint nằm ở script helper của Codex) | `verify/logs/check.log` |
| `npm test` | exit 0; 92/92 test, 13 suite | `verify/logs/test.log` |
| `git diff --check f5595ba..HEAD` | exit 0 | `verify/logs/diff-check.log` |
| Trình duyệt: 14 route × 375/768/1440 | 42/42 lượt đạt; 17 liên kết nội bộ; 0 page error; ảnh, tràn ngang, heading, FAQ, gradient, mẫu tương phản đạt | `verify/` (JSON của `review-browser`) |
| Bố cục C15 | đạt; QR bắt đầu y=494,59 px ở 375×812 (≤560); không nhảy heading, không figcaption sai | `verify/` (`review-layout`) |
| Tương tác | `pass: true`; menu/Escape/Tab, chia sẻ, copy, tải QR, điều hướng, tải lại, JS tắt | `verify/interactions/` |
| Bàn phím | 105/105 lần focus trong nội dung không bị thanh cố định che | `verify/keyboard/` |
| Focus bổ sung | `pass: true`; Menu không đổi scrollY, skip link, Shift+Tab | `verify/focus-details/` |
| Audit dist và preview | 44 file không có dữ liệu nguồn/private; 23 hash phục vụ từ 4322 khớp dist | `verify/build-output/` |
| Renderer fixture trong TEMP | `pass: true`; dữ liệu thật không đổi | `verify/renderer-fixture/` |
| Cây ứng dụng | `git status` sạch trên `src public tools tests package*.json astro.config.mjs` sau commit; không thay `src/data`, `src/lib`, `public` | `screens/capture-meta.json` |

Nội dung giữ nguyên bytes ở nguồn: mục tiêu 3.000.000đ; sổ `reconciled:false`, `reconciledAt:null`, `entries:[]`; giá tham khảo 40.000/10.000đ; chưa mở bán; lịch dự kiến 24/10 và 31/10/2026; tuần 1/5, cập nhật 09/10; bảy thành viên, chân dung, liên hệ, tài khoản, QR; nhãn ảnh minh họa/tham khảo; quyền chọn/nghỉ/giữ sản phẩm của các em. Dải số liệu Trang chủ chỉ dùng: mục tiêu ủng hộ, số buổi dự kiến, số góc hoạt động, số thành viên; có dòng "Đây là số liệu kế hoạch, chưa phải kết quả đã đạt."

## 6. Sửa lỗi trong lượt này

**Theo review sớm của Codex (tràn chữ trong thẻ số liệu):** `.stat-num` `3.000.000đ` rộng 227,7 px so với 174 px (1024) và 218 px (1440). Đã cho thẻ `container-type: inline-size` và cỡ chữ `clamp(1.5rem, 17cqi, 2.75rem)` kèm `white-space: nowrap`; giữ nguyên số tiền đầy đủ, 4 thẻ, không ellipsis. Kết quả `review-stat-fit` ở `cef6634`: 375 → 228/303, 768 → 228/300, 1024 → 153/174, 1440 → 192/218 px (chữ/hộp), đều vừa (`docs/evidence/C16/claude/stat-fit/stat-fit.json`). Đã xem lại ảnh 1024: thẻ gọn, không cắt.

**Lỗi có sẵn:**

Token `--space-16` không tồn tại; các khai báo dùng nó bị trình duyệt bỏ nên khoảng đệm bằng 0. Đã đổi sang `--space-18` (72 px) ở: dải ủng hộ Trang chủ, vùng tài liệu Minh bạch, danh sách Nhật ký và trang bài Nhật ký (trước đó mục cuối sát dải CTA). Không đổi token trong file dữ liệu/lib.

## 7. Ảnh bằng chứng

`docs/evidence/C16/claude/screens/`: 12 route (Trang chủ, Dự án, Quà lưu niệm, Minh bạch, Về nhóm, Đồng hành, Nhật ký, 2 bài, 2 chi tiết sản phẩm, 404) × 375/768/1440 × màn hình đầu/toàn trang, cộng `menu-open-375.png`, `capture-meta.json` (ghi `headSha`, `appDirty`, giờ, trình duyệt). Chỉ các ảnh màn hình đầu và toàn trang 375 được commit (cùng với `capture-meta.json`); tệp `fixture-build-*.txt` của helper (ANSI/khoảng trắng cuối dòng) cũng để cục bộ; ảnh toàn trang 768/1440 và ảnh trong `verify/*/screens` để cục bộ vì dung lượng (khoảng 70 MB), Codex xem trực tiếp ở thư mục.

## 8. Preview, giới hạn, rủi ro

- Preview http://127.0.0.1:4322/ (PID 544) phục vụ `dist` mới build, không khởi động lại. Studio http://127.0.0.1:4323/ (PID 6276) không đụng tới.
- Chỉ kiểm trên Chrome 154 headless (touch emulation và reduced motion); chưa Safari/Firefox/điện thoại thật/screen reader. Không nhận định WCAG đầy đủ; tương phản từ mẫu DOM của helper và tính toán hex.
- Dải xanh ngọc `#2bb58d` chỉ đạt chữ navy/ink; không dùng chữ `--ink-2` hay `--brand` trên dải đó (đã ghi đè ở Dự án và Về nhóm).
- Màu focus đổi sang navy; trên dải xanh ngọc đã đặt `outline-color` navy; cần xem thêm khi thêm thành phần mới.
- Logo trong `public` giữ nguyên (xanh navy/đỏ đậm); không chỉnh asset.
- Chưa có ảnh mẫu thật cho móc khóa; giữ placeholder nét đứt và ghi chú. Codex đã đọc ảnh tham khảo của họ (`docs/evidence/C16/reference/`); báo cáo này dựa trên số đo và ảnh tự chụp ở mục 1. Các trang con đang dùng nền trắng khá nhiều, có thể thêm ảnh nền hoạt động thật khi nhóm có ảnh được phép.
- Chưa xin duyệt chủ dự án; đây là bản xem trước local, chưa phát hành.

## 9. Bổ sung 12/10/2026 — ảnh chuồn chuồn làm nền đầu Trang chủ

Theo yêu cầu trực tiếp của chủ dự án: bỏ ảnh cọ vẽ A01 ở Trang chủ và dùng ảnh "Chuồn chuồn gỗ xanh họa tiết dân gian" làm nền phần đầu.

- Nhánh `task/c16-hero-photo` (từ `task/c16-reference-ui` @ `89e82e6`), code commit `bc52df301c873a08c7236e9750b090678825db42`. Làm trong git worktree riêng để không đụng nhánh `task/c17-online-studio` đang checkout ở thư mục chính.
- Ảnh nguồn `D:\Downloads\Chuồn chuồn gỗ xanh họa tiết dân gian.png` (1672×941) được đổi sang WebP, lưu `public/images/hero/chuon-chuon-go-xanh.webp` (1672 px, 75 KB) và `-900.webp` (900 px, 34 KB); không filter, không phủ lớp màu.
- `src/components/Hero.astro` viết lại: ≥1360 px ảnh phủ toàn dải (phóng 120%, neo trái) với thẻ trắng nội dung bên trái và nhãn ảnh góc phải; dưới 1360 px ảnh nằm trên, nhãn ảnh ngay dưới ảnh, rồi thẻ nội dung. A01 không còn xuất hiện ở Trang chủ (dữ liệu `illustrations.ts` giữ nguyên vì Dự án/Nhật ký vẫn dùng).
- Nhãn ảnh: "Ảnh minh họa chuồn chuồn gỗ họa tiết dân gian do chủ dự án cung cấp — chưa phải sản phẩm thực tế của nhóm." Nhóm cần xác nhận quyền dùng và nguồn ảnh trước khi phát hành; chưa có thông tin tác giả/nguồn nên chưa ghi credit.
- Kiểm ở `bc52df3` trên bản build trong worktree (preview loopback `127.0.0.1:4324`): build exit 0 (13 trang); check 0 lỗi, 0 cảnh báo; 92/92 test; diff-check exit 0; ma trận trình duyệt 42/42; layout, tương tác, focus chi tiết đạt; bàn phím 105/105; audit build-output đạt (46 file, 23 hash khớp). JSON nằm trong `docs/evidence/C16/claude/hero-photo/`; ảnh Trang chủ 375/768/1024/1360/1440 trong `hero-photo/screens/`.
- Preview chính 4322 vẫn phục vụ bản dựng của thư mục chính (nhánh C17); muốn xem hero mới ở cổng đó cần build lại trên nhánh `task/c16-hero-photo`.

### 9.1 Căn chỉnh lại ảnh nền (12/10/2026, code `9ab2d354f7ede83499480ec9866e56e8c807436e`)

- Desktop ≥1360 px: thẻ nội dung hẹp 480 px, ảnh phóng 125% neo trái (`min-width:100%`, `max-width:2200px` để không phóng quá nhiều so với ảnh nguồn 1672 px) nên chuồn chuồn gần như nguyên vẹn bên phải thẻ, chỉ đầu cánh trái chạm mép thẻ; thẻ căn giữa dọc, nhãn ảnh góc phải.
- 768–1359 px: ảnh 2:1 phía trên, nhãn ảnh, rồi thẻ nội dung. Dưới 768 px: ảnh 4:3 (chuồn chuồn lớn hơn bản trước), nhãn ảnh, thẻ nội dung.
- Kiểm tại `9ab2d35`: build/check (0 lỗi, 0 cảnh báo)/92 test/diff-check exit 0; ma trận trình duyệt 42/42; layout, tương tác, focus chi tiết đạt; bàn phím 105/105; build-output đạt (46 file, 23 hash khớp). JSON và ảnh Trang chủ 375/768/1024/1360/1440/1920 trong `docs/evidence/C16/claude/hero-photo-r2/`.
