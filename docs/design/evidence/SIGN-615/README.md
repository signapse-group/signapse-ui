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

## Review follow-up

The follow-up fixes the two findings on PR #129: `resumeCronjob` now validates a positive safe-integer ID before building the authenticated URL, and HTTP 409 code `USER_PROVISIONING_REJECTED` returns localized provisioning feedback while other 409 responses retain the schedule-conflict message. No UI layout or component code changed.

The active SIGN-28 Wide and Mobile references remain attachments 10267 and 10268, updated 2026-11-12. Jira REST exposed their content as raw PNG bytes in this session, so the visual comparison used the accepted local Cronjobs Actions pattern in [SIGN-591](../SIGN-591/cronjobs-actions-wide-en-1520x1024.png) and [SIGN-611](../SIGN-611/README.md), alongside the current SIGN-615 candidate renders above. Placement and independent schedule/execution/result/next-run fields match that direction.

The dev OpenAPI was fetched at `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-15 17:21 UTC; `x-build-revision` remains `ae3c0813a3818d1bcd5cb7fb956e083586bdc642`. Resume documents `USER_PROVISIONING_REJECTED` as a possible coded 409 before the controller, confirming that it must be distinguished from schedule conflicts.

Follow-up verification on the updated candidate:

- `pnpm exec vitest run tests/api/cronjobs-action.test.ts tests/components/cronjob-list.component.test.tsx` — 88 passed, including invalid Resume IDs, both locales for provisioning rejection, and existing permission/readback/component behavior.
- `pnpm typecheck`, targeted ESLint, `pnpm test:contract` (86 operations), and `git diff --check` — passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/cronjobs.spec.ts --retries=0` — 10 passed. The rendered comparison covered wide/mobile light and dark, 360px, effective 760px at 200%, 767/768px, 1024px, 1439/1440px and 1520px, including Resume visibility and existing pending/readback states. No page overflow or target-size failure was reported.

The render and browser checks use local fixtures. No live cronjob mutation was performed; QA retains live feature-flow testing.

## Review follow-up: denied permission and ambiguous outcome

Implementation source: [`6a76d711dc1ee4f7992a092635b7c656eca63c8b`](https://github.com/signapse-group/signapse-ui/commit/6a76d711dc1ee4f7992a092635b7c656eca63c8b), based on `origin/dev` [`28a57a0c8b318459badba21a5aa5d49f62c2ee04`](https://github.com/signapse-group/signapse-ui/commit/28a57a0c8b318459badba21a5aa5d49f62c2ee04). Focused-test and rendered-evidence commit: [`c085e8d8027758f5ee78bfe3d5baf590576cd00f`](https://github.com/signapse-group/signapse-ui/commit/c085e8d8027758f5ee78bfe3d5baf590576cd00f).

The denied state follows the accepted `SIGN-578` Resume placement and the shared Actions/status pattern captured in [SIGN-591](../SIGN-591/cronjobs-actions-wide-en-1520x1024.png) and [SIGN-611](../SIGN-611/README.md). The current parent references remain SIGN-28 Wide/Mobile attachments 10267/10268, updated 2026-11-12. A reader without `cronjob:resume` sees localized status text on paused rows/cards and no Resume control. The schedule, execution, result and next-run fields remain separate.

- Mobile, light, Vietnamese, 390×844, `cronjob:read` without `cronjob:resume`: [render](cronjobs-resume-denied-mobile-light-vi-390x844.png)
- Mobile, dark, Vietnamese, 360×800, `cronjob:read` without `cronjob:resume`: [render](cronjobs-resume-denied-mobile-dark-vi-360x800.png)
- Effective CSS viewport 760×512 at 200% layout zoom from 1520×1024, dark, Vietnamese: [render](cronjobs-resume-denied-effective-760x512-200pct-dark-vi.png)
- Wide, dark, Vietnamese, 1520×1024, sidebar collapsed: [render](cronjobs-resume-denied-wide-dark-vi-1520x1024.png)

I checked the denial message and action placement at 360, 390, 760, 767, 768, 1024, 1439, 1440 and 1520 CSS px. The local browser suite found no page-level horizontal overflow. The new status text passed the existing light/dark mobile axe checks. Component checks cover keyboard activation, pending lock, effective-response update and readback feedback in English and Vietnamese.

Resume server-action errors now carry whether the outcome is ambiguous. HTTP 401/403/404/409 refusals retain their localized reason; transport, invalid-response and 5xx failures are read back. After an ambiguous failure, a `SCHEDULED` readback reports success; any other returned schedule state reports that Resume was not confirmed and shows that latest state. If GET fails, the existing alert marks the displayed values unverified and locks status actions; a known refusal remains visible, while an ambiguous outcome is not described as failure or success.

The dev OpenAPI was fetched at `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-15 18:34:03 UTC. `x-build-revision` was `ae3c0813a3818d1bcd5cb7fb956e083586bdc642`; `POST /cronjobs/{id}/resume` returns `CronjobResponse` on 200, documents provisioning/state conflicts on 409, and documents 500/503 outcomes where a subsequent GET is needed to confirm whether Quartz restored the schedule. This matches producer handoff [SIGN-614 comment 11397](https://signapse-group.atlassian.net/browse/SIGN-614?focusedCommentId=11397).

Follow-up verification:

- `pnpm exec vitest run tests/api/cronjobs-action.test.ts tests/components/cronjob-list.component.test.tsx` — 96 passed, including controlled transport/readback failures, 500/503 ambiguity, confirmed/unconfirmed outcomes, known refusals, and English/Vietnamese feedback.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/cronjobs.spec.ts --retries=0` — 10 passed. A final focused render capture of the read-only permission state — 1 passed.
- `pnpm typecheck`, targeted ESLint, `pnpm test:contract` (86 operations), and `git diff --check` — passed.

These checks use local fixtures. No live Cronjobs mutation was performed. QA retains live feature-flow testing; Review/delivery owns PR checks, Preview and deployed dev-revision verification.
