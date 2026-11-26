# SIGN-688 Economic calendar routing evidence

Follow-up implementation and render commit: [`7ee918d47a849b353c8d278537e9d89b6f050d8f`](https://github.com/signapse-group/signapse-ui/commit/7ee918d47a849b353c8d278537e9d89b6f050d8f), based on `origin/dev` [`4179b7a095482228b3df21cc2e0937676c7f1b6e`](https://github.com/signapse-group/signapse-ui/commit/4179b7a095482228b3df21cc2e0937676c7f1b6e). This PR candidate includes the earlier implementation commit [`cc20dc4b2060c2ebc031c9a491c299e65af34c42`](https://github.com/signapse-group/signapse-ui/commit/cc20dc4b2060c2ebc031c9a491c299e65af34c42).

## Accepted design

Compared the Economic calendar row with the approved v2 PNGs on [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32), approved 2026-11-23: Wide attachment **10308**, `telegram-settings-wide-20261123-v2.png`; Compact attachment **10312**, `telegram-settings-compact-20261123-v2.png`; Mobile attachment **10309**, `telegram-settings-mobile-20261123-v2.png`.

The Off, unassigned row follows the approved Economic calendar state. The assigned-state clear button follows the clear control inside the Market news Destination field shown in attachment 10308. The single-route card keeps the title and Off switch together, places Destination and Language side by side at compact and wide widths, and stacks them on mobile. The comparison covers the affected row and its position under Feature routing; other route behavior and Telegram delivery were outside this Subtask.

## Candidate renders

All renders are from follow-up commit `7ee918d`, using the P0 fixture-backed browser test, Chromium, dark theme and Vietnamese locale. The first three use Off with no destination; the last uses Off with `Operations channel` assigned and English selected.

- Wide, **1520×1024**, expanded sidebar: [candidate render](economic-calendar-wide-dark-vi-1520x1024.png). Compared with SIGN-32 attachment 10308 for the desktop row, status control and field grouping.
- Compact, **1024×768**, collapsed sidebar: [candidate render](economic-calendar-compact-dark-vi-1024x768.png). Compared with SIGN-32 attachment 10312; Destination, Language and the Off switch all fit in the first viewport, and Destination and Language share a row.
- Mobile, **390×844**, navigation closed: [candidate render](economic-calendar-mobile-dark-vi-390x844.png). Compared with SIGN-32 attachment 10309 for the stacked Destination and Language controls. The source is a 390×1420 full-page capture; this candidate is a viewport capture with the row in its page context.
- Assigned mobile state, **390×844**, navigation closed: [candidate render](economic-calendar-off-assigned-mobile-dark-vi-390x844.png). Compared with the clear-in-Destination pattern in SIGN-32 attachment 10308; the row remains Off and retains English.

The browser test checks page-level horizontal overflow at **1520, 1024, 767, 768, 1439, 1440, 390, 360 and 760 CSS pixels**. It also checks the three compact controls' bounds against 1024×768 and verifies that fields stack at 767px and share a row at 768px. The 760px viewport models the effective layout width of a 1520px frame at 200% zoom; native browser zoom was not changed. Sidebar modes captured are expanded at 1520, collapsed at 1024 and closed on mobile. Light theme was not captured. The accessibility smoke test found no serious or critical axe violations in the Telegram state; it is not a full contrast audit.

## API contract evidence

Fetched `https://dev-api.signapse.cloud/v3/api-docs` again on 2026-11-26; the response `Date` header was `Thu, 26 Nov 2026 07:25:53 GMT`, and `x-build-revision` remained `b6de21490d5572bdb51624372ef860230af5df86`. [Deploy run 45763078705](https://github.com/dgminhtam/signapse/actions/runs/45763078705) completed `check`, `publish` and `deploy` successfully for that exact SHA. `/health` and `/health/readiness` each returned HTTP 200 at 06:18 UTC. The deployed revision merges the delivered SIGN-683 revision `4103670c24fa7f638824a9597e41005bba877783` as its first parent, followed by SIGN-684's OpenAPI nullable-reference correction.

The published `GET /telegram/feature-settings` contract documents per-route read permissions, owner-scoped results and `workspace.id eq` filtering. FE sends that filter for the current workspace from `/me`; it does not request `/me/workspaces`. The published PUT schema and description confirm route-specific update permissions, omission-preserves semantics, atomic `destinationId: null` with `enabled: false` for clear, required nullable readback fields and 400/403/404 error cases. Assignment or enabling requires an eligible active destination and bot. These are contract and deployment checks; no live feature request was made.

## Local verification

- Initial implementation run at `cc20dc4`: `pnpm exec vitest run tests/core/telegram-permissions.test.ts tests/api/telegram-action.test.ts tests/api/permissions-server.test.ts tests/components/telegram-configuration.component.test.tsx --reporter=dot` — 4 files, **47 passed**. Covers permissions, `/me` workspace summary, request normalization/errors and Telegram controls.
- Follow-up: `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx --reporter=dot` — 1 file, **19 passed**.
- Follow-up `pnpm typecheck`, targeted ESLint, Prettier check and `git diff --check` — passed.
- `git diff --check` — passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram-economic-calendar-routing.spec.ts --project=chromium-vi` — follow-up **2 passed**. Covers route-only permissions, workspace filter, destination/schedule/bot list isolation, persisted clear/readback, English retention, 1024×768 control bounds, breakpoint reflow and keyboard focus after clear.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/accessibility.spec.ts --project=chromium-vi --grep 'Telegram state'` — **1 passed**.

P0 checks use local fixtures and do not establish production authorization, persistence, Telegram delivery or live dev feature behavior. QA owns live dev behavior checks; the coordinator owns parent acceptance.

## Follow-up attempt #1

Candidate implementation: [`ffe2dea5a9c6559acbc2f047da176ec27a090001`](https://github.com/signapse-group/signapse-ui/commit/ffe2dea5a9c6559acbc2f047da176ec27a090001) on the same `origin/dev` base. This follow-up sends the current enabled state on every partial Economic route update, explicitly defaulting a newly created route to Off. The fixture now models the published API behavior where an omitted `enabled` on a new setting defaults to On and returns the saved setting, so the added browser case verifies first assignment remains Off after readback. The Suspense fallback now places the permitted Feature routing row first and follows the single Economic row's compact/mobile layout.

Checks on this candidate:

- `pnpm typecheck` — passed.
- Targeted ESLint and Prettier checks — passed.
- `git diff --check` — passed.
- `pnpm test:contract` — fixture consistency passed for 90 operations.
- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts --reporter=dot` — 2 files, **40 passed**.

The required P0 browser run could not start. `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram-economic-calendar-routing.spec.ts --project=chromium-vi --grep "Economic calendar loading layout"` returned `resource_busy: host browser slot occupied; retry_after_seconds=30` on repeated attempts. The host lease points to a still-populated Symphony session cgroup; no local browser runner remains, so the lease was left intact and the wrapper was not bypassed. The new first-assignment readback and compact/mobile loading-state cases therefore remain unverified on this candidate, and no new loading screenshots were captured. The earlier loaded-state renders and two passing route journeys above belong to the previous candidate and are not evidence for these follow-up cases. Capture the pending states at **1024×768** (collapsed sidebar) and **390×844** (navigation closed), dark theme, Vietnamese locale, browser zoom 100%; use the existing responsive cases for layout bounds. No live feature request or product deployment was attempted.
