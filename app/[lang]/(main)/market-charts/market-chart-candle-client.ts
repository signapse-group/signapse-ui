import type { ActionResult } from "@/app/lib/definitions"
import {
  marketChartCandleResponseSchema,
  type MarketChartCandleRequest,
  type MarketChartCandleResponse,
  type MarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import { createLatestHistoryRequest } from "./market-chart-history-helpers"

export type MarketChartCandleMessages = {
  loadError: string
  responseInvalid: string
}

export type MarketChartInitialCandleLoad = {
  workspaceId: number | null
  request: MarketChartCandleRequest
  promise: Promise<ActionResult<MarketChartCandleResponse>>
  start(messages: MarketChartCandleMessages): void
}

export function createInitialMarketChartCandleLoad({
  workspaceId,
  assetId,
  timeframe,
}: {
  workspaceId: number | null
  assetId: number
  timeframe: MarketChartTimeframe
}): MarketChartInitialCandleLoad | null {
  const request = createLatestHistoryRequest({
    assetId,
    currentTimestamp: Date.now(),
    timeframe,
  })

  if (!request) {
    return null
  }

  let resolveResult!: (result: ActionResult<MarketChartCandleResponse>) => void
  const promise = new Promise<ActionResult<MarketChartCandleResponse>>(
    (resolve) => {
      resolveResult = resolve
    }
  )
  let started = false

  return {
    workspaceId,
    request,
    promise,
    start(messages) {
      if (started) {
        return
      }

      started = true
      void requestMarketChartCandles(request, messages).then(
        resolveResult,
        () => resolveResult({ success: false, error: messages.loadError })
      )
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export async function requestMarketChartCandles(
  request: MarketChartCandleRequest,
  messages: MarketChartCandleMessages
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
