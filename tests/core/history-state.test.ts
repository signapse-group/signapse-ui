import { describe, expect, it } from "vitest"

import type {
  IdentifiedMarketConversationSummaryResponse,
  MarketChatMessageResponse,
} from "@/app/lib/market-query/definitions"
import {
  buildConversationHistorySearchParams,
  getConversationHistoryFilterFields,
  getMessagePreviewText,
  getRenderableConversationMessages,
  getResponseRevealCount,
  getResponseRevealDuration,
  getTrackingRailState,
  mergeConversationHistory,
  shouldLoadConversationHistory,
  shouldRenderAssistantMarkdown,
  splitResponseIntoGraphemes,
} from "@/components/market-conversation-assistant/history-state"
import { FIXED_ISO_DATE } from "@/tests/support/fixtures"

const conversation = (
  id: number,
  title: string
): IdentifiedMarketConversationSummaryResponse => ({
  id,
  title,
  workspaceId: 1,
  createdDate: FIXED_ISO_DATE,
  lastModifiedDate: FIXED_ISO_DATE,
})

const message = (
  id: number,
  role: "USER" | "ASSISTANT",
  content: string | null,
  status: "COMPLETED" | "FAILED" = "COMPLETED",
  failureReason: string | null = null
): MarketChatMessageResponse => ({
  id,
  role,
  status,
  content,
  failureReason,
  createdDate: FIXED_ISO_DATE,
})

describe("conversation history behavior", () => {
  it("normalizes filters, paging, and page merges", () => {
    expect(getConversationHistoryFilterFields("   ")).toEqual({
      "title[containsIgnoreCase]": "",
    })
    expect(getConversationHistoryFilterFields("  inflation  ")).toEqual({
      "title[containsIgnoreCase]": "inflation",
    })

    expect(buildConversationHistorySearchParams("", 0)).toEqual({
      filter: "",
      page: 0,
      size: 10,
      sort: [{ field: "lastModifiedDate", direction: "desc" }],
    })

    expect(
      mergeConversationHistory(
        [conversation(1, "Old")],
        [conversation(2, "New")],
        0
      ).map(({ id }) => id)
    ).toEqual([2])

    const merged = mergeConversationHistory(
      [conversation(1, "First"), conversation(2, "Stale")],
      [conversation(2, "Updated"), conversation(3, "Third")],
      1
    )
    expect(merged.map(({ id }) => id)).toEqual([1, 2, 3])
    expect(merged[1]?.title).toBe("Updated")
  })

  it("renders only meaningful messages and reveals assistant responses deterministically", () => {
    const failed = message(3, "ASSISTANT", null, "FAILED", "Analysis failed")
    const messages = [
      message(1, "USER", "Question"),
      message(2, "ASSISTANT", "Answer"),
      failed,
      message(4, "ASSISTANT", null),
    ]

    expect(
      getRenderableConversationMessages(messages).map(({ id }) => id)
    ).toEqual([1, 2, 3])
    expect(getMessagePreviewText(failed, "Fallback")).toBe("Analysis failed")
    expect(
      getMessagePreviewText(message(5, "ASSISTANT", null, "FAILED"), "Fallback")
    ).toBe("Fallback")
    expect(shouldRenderAssistantMarkdown(messages[0], false)).toBe(false)
    expect(shouldRenderAssistantMarkdown(messages[1], true)).toBe(false)
    expect(shouldRenderAssistantMarkdown(messages[1], false)).toBe(true)
    expect(shouldRenderAssistantMarkdown(failed, false)).toBe(false)

    expect(splitResponseIntoGraphemes("A\u0301 👨‍👩‍👧‍👦")).toEqual([
      "A\u0301",
      " ",
      "👨‍👩‍👧‍👦",
    ])
    expect(getResponseRevealDuration(0)).toBe(0)
    expect(getResponseRevealDuration(10)).toBe(600)
    expect(getResponseRevealDuration(100)).toBe(1_200)
    expect(getResponseRevealDuration(1_000)).toBe(4_000)
    expect(getResponseRevealCount(0, 100)).toBe(1)
    expect(getResponseRevealCount(600, 100)).toBe(50)
    expect(getResponseRevealCount(1_200, 100)).toBe(100)
  })

  it("decides when history loads and exposes tracking rail states", () => {
    expect(
      Array.from(
        { length: 9 },
        (_, index) =>
          getTrackingRailState({
            index,
            hoveredIndex: 4,
            isActive: false,
            isVisible: false,
          }).width
      )
    ).toEqual([6, 10, 14, 20, 26, 20, 14, 10, 6])

    expect(
      shouldLoadConversationHistory({
        query: "",
        loadedQuery: null,
        isLoading: false,
        hasError: false,
      })
    ).toBe(true)
    expect(
      shouldLoadConversationHistory({
        query: "  Gold ",
        loadedQuery: "Gold",
        isLoading: false,
        hasError: false,
      })
    ).toBe(false)
    expect(
      shouldLoadConversationHistory({
        query: "",
        loadedQuery: "",
        isLoading: false,
        hasError: false,
      })
    ).toBe(false)
    expect(
      shouldLoadConversationHistory({
        query: "Gold",
        loadedQuery: null,
        isLoading: true,
        hasError: false,
      })
    ).toBe(false)
    expect(
      shouldLoadConversationHistory({
        query: "Gold",
        loadedQuery: null,
        isLoading: false,
        hasError: true,
      })
    ).toBe(false)
    expect(
      shouldLoadConversationHistory({
        query: "Oil",
        loadedQuery: "Gold",
        isLoading: false,
        hasError: false,
      })
    ).toBe(true)
  })
})
