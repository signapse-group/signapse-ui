import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

globalThis.window = {
  navigator: { userAgent: "" },
} as typeof globalThis.window

const { isMarketChartTimeframe } = await import(
  "../app/lib/market-charts/definitions" + ".ts"
)
const { createKLinePeriod } = await import(
  "../app/[lang]/(main)/market-charts/market-chart-period" + ".ts"
)

assert.equal(isMarketChartTimeframe("4h"), true)
assert.deepEqual(createKLinePeriod("4h"), { type: "hour", span: 4 })

const historySource = await readFile(
  new URL(
    "../app/[lang]/(main)/market-charts/market-chart-history-helpers.ts",
    import.meta.url
  ),
  "utf8"
)

assert.match(historySource, /"4h": 4 \* HOUR_MS,/)
assert.match(historySource, /"4h": 14,/)

console.log("Market chart 4h checks passed")
