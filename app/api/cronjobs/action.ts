"use server"

import { fetchAuthenticated, type BackendApiError } from "@/app/api/auth/action"
import type { ActionResult, SearchParams } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { queryParamsToString } from "@/app/lib/utils"
import {
  CronjobPageResponseSchema,
  CronjobRequestSchema,
  CronjobResponseSchema,
} from "@/app/lib/cronjobs/definitions"
import type {
  CronjobPageResponse,
  CronjobRequest,
  CronjobResponse,
} from "@/app/lib/cronjobs/definitions"
import { revalidatePath } from "next/cache"

async function fetchCronjob(
  path: string,
  options?: RequestInit
): Promise<CronjobResponse> {
  const response = await fetchAuthenticated<unknown>(path, options)
  return CronjobResponseSchema.parse(response)
}

export async function getCronjobs(
  searchParams: SearchParams
): Promise<CronjobPageResponse> {
  const response = await fetchAuthenticated<unknown>(
    `/cronjobs?${queryParamsToString(searchParams)}`
  )
  return CronjobPageResponseSchema.parse(response)
}

export async function getCronjobById(id: number): Promise<CronjobResponse> {
  return fetchCronjob(`/cronjobs/${id}`)
}

export async function updateCronjob(
  id: number,
  request: CronjobRequest
): Promise<ActionResult<CronjobResponse>> {
  try {
    const parsedRequest = CronjobRequestSchema.safeParse(request)
    if (!parsedRequest.success) {
      const dictionary = await getDictionary(await getRequestLocale())
      return { success: false, error: dictionary.cronjobs.cronRequired }
    }

    const cronjob = await fetchCronjob(`/cronjobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(parsedRequest.data),
    })
    revalidatePath("/cronjobs")
    return { success: true, data: cronjob }
  } catch {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error: dictionary.cronjobs.cronUpdateError,
    }
  }
}

export async function startCronjob(id: number): Promise<ActionResult<void>> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    const dictionary = await getDictionary(await getRequestLocale())
    return { success: false, error: dictionary.cronjobs.startError }
  }

  try {
    await fetchAuthenticated<unknown>(`/cronjobs/${id}/start`, {
      method: "POST",
    })
    revalidatePath("/cronjobs")
    return { success: true, data: undefined }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error:
        error instanceof Error &&
        typeof (error as BackendApiError).status === "number"
          ? error.message
          : dictionary.cronjobs.startError,
    }
  }
}

export async function pauseCronjob(
  id: number
): Promise<ActionResult<CronjobResponse>> {
  try {
    const cronjob = await fetchCronjob(`/cronjobs/${id}/pause`, {
      method: "POST",
    })
    revalidatePath("/cronjobs")
    return { success: true, data: cronjob }
  } catch {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error: dictionary.cronjobs.pauseError,
    }
  }
}

export async function resumeCronjob(
  id: number
): Promise<ActionResult<CronjobResponse>> {
  try {
    const cronjob = await fetchCronjob(`/cronjobs/${id}/resume`, {
      method: "POST",
    })
    revalidatePath("/cronjobs")
    return { success: true, data: cronjob }
  } catch {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error: dictionary.cronjobs.resumeError,
    }
  }
}
