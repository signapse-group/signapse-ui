# SIGN-688 Economic calendar routing evidence

## Current synced candidate — 2026-11-27

This is the active handoff record. The render captures and candidate notes below are from pre-sync revisions; keep them as historical evidence only. The current candidate merges `origin/dev` at `c01c3dc24baebba11b070d2bfd569ff4c4d5ab27` and is PR [#163](https://github.com/signapse-group/signapse-ui/pull/163), targeting `dev`. The sync commit is [`3cee4777e26c30bb0bfacb0e49100a9c6d7320e1`](https://github.com/signapse-group/signapse-ui/commit/3cee4777e26c30bb0bfacb0e49100a9c6d7320e1); it includes the current-dev test harness migration and the Economic routing conflict resolutions.

### Contract and local checks

- Fetched `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-27 at 09:25 UTC; `x-build-revision` was `846afbc95bc5a7b75774a002b24c50b274b02cb7`. The current GET is filtered by route and owner workspace. The PUT preserves omitted fields, allows atomic clear with `destinationId: null` and `enabled: false`, and returns the saved route. Readback requires nullable `destination` and `outputLanguage`; FE also fails closed if display-critical route identity or enabled state is missing.
- `pnpm test:quality` — passed: lint (23 existing warnings outside changed files), typecheck, 103 Vitest files / 921 tests, deployment verifier (5 tests), and fixture consistency (89 operations).
- Separate `pnpm test:contract` — passed; fixture consistency covered 89 operations.
- GitHub `Verify / check` passed for `3cee4777e26c30bb0bfacb0e49100a9c6d7320e1`: [run 45973743388](https://github.com/signapse-group/signapse-ui/actions/runs/45973743388). The required `Vercel – signapse-ui` preview for this revision is Ready: [preview](https://signapse-9c00xxurt-signapse.vercel.app). Branch protection requires those two checks; both succeeded.

### Visual observation and QA handoff

The preview build succeeded, but the available page fetch for `/en/telegram` returned HTTP 429 with a Vercel Security Checkpoint, so I could not inspect the rendered route or capture a screenshot for this synced candidate. The PNGs and responsive observations below were captured before the `origin/dev` sync and are not asserted to match the current merged UI. The authorized Pen Desktop MCP is on the coordinator's Windows workstation and is unavailable on this server; no Pen operation was attempted.

QA owns the visual and live behavior follow-up on the delivered dev revision: compare the Economic row with SIGN-32 v2 attachments 10308, 10312 and 10309; record the state, viewport and browser zoom; cover wide, compact and mobile layouts, both themes, native 200% zoom, Off with and without a destination, clear, reassignment, enabling and error/readback behavior. No live feature API request or Telegram delivery test was made in this FE session. The coordinator owns merge, delivery and parent acceptance.

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

The published `GET /telegram/feature-settings` contract documents per-route read permissions, owner-scoped results and `workspace.id eq` filtering. FE sends that filter for the current workspace from `/me`; it does not request `/me/workspaces`. The published PUT schema and description confirm route-specific update permissions, omission-preserves semantics, atomic `destinationId: null` with `enabled: false` for clear, and 400/403/404 error cases. The response schema requires nullable `destination` and `outputLanguage`, but leaves top-level `id`, `featureKey`, `workspaceId` and `enabled` optional. The FE readback guard below fails visibly closed when those display-critical fields are absent. Assignment or enabling requires an eligible active destination and bot. These are contract and deployment checks; no live feature request was made.

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

## Resume verification on candidate `81b39545`

The host browser slot was available after the coordinator resumed SIGN-688 to Progress. On 2026-11-26, Chromium `chromium-vi` ran the following selected fixture-backed cases from this workspace and candidate:

```text
/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram-economic-calendar-routing.spec.ts --project=chromium-vi --grep 'Economic calendar loading layout|first Economic calendar assignment'
```

Result: **3 passed**. The first assignment test selected an eligible destination for a missing setting, observed the success response/readback and confirmed the route remained Off. The two loading tests held the fixture GET open, checked the Feature routing section and Economic calendar row were visible, checked there was no page-level horizontal overflow, captured the pending state, then released the fixture. This verifies the resumed gap without making a live API or Telegram request.

- Compact loading, **1024×768**, collapsed sidebar, dark theme, Vietnamese locale, 100% browser zoom: [candidate render](economic-calendar-loading-compact-dark-vi-1024x768.png). Compared with approved SIGN-32 attachment **10312** and the compact responsive frame. Feature routing appears first; Destination and output-language placeholders share a row; the page has no horizontal overflow.
- Mobile loading, **390×844**, navigation closed, dark theme, Vietnamese locale, 100% browser zoom: [candidate render](economic-calendar-loading-mobile-dark-vi-390x844.png). Compared with approved SIGN-32 attachment **10309** and the mobile responsive frame. The controls stack vertically and the route skeleton remains in the first viewport.

The selected P0 cases passed on code candidate `81b39545`; this evidence-only follow-up adds the captured screenshots and this record without changing runtime source. Earlier loaded-state renders remain from `7ee918d`; the resumed code changes only altered the Economic route's partial-save default and the Suspense fallback, so the existing loaded-state comparison remains applicable. This visual review covers the affected route and its loading state; light theme and native 200% browser zoom were not captured.

The published OpenAPI was fetched again from `https://dev-api.signapse.cloud/v3/api-docs` at **2026-11-26 09:42:31 UTC**. Its `x-build-revision` remained `b6de21490d5572bdb51624372ef860230af5df86`, matching Deploy run `45763078705`; the fetched GET/PUT operations and nullable readback schemas still match the consumer behavior documented above. `/health` returned HTTP 200 at 09:43:47 UTC. The contract confirms that a new route defaults to enabled when `enabled` is omitted, which is why FE explicitly sends `enabled: false` on first assignment.

## Current review follow-up

The existing PR branch was rebased onto latest `origin/dev` `83f6658e8f41805a1e3e90d6bc64972f3a994a42`, descended from the pinned base `755d06d38f7496662d5647243933feb9f1c29725`. Runtime code candidate before this evidence-only update: `311ffce00c0d5175ee98b1253a9c8e0c542deffd`. This rebase brought in SIGN-677's destination-link dialog and shared API changes; it did not change the Economic route component or its responsive layout.

- Destination comboboxes now have a localized accessible name composed from the visible column label and route name. Component assertions cover Vietnamese and English; browser selectors use the same name.
- `TelegramFeatureSettingResponseSchema` represents the published wire contract, including its optional top-level fields. `TelegramFeatureSettingReadbackSchema` requires `id`, `featureKey`, `workspaceId` and `enabled` before the UI can use a saved row. GET readbacks with missing fields produce the localized route-load error. PUT readbacks with missing fields produce the localized update error before cache revalidation or success feedback.
- The compact 1024×768 render was compared with approved SIGN-32 attachment **10312**, `telegram-settings-compact-20261123-v2.png`; Mobile 390×844 was compared with attachment **10309**. The accessible-name and response-validation changes are nonvisual. Screenshots below were captured from the workspace after those changes, before the latest `origin/dev` rebase; the merged changes affect the separate destination setup dialog, not the Economic route view.

Current render captures use Chromium `chromium-vi`, dark theme, Vietnamese locale and browser zoom 100%:

- Wide, **1520×1024**, expanded sidebar: [current candidate render](economic-calendar-wide-dark-vi-1520x1024.png).
- Compact, **1024×768**, collapsed sidebar: [current candidate render](economic-calendar-compact-dark-vi-1024x768.png). Destination, language and Off switch fit in the first viewport without page-level horizontal overflow.
- Mobile, **390×844**, navigation closed: [current candidate render](economic-calendar-mobile-dark-vi-390x844.png).
- Off with a destination assigned, **390×844**, navigation closed: [current candidate render](economic-calendar-off-assigned-mobile-dark-vi-390x844.png).
- Compact loading, **1024×768**: [current candidate render](economic-calendar-loading-compact-dark-vi-1024x768.png).
- Mobile loading, **390×844**: [current candidate render](economic-calendar-loading-mobile-dark-vi-390x844.png).

The selected browser run before the latest rebase was `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram-economic-calendar-routing.spec.ts --project=chromium-vi` — **5 passed**. It covers first assignment/readback, loading layouts, scoped list access, reflow and keyboard focus after clear. Its responsive cases also check 1520, 1024, 767, 768, 1439, 1440, 390, 360 and 760 CSS pixels; 760 models the effective width of a 1520px frame at 200%, while native browser zoom stayed at 100%. A rerun on the rebased candidate was attempted repeatedly through the approved wrapper and returned `resource_busy: host browser slot occupied; retry_after_seconds=30`; the lease owner still had live Chromium processes. The wrapper was not bypassed. The merged SIGN-677 change is isolated to the destination setup dialog, outside the tested Economic route view.

The current accessibility smoke was `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/accessibility.spec.ts --project=chromium-vi --grep 'Telegram state'` — **1 passed**, with no serious or critical axe violations. This is not a full contrast or screen-reader audit.

Focused local checks on the rebased candidate: `pnpm exec vitest run tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx tests/api/permissions-server.test.ts tests/core/telegram-permissions.test.ts --reporter=dot` — **4 files, 65 passed**; `pnpm typecheck`, targeted ESLint, Prettier, `pnpm test:contract` (90 operations) and `git diff --check` passed. The current OpenAPI fetch at **2026-11-26 11:40:29 UTC** returned `x-build-revision` `b6de21490d5572bdb51624372ef860230af5df86`; its required response fields remain only `destination` and `outputLanguage`.

Light theme, native 200% browser zoom and a physical screen-reader session were not captured in this follow-up. No live feature request or Telegram delivery test was made. QA owns live dev behavior; the coordinator owns parent acceptance.

## Partial 200 readback follow-up — 2026-11-27

Code candidate: [`65699a9a556c5b3ecabbcc04e220827573855e43`](https://github.com/signapse-group/signapse-ui/commit/65699a9a556c5b3ecabbcc04e220827573855e43), on the existing SIGN-688 branch and PR #163.

- A successful PUT first invalidates the Telegram route data. FE accepts a complete response only when its route and workspace match the request. Otherwise, FE reads back only that route in that workspace and confirms the save only from a complete matching readback.
- If that readback is missing or incomplete, the row shows the localized unverified status, hides its saved controls, moves keyboard focus to the status and offers Retry. It does not show a success toast or keep the previous route values as authoritative.
- The shared Market news action follows the same filtered-readback path. The action regression covers partial 200 responses for both route keys. The component regression covers destination-list failure with a saved destination: the saved value remains visible, the unloaded list does not become a selector choice, and Retry and Clear remain usable.

The current producer contract was fetched from `https://dev-api.signapse.cloud/v3/api-docs` at **2026-11-27 10:32:48 UTC**; the response `Date` header matched and `x-build-revision` was `60bc9ad3a61b889daba27deaf3ac7961cfa68a6b`. [Deploy run 45979542814](https://github.com/dgminhtam/signapse/actions/runs/45979542814) completed successfully for that exact revision. `/health` and `/health/readiness` returned HTTP 200. `TelegramFeatureSettingResponse` requires nullable `destination` and `outputLanguage`; all top-level display fields and all `LanguageResponse` properties, including `isoCode`, remain optional. The route-specific ownership and permission descriptions are present on the GET and PUT operations.

Verification on the code candidate:

- `pnpm exec vitest run tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx --reporter=dot` — **2 files, 92 passed**.
- `pnpm test:quality` — **passed**: lint (23 existing warnings outside changed files), typecheck, **103 files / 925 tests**, contract fixture consistency (**89 operations**) and deployment verifier (**5 passed**).
- Standalone `pnpm test:contract` — **passed**, fixture consistency for **89 operations**.
- Prettier check on the five changed TS/TSX files and `git diff --check` — passed.

The approved SIGN-32 v2 PNGs **10308**, **10312** and **10309** were downloaded and inspected in this follow-up. Existing tracked captures above remain from earlier revisions and are historical for the current PR head. No current browser render was captured for the new unverified/readback and destination-list-error states. QA owns browser-dependent observations on the delivered dev revision: compare the loaded row and both error states at **1520×1024** (expanded sidebar), **1024×768** (collapsed sidebar) and **390×844** (navigation closed), in applicable light/dark themes; check keyboard focus, page overflow, responsive breakpoints and native **200%** zoom. No live feature API request or Telegram delivery test was made.

## Settings-read error regression follow-up — 2026-11-27

Implementation candidate: [`c765ed68f602b60efa3416b25bf23bda7e2da1db`](https://github.com/signapse-group/signapse-ui/commit/c765ed68f602b60efa3416b25bf23bda7e2da1db), on PR [#163](https://github.com/signapse-group/signapse-ui/pull/163), targeting `dev` from base `c01c3dc24baebba11b070d2bfd569ff4c4d5ab27`.

- A failed Market news settings GET was converted to an empty list by the page loader, while `featureSettingsLoadError` was not applied to the route row. That made the unavailable state look Off and left destination controls available. The row now uses its existing localized load-error/retry state and exposes no switch, destination selector or language control until a successful refresh. Healthy Market news behavior and Economic calendar settings are unchanged.
- The new component regression reproduced the fake Off row before the fix. On the fixed candidate, the error and Retry render, the row exposes no write controls or empty/Off configuration, Retry calls `router.refresh()`, and no update action is called.

Verification on the candidate:

- `pnpm test:quality` — passed: lint (23 existing warnings in unrelated files), typecheck, **103 test files / 926 tests**, fixture consistency (**89 operations**) and deployment verifier (**5 passed**).
- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx --reporter=dot` — **1 file / 52 tests passed** after the final assertions.
- Prettier check for the changed TSX files and `git diff --check` — passed.
- The targeted regression failed before the route error was propagated, as expected.

The live OpenAPI at `https://dev-api.signapse.cloud/v3/api-docs` was fetched **2026-11-27 11:17:04 UTC**; `x-build-revision` was `60bc9ad3a61b889daba27deaf3ac7961cfa68a6b`, matching [Deploy run 45979542814](https://github.com/dgminhtam/signapse/actions/runs/45979542814). `GET /telegram/feature-settings` documents route-specific read permissions and owner-workspace filtering. `PUT /telegram/feature-settings` documents route-specific update permissions, optional-field preservation, atomic clear, inactive-route disable, destination eligibility and failures. `TelegramFeatureSettingResponse` requires only nullable `destination` and `outputLanguage`; display fields and `LanguageResponse` fields remain optional.

For visual comparison, the approved [SIGN-32 v2](https://signapse-group.atlassian.net/browse/SIGN-32) references were confirmed: **10308** wide, **10312** compact and **10309** mobile. The matching `signapse-ui` Preview for `c765ed68` reached Ready ([deployment](https://vercel.com/signapse/signapse-ui/87uJnwaGR4CTz4qo6mYCCfvUDipt), [preview URL](https://signapse-ui-git-codex-sign-688-telegram-economi-54f3b4-signapse.vercel.app)). A request to `/en/telegram` returned **HTTP 302** to Vercel SSO, so no current-candidate render could be captured. The tracked screenshots above are historical and are not claimed for this candidate. After dev delivery, QA should compare the Economic calendar row with the approved references at **1520×1024** (expanded sidebar), **1024×768** (collapsed sidebar) and **390×844** (navigation closed), and check loading, Off with/without destination, error/readback, keyboard focus, overflow and native **200%** zoom. Light-theme and current-candidate render evidence remain unverified. No live feature API or Telegram delivery test was made. The authorized local Pen Desktop MCP is unavailable on this server; no Pen operation was attempted.

GitHub `Verify / check` [run 45989891296](https://github.com/signapse-group/signapse-ui/actions/runs/45989891296/job/140474746661) and the `Vercel – signapse-ui` Preview passed for candidate `c765ed68f602b60efa3416b25bf23bda7e2da1db`.
