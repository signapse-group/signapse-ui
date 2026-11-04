"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated, type BackendApiError } from "@/app/api/auth/action"
import type { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  createNewsOutletRequestSchema,
  updateNewsOutletRequestSchema,
  type CreateNewsOutletRequest,
  type NewsOutletListResponse,
  type NewsOutletResponse,
  type UpdateNewsOutletRequest,
} from "@/app/lib/news-outlets/definitions"
import { queryParamsToString } from "@/app/lib/utils"

export async function getNewsOutlets(
  searchParams: SearchParams
): Promise<Page<NewsOutletListResponse>> {
  return fetchAuthenticated<Page<NewsOutletListResponse>>(
    `/news-outlets?${queryParamsToString(searchParams)}`
  )
}

export async function getActiveNewsOutlets(
  searchParams: SearchParams
): Promise<Page<NewsOutletListResponse>> {
  return fetchAuthenticated<Page<NewsOutletListResponse>>(
    `/news-outlets/active?${queryParamsToString(searchParams)}`
  )
}

export async function getNewsOutletById(
  id: number
): Promise<NewsOutletResponse> {
  return fetchAuthenticated<NewsOutletResponse>(`/news-outlets/${id}`)
}

export async function createNewsOutlet(
  request: CreateNewsOutletRequest
): Promise<ActionResult<NewsOutletResponse>> {
  const dictionary = await getServerDictionary()
  const parsed = createNewsOutletRequestSchema.safeParse(request)

  if (!parsed.success) {
    const invalidField = parsed.error.issues[0]?.path[0]
    const error =
      invalidField === "name"
        ? dictionary.newsOutlets.nameRequired
        : invalidField === "homepageUrl"
          ? dictionary.newsOutlets.homepageRequired
          : dictionary.newsOutlets.createError

    return { success: false, error }
  }

  try {
    const newsOutlet = await fetchAuthenticated<NewsOutletResponse>(
      "/news-outlets",
      {
        method: "POST",
        body: JSON.stringify(parsed.data),
      }
    )

    revalidatePath("/news-outlets")

    return { success: true, data: newsOutlet }
  } catch (error: unknown) {
    return {
      success: false,
      error: getNewsOutletActionError(
        error,
        dictionary.newsOutlets.createError
      ),
    }
  }
}

export async function updateNewsOutlet(
  id: number,
  request: UpdateNewsOutletRequest
): Promise<ActionResult<NewsOutletResponse>> {
  const dictionary = await getServerDictionary()
  const parsed = updateNewsOutletRequestSchema.safeParse(request)

  if (!parsed.success) {
    return { success: false, error: dictionary.newsOutlets.updateError }
  }

  try {
    const newsOutlet = await fetchAuthenticated<NewsOutletResponse>(
      `/news-outlets/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      }
    )

    revalidatePath("/news-outlets")
    revalidatePath(`/news-outlets/${id}`)

    return { success: true, data: newsOutlet }
  } catch (error: unknown) {
    return {
      success: false,
      error: getNewsOutletActionError(
        error,
        dictionary.newsOutlets.updateError
      ),
    }
  }
}

export async function toggleNewsOutletActive(
  id: number
): Promise<ActionResult<NewsOutletResponse>> {
  try {
    const newsOutlet = await fetchAuthenticated<NewsOutletResponse>(
      `/news-outlets/${id}/toggle-active`,
      {
        method: "PATCH",
      }
    )

    revalidatePath("/news-outlets")
    revalidatePath(`/news-outlets/${id}`)

    return { success: true, data: newsOutlet }
  } catch (error: unknown) {
    const dictionary = await getServerDictionary()
    return {
      success: false,
      error: getNewsOutletActionError(
        error,
        dictionary.newsOutlets.toggleError
      ),
    }
  }
}

export async function deleteNewsOutlet(id: number): Promise<ActionResult> {
  try {
    await fetchAuthenticated<void>(`/news-outlets/${id}`, {
      method: "DELETE",
    })

    revalidatePath("/news-outlets")

    return { success: true, data: undefined }
  } catch (error: unknown) {
    const dictionary = await getServerDictionary()
    return {
      success: false,
      error: getNewsOutletActionError(
        error,
        dictionary.newsOutlets.deleteError
      ),
    }
  }
}

function getNewsOutletActionError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback

  const apiError = error as BackendApiError
  if (typeof apiError.status === "number" && apiError.status >= 400) {
    return error.message || fallback
  }

  return fallback
}
