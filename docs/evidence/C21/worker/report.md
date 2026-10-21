# C21 worker report — transaction reference privacy

## Changes

The public donation model and projection no longer include `reference`. The public ledger table and `/dong-hanh` copy no longer show or mention transaction codes; donor guidance uses transfer date, amount, and the `MTMNV` transfer memo. Public CSV tools now omit transaction references from projected JSON and API responses while retaining references in CSV parsing and reconciliation inputs.

Studio keeps the raw `id`/`reference` for CSV import, duplicate prevention, private editor display, and audit. Its finance publication adapter now projects only date, amount, and approved donor name. The adversarial publication test verifies the raw reference stays in the Studio draft but is absent from the snapshot and publication response, including its last-four suffix.

## Previously exposed files

- `src/data/campaign.ts`: public `DonationEntry.reference` and public ledger projection copied shortened references.
- `src/components/DonationLedger.astro`: public search and table exposed the shortened reference.
- `src/pages/dong-hanh.astro`: public copy described the shortened transaction code as displayed information.
- `apps/studio/src/publish/adapter.ts`: approved publication snapshot included the last four characters.
- `tools/content-studio/csv-validator.mjs`, `tools/content-studio/cli.mjs`, and `tools/content-studio/server.mjs`: public JSON projection/apply paths included the last four characters.
- Studio UI previously labeled the private value as a masked reference; it now labels it internal and unpublished. CSV input continues to retain the private source value.

## Verification

- Studio branch `task/c17-online-studio`: `studio:build`, `studio:typecheck`, `studio:test` (91/91), `check` (0 errors), `test` (98/98), and `build` passed.
- Public branch `task/c18-v3-content`: `check` (0 errors), `test` (93/93), and `build` passed. `dist` scan found no transaction-code labels, reference suffix, or private test sentinels. Its ledger remains `reconciled: false` with `entries: []`; the published snapshot source is absent in this branch.
- Studio gates were attempted in the public worktree and each returned npm `Missing script`: this branch has no `apps/studio` directory and no `studio:*` scripts. The C21 spec prohibits importing Studio-only code into this branch, so these three gates cannot be made runnable there without changing the specified scope.
- The Studio adversarial test checks the snapshot and API publication response for the unique private reference sentinels. The main branch published snapshot source has no `reference` key or sentinels. Goal and recipient remain `3,000,000đ`, Techcombank, `NGUYEN CHI TRUNG`, `19077352683012`.

No D1/Cloudflare remote data was accessed; no push or deploy was performed.
