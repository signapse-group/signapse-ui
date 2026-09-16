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
import type { ApprovedLandingProductCapture } from "./landing-product-media"
import {
  LandingProductCapture,
  type LandingProductCaptureLabels,
} from "./landing-product-capture"
import { LandingAiConversationWindow } from "./landing-ai-conversation-window"
import { TELEGRAM_DEMO_FINAL_FRAME } from "./landing-scheduled-telegram-demo-model"
import { LandingTelegramWindows } from "./landing-telegram-windows"
import styles from "./landing-feature-showcase.module.css"

type ShowcaseLabels = Dictionary["landing"]["showcase"]
type TelegramLabels = ShowcaseLabels["telegram"]
type KnowledgeGraphLabels = ShowcaseLabels["knowledgeGraph"]
type MarketChartLabels = ShowcaseLabels["marketChart"]
type AiConversationLabels = ShowcaseLabels["aiConversation"]

type ShowcaseFeature =
  "knowledge-graph" | "market-chart" | "ai-conversation" | "scheduled-telegram"

type TelegramDemoProps = {
  active: boolean
  labels: TelegramLabels
  locale: AppLocale
  progressRef: RefObject<SVGCircleElement | null>
}

type KnowledgeGraphDemoProps = {
  active: boolean
  labels: KnowledgeGraphLabels
  progressRef: RefObject<SVGCircleElement | null>
}

type MarketChartDemoProps = {
  active: boolean
  labels: MarketChartLabels
  progressRef: RefObject<SVGCircleElement | null>
}

type AiConversationDemoProps = {
  active: boolean
  labels: AiConversationLabels
  progressRef: RefObject<SVGCircleElement | null>
}

type CaptureProof = {
  capture: ApprovedLandingProductCapture | null
  labels: LandingProductCaptureLabels
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

function StaticCaptureProof({ proof }: { proof: CaptureProof }) {
  if (!proof.capture) {
    return (
      <div
        className={styles.missingCapture}
        role="img"
        aria-label={proof.labels.alt}
      >
        {proof.labels.error}
      </div>
    )
  }

  return <LandingProductCapture capture={proof.capture} labels={proof.labels} />
}

export function LandingFeatureShowcase({
  captures,
  labels,
  locale,
}: {
  captures: {
    knowledgeGraph: CaptureProof
    marketChart: CaptureProof
  }
  labels: ShowcaseLabels
  locale: AppLocale
}) {
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const requestedDemo = useRef(false)
  const telegramProgressRef = useRef<SVGCircleElement>(null)
  const graphProgressRef = useRef<SVGCircleElement>(null)
  const marketProgressRef = useRef<SVGCircleElement>(null)
  const aiProgressRef = useRef<SVGCircleElement>(null)
  const [activeFeature, setActiveFeature] =
    useState<ShowcaseFeature>("scheduled-telegram")
  const [TelegramDemo, setTelegramDemo] =
    useState<ComponentType<TelegramDemoProps> | null>(null)
  const [KnowledgeGraphDemo, setKnowledgeGraphDemo] =
    useState<ComponentType<KnowledgeGraphDemoProps> | null>(null)
  const [MarketChartDemo, setMarketChartDemo] =
    useState<ComponentType<MarketChartDemoProps> | null>(null)
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
        void import("./landing-knowledge-graph-demo")
          .then((module) => {
            setKnowledgeGraphDemo(() => module.LandingKnowledgeGraphDemo)
          })
          .catch(() => {
            // The approved product capture remains the fallback.
          })
        void import("./landing-market-chart-demo")
          .then((module) => {
            setMarketChartDemo(() => module.LandingMarketChartDemo)
          })
          .catch(() => {
            // The approved product capture remains the fallback.
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
  const activeIndex = FEATURE_IDS.indexOf(activeFeature)

  function selectFeature(feature: ShowcaseFeature, focus = false) {
    setActiveFeature(feature)
    if (focus) tabRefs.current[FEATURE_IDS.indexOf(feature)]?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextIndex: number | null = null

    if (event.key === "ArrowDown")
      nextIndex = (activeIndex + 1) % FEATURE_IDS.length
    if (event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + FEATURE_IDS.length) % FEATURE_IDS.length
    }
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = FEATURE_IDS.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    selectFeature(FEATURE_IDS[nextIndex], true)
  }

  const activeTabId = `${baseId}-${activeFeature}-tab`
  const panelId = `${baseId}-showcase-panel`

  return (
    <div ref={rootRef} className={styles.showcase} data-feature-showcase>
      <div
        aria-label={labels.tabListLabel}
        className={styles.tabList}
        role="tablist"
        aria-orientation="vertical"
      >
        {features.map((feature, index) => {
          const active = feature.id === activeFeature

          return (
            <button
              key={feature.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              id={`${baseId}-${feature.id}-tab`}
              type="button"
              role="tab"
              aria-controls={panelId}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              data-feature-selector={feature.id}
              className={styles.tab}
              onClick={() => selectFeature(feature.id)}
              onKeyDown={handleTabKeyDown}
            >
              <span className={styles.tabIndex} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.tabCopy}>
                <span className={styles.tabHeading}>
                  <span className={styles.tabLabel}>{feature.label}</span>
                  <svg
                    className={styles.demoProgress}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    data-active={active}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className={styles.demoProgressTrack}
                    />
                    <circle
                      ref={
                        feature.id === "knowledge-graph"
                          ? graphProgressRef
                          : feature.id === "market-chart"
                            ? marketProgressRef
                            : feature.id === "ai-conversation"
                              ? aiProgressRef
                              : telegramProgressRef
                      }
                      cx="12"
                      cy="12"
                      r="9"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                    />
                  </svg>
                </span>
                {active ? (
                  <span className={styles.tabDetail}>
                    <span className={styles.tabTitle}>{feature.title}</span>
                    <span className={styles.tabBody}>{feature.body}</span>
                    <span className={styles.demoCaption}>
                      {feature.id === "knowledge-graph"
                        ? labels.knowledgeGraph.demoLabel
                        : feature.id === "market-chart"
                          ? labels.marketChart.demoLabel
                          : feature.id === "ai-conversation"
                            ? labels.aiConversation.demoLabel
                            : labels.telegram.demoLabel}
                    </span>
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={activeTabId}
        tabIndex={0}
        className={styles.stage}
        data-feature-stage={activeFeature}
        data-demo-mode={
          activeFeature !== "ai-conversation" || AiConversationDemo
            ? "automatic"
            : "static"
        }
      >
        <div
          className={styles.proofPanel}
          hidden={activeFeature !== "knowledge-graph"}
        >
          {KnowledgeGraphDemo ? (
            <KnowledgeGraphDemo
              active={activeFeature === "knowledge-graph"}
              labels={labels.knowledgeGraph}
              progressRef={graphProgressRef}
            />
          ) : (
            <StaticCaptureProof proof={captures.knowledgeGraph} />
          )}
        </div>
        <div
          className={styles.proofPanel}
          hidden={activeFeature !== "market-chart"}
        >
          {MarketChartDemo ? (
            <MarketChartDemo
              active={activeFeature === "market-chart"}
              labels={labels.marketChart}
              progressRef={marketProgressRef}
            />
          ) : (
            <StaticCaptureProof proof={captures.marketChart} />
          )}
        </div>
        <div
          className={styles.proofPanel}
          hidden={activeFeature !== "ai-conversation"}
        >
          {AiConversationDemo ? (
            <AiConversationDemo
              active={activeFeature === "ai-conversation"}
              labels={labels.aiConversation}
              progressRef={aiProgressRef}
            />
          ) : (
            <LandingAiConversationWindow labels={labels.aiConversation} />
          )}
        </div>
        <div
          className={styles.proofPanel}
          hidden={activeFeature !== "scheduled-telegram"}
        >
          {TelegramDemo ? (
            <TelegramDemo
              active={activeFeature === "scheduled-telegram"}
              progressRef={telegramProgressRef}
              labels={labels.telegram}
              locale={locale}
            />
          ) : (
            <TelegramStaticProof labels={labels.telegram} locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}
