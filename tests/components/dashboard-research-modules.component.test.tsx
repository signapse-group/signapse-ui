// @vitest-environment jsdom

import type { ReactNode } from "react"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type {
  DashboardAssetInFocusItemResponse,
  DashboardAssetsInFocusMetricResponse,
  DashboardMarketNarrativeItemResponse,
  DashboardMarketNarrativesMetricResponse,
  DashboardSummaryResponse,
} from "@/app/lib/dashboard/definitions"
import type { AppLocale } from "@/app/lib/i18n/config"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { formatDateTime } from "@/app/lib/i18n/format"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { AssetsInFocus } from "@/app/[lang]/(main)/dashboard/assets-in-focus"
import { MarketNarratives } from "@/app/[lang]/(main)/dashboard/market-narratives"
import { TradingSnapshot } from "@/app/[lang]/(main)/dashboard/trading-snapshot"

afterEach(cleanup)

const observedAt = "2026-01-15T08:00:00.000Z"

function renderLocalized(ui: ReactNode, locale: AppLocale = "vi") {
  const dictionary = locale === "vi" ? viDictionary : enDictionary

  return render(
    <LocalizationProvider dictionary={dictionary} locale={locale}>
      {ui}
    </LocalizationProvider>
  )
}

function focusAsset(
  overrides: Partial<DashboardAssetInFocusItemResponse> = {}
): DashboardAssetInFocusItemResponse {
  return {
    assetId: 101,
    assetName: "Bitcoin",
    assetSymbol: "BTCUSD",
    assetType: "CRYPTO",
    context: {
      title: "Động lượng thị trường",
      summary: "Bối cảnh do API cung cấp.",
      observedAt,
    },
    ...overrides,
  }
}

function marketNarrative(
  overrides: Partial<DashboardMarketNarrativeItemResponse> = {}
): DashboardMarketNarrativeItemResponse {
  return {
    id: 81,
    title: "Nhu cầu năng lượng tăng",
    thesis: "Nhu cầu được điều chỉnh cao hơn.",
    status: "EMERGING",
    confidence: 0.8,
    lastUpdatedAt: observedAt,
    primaryTheme: {
      themeId: 91,
      themeTitle: "Năng lượng",
      themeSlug: "sensitive-theme-slug",
    },
    assets: [
      {
        assetId: 101,
        assetName: "Bitcoin",
        assetSymbol: "BTCUSD",
        assetType: "CRYPTO",
        relationType: "PRIMARY",
        weight: null,
      },
      {
        assetId: 202,
        assetName: "Gold",
        assetSymbol: "GOLD",
        assetType: "COMMODITY",
        relationType: "AFFECTED",
        weight: 0.5,
      },
    ],
    ...overrides,
  }
}

function dashboardSummary(
  activeNarratives: DashboardSummaryResponse["activeNarratives"],
  marketNarratives: DashboardMarketNarrativesMetricResponse
): DashboardSummaryResponse {
  return {
    asOf: observedAt,
    timezone: "UTC",
    scope: { workspaceId: 1, watchlistAssetCount: 1 },
    nextKeyEvent: { state: "EMPTY", data: null, errorCode: null },
    recentEvents: { state: "EMPTY", items: [], errorCode: null },
    marketEvents24h: {
      state: "EMPTY",
      count: 0,
      window: null,
      errorCode: null,
    },
    activeNarratives,
    marketNarratives,
    latestNews6h: {
      state: "EMPTY",
      count: 0,
      window: null,
      errorCode: null,
    },
    assetsInFocus: { state: "EMPTY", items: [], errorCode: null },
  }
}

describe("Overview research modules", () => {
  it("preserves unique focus order, localized context, and per-asset chart links", () => {
    const metric: DashboardAssetsInFocusMetricResponse = {
      state: "AVAILABLE",
      items: [
        focusAsset({
          assetId: 203,
          assetName: "Gold",
          assetSymbol: "GOLD",
          assetType: "COMMODITY",
          context: {
            title: "Bối cảnh hàng hóa",
            summary: "Tín hiệu từ thị trường hàng hóa.",
            observedAt,
          },
        }),
        focusAsset({
          assetId: 101,
          assetName: "Bitcoin",
          assetSymbol: "BTCUSD",
          assetType: "CRYPTO",
        }),
        focusAsset({
          assetId: 203,
          assetName: "Duplicate Gold entry",
          assetSymbol: "GOLD",
          assetType: "COMMODITY",
        }),
        ...Array.from({ length: 5 }, (_, index) =>
          focusAsset({
            assetId: 300 + index,
            assetName: "Asset " + (index + 3),
            assetSymbol: "A" + (index + 3),
            assetType: "ETF",
            context: {
              title: "Bối cảnh " + (index + 3),
              summary: "Tóm tắt " + (index + 3),
              observedAt,
            },
          })
        ),
      ],
      errorCode: null,
    }

    renderLocalized(
      <AssetsInFocus
        canAccessMarketCharts
        canReadGraphView
        dictionary={viDictionary}
        error={null}
        locale="vi"
        metric={metric}
      />
    )

    const region = screen.getByRole("region", {
      name: viDictionary.workspaceOverview.assetsInFocus.title,
    })
    expect(
      within(region)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "GOLD · Gold",
      "BTCUSD · Bitcoin",
      "A3 · Asset 3",
      "A4 · Asset 4",
      "A5 · Asset 5",
      "A6 · Asset 6",
    ])
    expect(within(region).getByText("Hàng hóa")).toBeInTheDocument()
    expect(within(region).getByText("Crypto")).toBeInTheDocument()
    expect(within(region).queryByText("Duplicate Gold entry")).toBeNull()
    expect(
      within(region).getByText("Động lượng thị trường")
    ).toBeInTheDocument()
    expect(within(region).getByText("Bối cảnh do API cung cấp.")).toHaveClass(
      "line-clamp-2"
    )
    expect(
      within(region).getByRole("link", {
        name: "Mở biểu đồ thị trường: GOLD",
      })
    ).toHaveAttribute("href", "/vi/market-charts?assetId=203&timeframe=1h")
    expect(
      within(region).getByRole("link", { name: "Mở Graph View" })
    ).toHaveAttribute("href", "/vi/graph-view")
    expect(
      within(region).getAllByText(
        formatDateTime(
          observedAt,
          "vi",
          { dateStyle: "medium", timeStyle: "short" },
          viDictionary.workspaceOverview.assetsInFocus.invalidDate
        )
      )
    ).toHaveLength(6)
  })

  it("renders all narrative assets and localized nullable content without slug fallback", () => {
    const metric: DashboardMarketNarrativesMetricResponse = {
      state: "AVAILABLE",
      items: [
        marketNarrative(),
        marketNarrative({
          id: 82,
          title: null,
          thesis: null,
          status: "WEAKENING",
          confidence: null,
          primaryTheme: {
            themeId: 92,
            themeTitle: null,
            themeSlug: "must-not-be-rendered",
          },
          assets: [],
        }),
        marketNarrative({
          id: 83,
          title: "Triển vọng phục hồi",
          thesis: "Dữ liệu mẫu giữ thứ tự từ producer.",
          status: "ACTIVE",
          confidence: null,
          primaryTheme: {
            themeId: 93,
            themeTitle: "Tăng trưởng",
            themeSlug: "growth",
          },
          assets: [],
        }),
      ],
      errorCode: null,
    }

    renderLocalized(
      <MarketNarratives
        canReadGraphView
        dictionary={viDictionary}
        error={null}
        locale="vi"
        metric={metric}
      />
    )

    const region = screen.getByRole("region", {
      name: viDictionary.workspaceOverview.marketNarratives.title,
    })
    expect(within(region).getAllByRole("listitem")).toHaveLength(3)
    expect(
      within(region).getByRole("heading", { name: "Nhu cầu năng lượng tăng" })
    ).toBeInTheDocument()
    expect(
      within(region)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "Nhu cầu năng lượng tăng",
      "Luận điểm chưa có tiêu đề",
      "Triển vọng phục hồi",
    ])
    expect(
      within(region).getByText("Nhu cầu được điều chỉnh cao hơn.")
    ).toBeInTheDocument()
    expect(within(region).getByText("Mới hình thành")).toBeInTheDocument()
    expect(within(region).getByText("Yếu dần")).toBeInTheDocument()
    expect(within(region).getByText("Đang hoạt động")).toBeInTheDocument()
    expect(within(region).getByText("Năng lượng")).toBeInTheDocument()
    expect(within(region).getByText(/Độ tin cậy.*80/)).toBeInTheDocument()
    expect(within(region).getByText("BTCUSD")).toBeInTheDocument()
    expect(within(region).getByText("GOLD")).toBeInTheDocument()
    expect(
      within(region).getByText("Luận điểm chưa có tiêu đề")
    ).toBeInTheDocument()
    expect(
      within(region).getByText("Chưa có mô tả cho luận điểm này.")
    ).toBeInTheDocument()
    expect(region).not.toHaveTextContent("must-not-be-rendered")
    expect(within(region).getAllByText(/Cập nhật/)).toHaveLength(3)
    expect(
      within(region).getByRole("link", { name: "Mở Graph View" })
    ).toHaveAttribute("href", "/vi/graph-view")
  })

  it("distinguishes the all-time active count from the seven-day list in both locales", () => {
    const summary = dashboardSummary(
      {
        state: "AVAILABLE",
        count: 12,
        statuses: ["EMERGING", "ACTIVE"],
        errorCode: null,
      },
      { state: "AVAILABLE", items: [marketNarrative()], errorCode: null }
    )

    for (const locale of ["vi", "en"] as const) {
      cleanup()
      const dictionary = locale === "vi" ? viDictionary : enDictionary
      renderLocalized(
        <>
          <TradingSnapshot
            dictionary={dictionary}
            error={null}
            locale={locale}
            summary={summary}
          />
          <MarketNarratives
            canReadGraphView={false}
            dictionary={dictionary}
            error={null}
            locale={locale}
            metric={summary.marketNarratives}
          />
        </>,
        locale
      )

      const snapshot = screen.getByRole("region", {
        name: dictionary.workspaceOverview.tradingSnapshot.title,
      })
      const countHeading = within(snapshot).getByRole("heading", {
        name: dictionary.workspaceOverview.tradingSnapshot.narratives,
      })
      const countCard = countHeading.closest('[data-slot="card"]')
      expect(countCard).not.toBeNull()
      expect(
        within(countCard as HTMLElement).getByText("12", { exact: true })
      ).toBeInTheDocument()
      expect(
        within(countCard as HTMLElement).getByText(
          dictionary.workspaceOverview.tradingSnapshot.narrativesScope
        )
      ).toBeInTheDocument()

      const narratives = screen.getByRole("region", {
        name: dictionary.workspaceOverview.marketNarratives.title,
      })
      expect(within(narratives).getAllByRole("listitem")).toHaveLength(1)
      expect(
        within(narratives).getByText(
          dictionary.workspaceOverview.marketNarratives.description
        )
      ).toBeInTheDocument()
    }
  })

  it("does not render a failed active-narratives count as zero", () => {
    const summary = dashboardSummary(
      {
        state: "ERROR",
        count: null,
        statuses: [],
        errorCode: "SUMMARY_UNAVAILABLE",
      },
      { state: "EMPTY", items: [], errorCode: null }
    )

    renderLocalized(
      <TradingSnapshot
        dictionary={viDictionary}
        error={null}
        locale="vi"
        summary={summary}
      />
    )

    const snapshot = screen.getByRole("region", {
      name: viDictionary.workspaceOverview.tradingSnapshot.title,
    })
    const countHeading = within(snapshot).getByRole("heading", {
      name: viDictionary.workspaceOverview.tradingSnapshot.narratives,
    })
    const countCard = countHeading.closest('[data-slot="card"]')
    expect(countCard).not.toBeNull()
    expect(
      within(countCard as HTMLElement).getByText("Không thể tải", {
        exact: true,
      })
    ).toBeInTheDocument()
    expect(
      within(countCard as HTMLElement).queryByText("0", { exact: true })
    ).not.toBeInTheDocument()
  })

  it("keeps Graph View available by destination permission when a metric is empty", () => {
    const empty: DashboardAssetsInFocusMetricResponse = {
      state: "EMPTY",
      items: [],
      errorCode: null,
    }
    const emptyNarratives: DashboardMarketNarrativesMetricResponse = {
      state: "EMPTY",
      items: [],
      errorCode: null,
    }

    renderLocalized(
      <>
        <AssetsInFocus
          canAccessMarketCharts={false}
          canReadGraphView
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={empty}
        />
        <MarketNarratives
          canReadGraphView
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={emptyNarratives}
        />
      </>
    )

    const assetsRegion = screen.getByRole("region", {
      name: viDictionary.workspaceOverview.assetsInFocus.title,
    })
    expect(
      within(assetsRegion).getByRole("link", { name: "Mở Graph View" })
    ).toHaveAttribute("href", "/vi/graph-view")
    expect(
      within(assetsRegion).queryByRole("link", {
        name: /Mở biểu đồ thị trường/,
      })
    ).not.toBeInTheDocument()
    const narrativesRegion = screen.getByRole("region", {
      name: viDictionary.workspaceOverview.marketNarratives.title,
    })
    expect(
      within(narrativesRegion).getByRole("link", { name: "Mở Graph View" })
    ).toHaveAttribute("href", "/vi/graph-view")
  })

  it("shows denied separately from empty content", () => {
    renderLocalized(
      <>
        <AssetsInFocus
          canAccessMarketCharts={false}
          canReadGraphView={false}
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={{ state: "EMPTY", items: [], errorCode: null }}
        />
        <MarketNarratives
          canReadGraphView={false}
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={{
            state: "DENIED",
            items: [],
            errorCode: "NARRATIVE_READ_REQUIRED",
          }}
        />
      </>
    )

    expect(
      screen.getByText(viDictionary.workspaceOverview.assetsInFocus.emptyTitle)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        viDictionary.workspaceOverview.marketNarratives.deniedTitle
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        viDictionary.workspaceOverview.marketNarratives.errorTitle
      )
    ).not.toBeInTheDocument()
  })

  it("shows a source error without hiding a healthy independent module", () => {
    const availableNarratives: DashboardMarketNarrativesMetricResponse = {
      state: "AVAILABLE",
      items: [marketNarrative()],
      errorCode: null,
    }
    const failedAssets: DashboardAssetsInFocusMetricResponse = {
      state: "ERROR",
      items: [],
      errorCode: "UPSTREAM_TIMEOUT",
    }

    renderLocalized(
      <>
        <AssetsInFocus
          canAccessMarketCharts
          canReadGraphView={false}
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={failedAssets}
        />
        <MarketNarratives
          canReadGraphView={false}
          dictionary={viDictionary}
          error={null}
          locale="vi"
          metric={availableNarratives}
        />
      </>
    )

    expect(
      screen.getByText(viDictionary.workspaceOverview.assetsInFocus.errorTitle)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Nhu cầu năng lượng tăng" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /Mở biểu đồ thị trường/ })
    ).not.toBeInTheDocument()
  })
})
