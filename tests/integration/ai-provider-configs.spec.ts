import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

import { DEFAULT_APP_LOCALE } from "../../app/lib/i18n/config"
import { vi } from "../../app/lib/i18n/dictionaries/vi"
import { formatNumber } from "../../app/lib/i18n/format"
import { withLocalePath } from "../../app/lib/i18n/routing"
import { aiProviderConfigPageResponseSchema } from "../../app/lib/ai-provider-configs/definitions"

test("AI connection list reaches the producer and is fetched during FE SSR", async ({
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
  expect(
    Boolean(token),
    "The session must provide the signapse JWT template"
  ).toBe(true)
  if (!token) throw new Error("The session has no signapse JWT")

  const directResponse = await request.get(
    `${backendUrl}/ai-provider-configs?page=0&size=10&sort=id%2Cdesc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": DEFAULT_APP_LOCALE,
      },
    }
  )
  expect(
    directResponse.status(),
    "The producer must authorize and return the AI connection list"
  ).toBe(200)
  const parsed = aiProviderConfigPageResponseSchema.safeParse(
    await directResponse.json()
  )
  expect(parsed.success, "The producer response must match the FE schema").toBe(
    true
  )
  if (!parsed.success) {
    throw new Error("The producer returned an invalid AI connection page")
  }

  for (const connection of parsed.data.content) {
    for (const credential of connection.credentials) {
      expect(credential).not.toHaveProperty("apiKey")
    }
  }

  const pageResponse = await page.goto(
    withLocalePath("/ai-provider-configs", DEFAULT_APP_LOCALE)
  )
  expect(pageResponse?.status(), "The FE SSR list route must load").toBe(200)
  await expect(
    page.getByRole("columnheader", {
      name: vi.aiProviderConfigs.connectionColumn,
    })
  ).toBeVisible()
  await expect(
    page.getByText(
      vi.aiProviderConfigs.connectionCount.replace(
        "{count}",
        formatNumber(parsed.data.totalElements, DEFAULT_APP_LOCALE)
      ),
      { exact: true }
    )
  ).toBeVisible()

  if (parsed.data.content.length > 0) {
    const first = parsed.data.content[0]
    await expect(
      page.getByText(
        vi.aiProviderConfigs.connectionNumber.replace(
          "{id}",
          formatNumber(first.id, DEFAULT_APP_LOCALE)
        ),
        { exact: true }
      )
    ).toBeVisible()
    if (first.credentials[0]) {
      await expect(
        page.getByText(first.credentials[0].keyPreview, { exact: true })
      ).toBeVisible()
    }
  } else {
    await expect(
      page.getByText(vi.aiProviderConfigs.emptyTitle, { exact: true })
    ).toBeVisible()
  }
})
