import type { MarketChartCandleItemResponse } from "@/app/lib/market-charts/definitions"
import type {
  MarketChartLiveQuoteResponse,
  MarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import { getMarketChartCandleBucketStartTimestamp } from "@/app/lib/market-charts/candle-boundaries"

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

export function getMarketChartWarmBandPriceRange({
  candles,
  endTime,
  startTime,
}: {
  candles: MarketChartCandleItemResponse[]
  endTime: string
  startTime: string
}) {
  const from = Date.parse(startTime)
  const to = Date.parse(endTime)

  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return null
  }

  let high = Number.NEGATIVE_INFINITY
  let low = Number.POSITIVE_INFINITY

  for (const candle of candles) {
    const timestamp = getCandleTimestamp(candle)

    if (
      timestamp === null ||
      timestamp < from ||
      timestamp >= to ||
      !Number.isFinite(candle.high) ||
      !Number.isFinite(candle.low)
    ) {
      continue
    }

    high = Math.max(high, candle.high)
    low = Math.min(low, candle.low)
  }

  return Number.isFinite(high) && Number.isFinite(low) ? { high, low } : null
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

export function mergeLiveCandleItem(
  current: MarketChartCandleItemResponse[],
  liveCandle: MarketChartCandleItemResponse | null
) {
  if (!liveCandle) {
    return normalizeCandleItems(current)
  }

  const liveTimestamp = getCandleTimestamp(liveCandle)
  const newestTimestamp = Math.max(
    ...current
      .map((candle) => getCandleTimestamp(candle))
      .filter((timestamp): timestamp is number => timestamp !== null)
  )

  if (
    liveTimestamp === null ||
    (Number.isFinite(newestTimestamp) && liveTimestamp < newestTimestamp)
  ) {
    return normalizeCandleItems(current)
  }

  return mergeCandleItems(current, [liveCandle])
}

export function deriveLiveCandleItemFromQuote({
  current,
  quote,
  timeframe,
}: {
  current: MarketChartCandleItemResponse[] | null | undefined
  quote: MarketChartLiveQuoteResponse | null | undefined
  timeframe: MarketChartTimeframe
}): MarketChartCandleItemResponse | null {
  if (!quote || !Number.isFinite(quote.price)) {
    return null
  }

  const quoteTimestamp = Date.parse(quote.receivedAt)
  const quoteBucketTimestamp = getMarketChartCandleBucketStartTimestamp(
    timeframe,
    quoteTimestamp
  )
  const latestCandle = normalizeCandleItems(current ?? []).at(-1) ?? null
  const latestTimestamp = latestCandle ? getCandleTimestamp(latestCandle) : null
  const latestBucketTimestamp =
    latestTimestamp === null
      ? null
      : getMarketChartCandleBucketStartTimestamp(timeframe, latestTimestamp)

  if (
    quoteBucketTimestamp === null ||
    latestCandle === null ||
    latestBucketTimestamp === null ||
    quoteBucketTimestamp < latestBucketTimestamp
  ) {
    return null
  }

  if (quoteBucketTimestamp > latestBucketTimestamp) {
    return {
      time: new Date(quoteBucketTimestamp).toISOString(),
      open: quote.price,
      high: quote.price,
      low: quote.price,
      close: quote.price,
    }
  }

  return {
    ...latestCandle,
    high: Math.max(latestCandle.high, quote.price),
    low: Math.min(latestCandle.low, quote.price),
    close: quote.price,
  }
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
  candles: Pick<MarketChartCandleItemResponse, "volume">[] | null | undefined,
  liveCandle?: Pick<MarketChartCandleItemResponse, "volume"> | null
) {
  return Boolean(candles?.some(hasUsableVolume) || hasUsableVolume(liveCandle))
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
