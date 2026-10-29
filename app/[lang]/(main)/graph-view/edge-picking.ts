type Point = { x: number; y: number }
export type PickNode = Point & { radius: number }

export function pickGraphEdges(
  point: Point,
  nodes: ReadonlyMap<string, PickNode>,
  edges: readonly { id: string; sourceNodeId: string; targetNodeId: string }[],
  tolerance = 8
): string[] {
  // Node circles win even when an edge's wider hit area overlaps them.
  for (const node of nodes.values())
    if (Math.hypot(point.x - node.x, point.y - node.y) <= node.radius) return []
  const hits: { id: string; distance: number }[] = []
  for (const edge of edges) {
    const source = nodes.get(edge.sourceNodeId)
    const target = nodes.get(edge.targetNodeId)
    if (!source || !target) continue
    const dx = target.x - source.x,
      dy = target.y - source.y
    const length = dx * dx + dy * dy
    if (!length) continue
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - source.x) * dx + (point.y - source.y) * dy) / length
      )
    )
    const next = Math.hypot(
      point.x - source.x - t * dx,
      point.y - source.y - t * dy
    )
    if (next <= tolerance) hits.push({ id: edge.id, distance: next })
  }
  return hits
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
    .map(({ id }) => id)
}
