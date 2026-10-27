"use client"

import { PAGE_SIZE_OPTIONS } from "@/app/lib/pagination/query"

export const DOTS = "..." as const

export type PaginationEntry = number | typeof DOTS

export const DEFAULT_PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS

const range = (start: number, end: number) => {
  const length = end - start + 1

  return Array.from({ length }, (_, index) => index + start)
}

export function getPaginationRange({
  currentPage,
  totalPageCount,
}: {
  currentPage: number
  totalPageCount: number
}): PaginationEntry[] {
  if (totalPageCount <= 0) {
    return []
  }

  if (totalPageCount <= 7) {
    return range(1, totalPageCount)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, DOTS, totalPageCount]
  }

  if (currentPage >= totalPageCount - 3) {
    return [1, DOTS, ...range(totalPageCount - 3, totalPageCount)]
  }

  return [
    1,
    DOTS,
    ...range(currentPage - 1, currentPage + 1),
    DOTS,
    totalPageCount,
  ]
}

export function getVisibleItemRange({
  currentItemCount,
  currentPage,
  itemsPerPage,
  totalElements,
}: {
  currentItemCount: number
  currentPage: number
  itemsPerPage: number
  totalElements: number
}) {
  if (totalElements <= 0 || currentItemCount <= 0 || itemsPerPage <= 0) {
    return { start: 0, end: 0 }
  }

  const start = (currentPage - 1) * itemsPerPage + 1
  const end = start + currentItemCount - 1

  return {
    start,
    end: Math.min(end, totalElements),
  }
}
