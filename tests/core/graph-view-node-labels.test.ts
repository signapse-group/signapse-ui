import { describe, expect, it } from "vitest"

import {
  getNodeLabelPriority,
  measureNodeLabel,
  placeNodeLabels,
  type NodeLabelCandidate,
} from "@/app/[lang]/(main)/graph-view-sigma-demo/node-labels"

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
  required: false,
  ...changes,
})

describe("graph node label policy", () => {
  it("prioritizes interaction and endpoints, includes related articles, and hides unrelated labels", () => {
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
    expect(getNodeLabelPriority("asset", "asset", state)).toBeNull()
  })

  it("measures the ellipsis within 220 units without splitting emoji", () => {
    const measure = (text: string) => Array.from(text).length * 10
    const result = measureNodeLabel("  " + "😀".repeat(50) + "  ", measure)
    expect(result.width).toBeLessThanOrEqual(220)
    expect(result.text).toBe("😀".repeat(21) + "…")
    expect(measureNodeLabel("  TSLA  ", measure).text).toBe("TSLA")
  })

  it("gives a focused label space before background labels and rejects real rectangle collisions", () => {
    const labels = placeNodeLabels(
      [
        candidate("background"),
        candidate("focus", { priority: 0, required: true }),
        candidate("clear", { y: 200 }),
      ],
      [],
      viewport
    )
    expect(labels.map((label) => label.id)).toEqual(["focus", "clear"])
    expect(
      placeNodeLabels(
        [candidate("blocked")],
        [{ x: 150, y: 95, width: 50, height: 20 }],
        viewport
      )
    ).toEqual([])
    expect(
      placeNodeLabels(
        [candidate("boundary", { x: 41, textWidth: 1 })],
        [{ x: 63, y: 95, width: 1, height: 10 }],
        viewport
      )
    ).toEqual([])
  })

  it("keeps both required endpoint labels by placing them on different sides", () => {
    const labels = placeNodeLabels(
      [
        candidate("source", { priority: 1, required: true }),
        candidate("target", { x: 110, priority: 1, required: true }),
      ],
      [],
      viewport
    )
    expect(labels).toHaveLength(2)
    expect(labels[0].side).not.toBe(labels[1].side)
  })

  it("keeps the focused name out from behind an inspector", () => {
    const labels = placeNodeLabels(
      [candidate("focus", { x: 600, priority: 0, required: true })],
      [{ x: 620, y: 50, width: 180, height: 500 }],
      viewport
    )
    expect(labels[0].side).toBe("left")
    expect(labels[0].x + labels[0].width).toBeLessThan(620)
  })

  it("keeps frozen membership through movement and recalculates after release", () => {
    const initial = placeNodeLabels(
      [candidate("first"), candidate("second", { y: 200 })],
      [],
      viewport
    )
    const frozen = new Map(initial.map((label) => [label.id, label.side]))
    const moved = [
      candidate("first"),
      candidate("second", { y: 100 }),
      candidate("new", { y: 300 }),
    ]
    expect(
      placeNodeLabels(moved, [], viewport, frozen).map((label) => label.id)
    ).toEqual(["first", "second"])
    expect(
      placeNodeLabels(moved, [], viewport).map((label) => label.id)
    ).toEqual(["first", "new"])
    const zoomed = placeNodeLabels([candidate("first")], [], {
      ...viewport,
      scale: 0.45,
    })[0]
    expect(zoomed.width).toBeCloseTo(45)
    expect(zoomed.height).toBeCloseTo(14 * 0.45)
  })
})
