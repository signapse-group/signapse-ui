import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getMe,
  getDevAuthPermissions,
  isDevAuthModeEnabled,
  isP0FixtureModeEnabled,
} = vi.hoisted(() => ({
  getMe: vi.fn(),
  getDevAuthPermissions: vi.fn(),
  isDevAuthModeEnabled: vi.fn(),
  isP0FixtureModeEnabled: vi.fn(),
}))

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>()
  return { ...actual, cache: (callback: () => unknown) => callback }
})
vi.mock("@/app/api/user/action", () => ({ getMe }))
vi.mock("@/app/lib/dev-auth-mode", () => ({
  getDevAuthPermissions,
  isDevAuthModeEnabled,
  isP0FixtureModeEnabled,
}))

import { getCurrentPermissions } from "@/app/lib/permissions-server"

describe("server permission loading", () => {
  beforeEach(() => {
    vi.mocked(getMe).mockReset()
    vi.mocked(getDevAuthPermissions).mockReset()
    vi.mocked(isDevAuthModeEnabled).mockReset()
    vi.mocked(isP0FixtureModeEnabled).mockReset()
  })

  it("fails closed when the fixture permission source is unavailable", async () => {
    vi.mocked(isDevAuthModeEnabled).mockReturnValue(true)
    vi.mocked(isP0FixtureModeEnabled).mockReturnValue(true)
    vi.mocked(getDevAuthPermissions).mockReturnValue(["*"])
    vi.mocked(getMe).mockRejectedValue(new Error("fixture /me unavailable"))

    await expect(getCurrentPermissions()).resolves.toEqual([])
  })

  it("uses permissions returned by the fixture account", async () => {
    vi.mocked(isDevAuthModeEnabled).mockReturnValue(true)
    vi.mocked(isP0FixtureModeEnabled).mockReturnValue(true)
    vi.mocked(getMe).mockResolvedValue({
      permissions: ["contact-request:read"],
    })

    await expect(getCurrentPermissions()).resolves.toEqual([
      "contact-request:read",
    ])
  })

  it("keeps the configured permissions in non-fixture dev-auth mode", async () => {
    vi.mocked(isDevAuthModeEnabled).mockReturnValue(true)
    vi.mocked(isP0FixtureModeEnabled).mockReturnValue(false)
    vi.mocked(getDevAuthPermissions).mockReturnValue(["*"])

    await expect(getCurrentPermissions()).resolves.toEqual(["*"])
    expect(getMe).not.toHaveBeenCalled()
  })
})
