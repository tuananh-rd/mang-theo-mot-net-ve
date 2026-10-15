# C18-S — Đồng bộ Studio với nội dung V3 (nhánh Studio)

Chỉ giao sau khi C18 (nội dung công khai trên nền `origin/main`) được Claude review PASS. Người thực hiện duy nhất: Antigravity.

## Mục tiêu

Studio công bố từ bản nháp D1 và từ giá trị mặc định/đường cơ sở trong mã. Nếu các giá trị này còn cũ, lần xuất bản hoặc khởi tạo sau sẽ ghi đè nội dung V3 bằng nội dung cũ (lịch 24/10 và 31/10, hoạt động "vẽ tranh tự do", tham chiếu `proposal-final`...). Task này đưa cùng giá trị C18 vào nhánh Studio.

## Nơi làm việc

- Workspace chính `C:\Users\tuana\Documents\Codex\2026-10-02\t\outputs\mang-theo-mot-net-ve`, nhánh `task/c17-online-studio`, HEAD hiện tại do Claude ghi trong dispatch.
- Commit C18 nguồn: SHA do Claude ghi trong dispatch (nhánh `task/c18-v3-content`).
- Không đụng tệp tài liệu/bằng chứng không thuộc phạm vi; có nhiều tệp untracked/dirty của Codex phải giữ nguyên. Không `git add -A`, không reset/clean/stash. Commit chỉ danh sách tệp tường minh.

## Việc cần làm

1. **Đưa các thay đổi dữ liệu của C18 vào nhánh Studio** bằng `git cherry-pick -n <SHA C18>` hoặc áp dụng tương đương. Nhánh Studio đã đổi tên hằng số sang `BASELINE_*` và thêm lớp phủ snapshot nên có thể xung đột ở chú thích; **giải quyết sao cho giá trị cuối cùng bằng đúng giá trị C18** trong `src/data/campaign.ts` (các hằng `BASELINE_*`, `SAFETY_PRACTICES`, `PLAY_FLOW`, `SALES_PLAN`, `TEAM_MEMBERS`, `PLANNED_SESSIONS`...), `src/data/journal-entries.json`, `src/pages/index.astro`. Giữ nguyên toàn bộ lớp `createDynamicProxy`/`getPublished*` của Studio.
2. **`apps/studio/src/schemas/index.ts`**: cập nhật `DEFAULT_PROJECT_DATA` (statusNotice, previewNotice, activities, plannedStages, safetyPractices, progress → tuần 2/5, `updatedAt '2026-10-12'`, plannedSessions), `DEFAULT_JOURNAL_DATA` (hai bài như C18), `DEFAULT_FINANCE_DATA.overview.disclaimer` (bằng đúng `FINANCE_OVERVIEW.disclaimer` của C18), `DEFAULT_TEAM_DATA` (`members`, `areas`, `productFaqs`, `transparencyFaqs`) sao cho **bằng từng ký tự** giá trị C18. Không đổi `contacts`, `donationAccount`, `ledgerProcess`, `supportFaqs`, `faqs`, `siteMeta`, `products`.
3. **`apps/studio/src/ui/html.ts`**: chuỗi dự phòng `'proposal-final'` (khoảng dòng 1393) → `'proposal-v3'`. Không thay đổi nào khác về giao diện.
4. **Kiểm thử chống lệch**: thêm vào bộ kiểm thử của Studio một bài khẳng định các giá trị mặc định ở mục 2 bằng (deep-equal) giá trị `BASELINE_*`/`journal-entries.json` tương ứng (project: sessions, activities, stages, safetyPractices, progress; team: members, areas, productFaqs, transparencyFaqs; journal; finance.overview.disclaimer). Điều chỉnh mọi kiểm thử cũ đang gắn cứng 24/10, 31/10, tuần 1, `proposal-final`; nêu lý do từng điều chỉnh, không xóa kiểm thử.
5. Chạy và ghi exit code: `npm run studio:build`, `npm run studio:typecheck`, `npm run studio:test`, `npm run check`, `npm test`, `npm run build` (preview build như trước), tại workspace chính.
6. Báo cáo vào `docs/evidence/C18/studio-sync/worker/report.md`, rồi `worker_done` và dừng.

## Không làm

Không deploy Worker, không chạm D1/R2/Cloudflare, không push, không đổi `wrangler*`, không tạo token, không sửa Access. Việc cập nhật bản nháp D1 production do Claude thực hiện riêng sau khi review.
