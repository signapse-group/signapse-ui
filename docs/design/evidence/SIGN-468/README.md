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

The browser checks assert left alignment for both reader headers across Wide, Compact and Mobile. The updated Quick News renders match the dark theme of SIGN-465 attachments 10171, 10169 and 10170.

Event fixture 61 supplies six assets and six evidence items. The current workspace watchlist partially overlaps the Event assets; the rendered reader prioritizes the matching assets in Event order, fills the remaining slots in Event order, and displays only the first four evidence items. The component checks also cover a full four-slot overlap, a watchlist with no matches, no watchlist context, duplicate asset IDs and changing watchlists while evidence remains unchanged.

The browser runs check 28×28 controls from 768px upward and 44×44 controls below 768px after resize transitions settle. They cover widths 1520, 1440, 1439, 1024, 768, 767, 760 and 360; 760px models the effective width at 200% zoom from a 1520px frame. They check title wrapping, long-copy scrolling, keyboard focus, tooltip visibility, focus return, canonical and source URLs, no enrichment status in Quick Event, page overflow and an Axe scan of the Event dialog. A separate Event fixture with no Article/source links verifies the localized missing states, Tab focus on the named scroll region, PageDown reaching the fourth evidence item and End reaching the last-updated content.

## API and verification

The dev OpenAPI at `https://dev-api.signapse.cloud/v3/api-docs` was fetched on 20 November 2026 at 14:39 UTC (HTTP 200, `info.version=v0`; the response had no `x-build-revision`). `GET /events/{id}` uses bearer auth and the optional `Accept-Language` header; it documents 200 and 401/403/404/409/500/503 responses. `EventResponse` requires its documented fields while title, description, canonical key, occurrence time and confidence may be null. `EventEvidenceSummaryResponse` requires `newsArticleId` as a non-null integer; title, source URL, source name, publication time, confidence and note are required nullable fields. The FE definitions now match this requiredness and nullability. The coordinator's 20 November decision on SIGN-468 confirms AC-4's missing Article identity is anomalous fixture data; FE must keep the evidence and any source URL available, and no API contract change is expected. The UI keeps the missing-identity state defensive for malformed input. The latest producer handoff on SIGN-281 records dev revision `765059683b3b265ce101823765d9cc5f9495e0f4` at 08:37 UTC; because the current OpenAPI response omitted its build revision, this fetch cannot verify a revision match.

- `pnpm exec vitest run tests/components/event-quick-detail-content.component.test.tsx tests/components/local-entity-quick-detail-drawer.component.test.tsx tests/components/local-entity-quick-detail-presentation.test.ts tests/components/event-timeline.component.test.tsx` — 43 passed after reconciling current `dev` changes.
- `pnpm typecheck` — passed.
- Targeted ESLint and Prettier checks — passed; ESLint reports only the existing `no-img-element` warning in the test's `next/image` mock.
- `API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --live --scope 'GET /events/{id}'` — live OpenAPI structural check passed for 1 operation at 14:50 UTC; this checks the published operation, not runtime feature behavior.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'renders the complete localized Article|keeps Dashboard mounted while one Event session crosses placement breakpoints|keyboard scrolls an Event body' --retries=0` — 3 passed after merging current `origin/dev`. This verifies both reader headers, responsive controls at the documented boundaries, dark-mode News, keyboard body scrolling, focus and the missing Article/source states.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'uses the shared desktop sheet from Market Charts and restores annotation context' --retries=0` — 1 passed, including fullscreen context and focus restoration.

These browser checks use local fixtures. QA owns live feature-flow testing; the coordinator owns Story acceptance and downstream routing.
