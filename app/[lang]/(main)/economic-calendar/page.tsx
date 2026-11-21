import { Suspense } from "react"

import { getAllEconomicCalendarEntries } from "@/app/api/economic-calendar/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { ECONOMIC_CALENDAR_READ_PERMISSIONS } from "@/app/lib/economic-calendar/permissions"
import { hasAnyPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildSortQuery } from "@/app/lib/utils"
import { AccessDenied } from "@/components/access-denied"
import {
  AppListTable,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { EconomicCalendarList } from "./economic-calendar-list"
import {
  type EconomicCalendarScheduledSort,
  buildEconomicCalendarFilter,
  getEconomicCalendarDateState,
  normalizeEconomicCalendarSort,
} from "./economic-calendar-date"

interface EconomicCalendarPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EconomicCalendarPage({
  searchParams,
}: EconomicCalendarPageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()

  if (!hasAnyPermission(permissions, ECONOMIC_CALENDAR_READ_PERMISSIONS)) {
    return (
      <AccessDenied
        description={dictionary.economicCalendar.readDenied}
        permission={ECONOMIC_CALENDAR_READ_PERMISSIONS[0]}
      />
    )
  }

  const params = await searchParams
  const sort = normalizeEconomicCalendarSort(params.sort)
  const dateState = getEconomicCalendarDateState(params.date)

  return (
    <Suspense
      fallback={<EconomicCalendarListSkeleton dictionary={dictionary} />}
    >
      <EconomicCalendarListContent
        sort={sort}
        searchParams={params}
        dateState={dateState}
      />
    </Suspense>
  )
}

async function EconomicCalendarListContent({
  sort,
  searchParams,
  dateState,
}: {
  sort: EconomicCalendarScheduledSort
  searchParams: { [key: string]: string | string[] | undefined }
  dateState: ReturnType<typeof getEconomicCalendarDateState>
}) {
  const filter = buildEconomicCalendarFilter(
    dateState.selectedDate,
    searchParams
  )
  const economicCalendarEntries = await getAllEconomicCalendarEntries({
    filter,
    sort: buildSortQuery(sort),
  })

  return (
    <EconomicCalendarList
      economicCalendarEntries={economicCalendarEntries}
      sort={sort}
      dateState={dateState}
    />
  )
}

function EconomicCalendarListSkeleton({
  dictionary,
}: {
  dictionary: Dictionary
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:w-[180px]" />
          <Skeleton className="h-9 w-full sm:max-w-sm" />
        </div>
        <div
          data-slot="app-list-toolbar-trailing"
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
        >
          <Skeleton className="h-11 w-full min-[768px]:hidden" />
          <Skeleton className="hidden h-9 w-[140px] min-[768px]:block" />
          <Skeleton className="hidden h-9 w-[140px] min-[768px]:block" />
          <Skeleton className="h-9 w-full sm:w-[200px]" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Skeleton className="h-8 w-40" />
      </div>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.timeColumn}
              </AppListTableHead>
              <AppListTableHead className="w-24">
                {dictionary.economicCalendar.currencyColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.impactColumn}
              </AppListTableHead>
              <AppListTableHead className="min-w-72">
                {dictionary.economicCalendar.eventColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.actual}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.forecast}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {dictionary.economicCalendar.previous}
              </AppListTableHead>
              <AppListTableHead className="w-20 text-right">
                {dictionary.economicCalendar.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={8} className="px-3 py-2">
                <Skeleton className="h-4 w-44" />
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableCell rowSpan={3} className="w-28 bg-muted/10 align-top">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell rowSpan={3} className="w-24 bg-muted/5 align-top">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="w-28 align-top">
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell className="min-w-72 align-top whitespace-normal">
                <div className="flex min-w-0 flex-col gap-2">
                  <Skeleton className="h-4 w-[260px]" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </TableCell>
              <TableCell className="w-28 align-top">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="w-28 align-top">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="w-28 align-top">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="w-20 text-right align-top">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
            {Array.from({ length: 2 }).map((_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="w-28 align-top">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell className="min-w-72 align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-[260px]" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </TableCell>
                <TableCell className="w-28 align-top">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="w-28 align-top">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="w-28 align-top">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="w-20 text-right align-top">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>

      <div className="mt-4 flex justify-center">
        <Skeleton className="h-8 w-36" />
      </div>
    </div>
  )
}
