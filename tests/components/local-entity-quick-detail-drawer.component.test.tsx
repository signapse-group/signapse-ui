// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  cloneElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react"

const { getEventById, getNewsArticleById, useHasAnyPermission } = vi.hoisted(
  () => ({
    getEventById: vi.fn(),
    getNewsArticleById: vi.fn(),
    useHasAnyPermission: vi.fn(() => true),
  })
)

vi.mock("@/app/api/events/action", () => ({
  getEventById,
}))

vi.mock("@/app/api/news-articles/action", () => ({
  getNewsArticleById,
}))

vi.mock("@/components/permission-provider", () => ({
  useHasAnyPermission,
}))

vi.mock("@/components/ui/drawer", () => ({
  DrawerHeader: ({ children }: { children: ReactNode }) => (
    <header>{children}</header>
  ),
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("@/components/ui/drawer-content-in-overlay", () => ({
  DrawerInOverlay: ({
    open,
    children,
  }: {
    open?: boolean
    children: ReactNode
  }) => (open ? <div role="dialog">{children}</div> : null),
  DrawerContentInOverlay: ({
    children,
    "data-quick-detail-placement": placement,
    "data-quick-detail-profile": profile,
  }: {
    children: ReactNode
    "data-quick-detail-placement"?: string
    "data-quick-detail-profile"?: string
  }) => (
    <div
      data-quick-detail-placement={placement}
      data-quick-detail-profile={profile}
    >
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    render,
  }: {
    children: ReactNode
    render?: ReactElement
  }) => (render ? cloneElement(render, {}, children) : <span>{children}</span>),
}))

vi.mock("next/image", () => ({
  default: (props: ComponentProps<"img">) => (
    <img {...props} alt={props.alt ?? ""} />
  ),
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { NewsArticleResponse } from "@/app/lib/news-articles/definitions"

import { LocalEntityQuickDetailDrawer } from "@/app/[lang]/(main)/local-entity-quick-detail-drawer"

const article: NewsArticleResponse = {
  id: 42,
  title: "Bài viết mẫu",
  description: "Tóm tắt bài viết.",
  url: "https://example.com/articles/42",
  sourceName: "Reuters",
  publishedAt: "2026-08-19T12:30:00.000Z",
  status: "INGESTED",
  createdDate: "2026-08-19T12:00:00.000Z",
  content: "# Nội dung\n\nMột đoạn Markdown.",
  featureImage: {
    id: 7,
    name: "article-image.jpg",
    altText: "Ảnh minh họa bài viết",
    urlOriginal: "/images/article-original.jpg",
    urlMedium: "/images/article-medium.jpg",
  },
  linkedEvents: [
    {
      eventId: 9,
      eventTitle: "Sự kiện liên quan không hiển thị",
    },
  ],
}

function renderDrawer(selectedArticle: NewsArticleResponse = article) {
  getNewsArticleById.mockResolvedValueOnce(selectedArticle)

  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <LocalEntityQuickDetailDrawer
        entity={{ id: selectedArticle.id, kind: "news-article" }}
        onClose={vi.fn()}
        owner="dashboard"
      />
    </LocalizationProvider>
  )
}

describe("LocalEntityQuickDetailDrawer news article reading surface", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    useHasAnyPermission.mockImplementation(() => true)
  })

  it("renders the current reader hierarchy without linked-event content", async () => {
    renderDrawer()

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: article.title ?? "",
        })
      ).toBeInTheDocument()
    })

    const heading = screen.getByRole("heading", {
      level: 2,
      name: article.title ?? "",
    })
    expect(heading.closest("header")).not.toBeNull()
    expect(heading.closest("header")?.querySelector("p")).toBeNull()

    expect(screen.getByText(article.description!)).toBeInTheDocument()
    expect(screen.getByText(article.sourceName!)).toBeInTheDocument()
    expect(useHasAnyPermission).toHaveBeenCalledWith(["news-article:read"])
    expect(
      screen.getByRole("link", {
        name: viDictionary.newsArticles.openOriginalLink,
      })
    ).toHaveAttribute("href", article.url)
    expect(
      screen.getByRole("img", { name: article.featureImage!.altText! })
    ).toHaveClass("max-w-full")
    expect(
      screen.getByRole("heading", { level: 2, name: "Nội dung" })
    ).toBeInTheDocument()
    expect(
      screen.queryByText("Sự kiện liên quan không hiển thị")
    ).not.toBeInTheDocument()
  })

  it("omits the original-source action and media when optional values are absent", async () => {
    const articleWithoutOptionalRegions: NewsArticleResponse = {
      ...article,
      id: 43,
      title: "Bài viết không có URL",
      description: null,
      url: "",
      featureImage: null,
      sourceName: undefined,
    }

    renderDrawer(articleWithoutOptionalRegions)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: articleWithoutOptionalRegions.title ?? "",
        })
      ).toBeInTheDocument()
    })

    expect(
      screen.queryByRole("link", {
        name: viDictionary.newsArticles.openOriginalLink,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(viDictionary.newsArticles.noOutlet)
    ).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(
      screen.queryByText("Sự kiện liên quan không hiển thị")
    ).not.toBeInTheDocument()
  })

  it("keeps the canonical action during transient errors and retries the snapshot", async () => {
    const backendError = new Error("internal Article service detail")
    getNewsArticleById
      .mockRejectedValueOnce(backendError)
      .mockResolvedValueOnce({
        ...article,
        title: "Bài viết sau khi thử lại",
      })

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: article.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
    expect(
      screen.getByText(viDictionary.quickDetail.errorDescription)
    ).toBeInTheDocument()
    expect(screen.queryByText(backendError.message)).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: viDictionary.common.openFullPage })
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: viDictionary.common.retry })
    )

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: /Bài viết sau khi thử lại/,
        })
      ).toBeInTheDocument()
    })
    expect(getNewsArticleById).toHaveBeenCalledTimes(2)
  })

  it("does not show a previous snapshot while another entity opens", async () => {
    const nextArticle: NewsArticleResponse = {
      ...article,
      id: 43,
      title: "Bài viết thứ hai",
    }
    let resolveNextArticle: ((value: NewsArticleResponse) => void) | undefined

    getNewsArticleById.mockResolvedValueOnce(article).mockImplementationOnce(
      () =>
        new Promise<NewsArticleResponse>((resolve) => {
          resolveNextArticle = resolve
        })
    )

    const view = render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: article.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: new RegExp(article.title ?? "") })
      ).toBeInTheDocument()
    })

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: nextArticle.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText(viDictionary.common.loading, { selector: "span" })
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("heading", { name: new RegExp(article.title ?? "") })
    ).not.toBeInTheDocument()

    resolveNextArticle?.(nextArticle)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: new RegExp(nextArticle.title ?? ""),
        })
      ).toBeInTheDocument()
    })
  })

  it("ignores a response that arrives after the selected Article changes", async () => {
    const nextArticle: NewsArticleResponse = {
      ...article,
      id: 43,
      title: "Bài viết thứ hai",
      content: "Nội dung của bài thứ hai.",
    }
    let resolveFirstArticle: ((value: NewsArticleResponse) => void) | undefined

    getNewsArticleById
      .mockImplementationOnce(
        () =>
          new Promise<NewsArticleResponse>((resolve) => {
            resolveFirstArticle = resolve
          })
      )
      .mockResolvedValueOnce(nextArticle)

    const view = render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: article.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(getNewsArticleById).toHaveBeenCalledTimes(1)
    })

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: nextArticle.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Nội dung của bài thứ hai.")).toBeInTheDocument()
    })
    resolveFirstArticle?.(article)

    await waitFor(() => {
      expect(screen.getByText("Nội dung của bài thứ hai.")).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("heading", { name: "Nội dung" })
    ).not.toBeInTheDocument()
    expect(screen.getByText("Nội dung của bài thứ hai.")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: viDictionary.common.openFullPage })
    ).toHaveAttribute("href", `/vi/news-articles/${nextArticle.id}`)
  })

  it("omits recovery and canonical actions for missing content", async () => {
    const error = Object.assign(new Error("missing"), { status: 404 })
    getNewsArticleById.mockRejectedValueOnce(error)

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: article.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: /Không tìm thấy chi tiết/,
        })
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("button", { name: viDictionary.common.retry })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: viDictionary.common.openFullPage })
    ).not.toBeInTheDocument()
  })

  it("renders access denial without a retry or canonical action", async () => {
    useHasAnyPermission.mockReturnValue(false)

    renderDrawer()

    await waitFor(() => {
      expect(
        screen.getByText(viDictionary.newsArticles.detailDenied, {
          exact: false,
        })
      ).toBeInTheDocument()
    })
    expect(getNewsArticleById).not.toHaveBeenCalled()
    expect(
      screen.queryByRole("button", { name: viDictionary.common.retry })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: viDictionary.common.openFullPage })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", {
        name: viDictionary.newsArticles.openOriginalLink,
      })
    ).not.toBeInTheDocument()
  })

  it("reads an Article with article-read without requiring outlet-read", async () => {
    useHasAnyPermission.mockReturnValueOnce(false).mockReturnValueOnce(true)

    renderDrawer()

    await waitFor(() => {
      expect(screen.getByText("Reuters")).toBeInTheDocument()
    })
    expect(useHasAnyPermission).toHaveBeenNthCalledWith(2, [
      "news-article:read",
    ])
    expect(
      screen.getByRole("link", {
        name: viDictionary.newsArticles.openOriginalLink,
      })
    ).toHaveAttribute("href", article.url)
  })

  it("does not expose Article data or actions after the API denies access", async () => {
    const forbidden = Object.assign(new Error("Forbidden"), { status: 403 })
    getNewsArticleById.mockRejectedValueOnce(forbidden)

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <LocalEntityQuickDetailDrawer
          entity={{ id: article.id, kind: "news-article" }}
          onClose={vi.fn()}
          owner="dashboard"
        />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText(viDictionary.newsArticles.detailDenied, {
          exact: false,
        })
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(article.sourceName!)).not.toBeInTheDocument()
    expect(screen.queryByText(article.content!)).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: viDictionary.common.openFullPage })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", {
        name: viDictionary.newsArticles.openOriginalLink,
      })
    ).not.toBeInTheDocument()
  })

  it("keeps the full localized body, snapshot, and actions across placements", async () => {
    const originalWidth = window.innerWidth
    const longBody = [
      "    indented code remains a code block",
      "",
      ...Array.from({ length: 80 }, (_, index) => `Paragraph ${index + 1}.`),
      "",
      "| A very wide header | Another long header for horizontal scrolling |",
      "| --- | --- |",
      "| Source value | A long value stays inside the table surface |",
      "",
      "Final paragraph remains available.",
    ].join("\n")
    const longArticle: NewsArticleResponse = {
      ...article,
      content: longBody,
      status: "DERIVATION_FAILED",
    }

    try {
      for (const [width, expectedPlacement] of [
        [1600, "right"],
        [1024, "bottom"],
        [390, "bottom"],
      ] as const) {
        Object.defineProperty(window, "innerWidth", {
          configurable: true,
          value: width,
        })
        const view = renderDrawer(longArticle)
        const overlay = screen
          .getByRole("dialog")
          .querySelector("[data-quick-detail-placement]")

        await waitFor(() => {
          expect(
            screen.getByText("Final paragraph remains available.")
          ).toBeInTheDocument()
        })

        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(overlay).toHaveAttribute(
          "data-quick-detail-placement",
          expectedPlacement
        )
        expect(overlay).toHaveAttribute(
          "data-quick-detail-profile",
          "news-article"
        )
        expect(
          screen.getByRole("link", {
            name: viDictionary.newsArticles.openOriginalLink,
          })
        ).toHaveAttribute("href", article.url)
        expect(
          screen.getByRole("link", { name: viDictionary.common.openFullPage })
        ).toHaveAttribute("href", `/vi/news-articles/${article.id}`)
        expect(screen.getByText("Reuters")).toBeInTheDocument()
        expect(
          screen.getByText("Paragraph 80.", { exact: false })
        ).toBeInTheDocument()
        expect(
          screen.getByText(/indented code remains a code block/).closest("pre")
        ).not.toBeNull()
        expect(
          document.querySelector(".typeset-scroll table")
        ).toBeInTheDocument()
        expect(
          screen.queryByText(viDictionary.newsArticles.contentProcessingFailed)
        ).not.toBeInTheDocument()
        view.unmount()
        cleanup()
      }
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: originalWidth,
      })
    }
  })

  it("reports missing localized content without guessing its cause", async () => {
    const missingContent: NewsArticleResponse = {
      ...article,
      title: null,
      description: null,
      publishedAt: null,
      featureImage: null,
      content: null,
      status: "DERIVATION_FAILED",
      url: undefined,
      sourceName: "Reuters",
    }

    renderDrawer(missingContent)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: viDictionary.newsArticles.titleUnavailable,
        })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText(viDictionary.newsArticles.contentUnavailable)
    ).toHaveAttribute("role", "status")
    expect(
      screen.getByText(viDictionary.newsArticles.sourceUrlUnavailable)
    ).toHaveAttribute("role", "status")
    expect(screen.getByText("Reuters")).toBeInTheDocument()
    expect(
      screen.queryByText(viDictionary.newsArticles.contentProcessingFailed)
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(viDictionary.common.notAvailable)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", {
        name: viDictionary.newsArticles.openOriginalLink,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: viDictionary.common.openFullPage })
    ).toHaveAttribute("href", `/vi/news-articles/${article.id}`)
  })

  it("uses the producer's content-failure signal and keeps any supplied body", async () => {
    const failedContent: NewsArticleResponse = {
      ...article,
      content: "# Available part\n\nThis content remains readable.",
      status: "CONTENT_FAILED",
    }

    renderDrawer(failedContent)

    await waitFor(() => {
      expect(
        screen.getByText(viDictionary.newsArticles.contentProcessingFailed)
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole("heading", { name: "Available part" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("This content remains readable.")
    ).toBeInTheDocument()
  })

  it("explains missing content only when the producer signals CONTENT_FAILED", async () => {
    const failedWithoutBody: NewsArticleResponse = {
      ...article,
      content: null,
      status: "CONTENT_FAILED",
    }

    renderDrawer(failedWithoutBody)

    await waitFor(() => {
      expect(
        screen.getByText(viDictionary.newsArticles.contentProcessingFailed)
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText(viDictionary.newsArticles.contentUnavailable)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Nội dung" })
    ).not.toBeInTheDocument()
  })
})
