"use client"

import { useEffect, useRef, useState } from "react"

import styles from "./landing-context-figure.module.css"

export type LandingContextFigureLabels = {
  title: string
  description: string
  keyboardHint: string
  statusGraph: string
  statusPrice: string
  ready: string
  fallback: string
}

type FigureMode = "graph" | "price"

type LandingPalette = {
  background: string
  foreground: string
  accent: string
  muted: string
}

type LandingPaletteFallback = Record<keyof LandingPalette, number>

const GRAPH_NODE_COUNT = 120
const CANDLE_COUNT = 12
const CANDLE_INDEX_COUNT = 32
const SIGNAL_PATH_COUNT = 3
const SIGNAL_TRAIL_LENGTH = 6
const DRAG_THRESHOLD = 5
const GRAPH_EDGE_OPACITY = 0.8
const LANDING_PALETTE_FALLBACK: LandingPaletteFallback = {
  background: 0x03141d,
  foreground: 0xeafdf8,
  accent: 0x12d6b1,
  muted: 0xa6c4bf,
}

function seededRandom(n: number) {
  const value = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

function getLandingPaletteFallback(): LandingPaletteFallback {
  return LANDING_PALETTE_FALLBACK
}

function getLandingPalette(root: HTMLElement): LandingPalette {
  const probe = document.createElement("span")
  probe.setAttribute("aria-hidden", "true")
  probe.style.position = "absolute"
  probe.style.width = "0"
  probe.style.height = "0"
  probe.style.overflow = "hidden"
  probe.style.color = "var(--foreground)"
  root.appendChild(probe)

  const resolve = (variable: string) => {
    probe.style.color = `var(${variable})`
    return getComputedStyle(probe).color
  }

  const palette = {
    background: resolve("--background"),
    foreground: resolve("--foreground"),
    accent: resolve("--chart-2"),
    muted: resolve("--muted-foreground"),
  }
  probe.remove()

  return palette
}

function colorFromCss(
  three: typeof import("three"),
  value: string,
  fallback: number
) {
  const color = new three.Color(fallback)
  if (!value) return color

  try {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (context) {
      const previous = context.fillStyle
      context.fillStyle = value
      if (context.fillStyle !== previous) color.set(context.fillStyle)
    } else {
      color.set(value)
    }
  } catch {
    // The semantic CSS variable still drives the DOM; the sRGB fallback keeps
    // Three.js aligned when a browser returns an OKLCH value it cannot parse.
  }
  return color
}

export function LandingContextFigure({
  labels,
}: {
  labels: LandingContextFigureLabels
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const autoRotateRef = useRef(false)
  const rendererReadyRef = useRef(false)
  const modeRef = useRef<FigureMode>("graph")
  const pinnedPriceActionRef = useRef(false)
  const hoveredRef = useRef(false)
  const hoverSuppressedRef = useRef(false)
  const [mode, setMode] = useState<FigureMode>("graph")
  const [interactiveReady, setInteractiveReady] = useState(false)
  const [rendererState, setRendererState] = useState<
    "loading" | "ready" | "fallback"
  >("loading")
  const [status, setStatus] = useState(labels.ready)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const paletteRoot =
      stage.closest<HTMLElement>("[data-landing-surface]") ??
      stage.closest<HTMLElement>("[data-landing-theme]") ??
      stage

    let disposed = false
    let frameId = 0
    let frame: ((now: number) => void) | undefined
    let renderer: import("three").WebGLRenderer | null = null
    let scene: import("three").Scene | null = null
    let dotTexture: import("three").CanvasTexture | null = null
    let resources: Array<{ dispose: () => void }> = []
    let visible = true
    let documentHidden = document.hidden
    let pointerDown = false
    let dragging = false
    let activePointer: number | null = null
    let lockedDragTarget: FigureMode = "graph"
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastY = 0
    let manualInteractionUntil = 0
    let pointerX = 0
    let pointerY = 0
    const pointerQuery = window.matchMedia("(pointer: fine)")
    let supportsFinePointer = pointerQuery.matches
    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )
    let reduceMotion = reduceMotionQuery.matches
    let rootGroup: import("three").Group | null = null
    let nodeGeometry: import("three").BufferGeometry | null = null
    let edgeGeometry: import("three").BufferGeometry | null = null
    let candleGeometry: import("three").BufferGeometry | null = null
    let priceGeometry: import("three").BufferGeometry | null = null
    let gridGeometry: import("three").BufferGeometry | null = null
    let nodeMaterial: import("three").PointsMaterial | null = null
    let edgeMaterial: import("three").LineBasicMaterial | null = null
    let candleMaterial: import("three").LineBasicMaterial | null = null
    let priceMaterial: import("three").LineBasicMaterial | null = null
    let gridMaterial: import("three").LineBasicMaterial | null = null
    let graphPairs: Array<[number, number]> = []
    let intersectionObserver: IntersectionObserver | null = null

    const setFigureMode = (next: FigureMode, announce = true) => {
      modeRef.current = next
      setMode(next)
      if (announce) {
        setStatus(next === "price" ? labels.statusPrice : labels.statusGraph)
      }
    }

    const targetMode = () => {
      if (pointerDown) return lockedDragTarget
      if (pinnedPriceActionRef.current) return "price" as const
      if (
        hoveredRef.current &&
        supportsFinePointer &&
        !hoverSuppressedRef.current
      ) {
        return "price" as const
      }
      return "graph" as const
    }

    const scheduleFrame = () => {
      if (!frameId && frame && !disposed) frameId = requestAnimationFrame(frame)
    }

    const removeRenderer = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = 0
      renderer?.domElement.remove()
      renderer?.dispose()
      dotTexture?.dispose()
      resources.forEach((resource) => resource.dispose())
      resources = []
      renderer = null
      scene = null
      dotTexture = null
      rootGroup = null
      rendererReadyRef.current = false
    }

    const onPointerEnter = () => {
      if (!rendererReadyRef.current || !supportsFinePointer) return
      hoveredRef.current = true
      hoverSuppressedRef.current = false
      if (!pinnedPriceActionRef.current && !pointerDown) setFigureMode("price")
      manualInteractionUntil = performance.now() + 250
      scheduleFrame()
    }

    const onPointerLeave = () => {
      if (!rendererReadyRef.current) return
      hoveredRef.current = false
      pointerX = 0
      pointerY = 0
      hoverSuppressedRef.current = false
      if (!pinnedPriceActionRef.current && !pointerDown) setFigureMode("graph")
      manualInteractionUntil = performance.now() + 250
      scheduleFrame()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rendererReadyRef.current) return
      if ((event.target as HTMLElement).closest("button")) return
      pointerDown = true
      dragging = false
      activePointer = event.pointerId
      startX = lastX = event.clientX
      startY = lastY = event.clientY
      lockedDragTarget = modeRef.current
      stage.dataset.dragging = "true"
      stage.setPointerCapture(event.pointerId)
      manualInteractionUntil = performance.now() + 500
      scheduleFrame()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (supportsFinePointer && !reduceMotion && !pointerDown) {
        const bounds = stage.getBoundingClientRect()
        pointerX =
          (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5
        pointerY =
          (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5
        manualInteractionUntil = performance.now() + 500
        scheduleFrame()
      }
      if (!pointerDown || event.pointerId !== activePointer || !rootGroup)
        return
      const totalX = event.clientX - startX
      const totalY = event.clientY - startY
      if (!dragging && Math.hypot(totalX, totalY) >= DRAG_THRESHOLD) {
        dragging = true
      }
      const deltaX = event.clientX - lastX
      const deltaY = event.clientY - lastY
      lastX = event.clientX
      lastY = event.clientY
      if (!dragging) return

      rootGroup.rotation.y += deltaX * 0.0075
      rootGroup.rotation.x += deltaY * 0.0065
      const maxTilt = lockedDragTarget === "price" ? 0.7 : 1.15
      rootGroup.rotation.x = Math.max(
        -maxTilt,
        Math.min(maxTilt, rootGroup.rotation.x)
      )
      manualInteractionUntil = performance.now() + 500
      scheduleFrame()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!pointerDown || event.pointerId !== activePointer) return
      const wasDragging = dragging
      pointerDown = false
      dragging = false
      activePointer = null
      stage.dataset.dragging = "false"
      if (stage.hasPointerCapture(event.pointerId))
        stage.releasePointerCapture(event.pointerId)
      if (
        event.type === "pointerup" &&
        !wasDragging &&
        supportsFinePointer &&
        hoveredRef.current
      ) {
        const nextMode = modeRef.current === "price" ? "graph" : "price"
        pinnedPriceActionRef.current = nextMode === "price"
        hoverSuppressedRef.current = true
        setFigureMode(nextMode)
      }
      manualInteractionUntil = performance.now() + 500
      scheduleFrame()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!rendererReadyRef.current || !rootGroup) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        pinnedPriceActionRef.current = !pinnedPriceActionRef.current
        hoverSuppressedRef.current = !pinnedPriceActionRef.current
        setFigureMode(pinnedPriceActionRef.current ? "price" : "graph")
        manualInteractionUntil = performance.now() + 350
        scheduleFrame()
        return
      }

      const step = 0.12
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        rootGroup.rotation.y -= step
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        rootGroup.rotation.y += step
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        rootGroup.rotation.x -= step
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        rootGroup.rotation.x += step
      } else {
        return
      }

      manualInteractionUntil = performance.now() + 500
      scheduleFrame()
    }

    const onDocumentVisibility = () => {
      documentHidden = document.hidden
      if (!documentHidden) scheduleFrame()
    }

    const onPointerCapabilityChange = (event: MediaQueryListEvent) => {
      supportsFinePointer = event.matches
    }

    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches
      autoRotateRef.current = !reduceMotion
      scheduleFrame()
    }

    const initialise = async () => {
      try {
        const three = await import("three")
        if (disposed) return

        reduceMotion = reduceMotionQuery.matches
        autoRotateRef.current = !reduceMotion

        const palette = getLandingPalette(paletteRoot)
        const fallback = getLandingPaletteFallback()
        const background = colorFromCss(
          three,
          palette.background,
          fallback.background
        )
        const foreground = colorFromCss(
          three,
          palette.foreground,
          fallback.foreground
        )
        const accent = colorFromCss(three, palette.accent, fallback.accent)
        const muted = colorFromCss(three, palette.muted, fallback.muted)
        const edgeColor = muted.clone()

        scene = new three.Scene()
        const camera = new three.PerspectiveCamera(44, 1, 0.1, 100)
        camera.position.set(0, 0.15, 8.4)
        renderer = new three.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.setClearColor(background, 0)
        renderer.domElement.className = styles.canvas
        renderer.domElement.setAttribute("aria-hidden", "true")
        stage.appendChild(renderer.domElement)

        rootGroup = new three.Group()
        rootGroup.rotation.x = -0.1
        scene.add(rootGroup)

        const chartGroup = new three.Group()
        rootGroup.add(chartGroup)
        const tiltGroup = new three.Group()
        scene.remove(rootGroup)
        tiltGroup.add(rootGroup)
        scene.add(tiltGroup)
        const graph: import("three").Vector3[] = []
        const chart: import("three").Vector3[] = []
        const current = new Float32Array(GRAPH_NODE_COUNT * 3)
        const hubIndices = [0, 29, 58, 87]

        for (let index = 0; index < GRAPH_NODE_COUNT; index += 1) {
          // Layered shells make the graph read as a volume instead of a skin.
          const theta = index * Math.PI * (3 - Math.sqrt(5))
          const phi = Math.acos(1 - (2 * (index + 0.5)) / GRAPH_NODE_COUNT)
          const radius = hubIndices.includes(index)
            ? 0.82 + seededRandom(index + 70) * 0.28
            : index % 4 === 0
              ? 1.58 + seededRandom(index + 80) * 0.18
              : 2.38 + seededRandom(index + 90) * 0.18
          const position = new three.Vector3(
            Math.sin(phi) * Math.cos(theta) * radius,
            Math.cos(phi) * radius,
            Math.sin(phi) * Math.sin(theta) * radius
          )
          graph.push(position)
          current[index * 3] = position.x
          current[index * 3 + 1] = position.y
          current[index * 3 + 2] = position.z
        }

        const prices = [
          0.1, 0.38, 0.12, 0.68, 0.46, 0.91, 0.63, 1.18, 0.93, 1.48, 1.22, 1.72,
        ]
        const candleInfo: Array<{
          x: number
          open: number
          close: number
          low: number
          high: number
        }> = []

        for (let candle = 0; candle < CANDLE_COUNT; candle += 1) {
          const x = -3.35 + candle * 0.61
          const center = -1.35 + prices[candle] * 1.7
          const bullish =
            candle === 0 || prices[candle] >= prices[Math.max(0, candle - 1)]
          const body = 0.34 + seededRandom(candle + 300) * 0.32
          const open = center + (bullish ? -body / 2 : body / 2)
          const close = center + (bullish ? body / 2 : -body / 2)
          const low =
            Math.min(open, close) - 0.22 - seededRandom(candle + 400) * 0.18
          const high =
            Math.max(open, close) + 0.22 + seededRandom(candle + 500) * 0.2
          candleInfo.push({ x, open, close, low, high })
          const bottom = Math.min(open, close)
          const top = Math.max(open, close)
          const handle = 0.14
          ;[
            [x, low, 0],
            [x - handle, bottom, 0],
            [x + handle, bottom, 0],
            [x - handle, top, 0],
            [x + handle, top, 0],
            [x, high, 0],
            [x, close, 0.05],
          ].forEach(([a, b, depth]) =>
            chart.push(new three.Vector3(a, b, depth))
          )
        }

        const chartTargets = Array.from(
          { length: GRAPH_NODE_COUNT },
          (_, index) => {
            const progress =
              (index / Math.max(1, GRAPH_NODE_COUNT - 1)) *
              Math.max(0, chart.length - 1)
            const fromIndex = Math.floor(progress)
            const toIndex = Math.min(chart.length - 1, fromIndex + 1)

            return chart[fromIndex]
              .clone()
              .lerp(chart[toIndex], progress - fromIndex)
          }
        )

        const dotCanvas = document.createElement("canvas")
        dotCanvas.width = 128
        dotCanvas.height = 128
        const dotContext = dotCanvas.getContext("2d")
        if (dotContext) {
          dotContext.clearRect(0, 0, 128, 128)
          dotContext.beginPath()
          dotContext.arc(64, 64, 57, 0, Math.PI * 2)
          dotContext.fillStyle = "#fff"
          dotContext.fill()
        }
        dotTexture = new three.CanvasTexture(dotCanvas)
        dotTexture.colorSpace = three.SRGBColorSpace

        nodeGeometry = new three.BufferGeometry()
        nodeGeometry.setAttribute(
          "position",
          new three.BufferAttribute(current, 3)
        )
        const nodeColors = new Float32Array(GRAPH_NODE_COUNT * 3)
        nodeGeometry.setAttribute(
          "color",
          new three.BufferAttribute(nodeColors, 3)
        )
        nodeMaterial = new three.PointsMaterial({
          color: 0xffffff,
          vertexColors: true,
          size: 0.22,
          map: dotTexture,
          transparent: true,
          alphaTest: 0.35,
          opacity: 1,
          sizeAttenuation: true,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        const nodes = new three.Points(nodeGeometry, nodeMaterial)
        nodes.renderOrder = 10
        rootGroup.add(nodes)

        const pairs: Array<[number, number]> = []
        const keys = new Set<string>()
        for (let index = 0; index < GRAPH_NODE_COUNT; index += 1) {
          const nearest: Array<[number, number]> = []
          for (let other = 0; other < GRAPH_NODE_COUNT; other += 1) {
            if (index !== other)
              nearest.push([
                graph[index].distanceToSquared(graph[other]),
                other,
              ])
          }
          nearest.sort((a, b) => a[0] - b[0])
          const neighborCount = hubIndices.includes(index) ? 5 : 2
          for (let neighbor = 0; neighbor < neighborCount; neighbor += 1) {
            const first = Math.min(index, nearest[neighbor][1])
            const second = Math.max(index, nearest[neighbor][1])
            const key = `${first}:${second}`
            if (!keys.has(key)) {
              keys.add(key)
              pairs.push([first, second])
            }
          }
        }
        graphPairs = pairs
        const edgeArray = new Float32Array(pairs.length * 6)
        const edgeColors = new Float32Array(pairs.length * 6)
        edgeGeometry = new three.BufferGeometry()
        edgeGeometry.setAttribute(
          "position",
          new three.BufferAttribute(edgeArray, 3)
        )
        edgeGeometry.setAttribute(
          "color",
          new three.BufferAttribute(edgeColors, 3)
        )
        edgeMaterial = new three.LineBasicMaterial({
          color: 0xffffff,
          vertexColors: true,
          transparent: true,
          opacity: GRAPH_EDGE_OPACITY,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        const graphEdges = new three.LineSegments(edgeGeometry, edgeMaterial)
        graphEdges.renderOrder = 2
        rootGroup.add(graphEdges)

        // Follow real edges so each signal visibly travels through the graph.
        const signalPaths = hubIndices
          .slice(0, SIGNAL_PATH_COUNT)
          .map((start) => {
            const path = [start]
            for (let step = 0; step < 6; step += 1) {
              const last = path[path.length - 1]
              const next = pairs
                .filter(([a, b]) => a === last || b === last)
                .map(([a, b]) => (a === last ? b : a))
                .find((node) => !path.includes(node))
              if (next === undefined) break
              path.push(next)
            }
            return path
          })
        const glowCanvas = document.createElement("canvas")
        glowCanvas.width = glowCanvas.height = 64
        const glowContext = glowCanvas.getContext("2d")
        if (glowContext) {
          const gradient = glowContext.createRadialGradient(
            32,
            32,
            0,
            32,
            32,
            32
          )
          gradient.addColorStop(0, "rgba(255,255,255,1)")
          gradient.addColorStop(0.2, "rgba(255,255,255,0.6)")
          gradient.addColorStop(1, "rgba(255,255,255,0)")
          glowContext.fillStyle = gradient
          glowContext.fillRect(0, 0, 64, 64)
        }
        const glowTexture = new three.CanvasTexture(glowCanvas)
        glowTexture.colorSpace = three.SRGBColorSpace
        const hubPositions = new Float32Array(hubIndices.length * 3)
        const hubGeometry = new three.BufferGeometry()
        hubGeometry.setAttribute(
          "position",
          new three.BufferAttribute(hubPositions, 3)
        )
        const hubMaterial = new three.PointsMaterial({
          color: accent,
          size: 0.5,
          map: glowTexture,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          opacity: 0,
        })
        const hubs = new three.Points(hubGeometry, hubMaterial)
        hubs.renderOrder = 9
        rootGroup.add(hubs)
        const coreGlowGeometry = new three.BufferGeometry().setFromPoints([
          new three.Vector3(0, 0, 0),
        ])
        const coreGlowMaterial = new three.PointsMaterial({
          color: accent,
          size: 4.8,
          map: glowTexture,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          opacity: 0,
        })
        const coreGlow = new three.Points(coreGlowGeometry, coreGlowMaterial)
        coreGlow.renderOrder = 1
        rootGroup.add(coreGlow)
        const glowGeometry = new three.BufferGeometry()
        const glowPositions = new Float32Array(9)
        glowGeometry.setAttribute(
          "position",
          new three.BufferAttribute(glowPositions, 3)
        )
        const glowMaterial = new three.PointsMaterial({
          color: accent,
          size: 0.85,
          map: glowTexture,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          opacity: 0,
        })
        rootGroup.add(new three.Points(glowGeometry, glowMaterial))
        const pulseGeometry = new three.BufferGeometry()
        const pulsePositions = new Float32Array(
          SIGNAL_PATH_COUNT * SIGNAL_TRAIL_LENGTH * 3
        )
        pulseGeometry.setAttribute(
          "position",
          new three.BufferAttribute(pulsePositions, 3)
        )
        const pulseMaterial = new three.PointsMaterial({
          color: accent,
          size: 0.2,
          map: glowTexture,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          opacity: 0,
        })
        const pulse = new three.Points(pulseGeometry, pulseMaterial)
        pulse.frustumCulled = false
        pulse.renderOrder = 11
        rootGroup.add(pulse)

        const candleVertices: number[] = []
        const candleIndices: number[] = []
        candleInfo.forEach((candle) => {
          const bottom = Math.min(candle.open, candle.close)
          const top = Math.max(candle.open, candle.close)
          const handle = 0.14
          const appendFace = (depth: number) => {
            const base = candleVertices.length / 3
            candleVertices.push(
              candle.x,
              candle.low,
              depth,
              candle.x,
              bottom,
              depth,
              candle.x - handle,
              bottom,
              depth,
              candle.x + handle,
              bottom,
              depth,
              candle.x - handle,
              top,
              depth,
              candle.x + handle,
              top,
              depth,
              candle.x,
              candle.high,
              depth,
              candle.x,
              top,
              depth
            )
            candleIndices.push(
              base,
              base + 1,
              base + 2,
              base + 3,
              base + 2,
              base + 4,
              base + 3,
              base + 5,
              base + 4,
              base + 5,
              base + 6,
              base + 7
            )
            return base
          }
          const front = appendFace(0.12)
          const back = appendFace(-0.16)
          candleIndices.push(
            front + 2,
            back + 2,
            front + 3,
            back + 3,
            front + 4,
            back + 4,
            front + 5,
            back + 5
          )
        })
        candleGeometry = new three.BufferGeometry()
        candleGeometry.setAttribute(
          "position",
          new three.Float32BufferAttribute(candleVertices, 3)
        )
        candleGeometry.setIndex(candleIndices)
        candleMaterial = new three.LineBasicMaterial({
          color: muted,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        const candleLines = new three.LineSegments(
          candleGeometry,
          candleMaterial
        )
        candleLines.renderOrder = 4
        chartGroup.add(candleLines)

        priceGeometry = new three.BufferGeometry().setFromPoints(
          candleInfo.map(
            (candle) => new three.Vector3(candle.x, candle.close, 0.2)
          )
        )
        priceMaterial = new three.LineBasicMaterial({
          color: foreground,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        const priceLine = new three.Line(priceGeometry, priceMaterial)
        priceLine.renderOrder = 5
        chartGroup.add(priceLine)

        const comparisonGeometry = new three.BufferGeometry().setFromPoints(
          candleInfo.map(
            (candle, index) =>
              new three.Vector3(
                candle.x,
                candle.close - 0.24 + Math.sin(index * 0.8) * 0.1,
                -0.42
              )
          )
        )
        const comparisonMaterial = new three.LineBasicMaterial({
          color: muted,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        const comparisonLine = new three.Line(
          comparisonGeometry,
          comparisonMaterial
        )
        comparisonLine.renderOrder = 3
        chartGroup.add(comparisonLine)

        const gridVertices: number[] = []
        for (let y = -1.8; y <= 1.8; y += 0.6)
          gridVertices.push(-3.8, y, -0.58, 3.8, y, -0.58)
        for (let x = -3.6; x <= 3.6; x += 1.2)
          gridVertices.push(x, -2, -0.58, x, 2.05, -0.58)
        gridGeometry = new three.BufferGeometry()
        gridGeometry.setAttribute(
          "position",
          new three.Float32BufferAttribute(gridVertices, 3)
        )
        gridMaterial = new three.LineBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        chartGroup.add(new three.LineSegments(gridGeometry, gridMaterial))

        const eventRingGeometry = new three.RingGeometry(0.16, 0.2, 32)
        const eventRingMaterial = new three.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          side: three.DoubleSide,
        })
        const eventCandle = candleInfo[7]
        const eventRing = new three.Mesh(eventRingGeometry, eventRingMaterial)
        eventRing.position.set(eventCandle.x, eventCandle.close, 0.26)
        eventRing.renderOrder = 7
        chartGroup.add(eventRing)

        resources = [
          glowTexture,
          hubGeometry,
          hubMaterial,
          coreGlowGeometry,
          coreGlowMaterial,
          glowGeometry,
          glowMaterial,
          pulseGeometry,
          pulseMaterial,
          nodeGeometry,
          edgeGeometry,
          candleGeometry,
          priceGeometry,
          comparisonGeometry,
          gridGeometry,
          eventRingGeometry,
          nodeMaterial,
          edgeMaterial,
          candleMaterial,
          priceMaterial,
          comparisonMaterial,
          gridMaterial,
          eventRingMaterial,
        ]

        const resize = () => {
          if (!renderer) return
          const bounds = stage.getBoundingClientRect()
          renderer.setSize(
            Math.max(1, bounds.width),
            Math.max(1, bounds.height),
            false
          )
          camera.position.z = bounds.width < 640 ? 9.15 : 8.2
          camera.aspect = bounds.width / Math.max(1, bounds.height)
          camera.updateProjectionMatrix()
          scheduleFrame()
        }

        const edgeDepthPosition = new three.Vector3()
        const edgeDepthColor = new three.Color()
        const updateEdges = () => {
          if (!nodeGeometry || !edgeGeometry || !rootGroup) return
          const activeRootGroup = rootGroup
          const positions = nodeGeometry.attributes.position
            .array as Float32Array
          const edgePositions = edgeGeometry.attributes.position
            .array as Float32Array
          graphPairs.forEach(([first, second], index) => {
            const offset = index * 6
            edgePositions[offset] = positions[first * 3]
            edgePositions[offset + 1] = positions[first * 3 + 1]
            edgePositions[offset + 2] = positions[first * 3 + 2]
            edgePositions[offset + 3] = positions[second * 3]
            edgePositions[offset + 4] = positions[second * 3 + 1]
            edgePositions[offset + 5] = positions[second * 3 + 2]
            for (const [node, colorOffset] of [
              [first, offset],
              [second, offset + 3],
            ] as const) {
              edgeDepthPosition
                .fromArray(positions, node * 3)
                .applyMatrix4(activeRootGroup.matrixWorld)
              const depth = three.MathUtils.clamp(
                (edgeDepthPosition.z + 2.7) / 5.4,
                0,
                1
              )
              edgeDepthColor
                .copy(edgeColor)
                .multiplyScalar(0.28 + depth * 0.72)
                .toArray(edgeColors, colorOffset)
            }
          })
          edgeGeometry.attributes.position.needsUpdate = true
          edgeGeometry.attributes.color.needsUpdate = true
        }

        const onContextLost = (event: Event) => {
          event.preventDefault()
          removeRenderer()
          setInteractiveReady(false)
          setRendererState("fallback")
          setStatus(labels.fallback)
        }

        renderer.domElement.addEventListener(
          "webglcontextlost",
          onContextLost,
          false
        )
        stage.addEventListener("pointerenter", onPointerEnter)
        stage.addEventListener("pointerleave", onPointerLeave)
        stage.addEventListener("pointerdown", onPointerDown)
        stage.addEventListener("pointermove", onPointerMove)
        stage.addEventListener("pointerup", onPointerUp)
        stage.addEventListener("pointercancel", onPointerUp)
        stage.addEventListener("keydown", onKeyDown)
        document.addEventListener("visibilitychange", onDocumentVisibility)
        reduceMotionQuery.addEventListener("change", onReducedMotionChange)
        supportsFinePointer = pointerQuery.matches
        pointerQuery.addEventListener("change", onPointerCapabilityChange)

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(stage)
        visible = false
        intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          if (visible) scheduleFrame()
        })
        intersectionObserver.observe(stage)
        let elapsed = 0
        const depthPosition = new three.Vector3()
        const nodeColor = new three.Color()
        frame = (now) => {
          frameId = 0
          if (disposed || !renderer || !scene || !rootGroup || !nodeGeometry)
            return
          const previous = (frame as { last?: number }).last ?? now
          ;(frame as { last?: number }).last = now
          const delta = Math.min(32, now - previous)
          if (!visible || documentHidden) return
          elapsed += delta
          const nextTarget = targetMode() === "price" ? 1 : 0
          const intro = reduceMotion ? 1 : Math.min(1, elapsed / 1400)
          const currentMorph = (frame as { morph?: number }).morph ?? 0
          const morph = reduceMotion
            ? nextTarget
            : currentMorph +
              (nextTarget - currentMorph) * (1 - Math.pow(0.9, delta / 16.67))
          ;(frame as { morph?: number }).morph = morph

          const positions = nodeGeometry.attributes.position
            .array as Float32Array
          rootGroup.updateWorldMatrix(true, false)
          for (let index = 0; index < GRAPH_NODE_COUNT; index += 1) {
            const graphPosition = graph[index]
            const chartPosition = chartTargets[index]
            const localMorph = reduceMotion
              ? morph
              : three.MathUtils.smoothstep(
                  morph,
                  (index / GRAPH_NODE_COUNT) * 0.2,
                  0.95
                )
            const targetX =
              graphPosition.x + (chartPosition.x - graphPosition.x) * localMorph
            const targetY =
              graphPosition.y + (chartPosition.y - graphPosition.y) * localMorph
            const targetZ =
              graphPosition.z + (chartPosition.z - graphPosition.z) * localMorph
            positions[index * 3] +=
              (targetX - positions[index * 3]) * (reduceMotion ? 1 : 0.18)
            positions[index * 3 + 1] +=
              (targetY - positions[index * 3 + 1]) * (reduceMotion ? 1 : 0.18)
            positions[index * 3 + 2] +=
              (targetZ - positions[index * 3 + 2]) * (reduceMotion ? 1 : 0.18)
            depthPosition
              .fromArray(positions, index * 3)
              .applyMatrix4(rootGroup.matrixWorld)
            const depth = three.MathUtils.clamp(
              (depthPosition.z + 2.5) / 5,
              0,
              1
            )
            const reveal = reduceMotion
              ? 1
              : three.MathUtils.smoothstep(
                  intro,
                  (index / GRAPH_NODE_COUNT) * 0.3,
                  0.5
                )
            nodeColor
              .copy(foreground)
              .multiplyScalar((0.3 + depth * 0.7) * reveal)
            nodeColor.toArray(nodeColors, index * 3)
          }
          nodeGeometry.attributes.position.needsUpdate = true
          nodeGeometry.attributes.color.needsUpdate = true
          hubIndices.forEach((node, hub) => {
            hubPositions[hub * 3] = positions[node * 3]
            hubPositions[hub * 3 + 1] = positions[node * 3 + 1]
            hubPositions[hub * 3 + 2] = positions[node * 3 + 2]
          })
          hubGeometry.attributes.position.needsUpdate = true
          hubMaterial.opacity = (1 - morph) * intro * 0.78
          coreGlowMaterial.opacity =
            (1 - morph) * intro * (0.055 + Math.sin(elapsed * 0.0015) * 0.012)
          updateEdges()
          edgeGeometry?.setDrawRange(
            0,
            Math.floor(
              three.MathUtils.smoothstep(intro, 0.3, 0.8) * pairs.length
            ) * 2
          )
          const chartReveal = reduceMotion
            ? morph
            : three.MathUtils.smoothstep(morph, 0.5, 0.98)
          candleGeometry?.setDrawRange(
            0,
            Math.floor(chartReveal * CANDLE_COUNT) * CANDLE_INDEX_COUNT
          )
          priceGeometry?.setDrawRange(0, Math.ceil(chartReveal * CANDLE_COUNT))
          if (edgeMaterial)
            edgeMaterial.opacity = GRAPH_EDGE_OPACITY * 0.62 * (1 - morph)
          if (candleMaterial) candleMaterial.opacity = 0.78 * morph
          if (priceMaterial) priceMaterial.opacity = 0.92 * morph
          comparisonMaterial.opacity = 0.28 * morph
          if (gridMaterial) gridMaterial.opacity = 0.14 * morph
          if (nodeMaterial) nodeMaterial.size = 0.2 - 0.08 * morph
          eventRingMaterial.opacity = reduceMotion
            ? 0.5 * morph
            : (0.34 + Math.sin(elapsed * 0.004) * 0.2) * morph
          const eventScale = reduceMotion
            ? 1.35
            : 1.15 + (Math.sin(elapsed * 0.003) + 1) * 0.32
          eventRing.scale.setScalar(eventScale)
          const signalTime =
            Math.max(0, elapsed - 1000) / (supportsFinePointer ? 650 : 1000)
          const pricePositions = priceGeometry?.attributes.position.array as
            Float32Array | undefined
          pulsePositions.fill(99)
          glowPositions.fill(99)
          let signalOpacity = 0
          signalPaths.forEach((signalPath, pathIndex) => {
            const signalStep =
              (signalTime + pathIndex * 0.9) % (signalPath.length + 2)
            const priceSignalStep =
              (signalTime + pathIndex * 3.8) % (CANDLE_COUNT + 2)
            const graphSignalActive = signalStep < signalPath.length - 1
            const priceSignalActive =
              pricePositions !== undefined && priceSignalStep < CANDLE_COUNT - 1
            const pathOpacity =
              (1 - morph) * (graphSignalActive ? 1 : 0) +
              morph * (priceSignalActive ? 1 : 0)
            signalOpacity = Math.max(signalOpacity, pathOpacity)

            if (!reduceMotion && graphSignalActive) {
              const segment = Math.floor(signalStep)
              const fraction = signalStep - segment
              for (let endpoint = 0; endpoint < 2; endpoint += 1) {
                const index = signalPath[segment + endpoint]
                nodeColor
                  .fromArray(nodeColors, index * 3)
                  .lerp(
                    accent,
                    (endpoint === 0 ? 1 - fraction : fraction) *
                      (1 - morph) *
                      three.MathUtils.smoothstep(intro, 0.7, 1)
                  )
                nodeColor.toArray(nodeColors, index * 3)
              }
            }

            if (pathOpacity <= 0.02) return
            for (let trail = 0; trail < SIGNAL_TRAIL_LENGTH; trail += 1) {
              const graphProgress = three.MathUtils.clamp(
                signalStep - trail * 0.045,
                0,
                signalPath.length - 1.001
              )
              const graphSegment = Math.floor(graphProgress)
              const graphFrom = signalPath[graphSegment] * 3
              const graphTo = signalPath[graphSegment + 1] * 3
              const graphFraction = graphProgress - graphSegment
              const priceProgress = three.MathUtils.clamp(
                priceSignalStep - trail * 0.045,
                0,
                CANDLE_COUNT - 1.001
              )
              const priceSegment = Math.floor(priceProgress)
              const priceFrom = priceSegment * 3
              const priceTo = (priceSegment + 1) * 3
              const priceFraction = priceProgress - priceSegment
              const dot = pathIndex * SIGNAL_TRAIL_LENGTH + trail
              for (let axis = 0; axis < 3; axis += 1) {
                const graphPoint =
                  positions[graphFrom + axis] +
                  (positions[graphTo + axis] - positions[graphFrom + axis]) *
                    graphFraction
                const pricePoint = pricePositions
                  ? pricePositions[priceFrom + axis] +
                    (pricePositions[priceTo + axis] -
                      pricePositions[priceFrom + axis]) *
                      priceFraction
                  : graphPoint
                pulsePositions[dot * 3 + axis] =
                  graphPoint * (1 - morph) + pricePoint * morph
                if (trail === 0)
                  glowPositions[pathIndex * 3 + axis] =
                    pulsePositions[dot * 3 + axis]
              }
            }
          })
          nodeGeometry.attributes.color.needsUpdate = true
          pulseGeometry.attributes.position.needsUpdate = true
          pulseMaterial.opacity = !reduceMotion
            ? signalOpacity * three.MathUtils.smoothstep(intro, 0.7, 1)
            : 0
          glowGeometry.attributes.position.needsUpdate = true
          glowMaterial.opacity = signalOpacity * intro * 0.62
          glowMaterial.size = 0.85
          const tiltAmount = reduceMotion || pointerDown ? 0 : 0.14
          tiltGroup.rotation.x +=
            (-pointerY * tiltAmount - tiltGroup.rotation.x) *
            (reduceMotion ? 1 : 0.08)
          tiltGroup.rotation.y +=
            (pointerX * tiltAmount - tiltGroup.rotation.y) *
            (reduceMotion ? 1 : 0.08)
          if (autoRotateRef.current && !pointerDown && rootGroup) {
            const graphWeight = 1 - morph
            const chartWeight = morph
            rootGroup.rotation.y +=
              (0.0034 * graphWeight + 0.00045 * chartWeight) * (delta / 16.67)
          }
          renderer.render(scene, camera)

          const needsMotion =
            (!reduceMotion && intro < 1) ||
            autoRotateRef.current ||
            pointerDown ||
            Math.abs(nextTarget - morph) > 0.002 ||
            manualInteractionUntil > now
          if (visible && !documentHidden && needsMotion && frame)
            frameId = requestAnimationFrame(frame)
        }

        resize()
        rendererReadyRef.current = true
        setInteractiveReady(true)
        setRendererState("ready")
        setStatus(labels.ready)
        scheduleFrame()

        const cleanup = () => {
          resizeObserver.disconnect()
          intersectionObserver?.disconnect()
          intersectionObserver = null
          stage.removeEventListener("pointerenter", onPointerEnter)
          stage.removeEventListener("pointerleave", onPointerLeave)
          stage.removeEventListener("pointerdown", onPointerDown)
          stage.removeEventListener("pointermove", onPointerMove)
          stage.removeEventListener("pointerup", onPointerUp)
          stage.removeEventListener("pointercancel", onPointerUp)
          stage.removeEventListener("keydown", onKeyDown)
          document.removeEventListener("visibilitychange", onDocumentVisibility)
          reduceMotionQuery.removeEventListener("change", onReducedMotionChange)
          pointerQuery.removeEventListener("change", onPointerCapabilityChange)
          renderer?.domElement.removeEventListener(
            "webglcontextlost",
            onContextLost
          )
          removeRenderer()
          setInteractiveReady(false)
        }

        ;(
          stage as HTMLDivElement & { __landingContextCleanup?: () => void }
        ).__landingContextCleanup = cleanup
      } catch {
        if (disposed) return
        removeRenderer()
        setInteractiveReady(false)
        setRendererState("fallback")
        setStatus(labels.fallback)
      }
    }

    initialise()

    return () => {
      disposed = true
      const cleanup = (
        stage as HTMLDivElement & { __landingContextCleanup?: () => void }
      ).__landingContextCleanup
      cleanup?.()
      delete (
        stage as HTMLDivElement & { __landingContextCleanup?: () => void }
      ).__landingContextCleanup
      if (frameId) cancelAnimationFrame(frameId)
      reduceMotionQuery.removeEventListener("change", onReducedMotionChange)
    }
  }, [labels])

  return (
    <figure
      data-landing-visual="context-figure"
      aria-labelledby="landing-context-figure-title"
      aria-describedby="landing-context-figure-description"
      className={styles.figure}
    >
      <figcaption className="sr-only">
        <span id="landing-context-figure-title" className="sr-only">
          {labels.title}
        </span>
        <span id="landing-context-figure-description" className="sr-only">
          {labels.description}
        </span>
      </figcaption>

      <div
        ref={stageRef}
        data-context-stage="interactive"
        data-context-mode={mode}
        data-enhanced={interactiveReady ? "true" : "false"}
        data-renderer-state={rendererState}
        data-dragging="false"
        className={styles.stage}
        tabIndex={interactiveReady ? 0 : undefined}
        role={interactiveReady ? "group" : undefined}
        aria-labelledby={
          interactiveReady ? "landing-context-figure-title" : undefined
        }
        aria-describedby={
          interactiveReady
            ? "landing-context-figure-description landing-context-figure-instructions"
            : undefined
        }
      ></div>

      <p id="landing-context-figure-instructions" className="sr-only">
        {labels.keyboardHint}
      </p>
      <p aria-live="polite" className="sr-only" data-context-status>
        {status}
      </p>
    </figure>
  )
}
