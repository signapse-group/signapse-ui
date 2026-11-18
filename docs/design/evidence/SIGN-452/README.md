# SIGN-452 Market Chart loading evidence

## Accepted direction and candidate

The accepted source is the current Market Chart and its established loading, error and retry patterns, as referenced by [SIGN-451](https://signapse-group.atlassian.net/browse/SIGN-451). No approved PNG applies to this state. The source chart surface at the assigned base revision is [`market-chart-workbench.tsx`](https://github.com/signapse-group/signapse-ui/blob/3278deb69bc417da5dfbc2681e8d75046a909cd9/app/%5Blang%5D/%28main%29/market-charts/market-chart-workbench.tsx). The candidate preserves that workbench layout and controls; the screenshots show candles and the existing event marker while the independent historical calendar request has failed and can be retried.

Implementation candidate: [`fb4a78f6e7dc869d081728bdf3a114b495f4fbda`](https://github.com/signapse-group/signapse-ui/commit/fb4a78f6e7dc869d081728bdf3a114b495f4fbda), based on `origin/dev` at [`3278deb69bc417da5dfbc2681e8d75046a909cd9`](https://github.com/signapse-group/signapse-ui/commit/3278deb69bc417da5dfbc2681e8d75046a909cd9). The captures were regenerated from this candidate by the local fixture-backed Market Chart browser check. They show Vietnamese copy, retained candles and annotations, independent calendar retry states, and light and dark themes.

- Wide, expanded sidebar, 1520×1024: [candidate render](calendar-error-wide-light-1520x1024.png)
- Compact, collapsed sidebar, 1024×768: [candidate render](calendar-error-compact-1024x768.png)
- Mobile, sidebar closed, 390×844: [candidate render](calendar-error-mobile-390x844.png)
- Small mobile, sidebar closed, 360×800: [candidate render](calendar-error-small-mobile-360x800.png)
- Effective CSS viewport 760×512, equivalent layout width at 200% of 1520×1024, sidebar collapsed: [candidate render](calendar-error-effective-760x512.png)
- Dark theme, effective CSS viewport 760×512, keyboard focus on history retry: [candidate render](calendar-error-dark-760x512.png)

Both 760×512 captures use an effective-width viewport simulation, not browser-native zoom. The host Playwright runner is headless and did not apply browser zoom shortcuts, so native 200% browser zoom remains unverified here. At 760×512, the fixture checks found no page-level horizontal overflow and kept the history retry and event marker visible. Light and dark error and retry text each passed the local 4.5:1 contrast check; the dark screenshot shows keyboard focus on the history retry. No chart geometry, event-layer ordering, URL selection or interaction pattern was redesigned.

## Local verification

The focused component checks use deferred supplement responses, failures/retries and out-of-order asset/timeframe/filter responses. They cover immediate valid candles, independent annotation/calendar status, stale-response guards, and sparse 1h backfill with one received 07:00 candle: annotations query `[07:00,10:00)`, calendar history query `[07:00,08:00)`, the 09:00 annotation is merged, and the 10:00 boundary annotation appears once with its source timestamp. A rapid HIGH → HIGH+MEDIUM → MEDIUM filter change also confirms the final request covers every selected impact and stale responses do not add events.

The same controlled component fixture records the time from the candle response resolving until the candle DOM marker is visible while both supplemental promises remain pending. The legacy wait-all implementation at base `3278deb69bc417da5dfbc2681e8d75046a909cd9` measured **203.8 ms** in one local baseline run; candidate `fb4a78f6e7dc869d081728bdf3a114b495f4fbda` measured **38.6 ms** in one run under the same harness. These are JSDOM/component-fixture observations, not browser paint or production latency; rerun results vary and do not establish a live dev improvement.

Focused checks on the candidate: the Market Chart component suite passed **17 tests**; `pnpm typecheck`, targeted ESLint, Prettier check, `git diff --check` and `pnpm test:contract` passed. The offline contract guard checked **88 operations**. The locked host browser wrapper passed the delayed asset-switch race and the calendar failure/retry render checks. These checks use local API fixtures and do not call live feature APIs.

Commands:

- `pnpm exec vitest run tests/components/market-chart-workbench-live-candles.component.test.tsx`
- `pnpm typecheck`
- `pnpm exec eslint "app/[lang]/(main)/market-charts/market-chart-workbench.tsx" tests/components/market-chart-workbench-live-candles.component.test.tsx tests/e2e/market-chart.spec.ts`
- `pnpm exec prettier --check "app/[lang]/(main)/market-charts/market-chart-workbench.tsx" tests/components/market-chart-workbench-live-candles.component.test.tsx tests/e2e/market-chart.spec.ts docs/design/evidence/SIGN-452/README.md && git diff --check`
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/market-chart.spec.ts --grep 'renders a quote-updated native candle across responsive viewports|shows calendar errors without discarding candle or annotation data|shows the responsive toolbar and supports keyboard candle inspection' --retries=0`

## Limits and handoff

The source API contract was fetched from the published dev OpenAPI at `https://dev-api.signapse.cloud/v3/api-docs` on **2026-11-18 06:12 UTC**. It still declares candle, annotation and economic-calendar GET operations; the candle `to` cutoff is exclusive, annotations and historical calendar events use `[from,to)`, and calendar events accept repeated impact filters. The refreshed response did not expose a producer build revision. No producer or business contract change was made.

No live feature test or dev before/after measurement was performed. The coordinator owns live dev checks for open, asset change and timeframe change, including real-time data, event layers, rapid selection/filter changes and annotation backfill boundaries. After removing the supplement wait, first-candle readiness still depends on the candle endpoint response and chart rendering; upstream/provider latency remains the main unmeasured limit. Native browser zoom was unavailable in the headless host runner; the coordinator should verify the 200% zoom state on a desktop browser.

Current-head `Verify / check` and Vercel Preview must pass before In Review. The coordinator owns live dev measurements and feature checks after merge.
