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
    const searchFilter =
      "title[containsIgnoreCase],description[containsIgnoreCase],canonicalKey[containsIgnoreCase]"
    const initialParams = new URLSearchParams({
      page: "1",
      size: "10",
      sort: "occurredAt_desc",
    })
    initialParams.set(searchFilter, "Fixture")

    await page.goto(`/vi/events?${initialParams.toString()}`)
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).toBeVisible()

    const search = page.getByRole("searchbox", { name: "Tìm sự kiện" })
    await expect(search).toHaveValue("Fixture")

    const expectEventsQuery = async (
      expectedPage: string,
      expectedSize: string
    ) => {
      await expect
        .poll(() =>
          page.evaluate((filterKey) => {
            const params = new URLSearchParams(window.location.search)

            return {
              page: params.get("page"),
              size: params.get("size"),
              search: params.get(filterKey),
              sort: params.get("sort"),
            }
          }, searchFilter)
        )
        .toEqual({
          page: expectedPage,
          size: expectedSize,
          search: "Fixture",
          sort: "occurredAt_desc",
        })
    }

    const nextPage = page.getByRole("button", {
      name: "Đi tới trang sau",
      exact: true,
    })
    const pageSize = page.getByRole("combobox", {
      name: "Số hàng mỗi trang",
    })
    await expect(pageSize).toContainText("10")
    await waitForClientHandler(nextPage)
    await nextPage.click()
    await expectEventsQuery("2", "10")
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).not.toBeVisible()

    await waitForClientHandler(pageSize)
    await pageSize.click()
    await page.getByRole("option", { name: "20 / trang" }).click()
    await expectEventsQuery("1", "20")
    await expect(pageSize).toContainText("20")
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()

    await page.goBack()
    await expectEventsQuery("2", "10")
    await expect(search).toHaveValue("Fixture")
    await expect(pageSize).toContainText("10")
    await expect(
      page.getByRole("button", { name: "Đi tới trang 2" })
    ).toHaveAttribute("aria-current", "page")
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).not.toBeVisible()

    await page.goForward()
    await expectEventsQuery("1", "20")
    await expect(search).toHaveValue("Fixture")
    await expect(pageSize).toContainText("20")
    await expect(
      page.getByRole("button", { name: "Đi tới trang 1" })
    ).toHaveAttribute("aria-current", "page")
    await expect(
      page.getByText("Central bank signals a slower easing path", {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()

    await waitForClientHandler(search, "onChange")
    await search.fill("Macro")
    await expect(search).toHaveValue("Macro")
    await expect(page).toHaveURL(/Macro/, { timeout: 30_000 })
    await expect(
      page.getByText("Macro liquidity conditions stabilize", { exact: true })
    ).toBeVisible()

    await page.goBack()
    await expect(search).toHaveValue("Fixture")
    await page.goForward()
    await expect(search).toHaveValue("Macro")

    await page.goto("/vi/events?page=0&size=25&search=Macro")
    await expect(page).toHaveURL(/page=1&size=10&search=Macro/)
    await page.goto("/vi/events?page=99&size=10")
    await expect(page).toHaveURL(/page=2&size=10/)
  })
})
