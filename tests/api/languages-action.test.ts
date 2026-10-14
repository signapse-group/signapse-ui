import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getLanguages } from "@/app/api/languages/action"

describe("getLanguages", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("reads the catalog's ISO preference and language options", async () => {
    const catalog = {
      currentLanguage: "en",
      preferredLanguage: "vi",
      languages: [{ isoCode: "vi", name: "Tiếng Việt" }],
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(catalog)

    await expect(getLanguages()).resolves.toEqual(catalog)
    expect(fetchAuthenticated).toHaveBeenCalledWith("/languages")
  })

  it("requires the catalog preference field to be explicit nullable data", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      currentLanguage: "en",
      languages: [],
    })

    await expect(getLanguages()).rejects.toThrow()
  })

  it("accepts language properties omitted by the published response schema", async () => {
    const catalog = {
      currentLanguage: "en",
      preferredLanguage: "vi",
      languages: [{}],
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(catalog)

    await expect(getLanguages()).resolves.toEqual(catalog)
  })
})
