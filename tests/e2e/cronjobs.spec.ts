import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

test("cronjob read permission renders the responsive list and retains the detail URL", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["cronjob:read"])
  await page.emulateMedia({ colorScheme: "light" })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/cronjobs")

  const pausedCard = page.getByRole("article", {
    name: "Paused during execution",
  })
  await expect(pausedCard).toBeVisible()
  await expect(pausedCard.getByText("Tạm dừng")).toBeVisible()
  await expect(pausedCard.getByText("Đang chạy")).toBeVisible()
  await expect(pausedCard.getByText("Chưa có kết quả")).toBeVisible()
  await expect(pausedCard.getByText("Không có lần chạy kế tiếp")).toBeVisible()
  await expect(page.getByRole("button", { name: "Khởi chạy" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Tạm dừng" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Tiếp tục" })).toHaveCount(0)
  await expect(
    page
      .getByRole("article", { name: "Scheduled and running" })
      .locator("time")
      .filter({ hasText: /UTC/ })
  ).toBeVisible()

  const listAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude(".bar")
    .analyze()
  expect(
    listAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    )
  ).toEqual([])
  await testInfo.attach("cronjobs-read-mobile-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  const darkListAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude(".bar")
    .analyze()
  expect(
    darkListAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    )
  ).toEqual([])
  await testInfo.attach("cronjobs-read-dark-list-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [767, 844],
    [760, 512], // 1520×1024 effective CSS viewport at 200% zoom
    [768, 768],
    [1024, 768],
    [1439, 900],
    [1440, 1024],
    [1520, 1024],
  ]) {
    await page.setViewportSize({ width, height })
    const card = page.getByRole("article", {
      name: "Paused during execution",
    })
    const table = page.locator("#cronjob-list table")
    if (width < 768) {
      await expect(card).toBeVisible()
      await expect(table).toBeHidden()
    } else {
      await expect(card).toBeHidden()
      await expect(table).toBeVisible()
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      `page should not overflow at ${width}px`
    ).toBe(true)

    if (width === 760) {
      await testInfo.attach("cronjobs-effective-760x512-200pct.png", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      })
    }
  }

  await page.setViewportSize({ width: 1520, height: 1024 })
  await testInfo.attach("cronjobs-read-wide-1520x1024.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole("link", { name: "Xem chi tiết" })).toHaveCount(0)
  await page.goto("/vi/cronjobs?detail=2")
  await expect(page).toHaveURL(/detail=2/)
  const detail = page.locator("#cronjob-detail-panel")
  await expect(
    detail.getByRole("heading", { name: "Paused during execution" })
  ).toBeVisible()
  await expect(detail.getByText("Thực thi", { exact: true })).toBeVisible()
  await expect(
    detail.getByText("Lần thực thi gần nhất (UTC)", { exact: true })
  ).toBeVisible()
  await expect(detail.locator("time").first()).toContainText("UTC")

  const detailAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude(".bar")
    .analyze()
  expect(
    detailAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    )
  ).toEqual([])
  await testInfo.attach("cronjobs-read-dark-detail-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("cronjob wide and mobile renders preserve the approved list composition", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions([
    "cronjob:read",
    "cronjob:update",
    "cronjob:start",
    "cronjob:pause",
    "cronjob:resume",
  ])
  await page.emulateMedia({ colorScheme: "dark" })
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/cronjobs")

  const wideTable = page.getByRole("table")
  await expect(
    wideTable.getByRole("columnheader", { name: "Schedule" })
  ).toBeVisible()
  await expect(
    wideTable.getByRole("columnheader", { name: "Execution" })
  ).toBeVisible()
  await expect(
    wideTable.getByRole("columnheader", { name: "Latest result" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Edit cron expression" }).first()
  ).toBeVisible()
  await expect(
    wideTable.getByText("0 15,30 4,10 * JAN,MAR,SEP MON-FRI 2026/2", {
      exact: true,
    })
  ).toBeVisible()
  await testInfo.attach("Cronjobs-candidate-Wide-1520x1024.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  })

  await page.setViewportSize({ width: 390, height: 1024 })
  await fixture.setScenario("/cronjobs", "short")
  await page.goto("/vi/cronjobs")

  const firstCard = page.getByRole("article", {
    name: "RefreshPendingNarrativesJob",
  })
  await expect(firstCard).toBeVisible()
  await expect(firstCard.getByText("Lịch", { exact: true })).toBeVisible()
  await expect(firstCard.getByText("Thực thi", { exact: true })).toBeVisible()
  await expect(
    firstCard.getByText("Kết quả gần nhất", { exact: true })
  ).toBeVisible()
  await expect(
    page.locator('[data-slot="app-pagination-footer"]')
  ).toBeVisible()
  const resultSummary = page.getByText("Hiển thị 1-2 trên 2 kết quả", {
    exact: true,
  })
  const pageSize = page.getByRole("combobox", { name: "Số hàng mỗi trang" })
  const nextPage = page.getByRole("button", { name: "Đi tới trang sau" })
  await expect(resultSummary).toBeVisible()
  await expect(pageSize).toBeVisible()
  await expect(nextPage).toBeVisible()
  const [summaryBox, pageSizeBox] = await Promise.all([
    resultSummary.boundingBox(),
    pageSize.boundingBox(),
  ])
  expect(summaryBox).not.toBeNull()
  expect(pageSizeBox).not.toBeNull()
  expect(summaryBox!.y).toBeLessThan(pageSizeBox!.y)
  expect(pageSizeBox!.y + pageSizeBox!.height).toBeLessThanOrEqual(1024)
  const nextPageBox = await nextPage.boundingBox()
  expect(nextPageBox).not.toBeNull()
  expect(nextPageBox!.y + nextPageBox!.height).toBeLessThanOrEqual(1024)
  await expect(
    firstCard.getByText("0 */30 * * * ?", {
      exact: true,
    })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await expect(
    firstCard.getByRole("button", { name: "Chỉnh sửa biểu thức cron" })
  ).toBeVisible()
  await testInfo.attach("Cronjobs-candidate-Mobile-vi-390x1024.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})

test("read denial, detail errors, and a valid empty list stay distinct", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["cronjob:start"])
  await page.goto("/vi/cronjobs")
  await expect(page.getByText("Bạn không có quyền truy cập")).toBeVisible()
  await expect(
    page.getByText("Bạn không có quyền xem danh sách tác vụ định kỳ.")
  ).toBeVisible()

  await fixture.setPermissions(["cronjob:read"])
  await fixture.setScenario("/cronjobs", "empty")
  await page.goto("/vi/cronjobs")
  await expect(
    page
      .locator('#cronjob-list [data-slot="empty-title"]')
      .filter({ hasText: "Chưa có tác vụ định kỳ" })
      .last()
  ).toBeVisible()
  await expect(page.getByRole("article")).toHaveCount(0)

  await page.goto("/vi/cronjobs?jobName%5BcontainsIgnoreCase%5D=unmatched")
  await expect(
    page
      .locator('#cronjob-list [data-slot="empty-title"]')
      .filter({ hasText: "Không tìm thấy tác vụ phù hợp" })
      .last()
  ).toBeVisible()
  await expect(
    page.getByText("Chưa có tác vụ định kỳ", { exact: true })
  ).toHaveCount(0)

  await page.goto("/vi/cronjobs?detail=999")
  await expect(
    page.getByText("Không tìm thấy tác vụ", { exact: true })
  ).toBeVisible()

  await fixture.setScenario("/cronjobs/2", "permission-denied")
  await page.goto("/vi/cronjobs?detail=2")
  await expect(
    page
      .locator("#cronjob-detail-panel")
      .getByText("Bạn không có quyền truy cập")
  ).toBeVisible()

  await fixture.setScenario("/cronjobs", "missing-content")
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/cronjobs")
  const loadError = page
    .getByRole("alert")
    .filter({ hasText: "Đã có lỗi xảy ra" })
  await expect(loadError).toBeVisible()
  await expect(loadError).toContainText(
    "Không thể tải dữ liệu tác vụ định kỳ lúc này."
  )
  await expect(page.getByText("Chưa có tác vụ định kỳ")).toHaveCount(0)
  await expect(page.getByText(/Expected array|Expected number/)).toHaveCount(0)
  await testInfo.attach("cronjobs-read-missing-content-error.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})

test("cronjob table no-match feedback is announced", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions(["cronjob:read"])
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto("/vi/cronjobs?jobName%5BcontainsIgnoreCase%5D=unmatched")

  const tableStatus = page.getByRole("table").getByRole("status")
  await expect(tableStatus).toBeVisible()
  await expect(tableStatus).toHaveAttribute("aria-live", "polite")
  await expect(tableStatus).toContainText("Không tìm thấy tác vụ phù hợp")
})

test("cronjob loading state is announced while the list request is pending", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["cronjob:read"])
  await fixture.setScenario("/cronjobs", "delayed")
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: "dark" })

  const navigation = page.goto("/vi/cronjobs")
  const loading = page.getByRole("status", {
    name: "Đang tải danh sách tác vụ định kỳ",
  })

  try {
    await expect(loading).toBeVisible()
    await expect(loading).toHaveAttribute("aria-busy", "true")
    await testInfo.attach("cronjobs-read-loading-mobile-390x844.png", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  } finally {
    await fixture.setScenario("/cronjobs", "success")
    await navigation
  }

  await expect(page.getByRole("article").first()).toBeVisible()
})

test("cronjob search matches partial names without case and resets the page", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions(["cronjob:read"])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/cronjobs?page=2&size=1")

  const search = page.getByRole("searchbox", { name: "Tìm tác vụ định kỳ" })
  await search.fill("aNd")

  await expect(page).toHaveURL(/page=1/)
  await expect(page).toHaveURL(/jobName%5BcontainsIgnoreCase%5D=aNd/)
  await expect(
    page.getByRole("article", { name: "Scheduled and running" })
  ).toBeVisible()
  await expect(page.getByRole("article")).toHaveCount(1)
  await expect(
    page.getByRole("article").getByText("Đang chạy", { exact: true })
  ).toBeVisible()
})

test("cronjob search and sort are keyboard operable", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions(["cronjob:read"])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/cronjobs")

  const search = page.getByRole("searchbox", { name: "Tìm tác vụ định kỳ" })
  await search.focus()
  await page.keyboard.type("aNd", { delay: 50 })
  await expect(page).toHaveURL(/jobName%5BcontainsIgnoreCase%5D=aNd/)
  await expect(
    page.getByRole("article", { name: "Scheduled and running" })
  ).toBeVisible()
  await expect(search).toBeFocused()

  await page.keyboard.press("Tab")
  const sort = page.getByRole("combobox").first()
  await expect(sort).toBeFocused()
  expect(
    await sort.evaluate((element) => element.matches(":focus-visible"))
  ).toBe(true)
  await page.keyboard.press("Enter")
  await expect(page.getByRole("option", { name: "Cũ hơn" })).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/sort=id_asc/)
})

test("cronjob controls remain permission-specific for queued and paused work", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([
    "cronjob:read",
    "cronjob:start",
    "cronjob:pause",
    "cronjob:resume",
  ])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/cronjobs")

  await expect(
    page
      .getByRole("article", { name: "Immediate trigger not started" })
      .getByRole("button", { name: "Khởi chạy" })
  ).toBeVisible()
  await expect(
    page
      .getByRole("article", { name: "Paused during execution" })
      .getByRole("button", { name: "Tiếp tục" })
  ).toBeVisible()
  await expect(
    page
      .getByRole("article", { name: "Paused after execution" })
      .getByRole("button", { name: "Tiếp tục" })
  ).toBeVisible()
  await expect(
    page
      .getByRole("article", { name: "Scheduled and running" })
      .getByRole("button", { name: "Tạm dừng" })
  ).toBeVisible()
  await expect(
    page
      .getByRole("article", { name: "Scheduled and running" })
      .getByRole("button", { name: "Khởi chạy" })
  ).toHaveCount(0)
})
