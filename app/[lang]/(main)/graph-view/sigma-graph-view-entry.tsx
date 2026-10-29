"use client"

import dynamic from "next/dynamic"

import type { GraphViewDemoEdgeCount } from "@/app/lib/graph-view/demo-fixture"
import type { GraphViewResponse } from "@/app/lib/graph-view/definitions"

const SigmaGraphView = dynamic(
  () => import("./sigma-graph-view").then((module) => module.SigmaGraphView),
  {
    loading: () => (
      <div className="relative -m-5 h-[calc(100svh-5.5rem)] min-h-[24rem] w-[calc(100%+2.5rem)] overflow-hidden bg-card min-[1440px]:m-0 min-[1440px]:h-[calc(100svh-6.5rem)] min-[1440px]:min-h-[36rem] min-[1440px]:w-full min-[1440px]:rounded-xl min-[1440px]:border min-[1440px]:shadow-sm md:max-[1440px]:h-[calc(100svh-3rem)]" />
    ),
    ssr: false,
  }
)

export function SigmaGraphViewEntry({
  initialEdgeCount,
  graphView,
}: {
  initialEdgeCount?: GraphViewDemoEdgeCount
  graphView?: GraphViewResponse
}) {
  return (
    <SigmaGraphView initialEdgeCount={initialEdgeCount} graphView={graphView} />
  )
}
