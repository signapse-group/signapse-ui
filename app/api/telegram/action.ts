"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  type BackendApiError,
  fetchAuthenticated,
  fetchAuthenticatedWithStatus,
} from "@/app/api/auth/action"
import { getLanguages } from "@/app/api/languages/action"
import { ActionResult } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { isSelectableLanguage } from "@/app/lib/languages/definitions"
import {
  CreateTelegramBotConnectionRequest,
  CreateTelegramLinkTokenRequest,
  TelegramFeatureSettingResponseSchema,
  getCreateTelegramBotConnectionSchema,
  getCreateTelegramLinkTokenSchema,
  getTelegramLinkTokenResponseSchema,
  getSaveTelegramMarketAnalysisScheduleSchema,
  getUpdateTelegramFeatureSettingSchema,
  normalizeSaveTelegramMarketAnalysisScheduleRequest,
  SaveTelegramMarketAnalysisScheduleRequest,
  telegramBotConnectionReadbackSchema,
  telegramBotConnectionsReadbackResponseSchema,
  TelegramBotConnectionReadback,
  TelegramDestinationResponse,
  TelegramFeatureSettingReadbackSchema,
  TelegramFeatureSettingUpdateResult,
  TelegramLinkTokenResponse,
  TelegramMarketAnalysisScheduleResponse,
  UpdateTelegramFeatureSettingRequest,
} from "@/app/lib/telegram/definitions"
import type {
  TelegramFeatureKey,
  TelegramFeatureSettingResponse,
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

function getCreateBotActionError(
  error: unknown,
  dictionary: Dictionary
): string {
  const apiError =
    error instanceof Error ? (error as BackendApiError) : undefined

  if (apiError?.status === 400) {
    return dictionary.telegram.bot.createTokenVerificationError
  }
  if (apiError?.status === 403) {
    return dictionary.telegram.bot.createPermissionDenied
  }
  if (
    apiError?.status === 409 &&
    apiError.code === "TELEGRAM_BOT_CONNECTION_ALREADY_EXISTS"
  ) {
    return dictionary.telegram.bot.createConnectionConflict
  }

  return dictionary.telegram.bot.createError
}

function isTelegramTestMessageOutcomeUnknown(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || ("status" in error && error.status === 504))
  )
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
  TelegramBotConnectionReadback[]
> {
  const response = await fetchAuthenticated<unknown>(
    "/telegram/bot-connections"
  )
  const parsed =
    telegramBotConnectionsReadbackResponseSchema.safeParse(response)

  if (!parsed.success) {
    throw new Error("Invalid Telegram bot connections response")
  }

  return parsed.data
}

export async function getTelegramDestinations(): Promise<
  TelegramDestinationResponse[]
> {
  return fetchAuthenticated<TelegramDestinationResponse[]>(
    "/telegram/destinations"
  )
}

export async function getTelegramFeatureSettings({
  workspaceId,
  featureKey,
}: {
  workspaceId?: number
  featureKey?: TelegramFeatureKey
} = {}): Promise<TelegramFeatureSettingResponse[]> {
  const filters = [
    workspaceId === undefined ? null : `workspace.id eq ${workspaceId}`,
    featureKey === undefined ? null : `featureKey eq '${featureKey}'`,
  ].filter((filter): filter is string => filter !== null)
  const query = new URLSearchParams()

  if (filters.length > 0) query.set("$filter", filters.join(" and "))
  const queryString = query.toString()

  const response = await fetchAuthenticated<unknown>(
    `/telegram/feature-settings${queryString ? `?${queryString}` : ""}`
  )
  return z.array(TelegramFeatureSettingResponseSchema).parse(response)
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
): Promise<
  ActionResult<{
    connection: TelegramBotConnectionReadback
    created: boolean | null
  }>
> {
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
    const response = await fetchAuthenticatedWithStatus<unknown>(
      "/telegram/bot-connections",
      {
        method: "POST",
        body: JSON.stringify(parsed.data),
      }
    )

    if (response.status !== 200 && response.status !== 201) {
      if (response.status >= 200 && response.status < 300) {
        revalidateTelegramConfiguration()

        return {
          success: true,
          data: {
            connection: {},
            created: null,
          },
        }
      }

      return {
        success: false,
        error: dictionary.telegram.bot.createError,
      }
    }

    const parsedConnection = telegramBotConnectionReadbackSchema.safeParse(
      response.data
    )
    const connection = parsedConnection.success ? parsedConnection.data : {}

    revalidateTelegramConfiguration()

    return {
      success: true,
      data: {
        connection,
        created: response.status === 201,
      },
    }
  } catch (error: unknown) {
    const status = (error as BackendApiError)?.status
    if (typeof status === "number" && status >= 400 && status < 500) {
      return {
        success: false,
        error: getCreateBotActionError(error, dictionary),
      }
    }

    revalidateTelegramConfiguration()

    return {
      success: true,
      data: {
        connection: {},
        created: null,
      },
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
    const apiError =
      error instanceof Error ? (error as BackendApiError) : undefined

    return {
      success: false,
      error:
        apiError?.code === "TELEGRAM_BOT_CONNECTION_HAS_UNREMOVED_DESTINATIONS"
          ? dictionary.telegram.bot.deleteBlockedByDestinations
          : dictionary.telegram.bot.deleteError,
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
    const data = await fetchAuthenticated<unknown>(
      "/telegram/destinations/link-token",
      {
        method: "POST",
        body: JSON.stringify(parsed.data),
      }
    )

    const parsedResponse = getTelegramLinkTokenResponseSchema().safeParse(data)

    if (
      !parsedResponse.success ||
      parsedResponse.data.botConnectionId !== parsed.data.botConnectionId
    ) {
      return {
        success: false,
        error: dictionary.telegram.destination.invalidData,
      }
    }

    return { success: true, data: parsedResponse.data }
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

type TelegramTestMessageResult =
  | { success: true; data: undefined }
  | {
      success: false
      error: string
      outcome: "known-error" | "unknown"
    }

export async function sendTelegramTestMessage(
  id: number
): Promise<TelegramTestMessageResult> {
  const dictionary = await getTelegramDictionary()

  if (!Number.isInteger(id) || id <= 0) {
    return {
      success: false,
      error: dictionary.telegram.destination.invalidData,
      outcome: "known-error",
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
    if (isTelegramTestMessageOutcomeUnknown(error)) {
      return {
        success: false,
        error: dictionary.telegram.destination.testMessageUnknownOutcome,
        outcome: "unknown",
      }
    }

    return {
      success: false,
      error: getActionError(
        error,
        dictionary.telegram.destination.testMessageError
      ),
      outcome: "known-error",
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
): Promise<ActionResult<TelegramFeatureSettingUpdateResult>> {
  const dictionary = await getTelegramDictionary()
  const parsed =
    getUpdateTelegramFeatureSettingSchema(dictionary).safeParse(request)

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error, dictionary),
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      "/telegram/feature-settings",
      {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      }
    )
    revalidateTelegramConfiguration()

    const responseReadback =
      TelegramFeatureSettingReadbackSchema.safeParse(response)
    if (
      responseReadback.success &&
      responseReadback.data.featureKey === parsed.data.featureKey &&
      responseReadback.data.workspaceId === parsed.data.workspaceId
    ) {
      return { success: true, data: responseReadback.data }
    }

    try {
      const settings = await getTelegramFeatureSettings({
        workspaceId: parsed.data.workspaceId,
        featureKey: parsed.data.featureKey,
      })
      const savedSetting = settings.find(
        (setting) =>
          setting.featureKey === parsed.data.featureKey &&
          setting.workspaceId === parsed.data.workspaceId
      )
      const savedReadback =
        TelegramFeatureSettingReadbackSchema.safeParse(savedSetting)

      if (savedReadback.success) {
        return { success: true, data: savedReadback.data }
      }
    } catch {
      // A successful write with unreadable readback must not leave old state authoritative.
    }

    return { success: true, data: { readbackUnverified: true } }
  } catch (error: unknown) {
    const apiError =
      error instanceof Error ? (error as BackendApiError) : undefined

    return {
      success: false,
      error:
        error instanceof z.ZodError
          ? dictionary.telegram.routing.updateError
          : apiError?.code === "USER_INACTIVE"
            ? dictionary.telegram.routing.updateError
            : apiError?.status === 401 || apiError?.status === 403
              ? dictionary.telegram.routing.updatePermissionDenied
              : dictionary.telegram.routing.updateError,
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
