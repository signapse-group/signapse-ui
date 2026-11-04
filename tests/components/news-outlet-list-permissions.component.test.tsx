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
  deleteNewsOutlet: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toggleNewsOutletActive: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))
vi.mock("@/app/api/news-outlets/action", () => ({
  deleteNewsOutlet: mocks.deleteNewsOutlet,
  toggleNewsOutletActive: mocks.toggleNewsOutletActive,
}))
vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("@/components/sort-select", () => ({
  SortSelect: () => <select aria-label="Sort outlets" />,
}))
vi.mock("@/components/app-pagination-controls", () => ({
  AppPaginationControls: () => null,
}))
vi.mock("@/app/[lang]/(main)/news-outlets/news-outlet-search", () => ({
  NewsOutletSearch: () => <input aria-label="Search outlets" />,
}))

import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import type { Page } from "@/app/lib/definitions"
import {
  NEWS_OUTLET_CREATE_PERMISSION,
  NEWS_OUTLET_DELETE_PERMISSION,
  NEWS_OUTLET_READ_PERMISSION,
  NEWS_OUTLET_UPDATE_PERMISSION,
} from "@/app/lib/news-outlets/permissions"
import { PermissionProvider } from "@/components/permission-provider"
import { NewsOutletListPage } from "@/app/[lang]/(main)/news-outlets/news-outlet-list"

const outlet = {
  id: 7,
  name: "Example outlet",
  homepageUrl: "ftp://example.com",
  rssUrl: "javascript:alert(1)",
  active: true,
  createdDate: "2026-11-04T12:00:00Z",
}

const outletPage: Page<typeof outlet> = {
  content: [outlet],
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
        <NewsOutletListPage newsOutletPage={outletPage} />
      </PermissionProvider>
    </LocalizationProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  if (!window.PointerEvent) {
    Object.defineProperty(window, "PointerEvent", { value: MouseEvent })
  }
  mocks.toggleNewsOutletActive.mockResolvedValue({
    success: false,
    error: "Bạn không có quyền cập nhật nguồn tin.",
  })
  mocks.deleteNewsOutlet.mockResolvedValue({
    success: false,
    error: "Bạn không có quyền xóa nguồn tin.",
  })
})

afterEach(cleanup)

describe("News Outlet list permissions", () => {
  it("keeps detail readable without update and hides create, edit, and delete actions without their permissions", () => {
    renderList([NEWS_OUTLET_READ_PERMISSION])

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: viDictionary.newsOutlets.listTitle,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: outlet.name })).toHaveAttribute(
      "href",
      `/news-outlets/${outlet.id}`
    )
    expect(
      screen.queryByRole("link", {
        name: viDictionary.newsOutlets.createAction,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: viDictionary.newsOutlets.edit })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: viDictionary.newsOutlets.delete })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("switch")).toHaveAttribute("aria-disabled", "true")

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
    expect(hrefs).not.toContain(outlet.homepageUrl)
    expect(hrefs).not.toContain(outlet.rssUrl)
  })

  it("applies create and update controls independently from delete", () => {
    renderList([
      NEWS_OUTLET_READ_PERMISSION,
      NEWS_OUTLET_CREATE_PERMISSION,
      NEWS_OUTLET_UPDATE_PERMISSION,
    ])

    expect(
      screen.getByRole("link", { name: viDictionary.newsOutlets.createAction })
    ).toHaveAttribute("href", "/news-outlets/create")
    expect(
      screen.getByRole("link", { name: viDictionary.newsOutlets.edit })
    ).toHaveAttribute("href", `/news-outlets/${outlet.id}`)
    expect(screen.getByRole("switch")).toBeEnabled()
    expect(
      screen.queryByRole("button", { name: viDictionary.newsOutlets.delete })
    ).not.toBeInTheDocument()
  })

  it("keeps the active state when the update action returns HTTP 403", async () => {
    const user = userEvent.setup()
    renderList([NEWS_OUTLET_READ_PERMISSION, NEWS_OUTLET_UPDATE_PERMISSION])

    await user.click(screen.getByRole("switch"))

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Bạn không có quyền cập nhật nguồn tin."
      )
    )
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
    expect(
      screen.getByText(viDictionary.newsOutlets.enabled)
    ).toBeInTheDocument()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it("shows delete only when delete permission is present", () => {
    renderList([NEWS_OUTLET_READ_PERMISSION, NEWS_OUTLET_DELETE_PERMISSION])

    expect(
      screen.getByRole("button", { name: viDictionary.newsOutlets.delete })
    ).toBeInTheDocument()
    expect(screen.getByRole("switch")).toHaveAttribute("aria-disabled", "true")
    expect(
      screen.queryByRole("link", { name: viDictionary.newsOutlets.edit })
    ).not.toBeInTheDocument()
  })

  it("keeps the destructive confirmation open after a delete 403", async () => {
    const user = userEvent.setup()
    renderList([NEWS_OUTLET_READ_PERMISSION, NEWS_OUTLET_DELETE_PERMISSION])

    await user.click(
      screen.getByRole("button", { name: viDictionary.newsOutlets.delete })
    )

    const dialog = screen.getByRole("alertdialog")
    expect(
      within(dialog).getByRole("heading", {
        name: viDictionary.newsOutlets.deleteTitle.replace(
          "{name}",
          outlet.name
        ),
      })
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        viDictionary.newsOutlets.deleteDescription.replaceAll(
          "{name}",
          outlet.name
        )
      )
    ).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.newsOutlets.delete,
      })
    )

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Bạn không có quyền xóa nguồn tin."
      )
    )
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })
})
