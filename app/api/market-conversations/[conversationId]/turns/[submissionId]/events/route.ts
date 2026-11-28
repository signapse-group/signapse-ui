import { NextRequest, NextResponse } from "next/server"

import { getBackendAuthHeaders } from "@/app/api/auth/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { injectTraceContextForBackend } from "@/app/lib/observability/server"

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return null

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ conversationId: string; submissionId: string }> }
) {
  const locale = await getRequestLocale()
  const messages = (await getDictionary(locale)).marketConversations
  const { conversationId: rawConversationId, submissionId: rawSubmissionId } =
    await params
  const conversationId = parsePositiveInteger(rawConversationId)
  const submissionId = parsePositiveInteger(rawSubmissionId)
  const rawAfterSequence = request.nextUrl.searchParams.get("afterSequence")
  const afterSequence =
    rawAfterSequence === null ? undefined : Number(rawAfterSequence)

  if (
    conversationId === null ||
    submissionId === null ||
    (rawAfterSequence !== null &&
      (!/^\d+$/.test(rawAfterSequence) ||
        !Number.isSafeInteger(afterSequence) ||
        afterSequence! < 0))
  ) {
    return NextResponse.json(
      { message: messages.streamRequestInvalid },
      { status: 400 }
    )
  }

  const apiBaseUrl = process.env.API_BASE_URL
  if (!apiBaseUrl) {
    return NextResponse.json({ message: messages.streamError }, { status: 500 })
  }

  try {
    const url = new URL(
      `/market-conversations/${conversationId}/turns/${submissionId}/events`,
      apiBaseUrl
    )
    if (afterSequence !== undefined) {
      url.searchParams.set("afterSequence", String(afterSequence))
    }

    const authHeaders = await getBackendAuthHeaders()
    const headers = {
      Accept: "text/event-stream",
      "Accept-Language": locale,
      ...authHeaders,
    }
    injectTraceContextForBackend(headers, url.toString(), apiBaseUrl)

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers,
      signal: request.signal,
      opentelemetry: {
        ignore: true,
        propagateContext: false,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: messages.streamError },
        { status: response.status }
      )
    }

    if (!response.body) {
      return NextResponse.json(
        { message: messages.streamError },
        { status: 502 }
      )
    }

    return new Response(response.body, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
      status: 200,
    })
  } catch {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({ message: messages.streamError }, { status: 500 })
  }
}
