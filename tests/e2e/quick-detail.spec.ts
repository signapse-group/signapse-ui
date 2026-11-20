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
    await expect(dialog).toBeVisible()
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

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(dialog).toBeVisible()
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

  test("uses the shared desktop sheet from Graph View and restores inspector focus", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1600, height: 900 })
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

    const anchorX = Number(
      await graphCanvas.getAttribute("data-benchmark-anchor-x")
    )
    const anchorY = Number(
      await graphCanvas.getAttribute("data-benchmark-anchor-y")
    )

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

    await page.getByRole("button", { name: "Đóng", exact: true }).click()
    await expect(overlay).toBeHidden()
    await expect(openEvent).toBeFocused()
  })

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
