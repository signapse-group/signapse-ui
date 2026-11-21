// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import EconomicCalendarError from "@/app/[lang]/(main)/economic-calendar/error"

afterEach(cleanup)

describe("EconomicCalendarError", () => {
  it("shows localized safe copy instead of exposing the backend error message", () => {
    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <EconomicCalendarError
          error={new Error("internal backend detail")}
          reset={() => {}}
        />
      </LocalizationProvider>
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.economicCalendar.errorDescription
    )
    expect(
      screen.queryByText("internal backend detail")
    ).not.toBeInTheDocument()
  })
})
