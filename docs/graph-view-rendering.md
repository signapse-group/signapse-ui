# Graph View rendering

The protected `/[lang]/graph-view` route uses Sigma for rendering and a d3-force worker for layout. Route components, picking and label policies live in `app/[lang]/(main)/graph-view/`.

The page retains graph read permission checks, workspace identity checks, watchlist-aware empty states and the shared entity quick-detail drawer. Normal development and production always use workspace data. The `edges` fixture query is honored only by the explicit P0 fixture environment; it cannot switch a normal workspace page to synthetic data.

The former Sigma demo and G6 baseline routes, G6 renderer/workbench and comparative benchmark suites have been removed. `@antv/g6` and the unused `@react-sigma/core` wrapper are no longer dependencies. Sigma is used directly. Graphology, Sigma and d3-force remain required.

Focused regression coverage:

- `tests/core/graph-view-page.test.ts`: permissions and fixture isolation.
- `tests/core/graph-view-{demo,node-labels,edge-picking}.test.ts`: graph attributes, labels and picking.
- `tests/components/graph-view-sigma-drag.component.test.tsx`: interaction and cancellation behavior.
- `tests/components/graph-node-inspector-metadata.component.test.tsx`: inspector content.
- `tests/e2e/graph-view-sigma-workspace.spec.ts` and the graph case in `quick-detail.spec.ts`: fixture browser flows targeting the canonical route.

Migration verification on 2026-10-29 reuses the accepted demo behavior contract. Live workspace acceptance remains with the user; local fixture evidence does not claim backend or account coverage.

The migration passed 38 focused unit/component tests, TypeScript, focused ESLint and 22 standalone browser scenarios using the relocated Sigma renderer and real worker. Browser coverage includes desktop, Compact, mobile, dark mode, overlapping relations, mouse and touch. The canonical route returned the expected sign-in redirect without a session. The standalone harness does not exercise the full Next shell, Clerk session or live backend; no production build or deployment was performed.
