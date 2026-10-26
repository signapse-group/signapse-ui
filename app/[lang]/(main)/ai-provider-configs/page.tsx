import { Suspense } from "react"

import { getAiProviderConfigs } from "@/app/api/ai-provider-configs/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { buildSortQuery } from "@/app/lib/utils"
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

import { AiProviderConfigListPage } from "./ai-provider-config-list"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AiProviderConfigsPage({
  searchParams,
}: PageProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, "ai-provider-config:read")) {
    return (
      <AccessDenied
        description={dictionary.aiProviderConfigs.readDenied}
        permission="ai-provider-config:read"
      />
    )
  }

  return (
    <Suspense fallback={<ListSkeleton dictionary={dictionary} />}>
      <AiProviderConfigsContent searchParamsPromise={searchParams} />
    </Suspense>
  )
}

async function AiProviderConfigsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParamsPromise
  const { sort = "id_desc" } = resolvedParams
  const { page, size } = parsePaginationQuery(resolvedParams)

  const providerPage = await getAiProviderConfigs({
    page: page - 1,
    size,
    sort: buildSortQuery(sort as string),
    filter: "",
  })

  return <AiProviderConfigListPage providerPage={providerPage} />
}

function ListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.aiProviderConfigs

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-[180px]" />
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
              <AppListTableHead className="w-[34%]">
                {t.providerColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[30%]">
                {t.credentialColumn}
              </AppListTableHead>
              <AppListTableHead className="w-36 text-center">
                {t.defaultColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {t.createdColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28 text-right">
                {t.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell className="w-[30%] max-w-[20rem] align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="w-36 text-center">
                  <Skeleton className="mx-auto h-6 w-12 rounded-full" />
                </TableCell>
                <TableCell className="w-40">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="w-28">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
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
