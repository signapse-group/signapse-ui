# SIGN-641 Graph time-range render evidence

The captures below are from the SIGN-641 candidate in this PR. They were rendered in the issue workspace with the local P0 fixture; the fixture returns a small synthetic graph and does not establish live API integration or QA acceptance.

## Accepted design comparison

The accepted references are [SIGN-639](https://signapse-group.atlassian.net/browse/SIGN-639) attachments **10280** (`graph-time-filter-wide.png`) and **10279** (`graph-time-filter-mobile-empty.png`). The wide comparison checks the selector beside the Graph title while graph data is present. The mobile comparison checks the selected seven-day value and all three options above the empty-state card, including its calendar icon and border.

| Source                                                           | Candidate render                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| SIGN-639, attachment 10280, Wide, dark, English, 1520×1024       | [Wide graph with seven-day selector](graph-time-range-wide-dark-en-1520x1024.png)           |
| SIGN-639, attachment 10279, Mobile empty, dark, English, 390×844 | [Mobile empty state with menu open](graph-time-range-empty-menu-mobile-dark-en-390x844.png) |

The Vietnamese wide render is included to inspect translated labels: [Wide, dark, Vietnamese, 1520×1024](graph-time-range-wide-dark-vi-1520x1024.png).

## Local checks

The focused browser case is `tests/e2e/graph-view-time-range.spec.ts`, run through the host fixture wrapper:

```sh
/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/graph-view-time-range.spec.ts
```

It verifies the seven-day default on a fresh page load and after reload, keyboard focus and selection of 14 days, touch selection of 30 days, the producer query for each selection, both locales, and no horizontal overflow or clipped empty-state card at 1520, 1440, 1439, 1024, 768, 767, 760 (200% effective width), 390 and 360 CSS pixels. Mobile trigger and option targets measured at least 44px tall.

The selected empty/permission, missing-workspace and workspace-change cases in `tests/e2e/graph-view-sigma-workspace.spec.ts` also passed through the same host wrapper. Vitest action and component coverage includes query validation, workspace changes and out-of-order responses.

P0 is fixture-only. QA/coordinator still owns live Graph API, authorization, persistence and feature acceptance on dev.
