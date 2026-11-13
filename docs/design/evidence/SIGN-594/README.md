# SIGN-594 Cronjobs list render evidence

Captured by the focused local fixture browser cases in [`cronjobs.spec.ts`](../../../../tests/e2e/cronjobs.spec.ts). The accepted comparison is the current Cronjobs design in [parent SIGN-28](https://signapse-group.atlassian.net/browse/SIGN-28): attachments 10267 (`Cronjobs-Wide-2026-11-12.png`) and 10268 (`Cronjobs-Mobile-2026-11-12.png`).

- [Wide list, 1520×1024](cronjobs-wide-dark-en-1520x1024.png): dark theme, English, expanded sidebar, long description/group/cron fixture data, and read plus update/start/pause/resume permissions.
- [Mobile composition, 390×1024](cronjobs-mobile-dark-vi-390x1024.png): dark theme, Vietnamese, two fixture cards including a paused job with a failed result. The result summary occupies the first footer row; page size and navigation remain visible in the next row.
- [Mobile long data, 390×1587](cronjobs-mobile-long-data-dark-vi-390x1587.png): full-page dark Vietnamese render of the long fixture set, showing wrapped descriptions, group names and cron expressions with independent statuses and next-run data.

The focused browser spec checks the list at 360, 390, 760, 767, 768, 1024, 1439, 1440 and 1520 CSS pixels, page overflow, keyboard access, and axe critical/serious findings. The 760 CSS-pixel viewport covers the effective layout width expected at 200% zoom from a 1520-pixel viewport. It also covers read permission, case-insensitive partial search across pagination, loading, denied access, load errors, empty and no-match states, and permission-specific controls.

This is local fixture evidence only. It does not cover live authentication, API integration or QA acceptance; QA owns live feature verification after delivery.
