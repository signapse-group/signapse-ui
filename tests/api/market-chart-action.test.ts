import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    marketCharts: {
      invalidAsset: "Asset is invalid",
      selectWatchlistAsset: "Select a watchlist asset",
      unsupportedTimeframe: "Timeframe is unsupported",
      toRequired: "To is required",
      toInvalid: "To is invalid",
      fromRequired: "From is required",
      fromInvalid: "From is invalid",
      toAfterFrom: "To must be after from",
      validationInvalid: "Request is invalid",
      responseInvalid: "Response is invalid",
      loadError: "Chart failed to load",
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "vi"),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import {
  getMarketChartCandles,
  getMarketChartEconomicCalendarEvents,
} from "@/app/api/market-charts/action"
import type {
  MarketChartCandleRequest,
  MarketChartEconomicCalendarEventRequest,
} from "@/app/lib/market-charts/definitions"

const request: MarketChartCandleRequest = {
  assetId: 7,
  timeframe: "1h",
  to: "2026-08-19T11:00:00Z",
  countBack: 300,
}

const response = {
  provider: "fixture",
  symbol: "XAUUSD",
  asset: {
    id: 7,
    name: "Gold",
    symbol: "XAUUSD",
    type: "COMMODITY",
  },
  timeframe: "1h",
  from: "2026-08-19T10:00:00.000Z",
  to: "2026-08-19T11:00:00.000Z",
  candles: [
    {
      time: "2026-08-19T10:00:00.000Z",
      open: 100,
      high: 105,
      low: 99,
      close: 104,
      partial: true,
    },
  ],
}

describe("market chart candle action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("serializes to plus countBack and never sends legacy from", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(getMarketChartCandles(request)).resolves.toEqual({
      success: true,
      data: response,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/market-charts/candles?assetId=7&timeframe=1h&to=2026-08-19T11%3A00%3A00Z&countBack=300"
    )
  })

  it("rejects legacy from and out-of-range countBack before transport", async () => {
    const legacyRequest = {
      ...request,
      from: "2026-08-18T11:00:00Z",
    } as unknown as MarketChartCandleRequest

    await expect(getMarketChartCandles(legacyRequest)).resolves.toMatchObject({
      success: false,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()

    await expect(
      getMarketChartCandles({ ...request, countBack: 1001 })
    ).resolves.toMatchObject({ success: false })
    expect(fetchAuthenticated).not.toHaveBeenCalled()

    await expect(
      getMarketChartCandles({ ...request, countBack: 0 })
    ).resolves.toMatchObject({ success: false })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("accepts only an exact anchor for terminal empty history", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...response,
      from: request.to,
      to: request.to,
      candles: [],
    })

    await expect(getMarketChartCandles(request)).resolves.toMatchObject({
      success: true,
      data: { candles: [] },
    })

    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...response,
      from: "2026-08-19T10:00:00Z",
      to: "2026-08-19T10:00:00Z",
      candles: [],
    })

    await expect(getMarketChartCandles(request)).resolves.toEqual({
      success: false,
      error: testDictionary.marketCharts.responseInvalid,
    })

    const diagnostic = String(consoleError.mock.calls[0]?.[0])
    expect(diagnostic).toContain('"outcome":"validation_error"')
    expect(diagnostic).toContain('"validation.issue_codes":"anchor_mismatch"')
    expect(diagnostic).not.toMatch(/assetId=7|2026-08-19|XAUUSD/)
  })
})

describe("market chart economic calendar action", () => {
  const request: MarketChartEconomicCalendarEventRequest = {
    assetId: 7,
    from: "2026-09-08T10:00:00.000Z",
    to: "2026-09-15T10:00:00.000Z",
    impact: ["HIGH", "LOW"],
  }

  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("serializes a half-open future range and repeats selected impacts", async () => {
    const response = [
      {
        id: 901,
        assetId: 7,
        time: "2026-09-08T12:00:00.000Z",
        status: "PENDING" as const,
      },
    ]
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(
      getMarketChartEconomicCalendarEvents(request)
    ).resolves.toEqual({
      success: true,
      data: response,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/market-charts/economic-calendar-events?assetId=7&from=2026-09-08T10%3A00%3A00.000Z&to=2026-09-15T10%3A00%3A00.000Z&impact=HIGH&impact=LOW"
    )
  })

  it("accepts calendar response fields omitted by the OpenAPI schema", async () => {
    const response = [{ scheduledAt: "2026-09-08T12:00:00.000Z" }]
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(
      getMarketChartEconomicCalendarEvents(request)
    ).resolves.toEqual({ success: true, data: response })
  })

  it("rejects an empty impact selection before transport", async () => {
    await expect(
      getMarketChartEconomicCalendarEvents({ ...request, impact: [] })
    ).resolves.toMatchObject({ success: false })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })
})
