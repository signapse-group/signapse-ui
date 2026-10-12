import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

import { expect, test } from "./fixtures"

test("selecting English changes the account locale without writing preferences", async ({
  fixture,
  page,
}) => {
  await page.goto("/vi/account")
  await expect(page.locator("html")).toHaveAttribute("lang", "vi")

  const requestsBeforeSwitch = (await fixture.state()).requests.length
  const browserWrites: string[] = []
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
      browserWrites.push(
        `${request.method()} ${new URL(request.url()).pathname}`
      )
    }
  })

  await page
    .getByRole("button", { name: viDictionary.locale.selectorLabel })
    .click()
  await page
    .getByRole("menuitemradio", {
      name: enDictionary.locale.english,
      exact: true,
    })
    .click()

  await page.waitForURL((url) => url.pathname === "/en/account")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page).toHaveURL(/\/en\/account$/)

  await page
    .getByRole("button", { name: enDictionary.locale.selectorLabel })
    .click()
  await expect(
    page.getByRole("menuitemradio", {
      name: enDictionary.locale.english,
      exact: true,
    })
  ).toHaveAttribute("aria-checked", "true")

  const backendWrites = (await fixture.state()).requests
    .slice(requestsBeforeSwitch)
    .filter((request) =>
      ["POST", "PUT", "PATCH", "DELETE"].includes(
        String(request.method).toUpperCase()
      )
    )
  expect(browserWrites).toEqual([])
  expect(backendWrites).toEqual([])
})
