"use client"

import {
  getCronjobById,
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
import { useHasPermission } from "@/components/permission-provider"
import { SortSelect } from "@/components/sort-select"
import { Button } from "@/components/ui/button"
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
  Clock,
  FileClock,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react"
import { toast } from "sonner"

import { CronjobStatusField } from "./cronjob-status-fields"
import { CronjobSearch } from "./cronjob-search"

interface CronjobListProps {
  cronjobPage: {
    content: CronjobListResponse[]
    pagination?: Pick<
      Page<CronjobListResponse>,
      "number" | "numberOfElements" | "size" | "totalElements" | "totalPages"
    >
  }
}

const CRON_EXPRESSION_MAX_LENGTH = 100
const SEARCH_PARAM_KEY = "jobName[containsIgnoreCase]"
const UTC_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
}

function getEffectiveNextRun(
  cronjob: Pick<CronjobResponse, "scheduleStatus" | "nextTriggeredTime">
) {
  return cronjob.scheduleStatus === "SCHEDULED"
    ? cronjob.nextTriggeredTime
    : null
}

export function CronjobListPage({ cronjobPage }: CronjobListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const searchParams = useSearchParams()
  const cronjobs = cronjobPage.content
  const canUpdateCronjob = useHasPermission("cronjob:update")
  const isSearchResult = Boolean(searchParams.get(SEARCH_PARAM_KEY)?.trim())
  const [readbackPage, setReadbackPage] = useState(cronjobPage)
  const [cronjobReadbacks, setCronjobReadbacks] = useState<
    Record<number, CronjobResponse>
  >({})
  const [pendingStartIds, setPendingStartIds] = useState<Set<number>>(
    () => new Set()
  )
  const [startReadErrorIds, setStartReadErrorIds] = useState<number[]>([])
  const hasCurrentReadbacks = readbackPage === cronjobPage
  const displayedCronjobs = cronjobs.map(
    (cronjob) =>
      (hasCurrentReadbacks && cronjobReadbacks[cronjob.id]) || cronjob
  )

  const handleCronjobRead = (cronjob: CronjobResponse) => {
    setReadbackPage(cronjobPage)
    setCronjobReadbacks((current) => ({
      ...(hasCurrentReadbacks ? current : {}),
      [cronjob.id]: cronjob,
    }))
    setStartReadErrorIds((current) =>
      (hasCurrentReadbacks ? current : []).filter((id) => id !== cronjob.id)
    )
  }

  const handleStartPendingChange = (id: number, isPending: boolean) => {
    setPendingStartIds((current) => {
      const next = new Set(current)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleStartReadError = (id: number) => {
    setReadbackPage(cronjobPage)
    setCronjobReadbacks((current) => (hasCurrentReadbacks ? current : {}))
    setStartReadErrorIds((current) => {
      const readErrors = hasCurrentReadbacks ? current : []
      return readErrors.includes(id) ? readErrors : [...readErrors, id]
    })
  }

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
          displayedCronjobs.map((cronjob) => (
            <CronjobCard
              key={cronjob.id}
              cronjob={cronjob}
              canUpdate={canUpdateCronjob}
              onCronjobRead={handleCronjobRead}
              isStartPending={pendingStartIds.has(cronjob.id)}
              hasStartReadError={
                hasCurrentReadbacks && startReadErrorIds.includes(cronjob.id)
              }
              onStartPendingChange={handleStartPendingChange}
              onStartReadError={handleStartReadError}
            />
          ))
        ) : (
          <CronjobEmptyState isSearchResult={isSearchResult} />
        )}
      </div>

      <div className="hidden md:block">
        <AppListTable className="mt-4">
          <Table className="min-w-[76rem] table-fixed">
            <TableHeader>
              <AppListTableHeaderRow>
                <AppListTableHead className="w-[24%]">
                  {dictionary.cronjobs.jobNameColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[11%]">
                  {dictionary.cronjobs.groupColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[8%] text-center">
                  {dictionary.cronjobs.scheduleLabel}
                </AppListTableHead>
                <AppListTableHead className="w-[8%] text-center">
                  {dictionary.cronjobs.executionLabel}
                </AppListTableHead>
                <AppListTableHead className="w-[12%] text-center">
                  {dictionary.cronjobs.latestResultLabel}
                </AppListTableHead>
                <AppListTableHead className="w-[14%]">
                  {dictionary.cronjobs.cronExpressionColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[11%]">
                  {dictionary.cronjobs.nextRunListColumn}
                </AppListTableHead>
                <AppListTableHead className="w-[12%] text-center">
                  {dictionary.cronjobs.actionsColumn}
                </AppListTableHead>
              </AppListTableHeaderRow>
            </TableHeader>
            <TableBody>
              {cronjobs.length > 0 ? (
                displayedCronjobs.map((cronjob) => (
                  <TableRow
                    key={cronjob.id}
                    className="border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="align-top font-medium whitespace-normal text-foreground">
                      <div className="flex min-w-0 flex-col items-start gap-1">
                        <span className="break-words">{cronjob.jobName}</span>
                        <span className="text-xs font-normal break-words text-muted-foreground">
                          {cronjob.description ||
                            dictionary.common.notAvailable}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal text-muted-foreground">
                      <span className="break-words">{cronjob.jobGroup}</span>
                    </TableCell>
                    <TableCell className="text-center align-top">
                      <CronjobStatusField
                        cronjob={cronjob}
                        field="schedule"
                        labelClassName="sr-only"
                        className="flex-col items-center gap-1"
                      />
                    </TableCell>
                    <TableCell className="text-center align-top">
                      <CronjobStatusField
                        cronjob={cronjob}
                        field="execution"
                        labelClassName="sr-only"
                        className="flex-col items-center gap-1"
                      />
                    </TableCell>
                    <TableCell className="text-center align-top">
                      <CronjobStatusField
                        cronjob={cronjob}
                        field="latestResult"
                        labelClassName="sr-only"
                        className="flex-col items-center gap-1"
                      />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <CronExpressionCell
                        cronjob={cronjob}
                        canUpdate={canUpdateCronjob}
                        className="flex-wrap justify-center"
                      />
                    </TableCell>
                    <TableCell className="text-center align-top whitespace-normal">
                      {getEffectiveNextRun(cronjob) ? (
                        <AppTimeMetadata icon={Clock}>
                          <time dateTime={cronjob.nextTriggeredTime!}>
                            {formatDateTime(
                              cronjob.nextTriggeredTime!,
                              UTC_DATE_TIME_OPTIONS,
                              dictionary.common.notAvailable
                            )}
                          </time>
                        </AppTimeMetadata>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {dictionary.cronjobs.noNextRunList}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <StatusActions
                          id={cronjob.id}
                          scheduleStatus={cronjob.scheduleStatus}
                          executionStatus={cronjob.executionStatus}
                          onCronjobRead={handleCronjobRead}
                          isStartPending={pendingStartIds.has(cronjob.id)}
                          hasStartReadError={
                            hasCurrentReadbacks &&
                            startReadErrorIds.includes(cronjob.id)
                          }
                          onStartPendingChange={handleStartPendingChange}
                          onStartReadError={handleStartReadError}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <AppListTableEmptyState colSpan={8}>
                  <EmptyHeader role="status" aria-live="polite">
                    <EmptyMedia variant="icon">
                      <FileClock aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>
                      {isSearchResult
                        ? dictionary.cronjobs.noSearchResultsTitle
                        : dictionary.cronjobs.emptyTitle}
                    </EmptyTitle>
                    <EmptyDescription>
                      {isSearchResult
                        ? dictionary.cronjobs.noSearchResultsDescription
                        : dictionary.cronjobs.emptyDescription}
                    </EmptyDescription>
                  </EmptyHeader>
                </AppListTableEmptyState>
              )}
            </TableBody>
          </Table>
        </AppListTable>
      </div>

      {cronjobPage.pagination ? (
        <AppPaginationControls page={cronjobPage.pagination} className="mt-4" />
      ) : cronjobs.length > 0 ? (
        <p role="status" className="mt-4 text-xs text-muted-foreground">
          {dictionary.cronjobs.paginationUnavailable}
        </p>
      ) : null}
    </div>
  )
}

function CronjobCard({
  cronjob,
  canUpdate,
  onCronjobRead,
  isStartPending,
  hasStartReadError,
  onStartPendingChange,
  onStartReadError,
}: {
  cronjob: CronjobResponse
  canUpdate: boolean
  onCronjobRead: (cronjob: CronjobResponse) => void
  isStartPending: boolean
  hasStartReadError: boolean
  onStartPendingChange: (id: number, isPending: boolean) => void
  onStartReadError: (id: number) => void
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
      </div>

      <div className="mt-4 grid gap-3 border-t border-border pt-3 text-sm">
        <dl>
          <dt className="text-xs text-muted-foreground">
            {t.cronExpressionColumn}
          </dt>
          <dd className="mt-1 min-w-0">
            <CronExpressionCell
              cronjob={cronjob}
              canUpdate={canUpdate}
              className="flex-wrap justify-start"
            />
          </dd>
        </dl>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-2">
          <CronjobStatusField
            cronjob={cronjob}
            field="schedule"
            className="flex-col items-start gap-1"
          />
          <CronjobStatusField
            cronjob={cronjob}
            field="execution"
            className="flex-col items-start gap-1"
          />
          <CronjobStatusField
            cronjob={cronjob}
            field="latestResult"
            className="flex-col items-start gap-1"
          />
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <div className="min-w-0">
            <dl>
              <dt className="text-xs text-muted-foreground">{t.groupColumn}</dt>
              <dd className="mt-1 min-w-0 break-words">{cronjob.jobGroup}</dd>
            </dl>
          </div>
          <div className="min-w-0">
            <dl>
              <dt className="text-xs text-muted-foreground">
                {t.nextRunListColumn}
              </dt>
              <dd className="mt-1 min-w-0 break-words">
                {getEffectiveNextRun(cronjob) ? (
                  <AppTimeMetadata icon={Clock} className="justify-start">
                    <time dateTime={cronjob.nextTriggeredTime!}>
                      {formatDateTime(
                        cronjob.nextTriggeredTime!,
                        UTC_DATE_TIME_OPTIONS,
                        dictionary.common.notAvailable
                      )}
                    </time>
                  </AppTimeMetadata>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t.noNextRunList}
                  </span>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-start gap-1 border-t border-border pt-3">
        <StatusActions
          id={cronjob.id}
          scheduleStatus={cronjob.scheduleStatus}
          executionStatus={cronjob.executionStatus}
          onCronjobRead={onCronjobRead}
          isStartPending={isStartPending}
          hasStartReadError={hasStartReadError}
          onStartPendingChange={onStartPendingChange}
          onStartReadError={onStartReadError}
        />
      </div>
    </article>
  )
}

function CronjobEmptyState({ isSearchResult }: { isSearchResult: boolean }) {
  const { dictionary } = useLocalization()
  return (
    <Empty role="status" className="min-h-[240px] border bg-card px-6 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileClock aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {isSearchResult
            ? dictionary.cronjobs.noSearchResultsTitle
            : dictionary.cronjobs.emptyTitle}
        </EmptyTitle>
        <EmptyDescription>
          {isSearchResult
            ? dictionary.cronjobs.noSearchResultsDescription
            : dictionary.cronjobs.emptyDescription}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
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
  const inputId = useId()
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
        <span className="block min-w-0 font-mono text-sm break-all text-muted-foreground">
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
        <FieldLabel htmlFor={`cron-expression-${inputId}`} className="sr-only">
          {dictionary.cronjobs.cronExpressionColumn}
        </FieldLabel>
        <Input
          id={`cron-expression-${inputId}`}
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
  onCronjobRead,
  isStartPending,
  hasStartReadError,
  onStartPendingChange,
  onStartReadError,
}: {
  id: number
  scheduleStatus: CronjobResponse["scheduleStatus"]
  executionStatus: CronjobResponse["executionStatus"]
  onCronjobRead: (cronjob: CronjobResponse) => void
  isStartPending: boolean
  hasStartReadError: boolean
  onStartPendingChange: (id: number, isPending: boolean) => void
  onStartReadError: (id: number) => void
}) {
  const { dictionary } = useLocalization()
  const canReadCronjob = useHasPermission("cronjob:read")
  const canStartCronjob = useHasPermission("cronjob:start")
  const canPauseCronjob = useHasPermission("cronjob:pause")
  const canResumeCronjob = useHasPermission("cronjob:resume")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const actionsRef = useRef<HTMLDivElement>(null)
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const shouldFocusActions = useRef(false)

  const handleStart = () => {
    shouldFocusActions.current =
      startButtonRef.current === document.activeElement
    onStartPendingChange(id, true)
    startTransition(async () => {
      try {
        const result = await startCronjob(id)
        if (result.success) {
          toast.success(dictionary.cronjobs.startAccepted)
        } else {
          toast.error(result.error || dictionary.cronjobs.startError)
        }
      } catch {
        toast.error(dictionary.cronjobs.startError)
      } finally {
        try {
          const cronjob = await getCronjobById(id)
          onCronjobRead(cronjob)
        } catch {
          onStartReadError(id)
        } finally {
          onStartPendingChange(id, false)
        }
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
    canReadCronjob &&
    isNotRunning &&
    (scheduleStatus === "SCHEDULED" || scheduleStatus === "UNSCHEDULED")
  const canPause = scheduleStatus === "SCHEDULED"
  const canResume = scheduleStatus === "PAUSED"

  useEffect(() => {
    if (!canStart && shouldFocusActions.current) {
      actionsRef.current?.focus()
      shouldFocusActions.current = false
    }
  }, [canStart])

  return (
    <div
      ref={actionsRef}
      role="group"
      aria-label={dictionary.cronjobs.actionsColumn}
      tabIndex={-1}
      className="flex flex-wrap items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {canStart && canStartCronjob ? (
        <Button
          ref={startButtonRef}
          type="button"
          variant="default"
          size="lg"
          className="bg-positive-action text-positive-action-foreground hover:bg-positive-action/90"
          title={
            isStartPending
              ? dictionary.cronjobs.starting
              : dictionary.cronjobs.start
          }
          disabled={isPending || isStartPending}
          aria-busy={isStartPending}
          onClick={handleStart}
        >
          {isStartPending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Play data-icon="inline-start" />
          )}
          <span aria-live="polite">
            {isStartPending
              ? dictionary.cronjobs.starting
              : dictionary.cronjobs.start}
          </span>
        </Button>
      ) : null}
      {canPause && canPauseCronjob ? (
        <Button
          variant="ghost"
          size="icon"
          title={dictionary.cronjobs.pause}
          disabled={isPending || isStartPending}
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
          disabled={isPending || isStartPending}
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
      {hasStartReadError ? (
        <span
          role="alert"
          className="basis-full text-left text-xs text-destructive"
        >
          {dictionary.cronjobs.startReadError}
        </span>
      ) : null}
    </div>
  )
}
