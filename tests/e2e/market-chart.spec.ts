import type { Page } from "@playwright/test"

import { expect, test } from "./fixtures"

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
    await fixture.setScenario("/market-charts/live", "reconnect", "GET")
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
    const fourHourButton = page.getByRole("button", { name: "4 giờ" })
    await expect(fourHourButton).toBeEnabled()
    await fourHourButton.click()
    await expect(page).toHaveURL(/timeframe=4h/, { timeout: 15_000 })
    await expect(page.locator("#market-chart-asset")).toBeVisible()
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

  test("shows the upcoming calendar list through the next-event summary", async ({
    page,
    fixture,
  }) => {
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
})
