import { expect, test } from "./fixtures"

const MARKET_CHART_FIXTURE_NOW = "2026-01-15T08:00:00.000Z"

test.describe("P0 market chart workbench", () => {
  test("loads controls, changes timeframe, and recovers the live SSE stream", async ({
    page,
    fixture,
  }) => {
    test.setTimeout(180_000)
    await fixture.setScenario("/market-charts/live", "reconnect", "GET")
    await fixture.setScenario(
      "/market-charts/candles",
      "short-then-empty-per-timeframe",
      "GET"
    )
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
      page.getByText("Chưa có sự kiện lịch kinh tế trong khoảng hiện tại.", {
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
