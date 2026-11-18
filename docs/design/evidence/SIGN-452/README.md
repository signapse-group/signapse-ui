# SIGN-452 Market Chart loading evidence

## Accepted direction and candidate

The accepted source is the current Market Chart and its established loading, error and retry patterns, as referenced by [SIGN-451](https://signapse-group.atlassian.net/browse/SIGN-451). No approved PNG applies to this state. The source chart surface at the assigned base revision is [`market-chart-workbench.tsx`](https://github.com/signapse-group/signapse-ui/blob/3278deb69bc417da5dfbc2681e8d75046a909cd9/app/%5Blang%5D/%28main%29/market-charts/market-chart-workbench.tsx). The candidate preserves that workbench layout and controls; the screenshots show candles and the existing event marker while the independent historical calendar request has failed and can be retried.

Implementation candidate: [`d5c665ac44b1d66ec6694a01dfbc399cda655bff`](https://github.com/signapse-group/signapse-ui/commit/d5c665ac44b1d66ec6694a01dfbc399cda655bff), based on `origin/dev` at [`3278deb69bc417da5dfbc2681e8d75046a909cd9`](https://github.com/signapse-group/signapse-ui/commit/3278deb69bc417da5dfbc2681e8d75046a909cd9). The captures were regenerated from this candidate by the local fixture-backed Market Chart browser check, using Vietnamese copy and the light theme. The historical-calendar and future-event retry surfaces are both visible in context.

- Wide, expanded sidebar, 1520×1024: [candidate render](calendar-error-wide-light-1520x1024.png)
- Compact, collapsed sidebar, 1024×768: [candidate render](calendar-error-compact-1024x768.png)
- Mobile, sidebar closed, 390×844: [candidate render](calendar-error-mobile-390x844.png)
- Small mobile, sidebar closed, 360×800: [candidate render](calendar-error-small-mobile-360x800.png)
- Effective CSS viewport 760×512, equivalent layout width at 200% of 1520×1024, sidebar collapsed: [candidate render](calendar-error-effective-760x512.png)

The 760×512 case is an effective-width viewport simulation, not browser-native zoom. The fixture check confirmed no page-level horizontal overflow and that the history retry and existing event marker remained visible; the future-event retry is exercised independently in the browser test. The event marker and candle/quote keyboard and accessible descriptions are also covered by the responsive chart browser check. No chart geometry, event-layer ordering, URL selection or interaction pattern was redesigned.

## Local verification

The focused component checks use deferred supplement responses, failures/retries and out-of-order asset/timeframe/filter responses. They cover immediate valid candles, independent annotation/calendar status, stale-response guards, and sparse 1h backfill with one received 07:00 candle: annotations query `[07:00,10:00)`, calendar history query `[07:00,08:00)`, the 09:00 annotation is merged, and the 10:00 boundary annotation appears once with its source timestamp. A rapid HIGH → HIGH+MEDIUM → MEDIUM filter change also confirms the final request covers every selected impact and stale responses do not add events.

The same controlled component fixture records the time from the candle response resolving until the candle DOM marker is visible while both supplemental promises remain pending. The legacy wait-all implementation at base `3278deb69bc417da5dfbc2681e8d75046a909cd9` measured **203.8 ms** in one local baseline run; candidate `d5c665ac44b1d66ec6694a01dfbc399cda655bff` measured **37.1 ms**. These are one-run JSDOM/component-fixture observations, not browser paint or production latency; rerun results vary and do not establish a live dev improvement.

Final focused checks on the candidate: the Market Chart component suite passed **17 tests**; `pnpm typecheck`, targeted ESLint, Prettier check and `git diff --check` passed. The locked host browser wrapper ran three selected cases in **34.7 seconds**: responsive quote/candle, responsive toolbar and keyboard candle inspection, and calendar failure with independent retries. All three passed. The browser checks use local API fixtures and do not call live feature APIs.

Commands:

- `pnpm exec vitest run tests/components/market-chart-workbench-live-candles.component.test.tsx`
- `pnpm typecheck`
- `pnpm exec eslint "app/[lang]/(main)/market-charts/market-chart-workbench.tsx" tests/components/market-chart-workbench-live-candles.component.test.tsx tests/e2e/market-chart.spec.ts`
- `pnpm exec prettier --check "app/[lang]/(main)/market-charts/market-chart-workbench.tsx" tests/components/market-chart-workbench-live-candles.component.test.tsx tests/e2e/market-chart.spec.ts docs/design/evidence/SIGN-452/README.md && git diff --check`
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/market-chart.spec.ts --grep 'renders a quote-updated native candle across responsive viewports|shows calendar errors without discarding candle or annotation data|shows the responsive toolbar and supports keyboard candle inspection' --retries=0`

## Limits and handoff

The source API contract was fetched from the published dev OpenAPI at `https://dev-api.signapse.cloud/v3/api-docs` on **2026-11-18 04:43:46 UTC**, producer revision `7d666dead7544a46acc44a28326f12c62f3b3bf6`. The current candle contract uses an exclusive `to` cutoff; annotations and economic-calendar events use `[from,to)` ranges, and calendar events accept repeated impact filters. No producer or business contract change was made.

No live feature test or dev before/after measurement was performed. The coordinator owns live dev checks for open, asset change and timeframe change, including real-time data, event layers, rapid selection/filter changes and annotation backfill boundaries. After removing the supplement wait, first-candle readiness still depends on the candle endpoint response and chart rendering; upstream/provider latency remains the main unmeasured limit. Browser-native 200% zoom and dark-theme rendering were not included in this focused evidence set; the 760×512 image is an effective-width simulation.

Current-head `Verify / check` and Vercel Preview must pass before In Review. The coordinator owns live dev measurements and feature checks after merge.
