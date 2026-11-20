import AxeBuilder from "@axe-core/playwright"

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

async function setTheme(page: Page, theme: "Dark" | "Light") {
  await page.getByRole("button", { name: "Choose theme" }).click()
  await page.getByRole("menuitem", { name: theme, exact: true }).click()
  await expect(page.locator("html")).toHaveClass(
    new RegExp(theme.toLowerCase())
  )
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toBeHidden()
}

test("Graph View node filters support keyboard, touch, empty recovery and reload", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario("/graph-view", "graph-article-node", "GET")
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/graph-view")

  const graph = page.getByTestId("graph-view")
  await expect(graph).toHaveAttribute("data-layout-status", "ready", {
    timeout: 30_000,
  })
  await setTheme(page, "Dark")

  const filters = page.getByRole("group", { name: "Node type filters" })
  const event = page.getByTestId("graph-demo-node-filter-event")
  const asset = page.getByTestId("graph-demo-node-filter-asset")
  const article = page.getByTestId("graph-demo-node-filter-news-article")
  const narrative = page.getByTestId("graph-demo-node-filter-narrative")
  const allFilters = [event, asset, article, narrative]

  await expect(filters).toBeVisible()
  for (const filter of allFilters)
    await expect(filter).toHaveAttribute("aria-pressed", "true")
  await expect(article).toContainText("News Article")
  await expect(article).toHaveAccessibleName(/News Article/)

  await expect(event).toHaveCSS("height", "32px")
  await page.screenshot({
    path: "test-results/graph-node-filters-wide-dark-en-1520x1024.png",
  })
  const darkFilterAccessibility = await new AxeBuilder({ page })
    .include('[data-testid="graph-demo-node-legend"]')
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  expect(darkFilterAccessibility.violations).toEqual([])
  await setTheme(page, "Light")
  await page.screenshot({
    path: "test-results/graph-node-filters-wide-light-en-1520x1024.png",
  })
  const lightFilterAccessibility = await new AxeBuilder({ page })
    .include('[data-testid="graph-demo-node-legend"]')
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  expect(lightFilterAccessibility.violations).toEqual([])
  await setTheme(page, "Dark")
  await page.context().addCookies([
    {
      name: "sidebar_state",
      value: "false",
      url: new URL(page.url()).origin,
    },
  ])
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.reload()
  const sidebar = page.locator('[data-slot="sidebar"][data-side="left"]')
  await expect(sidebar).toHaveAttribute("data-state", "collapsed")
  await expect(graph).toHaveAttribute("data-layout-status", "ready", {
    timeout: 30_000,
  })
  await expect(event).toHaveCSS("height", "36px")

  const initialGraphRequests = (await fixture.state()).requests.filter(
    (request) => request.path === "/graph-view"
  ).length

  await article.click()
  await expect(article).toHaveAttribute("aria-pressed", "false")
  const canvas = page.getByTestId("graph-demo-canvas")
  await expect(canvas).toHaveAttribute("data-benchmark-anchor-id", "event:61")
  const anchor = await canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.x + Number((element as HTMLElement).dataset.benchmarkAnchorX),
      y: rect.y + Number((element as HTMLElement).dataset.benchmarkAnchorY),
    }
  })
  await page.mouse.click(anchor.x, anchor.y)
  const inspector = page.getByTestId("graph-demo-inspector")
  await expect(inspector).toBeVisible()
  await expect(inspector).toContainText("Event")
  await article.click()
  await expect(article).toHaveAttribute("aria-pressed", "true")
  await expect(inspector).toBeVisible()
  await page.screenshot({
    path: "test-results/graph-node-filters-compact-inspector-dark-en-1024x768.png",
  })
  await setTheme(page, "Light")
  await page.screenshot({
    path: "test-results/graph-node-filters-compact-inspector-light-en-1024x768.png",
  })
  await setTheme(page, "Dark")

  let eventHasKeyboardFocus = false
  for (let tab = 0; tab < 100; tab += 1) {
    await page.keyboard.press("Tab")
    if (await event.evaluate((element) => document.activeElement === element)) {
      eventHasKeyboardFocus = true
      break
    }
  }
  expect(eventHasKeyboardFocus).toBe(true)
  expect(
    await event.evaluate((element) => element.matches(":focus-visible"))
  ).toBe(true)
  await page.keyboard.press("Space")
  await expect(event).toHaveAttribute("aria-pressed", "false")
  await expect(event).toHaveAttribute("data-state", "off")
  await expect(inspector).toBeHidden()

  await article.click()
  await expect(article).toHaveAttribute("aria-pressed", "false")
  await expect(event).toHaveAttribute("aria-pressed", "false")
  await expect(asset).toHaveAttribute("aria-pressed", "true")
  await expect(narrative).toHaveAttribute("aria-pressed", "true")

  await asset.click()
  await narrative.click()
  await expect(page.getByTestId("graph-filter-empty")).toBeVisible()
  await expect(page.getByText("No nodes match these filters")).toBeVisible()
  await expect(filters).toBeVisible()
  await expect
    .poll(async () => {
      const requests = (await fixture.state()).requests.filter(
        (request) => request.path === "/graph-view"
      )
      return requests.length
    })
    .toBe(initialGraphRequests)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(event).toHaveCSS("height", "44px")
  await page.screenshot({
    path: "test-results/graph-node-filters-empty-mobile-dark-en-390x844.png",
  })
  await setTheme(page, "Light")
  await page.screenshot({
    path: "test-results/graph-node-filters-empty-mobile-light-en-390x844.png",
  })
  await setTheme(page, "Dark")
  const eventBox = await event.boundingBox()
  expect(eventBox?.height).toBeGreaterThanOrEqual(44)
  await tap(page, event)
  await expect(event).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("graph-filter-empty")).toBeHidden()

  const filterBox = await filters.boundingBox()
  expect(filterBox).not.toBeNull()
  expect(filterBox!.x).toBeGreaterThanOrEqual(0)
  expect(filterBox!.x + filterBox!.width).toBeLessThanOrEqual(390)
  const zoomBox = await page.getByTestId("graph-demo-zoom-in").boundingBox()
  expect(zoomBox).not.toBeNull()
  expect(zoomBox!.y).toBeGreaterThanOrEqual(filterBox!.y + filterBox!.height)
  const hintBox = await page
    .getByTestId("graph-view-interaction-hint")
    .boundingBox()
  expect(hintBox).not.toBeNull()
  expect(hintBox!.y).toBeGreaterThanOrEqual(filterBox!.y + filterBox!.height)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390
  )

  await page.screenshot({
    path: "test-results/graph-node-filters-mobile-recovered-dark-en-390x844.png",
  })

  await page.setViewportSize({ width: 360, height: 844 })
  await expect(event).toHaveCSS("height", "44px")
  await tap(page, event)
  await expect(page.getByTestId("graph-filter-empty")).toBeVisible()
  await expect(filters).toBeVisible()
  await expect(event).toHaveAttribute("aria-pressed", "false")
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360
  )
  await page.screenshot({
    path: "test-results/graph-node-filters-empty-mobile-dark-en-360x844.png",
  })
  await tap(page, event)
  await expect(page.getByTestId("graph-filter-empty")).toBeHidden()

  for (const width of [360, 760, 767, 768, 1439, 1440]) {
    await page.setViewportSize({ width, height: width === 760 ? 512 : 844 })
    const expectedHeight = width < 768 ? "44px" : width < 1440 ? "36px" : "32px"
    await expect(event).toHaveCSS("height", expectedHeight)
    const responsiveFilterBox = await filters.boundingBox()
    const responsiveZoomBox = await page
      .getByTestId("graph-demo-zoom-in")
      .boundingBox()
    const responsiveHintBox = await page
      .getByTestId("graph-view-interaction-hint")
      .boundingBox()
    expect(responsiveFilterBox).not.toBeNull()
    expect(responsiveZoomBox).not.toBeNull()
    expect(responsiveHintBox).not.toBeNull()
    expect(responsiveZoomBox!.y).toBeGreaterThanOrEqual(
      responsiveFilterBox!.y + responsiveFilterBox!.height
    )
    expect(responsiveHintBox!.y).toBeGreaterThanOrEqual(
      responsiveFilterBox!.y + responsiveFilterBox!.height
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width)
    if (width === 760) {
      await page.screenshot({
        path: "test-results/graph-node-filters-effective-zoom-dark-en-760x512.png",
      })
    }
  }

  await page.reload()
  await expect(graph).toHaveAttribute("data-layout-status", "ready", {
    timeout: 30_000,
  })
  for (const filter of allFilters)
    await expect(filter).toHaveAttribute("aria-pressed", "true")

  await article.click()
  await expect(article).toHaveAttribute("aria-pressed", "false")
  const workspaceSwitcher = page.locator("#workspace-switcher-trigger")
  await workspaceSwitcher.click()
  await page.getByRole("menuitem").filter({ hasText: "Workspace Beta" }).click()
  await expect(workspaceSwitcher).toContainText("Workspace Beta")
  await expect(graph).toHaveAttribute("data-layout-status", "ready", {
    timeout: 30_000,
  })
  for (const filter of allFilters)
    await expect(filter).toHaveAttribute("aria-pressed", "true")

  await page.goto("/vi/graph-view")
  await expect(graph).toHaveAttribute("data-layout-status", "ready", {
    timeout: 30_000,
  })
  const vietnameseArticle = page.getByTestId(
    "graph-demo-node-filter-news-article"
  )
  await expect(vietnameseArticle).toContainText("Bài viết tin tức")
  await expect(vietnameseArticle).toHaveAccessibleName(/Bài viết tin tức/)
})
