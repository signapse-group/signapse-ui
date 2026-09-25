import { expect, test } from "./fixtures"
import { devices, type Page, type TestInfo } from "@playwright/test"

async function setDesktopSidebarState(page: Page, open: boolean) {
  const sidebar = page.locator('[data-slot="sidebar"]').first()
  const expectedState = open ? "expanded" : "collapsed"

  if ((await sidebar.getAttribute("data-state")) !== expectedState) {
    await page.locator('[data-slot="sidebar-trigger"]').first().click()
  }

  await expect(sidebar).toHaveAttribute("data-state", expectedState)
}

async function assertCreateFormScrollable(
  page: Page,
  {
    title = "Tạo bài viết",
    submitLabel = "Tạo bài viết",
    checkMouseScroll = true,
  }: {
    title?: string
    submitLabel?: string
    checkMouseScroll?: boolean
  } = {}
) {
  await expect(page.getByRole("heading", { name: title })).toBeVisible()

  const scrollMetrics = await page.evaluate(() => ({
    documentHeight: document.scrollingElement?.scrollHeight ?? 0,
    viewportHeight: document.scrollingElement?.clientHeight ?? 0,
    documentWidth: document.scrollingElement?.scrollWidth ?? 0,
    viewportWidth: document.scrollingElement?.clientWidth ?? 0,
  }))

  expect(scrollMetrics.documentHeight).toBeGreaterThan(
    scrollMetrics.viewportHeight
  )
  expect(scrollMetrics.documentWidth).toBeLessThanOrEqual(
    scrollMetrics.viewportWidth
  )

  const shellGeometry = await page
    .locator('[data-slot="app-form-shell"]')
    .evaluate((shell) => {
      const shellRect = shell.getBoundingClientRect()
      const contentRect = shell.parentElement?.getBoundingClientRect()
      return {
        shellCenter: (shellRect.left + shellRect.right) / 2,
        contentCenter: contentRect
          ? (contentRect.left + contentRect.right) / 2
          : null,
      }
    })

  expect(shellGeometry.contentCenter).not.toBeNull()
  expect(
    Math.abs(shellGeometry.shellCenter - shellGeometry.contentCenter!)
  ).toBeLessThan(1)

  const toolbar = page.getByRole("toolbar").first()
  await toolbar.scrollIntoViewIfNeeded()
  await expect(toolbar).toBeInViewport()

  const editor = page.locator('#blog-content[contenteditable="true"]')
  await editor.scrollIntoViewIfNeeded()
  await editor.click()
  await editor.fill("Nội dung bài viết")
  await expect(editor).toBeFocused()

  const submitButton = page.getByRole("button", { name: submitLabel })
  if (checkMouseScroll) {
    await expect(submitButton).not.toBeInViewport()
    const pointer = await page
      .locator('[data-slot="app-form-shell"]')
      .evaluate((shell) => {
        const rect = shell.getBoundingClientRect()
        return {
          x: Math.max(4, rect.left - 5),
          y: Math.min(window.innerHeight - 4, rect.top + rect.height / 2),
        }
      })
    await page.mouse.move(pointer.x, pointer.y)
    await page.mouse.wheel(0, 10000)
    await expect(submitButton).toBeInViewport()

    await page.reload()
    await expect(page.getByRole("heading", { name: title })).toBeVisible()
    await page.evaluate(() => {
      history.scrollRestoration = "manual"
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    })
    await expect
      .poll(() =>
        page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)
      )
      .toBe(0)
  }

  await expect(submitButton).not.toBeInViewport()
  const sidebarTrigger = page.locator('[data-slot="sidebar-trigger"]').first()
  await sidebarTrigger.focus()
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press("PageDown")
  }
  await expect(submitButton).toBeInViewport()

  await page
    .locator('[data-slot="app-form-shell-footer"]')
    .scrollIntoViewIfNeeded()
  await expect(page.getByRole("button", { name: "Hủy" })).toBeInViewport()
}

async function swipeUp(page: Page, x: number, y: number, distance: number) {
  const session = await page.context().newCDPSession(page)
  const touchPoint = (pointY: number) => ({
    id: 1,
    x,
    y: pointY,
    radiusX: 1,
    radiusY: 1,
    force: 1,
  })
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(y)],
  })
  for (let step = 1; step <= 5; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [touchPoint(y - (distance * step) / 5)],
    })
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await session.detach()
}

async function captureFormScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
}

test("keeps the create form reachable across desktop theme and sidebar states", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 998, height: 844 })

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme })

    for (const sidebarOpen of [true, false]) {
      await page.goto("/vi/blogs/create")
      await setDesktopSidebarState(page, sidebarOpen)
      await assertCreateFormScrollable(page)
      await captureFormScreenshot(
        page,
        testInfo,
        `create-${colorScheme}-sidebar-${sidebarOpen ? "open" : "collapsed"}.png`
      )
    }
  }
})

test("keeps the update form centered and scrollable", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 998, height: 844 })
  await page.goto("/vi/blogs/71")
  await setDesktopSidebarState(page, true)
  await assertCreateFormScrollable(page, {
    title: "Cập nhật bài viết",
    submitLabel: "Lưu thay đổi",
  })
  await captureFormScreenshot(
    page,
    testInfo,
    "update-desktop-light-sidebar-open.png"
  )
})

test.describe("mobile touch layout", () => {
  const pixel7 = devices["Pixel 7"]
  test.use({
    deviceScaleFactor: pixel7.deviceScaleFactor,
    hasTouch: pixel7.hasTouch,
    isMobile: pixel7.isMobile,
    userAgent: pixel7.userAgent,
    viewport: pixel7.viewport,
  })

  test("keeps the create editor and footer reachable on mobile in English", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/en/blogs/create")
    await expect(
      page.getByRole("heading", { name: "Create post" })
    ).toBeVisible()

    const scrollMetrics = await page.evaluate(() => ({
      documentHeight: document.scrollingElement?.scrollHeight ?? 0,
      viewportHeight: document.scrollingElement?.clientHeight ?? 0,
      documentWidth: document.scrollingElement?.scrollWidth ?? 0,
      viewportWidth: document.scrollingElement?.clientWidth ?? 0,
    }))

    expect(scrollMetrics.documentHeight).toBeGreaterThan(
      scrollMetrics.viewportHeight
    )
    expect(scrollMetrics.documentWidth).toBeLessThanOrEqual(
      scrollMetrics.viewportWidth
    )

    const toolbar = page.getByRole("toolbar").first()
    await toolbar.scrollIntoViewIfNeeded()
    await expect(toolbar).toBeInViewport()

    const editor = page.locator('#blog-content[contenteditable="true"]')
    await expect(editor).toBeVisible()
    await editor.tap({ position: { x: 32, y: 32 } })
    await expect(editor).toBeInViewport()
    await editor.fill("Article content")
    await expect(editor).toBeFocused()

    await editor.evaluate((element) => element.blur())
    await page.evaluate(() => document.scrollingElement?.scrollTo(0, 0))
    const initialScrollTop = await page.evaluate(
      () => document.scrollingElement?.scrollTop ?? 0
    )
    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    const touchX = await page
      .locator('[data-slot="app-form-shell"]')
      .evaluate((shell) => Math.max(4, shell.getBoundingClientRect().left - 5))
    await swipeUp(page, touchX, viewport!.height - 80, 600)
    await expect
      .poll(() =>
        page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)
      )
      .toBeGreaterThan(initialScrollTop)

    const submitButton = page.getByRole("button", { name: "Create post" })
    await swipeUp(page, touchX, viewport!.height - 80, 600)
    await expect(submitButton).toBeInViewport()
    await captureFormScreenshot(page, testInfo, "create-mobile-dark.png")
  })
})

test("keeps the create form reachable at 200 percent browser zoom", async ({
  page,
}, testInfo) => {
  // A 998x844 viewport at 200% browser zoom has roughly half the CSS space.
  await page.setViewportSize({ width: 499, height: 422 })
  await page.goto("/vi/blogs/create")

  await assertCreateFormScrollable(page, { checkMouseScroll: false })
  await captureFormScreenshot(page, testInfo, "create-zoom-200.png")
})
