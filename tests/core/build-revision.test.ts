import { afterEach, describe, expect, it, vi } from "vitest"

import { GET } from "@/app/api/build-revision/route"

afterEach(() => vi.unstubAllEnvs())

describe("public deployment revision", () => {
  it("returns only the build's full commit SHA without caching", async () => {
    const revision = "a".repeat(40)
    vi.stubEnv("SIGNAPSE_BUILD_REVISION", revision)
    const response = GET()
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(await response.json()).toEqual({ revision })
  })

  it.each([undefined, "", "main", "a".repeat(7)])(
    "does not claim delivery without a full build revision: %s",
    async (revision) => {
      vi.stubEnv("SIGNAPSE_BUILD_REVISION", revision)
      const response = GET()
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ revision: null })
    }
  )
})
