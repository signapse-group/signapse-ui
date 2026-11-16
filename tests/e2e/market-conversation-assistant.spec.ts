import { expect, test } from "./fixtures"
import type { Page } from "@playwright/test"

const launcherName = "Ask Signapse"
const notice = "AI can make mistakes. Please verify important information."
const sourceUrl = "https://example.com/reports/btc-fixture"

function launcher(page: Page) {
  return page.getByRole("button", { name: launcherName, exact: true })
}

function assistantDialog(page: Page) {
  return page
    .getByRole("dialog")
    .filter({ has: page.getByRole("textbox", { name: "Tin nhắn" }) })
}

function assistantMessages(page: Page) {
  return assistantDialog(page).getByRole("region", { name: "Tin nhắn" })
}

async function openAssistant(page: Page) {
  await launcher(page).click()
  await expect(
    page.getByRole("textbox", { name: "Tin nhắn", exact: true })
  ).toBeVisible()
}

async function submitQuestion(page: Page, question: string) {
  const composer = page.getByRole("textbox", {
    name: "Tin nhắn",
    exact: true,
  })
  await composer.fill(question)
  await composer.press("Enter")
  return composer
}

async function waitForCompletedTurn(page: Page, question: string) {
  await expect(
    assistantMessages(page).getByText(question, { exact: true })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "Market source" })).toBeVisible()
  await expect(page.getByText("Which asset did you mean?")).toBeVisible()
  await expect(page.getByText("The available data is limited.")).toBeVisible()
  await expect(
    page.getByText("Add TSLA to your watchlist before continuing.")
  ).toBeVisible()
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`keeps the approved launcher pill while the assistant module loads in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.emulateMedia({ colorScheme })
    await page.route("**/_next/static/chunks/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      await route.continue()
    })
    await page.goto("/vi/dashboard", { waitUntil: "commit" })

    const loadingLauncher = page.getByRole("button", {
      name: "Đang tải trợ lý AI",
      exact: true,
    })
    await expect(loadingLauncher).toBeVisible()
    await expect(loadingLauncher).toHaveText(launcherName)
    if (colorScheme === "light") {
      expect(await loadingLauncher.boundingBox()).toEqual({
        x: 1336,
        y: 960,
        width: 168,
        height: 48,
      })
    }
    await page.screenshot({
      path: `test-results/market-assistant-loading-${colorScheme}-1520x1024.png`,
    })
  })
}

test("creates and submits a sourced first turn, and blocks blank questions", async ({
  page,
  fixture,
}) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/dashboard")
  await openAssistant(page)

  const composer = page.getByRole("textbox", {
    name: "Tin nhắn",
    exact: true,
  })
  const send = page.getByRole("button", { name: "Gửi", exact: true })
  await composer.fill("  \t ")
  await expect(send).toBeDisabled()
  await composer.press("Enter")
  await expect
    .poll(async () => {
      const state = await fixture.state()
      return state.requests.filter(
        (request) =>
          request.method === "POST" &&
          String(request.path).startsWith("/market-conversations")
      ).length
    })
    .toBe(0)

  const question = "What explains the latest BTC move?"
  await submitQuestion(page, question)
  await waitForCompletedTurn(page, question)
  await expect(
    page.getByRole("link", { name: "Market source" })
  ).toHaveAttribute("href", sourceUrl)
  await expect(
    assistantMessages(page).getByText(question, { exact: true })
  ).toHaveCount(1)

  const state = await fixture.state()
  expect(state.marketConversations).toHaveLength(1)
  expect(state.marketConversations?.[0]).toMatchObject({
    title: question,
    workspaceId: 1,
  })
  expect(state.marketConversationTurns).toHaveLength(1)
  expect(state.marketConversationAttempts).toHaveLength(1)
  expect(
    state.requests
      .filter((request) => request.method === "POST")
      .map((request) => request.path)
      .filter((path) => String(path).startsWith("/market-conversations"))
  ).toEqual(["/market-conversations", "/market-conversations/1/messages"])
  await expect(
    assistantDialog(page).getByText(notice, { exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: "test-results/market-assistant-success-1520x1024.png",
  })

  await page.keyboard.press("Escape")
  await expect(assistantDialog(page)).toBeHidden()
})

test("retries a lost accepted request with the same key and uses a new key for the next turn", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario("*", "drop-after-accepted")
  await page.goto("/vi/dashboard")
  await openAssistant(page)

  const firstQuestion = "Was the BTC move supported by sources?"
  const composer = await submitQuestion(page, firstQuestion)
  await expect(assistantDialog(page).getByRole("alert")).toBeVisible()
  await expect(composer).toHaveValue(firstQuestion)

  await composer.press("Enter")
  await waitForCompletedTurn(page, firstQuestion)
  await expect(
    assistantMessages(page).getByText(firstQuestion, { exact: true })
  ).toHaveCount(1)
  await expect(page.getByRole("link", { name: "Market source" })).toHaveCount(1)

  const secondQuestion = "What should I watch next?"
  await submitQuestion(page, secondQuestion)
  await waitForCompletedTurn(page, secondQuestion)
  await expect(
    assistantMessages(page).getByText(firstQuestion, { exact: true })
  ).toHaveCount(1)
  await expect(
    assistantMessages(page).getByText(secondQuestion, { exact: true })
  ).toHaveCount(1)
  await expect(page.getByRole("link", { name: "Market source" })).toHaveCount(2)

  const state = await fixture.state()
  const attempts = state.marketConversationAttempts ?? []
  expect(state.marketConversationTurns).toHaveLength(2)
  expect(attempts).toHaveLength(3)
  expect(attempts[0]?.idempotencyKey).toBe(attempts[1]?.idempotencyKey)
  expect(attempts[1]?.replay).toBe(true)
  expect(attempts[2]?.idempotencyKey).not.toBe(attempts[1]?.idempotencyKey)
})

test("renders an assistant FAILED result as a failure", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario(
    "/market-conversations/1/messages",
    "assistant-failed",
    "POST"
  )
  await page.goto("/vi/dashboard")
  await openAssistant(page)
  const question = "Summarize the BTC movement"
  await submitQuestion(page, question)

  await expect(
    assistantMessages(page).getByText(question, { exact: true })
  ).toBeVisible()
  await expect(assistantDialog(page).getByRole("alert")).toContainText(
    "Fixture assistant failure"
  )
  await expect(page.getByRole("link", { name: "Market source" })).toHaveCount(0)
  expect((await fixture.state()).marketConversationTurns).toHaveLength(1)
})

test("shows create, send, permission, and quota failures without a completed answer", async ({
  page,
  fixture,
}) => {
  await fixture.setScenario("/market-conversations", "outage", "POST")
  await page.goto("/vi/dashboard")
  await openAssistant(page)
  const createFailure = "Create failure question"
  const composer = await submitQuestion(page, createFailure)
  await expect(assistantDialog(page).getByRole("alert")).toBeVisible()
  await expect(composer).toHaveValue(createFailure)
  expect((await fixture.state()).marketConversations).toHaveLength(0)

  await fixture.setScenario("/market-conversations", "success", "POST")
  const sendFailure = "Send failure question"
  await fixture.setScenario(
    "/market-conversations/1/messages",
    "outage",
    "POST"
  )
  await composer.fill(sendFailure)
  await composer.press("Enter")
  await expect(assistantDialog(page).getByRole("alert")).toContainText(
    "backend is unavailable"
  )
  await expect(composer).toHaveValue(sendFailure)
  await expect(
    assistantMessages(page).getByText(sendFailure, { exact: true })
  ).not.toBeVisible()
  const afterSendFailure = await fixture.state()
  expect(afterSendFailure.marketConversations).toHaveLength(1)
  expect(afterSendFailure.marketConversationTurns).toHaveLength(0)

  await fixture.setScenario(
    "/market-conversations/1/messages",
    "success",
    "POST"
  )
  await fixture.setPermissions([])
  await composer.fill("Permission denied question")
  await composer.press("Enter")
  await expect(assistantDialog(page).getByRole("alert")).toContainText(
    "Market conversation permission denied"
  )
  await expect(
    assistantMessages(page).getByText("Permission denied question", {
      exact: true,
    })
  ).not.toBeVisible()
  expect((await fixture.state()).marketConversations).toHaveLength(1)

  await fixture.setPermissions(["query:execute"])
  await composer.fill("Quota exceeded question")
  await fixture.setScenario(
    "/market-conversations/1/messages",
    "quota-exceeded",
    "POST"
  )
  await composer.press("Enter")
  await expect(assistantDialog(page).getByRole("alert")).toContainText(
    "monthly AI turn allowance"
  )
  await expect(
    assistantMessages(page).getByText("Quota exceeded question", {
      exact: true,
    })
  ).not.toBeVisible()
  expect((await fixture.state()).marketConversationTurns).toHaveLength(0)
})

test("hides the launcher when the app permission is absent", async ({
  page,
  fixture,
}) => {
  await fixture.setPermissions([])
  await page.goto("/vi/dashboard")
  await expect(launcher(page)).toHaveCount(0)
})

test("drops stale pending output after the user changes workspace", async ({
  page,
  fixture,
}) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.goto("/vi/dashboard")
  await openAssistant(page)
  await submitQuestion(page, "Initial Alpha question")
  await waitForCompletedTurn(page, "Initial Alpha question")

  await fixture.setScenario(
    "/market-conversations/1/messages",
    "delayed-old-workspace",
    "POST"
  )
  await submitQuestion(page, "Old workspace pending question")
  await expect(
    assistantDialog(page).getByText("Đang suy nghĩ...")
  ).toBeVisible()
  await expect.poll(async () => (await fixture.state()).pendingRequests).toBe(1)

  await page.locator("#workspace-switcher-trigger").click()
  await page.getByRole("menuitem", { name: /Workspace Beta/ }).click()
  await expect(
    page.locator("#workspace-switcher-trigger").getByRole("status")
  ).toBeVisible()
  await fixture.setScenario(
    "/market-conversations/1/messages",
    "success",
    "POST"
  )
  await expect.poll(async () => (await fixture.state()).pendingRequests).toBe(0)
  await expect(page.locator("#workspace-switcher-trigger")).toContainText(
    "Workspace Beta"
  )

  await openAssistant(page)
  await expect(
    assistantMessages(page).getByText("Old workspace pending question", {
      exact: true,
    })
  ).toHaveCount(0)
  const state = await fixture.state()
  expect(state.marketConversationTurns).toHaveLength(2)
  expect(state.marketConversationTurns?.[1]).toMatchObject({ workspaceId: 1 })
})

test("matches the approved launcher and compact, Full mode, sidebar, and mobile layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1520, height: 1024 })
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/vi/dashboard")

  const askButton = launcher(page)
  await expect(askButton).toBeVisible()
  const launcherBounds = await askButton.boundingBox()
  expect(launcherBounds).not.toBeNull()
  expect(launcherBounds?.width).toBe(168)
  expect(launcherBounds?.height).toBe(48)
  expect(1520 - launcherBounds!.x - launcherBounds!.width).toBe(16)
  expect(1024 - launcherBounds!.y - launcherBounds!.height).toBe(16)

  await page.evaluate(() => {
    document.body.style.minHeight = "200vh"
    window.scrollTo(0, 500)
  })
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0)
  const scrolledLauncherBounds = await askButton.boundingBox()
  expect(scrolledLauncherBounds?.x).toBe(launcherBounds?.x)
  expect(scrolledLauncherBounds?.y).toBe(launcherBounds?.y)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

  await askButton.focus()
  await page.keyboard.press("Enter")
  const dialog = assistantDialog(page)
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(notice, { exact: true })).toBeVisible()
  await page.screenshot({
    path: "test-results/market-assistant-compact-1520x1024.png",
  })

  await dialog.getByRole("button", { name: "Mở rộng cửa sổ hội thoại" }).click()
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return Math.round(bounds?.width ?? 0)
    })
    .toBe(1232)
  const fullBounds = await dialog.boundingBox()
  expect(fullBounds).not.toBeNull()
  expect(fullBounds?.x).toBe(272)
  expect(fullBounds?.y).toBe(64)
  expect(fullBounds?.width).toBe(1232)
  expect(fullBounds?.height).toBe(944)
  await expect(dialog.getByText(notice, { exact: true })).toBeVisible()
  await page.screenshot({
    path: "test-results/market-assistant-full-1520x1024.png",
  })

  await page
    .getByRole("button", { name: "Thu gọn/mở rộng thanh điều hướng" })
    .click()
  await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute(
    "data-state",
    "collapsed"
  )
  await expect(dialog).toBeHidden()
  await openAssistant(page)
  const expandButton = dialog.getByRole("button", {
    name: "Mở rộng cửa sổ hội thoại",
  })
  if (await expandButton.isVisible()) {
    await expandButton.click()
  }
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Thu gọn cửa sổ hội thoại" })
  ).toBeVisible()
  await expect.poll(async () => (await dialog.boundingBox())?.x).toBe(64)
  await page.screenshot({
    path: "test-results/market-assistant-full-sidebar-collapsed-1520x1024.png",
  })

  await dialog.getByRole("button", { name: "Thu gọn cửa sổ hội thoại" }).click()
  await expect(dialog.getByText(notice, { exact: true })).toBeVisible()
  const composerBounds = await dialog
    .getByRole("textbox", { name: "Tin nhắn", exact: true })
    .boundingBox()
  const noticeBounds = await dialog
    .getByText(notice, { exact: true })
    .boundingBox()
  expect(composerBounds).not.toBeNull()
  expect(noticeBounds).not.toBeNull()
  expect(noticeBounds!.y).toBeGreaterThanOrEqual(
    composerBounds!.y + composerBounds!.height
  )

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(dialog.getByText(notice, { exact: true })).toBeVisible()
  const mobileComposerBounds = await dialog
    .getByRole("textbox", { name: "Tin nhắn", exact: true })
    .boundingBox()
  const mobileNoticeBounds = await dialog
    .getByText(notice, { exact: true })
    .boundingBox()
  expect(mobileComposerBounds).not.toBeNull()
  expect(mobileNoticeBounds).not.toBeNull()
  expect(mobileNoticeBounds!.y).toBeGreaterThanOrEqual(
    mobileComposerBounds!.y + mobileComposerBounds!.height
  )
  await page.screenshot({
    path: "test-results/market-assistant-mobile-390x844.png",
  })
})
