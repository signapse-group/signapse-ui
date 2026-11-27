# SIGN-329 Connect new Telegram bot evidence

## Approved references

The dialog references are attached to [SIGN-31](https://signapse-group.atlassian.net/browse/SIGN-31): attachment 10310 (`telegram-connect-bot-desktop-20261123-v2.png`) and attachment 10311 (`telegram-connect-bot-mobile-20261123-v2.png`). The settings surface references are attached to [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32): attachments 10308 (`telegram-settings-wide-20261123-v2.png`), 10312 (`telegram-settings-compact-20261123-v2.png`), and 10309 (`telegram-settings-mobile-20261123-v2.png`). The responsive rules come from the [Responsive Contract](https://github.com/signapse-group/signapse-planing/blob/main/ui-design/references/DESIGN.md#responsive-contract).

## API contract

Fetched the producer-published [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at `2026-11-23T10:54:15Z`. `info.version` is `v0`; `x-build-revision` is `5003e943810f4027154ef0ccb4343aa1a322777e`, matching the delivered SIGN-328 handoff revision. `POST /telegram/bot-connections` requires `telegram-bot-connection:create`: 201 is a new safe connection (`ACTIVE` after webhook registration or `INVALID` with safe `failureReason`), while 200 is the caller's stored connection and unchanged status. Token verification errors return 400; cross-owner duplicates return generic 409 without owner details. `GET /telegram/bot-connections` requires `telegram-bot-connection:read` and returns caller-owned metadata without bot tokens. The P0 server below is a local fixture and does not establish live integration.

## Candidate renders

Captured from the `codex/SIGN-329-connect-bot` working tree based on `fd9ba256091a259bd968c6f29a5eb169d004a736` (`origin/dev`) by the P0 Playwright fixture run. Wide captures use a 1520×1024 CSS viewport with the sidebar expanded. The compact capture uses 1024×768 with the sidebar collapsed. Mobile captures use 390×844 and 360×780 with the sidebar closed.

- [Create-only page, light, 1520×1024](connect-only-desktop-light-1520x1024.png)
- [Connect dialog, dark, 1520×1024](connect-dialog-desktop-dark-1520x1024.png)
- [Readback, dark, 1024×768 compact](readback-compact-dark-1024x768.png)
- [Readback, dark, 390×844 mobile](readback-mobile-dark-390x844.png)
- [Connect dialog, dark, 360×780 small mobile](connect-dialog-small-mobile-dark-360x780.png)

The fixture verifies create-only access without a list read, keyboard opening/submission and focus restoration, POST/readback of safe metadata, and responsive layout at 1520×1024, 1024×768, effective CSS width 760×512, 390×844, and 360×780. It asserts no token or owner data is exposed in fixture readback and reported no browser console or page errors. The 760×512 case simulates the layout width associated with 200% zoom; it is not native browser zoom and has no separate screenshot.

A red “1 Issue” badge appears in the lower-left of some captures from the local Next.js development overlay. It persisted with zero page/console errors and is not part of the Telegram UI. These are fixture renders only: they do not claim live API, authentication, QA, or dev deployment acceptance.

## Follow-up after PR #158 feedback

Re-fetched the producer-published [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at `2026-11-23T11:29:30Z`. Its `x-build-revision` `23bdeade727a8df776331339c9968bcb10019835` matches the SIGN-336 handoff (PR #217, deploy run `45159828023`). The create/read operation semantics above remain unchanged. `failureReason` is still a safe string without a language guarantee, so the UI now uses the localized webhook-failure message and does not display the raw value in the INVALID row or toast.

Compared the Connect dialog with [SIGN-31 attachment 10310](https://signapse-group.atlassian.net/browse/SIGN-31) (`telegram-connect-bot-desktop-20261123-v2.png`): title, explanatory copy, visible token label, close control, and horizontal footer remain aligned with the accepted desktop pattern. The 360×780 dark mobile capture continues to match attachment 10311's stacked footer. In the fixture browser check, the dark create-only page opened the dialog at 1520×1024, entered a masked token draft, then resized to 760×512 while the dialog stayed open. The draft and input focus remained; the dialog stayed inside the viewport and the page had no horizontal overflow. The viewport was restored before submit. The effective 760×512 CSS width represents the layout width at 200% zoom; native browser zoom was not used.

- [Connect dialog, dark, open at effective 200% width, 760×512](connect-dialog-effective-200-percent-760x512.png)
- `/opt/apps/symphony/runtime/run-fe-browser /opt/apps/symphony/workspaces-fe-jira/SIGN-329 tests/e2e/telegram.spec.ts --grep 'connects with create-only access and reads the saved state only with read access' --retries=0` — **1 passed**. This P0 check uses the local fixture; it does not verify live authentication or feature APIs.
- `pnpm exec vitest run tests/api/auth-action.test.ts tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx tests/core/telegram-permissions.test.ts` — **36 passed**.

The new 760×512 capture also contains the local Next.js development overlay's red “1 Issue” badge noted above. It is outside the Telegram UI; the browser run reported no page or console errors.

## Follow-up after PR #158 feedback #2

Historical capture note: this render set is superseded. Review found the Compact permission labels did not match the screenshots: the read-only capture included Reconnect guidance, and the update-permission capture did not show the INVALID row. The corrected evidence is recorded in the follow-up below.

Rechecked the live dev OpenAPI at `2026-11-23T12:58Z`. Its `x-build-revision` is `23bdeade727a8df776331339c9968bcb10019835`, matching the SIGN-336 producer handoff. The GET and POST operations still publish the required auth/error responses and the contract's caller/read, create, duplicate and ownership rules. The fixture now exercises POST 201 ACTIVE/INVALID, duplicate 200 ACTIVE/INVALID, invalid-token 400, generic conflict 409, and create-denied 403. It verifies that create-only access makes no list request, read access enables safe metadata readback, duplicate results leave stored state unchanged, and the response/UI expose neither token nor owner data.

The Compact layout now places Feature Routing and Scheduled Analysis at left, with Bot Connections and Destinations stacked at right. At 390×844, Feature Routing precedes the infrastructure cards. The INVALID row uses localized webhook-failure copy; Reconnect guidance appears only after granting update permission. Raw fixture failure details remain hidden. The responsive check verifies the guidance stays inside the Compact Bot card, wraps on Mobile, and does not create horizontal page overflow.

- [Compact readback, 1024×768, without update permission](readback-compact-dark-1024x768.png)
- [Mobile readback, 390×844, without update permission](readback-mobile-dark-390x844.png)
- [Compact readback, 1024×768, with update permission](readback-compact-with-reconnect-dark-1024x768.png)
- [Compact INVALID row showing update-only Reconnect guidance](compact-invalid-row-with-reconnect.png)
- [Mobile readback, 390×844, with update permission](readback-mobile-with-reconnect-dark-390x844.png)

Rendered comparison uses the accepted [SIGN-32 Compact attachment 10312](https://signapse-group.atlassian.net/browse/SIGN-32) (`telegram-settings-compact-20261123-v2.png`) and [Mobile attachment 10309](https://signapse-group.atlassian.net/browse/SIGN-32) (`telegram-settings-mobile-20261123-v2.png`). At Compact width, the section grouping and stacked infrastructure cards now match the approved composition; at Mobile width, the groups follow the approved order and the Reconnect guidance wraps within the row.

Verification from the issue workspace:

- `/opt/apps/symphony/runtime/run-fe-browser /opt/apps/symphony/workspaces-fe-jira/SIGN-329 tests/e2e/telegram.spec.ts --grep 'P0 Telegram operations' --retries=0` — **3 passed**.
- `pnpm exec vitest run tests/api/auth-action.test.ts tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx tests/core/telegram-permissions.test.ts` — **36 passed**.
- `pnpm test:contract -- --scope 'GET /telegram/bot-connections,POST /telegram/bot-connections'` — fixture consistency passed for both operations.
- `pnpm typecheck` — pass.
- ESLint on the changed TS/TSX/MJS files — pass.
- Prettier check on the changed TS/TSX/MJS files — pass.
- `git diff --check` — pass.

These remain local-fixture checks. They do not verify live authentication, persistence or Telegram delivery; QA/coordinator own testing on dev and Story acceptance. The captures include the local development overlay's red “1 Issue” badge, which is outside the Telegram UI.

## Follow-up after PR #158 feedback #3

Fetched the producer-published [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at `2026-11-23T13:29:58.563Z`. Its `x-build-revision` remains `23bdeade727a8df776331339c9968bcb10019835`, matching the SIGN-336 handoff (PR #217, deploy run `45159828023`). The GET/POST permission, response-status, duplicate, ownership, and safe-metadata semantics remain unchanged. `failureReason` is a safe string without a locale guarantee, so the UI shows localized webhook-failure and incomplete-setup copy and omits the raw value.

The INVALID row displays the actual saved status, localized webhook-failure copy, and setup-incomplete copy. SIGN-329 does not implement the Reconnect row action; SIGN-338 owns it and is blocked by this Subtask. Until that row action is present, update permission alone does not show Reconnect guidance. Component and P0 browser checks assert the guidance is absent with and without update permission. The two Compact page captures render identically because update permission does not expose an action in this candidate.

Compared the Compact composition with [SIGN-32 attachment 10312](https://signapse-group.atlassian.net/browse/SIGN-32) (`telegram-settings-compact-20261123-v2.png`) and the Mobile order with attachment 10309 (`telegram-settings-mobile-20261123-v2.png`). The current fixture renders include the INVALID row in both permission states; the row crop shows localized status/setup copy with no raw failure detail or premature Reconnect guidance. Full-page captures use the 1024×768 Compact and 390×844 Mobile CSS viewports. The dialog captures show 1520×1024 Wide, 760×512 effective 200% width while open with a token draft, and 360×780 Mobile. The resize check keeps the draft and focus, keeps the dialog inside the viewport, and reports no page-level horizontal overflow. The 760×512 case is an effective-width simulation, not native browser zoom.

- [Compact readback, dark, without update permission](readback-compact-dark-1024x768.png)
- [Compact readback, dark, with update permission before the Reconnect row action](readback-compact-update-permission-before-reconnect-dark-1024x768.png)
- [INVALID row crop before the Reconnect row action](compact-invalid-row-before-reconnect-action.png)
- [Mobile readback, dark, without update permission](readback-mobile-dark-390x844.png)
- [Mobile readback, dark, with update permission before the Reconnect row action](readback-mobile-update-permission-before-reconnect-dark-390x844.png)
- [Mobile INVALID row crop before the Reconnect row action](mobile-invalid-row-before-reconnect-action.png)
- [Current Connect dialog, dark, 1520×1024](connect-dialog-desktop-dark-1520x1024.png)
- [Current Connect dialog, dark, open at effective 200% width, 760×512](connect-dialog-effective-200-percent-760x512.png)
- [Current Connect dialog, dark, 360×780 mobile](connect-dialog-small-mobile-dark-360x780.png)

Verification from the issue workspace:

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx` — **17 passed**.
- `/opt/apps/symphony/runtime/run-fe-browser /opt/apps/symphony/workspaces-fe-jira/SIGN-329 tests/e2e/telegram.spec.ts --grep 'P0 Telegram operations' --retries=0` — **3 passed**. The flow asserts no list request for create-only, safe readback only with read permission, both INVALID readback permission states, keyboard/focus, open-dialog resize, localized feedback, duplicates and rejected requests.

The P0 captures use the local fixture and are not live authentication, persistence, Telegram delivery, or dev QA evidence. The Next.js development overlay badge appears in some full-page captures but is outside the Telegram UI and does not obscure the INVALID row in this set.

## Follow-up after PR #158 feedback #4

Fetched the producer-published [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at `2026-11-23T14:30:40Z`. Its `x-build-revision` remains `23bdeade727a8df776331339c9968bcb10019835`, matching the SIGN-336 handoff (PR #217, deploy run `45159828023`). The current `GET /telegram/bot-connections` still requires `telegram-bot-connection:read` and excludes tokens; `POST /telegram/bot-connections` still requires `telegram-bot-connection:create`, returns 201 for a new connection and 200 for an unchanged caller duplicate, and documents 400 verification errors plus a generic cross-owner 409. `TelegramBotConnectionResponse` remains the contract schema. `failureReason` remains a string without a locale guarantee.

The FE now validates and projects both list and create payloads through this response allowlist before they reach the UI. Unknown token/owner fields are stripped; malformed IDs or statuses fail closed. Action fixtures inject token and owner fields on GET, POST 201 and POST 200 and assert that only safe response properties are returned. A malformed status returns the localized create fallback without revalidation.

Compared the dialog against [SIGN-31 attachment 10310](https://signapse-group.atlassian.net/browse/SIGN-31) (`telegram-connect-bot-desktop-20261123-v2.png`) and attachment 10311 (`telegram-connect-bot-mobile-20261123-v2.png`). The icon close button keeps its visible placement, size and chrome; only its accessible name now comes from the active locale dictionary. The component test confirms both visible and icon close controls have the Vietnamese accessible name and that the icon closes the dialog. The P0 browser check confirms the two names at 360×780; the existing 1520×1024, 760×512-open-dialog, 390×844 and 360×780 renders remain visually valid because the fixes change response projection and the invisible accessible name only.

Verification from the issue workspace:

- `pnpm exec vitest run tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx` — **27 passed**.
- `/opt/apps/symphony/runtime/run-fe-browser /opt/apps/symphony/workspaces-fe-jira/SIGN-329 tests/e2e/telegram.spec.ts --grep 'P0 Telegram operations' --retries=0` — **3 passed**. The run covers create-only access without GET, create/read response status and readback, token/owner omission, localized verification/permission/conflict feedback, keyboard opening and focus restoration, both Vietnamese close names, and responsive behavior including resize while the dialog and token draft stay open at effective 200% width.
- `pnpm typecheck` — pass.
- ESLint on the six changed TS/TSX files — pass.
- Prettier on the six changed TS/TSX files — pass after formatting.
- `git diff --check` — pass.

These checks use local fixtures and do not verify live authentication, persistence or Telegram delivery. QA/coordinator own the feature check on dev and Story acceptance.

## Revalidation after merging current dev

The existing PR branch was updated with `origin/dev` at `83f6658e8f41805a1e3e90d6bc64972f3a994a42`, preserving SIGN-329 commits and including the already accepted Telegram destination-link and test-message work from PRs #162 and #160. No new SIGN-329 product scope was added.

Fetched the producer-published [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) at `2026-11-26T11:20:41Z`. `info.version` is `v0`; `x-build-revision` is `b6de21490d5572bdb51624372ef860230af5df86`. GET and POST still reference `TelegramBotConnectionResponse`; POST 201 documents a new ACTIVE or INVALID connection, and POST 200 documents the caller's stored status. The response schema has no `required` list, so `id` and `status` are structurally optional even though the operation descriptions promise the actual saved status. This revision differs from the producer revisions recorded in SIGN-328 and SIGN-336 handoffs.

The candidate at this point still required a numeric `id` and an enumerated `status`, so a contract-valid response omitting either field could not be consumed. Coordinator comment [11804](https://signapse-group.atlassian.net/browse/SIGN-329?focusedCommentId=11804) then explicitly allowed FE to continue in Progress while the producer clarifies the schema, with the accepted behavior that absent saved data stays unverified and must not be guessed or presented as a create failure.

The current consumer projects allowlisted metadata while tolerating missing or malformed `id` and `status`. A successful POST 200/201 with no verifiable status produces a localized unverified warning and refreshes the list; it is never presented as ACTIVE or as a failed create. GET renders known safe metadata with an unverified status badge and note, and withholds row management actions until both the record ID and status are available. Only a returned `ACTIVE` status on a new 201 is announced as a successful connection.

### Reverification on the merged working tree

- `pnpm typecheck` — passed.
- `pnpm exec vitest run tests/api/auth-action.test.ts tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx tests/components/telegram-destination-test-message-button.component.test.tsx tests/core/telegram-permissions.test.ts` — 65 passed.
- `pnpm test:contract -- --scope 'GET /telegram/bot-connections,POST /telegram/bot-connections'` — fixture consistency passed for both operations.
- `/opt/apps/symphony/runtime/run-fe-browser /opt/apps/symphony/workspaces-fe-jira/SIGN-329 tests/e2e/telegram.spec.ts --grep 'P0 Telegram operations' --retries=0` — 5 passed. It covers the merged shared Telegram P0 flow and SIGN-329 create/read scenarios, including create-only and read-only permissions, ACTIVE/INVALID and caller duplicates, safe readback, rejected requests, keyboard/focus, and responsive behavior.
- Changed-file ESLint, Prettier check, and `git diff --check` — passed.

Compared the current fixture renders with SIGN-31 attachments 10310/10311 and SIGN-32 attachments 10308/10312/10309. Existing Compact, Mobile, row, and open-dialog effective-width images matched the latest report output; the Wide and 360px dialog captures were refreshed in this section. The tested viewport states remain 1520×1024, 1024×768, 390×844, 360×780, and 760×512 effective CSS width with the dialog open and token draft retained. The 760×512 state is a 200% effective-width proxy, not browser-chrome zoom. The P0 images are local fixture renders and do not prove live auth, persistence, Telegram delivery, or dev feature acceptance.

## Follow-up after coordinator decision on missing response fields

Coordinator comment [11804](https://signapse-group.atlassian.net/browse/SIGN-329?focusedCommentId=11804) authorizes continued FE work in Progress while the producer clarifies the schema. It directs the consumer to mark missing data unverified, avoid inferring status, and avoid a create-failure message when the save outcome is unknown. The live [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs), re-fetched at `2026-11-26T12:07:03Z`, remains revision `b6de21490d5572bdb51624372ef860230af5df86`; `TelegramBotConnectionResponse` still has no `required` list.

The runtime allowlist now retains valid safe metadata while representing omitted or malformed `id`/`status` as unverified. A 201/200 response with no verifiable status gives localized feedback and refreshes the list instead of reporting failure or ACTIVE. A transport/5xx outcome gives a separate unconfirmed-result warning and also refreshes; known 4xx rejections retain their localized field error. Partial GET rows show an unverified badge/note. With manage permission and a known ID, the row menu remains available: Disable is disabled until status is verified as `ACTIVE`, while Delete remains available. Without a usable ID, the menu is withheld. A new 201 is announced as connected only when the returned status is `ACTIVE`.

Regression checks added at the action, component and P0 fixture-browser seams cover missing/invalid fields, safe projection, transport/5xx uncertainty versus known 4xx rejection, a successful POST with omitted status, a saved connection followed by an unknown 503 response, and GET readback missing both ID and status. The component test also verifies that a known-ID partial row keeps Delete available and prevents Disable until the status is `ACTIVE`. The expanded browser check also keeps the partial row readable at 390×844 with no horizontal overflow. The render remains fixture-only and does not establish live persistence or dev feature acceptance.

### Final local verification for the partial-row action adjustment

The change preserves existing management behavior for a known-ID row while failing closed on the status-dependent Disable action. It has no effect on the approved Connect dialog layout; that dialog remains compared against SIGN-31 attachments 10310/10311 above.

- Focused action/component/permission suites — **75 passed**.
- `pnpm typecheck` — pass.
- Telegram GET/POST fixture contract guard — pass.
- Changed-file ESLint and Prettier checks, plus `git diff --check` — pass.
- The expanded P0 browser run is still required for the new partial-row/mobile assertion; the shared host browser lock is owned by another active Symphony session and returned `resource_busy`. No bypass or competing browser process was used.

These local checks use fixtures and do not verify live authentication, persistence, or Telegram delivery. QA/coordinator retain feature acceptance on dev and Story acceptance.

## Revalidation after PR #167 and current dev — 2026-11-27

This section supersedes earlier browser-runner gates and the earlier description of the bot row's Disable action. The current FE base is `origin/dev` revision `866630a0a004cc8a5b4ed4ce0c7b9c8daf971146`. That revision retires the shared Playwright/browser suite and the bot Disable UI. SIGN-329 keeps the create and safe readback behavior, while the branch now includes the current dev bot Delete permission/action. Connect visibility is controlled only by create permission; row deletion is controlled only by delete permission. Reconnect remains outside this output.

The [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) was fetched at `2026-11-27T02:54:49Z`, `info.version` `v0`, build revision `b6de21490d5572bdb51624372ef860230af5df86`. GET requires `telegram-bot-connection:read` and returns caller-owned safe metadata without tokens. POST requires `telegram-bot-connection:create`; 201 creates, 200 returns the caller's existing connection and saved status, 400 reports an unverifiable token, and 409 is a generic cross-owner conflict. The published `TelegramBotConnectionResponse` schema still omits a `required` list for `id` and `status`, despite operation descriptions promising the saved status. Coordinator decision [comment 11804](https://signapse-group.atlassian.net/browse/SIGN-329?focusedCommentId=11804) allows continued FE work with missing values left unverified. The consumer never infers ACTIVE, never reports an unknown save outcome as a failed create, and refreshes saved state after a successful but unverifiable response or an unknown transport/5xx result. It allowlists safe fields and omits raw provider failure detail, tokens, and owner data.

No new browser render was made on this candidate. Jira [comment 11871](https://signapse-group.atlassian.net/browse/SIGN-329?focusedCommentId=11871) assigns browser verification to QA after PR #167 retired the FE browser suite. The image captures earlier in this file were made on earlier revisions; they are comparison evidence against SIGN-31 attachments 10310/10311 and SIGN-32 attachments 10308/10312/10309, not proof of the current merged candidate. QA should use the current dev Preview and real browser to verify:

- Create-only users can open and submit the keyboard-operable token dialog without making a list request. Read-only users get safe readback without a create action. Manage/delete-only users do not get a create action.
- New ACTIVE, new INVALID, caller duplicate, token verification rejection, permission rejection, and cross-owner conflict show the appropriate localized result. INVALID explains incomplete setup and suppresses raw failure detail. Caller duplicates retain their stored state.
- Missing `id`/`status` in a saved row stays visibly unverified and readable at 390×844 without horizontal overflow. A successful POST with missing status and a saved connection followed by an unknown 503 both prompt a saved-state refresh and are not announced as create failures.
- The dialog's keyboard operation, focus placement/restoration, validation feedback, and layout at 1520×1024, 1024×768, 390×844, 360×780, and 760×512 effective CSS width (200% zoom) match the approved responsive contract. The 760×512 size should be checked using actual browser zoom.

Verification from the issue workspace on the merged working tree:

- `pnpm test:quality` — passed: lint reported 0 errors and 23 warnings; typecheck passed; Vitest passed **103 files / 891 tests**; fixture guard passed for **89 operations**; deploy-verification passed **5/5**.
- Focused action/component/permission suites — **66 tests passed**.
- `pnpm test:contract` — fixture consistency passed for **89 operations**.
- `git diff --check` — passed after this evidence update.

These checks use fixtures and do not establish live authentication, persistence, Telegram delivery, browser behavior on the current candidate, or feature acceptance on dev. QA owns those browser and live feature checks; the coordinator owns Story acceptance. The response schema's optional `id`/`status` fields remain a producer contract discrepancy under comment 11804.

## Follow-up after review comment 11879

The [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) was fetched again at `2026-11-27T03:50:11Z`, build revision `b6de21490d5572bdb51624372ef860230af5df86`. It still does not guarantee that each POST error body follows the requested locale: `Content-Language` and `Vary: Accept-Language` are documented only when a localized body is returned. POST documents 400 for token/request validation, 403 for missing create permission, and 409 with code `TELEGRAM_BOT_CONNECTION_ALREADY_EXISTS` for another owner's connection. A separate `USER_PROVISIONING_REJECTED` can also use 409.

The FE maps 400 and 403 to localized token-verification and permission messages, and maps 409 to the conflict message only for the documented conflict code. Every other 4xx response uses the localized generic create error. Provider messages are no longer forwarded. Action fixtures use Vietnamese copy for 400, 403, the recognized conflict, a different 409 code and 422. The component fixture checks the Vietnamese `role="alert"`, retained token, invalid-field association, and keyboard/focus behavior.

Design references were confirmed against the current Jira attachment list and downloaded for comparison: SIGN-31 attachments 10310 (`telegram-connect-bot-desktop-20261123-v2.png`) and 10311 (`telegram-connect-bot-mobile-20261123-v2.png`), plus SIGN-32 attachments 10308 (`telegram-settings-wide-20261123-v2.png`), 10312 (`telegram-settings-compact-20261123-v2.png`) and 10309 (`telegram-settings-mobile-20261123-v2.png`). They show the approved dark theme, token dialog, and Bot connections layout. This follow-up changes error copy only and does not change the form or page layout. No browser render was made for this candidate; the earlier local images remain comparison evidence only. QA should verify localized rejection text and wrapping, keyboard announcement/focus, and the dialog at Wide 1520×1024, Compact 1024×768, Mobile 390×844/360px, and actual 200% browser zoom in the current Preview, as assigned by comment 11871.

### Follow-up checks

- Focused Telegram action/component command: `pnpm exec vitest run tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx` — **64 passed**.
- `pnpm typecheck` — passed.
- `pnpm test:contract` — fixture consistency passed for **89 operations**.
- Changed-file ESLint, Prettier and `git diff --check` — passed.
- Two full `pnpm test:quality` attempts reached lint (0 errors / 23 warnings) and typecheck successfully, but the Vitest run reported intermittent failures outside the changed behavior: an account-profile picker timeout on the first run and two destination-link dialog option lookups on the second. The account-profile file passed 9/9 on isolated rerun, and the focused Telegram action/component suites passed after the second run. The current PR's GitHub `Verify / check` is still required.

These local fixtures do not verify live authentication, persistence, Telegram delivery, or browser behavior on the current candidate. QA owns responsive/browser and live feature verification on dev; the coordinator owns Story acceptance.

## Follow-up for pending create dismissal — 2026-11-27

The live [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) was fetched at `2026-11-27T04:49:47Z`, build revision `b6de21490d5572bdb51624372ef860230af5df86`, OpenAPI SHA-256 `13e879a87e1f03f07927d1ededd99d1ee238b2a1b855baae2ca56ed0c1e60b03`. The GET/POST permission split and create outcomes match the FE integration. `TelegramBotConnectionResponse` still has no `required` list for `id` and `status`; the consumer keeps incomplete data unverified under coordinator decision [comment 11804](https://signapse-group.atlassian.net/browse/SIGN-329?focusedCommentId=11804).

I re-read the live SIGN-31 attachment list and downloaded the active approved dialog references: attachment 10310 (`telegram-connect-bot-desktop-20261123-v2.png`) and 10311 (`telegram-connect-bot-mobile-20261123-v2.png`). The desktop reference keeps Close and Connect side by side; Mobile stacks them in the footer. The existing dark-theme resting-state captures at 1520×1024 and 360×780 retain that geometry. This fix changes no layout or copy: while a create request is pending, both close buttons are disabled, pointer dismissal is disabled, and Escape/other close requests are canceled. A successful response still closes the dialog programmatically.

The delayed-rejection component test attempts both close buttons, Escape, and outside pointer dismissal while pending. It confirms the dialog stays open, then checks the localized error, retained token and retry. On failure, the dialog remains available; on success, existing component coverage confirms normal close and refresh behavior.

No browser render was made for the pending state on this candidate. Earlier resting-state captures remain useful for the unchanged layout but do not prove pending-state rendering or responsive behavior. QA should check the current PR Preview at Wide 1520×1024, Compact 1024×768, Mobile 390×844 and 360px, plus actual 200% zoom, with a pending request and delayed rejection. Verify the disabled close controls remain visible, Escape and outside dismissal do not lose the draft, the localized rejection is announced with focus on the token field, retry remains available, and the open dialog has no horizontal overflow. Browser verification remains assigned to QA by comment 11871.

### Follow-up checks

- `pnpm exec vitest run tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx` — **65 passed** after formatting.
- `pnpm test:quality` — **passed**: lint (0 errors, 23 existing warnings), typecheck, 892 tests across 103 files, contract fixture consistency for 89 operations and 5 deployment-verification tests.
- `pnpm test:contract` — fixture consistency passed for **89 operations**.
- Changed-file ESLint, Prettier, and `git diff --check` — passed.

## Revalidation after syncing current dev — 2026-11-27

Before publishing, `origin/dev` advanced to `bc00cd25df4dd8452705afa257b637d3a97fdf2c` (SIGN-392, PR #159). The SIGN-329 branch now merges that accepted dev work and preserves its Telegram routing UI, route-specific permissions and evidence alongside the bot-connect changes. No additional SIGN-329 product scope was introduced.

The delayed-create-rejection regression now waits for the pending mutation to settle before checking that the token input and retry action are enabled. The complete `pnpm test:quality` run passed on the merged tree: lint reported 0 errors and 23 existing warnings; typecheck passed; Vitest passed **908 tests across 103 files**; contract fixture consistency passed for **89 operations**; deployment verification passed **5/5**. The pending-create Telegram component suite passed **43/43**. The full run had one earlier attempt with timeouts in the account-profile component suite under parallel load; that suite passed **9/9** in isolation, and the complete quality run passed on retry.

No browser render was made for the current pending-create state. The recorded resting-state images do not establish pending-state behavior at browser zoom or compact widths. QA should verify the current PR Preview at the sizes and interactions listed above; live authentication, persistence, Telegram delivery, and dev feature acceptance remain with QA/coordinator.
