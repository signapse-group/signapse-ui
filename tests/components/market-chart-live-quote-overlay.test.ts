import type { Chart, Overlay } from "klinecharts"
import { describe, expect, it, vi } from "vitest"

import {
  MARKET_CHART_LIVE_QUOTE_OVERLAY_GROUP_ID,
  syncMarketChartLiveQuoteOverlay,
} from "@/app/[lang]/(main)/market-charts/market-chart-live-quote-overlay"

function createChart(overlays: Overlay[] = []) {
  const getOverlays = vi.fn<Chart["getOverlays"]>(() => overlays)
  const createOverlay = vi.fn<Chart["createOverlay"]>(() => "quote-overlay")
  const overrideOverlay = vi.fn<Chart["overrideOverlay"]>(() => true)
  const removeOverlay = vi.fn<Chart["removeOverlay"]>(() => true)

  return {
    chart: {
      createOverlay,
      getOverlays,
      overrideOverlay,
      removeOverlay,
    } as unknown as Chart,
    createOverlay,
    getOverlays,
    overrideOverlay,
    removeOverlay,
  }
}

describe("market chart live quote overlay", () => {
  it("creates a Y-axis simpleTag at the quote price, independent of candle values", () => {
    const { chart, createOverlay } = createChart()

    syncMarketChartLiveQuoteOverlay(chart, {
      color: "#2563eb",
      label: "4,245.50",
      price: 4245.5,
    })

    expect(createOverlay).toHaveBeenCalledWith({
      extendData: "4,245.50",
      groupId: MARKET_CHART_LIVE_QUOTE_OVERLAY_GROUP_ID,
      lock: true,
      name: "simpleTag",
      points: [{ value: 4245.5 }, { value: 4245.5 }],
      styles: {
        line: { color: "#2563eb", size: 1, style: "dashed" },
        text: { color: "#2563eb" },
      },
    })
  })

  it("updates the existing quote overlay in place and removes it when there is no quote", () => {
    const existing = { id: "quote-overlay" } as Overlay
    const { chart, createOverlay, overrideOverlay, removeOverlay } =
      createChart([existing])

    syncMarketChartLiveQuoteOverlay(chart, {
      color: "#737373",
      label: "4,246.25",
      price: 4246.25,
    })

    expect(createOverlay).not.toHaveBeenCalled()
    expect(overrideOverlay).toHaveBeenCalledWith({
      extendData: "4,246.25",
      groupId: MARKET_CHART_LIVE_QUOTE_OVERLAY_GROUP_ID,
      id: "quote-overlay",
      lock: true,
      name: "simpleTag",
      points: [{ value: 4246.25 }, { value: 4246.25 }],
      styles: {
        line: { color: "#737373", size: 1, style: "dashed" },
        text: { color: "#737373" },
      },
    })

    syncMarketChartLiveQuoteOverlay(chart, null)

    expect(removeOverlay).toHaveBeenCalledWith({
      groupId: MARKET_CHART_LIVE_QUOTE_OVERLAY_GROUP_ID,
    })
  })
})
