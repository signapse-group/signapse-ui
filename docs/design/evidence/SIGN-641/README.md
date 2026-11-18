# SIGN-641 Graph time-range render evidence

These renders use the local P0 fixture. The fixture supplies synthetic Graph data and does not prove live API integration or QA acceptance.

The application renders were captured from `c404d5b`. This follow-up changes only Playwright assertions and evidence files.

## Accepted design comparison

The approved source is [SIGN-639](https://signapse-group.atlassian.net/browse/SIGN-639): attachment **10280**, `graph-time-filter-wide.png`, and attachment **10279**, `graph-time-filter-mobile-empty.png`. The wide comparison checks the selector beside the Graph title with data present. The mobile comparison checks the selected seven-day value and all three options above the empty state, including its calendar icon and border.

| Source                    | Candidate render                                                                      | Viewport, state, theme and sidebar                       |
| ------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| SIGN-639 attachment 10280 | [Wide, dark, English](graph-time-range-wide-dark-en-1520x1024.png)                    | 1520×1024; populated Graph; expanded sidebar             |
| SIGN-639 attachment 10280 | [Wide, light, Vietnamese](graph-time-range-wide-light-vi-1520x1024.png)               | 1520×1024; populated Graph; expanded sidebar             |
| SIGN-639 attachment 10279 | [Mobile empty, dark, English](graph-time-range-empty-menu-mobile-dark-en-390x844.png) | 390×844; empty Graph; selector menu open; sidebar closed |

The additional Vietnamese wide render is [dark mode, 1520×1024](graph-time-range-wide-dark-vi-1520x1024.png). The selector and selected seven-day value remain visible in the dark mobile empty state. The light mobile empty render is still pending; an older capture was excluded because it predates the candidate commit and does not show the current card/icon treatment.

## Producer contract

Fetched `https://dev-api.signapse.cloud/v3/api-docs` for dev at 2026-11-18 06:28 UTC. `x-build-revision` was `7d666dead7544a46acc44a28326f12c62f3b3bf6`. `GET /graph-view` accepts optional integer `days` in `[7, 14, 30]`, defaults to 7, and returns an empty `nodes`/`edges` graph as HTTP 200. The operation documents separate 400 workspace/range, 401 authentication, 403 Graph permission, and 500/503 service responses. The consumer action sends the selected range explicitly and validates the returned Graph schema.

## Local verification

- `pnpm exec vitest run tests/api/graph-view-action.test.ts tests/components/graph-view-panel.component.test.tsx tests/core/graph-view-page.test.ts` — 3 files, 19 tests passed.
- `API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --live --scope 'GET /graph-view'` — live OpenAPI structural check passed for 1 operation at 2026-11-18 06:30 UTC.
- Focused ESLint and Prettier checks for the two changed Playwright specs passed.
- The selected P0 scope is the time-range spec plus Graph workspace, empty/permission/error, missing-workspace and stale-workspace-response cases in `tests/e2e/graph-view-sigma-workspace.spec.ts`. It covers the default/reload, 7/14/30 requests, keyboard focus/selection, touch selection, both locales, no-workspace, Graph 403, empty watchlist vs. no Events, watchlist permission denial, errors, response order and the required responsive widths.
- Exact P0 command:

  ```sh
  /opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/graph-view-time-range.spec.ts tests/e2e/graph-view-sigma-workspace.spec.ts --grep 'Graph View time range works across responsive|Sigma workspace graph keeps its watchlist context|Sigma workspace graph preserves graph permission|live Graph View distinguishes empty watchlist from empty graph|live Graph View keeps permission, transport and schema failures distinct|Graph View asks for a workspace when none is selected|Graph View drops a delayed response from the previous workspace|Graph View clears the prior selection after switching workspaces'
  ```

- The initial P0 attempt confirmed the selector at 1520/1440px, then timed out because the workspace spec searched for the obsolete Vietnamese launcher name `Mở trợ lý AI`; the current dictionary and rendered page use `Ask Signapse`. Both stale test assertions are now corrected. The host wrapper repeatedly returned `resource_busy` after its 30-second backoff because its interrupted-session fence matches the still-active worker session. The corrected P0 run must be rerun in a fresh worker session. This evidence does not claim a P0 pass.

The responsive checks use the local [Responsive Contract](../../DESIGN.md#responsive-contract), which supplies the execution rules while the Planning reference URL is unavailable. No live Graph feature test was run; QA/coordinator owns live UI, authorization and FE/BE acceptance on dev.
