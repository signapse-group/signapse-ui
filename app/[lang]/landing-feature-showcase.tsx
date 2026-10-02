"use client"

import {
  type ComponentType,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { LandingKnowledgeGraphDemo } from "./landing-knowledge-graph-demo"
import { LandingMarketChartDemo } from "./landing-market-chart-demo"
import { LandingAiConversationWindow } from "./landing-ai-conversation-window"
import { TELEGRAM_DEMO_FINAL_FRAME } from "./landing-scheduled-telegram-demo-model"
import { LandingTelegramWindows } from "./landing-telegram-windows"
import styles from "./landing-feature-showcase.module.css"

type ShowcaseLabels = Dictionary["landing"]["showcase"]
type TelegramLabels = ShowcaseLabels["telegram"]
type AiConversationLabels = ShowcaseLabels["aiConversation"]

type ShowcaseFeature =
  "knowledge-graph" | "market-chart" | "ai-conversation" | "scheduled-telegram"

type TelegramDemoProps = {
  active: boolean
  labels: TelegramLabels
  locale: AppLocale
  progressRef: RefObject<SVGRectElement | null>
}

type AiConversationDemoProps = {
  active: boolean
  labels: AiConversationLabels
  progressRef: RefObject<SVGRectElement | null>
}

const FEATURE_IDS: ShowcaseFeature[] = [
  "knowledge-graph",
  "market-chart",
  "ai-conversation",
  "scheduled-telegram",
]

function TelegramStaticProof({
  labels,
  locale,
}: {
  labels: TelegramLabels
  locale: AppLocale
}) {
  return (
    <div
      data-demo-mode="automatic"
      data-demo-renderer="static"
      data-telegram-demo-stage
      data-telegram-demo-state="preview"
    >
      <LandingTelegramWindows
        labels={labels}
        locale={locale}
        frame={TELEGRAM_DEMO_FINAL_FRAME}
      />
    </div>
  )
}

export function LandingFeatureShowcase({
  labels,
  locale,
}: {
  labels: ShowcaseLabels
  locale: AppLocale
}) {
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const stepRefs = useRef<Array<HTMLDivElement | null>>([])
  const requestedDemo = useRef(false)
  const telegramProgressRef = useRef<SVGRectElement>(null)
  const graphProgressRef = useRef<SVGRectElement>(null)
  const marketProgressRef = useRef<SVGRectElement>(null)
  const aiProgressRef = useRef<SVGRectElement>(null)
  const [activeFeature, setActiveFeature] =
    useState<ShowcaseFeature>("knowledge-graph")
  const [scrollEnhanced, setScrollEnhanced] = useState(false)
  const [TelegramDemo, setTelegramDemo] =
    useState<ComponentType<TelegramDemoProps> | null>(null)
  const [AiConversationDemo, setAiConversationDemo] =
    useState<ComponentType<AiConversationDemoProps> | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || requestedDemo.current) return
    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        requestedDemo.current = true
        observer.disconnect()
        void import("./landing-scheduled-telegram-demo")
          .then((module) => {
            setTelegramDemo(() => module.LandingScheduledTelegramDemo)
          })
          .catch(() => {
            // The server-rendered proof remains the complete fallback.
          })
        void import("./landing-ai-conversation-demo")
          .then((module) => {
            setAiConversationDemo(() => module.LandingAiConversationDemo)
          })
          .catch(() => {
            // The server-rendered proof remains the complete fallback.
          })
      },
      { rootMargin: "320px 0px" }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const features = [
    { id: "knowledge-graph" as const, ...labels.knowledgeGraph },
    { id: "market-chart" as const, ...labels.marketChart },
    { id: "ai-conversation" as const, ...labels.aiConversation },
    { id: "scheduled-telegram" as const, ...labels.telegram },
  ]

  useEffect(() => {
    const steps = stepRefs.current.filter(
      (step): step is HTMLDivElement => step !== null
    )
    if (!steps.length || typeof IntersectionObserver === "undefined") return

    let observer: IntersectionObserver
    const observeSteps = () => {
      observer?.disconnect()
      // IntersectionObserver percentages use root width, so use pixels for a
      // viewport-height activation band that also works on narrow screens.
      const inset = Math.floor(window.innerHeight * 0.42)
      const stickyLayout = window.matchMedia("(min-width: 64rem)").matches
      const targets = steps.map((step) =>
        stickyLayout ? step : step.parentElement!
      )
      observer = new IntersectionObserver(
        () => {
          setScrollEnhanced(stickyLayout)
          const middle = window.innerHeight / 2
          const index = targets.findIndex((step) => {
            const rect = step.getBoundingClientRect()
            return rect.top <= middle && rect.bottom > middle
          })
          if (index >= 0) setActiveFeature(FEATURE_IDS[index])
        },
        { rootMargin: `-${inset}px 0px -${inset}px 0px` }
      )
      targets.forEach((step) => observer.observe(step))
    }
    observeSteps()
    window.addEventListener("resize", observeSteps)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", observeSteps)
    }
  }, [])

  function selectFeature(feature: ShowcaseFeature, focus = false) {
    setActiveFeature(feature)
    const index = FEATURE_IDS.indexOf(feature)
    if (focus) buttonRefs.current[index]?.focus({ preventScroll: true })
    stepRefs.current[index]?.scrollIntoView({
      block: "center",
      behavior: "instant",
    })
  }

  function handleStepKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex: number | null = null

    if (event.key === "ArrowDown") nextIndex = (index + 1) % FEATURE_IDS.length
    if (event.key === "ArrowUp") {
      nextIndex = (index - 1 + FEATURE_IDS.length) % FEATURE_IDS.length
    }
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = FEATURE_IDS.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    selectFeature(FEATURE_IDS[nextIndex], true)
  }

  function renderDemo(feature: ShowcaseFeature) {
    switch (feature) {
      case "knowledge-graph":
        return (
          <LandingKnowledgeGraphDemo
            active={activeFeature === "knowledge-graph"}
            labels={labels.knowledgeGraph}
            progressRef={graphProgressRef}
          />
        )
      case "market-chart":
        return (
          <LandingMarketChartDemo
            active={activeFeature === "market-chart"}
            labels={labels.marketChart}
            progressRef={marketProgressRef}
          />
        )
      case "ai-conversation":
        return AiConversationDemo ? (
          <AiConversationDemo
            active={activeFeature === "ai-conversation"}
            labels={labels.aiConversation}
            progressRef={aiProgressRef}
          />
        ) : (
          <LandingAiConversationWindow labels={labels.aiConversation} />
        )
      case "scheduled-telegram":
        return TelegramDemo ? (
          <TelegramDemo
            active={activeFeature === "scheduled-telegram"}
            progressRef={telegramProgressRef}
            labels={labels.telegram}
            locale={locale}
          />
        ) : (
          <TelegramStaticProof labels={labels.telegram} locale={locale} />
        )
    }
  }

  const progressRefs = [
    graphProgressRef,
    marketProgressRef,
    aiProgressRef,
    telegramProgressRef,
  ]

  return (
    <div
      ref={rootRef}
      className={styles.showcase}
      data-feature-showcase
      data-scroll-enhanced={scrollEnhanced}
    >
      {features.map((feature, index) => (
        <section
          key={feature.id}
          className={styles.storyStep}
          data-story-step={feature.id}
        >
          <div
            ref={(element) => {
              stepRefs.current[index] = element
            }}
            className={styles.storyCopy}
            data-story-copy={feature.id}
          >
            <div className={styles.tabCopy}>
              <button
                ref={(element) => {
                  buttonRefs.current[index] = element
                }}
                type="button"
                className={styles.tab}
                aria-controls={`${baseId}-${feature.id}-demo`}
                aria-current={feature.id === activeFeature ? "step" : undefined}
                data-feature-selector={feature.id}
                onClick={() => selectFeature(feature.id)}
                onKeyDown={(event) => handleStepKeyDown(event, index)}
              >
                <span className={styles.stepBadge} aria-hidden="true">
                  <span className={styles.tabIndex}>{index + 1}</span>
                  <svg
                    className={styles.demoProgress}
                    viewBox="0 0 32 32"
                    data-demo-progress={feature.id}
                  >
                    <rect
                      x="1"
                      y="1"
                      width="30"
                      height="30"
                      rx="7"
                      className={styles.demoProgressTrack}
                    />
                    <rect
                      ref={progressRefs[index]}
                      x="1"
                      y="1"
                      width="30"
                      height="30"
                      rx="7"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                    />
                  </svg>
                </span>
                <span className={styles.tabLabel}>{feature.label}</span>
              </button>
              <h2
                id={`${baseId}-${feature.id}-title`}
                className={styles.tabTitle}
              >
                {feature.title}
              </h2>
              <p className={styles.tabBody}>{feature.body}</p>
            </div>
          </div>
          <div
            id={`${baseId}-${feature.id}-demo`}
            role="region"
            aria-labelledby={`${baseId}-${feature.id}-title`}
            className={`${styles.stage} ${styles.proofPanel}`}
            data-feature-stage={feature.id}
            data-active={feature.id === activeFeature}
          >
            {renderDemo(feature.id)}
          </div>
        </section>
      ))}
    </div>
  )
}
