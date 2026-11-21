import { describe, expect, it } from "vitest"

import {
  ECONOMIC_CALENDAR_FILTER_PARAMS,
  buildEconomicCalendarFilter,
  clearEconomicCalendarFilters,
  getUtc7DateKeyFromTimestamp,
  setEconomicCalendarFilter,
} from "@/app/[lang]/(main)/economic-calendar/economic-calendar-date"

describe("economic calendar filters", () => {
  it("combines only published date, title, currency, and impact filters", () => {
    expect(
      buildEconomicCalendarFilter("2026-11-21", {
        [ECONOMIC_CALENDAR_FILTER_PARAMS.title]: "inflation",
        [ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode]: "USD",
        [ECONOMIC_CALENDAR_FILTER_PARAMS.impact]: "HIGH",
        "unsupportedField[eq]": "ignored",
      })
    ).toBe(
      "scheduledAt ge '2026-11-21T00:00:00+07:00' and scheduledAt lt '2026-11-22T00:00:00+07:00' and containsIgnoreCase(title,'inflation') and currencyCode eq 'USD' and impact eq 'HIGH'"
    )
  })

  it("keeps the selected day half-open at the UTC+07:00 boundaries", () => {
    expect(getUtc7DateKeyFromTimestamp("2026-11-20T16:59:59.999Z")).toBe(
      "2026-11-20"
    )
    expect(getUtc7DateKeyFromTimestamp("2026-11-20T17:00:00Z")).toBe(
      "2026-11-21"
    )
    expect(getUtc7DateKeyFromTimestamp("2026-11-21T17:00:00Z")).toBe(
      "2026-11-22"
    )
  })

  it("removes one filter or clears both while retaining date, title, and sort", () => {
    const current = new URLSearchParams(
      "date=2026-11-21&title%5BcontainsIgnoreCase%5D=inflation&sort=scheduledAt_desc&currencyCode%5Beq%5D=USD&impact%5Beq%5D=HIGH"
    )

    const withoutCurrency = setEconomicCalendarFilter(
      current,
      ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode,
      ""
    )
    expect(
      withoutCurrency.get(ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode)
    ).toBe(null)
    expect(withoutCurrency.get(ECONOMIC_CALENDAR_FILTER_PARAMS.impact)).toBe(
      "HIGH"
    )
    expect(withoutCurrency.get("date")).toBe("2026-11-21")
    expect(withoutCurrency.get(ECONOMIC_CALENDAR_FILTER_PARAMS.title)).toBe(
      "inflation"
    )
    expect(withoutCurrency.get("sort")).toBe("scheduledAt_desc")

    const cleared = clearEconomicCalendarFilters(current)
    expect(cleared.get(ECONOMIC_CALENDAR_FILTER_PARAMS.currencyCode)).toBeNull()
    expect(cleared.get(ECONOMIC_CALENDAR_FILTER_PARAMS.impact)).toBeNull()
    expect(cleared.get("date")).toBe("2026-11-21")
    expect(cleared.get(ECONOMIC_CALENDAR_FILTER_PARAMS.title)).toBe("inflation")
    expect(cleared.get("sort")).toBe("scheduledAt_desc")
  })
})
