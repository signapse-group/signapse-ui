import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    telegram: {
      validationInvalid: "Telegram validation failed",
      scheduleNameRequired: "Schedule name is required",
      localTimeInvalid: "Local time is invalid",
      outputLanguageRequired: "Output language is required",
      outputLanguageUnsupported: "Output language is unsupported",
      timezoneRequired: "Timezone is required",
      timezoneInvalid: "Timezone is invalid",
      localTimeRequired: "At least one local time is required",
      localTimeLimit: "Too many local times",
      localTimeDuplicate: "Local times must be unique",
      destination: {
        invalidData: "Destination is invalid",
        createLinkError: "Could not create the Telegram link command",
        testMessageError: "Could not send a test message",
        testMessageUnknownOutcome:
          "Telegram did not confirm the test message. Check the Telegram conversation before trying again.",
      },
      schedule: {
        languageCatalogError: "Language catalog unavailable",
        createError: "Schedule create failed",
        updateError: "Schedule update failed",
        disableError: "Schedule disable failed",
        deleteError: "Schedule delete failed",
      },
      bot: {
        deleteError: "Could not remove the Telegram bot.",
        deleteBlockedByDestinations:
          "Remove all linked destinations before removing this bot.",
      },
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/api/languages/action", () => ({
  getLanguages: vi.fn(),
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "vi"),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getLanguages } from "@/app/api/languages/action"
import {
  createTelegramLinkToken,
  createTelegramMarketAnalysisSchedule,
  deleteTelegramBotConnection,
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
  getTelegramDestinations,
  sendTelegramTestMessage,
  updateTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import { revalidatePath } from "next/cache"
import type { SaveTelegramMarketAnalysisScheduleRequest } from "@/app/lib/telegram/definitions"

const scheduleRequest = (): SaveTelegramMarketAnalysisScheduleRequest => ({
  name: "  Morning analysis ",
  workspaceId: 7,
  destinationId: 8,
  assetId: 9,
  timezone: " Asia/Bangkok ",
  localTimes: ["18:00", "09:00"],
  outputLanguageIsoCode: "en",
})

const scheduleResponse = {
  id: 11,
  name: "Morning analysis",
  workspaceId: 7,
  timezone: "Asia/Bangkok",
  localTimes: ["09:00", "18:00"],
  status: "ACTIVE" as const,
}

describe("Telegram bot connection removal action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("deletes only the selected connection and revalidates the Telegram page", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(undefined)

    await expect(deleteTelegramBotConnection(23)).resolves.toEqual({
      success: true,
      data: undefined,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/bot-connections/23",
      { method: "DELETE" }
    )
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it("maps the linked-destination conflict to localized recovery guidance", async () => {
    const conflict = Object.assign(new Error("backend metadata"), {
      status: 409,
      code: "TELEGRAM_BOT_CONNECTION_HAS_UNREMOVED_DESTINATIONS",
    })
    vi.mocked(fetchAuthenticated).mockRejectedValue(conflict)

    await expect(deleteTelegramBotConnection(23)).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.bot.deleteBlockedByDestinations,
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("returns webhook and request failures as failures without revalidation", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Webhook cleanup failed"), { status: 502 })
    )

    await expect(deleteTelegramBotConnection(23)).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.bot.deleteError,
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("Telegram scheduled asset analysis actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(getLanguages).mockReset()
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(getLanguages).mockResolvedValue({
      currentLanguage: "vi",
      preferredLanguage: "vi",
      languages: [
        { id: 1, isoCode: "vi", name: "Tiếng Việt" },
        { id: 2, isoCode: "en", name: "English" },
      ],
    })
  })

  it("creates and updates schedules with normalized request bodies", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(scheduleResponse)

    const created =
      await createTelegramMarketAnalysisSchedule(scheduleRequest())
    expect(created).toEqual({ success: true, data: scheduleResponse })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/market-analysis-schedules",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Morning analysis",
          workspaceId: 7,
          destinationId: 8,
          assetId: 9,
          timezone: "Asia/Bangkok",
          localTimes: ["09:00", "18:00"],
          outputLanguageIsoCode: "en",
        }),
      }
    )
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")

    vi.mocked(fetchAuthenticated).mockClear()
    vi.mocked(revalidatePath).mockClear()
    const updated = await updateTelegramMarketAnalysisSchedule(
      11,
      scheduleRequest()
    )
    expect(updated).toEqual({ success: true, data: scheduleResponse })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/market-analysis-schedules/11",
      expect.objectContaining({ method: "PUT" })
    )
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it("preserves and explicitly clears feature output-language overrides", async () => {
    const featureResponse = {
      id: 41,
      featureKey: "ECONOMIC_CALENDAR_ALERT" as const,
      workspaceId: 7,
      enabled: true,
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(featureResponse)

    const preserved = await updateTelegramFeatureSetting({
      featureKey: "ECONOMIC_CALENDAR_ALERT",
      workspaceId: 7,
      destinationId: 8,
      enabled: true,
      outputLanguageIsoCode: " en ",
    })

    expect(preserved).toEqual({ success: true, data: featureResponse })
    expect(fetchAuthenticated).toHaveBeenLastCalledWith(
      "/telegram/feature-settings",
      {
        method: "PUT",
        body: JSON.stringify({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          workspaceId: 7,
          destinationId: 8,
          enabled: true,
          outputLanguageIsoCode: "en",
        }),
      }
    )

    await updateTelegramFeatureSetting({
      featureKey: "ECONOMIC_CALENDAR_ALERT",
      workspaceId: 7,
      destinationId: 8,
      enabled: true,
      outputLanguageIsoCode: "   ",
    })

    expect(fetchAuthenticated).toHaveBeenLastCalledWith(
      "/telegram/feature-settings",
      {
        method: "PUT",
        body: JSON.stringify({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          workspaceId: 7,
          destinationId: 8,
          enabled: true,
        }),
      }
    )
  })

  it("disables and deletes schedules through their mutation endpoints", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(scheduleResponse)

    await expect(disableTelegramMarketAnalysisSchedule(11)).resolves.toEqual({
      success: true,
      data: scheduleResponse,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/market-analysis-schedules/11/disable",
      { method: "PATCH" }
    )

    vi.mocked(fetchAuthenticated).mockResolvedValue(undefined)
    await expect(deleteTelegramMarketAnalysisSchedule(11)).resolves.toEqual({
      success: true,
      data: undefined,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/market-analysis-schedules/11",
      { method: "DELETE" }
    )
    expect(revalidatePath).toHaveBeenCalledTimes(2)
  })

  it("returns localized validation errors and recovers backend failures", async () => {
    const invalid = await createTelegramMarketAnalysisSchedule({
      ...scheduleRequest(),
      name: "",
    })
    expect(invalid).toEqual({
      success: false,
      error: testDictionary.telegram.scheduleNameRequired,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()

    vi.mocked(fetchAuthenticated).mockRejectedValue(
      new Error("Backend unavailable")
    )
    const failed = await updateTelegramMarketAnalysisSchedule(
      11,
      scheduleRequest()
    )
    expect(failed).toEqual({ success: false, error: "Backend unavailable" })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("Telegram test message action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("posts only to the selected destination and succeeds after the producer response", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(null)

    await expect(sendTelegramTestMessage(24)).resolves.toEqual({
      success: true,
      data: undefined,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/destinations/24/test-message",
      { method: "POST" }
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it.each([400, 401, 403, 404, 409, 500, 502, 503])(
    "keeps HTTP %i as a known rejection",
    async (status) => {
      vi.mocked(fetchAuthenticated).mockRejectedValue(
        Object.assign(new Error(`HTTP ${status} rejection`), { status })
      )

      await expect(sendTelegramTestMessage(24)).resolves.toEqual({
        success: false,
        error: `HTTP ${status} rejection`,
        outcome: "known-error",
      })
    }
  )

  it("maps producer 504 and the app transport AbortError to an unknown outcome", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Gateway timeout"), { status: 504 })
    )
    await expect(sendTelegramTestMessage(24)).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.destination.testMessageUnknownOutcome,
      outcome: "unknown",
    })

    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Request aborted"), { name: "AbortError" })
    )
    await expect(sendTelegramTestMessage(24)).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.destination.testMessageUnknownOutcome,
      outcome: "unknown",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects invalid IDs before making a request", async () => {
    await expect(sendTelegramTestMessage(0)).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.destination.invalidData,
      outcome: "known-error",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })
})

describe("Telegram destination link actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("creates a token for the selected bot and accepts the published response", async () => {
    const response = {
      botConnectionId: 12,
      token: "ExampleLinkToken0123456789ABCDEF",
      startCommand: "/start ExampleLinkToken0123456789ABCDEF",
      expiresAt: "2030-01-15T08:15:00.000Z",
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(
      createTelegramLinkToken({ botConnectionId: 12 })
    ).resolves.toEqual({ success: true, data: response })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/telegram/destinations/link-token",
      {
        method: "POST",
        body: JSON.stringify({ botConnectionId: 12 }),
      }
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects missing response fields and a response for a different bot", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValueOnce({
      botConnectionId: 12,
      startCommand: "/start missing-token",
      expiresAt: "2030-01-15T08:15:00.000Z",
    })

    await expect(
      createTelegramLinkToken({ botConnectionId: 12 })
    ).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.destination.invalidData,
    })

    vi.mocked(fetchAuthenticated).mockResolvedValueOnce({
      botConnectionId: 13,
      token: "ExampleLinkToken0123456789ABCDEF",
      startCommand: "/start ExampleLinkToken0123456789ABCDEF",
      expiresAt: "2030-01-15T08:15:00.000Z",
    })

    await expect(
      createTelegramLinkToken({ botConnectionId: 12 })
    ).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.destination.invalidData,
    })
  })

  it("keeps API permission failures as errors", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Permission denied"), { status: 403 })
    )

    await expect(
      createTelegramLinkToken({ botConnectionId: 12 })
    ).resolves.toEqual({ success: false, error: "Permission denied" })
  })

  it("reads back bot and destination status from the API response", async () => {
    const destinations = [
      {
        id: 31,
        botConnectionId: 12,
        chatId: "-100123",
        chatType: "CHANNEL" as const,
        displayLabel: "Read back channel",
        status: "DISABLED" as const,
      },
    ]
    vi.mocked(fetchAuthenticated).mockResolvedValue(destinations)

    await expect(getTelegramDestinations()).resolves.toEqual(destinations)
    expect(fetchAuthenticated).toHaveBeenCalledWith("/telegram/destinations")
  })
})
