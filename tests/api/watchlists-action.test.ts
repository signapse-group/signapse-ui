import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getAllWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import type { Page, SearchParams } from "@/app/lib/definitions"
import type { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"

function watchlistPage(
  content: WorkspaceWatchlistAssetListItemResponse[],
  number: number,
  totalPages: number
): Page<WorkspaceWatchlistAssetListItemResponse> {
  return {
    content,
    pageable: {
      pageNumber: number,
      pageSize: 1,
      offset: number,
      paged: true,
      unpaged: false,
    },
    last: number + 1 === totalPages,
    totalElements: totalPages,
    totalPages,
    size: 1,
    number,
    first: number === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

describe("getAllWorkspaceWatchlistAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns assets from later watchlist pages", async () => {
    const firstPageAsset: WorkspaceWatchlistAssetListItemResponse = {
      id: 1,
      assetId: 101,
      assetName: "Bitcoin",
      assetSymbol: "BTC",
      assetType: "CRYPTO",
      createdDate: "2026-11-27T00:00:00Z",
    }
    const laterPageAsset: WorkspaceWatchlistAssetListItemResponse = {
      id: 2,
      assetId: 202,
      assetName: "Tesla",
      assetSymbol: "TSLA",
      assetType: "EQUITY",
      createdDate: "2026-11-27T00:00:00Z",
    }
    vi.mocked(fetchAuthenticated)
      .mockResolvedValueOnce(watchlistPage([firstPageAsset], 0, 2))
      .mockResolvedValueOnce(watchlistPage([laterPageAsset], 1, 2))

    const searchParams: SearchParams = {
      filter: "",
      page: 0,
      size: 1,
      sort: [],
    }

    await expect(getAllWorkspaceWatchlistAssets(searchParams)).resolves.toEqual(
      [firstPageAsset, laterPageAsset]
    )
    expect(fetchAuthenticated).toHaveBeenCalledTimes(2)
    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      1,
      "/watchlists?page=0&size=1"
    )
    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      2,
      "/watchlists?page=1&size=1"
    )
  })
})
