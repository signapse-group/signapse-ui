import { describe, expect, it, vi } from "vitest"
import type { ReactElement } from "react"

const mocks = vi.hoisted(() => ({
  getCurrentPermissions: vi.fn(),
  getServerDictionary: vi.fn(),
  getAllEconomicCalendarEntries: vi.fn(),
}))

vi.mock("@/app/lib/permissions-server", () => ({
  getCurrentPermissions: mocks.getCurrentPermissions,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: mocks.getServerDictionary,
}))
vi.mock("@/app/api/economic-calendar/action", () => ({
  getAllEconomicCalendarEntries: mocks.getAllEconomicCalendarEntries,
}))

import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { AccessDenied } from "@/components/access-denied"
import EconomicCalendarPage from "@/app/[lang]/(main)/economic-calendar/page"

describe("economic calendar page permission boundary", () => {
  it("returns the localized access-denied view without requesting calendar entries", async () => {
    mocks.getCurrentPermissions.mockResolvedValue([])
    mocks.getServerDictionary.mockResolvedValue(viDictionary)

    const element = (await EconomicCalendarPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement<{ description: string; permission: string }>

    expect(element.type).toBe(AccessDenied)
    expect(element.props.description).toBe(
      viDictionary.economicCalendar.readDenied
    )
    expect(element.props.permission).toBe("economic-calendar:read")
    expect(mocks.getAllEconomicCalendarEntries).not.toHaveBeenCalled()
  })
})
