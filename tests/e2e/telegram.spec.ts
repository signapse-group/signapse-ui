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
  test("creates a schedule and reads it back from the saved list", async ({
    page,
    fixture,
  }) => {
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    const scheduleSection = page.locator(
      'section[aria-labelledby="telegram-schedule-heading"]'
    )
    await scheduleSection.getByRole("button", { name: "Tạo lịch" }).click()

    const dialog = page.getByRole("dialog", { name: "Tạo lịch phân tích" })
    await dialog
      .getByRole("textbox", { name: "Tên lịch" })
      .fill("Readback analysis")

    const destination = dialog.getByRole("combobox", { name: "Điểm nhận" })
    await destination.click()
    await page.getByRole("option", { name: "Operations channel" }).click()

    const asset = dialog.getByRole("combobox", { name: "Tài sản theo dõi" })
    await asset.click()
    await page.getByRole("option", { name: "BTC/USDT — Bitcoin" }).click()
    await dialog.getByRole("textbox", { name: "Mốc giờ gửi 1" }).fill("09:15")

    await dialog.getByRole("button", { name: "Tạo lịch", exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText("Đã tạo lịch phân tích.", { exact: true })
    ).toBeVisible()

    const createdRow = page
      .getByRole("row")
      .filter({ hasText: "Readback analysis" })
    await expect(createdRow).toContainText("BTC/USDT")
    await expect(createdRow).toContainText("09:15")
    await expect(createdRow).toContainText("Operations channel")

    await page.reload()
    await expect(
      page.getByRole("row").filter({ hasText: "Readback analysis" })
    ).toContainText("BTC/USDT")

    const scheduleRequests = (await fixture.state()).requests.filter(
      (request) =>
        request.path === "/telegram/market-analysis-schedules" &&
        (request.method === "GET" || request.method === "POST")
    )
    expect(scheduleRequests.some((request) => request.method === "POST")).toBe(
      true
    )
    expect(scheduleRequests.some((request) => request.method === "GET")).toBe(
      true
    )
  })

  test("edits an active schedule and reads the same record back", async ({
    page,
    fixture,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    const stateBefore = await fixture.state()
    const original = stateBefore.schedules?.find(
      (schedule) => schedule.name === "BTC morning analysis"
    )
    expect(original?.status).toBe("ACTIVE")
    if (!original) throw new Error("Fixture ACTIVE schedule was not found")
    const schedulePath = `/telegram/market-analysis-schedules/${String(original.id)}`

    const editDialogTrigger = page
      .getByRole("row")
      .filter({ hasText: "BTC morning analysis" })
      .getByRole("button", { name: "Sửa lịch phân tích" })
    await editDialogTrigger.click()
    const editDialog = page.getByRole("dialog", {
      name: "Chỉnh sửa lịch phân tích",
    })
    const editName = editDialog.getByRole("textbox", { name: "Tên lịch" })
    await editName.fill("BTC morning analysis updated")
    await editDialog
      .getByRole("button", { name: "Lưu lịch", exact: true })
      .click()
    await expect(editDialog).toBeHidden()

    const updatedRow = page
      .getByRole("row")
      .filter({ hasText: "BTC morning analysis updated" })
    await expect(updatedRow).toContainText("BTC/USDT")
    await expect(
      updatedRow.getByRole("button", { name: "Sửa lịch phân tích" })
    ).toBeVisible()
    const afterSave = await fixture.state()
    const updateIndex = afterSave.requests.findIndex(
      (request) => request.method === "PUT" && request.path === schedulePath
    )
    expect(updateIndex).toBeGreaterThanOrEqual(0)

    await page.reload()
    const readbackRow = page
      .getByRole("row")
      .filter({ hasText: "BTC morning analysis updated" })
    await expect(readbackRow).toContainText("BTC/USDT")
    await expect(
      readbackRow.getByRole("button", { name: "Sửa lịch phân tích" })
    ).toBeVisible()

    const afterReadback = await fixture.state()
    const persisted = afterReadback.schedules?.find(
      (schedule) => schedule.id === original.id
    )
    expect(persisted).toMatchObject({
      id: original.id,
      name: "BTC morning analysis updated",
      status: "ACTIVE",
    })
    const lastListReadIndex = afterReadback.requests
      .map(
        (request) =>
          request.method === "GET" &&
          request.path === "/telegram/market-analysis-schedules"
      )
      .lastIndexOf(true)
    expect(lastListReadIndex).toBeGreaterThan(updateIndex)
  })

  test("removes a schedule and focuses the surviving heading after readback", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")
    await page.addStyleTag({
      content:
        '[aria-label="Ask Signapse"], nextjs-portal { display: none !important; }',
    })

    const original = (await fixture.state()).schedules?.find(
      (schedule) => schedule.name === "BTC morning analysis"
    )
    expect(original?.status).toBe("ACTIVE")
    if (!original) throw new Error("Fixture ACTIVE schedule was not found")
    const schedulePath = `/telegram/market-analysis-schedules/${String(original.id)}`
    const scheduleRow = page
      .getByRole("row")
      .filter({ hasText: "BTC morning analysis" })
    const removeTrigger = scheduleRow.getByRole("button", {
      name: "Xóa lịch phân tích",
    })
    await removeTrigger.focus()
    await page.keyboard.press("Enter")

    const dialog = page.getByRole("alertdialog")
    const confirmButton = dialog.getByRole("button", {
      name: "Xóa lịch",
      exact: true,
    })
    await page.keyboard.press("Tab")
    await expect(confirmButton).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeHidden()
    await expect(scheduleRow).toHaveCount(0)
    const scheduleHeading = page.getByRole("heading", {
      name: "Lịch gửi phân tích",
      exact: true,
    })
    await expect(scheduleHeading).toBeFocused()
    await page.locator("[data-sonner-toast]").waitFor({ state: "hidden" })
    await page.screenshot({
      path: testInfo.outputPath(
        "telegram-schedule-remove-success-focus-wide-dark.png"
      ),
      fullPage: true,
    })

    const afterDelete = await fixture.state()
    expect(
      afterDelete.schedules?.find((schedule) => schedule.id === original.id)
        ?.status
    ).toBe("REMOVED")
    const deleteIndex = afterDelete.requests.findIndex(
      (request) => request.method === "DELETE" && request.path === schedulePath
    )
    const lastListReadIndex = afterDelete.requests
      .map(
        (request) =>
          request.method === "GET" &&
          request.path === "/telegram/market-analysis-schedules"
      )
      .lastIndexOf(true)
    expect(deleteIndex).toBeGreaterThanOrEqual(0)
    expect(lastListReadIndex).toBeGreaterThan(deleteIndex)
  })

  test("restores schedule Remove focus to the visible trigger after responsive resize", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")
    await page.addStyleTag({
      content:
        '[aria-label="Ask Signapse"], nextjs-portal { display: none !important; }',
    })

    const original = (await fixture.state()).schedules?.find(
      (schedule) => schedule.name === "BTC morning analysis"
    )
    expect(original?.status).toBe("ACTIVE")
    if (!original) throw new Error("Fixture ACTIVE schedule was not found")

    const desktopRemove = page.locator(
      `#telegram-schedule-delete-${original.id}-desktop`
    )
    const mobileRemove = page.locator(
      `#telegram-schedule-delete-${original.id}-mobile`
    )
    await expect(desktopRemove).toBeVisible()
    await expect(mobileRemove).toBeHidden()

    await desktopRemove.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toBeVisible()
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(desktopRemove).toBeHidden()
    await expect(mobileRemove).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    )
    await dialog.getByRole("button", { name: "Hủy", exact: true }).focus()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeHidden()
    await expect(mobileRemove).toBeFocused()
    await expect(
      page.locator(`#telegram-schedule-delete-${original.id}-mobile-tooltip`)
    ).toBeVisible()
    expect(
      await mobileRemove.evaluate((element) =>
        element.matches(":focus-visible")
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(
        "telegram-schedule-remove-cancel-focus-mobile-360-dark.png"
      ),
      fullPage: true,
    })

    await mobileRemove.focus()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeVisible()
    await page.setViewportSize({ width: 760, height: 512 })
    await expect(dialog).toBeVisible()
    await expect(mobileRemove).toBeVisible()
    await expect(desktopRemove).toBeHidden()
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement))
      )
      .toBe(true)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    )
    await dialog.screenshot({
      path: testInfo.outputPath(
        "telegram-schedule-remove-dialog-effective-760-200pct-dark.png"
      ),
    })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await expect(mobileRemove).toBeHidden()
    await expect(desktopRemove).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(desktopRemove).toBeFocused()
    await expect(
      page.locator(`#telegram-schedule-delete-${original.id}-desktop-tooltip`)
    ).toBeVisible()
    expect(
      await desktopRemove.evaluate((element) =>
        element.matches(":focus-visible")
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(
        "telegram-schedule-remove-escape-focus-wide-dark.png"
      ),
      fullPage: true,
    })

    const state = await fixture.state()
    expect(
      state.requests.filter(
        (request) =>
          request.method === "DELETE" &&
          request.path === `/telegram/market-analysis-schedules/${original.id}`
      )
    ).toHaveLength(0)
    expect(
      state.schedules?.find((schedule) => schedule.id === original.id)?.status
    ).toBe("ACTIVE")
  })

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

    const sidebar = page.locator('[data-slot="sidebar"][data-state]').first()
    await page.context().clearCookies({ name: "sidebar_state" })
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await expect(sidebar).toHaveAttribute("data-state", "collapsed")
    await page.addStyleTag({
      content:
        '[aria-label="Ask Signapse"], nextjs-portal { display: none !important; }',
    })
    await expect(activeScheduleRow).toBeVisible()
    await page.screenshot({
      path: test
        .info()
        .outputPath("telegram-scheduled-analysis-page-compact-collapsed.png"),
      fullPage: true,
    })

    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.context().addCookies([
      {
        name: "sidebar_state",
        value: "true",
        url: "http://127.0.0.1:3100/",
      },
    ])
    await page.reload()
    await expect(sidebar).toHaveAttribute("data-state", "expanded")
    await page.addStyleTag({
      content:
        '[aria-label="Ask Signapse"], nextjs-portal { display: none !important; }',
    })
    for (const frame of [
      { name: "wide", width: 1520, height: 1024 },
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

    const createTrigger = scheduleSection.getByRole("button", {
      name: "Tạo lịch",
    })
    await createTrigger.focus()
    await page.keyboard.press("Enter")
    const createDialog = page.getByRole("dialog")
    await expect(
      createDialog.getByRole("heading", { name: "Tạo lịch phân tích" })
    ).toBeVisible()
    await expect(
      createDialog.getByRole("combobox", { name: "Điểm nhận" })
    ).toBeVisible()
    const createClose = createDialog.locator('[data-slot="dialog-close"]')
    const createName = createDialog.getByRole("textbox", { name: "Tên lịch" })
    const createSubmit = createDialog.getByRole("button", {
      name: "Tạo lịch",
      exact: true,
    })
    await expect(createClose).toHaveCount(1)
    await expect
      .poll(() =>
        createDialog.evaluate((dialog) =>
          dialog.contains(document.activeElement)
        )
      )
      .toBe(true)
    await createClose.focus()
    await page.keyboard.press("Tab")
    await expect(createName).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(createClose).toBeFocused()
    await createSubmit.focus()
    await page.keyboard.press("Tab")
    await expect(createClose).toBeFocused()
    await createClose.focus()
    await page.keyboard.press("Tab")
    await expect(createName).toBeFocused()
    await createDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-create-wide.png"),
    })
    await page.emulateMedia({ colorScheme: "light" })
    await expect(createName).toBeFocused()
    await createDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-create-wide-light.png"),
    })
    await page.emulateMedia({ colorScheme: "dark" })
    for (const frame of [
      { name: "mobile-360", width: 360, height: 800 },
      { name: "effective-200-percent", width: 760, height: 512 },
    ]) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(createDialog).toBeVisible()
      await expect(createName).toBeFocused()
      await expect(
        createDialog
          .locator('[data-slot="dialog-footer"]')
          .getByRole("button", { name: "Đóng", exact: true })
      ).toBeVisible()
      await expect(
        createDialog.getByRole("button", { name: "Tạo lịch", exact: true })
      ).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
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
    await expect(createTrigger).toBeFocused()

    const editTrigger = activeScheduleRow.getByRole("button", {
      name: "Sửa lịch phân tích",
    })
    const editTriggerId = await editTrigger.getAttribute("id")
    if (!editTriggerId)
      throw new Error("Schedule Edit trigger needs a stable id")
    const focusedEditTrigger = page.locator(`#${editTriggerId}:visible`)
    await editTrigger.focus()
    await page.keyboard.press("Enter")
    const editDialog = page.getByRole("dialog")
    await expect(
      editDialog.getByRole("heading", { name: "Chỉnh sửa lịch phân tích" })
    ).toBeVisible()
    const editName = editDialog.getByRole("textbox", { name: "Tên lịch" })
    const editTimezone = editDialog.getByRole("combobox", { name: "Múi giờ" })
    await expect(editTimezone).toHaveValue(/Asia\/Ho_Chi_Minh$/)
    const editClose = editDialog.locator('[data-slot="dialog-close"]')
    const editSave = editDialog.getByRole("button", {
      name: "Lưu lịch",
      exact: true,
    })
    await expect(editClose).toHaveCount(1)
    await expect
      .poll(() =>
        editDialog.evaluate((dialog) => dialog.contains(document.activeElement))
      )
      .toBe(true)
    await page.keyboard.press("Escape")
    await expect(editDialog).toBeHidden()
    await expect(focusedEditTrigger).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(editDialog).toBeVisible()
    await expect
      .poll(() =>
        editDialog.evaluate((dialog) => dialog.contains(document.activeElement))
      )
      .toBe(true)
    await editClose.focus()
    await page.keyboard.press("Tab")
    await expect(editName).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(editClose).toBeFocused()
    await editSave.focus()
    await page.keyboard.press("Tab")
    await expect(editClose).toBeFocused()
    await editClose.focus()
    await page.keyboard.press("Tab")
    await expect(editName).toBeFocused()
    await editName.fill("BTC morning analysis draft")
    await expect(editName).toBeFocused()
    await editDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-edit-wide.png"),
    })
    await page.emulateMedia({ colorScheme: "light" })
    await expect(editName).toBeFocused()
    await editDialog.screenshot({
      path: test.info().outputPath("telegram-schedule-edit-wide-light.png"),
    })
    await page.emulateMedia({ colorScheme: "dark" })
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
      .focus()
    await page.keyboard.press("Enter")
    await expect(editDialog).toBeHidden()
    await expect(focusedEditTrigger).toBeFocused()
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
    await test.step(`light focus indicator contrast: ${lightFocusContrast.toFixed(2)}:1`, async () =>
      expect(lightFocusContrast).toBeGreaterThanOrEqual(3))
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
    await test.step(`dark focus indicator contrast: ${darkFocusContrast.toFixed(2)}:1`, async () =>
      expect(darkFocusContrast).toBeGreaterThanOrEqual(3))
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
