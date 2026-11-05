"use client"

import {
  pauseCronjob,
  resumeCronjob,
  startCronjob,
  updateCronjob,
} from "@/app/api/cronjobs/action"
import type {
  CronjobListResponse,
  CronjobResponse,
} from "@/app/lib/cronjobs/definitions"
import type { Page } from "@/app/lib/definitions"
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
import { LocalizedLink } from "@/components/localized-link"
import { useHasPermission } from "@/components/permission-provider"
import { SortSelect } from "@/components/sort-select"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Empty,
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
  ChevronRight,
  Clock,
  FileClock,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useState, useTransition } from "react"
import { toast } from "sonner"

import { CronjobStatusFields } from "./cronjob-status-fields"
import { CronjobSearch } from "./cronjob-search"

interface CronjobListProps {
  cronjobPage: Page<CronjobListResponse>
}

const CRON_EXPRESSION_MAX_LENGTH = 100
const UTC_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
}

export function CronjobListPage({ cronjobPage }: CronjobListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const cronjobs = cronjobPage.content
  const canUpdateCronjob = useHasPermission("cronjob:update")

  return (
    <div id="cronjob-list" className="w-full">
      <h1 className="sr-only">{dictionary.navigation.cronjobs}</h1>
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

      <div className="mt-4 grid gap-3 md:hidden">
        {cronjobs.length > 0 ? (
          cronjobs.map((cronjob) => (
            <CronjobCard
              key={cronjob.id}
              cronjob={cronjob}
              canUpdate={canUpdateCronjob}
            />
          ))
        ) : (
          <CronjobEmptyState />
        )}
      </div>

      <div className="hidden md:block">
        <AppListTable className="mt-4">
          <Table className="min-w-[76rem] table-fixed">
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead className="w-[26%]">
                  {dictionary.cronjobs.jobNameColumn}
                </AppListTableHead>
                <AppListTableHead className="w-32 text-center">
                  {dictionary.cronjobs.groupColumn}
                </AppListTableHead>
                <AppListTableHead className="w-60">
                  {dictionary.cronjobs.statusColumn}
                </AppListTableHead>
                <AppListTableHead className="w-52 text-center">
                  {dictionary.cronjobs.cronExpressionColumn}
                </AppListTableHead>
                <AppListTableHead className="w-48 text-center">
                  {dictionary.cronjobs.nextRunColumn}
                </AppListTableHead>
                <AppListTableHead className="w-28 text-center">
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
                      <div className="flex min-w-0 flex-col items-start gap-1">
                        <span className="line-clamp-1 break-words">
                          {cronjob.jobName}
                        </span>
                        <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                          {cronjob.description ||
                            dictionary.common.notAvailable}
                        </span>
                        <CronjobDetailsLink id={cronjob.id} />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-32 text-center text-muted-foreground">
                      <span className="block truncate">{cronjob.jobGroup}</span>
                    </TableCell>
                    <TableCell className="align-top">
                      <CronjobStatusFields
                        cronjob={cronjob}
                        className="flex flex-col gap-1.5"
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <CronExpressionCell
                        cronjob={cronjob}
                        canUpdate={canUpdateCronjob}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {cronjob.nextTriggeredTime ? (
                        <AppTimeMetadata icon={Clock}>
                          <time dateTime={cronjob.nextTriggeredTime}>
                            {formatDateTime(
                              cronjob.nextTriggeredTime,
                              UTC_DATE_TIME_OPTIONS,
                              dictionary.common.notAvailable
                            )}
                          </time>
                        </AppTimeMetadata>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {dictionary.cronjobs.noNextRun}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <StatusActions
                          id={cronjob.id}
                          scheduleStatus={cronjob.scheduleStatus}
                          executionStatus={cronjob.executionStatus}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <AppListTableEmptyState colSpan={6}>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileClock aria-hidden="true" />
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
      </div>

      <AppPaginationControls page={cronjobPage} className="mt-4" />
    </div>
  )
}

function CronjobCard({
  cronjob,
  canUpdate,
}: {
  cronjob: CronjobResponse
  canUpdate: boolean
}) {
  const { dictionary, formatDateTime } = useLocalization()
  const t = dictionary.cronjobs

  return (
    <article
      className="min-w-0 rounded-xl border border-border bg-card p-4"
      aria-labelledby={`cronjob-card-${cronjob.id}`}
    >
      <div className="flex min-w-0 flex-col items-start gap-1">
        <h2
          id={`cronjob-card-${cronjob.id}`}
          className="text-sm font-semibold break-words text-foreground"
        >
          {cronjob.jobName}
        </h2>
        <p className="text-sm break-words text-muted-foreground">
          {cronjob.description || dictionary.common.notAvailable}
        </p>
        <CronjobDetailsLink id={cronjob.id} />
      </div>

      <dl className="mt-4 grid gap-3 border-t border-border pt-3 text-sm">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{t.groupColumn}</dt>
          <dd className="min-w-0 text-right break-words">{cronjob.jobGroup}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">
            {t.cronExpressionColumn}
          </dt>
          <dd className="mt-1 min-w-0">
            <CronExpressionCell
              cronjob={cronjob}
              canUpdate={canUpdate}
              className="justify-start"
            />
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t.statusColumn}</dt>
          <dd>
            <CronjobStatusFields
              cronjob={cronjob}
              className="flex flex-col gap-2"
            />
          </dd>
        </div>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">{t.nextRunColumn}</dt>
          <dd className="min-w-0 text-right">
            {cronjob.nextTriggeredTime ? (
              <AppTimeMetadata icon={Clock} className="justify-end">
                <time dateTime={cronjob.nextTriggeredTime}>
                  {formatDateTime(
                    cronjob.nextTriggeredTime,
                    UTC_DATE_TIME_OPTIONS,
                    dictionary.common.notAvailable
                  )}
                </time>
              </AppTimeMetadata>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t.noNextRun}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
        <span className="sr-only">{t.actionsColumn}</span>
        <StatusActions
          id={cronjob.id}
          scheduleStatus={cronjob.scheduleStatus}
          executionStatus={cronjob.executionStatus}
        />
      </div>
    </article>
  )
}

function CronjobEmptyState() {
  const { dictionary } = useLocalization()
  return (
    <Empty role="status" className="min-h-[240px] border bg-card px-6 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileClock aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{dictionary.cronjobs.emptyTitle}</EmptyTitle>
        <EmptyDescription>
          {dictionary.cronjobs.emptyDescription}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function CronjobDetailsLink({ id }: { id: number }) {
  const { dictionary } = useLocalization()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())
  params.set("detail", String(id))

  return (
    <LocalizedLink
      href={`/cronjobs?${params.toString()}#cronjob-detail-panel`}
      className={buttonVariants({
        variant: "link",
        size: "sm",
        className: "h-auto gap-1 p-0",
      })}
    >
      {dictionary.cronjobs.viewDetails}
      <ChevronRight aria-hidden="true" data-icon="inline-end" />
    </LocalizedLink>
  )
}

function CronExpressionCell({
  cronjob,
  canUpdate,
  className,
}: {
  cronjob: CronjobListResponse
  canUpdate: boolean
  className?: string
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
      <div
        className={`flex min-w-0 items-center gap-1 ${className ?? "justify-center"}`}
      >
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
      className={`flex items-center gap-1 ${className ?? "justify-center"}`}
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

function StatusActions({
  id,
  scheduleStatus,
  executionStatus,
}: {
  id: number
  scheduleStatus: CronjobResponse["scheduleStatus"]
  executionStatus: CronjobResponse["executionStatus"]
}) {
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

  const isNotRunning = executionStatus === "NOT_RUNNING"
  const canStart =
    isNotRunning &&
    (scheduleStatus === "SCHEDULED" || scheduleStatus === "UNSCHEDULED")
  const canPause = scheduleStatus === "SCHEDULED"
  const canResume = scheduleStatus === "PAUSED"

  return (
    <>
      {canStart && canStartCronjob ? (
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
      {canPause && canPauseCronjob ? (
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
      {canResume && canResumeCronjob ? (
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
