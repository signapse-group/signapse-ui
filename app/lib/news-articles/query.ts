import { buildFilterQuery } from "@/app/lib/utils"

import { NEWS_ARTICLE_STATUSES, type NewsArticleStatus } from "./definitions"

export const NEWS_ARTICLE_SEARCH_PARAMS = {
  keyword: "keyword[containsIgnoreCase]",
  legacyKeyword: "title[containsIgnoreCase]",
  status: "status[eq]",
  sourceName: "sourceName[eq]",
  publishedFrom: "publishedFrom",
  publishedTo: "publishedTo",
} as const

export const NEWS_ARTICLE_SORT_VALUES = [
  "publishedAt_desc",
  "publishedAt_asc",
  "createdDate_desc",
] as const

export type NewsArticleSortValue = (typeof NEWS_ARTICLE_SORT_VALUES)[number]
export type NewsArticleFilterKey =
  | (typeof NEWS_ARTICLE_SEARCH_PARAMS)["status"]
  | (typeof NEWS_ARTICLE_SEARCH_PARAMS)["sourceName"]
  | (typeof NEWS_ARTICLE_SEARCH_PARAMS)["publishedFrom"]
  | (typeof NEWS_ARTICLE_SEARCH_PARAMS)["publishedTo"]

type QueryValue = string | string[] | undefined
type SearchFieldValues = Record<string, QueryValue>

const DAY_MS = 24 * 60 * 60 * 1000
const TIME_ZONE_DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>()

function getValue(params: SearchFieldValues, key: string): string | undefined {
  const value = params[key]

  if (Array.isArray(value)) {
    if (value.length > 1) {
      throw new Error(`Expected one value for ${key}`)
    }
    return value[0]
  }

  return value
}

function getCalendarDate(value: string): {
  dayNumber: number
  nextDate: string
  year: number
  month: number
  day: number
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    throw new Error("Invalid news article calendar date")
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid news article calendar date")
  }

  const dayNumber = Math.floor(date.getTime() / DAY_MS)
  const nextDate = new Date(date.getTime() + DAY_MS).toISOString().slice(0, 10)

  return { dayNumber, nextDate, year, month, day }
}

function getTimeZoneDateFormatter(timeZone: string) {
  const existing = TIME_ZONE_DATE_FORMATTER_CACHE.get(timeZone)
  if (existing) return existing

  const formatter = new Intl.DateTimeFormat("en-US", {
    calendar: "iso8601",
    day: "2-digit",
    month: "2-digit",
    numberingSystem: "latn",
    timeZone,
    year: "numeric",
  })
  TIME_ZONE_DATE_FORMATTER_CACHE.set(timeZone, formatter)
  return formatter
}

function getLocalDayNumber(instant: number, formatter: Intl.DateTimeFormat) {
  const parts = formatter.formatToParts(new Date(instant))
  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)

  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

function getStartOfDayInstant(date: string, timeZone: string) {
  const { dayNumber, year, month, day } = getCalendarDate(date)
  const formatter = getTimeZoneDateFormatter(timeZone)
  const nominalUtc = Date.UTC(year, month - 1, day)
  let low = nominalUtc - 36 * 60 * 60 * 1000
  let high = nominalUtc + 36 * 60 * 60 * 1000

  while (getLocalDayNumber(low, formatter) >= dayNumber) {
    low -= DAY_MS
  }
  while (getLocalDayNumber(high, formatter) < dayNumber) {
    high += DAY_MS
  }

  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    if (getLocalDayNumber(middle, formatter) >= dayNumber) {
      high = middle
    } else {
      low = middle
    }
  }

  return new Date(high).toISOString()
}

export function getNewsArticleDateRange(
  publishedFrom: string | undefined,
  publishedTo: string | undefined,
  timeZone: string
): { from?: string; toExclusive?: string } {
  if (!publishedFrom && !publishedTo) return {}

  try {
    new Intl.DateTimeFormat("en-US", { timeZone })
  } catch {
    throw new Error("Invalid news article time zone")
  }

  const fromDate = publishedFrom ? getCalendarDate(publishedFrom) : undefined
  const toDate = publishedTo ? getCalendarDate(publishedTo) : undefined
  if (fromDate && toDate && fromDate.dayNumber > toDate.dayNumber) {
    throw new Error("News article start date must not follow end date")
  }

  return {
    ...(publishedFrom
      ? { from: getStartOfDayInstant(publishedFrom, timeZone) }
      : {}),
    ...(publishedTo
      ? {
          toExclusive: getStartOfDayInstant(toDate!.nextDate, timeZone),
        }
      : {}),
  }
}

export function getNewsArticleDateValue(value: string, timeZone: string) {
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) {
    throw new Error("Invalid news article publication instant")
  }

  const formatter = getTimeZoneDateFormatter(timeZone)
  const parts = formatter.formatToParts(instant)
  const part = (type: "year" | "month" | "day") =>
    parts.find((valuePart) => valuePart.type === type)?.value

  return `${part("year")}-${part("month")}-${part("day")}`
}

export function buildNewsArticleFilter(
  params: SearchFieldValues,
  timeZone: string
) {
  const keyword =
    getValue(params, NEWS_ARTICLE_SEARCH_PARAMS.keyword) ??
    getValue(params, NEWS_ARTICLE_SEARCH_PARAMS.legacyKeyword)
  const status = getValue(params, NEWS_ARTICLE_SEARCH_PARAMS.status)
  const sourceName = getValue(params, NEWS_ARTICLE_SEARCH_PARAMS.sourceName)
  const publishedFrom = getValue(
    params,
    NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom
  )
  const publishedTo = getValue(params, NEWS_ARTICLE_SEARCH_PARAMS.publishedTo)

  if (status && !NEWS_ARTICLE_STATUSES.includes(status as NewsArticleStatus)) {
    throw new Error("Unsupported news article status")
  }

  const dateRange = getNewsArticleDateRange(
    publishedFrom,
    publishedTo,
    timeZone
  )

  return buildFilterQuery({
    [NEWS_ARTICLE_SEARCH_PARAMS.keyword]: keyword?.trim() || undefined,
    [NEWS_ARTICLE_SEARCH_PARAMS.status]: status,
    [NEWS_ARTICLE_SEARCH_PARAMS.sourceName]: sourceName,
    "publishedAt[ge]": dateRange.from,
    "publishedAt[lt]": dateRange.toExclusive,
  })
}

export function resolveNewsArticleSort(
  sort: string | string[] | undefined
): NewsArticleSortValue {
  if (sort === undefined || sort === "") return "publishedAt_desc"
  if (Array.isArray(sort)) {
    if (sort.length !== 1) {
      throw new Error("Only one news article sort is supported")
    }
    sort = sort[0]
  }

  if (!NEWS_ARTICLE_SORT_VALUES.includes(sort as NewsArticleSortValue)) {
    throw new Error("Unsupported news article sort")
  }

  return sort as NewsArticleSortValue
}

export function removeNewsArticleFilter(
  searchParams: URLSearchParams,
  filterKey: NewsArticleFilterKey
) {
  const next = new URLSearchParams(searchParams)
  next.delete(filterKey)
  next.set("page", "1")
  return next
}

export function clearNewsArticleFilters(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams)
  next.delete(NEWS_ARTICLE_SEARCH_PARAMS.status)
  next.delete(NEWS_ARTICLE_SEARCH_PARAMS.sourceName)
  next.delete(NEWS_ARTICLE_SEARCH_PARAMS.publishedFrom)
  next.delete(NEWS_ARTICLE_SEARCH_PARAMS.publishedTo)
  next.set("page", "1")
  return next
}
