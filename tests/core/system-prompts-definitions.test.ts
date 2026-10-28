import { describe, expect, it } from "vitest"

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import {
  SYSTEM_PROMPT_MAX_CONTENT_LENGTH,
  getSystemPromptWorkflowGroup,
  systemPromptContentResponseSchema,
  updateSystemPromptContentRequestSchema,
} from "@/app/lib/system-prompts/definitions"

describe("system prompt contracts", () => {
  it("accepts content-only edits at the producer limit without trimming", () => {
    const content = ` ${"x".repeat(SYSTEM_PROMPT_MAX_CONTENT_LENGTH - 2)} `
    expect(updateSystemPromptContentRequestSchema.parse({ content })).toEqual({
      content,
    })
  })

  it.each([
    { content: "  \n\t" },
    { content: "x".repeat(SYSTEM_PROMPT_MAX_CONTENT_LENGTH + 1) },
    { content: "valid content", responseSchema: {} },
  ])("rejects invalid or non-content-only update data", (request) => {
    expect(
      updateSystemPromptContentRequestSchema.safeParse(request).success
    ).toBe(false)
  })

  it("requires seed-derived variable metadata, including an empty list", () => {
    const prompt = {
      promptType: "MARKET_QUESTION_UNDERSTANDING",
      name: "AI assistant · Question understanding",
      content: "Use {locale} and {rawQuestion}.",
      requiredVariables: ["locale", "rawQuestion"],
      lastModifiedDate: "2026-10-18T13:21:00.000Z",
    }

    expect(systemPromptContentResponseSchema.parse(prompt)).toEqual(prompt)
    expect(
      systemPromptContentResponseSchema.safeParse({
        ...prompt,
        requiredVariables: undefined,
      }).success
    ).toBe(false)
    expect(
      systemPromptContentResponseSchema.safeParse({
        ...prompt,
        lastModifiedDate: undefined,
      }).success
    ).toBe(false)
    expect(
      systemPromptContentResponseSchema.parse({
        ...prompt,
        requiredVariables: [],
      }).requiredVariables
    ).toEqual([])
    expect(
      systemPromptContentResponseSchema.parse({
        ...prompt,
        lastModifiedDate: null,
      }).lastModifiedDate
    ).toBeNull()
    expect(
      systemPromptContentResponseSchema.safeParse({
        ...prompt,
        lastModifiedDate: "not-a-date",
      }).success
    ).toBe(false)
  })

  it.each([
    ["ECONOMIC_CALENDAR_ENTRY_TEXT_LOCALIZATION", "Lịch"],
    ["NEWS_ARTICLE_CONTENT_LOCALIZATION", "Tin tức"],
    ["NEWS_PRIMARY_EVENT_DERIVATION", "Sự kiện"],
    ["EVENT_MARKET_REACTION_DERIVATION", "Phản ứng thị trường"],
    ["MARKET_REACTION_OUTCOME_SUMMARY", "Phản ứng thị trường"],
    ["EVENT_NARRATIVE_REFRESH", "Narrative"],
    ["WARM_ABSORPTION_EVENT_ASSET_DECISION", "Warm"],
    ["MARKET_QUESTION_UNDERSTANDING", "Trợ lý AI"],
    ["TELEGRAM_MARKET_ANALYSIS_EXPLANATION", "Telegram"],
  ])("groups producer purpose %s into its workflow", (promptType, workflow) => {
    expect(getSystemPromptWorkflowGroup(promptType, viDictionary)).toBe(
      workflow
    )
  })
})
