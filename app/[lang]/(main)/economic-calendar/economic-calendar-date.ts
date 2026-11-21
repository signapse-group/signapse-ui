import { ECONOMIC_CALENDAR_IMPACT_LEVELS } from "@/app/lib/economic-calendar/definitions"
import { buildFilterQuery } from "@/app/lib/utils"

const UTC7_OFFSET_MINUTES = 7 * 60
const UTC7_OFFSET_MS = UTC7_OFFSET_MINUTES * 60 * 1000
const UTC7_OFFSET_LABEL = "+07:00"
const DAY_MS = 24 * 60 * 60 * 1000

export const ECONOMIC_CALENDAR_DEFAULT_SORT = "scheduledAt_asc"
export const ECONOMIC_CALENDAR_SCHEDULED_SORTS = [
  ECONOMIC_CALENDAR_DEFAULT_SORT,
  "scheduledAt_desc",
] as const
export const ECONOMIC_CALENDAR_FILTER_PARAMS = {
  title: "title[containsIgnoreCase]",
  currencyCode: "currencyCode[eq]",
  impact: "impact[eq]",
} as const

export type EconomicCalendarScheduledSort =
  (typeof ECONOMIC_CALENDAR_SCHEDULED_SORTS)[number]
export type EconomicCalendarControlFilterParam =
  | typeof ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode
  | typeof ECONOMIC_CALENDAR_FILTER_PARAMS.impact

export interface EconomicCalendarNavigationDay {
  date: string
  timestamp: string
}

export interface EconomicCalendarDateState {
  days: EconomicCalendarNavigationDay[]
  nextDate: string
  previousDate: string
  selectedDate: string
  todayDate: string
  weekEnd: string
  weekStart: string
}

function pad2(value: number) {
  return value.toString().padStart(2, "0")
}

function formatYmdFromUtcDate(date: Date) {
  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
  ].join("-")
}

function utcDateFromYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function addUtc7Days(value: string, days: number) {
  const date = utcDateFromYmd(value)

  if (!date) {
    return value
  }

  return formatYmdFromUtcDate(new Date(date.getTime() + days * DAY_MS))
}

export function getUtc7DateKey(date = new Date()) {
  return formatYmdFromUtcDate(new Date(date.getTime() + UTC7_OFFSET_MS))
}

export function getUtc7DateKeyFromTimestamp(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const time = new Date(value).getTime()

  if (!Number.isFinite(time)) {
    return null
  }

  return getUtc7DateKey(new Date(time))
}

export function getUtc7WeekStart(value = getUtc7DateKey()) {
  const date = utcDateFromYmd(value)

  if (!date) {
    return getUtc7WeekStart()
  }

  const day = date.getUTCDay()
  const daysSinceMonday = (day + 6) % 7

  return formatYmdFromUtcDate(
    new Date(date.getTime() - daysSinceMonday * DAY_MS)
  )
}

export function parseUtc7Date(
  value: string | string[] | undefined,
  fallback = getUtc7DateKey()
) {
  const dateValue = Array.isArray(value) ? value[0] : value

  if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return fallback
  }

  const date = utcDateFromYmd(dateValue)

  if (!date) {
    return fallback
  }

  return formatYmdFromUtcDate(date)
}

export function formatUtc7Boundary(value: string) {
  return `${value}T00:00:00${UTC7_OFFSET_LABEL}`
}

export function formatUtc7DayTimestamp(value: string) {
  return formatUtc7Boundary(value)
}

export function formatUtc7TimeLabel(date: Date) {
  const shifted = new Date(date.getTime() + UTC7_OFFSET_MS)

  return `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}`
}

export function getUtc7TimeKeyFromTimestamp(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const time = new Date(value).getTime()

  if (!Number.isFinite(time)) {
    return null
  }

  return formatUtc7TimeLabel(new Date(time))
}

export function normalizeEconomicCalendarSort(
  value: string | string[] | undefined
): EconomicCalendarScheduledSort {
  const sort = Array.isArray(value) ? value[0] : value

  return ECONOMIC_CALENDAR_SCHEDULED_SORTS.includes(
    sort as EconomicCalendarScheduledSort
  )
    ? (sort as EconomicCalendarScheduledSort)
    : ECONOMIC_CALENDAR_DEFAULT_SORT
}

export function buildScheduledAtDayFilter(date: string) {
  const nextDate = addUtc7Days(date, 1)

  return `scheduledAt ge '${formatUtc7Boundary(
    date
  )}' and scheduledAt lt '${formatUtc7Boundary(nextDate)}'`
}

export function combineEconomicCalendarFilters(
  scheduledAtFilter: string,
  searchFilter: string
) {
  if (!searchFilter) {
    return scheduledAtFilter
  }

  return `${scheduledAtFilter} and ${searchFilter}`
}

function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function buildEconomicCalendarFilter(
  date: string,
  searchParams: Record<string, string | string[] | undefined>
) {
  const impactValue = firstParamValue(
    searchParams[ECONOMIC_CALENDAR_FILTER_PARAMS.impact]
  )
    ?.trim()
    .toUpperCase()
  const impact = ECONOMIC_CALENDAR_IMPACT_LEVELS.find(
    (level) => level === impactValue
  )
  const searchFilter = buildFilterQuery({
    [ECONOMIC_CALENDAR_FILTER_PARAMS.title]: firstParamValue(
      searchParams[ECONOMIC_CALENDAR_FILTER_PARAMS.title]
    ),
    [ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode]: firstParamValue(
      searchParams[ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode]
    ),
    [ECONOMIC_CALENDAR_FILTER_PARAMS.impact]: impact,
  })

  return combineEconomicCalendarFilters(
    buildScheduledAtDayFilter(date),
    searchFilter
  )
}

export function setEconomicCalendarFilter(
  searchParams: URLSearchParams,
  key: EconomicCalendarControlFilterParam,
  value: string
) {
  const params = new URLSearchParams(searchParams)

  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }

  return params
}

export function clearEconomicCalendarFilters(searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams)
  params.delete(ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode)
  params.delete(ECONOMIC_CALENDAR_FILTER_PARAMS.impact)
  return params
}

export function getEconomicCalendarDateState(
  value: string | string[] | undefined,
  now = new Date()
): EconomicCalendarDateState {
  const todayDate = getUtc7DateKey(now)
  const selectedDate = parseUtc7Date(value, todayDate)
  const weekStart = getUtc7WeekStart(selectedDate)
  const weekEnd = addUtc7Days(weekStart, 6)

  return {
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addUtc7Days(weekStart, index)

      return {
        date,
        timestamp: formatUtc7DayTimestamp(date),
      }
    }),
    nextDate: addUtc7Days(selectedDate, 1),
    previousDate: addUtc7Days(selectedDate, -1),
    selectedDate,
    todayDate,
    weekEnd,
    weekStart,
  }
}
