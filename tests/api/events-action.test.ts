import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockFetchAuthenticated } = vi.hoisted(() => ({
  mockFetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mockFetchAuthenticated,
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getEventByIdForQuickDetail } from "@/app/api/events/action"

describe("getEventByIdForQuickDetail", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it.each([401, 403, 404])(
    "returns the serializable HTTP %i status for the quick reader",
    async (status) => {
      vi.mocked(fetchAuthenticated).mockRejectedValueOnce(
        Object.assign(new Error("private backend detail"), { status })
      )

      await expect(getEventByIdForQuickDetail(73)).resolves.toEqual({
        success: false,
        status,
      })
      expect(fetchAuthenticated).toHaveBeenCalledWith("/events/73")
    }
  )
})
