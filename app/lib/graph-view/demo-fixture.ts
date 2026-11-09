import { MultiDirectedGraph } from "graphology"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

import {
  getGraphViewRelationLabel,
  type GraphViewEdge,
  type GraphViewEdgeRelationType,
  type GraphViewEdgeKind,
  type GraphViewAssetType,
  type GraphViewNode,
  type GraphViewNodeKind,
  type GraphViewNodeMetadata,
  type GraphViewResponse,
} from "./definitions"

export const GRAPH_VIEW_DEMO_EDGE_COUNTS = [100, 400, 1000] as const
export const GRAPH_VIEW_DEMO_FIXTURE_VERSION = "v1"
export const GRAPH_VIEW_DEMO_LAYOUT_VERSION = "d3-force-v2"
export const GRAPH_VIEW_DEMO_NODE_COUNT = 100
export const GRAPH_VIEW_DEMO_NODES_PER_KIND = 25

export type GraphViewDemoEdgeCount =
  (typeof GRAPH_VIEW_DEMO_EDGE_COUNTS)[number]

export type GraphViewDemoPosition = {
  x: number
  y: number
}

export type GraphViewDemoNodeAttributes = {
  [key: string]: unknown
  color: string
  fixed: boolean
  kind: GraphViewNodeKind
  label: string
  metadata: GraphViewNodeMetadata
  secondaryLabel: string | null
  size: number
  x: number
  y: number
}

export type GraphViewDemoEdgeAttributes = {
  [key: string]: unknown
  color: string
  confidence: number | null
  kind: GraphViewEdgeKind
  label: string
  note: string | null
  relationType: GraphViewEdgeRelationType
  size: number
  type: "arrow"
  sourceNodeId: string
  targetNodeId: string
  weight: number | null
}

export type GraphViewDemoGraph = MultiDirectedGraph<
  GraphViewDemoNodeAttributes,
  GraphViewDemoEdgeAttributes
>

const GRAPH_VIEW_DEMO_NODE_KINDS = [
  "event",
  "asset",
  "news-article",
  "narrative",
] as const satisfies readonly GraphViewNodeKind[]

const GRAPH_VIEW_DEMO_EDGE_BLUEPRINTS = [
  {
    edgeKind: "event-asset",
    relationTypes: ["PRIMARY_SUBJECT", "AFFECTED_ASSET", "REFERENCE_ASSET"],
    sourceKind: "event",
    targetKind: "asset",
  },
  {
    edgeKind: "news-article-event",
    relationTypes: ["PRIMARY", "SUPPORTING", "UPDATE", "CONTRADICTING"],
    sourceKind: "news-article",
    targetKind: "event",
  },
  {
    edgeKind: "narrative-event",
    relationTypes: ["DRIVER", "SUPPORTING", "CONTRADICTING"],
    sourceKind: "narrative",
    targetKind: "event",
  },
  {
    edgeKind: "narrative-asset",
    relationTypes: ["PRIMARY", "AFFECTED"],
    sourceKind: "narrative",
    targetKind: "asset",
  },
] as const satisfies ReadonlyArray<{
  edgeKind: GraphViewEdgeKind
  relationTypes: readonly GraphViewEdgeRelationType[]
  sourceKind: GraphViewNodeKind
  targetKind: GraphViewNodeKind
}>

const GRAPH_VIEW_DEMO_ASSET_TYPES = [
  "EQUITY",
  "ETF",
  "CRYPTO",
  "FX",
  "INDEX",
  "COMMODITY",
] as const satisfies readonly GraphViewAssetType[]

function localized(locale: AppLocale, vietnamese: string, english: string) {
  return locale === "vi" ? vietnamese : english
}

function getNodeId(kind: GraphViewNodeKind, index: number) {
  const offset =
    kind === "event"
      ? 0
      : kind === "asset"
        ? 100
        : kind === "news-article"
          ? 200
          : 300

  return `${kind}:${offset + index + 1}`
}

function getDemoTimestamp(index: number) {
  return new Date(Date.UTC(2026, 0, 1 + index)).toISOString()
}

function emptyDemoMetadata(): GraphViewNodeMetadata {
  return {
    slug: null,
    canonicalKey: null,
    symbol: null,
    assetType: null,
    sourceName: null,
    url: null,
    occurredAt: null,
    publishedAt: null,
    status: null,
    narrativeStatus: null,
    confidence: null,
    thesis: null,
    themes: null,
  }
}

function createDemoNode(
  kind: GraphViewNodeKind,
  index: number,
  locale: AppLocale
): GraphViewNode {
  const sequence = String(index + 1).padStart(2, "0")
  const entityId = Number(getNodeId(kind, index).split(":")[1])
  const timestamp = getDemoTimestamp(index)

  if (kind === "event") {
    return {
      id: getNodeId(kind, index),
      kind,
      label: localized(
        locale,
        `Sự kiện thị trường ${sequence}`,
        `Market event ${sequence}`
      ),
      secondaryLabel: `EVENT-${String(entityId).padStart(3, "0")}`,
      metadata: {
        ...emptyDemoMetadata(),
        canonicalKey: `DEMO-EVENT-${sequence}`,
        occurredAt: timestamp,
        status: "ENRICHED",
        confidence: 0.62 + (index % 8) / 20,
        themes: [
          {
            relationType: "PRIMARY_THEME",
            title: localized(locale, "Bối cảnh vĩ mô", "Macro context"),
          },
        ],
      },
    }
  }

  if (kind === "asset") {
    const assetType =
      GRAPH_VIEW_DEMO_ASSET_TYPES[index % GRAPH_VIEW_DEMO_ASSET_TYPES.length]

    return {
      id: getNodeId(kind, index),
      kind,
      label: localized(locale, `Tài sản ${sequence}`, `Asset ${sequence}`),
      secondaryLabel: `ASSET-${String(entityId).padStart(3, "0")}`,
      metadata: {
        ...emptyDemoMetadata(),
        assetType,
        symbol: `DEMO${String(entityId).padStart(3, "0")}`,
      },
    }
  }

  if (kind === "news-article") {
    return {
      id: getNodeId(kind, index),
      kind,
      label: localized(
        locale,
        `Bài viết phân tích ${sequence}`,
        `Analysis article ${sequence}`
      ),
      secondaryLabel: `ARTICLE-${String(entityId).padStart(3, "0")}`,
      metadata: {
        ...emptyDemoMetadata(),
        publishedAt: timestamp,
        sourceName: "Signapse Fixture",
        confidence: 0.58 + (index % 9) / 22,
      },
    }
  }

  return {
    id: getNodeId(kind, index),
    kind,
    label: localized(
      locale,
      `Luận điểm thị trường ${sequence}`,
      `Market narrative ${sequence}`
    ),
    secondaryLabel: `NARRATIVE-${String(entityId).padStart(3, "0")}`,
    metadata: {
      ...emptyDemoMetadata(),
      confidence: 0.64 + (index % 7) / 20,
      narrativeStatus: "ACTIVE",
      thesis: localized(
        locale,
        "Bối cảnh thị trường tiếp tục được theo dõi.",
        "Market context remains under observation."
      ),
      themes: [
        {
          relationType: "PRIMARY_THEME",
          title: localized(locale, "Động lượng", "Momentum"),
        },
      ],
    },
  }
}

function createDemoEdge(
  index: number,
  nodesByKind: ReadonlyMap<GraphViewNodeKind, GraphViewNode[]>,
  locale: AppLocale
): GraphViewEdge {
  const blueprint =
    GRAPH_VIEW_DEMO_EDGE_BLUEPRINTS[
      index % GRAPH_VIEW_DEMO_EDGE_BLUEPRINTS.length
    ]
  const sourceNodes = nodesByKind.get(blueprint.sourceKind) ?? []
  const targetNodes = nodesByKind.get(blueprint.targetKind) ?? []
  const sourceIndex = (index * 13 + 3) % sourceNodes.length
  let targetIndex = (index * 17 + 5) % targetNodes.length

  if (
    blueprint.sourceKind === blueprint.targetKind &&
    sourceIndex === targetIndex
  ) {
    targetIndex = (targetIndex + 1) % targetNodes.length
  }

  const source = sourceNodes[sourceIndex]
  const target = targetNodes[targetIndex]
  const relationType =
    blueprint.relationTypes[index % blueprint.relationTypes.length]

  return {
    id: `demo-edge-${index + 1}`,
    kind: blueprint.edgeKind,
    sourceNodeId: source.id,
    targetNodeId: target.id,
    relationType,
    weight: 0.6 + (index % 5) / 10,
    confidence: 0.55 + (index % 10) / 25,
    note: localized(
      locale,
      `Quan hệ fixture ${index + 1}.`,
      `Fixture relationship ${index + 1}.`
    ),
  }
}

export function getGraphViewDemoEdgeCount(
  value: string | number | null | undefined
): GraphViewDemoEdgeCount {
  const normalized = Number(value)

  return GRAPH_VIEW_DEMO_EDGE_COUNTS.includes(
    normalized as GraphViewDemoEdgeCount
  )
    ? (normalized as GraphViewDemoEdgeCount)
    : 400
}

export function createGraphViewDemoFixture(
  edgeCount: GraphViewDemoEdgeCount,
  locale: AppLocale
): GraphViewResponse {
  const nodes = GRAPH_VIEW_DEMO_NODE_KINDS.flatMap((kind) =>
    Array.from({ length: GRAPH_VIEW_DEMO_NODES_PER_KIND }, (_, index) =>
      createDemoNode(kind, index, locale)
    )
  )
  const nodesByKind = new Map<GraphViewNodeKind, GraphViewNode[]>(
    GRAPH_VIEW_DEMO_NODE_KINDS.map((kind) => [
      kind,
      nodes.filter((node) => node.kind === kind),
    ])
  )
  const edges = Array.from({ length: edgeCount }, (_, index) =>
    createDemoEdge(index, nodesByKind, locale)
  )

  return { edges, nodes }
}

export function createGraphViewDemoSeedPositions(
  nodes: readonly GraphViewNode[]
): Record<string, GraphViewDemoPosition> {
  const positions: Record<string, GraphViewDemoPosition> = {}
  const radii: Record<GraphViewNodeKind, number> = {
    asset: 0.42,
    event: 1.05,
    narrative: 0.72,
    "news-article": 1.55,
  }

  const kindCounts = new Map<GraphViewNodeKind, number>()
  const kindIndexes = new Map<GraphViewNodeKind, number>()
  for (const node of nodes)
    kindCounts.set(node.kind, (kindCounts.get(node.kind) ?? 0) + 1)
  for (const [index, node] of nodes.entries()) {
    const indexWithinKind = kindIndexes.get(node.kind) ?? 0
    kindIndexes.set(node.kind, indexWithinKind + 1)
    const angle = (indexWithinKind / kindCounts.get(node.kind)!) * Math.PI * 2
    const radius = radii[node.kind] * 200

    positions[node.id] = {
      x: Math.cos(angle) * radius + (index % 3) * 0.015,
      y: Math.sin(angle) * radius + (index % 5) * 0.012,
    }
  }

  return positions
}

export function createGraphViewDemoGraph({
  dictionary,
  edgeVisuals,
  graphView,
  nodeVisuals,
  positions,
}: {
  dictionary: Dictionary
  edgeVisuals: Record<GraphViewEdgeKind, { color: string; size: number }>
  graphView: GraphViewResponse
  nodeVisuals: Record<GraphViewNodeKind, { color: string; size: number }>
  positions: Readonly<Record<string, GraphViewDemoPosition>>
}): GraphViewDemoGraph {
  const graph = new MultiDirectedGraph<
    GraphViewDemoNodeAttributes,
    GraphViewDemoEdgeAttributes
  >({ allowSelfLoops: false })

  for (const node of graphView.nodes) {
    const position = positions[node.id] ?? { x: 0, y: 0 }
    const visual = nodeVisuals[node.kind]

    graph.addNode(node.id, {
      color: visual.color,
      fixed: false,
      kind: node.kind,
      label: node.label,
      metadata: node.metadata,
      secondaryLabel: node.secondaryLabel,
      // Sigma sizes are radii in CSS pixels at zoom 1.
      size: visual.size / 2,
      x: position.x,
      y: position.y,
    })
  }

  for (const edge of graphView.edges) {
    const visual = edgeVisuals[edge.kind]

    graph.addEdgeWithKey(edge.id, edge.sourceNodeId, edge.targetNodeId, {
      color: visual.color,
      confidence: edge.confidence,
      kind: edge.kind,
      label: getGraphViewRelationLabel(edge.relationType, dictionary),
      note: edge.note,
      relationType: edge.relationType,
      size: visual.size,
      type: "arrow",
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      weight: edge.weight,
    })
  }

  return graph
}
