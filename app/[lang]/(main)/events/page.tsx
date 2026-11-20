import { Suspense } from "react"

import { getEvents } from "@/app/api/events/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { EVENT_READ_PERMISSIONS } from "@/app/lib/events/permissions"
import { hasAnyPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildFilterQuery, buildSortQuery } from "@/app/lib/utils"
import { AccessDenied } from "@/components/access-denied"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { AppPaginationSkeleton } from "@/components/app-pagination-controls"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { EventList } from "./event-list"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()
  const pageHeading = (
    <h1 className="sr-only">{dictionary.navigation.events}</h1>
  )

  if (!hasAnyPermission(permissions, EVENT_READ_PERMISSIONS)) {
    return (
      <>
        {pageHeading}
        <div role="alert" aria-live="assertive">
          <AccessDenied
            description={dictionary.events.readDenied}
            permission={EVENT_READ_PERMISSIONS[0]}
          />
        </div>
      </>
    )
  }

  const params = await searchParams
  const { page, size } = parsePaginationQuery(params)
  const sort = typeof params.sort === "string" ? params.sort : "occurredAt_desc"

  return (
    <>
      {pageHeading}
      <Suspense fallback={<EventListSkeleton dictionary={dictionary} />}>
        <EventListContent
          page={page}
          size={size}
          sort={sort}
          searchParams={params}
          dictionary={dictionary}
        />
      </Suspense>
    </>
  )
}

async function EventListContent({
  page,
  size,
  sort,
  searchParams,
  dictionary,
}: {
  page: number
  size: number
  sort: string
  searchParams: { [key: string]: string | string[] | undefined }
  dictionary: Dictionary
}) {
  const filter = buildFilterQuery(searchParams)
  const sortQuery = buildSortQuery(sort)
  const result = await loadEventPage({
    page: page - 1,
    size,
    filter,
    sort: sortQuery,
  })

  if (result.kind === "error") {
    const error = result.error
    if (error instanceof Error && "status" in error && error.status === 403) {
      return (
        <div role="alert" aria-live="assertive">
          <AccessDenied
            description={dictionary.events.readDenied}
            permission={EVENT_READ_PERMISSIONS[0]}
          />
        </div>
      )
    }

    throw error
  }

  return <EventList eventPage={result.eventPage} hasSearch={Boolean(filter)} />
}

async function loadEventPage(input: Parameters<typeof getEvents>[0]) {
  try {
    return { kind: "success" as const, eventPage: await getEvents(input) }
  } catch (error) {
    return { kind: "error" as const, error }
  }
}

function EventListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div
      className="flex flex-col"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{dictionary.events.loading}</span>
      <div aria-hidden="true">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-96" />
          <Skeleton className="h-9 w-full sm:w-[200px]" />
        </div>

        <div className="hidden md:block">
          <AppListTable>
            <Table>
              <TableHeader>
                <AppListTableHeaderRow>
                  <AppListTableHead className="w-[44%]">
                    {dictionary.events.eventColumn}
                  </AppListTableHead>
                  <AppListTableHead className="w-44">
                    {dictionary.events.timeColumn}
                  </AppListTableHead>
                  <AppListTableHead className="w-28">
                    {dictionary.events.confidenceColumn}
                  </AppListTableHead>
                  <AppListTableHead className="w-20 text-right">
                    {dictionary.events.actionsColumn}
                  </AppListTableHead>
                </AppListTableHeaderRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex min-w-0 flex-col gap-2">
                        <Skeleton className="h-4 w-[260px]" />
                        <Skeleton className="h-3 w-[220px]" />
                        <Skeleton className="h-3 w-[160px]" />
                      </div>
                    </TableCell>
                    <TableCell className="w-44">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="w-28">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="w-20 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AppListTable>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:hidden">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <Skeleton className="mx-auto mt-2 h-11 w-11 rounded-lg" />
            </div>
          ))}
        </div>

        <AppPaginationSkeleton className="mt-4" />
      </div>
    </div>
  )
}
