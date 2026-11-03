import type { Locator, Page } from "@playwright/test"

import { expect, test } from "./fixtures"

const MARKET_CHART_FIXTURE_NOW = "2026-01-15T08:00:00.000Z"

type ChartCanvasTextDraw = {
  canvas: HTMLCanvasElement
  text: string
  x: number
  y: number
}

async function trackMarketChartCanvasText(page: Page) {
  await page.addInitScript(() => {
    const trackedWindow = window as Window & {
      __sign475ChartCanvasTextDraws?: ChartCanvasTextDraw[]
    }
    trackedWindow.__sign475ChartCanvasTextDraws = []

    const nativeFillText = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      x,
      y,
      maxWidth
    ) {
      if (
        this.canvas.closest('[role="application"][aria-label="Biểu đồ giá"]')
      ) {
        trackedWindow.__sign475ChartCanvasTextDraws?.push({
          canvas: this.canvas,
          text: String(text),
          x,
          y,
        })
      }

      if (maxWidth === undefined) {
        return nativeFillText.call(this, text, x, y)
      }

      return nativeFillText.call(this, text, x, y, maxWidth)
    }
  })
}

async function expectMarketChartCanvasText(page: Page, expectedText: string) {
  await expect
    .poll(() => hasMarketChartCanvasText(page, expectedText), {
      timeout: 10_000,
    })
    .toBe(true)
}

async function hasMarketChartCanvasText(page: Page, expectedText: string) {
  return page.evaluate((text) => {
    const chart = document.querySelector(
      '[role="application"][aria-label="Biểu đồ giá"]'
    )
    const chartCanvases = new Set(
      Array.from(chart?.querySelectorAll("canvas") ?? [])
    )
    const trackedWindow = window as Window & {
      __sign475ChartCanvasTextDraws?: ChartCanvasTextDraw[]
    }

    return (
      trackedWindow.__sign475ChartCanvasTextDraws?.some(
        ({ canvas, text: drawnText }) =>
          canvas.isConnected &&
          chartCanvases.has(canvas) &&
          drawnText.trim() === text
      ) ?? false
    )
  }, expectedText)
}

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

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    )
    .toBe(true)
}

async function clearChartCanvasTextDraws(page: Page) {
  await page.evaluate(() => {
    const trackedWindow = window as Window & {
      __sign475ChartCanvasTextDraws?: ChartCanvasTextDraw[]
    }
    trackedWindow.__sign475ChartCanvasTextDraws = []
  })
}

async function expectNativeLegendShowsReadoutTime(page: Page, status: Locator) {
  const readout = await status.innerText()
  const time = readout.match(/\b\d{2}:\d{2}\b/)?.[0]

  if (!time) throw new Error(`Could not read a candle time from: ${readout}`)

  await expect
    .poll(
      () =>
        page.evaluate((expectedTime) => {
          const chart = document.querySelector(
            '[role="application"][aria-label="Biểu đồ giá"]'
          )
          const chartCanvases = new Set(
            Array.from(chart?.querySelectorAll("canvas") ?? [])
          )
          const trackedWindow = window as Window & {
            __sign475ChartCanvasTextDraws?: ChartCanvasTextDraw[]
          }

          return (
            trackedWindow.__sign475ChartCanvasTextDraws?.some(
              ({ canvas, text, y }) => {
                if (!canvas.isConnected || !chartCanvases.has(canvas)) {
                  return false
                }

                const width = canvas.getBoundingClientRect().width
                const scale = canvas.width / Math.max(width, 1)
                return text.includes(expectedTime) && y / scale <= 80
              }
            ) ?? false
          )
        }, time),
      { timeout: 5_000 }
    )
    .toBe(true)
}

async function dragChartTouch(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const session = await page.context().newCDPSession(page)

  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1, force: 1, radiusX: 1, radiusY: 1 }],
    })
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...end, id: 1, force: 1, radiusX: 1, radiusY: 1 }],
    })
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
  } finally {
    await session.detach()
  }
}

test.describe("P0 market chart workbench", () => {
  test("loads controls and renders the live quote across responsive viewports", async ({
    page,
    fixture,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.clock.setFixedTime(new Date(MARKET_CHART_FIXTURE_NOW))
    await page.setViewportSize({ width: 1520, height: 1024 })
    await trackMarketChartCanvasText(page)
    await page.addInitScript(() => localStorage.setItem("theme", "light"))
    await fixture.setScenario("/market-charts/live", "reconnect", "GET")
    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "1 giờ", exact: true })
    ).toHaveAttribute("aria-pressed", "true")
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
    await expectMarketChartCanvasText(page, "110,50")
    await expect(page.getByText(/^Cập nhật /)).toBeVisible()

    for (const [viewport, label] of [
      [{ width: 1520, height: 1024 }, "wide"],
      [{ width: 1024, height: 768 }, "compact"],
      [{ width: 390, height: 844 }, "mobile"],
    ] as const) {
      await page.setViewportSize(viewport)
      await expectNoHorizontalOverflow(page)
      await expectMarketChartCanvasText(page, "110,50")
      await expect(
        page.getByText("Giá trực tiếp", { exact: true })
      ).toBeVisible()
      await expect(page.getByText(/^Cập nhật /)).toBeVisible()
      await testInfo.attach(`sign-475-quote-${label}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      })
    }
  })

  test("shows the responsive toolbar and supports keyboard candle inspection", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    // KLineCharts paints the native legend on canvas, separately from the status node.
    await trackMarketChartCanvasText(page)
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await fixture.setScenario("/market-charts/live", "no-quote", "GET")
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const chart = page.getByRole("application", { name: "Biểu đồ giá" })
    const status = chart.locator('span[role="status"]')
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(chart).toBeVisible()
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeHidden()

    for (const timeframe of [
      "1 phút",
      "5 phút",
      "15 phút",
      "30 phút",
      "1 giờ",
      "4 giờ",
      "1 ngày",
      "1 tuần",
      "1 tháng",
    ]) {
      await expect(
        page.getByRole("button", { name: timeframe, exact: true })
      ).toBeVisible()
    }

    await expect(
      page.getByRole("button", { name: "1 giờ", exact: true })
    ).toHaveAttribute("aria-pressed", "true")
    await expect(
      page.getByText("Asia/Ho_Chi_Minh", { exact: true })
    ).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await expect(status).not.toHaveText("")
    await expect(status).toContainText("15:00")
    await expect(status).toContainText("105,00")
    await expect(status).toContainText("1,003K")
    const latestReadout = await status.innerText()
    await page.mouse.move(5, 5)
    await expect(status).toHaveText(latestReadout)
    await testInfo.attach("sign-474-wide-1520x1024", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
    const wideCanvasBounds = await page.locator("canvas").first().boundingBox()
    if (!wideCanvasBounds)
      throw new Error("Market chart canvas was not laid out")
    const hoverPoint = {
      x: wideCanvasBounds.x + wideCanvasBounds.width * 0.8,
      y: wideCanvasBounds.y + wideCanvasBounds.height * 0.45,
    }
    await page.mouse.move(5, 5)
    await page.mouse.move(hoverPoint.x, hoverPoint.y, { steps: 5 })
    await expect(status).not.toHaveText(latestReadout)
    await page.mouse.move(5, 5)
    await expect(status).toHaveText(latestReadout)

    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "1 giờ", exact: true })
    ).toBeHidden()
    await expect(
      page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Chỉ báo", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Chụp ảnh biểu đồ hiện tại" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Mở biểu đồ toàn màn hình" })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await testInfo.attach("sign-474-compact-1024x768", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 768, height: 768 })
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Thao tác khác" })
    ).toBeHidden()
    await expect(
      page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 767, height: 768 })
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Thao tác khác" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" })
    ).toBeHidden()
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 390, height: 844 })
    const moreActions = page.getByRole("button", { name: "Thao tác khác" })
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeVisible()
    await expect(moreActions).toBeVisible()
    const mobileToolbarBoxes = await Promise.all([
      page.locator("#market-chart-asset").boundingBox(),
      page.getByRole("combobox", { name: "Khung thời gian" }).boundingBox(),
      moreActions.boundingBox(),
    ])
    expect(mobileToolbarBoxes.every(Boolean)).toBe(true)
    expect(
      Math.abs(mobileToolbarBoxes[0]!.y - mobileToolbarBoxes[1]!.y)
    ).toBeLessThan(2)
    expect(
      Math.abs(mobileToolbarBoxes[1]!.y - mobileToolbarBoxes[2]!.y)
    ).toBeLessThan(2)
    await expect(
      page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" })
    ).toBeHidden()
    await expectNoHorizontalOverflow(page)
    await testInfo.attach("sign-474-mobile-390x844", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

    await moreActions.click()
    await expect(
      page.getByRole("heading", { name: "Thao tác khác" })
    ).toBeVisible()
    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    await expect(
      page.getByRole("heading", { name: "Tùy chỉnh sự kiện" })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(moreActions).toBeFocused()

    await page.setViewportSize({ width: 360, height: 800 })
    await expectNoHorizontalOverflow(page)
    const narrowToolbarBoxes = await Promise.all([
      page.locator("#market-chart-asset").boundingBox(),
      page.getByRole("combobox", { name: "Khung thời gian" }).boundingBox(),
      moreActions.boundingBox(),
    ])
    expect(narrowToolbarBoxes.every(Boolean)).toBe(true)
    expect(
      Math.abs(narrowToolbarBoxes[0]!.y - narrowToolbarBoxes[1]!.y)
    ).toBeLessThan(2)
    expect(
      Math.abs(narrowToolbarBoxes[1]!.y - narrowToolbarBoxes[2]!.y)
    ).toBeLessThan(2)
    await testInfo.attach("sign-474-mobile-360x800", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 1439, height: 900 })
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "1 giờ", exact: true })
    ).toBeHidden()
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(
      page.getByRole("combobox", { name: "Khung thời gian" })
    ).toBeHidden()
    await expect(
      page.getByRole("button", { name: "1 giờ", exact: true })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 1520, height: 1024 })
    const panCanvasBounds = await page.locator("canvas").first().boundingBox()
    if (!panCanvasBounds)
      throw new Error("Market chart canvas was not laid out")
    await clearChartCanvasTextDraws(page)
    const panStart = {
      x: panCanvasBounds.x + panCanvasBounds.width * 0.4,
      y: panCanvasBounds.y + panCanvasBounds.height * 0.5,
    }
    await page.mouse.move(panStart.x, panStart.y)
    await page.mouse.down()
    await page.mouse.move(
      panCanvasBounds.x + panCanvasBounds.width * 0.9,
      panStart.y,
      { steps: 10 }
    )
    await page.mouse.up()
    await expect(status).toHaveText(latestReadout)
    await expectNativeLegendShowsReadoutTime(page, status)
    await testInfo.attach("sign-474-pan-keeps-latest-readout", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

    await chart.focus()
    await expect(status).toHaveText(latestReadout)
    await clearChartCanvasTextDraws(page)
    await chart.press("ArrowLeft")
    await expect(status).not.toHaveText(latestReadout)
    await expectNativeLegendShowsReadoutTime(page, status)
    await testInfo.attach("sign-474-keyboard-inspection", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
    await clearChartCanvasTextDraws(page)
    await chart.press("Escape")
    await expect(status).toHaveText(latestReadout)
    await expectNativeLegendShowsReadoutTime(page, status)
    await chart.evaluate((element) => (element as HTMLElement).blur())
    await expect(status).toHaveText(latestReadout)

    await page.setViewportSize({ width: 760, height: 512 })
    await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(760)
    await expect(status).toHaveText(latestReadout)
    await expectNoHorizontalOverflow(page)
    await testInfo.attach("sign-474-effective-viewport-760x512", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  })

  test("keeps the quote chart, status, and freshness inside a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await trackMarketChartCanvasText(page)
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expectMarketChartCanvasText(page, "110,50")
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
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/^Cập nhật /)).toBeVisible()

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

    await trackMarketChartCanvasText(page)
    await fixture.setScenario("/market-charts/live", "no-quote", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await expect(
      page.getByText("Đang kết nối giá trực tiếp", { exact: true })
    ).toBeVisible()
    await expect
      .poll(() => hasMarketChartCanvasText(page, "110,50"))
      .toBe(false)
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
    await expectMarketChartCanvasText(page, "110,50")
    await expect(page.getByText(/^Cập nhật /)).toBeVisible()

    for (const [scenario, state] of [
      ["connecting-stale", "Đang kết nối giá trực tiếp"],
      ["reconnecting-stale", "Đang kết nối lại"],
    ] as const) {
      await fixture.setScenario("/market-charts/live", scenario, "GET")
      await page.reload()

      await expect(page.getByText(state, { exact: true })).toBeVisible()
      await expectMarketChartCanvasText(page, "110,50")
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
    await trackMarketChartCanvasText(page)
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
    await expectMarketChartCanvasText(page, "110,50")
  })

  test("shows reconnecting after an SSE error while EventSource retries", async ({
    page,
    fixture,
  }) => {
    await trackMarketChartCanvasText(page)
    await fixture.setScenario("/market-charts/live", "error-reconnect", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expectMarketChartCanvasText(page, "110,50")
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
    await expectMarketChartCanvasText(page, "110,50")
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

test.describe("P0 market chart touch inspection", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  })

  test("keeps native touch selection through lift, drag, and tap-to-exit", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await fixture.setScenario("/market-charts/live", "no-quote", "GET")
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const chart = page.getByRole("application", { name: "Biểu đồ giá" })
    const status = chart.locator('span[role="status"]')
    const canvas = page.locator("canvas").first()
    await expect(status).not.toHaveText("")
    const latestReadout = await status.innerText()
    const bounds = await canvas.boundingBox()
    if (!bounds) throw new Error("Market chart canvas was not laid out")

    const firstTap = {
      x: bounds.x + bounds.width * 0.82,
      y: bounds.y + bounds.height * 0.45,
    }
    const dragEnd = {
      x: bounds.x + bounds.width * 0.58,
      y: firstTap.y,
    }
    const exitTap = {
      x: bounds.x + bounds.width * 0.95,
      y: bounds.y + bounds.height * 0.35,
    }
    const reselectTap = {
      x: bounds.x + bounds.width * 0.18,
      y: bounds.y + bounds.height * 0.45,
    }

    await page.touchscreen.tap(firstTap.x, firstTap.y)
    await expect(status).not.toHaveText(latestReadout)
    const firstInspection = await status.innerText()
    await page.clock.runFor(550)
    await expect(status).toHaveText(firstInspection)

    await dragChartTouch(page, firstTap, dragEnd)
    await expect(status).not.toHaveText(firstInspection)
    const draggedInspection = await status.innerText()
    await page.clock.runFor(550)
    await expect(status).toHaveText(draggedInspection)

    await page.touchscreen.tap(exitTap.x, exitTap.y)
    await expect(status).toHaveText(latestReadout)

    await page.clock.runFor(550)
    await page.touchscreen.tap(reselectTap.x, reselectTap.y)
    await expect(status).not.toHaveText(latestReadout)
  })
})

test.describe("P0 market chart history selection", () => {
  test.use({ timezoneId: "Asia/Bangkok" })

  test("resolves a URL asset from a later watchlist page using browser time", async ({
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
    ).toHaveCount(0)
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
    await page.setViewportSize({ width: 1520, height: 1024 })
    await trackMarketChartCanvasText(page)
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await expect(page.locator("canvas").first()).toBeVisible()
    await expectMarketChartCanvasText(page, "110,50")
    const readout = page
      .getByRole("application", { name: "Biểu đồ giá" })
      .locator('span[role="status"]')
    await expect(readout).not.toHaveText("")

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
    await page.getByRole("button", { name: "4 giờ", exact: true }).click()
    await expect(page).toHaveURL(/timeframe=4h/)
    await expect
      .poll(async () =>
        (await readout.allTextContents()).every((text) => !text.trim())
      )
      .toBe(true)
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
    await clearChartCanvasTextDraws(page)
    await expect
      .poll(async () =>
        (await readout.allTextContents()).every((text) => !text.trim())
      )
      .toBe(true)

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

    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await expect(readout).toContainText("105,00")
    await expectMarketChartCanvasText(page, "2.500,25")
    expect(await hasMarketChartCanvasText(page, "110,50")).toBe(false)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible()
    expect((await fixture.state()).streamConnections).toBe(2)
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
