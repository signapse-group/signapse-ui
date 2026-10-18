// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  searchParams: new URLSearchParams(
    "page=2&size=20&search=macro&sort=occurredAt_desc"
  ),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/events",
  useRouter: () => ({ push: mocks.routerPush, replace: mocks.routerReplace }),
  useSearchParams: () => mocks.searchParams,
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import { DOTS, getPaginationRange } from "@/components/app-pagination-utils"

const page = {
  number: 1,
  numberOfElements: 20,
  size: 20,
  totalElements: 55,
  totalPages: 3,
}

function renderPagination(pageData = page) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <AppPaginationControls page={pageData} />
    </LocalizationProvider>
  )
}

describe("AppPaginationControls", () => {
  afterEach(() => {
    cleanup()
    mocks.routerPush.mockReset()
    mocks.routerReplace.mockReset()
    mocks.searchParams = new URLSearchParams(
      "page=2&size=20&search=macro&sort=occurredAt_desc"
    )
  })

  it("renders the current page, footer selector, and preserves context when navigating", async () => {
    const user = userEvent.setup()
    renderPagination()

    expect(screen.getByText("Hiển thị 21-40 trên 55 kết quả")).toBeVisible()
    expect(
      screen.getByRole("combobox", {
        name: viDictionary.pagination.pageSize,
      })
    ).toHaveTextContent("20")

    const navigation = screen.getByRole("navigation", {
      name: viDictionary.pagination.navigationLabel,
    })
    expect(
      within(navigation).getByRole("button", {
        name: "Đi tới trang 2",
      })
    ).toHaveAttribute("aria-current", "page")

    await user.click(
      within(navigation).getByRole("button", {
        name: viDictionary.pagination.goToNext,
      })
    )

    await vi.waitFor(() =>
      expect(mocks.routerPush).toHaveBeenCalledWith(
        "/vi/events?page=3&size=20&search=macro&sort=occurredAt_desc"
      )
    )
  })

  it("uses push and resets page when changing the page size", async () => {
    const user = userEvent.setup()
    renderPagination()

    await user.click(
      screen.getByRole("combobox", { name: viDictionary.pagination.pageSize })
    )
    await user.click(await screen.findByRole("option", { name: /50/ }))

    await vi.waitFor(() =>
      expect(mocks.routerPush).toHaveBeenCalledWith(
        "/vi/events?page=1&size=50&search=macro&sort=occurredAt_desc"
      )
    )
  })

  it("replaces invalid URL pagination while preserving other query state", async () => {
    mocks.searchParams = new URLSearchParams(
      "page=4&size=25&search=macro&sort=occurredAt_desc"
    )
    renderPagination({
      number: 0,
      numberOfElements: 10,
      size: 10,
      totalElements: 55,
      totalPages: 6,
    })

    await vi.waitFor(() =>
      expect(mocks.routerReplace).toHaveBeenCalledWith(
        "/vi/events?page=1&size=10&search=macro&sort=occurredAt_desc"
      )
    )
  })

  it("replaces a page confirmed to be beyond the result range", async () => {
    mocks.searchParams = new URLSearchParams(
      "page=8&size=10&status=REVIEWED&sort=occurredAt_desc"
    )
    renderPagination({
      number: 7,
      numberOfElements: 0,
      size: 10,
      totalElements: 35,
      totalPages: 4,
    })

    await vi.waitFor(() =>
      expect(mocks.routerReplace).toHaveBeenCalledWith(
        "/vi/events?page=4&size=10&status=REVIEWED&sort=occurredAt_desc"
      )
    )
  })

  it("shows a disabled one-page navigation but only the selector for no results", () => {
    const { rerender } = renderPagination({
      number: 0,
      numberOfElements: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    })

    const navigation = screen.getByRole("navigation", {
      name: viDictionary.pagination.navigationLabel,
    })
    expect(
      within(navigation).getByRole("button", { name: "Đi tới trang 1" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(navigation).getByRole("button", {
        name: viDictionary.pagination.goToPrevious,
      })
    ).toBeDisabled()
    expect(
      within(navigation).getByRole("button", {
        name: viDictionary.pagination.goToNext,
      })
    ).toBeDisabled()

    rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <AppPaginationControls
          page={{
            number: 0,
            numberOfElements: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0,
          }}
        />
      </LocalizationProvider>
    )

    expect(
      screen.getByRole("combobox", { name: viDictionary.pagination.pageSize })
    ).toBeVisible()
    expect(screen.getByText(viDictionary.pagination.noResults)).toBeVisible()
    expect(
      screen.queryByRole("navigation", {
        name: viDictionary.pagination.navigationLabel,
      })
    ).not.toBeInTheDocument()
  })
})

describe("pagination number windows", () => {
  it("keeps the 134-page boundary windows within seven positions", () => {
    expect(getPaginationRange({ currentPage: 1, totalPageCount: 134 })).toEqual(
      [1, 2, 3, 4, DOTS, 134]
    )
    expect(
      getPaginationRange({ currentPage: 67, totalPageCount: 134 })
    ).toEqual([1, DOTS, 66, 67, 68, DOTS, 134])
    expect(
      getPaginationRange({ currentPage: 134, totalPageCount: 134 })
    ).toEqual([1, DOTS, 131, 132, 133, 134])
    expect(getPaginationRange({ currentPage: 4, totalPageCount: 7 })).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ])
  })
})
