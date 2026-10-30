import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  fetchAuthenticated,
  getAiProviderConfigsRaw,
  getCurrentPermissions,
  testDictionary,
} = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getAiProviderConfigsRaw: vi.fn(),
  getCurrentPermissions: vi.fn(),
  testDictionary: {
    aiTaskConfigurations: {
      readDenied: "Task read denied",
      loadError: "Could not load task settings",
      invalidResponse: "Invalid task settings response",
      connectionReadDenied: "Connection read denied",
      connectionLoadError: "Could not load connections",
      modelCatalogDenied: "Model catalog read denied",
      modelCatalogError: "Could not load models",
      invalidModelCatalog: "Invalid model catalog",
      invalidConnection: "Invalid connection",
      updateDenied: "Task update denied",
      invalidTask: "Invalid task",
      selectionValidationError: "Invalid selection",
      tokenValidationError: "Invalid token limit",
      selectionSaveError: "Could not save selection",
      tokenSaveError: "Could not save token limit",
    },
    systemPrompts: {
      readDenied: "Prompt read denied",
      unsupportedPrompt: "Unsupported prompt",
      viewError: "Could not read prompt",
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({ fetchAuthenticated }))
vi.mock("@/app/api/ai-provider-configs/action", () => ({
  getAiProviderConfigsRaw,
}))
vi.mock("@/app/lib/permissions-server", () => ({ getCurrentPermissions }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "en"),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  getAiTaskConfigurationConnections,
  getAiTaskConfigurations,
  getAiTaskModelCatalog,
  updateAiTaskOutputTokens,
  updateAiTaskSelection,
} from "@/app/api/ai-task-configurations/action"
import { getSystemPromptContentByType } from "@/app/api/system-prompts/action"
import { AI_TASK_TYPES } from "@/app/lib/ai-task-configurations/definitions"
import { revalidatePath } from "next/cache"

const config = {
  task: "NEWS_CONTENT_NORMALIZATION",
  feature: "NEWS_PROCESSING",
  purpose: "Normalize the incoming article content.",
  defaultOutputTokens: 16384,
  promptTypes: ["NEWS_ARTICLE_CONTENT_LOCALIZATION"],
  configured: true,
  selectedConnectionId: 14,
  selectedProviderType: "DEEPSEEK",
  selectedModel: "deepseek-v4-flash",
  customOutputTokens: null,
  effectiveOutputTokens: 16384,
}

const configurations = AI_TASK_TYPES.map((task, index) => ({
  ...config,
  task,
  defaultOutputTokens: index > 7 ? null : 8192,
  promptTypes: [],
  configured: false,
  selectedConnectionId: null,
  selectedProviderType: null,
  selectedModel: null,
  effectiveOutputTokens: index > 7 ? null : 8192,
}))

describe("AI task configuration actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(getAiProviderConfigsRaw).mockReset()
    vi.mocked(getCurrentPermissions).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("validates and reads the producer's fixed eleven-task catalog", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:read",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue(configurations)

    await expect(getAiTaskConfigurations()).resolves.toEqual(configurations)
    expect(fetchAuthenticated).toHaveBeenCalledWith("/ai-task-configurations")
  })

  it("fails closed when the actor cannot read the task catalog", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([])

    await expect(getAiTaskConfigurations()).rejects.toThrow("Task read denied")
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("rejects incomplete producer catalogs instead of displaying partial settings", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:read",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue(configurations.slice(1))

    await expect(getAiTaskConfigurations()).rejects.toThrow(
      "Could not load task settings"
    )
  })

  it("sends a task selection to the producer and confirms the matching row", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue(config)

    await expect(
      updateAiTaskSelection(config.task, {
        connectionId: 14,
        model: "deepseek-v4-flash",
      })
    ).resolves.toEqual({ success: true, data: config })

    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/ai-task-configurations/NEWS_CONTENT_NORMALIZATION/selection",
      {
        method: "PUT",
        body: JSON.stringify({
          connectionId: 14,
          model: "deepseek-v4-flash",
        }),
      }
    )
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[lang]/ai-task-configurations",
      "page"
    )
  })

  it("checks task update and model catalog permissions independently", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:read",
    ])
    await expect(
      updateAiTaskSelection(config.task, {
        connectionId: 14,
        model: "deepseek-v4-flash",
      })
    ).resolves.toEqual({ success: false, error: "Task update denied" })

    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    await expect(getAiTaskModelCatalog(14)).resolves.toEqual({
      success: false,
      error: "Model catalog read denied",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("does not report success when the producer responds with another task", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...config,
      task: "NEWS_EVENT_EXTRACTION",
    })

    await expect(
      updateAiTaskSelection(config.task, {
        connectionId: 14,
        model: "deepseek-v4-flash",
      })
    ).resolves.toEqual({
      success: false,
      error: "Invalid task settings response",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("does not report success when the producer does not persist the requested selection", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...config,
      selectedConnectionId: 15,
      selectedModel: "different-model",
    })

    await expect(
      updateAiTaskSelection(config.task, {
        connectionId: 14,
        model: "deepseek-v4-flash",
      })
    ).resolves.toEqual({
      success: false,
      error: "Invalid task settings response",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("supports clearing a custom token limit back to the task default", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue(config)

    await expect(
      updateAiTaskOutputTokens(config.task, { maxOutputTokens: null })
    ).resolves.toEqual({ success: true, data: config })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/ai-task-configurations/NEWS_CONTENT_NORMALIZATION/output-token",
      {
        method: "PUT",
        body: JSON.stringify({ maxOutputTokens: null }),
      }
    )
  })

  it("does not report success when the producer does not persist the requested token limit", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    vi.mocked(fetchAuthenticated).mockResolvedValue(config)

    await expect(
      updateAiTaskOutputTokens(config.task, { maxOutputTokens: 9000 })
    ).resolves.toEqual({
      success: false,
      error: "Invalid task settings response",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects invalid token limits and updates without permission before HTTP", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-task-configuration:update",
    ])
    await expect(
      updateAiTaskOutputTokens(config.task, { maxOutputTokens: 0 })
    ).resolves.toEqual({ success: false, error: "Invalid token limit" })

    vi.mocked(getCurrentPermissions).mockResolvedValue([])
    await expect(
      updateAiTaskOutputTokens(config.task, { maxOutputTokens: 8192 })
    ).resolves.toEqual({ success: false, error: "Task update denied" })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("loads models through the stored connection endpoint with catalog permission", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-provider-config:model-catalog",
    ])
    const catalog = {
      providerType: "DEEPSEEK",
      models: [{ id: "deepseek-v4-flash", label: "deepseek-v4-flash" }],
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(catalog)

    await expect(getAiTaskModelCatalog(14)).resolves.toEqual({
      success: true,
      data: catalog,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/ai-provider-configs/14/model-catalog"
    )
  })

  it("returns safe connection options only for catalog-supported providers", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([
      "ai-provider-config:read",
    ])
    vi.mocked(getAiProviderConfigsRaw).mockResolvedValue({
      content: [
        {
          id: 14,
          providerType: "DEEPSEEK",
          description: "Main connection",
          baseUrl: "https://provider.invalid",
          credentials: [{ apiKey: "must-not-leave-server", model: "private" }],
        },
        { id: 15, providerType: "GEMINI" },
        { id: 16, providerType: "OPENAI" },
        { id: 17, providerType: "GROQ" },
        { id: 18, providerType: "ZAI" },
      ],
    })

    await expect(getAiTaskConfigurationConnections()).resolves.toEqual({
      success: true,
      data: [
        { id: 14, providerType: "DEEPSEEK" },
        { id: 15, providerType: "GEMINI" },
        { id: 16, providerType: "OPENAI" },
      ],
    })
    expect(getAiProviderConfigsRaw).toHaveBeenCalledWith({
      page: 0,
      size: 2000,
      filter: "",
      sort: [],
    })
  })

  it("loads prompt content only for actors with prompt read permission", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:read"])
    const prompt = {
      promptType: "NEWS_ARTICLE_CONTENT_LOCALIZATION",
      name: "News article localization",
      content: "Translate the article.",
      requiredVariables: [],
      lastModifiedDate: "2026-10-18T13:21:00.000Z",
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(prompt)

    await expect(
      getSystemPromptContentByType(prompt.promptType)
    ).resolves.toEqual(prompt)
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/system-prompts/NEWS_ARTICLE_CONTENT_LOCALIZATION"
    )

    vi.mocked(getCurrentPermissions).mockResolvedValue([])
    await expect(
      getSystemPromptContentByType(prompt.promptType)
    ).rejects.toThrow("Prompt read denied")
  })

  it("rejects prompt content that violates the published response contract", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:read"])
    const promptType = "NEWS_ARTICLE_CONTENT_LOCALIZATION"
    const invalidResponses = [
      {
        promptType,
        content: "Translate the article.",
        requiredVariables: [],
      },
      {
        promptType,
        name: "News article localization",
        content: "Translate the article.",
      },
      {
        promptType,
        name: "News article localization",
        content: "x".repeat(10_001),
        requiredVariables: [],
      },
    ]

    for (const response of invalidResponses) {
      vi.mocked(fetchAuthenticated).mockResolvedValue(response)
      await expect(getSystemPromptContentByType(promptType)).rejects.toThrow(
        "Could not read prompt"
      )
    }
  })
})
