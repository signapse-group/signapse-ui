import { Suspense } from "react"

import { getWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  canAccessMarketChartWorkbench,
  MARKET_CHART_WORKBENCH_PERMISSIONS,
} from "@/app/lib/market-charts/permissions"
import {
  getCurrentPermissions,
  getCurrentWorkspaceId,
} from "@/app/lib/permissions-server"
import { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"
import { AccessDenied } from "@/components/access-denied"

import { MarketChartSurfaceSkeleton } from "./market-chart-skeleton"
import { MarketChartWorkbenchClient } from "./market-chart-workbench-client"

const WATCHLIST_CHART_ASSET_SEARCH = {
  filter: "",
  page: 0,
  size: 100,
  sort: [{ field: "createdDate", direction: "desc" as const }],
}

export default function MarketChartsPage() {
  return (
    <div className="-m-5 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Suspense fallback={<MarketChartSurfaceSkeleton />}>
        <MarketChartsContent />
      </Suspense>
    </div>
  )
}

async function MarketChartsContent() {
  const [permissions, dictionary, workspaceId] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
    getCurrentWorkspaceId(),
  ])

  if (!canAccessMarketChartWorkbench(permissions)) {
    return (
      <AccessDenied
        description={dictionary.marketCharts.readDenied}
        permission={MARKET_CHART_WORKBENCH_PERMISSIONS.join(", ")}
      />
    )
  }

  let watchlistAssets: WorkspaceWatchlistAssetListItemResponse[] = []
  let watchlistError: string | null = null

  try {
    const firstPage = await getWorkspaceWatchlistAssets(
      WATCHLIST_CHART_ASSET_SEARCH
    )
    const assets = [...(firstPage.content ?? [])]

    for (let page = 1; page < firstPage.totalPages; page++) {
      const nextPage = await getWorkspaceWatchlistAssets({
        ...WATCHLIST_CHART_ASSET_SEARCH,
        page,
      })
      assets.push(...(nextPage.content ?? []))
    }

    watchlistAssets = assets
  } catch (error: unknown) {
    watchlistError =
      error instanceof Error
        ? error.message
        : dictionary.marketCharts.watchlistLoadError
  }

  return (
    <MarketChartWorkbenchClient
      watchlistAssets={watchlistAssets}
      watchlistError={watchlistError}
      workspaceId={workspaceId}
    />
  )
}
