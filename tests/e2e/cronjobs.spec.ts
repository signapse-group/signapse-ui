import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

test("cronjob read permission renders responsive list and in-context detail", async ({
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
  }

  await page.setViewportSize({ width: 1520, height: 1024 })
  await testInfo.attach("cronjobs-read-wide-1520x1024.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await pausedCard.getByRole("link", { name: "Xem chi tiết" }).click()
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

test("Start actions stay available across responsive breakpoints", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["cronjob:read", "cronjob:start"])
  await page.emulateMedia({ colorScheme: "dark" })
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/cronjobs")

  // 760×512 CSS px is the effective viewport at 200% zoom from 1520×1024.
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [760, 512],
    [767, 844],
    [768, 768],
    [1024, 768],
    [1439, 900],
    [1440, 1024],
    [1520, 1024],
  ]) {
    await page.setViewportSize({ width, height })

    const actionSurface =
      width < 768
        ? page.getByRole("article", { name: "Immediate trigger not started" })
        : page.getByRole("row", { name: /Immediate trigger not started/ })
    await expect(
      actionSurface.getByRole("button", { name: "Start" })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)

    if (width === 1520) {
      await testInfo.attach("cronjobs-actions-wide-en-1520x1024.png", {
        body: await page.locator("#cronjob-list").screenshot(),
        contentType: "image/png",
      })
    }
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/vi/cronjobs")
  const mobileStart = page
    .getByRole("article", { name: "Immediate trigger not started" })
    .getByRole("button", { name: "Khởi chạy" })
  await expect(mobileStart).toBeVisible()
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/)
  await testInfo.attach("cronjobs-actions-mobile-light-vi-390x844.png", {
    body: await page.locator("#cronjob-list").screenshot(),
    contentType: "image/png",
  })

  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  await testInfo.attach("cronjobs-actions-mobile-vi-390x844.png", {
    body: await page.locator("#cronjob-list").screenshot(),
    contentType: "image/png",
  })
  await mobileStart.focus()
  await expect(mobileStart).toBeFocused()
  await testInfo.attach("cronjobs-actions-mobile-focus-vi-390x844.png", {
    body: await page.locator("#cronjob-list").screenshot(),
    contentType: "image/png",
  })
})
