# C20 worker report: preorder

Date: 2026-10-21  
Task: C20-preorder  
Implementation branch: `task/c17-online-studio`  
Public-only changes: `task/c18-v3-content`, based on `origin/main` (`0f028bb`)

## Delivered

- Added persistent D1 preorder tables, a public preorder Worker API, and an authenticated Studio workflow for product settings, order search/filter/detail, status changes, internal notes, CSV export, and test-order archival.
- Added the public form to the product page for the two existing craft products only: `chuon-chuon-tre-kem-de` and `moc-khoa`. Planned food campaign entries are not orderable.
- Default configuration is closed, with no official price and no pickup instructions. Opening a product requires pickup instructions; the official price may remain `null` and is always read server-side. Client-supplied prices are ignored.
- Removed public preview banner, global `noindex,nofollow`, and preview wording on the 404 page. Kept the private Studio preview badge and necessary public disclosures about planned activity, reference prices, pending confirmation, finances, source provenance, and child privacy.

## Data and privacy

Order details are stored in separate D1 tables and are not part of public snapshots or website bundles. Logs and audit events omit customer contact data; rate limiting stores a salted IP hash by day. CSV export is limited to Admin and Reviewer roles, adds a UTF-8 BOM, quotes fields, and neutralizes spreadsheet formula prefixes. Only Admin can change product settings or archive a synthetic test order.

The local browser run created synthetic contact data (`E2E Sample`, `e2e@example.invalid`) in the local emulator and archived its `isTest` order. It did not use a real customer's data. Evidence includes the local scripts, result JSON, and desktop/mobile screenshots in this directory.

## Verification

- `npm run studio:build` — passed.
- `npm run studio:typecheck` — passed.
- `npm run studio:test` — 90 passed, 0 failed.
- `npm run check` — passed with existing warnings in unrelated dirty documentation/evidence files.
- `npm test` — 97 passed, 0 failed.
- `npm run build` — passed; 13 static pages generated.
- Local E2E — desktop 1440×1000 and mobile 390×844; mobile had no horizontal overflow. Verified public submission, Studio listing, Reviewer status/history, authorized CSV encoding, and Admin archival of the `isTest` order. See `e2e-results.json`.

### Public worktree follow-up

The public commit `d62e0fb` restores `src/layouts/Layout.astro` to the `origin/main` implementation before removing only the preview banner and `noindex` meta tag. It contains no Studio snapshot-loader import or `seoRoute`/`routeSeo` changes; the four files in the public commit were checked for Studio-only references. On that public worktree, `npm run check` passed with 0 errors, warnings, or hints; `npm test` passed 93/93; `npm run build` generated 13 pages; and `dist` contained neither “Bản xem trước” nor `noindex`.

The API tests cover persistence after emulator restart, idempotency, input and product validation, closed-product rejection, honeypot and rate limiting, role access, server-side price, CORS/body limits, CSV injection protection, migration idempotence, and exclusion of customer fields from public config.

## Production setup required after review

No remote D1, Worker route, Cloudflare setting, deployment, or secret was changed by this task. Before opening orders, the maintainer must:

1. Apply `apps/studio/migrations/0002_preorders.sql` to the intended production D1 database.
2. Configure a strong `RATE_LIMIT_SALT` secret for the public Worker; keep `PREORDER_TEST_MODE` disabled in production.
3. Route `mangtheomotnetve.website/api/preorders*` to the public preorder Worker and configure the production origin for CORS. Keep Studio admin endpoints behind Access.
4. Verify each product's current D1 official price and pickup instructions against the project owner's confirmation before publishing any further snapshot.
5. Decide who contacts customers, the actual pickup process, and the retention period. A recommended policy is to minimize or delete contact details after fulfillment/cancellation and a documented retention period; no automatic expiry is implemented.

The current scope does not restore a previous donation recipient or change any campaign recipient, payment flow, ledger, QR code, or fundraising claim.

## C20 preorder activation follow-up — 2026-10-21

The project owner confirmed that preorder is open for `chuon-chuon-tre-kem-de` at 40,000đ/set and `moc-khoa` at 10,000đ/item. Both public and Studio product defaults now carry `preorderOpen: true`, the confirmed `officialPrice`, and pickup text `Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước`. `saleStatus` remains `unconfirmed`; the card and page status labels derive from `preorderOpen`, and the official-price label derives from `officialPrice` rather than `publicApproval`.

The public content removes the obsolete week 6/week 7–8 opening and delivery claims. It now says preorder is open, unpaid, and that the group will confirm pickup method and schedule after each preorder; no delivery date is stated. The preorder price-reference note remains available for products with a null price and is hidden when a positive confirmed price is present. The donation recipient, QR, goal, and unreconciled ledger were not changed.

Studio publication defaults and validation require a positive official price and pickup instructions when preorder is open, while allowing `saleStatus: unconfirmed`. The snapshot loader validates and carries `preorderOpen`, `officialPrice`, and `pickup`; the publication adapter preserves those values. A parity test covers both products in the default Studio snapshot, and the public product model test covers rendering the published preorder state without changing `saleStatus`.

### Follow-up verification

- Studio branch: `npm run studio:build`, `npm run studio:typecheck`, and `npm run studio:test` passed (91 tests); `npm run check` exited 0 (0 errors, 0 warnings, 40 existing hints); `npm test` passed 99/99; `npm run build` generated 13 pages.
- Public `task/c18-v3-content` branch: `npm run check` passed with 0 errors, warnings, or hints; `npm test` passed 94/94; `npm run build` generated 13 pages.
- Local preview review used 1440×1000 desktop and 390×844 mobile viewports. In both, the hero and both product cards displayed “Đang nhận đặt trước” and “Giá niêm yết”; the form showed the confirmed price and pickup text, and hid the reference-price note. Mobile `scrollWidth` was 390px for a 390px viewport. The preview supplied a local-only mock response for `GET /api/preorders/config`; no form submission or production service was used. Screenshots are in `preorder-followup/`.
- No remote D1, Wrangler, Cloudflare, deploy, push, or production setting was touched.
