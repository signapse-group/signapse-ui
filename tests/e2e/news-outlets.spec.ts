import { expect, test, waitForClientHandler } from "./fixtures"

test("read permission keeps the outlet list and detail available without update controls", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["news-outlet:read"])
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/news-outlets")

  const outletLink = page.getByRole("link", {
    name: "Fixture News Outlet",
    exact: true,
  })
  await expect(outletLink).toHaveAttribute("href", "/vi/news-outlets/7")
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-disabled",
    "true"
  )
  await expect(
    page.getByRole("link", { name: "Thêm nguồn tin" })
  ).toHaveCount(0)
  await expect(page.getByRole("link", { name: "Chỉnh sửa" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Xóa nguồn tin" })).toHaveCount(
    0
  )
  await expect(page.locator('a[href^="ftp:"]')).toHaveCount(0)

  await testInfo.attach("news-outlet-list-wide-1520x1024.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

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
  await testInfo.attach("news-outlet-read-only-mobile-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
})
