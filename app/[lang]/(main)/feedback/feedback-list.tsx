"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { FeedbackListItemViewModel } from "@/app/lib/feedback/mappers"
import { useLocalization } from "@/app/lib/i18n/provider"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { LocalizedLink as Link } from "@/components/localized-link"
import { FeedbackComposeDialog } from "@/components/feedback/feedback-compose-dialog"
import { AppPaginationFooter } from "@/components/app-pagination-controls"
import { getVisibleItemRange } from "@/components/app-pagination-utils"
import { useAppPaginationQuery } from "@/components/use-app-pagination-query"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Empty,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  FeedbackScreenshotView,
  FeedbackStatusBadge,
} from "./feedback-presentation"

interface FeedbackListPageProps {
  initialPage: {
    content: FeedbackListItemViewModel[]
    totalElements: number
    totalPages: number
    number: number
    size: number
    numberOfElements: number
  } | null
  initialError?: string
  initialErrorTitle?: string
}

export function FeedbackListPage({
  initialPage,
  initialError,
  initialErrorTitle,
}: FeedbackListPageProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [composeOpen, setComposeOpen] = React.useState(false)
  const { page } = parsePaginationQuery(searchParams)
  const { isPending, pageSize, setPage, setPageSize } = useAppPaginationQuery({
    totalPages: initialPage?.totalPages,
  })
  const records = initialPage?.content ?? []
  const hasNoPageResults =
    Boolean(initialPage) && records.length === 0 && page > 1

  function openCompose() {
    setComposeOpen(true)
  }

  function retry() {
    router.refresh()
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {dictionary.feedback.pageTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {dictionary.feedback.pageDescription}
          </p>
        </div>
        <Button type="button" className="shrink-0" onClick={openCompose}>
          <Plus data-icon="inline-start" />
          {dictionary.feedback.newAction}
        </Button>
      </div>

      {initialError ? (
        <EmptyState
          title={initialErrorTitle ?? dictionary.feedback.historyErrorTitle}
          description={initialError}
          actionLabel={dictionary.feedback.historyRetry}
          onAction={retry}
        />
      ) : records.length === 0 && !hasNoPageResults ? (
        <EmptyState
          title={dictionary.feedback.historyEmptyTitle}
          description={dictionary.feedback.historyEmptyDescription}
          actionLabel={dictionary.feedback.newAction}
          onAction={openCompose}
        />
      ) : hasNoPageResults ? (
        <EmptyState
          title={dictionary.feedback.queueNoResultsTitle}
          description={dictionary.feedback.queueNoResultsDescription}
          actionLabel={dictionary.common.back}
          onAction={() => {
            const next = new URLSearchParams(searchParams)
            next.set("page", "1")
            router.push(`${pathname}?${next.toString()}`)
          }}
        />
      ) : (
        <AppListTable>
          <Table>
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead>
                  {dictionary.feedback.contentColumn}
                </AppListTableHead>
                <AppListTableHead className="w-48">
                  {dictionary.feedback.statusColumn}
                </AppListTableHead>
                <AppListTableHead className="w-48">
                  {dictionary.feedback.submittedColumn}
                </AppListTableHead>
                <AppListTableHead className="w-28">
                  {dictionary.feedback.screenshotColumn}
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="max-w-0 align-top whitespace-normal">
                    <Link
                      href={`/feedback/${record.id}`}
                      className="line-clamp-2 font-medium break-words text-foreground hover:underline"
                    >
                      {record.content}
                    </Link>
                  </TableCell>
                  <TableCell className="align-top">
                    <FeedbackStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {formatDateTime(record.createdAt, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="align-top">
                    <FeedbackScreenshotView
                      screenshot={record.screenshot}
                      compact
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppListTable>
      )}

      {initialPage ? (
        <FeedbackPaginationFooter
          page={initialPage}
          pageSize={pageSize}
          isPending={isPending}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <FeedbackComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  )
}

function FeedbackPaginationFooter({
  page,
  pageSize,
  isPending,
  onPageChange,
  onPageSizeChange,
}: {
  page: NonNullable<FeedbackListPageProps["initialPage"]>
  pageSize: number
  isPending: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
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
      currentPage={currentPage}
      pageSize={pageSize}
      totalElements={page.totalElements}
      totalPages={page.totalPages}
      summary={summary}
      isPending={isPending}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  )
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <Empty className="min-h-[280px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Plus />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <Button type="button" onClick={onAction}>
        {actionLabel}
      </Button>
    </Empty>
  )
}
