"use client"

import { PaginationNavigation } from "@/components/app-pagination-controls"

import { useAppPaginationQuery } from "./use-app-pagination-query"

interface AppPaginationProps {
  className?: string
  itemsPerPage: number
  totalElements: number
}

export function AppPagination({
  className,
  itemsPerPage,
  totalElements,
}: AppPaginationProps) {
  const totalPages =
    itemsPerPage > 0 ? Math.ceil(totalElements / itemsPerPage) : 0

  const { currentPage, isPending, setPage } = useAppPaginationQuery({
    totalPages,
  })

  return (
    <PaginationNavigation
      className={className}
      currentPage={currentPage}
      totalPageCount={totalPages}
      isPending={isPending}
      onPageChange={setPage}
    />
  )
}
