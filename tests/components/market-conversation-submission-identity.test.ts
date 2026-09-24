import { describe, expect, it } from "vitest"

import {
  getMarketConversationSubmissionIdentity,
  type MarketConversationSubmissionIdentity,
} from "@/components/market-conversation-assistant/submission-identity"

describe("market conversation submission identity", () => {
  it("reuses the identity when retrying the same message", () => {
    const existing: MarketConversationSubmissionIdentity = {
      message: "  What moved gold today?  ",
      idempotencyKey: "retry-key",
    }

    expect(
      getMarketConversationSubmissionIdentity(
        existing,
        existing.message,
        () => "new-key"
      )
    ).toBe(existing)
  })

  it("creates a new identity for a new message", () => {
    expect(
      getMarketConversationSubmissionIdentity(
        {
          message: "First question",
          idempotencyKey: "first-key",
        },
        "Second question",
        () => "second-key"
      )
    ).toEqual({
      message: "Second question",
      idempotencyKey: "second-key",
    })
  })
})
