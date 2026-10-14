import AxeBuilder from "@axe-core/playwright"

import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

import { expect, test } from "./fixtures"

test("shows the system default without saving an unset preference", async ({
  fixture,
  page,
}) => {
  await fixture.setPreferredLanguage(null)
  await page.goto("/vi/account")

  await expect(
    page.getByText(viDictionary.accountTelegramLanguage.systemDefault)
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: viDictionary.accountTelegramLanguage.saveLanguage,
    })
  ).toBeDisabled()
  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
  expect((await fixture.getLanguages()).preferredLanguage).toBeNull()
  expect(
    (await fixture.state()).requests.filter(
      (request) => request.method === "PATCH"
    )
  ).toEqual([])
})

test("saves the Telegram language independently of dirty profile data", async ({
  fixture,
  page,
}) => {
  await page.goto("/en/account")

  const languageSelect = page.getByRole("combobox", {
    name: enDictionary.accountTelegramLanguage.languageLabel,
  })
  await expect(languageSelect).toContainText(
    enDictionary.accountTelegramLanguage.optionVietnamese
  )
  await expect(
    page.getByText(
      enDictionary.accountTelegramLanguage.savedLanguage.replace(
        "{language}",
        enDictionary.accountTelegramLanguage.optionVietnamese
      ),
      { exact: true }
    )
  ).toBeVisible()

  const firstName = page.getByRole("textbox", {
    name: enDictionary.accountProfile.firstName,
  })
  await firstName.clear()

  await languageSelect.focus()
  await page.keyboard.press("Space")
  await expect(
    page.getByRole("option", { name: enDictionary.locale.english })
  ).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(languageSelect).toBeFocused()
  const beforeSave = await fixture.state()
  expect(
    beforeSave.requests.filter((request) => request.method === "PATCH")
  ).toEqual([])

  await fixture.setScenario("/me/preferred-language", "delayed", "PATCH")
  const saveButton = page.getByRole("button", {
    name: enDictionary.accountTelegramLanguage.saveLanguage,
  })
  await saveButton.click()
  await expect(
    page.getByRole("button", {
      name: enDictionary.accountTelegramLanguage.saving,
      exact: true,
    })
  ).toBeDisabled()
  await expect(page.getByRole("status")).toContainText(
    enDictionary.accountTelegramLanguage.saving
  )
  await expect(firstName).toHaveValue("")

  await fixture.setScenario("/me/preferred-language", "success", "PATCH")
  await expect(
    page.getByText(enDictionary.accountTelegramLanguage.saveSuccess)
  ).toBeVisible()
  await expect(page.getByRole("status")).toContainText(
    enDictionary.accountTelegramLanguage.saveSuccess
  )
  await expect(firstName).toHaveValue("")

  const savedState = await fixture.state()
  const languageWrites = savedState.requests.filter(
    (request) =>
      request.method === "PATCH" && request.path === "/me/preferred-language"
  )
  expect(languageWrites).toHaveLength(1)
  expect(languageWrites[0]?.body).toEqual({ isoCode: "en" })
  expect((await fixture.getLanguages()).preferredLanguage).toBe("en")

  await page.reload()
  await expect(
    page.getByRole("combobox", {
      name: enDictionary.accountTelegramLanguage.languageLabel,
    })
  ).toContainText(enDictionary.locale.english)
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

test("keeps a failed language choice unsaved and announces recovery", async ({
  fixture,
  page,
}) => {
  await fixture.setPreferredLanguage(null)
  await page.goto("/en/account")

  const languageSelect = page.getByRole("combobox", {
    name: enDictionary.accountTelegramLanguage.languageLabel,
  })
  await languageSelect.click()
  await page.getByRole("option", { name: enDictionary.locale.english }).click()

  await fixture.setScenario(
    "/me/preferred-language",
    "mutation-failure",
    "PATCH"
  )
  await page
    .getByRole("button", {
      name: enDictionary.accountTelegramLanguage.saveLanguage,
    })
    .click()

  await expect(
    page.getByText(enDictionary.accountTelegramLanguage.saveError)
  ).toBeVisible()
  expect((await fixture.getLanguages()).preferredLanguage).toBeNull()
  await expect(
    page.getByText(enDictionary.accountTelegramLanguage.saveSuccess)
  ).not.toBeVisible()

  const writes = (await fixture.state()).requests.filter(
    (request) => request.method === "PATCH"
  )
  expect(writes).toHaveLength(1)
  expect(writes[0]).toMatchObject({ path: "/me/preferred-language" })
})

test("keeps the profile usable when the language catalog is unavailable", async ({
  fixture,
  page,
}) => {
  await fixture.setPreferredLanguage("vi")
  await fixture.setScenario("/languages", "outage", "GET")
  await page.goto("/en/account")

  const firstName = page.getByRole("textbox", {
    name: enDictionary.accountProfile.firstName,
  })
  await expect(
    page
      .getByRole("alert")
      .getByText(enDictionary.accountTelegramLanguage.loadError)
  ).toBeVisible()
  await expect(firstName).toBeVisible()
  await firstName.clear()

  await fixture.setScenario("/languages", "success", "GET")
  await page
    .getByRole("button", { name: enDictionary.accountTelegramLanguage.retry })
    .click()

  await expect(
    page.getByRole("combobox", {
      name: enDictionary.accountTelegramLanguage.languageLabel,
    })
  ).toBeVisible()
  await expect(
    page.getByRole("combobox", {
      name: enDictionary.accountTelegramLanguage.languageLabel,
    })
  ).toContainText(enDictionary.accountTelegramLanguage.optionVietnamese)
  await expect(
    page.getByText(
      enDictionary.accountTelegramLanguage.savedLanguage.replace(
        "{language}",
        enDictionary.accountTelegramLanguage.optionVietnamese
      ),
      { exact: true }
    )
  ).toBeVisible()
  await expect(firstName).toHaveValue("")
})

test("fits the Telegram language control on a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/en/account")

  await expect(
    page.getByRole("combobox", {
      name: enDictionary.accountTelegramLanguage.languageLabel,
    })
  ).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
})

test("has no axe violations in the Telegram language section", async ({
  page,
}) => {
  await page.goto("/en/account")

  const results = await new AxeBuilder({ page })
    .include('section[aria-labelledby="account-telegram-language-title"]')
    .analyze()
  expect(results.violations).toEqual([])
})
