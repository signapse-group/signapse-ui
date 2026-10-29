import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from "d3-force"

export type ForceNode = SimulationNodeDatum & {
  radius: number
  id: string
  x: number
  y: number
}
export type ForceCommand =
  | {
      type: "init"
      nodes: ForceNode[]
      links: { source: string; target: string }[]
      revision: number
      running: boolean
    }
  | { type: "pin"; id: string; x: number; y: number; revision: number }
  | { type: "release"; id: string; revision: number }

export type ForceFrame = {
  nodes: ForceNode[]
  settled: boolean
  revision: number
}

let revision = 0
const simulation = forceSimulation<ForceNode>().stop()
const publish = (settled: boolean) =>
  self.postMessage({
    nodes: simulation.nodes(),
    settled,
    revision,
  } satisfies ForceFrame)
simulation.on("tick", () => publish(false)).on("end", () => publish(true))

self.onmessage = ({ data }: MessageEvent<ForceCommand>) => {
  revision = data.revision
  if (data.type === "init") {
    simulation
      .stop()
      .nodes(data.nodes)
      .force(
        "link",
        forceLink<ForceNode, { source: string; target: string }>(data.links)
          .id((n) => n.id)
          .distance(120)
      )
      .force("charge", forceManyBody().strength(-120))
      .force(
        "collide",
        forceCollide<ForceNode>((node) => node.radius + 10).iterations(3)
      )
      .force("center", forceCenter(0, 0))
      .alphaTarget(0)
      .alpha(1)
    if (data.running) simulation.restart()
    return
  }
  const node = simulation.nodes().find((n) => n.id === data.id)
  if (!node) return
  if (data.type === "pin") {
    node.fx = node.x = data.x
    node.fy = node.y = data.y
    node.vx = node.vy = 0
    simulation
      .alphaTarget(0.3)
      .alpha(Math.max(simulation.alpha(), 0.3))
      .restart()
  } else {
    node.fx = node.fy = null
    simulation.alphaTarget(0).restart()
  }
}
