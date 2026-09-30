import AxeBuilder from "@axe-core/playwright"

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { expect, test } from "./fixtures"

test.describe("P0 profile menu usage limits", () => {
  test.beforeEach(async ({ fixture, page }) => {
    await fixture.setPermissions(["*"])
    await page.context().clearCookies({ name: "sidebar_state" })
  })

  test("loads current values in place, retries by keyboard, and restores focus", async ({
    fixture,
    page,
  }) => {
    await fixture.setScenario("/me/usage-limits", "outage")
    await page.goto("/en/dashboard")

    const profileTrigger = page.getByRole("button", {
      name: /Signapse Developer/i,
    })
    const screenUrl = page.url()
    await profileTrigger.focus()
    await page.keyboard.press("Enter")

    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    const usageItem = menu.getByRole("menuitem", {
      name: en.usageLimits.title,
    })
    await expect(usageItem).toHaveAttribute("aria-expanded", "false")
    await expect(
      menu.getByRole("menuitem", { name: en.auth.account })
    ).toHaveAttribute("href", "/en/account")
    await expect(
      menu.getByRole("menuitem", {
        name: en.navigation.apiAccessToken,
      })
    ).toHaveAttribute("href", "/en/developer-token")
    await expect(
      menu.getByRole("menuitem", { name: en.auth.notifications })
    ).toBeVisible()

    await usageItem.focus()
    await page.keyboard.press("Enter")
    await expect(usageItem).toHaveAttribute("aria-expanded", "true")
    await expect(menu.getByRole("alert")).toContainText(
      en.usageLimits.errorDescription
    )
    await expect(menu.getByText("0 / 5", { exact: true })).toHaveCount(0)
    await expect(page).toHaveURL(screenUrl)

    await fixture.setScenario("/me/usage-limits", "success")
    const retry = menu.getByRole("menuitem", { name: en.common.retry })
    await page.keyboard.press("ArrowDown")
    await expect(retry).toBeFocused()
    await page.keyboard.press("Enter")

    await expect(menu.getByText("Workspace 107", { exact: true })).toBeVisible()
    await expect(menu.getByText("2 / 5", { exact: true })).toBeVisible()
    await expect(menu.getByText("1,001 / 1,000", { exact: true })).toBeVisible()
    await expect(menu.getByText("2 / 1", { exact: true })).toBeVisible()
    await expect(menu.getByText(/October 1, 2026/)).toContainText("UTC")
    await expect(page).toHaveURL(screenUrl)

    const accessibility = await new AxeBuilder({ page })
      .include('[data-slot="dropdown-menu-content"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      accessibility.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])

    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(profileTrigger).toBeFocused()
  })

  test("works in both locales, themes, and narrow and wide layouts", async ({
    page,
  }) => {
    const viewports = [
      { width: 375, height: 812 },
      { width: 1280, height: 800 },
    ]

    for (const locale of ["en", "vi"] as const) {
      const dictionary = locale === "en" ? en : viDictionary

      for (const theme of ["light", "dark"] as const) {
        for (const viewport of viewports) {
          await page.context().clearCookies({ name: "sidebar_state" })
          await page.setViewportSize(viewport)
          await page.goto(`/${locale}/dashboard`)

          await page
            .getByRole("button", { name: dictionary.theme.toggle })
            .click()
          await page
            .getByRole("menuitem", { name: dictionary.theme[theme] })
            .click()
          if (theme === "dark") {
            await expect(page.locator("html")).toHaveClass(/\bdark\b/)
          } else {
            await expect(page.locator("html")).not.toHaveClass(/\bdark\b/)
          }

          if (viewport.width < 768) {
            await page
              .getByRole("button", {
                name: dictionary.navigation.toggleSidebar,
              })
              .click()
            await expect(
              page.getByRole("dialog", {
                name: dictionary.navigation.mobileSidebarTitle,
              })
            ).toBeVisible()
          } else if (theme === "dark") {
            await page
              .getByRole("button", {
                name: dictionary.navigation.toggleSidebar,
              })
              .click()
            await expect(
              page.locator('[data-slot="sidebar"]').first()
            ).toHaveAttribute("data-state", "collapsed")
          }

          await page.locator("#app-sidebar-user-menu-trigger").click()
          const menu = page.getByRole("menu", {
            name: /Signapse Developer/i,
          })
          await expect(menu).toBeVisible()
          await menu
            .getByRole("menuitem", { name: dictionary.usageLimits.title })
            .click()
          await expect(
            menu.getByText("Workspace 107", { exact: true })
          ).toBeVisible()
          await expect(menu.getByText("UTC", { exact: false })).toBeVisible()

          const overflow = await page.evaluate(() => ({
            document: document.documentElement.scrollWidth <= window.innerWidth,
            menu: (() => {
              const element = document.querySelector<HTMLElement>(
                '[data-slot="dropdown-menu-content"]'
              )
              return Boolean(
                element && element.scrollWidth <= element.clientWidth
              )
            })(),
          }))
          expect(overflow).toEqual({ document: true, menu: true })
        }
      }
    }
  })

  test("old locale routes return not found", async ({ page }) => {
    for (const locale of ["vi", "en"] as const) {
      const response = await page.goto(`/${locale}/usage-limits`)
      expect(response?.status()).toBe(404)
      await expect(page).toHaveURL(new RegExp(`/${locale}/usage-limits$`))
    }
  })
})
