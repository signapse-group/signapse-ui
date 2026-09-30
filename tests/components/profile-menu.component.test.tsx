// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { getUsageLimits } = vi.hoisted(() => ({
  getUsageLimits: vi.fn(),
}))

vi.mock("@/app/api/usage-limits/action", () => ({ getUsageLimits }))
vi.mock("@clerk/nextjs", () => ({
  SignOutButton: ({ children }: { children: import("react").ReactNode }) =>
    children,
}))
vi.mock("@/components/feedback/feedback-compose-dialog", () => ({
  FeedbackComposeDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Feedback form</div> : null,
}))
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }))
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as import("react").ReactNode}
    </a>
  ),
}))

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { UsageLimitsResponse } from "@/app/lib/usage-limits/definitions"
import { ProfileMenu } from "@/components/profile-menu"
import { SidebarProvider } from "@/components/ui/sidebar"

const usageLimits: UsageLimitsResponse = {
  workspace: { used: 0, limit: 5 },
  watchlist: {
    limit: 3,
    workspaces: [
      { workspaceId: 101, used: 0 },
      { workspaceId: 102, used: 4 },
      { workspaceId: 103, used: 0 },
      { workspaceId: 104, used: 1 },
      { workspaceId: 105, used: 2 },
      { workspaceId: 106, used: 3 },
      { workspaceId: 107, used: 1 },
    ],
  },
  conversationTurns: {
    used: 1001,
    limit: 1000,
    periodStartUtc: "2026-09-01T00:00:00Z",
    resetAtUtc: "2026-10-01T00:00:00Z",
  },
  activeSchedules: { used: 2, limit: 0 },
}

function renderProfileMenu(locale: "en" | "vi" = "en") {
  const dictionary = locale === "en" ? en : viDictionary

  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <SidebarProvider>
        <ProfileMenu
          isMobile={false}
          isP0FixtureMode={false}
          user={{ imageUrl: "", fullName: "Ada Lovelace", username: "ada" }}
        />
      </SidebarProvider>
    </LocalizationProvider>
  )
}

describe("profile menu usage limits", () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    getUsageLimits.mockReset()
    if (!window.PointerEvent) {
      Object.defineProperty(window, "PointerEvent", {
        configurable: true,
        value: MouseEvent,
      })
    }
  })

  it("expands in place, stays in the menu, and shows the full current response", async () => {
    const user = userEvent.setup()
    getUsageLimits.mockResolvedValue(usageLimits)
    renderProfileMenu()

    const originalUrl = window.location.href
    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }))

    const menu = await screen.findByRole("menu")
    const usageItem = within(menu).getByRole("menuitem", {
      name: en.usageLimits.title,
    })
    expect(usageItem).toHaveAttribute("aria-expanded", "false")
    const details = document.getElementById(
      usageItem.getAttribute("aria-controls") ?? ""
    )
    expect(details).toBeInTheDocument()
    expect(details).not.toBeVisible()
    expect(getUsageLimits).not.toHaveBeenCalled()

    await user.click(usageItem)

    expect(usageItem).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("menu")).toBeVisible()
    expect(window.location.href).toBe(originalUrl)
    expect(await screen.findByText("Workspace 107")).toBeVisible()
    expect(screen.getAllByText(/^Workspace \d+$/)).toHaveLength(7)
    expect(screen.getByText("0 / 5")).toBeVisible()
    expect(screen.getByText("1,001 / 1,000")).toBeVisible()
    expect(screen.getByText("2 / 0")).toBeVisible()
    expect(screen.getByText(/October 1, 2026/)).toHaveTextContent("UTC")
    expect(getUsageLimits).toHaveBeenCalledOnce()
  })

  it("announces loading inside the expanded menu before values arrive", async () => {
    const user = userEvent.setup()
    let resolveUsage: (response: UsageLimitsResponse) => void = () => {}
    getUsageLimits.mockReturnValue(
      new Promise<UsageLimitsResponse>((resolve) => {
        resolveUsage = resolve
      })
    )
    renderProfileMenu()

    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }))
    const menu = await screen.findByRole("menu")
    await user.click(
      within(menu).getByRole("menuitem", { name: en.usageLimits.title })
    )

    expect(await screen.findByRole("status")).toHaveTextContent(
      en.usageLimits.loadingLabel
    )
    expect(screen.getByRole("menu")).toBeVisible()
    expect(screen.queryByText("0 / 5")).not.toBeInTheDocument()

    resolveUsage(usageLimits)
    expect(await screen.findByText("0 / 5")).toBeVisible()
  })

  it("shows the localized empty watchlist state", async () => {
    const user = userEvent.setup()
    getUsageLimits.mockResolvedValue({
      ...usageLimits,
      watchlist: { limit: 3, workspaces: [] },
    })
    renderProfileMenu("vi")

    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }))
    const menu = await screen.findByRole("menu")
    const usageItem = within(menu).getByRole("menuitem", {
      name: viDictionary.usageLimits.title,
    })
    await user.click(usageItem)

    expect(
      await screen.findByText(viDictionary.usageLimits.noWorkspaces)
    ).toBeVisible()
    expect(
      screen.getByText(viDictionary.usageLimits.conversationTurnsTitle)
    ).toBeVisible()
    const resetTime = screen.getByText(
      (_text, element) => element?.tagName === "TIME"
    )
    expect(resetTime).toHaveAttribute(
      "dateTime",
      usageLimits.conversationTurns.resetAtUtc
    )
    expect(resetTime).toHaveTextContent("UTC")
  })

  it("keeps transport failures distinct from zero and retries in place", async () => {
    const user = userEvent.setup()
    getUsageLimits
      .mockRejectedValueOnce(new Error("Authorization failed"))
      .mockResolvedValueOnce({
        ...usageLimits,
        workspace: { used: 2, limit: 5 },
      })
    renderProfileMenu()

    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }))
    const menu = await screen.findByRole("menu")
    const usageItem = within(menu).getByRole("menuitem", {
      name: en.usageLimits.title,
    })
    await user.click(usageItem)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.usageLimits.errorDescription
    )
    expect(screen.queryByText("0 / 5")).not.toBeInTheDocument()

    await user.click(screen.getByRole("menuitem", { name: en.common.retry }))

    expect(screen.getByRole("menu")).toBeVisible()
    expect(await screen.findByText("2 / 5")).toBeVisible()
    expect(getUsageLimits).toHaveBeenCalledTimes(2)
  })

  it("loads a fresh response whenever the disclosure is viewed again", async () => {
    const user = userEvent.setup()
    getUsageLimits.mockResolvedValueOnce(usageLimits).mockResolvedValueOnce({
      ...usageLimits,
      workspace: { used: 4, limit: 5 },
    })
    renderProfileMenu()

    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }))
    const menu = await screen.findByRole("menu")
    const usageItem = within(menu).getByRole("menuitem", {
      name: en.usageLimits.title,
    })
    await user.click(usageItem)
    expect(await screen.findByText("0 / 5")).toBeVisible()

    await user.click(usageItem)
    expect(usageItem).toHaveAttribute("aria-expanded", "false")
    await user.click(usageItem)

    expect(await screen.findByText("4 / 5")).toBeVisible()
    expect(getUsageLimits).toHaveBeenCalledTimes(2)
  })

  it("supports keyboard disclosure, Escape focus return, and existing profile actions", async () => {
    const user = userEvent.setup()
    getUsageLimits.mockResolvedValue(usageLimits)
    renderProfileMenu()

    const trigger = screen.getByRole("button", { name: /Ada Lovelace/ })
    trigger.focus()
    await user.keyboard("{Enter}")

    const menu = await screen.findByRole("menu")
    const usageItem = within(menu).getByRole("menuitem", {
      name: en.usageLimits.title,
    })
    expect(
      within(menu).getByRole("menuitem", { name: en.auth.account })
    ).toHaveAttribute("href", "/en/account")
    expect(
      within(menu).getByRole("menuitem", {
        name: en.navigation.apiAccessToken,
      })
    ).toHaveAttribute("href", "/en/developer-token")
    expect(
      within(menu).getByRole("menuitem", { name: en.auth.notifications })
    ).toBeVisible()
    expect(
      within(menu).getByRole("menuitem", {
        name: en.feedback.historyAction,
      })
    ).toHaveAttribute("href", "/en/feedback")
    expect(
      within(menu).getByRole("menuitem", { name: en.auth.signOut })
    ).toBeVisible()

    usageItem.focus()
    await user.keyboard(" ")
    expect(usageItem).toHaveAttribute("aria-expanded", "true")
    expect(await screen.findByText("Workspace 107")).toBeVisible()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    const reopenedMenu = await screen.findByRole("menu")
    await user.click(
      within(reopenedMenu).getByRole("menuitem", {
        name: en.feedback.composeAction,
      })
    )
    expect(screen.getByRole("dialog")).toHaveTextContent("Feedback form")
  })
})
