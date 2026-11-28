import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ fetchAuthenticated: vi.fn() }))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: mocks.fetchAuthenticated,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/lib/i18n/dictionaries", () => ({ getDictionary: vi.fn() }))
vi.mock("@/app/lib/i18n/server", () => ({ getRequestLocale: vi.fn() }))

import {
  getAllEconomicCalendarEntries,
  getEconomicCalendarEntries,
} from "@/app/api/economic-calendar/action"
import type { Page, SearchParams } from "@/app/lib/definitions"
import type { EconomicCalendarListResponse } from "@/app/lib/economic-calendar/definitions"

function entry(id: number): EconomicCalendarListResponse {
  return {
    id,
    title: `Release ${id}`,
    currencyCode: "USD",
    type: null,
    impact: "HIGH",
    forecastValue: null,
    previousValue: null,
    actualValue: null,
    description: null,
    revision: null,
    newsUrl: null,
    actualBetterWorse: null,
    revisionBetterWorse: null,
    status: "PENDING",
    scheduledAt: "2026-11-21T01:00:00Z",
    syncedAt: null,
    createdDate: "2026-11-20T00:00:00Z",
    lastModifiedDate: null,
  }
}

function page(
  content: EconomicCalendarListResponse[],
  number: number,
  last: boolean,
  totalPages: number
): Page<EconomicCalendarListResponse> {
  return {
    content,
    pageable: {
      pageNumber: number,
      pageSize: 2000,
      offset: number * 2000,
      paged: true,
      unpaged: false,
    },
    last,
    totalElements: totalPages === 1 ? content.length : 2001,
    totalPages,
    size: 2000,
    number,
    first: number === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

function parseRequest(path: string) {
  return new URL(path, "https://dashboard.example")
}

describe("economic calendar API queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends the supported filters, page, size, and scheduledAt sort at the HTTP boundary", async () => {
    const filter =
      "scheduledAt ge '2026-11-21T00:00:00+07:00' and currencyCode eq 'USD' and impact eq 'HIGH'"
    mocks.fetchAuthenticated.mockResolvedValue(page([entry(1)], 0, true, 1))

    await getEconomicCalendarEntries({
      filter,
      page: 0,
      size: 2000,
      sort: [{ field: "scheduledAt", direction: "asc" }],
    })

    const request = parseRequest(mocks.fetchAuthenticated.mock.calls[0][0])
    expect(request.pathname).toBe("/economic-calendar")
    expect(request.searchParams.get("$filter")).toBe(filter)
    expect(request.searchParams.get("page")).toBe("0")
    expect(request.searchParams.get("size")).toBe("2000")
    expect(request.searchParams.get("sort")).toBe("scheduledAt,asc")
  })

  it("reads every page through Page.last while retaining the same filter and sort", async () => {
    const firstPage = page([entry(1), entry(2)], 0, false, 2)
    const secondPage = page([entry(3)], 1, true, 2)
    mocks.fetchAuthenticated.mockImplementation(async (path: string) => {
      const request = parseRequest(path)
      return request.searchParams.get("page") === "0" ? firstPage : secondPage
    })

    const searchParams: SearchParams = {
      filter: "currencyCode eq 'USD' and impact eq 'HIGH'",
      page: 9,
      size: 500,
      sort: [{ field: "scheduledAt", direction: "desc" }],
    }

    const entries = await getAllEconomicCalendarEntries(searchParams)

    expect(entries.map((item) => item.id)).toEqual([1, 2, 3])
    const requests = mocks.fetchAuthenticated.mock.calls.map(([path]) =>
      parseRequest(path)
    )
    expect(requests.map((request) => request.searchParams.get("page"))).toEqual(
      ["0", "1"]
    )
    for (const request of requests) {
      expect(request.searchParams.get("size")).toBe("2000")
      expect(request.searchParams.get("$filter")).toBe(searchParams.filter)
      expect(request.searchParams.get("sort")).toBe("scheduledAt,desc")
    }
  })
})
