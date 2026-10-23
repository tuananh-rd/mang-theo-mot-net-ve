# C23 worker report

## Changes

- Updated the approved fundraising goal to 7,000,000đ in the public baseline and Studio defaults. The Techcombank recipient, unreconciled empty ledger, and 0% progress behavior remain intact.
- Removed the three `ve-nhom` hero image variants and their registry entries. The team page is text only.
- Added five distinct PageHero image compositions for project, journal, support, transparency, and product pages. The preorder link is available inside eligible product cards and selects/focuses the requested product in the form.
- Added required email and optional phone collection, email validation, and companion table migration `0003_preorder_email.sql`. A Worker `send_email` binding sends a customer confirmation and an internal notification after the order is persisted; status and bounded automatic retries are recorded. Admin and Reviewer can request a logged resend in Studio, and the private CSV export includes email with formula escaping.

## Studio D1 fields for Claude's production update

- `finance.donationAccount.goalAmount`: set to `7000000`.
- `project.transparencyFaqs[]`: update the FAQ question that names the fundraising goal to `7.000.000đ`.
- Apply `apps/studio/migrations/0003_preorder_email.sql` before enabling the public form's email status path. The migration is idempotent and stores email data in a private companion table.
- Configure the `EMAIL` `send_email` binding and set `PREORDER_MAIL_FROM`, `PREORDER_NOTIFY_TO`, and optional `PREORDER_REPLY_TO` in the Worker environment. Onboard and verify the sending domain first; addresses and credentials are intentionally absent from the repository.

## Verification

Both builds used local data and a fake email binding only. No real preorder, email, Cloudflare, D1, or deployment operation was performed.

| Worktree | Gates |
| --- | --- |
| Public C18 | `npm run check` passed (0 errors, 0 warnings); `npm test` passed (96/96); `npm run build` passed. |
| Studio C17 | `npm run check` passed (0 errors, 0 warnings; 40 existing hints); `npm test` passed (101/101); `npm run build` passed; `npm run studio:typecheck`, `npm run studio:build`, and `npm run studio:test` passed (93/93); `npm exec -- astro build --config astro.preview.config.mjs` passed. |

The local preview captures cover seven routes (five image heroes, text-only `/ve-nhom`, and the chuồn chuồn product detail) at 1440×900, 768×1024, 375×812, and 390×844. The Studio preview recorded 28 observations and 56 screenshots; all routes have no horizontal overflow, all internal links checked returned successfully, and the five hero images are visible at each viewport. Image heights on the five PageHero routes are 187–219px on mobile and at most 320px at 768px; the support image spans 680px at desktop and the product hero image stays within its 560px cap. The product detail is a separate existing 7/5 image and summary layout.

Evidence: `measurements-main.json`, `capture-main-preview.mjs`, and the `studio-*-hero.jpg` / `studio-*-full.jpg` captures in this directory.

## Production owner handoff

After review, Claude owns the production D1 migration, email-domain onboarding, binding/environment values, Access/route review, and deployment. The committed empty variables are placeholders; real sender and notification addresses must be configured outside the repository.

## Code commits

- Studio C17 changes: `f432734` plus migration-only commit `2f052d6`.
- Public C18 changes: `dca2faa`.

## C23 hero review correction

The missing desktop and tablet padding came from `var(--space-7)`, which is not defined in the spacing tokens; the declaration was discarded by the browser. The four reviewed cards now use valid 24px desktop and 20px tablet padding, while mobile keeps its existing 16px padding. Dự án and Ủng hộ cards are narrower and the Dự án card sits at the upper left so the child faces remain visible; all cards grow to fit their content without clipping.

Recaptured the four affected routes at 1440×900, 768×1024, 375×812, and 390×844 (16 observations, 32 screenshots). Measured padding is 24/20/16px at desktop/tablet/mobile; nested content bounds pass in all 16 observations, and no horizontal overflow was measured. Desktop card/photo intersection is 31.3% for Dự án, 33.3% for Nhật ký, 10.0% for Ủng hộ, and 18.1% for Minh bạch; this is a whole-photo area measure, not subject coverage. The Dự án and Ủng hộ cards leave the visible child faces outside their bounds; Nhật ký is a group scene with no single main character frame to measure, and Minh bạch contains no people. Updated evidence is in `measurements-main.json` and the `studio-{project,journal,support,transparency}-*` captures.
