import type { GraphViewNodeKind } from "@/app/lib/graph-view/definitions"

export type LabelSide = "right" | "left" | "above" | "below"
export type LabelBox = { x: number; y: number; width: number; height: number }
export type NodeLabelCandidate = {
  id: string
  text: string
  textWidth: number
  x: number
  y: number
  radius: number
  priority: number
  required: boolean
}
export type PlacedNodeLabel = LabelBox & {
  id: string
  text: string
  side: LabelSide
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
  if (state.active.size > 0) return state.active.has(id) ? 3 : null
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
  obstacles: readonly LabelBox[],
  viewport: { width: number; height: number; scale: number },
  frozen: ReadonlyMap<string, LabelSide> | null = null,
  previous: ReadonlySet<string> = new Set()
): PlacedNodeLabel[] {
  // Index actual rectangles so nearby labels do not require an all-pairs scan.
  const cells = new Map<string, LabelBox[]>()
  const keys = (box: LabelBox) => {
    const result: string[] = []
    for (
      let x = Math.floor(box.x / 64);
      x <= Math.floor((box.x + box.width) / 64);
      x++
    )
      for (
        let y = Math.floor(box.y / 64);
        y <= Math.floor((box.y + box.height) / 64);
        y++
      )
        result.push(`${x}:${y}`)
    return result
  }
  const add = (box: LabelBox) => {
    for (const key of keys(box)) {
      const cell = cells.get(key) ?? []
      cell.push(box)
      cells.set(key, cell)
    }
  }
  const intersects = (box: LabelBox) =>
    keys({
      x: box.x - 2,
      y: box.y - 2,
      width: box.width + 4,
      height: box.height + 4,
    }).some((key) =>
      cells
        .get(key)
        ?.some(
          (other) =>
            box.x < other.x + other.width + 2 &&
            box.x + box.width + 2 > other.x &&
            box.y < other.y + other.height + 2 &&
            box.y + box.height + 2 > other.y
        )
    )
  obstacles.forEach(add)
  const placed: PlacedNodeLabel[] = []
  const sorted = [...candidates].sort(
    (a, b) =>
      a.priority - b.priority ||
      Number(previous.has(b.id)) - Number(previous.has(a.id))
  )
  for (const candidate of sorted) {
    if (
      !candidate.text ||
      (frozen && !frozen.has(candidate.id) && !candidate.required)
    )
      continue
    const width = candidate.textWidth * viewport.scale
    const height = 14 * viewport.scale
    const gap = 9 * viewport.scale
    const boxAt = (side: LabelSide): PlacedNodeLabel => ({
      id: candidate.id,
      text: candidate.text,
      priority: candidate.priority,
      side,
      width,
      height,
      x:
        side === "right"
          ? candidate.x + candidate.radius + gap
          : side === "left"
            ? candidate.x - candidate.radius - gap - width
            : candidate.x - width / 2,
      y:
        side === "above"
          ? candidate.y - candidate.radius - gap - height
          : side === "below"
            ? candidate.y + candidate.radius + gap
            : candidate.y - height / 2,
    })
    const visible = (box: LabelBox) =>
      box.x < viewport.width &&
      box.x + box.width > 0 &&
      box.y < viewport.height &&
      box.y + box.height > 0
    const fits = (box: LabelBox) =>
      box.x >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y >= 0 &&
      box.y + box.height <= viewport.height &&
      !intersects(box)
    const frozenSide = frozen?.get(candidate.id)
    const alternatives = (
      candidate.required ? ["right", "left", "above", "below"] : ["right"]
    ) as LabelSide[]
    const box = frozenSide
      ? boxAt(frozenSide)
      : (alternatives.map(boxAt).find(fits) ??
        (candidate.required
          ? alternatives.map(boxAt).find(visible)
          : undefined))
    if (!box || !visible(box)) continue
    placed.push(box)
    add(box)
  }
  return placed
}
