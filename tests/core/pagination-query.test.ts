import { describe, expect, it } from "vitest"

import { parsePaginationQuery } from "@/app/lib/pagination/query"

describe("dashboard pagination query", () => {
  it("defaults to page 1 and the first supported page size", () => {
    expect(parsePaginationQuery({})).toEqual({ page: 1, size: 10 })
  })

  it("accepts only positive integer pages and supported sizes", () => {
    for (const size of [10, 20, 50, 100]) {
      expect(parsePaginationQuery({ page: "3", size: String(size) })).toEqual({
        page: 3,
        size,
      })
    }

    for (const page of ["0", "-1", "1.5", "1e2", "invalid"]) {
      expect(parsePaginationQuery({ page, size: "20" })).toEqual({
        page: 1,
        size: 20,
      })
    }
  })

  it.each(["2", "0"])(
    "resets page=%s and size when the requested size is unsupported",
    (page) => {
      expect(parsePaginationQuery({ page, size: "25" })).toEqual({
        page: 1,
        size: 10,
      })
    }
  )

  it("reads the first value from repeated server search params", () => {
    expect(
      parsePaginationQuery({ page: ["2", "4"], size: ["50", "100"] })
    ).toEqual({
      page: 2,
      size: 50,
    })
  })
})
