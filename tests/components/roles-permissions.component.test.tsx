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

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  PermissionResponse,
  RoleResponse,
} from "@/app/lib/roles/definitions"
import { RoleDetailPage } from "@/app/[lang]/(main)/roles/role-detail"

Object.defineProperty(window, "PointerEvent", {
  configurable: true,
  value: window.MouseEvent,
})

const mocks = vi.hoisted(() => ({
  updateRolePermissions: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("@/app/api/roles/action", () => ({
  updateRolePermissions: mocks.updateRolePermissions,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

const permissions: PermissionResponse[] = [
  {
    id: 1,
    key: "asset:read",
    name: "Read assets",
    description: "Can read asset information.",
  },
  {
    id: 2,
    key: "blog:create",
    name: "Create blogs",
    description: "Can create blog posts.",
  },
  {
    id: 3,
    key: "blog:read",
    name: "Read blogs",
    description: "Can read blog posts.",
  },
  {
    id: 4,
    key: "blog:update",
    name: "Update blogs",
    description: "Can update blog posts.",
  },
]

const role: RoleResponse = {
  id: 901,
  key: "CONTENT_REVIEWER",
  name: "Content Reviewer",
  description: "Can review content.",
  permissions: [permissions[0], permissions[2], permissions[3]],
}

function renderLocalized(
  children: React.ReactNode,
  locale: "en" | "vi" = "en"
) {
  const dictionary = locale === "en" ? en : viDictionary
  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      {children}
    </LocalizationProvider>
  )
}

function renderEditableRole(
  currentRole: RoleResponse = role,
  locale: "en" | "vi" = "en"
) {
  return renderLocalized(
    <RoleDetailPage
      role={currentRole}
      permissionCatalog={permissions}
      canEditPermissions
    />,
    locale
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.updateRolePermissions.mockResolvedValue({
    success: true,
    data: role,
  })
})

afterEach(() => cleanup())

describe("role permissions section", () => {
  it("shows the full catalog as labeled switches and keeps the impact note visible", () => {
    renderEditableRole()

    expect(screen.getByText(en.roles.permissionImpactDescription)).toBeVisible()
    expect(screen.getAllByRole("switch")).toHaveLength(permissions.length)
    expect(
      screen.getByRole("switch", { name: "Toggle permission Read assets" })
    ).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByRole("switch", { name: "Toggle permission Create blogs" })
    ).toHaveAttribute("aria-checked", "false")
    expect(screen.getByText("asset:read")).toBeVisible()
    expect(screen.getByText("blog:update")).toBeVisible()
    expect(
      screen.queryByText("Can read asset information.")
    ).not.toBeInTheDocument()

    const toolbar = screen
      .getByRole("heading", { name: en.roles.permissionsColumn })
      .parentElement
    expect(toolbar).toHaveClass("flex-col", "sm:flex-row")
    expect(
      screen.getByRole("button", { name: en.roles.savePermissions })
        .parentElement
    ).toHaveClass("justify-end")

    const header = screen
      .getByRole("heading", { name: "Permissions" })
      .closest('[data-slot="card-header"]')
    expect(header).toHaveClass("sticky", "top-0", "z-20")
    expect(header?.parentElement).toHaveClass("overflow-visible")
  })

  it("keeps read-only roles and ADMIN free of editing controls", () => {
    renderLocalized(<RoleDetailPage role={role} />)

    expect(screen.getByText(en.roles.readOnly)).toBeVisible()
    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(
      screen.queryByRole("button", { name: en.roles.savePermissions })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    cleanup()
    renderEditableRole({ ...role, key: "ADMIN", name: "Admin" })
    expect(screen.getByText(en.roles.readOnly)).toBeVisible()
    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(
      screen.queryByRole("button", { name: en.roles.savePermissions })
    ).not.toBeInTheDocument()
  })

  it("applies filtered group actions only to visible permissions", async () => {
    const user = userEvent.setup()
    renderEditableRole()

    const search = screen.getByRole("textbox", { name: en.roles.searchLabel })
    const blogGroup = screen.getByRole("region", { name: "Blogs" })

    await user.type(search, "Create blogs")
    expect(
      within(blogGroup).getByRole("button", { name: en.roles.deselectAll })
    ).toBeDisabled()

    await user.clear(search)
    await user.type(search, "Read blogs")
    await user.click(
      within(blogGroup).getByRole("button", { name: en.roles.deselectAll })
    )
    expect(
      screen.getByRole("switch", { name: "Toggle permission Read blogs" })
    ).toHaveAttribute("aria-checked", "false")

    await user.clear(search)
    expect(
      screen.getByRole("switch", { name: "Toggle permission Update blogs" })
    ).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByRole("switch", { name: "Toggle permission Create blogs" })
    ).toHaveAttribute("aria-checked", "false")
  })

  it("saves an empty permission set and uses localized labels in Vietnamese", async () => {
    const user = userEvent.setup()
    const onePermissionRole = { ...role, permissions: [permissions[0]] }
    renderEditableRole(onePermissionRole, "vi")

    expect(
      screen.getByText(viDictionary.roles.permissionImpactDescription)
    ).toBeVisible()
    const permissionSwitch = screen.getByRole("switch", {
      name: "Bật hoặc tắt quyền Read assets",
    })
    permissionSwitch.focus()
    expect(permissionSwitch).toHaveFocus()
    await user.keyboard(" ")
    expect(permissionSwitch).toHaveAttribute("aria-checked", "false")

    await user.click(
      screen.getByRole("button", { name: viDictionary.roles.savePermissions })
    )
    await waitFor(() =>
      expect(mocks.updateRolePermissions).toHaveBeenCalledWith(role.key, {
        permissionKeys: [],
      })
    )
    expect(mocks.toastSuccess).toHaveBeenCalledOnce()
  })

  it("shows a save error and keeps the permission draft", async () => {
    const user = userEvent.setup()
    mocks.updateRolePermissions.mockResolvedValue({
      success: false,
      error: "Save failed",
    })
    const emptyRole = { ...role, permissions: [] }
    renderEditableRole(emptyRole)

    const permissionSwitch = screen.getByRole("switch", {
      name: "Toggle permission Create blogs",
    })
    await user.click(permissionSwitch)
    await user.click(
      screen.getByRole("button", { name: en.roles.savePermissions })
    )

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Save failed")
    )
    expect(permissionSwitch).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByRole("button", { name: en.roles.savePermissions })
    ).toBeEnabled()
  })

  it("shows a localized save error and keeps the permission draft when the action rejects", async () => {
    const user = userEvent.setup()
    mocks.updateRolePermissions.mockRejectedValue(new Error("Network failure"))
    const emptyRole = { ...role, permissions: [] }
    renderEditableRole(emptyRole, "vi")

    const permissionSwitch = screen.getByRole("switch", {
      name: "Bật hoặc tắt quyền Create blogs",
    })
    await user.click(permissionSwitch)
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.roles.savePermissions,
      })
    )

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        viDictionary.roles.updateError
      )
    )
    expect(permissionSwitch).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByRole("button", {
        name: viDictionary.roles.savePermissions,
      })
    ).toBeEnabled()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it("keeps an out-of-catalog assignment read-only instead of dropping it", () => {
    const mismatchedRole = {
      ...role,
      permissions: [
        {
          id: 99,
          key: "unknown:read",
          name: "Unknown permission",
          description: null,
        },
      ],
    }
    renderEditableRole(mismatchedRole)

    expect(screen.getByRole("alert")).toHaveTextContent(
      en.roles.permissionCatalogMismatch
    )
    expect(screen.getByText("unknown:read")).toBeVisible()
    expect(screen.queryAllByRole("switch")).toHaveLength(0)
  })
})
