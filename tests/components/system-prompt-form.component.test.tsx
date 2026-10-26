// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerPush, routerRefresh } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
}))

vi.mock("@/app/api/system-prompts/action", () => ({
  updateSystemPrompt: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}))
vi.mock("@/components/localized-link", () => ({
  useLocalizedPath: (path: string) => path,
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

import { updateSystemPrompt } from "@/app/api/system-prompts/action"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { SystemPromptForm } from "@/app/[lang]/(main)/system-prompts/system-prompt-form"
import { toast } from "sonner"

const initialData = {
  promptType: "MARKET_QUESTION_UNDERSTANDING",
  name: "AI assistant · Question understanding",
  content: "Understand {locale}: {rawQuestion}",
  requiredVariables: [
    "locale",
    "asOfTime",
    "rawQuestion",
    "watchlistAssetCandidates",
    "deterministicAssetMatches",
    "deterministicThemeMatches",
    "previousConversationHints",
  ],
}

const localizations = [
  { locale: "vi" as const, dictionary: viDictionary },
  { locale: "en" as const, dictionary: enDictionary },
]

function renderForm(
  locale: "vi" | "en" = "vi",
  dictionary: Dictionary = viDictionary,
  prompt = initialData
) {
  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <SystemPromptForm initialData={prompt} />
    </LocalizationProvider>
  )
}

describe("system prompt content editor", () => {
  beforeEach(() => {
    routerPush.mockReset()
    routerRefresh.mockReset()
    vi.mocked(updateSystemPrompt).mockReset().mockResolvedValue({
      success: true,
      data: initialData,
    })
    vi.mocked(toast.success).mockReset()
  })

  afterEach(() => cleanup())

  it.each(localizations)(
    "shows localized lifecycle warnings in $locale",
    ({ locale, dictionary }) => {
      renderForm(locale, dictionary)

      expect(
        screen.getByText(dictionary.systemPrompts.editorWarningTitle)
      ).toBeInTheDocument()
      for (const variable of initialData.requiredVariables) {
        expect(screen.getByText(`{${variable}}`)).toBeInTheDocument()
      }
      expect(
        screen.getByRole("textbox", {
          name: new RegExp(`^${dictionary.systemPrompts.content}`),
        })
      ).toHaveValue(initialData.content)
    }
  )

  it.each(localizations)(
    "explains an empty required-variable list in $locale",
    ({ locale, dictionary }) => {
      renderForm(locale, dictionary, {
        ...initialData,
        requiredVariables: [],
      })

      expect(
        screen.getByText(dictionary.systemPrompts.noRequiredPlaceholders)
      ).toBeInTheDocument()
    }
  )

  it("blocks blank and over-limit content before the action", async () => {
    const user = userEvent.setup()
    renderForm()
    const content = screen.getByRole("textbox", {
      name: new RegExp(`^${viDictionary.systemPrompts.content}`),
    })

    await user.clear(content)
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.systemPrompts.saveHotfix,
      })
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.systemPrompts.contentRequired
    )

    fireEvent.change(content, { target: { value: "x".repeat(10_001) } })
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.systemPrompts.saveHotfix,
      })
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.systemPrompts.contentTooLong
    )
    expect(updateSystemPrompt).not.toHaveBeenCalled()
  })

  it("keeps edited content and reports missing placeholders after rejection", async () => {
    const user = userEvent.setup()
    const missingVariables = "Missing prompt variables: {locale}, {rawQuestion}"
    vi.mocked(updateSystemPrompt).mockResolvedValue({
      success: false,
      error: missingVariables,
    })
    renderForm()

    const content = screen.getByRole("textbox", {
      name: new RegExp(`^${viDictionary.systemPrompts.content}`),
    })
    fireEvent.change(content, { target: { value: "Reworded content" } })
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.systemPrompts.saveHotfix,
      })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(missingVariables)
    expect(content).toHaveValue("Reworded content")
    expect(updateSystemPrompt).toHaveBeenCalledWith(initialData.promptType, {
      content: "Reworded content",
    })
  })

  it("shows save confirmation and leaves the editor only after API success", async () => {
    const user = userEvent.setup()
    const savedData = { ...initialData, content: "Updated {locale}" }
    vi.mocked(updateSystemPrompt).mockResolvedValue({
      success: true,
      data: savedData,
    })
    renderForm()

    fireEvent.change(
      screen.getByRole("textbox", {
        name: new RegExp(`^${viDictionary.systemPrompts.content}`),
      }),
      { target: { value: savedData.content } }
    )
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.systemPrompts.saveHotfix,
      })
    )

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        viDictionary.systemPrompts.updateSuccess
      )
      expect(routerPush).toHaveBeenCalledWith("/system-prompts")
      expect(routerRefresh).not.toHaveBeenCalled()
    })
  })
})
