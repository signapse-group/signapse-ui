import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    telegram: {
      validationInvalid: "Telegram validation failed",
      botTokenRequired: "Enter the bot token.",
      bot: {
        createError: "Could not connect the Telegram bot.",
        deleteError: "Could not remove the Telegram bot.",
        deleteBlockedByDestinations:
          "Remove all linked destinations before removing this bot.",
      },
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
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
  fetchAuthenticatedWithStatus: vi.fn(),
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
import { fetchAuthenticatedWithStatus } from "@/app/api/auth/action"
import { getLanguages } from "@/app/api/languages/action"
import {
  createTelegramBotConnection,
  createTelegramLinkToken,
  createTelegramMarketAnalysisSchedule,
  deleteTelegramBotConnection,
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
  getTelegramBotConnections,
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

const botConnectionResponse = {
  id: 12,
  botId: 1012,
  botUsername: "new_fixture_bot",
  displayLabel: "New fixture bot",
  status: "ACTIVE" as const,
}

function backendError(message: string, status: number) {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

describe("Telegram bot connection removal action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("deletes the selected connection and revalidates the Telegram page", async () => {
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
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("backend metadata"), {
        status: 409,
        code: "TELEGRAM_BOT_CONNECTION_HAS_UNREMOVED_DESTINATIONS",
      })
    )

    await expect(deleteTelegramBotConnection(23)).resolves.toEqual({
      success: false,
      error: testDictionary.telegram.bot.deleteBlockedByDestinations,
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("keeps webhook and request failures retryable without revalidation", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      backendError("Webhook cleanup failed", 502)
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

describe("Telegram bot connection creation", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticatedWithStatus).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("uses the create endpoint and distinguishes new connections from caller duplicates", async () => {
    vi.mocked(fetchAuthenticatedWithStatus).mockResolvedValueOnce({
      data: {
        ...botConnectionResponse,
        botToken: "must-not-reach-the-client",
        ownerId: 987,
        ownerEmail: "other-owner@example.test",
      },
      status: 201,
    })

    await expect(
      createTelegramBotConnection({ botToken: "  fake-token  " })
    ).resolves.toEqual({
      success: true,
      data: { connection: botConnectionResponse, created: true },
    })
    expect(fetchAuthenticatedWithStatus).toHaveBeenCalledWith(
      "/telegram/bot-connections",
      {
        method: "POST",
        body: JSON.stringify({ botToken: "fake-token" }),
      }
    )
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")

    vi.mocked(fetchAuthenticatedWithStatus).mockReset()
    vi.mocked(revalidatePath).mockClear()
    vi.mocked(fetchAuthenticatedWithStatus).mockResolvedValueOnce({
      data: {
        ...botConnectionResponse,
        status: "INVALID",
        botToken: "must-not-reach-the-client",
        ownerId: 987,
      },
      status: 200,
    })

    await expect(
      createTelegramBotConnection({ botToken: "fake-token" })
    ).resolves.toEqual({
      success: true,
      data: {
        connection: { ...botConnectionResponse, status: "INVALID" },
        created: false,
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it("keeps an unexpected saved status unverified without reporting create failure", async () => {
    vi.mocked(fetchAuthenticatedWithStatus).mockResolvedValueOnce({
      data: {
        ...botConnectionResponse,
        status: "UNKNOWN",
        botToken: "must-not-reach-the-client",
      },
      status: 201,
    })

    await expect(
      createTelegramBotConnection({ botToken: "fake-token" })
    ).resolves.toEqual({
      success: true,
      data: {
        connection: { ...botConnectionResponse, status: undefined },
        created: true,
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it("keeps a successful create when the response omits saved fields", async () => {
    vi.mocked(fetchAuthenticatedWithStatus).mockResolvedValueOnce({
      data: {
        displayLabel: "Partially verified bot",
        botToken: "must-not-reach-the-client",
        ownerId: 987,
      },
      status: 201,
    })

    await expect(
      createTelegramBotConnection({ botToken: "fake-token" })
    ).resolves.toEqual({
      success: true,
      data: {
        connection: { displayLabel: "Partially verified bot" },
        created: true,
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it("keeps a successful response without a body as an unverified outcome", async () => {
    vi.mocked(fetchAuthenticatedWithStatus).mockResolvedValueOnce({
      data: null,
      status: 204,
    })

    await expect(
      createTelegramBotConnection({ botToken: "fake-token" })
    ).resolves.toEqual({
      success: true,
      data: { connection: {}, created: null },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it("returns localized backend verification, permission, and conflict errors", async () => {
    for (const [status, message] of [
      [400, "Token verification failed."],
      [403, "You cannot create Telegram bot connections."],
      [409, "This Telegram bot is already connected."],
    ] as const) {
      vi.mocked(fetchAuthenticatedWithStatus).mockRejectedValueOnce(
        backendError(message, status)
      )

      await expect(
        createTelegramBotConnection({ botToken: "fake-token" })
      ).resolves.toEqual({ success: false, error: message })
    }

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("keeps transport failures as an unverified outcome", async () => {
    vi.mocked(fetchAuthenticatedWithStatus).mockRejectedValueOnce(
      new Error("fetch failed")
    )

    await expect(
      createTelegramBotConnection({ botToken: "fake-token" })
    ).resolves.toEqual({
      success: true,
      data: { connection: {}, created: null },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/telegram")
  })

  it.each([500, 502, 503])(
    "keeps an HTTP %i response as an unverified outcome",
    async (status) => {
      vi.mocked(fetchAuthenticatedWithStatus).mockRejectedValueOnce(
        backendError("Backend unavailable", status)
      )

      await expect(
        createTelegramBotConnection({ botToken: "fake-token" })
      ).resolves.toEqual({
        success: true,
        data: { connection: {}, created: null },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/telegram")
    }
  )

  it("does not downgrade a known API rejection to an unverified outcome", async () => {
    vi.mocked(fetchAuthenticatedWithStatus).mockRejectedValueOnce(
      backendError("Token verification failed.", 400)
    )

    await expect(
      createTelegramBotConnection({ botToken: "fake-token" })
    ).resolves.toEqual({
      success: false,
      error: "Token verification failed.",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects an empty token before calling the backend", async () => {
    await expect(
      createTelegramBotConnection({ botToken: "   " })
    ).resolves.toEqual({
      success: false,
      error: "Enter the bot token.",
    })
    expect(fetchAuthenticatedWithStatus).not.toHaveBeenCalled()
  })
})

describe("Telegram bot connection read", () => {
  it("projects the saved response to allowlisted metadata", async () => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(fetchAuthenticated).mockResolvedValueOnce([
      {
        ...botConnectionResponse,
        botToken: "must-not-reach-the-client",
        ownerId: 987,
        ownerEmail: "other-owner@example.test",
      },
    ])

    await expect(getTelegramBotConnections()).resolves.toEqual([
      botConnectionResponse,
    ])
    expect(fetchAuthenticated).toHaveBeenCalledWith("/telegram/bot-connections")
  })

  it("preserves partial readback as unverified safe metadata", async () => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(fetchAuthenticated).mockResolvedValueOnce([
      {
        id: 14,
        displayLabel: "Partially verified bot",
        botToken: "must-not-reach-the-client",
        ownerId: 987,
      },
    ])

    const connections = await getTelegramBotConnections()

    expect(connections).toEqual([
      { id: 14, displayLabel: "Partially verified bot" },
    ])
    expect(connections[0]?.status).toBeUndefined()
    expect(fetchAuthenticated).toHaveBeenCalledWith("/telegram/bot-connections")
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
