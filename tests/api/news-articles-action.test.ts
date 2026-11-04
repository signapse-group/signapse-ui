import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary, reportValidationFailure } = vi.hoisted(() => ({
  testDictionary: {
    newsArticles: {
      errorDescription: "Could not load news article data right now.",
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
import { getNewsArticleById } from "@/app/api/news-articles/action"

describe("getNewsArticleById", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    reportValidationFailure.mockReset()
  })

  it("validates the response and preserves body and source snapshot data", async () => {
    const response = {
      title: "Bản tin được bản địa hóa",
      description: null,
      content: Array.from(
        { length: 80 },
        (_, index) => `Paragraph ${index + 1}.`
      ).join("\n\n"),
      featureImage: { urlMedium: "/media/article.webp" },
      publishedAt: null,
      sourceName: "Stored source snapshot",
      status: "DERIVATION_FAILED",
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(getNewsArticleById(71)).resolves.toEqual({
      ...response,
      id: 71,
    })
    expect(fetchAuthenticated).toHaveBeenCalledWith("/news-articles/71")
    expect(reportValidationFailure).not.toHaveBeenCalled()
  })

  it("returns a localized error and reports an invalid producer payload", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      title: null,
      description: null,
      content: 123,
      featureImage: null,
      publishedAt: null,
    })

    await expect(getNewsArticleById(71)).rejects.toThrow(
      testDictionary.newsArticles.errorDescription
    )
    expect(reportValidationFailure).toHaveBeenCalledWith(
      "signapse.backend.request",
      { feature: "news_articles", route: "/news-articles/:id" },
      expect.any(Array)
    )
  })

  it("rejects a response whose Article identity does not match the request", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      id: 72,
      title: null,
      description: null,
      content: null,
      featureImage: null,
      publishedAt: null,
    })

    await expect(getNewsArticleById(71)).rejects.toThrow(
      testDictionary.newsArticles.errorDescription
    )
    expect(reportValidationFailure).toHaveBeenCalledWith(
      "signapse.backend.request",
      { feature: "news_articles", route: "/news-articles/:id" },
      [
        expect.objectContaining({
          code: "custom",
          path: ["id"],
        }),
      ]
    )
  })
})
