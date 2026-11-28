# SIGN-392 local evidence

## Candidate and design source

- Repository: `signapse-group/signapse-ui`
- Branch / PR: `codex/SIGN-392-market-news-routing` / [#159](https://github.com/signapse-group/signapse-ui/pull/159), targeting `dev`
- Sync base: `origin/dev` at `866630a0a004cc8a5b4ed4ce0c7b9c8daf971146`
- Requirement and approved design: [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32), v2 attachments 10308 (wide), 10312 (compact), and 10309 (mobile)
- Rechecked the live attachment list and downloaded all three approved frames on 2026-11-27 at 03:55 UTC.
- Render capture revision: `cf4c20471540124ecec91223caa6348042912026`, before syncing with `origin/dev`

Feature routing groups Market news and Economic calendar in one surface. Scheduled analysis stays separate in the main column; Telegram infrastructure sits in the side column on desktop and below the main content on mobile. `MARKET_NEWS_ALERT` reuses destination, language, enable/pause, and clear controls. A route reader without `workspace:read` sees only market-route settings returned for owned workspaces; other route, workspace, destination, bot, and schedule data stay behind their own permissions.

The `origin/dev` sync added the separately authorized Bot connections removal behavior and retired Playwright. The Market news route surface and its layout were preserved from the render capture revision; the images remain valid for this subtask's route scope. The Bot connections portion of those full-page captures reflects the pre-sync implementation and is not evidence for SIGN-681.

The approved v2 Jira attachments were downloaded through the Jira attachment operation into a run-local workspace folder and inspected against the candidate renders. The authorized Pen Desktop MCP is unavailable on this server, so no Pen operations were performed.

The resumed accessibility fix changes only the destination selector's localized accessible name (`Destination for {route}` / `Điểm nhận cho {route}`); it does not change layout or visible content. The existing route renders remain valid for visual comparison. Component assertions cover both locales and retain the separate clear-button name.

## Published API contract

Fetched [OpenAPI dev](https://dev-api.signapse.cloud/v3/api-docs) on 2026-11-27 at 03:54:52 UTC. The OpenAPI root `x-build-revision` was `b6de21490d5572bdb51624372ef860230af5df86`, published by successful [BE Deploy run 45763078705](https://github.com/dgminhtam/signapse/actions/runs/45763078705).

- `GET /telegram/feature-settings` returns only routes the caller can read in workspaces they own; it does not require `workspace:read`. An explicit filter for an unreadable route returns 403. The supported filters are `featureKey` and `workspace.id`.
- `TelegramFeatureSettingResponse.required` is `[destination, outputLanguage]`; `featureKey`, `workspaceId`, and `enabled` remain optional. The coordinator's 2026-11-26 decision on [SIGN-392 comment #11805](https://signapse-group.atlassian.net/browse/SIGN-392) allows FE to continue while BE clarifies those response guarantees. FE uses the returned values and renders an unverified state with controls disabled when route identity, workspace, or enabled state is missing.
- `PUT /telegram/feature-settings` requires `telegram-market-news-routing:update` for `MARKET_NEWS_ALERT`; other route permissions do not grant this update. Sparse updates preserve omitted fields. Clear sends `destinationId: null` and `enabled: false` while omitting language. Pause keeps the saved destination, including an inactive destination. Assigning or enabling requires an eligible active destination and bot; an invalid enable returns 400, permission failure returns 403, and unknown/unowned workspace or destination returns 404. Failed updates leave the saved setting unchanged.
- Success is shown only after the save response is accepted, followed by route readback. On failure, the previously saved context remains visible. Scheduled analysis keeps its independent schedule-read permission.

The schema does not guarantee the three optional route identity/state fields. Local fixtures exercise incomplete readback but do not prove live authorization or persistence. QA owns live dev permission, persistence, and readback checks.

## Rendered evidence

The fixture suite captured dark-theme PNGs in both locales at render revision `cf4c20471540124ecec91223caa6348042912026`. Each capture is full-page, so the image height may exceed the viewport height.

| Capture                                                                            | CSS viewport | Theme and state                                                                                | Sidebar      |
| ---------------------------------------------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------------- | ------------ |
| [Wide](telegram-routing-wide-dark-en-1520x1024.png)                                |  1520 × 1024 | EN, desktop                                                                                    | Expanded     |
| [Compact](telegram-routing-compact-dark-en-1024x768.png)                           |   1024 × 768 | EN, compact desktop; both Feature routing rows show destination, language, and toggle controls | Collapsed    |
| [Mobile](telegram-routing-mobile-dark-en-390x1420.png)                             |   390 × 1420 | EN, mobile                                                                                     | Collapsed    |
| [Small mobile](telegram-routing-small-mobile-dark-vi-360x800.png)                  |    360 × 800 | VI, mobile                                                                                     | Collapsed    |
| [Effective 760px](telegram-routing-effective-760x512-dark-vi.png)                  |    760 × 512 | VI, resized from 1520px; not an independent shell render                                       | Not measured |
| [Route-only reader](telegram-routing-route-only-read-dark-vi-1024x768.png)         |   1024 × 768 | VI, market-route read without workspace, destination, or schedule read                         | Collapsed    |
| [Light theme](telegram-routing-wide-light-en-1520x1024.png)                        |  1520 × 1024 | EN, light theme                                                                                | Expanded     |
| [200% effective viewport](telegram-routing-zoom-200-effective-dark-vi-760x512.png) |    760 × 512 | VI, effective CSS viewport for 1520 × 1024 at 200%                                             | Not measured |

The 760px capture proves reflow at that effective CSS width; it is not browser-level 200% zoom evidence. Per the latest coordinator resolution in [SIGN-392 comment #11870](https://signapse-group.atlassian.net/browse/SIGN-392), native browser zoom and live feature behavior are assigned to QA. FE did not mark those observations as Pass. Captures include the application shell and fixture toolbar.

The 1024px compact render was compared with approved SIGN-32 attachment 10312. The Economic calendar destination, language, and toggle controls are visible. Shell breakpoints were checked at 360, 390, 767, 768, 1024, 1439, 1440, 1520, 1920, and 2560 CSS pixels; the full-page capture suite reported no page-level horizontal overflow.

## Local checks

- Previous post-sync candidate `abf3fd21863596f3243655876d165f0f56825878`: `pnpm test:quality` passed on retry (103 Vitest files, 878 tests, typecheck, 89-operation fixture consistency, and all 5 deployment verification checks). Its first run had one failure in the unchanged `CronjobListPage` focus test; the repeat passed.
- Current accessibility-fix candidate: `pnpm test:quality` passed (103 Vitest files, 880 tests, typecheck, 89-operation fixture consistency, and all 5 deployment verification checks). The first run exposed missing cleanup in the new locale cases; after adding scoped cleanup, the full rerun passed. ESLint reported no errors and 23 warnings in unrelated files.
- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx` — passed: 30 tests, including EN/VI destination accessible names and the separate clear-button name.
- `pnpm test:contract` — passed on the current candidate: fixture consistency for 89 OpenAPI operations.
- Pre-sync historical browser run at `cf4c20471540124ecec91223caa6348042912026`: 13 passed; repeat of the pending-link 195px overflow case: 2 passed. The dev sync retired Playwright, so these are preserved historical results, not current-candidate tests.
- Prettier check on the four changed TypeScript files and `git diff --check` — passed. Prettier still flags the unchanged render-evidence table formatting; the same table fails at the previous revision.

No live feature test was run. QA owns live dev authorization, persistence, readback, and native browser zoom 200%. Independent review owns merge, dev delivery, and deployed-revision verification.
