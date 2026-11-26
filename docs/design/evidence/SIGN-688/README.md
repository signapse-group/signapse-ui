# SIGN-688 Economic calendar routing evidence

Implementation source: [`cc20dc4b2060c2ebc031c9a491c299e65af34c42`](https://github.com/signapse-group/signapse-ui/commit/cc20dc4b2060c2ebc031c9a491c299e65af34c42), based on `origin/dev` [`4179b7a095482228b3df21cc2e0937676c7f1b6e`](https://github.com/signapse-group/signapse-ui/commit/4179b7a095482228b3df21cc2e0937676c7f1b6e). The captures and this record are in the follow-up evidence commit on the same PR candidate.

## Accepted design

Compared the Economic calendar row with the approved v2 PNGs on [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32), approved 2026-11-23: Wide attachment **10308**, `telegram-settings-wide-20261123-v2.png`; Compact attachment **10312**, `telegram-settings-compact-20261123-v2.png`; Mobile attachment **10309**, `telegram-settings-mobile-20261123-v2.png`.

The Off, unassigned row follows the approved Economic calendar state. The assigned-state clear button follows the clear control inside the Market news Destination field shown in attachment 10308. The comparison covers the affected row and its position under Feature routing; other route controls and Telegram delivery were outside this Subtask.

## Candidate renders

All renders use the P0 fixture-backed browser test, Chromium, dark theme and Vietnamese locale. The first three use Off with no destination; the last uses Off with `Operations channel` assigned and English selected.

- Wide, **1520×1024**, expanded sidebar: [candidate render](economic-calendar-wide-dark-vi-1520x1024.png). Compared with SIGN-32 attachment 10308 for the desktop row, status control and field grouping.
- Compact, **1024×768**, collapsed sidebar: [candidate render](economic-calendar-compact-dark-vi-1024x768.png). Compared with SIGN-32 attachment 10312 for the compact table and collapsed navigation.
- Mobile, **390×844**, navigation closed: [candidate render](economic-calendar-mobile-dark-vi-390x844.png). Compared with SIGN-32 attachment 10309 for the stacked Destination and Language controls. The source is a 390×1420 full-page capture; this candidate is a viewport capture with the row in its page context.
- Assigned mobile state, **390×844**, navigation closed: [candidate render](economic-calendar-off-assigned-mobile-dark-vi-390x844.png). Compared with the clear-in-Destination pattern in SIGN-32 attachment 10308; the row remains Off and retains English.

The browser test checks page-level horizontal overflow at **1520, 1024, 767, 768, 1439, 1440, 390, 360 and 760 CSS pixels**. The 760px viewport models the effective layout width of a 1520px frame at 200% zoom; native browser zoom was not changed. Sidebar modes captured are expanded at 1520, collapsed at 1024 and closed on mobile. Light theme was not captured. The accessibility smoke test found no serious or critical axe violations in the Telegram state; it is not a full contrast audit.

## API contract evidence

Fetched `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-26; the response `Date` header was `Thu, 26 Nov 2026 06:16:19 GMT`. The document's `x-build-revision` was `b6de21490d5572bdb51624372ef860230af5df86`. [Deploy run 45763078705](https://github.com/dgminhtam/signapse/actions/runs/45763078705) completed `check`, `publish` and `deploy` successfully for that exact SHA. `/health` and `/health/readiness` each returned HTTP 200 at 06:18 UTC. The deployed revision merges the delivered SIGN-683 revision `4103670c24fa7f638824a9597e41005bba877783` as its first parent, followed by SIGN-684's OpenAPI nullable-reference correction.

The published `GET /telegram/feature-settings` contract documents per-route read permissions, owner-scoped results and `workspace.id eq` filtering. FE sends that filter for the current workspace from `/me`; it does not request `/me/workspaces`. The published PUT schema and description confirm route-specific update permissions, omission-preserves semantics, atomic `destinationId: null` with `enabled: false` for clear, required nullable readback fields and 400/403/404 error cases. Assignment or enabling requires an eligible active destination and bot. These are contract and deployment checks; no live feature request was made.

## Local verification

- `pnpm exec vitest run tests/core/telegram-permissions.test.ts tests/api/telegram-action.test.ts tests/api/permissions-server.test.ts tests/components/telegram-configuration.component.test.tsx --reporter=dot` — 4 files, **47 passed**. Covers permissions, `/me` workspace summary, request normalization/errors and Telegram controls.
- `pnpm typecheck` — passed.
- Targeted `pnpm exec eslint` and `pnpm exec prettier --check` — passed for the changed app, fixture and test files listed in the PR.
- `git diff --check` — passed.
- `pnpm exec playwright test tests/e2e/telegram-economic-calendar-routing.spec.ts tests/e2e/telegram.spec.ts --config=playwright.config.ts --project=chromium-vi` — **3 passed**. Covers route-only permissions, workspace filter, destination/schedule/bot list isolation, persisted clear/readback, English retention, breakpoint reflow and existing Telegram operations.
- `pnpm exec playwright test tests/e2e/accessibility.spec.ts --config=playwright.config.ts --project=chromium-vi --grep 'Telegram state'` — **1 passed**.

P0 checks use local fixtures and do not establish production authorization, persistence, Telegram delivery or live dev feature behavior. QA owns live dev behavior checks; the coordinator owns parent acceptance.
