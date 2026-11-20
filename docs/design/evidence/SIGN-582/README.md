# SIGN-582 Graph View node-filter evidence

The Graph View implementation is in [`1e3d74d483c052362e579fa158f9ea031a9faa6b`](https://github.com/signapse-group/signapse-ui/commit/1e3d74d483c052362e579fa158f9ea031a9faa6b), based on `origin/dev` at [`011473145ad6cc62ccf17abe68eaae0e754a22e1`](https://github.com/signapse-group/signapse-ui/commit/011473145ad6cc62ccf17abe68eaae0e754a22e1). These screenshots were rendered from that UI candidate with the fixture-backed Playwright test in `tests/e2e/graph-view-node-filters.spec.ts`.

## Accepted design sources

- [SIGN-581](https://signapse-group.atlassian.net/browse/SIGN-581) attachment **10264**, `gWTZ4.png`: four node-type controls enabled.
- [SIGN-581](https://signapse-group.atlassian.net/browse/SIGN-581) attachment **10265**, `bKy7G.png`: mobile all-off state with the controls above the recoverable empty state.
- [SIGN-257](https://signapse-group.atlassian.net/browse/SIGN-257) attachment **10078**, `syXTV.png`: compact Graph View and node-inspector baseline.

The attachment IDs and filenames were checked against the live Jira attachment lists. The approved design uses four colored type markers and eye/eye-off controls. The News Article filter uses the specific “News Article” label without changing the existing graph-node label.

## Candidate renders

| Accepted source           | Candidate render                                                                              | Viewport, state, theme and sidebar                                           | Comparison                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SIGN-581 attachment 10264 | [Wide, dark](graph-node-filters-wide-dark-en-1520x1024.png)                                   | 1520×1024; all filters on; expanded sidebar                                  | Four controls retain the approved order, type colors and visible-eye state.                                |
| SIGN-581 attachment 10264 | [Wide, light](graph-node-filters-wide-light-en-1520x1024.png)                                 | 1520×1024; all filters on; expanded sidebar                                  | Same labels and status cues remain visible in light mode.                                                  |
| SIGN-257 attachment 10078 | [Compact, dark, Event inspector](graph-node-filters-compact-inspector-dark-en-1024x768.png)   | 1024×768; all filters on; Event selected; collapsed sidebar                  | Filter controls and the existing inspector remain visible together.                                        |
| SIGN-257 attachment 10078 | [Compact, light, Event inspector](graph-node-filters-compact-inspector-light-en-1024x768.png) | 1024×768; all filters on; Event selected; collapsed sidebar                  | The selection remains legible with light surfaces.                                                         |
| SIGN-581 attachment 10265 | [Mobile, dark, all off](graph-node-filters-empty-mobile-dark-en-390x844.png)                  | 390×844; all filters off; closed sidebar                                     | The four controls stay above the empty-state response and can restore the graph.                           |
| SIGN-581 attachment 10265 | [Mobile, light, all off](graph-node-filters-empty-mobile-light-en-390x844.png)                | 390×844; all filters off; closed sidebar                                     | The same recovery path remains visible in light mode.                                                      |
| SIGN-581 attachment 10265 | [Narrow mobile, dark, all off](graph-node-filters-empty-mobile-dark-en-360x844.png)           | 360×844; all filters off; closed sidebar                                     | Controls retain 44px targets; the page has no horizontal overflow.                                         |
| SIGN-257 attachment 10078 | [Effective 200% zoom width](graph-node-filters-effective-zoom-dark-en-760x512.png)            | 760×512 effective CSS viewport from 1520×1024; Event visible; closed sidebar | Filter controls, canvas controls and interaction hint do not overlap; the page has no horizontal overflow. |
| SIGN-581 attachment 10265 | [Mobile, dark, recovered](graph-node-filters-mobile-recovered-dark-en-390x844.png)            | 390×844; Event restored; closed sidebar                                      | The graph returns after an all-off state.                                                                  |

The local fixture supplies synthetic graph data. It verifies rendered behavior and layout, not live authorization, producer integration, or QA acceptance. No Pen operation was performed; the authorized Pen Desktop MCP is unavailable on this execution host.

## Contract and checks

- Fetched `https://dev-api.signapse.cloud/v3/api-docs` on 2026-11-20 at 20:39:50 UTC. The response was HTTP 200 with `info.version=v0`; `GET /graph-view` remains `getGraphView` and returns `GraphViewResponse`. This filter change adds no endpoint, persistence, or graph request.
- The current OpenAPI response did not include an `x-build-revision` header. The earlier Survey recorded revision `765059683b3b265ce101823765d9cc5f9495e0f4` at 18:43 UTC; it is not treated as the revision of this later fetch.
- `pnpm exec vitest run tests/core/graph-view-node-filter.test.ts tests/components/graph-view-panel.component.test.tsx tests/components/graph-view-sigma-drag.component.test.tsx` — 3 files, 55 tests passed.
- `pnpm typecheck` — passed.
- Targeted ESLint and Prettier checks — passed.
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/graph-view-node-filters.spec.ts --retries=0` — 1 fixture-backed Chromium test passed. It checks filter toggles and graph-request count, visible/hidden selection and inspector behavior, Event evidence in quick detail while News Article is hidden, filter retention after closing detail, empty-state recovery, click/tap, keyboard focus and `aria-pressed`, reload and workspace-switch resets, English/Vietnamese labels, and the responsive widths 360, 390, 760×512, 767, 768, 1024, 1439, 1440 and 1520 CSS px. Scoped axe checks for the filter group pass in light and dark modes.

No live feature test was run. QA/coordinator retains live dev, permission and product-acceptance checks.
