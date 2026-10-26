import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "./fixtures"

import { vi } from "../../app/lib/i18n/dictionaries/vi"

test.describe("P0 AI connections", () => {
  test("renders the approved list and opens read-only legacy detail", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/ai-provider-configs")

    await expect(
      page.getByRole("columnheader", { name: "Kết nối", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Endpoint", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "API key", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Được dùng bởi", exact: true })
    ).toBeVisible()
    await expect(page.getByText("gsk-...legacy", { exact: true })).toBeVisible()
    await expect(page.getByText("1 API key", { exact: true })).toBeVisible()
    await expect(
      page.getByText("Endpoint mặc định của Groq", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("API chưa cung cấp", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(vi.pagination.pageSize, { exact: true })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Thêm kết nối" })).toHaveCount(
      0
    )
    await expect(page.getByText("Mặc định", { exact: true })).toHaveCount(0)
    await expect(page.getByText("Model", { exact: true })).toHaveCount(0)

    const listScreenshot = await page.screenshot({ fullPage: false })
    await testInfo.attach("ai-connections-list-vi-1520x1024.png", {
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

    await page.getByRole("link", { name: "Groq Kết nối #12" }).click()
    await expect(page.getByRole("heading", { name: "Groq" })).toBeVisible()
    await expect(page.getByText("0 tác vụ", { exact: true })).toBeVisible()
    await expect(page.getByText("gsk-...legacy", { exact: true })).toBeVisible()
    await expect(page.getByText("Mô hình", { exact: true })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /sửa|xóa/i })).toHaveCount(0)
    await expect(
      page.getByText(vi.aiProviderConfigs.modelsBelongToTasksTitle, {
        exact: true,
      })
    ).toBeVisible()

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
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/en/ai-provider-configs/create")

    await expect(
      page.getByRole("heading", { name: "Create AI connection" })
    ).toBeVisible()
    await expect(page.getByLabel("Provider")).toBeVisible()
    await expect(page.getByLabel("Endpoint")).toBeVisible()
    await expect(page.getByLabel("Description")).toBeVisible()
    await expect(page.getByLabel("Key 1")).toBeVisible()
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
    await expect(page.getByLabel("Key 2")).toBeVisible()
    const removeSecondKey = page.getByRole("button", {
      name: "Remove API key 2",
    })
    await removeSecondKey.focus()
    await page.keyboard.press("Space")
    await expect(page.getByLabel("Key 2")).toHaveCount(0)

    const createScreenshot = await page.screenshot({ fullPage: false })
    await testInfo.attach("ai-connections-create-en-1520x1024.png", {
      body: createScreenshot,
      contentType: "image/png",
    })

    await page.getByLabel("Key 1").fill("fixture-secret-key")
    await page.getByLabel("Endpoint").fill("https://api.example.test/v1")
    await page.getByLabel("Description").fill("Fixture connection")
    await fixture.setScenario(
      "/ai-provider-configs",
      "validation-error",
      "POST"
    )
    await page.getByRole("button", { name: "Create connection" }).click()
    await expect(page.getByRole("alert")).toContainText(
      "Fixture validation failed"
    )
    await expect(page.getByLabel("Key 1")).toHaveValue("fixture-secret-key")
    await expect(page).toHaveURL(/\/en\/ai-provider-configs\/create$/)

    await fixture.setScenario("/ai-provider-configs", "success", "POST")
    await page.getByRole("button", { name: "Create connection" }).click()
    await expect(page).toHaveURL(/\/en\/ai-provider-configs$/)
    await expect(page.getByText("key-...-key", { exact: true })).toBeVisible()

    const state = await fixture.state()
    const requests = state.requests.filter(
      (request) => request.path === "/ai-provider-configs"
    )
    expect(requests.map((request) => request.method)).toEqual([
      "POST",
      "POST",
      "GET",
    ])
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
    await expect(page.getByLabel("Key 1")).toHaveCount(0)
  })

  test("keeps the connection list inside a mobile viewport", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/en/ai-provider-configs")

    const dimensions = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
    const table = page.locator("[data-slot='table-container']")
    const scrollDimensions = await table.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
    expect(scrollDimensions.scrollWidth).toBeGreaterThan(
      scrollDimensions.clientWidth
    )
  })
})
