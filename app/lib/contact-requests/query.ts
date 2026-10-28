import { CONTACT_REQUESTS_PAGE_SIZE_OPTIONS } from "./definitions"
import { parsePaginationQuery } from "@/app/lib/pagination/query"

export interface ContactRequestsQuery {
  /** One-based page number used by the dashboard URL. */
  page: number
  size: (typeof CONTACT_REQUESTS_PAGE_SIZE_OPTIONS)[number]
}

export function parseContactRequestsQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>
): ContactRequestsQuery {
  return parsePaginationQuery(input)
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
