"use server"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { queryParamsToString } from "@/app/lib/utils"
import {
  BulkCreateWorkspaceWatchlistAssetsRequest,
  BulkCreateWorkspaceWatchlistAssetsResponse,
  WorkspaceWatchlistAssetListItemResponse,
} from "@/app/lib/watchlists/definitions"

export async function getWorkspaceWatchlistAssets(
  searchParams: SearchParams
): Promise<Page<WorkspaceWatchlistAssetListItemResponse>> {
  return fetchAuthenticated<Page<WorkspaceWatchlistAssetListItemResponse>>(
    `/watchlists?${queryParamsToString(searchParams)}`
  )
}

export async function getAllWorkspaceWatchlistAssets(
  searchParams: SearchParams
): Promise<WorkspaceWatchlistAssetListItemResponse[]> {
  const firstPage = await getWorkspaceWatchlistAssets(searchParams)
  const assets = [...firstPage.content]

  for (let page = firstPage.number + 1; page < firstPage.totalPages; page++) {
    const nextPage = await getWorkspaceWatchlistAssets({
      ...searchParams,
      page,
    })
    assets.push(...nextPage.content)
  }

  return assets
}

export async function addAssetsToWorkspaceWatchlist(
  request: BulkCreateWorkspaceWatchlistAssetsRequest
): Promise<ActionResult<BulkCreateWorkspaceWatchlistAssetsResponse>> {
  try {
    const watchlistAssets =
      await fetchAuthenticated<BulkCreateWorkspaceWatchlistAssetsResponse>(
        "/watchlists/assets",
        {
          method: "POST",
          body: JSON.stringify(request),
        }
      )

    return { success: true, data: watchlistAssets }
  } catch (error: unknown) {
    const dictionary = await getServerDictionary()
    const errorMessage =
      error instanceof Error ? error.message : dictionary.watchlist.addError
    return { success: false, error: errorMessage }
  }
}

export async function removeAssetFromWorkspaceWatchlist(
  assetId: number
): Promise<ActionResult> {
  try {
    await fetchAuthenticated<void>(`/watchlists/assets/${assetId}`, {
      method: "DELETE",
    })

    return { success: true, data: undefined }
  } catch (error: unknown) {
    const dictionary = await getServerDictionary()
    const errorMessage =
      error instanceof Error ? error.message : dictionary.watchlist.removeError
    return { success: false, error: errorMessage }
  }
}
