import AxeBuilder from "@axe-core/playwright"
import type { Page, TestInfo } from "@playwright/test"

import { expect, test, waitForClientHandler } from "./fixtures"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

async function captureQuickDetail(
  page: Page,
  testInfo: TestInfo,
  name: string
) {
  const path = testInfo.outputPath(name)
  await page.screenshot({ path })
  await testInfo.attach(name, { path, contentType: "image/png" })
}

async function selectGraphArticle(page: Page, input: "mouse" | "touch") {
  const graph = page.getByTestId("graph-view")
  await expect(graph).toHaveAttribute("data-layout-status", "ready", {
    timeout: 45_000,
  })
  const graphCanvas = page.getByTestId("graph-demo-canvas")
  await expect(graphCanvas).toHaveAttribute(
    "data-benchmark-anchor-id",
    "news-article:71",
    { timeout: 45_000 }
  )
  const anchor = await graphCanvas.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      id: (element as HTMLElement).dataset.benchmarkAnchorId ?? "",
      x: rect.x + Number((element as HTMLElement).dataset.benchmarkAnchorX),
      y: rect.y + Number((element as HTMLElement).dataset.benchmarkAnchorY),
    }
  })

  if (input === "touch") {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: anchor.x, y: anchor.y }],
    })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    await cdp.detach()
  } else {
    await page.mouse.click(anchor.x, anchor.y)
  }

  return { graph, graphCanvas, anchor }
}

test.describe("P0 quick-detail overlay", () => {
  test("renders the complete localized Article within wide, compact, and mobile readers", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario(
      "/news-articles",
      "article-reader-long-content",
      "GET"
    )
    await page.addInitScript(() => window.localStorage.setItem("theme", "dark"))
    await page.setViewportSize({ width: 1520, height: 1000 })
    await page.goto("/vi/dashboard")

    const trigger = page.getByRole("button", {
      name: "Mở bài viết: Fixture market update",
      exact: true,
    })
    await expect(trigger).toBeVisible()
    await waitForClientHandler(trigger)
    await trigger.click()

    const dialog = page.getByRole("dialog")
    const overlay = page.locator("[data-quick-detail-placement]")
    const readerHeader = dialog.locator('[data-slot="drawer-header"]')
    await expect(dialog).toBeVisible()
    await expect(readerHeader).toHaveCSS("text-align", "left")
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "right"
    )
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-profile",
      "news-article"
    )
    await expect(
      dialog.getByRole("heading", {
        name: "Bản tin thị trường đã bản địa hóa",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      dialog.getByText("Dấu mốc cuối bài: Nội dung dài vẫn được giữ đầy đủ.")
    ).toBeVisible()
    await expect(
      dialog.getByText("Fixture Wire", { exact: true }).first()
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", {
        name: "Mở liên kết gốc",
        exact: true,
      })
    ).toHaveAttribute("href", "https://fixture.invalid/news/71")
    await expect(
      dialog.getByRole("link", { name: "Mở trang đầy đủ", exact: true })
    ).toHaveAttribute("href", "/vi/news-articles/71")
    const canonicalLink = dialog.getByRole("link", {
      name: "Mở trang đầy đủ",
      exact: true,
    })
    const closeButton = dialog.getByRole("button", {
      name: "Đóng",
      exact: true,
    })
    await expect(canonicalLink).toHaveText("")
    await expect(
      canonicalLink.locator("xpath=..").getByRole("button", {
        name: "Đóng",
        exact: true,
      })
    ).toHaveCount(1)
    const iconBounds = await canonicalLink.locator("svg").boundingBox()
    expect(iconBounds?.width).toBe(16)
    expect(iconBounds?.height).toBe(16)
    await expect(closeButton).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(canonicalLink).toBeFocused()
    const canonicalTooltip = page.locator('[data-slot="tooltip-content"]')
    await expect(canonicalTooltip).toBeVisible()
    await expect(canonicalTooltip).toHaveText("Mở trang đầy đủ")
    await page.keyboard.press("Tab")
    await expect(closeButton).toBeFocused()

    const image = dialog.getByRole("img", { name: "Ảnh minh họa bài viết mẫu" })
    await expect(image).toBeVisible()
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      )
      .toBeGreaterThan(0)

    const tableScroll = dialog.locator(".typeset-scroll")
    const codeScroll = dialog.locator("article pre")
    await expect(tableScroll).toHaveCount(1)
    await expect(codeScroll).toHaveCount(1)

    for (const viewport of [
      { width: 1520, height: 1000, placement: "right", name: "wide" },
      { width: 1024, height: 900, placement: "bottom", name: "compact" },
      { width: 360, height: 844, placement: "bottom", name: "mobile" },
    ]) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await expect(overlay).toHaveAttribute(
        "data-quick-detail-placement",
        viewport.placement
      )
      await expect(dialog).toBeVisible()
      await expect(readerHeader).toHaveCSS("text-align", "left")
      const expectedControlSize = viewport.width < 768 ? 44 : 28
      for (const control of [canonicalLink, closeButton]) {
        await expect
          .poll(() =>
            control.evaluate((element) => (element as HTMLElement).offsetWidth)
          )
          .toBe(expectedControlSize)
        await expect
          .poll(() =>
            control.evaluate((element) => (element as HTMLElement).offsetHeight)
          )
          .toBe(expectedControlSize)
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width)

      const wideRegions = await Promise.all(
        [tableScroll, codeScroll].map((element) =>
          element.evaluate((node) => node.scrollWidth > node.clientWidth)
        )
      )
      expect(wideRegions).toEqual([true, true])

      await captureQuickDetail(
        page,
        testInfo,
        `article-reader-${viewport.name}.png`
      )
    }

    for (const viewport of [
      { width: 1440, placement: "right" },
      { width: 1439, placement: "bottom" },
      { width: 768, placement: "bottom" },
      { width: 767, placement: "bottom" },
      { width: 760, placement: "bottom" },
      { width: 360, placement: "bottom" },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: 512 })
      await expect(overlay).toHaveAttribute(
        "data-quick-detail-placement",
        viewport.placement
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width)
    }

    await page.setViewportSize({ width: 360, height: 844 })
    await dialog
      .getByText("Dấu mốc cuối bài: Nội dung dài vẫn được giữ đầy đủ.")
      .scrollIntoViewIfNeeded()
    await captureQuickDetail(
      page,
      testInfo,
      "article-reader-mobile-content-end.png"
    )

    const detailRequest = (await fixture.state()).requests.find(
      (request) =>
        request.method === "GET" && request.path === "/news-articles/71"
    )
    expect(detailRequest?.locale).toBe("vi")
  })

  test("keeps Dashboard mounted while one Event session crosses placement breakpoints", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-quick-detail-long", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1000 })
    await page.goto("/vi/dashboard")

    const trigger = page.getByRole("button", {
      name: "Mở sự kiện: Central bank signals a slower easing path",
      exact: true,
    })
    await expect(trigger).toBeVisible()
    await waitForClientHandler(trigger)
    await trigger.click()

    const overlay = page.locator("[data-quick-detail-placement]")
    const dialog = page.getByRole("dialog")
    const readerHeader = dialog.locator('[data-slot="drawer-header"]')
    const longTitle = `Central bank signals a slower easing path ${"across global markets ".repeat(5)}`
    await expect(page.locator('[data-slot="drawer-popup"]')).toBeVisible()
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "right"
    )
    await expect(overlay).toHaveAttribute("data-quick-detail-profile", "event")
    await expect(
      dialog.getByRole("heading", {
        name: longTitle,
        exact: true,
      })
    ).toBeVisible()
    await expect(readerHeader).toHaveCSS("text-align", "left")
    const canonicalLink = dialog.getByRole("link", {
      name: "Mở trang đầy đủ",
      exact: true,
    })
    const closeButton = dialog.getByRole("button", {
      name: "Đóng",
      exact: true,
    })
    await expect(canonicalLink).toHaveAttribute("href", "/vi/events/61")
    await expect(canonicalLink).toHaveText("")
    await expect(
      canonicalLink.locator("xpath=..").getByRole("button", {
        name: "Đóng",
        exact: true,
      })
    ).toHaveCount(1)
    await expect(closeButton).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(canonicalLink).toBeFocused()
    const canonicalTooltip = page.locator('[data-slot="tooltip-content"]')
    await expect(canonicalTooltip).toBeVisible()
    await expect(canonicalTooltip).toHaveText("Mở trang đầy đủ")
    await page.keyboard.press("Tab")
    await expect(closeButton).toBeFocused()
    for (const control of [canonicalLink, closeButton]) {
      const bounds = await control.boundingBox()
      expect(bounds?.width).toBe(28)
      expect(bounds?.height).toBe(28)
    }
    const iconBounds = await canonicalLink.locator("svg").boundingBox()
    expect(iconBounds?.width).toBe(16)
    expect(iconBounds?.height).toBe(16)
    await expect(
      dialog.getByText(
        `Synthetic long-form event description ${"with preserved market context and complete supplied wording. ".repeat(12)}`
      )
    ).toBeVisible()
    const relatedAssets = dialog
      .getByRole("heading", { name: "Tài sản liên quan", exact: true })
      .locator("xpath=..")
    await expect(
      relatedAssets.getByText("BTC/USDT", { exact: true })
    ).toBeVisible()
    await expect(
      relatedAssets.getByText("XAUUSD", { exact: true })
    ).toBeVisible()
    await expect(relatedAssets.getByText("DXY", { exact: true })).toBeVisible()
    await expect(relatedAssets.getByText("AKAM", { exact: true })).toBeVisible()
    await expect(relatedAssets.getByText("MSFT", { exact: true })).toHaveCount(
      0
    )
    await expect(
      dialog.getByRole("link", { name: "Xem bài viết" }).first()
    ).toHaveAttribute("href", "/vi/news-articles/71")
    await expect(
      dialog.getByRole("link", { name: "Mở nguồn gốc" }).first()
    ).toHaveAttribute("href", "https://fixture.invalid/news/71")
    await expect(
      dialog.getByRole("heading", { name: /Fixture evidence 1/ })
    ).toBeVisible()
    await expect(
      dialog.getByRole("heading", { name: /Fixture evidence 4/ })
    ).toHaveCount(1)
    await expect(
      dialog.getByRole("heading", { name: /Fixture evidence 5/ })
    ).toHaveCount(0)
    await expect(
      dialog.getByText("Chủ thể chính", { exact: true })
    ).toBeVisible()
    await expect(
      dialog.getByText("Tài sản bị ảnh hưởng", { exact: true })
    ).toBeVisible()
    await expect(
      dialog.getByText("Tài sản tham chiếu", { exact: true }).first()
    ).toBeVisible()
    await expect(
      dialog.getByText(viDictionary.events.statusLabels.ENRICHED, {
        exact: true,
      })
    ).toHaveCount(0)
    const accessibility = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze()
    expect(accessibility.violations).toEqual([])
    await expect(page).toHaveURL(/\/vi\/dashboard$/)

    await captureQuickDetail(page, testInfo, "event-wide.png")

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "right"
    )
    await expect(dialog).toBeVisible()

    await page.setViewportSize({ width: 1439, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(dialog).toBeVisible()
    await expect(readerHeader).toHaveCSS("text-align", "left")

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(dialog).toBeVisible()
    await expect(readerHeader).toHaveCSS("text-align", "left")
    await dialog
      .getByRole("heading", { name: "Tài sản liên quan", exact: true })
      .scrollIntoViewIfNeeded()
    await captureQuickDetail(page, testInfo, "event-compact.png")

    for (const width of [768, 767, 760, 360]) {
      await page.setViewportSize({ width, height: 900 })
      await expect(overlay).toHaveAttribute(
        "data-quick-detail-placement",
        "bottom"
      )
      await expect(dialog).toBeVisible()
      await expect(readerHeader).toHaveCSS("text-align", "left")
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      const expectedSize = width < 768 ? 44 : 28
      for (const control of [canonicalLink, closeButton]) {
        await expect
          .poll(() =>
            control.evaluate((element) => (element as HTMLElement).offsetWidth)
          )
          .toBe(expectedSize)
        await expect
          .poll(() =>
            control.evaluate((element) => (element as HTMLElement).offsetHeight)
          )
          .toBe(expectedSize)
      }
    }
    await dialog
      .getByRole("heading", { name: "Tài sản liên quan", exact: true })
      .scrollIntoViewIfNeeded()
    await captureQuickDetail(page, testInfo, "event-mobile.png")

    await page.setViewportSize({ width: 360, height: 844 })
    const titleMetrics = await dialog
      .getByRole("heading", { name: longTitle, exact: true })
      .evaluate((element) => {
        const style = window.getComputedStyle(element)
        return {
          height: element.getBoundingClientRect().height,
          lineHeight: Number.parseFloat(style.lineHeight),
          whiteSpace: style.whiteSpace,
        }
      })
    expect(titleMetrics.whiteSpace).not.toBe("nowrap")
    expect(titleMetrics.height).toBeGreaterThan(titleMetrics.lineHeight * 1.5)
    const scrollRegion = dialog.locator("[data-quick-detail-scroll-region]")
    await scrollRegion.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(dialog.getByText(/Cập nhật lần cuối:/).last()).toBeInViewport()
    await expect(
      dialog.getByText(
        `Synthetic complete evidence note 4 ${"retained inside the quick reader without truncation. ".repeat(5)}`
      )
    ).toBeVisible()

    await page.setViewportSize({ width: 640, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(dialog).toBeVisible()

    await closeButton.click()
    await expect(overlay).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("keyboard scrolls an Event body when evidence has no Article or source links", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-quick-detail-no-links", "GET")
    await page.setViewportSize({ width: 360, height: 900 })
    await page.goto("/vi/dashboard")

    const trigger = page.getByRole("button", {
      name: "Mở sự kiện: Central bank signals a slower easing path",
      exact: true,
    })
    await expect(trigger).toBeVisible()
    await waitForClientHandler(trigger)
    await trigger.click()

    const dialog = page.getByRole("dialog")
    const closeButton = dialog.getByRole("button", {
      name: "Đóng",
      exact: true,
    })
    const readerRegion = dialog.getByRole("region", {
      name: viDictionary.quickDetail.readerRegionLabel,
      exact: true,
    })

    await expect(dialog).toBeVisible()
    await expect(closeButton).toBeFocused()
    await expect(readerRegion).toHaveAttribute("tabindex", "0")
    await expect(
      dialog.getByRole("link", { name: viDictionary.events.viewArticle })
    ).toHaveCount(0)
    await expect(
      dialog.getByRole("link", { name: viDictionary.events.openOriginal })
    ).toHaveCount(0)
    await expect(
      dialog.getByText(viDictionary.events.articleIdentityUnavailable, {
        exact: true,
      })
    ).toHaveCount(4)
    await expect(
      dialog.getByText(viDictionary.events.sourceUrlUnavailable, {
        exact: true,
      })
    ).toHaveCount(4)
    await expect
      .poll(() =>
        readerRegion.evaluate(
          (element) => element.scrollHeight - element.clientHeight
        )
      )
      .toBeGreaterThan(0)

    await page.keyboard.press("Tab")
    await expect(readerRegion).toBeFocused()
    const finalEvidence = dialog.getByText(
      `Synthetic complete evidence note 4 ${"retained inside the quick reader without truncation. ".repeat(5)}`
    )
    const finalEvidenceIsInReader = () =>
      finalEvidence.evaluate((element) => {
        const scrollRegion = element.closest(
          "[data-quick-detail-scroll-region]"
        )
        if (!scrollRegion) {
          return false
        }

        const evidenceBounds = element.getBoundingClientRect()
        const regionBounds = scrollRegion.getBoundingClientRect()
        return (
          evidenceBounds.bottom > regionBounds.top &&
          evidenceBounds.top < regionBounds.bottom
        )
      })
    const maxScrollDistance = await readerRegion.evaluate(
      (element) => element.scrollHeight - element.clientHeight
    )
    const maxArrowDownPresses = Math.ceil(maxScrollDistance / 40) + 4
    let reachedFinalEvidence = false
    for (
      let arrowDownCount = 0;
      arrowDownCount < maxArrowDownPresses;
      arrowDownCount += 1
    ) {
      if (await finalEvidenceIsInReader()) {
        reachedFinalEvidence = true
        break
      }

      const previousScrollTop = await readerRegion.evaluate(
        (element) => element.scrollTop
      )
      await page.keyboard.press("ArrowDown")
      await expect
        .poll(() => readerRegion.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(previousScrollTop)
    }
    expect(reachedFinalEvidence || (await finalEvidenceIsInReader())).toBe(true)
    await captureQuickDetail(
      page,
      testInfo,
      "event-missing-evidence-links-vi-360.png"
    )

    await page.keyboard.press("End")
    await expect(dialog.getByText(/Cập nhật lần cuối:/).last()).toBeInViewport()
    await captureQuickDetail(page, testInfo, "event-reader-end-vi-360.png")
  })

  test("shows localized access denial when the Event API returns 403", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-detail-denied", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto("/vi/dashboard")

    const trigger = page.getByRole("button", {
      name: "Mở sự kiện: Central bank signals a slower easing path",
      exact: true,
    })
    await expect(trigger).toBeVisible()
    await waitForClientHandler(trigger)
    await trigger.click()

    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("heading", {
        name: viDictionary.events.quickAccessDeniedTitle,
        level: 2,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      dialog.getByText(viDictionary.events.detailDenied, { exact: false })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", {
        name: viDictionary.common.openFullPage,
        exact: true,
      })
    ).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.some(
        (request) => request.method === "GET" && request.path === "/events/61"
      )
    ).toBe(true)
    await captureQuickDetail(page, testInfo, "event-api-denied-vi-1024.png")
  })

  test("shows the missing state when the Event API returns 404", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-detail-not-found", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto("/vi/dashboard")

    const trigger = page.getByRole("button", {
      name: "Mở sự kiện: Central bank signals a slower easing path",
      exact: true,
    })
    await expect(trigger).toBeVisible()
    await waitForClientHandler(trigger)
    await trigger.click()

    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("heading", {
        name: viDictionary.quickDetail.notFoundTitle,
        level: 2,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      dialog.getByText(viDictionary.quickDetail.notFoundDescription, {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", {
        name: viDictionary.common.openFullPage,
        exact: true,
      })
    ).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.some(
        (request) => request.method === "GET" && request.path === "/events/61"
      )
    ).toBe(true)
    await captureQuickDetail(page, testInfo, "event-api-missing-vi-1024.png")
  })

  test("uses the shared desktop sheet from Graph View and restores inspector focus", async ({
    page,
    fixture,
  }, testInfo) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.addInitScript(() => window.localStorage.setItem("theme", "dark"))
    await page.goto("/vi/graph-view")

    await expect(
      page.getByRole("heading", { name: "Biểu đồ tri thức", exact: true })
    ).toBeVisible()

    const graphCanvas = page.locator('[data-engine-canvas="sigma"]')
    await expect(graphCanvas).toHaveAttribute(
      "data-benchmark-anchor-id",
      /\S+/,
      { timeout: 45_000 }
    )
    const canvas = graphCanvas.locator("canvas").first()
    await expect(canvas).toBeVisible()
    const canvasBox = await graphCanvas.boundingBox()
    expect(canvasBox).not.toBeNull()

    const openEvent = page.getByRole("button", {
      name: "Đọc sự kiện",
      exact: true,
    })

    const anchorId = await graphCanvas.getAttribute("data-benchmark-anchor-id")
    const anchorXValue = await graphCanvas.getAttribute(
      "data-benchmark-anchor-x"
    )
    const anchorYValue = await graphCanvas.getAttribute(
      "data-benchmark-anchor-y"
    )
    const anchorX = Number(anchorXValue)
    const anchorY = Number(anchorYValue)

    if (!canvasBox || !Number.isFinite(anchorX) || !Number.isFinite(anchorY)) {
      throw new Error("Missing graph benchmark anchor")
    }

    await page.mouse.click(canvasBox.x + anchorX, canvasBox.y + anchorY)
    await expect(openEvent).toBeVisible()
    await openEvent.click()

    const overlay = page.locator("[data-quick-detail-placement]")
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "right"
    )
    await expect(
      page.getByRole("heading", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.viewArticle,
        exact: true,
      })
    ).toHaveAttribute("href", "/vi/news-articles/71")
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.openOriginal,
        exact: true,
      })
    ).toHaveAttribute("href", "https://fixture.invalid/news/61")

    const state = await fixture.state()
    expect(
      state.requests.some(
        (request) => request.method === "GET" && request.path === "/events/61"
      )
    ).toBe(true)
    await captureQuickDetail(page, testInfo, "sign-346-graph-event-wide.png")

    await page.getByRole("button", { name: "Đóng", exact: true }).click()
    await expect(overlay).toBeHidden()
    await expect(openEvent).toBeFocused()
    await expect(page).toHaveURL(/\/vi\/graph-view(?:\?.*)?$/)
    await expect(graphCanvas).toBeVisible()
    await expect(graphCanvas).toHaveAttribute(
      "data-benchmark-anchor-id",
      anchorId ?? ""
    )
    const restoredAnchorX = Number(
      await graphCanvas.getAttribute("data-benchmark-anchor-x")
    )
    const restoredAnchorY = Number(
      await graphCanvas.getAttribute("data-benchmark-anchor-y")
    )
    expect(Math.abs(restoredAnchorX - anchorX)).toBeLessThan(2)
    expect(Math.abs(restoredAnchorY - anchorY)).toBeLessThan(2)
  })

  test("opens and closes the shared Graph Event sheet on mobile", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => window.localStorage.setItem("theme", "dark"))
    await page.goto("/vi/graph-view")

    const graph = page.getByTestId("graph-view")
    await expect(graph).toHaveAttribute("data-layout-status", "ready", {
      timeout: 45_000,
    })
    const graphCanvas = page.getByTestId("graph-demo-canvas")
    await expect(graphCanvas).toHaveAttribute(
      "data-benchmark-anchor-id",
      /\S+/,
      { timeout: 45_000 }
    )
    const anchor = await graphCanvas.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        x: rect.x + Number((element as HTMLElement).dataset.benchmarkAnchorX),
        y: rect.y + Number((element as HTMLElement).dataset.benchmarkAnchorY),
      }
    })
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [anchor],
    })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    await cdp.detach()
    const openEvent = page.getByRole("button", {
      name: viDictionary.graphView.inspector.readEvent,
      exact: true,
    })
    await expect(openEvent).toBeVisible()
    await openEvent.click()

    const overlay = page.locator("[data-quick-detail-placement]")
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(
      page.getByRole("heading", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()
    await captureQuickDetail(page, testInfo, "sign-346-graph-event-mobile.png")

    await page.getByRole("button", { name: "Đóng", exact: true }).click()
    await expect(overlay).toBeHidden()
    await expect(openEvent).toBeFocused()
    await expect(graphCanvas).toBeVisible()
    await expect(graph).toBeVisible()
    await expect(page).toHaveURL(/\/vi\/graph-view(?:\?.*)?$/)
  })

  for (const viewport of [
    {
      width: 1600,
      height: 900,
      placement: "right",
      input: "mouse",
      screenshot: "sign-346-graph-article-wide.png",
    },
    {
      width: 390,
      height: 844,
      placement: "bottom",
      input: "touch",
      screenshot: "sign-346-graph-article-mobile.png",
    },
  ] as const) {
    test(`opens and closes the Graph Article reader at ${viewport.width}px`, async ({
      page,
      fixture,
    }, testInfo) => {
      test.setTimeout(120_000)
      await fixture.setScenario("/graph-view", "graph-article-node", "GET")
      await fixture.setScenario(
        "/news-articles",
        "article-reader-long-content",
        "GET"
      )
      await fixture.setPermissions(["graph-view:read", "news-article:read"])
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.addInitScript(() =>
        window.localStorage.setItem("theme", "dark")
      )
      await page.goto("/vi/graph-view")

      const { graph, graphCanvas, anchor } = await selectGraphArticle(
        page,
        viewport.input
      )
      const inspector = page.getByTestId("graph-demo-inspector")
      const readArticle = inspector.getByRole("button", {
        name: viDictionary.graphView.inspector.readArticle,
        exact: true,
      })
      await expect(readArticle).toBeVisible()
      await expect(
        inspector.getByRole("link", {
          name: viDictionary.graphView.inspector.openOriginalSource,
          exact: true,
        })
      ).toHaveAttribute("href", "https://fixture.invalid/news/71")
      await readArticle.click()

      const overlay = page.locator("[data-quick-detail-placement]")
      const dialog = page.getByRole("dialog")
      await expect(overlay).toHaveAttribute(
        "data-quick-detail-placement",
        viewport.placement
      )
      await expect(overlay).toHaveAttribute(
        "data-quick-detail-profile",
        "news-article"
      )
      await expect(
        dialog.getByRole("heading", {
          name: "Bản tin thị trường đã bản địa hóa",
          exact: true,
        })
      ).toBeVisible()
      await expect(
        dialog.getByText("Dấu mốc cuối bài: Nội dung dài vẫn được giữ đầy đủ.")
      ).toBeVisible()
      await expect(
        dialog.getByRole("link", {
          name: viDictionary.newsArticles.openOriginalLink,
          exact: true,
        })
      ).toHaveAttribute("href", "https://fixture.invalid/news/71")
      await expect(
        dialog.getByRole("link", {
          name: viDictionary.common.openFullPage,
          exact: true,
        })
      ).toHaveAttribute("href", "/vi/news-articles/71")

      const state = await fixture.state()
      expect(
        state.requests.some(
          (request) =>
            request.method === "GET" && request.path === "/news-articles/71"
        )
      ).toBe(true)
      await captureQuickDetail(page, testInfo, viewport.screenshot)

      await dialog.getByRole("button", { name: "Đóng", exact: true }).click()
      await expect(overlay).toBeHidden()
      await expect(readArticle).toBeFocused()
      await expect(graph).toBeVisible()
      await expect(graphCanvas).toHaveAttribute(
        "data-benchmark-anchor-id",
        anchor.id
      )
      const restored = await graphCanvas.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return {
          x: rect.x + Number((element as HTMLElement).dataset.benchmarkAnchorX),
          y: rect.y + Number((element as HTMLElement).dataset.benchmarkAnchorY),
        }
      })
      expect(Math.abs(restored.x - anchor.x)).toBeLessThan(2)
      expect(Math.abs(restored.y - anchor.y)).toBeLessThan(2)
      await expect(page).toHaveURL(/\/vi\/graph-view(?:\?.*)?$/)
    })
  }

  test("uses the shared desktop sheet from Market Charts and restores annotation context", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/market-charts/candles",
      "full-then-empty",
      "GET"
    )
    await fixture.setScenario("/market-charts/annotations", "success", "GET")
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto("/vi/market-charts?assetId=101&timeframe=1h")

    await expect(page.locator("#market-chart-asset")).toBeVisible()
    await page
      .getByRole("button", { name: "Mở biểu đồ toàn màn hình", exact: true })
      .click()
    await expect(page.locator('section[data-fullscreen="true"]')).toBeVisible()

    const annotationMarker = page.getByRole("button", {
      name: "Mở sự kiện Central bank signals a slower easing path",
      exact: true,
    })
    await expect(annotationMarker).toBeVisible()
    await annotationMarker.click()

    const annotationTrigger = page
      .locator("[data-quick-detail-trigger]:visible")
      .first()
    await expect(annotationTrigger).toBeVisible()
    await annotationTrigger.click()

    const overlay = page.locator("[data-quick-detail-placement]")
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "right"
    )
    await expect(
      page.getByRole("heading", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()

    await page.getByRole("button", { name: "Đóng", exact: true }).click()
    await expect(overlay).toBeHidden()
    await expect(annotationTrigger).toBeFocused()
    await expect(page.locator('section[data-fullscreen="true"]')).toBeVisible()

    await page
      .getByRole("button", { name: "Thoát toàn màn hình", exact: true })
      .click()
    await expect(page.locator('section[data-fullscreen="false"]')).toBeVisible()

    await page.setViewportSize({ width: 1024, height: 900 })
    await annotationMarker.click()
    await expect(annotationTrigger).toBeVisible()
    await annotationTrigger.click()
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await page.getByRole("button", { name: "Đóng", exact: true }).click()
    await expect(overlay).toBeHidden()
    await expect(annotationTrigger).toBeFocused()
  })
})
