import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({
    graphView: {
      responseInvalid: "Invalid graph response",
    },
  }),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: async () => "en",
}))

import { getGraphView } from "@/app/api/graph-view/action"
import type { GraphViewResponse } from "@/app/lib/graph-view/definitions"

function createGraphResponse(): GraphViewResponse {
  const metadata = {
    slug: null,
    canonicalKey: null,
    symbol: null,
    assetType: null,
    sourceName: null,
    url: null,
    occurredAt: null,
    publishedAt: null,
    status: null,
    narrativeStatus: null,
    confidence: null,
    thesis: null,
    themes: null,
  }

  return {
    nodes: [
      {
        id: "event:1",
        kind: "event",
        label: "Event",
        secondaryLabel: null,
        metadata,
      },
      {
        id: "asset:2",
        kind: "asset",
        label: "Asset",
        secondaryLabel: null,
        metadata,
      },
      {
        id: "news-article:3",
        kind: "news-article",
        label: "Article",
        secondaryLabel: null,
        metadata,
      },
      {
        id: "narrative:4",
        kind: "narrative",
        label: "Narrative",
        secondaryLabel: null,
        metadata: { ...metadata, thesis: "A producer supplied thesis." },
      },
    ],
    edges: [
      {
        id: "event:1-asset:2",
        kind: "event-asset",
        sourceNodeId: "event:1",
        targetNodeId: "asset:2",
        relationType: "AFFECTED_ASSET",
        weight: null,
        confidence: null,
        note: null,
      },
    ],
  }
}

describe("getGraphView", () => {
  beforeEach(() => {
    mocks.fetchAuthenticated.mockReset()
  })

  it("accepts producer nulls for every node kind and edge metadata", async () => {
    const response = createGraphResponse()
    mocks.fetchAuthenticated.mockResolvedValue(response)

    await expect(getGraphView()).resolves.toEqual(response)
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith("/graph-view")
  })

  it("rejects an omitted producer-required nullable field", async () => {
    const response = structuredClone(createGraphResponse()) as unknown as {
      nodes: Array<Record<string, unknown>>
      edges: unknown[]
    }
    delete response.nodes[0]?.secondaryLabel
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.fetchAuthenticated.mockResolvedValue(response)

    await expect(getGraphView()).rejects.toThrow("Invalid graph response")

    consoleError.mockRestore()
  })
})
