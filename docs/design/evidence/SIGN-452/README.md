# SIGN-452 Market Chart loading evidence

## Accepted direction and candidate

The accepted source is the current Market Chart and its established loading, error and retry patterns, as referenced by [SIGN-451](https://signapse-group.atlassian.net/browse/SIGN-451). No approved PNG applies to this state. The source chart surface at the current assigned base is [`market-chart-workbench.tsx`](https://github.com/signapse-group/signapse-ui/blob/8fddfc03752ce120f1c35fa5389a1793043d6f8b/app/%5Blang%5D/%28main%29/market-charts/market-chart-workbench.tsx). The candidate preserves that workbench layout and controls; the screenshots show candles and the existing event marker while the independent historical calendar request has failed and can be retried.

Implementation code revision: [`ef8e89c9e1dd526f16527f7be1e72793c1a761b1`](https://github.com/signapse-group/signapse-ui/commit/ef8e89c9e1dd526f16527f7be1e72793c1a761b1), rebased onto current `origin/dev` [`8fddfc03752ce120f1c35fa5389a1793043d6f8b`](https://github.com/signapse-group/signapse-ui/commit/8fddfc03752ce120f1c35fa5389a1793043d6f8b). The local fixture-backed browser check regenerated these captures from the rebased candidate. They show Vietnamese copy, retained candles and annotations, independent calendar retry states, and light and dark themes.

- Wide, expanded sidebar, 1520×1024: [candidate render](calendar-error-wide-light-1520x1024.png)
- Compact, collapsed sidebar, 1024×768: [candidate render](calendar-error-compact-1024x768.png)
- Mobile, sidebar closed, 390×844: [candidate render](calendar-error-mobile-390x844.png)
- Small mobile, sidebar closed, 360×800: [candidate render](calendar-error-small-mobile-360x800.png)
- Effective CSS viewport 760×512, equivalent layout width at 200% of 1520×1024: [candidate render](calendar-error-effective-760x512.png)
- Dark theme, effective CSS viewport 760×512, keyboard focus on history retry: [candidate render](calendar-error-dark-760x512.png)

Both 760×512 captures use effective-width simulation, not browser-native zoom. The host Playwright runner is headless and did not apply browser zoom shortcuts, so native 200% zoom remains unverified. The coordinator accepted continuing with that specific limitation. At 760×512, the fixture check found no page-level horizontal overflow and kept the history retry and event marker visible. Light and dark error and retry text each passed the local 4.5:1 contrast check; the dark screenshot shows keyboard focus on the history retry. The browser case also checks that Enter sends a retry request, the status uses `role="status"`, and the failure remains independently recoverable. No chart geometry, event-layer ordering, URL selection or interaction pattern was redesigned.

## Local verification

The focused component checks use deferred supplement responses, failures/retries and out-of-order asset/timeframe/filter responses. They cover immediate valid candles, independent annotation/calendar status, stale-response guards, and sparse 1h backfill with one received 07:00 candle: annotations query `[07:00,10:00)`, calendar history query `[07:00,08:00)`, the 09:00 annotation is merged, and the 10:00 boundary annotation appears once with its source timestamp. A rapid HIGH → HIGH+MEDIUM → MEDIUM filter change confirms that the final request covers every selected impact and stale responses do not add events.

The same controlled component fixture records the time from the candle response resolving until the candle DOM marker is visible while both supplemental promises remain pending. A matched local run on the original base `3278deb69bc417da5dfbc2681e8d75046a909cd9` and candidate `fb4a78f6e7dc869d081728bdf3a114b495f4fbda` measured **203.8 ms** and **38.6 ms**, respectively. After rebasing onto current `origin/dev`, the same fixture measured **45.0 ms** on the candidate, with `supplements_pending_at_paint=true`. Each figure is a single JSDOM/component-fixture observation, not browser paint or production latency; the original pair is not a repeated median and does not establish a live dev improvement. No latency threshold was applied.

Focused checks on the rebased candidate: the Market Chart component suite passed **17 tests**. The locked host browser wrapper passed the calendar failure/retry render check (**1 passed, 40.5 s**) and delayed asset/timeframe selection race (**1 passed, 19.0 s**). The calendar case checked 1520×1024, 1024×768, 390×844, 360×800 and effective 760×512 widths; error/retry text contrast in light and dark themes; visible keyboard focus; `role="status"`; Enter retry request; retained candles/annotations; and independent recovery. Typecheck, targeted ESLint/Prettier and `git diff --check` passed; the offline contract guard passed fixture consistency for **88 operations**. These checks use local API fixtures and do not call live feature APIs.

Commands:

- `pnpm exec vitest run tests/components/market-chart-workbench-live-candles.component.test.tsx`
- `pnpm typecheck`
- `pnpm exec eslint "app/[lang]/(main)/market-charts/market-chart-workbench.tsx" "app/[lang]/(main)/market-charts/market-chart-candle-client.ts" app/api/market-charts/candles/route.ts tests/components/market-chart-workbench-live-candles.component.test.tsx tests/e2e/market-chart.spec.ts`
- `pnpm exec prettier --check "app/[lang]/(main)/market-charts/market-chart-workbench.tsx" "app/[lang]/(main)/market-charts/market-chart-candle-client.ts" app/api/market-charts/candles/route.ts tests/components/market-chart-workbench-live-candles.component.test.tsx tests/e2e/market-chart.spec.ts docs/design/evidence/SIGN-452/README.md && git diff --check`
- `pnpm test:contract`
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/market-chart.spec.ts --grep 'shows calendar errors without discarding candle or annotation data'`
- `/opt/apps/symphony/runtime/run-fe-browser "$PWD" tests/e2e/market-chart.spec.ts --grep 'allows changing asset while the prior candle request is pending'`

## API reference and limits

The published dev OpenAPI at `https://dev-api.signapse.cloud/v3/api-docs` was fetched on **2026-11-20 07:07:49 UTC**, producer revision `3c48b821e7809b7744fedee65ce34ac241009591`. Candle count-back uses an exclusive `to`; annotations and economic-calendar history use `[from,to)`; repeated calendar impact filters are supported; all three operations require `market-chart:read`. No producer or business contract change was made.

No live feature test or dev before/after measurement was performed. The coordinator owns live dev checks and five-run, cache-separated measurements for opening the chart, changing asset and changing timeframe, plus realtime, event-layer, rapid-selection and annotation-backfill checks. The coordinator decides whether the observed improvement is sufficient. First-candle readiness still depends on the candle endpoint response and chart rendering, so provider latency remains unmeasured. Native browser zoom was unavailable in the headless runner; the coordinator can verify it in a desktop browser if needed.

Current-head `Verify / check` and Vercel Preview must pass before In Review. The reviewer owns merge, dev delivery and live revision verification.
