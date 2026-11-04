import { Suspense, type ReactNode } from "react"
import {
  CalendarClockIcon,
  CircleSlashIcon,
  FolderOpenIcon,
  ShieldAlertIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react"

import { getDashboardSummary } from "@/app/api/dashboard/action"
import { getNewsArticles } from "@/app/api/news-articles/action"
import { getWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import { getMyWorkspaces } from "@/app/api/workspaces/action"
import type { DashboardSummaryResponse } from "@/app/lib/dashboard/definitions"
import type { AppLocale } from "@/app/lib/i18n/config"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { canReadGraphView } from "@/app/lib/graph-view/permissions"
import {
  formatDateTime as formatLocalizedDateTime,
  formatNumber,
} from "@/app/lib/i18n/format"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { getRequestTimeZone } from "@/app/lib/i18n/time-zone-server"
import { canAccessMarketChartWorkbench } from "@/app/lib/market-charts/permissions"
import { observeDashboardLoad } from "@/app/lib/observability/journeys"
import type { NewsArticleListResponse } from "@/app/lib/news-articles/definitions"
import { canReadNewsArticles } from "@/app/lib/news-articles/permissions"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { resolveActiveWorkspace } from "@/app/lib/workspaces/active"
import type { WorkspaceResponse } from "@/app/lib/workspaces/definitions"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Badge } from "@/components/ui/badge"
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
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"

import { TradingSnapshot, TradingSnapshotSkeleton } from "./trading-snapshot"
import { AssetsInFocus, AssetsInFocusSkeleton } from "./assets-in-focus"
import { EventTimeline, EventTimelineSkeleton } from "./event-timeline"
import { LatestNews, LatestNewsSkeleton } from "./latest-news"
import { NewsArticleTimeZoneSync } from "../news-articles/news-article-time-zone-sync"
import { MarketNarratives, MarketNarrativesSkeleton } from "./market-narratives"
import { DashboardQuickDetailProvider } from "./dashboard-quick-detail"
import { WorkspaceOverviewActions } from "../workspace-overview-actions"

const PAGE_SIZE = 2000

const WORKSPACE_SEARCH = {
  filter: "",
  page: 0,
  size: PAGE_SIZE,
  sort: [{ field: "id", direction: "asc" as const }],
}

const WATCHLIST_SEARCH = {
  filter: "",
  page: 0,
  size: PAGE_SIZE,
  sort: [{ field: "createdDate", direction: "desc" as const }],
}

const LATEST_NEWS_SEARCH = {
  filter: "",
  page: 0,
  size: 5,
  sort: [{ field: "publishedAt", direction: "desc" as const }],
}

interface WatchlistState {
  assets: WorkspaceWatchlistAssetListItemResponse[]
  error: string | null
  total: number | null
}

interface CurrentWorkspaceState {
  error: string | null
  workspace: WorkspaceResponse | null
}

interface DashboardSummaryState {
  error: string | null
  summary: DashboardSummaryResponse | null
  scopeMismatch: boolean
}

interface LatestNewsState {
  articles: NewsArticleListResponse[]
  error: string | null
}

export default function Page() {
  return (
    <Suspense fallback={<WorkspaceOverviewSkeleton />}>
      <WorkspaceOverview />
    </Suspense>
  )
}

async function WorkspaceOverview() {
  return observeDashboardLoad(loadWorkspaceOverview)
}

async function loadWorkspaceOverview() {
  const [permissions, locale, requestTimeZone] = await Promise.all([
    getCurrentPermissions(),
    getRequestLocale(),
    getRequestTimeZone(),
  ])
  const dictionary = await getDictionary(locale)
  const canReadWorkspace = hasPermission(permissions, "workspace:read")
  const canReadAsset = hasPermission(permissions, "asset:read")
  const canReadWatchlist = hasPermission(permissions, "watchlist:read")
  const canReadEventData =
    canReadWorkspace &&
    canReadAsset &&
    canReadWatchlist &&
    hasPermission(permissions, "event:read")
  const canReadNews = canReadNewsArticles(permissions)
  const canReadGraph = canReadGraphView(permissions)
  const canAccessMarketCharts = canAccessMarketChartWorkbench(permissions)
  const canCreateWatchlist = hasPermission(permissions, "watchlist:create")
  const canDeleteWatchlist = hasPermission(permissions, "watchlist:delete")

  const [workspaceState, latestNews] = await Promise.all([
    canReadWorkspace
      ? loadCurrentWorkspace(dictionary)
      : Promise.resolve({ error: null, workspace: null }),
    loadLatestNews(canReadNews, dictionary),
  ])

  const currentWorkspace = workspaceState.workspace
  let watchlist: WatchlistState = { assets: [], error: null, total: null }
  let dashboardSummary: DashboardSummaryState = {
    error: null,
    summary: null,
    scopeMismatch: false,
  }
  let scopeChanged = false

  if (!canReadWorkspace) {
    dashboardSummary.error = dictionary.workspaceOverview.noReadDescription
  } else if (workspaceState.error) {
    dashboardSummary.error = workspaceState.error
  } else if (!currentWorkspace) {
    dashboardSummary.error = dictionary.workspaceOverview.noActiveDescription
  } else {
    const [watchlistResult, summaryResult] = await Promise.all([
      loadWorkspaceWatchlist(canReadAsset && canReadWatchlist, dictionary),
      loadDashboardSummary(currentWorkspace.id, dictionary),
    ])
    const currentWorkspaceAfterLoad = await loadCurrentWorkspace(dictionary)
    const summaryWatchlistCount =
      summaryResult.summary?.scope.watchlistAssetCount ?? null
    const watchlistScopeMismatch =
      canReadAsset &&
      canReadWatchlist &&
      !watchlistResult.error &&
      summaryWatchlistCount !== null &&
      summaryWatchlistCount !== watchlistResult.total
    scopeChanged =
      summaryResult.scopeMismatch ||
      watchlistScopeMismatch ||
      currentWorkspaceAfterLoad.error !== null ||
      currentWorkspaceAfterLoad.workspace?.id !== currentWorkspace.id

    if (scopeChanged) {
      const scopeError = dictionary.workspaceOverview.scopeChangedDescription
      dashboardSummary = {
        error: scopeError,
        summary: null,
        scopeMismatch: true,
      }
      watchlist = { assets: [], error: scopeError, total: null }
    } else {
      watchlist = watchlistResult
      dashboardSummary = summaryResult
    }
  }

  const canShowWorkspaceData =
    canReadWorkspace &&
    currentWorkspace !== null &&
    !workspaceState.error &&
    !scopeChanged
  const workspaceNotice = !canReadWorkspace
    ? {
        title: dictionary.workspaceOverview.noReadTitle,
        description: dictionary.workspaceOverview.noReadDescription,
        icon: ShieldAlertIcon,
      }
    : workspaceState.error
      ? {
          title: dictionary.workspaceOverview.overviewLoadErrorTitle,
          description: workspaceState.error,
          icon: CircleSlashIcon,
        }
      : scopeChanged
        ? {
            title: dictionary.workspaceOverview.scopeChangedTitle,
            description: dictionary.workspaceOverview.scopeChangedDescription,
            icon: CircleSlashIcon,
          }
        : !currentWorkspace
          ? {
              title: dictionary.workspaceOverview.noActiveTitle,
              description: dictionary.workspaceOverview.noActiveDescription,
              icon: FolderOpenIcon,
            }
          : null

  const eventTimelineError = !canReadEventData
    ? null
    : scopeChanged
      ? dictionary.workspaceOverview.scopeChangedDescription
      : (workspaceState.error ??
        (!currentWorkspace
          ? dictionary.workspaceOverview.eventTimeline
              .workspaceRequiredDescription
          : dashboardSummary.error))

  return (
    <WorkspaceOverviewShell>
      <>
        {workspaceNotice ? (
          <WorkspaceOverviewNotice
            description={workspaceNotice.description}
            icon={workspaceNotice.icon}
            title={workspaceNotice.title}
          />
        ) : currentWorkspace ? (
          <WorkspaceOverviewPanel
            workspace={currentWorkspace}
            watchlist={watchlist}
            canReadAsset={canReadAsset}
            canReadWatchlist={canReadWatchlist}
            canCreateWatchlist={canCreateWatchlist}
            canDeleteWatchlist={canDeleteWatchlist}
            dictionary={dictionary}
            locale={locale}
          />
        ) : null}
        <TradingSnapshot
          canReadMarketEvents={canReadEventData}
          canReadNews={canReadNews}
          dictionary={dictionary}
          error={dashboardSummary.error}
          locale={locale}
          summary={dashboardSummary.summary}
        />
        <DashboardQuickDetailProvider>
          <div className="grid min-w-0 gap-4 min-[1440px]:grid-cols-12">
            <div className="min-w-0 min-[1440px]:col-span-8">
              <EventTimeline
                denied={!canReadEventData}
                dictionary={dictionary}
                error={eventTimelineError}
                locale={locale}
                metric={dashboardSummary.summary?.recentEvents ?? null}
              />
            </div>
            <div className="min-w-0 min-[1440px]:col-span-4">
              <NewsArticleTimeZoneSync
                timeZone={requestTimeZone.timeZone}
                timeZoneKnown={requestTimeZone.known}
                fallback={<LatestNewsSkeleton />}
              >
                <LatestNews
                  articles={latestNews.articles}
                  denied={!canReadNews}
                  dictionary={dictionary}
                  error={latestNews.error}
                  locale={locale}
                  timeZone={requestTimeZone.timeZone}
                />
              </NewsArticleTimeZoneSync>
            </div>
          </div>
        </DashboardQuickDetailProvider>
        {canShowWorkspaceData ? (
          <div className="grid min-w-0 gap-4 min-[1440px]:grid-cols-12">
            <div className="min-w-0 min-[1440px]:col-span-7">
              <AssetsInFocus
                canAccessMarketCharts={canAccessMarketCharts}
                canReadGraphView={canReadGraph}
                dictionary={dictionary}
                error={dashboardSummary.error}
                locale={locale}
                metric={dashboardSummary.summary?.assetsInFocus ?? null}
              />
            </div>
            <div className="min-w-0 min-[1440px]:col-span-5">
              <MarketNarratives
                canReadGraphView={canReadGraph}
                dictionary={dictionary}
                error={dashboardSummary.error}
                locale={locale}
                metric={dashboardSummary.summary?.marketNarratives ?? null}
              />
            </div>
          </div>
        ) : null}
      </>
    </WorkspaceOverviewShell>
  )
}

async function loadCurrentWorkspace(
  dictionary: Dictionary
): Promise<CurrentWorkspaceState> {
  try {
    const workspaces: WorkspaceResponse[] = []
    let page = 0
    let totalPages = 1
    let totalElements: number | null = null

    while (page < totalPages) {
      const response = await getMyWorkspaces({ ...WORKSPACE_SEARCH, page })
      if (
        !Array.isArray(response?.content) ||
        !Number.isInteger(response.totalPages) ||
        response.totalPages < 0 ||
        !Number.isInteger(response.totalElements) ||
        response.totalElements < 0 ||
        typeof response.last !== "boolean" ||
        response.content.some(
          (workspace) =>
            !Number.isInteger(workspace?.id) ||
            typeof workspace.currentWorkspace !== "boolean"
        )
      ) {
        throw new Error(dictionary.workspaceOverview.workspaceLoadError)
      }
      if (totalElements !== null && response.totalElements !== totalElements) {
        throw new Error(dictionary.workspaceOverview.workspaceLoadError)
      }

      totalElements ??= response.totalElements
      workspaces.push(...response.content)
      totalPages = response.totalPages
      if (response.last) break
      if (response.content.length === 0 || page + 1 >= totalPages) {
        throw new Error(dictionary.workspaceOverview.workspaceLoadError)
      }
      page += 1
    }

    if (totalElements === null || workspaces.length !== totalElements) {
      throw new Error(dictionary.workspaceOverview.workspaceLoadError)
    }

    const selectedWorkspaces = workspaces.filter(
      (workspace) => workspace.currentWorkspace
    )
    if (selectedWorkspaces.length > 1) {
      throw new Error(dictionary.workspaceOverview.workspaceLoadError)
    }

    return {
      error: null,
      workspace: resolveActiveWorkspace(workspaces),
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : dictionary.workspaceOverview.workspaceLoadError,
      workspace: null,
    }
  }
}

async function loadWorkspaceWatchlist(
  canReadTrackedAssets: boolean,
  dictionary: Dictionary
): Promise<WatchlistState> {
  if (!canReadTrackedAssets) {
    return { assets: [], error: null, total: null }
  }

  try {
    const assets: WorkspaceWatchlistAssetListItemResponse[] = []
    let page = 0
    let totalPages = 1
    let totalElements: number | null = null
    let expectedTotalPages: number | null = null

    while (page < totalPages) {
      const response = await getWorkspaceWatchlistAssets({
        ...WATCHLIST_SEARCH,
        page,
      })
      if (
        !Array.isArray(response?.content) ||
        !Number.isInteger(response.totalPages) ||
        response.totalPages < 0 ||
        !Number.isInteger(response.totalElements) ||
        response.totalElements < 0 ||
        typeof response.last !== "boolean"
      ) {
        throw new Error(dictionary.workspaceOverview.watchlistLoadError)
      }
      if (totalElements !== null && response.totalElements !== totalElements) {
        throw new Error(dictionary.workspaceOverview.watchlistLoadError)
      }
      if (
        expectedTotalPages !== null &&
        response.totalPages !== expectedTotalPages
      ) {
        throw new Error(dictionary.workspaceOverview.watchlistLoadError)
      }

      totalElements ??= response.totalElements
      expectedTotalPages ??= response.totalPages
      totalPages = response.totalPages
      assets.push(...response.content)

      if (response.last) break
      if (response.content.length === 0 || page + 1 >= totalPages) {
        throw new Error(dictionary.workspaceOverview.watchlistLoadError)
      }
      page += 1
    }

    if (totalElements === null || assets.length !== totalElements) {
      throw new Error(dictionary.workspaceOverview.watchlistLoadError)
    }

    return { assets, error: null, total: totalElements }
  } catch (error: unknown) {
    return {
      assets: [],
      error:
        error instanceof Error
          ? error.message
          : dictionary.workspaceOverview.watchlistLoadError,
      total: null,
    }
  }
}

async function loadDashboardSummary(
  workspaceId: number,
  dictionary: Dictionary
): Promise<DashboardSummaryState> {
  try {
    const summary = await getDashboardSummary()
    if (summary.scope.workspaceId !== workspaceId) {
      return {
        error: dictionary.workspaceOverview.scopeChangedDescription,
        summary: null,
        scopeMismatch: true,
      }
    }

    return {
      error: null,
      summary,
      scopeMismatch: false,
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : dictionary.workspaceOverview.tradingSnapshot
              .summaryErrorDescription,
      summary: null,
      scopeMismatch: false,
    }
  }
}

async function loadLatestNews(
  canReadNews: boolean,
  dictionary: Dictionary
): Promise<LatestNewsState> {
  if (!canReadNews) {
    return { articles: [], error: null }
  }

  try {
    const response = await getNewsArticles(LATEST_NEWS_SEARCH)
    if (!Array.isArray(response?.content)) {
      throw new Error(dictionary.workspaceOverview.latestNews.errorDescription)
    }
    return {
      articles: (response.content ?? []).slice(0, LATEST_NEWS_SEARCH.size),
      error: null,
    }
  } catch (error: unknown) {
    return {
      articles: [],
      error:
        error instanceof Error
          ? error.message
          : dictionary.workspaceOverview.latestNews.errorDescription,
    }
  }
}

function WorkspaceOverviewShell({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4 sm:gap-6">{children}</div>
}

function WorkspaceOverviewPanel({
  workspace,
  watchlist,
  canReadAsset,
  canReadWatchlist,
  canCreateWatchlist,
  canDeleteWatchlist,
  dictionary,
  locale,
}: {
  workspace: WorkspaceResponse
  watchlist: WatchlistState
  canReadAsset: boolean
  canReadWatchlist: boolean
  canCreateWatchlist: boolean
  canDeleteWatchlist: boolean
  dictionary: Dictionary
  locale: AppLocale
}) {
  const canReadTrackedAssets = canReadAsset && canReadWatchlist
  const canManageTrackedAssets =
    canReadTrackedAssets && canCreateWatchlist && canDeleteWatchlist
  const hasAssets = watchlist.assets.length > 0

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl font-semibold tracking-tight">
            {workspace.name}
          </h2>
        </CardTitle>
        <CardDescription>
          {dictionary.workspaceOverview.description}
        </CardDescription>
        {canManageTrackedAssets ? (
          <CardAction>
            <WorkspaceOverviewActions
              workspace={workspace}
              canReadAsset={canReadAsset}
              canReadWatchlist={canReadWatchlist}
              canCreateWatchlist={canCreateWatchlist}
              canDeleteWatchlist={canDeleteWatchlist}
              variant="outline"
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <AppTimeMetadata icon={CalendarClockIcon}>
            {formatWorkspaceOverviewDateTime(
              workspace.lastModifiedDate,
              dictionary,
              locale
            )}
          </AppTimeMetadata>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id="dashboard-workspace-assets-label"
                className="text-sm font-medium"
              >
                {dictionary.workspaceOverview.trackedAssets}
              </h3>
              {canReadTrackedAssets &&
              !watchlist.error &&
              watchlist.total !== null ? (
                <Badge variant="secondary">
                  {formatNumber(watchlist.total, locale)}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {dictionary.workspaceOverview.trackedAssetsDescription}
            </p>
          </div>

          {!canReadTrackedAssets ? (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldAlertIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {dictionary.workspaceOverview.trackedAssetsDeniedTitle}
                </EmptyTitle>
                <EmptyDescription>
                  {dictionary.workspaceOverview.trackedAssetsDeniedDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {canReadTrackedAssets && watchlist.error ? (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleSlashIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {dictionary.workspaceOverview.trackedAssetsLoadErrorTitle}
                </EmptyTitle>
                <EmptyDescription>{watchlist.error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {canReadTrackedAssets && !watchlist.error && !hasAssets ? (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TargetIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {dictionary.workspaceOverview.noTrackedAssetsTitle}
                </EmptyTitle>
                <EmptyDescription>
                  {dictionary.workspaceOverview.noTrackedAssetsDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {canReadTrackedAssets && !watchlist.error && hasAssets ? (
            <ItemGroup
              aria-labelledby="dashboard-workspace-assets-label"
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {watchlist.assets.map((asset) => (
                <Item
                  key={asset.id}
                  role="listitem"
                  size="sm"
                  variant="outline"
                >
                  <ItemContent className="min-w-0">
                    <ItemTitle className="line-clamp-none break-words">
                      {asset.assetName}
                    </ItemTitle>
                    <ItemDescription>
                      <span className="font-mono">{asset.assetSymbol}</span>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="shrink-0">
                    <Badge variant="secondary">{asset.assetType}</Badge>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function WorkspaceOverviewSkeleton() {
  return (
    <WorkspaceOverviewShell>
      <>
        <Card size="sm">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-7 w-full max-w-md" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-full max-w-3xl" />
            </CardDescription>
            <CardAction>
              <Skeleton className="h-9 w-44" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-lg" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <TradingSnapshotSkeleton />
        <div className="grid min-w-0 gap-4 min-[1440px]:grid-cols-12">
          <div className="min-w-0 min-[1440px]:col-span-8">
            <EventTimelineSkeleton />
          </div>
          <div className="min-w-0 min-[1440px]:col-span-4">
            <LatestNewsSkeleton />
          </div>
        </div>
        <div className="grid min-w-0 gap-4 min-[1440px]:grid-cols-12">
          <div className="min-w-0 min-[1440px]:col-span-7">
            <AssetsInFocusSkeleton />
          </div>
          <div className="min-w-0 min-[1440px]:col-span-5">
            <MarketNarrativesSkeleton />
          </div>
        </div>
      </>
    </WorkspaceOverviewShell>
  )
}

function WorkspaceOverviewNotice({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <Empty className="min-h-[240px] border">
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

function formatWorkspaceOverviewDateTime(
  value: string | null | undefined,
  dictionary: Dictionary,
  locale: AppLocale
) {
  if (!value) {
    return dictionary.workspaceOverview.noData
  }

  return formatLocalizedDateTime(
    value,
    locale,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
    dictionary.workspaceOverview.invalidDate
  )
}
