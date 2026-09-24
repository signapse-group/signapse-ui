import {
  CalendarClock,
  Gauge,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import type { UsageLimitsResponse } from "@/app/lib/usage-limits/definitions"
import type { AppLocale } from "@/app/lib/i18n/config"
import { formatDateTime, formatNumber } from "@/app/lib/i18n/format"
import { formatMessage } from "@/app/lib/i18n/messages"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface UsageLimitsViewProps {
  dictionary: Dictionary
  locale: AppLocale
  usageLimits: UsageLimitsResponse
}

interface UsageMetricCardProps {
  dictionary: Dictionary
  icon: LucideIcon
  locale: AppLocale
  metric: { used: number; limit: number }
  title: string
  description: string
}

export function UsageLimitsView({
  dictionary,
  locale,
  usageLimits,
}: UsageLimitsViewProps) {
  const resetAt = formatDateTime(
    usageLimits.conversationTurns.resetAtUtc,
    locale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    },
    dictionary.usageLimits.invalidResetTime
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dictionary.usageLimits.title}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {dictionary.usageLimits.description}
        </p>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UsageMetricCard
          dictionary={dictionary}
          description={dictionary.usageLimits.workspaceDescription}
          icon={Gauge}
          locale={locale}
          metric={usageLimits.workspace}
          title={dictionary.usageLimits.workspaceTitle}
        />
        <UsageMetricCard
          dictionary={dictionary}
          description={dictionary.usageLimits.conversationTurnsDescription}
          icon={Sparkles}
          locale={locale}
          metric={usageLimits.conversationTurns}
          title={dictionary.usageLimits.conversationTurnsTitle}
        >
          <p className="text-xs text-muted-foreground">
            {dictionary.usageLimits.resetAtLabel}:{" "}
            <time dateTime={usageLimits.conversationTurns.resetAtUtc}>
              {resetAt}
            </time>
          </p>
        </UsageMetricCard>
        <UsageMetricCard
          dictionary={dictionary}
          description={dictionary.usageLimits.activeSchedulesDescription}
          icon={CalendarClock}
          locale={locale}
          metric={usageLimits.activeSchedules}
          title={dictionary.usageLimits.activeSchedulesTitle}
        />
        <WatchlistUsageCard
          dictionary={dictionary}
          locale={locale}
          usage={usageLimits.watchlist}
        />
      </div>
    </div>
  )
}

function UsageMetricCard({
  children,
  dictionary,
  description,
  icon: Icon,
  locale,
  metric,
  title,
}: UsageMetricCardProps & { children?: ReactNode }) {
  const overLimit = metric.used > metric.limit
  const progress =
    metric.limit > 0 ? Math.min(100, (metric.used / metric.limit) * 100) : 0

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </div>
          {overLimit ? (
            <Badge variant="destructive">
              {dictionary.usageLimits.overLimit}
            </Badge>
          ) : null}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tracking-tight">
            {formatNumber(metric.used, locale)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {formatNumber(metric.limit, locale)}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={
              overLimit ? "h-full bg-destructive" : "h-full bg-primary"
            }
            style={{ width: `${progress}%` }}
          />
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function WatchlistUsageCard({
  dictionary,
  locale,
  usage,
}: {
  dictionary: Dictionary
  locale: AppLocale
  usage: UsageLimitsResponse["watchlist"]
}) {
  return (
    <Card className="min-w-0 md:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ListChecks aria-hidden="true" className="size-4" />
          </div>
          <Badge variant="secondary">
            {formatMessage(dictionary.usageLimits.perWorkspace, {
              limit: formatNumber(usage.limit, locale),
            })}
          </Badge>
        </div>
        <CardTitle>{dictionary.usageLimits.watchlistTitle}</CardTitle>
        <CardDescription>
          {dictionary.usageLimits.watchlistDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usage.workspaces.length > 0 ? (
          <div className="divide-y rounded-lg border" role="list">
            {usage.workspaces.map((workspace) => {
              const overLimit = workspace.used > usage.limit

              return (
                <div
                  className="flex min-w-0 items-center justify-between gap-4 px-3 py-3"
                  key={workspace.workspaceId}
                  role="listitem"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ListChecks
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate text-sm">
                      {formatMessage(dictionary.usageLimits.workspaceLabel, {
                        id: workspace.workspaceId,
                      })}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {formatNumber(workspace.used, locale)}
                      <span className="font-sans text-muted-foreground">
                        {` / ${formatNumber(usage.limit, locale)}`}
                      </span>
                    </span>
                    {overLimit ? (
                      <Badge variant="destructive">
                        {dictionary.usageLimits.overLimit}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {dictionary.usageLimits.noWorkspaces}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
