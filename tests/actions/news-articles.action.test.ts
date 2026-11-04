import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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
  deleteNewsArticle,
  getNewsArticlePublisherOptions,
} from "@/app/api/news-articles/action"

describe("news article actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getRequestLocale.mockResolvedValue("vi")
  })

  afterEach(() => vi.clearAllMocks())

  it("searches publisher options through sourceName containsIgnoreCase", async () => {
    mocks.fetchAuthenticated.mockResolvedValue(["CNBC", "CNBC Indonesia"])

    await expect(getNewsArticlePublisherOptions("  cnbc  ")).resolves.toEqual([
      "CNBC",
      "CNBC Indonesia",
    ])

    const [path] = mocks.fetchAuthenticated.mock.calls[0] as [string]
    const requestUrl = new URL(path, "https://api.example")
    expect(requestUrl.pathname).toBe("/news-articles/publisher-options")
    expect(requestUrl.searchParams.get("$filter")).toBe(
      "containsIgnoreCase(sourceName,'cnbc')"
    )
  })

  it("does not send an empty publisher filter", async () => {
    mocks.fetchAuthenticated.mockResolvedValue([])

    await expect(getNewsArticlePublisherOptions(" ")).resolves.toEqual([])
    expect(mocks.fetchAuthenticated).toHaveBeenCalledWith(
      "/news-articles/publisher-options"
    )
  })

  it.each([
    [403, "Bạn không có quyền xóa bài viết."],
    [409, "Bài viết đang được dùng làm bằng chứng cho sự kiện."],
  ])(
    "preserves the article and returns localized delete rejection (%i)",
    async (status, message) => {
      const error = Object.assign(new Error(message), { status })
      mocks.fetchAuthenticated.mockRejectedValue(error)
      mocks.getDictionary.mockResolvedValue({
        newsArticles: { deleteError: "Không thể xóa bài viết." },
      })

      await expect(deleteNewsArticle(42)).resolves.toEqual({
        success: false,
        error: message,
      })
      expect(mocks.revalidatePath).not.toHaveBeenCalled()
    }
  )
})
