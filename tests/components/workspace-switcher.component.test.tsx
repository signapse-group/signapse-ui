// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerRefresh } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}))

vi.mock("@/app/api/workspaces/action", () => ({
  createWorkspace: vi.fn(),
  setCurrentWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
}))

vi.mock("@/components/workspace-watchlist-editor", () => ({
  WorkspaceWatchlistEditor: () => null,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { CURRENT_WORKSPACE_CHANGED_EVENT } from "@/app/lib/workspaces/events"
import type { WorkspaceResponse } from "@/app/lib/workspaces/definitions"
import { setCurrentWorkspace } from "@/app/api/workspaces/action"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"

const currentWorkspace: WorkspaceResponse = {
  id: 7,
  name: "Workspace",
  currentWorkspace: true,
  createdDate: "2026-07-29T00:00:00Z",
  lastModifiedDate: "2026-07-29T00:00:00Z",
}

const secondaryWorkspace: WorkspaceResponse = {
  id: 8,
  name: "Research",
  currentWorkspace: false,
  createdDate: "2026-07-29T00:00:00Z",
  lastModifiedDate: "2026-07-29T00:00:00Z",
}

function renderWorkspaceSwitcher() {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <WorkspaceSwitcher
        workspaces={[currentWorkspace, secondaryWorkspace]}
        currentWorkspace={currentWorkspace}
        canCreateWorkspace
        canRenameWorkspace
        canSetCurrentWorkspace
        canReadAsset
        canReadWatchlist
        canCreateWatchlist
        canDeleteWatchlist
      />
    </LocalizationProvider>
  )
}

describe("WorkspaceSwitcher Base UI menu contract", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    routerRefresh.mockReset()
  })

  it("opens grouped workspace menu content without a Base UI context error", async () => {
    const user = userEvent.setup()
    renderWorkspaceSwitcher()

    await user.click(screen.getByRole("button", { name: /Workspace/ }))

    const menu = await screen.findByRole("menu")
    expect(
      within(menu).getByText(viDictionary.workspace.switcherLabel)
    ).toBeVisible()
    expect(
      within(menu).getByRole("menuitem", { name: /Workspace/ })
    ).toBeVisible()
    expect(
      within(menu).getByRole("menuitem", {
        name: viDictionary.workspace.createAction,
      })
    ).toBeVisible()
  })

  it("notifies chart workbenches before refreshing after a workspace switch", async () => {
    const events: string[] = []
    const setWorkspace = vi.mocked(setCurrentWorkspace)
    setWorkspace.mockResolvedValue({ success: true, data: secondaryWorkspace })
    routerRefresh.mockImplementation(() => events.push("refresh"))
    const handleWorkspaceChange = (event: Event) => {
      expect((event as CustomEvent<{ workspaceId: number }>).detail).toEqual({
        workspaceId: secondaryWorkspace.id,
      })
      events.push("workspace")
    }
    window.addEventListener(
      CURRENT_WORKSPACE_CHANGED_EVENT,
      handleWorkspaceChange
    )

    const user = userEvent.setup()
    renderWorkspaceSwitcher()
    await user.click(screen.getByRole("button", { name: /Workspace/ }))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByRole("menuitem", { name: /Research/ }))

    await waitFor(() => expect(routerRefresh).toHaveBeenCalledOnce())
    expect(setWorkspace).toHaveBeenCalledWith(secondaryWorkspace.id)
    expect(events).toEqual(["workspace", "refresh"])
    window.removeEventListener(
      CURRENT_WORKSPACE_CHANGED_EVENT,
      handleWorkspaceChange
    )
  })
})
