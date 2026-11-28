import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { getBackendAuthHeaders, injectTraceContextForBackend } = vi.hoisted(
  () => ({
    getBackendAuthHeaders: vi.fn(async () => ({
      Authorization: "Bearer test-token",
    })),
    injectTraceContextForBackend: vi.fn((headers: Record<string, string>) => {
      headers["x-trace-id"] = "test-trace"
    }),
  })
)

vi.mock("@/app/api/auth/action", () => ({ getBackendAuthHeaders }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({
    marketConversations: {
      streamError: "The stream could not be read.",
      streamRequestInvalid: "The stream request is invalid.",
    },
  })),
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "vi"),
}))
vi.mock("@/app/lib/observability/server", () => ({
  injectTraceContextForBackend,
}))

import { GET } from "@/app/api/market-conversations/[conversationId]/turns/[submissionId]/events/route"

const params = Promise.resolve({ conversationId: "42", submissionId: "108" })

describe("market conversation turn event route", () => {
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "https://api.example.test")
    vi.stubGlobal("fetch", vi.fn())
    vi.mocked(getBackendAuthHeaders).mockClear()
    vi.mocked(injectTraceContextForBackend).mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("proxies the authenticated SSE response without the JSON transport timeout", async () => {
    const eventText = 'event: progress\ndata: {"sequenceNumber":1}\n\n'
    const fetcher = vi.mocked(fetch).mockResolvedValue(
      new Response(eventText, {
        headers: { "Content-Type": "text/event-stream" },
      })
    )
    const request = new NextRequest(
      "http://localhost/api/market-conversations/42/turns/108/events?afterSequence=3"
    )

    const response = await GET(request, { params })

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/event-stream")
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform")
    await expect(response.text()).resolves.toBe(eventText)
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/market-conversations/42/turns/108/events?afterSequence=3",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          "Accept-Language": "vi",
          Authorization: "Bearer test-token",
          "x-trace-id": "test-trace",
        }),
        signal: request.signal,
      })
    )
  })

  it("rejects invalid path identifiers and cursors before contacting the backend", async () => {
    const fetcher = vi.mocked(fetch)
    const response = await GET(
      new NextRequest(
        "http://localhost/api/market-conversations/42/turns/108/events?afterSequence=-1"
      ),
      { params }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: "The stream request is invalid.",
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("returns a localized error instead of exposing upstream response text", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("private backend details", { status: 503 })
    )
    const response = await GET(
      new NextRequest(
        "http://localhost/api/market-conversations/42/turns/108/events"
      ),
      { params }
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      message: "The stream could not be read.",
    })
  })
})
