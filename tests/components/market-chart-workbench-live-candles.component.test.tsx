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
  routeSearchParams: new URLSearchParams("assetId=101&timeframe=1m"),
  routerReplace: vi.fn(),
  getCandles: vi.fn(),
  getAnnotations: vi.fn(),
  getCalendarEvents: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/market-charts",
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => routeSearchParams,
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
      MarketChartCanvas: ({ candles }: { candles: unknown[] }) =>
        React.createElement(
          "output",
          { "data-testid": "chart-rest-candles" },
          JSON.stringify(candles)
        ),
    }
  }
)

import { MarketChartWorkbench } from "@/app/[lang]/(main)/market-charts/market-chart-workbench"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { MarketChartCandleItemResponse } from "@/app/lib/market-charts/definitions"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"

type EventListener = (event: Event) => void

class FakeEventSource {
  static readonly CONNECTING = 0
  static readonly CLOSED = 2
  static current: FakeEventSource | null = null
  readonly listeners = new Map<string, EventListener[]>()
  close = vi.fn()
  readyState = 1

  constructor() {
    FakeEventSource.current = this
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback =
      typeof listener === "function"
        ? listener
        : (event: Event) => listener.handleEvent(event)
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback])
  }

  emit(type: string, value: unknown) {
    const event = new MessageEvent("message", { data: JSON.stringify(value) })
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
]

const candlesForBoundary = {
  "1m": ["2026-08-23T00:00:00.000Z", "2026-08-23T00:01:00.000Z"],
  "1w": ["2026-08-17T00:00:00.000Z", "2026-08-24T00:00:00.000Z"],
  "1mo": ["2026-08-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z"],
} satisfies Record<"1m" | "1w" | "1mo", readonly [string, string]>

function createRestCandles(times: readonly [string, string]) {
  return times.map((time, index) => ({
    time,
    open: 100 + index * 10,
    high: 105 + index * 10,
    low: 98 + index * 10,
    close: 102 + index * 10,
    volume: 1000 + index,
    partial: index === 1,
  })) satisfies MarketChartCandleItemResponse[]
}

describe("Market chart quote-only candle flow", () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    FakeEventSource.current = null
  })

  beforeEach(() => {
    routeSearchParams.set("assetId", "101")
    routerReplace.mockReset()
    getCandles.mockReset()
    getAnnotations.mockReset().mockResolvedValue({ success: true, data: [] })
    getCalendarEvents.mockReset().mockResolvedValue({ success: true, data: [] })
    vi.stubGlobal("EventSource", FakeEventSource)
    vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  })

  it.each(["1m", "1w", "1mo"] as const)(
    "updates quote while retaining every REST candle at the %s boundary",
    async (timeframe: keyof typeof candlesForBoundary) => {
      routeSearchParams.set("timeframe", timeframe)
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
      expect(FakeEventSource.current).not.toBeNull()
      const source = FakeEventSource.current!

      await act(async () => {
        source.emit("snapshot", {
          asset: candleResponse.asset,
          symbol: "BTCUSD",
          timeframe,
          quote: {
            assetId: 101,
            symbol: "BTCUSD",
            price: 120.25,
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
          screen.getByText("Giá hiện tại: 120,25", { exact: true })
        ).toBeVisible()
      )
      expect(candlesOnChart).toHaveTextContent(JSON.stringify(restCandles))

      await act(async () => {
        source.emit("price", {
          assetId: 101,
          symbol: "BTCUSD",
          price: 123.45,
          receivedAt,
          stale: false,
        })
      })

      await waitFor(() =>
        expect(
          screen.getByText("Giá hiện tại: 123,45", { exact: true })
        ).toBeVisible()
      )
      expect(candlesOnChart).toHaveTextContent(JSON.stringify(restCandles))
    }
  )
})
