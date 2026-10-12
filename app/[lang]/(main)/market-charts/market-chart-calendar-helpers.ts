import type {
  MarketChartEconomicCalendarEventRequest,
  MarketChartEconomicCalendarEventResponse,
} from "@/app/lib/market-charts/definitions"
import type { EconomicCalendarImpactLevel } from "@/app/lib/economic-calendar/definitions"

export const MARKET_CHART_CALENDAR_LOOKAHEAD_DAYS = 7
export const MARKET_CHART_CALENDAR_WAITING_WINDOW_MS = 60 * 60 * 1000
export const MARKET_CHART_CALENDAR_REFRESH_INTERVAL_MS = 60 * 1000

const MARKET_CHART_CALENDAR_DAY_MS = 24 * 60 * 60 * 1000

export type MarketChartCalendarEventState =
  "UPCOMING" | "AWAITING_PUBLICATION" | "PUBLISHED" | "EXPIRED" | "INVALID"

export function getMarketChartCalendarEventTimestamp(
  event: MarketChartEconomicCalendarEventResponse
): number | null {
  const scheduledAt = event.scheduledAt ? Date.parse(event.scheduledAt) : NaN

  if (Number.isFinite(scheduledAt)) {
    return scheduledAt
  }

  const time = Date.parse(event.time)

  return Number.isFinite(time) ? time : null
}

export function createMarketChartFutureCalendarRequest({
  assetId,
  currentTimestamp,
  impacts,
}: {
  assetId: number
  currentTimestamp: number
  impacts: readonly EconomicCalendarImpactLevel[]
}): MarketChartEconomicCalendarEventRequest | null {
  if (!Number.isFinite(currentTimestamp) || !impacts.length) {
    return null
  }

  return {
    assetId,
    from: new Date(
      currentTimestamp - MARKET_CHART_CALENDAR_WAITING_WINDOW_MS
    ).toISOString(),
    to: new Date(
      currentTimestamp +
        MARKET_CHART_CALENDAR_LOOKAHEAD_DAYS * MARKET_CHART_CALENDAR_DAY_MS
    ).toISOString(),
    impact: [...impacts],
  }
}

export function getMarketChartCalendarEventState(
  event: MarketChartEconomicCalendarEventResponse,
  currentTimestamp: number
): MarketChartCalendarEventState {
  const eventTimestamp = getMarketChartCalendarEventTimestamp(event)

  if (eventTimestamp === null || !Number.isFinite(currentTimestamp)) {
    return "INVALID"
  }

  if (event.status === "AVAILABLE") {
    return "PUBLISHED"
  }

  if (currentTimestamp < eventTimestamp) {
    return "UPCOMING"
  }

  return currentTimestamp <
    eventTimestamp + MARKET_CHART_CALENDAR_WAITING_WINDOW_MS
    ? "AWAITING_PUBLICATION"
    : "EXPIRED"
}

export function getUpcomingMarketChartCalendarEvents({
  currentTimestamp,
  events,
  lookaheadDays,
}: {
  currentTimestamp: number
  events: readonly MarketChartEconomicCalendarEventResponse[]
  lookaheadDays: number
}) {
  const endTimestamp =
    currentTimestamp + lookaheadDays * MARKET_CHART_CALENDAR_DAY_MS

  return events
    .map((event) => ({
      event,
      timestamp: getMarketChartCalendarEventTimestamp(event),
    }))
    .filter(
      ({ timestamp }) =>
        timestamp !== null &&
        timestamp > currentTimestamp &&
        timestamp < endTimestamp &&
        Number.isFinite(currentTimestamp)
    )
    .sort(
      (left, right) =>
        (left.timestamp ?? Number.POSITIVE_INFINITY) -
        (right.timestamp ?? Number.POSITIVE_INFINITY)
    )
    .map(({ event }) => event)
}

export function getAwaitingMarketChartCalendarEvents({
  currentTimestamp,
  events,
}: {
  currentTimestamp: number
  events: readonly MarketChartEconomicCalendarEventResponse[]
}) {
  return events
    .map((event) => ({
      event,
      timestamp: getMarketChartCalendarEventTimestamp(event),
    }))
    .filter(({ event, timestamp }) => {
      if (timestamp === null || event.status !== "PENDING") {
        return false
      }

      return (
        currentTimestamp >= timestamp &&
        currentTimestamp < timestamp + MARKET_CHART_CALENDAR_WAITING_WINDOW_MS
      )
    })
    .sort(
      (left, right) =>
        (left.timestamp ?? Number.POSITIVE_INFINITY) -
        (right.timestamp ?? Number.POSITIVE_INFINITY)
    )
    .map(({ event }) => event)
}

export function getNextMarketChartCalendarEvent({
  currentTimestamp,
  events,
  lookaheadDays,
}: {
  currentTimestamp: number
  events: readonly MarketChartEconomicCalendarEventResponse[]
  lookaheadDays: number
}) {
  return (
    getUpcomingMarketChartCalendarEvents({
      currentTimestamp,
      events,
      lookaheadDays,
    })[0] ?? null
  )
}
