import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    marketConversations: {
      messageRequired: "Message is required",
      titleRequired: "Conversation title is required",
      validationInvalid: "Conversation request is invalid",
      responseInvalid: "Conversation response is invalid",
      idempotencyKeyInvalid: "Conversation submission identity is invalid",
      createError: "Conversation creation failed",
      submitError: "Message submission failed",
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "vi"),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import {
  createMarketConversation,
  submitMarketConversationMessage,
} from "@/app/api/market-conversations/action"
import {
  marketConversationSummaryResponseSchema,
  marketConversationTurnAcceptedResponseSchema,
  submitMarketConversationMessageResponseSchema,
} from "@/app/lib/market-query/definitions"

const response = {
  userMessage: {
    id: 1,
    role: "USER" as const,
    status: "COMPLETED" as const,
    content: "What moved gold today?",
    failureReason: null,
    createdDate: "2026-09-24T00:00:00Z",
  },
  assistantMessage: {
    id: 2,
    role: "ASSISTANT" as const,
    status: "COMPLETED" as const,
    content: "Gold moved higher.",
    failureReason: null,
    createdDate: "2026-09-24T00:00:01Z",
  },
}

const acceptedResponse = {
  submissionId: 108,
  userMessage: response.userMessage,
  expiresAt: "2026-09-24T00:03:00Z",
  eventsUrl: "/market-conversations/42/turns/108/events",
}

describe("market conversation async submit action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("sends the idempotency key as a header while preserving the request body", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(acceptedResponse)

    await expect(
      submitMarketConversationMessage(
        42,
        { message: "What moved gold today?" },
        "retry-key"
      )
    ).resolves.toEqual({ success: true, data: acceptedResponse })

    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/market-conversations/42/messages/async",
      {
        method: "POST",
        body: JSON.stringify({ message: "What moved gold today?" }),
        headers: { "Idempotency-Key": "retry-key" },
      }
    )
  })

  it("preserves the optional API analysis instant", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(acceptedResponse)

    await submitMarketConversationMessage(
      42,
      {
        message: "What moved gold today?",
        asOfTime: "2026-11-27T12:00:00+02:00",
      },
      "retry-key"
    )

    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/market-conversations/42/messages/async",
      expect.objectContaining({
        body: JSON.stringify({
          message: "What moved gold today?",
          asOfTime: "2026-11-27T12:00:00+02:00",
        }),
      })
    )
  })

  it("accepts omitted conversation summary fields not required by OpenAPI", () => {
    expect(
      marketConversationSummaryResponseSchema.safeParse({ id: 42 })
    ).toEqual({ success: true, data: { id: 42 } })
  })

  it("creates a conversation when optional summary fields are omitted", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({ id: 42 })

    await expect(
      createMarketConversation({ title: "What moved gold today?" })
    ).resolves.toEqual({ success: true, data: { id: 42 } })
  })

  it("surfaces a create response without an ID because the first message cannot be submitted", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      title: "What moved gold today?",
      workspaceId: 7,
    })

    await expect(
      createMarketConversation({ title: "What moved gold today?" })
    ).resolves.toEqual({
      success: false,
      error: "Conversation response is invalid",
    })
  })

  it("accepts omitted message timestamps not required by OpenAPI", async () => {
    const responseWithoutTimestamps = {
      userMessage: {
        id: 1,
        role: "USER" as const,
        status: "COMPLETED" as const,
        content: "What moved gold today?",
        failureReason: null,
      },
      assistantMessage: {
        id: 2,
        role: "ASSISTANT" as const,
        status: "COMPLETED" as const,
        content: "Gold moved higher.",
        failureReason: null,
      },
    }
    expect(
      submitMarketConversationMessageResponseSchema.safeParse(
        responseWithoutTimestamps
      )
    ).toEqual({ success: true, data: responseWithoutTimestamps })
  })

  it.each([null, ""])(
    "rejects a COMPLETED assistant response with %s content",
    (content) => {
      expect(
        submitMarketConversationMessageResponseSchema.safeParse({
          ...response,
          assistantMessage: {
            ...response.assistantMessage,
            content,
          },
        })
      ).toMatchObject({ success: false })
    }
  )

  it("rejects a FAILED assistant response that also contains content", async () => {
    expect(
      submitMarketConversationMessageResponseSchema.safeParse({
        ...response,
        assistantMessage: {
          ...response.assistantMessage,
          status: "FAILED",
          content: "This must not appear as a completed answer.",
          failureReason: "Fixture assistant failure",
        },
      })
    ).toMatchObject({ success: false })
  })

  it("rejects a FAILED assistant response without a failure reason", async () => {
    expect(
      submitMarketConversationMessageResponseSchema.safeParse({
        ...response,
        assistantMessage: {
          ...response.assistantMessage,
          status: "FAILED",
          content: null,
          failureReason: null,
        },
      })
    ).toMatchObject({ success: false })
  })

  it("requires the persisted user message and stream receipt", async () => {
    expect(
      marketConversationTurnAcceptedResponseSchema.safeParse({
        ...acceptedResponse,
        eventsUrl: undefined,
      })
    ).toMatchObject({ success: false })
  })

  it("returns a backend quota error without creating a response", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      new Error("Monthly AI conversation quota exceeded.")
    )

    await expect(
      submitMarketConversationMessage(42, { message: "Try again" }, "quota-key")
    ).resolves.toEqual({
      success: false,
      error: "Monthly AI conversation quota exceeded.",
    })
  })

  it("rejects an invalid idempotency key before making the backend request", async () => {
    await expect(
      submitMarketConversationMessage(42, { message: "Try again" }, " ")
    ).resolves.toEqual({
      success: false,
      error: "Conversation submission identity is invalid",
    })

    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("rejects an idempotency key longer than the backend contract allows", async () => {
    await expect(
      submitMarketConversationMessage(
        42,
        { message: "Try again" },
        "k".repeat(256)
      )
    ).resolves.toEqual({
      success: false,
      error: "Conversation submission identity is invalid",
    })

    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })
})
