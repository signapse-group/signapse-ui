import { expect, test } from "./fixtures"

test.describe("P0 quick-detail overlay", () => {
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

    const graphCanvas = page.locator('[data-engine-canvas="g6"]')
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
      throw new Error("Missing G6 benchmark anchor")
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
