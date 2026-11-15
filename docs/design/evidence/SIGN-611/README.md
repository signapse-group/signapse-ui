# SIGN-611 Pause UI evidence

The accepted action placement and separate schedule, execution, latest-result and next-run fields come from [SIGN-577](https://signapse-group.atlassian.net/browse/SIGN-577) and [SIGN-28](https://signapse-group.atlassian.net/browse/SIGN-28). This follows the existing [wide](../SIGN-591/cronjobs-actions-wide-en-1520x1024.png) and [mobile](../SIGN-591/cronjobs-actions-mobile-vi-390x844.png) Cronjobs pattern.

Captured from the fixture-backed responsive case in [`cronjobs.spec.ts`](../../../../tests/e2e/cronjobs.spec.ts). The case checks the Actions control at 360, 390, 760 (effective 200% layout width), 767, 768, 1024, 1439, 1440 and 1520 CSS pixels, and checks for horizontal overflow. The screenshots show the wide English view, Vietnamese mobile light and dark views, and the keyboard focus ring on Pause. The running job retains its next-run time while scheduled, and already-paused jobs show no next run.

These are local fixture renders, not live QA or production evidence.

- [Wide, dark, English, 1520×1024](cronjobs-pause-wide-dark-en-1520x1024.png)
- [Mobile, light, Vietnamese, 390×844](cronjobs-pause-mobile-light-vi-390x844.png)
- [Mobile, dark, Vietnamese, 390×844](cronjobs-pause-mobile-dark-vi-390x844.png)
- [Mobile, dark, Vietnamese, keyboard focus, 390×844](cronjobs-pause-mobile-focus-dark-vi-390x844.png)
