import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "./fixtures"

import { en } from "../../app/lib/i18n/dictionaries/en"
import { vi } from "../../app/lib/i18n/dictionaries/vi"

const responsiveViewports = [
  { width: 360, height: 844 },
  { width: 390, height: 844 },
  { width: 767, height: 844 },
  { width: 768, height: 844 },
  { width: 1024, height: 768 },
  { width: 1439, height: 1024 },
  { width: 1440, height: 1024 },
  { width: 1520, height: 1024 },
  // Effective CSS viewport for a 1520px desktop at 200% zoom.
  { width: 760, height: 512 },
]

test.describe("P0 AI connections", () => {
  test("renders the approved list and opens read-only legacy detail", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-provider-config:create",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/en/ai-provider-configs")

    await expect(
      page.getByRole("columnheader", {
        name: en.aiProviderConfigs.connectionColumn,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", {
        name: en.aiProviderConfigs.endpointColumn,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", {
        name: en.aiProviderConfigs.apiKeysColumn,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", {
        name: en.aiProviderConfigs.usedByColumn,
        exact: true,
      })
    ).toBeVisible()
    await expect(page.getByText("1 connection", { exact: true })).toBeVisible()
    await expect(page.getByText("gsk-...legacy", { exact: true })).toBeVisible()
    await expect(page.getByText("1 key", { exact: true })).toBeVisible()
    await expect(
      page.getByText("Default endpoint for Groq", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(en.aiProviderConfigs.referencesNotProvided, {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByText(en.pagination.pageSize, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: en.aiProviderConfigs.addConnection })
    ).toBeVisible()
    await expect(
      page.getByText("Default provider", { exact: true })
    ).toHaveCount(0)
    await expect(page.getByText("Model", { exact: true })).toHaveCount(0)

    const listScreenshot = await page.screenshot({
      fullPage: false,
      style: "nextjs-portal { display: none !important; }",
    })
    await testInfo.attach("ai-connections-list-en-1520x1024.png", {
      body: listScreenshot,
      contentType: "image/png",
    })

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      axe.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])

    await page.goto("/vi/ai-provider-configs")
    await expect(
      page.getByRole("columnheader", { name: "Kết nối", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Được dùng bởi", exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(vi.pagination.pageSize, { exact: true })
    ).toBeVisible()
    await page.getByRole("link", { name: "Groq Kết nối #12" }).click()
    await expect(page.getByRole("heading", { name: "Groq" })).toBeVisible()
    await expect(page.getByText("0 tác vụ", { exact: true })).toBeVisible()
    await expect(page.getByText("gsk-...legacy", { exact: true })).toBeVisible()
    await expect(page.getByText("Mô hình", { exact: true })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /sửa|xóa/i })).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.filter((request) =>
        ["/ai-provider-configs", "/ai-provider-configs/12"].includes(
          String(request.path)
        )
      )
    ).toMatchObject([
      {
        method: "GET",
        path: "/ai-provider-configs",
        query: "?page=0&size=10&sort=id%2Cdesc",
      },
      {
        method: "GET",
        path: "/ai-provider-configs",
        query: "?page=0&size=10&sort=id%2Cdesc",
      },
      { method: "GET", path: "/ai-provider-configs/12" },
    ])
  })

  test("creates only supported-provider connections after API confirmation", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "ai-provider-config:create",
      "ai-provider-config:read",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/en/ai-provider-configs/create")

    await expect(
      page.getByRole("heading", { name: "Create AI connection" })
    ).toBeVisible()
    await expect(page.getByLabel("Provider")).toBeVisible()
    await expect(page.getByLabel("Endpoint")).toBeVisible()
    await expect(page.getByLabel("Description")).toBeVisible()
    await expect(page.getByLabel("Key 1", { exact: true })).toBeVisible()
    await expect(
      page.getByText("Supported providers: DeepSeek, Gemini and OpenAI.")
    ).toBeVisible()
    await expect(
      page.getByPlaceholder("Use the provider endpoint")
    ).toBeVisible()
    await expect(
      page.getByText(
        "Optional. Helps identify connections to the same provider."
      )
    ).toBeVisible()
    await expect(
      page.getByText(
        "At least one key is required. Saved keys are masked and cannot be revealed."
      )
    ).toBeVisible()
    await expect(
      page.getByText("Verify on create", { exact: true })
    ).toBeVisible()
    await expect(page.getByText("Model", { exact: true })).toHaveCount(0)
    await expect(page.getByLabel(/default provider/i)).toHaveCount(0)

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      axe.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])

    const provider = page.getByRole("combobox", { name: "Provider" })
    await provider.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("option", { name: "DeepSeek" })).toBeVisible()
    await expect(page.getByRole("option", { name: "Gemini" })).toBeVisible()
    await expect(page.getByRole("option", { name: "OpenAI" })).toBeVisible()
    await expect(page.getByRole("option", { name: "Groq" })).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(provider).toBeFocused()

    const addKey = page.getByRole("button", { name: "Add key" })
    await addKey.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByLabel("Key 2", { exact: true })).toBeVisible()
    const removeSecondKey = page.getByRole("button", {
      name: "Remove API key 2",
    })
    await removeSecondKey.focus()
    await page.keyboard.press("Space")
    await expect(page.getByLabel("Key 2", { exact: true })).toHaveCount(0)

    const createScreenshot = await page.screenshot({
      fullPage: false,
      style: "nextjs-portal { display: none !important; }",
    })
    await testInfo.attach("ai-connections-create-en-1520x1024.png", {
      body: createScreenshot,
      contentType: "image/png",
    })

    const removeFirstKey = page.getByRole("button", {
      name: "Remove API key 1",
    })
    await removeFirstKey.focus()
    await page.keyboard.press("Space")
    await expect(page.getByLabel("Key 1", { exact: true })).toHaveCount(0)
    await expect(page.getByText(en.aiProviderConfigs.noKeysAdded)).toBeVisible()

    const submit = page.getByRole("button", { name: "Create connection" })
    await submit.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByText(en.aiProviderConfigs.keyRequired)).toBeVisible()
    await expect(addKey).toBeFocused()
    expect(
      (await fixture.state()).requests.filter(
        (request) =>
          request.path === "/ai-provider-configs" && request.method === "POST"
      )
    ).toHaveLength(0)
    await page.keyboard.press("Enter")
    await expect(page.getByLabel("Key 1", { exact: true })).toBeVisible()

    await page.getByLabel("Key 1", { exact: true }).fill("fixture-secret-key")
    await page.getByLabel("Endpoint").fill("https://api.example.test/v1")
    await page.getByLabel("Description").fill("Fixture connection")
    await fixture.setScenario(
      "/ai-provider-configs",
      "validation-error",
      "POST"
    )
    await page.getByRole("button", { name: "Create connection" }).click()
    await expect(
      page.getByText("Fixture validation failed", { exact: true })
    ).toBeVisible()
    await expect(page.getByLabel("Key 1", { exact: true })).toHaveValue(
      "fixture-secret-key"
    )
    await expect(page).toHaveURL(/\/en\/ai-provider-configs\/create$/)

    await fixture.setScenario("/ai-provider-configs", "success", "POST")
    await page.getByRole("button", { name: "Create connection" }).click()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs$/)
    await expect(page.getByText("key-...-key", { exact: true })).toBeVisible()

    const state = await fixture.state()
    const requests = state.requests.filter(
      (request) => request.path === "/ai-provider-configs"
    )
    expect(
      requests.filter((request) => request.method === "POST")
    ).toHaveLength(2)
    expect(requests.at(-1)?.method).toBe("GET")
    expect(state.violations).toEqual([])
  })

  test("blocks the create route when create permission is absent", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await page.goto("/en/ai-provider-configs/create")

    await expect(
      page.getByText("You do not have permission to create AI connections.")
    ).toBeVisible()
    await expect(page.getByLabel("Key 1", { exact: true })).toHaveCount(0)
  })

  test("keeps the connection list inside responsive viewports", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport)
      await page.context().addCookies([
        {
          name: "sidebar_state",
          value: viewport.width >= 1440 ? "true" : "false",
          url: "http://127.0.0.1:3100/",
        },
      ])
      await page.goto("/en/ai-provider-configs")
      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)

      if (viewport.width <= 390) {
        const table = page.locator("[data-slot='table-container']")
        const scrollDimensions = await table.evaluate((element) => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }))
        expect(scrollDimensions.scrollWidth).toBeGreaterThan(
          scrollDimensions.clientWidth
        )
      }
    }
  })

  test("keeps the create form usable across responsive viewports", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:create"])
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport)
      await page.context().addCookies([
        {
          name: "sidebar_state",
          value: viewport.width >= 1440 ? "true" : "false",
          url: "http://127.0.0.1:3100/",
        },
      ])
      await page.goto("/en/ai-provider-configs/create")
      await expect(page.getByLabel("Provider")).toBeVisible()
      await expect(page.getByLabel("Endpoint")).toBeVisible()
      await expect(page.getByLabel("Key 1", { exact: true })).toBeVisible()

      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
    }
  })

  test.describe("touch key management", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

    test("lets a touch user remove and add draft keys", async ({
      page,
      fixture,
    }) => {
      await fixture.setPermissions(["ai-provider-config:create"])
      await page.context().addCookies([
        {
          name: "sidebar_state",
          value: "false",
          url: "http://127.0.0.1:3100/",
        },
      ])
      await page.goto("/en/ai-provider-configs/create")

      await page.getByRole("button", { name: "Remove API key 1" }).tap()
      await expect(page.getByLabel("Key 1", { exact: true })).toHaveCount(0)
      await page.getByRole("button", { name: "Add key" }).tap()
      await expect(page.getByLabel("Key 1", { exact: true })).toBeVisible()
    })
  })
})
