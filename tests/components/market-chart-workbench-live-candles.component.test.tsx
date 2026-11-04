// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
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

vi.mock("@/app/[lang]/(main)/local-entity-quick-detail-drawer", async () => {
  const React = await import("react")

  return {
    LocalEntityQuickDetailDrawer: ({
      entity,
      onBeforeClose,
      onClose,
    }: {
      entity: { id: number; kind: string } | null
      onBeforeClose: () => void
      onClose: () => void
    }) =>
      entity
        ? React.createElement(
            "div",
            { role: "dialog" },
            React.createElement(
              "output",
              { "data-testid": "quick-detail-entity" },
              `${entity.kind}:${entity.id}`
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => {
                  onBeforeClose()
                  onClose()
                },
              },
              "Close"
            )
          )
        : null,
  }
})

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
      MarketChartCalendarEventList: ({
        events,
      }: {
        events: Array<{ id?: number | null; title?: string | null }>
      }) =>
        React.createElement(
          "output",
          { "data-testid": "calendar-event-detail" },
          events.map((event) => `${event.id}:${event.title}`).join(",")
        ),
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

function createNextEvent(
  id: number,
  title: string,
  impact = "HIGH",
  minutes = 60
) {
  const scheduledAt = new Date(Date.now() + minutes * 60_000).toISOString()

  return {
    id,
    assetId: 101,
    impact,
    scheduledAt,
    status: "PENDING" as const,
    time: scheduledAt,
    title,
  }
}

describe("Market chart quote-driven candle flow", () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
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
    vi.stubGlobal("PointerEvent", MouseEvent)
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

  it("loads the Next event independently while candle history is pending", async () => {
    const event = createNextEvent(151, "US Natural Gas Storage")
    let resolveCandleRequest!: () => void
    getCandles.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCandleRequest = () =>
            resolve({
              success: true,
              data: createCandleResponse(101, "1m"),
            })
        })
    )
    getCalendarEvents.mockImplementation(async (request) =>
      Date.parse(request.to) > Date.now()
        ? { success: true, data: [event] }
        : { success: true, data: [] }
    )

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    const nextBadge = await screen.findByRole("button", {
      name: /US Natural Gas Storage/,
    })
    fireEvent.click(nextBadge)
    expect(
      await screen.findByTestId("calendar-event-detail")
    ).toHaveTextContent("151:US Natural Gas Storage")

    await act(async () => resolveCandleRequest())
  })

  it("distinguishes loading, an empty calendar, and no selected impacts", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    let resolveCalendarRequest!: (result: {
      success: true
      data: ReturnType<typeof createNextEvent>[]
    }) => void
    const futureCalendarResult = new Promise<{
      success: true
      data: ReturnType<typeof createNextEvent>[]
    }>((resolve) => {
      resolveCalendarRequest = resolve
    })
    getCalendarEvents.mockImplementation(async (request) =>
      Date.parse(request.to) > Date.now()
        ? futureCalendarResult
        : { success: true, data: [] }
    )

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    const loadingButton = await screen.findByRole("button", {
      name: new RegExp(viDictionary.marketCharts.calendar.loadingEvents),
    })
    expect(loadingButton).toBeDisabled()

    await act(async () => {
      resolveCalendarRequest({ success: true, data: [] })
    })

    const emptyButton = await screen.findByRole("button", {
      name: new RegExp(viDictionary.marketCharts.calendar.noNextEvent),
    })
    expect(emptyButton).toBeDisabled()
    expect(emptyButton).not.toHaveTextContent(
      viDictionary.marketCharts.calendar.loadingEvents
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: viDictionary.marketCharts.controls.eventSettingsAria,
      })
    )
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: viDictionary.marketCharts.controls.impactOptionLabels.HIGH,
      })
    )

    const noImpactButton = await screen.findByRole("button", {
      name: new RegExp(viDictionary.marketCharts.calendar.noSelectedImpacts),
    })
    expect(noImpactButton).toBeDisabled()
    expect(noImpactButton).not.toHaveTextContent(
      viDictionary.marketCharts.calendar.noNextEvent
    )
  })

  it("keeps the clicked Next event open when refresh selects another event", async () => {
    const intervalSpy = vi.spyOn(window, "setInterval")
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    const [eventA, eventB] = [
      createNextEvent(201, "US Natural Gas Storage"),
      createNextEvent(202, "US Crude Oil Inventories", "HIGH", 120),
    ]
    const eventC = createNextEvent(203, "US CPI", "HIGH", 180)
    const refreshResponses = [eventA, eventB, eventC]
    getCalendarEvents.mockImplementation(async (request) => {
      if (Date.parse(request.to) > Date.now()) {
        return {
          success: true,
          data: [refreshResponses.shift()].filter(Boolean),
        }
      }

      return { success: true, data: [] }
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    const nextBadge = await screen.findByRole("button", {
      name: /US Natural Gas Storage/,
    })
    fireEvent.click(nextBadge)

    expect(
      await screen.findByTestId("calendar-event-detail")
    ).toHaveTextContent("201:US Natural Gas Storage")

    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000)
    const countdownTick = intervalSpy.mock.calls.find(
      ([, delay]) => delay === 1_000
    )?.[0]
    const calendarRefresh = intervalSpy.mock.calls.find(
      ([, delay]) => delay === 60_000
    )?.[0]
    const futureCallCount = () =>
      getCalendarEvents.mock.calls.filter(
        ([request]) => Date.parse(request.to) > Date.now()
      ).length
    const initialFutureCallCount = futureCallCount()

    await act(async () => {
      if (typeof countdownTick === "function") {
        countdownTick()
        countdownTick()
        countdownTick()
      }
    })
    expect(futureCallCount()).toBe(initialFutureCallCount)

    await act(async () => {
      if (typeof calendarRefresh === "function") {
        calendarRefresh()
      }
    })
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /US Crude Oil Inventories/ })
      ).toBeInTheDocument()
    )

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /US CPI/ })).toBeInTheDocument()
    )
    expect(screen.getByTestId("calendar-event-detail")).toHaveTextContent(
      "201:US Natural Gas Storage"
    )
  })

  it("retains a matching Next cache on refresh failure and retries it", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    const eventA = createNextEvent(301, "US Natural Gas Storage")
    const eventB = createNextEvent(302, "US Crude Oil Inventories", "HIGH", 120)
    let futureRequestCount = 0
    getCalendarEvents.mockImplementation(async (request) => {
      if (Date.parse(request.to) > Date.now()) {
        futureRequestCount += 1
        if (futureRequestCount === 1) {
          return { success: true, data: [eventA] }
        }
        if (futureRequestCount === 2) {
          return { success: false, error: "Calendar refresh failed" }
        }
        return { success: true, data: [eventB] }
      }

      return { success: true, data: [] }
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await screen.findByRole("button", { name: /US Natural Gas Storage/ })

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(
      await screen.findByText(viDictionary.marketCharts.calendar.stale)
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: /US Natural Gas Storage/ })
    ).toBeEnabled()

    fireEvent.click(
      screen.getByRole("button", {
        name: viDictionary.marketCharts.controls.refreshLatestData,
      })
    )

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /US Crude Oil Inventories/ })
      ).toBeInTheDocument()
    )
    expect(futureRequestCount).toBe(3)
  })

  it("clears the previous Next title when the refreshed context has no event", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    let futureRequestCount = 0
    getCalendarEvents.mockImplementation(async (request) => {
      if (Date.parse(request.to) > Date.now()) {
        futureRequestCount += 1
        return {
          success: true,
          data:
            futureRequestCount === 1
              ? [createNextEvent(401, "US Natural Gas Storage")]
              : [],
        }
      }

      return { success: true, data: [] }
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await screen.findByRole("button", { name: /US Natural Gas Storage/ })

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    await waitFor(() => expect(futureRequestCount).toBe(2))

    const emptyNextButton = await screen.findByRole("button", {
      name: new RegExp(viDictionary.marketCharts.calendar.noNextEvent),
    })
    expect(emptyNextButton).toBeDisabled()
    expect(emptyNextButton).not.toHaveTextContent("US Natural Gas Storage")
  })

  it("does not show a cached Next event after the impact selection changes", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    const eventA = createNextEvent(501, "US Natural Gas Storage", "HIGH")
    let futureRequestCount = 0
    getCalendarEvents.mockImplementation(async (request) => {
      if (Date.parse(request.to) > Date.now()) {
        futureRequestCount += 1
        return futureRequestCount === 1
          ? { success: true, data: [eventA] }
          : { success: false, error: "Calendar refresh failed" }
      }

      return { success: true, data: [] }
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await screen.findByRole("button", { name: /US Natural Gas Storage/ })
    fireEvent.click(
      screen.getByRole("button", {
        name: viDictionary.marketCharts.controls.eventSettingsAria,
      })
    )
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: viDictionary.marketCharts.controls.impactOptionLabels.MEDIUM,
      })
    )

    await waitFor(() => expect(futureRequestCount).toBe(2))
    expect(
      screen.queryByRole("button", { name: /US Natural Gas Storage/ })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /Calendar refresh failed/,
      })
    ).toBeDisabled()
  })

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
