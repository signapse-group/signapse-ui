import type { Page } from "@playwright/test"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

import { expect, test } from "./fixtures"

async function localizedBirthday(page: Page, value: string) {
  return page.evaluate((dateValue) => {
    const [year, month, day] = dateValue.split("-").map(Number)
    const date = new Date(0)
    date.setFullYear(year, month - 1, day)
    date.setHours(0, 0, 0, 0)

    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }, value)
}

async function selectBirthday(page: Page, label: string, value: string) {
  const [year, month] = value.split("-").map(Number)
  const birthday = page.getByRole("button", { name: label, exact: false })
  await birthday.click()

  const calendar = page.locator('[data-slot="calendar"]')
  await calendar
    .getByRole("combobox", { name: "Chọn năm" })
    .selectOption(String(year))
  await calendar
    .getByRole("combobox", { name: "Chọn tháng" })
    .selectOption(String(month - 1))

  const dataDay = await page.evaluate((dateValue) => {
    const [selectedYear, selectedMonth, selectedDay] = dateValue
      .split("-")
      .map(Number)
    const date = new Date(0)
    date.setFullYear(selectedYear, selectedMonth - 1, selectedDay)
    date.setHours(0, 0, 0, 0)
    return date.toLocaleDateString("vi")
  }, value)
  const dayButton = calendar.locator(`[data-day="${dataDay}"]`)
  await expect(dayButton).toBeVisible()
  await dayButton.focus()
  await page.keyboard.press("Enter")
  await expect(calendar).not.toBeVisible()

  await birthday.press("Enter")
  await expect(
    calendar.getByRole("combobox", { name: "Chọn năm" })
  ).toHaveValue(String(year))
  await expect(
    calendar.getByRole("combobox", { name: "Chọn tháng" })
  ).toHaveValue(String(month - 1))
  await expect(dayButton).toHaveAttribute("data-selected-single", "true")
  await page.keyboard.press("Escape")
  await expect(calendar).not.toBeVisible()
  await expect(birthday).toBeFocused()

  return birthday
}

test("saves and reads back old and leap birthdays as the same calendar date", async ({
  fixture,
  page,
}) => {
  const profile = viDictionary.accountProfile
  const dates = ["1900-01-01", "2000-02-29", "0001-01-01"]
  await page.goto("/vi/account")

  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
  await expect(page.locator('input[type="date"]')).toHaveCount(0)
  const birthday = page.getByRole("button", {
    name: profile.dateOfBirth,
    exact: false,
  })
  await expect(birthday).toHaveText(await localizedBirthday(page, "1990-01-02"))

  await birthday.focus()
  await page.keyboard.press("Enter")
  const calendar = page.locator('[data-slot="calendar"]')
  await expect(calendar).toBeVisible()
  await expect(
    calendar.getByRole("combobox", { name: "Chọn năm" })
  ).toHaveValue("1990")
  await expect(
    calendar.getByRole("combobox", { name: "Chọn tháng" })
  ).toHaveValue("0")
  await calendar.getByRole("combobox", { name: "Chọn tháng" }).selectOption("1")
  await page.keyboard.press("Escape")
  await expect(calendar).not.toBeVisible()
  await expect(birthday).toBeFocused()
  await birthday.press("Enter")
  await expect(
    calendar.getByRole("combobox", { name: "Chọn tháng" })
  ).toHaveValue("0")
  await page.keyboard.press("Escape")
  await expect(calendar).not.toBeVisible()

  for (const [index, date] of dates.entries()) {
    let selected = await selectBirthday(page, profile.dateOfBirth, date)
    const expectedBirthday = await localizedBirthday(page, date)
    await expect(selected).toHaveText(expectedBirthday)
    const save = page.getByRole("button", { name: profile.saveChanges })
    await expect(save).toBeEnabled()

    if (index === 0) {
      await page.getByRole("button", { name: profile.restore }).click()
      await expect(selected).toHaveText(
        await localizedBirthday(page, "1990-01-02")
      )
      await expect(save).toBeDisabled()
      selected = await selectBirthday(page, profile.dateOfBirth, date)
      await expect(selected).toHaveText(expectedBirthday)
    }

    await save.press("Enter")
    await expect(save).toBeDisabled()
    await expect
      .poll(
        async () =>
          (await fixture.state()).requests.filter(
            (request) => request.method === "PATCH" && request.path === "/me"
          ).length
      )
      .toBe(index + 1)

    const stateBeforeReload = await fixture.state()
    const readsBeforeReload = stateBeforeReload.requests.filter(
      (request) => request.method === "GET" && request.path === "/me"
    ).length
    const requests = stateBeforeReload.requests.filter(
      (request) => request.method === "PATCH" && request.path === "/me"
    )
    expect(requests[index]).toMatchObject({
      hasAuthHeader: false,
      body: {
        birthday: `${date}T00:00:00.000Z`,
        firstName: "Fixture",
        lastName: "User",
        phone: "2025550199",
      },
    })

    await page.reload()
    await expect(
      page.getByRole("button", {
        name: profile.dateOfBirth,
        exact: false,
      })
    ).toHaveText(expectedBirthday)
    await expect
      .poll(
        async () =>
          (await fixture.state()).requests.filter(
            (request) => request.method === "GET" && request.path === "/me"
          ).length
      )
      .toBeGreaterThan(readsBeforeReload)
    await expect(
      page.getByRole("textbox", { name: profile.firstName, exact: false })
    ).toHaveValue("Fixture")
    await expect(
      page.getByRole("textbox", { name: profile.lastName, exact: false })
    ).toHaveValue("User")
    await expect(
      page.getByRole("textbox", { name: profile.phoneNumber, exact: false })
    ).toHaveValue("2025550199")
  }
})
