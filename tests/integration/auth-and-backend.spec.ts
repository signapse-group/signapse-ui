import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

import { DEFAULT_APP_LOCALE } from "../../app/lib/i18n/config"
import { vi } from "../../app/lib/i18n/dictionaries/vi"
import { formatNumber } from "../../app/lib/i18n/format"
import { withLocalePath } from "../../app/lib/i18n/routing"
import {
  usageLimitsResponseSchema,
  type UsageLimitsResponse,
} from "../../app/lib/usage-limits/definitions"

async function loadUsageLimits(
  request: import("@playwright/test").APIRequestContext,
  backendUrl: string,
  token: string
): Promise<UsageLimitsResponse> {
  const response = await request.get(`${backendUrl}/me/usage-limits`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(
    response.status(),
    "BE /me/usage-limits must accept the signapse JWT"
  ).toBe(200)

  const parsed = usageLimitsResponseSchema.safeParse(await response.json())
  expect(parsed.success, "BE /me/usage-limits must match the FE schema").toBe(
    true
  )
  if (!parsed.success) {
    throw new Error("BE /me/usage-limits returned an invalid response")
  }

  return parsed.data
}

async function expectUsageMenuToMatch(
  menu: import("@playwright/test").Locator,
  usage: UsageLimitsResponse
) {
  const metrics = [
    [vi.usageLimits.workspaceTitle, usage.workspace],
    [vi.usageLimits.conversationTurnsTitle, usage.conversationTurns],
    [vi.usageLimits.activeSchedulesTitle, usage.activeSchedules],
  ] as const

  const progressBars = menu.locator('[data-slot="progress"]')
  await expect(progressBars).toHaveCount(metrics.length)

  for (const [index, [name, metric]] of metrics.entries()) {
    const value = `${formatNumber(metric.used, DEFAULT_APP_LOCALE)} / ${formatNumber(metric.limit, DEFAULT_APP_LOCALE)}`
    await expect(menu.getByText(value, { exact: true }).first()).toBeVisible()
    await expect(progressBars.nth(index)).toHaveAttribute("aria-label", name)
    await expect(progressBars.nth(index)).toHaveAttribute(
      "aria-valuetext",
      value
    )
  }

  const resetTime = menu.locator("time")
  await expect(resetTime).toHaveAttribute(
    "dateTime",
    usage.conversationTurns.resetAtUtc
  )
  await expect(resetTime).toContainText("UTC")

  await expect(
    menu.getByText(
      vi.usageLimits.perWorkspace.replace(
        "{limit}",
        formatNumber(usage.watchlist.limit, DEFAULT_APP_LOCALE)
      )
    )
  ).toBeVisible()
  const workspaceRows = menu.locator("[data-watchlist-workspace]")
  await expect(workspaceRows).toHaveCount(usage.watchlist.workspaces.length)

  for (const [index, workspace] of usage.watchlist.workspaces.entries()) {
    const row = workspaceRows.nth(index)
    await expect(row).toHaveAttribute(
      "data-watchlist-workspace",
      String(workspace.workspaceId)
    )
    await expect(row.locator("span").nth(1)).toHaveText(
      `${formatNumber(workspace.used, DEFAULT_APP_LOCALE)} / ${formatNumber(usage.watchlist.limit, DEFAULT_APP_LOCALE)}`
    )
  }
}

test.afterEach(async ({ page }) => {
  const hasSession = await page
    .evaluate(() => Boolean(window.Clerk?.session))
    .catch(() => false)
  if (hasSession) {
    await page.goto(withLocalePath("/", DEFAULT_APP_LOCALE))
    await clerk.signOut({ page })
  }
})

test("password session reaches the public backend and renders the account page", async ({
  page,
  request,
}) => {
  const backendUrl = process.env.API_BASE_URL!
  const anonymous = await request.get(`${backendUrl}/me`)
  expect(anonymous.status(), "BE /me must reject an anonymous request").toBe(
    401
  )

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

  const sessionResponse = await page.request.get("/api/user")
  expect(
    sessionResponse.status(),
    "FE /api/user must accept the Clerk session"
  ).toBe(200)
  const { user } = await sessionResponse.json()
  const token = await page.evaluate(async () =>
    window.Clerk.session!.getToken({ template: "signapse" })
  )
  expect(
    Boolean(token),
    "The session must provide the signapse JWT template"
  ).toBe(true)
  if (!token) throw new Error("The session has no signapse JWT")

  const authenticated = await request.get(`${backendUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(authenticated.status(), "BE /me must accept the signapse JWT").toBe(
    200
  )
  const profile = await authenticated.json()
  const primaryEmail = user.emailAddresses.find(
    (email: { id: string }) => email.id === user.primaryEmailAddressId
  )?.emailAddress
  expect(
    Boolean(primaryEmail),
    "The authenticated account must have a primary email"
  ).toBe(true)
  expect(profile.email).toBe(primaryEmail)
  expect(profile.id).toEqual(expect.any(Number))

  const response = await page.goto(
    withLocalePath("/account", DEFAULT_APP_LOCALE)
  )
  expect(
    response?.status(),
    "The FE account page must load real backend data"
  ).toBe(200)
  await expect(page.locator("#account-email")).toHaveValue(profile.email)
  if (profile.firstName)
    await expect(page.locator("#account-first-name")).toHaveValue(
      profile.firstName
    )
  if (profile.lastName)
    await expect(page.locator("#account-last-name")).toHaveValue(
      profile.lastName
    )

  const directUsage = await loadUsageLimits(request, backendUrl, token)
  const screenUrl = page.url()
  const profileMenuTrigger = page.locator("#app-sidebar-user-menu-trigger")
  await profileMenuTrigger.click()
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  const usageItem = menu.getByRole("menuitem", {
    name: vi.usageLimits.title,
  })
  await usageItem.click()
  await expect(page).toHaveURL(screenUrl)
  await expect(menu.locator('[data-slot="progress"]').first()).toBeVisible()
  await expectUsageMenuToMatch(menu, directUsage)

  await usageItem.click()
  const reopenedUsage = await loadUsageLimits(request, backendUrl, token)
  await usageItem.click()
  await expect(menu.locator('[data-slot="progress"]').first()).toBeVisible()
  await expect(page).toHaveURL(screenUrl)
  await expectUsageMenuToMatch(menu, reopenedUsage)
})
