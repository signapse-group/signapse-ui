# SIGN-392 local evidence

## Candidate and design source

- Repository: `signapse-group/signapse-ui`
- Branch / PR: `codex/SIGN-392-market-news-routing` / [#159](https://github.com/signapse-group/signapse-ui/pull/159), targeting `dev`
- Review base: `origin/dev` at `fd9ba256091a259bd968c6f29a5eb169d004a736`
- Requirement and approved design: [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32), v2 attachments 10308 (wide), 10312 (compact), and 10309 (mobile)

Feature routing groups Market news and Economic calendar in one surface. Scheduled analysis is a separate section in the main column; Telegram infrastructure sits beside it on wide screens and below it on mobile. `MARKET_NEWS_ALERT` reuses the destination, language, enable/pause, and clear controls. A route reader without `workspace:read` sees only market-route settings returned for owned workspaces; other route, workspace, destination, bot, and schedule data stay behind their own permissions.

## Published API contract

Fetched https://dev-api.signapse.cloud/v3/api-docs on 2026-11-25 at 08:02:42 UTC. `x-build-revision` was `fcaa3e03518efc734a31d3822c2f3fba3cd81d92`, published by [BE Deploy run 45561552057](https://github.com/dgminhtam/signapse/actions/runs/45561552057).

- `GET /telegram/feature-settings` documents route-readable settings for owned workspaces without requiring `workspace:read`. Explicitly requesting a route the user cannot read returns 403.
- **Producer contract gap:** `TelegramFeatureSettingResponse` lists `featureKey`, `workspaceId`, and `enabled`, but its `required` array contains only `destination`. The FE needs all three fields to identify owned route rows and render the saved enabled state after readback. The current published schema therefore does not guarantee the response needed for AC-1/2. Resume this dependency when a published dev schema or example guarantees those fields for route-only reads.
- `PUT /telegram/feature-settings` for `MARKET_NEWS_ALERT` requires `telegram-market-news-routing:update`. Other route permissions do not grant this update permission.
- Sparse updates preserve omitted fields. Pause retains the saved destination, including an inactive one. Clear sends `destinationId: null` and `enabled: false`, omitting language so it is preserved. Assigning or enabling requires an eligible active destination and bot.
- The save response is authoritative; the UI only reports success after a confirmed save and refresh. On failure, the previously saved context remains visible. Scheduled analysis stays behind its independent schedule-read permission.

The schema lists the expected response fields but does not publish a representative response guaranteeing the three fields above. Local fixture tests verify client request/response handling; they do not prove live API authorization or persistence.

## Rendered evidence

The full fixture suite captured dark-theme PNGs in both locales. The 760px case starts at 1520px and resizes the CSS viewport to 760px before capture. Each capture is full-page, so the image height may exceed the viewport height.

| Capture                                                                            | CSS viewport | State                                                      |
| ---------------------------------------------------------------------------------- | -----------: | ---------------------------------------------------------- |
| [Wide](telegram-routing-wide-dark-en-1520x1024.png)                                |  1520 × 1024 | EN, desktop                                                |
| [Compact](telegram-routing-compact-dark-en-1024x768.png)                           |   1024 × 768 | EN, compact desktop                                        |
| [Mobile](telegram-routing-mobile-dark-en-390x1420.png)                             |   390 × 1420 | EN, mobile                                                 |
| [Small mobile](telegram-routing-small-mobile-dark-vi-360x800.png)                  |    360 × 800 | VI, mobile                                                 |
| [Effective 760px](telegram-routing-effective-760x512-dark-vi.png)                  |    760 × 512 | VI, resized from 1520px                                    |
| [Route-only reader](telegram-routing-route-only-read-dark-vi-1024x768.png)         |   1024 × 768 | VI, route read without workspace/destination/schedule read |
| [Light theme](telegram-routing-wide-light-en-1520x1024.png)                        |  1520 × 1024 | EN, light theme                                            |
| [200% effective viewport](telegram-routing-zoom-200-effective-dark-vi-760x512.png) |    760 × 512 | VI, effective CSS viewport of 1520 × 1024 at 200%          |

Chromium headless did not change its viewport when sent the browser zoom shortcut. The 760px CSS viewport is equivalent to the 1520 × 1024 wide frame at 200% and was verified for content, controls, and page overflow, but browser-level zoom scaling itself was not exercised. Captures include the local application shell and fixture toolbar.

## Local checks

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts tests/core/telegram-permissions.test.ts` — 3 files, 22 tests passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts` — 11 passed. Covers route permission isolation, route-only owned-workspace settings without `workspace:read`, update scoping, scheduled-analysis access, destination clear/pause/reassign behavior, error and readback behavior, keyboard focus for clear, five dark render cases, light theme, effective 200% viewport, and shell breakpoints.
- Render checks verify layout at 1520, 1024, 760, 390, and 360 CSS pixels, plus shell breakpoints 360, 390, 767, 768, 1024, 1439, 1440, 1520, 1920, and 2560; no page-level horizontal overflow was observed.
- `pnpm typecheck` — passed.
- Changed-file ESLint — passed.
- `pnpm test:contract` — fixture consistency passed for 90 OpenAPI operations.
- Prettier checks and `git diff --check` — passed.

No live feature test was run. QA owns live dev authorization, persistence, and readback verification after delivery.
