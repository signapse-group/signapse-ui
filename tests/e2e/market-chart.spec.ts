import { expect, test } from "./fixtures"

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
    await expect(page.locator("canvas").first()).toBeVisible()
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
