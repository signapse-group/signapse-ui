import { Suspense } from "react"

import { getNewsOutlets } from "@/app/api/news-outlets/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasPermission } from "@/app/lib/permissions"
import { NEWS_OUTLET_READ_PERMISSION } from "@/app/lib/news-outlets/permissions"
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

import { NewsOutletListPage } from "./news-outlet-list"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NewsOutletsPage({ searchParams }: PageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()

  if (!hasPermission(permissions, NEWS_OUTLET_READ_PERMISSION)) {
    return (
      <AccessDenied
        description={dictionary.newsOutlets.readDenied}
        permission={NEWS_OUTLET_READ_PERMISSION}
      />
    )
  }

  return (
    <Suspense fallback={<ListSkeleton dictionary={dictionary} />}>
      <NewsOutletContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

async function NewsOutletContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParamsPromise
  const {
    page: pageParam,
    size: sizeParam,
    sort = "id_desc",
    ...filterParams
  } = resolvedParams
  const { page, size } = parsePaginationQuery({
    page: pageParam,
    size: sizeParam,
  })
  const filter = buildFilterQuery(filterParams)
  const sortQuery = buildSortQuery(sort as string)

  const newsOutletPage = await getNewsOutlets({
    page: page - 1,
    size,
    sort: sortQuery,
    filter,
  })

  return <NewsOutletListPage newsOutletPage={newsOutletPage} />
}

function ListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Skeleton className="h-9 w-full sm:w-[200px]" />
          <Skeleton className="h-9 w-full sm:w-[120px]" />
        </div>
      </div>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[58%]">
                {dictionary.newsOutlets.sourceColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {dictionary.newsOutlets.createdColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40 text-center">
                {dictionary.newsOutlets.activeColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-center">
                {dictionary.newsOutlets.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="w-40">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="w-40 text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-9 w-32 rounded-lg" />
                  </div>
                </TableCell>
                <TableCell className="w-28 text-center">
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationSkeleton className="mt-4" />
    </div>
  )
}
