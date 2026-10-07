"use client"

import { Fragment, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, MessageSquareText } from "lucide-react"

import type { Page } from "@/app/lib/definitions"
import type { ContactRequestResponse } from "@/app/lib/contact-requests/definitions"
import { CONTACT_REQUESTS_PAGE_SIZE_OPTIONS } from "@/app/lib/contact-requests/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import {
  PaginationNavigation,
  PaginationPageSizeSelect,
} from "@/components/app-pagination-controls"
import { useAppPaginationQuery } from "@/components/use-app-pagination-query"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ContactRequestsQuery } from "@/app/lib/contact-requests/query"

interface ContactRequestsListProps {
  page: Page<ContactRequestResponse> | null
  query: ContactRequestsQuery
  errorDescription?: string
  errorTitle?: string
}

const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
}

const timeOptions: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}

export function ContactRequestsList({
  page,
  query,
  errorDescription,
  errorTitle,
}: ContactRequestsListProps) {
  const { dictionary, formatDateTime, formatMessage, formatNumber } =
    useLocalization()
  const t = dictionary.contactRequests
  const router = useRouter()
  const firstRequestKey = page?.content[0]
    ? `${query.page}-${query.size}-${page.content[0].id ?? 0}`
    : null
  const pageKey = `${query.page}-${query.size}-${firstRequestKey ?? "empty"}`
  const [expandedRequest, setExpandedRequest] = useState<{
    pageKey: string
    requestKey: string | null
  }>(() => ({ pageKey, requestKey: firstRequestKey }))
  const expandedRequestKey =
    expandedRequest.pageKey === pageKey
      ? expandedRequest.requestKey
      : firstRequestKey
  const { isPending, setPage, setPageSize } = useAppPaginationQuery({
    defaultSize: query.size,
    totalPages: page?.totalPages,
  })

  if (!page) {
    return (
      <Empty role="alert" className="min-h-[240px] border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareText aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{errorTitle}</EmptyTitle>
          <EmptyDescription>{errorDescription}</EmptyDescription>
        </EmptyHeader>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
        >
          {t.retry}
        </Button>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p>
          {formatMessage(
            page.totalElements === 1
              ? t.requestCountSingular
              : t.requestCountPlural,
            { count: formatNumber(page.totalElements) }
          )}
        </p>
        <p className="text-muted-foreground">{t.newestFirst}</p>
      </div>

      <AppListTable className="mt-0">
        <Table className="min-w-[68rem] table-fixed">
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[14.7%] px-4 font-medium">
                {t.nameLabel}
              </AppListTableHead>
              <AppListTableHead className="w-[21%] px-4 font-medium">
                {t.emailColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[35%] px-4 font-medium">
                {t.messageColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[15%] px-4 font-medium">
                {t.submittedAtColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[14.3%] px-4 text-right font-medium">
                <span className="sr-only">{t.messageActions}</span>
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {page.content.length === 0 ? (
              <AppListTableEmptyState colSpan={5}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquareText aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{t.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            ) : (
              page.content.map((request, index) => {
                const requestKey = `${query.page}-${query.size}-${request.id ?? index}`
                const expandedKey = requestKey
                const detailId = `contact-request-message-${requestKey}`
                const isExpanded = expandedRequestKey === expandedKey
                const message = request.message ?? ""

                return (
                  <Fragment key={expandedKey}>
                    <TableRow data-contact-request-row>
                      <TableCell className="px-4 py-4 font-medium whitespace-normal">
                        {request.name?.trim() ? request.name : t.missingName}
                      </TableCell>
                      <TableCell className="px-4 py-4 break-all">
                        {request.email ?? t.missingValue}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-normal">
                        {message ? (
                          <p className="line-clamp-2 break-words text-foreground">
                            {message}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">
                            {t.missingValue}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm leading-[18px] whitespace-normal text-muted-foreground">
                        {request.createdDate ? (
                          <time
                            dateTime={request.createdDate}
                            className="block"
                          >
                            <span className="block">
                              {formatDateTime(
                                request.createdDate,
                                dateOptions,
                                t.missingValue
                              )}
                            </span>
                            <span className="block">
                              {formatDateTime(
                                request.createdDate,
                                timeOptions,
                                t.missingValue
                              )}
                            </span>
                          </time>
                        ) : (
                          t.missingValue
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        {message ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 px-4 text-xs"
                            aria-expanded={isExpanded}
                            aria-controls={detailId}
                            onClick={() =>
                              setExpandedRequest(
                                {
                                  pageKey,
                                  requestKey: isExpanded ? null : expandedKey,
                                }
                              )
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp aria-hidden="true" />
                            ) : (
                              <ChevronDown aria-hidden="true" />
                            )}
                            {isExpanded ? t.hideFullMessage : t.showFullMessage}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    <TableRow
                      id={detailId}
                      data-contact-request-message
                      hidden={!isExpanded}
                      className="bg-muted/20 hover:bg-muted/20"
                    >
                      <TableCell colSpan={5} className="px-4 py-4 sm:px-6">
                        <div className="flex items-start gap-3">
                          <MessageSquareText
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">
                              {t.messageDetailLabel}
                            </p>
                            <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap">
                              {message}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {page.totalElements > 0
            ? formatMessage(dictionary.pagination.displayedResults, {
                from: formatNumber(page.number * page.size + 1),
                to: formatNumber(
                  Math.min((page.number + 1) * page.size, page.totalElements)
                ),
                total: formatNumber(page.totalElements),
              })
            : dictionary.pagination.noResults}
        </p>
        <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center sm:justify-end">
          <PaginationPageSizeSelect
            value={page.size}
            options={[...CONTACT_REQUESTS_PAGE_SIZE_OPTIONS]}
            isPending={isPending}
            label={t.rowsPerPage}
            onValueChange={setPageSize}
            compactOptions
            triggerClassName="w-16 sm:w-16"
            className="sm:pt-0"
          />
          <PaginationNavigation
            currentPage={page.number + 1}
            totalPageCount={page.totalPages}
            isPending={isPending}
            onPageChange={setPage}
            showWhenSinglePage={page.totalPages > 0}
            className="w-auto shrink-0"
          />
        </div>
      </div>
    </div>
  )
}
