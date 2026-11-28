import { NextRequest, NextResponse } from "next/server"

import { getMarketChartCandles } from "@/app/api/market-charts/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { getMarketChartCandleRequestSchema } from "@/app/lib/market-charts/definitions"

export async function GET(request: NextRequest) {
  const dictionary = await getDictionary(await getRequestLocale())
  const parameters = request.nextUrl.searchParams
  const parsedRequest = getMarketChartCandleRequestSchema(dictionary).safeParse(
    {
      assetId: Number(parameters.get("assetId")),
      timeframe: parameters.get("timeframe") ?? "",
      to: parameters.get("to") ?? "",
      countBack: Number(parameters.get("countBack")),
    }
  )

  const result = parsedRequest.success
    ? await getMarketChartCandles(parsedRequest.data)
    : {
        success: false as const,
        error:
          parsedRequest.error.issues[0]?.message ||
          dictionary.marketCharts.validationInvalid,
      }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
    status: parsedRequest.success ? 200 : 400,
  })
}
