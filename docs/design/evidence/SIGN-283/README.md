# SIGN-283 Events rendered comparison

## Approved references

The source of truth is the approved Design section of [SIGN-262](https://signapse-group.atlassian.net/browse/SIGN-262), captured on 2026-11-18. The active reference PNGs were downloaded from the live parent attachments and inspected:

- Events List, Wide: attachment [10282](https://signapse-group.atlassian.net/browse/SIGN-262), `events-list-wide-20261118.png`.
- Events List, Mobile: attachment [10284](https://signapse-group.atlassian.net/browse/SIGN-262), `events-list-mobile-20261118.png`.
- Event Detail, Wide: attachment [10286](https://signapse-group.atlassian.net/browse/SIGN-262), `event-detail-wide-20261118.png`.
- Event Detail, Mobile: attachment [10287](https://signapse-group.atlassian.net/browse/SIGN-262), `event-detail-mobile-20261118.png`.

The implementation follows the four-column desktop list, stacked mobile event cards with visible time/confidence labels, and the shared detail composition. Event facts remain side by side on mobile. Article navigation is internal and appears only with `news-article:read`; the original-source action appears only when the evidence has a URL.

## Candidate renders

Captured from the P0 fixture-backed Chromium run against the real FE HTTP boundary, including SSR. All renders use Vietnamese and the light theme. Full-page images are linked below; viewport dimensions name the CSS viewport before full-page capture.

- Events List, Wide, 1520×1024, expanded sidebar, page 1, search `Fixture`, default occurrence sort: [candidate render](events-list-wide-light-vi-1520x1024.png). This is the approved desktop table at the 1520px reference frame.
- Events List, Mobile, 390×844, page 1, partial Event `62` with no title: [candidate render](events-list-mobile-partial-untitled-light-vi-390x844-fullpage.png). The full-page capture is 390×2908; the 390px page has no horizontal overflow.
- Event Detail, Mobile, 390×844, Event `62`, `event:read` without `news-article:read`, evidence with a source URL: [candidate render](event-detail-mobile-event-read-light-vi-390x844-fullpage.png). The full-page capture is 390×1589; it shows the localized missing-title label and source action without an Article action.
- Event Detail, Wide, 1520×1024, Event `62`, both Event and Article read permissions: [candidate render](event-detail-wide-article-read-light-vi-1520x1024-fullpage.png). The full-page capture is 1520×1501 and includes both the internal Article route and evidence source URL action.

Playwright hides the `nextjs-portal` development chrome for these screenshots so it does not obscure the product UI.

The focused browser check also verifies the list at 360px, 767px, 768px and an effective 760px CSS viewport representing a 1520px frame at 200% zoom. It checks the desktop/mobile list switch at 768px, no page-level horizontal overflow, keyboard activation, search/sort/page URL state, no-results versus request failure, denied and unavailable detail states, a partial title, and both evidence-link permission cases.

## API and verification

The producer handoff is [SIGN-281 comment 11573](https://signapse-group.atlassian.net/browse/SIGN-281?focusedCommentId=11573); it records dev deployment revision `765059683b3b265ce101823765d9cc5f9495e0f4`, a successful deployment health check and an OpenAPI revision match. The accepted FE survey [SIGN-283 comment 11574](https://signapse-group.atlassian.net/browse/SIGN-283?focusedCommentId=11574) records the live OpenAPI `x-build-revision` as the same SHA.

The current live `https://dev-api.signapse.cloud/v3/api-docs` fetch returned HTTP 200 at 2026-11-20 09:49:58 UTC with body SHA-256 `35075166f2e3be867d40ffcbfe29f93267a5a08094dd19af578ed0163dfb1d5c`. That response did not include an `x-build-revision` header; the revision link above is from the producer handoff and the earlier recorded live fetch. The in-scope live structural check passed for `GET /events` and `GET /events/{id}`. The repository-wide live contract check separately reports nine mismatches in unrelated feedback, conversation, watchlist, notes and Telegram operations.

Local checks for this candidate:

- `pnpm lint` — passed with 0 errors; 23 repository warnings.
- `pnpm typecheck` — passed.
- `pnpm test:contract` — fixture consistency passed for 88 operations.
- `API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --scope 'GET /events,GET /events/{id}' --live` — passed for 2 operations.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/events-workflow.spec.ts` — 3 passed; fixture-backed Chromium SSR and routing, locale, permissions, failure states, keyboard and responsive checks.
- `pnpm exec vitest run tests/components/local-entity-quick-detail-drawer.component.test.tsx` — 16 passed.

These local fixture checks do not prove live authorization or feature acceptance. QA owns live feature coverage; the coordinator owns Story acceptance.
