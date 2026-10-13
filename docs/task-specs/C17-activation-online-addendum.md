# C17 activation — manager addendum (13/10/2026)

Applies to docs/task-specs/C17-activation-online.md. Manager: Claude. Worker: Antigravity (one worker). Baseline: HEAD of task/c17-online-studio at d04efc8 or later (F3-R1 PASS at code 17cd429).

## Facts provided by the owner

- Admin and Reviewer identities are in the PRIVATE file `C:\Users\tuana\.mtmnv-private\studio-identities.json` (outside the repo). Read it only at run time (env STUDIO_ADMIN_EMAIL / STUDIO_REVIEWER_EMAIL); never print the addresses, never write them to repo files, reports, evidence, logs, commit messages, wrangler.toml or fixtures. Redact in evidence ("<admin>", "<reviewer>").
- Cloudflare account id ce11030376680d55523c6636de073814; zone mangtheomotnetve.website; Pages project mang-theo-mot-net-ve exists and must not be touched. wrangler OAuth login exists on this machine (do not print tokens). Access and R2 APIs were reachable on 12/10; no Studio resources exist yet (re-inventory first).
- The Access team domain is NOT confirmed (an earlier value was a guess). Obtain it truthfully: create the Access application first, then read the real login redirect (`Location` of an unauthenticated request to the protected hostname → `https://<team>.cloudflareaccess.com/...`) or the Access organization API if permitted. Never invent it; AUD comes from the created application.
- No GitHub token has been provided: do NOT create or request one; GITHUB_TOKEN stays unset so publication reports `not_configured`. DEPLOYMENT_WEBHOOK_SECRET may be generated locally and stored only as a Worker secret without echo, or left unset (fail-secure).

## Required order and gates

1. Inventory (read-only) and write a resource plan under docs/evidence/C17/activation/worker/ before any create. Names: Worker `mang-theo-mot-net-ve-studio-prod`, D1 `studio-d1-prod`, R2 `studio-media-prod` (private), hostname `studio.mangtheomotnetve.website`.
2. Resolve which artifact is the deployable production Worker (apps/studio worker.ts vs Astro preview server bundle) and prove, with a local supported-runtime test against the exact build you will deploy, that /, /api/*, /media/* and the private draft preview all work with production vars and DEV identity rejected.
3. Create D1/R2, apply migrations, run tools/content-studio/bootstrap-production.mjs for schema+5 modules+22 media+two users from the private file, upload approved media bytes to R2 at the keys the registry/schema expects. Verify counts by querying remotely (no PII in logs).
4. Create the Access application (self-hosted, hostname above, one-time PIN, explicit allow policy for the two emails only) and DNS/custom domain through the supported mechanism; set vars CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD from reality; deploy the exact reviewed build.
5. Verify: unauthenticated request redirects to Access login (record status/Location host only); no bypass; /media unauthenticated denied; production rejects x-dev-user/dev_role. The owner will complete the real OTP login; do not fake it. Record deployment id, artifact hash, real SHA.
6. Report reports/c17-activation-online-antigravity.md and docs/evidence/C17/activation/worker/ with sanitized evidence; list anything not verifiable (real OTP login, GitHub publication).

Constraints: no unrelated Cloudflare changes, no billing upgrade, no Pages/main-site changes, no push/merge, no stage-all/reset/clean/stash, hard timeouts, ask the manager (orca orchestration ask) before any destructive or irreversible action not listed. Preserve user store and dirty docs. Heartbeat every 5 minutes; check messages before worker_done.
