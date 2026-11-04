// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { LinkedEventSummaryResponse } from "@/app/lib/news-articles/definitions"
import { NewsArticleLinkedEvents } from "@/app/[lang]/(main)/news-articles/news-article-linked-events"

const linkedEvent: LinkedEventSummaryResponse = {
  eventId: 81,
  eventTitle: "Sự kiện liên quan",
  eventCanonicalKey: "market-event-81",
  eventStatus: "ENRICHED",
  evidenceRole: "PRIMARY",
  evidenceConfidence: 0.9,
  evidenceNote: "Bài viết là bằng chứng chính.",
}

function renderLinkedEvents(
  events: LinkedEventSummaryResponse[],
  canReadEvents: boolean
) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <NewsArticleLinkedEvents
        events={events}
        dictionary={viDictionary}
        locale="vi"
        canReadEvents={canReadEvents}
      />
    </LocalizationProvider>
  )
}

afterEach(cleanup)

describe("full news article linked-event summary", () => {
  it("keeps API summary visible without event:read and hides the Event CTA", () => {
    renderLinkedEvents([linkedEvent], false)

    expect(
      screen.getByRole("heading", {
        name: viDictionary.newsArticles.relatedEventsTitle,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(linkedEvent.eventTitle!)).toBeInTheDocument()
    expect(screen.getByText(linkedEvent.eventCanonicalKey!)).toBeInTheDocument()
    expect(screen.getByText(linkedEvent.evidenceNote!)).toBeInTheDocument()
    expect(
      screen.getByText(
        viDictionary.newsArticles.evidenceRoleLabels[linkedEvent.evidenceRole!]
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: viDictionary.newsArticles.openEvent })
    ).not.toBeInTheDocument()
  })

  it("shows the canonical Event route only when event:read is present", () => {
    renderLinkedEvents([linkedEvent], true)

    expect(
      screen.getByRole("link", { name: viDictionary.newsArticles.openEvent })
    ).toHaveAttribute("href", "/events/81")
  })

  it("renders the API-provided empty summary distinctly", () => {
    renderLinkedEvents([], false)

    expect(
      screen.getByText(viDictionary.newsArticles.linkedEventsEmptyTitle)
    ).toBeInTheDocument()
  })
})
