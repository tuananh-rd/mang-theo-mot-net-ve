# P1 coordination checkpoint and independent review plan

This is new owner-authorized maintenance on the existing public design, not a restart of any redesign. Codex coordinates/reviews only; Claude is sole application coder across the two explicit isolated checkouts. No other agent launched.

## Baselines and receipt

- Fetched origin/main and verified remote ls-remote: `c200813dac24d7627ce3d4a89efeac9aaab6316f` (C23 spacing fix). Local main was not moved. Public checkout `C:/Users/tuana/orca/workspaces/mang-theo-mot-net-ve-atelier/public-owner-fixes`, branch `tuananh-rd/public-owner-fixes`, spec commit `ad81dc5`.
- Public main does not contain the online API. Backend patch checkout `C:/Users/tuana/orca/workspaces/mang-theo-mot-net-ve-atelier/public-phone-api`, branch `tuananh-rd/public-phone-api`, committed C23 baseline `fd79daa0e88b3f3c1f1c735c098817d4934705f1`, before C24/C25. It is not a source for public layouts or a wholesale deploy candidate.
- Old cancel draft was explicitly read in Claude TUI, then cleared with a single raw Ctrl-C (no Enter, no shell command); read verified empty before new task injection.
- New Run `run_238a06596d5e`, Task `task_dda3c1fd9763`, Dispatch `ctx_a9bf520a2a7d`. Worker-start returned turn_start_unobserved; explicit ACK `msg_2217701b9046` confirms both clean target heads/branches and ownership. Do not duplicate a live worker because startup observation was inconclusive.
- Previous R4 cancellation remains settled and its dirty files/commits preserved. No old lifecycle IDs reused. Main/old C17/C18-v3/atelier/R3/R4 are excluded from edits.

## Review

1. Inspect exact public and backend code SHAs against their respective baselines. Preserve original theme/colors/shared shell; only requested text/caption/stage/image/phone changes. Financial numbers, bank/QR/private transaction projection, dependencies and production config unchanged.
2. Stage: currentStageIndex 1 = step02 Gây quỹ; all status/timeline displays agree, previous stage marked complete only by existing schema mapping. Week2/5, updatedAt2026-10-12 and both planned session dates/times unchanged. Trace Studio defaults, snapshot precedence and publication fields, report production synchronization separately without mutation.
3. Keychain: compare original hash before/after, actual WebP dimensions/metadata and full-product rendering (ring+chain+rectangle) in shared catalogue/card/detail/selected preorder presentation. Truthful alt/caption, no fabricated material/dimension; future approved-media/R2 linkage documented separately.
4. At delivered SHAs run appropriate check/tests/build and API tests. Independent local API calls must use disposable fixtures/emulator, never production. Verify missing/null/blank/non-string/invalid phone400 and Vietnamese message, valid local/international number accepted, email still required, valid idempotent retry/no duplicate, server price authority/rate-limit/honeypot retained, historical null-phone read/admin/export.
5. Public browser at375/768/1440: Home and requested section/caption/stage, project timeline, products/keychain detail/form. Inspect screenshots, crop/contain and overflow, menu/Escape/FAQ/skip/routes/anchors and product prefill. Intercept/fixture form requests, test native+custom phone validation, error/success with no real orders/emails.
6. Record preview4383/PID/cwd and exact artifact separation: static public patch versus API/Studio validation/defaults/media/snapshot steps that require a later approved release. No push/merge/deploy/production D1/R2/config changes, no CWV/AA or deployed-SHA claims.

The coordinator viewed all four owner screenshots and the original keychain JPG before briefing Claude. A read-only production page lookup through the web tool was inaccessible; origin/main is verified, actual deployed Git SHA is not independently exposed/proven by that lookup.

## In-flight architecture guidance

- `msg_3458bf6226ce`: selected keychain image is also required in the preorder presentation, from shared data; missing/null/non-string phone must not bypass the new-input requirement through legacy contact fields. Historical stored-record compatibility is tested separately. Claude changed the new API phone extraction to require an explicit string field; compiled/fixture verification pending.
- `msg_17dd3ebd69bf`: the Studio drift guard exposed its updated project default versus old backend root `BASELINE_PROJECT_PROGRESS`. Narrow backend `src/data/campaign.ts` stage/status fallback synchronization is authorized, preserving week/date/finance and all layouts. Do not weaken the guard. Missing static/SSR build artifacts are test prerequisites, not justification to skip Studio checks. No backend site/Layout is copied into the public checkout.
