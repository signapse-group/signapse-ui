import type {
  GraphViewNodeKind,
  GraphViewResponse,
} from "@/app/lib/graph-view/definitions"

export const GRAPH_VIEW_NODE_KIND_ORDER = [
  "event",
  "asset",
  "news-article",
  "narrative",
] as const satisfies readonly GraphViewNodeKind[]

export function toggleGraphViewNodeKind(
  enabledKinds: ReadonlySet<GraphViewNodeKind>,
  kind: GraphViewNodeKind
) {
  const next = new Set(enabledKinds)
  if (next.has(kind)) next.delete(kind)
  else next.add(kind)
  return next
}

export function filterGraphViewByNodeKind(
  graphView: GraphViewResponse,
  enabledKinds: ReadonlySet<GraphViewNodeKind>
): GraphViewResponse {
  const nodes = graphView.nodes.filter((node) => enabledKinds.has(node.kind))
  const visibleNodeIds = new Set(nodes.map((node) => node.id))
  const edges = graphView.edges.filter(
    (edge) =>
      visibleNodeIds.has(edge.sourceNodeId) &&
      visibleNodeIds.has(edge.targetNodeId)
  )

  return { nodes, edges }
}
