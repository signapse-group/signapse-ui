import { expect, test } from "./fixtures"

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  )
  expect(hasHorizontalOverflow).toBe(false)
}

async function attachScreenshot(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo,
  name: string
) {
  const path = testInfo.outputPath(name)
  await page.screenshot({
    path,
    fullPage: true,
    style: "nextjs-portal { display: none !important; }",
  })
  await testInfo.attach(name, { path, contentType: "image/png" })
}

test("P0 roles list and direct detail are localized, read-only, and responsive", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["role:read", "role:create"])
  await page.emulateMedia({ colorScheme: "dark" })
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/roles")

  await expect(
    page.getByRole("heading", { level: 1, name: "Vai trò" })
  ).toBeVisible()
  const createRoleLink = page.getByRole("link", {
    name: "Tạo vai trò",
    exact: true,
  })
  await expect(createRoleLink).toHaveAttribute("href", "/vi/roles/create")
  await expect(
    page.getByRole("columnheader", { name: "Vai trò" })
  ).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Key" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Quyền" })).toBeVisible()
  const reviewerLink = page.getByRole("link", {
    name: "Người duyệt nội dung",
    exact: true,
  })
  await expect(reviewerLink).toHaveAttribute(
    "href",
    "/vi/roles/CONTENT_REVIEWER"
  )
  await expect(
    page
      .getByRole("row", { name: /Người đọc trống/ })
      .getByRole("cell")
      .nth(2)
  ).toHaveText("0")
  await expectNoPageOverflow(page)
  await attachScreenshot(page, testInfo, "roles-list-wide-vi.png")

  await createRoleLink.focus()
  await expect(createRoleLink).toBeFocused()
  expect(
    await createRoleLink.evaluate((link) => link.matches(":focus-visible"))
  ).toBe(true)
  await reviewerLink.focus()
  await expect(reviewerLink).toBeFocused()
  expect(
    await reviewerLink.evaluate((link) => link.matches(":focus-visible"))
  ).toBe(true)
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/vi\/roles\/CONTENT_REVIEWER$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "Người duyệt nội dung" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Thông tin vai trò" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Bài viết tin tức" })
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Sự kiện" })).toBeVisible()
  await expect(page.getByText("news-article:read")).toBeVisible()
  await expect(page.getByText("event:read")).toBeVisible()
  await expect(page.getByRole("switch")).toHaveCount(0)
  await expect(page.getByRole("textbox")).toHaveCount(0)
  await expectNoPageOverflow(page)
  await attachScreenshot(page, testInfo, "role-detail-wide-vi.png")

  await page.setViewportSize({ width: 1024, height: 768 })
  await expectNoPageOverflow(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await expectNoPageOverflow(page)
  await attachScreenshot(page, testInfo, "role-detail-mobile-vi.png")
  await page.setViewportSize({ width: 360, height: 800 })
  await expectNoPageOverflow(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/roles")
  await expect(
    page.getByRole("heading", { level: 1, name: "Vai trò" })
  ).toBeVisible()
  const mobileRoleKey = page.getByText("CONTENT_REVIEWER", { exact: true })
  await expect(mobileRoleKey).toBeVisible()
  expect(
    await mobileRoleKey.evaluate(
      (element) => element.scrollHeight <= element.clientHeight
    )
  ).toBe(true)
  await expectNoPageOverflow(page)
  await attachScreenshot(page, testInfo, "roles-list-mobile-vi.png")

  await page.setViewportSize({ width: 1520, height: 1024 })
  const zoomSession = await page.context().newCDPSession(page)
  await zoomSession.send("Emulation.setDeviceMetricsOverride", {
    width: 760,
    height: 512,
    deviceScaleFactor: 2,
    mobile: false,
    screenWidth: 1520,
    screenHeight: 1024,
  })
  await page.evaluate(() => {
    document.cookie = "sidebar_state=false; path=/; max-age=60"
  })
  await page.reload()
  await expect(
    page.getByRole("heading", { level: 1, name: "Vai trò" })
  ).toBeVisible()
  await expect(
    page.getByRole("columnheader", { name: "Vai trò" })
  ).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Key" })).toBeVisible()
  await expect(
    page.getByRole("columnheader", { name: "Quyền" })
  ).toBeVisible()
  await expect(page.getByText("CONTENT_REVIEWER", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Tạo vai trò", exact: true })
  ).toBeVisible()
  await expect(
    page
      .getByRole("row", { name: /Người đọc trống/ })
      .getByRole("cell")
      .nth(2)
  ).toHaveText("0")
  const roleColumns = await page.getByRole("columnheader").evaluateAll((headers) =>
    headers.map((header) => ({
      left: header.getBoundingClientRect().left,
      right: header.getBoundingClientRect().right,
    }))
  )
  const zoomViewportWidth = await page.evaluate(() => window.innerWidth)
  expect(
    roleColumns.every(
      ({ left, right }) => left >= 0 && right <= zoomViewportWidth
    )
  ).toBe(true)
  expect(
    await page
      .locator('[data-slot="table-container"]')
      .evaluate((table) => table.scrollWidth <= table.clientWidth)
  ).toBe(true)
  expect(
    await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      screenWidth: window.screen.width,
      devicePixelRatio: window.devicePixelRatio,
    }))
  ).toEqual({ viewportWidth: 760, screenWidth: 1520, devicePixelRatio: 2 })
  await expectNoPageOverflow(page)
  const tableBounds = await page
    .locator('[data-slot="table-container"]')
    .evaluate((table) => table.getBoundingClientRect().toJSON())
  const firstRoleCells = await page
    .locator('[data-slot="table-body"] tr:first-child td')
    .evaluateAll((cells) =>
      cells.map((cell) => {
        const { left, right } = cell.getBoundingClientRect()
        return { left, right }
      })
    )
  expect(
    firstRoleCells.every(
      ({ left, right }) => left >= tableBounds.left && right <= tableBounds.right
    )
  ).toBe(true)
  const zoomPagePath = testInfo.outputPath("roles-list-zoom-200-vi.png")
  await page.screenshot({
    path: zoomPagePath,
    scale: "device",
    style: "nextjs-portal { display: none !important; }",
  })
  await testInfo.attach("roles-list-zoom-200-vi.png", {
    path: zoomPagePath,
    contentType: "image/png",
  })
  await page.evaluate(() => {
    document.cookie = "sidebar_state=true; path=/; max-age=604800"
  })
  await zoomSession.send("Emulation.clearDeviceMetricsOverride")
  await zoomSession.detach()

  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto("/vi/roles/EMPTY_READER")
  await expect(
    page.getByRole("heading", { name: "Chưa có quyền nào được gán" })
  ).toBeVisible()
  await attachScreenshot(page, testInfo, "role-detail-empty-mobile-vi.png")

  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/roles")
  await expect(
    page.getByRole("heading", { level: 1, name: "Roles" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Content Reviewer" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Create role", exact: true })
  ).toHaveAttribute("href", "/en/roles/create")
  const requestState = await fixture.state()
  expect(
    requestState.requests.some(
      (request) => request.method === "GET" && request.path === "/permissions"
    )
  ).toBe(false)

  await fixture.setScenario("/roles", "empty", "GET")
  await page.goto("/vi/roles")
  await expect(
    page.getByText("Chưa có vai trò nào", { exact: true })
  ).toBeVisible()
  await attachScreenshot(page, testInfo, "roles-list-empty-wide-vi.png")

  await fixture.setScenario("/roles", "outage", "GET")
  await page.goto("/vi/roles")
  await expect(
    page.getByRole("heading", { name: "Không thể tải dữ liệu vai trò" })
  ).toBeVisible()
  await expect(page.locator('[data-sidebar="content"]')).toBeVisible()
  await attachScreenshot(page, testInfo, "roles-list-error-wide-vi.png")
  await fixture.setScenario("/roles", "success", "GET")
  await page.getByRole("button", { name: "Thử lại" }).click()
  await expect(
    page.getByRole("link", { name: "Người duyệt nội dung" })
  ).toBeVisible()

  await fixture.setScenario("/roles/CONTENT_REVIEWER", "outage", "GET")
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/roles/CONTENT_REVIEWER")
  await expect(
    page.getByRole("heading", { name: "Không thể tải dữ liệu vai trò" })
  ).toBeVisible()
  await attachScreenshot(page, testInfo, "role-detail-error-mobile-vi.png")
  await fixture.setScenario("/roles/CONTENT_REVIEWER", "success", "GET")
  await page.getByRole("button", { name: "Thử lại" }).click()
  await expect(
    page.getByRole("heading", { level: 1, name: "Người duyệt nội dung" })
  ).toBeVisible()
})

test("P0 role access fails closed for create-only, update-only, missing, and API-denied readers", async ({
  page,
  fixture,
}, testInfo) => {
  await page.setViewportSize({ width: 1520, height: 1024 })

  for (const permissions of [["role:create"], ["role:update"], []]) {
    await fixture.setPermissions(permissions)
    await page.goto("/vi/roles")
    await expect(
      page.getByText(
        "Bạn cần quyền role:read để xem vai trò và các quyền đã gán."
      )
    ).toBeVisible()

    if (
      await page
        .locator('[data-slot="sidebar"][data-state="collapsed"]')
        .count()
    ) {
      await page
        .getByRole("button", { name: "Thu gọn/mở rộng thanh điều hướng" })
        .click()
    }

    const rolesNavigationLink = page
      .locator('[data-sidebar="content"]')
      .getByRole("link", {
        name: "Vai trò & phân quyền",
        exact: true,
      })
    if (permissions.includes("role:create")) {
      await expect(rolesNavigationLink).toBeVisible()
      const createRoleLink = page.getByRole("link", {
        name: "Tạo vai trò",
        exact: true,
      })
      await expect(createRoleLink).toBeVisible()
      await expect(createRoleLink).toHaveAttribute(
        "href",
        "/vi/roles/create"
      )
      const path = testInfo.outputPath("roles-access-create-only-vi.png")
      await page.screenshot({
        path,
        fullPage: true,
        style: "nextjs-portal { display: none !important; }",
      })
      await testInfo.attach("roles-access-create-only-vi.png", {
        path,
        contentType: "image/png",
      })
    } else {
      await expect(rolesNavigationLink).toHaveCount(0)
      await expect(
        page.getByRole("link", { name: "Tạo vai trò", exact: true })
      ).toHaveCount(0)
    }

    await page.goto("/vi/roles/CONTENT_REVIEWER")
    await expect(
      page.getByText(
        "Bạn cần quyền role:read để xem vai trò và các quyền đã gán."
      )
    ).toBeVisible()
    await expect(page.getByText("Người duyệt nội dung")).toHaveCount(0)
  }

  const noReadRequests = await fixture.state()
  expect(
    noReadRequests.requests.some(
      (request) =>
        request.method === "GET" &&
        (request.path === "/roles" ||
          (typeof request.path === "string" &&
            request.path.startsWith("/roles/")))
    )
  ).toBe(false)

  await fixture.setPermissions(["role:read"])
  await fixture.setScenario("/roles", "permission-denied", "GET")
  await page.goto("/vi/roles")
  await expect(
    page.getByText(
      "Bạn cần quyền role:read để xem vai trò và các quyền đã gán."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Tạo vai trò", exact: true })
  ).toHaveCount(0)
  await expect(page.getByText("Người duyệt nội dung")).toHaveCount(0)

  await fixture.setScenario(
    "/roles/CONTENT_REVIEWER",
    "permission-denied",
    "GET"
  )
  await page.goto("/vi/roles/CONTENT_REVIEWER")
  await expect(
    page.getByText(
      "Bạn cần quyền role:read để xem vai trò và các quyền đã gán."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Người duyệt nội dung" })
  ).toHaveCount(0)

  const requestState = await fixture.state()
  expect(
    requestState.requests.some(
      (request) => request.method === "GET" && request.path === "/permissions"
    )
  ).toBe(false)

  await fixture.setPermissions(["role:create"])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/vi/roles")
  await expect(
    page.getByText(
      "Bạn cần quyền role:read để xem vai trò và các quyền đã gán."
    )
  ).toBeVisible()
  await expectNoPageOverflow(page)
  await attachScreenshot(
    page,
    testInfo,
    "roles-access-create-only-mobile-vi.png"
  )

  const createOnlyNavigationLink = page
    .locator('[data-sidebar="content"]')
    .getByRole("link", {
      name: "Vai trò & phân quyền",
      exact: true,
    })
  if (!(await createOnlyNavigationLink.isVisible())) {
    await page
      .getByRole("button", { name: "Thu gọn/mở rộng thanh điều hướng" })
      .click()
  }
  await expect(createOnlyNavigationLink).toBeVisible()
})
