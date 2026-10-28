export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export interface PaginationQuery {
  page: number
  size: PageSize
}

type QueryInput =
  URLSearchParams | Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getValue(input: QueryInput, key: string): string | undefined {
  return input instanceof URLSearchParams
    ? (input.get(key) ?? undefined)
    : firstValue(input[key])
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

function parsePageSize(value: string | undefined): PageSize | undefined {
  const parsed = parsePositiveInteger(value)
  return parsed !== undefined && isPageSize(parsed) ? parsed : undefined
}

export function isPageSize(value: number): value is PageSize {
  return PAGE_SIZE_OPTIONS.includes(value as PageSize)
}

export function parsePaginationQuery(input: QueryInput): PaginationQuery {
  const rawPage = getValue(input, "page")
  const rawSize = getValue(input, "size")
  const size =
    rawSize === undefined ? DEFAULT_PAGE_SIZE : parsePageSize(rawSize)

  return {
    page: size ? (parsePositiveInteger(rawPage) ?? 1) : 1,
    size: size ?? DEFAULT_PAGE_SIZE,
  }
}
