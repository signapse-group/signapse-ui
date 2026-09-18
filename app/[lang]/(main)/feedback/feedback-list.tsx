"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { FEEDBACK_PAGE_SIZE } from "@/app/lib/feedback/definitions"
import type { FeedbackListItemViewModel } from "@/app/lib/feedback/mappers"
import { useLocalization } from "@/app/lib/i18n/provider"
import { LocalizedLink as Link } from "@/components/localized-link"
import { FeedbackComposeDialog } from "@/components/feedback/feedback-compose-dialog"
import { AppPaginationControls } from "@/components/app-pagination-controls"
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
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [composeOpen, setComposeOpen] = React.useState(false)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const records = initialPage?.content ?? []
  const totalPages = Math.max(1, initialPage?.totalPages ?? 1)
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
        <>
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
          <AppPaginationControls
            page={{
              number: page - 1,
              numberOfElements: initialPage?.numberOfElements ?? records.length,
              size: initialPage?.size ?? FEEDBACK_PAGE_SIZE,
              totalElements: initialPage?.totalElements ?? records.length,
              totalPages,
            }}
          />
        </>
      )}

      <FeedbackComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
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
