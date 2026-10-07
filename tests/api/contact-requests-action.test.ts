import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchAuthenticated, getCurrentPermissions, testDictionary } =
  vi.hoisted(() => ({
    fetchAuthenticated: vi.fn(),
    getCurrentPermissions: vi.fn(),
    testDictionary: {
      contactRequests: {
        permissionDeniedDescription: "Contact request permission required",
      },
    },
  }))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated,
}))
vi.mock("@/app/lib/permissions-server", () => ({
  getCurrentPermissions,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: vi.fn(async () => testDictionary),
}))

import { getContactRequests } from "@/app/api/contact-requests/action"

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

describe("contact request authenticated read action", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(getCurrentPermissions).mockReset()
  })

  it("reads only through authenticated transport using the API page contract", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["contact-request:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue(page)

    await expect(getContactRequests({ page: 2, size: 50 })).resolves.toEqual(
      page
    )
    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/contact-requests?page=1&size=50&sort=createdDate%2Cdesc&sort=id%2Cdesc"
    )
  })

  it("fails closed and does not call the API when permission is unavailable", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([])

    await expect(
      getContactRequests({ page: 1, size: 20 })
    ).rejects.toMatchObject({ status: 403 })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("rejects malformed API responses instead of returning an empty page", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["contact-request:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({ content: null })

    await expect(getContactRequests({ page: 1, size: 20 })).rejects.toThrow(
      "Invalid contact request page response"
    )
  })

  it("rejects a page without content instead of displaying an empty list", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["contact-request:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({})

    await expect(getContactRequests({ page: 1, size: 20 })).rejects.toThrow(
      "Invalid contact request page response"
    )
  })

  it("accepts page metadata omitted by the published OpenAPI schema", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue(["contact-request:read"])
    vi.mocked(fetchAuthenticated).mockResolvedValue({ content: [] })

    await expect(getContactRequests({ page: 1, size: 20 })).resolves.toEqual({
      content: [],
    })
  })
})
