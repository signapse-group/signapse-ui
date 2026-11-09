import { expect, test, waitForClientHandler } from "./fixtures"

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
      { width: 390, height: 844, placement: "bottom", name: "mobile" },
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
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width)

      const wideRegions = await Promise.all(
        [tableScroll, codeScroll].map((element) =>
          element.evaluate((node) => node.scrollWidth > node.clientWidth)
        )
      )
      expect(wideRegions).toEqual([true, true])

      await testInfo.attach(`article-reader-${viewport.name}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      })
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

    await page.setViewportSize({ width: 390, height: 844 })
    await dialog
      .getByText("Dấu mốc cuối bài: Nội dung dài vẫn được giữ đầy đủ.")
      .scrollIntoViewIfNeeded()
    await testInfo.attach("article-reader-mobile-content-end.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    })

    const detailRequest = (await fixture.state()).requests.find(
      (request) =>
        request.method === "GET" && request.path === "/news-articles/71"
    )
    expect(detailRequest?.locale).toBe("vi")
  })

  test("keeps Dashboard mounted while one Event session crosses placement breakpoints", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 })
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
    await expect(page.locator('[data-slot="drawer-popup"]')).toBeVisible()
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "right"
    )
    await expect(overlay).toHaveAttribute("data-quick-detail-profile", "event")
    await expect(
      dialog.getByRole("heading", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      dialog.getByRole("button", { name: "Đóng", exact: true })
    ).toBeFocused()
    await expect(page).toHaveURL(/\/vi\/dashboard$/)

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(dialog).toBeVisible()

    await page.setViewportSize({ width: 640, height: 900 })
    await expect(overlay).toHaveAttribute(
      "data-quick-detail-placement",
      "bottom"
    )
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: "Đóng", exact: true }).click()
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
