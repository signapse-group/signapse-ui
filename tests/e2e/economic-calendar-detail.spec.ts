import { expect, test } from "./fixtures"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

test("renders each release timestamp in the browser zone on desktop and mobile", async ({
  page,
  fixture,
}, testInfo) => {
  await fixture.setPermissions(["economic-calendar:read"])
  await page.emulateMedia({ colorScheme: "dark" })
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/en/economic-calendar/8201")

  const browserTimeZone = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const hostTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  expect(["Asia/Ho_Chi_Minh", "Asia/Saigon"]).toContain(browserTimeZone)
  expect(browserTimeZone).not.toBe(hostTimeZone)

  await expect(
    page.getByRole("heading", { name: "Fixture release details", exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Released 07/01/2026, 06:30 AM", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Released 06/30/2026, 11:30 PM", { exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByText("Your time zone · UTC+07:00", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Description in the current locale.", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Available", { exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByRole("main").getByText("0", { exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await testInfo.attach("economic-calendar-detail-desktop-1520x1024.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    page.getByText("Your time zone · UTC+07:00", { exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await testInfo.attach("economic-calendar-detail-mobile-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.emulateMedia({ colorScheme: "light" })
  await expect(
    page.getByText("Your time zone · UTC+07:00", { exact: true })
  ).toBeVisible()
  await testInfo.attach("economic-calendar-detail-mobile-light-390x844.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })

  await page.setViewportSize({ width: 360, height: 800 })
  await expect(
    page.getByText("Your time zone · UTC+07:00", { exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)

  await page.getByText("Technical information", { exact: true }).click()
  await expect(
    page.getByText("07/01/2026, 05:45 AM", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("07/01/2026, 03:00 AM", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("07/01/2026, 04:15 AM", { exact: true })
  ).toBeVisible()
})

test("keeps missing timestamps, zero values, and PENDING distinct", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions(["economic-calendar:read"])
  await page.goto("/vi/economic-calendar/8202")

  const unavailable = viDictionary.common.notAvailable
  await expect(
    page.getByRole("heading", { name: "Pending fixture release", exact: true })
  ).toBeVisible()
  await expect(
    page.getByText("Đang chờ", { exact: true }).first()
  ).toBeVisible()
  await expect(page.getByText("Có dữ liệu", { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole("main").getByText("0", { exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByRole("main").getByText("0", { exact: true }).nth(1)
  ).toBeVisible()
  await expect(
    page.getByText(`Công bố ${unavailable}`, { exact: true })
  ).toBeVisible()
  await expect(page.getByText("Múi giờ của bạn · UTC+07:00")).toHaveCount(0)

  await page
    .getByText(viDictionary.economicCalendar.technicalInfo, { exact: true })
    .click()
  await expect(
    page.getByText(unavailable, { exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByText("Mô tả trong ngôn ngữ hiện tại.", { exact: true })
  ).toBeVisible()
})

test("preserves read permission and not-found handling", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([])
  await page.goto("/en/economic-calendar/8201")
  await expect(
    page.getByText(
      "You do not have permission to view economic calendar details."
    )
  ).toBeVisible()
  const deniedRequests = (await fixture.state()).requests.filter(
    (request) => request.path === "/economic-calendar/8201"
  )
  expect(deniedRequests).toHaveLength(0)

  await fixture.setPermissions(["economic-calendar:read"])
  await page.goto("/en/economic-calendar/8299")
  await expect(
    page.getByRole("heading", { name: "404", exact: true })
  ).toBeVisible()
})
