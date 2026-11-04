// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
  routeSearchParams,
  routerReplace,
  getCandles,
  getAnnotations,
  getCalendarEvents,
} = vi.hoisted(() => ({
  routeSearchParams: {
    current: new URLSearchParams("assetId=101&timeframe=1m"),
  },
  routerReplace: vi.fn(),
  getCandles: vi.fn(),
  getAnnotations: vi.fn(),
  getCalendarEvents: vi.fn(),
}))
const router = { replace: routerReplace }

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/market-charts",
  useRouter: () => router,
  useSearchParams: () => routeSearchParams.current,
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(),
  hasLocale: vi.fn(),
}))

vi.mock("@/app/api/market-charts/action", () => ({
  getMarketChartCandles: getCandles,
  getMarketChartAnnotations: getAnnotations,
  getMarketChartEconomicCalendarEvents: getCalendarEvents,
}))

vi.mock(
  "@/app/[lang]/(main)/market-charts/market-chart-canvas",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/app/[lang]/(main)/market-charts/market-chart-canvas")
      >()
    const React = await import("react")

    return {
      ...original,
      MarketChartCalendarEventList: () => null,
      MarketChartCanvas: ({
        candles,
        liveCandle,
        liveQuote,
        liveQuoteIsLive,
      }: {
        candles: unknown[]
        liveCandle: MarketChartCandleItemResponse | null
        liveQuote: { assetId: number; price: number } | null
        liveQuoteIsLive: boolean
      }) => {
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "output",
            { "data-testid": "chart-rest-candles" },
            JSON.stringify(candles)
          ),
          React.createElement(
            "output",
            { "data-testid": "chart-live-candle" },
            JSON.stringify(liveCandle)
          ),
          React.createElement("output", {
            "data-testid": "chart-accessible-quote",
            "data-price": liveQuote ? String(liveQuote.price) : "none",
            "data-tone": liveQuote
              ? liveQuoteIsLive
                ? "live"
                : "neutral"
              : "none",
          })
        )
      },
    }
  }
)

import { MarketChartWorkbench } from "@/app/[lang]/(main)/market-charts/market-chart-workbench"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  MarketChartCandleItemResponse,
  MarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"

type EventListener = (event: Event) => void

class FakeEventSource {
  static readonly CONNECTING = 0
  static readonly CLOSED = 2
  static current: FakeEventSource | null = null
  static instances: FakeEventSource[] = []
  readonly listeners = new Map<string, EventListener[]>()
  readonly url: string
  close = vi.fn()
  readyState = 1

  constructor(url: string | URL) {
    FakeEventSource.current = this
    FakeEventSource.instances.push(this)
    this.url = String(url)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback =
      typeof listener === "function"
        ? listener
        : (event: Event) => listener.handleEvent(event)
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback])
  }

  emit(type: string, value?: unknown) {
    const event =
      value === undefined
        ? new Event(type)
        : new MessageEvent(type, { data: JSON.stringify(value) })
    this.listeners.get(type)?.forEach((listener) => listener(event))
  }
}

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

const watchlistAssets: WorkspaceWatchlistAssetListItemResponse[] = [
  {
    id: 1,
    assetId: 101,
    assetName: "Bitcoin",
    assetSymbol: "BTCUSD",
    assetType: "CRYPTO",
    createdDate: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    assetId: 102,
    assetName: "Gold",
    assetSymbol: "XAUUSD",
    assetType: "COMMODITY",
    createdDate: "2026-01-02T00:00:00.000Z",
  },
]

const candlesForBoundary = {
  "1m": ["2026-08-23T00:00:00.000Z", "2026-08-23T00:01:00.000Z"],
  "1w": ["2026-08-17T00:00:00.000Z", "2026-08-24T00:00:00.000Z"],
  "1mo": ["2026-08-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z"],
} satisfies Record<"1m" | "1w" | "1mo", readonly [string, string]>

function createRestCandles(times: readonly [string, string]) {
  return times.map((time, index) => ({
    time,
    open: 4230 + index * 10,
    high: 4250 + index * 10,
    low: 4225 + index * 10,
    close: 4235 + index * 10,
    volume: 1000 + index,
    partial: index === 1,
  })) satisfies MarketChartCandleItemResponse[]
}

function createCandleResponse(
  assetId: number,
  timeframe: MarketChartTimeframe
) {
  const asset = watchlistAssets.find(
    (candidate) => candidate.assetId === assetId
  )!
  const restCandles = createRestCandles(
    timeframe === "5m"
      ? ["2026-08-23T00:00:00.000Z", "2026-08-23T00:05:00.000Z"]
      : ["2026-08-23T00:00:00.000Z", "2026-08-23T00:01:00.000Z"]
  )

  return {
    provider: "fixture",
    symbol: asset.assetSymbol,
    asset: {
      id: asset.assetId,
      name: asset.assetName,
      symbol: asset.assetSymbol,
      type: asset.assetType,
      pricePrecision: 2,
    },
    timeframe,
    from: restCandles[0].time,
    to: restCandles[1].time,
    candles: restCandles,
  }
}

describe("Market chart quote-driven candle flow", () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    FakeEventSource.current = null
    FakeEventSource.instances = []
  })

  beforeEach(() => {
    routeSearchParams.current = new URLSearchParams("assetId=101&timeframe=1m")
    routerReplace.mockReset()
    getCandles.mockReset()
    getAnnotations.mockReset().mockResolvedValue({ success: true, data: [] })
    getCalendarEvents.mockReset().mockResolvedValue({ success: true, data: [] })
    vi.stubGlobal("EventSource", FakeEventSource)
    vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  })

  it.each(["1m", "1w", "1mo"] as const)(
    "updates the native live candle while preserving REST history at the %s boundary",
    async (timeframe: keyof typeof candlesForBoundary) => {
      routeSearchParams.current = new URLSearchParams(
        `assetId=101&timeframe=${timeframe}`
      )
      const restCandles = createRestCandles(candlesForBoundary[timeframe])
      const receivedAt = candlesForBoundary[timeframe][1]
      const candleResponse = {
        provider: "fixture",
        symbol: "BTCUSD",
        asset: {
          id: 101,
          name: "Bitcoin",
          symbol: "BTCUSD",
          type: "CRYPTO",
          pricePrecision: 2,
        },
        timeframe,
        from: restCandles[0].time,
        to: "2026-10-13T00:00:00.000Z",
        candles: restCandles,
      }
      getCandles.mockResolvedValue({ success: true, data: candleResponse })

      render(
        <LocalizationProvider locale="vi" dictionary={viDictionary}>
          <MarketChartWorkbench
            watchlistAssets={watchlistAssets}
            watchlistError={null}
          />
        </LocalizationProvider>
      )

      const candlesOnChart = await screen.findByTestId("chart-rest-candles")
      await waitFor(() =>
        expect(candlesOnChart).toHaveTextContent(JSON.stringify(restCandles))
      )
      const liveCandleOnChart = () => screen.getByTestId("chart-live-candle")
      const accessibleQuote = () => screen.getByTestId("chart-accessible-quote")
      expect(JSON.parse(liveCandleOnChart().textContent || "null")).toBeNull()
      expect(accessibleQuote()).toHaveAttribute("data-price", "none")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "none")
      await waitFor(() => {
        expect(FakeEventSource.current).not.toBeNull()
        expect(
          new URL(FakeEventSource.current!.url).searchParams.get("timeframe")
        ).toBe(timeframe)
      })
      const source = FakeEventSource.current!
      const sourceCount = FakeEventSource.instances.length
      expect(
        FakeEventSource.instances
          .slice(0, -1)
          .every((instance) => instance.close.mock.calls.length === 1)
      ).toBe(true)

      await act(async () => {
        source.emit("snapshot", {
          asset: candleResponse.asset,
          symbol: "BTCUSD",
          timeframe,
          quote: {
            assetId: 101,
            symbol: "BTCUSD",
            price: 4261.5,
            receivedAt,
            stale: false,
          },
          status: {
            assetId: 101,
            symbol: "BTCUSD",
            state: "SUBSCRIBED",
            message: null,
            stale: false,
            observedAt: receivedAt,
          },
        })
      })
      await waitFor(() =>
        expect(
          JSON.parse(liveCandleOnChart().textContent || "null")
        ).toMatchObject({
          time: restCandles[1].time,
          open: restCandles[1].open,
          high: 4261.5,
          low: restCandles[1].low,
          close: 4261.5,
          volume: restCandles[1].volume,
        })
      )
      expect(accessibleQuote()).toHaveAttribute("data-price", "4261.5")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "live")
      expect(
        screen.getByText(viDictionary.marketCharts.live.live)
      ).toBeVisible()
      expect(screen.queryByText(/Giá hiện tại:/)).not.toBeInTheDocument()
      expect(candlesOnChart).toHaveTextContent(JSON.stringify(restCandles))
      expect(restCandles[1].close).toBe(4245)

      await act(async () => {
        source.emit("price", {
          assetId: 101,
          symbol: "BTCUSD",
          price: 4234,
          receivedAt,
          stale: false,
        })
      })

      await waitFor(() =>
        expect(
          JSON.parse(liveCandleOnChart().textContent || "null")
        ).toMatchObject({
          time: restCandles[1].time,
          open: restCandles[1].open,
          high: 4261.5,
          low: 4234,
          close: 4234,
          volume: restCandles[1].volume,
        })
      )
      expect(accessibleQuote()).toHaveAttribute("data-price", "4234")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "live")
      expect(candlesOnChart).toHaveTextContent(JSON.stringify(restCandles))

      await act(async () => {
        source.emit("status", {
          assetId: 101,
          symbol: "BTCUSD",
          state: "STALE",
          message: null,
          stale: true,
          observedAt: receivedAt,
        })
      })
      expect(accessibleQuote()).toHaveAttribute("data-price", "4234")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "neutral")
      expect(
        screen.getByText(viDictionary.marketCharts.live.stale)
      ).toBeVisible()

      await act(async () => {
        source.emit("snapshot", {
          asset: candleResponse.asset,
          symbol: "BTCUSD",
          timeframe,
          quote: null,
          status: {
            assetId: 101,
            symbol: "BTCUSD",
            state: "RECONNECTING",
            message: null,
            stale: true,
            observedAt: receivedAt,
          },
        })
      })
      expect(accessibleQuote()).toHaveAttribute("data-price", "4234")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "neutral")
      expect(
        JSON.parse(liveCandleOnChart().textContent || "null")
      ).toMatchObject({ close: 4234, volume: restCandles[1].volume })

      await act(async () => {
        source.readyState = FakeEventSource.CONNECTING
        source.emit("error")
      })
      expect(accessibleQuote()).toHaveAttribute("data-price", "4234")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "neutral")
      expect(
        screen.getByText(viDictionary.marketCharts.live.reconnecting)
      ).toBeVisible()

      await act(async () => {
        source.emit("error", {
          assetId: 101,
          symbol: "BTCUSD",
          message: "Dịch vụ dữ liệu tạm thời không khả dụng.",
          observedAt: receivedAt,
        })
      })
      expect(accessibleQuote()).toHaveAttribute("data-price", "4234")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "neutral")
      expect(
        screen.getByText(viDictionary.marketCharts.live.error)
      ).toBeVisible()

      await act(async () => {
        source.emit("status", {
          assetId: 101,
          symbol: "BTCUSD",
          state: "MARKET_CLOSED",
          message: null,
          stale: false,
          observedAt: receivedAt,
        })
      })
      expect(accessibleQuote()).toHaveAttribute("data-price", "4234")
      expect(accessibleQuote()).toHaveAttribute("data-tone", "neutral")
      expect(
        screen.getByText(viDictionary.marketCharts.live.marketClosed)
      ).toBeVisible()
      expect(FakeEventSource.instances).toHaveLength(sourceCount)
    }
  )

  it("clears quote state when the asset or timeframe changes", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    const view = render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    const quote = () => screen.getByTestId("chart-accessible-quote")
    const candleOnChart = () => screen.getByTestId("chart-live-candle")
    await waitFor(() => {
      expect(FakeEventSource.current).not.toBeNull()
      expect(
        new URL(FakeEventSource.current!.url).searchParams.get("timeframe")
      ).toBe("1m")
    })

    const bitcoinSource = FakeEventSource.current!
    await act(async () => {
      bitcoinSource.emit("price", {
        assetId: 101,
        symbol: "BTCUSD",
        price: 4234,
        receivedAt: "2026-08-23T00:01:15.000Z",
        stale: false,
      })
    })
    await waitFor(() => expect(quote()).toHaveAttribute("data-price", "4234"))
    expect(JSON.parse(candleOnChart().textContent || "null")).toMatchObject({
      close: 4234,
    })

    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(102, "1m"),
    })
    routeSearchParams.current = new URLSearchParams("assetId=102&timeframe=1m")
    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(getCandles).toHaveBeenLastCalledWith(
        expect.objectContaining({ assetId: 102, timeframe: "1m" })
      )
      expect(FakeEventSource.current).not.toBe(bitcoinSource)
      expect(
        new URL(FakeEventSource.current!.url).searchParams.get("assetId")
      ).toBe("102")
      expect(quote()).toHaveAttribute("data-price", "none")
      expect(JSON.parse(candleOnChart().textContent || "null")).toBeNull()
    })
    expect(bitcoinSource.close).toHaveBeenCalledTimes(1)

    const goldSource = FakeEventSource.current!
    await act(async () => {
      bitcoinSource.emit("price", {
        assetId: 101,
        symbol: "BTCUSD",
        price: 9999,
        receivedAt: "2026-08-23T00:01:30.000Z",
        stale: false,
      })
    })
    expect(quote()).toHaveAttribute("data-price", "none")

    await act(async () => {
      goldSource.emit("price", {
        assetId: 102,
        symbol: "XAUUSD",
        price: 2300,
        receivedAt: "2026-08-23T00:01:30.000Z",
        stale: false,
      })
    })
    await waitFor(() => expect(quote()).toHaveAttribute("data-price", "2300"))

    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(102, "5m"),
    })
    routeSearchParams.current = new URLSearchParams("assetId=102&timeframe=5m")
    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(getCandles).toHaveBeenLastCalledWith(
        expect.objectContaining({ assetId: 102, timeframe: "5m" })
      )
      expect(FakeEventSource.current).not.toBe(goldSource)
      expect(
        new URL(FakeEventSource.current!.url).searchParams.get("timeframe")
      ).toBe("5m")
      expect(quote()).toHaveAttribute("data-price", "none")
      expect(JSON.parse(candleOnChart().textContent || "null")).toBeNull()
    })
    expect(goldSource.close).toHaveBeenCalledTimes(1)
  })
})
