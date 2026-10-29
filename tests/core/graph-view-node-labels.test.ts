import { describe, expect, it } from "vitest"
import {
  getNodeLabelPriority,
  measureNodeLabel,
  placeNodeLabels,
  type NodeLabelCandidate,
} from "@/app/[lang]/(main)/graph-view/node-labels"

const viewport = { width: 800, height: 600, scale: 1 }
const candidate = (
  id: string,
  changes: Partial<NodeLabelCandidate> = {}
): NodeLabelCandidate => ({
  id,
  text: id,
  textWidth: 100,
  x: 100,
  y: 100,
  radius: 14,
  priority: 5,
  ...changes,
})

describe("graph node label policy", () => {
  it("keeps every baseline label on the right through focus and overlap", () => {
    const labels = placeNodeLabels(
      [
        candidate("background"),
        candidate("focus", { x: 110, priority: 0 }),
        candidate("endpoint", { x: 120, priority: 1 }),
      ],
      viewport
    )
    expect(labels.map((label) => label.id)).toEqual([
      "focus",
      "endpoint",
      "background",
    ])
    const positions: Record<string, number> = {
      focus: 110,
      endpoint: 120,
      background: 100,
    }
    for (const label of labels) {
      expect(label.side).toBe("right")
      expect(label.x).toBe(positions[label.id] + 14 + 9)
    }
  })

  it("retains unrelated baseline labels, and shows articles only in the active context", () => {
    const state = {
      selected: null as string | null,
      dragged: null as string | null,
      hovered: null as string | null,
      edgeEndpoints: new Set<string>(),
      active: new Set<string>(),
    }
    expect(getNodeLabelPriority("article", "news-article", state)).toBeNull()
    expect(getNodeLabelPriority("asset", "asset", state)).toBe(4)
    state.selected = "selected"
    state.active = new Set(["selected", "article"])
    state.edgeEndpoints.add("endpoint")
    state.dragged = "dragged"
    expect(getNodeLabelPriority("selected", "event", state)).toBe(0)
    expect(getNodeLabelPriority("dragged", "news-article", state)).toBe(0)
    expect(getNodeLabelPriority("endpoint", "event", state)).toBe(1)
    expect(getNodeLabelPriority("article", "news-article", state)).toBe(3)
    expect(getNodeLabelPriority("asset", "asset", state)).toBe(4)
    expect(getNodeLabelPriority("event", "event", state)).toBe(5)
    expect(getNodeLabelPriority("narrative", "narrative", state)).toBe(5)
    expect(
      getNodeLabelPriority("other-article", "news-article", state)
    ).toBeNull()
  })

  it("measures the ellipsis within 220 units without splitting emoji", () => {
    const measure = (text: string) => Array.from(text).length * 10
    const result = measureNodeLabel("  " + "😀".repeat(50) + "  ", measure)
    expect(result.width).toBeLessThanOrEqual(220)
    expect(result.text).toBe("😀".repeat(21) + "…")
    expect(measureNodeLabel("  TSLA  ", measure).text).toBe("TSLA")
  })

  it("follows node positions and camera scale, clipping only offscreen text", () => {
    const label = placeNodeLabels([candidate("one", { x: 150, y: 200 })], {
      ...viewport,
      scale: 0.45,
    })[0]
    expect(label.x).toBeCloseTo(150 + 14 + 9 * 0.45)
    expect(label.width).toBeCloseTo(45)
    expect(label.height).toBeCloseTo(14 * 0.45)
    expect(label.y + label.height / 2).toBe(200)
    expect(
      placeNodeLabels([candidate("offscreen", { x: 900 })], viewport)
    ).toEqual([])
    expect(
      placeNodeLabels([candidate("partial", { x: 750 })], viewport)
    ).toHaveLength(1)
  })
})
