import type { Chart, Crosshair } from "klinecharts"

export function clearMarketChartCrosshair(chart: Chart | null) {
  if (!chart) return

  // KLineCharts 10.0.0 clears its store crosshair on null, though its type omits null.
  chart.executeAction("onCrosshairChange", null as unknown as Crosshair)
}
