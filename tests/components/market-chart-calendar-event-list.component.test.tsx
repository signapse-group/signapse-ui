// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("klinecharts", () => ({
  registerOverlay: vi.fn(),
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { MarketChartEconomicCalendarEventResponse } from "@/app/lib/market-charts/definitions"
import { MarketChartCalendarEventList } from "@/app/[lang]/(main)/market-charts/market-chart-canvas"

const event: MarketChartEconomicCalendarEventResponse = {
  id: 10,
  title:
    "US Distillate Inventories with a deliberately long title that must remain readable",
  currencyCode: "USD",
  impact: "HIGH",
  status: "AVAILABLE",
  scheduledAt: "2026-09-02T21:30:00.000Z",
  time: "2026-09-02T20:30:00.000Z",
  actualValue: "-1.2M",
  forecastValue: "-1.8M",
  previousValue: "-2.5M",
  revision: "Revised to -2.3M",
  description:
    "Change in the number of barrels of distillate fuel held in inventory by commercial firms during the past week. This long description continues beyond three lines so the full source text stays available within the chart event detail.",
}

function renderEventList(events: MarketChartEconomicCalendarEventResponse[]) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <MarketChartCalendarEventList events={events} />
    </LocalizationProvider>
  )
}

describe("MarketChartCalendarEventList", () => {
  afterEach(() => cleanup())

  it("shows the full event inline and marks actual higher than forecast", () => {
    renderEventList([event])

    const title = screen.getByRole("heading", { name: event.title! })
    const description = screen.getByText(event.description!)
    const actualValue = screen.getByText("-1.2M", { exact: true })
    const forecastValue = screen.getByText("-1.8M", { exact: true })
    const previousValue = screen.getByText("-2.5M", { exact: true })
    const actualRow = actualValue.closest("dd")

    expect(title).not.toHaveClass("line-clamp-2")
    expect(description).not.toHaveClass("line-clamp-3")
    expect(screen.getByText("USD", { exact: true })).toBeVisible()
    expect(
      screen.getByText(viDictionary.economicCalendar.impactLabels.HIGH)
    ).toBeVisible()
    expect(
      screen.getByText(viDictionary.marketCharts.calendar.statusLabels.AVAILABLE)
    ).toBeVisible()
    expect(screen.getByText(/Revised to -2\.3M/)).toBeVisible()
    expect(actualRow).toHaveClass("text-green-600")
    expect(actualRow?.querySelector("svg")).not.toBeNull()
    expect(forecastValue.closest("dd")).toHaveClass("text-muted-foreground")
    expect(previousValue.closest("dd")).toHaveClass("text-muted-foreground")
    expect(screen.queryByText(/vs forecast/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("keeps every publication readable in a grouped marker list", () => {
    renderEventList([
      event,
      {
        ...event,
        id: 12,
        title: "US Natural Gas Storage",
        actualValue: null,
        forecastValue: null,
        previousValue: null,
        revision: null,
        description: "A separate publication in the same marker group.",
      },
    ])

    expect(screen.getByRole("heading", { name: event.title! })).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "US Natural Gas Storage" })
    ).toBeVisible()
    expect(
      screen.getByText("A separate publication in the same marker group.", {
        exact: true,
      })
    ).toBeVisible()
  })

  it("marks actual below forecast with a red down arrow", () => {
    renderEventList([
      {
        ...event,
        id: 13,
        title: "ISM Manufacturing PMI",
        actualValue: "54.6",
        forecastValue: "55.2",
      },
    ])

    const actualRow = screen.getByText("54.6", { exact: true }).closest("dd")

    expect(actualRow).toHaveClass("text-red-600")
    expect(actualRow?.querySelector("svg")).not.toBeNull()
    expect(screen.getByText("55.2", { exact: true }).closest("dd")).toHaveClass(
      "text-muted-foreground"
    )
  })

  it("keeps a zero actual value and equal comparison neutral", () => {
    renderEventList([
      {
        ...event,
        id: 14,
        title: "Zero equality release",
        actualValue: "0",
        forecastValue: "0",
        previousValue: "0",
      },
    ])

    const actualRow = screen.getAllByText("0", { exact: true })[0]?.closest("dd")

    expect(actualRow).toHaveClass("text-foreground")
    expect(actualRow?.querySelector("svg")).toBeNull()
  })

  it("keeps missing release values explicit and neutral", () => {
    renderEventList([
      {
        id: 11,
        title: "Pending release",
        scheduledAt: event.scheduledAt,
        status: "PENDING",
        actualValue: null,
        forecastValue: " ",
        previousValue: undefined,
      },
    ])

    expect(
      screen.getByRole("heading", { name: "Pending release" })
    ).toBeVisible()
    expect(
      screen.getAllByText(viDictionary.common.notAvailable, { exact: true })
    ).toHaveLength(3)
    expect(
      screen.getByText(viDictionary.marketCharts.calendar.statusLabels.PENDING)
    ).toBeVisible()
    expect(
      screen
        .getAllByText(viDictionary.common.notAvailable, { exact: true })[0]
        ?.closest("dd")
        ?.querySelector("svg")
    ).toBeNull()
  })
})
