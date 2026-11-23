import { expect, test, waitForClientHandler } from "./fixtures"

test.describe("P0 Telegram operations", () => {
  test("covers destination delivery states and destructive confirmation", async ({
    page,
    fixture,
  }) => {
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
    await expect(
      page
        .locator('button[aria-disabled="true"]')
        .filter({ hasText: "Gửi thử" })
    ).toHaveCount(1)

    const activeTestMessage = page
      .getByRole("button", {
        name: "Gửi thử",
        exact: true,
      })
      .first()
    await waitForClientHandler(activeTestMessage)

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
    await expect(
      page.getByText(
        "Yêu cầu gửi đã hết thời gian chờ và kết quả chưa rõ; hãy kiểm tra Telegram trước khi thử lại.",
        { exact: true }
      )
    ).toBeVisible()

    await fixture.setScenario(
      "/telegram/destinations/21/test-message",
      "success",
      "POST"
    )
    await activeTestMessage.click()
    await expect(
      page.getByText("Đã gửi tin nhắn thử tới Operations channel.", {
        exact: true,
      })
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

  test("connects with create-only access and reads the saved state only with read access", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions(["telegram-bot-connection:create"])
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    await expect(
      page.getByRole("heading", { name: "Hạ tầng Telegram" })
    ).toBeVisible()
    const connectTrigger = page.getByRole("button", {
      name: "Kết nối bot mới",
    })
    await expect(connectTrigger).toBeVisible()
    await waitForClientHandler(connectTrigger)
    await testInfo.attach("sign329-wide-create-only.png", {
      body: await page.screenshot({ type: "png" }),
      contentType: "image/png",
    })
    const themeToggle = page.getByRole("button", { name: "Chọn giao diện" })
    await waitForClientHandler(themeToggle)
    await themeToggle.click()
    await page.getByRole("menuitem", { name: "Tối", exact: true }).click()
    await expect(page.locator("html")).toHaveClass(/dark/)

    expect(
      (await fixture.state()).requests.filter(
        (request) =>
          request.method === "GET" &&
          request.path === "/telegram/bot-connections"
      )
    ).toHaveLength(0)

    await connectTrigger.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog")
    const tokenInput = dialog.getByLabel("Token bot")
    await expect(dialog).toBeVisible()
    await expect(tokenInput).toBeFocused()
    await expect(tokenInput).toHaveAttribute("type", "password")
    await testInfo.attach("sign329-wide-dialog.png", {
      body: await page.screenshot({ type: "png" }),
      contentType: "image/png",
    })

    await tokenInput.fill("fixture-only-token")
    await page.setViewportSize({ width: 760, height: 512 })
    await expect(dialog).toBeVisible()
    await expect(tokenInput).toHaveValue("fixture-only-token")
    await expect(tokenInput).toBeFocused()
    const effectiveZoomDialogBox = await dialog.boundingBox()
    expect(effectiveZoomDialogBox).not.toBeNull()
    expect(effectiveZoomDialogBox?.x).toBeGreaterThanOrEqual(0)
    expect(
      (effectiveZoomDialogBox?.x ?? 0) + (effectiveZoomDialogBox?.width ?? 0)
    ).toBeLessThanOrEqual(760)
    const openDialogDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(openDialogDimensions.scrollWidth).toBeLessThanOrEqual(
      openDialogDimensions.clientWidth
    )
    await testInfo.attach(
      "sign329-open-dialog-200-percent-effective-width.png",
      {
        body: await page.screenshot({ type: "png" }),
        contentType: "image/png",
      }
    )

    await page.setViewportSize({ width: 1520, height: 1024 })
    await expect(tokenInput).toHaveValue("fixture-only-token")
    await expect(tokenInput).toBeFocused()
    await tokenInput.press("Enter")
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText("Đã kết nối bot Telegram.", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("fixture-only-token", { exact: true })
    ).toHaveCount(0)

    const createOnlyState = await fixture.state()
    expect(
      createOnlyState.requests.filter(
        (request) =>
          request.method === "POST" &&
          request.path === "/telegram/bot-connections"
      )
    ).toHaveLength(1)
    expect(
      createOnlyState.requests.filter(
        (request) =>
          request.method === "GET" &&
          request.path === "/telegram/bot-connections"
      )
    ).toHaveLength(0)

    await fixture.setPermissions([
      "telegram-bot-connection:create",
      "telegram-bot-connection:read",
    ])
    await page.reload()
    await expect(
      page.getByText("New fixture bot", { exact: true })
    ).toBeVisible()
    const infrastructureRegion = page.getByRole("region", {
      name: "Hạ tầng Telegram",
    })
    const botCard = infrastructureRegion
      .locator('[data-slot="card"]')
      .filter({ hasText: "Bot Telegram" })
    const destinationCard = infrastructureRegion
      .locator('[data-slot="card"]')
      .filter({ hasText: "Điểm nhận" })
    await expect(
      botCard
        .getByRole("listitem")
        .filter({ hasText: "New fixture bot" })
        .getByText("Đang hoạt động", { exact: true })
    ).toBeVisible()

    const readbackState = await fixture.state()
    expect(
      readbackState.requests.filter(
        (request) =>
          request.method === "GET" &&
          request.path === "/telegram/bot-connections"
      )
    ).toHaveLength(1)
    const savedBot = readbackState.botConnections?.find(
      (connection) => connection.displayLabel === "New fixture bot"
    )
    expect(savedBot).toBeDefined()
    expect(savedBot).not.toHaveProperty("botToken")
    expect(savedBot).not.toHaveProperty("ownerId")
    const incompleteBot = botCard
      .getByRole("listitem")
      .filter({ hasText: "Incomplete fixture bot" })
    await expect(incompleteBot).toContainText("Không hợp lệ")
    await expect(incompleteBot).toContainText("Đăng ký webhook thất bại.")
    await expect(incompleteBot).toContainText("Thiết lập bot chưa hoàn tất.")
    await expect(incompleteBot).not.toContainText("stored fixture detail")
    await expect(incompleteBot).not.toContainText(
      "Dùng Reconnect trên hàng của bot này để hoàn tất thiết lập."
    )

    await page.setViewportSize({ width: 1024, height: 768 })
    await page.locator('[data-slot="sidebar-trigger"]').click()
    const sidebarContainer = page
      .locator('[data-slot="sidebar-container"]')
      .first()
    await expect
      .poll(
        async () => (await sidebarContainer.boundingBox())?.width ?? Infinity
      )
      .toBeLessThan(80)
    const featureRoutingRegion = page.getByRole("region", {
      name: "Định tuyến tính năng",
    })
    const [featureRoutingBox, infrastructureBox, botBox, destinationBox] =
      await Promise.all([
        featureRoutingRegion.boundingBox(),
        infrastructureRegion.boundingBox(),
        botCard.boundingBox(),
        destinationCard.boundingBox(),
      ])
    expect(featureRoutingBox).not.toBeNull()
    expect(infrastructureBox).not.toBeNull()
    expect(botBox).not.toBeNull()
    expect(destinationBox).not.toBeNull()
    expect(
      (featureRoutingBox?.x ?? 0) + (featureRoutingBox?.width ?? 0)
    ).toBeLessThanOrEqual(infrastructureBox?.x ?? Infinity)
    expect(destinationBox?.y).toBeGreaterThan(
      (botBox?.y ?? 0) + (botBox?.height ?? 0) - 8
    )
    await expect(incompleteBot).toContainText("Thiết lập bot chưa hoàn tất.")
    await incompleteBot.evaluate((element) =>
      element.scrollIntoView({ block: "start" })
    )
    await testInfo.attach(
      "sign329-compact-invalid-row-without-update-permission.png",
      {
        body: await incompleteBot.screenshot({ type: "png" }),
        contentType: "image/png",
      }
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await testInfo.attach("sign329-compact-readback-without-update.png", {
      body: await page.screenshot({ type: "png", fullPage: true }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 760, height: 512 })
    const zoomEquivalentDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(zoomEquivalentDimensions.scrollWidth).toBeLessThanOrEqual(
      zoomEquivalentDimensions.clientWidth
    )

    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => window.scrollTo(0, 0))
    const mobileFeatureBox = await page
      .getByRole("region", { name: "Định tuyến tính năng" })
      .boundingBox()
    const [mobileBotBox, mobileDestinationBox] = await Promise.all([
      botCard.boundingBox(),
      destinationCard.boundingBox(),
    ])
    expect(mobileFeatureBox).not.toBeNull()
    expect(mobileBotBox).not.toBeNull()
    expect(mobileDestinationBox).not.toBeNull()
    expect(mobileBotBox?.y).toBeGreaterThan(
      (mobileFeatureBox?.y ?? 0) + (mobileFeatureBox?.height ?? 0) - 8
    )
    expect(mobileDestinationBox?.y).toBeGreaterThan(
      (mobileBotBox?.y ?? 0) + (mobileBotBox?.height ?? 0) - 8
    )
    const mobileDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(mobileDimensions.scrollWidth).toBeLessThanOrEqual(
      mobileDimensions.clientWidth
    )
    await expect(incompleteBot).toContainText("Thiết lập bot chưa hoàn tất.")
    await incompleteBot.evaluate((element) =>
      element.scrollIntoView({ block: "start" })
    )
    await testInfo.attach(
      "sign329-mobile-invalid-row-without-update-permission.png",
      {
        body: await incompleteBot.screenshot({ type: "png" }),
        contentType: "image/png",
      }
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await testInfo.attach("sign329-mobile-readback-without-update.png", {
      body: await page.screenshot({ type: "png", fullPage: true }),
      contentType: "image/png",
    })

    await fixture.setPermissions([
      "telegram-bot-connection:create",
      "telegram-bot-connection:read",
      "telegram-bot-connection:update",
    ])
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    const reconnectGuidance = page.getByText(
      "Dùng Reconnect trên hàng của bot này để hoàn tất thiết lập.",
      { exact: true }
    )
    await expect(reconnectGuidance).toHaveCount(0)
    await expect(incompleteBot).toContainText("Thiết lập bot chưa hoàn tất.")
    await expect(incompleteBot).not.toContainText(
      "Dùng Reconnect trên hàng của bot này để hoàn tất thiết lập."
    )
    await incompleteBot.evaluate((element) =>
      element.scrollIntoView({ block: "start" })
    )
    await testInfo.attach(
      "sign329-compact-invalid-row-update-permission-before-reconnect.png",
      {
        body: await incompleteBot.screenshot({ type: "png" }),
        contentType: "image/png",
      }
    )
    const compactDimensionsWithUpdate = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(compactDimensionsWithUpdate.scrollWidth).toBeLessThanOrEqual(
      compactDimensionsWithUpdate.clientWidth
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await testInfo.attach(
      "sign329-compact-readback-update-permission-before-reconnect.png",
      {
        body: await page.screenshot({ type: "png", fullPage: true }),
        contentType: "image/png",
      }
    )

    await page.setViewportSize({ width: 390, height: 844 })
    const mobileDimensionsWithUpdate = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(mobileDimensionsWithUpdate.scrollWidth).toBeLessThanOrEqual(
      mobileDimensionsWithUpdate.clientWidth
    )
    await expect(reconnectGuidance).toHaveCount(0)
    await expect(incompleteBot).toContainText("Thiết lập bot chưa hoàn tất.")
    await incompleteBot.evaluate((element) =>
      element.scrollIntoView({ block: "start" })
    )
    await testInfo.attach(
      "sign329-mobile-invalid-row-update-permission-before-reconnect.png",
      {
        body: await incompleteBot.screenshot({ type: "png" }),
        contentType: "image/png",
      }
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await testInfo.attach(
      "sign329-mobile-readback-update-permission-before-reconnect.png",
      {
        body: await page.screenshot({ type: "png", fullPage: true }),
        contentType: "image/png",
      }
    )

    await page.setViewportSize({ width: 360, height: 780 })
    await connectTrigger.click()
    const mobileDialog = page.getByRole("dialog")
    const closeButton = mobileDialog.getByRole("button", { name: "Đóng" })
    const submitButton = mobileDialog.getByRole("button", {
      name: "Kết nối bot",
    })
    const [closeBox, submitBox, dialogBox] = await Promise.all([
      closeButton.boundingBox(),
      submitButton.boundingBox(),
      mobileDialog.boundingBox(),
    ])
    expect(closeBox).not.toBeNull()
    expect(submitBox).not.toBeNull()
    expect(dialogBox).not.toBeNull()
    expect(closeBox?.y).toBeLessThan(submitBox?.y ?? 0)
    expect(
      Math.abs((closeBox?.width ?? 0) - (submitBox?.width ?? 0))
    ).toBeLessThan(2)
    expect((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)).toBeLessThanOrEqual(
      360
    )
    const smallMobileDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(smallMobileDimensions.scrollWidth).toBeLessThanOrEqual(
      smallMobileDimensions.clientWidth
    )
    await testInfo.attach("sign329-mobile-dialog.png", {
      body: await page.screenshot({ type: "png" }),
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(mobileDialog).toBeHidden()
    await expect(connectTrigger).toBeFocused()
  })

  test("uses API statuses to report created, duplicate, and rejected bots", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions([
      "telegram-bot-connection:create",
      "telegram-bot-connection:read",
    ])
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/telegram")

    const connectTrigger = page.getByRole("button", {
      name: "Kết nối bot mới",
    })
    const botCard = page
      .getByRole("region", { name: "Hạ tầng Telegram" })
      .locator('[data-slot="card"]')
      .filter({ hasText: "Bot Telegram" })
    const dialog = page.getByRole("dialog")
    const tokenInput = dialog.getByLabel("Token bot")
    const savedBots = async () => (await fixture.state()).botConnections ?? []
    const countRequests = async (method: string) =>
      (await fixture.state()).requests.filter(
        (request) =>
          request.method === method &&
          request.path === "/telegram/bot-connections"
      ).length

    await expect(connectTrigger).toBeVisible()
    await expect(
      botCard
        .getByRole("listitem")
        .filter({ hasText: "Fixture operations bot" })
    ).toBeVisible()
    const initialBots = await savedBots()
    const initialGets = await countRequests("GET")
    const initialPosts = await countRequests("POST")

    await connectTrigger.click()
    await tokenInput.fill("fixture-webhook-failed-token")
    await dialog.getByRole("button", { name: "Kết nối bot" }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText(
        "Bot đã được thêm với trạng thái Không hợp lệ, nhưng đăng ký webhook thất bại. Thiết lập chưa hoàn tất.",
        { exact: true }
      )
    ).toBeVisible()
    await expect(
      page.getByText("Đã kết nối bot Telegram.", { exact: true })
    ).toHaveCount(0)
    await expect(
      botCard
        .getByRole("listitem")
        .filter({ hasText: "New incomplete fixture bot" })
        .getByText("Không hợp lệ", { exact: true })
    ).toBeVisible()
    const createdInvalidBots = await savedBots()
    const createdInvalid = createdInvalidBots.find(
      (connection) => connection.displayLabel === "New incomplete fixture bot"
    )
    expect(createdInvalid).toMatchObject({ status: "INVALID" })
    expect(createdInvalid).not.toHaveProperty("botToken")
    expect(createdInvalid).not.toHaveProperty("ownerId")
    expect(createdInvalidBots).toHaveLength(initialBots.length + 1)
    expect(await countRequests("POST")).toBe(initialPosts + 1)
    await expect.poll(() => countRequests("GET")).toBeGreaterThan(initialGets)

    const getsBeforeActiveDuplicate = await countRequests("GET")
    await connectTrigger.click()
    await tokenInput.fill("fixture-duplicate-active-token")
    await dialog.getByRole("button", { name: "Kết nối bot" }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText(
        "Bot này đã có trong danh sách kết nối. Trạng thái đã lưu: Đang hoạt động.",
        { exact: true }
      )
    ).toBeVisible()
    await expect(
      page.getByText("Đã kết nối bot Telegram.", { exact: true })
    ).toHaveCount(0)
    expect(await savedBots()).toEqual(createdInvalidBots)
    expect(await countRequests("POST")).toBe(initialPosts + 2)
    await expect
      .poll(() => countRequests("GET"))
      .toBeGreaterThan(getsBeforeActiveDuplicate)

    const getsBeforeInvalidDuplicate = await countRequests("GET")
    await connectTrigger.click()
    await tokenInput.fill("fixture-duplicate-invalid-token")
    await dialog.getByRole("button", { name: "Kết nối bot" }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText(
        "Bot này đã có trong danh sách kết nối với trạng thái Không hợp lệ, nhưng thiết lập chưa hoàn tất. Đăng ký webhook thất bại.",
        { exact: true }
      )
    ).toBeVisible()
    const duplicatedInvalid = botCard
      .getByRole("listitem")
      .filter({ hasText: "@signapse_incomplete_fixture_bot" })
    await expect(duplicatedInvalid).toContainText(
      "Thiết lập bot chưa hoàn tất."
    )
    await expect(duplicatedInvalid).not.toContainText("stored fixture detail")
    expect(await savedBots()).toEqual(createdInvalidBots)
    expect(await countRequests("POST")).toBe(initialPosts + 3)
    await expect
      .poll(() => countRequests("GET"))
      .toBeGreaterThan(getsBeforeInvalidDuplicate)

    await connectTrigger.click()
    await tokenInput.fill("fixture-invalid-token")
    await dialog.getByRole("button", { name: "Kết nối bot" }).click()
    await expect(dialog.getByRole("alert")).toHaveText(
      "Token bot Telegram không hợp lệ."
    )
    await expect(tokenInput).toHaveValue("fixture-invalid-token")
    expect(await savedBots()).toEqual(createdInvalidBots)

    await tokenInput.fill("fixture-owner-conflict-token")
    await dialog.getByRole("button", { name: "Kết nối bot" }).click()
    await expect(dialog.getByRole("alert")).toHaveText(
      "Bot Telegram này đã được kết nối."
    )
    const conflictPageText = await page.locator("body").innerText()
    expect(conflictPageText).not.toMatch(
      /ownerId|another owner|chủ sở hữu khác/i
    )
    expect(await savedBots()).toEqual(createdInvalidBots)

    await fixture.setPermissions(["telegram-bot-connection:read"])
    await tokenInput.fill("fixture-forbidden-token")
    await dialog.getByRole("button", { name: "Kết nối bot" }).click()
    await expect(dialog.getByRole("alert")).toHaveText(
      "Bạn không có quyền kết nối bot Telegram."
    )
    expect(await savedBots()).toEqual(createdInvalidBots)
    expect(await countRequests("POST")).toBe(initialPosts + 6)
  })
})
