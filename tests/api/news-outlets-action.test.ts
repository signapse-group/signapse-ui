import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchAuthenticated: vi.fn(),
  getServerDictionary: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: mocks.getServerDictionary,
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
    nameRequired: "Name is required",
    homepageRequired: "Homepage is required",
    updateError: "Could not update news outlet",
    toggleError: "Could not update news outlet status",
    deleteError: "Could not delete news outlet",
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getServerDictionary.mockResolvedValue(dictionary)
})

describe("news outlet actions", () => {
  it("validates and trims create requests without adding URL or length rules", async () => {
    mocks.fetchAuthenticated.mockResolvedValue(newsOutlet)
    const request = {
      name: ` ${"N".repeat(300)} `,
      homepageUrl: " custom:homepage ",
      rssUrl: " custom:feed ",
      description: "D".repeat(1001),
    }

    await expect(createNewsOutlet(request)).resolves.toEqual({
      success: true,
      data: newsOutlet,
    })
    const [path, options] = mocks.fetchAuthenticated.mock.calls[0]
    expect(path).toBe("/news-outlets")
    expect(options.method).toBe("POST")
    expect(JSON.parse(options.body)).toEqual({
      name: "N".repeat(300),
      description: "D".repeat(1001),
      homepageUrl: "custom:homepage",
      rssUrl: "custom:feed",
    })
  })

  it("rejects blank required create values before sending a request", async () => {
    await expect(
      createNewsOutlet({ name: "  ", homepageUrl: "site" })
    ).resolves.toEqual({ success: false, error: "Name is required" })
    expect(mocks.fetchAuthenticated).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

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
