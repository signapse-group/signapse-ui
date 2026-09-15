"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import {
  animate,
  LazyMotion,
  domAnimation,
  m,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react"
import { MousePointer2Icon } from "lucide-react"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  TELEGRAM_DEMO_DURATION,
  TELEGRAM_DEMO_FINAL_FRAME,
  getTelegramDemoCursor,
  getTelegramDemoFrame,
} from "./landing-scheduled-telegram-demo-model"
import { LandingTelegramWindows } from "./landing-telegram-windows"
import styles from "./landing-feature-showcase.module.css"

export function LandingScheduledTelegramDemo({
  active,
  labels,
  locale,
  progressRef,
}: {
  active: boolean
  labels: Dictionary["landing"]["showcase"]["telegram"]
  locale: AppLocale
  progressRef: RefObject<SVGCircleElement | null>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isInView = useInView(rootRef, { amount: 0.2 })
  const [pageVisible, setPageVisible] = useState(true)
  const [frame, setFrame] = useState(TELEGRAM_DEMO_FINAL_FRAME)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const opacity = useMotionValue(0)
  const canPlay = active && isInView && pageVisible && !prefersReducedMotion

  useEffect(() => {
    const updateVisibility = () =>
      setPageVisible(document.visibilityState === "visible")
    updateVisibility()
    document.addEventListener("visibilitychange", updateVisibility)
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility)
  }, [])

  useEffect(() => {
    const window = windowRef.current
    if (!window) return
    if (prefersReducedMotion && progressRef.current) {
      progressRef.current.style.strokeDashoffset = "100"
    }
    if (!canPlay) return

    const targets = new Map<string, { x: number; y: number }>()
    const measure = () => {
      const bounds = window.getBoundingClientRect()
      targets.set("entry", { x: bounds.width - 30, y: bounds.height - 30 })
      window
        .querySelectorAll<HTMLElement>("[data-cursor-target]")
        .forEach((element) => {
          const rect = element.getBoundingClientRect()
          targets.set(element.dataset.cursorTarget!, {
            x: rect.left - bounds.left - window.clientLeft + rect.width * 0.6,
            y: rect.top - bounds.top - window.clientTop + rect.height * 0.5,
          })
        })
    }
    // Menus stay laid out while hidden so their target coordinates are stable.
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(window)
    window
      .querySelectorAll<HTMLElement>("[data-cursor-target]")
      .forEach((element) => observer.observe(element))

    let previousFrame = TELEGRAM_DEMO_FINAL_FRAME
    const playback = animate(0, TELEGRAM_DEMO_DURATION, {
      duration: TELEGRAM_DEMO_DURATION,
      ease: "linear",
      repeat: Infinity,
      onUpdate: (seconds) => {
        const nextFrame = getTelegramDemoFrame(seconds)
        if (nextFrame !== previousFrame) {
          previousFrame = nextFrame
          setFrame(nextFrame)
        }
        if (progressRef.current) {
          progressRef.current.style.strokeDashoffset = String(
            (100 * seconds) / TELEGRAM_DEMO_DURATION
          )
        }
        const cursor = getTelegramDemoCursor(seconds)
        const from = targets.get(cursor.from)
        const to = targets.get(cursor.to)
        if (from && to) {
          x.set(from.x + (to.x - from.x) * cursor.progress)
          y.set(from.y + (to.y - from.y) * cursor.progress)
        }
        scale.set(cursor.scale)
        opacity.set(cursor.opacity)
      },
    })

    return () => {
      playback.stop()
      observer.disconnect()
      opacity.set(0)
    }
  }, [canPlay, locale, prefersReducedMotion, progressRef, x, y, scale, opacity])

  const visibleFrame = prefersReducedMotion ? TELEGRAM_DEMO_FINAL_FRAME : frame

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={rootRef}
        data-demo-renderer="motion"
        data-demo-mode="automatic"
        data-telegram-demo-stage
        data-telegram-demo-state={visibleFrame.phase}
        data-telegram-demo-playback={
          prefersReducedMotion ? "complete" : canPlay ? "autoplay" : "paused"
        }
      >
        <LandingTelegramWindows
          labels={labels}
          locale={locale}
          frame={visibleFrame}
          windowRef={windowRef}
          cursor={
            <m.span
              className={styles.demoCursor}
              style={{ x, y, scale, opacity }}
              aria-hidden="true"
            >
              <MousePointer2Icon fill="currentColor" />
            </m.span>
          }
        />
      </div>
    </LazyMotion>
  )
}
