// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createMarketChartLiveStreamOpener } from "@/app/[lang]/(main)/market-charts/market-chart-live-stream"
import type { ClientPerformanceMeasurement } from "@/app/lib/observability/client"
import type {
  ObservabilityOperation,
  ObservabilityOutcome,
} from "@/app/lib/observability/semantic"
import type { MarketChartTimeframe } from "@/app/lib/market-charts/definitions"

type Listener = (event: Event) => void

class FakeEventSource {
  static current: FakeEventSource | null = null
  readonly listeners = new Map<string, Listener[]>()
  readonly url: string
  close = vi.fn()

  constructor(url: string | URL) {
    this.url = String(url)
    FakeEventSource.current = this
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback = listener as Listener
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback])
  }

  emit(type: string, event: Event = new Event(type)) {
    this.listeners.get(type)?.forEach((listener) => listener(event))
  }
}

interface FinishRecord {
  attributes: Record<string, unknown>
  operation: ObservabilityOperation
  outcome: ObservabilityOutcome
  startAttributes: Record<string, unknown>
}

function createFixture(timeframe: MarketChartTimeframe = "1h") {
  const finishes: FinishRecord[] = []
  const start = vi.fn(
    (
      operation: ObservabilityOperation,
      startAttributes: Record<string, unknown> = {}
    ): ClientPerformanceMeasurement => ({
      finish(outcome, attributes = {}) {
        finishes.push({ attributes, operation, outcome, startAttributes })
      },
    })
  )
  const handlers = {
    onErrorEvent: vi.fn(),
    onInvalidEvent: vi.fn(),
    onOpen: vi.fn(),
    onPrice: vi.fn(),
    onSnapshot: vi.fn(),
    onStatus: vi.fn(),
    onTransportError: vi.fn(),
  }
  const stream = createMarketChartLiveStreamOpener(start)({
    assetId: 42,
    timeframe,
    ...handlers,
  })
  const source = FakeEventSource.current!

  return { finishes, handlers, source, stream }
}

function message(data: unknown) {
  return new MessageEvent("message", { data: JSON.stringify(data) })
}

const status = {
  assetId: 42,
  symbol: "XAUUSD",
  state: "SUBSCRIBED",
  message: null,
  stale: false,
  observedAt: "2026-08-23T00:00:00Z",
}

const price = {
  assetId: 42,
  symbol: "XAUUSD",
  price: 100,
  receivedAt: "2026-08-23T00:00:01Z",
  stale: false,
}

beforeEach(() => {
  vi.stubGlobal("EventSource", FakeEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
  FakeEventSource.current = null
})

describe("Market Chart live stream observability", () => {
  it.each([
    ["1m", "2026-08-23T00:01:00Z"],
    ["1w", "2026-08-24T00:00:00Z"],
    ["1mo", "2026-09-01T00:00:00Z"],
  ] as const)(
    "forwards a quote at the %s boundary without a candle listener",
    (timeframe, receivedAt) => {
      const fixture = createFixture(timeframe)
      const quote = { ...price, receivedAt }

      fixture.source.emit("price", message(quote))

      expect(fixture.handlers.onPrice).toHaveBeenCalledWith(quote)
      expect(fixture.source.listeners.has("candle")).toBe(false)
    }
  )

  it("measures initial open and only the first valid live data event", () => {
    const fixture = createFixture()

    fixture.source.emit("open")
    fixture.source.emit("status", message(status))
    expect(fixture.finishes).toHaveLength(1)

    fixture.source.emit("price", message(price))
    fixture.source.emit("price", message({ ...price, price: 101 }))

    expect(fixture.handlers.onOpen).toHaveBeenCalledOnce()
    expect(fixture.handlers.onStatus).toHaveBeenCalledOnce()
    expect(fixture.handlers.onPrice).toHaveBeenCalledTimes(2)
    expect(fixture.finishes).toEqual([
      expect.objectContaining({
        operation: "signapse.market_chart.live_connect",
        outcome: "success",
        startAttributes: expect.objectContaining({
          "connection.kind": "initial",
        }),
      }),
      expect.objectContaining({
        attributes: { "market.event_kind": "price" },
        operation: "signapse.market_chart.first_live_data",
        outcome: "success",
        startAttributes: expect.objectContaining({
          "connection.kind": "initial",
        }),
      }),
    ])
  })

  it("classifies invalid payloads without recording event data", () => {
    const fixture = createFixture()

    fixture.source.emit("snapshot", message({ prompt: "private payload" }))

    expect(fixture.handlers.onInvalidEvent).toHaveBeenCalledOnce()
    expect(fixture.finishes.map(({ outcome }) => outcome)).toEqual([
      "invalid_payload",
      "invalid_payload",
    ])
    expect(JSON.stringify(fixture.finishes)).not.toContain("private payload")
  })

  it("accepts a snapshot as the first usable live event", () => {
    const fixture = createFixture()

    fixture.source.emit("open")
    fixture.source.emit(
      "snapshot",
      message({
        asset: {
          id: 42,
          name: "Gold",
          symbol: "XAUUSD",
          type: "COMMODITY",
        },
        symbol: "XAUUSD",
        timeframe: "1h",
        quote: price,
        status,
      })
    )

    expect(fixture.handlers.onSnapshot).toHaveBeenCalledOnce()
    expect(fixture.finishes.at(-1)).toMatchObject({
      attributes: { "market.event_kind": "snapshot" },
      operation: "signapse.market_chart.first_live_data",
      outcome: "success",
    })
  })

  it("accepts a required null quote without creating quote data", () => {
    const fixture = createFixture()
    const snapshot = {
      asset: {
        id: 42,
        name: "Gold",
        symbol: "XAUUSD",
        type: "COMMODITY",
        pricePrecision: 2,
      },
      symbol: "XAUUSD",
      timeframe: "1h",
      quote: null,
      status,
    }

    fixture.source.emit("snapshot", message(snapshot))

    expect(fixture.handlers.onSnapshot).toHaveBeenCalledWith(snapshot)
  })

  it("starts fresh reconnect measurements after transport interruption", () => {
    const fixture = createFixture()

    fixture.source.emit("open")
    fixture.source.emit("price", message(price))
    fixture.source.emit("error")
    fixture.source.emit("open")
    fixture.source.emit("price", message({ ...price, price: 101 }))

    expect(fixture.handlers.onTransportError).toHaveBeenCalledOnce()
    expect(fixture.finishes.slice(-2)).toEqual([
      expect.objectContaining({
        operation: "signapse.market_chart.live_connect",
        outcome: "success",
        startAttributes: expect.objectContaining({
          "connection.kind": "reconnect",
        }),
      }),
      expect.objectContaining({
        attributes: { "market.event_kind": "price" },
        operation: "signapse.market_chart.first_live_data",
        outcome: "success",
        startAttributes: expect.objectContaining({
          "connection.kind": "reconnect",
        }),
      }),
    ])
  })

  it("closes pending measurements as a non-error outcome", () => {
    const fixture = createFixture()

    fixture.stream.close()

    expect(fixture.finishes.map(({ outcome }) => outcome)).toEqual([
      "closed",
      "closed",
    ])
    expect(fixture.source.close).toHaveBeenCalledOnce()
  })
})
