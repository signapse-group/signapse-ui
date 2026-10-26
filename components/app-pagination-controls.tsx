"use client"

import type { ReactNode } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { Page } from "@/app/lib/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  DOTS,
  getPaginationRange,
  getVisibleItemRange,
} from "./app-pagination-utils"
import { useAppPaginationQuery } from "./use-app-pagination-query"

interface PaginationNavigationProps {
  className?: string
  currentPage: number
  isPending: boolean
  onPageChange: (page: number) => void
  showWhenSinglePage?: boolean
  totalPageCount: number
}

interface PaginationPageSizeSelectProps {
  className?: string
  isPending: boolean
  label?: string
  onValueChange: (value: number) => void
  showLabel?: boolean
  triggerClassName?: string
  value: number
}

interface AppPaginationControlsProps<T> {
  className?: string
  normalizeUrl?: boolean
  page: Pick<
    Page<T>,
    "number" | "numberOfElements" | "size" | "totalElements" | "totalPages"
  >
}

interface AppPaginationFooterProps {
  className?: string
  currentPage: number
  isPending: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSize: number
  summary: ReactNode
  showNavigation?: boolean
  totalElements: number
  totalPages: number
}

export function PaginationPageSizeSelect({
  className,
  isPending,
  label,
  onValueChange,
  showLabel = true,
  triggerClassName,
  value,
}: PaginationPageSizeSelectProps) {
  const { dictionary, formatMessage } = useLocalization()
  const resolvedLabel = label ?? dictionary.pagination.pageSize

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel ? (
        <span className="text-sm text-muted-foreground">{resolvedLabel}</span>
      ) : null}
      <Select
        items={DEFAULT_PAGE_SIZE_OPTIONS.map((option) => ({
          value: option.toString(),
          label: option.toString(),
        }))}
        value={value.toString()}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onValueChange(Number(nextValue))
          }
        }}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn("w-16", triggerClassName)}
          aria-label={resolvedLabel}
          aria-busy={isPending}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {DEFAULT_PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {formatMessage(dictionary.pagination.perPage, {
                  count: option,
                })}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function PaginationNavigation({
  className,
  currentPage,
  isPending,
  onPageChange,
  showWhenSinglePage = false,
  totalPageCount,
}: PaginationNavigationProps) {
  const { dictionary, formatMessage } = useLocalization()
  const paginationRange = getPaginationRange({ currentPage, totalPageCount })

  if (totalPageCount <= 1 && !showWhenSinglePage) {
    return null
  }

  const isPreviousDisabled = currentPage <= 1 || isPending
  const isNextDisabled = currentPage >= totalPageCount || isPending

  return (
    <Pagination
      className={cn(
        "mx-0 w-full justify-start @[600px]/pagination-footer:justify-end",
        className
      )}
      aria-label={dictionary.pagination.navigationLabel}
    >
      <PaginationContent className="flex-wrap justify-start @[600px]/pagination-footer:justify-end">
        <PaginationItem>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={dictionary.pagination.goToPrevious}
            disabled={isPreviousDisabled}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeftIcon data-icon="inline-start" />
          </Button>
        </PaginationItem>

        {paginationRange.map((entry, index) => {
          if (entry === DOTS) {
            return (
              <PaginationItem
                key={`${entry}-${index}`}
                className="hidden @[600px]/pagination-footer:flex"
              >
                <PaginationEllipsis className="size-8" />
              </PaginationItem>
            )
          }

          const isCurrentPage = currentPage === entry

          return (
            <PaginationItem
              key={entry}
              className={
                isCurrentPage
                  ? "flex"
                  : "hidden @[600px]/pagination-footer:flex"
              }
            >
              <Button
                type="button"
                variant={isCurrentPage ? "default" : "outline"}
                size="icon"
                aria-label={formatMessage(dictionary.pagination.goToPage, {
                  page: entry,
                })}
                aria-current={isCurrentPage ? "page" : undefined}
                disabled={isPending}
                onClick={() => {
                  if (!isCurrentPage) {
                    onPageChange(entry)
                  }
                }}
              >
                {entry}
              </Button>
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={dictionary.pagination.goToNext}
            disabled={isNextDisabled}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRightIcon data-icon="inline-start" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export function AppPaginationFooter({
  className,
  currentPage,
  isPending,
  onPageChange,
  onPageSizeChange,
  pageSize,
  summary,
  totalElements,
  showNavigation = totalElements > 0,
  totalPages,
}: AppPaginationFooterProps) {
  const { dictionary } = useLocalization()

  return (
    <div
      data-slot="app-pagination-footer"
      className={cn(
        "@container/pagination-footer flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-col gap-3 @[760px]/pagination-footer:flex-row @[760px]/pagination-footer:items-center @[760px]/pagination-footer:justify-between">
        <p className="text-xs text-muted-foreground">{summary}</p>
        <div className="flex min-w-0 items-center justify-between gap-2 @[760px]/pagination-footer:ml-auto @[760px]/pagination-footer:w-auto @[760px]/pagination-footer:justify-end @[760px]/pagination-footer:gap-4 [@media(max-height:900px)_and_(min-width:768px)]:pr-12">
          <PaginationPageSizeSelect
            value={pageSize}
            isPending={isPending}
            label={dictionary.pagination.pageSize}
            onValueChange={onPageSizeChange}
            className="shrink-0"
          />
          {showNavigation ? (
            <PaginationNavigation
              currentPage={currentPage}
              totalPageCount={Math.max(1, totalPages)}
              isPending={isPending}
              onPageChange={onPageChange}
              showWhenSinglePage
              className="w-auto shrink-0"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AppPaginationSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "@container/pagination-footer flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-col gap-3 @[760px]/pagination-footer:flex-row @[760px]/pagination-footer:items-center @[760px]/pagination-footer:justify-between">
        <Skeleton className="h-4 w-52 max-w-full" />
        <div className="flex min-w-0 items-center justify-between gap-2 @[760px]/pagination-footer:ml-auto @[760px]/pagination-footer:w-auto @[760px]/pagination-footer:justify-end @[760px]/pagination-footer:gap-4 [@media(max-height:900px)_and_(min-width:768px)]:pr-12">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppPaginationControls<T>({
  className,
  normalizeUrl,
  page,
}: AppPaginationControlsProps<T>) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const { isPending, pageSize, setPage, setPageSize } = useAppPaginationQuery({
    normalizeUrl,
    totalPages: page.totalPages,
  })

  const currentPage = page.number + 1
  const visibleItems = getVisibleItemRange({
    currentItemCount: page.numberOfElements,
    currentPage,
    itemsPerPage: page.size,
    totalElements: page.totalElements,
  })

  const summary =
    page.totalElements > 0
      ? formatMessage(dictionary.pagination.displayedResults, {
          from: formatNumber(visibleItems.start),
          to: formatNumber(visibleItems.end),
          total: formatNumber(page.totalElements),
        })
      : dictionary.pagination.noResults

  return (
    <AppPaginationFooter
      className={className}
      currentPage={currentPage}
      pageSize={pageSize}
      totalElements={page.totalElements}
      totalPages={page.totalPages}
      summary={summary}
      isPending={isPending}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  )
}
