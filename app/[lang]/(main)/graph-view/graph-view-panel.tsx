"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { CalendarDays } from "lucide-react"

import { getGraphViewForWorkspace } from "@/app/api/graph-view/action"
import {
  graphViewDaysSchema,
  type GraphViewDays,
  type GraphViewResponse,
} from "@/app/lib/graph-view/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import type { BackendWorkspaceSummary } from "@/app/lib/users/definitions"
import { AccessDenied } from "@/components/access-denied"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { GraphViewStateActions } from "./graph-view-state-actions"
import { SigmaGraphViewEntry } from "./sigma-graph-view-entry"

type GraphViewPanelProps = {
  userId: number
  workspace: BackendWorkspaceSummary
  graphView: GraphViewResponse
  initialWatchlistIsEmpty: boolean | null
  canReadWorkspace: boolean
  canManageWatchlist: boolean
}

type LoadState =
  | "ready"
  | "loading"
  | "permission-denied"
  | "error"
  | "workspace-required"
  | "workspace-changed"

export function GraphViewPanel({
  userId,
  workspace,
  graphView: initialGraphView,
  initialWatchlistIsEmpty,
  canReadWorkspace,
  canManageWatchlist,
}: GraphViewPanelProps) {
  const { dictionary, formatMessage } = useLocalization()
  const copy = dictionary.graphView.demo
  const router = useRouter()
  const [days, setDays] = useState<GraphViewDays>(7)
  const [graphView, setGraphView] = useState<GraphViewResponse | null>(
    initialGraphView
  )
  const [watchlistIsEmpty, setWatchlistIsEmpty] = useState(
    initialWatchlistIsEmpty
  )
  const [loadState, setLoadState] = useState<LoadState>("ready")
  const latestRequest = useRef(0)

  useEffect(
    () => () => {
      latestRequest.current += 1
    },
    []
  )

  async function loadDays(nextDays: GraphViewDays) {
    const request = ++latestRequest.current
    setGraphView(null)
    setLoadState("loading")

    try {
      const result = await getGraphViewForWorkspace(nextDays, {
        userId,
        workspaceId: workspace.id,
      })
      if (request !== latestRequest.current) return

      if (result.kind === "success") {
        setGraphView(result.graphView)
        if (result.graphView.nodes.length > 0) setWatchlistIsEmpty(false)
        setLoadState("ready")
        return
      }

      setLoadState(result.kind)
      if (
        result.kind === "workspace-required" ||
        result.kind === "workspace-changed"
      ) {
        router.refresh()
      }
    } catch {
      if (request === latestRequest.current) setLoadState("error")
    }
  }

  function handleDaysChange(value: string | null) {
    if (value === null) return
    const parsedDays = graphViewDaysSchema.safeParse(Number(value))
    if (!parsedDays.success || parsedDays.data === days) return

    setDays(parsedDays.data)
    void loadDays(parsedDays.data)
  }

  const timeRangeControl = (
    <SelectTimeRange
      days={days}
      busy={loadState === "loading"}
      onDaysChange={handleDaysChange}
    />
  )

  if (loadState === "permission-denied") {
    return (
      <GraphAccessDenied
        title={dictionary.graphView.title}
        description={dictionary.graphView.readDenied}
        permission="graph-view:read"
      />
    )
  }

  if (loadState === "workspace-required") {
    return canReadWorkspace ? (
      <GraphViewState
        title={copy.workspaceRequired}
        description={copy.workspaceRequiredDescription}
        action={<GraphViewStateActions canChooseWorkspace />}
      />
    ) : (
      <GraphAccessDenied
        title={dictionary.graphView.title}
        description={copy.workspaceReadDenied}
        permission="workspace:read"
      />
    )
  }

  if (loadState === "workspace-changed") {
    return (
      <GraphViewState
        title={copy.workspaceChanged}
        description=""
        role="status"
      />
    )
  }

  if (loadState === "loading") {
    return (
      <GraphViewState
        title={formatMessage(copy.loadingTimeRange, { days })}
        description=""
        header={timeRangeControl}
        role="status"
      />
    )
  }

  if (loadState === "error") {
    return (
      <GraphViewState
        title={dictionary.graphView.errorTitle}
        description={dictionary.graphView.errorDescription}
        header={timeRangeControl}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDays(days)}
          >
            {dictionary.common.retry}
          </Button>
        }
        role="alert"
      />
    )
  }

  if (!graphView) {
    return (
      <GraphViewState
        title={dictionary.graphView.errorTitle}
        description={dictionary.graphView.responseInvalid}
        header={timeRangeControl}
        role="alert"
      />
    )
  }

  if (graphView.nodes.length === 0) {
    const watchlistIsConfirmedEmpty = watchlistIsEmpty === true
    return (
      <GraphViewState
        title={
          watchlistIsConfirmedEmpty
            ? copy.emptyWatchlist
            : formatMessage(copy.noEvents, { days })
        }
        icon={<CalendarDays aria-hidden="true" className="size-6" />}
        description={
          watchlistIsConfirmedEmpty
            ? copy.emptyWatchlistDescription
            : copy.noEventsDescription
        }
        header={timeRangeControl}
        action={
          watchlistIsConfirmedEmpty && canManageWatchlist ? (
            <GraphViewStateActions workspace={workspace} />
          ) : undefined
        }
        role="status"
      />
    )
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {formatMessage(copy.loadedTimeRange, { days })}
      </p>
      <SigmaGraphViewEntry
        graphView={graphView}
        timeRangeControl={timeRangeControl}
      />
    </>
  )
}

const TIME_RANGE_ITEM_CLASS =
  "min-h-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px] md:min-h-9"

function SelectTimeRange({
  days,
  busy,
  onDaysChange,
}: {
  days: GraphViewDays
  busy: boolean
  onDaysChange: (value: string | null) => void
}) {
  const { dictionary } = useLocalization()
  const copy = dictionary.graphView.demo
  const selectedLabel =
    days === 7
      ? copy.last7Days
      : days === 14
        ? copy.last14Days
        : copy.last30Days

  return (
    <Select value={String(days)} onValueChange={onDaysChange}>
      <SelectTrigger
        aria-label={copy.timeRange}
        aria-busy={busy}
        className="h-11 min-h-11 min-w-36 md:h-9 md:min-h-9"
      >
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectItem value="7" className={TIME_RANGE_ITEM_CLASS}>
            {copy.last7Days}
          </SelectItem>
          <SelectItem value="14" className={TIME_RANGE_ITEM_CLASS}>
            {copy.last14Days}
          </SelectItem>
          <SelectItem value="30" className={TIME_RANGE_ITEM_CLASS}>
            {copy.last30Days}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function GraphViewState({
  title,
  description,
  icon,
  header,
  action,
  role,
}: {
  title: string
  description: string
  icon?: ReactNode
  header?: ReactNode
  action?: ReactNode
  role?: "status" | "alert"
}) {
  const { dictionary } = useLocalization()

  return (
    <section className="relative -mx-5 h-[calc(100svh-6.5rem)] min-h-[36rem] w-[calc(100%+2.5rem)] min-[1440px]:mx-0 min-[1440px]:w-full">
      <h1 className="sr-only">{dictionary.graphView.title}</h1>
      {header ? (
        <div className="absolute top-3 left-4 z-10">{header}</div>
      ) : null}
      <div className="flex h-full items-center justify-center px-4">
        <Empty className="min-h-[11.25rem] w-full max-w-sm flex-none gap-3 rounded-2xl border border-solid border-border/80 bg-background/85 p-6 shadow-sm backdrop-blur">
          {icon ? (
            <EmptyMedia variant="default" className="text-muted-foreground">
              {icon}
            </EmptyMedia>
          ) : null}
          <EmptyHeader
            role={role}
            aria-live={role === "status" ? "polite" : undefined}
          >
            <EmptyTitle className="text-lg font-semibold sm:text-xl">
              {title}
            </EmptyTitle>
            {description ? (
              <EmptyDescription>{description}</EmptyDescription>
            ) : null}
          </EmptyHeader>
          {action}
        </Empty>
      </div>
    </section>
  )
}

function GraphAccessDenied({
  title,
  description,
  permission,
}: {
  title: string
  description: string
  permission: string
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <div className="rounded-[28px] border border-border/80 bg-background/85 p-6 shadow-sm backdrop-blur">
        <AccessDenied description={description} permission={permission} />
      </div>
    </section>
  )
}
