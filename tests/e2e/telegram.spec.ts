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
      page
        .getByRole("listitem")
        .filter({ hasText: "Operations channel" })
        .first()
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
    await page.setViewportSize({ width: 1520, height: 1024 })

    await expect(
      page.getByText("Định tuyến tính năng", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Lịch gửi phân tích", { exact: true })
    ).toBeVisible()
    const scheduleSection = page.locator(
      'section[aria-labelledby="telegram-schedule-heading"]'
    )
    const routingSection = page.locator(
      'section[aria-labelledby="telegram-routing"]'
    )
    const infrastructureSection = page.locator(
      'section[aria-labelledby="telegram-infrastructure"]'
    )
    const activeScheduleRow = page
      .getByRole("row")
      .filter({ hasText: "BTC morning analysis" })
      .first()
    const activeScheduleCard = page
      .locator("article")
      .filter({ hasText: "BTC morning analysis" })
      .first()
    const inactiveScheduleRow = page
      .getByRole("row")
      .filter({ hasText: "Legacy inactive analysis" })
      .first()
    await expect(activeScheduleRow).toBeVisible()
    await expect(
      activeScheduleRow.getByRole("button", { name: "Sửa lịch phân tích" })
    ).toBeVisible()
    await expect(
      activeScheduleRow.getByRole("button", { name: "Xóa lịch phân tích" })
    ).toBeVisible()
    await expect(inactiveScheduleRow).toContainText("Chưa có điểm nhận")
    await expect(
      inactiveScheduleRow.getByRole("button", { name: "Xóa lịch phân tích" })
    ).toBeVisible()
    await expect(
      inactiveScheduleRow.getByRole("button", { name: "Sửa lịch phân tích" })
    ).toHaveCount(0)
    await expect(
      page.getByText("Removed analysis", { exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Phân tích thị trường theo lịch", { exact: true })
    ).toHaveCount(0)
    await expect(
      scheduleSection.getByRole("button", { name: "Tạo lịch" })
    ).toBeVisible()
    await page.locator("[data-sonner-toast]").waitFor({ state: "hidden" })
    await page.addStyleTag({
      content:
        '[aria-label="Ask Signapse"], nextjs-portal { display: none !important; }',
    })

    const routingBox = await routingSection.boundingBox()
    const scheduleBox = await scheduleSection.boundingBox()
    const infrastructureBox = await infrastructureSection.boundingBox()
    expect(routingBox).not.toBeNull()
    expect(scheduleBox).not.toBeNull()
    expect(infrastructureBox).not.toBeNull()
    expect(scheduleBox!.x).toBe(routingBox!.x)
    expect(infrastructureBox!.x).toBeGreaterThan(scheduleBox!.x)

    await page.screenshot({
      path: test
        .info()
        .outputPath("telegram-scheduled-analysis-page-wide-dark-vi.png"),
      fullPage: true,
    })
    await page.emulateMedia({ colorScheme: "light" })
    await expect(scheduleSection).toBeVisible()
    await page.screenshot({
      path: test
        .info()
        .outputPath("telegram-scheduled-analysis-page-wide-light-vi.png"),
      fullPage: true,
    })
    await page.emulateMedia({ colorScheme: "dark" })

    for (const frame of [
      { name: "wide", width: 1520, height: 1024 },
      { name: "compact", width: 1024, height: 768 },
      { name: "mobile", width: 390, height: 844 },
      { name: "mobile-360", width: 360, height: 800 },
      { name: "200-percent-effective-width", width: 760, height: 512 },
    ]) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(
        frame.width < 768 ? activeScheduleCard : activeScheduleRow
      ).toBeVisible()
      await page.screenshot({
        path: test
          .info()
          .outputPath(`telegram-scheduled-analysis-page-${frame.name}.png`),
        fullPage: true,
      })
    }
    await page.setViewportSize({ width: 1520, height: 1024 })

    await scheduleSection.getByRole("button", { name: "Tạo lịch" }).click()
    const createDialog = page.getByRole("dialog")
    await expect(
      createDialog.getByRole("heading", { name: "Tạo lịch phân tích" })
    ).toBeVisible()
    await expect(
      createDialog.getByRole("combobox", { name: "Điểm nhận" })
    ).toBeVisible()
    await createDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-create-wide.png"),
    })
    for (const frame of [
      { name: "mobile-360", width: 360, height: 800 },
      { name: "effective-200-percent", width: 760, height: 512 },
    ]) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(createDialog).toBeVisible()
      await expect(
        createDialog
          .locator('[data-slot="dialog-footer"]')
          .getByRole("button", { name: "Đóng", exact: true })
      ).toBeVisible()
      await expect(
        createDialog.getByRole("button", { name: "Tạo lịch", exact: true })
      ).toBeVisible()
      await createDialog.screenshot({
        path: test
          .info()
          .outputPath(`telegram-schedule-create-${frame.name}.png`),
      })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(createDialog).toBeVisible()
    await createDialog
      .getByText("Ngôn ngữ đầu ra", { exact: true })
      .scrollIntoViewIfNeeded()
    await createDialog.screenshot({
      path: test
        .info()
        .outputPath("telegram-schedule-create-mobile-bottom.png"),
    })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.keyboard.press("Escape")
    await expect(createDialog).toBeHidden()

    await activeScheduleRow
      .getByRole("button", { name: "Sửa lịch phân tích" })
      .click()
    const editDialog = page.getByRole("dialog")
    await expect(
      editDialog.getByRole("heading", { name: "Chỉnh sửa lịch phân tích" })
    ).toBeVisible()
    const editName = editDialog.getByRole("textbox", { name: "Tên lịch" })
    const editTimezone = editDialog.getByRole("combobox", { name: "Múi giờ" })
    await expect(editTimezone).toHaveValue(/Asia\/Ho_Chi_Minh$/)
    await editName.fill("BTC morning analysis draft")
    await expect(editName).toBeFocused()
    await editDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-edit-wide.png"),
    })
    for (const frame of [
      { name: "mobile-360", width: 360, height: 800 },
      { name: "effective-200-percent", width: 760, height: 512 },
    ]) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(editDialog).toBeVisible()
      await expect(editName).toHaveValue("BTC morning analysis draft")
      await expect(editName).toBeFocused()
      await expect(editTimezone).toHaveValue(/Asia\/Ho_Chi_Minh$/)
      await expect(
        editDialog.getByRole("button", { name: "Hủy", exact: true })
      ).toBeVisible()
      await expect(
        editDialog.getByRole("button", { name: "Lưu lịch", exact: true })
      ).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
      await editDialog.screenshot({
        path: test
          .info()
          .outputPath(`telegram-schedule-edit-${frame.name}.png`),
      })
    }
    await editDialog.getByRole("button", { name: "Hủy", exact: true }).click()
    const discardDialog = page.getByRole("alertdialog")
    await expect(discardDialog).toContainText("Bỏ thay đổi chưa lưu?")
    await discardDialog
      .getByRole("button", { name: "Bỏ thay đổi", exact: true })
      .click()
    await expect(editDialog).toBeHidden()
    await page.setViewportSize({ width: 1520, height: 1024 })
    await expect(activeScheduleRow).toContainText("BTC morning analysis")

    const removeScheduleButton = activeScheduleRow.getByRole("button", {
      name: "Xóa lịch phân tích",
    })
    await removeScheduleButton.hover()
    await expect(page.getByRole("tooltip")).toHaveText("Xóa lịch phân tích")
    await page.mouse.move(0, 0)
    await removeScheduleButton.click()
    const scheduleDeleteDialog = page.getByRole("alertdialog")
    await expect(
      scheduleDeleteDialog.getByRole("heading", { name: "Xóa lịch phân tích?" })
    ).toBeVisible()
    await scheduleDeleteDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-remove-confirmation.png"),
    })
    await scheduleDeleteDialog.getByRole("button", { name: "Hủy" }).click()
    await expect(scheduleDeleteDialog).toBeHidden()

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

    await fixture.setScenario("/telegram/feature-settings", "outage", "GET")
    await page.reload()
    await expect(
      page
        .locator('section[aria-labelledby="telegram-routing"]')
        .getByRole("alert")
    ).toContainText("Không thể tải dữ liệu của mục này.")
    await expect(scheduleSection).toBeVisible()
    await expect(
      page.getByRole("row").filter({ hasText: "BTC morning analysis" })
    ).toBeVisible()
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
})
