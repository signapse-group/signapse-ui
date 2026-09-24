import {
  Bot,
  CalendarCheck,
  Layers3,
  ListChecks,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import type { AppLocale } from "@/app/lib/i18n/config"
import { formatDateTime, formatNumber } from "@/app/lib/i18n/format"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import type { UsageLimitsResponse } from "@/app/lib/usage-limits/definitions"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function UsageLimitsView({
  dictionary,
  locale,
  usageLimits,
}: {
  dictionary: Dictionary
  locale: AppLocale
  usageLimits: UsageLimitsResponse
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="sr-only">{dictionary.usageLimits.pageTitle}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          {dictionary.usageLimits.pageDescription}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <QuotaCard
            description={dictionary.usageLimits.workspaceDescription}
            dictionary={dictionary}
            icon={Layers3}
            locale={locale}
            quota={usageLimits.workspace}
            title={dictionary.usageLimits.workspaceTitle}
          />
          <QuotaCard
            description={dictionary.usageLimits.aiTurnsDescription}
            dictionary={dictionary}
            icon={Bot}
            locale={locale}
            quota={usageLimits.conversationTurns}
            title={dictionary.usageLimits.aiTurnsTitle}
          >
            <dl className="mt-4 grid gap-2 border-t pt-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">
                  {dictionary.usageLimits.periodStart}
                </dt>
                <dd className="font-medium">
                  {formatUtcDate(
                    usageLimits.conversationTurns.periodStartUtc,
                    locale,
                    dictionary.usageLimits.invalidDate
                  )}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">
                  {dictionary.usageLimits.resetAt} (
                  {dictionary.usageLimits.utc})
                </dt>
                <dd className="font-medium">
                  {formatUtcDate(
                    usageLimits.conversationTurns.resetAtUtc,
                    locale,
                    dictionary.usageLimits.invalidDate
                  )}
                </dd>
              </div>
            </dl>
          </QuotaCard>
          <QuotaCard
            description={dictionary.usageLimits.activeSchedulesDescription}
            dictionary={dictionary}
            icon={CalendarCheck}
            locale={locale}
            quota={usageLimits.activeSchedules}
            title={dictionary.usageLimits.activeSchedulesTitle}
          />
        </div>

        <WatchlistUsageCard
          dictionary={dictionary}
          locale={locale}
          usage={usageLimits.watchlist}
        />
      </div>
    </div>
  )
}

function QuotaCard({
  description,
  dictionary,
  icon: Icon,
  locale,
  quota,
  title,
  children,
}: {
  description: string
  dictionary: Dictionary
  icon: LucideIcon
  locale: AppLocale
  quota: { used: number; limit: number }
  title: string
  children?: ReactNode
}) {
  const isOverLimit = quota.used > quota.limit

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon aria-hidden="true" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatNumber(quota.used, locale)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatNumber(quota.limit, locale)}
            </span>
          </p>
          {isOverLimit ? (
            <Badge variant="destructive">
              {dictionary.usageLimits.overLimit}
            </Badge>
          ) : quota.used === 0 ? (
            <Badge variant="outline">{dictionary.usageLimits.zeroUsage}</Badge>
          ) : null}
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks aria-hidden="true" />
          <span>{dictionary.usageLimits.watchlistTitle}</span>
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-1">
          <span>{dictionary.usageLimits.watchlistDescription}</span>
          <span>
            ({dictionary.usageLimits.limitColumn}:{" "}
            {formatNumber(usage.limit, locale)})
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usage.workspaces.length === 0 ? (
          <Empty className="min-h-32 border">
            <EmptyHeader>
              <EmptyTitle>{dictionary.usageLimits.zeroUsage}</EmptyTitle>
              <EmptyDescription>
                {dictionary.usageLimits.noWorkspaces}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {dictionary.usageLimits.workspaceIdColumn}
                  </TableHead>
                  <TableHead className="text-right">
                    {dictionary.usageLimits.usedColumn}
                  </TableHead>
                  <TableHead className="text-right">
                    {dictionary.usageLimits.limitColumn}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.workspaces.map((workspace) => {
                  const isOverLimit = workspace.used > usage.limit

                  return (
                    <TableRow key={workspace.workspaceId}>
                      <TableCell className="font-medium tabular-nums">
                        {formatNumber(workspace.workspaceId, locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {isOverLimit ? (
                          <Badge variant="destructive">
                            {formatNumber(workspace.used, locale)}
                          </Badge>
                        ) : (
                          formatNumber(workspace.used, locale)
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(usage.limit, locale)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatUtcDate(
  value: string,
  locale: AppLocale,
  fallback: string
): string {
  return formatDateTime(
    value,
    locale,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    },
    fallback
  )
}
