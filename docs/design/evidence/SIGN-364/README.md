# SIGN-364 economic calendar filter render evidence

## Accepted source and candidate

The accepted direction is [SIGN-45](https://signapse-group.atlassian.net/browse/SIGN-45): keep the current economic calendar list and place Currency and Impact in the desktop toolbar and mobile Filters panel. The live parent attachments used for comparison are 10288 (`economic-calendar-list-desktop-v1.png`), 10290 (`economic-calendar-list-mobile-v1.png`), and 10293 (`economic-calendar-filters-mobile-v1.png`).

The rendered code candidate is commit [`9302a8a6`](https://github.com/signapse-group/signapse-ui/commit/9302a8a62cbd6b83f0f5490912f4afbf01c84aad), based on `origin/dev` at `726923112a0d49a3bc8404fdb50d2e400bda1199`. The images below were captured from this code candidate. The loading and empty announcements are screen-reader only and do not change the rendered layout.

## Rendered comparison

Captures use Vietnamese, dark theme, and local fixture data.

- Desktop list, 1520×1024, expanded sidebar: [candidate render](economic-calendar-desktop-1520x1024.png). Currency and Impact remain in the existing toolbar between search and sort; weekly navigation and the date/time/currency-grouped list stay in place. The fixture has read permission only, so the existing Sync action is hidden.
- Mobile Filters panel, 390×844: [candidate render](economic-calendar-mobile-filters-390x844.png). The Filters button shows two selected values; the open panel has labeled Currency and Impact controls and Clear filters above the existing date navigation.
- Narrow mobile Filters panel, 360×844: [candidate render](economic-calendar-mobile-filters-360x844.png). Both selected controls and the clear action remain visible, and the page has no horizontal overflow.
- 200% zoom effective viewport, 760×512: [candidate render](economic-calendar-filters-zoom-200-effective-760x512.png). This uses the repository browser-suite convention for the effective CSS viewport of the approved 1520×1024 frame at 200% zoom. With the panel open, USD and HIGH remain selected, the controls are visible, and the page has no horizontal overflow. The sidebar is in its collapsed/mobile overlay mode.

The filter comparison uses attachment 10293's count, control order, and clear action. Currency values come from returned `currencyCode` values; no currency is inferred from a country. The approved mobile-list attachment shows cards, while this route still uses its pre-existing table layout at narrow widths; the table can clip columns at 360px and the effective 760px viewport. Rebuilding that list is outside SIGN-364. The filter panel remains usable, and the filter work introduces no page-level horizontal overflow. The prior review identified this baseline difference for coordinator/QA follow-up.

## Responsive and focus behavior

The delayed fixture response checks toolbar loading placeholders at 390, 767, 768, and 1520 CSS pixels. Below 768px it shows one Filters-button placeholder and the sort placeholder; from 768px it shows two filter-select placeholders and sort. The current candidate includes [mobile loading, 390×844](economic-calendar-loading-mobile-390x844.png) and [desktop loading, 1520×1024](economic-calendar-loading-desktop-1520x1024.png). The loading desktop capture keeps the sidebar collapsed after resizing from mobile; the loaded desktop capture uses the expanded sidebar.

The browser assertion opens the mobile panel at 767px with focus on its Filters trigger, then resizes to 768px. Focus moves to the visible Currency control while USD, HIGH, date, title, and sort remain selected in the UI and URL. The run also checks the combined HTTP query, the 360px and 760×512 layouts, page overflow, and read-permission denial.

The Suspense fallback now announces the localized loading state and exposes the loading surface as a busy economic-calendar region. Filtered-empty and unfiltered-day messages use a status role; focused component and browser assertions cover both announcements and busy semantics.

## Verification and limits

- `pnpm typecheck` passed.
- Focused ESLint, Prettier, and `git diff --check` passed for the changed files.
- `pnpm exec vitest run tests/components/economic-calendar-error.component.test.tsx tests/components/economic-calendar-filters.component.test.tsx tests/components/economic-calendar-list.component.test.tsx tests/core/economic-calendar-action.test.ts tests/core/economic-calendar-date.test.ts tests/core/economic-calendar-page-permissions.test.ts` — 6 files, 13 passed. This includes supported query serialization, paging through `Page.last`, UTC+07 date handling, permission denial, filter removal, and the localized filtered-empty status.
- `SIGN364_CAPTURE_EVIDENCE=1 /opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/economic-calendar-filters.spec.ts --retries=0 --workers=1` — 4 passed. It covers combined URL/HTTP filters, mobile controls, 360px and 200%-equivalent layouts, 767→768 focus transfer, loading at 390/767/768/1520 with the localized status and `aria-busy` region, no page-level overflow, and read-permission denial.
- The previous API contract guard (20 tests) and `pnpm test:contract` fixture consistency (90 operations) remain applicable; this follow-up did not change query construction, pagination, or permission handling.
- The current development contract was fetched from [OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at `2026-11-21 10:33:21 UTC`. `GET /economic-calendar` publishes `scheduledAt ge/lt`, `title containsIgnoreCase`, `currencyCode eq`, and `impact eq` with `LOW`/`MEDIUM`/`HIGH`; paging publishes a maximum size of 2000 and `last`, and missing `economic-calendar:read` returns 403. Its UTC `Z` date example is the same instant as the FE's UTC+07 boundaries. This response omitted `x-build-revision`; the latest available revision from the 10:03:59 UTC fetch is `deacb9747e693db041256f8d8a03f82906b53275`. The source publishes no currency enum or country mapping.
- Fixture checks do not exercise live authentication or live economic-calendar data. QA/coordinator owns live feature acceptance under the existing workflow.
