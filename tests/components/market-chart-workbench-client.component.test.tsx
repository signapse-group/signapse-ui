// @vitest-environment jsdom

import React from "react"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CURRENT_WORKSPACE_CHANGED_EVENT } from "@/app/lib/workspaces/events"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"

const { routeSearchParams, dynamicControl } = vi.hoisted(() => ({
  routeSearchParams: {
    current: new URLSearchParams("timeframe=1h"),
  },
  dynamicControl: {
    loadStarted: false,
    loadCount: 0,
    resolvedLoadCount: 0,
    resolve: null as null | (() => void),
  },
}))

type FakeCandleResult =
  | { success: true; data: { asset: { id: number } } }
  | { success: false; error: string }

type FakeInitialCandleLoad = {
  promise: Promise<FakeCandleResult>
  start(messages: { loadError: string; responseInvalid: string }): void
}

type Deferred<T> = {
  promise: Promise<T>
  resolve(value: T): void
}

vi.mock("next/navigation", () => ({
  useSearchParams: () => routeSearchParams.current,
}))

vi.mock("next/dynamic", async () => {
  const ReactModule = await import("react")
  type DynamicProps = Record<string, unknown>
  type DynamicComponent = React.ComponentType<DynamicProps>

  return {
    default: (
      loader: () => Promise<unknown>,
      options: { loading: () => React.ReactNode }
    ) => {
      function DeferredDynamicComponent(props: DynamicProps) {
        const [LoadedComponent, setLoadedComponent] =
          ReactModule.useState<DynamicComponent | null>(null)

        ReactModule.useEffect(() => {
          dynamicControl.loadStarted = true
          dynamicControl.loadCount += 1
          const loadNumber = dynamicControl.loadCount
          let active = true

          void loader().then((moduleValue) => {
            if (!active) {
              return
            }

            const Component = moduleValue as DynamicComponent
            dynamicControl.resolve = () => {
              setLoadedComponent(() => Component)
            }
            dynamicControl.resolvedLoadCount = loadNumber
          })

          return () => {
            active = false
          }
        }, [loader])

        return LoadedComponent
          ? ReactModule.createElement(LoadedComponent, props)
          : options.loading()
      }

      return DeferredDynamicComponent
    },
  }
})

vi.mock("@/app/[lang]/(main)/market-charts/market-chart-skeleton", async () => {
  const ReactModule = await import("react")
  return {
    MarketChartSurfaceSkeleton: () =>
      ReactModule.createElement("div", { "data-testid": "chart-skeleton" }),
  }
})

vi.mock(
  "@/app/[lang]/(main)/market-charts/market-chart-workbench",
  async () => {
    const ReactModule = await import("react")

    function MarketChartWorkbench({
      initialCandleLoad,
    }: {
      initialCandleLoad?: FakeInitialCandleLoad | null
    }) {
      const [assetId, setAssetId] = ReactModule.useState<number | null>(null)

      ReactModule.useEffect(() => {
        if (!initialCandleLoad) {
          return
        }

        let active = true
        initialCandleLoad.start({
          loadError: "Candle request failed",
          responseInvalid: "Candle response invalid",
        })
        void initialCandleLoad.promise.then((result) => {
          if (active && result.success) {
            setAssetId(result.data.asset.id)
          }
        })

        return () => {
          active = false
        }
      }, [initialCandleLoad])

      return ReactModule.createElement(
        "output",
        { "data-testid": "chart-data" },
        assetId ?? "pending"
      )
    }

    return { MarketChartWorkbench }
  }
)

import { MarketChartWorkbenchClient } from "@/app/[lang]/(main)/market-charts/market-chart-workbench-client"

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

const btc: WorkspaceWatchlistAssetListItemResponse = {
  id: 1,
  assetId: 101,
  assetName: "Bitcoin",
  assetSymbol: "BTC/USDT",
  assetType: "CRYPTO",
  createdDate: "2026-01-01T00:00:00.000Z",
}

const gold: WorkspaceWatchlistAssetListItemResponse = {
  id: 2,
  assetId: 102,
  assetName: "Gold",
  assetSymbol: "XAUUSD",
  assetType: "COMMODITY",
  createdDate: "2026-01-02T00:00:00.000Z",
}

function createCandleResponse(assetId: number) {
  const asset = [btc, gold].find((candidate) => candidate.assetId === assetId)!

  return {
    success: true,
    data: {
      provider: "fixture",
      symbol: asset.assetSymbol,
      asset: {
        id: asset.assetId,
        name: asset.assetName,
        symbol: asset.assetSymbol,
        type: asset.assetType,
        pricePrecision: 2,
      },
      timeframe: "1h",
      from: "2026-08-23T00:00:00.000Z",
      to: "2026-08-23T01:00:00.000Z",
      candles: [
        {
          time: "2026-08-23T00:00:00.000Z",
          open: 1,
          high: 2,
          low: 0.5,
          close: 1.5,
          volume: 100,
          partial: false,
        },
      ],
    },
  }
}

function renderClient({
  workspaceId = 7,
  watchlistAssets = [btc, gold],
  watchlistError = null,
}: {
  workspaceId?: number | null
  watchlistAssets?: WorkspaceWatchlistAssetListItemResponse[]
  watchlistError?: string | null
} = {}) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <MarketChartWorkbenchClient
        workspaceId={workspaceId}
        watchlistAssets={watchlistAssets}
        watchlistError={watchlistError}
      />
    </LocalizationProvider>
  )
}

function installDeferredFetch() {
  const requests: Deferred<Response>[] = []
  const fetchMock = vi.fn<typeof fetch>(() => {
    const request = createDeferred<Response>()
    requests.push(request)
    return request.promise
  })

  vi.stubGlobal("fetch", fetchMock)
  return { fetchMock, requests }
}

function resolveRequest(request: Deferred<Response>, assetId: number) {
  request.resolve(
    new Response(JSON.stringify(createCandleResponse(assetId)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  )
}

describe("MarketChartWorkbenchClient", () => {
  beforeEach(() => {
    routeSearchParams.current = new URLSearchParams("timeframe=1h")
    dynamicControl.loadStarted = false
    dynamicControl.loadCount = 0
    dynamicControl.resolvedLoadCount = 0
    dynamicControl.resolve = null
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("starts the default asset request while the chart chunk is loading and shares it", async () => {
    const { fetchMock } = installDeferredFetch()

    renderClient()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(dynamicControl.loadStarted).toBe(true)
    expect(dynamicControl.resolve).toBeTypeOf("function")
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument()
    expect(screen.queryByTestId("chart-data")).not.toBeInTheDocument()

    const url = new URL(
      String(fetchMock.mock.calls[0]?.[0]),
      "https://local.test"
    )
    expect(url.pathname).toBe("/api/market-charts/candles")
    expect(url.searchParams.get("assetId")).toBe("101")
    expect(url.searchParams.get("timeframe")).toBe("1h")

    await act(async () => dynamicControl.resolve?.())
    expect(screen.getByTestId("chart-data")).toHaveTextContent("pending")
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("preloads a directly selected member from the complete watchlist", async () => {
    const { fetchMock } = installDeferredFetch()
    routeSearchParams.current = new URLSearchParams("assetId=102&timeframe=4h")

    renderClient()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const url = new URL(
      String(fetchMock.mock.calls[0]?.[0]),
      "https://local.test"
    )
    expect(url.searchParams.get("assetId")).toBe("102")
    expect(url.searchParams.get("timeframe")).toBe("4h")
    expect(dynamicControl.loadStarted).toBe(true)
    expect(screen.queryByTestId("chart-data")).not.toBeInTheDocument()
  })

  it.each([
    {
      name: "an unsupported timeframe",
      query: "assetId=101&timeframe=2h",
      watchlistAssets: [btc, gold],
      watchlistError: null,
    },
    {
      name: "an asset outside the watchlist",
      query: "assetId=999&timeframe=1h",
      watchlistAssets: [btc, gold],
      watchlistError: null,
    },
    {
      name: "an empty watchlist",
      query: "timeframe=1h",
      watchlistAssets: [],
      watchlistError: null,
    },
    {
      name: "a watchlist error",
      query: "assetId=101&timeframe=1h",
      watchlistAssets: [btc, gold],
      watchlistError: "Watchlist unavailable",
    },
  ])(
    "does not preload for $name",
    async ({ query, watchlistAssets, watchlistError }) => {
      const { fetchMock } = installDeferredFetch()
      routeSearchParams.current = new URLSearchParams(query)

      renderClient({ watchlistAssets, watchlistError })

      await waitFor(() => expect(dynamicControl.loadStarted).toBe(true))
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )

  it("drops the old workspace load and starts from refreshed membership", async () => {
    const { fetchMock, requests } = installDeferredFetch()
    routeSearchParams.current = new URLSearchParams("assetId=101&timeframe=1h")

    const view = renderClient()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    await waitFor(() => expect(dynamicControl.resolve).toBeTypeOf("function"))
    await act(async () => dynamicControl.resolve?.())
    expect(screen.getByTestId("chart-data")).toHaveTextContent("pending")

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CURRENT_WORKSPACE_CHANGED_EVENT, {
          detail: { workspaceId: 8 },
        })
      )
    })
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument()

    routeSearchParams.current = new URLSearchParams("assetId=102&timeframe=1h")
    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbenchClient
          workspaceId={8}
          watchlistAssets={[gold]}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(dynamicControl.resolvedLoadCount).toBe(2))
    await act(async () => dynamicControl.resolve?.())
    resolveRequest(requests[0]!, 101)
    await act(async () => requests[0]!.promise)
    expect(screen.getByTestId("chart-data")).toHaveTextContent("pending")

    resolveRequest(requests[1]!, 102)
    await waitFor(() =>
      expect(screen.getByTestId("chart-data")).toHaveTextContent("102")
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("releases the workspace wait after refreshed props when dev auth has no workspace id", async () => {
    const { fetchMock } = installDeferredFetch()
    const view = renderClient({ workspaceId: null, watchlistAssets: [] })

    await waitFor(() => expect(dynamicControl.loadCount).toBe(1))

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(CURRENT_WORKSPACE_CHANGED_EVENT, {
          detail: { workspaceId: 8 },
        })
      )
    })
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument()

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbenchClient
          workspaceId={null}
          watchlistAssets={[]}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => expect(dynamicControl.loadCount).toBe(2))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
