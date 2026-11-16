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
import {
  CRONJOB_RESUME_PERMISSION,
  CRONJOB_UPDATE_PERMISSION,
} from "@/app/lib/cronjobs/permissions"
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

type CronExpressionEditorSurface = "mobile" | "wide"
type CronExpressionEditorFocusTarget = "input" | "edit"

type CronExpressionEditorState = {
  isEditing: boolean
  draftExpression: string
  error: string | null
  isSaving: boolean
  focusSurface: CronExpressionEditorSurface | null
  focusTarget: CronExpressionEditorFocusTarget | null
  scheduleUnverified: boolean
}

type CronExpressionEditorUpdate = (
  state: CronExpressionEditorState
) => CronExpressionEditorState

function getEffectiveNextRun(
  cronjob: Pick<CronjobResponse, "scheduleStatus" | "nextTriggeredTime">
) {
  return cronjob.scheduleStatus === "SCHEDULED"
    ? cronjob.nextTriggeredTime
    : null
}

function getVisibleCronExpressionSurface(): CronExpressionEditorSurface {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 48rem)").matches
    ? "wide"
    : "mobile"
}

export function CronjobListPage({ cronjobPage }: CronjobListProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const searchParams = useSearchParams()
  const cronjobs = cronjobPage.content
  const canUpdateCronjob = useHasPermission(CRONJOB_UPDATE_PERMISSION)
  const isSearchResult = Boolean(searchParams.get(SEARCH_PARAM_KEY)?.trim())
  const [readbackPage, setReadbackPage] = useState(cronjobPage)
  const [cronjobReadbacks, setCronjobReadbacks] = useState<
    Record<number, CronjobResponse>
  >({})
  const [pendingStartIds, setPendingStartIds] = useState<Set<number>>(
    () => new Set()
  )
  const [pendingPauseIds, setPendingPauseIds] = useState<Set<number>>(
    () => new Set()
  )
  const [pendingResumeIds, setPendingResumeIds] = useState<Set<number>>(
    () => new Set()
  )
  const [statusReadErrorTimes, setStatusReadErrorTimes] = useState<
    Record<number, number>
  >({})
  const [pauseReadErrorTimes, setPauseReadErrorTimes] = useState<
    Record<number, number>
  >({})
  const [cronExpressionEditors, setCronExpressionEditors] = useState<
    Record<number, CronExpressionEditorState>
  >({})
  const previousCronjobPage = useRef(cronjobPage)
  useEffect(() => {
    if (previousCronjobPage.current === cronjobPage) return

    previousCronjobPage.current = cronjobPage
    setCronExpressionEditors((current) => {
      let changed = false
      const next = { ...current }
      for (const [id, state] of Object.entries(current)) {
        if (!state.scheduleUnverified) continue
        next[Number(id)] = {
          ...state,
          error: null,
          scheduleUnverified: false,
        }
        changed = true
      }
      return changed ? next : current
    })
  }, [cronjobPage])
  const hasCurrentReadbacks = readbackPage === cronjobPage
  const displayedCronjobs = cronjobs.map(
    (cronjob) =>
      (hasCurrentReadbacks && cronjobReadbacks[cronjob.id]) || cronjob
  )

  const updateCronExpressionEditor = (
    id: number,
    expression: string,
    update: CronExpressionEditorUpdate
  ) => {
    setCronExpressionEditors((current) => ({
      ...current,
      [id]: update(
        current[id] ?? {
          isEditing: false,
          draftExpression: expression,
          error: null,
          isSaving: false,
          focusSurface: null,
          focusTarget: null,
          scheduleUnverified: false,
        }
      ),
    }))
  }

  const handleCronjobRead = (cronjob: CronjobResponse) => {
    setReadbackPage(cronjobPage)
    setCronjobReadbacks((current) => ({
      ...(hasCurrentReadbacks ? current : {}),
      [cronjob.id]: cronjob,
    }))
    setCronExpressionEditors((current) => {
      const editor = current[cronjob.id]
      if (!editor?.scheduleUnverified) return current
      return {
        ...current,
        [cronjob.id]: {
          ...editor,
          error: null,
          scheduleUnverified: false,
        },
      }
    })
    setStatusReadErrorTimes((current) => {
      const next = hasCurrentReadbacks ? { ...current } : {}
      delete next[cronjob.id]
      return next
    })
    setPauseReadErrorTimes((current) => {
      const next = hasCurrentReadbacks ? { ...current } : {}
      delete next[cronjob.id]
      return next
    })
  }

  const handleStartPendingChange = (id: number, isPending: boolean) => {
    setPendingStartIds((current) => {
      const next = new Set(current)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handlePausePendingChange = (id: number, isPending: boolean) => {
    setPendingPauseIds((current) => {
      const next = new Set(current)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleResumePendingChange = (id: number, isPending: boolean) => {
    setPendingResumeIds((current) => {
      const next = new Set(current)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handlePauseReadError = (id: number) => {
    setReadbackPage(cronjobPage)
    setCronjobReadbacks((current) => {
      const next = hasCurrentReadbacks ? { ...current } : {}
      delete next[id]
      return next
    })
    setPauseReadErrorTimes((current) => ({
      ...(hasCurrentReadbacks ? current : {}),
      [id]: Date.now(),
    }))
  }

  const handleStatusReadError = (id: number) => {
    setReadbackPage(cronjobPage)
    setCronjobReadbacks((current) => (hasCurrentReadbacks ? current : {}))
    setStatusReadErrorTimes((current) => ({
      ...(hasCurrentReadbacks ? current : {}),
      [id]: Date.now(),
    }))
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
              editorState={cronExpressionEditors[cronjob.id]}
              onEditorStateChange={(update) =>
                updateCronExpressionEditor(
                  cronjob.id,
                  cronjob.cronExpression,
                  update
                )
              }
              onCronjobRead={handleCronjobRead}
              isStartPending={pendingStartIds.has(cronjob.id)}
              isResumePending={pendingResumeIds.has(cronjob.id)}
              isPausePending={pendingPauseIds.has(cronjob.id)}
              statusReadErrorAt={
                hasCurrentReadbacks
                  ? statusReadErrorTimes[cronjob.id]
                  : undefined
              }
              pauseReadErrorAt={
                hasCurrentReadbacks
                  ? pauseReadErrorTimes[cronjob.id]
                  : undefined
              }
              onStartPendingChange={handleStartPendingChange}
              onStatusReadError={handleStatusReadError}
              onPausePendingChange={handlePausePendingChange}
              onPauseReadError={handlePauseReadError}
              onResumePendingChange={handleResumePendingChange}
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
                        editorState={cronExpressionEditors[cronjob.id]}
                        onEditorStateChange={(update) =>
                          updateCronExpressionEditor(
                            cronjob.id,
                            cronjob.cronExpression,
                            update
                          )
                        }
                        surface="wide"
                        canUpdate={
                          canUpdateCronjob &&
                          cronjob.executionStatus !== "RUNNING"
                        }
                        onCronjobRead={handleCronjobRead}
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
                    <TableCell className="text-center align-top whitespace-normal">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <StatusActions
                          id={cronjob.id}
                          scheduleStatus={cronjob.scheduleStatus}
                          executionStatus={cronjob.executionStatus}
                          onCronjobRead={handleCronjobRead}
                          isStartPending={pendingStartIds.has(cronjob.id)}
                          isResumePending={pendingResumeIds.has(cronjob.id)}
                          isPausePending={pendingPauseIds.has(cronjob.id)}
                          statusReadErrorAt={
                            hasCurrentReadbacks
                              ? statusReadErrorTimes[cronjob.id]
                              : undefined
                          }
                          pauseReadErrorAt={
                            hasCurrentReadbacks
                              ? pauseReadErrorTimes[cronjob.id]
                              : undefined
                          }
                          onStartPendingChange={handleStartPendingChange}
                          onStatusReadError={handleStatusReadError}
                          onPausePendingChange={handlePausePendingChange}
                          onPauseReadError={handlePauseReadError}
                          onResumePendingChange={handleResumePendingChange}
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
  editorState,
  onEditorStateChange,
  onCronjobRead,
  isStartPending,
  isResumePending,
  isPausePending,
  statusReadErrorAt,
  pauseReadErrorAt,
  onStartPendingChange,
  onStatusReadError,
  onPausePendingChange,
  onPauseReadError,
  onResumePendingChange,
}: {
  cronjob: CronjobResponse
  canUpdate: boolean
  editorState?: CronExpressionEditorState
  onEditorStateChange: (update: CronExpressionEditorUpdate) => void
  onCronjobRead: (cronjob: CronjobResponse) => void
  isStartPending: boolean
  isResumePending: boolean
  isPausePending: boolean
  statusReadErrorAt?: number
  pauseReadErrorAt?: number
  onStartPendingChange: (id: number, isPending: boolean) => void
  onStatusReadError: (id: number) => void
  onPausePendingChange: (id: number, isPending: boolean) => void
  onPauseReadError: (id: number) => void
  onResumePendingChange: (id: number, isPending: boolean) => void
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
              editorState={editorState}
              onEditorStateChange={onEditorStateChange}
              surface="mobile"
              canUpdate={canUpdate && cronjob.executionStatus !== "RUNNING"}
              onCronjobRead={onCronjobRead}
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
          isResumePending={isResumePending}
          isPausePending={isPausePending}
          statusReadErrorAt={statusReadErrorAt}
          pauseReadErrorAt={pauseReadErrorAt}
          onStartPendingChange={onStartPendingChange}
          onStatusReadError={onStatusReadError}
          onPausePendingChange={onPausePendingChange}
          onPauseReadError={onPauseReadError}
          onResumePendingChange={onResumePendingChange}
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
  editorState,
  onEditorStateChange,
  surface,
  canUpdate,
  onCronjobRead,
  className,
}: {
  cronjob: CronjobListResponse
  editorState?: CronExpressionEditorState
  onEditorStateChange: (update: CronExpressionEditorUpdate) => void
  surface: CronExpressionEditorSurface
  canUpdate: boolean
  onCronjobRead: (cronjob: CronjobResponse) => void
  className?: string
}) {
  const { dictionary } = useLocalization()
  const inputId = useId()
  const errorId = `cron-expression-error-${inputId}`
  const state = editorState ?? {
    isEditing: false,
    draftExpression: cronjob.cronExpression,
    error: null,
    isSaving: false,
    focusSurface: null,
    focusTarget: null,
    scheduleUnverified: false,
  }
  const {
    isEditing,
    draftExpression,
    error,
    isSaving,
    focusSurface,
    focusTarget,
    scheduleUnverified,
  } = state
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const expressionRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isEditing) {
      if (
        focusTarget === "input" &&
        focusSurface === surface &&
        !isSaving &&
        getVisibleCronExpressionSurface() === surface
      ) {
        inputRef.current?.focus()
        onEditorStateChange((current) =>
          current.focusTarget === "input" && current.focusSurface === surface
            ? { ...current, focusTarget: null }
            : current
        )
      }

      if (typeof window.matchMedia !== "function") {
        return
      }

      const layoutBreakpoint = window.matchMedia("(min-width: 48rem)")
      const focusVisibleInput = () => {
        const visibleSurface = layoutBreakpoint.matches ? "wide" : "mobile"
        if (visibleSurface === surface && !isSaving) {
          window.requestAnimationFrame(() => {
            if (getVisibleCronExpressionSurface() === surface) {
              inputRef.current?.focus()
            }
          })
        }
      }

      layoutBreakpoint.addEventListener("change", focusVisibleInput)
      return () =>
        layoutBreakpoint.removeEventListener("change", focusVisibleInput)
    }

    if (
      focusTarget === "edit" &&
      focusSurface === surface &&
      getVisibleCronExpressionSurface() === surface
    ) {
      ;(editButtonRef.current ?? expressionRef.current)?.focus()
      onEditorStateChange((current) =>
        current.focusTarget === "edit" && current.focusSurface === surface
          ? { ...current, focusTarget: null }
          : current
      )
    }
  }, [
    focusSurface,
    focusTarget,
    isEditing,
    isSaving,
    onEditorStateChange,
    surface,
  ])

  const handleCancel = () => {
    const visibleSurface = getVisibleCronExpressionSurface()
    onEditorStateChange((current) => ({
      ...current,
      isEditing: false,
      draftExpression: cronjob.cronExpression,
      error: null,
      isSaving: false,
      focusSurface: visibleSurface,
      focusTarget: "edit",
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const expression = draftExpression.trim()
    if (!expression) {
      const visibleSurface = getVisibleCronExpressionSurface()
      onEditorStateChange((current) => ({
        ...current,
        error: dictionary.cronjobs.cronRequired,
        focusSurface: visibleSurface,
        focusTarget: "input",
      }))
      return
    }

    onEditorStateChange((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }))
    try {
      const result = await updateCronjob(cronjob.id, { expression })
      if (result.data) {
        onCronjobRead(result.data)
      }

      if (result.success) {
        toast.success(dictionary.cronjobs.cronUpdated)
        const visibleSurface = getVisibleCronExpressionSurface()
        onEditorStateChange((current) => ({
          ...current,
          isEditing: false,
          draftExpression: result.data.cronExpression,
          error: null,
          isSaving: false,
          focusSurface: visibleSurface,
          focusTarget: "edit",
          scheduleUnverified: false,
        }))
        router.refresh()
      } else {
        const visibleSurface = getVisibleCronExpressionSurface()
        const scheduleUnverified = result.ambiguous && !result.data
        onEditorStateChange((current) => ({
          ...current,
          error: result.error || dictionary.cronjobs.cronUpdateError,
          isSaving: true,
          focusSurface: visibleSurface,
          focusTarget: "input",
          scheduleUnverified: result.data
            ? false
            : scheduleUnverified || current.scheduleUnverified,
        }))
        router.refresh()
      }
    } catch {
      const visibleSurface = getVisibleCronExpressionSurface()
      onEditorStateChange((current) => ({
        ...current,
        error: dictionary.cronjobs.cronUpdateReadbackUnavailable,
        isSaving: true,
        focusSurface: visibleSurface,
        focusTarget: "input",
        scheduleUnverified: true,
      }))
      router.refresh()
    } finally {
      onEditorStateChange((current) => ({ ...current, isSaving: false }))
    }
  }

  if (!isEditing) {
    return (
      <div className="flex min-w-0 flex-col items-start gap-1">
        <div
          className={`flex min-w-0 flex-wrap items-center gap-1 ${className ?? "justify-center"}`}
        >
          <span className="block min-w-0 font-mono text-sm break-all text-muted-foreground">
            <span ref={expressionRef} tabIndex={-1}>
              {cronjob.cronExpression}
            </span>
          </span>
          {canUpdate ? (
            <Button
              ref={editButtonRef}
              type="button"
              variant="outline"
              size="sm"
              aria-label={dictionary.cronjobs.editCron}
              onClick={() => {
                onEditorStateChange((current) => ({
                  ...current,
                  isEditing: true,
                  draftExpression: cronjob.cronExpression,
                  error: null,
                  focusSurface: getVisibleCronExpressionSurface(),
                  focusTarget: "input",
                }))
              }}
            >
              <Pencil data-icon="inline-start" />
              <span>{dictionary.common.edit}</span>
            </Button>
          ) : null}
        </div>
        {scheduleUnverified ? (
          <p role="status" className="min-w-0 text-xs text-destructive">
            {dictionary.cronjobs.lastConfirmedSchedule} ·{" "}
            <code className="break-all">{cronjob.cronExpression}</code>.{" "}
            {dictionary.cronjobs.effectiveScheduleUnverified}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form
      className={`flex w-full min-w-0 flex-wrap items-start gap-1 ${className ?? "justify-center"}`}
      aria-busy={isSaving}
      onSubmit={handleSubmit}
    >
      <Field data-invalid={Boolean(error)} className="min-w-[8rem] flex-1">
        <FieldLabel htmlFor={`cron-expression-${inputId}`} className="sr-only">
          {dictionary.cronjobs.cronExpressionColumn}
        </FieldLabel>
        <Input
          id={`cron-expression-${inputId}`}
          value={draftExpression}
          onChange={(event) => {
            onEditorStateChange((current) => ({
              ...current,
              draftExpression: event.target.value,
              error: current.error ? null : current.error,
            }))
          }}
          ref={inputRef}
          autoComplete="off"
          placeholder={dictionary.cronjobs.cronExpressionPlaceholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={isSaving || !canUpdate}
          className="min-w-[8rem]"
        />
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
        <p className="w-full text-xs text-muted-foreground">
          {scheduleUnverified
            ? dictionary.cronjobs.lastConfirmedSchedule
            : dictionary.cronjobs.savedSchedule}{" "}
          · <code className="break-all">{cronjob.cronExpression}</code>
        </p>
        {scheduleUnverified ? (
          <p role="status" className="w-full text-xs text-destructive">
            {dictionary.cronjobs.effectiveScheduleUnverified}
          </p>
        ) : null}
      </Field>
      <div className="flex items-center gap-1">
        <Button
          type="submit"
          variant="default"
          size="sm"
          aria-label={
            isSaving ? dictionary.common.saving : dictionary.cronjobs.saveCron
          }
          disabled={isSaving || !canUpdate}
        >
          {isSaving ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          <span>
            {isSaving ? dictionary.common.saving : dictionary.common.save}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={dictionary.cronjobs.cancelEdit}
          disabled={isSaving}
          onClick={handleCancel}
        >
          <X data-icon="inline-start" />
          <span>{dictionary.common.cancel}</span>
        </Button>
      </div>
      {isSaving ? (
        <span role="status" className="sr-only">
          {dictionary.common.saving}
        </span>
      ) : null}
    </form>
  )
}

function StatusActions({
  id,
  scheduleStatus,
  executionStatus,
  onCronjobRead,
  isStartPending,
  isResumePending,
  isPausePending,
  statusReadErrorAt,
  pauseReadErrorAt,
  onStartPendingChange,
  onStatusReadError,
  onPausePendingChange,
  onPauseReadError,
  onResumePendingChange,
}: {
  id: number
  scheduleStatus: CronjobResponse["scheduleStatus"]
  executionStatus: CronjobResponse["executionStatus"]
  onCronjobRead: (cronjob: CronjobResponse) => void
  isStartPending: boolean
  isResumePending: boolean
  isPausePending: boolean
  statusReadErrorAt?: number
  pauseReadErrorAt?: number
  onStartPendingChange: (id: number, isPending: boolean) => void
  onStatusReadError: (id: number) => void
  onPausePendingChange: (id: number, isPending: boolean) => void
  onPauseReadError: (id: number) => void
  onResumePendingChange: (id: number, isPending: boolean) => void
}) {
  const { dictionary, formatDateTime } = useLocalization()
  const canReadCronjob = useHasPermission("cronjob:read")
  const canStartCronjob = useHasPermission("cronjob:start")
  const canPauseCronjob = useHasPermission("cronjob:pause")
  const canResumeCronjob = useHasPermission(CRONJOB_RESUME_PERMISSION)
  const [isPending, startTransition] = useTransition()
  const actionsRef = useRef<HTMLDivElement>(null)
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const pauseButtonRef = useRef<HTMLButtonElement>(null)
  const resumeButtonRef = useRef<HTMLButtonElement>(null)
  const pauseReadErrorRef = useRef<HTMLSpanElement>(null)
  const shouldFocusActions = useRef(false)
  const shouldFocusPauseResult = useRef(false)
  const [pauseReadbackStatus, setPauseReadbackStatus] = useState<
    CronjobResponse["scheduleStatus"] | null
  >(null)

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
          onStatusReadError(id)
        } finally {
          onStartPendingChange(id, false)
        }
      }
    })
  }

  const handlePause = () => {
    shouldFocusPauseResult.current =
      pauseButtonRef.current === document.activeElement
    setPauseReadbackStatus(null)
    onPausePendingChange(id, true)
    startTransition(async () => {
      let pauseError: string | undefined
      let pauseFailureIsKnown = false
      try {
        const result = await pauseCronjob(id)
        if (!result.success) {
          pauseError = result.error || dictionary.cronjobs.pauseError
          pauseFailureIsKnown = !result.ambiguous
        }
      } catch {
        pauseError = dictionary.cronjobs.pauseError
      }

      try {
        const cronjob = await getCronjobById(id)
        onCronjobRead(cronjob)
        setPauseReadbackStatus(cronjob.scheduleStatus)
        if (pauseFailureIsKnown) {
          toast.error(pauseError || dictionary.cronjobs.pauseError)
        } else if (cronjob.scheduleStatus === "PAUSED") {
          toast.success(dictionary.cronjobs.paused)
        } else if (pauseError) {
          toast.error(pauseError)
        } else {
          toast.error(dictionary.cronjobs.pauseNotConfirmed)
        }
      } catch {
        onPauseReadError(id)
        const pauseReadError = dictionary.cronjobs.pauseReadError.replace(
          "{time}",
          formatDateTime(Date.now(), {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
            timeZoneName: "short",
          })
        )
        toast.error(pauseError || pauseReadError)
      } finally {
        onPausePendingChange(id, false)
      }
    })
  }

  const handleResume = () => {
    shouldFocusActions.current =
      resumeButtonRef.current === document.activeElement
    onResumePendingChange(id, true)
    startTransition(async () => {
      try {
        let resumeError: string | undefined
        let resumeFailureIsKnown = false
        try {
          const result = await resumeCronjob(id)
          if (result.success) {
            onCronjobRead(result.data)
            toast.success(dictionary.cronjobs.resumed)
            return
          }
          resumeError = result.error || dictionary.cronjobs.resumeError
          resumeFailureIsKnown = !result.ambiguous
        } catch {
          resumeError = dictionary.cronjobs.resumeError
        }

        try {
          const cronjob = await getCronjobById(id)
          onCronjobRead(cronjob)
          if (resumeFailureIsKnown) {
            toast.error(resumeError || dictionary.cronjobs.resumeError)
          } else if (cronjob.scheduleStatus === "SCHEDULED") {
            toast.success(dictionary.cronjobs.resumed)
          } else {
            toast.error(dictionary.cronjobs.resumeNotConfirmed)
          }
        } catch {
          onStatusReadError(id)
          if (resumeFailureIsKnown) {
            toast.error(resumeError || dictionary.cronjobs.resumeError)
          }
        }
      } finally {
        onResumePendingChange(id, false)
      }
    })
  }

  const isNotRunning = executionStatus === "NOT_RUNNING"
  const canStart =
    canReadCronjob &&
    isNotRunning &&
    (scheduleStatus === "SCHEDULED" || scheduleStatus === "UNSCHEDULED")
  const canPause = canReadCronjob && scheduleStatus === "SCHEDULED"
  const canResume = canReadCronjob && scheduleStatus === "PAUSED"
  const hasStatusReadError = statusReadErrorAt !== undefined
  const hasPauseReadError = pauseReadErrorAt !== undefined
  const isStatusActionPending =
    isPending || isStartPending || isPausePending || isResumePending

  useEffect(() => {
    if (!isStatusActionPending && shouldFocusActions.current) {
      if (canStart && !hasStatusReadError) {
        startButtonRef.current?.focus()
      } else if (canResume && canResumeCronjob && !hasStatusReadError) {
        resumeButtonRef.current?.focus()
      } else {
        actionsRef.current?.focus()
      }
      shouldFocusActions.current = false
    }
  }, [
    canResume,
    canResumeCronjob,
    canStart,
    hasStatusReadError,
    isStatusActionPending,
  ])

  useEffect(() => {
    if (!isPending && !isPausePending && shouldFocusPauseResult.current) {
      if (hasPauseReadError) {
        pauseReadErrorRef.current?.focus()
      } else if (canResume && canResumeCronjob) {
        resumeButtonRef.current?.focus()
      } else if (canPause && canPauseCronjob && !hasStatusReadError) {
        pauseButtonRef.current?.focus()
      } else if (canStart && canStartCronjob && !hasStatusReadError) {
        startButtonRef.current?.focus()
      } else if (pauseReadbackStatus) {
        const scheduleStatus = actionsRef.current
          ?.closest("article, tr")
          ?.querySelector<HTMLElement>("[data-cronjob-schedule-status]")
        scheduleStatus?.focus()
      } else {
        actionsRef.current?.focus()
      }
      shouldFocusPauseResult.current = false
    }
  }, [
    canPause,
    canPauseCronjob,
    canResume,
    canResumeCronjob,
    canStart,
    canStartCronjob,
    hasPauseReadError,
    hasStatusReadError,
    isPausePending,
    isPending,
    pauseReadbackStatus,
  ])

  return (
    <div
      ref={actionsRef}
      role="group"
      aria-label={dictionary.cronjobs.actionsColumn}
      tabIndex={-1}
      className="flex min-w-0 flex-wrap items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {canStart && canStartCronjob ? (
        <Button
          ref={startButtonRef}
          type="button"
          variant="positive"
          size="lg"
          title={
            isStartPending
              ? dictionary.cronjobs.starting
              : dictionary.cronjobs.start
          }
          disabled={
            isStatusActionPending || hasStatusReadError || hasPauseReadError
          }
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
          ref={pauseButtonRef}
          variant="ghost"
          size="icon"
          title={
            isPausePending
              ? dictionary.cronjobs.pausing
              : dictionary.cronjobs.pause
          }
          disabled={
            isStatusActionPending || hasStatusReadError || hasPauseReadError
          }
          aria-busy={isPausePending}
          onClick={handlePause}
        >
          {isPausePending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Pause aria-hidden="true" data-icon="inline-start" />
          )}
          <span className="sr-only" aria-live="polite">
            {isPausePending
              ? dictionary.cronjobs.pausing
              : dictionary.cronjobs.pause}
          </span>
        </Button>
      ) : null}
      {canPause && !canPauseCronjob ? (
        <span
          role="status"
          className="basis-full text-left text-xs text-muted-foreground"
        >
          {dictionary.cronjobs.pausePermissionDenied}
        </span>
      ) : null}
      {canResume && !canResumeCronjob ? (
        <span
          role="status"
          className="basis-full text-left text-xs text-muted-foreground"
        >
          {dictionary.cronjobs.resumePermissionError}
        </span>
      ) : null}
      {canResume && canResumeCronjob ? (
        <Button
          ref={resumeButtonRef}
          variant="default"
          size="lg"
          title={
            isResumePending
              ? dictionary.cronjobs.resuming
              : dictionary.cronjobs.resume
          }
          disabled={
            isStatusActionPending || hasStatusReadError || hasPauseReadError
          }
          aria-busy={isResumePending}
          onClick={handleResume}
        >
          {isResumePending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : (
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
          )}
          <span aria-live="polite">
            {isResumePending
              ? dictionary.cronjobs.resuming
              : dictionary.cronjobs.resume}
          </span>
        </Button>
      ) : null}
      {hasStatusReadError ? (
        <span
          role="alert"
          className="basis-full text-left text-xs break-words text-destructive"
        >
          {dictionary.cronjobs.statusReadError.replace(
            "{time}",
            formatDateTime(statusReadErrorAt, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
              timeZoneName: "short",
            })
          )}
        </span>
      ) : null}
      {hasPauseReadError ? (
        <span
          ref={pauseReadErrorRef}
          role="alert"
          tabIndex={-1}
          className="basis-full text-left text-xs break-words text-destructive"
        >
          {dictionary.cronjobs.pauseReadError.replace(
            "{time}",
            formatDateTime(pauseReadErrorAt, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
              timeZoneName: "short",
            })
          )}
        </span>
      ) : null}
    </div>
  )
}
