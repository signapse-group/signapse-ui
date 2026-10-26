"use client"

import { Graph } from "@antv/g6"
import type {
  D3ForceLayoutOptions,
  EdgeData,
  GraphData,
  NodeData,
  ViewportAnimationEffectTiming,
} from "@antv/g6"
import {
  ArrowUpRight,
  ExternalLink,
  LocateFixed,
  Minus,
  Plus,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import {
  getGraphViewRelationLabel,
  parseGraphViewNodeId,
} from "@/app/lib/graph-view/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import type {
  GraphViewEdgeKind,
  GraphViewNode,
  GraphViewNodeKind,
} from "@/app/lib/graph-view/definitions"
import { GraphNodeInspectorMetadata } from "./graph-node-inspector-metadata"
import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TooltipContentInOverlay } from "@/components/ui/tooltip-content-in-overlay"
import { cn } from "@/lib/utils"

import {
  getGraphViewEdgeVisuals,
  getGraphViewNodeVisuals,
} from "./graph-view-visuals"
import type { GraphModel } from "./graph-view-workbench"
import {
  LocalEntityQuickDetailDrawer,
  type LocalQuickDetailEntity,
} from "../local-entity-quick-detail-drawer"

type GraphThemeMode = "light" | "dark"

type GraphCanvasPalette = {
  edgeDimStroke: string
  labelDimFill: string
  labelFill: string
  labelHoverFill: string
  nodeDimFill: string
}

const MIN_CANVAS_WIDTH = 360
const MIN_CANVAS_HEIGHT = 640
const GRAPH_RECENTER_ANIMATION = {
  duration: 520,
  easing: "ease-in-out",
} satisfies ViewportAnimationEffectTiming
const GRAPH_ZOOM_ANIMATION = {
  duration: 220,
  easing: "ease-out",
} satisfies ViewportAnimationEffectTiming
const GRAPH_ZOOM_STEP_RATIO = 1.18
const GRAPH_ZOOM_RANGE: [number, number] = [0.45, 2.2]
type LocalizationContext = ReturnType<typeof useLocalization>
type LocalizedNodeVisuals = ReturnType<typeof getGraphViewNodeVisuals>
type LocalizedEdgeVisuals = ReturnType<typeof getGraphViewEdgeVisuals>
const GRAPH_HUD_NODE_KIND_ORDER = [
  "event",
  "asset",
  "news-article",
  "narrative",
] satisfies GraphViewNodeKind[]
const GRAPH_HUD_EDGE_KIND_ORDER = [
  "event-asset",
  "news-article-event",
  "narrative-event",
  "narrative-asset",
] satisfies GraphViewEdgeKind[]
function createGraphCanvasPalette(mode: GraphThemeMode): GraphCanvasPalette {
  if (mode === "dark") {
    return {
      edgeDimStroke: "#64748b",
      labelDimFill: "#94a3b8",
      labelFill: "#f8fafc",
      labelHoverFill: "#ffffff",
      nodeDimFill: "#64748b",
    }
  }

  return {
    edgeDimStroke: "#94a3b8",
    labelDimFill: "#64748b",
    labelFill: "#172033",
    labelHoverFill: "#020617",
    nodeDimFill: "#cbd5e1",
  }
}

function GraphHudCountChip({
  className,
  count,
  label,
  priority = "normal",
}: {
  className: string
  count: string
  label: string
  priority?: "normal" | "subtle"
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border font-medium backdrop-blur",
        priority === "normal"
          ? "h-7 px-2.5 text-[11px] shadow-sm"
          : "h-6 px-2 text-[10px] opacity-75 shadow-none",
        className
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span
        className={cn(
          "rounded-full bg-background/60 font-semibold",
          priority === "normal"
            ? "px-1.5 py-0.5 text-[10px]"
            : "px-1 text-[9px]"
        )}
      >
        {count}
      </span>
    </span>
  )
}

function GraphToolButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            type="button"
            size="icon-sm"
            variant="outline"
            className="pointer-events-auto"
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContentInOverlay side="left" sideOffset={8}>
        {label}
      </TooltipContentInOverlay>
    </Tooltip>
  )
}

function getNodeQuickDetailAction(
  node: GraphViewNode,
  dictionary: LocalizationContext["dictionary"]
) {
  const entityReference = parseGraphViewNodeId(node.id)

  if (!entityReference) {
    return null
  }

  if (entityReference.kind === "event") {
    return {
      entity: {
        id: entityReference.entityId,
        kind: "event" as const,
      },
      label: dictionary.graphView.inspector.openEvent,
    }
  }

  if (entityReference.kind === "news-article") {
    return {
      entity: {
        id: entityReference.entityId,
        kind: "news-article" as const,
      },
      label: dictionary.graphView.inspector.openArticle,
    }
  }

  return null
}

function GraphNodeDetailInspector({
  node,
  onClose,
  onOpenQuickDetail,
  relatedEdgeCount,
  relatedNodeCount,
}: {
  node: GraphViewNode
  onClose: () => void
  onOpenQuickDetail: (
    entity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) => void
  relatedEdgeCount: number
  relatedNodeCount: number
}) {
  const localization = useLocalization()
  const { dictionary, formatMessage, formatNumber } = localization
  const nodeVisuals = getGraphViewNodeVisuals(dictionary)
  const visual = nodeVisuals[node.kind]
  const metadata = node.metadata ?? {}
  const quickDetailAction = getNodeQuickDetailAction(node, dictionary)
  const detailActionLabel =
    node.kind === "event"
      ? dictionary.graphView.inspector.readEvent
      : node.kind === "news-article"
        ? dictionary.graphView.inspector.readArticle
        : quickDetailAction?.label
  const sourceUrl =
    node.kind === "news-article" && metadata.url?.trim()
      ? metadata.url.trim()
      : null
  const relationSummary = formatMessage(
    dictionary.graphView.inspector.relationSummary,
    {
      edges: formatNumber(relatedEdgeCount),
      nodes: formatNumber(Math.max(relatedNodeCount - 1, 0)),
    }
  )

  return (
    <aside className="pointer-events-auto absolute inset-x-3 bottom-14 z-20 max-h-[26rem] overflow-hidden rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md md:inset-x-auto md:top-16 md:right-4 md:bottom-auto md:max-h-[calc(100%-5rem)] md:w-[22rem]">
      <div className="flex items-start gap-3 border-b border-border/70 px-3.5 py-3">
        <span
          aria-hidden="true"
          className="mt-1 size-3.5 shrink-0 rounded-full shadow-sm"
          style={{ backgroundColor: visual.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {visual.label}
          </p>
          <h2 className="mt-1 line-clamp-3 text-sm leading-snug font-semibold">
            {node.label}
          </h2>
          {node.secondaryLabel ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {node.secondaryLabel}
            </p>
          ) : null}
        </div>
        <Button
          aria-label={dictionary.graphView.inspector.closeNodeDetails}
          title={dictionary.graphView.inspector.closeNodeDetails}
          type="button"
          size="icon-xs"
          variant="ghost"
          className="rounded-full"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-3.5" data-icon="inline-start" />
        </Button>
      </div>

      <div className="max-h-[20rem] overflow-y-auto p-3.5 md:max-h-[calc(100vh-11rem)]">
        <GraphNodeInspectorMetadata node={node} />

        <p className="mt-3 rounded-full border border-border/60 bg-background/45 px-2.5 py-1 text-[11px] text-muted-foreground">
          {relationSummary}
        </p>

        {quickDetailAction || sourceUrl ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickDetailAction ? (
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={(event) =>
                  onOpenQuickDetail(
                    quickDetailAction.entity,
                    event.currentTarget
                  )
                }
              >
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4"
                  data-icon="inline-start"
                />
                <span>{detailActionLabel}</span>
              </Button>
            ) : null}
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <ExternalLink
                  aria-hidden="true"
                  className="size-4"
                  data-icon="inline-start"
                />
                <span>{dictionary.graphView.inspector.openOriginalSource}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function createG6GraphData(
  graphModel: GraphModel,
  graphPalette: GraphCanvasPalette,
  nodeVisuals: LocalizedNodeVisuals,
  edgeVisuals: LocalizedEdgeVisuals,
  dictionary: LocalizationContext["dictionary"]
): GraphData {
  const nodes: NodeData[] = graphModel.nodes.map((node) => {
    const visual = nodeVisuals[node.kind]
    const size = visual.size
    return {
      id: node.id,
      kind: node.kind,
      label: node.label,
      type: "circle",
      data: {
        kind: node.kind,
        label: node.label,
        metadata: node.metadata ?? null,
        secondaryLabel: node.secondaryLabel ?? null,
      },
      style: {
        fill: visual.color,
        label: node.kind !== "news-article",
        labelBackground: false,
        labelFill: graphPalette.labelFill,
        labelFontSize: 11,
        labelFontWeight: 600,
        labelMaxWidth: 220,
        labelMaxLines: 1,
        labelOffsetX: 9,
        labelPlacement: "right",
        labelPointerEvents: "none",
        labelText: node.label.trim(),
        labelTextOverflow: "ellipsis",
        labelWordWrap: true,
        lineWidth: 0,
        opacity: 0.96,
        size,
      },
    }
  })

  const edges: EdgeData[] = graphModel.edges.map((edge) => {
    const visual = edgeVisuals[edge.kind]
    return {
      id: edge.id,
      confidence: edge.confidence ?? null,
      kind: edge.kind,
      relationType: edge.relationType,
      source: edge.sourceNodeId,
      sourceNodeId: edge.sourceNodeId,
      target: edge.targetNodeId,
      targetNodeId: edge.targetNodeId,
      weight: edge.weight ?? null,
      data: {
        confidence: edge.confidence ?? null,
        kind: edge.kind,
        note: edge.note ?? null,
        relationLabel: getGraphViewRelationLabel(edge.relationType, dictionary),
        relationType: edge.relationType,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        weight: edge.weight ?? null,
      },
      style: {
        lineWidth: visual.size,
        opacity: 0.46,
        stroke: visual.color,
      },
      type: "line",
    }
  })

  return {
    edges,
    nodes,
  }
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function createForceLayout() {
  return {
    collide: {
      radius: 36,
    },
    link: {
      distance: 120,
    },
    manyBody: { strength: -120 },
    type: "d3-force",
  } satisfies D3ForceLayoutOptions & { type: "d3-force" }
}

function getContainerSize(container: HTMLDivElement) {
  const rect = container.getBoundingClientRect()

  return {
    height: Math.max(rect.height, MIN_CANVAS_HEIGHT),
    width: Math.max(rect.width, MIN_CANVAS_WIDTH),
  }
}

function createNodeStateStyles(graphPalette: GraphCanvasPalette) {
  return {
    dim: {
      fill: graphPalette.nodeDimFill,
      labelFill: graphPalette.labelDimFill,
    },
    highlight: {
      halo: false,
      label: true,
      labelFill: graphPalette.labelHoverFill,
      lineWidth: 0,
    },
    selected: {
      halo: true,
      label: true,
      labelFill: graphPalette.labelHoverFill,
      lineWidth: 0,
    },
  }
}

function createEdgeStateStyles(graphPalette: GraphCanvasPalette) {
  return {
    dim: {
      stroke: graphPalette.edgeDimStroke,
    },
    highlight: {
      opacity: 1,
    },
    selected: {
      opacity: 1,
    },
  }
}

function clearGraphActiveStates(graph: Graph | null) {
  if (!graph || graph.destroyed) {
    return
  }

  const stateUpdates: Record<string, string[]> = {}
  const { edges, nodes } = graph.getData()

  for (const element of [...nodes, ...edges]) {
    if (!element.id) {
      continue
    }

    stateUpdates[element.id] = graph
      .getElementState(element.id)
      .filter(
        (state) =>
          state !== "highlight" && state !== "selected" && state !== "dim"
      )
  }

  void graph.setElementState(stateUpdates, false)
}

export function GraphViewCanvas({ graphModel }: { graphModel: GraphModel }) {
  const localization = useLocalization()
  const { dictionary, formatMessage, formatNumber } = localization
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  const [quickDetailEntity, setQuickDetailEntity] =
    useState<LocalQuickDetailEntity | null>(null)
  const quickDetailReturnFocusRef = useRef<HTMLElement | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const graphThemeMode: GraphThemeMode =
    resolvedTheme === "dark" ? "dark" : "light"
  const graphPalette = useMemo(
    () => createGraphCanvasPalette(graphThemeMode),
    [graphThemeMode]
  )
  const nodeVisuals = useMemo(
    () => getGraphViewNodeVisuals(dictionary),
    [dictionary]
  )
  const edgeVisuals = useMemo(
    () => getGraphViewEdgeVisuals(dictionary),
    [dictionary]
  )
  const graphData = useMemo(
    () =>
      createG6GraphData(
        graphModel,
        graphPalette,
        nodeVisuals,
        edgeVisuals,
        dictionary
      ),
    [dictionary, edgeVisuals, graphModel, graphPalette, nodeVisuals]
  )
  const selectedNode = selectedNodeId
    ? (graphModel.nodeMap.get(selectedNodeId) ?? null)
    : null
  const selectedGraphNodeId = selectedNode ? selectedNode.id : null
  const selectedRelatedNodeCount = selectedGraphNodeId
    ? (graphModel.relatedNodesByNodeId.get(selectedGraphNodeId)?.size ?? 1)
    : 0
  const selectedRelatedEdgeCount = selectedGraphNodeId
    ? (graphModel.relatedEdgesByNodeId.get(selectedGraphNodeId)?.size ?? 0)
    : 0

  function handleOpenQuickDetail(
    entity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) {
    quickDetailReturnFocusRef.current = trigger
    setQuickDetailEntity(entity)
  }

  const clearSelectedNode = () => {
    selectedNodeIdRef.current = null
    clearGraphActiveStates(graphRef.current)
    setSelectedNodeId(null)
  }

  const handleRecenter = () => {
    const graph = graphRef.current

    if (!graph || graph.destroyed) {
      return
    }

    void graph
      .fitView(
        {
          direction: "both",
          when: "always",
        },
        GRAPH_RECENTER_ANIMATION
      )
      .catch((error) => {
        if (!graph.destroyed) {
          console.error(error)
        }
      })
  }

  const handleZoom = (direction: "in" | "out") => {
    const graph = graphRef.current

    if (!graph || graph.destroyed) {
      return
    }

    const currentZoom = graph.getZoom()
    const nextRawZoom =
      direction === "in"
        ? currentZoom * GRAPH_ZOOM_STEP_RATIO
        : currentZoom / GRAPH_ZOOM_STEP_RATIO
    const nextZoom = clampValue(
      nextRawZoom,
      GRAPH_ZOOM_RANGE[0],
      GRAPH_ZOOM_RANGE[1]
    )

    void graph.zoomTo(nextZoom, GRAPH_ZOOM_ANIMATION).catch((error) => {
      if (!graph.destroyed) {
        console.error(error)
      }
    })
  }

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId
  }, [selectedNodeId])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const { height, width } = getContainerSize(container)
    let isDisposed = false
    let renderFrameId: number | null = null
    let renderPromise: Promise<void> | null = null
    const graph = new Graph({
      autoFit: {
        type: "center",
        animation: {
          duration: 1000,
          easing: "ease-in-out",
        },
      },
      animation: true,
      behaviors: [
        {
          type: "drag-canvas",
        },
        {
          type: "zoom-canvas",
        },
        {
          animation: false,
          degree: 1,
          direction: "both",
          enable: (event: { targetType?: string }) =>
            !selectedNodeIdRef.current && event.targetType === "node",
          inactiveState: "dim",
          state: "highlight",
          type: "hover-activate",
        },
        {
          animation: false,
          degree: 1,
          enable: (event: { targetType?: string }) =>
            event.targetType === "node" || event.targetType === "canvas",
          neighborState: "highlight",
          onClick: (event: {
            target?: { id?: string }
            targetType?: string
          }) => {
            if (event.targetType === "canvas") {
              selectedNodeIdRef.current = null
              clearGraphActiveStates(graph)
              setSelectedNodeId(null)
              return
            }

            const nodeId = event.target?.id

            if (!nodeId) {
              return
            }

            if (selectedNodeIdRef.current === nodeId) {
              selectedNodeIdRef.current = null
              clearGraphActiveStates(graph)
              setSelectedNodeId(null)
              return
            }

            selectedNodeIdRef.current = nodeId
            setSelectedNodeId(nodeId)
          },
          state: "selected",
          type: "click-select",
          unselectedState: "dim",
        },
        {
          state: "drag-selected",
          type: "drag-element-force",
        },
      ],
      container,
      data: graphData,
      edge: {
        state: createEdgeStateStyles(graphPalette),
        style: (edge) => edge.style ?? {},
        type: "line",
      },
      height,
      layout: createForceLayout(),
      node: {
        state: createNodeStateStyles(graphPalette),
        style: (node) => node.style ?? {},
        type: "circle",
      },
      padding: 48,
      width,
      zoomRange: GRAPH_ZOOM_RANGE,
    })

    graphRef.current = graph

    const renderGraph = async () => {
      try {
        await graph.render()

        const anchorNodeId = graphModel.nodes[0]?.id

        if (anchorNodeId && !graph.destroyed) {
          const [x, y] = graph.getElementPosition(anchorNodeId)
          const [viewportX, viewportY] = graph.getViewportByCanvas([x, y])
          container.dataset.benchmarkAnchorId = anchorNodeId
          container.dataset.benchmarkAnchorX = String(viewportX)
          container.dataset.benchmarkAnchorY = String(viewportY)
        }
      } catch (error) {
        if (isDisposed || graph.destroyed) {
          return
        }

        console.error(error)
      }
    }

    const destroyGraph = () => {
      if (!graph.destroyed) {
        graph.destroy()
      }

      if (graphRef.current === graph) {
        graphRef.current = null
      }
    }

    renderFrameId = window.requestAnimationFrame(() => {
      renderFrameId = null
      renderPromise = renderGraph()
    })

    const resizeObserver = new ResizeObserver(() => {
      if (isDisposed || graph.destroyed) {
        return
      }

      const nextSize = getContainerSize(container)
      graph.setSize(nextSize.width, nextSize.height)
    })

    resizeObserver.observe(container)

    return () => {
      isDisposed = true
      resizeObserver.disconnect()

      if (renderFrameId !== null) {
        window.cancelAnimationFrame(renderFrameId)
        renderFrameId = null
      }

      if (renderPromise) {
        void renderPromise.finally(destroyGraph)
        return
      }

      destroyGraph()
    }
  }, [graphData, graphModel.nodes, graphPalette])

  return (
    <div className="relative size-full min-h-[36rem] max-w-full animate-in overflow-hidden duration-500 fade-in">
      <div
        ref={containerRef}
        className="size-full min-h-[36rem] max-w-full cursor-grab active:cursor-grabbing"
        data-engine-canvas="g6"
        data-testid="graph-view-engine-canvas"
      />

      {selectedNode ? (
        <GraphNodeDetailInspector
          node={selectedNode}
          onClose={clearSelectedNode}
          onOpenQuickDetail={handleOpenQuickDetail}
          relatedEdgeCount={selectedRelatedEdgeCount}
          relatedNodeCount={selectedRelatedNodeCount}
        />
      ) : null}

      <LocalEntityQuickDetailDrawer
        entity={quickDetailEntity}
        onClose={() => setQuickDetailEntity(null)}
        owner="graph-view"
        returnFocusRef={quickDetailReturnFocusRef}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
        <h1 className="max-w-[min(70%,24rem)] truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {dictionary.graphView.title}
        </h1>

        <div className="flex max-w-[min(100%,32rem)] flex-wrap items-center justify-end gap-1.5 opacity-90">
          {GRAPH_HUD_NODE_KIND_ORDER.filter(
            (kind) => graphModel.nodeCounts[kind] > 0
          ).map((kind) => (
            <GraphHudCountChip
              className={nodeVisuals[kind].chipClassName}
              count={formatNumber(graphModel.nodeCounts[kind])}
              key={kind}
              label={nodeVisuals[kind].label}
            />
          ))}
        </div>
      </div>

      <TooltipProvider>
        <ButtonGroup
          orientation="vertical"
          className="pointer-events-auto absolute top-14 right-3 z-10 sm:top-16 sm:right-4"
        >
          <GraphToolButton
            label={dictionary.graphView.controls.zoomOut}
            onClick={() => handleZoom("out")}
          >
            <Minus aria-hidden="true" data-icon="inline-start" />
          </GraphToolButton>
          <GraphToolButton
            label={dictionary.graphView.controls.recenter}
            onClick={handleRecenter}
          >
            <LocateFixed aria-hidden="true" data-icon="inline-start" />
          </GraphToolButton>
          <GraphToolButton
            label={dictionary.graphView.controls.zoomIn}
            onClick={() => handleZoom("in")}
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
          </GraphToolButton>
        </ButtonGroup>
      </TooltipProvider>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-end justify-between gap-2 sm:inset-x-4 sm:bottom-4">
        <div className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
          {formatMessage(dictionary.graphView.controls.summary, {
            nodes: formatNumber(graphModel.nodes.length),
            edges: formatNumber(graphModel.edges.length),
          })}
        </div>

        <div className="flex max-w-[min(100%,32rem)] min-w-0 flex-nowrap justify-end gap-1.5 overflow-hidden">
          {GRAPH_HUD_EDGE_KIND_ORDER.filter(
            (kind) => graphModel.edgeCounts[kind] > 0
          ).map((kind) => (
            <GraphHudCountChip
              className={edgeVisuals[kind].chipClassName}
              count={formatNumber(graphModel.edgeCounts[kind])}
              key={kind}
              label={edgeVisuals[kind].label}
              priority="subtle"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
