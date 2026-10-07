import { describe, expect, it } from "vitest"

import {
  CONTACT_REQUESTS_DEFAULT_PAGE_SIZE,
  CONTACT_REQUESTS_PAGE_SIZE_OPTIONS,
  contactRequestPageResponseSchema,
  contactRequestResponseSchema,
} from "@/app/lib/contact-requests/definitions"
import {
  parseContactRequestsQuery,
  serializeContactRequestsQuery,
} from "@/app/lib/contact-requests/query"

const page = {
  content: [],
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
  first: true,
  numberOfElements: 0,
  empty: true,
}

describe("contact requests API contract", () => {
  it("accepts nullable names and preserves Unicode and multiline messages", () => {
    const message = "Xin chào 👋\nDòng thứ hai: <script>alert(1)</script>"
    const parsed = contactRequestResponseSchema.parse({
      id: 42,
      email: "visitor@example.test",
      name: null,
      message,
      createdDate: "2026-10-07T04:00:00Z",
    })

    expect(parsed.name).toBeNull()
    expect(parsed.message).toBe(message)
    expect(contactRequestResponseSchema.safeParse({}).success).toBe(false)
  })

  it("validates the page envelope and rejects malformed records", () => {
    expect(contactRequestPageResponseSchema.parse(page).content).toEqual([])
    expect(contactRequestPageResponseSchema.parse({})).toEqual({})
    expect(
      contactRequestPageResponseSchema.parse({
        content: [],
        pageable: {},
      })
    ).toEqual({ content: [], pageable: {} })
    expect(
      contactRequestPageResponseSchema.safeParse({ ...page, content: null })
        .success
    ).toBe(false)
    expect(
      contactRequestResponseSchema.safeParse({
        email: "not-an-email",
      }).success
    ).toBe(false)
    expect(
      contactRequestResponseSchema.safeParse({
        message: "x".repeat(5001),
      }).success
    ).toBe(false)
  })
})

describe("contact request pagination contract", () => {
  it("uses the design system page sizes and normalizes dashboard pages", () => {
    expect(CONTACT_REQUESTS_DEFAULT_PAGE_SIZE).toBe(10)
    expect(CONTACT_REQUESTS_PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100])
    expect(parseContactRequestsQuery({})).toEqual({ page: 1, size: 10 })
    expect(parseContactRequestsQuery({ page: "3", size: "100" })).toEqual({
      page: 3,
      size: 100,
    })
    expect(parseContactRequestsQuery({ page: "-1", size: "101" })).toEqual({
      page: 1,
      size: 10,
    })
    expect(parseContactRequestsQuery({ page: ["2", "4"], size: "50" })).toEqual(
      { page: 2, size: 50 }
    )
  })

  it("serializes a one-based dashboard page to the zero-based API contract", () => {
    const params = new URLSearchParams(
      serializeContactRequestsQuery({ page: 2, size: 50 })
    )

    expect(params.get("page")).toBe("1")
    expect(params.get("size")).toBe("50")
    expect(params.getAll("sort")).toEqual(["createdDate,desc", "id,desc"])
  })
})
