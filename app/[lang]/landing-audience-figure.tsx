"use client"

import { useEffect, useRef } from "react"

import styles from "./landing-page.module.css"

type Layout = {
  positions: Float32Array
  edges: Array<[number, number]>
  signals: number[][]
}

const NODE_COUNT = 48
const MAX_EDGES = 96
const TRAIL_LENGTH = 3
const MAX_SIGNALS = 4

function setPoint(
  positions: Float32Array,
  index: number,
  x: number,
  y: number,
  z: number
) {
  positions[index * 3] = x
  positions[index * 3 + 1] = y
  positions[index * 3 + 2] = z
}

function createRingLayout(
  centers: Array<[number, number, number]>,
  radius: number,
  connectRings: boolean
) {
  const positions = new Float32Array(NODE_COUNT * 3)
  const edges: Array<[number, number]> = []
  const pointsPerRing = NODE_COUNT / centers.length

  centers.forEach(([centerX, centerY, centerZ], ring) => {
    for (let point = 0; point < pointsPerRing; point += 1) {
      const index = ring * pointsPerRing + point
      const angle = (point / pointsPerRing) * Math.PI * 2
      setPoint(
        positions,
        index,
        centerX,
        centerY + Math.sin(angle) * radius,
        centerZ + Math.cos(angle) * radius
      )
      edges.push([index, ring * pointsPerRing + ((point + 1) % pointsPerRing)])
      if (connectRings && ring > 0)
        edges.push([(ring - 1) * pointsPerRing + point, index])
    }
  })

  return { positions, edges, pointsPerRing }
}

function createLayouts(): Layout[] {
  const traderPositions = new Float32Array(NODE_COUNT * 3)
  const traderEdges: Array<[number, number]> = []
  for (let layer = 0; layer < 4; layer += 1) {
    for (let point = 0; point < 12; point += 1) {
      const index = layer * 12 + point
      const wave =
        Math.sin(point * 0.92 + layer * 0.42) * 0.38 + point * 0.115 - 0.6
      setPoint(
        traderPositions,
        index,
        -3.25 + point * 0.59,
        wave + layer * 0.14,
        (layer - 1.5) * 0.62
      )
      if (point > 0) traderEdges.push([index - 1, index])
      if (layer > 0 && point % 3 === 0) traderEdges.push([index - 12, index])
    }
  }

  const analystPositions = new Float32Array(NODE_COUNT * 3)
  const analystEdges: Array<[number, number]> = []
  // Two rims and a solid-outline handle keep the lens readable as a 3D wireframe.
  for (let rim = 0; rim < 2; rim += 1) {
    for (let point = 0; point < 20; point += 1) {
      const index = rim * 20 + point
      const angle = (point / 20) * Math.PI * 2
      setPoint(
        analystPositions,
        index,
        -0.55 + Math.cos(angle) * 1.4,
        0.45 + Math.sin(angle) * 1.4,
        rim === 0 ? 0.22 : -0.22
      )
      analystEdges.push([index, rim * 20 + ((point + 1) % 20)])
      if (rim === 1 && point % 2 === 0) analystEdges.push([point, index])
    }
  }
  for (let end = 0; end < 2; end += 1) {
    for (let corner = 0; corner < 4; corner += 1) {
      const index = 40 + end * 4 + corner
      const distance = end === 0 ? 1.36 : 3.1
      const side = corner < 2 ? -0.2 : 0.2
      setPoint(
        analystPositions,
        index,
        -0.55 + (distance + side) / Math.SQRT2,
        0.45 + (-distance + side) / Math.SQRT2,
        corner === 0 || corner === 3 ? 0.22 : -0.22
      )
      analystEdges.push([index, 40 + end * 4 + ((corner + 1) % 4)])
      if (end === 1) analystEdges.push([index - 4, index])
    }
  }

  const developer = createRingLayout(
    [
      [-3, 0, 0],
      [-1, 0, 0],
      [1, 0, 0],
      [3, 0, 0],
    ],
    0.88,
    true
  )

  const teamPositions = new Float32Array(NODE_COUNT * 3)
  const teamEdges: Array<[number, number]> = []
  const teamSignals: number[][] = []
  const teamCenters: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.74],
    [-2.15, 1.25, -0.55, 0.42],
    [2.15, 1.25, 0.55, 0.42],
    [-2.15, -1.25, 0.55, 0.42],
    [2.15, -1.25, -0.55, 0.42],
  ]
  teamCenters.forEach(([centerX, centerY, centerZ, half], cluster) => {
    const base = cluster * 8
    for (let corner = 0; corner < 8; corner += 1) {
      const index = base + corner
      setPoint(
        teamPositions,
        index,
        centerX + (corner & 1 ? half : -half),
        centerY + (corner & 2 ? half : -half),
        centerZ + (corner & 4 ? half : -half)
      )
      for (let axis = 0; axis < 3; axis += 1) {
        const neighbor = corner ^ (1 << axis)
        if (neighbor > corner) teamEdges.push([index, base + neighbor])
      }
    }
  })
  teamCenters.slice(1).forEach(([centerX, centerY, centerZ], channel) => {
    const satelliteBase = (channel + 1) * 8
    const innerCorner =
      (centerX < 0 ? 1 : 0) | (centerY < 0 ? 2 : 0) | (centerZ < 0 ? 4 : 0)
    const outerCorner = innerCorner ^ 7
    const centerCorner = outerCorner
    const route = [centerCorner, satelliteBase + innerCorner]
    let corner = innerCorner
    for (let axis = 0; axis < 3; axis += 1) {
      corner ^= 1 << axis
      route.push(satelliteBase + corner)
    }

    const distance = Math.hypot(centerX, centerY)
    const endpoint = 40 + channel * 2
    setPoint(
      teamPositions,
      endpoint,
      (centerX / distance) * 3.15,
      (centerY / distance) * 3.15,
      centerZ * 1.18
    )
    setPoint(
      teamPositions,
      endpoint + 1,
      (centerX / distance) * 3.58,
      (centerY / distance) * 3.58,
      centerZ * 1.34
    )
    teamEdges.push(
      [centerCorner, satelliteBase + innerCorner],
      [satelliteBase + outerCorner, endpoint],
      [endpoint, endpoint + 1]
    )
    teamSignals.push([...route, endpoint, endpoint + 1])
  })

  return [
    {
      positions: traderPositions,
      edges: traderEdges,
      signals: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
    },
    {
      positions: analystPositions,
      edges: analystEdges,
      signals: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 20],
      ],
    },
    {
      positions: developer.positions,
      edges: developer.edges,
      signals: [[0, 12, 24, 36, 37, 38, 39]],
    },
    {
      positions: teamPositions,
      edges: teamEdges,
      signals: teamSignals,
    },
  ]
}

function resolveColor(
  three: typeof import("three"),
  root: HTMLElement,
  variable: string,
  fallback: number
) {
  const probe = document.createElement("span")
  probe.style.color = `var(${variable})`
  probe.style.display = "none"
  root.appendChild(probe)
  const value = getComputedStyle(probe).color
  probe.remove()

  try {
    return new three.Color(value || fallback)
  } catch {
    return new three.Color(fallback)
  }
}

export function LandingAudienceFigure({
  activeIndex,
  title,
}: {
  activeIndex: number
  title: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(activeIndex)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    let disposed = false
    let frameId = 0
    let visible = false
    let documentHidden = document.hidden
    let pointerX = 0
    let pointerY = 0
    let renderer: import("three").WebGLRenderer | null = null
    const resources: Array<{ dispose: () => void }> = []
    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )
    let reduceMotion = reduceMotionQuery.matches

    const initialise = async () => {
      try {
        const three = await import("three")
        if (disposed) return

        const surface =
          stage.closest<HTMLElement>("[data-landing-surface]") ?? stage
        const foreground = resolveColor(
          three,
          surface,
          "--foreground",
          0xeafdf8
        )
        const accent = resolveColor(three, surface, "--chart-2", 0x12d6b1)
        const muted = resolveColor(
          three,
          surface,
          "--muted-foreground",
          0xa6c4bf
        )
        const layouts = createLayouts()
        const scene = new three.Scene()
        const camera = new three.PerspectiveCamera(44, 1, 0.1, 100)
        camera.position.set(0, 0, 9.2)

        renderer = new three.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setClearAlpha(0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.outputColorSpace = three.SRGBColorSpace
        stage.appendChild(renderer.domElement)

        const tiltGroup = new three.Group()
        const rootGroup = new three.Group()
        rootGroup.rotation.set(-0.12, -0.28, 0)
        tiltGroup.add(rootGroup)
        scene.add(tiltGroup)

        const dotCanvas = document.createElement("canvas")
        dotCanvas.width = dotCanvas.height = 64
        const dotContext = dotCanvas.getContext("2d")
        if (dotContext) {
          const gradient = dotContext.createRadialGradient(
            32,
            32,
            1,
            32,
            32,
            32
          )
          gradient.addColorStop(0, "rgba(255,255,255,1)")
          gradient.addColorStop(0.25, "rgba(255,255,255,0.85)")
          gradient.addColorStop(1, "rgba(255,255,255,0)")
          dotContext.fillStyle = gradient
          dotContext.fillRect(0, 0, 64, 64)
        }
        const dotTexture = new three.CanvasTexture(dotCanvas)

        const nodePositions = layouts[0].positions.slice()
        const nodeColors = new Float32Array(NODE_COUNT * 3)
        const nodeGeometry = new three.BufferGeometry()
        nodeGeometry.setAttribute(
          "position",
          new three.BufferAttribute(nodePositions, 3)
        )
        nodeGeometry.setAttribute(
          "color",
          new three.BufferAttribute(nodeColors, 3)
        )
        const nodeMaterial = new three.PointsMaterial({
          size: 0.22,
          map: dotTexture,
          transparent: true,
          depthWrite: false,
          vertexColors: true,
        })
        rootGroup.add(new three.Points(nodeGeometry, nodeMaterial))

        const edgePositions = new Float32Array(MAX_EDGES * 6)
        const edgeGeometry = new three.BufferGeometry()
        edgeGeometry.setAttribute(
          "position",
          new three.BufferAttribute(edgePositions, 3)
        )
        const edgeMaterial = new three.LineBasicMaterial({
          color: muted,
          transparent: true,
          opacity: 0.52,
        })
        rootGroup.add(new three.LineSegments(edgeGeometry, edgeMaterial))

        const pulsePositions = new Float32Array(MAX_SIGNALS * TRAIL_LENGTH * 3)
        const pulseGeometry = new three.BufferGeometry()
        pulseGeometry.setAttribute(
          "position",
          new three.BufferAttribute(pulsePositions, 3)
        )
        const pulseMaterial = new three.PointsMaterial({
          color: accent,
          size: 0.48,
          map: dotTexture,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          opacity: reduceMotion ? 0 : 0.9,
        })
        const pulses = new three.Points(pulseGeometry, pulseMaterial)
        pulses.renderOrder = 4
        rootGroup.add(pulses)

        const boxSourceGeometry = new three.BoxGeometry(7.4, 4.8, 3.8)
        const boxGeometry = new three.EdgesGeometry(boxSourceGeometry)
        const boxMaterial = new three.LineBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0.18,
        })
        rootGroup.add(new three.LineSegments(boxGeometry, boxMaterial))

        resources.push(
          dotTexture,
          nodeGeometry,
          nodeMaterial,
          edgeGeometry,
          edgeMaterial,
          pulseGeometry,
          pulseMaterial,
          boxSourceGeometry,
          boxGeometry,
          boxMaterial
        )

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
        }
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(stage)

        const intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          if (visible && !frameId) frameId = requestAnimationFrame(frame)
        })
        intersectionObserver.observe(stage)

        const onPointerMove = (event: PointerEvent) => {
          const bounds = stage.getBoundingClientRect()
          pointerX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
          pointerY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1
        }
        const onPointerLeave = () => {
          pointerX = 0
          pointerY = 0
        }
        const onVisibilityChange = () => {
          documentHidden = document.hidden
          if (!documentHidden && visible && !frameId)
            frameId = requestAnimationFrame(frame)
        }
        const onReducedMotionChange = (event: MediaQueryListEvent) => {
          reduceMotion = event.matches
          pulseMaterial.opacity = reduceMotion ? 0 : 0.9
        }
        stage.addEventListener("pointermove", onPointerMove)
        stage.addEventListener("pointerleave", onPointerLeave)
        document.addEventListener("visibilitychange", onVisibilityChange)
        reduceMotionQuery.addEventListener("change", onReducedMotionChange)

        let elapsed = 0
        let previous = performance.now()
        let currentLayoutIndex = 0
        let currentLayout = layouts[0]
        let activeNodes = new Set(currentLayout.signals.flat())
        const nodeColor = new three.Color()
        function frame(now: number) {
          frameId = 0
          if (disposed || !renderer || !visible || documentHidden) return
          const delta = Math.min(32, now - previous)
          previous = now
          elapsed += delta
          const nextLayoutIndex = activeIndexRef.current
          if (nextLayoutIndex !== currentLayoutIndex) {
            currentLayoutIndex = nextLayoutIndex
            currentLayout = layouts[currentLayoutIndex] ?? layouts[0]
            activeNodes = new Set(currentLayout.signals.flat())
            elapsed = 0
          }
          let settling = false

          for (let index = 0; index < NODE_COUNT; index += 1) {
            const offset = index * 3
            for (let axis = 0; axis < 3; axis += 1) {
              const distance =
                currentLayout.positions[offset + axis] -
                nodePositions[offset + axis]
              if (Math.abs(distance) > 0.002) settling = true
              nodePositions[offset + axis] +=
                distance *
                (reduceMotion ? 1 : 1 - Math.pow(0.89, delta / 16.67))
            }
            nodeColor
              .copy(activeNodes.has(index) ? accent : foreground)
              .multiplyScalar(activeNodes.has(index) ? 0.95 : 0.52)
            nodeColor.toArray(nodeColors, offset)
          }
          nodeGeometry.attributes.position.needsUpdate = true
          nodeGeometry.attributes.color.needsUpdate = true

          const edges = currentLayout.edges.slice(0, MAX_EDGES)
          for (let edge = 0; edge < MAX_EDGES; edge += 1) {
            const [from, to] = edges[edge] ?? [0, 0]
            for (let axis = 0; axis < 3; axis += 1) {
              edgePositions[edge * 6 + axis] = nodePositions[from * 3 + axis]
              edgePositions[edge * 6 + 3 + axis] = nodePositions[to * 3 + axis]
            }
          }
          edgeGeometry.attributes.position.needsUpdate = true
          edgeGeometry.setDrawRange(0, edges.length * 2)

          pulsePositions.fill(99)
          if (!reduceMotion) {
            currentLayout.signals
              .slice(0, MAX_SIGNALS)
              .forEach((path, signal) => {
                const progress =
                  (elapsed / 760 + signal * 0.37) % Math.max(2, path.length + 1)
                for (let trail = 0; trail < TRAIL_LENGTH; trail += 1) {
                  const local = progress - trail * 0.09
                  if (local < 0 || local >= path.length - 1) continue
                  const segment = Math.floor(local)
                  const fraction = local - segment
                  const from = path[segment]
                  const to = path[segment + 1]
                  const pulseOffset = (signal * TRAIL_LENGTH + trail) * 3
                  for (let axis = 0; axis < 3; axis += 1) {
                    const start = nodePositions[from * 3 + axis]
                    pulsePositions[pulseOffset + axis] =
                      start + (nodePositions[to * 3 + axis] - start) * fraction
                  }
                }
              })
          }
          pulseGeometry.attributes.position.needsUpdate = true

          const tilt = reduceMotion ? 0 : 0.12
          tiltGroup.rotation.x +=
            (-pointerY * tilt - tiltGroup.rotation.x) * 0.07
          tiltGroup.rotation.y +=
            (pointerX * tilt - tiltGroup.rotation.y) * 0.07
          if (currentLayoutIndex === 1) {
            const targetRotation =
              -0.28 + (reduceMotion ? 0 : Math.sin(elapsed / 2600) * 0.16)
            const rotationDelta = Math.atan2(
              Math.sin(targetRotation - rootGroup.rotation.y),
              Math.cos(targetRotation - rootGroup.rotation.y)
            )
            rootGroup.rotation.y +=
              rotationDelta *
              (reduceMotion ? 1 : 1 - Math.pow(0.92, delta / 16.67))
          } else if (!reduceMotion) {
            rootGroup.rotation.y += 0.00055 * (delta / 16.67)
          }
          edgeMaterial.opacity = settling ? 0.4 : 0.52
          renderer.render(scene, camera)
          frameId = requestAnimationFrame(frame)
        }

        resize()
        frameId = requestAnimationFrame(frame)

        return () => {
          resizeObserver.disconnect()
          intersectionObserver.disconnect()
          stage.removeEventListener("pointermove", onPointerMove)
          stage.removeEventListener("pointerleave", onPointerLeave)
          document.removeEventListener("visibilitychange", onVisibilityChange)
          reduceMotionQuery.removeEventListener("change", onReducedMotionChange)
        }
      } catch {
        // The visual is decorative; copy remains usable if WebGL is unavailable.
      }
    }

    let cleanup: (() => void) | undefined
    void initialise().then((result) => {
      if (disposed) result?.()
      else cleanup = result
    })

    return () => {
      disposed = true
      cleanup?.()
      if (frameId) cancelAnimationFrame(frameId)
      resources.forEach((resource) => resource.dispose())
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [])

  return (
    <div
      data-landing-visual="audience-figure"
      className={styles.audienceVisual}
      aria-hidden="true"
    >
      <div ref={stageRef} className={styles.audienceVisualStage} />
      <span className={styles.audienceVisualCorners} />
      <span className={styles.audienceVisualTitle}>{title}</span>
    </div>
  )
}
