import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getRoleByKey: vi.fn(),
  getCurrentPermissions: vi.fn(),
  getRoles: vi.fn(),
  getServerDictionary: vi.fn(),
}))

vi.mock("@/app/api/roles/action", () => ({
  getRoleByKey: mocks.getRoleByKey,
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
      expect(rolesPage.type).toBe(AccessDenied)
      expect(rolesPage.props.action).toBeUndefined()
      expect(detailPage.type).toBe(AccessDenied)
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
    expect(rolesPage.type).toBe(RoleListPage)
    expect(detailPage.type).toBe(RoleDetailPage)
  })
})
