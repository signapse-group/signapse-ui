import {
  CONTACT_REQUESTS_DEFAULT_PAGE_SIZE,
  CONTACT_REQUESTS_PAGE_SIZE_OPTIONS,
} from "./definitions"

export interface ContactRequestsQuery {
  /** One-based page number used by the dashboard URL. */
  page: number
  size: (typeof CONTACT_REQUESTS_PAGE_SIZE_OPTIONS)[number]
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function isPositiveInteger(value: string | undefined): boolean {
  if (!value || !/^\d+$/.test(value)) return false
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0
}

export function parseContactRequestsQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>
): ContactRequestsQuery {
  const get = (key: string) =>
    input instanceof URLSearchParams
      ? (input.get(key) ?? undefined)
      : firstValue(input[key])
  const requestedPage = get("page")
  const requestedSize = Number(get("size"))

  return {
    page: isPositiveInteger(requestedPage) ? Number(requestedPage) : 1,
    size: CONTACT_REQUESTS_PAGE_SIZE_OPTIONS.includes(
      requestedSize as (typeof CONTACT_REQUESTS_PAGE_SIZE_OPTIONS)[number]
    )
      ? (requestedSize as (typeof CONTACT_REQUESTS_PAGE_SIZE_OPTIONS)[number])
      : CONTACT_REQUESTS_DEFAULT_PAGE_SIZE,
  }
}

export function serializeContactRequestsQuery(
  query: ContactRequestsQuery
): string {
  const params = new URLSearchParams()
  params.set("page", String(Math.max(0, query.page - 1)))
  params.set("size", String(query.size))
  params.append("sort", "createdDate,desc")
  params.append("sort", "id,desc")
  return params.toString()
}
