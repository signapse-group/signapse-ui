# SIGN-291 AI forecast render evidence

## Design and API references

The Event Detail reference is SIGN-262's approved Design from 2026-11-18: Wide attachment [10286](https://signapse-group.atlassian.net/browse/SIGN-262) (`event-detail-wide-20261118.png`) and Mobile attachment [10287](https://signapse-group.atlassian.net/browse/SIGN-262) (`event-detail-mobile-20261118.png`). Both current Jira attachments were inspected. The candidate follows the shared Market Reactions heading and the repeated forecast-card layout. It also makes the AI interpretation and confidence limits explicit in localized copy.

The producer contract was checked against the dev OpenAPI document at `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-19. It returned HTTP 200 with build revision `c156782fc3326a14b0647c5d8c597d4be5751d4c`, matching the SIGN-289 producer handoff; the document SHA-256 was `bf3702825d512c7aa1465e9fa88f1efa58d698d19b2c4cd179a9370c4d4d9cf0`. `GET /events/{id}` returns stored `marketReactions`; the array is required, each item identifies its event through the response and its asset and horizon, and `confidence`, `reasoning`, and `observedAt` may be null. Empty `marketReactions` means there is no forecast. The read operation does not derive a reaction. `observedAt` is a forecast anchor, not a measured-price timestamp, so this view omits it. Confidence is shown as the producer's AI confidence, never as a verified trading win rate.

## Candidate renders

These full-page captures came from the P0 fixture-backed browser test at the FE HTTP boundary, including SSR. Viewport sizes are 1520×1280 CSS pixels and 390×844 CSS pixels; the images extend to the full page height. The scenario contains four stored reactions across four directions and multiple horizons, including two horizons for SKYY, plus DXY as a related asset without a forecast.

- Event Detail, dark, English, Wide 1520×1280 viewport: [candidate render](event-detail-wide-dark-en-1520x1280.png).
- Event Detail, dark, English, Mobile 390×844 viewport: [candidate render](event-detail-mobile-dark-en-390x844.png).

The fixture checks localized labels, distinct asset/horizon cards, all four directions, null confidence and reasoning, empty arrays, a missing reaction field, and a 503 event read. Empty state appears only for the event whose reaction array is empty. The missing-field and request-error states remain distinct. Browser requests are read-only for this page load; the test asserts no reaction-generation POST.

The mobile full-page capture shows the existing shared “Ask Signapse” floating control overlapping the unrelated Evidence action row. It does not cover the Market Reactions cards or disclosure; the shared control is outside this feature's scope.

## Verification

- `pnpm typecheck` — passed.
- Targeted ESLint on changed application, fixture and test files — passed with one existing mocked-image warning in `tests/components/local-entity-quick-detail-drawer.component.test.tsx`.
- `pnpm exec vitest run tests/components/event-quick-detail-content.component.test.tsx tests/components/local-entity-quick-detail-drawer.component.test.tsx` — 18 passed.
- `pnpm test:contract` — full fixture consistency passed for 88 operations.
- `SIGN291_CAPTURE_EVIDENCE=1 /opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/event-links.spec.ts --grep 'Event AI forecast reactions'` — 3 passed. This uses local fixtures and does not exercise a live producer event.
- `git diff --check` — passed.

QA owns live feature-flow testing and the coordinator owns acceptance. No live feature testing was run.
