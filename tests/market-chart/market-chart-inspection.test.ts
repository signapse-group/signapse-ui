import type { Chart } from "klinecharts"
import { describe, expect, it, vi } from "vitest"

import { clearMarketChartCrosshair } from "@/app/[lang]/(main)/market-charts/market-chart-inspection"

describe("market chart inspection reset", () => {
  it("clears the engine crosshair instead of assigning it to the last candle", () => {
    const executeAction = vi.fn()

    clearMarketChartCrosshair({ executeAction } as unknown as Chart)

    expect(executeAction).toHaveBeenCalledWith("onCrosshairChange", null)
    expect(executeAction).toHaveBeenCalledTimes(1)
  })
})
