import {
  ActivityIcon,
  CalendarClockIcon,
  CircleSlashIcon,
  ShieldAlertIcon,
  TargetIcon,
  WalletCardsIcon,
  WaypointsIcon,
  type LucideIcon,
} from "lucide-react"

import type {
  DashboardAssetsInFocusMetricResponse,
  DashboardAssetInFocusItemResponse,
} from "@/app/lib/dashboard/definitions"
import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatDateTime } from "@/app/lib/i18n/format"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { LocalizedLink } from "@/components/localized-link"
import { AssetCategoryBadge } from "@/components/asset-category-badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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

import {
  OverviewModuleAction,
  OverviewModuleHeader,
} from "./overview-module-header"

export function AssetsInFocus({
  canAccessMarketCharts,
  canReadGraphView,
  dictionary,
  error,
  locale,
  metric,
}: {
  canAccessMarketCharts: boolean
  canReadGraphView: boolean
  dictionary: Dictionary
  error: string | null
  locale: AppLocale
  metric: DashboardAssetsInFocusMetricResponse | null
}) {
  const t = dictionary.workspaceOverview.assetsInFocus
  const hasItems = metric?.state === "AVAILABLE" && metric.items.length > 0
  const showGraphView = canReadGraphView

  return (
    <section aria-labelledby="dashboard-assets-in-focus-title">
      <Card className="min-w-0">
        <OverviewModuleHeader>
          <CardTitle>
            <h2 id="dashboard-assets-in-focus-title">{t.title}</h2>
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
          {showGraphView ? (
            <OverviewModuleAction>
              <LocalizedLink
                href="/graph-view"
                aria-label={t.graphView}
                className={buttonVariants({ variant: "ghost" })}
              >
                <WaypointsIcon data-icon="inline-start" />
                {t.graphView}
              </LocalizedLink>
            </OverviewModuleAction>
          ) : null}
        </OverviewModuleHeader>
        <CardContent>
          {error || !metric ? (
            <AssetsInFocusState
              description={error ?? t.errorDescription}
              icon={CircleSlashIcon}
              title={t.errorTitle}
            />
          ) : metric.state === "DENIED" ? (
            <AssetsInFocusState
              description={t.deniedDescription}
              icon={ShieldAlertIcon}
              title={t.deniedTitle}
            />
          ) : metric.state === "ERROR" ? (
            <AssetsInFocusState
              description={t.errorDescription}
              icon={CircleSlashIcon}
              title={t.errorTitle}
            />
          ) : hasItems ? (
            <AssetsInFocusItems
              canAccessMarketCharts={canAccessMarketCharts}
              dictionary={dictionary}
              items={metric.items}
              locale={locale}
            />
          ) : (
            <EmptyAssetsInFocus dictionary={dictionary} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export function AssetsInFocusSkeleton() {
  return (
    <section aria-hidden="true">
      <Card className="min-w-0">
        <OverviewModuleHeader>
          <CardTitle>
            <Skeleton className="h-5 w-40 motion-reduce:animate-none" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-72 max-w-full motion-reduce:animate-none" />
          </CardDescription>
          <OverviewModuleAction>
            <Skeleton className="h-9 w-32 motion-reduce:animate-none" />
          </OverviewModuleAction>
        </OverviewModuleHeader>
        <CardContent>
          <ItemGroup className="gap-0">
            {Array.from({ length: 6 }, (_, index) => (
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
                    <Skeleton className="h-3 w-2/3 max-w-xl motion-reduce:animate-none" />
                  </ItemContent>
                  <ItemActions>
                    <Skeleton className="h-6 w-20 rounded-full motion-reduce:animate-none" />
                  </ItemActions>
                  <ItemFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <Skeleton className="h-3 w-32 motion-reduce:animate-none" />
                    <Skeleton className="h-8 w-36 motion-reduce:animate-none" />
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

function AssetsInFocusItems({
  canAccessMarketCharts,
  dictionary,
  items,
  locale,
}: {
  canAccessMarketCharts: boolean
  dictionary: Dictionary
  items: DashboardAssetInFocusItemResponse[]
  locale: AppLocale
}) {
  const t = dictionary.workspaceOverview.assetsInFocus
  const seenAssetIds = new Set<number>()
  const uniqueItems = items
    .filter(({ assetId }) => {
      if (seenAssetIds.has(assetId)) return false
      seenAssetIds.add(assetId)
      return true
    })
    .slice(0, 6)

  return (
    <ItemGroup className="gap-0">
      {uniqueItems.map((item, index) => {
        const summary = item.context.summary?.trim()

        return (
          <div key={item.assetId} role="listitem">
            {index > 0 ? <ItemSeparator /> : null}
            <Item>
              <ItemMedia variant="icon">
                <WalletCardsIcon aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <h3>
                    {item.assetSymbol} · {item.assetName}
                  </h3>
                </ItemTitle>
                <ItemDescription className="line-clamp-2">
                  {item.context.title}
                </ItemDescription>
                {summary ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {summary}
                  </p>
                ) : null}
              </ItemContent>
              <ItemActions>
                <AssetCategoryBadge type={item.assetType}>
                  {t.assetTypes[item.assetType]}
                </AssetCategoryBadge>
              </ItemActions>
              <ItemFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center">
                <AppTimeMetadata icon={CalendarClockIcon}>
                  {formatDateTime(
                    item.context.observedAt,
                    locale,
                    { dateStyle: "medium", timeStyle: "short" },
                    t.invalidDate
                  )}
                </AppTimeMetadata>
                {canAccessMarketCharts ? (
                  <LocalizedLink
                    href={`/market-charts?assetId=${item.assetId}&timeframe=1h`}
                    aria-label={`${t.marketCharts}: ${item.assetSymbol}`}
                    className={buttonVariants({
                      size: "sm",
                      variant: "ghost",
                    })}
                  >
                    <ActivityIcon data-icon="inline-start" />
                    {t.marketCharts}
                  </LocalizedLink>
                ) : null}
              </ItemFooter>
            </Item>
          </div>
        )
      })}
    </ItemGroup>
  )
}

function EmptyAssetsInFocus({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.workspaceOverview.assetsInFocus

  return (
    <Empty className="min-h-40 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TargetIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t.emptyTitle}</EmptyTitle>
        <EmptyDescription>{t.emptyDescription}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function AssetsInFocusState({
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
