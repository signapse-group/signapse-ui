# SIGN-594 Cronjobs list render evidence

Captured by the focused local fixture browser cases in [`cronjobs.spec.ts`](../../../../tests/e2e/cronjobs.spec.ts). The accepted comparison is the current Cronjobs design in [parent SIGN-28](https://signapse-group.atlassian.net/browse/SIGN-28): attachments 10267 (`Cronjobs-Wide-2026-11-12.png`) and 10268 (`Cronjobs-Mobile-2026-11-12.png`).

- [Wide list, 1520×1024](cronjobs-wide-dark-en-1520x1024.png): dark theme, English, expanded sidebar, long description/group/cron fixture data, and read plus update/start/pause/resume permissions.
- [Mobile composition, 390×1024](cronjobs-mobile-dark-vi-390x1024.png): dark theme, Vietnamese, two fixture cards including a paused job with a failed result. The result summary occupies the first footer row; page size and navigation remain visible in the next row.
- [Mobile long data, 390×1587](cronjobs-mobile-long-data-dark-vi-390x1587.png): full-page dark Vietnamese render of the long fixture set, showing wrapped descriptions, group names and cron expressions with independent statuses and next-run data.

The focused browser cases check the list at 360, 390, 760, 767, 768, 1024, 1439, 1440 and 1520 CSS pixels, page overflow, and axe critical/serious findings. The 760 CSS-pixel viewport covers the effective layout width expected at 200% zoom from a 1520-pixel viewport. They also cover read permission, case-insensitive partial search across pagination, loading, denied access, load errors, empty and no-match states, and permission-specific controls. The same spec checks search focus through URL updates, Tab order, visible focus and keyboard sorting.

This is local fixture evidence only. It does not cover live authentication, API integration or QA acceptance; QA owns live feature verification after delivery.

## Follow-up attempt #2

These renders were captured from UI source commit `9705cab` with the focused fixture run. The accepted references remain SIGN-28 attachments 10267 (Wide) and 10268 (Mobile).

- [Wide, 1520×1024](cronjobs-wide-dark-en-1520x1024-followup-2.png): dark theme, English, long description/group/cron data, read permission and available controls; compare with attachment 10267.
- [Mobile, 390×1024](cronjobs-mobile-dark-vi-390x1024-followup-2.png): dark theme, Vietnamese, two cards and the shared two-row pagination; compare with attachment 10268.
- [Mobile long data, 390×1567](cronjobs-mobile-long-data-dark-vi-390x1567-followup-2.png): dark theme, Vietnamese, full fixture list with long description/group/cron data and independent statuses.
- [Effective 760px viewport](cronjobs-effective-760-200pct-dark-vi-followup-2.png): full-page dark Vietnamese render from a 760×512 CSS viewport, the effective width of the 1520px wide frame at 200% zoom.
- [Mobile long data, light theme](cronjobs-mobile-long-data-light-vi-390x1567-followup-2.png): light-theme status contrast counterpart to the dark render.

The current run passed all 8 focused Cronjobs browser cases. Axe reported no serious or critical WCAG 2 A/AA findings in light or dark mode. The run checked 360, 390, 760, 767, 768, 1024, 1439, 1440 and 1520 CSS-pixel widths for reflow and page overflow, plus keyboard search/sort, permissions, UTC fields and distinct loading, error, empty and no-match states. The 760px check uses the contract's effective CSS viewport width for 200% zoom; it does not change the browser zoom control.
