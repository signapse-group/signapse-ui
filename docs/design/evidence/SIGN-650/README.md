# SIGN-650 Sidebar navigation and loading evidence

The accepted transition reference is [SIGN-114](https://signapse-group.atlassian.net/browse/SIGN-114), attachment **10000**, `SIGN-114-contact-requests-desktop-1440.png` (1440×1024). It establishes the Contact Requests shell and loading behavior. The Roles skeleton follows the existing Roles table columns and row layout. Local design checks use [`DESIGN.md`](../../DESIGN.md), especially [App Shell](../../DESIGN.md#app-shell), [List Table Surface](../../DESIGN.md#list-table-surface), [Loading and Result States](../../DESIGN.md#empty-loading-error-permission), [UI Design Gate](../../DESIGN.md#ui-design-gate), [Responsive Contract](../../DESIGN.md#responsive-contract), and [Accessibility](../../DESIGN.md#accessibility-and-responsive-behavior).

The Planning reference URL from SIGN-650 returned HTTP 404 in this run. The local FE design contract and the approved SIGN-114 attachment supplied the available reference direction.

## Rendered comparison

All renders use the local fixture app, Vietnamese locale and dark theme. The pending Roles captures were taken while `GET /roles` was held by the fixture: the destination frame is visible, the Roles link is the sole current sidebar item, and the skeleton follows the five-column Roles table. The test also observes the existing `#nprogress` bar during the transition before the destination frame appears. The loaded capture shows the fixture Administrator row after the skeleton is removed.

| Reference                 | Local candidate render                                        | Context and comparison                                                                     |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| SIGN-114 attachment 10000 | [Roles loading, desktop](roles-loading-desktop-1440-dark.png) | 1440×1024; expanded sidebar; current Roles item and table-shaped skeleton in the app shell |
| SIGN-114 attachment 10000 | [Roles loading, mobile](roles-loading-mobile-390-dark.png)    | 390×844; mobile shell; table skeleton remains within the viewport                          |
| SIGN-114 attachment 10000 | [Roles loaded, desktop](roles-loaded-desktop-1440-dark.png)   | 1440×1024; compact sidebar; fixture data replaces the skeleton                             |

The browser check found no document-level horizontal overflow at 360×800, 390×844, 760×512 CSS viewport, or 1024×768. The 760×512 result is an emulated CSS viewport, not a native 200% browser-zoom capture.

## Navigation coverage

The local browser suite starts from a different route, activates each permitted sidebar destination, and checks the destination URL and single `aria-current="page"` marker. The route list comes from the permission-filtered navigation configuration. Existing route/page fallbacks were inventoried during Survey; `/roles` was the only primary destination without a loading boundary and now uses a route `loading.tsx`.

| Sidebar destination        | Path                      | Fallback at destination    | Navigation and active marker                 |
| -------------------------- | ------------------------- | -------------------------- | -------------------------------------------- |
| Overview                   | `/dashboard`              | Existing page skeleton     | Pass                                         |
| Graph View                 | `/graph-view`             | Existing page skeleton     | Pass                                         |
| Market Charts              | `/market-charts`          | Existing page skeleton     | Pass                                         |
| News Articles              | `/news-articles`          | Existing page skeleton     | Pass                                         |
| News Outlets               | `/news-outlets`           | Existing page skeleton     | Pass                                         |
| Blogs                      | `/blogs`                  | Existing page skeleton     | Pass                                         |
| Events                     | `/events`                 | Existing page skeleton     | Pass                                         |
| Economic Calendar          | `/economic-calendar`      | Existing page skeleton     | Pass                                         |
| AI Provider Configurations | `/ai-provider-configs`    | Existing page skeleton     | Pass                                         |
| AI Task Configurations     | `/ai-task-configurations` | Existing route loading     | Pass                                         |
| System Prompts             | `/system-prompts`         | Existing page skeleton     | Pass                                         |
| Cronjobs                   | `/cronjobs`               | Existing page skeleton     | Pass                                         |
| Telegram                   | `/telegram`               | Existing page skeleton     | Pass                                         |
| Email Delivery             | `/email-delivery`         | Existing page skeleton     | Pass                                         |
| Users                      | `/users`                  | Existing page skeleton     | Pass                                         |
| Roles and Permissions      | `/roles`                  | New route loading skeleton | Pass; delayed fixture verified               |
| Feedback Submissions       | `/feedback-submissions`   | Existing route loading     | Pass                                         |
| Contact Requests           | `/contact-requests`       | Existing route loading     | Pass; existing loading/result coverage rerun |

The same run checked the logo link back to Overview and the Account and Feedback History links in the footer menu by keyboard. Separate sidebar cases cover Back/Forward, grouped links, the collapsed flyout, mobile navigation and focus, touch targets, and the existing axe scan. Roles result coverage includes success, empty and denied outcomes; its skeleton ends when the delayed fixture is released.

| Footer or brand link | Path         | Fallback               | Activation                |
| -------------------- | ------------ | ---------------------- | ------------------------- |
| Signapse logo        | `/dashboard` | Overview destination   | Click activation; pass    |
| Account              | `/account`   | Existing route loading | Keyboard activation; pass |
| Feedback History     | `/feedback`  | Existing route loading | Keyboard activation; pass |

## Local verification

- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/sidebar-navigation.spec.ts tests/e2e/contact-requests.spec.ts --retries=0 --workers=1` — **18/18 passed** using synthetic local fixtures. This checks the 18 navigation targets, delayed Roles transition, Roles empty and denied outcomes, and Contact Requests regression states.
- `pnpm test:contract` — fixture consistency passed for 94 operations.
- `pnpm exec vitest run tests/core/contact-requests-navigation.test.ts` — 1/1 passed.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed with 0 errors and 23 repository warnings.
- Prettier check passed for the changed TypeScript and fixture-server files. `contract-registry.mjs` retains its existing compact formatting to avoid reformatting the full baseline file.
- `git diff --check` — passed.

All browser data was synthetic and local. These checks do not verify live API behavior, deployment, or coordinator acceptance on dev.
