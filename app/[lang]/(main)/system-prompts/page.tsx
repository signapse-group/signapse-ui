import { Suspense } from "react"

import { getSystemPrompts } from "@/app/api/system-prompts/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { canReadSystemPrompts } from "@/app/lib/system-prompts/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
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

import { SystemPromptList } from "./system-prompt-list"

export default async function SystemPromptsPage() {
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

  return (
    <Suspense fallback={<SystemPromptListSkeleton dictionary={dictionary} />}>
      <SystemPromptListContent />
    </Suspense>
  )
}

async function SystemPromptListContent() {
  const prompts = await getSystemPrompts()
  return <SystemPromptList prompts={prompts} />
}

function SystemPromptListSkeleton({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.systemPrompts

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:w-96" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
      </div>
      <AppListTable className="mt-0">
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[50%]">
                {t.typeColumn}
              </AppListTableHead>
              <AppListTableHead>{t.workflowColumn}</AppListTableHead>
              <AppListTableHead>{t.updatedColumn}</AppListTableHead>
              <AppListTableHead className="text-right">
                <span className="sr-only">{t.editContent}</span>
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell>
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="mt-2 h-3 w-72" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-32" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppListTable>
    </div>
  )
}
