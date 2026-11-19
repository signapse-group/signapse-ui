// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import type { EventResponse } from "@/app/lib/events/definitions"
import { EventQuickDetailContent } from "@/app/[lang]/(main)/events/event-quick-detail-content"

function makeEvent(
  status: EventResponse["status"],
  links: { assets: unknown[]; themes: unknown[] } = {
    assets: [],
    themes: [],
  }
): EventResponse {
  return {
    id: 61,
    title: "Sự kiện mẫu",
    status,
    createdDate: "2026-01-14T08:00:00.000Z",
    lastModifiedDate: "2026-01-15T08:00:00.000Z",
    ...links,
    evidence: [],
    marketReactions: [],
  } as unknown as EventResponse
}

function renderEvent(event: EventResponse) {
  return render(
    <EventQuickDetailContent
      canReadNewsArticles={false}
      dictionary={viDictionary}
      event={event}
      locale="vi"
    />
  )
}

describe("EventQuickDetailContent related links", () => {
  afterEach(cleanup)

  it("shows localized asset role badges and theme metadata without inferring missing roles", () => {
    renderEvent(
      makeEvent("ENRICHED", {
        assets: [
          {
            assetId: 101,
            assetName: "Akamai Technologies",
            assetSymbol: "AKAM",
            assetType: "EQUITY",
            relationType: "PRIMARY_SUBJECT",
            weight: 1,
          },
          {
            assetId: 102,
            assetName: "First Trust Cloud Computing ETF",
            assetSymbol: "SKYY",
            assetType: "ETF",
            relationType: "AFFECTED_ASSET",
            weight: 0.65,
          },
          {
            assetId: 103,
            assetName: "Microsoft",
            assetSymbol: "MSFT",
            assetType: "EQUITY",
            relationType: "REFERENCE_ASSET",
            weight: 0.35,
          },
          {
            assetId: 104,
            assetName: "Unclassified relation",
            assetSymbol: "UNCL",
            assetType: "EQUITY",
            weight: null,
          },
        ],
        themes: [
          {
            themeId: 201,
            themeTitle: "Technology",
            themeSlug: "technology",
            relationType: "PRIMARY_THEME",
            weight: 0.9,
          },
          {
            themeId: 202,
            themeTitle: "Growth",
            themeSlug: "growth",
            relationType: "SECONDARY_THEME",
            weight: 0.5,
          },
          {
            themeId: 203,
            themeTitle: "Unclassified theme",
            themeSlug: "unclassified-theme",
            weight: null,
          },
        ],
      })
    )

    expect(screen.getAllByText("Cổ phiếu")).toHaveLength(3)
    expect(screen.getByText("ETF")).toBeInTheDocument()
    expect(screen.getByText("Chủ thể chính")).toHaveClass(
      "bg-(--badge-info-bg)"
    )
    expect(screen.getByText("Tài sản bị ảnh hưởng")).toHaveClass("bg-secondary")
    expect(screen.getByText("Tài sản tham chiếu")).toHaveClass("border-border")
    expect(screen.getByText("Chủ đề chính")).toBeInTheDocument()
    expect(screen.getByText("Chủ đề phụ")).toBeInTheDocument()
    expect(screen.getByText("Unclassified relation")).toBeInTheDocument()
    expect(screen.getByText("Unclassified theme")).toBeInTheDocument()
    expect(screen.getByText("Chủ thể chính")).toBeInTheDocument()
    expect(
      screen.queryByText(viDictionary.events.statusLabels.ENRICHED)
    ).not.toBeInTheDocument()
  })

  it.each([
    ["ENRICHMENT_NO_MATCH", "Không có liên kết phù hợp"],
    ["ENRICHMENT_FAILED", "Lỗi làm giàu"],
  ] as const)(
    "uses the same empty state and omits processing status for %s",
    (status, statusLabel) => {
      renderEvent(makeEvent(status))

      expect(
        screen.getByText(viDictionary.events.noAssetsTitle)
      ).toBeInTheDocument()
      expect(
        screen.getByText(viDictionary.events.noAssetsDescription)
      ).toBeInTheDocument()
      expect(
        screen.getByText(viDictionary.events.noThemesTitle)
      ).toBeInTheDocument()
      expect(
        screen.getByText(viDictionary.events.noThemesDescription)
      ).toBeInTheDocument()
      expect(screen.queryByText(statusLabel)).not.toBeInTheDocument()
    }
  )
})
