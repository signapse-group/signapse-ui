// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest"

import { createMarketChartInitialLoadObserver } from "@/app/[lang]/(main)/market-charts/market-chart-initial-load-observability"
import type { ClientPerformanceMeasurement } from "@/app/lib/observability/client"

describe("Market Chart initial-load observability", () => {
  it("reports committed data readiness once without claiming paint", () => {
    const finish = vi.fn()
    const start = vi.fn((): ClientPerformanceMeasurement => ({ finish }))
    const observer = createMarketChartInitialLoadObserver(start)

    observer.start(1)
    observer.finish(1, "success")
    observer.finish(1, "success")

    expect(start).toHaveBeenCalledWith("signapse.market_chart.initial_load", {
      feature: "market_chart",
    })
    expect(finish).toHaveBeenCalledOnce()
    expect(finish).toHaveBeenCalledWith("success")
    expect(JSON.stringify(start.mock.calls)).not.toMatch(
      /paint|assetId|timeframe/
    )
  })

  it("classifies failures and stale generations", () => {
    const finishes: string[] = []
    const start = vi.fn((): ClientPerformanceMeasurement => ({
      finish(outcome) {
        finishes.push(outcome)
      },
    }))
    const observer = createMarketChartInitialLoadObserver(start)

    observer.start(1)
    observer.start(2)
    observer.finish(1, "success")
    observer.finish(2, "error")

    expect(finishes).toEqual(["stale", "error"])
  })

  it("binds a preloaded attempt to the workbench generation without restarting it", () => {
    const finish = vi.fn()
    const start = vi.fn((): ClientPerformanceMeasurement => ({ finish }))
    const observer = createMarketChartInitialLoadObserver(start)

    observer.start(0)

    expect(observer.adopt(3)).toBe(true)
    observer.finish(0, "success")
    observer.finish(3, "success")

    expect(start).toHaveBeenCalledOnce()
    expect(finish).toHaveBeenCalledOnce()
    expect(finish).toHaveBeenCalledWith("success")
  })
})
