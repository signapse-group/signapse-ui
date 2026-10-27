import AxeBuilder from "@axe-core/playwright"

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi } from "@/app/lib/i18n/dictionaries/vi"

import { expect, test } from "./fixtures"

const TASKS = en.aiTaskConfigurations.taskNames
const GROUPS = en.aiTaskConfigurations.groups
const TASK_CONFIGURATION_READ = "ai-task-configuration:read"
const TASK_CONFIGURATION_UPDATE = "ai-task-configuration:update"
const PROVIDER_READ = "ai-provider-config:read"
const MODEL_CATALOG_READ = "ai-provider-config:model-catalog"
const PROMPT_READ = "system-prompt:read"

test.describe("AI task inline configuration", () => {
  test.setTimeout(150_000)

  test("renders the eleven grouped settings from server fetched fixture data", async ({
    fixture,
    page,
  }, testInfo) => {
    await fixture.setPermissions([
      TASK_CONFIGURATION_READ,
      TASK_CONFIGURATION_UPDATE,
      PROVIDER_READ,
      MODEL_CATALOG_READ,
      PROMPT_READ,
    ])
    await page.setViewportSize({ width: 1520, height: 2440 })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/en/ai-task-configurations", {
      waitUntil: "domcontentloaded",
    })

    await expect(
      page.getByRole("heading", { name: en.aiTaskConfigurations.pageTitle })
    ).toBeVisible()
    await expect(page.getByRole("form")).toHaveCount(11)
    await expect(
      page.getByText(
        en.aiTaskConfigurations.unconfiguredSummary.replace("{count}", "8"),
        { exact: true }
      )
    ).toBeVisible()
    for (const taskName of Object.values(TASKS)) {
      const taskRow = page.getByRole("form", { name: taskName })
      await expect(
        taskRow.getByRole("heading", { name: taskName, exact: true })
      ).toBeVisible()
    }
    for (const groupName of Object.values(GROUPS)) {
      await expect(
        page
          .getByRole("region", { name: groupName })
          .getByRole("heading", { name: groupName, exact: true, level: 2 })
      ).toBeVisible()
    }
    const groupTaskCounts = [2, 1, 4, 1, 2, 1]
    for (const [index, groupName] of Object.values(GROUPS).entries()) {
      await expect(
        page.getByRole("region", { name: groupName }).getByRole("form")
      ).toHaveCount(groupTaskCounts[index])
    }
    const normalizationRow = page.getByRole("form", {
      name: TASKS.NEWS_CONTENT_NORMALIZATION,
    })
    await expect(normalizationRow.getByRole("spinbutton")).toHaveValue("20000")
    await expect(
      normalizationRow.getByRole("combobox", {
        name: en.aiTaskConfigurations.model,
      })
    ).toContainText("deepseek-v4-flash")
    await expect(
      normalizationRow.getByRole("link", {
        name: en.aiTaskConfigurations.openPrompt,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: en.aiTaskConfigurations.save,
      })
    ).toHaveCount(11)
    await expect(
      page.getByRole("link", {
        name: en.aiTaskConfigurations.openPrompt,
      })
    ).toHaveCount(10)
    for (const promptLabel of ["Assessment", "Scalping", "Explanation"]) {
      await expect(page.getByRole("link", { name: promptLabel })).toBeVisible()
    }

    await expect(page.getByText("16,384", { exact: false })).toBeVisible()
    await expect(page.getByText("8,192", { exact: false })).toHaveCount(7)
    await expect(
      page.getByText("SDK / provider", { exact: false })
    ).toHaveCount(2)
    await expect(
      page.getByText("32,768 per request", { exact: false })
    ).toBeVisible()
    await expect(page.getByText(/unlimited/i)).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: /Calendar Alert/i })
    ).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: /News Alert/i })
    ).toHaveCount(0)
    await expect(
      page.locator('a[href*="FIRECRAWL_SOURCE_DOCUMENT_FILTER"]')
    ).toHaveCount(0)

    const requestState = await fixture.state()
    expect(
      requestState.requests.some(
        (request) =>
          request.method === "GET" &&
          request.path === "/ai-task-configurations" &&
          request.hasAuthHeader === false
      )
    ).toBe(true)

    await page.screenshot({
      path: testInfo.outputPath("ai-task-configurations-1520x2440.png"),
      fullPage: true,
    })
    const accessibility = await new AxeBuilder({ page })
      .include("main")
      .analyze()
    expect(accessibility.violations).toEqual([])
    await page.emulateMedia({ colorScheme: "light" })
    const lightAccessibility = await new AxeBuilder({ page })
      .include("main")
      .analyze()
    expect(lightAccessibility.violations).toEqual([])
    await page.emulateMedia({ colorScheme: "dark" })

    const connectionSelect = normalizationRow.getByRole("combobox", {
      name: en.aiTaskConfigurations.connection,
    })
    const modelSelect = normalizationRow.getByRole("combobox", {
      name: en.aiTaskConfigurations.model,
    })
    await connectionSelect.focus()
    await page.keyboard.press("Tab")
    await expect(modelSelect).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(modelSelect).toBeFocused()

    await page.setViewportSize({ width: 390, height: 844 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await expect(
      page.getByRole("heading", { name: TASKS.NEWS_CONTENT_NORMALIZATION })
    ).toBeVisible()
  })

  test("updates one task, keeps another task isolated, and preserves failed token input", async ({
    fixture,
    page,
  }) => {
    await fixture.setPermissions([
      TASK_CONFIGURATION_READ,
      TASK_CONFIGURATION_UPDATE,
      PROVIDER_READ,
      MODEL_CATALOG_READ,
    ])
    await page.goto("/en/ai-task-configurations")

    const questionRow = page.getByRole("form", {
      name: TASKS.MARKET_QUESTION_UNDERSTANDING,
    })
    const connectionSelect = questionRow.getByRole("combobox", {
      name: en.aiTaskConfigurations.connection,
    })
    await connectionSelect.click()
    await page.getByRole("option", { name: /DeepSeek · #14/ }).click()

    const modelSelect = questionRow.getByRole("combobox", {
      name: en.aiTaskConfigurations.model,
    })
    await questionRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(modelSelect).toBeFocused()
    await expect(modelSelect).toHaveAttribute("aria-invalid", "true")

    await modelSelect.click()
    const deepSeekModel = page.getByRole("option", {
      name: "deepseek-v4-pro",
    })
    await expect(deepSeekModel).toBeVisible()
    await deepSeekModel.click()
    await questionRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(questionRow.getByRole("status")).toContainText(
      en.aiTaskConfigurations.saveSuccess
    )

    await connectionSelect.click()
    await page.getByRole("option", { name: /OpenAI · #15/ }).click()
    await modelSelect.click()
    await page.getByRole("option", { name: "gpt-4.1-mini" }).click()
    await fixture.setScenario(
      "/ai-task-configurations/MARKET_QUESTION_UNDERSTANDING/selection",
      "mutation-failure",
      "PUT"
    )
    await questionRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(modelSelect).toBeFocused()
    await expect(modelSelect).toHaveAttribute("aria-invalid", "true")
    await expect(
      questionRow.locator(
        "#MARKET_QUESTION_UNDERSTANDING-model-selection-error"
      )
    ).toContainText(en.aiTaskConfigurations.selectionSaveError)

    let state = await fixture.state()
    expect(
      state.aiTaskConfigurations?.find(
        (configuration) =>
          configuration.task === "MARKET_QUESTION_UNDERSTANDING"
      )
    ).toMatchObject({
      selectedConnectionId: 14,
      selectedModel: "deepseek-v4-pro",
    })

    const deniedCatalogRow = page.getByRole("form", {
      name: TASKS.MARKET_CONVERSATION_RESPONSE,
    })
    await deniedCatalogRow
      .getByRole("combobox", { name: en.aiTaskConfigurations.connection })
      .click()
    await page.getByRole("option", { name: /DeepSeek · #14/ }).click()
    await fixture.setScenario(
      "/ai-provider-configs/14/model-catalog",
      "permission-denied",
      "GET"
    )
    await deniedCatalogRow
      .getByRole("combobox", { name: en.aiTaskConfigurations.model })
      .click()
    await expect(deniedCatalogRow.getByRole("alert")).toContainText(
      en.aiTaskConfigurations.modelCatalogError
    )
    await expect(deniedCatalogRow.getByRole("alert")).not.toContainText(
      "Fixture permission denied"
    )
    await page.keyboard.press("Escape")

    const tokenRow = page.getByRole("form", {
      name: TASKS.NEWS_EVENT_EXTRACTION,
    })
    const tokenInput = tokenRow.getByRole("spinbutton", {
      name: en.aiTaskConfigurations.outputTokenLimit,
    })
    await tokenInput.fill("0")
    await tokenRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(tokenInput).toBeFocused()
    await expect(tokenInput).toHaveAttribute("aria-invalid", "true")
    await expect(tokenRow.getByRole("alert")).toContainText(
      en.aiTaskConfigurations.tokenPositiveError
    )
    state = await fixture.state()
    expect(
      state.requests.some(
        (request) =>
          request.method === "PUT" &&
          request.path ===
            "/ai-task-configurations/NEWS_EVENT_EXTRACTION/output-token"
      )
    ).toBe(false)

    await tokenInput.fill("7000")
    await fixture.setScenario(
      "/ai-task-configurations/NEWS_EVENT_EXTRACTION/output-token",
      "delayed",
      "PUT"
    )
    await tokenRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(tokenRow).toHaveAttribute("aria-busy", "true")
    await expect(tokenInput).toHaveValue("7000")
    await expect(questionRow).toHaveAttribute("aria-busy", "false")

    await fixture.setScenario(
      "/ai-task-configurations/NEWS_EVENT_EXTRACTION/output-token",
      "success",
      "PUT"
    )
    await expect(tokenRow.getByRole("status")).toContainText(
      en.aiTaskConfigurations.saveSuccess
    )

    state = await fixture.state()
    const modelCatalogReadsBeforeTokenOnlySave = state.requests.filter(
      (request) =>
        request.method === "GET" &&
        request.path === "/ai-provider-configs/14/model-catalog"
    ).length
    const tokenWrites = state.requests.filter(
      (request) =>
        request.method === "PUT" &&
        request.path ===
          "/ai-task-configurations/NEWS_EVENT_EXTRACTION/output-token"
    )
    expect(tokenWrites.at(-1)?.body).toEqual({ maxOutputTokens: 7000 })

    await tokenInput.fill("")
    await tokenRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(tokenRow.getByRole("status")).toContainText(
      en.aiTaskConfigurations.saveSuccess
    )
    state = await fixture.state()
    expect(
      state.requests.filter(
        (request) =>
          request.method === "GET" &&
          request.path === "/ai-provider-configs/14/model-catalog"
      )
    ).toHaveLength(modelCatalogReadsBeforeTokenOnlySave)
    expect(
      state.requests
        .filter(
          (request) =>
            request.method === "PUT" &&
            request.path ===
              "/ai-task-configurations/NEWS_EVENT_EXTRACTION/output-token"
        )
        .at(-1)?.body
    ).toEqual({ maxOutputTokens: null })
    expect(
      state.aiTaskConfigurations?.find(
        (configuration) =>
          configuration.task === "MARKET_QUESTION_UNDERSTANDING"
      )
    ).toMatchObject({
      selectedConnectionId: 14,
      selectedModel: "deepseek-v4-pro",
      customOutputTokens: null,
    })
    expect(
      state.aiTaskConfigurations?.find(
        (configuration) => configuration.task === "NEWS_EVENT_EXTRACTION"
      )
    ).toMatchObject({ customOutputTokens: null, effectiveOutputTokens: 8192 })

    await fixture.setScenario(
      "/ai-task-configurations/NEWS_EVENT_EXTRACTION/output-token",
      "mutation-failure",
      "PUT"
    )
    await tokenInput.fill("9000")
    await tokenRow
      .getByRole("button", { name: en.aiTaskConfigurations.save })
      .click()
    await expect(tokenRow.getByRole("alert")).toContainText(
      en.aiTaskConfigurations.tokenSaveError
    )
    await expect(tokenInput).toHaveValue("9000")
    state = await fixture.state()
    expect(
      state.aiTaskConfigurations?.find(
        (configuration) => configuration.task === "NEWS_EVENT_EXTRACTION"
      )
    ).toMatchObject({ customOutputTokens: null, effectiveOutputTokens: 8192 })
  })

  test("gates prompt links separately and shows producer denial safely", async ({
    fixture,
    page,
  }) => {
    await fixture.setPermissions([TASK_CONFIGURATION_READ])
    await page.goto("/vi/ai-task-configurations")

    const economicCalendarRow = page.getByRole("form", {
      name: vi.aiTaskConfigurations.taskNames
        .ECONOMIC_CALENDAR_DESCRIPTION_TRANSLATION,
    })
    const normalizationRow = page.getByRole("form", {
      name: vi.aiTaskConfigurations.taskNames.NEWS_CONTENT_NORMALIZATION,
    })
    await expect(
      economicCalendarRow.locator("button[type=submit]")
    ).toHaveCount(0)
    await expect(
      economicCalendarRow.getByRole("link", {
        name: vi.aiTaskConfigurations.openPrompt,
      })
    ).toHaveCount(0)
    await expect(
      economicCalendarRow.getByRole("combobox", {
        name: vi.aiTaskConfigurations.connection,
      })
    ).toBeDisabled()
    await expect(
      normalizationRow.getByRole("combobox", {
        name: vi.aiTaskConfigurations.connection,
      })
    ).toContainText("DeepSeek")
    await expect(
      normalizationRow.getByRole("combobox", {
        name: vi.aiTaskConfigurations.model,
      })
    ).toContainText("deepseek-v4-flash")

    await fixture.setPermissions([TASK_CONFIGURATION_READ, PROMPT_READ])
    await fixture.setScenario(
      "/system-prompts/ECONOMIC_CALENDAR_ENTRY_TEXT_LOCALIZATION",
      "permission-denied",
      "GET"
    )
    await page.reload()
    const promptLink = economicCalendarRow.getByRole("link", {
      name: vi.aiTaskConfigurations.openPrompt,
    })
    await expect(promptLink).toBeVisible()
    await promptLink.click()
    await expect(page).toHaveURL(
      /\/vi\/system-prompts\/ECONOMIC_CALENDAR_ENTRY_TEXT_LOCALIZATION\/view$/,
      { timeout: 30_000 }
    )
    await expect(
      page.getByRole("heading", {
        name: vi.systemPrompts.viewErrorTitle,
      })
    ).toBeVisible()
    await expect(page.getByText(vi.systemPrompts.viewError)).toBeVisible()
    await expect(page.getByText("Fixture permission denied")).toHaveCount(0)
    await expect(page.getByRole("textbox")).toHaveCount(0)
  })

  test("requires catalog access for selection while keeping token updates available", async ({
    fixture,
    page,
  }) => {
    await fixture.setPermissions([
      TASK_CONFIGURATION_READ,
      TASK_CONFIGURATION_UPDATE,
      PROVIDER_READ,
    ])
    await page.goto("/en/ai-task-configurations")

    const normalizationRow = page.getByRole("form", {
      name: TASKS.NEWS_CONTENT_NORMALIZATION,
    })
    await expect(
      normalizationRow.getByRole("combobox", {
        name: en.aiTaskConfigurations.connection,
      })
    ).toBeDisabled()
    await expect(
      normalizationRow.getByRole("combobox", {
        name: en.aiTaskConfigurations.model,
      })
    ).toBeDisabled()
    await expect(
      normalizationRow.getByRole("spinbutton", {
        name: en.aiTaskConfigurations.outputTokenLimit,
      })
    ).toBeEnabled()

    await fixture.setPermissions([
      TASK_CONFIGURATION_READ,
      TASK_CONFIGURATION_UPDATE,
      MODEL_CATALOG_READ,
    ])
    await page.reload()
    await expect(
      normalizationRow.getByRole("combobox", {
        name: en.aiTaskConfigurations.connection,
      })
    ).toBeDisabled()
    await expect(
      normalizationRow.getByRole("combobox", {
        name: en.aiTaskConfigurations.model,
      })
    ).toBeEnabled()
  })
})
