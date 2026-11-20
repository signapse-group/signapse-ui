# SIGN-647 Market Chart layout and readout evidence

The approved design is the active **20 November 2026** version on [SIGN-121](https://signapse-group.atlassian.net/browse/SIGN-121). I downloaded and inspected attachments **10294–10296**. The screenshots below are local browser renders using the Market Chart fixture; fixture candle and quote values are synthetic and do not prove live API behavior or coordinator acceptance.

| Accepted source                                                | Candidate render                                                       | Render context                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Attachment 10294, `SIGN-121-Market-Chart-Wide-20261120.png`    | [Wide](market-chart-wide-dark-vi-1520x1024.png)                        | 1520×1024, dark, Vietnamese, expanded sidebar; latest candle readout |
| Attachment 10295, `SIGN-121-Market-Chart-Compact-20261120.png` | [Compact](market-chart-compact-light-vi-1024x768.png)                  | 1024×768, light, Vietnamese, collapsed sidebar                       |
| Attachment 10296, `SIGN-121-Market-Chart-Mobile-20261120.png`  | [Mobile](market-chart-mobile-dark-vi-390x844.png)                      | 390×844, dark, Vietnamese, sidebar closed                            |
| Responsive Contract, 360px check                               | [Small mobile](market-chart-small-mobile-dark-vi-360x800.png)          | 360×800, dark, Vietnamese, sidebar closed                            |
| Responsive Contract, 200% effective width check                | [Effective 200% width](market-chart-effective-200-dark-vi-760x512.png) | 760×512, dark, Vietnamese, sidebar closed                            |

The candidate screenshots retain the current shell and place the chart toolbar above the plot, drawing tools at its left, and chart footer within the chart frame. The top-left readout puts localized time and `Vol` together, then shows `O`, `H`, `L`, `C` in order. At 390px, 360px and 760×512, `Time · Vol` stays together and OHLC reflows into two readable rows. The local browser checks found no page-level horizontal overflow and kept the chart axes and footer visible at the checked widths.

The 760×512 render simulates the effective CSS viewport width of a 1520×1024 frame at 200% zoom. The host's headless Playwright runner did not apply native browser zoom, so native 200% zoom remains unverified. The linked Planning Responsive Contract URL returned HTTP 404 during this run; the equivalent, versioned FE execution contract in [`docs/design/DESIGN.md`](../../DESIGN.md#responsive-contract) supplied the viewport frames and checks.

## Local verification

- `pnpm exec vitest run tests/market-chart/market-chart-helpers.test.ts` — helper formatting, timeframe, zero/missing volume and readout checks.
- `pnpm typecheck`.
- Focused ESLint and Prettier checks for the changed Market Chart files and this evidence document; `git diff --check`.
- Focused Playwright coverage passed **6/6** cases: quote-updated readout across wide/compact/mobile/360px, keyboard inspection and pan, 760×512 effective-width reflow, chart loading skeleton, empty history, quote/request pending behavior, and candle errors/retry. These are local fixtures; no live feature test was run.

Current PR `Verify / check` and Vercel Preview evidence are required before the In Review handoff. The coordinator owns live dev acceptance and delivery revision verification after review and merge.
