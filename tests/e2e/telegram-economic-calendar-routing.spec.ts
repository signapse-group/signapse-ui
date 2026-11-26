import { expect, test } from "./fixtures"

test("Economic calendar route access stays scoped and reflows on mobile", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([
    "telegram-economic-calendar-routing:read",
    "telegram-economic-calendar-routing:update",
    "telegram-destination:read",
  ])
  await fixture.setScenario(
    "/telegram/feature-settings",
    "economic-calendar-off-unassigned",
    "GET"
  )

  await page.emulateMedia({ colorScheme: "dark" })
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.context().addCookies([
    {
      name: "sidebar_state",
      value: "true",
      url: "http://127.0.0.1:3100/",
    },
  ])
  await page.goto("/vi/telegram")
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  })

  const row = page.locator('[data-route-key="ECONOMIC_CALENDAR_ALERT"]')
  await expect(row).toBeVisible()
  await expect(
    page.getByText("Cảnh báo tin thị trường", { exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByText("Phân tích thị trường định kỳ", { exact: true })
  ).toHaveCount(0)
  await expect(
    row.getByRole("combobox", {
      name: "Cảnh báo lịch kinh tế",
      exact: true,
    })
  ).toContainText("Chọn điểm nhận")
  await expect(
    row.getByRole("combobox", {
      name: "Chọn ngôn ngữ đầu ra cho Cảnh báo lịch kinh tế",
    })
  ).toContainText("Theo ngôn ngữ ưu tiên")
  await expect(
    row.getByRole("switch", {
      name: "Bật hoặc tắt định tuyến Cảnh báo lịch kinh tế",
    })
  ).not.toBeChecked()

  const sidebar = page.locator('[data-slot="sidebar"]').first()
  await expect(sidebar).toHaveAttribute("data-state", "expanded")
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(1520)
  await page.screenshot({
    path: test
      .info()
      .outputPath("economic-calendar-wide-dark-vi-1520x1024.png"),
  })

  await page.setViewportSize({ width: 1024, height: 768 })
  await page
    .getByRole("button", { name: "Thu gọn/mở rộng thanh điều hướng" })
    .click()
  await expect(sidebar).toHaveAttribute("data-state", "collapsed")
  await expect
    .poll(() =>
      sidebar.evaluate((element) => element.getBoundingClientRect().width)
    )
    .toBeLessThan(100)
  await expect(row).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(1024)
  await page.screenshot({
    path: test
      .info()
      .outputPath("economic-calendar-compact-dark-vi-1024x768.png"),
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(row).toBeVisible()
  await expect(row.getByText("Điểm nhận", { exact: true })).toBeVisible()
  await expect(row.getByText("Ngôn ngữ đầu ra", { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: test
      .info()
      .outputPath("economic-calendar-mobile-dark-vi-390x844.png"),
  })

  await page.setViewportSize({ width: 360, height: 800 })
  await expect(row).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(360)

  // Effective CSS width for a 1520px frame at 200% zoom.
  await page.setViewportSize({ width: 760, height: 512 })
  await expect(row).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(760)

  await page.setViewportSize({ width: 767, height: 768 })
  await expect(row.getByText("Điểm nhận", { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(767)

  await page.setViewportSize({ width: 768, height: 768 })
  await expect(row.getByText("Điểm nhận", { exact: true })).toBeHidden()
  await expect(page.getByText("Tính năng", { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(768)

  for (const width of [1439, 1440]) {
    await page.setViewportSize({ width, height: 768 })
    await expect(row).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width)
  }

  const requests = (await fixture.state()).requests as Array<{
    method: string
    path: string
    query: string
  }>
  const featureSettingsRequest = requests.find(
    ({ method, path }) =>
      method === "GET" && path === "/telegram/feature-settings"
  )
  expect(featureSettingsRequest).toBeDefined()
  expect(
    new URLSearchParams(featureSettingsRequest!.query).get("$filter")
  ).toBe("workspace.id eq 1")
  const requested = new Set(
    requests.map(({ method, path }) => `${method} ${path}`)
  )
  expect(requested).toContain("GET /telegram/feature-settings")
  expect(requested).toContain("GET /telegram/destinations")
  expect(requested).not.toContain("GET /telegram/bot-connections")
  expect(requested).not.toContain("GET /telegram/market-analysis-schedules")
  expect(requested).not.toContain("GET /me/workspaces")

  await fixture.setScenario(
    "/telegram/feature-settings",
    "economic-calendar-off-assigned",
    "GET"
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  })

  const assignedRow = page.locator('[data-route-key="ECONOMIC_CALENDAR_ALERT"]')
  const destinationControl = assignedRow.getByRole("combobox", {
    name: "Cảnh báo lịch kinh tế",
    exact: true,
  })
  const clearButton = assignedRow.getByRole("button", {
    name: "Xóa điểm nhận cho Cảnh báo lịch kinh tế",
  })
  await expect(destinationControl).toContainText("Operations channel")
  await expect(clearButton).toBeVisible()
  const destinationBounds = await destinationControl.boundingBox()
  const clearBounds = await clearButton.boundingBox()
  expect(destinationBounds).not.toBeNull()
  expect(clearBounds).not.toBeNull()
  expect(clearBounds!.x).toBeGreaterThan(destinationBounds!.x)
  expect(clearBounds!.x + clearBounds!.width).toBeLessThan(
    destinationBounds!.x + destinationBounds!.width
  )
  expect(clearBounds!.y).toBeGreaterThan(destinationBounds!.y)
  expect(clearBounds!.y + clearBounds!.height).toBeLessThan(
    destinationBounds!.y + destinationBounds!.height
  )
  await page.screenshot({
    path: test
      .info()
      .outputPath("economic-calendar-off-assigned-mobile-dark-vi-390x844.png"),
  })

  await clearButton.click()
  await expect(
    page.getByText("Đã xóa điểm nhận và tạm dừng định tuyến.", {
      exact: true,
    })
  ).toBeVisible()
  await expect(destinationControl).toContainText("Chọn điểm nhận")
  await expect(
    assignedRow.getByRole("combobox", {
      name: "Chọn ngôn ngữ đầu ra cho Cảnh báo lịch kinh tế",
    })
  ).toContainText("English (en)")
  await expect(
    assignedRow.getByRole("switch", {
      name: "Bật hoặc tắt định tuyến Cảnh báo lịch kinh tế",
    })
  ).not.toBeChecked()
  await expect(clearButton).toHaveCount(0)
})

test("route access does not read destination or schedule lists by itself", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([
    "telegram-economic-calendar-routing:read",
    "telegram-economic-calendar-routing:update",
  ])
  await fixture.setScenario(
    "/telegram/feature-settings",
    "economic-calendar-off-assigned",
    "GET"
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/telegram")

  const row = page.locator('[data-route-key="ECONOMIC_CALENDAR_ALERT"]')
  await expect(row).toBeVisible()
  await expect(
    row.getByText("Operations channel", { exact: true })
  ).toBeVisible()
  await expect(
    row.getByRole("combobox", {
      name: "Cảnh báo lịch kinh tế",
      exact: true,
    })
  ).toHaveCount(0)
  await expect(
    row.getByRole("button", {
      name: "Xóa điểm nhận cho Cảnh báo lịch kinh tế",
    })
  ).toBeEnabled()

  const requests = (await fixture.state()).requests as Array<{
    method: string
    path: string
  }>
  const requested = new Set(
    requests.map(({ method, path }) => `${method} ${path}`)
  )
  expect(requested).toContain("GET /telegram/feature-settings")
  expect(requested).not.toContain("GET /telegram/destinations")
  expect(requested).not.toContain("GET /telegram/bot-connections")
  expect(requested).not.toContain("GET /telegram/market-analysis-schedules")
  expect(requested).not.toContain("GET /me/workspaces")
})
