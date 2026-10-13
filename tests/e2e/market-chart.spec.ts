import { expect, test } from "./fixtures"

test.describe("P0 market chart workbench", () => {
  test("loads controls, changes timeframe, and recovers the live SSE stream", async ({
    page,
    fixture,
  }) => {
    test.setTimeout(180_000)
    await fixture.setScenario("/market-charts/live", "reconnect", "GET")
    await fixture.setScenario("/market-charts/candles", "empty", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(
      page.getByText("Không có dữ liệu nến cho tài sản đã chọn", {
        exact: true,
      })
    ).toBeVisible()
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
      .toBe(2)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(
      page.getByText("Giá hiện tại: 110,50", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Không có dữ liệu nến cho tài sản đã chọn", {
        exact: true,
      })
    ).toBeVisible()
    const initialRequests = await fixture.state()
    const candleRequestCount = initialRequests.requests.filter(
      (request) => request.path === "/market-charts/candles"
    ).length
    expect(candleRequestCount).toBe(1)

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
