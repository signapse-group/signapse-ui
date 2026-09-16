"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import {
  animate,
  LazyMotion,
  domAnimation,
  m,
  useInView,
  useReducedMotion,
} from "motion/react"
import {
  BellRingIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  LoaderCircleIcon,
  MousePointer2Icon,
} from "lucide-react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  KNOWLEDGE_GRAPH_DEMO_DURATION,
  KNOWLEDGE_GRAPH_DEMO_FINAL_FRAME,
  KNOWLEDGE_GRAPH_DEMO_TIMING as timing,
  getKnowledgeGraphDemoFrame,
} from "./landing-knowledge-graph-demo-model"
import { LandingDemoBrowserChrome } from "./landing-demo-browser-chrome"
import styles from "./landing-feature-showcase.module.css"

type Labels = Dictionary["landing"]["showcase"]["knowledgeGraph"]
type NodeKind = "asset" | "event" | "news-article" | "narrative"
type GraphNode = {
  id: string
  kind: NodeKind
  label: string
  x: number
  y: number
  isNew?: boolean
  labelSide?: "left" | "right"
}
type GraphEdge = {
  id: string
  source: string
  target: string
  kind:
    "event-asset" | "news-article-event" | "narrative-event" | "narrative-asset"
  isNew?: boolean
}

export function LandingKnowledgeGraphDemo({
  active,
  labels,
  progressRef,
}: {
  active: boolean
  labels: Labels
  progressRef: RefObject<SVGCircleElement | null>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(rootRef, { amount: 0.2 })
  const reducedMotion = useReducedMotion()
  const [frame, setFrame] = useState(() => getKnowledgeGraphDemoFrame(0))
  const canPlay = active && isInView && !reducedMotion

  useEffect(() => {
    if (!canPlay) return
    let previous = getKnowledgeGraphDemoFrame(0)
    const playback = animate(0, KNOWLEDGE_GRAPH_DEMO_DURATION, {
      duration: KNOWLEDGE_GRAPH_DEMO_DURATION,
      ease: "linear",
      repeat: Infinity,
      onUpdate: (seconds) => {
        const next = getKnowledgeGraphDemoFrame(seconds)
        if (next !== previous) {
          previous = next
          setFrame(next)
        }
        if (progressRef.current)
          progressRef.current.style.strokeDashoffset = String(
            (100 * seconds) / KNOWLEDGE_GRAPH_DEMO_DURATION
          )
      },
    })
    return () => playback.stop()
  }, [canPlay, progressRef])

  const visibleFrame = reducedMotion ? KNOWLEDGE_GRAPH_DEMO_FINAL_FRAME : frame
  const at = visibleFrame.at
  const showArticle = at >= timing.incoming && at < timing.selectNarrative
  const showFacts = at >= timing.extracting
  const resolved = at >= timing.resolving
  const linked = at >= timing.linking
  const updated = at >= timing.graphUpdated
  const selectedId =
    at >= timing.inspectNews
      ? "new-news"
      : at >= timing.inspectEvent
        ? "new-event"
        : at >= timing.inspectNarrative
          ? "new-narrative"
          : "asset"
  const status = updated
    ? labels.updated
    : at >= timing.linking
      ? labels.linking
      : at >= timing.resolving
        ? labels.resolving
        : at >= timing.extracting
          ? labels.extracting
          : labels.reading

  const nodes: GraphNode[] = [
    { id: "asset", kind: "asset", label: "XAU/USD", x: 52, y: 50 },
    {
      id: "base-narrative",
      kind: "narrative",
      label: labels.initialNarrativeNode,
      x: 40,
      y: 49,
      labelSide: "left",
    },
    {
      id: "base-event-1",
      kind: "event",
      label: labels.initialEventOne,
      x: 30,
      y: 33,
    },
    {
      id: "base-news-1",
      kind: "news-article",
      label: labels.initialNewsOne,
      x: 20,
      y: 24,
    },
    {
      id: "base-event-2",
      kind: "event",
      label: labels.initialEventTwo,
      x: 30,
      y: 67,
    },
    {
      id: "base-news-2",
      kind: "news-article",
      label: labels.initialNewsTwo,
      x: 20,
      y: 76,
    },
    {
      id: "new-narrative",
      kind: "narrative",
      label: labels.narrativeNode,
      x: 64,
      y: 34,
      isNew: true,
      labelSide: "left",
    },
    {
      id: "new-event",
      kind: "event",
      label: labels.eventNode,
      x: 74,
      y: 48,
      isNew: true,
    },
    {
      id: "new-news",
      kind: "news-article",
      label: labels.articleTitle,
      x: 82,
      y: 65,
      isNew: true,
      labelSide: "left",
    },
  ]
  const edges: GraphEdge[] = [
    {
      id: "asset-base-narrative",
      source: "asset",
      target: "base-narrative",
      kind: "narrative-asset",
    },
    {
      id: "base-narrative-event-1",
      source: "base-narrative",
      target: "base-event-1",
      kind: "narrative-event",
    },
    {
      id: "base-narrative-event-2",
      source: "base-narrative",
      target: "base-event-2",
      kind: "narrative-event",
    },
    {
      id: "base-event-news-1",
      source: "base-event-1",
      target: "base-news-1",
      kind: "news-article-event",
    },
    {
      id: "base-event-news-2",
      source: "base-event-2",
      target: "base-news-2",
      kind: "news-article-event",
    },
    {
      id: "asset-new-narrative",
      source: "asset",
      target: "new-narrative",
      kind: "narrative-asset",
      isNew: true,
    },
    {
      id: "new-narrative-event",
      source: "new-narrative",
      target: "new-event",
      kind: "narrative-event",
      isNew: true,
    },
    {
      id: "new-event-news",
      source: "new-event",
      target: "new-news",
      kind: "news-article-event",
      isNew: true,
    },
  ]
  const positions = new Map(nodes.map((node) => [node.id, node]))
  const cursorTarget =
    at >= timing.selectNews
      ? positions.get("new-news")!
      : at >= timing.selectEvent
        ? positions.get("new-event")!
        : at >= timing.selectNarrative
          ? positions.get("new-narrative")!
          : showArticle
            ? { x: 23, y: 28 }
            : positions.get("asset")!
  const clicking = visibleFrame.phase.startsWith("select")
  const detail =
    selectedId === "new-news"
      ? {
          type: labels.newsType,
          title: labels.articleTitle,
          summary: labels.newsSummary,
          rows: [
            [labels.publishedAt, labels.publishedAtValue],
            [labels.source, labels.sourceValue],
          ],
          entities: ["XAU/USD", labels.eventNode],
          relations: [labels.relationNarrative, labels.relationGold],
        }
      : selectedId === "new-event"
        ? {
            type: labels.detailType,
            title: labels.eventNode,
            summary: labels.detailSummary,
            rows: [
              [labels.occurredAt, labels.occurredAtValue],
              [labels.confidence, labels.confidenceValue],
            ],
            entities: ["XAU/USD", labels.narrativeNode, "CNBC"],
            relations: [labels.relationUsd, labels.relationGold],
          }
        : selectedId === "new-narrative"
          ? {
              type: labels.narrativeType,
              title: labels.narrativeNode,
              summary: labels.narrativeSummary,
              rows: [
                [labels.confidence, labels.confidenceValue],
                [labels.evidence, labels.evidenceValue],
              ],
              entities: ["XAU/USD", labels.eventNode],
              relations: [labels.relationGold, labels.relationNarrative],
            }
          : {
              type: labels.assetType,
              title: "XAU/USD",
              summary: labels.assetSummary,
              rows: [
                [labels.assetMetricLabel, labels.assetMetricValue],
                [labels.relatedEntities, "2 narratives · 2 events"],
              ],
              entities: [labels.initialNarrativeNode],
              relations: [labels.relationGold],
            }

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={rootRef}
        className={styles.graphDemo}
        role="img"
        aria-label={labels.stageLabel}
      >
        <LandingDemoBrowserChrome labels={labels} />
        <div className={styles.graphCanvas}>
          <div className={styles.graphScene}>
            <svg
              className={styles.graphEdges}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {edges.map((edge) => {
                const source = positions.get(edge.source)!
                const target = positions.get(edge.target)!
                const edgeVisible = !edge.isNew || linked
                const edgeActive =
                  edge.source === selectedId || edge.target === selectedId
                return edge.isNew ? (
                  <m.line
                    key={edge.id}
                    data-kind={edge.kind}
                    data-active={edgeActive}
                    x1={source.x}
                    y1={source.y}
                    initial={false}
                    animate={{
                      x2: edgeVisible ? target.x : source.x,
                      y2: edgeVisible ? target.y : source.y,
                      opacity: edgeVisible ? 1 : 0,
                    }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                ) : (
                  <line
                    key={edge.id}
                    data-kind={edge.kind}
                    data-active={edgeActive}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                  />
                )
              })}
            </svg>
            {nodes.map((node) => {
              const visible = !node.isNew || linked
              return (
                <m.span
                  key={node.id}
                  className={styles.graphNode}
                  data-kind={node.kind}
                  data-new={node.isNew}
                  data-selected={node.id === selectedId}
                  data-label-side={node.labelSide ?? "right"}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  initial={false}
                  animate={{
                    opacity: visible ? 1 : 0,
                    scale: visible ? 1 : 0.7,
                  }}
                >
                  <i />
                  <small>{node.label}</small>
                </m.span>
              )
            })}
            <m.aside
              className={styles.graphIngest}
              data-fresh={!showFacts}
              initial={false}
              animate={{ opacity: showArticle ? 1 : 0, y: showArticle ? 0 : 8 }}
            >
              <span className={styles.graphIngestEyebrow}>
                <BellRingIcon />
                {labels.articleLabel}
              </span>
              <strong>{labels.articleTitle}</strong>
              <small>{labels.articleSource}</small>
              <div className={styles.graphIngestStatus} data-complete={updated}>
                {updated ? <CheckCircle2Icon /> : <LoaderCircleIcon />}
                {status}
              </div>
              <div className={styles.graphIngestProgress}>
                <m.span
                  initial={false}
                  animate={{
                    scaleX: updated
                      ? 1
                      : at >= timing.resolving
                        ? 0.72
                        : at >= timing.extracting
                          ? 0.48
                          : at >= timing.reading
                            ? 0.24
                            : 0.08,
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
              {showFacts ? (
                <div className={styles.graphFacts}>
                  <span>
                    XAU/USD <em>{resolved ? labels.matched : "…"}</em>
                  </span>
                  <span>
                    {labels.narrativeNode} <em>{labels.newNode}</em>
                  </span>
                  <span>
                    {labels.eventNode} <em>{labels.newNode}</em>
                  </span>
                </div>
              ) : null}
            </m.aside>
            <div className={styles.graphLegend} aria-hidden="true">
              <span data-kind="asset">
                <i />
                {labels.assetType}
              </span>
              <span data-kind="narrative">
                <i />
                {labels.narrativeType}
              </span>
              <span data-kind="event">
                <i />
                {labels.detailType}
              </span>
              <span data-kind="news-article">
                <i />
                {labels.newsType}
              </span>
            </div>
            <m.span
              className={styles.graphCursor}
              initial={false}
              animate={{
                left: `${cursorTarget.x}%`,
                top: `${cursorTarget.y}%`,
                scale: clicking ? 0.82 : 1,
                opacity: 1,
              }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <MousePointer2Icon fill="currentColor" />
            </m.span>
          </div>
          <aside className={styles.graphInspector}>
            <m.div
              key={selectedId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span className={styles.graphInspectorType}>{detail.type}</span>
              <h3>{detail.title}</h3>
              <p>{detail.summary}</p>
              <dl>
                {detail.rows.map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <strong>{labels.relatedEntities}</strong>
                <div className={styles.graphEntityChips}>
                  {detail.entities.map((entity) => (
                    <span key={entity}>{entity}</span>
                  ))}
                </div>
              </section>
              <section>
                <strong>{labels.relationships}</strong>
                {detail.relations.map((relation) => (
                  <p key={relation}>
                    <ChevronRightIcon />
                    {relation}
                  </p>
                ))}
              </section>
            </m.div>
          </aside>
        </div>
      </div>
    </LazyMotion>
  )
}
