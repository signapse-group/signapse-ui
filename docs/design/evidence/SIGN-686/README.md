# SIGN-686 Scheduled analysis render evidence

Candidate: [`50137487ee824a331a8c1b2500e514af9e942617`](https://github.com/signapse-group/signapse-ui/commit/50137487ee824a331a8c1b2500e514af9e942617), based on `origin/dev` [`4179b7a095482228b3df21cc2e0937676c7f1b6e`](https://github.com/signapse-group/signapse-ui/commit/4179b7a095482228b3df21cc2e0937676c7f1b6e).

## Accepted direction and API

The comparison uses the approved Design v2 on [SIGN-657](https://signapse-group.atlassian.net/browse/SIGN-657): Create desktop attachment 10315, Edit desktop attachment 10318, and Create mobile attachment 10317. List composition follows [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32): Wide attachment 10308, Compact 10312, and Mobile 10309.

The deployed producer contract at [`/v3/api-docs`](https://dev-api.signapse.cloud/v3/api-docs) was fetched from `dev` on 2026-11-26 07:22 UTC; `x-build-revision` was `b6de21490d5572bdb51624372ef860230af5df86`. It exposes GET/POST `/telegram/market-analysis-schedules` and PUT/DELETE `/telegram/market-analysis-schedules/{id}`. The consumer uses the published per-action permissions and nullable destination/language response fields; DELETE accepts the documented empty 200 response.

## Candidate renders

All captures use the local P0 fixture in dark mode and Vietnamese. List and dialog elements are cropped to the affected surface, so the application sidebar is outside these captures. The test hides the unrelated floating assistant launcher and Next.js development portal so they do not cover the target.

| State                                          | Responsive Contract viewport                                    | Candidate render                                                                |
| ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Schedule list, table layout                    | Wide, 1520×1024                                                 | [Wide](scheduled-analysis-wide-dark-vi-1520x1024.png)                           |
| Schedule list, table layout                    | Compact, 1024×768                                               | [Compact](scheduled-analysis-compact-dark-vi-1024x768.png)                      |
| Schedule list, cards                           | Mobile, 390×844                                                 | [Mobile](scheduled-analysis-mobile-dark-vi-390x844.png)                         |
| Schedule list, cards                           | Mobile, 360×800                                                 | [360px mobile](scheduled-analysis-mobile-dark-vi-360x800.png)                   |
| Schedule list, cards                           | Effective 760×512 CSS viewport representing 200% from 1520×1024 | [Effective 200% width](scheduled-analysis-effective-760x512-200pct-dark-vi.png) |
| Create dialog, top of scroll area              | Wide, 1520×1024                                                 | [Create wide](schedule-create-wide-dark-vi-1520x1024.png)                       |
| Create dialog, top of scroll area              | Mobile, 390×844                                                 | [Create mobile](schedule-create-mobile-dark-vi-390x844.png)                     |
| Create dialog, scrolled to output language     | Mobile, 390×844                                                 | [Create mobile, scrolled](schedule-create-mobile-bottom-dark-vi-390x844.png)    |
| Edit dialog                                    | Wide, 1520×1024                                                 | [Edit wide](schedule-edit-wide-dark-vi-1520x1024.png)                           |
| Destructive Remove confirmation, before cancel | Wide, 1520×1024                                                 | [Remove confirmation](schedule-remove-confirmation-dark-vi.png)                 |

The fixture list contains an ACTIVE schedule with destination and language, a DISABLED schedule with no destination, and a REMOVED record. The captures show REMOVED filtered out, Edit/Remove on ACTIVE, Remove only on DISABLED, the explicit missing-destination and default-language labels, and the destructive confirmation before cancel. The mobile dialog captures show the required visible Destination label and the fixed footer while scrolling through the longer form.

## Checks and limits

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/components/telegram-schedule-form.component.test.tsx tests/api/telegram-action.test.ts` — 35 passed. Coverage includes schedule-only read, independent create/update/delete permissions, nullable destination, load/save/remove failures, retained drafts, cancel/retry and DELETE request contract.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --retries=0` — 1 passed. This fixture-backed Chromium check captured the responsive list, Create/Edit dialogs, mobile form scroll and Remove confirmation.
- `pnpm exec eslint` on changed Telegram components, actions, dictionaries, types and tests — passed.
- `pnpm typecheck` and `pnpm test:contract` (89 operations) — passed.
- `pnpm exec prettier --check docs/design/evidence/SIGN-686/README.md tests/e2e/telegram.spec.ts` and `git diff --check` — passed.

These are local fixture renders and checks. They do not establish live-user authorization or feature acceptance. QA retains live feature-flow verification after delivery.
