export const MARKET_CHART_DEMO_DURATION = 26
export const MARKET_CHART_TICK_INTERVAL = 0.5

export const MARKET_CHART_DEMO_TIMING = {
  live: 0,
  newsIncoming: 3,
  secondSource: 5,
  reading: 6,
  resolving: 8,
  annotationReady: 10,
  cursorSelect: 12,
  detailOpen: 14,
  outcomeStarts: 19,
  outcomePullback: 21,
  outcomeConfirmed: 24,
} as const

export type MarketChartDemoPhase = keyof typeof MARKET_CHART_DEMO_TIMING

const frames = Object.entries(MARKET_CHART_DEMO_TIMING).map(([phase, at]) => ({
  phase: phase as MarketChartDemoPhase,
  at,
}))

export function getMarketChartDemoFrame(seconds: number) {
  return frames.findLast((frame) => seconds >= frame.at) ?? frames[0]
}

export const MARKET_CHART_DEMO_FINAL_FRAME = getMarketChartDemoFrame(
  MARKET_CHART_DEMO_DURATION
)

export function getMarketChartOutcomeCount(seconds: number) {
  if (seconds < MARKET_CHART_DEMO_TIMING.outcomeStarts) return 0
  if (seconds < MARKET_CHART_DEMO_TIMING.outcomePullback) return 1
  if (seconds < MARKET_CHART_DEMO_TIMING.outcomeConfirmed) return 2
  return 3
}

export function getMarketChartTickTime(seconds: number) {
  return (
    Math.floor(seconds / MARKET_CHART_TICK_INTERVAL) *
    MARKET_CHART_TICK_INTERVAL
  )
}
