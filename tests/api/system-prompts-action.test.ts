import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  fetchAuthenticated,
  getCurrentPermissions,
  revalidatePath,
  testDictionary,
} = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getCurrentPermissions: vi.fn(),
  revalidatePath: vi.fn(),
  testDictionary: {
    systemPrompts: {
      readDenied: "System prompt read permission required",
      updateDenied: "System prompt update permission required",
      responseInvalid: "System prompt response is invalid",
      contentRequired: "Prompt content is required",
      contentTooLong: "Prompt content cannot exceed 10,000 characters",
      updateError: "Could not save the prompt hotfix",
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({ fetchAuthenticated }))
vi.mock("@/app/lib/permissions-server", () => ({ getCurrentPermissions }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: vi.fn(async () => testDictionary),
  getRequestLocale: vi.fn(async () => "en"),
}))
vi.mock("next/cache", () => ({ revalidatePath }))

import {
  getSystemPromptByType,
  getSystemPrompts,
  updateSystemPrompt,
} from "@/app/api/system-prompts/action"
import { SYSTEM_PROMPT_MAX_CONTENT_LENGTH } from "@/app/lib/system-prompts/definitions"

const prompt = {
  promptType: "TELEGRAM_MARKET_ANALYSIS_ASSESSMENT",
  name: "Telegram · Assessment",
  content: "Assess {locale} at {asOfTime}.",
  requiredVariables: [],
  lastModifiedDate: "2026-10-18T13:21:00.000Z",
}

describe("system prompt actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(getCurrentPermissions).mockReset()
    revalidatePath.mockReset()
  })

  it("loads the producer catalog without applying a guessed filter", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({ content: [prompt] })

    await expect(getSystemPrompts()).resolves.toEqual([prompt])
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/system-prompts?page=0&size=100"
    )
  })

  it("rejects producer catalog rows without audit timestamps", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      content: [{ ...prompt, lastModifiedDate: undefined }],
    })

    await expect(getSystemPrompts()).rejects.toThrow(
      testDictionary.systemPrompts.responseInvalid
    )
  })

  it("fails closed for list and detail reads", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([])

    await expect(getSystemPrompts()).rejects.toMatchObject({
      message: testDictionary.systemPrompts.readDenied,
      status: 403,
    })
    await expect(
      getSystemPromptByType(prompt.promptType)
    ).rejects.toMatchObject({
      message: testDictionary.systemPrompts.readDenied,
      status: 403,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("loads a detail by producer purpose", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue(prompt)

    await expect(getSystemPromptByType(prompt.promptType)).resolves.toEqual(
      prompt
    )
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      `/system-prompts/${prompt.promptType}`
    )
  })

  it.each([
    ["blank content", " \n\t"],
    [
      "content beyond the API limit",
      "x".repeat(SYSTEM_PROMPT_MAX_CONTENT_LENGTH + 1),
    ],
  ])("rejects %s before calling the API", async (_label, content) => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:update"])

    const result = await updateSystemPrompt(prompt.promptType, { content })

    expect(result).toEqual({
      success: false,
      error:
        content.length > SYSTEM_PROMPT_MAX_CONTENT_LENGTH
          ? testDictionary.systemPrompts.contentTooLong
          : testDictionary.systemPrompts.contentRequired,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("sends only content and reports success only after a valid response", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:update"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...prompt,
      content: "Reworded {locale} at {asOfTime}.",
    })

    await expect(
      updateSystemPrompt(prompt.promptType, {
        content: "Reworded {locale} at {asOfTime}.",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        ...prompt,
        content: "Reworded {locale} at {asOfTime}.",
        lastModifiedDate: "2026-10-18T13:21:00.000Z",
      },
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      `/system-prompts/${prompt.promptType}`,
      {
        method: "PUT",
        body: JSON.stringify({ content: "Reworded {locale} at {asOfTime}." }),
      }
    )
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/system-prompts")
    expect(revalidatePath).toHaveBeenNthCalledWith(
      2,
      "/system-prompts/[promptType]",
      "page"
    )
  })

  it("retains placeholder errors, handles denial, and hides unexpected errors", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["system-prompt:update"])
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(
        new Error("Missing prompt variables: {locale}, {asOfTime}"),
        { status: 400 }
      )
    )

    await expect(
      updateSystemPrompt(prompt.promptType, { content: "Missing variables" })
    ).resolves.toEqual({
      success: false,
      error: "Missing prompt variables: {locale}, {asOfTime}",
    })
    expect(revalidatePath).not.toHaveBeenCalled()

    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Forbidden"), { status: 403 })
    )
    await expect(
      updateSystemPrompt(prompt.promptType, { content: prompt.content })
    ).resolves.toEqual({
      success: false,
      error: testDictionary.systemPrompts.updateDenied,
    })

    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Internal database detail"), { status: 500 })
    )
    await expect(
      updateSystemPrompt(prompt.promptType, { content: prompt.content })
    ).resolves.toEqual({
      success: false,
      error: testDictionary.systemPrompts.updateError,
    })
  })
})
