import {
  Activity,
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  Clock3,
  Database,
  Hash,
  Landmark,
  RefreshCcw,
} from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { notFound } from "next/navigation"
import { Suspense, type ElementType, type ReactNode } from "react"

import { getEconomicCalendarEntryById } from "@/app/api/economic-calendar/action"
import {
  EconomicCalendarResponse,
  formatEconomicCalendarValue,
  getEconomicCalendarImpactBadgeProps,
  getEconomicCalendarImpactLabel,
  getEconomicCalendarStatusLabel,
  getEconomicCalendarStatusVariant,
} from "@/app/lib/economic-calendar/definitions"
import { ECONOMIC_CALENDAR_READ_PERMISSIONS } from "@/app/lib/economic-calendar/permissions"
import { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatMessage } from "@/app/lib/i18n/messages"
import { formatDateTime as formatLocalizedDateTime } from "@/app/lib/i18n/format"
import { getRequestLocale, getServerDictionary } from "@/app/lib/i18n/server"
import { formatTimeZoneOffset } from "@/app/lib/i18n/time-zone"
import { getRequestTimeZone } from "@/app/lib/i18n/time-zone-server"
import { hasAnyPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AppTimeZoneSync } from "@/components/app-time-zone-sync"
import { AccessDenied } from "@/components/access-denied"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
  params: Promise<{ id: string }>
}

type ApiLikeError = Error & { status?: number }

function formatDateTime(
  value: string | null | undefined,
  locale: AppLocale,
  dictionary: Dictionary,
  timeZone: string
) {
  if (!value) {
    return dictionary.common.notAvailable
  }

  return formatLocalizedDateTime(
    value,
    locale,
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    },
    dictionary.common.notAvailable
  )
}

function formatCurrency(value: string | null | undefined, fallback: string) {
  return value?.trim().toUpperCase() || fallback
}

function isNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  if ((error as ApiLikeError).status === 404) {
    return true
  }

  return /(?:^|\b)(?:404|not[\s-]?found)(?:\b|$)/i.test(error.message)
}

function DetailCard({
  title,
  value,
  valueNode,
  icon: Icon,
}: {
  title: string
  value?: string
  valueNode?: ReactNode
  icon: ElementType
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="mt-2">
        {valueNode ?? (
          <p className="font-medium break-words text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

export default async function EconomicCalendarDetailPage({
  params,
}: PageProps) {
  const permissions = await getCurrentPermissions()
  const locale = await getRequestLocale()
  const dictionary = await getServerDictionary()

  if (!hasAnyPermission(permissions, ECONOMIC_CALENDAR_READ_PERMISSIONS)) {
    return (
      <AccessDenied
        description={dictionary.economicCalendar.detailDenied}
        permission={ECONOMIC_CALENDAR_READ_PERMISSIONS[0]}
      />
    )
  }

  const { id } = await params
  const entryId = Number(id)

  if (!Number.isFinite(entryId)) {
    notFound()
  }

  const { timeZone, known: timeZoneKnown } = await getRequestTimeZone()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <Link
          href="/economic-calendar"
          className={buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "gap-2",
          })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      <Suspense fallback={<EconomicCalendarDetailSkeleton />}>
        <AppTimeZoneSync
          timeZone={timeZone}
          timeZoneKnown={timeZoneKnown}
          fallback={<EconomicCalendarDetailSkeleton />}
        >
          <FetchEconomicCalendarEntryData
            id={entryId}
            dictionary={dictionary}
            locale={locale}
            timeZone={timeZone}
          />
        </AppTimeZoneSync>
      </Suspense>
    </div>
  )
}

async function FetchEconomicCalendarEntryData({
  id,
  dictionary,
  locale,
  timeZone,
}: {
  id: number
  dictionary: Dictionary
  locale: AppLocale
  timeZone: string
}) {
  let entry: EconomicCalendarResponse

  try {
    entry = await getEconomicCalendarEntryById(id)
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound()
    }

    throw error
  }

  const description = entry.description?.trim()
  const timeZoneReferenceTime = [
    entry.scheduledAt,
    entry.syncedAt,
    entry.createdDate,
    entry.lastModifiedDate,
  ].find((value) => value?.trim())
  const timeZoneOffset = timeZoneReferenceTime
    ? formatTimeZoneOffset(timeZoneReferenceTime, timeZone)
    : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge {...getEconomicCalendarImpactBadgeProps(entry.impact)}>
              {getEconomicCalendarImpactLabel(entry.impact, dictionary)}
            </Badge>
            <Badge variant={getEconomicCalendarStatusVariant(entry.status)}>
              {getEconomicCalendarStatusLabel(entry.status, dictionary)}
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl leading-tight font-semibold text-foreground">
              {formatEconomicCalendarValue(
                entry.title,
                dictionary.economicCalendar.untitled
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm text-muted-foreground">
              <AppTimeMetadata icon={Landmark} className="text-sm">
                {formatMessage(dictionary.economicCalendar.currency, {
                  value: formatCurrency(
                    entry.currencyCode,
                    dictionary.common.notAvailable
                  ),
                })}
              </AppTimeMetadata>
              <AppTimeMetadata icon={CalendarClock} className="text-sm">
                {formatMessage(dictionary.economicCalendar.publishedAt, {
                  time: formatDateTime(
                    entry.scheduledAt,
                    locale,
                    dictionary,
                    timeZone
                  ),
                })}
              </AppTimeMetadata>
            </div>
            {timeZoneOffset ? (
              <p className="pt-1 text-xs text-muted-foreground">
                {formatMessage(dictionary.economicCalendar.timeZoneContext, {
                  timeZone: timeZoneOffset,
                })}
              </p>
            ) : null}
            {description ? (
              <p className="max-w-4xl pt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard
            title={dictionary.economicCalendar.actual}
            value={formatEconomicCalendarValue(
              entry.actualValue,
              dictionary.common.notAvailable
            )}
            icon={Database}
          />
          <DetailCard
            title={dictionary.economicCalendar.forecast}
            value={formatEconomicCalendarValue(
              entry.forecastValue,
              dictionary.common.notAvailable
            )}
            icon={Database}
          />
          <DetailCard
            title={dictionary.economicCalendar.previous}
            value={formatEconomicCalendarValue(
              entry.previousValue,
              dictionary.common.notAvailable
            )}
            icon={Database}
          />
          <DetailCard
            title={dictionary.economicCalendar.syncedNewest}
            valueNode={
              <AppTimeMetadata icon={RefreshCcw}>
                {formatDateTime(entry.syncedAt, locale, dictionary, timeZone)}
              </AppTimeMetadata>
            }
            icon={RefreshCcw}
          />
        </div>

        <section className="rounded-lg border border-dashed bg-muted/10">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2 tracking-wide uppercase">
                <Hash className="h-4 w-4" />
                {dictionary.economicCalendar.technicalInfo}
              </span>
              <ChevronDown className="h-4 w-4" />
            </summary>
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailCard
                title={dictionary.economicCalendar.itemIdLabel}
                value={String(entry.id)}
                icon={Hash}
              />
              <DetailCard
                title={dictionary.economicCalendar.status}
                value={getEconomicCalendarStatusLabel(entry.status, dictionary)}
                icon={Activity}
              />
              <DetailCard
                title={dictionary.economicCalendar.createdAt}
                valueNode={
                  <AppTimeMetadata icon={Clock3}>
                    {formatDateTime(
                      entry.createdDate,
                      locale,
                      dictionary,
                      timeZone
                    )}
                  </AppTimeMetadata>
                }
                icon={Clock3}
              />
              <DetailCard
                title={dictionary.economicCalendar.updatedAt}
                valueNode={
                  <AppTimeMetadata icon={RefreshCcw}>
                    {formatDateTime(
                      entry.lastModifiedDate,
                      locale,
                      dictionary,
                      timeZone
                    )}
                  </AppTimeMetadata>
                }
                icon={RefreshCcw}
              />
            </div>
          </details>
        </section>
      </div>
    </div>
  )
}

function EconomicCalendarDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-5 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  )
}
