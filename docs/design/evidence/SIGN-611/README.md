# SIGN-611 Pause UI evidence

## Current follow-up candidate

Candidate [`49b152ffbb60cda059595370fd541f1dc7e5d6d9`](https://github.com/signapse-group/signapse-ui/commit/49b152ffbb60cda059595370fd541f1dc7e5d6d9), based on current `origin/dev` (`f75c8bf5bbe9189a33d5006151a42e9c69919bd4`). These fixture-backed captures come from `Pause pending and readback-error states reflow and retain focus` in [`cronjobs.spec.ts`](../../../../tests/e2e/cronjobs.spec.ts).

The test activates Pause with the keyboard, holds the POST to capture its pending state, then lets the fixture apply the pause while the following GET returns 503. The UI keeps the existing values marked unverified and focuses the localized readback warning. It also checks the pending lock, warning wrapping, no page overflow, and no serious or critical axe findings at each viewport. Mobile/effective-zoom captures use Vietnamese; the wide capture uses English. All three use dark mode.

- [Pending, mobile 360×800, Vietnamese](cronjobs-pause-pending-mobile-vi-360x800.png)
- [Readback error, mobile 360×800, Vietnamese](cronjobs-pause-readback-error-mobile-vi-360x800.png)
- [Pending, effective 760×512 at 200% layout width, Vietnamese](cronjobs-pause-pending-effective-760-vi-760x512.png)
- [Readback error, effective 760×512 at 200% layout width, Vietnamese](cronjobs-pause-readback-error-effective-760-vi-760x512.png)
- [Pending, wide 1520×1024, English](cronjobs-pause-pending-wide-en-1520x1024.png)
- [Readback error, wide 1520×1024, English](cronjobs-pause-readback-error-wide-en-1520x1024.png)

These are local fixture renders, not live QA or production evidence.

## Accepted design and initial baseline captures

The accepted action placement and separate schedule, execution, latest-result and next-run fields come from [SIGN-577](https://signapse-group.atlassian.net/browse/SIGN-577) and [SIGN-28](https://signapse-group.atlassian.net/browse/SIGN-28), including the active Wide/Mobile references updated 2026-11-12 (attachments 10267 and 10268). The existing [SIGN-591 wide](../SIGN-591/cronjobs-actions-wide-en-1520x1024.png) and [mobile](../SIGN-591/cronjobs-actions-mobile-vi-390x844.png) captures informed the shared Actions pattern.

The following initial baseline captures are from candidate `14f9d768303015ce53abe1aedf6d818f6e461e6e`; they are retained for context and do not represent the current follow-up candidate:

- [Wide, dark, English, 1520×1024](cronjobs-pause-wide-dark-en-1520x1024.png)
- [Mobile, light, Vietnamese, 390×844](cronjobs-pause-mobile-light-vi-390x844.png)
- [Mobile, dark, Vietnamese, 390×844](cronjobs-pause-mobile-dark-vi-390x844.png)
- [Mobile, dark, Vietnamese, keyboard focus, 390×844](cronjobs-pause-mobile-focus-dark-vi-390x844.png)
