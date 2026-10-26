import { expect, test } from "./fixtures"
import { en } from "../../app/lib/i18n/dictionaries/en"
import { vi } from "../../app/lib/i18n/dictionaries/vi"

test.describe("P0 system prompt catalog and content hotfix", () => {
  test("lists the producer catalog and searches locally", async ({
    fixture,
    page,
  }, testInfo) => {
    await fixture.setPermissions(["*"])
    await page.setViewportSize({ width: 1520, height: 1340 })
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))

    const response = await page.goto("/en/system-prompts")
    expect(response?.status()).toBe(200)
    await expect(page.locator('p[role="status"]')).toHaveText(
      "13 supported prompts"
    )
    await expect(page.locator("tbody tr")).toHaveCount(13)
    await expect(
      page.getByRole("row").filter({ hasText: "Telegram" })
    ).toHaveCount(3)

    await testInfo.attach("system-prompt-list-1520x1340", {
      body: await page.screenshot(),
      contentType: "image/png",
    })

    const search = page.getByRole("searchbox")
    await search.fill("TELEGRAM_MARKET_ANALYSIS_SCALPING")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(
      page.getByText("Telegram · Scalping", { exact: true })
    ).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    const overflowDetails = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      overflowingElements: Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return rect.right > window.innerWidth + 1 || rect.left < -1
            ? {
                tag: element.tagName,
                id: element.id,
                className: element.className,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              }
            : null
        })
        .filter((element) => element !== null)
        .slice(0, 10),
    }))
    expect(
      overflowDetails.documentWidth,
      JSON.stringify(overflowDetails)
    ).toBeLessThanOrEqual(overflowDetails.viewportWidth)

    const state = await fixture.state()
    const listRequest = state.requests.find(
      (request) =>
        request.method === "GET" && request.path === "/system-prompts"
    )
    expect(listRequest).toBeDefined()
    const query = new URLSearchParams(String(listRequest?.query ?? ""))
    expect(query.get("page")).toBe("0")
    expect(query.get("size")).toBe("100")
    expect(query.has("sort")).toBe(false)
    expect(query.has("$filter")).toBe(false)
  })

  test("reads and saves content only after the backend confirms the update", async ({
    fixture,
    page,
  }, testInfo) => {
    await fixture.setPermissions(["*"])
    await page.setViewportSize({ width: 1520, height: 1600 })
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))

    const response = await page.goto(
      "/en/system-prompts/MARKET_QUESTION_UNDERSTANDING"
    )
    expect(response?.status()).toBe(200)
    const breadcrumb = page.getByRole("navigation", {
      name: en.navigation.breadcrumb,
    })
    await expect(breadcrumb).toContainText(en.navigation.systemPrompts)
    await expect(breadcrumb).not.toContainText("Details")
    await expect(
      page.getByText(en.systemPrompts.requiredPlaceholders, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(en.systemPrompts.editorWarningTitle, { exact: true })
    ).toBeVisible()
    for (const variable of [
      "locale",
      "asOfTime",
      "rawQuestion",
      "watchlistAssetCandidates",
      "deterministicAssetMatches",
      "deterministicThemeMatches",
      "previousConversationHints",
    ]) {
      await expect(
        page.getByText(`{${variable}}`, { exact: true })
      ).toBeVisible()
    }

    await testInfo.attach("system-prompt-editor-1520x1600", {
      body: await page.screenshot(),
      contentType: "image/png",
    })

    const content = page.getByRole("textbox", {
      name: new RegExp(`^${en.systemPrompts.content}`),
    })
    const rejectedContent = "Reworded content with no required placeholders."
    await content.fill(rejectedContent)
    await page
      .getByRole("button", { name: en.systemPrompts.saveHotfix })
      .click()
    const missingPlaceholders =
      "Missing required prompt placeholders: {locale}, {asOfTime}, {rawQuestion}, {watchlistAssetCandidates}, {deterministicAssetMatches}, {deterministicThemeMatches}, {previousConversationHints}"
    await expect(page.locator("#prompt-content-error")).toHaveText(
      missingPlaceholders
    )
    await expect(content).toHaveValue(rejectedContent)

    const editedContent =
      "Reworded fixture prompt while retaining {locale}, {asOfTime}, {rawQuestion}, {watchlistAssetCandidates}, {deterministicAssetMatches}, {deterministicThemeMatches}, and {previousConversationHints}."
    await content.fill(editedContent)
    await content.press("Tab")
    await expect(
      page.getByRole("button", { name: en.systemPrompts.cancel, exact: true })
    ).toBeFocused()
    await page.keyboard.press("Tab")
    const save = page.getByRole("button", {
      name: en.systemPrompts.saveHotfix,
    })
    await expect(save).toBeFocused()
    await page.keyboard.press("Enter")

    await expect(page).toHaveURL(/\/en\/system-prompts$/)
    await expect(page.getByText(en.systemPrompts.updateSuccess)).toBeVisible()

    const state = await fixture.state()
    const updateRequest = state.requests.find(
      (request) =>
        request.method === "PUT" &&
        request.path === "/system-prompts/MARKET_QUESTION_UNDERSTANDING"
    )
    expect(updateRequest?.bodyKeys).toEqual(["content"])
  })

  test("shows the catalog to readers and protects the editor from read-only access", async ({
    fixture,
    page,
  }) => {
    await fixture.setPermissions(["system-prompt:read"])
    await page.goto("/vi/system-prompts")

    await expect(page.locator('p[role="status"]')).toHaveText(
      "13 prompt được hỗ trợ"
    )
    await expect(
      page.getByRole("link", { name: vi.systemPrompts.editContent }).first()
    ).toHaveCount(0)

    await page.goto("/vi/system-prompts/MARKET_QUESTION_UNDERSTANDING")
    await expect(
      page.getByText(vi.systemPrompts.updateDenied, { exact: false })
    ).toBeVisible()
  })
})
