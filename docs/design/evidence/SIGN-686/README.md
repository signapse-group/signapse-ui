# SIGN-686 Scheduled analysis evidence

App follow-up: [`bdafdaf`](https://github.com/signapse-group/signapse-ui/commit/bdafdaf3722812fe32b293e4aec8d2af647dd107), on current `origin/dev` [`dc7d7d0`](https://github.com/signapse-group/signapse-ui/commit/dc7d7d06ab6d4a108b8da38356bff23219e524f1). It admits schedule create/update/delete roles to Telegram navigation and the route while keeping schedule reads gated, describes history-preserving Remove accurately, marks unreadable Feature routing as unavailable, and uses a higher-contrast shared Input/Select border token. The screenshots and browser outcomes below are preserved from the preceding candidate `8e5304a`; fresh 767/768 renders and numeric contrast readings for this follow-up are pending because the shared browser runner is occupied.

## Design and API basis

Compared the candidate with the live approved references:

- [SIGN-32] list: attachment 10308 `telegram-settings-wide-20261123-v2.png`, 10312 `telegram-settings-compact-20261123-v2.png`, and 10309 `telegram-settings-mobile-20261123-v2.png`.
- [SIGN-657] schedule dialogs: attachment 10315 `telegram-schedule-create-full-20261123-v2.png`, 10318 `telegram-schedule-edit-desktop-20261123-v2.png`, and 10317 `telegram-schedule-create-mobile-20261123-v2.png`.

The list keeps Feature routing and Scheduled analysis together on the left at Wide/Compact, with bot and destination infrastructure on the right. Mobile order is Feature routing, Scheduled analysis, Bot connections, then Destinations. ACTIVE rows have Edit/Remove, DISABLED rows show Inactive and Remove only, and a missing destination is explicit. Create/Edit keep the labelled required Destination field and fixed footer; Edit uses the approved ghost Cancel action. The live attachments were downloaded from Jira and visually checked against the preceding candidate render; the latest control-boundary update still needs a refreshed render comparison.

Fetched the current [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) on 2026-11-26 at 19:58 UTC; `x-build-revision` is `b6de21490d5572bdb51624372ef860230af5df86`. It publishes GET/POST `/telegram/market-analysis-schedules` and PUT/DELETE `/telegram/market-analysis-schedules/{id}` with separate read/create/update/delete permissions. Create/update require `destinationId`; `outputLanguageIsoCode` can be omitted/null. Read responses include required `workspaceName`, `asset`, and status, with nullable `destination` and `outputLanguage`; GET omits REMOVED. DELETE accepts ACTIVE/DISABLED and succeeds with an empty 200 response. SIGN-684 comment #11791 records dev deploy run 45763078705 and a matching producer revision.

## Render captures

The captures use the P0 fixture in Vietnamese: one ACTIVE schedule, one DISABLED schedule without a destination, and one REMOVED schedule. The REMOVED row is absent. These list and dialog captures were refreshed from the focused browser run on 2026-11-26 for candidate `8e5304a` and visually reviewed. They remain as prior-candidate history; the latest border and breakpoint follow-up has no refreshed render yet.

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

## Local checks

- App follow-up `bdafdaf`: `pnpm exec vitest run tests/core/telegram-permissions.test.ts tests/components/telegram-configuration.component.test.tsx tests/api/telegram-action.test.ts` — 3 files, 51 passed. Scoped ESLint, `pnpm typecheck`, Prettier and `git diff --check` passed; `pnpm test:contract` passed fixture consistency for 88 operations.
- Current follow-up browser check is pending: `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --retries=0 --grep 'schedule creator can use Telegram|schedule list reflows|schedule Create and Edit field boundaries'` repeatedly returned `resource_busy: host browser slot occupied; retry_after_seconds=30`. No new 767/768 screenshots or contrast readings were produced, and no browser pass is claimed.
- PR build checks for app commit `bdafdaf` passed before this evidence-only update: [Verify run 45890601082](https://github.com/signapse-group/signapse-ui/actions/runs/45890601082) and both [signapse-ui Preview](https://vercel.com/signapse/signapse-ui/EHvFXM4iJG7n8KiN3YGoCXEHEqod) and [signapse-prod Preview](https://vercel.com/signapse/signapse-prod/94FNsoHDBESZ7kmfErmJ9RL5HUMh). The evidence update has its own head-level checks pending.

- Follow-up Vitest: `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx` — 1 file, 23 passed. The earlier 5-file 73-test run remains recorded on the prior candidate.
- Scoped ESLint on the Telegram configuration component and affected browser tests — passed; `pnpm typecheck`, Prettier checks, and `git diff --check` passed on this follow-up.
- Follow-up browser check: `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --retries=0 --grep "removes a schedule and focuses the surviving heading after readback"` — 1 passed. It confirms the DELETE, fresh list read, removed row, focused surviving heading, and captures the post-remove state above.
- New breakpoint regression: `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --retries=0 --grep "restores schedule Remove focus to the visible trigger after responsive resize"` — 1 passed. It failed before the fix at the Mobile focus assertion, then passed with Cancel/Escape, effective-width reflow, and no DELETE.
- Earlier focused browser checks on the prior candidate: 5 passed in 1.1m, covering Create/Edit readback, Feature routing 503 isolation, dialog keyboard/reflow, Remove cancel, and bot Remove integration.

The full browser suite was not run. These local fixtures do not prove live-user authorization or schedule persistence. QA owns live feature acceptance after delivery.

[SIGN-32]: https://signapse-group.atlassian.net/browse/SIGN-32
[SIGN-657]: https://signapse-group.atlassian.net/browse/SIGN-657
