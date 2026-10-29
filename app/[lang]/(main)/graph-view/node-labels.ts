import type { GraphViewNodeKind } from "@/app/lib/graph-view/definitions"

export type LabelBox = { x: number; y: number; width: number; height: number }
export type NodeLabelCandidate = {
  id: string
  text: string
  textWidth: number
  x: number
  y: number
  radius: number
  priority: number
}
export type PlacedNodeLabel = LabelBox & {
  id: string
  text: string
  side: "right"
  priority: number
}

export function getNodeLabelPriority(
  id: string,
  kind: GraphViewNodeKind,
  state: {
    selected: string | null
    dragged: string | null
    hovered: string | null
    edgeEndpoints: ReadonlySet<string>
    active: ReadonlySet<string>
  }
): number | null {
  if (id === state.selected || id === state.dragged) return 0
  if (state.edgeEndpoints.has(id)) return 1
  if (id === state.hovered) return 2
  if (state.active.has(id)) return 3
  return kind === "news-article" ? null : kind === "asset" ? 4 : 5
}

export function measureNodeLabel(
  label: string,
  measure: (text: string) => number
) {
  const text = label.trim()
  if (measure(text) <= 220) return { text, width: measure(text) }
  const characters = Array.from(text)
  let low = 0
  let high = characters.length
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (measure(characters.slice(0, middle).join("") + "…") <= 220) low = middle
    else high = middle - 1
  }
  const shortened = characters.slice(0, low).join("") + "…"
  return { text: shortened, width: measure(shortened) }
}

export function placeNodeLabels(
  candidates: readonly NodeLabelCandidate[],
  viewport: { width: number; height: number; scale: number }
): PlacedNodeLabel[] {
  return [...candidates]
    .sort((a, b) => a.priority - b.priority)
    .map((candidate): PlacedNodeLabel => ({
      id: candidate.id,
      text: candidate.text,
      priority: candidate.priority,
      side: "right",
      width: candidate.textWidth * viewport.scale,
      height: 14 * viewport.scale,
      x: candidate.x + candidate.radius + 9 * viewport.scale,
      y: candidate.y - 7 * viewport.scale,
    }))
    .filter(
      (box) =>
        box.text &&
        box.x < viewport.width &&
        box.x + box.width > 0 &&
        box.y < viewport.height &&
        box.y + box.height > 0
    )
}
