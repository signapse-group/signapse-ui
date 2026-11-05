import { expect, test } from "./fixtures"

test.describe("P0 Dashboard Overview", () => {
  test("shows full workspace data and independent 5+5 global news across layouts", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/dashboard/summary", "overview-expanded", "GET")
    await fixture.setScenario("/watchlists", "overview-expanded", "GET")
    await fixture.setScenario("/news-articles", "overview-expanded", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1000 })
    await page.goto("/vi/dashboard")

    const workspace = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole("heading", { name: "Workspace Alpha" }) })
    await expect(workspace.getByRole("listitem")).toHaveCount(9)
    await expect(workspace.getByText("9", { exact: true })).toBeVisible()

    const timeline = page.locator(
      'section[aria-labelledby="dashboard-event-timeline-title"]'
    )
    const news = page.locator(
      'section[aria-labelledby="dashboard-latest-news-title"]'
    )
    await expect(
      timeline.getByRole("button", {
        name: "Mở sự kiện: Fixture overview event 4",
      })
    ).toBeVisible()
    await expect(
      timeline.getByRole("button", {
        name: "Mở sự kiện: Fixture overview event 6",
      })
    ).toHaveCount(0)
    const untitledEventTrigger = timeline.getByRole("button", {
      name: "Mở sự kiện: Chưa có tiêu đề",
    })
    await expect(untitledEventTrigger).toBeVisible()
    await expect(timeline.getByRole("listitem")).toHaveCount(5)
    await expect(
      news.getByRole("button", { name: "Mở bài viết: Global fixture news 5" })
    ).toBeVisible()
    await expect(
      news.getByRole("button", { name: "Mở bài viết: Global fixture news 6" })
    ).toHaveCount(0)
    await expect(news.getByRole("listitem")).toHaveCount(5)
    await expect(page.getByText("29", { exact: true })).toBeVisible()
    await expect(page.getByText("17", { exact: true })).toBeVisible()

    const snapshot = page.locator(
      'section[aria-labelledby="dashboard-trading-snapshot-title"]'
    )
    await expect(snapshot.getByText("14", { exact: true })).toBeVisible()
    await expect(
      snapshot.getByText(
        "Tổng số luận điểm đang hoạt động hoặc mới hình thành; không giới hạn 7 ngày."
      )
    ).toBeVisible()

    const assetsInFocus = page.locator(
      'section[aria-labelledby="dashboard-assets-in-focus-title"]'
    )
    await expect(assetsInFocus.getByRole("listitem")).toHaveCount(6)
    expect(
      await assetsInFocus.getByRole("heading", { level: 3 }).allTextContents()
    ).toEqual([
      "BTCUSD · Bitcoin",
      "FOCUS2 · Tài sản chú ý mẫu 2",
      "FOCUS3 · Tài sản chú ý mẫu 3",
      "FOCUS4 · Tài sản chú ý mẫu 4",
      "FOCUS5 · Tài sản chú ý mẫu 5",
      "FOCUS6 · Tài sản chú ý mẫu 6",
    ])
    await expect(
      assetsInFocus.getByText("Động lượng giá tổng hợp")
    ).toBeVisible()
    const marketCharts = assetsInFocus.getByRole("link", {
      name: "Mở biểu đồ thị trường: BTCUSD",
    })
    await expect(marketCharts).toHaveAttribute(
      "href",
      "/vi/market-charts?assetId=101&timeframe=1h"
    )
    await expect(
      assetsInFocus.getByRole("link", { name: "Mở Graph View" })
    ).toHaveAttribute("href", "/vi/graph-view")

    const marketNarratives = page.locator(
      'section[aria-labelledby="dashboard-market-narratives-title"]'
    )
    await expect(marketNarratives.getByRole("listitem")).toHaveCount(3)
    expect(
      await marketNarratives
        .getByRole("heading", { level: 3 })
        .allTextContents()
    ).toEqual([
      "Thanh khoản lan rộng",
      "Luận điểm chưa có tiêu đề",
      "Khẩu vị rủi ro trở lại",
    ])
    await expect(
      marketNarratives.getByText(
        "Dòng tiền đang mở rộng sang nhiều nhóm tài sản."
      )
    ).toBeVisible()
    await expect(marketNarratives.getByText("BTCUSD")).toBeVisible()
    await expect(marketNarratives.getByText("GOLD")).toBeVisible()
    await expect(marketNarratives.getByText("OIL")).toBeVisible()
    await expect(
      marketNarratives.getByText("Luận điểm chưa có tiêu đề")
    ).toBeVisible()
    await expect(
      marketNarratives.getByText(
        "Tối đa ba luận điểm được xếp hạng trong bảy ngày qua theo phạm vi hiện tại."
      )
    ).toBeVisible()
    await expect(
      marketNarratives.getByRole("link", { name: "Mở Graph View" })
    ).toHaveAttribute("href", "/vi/graph-view")

    const timelineBox = await timeline.boundingBox()
    const newsBox = await news.boundingBox()
    expect(timelineBox).not.toBeNull()
    expect(newsBox).not.toBeNull()
    if (!timelineBox || !newsBox) throw new Error("Overview cards are missing")
    expect(timelineBox.width / newsBox.width).toBeGreaterThan(1.8)
    expect(timelineBox.width / newsBox.width).toBeLessThan(2.2)
    await testInfo.attach("overview-wide.png", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
    await testInfo.attach("event-timeline-wide.png", {
      body: await timeline.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })

    const summaryRequests = (await fixture.state()).requests.filter(
      (request) =>
        request.method === "GET" && request.path === "/dashboard/summary"
    )
    expect(summaryRequests.length).toBeGreaterThan(0)
    expect(summaryRequests.every((request) => request.locale === "vi")).toBe(
      true
    )

    await marketCharts.focus()
    await expect(marketCharts).toBeFocused()
    await marketCharts.press("Enter")
    await expect(page).toHaveURL(
      /\/vi\/market-charts\?assetId=101&timeframe=1h$/,
      { timeout: 60_000 }
    )
    await page.goBack()
    await expect(
      assetsInFocus.getByRole("heading", { name: "BTCUSD · Bitcoin" })
    ).toBeVisible()

    const articleTrigger = news.getByRole("button", {
      name: "Mở bài viết: Global fixture news 1",
    })
    await articleTrigger.click()
    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("heading", { name: "Global fixture news 1" })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: "Mở trang đầy đủ" })
    ).toHaveAttribute("href", "/vi/news-articles/71")
    await expect(page).toHaveURL(/\/vi\/dashboard$/)
    await dialog.getByRole("button", { name: "Đóng" }).press("Escape")
    await expect(articleTrigger).toBeFocused()

    await untitledEventTrigger.focus()
    await untitledEventTrigger.press("Space")
    await expect(
      dialog.getByRole("heading", {
        name: "Energy demand outlook revised higher",
      })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: "Mở trang đầy đủ" })
    ).toHaveAttribute("href", "/vi/events/62")
    await dialog.getByRole("button", { name: "Đóng" }).click()
    await expect(untitledEventTrigger).toBeFocused()

    const eventTrigger = timeline.getByRole("button", {
      name: "Mở sự kiện: Central bank signals a slower easing path",
    })
    await eventTrigger.focus()
    await eventTrigger.press("Enter")
    await expect(
      dialog.getByRole("heading", {
        name: "Central bank signals a slower easing path",
      })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: "Mở trang đầy đủ" })
    ).toHaveAttribute("href", "/vi/events/61")
    await dialog.getByRole("button", { name: "Đóng" }).click()
    await expect(eventTrigger).toBeFocused()
    await expect(
      page.getByRole("link", { name: "Xem tất cả sự kiện" })
    ).toHaveAttribute("href", "/vi/events")
    await expect(
      page.getByRole("link", { name: "Xem tất cả tin tức" })
    ).toHaveAttribute("href", "/vi/news-articles")

    for (const viewport of [
      { width: 1024, height: 900, name: "compact" },
      { width: 390, height: 844, name: "mobile" },
      { width: 360, height: 780, name: "small-mobile" },
    ]) {
      await page.setViewportSize(viewport)
      await expect(timeline).toBeVisible()
      await expect(news).toBeVisible()
      const timelineMobileBox = await timeline.boundingBox()
      const newsMobileBox = await news.boundingBox()
      expect(timelineMobileBox).not.toBeNull()
      expect(newsMobileBox).not.toBeNull()
      if (!timelineMobileBox || !newsMobileBox) {
        throw new Error(`${viewport.name} Overview cards are missing`)
      }
      expect(newsMobileBox.y).toBeGreaterThan(timelineMobileBox.y)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width)
      const cards = page.locator(
        'section[aria-labelledby="dashboard-trading-snapshot-title"] > div > [data-slot="card"]'
      )
      await expect(cards).toHaveCount(4)
      const firstMetric = await cards.nth(0).boundingBox()
      const secondMetric = await cards.nth(1).boundingBox()
      const thirdMetric = await cards.nth(2).boundingBox()
      expect(firstMetric).not.toBeNull()
      expect(secondMetric).not.toBeNull()
      expect(thirdMetric).not.toBeNull()
      if (!firstMetric || !secondMetric || !thirdMetric) {
        throw new Error(`${viewport.name} metric cards are missing`)
      }
      expect(secondMetric.y).toBe(firstMetric.y)
      expect(thirdMetric.y).toBeGreaterThan(firstMetric.y)
      await testInfo.attach(`overview-${viewport.name}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      })
      await testInfo.attach(`event-timeline-${viewport.name}.png`, {
        body: await timeline.screenshot({ animations: "disabled" }),
        contentType: "image/png",
      })
    }

    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto("/en/dashboard")
    const englishSnapshot = page.locator(
      'section[aria-labelledby="dashboard-trading-snapshot-title"]'
    )
    await expect(
      englishSnapshot.getByText("Total active or emerging; no 7-day limit.")
    ).toBeVisible()
    const englishAssetsInFocus = page.locator(
      'section[aria-labelledby="dashboard-assets-in-focus-title"]'
    )
    await expect(
      englishAssetsInFocus.getByText(
        "Prioritized using relevant event or narrative context in this scope."
      )
    ).toBeVisible()
    await expect(
      englishAssetsInFocus.getByRole("heading", {
        name: "FOCUS2 · Overview focus asset 2",
      })
    ).toBeVisible()
    await expect(
      englishAssetsInFocus.getByRole("link", {
        name: "Open Market Charts: BTCUSD",
      })
    ).toHaveAttribute("href", "/en/market-charts?assetId=101&timeframe=1h")
    const englishTimeline = page.locator(
      'section[aria-labelledby="dashboard-event-timeline-title"]'
    )
    await expect(
      englishTimeline.getByRole("button", {
        name: "Open event: Untitled event",
      })
    ).toBeVisible()
    await testInfo.attach("event-timeline-english.png", {
      body: await englishTimeline.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })
    const englishNarratives = page.locator(
      'section[aria-labelledby="dashboard-market-narratives-title"]'
    )
    await expect(
      englishNarratives.getByText(
        "Up to three ranked narratives from the last seven days in this workspace."
      )
    ).toBeVisible()
    await expect(
      englishNarratives.getByRole("heading", { name: "Liquidity broadens" })
    ).toBeVisible()
    await expect(
      englishNarratives.getByRole("heading", { name: "Untitled narrative" })
    ).toBeVisible()
    await expect(
      englishNarratives.getByRole("link", { name: "Open Graph View" })
    ).toHaveAttribute("href", "/en/graph-view")
    const englishSummaryRequests = (await fixture.state()).requests.filter(
      (request) =>
        request.method === "GET" && request.path === "/dashboard/summary"
    )
    expect(
      englishSummaryRequests.some((request) => request.locale === "en")
    ).toBe(true)

    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("/vi/dashboard")
    const lightTimeline = page.locator(
      'section[aria-labelledby="dashboard-event-timeline-title"]'
    )
    await expect(
      lightTimeline.getByRole("button", {
        name: "Mở sự kiện: Chưa có tiêu đề",
      })
    ).toBeVisible()
    await testInfo.attach("event-timeline-light.png", {
      body: await lightTimeline.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })
  })

  test("reloads after workspace changes without carrying old scoped data", async ({
    page,
    fixture,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/vi/dashboard")
    await expect(
      page.getByRole("heading", { name: "Workspace Alpha" })
    ).toBeVisible()
    await expect(page.getByText("Bitcoin", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Khẩu vị rủi ro trở lại" })
    ).toBeVisible()

    await page.locator("#workspace-switcher-trigger").click()
    await page.getByRole("menuitem", { name: /Workspace Beta/ }).click()
    await expect(
      page.getByRole("heading", { name: "Workspace Beta", exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Beta only fixture asset", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "BETA · Beta only fixture asset" })
    ).toBeVisible()
    const betaChart = page.getByRole("link", {
      name: "Mở biểu đồ thị trường: BETA",
    })
    await expect(betaChart).toHaveAttribute(
      "href",
      "/vi/market-charts?assetId=201&timeframe=1h"
    )
    await expect(
      page.getByRole("heading", {
        name: "Luận điểm riêng của Workspace Beta",
      })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Khẩu vị rủi ro trở lại" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Mở Graph View" }).first()
    ).toHaveAttribute("href", "/vi/graph-view")
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện: Energy demand outlook revised higher",
      })
    ).toBeVisible()
    await expect(page.getByText("Fixture market update")).toBeVisible()
    await page.reload()

    await expect(
      page.getByRole("heading", { name: "Workspace Beta", exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Beta only fixture asset", { exact: true })
    ).toBeVisible()
    await expect(page.getByText("Bitcoin", { exact: true })).toHaveCount(0)
    await expect(
      page.getByRole("heading", {
        name: "Luận điểm riêng của Workspace Beta",
      })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "BETA · Beta only fixture asset" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "BTCUSD · Bitcoin" })
    ).toHaveCount(0)
    await expect(page.getByText("Fixture market update")).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện: Energy demand outlook revised higher",
      })
    ).toBeVisible()
    const fixtureState = await fixture.state()
    expect(
      fixtureState.requests.filter(
        (request) =>
          request.method === "GET" && request.path === "/dashboard/summary"
      ).length
    ).toBeGreaterThanOrEqual(3)
  })

  test("keeps global news available when workspace scope is missing or stale", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/me", "workspace-not-selected", "GET")
    await page.goto("/vi/dashboard")
    await expect(
      page.getByText("Chưa có không gian làm việc đang hoạt động", {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Tin tức mới nhất" })
    ).toBeVisible()
    await expect(page.getByText("Fixture market update")).toBeVisible()
    const noWorkspaceState = await fixture.state()
    expect(
      noWorkspaceState.requests.some(
        (request) =>
          request.method === "GET" && request.path === "/dashboard/summary"
      )
    ).toBe(false)

    await fixture.reset()
    await fixture.setScenario("/dashboard/summary", "scope-mismatch", "GET")
    await page.reload()
    await expect(
      page.getByText("Không gian làm việc đã thay đổi khi tải", {
        exact: true,
      })
    ).toBeVisible()
    await expect(page.getByText("Fixture market update")).toBeVisible()
    await expect(page.getByRole("button", { name: /Mở sự kiện:/ })).toHaveCount(
      0
    )
    await expect(
      page.getByRole("heading", { name: "Workspace Alpha" })
    ).toHaveCount(0)

    await fixture.reset()
    await fixture.setPermissions(["news-article:read"])
    await page.reload()
    await expect(
      page.getByText("Bạn chưa có quyền xem không gian làm việc", {
        exact: true,
      })
    ).toBeVisible()
    await expect(page.getByText("Fixture market update")).toBeVisible()
    await expect(page.getByRole("button", { name: /Mở sự kiện:/ })).toHaveCount(
      0
    )
    const permissionState = await fixture.state()
    expect(
      permissionState.requests.some(
        (request) =>
          request.method === "GET" && request.path === "/dashboard/summary"
      )
    ).toBe(false)
  })

  test("keeps independent modules visible when one Overview source fails", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/watchlists", "outage", "GET")
    await page.goto("/vi/dashboard")
    await expect(
      page.getByText("Không thể tải tài sản theo dõi", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện: Central bank signals a slower easing path",
      })
    ).toBeVisible()
    await expect(page.getByText("Fixture market update")).toBeVisible()

    await fixture.setScenario("/watchlists", "success", "GET")
    await fixture.setScenario("/dashboard/summary", "outage", "GET")
    await page.reload()
    await expect(
      page.getByText("Không thể tải tóm tắt thị trường", { exact: true })
    ).toBeVisible()
    await expect(page.getByText("Fixture market update")).toBeVisible()
    await expect(page.getByText("Bitcoin", { exact: true })).toBeVisible()

    await fixture.setScenario("/dashboard/summary", "success", "GET")
    await fixture.setScenario("/news-articles", "outage", "GET")
    await page.reload()
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện: Central bank signals a slower easing path",
      })
    ).toBeVisible()
    await expect(
      page.getByText("Không thể tải tin tức mới nhất", { exact: true })
    ).toBeVisible()

    await fixture.setScenario("/news-articles", "success", "GET")
    await fixture.setPermissions([
      "workspace:read",
      "asset:read",
      "watchlist:read",
      "event:read",
    ])
    await page.reload()
    await expect(
      page.getByText("Chưa có quyền xem tin tức mới nhất", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện: Central bank signals a slower easing path",
      })
    ).toBeVisible()
    await expect(
      page.getByText("Không khả dụng", { exact: true })
    ).toBeVisible()
  })
})
