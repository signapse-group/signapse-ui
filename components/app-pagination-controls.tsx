"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Page } from "@/app/lib/definitions"
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
  siblingCount?: number
  totalPageCount: number
}

interface PaginationPageSizeSelectProps {
  className?: string
  isPending: boolean
  label?: string
  onValueChange: (value: number) => void
  options?: readonly number[] | number[]
  showLabel?: boolean
  compactOptions?: boolean
  triggerClassName?: string
  value: number
}

interface AppPaginationControlsProps<T> {
  className?: string
  page: Pick<
    Page<T>,
    "number" | "numberOfElements" | "size" | "totalElements" | "totalPages"
  >
}

export function PaginationPageSizeSelect({
  className,
  isPending,
  label,
  onValueChange,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  showLabel = true,
  compactOptions = false,
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
        items={options.map((option) => ({
          value: option.toString(),
          label: compactOptions
            ? option.toString()
            : formatMessage(dictionary.pagination.perPage, {
                count: option,
              }),
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
          className={cn("w-full sm:w-[120px]", triggerClassName)}
          aria-label={resolvedLabel}
          aria-busy={isPending}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {options.map((option) => (
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
  siblingCount = 1,
  totalPageCount,
}: PaginationNavigationProps) {
  const { dictionary, formatMessage } = useLocalization()
  const paginationRange = getPaginationRange({
    currentPage,
    siblingCount,
    totalPageCount,
  })

  if (totalPageCount <= 1 && !showWhenSinglePage) {
    return null
  }

  const isPreviousDisabled = currentPage <= 1 || isPending
  const isNextDisabled = currentPage >= totalPageCount || isPending

  return (
    <Pagination
      className={cn("mx-0 w-full justify-start sm:justify-end", className)}
      aria-label={dictionary.pagination.navigationLabel}
    >
      <PaginationContent className="flex-wrap justify-start sm:justify-end">
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
              <PaginationItem key={`${entry}-${index}`}>
                <PaginationEllipsis className="size-8" />
              </PaginationItem>
            )
          }

          const isCurrentPage = currentPage === entry

          return (
            <PaginationItem key={entry}>
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

export function AppPaginationControls<T>({
  className,
  page,
}: AppPaginationControlsProps<T>) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const { isPending, setPage } = useAppPaginationQuery({
    defaultSize: page.size,
    totalPages: page.totalPages,
  })

  const currentPage = page.number + 1
  const visibleItems = getVisibleItemRange({
    currentItemCount: page.numberOfElements,
    currentPage,
    itemsPerPage: page.size,
    totalElements: page.totalElements,
  })

  const summaryText =
    page.totalElements > 0
      ? formatMessage(dictionary.pagination.displayedResults, {
          from: formatNumber(visibleItems.start),
          to: formatNumber(visibleItems.end),
          total: formatNumber(page.totalElements),
        })
      : dictionary.pagination.noResults

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-muted/20 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">{summaryText}</p>
        </div>

        {page.totalPages > 1 ? (
          <PaginationNavigation
            className="w-full sm:w-auto"
            currentPage={currentPage}
            totalPageCount={page.totalPages}
            isPending={isPending}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </div>
  )
}
