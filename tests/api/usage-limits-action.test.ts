import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary, reportValidationFailure } = vi.hoisted(() => ({
  testDictionary: {
    usageLimits: {
      responseInvalid: "Usage limits response is invalid",
    },
  },
  reportValidationFailure: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "vi"),
}))

vi.mock("@/app/lib/observability/server", () => ({
  reportValidationFailure,
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getUsageLimits } from "@/app/api/usage-limits/action"

const response = {
  workspace: { used: 0, limit: 5 },
  watchlist: {
    limit: 3,
    workspaces: [
      { workspaceId: 101, used: 0 },
      { workspaceId: 102, used: 4 },
    ],
  },
  conversationTurns: {
    used: 20,
    limit: 1000,
    periodStartUtc: "2026-09-01T00:00:00Z",
    resetAtUtc: "2026-10-01T00:00:00Z",
  },
  activeSchedules: { used: 1, limit: 1 },
}

describe("usage limits authenticated action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    reportValidationFailure.mockReset()
  })

  it("loads the current user's four resources without normalizing usage", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(getUsageLimits()).resolves.toEqual(response)
    expect(fetchAuthenticated).toHaveBeenCalledWith("/me/usage-limits")
    expect(reportValidationFailure).not.toHaveBeenCalled()
  })

  it("rejects an incomplete response instead of treating it as zero usage", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      workspace: { used: 0, limit: 5 },
    })

    await expect(getUsageLimits()).rejects.toThrow(
      testDictionary.usageLimits.responseInvalid
    )
    expect(reportValidationFailure).toHaveBeenCalledWith(
      "signapse.usage_limits.load",
      { feature: "usage-limits", route: "/me/usage-limits" },
      expect.any(Array)
    )
  })

  it("propagates backend load failures so the route can show an error state", async () => {
    const backendError = new Error("Backend unavailable")
    vi.mocked(fetchAuthenticated).mockRejectedValue(backendError)

    await expect(getUsageLimits()).rejects.toBe(backendError)
    expect(reportValidationFailure).not.toHaveBeenCalled()
  })
})
