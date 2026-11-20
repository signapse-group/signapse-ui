# SIGN-647 Market Chart layout and readout evidence

The accepted source is the active 20 November 2026 design on [SIGN-121](https://signapse-group.atlassian.net/browse/SIGN-121), attachments 10294–10296. The local browser renders below use synthetic fixture candles and quotes. They show layout and formatting only; they do not verify live API behavior or coordinator acceptance.

| SIGN-121 PNG source                                            | Local render                                                           | Render context                                           | Compared detail                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Attachment 10294, `SIGN-121-Market-Chart-Wide-20261120.png`    | [Wide](market-chart-wide-dark-en-1520x1024-verified.png)               | 1520×1024, dark, English, expanded sidebar               | Full chart frame, shell spacing, toolbar placement, axes/footer, top-left legend order |
| Attachment 10295, `SIGN-121-Market-Chart-Compact-20261120.png` | [Compact](market-chart-compact-dark-en-1024x768-verified.png)          | 1024×768, dark, English, collapsed sidebar               | Compact shell, frame edges, toolbar placement, axes/footer, legend fit                 |
| Attachment 10296, `SIGN-121-Market-Chart-Mobile-20261120.png`  | [Mobile](market-chart-mobile-dark-en-390x844-verified.png)             | 390×844, dark, English, mobile shell                     | Chart frame, readout wrapping, axes/footer visibility                                  |
| Local Responsive Contract, 360px                               | [Small mobile](market-chart-small-mobile-dark-en-360x800-verified.png) | 360×800, dark, English                                   | Readout wrapping and no page-level horizontal overflow                                 |
| Local Responsive Contract, effective 760px                     | [760×512](market-chart-effective-width-760x512-dark-en-verified.png)   | 760×512 CSS viewport, dark, English                      | Readout reflow, axes/footer and page overflow                                          |
| Local Responsive Contract, native browser zoom 200%            | [200% zoom](market-chart-browser-zoom-200-dark-en-verified.png)        | 1520×1024 display, dark, English, actual Chrome tab zoom | Readout fit, axes/footer and page overflow at effective 760px CSS width                |

The frame follows the current application shell. The chart toolbar sits above the plot, drawing tools stay on the left, and chart footer remains inside the frame. The native KLine legend displays time and volume before O/H/L/C; at 390px and 360px the OHLC values reflow and remain readable. The accessible status keeps full parameter names.

For the native 200% capture, Chrome reported `innerWidth=760`, `devicePixelRatio=2`, and CDP `cssVisualViewport.zoom=2`; `document.documentElement.scrollWidth` stayed at or below 760. The screenshot was captured at device scale, and the full legend remained inside the chart canvas. This is an actual browser zoom check; the separate 760×512 screenshot is a CSS viewport check.

The linked Planning Responsive Contract URL returned HTTP 404 during this run. The equivalent versioned FE execution contract in [`docs/design/DESIGN.md`](../../DESIGN.md#responsive-contract) supplied the local viewport checks.

## Local verification

- `pnpm exec vitest run tests/market-chart/market-chart-helpers.test.ts` — 39/39 passed, covering format, timeframe, precision, zero/missing volume, and zoom sizing.
- `pnpm typecheck` — passed.
- Focused Playwright through `/opt/apps/symphony/runtime/run-fe-browser` — 6/6 passed for responsive readout, toolbar and keyboard inspection, narrow layout, history states, quote freshness, and error/retry.
- Separate Chrome capture at actual 200% tab zoom — readout, axes and footer stayed inside the chart at 760px effective CSS width; no page-level horizontal overflow.
- Focused ESLint — 0 errors and 11 warnings in `market-chart-canvas.tsx`. Focused Prettier and `git diff --check` — passed.
- Current-head PR `Verify / check` passed on rerun after one initial run failed in a calendar-loading text assertion; the isolated test passed locally and the full rerun passed. Current Vercel Preview for `signapse-ui` is READY.

All browser renders use local synthetic candle and quote fixtures. No live feature/API test was run. The coordinator owns live dev acceptance and delivery revision verification after review and merge.
