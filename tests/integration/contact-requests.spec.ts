import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

import { DEFAULT_APP_LOCALE } from "../../app/lib/i18n/config"
import { vi } from "../../app/lib/i18n/dictionaries/vi"
import { withLocalePath } from "../../app/lib/i18n/routing"
import { contactRequestPageResponseSchema } from "../../app/lib/contact-requests/definitions"
import { hasPermission } from "../../app/lib/permissions"

const CONTACT_REQUEST_READ_PERMISSION = "contact-request:read"

test.afterEach(async ({ page }) => {
  const hasSession = await page
    .evaluate(() => Boolean(window.Clerk?.session))
    .catch(() => false)
  if (hasSession) {
    await clerk.signOut({ page })
  }
})

test("contact requests use the signed-in account permission and live API", async ({
  page,
  request,
}) => {
  const backendUrl = process.env.API_BASE_URL!

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

  const token = await page.evaluate(async () =>
    window.Clerk.session!.getToken({ template: "signapse" })
  )
  expect(Boolean(token), "The session must provide the signapse JWT").toBe(true)
  if (!token) throw new Error("The session has no signapse JWT")

  const headers = { Authorization: `Bearer ${token}` }
  const profileResponse = await request.get(`${backendUrl}/me`, { headers })
  expect(profileResponse.status(), "BE /me must accept the signapse JWT").toBe(
    200
  )
  const profile = (await profileResponse.json()) as { permissions?: unknown }
  const permissions = Array.isArray(profile.permissions)
    ? profile.permissions.filter(
        (permission): permission is string => typeof permission === "string"
      )
    : []
  const canRead = hasPermission(permissions, CONTACT_REQUEST_READ_PERMISSION)

  const query = new URLSearchParams({ page: "0", size: "10" })
  query.append("sort", "createdDate,desc")
  query.append("sort", "id,desc")
  const apiResponse = await request.get(
    `${backendUrl}/contact-requests?${query.toString()}`,
    { headers }
  )

  if (canRead) {
    expect(
      apiResponse.status(),
      "BE /contact-requests must allow an account with contact-request:read"
    ).toBe(200)
    const parsed = contactRequestPageResponseSchema.safeParse(
      await apiResponse.json()
    )
    expect(
      parsed.success,
      "BE /contact-requests must match the FE schema"
    ).toBe(true)
    if (!parsed.success) {
      throw new Error("BE /contact-requests returned an invalid response")
    }

    const pageResponse = await page.goto(
      withLocalePath("/contact-requests", DEFAULT_APP_LOCALE)
    )
    expect(pageResponse?.status(), "The FE list route must load").toBe(200)
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .getByRole("link", { name: vi.navigation.contactRequests, exact: true })
    ).toHaveAttribute("aria-current", "page")
    await expect(page.locator("[data-contact-request-row]")).toHaveCount(
      parsed.data.content?.length ?? 0
    )
  } else {
    expect(
      apiResponse.status(),
      "BE /contact-requests must deny an account without contact-request:read"
    ).toBe(403)

    const pageResponse = await page.goto(
      withLocalePath("/contact-requests", DEFAULT_APP_LOCALE)
    )
    expect(
      pageResponse?.status(),
      "The FE route must render its access gate"
    ).toBe(200)
    await expect(
      page.getByText(vi.contactRequests.permissionDeniedTitle)
    ).toBeVisible()
    await expect(
      page
        .locator('[data-slot="sidebar"]')
        .getByRole("link", { name: vi.navigation.contactRequests, exact: true })
    ).toHaveCount(0)
    await expect(page.locator("[data-contact-request-row]")).toHaveCount(0)
  }
})
