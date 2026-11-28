import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getDictionary: vi.fn(),
  getRequestLocale: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: mocks.getDictionary,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: mocks.getRequestLocale,
}))

import {
  getRoleByKey,
  getRoles,
  updateRolePermissions,
} from "@/app/api/roles/action"
import type { RoleResponse } from "@/app/lib/roles/definitions"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getDictionary.mockResolvedValue({
    roles: { updateError: "Could not update role permissions." },
  })
  mocks.getRequestLocale.mockResolvedValue("en")
})

describe("role read actions", () => {
  it("requests the list through the authenticated role endpoint", async () => {
    const roles: RoleResponse[] = []
    mocks.fetchAuthenticated.mockResolvedValue(roles)

    await expect(getRoles()).resolves.toBe(roles)
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith("/roles")
  })

  it("encodes the selected key and requests role detail through the authenticated API", async () => {
    const role = {
      id: 901,
      key: "READER/LOCAL",
      name: "Local reader",
      description: null,
      permissions: [],
    }
    mocks.fetchAuthenticated.mockResolvedValue(role)

    await expect(getRoleByKey("READER/LOCAL")).resolves.toBe(role)
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/roles/READER%2FLOCAL"
    )
  })

  it("sends an empty permission set as a complete replacement", async () => {
    const role = {
      id: 901,
      key: "EMPTY_ROLE",
      name: "Empty role",
      description: null,
      permissions: [],
    }
    mocks.fetchAuthenticated.mockResolvedValue(role)

    await expect(
      updateRolePermissions("EMPTY_ROLE", { permissionKeys: [] })
    ).resolves.toEqual({ success: true, data: role })

    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/roles/EMPTY_ROLE/permissions",
      { method: "PUT", body: '{"permissionKeys":[]}' }
    )
  })

  it("rejects duplicate permission keys at the action boundary", async () => {
    await expect(
      updateRolePermissions("ROLE", {
        permissionKeys: ["asset:read", "asset:read"],
      })
    ).resolves.toEqual({
      success: false,
      error: "Could not update role permissions.",
    })
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
  })
})
