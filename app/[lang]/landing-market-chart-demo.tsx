"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"
import {
  BellRingIcon,
  CalendarDaysIcon,
  CameraIcon,
  CheckCircle2Icon,
  MaximizeIcon,
  MousePointer2Icon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  MARKET_CHART_DEMO_DURATION,
  MARKET_CHART_DEMO_FINAL_FRAME,
  MARKET_CHART_DEMO_TIMING as timing,
  getMarketChartDemoFrame,
  getMarketChartOutcomeCount,
  getMarketChartTickTime,
} from "./landing-market-chart-demo-model"
import { LandingDemoBrowserChrome } from "./landing-demo-browser-chrome"
import styles from "./landing-feature-showcase.module.css"

type Labels = Dictionary["landing"]["showcase"]["marketChart"]
type Candle = {
  open: number
  close: number
  high: number
  low: number
  volume: number
}

const candles: Candle[] = [
  { open: 77263.67, high: 77309.84, low: 77206.75, close: 77206.75, volume: 0 },
  {
    open: 77207.39,
    high: 77250.49,
    low: 77152.54,
    close: 77200,
    volume: 237608960,
  },
  { open: 77200.01, high: 77347.68, low: 77186.01, close: 77279.05, volume: 0 },
  { open: 77279.06, high: 77332.57, low: 77242.65, close: 77257.01, volume: 0 },
  { open: 77260.27, high: 77356.54, low: 77244.04, close: 77340.73, volume: 0 },
  { open: 77340.73, high: 77368.78, low: 77301, close: 77336.02, volume: 0 },
  { open: 77336.02, high: 77380.54, low: 77289.99, close: 77311.71, volume: 0 },
  { open: 77311.71, high: 77342.03, low: 77268.04, close: 77339.8, volume: 0 },
  { open: 77338.26, high: 77346.07, low: 77261.92, close: 77318.06, volume: 0 },
  { open: 77319.48, high: 77376.65, low: 77231.61, close: 77351.6, volume: 0 },
  { open: 77351.6, high: 77483.28, low: 77349, close: 77444.01, volume: 0 },
  { open: 77446.62, high: 77461.79, low: 77350.16, close: 77363.97, volume: 0 },
  { open: 77363.97, high: 77403.69, low: 77318.65, close: 77337.96, volume: 0 },
  { open: 77353.9, high: 77379.86, low: 77157.06, close: 77191.41, volume: 0 },
  { open: 77191.42, high: 77202.56, low: 77106.12, close: 77126.28, volume: 0 },
  {
    open: 77128.66,
    high: 77174.99,
    low: 77049.56,
    close: 77105.43,
    volume: 153467904,
  },
  { open: 77110.86, high: 77206.59, low: 77110.86, close: 77152.68, volume: 0 },
  {
    open: 77152.69,
    high: 77261.94,
    low: 77136.66,
    close: 77240.79,
    volume: 280676352,
  },
  { open: 77240.79, high: 77285.82, low: 77165.55, close: 77219.86, volume: 0 },
  {
    open: 77219.83,
    high: 77284.25,
    low: 77214.19,
    close: 77266.42,
    volume: 3088384,
  },
  { open: 77262.84, high: 77291.2, low: 77135.63, close: 77252.96, volume: 0 },
  {
    open: 77252.95,
    high: 77314.3,
    low: 77222.07,
    close: 77299.53,
    volume: 170074112,
  },
  { open: 77299.31, high: 77299.31, low: 77215.68, close: 77268.02, volume: 0 },
  {
    open: 77268.02,
    high: 77297.52,
    low: 77163.14,
    close: 77176.07,
    volume: 3024896,
  },
  { open: 77177.62, high: 77237.3, low: 77173.74, close: 77187.43, volume: 0 },
  { open: 77188.42, high: 77299.39, low: 77188.42, close: 77291.43, volume: 0 },
  { open: 77279.06, high: 77332.57, low: 77242.65, close: 77257.01, volume: 0 },
  { open: 77260.27, high: 77356.54, low: 77244.04, close: 77340.73, volume: 0 },
  { open: 77340.73, high: 77368.78, low: 77301, close: 77336.02, volume: 0 },
  { open: 77336.02, high: 77380.54, low: 77289.99, close: 77311.71, volume: 0 },
  { open: 77311.71, high: 77342.03, low: 77268.04, close: 77339.8, volume: 0 },
  { open: 77338.26, high: 77346.07, low: 77261.92, close: 77318.06, volume: 0 },
  { open: 77319.48, high: 77376.65, low: 77231.61, close: 77351.6, volume: 0 },
  { open: 77351.6, high: 77483.28, low: 77349, close: 77444.01, volume: 0 },
  { open: 77446.62, high: 77461.79, low: 77350.16, close: 77363.97, volume: 0 },
  { open: 77363.97, high: 77403.69, low: 77318.65, close: 77337.96, volume: 0 },
  { open: 77353.9, high: 77379.86, low: 77157.06, close: 77191.41, volume: 0 },
  { open: 77191.42, high: 77202.56, low: 77106.12, close: 77126.28, volume: 0 },
  {
    open: 77128.66,
    high: 77174.99,
    low: 77049.56,
    close: 77105.43,
    volume: 153467904,
  },
  { open: 77110.86, high: 77206.59, low: 77110.86, close: 77152.68, volume: 0 },
  {
    open: 77152.69,
    high: 77261.94,
    low: 77136.66,
    close: 77240.79,
    volume: 280676352,
  },
  { open: 77240.79, high: 77285.82, low: 77165.55, close: 77219.86, volume: 0 },
  {
    open: 77219.83,
    high: 77284.25,
    low: 77214.19,
    close: 77266.42,
    volume: 3088384,
  },
  { open: 77262.84, high: 77291.2, low: 77135.63, close: 77252.96, volume: 0 },
  {
    open: 77252.95,
    high: 77314.3,
    low: 77222.07,
    close: 77299.53,
    volume: 170074112,
  },
  { open: 77299.31, high: 77299.31, low: 77215.68, close: 77268.02, volume: 0 },
  {
    open: 77268.02,
    high: 77297.52,
    low: 77163.14,
    close: 77176.07,
    volume: 3024896,
  },
  { open: 77177.62, high: 77237.3, low: 77173.74, close: 77187.43, volume: 0 },
  { open: 77188.42, high: 77299.39, low: 77188.42, close: 77291.43, volume: 0 },
  { open: 77291.43, high: 77298.75, low: 77031.83, close: 77099.74, volume: 0 },
  {
    open: 77077.15,
    high: 77154.73,
    low: 77066.54,
    close: 77100.18,
    volume: 284682240,
  },
  {
    open: 77093.25,
    high: 77150.92,
    low: 76730.56,
    close: 76780.98,
    volume: 160171008,
  },
  {
    open: 76777.68,
    high: 76863.7,
    low: 76532.49,
    close: 76766.09,
    volume: 515876864,
  },
  {
    open: 76758.36,
    high: 76781.9,
    low: 76600,
    close: 76623.94,
    volume: 126042112,
  },
  {
    open: 76639.99,
    high: 76773.53,
    low: 76497.54,
    close: 76749.26,
    volume: 207486976,
  },
  {
    open: 76760.54,
    high: 76828.21,
    low: 76669.36,
    close: 76730.16,
    volume: 214085632,
  },
  { open: 76727, high: 76891.5, low: 76521.42, close: 76818.13, volume: 0 },
  {
    open: 76821,
    high: 77224.32,
    low: 76815.14,
    close: 77177.82,
    volume: 353025024,
  },
  {
    open: 77182.09,
    high: 77182.09,
    low: 76991.36,
    close: 77105.27,
    volume: 54383616,
  },
  {
    open: 77110.2,
    high: 77332.17,
    low: 77106.24,
    close: 77257.36,
    volume: 115096576,
  },
  {
    open: 77258.84,
    high: 77393.7,
    low: 77215.04,
    close: 77298.6,
    volume: 71178240,
  },
  { open: 77290.67, high: 77360, low: 77273.21, close: 77312.34, volume: 0 },
  { open: 77312.33, high: 77386.25, low: 77193.07, close: 77253.72, volume: 0 },
  { open: 77260.67, high: 77340.13, low: 77227.37, close: 77313.47, volume: 0 },
  { open: 77323.3, high: 77419.05, low: 77276.57, close: 77280.55, volume: 0 },
  {
    open: 77259.12,
    high: 77259.12,
    low: 76623.34,
    close: 76680.17,
    volume: 818782208,
  },
  {
    open: 76665.14,
    high: 76837.16,
    low: 76592.61,
    close: 76799.86,
    volume: 539043840,
  },
  {
    open: 76815.13,
    high: 77004.83,
    low: 76355.34,
    close: 76767.39,
    volume: 706053120,
  },
  {
    open: 76767.39,
    high: 77126.69,
    low: 76606.83,
    close: 77076.83,
    volume: 292373504,
  },
  {
    open: 77069.18,
    high: 77672.47,
    low: 76983.95,
    close: 77568.87,
    volume: 1296845824,
  },
  {
    open: 77581.48,
    high: 77828.76,
    low: 77462.81,
    close: 77566.62,
    volume: 1051499520,
  },
  {
    open: 77566.5,
    high: 77668,
    low: 77494.1,
    close: 77646.45,
    volume: 416168960,
  },
  {
    open: 77648.97,
    high: 77650,
    low: 77455,
    close: 77576.64,
    volume: 367206400,
  },
  {
    open: 77583.99,
    high: 77862.41,
    low: 77337.96,
    close: 77557.54,
    volume: 208156672,
  },
  {
    open: 77556.9,
    high: 77855.51,
    low: 77479.38,
    close: 77855.5,
    volume: 220567552,
  },
  {
    open: 77859.15,
    high: 77936.87,
    low: 77627.38,
    close: 77705.03,
    volume: 244408320,
  },
  {
    open: 77705.04,
    high: 78341.51,
    low: 77567.24,
    close: 78108.59,
    volume: 47654912,
  },
  {
    open: 78130.07,
    high: 78136.54,
    low: 77859.57,
    close: 77867.39,
    volume: 582832128,
  },
  {
    open: 77867.48,
    high: 77890.07,
    low: 77654.7,
    close: 77738.76,
    volume: 237494272,
  },
  {
    open: 77741.24,
    high: 78035.91,
    low: 77568.08,
    close: 77659.24,
    volume: 366112768,
  },
  {
    open: 77659.24,
    high: 78441.48,
    low: 77434.4,
    close: 78139.74,
    volume: 1501734912,
  },
  {
    open: 78145.95,
    high: 78664.83,
    low: 78145.95,
    close: 78497.16,
    volume: 1305475072,
  },
  {
    open: 78461.48,
    high: 78662.19,
    low: 78271.6,
    close: 78553.05,
    volume: 1477193728,
  },
  {
    open: 78553.81,
    high: 78883.71,
    low: 78402.22,
    close: 78752.83,
    volume: 811405312,
  },
  {
    open: 78752.84,
    high: 79026.68,
    low: 78701.91,
    close: 78941.8,
    volume: 1079191552,
  },
  {
    open: 78941.8,
    high: 79323.3,
    low: 78838.58,
    close: 79219.79,
    volume: 1437233152,
  },
]

const ANNOTATION_INDEX = candles.length - 4

const PRICE_SCALE = 0.0475
const toDemoPrice = (value: number) => value * PRICE_SCALE
const chartLow =
  toDemoPrice(Math.min(...candles.map((candle) => candle.low))) - 12
const chartHigh =
  toDemoPrice(Math.max(...candles.map((candle) => candle.high))) + 12
const maxVolume = Math.max(...candles.map((candle) => candle.volume))

function y(value: number) {
  return 265 - ((toDemoPrice(value) - chartLow) / (chartHigh - chartLow)) * 205
}

const CANDLE_GAP = 8
const LATEST_CANDLE_X = 480
const PLOT_LEFT = 10
const CURSOR_MOVE_DURATION = 0.35
const candleX = (index: number) =>
  LATEST_CANDLE_X + (index - ANNOTATION_INDEX) * CANDLE_GAP

type SampleAnnotation = {
  id: string
  index: number
  direction: "up" | "down" | "neutral"
}

const sampleAnnotations: SampleAnnotation[] = [
  { id: "sample-down-0", index: ANNOTATION_INDEX - 45, direction: "down" },
  { id: "sample-up-0", index: ANNOTATION_INDEX - 34, direction: "up" },
  {
    id: "sample-neutral-1",
    index: ANNOTATION_INDEX - 25,
    direction: "neutral",
  },
  { id: "sample-up-1", index: ANNOTATION_INDEX - 20, direction: "up" },
  { id: "sample-down-1", index: ANNOTATION_INDEX - 15, direction: "down" },
  { id: "sample-up-2", index: ANNOTATION_INDEX - 10, direction: "up" },
  { id: "sample-down-2", index: ANNOTATION_INDEX - 6, direction: "down" },
]

export function LandingMarketChartDemo({
  active,
  labels,
  progressRef,
}: {
  active: boolean
  labels: Labels
  progressRef: RefObject<SVGCircleElement | null>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef(0)
  const isInView = useInView(rootRef, { amount: 0.2 })
  const reducedMotion = useReducedMotion()
  const [seconds, setSeconds] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [detailDismissed, setDetailDismissed] = useState(false)
  const canPlay = active && isInView && !reducedMotion

  useEffect(() => {
    if (!canPlay) return
    const from = elapsedRef.current
    const playback = animate(from, MARKET_CHART_DEMO_DURATION, {
      duration: MARKET_CHART_DEMO_DURATION - from,
      ease: "linear",
      onUpdate: (value) => {
        elapsedRef.current = value
        setSeconds(value)
        if (progressRef.current) {
          progressRef.current.style.strokeDashoffset = String(
            (100 * value) / MARKET_CHART_DEMO_DURATION
          )
        }
      },
      onComplete: () => {
        elapsedRef.current = 0
        setSeconds(0)
        setDetailDismissed(false)
        setCycle((value) => value + 1)
      },
    })
    return () => playback.stop()
  }, [canPlay, cycle, progressRef])

  const visibleSeconds = reducedMotion ? MARKET_CHART_DEMO_DURATION : seconds
  const frame = reducedMotion
    ? MARKET_CHART_DEMO_FINAL_FRAME
    : getMarketChartDemoFrame(visibleSeconds)
  const at = frame.at
  const hasNews = at >= timing.newsIncoming
  const hasSecondSource = at >= timing.secondSource
  const annotationReady = at >= timing.annotationReady
  const detailOpen = at >= timing.detailOpen && !detailDismissed
  const outcomeCount = getMarketChartOutcomeCount(visibleSeconds)
  const trackOffset = -outcomeCount * CANDLE_GAP
  const markerX = (candleX(ANNOTATION_INDEX) + trackOffset) / 7.2
  const markerY = (y(candles[ANNOTATION_INDEX].high) - 12) / 4.2
  const cursorFraction = Math.max(
    0,
    Math.min(1, (visibleSeconds - timing.cursorSelect) / CURSOR_MOVE_DURATION)
  )
  const cursorProgress =
    cursorFraction * cursorFraction * (3 - 2 * cursorFraction)
  const cursorX = 50 + (markerX - 50) * cursorProgress
  const cursorY = 50 + (markerY - 50) * cursorProgress
  const cursorClicking =
    visibleSeconds >= timing.cursorSelect + CURSOR_MOVE_DURATION &&
    visibleSeconds < timing.cursorSelect + CURSOR_MOVE_DURATION + 0.2
  const tickTime = getMarketChartTickTime(visibleSeconds)
  const liveClose =
    candles[ANNOTATION_INDEX].close + Math.sin(tickTime * 1.35) * 42
  const activeCandle =
    outcomeCount === 0
      ? candles[ANNOTATION_INDEX]
      : candles[ANNOTATION_INDEX + outcomeCount]
  const currentRawClose = outcomeCount === 0 ? liveClose : activeCandle.close
  const price = toDemoPrice(currentRawClose)
  const ingestStatus =
    at >= timing.annotationReady
      ? labels.annotationAdded
      : at >= timing.resolving
        ? labels.synthesizing
        : at >= timing.reading
          ? labels.readingSources
          : labels.newSource

  return (
    <div
      ref={rootRef}
      className={styles.marketDemo}
      data-market-demo-state={frame.phase}
      data-demo-mode="automatic"
      data-demo-renderer="motion"
      data-market-tick={tickTime}
      aria-label={labels.stageLabel}
    >
      <LandingDemoBrowserChrome labels={labels} />
      <header className={styles.marketToolbar}>
        <div className={styles.marketIdentity}>
          <strong>XAU/USD - Gold / US Dollar</strong>
        </div>
        <nav className={styles.marketTimeframes} aria-label={labels.timeframe}>
          {["1M", "5M", "15M", "30M", "1H", "4H", "1D"].map((item) => (
            <span key={item} data-active={item === "1H"}>
              {item}
            </span>
          ))}
        </nav>
        <div className={styles.marketToolGroup} aria-hidden="true">
          <span>
            <CalendarDaysIcon />
            {labels.events}
          </span>
          <span>
            <SlidersHorizontalIcon />
            {labels.indicators}
          </span>
          <span>
            <CameraIcon />
          </span>
          <span>
            <MaximizeIcon />
          </span>
        </div>
      </header>

      <div className={styles.marketCanvas}>
        <svg
          className={styles.marketChart}
          viewBox="0 0 720 420"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g
            className={styles.marketCandleTrack}
            style={{ transform: `translateX(${trackOffset}px)` }}
          >
            {candles.map((candle, index) => {
              if (index > ANNOTATION_INDEX + outcomeCount) return null
              const close =
                index === ANNOTATION_INDEX && outcomeCount === 0
                  ? liveClose
                  : candle.close
              const x = candleX(index)
              if (x + trackOffset < PLOT_LEFT) return null
              const rising = close >= candle.open
              const bodyY = Math.min(y(candle.open), y(close))
              const bodyHeight = Math.max(
                2,
                Math.abs(y(candle.open) - y(close))
              )
              return (
                <g key={index} data-direction={rising ? "up" : "down"}>
                  <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} />
                  <rect
                    x={x - 3}
                    y={bodyY}
                    width="6"
                    height={bodyHeight}
                    rx="0.5"
                  />
                </g>
              )
            })}
          </g>
          <g
            className={styles.marketVolumeTrack}
            style={{ transform: `translateX(${trackOffset}px)` }}
          >
            {candles.map((candle, index) => {
              if (index > ANNOTATION_INDEX + outcomeCount || candle.volume <= 0)
                return null
              if (candleX(index) + trackOffset < PLOT_LEFT) return null
              const height = Math.max(2, (candle.volume / maxVolume) * 55)
              return (
                <rect
                  key={index}
                  data-direction={candle.close >= candle.open ? "up" : "down"}
                  x={candleX(index) - 3}
                  y={365 - height}
                  width="6"
                  height={height}
                />
              )
            })}
          </g>
          <line
            className={styles.marketVolumeDivider}
            x1={PLOT_LEFT}
            x2="700"
            y1="292"
            y2="292"
          />
          <line
            className={styles.marketCurrentLine}
            x1={PLOT_LEFT}
            x2="700"
            y1={y(currentRawClose)}
            y2={y(currentRawClose)}
          />
        </svg>

        <span
          className={styles.marketAxisPrice}
          style={{ top: `${y(currentRawClose) / 4.2}%` }}
        >
          {price.toFixed(2)}
        </span>

        <div className={styles.marketTimeAxis} aria-hidden="true">
          <span>09-12 04:00</span>
          <span>09-13 00:00</span>
          <span>09-13 18:00</span>
          <span>09-14 18:00</span>
        </div>

        <div className={styles.marketLegend} aria-hidden="true">
          <span>
            <i data-kind="event" />
            52 {labels.eventMarkers}
          </span>
          <span>
            <i data-kind="calendar" />
            58 {labels.calendarEvents}
          </span>
        </div>

        {sampleAnnotations.map((annotation) => {
          const x = candleX(annotation.index) + trackOffset
          if (x < PLOT_LEFT) return null
          return (
            <span
              key={annotation.id}
              className={styles.marketSampleAnnotation}
              data-direction={annotation.direction}
              style={{
                left: `${x / 7.2}%`,
                top: `${(y(candles[annotation.index].high) - 10) / 4.2}%`,
              }}
              aria-hidden="true"
            >
              <i aria-hidden="true" />
            </span>
          )
        })}

        {hasNews && at < timing.detailOpen ? (
          <aside className={styles.marketIngest} aria-live="polite">
            <span className={styles.graphIngestEyebrow}>
              <BellRingIcon /> {labels.newsAlert}
            </span>
            <strong>{labels.newsTitle}</strong>
            <small>{labels.sourceOne}</small>
            <div
              className={styles.graphIngestStatus}
              data-complete={annotationReady}
            >
              {annotationReady ? (
                <CheckCircle2Icon />
              ) : (
                <span className={styles.marketSpinner} />
              )}
              {at >= timing.resolving && !annotationReady
                ? labels.thinking
                : ingestStatus}
            </div>
            <div className={styles.graphIngestProgress}>
              <span
                style={{
                  transform: `scaleX(${annotationReady ? 1 : hasSecondSource ? 0.68 : 0.28})`,
                }}
              />
            </div>
          </aside>
        ) : null}

        {annotationReady ? (
          <span
            className={styles.marketAnnotation}
            data-selected={detailOpen}
            style={{ left: `${markerX}%`, top: `${markerY}%` }}
            aria-hidden="true"
          >
            <i aria-hidden="true" />
          </span>
        ) : null}

        <span
          className={styles.marketCursor}
          data-clicking={cursorClicking}
          style={{ left: `${cursorX}%`, top: `${cursorY}%` }}
          aria-hidden="true"
        >
          <MousePointer2Icon fill="currentColor" />
        </span>

        {detailOpen ? (
          <aside
            className={styles.marketDetail}
            style={{
              right: `${100 - markerX}%`,
              top: `max(1rem, calc(${markerY}% - 8rem))`,
            }}
          >
            <div className={styles.marketDetailHeader}>
              <span>{labels.eventCount}</span>
              <button
                type="button"
                aria-label={labels.closeDetail}
                onClick={() => setDetailDismissed(true)}
              >
                <XIcon />
              </button>
            </div>
            <div className={styles.marketDetailTime}>
              <CalendarDaysIcon /> {labels.createdAtValue}
            </div>
            <h3>{labels.detailTitle}</h3>
            <p>{labels.reasoning}</p>
            <div className={styles.marketPrediction}>
              <span>{labels.predictionLabel}</span>
              <strong>{labels.predictionValue}</strong>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
