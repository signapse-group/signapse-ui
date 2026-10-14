import type { MarketChartCandleItemResponse } from "@/app/lib/market-charts/definitions"

export const MINUTE_MS = 60 * 1000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toMarketChartEpochMillis(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? timestamp : null
}

export function isValidMarketChartCandle(
  candle: unknown
): candle is MarketChartCandleItemResponse {
  return (
    isRecord(candle) &&
    toMarketChartEpochMillis(candle.time) !== null &&
    typeof candle.open === "number" &&
    Number.isFinite(candle.open) &&
    typeof candle.high === "number" &&
    Number.isFinite(candle.high) &&
    typeof candle.low === "number" &&
    Number.isFinite(candle.low) &&
    typeof candle.close === "number" &&
    Number.isFinite(candle.close)
  )
}

export function getCandleTimestamp(candle: unknown) {
  if (!isValidMarketChartCandle(candle)) {
    return null
  }

  return toMarketChartEpochMillis(candle.time)
}

export function normalizeCandleItems(
  candles: MarketChartCandleItemResponse[]
): MarketChartCandleItemResponse[] {
  const candlesByTime = new Map<number, MarketChartCandleItemResponse>()

  for (const candle of candles.filter(isValidMarketChartCandle)) {
    const timestamp = getCandleTimestamp(candle)

    if (timestamp !== null) {
      candlesByTime.set(timestamp, candle)
    }
  }

  return [...candlesByTime.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, candle]) => candle)
}

export function mergeCandleItems(
  current: MarketChartCandleItemResponse[],
  incoming: MarketChartCandleItemResponse[]
) {
  return normalizeCandleItems([...current, ...incoming])
}

export function getFiniteVolume(candle: MarketChartCandleItemResponse) {
  return typeof candle.volume === "number" && Number.isFinite(candle.volume)
    ? candle.volume
    : null
}

export function hasUsableVolume(
  candle: Pick<MarketChartCandleItemResponse, "volume"> | null | undefined
) {
  return typeof candle?.volume === "number" && Number.isFinite(candle.volume)
}

export function hasUsableVolumeData(
  candles: Pick<MarketChartCandleItemResponse, "volume">[] | null | undefined
) {
  return Boolean(candles?.some(hasUsableVolume))
}

export interface CreateKLineDataItem {
  [key: string]: unknown
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export function createKLineData(
  candles: MarketChartCandleItemResponse[]
): CreateKLineDataItem[] {
  return normalizeCandleItems(candles).flatMap((candle) => {
    const timestamp = getCandleTimestamp(candle)
    const volume = getFiniteVolume(candle)

    if (timestamp === null) {
      return []
    }

    return [
      {
        timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        ...(volume !== null ? { volume } : {}),
      },
    ]
  })
}
