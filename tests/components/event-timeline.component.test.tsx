// @vitest-environment jsdom

import userEvent from "@testing-library/user-event"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/[lang]/(main)/local-entity-quick-detail-drawer", () => ({
  LocalEntityQuickDetailDrawer: ({
    entity,
  }: {
    entity: { id: number; kind: string } | null
  }) =>
    entity ? (
      <output data-testid="selected-quick-detail">
        {entity.kind}:{entity.id}
      </output>
    ) : null,
}))

import { DashboardQuickDetailProvider } from "@/app/[lang]/(main)/dashboard/dashboard-quick-detail"
import { EventTimeline } from "@/app/[lang]/(main)/dashboard/event-timeline"
import type { DashboardRecentEventsMetricResponse } from "@/app/lib/dashboard/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

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

function renderTimeline(
  locale: "en" | "vi",
  dictionary: Dictionary,
  timelineMetric: DashboardRecentEventsMetricResponse
) {
  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <DashboardQuickDetailProvider>
        <EventTimeline
          dictionary={dictionary}
          error={null}
          locale={locale}
          metric={timelineMetric}
        />
      </DashboardQuickDetailProvider>
    </LocalizationProvider>
  )
}

describe("EventTimeline", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders view-all as a native localized link", () => {
    renderTimeline("vi", viDictionary, metric)

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

  it("keeps null and blank title events in producer order and opens their IDs by keyboard", async () => {
    const overflowMetric: DashboardRecentEventsMetricResponse = {
      state: "AVAILABLE",
      errorCode: null,
      items: Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        title:
          index === 1 ? null : index === 2 ? "  \t " : `Sự kiện ${index + 1}`,
        description: index === 1 ? null : "Mô tả sự kiện.",
        occurredAt:
          index === 3
            ? "2026-01-13T08:00:00.000Z"
            : `2026-01-15T0${7 - index}:00:00.000Z`,
        confidence: null,
        themes: [],
        affectedAssets: [],
      })),
    }

    renderTimeline("vi", viDictionary, overflowMetric)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(5)
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Sự kiện 1",
      "Chưa có tiêu đề",
      "Chưa có tiêu đề",
      "Sự kiện 4",
      "Sự kiện 5",
    ])
    expect(
      screen.getAllByRole("button", { name: "Mở sự kiện: Chưa có tiêu đề" })
    ).toHaveLength(2)
    expect(
      screen.queryByRole("button", { name: "Mở sự kiện: Sự kiện 6" })
    ).not.toBeInTheDocument()
    expect(screen.queryByText("null")).not.toBeInTheDocument()
    expect(screen.getAllByText(viDictionary.common.notAvailable)).toHaveLength(
      1
    )

    const user = userEvent.setup()
    await user.tab()
    expect(
      screen.getByRole("link", {
        name: viDictionary.workspaceOverview.eventTimeline.viewAll,
      })
    ).toHaveFocus()
    await user.tab()
    expect(buttons[0]).toHaveFocus()
    await user.tab()
    expect(buttons[1]).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(screen.getByTestId("selected-quick-detail")).toHaveTextContent(
      "event:2"
    )
    await user.tab()
    expect(buttons[2]).toHaveFocus()
    await user.keyboard(" ")
    expect(screen.getByTestId("selected-quick-detail")).toHaveTextContent(
      "event:3"
    )
  })

  it("uses the accepted English fallback label for null and blank titles", () => {
    const untitledMetric: DashboardRecentEventsMetricResponse = {
      ...metric,
      items: [
        { ...metric.items[0], id: 21, title: null, description: null },
        { ...metric.items[0], id: 22, title: "   " },
      ],
    }

    renderTimeline("en", enDictionary, untitledMetric)

    const untitledButtons = screen.getAllByRole("button", {
      name: "Open event: Untitled event",
    })
    expect(untitledButtons).toHaveLength(2)
    expect(untitledButtons[0]).toHaveTextContent("Untitled event")
    expect(untitledButtons[1]).toHaveTextContent("Untitled event")
  })
})
