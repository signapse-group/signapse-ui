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
