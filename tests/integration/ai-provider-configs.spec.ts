import { clerk } from "@clerk/testing/playwright"
import { expect, test, type Page } from "@playwright/test"

import { DEFAULT_APP_LOCALE } from "../../app/lib/i18n/config"
import { vi } from "../../app/lib/i18n/dictionaries/vi"
import { formatNumber } from "../../app/lib/i18n/format"
import { withLocalePath } from "../../app/lib/i18n/routing"
import {
  aiProviderConfigDetailResponseSchema,
  aiProviderConfigPageResponseSchema,
} from "../../app/lib/ai-provider-configs/definitions"

async function signInAndGetToken(page: Page) {
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
  return token
}

async function failureHint(response: import("@playwright/test").APIResponse) {
  if (response.status() < 400) return `HTTP ${response.status()}`

  const body: unknown = await response.json().catch(() => null)
  if (typeof body !== "object" || body === null) {
    return `HTTP ${response.status()}`
  }

  const details = body as Record<string, unknown>
  const code = typeof details.code === "string" ? ` ${details.code}` : ""
  const message =
    typeof details.message === "string"
      ? details.message
      : typeof details.detail === "string"
        ? details.detail
        : ""
  return `HTTP ${response.status()}${code}${message ? `: ${message}` : ""}`.slice(
    0,
    240
  )
}

test("AI connection list and detail reach the producer and render through FE SSR", async ({
  page,
  request,
}) => {
  const backendUrl = process.env.API_BASE_URL!
  const token = await signInAndGetToken(page)

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
    `The producer must authorize and return the AI connection list (${await failureHint(directResponse)})`
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

    const directDetailResponse = await request.get(
      `${backendUrl}/ai-provider-configs/${first.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": DEFAULT_APP_LOCALE,
        },
      }
    )
    expect(
      directDetailResponse.status(),
      "The producer must authorize and return read-only connection detail"
    ).toBe(200)
    const detail = aiProviderConfigDetailResponseSchema.safeParse(
      await directDetailResponse.json()
    )
    expect(
      detail.success,
      "Detail must include task references and masked keys"
    ).toBe(true)
    if (!detail.success) {
      throw new Error("The producer returned an invalid AI connection detail")
    }
    for (const credential of detail.data.credentials) {
      expect(credential).not.toHaveProperty("apiKey")
    }

    const detailPageResponse = await page.goto(
      withLocalePath(`/ai-provider-configs/${first.id}`, DEFAULT_APP_LOCALE)
    )
    expect(
      detailPageResponse?.status(),
      "The FE SSR detail route must load"
    ).toBe(200)
    await expect(
      page.getByRole("heading", { name: vi.aiProviderConfigs.editTitle })
    ).toBeVisible()
    if (detail.data.credentials[0]) {
      await expect(
        page.getByText(detail.data.credentials[0].keyPreview, { exact: true })
      ).toBeVisible()
    }
    for (const reference of detail.data.taskReferences) {
      if (reference.model) {
        await expect(
          page.getByText(reference.model, { exact: true })
        ).toBeVisible()
      }
    }
  } else {
    await expect(
      page.getByText(vi.aiProviderConfigs.emptyTitle, { exact: true })
    ).toBeVisible()
  }
})

test("read-only actor can load detail and is denied update permission", async ({
  page,
  request,
}) => {
  const backendUrl = process.env.API_BASE_URL!
  const token = await signInAndGetToken(page)
  const headers = {
    Authorization: `Bearer ${token}`,
    "Accept-Language": DEFAULT_APP_LOCALE,
  }

  const profileResponse = await request.get(`${backendUrl}/me`, { headers })
  expect(profileResponse.status(), "The integration actor must be authenticated").toBe(
    200
  )
  const profile: unknown = await profileResponse.json()
  const permissions =
    typeof profile === "object" &&
    profile !== null &&
    "permissions" in profile &&
    Array.isArray(profile.permissions)
      ? profile.permissions.filter(
          (permission): permission is string => typeof permission === "string"
        )
      : []
  expect(permissions).toContain("ai-provider-config:read")
  test.skip(
    permissions.includes("ai-provider-config:update"),
    "The configured integration actor can update AI connections; a read-only actor is required for this denial check."
  )

  const listResponse = await request.get(
    `${backendUrl}/ai-provider-configs?page=0&size=10&sort=id%2Cdesc`,
    { headers }
  )
  expect(
    listResponse.status(),
    `Read-only actor can read the connection list (${await failureHint(listResponse)})`
  ).toBe(200)
  const list = aiProviderConfigPageResponseSchema.safeParse(
    await listResponse.json()
  )
  expect(list.success).toBe(true)
  if (!list.success || !list.data.content[0]) {
    throw new Error("Read-only integration needs at least one AI connection")
  }

  const first = list.data.content[0]
  const detailResponse = await request.get(
    `${backendUrl}/ai-provider-configs/${first.id}`,
    { headers }
  )
  expect(detailResponse.status(), "Read-only actor can read detail").toBe(200)
  const detail = aiProviderConfigDetailResponseSchema.safeParse(
    await detailResponse.json()
  )
  expect(detail.success).toBe(true)
  if (!detail.success) throw new Error("Read-only detail did not match OpenAPI")

  await page.goto(
    withLocalePath(`/ai-provider-configs/${first.id}`, DEFAULT_APP_LOCALE)
  )
  await expect(
    page.getByRole("heading", { name: vi.aiProviderConfigs.editTitle })
  ).toBeVisible()
  await expect(page.getByLabel(vi.aiProviderConfigs.endpoint)).toHaveCount(0)
  await expect(page.getByLabel(vi.aiProviderConfigs.newKey)).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: vi.aiProviderConfigs.deleteConnection })
  ).toHaveCount(0)

  // ID 0 is outside the positive connection ID contract, so this denial check cannot mutate a resource.
  const deniedUpdate = await request.put(
    `${backendUrl}/ai-provider-configs/0`,
    { headers, data: { description: "must not be persisted" } }
  )
  expect(deniedUpdate.status(), "Producer must enforce update permission").toBe(
    403
  )
})
