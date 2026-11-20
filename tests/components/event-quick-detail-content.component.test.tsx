// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { EventResponse } from "@/app/lib/events/definitions"
import { EventQuickDetailContent } from "@/app/[lang]/(main)/events/event-quick-detail-content"

function makeEvent(
  status: EventResponse["status"],
  links: {
    assets: unknown[]
    themes: unknown[]
    evidence?: unknown[]
  } = {
    assets: [],
    themes: [],
  }
): EventResponse {
  const { evidence = [], ...relatedData } = links

  return {
    id: 61,
    title: "Sự kiện mẫu",
    status,
    createdDate: "2026-01-14T08:00:00.000Z",
    lastModifiedDate: "2026-01-15T08:00:00.000Z",
    ...relatedData,
    evidence,
    marketReactions: [],
  } as unknown as EventResponse
}

function eventContent(
  event: EventResponse,
  watchlistAssetIds: readonly number[] = [],
  canReadNewsArticles = false
) {
  return (
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <EventQuickDetailContent
        canReadNewsArticles={canReadNewsArticles}
        dictionary={viDictionary}
        event={event}
        locale="vi"
        watchlistAssetIds={watchlistAssetIds}
      />
    </LocalizationProvider>
  )
}

function renderEvent(
  event: EventResponse,
  watchlistAssetIds: readonly number[] = [],
  canReadNewsArticles = false
) {
  return render(eventContent(event, watchlistAssetIds, canReadNewsArticles))
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

  it("prioritizes watchlist assets in Event order and keeps evidence independent", () => {
    const assets = [1, 2, 3, 4, 5, 6].map((id) => ({
      assetId: id,
      assetName: `Asset A${id}`,
      assetSymbol: `A${id}`,
      assetType: "EQUITY",
      relationType: "REFERENCE_ASSET",
      weight: null,
    }))
    const evidence = [1, 2, 3, 4, 5, 6].map((id) => ({
      newsArticleId: 70 + id,
      newsArticleTitle: `Evidence ${id}`,
      newsArticleUrl: `https://fixture.invalid/news/${70 + id}`,
      sourceName: `Source ${id}`,
      publishedAt: null,
      evidenceRole: "SUPPORTING",
      confidence: null,
      evidenceNote: null,
    }))
    const event = makeEvent("ENRICHED", {
      assets: [...assets, assets[2]],
      themes: [],
      evidence,
    })
    const view = renderEvent(event, [6, 3])
    const assetsSection = screen
      .getByRole("heading", { name: viDictionary.events.relatedAssets })
      .closest("section")
    const evidenceSection = screen
      .getByRole("heading", { name: viDictionary.events.mainEvidence })
      .closest("section")

    function renderedSymbols() {
      return within(assetsSection!)
        .getAllByText(/^A[1-6]$/)
        .map((element) => element.textContent)
    }

    function renderedEvidenceTitles() {
      return within(evidenceSection!)
        .getAllByRole("heading", { level: 3 })
        .map((element) => element.textContent)
        .filter((title) => title?.startsWith("Evidence"))
    }

    expect(renderedSymbols()).toEqual(["A3", "A6", "A1", "A2"])
    expect(new Set(renderedSymbols()).size).toBe(4)
    expect(renderedEvidenceTitles()).toEqual([
      "Evidence 1",
      "Evidence 2",
      "Evidence 3",
      "Evidence 4",
    ])

    view.rerender(eventContent(event, [6, 3, 1, 5]))

    expect(renderedSymbols()).toEqual(["A1", "A3", "A5", "A6"])
    expect(renderedEvidenceTitles()).toEqual([
      "Evidence 1",
      "Evidence 2",
      "Evidence 3",
      "Evidence 4",
    ])
  })

  it.each([
    ["without watchlist context", []],
    ["when the watchlist has no matches", [99]],
  ] as const)(
    "keeps Event asset order %s",
    (_description, watchlistAssetIds) => {
      const assets = [1, 2, 3, 4, 5, 6].map((id) => ({
        assetId: id,
        assetName: `Asset A${id}`,
        assetSymbol: `A${id}`,
        assetType: "EQUITY",
        relationType: "REFERENCE_ASSET",
        weight: null,
      }))
      renderEvent(
        makeEvent("ENRICHED", { assets, themes: [] }),
        watchlistAssetIds
      )
      const assetsSection = screen
        .getByRole("heading", { name: viDictionary.events.relatedAssets })
        .closest("section")

      expect(
        within(assetsSection!)
          .getAllByText(/^A[1-6]$/)
          .map((element) => element.textContent)
      ).toEqual(["A1", "A2", "A3", "A4"])
    }
  )

  it("keeps complete evidence titles and notes and shows missing metadata states", () => {
    const title = `Evidence title ${"continued ".repeat(20)}`
    const note = `Evidence note ${"continues ".repeat(35)}`
    const event = makeEvent("ENRICHED", {
      assets: [],
      themes: [],
      evidence: [
        {
          newsArticleTitle: title,
          evidenceNote: note,
          publishedAt: null,
          confidence: null,
        },
      ],
    })
    renderEvent(event)

    const evidenceTitle = screen.getByRole("heading", {
      name: /^Evidence title continued/,
    })
    expect(evidenceTitle.textContent).toBe(title)
    expect(evidenceTitle).not.toHaveClass("line-clamp-2")
    const evidenceNote = screen.getByText(/^Evidence note continues/)
    expect(evidenceNote.textContent).toBe(note)
    expect(evidenceNote).not.toHaveClass("line-clamp-3")

    cleanup()
    renderEvent({
      ...makeEvent("ENRICHED", { assets: [], themes: [] }),
      title: null,
      description: null,
      confidence: null,
      occurredAt: null,
      evidence: [],
    })

    expect(
      screen.getByText(viDictionary.events.detailNoDescription)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(viDictionary.common.notAvailable, { exact: true })
    ).toHaveLength(2)
    expect(screen.getByText(viDictionary.events.noEvidenceQuick)).toBeVisible()
    expect(screen.getByText(viDictionary.events.noAssetsTitle)).toBeVisible()
    expect(screen.getByText(viDictionary.events.noThemesTitle)).toBeVisible()
  })

  it("keeps Article and source actions tied to their supplied identity and permission", () => {
    const event = makeEvent("ENRICHED", {
      assets: [],
      themes: [],
      evidence: [
        {
          newsArticleId: 71,
          newsArticleTitle: "Evidence with both actions",
          newsArticleUrl: "https://fixture.invalid/source/71",
        },
        {
          newsArticleTitle: "Evidence without Article identity",
          newsArticleUrl: "https://fixture.invalid/source/original",
        },
      ],
    })
    const view = renderEvent(event)

    expect(
      screen.queryByRole("link", { name: viDictionary.events.viewArticle })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText("Chưa có định danh bài viết.", { exact: true })
    ).toBeVisible()
    const originalLinks = screen.getAllByRole("link", {
      name: viDictionary.events.openOriginal,
    })
    expect(originalLinks[0]).toHaveAttribute(
      "href",
      "https://fixture.invalid/source/71"
    )
    expect(originalLinks[0]).toHaveAttribute("target", "_blank")

    view.rerender(eventContent(event, [], true))

    expect(
      screen.getByRole("link", { name: viDictionary.events.viewArticle })
    ).toHaveAttribute("href", "/vi/news-articles/71")
    expect(
      screen.getAllByRole("link", {
        name: viDictionary.events.openOriginal,
      })
    ).toHaveLength(2)
  })

  it("shows a neutral missing source state while retaining the Article action", () => {
    const event = makeEvent("ENRICHED", {
      assets: [],
      themes: [],
      evidence: [
        {
          newsArticleId: 72,
          newsArticleTitle: "Evidence without an original source URL",
        },
      ],
    })

    renderEvent(event, [], true)

    expect(
      screen.getByText("Chưa có URL nguồn.", { exact: true })
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: viDictionary.events.viewArticle })
    ).toHaveAttribute("href", "/vi/news-articles/72")
    expect(
      screen.queryByRole("link", { name: viDictionary.events.openOriginal })
    ).not.toBeInTheDocument()
  })
})
