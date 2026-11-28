"use client"

import { CalendarDays, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useMemo, useSyncExternalStore, useTransition } from "react"
import { LocalizedLink as Link } from "@/components/localized-link"

import { useLocalization } from "@/app/lib/i18n/provider"
import {
  EconomicCalendarListResponse,
  formatEconomicCalendarValue,
  getEconomicCalendarImpactBadgeProps,
  getEconomicCalendarImpactLabel,
  getEconomicCalendarStatusLabel,
  getEconomicCalendarStatusVariant,
} from "@/app/lib/economic-calendar/definitions"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { SortSelect } from "@/components/sort-select"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { EconomicCalendarFilters } from "./economic-calendar-filters"
import { EconomicCalendarSearch } from "./economic-calendar-search"
import { EconomicCalendarSyncButton } from "./economic-calendar-sync-button"
import {
  ECONOMIC_CALENDAR_FILTER_PARAMS,
  EconomicCalendarDateState,
  type EconomicCalendarScheduledSort,
  formatUtc7DayTimestamp,
  formatUtc7TimeLabel,
  getUtc7DateKey,
  getUtc7DateKeyFromTimestamp,
  getUtc7TimeKeyFromTimestamp,
} from "./economic-calendar-date"

interface EconomicCalendarListProps {
  dateState: EconomicCalendarDateState
  economicCalendarEntries: EconomicCalendarListResponse[]
  sort: EconomicCalendarScheduledSort
}

interface EconomicCalendarCurrencyGroup {
  entries: EconomicCalendarListResponse[]
  key: string
  label: string
}

interface EconomicCalendarTimeGroup {
  currencyGroups: EconomicCalendarCurrencyGroup[]
  key: string
  label: string
}

interface EconomicCalendarDayGroup {
  dateKey: string
  key: string
  label: string
  timeGroups: EconomicCalendarTimeGroup[]
}

type DateTimeFormatter = ReturnType<typeof useLocalization>["formatDateTime"]

function subscribeToMinute(callback: () => void) {
  const intervalId = window.setInterval(callback, 60_000)

  return () => window.clearInterval(intervalId)
}

function getMinuteSnapshot() {
  return Math.floor(Date.now() / 60_000)
}

function getServerMinuteSnapshot() {
  return 0
}

function useCurrentMinuteDate() {
  const minute = useSyncExternalStore(
    subscribeToMinute,
    getMinuteSnapshot,
    getServerMinuteSnapshot
  )

  return useMemo(
    () => (minute > 0 ? new Date(minute * 60_000) : null),
    [minute]
  )
}

function updateDateQuery(searchParams: URLSearchParams, date: string) {
  const params = new URLSearchParams(searchParams)

  params.set("date", date)
  params.delete("page")
  params.delete("size")
  params.delete("week")

  return params
}

function formatCurrency(value: string | null | undefined, fallback: string) {
  return value?.trim().toUpperCase() || fallback
}

function getEntryTitle(entry: EconomicCalendarListResponse, fallback: string) {
  return formatEconomicCalendarValue(entry.title, fallback)
}

function getScheduledDayLabel(
  dateKey: string,
  formatDateTime: DateTimeFormatter,
  fallback: string
) {
  return formatDateTime(
    formatUtc7DayTimestamp(dateKey),
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    },
    fallback
  )
}

function createDayGroup(
  dateKey: string,
  label: string
): EconomicCalendarDayGroup {
  return {
    dateKey,
    key: dateKey,
    label,
    timeGroups: [],
  }
}

function getOrCreateTimeGroup(
  dayGroup: EconomicCalendarDayGroup,
  key: string,
  label: string
) {
  const existingGroup = dayGroup.timeGroups.find((group) => group.key === key)

  if (existingGroup) {
    return existingGroup
  }

  const group: EconomicCalendarTimeGroup = {
    currencyGroups: [],
    key,
    label,
  }

  dayGroup.timeGroups.push(group)

  return group
}

function getOrCreateCurrencyGroup(
  timeGroup: EconomicCalendarTimeGroup,
  key: string,
  label: string
) {
  const existingGroup = timeGroup.currencyGroups.find(
    (group) => group.key === key
  )

  if (existingGroup) {
    return existingGroup
  }

  const group: EconomicCalendarCurrencyGroup = {
    entries: [],
    key,
    label,
  }

  timeGroup.currencyGroups.push(group)

  return group
}

function groupEconomicCalendarEntries(
  entries: EconomicCalendarListResponse[],
  formatDateTime: DateTimeFormatter,
  dateState: EconomicCalendarDateState,
  dayFallback: string,
  timeFallback: string,
  currencyFallback: string
): EconomicCalendarDayGroup[] {
  const selectedGroup = createDayGroup(
    dateState.selectedDate,
    getScheduledDayLabel(dateState.selectedDate, formatDateTime, dayFallback)
  )
  const groups = new Map<string, EconomicCalendarDayGroup>()

  groups.set(dateState.selectedDate, selectedGroup)

  for (const entry of entries) {
    const dateKey =
      getUtc7DateKeyFromTimestamp(entry.scheduledAt) ?? dateState.selectedDate
    const dayGroup = groups.get(dateKey) ?? selectedGroup

    const timeKey =
      getUtc7TimeKeyFromTimestamp(entry.scheduledAt) ?? "unscheduled-time"
    const timeLabel = timeKey === "unscheduled-time" ? timeFallback : timeKey
    const currencyKey = formatCurrency(entry.currencyCode, "unavailable")
    const currencyLabel =
      currencyKey === "unavailable" ? currencyFallback : currencyKey
    const timeGroup = getOrCreateTimeGroup(dayGroup, timeKey, timeLabel)
    const currencyGroup = getOrCreateCurrencyGroup(
      timeGroup,
      currencyKey,
      currencyLabel
    )

    currencyGroup.entries.push(entry)
  }

  return [selectedGroup]
}

function getTimeGroupRowCount(timeGroup: EconomicCalendarTimeGroup) {
  return timeGroup.currencyGroups.reduce(
    (count, currencyGroup) => count + currencyGroup.entries.length,
    0
  )
}

function shouldRenderCurrentTimeLineBeforeGroup(
  timeGroup: EconomicCalendarTimeGroup,
  nowTimeKey: string,
  sort: EconomicCalendarScheduledSort
) {
  if (timeGroup.key === "unscheduled-time") {
    return false
  }

  return sort === "scheduledAt_desc"
    ? timeGroup.key <= nowTimeKey
    : timeGroup.key >= nowTimeKey
}

function getNormalizedSignalValue(value: string | null | undefined) {
  const formatted = formatEconomicCalendarValue(value, "")

  if (!formatted || formatted.toUpperCase() === "N/A") {
    return null
  }

  const match = formatted.replace(/,/g, "").match(/[-+]?\d*\.?\d+/)

  if (!match) {
    return null
  }

  const numeric = Number(match[0])

  return Number.isFinite(numeric) ? numeric : null
}

function getValueSignalClassName(value: string | null | undefined) {
  const numeric = getNormalizedSignalValue(value)

  if (numeric === null || numeric === 0) {
    return "text-muted-foreground"
  }

  return numeric > 0
    ? "font-medium text-primary"
    : "font-medium text-destructive"
}

function CurrentTimeLine({ now }: { now: Date }) {
  const { dictionary, formatMessage } = useLocalization()

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={8} className="px-3 py-2">
        <div className="flex items-center gap-3 text-xs font-medium text-destructive">
          <span className="h-px flex-1 bg-destructive" />
          <span className="tabular-nums">
            {formatMessage(dictionary.economicCalendar.currentTimeMarker, {
              time: formatUtc7TimeLabel(now),
            })}
          </span>
          <span className="h-px flex-1 bg-destructive" />
        </div>
      </TableCell>
    </TableRow>
  )
}

function EconomicCalendarDateStrip({
  dateState,
}: {
  dateState: EconomicCalendarDateState
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dictionary, formatDateTime, formatMessage } = useLocalization()
  const [isPending, startTransition] = useTransition()

  const updateDate = (date: string) => {
    const params = updateDateQuery(searchParams, date)
    const query = params.toString()

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const weekRange = formatMessage(dictionary.economicCalendar.weekRange, {
    start: formatDateTime(
      formatUtc7DayTimestamp(dateState.weekStart),
      {
        day: "2-digit",
        month: "short",
      },
      dateState.weekStart
    ),
    end: formatDateTime(
      formatUtc7DayTimestamp(dateState.weekEnd),
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
      dateState.weekEnd
    ),
  })

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => updateDate(dateState.todayDate)}
            disabled={isPending}
          >
            <CalendarDays data-icon="inline-start" />
            {dictionary.economicCalendar.today}
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => updateDate(dateState.previousDate)}
              disabled={isPending}
            >
              <ChevronLeft data-icon="inline-start" />
              <span className="sr-only">
                {dictionary.economicCalendar.previousDay}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => updateDate(dateState.nextDate)}
              disabled={isPending}
            >
              <ChevronRight data-icon="inline-start" />
              <span className="sr-only">
                {dictionary.economicCalendar.nextDay}
              </span>
            </Button>
          </div>
        </div>
        <div className="text-sm font-medium tabular-nums">{weekRange}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {dateState.days.map((day) => {
          const isSelected = day.date === dateState.selectedDate

          return (
            <Button
              key={day.date}
              type="button"
              variant={isSelected ? "secondary" : "outline"}
              onClick={() => updateDate(day.date)}
              aria-label={formatMessage(
                dictionary.economicCalendar.weekDayNavigationLabel,
                {
                  date: formatDateTime(
                    day.timestamp,
                    {
                      day: "2-digit",
                      month: "short",
                      weekday: "long",
                    },
                    day.date
                  ),
                }
              )}
            >
              <span className="truncate">
                {formatDateTime(
                  day.timestamp,
                  {
                    day: "2-digit",
                    weekday: "short",
                  },
                  day.date
                )}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function AdjacentDayButton({
  direction,
  date,
}: {
  direction: "next" | "previous"
  date: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dictionary } = useLocalization()
  const [isPending, startTransition] = useTransition()
  const isPrevious = direction === "previous"

  return (
    <div className="mt-4 flex justify-center">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const params = updateDateQuery(searchParams, date)
          const query = params.toString()

          startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname)
          })
        }}
        disabled={isPending}
      >
        {isPrevious ? (
          <ChevronLeft data-icon="inline-start" />
        ) : (
          <ChevronRight data-icon="inline-start" />
        )}
        {isPrevious
          ? dictionary.economicCalendar.loadPreviousDay
          : dictionary.economicCalendar.loadNextDay}
      </Button>
    </div>
  )
}

export function EconomicCalendarList({
  dateState,
  economicCalendarEntries,
  sort,
}: EconomicCalendarListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const searchParams = useSearchParams()
  const now = useCurrentMinuteDate()
  const entries = economicCalendarEntries
  const currencyCodes = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .map((entry) => entry.currencyCode?.trim())
            .filter((currencyCode): currencyCode is string =>
              Boolean(currencyCode)
            )
        )
      ),
    [entries]
  )
  const hasActiveFilters = [
    ECONOMIC_CALENDAR_FILTER_PARAMS.title,
    ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode,
    ECONOMIC_CALENDAR_FILTER_PARAMS.impact,
  ].some((key) => Boolean(searchParams.get(key)))
  const groups = useMemo(
    () =>
      groupEconomicCalendarEntries(
        entries,
        formatDateTime,
        dateState,
        dictionary.economicCalendar.unscheduledGroup,
        dictionary.economicCalendar.scheduledTimeUnavailable,
        dictionary.economicCalendar.currencyRegionUnavailable
      ),
    [
      dictionary.economicCalendar.currencyRegionUnavailable,
      dictionary.economicCalendar.scheduledTimeUnavailable,
      dictionary.economicCalendar.unscheduledGroup,
      dateState,
      entries,
      formatDateTime,
    ]
  )
  const nowDateKey = now ? getUtc7DateKey(now) : null
  const nowTimeKey = now ? formatUtc7TimeLabel(now) : null
  const shouldRenderNowLine =
    now && nowDateKey ? nowDateKey === dateState.selectedDate : false
  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          <EconomicCalendarSyncButton />
          <EconomicCalendarSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <EconomicCalendarFilters currencyCodes={currencyCodes} />
          <SortSelect
            className="w-full sm:w-auto"
            defaultValue={sort}
            label={dictionary.economicCalendar.sortLabel}
            placeholder={dictionary.lists.sortPlaceholder}
            resetParamsOnChange={["page", "size", "week"]}
            resetPageOnChange={false}
            options={[
              {
                label: dictionary.economicCalendar.scheduledNewest,
                value: "scheduledAt_desc",
              },
              {
                label: dictionary.economicCalendar.scheduledOldest,
                value: "scheduledAt_asc",
              },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      <EconomicCalendarDateStrip dateState={dateState} />

      <AdjacentDayButton direction="previous" date={dateState.previousDate} />

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.timeColumn}
              </AppListTableHead>
              <AppListTableHead className="w-24">
                {dictionary.economicCalendar.currencyColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.impactColumn}
              </AppListTableHead>
              <AppListTableHead className="min-w-72">
                {dictionary.economicCalendar.eventColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.actual}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.forecast}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.previous}
              </AppListTableHead>
              <AppListTableHead className="w-20 text-right">
                {dictionary.economicCalendar.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const isTodayGroup =
                shouldRenderNowLine && group.dateKey === nowDateKey
              let hasRenderedNowLine = false
              const renderNowLine = () => {
                hasRenderedNowLine = true

                return now ? <CurrentTimeLine now={now} /> : null
              }

              return (
                <Fragment key={group.key}>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell
                      colSpan={8}
                      className="px-3 py-2 text-xs font-medium text-muted-foreground"
                    >
                      {group.label}
                    </TableCell>
                  </TableRow>
                  {group.timeGroups.length === 0 ? (
                    <>
                      {isTodayGroup ? renderNowLine() : null}
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={8}
                          className="px-3 py-3 text-sm text-muted-foreground"
                        >
                          <div role="status">
                            {hasActiveFilters
                              ? dictionary.economicCalendar.emptyDescription
                              : dictionary.economicCalendar.emptyDay}
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <>
                      {group.timeGroups.map((timeGroup) => {
                        const timeRowSpan = getTimeGroupRowCount(timeGroup)

                        return (
                          <Fragment key={timeGroup.key}>
                            {isTodayGroup &&
                            nowTimeKey &&
                            !hasRenderedNowLine &&
                            shouldRenderCurrentTimeLineBeforeGroup(
                              timeGroup,
                              nowTimeKey,
                              sort
                            )
                              ? renderNowLine()
                              : null}
                            {timeGroup.currencyGroups.map(
                              (currencyGroup, currencyGroupIndex) => {
                                const currencyRowSpan =
                                  currencyGroup.entries.length

                                return (
                                  <Fragment key={currencyGroup.key}>
                                    {currencyGroup.entries.map(
                                      (entry, entryIndex) => {
                                        const isFirstTimeRow =
                                          currencyGroupIndex === 0 &&
                                          entryIndex === 0
                                        const isFirstCurrencyRow =
                                          entryIndex === 0
                                        const entryTitle = getEntryTitle(
                                          entry,
                                          dictionary.economicCalendar.untitled
                                        )

                                        return (
                                          <TableRow key={entry.id}>
                                            {isFirstTimeRow ? (
                                              <TableCell
                                                rowSpan={timeRowSpan}
                                                className="w-28 bg-muted/10 align-top text-sm font-medium text-foreground tabular-nums"
                                              >
                                                {timeGroup.label}
                                              </TableCell>
                                            ) : null}
                                            {isFirstCurrencyRow ? (
                                              <TableCell
                                                rowSpan={currencyRowSpan}
                                                className="w-24 bg-muted/5 align-top text-sm font-medium text-foreground"
                                              >
                                                {currencyGroup.label}
                                              </TableCell>
                                            ) : null}
                                            <TableCell className="w-28 align-top">
                                              <Badge
                                                {...getEconomicCalendarImpactBadgeProps(
                                                  entry.impact
                                                )}
                                              >
                                                {getEconomicCalendarImpactLabel(
                                                  entry.impact,
                                                  dictionary
                                                )}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="min-w-72 align-top whitespace-normal">
                                              <div className="flex min-w-0 flex-col gap-1">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                  <Link
                                                    href={`/economic-calendar/${entry.id}`}
                                                    className="line-clamp-2 min-w-0 font-medium break-words hover:underline"
                                                  >
                                                    {entryTitle}
                                                  </Link>
                                                  <Badge
                                                    variant={getEconomicCalendarStatusVariant(
                                                      entry.status
                                                    )}
                                                  >
                                                    {getEconomicCalendarStatusLabel(
                                                      entry.status,
                                                      dictionary
                                                    )}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </TableCell>
                                            <TableCell className="w-28 align-top text-sm">
                                              <span
                                                className={cn(
                                                  "block max-w-28 truncate tabular-nums",
                                                  getValueSignalClassName(
                                                    entry.actualValue
                                                  )
                                                )}
                                              >
                                                {formatEconomicCalendarValue(
                                                  entry.actualValue,
                                                  dictionary.common.notAvailable
                                                )}
                                              </span>
                                            </TableCell>
                                            <TableCell className="w-28 align-top text-sm">
                                              <span
                                                className={cn(
                                                  "block max-w-28 truncate tabular-nums",
                                                  getValueSignalClassName(
                                                    entry.forecastValue
                                                  )
                                                )}
                                              >
                                                {formatEconomicCalendarValue(
                                                  entry.forecastValue,
                                                  dictionary.common.notAvailable
                                                )}
                                              </span>
                                            </TableCell>
                                            <TableCell className="w-28 align-top text-sm">
                                              <span
                                                className={cn(
                                                  "block max-w-28 truncate tabular-nums",
                                                  getValueSignalClassName(
                                                    entry.previousValue
                                                  )
                                                )}
                                              >
                                                {formatEconomicCalendarValue(
                                                  entry.previousValue,
                                                  dictionary.common.notAvailable
                                                )}
                                              </span>
                                            </TableCell>
                                            <TableCell className="w-20 text-right align-top">
                                              <div className="flex justify-end gap-1">
                                                <Link
                                                  href={`/economic-calendar/${entry.id}`}
                                                  className={buttonVariants({
                                                    variant: "ghost",
                                                    size: "icon-sm",
                                                  })}
                                                >
                                                  <Eye data-icon="inline-start" />
                                                  <span className="sr-only">
                                                    {
                                                      dictionary
                                                        .economicCalendar
                                                        .viewDetail
                                                    }
                                                  </span>
                                                </Link>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      }
                                    )}
                                  </Fragment>
                                )
                              }
                            )}
                          </Fragment>
                        )
                      })}
                      {isTodayGroup && !hasRenderedNowLine
                        ? renderNowLine()
                        : null}
                    </>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </AppListTable>

      <AdjacentDayButton direction="next" date={dateState.nextDate} />
    </div>
  )
}
