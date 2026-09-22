import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    blogs: {
      invalidContent: "Blog data is invalid",
      createError: "Blog create failed",
      updateError: "Blog update failed",
      deleteError: "Blog delete failed",
      permissionError: "Blog permission denied",
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import { createBlog, deleteBlog, updateBlog } from "@/app/api/blogs/action"
import type { CreateBlogPostRequest } from "@/app/lib/blogs/definitions"

const content = [
  {
    type: "p",
    children: [{ text: "Draft content" }],
  },
  {
    type: "img",
    url: "https://cdn.example.com/article.png",
    children: [{ text: "" }],
  },
]

const request: CreateBlogPostRequest = {
  title: "Draft article",
  slug: "draft-article",
  shortDescription: "A short description",
  content,
  contentSchemaVersion: 1,
}

const response = {
  id: 4,
  title: request.title,
  slug: request.slug,
  shortDescription: request.shortDescription,
  content,
  contentSchemaVersion: 1,
  status: "DRAFT" as const,
  publishedAt: null,
  createdDate: "2026-09-22T00:00:00.000Z",
  lastModifiedDate: "2026-09-22T00:00:00.000Z",
}

describe("Blog authoring actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
  })

  it("sends the structured draft contract without legacy visibility fields", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(response)

    await expect(createBlog(request)).resolves.toEqual({
      success: true,
      data: response,
    })

    expect(fetchAuthenticated).toHaveBeenCalledWith("/blogs", {
      method: "POST",
      body: JSON.stringify(request),
    })

    const sentRequest = JSON.parse(
      vi.mocked(fetchAuthenticated).mock.calls[0][1]?.body as string
    ) as Record<string, unknown>
    expect(sentRequest).not.toHaveProperty("isVisible")
    expect(sentRequest.content).toEqual(content)
    expect(sentRequest.contentSchemaVersion).toBe(1)
  })

  it("rejects unsafe content and unknown legacy fields before transport", async () => {
    await expect(
      createBlog({
        ...request,
        content: [
          {
            type: "img",
            url: "javascript:alert(1)",
            children: [{ text: "" }],
          },
        ],
      })
    ).resolves.toEqual({
      success: false,
      error: testDictionary.blogs.invalidContent,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()

    await expect(
      createBlog({ ...request, isVisible: true } as never)
    ).resolves.toEqual({
      success: false,
      error: testDictionary.blogs.invalidContent,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()

    await expect(
      updateBlog(4, {
        title: request.title,
        content,
      } as never)
    ).resolves.toEqual({
      success: false,
      error: testDictionary.blogs.invalidContent,
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("keeps backend save failures visible for retryable update and delete flows", async () => {
    const duplicateSlugError = Object.assign(new Error("Slug already exists"), {
      status: 409,
    })
    vi.mocked(fetchAuthenticated).mockRejectedValue(duplicateSlugError)

    await expect(
      updateBlog(4, {
        title: request.title,
        slug: request.slug,
        shortDescription: request.shortDescription,
        content,
        contentSchemaVersion: 1,
      })
    ).resolves.toEqual({
      success: false,
      error: "Slug already exists",
    })

    await expect(deleteBlog(4)).resolves.toEqual({
      success: false,
      error: "Slug already exists",
    })
  })

  it("localizes transport and permission fallbacks", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValueOnce(
      new Error("network details")
    )
    await expect(createBlog(request)).resolves.toEqual({
      success: false,
      error: testDictionary.blogs.createError,
    })

    vi.mocked(fetchAuthenticated).mockRejectedValueOnce(
      Object.assign(new Error("forbidden"), { status: 403 })
    )
    await expect(
      updateBlog(4, { content, contentSchemaVersion: 1 })
    ).resolves.toEqual({
      success: false,
      error: testDictionary.blogs.permissionError,
    })
  })
})
