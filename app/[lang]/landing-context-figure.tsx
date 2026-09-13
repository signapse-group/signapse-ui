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

const GRAPH_NODE_COUNT = 84
const CANDLE_COUNT = 12
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
      pointerDown = false
      dragging = false
      activePointer = null
      stage.dataset.dragging = "false"
      if (stage.hasPointerCapture(event.pointerId))
        stage.releasePointerCapture(event.pointerId)
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

        for (let index = 0; index < GRAPH_NODE_COUNT; index += 1) {
          // Evenly distribute nodes across a sphere using the golden angle.
          const theta = index * Math.PI * (3 - Math.sqrt(5))
          const phi = Math.acos(1 - (2 * (index + 0.5)) / GRAPH_NODE_COUNT)
          const radius = 2.2
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
          for (let neighbor = 0; neighbor < 2; neighbor += 1) {
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
        edgeGeometry = new three.BufferGeometry()
        edgeGeometry.setAttribute(
          "position",
          new three.BufferAttribute(edgeArray, 3)
        )
        edgeMaterial = new three.LineBasicMaterial({
          color: edgeColor,
          transparent: true,
          opacity: GRAPH_EDGE_OPACITY,
          depthTest: false,
          depthWrite: false,
          fog: false,
        })
        const graphEdges = new three.LineSegments(edgeGeometry, edgeMaterial)
        graphEdges.renderOrder = 2
        rootGroup.add(graphEdges)

        // Follow connected edges so each pulse reads as a signal, not random noise.
        const signalPath = [0]
        for (let step = 0; step < 5; step += 1) {
          const last = signalPath[signalPath.length - 1]
          const next = pairs
            .filter(([a, b]) => a === last || b === last)
            .map(([a, b]) => (a === last ? b : a))
            .find((node) => !signalPath.includes(node))
          if (next === undefined) break
          signalPath.push(next)
        }
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
        const pulsePositions = new Float32Array(18)
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
          const base = candleVertices.length / 3
          candleVertices.push(
            candle.x,
            candle.low,
            0,
            candle.x,
            bottom,
            0,
            candle.x - handle,
            bottom,
            0,
            candle.x + handle,
            bottom,
            0,
            candle.x - handle,
            top,
            0,
            candle.x + handle,
            top,
            0,
            candle.x,
            candle.high,
            0,
            candle.x,
            top,
            0
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
            (candle) => new three.Vector3(candle.x, candle.close, 0.08)
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

        const gridVertices: number[] = []
        for (let y = -1.8; y <= 1.8; y += 0.6)
          gridVertices.push(-3.8, y, -0.1, 3.8, y, -0.1)
        for (let x = -3.6; x <= 3.6; x += 1.2)
          gridVertices.push(x, -2, -0.1, x, 2.05, -0.1)
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

        resources = [
          glowTexture,
          glowGeometry,
          glowMaterial,
          pulseGeometry,
          pulseMaterial,
          nodeGeometry,
          edgeGeometry,
          candleGeometry,
          priceGeometry,
          gridGeometry,
          nodeMaterial,
          edgeMaterial,
          candleMaterial,
          priceMaterial,
          gridMaterial,
        ]

        const resize = () => {
          if (!renderer) return
          const bounds = stage.getBoundingClientRect()
          renderer.setSize(
            Math.max(1, bounds.width),
            Math.max(1, bounds.height),
            false
          )
          camera.aspect = bounds.width / Math.max(1, bounds.height)
          camera.updateProjectionMatrix()
          scheduleFrame()
        }

        const updateEdges = () => {
          if (!nodeGeometry || !edgeGeometry) return
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
          })
          edgeGeometry.attributes.position.needsUpdate = true
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
        let transition = 0
        let lastTarget = 0
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
          if (nextTarget !== lastTarget) transition = 0
          lastTarget = nextTarget
          transition += delta
          const intro = reduceMotion ? 1 : Math.min(1, elapsed / 1400)
          const gather =
            nextTarget && !reduceMotion
              ? Math.sin(Math.min(1, transition / 320) * Math.PI) * 0.16
              : 0
          const morphTarget =
            nextTarget && transition < 320 && !reduceMotion ? 0 : nextTarget
          const currentMorph = (frame as { morph?: number }).morph ?? 0
          const morph = reduceMotion
            ? nextTarget
            : currentMorph +
              (morphTarget - currentMorph) * (1 - Math.pow(0.9, delta / 16.67))
          ;(frame as { morph?: number }).morph = morph

          const positions = nodeGeometry.attributes.position
            .array as Float32Array
          rootGroup.updateWorldMatrix(true, false)
          for (let index = 0; index < GRAPH_NODE_COUNT; index += 1) {
            const graphPosition = graph[index]
            const chartPosition = chart[index]
            const localMorph = reduceMotion
              ? morph
              : three.MathUtils.smoothstep(
                  morph,
                  (index / GRAPH_NODE_COUNT) * 0.2,
                  0.95
                )
            const targetX =
              (graphPosition.x +
                (chartPosition.x - graphPosition.x) * localMorph) *
              (1 - gather)
            const targetY =
              (graphPosition.y +
                (chartPosition.y - graphPosition.y) * localMorph) *
              (1 - gather)
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
            Math.floor(chartReveal * CANDLE_COUNT) * 12
          )
          priceGeometry?.setDrawRange(0, Math.ceil(chartReveal * CANDLE_COUNT))
          if (edgeMaterial)
            edgeMaterial.opacity = GRAPH_EDGE_OPACITY * 0.55 * (1 - morph)
          if (candleMaterial) candleMaterial.opacity = 0.72 * morph
          if (priceMaterial) priceMaterial.opacity = 0.92 * morph
          if (gridMaterial) gridMaterial.opacity = 0.11 * morph
          if (nodeMaterial) nodeMaterial.size = 0.22 - 0.1 * morph
          const signalTime =
            Math.max(0, elapsed - 1000) / (supportsFinePointer ? 650 : 1000)
          const signalStep = signalTime % (signalPath.length + 2)
          if (!reduceMotion && signalStep < signalPath.length - 1) {
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
          for (let dot = 0; dot < 6; dot += 1) {
            const progress = Math.max(0, signalStep - dot * 0.045)
            const segment = Math.min(
              signalPath.length - 2,
              Math.floor(progress)
            )
            const from = signalPath[segment] * 3
            const to = signalPath[segment + 1] * 3
            const fraction = Math.min(1, progress - segment)
            for (let axis = 0; axis < 3; axis += 1)
              pulsePositions[dot * 3 + axis] =
                positions[from + axis] +
                (positions[to + axis] - positions[from + axis]) * fraction
          }
          pulseGeometry.attributes.position.needsUpdate = true
          pulseMaterial.opacity =
            !reduceMotion && signalStep < signalPath.length - 1
              ? (1 - morph) * three.MathUtils.smoothstep(intro, 0.7, 1)
              : 0
          for (let hub = 0; hub < 3; hub += 1) {
            const node = signalPath[Math.min(hub, signalPath.length - 1)]
            glowPositions.set(
              positions.subarray(node * 3, node * 3 + 3),
              hub * 3
            )
          }
          glowGeometry.attributes.position.needsUpdate = true
          glowMaterial.opacity = (1 - morph) * intro * 0.65
          glowMaterial.size = 0.85 + gather * 2
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
      >
        <div
          className={styles.fallback}
          aria-hidden={interactiveReady}
          data-figure-fallback
        >
          <div className={styles.fallbackView}>
            <div className={styles.fallbackGraph} aria-hidden="true">
              <div className={styles.graphCluster}>
                <span className={styles.graphNode} />
                <span className={styles.graphNode} />
                <span className={styles.graphNode} />
                <span className={styles.graphNode} />
                <span className={styles.graphNode} />
              </div>
            </div>
          </div>
          <div className={styles.fallbackView}>
            <div className={styles.fallbackPrice} aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <span className={styles.priceBar} key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p id="landing-context-figure-instructions" className="sr-only">
        {labels.keyboardHint}
      </p>
      <p aria-live="polite" className="sr-only" data-context-status>
        {status}
      </p>
    </figure>
  )
}
