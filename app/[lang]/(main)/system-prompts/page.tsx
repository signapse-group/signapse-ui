import { Suspense } from "react"

import { getSystemPrompts } from "@/app/api/system-prompts/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"
import { canReadSystemPrompts } from "@/app/lib/system-prompts/permissions"
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

import { SystemPromptList } from "./system-prompt-list"

interface SystemPromptsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SystemPromptsPage({
  searchParams,
}: SystemPromptsPageProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!canReadSystemPrompts(permissions)) {
    return (
      <AccessDenied
        description={dictionary.systemPrompts.readDenied}
        permission="system-prompt:read"
      />
    )
  }

  const params = await searchParams
  const { page, size } = parsePaginationQuery(params)
  const sort =
    typeof params.sort === "string" ? params.sort : "lastModifiedDate_desc"

  return (
    <Suspense fallback={<SystemPromptListSkeleton dictionary={dictionary} />}>
      <SystemPromptListContent
        page={page}
        size={size}
        sort={sort}
        searchParams={params}
      />
    </Suspense>
  )
}

async function SystemPromptListContent({
  page,
  size,
  sort,
  searchParams,
}: {
  page: number
  size: number
  sort: string
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filterParams = { ...searchParams }
  delete filterParams.page
  delete filterParams.size
  delete filterParams.sort
  const filter = buildFilterQuery(filterParams)
  const promptPage = await getSystemPrompts({
    page: page - 1,
    size,
    filter,
    sort: buildSortQuery(sort),
  })

  return <SystemPromptList promptPage={promptPage} />
}

function SystemPromptListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.systemPrompts

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:w-[150px]" />
          <Skeleton className="h-9 w-full sm:max-w-sm" />
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
                {t.typeColumn}
              </AppListTableHead>
              <AppListTableHead className="w-44">
                {t.workflowGroupColumn}
              </AppListTableHead>
              <AppListTableHead className="w-28">
                {t.lengthColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40">
                {t.updatedColumn}
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
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </TableCell>
                <TableCell className="w-44 max-w-[11rem]">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell className="w-28">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="w-40">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="w-40">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="w-28 text-right">
                  <div className="flex justify-end gap-2">
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
