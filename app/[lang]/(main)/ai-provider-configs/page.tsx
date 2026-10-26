import { Suspense } from "react"

import { getAiProviderConfigs } from "@/app/api/ai-provider-configs/action"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
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

  if (!hasPermission(permissions, AI_PROVIDER_CONFIG_PERMISSIONS.read)) {
    return (
      <>
        <h1 className="sr-only">{dictionary.navigation.aiProviders}</h1>
        <AccessDenied
          description={dictionary.aiProviderConfigs.readDenied}
          permission={AI_PROVIDER_CONFIG_PERMISSIONS.read}
        />
      </>
    )
  }

  return (
    <>
      <h1 className="sr-only">{dictionary.navigation.aiProviders}</h1>
      <Suspense fallback={<ListSkeleton dictionary={dictionary} />}>
        <AiProviderConfigsContent searchParamsPromise={searchParams} />
      </Suspense>
    </>
  )
}

async function AiProviderConfigsContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParamsPromise
  const pageValue = Array.isArray(resolvedParams.page)
    ? resolvedParams.page[0]
    : resolvedParams.page
  const sizeValue = Array.isArray(resolvedParams.size)
    ? resolvedParams.size[0]
    : resolvedParams.size
  const sortValue = Array.isArray(resolvedParams.sort)
    ? resolvedParams.sort[0]
    : resolvedParams.sort
  const parsedPage = Number(pageValue)
  const parsedSize = Number(sizeValue)
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const size = [10, 20, 50, 100].includes(parsedSize) ? parsedSize : 10
  const sort = sortValue === "id_asc" ? "id_asc" : "id_desc"

  const providerPage = await getAiProviderConfigs({
    page: page - 1,
    size,
    sort: buildSortQuery(sort),
    filter: "",
  })

  return <AiProviderConfigListPage providerPage={providerPage} />
}

function ListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.aiProviderConfigs

  return (
    <div aria-busy="true" className="flex flex-col">
      <p role="status" className="sr-only">
        {t.loadingList}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[30%] min-w-52">
                {t.connectionColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[27%] min-w-52">
                {t.endpointColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[28%] min-w-52">
                {t.apiKeysColumn}
              </AppListTableHead>
              <AppListTableHead className="w-[15%] min-w-32">
                {t.usedByColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <Skeleton className="h-4 w-40 max-w-full" />
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}
