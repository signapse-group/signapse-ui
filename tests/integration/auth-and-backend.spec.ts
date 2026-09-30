import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

import { DEFAULT_APP_LOCALE } from "../../app/lib/i18n/config"
import { withLocalePath } from "../../app/lib/i18n/routing"

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
})
