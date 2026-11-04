import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getDictionary: vi.fn(),
  getRequestLocale: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: mocks.getDictionary,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: mocks.getRequestLocale,
}))

import {
  createNewsOutlet,
  deleteNewsOutlet,
  toggleNewsOutletActive,
  updateNewsOutlet,
} from "@/app/api/news-outlets/action"

const newsOutlet = {
  id: 7,
  name: "Example source",
  description: null,
  homepageUrl: "example.com",
  rssUrl: null,
  active: true,
  createdDate: "2026-11-04T12:00:00Z",
}

const dictionary = {
  newsOutlets: {
    createError: "Could not create news outlet",
    updateError: "Could not update news outlet",
    toggleError: "Could not update news outlet status",
    deleteError: "Could not delete news outlet",
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getDictionary.mockResolvedValue(dictionary)
  mocks.getRequestLocale.mockResolvedValue("en")
})

describe("news outlet actions", () => {
  it.each([
    ["create", () => createNewsOutlet({ name: "Source", homepageUrl: "site" })],
    ["update", () => updateNewsOutlet(7, { description: "" })],
    ["toggle", () => toggleNewsOutletActive(7)],
    ["delete", () => deleteNewsOutlet(7)],
  ])(
    "returns forbidden errors without revalidating after a %s denial",
    async (_, invoke) => {
      mocks.fetchAuthenticated.mockRejectedValue(
        Object.assign(new Error("Permission denied"), { status: 403 })
      )

      await expect(invoke()).resolves.toEqual({
        success: false,
        error: "Permission denied",
      })
      expect(mocks.revalidatePath).not.toHaveBeenCalled()
    }
  )

  it("keeps blank optional update fields in the producer request so they clear", async () => {
    const request = {
      description: "",
      rssUrl: "",
    }
    mocks.fetchAuthenticated.mockResolvedValue(newsOutlet)

    await updateNewsOutlet(7, request)

    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith("/news-outlets/7", {
      method: "PUT",
      body: JSON.stringify(request),
    })
  })
})
