// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
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
} = vi.hoisted(() => ({
  createMarketConversation: vi.fn(),
  getMarketConversationMessages: vi.fn(),
  getMarketConversations: vi.fn(),
  submitMarketConversationMessage: vi.fn(),
}))

vi.mock("@/app/api/market-conversations/action", () => ({
  createMarketConversation,
  getMarketConversationMessages,
  getMarketConversations,
  submitMarketConversationMessage,
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
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

function renderAssistant() {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
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
  })

  beforeEach(() => {
    createMarketConversation.mockReset()
    getMarketConversationMessages.mockReset()
    getMarketConversations.mockReset()
    submitMarketConversationMessage.mockReset()
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
})
