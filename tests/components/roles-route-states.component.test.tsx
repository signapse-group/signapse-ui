// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import RoleDetailLoading from "@/app/[lang]/(main)/roles/[roleKey]/loading"
import RolesError from "@/app/[lang]/(main)/roles/error"

const mocks = vi.hoisted(() => ({
  getServerDictionary: vi.fn(),
  useParams: vi.fn(),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: mocks.getServerDictionary,
}))

vi.mock("next/navigation", () => ({ useParams: mocks.useParams }))

beforeEach(() => {
  mocks.getServerDictionary.mockReset()
  mocks.useParams.mockReset()
})

afterEach(() => cleanup())

describe("role route loading and error states", () => {
  it.each([
    { locale: "en" as const, dictionary: en },
    { locale: "vi" as const, dictionary: viDictionary },
  ])(
    "shows a localized detail heading and busy status in $locale",
    async ({ locale, dictionary }) => {
      mocks.getServerDictionary.mockResolvedValue(dictionary)

      render(
        <LocalizationProvider locale={locale} dictionary={dictionary}>
          {await RoleDetailLoading()}
        </LocalizationProvider>
      )

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: dictionary.roles.detailPageTitle,
        })
      ).toHaveClass("sr-only")
      expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
      expect(screen.getByText(dictionary.roles.loadingRole)).toBeInTheDocument()
    }
  )

  it("keeps list errors fluid and detail errors within the detail width", () => {
    mocks.useParams.mockReturnValue({})
    const reset = vi.fn()
    const { rerender } = render(
      <LocalizationProvider locale="en" dictionary={en}>
        <RolesError error={new Error("list failed")} reset={reset} />
      </LocalizationProvider>
    )

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: en.roles.loadErrorTitle,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("alert").className).not.toContain("max-w-2xl")

    mocks.useParams.mockReturnValue({ roleKey: "CONTENT_REVIEWER" })
    rerender(
      <LocalizationProvider locale="en" dictionary={en}>
        <RolesError error={new Error("detail failed")} reset={reset} />
      </LocalizationProvider>
    )

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: en.roles.loadErrorTitle,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("alert").className).toContain("max-w-2xl")
  })
})
