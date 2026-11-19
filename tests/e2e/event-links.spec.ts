import { copyFile, mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"

import { expect, test, waitForClientHandler } from "./fixtures"
import type { Locator, Page, TestInfo } from "@playwright/test"

import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
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
  evidenceName?: string,
  evidenceIssue = "SIGN-287",
  locator?: Locator
) {
  const path = testInfo.outputPath(name)
  if (locator) {
    await locator.screenshot({ path })
  } else {
    await page.screenshot({ path, fullPage })
  }
  await testInfo.attach(name, { path, contentType: "image/png" })

  const evidenceEnv = `${evidenceIssue.replace("-", "")}_CAPTURE_EVIDENCE`
  if (evidenceName && process.env[evidenceEnv] === "1") {
    const evidencePath = join(
      process.cwd(),
      "docs/design/evidence",
      evidenceIssue,
      evidenceName
    )
    await mkdir(dirname(evidencePath), { recursive: true })
    await copyFile(path, evidencePath)
  }
}

function getMarketReactionSection(page: Page, heading: string) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  })
}

function getVisibleTextOverlaps(
  cards: Locator,
  overlay: { x: number; y: number; width: number; height: number }
) {
  return cards.evaluateAll((cardElements, overlayBounds) => {
    const overlaps: string[] = []

    for (const card of cardElements) {
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const textNode = walker.currentNode
        if (!textNode.textContent?.trim()) continue

        const range = document.createRange()
        range.selectNodeContents(textNode)

        for (const bounds of Array.from(range.getClientRects())) {
          const visibleInViewport =
            bounds.right > 0 &&
            bounds.left < window.innerWidth &&
            bounds.bottom > 0 &&
            bounds.top < window.innerHeight
          const overlapsOverlay =
            bounds.left < overlayBounds.x + overlayBounds.width &&
            bounds.right > overlayBounds.x &&
            bounds.top < overlayBounds.y + overlayBounds.height &&
            bounds.bottom > overlayBounds.y

          if (visibleInViewport && overlapsOverlay) {
            overlaps.push(textNode.textContent.trim())
          }
        }
      }
    }

    return overlaps
  }, overlay)
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color
      .match(/\d+(?:\.\d+)?/g)
      ?.slice(0, 3)
      .map(Number)
    if (!channels || channels.length !== 3) {
      throw new Error(`Expected an RGB color, received ${color}`)
    }

    const [red, green, blue] = channels.map((channel) => {
      const value = channel / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }

  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (left, right) => right - left
  )

  return (lighter + 0.05) / (darker + 0.05)
}

async function getBadgeContrast(locator: Locator) {
  const colors = await locator.evaluate((element) => {
    const styles = window.getComputedStyle(element)
    return { foreground: styles.color, background: styles.backgroundColor }
  })

  return contrastRatio(colors.foreground, colors.background)
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

test.describe("Event AI forecast reactions", () => {
  test("renders localized stored forecasts by asset and horizon through SSR", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-market-reactions", "GET")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1280 })
    await page.goto("/en/events/61")

    const section = getMarketReactionSection(
      page,
      enDictionary.events.marketReactions
    )
    const cards = section.locator('[data-slot="card"]')

    await expect(section).toBeVisible()
    await expect(cards).toHaveCount(4)
    await expect(
      section.getByText(enDictionary.events.marketReactionsDisclosure, {
        exact: true,
      })
    ).toBeVisible()
    await expect(section.getByText("4 total", { exact: true })).toBeVisible()

    for (const [copy, variant] of [
      ["1 bullish", "positive"],
      ["1 neutral", "secondary"],
      ["1 bearish", "destructive"],
      ["1 mixed", "warning"],
    ]) {
      await expect(section.getByText(copy, { exact: true })).toHaveAttribute(
        "data-variant",
        variant
      )
    }

    const bullish = cards
      .filter({ hasText: "AKAM" })
      .filter({ hasText: "Short term" })
    await expect(bullish.getByText("Akamai Technologies")).toBeVisible()
    const bullishBadge = bullish.getByText("Bullish", { exact: true })
    await expect(bullishBadge).toHaveAttribute("data-variant", "positive")
    expect(await getBadgeContrast(bullishBadge)).toBeGreaterThanOrEqual(4.5)
    await expect(bullish.getByText("84%", { exact: true })).toBeVisible()
    await expect(
      bullish.getByText("AI reasoning", { exact: true })
    ).toBeVisible()
    await expect(
      bullish.getByText(
        "The long-term cloud contract could improve Akamai’s revenue visibility, supporting a bullish short-term outlook.",
        { exact: true }
      )
    ).toBeVisible()

    const neutral = cards
      .filter({ hasText: "SKYY" })
      .filter({ hasText: "Medium term" })
    await expect(
      neutral.getByText("First Trust Cloud Computing ETF")
    ).toBeVisible()
    await expect(neutral.getByText("Neutral", { exact: true })).toHaveAttribute(
      "data-variant",
      "secondary"
    )
    await expect(neutral.getByText("64%", { exact: true })).toBeVisible()

    const bearish = cards
      .filter({ hasText: "MSFT" })
      .filter({ hasText: "Short term" })
    await expect(bearish.getByText("Bearish", { exact: true })).toHaveAttribute(
      "data-variant",
      "destructive"
    )
    await expect(bearish.getByText("68%", { exact: true })).toBeVisible()

    const mixed = cards
      .filter({ hasText: "SKYY" })
      .filter({ hasText: "Long term" })
    await expect(mixed.getByText("Mixed", { exact: true })).toHaveAttribute(
      "data-variant",
      "warning"
    )
    await expect(mixed.getByText("61%", { exact: true })).toBeVisible()

    await expect(page.getByText("DXY", { exact: true })).toBeVisible()
    await expect(section.getByText("DXY", { exact: true })).toHaveCount(0)
    await expect(
      section.getByText(/Observed at|Reference timestamp/i)
    ).toHaveCount(0)

    const requests = (await fixture.state()).requests
    const eventRequest = requests.find(
      (request) => request.method === "GET" && request.path === "/events/61"
    )
    expect(eventRequest?.locale).toBe("en")
    expect(
      requests.some(
        (request) =>
          typeof request.path === "string" &&
          request.path.includes("derive-market-reactions")
      )
    ).toBe(false)

    await saveScreenshot(
      page,
      testInfo,
      "event-forecast-wide-en.png",
      true,
      "event-detail-wide-dark-en-1520x1280.png",
      "SIGN-291"
    )

    await page.emulateMedia({ colorScheme: "light" })
    expect(await getBadgeContrast(bullishBadge)).toBeGreaterThanOrEqual(4.5)
    await saveScreenshot(
      page,
      testInfo,
      "event-forecast-wide-light-en.png",
      true,
      "event-detail-wide-light-en-1520x1280.png",
      "SIGN-291"
    )

    // 760×512 is the effective CSS viewport for 1520×1024 at 200% zoom.
    await page.setViewportSize({ width: 760, height: 512 })
    await page.goto("/en/events/61")
    const zoomSection = getMarketReactionSection(
      page,
      enDictionary.events.marketReactions
    )
    const zoomCards = zoomSection.locator('[data-slot="card"]')
    await expect(zoomCards).toHaveCount(4)
    await expect(
      zoomSection.getByText(enDictionary.events.marketReactionsDisclosure, {
        exact: true,
      })
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(760)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    const assistantLauncher = page.getByRole("button", {
      name: "Ask Signapse",
    })
    await expect(assistantLauncher).toBeVisible()
    const initialAssistantBounds = await assistantLauncher.boundingBox()
    if (!initialAssistantBounds) {
      throw new Error("Expected the assistant launcher to render")
    }
    // Check the first paint before any scroll, then the forecast section before reading a card.
    expect(
      await getVisibleTextOverlaps(zoomCards, initialAssistantBounds)
    ).toEqual([])
    await zoomSection
      .getByRole("heading", {
        level: 2,
        name: enDictionary.events.marketReactions,
        exact: true,
      })
      .evaluate((heading) => heading.scrollIntoView({ block: "start" }))
    expect(
      await getVisibleTextOverlaps(zoomCards, initialAssistantBounds)
    ).toEqual([])
    await saveScreenshot(
      page,
      testInfo,
      "event-forecast-zoom-200-en.png",
      false,
      "event-market-reactions-zoom-200-equivalent-en-760x512.png",
      "SIGN-291"
    )

    const lastReasoning = zoomSection
      .locator('[data-slot="card"]')
      .nth(3)
      .getByText(
        "Cloud demand could lift holdings, while higher infrastructure costs could pressure margins.",
        { exact: true }
      )
    await lastReasoning.evaluate((element) =>
      element.scrollIntoView({ block: "center" })
    )
    const [reasoningBounds, assistantBounds] = await Promise.all([
      lastReasoning.boundingBox(),
      page.locator("button").filter({ hasText: "Ask Signapse" }).boundingBox(),
    ])
    expect(reasoningBounds).not.toBeNull()
    expect(assistantBounds).not.toBeNull()
    if (!reasoningBounds || !assistantBounds) {
      throw new Error("Expected the forecast and assistant launcher to render")
    }
    expect(reasoningBounds.y + reasoningBounds.height).toBeLessThan(
      assistantBounds.y
    )

    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/en/events/61")
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(390)
    await saveScreenshot(
      page,
      testInfo,
      "event-forecast-mobile-en.png",
      true,
      "event-detail-mobile-dark-en-390x844.png",
      "SIGN-291"
    )

    for (const width of [360, 720]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      await expect(cards).toHaveCount(4)
      await expect(
        section.getByText("AI reasoning", { exact: true })
      ).toHaveCount(4)
    }

    await page.goto("/en/events/63?forecast-scope=other-event")
    const otherEventSection = getMarketReactionSection(
      page,
      enDictionary.events.marketReactions
    )
    await expect(
      otherEventSection.getByText(enDictionary.events.noMarketReactionsTitle, {
        exact: true,
      })
    ).toBeVisible()
    await expect(otherEventSection.locator('[data-slot="card"]')).toHaveCount(0)

    await page.goto("/vi/events/61")
    const localizedSection = getMarketReactionSection(
      page,
      viDictionary.events.marketReactions
    )
    await expect(localizedSection).toBeVisible()
    await expect(
      localizedSection.getByText(
        viDictionary.events.marketReactionsDisclosure,
        { exact: true }
      )
    ).toBeVisible()
    await expect(
      localizedSection.getByText("Tăng giá", { exact: true })
    ).toBeVisible()
    await expect(
      localizedSection.getByText(
        "Hợp đồng điện toán đám mây dài hạn có thể cải thiện khả năng dự đoán doanh thu của Akamai, hỗ trợ triển vọng tăng trong ngắn hạn.",
        { exact: true }
      )
    ).toBeVisible()

    const eventIds = (await fixture.state()).requests
      .filter(
        (request) =>
          request.method === "GET" &&
          (request.path === "/events/61" || request.path === "/events/63")
      )
      .map((request) => request.path)
    expect(eventIds).toContain("/events/61")
    expect(eventIds).toContain("/events/63")
    expect(
      (await fixture.state()).requests.some(
        (request) =>
          typeof request.path === "string" &&
          request.path.includes("derive-market-reactions")
      )
    ).toBe(false)
  })

  test("distinguishes no forecasts, incomplete forecast data, and event load errors", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 900 })

    await fixture.setScenario("/events", "event-market-reactions-empty", "GET")
    await page.goto("/vi/events/63?scenario=empty")
    const emptySection = getMarketReactionSection(
      page,
      viDictionary.events.marketReactions
    )
    await expect(
      emptySection.getByText(viDictionary.events.noMarketReactionsTitle, {
        exact: true,
      })
    ).toBeVisible()
    await expect(emptySection.locator('[data-slot="card"]')).toHaveCount(0)
    await expect(
      emptySection.getByText("Trung lập", { exact: true })
    ).toHaveCount(0)
    await saveScreenshot(
      page,
      testInfo,
      "event-market-reactions-empty-compact-vi.png",
      true,
      "event-market-reactions-empty-compact-vi-1024x900.png",
      "SIGN-291"
    )

    await fixture.setScenario(
      "/events",
      "event-market-reactions-missing",
      "GET"
    )
    await page.goto("/vi/events/61?scenario=missing")
    const unavailableSection = getMarketReactionSection(
      page,
      viDictionary.events.marketReactions
    )
    await expect(unavailableSection.getByRole("alert")).toContainText(
      viDictionary.events.marketReactionsUnavailableTitle
    )
    await expect(
      unavailableSection.getByText(viDictionary.events.noMarketReactionsTitle, {
        exact: true,
      })
    ).toHaveCount(0)

    await fixture.setScenario("/events", "event-detail-error", "GET")
    await page.goto("/en/events/61?scenario=error")
    await expect(
      page.getByText(enDictionary.events.errorTitle, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(enDictionary.events.noMarketReactionsTitle, {
        exact: true,
      })
    ).toHaveCount(0)
  })

  test("keeps nullable confidence and reasoning distinct from stored forecasts", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/events",
      "event-market-reactions-null-fields",
      "GET"
    )
    await page.goto("/en/events/61")

    const section = getMarketReactionSection(
      page,
      enDictionary.events.marketReactions
    )
    const card = section.locator('[data-slot="card"]')
    await expect(card).toHaveCount(1)
    await expect(
      card.getByText(enDictionary.common.notAvailable, { exact: true })
    ).toBeVisible()
    await expect(
      card.getByText(enDictionary.events.marketReactionReasoning, {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      card.getByText(enDictionary.events.noReasoning, { exact: true })
    ).toBeVisible()
    await expect(card.getByText("Asset ID 101", { exact: true })).toBeVisible()
    await expect(
      section.getByText(/Observed at|Reference timestamp/i)
    ).toHaveCount(0)

    await fixture.setScenario(
      "/events",
      "event-market-reactions-null-fields",
      "GET"
    )
    await page.goto("/vi/events/61")
    const localizedCard = getMarketReactionSection(
      page,
      viDictionary.events.marketReactions
    ).locator('[data-slot="card"]')
    await expect(
      localizedCard.getByText("Mã tài sản 101", { exact: true })
    ).toBeVisible()
  })
})
