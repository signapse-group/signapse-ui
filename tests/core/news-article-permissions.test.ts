import { describe, expect, it } from "vitest"

import {
  canDeleteNewsArticles,
  canReadNewsArticles,
} from "@/app/lib/news-articles/permissions"

describe("news article permissions", () => {
  it("keeps list access separate from Delete permission", () => {
    expect(canReadNewsArticles(["news-article:read"])).toBe(true)
    expect(canDeleteNewsArticles(["news-article:read"])).toBe(false)

    expect(
      canReadNewsArticles(["news-article:read", "news-article:delete"])
    ).toBe(true)
    expect(
      canDeleteNewsArticles(["news-article:read", "news-article:delete"])
    ).toBe(true)

    expect(canReadNewsArticles(["news-article:delete"])).toBe(false)
    expect(canDeleteNewsArticles(["news-article:delete"])).toBe(true)
  })

  it("does not treat roles or legacy source-document permissions as canonical", () => {
    expect(canReadNewsArticles(["USER", "ADMIN", "source-document:read"])).toBe(
      false
    )
    expect(
      canDeleteNewsArticles(["USER", "ADMIN", "source-document:delete"])
    ).toBe(false)
  })
})
