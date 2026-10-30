import { describe, expect, it } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import { graphViewResponseSchema } from "@/app/lib/graph-view/definitions"
import {
  createGraphViewDemoFixture,
  createGraphViewDemoGraph,
  createGraphViewDemoSeedPositions,
  getGraphViewDemoEdgeCount,
} from "@/app/lib/graph-view/demo-fixture"
import {
  GRAPH_VIEW_DEMO_EDGE_COUNTS,
  GRAPH_VIEW_DEMO_FIXTURE_VERSION,
  GRAPH_VIEW_DEMO_LAYOUT_VERSION,
} from "@/app/lib/graph-view/demo-fixture"
import {
  getGraphViewDemoLayoutCacheKey,
  readGraphViewDemoLayoutCache,
  writeGraphViewDemoLayoutCache,
  type GraphViewDemoLayoutStorage,
} from "@/app/lib/graph-view/demo-layout-cache"
import {
  getGraphViewEdgeVisuals,
  getGraphViewNodeVisuals,
} from "@/app/[lang]/(main)/graph-view/graph-view-visuals"

function createStorage() {
  const entries = new Map<string, string>()

  return {
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    removeItem(key: string) {
      entries.delete(key)
    },
    setItem(key: string, value: string) {
      entries.set(key, value)
    },
  } satisfies GraphViewDemoLayoutStorage
}

describe("graph view demo fixture", () => {
  it("creates a deterministic 100-node fixture for each density", () => {
    for (const edgeCount of GRAPH_VIEW_DEMO_EDGE_COUNTS) {
      const first = createGraphViewDemoFixture(edgeCount, "en")
      const second = createGraphViewDemoFixture(edgeCount, "en")

      expect(first).toEqual(second)
      expect(first.nodes).toHaveLength(100)
      expect(first.edges).toHaveLength(edgeCount)
      expect(new Set(first.nodes.map((node) => node.kind)).size).toBe(4)
      expect(first.nodes.filter((node) => node.kind === "event")).toHaveLength(
        25
      )
      expect(
        first.edges.every((edge) => edge.sourceNodeId !== edge.targetNodeId)
      ).toBe(true)
    }
  })

  it("preserves directed multi-edge graph identity", () => {
    const graphView = createGraphViewDemoFixture(400, "en")
    const positions = createGraphViewDemoSeedPositions(graphView.nodes)
    const graph = createGraphViewDemoGraph({
      dictionary: en,
      edgeVisuals: getGraphViewEdgeVisuals(en),
      graphView,
      nodeVisuals: getGraphViewNodeVisuals(en),
      positions,
    })

    expect(graph.order).toBe(100)
    expect(graph.size).toBe(400)
    expect(graph.type).toBe("directed")
    expect(graph.multi).toBe(true)
    expect(graph.hasEdge("demo-edge-1")).toBe(true)
    expect(graph.source("demo-edge-1")).toBe(graphView.edges[0]?.sourceNodeId)
    expect(graph.target("demo-edge-1")).toBe(graphView.edges[0]?.targetNodeId)
    for (const node of graphView.nodes) {
      expect(graph.getNodeAttribute(node.id, "size") * 2).toBe(
        getGraphViewNodeVisuals(en)[node.kind].size
      )
    }
  })

  it("seeds real IDs independently of database numbering and accepts nullable labels", () => {
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
    const graphView = graphViewResponseSchema.parse({
      nodes: [
        {
          id: "event:10001",
          kind: "event",
          label: "First",
          secondaryLabel: null,
          metadata,
        },
        {
          id: "event:10026",
          kind: "event",
          label: "Second",
          secondaryLabel: null,
          metadata: { ...metadata, confidence: null, themes: null },
        },
      ],
      edges: [],
    })
    const positions = createGraphViewDemoSeedPositions(graphView.nodes)
    expect(positions["event:10001"].x).toBeGreaterThan(0)
    expect(positions["event:10026"].x).toBeLessThan(0)
    expect(() =>
      graphViewResponseSchema.parse({
        nodes: [{ id: "bad", kind: "invented", label: "Bad" }],
        edges: [],
      })
    ).toThrow()
  })

  it("normalizes unknown edge counts to the standard preset", () => {
    expect(getGraphViewDemoEdgeCount("100")).toBe(100)
    expect(getGraphViewDemoEdgeCount("unknown")).toBe(400)
    expect(getGraphViewDemoEdgeCount(undefined)).toBe(400)
  })
})

describe("graph view demo layout cache", () => {
  it("round-trips positions and rejects stale or malformed entries", () => {
    const storage = createStorage()
    const nodes = createGraphViewDemoFixture(100, "en").nodes
    const nodeIds = nodes.map((node) => node.id)
    const positions = createGraphViewDemoSeedPositions(nodes)

    expect(
      writeGraphViewDemoLayoutCache(100, nodeIds, positions, storage)
    ).toBe(true)
    expect(readGraphViewDemoLayoutCache(100, nodeIds, storage)).toEqual(
      positions
    )

    storage.setItem(
      getGraphViewDemoLayoutCacheKey(100),
      JSON.stringify({
        edgeCount: 100,
        fixtureVersion: "old",
        layoutVersion: GRAPH_VIEW_DEMO_LAYOUT_VERSION,
        positions,
      })
    )
    expect(readGraphViewDemoLayoutCache(100, nodeIds, storage)).toBeNull()

    storage.setItem(
      getGraphViewDemoLayoutCacheKey(100),
      JSON.stringify({
        edgeCount: 100,
        fixtureVersion: GRAPH_VIEW_DEMO_FIXTURE_VERSION,
        layoutVersion: GRAPH_VIEW_DEMO_LAYOUT_VERSION,
        positions: { [nodeIds[0] ?? "missing"]: { x: "bad", y: 0 } },
      })
    )
    expect(readGraphViewDemoLayoutCache(100, nodeIds, storage)).toBeNull()
  })
})
