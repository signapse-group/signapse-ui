import { isP0FixtureModeEnabled } from "@/app/lib/dev-auth-mode"
import { Suspense } from "react"
import type { ReactNode } from "react"

import { getGraphView } from "@/app/api/graph-view/action"
import type { GraphViewResponse } from "@/app/lib/graph-view/definitions"
import { getMe } from "@/app/api/user/action"
import { getWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import type { BackendMeResponse } from "@/app/lib/users/definitions"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

import { getServerDictionary } from "@/app/lib/i18n/server"
import { getGraphViewDemoEdgeCount } from "@/app/lib/graph-view/demo-fixture"
import { GRAPH_VIEW_READ_PERMISSIONS } from "@/app/lib/graph-view/permissions"
import { hasAnyPermission, hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { Skeleton } from "@/components/ui/skeleton"

import { GraphViewStateActions } from "./graph-view-state-actions"
import { SigmaGraphViewEntry } from "./sigma-graph-view-entry"

type DemoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SigmaGraphViewPage({
  searchParams,
}: DemoPageProps) {
  const [permissions, dictionary, params] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
    searchParams,
  ])

  if (!hasAnyPermission(permissions, GRAPH_VIEW_READ_PERMISSIONS)) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {dictionary.graphView.title}
          </h1>
        </div>
        <div className="rounded-[28px] border border-border/80 bg-background/85 p-6 shadow-sm backdrop-blur">
          <AccessDenied
            description={dictionary.graphView.readDenied}
            permission={GRAPH_VIEW_READ_PERMISSIONS[0]}
          />
        </div>
      </section>
    )
  }

  const rawEdgeCount = Array.isArray(params.edges)
    ? params.edges[0]
    : params.edges

  return (
    <Suspense fallback={<SigmaGraphViewSkeleton />}>
      {isP0FixtureModeEnabled() && rawEdgeCount !== undefined ? (
        <SigmaGraphViewEntry
          initialEdgeCount={getGraphViewDemoEdgeCount(rawEdgeCount)}
        />
      ) : (
        <WorkspaceGraph
          canReadWatchlist={hasAnyPermission(permissions, ["watchlist:read"])}
          canReadWorkspace={hasAnyPermission(permissions, ["workspace:read"])}
          canManageWatchlist={[
            "asset:read",
            "watchlist:read",
            "watchlist:create",
            "watchlist:delete",
          ].every((permission) => hasPermission(permissions, permission))}
        />
      )}
    </Suspense>
  )
}

async function WorkspaceGraph({
  canReadWatchlist,
  canReadWorkspace,
  canManageWatchlist,
}: {
  canReadWatchlist: boolean
  canReadWorkspace: boolean
  canManageWatchlist: boolean
}) {
  const [me, dictionary] = await Promise.all([getMe(), getServerDictionary()])
  const copy = dictionary.graphView.demo
  if (!me.currentWorkspace) {
    return (
      <WorkspaceSelectionRequired
        canReadWorkspace={canReadWorkspace}
        title={dictionary.graphView.title}
        copy={copy}
      />
    )
  }

  let graphView: GraphViewResponse | null = null
  let watchlist: Awaited<
    ReturnType<typeof getWorkspaceWatchlistAssets>
  > | null = null
  let failedOperation: "graph" | "watchlist" = "graph"
  let loadFailed = false
  let loadError: unknown
  try {
    graphView = await getGraphView()
    if (graphView.nodes.length === 0 && canReadWatchlist) {
      failedOperation = "watchlist"
      watchlist = await getWorkspaceWatchlistAssets({
        filter: "",
        page: 0,
        size: 1,
        sort: [],
      })
      if (
        !Number.isInteger(watchlist.totalElements) ||
        watchlist.totalElements < 0
      ) {
        throw new Error(copy.watchlistResponseInvalid)
      }
    }
  } catch (error) {
    loadFailed = true
    loadError = error
  }

  const latest = await getMe()
  if (!latest.currentWorkspace) {
    return (
      <WorkspaceSelectionRequired
        canReadWorkspace={canReadWorkspace}
        title={dictionary.graphView.title}
        copy={copy}
      />
    )
  }
  ensureWorkspaceUnchanged(me, latest, copy.workspaceChanged)
  if (loadFailed) {
    if (getErrorStatus(loadError) === 403) {
      return failedOperation === "graph" ? (
        <GraphAccessDenied
          title={dictionary.graphView.title}
          description={dictionary.graphView.readDenied}
          permission="graph-view:read"
        />
      ) : (
        <GraphAccessDenied
          title={dictionary.graphView.title}
          description={copy.watchlistReadDenied}
          permission="watchlist:read"
        />
      )
    }
    throw loadError
  }

  if (!graphView) {
    throw new Error(dictionary.graphView.responseInvalid)
  }
  if (graphView.nodes.length === 0) {
    if (!canReadWatchlist) {
      return (
        <GraphAccessDenied
          title={dictionary.graphView.title}
          description={copy.watchlistReadDenied}
          permission="watchlist:read"
        />
      )
    }
    const watchlistIsEmpty = watchlist?.totalElements === 0
    return (
      <GraphState
        title={watchlistIsEmpty ? copy.emptyWatchlist : copy.noGraph}
        description={
          watchlistIsEmpty
            ? copy.emptyWatchlistDescription
            : copy.noGraphDescription
        }
        action={
          canManageWatchlist && latest.currentWorkspace ? (
            <GraphViewStateActions workspace={latest.currentWorkspace} />
          ) : undefined
        }
      />
    )
  }
  return (
    <SigmaGraphViewEntry
      key={`${me.id}:${me.currentWorkspace.id}`}
      graphView={graphView}
    />
  )
}

function WorkspaceSelectionRequired({
  canReadWorkspace,
  title,
  copy,
}: {
  canReadWorkspace: boolean
  title: string
  copy: Awaited<ReturnType<typeof getServerDictionary>>["graphView"]["demo"]
}) {
  if (!canReadWorkspace) {
    return (
      <GraphAccessDenied
        title={title}
        description={copy.workspaceReadDenied}
        permission="workspace:read"
      />
    )
  }

  return (
    <GraphState
      title={copy.workspaceRequired}
      description={copy.workspaceRequiredDescription}
      action={<GraphViewStateActions canChooseWorkspace />}
    />
  )
}

function ensureWorkspaceUnchanged(
  initial: BackendMeResponse,
  latest: BackendMeResponse,
  message: string
) {
  if (latest.currentWorkspace?.id !== initial.currentWorkspace?.id) {
    throw new Error(message)
  }
}

function getErrorStatus(error: unknown) {
  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status
  }
  return undefined
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

function GraphState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="h-[calc(100svh-6.5rem)] min-h-[36rem]">
      <h1 className="sr-only">{title}</h1>
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {action}
      </Empty>
    </section>
  )
}

function SigmaGraphViewSkeleton() {
  return (
    <div className="relative -m-5 h-[calc(100svh-5.5rem)] min-h-[24rem] w-[calc(100%+2.5rem)] overflow-hidden bg-card min-[1440px]:m-0 min-[1440px]:h-[calc(100svh-6.5rem)] min-[1440px]:min-h-[36rem] min-[1440px]:w-full min-[1440px]:rounded-xl min-[1440px]:border min-[1440px]:shadow-sm md:max-[1440px]:h-[calc(100svh-3rem)]">
      <Skeleton className="absolute inset-6 rounded-xl" />
    </div>
  )
}
