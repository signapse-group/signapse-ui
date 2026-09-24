import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

test.describe("P0 sidebar navigation", () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ fixture, page }) => {
    await fixture.setPermissions(["*"])
    await page.context().clearCookies({ name: "sidebar_state" })
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test("starts expanded and preserves an explicit collapsed preference", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard")

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    await expect(sidebar).toHaveAttribute("data-state", "expanded")
    await expect(page.getByText("Phân tích", { exact: true })).toBeVisible()
    await expect(
      sidebar.getByRole("link", { name: "Tổng quan", exact: true })
    ).toBeVisible()

    await page
      .getByRole("button", {
        name: "Thu gọn/mở rộng thanh điều hướng",
        exact: true,
      })
      .click()
    await expect(sidebar).toHaveAttribute("data-state", "collapsed")

    await page.reload()
    await expect(sidebar).toHaveAttribute("data-state", "collapsed")

    await page.context().addCookies([
      {
        name: "sidebar_state",
        value: "true",
        url: "http://127.0.0.1:3100/",
      },
    ])
    await page.reload()
    await expect(sidebar).toHaveAttribute("data-state", "expanded")
  })

  test("renders the canonical Vietnamese hierarchy and temporary disclosure", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard")

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    const sectionLabels = await sidebar
      .locator('[data-slot="sidebar-group-label"]')
      .allTextContents()
    expect(sectionLabels).toEqual(["Phân tích", "Dữ liệu", "Quản trị"])

    const groupItems = (sectionIndex: number) =>
      sidebar
        .locator('[data-slot="sidebar-group"]')
        .nth(sectionIndex)
        .locator(
          '[data-slot="sidebar-group-content"] > [data-slot="sidebar-menu"] > li'
        )

    const firstLine = (text: string) => text.split("\n")[0].trim()

    expect((await groupItems(0).allTextContents()).map(firstLine)).toEqual([
      "Tổng quan",
      "Đồ thị tri thức thị trường",
      "Biểu đồ thị trường",
    ])
    expect((await groupItems(1).allTextContents()).map(firstLine)).toEqual([
      "Tin tức",
      "Sự kiện",
      "Lịch kinh tế",
    ])
    expect((await groupItems(2).allTextContents()).map(firstLine)).toEqual([
      "Giới hạn sử dụng",
      "Cấu hình hệ thống",
      "Người dùng & phân quyền",
      "Duyệt phản hồi",
    ])

    await sidebar.getByRole("button", { name: "Tin tức", exact: true }).click()
    expect(
      await sidebar
        .locator('[data-slot="sidebar-menu-sub-item"]')
        .allTextContents()
    ).toEqual(["Bài viết tin tức", "Nguồn tin", "Blog"])

    await sidebar
      .getByRole("button", { name: "Cấu hình hệ thống", exact: true })
      .click()
    expect(
      await sidebar
        .locator('[data-slot="sidebar-menu-sub-item"]')
        .allTextContents()
    ).toEqual([
      "Bài viết tin tức",
      "Nguồn tin",
      "Blog",
      "Nhà cung cấp AI",
      "Prompt hệ thống",
      "Tác vụ định kỳ",
      "Tích hợp Telegram",
    ])

    await sidebar
      .getByRole("button", { name: "Người dùng & phân quyền", exact: true })
      .click()
    expect(
      await sidebar
        .locator('[data-slot="sidebar-menu-sub-item"]')
        .allTextContents()
    ).toEqual([
      "Bài viết tin tức",
      "Nguồn tin",
      "Blog",
      "Nhà cung cấp AI",
      "Prompt hệ thống",
      "Tác vụ định kỳ",
      "Tích hợp Telegram",
      "Người dùng",
      "Vai trò & phân quyền",
    ])

    await page.reload()
    await expect(
      sidebar.getByRole("link", { name: "Bài viết tin tức", exact: true })
    ).toBeHidden()
    await expect(
      sidebar.getByRole("link", { name: "Nhà cung cấp AI", exact: true })
    ).toBeHidden()
  })

  test("keeps grouped destinations reachable from a collapsed flyout", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard")
    await page
      .getByRole("button", {
        name: "Thu gọn/mở rộng thanh điều hướng",
        exact: true,
      })
      .click()

    const overviewLink = page
      .locator('[data-slot="sidebar"]')
      .first()
      .getByRole("link", {
        name: "Tổng quan",
        exact: true,
      })
    await expect(overviewLink).toBeVisible()

    const sidebarInset = page.locator('[data-slot="sidebar-inset"]').first()
    const widthBefore = await sidebarInset.evaluate(
      (element) => element.getBoundingClientRect().width
    )

    const newsTrigger = page.getByRole("button", {
      name: "Tin tức",
      exact: true,
    })
    await newsTrigger.click()

    const flyout = page.getByRole("menu")
    await expect(flyout).toBeVisible()
    await expect(
      flyout.getByRole("menuitem", { name: "Bài viết tin tức", exact: true })
    ).toBeVisible()

    const widthAfter = await sidebarInset.evaluate(
      (element) => element.getBoundingClientRect().width
    )
    expect(widthAfter).toBe(widthBefore)

    await page.locator("main").click({ position: { x: 300, y: 300 } })
    await expect(flyout).toBeHidden()
    expect(
      await newsTrigger.evaluate(
        (element) => document.activeElement === element
      )
    ).toBe(true)

    await newsTrigger.click()
    await expect(flyout).toBeVisible()

    await flyout
      .getByRole("menuitem", { name: "Bài viết tin tức", exact: true })
      .click()
    await expect(page).toHaveURL(/\/vi\/news-articles$/)
    await expect(flyout).toBeHidden()

    await page.goto("/vi/dashboard")
    const eventsLink = page
      .locator('[data-slot="sidebar"]')
      .first()
      .getByRole("link", { name: "Sự kiện", exact: true })
    await expect(eventsLink).toHaveAttribute("href", "/vi/events")
    await eventsLink.click()
    await expect(page).toHaveURL(/\/vi\/events$/, { timeout: 30_000 })
  })

  test("supports keyboard flyout dismissal and focus restoration", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard")
    await page
      .getByRole("button", {
        name: "Thu gọn/mở rộng thanh điều hướng",
        exact: true,
      })
      .click()

    const configurationTrigger = page.getByRole("button", {
      name: "Cấu hình hệ thống",
      exact: true,
    })
    await configurationTrigger.press("Enter")

    const flyout = page.getByRole("menu")
    await expect(flyout).toBeVisible()
    await expect(
      flyout.getByRole("menuitem", { name: "Nhà cung cấp AI", exact: true })
    ).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(flyout).toBeHidden()
    const triggerHasFocus = await configurationTrigger.evaluate(
      (element) => document.activeElement === element
    )
    expect(triggerHasFocus).toBe(true)
  })

  test("exposes one current destination for direct and child routes", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard")
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .first()
        .getByRole("link", { name: "Tổng quan", exact: true })
    ).toHaveAttribute("aria-current", "page")

    await page.goto("/vi/news-articles")
    const sidebar = page.locator('[data-slot="sidebar"]').first()
    const activeArticle = sidebar.getByRole("link", {
      name: "Bài viết tin tức",
      exact: true,
    })
    await expect(activeArticle).toHaveAttribute("aria-current", "page")
    await expect(
      page.getByRole("button", { name: "Tin tức", exact: true })
    ).not.toHaveAttribute("aria-current", "page")
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1)

    await page.goto("/vi/news-articles/71")
    await expect(
      sidebar.getByRole("link", {
        name: "Bài viết tin tức",
        exact: true,
      })
    ).toHaveAttribute("aria-current", "page")
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1)

    await page
      .getByRole("button", {
        name: "Thu gọn/mở rộng thanh điều hướng",
        exact: true,
      })
      .click()
    await page.getByRole("button", { name: "Tin tức", exact: true }).click()
    const flyout = page.getByRole("menu")
    await expect(
      flyout.getByRole("menuitem", {
        name: "Bài viết tin tức",
        exact: true,
      })
    ).toHaveAttribute("aria-current", "page")
  })

  test("keeps permission-aware groups stable", async ({ fixture, page }) => {
    await fixture.setPermissions(["news-article:read"])
    await page.goto("/vi/dashboard")

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    expect(
      await sidebar
        .locator('[data-slot="sidebar-group-label"]')
        .allTextContents()
    ).toEqual(["Phân tích", "Dữ liệu", "Quản trị"])
    const newsGroup = page.getByRole("button", { name: "Tin tức", exact: true })
    await expect(newsGroup).toBeVisible()
    await newsGroup.click()
    await expect(
      page.getByRole("link", { name: "Bài viết tin tức", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Nguồn tin", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Giới hạn sử dụng", { exact: true })
    ).toBeVisible()

    await fixture.setPermissions([])
    await page.goto("/vi/dashboard")
    expect(
      await sidebar
        .locator('[data-slot="sidebar-group-label"]')
        .allTextContents()
    ).toEqual(["Phân tích", "Quản trị"])
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .first()
        .getByRole("link", { name: "Tổng quan", exact: true })
    ).toBeVisible()
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .first()
        .getByRole("link", { name: "Giới hạn sử dụng", exact: true })
    ).toBeVisible()
  })

  test("keeps mobile navigation dismissible and touch-friendly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 600 })
    await page.goto("/vi/dashboard")

    await page
      .getByRole("button", {
        name: "Thu gọn/mở rộng thanh điều hướng",
        exact: true,
      })
      .click()

    const sidebar = page.getByRole("dialog", {
      name: "Điều hướng ứng dụng",
      exact: true,
    })
    await expect(sidebar).toBeVisible()
    const closeButton = sidebar.getByRole("button", {
      name: "Đóng thanh điều hướng",
      exact: true,
    })
    await expect(closeButton).toBeVisible()
    expect((await closeButton.boundingBox())?.height).toBeGreaterThanOrEqual(44)

    const targetHeights = await sidebar
      .locator(
        '[data-slot="sidebar-menu-button"], [data-slot="sidebar-menu-sub-button"]'
      )
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height)
      )
    expect(targetHeights.length).toBeGreaterThan(0)
    expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44)

    await sidebar.getByRole("button", { name: "Tin tức", exact: true }).click()
    await sidebar
      .getByRole("button", { name: "Cấu hình hệ thống", exact: true })
      .click()
    await sidebar
      .getByRole("button", { name: "Người dùng & phân quyền", exact: true })
      .click()

    const content = sidebar.locator('[data-slot="sidebar-content"]')
    const isScrollable = await content.evaluate(
      (element) => element.scrollHeight > element.clientHeight
    )
    expect(isScrollable).toBe(true)
    await content.evaluate((element) =>
      element.scrollTo(0, element.scrollHeight)
    )

    await sidebar.getByRole("button", { name: /Signapse Developer/ }).click()
    const tokenMenuItem = page.getByRole("menuitem", {
      name: "Token truy cập API",
      exact: true,
    })
    await expect(tokenMenuItem).toBeVisible()
    await expect(tokenMenuItem).toHaveAttribute("href", "/vi/developer-token")

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      axe.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])

    await page
      .getByRole("button", {
        name: "Đóng thanh điều hướng",
        exact: true,
      })
      .click()
    await expect(sidebar).toBeHidden()
  })

  test("keeps English mobile navigation localized in dark mode", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/en/dashboard")

    await page
      .getByRole("button", {
        name: "Toggle navigation sidebar",
        exact: true,
      })
      .click()

    const sidebar = page.getByRole("dialog", {
      name: "Application navigation",
      exact: true,
    })
    await expect(sidebar).toBeVisible()
    await expect(
      sidebar.getByRole("button", {
        name: "Close navigation sidebar",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      sidebar.getByRole("button", {
        name: "System configuration",
        exact: true,
      })
    ).toBeVisible()

    const overview = sidebar.getByRole("link", {
      name: "Overview",
      exact: true,
    })
    await expect(overview).toHaveAttribute("aria-current", "page")
    await overview.focus()
    await expect(overview).toBeFocused()
    await expect(overview).toHaveClass(/ring-sidebar-ring/)

    await sidebar.getByRole("button", { name: /Signapse Developer/ }).click()
    const tokenMenuItem = page.getByRole("menuitem", {
      name: "API access token",
      exact: true,
    })
    await expect(tokenMenuItem).toBeVisible()
    await expect(tokenMenuItem).toHaveAttribute("href", "/en/developer-token")

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      axe.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])
  })
})
