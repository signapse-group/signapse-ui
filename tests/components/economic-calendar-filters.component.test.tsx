// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  pathname: "/vi/economic-calendar",
  search: "",
  replace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { EconomicCalendarFilters } from "@/app/[lang]/(main)/economic-calendar/economic-calendar-filters"

function renderFilters() {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <EconomicCalendarFilters currencyCodes={["USD", "JPY"]} />
    </LocalizationProvider>
  )
}

function navigatedParams() {
  const href = mocks.replace.mock.calls.at(-1)?.[0] as string
  return new URLSearchParams(href.split("?")[1] ?? "")
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.search = ""
  mocks.replace.mockImplementation((href: string) => {
    mocks.search = href.split("?")[1] ?? ""
  })
  if (!window.PointerEvent) {
    Object.defineProperty(window, "PointerEvent", { value: MouseEvent })
  }
})

afterEach(cleanup)

describe("EconomicCalendarFilters", () => {
  it("lets a user remove only currency and keeps title, date, sort, and impact", async () => {
    const user = userEvent.setup()
    mocks.search =
      "date=2026-11-21&title%5BcontainsIgnoreCase%5D=inflation&sort=scheduledAt_desc&currencyCode%5Beq%5D=USD&impact%5Beq%5D=HIGH"
    renderFilters()

    const toggle = screen.getByRole("button", { name: "Bộ lọc (2)" })
    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("heading", { name: "Bộ lọc" })).toBeInTheDocument()

    await user.click(screen.getByRole("combobox", { name: "Tiền tệ" }))
    await user.click(
      await screen.findByRole("option", { name: "Tất cả tiền tệ" })
    )
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled())

    const next = navigatedParams()
    expect(next.get("currencyCode[eq]")).toBeNull()
    expect(next.get("impact[eq]")).toBe("HIGH")
    expect(next.get("title[containsIgnoreCase]")).toBe("inflation")
    expect(next.get("date")).toBe("2026-11-21")
    expect(next.get("sort")).toBe("scheduledAt_desc")
  })

  it("applies both filters through the documented URL keys and preserves other conditions", async () => {
    const user = userEvent.setup()
    mocks.search =
      "date=2026-11-21&title%5BcontainsIgnoreCase%5D=inflation&sort=scheduledAt_desc"
    const view = renderFilters()

    await user.click(screen.getByRole("button", { name: "Bộ lọc (0)" }))
    await user.click(screen.getByRole("combobox", { name: "Tiền tệ" }))
    await user.click(await screen.findByRole("option", { name: "USD" }))
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(1))

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <EconomicCalendarFilters currencyCodes={["USD", "JPY"]} />
      </LocalizationProvider>
    )
    await user.click(screen.getByRole("combobox", { name: "Mức độ tác động" }))
    await user.click(await screen.findByRole("option", { name: "CAO" }))
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(2))

    const next = navigatedParams()
    expect(next.get("currencyCode[eq]")).toBe("USD")
    expect(next.get("impact[eq]")).toBe("HIGH")
    expect(next.get("title[containsIgnoreCase]")).toBe("inflation")
    expect(next.get("date")).toBe("2026-11-21")
    expect(next.get("sort")).toBe("scheduledAt_desc")
  })

  it("clears only currency and impact from the mobile panel", async () => {
    const user = userEvent.setup()
    mocks.search =
      "date=2026-11-21&title%5BcontainsIgnoreCase%5D=inflation&sort=scheduledAt_desc&currencyCode%5Beq%5D=USD&impact%5Beq%5D=HIGH"
    renderFilters()

    await user.click(screen.getByRole("button", { name: "Bộ lọc (2)" }))
    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }))
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled())

    const next = navigatedParams()
    expect(next.get("currencyCode[eq]")).toBeNull()
    expect(next.get("impact[eq]")).toBeNull()
    expect(next.get("title[containsIgnoreCase]")).toBe("inflation")
    expect(next.get("date")).toBe("2026-11-21")
    expect(next.get("sort")).toBe("scheduledAt_desc")
  })
})
