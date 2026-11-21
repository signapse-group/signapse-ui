import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { Page, TestInfo } from "@playwright/test"

import { expect, test } from "./fixtures"

async function captureRender(page: Page, testInfo: TestInfo, filename: string) {
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  })
  const body = await page.screenshot({ fullPage: true })
  await testInfo.attach(filename, { body, contentType: "image/png" })

  if (process.env.SIGN364_CAPTURE_EVIDENCE === "1") {
    const outputDirectory = resolve(
      process.cwd(),
      "docs/design/evidence/SIGN-364"
    )
    await mkdir(outputDirectory, { recursive: true })
    await writeFile(resolve(outputDirectory, filename), body)
  }
}

async function getToolbarSkeletonVisibility(page: Page) {
  return page
    .locator('[data-slot="app-list-toolbar-trailing"] > [data-slot="skeleton"]')
    .evaluateAll((skeletons) =>
      skeletons.map((skeleton) => getComputedStyle(skeleton).display !== "none")
    )
}

test("renders and applies economic calendar filters across responsive layouts", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["economic-calendar:read"])
  await page.emulateMedia({ colorScheme: "dark" })
  await page.addInitScript(() => window.localStorage.setItem("theme", "dark"))
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto(
    "/vi/economic-calendar?date=2026-11-21&title%5BcontainsIgnoreCase%5D=fixture&sort=scheduledAt_desc"
  )

  await expect(
    page.getByText("Fixture CPI release", { exact: true })
  ).toBeVisible()
  await expect(page.getByRole("combobox", { name: "Tiền tệ" })).toBeVisible()
  await expect(
    page.getByRole("combobox", { name: "Mức độ tác động" })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await captureRender(page, testInfo, "economic-calendar-desktop-1520x1024.png")

  await page.setViewportSize({ width: 390, height: 844 })
  const filtersTrigger = page.getByRole("button", { name: "Bộ lọc (0)" })
  await expect(filtersTrigger).toBeVisible()
  await filtersTrigger.click()
  await expect(
    page.getByRole("heading", { name: "Bộ lọc", exact: true })
  ).toBeVisible()
  await expect(
    page.locator("#economic-calendar-currency-filter-label")
  ).toBeVisible()
  await expect(
    page.locator("#economic-calendar-impact-filter-label")
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.getByRole("combobox", { name: "Tiền tệ" }).click()
  await page.getByRole("option", { name: "USD", exact: true }).click()
  await page.getByRole("combobox", { name: "Mức độ tác động" }).click()
  await page.getByRole("option", { name: "CAO", exact: true }).click()

  await expect
    .poll(() => {
      const currentUrl = new URL(page.url())
      return [
        currentUrl.searchParams.get("currencyCode[eq]"),
        currentUrl.searchParams.get("impact[eq]"),
      ]
    })
    .toEqual(["USD", "HIGH"])
  await expect(page.getByRole("button", { name: "Bộ lọc (2)" })).toBeVisible()

  await expect
    .poll(async () => {
      const requests = (await fixture.state()).requests.filter(
        (request) => request.path === "/economic-calendar"
      )
      return requests.some((request) => {
        const filter = new URLSearchParams(String(request.query)).get("$filter")

        return (
          filter?.includes("currencyCode eq 'USD'") &&
          filter.includes("impact eq 'HIGH'") &&
          filter.includes("containsIgnoreCase(title,'fixture')") &&
          filter.includes("scheduledAt ge '2026-11-21T00:00:00+07:00'") &&
          filter.includes("scheduledAt lt '2026-11-22T00:00:00+07:00'")
        )
      })
    })
    .toBe(true)

  await captureRender(
    page,
    testInfo,
    "economic-calendar-mobile-filters-390x844.png"
  )

  await page.getByRole("button", { name: "Đóng bộ lọc" }).click()
  await expect(page.getByRole("button", { name: "Bộ lọc (2)" })).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
})

test("matches loading filter skeletons to the toolbar at each breakpoint", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["economic-calendar:read"])
  await fixture.setScenario("/economic-calendar", "delayed", "GET")
  await page.emulateMedia({ colorScheme: "dark" })
  await page.addInitScript(() => window.localStorage.setItem("theme", "dark"))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/economic-calendar?date=2026-11-21", {
    waitUntil: "commit",
  })

  await expect
    .poll(async () => (await fixture.state()).pendingRequests)
    .toBeGreaterThan(0)
  await expect
    .poll(() => getToolbarSkeletonVisibility(page))
    .toEqual([true, false, false, true])
  await captureRender(
    page,
    testInfo,
    "economic-calendar-loading-mobile-390x844.png"
  )

  await page.setViewportSize({ width: 767, height: 844 })
  await expect
    .poll(() => getToolbarSkeletonVisibility(page))
    .toEqual([true, false, false, true])

  await page.setViewportSize({ width: 768, height: 844 })
  await expect
    .poll(() => getToolbarSkeletonVisibility(page))
    .toEqual([false, true, true, true])

  await page.setViewportSize({ width: 1520, height: 1024 })
  await expect
    .poll(() => getToolbarSkeletonVisibility(page))
    .toEqual([false, true, true, true])
  await captureRender(
    page,
    testInfo,
    "economic-calendar-loading-desktop-1520x1024.png"
  )

  await fixture.setScenario("/economic-calendar", "success", "GET")
  await expect(
    page.getByText("Fixture CPI release", { exact: true })
  ).toBeVisible()
})

test("keeps economic calendar requests behind read permission", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([])
  await page.goto("/vi/economic-calendar?date=2026-11-21")

  await expect(
    page.getByText("Bạn không có quyền truy cập", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("economic-calendar:read", { exact: true })
  ).toBeVisible()
  const calendarRequests = (await fixture.state()).requests.filter(
    (request) => request.path === "/economic-calendar"
  )
  expect(calendarRequests).toHaveLength(0)
})
