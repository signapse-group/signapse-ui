import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getMe: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({
    graphView: {
      responseInvalid: "Invalid graph response",
      timeRangeInvalid: "Invalid graph time range",
    },
  }),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: async () => "en",
}))

vi.mock("@/app/api/user/action", () => ({ getMe: mocks.getMe }))

import {
  getGraphView,
  getGraphViewForWorkspace,
} from "@/app/api/graph-view/action"
import type {
  GraphViewDays,
  GraphViewResponse,
} from "@/app/lib/graph-view/definitions"
import type { BackendMeResponse } from "@/app/lib/users/definitions"

function createMe(workspaceId: number | null = 10): BackendMeResponse {
  return {
    id: 1,
    email: "user@example.com",
    firstName: null,
    lastName: null,
    role_name: null,
    currentWorkspace:
      workspaceId === null ? null : { id: workspaceId, name: "Test" },
    preferredLanguage: null,
    mainImage: null,
    permissions: [],
  }
}

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
    mocks.getMe.mockReset()
  })

  it("accepts producer nulls for every node kind and edge metadata", async () => {
    const response = createGraphResponse()
    mocks.fetchAuthenticated.mockResolvedValue(response)

    await expect(getGraphView()).resolves.toEqual(response)
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith("/graph-view?days=7")
  })

  it.each([7, 14, 30] as const)(
    "sends the selected %i-day window to the producer",
    async (days) => {
      const response = createGraphResponse()
      mocks.fetchAuthenticated.mockResolvedValue(response)

      await expect(getGraphView(days)).resolves.toEqual(response)

      expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
        `/graph-view?days=${days}`
      )
    }
  )

  it("rejects a range outside the producer enum before making a request", async () => {
    await expect(getGraphView(15 as GraphViewDays)).rejects.toThrow(
      "Invalid graph time range"
    )

    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
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

  it("refuses a result if the active workspace differs before loading", async () => {
    mocks.getMe.mockResolvedValue(createMe(11))

    await expect(
      getGraphViewForWorkspace(14, { userId: 1, workspaceId: 10 })
    ).resolves.toEqual({ kind: "workspace-changed" })

    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("discards a result if the workspace changes while loading", async () => {
    const response = createGraphResponse()
    mocks.getMe
      .mockResolvedValueOnce(createMe(10))
      .mockResolvedValueOnce(createMe(11))
    mocks.fetchAuthenticated.mockResolvedValue(response)

    await expect(
      getGraphViewForWorkspace(14, { userId: 1, workspaceId: 10 })
    ).resolves.toEqual({ kind: "workspace-changed" })
  })

  it("returns a distinct permission result for Graph 403", async () => {
    mocks.getMe.mockResolvedValue(createMe())
    mocks.fetchAuthenticated.mockRejectedValue(
      Object.assign(new Error("Forbidden"), { status: 403 })
    )

    await expect(
      getGraphViewForWorkspace(14, { userId: 1, workspaceId: 10 })
    ).resolves.toEqual({ kind: "permission-denied" })
  })
})
