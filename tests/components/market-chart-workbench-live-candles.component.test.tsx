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

vi.mock("@/app/[lang]/(main)/market-charts/market-chart-candle-client", () => ({
  requestMarketChartCandles: getCandles,
}))

vi.mock("@/app/api/market-charts/action", () => ({
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
        annotations,
        calendarEvents,
        liveCandle,
        liveQuote,
        liveQuoteIsLive,
        onLoadOlderCandles,
        onLoadedDataChange,
      }: {
        candles: unknown[]
        annotations: Array<{ id?: string; time?: string }>
        calendarEvents: Array<{ id?: number; title?: string | null }>
        liveCandle: MarketChartCandleItemResponse | null
        liveQuote: { assetId: number; price: number } | null
        liveQuoteIsLive: boolean
        onLoadOlderCandles: (
          request: MarketChartCandleRequest
        ) => Promise<{ success: boolean; data?: MarketChartLoadedData }>
        onLoadedDataChange: (data: MarketChartLoadedData) => void
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
          }),
          React.createElement(
            "output",
            { "data-testid": "chart-annotations" },
            JSON.stringify(annotations)
          ),
          React.createElement(
            "output",
            { "data-testid": "chart-calendar-events" },
            JSON.stringify(calendarEvents)
          ),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: async () => {
                const result = await onLoadOlderCandles({
                  assetId: 101,
                  countBack: 100,
                  timeframe: "1h",
                  to: "2026-08-19T10:00:00.000Z",
                })

                if (result.success && result.data) {
                  onLoadedDataChange(result.data)
                  window.dispatchEvent(
                    new Event("market-chart-fixture-older-page-complete")
                  )
                }
              },
            },
            "Load older fixture"
          )
        )
      },
    }
  }
)

import { MarketChartWorkbench } from "@/app/[lang]/(main)/market-charts/market-chart-workbench"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  MarketChartAnnotationResponse,
  MarketChartCandleItemResponse,
  MarketChartCandleRequest,
  MarketChartEconomicCalendarEventResponse,
  MarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import type { MarketChartLoadedData } from "@/app/[lang]/(main)/market-charts/market-chart-canvas"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"

type EventListener = (event: Event) => void

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

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
    assetSymbol: "BTC/USDT",
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
  id: number | undefined,
  title: string,
  impact = "HIGH",
  minutes = 60
) {
  const scheduledAt = new Date(Date.now() + minutes * 60_000).toISOString()

  return {
    ...(id === undefined ? {} : { id }),
    assetId: 101,
    impact,
    scheduledAt,
    status: "PENDING" as const,
    time: scheduledAt,
    title,
  }
}

function createHotAnnotation(
  id: string,
  time: string,
  assetId = 101
): MarketChartAnnotationResponse {
  return {
    id,
    assetId,
    time,
    annotationType: "HOT_EVENT",
    hotEvent: {
      eventId: 1,
      severity: "HIGH",
      direction: "BULLISH",
      title: null,
      summary: null,
      confidence: null,
      topMarketReaction: null,
      marketReactions: [],
      evidence: [],
      links: { eventDetail: "/events/1" },
    },
    warmEpisode: null,
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
        symbol: "BTC/USDT",
        asset: {
          id: 101,
          name: "Bitcoin",
          symbol: "BTC/USDT",
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
          symbol: "BTC/USDT",
          timeframe,
          quote: {
            assetId: 101,
            symbol: "BTC/USDT",
            price: 4261.5,
            receivedAt,
            stale: false,
          },
          status: {
            assetId: 101,
            symbol: "BTC/USDT",
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
          symbol: "BTC/USDT",
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
          symbol: "BTC/USDT",
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
          symbol: "BTC/USDT",
          timeframe,
          quote: null,
          status: {
            assetId: 101,
            symbol: "BTC/USDT",
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
          symbol: "BTC/USDT",
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
          symbol: "BTC/USDT",
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

  it("shows valid candles while annotations and historical events are pending", async () => {
    const annotationRequest = createDeferred<{
      success: boolean
      data: []
    }>()
    const calendarRequest = createDeferred<{
      success: boolean
      data: []
    }>()
    let historicalCalendarRequested = false
    let candleResponseAt = 0
    let candlePaintAt = 0
    let annotationSettled = false
    let calendarSettled = false
    getCandles.mockImplementation(async () => {
      candleResponseAt = performance.now()
      return { success: true, data: createCandleResponse(101, "1m") }
    })
    getAnnotations.mockImplementation(() => annotationRequest.promise)
    getCalendarEvents.mockImplementation((request) => {
      if (Date.parse(request.to) > Date.now()) {
        return Promise.resolve({ success: true, data: [] })
      }

      historicalCalendarRequested = true
      return calendarRequest.promise
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(getAnnotations).toHaveBeenCalledOnce()
      expect(historicalCalendarRequested).toBe(true)
    })

    const expectedCandles = JSON.stringify(
      createRestCandles([
        "2026-08-23T00:00:00.000Z",
        "2026-08-23T00:01:00.000Z",
      ])
    )
    const candlesAreVisible = () => {
      const element = screen.queryByTestId("chart-rest-candles")

      return Boolean(
        element?.textContent === expectedCandles &&
        element.parentElement?.classList.contains("visible")
      )
    }
    let visibleWhileSupplementsPending = false
    try {
      await waitFor(
        () => {
          expect(candlesAreVisible()).toBe(true)
          candlePaintAt ||= performance.now()
        },
        { interval: 5, timeout: 120 }
      )
      visibleWhileSupplementsPending = true
    } catch {
      // Resolve the controlled requests below so the baseline can be timed.
    }
    const supplementsPendingAtCandlePaint =
      !annotationSettled && !calendarSettled

    annotationSettled = true
    calendarSettled = true
    await act(async () => {
      annotationRequest.resolve({ success: true, data: [] })
      calendarRequest.resolve({ success: true, data: [] })
    })
    await waitFor(() => {
      const candlesOnChart = screen.getByTestId("chart-rest-candles")
      expect(candlesOnChart).toHaveTextContent(expectedCandles)
      expect(candlesOnChart.parentElement).toHaveClass("visible")
      candlePaintAt ||= performance.now()
    })

    const firstCandleAfterResponseMs = candlePaintAt - candleResponseAt
    console.info(
      `MARKET_CHART_FIRST_CANDLE_MS=${firstCandleAfterResponseMs.toFixed(1)}; supplements_pending_at_paint=${supplementsPendingAtCandlePaint}`
    )

    expect(visibleWhileSupplementsPending).toBe(true)
  })

  it("keeps event counts scoped to a selection with a known candle range", async () => {
    const firstCandleRequest = createDeferred<{
      success: true
      data: ReturnType<typeof createCandleResponse>
    }>()
    const nextCandleRequest = createDeferred<{
      success: true
      data: ReturnType<typeof createCandleResponse>
    }>()
    const priorEventTime = "2026-08-23T00:01:00.000Z"
    const priorEvent: MarketChartEconomicCalendarEventResponse = {
      id: 101,
      assetId: 101,
      time: priorEventTime,
      scheduledAt: priorEventTime,
      title: "Prior selection event",
      impact: "HIGH",
      status: "AVAILABLE",
    }

    window.localStorage.setItem(
      "signapse:market-charts:calendar-layer:v1",
      "true"
    )
    getCandles
      .mockImplementationOnce(() => firstCandleRequest.promise)
      .mockImplementationOnce(() => nextCandleRequest.promise)
    getAnnotations.mockResolvedValueOnce({
      success: true,
      data: [createHotAnnotation("prior-selection", priorEventTime)],
    })
    getCalendarEvents.mockImplementation(async (request) =>
      Date.parse(request.to) > Date.now()
        ? { success: true, data: [] }
        : request.assetId === 101
          ? { success: true, data: [priorEvent] }
          : { success: true, data: [] }
    )

    const view = render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    const annotationLoading =
      viDictionary.marketCharts.annotations.loadingEvents
    const calendarLoading = viDictionary.marketCharts.calendar.loadingEvents
    expect(await screen.findByText(annotationLoading)).toBeVisible()
    expect(screen.getByText(calendarLoading)).toBeVisible()
    expect(
      screen.queryByText(viDictionary.marketCharts.annotations.noEvents)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(viDictionary.marketCharts.calendar.noEvents)
    ).not.toBeInTheDocument()

    await act(async () => {
      firstCandleRequest.resolve({
        success: true,
        data: createCandleResponse(101, "1m"),
      })
    })
    expect(await screen.findAllByText(/1 mốc sự kiện/)).not.toHaveLength(0)
    expect(
      await screen.findAllByText(/1 sự kiện lịch kinh tế/)
    ).not.toHaveLength(0)

    routeSearchParams.current = new URLSearchParams("assetId=102&timeframe=5m")
    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => expect(getCandles).toHaveBeenCalledTimes(2))
    expect(screen.getByText(annotationLoading)).toBeVisible()
    expect(screen.getByText(calendarLoading)).toBeVisible()
    expect(screen.queryByText(/1 mốc sự kiện/)).not.toBeInTheDocument()
    expect(screen.queryByText(/1 sự kiện lịch kinh tế/)).not.toBeInTheDocument()
    expect(
      screen.queryByText(viDictionary.marketCharts.annotations.noEvents)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(viDictionary.marketCharts.calendar.noEvents)
    ).not.toBeInTheDocument()

    await act(async () => {
      nextCandleRequest.resolve({
        success: true,
        data: createCandleResponse(102, "5m"),
      })
    })
    expect(
      await screen.findAllByText(viDictionary.marketCharts.annotations.noEvents)
    ).not.toHaveLength(0)
    expect(
      await screen.findAllByText(viDictionary.marketCharts.calendar.noEvents)
    ).not.toHaveLength(0)
  })

  it("keeps candles when each supplemental source fails and retries independently", async () => {
    const annotationRequest = createDeferred<{
      success: boolean
      error?: string | null
      data?: []
    }>()
    const calendarRequest = createDeferred<{
      success: boolean
      error?: string | null
      data?: []
    }>()
    let historicalCalendarRequested = false
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })
    getAnnotations.mockImplementation(() => annotationRequest.promise)
    getCalendarEvents.mockImplementation((request) => {
      if (Date.parse(request.to) > Date.now()) {
        return Promise.resolve({ success: true, data: [] })
      }

      historicalCalendarRequested = true
      return calendarRequest.promise
    })

    window.localStorage.setItem(
      "signapse:market-charts:calendar-layer:v1",
      "true"
    )
    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(getAnnotations).toHaveBeenCalledOnce()
      expect(historicalCalendarRequested).toBe(true)
      expect(screen.getByTestId("chart-rest-candles")).toHaveTextContent(
        "2026-08-23T00:00:00.000Z"
      )
    })

    await act(async () => {
      annotationRequest.resolve({ success: false, error: "annotation error" })
      calendarRequest.resolve({ success: false, error: "calendar error" })
    })

    const annotationError = viDictionary.marketCharts.annotations.loadError
    const calendarError = viDictionary.marketCharts.calendar.loadError
    const refreshLabel = viDictionary.marketCharts.controls.refreshLatestData
    const annotationRetry = await screen.findByRole("button", {
      name: `${annotationError} ${refreshLabel}`,
    })
    const calendarRetry = await screen.findByRole("button", {
      name: `${calendarError} ${refreshLabel}`,
    })
    const candles = screen.getByTestId("chart-rest-candles")
    const originalCandles = candles.textContent

    getAnnotations.mockResolvedValue({ success: true, data: [] })
    fireEvent.click(annotationRetry)
    await waitFor(() => {
      expect(getAnnotations).toHaveBeenCalledTimes(2)
      expect(
        screen.queryByRole("button", {
          name: `${annotationError} ${refreshLabel}`,
        })
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole("button", {
          name: `${calendarError} ${refreshLabel}`,
        })
      ).toBeInTheDocument()
      expect(candles).toHaveTextContent(originalCandles || "")
    })

    getCalendarEvents.mockResolvedValue({ success: true, data: [] })
    fireEvent.click(calendarRetry)
    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: `${calendarError} ${refreshLabel}`,
        })
      ).not.toBeInTheDocument()
      expect(candles).toHaveTextContent(originalCandles || "")
    })
  })

  it("ignores supplemental responses from a previous asset and timeframe", async () => {
    const staleAnnotationRequest = createDeferred<{
      success: boolean
      error?: string | null
      data?: MarketChartAnnotationResponse[]
    }>()
    const staleCalendarRequest = createDeferred<{
      success: boolean
      error?: string | null
      data?: MarketChartEconomicCalendarEventResponse[]
    }>()
    const currentAnnotation = createHotAnnotation(
      "current-selection",
      "2026-08-23T00:05:00.000Z",
      102
    )
    const currentEvent: MarketChartEconomicCalendarEventResponse = {
      id: 202,
      assetId: 102,
      time: "2026-08-23T00:05:00.000Z",
      scheduledAt: "2026-08-23T00:05:00.000Z",
      title: "Current selection event",
      impact: "HIGH",
      status: "AVAILABLE",
    }
    const staleAnnotation = createHotAnnotation(
      "stale-selection",
      "2026-08-23T00:01:00.000Z"
    )
    const staleEvent: MarketChartEconomicCalendarEventResponse = {
      id: 101,
      assetId: 101,
      time: "2026-08-23T00:01:00.000Z",
      scheduledAt: "2026-08-23T00:01:00.000Z",
      title: "Stale selection event",
      impact: "HIGH",
      status: "AVAILABLE",
    }
    let currentHistoricalCalendarRequested = false
    getCandles.mockImplementation(async () => ({
      success: true,
      data:
        getCandles.mock.calls.length === 1
          ? createCandleResponse(101, "1m")
          : createCandleResponse(102, "5m"),
    }))
    getAnnotations.mockImplementation((request) =>
      request.assetId === 101
        ? staleAnnotationRequest.promise
        : Promise.resolve({ success: true, data: [currentAnnotation] })
    )
    getCalendarEvents.mockImplementation((request) => {
      if (Date.parse(request.to) > Date.now()) {
        return Promise.resolve({ success: true, data: [] })
      }

      if (request.assetId === 101) {
        return staleCalendarRequest.promise
      }

      currentHistoricalCalendarRequested = true
      return Promise.resolve({ success: true, data: [currentEvent] })
    })

    const view = render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(getAnnotations).toHaveBeenCalledOnce()
      expect(staleCalendarRequest.promise).toBeDefined()
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
      expect(getCandles).toHaveBeenCalledTimes(2)
      expect(getAnnotations).toHaveBeenCalledTimes(2)
      expect(currentHistoricalCalendarRequested).toBe(true)
      expect(screen.getByTestId("chart-rest-candles")).toHaveTextContent(
        JSON.stringify(
          createRestCandles([
            "2026-08-23T00:00:00.000Z",
            "2026-08-23T00:05:00.000Z",
          ])
        )
      )
    })

    await act(async () => {
      staleAnnotationRequest.resolve({ success: true, data: [staleAnnotation] })
      staleCalendarRequest.resolve({ success: true, data: [staleEvent] })
    })

    await waitFor(() => {
      expect(screen.getByTestId("chart-annotations")).toHaveTextContent(
        "current-selection"
      )
      expect(screen.getByTestId("chart-annotations")).not.toHaveTextContent(
        "stale-selection"
      )
      expect(screen.getByTestId("chart-calendar-events")).toHaveTextContent(
        "Current selection event"
      )
      expect(screen.getByTestId("chart-calendar-events")).not.toHaveTextContent(
        "Stale selection event"
      )
      expect(
        screen.queryByRole("alert", {
          name: viDictionary.marketCharts.annotations.loadError,
        })
      ).not.toBeInTheDocument()
    })
  })

  it("loads backfill candles and supplemental ranges through the page gap", async () => {
    routeSearchParams.current = new URLSearchParams("assetId=101&timeframe=1h")
    const joinAnnotation = createHotAnnotation(
      "join-10",
      "2026-08-19T10:00:00.000Z"
    )
    const gapAnnotation = createHotAnnotation(
      "gap-09",
      "2026-08-19T09:00:00.000Z"
    )
    const olderAnnotations = createDeferred<{
      success: boolean
      data: MarketChartAnnotationResponse[]
    }>()
    const olderCalendar = createDeferred<{
      success: boolean
      data: MarketChartEconomicCalendarEventResponse[]
    }>()
    const initialResponse = {
      ...createCandleResponse(101, "1h"),
      from: "2026-08-19T10:00:00.000Z",
      to: "2026-08-19T11:00:00.000Z",
      candles: createRestCandles([
        "2026-08-19T10:00:00.000Z",
        "2026-08-19T11:00:00.000Z",
      ]),
    }
    const olderResponse = {
      ...initialResponse,
      from: "2026-08-19T07:00:00.000Z",
      to: "2026-08-19T10:00:00.000Z",
      candles: [
        {
          time: "2026-08-19T07:00:00.000Z",
          open: 4200,
          high: 4210,
          low: 4190,
          close: 4205,
        },
      ],
    }
    getCandles.mockImplementation(async () =>
      getCandles.mock.calls.length === 1
        ? { success: true, data: initialResponse }
        : { success: true, data: olderResponse }
    )
    getAnnotations.mockImplementation((request) =>
      request.from === "2026-08-19T07:00:00.000Z"
        ? olderAnnotations.promise
        : Promise.resolve({ success: true, data: [joinAnnotation] })
    )
    getCalendarEvents.mockImplementation((request) => {
      if (Date.parse(request.to) > Date.now()) {
        return Promise.resolve({ success: true, data: [] })
      }

      return request.from === "2026-08-19T07:00:00.000Z"
        ? olderCalendar.promise
        : Promise.resolve({ success: true, data: [] })
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    await screen.findByText("Load older fixture")
    await waitFor(() => {
      expect(getAnnotations).toHaveBeenCalledOnce()
      expect(
        screen.getByTestId("chart-rest-candles").parentElement
      ).toHaveClass("visible")
    })
    const expectedAnnotationRange = {
      assetId: 101,
      from: "2026-08-19T07:00:00.000Z",
      to: "2026-08-19T10:00:00.000Z",
    }
    const expectedCalendarRange = {
      ...expectedAnnotationRange,
      to: "2026-08-19T08:00:00.000Z",
    }
    const olderPageComplete = new Promise<void>((resolve) => {
      window.addEventListener(
        "market-chart-fixture-older-page-complete",
        () => resolve(),
        { once: true }
      )
    })
    await act(async () => {
      fireEvent.click(screen.getByText("Load older fixture"))
      await olderPageComplete
    })
    await waitFor(() => {
      expect(getCandles).toHaveBeenCalledTimes(2)
      expect(getAnnotations).toHaveBeenCalledWith(expectedAnnotationRange)
      expect(getCalendarEvents).toHaveBeenCalledWith({
        ...expectedCalendarRange,
        impact: ["HIGH"],
      })
      expect(screen.getByTestId("chart-rest-candles")).toHaveTextContent(
        "2026-08-19T07:00:00.000Z"
      )
      expect(screen.getByTestId("chart-rest-candles")).toHaveTextContent(
        "2026-08-19T10:00:00.000Z"
      )
    })

    await act(async () => {
      olderAnnotations.resolve({
        success: true,
        data: [gapAnnotation, joinAnnotation],
      })
      olderCalendar.resolve({ success: true, data: [] })
    })

    await waitFor(() => {
      const annotations = JSON.parse(
        screen.getByTestId("chart-annotations").textContent || "[]"
      ) as Array<{ id: string; time: string }>
      expect(annotations.map(({ id }) => id)).toEqual(["gap-09", "join-10"])
      expect(annotations.find(({ id }) => id === "gap-09")?.time).toBe(
        "2026-08-19T09:00:00.000Z"
      )
      expect(annotations.filter(({ id }) => id === "join-10")).toHaveLength(1)
      expect(annotations.find(({ id }) => id === "join-10")?.time).toBe(
        "2026-08-19T10:00:00.000Z"
      )
    })
  })

  it("reloads all selected calendar impacts after rapid filter changes", async () => {
    const initialHigh = createDeferred<{
      success: true
      data: MarketChartEconomicCalendarEventResponse[]
    }>()
    const highAndMedium = createDeferred<{
      success: true
      data: MarketChartEconomicCalendarEventResponse[]
    }>()
    const mediumOnly = createDeferred<{
      success: true
      data: MarketChartEconomicCalendarEventResponse[]
    }>()
    const historicalEvent = (
      id: number,
      title: string,
      impact: "HIGH" | "MEDIUM"
    ): MarketChartEconomicCalendarEventResponse => ({
      id,
      assetId: 101,
      impact,
      scheduledAt: "2026-08-23T00:00:30.000Z",
      status: "AVAILABLE",
      time: "2026-08-23T00:00:30.000Z",
      title,
    })
    const currentMedium = historicalEvent(701, "Current medium", "MEDIUM")
    const staleMedium = historicalEvent(702, "Stale medium", "MEDIUM")
    const staleHigh = historicalEvent(703, "Stale high", "HIGH")

    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })
    getCalendarEvents.mockImplementation((request) => {
      if (Date.parse(request.to) > Date.now()) {
        return Promise.resolve({ success: true, data: [] })
      }

      switch (request.impact.join(",")) {
        case "HIGH":
          return initialHigh.promise
        case "HIGH,MEDIUM":
          return highAndMedium.promise
        case "MEDIUM":
          return mediumOnly.promise
        default:
          throw new Error(`Unexpected impact filter: ${request.impact}`)
      }
    })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <MarketChartWorkbench
          watchlistAssets={watchlistAssets}
          watchlistError={null}
        />
      </LocalizationProvider>
    )

    const historicalRequests = () =>
      getCalendarEvents.mock.calls
        .map(([request]) => request)
        .filter((request) => Date.parse(request.to) <= Date.now())

    await waitFor(() => {
      expect(
        historicalRequests().some(
          (request) => request.impact.join(",") === "HIGH"
        )
      ).toBe(true)
    })

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

    await waitFor(() => {
      expect(
        historicalRequests().some(
          (request) => request.impact.join(",") === "HIGH,MEDIUM"
        )
      ).toBe(true)
    })

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: viDictionary.marketCharts.controls.impactOptionLabels.HIGH,
      })
    )

    await waitFor(() => {
      expect(
        historicalRequests().some(
          (request) => request.impact.join(",") === "MEDIUM"
        )
      ).toBe(true)
    })

    await act(async () => {
      mediumOnly.resolve({ success: true, data: [currentMedium] })
    })

    await waitFor(() => {
      expect(screen.getByTestId("chart-calendar-events")).toHaveTextContent(
        "Current medium"
      )
    })

    await act(async () => {
      highAndMedium.resolve({ success: true, data: [staleMedium, staleHigh] })
      initialHigh.resolve({ success: true, data: [staleHigh] })
    })

    await waitFor(() => {
      const events = JSON.parse(
        screen.getByTestId("chart-calendar-events").textContent || "[]"
      ) as MarketChartEconomicCalendarEventResponse[]
      expect(events.map((event) => event.title)).toEqual(["Current medium"])
    })
  })

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
    const plot = screen.getByTestId("market-chart-plot")
    const badge = screen.getByTestId("market-chart-next-event-badge")
    expect(plot).toContainElement(badge)
    expect(screen.getByTestId("market-chart-toolbar")).not.toContainElement(
      badge
    )
    fireEvent.click(nextBadge)
    expect(
      await screen.findByTestId("calendar-event-detail")
    ).toHaveTextContent("151:US Natural Gas Storage")

    await act(async () => resolveCandleRequest())
  })

  it("opens a valid Next event when its optional API id is missing", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })

    const eventWithoutId = createNextEvent(undefined, "US CPI")
    getCalendarEvents.mockImplementation(async (request) =>
      Date.parse(request.to) > Date.now()
        ? { success: true, data: [eventWithoutId] }
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

    const nextBadge = await screen.findByRole("button", { name: /US CPI/ })
    expect(nextBadge).toBeEnabled()
    fireEvent.click(nextBadge)

    expect(
      await screen.findByTestId("calendar-event-detail")
    ).toHaveTextContent("US CPI")
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
    const nextStatus = screen.getByTestId("market-chart-next-event-status")
    expect(nextStatus).toHaveAttribute("role", "status")
    expect(nextStatus).toHaveAttribute("aria-live", "polite")
    expect(nextStatus).toHaveTextContent(
      viDictionary.marketCharts.calendar.loadingEvents
    )

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
    expect(screen.getByTestId("market-chart-next-event-status")).toBe(
      nextStatus
    )
    expect(nextStatus).toHaveTextContent(
      viDictionary.marketCharts.calendar.noNextEvent
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
    expect(screen.getByTestId("market-chart-next-event-status")).toBe(
      nextStatus
    )
    expect(nextStatus).toHaveTextContent(
      viDictionary.marketCharts.calendar.noSelectedImpacts
    )
  })

  it("shows a localized error when the calendar request rejects", async () => {
    getCandles.mockResolvedValue({
      success: true,
      data: createCandleResponse(101, "1m"),
    })
    getCalendarEvents.mockImplementation(async (request) =>
      Date.parse(request.to) > Date.now()
        ? Promise.reject(new Error("Failed to fetch"))
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

    await waitFor(() =>
      expect(
        screen.getByTestId("market-chart-next-event-status")
      ).toHaveTextContent(viDictionary.marketCharts.calendar.loadError)
    )
    expect(screen.queryByText("Failed to fetch")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: viDictionary.marketCharts.controls.refreshLatestData,
      })
    ).toBeEnabled()
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
    const nextStatus = screen.getByTestId("market-chart-next-event-status")
    const eventSettings = screen.getByRole("button", {
      name: viDictionary.marketCharts.controls.eventSettingsAria,
    })
    eventSettings.focus()
    expect(eventSettings).toHaveFocus()

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    await waitFor(() => expect(futureRequestCount).toBe(2))

    const emptyNextButton = await screen.findByRole("button", {
      name: new RegExp(viDictionary.marketCharts.calendar.noNextEvent),
    })
    expect(emptyNextButton).toBeDisabled()
    expect(emptyNextButton).not.toHaveTextContent("US Natural Gas Storage")
    expect(screen.getByTestId("market-chart-next-event-status")).toBe(
      nextStatus
    )
    expect(nextStatus).toHaveTextContent(
      viDictionary.marketCharts.calendar.noNextEvent
    )
    expect(eventSettings).toHaveFocus()
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
        name: `${viDictionary.marketCharts.calendar.nextEvent}: ${viDictionary.marketCharts.calendar.loadError}`,
      })
    ).toBeDisabled()
    expect(
      screen.queryByText("Calendar refresh failed")
    ).not.toBeInTheDocument()
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
        symbol: "BTC/USDT",
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
        expect.objectContaining({ assetId: 102, timeframe: "1m" }),
        expect.any(Object)
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
        symbol: "BTC/USDT",
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
        expect.objectContaining({ assetId: 102, timeframe: "5m" }),
        expect.any(Object)
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
