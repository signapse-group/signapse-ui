import { expect, test, waitForClientHandler } from "./fixtures"

async function attachRenderedPage(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo,
  name: string
) {
  const session = await page.context().newCDPSession(page)
  try {
    const { data } = await session.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    })
    await testInfo.attach(name, {
      body: Buffer.from(data, "base64"),
      contentType: "image/png",
    })
  } finally {
    await session.detach()
  }
}

test("read permission keeps the outlet list and detail available without update controls", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["news-outlet:read"])
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/news-outlets")

  await expect(
    page.getByRole("heading", { level: 1, name: "Nguồn tin" })
  ).toBeAttached()
  const outletLink = page.getByRole("link", {
    name: "Fixture News Outlet",
    exact: true,
  })
  await expect(outletLink).toHaveAttribute("href", "/vi/news-outlets/7")
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-disabled",
    "true"
  )
  await expect(page.getByRole("link", { name: "Thêm nguồn tin" })).toHaveCount(
    0
  )
  await expect(page.getByRole("link", { name: "Chỉnh sửa" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Xóa nguồn tin" })).toHaveCount(
    0
  )
  await expect(page.locator('a[href^="ftp:"]')).toHaveCount(0)

  await attachRenderedPage(
    page,
    testInfo,
    "news-outlet-list-wide-1520x1024.png"
  )

  await waitForClientHandler(outletLink)
  await outletLink.click()
  await expect(page).toHaveURL("/vi/news-outlets/7")
  await expect(
    page.getByRole("heading", { name: "Chi tiết nguồn tin", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("ftp://fixture.example/source")).toBeVisible()
  await expect(page.getByRole("textbox")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Lưu thay đổi" })).toHaveCount(
    0
  )
  await expect(page.locator('a[href^="ftp:"]')).toHaveCount(0)

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
    await expect(page.getByText("ftp://fixture.example/source")).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      `page should not overflow at ${width}px`
    ).toBe(true)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await attachRenderedPage(
    page,
    testInfo,
    "news-outlet-read-only-mobile-390x844.png"
  )
})

test("create and edit forms render for their effective permissions", async ({
  page,
  fixture,
}, testInfo) => {
  const browserErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))

  await page.setViewportSize({ width: 1520, height: 1024 })

  await fixture.setPermissions(["news-outlet:read"])
  await page.goto("/vi/news-outlets/create")
  await expect(
    page.getByText("Bạn không có quyền tạo nguồn tin mới.")
  ).toBeVisible()

  await fixture.setPermissions(["news-outlet:create"])
  await page.goto("/vi/news-outlets/create")
  await expect(
    page.getByRole("heading", { level: 1, name: "Tạo nguồn tin" })
  ).toBeVisible()
  await expect(page.getByLabel("Tên nguồn tin")).toHaveAttribute(
    "aria-required",
    "true"
  )
  await expect(page.getByLabel("URL trang chủ")).toHaveAttribute(
    "aria-required",
    "true"
  )
  expect(browserErrors).toEqual([])
  await attachRenderedPage(
    page,
    testInfo,
    "news-outlet-create-form-wide-1520x1024.png"
  )

  await fixture.setPermissions(["news-outlet:read", "news-outlet:update"])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/news-outlets/7")
  await expect(
    page.getByRole("heading", { level: 1, name: "Chỉnh sửa nguồn tin" })
  ).toBeVisible()
  await expect(
    page.getByRole("switch", { name: "Kích hoạt nguồn tin" })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await attachRenderedPage(
    page,
    testInfo,
    "news-outlet-edit-form-mobile-390x844.png"
  )
  expect(browserErrors).toEqual([])
})

test("news outlet form submits only after hydration and reports backend errors", async ({
  page,
  fixture,
}, testInfo) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await fixture.setPermissions(["news-outlet:create", "news-outlet:read"])

  const blockScripts = async (route: import("@playwright/test").Route) => {
    if (route.request().resourceType() === "script") {
      await route.abort()
      return
    }
    await route.continue()
  }

  await page.route("**/*", blockScripts)
  await page.goto("/vi/news-outlets/create", { waitUntil: "commit" })

  const form = page.locator("form")
  const createButton = page.locator('form button[type="submit"]')
  await expect(form).toHaveAttribute("aria-busy", "true")
  await expect(createButton).toHaveText("Đang tải")
  await expect(page.getByLabel("Tên nguồn tin")).toBeDisabled()
  await expect(createButton).toBeDisabled()
  await createButton.evaluate((button) => (button as HTMLButtonElement).click())
  await expect(page).toHaveURL("/vi/news-outlets/create")

  await page.unroute("**/*", blockScripts)
  await page.reload()
  await waitForClientHandler(form, "onSubmit")
  await expect(createButton).toBeEnabled()
  await attachRenderedPage(
    page,
    testInfo,
    "news-outlet-create-wide-1520x1024.png"
  )

  await page.getByLabel("Tên nguồn tin").fill("Hydration source")
  await page.getByLabel("URL trang chủ").fill("custom:hydration-source")
  await createButton.click()
  await expect
    .poll(async () =>
      (await fixture.state()).newsOutlets?.some(
        (outlet) => outlet.name === "Hydration source"
      )
    )
    .toBe(true)
  await expect(page).toHaveURL("/vi/news-outlets", { timeout: 30_000 })
  await expect(
    page.getByRole("link", { name: "Hydration source", exact: true })
  ).toBeVisible()

  let state = await fixture.state()
  expect(state.requests).toContainEqual(
    expect.objectContaining({
      method: "POST",
      path: "/news-outlets",
      locale: "vi",
    })
  )
  expect(state.newsOutlets).toContainEqual(
    expect.objectContaining({
      name: "Hydration source",
      homepageUrl: "custom:hydration-source",
      active: true,
    })
  )

  await page.goto("/vi/news-outlets/create")
  await waitForClientHandler(page.locator("form"), "onSubmit")
  await page.getByLabel("Tên nguồn tin").fill("Duplicate source")
  await page.getByLabel("URL trang chủ").fill("ftp://fixture.example/source")
  await page.getByRole("button", { name: "Tạo nguồn tin" }).click()
  await expect(
    page.getByText("Homepage URL đã tồn tại: ftp://fixture.example/source")
  ).toBeVisible()
  await expect(page).toHaveURL("/vi/news-outlets/create")
  state = await fixture.state()
  expect(state.newsOutlets).toHaveLength(2)
  expect(state.requests).toContainEqual(
    expect.objectContaining({
      method: "POST",
      path: "/news-outlets",
      locale: "vi",
    })
  )

  await fixture.setPermissions(["news-outlet:read", "news-outlet:update"])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route("**/*", blockScripts)
  await page.goto("/vi/news-outlets/7", { waitUntil: "commit" })
  const updateForm = page.locator("form")
  const saveButton = updateForm.locator('button[type="submit"]')
  await expect(updateForm).toHaveAttribute("aria-busy", "true")
  await expect(page.getByLabel("Tên nguồn tin")).toBeDisabled()
  await expect(saveButton).toBeDisabled()
  await expect(saveButton).toHaveText("Đang tải")
  await saveButton.evaluate((button) => (button as HTMLButtonElement).click())
  await expect(page).toHaveURL("/vi/news-outlets/7")

  await page.unroute("**/*", blockScripts)
  await page.reload()
  await waitForClientHandler(updateForm, "onSubmit")
  await expect(saveButton).toBeEnabled()
  const activitySwitch = page.getByRole("switch", {
    name: "Kích hoạt nguồn tin",
  })
  await expect(activitySwitch).toBeEnabled()
  await attachRenderedPage(
    page,
    testInfo,
    "news-outlet-edit-mobile-390x844.png"
  )

  await page.getByLabel("Tên nguồn tin").fill("Renamed Fixture Outlet")
  await page.getByLabel("URL trang chủ").fill("custom:renamed-outlet")
  await page.getByLabel("URL RSS").fill("custom:feed")
  await activitySwitch.click()
  await expect(activitySwitch).toHaveAttribute("aria-checked", "false")
  await page.getByRole("button", { name: "Lưu thay đổi" }).click()
  await expect(page).toHaveURL("/vi/news-outlets", { timeout: 30_000 })

  state = await fixture.state()
  expect(state.requests).toContainEqual(
    expect.objectContaining({
      method: "PUT",
      path: "/news-outlets/7",
      locale: "vi",
    })
  )
  expect(state.newsOutlets?.find((outlet) => outlet.id === 7)).toMatchObject({
    name: "Renamed Fixture Outlet",
    homepageUrl: "custom:renamed-outlet",
    rssUrl: "custom:feed",
    active: false,
  })
})

test("delete permission opens a localized confirmation that can be canceled", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["news-outlet:read", "news-outlet:delete"])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/news-outlets")

  const deleteButton = page.getByRole("button", {
    name: "Xóa nguồn tin",
    exact: true,
  })
  await expect(deleteButton).toBeVisible()
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-disabled",
    "true"
  )
  await deleteButton.click()

  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole("heading", {
      name: 'Xóa nguồn tin "Fixture News Outlet"?',
    })
  ).toBeVisible()
  await expect(
    dialog.getByText(
      "Không thể hoàn tác thao tác này. Fixture News Outlet sẽ không được chọn trong các lần thu thập tiếp theo. Bài viết đã thu thập vẫn giữ nguyên nội dung, đường dẫn và tên nhà xuất bản đã ghi nhận."
    )
  ).toBeVisible()
  expect(
    await dialog.evaluate((element) => element.contains(document.activeElement))
  ).toBe(true)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)

  await testInfo.attach("news-outlet-delete-confirmation-mobile-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  const cancelButton = dialog.getByRole("button", {
    name: "Hủy",
    exact: true,
  })
  await cancelButton.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(deleteButton).toBeFocused()

  await page.getByRole("button", { name: "Chọn giao diện" }).click()
  await page.getByRole("menuitem", { name: "Tối", exact: true }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await deleteButton.click()
  const darkDialog = page.getByRole("alertdialog")
  await expect(darkDialog).toBeVisible()
  expect(
    await darkDialog.evaluate((element) =>
      element.contains(document.activeElement)
    )
  ).toBe(true)
  await testInfo.attach(
    "news-outlet-delete-confirmation-dark-mobile-390x844.png",
    {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    }
  )

  await page.keyboard.press("Escape")
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(deleteButton).toBeFocused()
})
