import { describe, expect, it } from "vitest"

import {
  blogPostResponseSchema,
  filterPublishedBlogPage,
  isPublishedBlogPost,
  type BlogPostListResponse,
} from "@/app/lib/blogs/definitions"
import type { Page } from "@/app/lib/definitions"
import { isPublicLandingPathname } from "@/app/lib/public-landing/public-path"

const publishedArticle: BlogPostListResponse = {
  id: 1,
  title: "Published article",
  slug: "published-article",
  shortDescription: "A public summary",
  status: "PUBLISHED",
  publishedAt: "2026-09-22T08:00:00Z",
  createdDate: "2026-09-21T08:00:00Z",
  lastModifiedDate: "2026-09-22T08:00:00Z",
}

const draftArticle: BlogPostListResponse = {
  ...publishedArticle,
  id: 2,
  title: "Draft article",
  slug: "draft-article",
  status: "DRAFT",
}

describe("public Articles contract", () => {
  it("allows only locale Articles paths through the public boundary", () => {
    expect(isPublicLandingPathname("/en/articles")).toBe(true)
    expect(isPublicLandingPathname("/vi/articles/published-article")).toBe(true)
    expect(isPublicLandingPathname("/en/dashboard")).toBe(false)
    expect(isPublicLandingPathname("/articles")).toBe(false)
  })

  it("keeps only published posts in the public list", () => {
    const page: Page<BlogPostListResponse> = {
      content: [draftArticle, publishedArticle],
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: true,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      numberOfElements: 2,
      empty: false,
    }

    expect(isPublishedBlogPost(publishedArticle)).toBe(true)
    expect(isPublishedBlogPost(draftArticle)).toBe(false)
    expect(filterPublishedBlogPage(page).content).toEqual([publishedArticle])
  })

  it("accepts structured published content with an image URL", () => {
    const article = blogPostResponseSchema.parse({
      ...publishedArticle,
      contentSchemaVersion: 1,
      content: [
        {
          type: "h1",
          children: [{ text: "A structured heading" }],
        },
        {
          type: "p",
          children: [{ text: "Readable body content." }],
        },
        {
          type: "img",
          url: "https://cdn.example.com/articles/public-image.webp",
          children: [{ text: "" }],
        },
      ],
    })

    expect(article.status).toBe("PUBLISHED")
    expect(article.content).toHaveLength(3)
  })
})
