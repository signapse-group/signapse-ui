import type { GraphViewDemoGraph } from "@/app/lib/graph-view/demo-fixture"
import type { ForceCommand, ForceFrame } from "./d3-layout.worker"

export function createD3Layout(
  graph: GraphViewDemoGraph,
  onSettled: () => void,
  onError: () => void
) {
  const worker = new Worker(new URL("./d3-layout.worker.ts", import.meta.url))
  let revision = 0
  let running = false
  let pinned: { id: string; x: number; y: number } | null = null
  const send = (command: ForceCommand) => worker.postMessage(command)
  const initialize = (active: boolean) =>
    send({
      type: "init",
      revision: ++revision,
      running: active,
      nodes: graph.mapNodes((id, { x, y }) => ({
        id,
        x,
        y,
        radius: graph.getNodeAttribute(id, "size"),
      })),
      links: graph.mapEdges((_id, _attributes, source, target) => ({
        source,
        target,
      })),
    })
  initialize(false)
  worker.onerror = onError
  worker.onmessage = ({ data }: MessageEvent<ForceFrame>) => {
    if (data.revision !== revision) return
    const positions = new Map(data.nodes.map((node) => [node.id, node]))
    graph.updateEachNodeAttributes((id, attributes) => {
      const position = pinned?.id === id ? pinned : positions.get(id)
      return position
        ? { ...attributes, x: position.x, y: position.y }
        : attributes
    })
    if (data.settled) {
      running = false
      onSettled()
    }
  }
  return {
    start() {
      pinned = null
      running = true
      initialize(true)
    },
    pin(id: string, x: number, y: number) {
      pinned = { id, x, y }
      running = true
      send({ type: "pin", id, x, y, revision: ++revision })
    },
    release() {
      if (!pinned) return
      send({ type: "release", id: pinned.id, revision: ++revision })
      pinned = null
    },
    isRunning: () => running,
    kill() {
      worker.terminate()
    },
  }
}
