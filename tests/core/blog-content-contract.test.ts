import { describe, expect, it } from "vitest"

import { blogPostResponseSchema } from "@/app/lib/blogs/definitions"

describe("blog content contract", () => {
  it("preserves structured content and HTTPS media for published posts", () => {
    const content = [
      { type: "h1", children: [{ text: "A structured heading" }] },
      { type: "p", children: [{ text: "Readable body content." }] },
      {
        type: "img",
        url: "https://cdn.example.com/blog-image.webp",
        children: [{ text: "" }],
      },
    ]
    const post = blogPostResponseSchema.parse({
      id: 1,
      title: "Published post",
      slug: "published-post",
      shortDescription: "A summary",
      status: "PUBLISHED",
      publishedAt: "2026-09-22T08:00:00Z",
      createdDate: "2026-09-21T08:00:00Z",
      lastModifiedDate: "2026-09-22T08:00:00Z",
      contentSchemaVersion: 1,
      content,
    })

    expect(post.content).toEqual(content)
    expect(post.status).toBe("PUBLISHED")
  })
})
