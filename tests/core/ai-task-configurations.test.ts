import { describe, expect, it } from "vitest"

import {
  AI_TASK_TYPES,
  AiTaskConfigurationsResponseSchema,
  AiTaskOutputTokenRequestSchema,
  AiTaskSelectionRequestSchema,
} from "@/app/lib/ai-task-configurations/definitions"

function taskConfiguration(task: (typeof AI_TASK_TYPES)[number]) {
  return {
    task,
    feature: "FEATURE",
    purpose: `Purpose for ${task}`,
    defaultOutputTokens: 8192,
    promptTypes: [],
    configured: false,
    selectedConnectionId: null,
    selectedProviderType: null,
    selectedModel: null,
    customOutputTokens: null,
    effectiveOutputTokens: 8192,
  }
}

describe("AI task configuration DTOs", () => {
  it("requires the exact eleven distinct producer task types", () => {
    const catalog = AI_TASK_TYPES.map(taskConfiguration)
    expect(AiTaskConfigurationsResponseSchema.parse(catalog)).toEqual(catalog)
    expect(
      AiTaskConfigurationsResponseSchema.safeParse(catalog.slice(1)).success
    ).toBe(false)
    expect(
      AiTaskConfigurationsResponseSchema.safeParse([
        ...catalog.slice(1),
        catalog[0],
        catalog[0],
      ]).success
    ).toBe(false)
    expect(AI_TASK_TYPES).toHaveLength(11)
  })

  it("rejects inconsistent configured and effective-token response fields", () => {
    const configuration = taskConfiguration(AI_TASK_TYPES[0])

    expect(
      AiTaskConfigurationsResponseSchema.safeParse([
        { ...configuration, configured: true },
        ...AI_TASK_TYPES.slice(1).map(taskConfiguration),
      ]).success
    ).toBe(false)
    expect(
      AiTaskConfigurationsResponseSchema.safeParse([
        { ...configuration, effectiveOutputTokens: null },
        ...AI_TASK_TYPES.slice(1).map(taskConfiguration),
      ]).success
    ).toBe(false)
  })

  it("keeps a model ID unchanged and accepts the published selection fields", () => {
    const request = { connectionId: 42, model: "model id" }
    expect(AiTaskSelectionRequestSchema.parse(request)).toEqual(request)
    expect(
      AiTaskSelectionRequestSchema.parse({
        ...request,
        apiKey: "not-in-the-published-request",
      })
    ).toEqual(request)
  })

  it("accepts a positive int32 custom limit or null to use the default", () => {
    expect(
      AiTaskOutputTokenRequestSchema.parse({ maxOutputTokens: 8192 })
    ).toEqual({
      maxOutputTokens: 8192,
    })
    expect(
      AiTaskOutputTokenRequestSchema.parse({ maxOutputTokens: null })
    ).toEqual({
      maxOutputTokens: null,
    })
    for (const maxOutputTokens of [0, -1, 1.5, 2_147_483_648]) {
      expect(
        AiTaskOutputTokenRequestSchema.safeParse({ maxOutputTokens }).success
      ).toBe(false)
    }
  })
})
