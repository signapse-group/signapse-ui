import { describe, expect, it } from "vitest"

import type {
  GraphViewNode,
  GraphViewNodeKind,
  GraphViewResponse,
} from "@/app/lib/graph-view/definitions"
import {
  filterGraphViewByNodeKind,
  GRAPH_VIEW_NODE_KIND_ORDER,
  toggleGraphViewNodeKind,
} from "@/app/[lang]/(main)/graph-view/graph-view-node-filter"

const metadata = {
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

function node(id: string, kind: GraphViewNodeKind): GraphViewNode {
  return { id, kind, label: id, secondaryLabel: null, metadata }
}

function edge(
  id: string,
  kind: GraphViewResponse["edges"][number]["kind"],
  sourceNodeId: string,
  targetNodeId: string
): GraphViewResponse["edges"][number] {
  return {
    id,
    kind,
    sourceNodeId,
    targetNodeId,
    relationType: "PRIMARY",
    weight: null,
    confidence: null,
    note: null,
  }
}

const graphView: GraphViewResponse = {
  nodes: [
    node("asset:1", "asset"),
    node("asset:standalone", "asset"),
    node("narrative:1", "narrative"),
    node("event:1", "event"),
    node("news-article:1", "news-article"),
  ],
  edges: [
    edge("narrative-event", "narrative-event", "narrative:1", "event:1"),
    edge("narrative-asset", "narrative-asset", "narrative:1", "asset:1"),
    edge("article-event", "news-article-event", "news-article:1", "event:1"),
  ],
}

describe("Graph View node filters", () => {
  it("filters node kinds independently and keeps only source edges with visible endpoints", () => {
    let enabled = new Set(GRAPH_VIEW_NODE_KIND_ORDER)
    enabled = toggleGraphViewNodeKind(enabled, "narrative")

    const filtered = filterGraphViewByNodeKind(graphView, enabled)

    expect(filtered.nodes.map((item) => item.id)).toEqual([
      "asset:1",
      "asset:standalone",
      "event:1",
      "news-article:1",
    ])
    expect(filtered.edges.map((item) => item.id)).toEqual(["article-event"])
    expect(filtered.edges).not.toContainEqual(
      expect.objectContaining({
        sourceNodeId: "asset:1",
        targetNodeId: "event:1",
      })
    )
  })

  it("restores the source nodes and edges when a hidden kind is re-enabled", () => {
    const hiddenNarrative = toggleGraphViewNodeKind(
      new Set(GRAPH_VIEW_NODE_KIND_ORDER),
      "narrative"
    )
    const restored = toggleGraphViewNodeKind(hiddenNarrative, "narrative")

    expect(filterGraphViewByNodeKind(graphView, restored)).toEqual(graphView)
  })

  it("supports all types off and restores a type without refetching source data", () => {
    const allOff = GRAPH_VIEW_NODE_KIND_ORDER.reduce(
      (enabled, kind) => toggleGraphViewNodeKind(enabled, kind),
      new Set(GRAPH_VIEW_NODE_KIND_ORDER)
    )

    expect(filterGraphViewByNodeKind(graphView, allOff)).toEqual({
      nodes: [],
      edges: [],
    })
    expect(
      filterGraphViewByNodeKind(
        graphView,
        toggleGraphViewNodeKind(allOff, "asset")
      ).nodes.map((item) => item.id)
    ).toEqual(["asset:1", "asset:standalone"])
  })
})
