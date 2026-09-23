// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerRefresh } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}))

vi.mock("@/app/api/blogs/action", () => ({
  publishBlog: vi.fn(),
  unpublishBlog: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import {
  publishBlog,
  unpublishBlog,
} from "@/app/api/blogs/action"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { BlogPublicationControl } from "@/app/[lang]/(main)/blogs/blog-publication-control"
import { toast } from "sonner"

function renderControl(status: "DRAFT" | "PUBLISHED") {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <BlogPublicationControl id={42} status={status} compact={false} />
    </LocalizationProvider>
  )
}

describe("BlogPublicationControl", () => {
  beforeEach(() => {
    routerRefresh.mockReset()
    vi.mocked(publishBlog).mockReset()
    vi.mocked(unpublishBlog).mockReset()
    vi.mocked(publishBlog).mockResolvedValue({
      success: true,
      data: {} as never,
    })
    vi.mocked(unpublishBlog).mockResolvedValue({
      success: true,
      data: {} as never,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("confirms and publishes a draft, then refreshes the actual state", async () => {
    const user = userEvent.setup()
    renderControl("DRAFT")

    await user.click(screen.getByRole("button", { name: viDictionary.blogs.publish }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent(viDictionary.blogs.publishDescription)

    await user.click(
      within(dialog).getByRole("button", { name: viDictionary.blogs.publish })
    )

    await vi.waitFor(() => {
      expect(publishBlog).toHaveBeenCalledWith(42)
      expect(routerRefresh).toHaveBeenCalledTimes(1)
      expect(toast.success).toHaveBeenCalledWith(
        viDictionary.blogs.published
      )
    })
    expect(unpublishBlog).not.toHaveBeenCalled()
  })

  it("cancels without sending a request", async () => {
    const user = userEvent.setup()
    renderControl("DRAFT")

    await user.click(screen.getByRole("button", { name: viDictionary.blogs.publish }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(
      within(dialog).getByRole("button", { name: viDictionary.common.cancel })
    )

    expect(publishBlog).not.toHaveBeenCalled()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("unpublishes a published post using the matching action", async () => {
    const user = userEvent.setup()
    renderControl("PUBLISHED")

    await user.click(
      screen.getByRole("button", { name: viDictionary.blogs.unpublish })
    )
    const dialog = await screen.findByRole("alertdialog")
    await user.click(
      within(dialog).getByRole("button", { name: viDictionary.blogs.unpublish })
    )

    await vi.waitFor(() => {
      expect(unpublishBlog).toHaveBeenCalledWith(42)
      expect(publishBlog).not.toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith(
        viDictionary.blogs.unpublished
      )
    })
  })

  it("keeps controls pending and surfaces failures without success feedback", async () => {
    let resolveAction: (value: never) => void = () => undefined
    vi.mocked(publishBlog).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve
      })
    )

    const user = userEvent.setup()
    renderControl("DRAFT")
    await user.click(screen.getByRole("button", { name: viDictionary.blogs.publish }))
    const dialog = await screen.findByRole("alertdialog")
    const confirm = within(dialog).getByRole("button", {
      name: viDictionary.blogs.publish,
    })
    await user.click(confirm)

    expect(confirm).toBeDisabled()
    expect(
      within(dialog).getByRole("button", {
        name: viDictionary.blogs.publishPending,
      })
    ).toBeDisabled()

    resolveAction({
      success: false,
      error: viDictionary.blogs.publicationConflictError,
    } as never)

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        viDictionary.blogs.publicationConflictError
      )
      expect(toast.success).not.toHaveBeenCalled()
      expect(routerRefresh).toHaveBeenCalledTimes(1)
    })
  })
})
