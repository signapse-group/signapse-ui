import { z } from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import type { LanguageResponse } from "@/app/lib/languages/definitions"
import { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"
import { WorkspaceResponse } from "@/app/lib/workspaces/definitions"

export const TELEGRAM_FEATURE_KEYS = [
  "ECONOMIC_CALENDAR_ALERT",
  "MARKET_NEWS_ALERT",
  "SCHEDULED_MARKET_ANALYSIS",
] as const

export type TelegramFeatureKey = (typeof TELEGRAM_FEATURE_KEYS)[number]

export type TelegramConnectionStatus =
  "ACTIVE" | "DISABLED" | "REMOVED" | "INVALID"

export type TelegramDestinationStatus = "ACTIVE" | "DISABLED" | "REMOVED"
export type TelegramScheduleStatus = "ACTIVE" | "DISABLED" | "REMOVED"

export type TelegramChatType =
  "PRIVATE" | "GROUP" | "SUPERGROUP" | "CHANNEL" | "UNKNOWN"

export interface TelegramBotConnectionResponse {
  id: number
  botId?: number
  botUsername?: string
  botFirstName?: string
  displayLabel?: string
  status: TelegramConnectionStatus
  webhookUrl?: string
  failureReason?: string
  verifiedAt?: string
  lastValidatedAt?: string
  lastWebhookRegisteredAt?: string
  createdDate?: string
  lastModifiedDate?: string
}

export interface TelegramDestinationResponse {
  id: number
  botConnectionId: number
  botUsername?: string
  botDisplayLabel?: string
  chatId?: string
  chatType: TelegramChatType
  displayLabel?: string
  chatTitle?: string
  username?: string
  status: TelegramDestinationStatus
  createdDate?: string
  lastModifiedDate?: string
}

export interface ScheduledAssetResponse {
  assetId: number
  assetSymbol?: string
  assetName?: string
}

export interface TelegramMarketAnalysisScheduleResponse {
  id: number
  name: string
  workspaceId: number
  workspaceName: string
  destination: TelegramDestinationResponse | null
  timezone: string
  localTimes: string[]
  asset: ScheduledAssetResponse
  outputLanguage: LanguageResponse | null
  status: TelegramScheduleStatus
  createdDate?: string
  lastModifiedDate?: string
}

export interface TelegramFeatureSettingResponse {
  id: number
  featureKey: TelegramFeatureKey
  workspaceId: number
  workspaceName?: string
  enabled: boolean
  destination?: TelegramDestinationResponse
  outputLanguage?: LanguageResponse
  createdDate?: string
  lastModifiedDate?: string
}

export interface TelegramLinkTokenResponse {
  botConnectionId: number
  token?: string
  startCommand: string
  expiresAt?: string
}

export function getCreateTelegramBotConnectionSchema(dictionary: Dictionary) {
  return z.object({
    botToken: z.string().trim().min(1, dictionary.telegram.botTokenRequired),
  })
}

export function getCreateTelegramLinkTokenSchema() {
  return z.object({
    botConnectionId: z.coerce.number().int().positive(),
  })
}

export function getUpdateTelegramFeatureSettingSchema() {
  return z.object({
    featureKey: z.enum(TELEGRAM_FEATURE_KEYS),
    workspaceId: z.coerce.number().int().positive(),
    destinationId: z.coerce.number().int().positive(),
    enabled: z.boolean().optional(),
    outputLanguageIsoCode: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() ? value.trim() : undefined,
      z.string().optional()
    ),
  })
}

export function getSaveTelegramMarketAnalysisScheduleSchema(
  dictionary: Dictionary,
  supportedLanguageIsoCodes?: string[]
) {
  const supportedLanguageCodes = supportedLanguageIsoCodes
    ? new Set(supportedLanguageIsoCodes)
    : null

  const localTimeSchema = z
    .string()
    .trim()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, dictionary.telegram.localTimeInvalid)

  const outputLanguageSchema = z
    .string()
    .trim()
    .min(1, dictionary.telegram.outputLanguageRequired)
    .refine(
      (value) =>
        supportedLanguageCodes === null || supportedLanguageCodes.has(value),
      dictionary.telegram.outputLanguageUnsupported
    )

  return z
    .object({
      name: z.string().trim().min(1, dictionary.telegram.scheduleNameRequired),
      workspaceId: z.coerce.number().int().positive(),
      destinationId: z.coerce.number().int().positive(),
      assetId: z.coerce.number().int().positive(),
      timezone: z
        .string()
        .trim()
        .min(1, dictionary.telegram.timezoneRequired)
        .refine(isValidIanaTimezone, dictionary.telegram.timezoneInvalid),
      localTimes: z
        .array(localTimeSchema)
        .min(1, dictionary.telegram.localTimeRequired)
        .max(4, dictionary.telegram.localTimeLimit)
        .superRefine((values, context) => {
          const seen = new Set<string>()

          values.forEach((value, index) => {
            if (seen.has(value)) {
              context.addIssue({
                code: "custom",
                message: dictionary.telegram.localTimeDuplicate,
                path: [index],
              })
            }

            seen.add(value)
          })
        }),
      outputLanguageIsoCode: z.preprocess(
        (value) =>
          typeof value === "string" && value.trim() ? value.trim() : undefined,
        outputLanguageSchema.optional()
      ),
    })
    .strict()
}

export function normalizeSaveTelegramMarketAnalysisScheduleRequest(
  request: SaveTelegramMarketAnalysisScheduleRequest
): SaveTelegramMarketAnalysisScheduleRequest {
  return {
    ...request,
    name: request.name.trim(),
    timezone: request.timezone.trim(),
    localTimes: [...request.localTimes].map((time) => time.trim()).sort(),
    outputLanguageIsoCode: request.outputLanguageIsoCode?.trim() || undefined,
  }
}

function isValidIanaTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export type CreateTelegramBotConnectionRequest = z.infer<
  ReturnType<typeof getCreateTelegramBotConnectionSchema>
>
export type CreateTelegramLinkTokenRequest = z.infer<
  ReturnType<typeof getCreateTelegramLinkTokenSchema>
>
export type UpdateTelegramFeatureSettingRequest = z.infer<
  ReturnType<typeof getUpdateTelegramFeatureSettingSchema>
>
export type SaveTelegramMarketAnalysisScheduleRequest = z.infer<
  ReturnType<typeof getSaveTelegramMarketAnalysisScheduleSchema>
>

export interface TelegramSectionAccess {
  botConnections: boolean
  destinations: boolean
  featureSettings: boolean
  schedules: boolean
  watchlistAssets: boolean
}

export interface TelegramManageAccess {
  botConnections: boolean
  destinations: boolean
  featureSettings: boolean
}

export interface TelegramScheduleActionAccess {
  create: boolean
  update: boolean
  delete: boolean
}

export interface TelegramConfigurationData {
  botConnections: TelegramBotConnectionResponse[]
  destinations: TelegramDestinationResponse[]
  featureSettings: TelegramFeatureSettingResponse[]
  schedules: TelegramMarketAnalysisScheduleResponse[]
  currentWorkspace: WorkspaceResponse | null
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  languages: LanguageResponse[]
  languageCatalogError: boolean
  scheduleLoadError: boolean
  sectionAccess: TelegramSectionAccess
  manageAccess: TelegramManageAccess
  scheduleActions: TelegramScheduleActionAccess
}
