# SIGN-686 Scheduled analysis evidence

The implementation branch is synchronized with `origin/dev` at [`68c09b7c`](https://github.com/signapse-group/signapse-ui/commit/68c09b7c5d921f19322ca6786564ec3cf70b36ab); the change is tracked in [PR #164](https://github.com/signapse-group/signapse-ui/pull/164) and includes merge commit [`545aee31`](https://github.com/signapse-group/signapse-ui/commit/545aee31). The screenshots and browser outcomes below are preserved from earlier schedule candidates. They remain visual evidence for list/dialog geometry, ACTIVE and DISABLED states, the missing-destination state, and keyboard flows. They do not verify the current head's create-only panel visibility, action permissions, or live API readback.

## Design and API basis

Compared the candidate with the live approved references:

- [SIGN-32] list: attachment 10308 `telegram-settings-wide-20261123-v2.png`, 10312 `telegram-settings-compact-20261123-v2.png`, and 10309 `telegram-settings-mobile-20261123-v2.png`.
- [SIGN-657] schedule dialogs: attachment 10315 `telegram-schedule-create-full-20261123-v2.png`, 10318 `telegram-schedule-edit-desktop-20261123-v2.png`, and 10317 `telegram-schedule-create-mobile-20261123-v2.png`.

The list keeps Feature routing and Scheduled analysis together on the left at Wide/Compact, with bot and destination infrastructure on the right. Mobile order is Feature routing, Scheduled analysis, Bot connections, then Destinations. ACTIVE rows have Edit/Remove, DISABLED rows show Inactive and Remove only, and a missing destination is explicit. Create/Edit keep the labelled required Destination field and fixed footer; Edit uses the approved ghost Cancel action. The live attachments were downloaded from Jira and checked against later candidate renders; follow-up sections record current render captures and comparison results.

Fetched the current [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) on 2026-11-27 at 08:11 UTC and rechecked it at 09:36 UTC; both returned HTTP 200, OpenAPI 3.1.0, version `v0`, and no `x-build-revision` header. It publishes GET/POST `/telegram/market-analysis-schedules` and PUT/DELETE `/telegram/market-analysis-schedules/{id}` with separate read/create/update/delete permissions. Create/update require `destinationId`; `outputLanguageIsoCode` can be omitted/null. Read responses include required `workspaceName`, `asset`, and status, with nullable `destination` and `outputLanguage`; GET omits REMOVED. DELETE accepts ACTIVE/DISABLED and succeeds with an empty 200 response. SIGN-684 comment #11791 records dev deploy run 45763078705 and producer revision `b6de21490d5572bdb51624372ef860230af5df86`.

The same live OpenAPI check confirmed workspace watchlist assets support paging with a maximum size of 2000. Scheduled analysis now loads all pages using the response's `totalPages` and avoids the unsupported `assetSymbol` sort; the action test asserts an asset from page 1 is included.

## Render captures

The captures use the P0 fixture in Vietnamese: one ACTIVE schedule, one DISABLED schedule without a destination, and one REMOVED schedule. The REMOVED row is absent. These list and dialog captures were refreshed from the focused browser run on 2026-11-26 for candidate `8e5304a` and visually reviewed. They remain prior-candidate history; no refreshed browser render was produced after syncing to current `origin/dev`.

| State                                                    | Viewport / theme / shell           | Capture                                                                                  |
| -------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Full page, Wide                                          | 1520×1024, dark, expanded sidebar  | [Wide dark](scheduled-analysis-wide-dark-vi-1520x1024.png)                               |
| Full page, Wide                                          | 1520×1024, light, expanded sidebar | [Wide light](scheduled-analysis-wide-light-vi-1520x1024.png)                             |
| Full page, Compact                                       | 1024×768, dark, collapsed default  | [Compact](scheduled-analysis-compact-dark-vi-1024x768.png)                               |
| Full page, Mobile                                        | 390×844, dark, sidebar closed      | [Mobile](scheduled-analysis-mobile-dark-vi-390x844.png)                                  |
| Full page, Mobile                                        | 360×800, dark, sidebar closed      | [360px Mobile](scheduled-analysis-mobile-dark-vi-360x800.png)                            |
| Full page, effective 200% width                          | 760×512 CSS, dark, sidebar closed  | [Effective width](scheduled-analysis-effective-760x512-200pct-dark-vi.png)               |
| Create dialog                                            | 1520×1024, dark                    | [Create Wide](schedule-create-wide-dark-vi-1520x1024.png)                                |
| Create dialog                                            | 1520×1024, light                   | [Create Wide light](schedule-create-wide-light-vi-1520x1024.png)                         |
| Create dialog                                            | 360×800, dark                      | [Create 360px](schedule-create-mobile-360x800-dark-vi.png)                               |
| Create dialog                                            | 760×512 CSS effective width, dark  | [Create effective 200%](schedule-create-effective-760x512-200pct-dark-vi.png)            |
| Create dialog, scrolled to output language               | 390×844, dark                      | [Create mobile, scrolled](schedule-create-mobile-bottom-dark-vi-390x844.png)             |
| Edit dialog with focused unsaved draft                   | 1520×1024, dark                    | [Edit Wide](schedule-edit-wide-dark-vi-1520x1024.png)                                    |
| Edit dialog with focused unsaved draft                   | 1520×1024, light                   | [Edit Wide light](schedule-edit-wide-light-vi-1520x1024.png)                             |
| Edit dialog with focused unsaved draft                   | 360×800, dark                      | [Edit 360px](schedule-edit-mobile-360x800-dark-vi.png)                                   |
| Edit dialog with focused unsaved draft                   | 760×512 CSS effective width, dark  | [Edit effective 200%](schedule-edit-effective-760x512-200pct-dark-vi.png)                |
| Remove confirmation before cancel                        | 1520×1024, dark                    | [Remove confirmation](schedule-remove-confirmation-dark-vi.png)                          |
| Successful Remove after list readback and keyboard focus | 1520×1024, dark, expanded sidebar  | [Remove success and focus](schedule-remove-success-focus-wide-dark-vi.png)               |
| Remove Cancel after Wide-to-Mobile reflow                | 360×800, dark, sidebar closed      | [Mobile focus after Cancel](schedule-remove-reflow-cancel-mobile-360-dark-vi.png)        |
| Remove confirmation open at effective 200% width         | 760×512 CSS, dark, dialog crop     | [Dialog at effective width](schedule-remove-dialog-effective-760x512-200pct-dark-vi.png) |
| Remove Escape after Mobile-to-Wide reflow                | 1520×1024, dark, expanded sidebar  | [Wide focus after Escape](schedule-remove-reflow-escape-wide-1520x1024-dark-vi.png)      |

The P0 case resized while Create/Edit stayed open. At 360px and 760px CSS width, the draft, focus, and selected `Asia/Ho_Chi_Minh` timezone remained; the footer actions stayed visible and there was no page-level horizontal overflow. The 760×512 viewport is the effective-width proxy for 200% from 1520×1024, not browser-chrome zoom. Create and Edit open from keyboard; focus remains in each dialog; Tab/Shift+Tab order and wrapping from Save to Close are checked. Escape closes each dialog and returns focus to its trigger. After Edit is resized and discarded through its confirmation, focus returns to the visible responsive Edit trigger. Each schedule dialog exposes one close button. On the error path, a 503 from Feature routing rendered its local error while Scheduled analysis and the ACTIVE row remained available at 1520×1024 with the sidebar expanded. Successful schedule Remove is opened and confirmed by keyboard; after DELETE and the fresh schedule-list read, the removed row is absent and visible focus lands on the persistent Scheduled analysis heading. Cancel restores focus to the row trigger, and a failed delete keeps the confirmation available for retry. The new Wide capture shows the readback state with that heading focused.

Light/dark visual review found the text, control boundaries, required Destination marker, and focused name field readable in both themes. This is a visual review; numeric color contrast was not measured.

The focused responsive Remove check opened the confirmation at 1520×1024, resized to 360×800, and keyboard-activated Cancel. Focus returned to the visible mobile trigger with a visible focus ring; no DELETE request was sent and the ACTIVE record remained unchanged. It then opened from Mobile, kept the dialog open at 760×512 CSS effective width, confirmed focus stayed in the dialog with no page-level horizontal overflow, resized to 1520×1024, and pressed Escape. Focus returned to the visible desktop trigger. The Mobile and Wide captures show the complete keyboard tooltip; the 760×512 capture is a dialog crop. The 760px width is the effective-width proxy for 200% from 1520×1024, not browser-chrome zoom.

## Local checks and handoff

- `pnpm test:quality` — passed: lint, typecheck, 920 tests across 104 files, fixture consistency for 88 operations, and all 5 deployment guard tests. ESLint reported 23 existing warnings outside the Telegram schedule changes.
- `pnpm test:contract` — passed independently; fixture consistency covers 88 operations.
- `tests/api/watchlists-action.test.ts` — passed; verifies results from later watchlist pages are included.
- Scoped Prettier check for the Telegram UI, API action, permission/types/locales, component and API tests, fixture server, and evidence README — passed.
- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx --reporter=dot` — 47 passed after the responsive duplicate-control and focus assertions were aligned with the two layouts and success heading.
- `git diff --cached --check` and `git diff --check` — passed on the final staged candidate.
- A focused current-head render attempt did not reach the app: the local browser runner timed out waiting for app readiness after 120 seconds, then reported its host browser slot occupied. No current-head screenshot or numeric contrast measurement was produced. The Vercel Preview remains protected by SSO in this environment.
- For prior merge candidate [`c42a44b3`](https://github.com/signapse-group/signapse-ui/commit/c42a44b38de4e38d231c2502ab1e8b0a88812214), [Verify run 45968901271](https://github.com/signapse-group/signapse-ui/actions/runs/45968901271), [signapse-ui Preview](https://vercel.com/signapse/signapse-ui/J3m7wPFLXARYWWGJUbtR7Cxc8W5p), and [signapse-prod Preview](https://vercel.com/signapse/signapse-prod/4WFSYGrj3WUcmnRD3DuaaJbqDm1q) passed. The full browser suite is outside this handoff.

The prior-candidate browser checks above remain useful for shared form/list geometry and keyboard behavior, but QA should verify the synchronized Preview for independent schedule permissions, create-only navigation, Feature routing read failure isolation, readback after Create/Edit, denied-update draft preservation, Remove cancel/retry and fresh list read, ACTIVE/DISABLED/REMOVED fixture handling, 767/768 reflow, and input/destination boundary contrast in light and dark themes. Local fixtures do not prove live-user authorization or schedule persistence; QA owns live feature acceptance.

[SIGN-32]: https://signapse-group.atlassian.net/browse/SIGN-32
[SIGN-657]: https://signapse-group.atlassian.net/browse/SIGN-657

## Follow-up candidate `6f8d6df4`

This candidate addresses the latest review feedback on PR #164. Readiness Summary now omits only the metric whose source read failed; a failed schedule, bot, destination, or Feature routing request no longer appears as a zero count. Component coverage checks each partial-read failure and confirms unaffected metrics remain visible. The API action test runs POST → fresh list GET and PUT → fresh list GET, confirming saved fields and the same ACTIVE schedule ID after Edit. This is mocked local API evidence; it does not establish live persistence.

The current [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) was fetched at 2026-11-27 10:43:41 UTC: HTTP 200, OpenAPI 3.1.0, version `v0`, and no `x-build-revision` response header. It still publishes separate schedule read/create/update/delete permissions, create/update request requirements, nullable read destination/language, ACTIVE-only update, ACTIVE/DISABLED Remove with preserved history, and caller-owned ACTIVE/DISABLED GET results without REMOVED rows. SIGN-684 comment #11791 records deployed producer revision `b6de21490d5572bdb51624372ef860230af5df86` and its dev deploy.

Focused local checks on the follow-up source candidate:

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts --reporter=dot` — 88 tests passed across 2 files.
- `pnpm typecheck` — passed.
- Scoped ESLint and Prettier checks for the changed component and tests — passed.
- `git diff --check` — passed.

The approved references were rechecked against the live SIGN-657 attachments 10315/10318/10317 and SIGN-32 attachments 10308/10312/10309. The current candidate has no new rendered capture: the current Preview is SSO-protected here, and the repository's FE browser runner is not usable for this candidate (`run-fe-browser` invokes the removed `pnpm test:browser` script; `tests/e2e` is absent). Existing captures from `8e5304a` remain historical and are not presented as current-head evidence. The approved local Pen Desktop MCP is unavailable on this server; no Pen operation was run.

The current shared control tokens yield a static, token-derived contrast calculation: `--input-border: oklch(0.65 0 0)` against white is 3.23:1; against the dark dialog surface with the 4.5% input overlay it is 4.95:1. These are CSS-token calculations, not measurements from the current rendered candidate. QA owns the current rendered check on the delivered Preview: at 767/768 CSS px verify list reflow, row action visibility/focus, and page overflow; in Create/Edit Light and Dark, measure Name and Destination boundaries. Also verify true 360px and browser 200% behavior per the Responsive Contract.

## Follow-up review correction (2026-11-27)

PR review on candidate `1e99da22` found that an ACTIVE schedule with `telegram-market-analysis-schedule:update` could not be saved when the user lacked `watchlist:read` or the watchlist request failed. Application change [`8200a0be`](https://github.com/signapse-group/signapse-ui/commit/8200a0be) disables only the asset selector when its catalog is unavailable and keeps the saved asset selected in the update request; the other editable schedule fields remain available. The schedule update permission stays independent of watchlist read access.

The route-level regression runs with both absent watchlist permission and a failed watchlist read. It opens Edit, confirms the asset selector is disabled, changes the schedule name, and verifies PUT still includes the same saved `assetId`. The focused Telegram configuration and schedule form suites pass: 60 tests. `pnpm typecheck`, scoped ESLint, scoped Prettier, and `git diff --check` also pass.

Fetched [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at 2026-11-27 11:28:15 UTC: HTTP 200, OpenAPI 3.1.0, `info.version` `v0`, and root `x-build-revision` `60bc9ad3a61b889daba27deaf3ac7961cfa68a6b`. The schedule GET/POST/PUT/DELETE operations still use separate read/create/update/delete permissions; PUT requires `assetId`, `destinationId`, workspace, name, timezone and local times, and preserves the ACTIVE schedule identity. Readback permits a null destination for a legacy DISABLED schedule, and GET omits REMOVED records.

For this correction, re-downloaded and inspected the active SIGN-657 edit reference (attachment 10318) and shared SIGN-32 list references (10308, 10312, 10309). The code preserves the approved Edit layout and saved configuration while making an unreadable asset catalog non-editable. No current-head browser capture was produced for this unavailable-catalog state: Preview access is SSO-protected here and the FE browser wrapper targets the removed `pnpm test:browser` script. QA should verify update-only access with and without `watchlist:read`, including that the saved asset remains visible and unchanged in PUT; browser-based viewport, focus and overflow checks remain assigned to SIGN-687.

## Current review correction — application candidate `701ff614`

This section records the current-head render and contract correction after the previous screenshots. The approved live references were compared again: SIGN-657 attachments 10315/10318/10317 and SIGN-32 attachments 10308/10312/10309.

The dev OpenAPI was fetched at 2026-11-27 12:10:23 UTC from `https://dev-api.signapse.cloud/v3/api-docs`: HTTP 200, OpenAPI 3.1.0, version `v0`, root `x-build-revision` `60bc9ad3a61b889daba27deaf3ac7961cfa68a6b`. `ScheduledAssetResponse` marks `assetId`, `assetName`, and `assetSymbol` as required. `app/lib/telegram/definitions.ts` now matches those required fields. The GET/POST/PUT/DELETE schedule operations still publish separate read/create/update/delete permissions, nullable read destination/language, and no REMOVED rows in GET.

Current UI renders were captured from application candidate [`701ff614`](https://github.com/signapse-group/signapse-ui/commit/701ff614) using local P0 fixtures, Vietnamese, and 100% browser zoom. They were visually compared with the active Jira PNGs. The screenshots show one ACTIVE schedule and one DISABLED schedule without a destination; the REMOVED omission remains covered by the existing component test.

| State                                    | Browser viewport / theme / sidebar                                                            | Observation and capture                                                                                                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scheduled analysis at 767px              | 767×1024 CSS px, dark, Mobile sidebar closed                                                  | Card reflow; Edit and Remove visible; keyboard focus ring visible; document/body width is 767px. [Capture](schedule-list-767-dark-vi-20261127.png)                                                                               |
| Scheduled analysis at 768px              | 768×1024 CSS px, dark, Compact sidebar collapsed                                              | Table reflow; Edit and Remove visible; keyboard focus ring visible; document/body width is 768px. [Capture](schedule-list-768-dark-vi-20261127.png)                                                                              |
| Create form, Light and Dark              | 1520×1024 CSS px, Wide sidebar expanded                                                       | [Light](schedule-create-wide-light-vi-1520x1024-20261127.png) · [Dark](schedule-create-wide-dark-vi-1520x1024-20261127.png)                                                                                                      |
| Edit form, Light and Dark                | 1520×1024 CSS px, Wide sidebar expanded                                                       | [Light](schedule-edit-wide-light-vi-1520x1024-20261127.png) · [Dark](schedule-edit-wide-dark-vi-1520x1024-20261127.png)                                                                                                          |
| Update-only access, unavailable catalogs | 1520×1024 CSS px, dark, Wide sidebar expanded; schedule read/update and destination read only | Scheduled analysis remains visible while Feature routing shows its permission error; no `watchlist:read`; only Edit is offered. [Page](schedule-list-update-only-no-feature-routing-no-watchlist-dark-vi-1520x1024-20261127.png) |
| Update-only Edit                         | 1520×1024 CSS px, dark, dialog crop                                                           | Saved `BTC/USDT — Bitcoin` remains selected in the disabled asset control; other fields and Save remain available. [Dialog](schedule-edit-update-only-no-watchlist-dark-vi-1520x1024-20261127.png)                               |

The focused local render check used the P0 fixture server and passed 5/5 cases: the two breakpoint layouts, Create/Edit field boundaries in both themes, and update-only Edit without `watchlist:read`. The measured Name and Destination boundary contrast was 3.23:1 in Light and 4.95:1 against the rendered field / 5.54:1 against the dialog surface in Dark. `pnpm typecheck`, the focused Telegram configuration/form and API action suites (97 tests), and `pnpm test:contract` (88 operations) also passed on the application candidate.

These renders are local fixture evidence, not live-user authorization or persistence evidence. Native browser zoom at 200% and the 360px viewport remain assigned to SIGN-687 under the Responsive Contract.

## Final review correction — application candidate `ff08cafd`

This pass fixes the two current UI findings and refreshes the Remove confirmation evidence. Create now opens with Destination empty and the existing required-field validation prevents POST until a user chooses an active destination. Edit continues to initialize from the saved destination. DISABLED schedules use the localized schedule label “Inactive” / “Không hoạt động”; bot and destination badges retain their existing status labels. The Remove confirmation states that the record becomes REMOVED, future runs stop, and recorded history is preserved.

Compared the rendered candidate with live approved Jira references: SIGN-657 attachments 10315 (`telegram-schedule-create-full-20261123-v2.png`), 10318 (`telegram-schedule-edit-desktop-20261123-v2.png`) and 10317 (`telegram-schedule-create-mobile-20261123-v2.png`); SIGN-32 attachments 10308 (`telegram-settings-wide-20261123-v2.png`), 10312 (`telegram-settings-compact-20261123-v2.png`) and 10309 (`telegram-settings-mobile-20261123-v2.png`). The current dev OpenAPI was fetched at 2026-11-27 13:46 UTC: HTTP 200, OpenAPI 3.1.0, build revision `60bc9ad3a61b889daba27deaf3ac7961cfa68a6b`. It publishes GET/POST/PUT/DELETE for schedules, requires `destinationId` for writes, and declares `destination` and `outputLanguage` nullable on read. `ScheduledAssetResponse` requires `assetId`, `assetName` and `assetSymbol`; the consumer definition matches.

The focused Playwright run used local P0 fixtures, Vietnamese, 100% browser zoom and application candidate `ff08cafd`:

| State                       | Viewport / theme / sidebar                              | Observation and capture                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scheduled analysis at 767px | 767×1024 CSS px, dark, Mobile sidebar closed            | ACTIVE and DISABLED/no-destination records are distinct; the inactive label and Remove action are visible, REMOVED is absent, row actions retain keyboard focus, and document/body width stays at 767px. [Capture](schedule-list-767-dark-vi-20261127-review.png) |
| Scheduled analysis at 768px | 768×1024 CSS px, dark, Compact sidebar collapsed        | Table reflow preserves the same schedule state and row actions with no page overflow. [Capture](schedule-list-768-dark-vi-20261127-review.png)                                                                                                                    |
| Create initial state        | 1520×1024 CSS px, Light and Dark, Wide sidebar expanded | Destination matches the approved empty placeholder in both themes. [Light](schedule-create-wide-light-vi-1520x1024-20261127-review.png) · [Dark](schedule-create-wide-dark-vi-1520x1024-20261127-review.png)                                                      |
| Create validation           | 1520×1024 CSS px, Light, Wide sidebar expanded          | Submitting with no selection announces the required Destination error and sends no POST. [Capture](schedule-create-validation-light-vi-20261127-review.png)                                                                                                       |
| Remove confirmation         | 1520×1024 CSS px, dark, Wide sidebar expanded           | The current destructive confirmation shows its full history-preserving explanation and both Cancel/Remove actions. [Capture](schedule-remove-confirmation-dark-vi-1520x1024-20261127-review.png)                                                                  |

Checks on this correction:

- `pnpm exec vitest run tests/components/telegram-schedule-form.component.test.tsx tests/components/telegram-configuration.component.test.tsx --reporter=dot` — 61 tests passed across 2 files. The new Create placeholder/validation and inactive-status regressions failed before the implementation change.
- `pnpm typecheck` — passed. The first attempt found a malformed, ignored `.next/dev/types/validator.ts`; removing that generated file and regenerating route types cleared the stale artifact.
- `pnpm test:contract` — passed; fixture consistency covers 88 operations.
- `pnpm exec playwright test --config=.scratch/SIGN-686/final-review-88fd514/playwright.config.ts .scratch/SIGN-686/final-review-88fd514/final-review.spec.ts` — 5 passed: 767/768 layout and status, Create placeholder/validation in Light and Dark, and current Remove confirmation.
- Scoped ESLint, Prettier and `git diff --check` — passed.

These local fixture renders do not prove live authorization or persistence. QA retains live feature acceptance and native browser checks at 360px and 200% zoom under the Responsive Contract.

## Review follow-up — application candidate `0c515d57`

Review of PR #164 at `c6a9653f` found that Edit said the saved asset belonged to another workspace when the actual reason was an unreadable watchlist. The form now selects localized copy by cause: an unavailable watchlist, an unavailable current workspace, or a schedule in another workspace. The no-permission and failed-watchlist cases both state that the saved asset will stay unchanged.

Compared the updated Edit dialog with the live approved SIGN-657 attachment 10318, `telegram-schedule-edit-desktop-20261123-v2.png`. The dialog retains its scrollable form body and fixed footer; the saved asset remains selected and disabled while the other fields and Save remain available. The new capture is [schedule-edit-update-only-no-watchlist-dark-vi-1520x1024-review-followup-20261127.png](schedule-edit-update-only-no-watchlist-dark-vi-1520x1024-review-followup-20261127.png). It was rendered from application candidate [`0c515d57`](https://github.com/signapse-group/signapse-ui/commit/0c515d57) using local P0 fixtures in Vietnamese, dark theme, default 100% browser zoom, a 1520×1024 CSS px Wide viewport with the sidebar expanded, and schedule read/update plus destination read permissions but no `watchlist:read` or Feature routing permission. The image is a dialog crop.

Fetched the current [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at 2026-11-27 14:26:32 UTC: HTTP 200, OpenAPI 3.1.0, version `v0`, build revision `60bc9ad3a61b889daba27deaf3ac7961cfa68a6b`. The schedule contract is unchanged: separate read/create/update/delete permissions, nullable read destination/language, ACTIVE-only update, and ACTIVE/DISABLED Remove with preserved history.

Checks on this correction: the focused Telegram configuration and schedule form suites passed (61 tests); `pnpm typecheck`, scoped ESLint, scoped Prettier, and `git diff --check` passed. The focused Playwright render for update-only Edit without `watchlist:read` passed (1/1) and the screenshot shows the corrected reason. These fixture checks do not prove live authorization or persistence. SIGN-687 retains live feature acceptance, true 360px and browser 200% checks, and responsive, keyboard/focus, permission, readback, and error recovery verification. Jira Development-panel linkage remains coordinator-owned.

## Contrast follow-up — disabled saved Asset

The review of PR #164 at `d4b79932` found that the persistent disabled Asset control in Edit lost border contrast through the shared `disabled:opacity-50` style when `watchlist:read` was unavailable. That state now keeps the shared border at full opacity and uses muted text to preserve the disabled cue. The override applies only when the saved asset must remain unchanged; transient submit disabling keeps the shared style. The existing update path continues to send the saved `assetId`.

Reference: approved SIGN-657 attachment 10318, `telegram-schedule-edit-desktop-20261123-v2.png`. The reference is still the live attachment on the unchanged parent. The affected state is Edit with `telegram-market-analysis-schedule:update`, no `watchlist:read`, and the saved asset retained and disabled.

The latest dev OpenAPI fetch returned HTTP 200 at 2026-11-27 15:14:59 UTC, OpenAPI 3.1.0 / `v0`, root `x-build-revision` `629ce105addd625a2bff8142c012ba681d3298e0`. The four schedule operations still require separate read/create/update/delete permissions; GET includes ACTIVE/DISABLED and omits REMOVED, and Edit remains ACTIVE-only.

The disabled Asset boundary is **3.23:1 in Light** against the white dialog surface and **4.95:1 in Dark** against the field surface with the existing 4.5% input overlay. These values are CSS-token calculations using `--input-border: oklch(0.65 0 0)`, not pixel samples from a current-head render. A fresh render could not be produced here: the Preview requires SSO and the repository browser wrapper invokes the removed `pnpm test:browser` script (`tests/e2e` is absent). The existing update-only Edit screenshot predates this border correction and is retained as a state reference, not current contrast evidence.

QA / SIGN-687 should verify the delivered Preview at 1520×1024 CSS px, 100% zoom, Wide sidebar expanded, in both Light and Dark. In the update-only/no-watchlist Edit state, confirm the saved Asset remains selected, visibly disabled, and its boundary measures at least 3:1. True 360px and native 200% checks remain with QA under the Responsive Contract.

## Review follow-up — desktop schedule read-error announcement

GitHub review of PR #164 at `eef9f429` found that the desktop Scheduled analysis read-error heading was not announced by assistive technology, although the mobile counterpart already used `role="alert"`. The desktop heading now uses the same alert semantics while retaining its enabled keyboard-operable Retry button. This does not change the visual layout or rendered content, so no screenshot was regenerated for this change.

Added a focused component regression that scopes to the desktop composition, checks that the localized load error is exposed through the alert role, and confirms Retry stays enabled. The test failed before the fix and passed after it. Following the review, merged current `origin/dev` (`68c09b7c5d921f19322ca6786564ec3cf70b36ab`) into candidate [`545aee31`](https://github.com/signapse-group/signapse-ui/commit/545aee31). This preserves the independently permissioned Scheduled analysis reads and error states alongside the upstream Economic calendar and Market News routing changes.

Verification on the merged candidate: `pnpm test:quality` passed (ESLint had 23 repository warnings and no errors, typecheck passed, all 104 Vitest files / 953 tests passed, and the 88-operation API fixture consistency check passed); an additional `pnpm test:contract` passed. The six focused Telegram configuration/form/API/permission suites passed 134 tests. `git diff --check` passed.

Fetched [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at 2026-11-27 16:05:33 UTC: HTTP 200, OpenAPI 3.1.0 / `v0`, root build revision `629ce105addd625a2bff8142c012ba681d3298e0`. The schedule endpoints still declare distinct `:read`, `:create`, `:update` and `:delete` permissions; GET returns the caller's ACTIVE/DISABLED schedules and omits REMOVED, destination is nullable on read, Update is ACTIVE-only, and Remove accepts ACTIVE or DISABLED.

The earlier fixture captures remain prior-candidate visual evidence. QA / SIGN-687 retains live feature acceptance, native 360px and 200% checks, and a fresh current-head Preview capture for the saved disabled Asset boundary in Light and Dark. This semantic announcement fix does not satisfy or claim those render checks.
