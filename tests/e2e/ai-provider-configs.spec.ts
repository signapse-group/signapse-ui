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
  test("renders page 2 when the API permits a 101-record response", async ({
    page,
    fixture,
  }, testInfo) => {
    // Preserve the actor's read grant while reproducing a missing /me permission snapshot.
    await fixture.setPermissions(["ai-provider-config:read"])
    await fixture.setScenario("/me", "permission-denied", "GET")
    await fixture.setScenario(
      "/ai-provider-configs",
      "authorized-page-two-size-twenty-101",
      "GET"
    )
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })

    const requestsBefore = (await fixture.state()).requests.length
    await page.goto("/vi/ai-provider-configs?page=2&size=20&sort=id_desc")

    const listRequests = (await fixture.state()).requests
      .slice(requestsBefore)
      .filter(
        (request) =>
          request.method === "GET" && request.path === "/ai-provider-configs"
      )
    expect(listRequests.map((request) => request.query)).toEqual([
      "?page=1&size=20&sort=id%2Cdesc",
    ])

    await expect(page.getByText("Hiển thị 21-40 trên 101 kết quả")).toBeVisible()
    await expect(page.getByRole("row")).toHaveCount(21)
    await expect(
      page.getByRole("combobox", { name: vi.pagination.pageSize })
    ).toContainText("20")

    const rowIds = await page
      .getByRole("table")
      .locator("tbody")
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) =>
          Number(
            new URL(
              (link as HTMLAnchorElement).href
            ).pathname.split("/").at(-1)
          )
        )
      )
    expect(rowIds).toEqual(
      Array.from({ length: 20 }, (_, index) => 81 - index)
    )

    await testInfo.attach("ai-connections-page-2-size-20-vi-1520x1024.png", {
      body: await page.screenshot({
        fullPage: false,
        style: "nextjs-portal { display: none !important; }",
      }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 375, height: 844 })
    const paginationFooter = page.locator(
      '[data-slot="app-pagination-footer"]'
    )
    await expect(
      paginationFooter.getByText("Hiển thị 21-40 trên 101 kết quả")
    ).toBeVisible()
    await expect(
      paginationFooter.getByRole("combobox", {
        name: vi.pagination.pageSize,
      })
    ).toBeVisible()
    await expect(
      paginationFooter.getByRole("navigation", {
        name: vi.pagination.navigationLabel,
      })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await testInfo.attach("ai-connections-page-2-size-20-vi-375x844.png", {
      body: await paginationFooter.screenshot(),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 1520, height: 1024 })
    const requestsBeforeSizeChange = (await fixture.state()).requests.length
    await page
      .getByRole("combobox", { name: vi.pagination.pageSize })
      .click()
    await page.getByRole("option", { name: "50 / trang", exact: true }).click()

    await expect(page).toHaveURL(
      (url) =>
        `${url.pathname}${url.search}` ===
        "/vi/ai-provider-configs?page=1&size=50&sort=id_desc"
    )
    await expect(page.getByText("Hiển thị 1-50 trên 101 kết quả")).toBeVisible()
    await expect(page.getByRole("row")).toHaveCount(51)

    const sizeChangeRequests = (await fixture.state()).requests
      .slice(requestsBeforeSizeChange)
      .filter(
        (request) =>
          request.method === "GET" && request.path === "/ai-provider-configs"
      )
    expect(sizeChangeRequests.map((request) => request.query)).toEqual([
      "?page=0&size=50&sort=id%2Cdesc",
    ])
  })

  test("keeps a genuine list API denial on the access-denied path", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await fixture.setScenario("/ai-provider-configs", "permission-denied", "GET")
    await page.setViewportSize({ width: 1520, height: 1024 })

    const requestsBefore = (await fixture.state()).requests.length
    await page.goto("/vi/ai-provider-configs?page=2&size=20&sort=id_desc")

    await expect(
      page
        .getByRole("main")
        .getByText(vi.aiProviderConfigs.readDenied, { exact: false })
    ).toBeVisible()
    await expect(page.getByRole("table")).toHaveCount(0)

    const deniedListRequests = (await fixture.state()).requests
      .slice(requestsBefore)
      .filter(
        (request) =>
          request.method === "GET" && request.path === "/ai-provider-configs"
      )
    expect(deniedListRequests.map((request) => request.query)).toEqual([
      "?page=1&size=20&sort=id%2Cdesc",
    ])
  })

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

    await page.setViewportSize({ width: 1440, height: 1024 })
    const paginationFooter = page.locator('[data-slot="app-pagination-footer"]')
    const spacing = await paginationFooter.evaluate((footer) => {
      const selector = footer.querySelector<HTMLElement>(
        '[data-slot="select-trigger"]'
      )
      const navigation = footer.querySelector<HTMLElement>(
        '[data-slot="pagination"]'
      )
      const navigationContent = footer.querySelector<HTMLElement>(
        '[data-slot="pagination-content"]'
      )
      const summary = footer.querySelector<HTMLElement>("p")
      const sizeGroup = selector?.parentElement
      const controls = sizeGroup?.parentElement
      const button = navigation?.querySelector<HTMLElement>("button")
      const icon = button?.querySelector<SVGSVGElement>("svg")

      if (
        !selector ||
        !navigation ||
        !navigationContent ||
        !summary ||
        !sizeGroup ||
        !controls ||
        !button ||
        !icon
      ) {
        throw new Error("Pagination footer elements are missing")
      }

      const footerRect = footer.getBoundingClientRect()
      const selectorRect = selector.getBoundingClientRect()
      const navigationRect = navigation.getBoundingClientRect()
      const controlsRect = controls.getBoundingClientRect()
      const summaryRect = summary.getBoundingClientRect()
      const dimensions = (element: HTMLElement | SVGSVGElement) => {
        const { width, height } = element.getBoundingClientRect()
        return [Math.round(width), Math.round(height)]
      }

      return {
        footerGap: getComputedStyle(footer).gap,
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
        selectorNavigationGap: getComputedStyle(controls).gap,
        navigationGap: getComputedStyle(navigationContent).gap,
        selectorSize: dimensions(selector),
        buttonSize: dimensions(button),
        iconSize: dimensions(icon),
        countOnLeft: summaryRect.right < controlsRect.left,
        controlsOnRight:
          controlsRect.left > footerRect.left + footerRect.width / 2 &&
          controlsRect.right < footerRect.right,
        selectorBeforeNavigation: selectorRect.right < navigationRect.left,
      }
    })
    expect(spacing).toEqual({
      footerGap: "16px",
      footerPadding: ["12px", "16px", "12px", "16px"],
      selectorPadding: ["8px", "8px"],
      labelSelectorGap: "8px",
      selectorNavigationGap: "16px",
      navigationGap: "4px",
      selectorSize: [64, 32],
      buttonSize: [32, 32],
      iconSize: [16, 16],
      countOnLeft: true,
      controlsOnRight: true,
      selectorBeforeNavigation: true,
    })
    await testInfo.attach("SIGN-462-m07-footer-dark-1440x1024.png", {
      body: await paginationFooter.screenshot(),
      contentType: "image/png",
    })

    const pageSizeTrigger = paginationFooter.getByRole("combobox", {
      name: en.pagination.pageSize,
    })
    await pageSizeTrigger.press("Enter")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(pageSizeTrigger).toBeFocused()

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

  test("recovers a confirmed positive out-of-range page to the last page", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })

    const previousUrl = "/vi/ai-provider-configs?page=1&size=10&sort=id_asc"
    await page.goto(previousUrl)
    await expect(
      page.getByRole("link", { name: "Groq #12", exact: true })
    ).toBeVisible()

    await fixture.setScenario(
      "/ai-provider-configs",
      "positive-out-of-range",
      "GET"
    )
    const requestsBefore = (await fixture.state()).requests.length
    await page.goto("/vi/ai-provider-configs?page=134&size=10&sort=id_asc")

    await expect(page).toHaveURL(
      (url) =>
        `${url.pathname}${url.search}` ===
        "/vi/ai-provider-configs?page=2&size=10&sort=id_asc"
    )
    await expect(
      page.getByRole("link", { name: "OpenAI #11", exact: true })
    ).toBeVisible()
    await expect(page.getByText("Hiển thị 11-11 trên 11 kết quả")).toBeVisible()
    await expect(
      page.getByRole("combobox", { name: vi.pagination.pageSize })
    ).toContainText("10")
    await expect(
      page
        .getByRole("navigation", { name: vi.pagination.navigationLabel })
        .getByRole("button", { name: "Đi tới trang 2" })
    ).toHaveAttribute("aria-current", "page")

    const listRequests = (await fixture.state()).requests
      .slice(requestsBefore)
      .filter(
        (request) =>
          request.method === "GET" && request.path === "/ai-provider-configs"
      )
    expect(listRequests.map((request) => request.query)).toEqual([
      "?page=133&size=10&sort=id%2Casc",
      "?page=1&size=10&sort=id%2Casc",
    ])

    await testInfo.attach("ai-connections-recovered-page-2-vi-1520x1024.png", {
      body: await page.screenshot({
        fullPage: false,
        style: "nextjs-portal { display: none !important; }",
      }),
      contentType: "image/png",
    })

    await page.setViewportSize({ width: 375, height: 844 })
    await expect(
      page.getByRole("link", { name: "OpenAI #11", exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await testInfo.attach("ai-connections-recovered-page-2-vi-375x844.png", {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    })

    await page.goBack()
    await expect(page).toHaveURL(
      (url) => `${url.pathname}${url.search}` === previousUrl
    )
    await expect(
      page.getByRole("link", { name: "OpenAI #1", exact: true })
    ).toBeVisible()
  })

  test("TC-06a normalizes a successful zero-result page without showing navigation", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await page.setViewportSize({ width: 1520, height: 1024 })

    await fixture.setScenario("/ai-provider-configs", "empty", "GET")
    await page.goto("/vi/ai-provider-configs?page=134&size=10&sort=id_asc")
    await expect(page).toHaveURL(
      (url) =>
        `${url.pathname}${url.search}` ===
        "/vi/ai-provider-configs?page=1&size=10&sort=id_asc"
    )
    await expect(
      page.getByText(vi.aiProviderConfigs.emptyTitle, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("combobox", { name: vi.pagination.pageSize })
    ).toBeVisible()
    await expect(
      page.getByRole("navigation", { name: vi.pagination.navigationLabel })
    ).toHaveCount(0)
  })

  test("TC-12a keeps failed list reads distinct and recovers after retry", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["ai-provider-config:read"])
    await page.setViewportSize({ width: 1520, height: 1024 })

    await fixture.setScenario(
      "/ai-provider-configs",
      "positive-out-of-range",
      "GET"
    )
    await page.goto("/vi/ai-provider-configs?page=1&size=10&sort=id_asc")
    await expect(
      page.getByRole("link", { name: "OpenAI #1", exact: true })
    ).toBeVisible()
    await expect(page.getByText("Hiển thị 1-10 trên 11 kết quả")).toBeVisible()
    await expect(
      page
        .getByRole("navigation", { name: vi.pagination.navigationLabel })
        .getByRole("button", { name: "Đi tới trang 1" })
    ).toHaveAttribute("aria-current", "page")

    await fixture.setScenario("/ai-provider-configs", "outage", "GET")
    const requestsBeforeFailure = (await fixture.state()).requests.length
    await page.goto("/vi/ai-provider-configs?page=134&size=10&sort=id_asc")
    await expect(page).toHaveURL(
      (url) =>
        `${url.pathname}${url.search}` ===
        "/vi/ai-provider-configs?page=134&size=10&sort=id_asc"
    )
    await expect(
      page
        .locator('[data-slot="empty-title"]')
        .filter({ hasText: vi.aiProviderConfigs.errorTitle })
    ).toBeVisible()
    await expect(
      page.getByText(vi.aiProviderConfigs.emptyTitle, { exact: true })
    ).toHaveCount(0)

    const failedListRequests = (await fixture.state()).requests
      .slice(requestsBeforeFailure)
      .filter(
        (request) =>
          request.method === "GET" &&
          request.path === "/ai-provider-configs" &&
          request.query === "?page=133&size=10&sort=id%2Casc"
      )
    expect(failedListRequests).toHaveLength(1)

    await fixture.setScenario(
      "/ai-provider-configs",
      "positive-out-of-range",
      "GET"
    )
    await page.reload()
    await expect(page).toHaveURL(
      (url) =>
        `${url.pathname}${url.search}` ===
        "/vi/ai-provider-configs?page=2&size=10&sort=id_asc"
    )
    await expect(
      page.getByRole("link", { name: "OpenAI #11", exact: true })
    ).toBeVisible()
    await expect(page.getByText("Hiển thị 11-11 trên 11 kết quả")).toBeVisible()
    await expect(
      page
        .locator('[data-slot="empty-title"]')
        .filter({ hasText: vi.aiProviderConfigs.errorTitle })
    ).toHaveCount(0)
  })

  test.describe("server-rendered pagination recovery", () => {
    test.use({ javaScriptEnabled: false })

    test("recovers a confirmed positive out-of-range page without hydration", async ({
      page,
      fixture,
    }) => {
      await fixture.setPermissions(["ai-provider-config:read"])
      await fixture.setScenario(
        "/ai-provider-configs",
        "positive-out-of-range",
        "GET"
      )

      await page.goto("/vi/ai-provider-configs?page=134&size=10&sort=id_asc")

      await expect(page).toHaveURL(
        (url) =>
          `${url.pathname}${url.search}` ===
          "/vi/ai-provider-configs?page=2&size=10&sort=id_asc"
      )

      const listRequests = (await fixture.state()).requests.filter(
        (request) =>
          request.method === "GET" && request.path === "/ai-provider-configs"
      )
      expect(listRequests.map((request) => request.query)).toEqual([
        "?page=133&size=10&sort=id%2Casc",
        "?page=1&size=10&sort=id%2Casc",
      ])
    })
  })

  test("normalizes invalid page values on the route and replaces browser history", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-task-configuration:read",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })

    const previousUrl = "/vi/ai-provider-configs?size=20&sort=id_asc"
    await page.goto(previousUrl)
    await expect(page.getByRole("link", { name: "Groq #12" })).toBeVisible()

    for (const invalidPage of ["0", "-1", "1.5", "not-a-number"]) {
      const requestsBefore = (await fixture.state()).requests.length
      const invalidUrl = `/vi/ai-provider-configs?page=${encodeURIComponent(invalidPage)}&size=10&sort=id_asc`

      await page.goto(invalidUrl)
      await expect(page).toHaveURL(
        (url) =>
          `${url.pathname}${url.search}` ===
          "/vi/ai-provider-configs?page=1&size=10&sort=id_asc"
      )
      await expect(page.getByRole("link", { name: "Groq #12" })).toBeVisible()
      await expect(
        page.getByRole("combobox", { name: vi.pagination.pageSize })
      ).toContainText("10")
      await expect(
        page
          .getByRole("navigation", {
            name: vi.pagination.navigationLabel,
          })
          .locator('[aria-current="page"]')
      ).toHaveText("1")

      const requests = (await fixture.state()).requests
        .slice(requestsBefore)
        .filter(
          (request) =>
            request.method === "GET" && request.path === "/ai-provider-configs"
        )
      expect(requests).toContainEqual(
        expect.objectContaining({
          method: "GET",
          path: "/ai-provider-configs",
          query: "?page=0&size=10&sort=id%2Casc",
        })
      )

      if (invalidPage === "0") {
        await testInfo.attach(
          "ai-connections-page-zero-normalized-vi-1520x1024.png",
          {
            body: await page.screenshot({
              fullPage: false,
              style: "nextjs-portal { display: none !important; }",
            }),
            contentType: "image/png",
          }
        )
      }

      await page.goBack()
      await expect(page).toHaveURL(
        (url) => `${url.pathname}${url.search}` === previousUrl
      )
      await expect(page.getByRole("link", { name: "Groq #12" })).toBeVisible()
    }
  })

  test("normalizes unsupported page sizes and replaces browser history", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-task-configuration:read",
    ])
    await page.emulateMedia({ colorScheme: "dark" })
    await page.setViewportSize({ width: 1520, height: 1024 })

    const previousUrl = "/vi/ai-provider-configs?size=20&sort=id_asc"
    await page.goto(previousUrl)
    await expect(page.getByRole("link", { name: "Groq #12" })).toBeVisible()

    let normalizedRequests = 0
    for (const pageValue of ["2", "0"]) {
      await page.goto(
        `/vi/ai-provider-configs?page=${pageValue}&size=25&sort=id_asc`
      )
      await expect(page).toHaveURL(
        (url) =>
          `${url.pathname}${url.search}` ===
          "/vi/ai-provider-configs?page=1&size=10&sort=id_asc"
      )
      await expect(page.getByRole("link", { name: "Groq #12" })).toBeVisible()
      await expect(
        page.getByRole("combobox", { name: vi.pagination.pageSize })
      ).toContainText("10")
      await expect(
        page
          .getByRole("navigation", {
            name: vi.pagination.navigationLabel,
          })
          .locator('[aria-current="page"]')
      ).toHaveText("1")

      const requests = (await fixture.state()).requests.filter(
        (request) =>
          request.method === "GET" &&
          request.path === "/ai-provider-configs" &&
          request.query === "?page=0&size=10&sort=id%2Casc"
      )
      expect(requests.length).toBeGreaterThan(normalizedRequests)
      normalizedRequests = requests.length

      if (pageValue === "0") {
        await testInfo.attach(
          "ai-connections-page-zero-unsupported-size-normalized-vi-1520x1024.png",
          {
            body: await page.screenshot({
              fullPage: false,
              style: "nextjs-portal { display: none !important; }",
            }),
            contentType: "image/png",
          }
        )
      }

      await page.goBack()
      await expect(page).toHaveURL(
        (url) => `${url.pathname}${url.search}` === previousUrl
      )
      await expect(page.getByRole("link", { name: "Groq #12" })).toBeVisible()
    }
  })

  test("enables Add and Replace inputs after hydration before accepting drafts", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-provider-config:create",
      "ai-provider-config:update",
    ])

    let resumeScripts = () => {}
    const scriptsHeld = new Promise<void>((resolve) => {
      resumeScripts = resolve
    })
    await page.route("**/_next/static/**/*.js*", async (route) => {
      await scriptsHeld
      await route.continue()
    })

    try {
      await page.goto("/en/ai-provider-configs/12", { waitUntil: "commit" })

      const newKeyInput = page.getByLabel("New key", { exact: true })
      const replacementInput = page.getByLabel("Replacement key", {
        exact: true,
      })
      const addButton = page.getByRole("button", { name: "Add key" })
      const replaceButton = page.getByRole("button", { name: "Replace key" })

      await expect(newKeyInput).toBeVisible({ timeout: 60_000 })
      await expect(replacementInput).toBeVisible()
      await expect(newKeyInput).toBeDisabled()
      await expect(replacementInput).toBeDisabled()

      resumeScripts()

      await expect(newKeyInput).toBeEnabled()
      await expect(replacementInput).toBeEnabled()
      await newKeyInput.fill("probe")
      await replacementInput.fill("probe")
      await expect(newKeyInput).toHaveValue("probe")
      await expect(replacementInput).toHaveValue("probe")
      await expect(addButton).toBeEnabled()
      await expect(replaceButton).toBeEnabled()
    } finally {
      resumeScripts()
    }
  })

  test("keeps connection edits disabled until hydration, then accepts a description-only draft", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setPermissions([
      "ai-provider-config:read",
      "ai-provider-config:update",
    ])

    let resumeScripts = () => {}
    const scriptsHeld = new Promise<void>((resolve) => {
      resumeScripts = resolve
    })
    await page.route("**/_next/static/**/*.js*", async (route) => {
      await scriptsHeld
      await route.continue()
    })

    try {
      await page.emulateMedia({ colorScheme: "dark" })
      await page.setViewportSize({ width: 1520, height: 1600 })
      await page.context().addCookies([
        {
          name: "sidebar_state",
          value: "true",
          url: "http://127.0.0.1:3100/",
        },
      ])
      await page.goto("/en/ai-provider-configs/12", { waitUntil: "commit" })

      const endpoint = page.getByLabel(en.aiProviderConfigs.endpoint)
      const description = page.getByLabel(en.aiProviderConfigs.description)
      const replacementKey = page.getByLabel(
        en.aiProviderConfigs.replacementKey,
        { exact: true }
      )
      const save = page.getByRole("button", {
        name: en.aiProviderConfigs.saveConnection,
      })
      await expect(description).toBeVisible({ timeout: 60_000 })
      await expect(endpoint).toBeDisabled()
      await expect(description).toBeDisabled()
      await expect(replacementKey).toBeDisabled()
      await expect(save).toBeDisabled()

      resumeScripts()
      await expect(endpoint).toBeEnabled()
      await expect(description).toBeEnabled()
      await expect(replacementKey).toBeEnabled()
      await expect(replacementKey).toBeEmpty()

      await description.fill("Description-only hydration regression")
      await expect(description).toHaveValue(
        "Description-only hydration regression"
      )
      await expect(save).toBeEnabled()

      await testInfo.attach("ai-connection-description-draft-1520x1600.png", {
        body: await page.screenshot({
          fullPage: false,
          style: "nextjs-portal { display: none !important; }",
        }),
        contentType: "image/png",
      })
    } finally {
      resumeScripts()
    }
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
    await expect(page).toHaveURL(/\/en\/ai-provider-configs$/, {
      timeout: 30_000,
    })

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
