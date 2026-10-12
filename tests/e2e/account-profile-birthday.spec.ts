import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

import { expect, test } from "./fixtures"

test("saves and reads back old and leap birthdays as the same calendar date", async ({
  fixture,
  page,
}) => {
  const profile = viDictionary.accountProfile
  await page.goto("/vi/account")

  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
  const birthday = page.getByLabel(profile.dateOfBirth, { exact: false })
  await expect(birthday).toHaveValue("1990-01-02")
  await expect(birthday).toHaveAttribute("max", /^\d{4}-\d{2}-\d{2}$/)

  for (const [index, date] of [
    "1900-01-01",
    "2000-02-29",
    "0001-01-01",
  ].entries()) {
    await birthday.focus()
    await expect(birthday).toBeFocused()
    await birthday.fill(date)
    await page.getByRole("button", { name: profile.saveChanges }).press("Enter")
    await expect(
      page.getByRole("button", { name: profile.saveChanges })
    ).toBeDisabled()

    await expect
      .poll(
        async () =>
          (await fixture.state()).requests.filter(
            (request) => request.method === "PATCH" && request.path === "/me"
          ).length
      )
      .toBe(index + 1)

    const requests = (await fixture.state()).requests.filter(
      (request) => request.method === "PATCH" && request.path === "/me"
    )
    expect(requests[index]).toMatchObject({
      hasAuthHeader: false,
      body: {
        birthday: `${date}T00:00:00.000Z`,
        firstName: "Fixture",
        lastName: "User",
        phone: "+1 555 0100",
      },
    })

    await page.reload()
    await expect(
      page.getByLabel(profile.dateOfBirth, { exact: false })
    ).toHaveValue(date)
  }
})
