"use client"

import { Pencil } from "lucide-react"
import { useState } from "react"

import type { SystemPromptContentResponse } from "@/app/lib/system-prompts/definitions"
import { getSystemPromptWorkflowGroup } from "@/app/lib/system-prompts/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { SYSTEM_PROMPT_UPDATE_PERMISSIONS } from "@/app/lib/system-prompts/permissions"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { LocalizedLink as Link } from "@/components/localized-link"
import { useHasAnyPermission } from "@/components/permission-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SystemPromptLifecycleWarning } from "./system-prompt-lifecycle-warning"
import { SystemPromptSearch } from "./system-prompt-search"

interface SystemPromptListProps {
  prompts: SystemPromptContentResponse[]
}

function getPromptHref(promptType: string) {
  return `/system-prompts/${encodeURIComponent(promptType)}`
}

export function SystemPromptList({ prompts }: SystemPromptListProps) {
  const [search, setSearch] = useState("")
  const canUpdate = useHasAnyPermission(SYSTEM_PROMPT_UPDATE_PERMISSIONS)
  const { dictionary, formatMessage, formatNumber, locale } = useLocalization()
  const t = dictionary.systemPrompts
  const normalizedSearch = search.trim().toLocaleLowerCase(locale)
  const filteredPrompts = normalizedSearch
    ? prompts.filter((prompt) =>
        `${prompt.name} ${prompt.promptType}`
          .toLocaleLowerCase(locale)
          .includes(normalizedSearch)
      )
    : prompts

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="sr-only">{t.title}</h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SystemPromptSearch value={search} onValueChange={setSearch} />
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
          role="status"
        >
          {formatMessage(t.supportedPromptCount, {
            count: formatNumber(prompts.length),
          })}
        </p>
      </div>

      <SystemPromptLifecycleWarning />

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
            {filteredPrompts.length > 0 ? (
              filteredPrompts.map((prompt) => (
                <TableRow
                  key={prompt.promptType}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="py-3 align-top whitespace-normal">
                    <div className="flex min-w-0 flex-col gap-1">
                      {canUpdate ? (
                        <Link
                          href={getPromptHref(prompt.promptType)}
                          className="font-medium break-words text-foreground hover:underline"
                        >
                          {prompt.name}
                        </Link>
                      ) : (
                        <span className="font-medium break-words text-foreground">
                          {prompt.name}
                        </span>
                      )}
                      <span className="font-mono text-xs break-all text-muted-foreground">
                        {prompt.promptType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getSystemPromptWorkflowGroup(
                      prompt.promptType,
                      dictionary
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      title={t.updatedUnavailable}
                      aria-label={t.updatedUnavailable}
                    >
                      —
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {canUpdate ? (
                      <Link
                        href={getPromptHref(prompt.promptType)}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        <Pencil data-icon="inline-start" />
                        {t.editContent}
                      </Link>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={4}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Pencil className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {prompts.length === 0 ? t.noPromptsTitle : t.noResultsTitle}
                  </EmptyTitle>
                  <EmptyDescription>
                    {prompts.length === 0
                      ? t.noPromptsDescription
                      : t.noResultsDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>
    </div>
  )
}
