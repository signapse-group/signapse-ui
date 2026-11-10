import type { Locator, Page } from "@playwright/test"

import { expect, test } from "./fixtures"

const MARKET_CHART_FIXTURE_NOW = "2026-01-15T08:00:00.000Z"
const MARKET_CHART_PRIOR_BUCKET_NOW = "2026-01-15T07:00:00.000Z"

type ChartCanvasTextDraw = {
  canvas: HTMLCanvasElement
  text: string
  x: number
  y: number
}

async function trackMarketChartCanvasText(page: Page) {
  await page.addInitScript(() => {
    const trackedWindow = window as Window & {
      __sign498ChartCanvasTextDraws?: ChartCanvasTextDraw[]
    }
    trackedWindow.__sign498ChartCanvasTextDraws = []

    const nativeFillText = CanvasRenderingContext2D.prototype.fillText
    const nativeClearRect = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (
      x,
      y,
      width,
      height
    ) {
      if (
        this.canvas.closest('[role="application"][aria-label="Biểu đồ giá"]')
      ) {
        trackedWindow.__sign498ChartCanvasTextDraws =
          trackedWindow.__sign498ChartCanvasTextDraws?.filter(
            ({ canvas }) => canvas !== this.canvas
          )
      }

      return nativeClearRect.call(this, x, y, width, height)
    }
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      x,
      y,
      maxWidth
    ) {
      if (
        this.canvas.closest('[role="application"][aria-label="Biểu đồ giá"]')
      ) {
        trackedWindow.__sign498ChartCanvasTextDraws?.push({
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

async function expectNoMarketChartCanvasText(page: Page, expectedText: string) {
  await expect
    .poll(() => hasMarketChartCanvasText(page, expectedText), {
      timeout: 10_000,
    })
    .toBe(false)
}

async function expectMarketChartFreshnessClearOfAssistant(page: Page) {
  const freshnessBounds = await page
    .getByText(/^Cập nhật /)
    .locator("..")
    .boundingBox()
  const viewportWidth = await page.evaluate(
    () => document.documentElement.clientWidth
  )

  expect(freshnessBounds).not.toBeNull()
  expect(freshnessBounds!.x + freshnessBounds!.width).toBeLessThanOrEqual(
    viewportWidth - 48
  )
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
      __sign498ChartCanvasTextDraws?: ChartCanvasTextDraw[]
    }

    return (
      trackedWindow.__sign498ChartCanvasTextDraws?.some(
        ({ canvas, text: drawnText }) =>
          canvas.isConnected &&
          chartCanvases.has(canvas) &&
          drawnText.trim() === text
      ) ?? false
    )
  }, expectedText)
}

async function expectNativeLegendShowsClose(page: Page, expectedClose: string) {
  await expect
    .poll(
      () =>
        page.evaluate((close) => {
          const chart = document.querySelector(
            '[role="application"][aria-label="Biểu đồ giá"]'
          )
          const chartCanvases = new Set(
            Array.from(chart?.querySelectorAll("canvas") ?? [])
          )
          const trackedWindow = window as Window & {
            __sign498ChartCanvasTextDraws?: ChartCanvasTextDraw[]
          }

          return (
            trackedWindow.__sign498ChartCanvasTextDraws?.some(
              ({ canvas, text, y }) => {
                if (!canvas.isConnected || !chartCanvases.has(canvas)) {
                  return false
                }

                const width = canvas.getBoundingClientRect().width
                const scale = canvas.width / Math.max(width, 1)
                return y / scale <= 80 && text.includes(close)
              }
            ) ?? false
          )
        }, expectedClose),
      { timeout: 10_000 }
    )
    .toBe(true)
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

async function expectPopoverWithinViewport(
  page: Page,
  viewport: { width: number; height: number }
) {
  const popover = page.getByRole("dialog")
  await expect(popover).toBeVisible()

  const bounds = await popover.boundingBox()
  expect(bounds).not.toBeNull()
  if (!bounds) {
    return
  }

  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
  expect(bounds.y).toBeGreaterThanOrEqual(0)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height)
}

async function expectPopoverHidden(page: Page) {
  const popover = page
    .locator('[data-slot="popover-content"]')
    .filter({ hasText: "Fixture warm episode" })
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(popover).toBeHidden()
  expect(await popover.boundingBox()).toBeNull()
}

async function clearChartCanvasTextDraws(page: Page) {
  await page.evaluate(() => {
    const trackedWindow = window as Window & {
      __sign498ChartCanvasTextDraws?: ChartCanvasTextDraw[]
    }
    trackedWindow.__sign498ChartCanvasTextDraws = []
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
            __sign498ChartCanvasTextDraws?: ChartCanvasTextDraw[]
          }

          return (
            trackedWindow.__sign498ChartCanvasTextDraws?.some(
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

async function expectMarketChartCrosshairAxisLabel(
  page: Page,
  visible: boolean
) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const chart = document.querySelector(
            '[role="application"][aria-label="Biểu đồ giá"]'
          )
          const chartCanvases = new Set(
            Array.from(chart?.querySelectorAll("canvas") ?? [])
          )
          const trackedWindow = window as Window & {
            __sign498ChartCanvasTextDraws?: ChartCanvasTextDraw[]
          }

          return (
            trackedWindow.__sign498ChartCanvasTextDraws?.some(
              ({ canvas, text }) => {
                if (!canvas.isConnected || !chartCanvases.has(canvas)) {
                  return false
                }

                return /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(text.trim())
              }
            ) ?? false
          )
        }),
      { timeout: 5_000 }
    )
    .toBe(visible)
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
  test("renders a quote-updated native candle across responsive viewports", async ({
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
      .toBe(2)
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expectMarketChartCanvasText(page, "110,50")
    await expectNativeLegendShowsClose(page, "110,50")
    const chart = page.getByRole("application", { name: "Biểu đồ giá" })
    await expect(chart).toHaveAccessibleDescription(/Quote gần nhất: 110,50/)
    await expect(chart.locator('span[role="status"]')).toContainText(
      "đóng cửa 110,50; khối lượng 1,003K."
    )
    const freshness = page.getByText(/^Cập nhật /).locator("..")
    await expect(freshness).toBeVisible()

    for (const [viewport, label] of [
      [{ width: 1520, height: 1024 }, "wide"],
      [{ width: 1024, height: 768 }, "compact"],
      [{ width: 390, height: 844 }, "mobile"],
    ] as const) {
      await page.setViewportSize(viewport)
      await expectNoHorizontalOverflow(page)
      await expectMarketChartCanvasText(page, "110,50")
      await expectNativeLegendShowsClose(page, "110,50")
      await expect(chart).toHaveAccessibleDescription(/Quote gần nhất: 110,50/)
      await expect(chart.locator('span[role="status"]')).toContainText(
        "đóng cửa 110,50; khối lượng 1,003K."
      )
      await expect(
        page.getByText("Giá trực tiếp", { exact: true })
      ).toBeVisible()
      await expect(page.getByText(/^Cập nhật /)).toBeVisible()
      await expectMarketChartFreshnessClearOfAssistant(page)
      await testInfo.attach(`sign-498-native-live-candle-${label}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      })
    }

    await page.setViewportSize({ width: 360, height: 800 })
    await expectNoHorizontalOverflow(page)
    await expectMarketChartCanvasText(page, "110,50")
    await expectMarketChartFreshnessClearOfAssistant(page)
    await testInfo.attach("sign-498-native-live-candle-mobile-360", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  })

  test("starts a new live candle without inventing volume", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.clock.setFixedTime(new Date(MARKET_CHART_PRIOR_BUCKET_NOW))
    await page.setViewportSize({ width: 1520, height: 1024 })
    await trackMarketChartCanvasText(page)
    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    const chart = page.getByRole("application", { name: "Biểu đồ giá" })
    await expect(page.getByText("Giá trực tiếp", { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expectMarketChartCanvasText(page, "110,50")
    await expectNativeLegendShowsClose(page, "110,50")
    await expect(chart.locator('span[role="status"]')).toContainText(
      "mở cửa 110,50; cao nhất 110,50; thấp nhất 110,50; đóng cửa 110,50; khối lượng Chưa có."
    )
    await testInfo.attach("sign-498-native-live-candle-new-bucket", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
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
    await expect(chart).not.toHaveAccessibleDescription(/Quote gần nhất/)
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
    await expectMarketChartCrosshairAxisLabel(page, true)
    await testInfo.attach("sign-511-before-mouse-axis-reset", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

    const chartBounds = await chart.boundingBox()
    if (!chartBounds) throw new Error("Market chart region was not laid out")
    await clearChartCanvasTextDraws(page)
    await page.mouse.move(
      chartBounds.x + chartBounds.width - 4,
      chartBounds.y + chartBounds.height * 0.5
    )
    await expect(status).toHaveText(latestReadout)
    await expectNativeLegendShowsReadoutTime(page, status)
    await expectMarketChartCrosshairAxisLabel(page, false)
    await testInfo.attach("sign-511-after-mouse-axis-reset", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

    const nextHoverPoint = {
      x: wideCanvasBounds.x + wideCanvasBounds.width * 0.65,
      y: wideCanvasBounds.y + wideCanvasBounds.height * 0.35,
    }
    await page.mouse.move(nextHoverPoint.x, nextHoverPoint.y)
    await expect(status).not.toHaveText(latestReadout)
    await expectMarketChartCrosshairAxisLabel(page, true)
    await clearChartCanvasTextDraws(page)
    await page.mouse.move(5, 5)
    await expect(status).toHaveText(latestReadout)
    await expectNativeLegendShowsReadoutTime(page, status)
    await expectMarketChartCrosshairAxisLabel(page, false)
    await testInfo.attach("sign-511-after-mouse-leave-reset", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })

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
    await expectMarketChartCrosshairAxisLabel(page, false)
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

    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.getByRole("button", { name: "Nhóm đường: Đường ngang" }).click()
    await page.getByRole("menuitem", { name: "Đường dọc" }).click()
    const drawingCanvasBounds = await page
      .locator("canvas")
      .first()
      .boundingBox()
    if (!drawingCanvasBounds)
      throw new Error("Market chart canvas was not laid out")
    await page.mouse.click(
      drawingCanvasBounds.x + drawingCanvasBounds.width * 0.65,
      drawingCanvasBounds.y + drawingCanvasBounds.height * 0.4
    )
    const deleteSelectedDrawing = page
      .getByLabel("Công cụ vẽ trên biểu đồ")
      .getByRole("button", { name: "Xóa bản vẽ đang chọn" })
    await expect(deleteSelectedDrawing).toBeEnabled()
    await clearChartCanvasTextDraws(page)
    await page.mouse.move(5, 5)
    await expect(deleteSelectedDrawing).toBeEnabled()
    await expectMarketChartCrosshairAxisLabel(page, false)
    await testInfo.attach("sign-511-drawing-survives-inspection-reset", {
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
    const freshness = page.getByText(/^Cập nhật /).locator("..")
    await expect(freshness).toBeVisible()

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

    await expectMarketChartFreshnessClearOfAssistant(page)
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

    await page.clock.setFixedTime(new Date(MARKET_CHART_FIXTURE_NOW))
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
    await page.clock.setFixedTime(new Date(MARKET_CHART_FIXTURE_NOW))
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

  test("opens Next from the plot into the shared calendar event detail", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await trackMarketChartCanvasText(page)
    await fixture.setScenario("/market-charts/candles", "success", "GET")
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-upcoming",
      "GET"
    )
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark")
      window.localStorage.setItem(
        "signapse:market-charts:calendar-layer:v1",
        "false"
      )
    })
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(
      page.getByRole("application", { name: "Biểu đồ giá" })
    ).toBeVisible()
    await expectMarketChartCanvasText(page, "110,50")
    await expect
      .poll(async () => {
        const state = await fixture.state()
        return state.requests.filter(
          (request) => request.path === "/market-charts/candles"
        ).length
      })
      .toBeGreaterThan(1)
    await expect(
      page.getByText("Đang tải lịch sử...", { exact: true })
    ).toBeHidden()
    const nextTrigger = page.getByRole("button", {
      name: /Sự kiện tiếp theo: Fixture inflation release/,
    })
    const plot = page.getByTestId("market-chart-plot")
    const nextBadge = plot.getByTestId("market-chart-next-event-badge")
    await expect(nextTrigger).toBeVisible()
    await expect(nextBadge).toBeVisible()
    await expect(nextBadge).toContainText("Sự kiện tiếp theo")
    await expect(nextBadge).toContainText("Còn lại")
    await expect(nextBadge).toContainText("Fixture inflation release")
    await expect(
      page.getByTestId("market-chart-toolbar").getByRole("button", {
        name: /Sự kiện tiếp theo: Fixture inflation release/,
      })
    ).toHaveCount(0)
    const closedWideScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-badge-closed-wide-dark-1520x1024.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-badge-closed-wide-dark-1520x1024", {
      body: closedWideScreenshot,
      contentType: "image/png",
    })
    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(nextBadge).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const closedCompactScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-badge-closed-compact-1024x768.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-badge-closed-compact-1024x768", {
      body: closedCompactScreenshot,
      contentType: "image/png",
    })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await nextTrigger.focus()
    await expect(nextTrigger).toBeFocused()
    await page.keyboard.press("Enter")
    const inflation = page.getByRole("heading", {
      name: "Fixture inflation release",
      level: 3,
    })
    const eventDetail = inflation.locator("..")
    const fullDescription =
      "This long synthetic calendar description continues across several lines and remains fully readable in the chart event detail. It includes the source explanation and additional context without requiring a second detail page."
    await expect(inflation).toBeVisible()
    await expect(eventDetail.getByText("USD", { exact: true })).toBeVisible()
    await expect(
      eventDetail.getByText("Đang chờ", { exact: true })
    ).toBeVisible()
    await expect(eventDetail.getByText("Dự báo", { exact: true })).toBeVisible()
    await expect(eventDetail.getByText("3.0", { exact: true })).toBeVisible()
    await expect(
      eventDetail.getByText("Trước đó", { exact: true })
    ).toBeVisible()
    await expect(eventDetail.getByText("3.1", { exact: true })).toBeVisible()
    await expect(
      eventDetail.getByText("Không có", { exact: true })
    ).toBeVisible()
    await expect(
      eventDetail.getByText(fullDescription, { exact: true })
    ).toBeVisible()
    await expect(eventDetail.getByText(fullDescription)).not.toHaveClass(
      /line-clamp/
    )
    await expect(
      eventDetail.getByRole("link", { name: "Chi tiết" })
    ).toHaveCount(0)

    const wideScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-detail-wide-dark.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-event-detail-wide-dark", {
      body: wideScreenshot,
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(inflation).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const compactScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-detail-compact-1024x768.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-event-detail-compact-1024x768", {
      body: compactScreenshot,
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 760, height: 512 })
    await expect(inflation).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const effectiveZoomScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-detail-effective-200pct-760x512.png",
      animations: "disabled",
    })
    await testInfo.attach(
      "SIGN-543-next-event-detail-effective-200pct-760x512",
      {
        body: effectiveZoomScreenshot,
        contentType: "image/png",
      }
    )

    await page.setViewportSize({ width: 360, height: 800 })
    await page.emulateMedia({ colorScheme: "light" })
    await expect(inflation).toBeVisible()
    const detailBounds = await eventDetail.boundingBox()
    expect(detailBounds?.x).toBeGreaterThanOrEqual(0)
    expect(
      (detailBounds?.x ?? 0) + (detailBounds?.width ?? 0)
    ).toBeLessThanOrEqual(360)
    const mobileScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-detail-mobile-360.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-event-detail-mobile-light", {
      body: mobileScreenshot,
      contentType: "image/png",
    })

    await page.keyboard.press("Escape")
    await expect(nextTrigger).toBeFocused()
    const mobileActionsButton = page.getByRole("button", {
      name: "Thao tác khác",
    })
    await mobileActionsButton.click()
    const mobileActionsDialog = page.getByRole("dialog", {
      name: "Thao tác khác",
    })
    await expect(
      mobileActionsDialog.getByRole("button", {
        name: /Sự kiện tiếp theo: Fixture inflation release/,
      })
    ).toHaveCount(0)
    await expect(
      plot.getByTestId("market-chart-next-event-badge")
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.keyboard.press("Escape")
    await expect(mobileActionsButton).toBeFocused()
    const mobileClosedScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-badge-closed-mobile-360.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-badge-closed-mobile-360", {
      body: mobileClosedScreenshot,
      contentType: "image/png",
    })

    for (const width of [360, 390, 767, 768, 1439, 1440, 760]) {
      await page.setViewportSize({ width, height: 844 })
      await expect(nextTrigger).toBeVisible()
      await expect(
        page
          .getByTestId("market-chart-plot")
          .getByTestId("market-chart-next-event-badge")
      ).toBeVisible()
      await expect(
        page.getByTestId("market-chart-toolbar").getByRole("button", {
          name: /Sự kiện tiếp theo: Fixture inflation release/,
        })
      ).toHaveCount(0)
      await expectNoHorizontalOverflow(page)

      if (width < 768) {
        const moreActionsButton = page.getByRole("button", {
          name: "Thao tác khác",
        })
        await expect(moreActionsButton).toBeVisible()
        await moreActionsButton.click()
        await expect(
          page
            .getByRole("dialog", { name: "Thao tác khác" })
            .getByRole("button", {
              name: /Sự kiện tiếp theo: Fixture inflation release/,
            })
        ).toHaveCount(0)
        await page.keyboard.press("Escape")
      } else {
        await expect(
          page.getByRole("button", { name: "Thao tác khác" })
        ).toBeHidden()
        await expect(
          page.getByRole("dialog", { name: "Thao tác khác" })
        ).toBeHidden()
      }
    }

    await page.setViewportSize({ width: 1520, height: 1024 })
    const fullscreenButton = page
      .getByTestId("market-chart-toolbar")
      .getByRole("button", { name: "Mở biểu đồ toàn màn hình" })
    await fullscreenButton.click()
    const fullscreenSurface = page.locator('section[data-fullscreen="true"]')
    await expect(fullscreenSurface).toBeVisible()
    await expect(
      fullscreenSurface.getByTestId("market-chart-next-event-badge")
    ).toBeVisible()
    await expect(
      page.getByText("Đang tải lịch sử...", { exact: true })
    ).toBeHidden()
    const fullscreenClosedScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-badge-closed-fullscreen-dark.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-badge-closed-fullscreen-dark", {
      body: fullscreenClosedScreenshot,
      contentType: "image/png",
    })
    await nextTrigger.focus()
    await page.keyboard.press("Enter")
    await expect(inflation).toBeVisible()
    await expect(
      page.getByText("Đang tải lịch sử...", { exact: true })
    ).toBeHidden()
    const fullscreenDetailScreenshot = await page.screenshot({
      path: "test-results/SIGN-543-next-detail-fullscreen-dark.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-543-next-detail-fullscreen-dark", {
      body: fullscreenDetailScreenshot,
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(nextTrigger).toBeFocused()
    await page.getByRole("button", { name: "Thoát toàn màn hình" }).click()
    await expect(page.locator('section[data-fullscreen="false"]')).toBeVisible()

    const state = await fixture.state()
    const calendarRequest = state.requests.find(
      (request) => request.path === "/market-charts/economic-calendar-events"
    )
    expect(String(calendarRequest?.query)).toContain("impact=HIGH")
    expect(String(calendarRequest?.query)).toContain("from=")
    expect(String(calendarRequest?.query)).toContain("to=")
  })

  test.describe("mobile Next badge", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

    test("opens shared event detail by tapping the plot badge", async ({
      page,
      fixture,
    }, testInfo) => {
      await page.emulateMedia({ colorScheme: "light" })
      await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
      await trackMarketChartCanvasText(page)
      await fixture.setScenario("/market-charts/candles", "success", "GET")
      await fixture.setScenario(
        "/market-charts/economic-calendar-events",
        "calendar-upcoming",
        "GET"
      )
      await page.addInitScript(() => {
        window.localStorage.setItem("theme", "light")
        window.localStorage.setItem(
          "signapse:market-charts:calendar-layer:v1",
          "false"
        )
      })
      await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

      await expectMarketChartCanvasText(page, "110,50")
      await expect
        .poll(async () => {
          const state = await fixture.state()
          return state.requests.filter(
            (request) => request.path === "/market-charts/candles"
          ).length
        })
        .toBeGreaterThan(1)
      await expect(
        page.getByText("Đang tải lịch sử...", { exact: true })
      ).toBeHidden()
      const plot = page.getByTestId("market-chart-plot")
      const nextBadge = plot.getByRole("button", {
        name: /Sự kiện tiếp theo: Fixture inflation release/,
      })
      await expect(nextBadge).toBeVisible()
      await expect(
        page.getByTestId("market-chart-toolbar").getByRole("button", {
          name: /Sự kiện tiếp theo: Fixture inflation release/,
        })
      ).toHaveCount(0)
      const closedScreenshot = await page.screenshot({
        path: "test-results/SIGN-543-next-badge-closed-mobile-390-light.png",
        animations: "disabled",
      })
      await testInfo.attach("SIGN-543-next-badge-closed-mobile-390-light", {
        body: closedScreenshot,
        contentType: "image/png",
      })

      await nextBadge.tap()
      const inflation = page.getByRole("heading", {
        name: "Fixture inflation release",
        level: 3,
      })
      await expect(inflation).toBeVisible()
      const detailScreenshot = await page.screenshot({
        path: "test-results/SIGN-543-next-detail-mobile-390-light.png",
        animations: "disabled",
      })
      await testInfo.attach("SIGN-543-next-detail-mobile-390-light", {
        body: detailScreenshot,
        contentType: "image/png",
      })
      await page.keyboard.press("Escape")
      await expect(nextBadge).toBeFocused()
    })
  })

  test("keeps all grouped HOT annotations accessible through Event quick detail", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "market-chart:read",
      "watchlist:read",
      "event:read",
      "news-article:read",
    ])
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
    await page.setViewportSize({ width: 1520, height: 1024 })
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
    await finalEvent.focus()
    await finalEvent.press("Enter")

    const eventQuickDetail = page.locator('[data-quick-detail-profile="event"]')
    await expect(eventQuickDetail).toBeVisible()
    await expect(
      eventQuickDetail.getByRole("heading", {
        name: "Macro liquidity conditions stabilize",
        exact: true,
      })
    ).toBeVisible()
    const articleLink = eventQuickDetail.getByRole("link", {
      name: "Xem bài viết",
      exact: true,
    })
    await expect(articleLink).toHaveAttribute("href", "/vi/news-articles/71")
    await testInfo.attach("SIGN-476-event-quick-detail-wide-1520x1024", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })

    await page.keyboard.press("Escape")
    await expect(eventQuickDetail).toBeHidden()
    await expect(finalEvent).toBeFocused()
    const annotationDetail = page
      .getByRole("dialog")
      .filter({ has: finalEvent })
    await expect(
      annotationDetail.getByText("Fixture evidence 125")
    ).toHaveCount(0)
    await expect(
      annotationDetail.getByRole("link", { name: "Xem bài viết", exact: true })
    ).toHaveCount(0)
    await expect(
      annotationDetail.getByRole("link", { name: "Mở bài gốc", exact: true })
    ).toHaveCount(0)
    await testInfo.attach("SIGN-476-hot-annotation-detail-wide-1520x1024", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })

    await finalEvent.press("Enter")
    await expect(eventQuickDetail).toBeVisible()
    await eventQuickDetail
      .getByRole("link", { name: "Xem bài viết", exact: true })
      .click()
    await expect(page).toHaveURL(/\/vi\/news-articles\/71$/, {
      timeout: 30_000,
    })
    await expect(
      page.getByRole("heading", { name: "Fixture market update", exact: true })
    ).toBeVisible()
  })

  test("shows ordered Warm snapshots with their own reasoning and reaction", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
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
    const periodStart =
      Date.parse(MARKET_CHART_FIXTURE_NOW) - 2 * 24 * 60 * 60 * 1000
    const annotationRequest = state.requests
      .filter((request) => request.path === "/market-charts/annotations")
      .find((request) => {
        const params = new URLSearchParams(String(request.query))
        const from = Date.parse(params.get("from") ?? "")
        const to = Date.parse(params.get("to") ?? "")

        return from <= periodStart && periodStart < to
      })
    const annotationParams = new URLSearchParams(
      String(annotationRequest?.query)
    )
    const annotationFrom = annotationParams.get("from")
    const annotationTo = annotationParams.get("to")
    expect(annotationRequest).toBeTruthy()
    expect(annotationFrom).toBeTruthy()
    expect(annotationTo).toBeTruthy()
    const periodStartTime = new Date(periodStart).toISOString()
    const periodStartTimestamp = Date.parse(periodStartTime)
    expect(periodStartTimestamp).toBeGreaterThanOrEqual(
      Date.parse(annotationFrom ?? "")
    )
    expect(periodStartTimestamp).toBeLessThan(Date.parse(annotationTo ?? ""))

    const expectedTime = await page.evaluate(
      (value) =>
        new Intl.DateTimeFormat("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date(value)),
      periodStartTime
    )

    const detail = page.getByRole("dialog")
    await expect(annotationMarker).toHaveAttribute("aria-pressed", "true")
    await expect(detail).toBeVisible()
    await expectPopoverWithinViewport(page, { width: 1520, height: 1024 })
    await expect(
      detail.getByText(`Bắt đầu giai đoạn: ${expectedTime}`, { exact: true })
    ).toBeVisible()
    await expect(detail.getByText("Tóm tắt giai đoạn")).toBeVisible()
    await expect(detail.getByText("Fixture warm episode")).toBeVisible()

    const snapshots = detail.locator("article")
    await expect(snapshots).toHaveCount(2)
    await expect(snapshots.locator("h4")).toHaveText([
      "U.S. debt snapshot",
      "UAE trade snapshot",
    ])

    const firstSnapshot = snapshots.nth(0)
    const secondSnapshot = snapshots.nth(1)
    const firstTitle = firstSnapshot.getByRole("heading", {
      name: "U.S. debt snapshot",
      exact: true,
    })
    const secondTitle = secondSnapshot.getByRole("heading", {
      name: "UAE trade snapshot",
      exact: true,
    })
    await expect(firstTitle).toBeVisible()
    await expect(secondTitle).toBeVisible()
    expect(
      await firstTitle.evaluate((title) => title.closest("a,button"))
    ).toBe(null)
    expect(
      await secondTitle.evaluate((title) => title.closest("a,button"))
    ).toBe(null)

    await expect(detail.getByText("Lý giải", { exact: true })).toHaveCount(1)
    await expect(
      firstSnapshot.getByText(
        "Persistent deficits may increase demand for inflation hedges over the medium term.",
        { exact: true }
      )
    ).toBeVisible()
    await expect(
      secondSnapshot.getByText("Lý giải", { exact: true })
    ).toHaveCount(0)

    await expect(firstSnapshot.getByText("Chủ thể chính")).toBeVisible()
    await expect(firstSnapshot.getByText("Tích cực")).toBeVisible()
    await expect(firstSnapshot.getByText("MEDIUM_TERM")).toBeVisible()
    await expect(firstSnapshot.getByText("Tin cậy 70%")).toBeVisible()
    await expect(firstSnapshot.getByText("Tiêu cực")).toHaveCount(0)
    await expect(firstSnapshot.getByText("Tin cậy 5%")).toHaveCount(0)

    await expect(secondSnapshot.getByText("Tài sản bị ảnh hưởng")).toBeVisible()
    await expect(secondSnapshot.getByText("Tiêu cực")).toBeVisible()
    await expect(secondSnapshot.getByText("SHORT_TERM")).toBeVisible()
    await expect(secondSnapshot.getByText("Tin cậy 35%")).toBeVisible()
    await expect(secondSnapshot.getByText("Tích cực")).toHaveCount(0)
    await expect(secondSnapshot.getByText("Tin cậy 95%")).toHaveCount(0)

    await testInfo.attach("SIGN-478-warm-period-dark-wide", {
      body: await page.screenshot({ animations: "disabled", fullPage: true }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 760, height: 512 })
    await expect(annotationMarker).toHaveAttribute("aria-pressed", "true")
    await expectPopoverHidden(page)
    const resizedDetailTitle = page.getByRole("main").getByRole("heading", {
      name: "U.S. debt snapshot",
      exact: true,
    })
    await expect(resizedDetailTitle).toBeVisible()
    await resizedDetailTitle.scrollIntoViewIfNeeded()
    await expect(resizedDetailTitle).toBeInViewport()
    await expect(
      page.getByRole("main").getByText("Lý giải", { exact: true })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await testInfo.attach("SIGN-478-warm-period-dark-resize-760", {
      body: await page.screenshot({ animations: "disabled", fullPage: true }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 767, height: 512 })
    await expectPopoverHidden(page)
    await expect(
      page.getByRole("main").getByRole("heading", {
        name: "U.S. debt snapshot",
        exact: true,
      })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 768, height: 768 })
    await annotationMarker.scrollIntoViewIfNeeded()
    await expect(detail).toBeVisible()
    await expectPopoverWithinViewport(page, { width: 768, height: 768 })
    await expectNoHorizontalOverflow(page)

    await page.emulateMedia({ colorScheme: "light" })
    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(detail).toBeVisible()
    await expectPopoverWithinViewport(page, { width: 1024, height: 768 })
    await expectNoHorizontalOverflow(page)
    await testInfo.attach("SIGN-478-warm-period-light-compact", {
      body: await page.screenshot({ animations: "disabled", fullPage: true }),
      contentType: "image/png",
    })

    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 390, height: 844 })
    await expectPopoverHidden(page)
    await expect(
      page.getByRole("main").getByRole("heading", {
        name: "U.S. debt snapshot",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("main").getByRole("heading", {
        name: "UAE trade snapshot",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole("main")
        .getByText(
          "Persistent deficits may increase demand for inflation hedges over the medium term.",
          { exact: true }
        )
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await testInfo.attach("SIGN-478-warm-period-dark-mobile", {
      body: await page.screenshot({ animations: "disabled", fullPage: true }),
      contentType: "image/png",
    })
    await page.setViewportSize({ width: 360, height: 844 })
    await expectPopoverHidden(page)
    await expect(
      page.getByRole("main").getByRole("heading", {
        name: "U.S. debt snapshot",
        exact: true,
      })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
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

  test("keeps HOT context visible and requires Event access before evidence", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await fixture.setScenario(
      "/market-charts/annotations",
      "annotations-hot-event-reaction",
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
    await expect(annotationDialog).toBeVisible()
    await expect(
      annotationDialog.getByText(
        "Synthetic chart annotation for the browser quality gate.",
        { exact: true }
      )
    ).toBeVisible()
    await expect(annotationDialog.getByText(/Dự đoán/)).toBeVisible()
    await expect(
      annotationDialog.getByText("Tích cực", { exact: true })
    ).toBeVisible()
    const state = await fixture.state()
    const annotationRequest = state.requests.find(
      (request) => request.path === "/market-charts/annotations"
    )
    const annotationParams = new URLSearchParams(
      String(annotationRequest?.query)
    )
    const annotationTime = new Date(
      Date.parse(annotationParams.get("to") ?? "") - 1000
    )
    const expectedTimestamp = await page.evaluate(
      (value) =>
        new Intl.DateTimeFormat("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value)),
      annotationTime.toISOString()
    )
    await expect(
      annotationDialog.getByText(expectedTimestamp, { exact: true })
    ).toBeVisible()
    await expect(
      annotationDialog
        .getByRole("status")
        .getByText("Không có quyền xem sự kiện", { exact: true })
    ).toBeVisible()
    await expect(
      annotationDialog.getByText("Fixture market update")
    ).toHaveCount(0)
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(annotationMarker).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)
    await expect(
      annotationDialog.getByRole("link", { name: "Xem bài viết", exact: true })
    ).toHaveCount(0)
    await expect(
      annotationDialog.getByRole("link", { name: "Mở bài gốc", exact: true })
    ).toHaveCount(0)
  })

  test("navigates to the canonical News page from Event quick detail", async ({
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
      "event:read",
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
    await annotationDialog
      .getByRole("button", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
      .click()

    const eventQuickDetail = page.locator('[data-quick-detail-profile="event"]')
    await expect(eventQuickDetail).toBeVisible()
    const articleLink = eventQuickDetail.getByRole("link", {
      name: "Xem bài viết",
      exact: true,
    })
    await expect(articleLink).toHaveAttribute("href", "/vi/news-articles/71")
    await articleLink.click()

    await expect(page).toHaveURL(/\/vi\/news-articles\/71$/, {
      timeout: 30_000,
    })
    await expect(
      page.getByRole("heading", { name: "Fixture market update", exact: true })
    ).toBeVisible()
  })

  test("does not expose HOT evidence or its URL in annotation detail", async ({
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
    ).toHaveCount(0)
    await expect(
      annotationDialog.getByText("Fixture market update", { exact: true })
    ).toHaveCount(0)
    await expect(annotationDialog.getByRole("link")).toHaveCount(0)
  })

  test("filters Next by impact independently of chart marker visibility", async ({
    page,
    fixture,
  }) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
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
    await expect(page.locator("#market-chart-asset")).toBeVisible()

    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    const mediumImpact = page.getByRole("checkbox", { name: "Trung bình" })
    await mediumImpact.click()
    await expect(mediumImpact).toBeChecked()
    await expect(page.getByRole("checkbox", { name: "Cao" })).toBeChecked()
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
    await page.keyboard.press("Escape")
    await expect(mediumImpact).toBeHidden()

    await page.getByRole("button", { name: "Mở tùy chỉnh sự kiện" }).click()
    const highImpact = page.getByRole("checkbox", { name: "Cao" })
    await highImpact.click()
    await expect(highImpact).not.toBeChecked()
    await page.keyboard.press("Escape")

    const nextTrigger = page.getByRole("button", {
      name: /Sự kiện tiếp theo: Fixture employment release/,
    })
    await nextTrigger.click()
    const employment = page.getByRole("heading", {
      name: "Fixture employment release",
      level: 3,
    })
    const employmentDetail = page.getByRole("dialog", {
      name: "Fixture employment release",
    })
    await expect(employmentDetail).toBeVisible()
    await expect(employment).toBeVisible()
    await expect(
      employmentDetail.getByText("USD", { exact: true })
    ).toBeVisible()
    await expect(
      employmentDetail.getByText("Dự báo", { exact: true })
    ).toBeVisible()
    await expect(
      employmentDetail.getByText("3.0", { exact: true })
    ).toBeVisible()
    await expect(
      employmentDetail.getByText("Synthetic calendar event.", { exact: true })
    ).toBeVisible()
    await expect(
      employmentDetail.getByRole("link", { name: "Chi tiết" })
    ).toHaveCount(0)
    await expect(page).toHaveURL(
      /\/vi\/market-charts\?assetId=101&timeframe=1h/
    )
  })

  test("keeps Next empty and disabled when the synced calendar has no event", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-empty",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    const nextTrigger = page.getByRole("button", {
      name: /Sự kiện tiếp theo: Chưa có sự kiện phù hợp trong dữ liệu lịch đã đồng bộ trong 7 ngày tới\./,
    })
    await expect(nextTrigger).toBeDisabled()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("announces Next becoming empty without moving focus", async ({
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

    const nextStatus = page.getByTestId("market-chart-next-event-status")
    await expect(nextStatus).toContainText("Fixture inflation release")
    const assetControl = page.locator("#market-chart-asset")
    await assetControl.focus()
    await expect(assetControl).toBeFocused()

    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-empty",
      "GET"
    )
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    await expect(nextStatus).toContainText(
      "Chưa có sự kiện phù hợp trong dữ liệu lịch đã đồng bộ trong 7 ngày tới."
    )
    await expect(
      page.getByRole("button", { name: /Sự kiện tiếp theo:/ })
    ).toBeDisabled()
    await expect(assetControl).toBeFocused()
  })

  test("shows calendar errors without discarding candle or annotation data", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.clock.install({ time: new Date(MARKET_CHART_FIXTURE_NOW) })
    await page.setViewportSize({ width: 1520, height: 1024 })
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

    const calendarError = "Không thể tải sự kiện lịch kinh tế."
    await expect(page.getByTestId("market-chart-next-event-status")).toHaveText(
      calendarError
    )
    await expect(
      page.getByRole("button", { name: /Sự kiện tiếp theo:/ })
    ).toContainText(calendarError)
    await expect(
      page.getByText("Calendar fixture unavailable", { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Tải lại dữ liệu mới nhất" })
    ).toBeVisible()
    const failureScreenshot = await page.screenshot({
      path: "test-results/SIGN-479-next-refresh-error-wide.png",
      animations: "disabled",
    })
    await testInfo.attach("SIGN-479-next-refresh-error-wide", {
      body: failureScreenshot,
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(page.locator("#market-chart-timeframe-selector")).toBeEnabled()
    await page.getByRole("button", { name: "Chú giải sự kiện" }).click()
    await expect(
      page.getByRole("heading", { name: "Chú giải sự kiện" })
    ).toBeVisible()
    await expect(
      page.getByRole("dialog").getByText("1 mốc sự kiện", { exact: true })
    ).toBeVisible()
  })

  test("retries the failed daily history page in place", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.clock.setFixedTime(new Date(MARKET_CHART_FIXTURE_NOW))
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))
    await fixture.setScenario(
      "/market-charts/candles",
      "daily-history-retry",
      "GET"
    )
    await fixture.setScenario(
      "/market-charts/live",
      "daily-history-retry",
      "GET"
    )
    await page.goto("/vi/market-charts?assetId=102&timeframe=1d")

    const chart = page.getByRole("application", { name: "Biểu đồ giá" })
    const retry = page.getByRole("button", { name: "Thử lại", exact: true })
    const anchors = async () =>
      (await fixture.state()).requests
        .filter((request) => request.path === "/market-charts/candles")
        .map((request) => new URLSearchParams(String(request.query)).get("to"))
    const panLeft = async () => {
      const bounds = await chart.locator("canvas").first().boundingBox()
      if (!bounds) throw new Error("Chart canvas was not laid out")
      await page.mouse.move(
        bounds.x + bounds.width * 0.25,
        bounds.y + bounds.height * 0.5
      )
      await page.mouse.down()
      await page.mouse.move(
        bounds.x + bounds.width * 0.9,
        bounds.y + bounds.height * 0.5,
        { steps: 10 }
      )
      await page.mouse.up()
    }

    await expect(chart).toBeVisible()
    if (!(await retry.isVisible())) await panLeft()
    await expect(retry).toBeVisible()
    const [initial, failed] = await anchors()
    expect(failed).toMatch(/T22:00:00/)
    await expect(chart).toHaveAccessibleDescription(/Quote gần nhất:/)
    const quote = chart.getByText(/^Quote gần nhất:/)
    const previousQuote = await quote.textContent()
    await expect.poll(() => quote.textContent()).not.toBe(previousQuote)
    await expect(retry).toBeVisible()
    await panLeft()
    expect(await anchors()).toEqual([initial, failed])

    await testInfo.attach("sign-575-history-retry-wide", {
      body: await page.screenshot(),
      contentType: "image/png",
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await expect(retry).toBeInViewport()
    await testInfo.attach("sign-575-history-retry-mobile", {
      body: await page.screenshot(),
      contentType: "image/png",
    })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await retry.focus()
    await page.keyboard.press("Enter")
    await page.keyboard.press("Enter")
    await expect(retry).toHaveAttribute("aria-disabled", "false")
    expect(await anchors()).toEqual([initial, failed, failed])

    await retry.click({ timeout: 5000 })
    await expect(retry).toBeHidden()
    await expect
      .poll(async () => (await anchors()).slice(0, 4))
      .toEqual([initial, failed, failed, failed])
    await panLeft()
    await expect.poll(async () => (await anchors()).length).toBe(5)
    const last = (await anchors()).at(-1)
    expect(Date.parse(last ?? "")).toBeLessThan(Date.parse(failed ?? ""))
    await panLeft()
    await expect(retry).toBeHidden()
    expect(await anchors()).toHaveLength(5)
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

  test("refreshes Next with markers hidden and does not surface past waiting events", async ({
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
    await expect(
      page.getByRole("application", { name: "Biểu đồ giá" })
    ).toBeVisible()
    const nextTrigger = page.getByRole("button", {
      name: /Sự kiện tiếp theo:/,
    })
    await expect(nextTrigger).toBeDisabled()
    await expect(nextTrigger).toHaveAccessibleName(
      /Chưa có sự kiện phù hợp trong dữ liệu lịch đã đồng bộ trong 7 ngày tới/
    )
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: "Fixture inflation release" })
    ).toHaveCount(0)

    const expectedFrom = Date.parse(MARKET_CHART_FIXTURE_NOW) - 60 * 60 * 1000
    const earliestExpectedTo =
      Date.parse(MARKET_CHART_FIXTURE_NOW) + 7 * 24 * 60 * 60 * 1000 - 60_000
    const calendarRequests = () =>
      fixture
        .state()
        .then(({ requests }) =>
          requests.filter(
            (request) =>
              request.path === "/market-charts/economic-calendar-events"
          )
        )
    const getRequestWindow = (request: Record<string, unknown>) => {
      const query = new URLSearchParams(String(request.query))

      return {
        from: Date.parse(query.get("from") ?? ""),
        to: Date.parse(query.get("to") ?? ""),
      }
    }
    const isFutureCalendarRequest = (request: Record<string, unknown>) => {
      const { from, to } = getRequestWindow(request)

      return to - from === 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
    }
    await expect
      .poll(async () => {
        const requests = await calendarRequests()

        return requests.some((request) => {
          const { from, to } = getRequestWindow(request)

          return (
            isFutureCalendarRequest(request) &&
            from >= expectedFrom &&
            from < expectedFrom + 60_000 &&
            to >= earliestExpectedTo
          )
        })
      })
      .toBe(true)

    const futureRefreshCount = async () =>
      (await calendarRequests()).filter(isFutureCalendarRequest).length
    const refreshCount = await futureRefreshCount()
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await expect
      .poll(async () => {
        return futureRefreshCount()
      })
      .toBeGreaterThan(refreshCount)
    await expect(nextTrigger).toBeDisabled()

    const timedRefreshCount = await futureRefreshCount()
    await page.clock.fastForward(60_000)
    await expect
      .poll(async () => {
        return futureRefreshCount()
      })
      .toBeGreaterThan(timedRefreshCount)
    await expect(nextTrigger).toBeDisabled()

    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-available",
      "GET"
    )
    await page.reload()
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(nextTrigger).toBeDisabled()

    await fixture.setScenario(
      "/market-charts/economic-calendar-events",
      "calendar-awaiting",
      "GET"
    )
    await page.reload()
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(nextTrigger).toBeDisabled()

    await page.goto("/vi/market-charts?assetId=101&timeframe=4h")
    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await expect(page.locator("#market-chart-timeframe-selector")).toBeEnabled()
    await expect(nextTrigger).toBeDisabled()
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
    await expect(nextTrigger).toBeDisabled()

    await page.clock.setFixedTime(new Date("2026-01-15T08:29:59.000Z"))
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await expect(nextTrigger).toBeDisabled()
    await page.clock.setFixedTime(new Date("2026-01-15T08:30:00.000Z"))
    await page.evaluate(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await expect(nextTrigger).toBeDisabled()
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
    await trackMarketChartCanvasText(page)
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
    await expectMarketChartCrosshairAxisLabel(page, true)
    const firstInspection = await status.innerText()
    await page.clock.runFor(550)
    await expect(status).toHaveText(firstInspection)

    await dragChartTouch(page, firstTap, dragEnd)
    await expect(status).not.toHaveText(firstInspection)
    const draggedInspection = await status.innerText()
    await page.clock.runFor(550)
    await expect(status).toHaveText(draggedInspection)

    await clearChartCanvasTextDraws(page)
    await page.touchscreen.tap(exitTap.x, exitTap.y)
    await expect(status).toHaveText(latestReadout)
    await expectNativeLegendShowsReadoutTime(page, status)
    await expectMarketChartCrosshairAxisLabel(page, false)

    await page.clock.runFor(550)
    await page.touchscreen.tap(reselectTap.x, reselectTap.y)
    await expect(status).not.toHaveText(latestReadout)
    await expectMarketChartCrosshairAxisLabel(page, true)
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
    await page.clock.setFixedTime(new Date(MARKET_CHART_FIXTURE_NOW))
    await page.setViewportSize({ width: 1520, height: 1024 })
    await trackMarketChartCanvasText(page)
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")
    await expect(page.locator("canvas").first()).toBeVisible()
    await expectMarketChartCanvasText(page, "110,50")
    const chart = page.getByRole("application", { name: "Biểu đồ giá" })
    const readout = chart.locator('span[role="status"]')
    await expect(chart).toHaveAccessibleDescription(/Quote gần nhất: 110,50/)
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
    await expect(
      page.getByText("Quote gần nhất: 110,50", { exact: true })
    ).toHaveCount(0)
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
    await expect(chart).toHaveAccessibleDescription(/Quote gần nhất: 2.500,25/)
    await expectNoMarketChartCanvasText(page, "110,50")
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
