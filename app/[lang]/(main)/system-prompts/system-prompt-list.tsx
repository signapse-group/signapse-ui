"use client"

import { Clock3, Edit2, FileText, Plus, RefreshCcw, Trash2 } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteSystemPrompt } from "@/app/api/system-prompts/action"
import { Page } from "@/app/lib/definitions"
import {
  formatSystemPromptContentLength,
  getSystemPromptDisplayName,
  getSystemPromptWorkflowGroup,
  SystemPromptResponse,
} from "@/app/lib/system-prompts/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  SYSTEM_PROMPT_CREATE_PERMISSIONS,
  SYSTEM_PROMPT_DELETE_PERMISSIONS,
  SYSTEM_PROMPT_UPDATE_PERMISSIONS,
} from "@/app/lib/system-prompts/permissions"
import { AppPaginationControls } from "@/components/app-pagination-controls"
import {
  AppListToolbar,
  AppListToolbarLeading,
  AppListToolbarTrailing,
} from "@/components/app-list-toolbar"
import {
  AppListTable,
  AppListTableEmptyState,
  AppListTableHead,
  AppListTableHeaderRow,
} from "@/components/app-list-table"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { useHasAnyPermission } from "@/components/permission-provider"
import { SortSelect } from "@/components/sort-select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SystemPromptSearch } from "./system-prompt-search"

interface SystemPromptListProps {
  promptPage: Page<SystemPromptResponse>
}

const COMPACT_DATE_TIME_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
} satisfies Intl.DateTimeFormatOptions

function getPromptHref(promptType: string) {
  return `/system-prompts/${encodeURIComponent(promptType)}`
}

export function SystemPromptList({ promptPage }: SystemPromptListProps) {
  const prompts = promptPage.content ?? []
  const canCreate = useHasAnyPermission(SYSTEM_PROMPT_CREATE_PERMISSIONS)
  const canUpdate = useHasAnyPermission(SYSTEM_PROMPT_UPDATE_PERMISSIONS)
  const canDelete = useHasAnyPermission(SYSTEM_PROMPT_DELETE_PERMISSIONS)
  const { dictionary, formatDateTime, formatNumber, locale } = useLocalization()
  const t = dictionary.systemPrompts
  const formatPromptDateTime = (value?: string) =>
    formatDateTime(
      value,
      COMPACT_DATE_TIME_OPTIONS,
      dictionary.common.notAvailable
    )
  const formatPromptNumber = (value: number) => formatNumber(value)

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          {canCreate ? (
            <Link href="/system-prompts/create" className={buttonVariants()}>
              <Plus data-icon="inline-start" />
              {t.addPrompt}
            </Link>
          ) : null}
          <SystemPromptSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <SortSelect
            className="w-full sm:w-auto"
            label={t.sortLabel}
            options={[
              { label: t.updatedNewest, value: "lastModifiedDate_desc" },
              { label: t.createdNewest, value: "createdDate_desc" },
              { label: t.typeAsc, value: "promptType_asc" },
              { label: t.typeDesc, value: "promptType_desc" },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

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
            {prompts.length > 0 ? (
              prompts.map((prompt) => (
                <TableRow
                  key={prompt.promptType}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="align-top whitespace-normal">
                    <div className="flex min-w-0 flex-col gap-1">
                      {canUpdate ? (
                        <Link
                          href={getPromptHref(prompt.promptType)}
                          className="line-clamp-1 font-medium break-words text-foreground hover:underline"
                        >
                          {getSystemPromptDisplayName(
                            prompt,
                            dictionary,
                            locale
                          )}
                        </Link>
                      ) : (
                        <span className="line-clamp-1 font-medium break-words text-foreground">
                          {getSystemPromptDisplayName(
                            prompt,
                            dictionary,
                            locale
                          )}
                        </span>
                      )}
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {prompt.promptType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-44 max-w-[11rem]">
                    <Badge variant="secondary" className="max-w-full">
                      <span className="truncate">
                        {getSystemPromptWorkflowGroup(
                          prompt.promptType,
                          dictionary
                        )}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="w-28 text-sm text-muted-foreground">
                    {formatSystemPromptContentLength(
                      prompt.content,
                      dictionary,
                      formatPromptNumber
                    )}
                  </TableCell>
                  <TableCell className="w-40">
                    <AppTimeMetadata icon={RefreshCcw}>
                      {formatPromptDateTime(prompt.lastModifiedDate)}
                    </AppTimeMetadata>
                  </TableCell>
                  <TableCell className="w-40">
                    <AppTimeMetadata icon={Clock3}>
                      {formatPromptDateTime(prompt.createdDate)}
                    </AppTimeMetadata>
                  </TableCell>
                  <TableCell className="w-28">
                    <div className="flex justify-end gap-1">
                      {canUpdate ? (
                        <Link
                          href={getPromptHref(prompt.promptType)}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                            className:
                              "text-muted-foreground hover:text-foreground",
                          })}
                        >
                          <Edit2 data-icon="inline-start" />
                          <span className="sr-only">{t.editPrompt}</span>
                        </Link>
                      ) : null}
                      {canDelete ? (
                        <DeletePromptButton prompt={prompt} />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={6}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{t.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={promptPage} className="mt-4" />
    </div>
  )
}

function DeletePromptButton({ prompt }: { prompt: SystemPromptResponse }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { dictionary, formatMessage, locale } = useLocalization()
  const t = dictionary.systemPrompts
  const promptLabel = getSystemPromptDisplayName(prompt, dictionary, locale)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSystemPrompt(prompt.promptType)

      if (result.success) {
        toast.success(formatMessage(t.deleted, { prompt: promptLabel }))
        setOpen(false)
        router.refresh()
        return
      }

      toast.error(result.error)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 data-icon="inline-start" />
        <span className="sr-only">{t.deletePrompt}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {formatMessage(t.deleteDescription, { prompt: promptLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {dictionary.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Spinner className="size-4" data-icon="inline-start" />
                {t.deleting}
              </>
            ) : (
              t.deleteAction
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
