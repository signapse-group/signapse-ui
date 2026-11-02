import { expect, it, vi } from "vitest"

const { fetchAuthenticatedMock } = vi.hoisted(() => ({
  fetchAuthenticatedMock: vi.fn<(...args: [string]) => Promise<unknown>>(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: fetchAuthenticatedMock,
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({
    workspaceOverview: {
      tradingSnapshot: {
        summaryErrorDescription: "Localized summary error",
      },
    },
  })),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "vi"),
}))

import { getDashboardSummary } from "@/app/api/dashboard/action"

it("parses the current summary without coupling the all-time count to the seven-day list", async () => {
  const response = {
    asOf: "2026-01-15T08:00:00.000Z",
    timezone: "UTC",
    scope: { workspaceId: 7, watchlistAssetCount: 1 },
    nextKeyEvent: { state: "EMPTY", data: null, errorCode: null },
    recentEvents: { state: "EMPTY", items: [], errorCode: null },
    marketEvents24h: {
      state: "EMPTY",
      count: 0,
      window: null,
      errorCode: null,
    },
    activeNarratives: {
      state: "AVAILABLE",
      count: 14,
      statuses: ["EMERGING", "ACTIVE"],
      errorCode: null,
    },
    marketNarratives: {
      state: "AVAILABLE",
      items: [
        {
          id: 81,
          title: null,
          thesis: null,
          status: "EMERGING",
          confidence: null,
          lastUpdatedAt: "2026-01-15T07:00:00.000Z",
          primaryTheme: {
            themeId: 91,
            themeTitle: null,
            themeSlug: "must-not-be-used-as-title",
          },
          assets: [
            {
              assetId: 101,
              assetName: "Bitcoin",
              assetSymbol: "BTCUSD",
              assetType: "CRYPTO",
              relationType: "PRIMARY",
              weight: null,
            },
            {
              assetId: 202,
              assetName: "Gold",
              assetSymbol: "GOLD",
              assetType: "COMMODITY",
              relationType: "AFFECTED",
              weight: 0.5,
            },
          ],
        },
      ],
      errorCode: null,
    },
    latestNews6h: {
      state: "EMPTY",
      count: 0,
      window: null,
      errorCode: null,
    },
    assetsInFocus: {
      state: "AVAILABLE",
      items: [
        {
          assetId: 101,
          assetName: "Bitcoin",
          assetSymbol: "BTCUSD",
          assetType: "CRYPTO",
          context: {
            title: "Động lượng thị trường",
            summary: null,
            observedAt: "2026-01-15T07:00:00.000Z",
          },
        },
      ],
      errorCode: null,
    },
  }
  fetchAuthenticatedMock.mockResolvedValue(response)

  const summary = await getDashboardSummary()

  expect(fetchAuthenticatedMock).toHaveBeenCalledWith("/dashboard/summary")
  expect(summary.activeNarratives.count).toBe(14)
  expect(summary.marketNarratives.items).toHaveLength(1)
  expect(summary.marketNarratives.items[0]).toMatchObject({
    id: 81,
    title: null,
    thesis: null,
    primaryTheme: { themeTitle: null, themeSlug: "must-not-be-used-as-title" },
    assets: [{ assetSymbol: "BTCUSD" }, { assetSymbol: "GOLD" }],
  })
  expect(summary.assetsInFocus.items[0]?.context.summary).toBeNull()
})
