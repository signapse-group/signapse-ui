"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useTransition } from "react"

import { isPageSize, parsePaginationQuery } from "@/app/lib/pagination/query"

export function useAppPaginationQuery({
  normalizeUrl = true,
  totalPages,
}: {
  normalizeUrl?: boolean
  totalPages?: number
}) {
  const pathname = usePathname()
  const { push, replace } = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const { page: currentPage, size: pageSize } =
    parsePaginationQuery(searchParams)

  const maxPage =
    typeof totalPages === "number" && totalPages > 0
      ? totalPages
      : Number.POSITIVE_INFINITY

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const rawPage = searchParams.get("page")
    const rawSize = searchParams.get("size")
    let shouldReplace = false

    if (rawPage !== null && rawPage !== currentPage.toString()) {
      params.set("page", currentPage.toString())
      shouldReplace = true
    }

    if (rawSize !== null && rawSize !== pageSize.toString()) {
      params.set("size", pageSize.toString())
      params.set("page", "1")
      shouldReplace = true
    }

    const lastPage = Math.max(totalPages ?? 1, 1)
    if (totalPages !== undefined && currentPage > lastPage) {
      params.set("page", lastPage.toString())
      shouldReplace = true
    }

    if (normalizeUrl && shouldReplace) {
      const query = params.toString()
      replace(query ? `${pathname}?${query}` : pathname)
    }
  }, [
    currentPage,
    normalizeUrl,
    pageSize,
    pathname,
    replace,
    searchParams,
    totalPages,
  ])

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString()

    startTransition(() => {
      push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const setPage = (page: number) => {
    if (isPending || !Number.isSafeInteger(page) || page <= 0) {
      return
    }

    if (page === currentPage || page > maxPage) {
      return
    }

    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    pushParams(params)
  }

  const setPageSize = (size: number) => {
    if (isPending || !Number.isSafeInteger(size) || size === pageSize) {
      return
    }

    if (!isPageSize(size)) return

    const params = new URLSearchParams(searchParams)
    params.set("size", size.toString())
    params.set("page", "1")
    pushParams(params)
  }

  return {
    currentPage,
    isPending,
    pageSize,
    setPage,
    setPageSize,
  }
}
