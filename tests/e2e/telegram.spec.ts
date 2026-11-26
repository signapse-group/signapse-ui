import { expect, test, waitForClientHandler } from "./fixtures"
import type { Locator, Page } from "@playwright/test"

async function setTelegramTheme(page: Page, theme: "light" | "dark") {
  await page.getByRole("button", { name: "Chọn giao diện" }).click()
  await page
    .getByRole("menuitem", { name: theme === "light" ? "Sáng" : "Tối" })
    .click()
  await expect(page.locator("html")).toHaveClass(new RegExp(theme))
}

async function getDestructiveControlContrast(
  trigger: Locator,
  focusRing = false
) {
  return trigger.evaluate((element, measureFocusRing) => {
    if (measureFocusRing && !element.matches(":focus-visible")) return 0

    function luminance(color: Uint8ClampedArray) {
      const channel = (value: number) => {
        const normalized = value / 255
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4
      }
      return (
        0.2126 * channel(color[0]) +
        0.7152 * channel(color[1]) +
        0.0722 * channel(color[2])
      )
    }

    const context = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    })
    if (!context) throw new Error("Canvas is unavailable for color sampling")
    context.canvas.width = 1
    context.canvas.height = 1

    const style = getComputedStyle(element)
    const backgrounds: string[] = []
    for (
      let ancestor = measureFocusRing ? element.parentElement : element;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      backgrounds.push(getComputedStyle(ancestor).backgroundColor)
    }
    context.fillStyle = "#000"
    context.fillRect(0, 0, 1, 1)
    for (const background of backgrounds.reverse()) {
      context.fillStyle = background
      context.fillRect(0, 0, 1, 1)
    }
    const background = context.getImageData(0, 0, 1, 1).data

    let foregroundColor = style.color
    if (measureFocusRing) {
      const colors = style.boxShadow.match(
        /(?:rgba?\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|color\([^)]*\))/g
      )
      foregroundColor =
        colors?.find((color) => {
          context.clearRect(0, 0, 1, 1)
          context.fillStyle = color
          context.fillRect(0, 0, 1, 1)
          return context.getImageData(0, 0, 1, 1).data[3] > 0
        }) ?? ""
      if (!foregroundColor) return 0
    }

    context.clearRect(0, 0, 1, 1)
    context.fillStyle = `rgb(${background[0]} ${background[1]} ${background[2]})`
    context.fillRect(0, 0, 1, 1)
    context.fillStyle = foregroundColor
    context.fillRect(0, 0, 1, 1)
    const foreground = context.getImageData(0, 0, 1, 1).data
    const contrast = [luminance(foreground), luminance(background)].sort(
      (left, right) => right - left
    )
    return (contrast[0] + 0.05) / (contrast[1] + 0.05)
  }, focusRing)
}

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

    const newsRow = page
      .getByRole("row")
      .filter({ hasText: "Cảnh báo tin thị trường" })
      .first()
    await newsRow
      .getByRole("combobox", {
        name: "Chọn ngôn ngữ đầu ra cho Cảnh báo tin thị trường",
      })
      .click()
    await page
      .getByRole("option", { name: "English (en)", exact: true })
      .click()
    await expect(newsRow).toContainText("English (en)")
    await newsRow
      .getByRole("switch", {
        name: "Bật hoặc tắt định tuyến Cảnh báo tin thị trường",
      })
      .click()
    await expect(newsRow).toContainText("English (en)")

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

  test("renders bot Remove responsively, cancels by keyboard, and reads back success", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")
    // Keep the Next.js development portal out of screenshots and small-viewport checks.
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    })

    const removeTrigger = page.getByRole("button", {
      name: "Gỡ bot Fixture operations bot",
    })
    await expect(removeTrigger).toBeVisible()
    await setTelegramTheme(page, "light")
    expect(
      await getDestructiveControlContrast(removeTrigger)
    ).toBeGreaterThanOrEqual(3)
    await page.screenshot({
      path: testInfo.outputPath("telegram-bot-remove-wide-light.png"),
      fullPage: true,
    })
    await removeTrigger.focus()
    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    await expect(removeTrigger).toBeFocused()
    await expect
      .poll(() => getDestructiveControlContrast(removeTrigger, true))
      .toBeGreaterThanOrEqual(3)
    const lightFocusContrast = await getDestructiveControlContrast(
      removeTrigger,
      true
    )
    await test.step(
      `light focus indicator contrast: ${lightFocusContrast.toFixed(2)}:1`,
      async () => expect(lightFocusContrast).toBeGreaterThanOrEqual(3)
    )
    await page.screenshot({
      path: testInfo.outputPath("telegram-bot-remove-wide-light-focused.png"),
      fullPage: true,
    })
    await setTelegramTheme(page, "dark")
    expect(
      await getDestructiveControlContrast(removeTrigger)
    ).toBeGreaterThanOrEqual(3)
    await page.screenshot({
      path: testInfo.outputPath("telegram-bot-remove-wide-dark.png"),
      fullPage: true,
    })
    await removeTrigger.focus()
    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    await expect(removeTrigger).toBeFocused()
    await expect
      .poll(() => getDestructiveControlContrast(removeTrigger, true))
      .toBeGreaterThanOrEqual(3)
    const darkFocusContrast = await getDestructiveControlContrast(
      removeTrigger,
      true
    )
    await test.step(
      `dark focus indicator contrast: ${darkFocusContrast.toFixed(2)}:1`,
      async () => expect(darkFocusContrast).toBeGreaterThanOrEqual(3)
    )
    await page.screenshot({
      path: testInfo.outputPath("telegram-bot-remove-wide-dark-focused.png"),
      fullPage: true,
    })

    await removeTrigger.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(
      "Gỡ kết nối bot “Fixture operations bot”?"
    )
    await page.screenshot({
      path: testInfo.outputPath("telegram-bot-remove-confirmation.png"),
      fullPage: true,
    })
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(removeTrigger).toBeFocused()

    for (const frame of [
      { name: "compact", width: 1024, height: 768, targetSize: 32 },
      { name: "breakpoint-767", width: 767, height: 844, targetSize: 44 },
      { name: "breakpoint-768", width: 768, height: 844, targetSize: 32 },
      { name: "mobile", width: 390, height: 844, targetSize: 44 },
      { name: "mobile-360", width: 360, height: 800, targetSize: 44 },
      // Effective width of a 390px frame at 200% browser zoom.
      { name: "zoom-200-percent", width: 195, height: 422, targetSize: 44 },
    ]) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      if (frame.name === "compact") {
        await page
          .getByRole("button", {
            name: "Thu gọn/mở rộng thanh điều hướng",
          })
          .click()
      }
      await expect(removeTrigger).toBeVisible()
      const pageWidths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(pageWidths.scroll).toBeLessThanOrEqual(pageWidths.client)
      await expect
        .poll(async () => (await removeTrigger.boundingBox())?.width ?? 0)
        .toBeGreaterThanOrEqual(frame.targetSize)
      const box = await removeTrigger.boundingBox()
      expect(box).not.toBeNull()
      expect(box?.height).toBeGreaterThanOrEqual(frame.targetSize)
      if (frame.width <= 768) {
        const botCard = page
          .locator('[data-slot="card"]')
          .filter({
            has: page.getByRole("heading", {
              name: "Bot Telegram",
              exact: true,
            }),
          })
          .first()
        const cardBox = await botCard.boundingBox()
        expect(cardBox).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(cardBox!.x)
        expect(box!.x + box!.width).toBeLessThanOrEqual(
          cardBox!.x + cardBox!.width
        )
      }
      await page.screenshot({
        path: testInfo.outputPath(`telegram-bot-remove-${frame.name}.png`),
        fullPage: true,
      })
      if (frame.width <= 768) {
        await removeTrigger.focus()
        await page.keyboard.press("Enter")
        const responsiveConfirmation = page.getByRole("alertdialog")
        await expect(responsiveConfirmation).toBeVisible()
        await expect(responsiveConfirmation).toContainText(
          "Fixture operations bot"
        )
        await expect(
          responsiveConfirmation.getByRole("button", { name: "Hủy" })
        ).toBeVisible()
        await expect(
          responsiveConfirmation.getByRole("button", { name: "Gỡ bot" })
        ).toBeVisible()
        const dialogBox = await responsiveConfirmation.boundingBox()
        expect(dialogBox).not.toBeNull()
        expect(dialogBox!.x).toBeGreaterThanOrEqual(0)
        expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(frame.width)
        expect(dialogBox!.y).toBeGreaterThanOrEqual(0)
        expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(
          frame.height
        )
        await page.screenshot({
          path: testInfo.outputPath(
            "telegram-bot-remove-dialog-" + frame.name + ".png"
          ),
          fullPage: true,
        })
        await page.keyboard.press("Escape")
        await expect(responsiveConfirmation).toBeHidden()
        await expect(removeTrigger).toBeFocused()
      }
    }

    const state = await fixture.state()
    expect(
      state.requests.filter(
        (request) =>
          request.method === "DELETE" &&
          request.path === "/telegram/bot-connections/11"
      )
    ).toHaveLength(0)

    await page.setViewportSize({ width: 360, height: 800 })
    await fixture.setScenario(
      "/telegram/bot-connections/11",
      "delayed",
      "DELETE"
    )
    await removeTrigger.click()
    const confirmation = page.getByRole("alertdialog")
    await expect(confirmation).toContainText("Fixture operations bot")
    const confirm = confirmation.getByRole("button", {
      name: "Gỡ bot",
      exact: true,
    })
    await confirm.focus()
    await page.keyboard.press("Enter")
    const pendingStatus = confirmation.getByRole("status")
    await expect(pendingStatus).toContainText("Đang gỡ bot…")
    await expect(pendingStatus).toBeFocused()
    expect(
      await pendingStatus.evaluate((element) =>
        element.matches(":focus-visible")
      )
    ).toBe(true)
    await expect(confirm).toBeDisabled()

    await page.setViewportSize({ width: 195, height: 422 })
    await expect(pendingStatus).toContainText("Đang gỡ bot…")
    await expect(pendingStatus).toBeFocused()
    expect(
      await pendingStatus.evaluate((element) =>
        element.matches(":focus-visible")
      )
    ).toBe(true)
    const pendingDialogBox = await confirmation.boundingBox()
    expect(pendingDialogBox).not.toBeNull()
    expect(pendingDialogBox!.x).toBeGreaterThanOrEqual(0)
    expect(pendingDialogBox!.x + pendingDialogBox!.width).toBeLessThanOrEqual(
      195
    )
    expect(pendingDialogBox!.y).toBeGreaterThanOrEqual(0)
    expect(pendingDialogBox!.y + pendingDialogBox!.height).toBeLessThanOrEqual(
      422
    )
    const pendingPageWidths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(pendingPageWidths.scroll).toBeLessThanOrEqual(
      pendingPageWidths.client
    )
    await page.screenshot({
      path: testInfo.outputPath("telegram-bot-remove-pending-200-percent.png"),
      fullPage: true,
    })

    await fixture.setScenario(
      "/telegram/bot-connections/11",
      "success",
      "DELETE"
    )

    await expect(
      page.getByRole("listitem").filter({ hasText: "Fixture operations bot" })
    ).toHaveCount(0)
    await expect(page.getByText("Đã gỡ kết nối bot Telegram.")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Bot Telegram", exact: true })
    ).toBeFocused()

    const afterRemoval = await fixture.state()
    expect(
      afterRemoval.requests.filter(
        (request) =>
          request.method === "DELETE" &&
          request.path === "/telegram/bot-connections/11"
      )
    ).toHaveLength(1)
  })

  test("explains blocked bot removal and keeps the connection unchanged", async ({
    page,
    fixture,
  }) => {
    await fixture.setScenario(
      "/telegram/bot-connections/11",
      "bot-removal-blocked",
      "DELETE"
    )
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    const botItem = page.locator('[role="listitem"]').filter({
      hasText: "Fixture operations bot",
    })
    const removeTrigger = page.getByRole("button", {
      name: "Gỡ bot Fixture operations bot",
    })
    await removeTrigger.click()
    const dialog = page.getByRole("alertdialog")
    await dialog.getByRole("button", { name: "Gỡ bot", exact: true }).click()

    await expect(dialog).toContainText(
      "Trước tiên hãy gỡ tất cả điểm nhận Telegram đang liên kết với bot này. Chưa có dữ liệu nào bị thay đổi."
    )
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(removeTrigger).toBeFocused()
    await expect(botItem).toBeVisible()
    await expect(page.getByText("Đã gỡ kết nối bot Telegram.")).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.filter(
        (request) =>
          request.method === "DELETE" &&
          request.path === "/telegram/bot-connections/11"
      )
    ).toHaveLength(1)
  })
})
