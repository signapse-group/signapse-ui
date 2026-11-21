# SIGN-364 calendar filter render evidence

## Accepted source and candidate

The accepted direction is [SIGN-45](https://signapse-group.atlassian.net/browse/SIGN-45): keep the economic calendar list and place Currency and Impact in the desktop toolbar and mobile Filters panel. I checked the approved Jira attachments 10288 (`economic-calendar-list-desktop-v1.png`), 10290 (`economic-calendar-list-mobile-v1.png`), and 10293 (`economic-calendar-filters-mobile-v1.png`).

The rendered implementation candidate is commit [`d5465bc4`](https://github.com/signapse-group/signapse-ui/commit/d5465bc4ed498344d174736afd302b220e7a32d0), based on `origin/dev` at `726923112a0d49a3bc8404fdb50d2e400bda1199`. The screenshots below were captured from that candidate. The evidence-record commit that follows changes this README only.

## Rendered comparison

Captures use Vietnamese, dark theme, and local fixture data.

- Desktop list, 1520×1024, expanded sidebar: [candidate render](economic-calendar-desktop-1520x1024.png). Currency and Impact remain in the existing toolbar between search and sort; the weekly navigation and date/time/currency-grouped list remain in place. The fixture has read permission only, so the existing Sync action is not shown.
- Mobile Filters panel, 390×844: [candidate render](economic-calendar-mobile-filters-390x844.png). The button shows the count of two selected filters; the open panel contains labeled Currency and Impact controls and Clear filters, above the existing date navigation and grouped list.

The desktop and mobile list captures preserve the existing fixed grouping and Actual/Forecast/Previous presentation from attachments 10288 and 10290. The Filters panel follows attachment 10293's count, control order, and clear action. Currency choices use returned `currencyCode` values; no currency is inferred from country.

## Responsive and focus behavior

The delayed fixture response checks toolbar loading placeholders at 390, 767, 768, and 1520 CSS pixels. Below 768px the toolbar shows one Filters-button placeholder and the sort placeholder; from 768px it shows the two filter-select placeholders and sort. Captures: [mobile loading, 390×844](economic-calendar-loading-mobile-390x844.png) and [desktop loading, 1520×1024](economic-calendar-loading-desktop-1520x1024.png). The desktop loading capture keeps the sidebar collapsed after resizing from mobile; the loaded desktop capture above uses the expanded sidebar.

The browser assertion opens the mobile panel at 767px with focus on its Filters trigger, then resizes to 768px. Focus moves to the visible Currency control while USD, HIGH, date, title, and sort remain selected in the UI/URL. The same run checks mobile filter interactions, the combined HTTP query, page overflow, and read-permission denial.

## Verification and limits

- `pnpm typecheck`, focused ESLint, and Prettier checks passed.
- Focused economic-calendar Vitest: 6 files, 13 tests passed. API contract guard Vitest: 20 tests passed. `pnpm test:contract` fixture consistency passed for 90 operations.
- `SIGN364_CAPTURE_EVIDENCE=1 /opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/economic-calendar-filters.spec.ts --retries=0 --workers=1` — 4 passed. This run captured the renders above and exercised the 767→768 focus transfer.
- Checks use local fixtures and do not exercise live authentication or live economic-calendar data. QA/coordinator owns live feature acceptance under the existing workflow.
