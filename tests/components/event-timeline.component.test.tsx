// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/[lang]/(main)/dashboard/dashboard-quick-detail", () => ({
  DashboardQuickDetailButton: ({
    entity,
    ...props
  }: React.ComponentProps<"button"> & { entity: unknown }) => {
    void entity
    return <button {...props} />
  },
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { DashboardRecentEventsMetricResponse } from "@/app/lib/dashboard/definitions"
import { EventTimeline } from "@/app/[lang]/(main)/dashboard/event-timeline"

const metric: DashboardRecentEventsMetricResponse = {
  state: "AVAILABLE",
  errorCode: null,
  items: [
    {
      id: 11,
      title: "Tàu chở hàng bị tấn công ở eo biển Hormuz",
      description: "Một mô tả sự kiện thị trường.",
      occurredAt: "2026-07-29T00:00:00.000Z",
      confidence: 0.95,
      themes: [],
      affectedAssets: [],
    },
  ],
}

describe("EventTimeline link composition", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders view-all as a native localized link", () => {
    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <EventTimeline
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={metric}
        />
      </LocalizationProvider>
    )

    const viewAll = screen.getByRole("link", {
      name: viDictionary.workspaceOverview.eventTimeline.viewAll,
    })

    expect(viewAll.tagName).toBe("A")
    expect(viewAll).toHaveAttribute("href", "/vi/events")
    expect(
      screen.queryByRole("button", {
        name: viDictionary.workspaceOverview.eventTimeline.viewAll,
      })
    ).not.toBeInTheDocument()
  })

  it("keeps only the first five producer events, including an older event", () => {
    const overflowMetric: DashboardRecentEventsMetricResponse = {
      state: "AVAILABLE",
      errorCode: null,
      items: Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        title: `Sự kiện ${index + 1}`,
        description: "Mô tả sự kiện.",
        occurredAt:
          index === 3
            ? "2026-01-13T08:00:00.000Z"
            : `2026-01-15T0${7 - index}:00:00.000Z`,
        confidence: null,
        themes: [],
        affectedAssets: [],
      })),
    }

    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <EventTimeline
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={overflowMetric}
        />
      </LocalizationProvider>
    )

    expect(
      screen.getByRole("button", { name: "Mở sự kiện: Sự kiện 4" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Mở sự kiện: Sự kiện 5" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Mở sự kiện: Sự kiện 6" })
    ).not.toBeInTheDocument()
  })
})
