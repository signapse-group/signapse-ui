"use client"

import { createD3Layout } from "./d3-layout"
import {
  ArrowUpRight,
  ExternalLink,
  LocateFixed,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Sigma from "sigma"
import { drawStraightEdgeLabel } from "sigma/rendering"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  createGraphViewDemoFixture,
  createGraphViewDemoGraph,
  createGraphViewDemoSeedPositions,
  GRAPH_VIEW_DEMO_EDGE_COUNTS,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "../graph-view/graph-view-visuals"

type GraphDemoThemeMode = "light" | "dark"
type GraphDemoLayoutStatus =
  "seed" | "cached" | "refining" | "ready" | "unsupported" | "error"

type GraphDemoPalette = {
  edgeDimStroke: string
  labelDimFill: string
  labelFill: string
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

function createGraphDemoPalette(mode: GraphDemoThemeMode): GraphDemoPalette {
  if (mode === "dark") {
    return {
      edgeDimStroke: "#64748b",
      labelDimFill: "#94a3b8",
      labelFill: "#f8fafc",
      nodeDimFill: "#30343b",
    }
  }

  return {
    edgeDimStroke: "#94a3b8",
    labelDimFill: "#64748b",
    labelFill: "#172033",
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
  const covered = hasInspector && width > 768 ? Math.min(400, width * 0.4) : 0
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

function getGraphNodeRelationCounts(
  graphView: { edges: readonly GraphViewEdge[] },
  nodeId: string | null
) {
  if (!nodeId) {
    return { edges: 0, nodes: 0 }
  }

  const relatedNodeIds = new Set([nodeId])
  let relatedEdgeCount = 0

  for (const edge of graphView.edges) {
    if (edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId) {
      continue
    }

    relatedEdgeCount += 1
    relatedNodeIds.add(edge.sourceNodeId)
    relatedNodeIds.add(edge.targetNodeId)
  }

  return { edges: relatedEdgeCount, nodes: relatedNodeIds.size }
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
      size="icon"
      type="button"
      variant="ghost"
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
  relatedEdgeCount,
  relatedNodeCount,
  graphView,
  onSelectNode,
  onSelectEdge,
  isLive,
}: {
  node: GraphViewNode
  nodeVisuals: Record<GraphViewNodeKind, GraphDemoNodeVisual>
  onClose: () => void
  onOpenQuickDetail: (
    entity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) => void
  relatedEdgeCount: number
  relatedNodeCount: number
  graphView: GraphViewResponse
  onSelectNode: (id: string) => void
  onSelectEdge: (id: string) => void
  isLive: boolean
}) {
  const {
    dictionary,
    formatMessage,
    formatNumber,
    formatDateTime,
    formatPercent,
  } = useLocalization()
  const visual = nodeVisuals[node.kind]
  const metadata = node.metadata ?? {}
  const relatedEdges = graphView.edges.filter(
    (edge) => edge.sourceNodeId === node.id || edge.targetNodeId === node.id
  )
  const neighbors = graphView.nodes.filter(
    (item) =>
      item.id !== node.id &&
      relatedEdges.some(
        (edge) => edge.sourceNodeId === item.id || edge.targetNodeId === item.id
      )
  )
  const entityId = getGraphViewNodeEntityId(node.id, node.kind)
  const quickDetailEntity =
    entityId !== null && (node.kind === "event" || node.kind === "news-article")
      ? { id: entityId, kind: node.kind }
      : null
  const relationSummary = formatMessage(
    dictionary.graphView.inspector.relationSummary,
    {
      edges: formatNumber(relatedEdgeCount),
      nodes: formatNumber(Math.max(relatedNodeCount - 1, 0)),
    }
  )
  const fields = [
    {
      label: dictionary.graphView.inspector.assetType,
      value: metadata.assetType,
    },
    {
      label: dictionary.graphView.inspector.newsOutlet,
      value: metadata.sourceName,
    },
    {
      label: dictionary.graphView.inspector.narrativeStatus,
      value: metadata.narrativeStatus,
    },
    {
      label: dictionary.graphView.inspector.themes,
      value: metadata.themes
        ?.map((theme) =>
          theme.title
            ? `${theme.title}${theme.relationType ? ` (${getGraphViewRelationLabel(theme.relationType, dictionary)})` : ""}`
            : ""
        )
        .filter(Boolean)
        .join(", "),
    },
    node.kind === "event"
      ? {
          label: dictionary.graphView.inspector.time,
          value: metadata.occurredAt
            ? formatDateTime(
                metadata.occurredAt,
                { day: "2-digit", month: "2-digit", year: "numeric" },
                dictionary.common.notAvailable
              )
            : null,
        }
      : null,
    node.kind === "news-article"
      ? {
          label: dictionary.graphView.inspector.publishedAt,
          value: metadata.publishedAt
            ? formatDateTime(
                metadata.publishedAt,
                { day: "2-digit", month: "2-digit", year: "numeric" },
                dictionary.common.notAvailable
              )
            : null,
        }
      : null,
    node.kind === "asset"
      ? {
          label: dictionary.graphView.inspector.symbol,
          value: metadata.symbol ?? null,
        }
      : null,
    node.kind === "narrative"
      ? {
          label: dictionary.graphView.inspector.thesis,
          value: metadata.thesis ?? null,
        }
      : null,
    typeof metadata.confidence === "number"
      ? {
          label: dictionary.graphView.inspector.confidence,
          value: formatPercent(
            metadata.confidence <= 1
              ? metadata.confidence
              : metadata.confidence / 100,
            { maximumFractionDigits: 0 }
          ),
        }
      : null,
  ].filter((field): field is { label: string; value: string } =>
    Boolean(field?.value)
  )

  return (
    <aside
      aria-label={dictionary.graphView.demo.selectedNode}
      className="pointer-events-auto absolute inset-x-3 bottom-14 z-20 flex max-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md md:inset-x-auto md:top-16 md:right-4 md:bottom-auto md:max-h-[calc(100%-5rem)] md:w-[22rem]"
      data-testid="graph-demo-inspector"
    >
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
          <h2 className="mt-1 text-sm leading-snug font-semibold break-words">
            {node.label}
          </h2>
          {node.secondaryLabel ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {node.secondaryLabel}
            </p>
          ) : null}
        </div>
        <Button
          aria-label={dictionary.graphView.demo.closeDetails}
          data-testid="graph-demo-close-inspector"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          <X aria-hidden="true" data-icon="inline-start" />
        </Button>
      </div>

      <div className="min-h-0 overflow-y-auto p-3.5">
        {fields.length > 0 ? (
          <dl className="flex flex-col gap-2">
            {fields.map((field) => (
              <div
                className="min-w-0 rounded-lg border border-border/60 bg-background/55 px-2.5 py-2"
                key={field.label}
              >
                <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {field.label}
                </dt>
                <dd className="mt-1 text-xs font-medium break-words text-foreground">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="mt-3 rounded-full border border-border/60 bg-background/45 px-2.5 py-1 text-[11px] text-muted-foreground">
          {relationSummary}
        </p>

        {quickDetailEntity ? (
          <Button
            data-testid="graph-demo-open-quick-detail"
            size="sm"
            type="button"
            variant="secondary"
            onClick={(event) =>
              onOpenQuickDetail(quickDetailEntity, event.currentTarget)
            }
          >
            <ArrowUpRight aria-hidden="true" data-icon="inline-start" />
            {node.kind === "event"
              ? isLive
                ? dictionary.graphView.inspector.readEvent
                : dictionary.graphView.demo.openEvent
              : isLive
                ? dictionary.graphView.inspector.readArticle
                : dictionary.graphView.demo.openArticle}
          </Button>
        ) : null}
        {node.kind === "news-article" &&
        /^https?:\/\//i.test(metadata.url ?? "") ? (
          <a
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={metadata.url!}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden="true" data-icon="inline-start" />
            {dictionary.graphView.inspector.openOriginalSource}
          </a>
        ) : node.kind === "news-article" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {dictionary.graphView.demo.sourceUnavailable}
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-2">
          <h3 className="text-xs font-semibold">
            {dictionary.graphView.inspector.relatedNodes}
          </h3>
          {neighbors.map((neighbor) => (
            <Button
              key={neighbor.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelectNode(neighbor.id)}
            >
              <span className="truncate">
                {nodeVisuals[neighbor.kind].label}: {neighbor.label}
              </span>
            </Button>
          ))}
          <h3 className="text-xs font-semibold">
            {dictionary.graphView.inspector.relatedEdges}
          </h3>
          {relatedEdges.map((edge) => (
            <Button
              key={edge.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelectEdge(edge.id)}
            >
              <span className="truncate">
                {getGraphViewRelationLabel(edge.relationType, dictionary)}:{" "}
                {
                  graphView.nodes.find((item) => item.id === edge.sourceNodeId)
                    ?.label
                }{" "}
                →{" "}
                {
                  graphView.nodes.find((item) => item.id === edge.targetNodeId)
                    ?.label
                }
              </span>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  )
}

function DemoEdgeInspector({
  edge,
  edgeVisuals,
  onClose,
  graphView,
  onSelectNode,
}: {
  edge: GraphViewEdge
  edgeVisuals: Record<string, GraphDemoEdgeVisual>
  onClose: () => void
  graphView: GraphViewResponse
  onSelectNode: (id: string) => void
}) {
  const { dictionary } = useLocalization()
  const visual = edgeVisuals[edge.kind]
  const source = graphView.nodes.find((node) => node.id === edge.sourceNodeId)
  const target = graphView.nodes.find((node) => node.id === edge.targetNodeId)
  const relationLabel = getGraphViewRelationLabel(edge.relationType, dictionary)
  const fields = [
    { label: dictionary.graphView.demo.relation, value: visual.label },
    {
      label: dictionary.graphView.demo.direction,
      value: `${source?.label ?? edge.sourceNodeId} → ${target?.label ?? edge.targetNodeId}`,
    },
    { label: dictionary.graphView.demo.relationMeaning, value: relationLabel },
    edge.note
      ? { label: dictionary.graphView.demo.note, value: edge.note }
      : null,
  ].filter((field): field is { label: string; value: string } =>
    Boolean(field?.value)
  )

  return (
    <aside
      aria-label={dictionary.graphView.demo.selectedEdge}
      className="pointer-events-auto absolute inset-x-3 bottom-14 z-20 flex max-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md md:inset-x-auto md:top-16 md:right-4 md:bottom-auto md:max-h-[calc(100%-5rem)] md:w-[22rem]"
      data-testid="graph-demo-edge-inspector"
    >
      <div className="flex items-start gap-3 border-b border-border/70 px-3.5 py-3">
        <span
          aria-hidden="true"
          className="mt-1 size-3.5 shrink-0 rounded-full shadow-sm"
          style={{ backgroundColor: visual?.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {dictionary.graphView.demo.selectedEdge}
          </p>
          <h2 className="mt-1 line-clamp-2 text-sm leading-snug font-semibold">
            {relationLabel}
          </h2>
        </div>
        <Button
          aria-label={dictionary.graphView.demo.closeDetails}
          data-testid="graph-demo-close-edge-inspector"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          <X aria-hidden="true" data-icon="inline-start" />
        </Button>
      </div>

      <dl className="flex min-h-0 flex-col gap-2 overflow-y-auto p-3.5">
        {fields.map((field) => (
          <div
            className="min-w-0 rounded-lg border border-border/60 bg-background/55 px-2.5 py-2"
            key={field.label}
          >
            <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {field.label}
            </dt>
            <dd className="mt-1 text-xs font-medium break-words text-foreground">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2 p-3.5">
        {[source, target].map((node) =>
          node ? (
            <Button
              variant="outline"
              key={node.id}
              className="max-w-full"
              onClick={() => onSelectNode(node.id)}
            >
              <span className="truncate">{node.label}</span>
            </Button>
          ) : null
        )}
      </div>
    </aside>
  )
}

export function SigmaGraphViewDemo({
  initialEdgeCount = 400,
  graphView: liveGraphView,
}: {
  initialEdgeCount?: GraphViewDemoEdgeCount
  graphView?: GraphViewResponse
}) {
  const localization = useLocalization()
  const { dictionary, formatMessage, formatNumber, locale } = localization
  const { resolvedTheme } = useTheme()
  const [edgeCount, setEdgeCount] = useState(initialEdgeCount)
  const [layoutStatus, setLayoutStatus] =
    useState<GraphDemoLayoutStatus>("seed")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [quickDetailEntity, setQuickDetailEntity] =
    useState<LocalQuickDetailEntity | null>(null)
  const [renderError, setRenderError] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sigmaRef = useRef<Sigma<
    GraphViewDemoNodeAttributes,
    GraphViewDemoEdgeAttributes
  > | null>(null)
  const graphRef = useRef<GraphViewDemoGraph | null>(null)
  const layoutRef = useRef<ReturnType<typeof createD3Layout> | null>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  const selectedEdgeIdRef = useRef<string | null>(null)
  const hoveredNodeIdRef = useRef<string | null>(null)
  const activeNodesRef = useRef<Set<string>>(new Set())
  const activeEdgesRef = useRef<Set<string>>(new Set())
  const savedViewRef = useRef<{
    positions: Record<string, GraphViewDemoPosition>
    camera: { x: number; y: number; angle: number; ratio: number }
    settled: boolean
    bbox: ReturnType<Sigma["getBBox"]>
  } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const draggedNodeIdRef = useRef<string | null>(null)
  const draggedNodeMovedRef = useRef(false)
  const frozenLabelsRef = useRef<Set<string> | null>(null)
  const quickDetailReturnFocusRef = useRef<HTMLElement | null>(null)
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
      sigma.setSetting("labelColor", { color: graphPalette.labelFill })
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
  const selectedNodeRelationCounts = useMemo(
    () => getGraphNodeRelationCounts(graphView, selectedNodeId),
    [graphView, selectedNodeId]
  )
  const quickDetailFixture = useMemo(
    () =>
      !liveGraphView && selectedNode
        ? getDemoQuickDetailFixture(selectedNode, locale)
        : null,
    [liveGraphView, locale, selectedNode]
  )
  const layoutStatusLabel = getDemoStatusLabel(layoutStatus, dictionary)

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
        sigma.getNodeDisplayedLabels().size
      )
      container.dataset.renderedLabelIds = JSON.stringify(
        [...sigma.getNodeDisplayedLabels()].sort()
      )
      container.dataset.labelsFrozen = String(frozenLabelsRef.current !== null)
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
    frozenLabelsRef.current = null
    dragStartRef.current = null
    hoveredNodeIdRef.current = null
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

    let initialFitPending = !savedView?.settled
    const finishLayout = () => {
      if (!graph || isDisposed) return

      if (frozenLabelsRef.current) {
        frozenLabelsRef.current = null
        hoveredNodeIdRef.current = null
        updateFocus(selectedNodeIdRef.current, selectedEdgeIdRef.current)
      }

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
      graphRef.current = layoutGraph

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
        labelColor: { color: paletteRef.current.labelFill },
        defaultDrawEdgeLabel: (context, edge, source, target, settings) =>
          drawStraightEdgeLabel(context, edge, source, target, {
            ...settings,
            edgeLabelSize:
              sigma?.scaleSize(settings.edgeLabelSize) ??
              settings.edgeLabelSize,
          }),
        defaultDrawNodeLabel: (context, data) => {
          if (!data.label) return
          const scale = sigma?.scaleSize(1) ?? 1
          context.font = `600 ${11 * scale}px Geist, sans-serif`
          context.textBaseline = "middle"
          let label = data.label
          while (
            label.length > 1 &&
            context.measureText(label).width > 220 * scale
          )
            label = label.slice(0, -1)
          if (label !== data.label) label += "…"
          context.fillStyle = paletteRef.current.labelFill
          context.fillText(label, data.x + data.size + 9 * scale, data.y)
        },
        defaultDrawNodeHover: (context, data) => {
          context.strokeStyle = paletteRef.current.labelFill
          context.lineWidth = 2
          context.beginPath()
          context.arc(data.x, data.y, data.size + 2, 0, Math.PI * 2)
          context.stroke()
        },
        labelDensity: 0.6,
        labelFont: "Geist, sans-serif",
        labelRenderedSizeThreshold: 0,
        labelSize: 11,
        labelWeight: "600",
        maxCameraRatio: GRAPH_DEMO_ZOOM_RANGE[1],
        minCameraRatio: GRAPH_DEMO_ZOOM_RANGE[0],
        nodeReducer: (node, data) => {
          const frozenLabels = frozenLabelsRef.current
          const labelOverride = frozenLabels
            ? {
                label: frozenLabels.has(node) ? data.label : null,
                forceLabel: frozenLabels.has(node),
              }
            : {}
          const hasFocus =
            activeNodesRef.current.size > 0 || activeEdgesRef.current.size > 0
          const isActive = activeNodesRef.current.has(node)
          const isFocused =
            node === selectedNodeIdRef.current ||
            node === hoveredNodeIdRef.current

          if (!hasFocus) {
            return {
              ...data,
              forceLabel: data.kind === "asset",
              highlighted: false,
              label: data.kind === "news-article" ? null : data.label,
              ...labelOverride,
            }
          }

          if (isActive) {
            return {
              ...data,
              forceLabel: isFocused,
              highlighted: isFocused,
              label: data.label,
              zIndex: isFocused ? 3 : 2,
              ...labelOverride,
            }
          }

          return {
            ...data,
            color: paletteRef.current.nodeDimFill,
            forceLabel: false,
            highlighted: false,
            label: null,
            zIndex: 0,
            ...labelOverride,
          }
        },
        edgeReducer: (edge, data) => {
          const hasFocus =
            activeNodesRef.current.size > 0 || activeEdgesRef.current.size > 0
          const isActive = activeEdgesRef.current.has(edge)
          const isSelected = edge === selectedEdgeIdRef.current

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
              forceLabel: isSelected,
              label: isSelected ? data.label : null,
              size: data.size,
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
        renderLabels: true,
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
      sigma.on("afterRender", updateBenchmarkAnchor)
      window.requestAnimationFrame(updateBenchmarkAnchor)

      sigma.setCustomBBox(sigma.getCustomBBox() ?? sigma.getBBox())
      layout = createD3Layout(layoutGraph, finishLayout, () => {
        if (!isDisposed) {
          setRenderError(true)
          setLayoutStatus("error")
        }
      })
      layoutRef.current = layout

      sigma.on("enterNode", ({ node }) => {
        if (
          draggedNodeIdRef.current ||
          frozenLabelsRef.current ||
          selectedNodeIdRef.current ||
          selectedEdgeIdRef.current
        ) {
          return
        }

        hoveredNodeIdRef.current = node
        updateFocus(node, null)
      })
      sigma.on("leaveNode", ({ node }) => {
        if (
          draggedNodeIdRef.current ||
          frozenLabelsRef.current ||
          selectedNodeIdRef.current ||
          selectedEdgeIdRef.current
        )
          return
        if (hoveredNodeIdRef.current !== node) {
          return
        }

        hoveredNodeIdRef.current = null
        updateFocus(null, null)
      })
      sigma.on("clickNode", ({ node, preventSigmaDefault }) => {
        preventSigmaDefault()

        if (draggedNodeMovedRef.current) {
          draggedNodeMovedRef.current = false
          return
        }

        frozenLabelsRef.current = null
        hoveredNodeIdRef.current = null

        if (selectedNodeIdRef.current === node) {
          selectedNodeIdRef.current = null
          setSelectedNodeId(null)
          updateFocus(null, null)
          return
        }

        selectedNodeIdRef.current = node
        selectedEdgeIdRef.current = null
        setSelectedNodeId(node)
        setSelectedEdgeId(null)
        updateFocus(node, null)
      })
      sigma.on("clickEdge", ({ edge, preventSigmaDefault }) => {
        preventSigmaDefault()
        if (draggedNodeMovedRef.current) {
          draggedNodeMovedRef.current = false
          return
        }
        frozenLabelsRef.current = null
        hoveredNodeIdRef.current = null
        selectedNodeIdRef.current = null
        setSelectedNodeId(null)

        if (selectedEdgeIdRef.current === edge) {
          selectedEdgeIdRef.current = null
          setSelectedEdgeId(null)
          updateFocus(null, null)
          return
        }

        selectedEdgeIdRef.current = edge
        setSelectedEdgeId(edge)
        updateFocus(null, edge)
      })
      sigma.on("clickStage", () => {
        if (draggedNodeMovedRef.current) {
          draggedNodeMovedRef.current = false
          return
        }
        frozenLabelsRef.current = null
        hoveredNodeIdRef.current = null
        selectedNodeIdRef.current = null
        selectedEdgeIdRef.current = null
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
        updateFocus(null, null)
      })
      let suppressDoubleClickUntil = 0
      for (const event of [
        "doubleClickNode",
        "doubleClickEdge",
        "doubleClickStage",
      ] as const) {
        sigma.on(
          event,
          ({ preventSigmaDefault }: { preventSigmaDefault: () => void }) => {
            if (Date.now() < suppressDoubleClickUntil) preventSigmaDefault()
          }
        )
      }
      const endDrag = () => {
        if (draggedNodeMovedRef.current)
          suppressDoubleClickUntil = Date.now() + 400
        layout?.release()
        draggedNodeIdRef.current = null
        dragStartRef.current = null
      }
      let grabOffset = { x: 0, y: 0 }
      sigma.on("downNode", ({ node, event }) => {
        if (sigma) {
          const pointer = sigma.viewportToGraph(event)
          grabOffset = {
            x: layoutGraph.getNodeAttribute(node, "x") - pointer.x,
            y: layoutGraph.getNodeAttribute(node, "y") - pointer.y,
          }
        }
        draggedNodeIdRef.current = node
        dragStartRef.current = { x: event.x, y: event.y }
        draggedNodeMovedRef.current = false
      })
      sigma.on("moveBody", ({ event, preventSigmaDefault }) => {
        const node = draggedNodeIdRef.current
        const start = dragStartRef.current
        if (!node || !start || !sigma) return
        if (
          "touches" in event.original &&
          event.original.touches.length !== 1
        ) {
          endDrag()
          return
        }
        preventSigmaDefault()
        if (
          !draggedNodeMovedRef.current &&
          Math.hypot(event.x - start.x, event.y - start.y) < 5
        )
          return
        if (!draggedNodeMovedRef.current) {
          // Freeze membership through the force cooldown, while labels follow nodes.
          frozenLabelsRef.current ??= sigma.getNodeDisplayedLabels()
          frozenLabelsRef.current.add(node)
          refreshFocus()
          initialFitPending = false
          setLayoutStatus("refining")
          draggedNodeMovedRef.current = true
        }
        const position = sigma.viewportToGraph({ x: event.x, y: event.y })
        position.x += grabOffset.x
        position.y += grabOffset.y
        layoutGraph.mergeNodeAttributes(node, { ...position })
        layout?.pin(node, position.x, position.y)
      })
      sigma.on("upNode", endDrag)
      sigma.on("upEdge", endDrag)
      sigma.on("upStage", endDrag)
      sigma.on("downStage", () => {
        initialFitPending = false
        draggedNodeMovedRef.current = false
      })
      sigma.on("downEdge", () => {
        draggedNodeMovedRef.current = false
      })
      const cancelDrag = () => {
        endDrag()
        draggedNodeMovedRef.current = false
      }
      container.addEventListener("touchcancel", cancelDrag)
      window.addEventListener("blur", cancelDrag)

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
        resizeObserver.disconnect()
        container.removeEventListener("touchcancel", cancelDrag)
        window.removeEventListener("blur", cancelDrag)
        if (graph && sigma)
          savedViewRef.current = {
            settled: !layout?.isRunning(),
            positions: getGraphPositions(graph),
            camera: sigma.getCamera().getState(),
            bbox: sigma.getCustomBBox() ?? sigma.getBBox(),
          }

        layout?.kill()
        sigma?.kill()

        if (layoutRef.current === layout) {
          layoutRef.current = null
        }
        if (sigmaRef.current === sigma) {
          sigmaRef.current = null
        }
        if (graphRef.current === graph) {
          graphRef.current = null
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

      if (layoutRef.current === layout) {
        layoutRef.current = null
      }
      if (sigmaRef.current === sigma) {
        sigmaRef.current = null
      }
      if (graphRef.current === graph) {
        graphRef.current = null
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
    const sigma = sigmaRef.current

    if (!sigma) {
      return
    }

    fitSigmaGraph(
      sigma,
      !!(selectedNodeIdRef.current || selectedEdgeIdRef.current)
    )
  }

  const handleReLayout = () => {
    const graph = graphRef.current
    const layout = layoutRef.current

    if (!graph || !layout) {
      return
    }

    const seedPositions = createGraphViewDemoSeedPositions(graphView.nodes)

    graph.updateEachNodeAttributes((node, attributes) => ({
      ...attributes,
      fixed: false,
      x: seedPositions[node]?.x ?? attributes.x,
      y: seedPositions[node]?.y ?? attributes.y,
    }))
    selectedNodeIdRef.current = null
    selectedEdgeIdRef.current = null
    hoveredNodeIdRef.current = null
    frozenLabelsRef.current = null
    activeNodesRef.current = new Set()
    activeEdgesRef.current = new Set()
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setQuickDetailEntity(null)
    setLayoutStatus("refining")

    layout.start()
  }

  const handleEdgePresetChange = (nextEdgeCount: GraphViewDemoEdgeCount) => {
    if (nextEdgeCount === edgeCount) {
      return
    }

    setEdgeCount(nextEdgeCount)
  }

  const handleOpenQuickDetail = (
    entity: LocalQuickDetailEntity,
    trigger: HTMLElement
  ) => {
    quickDetailReturnFocusRef.current = trigger
    setQuickDetailEntity(entity)
  }

  const statusIsBlocking = layoutStatus === "unsupported" || renderError

  const selectItem = (nodeId: string | null, edgeId: string | null) => {
    const graph = graphRef.current
    if (!graph) return
    selectedNodeIdRef.current = nodeId
    selectedEdgeIdRef.current = edgeId
    hoveredNodeIdRef.current = null
    frozenLabelsRef.current = null
    setSelectedNodeId(nodeId)
    setSelectedEdgeId(edgeId)
    const focused = getFocusedGraphParts(graph, nodeId, edgeId)
    activeNodesRef.current = focused.nodes
    activeEdgesRef.current = focused.edges
    const sigma = sigmaRef.current
    sigma?.scheduleRefresh()
    const targetId = nodeId ?? (edgeId ? graph.source(edgeId) : null)
    if (sigma && targetId) {
      const data = sigma.getNodeDisplayData(targetId)
      if (data) {
        const { width, height } = sigma.getDimensions()
        const destination = sigma.viewportToFramedGraph({
          x: width > 768 ? width * 0.3 : width * 0.5,
          y: height * 0.3,
        })
        const camera = sigma.getCamera()
        const current = camera.getState()
        void camera
          .animate(
            {
              x: current.x + data.x - destination.x,
              y: current.y + data.y - destination.y,
            },
            { duration: getMotionDuration(180) }
          )
          .catch(() => undefined)
      }
    }
  }

  return (
    <section
      className="relative h-[calc(100svh-6.5rem)] min-h-[36rem] w-full max-w-full overflow-hidden rounded-xl border bg-card shadow-sm"
      data-engine="sigma"
      data-fixture-version={
        liveGraphView ? undefined : GRAPH_VIEW_DEMO_FIXTURE_VERSION
      }
      data-layout-status={layoutStatus}
      data-layout-version={GRAPH_VIEW_DEMO_LAYOUT_VERSION}
      data-testid="graph-view-sigma-demo"
    >
      <div
        aria-hidden={statusIsBlocking}
        className={cn(
          "size-full min-h-[36rem] max-w-full",
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

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
        <div className="pointer-events-auto max-w-[min(100%,34rem)] min-w-0">
          <h1 className="mt-1 max-w-[min(70vw,32rem)] truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {dictionary.graphView.demo.title}
          </h1>
        </div>

        <div className="pointer-events-auto flex max-w-[min(100%,34rem)] flex-wrap items-center justify-end gap-1.5">
          {GRAPH_DEMO_NODE_KIND_ORDER.map((kind) => (
            <Badge
              className={nodeVisuals[kind].chipClassName}
              key={kind}
              variant="outline"
            >
              {nodeVisuals[kind].label}{" "}
              {formatNumber(
                graphView.nodes.filter((node) => node.kind === kind).length
              )}
            </Badge>
          ))}
        </div>
      </div>

      <div className="absolute top-20 left-3 z-10 w-56 max-w-[calc(100%-5rem)] sm:top-16 sm:left-4">
        <Select
          value={selectedNodeId ?? ""}
          onValueChange={(id) => {
            if (id) selectItem(id, null)
          }}
        >
          <SelectTrigger
            aria-label={dictionary.graphView.demo.selectNode}
            className="w-full"
            data-testid="graph-demo-node-selector"
          >
            <SelectValue placeholder={dictionary.graphView.demo.selectNode}>
              {selectedNode?.label ?? dictionary.graphView.demo.selectNode}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {graphView.nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {nodeVisuals[node.kind].label}: {node.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="pointer-events-auto absolute top-[5.75rem] right-3 z-10 flex flex-col gap-2 sm:top-16 sm:right-4">
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
        <Button
          aria-label={dictionary.graphView.demo.reLayout}
          data-testid="graph-demo-re-layout"
          size="icon"
          type="button"
          variant="outline"
          onClick={handleReLayout}
        >
          <RefreshCw aria-hidden="true" data-icon="inline-start" />
        </Button>
      </div>

      <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2 sm:inset-x-4 sm:bottom-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
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
          </div>

          {!liveGraphView ? (
            <div
              aria-label={dictionary.graphView.demo.density}
              className="flex flex-wrap justify-end gap-1.5"
              data-testid="graph-demo-density-controls"
              role="group"
            >
              {GRAPH_VIEW_DEMO_EDGE_COUNTS.map((preset) => {
                const label = formatMessage(
                  dictionary.graphView.demo.edgePreset,
                  {
                    edges: formatNumber(preset),
                  }
                )

                return (
                  <Button
                    aria-pressed={preset === edgeCount}
                    data-edge-count={preset}
                    data-testid={`graph-demo-density-${preset}`}
                    key={preset}
                    size="sm"
                    type="button"
                    variant={preset === edgeCount ? "secondary" : "outline"}
                    onClick={() => handleEdgePresetChange(preset)}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span data-testid="graph-demo-layout-status">
            {layoutStatusLabel}
          </span>
          <span>
            {dictionary.graphView.demo.layoutVersion.replace(
              "{version}",
              GRAPH_VIEW_DEMO_LAYOUT_VERSION
            )}
          </span>
        </div>
      </div>

      {selectedNode ? (
        <DemoNodeInspector
          graphView={graphView}
          isLive={Boolean(liveGraphView)}
          onSelectNode={(id) => selectItem(id, null)}
          onSelectEdge={(id) => selectItem(null, id)}
          node={selectedNode}
          nodeVisuals={nodeVisuals}
          onClose={() => {
            selectedNodeIdRef.current = null
            setSelectedNodeId(null)
            activeNodesRef.current = new Set()
            activeEdgesRef.current = new Set()
            sigmaRef.current?.scheduleRefresh({
              layoutUnchange: true,
              partialGraph: {
                edges: graphRef.current?.edges() ?? [],
                nodes: graphRef.current?.nodes() ?? [],
              },
            })
          }}
          onOpenQuickDetail={handleOpenQuickDetail}
          relatedEdgeCount={selectedNodeRelationCounts.edges}
          relatedNodeCount={selectedNodeRelationCounts.nodes}
        />
      ) : selectedEdge ? (
        <DemoEdgeInspector
          graphView={graphView}
          onSelectNode={(id) => selectItem(id, null)}
          edge={selectedEdge}
          edgeVisuals={edgeVisuals}
          onClose={() => {
            selectedEdgeIdRef.current = null
            setSelectedEdgeId(null)
            activeNodesRef.current = new Set()
            activeEdgesRef.current = new Set()
            sigmaRef.current?.scheduleRefresh({
              layoutUnchange: true,
              partialGraph: {
                edges: graphRef.current?.edges() ?? [],
                nodes: graphRef.current?.nodes() ?? [],
              },
            })
          }}
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
