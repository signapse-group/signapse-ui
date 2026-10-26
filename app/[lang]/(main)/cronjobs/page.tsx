import { Suspense } from "react"
import { CronjobListPage } from "./cronjob-list"
import { getCronjobs } from "@/app/api/cronjobs/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildSortQuery, buildFilterQuery } from "@/app/lib/utils"
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

interface CronjobPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: CronjobPageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()

  if (!hasPermission(permissions, "cronjob:read")) {
    return (
      <AccessDenied
        description={dictionary.cronjobs.readDenied}
        permission="cronjob:read"
      />
    )
  }

  return (
    <Suspense fallback={<CronjobListSkeleton />}>
      <CronjobListContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

async function CronjobListContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParamsPromise
  const {
    page: pageParam,
    size: sizeParam,
    sort = "",
    ...filterParams
  } = resolvedParams
  const { page, size } = parsePaginationQuery({
    page: pageParam,
    size: sizeParam,
  })

  const filter = buildFilterQuery(filterParams)

  const cronjobPage = await getCronjobs({
    filter: filter,
    page: page - 1,
    size,
    sort: buildSortQuery(sort as string),
  })

  return <CronjobListPage cronjobPage={cronjobPage} />
}

function CronjobListSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex w-full flex-1 items-center gap-4 sm:w-auto">
          <Skeleton className="h-9 w-full sm:w-80 lg:w-96" />
        </div>
        <Skeleton className="h-9 w-[180px]" />
      </div>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[32%]">
                <Skeleton className="h-4 w-32" />
              </AppListTableHead>
              <AppListTableHead className="w-36 text-center">
                <Skeleton className="mx-auto h-4 w-20" />
              </AppListTableHead>
              <AppListTableHead className="w-36 text-center">
                <Skeleton className="mx-auto h-4 w-24" />
              </AppListTableHead>
              <AppListTableHead className="w-64 text-center">
                <Skeleton className="mx-auto h-4 w-32" />
              </AppListTableHead>
              <AppListTableHead className="w-40 text-center">
                <Skeleton className="mx-auto h-4 w-32" />
              </AppListTableHead>
              <AppListTableHead className="w-32 text-center">
                <Skeleton className="ml-auto h-4 w-20" />
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </TableCell>
                <TableCell className="w-36 text-center">
                  <Skeleton className="mx-auto h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="w-36 text-center">
                  <Skeleton className="mx-auto h-4 w-24" />
                </TableCell>
                <TableCell className="w-64 text-center">
                  <Skeleton className="mx-auto h-4 w-32 font-mono" />
                </TableCell>
                <TableCell className="w-40 text-center">
                  <Skeleton className="mx-auto h-4 w-32" />
                </TableCell>
                <TableCell className="w-32 text-center">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
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
