# P1 — Five bounded owner fixes on the existing public design

This is NEW work, not a redesign restart. Owner authorizes implementation and local preview only. **Codex coordinates/architects/reviews; Claude term_30bd26c0-5682-499f-9fdb-0247bf0e01ca is the sole application coder.** No other agent/coder/AGY. Earlier R4 is cancelled and remains untouched. Do not consume old briefs/heartbeats as work authorization.

## Baselines and exact ownership

- Public: `C:/Users/tuana/orca/workspaces/mang-theo-mot-net-ve-atelier/public-owner-fixes`, branch `tuananh-rd/public-owner-fixes`, created by Orca directly from fetched `origin/main` **c200813dac24d7627ce3d4a89efeac9aaab6316f**. Remote main verified by fetch and ls-remote on 24 October 2026. Do not update local main.
- API/Studio patch only: `C:/Users/tuana/orca/workspaces/mang-theo-mot-net-ve-atelier/public-phone-api`, branch `tuananh-rd/public-phone-api`, from committed C23 **fd79daa0e88b3f3c1f1c735c098817d4934705f1** (before C24/C25). Public origin/main has no online API; C23 report identifies separate C17 backend. Only narrow backend changes specified below here. **Never copy its Layout/site/UI files into public checkout, merge its branch, or deploy it wholesale.**
- Verify both Git heads/status and ACK ownership/plan before edits; then proceed autonomously. Your terminal attachment is the original workspace: every shell cwd/edit must explicitly be one of these new targets, never attachment workspace, atelier/R3/R4/old C17 or C18-v3. Preserve all existing dirty files, commits and experiments. No reset/clean/delete/revert/cherry-pick from experiments.
- Claude owns scoped application/tests/assets and `docs/evidence/P1/worker/` (public) plus `docs/evidence/P1-api/worker/` (backend if useful). Codex owns this brief and `docs/evidence/P1/review/`. Explicit local commits per checkout, no add -A/amend.
- Old cancel draft was read/show-verified in Claude TUI, cleared with one raw Ctrl-C without Enter/command execution, then read verified empty before this new Dispatch.

Read `AGENTS.md`, project instructions, `docs/brief.md`, `docs/architecture.md`, `docs/workflow.md`, relevant C23 report, current component/data/helper sources and backend `apps/studio/README.md`, preorder tests/schema/publish adapter. Historical docs have obsolete amounts/roles; current owner request/data and Claude ownership override them. Existing design/theme/colors are frozen.

## Exact scope

### 1. Home plan figures

In the actual Home section shown in screenshot #1 (currently `src/pages/index.astro` plan-glance section; do not edit an unused KeyFigures component blindly):

- `Kế hoạch trong một cái nhìn` → **`Tổng quan kế hoạch`**.
- `Sinh viên Lăng Kính` → **`Thành viên nhóm Lăng Kính`**.
- Note for four activity corners → **`Mỗi em được tự do chọn lựa và vui chơi`**.
- Keep all four figures and all other text/layout/colors unchanged.

### 2. Remove only the floating hero caption box

Remove the Home hero floating box reading `Ảnh minh họa chuồn chuồn gỗ họa tiết dân gian do chủ dự án cung cấp — chưa phải sản phẩm thực tế của nhóm.` shown in screenshot #2. Keep truthful image alt and product-reference labels/captions wherever needed. This does not turn the illustrative blue dragonfly into an actual item for sale. No hero redesign or other caption removal.

### 3. Owner confirms stage 2: fundraising

Project status becomes **`CHẶNG 2 — Gây quỹ`** (case per requested visible label). Synchronize Home/project/timeline/footer/status usages from common source, no stale `Chặng 01 ... Đang thực hiện` elsewhere. `currentStageIndex` is 0-based: **0 → 1**, corresponding to plannedStages step `02`, title `Gây quỹ`. Existing timeline derives prior stages as complete (`i < currentStageIndex`), so stage 1 completion is an implied mapping only; document it, do not invent additional outcome records.

**Do not change** currentWeek 2, totalWeeks 5, `updatedAt: 2026-10-12`, planned dates 31/10/2026 and 07/11/2026, times, receipts/donations or any other amount. Owner confirmation is the evidence for stage only, not a new date of update. Keep stage label and active index consistently derived/shared rather than UI hardcoding.

Audit publication snapshot/Studio authority that could overwrite source later. Backend C23 defaults currently have `DEFAULT_PROJECT_DATA.statusNotice` and `.progress.currentStageIndex: 0`, publish adapter copies these fields, and Studio UI edits them. Update minimal defaults/contract where needed in the isolated backend, preserving every unrelated field. Existing production D1 project revisions/snapshots are **not** changed by a source-default patch: report exact field mapping and future owner-approved synchronization/republication needed. Do not bypass snapshot integrity/hash validation, pin an unoverrideable stage forever or fabricate timestamps.

### 4. Owner-supplied keychain photo

Original: **`D:/Downloads/materials web mtmnv/ảnh móc khóa.jpg`**. View the real file before conversion. Coordinator has viewed it: a hand holds the complete rectangular blue printed keychain with ring and chain; this is not evidence for new material/dimension claims. Owner explicitly authorizes use for preorder, no reconfirmation.

- Preserve original outside public untouched. Create optimized WebP derivative, strip EXIF/XMP/other metadata, no AI edits, no generative processing or upscaling. Use existing tools, no new app dependency.
- Register/resolve image via shared product detail data, then show it in keychain catalogue/card, preorder selected-product presentation where appropriate, and detail page. Use same shared source, no duplicated hardcoded image path across templates.
- Keep the entire ring, chain and keychain visible at desktop/mobile; use contain/scoped full-product framing when old aspect ratios would crop it. Keep current design/theme, truthful alt and a modest owner-photo/sample caption. Do not invent dimensions/materials/benefits or imply all motifs/material facts are confirmed.
- Inspect snapshot `mediaKey`/approved media registry behavior and future Studio publication. If a backend registry/storage synchronization is required later, prepare/report the artifact/mapping only; no production R2 upload/mutation. No private source image bundled in dist.

### 5. Phone required for new preorders, client AND server

- Public `src/pages/san-pham.astro`: remove `(không bắt buộc)` from phone label, add required and consistent client validation with Vietnamese error messages. Preserve required email, honeypot/consent, idempotency/retry, pickup behavior, pricing and success/error behavior. Use the existing form, no new ordering flow or redesign.
- Backend C23 `apps/studio/src/preorders/service.ts` currently accepts blank phone (`if (phone && ...)`). Reject missing/empty/whitespace/non-string and invalid phones with a 400 Vietnamese error for **new** orders before persistence/email. Accept common valid local/international formats, e.g. `0984 441 726` and `+84984441726`; normalize/validate sensibly and consistently on both sides, reject inputs made only of separators or prohibited characters. Do not add a new dependency or change server price authority.
- Legacy orders with null/absent phone remain readable/manageable/exportable. **No backfill/delete/update of old orders, no NOT NULL migration breaking history.** Preserve idempotency semantics for valid retries and anti-spam/rate limits. Test history read/admin/export and new validation separately.
- Use fixture/emulator/local API only. No POST to production, no real emails/recipients, no production D1/R2/config changes. Existing source defaults/config are not proof of currently deployed API; state that limitation and list the precise backend artifact to deploy only after owner review. No secret output.

## Invariants and exclusions

No redesign/theme/color/type/layout overhaul; no atelier/R3/R4/C24/C25 app code. Astro/TS/CSS/dependencies/lock unchanged except existing npm ci. Finance algorithms/actual ledger/private reference IDs unchanged. Goal **7000000**, prices **40000/10000**, QR/Techcombank **NGUYEN CHI TRUNG — 19077352683012** unchanged. Never expose transaction reference identifiers. No push, merge main, deploy, real preorder/email, live D1/R2 or environment mutation. Original worktrees remain intact.

## Observable acceptance and handback

1. ACK target heads/branches/sole ownership and mapping, send task receipt/progress. Ask architectural blockers via the new Run; use exact new preamble lifecycle IDs. This new task overrides old cancel text for these five changes only. If Orca routes guidance to the terminal's old coordinator Run, read the named mailbox without reviving old tasks; lifecycle reports go to the new Run.
2. Public `npm ci`, check/tests/build with exact command/exit codes. API isolated checkout install/build/typecheck/tests appropriate to `apps/studio` (root scripts and app scripts read first), targeted integration fixtures covering missing/null/blank/invalid phone, valid phone+required email, success/error, retry/idempotency/spam, unchanged price authority, historical no-phone administration. Keep tests meaningful; don't add regex tests just to mirror static text replacements.
3. Loopback preview **http://127.0.0.1:4383/** from the public build only, leave running. Noindex using preview-only configuration/flags if needed, do not accidentally alter production metadata. Local API endpoint/fixture for form (`127.0.0.1:4331` is current public form's local base; check for existing ownership/conflict, never commandeer an unrelated listener). A fixture/local server may be reviewer/worker evidence tooling, not a production configuration change.
4. Screenshots 375×812, 768×1024, 1440×900: Home full+affected sections, project progress, keychain card/detail/form selection and phone validation/success/error with fixture only. Check full product visible, no overflow, no blocked controls, internal routes/menu/FAQ/form/prefill work. Capture before/after where helpful, preserve old design.
5. `docs/evidence/P1/worker/report.md`: both code/documentation SHAs and baseline SHAs, explicit file lists/ownership, stage mapping and unchanged week/date checks, image original/derivative sizes/hash/metadata-stripping method, fixture scenarios/results, commands/exit codes, preview URL/PID/cwd, independent deploy artifacts needed for static site versus API/Studio and future snapshot/D1/R2 synchronization. No claim production updated, no AA/CWV claim, list real limits.
6. Worker_done once for the new Task/Dispatch only after scoped work/validation/commits. Codex reviews exact diffs and browser independently; any app fixes remain Claude's. Owner review gates release, not implementation.

## Owner screenshot references

All under `C:/Users/tuana/AppData/Local/Temp/`:

- #1 `orca-paste-1792831025902-d6267c67-942c-4748-86b4-0a72dffec162.png`
- #2 `orca-paste-1792831214479-c114722a-a94d-40f8-b5d7-8ce0dfa05e94.png`
- #3 `orca-paste-1792831264085-4041eec9-bc88-45cf-bffd-7eb7184d5ce1.png`
- #5 `orca-paste-1792831356000-ff2f0f90-c16a-40d6-b352-22492bc763b8.png`
