import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

const fixtureBaseUrl = `http://127.0.0.1:${process.env.FIXTURE_PORT ?? "4100"}`

test.describe("P0 contact request read dashboard", () => {
  test.beforeEach(async ({ fixture, page }) => {
    await fixture.setPermissions(["contact-request:read"])
    await page.setViewportSize({ width: 1440, height: 1024 })
  })

  test("opens from navigation, reads separate records, expands safe full text, and paginates", async ({
    fixture,
    page,
  }) => {
    await page.goto("/vi/dashboard")
    await page
      .getByRole("link", { name: "Yêu cầu liên hệ", exact: true })
      .click()

    await expect(page).toHaveURL(/\/vi\/contact-requests$/)
    await expect(page.locator("h1")).toHaveText("Yêu cầu liên hệ")
    await expect(page.locator("h1")).toHaveClass(/sr-only/)
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .getByRole("link", { name: "Yêu cầu liên hệ", exact: true })
    ).toHaveAttribute("aria-current", "page")
    await expect(
      page.getByRole("columnheader", { name: "Tên", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Email", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Lời nhắn", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", {
        name: "Thời gian gửi",
        exact: true,
      })
    ).toBeVisible()
    await expect(page.getByText("21 yêu cầu", { exact: true })).toBeVisible()
    await expect(
      page.getByText("Mới nhất trước", { exact: true })
    ).toBeVisible()
    await expect(page.locator("[data-contact-request-row]")).toHaveCount(10)
    const pageSizeSelect = page.getByRole("combobox", {
      name: "Số hàng mỗi trang",
    })
    await expect(pageSizeSelect).toContainText("10")
    await expect(pageSizeSelect).not.toContainText("/ trang")
    await expect(
      page
        .locator("[data-contact-request-row]")
        .filter({ hasText: "repeat@example.test" })
    ).toHaveCount(2)
    await expect(
      page
        .locator("[data-contact-request-row]")
        .filter({ hasText: "repeat@example.test" })
        .nth(1)
        .locator("td")
        .first()
    ).toHaveText("—")

    const longMessageRow = page
      .locator("[data-contact-request-row]")
      .filter({ hasText: "repeat@example.test" })
      .first()
    const toggleMessage = longMessageRow.getByRole("button")
    const detail = page.locator("[data-contact-request-message]").first()
    await expect(toggleMessage).toHaveAttribute("aria-expanded", "true")
    await expect(detail).toBeVisible()
    await expect(detail).toContainText(
      "Dòng thứ hai có Unicode: tiếng Việt, 日本語 👋"
    )
    await expect(detail).toContainText("<script>alert(1)</script>")
    await expect(detail.locator("script, img")).toHaveCount(0)

    await toggleMessage.focus()
    await page.keyboard.press("Space")
    await expect(toggleMessage).toHaveAttribute("aria-expanded", "false")
    await expect(detail).toBeHidden()
    await page.keyboard.press("Enter")
    await expect(toggleMessage).toHaveAttribute("aria-expanded", "true")
    await expect(detail).toBeVisible()
    const detailId = await detail.getAttribute("id")
    expect(detailId).toBeTruthy()
    await expect(toggleMessage).toHaveAttribute("aria-controls", detailId ?? "")

    const submittedTime = longMessageRow.locator("time")
    await expect(submittedTime).toHaveAttribute(
      "dateTime",
      "2026-10-07T00:00:00.000Z"
    )
    expect(await submittedTime.innerText()).not.toBe(
      "2026-10-07T00:00:00.000Z"
    )

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      axe.violations.filter(
        (item) => item.impact === "serious" || item.impact === "critical"
      )
    ).toEqual([])

    await page.getByRole("button", { name: "Trang sau" }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator("[data-contact-request-row]")).toHaveCount(10)
    await expect(
      page
        .locator("[data-contact-request-row]")
        .filter({ hasText: "request-11@example.test" })
        .getByRole("cell")
        .nth(2)
    ).toBeVisible()
    await expect(
      page
        .locator("[data-contact-request-row]")
        .filter({ hasText: "request-11@example.test" })
        .getByRole("cell")
        .nth(2)
    ).toHaveText("Lời nhắn 11 cho Signapse.")

    await page.getByRole("button", { name: "Trang sau" }).click()
    await expect(page).toHaveURL(/page=3/)
    await expect(page.locator("[data-contact-request-row]")).toHaveCount(1)
    await expect(
      page
        .locator("[data-contact-request-row]")
        .filter({ hasText: "request-21@example.test" })
        .getByRole("cell")
        .nth(2)
    ).toBeVisible()

    const state = await fixture.state()
    const contactRequestReads = state.requests.filter(
      (request) => request.path === "/contact-requests"
    )
    expect(contactRequestReads.map((request) => request.method)).toEqual([
      "GET",
      "GET",
      "GET",
    ])
    expect(contactRequestReads.map((request) => request.query)).toEqual([
      "?page=0&size=10&sort=createdDate%2Cdesc&sort=id%2Cdesc",
      "?page=1&size=10&sort=createdDate%2Cdesc&sort=id%2Cdesc",
      "?page=2&size=10&sort=createdDate%2Cdesc&sort=id%2Cdesc",
    ])
  })

  test("keeps the list within a mobile viewport and localizes the English route", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/en/contact-requests")

    await expect(page.locator("h1")).toHaveText("Contact requests")
    await expect(
      page.getByText(
        "Contact details and messages submitted from the Signapse website."
      )
    ).toBeVisible()
    await expect(page.locator("[data-contact-request-row]")).toHaveCount(10)
    const submittedTime = page.locator("time").first()
    await expect(submittedTime).toHaveAttribute(
      "dateTime",
      "2026-10-07T00:00:00.000Z"
    )
    expect(await submittedTime.innerText()).not.toBe("2026-10-07T00:00:00.000Z")
    const dimensions = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)

    const tableScroller = page.locator('[data-slot="table-container"]').first()
    const scrollDimensions = await tableScroller.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
    expect(scrollDimensions.scrollWidth).toBeGreaterThan(
      scrollDimensions.clientWidth
    )
    await tableScroller.evaluate((element) => {
      element.scrollLeft = element.scrollWidth
    })
    await expect
      .poll(() => tableScroller.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0)
    await expect(
      page.getByRole("button", { name: "View message" }).first()
    ).toBeInViewport()
  })

  test("renders content when the API omits optional page metadata", async ({
    page,
  }) => {
    await page.goto("/vi/contact-requests?size=50")

    await expect(page.locator("[data-contact-request-row]")).toHaveCount(21)
    await expect(
      page.getByText("21 yêu cầu trên trang này", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Hiển thị 1-21 yêu cầu trên trang này", { exact: true })
    ).toBeVisible()
  })

  test("fails closed for direct routes and API reads without permission", async ({
    fixture,
    page,
    request,
    testRunId,
  }) => {
    await fixture.setPermissions([])
    await page.goto("/vi/contact-requests")

    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .getByRole("link", { name: "Yêu cầu liên hệ", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("Bạn cần quyền đọc yêu cầu liên hệ để xem danh sách này.")
    ).toBeVisible()

    const pageState = await fixture.state()
    expect(
      pageState.requests.some((entry) => entry.path === "/contact-requests")
    ).toBe(false)

    const apiResponse = await request.get(
      `${fixtureBaseUrl}/contact-requests?page=0&size=20`,
      { headers: { "x-signapse-test-run-id": testRunId } }
    )
    expect(apiResponse.status()).toBe(403)
  })

  test("shows loading, empty, read error, and denied states distinctly", async ({
    fixture,
    page,
  }) => {
    await fixture.setScenario("/contact-requests", "delayed", "GET")
    const navigation = page.goto("/vi/contact-requests", {
      waitUntil: "commit",
    })
    await expect(
      page.getByRole("status", { name: "Đang tải yêu cầu liên hệ" })
    ).toBeVisible()
    await navigation

    await fixture.setScenario("/contact-requests", "empty", "GET")
    await page.goto("/vi/contact-requests")
    await expect(page.getByText("Chưa có yêu cầu liên hệ")).toBeVisible()

    await fixture.setScenario("/contact-requests", "outage", "GET")
    await page.goto("/vi/contact-requests")
    await expect(
      page.locator('[data-slot="empty"][role="alert"]')
    ).toContainText("Không thể tải yêu cầu liên hệ")
    await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible()
    await expect(page.getByText("Chưa có yêu cầu liên hệ")).toHaveCount(0)

    await fixture.setScenario("/me", "outage", "GET")
    await page.goto("/vi/contact-requests")
    await expect(
      page.getByText("Bạn cần quyền đọc yêu cầu liên hệ để xem danh sách này.")
    ).toBeVisible()
  })
})
