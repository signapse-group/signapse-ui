// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const {
  createMarketConversation,
  getMarketConversationMessages,
  getMarketConversations,
  submitMarketConversationMessage,
  streamMarketConversationTurn,
} = vi.hoisted(() => ({
  createMarketConversation: vi.fn(),
  getMarketConversationMessages: vi.fn(),
  getMarketConversations: vi.fn(),
  submitMarketConversationMessage: vi.fn(),
  streamMarketConversationTurn: vi.fn(),
}))

vi.mock("@/app/api/market-conversations/action", () => ({
  createMarketConversation,
  getMarketConversationMessages,
  getMarketConversations,
  submitMarketConversationMessage,
}))

vi.mock("@/components/market-conversation-assistant/turn-stream", () => ({
  streamMarketConversationTurn,
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MarketConversationAssistant } from "@/components/market-conversation-assistant/market-conversation-assistant"

const conversation = {
  id: 42,
  title: "What moved gold today?",
  workspaceId: 7,
  createdDate: "2026-09-24T00:00:00Z",
  lastModifiedDate: "2026-09-24T00:00:00Z",
}

const acceptedTurn = {
  submissionId: 108,
  userMessage: {
    id: 501,
    role: "USER" as const,
    status: "COMPLETED" as const,
    content: "What moved gold today?",
    failureReason: null,
  },
  expiresAt: new Date(Date.now() + 180_000).toISOString(),
  eventsUrl: "/market-conversations/42/turns/108/events",
}

const successfulTurn = {
  userMessage: acceptedTurn.userMessage,
  assistantMessage: {
    id: 502,
    role: "ASSISTANT" as const,
    status: "COMPLETED" as const,
    content: "Gold moved **higher** after the report.",
    failureReason: null,
  },
}

function renderAssistant(locale: "en" | "vi" = "vi") {
  return render(
    <LocalizationProvider
      locale={locale}
      dictionary={locale === "vi" ? viDictionary : enDictionary}
    >
      <SidebarProvider defaultOpen>
        <MarketConversationAssistant displayName="Tam" workspaceId={7} />
      </SidebarProvider>
    </LocalizationProvider>
  )
}

async function openAndSubmit(message: string) {
  const user = userEvent.setup()
  await user.click(
    screen.getByRole("button", { name: viDictionary.aiAssistant.launcher })
  )
  const composer = screen.getByRole("textbox", {
    name: viDictionary.demoConversation.persistedComposerLabel,
  })
  await user.type(composer, message)
  await user.click(
    screen.getByRole("button", { name: viDictionary.demoConversation.send })
  )
  return { composer, user }
}

describe("MarketConversationAssistant submission contract", () => {
  beforeAll(() => {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: MouseEvent,
    })
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(
        (media: string) =>
          ({
            matches: media.includes("prefers-reduced-motion"),
            media,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      ),
    })
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    })
  })

  beforeEach(() => {
    createMarketConversation.mockReset()
    getMarketConversationMessages.mockReset()
    getMarketConversations.mockReset()
    submitMarketConversationMessage.mockReset()
    streamMarketConversationTurn.mockReset()
    createMarketConversation.mockResolvedValue({
      success: true,
      data: conversation,
    })
  })

  afterEach(cleanup)

  it("renders the approved launcher pill and AI notice", async () => {
    renderAssistant()
    const user = userEvent.setup()
    const launcher = screen.getByRole("button", {
      name: "Ask Signapse",
    })

    expect(launcher).toHaveTextContent("Ask Signapse")
    await user.click(launcher)
    expect(
      screen.getByText(
        "AI can make mistakes. Please verify important information.",
        { exact: true }
      )
    ).toBeVisible()
  })

  it("preserves Shift+Enter and ignores Enter while an IME composition is active", async () => {
    submitMarketConversationMessage.mockResolvedValue({
      success: false,
      error: "Network error",
    })
    renderAssistant()
    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: viDictionary.aiAssistant.launcher })
    )
    const composer = screen.getByRole("textbox", {
      name: viDictionary.demoConversation.persistedComposerLabel,
    })
    await user.type(composer, "Line one{Shift>}{Enter}{/Shift}Line two")
    expect(composer).toHaveValue("Line one\nLine two")

    fireEvent.keyDown(composer, {
      key: "Enter",
      isComposing: true,
    })
    expect(submitMarketConversationMessage).not.toHaveBeenCalled()

    await user.keyboard("{Enter}")
    await waitFor(() => {
      expect(submitMarketConversationMessage).toHaveBeenCalledTimes(1)
    })
  })

  it("retries a connection failure with the same request identity", async () => {
    submitMarketConversationMessage.mockResolvedValue({
      success: false,
      error: "Kết nối bị gián đoạn.",
    })

    renderAssistant()
    const { composer, user } = await openAndSubmit("What moved gold today?")

    await waitFor(() => {
      expect(submitMarketConversationMessage).toHaveBeenCalledTimes(1)
      expect(composer).toHaveValue("What moved gold today?")
    })

    const firstKey = submitMarketConversationMessage.mock.calls[0]?.[2]
    await user.click(
      screen.getByRole("button", { name: viDictionary.demoConversation.send })
    )

    await waitFor(() => {
      expect(submitMarketConversationMessage).toHaveBeenCalledTimes(2)
    })
    expect(submitMarketConversationMessage.mock.calls[1]?.[2]).toBe(firstKey)
  })

  it("shows quota rejection without rendering a completed turn", async () => {
    const quotaError = "Đã vượt hạn mức lượt AI trong tháng."
    submitMarketConversationMessage.mockResolvedValue({
      success: false,
      error: quotaError,
    })

    renderAssistant()
    const { composer } = await openAndSubmit("Try one more question")

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(quotaError)
    })
    expect(composer).toHaveValue("Try one more question")
    expect(
      screen.queryByText("Try one more question", { selector: "p" })
    ).not.toBeInTheDocument()
    expect(getMarketConversationMessages).not.toHaveBeenCalled()
  })

  it("renders an understanding message before ordered task steps and the saved Markdown answer", async () => {
    let resolveAcceptance!: (result: {
      success: true
      data: typeof acceptedTurn
    }) => void
    let resolveStream!: (result: typeof successfulTurn) => void
    submitMarketConversationMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveAcceptance = resolve
      })
    )
    streamMarketConversationTurn.mockReturnValue(
      new Promise((resolve) => {
        resolveStream = resolve
      })
    )

    renderAssistant()
    const { user } = await openAndSubmit("What moved gold today?")

    const question = await screen.findByText("What moved gold today?", {
      selector: "p",
    })
    expect(question).toBeVisible()
    expect(question.closest('[data-slot="bubble"]')).toHaveAttribute(
      "data-variant",
      "muted"
    )
    expect((await screen.findAllByText("Đang gửi"))[0]).toBeVisible()
    resolveAcceptance({ success: true, data: acceptedTurn })
    await waitFor(() => {
      expect(streamMarketConversationTurn).toHaveBeenCalledTimes(1)
    })
    expect((await screen.findAllByText("Đã nhận câu hỏi"))[0]).toBeVisible()

    const streamOptions = streamMarketConversationTurn.mock.calls[0]?.[0]
    streamOptions.onProgress({
      stepId: "understanding",
      sequenceNumber: 1,
      stepType: "UNDERSTANDING",
      status: "COMPLETED",
      publicMessage: "I will check the market context first.",
    })
    streamOptions.onProgress({
      stepId: "tool-1",
      sequenceNumber: 2,
      stepType: "TOOL",
      status: "IN_PROGRESS",
      publicMessage: "Checking market events",
    })

    expect(
      await screen.findByText("I will check the market context first.")
    ).toBeVisible()
    expect(await screen.findByText("Checking market events")).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Tiến độ: Đang xử lý" })
    ).toHaveAttribute("aria-expanded", "true")
    expect(screen.queryByText("Gold moved", { exact: false })).toBeNull()

    streamOptions.onProgress({
      stepId: "tool-1",
      sequenceNumber: 3,
      stepType: "TOOL",
      status: "COMPLETED",
      publicMessage: "Market events checked",
    })
    await waitFor(() => {
      expect(screen.getByText("Market events checked")).toBeVisible()
    })
    expect(screen.queryByText("Checking market events")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Tiến độ: Hoàn tất" }))
    expect(
      screen.getByRole("button", { name: "Tiến độ: Hoàn tất" })
    ).toHaveAttribute("aria-expanded", "false")
    streamOptions.onProgress({
      stepId: "tool-2",
      sequenceNumber: 4,
      stepType: "TOOL",
      status: "IN_PROGRESS",
      publicMessage: "Checking source details",
    })
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Tiến độ: Đang xử lý" })
      ).toHaveAttribute("aria-expanded", "false")
    })

    resolveStream(successfulTurn)
    expect(await screen.findByText("higher")).toBeVisible()
    expect(
      screen.getByRole("textbox", {
        name: viDictionary.demoConversation.persistedComposerLabel,
      })
    ).toBeEnabled()
  })

  it("keeps one new idempotency key across an uncertain expired-turn retry", async () => {
    const expiredTurn = {
      ...acceptedTurn,
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    }
    const failedTurn = {
      ...successfulTurn,
      assistantMessage: {
        ...successfulTurn.assistantMessage,
        status: "FAILED" as const,
        content: null,
        failureReason: "Turn expired",
      },
    }
    const retryAcceptedTurn = {
      ...acceptedTurn,
      submissionId: 109,
      userMessage: { ...acceptedTurn.userMessage, id: 503 },
      eventsUrl: "/market-conversations/42/turns/109/events",
    }
    let resolveUncertainRetry: (result: {
      success: false
      error: string
    }) => void = () => {}
    const uncertainRetry = new Promise<{ success: false; error: string }>(
      (resolve) => {
        resolveUncertainRetry = resolve
      }
    )
    submitMarketConversationMessage
      .mockResolvedValueOnce({ success: true, data: expiredTurn })
      .mockReturnValueOnce(uncertainRetry)
      .mockResolvedValueOnce({ success: true, data: retryAcceptedTurn })
    streamMarketConversationTurn
      .mockResolvedValueOnce(failedTurn)
      .mockReturnValueOnce(new Promise(() => {}))

    renderAssistant()
    const { user } = await openAndSubmit("What moved gold today?")
    await screen.findByRole("button", { name: "Thử lại" })
    const firstKey = submitMarketConversationMessage.mock.calls[0]?.[2]
    const retry = screen.getByRole("button", { name: "Thử lại" })
    await user.dblClick(retry)

    await waitFor(() => {
      expect(submitMarketConversationMessage).toHaveBeenCalledTimes(2)
    })

    const uncertainRetryCall = submitMarketConversationMessage.mock.calls[1]
    expect(uncertainRetryCall?.[2]).not.toBe(firstKey)
    expect(streamMarketConversationTurn).toHaveBeenCalledTimes(1)

    resolveUncertainRetry({ success: false, error: "Network error" })
    expect(await screen.findByText("Network error")).toBeVisible()
    await user.click(retry)

    await waitFor(() => {
      expect(submitMarketConversationMessage).toHaveBeenCalledTimes(3)
    })
    expect(submitMarketConversationMessage.mock.calls[2]).toEqual(
      uncertainRetryCall
    )
  })

  it("keeps the composer locked after a stream error and reconnects from the last sequence", async () => {
    submitMarketConversationMessage.mockResolvedValue({
      success: true,
      data: acceptedTurn,
    })
    streamMarketConversationTurn
      .mockRejectedValueOnce(new Error("Connection dropped"))
      .mockReturnValueOnce(new Promise(() => {}))

    renderAssistant()
    const { user } = await openAndSubmit("What moved gold today?")
    const reconnect = await screen.findByRole("button", {
      name: "Kết nối lại",
    })
    const composer = screen.getByRole("textbox", {
      name: viDictionary.demoConversation.persistedComposerLabel,
    })
    expect(composer).toBeDisabled()
    await user.click(reconnect)

    await waitFor(() => {
      expect(streamMarketConversationTurn).toHaveBeenCalledTimes(2)
    })
    expect(streamMarketConversationTurn.mock.calls[1]?.[0]).toMatchObject({
      conversationId: 42,
      submissionId: 108,
      afterSequence: 0,
    })
  })

  it("uses the English progress labels for the same turn pattern", async () => {
    submitMarketConversationMessage.mockResolvedValue({
      success: true,
      data: acceptedTurn,
    })
    streamMarketConversationTurn.mockImplementation((options) => {
      options.onProgress({
        stepId: "tool-1",
        sequenceNumber: 1,
        stepType: "TOOL",
        status: "IN_PROGRESS",
        publicMessage: "Checking market context",
      })
      return new Promise(() => {})
    })

    renderAssistant("en")
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Ask Signapse" }))
    const composer = screen.getByRole("textbox", { name: "Message" })
    await user.type(composer, "What moved gold today?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect((await screen.findAllByText("Question received"))[0]).toBeVisible()
    expect(
      await screen.findByRole("button", { name: "Progress: In progress" })
    ).toBeVisible()
  })
})
