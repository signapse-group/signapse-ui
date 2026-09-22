// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerPush, routerRefresh, toastSuccess } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("@/app/api/blogs/action", () => ({
  createBlog: vi.fn(),
  updateBlog: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}))

vi.mock("@/components/editor/plate-editor", () => ({
  PlateEditor: ({
    editorAriaDescribedBy,
    editorAriaInvalid,
    editorId,
    onValueChange,
  }: {
    editorAriaDescribedBy?: string
    editorAriaInvalid?: boolean
    editorId?: string
    onValueChange?: (value: unknown[]) => void
  }) => (
    <textarea
      aria-describedby={editorAriaDescribedBy}
      aria-invalid={editorAriaInvalid}
      id={editorId}
      onChange={(event) =>
        onValueChange?.([
          { type: "p", children: [{ text: event.target.value }] },
        ])
      }
    />
  ),
}))

import { createBlog, updateBlog } from "@/app/api/blogs/action"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { CreateBlogForm } from "@/app/[lang]/(main)/blogs/create/create-blog-form"
import { UpdateBlogForm } from "@/app/[lang]/(main)/blogs/[id]/update-blog-form"

function renderCreateForm() {
  return render(
    <LocalizationProvider locale="en" dictionary={en}>
      <CreateBlogForm />
    </LocalizationProvider>
  )
}

const publishedBlog = {
  id: 7,
  title: "Published article",
  slug: "published-article",
  shortDescription: "Original summary",
  content: [{ type: "p", children: [{ text: "Original body" }] }],
  contentSchemaVersion: 1,
  status: "PUBLISHED" as const,
  publishedAt: null,
  createdDate: "2026-09-19T00:00:00.000Z",
  lastModifiedDate: "2026-09-20T00:00:00.000Z",
}

describe("Blog authoring forms", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(createBlog).mockReset()
    vi.mocked(updateBlog).mockReset()
    routerPush.mockReset()
    routerRefresh.mockReset()
    toastSuccess.mockReset()
  })

  it("creates a structured draft without exposing visibility controls", async () => {
    const user = userEvent.setup()
    vi.mocked(createBlog).mockResolvedValue({
      success: true,
      data: {} as never,
    })
    renderCreateForm()

    expect(screen.getByText(en.blogs.statuses.DRAFT)).toBeVisible()
    expect(screen.queryByText(/Publicly visible/)).not.toBeInTheDocument()

    await user.type(
      screen.getByRole("textbox", { name: /Title/ }),
      "Structured draft"
    )
    await user.type(
      screen.getByRole("textbox", { name: en.blogs.contentLabel }),
      "Draft body"
    )
    await user.click(
      screen.getByRole("button", { name: en.blogs.createAction })
    )

    await waitFor(() => expect(createBlog).toHaveBeenCalledTimes(1))
    expect(createBlog).toHaveBeenCalledWith({
      title: "Structured draft",
      slug: "structured-draft",
      shortDescription: "",
      content: [{ type: "p", children: [{ text: "Draft body" }] }],
      contentSchemaVersion: 1,
    })
    expect(vi.mocked(createBlog).mock.calls[0][0]).not.toHaveProperty(
      "isVisible"
    )
    expect(routerPush).toHaveBeenCalledWith("/en/blogs")
    expect(toastSuccess).toHaveBeenCalledWith(en.blogs.createSuccess)
  })

  it("keeps entered data and exposes a retryable save error", async () => {
    const user = userEvent.setup()
    vi.mocked(createBlog).mockResolvedValue({
      success: false,
      error: "Slug already exists",
    })
    renderCreateForm()

    const title = screen.getByRole("textbox", { name: /Title/ })
    await user.type(title, "Existing article")
    await user.click(
      screen.getByRole("button", { name: en.blogs.createAction })
    )

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Slug already exists")
    )
    expect(title).toHaveValue("Existing article")
    expect(routerPush).not.toHaveBeenCalled()
  })

  it("reopens saved content and locks the slug after publication", async () => {
    const user = userEvent.setup()
    vi.mocked(updateBlog).mockResolvedValue({
      success: true,
      data: publishedBlog,
    })
    render(
      <LocalizationProvider locale="en" dictionary={en}>
        <UpdateBlogForm blog={publishedBlog} />
      </LocalizationProvider>
    )

    expect(screen.getByText(en.blogs.statuses.PUBLISHED)).toBeVisible()
    expect(screen.getByRole("textbox", { name: /Slug/ })).toBeDisabled()
    expect(
      screen.getByRole("textbox", { name: /Short description/ })
    ).toHaveValue("Original summary")

    await user.clear(screen.getByRole("textbox", { name: /Title/ }))
    await user.type(
      screen.getByRole("textbox", { name: /Title/ }),
      "Published article updated"
    )
    await user.click(
      screen.getByRole("button", { name: en.blogs.updateAction })
    )

    await waitFor(() => expect(updateBlog).toHaveBeenCalledTimes(1))
    expect(updateBlog).toHaveBeenCalledWith(7, {
      title: "Published article updated",
      slug: "published-article",
      shortDescription: "Original summary",
      content: publishedBlog.content,
      contentSchemaVersion: 1,
    })
  })
})
