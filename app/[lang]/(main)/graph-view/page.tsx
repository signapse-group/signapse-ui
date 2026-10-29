import { isP0FixtureModeEnabled } from "@/app/lib/dev-auth-mode"
import { Suspense } from "react"
import { getGraphView } from "@/app/api/graph-view/action"
import { getMe } from "@/app/api/user/action"
import { getWorkspaceWatchlistAssets } from "@/app/api/watchlists/action"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

import { getServerDictionary } from "@/app/lib/i18n/server"
import { getGraphViewDemoEdgeCount } from "@/app/lib/graph-view/demo-fixture"
import { GRAPH_VIEW_READ_PERMISSIONS } from "@/app/lib/graph-view/permissions"
import { hasAnyPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { Skeleton } from "@/components/ui/skeleton"

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
        />
      )}
    </Suspense>
  )
}

async function WorkspaceGraph({
  canReadWatchlist,
}: {
  canReadWatchlist: boolean
}) {
  const [me, dictionary] = await Promise.all([getMe(), getServerDictionary()])
  const copy = dictionary.graphView.demo
  if (!me.currentWorkspace) {
    return (
      <GraphState
        title={copy.workspaceRequired}
        description={copy.workspaceRequiredDescription}
      />
    )
  }

  const graphView = await getGraphView()
  const watchlist =
    graphView.nodes.length === 0 && canReadWatchlist
      ? await getWorkspaceWatchlistAssets({
          filter: "",
          page: 0,
          size: 1,
          sort: [],
        })
      : null
  const latest = await getMe()
  if (latest.currentWorkspace?.id !== me.currentWorkspace.id) {
    throw new Error(copy.workspaceChanged)
  }
  if (graphView.nodes.length === 0) {
    return (
      <GraphState
        title={
          watchlist?.totalElements === 0 ? copy.emptyWatchlist : copy.noGraph
        }
        description={
          watchlist?.totalElements === 0
            ? copy.emptyWatchlistDescription
            : copy.noGraphDescription
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

function GraphState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="h-[calc(100svh-6.5rem)] min-h-[36rem]">
      <h1 className="sr-only">{title}</h1>
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
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
