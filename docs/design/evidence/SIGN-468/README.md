# SIGN-468 Quick Event and shared reader evidence

Candidate revision is recorded in the linked PR. These screenshots were rendered from the local fixture app with synthetic Event and Article data; they do not represent live feature testing.

## Approved design references

- Quick Event Wide, Compact and Mobile: [SIGN-464](https://signapse-group.atlassian.net/browse/SIGN-464) attachments 10281 `quick-event-wide-20261118.png`, 10283 `quick-event-compact-20261118.png` and 10285 `quick-event-mobile-20261118.png`, version 18 November 2026.
- Quick News Wide, Compact and Mobile: [SIGN-465](https://signapse-group.atlassian.net/browse/SIGN-465) attachments 10171 `a81LZi.png`, 10169 `yxfJI.png` and 10170 `nd5YH.png`, version 3 November 2026.
- Asset role labels follow SIGN-263: primary subject, affected asset and reference asset.

The candidate screenshots were compared with those approved references for the header row, title wrapping, section order, evidence and related asset presentation, and mobile stacking.

## Earlier candidate renders

- Quick Event, dark Vietnamese, 1520×1000: [wide](quick-event-wide-vi.png).
- Quick Event, dark Vietnamese, 1024×900: [compact](quick-event-compact-vi.png).
- Quick Event, dark Vietnamese, 360×900 after scrolling within the reader: [mobile](quick-event-mobile-vi-360.png).
- Quick Event, light Vietnamese, 360×900 after keyboard PageDown reaches the fourth evidence item with missing Article identity and source URL: [missing evidence links and focused reader region](quick-event-missing-links-vi-360.png).
- Quick Event, light Vietnamese, 360×900 after keyboard End reaches the final update time: [reader content end](quick-event-reader-end-vi-360.png).
- Quick News, light Vietnamese, 1520×1000: [wide](quick-news-wide-vi.png).
- Quick News, light Vietnamese, 1024×900: [compact](quick-news-compact-vi.png).
- Quick News, light Vietnamese, 360×844: [mobile](quick-news-mobile-vi-360.png); [mobile content end](quick-news-mobile-content-end-vi-360.png).

## Follow-up review renders

These screenshots were captured after the shared bottom-sheet title alignment fix. Quick News renders use dark theme to match the approved Jira references; the earlier light-theme screenshots remain available above as prior evidence.

- Quick Event, dark Vietnamese, 1520×1000: [wide](quick-event-wide-vi-20261120-review.png).
- Quick Event, dark Vietnamese, 1024×900: [compact](quick-event-compact-vi-20261120-review.png).
- Quick Event, dark Vietnamese, 360×900: [mobile](quick-event-mobile-vi-360-20261120-review.png).
- Quick Event, light Vietnamese, 360×900: [missing Article/source identities](quick-event-missing-links-vi-360-20261120-review.png) and [reader end after keyboard End](quick-event-reader-end-vi-360-20261120-review.png).
- Quick News, dark Vietnamese, 1520×1000: [wide](quick-news-wide-vi-dark-20261120-review.png).
- Quick News, dark Vietnamese, 1024×900: [compact](quick-news-compact-vi-dark-20261120-review.png).
- Quick News, dark Vietnamese, 360×844: [mobile](quick-news-mobile-vi-360-dark-20261120-review.png); [mobile content end](quick-news-mobile-content-end-vi-360-dark-20261120-review.png).

## Status and keyboard follow-up

- Quick Event, dark Vietnamese, 1024×900, Event API fixture returns 403: [localized access denial](quick-event-api-denied-vi-1024-20261120.png). The denied state keeps the required permission message and omits the canonical action.
- Quick Event, dark Vietnamese, 1024×900, Event API fixture returns 404: [localized missing state](quick-event-api-missing-vi-1024-20261120.png). The missing state omits the canonical action.
- Quick Event, light Vietnamese, 360×900, no Article/source links: [reader content end after keyboard scrolling](quick-event-reader-end-arrowdown-vi-360-20261120.png). The fixture check uses ArrowDown to reach the fourth evidence item and End to reach the last-updated content.

The browser checks assert left alignment for both reader headers across Wide, Compact and Mobile. The updated Quick News renders match the dark theme of SIGN-465 attachments 10171, 10169 and 10170.

Event fixture 61 supplies six assets and six evidence items. The current workspace watchlist partially overlaps the Event assets; the rendered reader prioritizes the matching assets in Event order, fills the remaining slots in Event order, and displays only the first four evidence items. The component checks also cover a full four-slot overlap, a watchlist with no matches, no watchlist context, duplicate asset IDs and changing watchlists while evidence remains unchanged.

The browser runs check 28×28 controls from 768px upward and 44×44 controls below 768px after resize transitions settle. They cover widths 1520, 1440, 1439, 1024, 768, 767, 760 and 360; 760px models the effective width at 200% zoom from a 1520px frame. They check title wrapping, long-copy scrolling, keyboard focus, tooltip visibility, focus return, canonical and source URLs, no enrichment status in Quick Event, page overflow and an Axe scan of the Event dialog. A separate Event fixture with no Article/source links verifies the localized missing states, Tab focus on the named scroll region, ArrowDown reaching the fourth evidence item and End reaching the last-updated content.

## API and verification

The dev OpenAPI at `https://dev-api.signapse.cloud/v3/api-docs` was fetched on 20 November 2026 at 16:11 UTC (HTTP 200, `info.version=v0`; root `x-build-revision=765059683b3b265ce101823765d9cc5f9495e0f4`, matching the latest SIGN-281 producer handoff). `GET /events/{id}` uses bearer auth and the optional `Accept-Language` header; it documents 200 and 401/403/404/409/500/503 responses. `EventResponse` requires its documented fields while title, description, canonical key, occurrence time and confidence may be null. `EventEvidenceSummaryResponse` requires `newsArticleId` as a non-null integer; `newsArticleTitle`, `newsArticleUrl`, source name, publication time, confidence and note are required nullable fields. FE definitions match this requiredness and nullability. The coordinator's 20 November decision on SIGN-468 confirms AC-4's missing Article identity is anomalous fixture data; FE must keep the evidence and any source URL available, and no API contract change is expected. The UI keeps the missing-identity state defensive for malformed input.

- `pnpm exec vitest run --reporter=dot tests/api/events-action.test.ts tests/api/news-articles-action.test.ts tests/components/local-entity-quick-detail-drawer.component.test.tsx` — 28 passed, including serializable 401/403/404 action results and the denied/missing headings.
- `pnpm typecheck` — passed.
- Targeted ESLint and Prettier checks — passed; ESLint reports only the existing `no-img-element` warning in the test's `next/image` mock.
- `API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --live --scope 'GET /events/{id}'` — live OpenAPI structural check passed for 1 operation at 16:11:58 UTC; this checks the published operation, not runtime feature behavior.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'renders the complete localized Article within wide, compact, and mobile readers|keeps Dashboard mounted while one Event session crosses placement breakpoints|keyboard scrolls an Event body when evidence has no Article or source links|shows localized access denial when the Event API returns 403|shows the missing state when the Event API returns 404' --retries=0 --workers=1` — 5 passed. This covers Article layout, Event breakpoints, keyboard scrolling, and localized Event 403/404 states.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'uses the shared desktop sheet from Market Charts and restores annotation context' --retries=0` — 1 passed, including fullscreen context and focus restoration.

These browser checks use local fixtures. QA owns live feature-flow testing; the coordinator owns Story acceptance and downstream routing.
