import { copyFile, mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"

import { expect, test, waitForClientHandler } from "./fixtures"
import type { Locator, Page, TestInfo } from "@playwright/test"

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

const eventTitle = "Central bank signals a slower easing path"
const emptyLinkCopy = [
  viDictionary.events.noAssetsTitle,
  viDictionary.events.noAssetsDescription,
  viDictionary.events.noThemesTitle,
  viDictionary.events.noThemesDescription,
]

async function expectEmptyLinks(surface: Locator | Page) {
  for (const copy of emptyLinkCopy) {
    await expect(surface.getByText(copy, { exact: true })).toBeVisible()
  }
}

async function openQuickEvent(page: Page) {
  await page.goto("/vi/dashboard")
  const trigger = page.getByRole("button", {
    name: `Mở sự kiện: ${eventTitle}`,
    exact: true,
  })
  await expect(trigger).toBeVisible()
  await waitForClientHandler(trigger)
  await trigger.click()

  return page.getByRole("dialog")
}

async function saveScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage = false,
  evidenceName?: string
) {
  const path = testInfo.outputPath(name)
  await page.screenshot({ path, fullPage })
  await testInfo.attach(name, { path, contentType: "image/png" })

  if (evidenceName && process.env.SIGN287_CAPTURE_EVIDENCE === "1") {
    const evidencePath = join(
      process.cwd(),
      "docs/design/evidence/SIGN-287",
      evidenceName
    )
    await mkdir(dirname(evidencePath), { recursive: true })
    await copyFile(path, evidencePath)
  }
}

test.describe("Event asset and theme roles", () => {
  test("renders localized canonical roles in Event Detail through SSR", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-links", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1280 })
    await page.goto("/vi/events/61")

    await expect(
      page.getByRole("heading", { level: 1, name: eventTitle, exact: true })
    ).toBeVisible()
    await expect(page.getByText("Cổ phiếu", { exact: true })).toBeVisible()
    await expect(page.getByText("ETF", { exact: true })).toBeVisible()

    await expect(
      page.getByText("Chủ thể chính", { exact: true })
    ).toHaveAttribute("data-variant", "info")
    await expect(
      page.getByText("Tài sản bị ảnh hưởng", { exact: true })
    ).toHaveAttribute("data-variant", "secondary")
    await expect(
      page.getByText("Tài sản tham chiếu", { exact: true })
    ).toHaveAttribute("data-variant", "outline")
    await expect(page.getByText("Chủ đề chính", { exact: true })).toBeVisible()
    await expect(page.getByText("Chủ đề phụ", { exact: true })).toBeVisible()
    await expect(page.getByText("Lãi suất", { exact: true })).toBeVisible()
    await expect(
      page.getByText("Thị trường trái phiếu", { exact: true })
    ).toBeVisible()

    const request = (await fixture.state()).requests.find(
      (item) => item.method === "GET" && item.path === "/events/61"
    )
    expect(request?.locale).toBe("vi")

    await saveScreenshot(
      page,
      testInfo,
      "event-detail-wide-vi.png",
      true,
      "event-detail-wide-dark-vi-1520x1280.png"
    )
    await page.setViewportSize({ width: 390, height: 844 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(390)
    await saveScreenshot(
      page,
      testInfo,
      "event-detail-mobile-vi.png",
      true,
      "event-detail-mobile-dark-vi-390x844.png"
    )

    for (const width of [360, 720]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      await expect(
        page.getByText("Chủ thể chính", { exact: true })
      ).toBeVisible()
      await expect(
        page.getByText("Tài sản bị ảnh hưởng", { exact: true })
      ).toBeVisible()
      await expect(
        page.getByText("Tài sản tham chiếu", { exact: true })
      ).toBeVisible()
      await expect(
        page.getByText("Chủ đề chính", { exact: true })
      ).toBeVisible()
      await expect(page.getByText("Chủ đề phụ", { exact: true })).toBeVisible()

      if (width === 720) {
        await saveScreenshot(
          page,
          testInfo,
          "event-detail-effective-200-vi.png",
          true,
          "event-detail-dark-vi-effective-720x900.png"
        )
      }
    }

    for (const [section, screenshot] of [
      [viDictionary.events.relatedAssets, "event-detail-mobile-assets-vi.png"],
      [viDictionary.events.relatedThemes, "event-detail-mobile-themes-vi.png"],
    ]) {
      const heading = page.getByRole("heading", { name: section })
      await heading.evaluate((element) => {
        window.scrollTo({
          top: window.scrollY + element.getBoundingClientRect().top - 96,
          behavior: "instant",
        })
      })
      await saveScreenshot(page, testInfo, screenshot)
    }
  })

  test("shows assets and themes in Quick Event across wide, compact, and mobile", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-links", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1440 })
    await openQuickEvent(page)

    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("heading", { name: eventTitle, exact: true })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: viDictionary.common.openFullPage })
    ).toHaveAttribute("href", "/vi/events/61")
    await expect(
      dialog.getByText(viDictionary.events.statusLabels.ENRICHED, {
        exact: true,
      })
    ).toHaveCount(0)
    await expect(
      dialog.getByText("Chủ thể chính", { exact: true })
    ).toHaveAttribute("data-variant", "info")
    await expect(
      dialog.getByText("Tài sản bị ảnh hưởng", { exact: true })
    ).toHaveAttribute("data-variant", "secondary")
    await expect(
      dialog.getByText("Tài sản tham chiếu", { exact: true })
    ).toHaveAttribute("data-variant", "outline")
    await expect(
      dialog.getByText("Chủ đề chính", { exact: true })
    ).toBeVisible()
    await expect(dialog.getByText("Chủ đề phụ", { exact: true })).toBeVisible()
    await expect(dialog.getByText("Lãi suất", { exact: true })).toBeVisible()

    await page.emulateMedia({ colorScheme: "light" })
    await expect(page.locator("html")).toHaveClass(/light/)
    await saveScreenshot(
      page,
      testInfo,
      "quick-event-wide-light-vi.png",
      false,
      "quick-event-wide-light-vi-1520x1440.png"
    )
    await page.emulateMedia({ colorScheme: "dark" })
    await expect(page.locator("html")).toHaveClass(/dark/)

    for (const viewport of [
      { width: 1520, height: 1440, placement: "right" },
      { width: 1024, height: 900, placement: "bottom" },
      { width: 720, height: 900, placement: "bottom" },
      { width: 390, height: 844, placement: "bottom" },
      { width: 360, height: 844, placement: "bottom" },
    ]) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await expect(
        page.locator("[data-quick-detail-placement]")
      ).toHaveAttribute("data-quick-detail-placement", viewport.placement)
      await expect(dialog).toBeVisible()
      await expect(
        dialog.getByRole("link", { name: viDictionary.common.openFullPage })
      ).toHaveAttribute("href", "/vi/events/61")
      await expect(
        dialog.getByText("Chủ thể chính", { exact: true })
      ).toBeVisible()
      await expect(
        dialog.getByText("Tài sản bị ảnh hưởng", { exact: true })
      ).toBeVisible()
      await expect(
        dialog.getByText("Tài sản tham chiếu", { exact: true })
      ).toBeVisible()
      await expect(
        dialog.getByText("Chủ đề chính", { exact: true })
      ).toBeVisible()
      await expect(
        dialog.getByText("Chủ đề phụ", { exact: true })
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(viewport.width)

      if (viewport.width === 1024) {
        await dialog
          .getByRole("heading", { name: viDictionary.events.relatedThemes })
          .scrollIntoViewIfNeeded()
        await saveScreenshot(
          page,
          testInfo,
          "quick-event-compact-themes-vi.png",
          false,
          "quick-event-compact-dark-vi-1024x900-assets-and-themes.png"
        )
      }

      if (viewport.width === 720) {
        await dialog
          .getByRole("heading", { name: viDictionary.events.relatedAssets })
          .scrollIntoViewIfNeeded()
        await saveScreenshot(
          page,
          testInfo,
          "quick-event-effective-200-assets-vi.png",
          false,
          "quick-event-dark-vi-effective-720x900-assets-and-themes.png"
        )
      }

      if (viewport.width === 390) {
        await dialog
          .getByRole("heading", { name: viDictionary.events.relatedThemes })
          .scrollIntoViewIfNeeded()
        await saveScreenshot(
          page,
          testInfo,
          "quick-event-mobile-themes-vi.png",
          false,
          "quick-event-mobile-dark-vi-390x844-assets-and-themes.png"
        )
      }
    }

    const request = (await fixture.state()).requests.find(
      (item) => item.method === "GET" && item.path === "/events/61"
    )
    expect(request?.locale).toBe("vi")
    await page.setViewportSize({ width: 1520, height: 1440 })
    await saveScreenshot(page, testInfo, "quick-event-wide-vi.png")
  })

  test("keeps the same empty links on both surfaces for no-match and failure", async ({
    page,
    fixture,
  }) => {
    for (const [scenario, status] of [
      ["event-empty-no-match", "ENRICHMENT_NO_MATCH"],
      ["event-empty-failed", "ENRICHMENT_FAILED"],
    ] as const) {
      await fixture.setScenario("/events", scenario, "GET")
      await page.goto(`/vi/events/61?result=${scenario}`)

      await expect(
        page.getByText(viDictionary.events.statusLabels[status], {
          exact: true,
        })
      ).toBeVisible()
      await expectEmptyLinks(page)

      const dialog = await openQuickEvent(page)
      await expectEmptyLinks(dialog)
      await expect(
        dialog.getByText(viDictionary.events.statusLabels[status], {
          exact: true,
        })
      ).toHaveCount(0)

      await dialog.getByRole("button", { name: "Đóng", exact: true }).click()
    }
  })
})
