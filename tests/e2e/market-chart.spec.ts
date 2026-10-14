import type { Page } from "@playwright/test"

import { expect, test } from "./fixtures"

const MARKET_CHART_FIXTURE_NOW = "2026-01-15T08:00:00.000Z"

async function setAnnotationsVisible(page: Page, visible: boolean) {
  const annotationSwitch = page.getByRole("switch", {
    name: "Sự kiện",
    exact: true,
  })
  const settingsButton = page.getByRole("button", {
    name: "Mở tùy chỉnh sự kiện",
  })
  const openedSettings = !(await annotationSwitch.isVisible())

  if (openedSettings) {
    await settingsButton.click()
  }
  await expect(annotationSwitch).toBeVisible()

  if (
    (await annotationSwitch.getAttribute("aria-checked")) !== String(visible)
  ) {
    await annotationSwitch.click()
  }

  await expect(annotationSwitch).toHaveAttribute(
    "aria-checked",
    String(visible)
  )

  if (openedSettings) {
    await settingsButton.click()
    await expect(annotationSwitch).toBeHidden()
  }
}

test.describe("P0 market chart workbench", () => {
  test("loads controls, changes timeframe, and recovers the live SSE stream", async ({
    page,
    fixture,
  }) => {
    test.setTimeout(180_000)
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario("/market-charts/live", "reconnect", "GET")
    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(page.getByRole("button", { name: "1 giờ" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await expect(
      page.getByRole("button", { name: "Mở biểu đồ toàn màn hình" })
    ).toBeVisible()
    await expect(
      page
        .getByText(
          /Giá trực tiếp|Đang kết nối lại|Đang kết nối giá trực tiếp/,
          { exact: false }
        )
        .first()
    ).toBeVisible()

    await expect
      .poll(async () => (await fixture.state()).streamConnections, {
        timeout: 10_000,
      })
      .toBeGreaterThanOrEqual(2)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()
    await expect(page.locator("#market-chart-asset")).toBeEnabled()
    const fourHourButton = page.getByRole("button", { name: "4 giờ" })
    await expect(fourHourButton).toBeEnabled()
    await fourHourButton.click()
    await expect(page).toHaveURL(/timeframe=4h/, { timeout: 15_000 })
    await expect(page.locator("#market-chart-asset")).toBeEnabled({
      timeout: 30_000,
    })

    await expect
      .poll(
        async () => {
          const state = await fixture.state()

          return state.requests.filter(
            (request) =>
              request.method === "GET" &&
              request.path === "/market-charts/live" &&
              String(request.query).includes("timeframe=4h")
          ).length
        },
        {
          timeout: 15_000,
        }
      )
      .toBeGreaterThan(0)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()

    await page.locator("#market-chart-asset").click()
    await page.getByRole("option", { name: /Gold/ }).click()
    await expect(page).toHaveURL(/assetId=102/, { timeout: 15_000 })
    await expect(
      page.getByText("Giá hiện tại: 2.500,25", { exact: true })
    ).toBeVisible({ timeout: 30_000 })

    const assetRequests = await fixture.state()
    expect(
      assetRequests.requests.some(
        (request) =>
          request.method === "GET" &&
          request.path === "/market-charts/live" &&
          String(request.query).includes("assetId=102")
      )
    ).toBe(true)
  })

  test("keeps live quote details inside a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()
    await expect(page.getByText(/^Cập nhật /)).toBeVisible()

    const bounds = await page
      .locator('span[aria-live="polite"]')
      .filter({ hasText: "Giá trực tiếp" })
      .locator("..")
      .evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return {
          left: rect.left,
          right: rect.right,
          viewportWidth: document.documentElement.clientWidth,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }
      })

    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth)
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth)
  })

  test("retries exact empty history and loads sparse count-back candles", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/market-charts/candles", "empty", "GET")
    await page.goto("/vi/market-charts?assetId=102&timeframe=1h")

    await expect(
      page.getByText("Không có dữ liệu nến cho tài sản đã chọn", {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByText("Giá hiện tại: 2.500,25", { exact: true })
    ).toBeVisible({ timeout: 30_000 })

    await expect
      .poll(async () => (await fixture.state()).streamConnections, {
        timeout: 10_000,
      })
      .toBeGreaterThan(0)
    await expect(
      page.getByText("Không có dữ liệu nến cho tài sản đã chọn", {
        exact: true,
      })
    ).toBeVisible()
    const initialRequests = await fixture.state()
    expect(
      initialRequests.requests.filter(
        (request) => request.path === "/market-charts/candles"
      )
    ).toHaveLength(1)

    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await page.getByRole("button", { name: "Tải lại dữ liệu mới nhất" }).click()
    await expect(page.locator("#market-chart-asset")).toBeVisible()

    const state = await fixture.state()
    const candleRequests = state.requests.filter(
      (request) => request.path === "/market-charts/candles"
    )
    const latestCandleRequest = candleRequests.at(-1)

    expect(String(latestCandleRequest?.query)).toContain("countBack=")
    expect(String(latestCandleRequest?.query)).not.toContain("from=")
  })

  test("keeps quote freshness separate from stale, closed, and error states", async ({
    page,
    fixture,
  }) => {
    test.setTimeout(180_000)

    await fixture.setScenario("/market-charts/live", "no-quote", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await expect(
      page.getByText("Đang kết nối giá trực tiếp", { exact: true })
    ).toBeVisible()
    await expect(page.getByText(/^Giá hiện tại:/)).toHaveCount(0)
    await expect(page.getByText(/^Cập nhật /)).toHaveCount(0)

    await fixture.setScenario("/market-charts/live", "market-closed", "GET")
    await page.reload()
    await expect(
      page.getByText("Thị trường đã đóng", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Dữ liệu trực tiếp chậm", { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Lỗi dữ liệu trực tiếp", { exact: true })
    ).toHaveCount(0)
    await expect(page.getByText(/^Cập nhật /)).toHaveCount(0)

    await fixture.setScenario("/market-charts/live", "stale", "GET")
    await page.reload()
    await expect(
      page.getByText("Dữ liệu trực tiếp chậm", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()
    await expect(page.getByText(/^Cập nhật /)).toBeVisible()

    for (const [scenario, state] of [
      ["connecting-stale", "Đang kết nối giá trực tiếp"],
      ["reconnecting-stale", "Đang kết nối lại"],
    ] as const) {
      await fixture.setScenario("/market-charts/live", scenario, "GET")
      await page.reload()

      await expect(page.getByText(state, { exact: true })).toBeVisible()
      await expect(
        page.getByText("Giá hiện tại: 110,50", { exact: true })
      ).toBeVisible()
      await expect(page.getByText(/^Cập nhật .* \(dữ liệu cũ\)$/)).toBeVisible()
    }

    await fixture.setScenario("/market-charts/live", "post-open-error", "GET")
    await page.reload()
    await expect(
      page.getByText("Lỗi dữ liệu trực tiếp", { exact: true })
    ).toBeVisible()
    await expect(page.getByText(/^Cập nhật /)).toHaveCount(0)
  })

  test("shows a provider 503 before SSE opens as a terminal live error", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/live",
      "preopen-unavailable",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(
      page.getByText("Lỗi dữ liệu trực tiếp", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Đang kết nối lại", { exact: true })
    ).toHaveCount(0)
    await expect
      .poll(async () => (await fixture.state()).streamConnections)
      .toBe(0)
  })

  test("retries a live stream while Clerk provisioning is pending", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/live",
      "provisioning-pending",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(
      page.getByText("Đang kết nối lại", { exact: true })
    ).toBeVisible()
    await expect
      .poll(
        async () =>
          (await fixture.state()).requests.filter(
            (request) =>
              request.method === "GET" && request.path === "/market-charts/live"
          ).length,
        { timeout: 10_000 }
      )
      .toBeGreaterThanOrEqual(2)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 10_000,
    })
    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()
  })

  test("shows reconnecting after an SSE error while EventSource retries", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/market-charts/live", "error-reconnect", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Đang kết nối lại", { exact: true })
    ).toBeVisible()
    expect((await fixture.state()).streamConnections).toBe(1)

    await expect
      .poll(async () => (await fixture.state()).streamConnections, {
        timeout: 10_000,
      })
      .toBe(2)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible()
  })

  test("shows the upcoming calendar list through the next-event summary", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-upcoming",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const upcomingTrigger = page.getByRole("button", {
      name: /Mở lịch sắp diễn ra/,
    })
    await expect(upcomingTrigger).toBeVisible()
    await upcomingTrigger.focus()
    await expect(upcomingTrigger).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(
      page.getByRole("heading", { name: "Fixture inflation release" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Chi tiết" })).toBeVisible()

    const state = await fixture.state()
    const calendarRequest = state.requests.find(
      (request) => request.path === "/market-charts/economic-calendar-events"
    )
    expect(String(calendarRequest?.query)).toContain("impact=HIGH")
    expect(String(calendarRequest?.query)).toContain("from=")
    expect(String(calendarRequest?.query)).toContain("to=")
  })

  test("keeps all grouped annotations accessible and opens their evidence article", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await fixture.setScenario(
      "/market-charts/annotations",
      "annotations-many",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const annotationMarker = page.getByRole("button", {
      name: /Mở 125 sự kiện tại/,
    })
    await expect(annotationMarker).toBeVisible()
    await annotationMarker.click()
    await expect(
      page.getByRole("button", {
        name: /^Fixture annotation \d+$/,
      })
    ).toHaveCount(125)

    const finalEvent = page.getByRole("button", {
      name: "Fixture annotation 125",
      exact: true,
    })
    await expect(finalEvent).toBeVisible()
    await finalEvent.scrollIntoViewIfNeeded()
    await finalEvent.click()
    await expect(
      page.getByRole("heading", {
        name: "Macro liquidity conditions stabilize",
        exact: true,
      })
    ).toBeVisible()

    await page.getByRole("button", { name: "Đóng", exact: true }).click()
    const finalEvidenceAction = page
      .getByRole("link", { name: "Xem bài viết", exact: true })
      .last()
    await expect(finalEvidenceAction).toBeVisible()
    await expect(finalEvidenceAction).toHaveAttribute(
      "href",
      "/vi/news-articles/71"
    )
    await finalEvidenceAction.scrollIntoViewIfNeeded()
    await finalEvidenceAction.click()
    await expect(page).toHaveURL(/\/vi\/news-articles\/71$/)
    await expect(
      page.getByRole("heading", { name: "Fixture market update", exact: true })
    ).toBeVisible()
  })

  test("shows the warm episode source timestamp in chart details", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario(
      "/market-charts/annotations",
      "annotations-warm-episode",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1d")

    const annotationMarker = page.getByRole("button", {
      name: "Mở sự kiện Fixture warm episode",
      exact: true,
    })
    await expect(annotationMarker).toBeVisible()
    await annotationMarker.focus()
    await page.keyboard.press("Enter")

    const state = await fixture.state()
    const annotationRequest = state.requests
      .filter((request) => request.path === "/market-charts/annotations")
      .at(-1)
    const annotationTo = new URLSearchParams(
      String(annotationRequest?.query)
    ).get("to")
    expect(annotationTo).toBeTruthy()

    const expectedTime = new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(Date.parse(annotationTo ?? "") - 12 * 60 * 60 * 1000))

    await expect(
      page
        .getByRole("dialog")
        .getByText(`Bắt đầu giai đoạn: ${expectedTime}`, { exact: true })
    ).toBeVisible()
  })

  test("keeps the chart and valid annotations when an annotation refresh fails", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const annotationMarker = page.getByRole("button", {
      name: "Mở sự kiện Central bank signals a slower easing path",
      exact: true,
    })
    await expect(annotationMarker).toBeVisible()
    await setAnnotationsVisible(page, false)
    await fixture.setScenario("/market-charts/annotations", "outage", "GET")
    await setAnnotationsVisible(page, true)

    await expect(
      page.getByText("Không thể tải chú thích biểu đồ.", { exact: true })
    ).toBeVisible()
    await expect(annotationMarker).toBeVisible()
    await expect(
      page.getByText("Chưa có sự kiện trong khoảng hiện tại.", { exact: true })
    ).toHaveCount(0)

    await fixture.setScenario("/market-charts/annotations", "success", "GET")
    await setAnnotationsVisible(page, false)
    const successfulRefresh = page.waitForResponse((response) => {
      const request = response.request()
      const postData = request.postData() ?? ""

      return (
        request.method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/market-charts") &&
        postData.includes('"from"') &&
        postData.includes('"assetId":101') &&
        !postData.includes('"impact"')
      )
    })
    await setAnnotationsVisible(page, true)
    await successfulRefresh
    await expect(annotationMarker).toBeVisible()
    await expect(
      page.getByText("Không thể tải chú thích biểu đồ.", { exact: true })
    ).toHaveCount(0)
  })

  test("does not apply a delayed annotation response after changing assets", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()

    await fixture.setScenario(
      "/market-charts/annotations",
      "annotations-delayed-old-scope",
      "GET"
    )
    const oldScopeRequestCount = (await fixture.state()).requests.filter(
      (request) =>
        request.method === "GET" &&
        request.path === "/market-charts/annotations" &&
        String(request.query).includes("assetId=101")
    ).length
    await setAnnotationsVisible(page, false)
    const oldScopeResponse = page.waitForResponse((response) => {
      const request = response.request()
      const postData = request.postData() ?? ""

      return (
        request.method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/market-charts") &&
        postData.includes('"from"') &&
        postData.includes('"assetId":101') &&
        !postData.includes('"impact"')
      )
    })
    let oldScopeResponseCompleted = false
    void oldScopeResponse.then(() => {
      oldScopeResponseCompleted = true
    })
    await setAnnotationsVisible(page, true)
    await expect
      .poll(
        async () =>
          (await fixture.state()).requests.filter(
            (request) =>
              request.method === "GET" &&
              request.path === "/market-charts/annotations" &&
              String(request.query).includes("assetId=101")
          ).length,
        { timeout: 10_000 }
      )
      .toBeGreaterThan(oldScopeRequestCount)
    await page.locator("#market-chart-asset").click()
    await page.getByRole("option", { name: "XAUUSD - Gold" }).click()

    const goldAnnotation = page.getByRole("button", {
      name: "Mở sự kiện Fixture Gold annotation",
      exact: true,
    })
    expect(oldScopeResponseCompleted).toBe(false)
    await oldScopeResponse
    await expect(goldAnnotation).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole("button", {
        name: "Mở sự kiện Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)
  })

  test("keeps context visible and gates event/article details by permission", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await fixture.setPermissions(["market-chart:read", "watchlist:read"])
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const annotationMarker = page.getByRole("button", {
      name: "Mở sự kiện Central bank signals a slower easing path",
      exact: true,
    })
    await expect(annotationMarker).toBeVisible()
    await annotationMarker.click()

    const annotationDialog = page.getByRole("dialog", { name: "1 sự kiện" })
    await expect(annotationDialog).toBeVisible()
    await expect(
      annotationDialog.getByText("Fixture market update", { exact: true })
    ).toBeVisible()
    await expect(
      annotationDialog.getByText("Không có quyền xem sự kiện", { exact: true })
    ).toBeVisible()
    await expect(
      annotationDialog.getByText("Không có quyền xem bài viết", { exact: true })
    ).toBeVisible()
    await expect(annotationMarker).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Xem bài viết", exact: true })
    ).toHaveCount(0)
  })

  test("navigates to canonical article detail when permission is granted", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await fixture.setPermissions([
      "market-chart:read",
      "watchlist:read",
      "news-article:read",
    ])
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const annotationMarker = page.getByRole("button", {
      name: "Mở sự kiện Central bank signals a slower easing path",
      exact: true,
    })
    await expect(annotationMarker).toBeVisible()
    await annotationMarker.click()

    const annotationDialog = page.getByRole("dialog", { name: "1 sự kiện" })
    const articleLink = annotationDialog.getByRole("link", {
      name: "Xem bài viết",
      exact: true,
    })
    await expect(articleLink).toHaveAttribute("href", "/vi/news-articles/71")
    await articleLink.click()

    await expect(page).toHaveURL(/\/vi\/news-articles\/71$/)
    await expect(
      page.getByRole("heading", { name: "Fixture market update", exact: true })
    ).toBeVisible()
  })

  test("renders an unsafe evidence URL as text instead of a link", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/annotations",
      "annotations-unsafe-evidence-url",
      "GET"
    )
    await fixture.setPermissions(["market-chart:read", "watchlist:read"])
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await page
      .getByRole("button", {
        name: "Mở sự kiện Central bank signals a slower easing path",
        exact: true,
      })
      .click()

    const annotationDialog = page.getByRole("dialog", { name: "1 sự kiện" })
    await expect(
      annotationDialog.getByText("javascript:alert(1)", { exact: true })
    ).toBeVisible()
    await expect(
      annotationDialog.locator('a[href^="javascript:"]')
    ).toHaveCount(0)
  })

  test("filters upcoming events by impact and range and gates detail permission", async ({
    page,
    fixture,
  }) => {
    await page.clock.setFixedTime(new Date(MARKET_CHART_FIXTURE_NOW))
    await fixture.setPermissions(["market-chart:read", "watchlist:read"])
    await fixture.setScenario(
      "/market-charts/candles",
      "short-then-empty",
      "GET"
    )
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-upcoming-window",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    await page.getByRole("checkbox", { name: "Trung bình" }).click()
    await page.keyboard.press("Escape")

    const upcomingTrigger = page.getByRole("button", {
      name: /Mở lịch sắp diễn ra/,
    })
    await upcomingTrigger.click()
    const inflation = page.getByRole("heading", {
      name: "Fixture inflation release",
    })
    const employment = page.getByRole("heading", {
      name: "Fixture employment release",
    })
    await expect(inflation).toBeVisible()
    await expect(employment).toBeVisible()
    await page.getByRole("button", { name: "24 giờ tới" }).click()
    await expect(employment).toBeHidden()
    await expect(inflation).toBeVisible()

    await page.keyboard.press("Escape")
    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    const highImpact = page.getByRole("checkbox", { name: "Cao" })
    await expect(highImpact).toBeChecked()
    await highImpact.click()
    await page.keyboard.press("Escape")
    await expect
      .poll(async () => {
        const requests = (await fixture.state()).requests.filter(
          (request) =>
            request.path === "/market-charts/economic-calendar-events"
        )

        return requests.some((request) =>
          String(request.query).includes("impact=MEDIUM")
        )
      })
      .toBe(true)

    await upcomingTrigger.click()
    await expect(inflation).toBeHidden()
    await expect(
      page.getByText("Chưa có sự kiện lịch kinh tế trong khoảng hiện tại.", {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Mở Lịch kinh tế đầy đủ" })
    ).toBeVisible()
    await page.getByRole("button", { name: "7 ngày tới" }).click()
    await expect(employment).toBeVisible()
    const detailLink = page.getByRole("link", { name: "Chi tiết" })
    await expect(detailLink).toHaveAttribute(
      "href",
      "/vi/economic-calendar/902"
    )
    await detailLink.click()
    await expect(page).toHaveURL(/\/vi\/economic-calendar\/902/)
    await expect(
      page.getByText(/Bạn không có quyền xem chi tiết lịch kinh tế\./)
    ).toBeVisible()
  })

  test("keeps the full calendar link available when upcoming is empty", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-empty",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await page.getByRole("button", { name: /Mở lịch sắp diễn ra/ }).click()
    await expect(
      page
        .getByRole("main")
        .getByText("Chưa có sự kiện lịch kinh tế trong khoảng hiện tại.", {
          exact: true,
        })
    ).toBeVisible()

    await expect(
      page.getByRole("link", { name: "Mở Lịch kinh tế đầy đủ" })
    ).toHaveAttribute("href", "/vi/economic-calendar")
  })

  test("shows calendar errors without discarding candle or annotation data", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-error",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect
      .poll(async () => {
        const requests = (await fixture.state()).requests.map(
          (request) => request.path
        )

        return [
          requests.includes("/market-charts/candles"),
          requests.includes("/market-charts/annotations"),
        ]
      })
      .toEqual([true, true])

    await page.getByRole("button", { name: /Mở lịch sắp diễn ra/ }).click()
    await expect(
      page.getByText("Calendar fixture unavailable", { exact: true }).first()
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Tải lại dữ liệu mới nhất" })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(
      page.getByRole("button", { name: "4 giờ", exact: true })
    ).toBeEnabled()
    await page.getByRole("button", { name: "Chú giải sự kiện" }).click()
    await expect(
      page.getByRole("heading", { name: "Chú giải sự kiện" })
    ).toBeVisible()
    await expect(
      page.getByRole("dialog").getByText("1 mốc sự kiện", { exact: true })
    ).toBeVisible()
  })

  test("loads historical calendar markers when older candles load with markers hidden", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-historical",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toBeEnabled()
    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    const markerSwitch = page.getByRole("switch", {
      name: "Hiện lịch trên biểu đồ",
    })
    await expect(markerSwitch).toHaveAttribute("aria-checked", "true")
    await markerSwitch.click()
    await expect(markerSwitch).toHaveAttribute("aria-checked", "false")
    await page.keyboard.press("Escape")

    const chartCanvas = page.locator("canvas").first()
    const chartBounds = await chartCanvas.boundingBox()
    if (!chartBounds) {
      throw new Error("Market chart canvas was not laid out")
    }

    await page.mouse.move(
      chartBounds.x + chartBounds.width * 0.4,
      chartBounds.y + chartBounds.height * 0.5
    )
    await page.mouse.down()
    await page.mouse.move(
      chartBounds.x + chartBounds.width * 0.9,
      chartBounds.y + chartBounds.height * 0.5,
      { steps: 10 }
    )
    await page.mouse.up()

    const historicalEventTime =
      Date.parse(MARKET_CHART_FIXTURE_NOW) - 6 * 60 * 60 * 1000
    await expect
      .poll(async () => {
        const requests = (await fixture.state()).requests.filter(
          (request) =>
            request.path === "/market-charts/economic-calendar-events"
        )

        return requests.some((request) => {
          const query = new URLSearchParams(String(request.query))
          const from = Date.parse(query.get("from") ?? "")
          const to = Date.parse(query.get("to") ?? "")

          return from <= historicalEventTime && historicalEventTime < to
        })
      })
      .toBe(true)

    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    await markerSwitch.click()
    await expect(markerSwitch).toHaveAttribute("aria-checked", "true")
    await page.keyboard.press("Escape")
    const historicalMarker = page.getByRole("button", {
      name: "Mở sự kiện lịch kinh tế Fixture historical inflation release",
    })
    await expect(historicalMarker).toBeVisible()
    await historicalMarker.click()
    await expect(
      page.getByRole("heading", {
        name: "Fixture historical inflation release",
      })
    ).toBeVisible()
  })

  test("restores waiting calendar events with markers hidden through refresh and reload", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "signapse:market-charts:calendar-layer:v1",
        "false"
      )
    })
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-awaiting",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1m")

    await expect(page.locator("#market-chart-asset")).toBeVisible()
    const upcomingTrigger = page.getByRole("button", {
      name: /Mở lịch sắp diễn ra/,
    })
    await upcomingTrigger.focus()
    await page.keyboard.press("Enter")

    const awaitingLabel = page.getByText("Chờ công bố", { exact: true })
    await expect(awaitingLabel).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Fixture inflation release" })
    ).toBeVisible()
    const localTime = await page.evaluate((scheduledAt) => {
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(scheduledAt))
    }, "2026-01-15T07:30:00.000Z")
    await expect(page.getByText(localTime, { exact: true })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Mở Lịch kinh tế đầy đủ" })
    ).toBeVisible()

    const requests = (await fixture.state()).requests.filter(
      (request) => request.path === "/market-charts/economic-calendar-events"
    )
    const expectedFrom = Date.parse(MARKET_CHART_FIXTURE_NOW) - 60 * 60 * 1000
    expect(
      requests.some((request) => {
        const requestedFrom = Date.parse(
          new URLSearchParams(String(request.query)).get("from") ?? ""
        )

        return (
          requestedFrom >= expectedFrom && requestedFrom < expectedFrom + 60_000
        )
      })
    ).toBe(true)

    const refreshCount = requests.length
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await expect
      .poll(async () => {
        return (await fixture.state()).requests.filter(
          (request) =>
            request.path === "/market-charts/economic-calendar-events"
        ).length
      })
      .toBeGreaterThan(refreshCount)
    await expect(awaitingLabel).toBeVisible()

    const timedRefreshCount = (await fixture.state()).requests.filter(
      (request) => request.path === "/market-charts/economic-calendar-events"
    ).length
    await page.clock.fastForward(60_000)
    await expect
      .poll(async () => {
        return (await fixture.state()).requests.filter(
          (request) =>
            request.path === "/market-charts/economic-calendar-events"
        ).length
      })
      .toBeGreaterThan(timedRefreshCount)
    await expect(awaitingLabel).toBeVisible()

    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-available",
      "GET"
    )
    await page.reload()
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await upcomingTrigger.click()
    await expect(awaitingLabel).toBeHidden()

    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-awaiting",
      "GET"
    )
    await page.reload()
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await upcomingTrigger.click()
    await expect(awaitingLabel).toBeVisible()

    await page.goto("/vi/market-charts?assetId=101&timeframe=4h")
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "4 giờ", exact: true })
    ).toBeEnabled()
    await upcomingTrigger.click()
    await expect(awaitingLabel).toBeVisible()

    await page.keyboard.press("Escape")
    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    const markerSwitch = page.getByRole("switch", {
      name: "Hiện lịch trên biểu đồ",
    })
    await expect(markerSwitch).toHaveAttribute("aria-checked", "false")
    await markerSwitch.click()
    await expect(markerSwitch).toHaveAttribute("aria-checked", "true")
    await expect(
      page.getByText("1 sự kiện lịch kinh tế", { exact: true })
    ).toBeVisible()
    await markerSwitch.click()
    await expect(markerSwitch).toHaveAttribute("aria-checked", "false")
    await expect(
      page.getByText("1 sự kiện lịch kinh tế", { exact: true })
    ).toBeHidden()
    await page.keyboard.press("Escape")
    await upcomingTrigger.click()
    await expect(awaitingLabel).toBeVisible()

    await page.clock.setFixedTime(new Date("2026-01-15T08:29:59.000Z"))
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await expect(awaitingLabel).toBeVisible()
    await page.clock.setFixedTime(new Date("2026-01-15T08:30:00.000Z"))
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await expect(awaitingLabel).toBeHidden()
  })
})

test.describe("P0 market chart history selection", () => {
  test.use({ timezoneId: "Asia/Bangkok" })

  test("resolves a URL asset from a later watchlist page and labels timezone", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/watchlists", "chart-later-page", "GET")
    await page.goto("/vi/market-charts?assetId=9999&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toContainText(
      "LATE - Later page asset"
    )
    await expect(
      page.getByText("Múi giờ trình duyệt: Asia/Bangkok", { exact: true })
    ).toBeVisible()
    await expect
      .poll(async () => {
        const state = await fixture.state()
        return state.requests.some(
          (request) => request.path === "/market-charts/candles"
        )
      })
      .toBe(true)

    const state = await fixture.state()
    const watchlistPages = state.requests
      .filter((request) => request.path === "/watchlists")
      .map((request) => new URLSearchParams(String(request.query)).get("page"))

    expect(watchlistPages).toEqual(["0", "1"])
    const candleRequest = state.requests.find(
      (request) => request.path === "/market-charts/candles"
    )
    const query = new URLSearchParams(String(candleRequest?.query))
    expect(query.get("assetId")).toBe("9999")
    expect(query.get("to")).toMatch(/Z$/)
  })

  test("keeps empty and out-of-watchlist URLs out of chart history", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/watchlists", "empty", "GET")
    await page.goto("/vi/market-charts")

    await expect(
      page.getByText("Chưa có tài sản trong watchlist", { exact: true })
    ).toBeVisible()

    await fixture.reset()
    await page.goto("/vi/market-charts?assetId=9999&timeframe=1h")

    await expect(
      page.getByText(
        "Tài sản trên URL không nằm trong watchlist của workspace.",
        { exact: true }
      )
    ).toBeVisible()
    await expect(page.locator("canvas")).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.some(
        (request) => request.path === "/market-charts/candles"
      )
    ).toBe(false)
  })

  test("allows changing asset while the prior candle request is pending", async ({
    page,
    fixture,
  }) => {
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await expect(page.locator("canvas").first()).toBeVisible()

    await fixture.setScenario("/market-charts/candles", "delayed-outage", "GET")
    const staleResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        response.request().method() === "POST" &&
        url.pathname === "/vi/market-charts" &&
        url.searchParams.get("assetId") === "101" &&
        url.searchParams.get("timeframe") === "4h"
      )
    })
    await page.getByRole("button", { name: "4 giờ" }).click()
    await expect(page).toHaveURL(/timeframe=4h/)
    await expect
      .poll(async () => {
        const state = await fixture.state()
        return state.requests.some((request) => {
          if (request.path !== "/market-charts/candles") return false
          return (
            new URLSearchParams(String(request.query)).get("timeframe") === "4h"
          )
        })
      })
      .toBe(true)

    const assetSelector = page.locator("#market-chart-asset")
    const workbenchBusy = await assetSelector.evaluate((element) =>
      element.closest("[aria-busy]")?.getAttribute("aria-busy")
    )
    expect(workbenchBusy).toBe("true")
    expect(await assetSelector.isEnabled()).toBe(true)
    await fixture.setScenario("/market-charts/candles", "delayed", "GET")
    await assetSelector.click()
    await page.getByRole("option", { name: "XAUUSD - Gold" }).click()
    await expect(page).toHaveURL(/assetId=102/)
    await expect(assetSelector).toContainText("XAUUSD - Gold")

    await expect
      .poll(async () => {
        const state = await fixture.state()
        return state.requests.some((request) => {
          if (request.path !== "/market-charts/candles") return false
          const query = new URLSearchParams(String(request.query))
          return (
            query.get("assetId") === "102" && query.get("timeframe") === "4h"
          )
        })
      })
      .toBe(true)

    await staleResponse
    expect(
      await assetSelector.evaluate((element) =>
        element.closest("[aria-busy]")?.getAttribute("aria-busy")
      )
    ).toBe("true")
    await expect(
      page.getByText("Fixture backend is unavailable", { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Đang tải dữ liệu biểu đồ giá.", { exact: true })
    ).toBeVisible()
  })

  test("shows candle errors separately from empty history and retries", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario("/market-charts/candles", "outage", "GET")
    await page.goto("/vi/market-charts?assetId=102&timeframe=1h")

    await expect(
      page.getByText("Fixture backend is unavailable").first()
    ).toBeVisible()
    await expect(
      page.getByText("Không có dữ liệu nến cho tài sản đã chọn", {
        exact: true,
      })
    ).toHaveCount(0)

    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await page.getByRole("button", { name: "Tải lại dữ liệu mới nhất" }).click()
    await expect(
      page.getByText("Fixture backend is unavailable", { exact: true })
    ).toHaveCount(0)
    await expect(page.locator("canvas").first()).toBeVisible()
  })
})
