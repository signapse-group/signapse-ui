import { NextRequest, NextResponse } from "next/server"

import { getBackendAuthHeaders } from "@/app/api/auth/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { injectTraceContextForBackend } from "@/app/lib/observability/server"
import {
  isMarketChartTimeframe,
  marketChartLiveRequestSchema,
} from "@/app/lib/market-charts/definitions"

export async function GET(request: NextRequest) {
  const dictionary = await getDictionary(await getRequestLocale())
  const messages = dictionary.marketCharts.live
  const assetId = Number(request.nextUrl.searchParams.get("assetId"))
  const timeframe = request.nextUrl.searchParams.get("timeframe") ?? ""
  const parsedRequest = marketChartLiveRequestSchema.safeParse({
    assetId,
    timeframe,
  })

  if (!parsedRequest.success || !isMarketChartTimeframe(timeframe)) {
    return NextResponse.json(
      { message: messages.requestInvalid },
      { status: 400 }
    )
  }

  const apiBaseUrl = process.env.API_BASE_URL

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: messages.apiBaseMissing },
      { status: 500 }
    )
  }

  try {
    const authHeaders = await getBackendAuthHeaders()
    const url = new URL("/market-charts/live", apiBaseUrl)

    url.searchParams.set("assetId", String(parsedRequest.data.assetId))
    url.searchParams.set("timeframe", parsedRequest.data.timeframe)
    injectTraceContextForBackend(authHeaders, url.toString(), apiBaseUrl)

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "text/event-stream",
        ...authHeaders,
      },
      signal: request.signal,
      opentelemetry: {
        ignore: true,
        propagateContext: false,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()

      if (response.status === 503) {
        try {
          const errorBody: unknown = JSON.parse(errorText)

          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "code" in errorBody &&
            errorBody.code === "USER_PROVISIONING_PENDING"
          ) {
            const retryAfterSeconds = Number(
              response.headers.get("Retry-After")
            )
            const retryAfterMilliseconds =
              Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? Math.ceil(retryAfterSeconds * 1000)
                : 2000

            return new Response(`retry: ${retryAfterMilliseconds}\n\n`, {
              headers: {
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "Content-Type": "text/event-stream",
              },
            })
          }
        } catch {}
      }

      return new NextResponse(errorText || messages.openError, {
        status: response.status,
      })
    }

    if (!response.body) {
      return new NextResponse(messages.emptyStream, {
        status: 502,
      })
    }

    return new Response(response.body, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
      status: 200,
    })
  } catch (error) {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : messages.openError,
      },
      { status: 500 }
    )
  }
}
