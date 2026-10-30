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
      "ai-task-configuration:read",
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
    await expect(page.getByText("3 tasks", { exact: true })).toBeVisible()
    await expect(
      page.getByText(en.pagination.pageSize, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: en.aiProviderConfigs.addConnection })
    ).toBeVisible()
    await expect(
      page.getByRole("link", {
        name: en.aiProviderConfigs.openTaskConfiguration,
      })
    ).toHaveAttribute("href", "/en/ai-task-configurations")
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

    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport)
      await expect(page.getByText("3 tasks", { exact: true })).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)

      if (viewport.width === 390) {
        const usageCount = page.getByText("3 tasks", { exact: true })
        await usageCount.scrollIntoViewIfNeeded()
        expect(
          await page
            .locator('[data-slot="table-container"]')
            .evaluate((table) => table.scrollLeft)
        ).toBeGreaterThan(0)
        await expect(usageCount).toBeVisible()
        await testInfo.attach("ai-connections-list-en-390x844.png", {
          body: await page.screenshot({ fullPage: false }),
          contentType: "image/png",
        })
        await page
          .locator('[data-slot="table-container"]')
          .evaluate((table) => (table.scrollLeft = 0))
      }
    }
    await page.setViewportSize({ width: 1520, height: 1024 })

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
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-task-configuration:read",
    ])
    await page.getByRole("link", { name: "Groq #12" }).click()
    await expect(page).toHaveURL(/\/vi\/ai-provider-configs\/12$/, {
      timeout: 30_000,
    })
    await expect(
      page.getByRole("heading", { name: vi.aiProviderConfigs.editTitle })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/3 tác vụ/)).toBeVisible()
    await expect(page.getByText("gsk-...legacy", { exact: true })).toBeVisible()
    await expect(
      page.getByText(vi.aiTaskConfigurations.taskNames.NEWS_EVENT_EXTRACTION, {
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByText("deepseek-v4-flash", { exact: true })
    ).toHaveCount(3)
    await expect(page.getByLabel("Endpoint", { exact: true })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Add key" })).toHaveCount(0)
    await expect(
      page.getByRole("link", {
        name: vi.aiProviderConfigs.openTaskConfiguration,
      })
    ).toHaveAttribute("href", "/vi/ai-task-configurations")

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
      { method: "GET", path: "/ai-provider-configs/12" },
      {
        method: "GET",
        path: "/ai-provider-configs",
        query: "?page=0&size=10&sort=id%2Cdesc",
      },
      { method: "GET", path: "/ai-provider-configs/12" },
      { method: "GET", path: "/ai-provider-configs/12" },
    ])
  })

  test("matches the approved edit design at 1520x1600 and stays usable on mobile", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-provider-config:create",
      "ai-provider-config:update",
      "ai-provider-config:delete",
      "ai-task-configuration:read",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1600 })
    await page.goto("/en/ai-provider-configs/12")

    await expect(
      page.getByRole("heading", { name: en.aiProviderConfigs.editTitle })
    ).toBeVisible()
    await expect(page.getByText("Groq · Connection #12")).toBeVisible()
    await expect(
      page
        .getByRole("navigation", { name: en.navigation.breadcrumb })
        .getByText(en.common.edit)
    ).toBeVisible()
    await expect(page.getByLabel("Provider")).toHaveValue(
      "Groq · Fixed provider type"
    )
    await expect(page.getByLabel("Endpoint")).toBeVisible()
    await expect(page.getByLabel("Description")).toHaveValue(
      "Legacy connection retained after migration."
    )
    await expect(page.getByText("gsk-...legacy", { exact: true })).toBeVisible()
    await expect(
      page.getByLabel("Replacement key", { exact: true })
    ).toHaveValue("")
    await expect(page.getByLabel("New key", { exact: true })).toHaveValue("")
    await expect(
      page.getByText(en.aiProviderConfigs.newKeyDescription, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("deepseek-v4-flash", { exact: true })
    ).toHaveCount(3)
    await expect(
      page.getByRole("button", { name: en.aiProviderConfigs.deleteConnection })
    ).toBeDisabled()
    await expect(
      page.getByText("Default provider", { exact: true })
    ).toHaveCount(0)

    const screenshot = await page.screenshot({
      fullPage: false,
      style: "nextjs-portal { display: none !important; }",
    })
    await testInfo.attach("ai-connections-edit-en-1520x1600.png", {
      body: screenshot,
      contentType: "image/png",
    })

    await page.getByLabel("Endpoint").focus()
    await page.keyboard.press("Tab")
    await expect(page.getByLabel("Description")).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(
      page.getByLabel("Replacement key", { exact: true })
    ).toBeFocused()

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      axe.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])

    const endpoint = page.getByLabel(en.aiProviderConfigs.endpoint)
    const back = page.getByRole("link", { name: en.common.back })
    await endpoint.fill("https://draft.example.test/v1")
    await back.focus()
    await page.keyboard.press("Enter")

    const discardDialog = page.getByRole("alertdialog")
    await expect(
      discardDialog.getByRole("heading", {
        name: en.aiProviderConfigs.discardChangesTitle,
      })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(discardDialog).not.toBeVisible()
    await expect(back).toBeFocused()
    await expect(endpoint).toHaveValue("https://draft.example.test/v1")

    await page.keyboard.press("Enter")
    await page
      .getByRole("button", { name: en.aiProviderConfigs.discardChanges })
      .click()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs$/)

    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport)
      await page.context().addCookies([
        {
          name: "sidebar_state",
          value: viewport.width >= 1440 ? "true" : "false",
          url: "http://127.0.0.1:3100/",
        },
      ])
      await page.goto("/en/ai-provider-configs/12")
      await expect(page.getByLabel("Endpoint")).toBeEmpty()
      await expect(page.getByLabel("Replacement key")).toBeEmpty()
      await expect(page.getByLabel("New key")).toBeEmpty()
      if (viewport.width === 390) {
        const mobileBreadcrumb = page.getByRole("navigation", {
          name: en.navigation.breadcrumb,
        })
        await expect(
          mobileBreadcrumb.getByRole("link", {
            name: en.navigation.aiProviders,
            exact: true,
          })
        ).toBeVisible()
        await expect(
          mobileBreadcrumb.getByText(en.common.edit, { exact: true })
        ).toBeVisible()
        await expect(
          mobileBreadcrumb.getByRole("link", {
            name: en.navigation.overview,
            exact: true,
          })
        ).not.toBeVisible()
        await expect(
          page.getByText(en.aiProviderConfigs.newKeyDescriptionMobile, {
            exact: true,
          })
        ).toBeVisible()

        const mobileScreenshot = await page.screenshot({
          fullPage: true,
          style: "nextjs-portal { display: none !important; }",
        })
        await testInfo.attach("ai-connections-edit-en-mobile-390.png", {
          body: mobileScreenshot,
          contentType: "image/png",
        })
      }
      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
    }
  })

  test("retains edit drafts through breadcrumb, sidebar, and browser history navigation", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-provider-config:create",
      "ai-provider-config:update",
      "ai-task-configuration:read",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1600 })
    await page.goto("/en/ai-provider-configs/12")

    await page
      .getByLabel(en.aiProviderConfigs.endpoint)
      .fill("https://breadcrumb-draft.example.test/v1")
    await page
      .getByLabel(en.aiProviderConfigs.description)
      .fill("Draft retained across navigation")
    await page
      .getByLabel(en.aiProviderConfigs.replacementKey)
      .fill("replacement-draft")
    await page.getByLabel(en.aiProviderConfigs.newKey).fill("new-key-draft")

    await page
      .getByRole("navigation", { name: en.navigation.breadcrumb })
      .getByRole("link", { name: en.navigation.aiProviders })
      .click()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs$/)
    await page.getByRole("link", { name: "Groq #12" }).click()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs\/12$/)
    await expect(page.getByLabel(en.aiProviderConfigs.endpoint)).toHaveValue(
      "https://breadcrumb-draft.example.test/v1"
    )
    await expect(page.getByLabel(en.aiProviderConfigs.newKey)).toHaveValue(
      "new-key-draft"
    )

    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole("link", { name: en.navigation.overview, exact: true })
      .click()
    await expect(page).toHaveURL(/\/en\/dashboard$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs\/12$/)
    await expect(page.getByLabel(en.aiProviderConfigs.description)).toHaveValue(
      "Draft retained across navigation"
    )
    await expect(
      page.getByLabel(en.aiProviderConfigs.replacementKey)
    ).toHaveValue("replacement-draft")

    await page.goBack()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs$/)
    await page.goForward()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs\/12$/)
    await expect(page.getByLabel(en.aiProviderConfigs.endpoint)).toHaveValue(
      "https://breadcrumb-draft.example.test/v1"
    )
    await expect(page.getByLabel(en.aiProviderConfigs.description)).toHaveValue(
      "Draft retained across navigation"
    )
    await expect(
      page.getByLabel(en.aiProviderConfigs.replacementKey)
    ).toHaveValue("replacement-draft")
    await expect(page.getByLabel(en.aiProviderConfigs.newKey)).toHaveValue(
      "new-key-draft"
    )
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
