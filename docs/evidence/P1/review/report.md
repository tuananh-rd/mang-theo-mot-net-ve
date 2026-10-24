# P1 independent review — PASS for local preview, not released

Codex reviewed; Claude was the sole application coder. This is maintenance of the existing public design, not a redesign restart. No push, merge, deploy, production order/email or live D1/R2/config operation occurred.

## Exact candidates and scope

| Candidate | Baseline | Reviewed code / checkout HEAD |
| --- | --- | --- |
| Public `tuananh-rd/public-owner-fixes` | fetched and ls-remote verified `c200813dac24d7627ce3d4a89efeac9aaab6316f` | initial code `9474fcf26d2b53ebf772cd652608d9b222a4e690`, final form fix **`d87e57c2173c0b5d4695f0e4a2e84f3abb41c919`**, documentation HEAD `d53dd6ebb568b30281f6aad76c40641a6cd89a87` |
| API `tuananh-rd/public-phone-api` | committed C23 `fd79daa0e88b3f3c1f1c735c098817d4934705f1`, before C24/C25 | code **`63c45f7aa93ab9555a2c732d8c7d0bf75c180ebe`**, documentation HEAD `f4adafb3a51d8c065a5e8e00b91785c14340e09b` |

Both worktrees were created by Orca, separately from all old experiments/dirty worktrees. The old cancel draft was read/show-verified in Claude TUI, cleared without submitting it, and verified empty before the new Task. New Run `run_238a06596d5e`, Task `task_dda3c1fd9763`, Dispatch `ctx_a9bf520a2a7d` completed successfully; Claude retained for the owner's next instruction. No cancelled lifecycle reused.

Public diff is limited to Hero, ProductGrid, campaign stage data, shared product image detail, Home texts, product/form/detail templates, one WebP and five scoped contract tests. Shared Layout/global styles/theme, finance/donation helpers, reconciled ledger, product pricing config, QR, package/lock and Astro config are unchanged. API changes are phone service, project defaults/fallbacks, the Studio fallback index, backend baseline stage/status and five phone/history tests; auth/email/DB schema/migrations/config/locks and the existing drift guard are unchanged. [Exact file/protected-path audit](repository-review.json). No Studio Layout/site was copied into public.

## Five requested outcomes

1. Home now reads **Tổng quan kế hoạch**, **Thành viên nhóm Lăng Kính**, **Mỗi em được tự do chọn lựa và vui chơi**. The figures and other content remain unchanged. [Desktop](screenshots/home-plan-1440.png), [mobile](screenshots/home-plan-375.png).
2. Only the floating Home hero caption component and its styling were removed. The truthful blue-dragonfly alt remains; reference labels in product contexts remain. This removal does not identify the illustrative photo as actual sale stock. [Hero](screenshots/home-1440-viewport.png).
3. `CURRENT_STAGE_INDEX=1` selects planned stage02 **Gây quỹ**; Home/project/footer status derives **CHẶNG 2 — Gây quỹ** from the common public source. The progress header shows **Chặng 02: Gây quỹ (Đang thực hiện)** at all three viewports. Index0 becomes prior/past under the existing noncompact progress mapping; no separate completion/outcome record was invented. Week2/5, updatedAt2026-10-12 and planned sessions31/10/2026,07/11/2026 retain their dates/times. Backend defaults and BASELINE were synchronized without weakening the drift guard. [Progress375](screenshots/project-progress-375.png), [navigation/stage measurements](navigation-review.json).
4. Owner photo is shared by catalogue, detail and selected-product preorder preview. Full ring/chain/rectangle retained with contain framing. Original JPG SHA remains `a49b473d310bd2c88c585fa16093ccbdb1de4293637967da5dde26992a144477`; source51,138B → WebP25,214B,466×622, SHA `bcd18df918f976e6ec805351399712e544204d5214e677532bdf69e05f91a2d1`. Independent RIFF inspection finds only VP8, no EXIF/XMP/ICC; no upscale or AI edit. Truthful sample alt/caption, no new material/dimension claim. [Image audit](image-review.json), [preorder375](screenshots/preorder-photo-375.png), [detail768](screenshots/keychain-768-full.png).
5. New requests require an explicit string phone on both client and API, plus required email. Missing/null/blank/non-string/invalid phone receives Vietnamese400; old contact fields cannot bypass it. Local/international formats normalize consistently. Valid retry idempotency, server prices, honeypot/CORS/rate limits remain. Historical null-phone records can be listed, managed and exported without backfill or a new NOT NULL migration. [Independent20-case API probe](api-review.json).

Goal7,000,000VND, prices40,000/10,000VND, Techcombank NGUYEN CHI TRUNG /19077352683012 and QR are unchanged; no private transaction reference was added to output.

## Independent validation

| Command / method | Result |
| --- | --- |
| Public `npm run check` | exit0,0 errors/warnings/hints |
| Public `npm test` | exit0,101/101 |
| Public `npm run build` | exit0,13 pages |
| API `npm run studio:typecheck` | exit0 |
| API `npm run studio:build` | exit0 |
| API `node --test apps/studio/tests/preorders.test.mjs apps/studio/tests/preorder-phone.test.mjs apps/studio/tests/drift-prevention.test.mjs` | exit0,15/15 |
| Independent compiled-handler probe |20 scenarios passed; fresh in-memory SQLite, no network/email binding, exactly2 fixture orders |
| Independent browser |12 page/viewport cases at375×812,768×1024,1440×900; one H1 and zero horizontal overflow; selected image/prefill, missing/invalid phone,503 error/retry and201 success all passed |
| Navigation |9 routes200/noindex; skip-link to main, mobile menu/Escape, native FAQ Enter/Space passed |

[Public command exits](check-results.json), [API command exits](api-check-results.json), [browser measurements](browser-review.json), [route/keyboard measurements](navigation-review.json). Worker additionally ran npm ci in both targets, full Studio98/98 after building its static/SSR prerequisites and synchronizing defaults, and backend root101/101; the final full-suite log was read and verified (`studio-test-3.log`, exit0). Earlier setup/drift failures are retained in worker evidence and resolved.

Browser methods are independent Chrome CDP9394/DPR1. Browser preorder requests were mocked before application startup (explicit local-only order code); actual compiled API handlers were tested separately with ephemeral SQLite and skipped email binding. Worker also supplied real loopback HTTP fixture4331. No production POST was attempted. The embedded Orca browser viewport command failed its connection; independent Chrome was used instead, without restarting Orca or disturbing other work.

## Findings resolved

All [in-flight findings](findings.md) are resolved: explicit phone input replaces the legacy fallback; Studio baseline/default stage values agree and the drift test remains intact; author CSS no longer overrides form hidden state. The final success check asserts **no rendered form rectangles** and an **in-view confirmation**, not merely the hidden DOM property. [Before375](screenshots/before-fix-hidden-success-375.png), [after375](screenshots/form-success-375.png). Menu/routes and theme remain functional.

Worker accidentally included coordinator review files in documentation commit62d24c4, then removed them from the index in7f11268 while preserving all files on disk; history was not rewritten. Codex commits the final owned review evidence separately. This did not alter the application candidate or copy experimental UI into it.

## Preview and later release artifacts

**http://127.0.0.1:4383/** remains running, PID15864, cwd `public-owner-fixes`, built public dist only. Its evidence server adds X-Robots-Tag noindex/nofollow and robots Disallow; production metadata/source config is unchanged. Local fixture4331 remains running, PID36156, in-memory/test data only.

After owner approval, release must coordinate separate artifacts: public static build from final public code; API/Studio build from the isolated API candidate; persisted project revision/snapshot fields `project.statusNotice` and `project.progress.currentStageIndex` with week/date unchanged; approved keychain WebP media/R2 registration and `products.moc-khoa.mediaKey` linkage where Studio uses it. Existing production D1 revisions are not changed by defaults. Do not bypass hash/publication checks. There is no new P1 DB migration or email configuration.

The actually deployed Worker SHA and live stored snapshot were not inspected. Statements in worker notes about current production acceptance are an inference from the old code, **not a verified live-API result**. No claim is made that production currently enforces the new rule. Headless Chrome/emulated viewports and local DB/fixtures are the limits of this review; physical devices, Safari, field CWV/AA certification and production services were not tested.
