// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }))
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn() }))

import { usePathname } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { RouteFocusManager } from "@/app/[lang]/(main)/route-focus-manager"
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const mockUsePathname = vi.mocked(usePathname)
const mockUseIsMobile = vi.mocked(useIsMobile)

function SidebarState() {
  const { openMobile } = useSidebar()
  return (
    <output data-testid="mobile-sidebar-state">{String(openMobile)}</output>
  )
}

function routeFocusManagerTree() {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <RouteFocusManager />
      <SidebarState />
      <main id="main-content" tabIndex={-1}>
        Destination content
      </main>
    </SidebarProvider>
  )
}

describe("RouteFocusManager", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/vi/dashboard")
    mockUseIsMobile.mockReturnValue(false)
  })

  afterEach(() => cleanup())

  it("moves focus to main content after route changes, including history navigation", () => {
    const { rerender } = render(routeFocusManagerTree())
    const main = screen.getByRole("main")

    mockUsePathname.mockReturnValue("/vi/roles")
    rerender(routeFocusManagerTree())
    expect(main).toHaveFocus()

    mockUsePathname.mockReturnValue("/vi/dashboard")
    rerender(routeFocusManagerTree())
    expect(main).toHaveFocus()
  })

  it("closes an open mobile sidebar before moving focus to main content", async () => {
    mockUseIsMobile.mockReturnValue(true)
    const user = userEvent.setup()
    const { rerender } = render(routeFocusManagerTree())

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
    expect(screen.getByTestId("mobile-sidebar-state")).toHaveTextContent("true")

    mockUsePathname.mockReturnValue("/vi/roles")
    rerender(routeFocusManagerTree())

    expect(screen.getByTestId("mobile-sidebar-state")).toHaveTextContent(
      "false"
    )
    expect(screen.getByRole("main")).toHaveFocus()
  })
})
