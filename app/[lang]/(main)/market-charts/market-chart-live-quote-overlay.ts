import type { Chart, OverlayCreate } from "klinecharts"

export const MARKET_CHART_LIVE_QUOTE_OVERLAY_GROUP_ID =
  "market-chart-live-quote"

export interface MarketChartLiveQuoteOverlay {
  color: string
  label: string
  price: number
}

export function syncMarketChartLiveQuoteOverlay(
  chart: Chart,
  quote: MarketChartLiveQuoteOverlay | null
) {
  const groupId = MARKET_CHART_LIVE_QUOTE_OVERLAY_GROUP_ID
  const existing = chart.getOverlays({ groupId })[0]

  if (!quote || !Number.isFinite(quote.price)) {
    chart.removeOverlay({ groupId })
    return
  }

  const overlay: OverlayCreate = {
    extendData: quote.label,
    groupId,
    lock: true,
    name: "simpleTag",
    points: [{ value: quote.price }, { value: quote.price }],
    styles: {
      line: { color: quote.color, size: 1, style: "dashed" },
      text: { color: quote.color },
    },
  }

  if (existing) {
    chart.overrideOverlay({ ...overlay, id: existing.id })
    return
  }

  chart.createOverlay(overlay)
}
