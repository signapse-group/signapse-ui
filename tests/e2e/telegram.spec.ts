import { mkdir } from "node:fs/promises"
import { resolve } from "node:path"

import { expect, test, waitForClientHandler } from "./fixtures"

test.describe("P0 Telegram operations", () => {
  test("covers destination delivery states and destructive confirmation", async ({
    page,
    fixture,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    await expect(
      page.getByRole("heading", { name: "Hạ tầng Telegram" })
    ).toBeVisible()
    await expect(
      page.getByText("Fixture operations bot", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("cell", { name: "Operations channel", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("listitem").filter({ hasText: "Disabled channel" }).first()
    ).toBeVisible()
    const disabledTestMessage = page.getByRole("button", {
      name: "Gửi tin nhắn thử tới Disabled channel",
    })
    await expect(disabledTestMessage).toHaveAttribute("aria-disabled", "true")

    const activeTestMessage = page
      .getByRole("button", {
        name: "Gửi tin nhắn thử tới Operations channel",
        exact: true,
      })
      .first()
    await waitForClientHandler(activeTestMessage)

    await page.screenshot({
      path: test.info().outputPath("telegram-test-message-wide.png"),
      fullPage: true,
    })

    for (const frame of [
      { name: "compact", width: 1024, height: 768 },
      { name: "mobile", width: 390, height: 844 },
      { name: "mobile-360", width: 360, height: 800 },
    ]) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(activeTestMessage).toBeVisible()
      await page.screenshot({
        path: test.info().outputPath(`telegram-test-message-${frame.name}.png`),
        fullPage: true,
      })
    }

    // A 195px CSS viewport is the effective width of a 390px window at 200% zoom.
    await page.setViewportSize({ width: 195, height: 422 })
    const effectiveZoomWidth = await page.evaluate(() => window.innerWidth)
    expect(effectiveZoomWidth).toBe(195)
    await expect(activeTestMessage).toBeVisible()
    await page.screenshot({
      path: test
        .info()
        .outputPath("telegram-test-message-200-percent-effective-width.png"),
      fullPage: true,
    })
    await page.setViewportSize({ width: 390, height: 844 })

    await fixture.setScenario(
      "/telegram/destinations/21/test-message",
      "mutation-failure",
      "POST"
    )
    await activeTestMessage.click()
    await expect(
      page.getByText("Fixture mutation failed; retry is safe", { exact: true })
    ).toBeVisible()

    await fixture.setScenario(
      "/telegram/destinations/21/test-message",
      "timeout",
      "POST"
    )
    await activeTestMessage.click()
    const unknownOutcomeToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /Telegram chưa xác nhận có chấp nhận tin nhắn thử/ })
    await expect(unknownOutcomeToast).toHaveText(
      "Telegram chưa xác nhận có chấp nhận tin nhắn thử hay không. Hãy kiểm tra cuộc trò chuyện Telegram trước khi thử lại."
    )

    await fixture.setScenario(
      "/telegram/destinations/21/test-message",
      "success",
      "POST"
    )
    await activeTestMessage.click()
    await expect(
      page.getByText(
        "Telegram đã chấp nhận tin nhắn thử cho Operations channel.",
        { exact: true }
      )
    ).toBeVisible()

    await page
      .getByRole("button", { name: "Thao tác điểm nhận", exact: true })
      .first()
      .click()
    await page
      .getByRole("menuitem", { name: "Xóa điểm nhận", exact: true })
      .click()

    const deleteDialog = page.getByRole("alertdialog")
    await expect(deleteDialog).toContainText("Xóa điểm nhận Telegram?")
    await deleteDialog.getByRole("button", { name: "Hủy", exact: true }).click()
    await expect(deleteDialog).toBeHidden()

    await expect(
      page.getByText("Định tuyến tính năng", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Lịch gửi phân tích", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("BTC morning analysis", { exact: true })
    ).toBeVisible()

    const calendarRow = page
      .getByRole("row")
      .filter({ hasText: "Cảnh báo lịch kinh tế" })
      .first()
    const calendarLanguage = calendarRow.getByRole("combobox", {
      name: "Chọn ngôn ngữ đầu ra cho Cảnh báo lịch kinh tế",
    })
    await calendarLanguage.click()
    await page
      .getByRole("option", {
        name: "Theo ngôn ngữ ưu tiên của chủ sở hữu (hoặc mặc định hệ thống)",
      })
      .click()
    await expect(calendarRow.getByText("Theo ngôn ngữ ưu tiên")).toBeVisible()

    const newsCard = page.getByTestId("market-news-routing-card")
    await fixture.setScenario(
      "/telegram/feature-settings",
      "mutation-failure",
      "PUT"
    )
    await newsCard
      .getByRole("combobox", {
        name: "Chọn ngôn ngữ đầu ra cho Cảnh báo tin thị trường",
      })
      .click()
    await page
      .getByRole("option", { name: "English (en)", exact: true })
      .click()
    await expect(
      page
        .getByText("Fixture mutation failed; retry is safe", { exact: true })
        .last()
    ).toBeVisible()
    await expect(
      newsCard.getByRole("combobox", {
        name: "Chọn ngôn ngữ đầu ra cho Cảnh báo tin thị trường",
      })
    ).toContainText("Tiếng Việt")

    await fixture.setScenario("/telegram/feature-settings", "success", "PUT")
    await newsCard
      .getByRole("combobox", {
        name: "Chọn ngôn ngữ đầu ra cho Cảnh báo tin thị trường",
      })
      .click()
    await page
      .getByRole("option", { name: "English (en)", exact: true })
      .click()
    await expect(newsCard).toContainText("English (en)")

    const newsSwitch = newsCard.getByRole("switch", {
      name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
    })
    await newsSwitch.click()
    await expect(newsSwitch).toHaveAttribute("aria-checked", "true")

    await newsCard
      .getByRole("button", {
        name: "Bỏ điểm nhận của Cảnh báo tin thị trường",
      })
      .click()
    await expect(
      page.getByText("Đã bỏ điểm nhận và tắt định tuyến.", { exact: true })
    ).toBeVisible()
    await expect(
      newsCard.getByRole("combobox", {
        name: "Cảnh báo tin thị trường",
        exact: true,
      })
    ).toContainText("Chọn điểm nhận")
    await expect(
      newsCard.getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
    ).toHaveAttribute("aria-checked", "false")
    await expect(newsCard).toContainText("English (en)")

    await newsCard
      .getByRole("combobox", {
        name: "Cảnh báo tin thị trường",
        exact: true,
      })
      .click()
    await page
      .getByRole("option", { name: "Operations channel", exact: true })
      .click()
    await expect(
      newsCard.getByRole("combobox", {
        name: "Cảnh báo tin thị trường",
        exact: true,
      })
    ).toContainText("Operations channel")
    await expect(
      newsCard.getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
    ).toHaveAttribute("aria-checked", "false")
    await expect(newsCard).toContainText("English (en)")

    await newsCard
      .getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
      .click()
    await expect(
      newsCard.getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
    ).toHaveAttribute("aria-checked", "true")

    const featureUpdates = (await fixture.state()).requests
      .filter(
        (request) =>
          request.method === "PUT" &&
          request.path === "/telegram/feature-settings" &&
          (request.body as { featureKey?: string } | undefined)?.featureKey ===
            "MARKET_NEWS_ALERT"
      )
      .map(({ body }) => body)
    expect(featureUpdates).toEqual([
      {
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: 1,
        outputLanguageIsoCode: "en",
      },
      {
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: 1,
        outputLanguageIsoCode: "en",
      },
      { featureKey: "MARKET_NEWS_ALERT", workspaceId: 1, enabled: true },
      {
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: 1,
        destinationId: null,
        enabled: false,
      },
      {
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: 1,
        destinationId: 21,
      },
      { featureKey: "MARKET_NEWS_ALERT", workspaceId: 1, enabled: true },
    ])

    const scheduledRow = page
      .getByRole("row")
      .filter({ hasText: "Phân tích thị trường theo lịch" })
      .first()
    await expect(
      scheduledRow.getByRole("combobox", {
        name: /Chọn ngôn ngữ đầu ra/,
      })
    ).toHaveCount(0)
  })

  test("creates a pending link and displays verification only after readback", async ({
    page,
    fixture,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    const linkTrigger = page.getByRole("button", {
      name: "Liên kết điểm nhận",
      exact: true,
    })
    await waitForClientHandler(linkTrigger)
    await linkTrigger.focus()
    await page.keyboard.press("Enter")

    const dialog = page.getByRole("dialog", { name: "Liên kết điểm nhận" })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("button", { name: "Đóng", exact: true }).first()
    ).toBeFocused()
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement)
      )
    ).toBe(true)
    await dialog.screenshot({
      path: test.info().outputPath("telegram-link-select-wide.png"),
    })

    const botSelect = dialog.getByRole("combobox", {
      name: "Bot nhận lệnh /start",
    })
    await botSelect.focus()
    await page.keyboard.press("Enter")
    await expect(
      page.getByRole("option", { name: "Fixture operations bot" })
    ).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(botSelect).toContainText("Fixture operations bot")

    await fixture.setScenario(
      "/telegram/destinations/link-token",
      "permission-denied",
      "POST"
    )
    const createButton = dialog.getByRole("button", {
      name: "Tạo lệnh liên kết",
    })
    await createButton.focus()
    await page.keyboard.press("Enter")
    await expect(dialog.getByRole("alert")).toContainText(
      "Fixture permission denied"
    )
    await expect(dialog.getByRole("status")).toHaveCount(0)

    await fixture.setScenario(
      "/telegram/destinations/link-token",
      "success",
      "POST"
    )
    await createButton.focus()
    await page.keyboard.press("Enter")

    const pending = dialog.getByText("Chờ xác minh", { exact: true })
    await expect(pending).toBeVisible()
    await expect(dialog.getByLabel("Lệnh liên kết")).toBeFocused()
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement))
      )
      .toBe(true)
    await expect(
      dialog.getByText("Fixture operations bot", { exact: true })
    ).toBeVisible()
    await expect(dialog.getByLabel("Lệnh liên kết")).toHaveValue(
      "/start ExampleLinkToken0123456789ABCDEF"
    )
    await expect(dialog.getByText(/Hết hạn:/)).toBeVisible()
    await expect(dialog.getByText("Đã xác minh", { exact: true })).toHaveCount(
      0
    )
    await expect(
      page.getByText("Đã tạo lệnh liên kết Telegram.", { exact: true })
    ).toBeHidden()

    await page.emulateMedia({ colorScheme: "light" })
    await expect(dialog).toBeVisible()
    await dialog.screenshot({
      path: test.info().outputPath("telegram-link-pending-wide-light.png"),
    })
    await page.emulateMedia({ colorScheme: "dark" })

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(dialog).toBeVisible()
    await expect(pending).toBeVisible()
    await dialog.screenshot({
      path: test.info().outputPath("telegram-link-pending-mobile-390.png"),
    })
    await page.screenshot({
      path: test.info().outputPath("telegram-link-pending-mobile-context.png"),
    })

    for (const frame of [
      { width: 360, height: 800 },
      { width: 195, height: 422 },
    ]) {
      await page.setViewportSize(frame)
      await expect(dialog).toBeVisible()
      const pageWidths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(pageWidths.scroll).toBeLessThanOrEqual(pageWidths.client)
      await expect(dialog.getByLabel("Lệnh liên kết")).toHaveValue(
        "/start ExampleLinkToken0123456789ABCDEF"
      )
    }
    const commandField = dialog.getByLabel("Lệnh liên kết")
    expect((await commandField.boundingBox())?.height ?? 0).toBeGreaterThan(32)
    expect((await dialog.boundingBox())?.height ?? 0).toBeLessThanOrEqual(390)
    await dialog.screenshot({
      path: test
        .info()
        .outputPath("telegram-link-pending-effective-200-zoom.png"),
    })
    const dialogScroll = await dialog.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowY: getComputedStyle(element).overflowY,
    }))
    expect(dialogScroll.scrollHeight).toBeGreaterThan(dialogScroll.clientHeight)
    expect(dialogScroll.overflowY).toBe("auto")

    const destinationReadsBeforeClose = (await fixture.state()).requests.filter(
      (request) =>
        request.method === "GET" && request.path === "/telegram/destinations"
    ).length
    const closeButton = dialog
      .getByRole("button", {
        name: "Đóng",
        exact: true,
      })
      .last()
    let closeButtonFocused = await closeButton.evaluate(
      (element) => element === document.activeElement
    )
    for (let attempt = 0; attempt < 6 && !closeButtonFocused; attempt += 1) {
      await page.keyboard.press("Tab")
      await expect
        .poll(() =>
          dialog.evaluate((element) => element.contains(document.activeElement))
        )
        .toBe(true)
      closeButtonFocused = await closeButton.evaluate(
        (element) => element === document.activeElement
      )
    }
    await expect(closeButton).toBeFocused()
    await dialog.screenshot({
      path: test
        .info()
        .outputPath("telegram-link-pending-keyboard-close-200-zoom.png"),
    })
    await page.keyboard.press("Enter")
    await expect(dialog).toBeHidden()
    await expect(linkTrigger).toBeFocused()
    await expect
      .poll(async () => {
        const requests = (await fixture.state()).requests
        return requests.filter(
          (request) =>
            request.method === "GET" &&
            request.path === "/telegram/destinations"
        ).length
      })
      .toBe(destinationReadsBeforeClose + 1)
    await expect(
      page.getByText("Verified after link", { exact: true })
    ).toHaveCount(0)

    await fixture.setScenario(
      "/telegram/destinations",
      "telegram-verified-readback",
      "GET"
    )
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.reload()
    const verifiedItem = page
      .getByRole("listitem")
      .filter({ hasText: "Verified after link" })
    await expect(verifiedItem).toContainText("Đang hoạt động")
    await expect(verifiedItem).toContainText("Signapse Fixture Bot")
  })

  test("does not read destination results without destination read permission", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions([
      "telegram-bot-connection:read",
      "telegram-destination:manage",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/vi/telegram")

    const linkTrigger = page.getByRole("button", {
      name: "Liên kết điểm nhận",
      exact: true,
    })
    await expect(linkTrigger).toBeEnabled()
    await linkTrigger.click()

    const dialog = page.getByRole("dialog", { name: "Liên kết điểm nhận" })
    const botSelect = dialog.getByRole("combobox", {
      name: "Bot nhận lệnh /start",
    })
    await botSelect.click()
    await page.getByRole("option", { name: "Fixture operations bot" }).click()
    await dialog.getByRole("button", { name: "Tạo lệnh liên kết" }).click()

    await expect(
      dialog.getByText("Chờ xác minh", { exact: true })
    ).toBeVisible()
    await expect(
      dialog.getByText(
        "Bạn cần quyền đọc điểm nhận để kiểm tra kết quả xác minh."
      )
    ).toBeVisible()
    await dialog
      .getByRole("button", { name: "Đóng", exact: true })
      .last()
      .click()

    const destinationReads = (await fixture.state()).requests.filter(
      (request) =>
        request.method === "GET" && request.path === "/telegram/destinations"
    )
    expect(destinationReads).toHaveLength(0)
  })

  test("isolates market routing permissions and keeps schedule read independent", async ({
    page,
    fixture,
  }) => {
    const permissions = [
      "telegram-market-news-routing:read",
      "telegram-destination:read",
      "telegram-feature-setting:update",
      "telegram-market-analysis-schedule:read",
      "workspace:read",
    ]
    await fixture.setPermissions(permissions)
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    const newsCard = page.getByTestId("market-news-routing-card")
    await expect(newsCard).toBeVisible()
    await expect(
      page.getByText("Cảnh báo lịch kinh tế", { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Phân tích thị trường theo lịch", { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Lịch gửi phân tích", { exact: true })
    ).toBeVisible()
    await expect(
      newsCard.getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
    ).toHaveAttribute("aria-disabled", "true")

    await fixture.setPermissions([
      ...permissions,
      "telegram-market-news-routing:update",
    ])
    await page.reload()
    await expect(
      newsCard.getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
    ).not.toHaveAttribute("aria-disabled", "true")
  })

})

const renderEvidenceFrames = [
  { name: "wide-dark-en-1520x1024", width: 1520, height: 1024, locale: "en" },
  { name: "compact-dark-en-1024x768", width: 1024, height: 768, locale: "en" },
  { name: "mobile-dark-en-390x1420", width: 390, height: 1420, locale: "en" },
  {
    name: "small-mobile-dark-vi-360x800",
    width: 360,
    height: 800,
    locale: "vi",
  },
  { name: "effective-760x512-dark-vi", width: 760, height: 512, locale: "vi" },
] as const

for (const frame of renderEvidenceFrames) {
  test(`renders Telegram routing at ${frame.name}`, async ({ page }) => {
    await page.setViewportSize({ width: frame.width, height: frame.height })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto(`/${frame.locale}/telegram`)
    await expect(page.locator("html")).toHaveClass(/dark/)

    const routeControl = page.locator(
      '[data-feature-key="MARKET_NEWS_ALERT"]:visible'
    )
    await expect(routeControl).toBeVisible()
    const routingSection = page.locator(
      'section[aria-labelledby="telegram-routing"]'
    )
    const infrastructureSection = page.locator(
      'section[aria-labelledby="telegram-infrastructure"]'
    )
    const routingBounds = await routingSection.boundingBox()
    const infrastructureBounds = await infrastructureSection.boundingBox()
    expect(routingBounds).not.toBeNull()
    expect(infrastructureBounds).not.toBeNull()
    if (!routingBounds || !infrastructureBounds) {
      throw new Error("Telegram page sections were not rendered")
    }
    if (frame.width >= 1024) {
      expect(infrastructureBounds.x).toBeGreaterThan(routingBounds.x)
    } else {
      expect(infrastructureBounds.y).toBeGreaterThan(routingBounds.y)
    }

    const routeSwitch = routeControl.getByRole("switch")
    await waitForClientHandler(routeSwitch)
    await routeSwitch.click()
    await expect(routeSwitch).toHaveAttribute("aria-checked", "true")
    const enabledToast = page.getByText(
      frame.locale === "vi"
        ? "Đã bật định tuyến Telegram."
        : "Telegram routing enabled.",
      { exact: true }
    )
    await expect(enabledToast).toBeVisible()
    await expect(enabledToast).toBeHidden()

    const pageOverflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    )
    expect(pageOverflows).toBe(false)

    const evidenceDirectory = resolve(
      process.cwd(),
      "docs/design/evidence/SIGN-392"
    )
    await mkdir(evidenceDirectory, { recursive: true })
    const routingTable = routeControl.locator(
      "xpath=ancestor::div[@data-slot='table-container'][1]"
    )
    if (await routingTable.count()) {
      await routingTable.evaluate((element) => {
        const container = element as HTMLElement
        container.scrollLeft = 0
      })
    }
    await page.screenshot({
      path: resolve(evidenceDirectory, `telegram-routing-${frame.name}.png`),
      fullPage: true,
      animations: "disabled",
    })
  })
}

test("keeps the market route visible without page overflow at shell breakpoints", async ({
  page,
}) => {
  await page.goto("/en/telegram")
  const routeControl = page.locator(
    '[data-feature-key="MARKET_NEWS_ALERT"]:visible'
  )

  for (const width of [
    360, 390, 767, 768, 1024, 1439, 1440, 1520, 1920, 2560,
  ]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(routeControl).toBeVisible()
    const pageOverflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    )
    expect(pageOverflows, `page overflow at ${width}px`).toBe(false)
  }
