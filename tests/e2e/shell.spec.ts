import { expect, test, waitForClientHandler } from "./fixtures"

test.describe("P0 shell and canonical list", () => {
  test("switches workspace and keeps the functional user menu Clerk-safe", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard")

    await expect(
      page.getByText("Workspace Alpha", { exact: true }).first()
    ).toBeVisible()
    const userMenu = page.getByRole("button", { name: /Signapse Developer/i })
    await userMenu.click()
    await expect(page.getByRole("menuitem", { name: "Đăng xuất" })).toHaveCount(
      0
    )
    await page.keyboard.press("Escape")

    const workspaceTrigger = page.getByRole("button", {
      name: /Workspace Alpha/i,
    })
    await workspaceTrigger.click()
    await page.getByRole("menuitem", { name: /Workspace Beta/i }).click()

    await expect(
      page.getByText("Workspace Beta", { exact: true }).first()
    ).toBeVisible()
  })

  test("covers canonical list search, URL state, pagination, and history", async ({
    page,
  }) => {
    await page.goto("/vi/events?page=1&size=10")
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).toBeVisible()

    const nextPage = page.getByRole("button", {
      name: "Đi tới trang sau",
      exact: true,
    })
    const pageSize = page.getByRole("combobox", {
      name: "Số hàng mỗi trang",
    })
    await expect(pageSize).toContainText("10")
    await waitForClientHandler(pageSize)
    await pageSize.click()
    await page.getByRole("option", { name: "20 / trang" }).click()
    await expect(page).toHaveURL(/page=1&size=20/)
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()

    await pageSize.click()
    await page.getByRole("option", { name: "10 / trang" }).click()
    await expect(page).toHaveURL(/page=1&size=10/)
    await waitForClientHandler(nextPage)
    await nextPage.click()
    await expect(page).toHaveURL(/page=2/)
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()

    await page.goto("/vi/events?page=1&size=10")
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).toBeVisible()

    const search = page.getByRole("searchbox", { name: "Tìm sự kiện" })
    await waitForClientHandler(search, "onChange")
    await search.fill("Macro")
    await expect(search).toHaveValue("Macro")
    await expect(page).toHaveURL(/Macro/, { timeout: 30_000 })
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()

    await page.goBack()
    await expect(search).toHaveValue("")
    await page.goForward()
    await expect(search).toHaveValue("Macro")

    await page.goto("/vi/events?page=0&size=25&search=Macro")
    await expect(page).toHaveURL(/page=1&size=10&search=Macro/)
    await page.goto("/vi/events?page=99&size=10")
    await expect(page).toHaveURL(/page=2&size=10/)
  })
})
