// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerRefresh, toastError, toastSuccess } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("@/app/api/user/action", () => ({
  updateMyProfile: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

import { updateMyProfile } from "@/app/api/user/action"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import {
  AccountProfileForm,
  type AccountProfileInitialData,
} from "@/app/[lang]/(main)/account/account-profile-form"

const initialData: AccountProfileInitialData = {
  avatarUrl: "https://example.com/avatar.png",
  avatarFallback: "AM",
  firstName: "Ada",
  lastName: "Miller",
  dateOfBirth: "1990-01-02",
  email: "ada@example.com",
  phoneNumber: "2025550199",
}

function renderProfile(
  overrides: Partial<AccountProfileInitialData> = {},
  locale: "en" | "vi" = "en"
) {
  const dictionary = locale === "vi" ? viDictionary : en

  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <AccountProfileForm initialData={{ ...initialData, ...overrides }} />
    </LocalizationProvider>
  )
}

async function selectBirthday(value: string, user: UserEvent) {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(date)

  await user.click(screen.getByRole("button", { name: /Date of birth/ }))

  const calendar = screen
    .getByRole("grid")
    .closest<HTMLElement>('[data-slot="calendar"]')!
  await user.selectOptions(
    within(calendar).getByRole("combobox", { name: "Choose the Year" }),
    String(year)
  )
  await user.selectOptions(
    within(calendar).getByRole("combobox", { name: "Choose the Month" }),
    String(month - 1)
  )
  await user.click(
    within(screen.getByRole("grid")).getByRole("button", {
      name: new RegExp(`${monthName} ${day}(?:st|nd|rd|th)?, ${year}`),
    })
  )
  await waitFor(() =>
    expect(screen.queryByRole("grid")).not.toBeInTheDocument()
  )
}

describe("AccountProfileForm", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(updateMyProfile).mockReset()
    routerRefresh.mockReset()
    toastError.mockReset()
    toastSuccess.mockReset()
  })

  it("renders a static identity row, read-only account data, and accessible required fields", async () => {
    const user = userEvent.setup()
    renderProfile()

    expect(
      screen.getByRole("heading", {
        name: en.accountProfile.formTitle,
      })
    ).toBeVisible()
    expect(screen.getByRole("img", { name: "Miller Ada" })).toBeVisible()
    expect(
      screen.queryByText(/profile information used for your Signapse account/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/account role/i)).not.toBeInTheDocument()

    const email = screen.getByRole("textbox", {
      name: en.accountProfile.email,
    })
    expect(email).toHaveAttribute("readonly")
    expect(email).toHaveAttribute(
      "aria-describedby",
      "account-email-description"
    )
    expect(email).toHaveValue(initialData.email)

    expect(screen.getByRole("textbox", { name: /Last name/ })).toBeRequired()
    expect(screen.getByRole("textbox", { name: /First name/ })).toBeRequired()
    const dateOfBirth = screen.getByRole("button", { name: /Date of birth/i })
    expect(dateOfBirth).toHaveAttribute("type", "button")
    expect(dateOfBirth).toHaveTextContent("January 2, 1990")
    expect(dateOfBirth).toHaveAccessibleName(/Date of birth.*January 2, 1990/)
    expect(document.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /Phone number/ })).toBeRequired()
    expect(
      screen.queryByRole("button", { name: /upload|delete|replace/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/billing|payment|package|plan|upgrade|subscription/i)
    ).not.toBeInTheDocument()

    dateOfBirth.focus()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("grid")).toBeVisible()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull())
    expect(dateOfBirth).toHaveFocus()
    expect(updateMyProfile).not.toHaveBeenCalled()

    await user.clear(screen.getByRole("textbox", { name: /First name/ }))

    const firstName = screen.getByRole("textbox", { name: /First name/ })
    expect(firstName).toHaveAttribute(
      "aria-describedby",
      "account-first-name-error"
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      en.accountProfile.firstNameRequired
    )
  })

  it("localizes the selected birthday and calendar dropdowns", async () => {
    const user = userEvent.setup()
    renderProfile({}, "vi")

    const birthday = screen.getByRole("button", { name: /Ngày sinh/ })
    expect(birthday).toHaveTextContent("2 tháng 1, 1990")

    await user.click(birthday)
    const calendar = screen
      .getByRole("grid")
      .closest<HTMLElement>('[data-slot="calendar"]')!
    expect(
      within(calendar).getByRole("combobox", { name: "Chọn tháng" })
    ).toBeVisible()
    expect(
      within(calendar).getByRole("combobox", { name: "Chọn năm" })
    ).toBeVisible()
  })

  it("keeps leap-day selection in the API date-time without shifting it", async () => {
    const user = userEvent.setup()
    vi.mocked(updateMyProfile).mockResolvedValue({
      success: true,
      data: {} as never,
    })
    renderProfile()

    await selectBirthday("2000-02-29", user)
    expect(
      screen.getByRole("button", { name: /Date of birth/i })
    ).toHaveTextContent("February 29, 2000")

    await user.click(
      screen.getByRole("button", { name: en.accountProfile.saveChanges })
    )

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1))
    expect(updateMyProfile).toHaveBeenCalledWith({
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      birthday: "2000-02-29T00:00:00.000Z",
      phone: initialData.phoneNumber,
    })
  }, 10_000)

  it("accepts a date before 1900 without an age cutoff", async () => {
    const user = userEvent.setup()
    vi.mocked(updateMyProfile).mockResolvedValue({
      success: true,
      data: {} as never,
    })
    renderProfile()

    await selectBirthday("0001-01-01", user)
    expect(
      screen.getByRole("button", { name: /Date of birth/i })
    ).toHaveTextContent("January 1, 1")
    const save = screen.getByRole("button", {
      name: en.accountProfile.saveChanges,
    })
    await waitFor(() => expect(save).toBeEnabled())

    await user.click(save)
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1))
    expect(updateMyProfile).toHaveBeenCalledWith({
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      birthday: "0001-01-01T00:00:00.000Z",
      phone: initialData.phoneNumber,
    })
  }, 10_000)

  it("keeps the required error and disables future calendar dates", async () => {
    const user = userEvent.setup()
    renderProfile()

    const birthday = screen.getByRole("button", { name: /Date of birth/i })
    await user.click(birthday)
    await user.click(
      within(screen.getByRole("grid")).getByRole("button", {
        name: /January 2nd, 1990.*selected/,
      })
    )

    await waitFor(() => {
      expect(birthday).toHaveAttribute("aria-invalid", "true")
      expect(screen.getByRole("alert")).toHaveTextContent(
        en.accountProfile.dateOfBirthRequired
      )
    })
    expect(
      screen.getByRole("button", { name: en.accountProfile.saveChanges })
    ).toBeDisabled()

    await user.click(birthday)
    const today = new Date()
    const monthDays = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate()
    if (today.getDate() < monthDays) {
      const tomorrow = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      )
      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
        timeZone: "UTC",
      }).format(tomorrow)
      await expect(
        within(screen.getByRole("grid")).getByRole("button", {
          name: new RegExp(
            `${monthName} ${tomorrow.getDate()}(?:st|nd|rd|th)?, ${today.getFullYear()}`
          ),
        })
      ).toBeDisabled()
    }
    expect(updateMyProfile).not.toHaveBeenCalled()
  }, 10_000)

  it("uses the UTC day across local timezone boundaries", async () => {
    const originalTimezone = process.env.TZ
    vi.useFakeTimers({ toFake: ["Date"] })

    try {
      for (const boundary of [
        {
          timezone: "Pacific/Kiritimati",
          now: "2026-10-17T12:30:00.000Z",
          localDay: 18,
          birthday: "2026-10-18",
          disabled: true,
        },
        {
          timezone: "Pacific/Honolulu",
          now: "2026-10-17T00:30:00.000Z",
          localDay: 16,
          birthday: "2026-10-17",
          disabled: false,
        },
      ]) {
        process.env.TZ = boundary.timezone
        vi.setSystemTime(new Date(boundary.now))
        expect(new Date().getDate()).toBe(boundary.localDay)

        const user = userEvent.setup({
          advanceTimers: (milliseconds) => vi.advanceTimersByTime(milliseconds),
        })
        renderProfile({ dateOfBirth: boundary.birthday })
        await user.type(
          screen.getByRole("textbox", { name: /Last name/ }),
          " Updated"
        )
        const save = screen.getByRole("button", {
          name: en.accountProfile.saveChanges,
        })
        if (boundary.disabled) {
          await waitFor(() => expect(save).toBeDisabled())
        } else {
          await waitFor(() => expect(save).toBeEnabled())
        }

        const birthday = screen.getByRole("button", {
          name: /Date of birth/i,
        })
        await user.click(birthday)
        const calendar = within(screen.getByRole("grid"))
        const calendarDay = calendar.getByRole("button", {
          name: new RegExp(
            `October ${Number(boundary.birthday.slice(-2))}(?:st|nd|rd|th)?, 2026`
          ),
        })
        if (boundary.disabled) {
          expect(calendarDay).toBeDisabled()
        } else {
          expect(calendarDay).toBeEnabled()
        }
        cleanup()
      }
    } finally {
      cleanup()
      vi.useRealTimers()
      if (originalTimezone === undefined) {
        delete process.env.TZ
      } else {
        process.env.TZ = originalTimezone
      }
    }
  }, 10_000)

  it("restores dirty edits without mutation and normalizes a successful update", async () => {
    const user = userEvent.setup()
    let resolveUpdate: (() => void) | undefined
    vi.mocked(updateMyProfile).mockImplementation(
      () =>
        new Promise<Awaited<ReturnType<typeof updateMyProfile>>>((resolve) => {
          resolveUpdate = () => resolve({ success: true, data: {} as never })
        })
    )
    renderProfile()

    const firstName = screen.getByRole("textbox", { name: /First name/ })
    const restore = screen.getByRole("button", {
      name: en.accountProfile.restore,
    })
    const birthday = screen.getByRole("button", { name: /Date of birth/ })
    const save = screen.getByRole("button", {
      name: en.accountProfile.saveChanges,
    })
    expect(restore).toBeDisabled()
    expect(save).toBeDisabled()

    await user.clear(firstName)
    await user.type(firstName, "  Ada Prime  ")
    await selectBirthday("2000-02-29", user)
    expect(birthday).toHaveTextContent("February 29, 2000")
    expect(restore).toBeEnabled()
    expect(save).toBeEnabled()

    await user.click(restore)
    expect(firstName).toHaveValue(initialData.firstName)
    expect(birthday).toHaveTextContent("January 2, 1990")
    expect(restore).toBeDisabled()
    expect(save).toBeDisabled()
    expect(updateMyProfile).not.toHaveBeenCalled()

    await user.clear(firstName)
    await user.type(firstName, "  Ada Prime  ")
    await user.click(save)
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1))
    expect(birthday).toBeDisabled()
    expect(updateMyProfile).toHaveBeenCalledWith({
      firstName: "Ada Prime",
      lastName: initialData.lastName,
      birthday: `${initialData.dateOfBirth}T00:00:00.000Z`,
      phone: initialData.phoneNumber,
    })
    expect(save).toBeDisabled()
    expect(restore).toBeDisabled()

    await user.click(save)
    expect(updateMyProfile).toHaveBeenCalledTimes(1)

    resolveUpdate?.()
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    expect(firstName).toHaveValue("Ada Prime")
    expect(save).toBeDisabled()
    expect(restore).toBeDisabled()
    expect(toastSuccess).toHaveBeenCalledWith(en.accountProfile.updateSuccess)
  }, 10_000)

  it("retains failed edits and exposes localized recovery feedback", async () => {
    const user = userEvent.setup()
    vi.mocked(updateMyProfile).mockResolvedValue({
      success: false,
      error: "backend detail that must not reach the UI",
    })
    renderProfile()

    const lastName = screen.getByRole("textbox", { name: /Last name/ })
    await user.clear(lastName)
    await user.type(lastName, "  Miller Updated  ")
    await user.click(
      screen.getByRole("button", { name: en.accountProfile.saveChanges })
    )

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(en.accountProfile.updateError)
    )
    expect(lastName).toHaveValue("  Miller Updated  ")
    expect(
      screen.getByRole("button", { name: en.accountProfile.restore })
    ).toBeEnabled()
    expect(screen.queryByText(/backend detail/i)).not.toBeInTheDocument()
  })
})
