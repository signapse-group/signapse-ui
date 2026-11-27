# SIGN-686 Scheduled analysis evidence

The implementation branch is synchronized with `origin/dev` at [`c01c3dc`](https://github.com/signapse-group/signapse-ui/commit/c01c3dc24baebba11b070d2bfd569ff4c4d5ab27) for [PR #164](https://github.com/signapse-group/signapse-ui/pull/164). The screenshots and browser outcomes below are preserved from schedule candidate `8e5304a`, before this dev sync. They remain visual evidence for list/dialog geometry, ACTIVE and DISABLED states, the missing-destination state, and keyboard flows. They do not verify the current head's create-only panel visibility, action permissions, or live API readback.

## Design and API basis

Compared the candidate with the live approved references:

- [SIGN-32] list: attachment 10308 `telegram-settings-wide-20261123-v2.png`, 10312 `telegram-settings-compact-20261123-v2.png`, and 10309 `telegram-settings-mobile-20261123-v2.png`.
- [SIGN-657] schedule dialogs: attachment 10315 `telegram-schedule-create-full-20261123-v2.png`, 10318 `telegram-schedule-edit-desktop-20261123-v2.png`, and 10317 `telegram-schedule-create-mobile-20261123-v2.png`.

The list keeps Feature routing and Scheduled analysis together on the left at Wide/Compact, with bot and destination infrastructure on the right. Mobile order is Feature routing, Scheduled analysis, Bot connections, then Destinations. ACTIVE rows have Edit/Remove, DISABLED rows show Inactive and Remove only, and a missing destination is explicit. Create/Edit keep the labelled required Destination field and fixed footer; Edit uses the approved ghost Cancel action. The live attachments were downloaded from Jira and visually checked against the preceding candidate render; the latest control-boundary update still needs a refreshed render comparison.

Fetched the current [dev OpenAPI](https://dev-api.signapse.cloud/v3/api-docs) on 2026-11-27 at 08:11 UTC; it returned HTTP 200, OpenAPI 3.1.0, version `v0`, and no `x-build-revision` header. It publishes GET/POST `/telegram/market-analysis-schedules` and PUT/DELETE `/telegram/market-analysis-schedules/{id}` with separate read/create/update/delete permissions. Create/update require `destinationId`; `outputLanguageIsoCode` can be omitted/null. Read responses include required `workspaceName`, `asset`, and status, with nullable `destination` and `outputLanguage`; GET omits REMOVED. DELETE accepts ACTIVE/DISABLED and succeeds with an empty 200 response. SIGN-684 comment #11791 records dev deploy run 45763078705 and producer revision `b6de21490d5572bdb51624372ef860230af5df86`.

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

- `pnpm test:quality` — passed: lint, typecheck, 919 tests across 103 files, fixture consistency for 88 operations, and deployment guard tests. ESLint reported 23 existing warnings outside the Telegram schedule changes.
- `pnpm test:contract` — passed independently; fixture consistency covers 88 operations.
- Scoped Prettier check for the Telegram UI, API action, permission/types/locales, component and API tests, fixture server, and evidence README — passed.
- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx --reporter=dot` — 47 passed after the responsive duplicate-control and focus assertions were aligned with the two layouts and success heading.
- `git diff --cached --check` and `git diff --check` — passed on the final staged candidate.
- PR Verify and Vercel Preview checks for the synchronized head are pending until the branch is pushed. No current-head browser run or numeric contrast measurement is claimed. The full browser suite is outside this handoff.

The prior-candidate browser checks above remain useful for shared form/list geometry and keyboard behavior, but QA should verify the synchronized Preview for independent schedule permissions, create-only navigation, Feature routing read failure isolation, readback after Create/Edit, denied-update draft preservation, Remove cancel/retry and fresh list read, ACTIVE/DISABLED/REMOVED fixture handling, 767/768 reflow, and input/destination boundary contrast in light and dark themes. Local fixtures do not prove live-user authorization or schedule persistence; QA owns live feature acceptance.

[SIGN-32]: https://signapse-group.atlassian.net/browse/SIGN-32
[SIGN-657]: https://signapse-group.atlassian.net/browse/SIGN-657
