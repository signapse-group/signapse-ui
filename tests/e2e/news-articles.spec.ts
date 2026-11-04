import { expect, test } from "./fixtures"

test("news article list filters and full article respect the reading contract", async ({
  page,
  fixture,
  context,
}, testInfo) => {
  await fixture.setPermissions(["news-article:read"])

  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/news-articles")
  const articleLink = page.getByRole("link", {
    name: "Fixture market update",
    exact: true,
  })
  await expect(articleLink).toBeVisible()
  const browserTimeZone = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  await expect(
    page.getByText(`Ngày xuất bản theo múi giờ ${browserTimeZone}`, {
      exact: true,
    })
  ).toBeVisible()
  await expect(
    page
      .getByText("15:00 15/01/2026", { exact: true })
      .filter({ visible: true })
  ).toHaveCount(1)
  await expect(
    page.getByText("Synthetic news item.", { exact: true })
  ).toBeVisible()
  await expect(page.getByText("Đã nạp", { exact: true }).last()).toBeVisible()
  await expect(page.getByRole("button", { name: "Xóa bài viết" })).toHaveCount(
    0
  )
  await testInfo.attach("news-articles-list-wide-1520x1024.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await context.clearCookies({ name: "signapse-browser-time-zone" })
  await page.goto("/vi/dashboard")
  const dashboardTimeZone = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const expectedDashboardTimestamp = await page.evaluate((timeZone) => {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(new Date("2026-01-15T08:00:00.000Z"))
  }, dashboardTimeZone)
  await expect(
    page.getByText(expectedDashboardTimestamp, { exact: true })
  ).toBeVisible()
  await page.goto("/vi/news-articles")
  await expect(articleLink).toBeVisible()

  const search = page.getByRole("searchbox", { name: "Tìm bài viết tin tức" })
  await search.fill("Synthetic news item")
  await expect(page).toHaveURL(/keyword%5BcontainsIgnoreCase%5D/)
  expect(
    new URL(page.url()).searchParams.get("keyword[containsIgnoreCase]")
  ).toBe("Synthetic news item")

  await page.getByRole("button", { name: "Nhà xuất bản", exact: true }).click()
  const publisherSearch = page.getByRole("combobox", {
    name: "Tìm nhà xuất bản...",
  })
  await publisherSearch.fill("Wire")
  const publisherOption = page.getByRole("option", {
    name: "Fixture Wire",
    exact: true,
  })
  await expect(publisherOption).toBeVisible()
  expect(new URL(page.url()).searchParams.get("sourceName[eq]")).toBeNull()
  await publisherOption.click()
  await expect(page).toHaveURL(/sourceName%5Beq%5D/)
  await expect(articleLink).toBeVisible()
  expect(new URL(page.url()).searchParams.get("sourceName[eq]")).toBe(
    "Fixture Wire"
  )

  const sort = page.getByRole("combobox", { name: "Sắp xếp danh sách" })
  await expect(sort).toContainText("Mới nhất")
  await sort.click()
  await expect(
    page.getByRole("option", { name: "Ngày tạo", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("option", { name: "Tiêu đề A-Z" })).toHaveCount(0)
  await page.getByRole("option", { name: "Ngày tạo", exact: true }).click()
  await expect(page).toHaveURL(/sort=createdDate_desc/)
  expect(new URL(page.url()).searchParams.get("sort")).toBe("createdDate_desc")

  await page.getByLabel("Ngày bắt đầu").fill("2026-01-15")
  await expect(page).toHaveURL(/publishedFrom=2026-01-15/)
  await page.getByLabel("Ngày kết thúc").fill("2026-01-15")
  await expect(page).toHaveURL(/publishedTo=2026-01-15/)
  await expect(articleLink).toBeVisible()
  await expect
    .poll(async () => {
      const { requests } = await fixture.state()
      return requests.find((request) => {
        if (request.method !== "GET" || request.path !== "/news-articles") {
          return false
        }
        const filter = new URLSearchParams(String(request.query)).get("$filter")
        return (
          filter?.includes("publishedAt ge '2026-01-14T17:00:00.000Z'") &&
          filter.includes("publishedAt lt '2026-01-15T17:00:00.000Z'")
        )
      })
    })
    .toBeTruthy()

  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(articleLink).toBeVisible()
  await testInfo.attach("news-articles-list-compact-1024x768.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.setViewportSize({ width: 390, height: 844 })
  const mobileFilters = page.getByRole("button", { name: /Bộ lọc/ })
  await expect(search).toBeVisible()
  await expect(sort).toBeVisible()
  await expect(mobileFilters).toBeVisible()
  const mobileStartDate = page.locator("#news-article-published-from")
  await expect(mobileStartDate).toBeHidden()
  await testInfo.attach("news-articles-list-mobile-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
  await mobileFilters.click()
  await expect(mobileStartDate).toBeVisible()
  await mobileFilters.click()
  await expect(mobileStartDate).toBeHidden()
  expect(new URL(page.url()).searchParams.get("sourceName[eq]")).toBe(
    "Fixture Wire"
  )
  expect(new URL(page.url()).searchParams.get("sort")).toBe("createdDate_desc")
  expect(new URL(page.url()).searchParams.get("publishedFrom")).toBe(
    "2026-01-15"
  )
  expect(new URL(page.url()).searchParams.get("publishedTo")).toBe("2026-01-15")

  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click()
  await expect(page).not.toHaveURL(
    /sourceName%5Beq%5D|publishedFrom|publishedTo/
  )
  expect(
    new URL(page.url()).searchParams.get("keyword[containsIgnoreCase]")
  ).toBe("Synthetic news item")
  expect(new URL(page.url()).searchParams.get("sort")).toBe("createdDate_desc")

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
    await expect(articleLink).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      `article list should not overflow at ${width}px`
    ).toBe(true)
  }

  await page.setViewportSize({ width: 1520, height: 1024 })
  await fixture.setScenario(
    "/news-articles",
    "article-reader-long-content",
    "GET"
  )
  await page.goto("/vi/news-articles/71")
  await expect(
    page.getByRole("heading", {
      name: "Bản tin thị trường đã bản địa hóa",
      exact: true,
    })
  ).toBeVisible()
  await expect(
    page.getByText("Dấu mốc cuối bài: Nội dung dài vẫn được giữ đầy đủ.")
  ).toBeVisible()
  await expect(page.getByText("Lỗi suy diễn", { exact: true })).toBeVisible()
  await expect(page.getByText("Fixture evidence summary.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Mở sự kiện" })).toHaveCount(0)

  await fixture.setPermissions(["news-article:read", "event:read"])
  await page.reload()
  await expect(page.getByRole("link", { name: "Mở sự kiện" })).toHaveAttribute(
    "href",
    "/vi/events/61"
  )

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
    await expect(page.getByText("Fixture evidence summary.")).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      `article detail should not overflow at ${width}px`
    ).toBe(true)
  }

  await fixture.setPermissions(["news-article:delete"])
  await page.goto("/vi/news-articles")
  await expect(
    page.getByText(
      /Bạn không có quyền truy cập khu vực quản lý bài viết tin tức\./
    )
  ).toBeVisible()
})
