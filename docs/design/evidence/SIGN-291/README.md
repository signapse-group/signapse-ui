# SIGN-291 AI forecast render evidence

## Design and API references

The Event Detail reference is SIGN-262's approved Design from 2026-11-18: Wide attachment [10286](https://signapse-group.atlassian.net/browse/SIGN-262) (`event-detail-wide-20261118.png`) and Mobile attachment [10287](https://signapse-group.atlassian.net/browse/SIGN-262) (`event-detail-mobile-20261118.png`). Both current Jira attachments were inspected. The candidate follows the shared Market Reactions heading and the repeated forecast-card layout. It also makes the AI interpretation and confidence limits explicit in localized copy.

The current dev OpenAPI document at `https://dev-api.signapse.cloud/v3/api-docs` was freshly fetched on 2026-11-19 22:29:05 UTC. It returned HTTP 200 with build revision `3c48b821e7809b7744fedee65ce34ac241009591` and SHA-256 `20510f6e5d9b9d1423d35c710735ae6a797bd9edd44a48fcaa8a6113c8c45790`. The revision matches the latest producer delivery recorded in [SIGN-304 comment 11560](https://signapse-group.atlassian.net/browse/SIGN-304?focusedCommentId=11560), from merged [producer PR #212](https://github.com/dgminhtam/signapse/pull/212); that delivery changes event derivation/persistence and does not change the event HTTP schema. The latest contract retains the SIGN-289 forecast semantics. `GET /events/{id}` is bearer-authenticated, accepts the selected locale in `Accept-Language`, returns `EventResponse` on 200 and declares 401/403/404/409/500/503 responses. It returns only stored `marketReactions`; the required array has one item per asset/horizon, and each item's ID, asset ID/name/symbol/type, direction, horizon, confidence, reasoning and `observedAt` are required. Confidence, reasoning and `observedAt` may be null; asset name and symbol are strings without a minimum length, so the UI falls back to `assetId` only when both are empty. An empty array means no forecast. The GET operation does not derive a reaction or substitute a neutral direction or outcome. `observedAt` is a forecast anchor, not a measured-price timestamp, so this view omits it. Confidence is shown as the producer's AI confidence, never as a verified trading win rate.

## Candidate renders

These captures came from the P0 fixture-backed browser test at the FE HTTP boundary, including SSR. The full-page renders use 1520×1280, 390×844, and 1024×900 CSS viewports; the 760×512 image is a viewport crop. The populated scenario contains four stored reactions across four directions and multiple horizons, including two horizons for SKYY, plus DXY as a related asset without a forecast. A second Event uses an empty `marketReactions` array.

- Event Detail, dark, English, Wide 1520×1280 viewport: [candidate render](event-detail-wide-dark-en-1520x1280.png).
- Event Detail, light, English, Wide 1520×1280 viewport: [candidate render](event-detail-wide-light-en-1520x1280.png).
- Event Detail, dark, English, Mobile 390×844 viewport: [candidate render](event-detail-mobile-dark-en-390x844.png).
- Event Detail, light, Vietnamese, Compact 1024×900 viewport, no stored forecasts: [empty-state render](event-market-reactions-empty-compact-vi-1024x900.png).
- Market Reactions, light, English, 760×512 effective CSS viewport ([1520×1024 at 200% zoom](event-market-reactions-zoom-200-equivalent-en-760x512.png)); the cards use one column below the 768px layout breakpoint, with no horizontal overflow. The capture starts at the section heading.

The Bullish badge uses shared `positive` tokens. Its resolved text/background contrast is 6.49:1 in light mode and 10.62:1 in dark mode, above the 4.5:1 normal-text target. The label remains visible, so direction is not conveyed by color alone.

The fixture checks localized labels, distinct asset/horizon cards, all four directions, null confidence and reasoning, empty arrays, a missing reaction field, and a 503 event read. The separate Vietnamese render shows the empty state only for the Event whose reaction array is empty. The missing-field and request-error states remain distinct. Browser requests are read-only for this page load; the test asserts no reaction-generation POST.

The shared “Ask Signapse” control stays fixed in the shell. The 760×512 check confirms no visible forecast-card text intersects it at the section-start position, and confirms the last reasoning can be brought above it when read. The mobile full-page capture still shows the control over the unrelated Evidence action row; that shell-level placement is outside this feature's scope.

## Verification

- `pnpm typecheck` — passed.
- `pnpm exec eslint 'app/[lang]/(main)/events/[id]/page.tsx' tests/e2e/event-links.spec.ts` — passed.
- `pnpm exec vitest run tests/components/event-quick-detail-content.component.test.tsx tests/components/local-entity-quick-detail-drawer.component.test.tsx` — 18 passed.
- `pnpm test:contract` — full fixture consistency passed for 88 operations.
- `SIGN291_CAPTURE_EVIDENCE=1 /opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/event-links.spec.ts --grep 'Event AI forecast reactions'` — 3 passed. This uses local fixtures and does not exercise a live producer event. It checks resolved Bullish badge contrast in both themes, the 760×512 effective viewport for 200% zoom from 1520×1024, no text overlap at first paint or at the Market Reactions section, and the last reasoning after scrolling; no page overflow.
- `git diff --check` — passed.

QA owns live feature-flow testing and the coordinator owns acceptance. No live feature testing was run.
