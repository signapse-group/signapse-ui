# SIGN-650 Sidebar navigation and loading evidence

The accepted transition reference is [SIGN-114](https://signapse-group.atlassian.net/browse/SIGN-114), attachment **10000**, `SIGN-114-contact-requests-desktop-1440.png` (1440×1024). Jira confirms that ID and filename; the cached approved image was visually compared with the Roles route. The Roles skeleton follows the existing table columns and row layout. Local design checks use [`DESIGN.md`](../../DESIGN.md), especially [App Shell](../../DESIGN.md#app-shell), [List Table Surface](../../DESIGN.md#list-table-surface), [Loading and Result States](../../DESIGN.md#empty-loading-error-permission), [UI Design Gate](../../DESIGN.md#ui-design-gate), [Responsive Contract](../../DESIGN.md#responsive-contract), and [Accessibility](../../DESIGN.md#accessibility-and-responsive-behavior).

The Planning reference URL in SIGN-650 returned HTTP 404. The accepted SIGN-114 image and local FE design contract provide the direction needed for this change.

## Rendered comparison

These local fixture renders were captured on the initial SIGN-650 implementation, before the route-focus manager was added. The pending Roles captures hold `GET /roles`: the Roles destination is visible, its sidebar link is the only current item, and the skeleton follows the five-column table. The loaded capture shows the fixture Administrator row after the skeleton ends. The earlier browser check observed the existing top progress bar before the destination frame appeared. The images still represent the loading and result layouts, but they do not show the keyboard focus indicator after the later route-focus change; that state needs a fresh render before visual handoff.

| Reference                 | Local render                                                  | Context                                                                   |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| SIGN-114 attachment 10000 | [Roles loading, desktop](roles-loading-desktop-1440-dark.png) | 1440×1024; expanded sidebar; Roles current item and table-shaped skeleton |
| SIGN-114 attachment 10000 | [Roles loading, mobile](roles-loading-mobile-390-dark.png)    | 390×844; mobile shell; table skeleton remains within the viewport         |
| SIGN-114 attachment 10000 | [Roles loaded, desktop](roles-loaded-desktop-1440-dark.png)   | 1440×1024; collapsed sidebar; fixture data replaces the skeleton          |

The earlier browser run found no document-level horizontal overflow at 360×800, 390×844, 760×512 CSS viewport, or 1024×768. The 760×512 result is an emulated CSS viewport, not a native 200% browser-zoom capture. These observations predate the current candidate and were not repeated after the route-focus change.

## Permission-filtered route inventory

This inventory is from the permission-filtered navigation configuration. The earlier browser run activated every listed destination from another route and checked the URL and sole `aria-current="page"` item. Those Pass results are for the candidate before the route-focus change; they are not a current-candidate browser result.

| Sidebar destination        | Path                      | Destination fallback       | Earlier run                 |
| -------------------------- | ------------------------- | -------------------------- | --------------------------- |
| Overview                   | `/dashboard`              | Existing page skeleton     | Pass                        |
| Graph View                 | `/graph-view`             | Existing page skeleton     | Pass                        |
| Market Charts              | `/market-charts`          | Existing page skeleton     | Pass                        |
| News Articles              | `/news-articles`          | Existing page skeleton     | Pass                        |
| News Outlets               | `/news-outlets`           | Existing page skeleton     | Pass                        |
| Blogs                      | `/blogs`                  | Existing page skeleton     | Pass                        |
| Events                     | `/events`                 | Existing page skeleton     | Pass                        |
| Economic Calendar          | `/economic-calendar`      | Existing page skeleton     | Pass                        |
| AI Provider Configurations | `/ai-provider-configs`    | Existing page skeleton     | Pass                        |
| AI Task Configurations     | `/ai-task-configurations` | Existing route loading     | Pass                        |
| System Prompts             | `/system-prompts`         | Existing page skeleton     | Pass                        |
| Cronjobs                   | `/cronjobs`               | Existing page skeleton     | Pass                        |
| Telegram                   | `/telegram`               | Existing page skeleton     | Pass                        |
| Email Delivery             | `/email-delivery`         | Existing page skeleton     | Pass                        |
| Users                      | `/users`                  | Existing page skeleton     | Pass                        |
| Roles and Permissions      | `/roles`                  | New route loading skeleton | Pass; delayed data verified |
| Feedback Submissions       | `/feedback-submissions`   | Existing route loading     | Pass                        |
| Contact Requests           | `/contact-requests`       | Existing route loading     | Pass; regression states     |

The earlier run also covered the logo link to Overview, Account and Feedback History footer links, Back/Forward, grouped links, the collapsed flyout, mobile navigation, touch targets and an axe scan. Roles success, empty and denied results were included. These browser observations were not repeated on the current candidate.

| Footer or brand link | Path         | Destination fallback   | Earlier run    |
| -------------------- | ------------ | ---------------------- | -------------- |
| Signapse logo        | `/dashboard` | Overview destination   | Click; pass    |
| Account              | `/account`   | Existing route loading | Keyboard; pass |
| Feedback History     | `/feedback`  | Existing route loading | Keyboard; pass |

## Current verification status

The supported local `pnpm test:quality` suite passed on the rebased candidate: lint had 0 errors and 23 existing repository warnings, typecheck passed, 988 tests passed across 105 files, fixture consistency passed for 92 operations, and the deploy-verifier tests passed. The route-focus component test covers focus after route changes and closing the mobile sidebar before focus moves. Prettier and `git diff --check` passed for the added test.

The requested browser command was attempted four times from this issue workspace. The first three attempts stopped with exit 73, `resource_busy`. The fourth acquired the lock but stopped before tests with exit 254, `Command "test:browser" not found`:

```sh
/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/sidebar-navigation.spec.ts tests/e2e/contact-requests.spec.ts --retries=0 --workers=1
```

There is verification-source drift on current `origin/dev` (`8a2189b`): commit `e03414b` retired Playwright, removed `tests/e2e/**` and `playwright.config.ts`, and removed the `test:browser` package script. The command requested in the Jira handoff therefore has no supported test files or package script on this base. No browser tests started. The remaining observations are the 18 sidebar destinations, delayed Roles rendering and keyboard-focus state, Contact Requests regression, Back/Forward, logo/footer links, mobile behavior and refreshed screenshots. They need a current approved browser path or reassignment to the coordinator's dev acceptance check.

All browser data shown here is synthetic and local. No live API behavior or deployed UI was tested by FE.
