import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ fetchAuthenticated: vi.fn() }))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({ getDictionary: vi.fn() }))
vi.mock("@/app/lib/i18n/server", () => ({ getRequestLocale: vi.fn() }))

import { getRoleByKey, getRoles } from "@/app/api/roles/action"
import type { RoleResponse } from "@/app/lib/roles/definitions"

beforeEach(() => {
  vi.clearAllMocks()
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
})
