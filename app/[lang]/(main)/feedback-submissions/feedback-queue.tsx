"use client"

import * as React from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  FEEDBACK_MODERATION_PAGE_SIZE_OPTIONS,
  FEEDBACK_STATUSES,
} from "@/app/lib/feedback/definitions"
import type { FeedbackListItemViewModel } from "@/app/lib/feedback/mappers"
import {
  parseFeedbackModerationQuery,
  serializeFeedbackModerationUrlQuery,
} from "@/app/lib/feedback/query"
import { useLocalization } from "@/app/lib/i18n/provider"
import { LocalizedLink as Link } from "@/components/localized-link"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import {
  PaginationNavigation,
  PaginationPageSizeSelect,
} from "@/components/app-pagination-controls"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "../feedback/feedback-presentation"

interface FeedbackQueuePageProps {
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

export function FeedbackQueuePage({
  initialPage,
  initialError,
  initialErrorTitle,
}: FeedbackQueuePageProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const t = dictionary.feedback
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = parseFeedbackModerationQuery(searchParams)
  const [searchValue, setSearchValue] = React.useState(query.search)
  const records = initialPage?.content ?? []
  const totalPages = Math.max(1, initialPage?.totalPages ?? 1)
  const hasNoPageResults =
    Boolean(initialPage) && records.length === 0 && query.page > 1
  const canonicalQuery = serializeFeedbackModerationUrlQuery(query)

  React.useEffect(() => {
    // URL-backed draft state must follow browser Back/Forward changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchValue(query.search)
  }, [query.search])

  React.useEffect(() => {
    if (searchParams.toString() !== canonicalQuery) {
      router.replace(`${pathname}?${canonicalQuery}`)
    }
  }, [canonicalQuery, pathname, router, searchParams])

  function updateQuery(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    router.push(`${pathname}?${next.toString()}`)
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateQuery({ search: searchValue.trim() || null, page: "1" })
  }

  const hasFilters = Boolean(query.search || query.status !== "PENDING_REVIEW")

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.moderationTitle}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t.moderationDescription}
        </p>
      </div>

      <AppListToolbar>
        <AppListToolbarLeading>
          <form
            className="flex min-w-0 flex-1 items-center gap-2"
            onSubmit={submitSearch}
          >
            <label htmlFor="feedback-queue-search" className="sr-only">
              {t.queueSearchLabel}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="feedback-queue-search"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t.queueSearchPlaceholder}
                className="pl-9"
                aria-label={t.queueSearchLabel}
              />
            </div>
            <Button type="submit" variant="outline">
              {t.queueSearchLabel}
            </Button>
          </form>
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <Select
            value={query.status}
            onValueChange={(value) =>
              updateQuery({
                status: value === "PENDING_REVIEW" ? null : value,
                page: "1",
              })
            }
            items={FEEDBACK_STATUSES.map((status) => ({
              value: status,
              label: t.statuses[status],
            }))}
          >
            <SelectTrigger
              aria-label={t.queueStatusLabel}
              className="w-full sm:w-[180px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FEEDBACK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t.statuses[status]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={query.sort}
            onValueChange={(value) =>
              updateQuery({ sort: value || "createdDate_desc", page: "1" })
            }
            items={[
              { value: "createdDate_desc", label: t.queueSortNewest },
              { value: "createdDate_asc", label: t.queueSortOldest },
            ]}
          >
            <SelectTrigger
              aria-label={t.queueSortLabel}
              className="w-full sm:w-[180px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="createdDate_desc">
                  {t.queueSortNewest}
                </SelectItem>
                <SelectItem value="createdDate_asc">
                  {t.queueSortOldest}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </AppListToolbarTrailing>
      </AppListToolbar>

      {initialError ? (
        <QueueEmptyState
          title={initialErrorTitle ?? t.queueErrorTitle}
          description={initialError}
          actionLabel={t.queueRetry}
          onAction={() => router.refresh()}
        />
      ) : records.length === 0 && !hasNoPageResults ? (
        <QueueEmptyState
          title={hasFilters ? t.queueNoResultsTitle : t.queueEmptyTitle}
          description={
            hasFilters ? t.queueNoResultsDescription : t.queueEmptyDescription
          }
          actionLabel={hasFilters ? dictionary.common.reset : t.queueRetry}
          onAction={() =>
            hasFilters
              ? updateQuery({
                  search: null,
                  status: null,
                  sort: null,
                  page: "1",
                })
              : router.refresh()
          }
        />
      ) : hasNoPageResults ? (
        <QueueEmptyState
          title={t.queueNoResultsTitle}
          description={t.queueNoResultsDescription}
          actionLabel={dictionary.common.back}
          onAction={() => updateQuery({ page: "1" })}
        />
      ) : (
        <>
          <AppListTable>
            <Table>
              <TableHeader>
                <AppListTableHeaderRow>
                  <AppListTableHead>{t.queueTitle}</AppListTableHead>
                  <AppListTableHead className="w-48">
                    {t.queueStatus}
                  </AppListTableHead>
                  <AppListTableHead className="w-48">
                    {t.queueDate}
                  </AppListTableHead>
                  <AppListTableHead className="w-32">
                    {t.queueScreenshot}
                  </AppListTableHead>
                </AppListTableHeaderRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="max-w-0 align-top whitespace-normal">
                      <Link
                        href={{
                          pathname: `/feedback-submissions/${record.id}`,
                          query: Object.fromEntries(searchParams.entries()),
                        }}
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

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <PaginationPageSizeSelect
                value={query.size}
                options={[...FEEDBACK_MODERATION_PAGE_SIZE_OPTIONS]}
                isPending={false}
                showLabel
                onValueChange={(value) =>
                  updateQuery({ size: String(value), page: "1" })
                }
              />
              <PaginationNavigation
                currentPage={query.page}
                totalPageCount={totalPages}
                isPending={false}
                onPageChange={(nextPage) =>
                  updateQuery({ page: String(nextPage) })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function QueueEmptyState({
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
          <SlidersHorizontal />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <Button type="button" variant="outline" onClick={onAction}>
        {actionLabel}
      </Button>
    </Empty>
  )
}
