import {
  CalendarClockIcon,
  CircleSlashIcon,
  RadarIcon,
  ShieldAlertIcon,
  WaypointsIcon,
  type LucideIcon,
} from "lucide-react"

import type {
  DashboardMarketNarrativeItemResponse,
  DashboardMarketNarrativesMetricResponse,
} from "@/app/lib/dashboard/definitions"
import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatDateTime, formatPercent } from "@/app/lib/i18n/format"
import { formatMessage } from "@/app/lib/i18n/messages"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { LocalizedLink } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"

export function MarketNarratives({
  canReadGraphView,
  dictionary,
  error,
  locale,
  metric,
}: {
  canReadGraphView: boolean
  dictionary: Dictionary
  error: string | null
  locale: AppLocale
  metric: DashboardMarketNarrativesMetricResponse | null
}) {
  const t = dictionary.workspaceOverview.marketNarratives
  const hasItems = metric?.state === "AVAILABLE" && metric.items.length > 0
  const showGraphView = hasItems && canReadGraphView

  return (
    <section aria-labelledby="dashboard-market-narratives-title">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <h2 id="dashboard-market-narratives-title">{t.title}</h2>
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
          {showGraphView ? (
            <CardAction>
              <LocalizedLink
                href="/graph-view"
                aria-label={t.graphView}
                className={buttonVariants({ variant: "ghost" })}
              >
                <WaypointsIcon data-icon="inline-start" />
                <span className="hidden sm:inline">{t.graphView}</span>
              </LocalizedLink>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {error || !metric ? (
            <MarketNarrativesState
              description={error ?? t.errorDescription}
              icon={CircleSlashIcon}
              title={t.errorTitle}
            />
          ) : metric.state === "DENIED" ? (
            <MarketNarrativesState
              description={t.deniedDescription}
              icon={ShieldAlertIcon}
              title={t.deniedTitle}
            />
          ) : metric.state === "ERROR" ? (
            <MarketNarrativesState
              description={t.errorDescription}
              icon={CircleSlashIcon}
              title={t.errorTitle}
            />
          ) : hasItems ? (
            <MarketNarrativeItems
              dictionary={dictionary}
              items={metric.items}
              locale={locale}
            />
          ) : (
            <EmptyMarketNarratives dictionary={dictionary} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export function MarketNarrativesSkeleton() {
  return (
    <section aria-hidden="true">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-40 motion-reduce:animate-none" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72 max-w-full motion-reduce:animate-none" />
          </CardDescription>
          <CardAction>
            <Skeleton className="h-9 w-9 motion-reduce:animate-none sm:w-32" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-0">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index}>
                {index > 0 ? <ItemSeparator /> : null}
                <Item>
                  <ItemMedia variant="icon">
                    <Skeleton className="size-8 rounded-full motion-reduce:animate-none" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      <Skeleton className="h-4 w-48 max-w-full motion-reduce:animate-none" />
                    </ItemTitle>
                    <div className="flex min-h-4 items-center">
                      <Skeleton className="h-4 w-full max-w-2xl motion-reduce:animate-none" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-5 w-20 rounded-full motion-reduce:animate-none" />
                      <Skeleton className="h-5 w-24 rounded-full motion-reduce:animate-none" />
                    </div>
                  </ItemContent>
                  <ItemActions>
                    <Skeleton className="h-6 w-20 rounded-full motion-reduce:animate-none" />
                  </ItemActions>
                  <ItemFooter className="flex-col items-start gap-2">
                    <Skeleton className="h-3 w-32 motion-reduce:animate-none" />
                    <Skeleton className="h-3 w-40 motion-reduce:animate-none" />
                  </ItemFooter>
                </Item>
              </div>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    </section>
  )
}

function MarketNarrativeItems({
  dictionary,
  items,
  locale,
}: {
  dictionary: Dictionary
  items: DashboardMarketNarrativeItemResponse[]
  locale: AppLocale
}) {
  return (
    <ItemGroup className="gap-0">
      {items.map((item, index) => (
        <div key={item.id} role="listitem">
          {index > 0 ? <ItemSeparator /> : null}
          <MarketNarrativeItem
            dictionary={dictionary}
            item={item}
            locale={locale}
          />
        </div>
      ))}
    </ItemGroup>
  )
}

function MarketNarrativeItem({
  dictionary,
  item,
  locale,
}: {
  dictionary: Dictionary
  item: DashboardMarketNarrativeItemResponse
  locale: AppLocale
}) {
  const t = dictionary.workspaceOverview.marketNarratives
  const title = item.title?.trim() || t.untitled
  const thesis = item.thesis?.trim() || t.thesisEmpty
  const themeTitle = item.primaryTheme.themeTitle?.trim()
  const statusVariant = item.status === "ACTIVE" ? "default" : "secondary"

  return (
    <Item>
      <ItemMedia variant="icon">
        <RadarIcon aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <h3 className="break-words">{title}</h3>
        </ItemTitle>
        <ItemDescription className="break-words">{thesis}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant={statusVariant}>{t.status[item.status]}</Badge>
      </ItemActions>
      <ItemFooter className="flex-col items-start gap-2">
        {themeTitle ? (
          <div className="flex min-w-0 flex-wrap items-baseline gap-1 text-xs">
            <span className="text-muted-foreground">{t.theme}:</span>
            <span className="break-words">{themeTitle}</span>
          </div>
        ) : null}
        {item.assets.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {t.affectedAssets}:
            </span>
            {item.assets.map((asset, assetIndex) => (
              <Badge
                key={`${asset.assetId}-${asset.relationType}-${assetIndex}`}
                variant="outline"
              >
                {asset.assetSymbol}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="flex w-full flex-wrap justify-between gap-2">
          {item.confidence !== null ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatMessage(t.confidence, {
                value: formatConfidence(item.confidence, locale),
              })}
            </span>
          ) : null}
          <AppTimeMetadata icon={CalendarClockIcon}>
            {formatMessage(t.updated, {
              time: formatDateTime(
                item.lastUpdatedAt,
                locale,
                { dateStyle: "medium", timeStyle: "short" },
                t.invalidDate
              ),
            })}
          </AppTimeMetadata>
        </div>
      </ItemFooter>
    </Item>
  )
}

function EmptyMarketNarratives({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.workspaceOverview.marketNarratives

  return (
    <Empty className="min-h-40 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RadarIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t.emptyTitle}</EmptyTitle>
        <EmptyDescription>{t.emptyDescription}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function MarketNarrativesState({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <Empty className="min-h-40 border" role="alert">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function formatConfidence(value: number, locale: AppLocale) {
  return formatPercent(value <= 1 ? value : value / 100, locale, {
    maximumFractionDigits: 0,
  })
}
