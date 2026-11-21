# SIGN-364 calendar filter render evidence

## Accepted source and candidate

The accepted direction is [SIGN-45](https://signapse-group.atlassian.net/browse/SIGN-45): keep the existing calendar list and place Currency and Impact controls in the desktop toolbar and mobile Filters panel. I inspected the current Jira design attachments 10288 (desktop list), 10290 (mobile list), and 10293 (mobile Filters panel).

The implementation candidate is commit [`7e67034b`](https://github.com/signapse-group/signapse-ui/commit/7e67034b) on `codex/SIGN-364-economic-calendar-filters`, based on `origin/dev` at `726923112a0d49a3bc8404fdb50d2e400bda1199`.

## Candidate renders

Both captures use the Vietnamese locale, dark theme, local P0 fixtures, and the candidate code above. The fixture contains synthetic releases; it does not represent live producer data.

- Desktop list, 1520×1024: [candidate render](economic-calendar-desktop-1520x1024.png). The existing search, weekly navigation, and grouped list remain in place; Currency and Impact sit before the scheduled-date sort. The fixture has read permission only, so the existing permission-gated Sync control is not shown.
- Mobile Filters panel, 390×844: [candidate render](economic-calendar-mobile-filters-390x844.png). The count, labeled controls, selected values, and Clear action appear in the existing list layout.

The fixture-backed Chromium check confirmed no page-level horizontal overflow at both viewports and returned focus to the Filters button after closing the panel. The API request retained date and title and combined both selected filters. Currency choices came from returned `currencyCode` values; no currency was inferred from country.

## Verification and limits

- Focused Vitest: 6 files, 13 tests passed; covers filter URL retention/removal, UTC+07 day boundaries, query serialization, pagination through `Page.last`, permission denial, grouping, missing versus zero, empty, and safe error copy.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/economic-calendar-filters.spec.ts --retries=0 --workers=1` with `SIGN364_CAPTURE_EVIDENCE=1` — 2 passed; local fixture-backed SSR/render, mobile filter interaction and focus restoration, request query, and read permission.
- `pnpm typecheck`, targeted ESLint, `pnpm test:contract` — passed; fixture consistency covered 90 operations.

These checks do not exercise live authentication or live feature data. QA/coordinator owns live feature acceptance under the existing workflow.
