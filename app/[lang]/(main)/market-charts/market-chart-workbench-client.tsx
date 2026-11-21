"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

import { useLocalization } from "@/app/lib/i18n/provider"
import { CURRENT_WORKSPACE_CHANGED_EVENT } from "@/app/lib/workspaces/events"

import {
  DEFAULT_MARKET_CHART_TIMEFRAME,
  isMarketChartTimeframe,
  type MarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import { createMarketChartInitialLoadObserver } from "./market-chart-initial-load-observability"
import {
  createInitialMarketChartCandleLoad,
  type MarketChartInitialCandleLoad,
} from "./market-chart-candle-client"
import type { MarketChartWorkbenchProps } from "./market-chart-workbench"
import { MarketChartSurfaceSkeleton } from "./market-chart-skeleton"

const MarketChartWorkbench = dynamic(
  () =>
    import("./market-chart-workbench").then(
      (module) => module.MarketChartWorkbench
    ),
  {
    ssr: false,
    loading: () => <MarketChartSurfaceSkeleton />,
  }
)

export function MarketChartWorkbenchClient(props: MarketChartWorkbenchProps) {
  const watchlistIdentity = props.watchlistAssets
    .map((asset) => `${asset.id}:${asset.assetId}`)
    .join(",")
  const [pendingWorkspaceSwitch, setPendingWorkspaceSwitch] = useState<{
    fromWorkspaceId: number | null
    fromWatchlistIdentity: string
    fromWatchlistAssets: MarketChartWorkbenchProps["watchlistAssets"]
    fromWatchlistError: string | null
    toWorkspaceId: number
  } | null>(null)

  useEffect(() => {
    function handleWorkspaceChange(event: Event) {
      const workspaceId = (event as CustomEvent<{ workspaceId: number }>).detail
        ?.workspaceId

      if (typeof workspaceId !== "number") {
        return
      }

      setPendingWorkspaceSwitch({
        fromWorkspaceId: props.workspaceId ?? null,
        fromWatchlistIdentity: watchlistIdentity,
        fromWatchlistAssets: props.watchlistAssets,
        fromWatchlistError: props.watchlistError,
        toWorkspaceId: workspaceId,
      })
    }

    window.addEventListener(
      CURRENT_WORKSPACE_CHANGED_EVENT,
      handleWorkspaceChange
    )

    return () => {
      window.removeEventListener(
        CURRENT_WORKSPACE_CHANGED_EVENT,
        handleWorkspaceChange
      )
    }
  }, [
    props.watchlistAssets,
    props.watchlistError,
    props.workspaceId,
    watchlistIdentity,
  ])

  const workspaceId = props.workspaceId ?? null
  if (
    pendingWorkspaceSwitch &&
    workspaceId === pendingWorkspaceSwitch.fromWorkspaceId &&
    watchlistIdentity === pendingWorkspaceSwitch.fromWatchlistIdentity &&
    props.watchlistAssets === pendingWorkspaceSwitch.fromWatchlistAssets &&
    props.watchlistError === pendingWorkspaceSwitch.fromWatchlistError &&
    workspaceId !== pendingWorkspaceSwitch.toWorkspaceId
  ) {
    return <MarketChartSurfaceSkeleton />
  }

  const workbenchKey = `${workspaceId ?? "none"}:${props.watchlistError ? "error" : "ready"}:${watchlistIdentity}`

  return (
    <WorkspaceBoundWorkbench
      key={workbenchKey}
      {...props}
      workspaceId={workspaceId}
    />
  )
}

function WorkspaceBoundWorkbench(props: MarketChartWorkbenchProps) {
  const searchParams = useSearchParams()
  const { dictionary } = useLocalization()
  const [initialLoadObserver] = useState(() =>
    createMarketChartInitialLoadObserver()
  )
  const [initialCandleLoad] = useState(() =>
    getInitialCandleLoad(props, searchParams)
  )
  const loadError = dictionary.marketCharts.loadError
  const responseInvalid = dictionary.marketCharts.responseInvalid

  useEffect(() => {
    if (!initialCandleLoad) {
      return
    }

    initialLoadObserver.start(0)
    initialCandleLoad.start({ loadError, responseInvalid })

    return () => initialLoadObserver.cancelCurrent()
  }, [initialCandleLoad, initialLoadObserver, loadError, responseInvalid])

  return (
    <MarketChartWorkbench
      {...props}
      initialCandleLoad={initialCandleLoad}
      initialLoadObserver={initialLoadObserver}
    />
  )
}

function getInitialCandleLoad(
  props: MarketChartWorkbenchProps,
  searchParams: Pick<URLSearchParams, "get">
): MarketChartInitialCandleLoad | null {
  if (props.watchlistError !== null) {
    return null
  }

  const timeframeParam = searchParams.get("timeframe")?.trim() || null
  const timeframe: MarketChartTimeframe | null = timeframeParam
    ? isMarketChartTimeframe(timeframeParam)
      ? timeframeParam
      : null
    : DEFAULT_MARKET_CHART_TIMEFRAME

  if (!timeframe) {
    return null
  }

  const assetIdParam = searchParams.get("assetId")?.trim() || null
  const asset = assetIdParam
    ? props.watchlistAssets.find(
        (watchlistAsset) => String(watchlistAsset.assetId) === assetIdParam
      )
    : props.watchlistAssets[0]

  if (!asset) {
    return null
  }

  return createInitialMarketChartCandleLoad({
    workspaceId: props.workspaceId ?? null,
    assetId: asset.assetId,
    timeframe,
  })
}
