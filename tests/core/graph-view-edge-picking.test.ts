import { describe, expect, it } from "vitest"
import { pickGraphEdges } from "@/app/[lang]/(main)/graph-view/edge-picking"

const nodes = new Map([
  ["a", { x: 0, y: 0, radius: 10 }],
  ["b", { x: 100, y: 0, radius: 10 }],
  ["c", { x: 0, y: 12, radius: 5 }],
  ["d", { x: 100, y: 12, radius: 5 }],
])
const edges = [
  { id: "first", sourceNodeId: "a", targetNodeId: "b" },
  { id: "second", sourceNodeId: "c", targetNodeId: "d" },
]
describe("graph edge picking in CSS pixels", () => {
  it("accepts nearby clicks, rejects empty space and prioritizes nodes", () => {
    expect(pickGraphEdges({ x: 50, y: -8 }, nodes, edges)).toEqual(["first"])
    expect(pickGraphEdges({ x: 50, y: -9 }, nodes, edges)).toEqual([])
    expect(pickGraphEdges({ x: 5, y: 3 }, nodes, edges)).toEqual([])
    expect(pickGraphEdges({ x: 50, y: -11 }, nodes, edges, 12)).toEqual([
      "first",
    ])
  })
  it("chooses the nearest edge and resolves exact ties consistently", () => {
    expect(pickGraphEdges({ x: 50, y: 7 }, nodes, edges)).toEqual([
      "second",
      "first",
    ])
    expect(
      pickGraphEdges({ x: 50, y: 6 }, nodes, [...edges].reverse())
    ).toEqual(["first", "second"])
    expect(
      pickGraphEdges({ x: 50, y: 0 }, nodes, [
        edges[0],
        { ...edges[0], id: "parallel" },
      ])
    ).toEqual(["first", "parallel"])
  })
  it("ignores missing endpoints, zero length and points beyond endpoints", () => {
    expect(pickGraphEdges({ x: -20, y: 0 }, nodes, edges)).toEqual([])
    expect(
      pickGraphEdges({ x: 50, y: 0 }, nodes, [
        { id: "missing", sourceNodeId: "a", targetNodeId: "missing" },
        { id: "zero", sourceNodeId: "a", targetNodeId: "a" },
      ])
    ).toEqual([])
  })
})
