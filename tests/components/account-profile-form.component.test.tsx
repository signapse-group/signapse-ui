// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
  phoneNumber: "+1 555 0100",
}

function renderProfile(overrides: Partial<AccountProfileInitialData> = {}) {
  return render(
    <LocalizationProvider locale="en" dictionary={en}>
      <AccountProfileForm initialData={{ ...initialData, ...overrides }} />
    </LocalizationProvider>
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
    const dateOfBirth = screen.getByLabelText(/Date of birth/i)
    expect(dateOfBirth).toHaveAttribute("type", "date")
    expect(dateOfBirth).toBeRequired()
    expect(screen.getByRole("textbox", { name: /Phone number/ })).toBeRequired()
    expect(
      screen.queryByRole("button", { name: /upload|delete|replace/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/billing|payment|package|plan|upgrade|subscription/i)
    ).not.toBeInTheDocument()

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

  it("keeps leap-day selection in the API date-time without shifting it", async () => {
    const user = userEvent.setup()
    vi.mocked(updateMyProfile).mockResolvedValue({
      success: true,
      data: {} as never,
    })
    renderProfile()

    const dateOfBirth = screen.getByLabelText(/Date of birth/i)
    fireEvent.change(dateOfBirth, { target: { value: "2000-02-29" } })
    expect(dateOfBirth).toHaveValue("2000-02-29")

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
  })

  it("accepts a date before 1900 without an age cutoff", async () => {
    const user = userEvent.setup()
    vi.mocked(updateMyProfile).mockResolvedValue({
      success: true,
      data: {} as never,
    })
    renderProfile()

    const dateOfBirth = screen.getByLabelText(/Date of birth/i)
    fireEvent.change(dateOfBirth, { target: { value: "0001-01-01" } })
    expect(dateOfBirth).toHaveValue("0001-01-01")
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
  })

  it("rejects a future date before saving", async () => {
    renderProfile()

    const dateOfBirth = screen.getByLabelText(/Date of birth/i)
    fireEvent.change(dateOfBirth, { target: { value: "2100-01-01" } })

    await waitFor(() => {
      expect(dateOfBirth).toHaveAttribute("aria-invalid", "true")
      expect(screen.getByRole("alert")).toHaveTextContent(
        en.accountProfile.dateOfBirthInvalid
      )
    })
    expect(
      screen.getByRole("button", { name: en.accountProfile.saveChanges })
    ).toBeDisabled()
    expect(updateMyProfile).not.toHaveBeenCalled()
  })

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
    const save = screen.getByRole("button", {
      name: en.accountProfile.saveChanges,
    })
    expect(restore).toBeDisabled()
    expect(save).toBeDisabled()

    await user.clear(firstName)
    await user.type(firstName, "  Ada Prime  ")
    expect(restore).toBeEnabled()
    expect(save).toBeEnabled()

    await user.click(restore)
    expect(firstName).toHaveValue(initialData.firstName)
    expect(restore).toBeDisabled()
    expect(save).toBeDisabled()
    expect(updateMyProfile).not.toHaveBeenCalled()

    await user.clear(firstName)
    await user.type(firstName, "  Ada Prime  ")
    await user.click(save)
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1))
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
  })

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
