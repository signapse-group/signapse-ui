"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  AI_CONVERSATION_DEMO_DURATION,
  AI_CONVERSATION_DEMO_FINAL_FRAME,
  getAiConversationDemoFrame,
} from "./landing-ai-conversation-demo-model"
import { LandingAiConversationWindow } from "./landing-ai-conversation-window"

type Labels = Dictionary["landing"]["showcase"]["aiConversation"]

export function LandingAiConversationDemo({
  active,
  labels,
  progressRef,
}: {
  active: boolean
  labels: Labels
  progressRef: RefObject<SVGCircleElement | null>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(rootRef, { amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()
  const [frame, setFrame] = useState(() => getAiConversationDemoFrame(0))
  const [seconds, setSeconds] = useState(0)
  const canPlay = active && isInView && !prefersReducedMotion

  useEffect(() => {
    if (!active) return

    const resetFrame = window.requestAnimationFrame(() => {
      setFrame(getAiConversationDemoFrame(0))
      setSeconds(0)
      if (progressRef.current)
        progressRef.current.style.strokeDashoffset = "100"
    })
    return () => window.cancelAnimationFrame(resetFrame)
  }, [active, progressRef])

  useEffect(() => {
    if (!canPlay) return

    let previous = getAiConversationDemoFrame(0)
    const playback = animate(0, AI_CONVERSATION_DEMO_DURATION, {
      duration: AI_CONVERSATION_DEMO_DURATION,
      ease: "linear",
      repeat: Infinity,
      onUpdate: (seconds) => {
        setSeconds(Math.round(seconds * 20) / 20)
        const next = getAiConversationDemoFrame(seconds)
        if (next !== previous) {
          previous = next
          setFrame(next)
        }
        if (progressRef.current) {
          progressRef.current.style.strokeDashoffset = String(
            (100 * seconds) / AI_CONVERSATION_DEMO_DURATION
          )
        }
      },
    })

    return () => playback.stop()
  }, [canPlay, progressRef])

  const visibleFrame = prefersReducedMotion
    ? AI_CONVERSATION_DEMO_FINAL_FRAME
    : frame
  const visibleSeconds = prefersReducedMotion
    ? AI_CONVERSATION_DEMO_DURATION
    : seconds

  useEffect(() => {
    const transcript = transcriptRef.current
    if (!active || !transcript) return

    const animationFrame = window.requestAnimationFrame(() => {
      transcript.scrollTo({
        top: transcript.scrollHeight,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      })
    })
    return () => window.cancelAnimationFrame(animationFrame)
  }, [active, prefersReducedMotion, visibleFrame.phase])

  return (
    <div
      ref={rootRef}
      data-demo-mode="automatic"
      data-demo-renderer="motion"
      data-ai-conversation-demo
      data-ai-conversation-playback={
        prefersReducedMotion ? "complete" : canPlay ? "autoplay" : "paused"
      }
      data-ai-conversation-state={visibleFrame.phase}
      aria-label={labels.stageLabel}
    >
      <LandingAiConversationWindow
        labels={labels}
        frame={visibleFrame}
        seconds={visibleSeconds}
        animated
        transcriptRef={transcriptRef}
      />
    </div>
  )
}
