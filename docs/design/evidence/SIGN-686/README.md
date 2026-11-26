# SIGN-686 Scheduled analysis evidence

App-code candidate: [`4c347c3`](https://github.com/signapse-group/signapse-ui/commit/4c347c309e91f5f54bb8d65d37a2e4a9bb6e568a) — the SIGN-686 implementation integrated with current `origin/dev` [`83f6658`](https://github.com/signapse-group/signapse-ui/commit/83f6658e8f41805a1e3e90d6bc64972f3a994a42). This evidence update does not change application code.

## Design and API basis

Compared the candidate with the live approved references:

- [SIGN-32] list: attachment 10308 `telegram-settings-wide-20261123-v2.png`, 10312 `telegram-settings-compact-20261123-v2.png`, and 10309 `telegram-settings-mobile-20261123-v2.png`.
- [SIGN-657] schedule dialogs: attachment 10315 `telegram-schedule-create-full-20261123-v2.png`, 10318 `telegram-schedule-edit-desktop-20261123-v2.png`, and 10317 `telegram-schedule-create-mobile-20261123-v2.png`.

The list keeps Feature routing and Scheduled analysis together on the left at Wide/Compact, with bot and destination infrastructure on the right. Mobile order is Feature routing, Scheduled analysis, Bot connections, then Destinations. ACTIVE rows have Edit/Remove, DISABLED rows show Inactive and Remove only, and a missing destination is explicit. Create/Edit keep the labelled required Destination field and fixed footer; Edit uses the approved ghost Cancel action. The live attachments were downloaded from Jira and visually checked against the current render.

Fetched the current [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) on 2026-11-26 at 15:57:54 UTC; `x-build-revision` is `b6de21490d5572bdb51624372ef860230af5df86`. It publishes GET/POST `/telegram/market-analysis-schedules` and PUT/DELETE `/telegram/market-analysis-schedules/{id}` with separate read/create/update/delete permissions. Create/update require `destinationId`; `outputLanguageIsoCode` can be omitted/null. Read responses include required `workspaceName`, `asset`, and status, with nullable `destination` and `outputLanguage`; GET omits REMOVED. DELETE accepts ACTIVE/DISABLED and succeeds with an empty 200 response. SIGN-684 comment #11791 records dev deploy run 45763078705 and a matching producer revision.

## Render captures

The captures use the P0 fixture in Vietnamese: one ACTIVE schedule, one DISABLED schedule without a destination, and one REMOVED schedule. The REMOVED row is absent. The list and dialog captures below were refreshed from the focused browser run on 2026-11-26 and visually reviewed.

| State                                      | Viewport / theme / shell           | Capture                                                                       |
| ------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------- |
| Full page, Wide                            | 1520×1024, dark, expanded sidebar  | [Wide dark](scheduled-analysis-wide-dark-vi-1520x1024.png)                    |
| Full page, Wide                            | 1520×1024, light, expanded sidebar | [Wide light](scheduled-analysis-wide-light-vi-1520x1024.png)                  |
| Full page, Compact                         | 1024×768, dark, collapsed default  | [Compact](scheduled-analysis-compact-dark-vi-1024x768.png)                    |
| Full page, Mobile                          | 390×844, dark, sidebar closed      | [Mobile](scheduled-analysis-mobile-dark-vi-390x844.png)                       |
| Full page, Mobile                          | 360×800, dark, sidebar closed      | [360px Mobile](scheduled-analysis-mobile-dark-vi-360x800.png)                 |
| Full page, effective 200% width            | 760×512 CSS, dark, sidebar closed  | [Effective width](scheduled-analysis-effective-760x512-200pct-dark-vi.png)    |
| Create dialog                              | 1520×1024, dark                    | [Create Wide](schedule-create-wide-dark-vi-1520x1024.png)                     |
| Create dialog                              | 1520×1024, light                   | [Create Wide light](schedule-create-wide-light-vi-1520x1024.png)              |
| Create dialog                              | 360×800, dark                      | [Create 360px](schedule-create-mobile-360x800-dark-vi.png)                    |
| Create dialog                              | 760×512 CSS effective width, dark  | [Create effective 200%](schedule-create-effective-760x512-200pct-dark-vi.png) |
| Create dialog, scrolled to output language | 390×844, dark                      | [Create mobile, scrolled](schedule-create-mobile-bottom-dark-vi-390x844.png)  |
| Edit dialog with focused unsaved draft     | 1520×1024, dark                    | [Edit Wide](schedule-edit-wide-dark-vi-1520x1024.png)                         |
| Edit dialog with focused unsaved draft     | 1520×1024, light                   | [Edit Wide light](schedule-edit-wide-light-vi-1520x1024.png)                  |
| Edit dialog with focused unsaved draft     | 360×800, dark                      | [Edit 360px](schedule-edit-mobile-360x800-dark-vi.png)                        |
| Edit dialog with focused unsaved draft     | 760×512 CSS effective width, dark  | [Edit effective 200%](schedule-edit-effective-760x512-200pct-dark-vi.png)     |
| Remove confirmation before cancel          | 1520×1024, dark                    | [Remove confirmation](schedule-remove-confirmation-dark-vi.png)               |

The P0 case resized while Create/Edit stayed open. At 360px and 760px CSS width, the draft, focus, and selected `Asia/Ho_Chi_Minh` timezone remained; the footer actions stayed visible and there was no page-level horizontal overflow. The 760×512 viewport is the effective-width proxy for 200% from 1520×1024, not browser-chrome zoom. Create and Edit open from keyboard; focus remains in each dialog; Tab/Shift+Tab order and wrapping from Save to Close are checked. Escape closes each dialog and returns focus to its trigger. After Edit is resized and discarded through its confirmation, focus returns to the visible responsive Edit trigger. Each schedule dialog exposes one close button. On the error path, a 503 from Feature routing rendered its local error while Scheduled analysis and the ACTIVE row remained available at 1520×1024 with the sidebar expanded.

Light/dark visual review found the text, control boundaries, required Destination marker, and focused name field readable in both themes. This is a visual review; numeric color contrast was not measured.

## Local checks

- Focused Vitest: `pnpm exec vitest run tests/api/telegram-action.test.ts tests/components/telegram-configuration.component.test.tsx tests/components/telegram-schedule-form.component.test.tsx tests/core/api-contract-guard.test.ts` — 4 files, 66 passed.
- Scoped ESLint on the changed schedule form, fixture, and browser spec — passed.
- `pnpm typecheck` — passed on the corrected create/readback test.
- Prettier on changed TS/TSX/MJS/Markdown files and `git diff --check` — passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --grep "edits an active schedule and reads the same record back|covers destination delivery states and destructive confirmation"` — 2 passed in 40.7s. Covers Edit readback of the same ACTIVE record, 503 isolation, Create/Edit keyboard and responsive behavior, and destructive confirmation.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --grep "creates a schedule and reads it back"` — 1 passed in 14.9s. The Create flow submits valid data, shows the saved ACTIVE row, and retains it after a fresh page read; the fixture records both POST and GET.

These local fixtures do not prove live-user authorization or schedule persistence. QA owns live feature acceptance after delivery.

[SIGN-32]: https://signapse-group.atlassian.net/browse/SIGN-32
[SIGN-657]: https://signapse-group.atlassian.net/browse/SIGN-657
