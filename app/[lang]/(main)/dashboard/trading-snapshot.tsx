import { type ReactNode } from "react"
import {
  ActivityIcon,
  CircleSlashIcon,
  NewspaperIcon,
  RadarIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import type { DashboardSummaryResponse } from "@/app/lib/dashboard/definitions"
import {
  getEconomicCalendarImpactBadgeProps,
  getEconomicCalendarImpactLabel,
} from "@/app/lib/economic-calendar/definitions"
import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatDateTime, formatNumber } from "@/app/lib/i18n/format"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export function TradingSnapshot({
  canReadMarketEvents = true,
  canReadNews = true,
  dictionary,
  error,
  locale,
  summary,
}: {
  canReadMarketEvents?: boolean
  canReadNews?: boolean
  dictionary: Dictionary
  error: string | null
  locale: AppLocale
  summary: DashboardSummaryResponse | null
}) {
  const t = dictionary.workspaceOverview.tradingSnapshot

  return (
    <section aria-labelledby="dashboard-trading-snapshot-title">
      <h2 id="dashboard-trading-snapshot-title" className="sr-only">
        {t.title}
      </h2>
      {error || !summary ? (
        <Empty className="min-h-40 border" role="alert">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleSlashIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.summaryErrorTitle}</EmptyTitle>
            <EmptyDescription>
              {error ?? t.summaryErrorDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 min-[1440px]:grid-cols-12">
          <SnapshotCard
            className="min-[1440px]:col-span-5"
            description={getNextEventDescription(summary, dictionary, locale)}
            icon={ZapIcon}
            title={t.nextEvent}
            value={getNextEventValue(summary, t)}
          />
          <SnapshotCard
            className="min-[1440px]:col-span-2"
            description={getMetricDescription(
              canReadMarketEvents ? summary.marketEvents24h.state : "DENIED",
              t.eventsWindow,
              t
            )}
            icon={ActivityIcon}
            title={t.events}
            value={getCountValue(
              canReadMarketEvents
                ? summary.marketEvents24h
                : { ...summary.marketEvents24h, state: "DENIED", count: null },
              locale,
              t
            )}
          />
          <SnapshotCard
            className="min-[1440px]:col-span-3"
            description={getMetricDescription(
              summary.activeNarratives.state,
              t.narrativesWindow,
              t
            )}
            icon={RadarIcon}
            title={t.narratives}
            value={getCountValue(summary.activeNarratives, locale, t)}
          />
          <SnapshotCard
            className="min-[1440px]:col-span-2"
            description={getMetricDescription(
              canReadNews ? summary.latestNews6h.state : "DENIED",
              t.newsWindow,
              t
            )}
            icon={NewspaperIcon}
            title={t.news}
            value={getCountValue(
              canReadNews
                ? summary.latestNews6h
                : { ...summary.latestNews6h, state: "DENIED", count: null },
              locale,
              t
            )}
          />
        </div>
      )}
    </section>
  )
}

export function TradingSnapshotSkeleton() {
  return (
    <section aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 min-[1440px]:grid-cols-12">
        {[
          "min-[1440px]:col-span-5",
          "min-[1440px]:col-span-2",
          "min-[1440px]:col-span-3",
          "min-[1440px]:col-span-2",
        ].map((className, index) => (
          <Card
            key={`snapshot-skeleton-${index}`}
            className={className}
            size="sm"
          >
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-5 w-36" />
              </CardTitle>
              <CardAction>
                <Skeleton className="size-4 rounded-full" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-4 w-full max-w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function SnapshotCard({
  className,
  description,
  icon: Icon,
  title,
  value,
}: {
  className?: string
  description: ReactNode
  icon: LucideIcon
  title: string
  value: string
}) {
  return (
    <Card className={className} size="sm">
      <CardHeader>
        <CardTitle>
          <h3>{title}</h3>
        </CardTitle>
        <CardAction>
          <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {description}
        </div>
      </CardContent>
    </Card>
  )
}

function getNextEventValue(
  summary: DashboardSummaryResponse,
  t: Dictionary["workspaceOverview"]["tradingSnapshot"]
) {
  const metric = summary.nextKeyEvent

  if (metric.state === "AVAILABLE" && metric.data?.title) {
    return metric.data.title
  }

  return getMetricStateValue(metric.state, t)
}

function getNextEventDescription(
  summary: DashboardSummaryResponse,
  dictionary: Dictionary,
  locale: AppLocale
) {
  const t = dictionary.workspaceOverview.tradingSnapshot
  const metric = summary.nextKeyEvent

  if (metric.state !== "AVAILABLE" || !metric.data) {
    return getMetricStateDescription(metric.state, t)
  }

  return (
    <>
      <span>
        {formatDateTime(
          metric.data.scheduledAt,
          locale,
          { dateStyle: "medium", timeStyle: "short" },
          t.invalidDate
        )}{" "}
        · {metric.data.currencyCode}
      </span>
      <Badge {...getEconomicCalendarImpactBadgeProps(metric.data.impact)}>
        {getEconomicCalendarImpactLabel(metric.data.impact, dictionary)}
      </Badge>
    </>
  )
}

function getCountValue(
  metric: {
    count?: number | null
    state: "AVAILABLE" | "EMPTY" | "DENIED" | "ERROR"
  },
  locale: AppLocale,
  t: Dictionary["workspaceOverview"]["tradingSnapshot"]
) {
  if (metric.state === "AVAILABLE" || metric.state === "EMPTY") {
    return metric.count === null || metric.count === undefined
      ? t.noData
      : formatNumber(metric.count, locale)
  }

  return getMetricStateValue(metric.state, t)
}

function getMetricDescription(
  state: "AVAILABLE" | "EMPTY" | "DENIED" | "ERROR",
  description: string,
  t: Dictionary["workspaceOverview"]["tradingSnapshot"]
) {
  return state === "AVAILABLE" || state === "EMPTY"
    ? description
    : getMetricStateDescription(state, t)
}

function getMetricStateValue(
  state: "AVAILABLE" | "EMPTY" | "DENIED" | "ERROR",
  t: Dictionary["workspaceOverview"]["tradingSnapshot"]
) {
  return state === "DENIED"
    ? t.unavailable
    : state === "ERROR"
      ? t.error
      : t.noData
}

function getMetricStateDescription(
  state: "AVAILABLE" | "EMPTY" | "DENIED" | "ERROR",
  t: Dictionary["workspaceOverview"]["tradingSnapshot"]
) {
  return state === "AVAILABLE" || state === "EMPTY"
    ? t.noData
    : state === "DENIED"
      ? t.deniedDescription
      : t.errorDescription
}
