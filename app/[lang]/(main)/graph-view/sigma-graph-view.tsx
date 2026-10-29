"use client"

import { createD3Layout } from "./d3-layout"
import { pickGraphEdges, type PickNode } from "./edge-picking"
import {
  getNodeLabelPriority,
  measureNodeLabel,
  placeNodeLabels,
  type PlacedNodeLabel,
} from "./node-labels"
import { GraphNodeInspectorMetadata } from "./graph-node-inspector-metadata"
import {
  ArrowDown,
  ExternalLink,
  LocateFixed,
  Minus,
  Plus,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Sigma from "sigma"
import type { SigmaEventPayload } from "sigma/types"
import { drawStraightEdgeLabel } from "sigma/rendering"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  createGraphViewDemoFixture,
  createGraphViewDemoGraph,
  createGraphViewDemoSeedPositions,
  GRAPH_VIEW_DEMO_FIXTURE_VERSION,
  GRAPH_VIEW_DEMO_LAYOUT_VERSION,
  type GraphViewDemoEdgeAttributes,
  type GraphViewDemoEdgeCount,
  type GraphViewDemoGraph,
  type GraphViewDemoNodeAttributes,
  type GraphViewDemoPosition,
} from "@/app/lib/graph-view/demo-fixture"
import {
  readGraphViewDemoLayoutCache,
  writeGraphViewDemoLayoutCache,
} from "@/app/lib/graph-view/demo-layout-cache"
import {
  getGraphViewNodeEntityId,
  getGraphViewRelationLabel,
  type GraphViewEdge,
  type GraphViewNode,
  type GraphViewNodeKind,
  type GraphViewResponse,
} from "@/app/lib/graph-view/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import type { EventResponse } from "@/app/lib/events/definitions"
import type { NewsArticleResponse } from "@/app/lib/news-articles/definitions"
import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import {
  LocalEntityQuickDetailDrawer,
  type LocalQuickDetailEntity,
  type LocalQuickDetailFixture,
} from "../local-entity-quick-detail-drawer"
import {
  getGraphViewEdgeVisuals,
  getGraphViewNodeVisuals,
} from "./graph-view-visuals"

type GraphDemoThemeMode = "light" | "dark"
type GraphDemoLayoutStatus =
  "seed" | "cached" | "refining" | "ready" | "unsupported" | "error"

type GraphDemoPalette = {
  edgeDimStroke: string
  labelDimFill: string
  labelFill: string
  labelFocusFill: string
  nodeDimFill: string
}

type GraphDemoNodeVisual = {
  chipClassName: string
  color: string
  label: string
  size: number
}

type GraphDemoEdgeVisual = {
  chipClassName: string
  color: string
  label: string
  size: number
}

const GRAPH_DEMO_ZOOM_RANGE = [1 / 2.2, 1 / 0.45] as const
const GRAPH_DEMO_ZOOM_FACTOR = 1.18
const GRAPH_DEMO_NODE_KIND_ORDER = [
  "event",
  "asset",
  "news-article",
  "narrative",
] as const satisfies readonly GraphViewNodeKind[]
const GRAPH_DEMO_EDGE_KIND_ORDER = [
  "event-asset",
  "news-article-event",
  "narrative-event",
  "narrative-asset",
] as const
const GRAPH_DEMO_INSPECTOR_CLASS_NAME =
  "pointer-events-auto absolute inset-x-4 bottom-4 z-20 flex max-h-[min(60%,calc(100%_-_16rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md min-[1440px]:inset-x-auto min-[1440px]:top-16 min-[1440px]:right-4 min-[1440px]:bottom-auto min-[1440px]:max-h-[calc(100%-5rem)] min-[1440px]:w-[22rem]"

function createGraphDemoPalette(mode: GraphDemoThemeMode): GraphDemoPalette {
  if (mode === "dark") {
    return {
      edgeDimStroke: "#64748b",
      labelDimFill: "#94a3b8",
      labelFill: "#f8fafc",
      labelFocusFill: "#ffffff",
      nodeDimFill: "#30343b",
    }
  }

  return {
    edgeDimStroke: "#94a3b8",
    labelDimFill: "#64748b",
    labelFill: "#172033",
    labelFocusFill: "#020617",
    nodeDimFill: "#e4e7eb",
  }
}

function canUseWebGL() {
  const canvas = document.createElement("canvas")

  return Boolean(
    canvas.getContext("webgl2") ??
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl")
  )
}

// Sigma blends with ONE: translucent colors must carry premultiplied RGB.
function edgeOpacity(color: string, opacity: number) {
  return (
    "#" +
    [1, 3, 5]
      .map((offset) =>
        Math.round(parseInt(color.slice(offset, offset + 2), 16) * opacity)
          .toString(16)
          .padStart(2, "0")
      )
      .join("") +
    Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")
  )
}

function fitSigmaGraph(
  sigma: Sigma<GraphViewDemoNodeAttributes, GraphViewDemoEdgeAttributes>,
  hasInspector: boolean
) {
  sigma.refresh()
  const { width, height } = sigma.getDimensions()
  const covered =
    hasInspector && window.matchMedia("(min-width: 1440px)").matches
      ? Math.min(400, width * 0.4)
      : 0
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }
  sigma.getGraph().forEachNode((_node, { x, y, size }) => {
    bounds.minX = Math.min(bounds.minX, x - size)
    bounds.minY = Math.min(bounds.minY, y - size)
    bounds.maxX = Math.max(bounds.maxX, x + size)
    bounds.maxY = Math.max(bounds.maxY, y + size)
  })
  if (!Number.isFinite(bounds.minX)) return
  const first = sigma.graphToViewport({ x: bounds.minX, y: bounds.minY })
  const last = sigma.graphToViewport({ x: bounds.maxX, y: bounds.maxY })
  const center = sigma.viewportToFramedGraph(
    sigma.graphToViewport({
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    })
  )
  const camera = sigma.getCamera()
  const ratio =
    camera.getState().ratio *
    Math.max(
      Math.abs(last.x - first.x) / Math.max(width - covered - 96, 100),
      Math.abs(last.y - first.y) / Math.max(height - 96, 100)
    )
  // Keep the calibrated graph units; fitting must obey the same zoom limits.
  camera.setState({
    ...center,
    ratio: Math.min(
      Math.max(ratio, GRAPH_DEMO_ZOOM_RANGE[0]),
      GRAPH_DEMO_ZOOM_RANGE[1]
    ),
    angle: 0,
  })
  if (covered) {
    const center = sigma.viewportToFramedGraph({
      x: width / 2 + covered / 2,
      y: height / 2,
    })
    sigma.getCamera().setState({ x: center.x, y: center.y })
  }
}

function getMotionDuration(duration: number) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : duration
}

function getNodeIds(graphView: { nodes: readonly GraphViewNode[] }) {
  return graphView.nodes.map((node) => node.id)
}

function getGraphPositions(graph: GraphViewDemoGraph) {
  const positions: Record<string, GraphViewDemoPosition> = {}

  graph.forEachNode((node, attributes) => {
    positions[node] = { x: attributes.x, y: attributes.y }
  })

  return positions
}

function getFocusedGraphParts(
  graph: GraphViewDemoGraph,
  nodeId: string | null,
  edgeId: string | null
) {
  if (nodeId) {
    return {
      edges: new Set(graph.edges(nodeId)),
      nodes: new Set([nodeId, ...graph.neighbors(nodeId)]),
    }
  }

  if (edgeId) {
    const [source, target] = graph.extremities(edgeId)

    return {
      edges: new Set([edgeId]),
      nodes: new Set([source, target]),
    }
  }

  return { edges: new Set<string>(), nodes: new Set<string>() }
}

function getDemoStatusLabel(
  status: GraphDemoLayoutStatus,
  dictionary: Dictionary
) {
  if (status === "cached") return dictionary.graphView.demo.layoutCached
  if (status === "refining") return dictionary.graphView.demo.layoutRefining
  if (status === "ready") return dictionary.graphView.demo.layoutReady
  if (status === "unsupported")
    return dictionary.graphView.demo.layoutUnsupported
  if (status === "error") return dictionary.graphView.demo.layoutError
  return dictionary.graphView.demo.layoutSeed
}

function getDemoQuickDetailFixture(
  node: GraphViewNode,
  locale: AppLocale
): LocalQuickDetailFixture | null {
  const entityId = getGraphViewNodeEntityId(node.id, node.kind)

  if (entityId === null) {
    return null
  }

  const now = "2026-01-15T12:00:00.000Z"
  const isVietnamese = locale === "vi"

  if (node.kind === "event") {
    const event: EventResponse = {
      assets: [],
      canonicalKey: node.metadata?.canonicalKey ?? `DEMO-EVENT-${entityId}`,
      confidence: node.metadata?.confidence ?? 0.8,
      createdDate: now,
      description: isVietnamese
        ? "Sự kiện fixture dùng để kiểm tra luồng quick detail cục bộ."
        : "A fixture event used to test the local quick-detail flow.",
      evidence: [],
      id: entityId,
      lastModifiedDate: now,
      status: "ENRICHED",
      themes: [],
      title: node.label,
      occurredAt: node.metadata?.occurredAt ?? now,
    }

    return {
      entity: { id: entityId, kind: "event" },
      event,
    }
  }

  if (node.kind !== "news-article") {
    return null
  }

  const article: NewsArticleResponse = {
    createdDate: now,
    description: isVietnamese
      ? "Bài viết fixture dùng để kiểm tra reader cục bộ."
      : "A fixture article used to test the local reader.",
    id: entityId,
    lastModifiedDate: now,
    publishedAt: node.metadata?.publishedAt ?? now,
    sourceName: "Signapse Fixture",
    status: "EVENT_RESOLVED",
    title: node.label,
    url: "",
    content: isVietnamese
      ? "Nội dung bài viết fixture được hiển thị hoàn toàn phía client."
      : "Fixture article content rendered entirely on the client.",
  }

  return {
    article,
    entity: { id: entityId, kind: "news-article" },
  }
}

function DemoControlButton({
  "aria-label": ariaLabel,
  children,
  onClick,
  testId,
}: {
  "aria-label": string
  children: ReactNode
  onClick: () => void
  testId: string
}) {
  return (
    <Button
      aria-label={ariaLabel}
      data-testid={testId}
      size="icon-sm"
      type="button"
      variant="outline"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function DemoNodeInspector({
  node,
  nodeVisuals,
  onClose,
  onOpenQuickDetail,
}: {
  node: GraphViewNode
  nodeVisuals: Record<GraphViewNodeKind, GraphDemoNodeVisual>
  onClose: () => void
  onOpenQuickDetail: (
    entity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) => void
}) {
  const { dictionary } = useLocalization()
  const visual = nodeVisuals[node.kind]
  const metadata = node.metadata ?? {}
  const entityId = getGraphViewNodeEntityId(node.id, node.kind)
  const quickDetailEntity =
    entityId !== null && (node.kind === "event" || node.kind === "news-article")
      ? { id: entityId, kind: node.kind }
      : null
  const sourceUrl =
    node.kind === "news-article" && /^https?:\/\//i.test(metadata.url ?? "")
      ? metadata.url
      : null

  return (
    <aside
      aria-label={dictionary.graphView.demo.selectedNode}
      data-graph-label-obstacle
      className={GRAPH_DEMO_INSPECTOR_CLASS_NAME}
      data-testid="graph-demo-inspector"
    >
      <div className="flex items-start gap-3 border-b border-border/70 p-4">
        <span
          aria-hidden="true"
          className="mt-1 size-3 shrink-0 rounded-full"
          style={{ backgroundColor: visual.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {visual.label}
          </p>
          <h2 className="mt-1 text-sm leading-snug font-semibold break-words">
            {node.label}
          </h2>
          {node.secondaryLabel ? (
            <p className="mt-1 text-xs break-words text-muted-foreground">
              {node.secondaryLabel}
            </p>
          ) : null}
        </div>
        <Button
          aria-label={dictionary.graphView.inspector.closeNodeDetails}
          className="size-11 min-[1440px]:size-8"
          data-testid="graph-demo-close-inspector"
          size="icon"
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          <X aria-hidden="true" data-icon="inline-start" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4 [&_.line-clamp-4]:line-clamp-none">
        <GraphNodeInspectorMetadata node={node} />
        {quickDetailEntity || sourceUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            {quickDetailEntity ? (
              <Button
                className="min-h-11 min-[1440px]:min-h-0"
                data-testid="graph-demo-open-quick-detail"
                type="button"
                onClick={(event) =>
                  onOpenQuickDetail(quickDetailEntity, event.currentTarget)
                }
              >
                {node.kind === "event"
                  ? dictionary.graphView.inspector.readEvent
                  : dictionary.graphView.inspector.readArticle}
              </Button>
            ) : null}
            {sourceUrl ? (
              <a
                className={buttonVariants({
                  variant: "outline",
                  className: "min-h-11 min-[1440px]:min-h-0",
                })}
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink aria-hidden="true" data-icon="inline-start" />
                {dictionary.graphView.inspector.openOriginalSource}
              </a>
            ) : null}
          </div>
        ) : null}
        {node.kind === "news-article" && !sourceUrl ? (
          <p className="text-xs text-muted-foreground">
            {dictionary.graphView.demo.sourceUnavailable}
          </p>
        ) : null}
      </div>
    </aside>
  )
}

function DemoEdgeInspector({
  edge,
  edgeVisuals,
  onClose,
  graphView,
}: {
  edge: GraphViewEdge
  edgeVisuals: Record<string, GraphDemoEdgeVisual>
  onClose: () => void
  graphView: GraphViewResponse
}) {
  const { dictionary } = useLocalization()
  const source = graphView.nodes.find((node) => node.id === edge.sourceNodeId)
  const target = graphView.nodes.find((node) => node.id === edge.targetNodeId)
  const nodeVisuals = getGraphViewNodeVisuals(dictionary)
  const fields = [
    {
      label: dictionary.graphView.demo.connectionGroup,
      value: edgeVisuals[edge.kind].label,
    },
    {
      label: dictionary.graphView.demo.relationMeaning,
      value: getGraphViewRelationLabel(edge.relationType, dictionary),
    },
    ...(edge.note?.trim()
      ? [{ label: dictionary.graphView.demo.note, value: edge.note }]
      : []),
  ]
  return (
    <aside
      aria-label={dictionary.graphView.demo.selectedEdge}
      data-graph-label-obstacle
      className={GRAPH_DEMO_INSPECTOR_CLASS_NAME}
      data-testid="graph-demo-edge-inspector"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
        <h2 className="text-base font-semibold">
          {dictionary.graphView.demo.relation}
        </h2>
        <Button
          aria-label={dictionary.graphView.demo.closeRelationship}
          className="size-11 min-[1440px]:size-8"
          data-testid="graph-demo-close-edge-inspector"
          size="icon"
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          <X aria-hidden="true" data-icon="inline-start" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {dictionary.graphView.demo.source}
              {source ? " · " + nodeVisuals[source.kind].label : ""}
            </dt>
            <dd className="mt-1 text-sm font-medium break-words">
              {source?.label ?? edge.sourceNodeId}
            </dd>
          </div>
          <div>
            <ArrowDown
              aria-hidden="true"
              className="mb-3 size-4 text-muted-foreground"
            />
            <dt className="text-xs font-medium text-muted-foreground">
              {dictionary.graphView.demo.target}
              {target ? " · " + nodeVisuals[target.kind].label : ""}
            </dt>
            <dd className="mt-1 text-sm font-medium break-words">
              {target?.label ?? edge.targetNodeId}
            </dd>
          </div>
          {fields.map((field) => (
            <div
              className="rounded-lg border border-border/60 bg-background/55 p-3"
              key={field.label}
            >
              <dt className="text-xs font-medium text-muted-foreground">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium break-words">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs leading-5 text-muted-foreground">
          {dictionary.graphView.demo.relationshipInterpretation}
        </p>
      </div>
    </aside>
  )
}

export function SigmaGraphView({
  initialEdgeCount = 400,
  graphView: liveGraphView,
}: {
  initialEdgeCount?: GraphViewDemoEdgeCount
  graphView?: GraphViewResponse
}) {
  const localization = useLocalization()
  const { dictionary, formatMessage, formatNumber, locale } = localization
  const { resolvedTheme } = useTheme()
  const edgeCount = initialEdgeCount
  const [layoutStatus, setLayoutStatus] =
    useState<GraphDemoLayoutStatus>("seed")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [edgeChoices, setEdgeChoices] = useState<string[]>([])
  const [quickDetailEntity, setQuickDetailEntity] =
    useState<LocalQuickDetailEntity | null>(null)
  const [renderError, setRenderError] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sigmaRef = useRef<Sigma<
    GraphViewDemoNodeAttributes,
    GraphViewDemoEdgeAttributes
  > | null>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  const selectedEdgeIdRef = useRef<string | null>(null)
  const hoveredNodeIdRef = useRef<string | null>(null)
  const hoveredEdgeIdRef = useRef<string | null>(null)
  const activeNodesRef = useRef<Set<string>>(new Set())
  const activeEdgesRef = useRef<Set<string>>(new Set())
  const savedViewRef = useRef<{
    positions: Record<string, GraphViewDemoPosition>
    camera: { x: number; y: number; angle: number; ratio: number }
    settled: boolean
    bbox: ReturnType<Sigma["getBBox"]>
  } | null>(null)
  const draggedNodeIdRef = useRef<string | null>(null)
  const draggedNodeMovedRef = useRef(false)
  const renderedLabelsRef = useRef<PlacedNodeLabel[]>([])
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const clearHoverRef = useRef<(() => void) | null>(null)
  const selectTargetRef = useRef<
    ((node: string | null, edge: string | null) => void) | null
  >(null)
  const quickDetailReturnFocusRef = useRef<HTMLElement | null>(null)
  const edgeChoicesCloseRef = useRef<HTMLButtonElement | null>(null)
  const graphThemeMode: GraphDemoThemeMode =
    resolvedTheme === "dark" ? "dark" : "light"
  const graphPalette = useMemo(
    () => createGraphDemoPalette(graphThemeMode),
    [graphThemeMode]
  )
  const paletteRef = useRef(graphPalette)
  useEffect(() => {
    paletteRef.current = graphPalette
    const sigma = sigmaRef.current
    if (sigma) {
      sigma.setSetting("edgeLabelColor", { color: graphPalette.labelFill })
      sigma.refresh()
    }
  }, [graphPalette])
  const graphView = useMemo(
    () => liveGraphView ?? createGraphViewDemoFixture(edgeCount, locale),
    [liveGraphView, edgeCount, locale]
  )
  const nodeVisuals = useMemo(
    () => getGraphViewNodeVisuals(dictionary),
    [dictionary]
  ) as Record<GraphViewNodeKind, GraphDemoNodeVisual>
  const edgeVisuals = useMemo(
    () => getGraphViewEdgeVisuals(dictionary),
    [dictionary]
  ) as Record<string, GraphDemoEdgeVisual>
  const selectedNode = selectedNodeId
    ? (graphView.nodes.find((node) => node.id === selectedNodeId) ?? null)
    : null
  const selectedEdge = selectedEdgeId
    ? (graphView.edges.find((edge) => edge.id === selectedEdgeId) ?? null)
    : null
  const quickDetailFixture = useMemo(
    () =>
      !liveGraphView && selectedNode
        ? getDemoQuickDetailFixture(selectedNode, locale)
        : null,
    [liveGraphView, locale, selectedNode]
  )
  const layoutStatusLabel = getDemoStatusLabel(layoutStatus, dictionary)

  useEffect(() => {
    if (edgeChoices.length < 2) return
    const previous = document.activeElement
    edgeChoicesCloseRef.current?.focus({ preventScroll: true })
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true })
    }
  }, [edgeChoices])

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId
  }, [selectedNodeId])

  useEffect(() => {
    selectedEdgeIdRef.current = selectedEdgeId
  }, [selectedEdgeId])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let sigma: Sigma<
      GraphViewDemoNodeAttributes,
      GraphViewDemoEdgeAttributes
    > | null = null
    let graph: GraphViewDemoGraph | null = null
    let layout: ReturnType<typeof createD3Layout> | null = null
    let isDisposed = false
    let hoverFrame: number | null = null
    let pickNodes = new Map<string, PickNode>()
    const nodeIds = getNodeIds(graphView)
    const cachedPositions = liveGraphView
      ? null
      : readGraphViewDemoLayoutCache(edgeCount, nodeIds)
    const savedView = savedViewRef.current
    const initialPositions = {
      ...createGraphViewDemoSeedPositions(graphView.nodes),
      ...(cachedPositions ?? {}),
      ...(savedView?.positions ?? {}),
    }

    const updateBenchmarkAnchor = () => {
      const nodeId = nodeIds[0]

      if (!sigma || !nodeId || isDisposed) {
        return
      }

      const displayData = sigma.getNodeDisplayData(nodeId)

      if (!displayData) {
        return
      }

      const viewportPosition = sigma.framedGraphToViewport({
        x: displayData.x,
        y: displayData.y,
      })

      container.dataset.renderedNodeDiameter = String(
        2 * sigma.scaleSize(displayData.size)
      )
      container.dataset.nodeBaseDiameter = String(2 * displayData.size)
      container.dataset.cameraRatio = String(sigma.getCamera().getState().ratio)
      container.dataset.renderedLabelCount = String(
        renderedLabelsRef.current.length
      )
      container.dataset.renderedLabelIds = JSON.stringify(
        renderedLabelsRef.current.map((label) => label.id).sort()
      )
      container.dataset.renderedLabelBoxes = JSON.stringify(
        renderedLabelsRef.current
      )
      container.dataset.draggingNodeId = draggedNodeMovedRef.current
        ? (draggedNodeIdRef.current ?? "")
        : ""
      container.dataset.hoveredNodeId = hoveredNodeIdRef.current ?? ""
      container.dataset.hoveredEdgeId = hoveredEdgeIdRef.current ?? ""
      container.dataset.benchmarkAnchorId = nodeId
      container.dataset.benchmarkAnchorX = String(viewportPosition.x)
      container.dataset.benchmarkAnchorY = String(viewportPosition.y)
      const neighbor = sigma.getNodeDisplayData(nodeIds[1])
      if (neighbor) {
        const point = sigma.framedGraphToViewport(neighbor)
        container.dataset.neighborX = String(point.x)
        container.dataset.neighborY = String(point.y)
      }
    }

    if (
      !graphView.nodes.some((node) => node.id === selectedNodeIdRef.current)
    ) {
      selectedNodeIdRef.current = null
      setSelectedNodeId(null)
    }
    if (
      !graphView.edges.some((edge) => edge.id === selectedEdgeIdRef.current)
    ) {
      selectedEdgeIdRef.current = null
      setSelectedEdgeId(null)
    }
    draggedNodeIdRef.current = null
    renderedLabelsRef.current = []
    pointerRef.current = null
    hoveredNodeIdRef.current = null
    hoveredEdgeIdRef.current = null
    setEdgeChoices([])
    setQuickDetailEntity((entity) =>
      entity &&
      graphView.nodes.some((node) => node.id === entity.kind + ":" + entity.id)
        ? entity
        : null
    )
    setRenderError(false)

    if (!canUseWebGL()) {
      window.queueMicrotask(() => {
        if (!isDisposed) {
          setLayoutStatus("unsupported")
        }
      })
      return
    }

    const refreshFocus = () => {
      if (!sigma || !graph || sigma.getGraph() !== graph) {
        return
      }

      sigma.scheduleRefresh({
        layoutUnchange: true,
        partialGraph: {
          edges: graph.edges(),
          nodes: graph.nodes(),
        },
      })
    }

    const updateFocus = (nodeId: string | null, edgeId: string | null) => {
      if (!graph) {
        return
      }

      const focused = getFocusedGraphParts(graph, nodeId, edgeId)
      activeNodesRef.current = focused.nodes
      activeEdgesRef.current = focused.edges
      refreshFocus()
    }

    const clearHover = () => {
      if (hoverFrame !== null) window.cancelAnimationFrame(hoverFrame)
      hoverFrame = null
      pointerRef.current = null
      hoveredNodeIdRef.current = null
      hoveredEdgeIdRef.current = null
      container.style.cursor = ""
      updateFocus(selectedNodeIdRef.current, selectedEdgeIdRef.current)
    }
    clearHoverRef.current = clearHover

    const restoreHover = () => {
      if (!sigma || !graph) return
      let pointer = pointerRef.current
      if (pointer) {
        const canvasBox = container.getBoundingClientRect()
        const { x, y } = pointer
        const overHud = Array.from(
          container.parentElement?.querySelectorAll<HTMLElement>(
            "[data-graph-label-obstacle]"
          ) ?? []
        ).some((element) => {
          const box = element.getBoundingClientRect()
          return (
            x >= box.left - canvasBox.left &&
            x < box.right - canvasBox.left &&
            y >= box.top - canvasBox.top &&
            y < box.bottom - canvasBox.top
          )
        })
        if (overHud) pointer = pointerRef.current = null
      }
      const { width, height } = sigma.getDimensions()
      let hovered: string | null = null
      if (
        pointer &&
        pointer.x >= 0 &&
        pointer.x <= width &&
        pointer.y >= 0 &&
        pointer.y <= height
      ) {
        let nearest = Infinity
        graph.forEachNode((id) => {
          const data = sigma!.getNodeDisplayData(id)
          if (!data || data.hidden) return
          const point = sigma!.framedGraphToViewport(data)
          const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y)
          if (distance <= sigma!.scaleSize(data.size) && distance < nearest) {
            nearest = distance
            hovered = id
          }
        })
      }
      let hoveredEdge =
        pointer &&
        !hovered &&
        pointer.x >= 0 &&
        pointer.x <= width &&
        pointer.y >= 0 &&
        pointer.y <= height
          ? (pickGraphEdges(pointer, pickNodes, graphView.edges)[0] ?? null)
          : null
      container.style.cursor = hovered || hoveredEdge ? "pointer" : ""
      if (selectedNodeIdRef.current || selectedEdgeIdRef.current) {
        hovered = null
        hoveredEdge = null
      }
      if (
        hoveredNodeIdRef.current === hovered &&
        hoveredEdgeIdRef.current === hoveredEdge
      )
        return
      hoveredNodeIdRef.current = hovered
      hoveredEdgeIdRef.current = hoveredEdge
      updateFocus(
        selectedNodeIdRef.current ?? hovered,
        selectedEdgeIdRef.current ?? hoveredEdge
      )
    }

    const textMetrics = new Map<string, ReturnType<typeof measureNodeLabel>>()
    void document.fonts.ready.then(() => {
      if (isDisposed) return
      textMetrics.clear()
      sigma?.scheduleRender()
    })
    const drawNodeLabels = () => {
      if (!sigma || !graph || isDisposed) return
      const context = sigma.getCanvases().labels.getContext("2d")
      if (!context) return
      const { width, height } = sigma.getDimensions()
      const scale = sigma.scaleSize(1)
      context.clearRect(0, 0, width, height)
      context.font = "600 11px Geist, sans-serif"
      const edgeId = selectedEdgeIdRef.current ?? hoveredEdgeIdRef.current
      const edgeEndpoints = new Set(edgeId ? graph.extremities(edgeId) : [])
      const state = {
        selected: selectedNodeIdRef.current,
        dragged: draggedNodeMovedRef.current ? draggedNodeIdRef.current : null,
        hovered: hoveredNodeIdRef.current,
        edgeEndpoints,
        active: activeNodesRef.current,
      }
      const nodes = graph
        .mapNodes((id, attributes) => {
          const data = sigma!.getNodeDisplayData(id)!
          const point = sigma!.framedGraphToViewport(data)
          const radius = sigma!.scaleSize(data.size)
          return { id, attributes, data, ...point, radius }
        })
        .filter((node) => !node.data.hidden)
      pickNodes = new Map(nodes.map((node) => [node.id, node]))
      const candidates = nodes.flatMap(({ id, attributes, x, y, radius }) => {
        const priority = getNodeLabelPriority(id, attributes.kind, state)
        if (priority === null) return []
        let measured = textMetrics.get(attributes.label)
        if (!measured) {
          measured = measureNodeLabel(
            attributes.label,
            (text) => context.measureText(text).width
          )
          textMetrics.set(attributes.label, measured)
        }
        return [
          {
            id,
            text: measured.text,
            textWidth: measured.width,
            x,
            y,
            radius,
            priority,
          },
        ]
      })
      const labels = placeNodeLabels(candidates, { width, height, scale })
      context.font = `600 ${11 * scale}px Geist, sans-serif`
      context.textBaseline = "middle"
      // Focus labels draw last, without moving or hiding baseline labels.
      for (const label of [...labels].reverse()) {
        context.fillStyle =
          label.priority <= 3
            ? paletteRef.current.labelFocusFill
            : state.active.size > 0
              ? paletteRef.current.labelDimFill
              : paletteRef.current.labelFill
        context.fillText(label.text, label.x, label.y + label.height / 2)
      }
      renderedLabelsRef.current = labels
    }

    let initialFitPending = !savedView?.settled
    const finishLayout = () => {
      if (!graph || isDisposed) return

      refreshFocus()

      if (!liveGraphView)
        writeGraphViewDemoLayoutCache(
          edgeCount,
          nodeIds,
          getGraphPositions(graph)
        )
      if (initialFitPending && sigma) {
        sigma.refresh()
        const box = sigma.getBBox()
        const center = sigma.graphToViewport({
          x: (box.x[0] + box.x[1]) / 2,
          y: (box.y[0] + box.y[1]) / 2,
        })
        const framed = sigma.viewportToFramedGraph(center)
        sigma.getCamera().setState({ x: framed.x, y: framed.y })
        initialFitPending = false
      }
      updateBenchmarkAnchor()
      setLayoutStatus("ready")
    }

    try {
      const layoutGraph = createGraphViewDemoGraph({
        dictionary,
        edgeVisuals,
        graphView,
        nodeVisuals,
        positions: initialPositions,
      })
      graph = layoutGraph

      sigma = new Sigma(layoutGraph, container, {
        autoCenter: true,
        autoRescale: true,
        cameraPanBoundaries: null,
        defaultEdgeColor: paletteRef.current.edgeDimStroke,
        defaultEdgeType: "line",
        minEdgeThickness: 1.7,
        zIndex: true,
        itemSizesReference: "positions",
        doubleClickZoomingRatio: 1,
        // Our distance threshold decides click vs drag, regardless of event count.
        draggedEventsTolerance: Infinity,
        zoomingRatio: 1.18,
        zoomToSizeRatioFunction: (ratio) => ratio,
        defaultNodeColor: paletteRef.current.nodeDimFill,
        defaultNodeType: "circle",
        edgeLabelColor: { color: paletteRef.current.labelFill },
        edgeLabelFont: "Geist, sans-serif",
        edgeLabelSize: 9,
        edgeLabelWeight: "500",
        enableCameraPanning: true,
        enableCameraRotation: false,
        enableCameraZooming: true,
        enableEdgeEvents: true,
        hideEdgesOnMove: false,
        hideLabelsOnMove: false,
        defaultDrawEdgeLabel: (context, edge, source, target, settings) =>
          drawStraightEdgeLabel(context, edge, source, target, {
            ...settings,
            edgeLabelSize:
              sigma?.scaleSize(settings.edgeLabelSize) ??
              settings.edgeLabelSize,
          }),
        defaultDrawNodeHover: (context, data) => {
          const isDragged =
            draggedNodeMovedRef.current && data.key === draggedNodeIdRef.current
          if (data.key !== selectedNodeIdRef.current && !isDragged) return
          context.save()
          context.strokeStyle = data.color
          context.globalAlpha = isDragged ? 0.8 : 0.25
          context.lineWidth = (isDragged ? 3 : 12) * (sigma?.scaleSize(1) ?? 1)
          context.beginPath()
          context.arc(data.x, data.y, data.size, 0, Math.PI * 2)
          context.stroke()
          context.restore()
        },
        maxCameraRatio: GRAPH_DEMO_ZOOM_RANGE[1],
        minCameraRatio: GRAPH_DEMO_ZOOM_RANGE[0],
        nodeReducer: (node, data) => {
          const hasFocus =
            activeNodesRef.current.size > 0 || activeEdgesRef.current.size > 0
          const isDragged =
            draggedNodeMovedRef.current && node === draggedNodeIdRef.current
          const isActive = activeNodesRef.current.has(node) || isDragged
          const isFocused =
            node === selectedNodeIdRef.current ||
            node === hoveredNodeIdRef.current ||
            isDragged

          if (!hasFocus && !isDragged) {
            return {
              ...data,
              label: null,
              highlighted: false,
            }
          }

          if (isActive) {
            return {
              ...data,
              label: null,
              highlighted: isFocused,
              zIndex: isFocused ? 3 : 2,
            }
          }

          return {
            ...data,
            color: paletteRef.current.nodeDimFill,
            forceLabel: false,
            highlighted: false,
            label: null,
            zIndex: 0,
          }
        },
        edgeReducer: (edge, data) => {
          const hasFocus =
            activeNodesRef.current.size > 0 || activeEdgesRef.current.size > 0
          const isActive = activeEdgesRef.current.has(edge)
          const isSelected = edge === selectedEdgeIdRef.current
          const isHovered = edge === hoveredEdgeIdRef.current

          if (!hasFocus) {
            return {
              ...data,
              color: edgeOpacity(data.color, 0.46),
              forceLabel: false,
              label: null,
            }
          }

          if (isActive) {
            return {
              ...data,
              forceLabel: isSelected || isHovered,
              label: isSelected || isHovered ? data.label : null,
              size:
                isSelected || isHovered ? Math.max(data.size, 2.5) : data.size,
            }
          }

          return {
            ...data,
            color: edgeOpacity(paletteRef.current.edgeDimStroke, 0.46),
            forceLabel: false,
            label: null,
            size: data.size,
          }
        },
        renderEdgeLabels: true,
        renderLabels: false,
        stagePadding: 48,
      })
      sigmaRef.current = sigma
      if (!savedView) {
        sigma.getCamera().setState({ ratio: 1 })
        const { width, height } = sigma.getDimensions()
        sigma.setCustomBBox({
          x: [-width / 2, width / 2],
          y: [-height / 2, height / 2],
        })
        sigma.refresh()
        // Calibrate one graph unit to one CSS pixel at camera ratio 1.
        const origin = sigma.graphToViewport({ x: 0, y: 0 })
        const unit = sigma.graphToViewport({ x: 1, y: 0 })
        const scale = Math.hypot(unit.x - origin.x, unit.y - origin.y)
        sigma.setCustomBBox({
          x: [(-width * scale) / 2, (width * scale) / 2],
          y: [(-height * scale) / 2, (height * scale) / 2],
        })
        sigma.refresh()
      }
      if (savedView) {
        sigma.setCustomBBox(savedView.bbox)
        sigma.getCamera().setState(savedView.camera)
      }
      updateFocus(selectedNodeIdRef.current, selectedEdgeIdRef.current)
      sigma.on("afterRender", () => {
        drawNodeLabels()
        updateBenchmarkAnchor()
      })
      window.requestAnimationFrame(updateBenchmarkAnchor)

      sigma.setCustomBBox(sigma.getCustomBBox() ?? sigma.getBBox())
      layout = createD3Layout(layoutGraph, finishLayout, () => {
        if (!isDisposed) {
          setRenderError(true)
          setLayoutStatus("error")
        }
      })

      let gestureStart: { x: number; y: number } | null = null
      let gestureMoved = false
      let multiTouch = false
      let grabOffset = { x: 0, y: 0 }
      const selectTarget = (node: string | null, edge: string | null) => {
        clearHover()
        setEdgeChoices([])
        const nextNode = node === selectedNodeIdRef.current ? null : node
        const nextEdge = edge === selectedEdgeIdRef.current ? null : edge
        selectedNodeIdRef.current = nextNode
        selectedEdgeIdRef.current = nextEdge
        setSelectedNodeId(nextNode)
        setSelectedEdgeId(nextEdge)
        updateFocus(nextNode, nextEdge)
      }
      selectTargetRef.current = selectTarget

      // Sigma treats the second rapid click/tap as doubleClick, even on another target.
      for (const name of ["clickNode", "doubleClickNode"] as const) {
        sigma.on(name, ({ node, preventSigmaDefault }) => {
          preventSigmaDefault()
          if (!gestureMoved && !multiTouch) selectTarget(node, null)
        })
      }
      for (const name of [
        "clickEdge",
        "clickStage",
        "doubleClickEdge",
        "doubleClickStage",
      ] as const) {
        sigma.on(name, ({ event, preventSigmaDefault }: SigmaEventPayload) => {
          preventSigmaDefault()
          if (gestureMoved || multiTouch) return
          const edges = pickGraphEdges(
            event,
            pickNodes,
            graphView.edges,
            "touches" in event.original ? 12 : 8
          )
          if (edges.length > 1) {
            clearHover()
            setEdgeChoices(edges)
          } else selectTarget(null, edges[0] ?? null)
        })
      }

      const endDrag = () => {
        const hadGesture =
          gestureStart !== null || draggedNodeIdRef.current !== null
        if (draggedNodeIdRef.current && draggedNodeMovedRef.current)
          layout?.release()
        draggedNodeIdRef.current = null
        gestureStart = null
        // Hover and labels unlock at drop; force cooldown is independent.
        if (hadGesture) clearHover()
      }
      const beginGesture = (event: SigmaEventPayload["event"]) => {
        if ("touches" in event.original) {
          if (event.original.touches.length !== 1) {
            multiTouch = true
            gestureMoved = true
            endDrag()
            return false
          }
          if (multiTouch) return false
        } else if (event.original.button !== 0) return false
        gestureStart = { x: event.x, y: event.y }
        gestureMoved = false
        draggedNodeMovedRef.current = false
        initialFitPending = false
        clearHover()
        return true
      }
      sigma.on("downNode", ({ node, event }) => {
        if (!sigma || !beginGesture(event)) return
        const pointer = sigma.viewportToGraph(event)
        grabOffset = {
          x: layoutGraph.getNodeAttribute(node, "x") - pointer.x,
          y: layoutGraph.getNodeAttribute(node, "y") - pointer.y,
        }
        draggedNodeIdRef.current = node
      })
      sigma.on("downStage", ({ event }) => {
        beginGesture(event)
      })
      sigma.on("downEdge", ({ event }) => {
        beginGesture(event)
      })
      sigma.on("moveBody", ({ event, preventSigmaDefault }) => {
        const touch = "touches" in event.original
        if (
          gestureStart &&
          Math.hypot(event.x - gestureStart.x, event.y - gestureStart.y) >= 5
        )
          gestureMoved = true
        const node = draggedNodeIdRef.current
        if (!node || !sigma) {
          if (!sigma) return
          const { width, height } = sigma.getDimensions()
          const onCanvas =
            event.original.target === sigma.getCanvases().mouse &&
            event.x >= 0 &&
            event.x <= width &&
            event.y >= 0 &&
            event.y <= height
          if (
            gestureStart ||
            touch ||
            ("buttons" in event.original && event.original.buttons !== 0) ||
            !onCanvas
          ) {
            if (
              pointerRef.current ||
              hoveredNodeIdRef.current ||
              hoveredEdgeIdRef.current ||
              hoverFrame !== null
            )
              clearHover()
            return
          }
          pointerRef.current = { x: event.x, y: event.y }
          if (hoverFrame === null)
            hoverFrame = window.requestAnimationFrame(() => {
              hoverFrame = null
              if (!isDisposed) restoreHover()
            })
          return
        }
        if (
          "touches" in event.original &&
          event.original.touches.length !== 1
        ) {
          multiTouch = true
          gestureMoved = true
          endDrag()
          return
        }
        if ("buttons" in event.original && (event.original.buttons & 1) === 0) {
          cancelGesture()
          return
        }
        preventSigmaDefault()
        if (!gestureMoved) return
        if (!draggedNodeMovedRef.current) {
          draggedNodeMovedRef.current = true
          clearHover()
          setLayoutStatus("refining")
        }
        const position = sigma.viewportToGraph(event)
        position.x += grabOffset.x
        position.y += grabOffset.y
        layoutGraph.mergeNodeAttributes(node, { ...position })
        layout?.pin(node, position.x, position.y)
      })
      sigma.on("upNode", endDrag)
      sigma.on("upEdge", endDrag)
      sigma.on("upStage", endDrag)
      sigma.on("leaveStage", clearHover)
      for (const name of ["wheelNode", "wheelEdge", "wheelStage"] as const)
        sigma.on(name, clearHover)
      const cancelGesture = () => {
        endDrag()
        gestureMoved = true
        multiTouch = false
        if (sigma) {
          sigma.getMouseCaptor().isMouseDown = false
          sigma.getMouseCaptor().isMoving = false
        }
        clearHover()
      }
      const releaseMouse = (event: MouseEvent) => {
        if (event.button === 0) endDrag()
      }
      const releaseTouch = (event: TouchEvent) => {
        if (!event.touches.length) {
          endDrag()
          // Sigma dispatches tap synchronously before this event completes.
          window.queueMicrotask(() => {
            multiTouch = false
          })
        }
      }
      document.addEventListener("mouseup", releaseMouse)
      document.addEventListener("touchend", releaseTouch)
      document.addEventListener("touchcancel", cancelGesture)
      container.addEventListener("pointercancel", cancelGesture)
      window.addEventListener("blur", cancelGesture)

      const resizeObserver = new ResizeObserver(() => {
        if (!isDisposed && sigma) {
          sigma.resize()
        }
      })
      resizeObserver.observe(container)

      if (savedView?.settled || cachedPositions) {
        sigma.setCustomBBox(sigma.getCustomBBox() ?? sigma.getBBox())
        window.queueMicrotask(() => {
          if (!isDisposed) setLayoutStatus("ready")
        })
      } else {
        layout.start()
        window.queueMicrotask(() => {
          if (!isDisposed) setLayoutStatus("refining")
        })
      }

      return () => {
        isDisposed = true
        if (hoverFrame !== null) window.cancelAnimationFrame(hoverFrame)
        container.style.cursor = ""
        resizeObserver.disconnect()
        document.removeEventListener("mouseup", releaseMouse)
        document.removeEventListener("touchend", releaseTouch)
        document.removeEventListener("touchcancel", cancelGesture)
        container.removeEventListener("pointercancel", cancelGesture)
        window.removeEventListener("blur", cancelGesture)
        clearHoverRef.current = null
        selectTargetRef.current = null
        if (graph && sigma)
          savedViewRef.current = {
            settled: !layout?.isRunning(),
            positions: getGraphPositions(graph),
            camera: sigma.getCamera().getState(),
            bbox: sigma.getCustomBBox() ?? sigma.getBBox(),
          }

        layout?.kill()
        sigma?.kill()
        if (sigmaRef.current === sigma) {
          sigmaRef.current = null
        }
      }
    } catch (error) {
      if (!isDisposed) {
        console.error(error)
        window.queueMicrotask(() => {
          if (!isDisposed) {
            setRenderError(true)
            setLayoutStatus("error")
          }
        })
      }
    }

    return () => {
      isDisposed = true

      layout?.kill()
      sigma?.kill()
      if (sigmaRef.current === sigma) {
        sigmaRef.current = null
      }
    }
  }, [
    dictionary,
    edgeCount,
    edgeVisuals,
    graphView,
    liveGraphView,
    nodeVisuals,
  ])

  const handleZoom = (direction: "in" | "out") => {
    clearHoverRef.current?.()
    const sigma = sigmaRef.current

    if (!sigma) {
      return
    }

    const camera = sigma.getCamera()
    const currentRatio = camera.getState().ratio
    const nextRatio = Math.min(
      Math.max(
        direction === "in"
          ? currentRatio / GRAPH_DEMO_ZOOM_FACTOR
          : currentRatio * GRAPH_DEMO_ZOOM_FACTOR,
        GRAPH_DEMO_ZOOM_RANGE[0]
      ),
      GRAPH_DEMO_ZOOM_RANGE[1]
    )

    void camera
      .animate(
        { ratio: nextRatio },
        { duration: getMotionDuration(220), easing: "quadraticInOut" }
      )
      .catch(() => undefined)
  }

  const handleRecenter = () => {
    clearHoverRef.current?.()
    const sigma = sigmaRef.current

    if (!sigma) {
      return
    }

    fitSigmaGraph(
      sigma,
      !!(selectedNodeIdRef.current || selectedEdgeIdRef.current)
    )
  }

  const handleOpenQuickDetail = (
    entity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) => {
    quickDetailReturnFocusRef.current = trigger
    clearHoverRef.current?.()
    setQuickDetailEntity(entity)
  }

  const statusIsBlocking = layoutStatus === "unsupported" || renderError

  const clearSelection = () => {
    selectTargetRef.current?.(null, null)
  }

  return (
    <section
      className="relative -m-5 h-[calc(100svh-5.5rem)] min-h-[24rem] w-[calc(100%+2.5rem)] overflow-hidden bg-card min-[1440px]:m-0 min-[1440px]:h-[calc(100svh-6.5rem)] min-[1440px]:min-h-[36rem] min-[1440px]:w-full min-[1440px]:rounded-xl min-[1440px]:border min-[1440px]:shadow-sm md:max-[1440px]:h-[calc(100svh-3rem)]"
      data-engine="sigma"
      data-fixture-version={
        liveGraphView ? undefined : GRAPH_VIEW_DEMO_FIXTURE_VERSION
      }
      data-layout-status={layoutStatus}
      data-layout-version={GRAPH_VIEW_DEMO_LAYOUT_VERSION}
      data-testid="graph-view"
    >
      <div
        aria-hidden={statusIsBlocking}
        className={cn(
          "size-full min-h-[24rem] max-w-full min-[1440px]:min-h-[36rem]",
          statusIsBlocking && "invisible"
        )}
        data-engine-canvas="sigma"
        data-testid="graph-demo-canvas"
        ref={containerRef}
      />

      {statusIsBlocking ? (
        <div className="absolute inset-6 flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
          <div className="max-w-md" role="status" aria-live="polite">
            <p className="text-sm font-semibold text-foreground">
              {layoutStatus === "unsupported"
                ? dictionary.graphView.demo.unsupportedTitle
                : dictionary.graphView.demo.layoutError}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {layoutStatus === "unsupported"
                ? dictionary.graphView.demo.layoutUnsupported
                : dictionary.graphView.demo.layoutError}
            </p>
          </div>
        </div>
      ) : null}

      <div
        data-graph-label-obstacle
        className="pointer-events-none absolute inset-x-4 top-3 z-10 flex flex-wrap items-start justify-between gap-3 min-[1440px]:top-4"
      >
        <h1 className="sr-only text-xl font-semibold tracking-tight min-[1440px]:not-sr-only">
          {dictionary.graphView.title}
        </h1>
        <div
          className="grid grid-cols-2 gap-2 min-[1440px]:flex"
          data-testid="graph-demo-node-legend"
        >
          {GRAPH_DEMO_NODE_KIND_ORDER.map((kind) => (
            <Badge key={kind} variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: nodeVisuals[kind].color }}
              />
              {nodeVisuals[kind].label}{" "}
              {formatNumber(
                graphView.nodes.filter((node) => node.kind === kind).length
              )}
            </Badge>
          ))}
        </div>
      </div>
      <div
        data-graph-label-obstacle
        className="pointer-events-auto absolute top-24 left-4 z-10 min-[1440px]:top-16"
      >
        <ButtonGroup orientation="vertical">
          <DemoControlButton
            aria-label={dictionary.graphView.controls.zoomOut}
            testId="graph-demo-zoom-out"
            onClick={() => handleZoom("out")}
          >
            <Minus aria-hidden="true" data-icon="inline-start" />
          </DemoControlButton>
          <DemoControlButton
            aria-label={dictionary.graphView.controls.recenter}
            testId="graph-demo-recenter"
            onClick={handleRecenter}
          >
            <LocateFixed aria-hidden="true" data-icon="inline-start" />
          </DemoControlButton>
          <DemoControlButton
            aria-label={dictionary.graphView.controls.zoomIn}
            testId="graph-demo-zoom-in"
            onClick={() => handleZoom("in")}
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
          </DemoControlButton>
        </ButtonGroup>
      </div>
      <p
        data-graph-label-obstacle
        className="pointer-events-none absolute top-24 right-4 left-18 z-10 text-xs leading-5 text-muted-foreground min-[1440px]:top-16"
      >
        {dictionary.graphView.demo.interactionHint}
      </p>
      <div
        data-graph-label-obstacle
        className="pointer-events-none absolute inset-x-4 bottom-20 z-10 flex flex-col gap-3 min-[1440px]:right-20 min-[1440px]:bottom-4 min-[1440px]:flex-row min-[1440px]:items-end min-[1440px]:justify-between"
      >
        <Badge variant="outline">
          <span data-testid="graph-demo-node-count">
            {formatMessage(dictionary.graphView.demo.nodeCount, {
              count: formatNumber(graphView.nodes.length),
            })}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="graph-demo-edge-count">
            {formatMessage(dictionary.graphView.demo.edgeCount, {
              count: formatNumber(graphView.edges.length),
            })}
          </span>
        </Badge>
        <div
          className="grid w-fit grid-cols-2 gap-2 min-[1440px]:flex"
          data-testid="graph-demo-edge-legend"
        >
          {GRAPH_DEMO_EDGE_KIND_ORDER.map((kind) => (
            <Badge key={kind} variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: edgeVisuals[kind].color }}
              />
              {edgeVisuals[kind].label}{" "}
              {formatNumber(
                graphView.edges.filter((edge) => edge.kind === kind).length
              )}
            </Badge>
          ))}
        </div>
      </div>
      <span
        aria-live="polite"
        className="sr-only"
        data-testid="graph-demo-layout-status"
        role="status"
      >
        {layoutStatusLabel}
      </span>
      {edgeChoices.length > 1 ? (
        <aside
          aria-label={dictionary.graphView.demo.chooseRelationship}
          data-graph-label-obstacle
          className={GRAPH_DEMO_INSPECTOR_CLASS_NAME}
          data-testid="graph-demo-edge-choices"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation()
              setEdgeChoices([])
            }
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
            <h2 className="text-base font-semibold">
              {dictionary.graphView.demo.chooseRelationship}
            </h2>
            <Button
              ref={edgeChoicesCloseRef}
              size="icon-sm"
              variant="ghost"
              aria-label={dictionary.graphView.demo.closeRelationshipChoices}
              onClick={() => setEdgeChoices([])}
            >
              <X aria-hidden="true" data-icon="inline-start" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-4">
            {edgeChoices.map((id) => {
              const edge = graphView.edges.find((edge) => edge.id === id)
              if (!edge) return null
              const source = graphView.nodes.find(
                (node) => node.id === edge.sourceNodeId
              )
              const target = graphView.nodes.find(
                (node) => node.id === edge.targetNodeId
              )
              return (
                <Button
                  key={id}
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-1 py-3 text-left whitespace-normal"
                  aria-pressed={selectedEdgeId === id}
                  onClick={() => selectTargetRef.current?.(null, id)}
                >
                  <span className="w-full break-words">
                    {source?.label ?? edge.sourceNodeId} →{" "}
                    {target?.label ?? edge.targetNodeId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {edgeVisuals[edge.kind].label} ·{" "}
                    {getGraphViewRelationLabel(edge.relationType, dictionary)}
                  </span>
                  {edge.note?.trim() ? (
                    <span className="w-full text-xs font-normal break-words text-muted-foreground">
                      {edge.note}
                    </span>
                  ) : null}
                </Button>
              )
            })}
          </div>
        </aside>
      ) : selectedNode ? (
        <DemoNodeInspector
          node={selectedNode}
          nodeVisuals={nodeVisuals}
          onClose={clearSelection}
          onOpenQuickDetail={handleOpenQuickDetail}
        />
      ) : selectedEdge ? (
        <DemoEdgeInspector
          graphView={graphView}
          edge={selectedEdge}
          edgeVisuals={edgeVisuals}
          onClose={clearSelection}
        />
      ) : null}

      <LocalEntityQuickDetailDrawer
        entity={quickDetailEntity}
        fixture={quickDetailFixture}
        onClose={() => setQuickDetailEntity(null)}
        owner="graph-view"
        returnFocusRef={quickDetailReturnFocusRef}
      />
    </section>
  )
}
