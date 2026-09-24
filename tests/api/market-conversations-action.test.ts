import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    marketConversations: {
      messageRequired: "Message is required",
      validationInvalid: "Conversation request is invalid",
      responseInvalid: "Conversation response is invalid",
      idempotencyKeyInvalid: "Conversation submission identity is invalid",
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
import { submitMarketConversationMessage } from "@/app/api/market-conversations/action"

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

describe("market conversation submit action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("sends the idempotency key as a header while preserving the request body", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(
      submitMarketConversationMessage(
        42,
        { message: "What moved gold today?" },
        "retry-key"
      )
    ).resolves.toEqual({ success: true, data: response })

    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/market-conversations/42/messages",
      {
        method: "POST",
        body: JSON.stringify({ message: "What moved gold today?" }),
        headers: { "Idempotency-Key": "retry-key" },
      }
    )
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
