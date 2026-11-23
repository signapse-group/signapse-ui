# SIGN-392 rendered evidence

## Candidate and design source

- Repository: `signapse-group/signapse-ui`
- Branch: `codex/SIGN-392-market-news-routing`
- Layout correction commit: `057770e`
- Review base: `origin/dev` at `fd9ba256091a259bd968c6f29a5eb169d004a736`
- Requirement and design: [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32), approved v2 attachments 10308 (wide), 10312 (compact), and 10309 (mobile).

The candidate puts Feature routing and Scheduled analysis in the main column, with Telegram infrastructure in the side column at desktop widths. At mobile widths, routing and schedules precede infrastructure. `MARKET_NEWS_ALERT` keeps its destination, language, switch, and clear controls together in a card at all widths; other feature routes retain the existing table.

## Published API contract

Checked https://dev-api.signapse.cloud/v3/api-docs on 2026-11-23 at 20:14:41 UTC; `x-build-revision` was `73e82b158326343a36493798feed8b07e8c72fff`.

- `GET /telegram/feature-settings` returns settings visible under route-specific read permission for owned workspaces. A targeted unreadable route returns 403.
- `PUT /telegram/feature-settings` requires `telegram-market-news-routing:update` for `MARKET_NEWS_ALERT`, independently of the generic feature update permission.
- Sparse updates preserve omitted fields. Clearing sends `destinationId: null` with `enabled: false` and omits language. Pausing omits the destination, including when it is inactive. Assigning or enabling requires an eligible active destination and bot. Missing eligible destination returns 400; permission errors return 403; unowned workspace/destination errors return 404.
- The response includes `destination`, which can be null. The UI treats only the confirmed save response as success and refreshes saved state; errors keep the previously saved selection visible.
- `Scheduled analysis` remains behind its independent schedule-read permission.

## Partial rendered captures

The locked browser suite rendered these three frames and its structural/layout and overflow assertions passed before the compact readiness grid was refined. They are useful for the routing/infrastructure placement and control grouping, but are **not final captures of the current candidate**. Final recapture and the remaining 360px, effective 760px, and shell-breakpoint checks are pending a fresh browser lease.

| Partial capture                                          |    Viewport |    PNG size | Locale / state        |
| -------------------------------------------------------- | ----------: | ----------: | --------------------- |
| [Wide](telegram-routing-wide-dark-en-1520x1024.png)      | 1520 × 1024 | 1520 × 1024 | EN, sidebar expanded  |
| [Compact](telegram-routing-compact-dark-en-1024x768.png) |  1024 × 768 | 1024 × 1081 | EN, sidebar collapsed |
| [Mobile](telegram-routing-mobile-dark-en-390x1420.png)   |  390 × 1420 |  390 × 2376 | EN, overlay closed    |

## Local checks and limits

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts tests/core/telegram-permissions.test.ts` — 3 files, 20 tests passed.
- `pnpm typecheck` — passed.
- Changed-file ESLint — passed.
- `pnpm test:contract` — fixture consistency passed for 90 OpenAPI operations.
- Prettier check and `git diff --check` — passed.
- The first three render cases (1520, 1024, and 390 CSS pixels) passed in a partial fixture run. The corrected full suite is not verified: `/opt/apps/symphony/runtime/run-fe-browser` returned `resource_busy` because the host browser lease is fenced by an active session cgroup. The lock was not bypassed or cleared.
- The workspace did not run a live feature test. Fixture coverage does not prove live API authorization, persistence, or readback; QA owns those checks on dev after delivery.

## Open acceptance question

AC-1 says route-specific read access allows a user to view workspace route configuration. The page currently gets active workspace context through `workspace:read`; without it, returned feature settings cannot be associated with the active workspace. The coordinator must decide whether route-only readers must see saved configuration using owned-workspace context, or whether `workspace:read` is an explicit prerequisite and AC-1 needs an update. No permission boundary was inferred locally.
