# SIGN-686 Scheduled analysis evidence

Code candidate: [`d7c1d9bf32469aafbc258b016b1bd094526a0842`](https://github.com/signapse-group/signapse-ui/commit/d7c1d9bf32469aafbc258b016b1bd094526a0842), based on `origin/dev` [`4179b7a095482228b3df21cc2e0937676c7f1b6e`](https://github.com/signapse-group/signapse-ui/commit/4179b7a095482228b3df21cc2e0937676c7f1b6e). The evidence-only commit that adds these files does not change the application candidate.

## Direction and contract

The comparison uses approved Design v2 on [SIGN-657](https://signapse-group.atlassian.net/browse/SIGN-657): Create desktop 10315, Edit desktop 10318 and Create mobile 10317. Page composition follows [SIGN-32](https://signapse-group.atlassian.net/browse/SIGN-32): Wide 10308, Compact 10312 and Mobile 10309.

The deployed producer contract at [`/v3/api-docs`](https://dev-api.signapse.cloud/v3/api-docs) was fetched from `dev` on 2026-11-26 08:17 UTC; `x-build-revision` was `b6de21490d5572bdb51624372ef860230af5df86`. It publishes GET/POST `/telegram/market-analysis-schedules` and PUT/DELETE `/telegram/market-analysis-schedules/{id}`, with per-action permissions and nullable destination/language response fields. DELETE accepts the documented empty 200 response.

## Render captures

The full-page list captures include the application shell and use the P0 fixture in Vietnamese. Wide was captured in dark and light mode. Compact, Mobile, 360px and effective 760×512 CSS width use dark mode. The 760×512 capture represents 200% from 1520×1024. Create/Edit captures show the dialog surface while it remains open; the edit draft is focused and the saved `Asia/Ho_Chi_Minh` timezone remains selected. The assistant launcher and Next.js portal are hidden where they overlap the target.

| State                                      | Viewport / mode   | Capture                                                                       |
| ------------------------------------------ | ----------------- | ----------------------------------------------------------------------------- |
| Full page, Wide                            | 1520×1024, dark   | [Wide dark](scheduled-analysis-wide-dark-vi-1520x1024.png)                    |
| Full page, Wide                            | 1520×1024, light  | [Wide light](scheduled-analysis-wide-light-vi-1520x1024.png)                  |
| Full page, Compact                         | 1024×768, dark    | [Compact](scheduled-analysis-compact-dark-vi-1024x768.png)                    |
| Full page, Mobile                          | 390×844, dark     | [Mobile](scheduled-analysis-mobile-dark-vi-390x844.png)                       |
| Full page, Mobile                          | 360×800, dark     | [360px Mobile](scheduled-analysis-mobile-dark-vi-360x800.png)                 |
| Full page, effective 200%                  | 760×512 CSS, dark | [Effective width](scheduled-analysis-effective-760x512-200pct-dark-vi.png)    |
| Create dialog                              | 1520×1024, dark   | [Create Wide](schedule-create-wide-dark-vi-1520x1024.png)                     |
| Create dialog                              | 360×800, dark     | [Create 360px](schedule-create-mobile-360x800-dark-vi.png)                    |
| Create dialog                              | 760×512 CSS, dark | [Create effective 200%](schedule-create-effective-760x512-200pct-dark-vi.png) |
| Create dialog, scrolled to output language | 390×844, dark     | [Create mobile, scrolled](schedule-create-mobile-bottom-dark-vi-390x844.png)  |
| Edit dialog with unsaved focused draft     | 1520×1024, dark   | [Edit Wide](schedule-edit-wide-dark-vi-1520x1024.png)                         |
| Edit dialog with unsaved focused draft     | 360×800, dark     | [Edit 360px](schedule-edit-mobile-360x800-dark-vi.png)                        |
| Edit dialog with unsaved focused draft     | 760×512 CSS, dark | [Edit effective 200%](schedule-edit-effective-760x512-200pct-dark-vi.png)     |
| Remove confirmation before cancel          | 1520×1024, dark   | [Remove confirmation](schedule-remove-confirmation-dark-vi.png)               |

The fixture has an ACTIVE schedule, a DISABLED schedule without a destination and a REMOVED record. The captures show the saved schedule details, inactive/missing-destination labels and the absence of the REMOVED row. The browser test asserts that Edit is available only for ACTIVE, Remove follows delete permission, the draft and timezone survive viewport changes, the Edit footer stays visible, cancel confirms draft discard, and a Feature routing read failure leaves Scheduled analysis available.

## Checks and remaining local evidence

- `pnpm exec vitest run tests/components/telegram-configuration.component.test.tsx tests/components/telegram-schedule-form.component.test.tsx tests/api/telegram-action.test.ts` — 38 passed.
- Scoped `pnpm exec eslint` on changed Telegram page/components, dictionaries, types and tests — passed.
- `pnpm typecheck` — passed.
- `git diff --check` — passed.
- The selected browser command is `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/telegram.spec.ts --retries=0`. The current candidate does not yet have a completed browser result. After the earlier partial run, repeated attempts were rejected with `resource_busy: host browser slot occupied`; its lease still identifies the active `symphony-session-74f4e296fcdc62259c4f6e631c4de97e.service` cgroup as populated. Rerun the selected P0 check in a fresh Implement session after the lease clears before In Review.

These are local fixture renders and checks. They do not verify live-user authorization or feature acceptance. QA/coordinator owns live feature-flow acceptance after delivery.
