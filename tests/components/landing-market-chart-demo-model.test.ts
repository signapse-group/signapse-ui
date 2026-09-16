import { describe, expect, it } from "vitest"

import {
  MARKET_CHART_DEMO_DURATION,
  MARKET_CHART_DEMO_FINAL_FRAME,
  MARKET_CHART_TICK_INTERVAL,
  getMarketChartDemoFrame,
  getMarketChartOutcomeCount,
  getMarketChartTickTime,
} from "@/app/[lang]/landing-market-chart-demo-model"

describe("Market Chart automatic timeline", () => {
  it("shows the forecast before revealing its price outcome", () => {
    expect(getMarketChartDemoFrame(10).phase).toBe("annotationReady")
    expect(getMarketChartDemoFrame(14).phase).toBe("detailOpen")
    expect(getMarketChartOutcomeCount(18.99)).toBe(0)
    expect(getMarketChartOutcomeCount(19)).toBe(1)
    expect(getMarketChartOutcomeCount(21)).toBe(2)
    expect(getMarketChartOutcomeCount(24)).toBe(3)
    expect(getMarketChartDemoFrame(MARKET_CHART_DEMO_DURATION)).toBe(
      MARKET_CHART_DEMO_FINAL_FRAME
    )
  })

  it("holds each simulated market price for one 500ms tick", () => {
    expect(MARKET_CHART_TICK_INTERVAL).toBe(0.5)
    expect(getMarketChartTickTime(0.49)).toBe(0)
    expect(getMarketChartTickTime(0.5)).toBe(0.5)
    expect(getMarketChartTickTime(0.99)).toBe(0.5)
    expect(getMarketChartTickTime(1)).toBe(1)
  })
})
