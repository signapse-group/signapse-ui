import type {
  MarketChartAnnotationDirection,
  MarketChartAnnotationResponse,
  MarketChartCandleItemResponse,
  MarketChartEconomicCalendarEventResponse,
} from "@/app/lib/market-charts/definitions"

import { getMarketChartCalendarEventTimestamp } from "./market-chart-calendar-helpers"

export type MarketChartEpochMillis = number

export interface MarketChartAnnotationGroup {
  id: string
  time: MarketChartEpochMillis
  anchorPrice: number
  direction: MarketChartAnnotationDirection | null
  annotations: MarketChartAnnotationResponse[]
  priority: "normal" | "high"
}

export interface MarketChartEconomicCalendarEventGroup {
  id: string
  time: MarketChartEpochMillis
  anchorPrice: number
  events: MarketChartEconomicCalendarEventResponse[]
  priority: "normal" | "high"
}

export interface MarketChartAnnotationMarkerPoint {
  x: number
  y: number
}

export type MarketChartAnnotationColorClassNames = {
  dot: string
  foreground: string
  pulse: string
  ring: string
}

export function getMarketChartAnnotationColorClassNames(
  direction: MarketChartAnnotationDirection | null
): MarketChartAnnotationColorClassNames {
  switch (direction) {
    case "BULLISH":
      return {
        dot: "bg-emerald-500",
        foreground: "text-white",
        pulse: "bg-emerald-500/20",
        ring: "ring-emerald-500/30",
      }
    case "BEARISH":
      return {
        dot: "bg-destructive",
        foreground: "text-destructive-foreground",
        pulse: "bg-destructive/20",
        ring: "ring-destructive/30",
      }
    case "NEUTRAL":
      return {
        dot: "bg-amber-500",
        foreground: "text-white",
        pulse: "bg-amber-500/20",
        ring: "ring-amber-500/30",
      }
    case "MIXED":
      return {
        dot: "bg-orange-500",
        foreground: "text-white",
        pulse: "bg-orange-500/20",
        ring: "ring-orange-500/30",
      }
    default:
      return {
        dot: "bg-muted-foreground",
        foreground: "text-background",
        pulse: "bg-muted-foreground/20",
        ring: "ring-muted-foreground/30",
      }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isValidMarketChartAnnotation(
  annotation: unknown
): annotation is MarketChartAnnotationResponse {
  return (
    isRecord(annotation) &&
    typeof annotation.id === "string" &&
    toMarketChartEpochMillis(annotation.time) !== null
  )
}

function isValidMarketChartCandle(
  candle: unknown
): candle is MarketChartCandleItemResponse {
  return (
    isRecord(candle) &&
    toMarketChartEpochMillis(candle.time) !== null &&
    typeof candle.high === "number" &&
    Number.isFinite(candle.high) &&
    typeof candle.close === "number" &&
    Number.isFinite(candle.close)
  )
}

function isWarmMarketChartAnnotation(
  annotation: MarketChartAnnotationResponse
) {
  return (
    annotation.annotationType === "WARM_EPISODE" && !!annotation.warmEpisode
  )
}

function isHotMarketChartAnnotation(annotation: MarketChartAnnotationResponse) {
  return annotation.annotationType === "HOT_EVENT" && !!annotation.hotEvent
}

export function mergeMarketChartAnnotations(
  current: MarketChartAnnotationResponse[],
  incoming: MarketChartAnnotationResponse[]
): MarketChartAnnotationResponse[] {
  const annotationsById = new Map<string, MarketChartAnnotationResponse>()

  for (const annotation of current.filter(isValidMarketChartAnnotation)) {
    annotationsById.set(annotation.id, annotation)
  }

  for (const annotation of incoming.filter(isValidMarketChartAnnotation)) {
    annotationsById.set(annotation.id, annotation)
  }

  return [...annotationsById.values()].sort((left, right) => {
    const leftTime = toMarketChartEpochMillis(left.time) ?? 0
    const rightTime = toMarketChartEpochMillis(right.time) ?? 0

    return leftTime - rightTime
  })
}

export function mergeMarketChartEconomicCalendarEvents(
  current: MarketChartEconomicCalendarEventResponse[],
  incoming: MarketChartEconomicCalendarEventResponse[]
): MarketChartEconomicCalendarEventResponse[] {
  const eventsByKey = new Map<
    string,
    MarketChartEconomicCalendarEventResponse
  >()

  for (const event of [...current, ...incoming]) {
    const timestamp = getMarketChartCalendarEventTimestamp(event)

    if (timestamp === null) {
      continue
    }

    const key =
      event.id === undefined
        ? `anonymous:${JSON.stringify([
            timestamp,
            event.assetId,
            event.title,
            event.currencyCode,
            event.type,
          ])}`
        : `id:${event.id}`
    eventsByKey.set(key, event)
  }

  return [...eventsByKey.values()].sort(
    (left, right) =>
      (getMarketChartCalendarEventTimestamp(left) ?? 0) -
      (getMarketChartCalendarEventTimestamp(right) ?? 0)
  )
}

export function toMarketChartEpochMillis(
  value: unknown
): MarketChartEpochMillis | null {
  if (typeof value !== "string") {
    return null
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return null
  }

  return timestamp
}

function getDominantDirection(
  annotations: MarketChartAnnotationResponse[]
): MarketChartAnnotationDirection | null {
  const directions = annotations
    .map((annotation) =>
      annotation.annotationType === "WARM_EPISODE"
        ? annotation.warmEpisode?.direction
        : annotation.hotEvent?.direction
    )
    .filter(
      (direction): direction is MarketChartAnnotationDirection => !!direction
    )

  if (!directions.length) {
    return null
  }

  const firstDirection = directions[0]

  return directions.every((direction) => direction === firstDirection)
    ? firstDirection
    : "MIXED"
}

function hasHighPriorityAnnotation(
  annotations: MarketChartAnnotationResponse[]
) {
  return annotations.some((annotation) => {
    const severity = (
      annotation.annotationType === "WARM_EPISODE"
        ? annotation.warmEpisode?.events.find((event) => event.severity)
            ?.severity
        : annotation.hotEvent?.severity
    )?.toUpperCase()

    return severity
      ? ["HIGH", "CRITICAL", "IMPORTANT", "SEVERE"].some((keyword) =>
          severity.includes(keyword)
        )
      : false
  })
}

function hasHighImpactCalendarEvent(
  events: MarketChartEconomicCalendarEventResponse[]
) {
  return events.some((event) => event.impact?.toUpperCase().includes("HIGH"))
}

function resolveNearestCandleTime(
  annotationTime: MarketChartEpochMillis,
  candleTimes: MarketChartEpochMillis[]
) {
  if (!candleTimes.length) {
    return null
  }

  const annotationTimestamp = Number(annotationTime)
  const firstTime = Number(candleTimes[0])
  const lastTime = Number(candleTimes[candleTimes.length - 1])

  if (annotationTimestamp < firstTime || annotationTimestamp > lastTime) {
    return null
  }

  let left = 0
  let right = candleTimes.length - 1

  while (left < right) {
    const middle = Math.floor((left + right) / 2)

    if (Number(candleTimes[middle]) < annotationTimestamp) {
      left = middle + 1
    } else {
      right = middle
    }
  }

  const current = candleTimes[left]
  const previous = left > 0 ? candleTimes[left - 1] : current

  return Math.abs(Number(previous) - annotationTimestamp) <=
    Math.abs(Number(current) - annotationTimestamp)
    ? previous
    : current
}

export function createMarketChartAnnotationGroups(
  annotations: MarketChartAnnotationResponse[],
  candles: MarketChartCandleItemResponse[]
): MarketChartAnnotationGroup[] {
  const validCandles = candles.filter(isValidMarketChartCandle)
  const validAnnotations = annotations
    .filter(isValidMarketChartAnnotation)
    .filter(isHotMarketChartAnnotation)
  const candleTimes = validCandles
    .map((candle) => toMarketChartEpochMillis(candle.time))
    .filter((time): time is MarketChartEpochMillis => time !== null)
    .sort((left, right) => Number(left) - Number(right))
  const candlesByTime = new Map<number, MarketChartCandleItemResponse>()
  const groupsByTime = new Map<number, MarketChartAnnotationResponse[]>()

  for (const candle of validCandles) {
    const time = toMarketChartEpochMillis(candle.time)

    if (time !== null) {
      candlesByTime.set(Number(time), candle)
    }
  }

  for (const annotation of validAnnotations) {
    const annotationTime = toMarketChartEpochMillis(annotation.time)

    if (annotationTime === null) {
      continue
    }

    const candleTime = resolveNearestCandleTime(annotationTime, candleTimes)

    if (candleTime === null) {
      continue
    }

    const key = Number(candleTime)
    const group = groupsByTime.get(key) ?? []

    group.push(annotation)
    groupsByTime.set(key, group)
  }

  return [...groupsByTime.entries()]
    .sort(([left], [right]) => left - right)
    .map(([time, groupedAnnotations]) => {
      const direction = getDominantDirection(groupedAnnotations)
      const candle = candlesByTime.get(time)
      const id = `annotation-${time}`

      return {
        id,
        time,
        anchorPrice: candle?.high ?? candle?.close ?? 0,
        direction,
        annotations: groupedAnnotations,
        priority:
          groupedAnnotations.length > 1 ||
          hasHighPriorityAnnotation(groupedAnnotations)
            ? "high"
            : "normal",
      }
    })
}

export function createMarketChartEconomicCalendarEventGroups(
  events: MarketChartEconomicCalendarEventResponse[],
  candles: MarketChartCandleItemResponse[]
): MarketChartEconomicCalendarEventGroup[] {
  const validCandles = candles.filter(isValidMarketChartCandle)
  const candleTimes = validCandles
    .map((candle) => toMarketChartEpochMillis(candle.time))
    .filter((time): time is MarketChartEpochMillis => time !== null)
    .sort((left, right) => Number(left) - Number(right))
  const candlesByTime = new Map<number, MarketChartCandleItemResponse>()
  const groupsByTime = new Map<
    number,
    MarketChartEconomicCalendarEventResponse[]
  >()

  for (const candle of validCandles) {
    const time = toMarketChartEpochMillis(candle.time)

    if (time !== null) {
      candlesByTime.set(Number(time), candle)
    }
  }

  for (const event of events) {
    const eventTime = getMarketChartCalendarEventTimestamp(event)

    if (eventTime === null) {
      continue
    }

    const key = Number(
      resolveNearestCandleTime(eventTime, candleTimes) ?? eventTime
    )
    const group = groupsByTime.get(key) ?? []

    group.push(event)
    groupsByTime.set(key, group)
  }

  return [...groupsByTime.entries()]
    .sort(([left], [right]) => left - right)
    .map(([time, groupedEvents]) => {
      const candle = candlesByTime.get(time)

      return {
        id: `economic-calendar-${time}`,
        time,
        anchorPrice: candle?.high ?? candle?.close ?? 0,
        events: groupedEvents,
        priority:
          groupedEvents.length > 1 || hasHighImpactCalendarEvent(groupedEvents)
            ? "high"
            : "normal",
      }
    })
}

export function createMarketChartWarmAnnotationGroups(
  annotations: MarketChartAnnotationResponse[],
  candles: MarketChartCandleItemResponse[]
): MarketChartAnnotationGroup[] {
  const candleTimes = candles
    .filter(isValidMarketChartCandle)
    .map((candle) => toMarketChartEpochMillis(candle.time))
    .filter((time): time is MarketChartEpochMillis => time !== null)
    .sort((left, right) => Number(left) - Number(right))

  if (!candleTimes.length) {
    return []
  }

  const firstTime = Number(candleTimes[0])
  const lastTime = Number(candleTimes[candleTimes.length - 1])

  return annotations
    .filter(isValidMarketChartAnnotation)
    .filter(isWarmMarketChartAnnotation)
    .flatMap((annotation) => {
      const warmEpisode = annotation.warmEpisode
      const periodStart = toMarketChartEpochMillis(warmEpisode?.periodStart)
      const periodEnd = toMarketChartEpochMillis(warmEpisode?.periodEnd)

      if (!warmEpisode || periodStart === null || periodEnd === null) {
        return []
      }

      const start = Math.min(Number(periodStart), Number(periodEnd))
      const end = Math.max(Number(periodStart), Number(periodEnd))

      if (end < firstTime || start > lastTime) {
        return []
      }

      return [
        {
          id: `annotation-warm-${annotation.id}`,
          time: periodStart,
          anchorPrice: 0,
          direction: warmEpisode.direction ?? null,
          annotations: [annotation],
          priority: hasHighPriorityAnnotation([annotation]) ? "high" : "normal",
        },
      ]
    })
}
