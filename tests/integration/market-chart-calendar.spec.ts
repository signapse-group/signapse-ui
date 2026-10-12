import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

import { DEFAULT_APP_LOCALE } from "../../app/lib/i18n/config"
import { vi } from "../../app/lib/i18n/dictionaries/vi"
import { withLocalePath } from "../../app/lib/i18n/routing"
import { marketChartEconomicCalendarEventResponseSchema } from "../../app/lib/market-charts/definitions"

test("market chart calendar reads the live range for a watchlist asset", async ({
  page,
  request,
}) => {
  await page.goto(withLocalePath("/sign-in", DEFAULT_APP_LOCALE))
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_USER_IDENTIFIER!,
      password: process.env.E2E_USER_PASSWORD!,
    },
  })
  await page.waitForFunction(() =>
    Boolean(window.Clerk?.session && window.Clerk?.user)
  )

  await page.goto(withLocalePath("/market-charts", DEFAULT_APP_LOCALE))
  await expect(page).toHaveURL(/assetId=\d+/)
  await expect(page.locator("#market-chart-asset")).toBeVisible()
  await page.getByRole("button", { name: /Mở lịch sắp diễn ra/ }).click()
  await expect(
    page
      .getByRole("dialog")
      .getByText(vi.marketCharts.calendar.legendLabel, { exact: true })
  ).toBeVisible()

  const assetId = new URL(page.url()).searchParams.get("assetId")
  const token = await page.evaluate(async () =>
    window.Clerk.session!.getToken({ template: "signapse" })
  )
  expect(Boolean(assetId)).toBe(true)
  expect(Boolean(token)).toBe(true)
  if (!assetId || !token) {
    throw new Error("The signed-in chart session is missing required access")
  }

  const now = Date.now()
  const from = new Date(now - 60 * 60 * 1000).toISOString()
  const to = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  const query = new URLSearchParams({ assetId, from, to, impact: "HIGH" })
  const response = await request.get(
    `${process.env.API_BASE_URL}/market-charts/economic-calendar-events?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  expect(response.status()).toBe(200)

  const parsed = z
    .array(marketChartEconomicCalendarEventResponseSchema)
    .safeParse(await response.json())
  expect(parsed.success).toBe(true)
})

test.afterEach(async ({ page }) => {
  const hasSession = await page
    .evaluate(() => Boolean(window.Clerk?.session))
    .catch(() => false)
  if (hasSession) {
    await clerk.signOut({ page })
  }
})
