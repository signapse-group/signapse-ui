// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ComponentProps } from "react"

const mocks = vi.hoisted(() => ({
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/economic-calendar",
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}))
vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("@/components/sort-select", () => ({ SortSelect: () => null }))
vi.mock(
  "@/app/[lang]/(main)/economic-calendar/economic-calendar-filters",
  () => ({
    EconomicCalendarFilters: () => null,
  })
)
vi.mock(
  "@/app/[lang]/(main)/economic-calendar/economic-calendar-search",
  () => ({
    EconomicCalendarSearch: () => null,
  })
)
vi.mock(
  "@/app/[lang]/(main)/economic-calendar/economic-calendar-sync-button",
  () => ({
    EconomicCalendarSyncButton: () => null,
  })
)

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { EconomicCalendarListResponse } from "@/app/lib/economic-calendar/definitions"
import { EconomicCalendarList } from "@/app/[lang]/(main)/economic-calendar/economic-calendar-list"
import { getEconomicCalendarDateState } from "@/app/[lang]/(main)/economic-calendar/economic-calendar-date"

function entry(
  id: number,
  actualValue: string | null,
  currencyCode: string | null = "USD"
): EconomicCalendarListResponse {
  return {
    id,
    title: "Inflation report " + id,
    currencyCode,
    type: null,
    impact: "LOW",
    forecastValue: "0",
    previousValue: null,
    actualValue,
    description: null,
    revision: null,
    newsUrl: null,
    actualBetterWorse: null,
    revisionBetterWorse: null,
    status: actualValue === null ? "PENDING" : "AVAILABLE",
    scheduledAt: "2026-01-04T17:30:00Z",
    syncedAt: null,
    createdDate: "2026-01-04T00:00:00Z",
    lastModifiedDate: null,
  }
}

function renderList(entries: EconomicCalendarListResponse[], search = "") {
  mocks.search = search
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <EconomicCalendarList
        economicCalendarEntries={entries}
        dateState={getEconomicCalendarDateState("2026-01-05")}
        sort="scheduledAt_asc"
      />
    </LocalizationProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.search = ""
})

afterEach(cleanup)

describe("EconomicCalendarList", () => {
  it("groups same-day releases by UTC+07 time and currency and preserves zero versus missing values", () => {
    renderList([entry(1, "0"), entry(2, null)])

    expect(screen.getByRole("cell", { name: "00:30" })).toHaveAttribute(
      "rowspan",
      "2"
    )
    expect(screen.getByRole("cell", { name: "USD" })).toHaveAttribute(
      "rowspan",
      "2"
    )
    const availableRow = screen
      .getByRole("link", { name: "Inflation report 1" })
      .closest("tr")
    const pendingRow = screen
      .getByRole("link", { name: "Inflation report 2" })
      .closest("tr")
    expect(
      within(availableRow as HTMLElement).getAllByText("0", { exact: true })
    ).toHaveLength(2)
    expect(
      within(pendingRow as HTMLElement).getAllByText(
        viDictionary.common.notAvailable,
        { exact: true }
      )
    ).toHaveLength(2)
  })

  it("uses distinct groups for a different currency", () => {
    renderList([entry(1, "1", "USD"), entry(2, "2", "JPY")])

    expect(screen.getByRole("cell", { name: "USD" })).toHaveAttribute(
      "rowspan",
      "1"
    )
    expect(screen.getByRole("cell", { name: "JPY" })).toHaveAttribute(
      "rowspan",
      "1"
    )
  })

  it("shows localized filtered-empty and unfiltered-day messages", () => {
    const view = renderList([], "title%5BcontainsIgnoreCase%5D=inflation")
    expect(screen.getByRole("status")).toHaveTextContent(
      viDictionary.economicCalendar.emptyDescription
    )
    expect(
      screen.getByText(viDictionary.economicCalendar.emptyDescription)
    ).toBeVisible()

    mocks.search = ""
    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <EconomicCalendarList
          economicCalendarEntries={[]}
          dateState={getEconomicCalendarDateState("2026-01-05")}
          sort="scheduledAt_asc"
        />
      </LocalizationProvider>
    )
    expect(screen.getByRole("status")).toHaveTextContent(
      viDictionary.economicCalendar.emptyDay
    )
    expect(
      screen.getByText(viDictionary.economicCalendar.emptyDay)
    ).toBeVisible()
  })
})
