// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/editor/plate-editor", () => ({
  PlateEditor: ({ readOnly }: { readOnly?: boolean }) => (
    <div data-read-only={readOnly ? "true" : "false"}>Article content</div>
  ),
}))

import { en } from "@/app/lib/i18n/dictionaries/en"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { BlogDetailView } from "@/app/[lang]/(main)/blogs/[id]/blog-detail-view"

const blog = {
  id: 7,
  title: "Draft article",
  slug: "draft-article",
  shortDescription: "Current summary",
  content: [{ type: "p", children: [{ text: "Current body" }] }],
  contentSchemaVersion: 1,
  status: "DRAFT" as const,
  publishedAt: null,
  createdDate: "2026-09-20T00:00:00.000Z",
  lastModifiedDate: "2026-09-22T00:00:00.000Z",
}

describe("BlogDetailView", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the current lifecycle status and content without an editor write surface", () => {
    render(
      <LocalizationProvider locale="en" dictionary={en}>
        <BlogDetailView blog={blog} returnTo="/blogs?page=2&sort=title_asc" />
      </LocalizationProvider>
    )

    expect(screen.getByText(en.blogs.statuses.DRAFT)).toBeVisible()
    expect(screen.getByRole("heading", { name: blog.title })).toBeVisible()
    expect(screen.getByText(blog.shortDescription)).toBeVisible()
    expect(screen.getByText("Article content")).toBeVisible()
    expect(screen.getByText("Article content")).toHaveAttribute(
      "data-read-only",
      "true"
    )
    expect(
      screen.getByRole("link", { name: en.blogs.backToList })
    ).toHaveAttribute("href", "/en/blogs?page=2&sort=title_asc")
  })
})
