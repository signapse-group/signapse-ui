import type { GraphViewNodeKind } from "@/app/lib/graph-view/definitions"

export type LabelBox = { x: number; y: number; width: number; height: number }
export type NodeLabelSide = "right" | "left" | "above" | "below"
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
  side: NodeLabelSide
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
  viewport: { width: number; height: number; scale: number },
  obstacles: readonly LabelBox[] = []
): PlacedNodeLabel[] {
  return [...candidates]
    .sort((a, b) => a.priority - b.priority)
    .flatMap((candidate): PlacedNodeLabel[] => {
      const width = candidate.textWidth * viewport.scale
      const height = 14 * viewport.scale
      const gap = 9 * viewport.scale
      const positions: Record<NodeLabelSide, LabelBox> = {
        right: {
          x: candidate.x + candidate.radius + gap,
          y: candidate.y - height / 2,
          width,
          height,
        },
        left: {
          x: candidate.x - candidate.radius - gap - width,
          y: candidate.y - height / 2,
          width,
          height,
        },
        above: {
          x: candidate.x - width / 2,
          y: candidate.y - candidate.radius - gap - height,
          width,
          height,
        },
        below: {
          x: candidate.x - width / 2,
          y: candidate.y + candidate.radius + gap,
          width,
          height,
        },
      }
      const rightLabel = positions.right
      const rightLabelCovered = obstacles.some(
        (obstacle) =>
          rightLabel.x < obstacle.x + obstacle.width &&
          rightLabel.x + rightLabel.width > obstacle.x &&
          rightLabel.y < obstacle.y + obstacle.height &&
          rightLabel.y + rightLabel.height > obstacle.y
      )
      const sides: NodeLabelSide[] = rightLabelCovered
        ? ["left", "above", "below"]
        : ["right"]
      const side = sides.find((placement) => {
        const box = positions[placement]
        const visible =
          box.x < viewport.width &&
          box.x + box.width > 0 &&
          box.y < viewport.height &&
          box.y + box.height > 0
        const clear = obstacles.every(
          (obstacle) =>
            box.x + box.width <= obstacle.x ||
            box.x >= obstacle.x + obstacle.width ||
            box.y + box.height <= obstacle.y ||
            box.y >= obstacle.y + obstacle.height
        )
        return visible && clear
      })
      if (!side) return []
      return [
        {
          id: candidate.id,
          text: candidate.text,
          priority: candidate.priority,
          side,
          ...positions[side],
        },
      ]
    })
    .filter((box) => box.text)
}
