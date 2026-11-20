import type { ActionResult } from "@/app/lib/definitions"
import {
  marketChartCandleResponseSchema,
  type MarketChartCandleRequest,
  type MarketChartCandleResponse,
} from "@/app/lib/market-charts/definitions"

type CandleMessages = {
  loadError: string
  responseInvalid: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export async function requestMarketChartCandles(
  request: MarketChartCandleRequest,
  messages: CandleMessages
): Promise<ActionResult<MarketChartCandleResponse>> {
  const query = new URLSearchParams({
    assetId: String(request.assetId),
    timeframe: request.timeframe,
    to: request.to,
    countBack: String(request.countBack),
  })

  try {
    const response = await fetch(`/api/market-charts/candles?${query}`, {
      cache: "no-store",
    })
    const payload: unknown = await response.json().catch(() => null)

    if (isRecord(payload) && payload.success === false) {
      return {
        success: false,
        error:
          typeof payload.error === "string"
            ? payload.error
            : messages.loadError,
      }
    }

    if (!response.ok || !isRecord(payload) || payload.success !== true) {
      return { success: false, error: messages.loadError }
    }

    const parsedResponse = marketChartCandleResponseSchema.safeParse(
      payload.data
    )

    return parsedResponse.success
      ? { success: true, data: parsedResponse.data }
      : { success: false, error: messages.responseInvalid }
  } catch {
    return { success: false, error: messages.loadError }
  }
}
