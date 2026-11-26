# SIGN-392 local evidence

## Candidate and design source

- Repository: `signapse-group/signapse-ui`
- Branch / PR: `codex/SIGN-392-market-news-routing` / [#159](https://github.com/signapse-group/signapse-ui/pull/159), targeting `dev`
- Review base: `origin/dev` at `83f6658e8f41805a1e3e90d6bc64972f3a994a42`
- Requirement and approved design: [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32), v2 attachments 10308 (wide), 10312 (compact), and 10309 (mobile)

Feature routing groups Market news and Economic calendar in one surface. Scheduled analysis is a separate section in the main column; Telegram infrastructure sits beside it on wide screens and below it on mobile. `MARKET_NEWS_ALERT` reuses the destination, language, enable/pause, and clear controls. A route reader without `workspace:read` sees only market-route settings returned for owned workspaces; other route, workspace, destination, bot, and schedule data stay behind their own permissions.

The approved v2 Jira attachments were inspected from the local design exports in this issue workspace. The authorized Pen Desktop MCP is unavailable on this server, so no Pen operations were performed.

## Published API contract

Fetched https://dev-api.signapse.cloud/v3/api-docs on 2026-11-26 at 14:19:24 UTC. The OpenAPI root `x-build-revision` was `b6de21490d5572bdb51624372ef860230af5df86`, published by successful [BE Deploy run 45763078705](https://github.com/dgminhtam/signapse/actions/runs/45763078705).

- `GET /telegram/feature-settings` documents route-readable settings for owned workspaces without requiring `workspace:read`. Explicitly requesting a route the user cannot read returns 403.
- `TelegramFeatureSettingResponse.required` is `[destination, outputLanguage]`; `featureKey`, `workspaceId`, and `enabled` remain optional in the published schema. The coordinator's 2026-11-26 decision on [SIGN-392](https://signapse-group.atlassian.net/browse/SIGN-392) allows FE to continue while BE clarifies those guarantees. FE identifies settings from the values actually returned and shows a localized unverified state with controls disabled when route identity, workspace, or enabled state is missing. It does not infer a saved/off value or treat the optional fields as guaranteed.
- `PUT /telegram/feature-settings` for `MARKET_NEWS_ALERT` requires `telegram-market-news-routing:update`. Other route permissions do not grant this update permission.
- Sparse updates preserve omitted fields. Pause retains the saved destination, including an inactive one. Clear sends `destinationId: null` and `enabled: false`, omitting language so it is preserved. Assigning or enabling requires an eligible active destination and bot.
- The UI reports success only after the save endpoint accepts the update, then triggers a readback. On failure, the previously saved context remains visible. Scheduled analysis stays behind its independent schedule-read permission.

The schema does not publish a representative response guaranteeing the three optional fields. Local fixture tests exercise incomplete readback without exposing unrelated route data; they do not prove live API authorization or persistence. QA owns live dev permission, persistence, and readback checks.

## Rendered evidence

The full fixture suite captured dark-theme PNGs in both locales. The 760px case starts at 1520px and resizes the CSS viewport to 760px before capture. Each capture is full-page, so the image height may exceed the viewport height.

| Capture                                                                            | CSS viewport | State                                                                                          |
| ---------------------------------------------------------------------------------- | -----------: | ---------------------------------------------------------------------------------------------- |
| [Wide](telegram-routing-wide-dark-en-1520x1024.png)                                |  1520 × 1024 | EN, desktop                                                                                    |
| [Compact](telegram-routing-compact-dark-en-1024x768.png)                           |   1024 × 768 | EN, compact desktop; both Feature routing rows show destination, language, and toggle controls |
| [Mobile](telegram-routing-mobile-dark-en-390x1420.png)                             |   390 × 1420 | EN, mobile                                                                                     |
| [Small mobile](telegram-routing-small-mobile-dark-vi-360x800.png)                  |    360 × 800 | VI, mobile                                                                                     |
| [Effective 760px](telegram-routing-effective-760x512-dark-vi.png)                  |    760 × 512 | VI, resized from 1520px                                                                        |
| [Route-only reader](telegram-routing-route-only-read-dark-vi-1024x768.png)         |   1024 × 768 | VI, route read without workspace/destination/schedule read                                     |
| [Light theme](telegram-routing-wide-light-en-1520x1024.png)                        |  1520 × 1024 | EN, light theme                                                                                |
| [200% effective viewport](telegram-routing-zoom-200-effective-dark-vi-760x512.png) |    760 × 512 | VI, effective CSS viewport of 1520 × 1024 at 200%                                              |

The 760px CSS viewport is equivalent to the 1520 × 1024 wide frame at 200% and was verified for content, controls, and page overflow. The runner has no headed browser/display, and Chromium headless did not change its viewport when sent the browser zoom shortcut, so browser-level zoom scaling itself remains unverified. The 1024px compact render was compared with approved SIGN-32 attachment 10312; the Economic calendar destination, language, and toggle controls are all visible. Captures include the local application shell and fixture toolbar.

## Local checks

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts tests/core/telegram-permissions.test.ts` — 3 files and 47 tests passed, including incomplete-readback cases and focus restoration after clearing an active or inactive destination.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts` — 13 passed. Coverage includes route permission isolation, route-only owned-workspace settings without `workspace:read`, update scoping, scheduled-analysis access, destination clear/pause/reassign behavior, errors and readback, keyboard focus, render cases, light theme, effective viewport, and shell breakpoints.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --grep 'creates a pending link' --repeat-each=2` — 2 passed; verifies the pending link dialog has no page-level horizontal overflow at 195 CSS pixels.
- Render checks verify layout at 1520, 1024, 760, 390, and 360 CSS pixels, plus shell breakpoints 360, 390, 767, 768, 1024, 1439, 1440, 1520, 1920, and 2560; no page-level horizontal overflow was observed in those frames.
- `pnpm typecheck` — passed.
- Changed-file ESLint — passed.
- `pnpm test:contract` — fixture consistency passed for 90 OpenAPI operations.
- Prettier checks and `git diff --check` — passed.

No live feature test was run. QA owns live dev authorization, persistence, and readback verification after delivery.
