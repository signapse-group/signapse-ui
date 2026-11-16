// @vitest-environment jsdom

import { EventEmitter } from "node:events"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Settings } from "sigma/settings"

import type {
  GraphViewDemoGraph,
  GraphViewDemoNodeAttributes,
  GraphViewDemoEdgeAttributes,
} from "@/app/lib/graph-view/demo-fixture"
import type {
  GraphViewEdge,
  GraphViewNode,
  GraphViewNodeMetadata,
  GraphViewResponse,
} from "@/app/lib/graph-view/definitions"
import type {
  ForceCommand,
  ForceFrame,
  ForceNode,
} from "@/app/[lang]/(main)/graph-view/d3-layout.worker"

vi.mock("@/app/api/events/action", () => ({ getEventById: vi.fn() }))
vi.mock("@/app/api/news-articles/action", () => ({
  getNewsArticleById: vi.fn(),
}))
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }))
vi.mock("sigma/rendering", () => ({ drawStraightEdgeLabel: vi.fn() }))
vi.mock("sigma", () => ({
  default: function Renderer(
    ...args: ConstructorParameters<typeof SigmaDouble>
  ) {
    return new SigmaDouble(...args)
  },
}))

import { SigmaGraphView } from "@/app/[lang]/(main)/graph-view/sigma-graph-view"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"

// Only the renderer and asynchronous worker are doubled; graph, drag handlers,
// layout adapter, label placement, selection and inspector are the real components.
class SigmaDouble extends EventEmitter {
  static current: SigmaDouble
  mouse = { isMouseDown: false }
  camera = {
    getState: () => ({ x: 0.5, y: 0.5, ratio: 1, angle: 0 }),
    setState: vi.fn(),
    animate: vi.fn(async () => undefined),
  }
  labels = document.createElement("canvas")
  mouseCanvas = document.createElement("canvas")
  constructor(
    readonly graph: GraphViewDemoGraph,
    readonly container: HTMLElement,
    readonly settings: Partial<
      Settings<GraphViewDemoNodeAttributes, GraphViewDemoEdgeAttributes>
    >
  ) {
    super()
    SigmaDouble.current = this
    container.append(this.labels, this.mouseCanvas)
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON() {},
    })
    graph.on("nodeAttributesUpdated", this.refresh)
    graph.on("eachNodeAttributesUpdated", this.refresh)
  }
  getGraph = () => this.graph
  getDimensions = () => ({ width: 800, height: 600 })
  getNodeDisplayData = (id: string) => {
    const data = this.graph.getNodeAttributes(id)
    return { ...data, hidden: false, ...this.settings.nodeReducer?.(id, data) }
  }
  framedGraphToViewport = ({ x, y }: { x: number; y: number }) => ({
    x: x + 400,
    y: y + 300,
  })
  graphToViewport = this.framedGraphToViewport
  viewportToGraph = ({ x, y }: { x: number; y: number }) => ({
    x: x - 400,
    y: y - 300,
  })
  viewportToFramedGraph = this.viewportToGraph
  scaleSize = (size: number) => size
  getCanvases = () => ({ labels: this.labels, mouse: this.mouseCanvas })
  getCamera = () => this.camera
  getMouseCaptor = () => this.mouse
  getBBox = () => ({ x: [-200, 200], y: [-200, 200] })
  getCustomBBox = this.getBBox
  setCustomBBox = vi.fn()
  refresh = () => {
    this.emit("afterRender")
  }
  scheduleRefresh = this.refresh
  scheduleRender = this.refresh
  resize = vi.fn()
  kill = () => {
    this.graph.off("nodeAttributesUpdated", this.refresh)
    this.graph.off("eachNodeAttributesUpdated", this.refresh)
    this.removeAllListeners()
  }
}

class WorkerDouble {
  static current: WorkerDouble
  onmessage: ((event: { data: ForceFrame }) => void) | null = null
  commands: ForceCommand[] = []
  nodes: ForceNode[] = []
  constructor() {
    WorkerDouble.current = this
  }
  postMessage(command: ForceCommand) {
    this.commands.push(command)
    if (command.type === "init") this.nodes = command.nodes
    if (command.type === "pin") {
      const node = this.nodes.find((node) => node.id === command.id)!
      node.x = command.x
      node.y = command.y
    }
  }
  settle() {
    this.onmessage?.({
      data: {
        revision: this.commands.at(-1)!.revision,
        nodes: this.nodes,
        settled: true,
      },
    })
  }
  terminate = vi.fn()
}

const frames = new Map<number, FrameRequestCallback>()
let frameId = 0
function flushFrames() {
  const pending = [...frames.values()]
  frames.clear()
  for (const callback of pending) callback(0)
}
function move(
  x: number,
  y: number,
  touch = false,
  target: EventTarget = SigmaDouble.current.mouseCanvas
) {
  SigmaDouble.current.emit("moveBody", {
    event: {
      x,
      y,
      original: touch
        ? { touches: [{}], target }
        : { target, buttons: SigmaDouble.current.mouse.isMouseDown ? 1 : 0 },
    },
    preventSigmaDefault() {},
  })
}

async function mountGraph(
  options: {
    parallel?: boolean
    includeArticle?: boolean
    includeNarrative?: boolean
    locale?: "en" | "vi"
    edgeNote?: string | null
    edges?: GraphViewEdge[]
  } = {}
) {
  const {
    parallel = false,
    includeArticle = false,
    includeNarrative = false,
    locale = "en",
    edgeNote = null,
    edges: edgeOverrides,
  } = options
  const metadata: GraphViewNodeMetadata = {
    slug: null,
    canonicalKey: null,
    symbol: null,
    assetType: null,
    sourceName: null,
    url: null,
    occurredAt: null,
    publishedAt: null,
    status: null,
    narrativeStatus: null,
    confidence: null,
    thesis: null,
    themes: null,
  }
  const node = (
    id: string,
    kind: GraphViewNode["kind"],
    label: string,
    nodeMetadata: GraphViewNodeMetadata = metadata
  ): GraphViewNode => ({
    id,
    kind,
    label,
    secondaryLabel: null,
    metadata: nodeMetadata,
  })
  const graphView: GraphViewResponse = {
    nodes: [
      node("event:1", "event", "Rates"),
      node("asset:2", "asset", "Bitcoin"),
      node("asset:3", "asset", "Gold"),
      ...(includeArticle
        ? [
            node("news-article:4", "news-article", "Article", {
              ...metadata,
              sourceName: "Fixture Wire",
              url: "https://example.test/article",
            }),
          ]
        : []),
      ...(includeNarrative
        ? [node("narrative:5", "narrative", "Rates narrative")]
        : []),
    ],
    edges: edgeOverrides ?? [
      {
        id: "event-asset:1",
        kind: "event-asset",
        sourceNodeId: "event:1",
        targetNodeId: "asset:2",
        relationType: "AFFECTED_ASSET",
        weight: null,
        confidence: null,
        note: edgeNote,
      },
      ...(parallel
        ? [
            {
              id: "event-asset:parallel",
              kind: "event-asset" as const,
              sourceNodeId: "event:1",
              targetNodeId: "asset:2",
              relationType: "REFERENCE_ASSET" as const,
              weight: null,
              confidence: null,
              note: null,
            },
          ]
        : []),
      ...(includeArticle
        ? [
            {
              id: "news-article-event:4",
              kind: "news-article-event" as const,
              sourceNodeId: "news-article:4",
              targetNodeId: "event:1",
              relationType: "PRIMARY" as const,
              weight: null,
              confidence: null,
              note: null,
            },
          ]
        : []),
      ...(includeNarrative
        ? [
            {
              id: "narrative-event:5",
              kind: "narrative-event" as const,
              sourceNodeId: "narrative:5",
              targetNodeId: "event:1",
              relationType: "DRIVER" as const,
              weight: null,
              confidence: null,
              note: null,
            },
            {
              id: "narrative-asset:5",
              kind: "narrative-asset" as const,
              sourceNodeId: "narrative:5",
              targetNodeId: "asset:2",
              relationType: "AFFECTED" as const,
              weight: null,
              confidence: null,
              note: null,
            },
          ]
        : []),
    ],
  }
  const dictionary = locale === "vi" ? viDictionary : en
  const renderGraph = (value: GraphViewResponse) => (
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <SigmaGraphView graphView={value} />
    </LocalizationProvider>
  )
  const rendered = render(renderGraph(graphView))
  await act(async () => {
    WorkerDouble.current.settle()
    flushFrames()
  })
  const sigma = SigmaDouble.current
  const point = sigma.framedGraphToViewport(sigma.getNodeDisplayData("event:1"))
  act(() => {
    move(point.x, point.y)
    flushFrames()
  })
  expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(true)
  expect(sigma.getNodeDisplayData("asset:3").color).toBe("#e4e7eb")
  return {
    sigma,
    point,
    graphView,
    rerenderGraph: (value: GraphViewResponse) =>
      rendered.rerender(renderGraph(value)),
  }
}

function clickGraphEdge(
  sigma: SigmaDouble,
  edge: GraphViewEdge,
  touch = false
) {
  const sourceData = sigma.getNodeDisplayData(edge.sourceNodeId)
  const targetData = sigma.getNodeDisplayData(edge.targetNodeId)
  if (
    Math.hypot(targetData.x - sourceData.x, targetData.y - sourceData.y) <
    sourceData.size + targetData.size + 16
  ) {
    sigma.graph.setNodeAttribute(edge.targetNodeId, "x", sourceData.x + 160)
    sigma.graph.setNodeAttribute(edge.targetNodeId, "y", sourceData.y + 120)
  }
  const source = sigma.framedGraphToViewport(
    sigma.getNodeDisplayData(edge.sourceNodeId)
  )
  const target = sigma.framedGraphToViewport(
    sigma.getNodeDisplayData(edge.targetNodeId)
  )
  act(() => {
    sigma.emit("clickStage", {
      event: {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2,
        original: touch ? { touches: [{}] } : {},
      },
      preventSigmaDefault() {},
    })
  })
}

const relationLabelCases = [
  {
    kind: "event-asset",
    sourceNodeId: "event:1",
    targetNodeId: "asset:2",
    sourceLabel: "Rates",
    targetLabel: "Bitcoin",
    group: { en: "Event → asset", vi: "Sự kiện → tài sản" },
    includeArticle: false,
    includeNarrative: false,
    relations: [
      { type: "PRIMARY_SUBJECT", en: "Primary subject", vi: "Chủ thể chính" },
      {
        type: "AFFECTED_ASSET",
        en: "Affected asset",
        vi: "Tài sản bị ảnh hưởng",
      },
      {
        type: "REFERENCE_ASSET",
        en: "Reference asset",
        vi: "Tài sản tham chiếu",
      },
    ],
  },
  {
    kind: "news-article-event",
    sourceNodeId: "news-article:4",
    targetNodeId: "event:1",
    sourceLabel: "Article",
    targetLabel: "Rates",
    group: { en: "News article → event", vi: "Bài viết → sự kiện" },
    includeArticle: true,
    includeNarrative: false,
    relations: [
      { type: "PRIMARY", en: "Primary article", vi: "Bài viết chính" },
      { type: "SUPPORTING", en: "Supporting article", vi: "Bài viết hỗ trợ" },
      { type: "UPDATE", en: "Event update", vi: "Cập nhật sự kiện" },
      {
        type: "CONTRADICTING",
        en: "Contradicting article",
        vi: "Bài viết mâu thuẫn",
      },
    ],
  },
  {
    kind: "narrative-event",
    sourceNodeId: "narrative:5",
    targetNodeId: "event:1",
    sourceLabel: "Rates narrative",
    targetLabel: "Rates",
    group: { en: "Narrative → event", vi: "Luận điểm → sự kiện" },
    includeArticle: false,
    includeNarrative: true,
    relations: [
      { type: "DRIVER", en: "Driver event", vi: "Sự kiện dẫn dắt" },
      { type: "AFFECTED", en: "Affected event", vi: "Sự kiện chịu ảnh hưởng" },
    ],
  },
  {
    kind: "narrative-asset",
    sourceNodeId: "narrative:5",
    targetNodeId: "asset:2",
    sourceLabel: "Rates narrative",
    targetLabel: "Bitcoin",
    group: { en: "Narrative → asset", vi: "Luận điểm → tài sản" },
    includeArticle: false,
    includeNarrative: true,
    relations: [
      { type: "DRIVER", en: "Driver asset", vi: "Tài sản dẫn dắt" },
      { type: "AFFECTED", en: "Affected asset", vi: "Tài sản chịu ảnh hưởng" },
    ],
  },
] satisfies Array<{
  kind: GraphViewEdge["kind"]
  sourceNodeId: string
  targetNodeId: string
  sourceLabel: string
  targetLabel: string
  group: Record<"en" | "vi", string>
  includeArticle: boolean
  includeNarrative: boolean
  relations: Array<{
    type: GraphViewEdge["relationType"]
    en: string
    vi: string
  }>
}>

const localizedRelationCases = relationLabelCases.flatMap((group) =>
  (["en", "vi"] as const).map((locale) => ({ group, locale }))
)

function startDrag(point: { x: number; y: number }, touch = false) {
  const sigma = SigmaDouble.current
  sigma.mouse.isMouseDown = !touch
  act(() => {
    sigma.emit("downNode", {
      node: "event:1",
      event: { ...point, original: touch ? { touches: [{}] } : { button: 0 } },
    })
    move(point.x + 60, point.y + 40, touch)
  })
  sigma.mouse.isMouseDown = false
}

beforeEach(() => {
  vi.stubGlobal("Worker", WorkerDouble)
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id))
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect() {},
    fillText() {},
    measureText: (text: string) => ({ width: text.length * 6 }),
  } as unknown as CanvasRenderingContext2D)
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  })
})
afterEach(() => {
  cleanup()
  frames.clear()
  vi.unstubAllGlobals()
})

describe("Sigma drag release", () => {
  it("keeps live article source actions outside the graph inspector", async () => {
    const { sigma } = await mountGraph({ includeArticle: true })
    act(() => {
      sigma.emit("clickNode", {
        node: "news-article:4",
        preventSigmaDefault() {},
      })
    })

    const inspector = screen.getByTestId("graph-demo-inspector")
    expect(
      within(inspector).queryByTestId("graph-demo-open-quick-detail")
    ).not.toBeInTheDocument()
    expect(within(inspector).queryByRole("link")).not.toBeInTheDocument()
    expect(inspector).not.toHaveTextContent(en.graphView.demo.sourceUnavailable)
  })

  it.each(["upNode", "touchend", "touchcancel", "pointercancel", "blur"])(
    "clears hover immediately on %s and keeps it clear when forces settle",
    async (endEvent) => {
      const { sigma, point } = await mountGraph()
      startDrag(point, endEvent.startsWith("touch"))
      act(() => {
        if (endEvent === "upNode" || endEvent === "touchend")
          sigma.emit("upNode")
        else if (endEvent === "blur") window.dispatchEvent(new Event("blur"))
        else if (endEvent === "pointercancel")
          sigma.container.dispatchEvent(new Event("pointercancel"))
        else
          sigma.container.dispatchEvent(
            new Event("touchcancel", { bubbles: true })
          )
      })
      expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(false)
      expect(sigma.getNodeDisplayData("asset:3").color).toBe(
        sigma.graph.getNodeAttribute("asset:3", "color")
      )
      expect(WorkerDouble.current.commands.at(-1)?.type).toBe("release")
      act(() => {
        WorkerDouble.current.settle()
        flushFrames()
      })
      expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(false)
      expect(sigma.container.style.cursor).toBe("")
      act(() => {
        sigma.emit("enterNode", { node: "event:1" })
      })
      expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(false)
      const dropped = sigma.framedGraphToViewport(
        sigma.getNodeDisplayData("event:1")
      )
      act(() => {
        move(dropped.x, dropped.y)
        flushFrames()
      })
      expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(true)
    }
  )

  it("preserves a selected node and its inspector when it is dragged", async () => {
    const { sigma, point } = await mountGraph()
    act(() => {
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent(
      "Rates"
    )
    startDrag(point)
    act(() => {
      sigma.emit("upNode")
      WorkerDouble.current.settle()
      flushFrames()
    })
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent(
      "Rates"
    )
    expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(true)
  })

  it("keeps a click with sub-threshold movement working", async () => {
    const { sigma, point } = await mountGraph()
    sigma.mouse.isMouseDown = true
    act(() => {
      sigma.emit("downNode", {
        node: "event:1",
        event: { ...point, original: { button: 0 } },
      })
      move(point.x + 2, point.y + 2)
      sigma.emit("upNode")
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    sigma.mouse.isMouseDown = false
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent(
      "Rates"
    )
    expect(
      WorkerDouble.current.commands.some((command) => command.type === "pin")
    ).toBe(false)
  })

  it("does not turn the mouse-up after a drag into a node selection", async () => {
    const { sigma, point } = await mountGraph()
    startDrag(point)
    act(() => {
      sigma.emit("upNode")
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
      WorkerDouble.current.settle()
      flushFrames()
    })
    expect(screen.queryByTestId("graph-demo-inspector")).not.toBeInTheDocument()
    expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(false)
  })

  it("allows fresh hover before the released forces have settled", async () => {
    const { sigma, point } = await mountGraph()
    startDrag(point)
    act(() => {
      sigma.emit("upNode")
    })
    const gold = sigma.framedGraphToViewport(
      sigma.getNodeDisplayData("asset:3")
    )
    act(() => {
      move(gold.x, gold.y)
      flushFrames()
    })
    expect(sigma.getNodeDisplayData("asset:3").highlighted).toBe(true)
    expect(JSON.parse(sigma.container.dataset.renderedLabelIds!)).toContain(
      "event:1"
    )
  })

  it("applies the second rapid click and toggles the same node off without residual hover", async () => {
    const { sigma, point } = await mountGraph()
    act(() => {
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
      sigma.emit("doubleClickNode", {
        node: "asset:3",
        preventSigmaDefault() {},
      })
    })
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent("Gold")
    act(() => {
      move(point.x, point.y)
      sigma.emit("clickNode", { node: "asset:3", preventSigmaDefault() {} })
      flushFrames()
    })
    expect(screen.queryByTestId("graph-demo-inspector")).not.toBeInTheDocument()
    expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(false)
    expect(sigma.container.dataset.hoveredNodeId).toBe("")
  })

  it("ignores right-button dragging and stops a left drag on document mouse-up", async () => {
    const { sigma, point } = await mountGraph()
    act(() => {
      sigma.emit("downNode", {
        node: "event:1",
        event: { ...point, original: { button: 2 } },
      })
      move(point.x + 60, point.y + 40)
    })
    expect(WorkerDouble.current.commands.some((c) => c.type === "pin")).toBe(
      false
    )
    startDrag(point)
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { button: 0 }))
    })
    expect(WorkerDouble.current.commands.at(-1)?.type).toBe("release")
    const commands = WorkerDouble.current.commands.length
    act(() => {
      move(point.x + 100, point.y + 100)
    })
    expect(WorkerDouble.current.commands).toHaveLength(commands)
  })

  it("clears hover over HTML controls and outside the canvas", async () => {
    const { sigma, point } = await mountGraph()
    act(() => {
      move(point.x, point.y, false, screen.getByTestId("graph-demo-zoom-in"))
      flushFrames()
    })
    expect(sigma.container.dataset.hoveredNodeId).toBe("")
    expect(sigma.getNodeDisplayData("asset:3").color).toBe(
      sigma.graph.getNodeAttribute("asset:3", "color")
    )
    act(() => {
      move(-20, -20)
      flushFrames()
    })
    expect(sigma.container.dataset.hoveredEdgeId).toBe("")
  })

  it("keeps a dragged unrelated node readable while preserving the selected inspector", async () => {
    const { sigma } = await mountGraph()
    act(() => {
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    const gold = sigma.framedGraphToViewport(
      sigma.getNodeDisplayData("asset:3")
    )
    sigma.mouse.isMouseDown = true
    act(() => {
      sigma.emit("downNode", {
        node: "asset:3",
        event: { ...gold, original: { button: 0 } },
      })
      move(gold.x + 50, gold.y + 50)
    })
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent(
      "Rates"
    )
    expect(sigma.getNodeDisplayData("asset:3").color).toBe(
      sigma.graph.getNodeAttribute("asset:3", "color")
    )
    expect(sigma.getNodeDisplayData("asset:3").highlighted).toBe(true)
    act(() => {
      sigma.emit("upNode")
    })
    expect(sigma.getNodeDisplayData("asset:3").color).toBe("#e4e7eb")
  })

  it("offers overlapping live relations and updates the selected edge", async () => {
    const { sigma } = await mountGraph({ parallel: true })
    const a = sigma.framedGraphToViewport(sigma.getNodeDisplayData("event:1"))
    const b = sigma.framedGraphToViewport(sigma.getNodeDisplayData("asset:2"))
    const event = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, original: {} }
    act(() => {
      sigma.emit("clickStage", { event, preventSigmaDefault() {} })
    })
    const choices = screen.getByTestId("graph-edge-choices")
    expect(
      within(choices).getByRole("button", {
        name: "Close relationship choices",
      })
    ).toHaveFocus()
    const buttons = within(choices).getAllByRole("button", {
      name: /Rates.*Bitcoin/,
    })
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[1])
    expect(screen.getByTestId("graph-edge-inspector")).toHaveTextContent(
      "Reference asset"
    )
    expect(screen.queryByTestId("graph-edge-choices")).not.toBeInTheDocument()

    act(() => {
      sigma.emit("clickStage", { event, preventSigmaDefault() {} })
    })
    const selectedChoices = screen.getByTestId("graph-edge-choices")
    const selectedButtons = within(selectedChoices).getAllByRole("button", {
      name: /Rates.*Bitcoin/,
    })
    expect(selectedButtons[1]).toHaveAttribute("aria-pressed", "true")
  })

  it.each(localizedRelationCases)(
    "renders localized $locale labels and direction for every edge group",
    async ({ group, locale }) => {
      const edges: GraphViewEdge[] = group.relations.map((relation, index) => ({
        id: `${group.kind}:${index}`,
        kind: group.kind,
        sourceNodeId: group.sourceNodeId,
        targetNodeId: group.targetNodeId,
        relationType: relation.type,
        weight: null,
        confidence: null,
        note: index === 0 ? "Source note" : null,
      }))
      const { sigma } = await mountGraph({
        includeArticle: group.includeArticle,
        includeNarrative: group.includeNarrative,
        locale,
        edges,
      })

      clickGraphEdge(sigma, edges[0])
      const choices = screen.getByTestId("graph-edge-choices")
      expect(choices).toHaveTextContent(group.group[locale])
      expect(choices).toHaveTextContent(
        `${locale === "en" ? "Note" : "Ghi chú"}: Source note`
      )
      const choiceButtons = within(choices)
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("aria-pressed"))
      expect(choiceButtons).toHaveLength(group.relations.length)
      group.relations.forEach((relation, index) => {
        expect(choiceButtons[index]).toHaveTextContent(relation[locale])
      })

      fireEvent.click(choiceButtons.at(-1)!)
      const inspector = screen.getByTestId("graph-edge-inspector")
      expect(inspector).toHaveTextContent(group.group[locale])
      expect(inspector).toHaveTextContent(group.relations.at(-1)![locale])
      expect(inspector).toHaveTextContent(group.sourceLabel)
      expect(inspector).toHaveTextContent(group.targetLabel)
      expect(inspector).toHaveTextContent(
        (locale === "en" ? en : viDictionary).graphView.demo
          .relationshipInterpretation
      )
      const endpointLabels = inspector.querySelectorAll("dt")
      expect(endpointLabels[0]).toHaveTextContent(
        locale === "en" ? "Source" : "Nguồn"
      )
      expect(endpointLabels[1]).toHaveTextContent(
        locale === "en" ? "Target" : "Đích"
      )
      expect(inspector).not.toHaveTextContent(
        `${locale === "en" ? "Note" : "Ghi chú"}: Source note`
      )
    }
  )

  it.each([
    { input: "Producer note", expected: "Producer note" },
    { input: "  Producer note  ", expected: "Producer note" },
  ])(
    "shows the trimmed live source note on touch: $input",
    async ({ input, expected }) => {
      const { sigma, graphView } = await mountGraph({ edgeNote: input })
      clickGraphEdge(sigma, graphView.edges[0], true)

      const inspector = screen.getByTestId("graph-edge-inspector")
      expect(inspector).toHaveTextContent("Source · Event")
      expect(inspector).toHaveTextContent("Target · Asset")
      expect(inspector).toHaveTextContent("Rates")
      expect(inspector).toHaveTextContent("Bitcoin")
      expect(inspector).toHaveTextContent("Affected asset")
      expect(within(inspector).getByText("Note")).toBeInTheDocument()
      expect(within(inspector).getByText(expected)).toBeInTheDocument()
    }
  )

  it.each([null, "  \n\t "])(
    "omits an empty live source note (%s)",
    async (note) => {
      const { sigma, graphView } = await mountGraph({ edgeNote: note })
      clickGraphEdge(sigma, graphView.edges[0])

      const inspector = screen.getByTestId("graph-edge-inspector")
      expect(inspector).toHaveTextContent("Rates")
      expect(inspector).not.toHaveTextContent("Note")
    }
  )

  it("updates edge content from the current graph and closes when that edge disappears", async () => {
    const { sigma, graphView, rerenderGraph } = await mountGraph()
    const edge = graphView.edges[0]
    clickGraphEdge(sigma, edge)

    const updatedGraph = {
      ...graphView,
      nodes: graphView.nodes.map((node) =>
        node.id === edge.sourceNodeId
          ? { ...node, label: "Current source label" }
          : node
      ),
      edges: graphView.edges.map((current) => ({
        ...current,
        note: "Updated source note",
      })),
    }
    rerenderGraph(updatedGraph)
    await act(async () => {
      WorkerDouble.current.settle()
      flushFrames()
    })
    expect(screen.getByTestId("graph-edge-inspector")).toHaveTextContent(
      "Current source label"
    )
    expect(screen.getByTestId("graph-edge-inspector")).toHaveTextContent(
      "Updated source note"
    )
    expect(screen.getByTestId("graph-edge-inspector")).not.toHaveTextContent(
      "Rates"
    )

    rerenderGraph({ ...updatedGraph, edges: [] })
    expect(screen.queryByTestId("graph-edge-inspector")).not.toBeInTheDocument()
  })

  it("keeps the selected edge when the relationship chooser is closed", async () => {
    const { sigma, graphView } = await mountGraph({ parallel: true })
    const [selectedEdge] = graphView.edges
    clickGraphEdge(sigma, selectedEdge)
    let choices = screen.getByTestId("graph-edge-choices")
    fireEvent.click(
      within(choices).getByRole("button", { name: /Reference asset/ })
    )
    expect(screen.getByTestId("graph-edge-inspector")).toHaveTextContent(
      "Reference asset"
    )

    clickGraphEdge(sigma, selectedEdge)
    choices = screen.getByTestId("graph-edge-choices")
    expect(
      within(choices).getByRole("button", { name: /Reference asset/ })
    ).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(screen.getByTestId("graph-close-edge-choices"))
    expect(screen.getByTestId("graph-edge-inspector")).toHaveTextContent(
      "Reference asset"
    )
  })

  it("keeps selection when cancelling ambiguous edge choices with Escape", async () => {
    const { sigma } = await mountGraph({ parallel: true })
    act(() => {
      sigma.emit("clickNode", { node: "asset:3", preventSigmaDefault() {} })
    })
    const a = sigma.framedGraphToViewport(sigma.getNodeDisplayData("event:1"))
    const b = sigma.framedGraphToViewport(sigma.getNodeDisplayData("asset:2"))
    act(() => {
      sigma.emit("clickStage", {
        event: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, original: {} },
        preventSigmaDefault() {},
      })
    })
    fireEvent.keyDown(screen.getByTestId("graph-edge-choices"), {
      key: "Escape",
    })
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent("Gold")
    expect(sigma.getNodeDisplayData("asset:3").highlighted).toBe(true)
  })

  it("clears queued hover when closing an inspector", async () => {
    const { sigma, point } = await mountGraph()
    act(() => {
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    act(() => {
      move(point.x, point.y)
    })
    fireEvent.click(screen.getByTestId("graph-demo-close-inspector"))
    act(flushFrames)
    expect(screen.queryByTestId("graph-demo-inspector")).not.toBeInTheDocument()
    expect(sigma.container.dataset.hoveredNodeId).toBe("")
    expect(sigma.getNodeDisplayData("asset:3").color).toBe(
      sigma.graph.getNodeAttribute("asset:3", "color")
    )
  })

  it("preserves selection on pan and ignores the trailing double-click event", async () => {
    const { sigma, point } = await mountGraph()
    act(() => {
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    sigma.mouse.isMouseDown = true
    act(() => {
      sigma.emit("downStage", { event: { ...point, original: { button: 0 } } })
      move(point.x + 50, point.y + 50)
      sigma.emit("upStage")
      sigma.emit("doubleClickNode", {
        node: "asset:3",
        preventSigmaDefault() {},
      })
    })
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent(
      "Rates"
    )
    expect(WorkerDouble.current.commands.some((c) => c.type === "pin")).toBe(
      false
    )
  })

  it("releases a dragged node for pinch and ignores the trailing tap", async () => {
    const { sigma, point } = await mountGraph()
    startDrag(point, true)
    act(() => {
      sigma.emit("downNode", {
        node: "event:1",
        event: { ...point, original: { touches: [{}, {}] } },
      })
      sigma.emit("upNode")
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    expect(WorkerDouble.current.commands.at(-1)?.type).toBe("release")
    expect(screen.queryByTestId("graph-demo-inspector")).not.toBeInTheDocument()
    expect(sigma.container.dataset.draggingNodeId).toBe("")
  })

  it("ends a drag when a missed mouse-up is detected on the next move", async () => {
    const { sigma, point } = await mountGraph()
    startDrag(point)
    act(() => {
      move(point.x + 80, point.y + 80)
    })
    expect(WorkerDouble.current.commands.at(-1)?.type).toBe("release")
    expect(sigma.mouse.isMouseDown).toBe(false)
    expect(sigma.container.dataset.draggingNodeId).toBe("")
  })

  it("clears temporary hover on camera controls while preserving selection", async () => {
    const { sigma } = await mountGraph()
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    )
    fireEvent.click(screen.getByTestId("graph-demo-zoom-in"))
    expect(sigma.container.dataset.hoveredNodeId).toBe("")
    expect(sigma.getNodeDisplayData("asset:3").color).toBe(
      sigma.graph.getNodeAttribute("asset:3", "color")
    )
    act(() => {
      sigma.emit("clickNode", { node: "event:1", preventSigmaDefault() {} })
    })
    fireEvent.click(screen.getByTestId("graph-demo-recenter"))
    expect(screen.getByTestId("graph-demo-inspector")).toHaveTextContent(
      "Rates"
    )
    expect(sigma.getNodeDisplayData("event:1").highlighted).toBe(true)
  })
})
