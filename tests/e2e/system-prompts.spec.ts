import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "./fixtures"
import { en } from "../../app/lib/i18n/dictionaries/en"
import { vi } from "../../app/lib/i18n/dictionaries/vi"

test.describe("P0 system prompt catalog and content hotfix", () => {
  test("paginates the producer catalog and searches across the full list", async ({
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
    await expect(page.locator("tbody tr")).toHaveCount(10)
    const paginationFooter = page.locator('[data-slot="app-pagination-footer"]')
    await expect(paginationFooter).toContainText("Showing 1-10 of 13 results")
    await expect(
      page
        .getByRole("combobox", { name: en.pagination.pageSize })
        .locator('[data-slot="select-value"]')
    ).toHaveText("10")

    const spacing = await paginationFooter.evaluate((footer) => {
      const selector = footer.querySelector<HTMLElement>(
        '[data-slot="select-trigger"]'
      )
      const sizeGroup = selector?.parentElement
      const navigationContent = footer.querySelector<HTMLElement>(
        '[data-slot="pagination-content"]'
      )
      const navigationControls = Array.from(
        navigationContent?.querySelectorAll<HTMLElement>(
          'button, [data-slot="pagination-link"]'
        ) ?? []
      )
      const icon = navigationControls[0]?.querySelector<SVGSVGElement>("svg")

      if (!selector || !sizeGroup || !navigationContent || !icon) {
        throw new Error("Pagination footer elements are missing")
      }

      const dimensions = (element: HTMLElement | SVGSVGElement) => {
        const { width, height } = element.getBoundingClientRect()
        return [Math.round(width), Math.round(height)]
      }

      return {
        footerPadding: [
          getComputedStyle(footer).paddingTop,
          getComputedStyle(footer).paddingRight,
          getComputedStyle(footer).paddingBottom,
          getComputedStyle(footer).paddingLeft,
        ],
        selectorPadding: [
          getComputedStyle(selector).paddingLeft,
          getComputedStyle(selector).paddingRight,
        ],
        labelSelectorGap: getComputedStyle(sizeGroup).gap,
        navigationGap: getComputedStyle(navigationContent).gap,
        selectorSize: dimensions(selector),
        navigationControlSize: dimensions(navigationControls[0]),
        iconSize: dimensions(icon),
        navigationControlGaps: navigationControls
          .slice(1)
          .map((control, index) => {
            const previous = navigationControls[index].getBoundingClientRect()
            return Math.round(
              control.getBoundingClientRect().left - previous.right
            )
          }),
      }
    })
    expect(spacing).toEqual({
      footerPadding: ["12px", "16px", "12px", "16px"],
      selectorPadding: ["8px", "8px"],
      labelSelectorGap: "8px",
      navigationGap: "4px",
      selectorSize: [64, 32],
      navigationControlSize: [32, 32],
      iconSize: [16, 16],
      navigationControlGaps: [4, 4, 4],
    })
    const listAccessibility = await new AxeBuilder({ page })
      .include("main")
      .analyze()
    expect(listAccessibility.violations).toEqual([])

    await testInfo.attach("system-prompts-pagination-footer-1520x1340", {
      body: await paginationFooter.screenshot(),
      contentType: "image/png",
    })
    await testInfo.attach("system-prompt-list-1520x1340", {
      body: await page.screenshot(),
      contentType: "image/png",
    })

    for (const viewport of [
      { width: 360, height: 844 },
      { width: 1024, height: 768 },
      { width: 1439, height: 1024 },
      { width: 1440, height: 1024 },
      { width: 760, height: 672 },
    ]) {
      await page.setViewportSize(viewport)
      const documentWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      )
      expect(
        documentWidth,
        `No page overflow at ${viewport.width}px CSS width`
      ).toBeLessThanOrEqual(viewport.width)
    }
    await page.setViewportSize({ width: 1520, height: 1340 })

    const nextPage = page.getByRole("button", {
      name: en.pagination.goToNext,
    })
    await nextPage.focus()
    await expect(nextPage).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator("tbody tr")).toHaveCount(3)
    await expect(
      page.getByRole("row").filter({ hasText: "Telegram" })
    ).toHaveCount(3)
    await expect(
      page.locator('[data-slot="app-pagination-footer"]')
    ).toContainText("Showing 11-13 of 13 results")
    await testInfo.attach("system-prompt-list-page-2-1520x1340", {
      body: await page.screenshot(),
      contentType: "image/png",
    })

    const search = page.getByRole("searchbox")
    await search.fill("NEWS_ARTICLE_CONTENT_LOCALIZATION")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page).toHaveURL(/search=NEWS_ARTICLE_CONTENT_LOCALIZATION/)
    await expect(page).toHaveURL(/page=1/)
    await expect(
      page.getByText("News content normalization", { exact: true })
    ).toBeVisible()
    await page.reload()
    await expect(search).toHaveValue("NEWS_ARTICLE_CONTENT_LOCALIZATION")
    await expect(page.locator("tbody tr")).toHaveCount(1)
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

    await page.getByRole("button", { name: en.theme.toggle }).click()
    await page.getByRole("menuitem", { name: en.theme.light }).click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
    await page.getByRole("searchbox").fill("")
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(page.locator('p[role="status"]')).toHaveText(
      "13 supported prompts"
    )
    await page.setViewportSize({ width: 1520, height: 1340 })
    await expect(
      page.locator('[data-slot="app-pagination-footer"]')
    ).toContainText("Showing 1-10 of 13 results")
    await testInfo.attach("system-prompt-list-light-1520x1340", {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })

  test("restores pagination from history and normalizes deep-link queries", async ({
    fixture,
    page,
  }, testInfo) => {
    await fixture.setPermissions(["*"])
    await page.setViewportSize({ width: 1520, height: 1340 })
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))

    await page.goto("/en/system-prompts?search=a")
    await expect(page).toHaveURL(
      /\/en\/system-prompts\?search=a&page=1&size=10$/
    )
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await expect(page.getByRole("searchbox")).toHaveValue("a")
    await expect(
      page.locator('[data-slot="app-pagination-footer"]')
    ).toContainText("Showing 1-10 of 13 results")
    await testInfo.attach("system-prompts-canonical-search-a-1520x1340", {
      body: await page.screenshot(),
      contentType: "image/png",
    })
    await page.reload()
    await expect(page).toHaveURL(
      /\/en\/system-prompts\?search=a&page=1&size=10$/
    )
    await expect(page.getByRole("searchbox")).toHaveValue("a")
    await expect(page.locator("tbody tr")).toHaveCount(10)

    await page.getByRole("button", { name: en.pagination.goToNext }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator("tbody tr")).toHaveCount(3)

    await page.goBack()
    await expect(page).toHaveURL(
      /\/en\/system-prompts\?search=a&page=1&size=10$/
    )
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await page.goForward()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator("tbody tr")).toHaveCount(3)
    await page.reload()
    await expect(page.locator("tbody tr")).toHaveCount(3)

    await page.goto("/en/system-prompts?page=2&size=10&search=e&sort=name")
    await expect(page.locator("tbody tr")).toHaveCount(3)
    const search = page.getByRole("searchbox")
    await search.fill("NEWS_ARTICLE_CONTENT_LOCALIZATION")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page).toHaveURL(
      /page=1&size=10&search=NEWS_ARTICLE_CONTENT_LOCALIZATION&sort=name/
    )
    await page.reload()
    await expect(search).toHaveValue("NEWS_ARTICLE_CONTENT_LOCALIZATION")
    await expect(page.locator("tbody tr")).toHaveCount(1)

    await page.goto("/en/system-prompts?page=2&size=25&search=e&sort=name")
    await expect(page).toHaveURL(/page=1&size=10&search=e&sort=name/)
    await expect(page.locator("tbody tr")).toHaveCount(10)
    await page.getByRole("combobox", { name: en.pagination.pageSize }).click()
    await page.getByRole("option", { name: "20 / page" }).click()
    await expect(page).toHaveURL(/page=1&size=20&search=e&sort=name/)
    await expect(page.locator("tbody tr")).toHaveCount(13)
    await expect(
      page.locator('[data-slot="app-pagination-footer"]')
    ).toContainText("Showing 1-13 of 13 results")
  })

  test("lets read-only users view content without update controls", async ({
    fixture,
    page,
  }) => {
    await fixture.setPermissions(["system-prompt:read"])

    await page.goto("/en/system-prompts")
    await expect(
      page.getByRole("link", {
        name: "News content normalization",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: en.systemPrompts.editContent })
    ).toHaveCount(0)

    await page
      .getByRole("link", {
        name: "News content normalization",
        exact: true,
      })
      .click()
    const content = page.getByRole("textbox", {
      name: en.systemPrompts.content,
    })
    await expect(content).toBeVisible({ timeout: 20_000 })
    await expect(content).toHaveJSProperty("readOnly", true)
    await expect(
      page.getByRole("button", { name: en.systemPrompts.saveHotfix })
    ).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.filter(
        (request) =>
          request.method === "PUT" &&
          typeof request.path === "string" &&
          request.path.startsWith("/system-prompts/")
      )
    ).toHaveLength(0)
  })

  test("keeps the list and editor usable across responsive frames and 200% zoom", async ({
    fixture,
    page,
  }, testInfo) => {
    await fixture.setPermissions(["*"])
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))

    const frames = [
      { label: "mobile-360x800", width: 360, height: 800, capture: true },
      { label: "mobile-390x844", width: 390, height: 844 },
      { label: "mobile-boundary-767", width: 767, height: 900 },
      { label: "compact-boundary-768", width: 768, height: 900 },
      { label: "compact-1024x768", width: 1024, height: 768, capture: true },
      { label: "wide-boundary-1439", width: 1439, height: 900 },
      { label: "wide-boundary-1440", width: 1440, height: 900 },
      { label: "wide-1520x1024", width: 1520, height: 1024, capture: true },
      { label: "wide-1920x1024", width: 1920, height: 1024 },
      { label: "wide-2560x1440", width: 2560, height: 1440 },
      // Equivalent effective CSS viewport to 1520x1340 at 200% browser zoom.
      {
        label: "zoom-200-effective-760x670",
        width: 760,
        height: 670,
        capture: true,
      },
    ]

    async function expectNoHorizontalOverflow(label: string) {
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }))
      expect(
        dimensions.document,
        `${label}: document wider than viewport (${JSON.stringify(dimensions)})`
      ).toBeLessThanOrEqual(dimensions.viewport)
      expect(
        dimensions.body,
        `${label}: body wider than viewport (${JSON.stringify(dimensions)})`
      ).toBeLessThanOrEqual(dimensions.viewport)
    }

    await page.goto("/en/system-prompts")
    await expect(
      page.getByRole("button", { name: en.aiAssistant.open })
    ).toHaveCount(0)

    for (const frame of frames) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(page.getByRole("searchbox")).toBeVisible()
      await expect(page.locator("tbody tr")).toHaveCount(10)
      await expect(
        page.locator('[data-slot="app-pagination-footer"]')
      ).toBeVisible()
      await expect(
        page.getByRole("link", {
          name: "News content normalization",
          exact: true,
        })
      ).toBeVisible()
      await expectNoHorizontalOverflow(`list ${frame.label}`)

      if (frame.width === 360) {
        const tableScrollRegion = page.locator('[data-slot="table-container"]')
        await tableScrollRegion.evaluate((element) => {
          element.scrollLeft = element.scrollWidth
        })
        await expect(
          page.getByRole("link", { name: en.systemPrompts.editContent }).first()
        ).toBeInViewport()
        await tableScrollRegion.evaluate((element) => {
          element.scrollLeft = 0
        })
        const paginationFooter = page.locator(
          '[data-slot="app-pagination-footer"]'
        )
        await paginationFooter.scrollIntoViewIfNeeded()
        await expect(paginationFooter).toBeInViewport()
        await testInfo.attach(
          "system-prompt-pagination-footer-mobile-360x800",
          {
            body: await paginationFooter.screenshot(),
            contentType: "image/png",
          }
        )
        await page.evaluate(() => window.scrollTo(0, 0))
      }

      if (frame.capture) {
        await testInfo.attach(`system-prompt-list-${frame.label}`, {
          body: await page.screenshot(),
          contentType: "image/png",
        })
      }

      if (frame.width >= 768) {
        const sidebar = page.locator('[data-slot="sidebar"]').first()
        const initialState = await sidebar.getAttribute("data-state")
        expect(initialState).toBeTruthy()
        await page
          .getByRole("button", { name: en.navigation.toggleSidebar })
          .click()
        await expect(sidebar).toHaveAttribute(
          "data-state",
          initialState === "expanded" ? "collapsed" : "expanded"
        )
        await expectNoHorizontalOverflow(
          `list ${frame.label} with sidebar toggled`
        )
        await page
          .getByRole("button", { name: en.navigation.toggleSidebar })
          .click()
        await expect(sidebar).toHaveAttribute("data-state", initialState!)
      }
    }

    await page.goto("/en/system-prompts/MARKET_QUESTION_UNDERSTANDING")
    await expect(
      page.getByRole("button", { name: en.aiAssistant.open })
    ).toHaveCount(0)
    const content = page.getByRole("textbox", {
      name: new RegExp(`^${en.systemPrompts.content}`),
    })
    const save = page.getByRole("button", {
      name: en.systemPrompts.saveHotfix,
    })

    for (const frame of frames) {
      await page.setViewportSize({ width: frame.width, height: frame.height })
      await expect(content).toBeVisible()
      await expect(save).toBeVisible()
      await expectNoHorizontalOverflow(`editor ${frame.label}`)

      if (frame.capture) {
        await testInfo.attach(`system-prompt-editor-${frame.label}`, {
          body: await page.screenshot(),
          contentType: "image/png",
        })
      }
    }
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
    const editorAccessibility = await new AxeBuilder({ page })
      .include("main")
      .analyze()
    expect(editorAccessibility.violations).toEqual([])

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
    await expect(page).toHaveURL(
      /\/en\/system-prompts\/MARKET_QUESTION_UNDERSTANDING$/
    )
    const validationState = await fixture.state()
    expect(
      validationState.requests.some(
        (request) =>
          request.method === "PUT" &&
          request.path === "/system-prompts/MARKET_QUESTION_UNDERSTANDING"
      )
    ).toBe(false)

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

    await fixture.setScenario(
      "/system-prompts/MARKET_QUESTION_UNDERSTANDING",
      "delayed",
      "PUT"
    )
    await page.keyboard.press("Enter")
    await expect(
      page.getByRole("button", {
        name: en.systemPrompts.updatePending,
      })
    ).toBeDisabled()
    await expect(page.getByText(en.systemPrompts.updateSuccess)).toBeHidden()
    await expect
      .poll(async () => (await fixture.state()).pendingRequests)
      .toBe(1)

    await fixture.setScenario(
      "/system-prompts/MARKET_QUESTION_UNDERSTANDING",
      "success",
      "PUT"
    )
    await expect(page.getByText(en.systemPrompts.updateSuccess)).toBeVisible({
      timeout: 10_000,
    })
    await expect(page).toHaveURL(/\/en\/system-prompts$/)
    const updatedAt = "2026-10-28T03:45:00.000Z"
    const expectedUpdatedAt = await page.evaluate(
      (date) =>
        new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(new Date(date)),
      updatedAt
    )
    await expect(page.locator(`time[datetime="${updatedAt}"]`)).toHaveText(
      expectedUpdatedAt
    )

    const state = await fixture.state()
    const updateRequest = state.requests.find(
      (request) =>
        request.method === "PUT" &&
        request.path === "/system-prompts/MARKET_QUESTION_UNDERSTANDING"
    )
    expect(updateRequest?.bodyKeys).toEqual(["content"])
  })

  test("preserves a draft across shell and browser history navigation", async ({
    fixture,
    page,
  }) => {
    await fixture.setPermissions(["*"])
    await page.goto("/en/system-prompts/MARKET_QUESTION_UNDERSTANDING")

    const content = page.getByRole("textbox", {
      name: new RegExp(`^${en.systemPrompts.content}`),
    })
    const originalContent = await content.inputValue()
    const draft = `${originalContent}\n\nRetained local draft.`
    await content.fill(draft)

    await page
      .getByRole("link", {
        name: en.navigation.systemPrompts,
        exact: true,
      })
      .first()
      .click()
    await expect(page).toHaveURL(/\/en\/system-prompts$/)

    await page.goBack()
    await expect(content).toHaveValue(draft)
    await page.goForward()
    await expect(page).toHaveURL(/\/en\/system-prompts$/)
    await page.goBack()
    await expect(content).toHaveValue(draft)

    const backToList = page.getByRole("button", {
      name: en.systemPrompts.backToList,
    })
    await backToList.click()
    await expect(page.getByRole("alertdialog")).toBeVisible()
    await page
      .getByRole("button", { name: en.systemPrompts.keepEditing })
      .click()
    await expect(backToList).toBeFocused()
    await expect(content).toHaveValue(draft)

    await backToList.click()
    await page
      .getByRole("button", { name: en.systemPrompts.discardChanges })
      .click()
    await expect(page).toHaveURL(/\/en\/system-prompts$/)

    await page
      .getByRole("link", {
        name: "AI assistant · Question understanding",
        exact: true,
      })
      .click()
    await expect(content).toHaveValue(originalContent)
  })

  test("shows the catalog and content to Vietnamese read-only users", async ({
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
    const content = page.getByRole("textbox", {
      name: vi.systemPrompts.content,
    })
    await expect(content).toBeVisible()
    await expect(content).toHaveJSProperty("readOnly", true)
    await expect(
      page.getByRole("button", { name: vi.systemPrompts.saveHotfix })
    ).toHaveCount(0)
  })
})
