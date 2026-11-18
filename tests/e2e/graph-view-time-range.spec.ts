import { expect, test } from "./fixtures"
import type { Locator, Page } from "@playwright/test"

async function tap(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error("Touch target is not visible")

  const session = await page.context().newCDPSession(page)
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 },
    ],
  })
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await session.detach()
}

test("Graph View time range works across responsive, keyboard, touch and locale states", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario("/graph-view", "success", "GET")
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/graph-view")

  const range = page.getByRole("combobox", { name: "Time range" })
  await expect(range).toBeVisible()
  await expect(range).toContainText("Last 7 days")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 30_000 }
  )
  await page.getByRole("button", { name: "Choose theme" }).click()
  await page.getByRole("menuitem", { name: "Dark", exact: true }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.screenshot({
    path: "test-results/graph-view-time-range-wide-en.png",
  })

  let hasKeyboardFocus = false
  for (let tab = 0; tab < 80; tab += 1) {
    await page.keyboard.press("Tab")
    if (await range.evaluate((element) => document.activeElement === element)) {
      hasKeyboardFocus = true
      break
    }
  }
  expect(hasKeyboardFocus).toBe(true)
  expect(
    await range.evaluate((element) => element.matches(":focus-visible"))
  ).toBe(true)
  await page.keyboard.press("Enter")
  await expect(page.getByRole("option", { name: "Last 7 days" })).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(range).toContainText("Last 14 days")
  await expect
    .poll(async () => {
      const state = await fixture.state()
      return state.requests.some(
        (request) =>
          request.path === "/graph-view" && request.query === "?days=14"
      )
    })
    .toBe(true)

  await page.reload()
  await expect(range).toContainText("Last 7 days")
  await expect(page.getByTestId("graph-view")).toHaveAttribute(
    "data-layout-status",
    "ready",
    { timeout: 30_000 }
  )

  for (const width of [1520, 1440, 1439, 1024, 768, 767, 760, 390, 360]) {
    await page.setViewportSize({
      width,
      height: width === 1520 ? 1024 : width === 760 ? 512 : 844,
    })
    await expect(range).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width)
    const box = await range.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
  }

  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/graph-view")
  const vietnameseRange = page.getByRole("combobox", {
    name: "Khoảng thời gian",
  })
  await expect(vietnameseRange).toContainText("7 ngày qua")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.screenshot({
    path: "test-results/graph-view-time-range-wide-vi.png",
  })

  await fixture.setScenario("/graph-view", "empty", "GET")
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/graph-view")
  const mobileRange = page.getByRole("combobox", { name: "Time range" })
  await expect(mobileRange).toContainText("Last 7 days")
  const emptyMessage = page.getByText("No events in the last 7 days", {
    exact: true,
  })
  await expect(emptyMessage).toBeVisible()
  await expect(page.locator("html")).toHaveClass(/dark/)

  for (const width of [1520, 1440, 1439, 1024, 768, 767, 760, 390, 360]) {
    await page.setViewportSize({
      width,
      height: width === 1520 ? 1024 : width === 760 ? 512 : 844,
    })
    await expect(mobileRange).toBeVisible()
    await expect(emptyMessage).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width)
    const card = await page.locator('[data-slot="empty"]').boundingBox()
    expect(card).not.toBeNull()
    expect(card!.x).toBeGreaterThanOrEqual(0)
    expect(card!.x + card!.width).toBeLessThanOrEqual(width)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const triggerBox = await mobileRange.boundingBox()
  expect(triggerBox?.height).toBeGreaterThanOrEqual(44)
  await tap(page, mobileRange)
  const thirtyDayOption = page.getByRole("option", { name: "Last 30 days" })
  await expect(thirtyDayOption).toBeVisible()
  const optionBox = await thirtyDayOption.boundingBox()
  expect(optionBox?.height).toBeGreaterThanOrEqual(44)
  await page.screenshot({
    path: "test-results/graph-view-time-range-mobile-empty-en.png",
  })
  await tap(page, thirtyDayOption)
  await expect(mobileRange).toContainText("Last 30 days")
  await expect
    .poll(async () => {
      const state = await fixture.state()
      return state.requests.some(
        (request) =>
          request.path === "/graph-view" && request.query === "?days=30"
      )
    })
    .toBe(true)

  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/graph-view")
  await expect(vietnameseRange).toContainText("7 ngày qua")
})
