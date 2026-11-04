// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  deleteNewsArticle: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn() }),
}))
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))
vi.mock("@/app/api/news-articles/action", () => ({
  deleteNewsArticle: mocks.deleteNewsArticle,
}))
vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useLocalizedPath: (path: string) => path,
}))
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: ComponentProps<"img">) => (
    <img {...props} alt={alt ?? ""} />
  ),
}))
vi.mock("@/components/app-pagination-controls", () => ({
  AppPaginationControls: () => null,
}))
vi.mock("@/app/[lang]/(main)/news-articles/news-article-filters", () => ({
  NewsArticleFilters: () => <div>News article filters</div>,
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { Page } from "@/app/lib/definitions"
import type { NewsArticleListResponse } from "@/app/lib/news-articles/definitions"
import { NEWS_ARTICLE_DELETE_PERMISSIONS } from "@/app/lib/news-articles/permissions"
import { PermissionProvider } from "@/components/permission-provider"
import { NewsArticleList } from "@/app/[lang]/(main)/news-articles/news-article-list"

const article: NewsArticleListResponse = {
  id: 22,
  title: null,
  description: null,
  url: "https://publisher.example/article/22",
  sourceName: "CNBC Indonesia",
  publishedAt: null,
  status: "CONTENT_FAILED",
  createdDate: "2026-11-04T10:00:00Z",
  featureImage: null,
}

const articlePage: Page<NewsArticleListResponse> = {
  content: [article],
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  numberOfElements: 1,
  empty: false,
}

function renderList(permissions: string[]) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <PermissionProvider permissions={permissions}>
        <NewsArticleList
          newsArticlePage={articlePage}
          timeZone="Asia/Bangkok"
        />
      </PermissionProvider>
    </LocalizationProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  if (!window.PointerEvent) {
    Object.defineProperty(window, "PointerEvent", { value: MouseEvent })
  }
})

afterEach(cleanup)

describe("News Article list permissions and state", () => {
  it("shows localized missing values and hides Delete for read-only access", () => {
    renderList(["news-article:read"])

    expect(
      screen.getByRole("link", {
        name: viDictionary.newsArticles.titleUnavailable,
      })
    ).toHaveAttribute("href", `/news-articles/${article.id}`)
    expect(
      screen.getAllByText(viDictionary.newsArticles.descriptionUnavailable)
        .length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        viDictionary.newsArticles.statusLabels[article.status!]
      ).length
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole("button", { name: viDictionary.newsArticles.delete })
    ).not.toBeInTheDocument()
  })

  it("shows Delete only when news-article:delete is granted with list read", () => {
    renderList(["news-article:read", ...NEWS_ARTICLE_DELETE_PERMISSIONS])

    expect(
      screen.getByRole("button", { name: viDictionary.newsArticles.delete })
    ).toBeInTheDocument()
  })

  it.each([
    [403, "Bạn không có quyền xóa bài viết."],
    [409, "Bài viết đang được dùng làm bằng chứng cho sự kiện."],
  ])(
    "keeps the article and does not report delete success after %i",
    async (_status, message) => {
      const user = userEvent.setup()
      mocks.deleteNewsArticle.mockResolvedValue({
        success: false,
        error: message,
      })
      renderList(["news-article:read", "news-article:delete"])

      await user.click(
        screen.getByRole("button", { name: viDictionary.newsArticles.delete })
      )
      const dialog = screen.getByRole("alertdialog")
      await user.click(
        within(dialog).getByRole("button", {
          name: viDictionary.newsArticles.delete,
        })
      )

      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith(message)
      )
      expect(mocks.toastSuccess).not.toHaveBeenCalled()
      expect(mocks.refresh).not.toHaveBeenCalled()
      expect(
        document.querySelector(`a[href="/news-articles/${article.id}"]`)
      ).toBeInTheDocument()
    }
  )
})
