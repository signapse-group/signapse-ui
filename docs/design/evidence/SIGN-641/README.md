# SIGN-641 Graph time-range render evidence

These candidate renders use the local P0 fixture. Its Graph data is synthetic; it does not prove live API integration, real authorization, or QA acceptance. The UI renders and checks below were produced from the working tree for PR #144.

## Accepted design comparison

The approved source is [SIGN-639](https://signapse-group.atlassian.net/browse/SIGN-639): attachment **10280**, `graph-time-filter-wide.png`, and attachment **10279**, `graph-time-filter-mobile-empty.png`. Both images were downloaded from Jira and inspected. The wide reference is 1520×1024 with the selector beside the Graph title and the sidebar expanded. The mobile reference is 390×844 with the three range choices above the empty state and the sidebar closed.

| Source                    | Candidate render                                                                                   | Viewport, state, theme, sidebar                    |
| ------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| SIGN-639 attachment 10280 | [Wide, dark, English](graph-time-range-wide-dark-en-1520x1024.png)                                 | 1520×1024; populated Graph; expanded sidebar       |
| SIGN-639 attachment 10280 | [Wide, light, English](graph-time-range-wide-light-en-1520x1024.png)                               | 1520×1024; populated Graph; expanded sidebar       |
| SIGN-639 attachment 10280 | [Wide, dark, Vietnamese](graph-time-range-wide-dark-vi-1520x1024.png)                              | 1520×1024; populated Graph; expanded sidebar       |
| SIGN-639 attachment 10279 | [Mobile empty, light, English](graph-time-range-empty-mobile-light-en-390x844.png)                 | 390×844; selector closed at 7 days; sidebar closed |
| SIGN-639 attachment 10279 | [Mobile empty, light, English, menu open](graph-time-range-empty-menu-mobile-light-en-390x844.png) | 390×844; all three choices visible; sidebar closed |
| SIGN-639 attachment 10279 | [Mobile empty, dark, English, menu open](graph-time-range-empty-menu-mobile-dark-en-390x844.png)   | 390×844; all three choices visible; sidebar closed |

The selector stays beside the Graph title on wide screens and above the empty-state card on mobile. The bottom legend keeps its grouping and leaves room for the fixed Ask Signapse launcher. The current P0 run also checked 360, 390, 760×512 (effective 200% zoom), 767, 768, 1024, 1439, 1440 and 1520 CSS-pixel widths for reflow and page overflow.

The [previous wide light Vietnamese render](graph-time-range-wide-light-vi-1520x1024.png) is retained as historical evidence from candidate `72bb7fc`; it predates the legend inset adjustment and is not used for the current comparison.

## Producer contract

Fetched `https://dev-api.signapse.cloud/v3/api-docs` for dev at `2026-11-20T13:43:48.292Z`; `x-build-revision` was `765059683b3b265ce101823765d9cc5f9495e0f4`. `GET /graph-view` accepts optional integer `days` with default 7 and enum `[7, 14, 30]`. HTTP 200 with empty `nodes` and `edges` is a successful empty graph. The operation declares 400, 401, 403, 409, 500 and 503 responses. Its 409 response has no description or schema; the FE uses the generic load-error state unless the workspace identity check identifies a workspace change.

The OpenAPI descriptions say `GraphNode.secondaryLabel`, fields in `GraphNodeMetadata`, and `GraphEdge.weight`, `confidence` and `note` can be null, but those schemas do not mark the properties nullable. The FE consumer schema follows the described null behavior. This producer schema discrepancy is included in the PR handoff for SIGN-640 follow-up; the local structural guard does not validate nullability semantics.

## Local verification

- `pnpm exec vitest run tests/api/graph-view-action.test.ts tests/components/graph-view-panel.component.test.tsx tests/core/graph-view-page.test.ts` — 3 files, 19 tests passed.
- `API_BASE_URL=https://dev-api.signapse.cloud pnpm test:contract -- --live --scope 'GET /graph-view'` — live OpenAPI structural check passed for 1 operation at `2026-11-20T13:46:05Z`.
- Focused ESLint and Prettier checks passed for the changed Graph component and time-range P0 spec.
- Selected P0 scope: the time-range spec plus workspace, permission, empty, load-error, missing-workspace and stale-workspace-response cases in `tests/e2e/graph-view-sigma-workspace.spec.ts`. It covers default/reload, 7/14/30 selection, request query, keyboard focus/selection, touch selection, English/Vietnamese, responsive layout and the documented Graph states.
- Exact P0 command:

  ```sh
  /opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/graph-view-time-range.spec.ts tests/e2e/graph-view-sigma-workspace.spec.ts --grep 'Graph View time range works across responsive|Sigma workspace graph keeps its watchlist context|Sigma workspace graph preserves graph permission|live Graph View distinguishes empty watchlist from empty graph|live Graph View keeps permission, transport and schema failures distinct|Graph View asks for a workspace when none is selected|Graph View drops a delayed response from the previous workspace|Graph View clears the prior selection after switching workspaces' --retries=0
  ```

- The final selected P0 run passed **16/16**. The first run exposed a real overlap between the wide bottom legend and the fixed launcher at 1440px and 1520px; the legend inset was adjusted, and both widths passed on rerun. The menu screenshot waits for the open animation to finish so the dark render reflects the usable state.

No live Graph feature test was run. QA/coordinator owns live UI, permission and FE/BE acceptance on dev under SIGN-643.
