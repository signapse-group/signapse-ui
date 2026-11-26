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
      await scheduleSection.screenshot({
        path: test.info().outputPath(`telegram-schedule-${frame.name}.png`),
      })
    }
    await page.setViewportSize({ width: 1520, height: 1024 })

    await scheduleSection.getByRole("button", { name: "Tạo lịch" }).click()
    const createDialog = page.getByRole("dialog")
    await expect(
      createDialog.getByRole("heading", { name: "Tạo lịch phân tích" })
    ).toBeVisible()
    await createDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-create-wide.png"),
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(createDialog).toBeVisible()
    await createDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-create-mobile.png"),
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
    await editDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-edit-wide.png"),
    })
    await page.keyboard.press("Escape")
    await expect(editDialog).toBeHidden()

    await activeScheduleRow
      .getByRole("button", { name: "Xóa lịch phân tích" })
      .click()
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
  })
})
