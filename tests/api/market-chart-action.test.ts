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
  getMarketChartAnnotations,
  getMarketChartEconomicCalendarEvents,
} from "@/app/api/market-charts/action"
import type {
  MarketChartAnnotationRequest,
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

const annotationRequest = {
  assetId: 7,
  from: "2026-08-19T10:00:00.000Z",
  to: "2026-08-19T11:00:00.000Z",
}

const annotationResponse = {
  id: "event:71:asset:7",
  annotationType: "HOT_EVENT",
  assetId: 7,
  time: "2026-08-19T10:30:00.000Z",
  hotEvent: {
    direction: "BULLISH",
    topMarketReaction: { timeHorizon: "INTRADAY" },
    evidence: [
      {
        newsArticleId: 71,
        evidenceRole: "PRIMARY",
      },
    ],
  },
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

describe("market chart annotation action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("accepts the published annotation enums", async () => {
    const warmAnnotationResponse = {
      id: "warm-episode:4:asset:7",
      annotationType: "WARM_EPISODE",
      assetId: 7,
      time: "2026-08-19T10:00:00.000Z",
      warmEpisode: {
        warmEpisodeId: 4,
        periodStart: "2026-08-19T10:00:00.000Z",
        periodEnd: "2026-08-19T11:00:00.000Z",
        events: [
          {
            warmEpisodeEventId: 41,
            time: "2026-08-19T10:30:00.000Z",
            relationType: "PRIMARY_SUBJECT",
          },
        ],
      },
    }
    const annotations = [annotationResponse, warmAnnotationResponse]
    vi.mocked(fetchAuthenticated).mockResolvedValue(annotations)

    await expect(
      getMarketChartAnnotations(annotationRequest)
    ).resolves.toMatchObject({ success: true, data: annotations })
  })

  it("rejects an unpublished reaction horizon", async () => {
    const invalidAnnotation = {
      ...annotationResponse,
      hotEvent: {
        ...annotationResponse.hotEvent,
        topMarketReaction: { timeHorizon: "LONGER_TERM" },
      },
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue([invalidAnnotation])

    await expect(
      getMarketChartAnnotations(annotationRequest)
    ).resolves.toMatchObject({ success: false })
  })

  it("rejects an unpublished warm-event relation type", async () => {
    const invalidAnnotation = {
      ...annotationResponse,
      annotationType: "WARM_EPISODE",
      hotEvent: undefined,
      warmEpisode: {
        warmEpisodeId: 17,
        periodStart: "2026-08-19T10:00:00.000Z",
        periodEnd: "2026-08-19T11:00:00.000Z",
        events: [
          {
            warmEpisodeEventId: 18,
            time: "2026-08-19T10:30:00.000Z",
            relationType: "UNRELATED",
          },
        ],
      },
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue([invalidAnnotation])

    await expect(
      getMarketChartAnnotations(annotationRequest)
    ).resolves.toMatchObject({ success: false })
  })

  it.each([
    ["direction", { direction: "UP" }],
    ["evidence role", { evidenceRole: "PRIMARY_SUBJECT" }],
  ])("rejects an unpublished annotation %s enum value", async (field, invalid) => {
    const invalidAnnotation = {
      ...annotationResponse,
      hotEvent: {
        ...annotationResponse.hotEvent,
        ...(field === "direction" ? invalid : {}),
        evidence: [
          {
            ...annotationResponse.hotEvent.evidence[0],
            ...(field === "evidence role" ? invalid : {}),
          },
        ],
      },
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue([invalidAnnotation])

    await expect(
      getMarketChartAnnotations(annotationRequest)
    ).resolves.toMatchObject({ success: false })
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

describe("market chart annotation action", () => {
  const request: MarketChartAnnotationRequest = {
    assetId: 7,
    from: "2026-08-19T10:00:00.000Z",
    to: "2026-08-19T11:00:00.000Z",
  }

  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("serializes the half-open range and keeps the complete annotation array", async () => {
    const annotations = Array.from({ length: 125 }, (_, index) => ({
      id: `annotation-${index + 1}`,
      annotationType: "HOT_EVENT",
      assetId: 7,
      time: "2026-08-19T10:30:00.000Z",
      hotEvent: { eventId: index + 1, evidence: [] },
    }))
    vi.mocked(fetchAuthenticated).mockResolvedValue(annotations)

    const result = await getMarketChartAnnotations(request)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(125)
      expect(result.data.at(-1)?.id).toBe("annotation-125")
    }
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/market-charts/annotations?assetId=7&from=2026-08-19T10%3A00%3A00.000Z&to=2026-08-19T11%3A00%3A00.000Z"
    )
  })

  it("rejects annotation types outside the published contract", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue([
      {
        id: "annotation-1",
        annotationType: "UNSUPPORTED",
        assetId: 7,
        time: "2026-08-19T10:30:00.000Z",
      },
    ])

    await expect(getMarketChartAnnotations(request)).resolves.toMatchObject({
      success: false,
      error: testDictionary.marketCharts.responseInvalid,
    })
  })
})
