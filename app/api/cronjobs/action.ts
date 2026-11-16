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

function isValidCronjobId(id: unknown): id is number {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0
}

type PauseCronjobActionResult =
  | { success: true; data: CronjobResponse }
  | { success: false; error: string; ambiguous: boolean }

type ResumeCronjobActionResult =
  | { success: true; data: CronjobResponse }
  | { success: false; error: string; ambiguous: boolean }

type UpdateCronjobActionResult =
  | { success: true; data: CronjobResponse }
  | {
      success: false
      error: string
      data?: CronjobResponse
      ambiguous: boolean
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
  if (!isValidCronjobId(id)) {
    const dictionary = await getDictionary(await getRequestLocale())
    throw new Error(dictionary.cronjobs.invalidCronjobId)
  }

  return fetchCronjob(`/cronjobs/${id}`)
}

export async function updateCronjob(
  id: number,
  request: CronjobRequest
): Promise<UpdateCronjobActionResult> {
  const dictionary = await getDictionary(await getRequestLocale())
  if (!isValidCronjobId(id)) {
    return {
      success: false,
      error: dictionary.cronjobs.invalidCronjobId,
      ambiguous: false,
    }
  }

  const parsedRequest = CronjobRequestSchema.safeParse(request)
  if (!parsedRequest.success) {
    return {
      success: false,
      error: dictionary.cronjobs.cronRequired,
      ambiguous: false,
    }
  }

  const expression = parsedRequest.data.expression
  try {
    const cronjob = await fetchCronjob(`/cronjobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ expression }),
    })
    if (cronjob.id !== id || cronjob.cronExpression !== expression) {
      throw new Error(
        "Cronjob update response did not confirm the requested schedule."
      )
    }
    revalidatePath("/cronjobs")
    return { success: true, data: cronjob }
  } catch (error: unknown) {
    const backendError =
      error instanceof Error ? (error as BackendApiError) : undefined
    const status = backendError?.status
    const apiMessage = error instanceof Error ? error.message.trim() : ""
    const provisioningPending =
      backendError?.code === "USER_PROVISIONING_PENDING"

    let message = dictionary.cronjobs.cronUpdateError
    if (status === 400) {
      message = apiMessage || dictionary.cronjobs.cronInvalidExpression
    } else if (status === 401) {
      message = apiMessage || dictionary.cronjobs.cronUpdateUnauthorized
    } else if (status === 403) {
      message = apiMessage || dictionary.cronjobs.cronUpdatePermissionDenied
    } else if (status === 404) {
      message = apiMessage || dictionary.cronjobs.cronUpdateNotFound
    } else if (
      status === 409 &&
      backendError?.code === "USER_PROVISIONING_REJECTED"
    ) {
      message = dictionary.cronjobs.provisioningRejected
    } else if (status === 409) {
      message = apiMessage || dictionary.cronjobs.cronUpdateConflict
    } else if (provisioningPending) {
      message = apiMessage || dictionary.cronjobs.cronUpdateProvisioningPending
    } else if (status === undefined || status >= 500) {
      message = dictionary.cronjobs.cronUpdateUnconfirmed
    } else {
      message = apiMessage || dictionary.cronjobs.cronUpdateError
    }

    const ambiguous =
      !provisioningPending && (status === undefined || status >= 500)

    try {
      const current = await getCronjobById(id)
      revalidatePath("/cronjobs")

      if (ambiguous && current.cronExpression === expression) {
        return { success: true, data: current }
      }

      return { success: false, error: message, data: current, ambiguous }
    } catch (readError: unknown) {
      const readStatus =
        readError instanceof Error
          ? (readError as BackendApiError).status
          : undefined
      if (readStatus === 404) {
        return {
          success: false,
          error: dictionary.cronjobs.cronUpdateNotFound,
          ambiguous: false,
        }
      }

      return {
        success: false,
        error: ambiguous
          ? dictionary.cronjobs.cronUpdateReadbackUnavailable
          : message,
        ambiguous,
      }
    }
  }
}

export async function startCronjob(id: number): Promise<ActionResult<void>> {
  if (!isValidCronjobId(id)) {
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
): Promise<PauseCronjobActionResult> {
  if (!isValidCronjobId(id)) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error: dictionary.cronjobs.invalidCronjobId,
      ambiguous: false,
    }
  }

  try {
    const cronjob = await fetchCronjob(`/cronjobs/${id}/pause`, {
      method: "POST",
    })
    return { success: true, data: cronjob }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    const backendError =
      error instanceof Error ? (error as BackendApiError) : undefined
    const status = backendError?.status
    let message = dictionary.cronjobs.pauseError
    if (status === 403) {
      message = dictionary.cronjobs.pausePermissionDenied
    } else if (status === 404) {
      message = dictionary.cronjobs.pauseNotFound
    } else if (status === 409) {
      if (backendError?.code === "USER_PROVISIONING_REJECTED") {
        message = dictionary.cronjobs.provisioningRejected
      }
    }
    return {
      success: false,
      error: message,
      ambiguous: status === undefined || status >= 500,
    }
  }
}

export async function resumeCronjob(
  id: number
): Promise<ResumeCronjobActionResult> {
  if (!isValidCronjobId(id)) {
    const dictionary = await getDictionary(await getRequestLocale())
    return {
      success: false,
      error: dictionary.cronjobs.invalidCronjobId,
      ambiguous: false,
    }
  }

  try {
    const cronjob = await fetchCronjob(`/cronjobs/${id}/resume`, {
      method: "POST",
    })
    revalidatePath("/cronjobs")
    return { success: true, data: cronjob }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    const status =
      error instanceof Error ? (error as BackendApiError).status : undefined
    return {
      success: false,
      error: getResumeError(error, dictionary.cronjobs),
      ambiguous: status === undefined || status >= 500,
    }
  }
}

function getResumeError(
  error: unknown,
  messages: Awaited<ReturnType<typeof getDictionary>>["cronjobs"]
): string {
  if (!(error instanceof Error)) return messages.resumeError

  const status = (error as BackendApiError).status
  if (status === 401 || status === 403) {
    return messages.resumePermissionError
  }
  if (status === 404) return messages.resumeMissingError
  if (status === 409) {
    return (error as BackendApiError).code === "USER_PROVISIONING_REJECTED"
      ? messages.provisioningRejected
      : messages.resumeConflictError
  }

  return messages.resumeError
}
