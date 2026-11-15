# SIGN-615 Resume UI evidence

## Candidate and accepted direction

Candidate implementation: [`96616f99bd619130dda2b5757c19cf08f6c2b111`](https://github.com/signapse-group/signapse-ui/commit/96616f99bd619130dda2b5757c19cf08f6c2b111), based on current `origin/dev` [`28a57a0c8b318459badba21a5aa5d49f62c2ee04`](https://github.com/signapse-group/signapse-ui/commit/28a57a0c8b318459badba21a5aa5d49f62c2ee04).

The accepted flow is Resume in the Cronjobs Actions row/card, with schedule, execution, latest result and next run shown independently. The direction comes from [SIGN-578](https://signapse-group.atlassian.net/browse/SIGN-578) and [SIGN-28](https://signapse-group.atlassian.net/browse/SIGN-28), using the active Wide attachment 10267 and Mobile attachment 10268, both updated 2026-11-12. These captures are from the P0 fixture-backed test `cronjob wide and mobile renders preserve the approved list composition`; they do not call the live producer.

## Candidate renders

The paused-running row is shown wide; the mobile card shows a paused idle job after a failed run. Both use the normal list entry path and place the labeled Resume control in Actions. Light and dark captures retain the field separation and action placement.

- Wide, dark, English, expanded sidebar, 1520×1024: [candidate render](cronjobs-resume-wide-dark-en-1520x1024.png)
- Wide, light, English, expanded sidebar, 1520×1024: [candidate render](cronjobs-resume-wide-light-en-1520x1024.png)
- Mobile, dark, Vietnamese, 390×1024: [candidate render](cronjobs-resume-mobile-dark-vi-390x1024.png)
- Mobile, light, Vietnamese, 390×1024: [candidate render](cronjobs-resume-mobile-light-vi-390x1024.png)
- Mobile, dark, Vietnamese, 360×800 viewport, full-page capture: [candidate render](cronjobs-resume-mobile-dark-vi-360x800-fullpage.png)
- Effective CSS viewport 760×512 at 200% layout zoom from 1520×1024, dark, Vietnamese, full-page capture: [candidate render](cronjobs-resume-effective-760x512-200pct-dark-vi-fullpage.png)

The Resume target remains visible and at least 24×24 CSS px at 360, 760, 767, 768, 1024, 1439, 1440 and 1520 CSS px. The list switches from cards below 768 to the table at 768; no page-level horizontal overflow was found. At 200% effective width, the card layout and action remain available.

## Checks

- API/component checks: 79 passed, covering both permissions, paused jobs with running or idle execution, keyboard activation, pending lock, effective response fields, localized refusal copy, readback success and controlled transport/readback failure.
- Updated responsive render test: 1 passed across light/dark, wide/mobile and the widths listed above.
- Full `tests/e2e/cronjobs.spec.ts`: 10 passed, including existing Pause pending/readback and responsive coverage.
- Targeted ESLint, `pnpm typecheck`, and `git diff --check`: passed.

These are local fixture renders and checks. QA still owns live feature-flow testing; delivery still owns required PR checks and dev revision verification.
