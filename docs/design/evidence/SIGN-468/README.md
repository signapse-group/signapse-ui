# SIGN-468 Quick Event and shared reader evidence

Candidate revision is recorded in the linked PR. These screenshots were rendered from the local fixture app with synthetic Event and Article data; they do not represent live feature testing.

## Approved design references

- Quick Event Wide, Compact and Mobile: [SIGN-464](https://signapse-group.atlassian.net/browse/SIGN-464) attachments 10281 `quick-event-wide-20261118.png`, 10283 `quick-event-compact-20261118.png` and 10285 `quick-event-mobile-20261118.png`, version 18 November 2026.
- Quick News Wide, Compact and Mobile: [SIGN-465](https://signapse-group.atlassian.net/browse/SIGN-465) attachments 10171 `a81LZi.png`, 10169 `yxfJI.png` and 10170 `nd5YH.png`, version 3 November 2026.
- Asset role labels follow SIGN-263: primary subject, affected asset and reference asset.

The candidate screenshots were compared with those approved references for the header row, title wrapping, section order, evidence and related asset presentation, and mobile stacking.

## Candidate renders

- Quick Event, dark Vietnamese, 1520×1000: [wide](quick-event-wide-vi.png).
- Quick Event, dark Vietnamese, 1024×900: [compact](quick-event-compact-vi.png).
- Quick Event, dark Vietnamese, 360×900 after scrolling within the reader: [mobile](quick-event-mobile-vi-360.png).
- Quick Event, light Vietnamese, 360×900 after keyboard PageDown reaches the fourth evidence item with missing Article identity and source URL: [missing evidence links and focused reader region](quick-event-missing-links-vi-360.png).
- Quick Event, light Vietnamese, 360×900 after keyboard End reaches the final update time: [reader content end](quick-event-reader-end-vi-360.png).
- Quick News, light Vietnamese, 1520×1000: [wide](quick-news-wide-vi.png).
- Quick News, light Vietnamese, 1024×900: [compact](quick-news-compact-vi.png).
- Quick News, light Vietnamese, 360×844: [mobile](quick-news-mobile-vi-360.png); [mobile content end](quick-news-mobile-content-end-vi-360.png).

Event fixture 61 supplies six assets and six evidence items. The current workspace watchlist partially overlaps the Event assets; the rendered reader prioritizes the matching assets in Event order, fills the remaining slots in Event order, and displays only the first four evidence items. The component checks also cover a full four-slot overlap, a watchlist with no matches, no watchlist context, duplicate asset IDs and changing watchlists while evidence remains unchanged.

The browser runs check 28×28 controls from 768px upward and 44×44 controls below 768px after resize transitions settle. They cover widths 1520, 1440, 1439, 1024, 768, 767, 760 and 360; 760px models the effective width at 200% zoom from a 1520px frame. They check title wrapping, long-copy scrolling, keyboard focus, tooltip visibility, focus return, canonical and source URLs, no enrichment status in Quick Event, page overflow and an Axe scan of the Event dialog. A separate Event fixture with no Article/source links verifies the localized missing states, Tab focus on the named scroll region, PageDown reaching the fourth evidence item and End reaching the last-updated content.

## API and verification

The dev OpenAPI document at `https://dev-api.signapse.cloud/v3/api-docs` was fetched again on 20 November 2026 at 12:01 UTC. `GET /events/{id}` documents nullable localized fields, the stored Article identity and original URL when supplied, separate `event:read` and `news-article:read` permissions, and distinct 403/404/500 outcomes. Event detail fields that the API allows to be null are represented as nullable in the FE consumer types. This fetch omitted `x-build-revision`; the latest producer handoff on SIGN-281 records deployed revision `765059683b3b265ce101823765d9cc5f9495e0f4` at 08:37 UTC. This follow-up changes no API usage.

- `pnpm exec vitest run tests/components/event-quick-detail-content.component.test.tsx tests/components/local-entity-quick-detail-drawer.component.test.tsx tests/components/local-entity-quick-detail-presentation.test.ts tests/components/event-timeline.component.test.tsx` — 42 passed.
- `pnpm typecheck` — passed.
- Targeted ESLint and Prettier checks — passed. ESLint reports the existing `no-img-element` warning in the test's `next/image` mock.
- `pnpm test:contract` — fixture consistency passed for 88 operations.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'renders the complete localized Article|keeps Dashboard mounted while one Event session crosses placement breakpoints' --retries=0` — 2 passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'keyboard scrolls an Event body' --retries=0` — passed; the rendered PageDown and End states are linked above.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/quick-detail.spec.ts --grep 'uses the shared desktop sheet from Market Charts and restores annotation context' --retries=0` — 1 passed, including fullscreen context and focus restoration.

These browser checks use local fixtures. QA owns live feature-flow testing; the coordinator owns Story acceptance and downstream routing.
