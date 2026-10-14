import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    accountTelegramLanguage: {
      saveError: "Could not save the default Telegram language.",
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "en"),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { updateMyPreferredLanguage } from "@/app/api/user/action"
import { revalidatePath } from "next/cache"

describe("updateMyPreferredLanguage", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockClear()
  })

  it("rejects an empty ISO code before making a request", async () => {
    await expect(updateMyPreferredLanguage({ isoCode: "  " })).resolves.toEqual(
      {
        success: false,
        error: testDictionary.accountTelegramLanguage.saveError,
      }
    )

    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("updates only the authenticated user's preference", async () => {
    const updatedUser = {
      id: 42,
      preferredLanguage: { id: 2, isoCode: "en", name: "English" },
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(updatedUser)

    await expect(
      updateMyPreferredLanguage({ isoCode: " en " })
    ).resolves.toEqual({ success: true, data: updatedUser })

    expect(fetchAuthenticated).toHaveBeenCalledWith("/me/preferred-language", {
      method: "PATCH",
      body: JSON.stringify({ isoCode: "en" }),
    })
    expect(revalidatePath).toHaveBeenCalledWith("/account")
    expect(revalidatePath).toHaveBeenCalledTimes(1)
  })

  it("returns a failure when the producer rejects the update", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(new Error("HTTP 400"))

    await expect(updateMyPreferredLanguage({ isoCode: "fr" })).resolves.toEqual(
      {
        success: false,
        error: testDictionary.accountTelegramLanguage.saveError,
      }
    )

    expect(fetchAuthenticated).toHaveBeenCalledWith("/me/preferred-language", {
      method: "PATCH",
      body: JSON.stringify({ isoCode: "fr" }),
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("does not confirm a response with a different saved language", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      preferredLanguage: { id: 1, isoCode: "vi", name: "Tiếng Việt" },
    })

    await expect(updateMyPreferredLanguage({ isoCode: "en" })).resolves.toEqual(
      {
        success: false,
        error: testDictionary.accountTelegramLanguage.saveError,
      }
    )

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
