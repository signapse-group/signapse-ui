import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRoleByKey: vi.fn(),
  getPermissions: vi.fn(),
  getCurrentPermissions: vi.fn(),
  getRoles: vi.fn(),
  getServerDictionary: vi.fn(),
}))

vi.mock("@/app/api/roles/action", () => ({
  getRoleByKey: mocks.getRoleByKey,
  getPermissions: mocks.getPermissions,
  getRoles: mocks.getRoles,
}))
vi.mock("@/app/lib/permissions-server", () => ({
  getCurrentPermissions: mocks.getCurrentPermissions,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: mocks.getServerDictionary,
}))

import RoleDetailRoute from "@/app/[lang]/(main)/roles/[roleKey]/page"
import RolesPage from "@/app/[lang]/(main)/roles/page"
import { en } from "@/app/lib/i18n/dictionaries/en"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import { RoleDetailPage } from "@/app/[lang]/(main)/roles/role-detail"
import { RoleListPage } from "@/app/[lang]/(main)/roles/role-list"
import { AccessDenied } from "@/components/access-denied"

const role: RoleResponse = {
  id: 901,
  key: "CONTENT_REVIEWER",
  name: "Content Reviewer",
  description: "Can review content.",
  permissions: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getServerDictionary.mockResolvedValue(en)
})

describe("role page permission gates", () => {
  it.each([
    { permissions: ["role:create"] },
    { permissions: ["role:update"] },
    { permissions: [] },
  ])(
    "does not request role data without role:read when permissions are %j",
    async ({ permissions }) => {
      mocks.getCurrentPermissions.mockResolvedValue(permissions)

      const rolesPage = await RolesPage()
      const detailPage = await RoleDetailRoute({
        params: Promise.resolve({ roleKey: role.key }),
      })

      expect(mocks.getRoles).not.toHaveBeenCalled()
      expect(mocks.getRoleByKey).not.toHaveBeenCalled()
      expect(mocks.getPermissions).not.toHaveBeenCalled()
      expect(rolesPage.type).toBe(AccessDenied)
      expect(rolesPage.props.action).toBeUndefined()
      expect(detailPage.type).toBe("div")
      expect(detailPage.props.className).toContain("max-w-2xl")
      expect(detailPage.props.children.type).toBe(AccessDenied)
    }
  )

  it("loads list and direct detail data for a role:read caller", async () => {
    mocks.getCurrentPermissions.mockResolvedValue(["role:read"])
    mocks.getRoles.mockResolvedValue([role])
    mocks.getRoleByKey.mockResolvedValue(role)

    const rolesPage = await RolesPage()
    const detailPage = await RoleDetailRoute({
      params: Promise.resolve({ roleKey: role.key }),
    })

    expect(mocks.getRoles).toHaveBeenCalledOnce()
    expect(mocks.getRoleByKey).toHaveBeenCalledWith(role.key)
    expect(mocks.getPermissions).not.toHaveBeenCalled()
    expect(rolesPage.type).toBe(RoleListPage)
    expect(detailPage.type).toBe(RoleDetailPage)
  })

  it("loads the catalog only for a role:read and role:update caller", async () => {
    const catalog = [
      {
        id: 1,
        key: "asset:read",
        name: "Read assets",
        description: null,
      },
    ]
    mocks.getCurrentPermissions.mockResolvedValue(["role:read", "role:update"])
    mocks.getRoleByKey.mockResolvedValue(role)
    mocks.getPermissions.mockResolvedValue(catalog)

    const detailPage = await RoleDetailRoute({
      params: Promise.resolve({ roleKey: role.key }),
    })

    expect(mocks.getRoleByKey).toHaveBeenCalledWith(role.key)
    expect(mocks.getPermissions).toHaveBeenCalledOnce()
    expect(detailPage.type).toBe(RoleDetailPage)
    expect(detailPage.props).toMatchObject({
      role,
      permissionCatalog: catalog,
      canEditPermissions: true,
    })
  })

  it("keeps ADMIN read-only and does not request the permission catalog", async () => {
    const adminRole = { ...role, key: "ADMIN", name: "Admin" }
    mocks.getCurrentPermissions.mockResolvedValue(["role:read", "role:update"])
    mocks.getRoleByKey.mockResolvedValue(adminRole)

    const detailPage = await RoleDetailRoute({
      params: Promise.resolve({ roleKey: adminRole.key }),
    })

    expect(mocks.getPermissions).not.toHaveBeenCalled()
    expect(detailPage.type).toBe(RoleDetailPage)
    expect(detailPage.props.canEditPermissions).toBe(false)
  })

  it("does not request the catalog when an inactive user's role read is rejected", async () => {
    const forbidden = Object.assign(new Error("inactive"), { status: 403 })
    mocks.getCurrentPermissions.mockResolvedValue(["role:read", "role:update"])
    mocks.getRoleByKey.mockRejectedValue(forbidden)

    const detailPage = await RoleDetailRoute({
      params: Promise.resolve({ roleKey: role.key }),
    })

    expect(mocks.getPermissions).not.toHaveBeenCalled()
    expect(detailPage.type).toBe("div")
    expect(detailPage.props.children.type).toBe(AccessDenied)
  })
})
