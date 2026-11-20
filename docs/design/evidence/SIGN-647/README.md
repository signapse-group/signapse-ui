# SIGN-647 Market Chart layout and readout evidence

The accepted source is the active 20 November 2026 design on [SIGN-121](https://signapse-group.atlassian.net/browse/SIGN-121), attachments 10294–10296. The local browser renders below use synthetic fixture candles and quotes. They show layout and formatting only; they do not verify live API behavior or coordinator acceptance.

| Design source                        | Local render                                                           | Render context                                           |
| ------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Wide, attachment 10294               | [Wide](market-chart-wide-dark-en-1520x1024-verified.png)               | 1520×1024, dark, English, expanded sidebar               |
| Compact, attachment 10295            | [Compact](market-chart-compact-dark-en-1024x768-verified.png)          | 1024×768, dark, English, collapsed sidebar               |
| Mobile, attachment 10296             | [Mobile](market-chart-mobile-dark-en-390x844-verified.png)             | 390×844, dark, English, mobile shell                     |
| Responsive Contract, 360px           | [Small mobile](market-chart-small-mobile-dark-en-360x800-verified.png) | 360×800, dark, English                                   |
| Responsive Contract, effective 760px | [760×512](market-chart-effective-width-760x512-dark-en-verified.png)   | 760×512 CSS viewport, dark, English                      |
| Native browser zoom 200%             | [200% zoom](market-chart-browser-zoom-200-dark-en-verified.png)        | 1520×1024 display, dark, English, actual Chrome tab zoom |

The frame follows the current application shell. The chart toolbar sits above the plot, drawing tools stay on the left, and chart footer remains inside the frame. The native KLine legend displays time and volume before O/H/L/C; at 390px and 360px the OHLC values reflow and remain readable. The accessible status keeps full parameter names.

For the native 200% capture, Chrome reported `innerWidth=760`, `devicePixelRatio=2`, and CDP `cssVisualViewport.zoom=2`; `document.documentElement.scrollWidth` stayed at or below 760. The screenshot was captured at device scale, and the full legend remained inside the chart canvas. This is an actual browser zoom check; the separate 760×512 screenshot is a CSS viewport check.

The linked Planning Responsive Contract URL returned HTTP 404 during this run. The equivalent versioned FE execution contract in [`docs/design/DESIGN.md`](../../DESIGN.md#responsive-contract) supplied the local viewport checks.

## Local verification

- `pnpm exec vitest run tests/market-chart/market-chart-helpers.test.ts` — formatting, timeframe, precision, and zero/missing volume.
- `pnpm typecheck`.
- Focused Playwright checks through `/opt/apps/symphony/runtime/run-fe-browser`, including responsive reflow, chart states, native legend, and actual 200% Chrome zoom.
- Focused ESLint, Prettier, and `git diff --check` for the changed files. ESLint reports 11 existing hook/import warnings in `market-chart-canvas.tsx` and no errors.

Current PR CI and Vercel Preview checks are required before the In Review handoff. The coordinator owns dev acceptance and delivery revision verification after review and merge.
