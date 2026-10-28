import { clerk } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"

import { en } from "../../app/lib/i18n/dictionaries/en"
import { systemPromptListResponseSchema } from "../../app/lib/system-prompts/definitions"

test("system prompt hotfixes read the live catalog and preserve seed variables", async ({
  page,
}) => {
  await page.goto("/en/sign-in")
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

  const token = await page.evaluate(() =>
    window.Clerk.session!.getToken({ template: "signapse" })
  )
  expect(Boolean(token)).toBe(true)
  if (!token) throw new Error("The signed-in session has no signapse JWT")

  const directList = await page.request.get(
    `${process.env.API_BASE_URL}/system-prompts?page=0&size=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (directList.status() === 403) {
    throw new Error(
      "The configured integration account lacks system-prompt:read permission."
    )
  }
  expect(directList.status()).toBe(200)
  const parsedList = systemPromptListResponseSchema.parse(
    await directList.json()
  )
  expect(parsedList.content).toHaveLength(13)
  expect(
    parsedList.content.filter((prompt) =>
      prompt.promptType.startsWith("TELEGRAM_")
    )
  ).toHaveLength(3)
  const assistantPrompt = parsedList.content.find(
    (prompt) => prompt.promptType === "MARKET_QUESTION_UNDERSTANDING"
  )
  const requiredVariables = assistantPrompt?.requiredVariables ?? []
  expect(assistantPrompt?.requiredVariables).toEqual([
    "locale",
    "asOfTime",
    "rawQuestion",
    "watchlistAssetCandidates",
    "deterministicAssetMatches",
    "deterministicThemeMatches",
    "previousConversationHints",
  ])
  expect(
    parsedList.content
      .filter((prompt) => prompt.promptType !== "MARKET_QUESTION_UNDERSTANDING")
      .every((prompt) => prompt.requiredVariables.length === 0)
  ).toBe(true)

  const listResponse = await page.goto("/en/system-prompts")
  expect(listResponse?.status()).toBe(200)
  const count = page.locator('p[role="status"]')
  if (!(await count.count())) {
    const pageText = (await page.locator("main").innerText())
      .replace(/\s+/g, " ")
      .trim()
    throw new Error(`The FE catalog did not load: ${pageText}`)
  }
  await expect(count).toHaveText("13 supported prompts")
  await expect(page.locator("tbody tr")).toHaveCount(13)
  await expect(
    page.getByRole("row").filter({ hasText: "Telegram" })
  ).toHaveCount(3)

  const editorResponse = await page.goto(
    "/en/system-prompts/MARKET_QUESTION_UNDERSTANDING"
  )
  expect(editorResponse?.status()).toBe(200)
  const placeholderLabels = await page
    .locator('section[aria-labelledby="required-placeholders-title"] li')
    .allTextContents()
  expect(placeholderLabels).toEqual(
    requiredVariables.map((variable) => `{${variable}}`)
  )
  const content = page.getByRole("textbox", { name: /^Prompt content/ })
  await expect(content).toBeVisible()

  let serverActionRequests = 0
  await page.route("**/*", async (route) => {
    const request = route.request()
    if (request.method() === "POST" && request.headers()["next-action"]) {
      serverActionRequests += 1
      await route.abort()
      return
    }
    await route.continue()
  })

  const rejectedContent = "Live FE validation check with no seed variables."
  await content.fill(rejectedContent)
  await page.getByRole("button", { name: "Save hotfix" }).click()

  const error = page.locator("#prompt-content-error")
  await expect(error).toBeVisible()
  await expect(error).toHaveText(
    en.systemPrompts.missingPlaceholders.replace(
      "{variables}",
      requiredVariables.map((variable) => `{${variable}}`).join(", ")
    )
  )
  await expect(content).toHaveValue(rejectedContent)
  await expect(page).toHaveURL(
    /\/en\/system-prompts\/MARKET_QUESTION_UNDERSTANDING$/
  )
  expect(serverActionRequests).toBe(0)
})

test.afterEach(async ({ page }) => {
  const hasSession = await page
    .evaluate(() => Boolean(window.Clerk?.session))
    .catch(() => false)
  if (hasSession) {
    await clerk.signOut({ page })
  }
})
