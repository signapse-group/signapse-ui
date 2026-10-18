"use client"

import { CronjobListResponse } from "@/app/lib/cronjobs/definitions"
import { Page } from "@/app/lib/definitions"
import { updateCronjob } from "@/app/api/cronjobs/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
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
import { useHasPermission } from "@/components/permission-provider"
import { SortSelect } from "@/components/sort-select"
import { CronjobSearch } from "./cronjob-search"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Check,
  CheckCircle,
  Clock,
  FileClock,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  X,
} from "lucide-react"
import {
  pauseCronjob,
  resumeCronjob,
  startCronjob,
} from "@/app/api/cronjobs/action"
import { useRouter } from "next/navigation"
import { FormEvent, useState, useTransition } from "react"
import { toast } from "sonner"

interface CronjobListProps {
  cronjobPage: Page<CronjobListResponse>
}

const CRON_EXPRESSION_MAX_LENGTH = 100

function getStatusBadge(status: string | undefined, dictionary: Dictionary) {
  const statusValue = status || "SCHEDULED"
  switch (statusValue) {
    case "RUNNING":
      return (
        <Badge>
          <Play data-icon="inline-start" />{" "}
          {dictionary.cronjobs.statuses.RUNNING}
        </Badge>
      )
    case "PAUSED":
      return (
        <Badge variant="secondary">
          <Pause data-icon="inline-start" />{" "}
          {dictionary.cronjobs.statuses.PAUSED}
        </Badge>
      )
    case "COMPLETE":
      return (
        <Badge variant="secondary">
          <CheckCircle data-icon="inline-start" />{" "}
          {dictionary.cronjobs.statuses.COMPLETE}
        </Badge>
      )
    case "SCHEDULED":
      return (
        <Badge variant="secondary">
          <Clock data-icon="inline-start" />{" "}
          {dictionary.cronjobs.statuses.SCHEDULED}
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function CronjobListPage({ cronjobPage }: CronjobListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const cronjobs = cronjobPage.content
  const canUpdateCronjob = useHasPermission("cronjob:update")

  return (
    <div className="w-full">
      <AppListToolbar>
        <AppListToolbarLeading>
          <CronjobSearch />
        </AppListToolbarLeading>
        <AppListToolbarTrailing>
          <SortSelect
            className="w-full sm:w-auto"
            options={[
              { label: dictionary.cronjobs.newest, value: "id_desc" },
              { label: dictionary.cronjobs.oldest, value: "id_asc" },
              { label: dictionary.cronjobs.nameAsc, value: "jobName_asc" },
              { label: dictionary.cronjobs.nameDesc, value: "jobName_desc" },
            ]}
            triggerClassName="w-full sm:w-[200px]"
          />
        </AppListToolbarTrailing>
      </AppListToolbar>

      <AppListTable>
        <Table>
          <TableHeader>
            <AppListTableHeaderRow>
              <AppListTableHead className="w-[32%]">
                {dictionary.cronjobs.jobNameColumn}
              </AppListTableHead>
              <AppListTableHead className="w-36 text-center">
                {dictionary.cronjobs.groupColumn}
              </AppListTableHead>
              <AppListTableHead className="w-36 text-center">
                {dictionary.cronjobs.statusColumn}
              </AppListTableHead>
              <AppListTableHead className="w-64 text-center">
                {dictionary.cronjobs.cronExpressionColumn}
              </AppListTableHead>
              <AppListTableHead className="w-40 text-center">
                {dictionary.cronjobs.nextRunColumn}
              </AppListTableHead>
              <AppListTableHead className="w-32 text-center">
                {dictionary.cronjobs.actionsColumn}
              </AppListTableHead>
            </AppListTableHeaderRow>
          </TableHeader>
          <TableBody>
            {cronjobs.length > 0 ? (
              cronjobs.map((cronjob) => (
                <TableRow
                  key={cronjob.id}
                  className="border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="align-top font-medium whitespace-normal text-foreground">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="line-clamp-1 break-words">
                        {cronjob.jobName}
                      </span>
                      {cronjob.description && (
                        <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                          {cronjob.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-36 max-w-[9rem] text-center text-muted-foreground">
                    <span className="block truncate">{cronjob.jobGroup}</span>
                  </TableCell>
                  <TableCell className="w-36 text-center">
                    {getStatusBadge(cronjob.jobStatus, dictionary)}
                  </TableCell>
                  <TableCell className="w-64 text-center whitespace-normal">
                    <CronExpressionCell
                      cronjob={cronjob}
                      canUpdate={canUpdateCronjob}
                    />
                  </TableCell>
                  <TableCell className="w-40 text-center">
                    <AppTimeMetadata icon={Clock}>
                      {cronjob.nextTriggeredTime
                        ? formatDateTime(
                            cronjob.nextTriggeredTime,
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                            "-"
                          )
                        : "-"}
                    </AppTimeMetadata>
                  </TableCell>
                  <TableCell className="w-32 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <StatusActions
                        id={cronjob.id}
                        status={cronjob.jobStatus}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <AppListTableEmptyState colSpan={6}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileClock />
                  </EmptyMedia>
                  <EmptyTitle>{dictionary.cronjobs.emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {dictionary.cronjobs.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </AppListTableEmptyState>
            )}
          </TableBody>
        </Table>
      </AppListTable>

      <AppPaginationControls page={cronjobPage} className="mt-4" />
    </div>
  )
}

function CronExpressionCell({
  cronjob,
  canUpdate,
}: {
  cronjob: CronjobListResponse
  canUpdate: boolean
}) {
  const { dictionary } = useLocalization()
  const [isEditing, setIsEditing] = useState(false)
  const [draftExpression, setDraftExpression] = useState(cronjob.cronExpression)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleCancel = () => {
    setDraftExpression(cronjob.cronExpression)
    setError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const expression = draftExpression.trim()
    if (!expression) {
      setError(dictionary.cronjobs.cronRequired)
      return
    }

    if (expression.length > CRON_EXPRESSION_MAX_LENGTH) {
      setError(dictionary.cronjobs.cronTooLong)
      return
    }

    setError(null)
    setIsSaving(true)
    const result = await updateCronjob(cronjob.id, { expression })
    setIsSaving(false)

    if (result.success) {
      toast.success(dictionary.cronjobs.cronUpdated)
      setDraftExpression(expression)
      setIsEditing(false)
      router.refresh()
    } else {
      toast.error(result.error || dictionary.cronjobs.cronUpdateError)
    }
  }

  if (!isEditing) {
    return (
      <div className="flex min-w-0 items-center justify-center gap-1">
        <span className="block min-w-0 truncate font-mono text-sm text-muted-foreground">
          {cronjob.cronExpression}
        </span>
        {canUpdate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title={dictionary.cronjobs.editCron}
            onClick={() => {
              setDraftExpression(cronjob.cronExpression)
              setError(null)
              setIsEditing(true)
            }}
          >
            <Pencil data-icon="inline-start" />
            <span className="sr-only">{dictionary.cronjobs.editCron}</span>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <form
      className="flex items-center justify-center gap-1"
      onSubmit={handleSubmit}
    >
      <Field data-invalid={Boolean(error)} className="min-w-0 flex-1">
        <FieldLabel
          htmlFor={`cron-expression-${cronjob.id}`}
          className="sr-only"
        >
          {dictionary.cronjobs.cronExpressionColumn}
        </FieldLabel>
        <Input
          id={`cron-expression-${cronjob.id}`}
          value={draftExpression}
          onChange={(event) => {
            setDraftExpression(event.target.value)
            if (error) {
              setError(null)
            }
          }}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          disabled={isSaving}
          className="min-w-[8rem]"
        />
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
      <div className="flex items-center gap-1">
        <Button
          type="submit"
          variant="ghost"
          size="icon-xs"
          title={dictionary.cronjobs.saveCron}
          disabled={isSaving}
        >
          {isSaving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          <span className="sr-only">{dictionary.cronjobs.saveCron}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title={dictionary.cronjobs.cancelEdit}
          disabled={isSaving}
          onClick={handleCancel}
        >
          <X data-icon="inline-start" />
          <span className="sr-only">{dictionary.cronjobs.cancelEdit}</span>
        </Button>
      </div>
    </form>
  )
}

function StatusActions({ id, status }: { id: number; status: string }) {
  const { dictionary } = useLocalization()
  const canStartCronjob = useHasPermission("cronjob:start")
  const canPauseCronjob = useHasPermission("cronjob:pause")
  const canResumeCronjob = useHasPermission("cronjob:resume")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleStart = () => {
    startTransition(async () => {
      const result = await startCronjob(id)
      if (result.success) {
        toast.success(dictionary.cronjobs.started)
        router.refresh()
      } else {
        toast.error(result.error || dictionary.cronjobs.startError)
      }
    })
  }

  const handlePause = () => {
    startTransition(async () => {
      const result = await pauseCronjob(id)
      if (result.success) {
        toast.success(dictionary.cronjobs.paused)
        router.refresh()
      } else {
        toast.error(result.error || dictionary.cronjobs.pauseError)
      }
    })
  }

  const handleResume = () => {
    startTransition(async () => {
      const result = await resumeCronjob(id)
      if (result.success) {
        toast.success(dictionary.cronjobs.resumed)
        router.refresh()
      } else {
        toast.error(result.error || dictionary.cronjobs.resumeError)
      }
    })
  }

  const statusValue = status || "SCHEDULED"

  return (
    <>
      {(statusValue === "SCHEDULED" || statusValue === "COMPLETE") && (
        <>
          {canStartCronjob ? (
            <Button
              variant="ghost"
              size="icon"
              title={dictionary.cronjobs.start}
              disabled={isPending}
              onClick={handleStart}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Play data-icon="inline-start" />
              )}
              <span className="sr-only">{dictionary.cronjobs.start}</span>
            </Button>
          ) : null}
          {canPauseCronjob ? (
            <Button
              variant="ghost"
              size="icon"
              title={dictionary.cronjobs.pause}
              disabled={isPending}
              onClick={handlePause}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Pause data-icon="inline-start" />
              )}
              <span className="sr-only">{dictionary.cronjobs.pause}</span>
            </Button>
          ) : null}
        </>
      )}
      {statusValue === "PAUSED" && canResumeCronjob ? (
        <Button
          variant="ghost"
          size="icon"
          title={dictionary.cronjobs.resume}
          disabled={isPending}
          onClick={handleResume}
        >
          {isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RotateCcw data-icon="inline-start" />
          )}
          <span className="sr-only">{dictionary.cronjobs.resume}</span>
        </Button>
      ) : null}
    </>
  )
}
