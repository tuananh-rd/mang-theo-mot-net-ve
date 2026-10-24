# P1 independent review findings in progress

Claude remains the only application coder; Codex has not edited application code. Findings go through the active P1 Dispatch, never a cancelled redesign Task.

## P1-01 — explicit phone input for new API requests

The initial service change still accepted missing/null `phone` by reading a valid legacy `contactType=phone` / `contact` field. Owner requires missing phone rejection for new requests; historical stored records are a separate compatibility concern. Guidance `msg_3458bf6226ce` requested explicit new-input enforcement and fixtures with legacy fields still present. Source now requires an explicit string; independent compiled-handler verification is pending handback.

## P1-02 — Studio default/fallback drift

The full Studio test correctly failed its drift guard after `DEFAULT_PROJECT_DATA.progress.currentStageIndex` became1 while backend root baseline remained0. Week2/5 and updatedAt2026-10-12 must stay unchanged. Guidance `msg_17dd3ebd69bf` authorized only stage/status synchronization in backend root `src/data/campaign.ts`, without weakening the guard or copying any Studio Layout/site into the public tree. Missing SSR/static build artifacts were also found as full-suite prerequisites; any residual unrelated runtime limits must be reported, not hidden by skipped assertions.

## P1-03 — successful form still rendered despite hidden flag

Independent screenshots showed input fields still visible after a fixture201 success. DOM `form.hidden` was true, but author CSS `.section-preorder form { display:grid }` overrides the user-agent hidden rule. This also risks leaving a live form after confirmation. Evidence: [375 before fix](screenshots/before-fix-hidden-success-375.png), [initial measurements](initial-browser-review.json).

The first probe checked only the hidden property, so its initial passed flag was insufficient; visual review caught the defect. The revised probe checks actual layout rectangles plus in-view confirmation. Guidance `msg_1f9af1e8ad02` requests a narrow scoped hidden rule and visible/focused success confirmation. Pending final verification.

## Already observed

The coordinator viewed the original JPG and WebP. Independent RIFF/SHA checks show the original unchanged, derivative466×622 (full frame), 25,214bytes versus51,138bytes source, no EXIF/XMP/ICC chunks. Home/project/catalogue/keychain detail have no horizontal overflow at375/768/1440; required labels and stage2 status present; Vietnamese missing/invalid phone messages and zero fixture POSTs on invalid input, error/retry/success paths and idempotency key reuse observed. Actual final success visibility is not yet signed off.
