"use client"

import {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { CalendarClock } from "lucide-react"
import {
  dispose,
  init,
  type Chart,
  type DataLoaderGetBarsParams,
  type DataLoaderSubscribeBarParams,
  type DeepPartial,
  type KLineData,
  type Overlay,
  type OverlayCreate,
  type Point,
  type Styles,
} from "klinecharts"
import { useTheme } from "next-themes"

import type { ActionResult } from "@/app/lib/definitions"
import {
  getEconomicCalendarImpactBadgeProps,
  getEconomicCalendarImpactLabel,
  getEconomicCalendarStatusVariant,
} from "@/app/lib/economic-calendar/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import type {
  MarketChartAnnotationDirection,
  MarketChartAnnotationResponse,
  MarketChartCandleItemResponse,
  MarketChartCandleRequest,
  MarketChartEconomicCalendarEventResponse,
  MarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { LocalizedLink } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { PopoverContentInOverlay } from "@/components/ui/popover-content-in-overlay"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import {
  getMarketChartAnnotationColorClassNames,
  mergeMarketChartAnnotations,
  mergeMarketChartEconomicCalendarEvents,
  type MarketChartAnnotationGroup,
  type MarketChartAnnotationMarkerPoint,
  type MarketChartEconomicCalendarEventGroup,
} from "./market-chart-annotations"
import { getMarketChartCalendarEventTimestamp } from "./market-chart-calendar-helpers"
import {
  createMarketChartDrawingGroupId,
  createMarketChartDrawingMode,
  createMarketChartDrawingOverlay,
  getMarketChartDrawingMetadataStyle,
  getMarketChartDrawingMetadataTool,
  getMarketChartDrawingToolFromOverlayName,
  mergeMarketChartDrawingMetadata,
  registerMarketChartDrawingOverlays,
  type MarketChartDrawingMetadata,
  type MarketChartDrawingTool,
} from "./market-chart-drawing"
import {
  DEFAULT_MARKET_CHART_DRAWING_STYLE,
  mergeMarketChartDrawingStyle,
  type MarketChartDrawingStyle,
} from "./market-chart-drawing-style"
import {
  createChartStyles,
  createDrawingOverlayStyles,
  getMarketChartThemePalette,
  resolveChartThemeMode,
  type ChartThemeMode,
  type MarketChartThemePalette,
} from "./market-chart-theme"
import {
  createKLinePeriod,
  ensureKLineChartLocales,
  resolveKLineChartLocale,
  KLINE_CHART_VI_LOCALE,
} from "./market-chart-period"
import {
  createKLineData,
  getCandleTimestamp,
  getFiniteVolume,
  hasUsableVolume,
  hasUsableVolumeData,
  isValidMarketChartCandle,
  mergeCandleItems,
  mergeLiveCandleItem,
  normalizeCandleItems,
} from "./market-chart-candle-helpers"
import {
  createOlderHistoryRequest,
  getNewOlderCandles,
  getOldestLoadedTimestamp,
} from "./market-chart-history-helpers"
import { registerMarketChartAtr } from "./market-chart-atr"
import {
  ICHIMOKU_DISPLACEMENT,
  registerMarketChartIchimoku,
} from "./market-chart-ichimoku"

export interface MarketChartLoadedData {
  annotations: MarketChartAnnotationResponse[]
  candles: MarketChartCandleItemResponse[]
  economicCalendarEvents: MarketChartEconomicCalendarEventResponse[]
  from: string | null
}

export const MARKET_CHART_INDICATORS = [
  "MA",
  "EMA",
  "BOLL",
  "MACD",
  "RSI",
  "KDJ",
  "ATR",
  "DMI",
  "ICHIMOKU",
  "VOL",
] as const

export type MarketChartIndicatorName = (typeof MARKET_CHART_INDICATORS)[number]

export interface MarketChartCanvasHandle {
  clearDrawings: () => boolean
  captureScreenshot: () => string | null
  deleteSelectedDrawing: () => boolean
  resize: () => void
  setDrawingMagnet: (enabled: boolean) => boolean
  setDrawingsLocked: (locked: boolean) => boolean
  setDrawingsVisible: (visible: boolean) => boolean
  setDrawingTool: (tool: MarketChartDrawingTool | null) => boolean
  setIndicators: (indicators: MarketChartIndicatorName[]) => boolean
  updateSelectedDrawingStyle: (
    patch: Partial<MarketChartDrawingStyle>
  ) => boolean
}

export interface MarketChartDrawingSelection {
  anchor: MarketChartAnnotationMarkerPoint | null
  id: string
  style: MarketChartDrawingStyle
}

export interface MarketChartOutcomeHoverRange {
  anchorTime: string
  evaluationTime: string
}

interface MarketChartCanvasProps {
  assetId: number
  candles: MarketChartCandleItemResponse[]
  dataVersion: number
  timeframe: MarketChartTimeframe
  symbol?: string
  pricePrecision?: number | null
  annotations?: MarketChartAnnotationResponse[]
  annotationGroups?: MarketChartAnnotationGroup[]
  calendarEventGroups?: MarketChartEconomicCalendarEventGroup[]
  calendarEvents?: MarketChartEconomicCalendarEventResponse[]
  calendarLayerEnabled: boolean
  warmAnnotationGroups?: MarketChartAnnotationGroup[]
  annotationLayerEnabled: boolean
  liveCandle?: MarketChartCandleItemResponse | null
  selectedAnnotationGroupId?: string | null
  activeOutcomeHoverRange?: MarketChartOutcomeHoverRange | null
  activeIndicators?: MarketChartIndicatorName[]
  className?: string
  drawingToolActive?: boolean
  onAnnotationSelect?: (groupId: string) => void
  onAnnotationClose?: () => void
  renderAnnotationPopup?: (group: MarketChartAnnotationGroup) => React.ReactNode
  onDrawingSelectionChange?: (
    selection: MarketChartDrawingSelection | null
  ) => void
  onDrawingToolComplete?: () => void
  onLoadedDataChange?: (data: MarketChartLoadedData) => void
  onLoadOlderCandles: (
    request: MarketChartCandleRequest
  ) => Promise<ActionResult<MarketChartLoadedData>>
}

interface MarkerPosition {
  group: MarketChartAnnotationGroup
  x: number
  y: number
}

interface CalendarMarkerPosition {
  group: MarketChartEconomicCalendarEventGroup
  x: number
}

export function MarketChartCalendarEventList({
  events,
}: {
  events: MarketChartEconomicCalendarEventResponse[]
}) {
  const { dictionary, formatDateTime } = useLocalization()

  function getEventTitle(event: MarketChartEconomicCalendarEventResponse) {
    return event.title?.trim() || dictionary.marketCharts.calendar.eventFallback
  }

  return (
    <ScrollArea className="max-h-80 [&>[data-slot=scroll-area-viewport]]:max-h-80">
      <div className="flex flex-col p-1 pr-3">
        {events.map((event, index) => {
          const eventTimestamp = getMarketChartCalendarEventTimestamp(event)
          const releaseValues = [
            {
              key: "actualValue",
              label: dictionary.marketCharts.calendar.actual,
              value: event.actualValue?.trim(),
            },
            {
              key: "forecastValue",
              label: dictionary.marketCharts.calendar.forecast,
              value: event.forecastValue?.trim(),
            },
            {
              key: "previousValue",
              label: dictionary.marketCharts.calendar.previous,
              value: event.previousValue?.trim(),
            },
          ].filter(
            (item): item is { key: string; label: string; value: string } =>
              !!item.value
          )

          return (
            <Fragment key={event.id}>
              <article className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <AppTimeMetadata icon={CalendarClock}>
                    {formatDateTime(
                      eventTimestamp ?? event.time,
                      MARKER_DATE_TIME_OPTIONS,
                      dictionary.marketCharts.format.notAvailable
                    )}
                  </AppTimeMetadata>
                  {event.impact?.trim() ? (
                    <Badge
                      {...getEconomicCalendarImpactBadgeProps(event.impact)}
                    >
                      {getEconomicCalendarImpactLabel(event.impact, dictionary)}
                    </Badge>
                  ) : null}
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                  {getEventTitle(event)}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  {event.currencyCode?.trim() ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      {event.currencyCode.trim()}
                    </span>
                  ) : null}
                  <Badge
                    variant={getEconomicCalendarStatusVariant(event.status)}
                  >
                    {
                      dictionary.marketCharts.calendar.statusLabels[
                        event.status
                      ]
                    }
                  </Badge>
                </div>
                {releaseValues.length > 0 ? (
                  <dl className="grid grid-cols-3 gap-2">
                    {releaseValues.map((item) => (
                      <div key={item.key} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd
                          className={cn(
                            "truncate text-sm tabular-nums",
                            item.key === "actualValue"
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground"
                          )}
                        >
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {event.revision?.trim() ? (
                  <p className="text-xs text-muted-foreground">
                    {dictionary.marketCharts.calendar.revision}:{" "}
                    <span className="tabular-nums">
                      {event.revision.trim()}
                    </span>
                  </p>
                ) : null}
                {event.description ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
                <LocalizedLink
                  href={`/economic-calendar/${event.id}`}
                  className="w-fit rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {dictionary.common.detail}
                </LocalizedLink>
              </article>
              {index < events.length - 1 ? (
                <Separator className="my-2" />
              ) : null}
            </Fragment>
          )
        })}
      </div>
    </ScrollArea>
  )
}

interface WarmBandPosition extends OutcomeHoverBand {
  group: MarketChartAnnotationGroup
}

interface OutcomeHoverBand {
  height: number
  left: number
  top: number
  width: number
}

type LazyHistoryState = "idle" | "loading" | "error"

interface LazyHistoryFeedback {
  error: string | null
  loadId: number
  state: LazyHistoryState
}

const CANDLE_PANE_ID = "candle_pane"
const VOLUME_PANE_ID = "market-chart-volume"
const DEFAULT_MARKET_CHART_RIGHT_OFFSET = 24
const MARKET_CHART_MAIN_PANE_INDICATORS = new Set<MarketChartIndicatorName>([
  "MA",
  "EMA",
  "BOLL",
  "ICHIMOKU",
])
const MARKER_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

function getMarkerCoordinate(
  chart: Chart,
  group: { anchorPrice: number; time: number }
): MarketChartAnnotationMarkerPoint | null {
  const coordinate = chart.convertToPixel(
    {
      timestamp: group.time,
      value: group.anchorPrice,
    },
    {
      absolute: true,
      paneId: CANDLE_PANE_ID,
    }
  )

  if (Array.isArray(coordinate)) {
    return null
  }

  if (typeof coordinate.x !== "number" || typeof coordinate.y !== "number") {
    return null
  }

  return {
    x: coordinate.x,
    y: coordinate.y,
  }
}

function isFiniteCoordinate(
  coordinate: Partial<MarketChartAnnotationMarkerPoint>
): coordinate is MarketChartAnnotationMarkerPoint {
  return (
    typeof coordinate.x === "number" &&
    Number.isFinite(coordinate.x) &&
    typeof coordinate.y === "number" &&
    Number.isFinite(coordinate.y)
  )
}

function getFiniteXCoordinate(coordinate: unknown): number | null {
  if (
    !coordinate ||
    Array.isArray(coordinate) ||
    typeof coordinate !== "object"
  ) {
    return null
  }

  const x = (coordinate as { x?: unknown }).x

  return typeof x === "number" && Number.isFinite(x) ? x : null
}

function getFiniteYCoordinate(coordinate: unknown): number | null {
  if (
    !coordinate ||
    Array.isArray(coordinate) ||
    typeof coordinate !== "object"
  ) {
    return null
  }

  const y = (coordinate as { y?: unknown }).y

  return typeof y === "number" && Number.isFinite(y) ? y : null
}

function getTimeRangeBand({
  chart,
  container,
  endTime,
  priceRange,
  startTime,
}: {
  chart: Chart
  container: HTMLElement
  endTime: string
  priceRange?: { high: number; low: number }
  startTime: string
}): OutcomeHoverBand | null {
  const anchorTimestamp = Date.parse(startTime)
  const evaluationTimestamp = Date.parse(endTime)

  if (
    !Number.isFinite(anchorTimestamp) ||
    !Number.isFinite(evaluationTimestamp)
  ) {
    return null
  }

  const anchorCoordinate = chart.convertToPixel(
    { timestamp: anchorTimestamp },
    { absolute: true, paneId: CANDLE_PANE_ID }
  )
  const evaluationCoordinate = chart.convertToPixel(
    { timestamp: evaluationTimestamp },
    { absolute: true, paneId: CANDLE_PANE_ID }
  )
  const anchorX = getFiniteXCoordinate(anchorCoordinate)
  const evaluationX = getFiniteXCoordinate(evaluationCoordinate)

  if (anchorX === null || evaluationX === null) {
    return null
  }

  const pane = chart.getDom(CANDLE_PANE_ID, "main")

  if (!(pane instanceof HTMLElement)) {
    return null
  }

  const paneRect = pane.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const paneLeft = paneRect.left - containerRect.left
  const paneRight = paneLeft + paneRect.width
  const left = Math.max(paneLeft, Math.min(anchorX, evaluationX))
  const right = Math.min(paneRight, Math.max(anchorX, evaluationX))
  let top = paneRect.top - containerRect.top
  let height = paneRect.height

  if (priceRange) {
    const timestamp = Math.min(anchorTimestamp, evaluationTimestamp)
    const highY = getFiniteYCoordinate(
      chart.convertToPixel(
        { timestamp, value: priceRange.high },
        { absolute: true, paneId: CANDLE_PANE_ID }
      )
    )
    const lowY = getFiniteYCoordinate(
      chart.convertToPixel(
        { timestamp, value: priceRange.low },
        { absolute: true, paneId: CANDLE_PANE_ID }
      )
    )

    if (highY === null || lowY === null) {
      return null
    }

    const paneTop = paneRect.top - containerRect.top
    const paneBottom = paneTop + paneRect.height
    top = Math.max(paneTop, Math.min(highY, lowY))
    const bottom = Math.min(paneBottom, Math.max(highY, lowY))
    height = Math.max(10, bottom - top)
  }

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(right) ||
    right <= left ||
    height <= 0
  ) {
    return null
  }

  return {
    height,
    left,
    top,
    width: right - left,
  }
}

function getWarmBandPriceRange({
  candles,
  endTime,
  startTime,
}: {
  candles: MarketChartCandleItemResponse[]
  endTime: string
  startTime: string
}) {
  const start = Date.parse(startTime)
  const end = Date.parse(endTime)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null
  }

  const from = Math.min(start, end)
  const to = Math.max(start, end)
  let high = Number.NEGATIVE_INFINITY
  let low = Number.POSITIVE_INFINITY

  for (const candle of candles) {
    const timestamp = getCandleTimestamp(candle)

    if (
      timestamp === null ||
      timestamp < from ||
      timestamp > to ||
      !Number.isFinite(candle.high) ||
      !Number.isFinite(candle.low)
    ) {
      continue
    }

    high = Math.max(high, candle.high)
    low = Math.min(low, candle.low)
  }

  return Number.isFinite(high) && Number.isFinite(low) ? { high, low } : null
}

function getOutcomeHoverBand({
  chart,
  container,
  range,
}: {
  chart: Chart
  container: HTMLElement
  range: MarketChartOutcomeHoverRange | null
}): OutcomeHoverBand | null {
  return range
    ? getTimeRangeBand({
        chart,
        container,
        endTime: range.evaluationTime,
        startTime: range.anchorTime,
      })
    : null
}

function getWarmBandClassName(
  direction: MarketChartAnnotationDirection | null
) {
  switch (direction) {
    case "BULLISH":
      return "bg-emerald-500/10 ring-emerald-500/30 hover:bg-emerald-500/15"
    case "BEARISH":
      return "bg-destructive/10 ring-destructive/30 hover:bg-destructive/15"
    case "NEUTRAL":
      return "bg-amber-500/10 ring-amber-500/30 hover:bg-amber-500/15"
    case "MIXED":
      return "bg-orange-500/10 ring-orange-500/30 hover:bg-orange-500/15"
    default:
      return "bg-muted-foreground/10 ring-muted-foreground/25 hover:bg-muted-foreground/15"
  }
}

function hasDrawingPointCoordinate(
  point: Partial<Point>
): point is Pick<Point, "timestamp" | "value"> {
  return (
    typeof point.timestamp === "number" &&
    Number.isFinite(point.timestamp) &&
    typeof point.value === "number" &&
    Number.isFinite(point.value)
  )
}

function getDrawingToolForOverlay(
  overlay: Overlay<MarketChartDrawingMetadata>
): MarketChartDrawingTool | null {
  return getMarketChartDrawingMetadataTool(
    overlay.extendData,
    getMarketChartDrawingToolFromOverlayName(overlay.name)
  )
}

function getDrawingSelectionAnchor({
  chart,
  container,
  overlay,
}: {
  chart: Chart
  container: HTMLElement
  overlay: Overlay<MarketChartDrawingMetadata>
}): MarketChartAnnotationMarkerPoint | null {
  const overlayPoints = overlay.points.filter(hasDrawingPointCoordinate)

  if (overlayPoints.length === 0) {
    return null
  }

  const coordinates = chart.convertToPixel(overlayPoints, {
    absolute: true,
    paneId: overlay.paneId || CANDLE_PANE_ID,
  })
  const coordinateList = Array.isArray(coordinates)
    ? coordinates
    : [coordinates]
  const finiteCoordinates = coordinateList.filter(isFiniteCoordinate)

  if (finiteCoordinates.length === 0) {
    return null
  }

  const xs = finiteCoordinates.map((coordinate) => coordinate.x)
  const ys = finiteCoordinates.map((coordinate) => coordinate.y)
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const topY = Math.min(...ys)

  return {
    x: Math.max(96, Math.min(container.clientWidth - 96, centerX)),
    y: Math.max(44, Math.min(container.clientHeight - 72, topY - 12)),
  }
}

function createDrawingSelection({
  chart,
  container,
  overlay,
}: {
  chart: Chart
  container: HTMLElement
  overlay: Overlay<MarketChartDrawingMetadata>
}): MarketChartDrawingSelection {
  return {
    anchor: getDrawingSelectionAnchor({ chart, container, overlay }),
    id: overlay.id,
    style: getMarketChartDrawingMetadataStyle(overlay.extendData),
  }
}

function syncChartIndicators(
  chart: Chart,
  activeIndicators: MarketChartIndicatorName[]
) {
  const enabledIndicators = new Set(activeIndicators)
  const hadIchimoku = chart.getIndicators({ name: "ICHIMOKU" }).length > 0

  for (const indicator of MARKET_CHART_INDICATORS) {
    const existingIndicators = chart.getIndicators({ name: indicator })
    const enabled = enabledIndicators.has(indicator)

    if (enabled && existingIndicators.length === 0) {
      const isMainPaneIndicator =
        MARKET_CHART_MAIN_PANE_INDICATORS.has(indicator)
      const paneOptions =
        indicator === "VOL"
          ? {
              dragEnabled: false,
              height: 92,
              id: VOLUME_PANE_ID,
              minHeight: 64,
            }
          : isMainPaneIndicator
            ? { id: CANDLE_PANE_ID }
            : {
                height: 96,
                id: `market-chart-indicator-${indicator.toLowerCase()}`,
                minHeight: 64,
              }

      const indicatorId = chart.createIndicator(
        { name: indicator, paneId: paneOptions.id },
        isMainPaneIndicator
      )

      if (indicatorId && !isMainPaneIndicator) {
        chart.setPaneOptions(paneOptions)
      }
      continue
    }

    if (!enabled && existingIndicators.length > 0) {
      chart.removeIndicator({ name: indicator })
    }
  }

  const hasIchimoku = chart.getIndicators({ name: "ICHIMOKU" }).length > 0
  if (hasIchimoku !== hadIchimoku) {
    chart.setOffsetRightDistance(
      hasIchimoku
        ? chart.getBarSpace().bar * ICHIMOKU_DISPLACEMENT
        : DEFAULT_MARKET_CHART_RIGHT_OFFSET
    )
  }
}

export const MarketChartCanvas = forwardRef<
  MarketChartCanvasHandle,
  MarketChartCanvasProps
>(function MarketChartCanvas(
  {
    annotations = [],
    annotationGroups = [],
    calendarEventGroups = [],
    calendarEvents = [],
    calendarLayerEnabled,
    warmAnnotationGroups = [],
    annotationLayerEnabled,
    assetId,
    activeOutcomeHoverRange = null,
    activeIndicators = [],
    candles,
    dataVersion = 0,
    className,
    drawingToolActive = false,
    liveCandle = null,
    onAnnotationClose,
    onAnnotationSelect,
    onDrawingSelectionChange,
    onDrawingToolComplete,
    onLoadedDataChange,
    onLoadOlderCandles,
    renderAnnotationPopup,
    selectedAnnotationGroupId,
    symbol = "MARKET",
    pricePrecision,
    timeframe,
  },
  ref
) {
  const {
    dictionary,
    formatDateTime,
    formatMessage,
    formatNumber,
    intlLocale,
  } = useLocalization()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<Chart | null>(null)
  const [chartLoadId, setChartLoadId] = useState(0)
  const chartLoadIdRef = useRef(0)
  const activeDrawingDraftIdRef = useRef<string | null>(null)
  const activeDrawingToolRef = useRef<MarketChartDrawingTool | null>(null)
  const annotationLayerEnabledRef = useRef(annotationLayerEnabled)
  const calendarLayerEnabledRef = useRef(calendarLayerEnabled)
  const annotationsRef = useRef(annotations)
  const annotationGroupsRef = useRef(annotationGroups)
  const calendarEventGroupsRef = useRef(calendarEventGroups)
  const calendarEventsRef = useRef(calendarEvents)
  const warmAnnotationGroupsRef = useRef(warmAnnotationGroups)
  const activeOutcomeHoverRangeRef =
    useRef<MarketChartOutcomeHoverRange | null>(activeOutcomeHoverRange)
  const candlesRef = useRef(candles)
  const drawingGroupIdRef = useRef(
    createMarketChartDrawingGroupId({ assetId, timeframe })
  )
  const drawingLockedRef = useRef(false)
  const drawingMagnetRef = useRef(false)
  const drawingVisibleRef = useRef(true)
  const loadedAnnotationsRef = useRef<MarketChartAnnotationResponse[]>([])
  const loadedCalendarEventsRef = useRef<
    MarketChartEconomicCalendarEventResponse[]
  >([])
  const loadedCandlesRef = useRef<MarketChartCandleItemResponse[]>([])
  const liveCandleRef = useRef<MarketChartCandleItemResponse | null>(liveCandle)
  const liveCandleSubscriberRef = useRef<
    DataLoaderSubscribeBarParams["callback"] | null
  >(null)
  const liveCandleSubscriberLoadIdRef = useRef<number | null>(null)
  const historyExhaustedRef = useRef(false)
  const onDrawingSelectionChangeRef = useRef(onDrawingSelectionChange)
  const onDrawingToolCompleteRef = useRef(onDrawingToolComplete)
  const onLoadedDataChangeRef = useRef(onLoadedDataChange)
  const onLoadOlderCandlesRef = useRef(onLoadOlderCandles)
  const drawingCacheRef = useRef<Map<string, OverlayCreate[]>>(new Map())
  const scheduleMarkerPositionUpdateRef = useRef<() => void>(() => {})
  const selectedDrawingIdRef = useRef<string | null>(null)
  const [historyFeedback, setHistoryFeedback] = useState<LazyHistoryFeedback>({
    error: null,
    loadId: 0,
    state: "idle",
  })
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([])
  const [calendarMarkerPositions, setCalendarMarkerPositions] = useState<
    CalendarMarkerPosition[]
  >([])
  const [activeCalendarGuideX, setActiveCalendarGuideX] = useState<
    number | null
  >(null)
  const [warmBandPositions, setWarmBandPositions] = useState<
    WarmBandPosition[]
  >([])
  const [outcomeHoverBand, setOutcomeHoverBand] =
    useState<OutcomeHoverBand | null>(null)
  const { resolvedTheme } = useTheme()
  const chartThemeMode = resolveChartThemeMode(resolvedTheme)
  const chartThemePalette = getMarketChartThemePalette(chartThemeMode)
  const historyState =
    historyFeedback.loadId === chartLoadId ? historyFeedback.state : "idle"
  const historyError =
    historyFeedback.loadId === chartLoadId ? historyFeedback.error : null

  useEffect(() => {
    annotationLayerEnabledRef.current = annotationLayerEnabled
    annotationsRef.current = annotations
    loadedAnnotationsRef.current = annotationLayerEnabled ? annotations : []
  }, [annotations, annotationLayerEnabled])

  useEffect(() => {
    calendarLayerEnabledRef.current = calendarLayerEnabled
    calendarEventsRef.current = calendarEvents
    loadedCalendarEventsRef.current = calendarLayerEnabled ? calendarEvents : []
  }, [calendarEvents, calendarLayerEnabled])

  useEffect(() => {
    candlesRef.current = candles
  }, [candles])

  useEffect(() => {
    loadedCandlesRef.current = normalizeCandleItems(candlesRef.current)

    const chart = chartRef.current
    if (chart && dataVersion > 0) {
      chart.resetData()
    }
  }, [dataVersion])

  useEffect(() => {
    annotationGroupsRef.current = annotationGroups
    scheduleMarkerPositionUpdateRef.current()
  }, [annotationGroups])

  useEffect(() => {
    calendarEventGroupsRef.current = calendarEventGroups
    scheduleMarkerPositionUpdateRef.current()
  }, [calendarEventGroups])

  useEffect(() => {
    warmAnnotationGroupsRef.current = warmAnnotationGroups
    scheduleMarkerPositionUpdateRef.current()
  }, [warmAnnotationGroups])

  useEffect(() => {
    activeOutcomeHoverRangeRef.current = activeOutcomeHoverRange
    scheduleMarkerPositionUpdateRef.current()
  }, [activeOutcomeHoverRange])

  useEffect(() => {
    liveCandleRef.current = liveCandle
    if (
      liveCandle &&
      liveCandleSubscriberLoadIdRef.current === chartLoadIdRef.current &&
      liveCandleSubscriberRef.current
    ) {
      const [liveData] = createKLineData([liveCandle])

      if (liveData) {
        liveCandleSubscriberRef.current(liveData)
      }
    }
    scheduleMarkerPositionUpdateRef.current()
  }, [liveCandle])

  useEffect(() => {
    onLoadedDataChangeRef.current = onLoadedDataChange
  }, [onLoadedDataChange])

  useEffect(() => {
    onDrawingSelectionChangeRef.current = onDrawingSelectionChange
  }, [onDrawingSelectionChange])

  useEffect(() => {
    onDrawingToolCompleteRef.current = onDrawingToolComplete
  }, [onDrawingToolComplete])

  useEffect(() => {
    onLoadOlderCandlesRef.current = onLoadOlderCandles
  }, [onLoadOlderCandles])

  function getOverlayById(
    id: string
  ): Overlay<MarketChartDrawingMetadata> | null {
    const chart = chartRef.current

    if (!chart) {
      return null
    }

    return (
      (chart.getOverlays({ id })[0] as
        Overlay<MarketChartDrawingMetadata> | undefined) ?? null
    )
  }

  function emitDrawingSelection(id: string | null) {
    const chart = chartRef.current
    const container = containerRef.current

    if (!id || !chart || !container) {
      selectedDrawingIdRef.current = null
      onDrawingSelectionChangeRef.current?.(null)
      return
    }

    const overlay = getOverlayById(id)

    if (!overlay) {
      selectedDrawingIdRef.current = null
      onDrawingSelectionChangeRef.current?.(null)
      return
    }

    selectedDrawingIdRef.current = overlay.id
    onDrawingSelectionChangeRef.current?.(
      createDrawingSelection({ chart, container, overlay })
    )
  }

  function clearDrawingSelection() {
    emitDrawingSelection(null)
  }

  function cancelActiveDrawingDraft() {
    const chart = chartRef.current
    const draftId = activeDrawingDraftIdRef.current

    if (chart && draftId) {
      chart.removeOverlay({ id: draftId })
    }

    activeDrawingDraftIdRef.current = null
    activeDrawingToolRef.current = null
  }

  function setActiveDrawingTool(tool: MarketChartDrawingTool | null) {
    const chart = chartRef.current

    if (!chart) {
      return false
    }

    cancelActiveDrawingDraft()

    if (!tool) {
      return true
    }

    const overlayId = chart.createOverlay(
      createMarketChartDrawingOverlay({
        groupId: drawingGroupIdRef.current,
        isLocked: false,
        isMagnetEnabled: drawingMagnetRef.current,
        isVisible: drawingVisibleRef.current,
        onDeselected(event) {
          if (selectedDrawingIdRef.current === event.overlay.id) {
            clearDrawingSelection()
          }
        },
        onDrawEnd(event) {
          activeDrawingDraftIdRef.current = null
          activeDrawingToolRef.current = null
          if (drawingLockedRef.current) {
            event.chart.overrideOverlay({
              id: event.overlay.id,
              lock: true,
            })
          }
          emitDrawingSelection(event.overlay.id)
          onDrawingToolCompleteRef.current?.()
        },
        onRemoved(event) {
          if (activeDrawingDraftIdRef.current === event.overlay.id) {
            activeDrawingDraftIdRef.current = null
          }

          if (selectedDrawingIdRef.current === event.overlay.id) {
            clearDrawingSelection()
          }
        },
        onSelected(event) {
          emitDrawingSelection(event.overlay.id)
        },
        paneId: CANDLE_PANE_ID,
        style: DEFAULT_MARKET_CHART_DRAWING_STYLE,
        styles: createDrawingOverlayStyles(
          chartThemePalette,
          DEFAULT_MARKET_CHART_DRAWING_STYLE
        ),
        tool,
      })
    )

    if (!overlayId || Array.isArray(overlayId)) {
      return false
    }

    activeDrawingDraftIdRef.current = overlayId
    activeDrawingToolRef.current = tool
    return true
  }

  function setDrawingGroupLock(locked: boolean) {
    const chart = chartRef.current

    drawingLockedRef.current = locked

    if (!chart) {
      return false
    }

    const overlays = chart.getOverlays({ groupId: drawingGroupIdRef.current })

    if (overlays.length > 0) {
      chart.overrideOverlay({
        groupId: drawingGroupIdRef.current,
        lock: locked,
      })
    }

    return true
  }

  function setDrawingGroupVisibility(visible: boolean) {
    const chart = chartRef.current

    drawingVisibleRef.current = visible

    if (!chart) {
      return false
    }

    const overlays = chart.getOverlays({ groupId: drawingGroupIdRef.current })

    if (overlays.length > 0) {
      chart.overrideOverlay({
        groupId: drawingGroupIdRef.current,
        visible,
      })
    }

    return true
  }

  function setDrawingGroupMagnet(enabled: boolean) {
    const chart = chartRef.current

    drawingMagnetRef.current = enabled

    if (!chart) {
      return false
    }

    const overlays = chart.getOverlays({ groupId: drawingGroupIdRef.current })

    if (overlays.length > 0) {
      chart.overrideOverlay({
        groupId: drawingGroupIdRef.current,
        mode: createMarketChartDrawingMode(enabled),
      })
    }

    return true
  }

  function deleteSelectedDrawing() {
    const chart = chartRef.current
    const selectedDrawingId = selectedDrawingIdRef.current

    if (!chart || !selectedDrawingId) {
      return false
    }

    const removed = chart.removeOverlay({ id: selectedDrawingId })

    if (removed) {
      clearDrawingSelection()
    }

    return removed
  }

  function updateSelectedDrawingStyle(patch: Partial<MarketChartDrawingStyle>) {
    const chart = chartRef.current
    const selectedDrawingId = selectedDrawingIdRef.current

    if (!chart || !selectedDrawingId) {
      return false
    }

    const overlay = getOverlayById(selectedDrawingId)
    const tool = overlay ? getDrawingToolForOverlay(overlay) : null

    if (!overlay || !tool) {
      return false
    }

    const style = mergeMarketChartDrawingStyle(overlay.extendData?.style, patch)
    const updated = chart.overrideOverlay({
      extendData: mergeMarketChartDrawingMetadata(overlay.extendData, {
        style,
        tool,
      }),
      id: overlay.id,
      styles: createDrawingOverlayStyles(chartThemePalette, style),
    })

    if (updated) {
      emitDrawingSelection(overlay.id)
    }

    return updated
  }

  function clearDrawings() {
    const chart = chartRef.current

    if (!chart) {
      return false
    }

    cancelActiveDrawingDraft()
    clearDrawingSelection()
    chart.removeOverlay({ groupId: drawingGroupIdRef.current })
    return true
  }

  useImperativeHandle(ref, () => ({
    clearDrawings,
    captureScreenshot() {
      return chartRef.current?.getConvertPictureUrl(true, "png") ?? null
    },
    deleteSelectedDrawing,
    resize() {
      chartRef.current?.resize()
    },
    setDrawingMagnet: setDrawingGroupMagnet,
    setDrawingsLocked: setDrawingGroupLock,
    setDrawingsVisible: setDrawingGroupVisibility,
    setDrawingTool: setActiveDrawingTool,
    setIndicators(indicators) {
      const chart = chartRef.current

      if (!chart) {
        return false
      }

      syncChartIndicators(chart, indicators)
      return true
    },
    updateSelectedDrawingStyle,
  }))

  // ── Mount effect: init chart once, plus stable subscriptions ──
  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    registerMarketChartDrawingOverlays()
    registerMarketChartAtr()
    registerMarketChartIchimoku()

    const chart = init(container, {
      layout: {
        yAxis: {
          gap: { bottom: 0.22, top: 0.08 },
        },
      },
      locale: resolveKLineChartLocale(intlLocale),
      styles: createChartStyles(chartThemePalette),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      zoomAnchor: "cursor",
    })

    if (!chart) {
      return
    }

    chartRef.current = chart
    chart.setOffsetRightDistance(DEFAULT_MARKET_CHART_RIGHT_OFFSET)
    chart.setLeftMinVisibleBarCount(8)
    chart.setRightMinVisibleBarCount(8)

    const updateMarkerPositions = () => {
      const currentChart = chartRef.current
      const currentContainer = containerRef.current

      if (!currentChart || !currentContainer) {
        return
      }

      const nextPositions = annotationGroupsRef.current.flatMap((group) => {
        const point = getMarkerCoordinate(currentChart, group)

        if (
          !point ||
          point.x < 0 ||
          point.x > currentContainer.clientWidth ||
          point.y < 0 ||
          point.y > currentContainer.clientHeight
        ) {
          return []
        }

        return [{ group, x: point.x, y: point.y - 18 }]
      })
      const nextCalendarPositions = calendarEventGroupsRef.current.flatMap(
        (group) => {
          const point = getMarkerCoordinate(currentChart, group)

          if (!point || point.x < 0 || point.x > currentContainer.clientWidth) {
            return []
          }

          return [{ group, x: point.x }]
        }
      )
      const nextWarmBandPositions = warmAnnotationGroupsRef.current.flatMap(
        (group) => {
          const annotation = group.annotations[0]
          const warmEpisode = annotation?.warmEpisode

          if (!warmEpisode?.periodStart || !warmEpisode.periodEnd) {
            return []
          }

          const priceRange = getWarmBandPriceRange({
            candles: loadedCandlesRef.current,
            endTime: warmEpisode.periodEnd,
            startTime: warmEpisode.periodStart,
          })

          if (!priceRange) {
            return []
          }

          const band = getTimeRangeBand({
            chart: currentChart,
            container: currentContainer,
            endTime: warmEpisode.periodEnd,
            priceRange,
            startTime: warmEpisode.periodStart,
          })

          return band ? [{ ...band, group }] : []
        }
      )

      setMarkerPositions(nextPositions)
      setCalendarMarkerPositions(nextCalendarPositions)
      setWarmBandPositions(nextWarmBandPositions)
      setOutcomeHoverBand(
        getOutcomeHoverBand({
          chart: currentChart,
          container: currentContainer,
          range: activeOutcomeHoverRangeRef.current,
        })
      )

      if (selectedDrawingIdRef.current) {
        emitDrawingSelection(selectedDrawingIdRef.current)
      }
    }

    const scheduleMarkerPositionUpdate = () => {
      window.requestAnimationFrame(updateMarkerPositions)
    }

    scheduleMarkerPositionUpdateRef.current = scheduleMarkerPositionUpdate

    chart.subscribeAction("onVisibleRangeChange", scheduleMarkerPositionUpdate)
    chart.subscribeAction("onScroll", scheduleMarkerPositionUpdate)
    chart.subscribeAction("onZoom", scheduleMarkerPositionUpdate)

    const frameId = window.requestAnimationFrame(updateMarkerPositions)
    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
      scheduleMarkerPositionUpdate()
    })

    resizeObserver.observe(container)

    return () => {
      window.cancelAnimationFrame(frameId)
      chart.unsubscribeAction(
        "onVisibleRangeChange",
        scheduleMarkerPositionUpdate
      )
      chart.unsubscribeAction("onScroll", scheduleMarkerPositionUpdate)
      chart.unsubscribeAction("onZoom", scheduleMarkerPositionUpdate)
      resizeObserver.disconnect()
      scheduleMarkerPositionUpdateRef.current = () => {}
      liveCandleSubscriberRef.current = null
      liveCandleSubscriberLoadIdRef.current = null
      activeDrawingDraftIdRef.current = null
      activeDrawingToolRef.current = null
      selectedDrawingIdRef.current = null
      chartRef.current = null
      onDrawingSelectionChangeRef.current?.(null)
      setMarkerPositions([])
      setCalendarMarkerPositions([])
      setActiveCalendarGuideX(null)
      setWarmBandPositions([])
      setOutcomeHoverBand(null)
      dispose(chart)
    }
  }, [])

  // ── Sync: theme styles — klinecharts native ──
  useEffect(() => {
    const chart = chartRef.current

    if (!chart) {
      return
    }

    chart.setStyles(createChartStyles(chartThemePalette))

    chart
      .getOverlays({ groupId: drawingGroupIdRef.current })
      .forEach((overlay) => {
        const drawingOverlay = overlay as Overlay<MarketChartDrawingMetadata>
        const tool = getDrawingToolForOverlay(drawingOverlay)

        if (!tool) {
          return
        }

        const style = getMarketChartDrawingMetadataStyle(
          drawingOverlay.extendData
        )

        chart.overrideOverlay({
          extendData: mergeMarketChartDrawingMetadata(
            drawingOverlay.extendData,
            { style, tool }
          ),
          id: drawingOverlay.id,
          styles: createDrawingOverlayStyles(chartThemePalette, style),
        })
      })

    scheduleMarkerPositionUpdateRef.current()
  }, [chartThemePalette])

  // ── Sync: locale ──
  useEffect(() => {
    chartRef.current?.setLocale(resolveKLineChartLocale(intlLocale))
  }, [intlLocale])

  // ── Sync: symbol ──
  useEffect(() => {
    chartRef.current?.setSymbol({
      ticker: symbol,
      pricePrecision: pricePrecision ?? 4,
      volumePrecision: 2,
    })
  }, [pricePrecision, symbol])

  // ── Sync: timeframe ──
  useEffect(() => {
    chartRef.current?.setPeriod(createKLinePeriod(timeframe))
  }, [timeframe])

  // ── Sync effect 2: data source change — reset DataLoader ──
  useEffect(() => {
    const chart = chartRef.current

    if (!chart) {
      return
    }

    // Save & clear overlays from previous data source
    const oldKey = drawingGroupIdRef.current
    const oldOverlays = chart.getOverlays({ groupId: oldKey })
    if (oldOverlays.length > 0) {
      drawingCacheRef.current.set(
        oldKey,
        oldOverlays.map(
          ({
            extendData,
            lock,
            mode,
            modeSensitivity,
            name,
            paneId,
            points,
            styles,
            visible,
            zLevel,
          }) => ({
            extendData,
            lock,
            mode,
            modeSensitivity,
            name,
            paneId,
            points,
            styles,
            visible,
            zLevel,
          })
        )
      )
      chart.removeOverlay({ groupId: oldKey })
    }

    // Sync data refs and increment load ID (invalidates stale history requests)
    const loadId = chartLoadIdRef.current + 1
    chartLoadIdRef.current = loadId
    setChartLoadId(loadId)
    historyExhaustedRef.current = false
    clearDrawingSelection()
    loadedAnnotationsRef.current = annotationLayerEnabledRef.current
      ? annotationsRef.current
      : []
    loadedCalendarEventsRef.current = calendarLayerEnabledRef.current
      ? calendarEventsRef.current
      : []
    loadedCandlesRef.current = normalizeCandleItems(candlesRef.current)

    // Update drawing group ID for new data source
    const newKey = createMarketChartDrawingGroupId({ assetId, timeframe })
    drawingGroupIdRef.current = newKey

    // Restore overlays for new data source from cache
    const savedOverlays = drawingCacheRef.current.get(newKey)
    if (savedOverlays) {
      savedOverlays.forEach((overlay) => {
        const tool = getMarketChartDrawingMetadataTool(
          overlay.extendData,
          getMarketChartDrawingToolFromOverlayName(overlay.name ?? "")
        )
        const style = getMarketChartDrawingMetadataStyle(overlay.extendData)

        chart.createOverlay({
          ...overlay,
          extendData: tool
            ? mergeMarketChartDrawingMetadata(overlay.extendData, {
                style,
                tool,
              })
            : overlay.extendData,
          groupId: newKey,
          styles: createDrawingOverlayStyles(chartThemePalette, style),
        })
      })
      drawingCacheRef.current.delete(newKey)
    }

    async function loadBars({
      callback,
      timestamp,
      type,
    }: DataLoaderGetBarsParams) {
      if (type === "init") {
        const displayed = mergeLiveCandleItem(
          loadedCandlesRef.current,
          liveCandleRef.current
        )
        callback(createKLineData(displayed), {
          backward: false,
          forward: displayed.length > 0,
        })
        scheduleMarkerPositionUpdateRef.current()
        return
      }

      if (type !== "forward") {
        callback([], { backward: false, forward: !historyExhaustedRef.current })
        return
      }

      if (historyExhaustedRef.current) {
        callback([], { backward: false, forward: false })
        return
      }

      const oldestTimestamp =
        timestamp ?? getOldestLoadedTimestamp(loadedCandlesRef.current)
      const request =
        oldestTimestamp !== null
          ? createOlderHistoryRequest({ assetId, oldestTimestamp, timeframe })
          : null

      if (oldestTimestamp === null || !request) {
        setHistoryFeedback({
          error: dictionary.marketCharts.responseInvalid,
          loadId,
          state: "error",
        })
        callback([], { backward: false, forward: true })
        return
      }

      setHistoryFeedback({ error: null, loadId, state: "loading" })
      const result = await onLoadOlderCandlesRef.current(request)

      if (chartLoadIdRef.current !== loadId) return

      if (!result.success) {
        setHistoryFeedback({ error: result.error, loadId, state: "error" })
        callback([], { backward: false, forward: true })
        return
      }

      if (result.data.candles.length === 0) {
        historyExhaustedRef.current = true
        setHistoryFeedback({ error: null, loadId, state: "idle" })
        callback([], { backward: false, forward: false })
        return
      }

      const olderCandles = getNewOlderCandles(
        loadedCandlesRef.current,
        result.data.candles,
        oldestTimestamp
      )
      const olderData = createKLineData(olderCandles)

      if (!olderData.length) {
        setHistoryFeedback({
          error: dictionary.marketCharts.responseInvalid,
          loadId,
          state: "error",
        })
        callback([], { backward: false, forward: true })
        return
      }

      loadedCandlesRef.current = mergeCandleItems(
        loadedCandlesRef.current,
        olderCandles
      )

      if (annotationLayerEnabledRef.current) {
        loadedAnnotationsRef.current = mergeMarketChartAnnotations(
          loadedAnnotationsRef.current,
          result.data.annotations
        )
      }

      if (calendarLayerEnabledRef.current) {
        loadedCalendarEventsRef.current =
          mergeMarketChartEconomicCalendarEvents(
            loadedCalendarEventsRef.current,
            result.data.economicCalendarEvents
          )
      }

      onLoadedDataChangeRef.current?.({
        annotations: loadedAnnotationsRef.current,
        candles: loadedCandlesRef.current,
        economicCalendarEvents: loadedCalendarEventsRef.current,
        from: loadedCandlesRef.current[0]?.time ?? result.data.from,
      })
      setHistoryFeedback({ error: null, loadId, state: "idle" })
      callback(olderData, { backward: false, forward: true })
      scheduleMarkerPositionUpdateRef.current()
    }

    chart.setDataLoader({
      getBars(params) {
        void loadBars(params)
      },
      subscribeBar(params) {
        liveCandleSubscriberRef.current = params.callback
        liveCandleSubscriberLoadIdRef.current = loadId
        const [liveData] = createKLineData(
          liveCandleRef.current ? [liveCandleRef.current] : []
        )
        if (liveData) params.callback(liveData)
      },
      unsubscribeBar() {
        liveCandleSubscriberRef.current = null
        liveCandleSubscriberLoadIdRef.current = null
      },
    })
  }, [assetId, dataVersion, dictionary.marketCharts.responseInvalid, timeframe])

  useEffect(() => {
    const chart = chartRef.current

    if (!chart) {
      return
    }

    syncChartIndicators(chart, activeIndicators)
  }, [activeIndicators])

  useEffect(() => {
    if (!drawingToolActive) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancelActiveDrawingDraft()
        onDrawingToolCompleteRef.current?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [drawingToolActive])

  function getCalendarEventTitle(
    event: MarketChartEconomicCalendarEventResponse
  ) {
    return (
      event.title?.trim() ||
      event.type?.trim() ||
      dictionary.marketCharts.calendar.eventFallback
    )
  }

  const showCalendarLane =
    calendarLayerEnabled && calendarEventGroups.length > 0

  return (
    <div className={cn("relative h-full min-h-0 w-full", className)}>
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-x-0 top-0",
          showCalendarLane ? "bottom-7" : "bottom-0"
        )}
      />
      {activeCalendarGuideX !== null ? (
        <div
          className={cn(
            "pointer-events-none absolute top-0 z-[2] w-px bg-destructive/80",
            showCalendarLane ? "bottom-7" : "bottom-0"
          )}
          style={{ left: activeCalendarGuideX }}
        />
      ) : null}
      {outcomeHoverBand ? (
        <div
          className="pointer-events-none absolute z-[2] bg-primary/15 ring-1 ring-primary/30"
          style={{
            height: outcomeHoverBand.height,
            left: outcomeHoverBand.left,
            top: outcomeHoverBand.top,
            width: outcomeHoverBand.width,
          }}
        />
      ) : null}
      {showCalendarLane ? (
        <div className="absolute inset-x-0 bottom-0 z-[4] h-7">
          {calendarMarkerPositions.map(({ group, x }) => {
            const count = group.events.length

            return (
              <Popover key={group.id}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      aria-label={
                        count > 1
                          ? formatMessage(
                              dictionary.marketCharts.calendar.openMany,
                              { count: formatNumber(count) }
                            )
                          : formatMessage(
                              dictionary.marketCharts.calendar.openOne,
                              {
                                title: group.events[0]
                                  ? getCalendarEventTitle(group.events[0])
                                  : "",
                              }
                            )
                      }
                      className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      style={{ left: x }}
                      onBlur={() => setActiveCalendarGuideX(null)}
                      onFocus={() => setActiveCalendarGuideX(x)}
                      onMouseEnter={() => setActiveCalendarGuideX(x)}
                      onMouseLeave={() => setActiveCalendarGuideX(null)}
                    />
                  }
                >
                  <span
                    className={cn(
                      count > 1
                        ? "relative flex size-6 items-center justify-center rounded-full border-2 border-background bg-sky-500 text-[11px] font-semibold text-white shadow-sm ring-2 ring-sky-500/30"
                        : "relative block rounded-full border-2 border-background bg-sky-500 shadow-sm ring-2 ring-sky-500/30",
                      count > 1 ? null : "size-4"
                    )}
                  >
                    {count > 1 ? formatNumber(count) : null}
                  </span>
                </PopoverTrigger>
                <PopoverContentInOverlay
                  align="start"
                  side="top"
                  className="w-[min(24rem,calc(100vw_-_1.5rem))]"
                >
                  <MarketChartCalendarEventList events={group.events} />
                </PopoverContentInOverlay>
              </Popover>
            )
          })}
        </div>
      ) : null}
      {warmBandPositions.map(({ group, height, left, top, width }) => {
        const selected = selectedAnnotationGroupId === group.id
        const annotation = group.annotations[0]
        const colorClassNames = getMarketChartAnnotationColorClassNames(
          group.direction
        )

        return (
          <Popover
            key={group.id}
            open={selected}
            onOpenChange={(open) => {
              if (open) {
                onAnnotationSelect?.(group.id)
              } else {
                onAnnotationClose?.()
              }
            }}
          >
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute z-[1] rounded-sm ring-1 transition-colors",
                getWarmBandClassName(group.direction),
                selected ? "ring-2" : null
              )}
              style={{ height, left, top, width }}
            />
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label={formatMessage(
                    dictionary.marketCharts.annotations.openOne,
                    { title: annotation?.warmEpisode?.summary || "" }
                  )}
                  aria-pressed={selected}
                  disabled={drawingToolActive}
                  className={cn(
                    "absolute z-[2] flex size-11 items-center justify-center rounded-full border-2 border-background shadow-sm transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-6",
                    drawingToolActive ? "pointer-events-none" : null,
                    colorClassNames.dot,
                    colorClassNames.ring,
                    selected ? "ring-4" : "ring-1"
                  )}
                  style={{ left: left + 4, top: top + 4 }}
                />
              }
            />
            <PopoverContentInOverlay
              align="start"
              side="top"
              className="w-[min(22rem,calc(100vw_-_1.5rem))] sm:block"
            >
              {renderAnnotationPopup?.(group)}
            </PopoverContentInOverlay>
          </Popover>
        )
      })}
      {historyState !== "idle" ? (
        <div
          className={cn(
            "pointer-events-none absolute left-3 z-20 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur",
            showCalendarLane ? "bottom-10" : "bottom-3",
            historyState === "error"
              ? "border-destructive/30 text-destructive"
              : "text-muted-foreground"
          )}
        >
          {historyState === "loading" ? (
            <>
              <Spinner className="size-3" />
              <span>{dictionary.marketCharts.history.loading}</span>
            </>
          ) : (
            <span>
              {historyError || dictionary.marketCharts.history.errorFallback}
            </span>
          )}
        </div>
      ) : null}
      {markerPositions.map(({ group, x, y }) => {
        const selected = selectedAnnotationGroupId === group.id
        const emphasized = selected || group.priority === "high"
        const count = group.annotations.length
        const colorClassNames = getMarketChartAnnotationColorClassNames(
          group.direction
        )

        return (
          <Popover
            key={group.id}
            open={selectedAnnotationGroupId === group.id}
            onOpenChange={(open) => {
              if (open) {
                onAnnotationSelect?.(group.id)
              } else {
                onAnnotationClose?.()
              }
            }}
          >
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label={
                    count > 1
                      ? formatMessage(
                          dictionary.marketCharts.annotations.openMany,
                          {
                            count: formatNumber(count),
                            time: formatDateTime(
                              group.annotations[0]?.time,
                              MARKER_DATE_TIME_OPTIONS,
                              dictionary.marketCharts.format.notAvailable
                            ),
                          }
                        )
                      : formatMessage(
                          dictionary.marketCharts.annotations.openOne,
                          {
                            title:
                              group.annotations[0]?.hotEvent?.title ||
                              group.annotations[0]?.hotEvent?.summary ||
                              "",
                          }
                        )
                  }
                  aria-pressed={selected}
                  className={cn(
                    "group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    drawingToolActive ? "pointer-events-none" : null
                  )}
                  style={{ left: x, top: y }}
                >
                  <span
                    className={cn(
                      "market-chart-annotation-pulse absolute rounded-full",
                      emphasized ? "size-9" : "size-7",
                      colorClassNames.pulse
                    )}
                  />
                  <span
                    className={cn(
                      count > 1
                        ? "relative flex size-6 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold shadow-lg ring-2"
                        : "relative block size-4 rounded-full border-2 border-background shadow-lg ring-2 group-data-[state=open]:ring-4",
                      colorClassNames.dot,
                      colorClassNames.ring,
                      count > 1 ? colorClassNames.foreground : null
                    )}
                  >
                    {count > 1 ? formatNumber(count) : null}
                  </span>
                </button>
              }
            />
            <PopoverContentInOverlay
              align="start"
              side="right"
              className="w-[min(22rem,calc(100vw_-_1.5rem))] sm:block"
            >
              {renderAnnotationPopup?.(group)}
            </PopoverContentInOverlay>
          </Popover>
        )
      })}
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .market-chart-annotation-pulse {
              animation: market-chart-annotation-pulse 2s ease-out infinite;
            }
          }

          @keyframes market-chart-annotation-pulse {
            0% {
              opacity: 0.75;
              transform: scale(0.55);
            }
            70% {
              opacity: 0;
              transform: scale(1.35);
            }
            100% {
              opacity: 0;
              transform: scale(1.35);
            }
          }
        `}
      </style>
    </div>
  )
})
