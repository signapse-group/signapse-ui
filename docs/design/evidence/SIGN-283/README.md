# SIGN-283 Events rendered comparison

## Approved references

The source of truth is the approved Design section of [SIGN-262](https://signapse-group.atlassian.net/browse/SIGN-262), captured on 2026-11-18. The active reference PNGs were downloaded from the live parent attachments and inspected:

- Events List, Wide: attachment [10282](https://signapse-group.atlassian.net/browse/SIGN-262), `events-list-wide-20261118.png`.
- Events List, Mobile: attachment [10284](https://signapse-group.atlassian.net/browse/SIGN-262), `events-list-mobile-20261118.png`.
- Event Detail, Wide: attachment [10286](https://signapse-group.atlassian.net/browse/SIGN-262), `event-detail-wide-20261118.png`.
- Event Detail, Mobile: attachment [10287](https://signapse-group.atlassian.net/browse/SIGN-262), `event-detail-mobile-20261118.png`.

The implementation follows the four-column desktop list, stacked mobile event cards with visible time/confidence labels, and the shared detail composition. Event facts remain side by side on mobile. Article navigation is internal and appears only with `news-article:read`; the original-source action appears only when the evidence has a URL.

## Candidate renders

Captured from P0 fixture-backed Chromium against the real FE HTTP boundary, including SSR. All renders use Vietnamese. Full-page images are linked below; viewport dimensions name the CSS viewport before full-page capture.

- Events List, Wide, 1520×1024, expanded sidebar, page 1, search `Fixture`, default occurrence sort: [candidate render](events-list-wide-light-vi-1520x1024.png). The pager reserves 12rem at the inline end for the fixed Ask Signapse launcher; Playwright pointer-clicked Next successfully without the launcher intercepting it. This is the approved desktop table at the 1520px reference frame.
- Events List, Mobile, 390×844, page 1, partial Event `62` with no title: [candidate render](events-list-mobile-partial-untitled-light-vi-390x844-fullpage.png). The full-page capture is 390×2908; the 390px page has no horizontal overflow.
- Event Detail, Mobile, 390×844, Event `62`, `event:read` without `news-article:read`, evidence with a source URL: [candidate render](event-detail-mobile-event-read-light-vi-390x844-fullpage.png). The full-page capture is 390×1503; it shows the localized missing-title label and source action without an Article action, and ends at Related Themes as approved.
- Event Detail, Wide, 1520×1024, Event `62`, both Event and Article read permissions: [candidate render](event-detail-wide-article-read-light-vi-1520x1024-fullpage.png). The full-page capture is 1520×1415 and includes both the internal Article route and evidence source URL action; Related Themes is the final section as approved.
- Events List, Wide, 1520×1024, expanded sidebar, page 1, search `Fixture`, default occurrence sort, dark theme: [candidate render](events-list-wide-dark-vi-1520x1024.png). The fixed Ask Signapse launcher remains clear of the pagination controls.
- Events List, Mobile, 390×844, page 1, partial Event `62` with no title, dark theme: [candidate render](events-list-mobile-partial-untitled-dark-vi-390x844-fullpage.png). The page remains within the 390px viewport.
- Event Detail, Mobile, 390×844, Event `62`, `event:read` without `news-article:read`, dark theme: [candidate render](event-detail-mobile-event-read-dark-vi-390x844-fullpage.png). The source action is available and the Article action is absent.
- Event Detail, Wide, 1520×1024, Event `62`, both Event and Article read permissions, dark theme: [candidate render](event-detail-wide-article-read-dark-vi-1520x1024-fullpage.png). Both evidence actions remain visible and Related Themes is the final section.

Playwright hides the `nextjs-portal` development chrome for these screenshots so it does not obscure the product UI.

The browser check also verifies the list at 360px, 767px, 768px and an effective 760px CSS viewport representing a 1520px frame at 200% zoom. It checks the desktop/mobile list switch at 768px, no page-level horizontal overflow, pointer and keyboard activation, one localized `<h1>` in each list/detail state, status and alert announcements, search/sort/page URL state, unfiltered empty versus filtered no-results versus request failure, denied and unavailable detail states, a partial title, and both evidence-link permission cases. In-place App Router navigation from Event `61` to delayed Event `62` returns 403; a second delayed navigation to Event `999` returns 404. The previous Event identity is absent during both pending and resolved destination states.

## State renders

These fixture-backed state renders use the same wide 1520×1024 viewport and expanded sidebar. List states are compared with approved attachment 10282; detail states with attachment 10286. They use the approved composition while making loading, empty, denied, unavailable, and load-error states visible. `No results` is a filtered empty result, `Unfiltered empty` has no events, and a 503 response is shown as a load error.

| Flow and state                            | Light                                                         | Dark                                                         |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Events list, unfiltered empty             | [render](events-list-unfiltered-empty-light-vi-1520x1024.png) | [render](events-list-unfiltered-empty-dark-vi-1520x1024.png) |
| Events list, loading                      | [render](events-list-loading-light-vi-1520x1024.png)          | [render](events-list-loading-dark-vi-1520x1024.png)          |
| Events list, no results                   | [render](events-list-no-results-light-vi-1520x1024.png)       | [render](events-list-no-results-dark-vi-1520x1024.png)       |
| Events list, API denied                   | [render](events-list-api-denied-light-vi-1520x1024.png)       | [render](events-list-api-denied-dark-vi-1520x1024.png)       |
| Events list, load error                   | [render](events-list-load-error-light-vi-1520x1024.png)       | [render](events-list-load-error-dark-vi-1520x1024.png)       |
| Event detail, loading                     | [render](event-detail-loading-light-vi-1520x1024.png)         | [render](event-detail-loading-dark-vi-1520x1024.png)         |
| Event detail, API denied                  | [render](event-detail-api-denied-light-vi-1520x1024.png)      | [render](event-detail-api-denied-dark-vi-1520x1024.png)      |
| Event detail, unavailable                 | [render](event-detail-unavailable-light-vi-1520x1024.png)     | [render](event-detail-unavailable-dark-vi-1520x1024.png)     |
| Event detail, load error (English locale) | [render](event-detail-load-error-light-en-1520x1024.png)      | [render](event-detail-load-error-dark-en-1520x1024.png)      |

## API and verification

The producer handoff is [SIGN-281 comment 11573](https://signapse-group.atlassian.net/browse/SIGN-281?focusedCommentId=11573); it records dev deployment revision `765059683b3b265ce101823765d9cc5f9495e0f4`, a successful deployment health check and an OpenAPI revision match. The accepted FE survey [SIGN-283 comment 11574](https://signapse-group.atlassian.net/browse/SIGN-283?focusedCommentId=11574) records the live OpenAPI `x-build-revision` as the same SHA.

The current `https://dev-api.signapse.cloud/v3/api-docs` fetch returned HTTP 200 at 2026-11-20 12:48:08 UTC with body SHA-256 `35075166f2e3be867d40ffcbfe29f93267a5a08094dd19af578ed0163dfb1d5c`; the OpenAPI `x-build-revision` is `765059683b3b265ce101823765d9cc5f9495e0f4`, matching producer handoff [SIGN-281 comment 11573](https://signapse-group.atlassian.net/browse/SIGN-281?focusedCommentId=11573). The in-scope live structural check passed for `GET /events` and `GET /events/{id}` at 2026-11-20 13:12:15 UTC.

Local checks for this candidate:

- `pnpm typecheck` — passed.
- `pnpm test:contract` — fixture consistency passed for 88 operations.
- `API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --scope 'GET /events,GET /events/{id}' --live` — passed for both Events operations.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/events-workflow.spec.ts` — 5 passed; fixture-backed Chromium at the real FE HTTP boundary, including SSR, URL state, permissions, delayed in-place identity changes, list/detail loading and failure states, accessible headings and status messages, keyboard/pointer activation, and responsive checks.
- Scoped ESLint on the changed Events routes, browser spec, and fixtures — passed.
- `git diff --check` — passed.

These local fixture checks do not prove live authorization or feature acceptance. QA owns live feature coverage; the coordinator owns Story acceptance.
