import { Suspense } from "react"

import { getCronjobs } from "@/app/api/cronjobs/action"
import type {
  CronjobListResponse,
  CronjobPageResponse,
} from "@/app/lib/cronjobs/definitions"
import type { Page as PaginationPage } from "@/app/lib/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasPermission } from "@/app/lib/permissions"
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

import { CronjobDetailContent, CronjobDetailSkeleton } from "./cronjob-detail"
import { CronjobListPage } from "./cronjob-list"

type CronjobSearchParams = {
  [key: string]: string | string[] | undefined
}

interface CronjobPageProps {
  searchParams: Promise<CronjobSearchParams>
}

export default async function Page({ searchParams }: CronjobPageProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, "cronjob:read")) {
    return (
      <AccessDenied
        description={dictionary.cronjobs.readDenied}
        permission="cronjob:read"
      />
    )
  }

  return (
    <Suspense
      fallback={<CronjobListSkeleton label={dictionary.cronjobs.loadingList} />}
    >
      <CronjobListContent
        searchParamsPromise={searchParams}
        dictionary={dictionary}
      />
    </Suspense>
  )
}

async function CronjobListContent({
  searchParamsPromise,
  dictionary,
}: {
  searchParamsPromise: Promise<CronjobSearchParams>
  dictionary: Dictionary
}) {
  const resolvedParams = await searchParamsPromise
  const {
    page: pageParam,
    size: sizeParam,
    sort = "",
    detail,
    ...filterParams
  } = resolvedParams
  const { page, size } = parsePaginationQuery({
    page: pageParam,
    size: sizeParam,
  })

  let cronjobResponse: CronjobPageResponse
  try {
    cronjobResponse = await getCronjobs({
      filter: buildFilterQuery(filterParams),
      page: page - 1,
      size,
      sort: buildSortQuery(sort as string),
    })
  } catch (error) {
    if (getBackendStatus(error) === 403) {
      return (
        <AccessDenied
          description={dictionary.cronjobs.readDenied}
          permission="cronjob:read"
        />
      )
    }
    throw error
  }

  if (cronjobResponse.content === undefined) {
    throw new Error("Cronjob list response omitted content")
  }

  const selectedDetailId = Array.isArray(detail) ? detail[0] : detail
  const closeHref = buildCloseDetailHref(resolvedParams)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {selectedDetailId ? (
        <Suspense
          fallback={
            <CronjobDetailSkeleton label={dictionary.cronjobs.detailLoading} />
          }
        >
          <CronjobDetailContent id={selectedDetailId} closeHref={closeHref} />
        </Suspense>
      ) : null}
      <CronjobListPage
        cronjobPage={{
          content: cronjobResponse.content,
          pagination: getCronjobPagination(cronjobResponse),
        }}
      />
    </div>
  )
}

function getCronjobPagination(
  page: CronjobPageResponse
):
  | Pick<
      PaginationPage<CronjobListResponse>,
      "number" | "numberOfElements" | "size" | "totalElements" | "totalPages"
    >
  | undefined {
  const { number, numberOfElements, size, totalElements, totalPages } = page
  if (
    number === undefined ||
    numberOfElements === undefined ||
    size === undefined ||
    totalElements === undefined ||
    totalPages === undefined
  ) {
    return undefined
  }

  return { number, numberOfElements, size, totalElements, totalPages }
}

function getBackendStatus(error: unknown): number | undefined {
  return error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : undefined
}

function buildCloseDetailHref(searchParams: CronjobSearchParams): string {
  const query = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "detail") {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
    } else if (value !== undefined) {
      query.append(key, value)
    }
  })

  const suffix = query.toString()
  return `/cronjobs${suffix ? `?${suffix}` : ""}#cronjob-list`
}

function CronjobListSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="w-full">
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <Skeleton className="h-9 w-full sm:w-80 lg:w-96" />
        <Skeleton className="h-9 w-full sm:w-[180px]" />
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-4/5" />
            <Skeleton className="mt-4 h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-full" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="min-w-0">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="mt-2 h-5 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="mt-4 flex justify-end gap-1">
              <Skeleton className="size-10" />
              <Skeleton className="size-10" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <AppListTable className="mt-4">
          <Table className="min-w-[76rem] table-fixed">
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead className="w-[24%]">
                  <Skeleton className="h-4 w-32" />
                </AppListTableHead>
                <AppListTableHead className="w-[11%]">
                  <Skeleton className="mx-auto h-4 w-20" />
                </AppListTableHead>
                <AppListTableHead className="w-[8%] text-center">
                  <Skeleton className="h-4 w-24" />
                </AppListTableHead>
                <AppListTableHead className="w-[8%] text-center">
                  <Skeleton className="mx-auto h-4 w-32" />
                </AppListTableHead>
                <AppListTableHead className="w-[12%] text-center">
                  <Skeleton className="mx-auto h-4 w-32" />
                </AppListTableHead>
                <AppListTableHead className="w-[14%]">
                  <Skeleton className="h-4 w-32" />
                </AppListTableHead>
                <AppListTableHead className="w-[11%]">
                  <Skeleton className="ml-auto h-4 w-20" />
                </AppListTableHead>
                <AppListTableHead className="w-[12%] text-center">
                  <Skeleton className="mx-auto h-4 w-20" />
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="align-top">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-full" />
                    <Skeleton className="mt-1 h-3 w-4/5" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-1 h-4 w-3/4" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="mx-auto h-5 w-20" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="mx-auto h-5 w-20" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="mx-auto h-5 w-20" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell className="align-top">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex justify-center gap-1">
                      <Skeleton className="size-10" />
                      <Skeleton className="size-10" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppListTable>
      </div>

      <AppPaginationSkeleton className="mt-4" />
    </div>
  )
}
