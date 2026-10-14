"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getLanguages } from "@/app/api/languages/action"
import { ActionResult } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { isSelectableLanguage } from "@/app/lib/languages/definitions"
import {
  CreateTelegramBotConnectionRequest,
  CreateTelegramLinkTokenRequest,
  getCreateTelegramBotConnectionSchema,
  getCreateTelegramLinkTokenSchema,
  getSaveTelegramMarketAnalysisScheduleSchema,
  getUpdateTelegramFeatureSettingSchema,
  normalizeSaveTelegramMarketAnalysisScheduleRequest,
  SaveTelegramMarketAnalysisScheduleRequest,
  TelegramBotConnectionResponse,
  TelegramDestinationResponse,
  TelegramFeatureSettingResponse,
  TelegramLinkTokenResponse,
  TelegramMarketAnalysisScheduleResponse,
  UpdateTelegramFeatureSettingRequest,
} from "@/app/lib/telegram/definitions"

async function getTelegramDictionary() {
  return getDictionary(await getRequestLocale())
}

function getValidationError(error: z.ZodError, dictionary: Dictionary): string {
  return error.issues[0]?.message ?? dictionary.telegram.validationInvalid
}

function getActionError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

async function validateScheduleRequest(
  request: SaveTelegramMarketAnalysisScheduleRequest,
  dictionary: Dictionary
) {
  const normalized = normalizeSaveTelegramMarketAnalysisScheduleRequest(request)
  let supportedLanguageIsoCodes: string[] | undefined

  if (normalized.outputLanguageIsoCode) {
    try {
      const catalog = await getLanguages()
      supportedLanguageIsoCodes = catalog.languages
        .filter(isSelectableLanguage)
        .map((language) => language.isoCode)
    } catch {
      return {
        success: false as const,
        error: dictionary.telegram.schedule.languageCatalogError,
      }
    }
  }

  const parsed = getSaveTelegramMarketAnalysisScheduleSchema(
    dictionary,
    supportedLanguageIsoCodes
  ).safeParse(normalized)

  if (!parsed.success) {
    return {
      success: false as const,
      error: getValidationError(parsed.error, dictionary),
    }
  }

  return { success: true as const, data: parsed.data }
}

function revalidateTelegramConfiguration() {
  revalidatePath("/telegram")
}

export async function getTelegramBotConnections(): Promise<
  TelegramBotConnectionResponse[]
> {
  return fetchAuthenticated<TelegramBotConnectionResponse[]>(
    "/telegram/bot-connections"
  )
}

export async function getTelegramDestinations(): Promise<
  TelegramDestinationResponse[]
> {
  return fetchAuthenticated<TelegramDestinationResponse[]>(
    "/telegram/destinations"
  )
}

export async function getTelegramFeatureSettings(): Promise<
  TelegramFeatureSettingResponse[]
> {
  return fetchAuthenticated<TelegramFeatureSettingResponse[]>(
    "/telegram/feature-settings"
  )
}

export async function getTelegramMarketAnalysisSchedules(): Promise<
  TelegramMarketAnalysisScheduleResponse[]
> {
  return fetchAuthenticated<TelegramMarketAnalysisScheduleResponse[]>(
    "/telegram/market-analysis-schedules"
  )
}

export async function createTelegramBotConnection(
  request: CreateTelegramBotConnectionRequest
): Promise<ActionResult<TelegramBotConnectionResponse>> {
  const dictionary = await getTelegramDictionary()
  const parsed =
    getCreateTelegramBotConnectionSchema(dictionary).safeParse(request)

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error, dictionary),
    }
  }

  try {
    const data = await fetchAuthenticated<TelegramBotConnectionResponse>(
      "/telegram/bot-connections",
      {
        method: "POST",
        body: JSON.stringify(parsed.data),
      }
    )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.bot.createError),
    }
  }
}

export async function disableTelegramBotConnection(
  id: number
): Promise<ActionResult<TelegramBotConnectionResponse>> {
  const dictionary = await getTelegramDictionary()

  try {
    const data = await fetchAuthenticated<TelegramBotConnectionResponse>(
      `/telegram/bot-connections/${id}/disable`,
      {
        method: "PATCH",
      }
    )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.bot.disableError),
    }
  }
}

export async function deleteTelegramBotConnection(
  id: number
): Promise<ActionResult> {
  const dictionary = await getTelegramDictionary()

  try {
    await fetchAuthenticated<void>(`/telegram/bot-connections/${id}`, {
      method: "DELETE",
    })

    revalidateTelegramConfiguration()

    return { success: true, data: undefined }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.bot.deleteError),
    }
  }
}

export async function createTelegramLinkToken(
  request: CreateTelegramLinkTokenRequest
): Promise<ActionResult<TelegramLinkTokenResponse>> {
  const dictionary = await getTelegramDictionary()
  const parsed = getCreateTelegramLinkTokenSchema().safeParse(request)

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error, dictionary),
    }
  }

  try {
    const data = await fetchAuthenticated<TelegramLinkTokenResponse>(
      "/telegram/destinations/link-token",
      {
        method: "POST",
        body: JSON.stringify(parsed.data),
      }
    )

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(
        error,
        dictionary.telegram.destination.createLinkError
      ),
    }
  }
}

export async function sendTelegramTestMessage(
  id: number
): Promise<ActionResult> {
  const dictionary = await getTelegramDictionary()

  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      error: dictionary.telegram.destination.invalidData,
    }
  }

  try {
    await fetchAuthenticated<void>(
      `/telegram/destinations/${id}/test-message`,
      {
        method: "POST",
      }
    )

    return { success: true, data: undefined }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(
        error,
        dictionary.telegram.destination.testMessageError
      ),
    }
  }
}

export async function disableTelegramDestination(
  id: number
): Promise<ActionResult<TelegramDestinationResponse>> {
  const dictionary = await getTelegramDictionary()

  try {
    const data = await fetchAuthenticated<TelegramDestinationResponse>(
      `/telegram/destinations/${id}/disable`,
      {
        method: "PATCH",
      }
    )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(
        error,
        dictionary.telegram.destination.disableError
      ),
    }
  }
}

export async function deleteTelegramDestination(
  id: number
): Promise<ActionResult> {
  const dictionary = await getTelegramDictionary()

  try {
    await fetchAuthenticated<void>(`/telegram/destinations/${id}`, {
      method: "DELETE",
    })

    revalidateTelegramConfiguration()

    return { success: true, data: undefined }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.destination.deleteError),
    }
  }
}

export async function updateTelegramFeatureSetting(
  request: UpdateTelegramFeatureSettingRequest
): Promise<ActionResult<TelegramFeatureSettingResponse>> {
  const dictionary = await getTelegramDictionary()
  const parsed = getUpdateTelegramFeatureSettingSchema().safeParse(request)

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error, dictionary),
    }
  }

  try {
    const data = await fetchAuthenticated<TelegramFeatureSettingResponse>(
      "/telegram/feature-settings",
      {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      }
    )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.routing.updateError),
    }
  }
}

export async function createTelegramMarketAnalysisSchedule(
  request: SaveTelegramMarketAnalysisScheduleRequest
): Promise<ActionResult<TelegramMarketAnalysisScheduleResponse>> {
  const dictionary = await getTelegramDictionary()
  const parsed = await validateScheduleRequest(request, dictionary)

  if (!parsed.success) return parsed

  try {
    const data =
      await fetchAuthenticated<TelegramMarketAnalysisScheduleResponse>(
        "/telegram/market-analysis-schedules",
        {
          method: "POST",
          body: JSON.stringify(parsed.data),
        }
      )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.schedule.createError),
    }
  }
}

export async function updateTelegramMarketAnalysisSchedule(
  id: number,
  request: SaveTelegramMarketAnalysisScheduleRequest
): Promise<ActionResult<TelegramMarketAnalysisScheduleResponse>> {
  const dictionary = await getTelegramDictionary()
  const parsed = await validateScheduleRequest(request, dictionary)

  if (!parsed.success) return parsed

  try {
    const data =
      await fetchAuthenticated<TelegramMarketAnalysisScheduleResponse>(
        `/telegram/market-analysis-schedules/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(parsed.data),
        }
      )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.schedule.updateError),
    }
  }
}

export async function disableTelegramMarketAnalysisSchedule(
  id: number
): Promise<ActionResult<TelegramMarketAnalysisScheduleResponse>> {
  const dictionary = await getTelegramDictionary()

  try {
    const data =
      await fetchAuthenticated<TelegramMarketAnalysisScheduleResponse>(
        `/telegram/market-analysis-schedules/${id}/disable`,
        {
          method: "PATCH",
        }
      )

    revalidateTelegramConfiguration()

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.schedule.disableError),
    }
  }
}

export async function deleteTelegramMarketAnalysisSchedule(
  id: number
): Promise<ActionResult> {
  const dictionary = await getTelegramDictionary()

  try {
    await fetchAuthenticated<void>(
      `/telegram/market-analysis-schedules/${id}`,
      {
        method: "DELETE",
      }
    )

    revalidateTelegramConfiguration()

    return { success: true, data: undefined }
  } catch (error: unknown) {
    return {
      success: false,
      error: getActionError(error, dictionary.telegram.schedule.deleteError),
    }
  }
}
