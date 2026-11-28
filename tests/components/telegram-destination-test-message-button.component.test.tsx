// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { toast } = vi.hoisted(() => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock("@/app/api/telegram/action", () => ({
  sendTelegramTestMessage: vi.fn(),
}))

vi.mock("sonner", () => ({ toast }))

import { sendTelegramTestMessage } from "@/app/api/telegram/action"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { TelegramDestinationTestMessageButton } from "@/app/[lang]/(main)/telegram/telegram-destination-test-message-button"

const feedbackId = "telegram-test-message-24"

function renderButton(
  overrides: Partial<{
    canManage: boolean
    isEligible: boolean
  }> = {}
) {
  return render(
    <LocalizationProvider locale="en" dictionary={en}>
      <TelegramDestinationTestMessageButton
        destinationId={24}
        destinationLabel="Market Desk"
        canManage={true}
        isEligible={true}
        {...overrides}
      />
    </LocalizationProvider>
  )
}

describe("Telegram destination test message button", () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.mocked(sendTelegramTestMessage).mockReset()
    toast.error.mockReset()
    toast.loading.mockReset()
    toast.success.mockReset()
    toast.warning.mockReset()
  })

  it("is an icon-only, destination-named action that works from the keyboard", async () => {
    vi.mocked(sendTelegramTestMessage).mockResolvedValue({
      success: true,
      data: undefined,
    })
    const user = userEvent.setup()
    renderButton()

    const button = screen.getByRole("button", {
      name: "Send a test message to Market Desk",
    })
    expect(button).toBeVisible()
    expect(button).toHaveTextContent("")
    button.focus()
    await user.keyboard(" ")

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Telegram accepted the test message for Market Desk.",
        { id: feedbackId }
      )
    )
    expect(sendTelegramTestMessage).toHaveBeenCalledWith(24)
  })

  it("announces pending feedback and does not report success before the action resolves", async () => {
    let resolveAction: (
      result: Awaited<ReturnType<typeof sendTelegramTestMessage>>
    ) => void = () => undefined
    vi.mocked(sendTelegramTestMessage).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve
      })
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(
      screen.getByRole("button", {
        name: "Send a test message to Market Desk",
      })
    )

    expect(toast.loading).toHaveBeenCalledWith("Sending test…", {
      id: feedbackId,
    })
    const pendingButton = screen.getByRole("button", {
      name: "Sending a test message to Market Desk",
    })
    expect(pendingButton).toHaveAttribute("aria-busy", "true")
    expect(pendingButton).toHaveAttribute("aria-disabled", "true")
    expect(toast.success).not.toHaveBeenCalled()

    resolveAction({ success: true, data: undefined })
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it.each([
    [
      "without manage permission",
      { canManage: false },
      "Destination management permission is required to send a test message.",
    ],
    [
      "for an ineligible destination or bot",
      { isEligible: false },
      "Only active destinations linked to active bots can receive a test message.",
    ],
  ])("does not send %s", async (_label, overrides, reason) => {
    const user = userEvent.setup()
    renderButton(overrides)

    const button = screen.getByRole("button", {
      name: "Send a test message to Market Desk",
    })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).toHaveAccessibleDescription(reason)
    await user.click(button)

    expect(sendTelegramTestMessage).not.toHaveBeenCalled()
  })

  it("reports known rejection and unknown outcome through separate feedback", async () => {
    const user = userEvent.setup()
    renderButton()
    vi.mocked(sendTelegramTestMessage).mockResolvedValueOnce({
      success: false,
      error: "Telegram rejected the test message",
      outcome: "known-error",
    })

    await user.click(
      screen.getByRole("button", {
        name: "Send a test message to Market Desk",
      })
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Telegram rejected the test message",
        { id: feedbackId }
      )
    )

    vi.mocked(sendTelegramTestMessage).mockResolvedValueOnce({
      success: false,
      error:
        "Telegram did not confirm whether it accepted the test message. Check the Telegram conversation before trying again.",
      outcome: "unknown",
    })
    await user.click(
      screen.getByRole("button", {
        name: "Send a test message to Market Desk",
      })
    )
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "Telegram did not confirm whether it accepted the test message. Check the Telegram conversation before trying again.",
        { id: feedbackId }
      )
    )
  })

  it("treats an unreturned server action as an unknown outcome", async () => {
    vi.mocked(sendTelegramTestMessage).mockRejectedValue(
      new Error("The application did not return a result")
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(
      screen.getByRole("button", {
        name: "Send a test message to Market Desk",
      })
    )
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "Telegram did not confirm whether it accepted the test message. Check the Telegram conversation before trying again.",
        { id: feedbackId }
      )
    )
    expect(toast.success).not.toHaveBeenCalled()
  })
})
