"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CalendarCog,
  Camera,
  ChartCandlestick,
  DatabaseZap,
  Maximize,
  Minimize,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import {
  getMarketChartAnnotations,
  getMarketChartCandles,
  getMarketChartEconomicCalendarEvents,
} from "@/app/api/market-charts/action"
import type { ActionResult } from "@/app/lib/definitions"
import {
  ECONOMIC_CALENDAR_IMPACT_LEVELS,
  isEconomicCalendarImpactSelected,
  type EconomicCalendarImpactLevel,
} from "@/app/lib/economic-calendar/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  DEFAULT_MARKET_CHART_TIMEFRAME,
  MARKET_CHART_TIMEFRAMES,
  type MarketChartAnnotationRequest,
  type MarketChartAnnotationDirection,
  type MarketChartAnnotationReactionResponse,
  type MarketChartAnnotationResponse,
  MarketChartCandleRequest,
  MarketChartCandleResponse,
  MarketChartCandleItemResponse,
  MarketChartEconomicCalendarEventRequest,
  MarketChartEconomicCalendarEventResponse,
  type MarketChartLiveQuoteResponse,
  type MarketChartLiveStatusResponse,
  type MarketChartLiveStreamState,
  MarketChartTimeframe,
  getMarketChartTimeframeLabels,
  isMarketChartWarmBandTimeframe,
  isMarketChartTimeframe,
} from "@/app/lib/market-charts/definitions"
import { WorkspaceWatchlistAssetListItemResponse } from "@/app/lib/watchlists/definitions"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { LocalizedLink } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Item } from "@/components/ui/item"
import { SelectContentInOverlay } from "@/components/ui/select-content-in-overlay"
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipContentInOverlay } from "@/components/ui/tooltip-content-in-overlay"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PopoverContentInOverlay } from "@/components/ui/popover-content-in-overlay"
import { cn } from "@/lib/utils"

const MARKET_CHART_CALENDAR_VISIBILITY_STORAGE_KEY =
  "signapse:market-charts:calendar-layer:v1"
const MARKET_CHART_COMPACT_WIDTH_PX = 768
const MARKET_CHART_COMPACT_HEIGHT_PX = 720

function readStoredMarketChartCalendarVisibility(): boolean | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const value = window.localStorage.getItem(
      MARKET_CHART_CALENDAR_VISIBILITY_STORAGE_KEY
    )

    return value === "true" ? true : value === "false" ? false : null
  } catch {
    return null
  }
}

function getAdaptiveMarketChartCalendarVisibility() {
  if (typeof window === "undefined") {
    return true
  }

  return (
    window.innerWidth >= MARKET_CHART_COMPACT_WIDTH_PX &&
    window.innerHeight >= MARKET_CHART_COMPACT_HEIGHT_PX
  )
}

function getInitialMarketChartCalendarVisibility() {
  return (
    readStoredMarketChartCalendarVisibility() ??
    getAdaptiveMarketChartCalendarVisibility()
  )
}

function writeStoredMarketChartCalendarVisibility(checked: boolean) {
  try {
    window.localStorage.setItem(
      MARKET_CHART_CALENDAR_VISIBILITY_STORAGE_KEY,
      String(checked)
    )
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

import {
  createMarketChartAnnotationGroups,
  createMarketChartEconomicCalendarEventGroups,
  createMarketChartWarmAnnotationGroups,
  getMarketChartAnnotationColorClassNames,
  mergeMarketChartEconomicCalendarEvents,
  type MarketChartAnnotationGroup,
  type MarketChartEconomicCalendarEventGroup,
} from "./market-chart-annotations"
import {
  MARKET_CHART_CALENDAR_REFRESH_INTERVAL_MS,
  createMarketChartFutureCalendarRequest,
  getAwaitingMarketChartCalendarEvents,
  getMarketChartCalendarEventTimestamp,
  getNextMarketChartCalendarEvent,
  getUpcomingMarketChartCalendarEvents,
} from "./market-chart-calendar-helpers"
import {
  LocalEntityQuickDetailDrawer,
  type LocalQuickDetailEntity,
} from "../local-entity-quick-detail-drawer"
import { OverlayPortalContainerProvider } from "@/components/ui/overlay-portal-container"
import {
  MARKET_CHART_INDICATORS,
  MarketChartCalendarEventList,
  MarketChartCanvas,
  type MarketChartCanvasHandle,
  type MarketChartDrawingSelection,
  type MarketChartIndicatorName,
  type MarketChartLoadedData,
  type MarketChartOutcomeHoverRange,
} from "./market-chart-canvas"
import { MarketChartDrawingToolbar } from "./market-chart-drawing-toolbar"
import {
  DEFAULT_MARKET_CHART_DRAWING_PALETTE_TOOLS,
  getMarketChartDrawingToolPalette,
  type MarketChartDrawingPaletteSelection,
  type MarketChartDrawingState,
  type MarketChartDrawingTool,
} from "./market-chart-drawing"
import {
  MARKET_CHART_DRAWING_COLOR_PRESETS,
  MARKET_CHART_DRAWING_SIZES,
  type MarketChartDrawingColor,
  type MarketChartDrawingSize,
  resolveMarketChartDrawingColor,
  type MarketChartDrawingStyle,
} from "./market-chart-drawing-style"
import {
  deriveLiveCandleItemFromQuote,
  hasUsableVolumeData,
  normalizeCandleItems,
} from "./market-chart-candle-helpers"
import {
  createLatestHistoryRequest,
  deriveMarketChartDisplayedCandleInterval,
} from "./market-chart-history-helpers"
import { openMarketChartLiveStream } from "./market-chart-live-stream"
import { createMarketChartInitialLoadObserver } from "./market-chart-initial-load-observability"
import { MarketChartSurfaceSkeleton } from "./market-chart-skeleton"

type WorkbenchPhase = "idle" | "loading" | "success" | "error"

type MarketChartSelectionState = {
  assetId: string
  timeframe: MarketChartTimeframe
}

type MarketChartCalendarLookaheadDays = 1 | 7

type FormErrors = Partial<Record<keyof MarketChartSelectionState, string>> & {
  form?: string
}

type MarketChartLiveRuntimeState = {
  candle: MarketChartCandleItemResponse | null
  error: string | null
  quote: MarketChartLiveQuoteResponse | null
  status: MarketChartLiveStatusResponse | null
  transportState: MarketChartLiveStreamState | null
}

type MarketChartDisplayData = MarketChartCandleResponse & {
  annotations: MarketChartAnnotationResponse[]
  economicCalendarEvents: MarketChartEconomicCalendarEventResponse[]
}

const MARKET_CHART_ANNOTATION_LEGEND_DIRECTIONS = [
  "BULLISH",
  "BEARISH",
  "NEUTRAL",
  "MIXED",
] as const satisfies readonly MarketChartAnnotationDirection[]

export interface MarketChartWorkbenchProps {
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  watchlistError: string | null
}

const MARKET_CHART_CALENDAR_MAX_RANGE_DAYS = 366
const MARKET_CHART_DAY_MS = 24 * 60 * 60 * 1000
const MARKET_CHART_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}
const MARKET_CHART_TIMEFRAME_SHORT_LABELS: Record<
  MarketChartTimeframe,
  string
> = {
  "1m": "1M",
  "5m": "5M",
  "15m": "15M",
  "30m": "30M",
  "1h": "1H",
  "4h": "4H",
  "1d": "1D",
  "1w": "1W",
  "1mo": "1MO",
}
const DEFAULT_MARKET_CHART_DRAWING_STATE: MarketChartDrawingState = {
  activeTool: null,
  hasSelectedDrawing: false,
  isLocked: false,
  isMagnetEnabled: false,
  isVisible: true,
  selectedTools: DEFAULT_MARKET_CHART_DRAWING_PALETTE_TOOLS,
}
const DEFAULT_MARKET_CHART_LIVE_STATE: MarketChartLiveRuntimeState = {
  candle: null,
  error: null,
  quote: null,
  status: null,
  transportState: null,
}
const MARKET_CHART_ANNOTATION_BADGE_TONE_CLASS_NAMES = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  green: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  purple:
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
}

const MARKET_CHART_MOVEMENT_CLASS_NAMES = {
  down: "text-red-600 dark:text-red-400",
  up: "text-green-600 dark:text-green-400",
}

type MarketChartMovementDirection =
  keyof typeof MARKET_CHART_MOVEMENT_CLASS_NAMES

type LocalizationContext = ReturnType<typeof useLocalization>

function getSingleParam(
  searchParams: URLSearchParams,
  key: string
): string | null {
  const value = searchParams.get(key)
  return value?.trim() || null
}

function getTimeframeFromSearchParams(searchParams: URLSearchParams) {
  const value = getSingleParam(searchParams, "timeframe")
  return value && isMarketChartTimeframe(value)
    ? value
    : DEFAULT_MARKET_CHART_TIMEFRAME
}

function createDefaultSelection(
  assets: WorkspaceWatchlistAssetListItemResponse[]
): MarketChartSelectionState {
  return {
    assetId: assets[0]?.assetId ? String(assets[0].assetId) : "",
    timeframe: DEFAULT_MARKET_CHART_TIMEFRAME,
  }
}

function createQueryString(selection: MarketChartSelectionState) {
  const query = new URLSearchParams()

  query.set("assetId", selection.assetId)
  query.set("timeframe", selection.timeframe)

  return query.toString()
}

function findWatchlistAsset(
  assets: WorkspaceWatchlistAssetListItemResponse[],
  assetId: string
) {
  return assets.find((asset) => String(asset.assetId) === assetId) ?? null
}

function getDisplayAssetSymbol(
  data: MarketChartCandleResponse | null,
  selectedAsset: WorkspaceWatchlistAssetListItemResponse | null,
  dictionary: LocalizationContext["dictionary"]
) {
  return (
    data?.asset.symbol ||
    selectedAsset?.assetSymbol ||
    data?.symbol ||
    dictionary.marketCharts.format.selectedFallback
  )
}

function createMarketChartDisplayData(
  data: MarketChartCandleResponse,
  annotations: MarketChartAnnotationResponse[] = [],
  economicCalendarEvents: MarketChartEconomicCalendarEventResponse[] = []
): MarketChartDisplayData {
  return {
    ...data,
    annotations,
    economicCalendarEvents,
  }
}

function createMarketChartEconomicCalendarEventRequests(
  request: Pick<MarketChartAnnotationRequest, "assetId" | "from" | "to">,
  impacts: readonly EconomicCalendarImpactLevel[]
): MarketChartEconomicCalendarEventRequest[] {
  const requestFrom = Date.parse(request.from)
  const requestTo = Date.parse(request.to)

  if (
    !impacts.length ||
    !Number.isFinite(requestFrom) ||
    !Number.isFinite(requestTo)
  ) {
    return []
  }

  const maxRangeMs = MARKET_CHART_CALENDAR_MAX_RANGE_DAYS * MARKET_CHART_DAY_MS
  const requests: MarketChartEconomicCalendarEventRequest[] = []

  for (let start = requestFrom; start < requestTo; start += maxRangeMs) {
    const end = Math.min(requestTo, start + maxRangeMs)

    if (start < end) {
      requests.push({
        assetId: request.assetId,
        from: new Date(start).toISOString(),
        to: new Date(end).toISOString(),
        impact: [...impacts],
      })
    }
  }

  return requests
}

function formatMarketChartDateTime(
  value: string | null | undefined,
  localization: LocalizationContext
) {
  return localization.formatDateTime(
    value,
    MARKET_CHART_DATE_TIME_OPTIONS,
    localization.dictionary.marketCharts.format.notAvailable
  )
}

function getDirectionLabel(
  direction: string | null | undefined,
  dictionary: LocalizationContext["dictionary"]
) {
  if (direction === "BULLISH") {
    return dictionary.marketCharts.directions.BULLISH
  }

  if (direction === "BEARISH") {
    return dictionary.marketCharts.directions.BEARISH
  }

  if (direction === "MIXED") {
    return dictionary.marketCharts.directions.MIXED
  }

  return dictionary.marketCharts.directions.NEUTRAL
}

function getPredictionBadgeClassName(direction: string | null | undefined) {
  switch (direction) {
    case "BULLISH":
      return MARKET_CHART_ANNOTATION_BADGE_TONE_CLASS_NAMES.green
    case "BEARISH":
      return MARKET_CHART_ANNOTATION_BADGE_TONE_CLASS_NAMES.red
    case "MIXED":
      return MARKET_CHART_ANNOTATION_BADGE_TONE_CLASS_NAMES.purple
    case "NEUTRAL":
      return MARKET_CHART_ANNOTATION_BADGE_TONE_CLASS_NAMES.sky
    default:
      return MARKET_CHART_ANNOTATION_BADGE_TONE_CLASS_NAMES.blue
  }
}

function formatOutcomeReturn(
  value: number | null | undefined,
  localization: LocalizationContext
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  const normalizedValue = Math.abs(value) <= 1 ? value : value / 100

  return localization.formatPercent(normalizedValue, {
    maximumFractionDigits: 2,
  })
}

function formatOutcomePrice(
  value: number | null | undefined,
  localization: LocalizationContext
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return localization.formatNumber(value, {
    maximumFractionDigits: 4,
  })
}

function formatOptionalMarketChartDateTime(
  value: string | null | undefined,
  localization: LocalizationContext
) {
  if (!value) {
    return null
  }

  const fallback = localization.dictionary.marketCharts.format.notAvailable
  const formatted = localization.formatDateTime(
    value,
    MARKET_CHART_DATE_TIME_OPTIONS,
    fallback
  )

  return formatted === fallback ? null : formatted
}

function formatMarketChartValueRange(start: string | null, end: string | null) {
  return start && end ? `${start} -> ${end}` : (start ?? end)
}

function getMarketChartPriceMovementDirection(
  anchorPrice: number | null | undefined,
  evaluationPrice: number | null | undefined
) {
  if (
    typeof anchorPrice !== "number" ||
    typeof evaluationPrice !== "number" ||
    !Number.isFinite(anchorPrice) ||
    !Number.isFinite(evaluationPrice) ||
    anchorPrice === evaluationPrice
  ) {
    return null
  }

  return evaluationPrice > anchorPrice ? "up" : "down"
}

function getAnnotationEventId(annotation: MarketChartAnnotationResponse) {
  const hotEvent = annotation.hotEvent
  const eventId = hotEvent?.eventId

  if (typeof eventId === "number" && Number.isInteger(eventId) && eventId > 0) {
    return eventId
  }

  const eventDetail = hotEvent?.links?.eventDetail?.trim()
  const match = eventDetail?.match(/^\/events\/([1-9]\d*)\/?(?:[?#].*)?$/)

  return match ? Number(match[1]) : null
}

function isWarmAnnotationGroup(group: MarketChartAnnotationGroup) {
  const annotation = group.annotations[0]

  return (
    annotation?.annotationType === "WARM_EPISODE" && !!annotation.warmEpisode
  )
}

function getFreshnessLabel(
  data: MarketChartCandleResponse | null,
  phase: WorkbenchPhase,
  liveState: MarketChartLiveRuntimeState,
  localization: LocalizationContext
) {
  const timestamp =
    liveState.quote?.receivedAt || liveState.quote?.providerTime || data?.to

  if (phase !== "success" || !timestamp) {
    return null
  }

  const updatedAt = formatMarketChartDateTime(timestamp, localization)

  if (!updatedAt) {
    return null
  }

  return localization.formatMessage(
    localization.dictionary.marketCharts.format.updatedAt,
    {
      time: updatedAt,
    }
  )
}

function getLiveStatusLabel(
  liveState: MarketChartLiveRuntimeState,
  localization: LocalizationContext
) {
  const live = localization.dictionary.marketCharts.live

  if (liveState.error) {
    return live.error
  }

  const state = liveState.status?.state ?? liveState.transportState

  switch (state) {
    case "CONNECTING":
      return live.connecting
    case "CONNECTED":
    case "SUBSCRIBED":
      return live.live
    case "RECONNECTING":
      return live.reconnecting
    case "STALE":
    case "MARKET_CLOSED":
      return live.stale
    case "DISCONNECTED":
    case "UNSUBSCRIBED":
      return live.disconnected
    case "ERROR":
      return live.error
    default:
      return null
  }
}

function getLiveStatusTone(liveState: MarketChartLiveRuntimeState) {
  if (liveState.error) {
    return "error" as const
  }

  const state = liveState.status?.state ?? liveState.transportState

  if (state === "CONNECTED" || state === "SUBSCRIBED") {
    return "live" as const
  }

  if (
    state === "STALE" ||
    state === "RECONNECTING" ||
    state === "MARKET_CLOSED"
  ) {
    return "stale" as const
  }

  if (
    state === "ERROR" ||
    state === "DISCONNECTED" ||
    state === "UNSUBSCRIBED"
  ) {
    return "error" as const
  }

  return "pending" as const
}

function createScreenshotFileName(
  symbol: string,
  timeframe: MarketChartTimeframe
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const safeSymbol = symbol.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "")

  return `${safeSymbol || "market-chart"}-${timeframe}-${timestamp}.png`
}

function downloadDataUrl(url: string, fileName: string) {
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function createMarketChartDrawingState(
  selectedTools: MarketChartDrawingPaletteSelection = DEFAULT_MARKET_CHART_DRAWING_PALETTE_TOOLS
): MarketChartDrawingState {
  return {
    ...DEFAULT_MARKET_CHART_DRAWING_STATE,
    selectedTools: { ...selectedTools },
  }
}

function getAnnotationGroupsSummaryDirection(
  groups: MarketChartAnnotationGroup[]
): MarketChartAnnotationDirection | null {
  const directions = groups
    .map((group) => group.direction)
    .filter(
      (direction): direction is MarketChartAnnotationDirection => !!direction
    )
  const [firstDirection] = directions

  if (!firstDirection) {
    return null
  }

  return directions.every((direction) => direction === firstDirection)
    ? firstDirection
    : "MIXED"
}

function MarketChartTopToolbar({
  activeIndicators,
  annotationLayerEnabled,
  calendarLayerEnabled,
  selectedCalendarImpacts,
  errors,
  hasCandles,
  hasWatchlistAssets,
  isBusy,
  isFullscreen,
  phase,
  volumeAvailable,
  selection,
  selectedAsset,
  timeframeLabels,
  watchlistAssets,
  watchlistError,
  calendarEvents,
  calendarLoadError,
  calendarLoadedAt,
  calendarLoading,
  calendarLookaheadDays,
  currentCalendarTimestamp,
  onCalendarLookaheadDaysChange,
  onCalendarRetry,
  onAnnotationLayerChange,
  onCalendarLayerChange,
  onCalendarImpactChange,
  onAssetChange,
  onFullscreenToggle,
  onIndicatorChange,
  onScreenshot,
  onTimeframeChange,
}: {
  activeIndicators: MarketChartIndicatorName[]
  annotationLayerEnabled: boolean
  calendarLayerEnabled: boolean
  selectedCalendarImpacts: EconomicCalendarImpactLevel[]
  errors: FormErrors
  hasCandles: boolean
  hasWatchlistAssets: boolean
  isBusy: boolean
  isFullscreen: boolean
  phase: WorkbenchPhase
  volumeAvailable: boolean
  selection: MarketChartSelectionState
  selectedAsset: WorkspaceWatchlistAssetListItemResponse | null
  timeframeLabels: Record<MarketChartTimeframe, string>
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  watchlistError: string | null
  calendarEvents: MarketChartEconomicCalendarEventResponse[]
  calendarLoadError: string | null
  calendarLoadedAt: string | null
  calendarLoading: boolean
  calendarLookaheadDays: MarketChartCalendarLookaheadDays
  currentCalendarTimestamp: number
  onCalendarLookaheadDaysChange: (
    days: MarketChartCalendarLookaheadDays
  ) => void
  onCalendarRetry: () => void
  onAnnotationLayerChange: (checked: boolean) => void
  onCalendarLayerChange: (checked: boolean) => void
  onCalendarImpactChange: (
    impact: EconomicCalendarImpactLevel,
    checked: boolean
  ) => void
  onAssetChange: (value: string) => void
  onFullscreenToggle: () => void
  onIndicatorChange: (indicators: MarketChartIndicatorName[]) => void
  onScreenshot: () => void
  onTimeframeChange: (value: MarketChartTimeframe) => void
}) {
  const { dictionary } = useLocalization()
  const hasChartData = phase === "success" && hasCandles
  const controlsDisabled = isBusy || !!watchlistError || !hasWatchlistAssets
  const chartCommandsDisabled = isBusy || !!watchlistError || !hasChartData

  function handleIndicatorToggle(
    indicator: MarketChartIndicatorName,
    checked: boolean
  ) {
    onIndicatorChange(
      MARKET_CHART_INDICATORS.filter((candidate) =>
        candidate === indicator ? checked : activeIndicators.includes(candidate)
      )
    )
  }

  return (
    <div className="border-b bg-card p-2">
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center">
        <Field
          className="w-full shrink-0 gap-1 sm:w-72 lg:w-80"
          data-invalid={!!errors.assetId}
        >
          <FieldLabel htmlFor="market-chart-asset" className="sr-only">
            {dictionary.marketCharts.controls.assetLabel}
          </FieldLabel>
          <Select
            items={watchlistAssets.map((asset) => ({
              value: String(asset.assetId),
              label: `${asset.assetSymbol} - ${asset.assetName}`,
            }))}
            value={selection.assetId}
            onValueChange={(value) => {
              if (value !== null) {
                onAssetChange(value)
              }
            }}
            disabled={controlsDisabled}
          >
            <SelectTrigger
              id="market-chart-asset"
              aria-invalid={errors.assetId ? true : undefined}
              className="w-full"
              size="sm"
            >
              <SelectValue
                placeholder={dictionary.marketCharts.controls.assetPlaceholder}
              />
            </SelectTrigger>
            <SelectContentInOverlay>
              <SelectGroup>
                {watchlistAssets.map((asset) => (
                  <SelectItem key={asset.assetId} value={String(asset.assetId)}>
                    {asset.assetSymbol} - {asset.assetName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContentInOverlay>
          </Select>
          <FieldError>{errors.assetId}</FieldError>
        </Field>

        <Separator orientation="vertical" className="hidden lg:block" />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <Field
            className="w-fit min-w-0 gap-1"
            data-invalid={!!errors.timeframe}
          >
            <FieldLabel id="market-chart-timeframe-label" className="sr-only">
              {dictionary.marketCharts.controls.timeframeLabel}
            </FieldLabel>
            <ToggleGroup
              multiple={false}
              variant="outline"
              size="sm"
              spacing={1}
              value={[selection.timeframe]}
              aria-labelledby="market-chart-timeframe-label"
              onValueChange={(values) => {
                const value = values[0]

                if (isMarketChartTimeframe(value)) {
                  onTimeframeChange(value)
                }
              }}
            >
              {MARKET_CHART_TIMEFRAMES.map((timeframe) => (
                <ToggleGroupItem
                  key={timeframe}
                  value={timeframe}
                  disabled={controlsDisabled}
                  aria-label={timeframeLabels[timeframe]}
                >
                  {MARKET_CHART_TIMEFRAME_SHORT_LABELS[timeframe]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldError>{errors.timeframe}</FieldError>
          </Field>

          <Separator orientation="vertical" className="hidden lg:block" />

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy || !!watchlistError || !selectedAsset}
                    aria-label={
                      dictionary.marketCharts.controls.eventSettingsAria
                    }
                  />
                }
              >
                <CalendarCog data-icon="inline-start" />
                {dictionary.marketCharts.controls.annotationsLabel}
              </PopoverTrigger>
              <PopoverContentInOverlay
                align="start"
                className="w-[min(18rem,calc(100vw_-_1.5rem))]"
              >
                <PopoverHeader>
                  <PopoverTitle>
                    {dictionary.marketCharts.controls.eventSettingsTitle}
                  </PopoverTitle>
                  <PopoverDescription>
                    {dictionary.marketCharts.controls.eventSettingsDescription}
                  </PopoverDescription>
                </PopoverHeader>

                <Item variant="muted" size="sm">
                  <FieldSet className="w-full">
                    <FieldLegend variant="label" className="sr-only">
                      {dictionary.marketCharts.controls.annotationsLabel}
                    </FieldLegend>
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="market-chart-event-settings-annotations">
                        {dictionary.marketCharts.controls.annotationsLabel}
                      </FieldLabel>
                      <Switch
                        id="market-chart-event-settings-annotations"
                        checked={annotationLayerEnabled}
                        onCheckedChange={onAnnotationLayerChange}
                      />
                    </Field>
                  </FieldSet>
                </Item>

                <Item variant="muted" size="sm">
                  <FieldSet className="w-full gap-4">
                    <FieldLegend variant="label" className="sr-only">
                      {dictionary.marketCharts.calendar.showOnChart}
                    </FieldLegend>
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="market-chart-event-settings-calendar">
                        {dictionary.marketCharts.calendar.showOnChart}
                      </FieldLabel>
                      <Switch
                        id="market-chart-event-settings-calendar"
                        checked={calendarLayerEnabled}
                        onCheckedChange={onCalendarLayerChange}
                      />
                    </Field>

                    <div>
                      <div className="border-l pl-3">
                        <FieldSet className="gap-3">
                          <FieldLegend className="sr-only">
                            {dictionary.marketCharts.controls.impactFilterLabel}
                          </FieldLegend>
                          <FieldDescription>
                            {dictionary.marketCharts.controls.impactFilterLabel}
                          </FieldDescription>
                          <FieldGroup data-slot="checkbox-group">
                            {ECONOMIC_CALENDAR_IMPACT_LEVELS.map((impact) => {
                              const id = `market-chart-event-settings-impact-${impact.toLowerCase()}`

                              return (
                                <Field
                                  key={impact}
                                  orientation="horizontal"
                                  className="w-fit"
                                >
                                  <Checkbox
                                    id={id}
                                    checked={selectedCalendarImpacts.includes(
                                      impact
                                    )}
                                    onCheckedChange={(checked) =>
                                      onCalendarImpactChange(
                                        impact,
                                        checked === true
                                      )
                                    }
                                  />
                                  <FieldLabel htmlFor={id}>
                                    {
                                      dictionary.marketCharts.controls
                                        .impactOptionLabels[impact]
                                    }
                                  </FieldLabel>
                                </Field>
                              )
                            })}
                          </FieldGroup>
                        </FieldSet>
                      </div>
                    </div>
                  </FieldSet>
                </Item>
              </PopoverContentInOverlay>
            </Popover>

            <MarketChartUpcomingCalendar
              calendarEvents={calendarEvents}
              calendarLoadError={calendarLoadError}
              calendarLoadedAt={calendarLoadedAt}
              calendarLoading={calendarLoading}
              calendarLookaheadDays={calendarLookaheadDays}
              currentTimestamp={currentCalendarTimestamp}
              onLookaheadDaysChange={onCalendarLookaheadDaysChange}
              onRetry={onCalendarRetry}
              selectedImpactCount={selectedCalendarImpacts.length}
            />

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={chartCommandsDisabled}
                  />
                }
              >
                {activeIndicators.length > 0 ? (
                  <span
                    data-icon="inline-start"
                    className="inline-flex size-3.5 items-center justify-center tabular-nums"
                  >
                    {activeIndicators.length > 9
                      ? "9+"
                      : activeIndicators.length}
                  </span>
                ) : (
                  <SlidersHorizontal data-icon="inline-start" />
                )}
                {dictionary.marketCharts.controls.indicatorLabel}
              </PopoverTrigger>

              <PopoverContentInOverlay
                align="end"
                className="max-h-[var(--available-height)] w-[min(18rem,calc(100vw_-_1.5rem))] overflow-y-auto"
              >
                <PopoverHeader>
                  <PopoverTitle>
                    {dictionary.marketCharts.indicators.title}
                  </PopoverTitle>
                  <PopoverDescription>
                    {dictionary.marketCharts.indicators.description}
                  </PopoverDescription>
                </PopoverHeader>
                <FieldSet className="gap-2">
                  <FieldLegend variant="label" className="sr-only">
                    {dictionary.marketCharts.indicators.title}
                  </FieldLegend>
                  <FieldGroup className="gap-2">
                    {MARKET_CHART_INDICATORS.map((indicator) => {
                      const id = `market-chart-indicator-${indicator.toLowerCase()}`
                      const disabled = indicator === "VOL" && !volumeAvailable

                      return (
                        <Item key={indicator} variant="muted" size="sm">
                          <Field
                            orientation="horizontal"
                            data-disabled={disabled || undefined}
                          >
                            <FieldLabel htmlFor={id}>
                              {indicator === "VOL"
                                ? "Volume"
                                : dictionary.marketCharts.indicators.options[
                                    indicator
                                  ]}
                            </FieldLabel>
                            <Switch
                              id={id}
                              checked={activeIndicators.includes(indicator)}
                              disabled={disabled}
                              onCheckedChange={(checked) =>
                                handleIndicatorToggle(indicator, checked)
                              }
                            />
                          </Field>
                        </Item>
                      )
                    })}
                  </FieldGroup>
                </FieldSet>
              </PopoverContentInOverlay>
            </Popover>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={chartCommandsDisabled}
                    onClick={onScreenshot}
                    aria-label={dictionary.marketCharts.controls.screenshotAria}
                  />
                }
              >
                <Camera />
              </TooltipTrigger>
              <TooltipContentInOverlay>
                {dictionary.marketCharts.controls.screenshotLabel}
              </TooltipContentInOverlay>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={onFullscreenToggle}
                    disabled={!!watchlistError}
                    aria-label={
                      isFullscreen
                        ? dictionary.marketCharts.controls.exitFullscreenAria
                        : dictionary.marketCharts.controls.fullscreenAria
                    }
                  />
                }
              >
                {isFullscreen ? <Minimize /> : <Maximize />}
              </TooltipTrigger>
              <TooltipContentInOverlay>
                {isFullscreen
                  ? dictionary.marketCharts.controls.exitFullscreenLabel
                  : dictionary.marketCharts.controls.fullscreenLabel}
              </TooltipContentInOverlay>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChartSurface({
  annotationLayerEnabled,
  annotationGroups,
  calendarEventGroups,
  calendarEvents,
  calendarMarkerEvents,
  calendarLayerEnabled,
  selectedCalendarImpacts,
  calendarLoadError,
  calendarLoadedAt,
  calendarLoading,
  calendarLookaheadDays,
  currentCalendarTimestamp,
  warmAnnotationGroups,
  data,
  error,
  errors,
  freshnessLabel,
  isBusy,
  liveCandle,
  liveStatusLabel,
  liveStatusTone,
  phase,
  dataVersion,
  selection,
  selectedAsset,
  quickDetailEntity,
  onAnnotationEventOpen,
  selectedAnnotationGroup,
  timeframeLabels,
  watchlistAssets,
  watchlistError,
  hasWatchlistAssets,
  onAnnotationClose,
  onAnnotationLayerChange,
  onAnnotationSelect,
  onQuickDetailBeforeClose,
  onQuickDetailClose,
  onCalendarLayerChange,
  onCalendarImpactChange,
  onCalendarLookaheadDaysChange,
  onCalendarRetry,
  onAssetChange,
  onLoadedDataChange,
  onLoadOlderCandles,
  onRetry,
  onTimeframeChange,
}: {
  annotationLayerEnabled: boolean
  annotationGroups: MarketChartAnnotationGroup[]
  calendarEventGroups: MarketChartEconomicCalendarEventGroup[]
  calendarEvents: MarketChartEconomicCalendarEventResponse[]
  calendarMarkerEvents: MarketChartEconomicCalendarEventResponse[]
  calendarLayerEnabled: boolean
  selectedCalendarImpacts: EconomicCalendarImpactLevel[]
  calendarLoadError: string | null
  calendarLoadedAt: string | null
  calendarLoading: boolean
  calendarLookaheadDays: MarketChartCalendarLookaheadDays
  currentCalendarTimestamp: number
  warmAnnotationGroups: MarketChartAnnotationGroup[]
  dataVersion: number
  data: MarketChartDisplayData | null
  error: string | null
  errors: FormErrors
  freshnessLabel: string | null
  isBusy: boolean
  liveCandle: MarketChartCandleItemResponse | null
  liveStatusLabel: string | null
  liveStatusTone: "error" | "live" | "pending" | "stale"
  phase: WorkbenchPhase
  selection: MarketChartSelectionState
  selectedAsset: WorkspaceWatchlistAssetListItemResponse | null
  quickDetailEntity: LocalQuickDetailEntity | null
  onAnnotationEventOpen: (eventId: number, triggerKey: string) => void
  selectedAnnotationGroup: MarketChartAnnotationGroup | null
  timeframeLabels: Record<MarketChartTimeframe, string>
  watchlistAssets: WorkspaceWatchlistAssetListItemResponse[]
  watchlistError: string | null
  hasWatchlistAssets: boolean
  onAnnotationClose: () => void
  onAnnotationLayerChange: (checked: boolean) => void
  onAnnotationSelect: (groupId: string) => void
  onQuickDetailBeforeClose: () => void
  onQuickDetailClose: () => void
  onCalendarLayerChange: (checked: boolean) => void
  onCalendarImpactChange: (
    impact: EconomicCalendarImpactLevel,
    checked: boolean
  ) => void
  onCalendarLookaheadDaysChange: (
    days: MarketChartCalendarLookaheadDays
  ) => void
  onCalendarRetry: () => void
  onAssetChange: (value: string) => void
  onLoadedDataChange: (data: MarketChartLoadedData) => void
  onLoadOlderCandles: (
    request: MarketChartCandleRequest
  ) => Promise<ActionResult<MarketChartLoadedData>>
  onRetry: () => void
  onTimeframeChange: (value: MarketChartTimeframe) => void
}) {
  const localization = useLocalization()
  const { dictionary, formatMessage } = localization
  const chartCanvasRef = useRef<MarketChartCanvasHandle | null>(null)
  const [activeOutcomeHoverRange, setActiveOutcomeHoverRange] =
    useState<MarketChartOutcomeHoverRange | null>(null)

  function handleAnnotationClose() {
    setActiveOutcomeHoverRange(null)
    onAnnotationClose()
  }

  function handleOutcomeRangeHover(range: MarketChartOutcomeHoverRange) {
    setActiveOutcomeHoverRange(range)
  }

  function handleOutcomeRangeLeave() {
    setActiveOutcomeHoverRange(null)
  }

  function handleAnnotationSelect(groupId: string) {
    setActiveOutcomeHoverRange(null)
    onAnnotationSelect(groupId)
  }

  function renderAnnotationPopup(group: MarketChartAnnotationGroup) {
    const colorClassNames = getMarketChartAnnotationColorClassNames(
      group.direction
    )
    const warmEpisode = group.annotations[0]?.warmEpisode
    const eventCountLabel = warmEpisode
      ? formatMessage(dictionary.marketCharts.annotations.eventCount, {
          count: localization.formatNumber(warmEpisode.events.length),
        })
      : formatMessage(dictionary.marketCharts.annotations.eventCount, {
          count: localization.formatNumber(group.annotations.length),
        })

    return (
      <>
        <PopoverHeader className="flex-row items-center justify-between gap-3">
          <PopoverTitle className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                colorClassNames.dot,
                colorClassNames.foreground
              )}
            >
              {warmEpisode
                ? dictionary.marketCharts.annotations.warmEpisodeLabel
                : eventCountLabel}
            </span>
            {warmEpisode ? (
              <span className="text-xs font-medium text-muted-foreground">
                {eventCountLabel}
              </span>
            ) : null}
          </PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleAnnotationClose}
            aria-label={dictionary.marketCharts.annotations.closeEventDetails}
          >
            <X />
          </Button>
        </PopoverHeader>
        <Separator className="my-1" />
        <ScrollArea className="max-h-[min(24rem,calc(100vh-11rem))] [&>[data-slot=scroll-area-viewport]]:max-h-[min(24rem,calc(100vh-11rem))]">
          <MarketChartAnnotationDetail
            group={group}
            onEventOpen={onAnnotationEventOpen}
            onOutcomeRangeHover={handleOutcomeRangeHover}
            onOutcomeRangeLeave={handleOutcomeRangeLeave}
          />
        </ScrollArea>
      </>
    )
  }
  const surfaceRef = useRef<HTMLElement | null>(null)
  const [surfaceElement, setSurfaceElement] = useState<HTMLElement | null>(null)
  const setSurfaceRef = useCallback((element: HTMLElement | null) => {
    surfaceRef.current = element
    setSurfaceElement(element)
  }, [])
  const [activeIndicators, setActiveIndicators] = useState<
    MarketChartIndicatorName[]
  >([])
  const [drawingState, setDrawingState] = useState<MarketChartDrawingState>(
    () => createMarketChartDrawingState()
  )
  const [selectedDrawing, setSelectedDrawing] =
    useState<MarketChartDrawingSelection | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const hasCandles = (data?.candles.length ?? 0) > 0 || !!liveCandle
  const volumeAvailable = hasUsableVolumeData(data?.candles, liveCandle)
  const availableActiveIndicators = volumeAvailable
    ? activeIndicators
    : activeIndicators.filter((indicator) => indicator !== "VOL")
  const displaySymbol = getDisplayAssetSymbol(data, selectedAsset, dictionary)

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreen = document.fullscreenElement === surfaceRef.current

      setIsFullscreen(fullscreen)
      window.requestAnimationFrame(() => {
        chartCanvasRef.current?.resize()
      })
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  function handleIndicatorChange(indicators: MarketChartIndicatorName[]) {
    const availableIndicators = volumeAvailable
      ? indicators
      : indicators.filter((indicator) => indicator !== "VOL")

    setActiveIndicators(availableIndicators)

    if (
      !chartCanvasRef.current?.setIndicators(availableIndicators) &&
      hasCandles
    ) {
      toast.error(dictionary.marketCharts.controls.indicatorUnavailable)
    }
  }

  function resetVolumeIndicator() {
    setActiveIndicators((current) =>
      current.includes("VOL")
        ? current.filter((indicator) => indicator !== "VOL")
        : current
    )
  }

  function handleDrawingToolChange(tool: MarketChartDrawingTool | null) {
    setDrawingState((current) => ({
      ...current,
      activeTool: tool,
      selectedTools: tool
        ? {
            ...current.selectedTools,
            [getMarketChartDrawingToolPalette(tool)]: tool,
          }
        : current.selectedTools,
    }))

    if (!chartCanvasRef.current?.setDrawingTool(tool) && tool && hasCandles) {
      setDrawingState((current) => ({
        ...current,
        activeTool: null,
      }))
      toast.error(dictionary.marketCharts.drawings.unavailable)
    }
  }

  function handleDrawingStateChange(patch: Partial<MarketChartDrawingState>) {
    setDrawingState((current) => ({
      ...current,
      ...patch,
    }))

    if (
      typeof patch.isMagnetEnabled === "boolean" &&
      !chartCanvasRef.current?.setDrawingMagnet(patch.isMagnetEnabled) &&
      hasCandles
    ) {
      toast.error(dictionary.marketCharts.drawings.unavailable)
    }

    if (
      typeof patch.isLocked === "boolean" &&
      !chartCanvasRef.current?.setDrawingsLocked(patch.isLocked) &&
      hasCandles
    ) {
      toast.error(dictionary.marketCharts.drawings.unavailable)
    }

    if (
      typeof patch.isVisible === "boolean" &&
      !chartCanvasRef.current?.setDrawingsVisible(patch.isVisible) &&
      hasCandles
    ) {
      toast.error(dictionary.marketCharts.drawings.unavailable)
    }
  }

  function handleDeleteSelectedDrawing() {
    if (!chartCanvasRef.current?.deleteSelectedDrawing()) {
      toast.error(dictionary.marketCharts.drawings.deleteUnavailable)
    }
  }

  function handleSelectedDrawingStyleChange(
    patch: Partial<MarketChartDrawingStyle>
  ) {
    if (!chartCanvasRef.current?.updateSelectedDrawingStyle(patch)) {
      toast.error(dictionary.marketCharts.drawings.styleUnavailable)
    }
  }

  function handleClearDrawings() {
    if (!chartCanvasRef.current?.clearDrawings()) {
      toast.error(dictionary.marketCharts.drawings.clearUnavailable)
    }
  }

  function handleScreenshot() {
    const screenshotUrl = chartCanvasRef.current?.captureScreenshot()

    if (!screenshotUrl) {
      toast.error(dictionary.marketCharts.controls.screenshotUnavailable)
      return
    }

    downloadDataUrl(
      screenshotUrl,
      createScreenshotFileName(
        displaySymbol,
        data?.timeframe ?? selection.timeframe
      )
    )
    toast.success(dictionary.marketCharts.controls.screenshotSuccess)
  }

  async function handleFullscreenToggle() {
    const surface = surfaceRef.current

    if (!surface || !document.fullscreenEnabled) {
      toast.error(dictionary.marketCharts.controls.fullscreenUnavailable)
      return
    }

    try {
      if (document.fullscreenElement === surface) {
        await document.exitFullscreen()
      } else {
        await surface.requestFullscreen()
      }
    } catch {
      toast.error(dictionary.marketCharts.controls.fullscreenFailed)
    }
  }

  return (
    <section
      ref={setSurfaceRef}
      data-fullscreen={isFullscreen}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card data-[fullscreen=true]:mt-0 data-[fullscreen=true]:h-screen data-[fullscreen=true]:min-h-0 data-[fullscreen=true]:rounded-none data-[fullscreen=true]:border-0"
    >
      <OverlayPortalContainerProvider
        value={isFullscreen ? surfaceElement : null}
      >
        <MarketChartTopToolbar
          activeIndicators={availableActiveIndicators}
          annotationLayerEnabled={annotationLayerEnabled}
          calendarLayerEnabled={calendarLayerEnabled}
          selectedCalendarImpacts={selectedCalendarImpacts}
          errors={errors}
          hasCandles={hasCandles}
          hasWatchlistAssets={hasWatchlistAssets}
          isBusy={isBusy}
          isFullscreen={isFullscreen}
          phase={phase}
          volumeAvailable={volumeAvailable}
          selection={selection}
          selectedAsset={selectedAsset}
          timeframeLabels={timeframeLabels}
          watchlistAssets={watchlistAssets}
          watchlistError={watchlistError}
          calendarEvents={calendarEvents}
          calendarLoadError={calendarLoadError}
          calendarLoadedAt={calendarLoadedAt}
          calendarLoading={calendarLoading}
          calendarLookaheadDays={calendarLookaheadDays}
          currentCalendarTimestamp={currentCalendarTimestamp}
          onCalendarLookaheadDaysChange={onCalendarLookaheadDaysChange}
          onCalendarRetry={onCalendarRetry}
          onAnnotationLayerChange={onAnnotationLayerChange}
          onCalendarLayerChange={onCalendarLayerChange}
          onCalendarImpactChange={onCalendarImpactChange}
          onAssetChange={(value) => {
            resetVolumeIndicator()
            onAssetChange(value)
          }}
          onFullscreenToggle={handleFullscreenToggle}
          onIndicatorChange={handleIndicatorChange}
          onScreenshot={handleScreenshot}
          onTimeframeChange={(value) => {
            resetVolumeIndicator()
            onTimeframeChange(value)
          }}
        />
        <div
          data-fullscreen={isFullscreen}
          className="relative min-h-[20rem] min-w-0 flex-1 overflow-hidden bg-card data-[fullscreen=true]:min-h-0"
        >
          {/* Canvas: always mounted when there's a selected asset */}
          {selectedAsset ? (
            <div className="absolute inset-0" style={{ zIndex: 0 }}>
              <div className="flex h-full min-h-0 min-w-0">
                {data && hasCandles ? (
                  <MarketChartDrawingToolbar
                    disabled={isBusy}
                    state={drawingState}
                    onClearAll={handleClearDrawings}
                    onDeleteSelected={handleDeleteSelectedDrawing}
                    onStateChange={handleDrawingStateChange}
                    onToolChange={handleDrawingToolChange}
                  />
                ) : null}
                <div
                  className={cn(
                    "relative min-h-0",
                    phase === "success" && hasCandles
                      ? "flex-1"
                      : "invisible flex-1"
                  )}
                >
                  <MarketChartCanvas
                    ref={chartCanvasRef}
                    activeIndicators={availableActiveIndicators}
                    annotations={data?.annotations ?? []}
                    assetId={selectedAsset.assetId}
                    candles={data?.candles ?? []}
                    dataVersion={dataVersion}
                    className="h-full min-h-0"
                    drawingToolActive={!!drawingState.activeTool}
                    annotationLayerEnabled={annotationLayerEnabled}
                    activeOutcomeHoverRange={activeOutcomeHoverRange}
                    liveCandle={liveCandle}
                    pricePrecision={data?.asset.pricePrecision}
                    timeframe={selection.timeframe}
                    symbol={displaySymbol}
                    annotationGroups={annotationGroups}
                    calendarEventGroups={calendarEventGroups}
                    calendarEvents={calendarMarkerEvents}
                    calendarLayerEnabled={calendarLayerEnabled}
                    warmAnnotationGroups={warmAnnotationGroups}
                    renderAnnotationPopup={renderAnnotationPopup}
                    selectedAnnotationGroupId={selectedAnnotationGroup?.id}
                    onAnnotationSelect={handleAnnotationSelect}
                    onAnnotationClose={handleAnnotationClose}
                    onDrawingSelectionChange={(selection) => {
                      setSelectedDrawing(selection)
                      setDrawingState((current) => ({
                        ...current,
                        hasSelectedDrawing: !!selection,
                      }))
                    }}
                    onDrawingToolComplete={() =>
                      setDrawingState((current) => ({
                        ...current,
                        activeTool: null,
                      }))
                    }
                    onLoadedDataChange={onLoadedDataChange}
                    onLoadOlderCandles={onLoadOlderCandles}
                  />
                  {selectedDrawing && !drawingState.activeTool ? (
                    <MarketChartSelectedDrawingToolbar
                      selection={selectedDrawing}
                      onDelete={handleDeleteSelectedDrawing}
                      onStyleChange={handleSelectedDrawingStyleChange}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* Overlay states on top of canvas (only when non-success) */}
          {selectedAsset && !(phase === "success" && hasCandles) ? (
            <div className="absolute inset-0 z-10 bg-card">
              {watchlistError ? (
                <Empty className="h-full min-h-[32rem] border-0 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-destructive/10 text-destructive"
                    >
                      <TriangleAlert />
                    </EmptyMedia>
                    <EmptyTitle>
                      {dictionary.marketCharts.empty.watchlistErrorTitle}
                    </EmptyTitle>
                    <EmptyDescription>{watchlistError}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : !hasWatchlistAssets ? (
                <Empty className="h-full min-h-[32rem] border-0 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ChartCandlestick />
                    </EmptyMedia>
                    <EmptyTitle>
                      {dictionary.marketCharts.empty.noWatchlistAssetsTitle}
                    </EmptyTitle>
                    <EmptyDescription>
                      {
                        dictionary.marketCharts.empty
                          .noWatchlistAssetsDescription
                      }
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : phase === "idle" ? (
                <Empty className="h-full min-h-[32rem] border-0 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ChartCandlestick />
                    </EmptyMedia>
                    <EmptyTitle>
                      {dictionary.marketCharts.empty.idleTitle}
                    </EmptyTitle>
                    <EmptyDescription>
                      {dictionary.marketCharts.empty.idleDescription}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : phase === "loading" ? (
                <MarketChartSurfaceSkeleton embedded />
              ) : phase === "error" ? (
                <Empty className="h-full min-h-[32rem] border-0 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-destructive/10 text-destructive"
                    >
                      <TriangleAlert />
                    </EmptyMedia>
                    <EmptyTitle>
                      {dictionary.marketCharts.empty.loadErrorTitle}
                    </EmptyTitle>
                    <EmptyDescription>
                      {error ||
                        dictionary.marketCharts.empty.loadErrorDescription}
                    </EmptyDescription>
                  </EmptyHeader>
                  {selectedAsset ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetVolumeIndicator()
                        onRetry()
                      }}
                    >
                      <RefreshCw data-icon="inline-start" />
                      {dictionary.marketCharts.controls.refreshLatestData}
                    </Button>
                  ) : null}
                </Empty>
              ) : phase === "success" && data && !hasCandles ? (
                <Empty className="h-full min-h-[32rem] border-0 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <DatabaseZap />
                    </EmptyMedia>
                    <EmptyTitle>
                      {dictionary.marketCharts.empty.noCandlesTitle}
                    </EmptyTitle>
                    <EmptyDescription>
                      {formatMessage(
                        dictionary.marketCharts.empty.noCandlesDescription,
                        {
                          symbol: getDisplayAssetSymbol(
                            data,
                            selectedAsset,
                            dictionary
                          ),
                        }
                      )}
                      <span className="mt-1 flex flex-wrap justify-center gap-3">
                        <AppTimeMetadata icon={CalendarClock}>
                          {formatMessage(dictionary.marketCharts.format.from, {
                            time: formatMarketChartDateTime(
                              data.from,
                              localization
                            ),
                          })}
                        </AppTimeMetadata>
                        <AppTimeMetadata icon={CalendarClock}>
                          {formatMessage(dictionary.marketCharts.format.to, {
                            time: formatMarketChartDateTime(
                              data.to,
                              localization
                            ),
                          })}
                        </AppTimeMetadata>
                      </span>
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetVolumeIndicator()
                      onRetry()
                    }}
                  >
                    <RefreshCw data-icon="inline-start" />
                    {dictionary.marketCharts.controls.refreshLatestData}
                  </Button>
                </Empty>
              ) : null}
            </div>
          ) : null}
        </div>

        <MarketChartAnnotationControls
          annotationLayerEnabled={annotationLayerEnabled}
          calendarEvents={calendarMarkerEvents}
          calendarLayerEnabled={calendarLayerEnabled}
          calendarLoadError={calendarLoadError}
          freshnessLabel={freshnessLabel}
          groups={annotationGroups}
          isLoading={phase === "loading" || calendarLoading}
          liveStatusLabel={liveStatusLabel}
          liveStatusTone={liveStatusTone}
        />

        {selectedAnnotationGroup ? (
          <div className="border-t bg-muted/10 p-3 sm:hidden">
            <div className="overflow-hidden rounded-xl border bg-popover">
              <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {(() => {
                    const warmEpisode =
                      selectedAnnotationGroup.annotations[0]?.warmEpisode
                    const eventCountLabel = formatMessage(
                      dictionary.marketCharts.annotations.eventCount,
                      {
                        count: localization.formatNumber(
                          warmEpisode?.events.length ??
                            selectedAnnotationGroup.annotations.length
                        ),
                      }
                    )

                    return (
                      <>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            getMarketChartAnnotationColorClassNames(
                              selectedAnnotationGroup.direction
                            ).dot,
                            getMarketChartAnnotationColorClassNames(
                              selectedAnnotationGroup.direction
                            ).foreground
                          )}
                        >
                          {warmEpisode
                            ? dictionary.marketCharts.annotations
                                .warmEpisodeLabel
                            : eventCountLabel}
                        </span>
                        {warmEpisode ? (
                          <span className="text-xs font-medium text-muted-foreground">
                            {eventCountLabel}
                          </span>
                        ) : null}
                      </>
                    )
                  })()}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleAnnotationClose}
                  aria-label={
                    dictionary.marketCharts.annotations.closeEventDetails
                  }
                >
                  <X />
                </Button>
              </div>
              <ScrollArea className="h-[min(24rem,calc(100vh-11rem))] p-3">
                <MarketChartAnnotationDetail
                  group={selectedAnnotationGroup}
                  onEventOpen={onAnnotationEventOpen}
                  onOutcomeRangeHover={handleOutcomeRangeHover}
                  onOutcomeRangeLeave={handleOutcomeRangeLeave}
                />
              </ScrollArea>
            </div>
          </div>
        ) : null}

        <LocalEntityQuickDetailDrawer
          entity={quickDetailEntity}
          onBeforeClose={onQuickDetailBeforeClose}
          onClose={onQuickDetailClose}
          owner="market-charts"
        />
      </OverlayPortalContainerProvider>
    </section>
  )
}

function MarketChartSelectedDrawingToolbar({
  selection,
  onDelete,
  onStyleChange,
}: {
  selection: MarketChartDrawingSelection
  onDelete: () => void
  onStyleChange: (patch: Partial<MarketChartDrawingStyle>) => void
}) {
  const { dictionary, formatMessage } = useLocalization()
  const labels = dictionary.marketCharts.drawings
  const anchor = selection.anchor ?? { x: 120, y: 52 }
  const selectedColor = resolveMarketChartDrawingColor(selection.style.color)
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false)
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false)

  function handleColorChange(color: MarketChartDrawingColor) {
    onStyleChange({ color })
    setColorPopoverOpen(false)
  }

  function handleSizeChange(size: MarketChartDrawingSize) {
    onStyleChange({ size })
    setSizePopoverOpen(false)
  }

  return (
    <div
      className="absolute z-20 flex max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-full flex-wrap items-center gap-1 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ left: anchor.x, top: anchor.y }}
      role="toolbar"
      aria-label={labels.selectedToolbarLabel}
    >
      <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={labels.openColorPalette}
            />
          }
        >
          <span
            aria-hidden="true"
            className="size-3 rounded-full ring-1 ring-foreground/20"
            style={{ backgroundColor: selectedColor }}
          />
        </PopoverTrigger>
        <PopoverContentInOverlay align="start" side="top" className="w-auto">
          <div
            className="grid grid-cols-4 gap-1"
            role="group"
            aria-label={labels.colorLabel}
          >
            {MARKET_CHART_DRAWING_COLOR_PRESETS.map((preset) => {
              const selected = selection.style.color === preset.value
              const color = resolveMarketChartDrawingColor(preset.value)

              return (
                <Button
                  key={preset.value}
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={labels.colors[preset.value]}
                  aria-pressed={selected}
                  onClick={() => handleColorChange(preset.value)}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-3 rounded-full ring-1 ring-foreground/20",
                      selected
                        ? "ring-2 ring-ring ring-offset-1 ring-offset-popover"
                        : null
                    )}
                    style={{ backgroundColor: color }}
                  />
                </Button>
              )
            })}
          </div>
        </PopoverContentInOverlay>
      </Popover>

      <Separator orientation="vertical" />

      <Popover open={sizePopoverOpen} onOpenChange={setSizePopoverOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={formatMessage(labels.selectedSize, {
                size: `${selection.style.size}px`,
              })}
            />
          }
        >
          <MarketChartDrawingSizePreview
            compact
            color={selectedColor}
            size={selection.style.size}
          />
        </PopoverTrigger>
        <PopoverContentInOverlay align="start" side="top" className="w-auto">
          <div
            className="flex flex-col gap-1"
            role="group"
            aria-label={labels.sizeLabel}
          >
            {MARKET_CHART_DRAWING_SIZES.map((size) => {
              const selected = selection.style.size === size

              return (
                <Button
                  key={size}
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={formatMessage(labels.sizeOption, {
                    size: `${size}px`,
                  })}
                  aria-pressed={selected}
                  className="justify-start"
                  onClick={() => handleSizeChange(size)}
                >
                  <MarketChartDrawingSizePreview
                    color={selectedColor}
                    selected={selected}
                    size={size}
                  />
                  <span className="sr-only">{size}px</span>
                </Button>
              )
            })}
          </div>
        </PopoverContentInOverlay>
      </Popover>

      <Separator orientation="vertical" />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onDelete}
        aria-label={labels.deleteSelected}
      >
        <Trash2 data-icon="inline-start" />
      </Button>
    </div>
  )
}

function MarketChartDrawingSizePreview({
  compact = false,
  color,
  selected = false,
  size,
}: {
  compact?: boolean
  color: string
  selected?: boolean
  size: MarketChartDrawingSize
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block rounded-full",
        compact ? "w-4" : "w-8",
        selected ? "ring-2 ring-ring ring-offset-2 ring-offset-popover" : null
      )}
      style={{
        borderTopColor: color,
        borderTopStyle: "solid",
        borderTopWidth: size,
      }}
    />
  )
}

function MarketChartAnnotationLegend({
  annotationLayerEnabled,
  calendarEventCount,
  calendarLayerEnabled,
  groups,
}: {
  annotationLayerEnabled: boolean
  calendarEventCount: number
  calendarLayerEnabled: boolean
  groups: MarketChartAnnotationGroup[]
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const showAnnotationLegend = annotationLayerEnabled && groups.length > 0
  const showCalendarLegend = calendarLayerEnabled && calendarEventCount > 0

  if (!showAnnotationLegend && !showCalendarLegend) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-label={dictionary.marketCharts.annotations.legendLabel}
          />
        }
      >
        {dictionary.marketCharts.annotations.legendLabel}
      </PopoverTrigger>
      <PopoverContentInOverlay
        align="end"
        className="w-[min(20rem,calc(100vw_-_1.5rem))]"
      >
        <PopoverHeader>
          <PopoverTitle>
            {dictionary.marketCharts.annotations.legendLabel}
          </PopoverTitle>
        </PopoverHeader>
        <div className="space-y-3 text-xs text-muted-foreground">
          {showAnnotationLegend ? (
            <p className="font-medium text-foreground">
              {formatMessage(dictionary.marketCharts.annotations.eventMarkers, {
                count: formatNumber(groups.length),
              })}
            </p>
          ) : null}
          {showCalendarLegend ? (
            <p className="font-medium text-foreground">
              {formatMessage(dictionary.marketCharts.calendar.eventMarkers, {
                count: formatNumber(calendarEventCount),
              })}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {showAnnotationLegend
              ? MARKET_CHART_ANNOTATION_LEGEND_DIRECTIONS.map((direction) => {
                  const colorClassNames =
                    getMarketChartAnnotationColorClassNames(direction)

                  return (
                    <span
                      key={direction}
                      className="inline-flex items-center gap-2"
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          colorClassNames.dot
                        )}
                      />
                      {dictionary.marketCharts.directions[direction]}
                    </span>
                  )
                })
              : null}
            {showCalendarLegend ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-sky-500" />
                {dictionary.marketCharts.calendar.legendLabel}
              </span>
            ) : null}
          </div>
        </div>
      </PopoverContentInOverlay>
    </Popover>
  )
}

function MarketChartAnnotationDetail({
  group,
  onEventOpen,
  onOutcomeRangeHover,
  onOutcomeRangeLeave,
}: {
  group: MarketChartAnnotationGroup
  onEventOpen: (eventId: number, triggerKey: string) => void
  onOutcomeRangeHover: (range: MarketChartOutcomeHoverRange) => void
  onOutcomeRangeLeave: () => void
}) {
  const localization = useLocalization()
  const annotation = group.annotations[0]

  if (annotation?.annotationType === "WARM_EPISODE" && annotation.warmEpisode) {
    return (
      <MarketChartWarmEpisodeAnnotationDetail
        annotation={annotation}
        onOutcomeRangeHover={onOutcomeRangeHover}
        onOutcomeRangeLeave={onOutcomeRangeLeave}
      />
    )
  }

  return (
    <MarketChartHotAnnotationDetail
      group={group}
      localization={localization}
      onEventOpen={onEventOpen}
      onOutcomeRangeHover={onOutcomeRangeHover}
      onOutcomeRangeLeave={onOutcomeRangeLeave}
    />
  )
}

function MarketChartHotAnnotationDetail({
  group,
  localization,
  onEventOpen,
  onOutcomeRangeHover,
  onOutcomeRangeLeave,
}: {
  group: MarketChartAnnotationGroup
  localization: LocalizationContext
  onEventOpen: (eventId: number, triggerKey: string) => void
  onOutcomeRangeHover: (range: MarketChartOutcomeHoverRange) => void
  onOutcomeRangeLeave: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {group.annotations.map((annotation) => {
          const hotEvent = annotation.hotEvent

          if (!hotEvent) {
            return null
          }

          const eventId = getAnnotationEventId(annotation)
          const triggerKey = `${group.id}:${annotation.id}`
          const eventTime = formatMarketChartDateTime(
            annotation.time,
            localization
          )
          const title = hotEvent.title || hotEvent.summary || ""
          const reaction = hotEvent.topMarketReaction

          return (
            <article key={annotation.id} className="flex flex-col gap-1.5">
              <AppTimeMetadata icon={CalendarClock}>
                {eventTime}
              </AppTimeMetadata>
              {title ? (
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                  {eventId ? (
                    <button
                      type="button"
                      data-quick-detail-trigger={triggerKey}
                      className="rounded-sm text-left underline-offset-4 transition-colors outline-none hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={() => onEventOpen(eventId, triggerKey)}
                    >
                      {title}
                    </button>
                  ) : (
                    title
                  )}
                </h3>
              ) : null}
              {hotEvent.summary ? (
                <p className="line-clamp-4 text-sm text-muted-foreground">
                  {hotEvent.summary}
                </p>
              ) : null}
              {reaction ? (
                <MarketChartAnnotationReactionSection
                  localization={localization}
                  onOutcomeRangeHover={onOutcomeRangeHover}
                  onOutcomeRangeLeave={onOutcomeRangeLeave}
                  reaction={reaction}
                />
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function MarketChartWarmEpisodeAnnotationDetail({
  annotation,
  onOutcomeRangeHover,
  onOutcomeRangeLeave,
}: {
  annotation: MarketChartAnnotationResponse
  onOutcomeRangeHover: (range: MarketChartOutcomeHoverRange) => void
  onOutcomeRangeLeave: () => void
}) {
  const localization = useLocalization()
  const { dictionary, formatMessage } = localization
  const labels = dictionary.marketCharts.annotations
  const relationTypeLabels = labels.relationTypeLabels as Record<string, string>
  const warmEpisode = annotation.warmEpisode

  if (!warmEpisode) {
    return null
  }

  const episodeReaction = warmEpisode.outcome
    ? { direction: warmEpisode.direction, outcome: warmEpisode.outcome }
    : null

  return (
    <div className="flex flex-col gap-3">
      {warmEpisode.summary ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-muted-foreground">
            {labels.warmEpisodeSummaryTitle}
          </h3>
          <p className="text-sm leading-relaxed text-foreground">
            {warmEpisode.summary}
          </p>
        </section>
      ) : null}
      {episodeReaction ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-muted-foreground">
            {labels.episodeOutcomeTitle}
          </h3>
          <MarketChartAnnotationReactionSection
            localization={localization}
            onOutcomeRangeHover={onOutcomeRangeHover}
            onOutcomeRangeLeave={onOutcomeRangeLeave}
            reaction={episodeReaction}
          />
        </section>
      ) : null}
      {warmEpisode.events.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            {labels.warmEpisodeEventsTitle}
          </h3>
          <div className="flex flex-col gap-2 border-l pl-3">
            {warmEpisode.events.map((event) => {
              const eventTime = formatMarketChartDateTime(
                event.time,
                localization
              )
              const title = event.title || event.summary || ""
              const relationLabel = event.relationType
                ? (relationTypeLabels[event.relationType] ?? event.relationType)
                : null
              const direction = event.reaction?.direction
                ? getDirectionLabel(event.reaction.direction, dictionary)
                : null
              const confidence =
                typeof event.reaction?.confidence === "number"
                  ? formatMessage(labels.confidenceBadge, {
                      value: localization.formatNumber(
                        event.reaction.confidence,
                        { maximumFractionDigits: 0, style: "percent" }
                      ),
                    })
                  : null

              return (
                <article
                  key={event.warmEpisodeEventId}
                  className="flex flex-col gap-1"
                >
                  {eventTime ? (
                    <AppTimeMetadata icon={CalendarClock}>
                      {eventTime}
                    </AppTimeMetadata>
                  ) : null}
                  {title ? (
                    <h4 className="text-sm font-semibold text-foreground">
                      {title}
                    </h4>
                  ) : null}
                  {event.title && event.summary ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {event.summary}
                    </p>
                  ) : null}
                  {relationLabel ||
                  direction ||
                  event.reaction?.timeHorizon ||
                  confidence ? (
                    <div className="flex flex-wrap gap-1">
                      {relationLabel ? (
                        <Badge variant="secondary">{relationLabel}</Badge>
                      ) : null}
                      {direction ? (
                        <Badge
                          className={getPredictionBadgeClassName(
                            event.reaction?.direction
                          )}
                        >
                          {direction}
                        </Badge>
                      ) : null}
                      {event.reaction?.timeHorizon ? (
                        <Badge variant="outline">
                          {event.reaction.timeHorizon}
                        </Badge>
                      ) : null}
                      {confidence ? (
                        <Badge variant="outline">{confidence}</Badge>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function MarketChartMovementIcon({
  direction,
}: {
  direction: MarketChartMovementDirection | null
}) {
  const Icon =
    direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : null

  return Icon ? <Icon aria-hidden="true" className="size-3" /> : null
}

function MarketChartAnnotationReactionSection({
  localization,
  onOutcomeRangeHover,
  onOutcomeRangeLeave,
  reaction,
}: {
  localization: LocalizationContext
  onOutcomeRangeHover: (range: MarketChartOutcomeHoverRange) => void
  onOutcomeRangeLeave: () => void
  reaction: MarketChartAnnotationReactionResponse
}) {
  const { dictionary } = localization
  const labels = dictionary.marketCharts.annotations
  const outcome = reaction.outcome
  const predictedDirection = reaction.direction
    ? getDirectionLabel(reaction.direction, dictionary)
    : null
  const predictedDirectionBadgeClassName = getPredictionBadgeClassName(
    reaction.direction
  )
  const realizedReturn = formatOutcomeReturn(
    outcome?.realizedReturn,
    localization
  )
  const actualDirection = outcome?.actualDirection
    ? getDirectionLabel(outcome.actualDirection, dictionary)
    : null
  const actualDirectionBadgeClassName = getPredictionBadgeClassName(
    outcome?.actualDirection
  )
  const anchorPrice = formatOutcomePrice(outcome?.anchorPrice, localization)
  const evaluationPrice = formatOutcomePrice(
    outcome?.evaluationPrice,
    localization
  )
  const hasPriceChange = !!anchorPrice || !!evaluationPrice
  const priceMovement = getMarketChartPriceMovementDirection(
    outcome?.anchorPrice,
    outcome?.evaluationPrice
  )
  const anchorTime = formatOptionalMarketChartDateTime(
    outcome?.anchorTime,
    localization
  )
  const evaluationTime = formatOptionalMarketChartDateTime(
    outcome?.evaluationTime,
    localization
  )
  const evaluationWindow = formatMarketChartValueRange(
    anchorTime,
    evaluationTime
  )
  const outcomeSummary = outcome?.summary?.trim() || null
  const outcomeRange =
    outcome?.anchorTime && outcome.evaluationTime
      ? {
          anchorTime: outcome.anchorTime,
          evaluationTime: outcome.evaluationTime,
        }
      : null

  function handleOutcomeRangeEnter() {
    if (outcomeRange) {
      onOutcomeRangeHover(outcomeRange)
    }
  }

  if (
    !predictedDirection &&
    !actualDirection &&
    !hasPriceChange &&
    !evaluationWindow &&
    !outcomeSummary
  ) {
    return null
  }

  return (
    <section
      className="mt-1 flex flex-col gap-1.5 rounded-md border bg-muted/20 p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      tabIndex={outcomeRange ? 0 : undefined}
      onBlur={onOutcomeRangeLeave}
      onFocus={handleOutcomeRangeEnter}
      onMouseEnter={handleOutcomeRangeEnter}
      onMouseLeave={onOutcomeRangeLeave}
    >
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {predictedDirection ? (
          <span className="inline-flex items-center gap-2">
            {labels.predictedReactionTitle}
            <Badge className={predictedDirectionBadgeClassName}>
              {predictedDirection}
            </Badge>
          </span>
        ) : null}
        {actualDirection ? (
          <span className="inline-flex items-center gap-2">
            {labels.outcomeTitle}
            <Badge className={actualDirectionBadgeClassName}>
              {actualDirection}
            </Badge>
          </span>
        ) : null}
        {hasPriceChange ? (
          <span>
            {labels.priceChange}:{" "}
            {anchorPrice ? (
              <span className="font-medium text-foreground">{anchorPrice}</span>
            ) : null}
            {anchorPrice && evaluationPrice ? " -> " : null}
            {evaluationPrice ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium text-foreground",
                  priceMovement
                    ? MARKET_CHART_MOVEMENT_CLASS_NAMES[priceMovement]
                    : null
                )}
              >
                {evaluationPrice}
                {realizedReturn ? ` (${realizedReturn})` : null}
                <MarketChartMovementIcon direction={priceMovement} />
              </span>
            ) : null}
          </span>
        ) : null}
        {evaluationWindow ? <span>{evaluationWindow}</span> : null}
      </div>
      {outcomeSummary ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {outcomeSummary}
        </p>
      ) : null}
    </section>
  )
}

function formatCalendarCountdown(
  milliseconds: number,
  localization: LocalizationContext
) {
  const totalMinutes = Math.max(1, Math.ceil(milliseconds / (60 * 1000)))

  if (totalMinutes < 60) {
    return localization.formatMessage(
      localization.dictionary.marketCharts.calendar.countdownMinutes,
      { minutes: totalMinutes }
    )
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return localization.formatMessage(
    minutes > 0
      ? localization.dictionary.marketCharts.calendar.countdownHours
      : localization.dictionary.marketCharts.calendar.countdownHoursOnly,
    minutes > 0 ? { hours, minutes } : { hours }
  )
}

function MarketChartUpcomingCalendar({
  calendarEvents,
  calendarLoadError,
  calendarLoadedAt,
  calendarLoading,
  calendarLookaheadDays,
  currentTimestamp,
  onLookaheadDaysChange,
  onRetry,
  selectedImpactCount,
}: {
  calendarEvents: MarketChartEconomicCalendarEventResponse[]
  calendarLoadError: string | null
  calendarLoadedAt: string | null
  calendarLoading: boolean
  calendarLookaheadDays: MarketChartCalendarLookaheadDays
  currentTimestamp: number
  onLookaheadDaysChange: (days: MarketChartCalendarLookaheadDays) => void
  onRetry: () => void
  selectedImpactCount: number
}) {
  const localization = useLocalization()
  const { dictionary, formatDateTime } = localization
  const summaryContainerRef = useRef<HTMLDivElement | null>(null)
  const [summaryWidth, setSummaryWidth] = useState<number | null>(null)
  const [summaryMode, setSummaryMode] = useState<"compact" | "full">("compact")

  useEffect(() => {
    const element = summaryContainerRef.current

    if (!element) {
      return
    }

    function updateSummaryWidth(width: number) {
      setSummaryWidth(width)
      setSummaryMode((current) => {
        if (current === "full") {
          return width < 380 ? "compact" : current
        }

        return width >= 420 ? "full" : current
      })
    }

    const observer = new ResizeObserver(([entry]) => {
      updateSummaryWidth(entry.contentRect.width)
    })

    updateSummaryWidth(element.getBoundingClientRect().width)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const upcomingEvents = getUpcomingMarketChartCalendarEvents({
    currentTimestamp,
    events: calendarEvents,
    lookaheadDays: calendarLookaheadDays,
  })
  const awaitingEvents = getAwaitingMarketChartCalendarEvents({
    currentTimestamp,
    events: calendarEvents,
  })
  const nextEvent = getNextMarketChartCalendarEvent({
    currentTimestamp,
    events: calendarEvents,
    lookaheadDays: calendarLookaheadDays,
  })
  const nextEventTimestamp = nextEvent
    ? getMarketChartCalendarEventTimestamp(nextEvent)
    : null
  const nextEventTitle =
    nextEvent?.title?.trim() || dictionary.marketCharts.calendar.eventFallback
  const nextEventTime = nextEventTimestamp
    ? formatDateTime(
        nextEventTimestamp,
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
        dictionary.marketCharts.format.notAvailable
      )
    : null
  const nextEventImpact = nextEvent
    ? ECONOMIC_CALENDAR_IMPACT_LEVELS.find((impact) =>
        isEconomicCalendarImpactSelected(nextEvent.impact, [impact])
      )
    : null
  const nextEventImpactLabel = nextEventImpact
    ? dictionary.marketCharts.controls.impactOptionLabels[nextEventImpact]
    : null
  const countdownLabel =
    nextEventTimestamp && currentTimestamp > 0
      ? formatCalendarCountdown(
          nextEventTimestamp - currentTimestamp,
          localization
        )
      : null
  const summaryLabel = nextEvent
    ? `${nextEventTitle}${nextEventTime ? ` · ${nextEventTime}` : ""}`
    : dictionary.marketCharts.calendar.noNextEvent
  const fullSummaryLabel = nextEvent
    ? [nextEventTitle, nextEventTime, nextEventImpactLabel, countdownLabel]
        .filter(Boolean)
        .join(" · ")
    : summaryLabel
  const stale = !!calendarLoadedAt && !!calendarLoadError
  const showCompactCountdown = summaryWidth === null || summaryWidth >= 220
  const showCompactIconOnly = summaryWidth !== null && summaryWidth < 180
  const showFullSummary = summaryMode === "full"

  return (
    <div
      ref={summaryContainerRef}
      className="order-none min-w-0 flex-1 basis-full lg:order-last lg:ml-auto lg:max-w-[min(32rem,100%)] lg:basis-auto"
    >
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size={showCompactIconOnly ? "icon-sm" : "sm"}
              className={cn(
                "max-w-full min-w-0 justify-start gap-1.5 text-left",
                showCompactIconOnly && "justify-center"
              )}
              title={showCompactIconOnly ? fullSummaryLabel : undefined}
              aria-label={`${dictionary.marketCharts.calendar.openUpcoming}: ${fullSummaryLabel}`}
            />
          }
        >
          <CalendarClock data-icon="inline-start" />
          {showFullSummary ? (
            <span
              className="flex min-w-0 items-baseline gap-1.5"
              aria-live="polite"
            >
              <span className="shrink-0 font-semibold">
                {dictionary.marketCharts.calendar.nextEvent}:
              </span>
              <span className="min-w-0 truncate font-semibold">
                {nextEvent ? nextEventTitle : summaryLabel}
              </span>
              {nextEventTime ? (
                <span className="shrink-0 text-muted-foreground">
                  {nextEventTime}
                </span>
              ) : null}
              {countdownLabel ? (
                <span className="shrink-0 text-muted-foreground">
                  {countdownLabel}
                </span>
              ) : null}
            </span>
          ) : (
            <span
              className="flex min-w-0 items-center gap-1.5"
              aria-live="polite"
            >
              {!showCompactIconOnly ? (
                <span className="shrink-0 font-semibold">
                  {dictionary.marketCharts.calendar.nextEvent}
                </span>
              ) : null}
              {showCompactCountdown && countdownLabel ? (
                <span className="min-w-0 truncate text-muted-foreground">
                  {countdownLabel}
                </span>
              ) : null}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContentInOverlay
          align="start"
          className="w-[min(32rem,calc(100vw_-_1.5rem))]"
        >
          <PopoverHeader>
            <PopoverTitle>
              {dictionary.marketCharts.calendar.upcomingTitle}
            </PopoverTitle>
            <PopoverDescription>
              {stale
                ? dictionary.marketCharts.calendar.stale
                : calendarLoadError ||
                  (calendarLoading
                    ? dictionary.marketCharts.calendar.loadingEvents
                    : dictionary.marketCharts.calendar.legendLabel)}
            </PopoverDescription>
          </PopoverHeader>

          <ToggleGroup
            multiple={false}
            value={[String(calendarLookaheadDays)]}
            variant="outline"
            size="sm"
            onValueChange={(values) => {
              const value = values[0]

              if (value === "1" || value === "7") {
                onLookaheadDaysChange(
                  Number(value) as MarketChartCalendarLookaheadDays
                )
              }
            }}
            aria-label={dictionary.marketCharts.calendar.upcomingTitle}
          >
            <ToggleGroupItem value="1">
              {dictionary.marketCharts.calendar.upcoming24Hours}
            </ToggleGroupItem>
            <ToggleGroupItem value="7">
              {dictionary.marketCharts.calendar.upcoming7Days}
            </ToggleGroupItem>
          </ToggleGroup>

          {selectedImpactCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dictionary.marketCharts.calendar.noSelectedImpacts}
            </p>
          ) : null}

          {calendarLoadError ? (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
              <span>{calendarLoadError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                <RefreshCw data-icon="inline-start" />
                {dictionary.marketCharts.controls.refreshLatestData}
              </Button>
            </div>
          ) : null}

          {awaitingEvents.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {dictionary.marketCharts.calendar.awaitingPublication}
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    dictionary.marketCharts.calendar
                      .awaitingPublicationDescription
                  }
                </p>
              </div>
              <MarketChartCalendarEventList events={awaitingEvents} />
            </div>
          ) : null}

          {upcomingEvents.length > 0 ? (
            <MarketChartCalendarEventList events={upcomingEvents} />
          ) : !calendarLoading && selectedImpactCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {dictionary.marketCharts.calendar.noEvents}
            </p>
          ) : null}

          <LocalizedLink
            href="/economic-calendar"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {dictionary.marketCharts.calendar.viewFullCalendar}
          </LocalizedLink>
        </PopoverContentInOverlay>
      </Popover>
    </div>
  )
}

function MarketChartAnnotationControls({
  annotationLayerEnabled,
  calendarEvents,
  calendarLayerEnabled,
  calendarLoadError,
  freshnessLabel,
  groups,
  isLoading,
  liveStatusLabel,
  liveStatusTone,
}: {
  annotationLayerEnabled: boolean
  calendarEvents: MarketChartEconomicCalendarEventResponse[]
  calendarLayerEnabled: boolean
  calendarLoadError: string | null
  freshnessLabel: string | null
  groups: MarketChartAnnotationGroup[]
  isLoading: boolean
  liveStatusLabel: string | null
  liveStatusTone: "error" | "live" | "pending" | "stale"
}) {
  const { dictionary, formatMessage, formatNumber } = useLocalization()
  const calendarEventCount = calendarEvents.length
  const label = annotationLayerEnabled
    ? isLoading
      ? dictionary.marketCharts.annotations.loadingEvents
      : groups.length > 0
        ? formatMessage(dictionary.marketCharts.annotations.eventMarkers, {
            count: formatNumber(groups.length),
          })
        : dictionary.marketCharts.annotations.noEvents
    : null
  const calendarLabel = calendarLayerEnabled
    ? calendarLoadError ||
      (isLoading
        ? dictionary.marketCharts.calendar.loadingEvents
        : calendarEventCount > 0
          ? formatMessage(dictionary.marketCharts.calendar.eventMarkers, {
              count: formatNumber(calendarEventCount),
            })
          : dictionary.marketCharts.calendar.noEvents)
    : null
  const hasEvents = groups.length > 0
  const eventColorClassNames = getMarketChartAnnotationColorClassNames(
    getAnnotationGroupsSummaryDirection(groups)
  )

  return (
    <div className="border-t bg-muted/10 px-3 py-1.5">
      <div className="flex min-h-7 min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
        {label || calendarLabel ? (
          <>
            <div
              className={cn(
                "min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1",
                calendarLoadError ? "flex" : "hidden sm:flex"
              )}
            >
              {label ? (
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      hasEvents
                        ? eventColorClassNames.dot
                        : "bg-muted-foreground/40"
                    )}
                  />
                  {label}
                </span>
              ) : null}
              {calendarLabel ? (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 rounded-full",
                      calendarLoadError
                        ? "bg-destructive"
                        : calendarEventCount > 0
                          ? "bg-sky-500"
                          : "bg-muted-foreground/40"
                    )}
                  />
                  {calendarLabel}
                </span>
              ) : null}
            </div>
            <span className="sr-only sm:hidden">
              {[label, calendarLabel].filter(Boolean).join(" · ")}
            </span>
          </>
        ) : (
          <span aria-hidden="true" className="min-w-0 flex-1" />
        )}
        <MarketChartAnnotationLegend
          annotationLayerEnabled={annotationLayerEnabled}
          calendarEventCount={calendarEventCount}
          calendarLayerEnabled={calendarLayerEnabled}
          groups={groups}
        />
        {freshnessLabel || liveStatusLabel ? (
          <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right">
            {liveStatusLabel ? (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    liveStatusTone === "live"
                      ? "bg-primary"
                      : liveStatusTone === "error"
                        ? "bg-destructive"
                        : liveStatusTone === "stale"
                          ? "bg-muted-foreground"
                          : "bg-muted-foreground/40"
                  )}
                />
                {liveStatusLabel}
              </span>
            ) : null}
            {freshnessLabel ? (
              <AppTimeMetadata icon={RefreshCw}>
                {freshnessLabel}
              </AppTimeMetadata>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function MarketChartWorkbench({
  watchlistAssets,
  watchlistError,
}: MarketChartWorkbenchProps) {
  const localization = useLocalization()
  const { dictionary } = localization
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selection, setSelection] = useState<MarketChartSelectionState>(() =>
    createDefaultSelection(watchlistAssets)
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [phase, setPhase] = useState<WorkbenchPhase>("idle")
  const [data, setData] = useState<MarketChartDisplayData | null>(null)
  const [loadedData, setLoadedData] = useState<MarketChartDisplayData | null>(
    null
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [liveState, setLiveState] = useState<MarketChartLiveRuntimeState>(
    DEFAULT_MARKET_CHART_LIVE_STATE
  )
  const [lastAssetId, setLastAssetId] = useState<string | null>(null)
  const [dataVersion, setDataVersion] = useState(0)
  const loadGenerationRef = useRef(0)
  const initialLoadObserverRef = useRef(createMarketChartInitialLoadObserver())
  const [annotationLayerEnabled, setAnnotationLayerEnabled] = useState(true)
  const [calendarLayerPreference, setCalendarLayerPreference] = useState<
    boolean | null
  >(() => readStoredMarketChartCalendarVisibility())
  const [calendarLayerEnabled, setCalendarLayerEnabled] = useState(
    getInitialMarketChartCalendarVisibility
  )
  const [selectedCalendarImpacts, setSelectedCalendarImpacts] = useState<
    EconomicCalendarImpactLevel[]
  >(() => ["HIGH"])
  const [calendarLoadError, setCalendarLoadError] = useState<string | null>(
    null
  )
  const [futureCalendarEvents, setFutureCalendarEvents] = useState<
    MarketChartEconomicCalendarEventResponse[]
  >([])
  const [futureCalendarLoadError, setFutureCalendarLoadError] = useState<
    string | null
  >(null)
  const [futureCalendarLoadedAt, setFutureCalendarLoadedAt] = useState<
    string | null
  >(null)
  const [futureCalendarLoading, setFutureCalendarLoading] = useState(false)
  const [calendarLookaheadDays, setCalendarLookaheadDays] =
    useState<MarketChartCalendarLookaheadDays>(7)
  const [currentCalendarTimestamp, setCurrentCalendarTimestamp] = useState(0)
  const annotationLayerEnabledRef = useRef(annotationLayerEnabled)
  const calendarLayerEnabledRef = useRef(calendarLayerEnabled)
  const selectedCalendarImpactsRef = useRef(selectedCalendarImpacts)
  const futureCalendarGenerationRef = useRef(0)
  const futureCalendarAssetIdRef = useRef<number | null>(null)
  const [selectedAnnotationGroupId, setSelectedAnnotationGroupId] = useState<
    string | null
  >(null)
  const [quickDetailEntity, setQuickDetailEntity] =
    useState<LocalQuickDetailEntity | null>(null)
  const quickDetailReturnTargetRef = useRef<{
    groupId: string
    triggerKey: string
  } | null>(null)
  const pendingRouteSelectionRef = useRef<MarketChartSelectionState | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const hasWatchlistAssets = watchlistAssets.length > 0
  const selectedAsset = findWatchlistAsset(watchlistAssets, selection.assetId)
  const selectedAssetId = selectedAsset?.assetId ?? null
  const isBusy = phase === "loading" || isPending
  const timeframeLabels = getMarketChartTimeframeLabels(dictionary)
  const freshnessLabel = getFreshnessLabel(data, phase, liveState, localization)
  const chartData = loadedData ?? data
  const chartCandlesRef = useRef(chartData?.candles ?? [])
  const liveCandleItem = liveState.candle
  const liveStatusLabel = getLiveStatusLabel(liveState, localization)
  const liveStatusTone = getLiveStatusTone(liveState)
  const annotationGroups = useMemo(() => {
    if (!annotationLayerEnabled || !chartData) {
      return []
    }

    return createMarketChartAnnotationGroups(
      chartData.annotations,
      chartData.candles
    )
  }, [annotationLayerEnabled, chartData])

  useEffect(() => {
    chartCandlesRef.current = chartData?.candles ?? []
  }, [chartData?.candles])
  useEffect(() => {
    if (phase === "success" && loadedData) {
      initialLoadObserverRef.current.finish(
        loadGenerationRef.current,
        "success"
      )
    }
  }, [loadedData, phase])
  useEffect(() => () => initialLoadObserverRef.current.cancelCurrent(), [])
  const allCalendarEvents = useMemo(
    () =>
      mergeMarketChartEconomicCalendarEvents(
        chartData?.economicCalendarEvents ?? [],
        futureCalendarEvents
      ),
    [chartData?.economicCalendarEvents, futureCalendarEvents]
  )
  const calendarEvents = useMemo(
    () =>
      allCalendarEvents.filter((event) =>
        isEconomicCalendarImpactSelected(event.impact, selectedCalendarImpacts)
      ),
    [allCalendarEvents, selectedCalendarImpacts]
  )
  const visibleCalendarEvents = useMemo(
    () => (calendarLayerEnabled ? calendarEvents : []),
    [calendarEvents, calendarLayerEnabled]
  )
  const calendarEventGroups = useMemo(() => {
    if (!calendarLayerEnabled || !chartData) {
      return []
    }

    return createMarketChartEconomicCalendarEventGroups(
      visibleCalendarEvents,
      chartData.candles
    )
  }, [calendarLayerEnabled, chartData, visibleCalendarEvents])
  const warmAnnotationGroups = useMemo(() => {
    if (
      !annotationLayerEnabled ||
      !chartData ||
      !isMarketChartWarmBandTimeframe(selection.timeframe)
    ) {
      return []
    }

    return createMarketChartWarmAnnotationGroups(
      chartData.annotations,
      chartData.candles
    )
  }, [annotationLayerEnabled, chartData, selection.timeframe])

  useEffect(() => {
    function updateCalendarClock() {
      if (!document.hidden) {
        setCurrentCalendarTimestamp(Date.now())
      }
    }

    updateCalendarClock()
    const intervalId = window.setInterval(updateCalendarClock, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (calendarLayerPreference !== null) {
      return
    }

    function updateAdaptiveCalendarVisibility() {
      setCalendarLayerEnabled(getAdaptiveMarketChartCalendarVisibility())
    }

    window.addEventListener("resize", updateAdaptiveCalendarVisibility)

    return () =>
      window.removeEventListener("resize", updateAdaptiveCalendarVisibility)
  }, [calendarLayerPreference])

  const selectedAnnotationGroup =
    [...annotationGroups, ...warmAnnotationGroups].find(
      (group) => group.id === selectedAnnotationGroupId
    ) ?? null

  useEffect(() => {
    const target = quickDetailReturnTargetRef.current

    if (quickDetailEntity || !target) {
      return
    }

    const returnTarget = target

    if (selectedAnnotationGroupId !== returnTarget.groupId) {
      setSelectedAnnotationGroupId(returnTarget.groupId)
      return
    }

    let frameId = 0
    let attempts = 0

    function restoreTriggerFocus() {
      const trigger = Array.from(
        document.querySelectorAll<HTMLElement>("[data-quick-detail-trigger]")
      ).find((element) => {
        if (
          element.getAttribute("data-quick-detail-trigger") !==
            returnTarget.triggerKey ||
          element.getAttribute("aria-hidden") === "true" ||
          element.hidden ||
          element.getClientRects().length === 0
        ) {
          return false
        }

        const style = window.getComputedStyle(element)
        return style.display !== "none" && style.visibility !== "hidden"
      })

      if (trigger) {
        trigger.focus()
        if (document.activeElement === trigger) {
          quickDetailReturnTargetRef.current = null
          return
        }
      }

      attempts += 1
      if (attempts < 30) {
        frameId = window.requestAnimationFrame(restoreTriggerFocus)
      }
    }

    frameId = window.requestAnimationFrame(restoreTriggerFocus)

    return () => window.cancelAnimationFrame(frameId)
  }, [quickDetailEntity, selectedAnnotationGroupId])

  useEffect(() => {
    annotationLayerEnabledRef.current = annotationLayerEnabled
  }, [annotationLayerEnabled])

  useEffect(() => {
    calendarLayerEnabledRef.current = calendarLayerEnabled
  }, [calendarLayerEnabled])

  useEffect(() => {
    selectedCalendarImpactsRef.current = selectedCalendarImpacts
  }, [selectedCalendarImpacts])

  const loadAnnotations = useCallback(async function loadAnnotations(
    request: Pick<MarketChartAnnotationRequest, "assetId" | "from" | "to">
  ) {
    const result = await getMarketChartAnnotations({
      assetId: request.assetId,
      from: request.from,
      to: request.to,
    })

    if (!result.success) {
      toast.error(result.error)
      return []
    }

    return result.data
  }, [])

  const loadEconomicCalendarEvents = useCallback(
    async function loadEconomicCalendarEvents(
      request: Pick<MarketChartAnnotationRequest, "assetId" | "from" | "to">,
      impacts: readonly EconomicCalendarImpactLevel[]
    ) {
      const requests = createMarketChartEconomicCalendarEventRequests(
        request,
        impacts
      )

      if (!requests.length) {
        return []
      }

      const results = await Promise.all(
        requests.map((calendarRequest) =>
          getMarketChartEconomicCalendarEvents(calendarRequest)
        )
      )
      const failedResult = results.find((result) => !result.success)

      if (failedResult && !failedResult.success) {
        setCalendarLoadError(failedResult.error)
        toast.error(failedResult.error)
      } else {
        setCalendarLoadError(null)
      }

      return results.flatMap((result) => (result.success ? result.data : []))
    },
    []
  )

  const loadFutureCalendarEvents = useCallback(
    async function loadFutureCalendarEvents(
      assetId: number,
      impacts: readonly EconomicCalendarImpactLevel[]
    ) {
      const generation = ++futureCalendarGenerationRef.current

      if (!impacts.length) {
        setFutureCalendarEvents([])
        setFutureCalendarLoadError(null)
        setFutureCalendarLoadedAt(null)
        setFutureCalendarLoading(false)
        return
      }

      const request = createMarketChartFutureCalendarRequest({
        assetId,
        currentTimestamp: Date.now(),
        impacts,
      })

      if (!request) {
        return
      }

      setFutureCalendarLoadError(null)
      setFutureCalendarLoading(true)

      const result = await getMarketChartEconomicCalendarEvents(request)

      if (futureCalendarGenerationRef.current !== generation) {
        return
      }

      setFutureCalendarLoading(false)

      if (!result.success) {
        setFutureCalendarLoadError(result.error)
        return
      }

      setFutureCalendarEvents(result.data)
      setFutureCalendarLoadError(null)
      setFutureCalendarLoadedAt(new Date().toISOString())
    },
    []
  )

  const loadCandles = useCallback(
    async function loadCandles(
      asset: WorkspaceWatchlistAssetListItemResponse,
      timeframe: MarketChartTimeframe,
      loadAnnotationData: boolean
    ) {
      initialLoadObserverRef.current.cancelCurrent()
      const loadGeneration = ++loadGenerationRef.current
      const request = createLatestHistoryRequest({
        assetId: asset.assetId,
        currentTimestamp: Date.now(),
        timeframe,
      })

      setPhase("loading")
      setLoadError(null)
      setCalendarLoadError(null)
      setLoadedData(null)
      setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
      setLastAssetId(String(asset.assetId))
      setSelectedAnnotationGroupId(null)

      if (!request) {
        setData(null)
        setLoadedData(null)
        setPhase("error")
        setLoadError(dictionary.marketCharts.responseInvalid)
        return
      }

      initialLoadObserverRef.current.start(loadGeneration)

      let result: Awaited<ReturnType<typeof getMarketChartCandles>>
      try {
        result = await getMarketChartCandles(request)
      } catch (error) {
        initialLoadObserverRef.current.finish(loadGeneration, "error")
        throw error
      }

      if (loadGenerationRef.current !== loadGeneration) {
        initialLoadObserverRef.current.finish(loadGeneration, "stale")
        return
      }

      if (!result.success) {
        initialLoadObserverRef.current.finish(loadGeneration, "error")
        setData(null)
        setLoadedData(null)
        setPhase("error")
        setLoadError(result.error)
        return
      }

      const candles = normalizeCandleItems(result.data.candles)
      const displayedInterval = deriveMarketChartDisplayedCandleInterval(
        candles,
        timeframe,
        request.to
      )

      if (candles.length > 0 && !displayedInterval) {
        initialLoadObserverRef.current.finish(
          loadGeneration,
          "validation_error"
        )
        setData(null)
        setLoadedData(null)
        setPhase("error")
        setLoadError(dictionary.marketCharts.responseInvalid)
        return
      }

      if (loadGenerationRef.current !== loadGeneration) {
        initialLoadObserverRef.current.finish(loadGeneration, "stale")
        return
      }

      const displayData = {
        ...result.data,
        candles,
        from: displayedInterval?.from ?? request.to,
        to: displayedInterval?.to ?? request.to,
      }
      const displayedRange = displayedInterval
        ? {
            assetId: request.assetId,
            from: displayedInterval.from,
            to: displayedInterval.to,
          }
        : null

      let annotations: MarketChartAnnotationResponse[]
      let economicCalendarEvents: MarketChartEconomicCalendarEventResponse[]
      try {
        const loadedSupplementalData = await Promise.all([
          loadAnnotationData && displayedRange
            ? loadAnnotations(displayedRange)
            : Promise.resolve([]),
          calendarLayerEnabledRef.current && displayedRange
            ? loadEconomicCalendarEvents(
                displayedRange,
                selectedCalendarImpactsRef.current
              )
            : Promise.resolve([]),
        ])
        annotations = loadedSupplementalData[0]
        economicCalendarEvents = loadedSupplementalData[1]
      } catch (error) {
        initialLoadObserverRef.current.finish(loadGeneration, "error")
        throw error
      }

      if (loadGenerationRef.current !== loadGeneration) {
        initialLoadObserverRef.current.finish(loadGeneration, "stale")
        return
      }

      const nextData = createMarketChartDisplayData(
        displayData,
        annotations,
        economicCalendarEvents
      )

      setData(nextData)
      setLoadedData(nextData)
      setLiveState(
        candles.length > 0
          ? {
              ...DEFAULT_MARKET_CHART_LIVE_STATE,
              transportState: "CONNECTING",
            }
          : DEFAULT_MARKET_CHART_LIVE_STATE
      )
      setDataVersion((v) => v + 1)
      setPhase("success")
    },
    [
      dictionary.marketCharts.responseInvalid,
      loadAnnotations,
      loadEconomicCalendarEvents,
    ]
  )

  useEffect(() => {
    futureCalendarGenerationRef.current += 1

    if (futureCalendarAssetIdRef.current !== selectedAssetId) {
      futureCalendarAssetIdRef.current = selectedAssetId
      setFutureCalendarEvents([])
      setFutureCalendarLoadError(null)
      setFutureCalendarLoadedAt(null)
    }

    if (
      selectedAssetId === null ||
      !selectedCalendarImpacts.length ||
      phase === "idle" ||
      phase === "loading"
    ) {
      return
    }

    let active = true
    const assetId = selectedAssetId
    const impacts = [...selectedCalendarImpacts]

    function refresh() {
      if (active && !document.hidden) {
        void loadFutureCalendarEvents(assetId, impacts)
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        setCurrentCalendarTimestamp(Date.now())
        refresh()
      }
    }

    refresh()
    const intervalId = window.setInterval(
      refresh,
      MARKET_CHART_CALENDAR_REFRESH_INTERVAL_MS
    )
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [
    loadFutureCalendarEvents,
    phase,
    selectedAssetId,
    selectedCalendarImpacts,
  ])

  useEffect(() => {
    if (
      phase !== "success" ||
      selectedAssetId === null ||
      chartCandlesRef.current.length === 0
    ) {
      return
    }

    let active = true

    const stream = openMarketChartLiveStream({
      assetId: selectedAssetId,
      timeframe: selection.timeframe,
      onCandle(value) {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          candle: value,
          error: null,
        }))
      },
      onErrorEvent(value) {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          error: value.message,
          transportState: "ERROR",
        }))
      },
      onInvalidEvent() {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          error: dictionary.marketCharts.live.invalidPayload,
          transportState: "ERROR",
        }))
      },
      onOpen() {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          error: null,
          transportState: "CONNECTED",
        }))
      },
      onPrice(value) {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          candle:
            deriveLiveCandleItemFromQuote({
              current: current.candle
                ? [current.candle]
                : chartCandlesRef.current,
              quote: value,
              timeframe: selection.timeframe,
            }) ?? current.candle,
          error: null,
          quote: value,
          status: null,
          transportState: value.stale ? "STALE" : "CONNECTED",
        }))
      },
      onSnapshot(value) {
        if (!active) {
          return
        }

        setLiveState((current) => {
          const quoteConfirmsLive =
            value.quote?.stale === false &&
            (value.status.state === "CONNECTING" ||
              value.status.state === "RECONNECTING")

          return {
            ...current,
            candle:
              value.candle ??
              (value.quote
                ? deriveLiveCandleItemFromQuote({
                    current: current.candle
                      ? [current.candle]
                      : chartCandlesRef.current,
                    quote: value.quote,
                    timeframe: selection.timeframe,
                  })
                : null) ??
              current.candle,
            error: null,
            quote: value.quote ?? current.quote,
            status: quoteConfirmsLive ? null : value.status,
            transportState: quoteConfirmsLive
              ? "CONNECTED"
              : value.status.state,
          }
        })
      },
      onStatus(value) {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          error:
            value.state === "ERROR" ? (value.message ?? current.error) : null,
          status: value,
          transportState: value.state,
        }))
      },
      onTransportError() {
        if (!active) {
          return
        }

        setLiveState((current) => ({
          ...current,
          transportState:
            current.transportState === "CONNECTING"
              ? "CONNECTING"
              : "RECONNECTING",
        }))
      },
    })

    return () => {
      active = false
      stream.close()
    }
  }, [
    dictionary.marketCharts.live.invalidPayload,
    phase,
    selectedAssetId,
    selection.timeframe,
  ])

  useEffect(() => {
    if (isPending) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      initialLoadObserverRef.current.cancelCurrent()
      loadGenerationRef.current += 1

      if (watchlistError) {
        setData(null)
        setLoadedData(null)
        setErrors({ form: watchlistError })
        setLoadError(watchlistError)
        setCalendarLoadError(null)
        setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
        setPhase("idle")
        setLastAssetId(null)
        setSelectedAnnotationGroupId(null)
        return
      }

      if (!hasWatchlistAssets) {
        setSelection(createDefaultSelection(watchlistAssets))
        setData(null)
        setLoadedData(null)
        setErrors({})
        setLoadError(null)
        setCalendarLoadError(null)
        setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
        setPhase("idle")
        setLastAssetId(null)
        setSelectedAnnotationGroupId(null)
        return
      }

      const assetId = getSingleParam(searchParams, "assetId")
      const timeframeParam = getSingleParam(searchParams, "timeframe")
      const timeframe = getTimeframeFromSearchParams(searchParams)
      const pendingRouteSelection = pendingRouteSelectionRef.current

      if (pendingRouteSelection) {
        const matchesPendingRoute =
          pendingRouteSelection.assetId === (assetId ?? "") &&
          pendingRouteSelection.timeframe === timeframe

        if (!matchesPendingRoute) {
          startTransition(() => {
            router.replace(
              `${pathname}?${createQueryString(pendingRouteSelection)}`,
              { scroll: false }
            )
          })
          return
        }

        pendingRouteSelectionRef.current = null
      }

      if (timeframeParam && !isMarketChartTimeframe(timeframeParam)) {
        setSelection({
          assetId: assetId || String(watchlistAssets[0].assetId),
          timeframe: DEFAULT_MARKET_CHART_TIMEFRAME,
        })
        setData(null)
        setLoadedData(null)
        setErrors({
          timeframe: dictionary.marketCharts.state.unsupportedTimeframeUrl,
        })
        setLoadError(dictionary.marketCharts.state.unsupportedTimeframeUrlError)
        setCalendarLoadError(null)
        setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
        setPhase("error")
        setLastAssetId(null)
        setSelectedAnnotationGroupId(null)
        return
      }

      if (!assetId) {
        const nextSelection = {
          assetId: String(watchlistAssets[0].assetId),
          timeframe,
        }
        setSelection(nextSelection)
        setPhase("loading")
        startTransition(() => {
          router.replace(`${pathname}?${createQueryString(nextSelection)}`, {
            scroll: false,
          })
        })
        return
      }

      const asset = findWatchlistAsset(watchlistAssets, assetId)
      const nextSelection = { assetId, timeframe }
      setSelection(nextSelection)

      if (!asset) {
        setData(null)
        setLoadedData(null)
        setErrors({
          assetId: dictionary.marketCharts.state.assetMissingUrl,
        })
        setLoadError(dictionary.marketCharts.state.assetMissingUrlError)
        setCalendarLoadError(null)
        setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
        setPhase("error")
        setLastAssetId(null)
        setSelectedAnnotationGroupId(null)
        return
      }

      setErrors({})
      void loadCandles(asset, timeframe, annotationLayerEnabledRef.current)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [
    dictionary,
    hasWatchlistAssets,
    isPending,
    loadCandles,
    pathname,
    router,
    searchParams,
    watchlistAssets,
    watchlistError,
  ])

  function updateRoute(nextSelection: MarketChartSelectionState) {
    initialLoadObserverRef.current.cancelCurrent()
    loadGenerationRef.current += 1
    pendingRouteSelectionRef.current = nextSelection
    setSelection(nextSelection)
    setErrors({})

    if (!nextSelection.assetId) {
      pendingRouteSelectionRef.current = null
      setData(null)
      setLoadedData(null)
      setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
      setPhase("idle")
      setSelectedAnnotationGroupId(null)
      return
    }

    setPhase("loading")
    setLoadedData(null)
    setCalendarLoadError(null)
    setLiveState(DEFAULT_MARKET_CHART_LIVE_STATE)
    setSelectedAnnotationGroupId(null)
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString(nextSelection)}`, {
        scroll: false,
      })
    })
    // Background server-action responses can carry the previous query URL.
    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}?${createQueryString(nextSelection)}`
    )
  }

  function handleAssetChange(assetId: string) {
    updateRoute({ ...selection, assetId })
  }

  function handleTimeframeChange(value: string) {
    if (!isMarketChartTimeframe(value)) {
      setErrors((current) => ({
        ...current,
        timeframe: dictionary.marketCharts.unsupportedTimeframe,
      }))
      return
    }

    updateRoute({ ...selection, timeframe: value })
  }

  function handleAnnotationLayerChange(checked: boolean) {
    setAnnotationLayerEnabled(checked)
    setSelectedAnnotationGroupId(null)

    if (checked && chartData?.candles.length && selectedAsset) {
      void loadAnnotations({
        assetId: selectedAsset.assetId,
        from: chartData.from,
        to: chartData.to,
      }).then((annotations) => {
        setLoadedData((current) => {
          const baseData = current ?? data

          return baseData ? { ...baseData, annotations } : current
        })
      })
    }
  }

  function handleCalendarLayerChange(checked: boolean) {
    setCalendarLayerPreference(checked)
    setCalendarLayerEnabled(checked)
    writeStoredMarketChartCalendarVisibility(checked)
  }

  function handleCalendarImpactChange(
    impact: EconomicCalendarImpactLevel,
    checked: boolean
  ) {
    setSelectedCalendarImpacts((current) =>
      checked
        ? ECONOMIC_CALENDAR_IMPACT_LEVELS.filter(
            (level) => level === impact || current.includes(level)
          )
        : current.filter((level) => level !== impact)
    )

    if (
      !checked ||
      selectedCalendarImpacts.includes(impact) ||
      !chartData?.candles.length ||
      !selectedAsset
    ) {
      return
    }

    const assetId = selectedAsset.assetId

    void loadEconomicCalendarEvents(
      {
        assetId,
        from: chartData.from,
        to: chartData.to,
      },
      [impact]
    ).then((economicCalendarEvents) => {
      setLoadedData((current) => {
        const baseData = current ?? data

        return baseData?.asset.id === assetId
          ? {
              ...baseData,
              economicCalendarEvents: mergeMarketChartEconomicCalendarEvents(
                baseData.economicCalendarEvents,
                economicCalendarEvents
              ),
            }
          : current
      })
    })
  }

  function handleAnnotationSelect(groupId: string) {
    setSelectedAnnotationGroupId(groupId)
  }

  function handleAnnotationClose() {
    setSelectedAnnotationGroupId(null)
  }

  function handleAnnotationEventOpen(eventId: number, triggerKey: string) {
    if (!selectedAnnotationGroupId) {
      return
    }

    quickDetailReturnTargetRef.current = {
      groupId: selectedAnnotationGroupId,
      triggerKey,
    }
    setSelectedAnnotationGroupId(null)
    setQuickDetailEntity({ id: eventId, kind: "event" })
  }

  function handleQuickDetailBeforeClose() {
    const target = quickDetailReturnTargetRef.current

    if (target) {
      setSelectedAnnotationGroupId(target.groupId)
    }
  }

  function handleLoadedDataChange(nextData: MarketChartLoadedData) {
    setLoadedData((current) => {
      const baseData = current ?? data

      if (!baseData) {
        return current
      }

      return {
        ...baseData,
        annotations: nextData.annotations,
        candles: nextData.candles,
        economicCalendarEvents: nextData.economicCalendarEvents,
        from: nextData.from ?? baseData.from,
      }
    })
  }

  async function handleLoadOlderCandles(
    request: MarketChartCandleRequest
  ): Promise<ActionResult<MarketChartLoadedData>> {
    const result = await getMarketChartCandles(request)

    if (!result.success) {
      return result
    }

    const candles = normalizeCandleItems(result.data.candles)

    if (!candles.length) {
      return {
        success: true,
        data: {
          annotations: [],
          candles: [],
          economicCalendarEvents: [],
          from: request.to,
        },
      }
    }

    const displayedInterval = deriveMarketChartDisplayedCandleInterval(
      candles,
      request.timeframe,
      request.to
    )

    if (!displayedInterval) {
      return {
        success: false,
        error: dictionary.marketCharts.responseInvalid,
      }
    }

    const displayedRange = {
      assetId: request.assetId,
      from: displayedInterval.from,
      to: displayedInterval.to,
    }

    const annotations = annotationLayerEnabledRef.current
      ? await loadAnnotations(displayedRange)
      : []
    const economicCalendarEvents = calendarLayerEnabledRef.current
      ? await loadEconomicCalendarEvents(
          displayedRange,
          selectedCalendarImpactsRef.current
        )
      : []

    return {
      success: true,
      data: {
        annotations,
        candles,
        economicCalendarEvents,
        from: displayedInterval.from,
      },
    }
  }

  function handleRefresh() {
    const asset =
      selectedAsset || findWatchlistAsset(watchlistAssets, lastAssetId || "")

    if (!asset) {
      setErrors({
        assetId: dictionary.marketCharts.state.selectAssetBeforeRefresh,
      })
      return
    }

    void loadFutureCalendarEvents(
      asset.assetId,
      selectedCalendarImpactsRef.current
    )
    void loadCandles(asset, selection.timeframe, annotationLayerEnabled)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" aria-busy={isBusy}>
      {errors.form ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.form}
        </div>
      ) : null}

      <ChartSurface
        annotationLayerEnabled={annotationLayerEnabled}
        annotationGroups={annotationGroups}
        calendarEventGroups={calendarEventGroups}
        calendarEvents={calendarEvents}
        calendarMarkerEvents={visibleCalendarEvents}
        calendarLayerEnabled={calendarLayerEnabled}
        selectedCalendarImpacts={selectedCalendarImpacts}
        calendarLoadError={futureCalendarLoadError || calendarLoadError}
        calendarLoadedAt={futureCalendarLoadedAt}
        calendarLoading={futureCalendarLoading}
        calendarLookaheadDays={calendarLookaheadDays}
        currentCalendarTimestamp={currentCalendarTimestamp}
        warmAnnotationGroups={warmAnnotationGroups}
        dataVersion={dataVersion}
        data={chartData}
        error={loadError}
        errors={errors}
        freshnessLabel={freshnessLabel}
        isBusy={isBusy}
        liveCandle={liveCandleItem}
        liveStatusLabel={liveStatusLabel}
        liveStatusTone={liveStatusTone}
        phase={phase}
        selection={selection}
        selectedAsset={selectedAsset}
        quickDetailEntity={quickDetailEntity}
        selectedAnnotationGroup={selectedAnnotationGroup}
        timeframeLabels={timeframeLabels}
        watchlistAssets={watchlistAssets}
        watchlistError={watchlistError}
        hasWatchlistAssets={hasWatchlistAssets}
        onAnnotationClose={handleAnnotationClose}
        onAnnotationEventOpen={handleAnnotationEventOpen}
        onAnnotationLayerChange={handleAnnotationLayerChange}
        onAnnotationSelect={handleAnnotationSelect}
        onQuickDetailBeforeClose={handleQuickDetailBeforeClose}
        onQuickDetailClose={() => setQuickDetailEntity(null)}
        onCalendarLayerChange={handleCalendarLayerChange}
        onCalendarImpactChange={handleCalendarImpactChange}
        onCalendarLookaheadDaysChange={setCalendarLookaheadDays}
        onCalendarRetry={() => {
          if (selectedAsset) {
            void loadFutureCalendarEvents(
              selectedAsset.assetId,
              selectedCalendarImpactsRef.current
            )
          }
        }}
        onAssetChange={handleAssetChange}
        onLoadedDataChange={handleLoadedDataChange}
        onLoadOlderCandles={handleLoadOlderCandles}
        onRetry={handleRefresh}
        onTimeframeChange={handleTimeframeChange}
      />

      <div
        className={cn(
          "sr-only",
          phase === "error" ? "aria-live-assertive" : "aria-live-polite"
        )}
        aria-live={phase === "error" ? "assertive" : "polite"}
      >
        {phase === "loading"
          ? dictionary.marketCharts.state.loadingAnnouncement
          : phase === "success"
            ? dictionary.marketCharts.state.successAnnouncement
            : phase === "error"
              ? loadError || dictionary.marketCharts.state.errorAnnouncement
              : ""}
      </div>
    </div>
  )
}
