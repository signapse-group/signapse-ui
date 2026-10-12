import { z } from "zod"

import {
  ECONOMIC_CALENDAR_IMPACT_LEVELS,
  type EconomicCalendarImpactLevel,
} from "@/app/lib/economic-calendar/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { isMarketChartCandleBoundary } from "./candle-boundaries"

export const MARKET_CHART_TIMEFRAMES = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
  "1mo",
] as const

export type MarketChartTimeframe = (typeof MARKET_CHART_TIMEFRAMES)[number]

export const MARKET_CHART_WARM_BAND_TIMEFRAMES = ["1d", "1w"] as const

export function isMarketChartWarmBandTimeframe(
  timeframe: MarketChartTimeframe
): boolean {
  return MARKET_CHART_WARM_BAND_TIMEFRAMES.some(
    (candidate) => candidate === timeframe
  )
}

export function getMarketChartTimeframeLabels(
  dictionary: Dictionary
): Record<MarketChartTimeframe, string> {
  return dictionary.marketCharts.timeframes
}

export const DEFAULT_MARKET_CHART_TIMEFRAME: MarketChartTimeframe = "1h"

export type MarketChartAssetType =
  "COMMODITY" | "CRYPTO" | "FX" | "INDEX" | string

export interface MarketChartCandleRequest {
  assetId: number
  timeframe: MarketChartTimeframe
  to: string
  countBack: number
}

export interface MarketChartAnnotationRequest {
  assetId: number
  from: string
  to: string
}

export interface MarketChartEconomicCalendarEventRequest {
  assetId: number
  from: string
  to: string
  impact: EconomicCalendarImpactLevel[]
}

export interface MarketChartAssetResponse {
  id: number
  name: string
  symbol: string
  type: MarketChartAssetType
  pricePrecision?: number | null
}

export interface MarketChartCandleItemResponse {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number | null
  partial?: boolean
}

export type MarketChartAnnotationDirection =
  "BULLISH" | "BEARISH" | "MIXED" | "NEUTRAL" | string

export type MarketChartAnnotationType = "HOT_EVENT" | "WARM_EPISODE" | string

export interface MarketChartAnnotationEvidenceResponse {
  newsArticleId?: number | null
  title?: string | null
  publisher?: string | null
  url?: string | null
  publishedAt?: string | null
  evidenceRole?: string | null
  confidence?: number | null
  evidenceNote?: string | null
}

export interface MarketChartAnnotationLinksResponse {
  eventDetail?: string | null
}

export interface MarketChartAnnotationOutcomeResponse {
  anchorTime?: string | null
  anchorPrice?: number | null
  evaluationTime?: string | null
  evaluationPrice?: number | null
  realizedReturn?: number | null
  actualDirection?: MarketChartAnnotationDirection | null
  alignment?: string | null
  evaluatedAt?: string | null
  summary?: string | null
}

export interface MarketChartAnnotationReactionResponse {
  id?: number | null
  direction?: MarketChartAnnotationDirection | null
  timeHorizon?: string | null
  confidence?: number | null
  reasoning?: string | null
  observedAt?: string | null
  outcome?: MarketChartAnnotationOutcomeResponse | null
}

export interface MarketChartHotEventAnnotationResponse {
  eventId?: number | null
  severity?: string | null
  direction?: MarketChartAnnotationDirection | null
  title?: string | null
  summary?: string | null
  confidence?: number | null
  topMarketReaction?: MarketChartAnnotationReactionResponse | null
  marketReactions?: MarketChartAnnotationReactionResponse[]
  evidence: MarketChartAnnotationEvidenceResponse[]
  links?: MarketChartAnnotationLinksResponse | null
}

export interface MarketChartWarmEpisodeEventAnnotationResponse {
  warmEpisodeEventId: number
  time: string
  severity?: string | null
  direction?: MarketChartAnnotationDirection | null
  title?: string | null
  summary?: string | null
  confidence?: number | null
  relationType?: string | null
  reaction?: MarketChartAnnotationReactionResponse | null
}

export interface MarketChartWarmEpisodeAnnotationResponse {
  warmEpisodeId: number
  periodStart: string
  periodEnd: string
  direction?: MarketChartAnnotationDirection | null
  summary?: string | null
  outcome?: MarketChartAnnotationOutcomeResponse | null
  events: MarketChartWarmEpisodeEventAnnotationResponse[]
}

export interface MarketChartAnnotationResponse {
  id: string
  annotationType: MarketChartAnnotationType
  assetId: number
  time: string
  hotEvent?: MarketChartHotEventAnnotationResponse | null
  warmEpisode?: MarketChartWarmEpisodeAnnotationResponse | null
}

export type MarketChartEconomicCalendarEventStatus = "PENDING" | "AVAILABLE"

export interface MarketChartEconomicCalendarEventResponse {
  id: number
  assetId: number
  time: string
  title?: string | null
  currencyCode?: string | null
  type?: string | null
  impact?: string | null
  forecastValue?: string | null
  previousValue?: string | null
  actualValue?: string | null
  revision?: string | null
  actualBetterWorse?: string | null
  revisionBetterWorse?: string | null
  description?: string | null
  status: MarketChartEconomicCalendarEventStatus
  scheduledAt?: string | null
}

export interface MarketChartCandleResponse {
  provider?: string | null
  symbol?: string | null
  asset: MarketChartAssetResponse
  timeframe: MarketChartTimeframe
  from: string
  to: string
  candles: MarketChartCandleItemResponse[]
}

export type MarketChartLiveStreamState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "SUBSCRIBED"
  | "UNSUBSCRIBED"
  | "STALE"
  | "MARKET_CLOSED"
  | "ERROR"

export interface MarketChartLiveRequest {
  assetId: number
  timeframe: MarketChartTimeframe
}

export interface MarketChartLiveStatusResponse {
  assetId: number
  symbol: string
  state: MarketChartLiveStreamState
  message?: string | null
  stale: boolean
  observedAt: string
}

export interface MarketChartLiveQuoteResponse {
  assetId: number
  symbol: string
  price: number
  volume?: number | null
  providerTime?: string | null
  receivedAt: string
  stale: boolean
}

export interface MarketChartLiveCandleResponse {
  assetId: number
  symbol: string
  timeframe: MarketChartTimeframe
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number | null
  updatedAt: string
  partial: true
}

export interface MarketChartLiveSnapshotResponse {
  asset: MarketChartAssetResponse
  symbol: string
  timeframe: MarketChartTimeframe
  quote?: MarketChartLiveQuoteResponse | null
  candle?: MarketChartLiveCandleResponse | null
  status: MarketChartLiveStatusResponse
}

export interface MarketChartLiveErrorResponse {
  assetId: number
  symbol: string
  message: string
  observedAt: string
}

function isValidDateTime(value: string) {
  return !Number.isNaN(Date.parse(value))
}

export function getMarketChartCandleRequestSchema(dictionary: Dictionary) {
  return z
    .object({
      assetId: z
        .number({
          message: dictionary.marketCharts.invalidAsset,
        })
        .int(dictionary.marketCharts.invalidAsset)
        .positive(dictionary.marketCharts.selectWatchlistAsset),
      timeframe: z.enum(MARKET_CHART_TIMEFRAMES, {
        message: dictionary.marketCharts.unsupportedTimeframe,
      }),
      to: z
        .string()
        .trim()
        .min(1, dictionary.marketCharts.toRequired)
        .refine(isValidDateTime, dictionary.marketCharts.toInvalid),
      countBack: z
        .number({ message: dictionary.marketCharts.validationInvalid })
        .int(dictionary.marketCharts.validationInvalid)
        .min(1, dictionary.marketCharts.validationInvalid)
        .max(1000, dictionary.marketCharts.validationInvalid),
    })
    .strict()
    .superRefine((value, context) => {
      if (!isMarketChartCandleBoundary(value.timeframe, value.to)) {
        context.addIssue({
          code: "custom",
          path: ["to"],
          message: dictionary.marketCharts.toInvalid,
        })
      }
    }) satisfies z.ZodType<MarketChartCandleRequest>
}

export function getMarketChartAnnotationRequestSchema(dictionary: Dictionary) {
  return z
    .object({
      assetId: z
        .number({
          message: dictionary.marketCharts.invalidAsset,
        })
        .int(dictionary.marketCharts.invalidAsset)
        .positive(dictionary.marketCharts.selectWatchlistAsset),
      from: z
        .string()
        .trim()
        .min(1, dictionary.marketCharts.fromRequired)
        .refine(isValidDateTime, dictionary.marketCharts.fromInvalid),
      to: z
        .string()
        .trim()
        .min(1, dictionary.marketCharts.toRequired)
        .refine(isValidDateTime, dictionary.marketCharts.toInvalid),
    })
    .superRefine((value, context) => {
      const fromTime = Date.parse(value.from)
      const toTime = Date.parse(value.to)

      if (
        !Number.isNaN(fromTime) &&
        !Number.isNaN(toTime) &&
        fromTime >= toTime
      ) {
        context.addIssue({
          code: "custom",
          path: ["to"],
          message: dictionary.marketCharts.toAfterFrom,
        })
      }
    }) satisfies z.ZodType<MarketChartAnnotationRequest>
}

export function getMarketChartEconomicCalendarEventRequestSchema(
  dictionary: Dictionary
) {
  return z
    .object({
      assetId: z
        .number({
          message: dictionary.marketCharts.invalidAsset,
        })
        .int(dictionary.marketCharts.invalidAsset)
        .positive(dictionary.marketCharts.selectWatchlistAsset),
      from: z
        .string()
        .trim()
        .min(1, dictionary.marketCharts.fromRequired)
        .refine(isValidDateTime, dictionary.marketCharts.fromInvalid),
      to: z
        .string()
        .trim()
        .min(1, dictionary.marketCharts.toRequired)
        .refine(isValidDateTime, dictionary.marketCharts.toInvalid),
      impact: z
        .array(
          z.enum(ECONOMIC_CALENDAR_IMPACT_LEVELS, {
            message: dictionary.marketCharts.validationInvalid,
          })
        )
        .min(1, dictionary.marketCharts.validationInvalid),
    })
    .superRefine((value, context) => {
      const fromTime = Date.parse(value.from)
      const toTime = Date.parse(value.to)

      if (
        !Number.isNaN(fromTime) &&
        !Number.isNaN(toTime) &&
        fromTime >= toTime
      ) {
        context.addIssue({
          code: "custom",
          path: ["to"],
          message: dictionary.marketCharts.toAfterFrom,
        })
      }
    }) satisfies z.ZodType<MarketChartEconomicCalendarEventRequest>
}

export const marketChartAssetResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  symbol: z.string(),
  type: z.string(),
  pricePrecision: z.number().int().nonnegative().nullable().optional(),
}) satisfies z.ZodType<MarketChartAssetResponse>

export const marketChartCandleItemResponseSchema = z.object({
  time: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().nullable().optional(),
  partial: z.boolean().optional(),
}) satisfies z.ZodType<MarketChartCandleItemResponse>

export const marketChartAnnotationEvidenceResponseSchema = z.object({
  newsArticleId: z.number().nullable().optional(),
  title: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  evidenceRole: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  evidenceNote: z.string().nullable().optional(),
}) satisfies z.ZodType<MarketChartAnnotationEvidenceResponse>

export const marketChartAnnotationLinksResponseSchema = z.object({
  eventDetail: z.string().nullable().optional(),
}) satisfies z.ZodType<MarketChartAnnotationLinksResponse>

export const marketChartAnnotationOutcomeResponseSchema = z.object({
  anchorTime: z.string().nullable().optional(),
  anchorPrice: z.number().nullable().optional(),
  evaluationTime: z.string().nullable().optional(),
  evaluationPrice: z.number().nullable().optional(),
  realizedReturn: z.number().nullable().optional(),
  actualDirection: z.string().nullable().optional(),
  alignment: z.string().nullable().optional(),
  evaluatedAt: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
}) satisfies z.ZodType<MarketChartAnnotationOutcomeResponse>

export const marketChartAnnotationReactionResponseSchema = z.object({
  id: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  timeHorizon: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  reasoning: z.string().nullable().optional(),
  observedAt: z.string().nullable().optional(),
  outcome: marketChartAnnotationOutcomeResponseSchema.nullable().optional(),
}) satisfies z.ZodType<MarketChartAnnotationReactionResponse>

export const marketChartHotEventAnnotationResponseSchema = z.object({
  eventId: z.number().nullable().optional(),
  severity: z.string().nullable().optional(),
  direction: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  topMarketReaction: marketChartAnnotationReactionResponseSchema
    .nullable()
    .optional(),
  marketReactions: z
    .array(marketChartAnnotationReactionResponseSchema)
    .default([]),
  evidence: z.array(marketChartAnnotationEvidenceResponseSchema).default([]),
  links: marketChartAnnotationLinksResponseSchema.nullable().optional(),
}) satisfies z.ZodType<MarketChartHotEventAnnotationResponse>

export const marketChartWarmEpisodeEventAnnotationResponseSchema = z.object({
  warmEpisodeEventId: z.number(),
  time: z.string(),
  severity: z.string().nullable().optional(),
  direction: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  relationType: z.string().nullable().optional(),
  reaction: marketChartAnnotationReactionResponseSchema.nullable().optional(),
}) satisfies z.ZodType<MarketChartWarmEpisodeEventAnnotationResponse>

export const marketChartWarmEpisodeAnnotationResponseSchema = z.object({
  warmEpisodeId: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
  direction: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  outcome: marketChartAnnotationOutcomeResponseSchema.nullable().optional(),
  events: z
    .array(marketChartWarmEpisodeEventAnnotationResponseSchema)
    .default([]),
}) satisfies z.ZodType<MarketChartWarmEpisodeAnnotationResponse>

export const marketChartAnnotationResponseSchema = z.object({
  id: z.string(),
  annotationType: z.enum(["HOT_EVENT", "WARM_EPISODE"]),
  assetId: z.number().int(),
  time: z.string().refine(isValidDateTime),
  hotEvent: marketChartHotEventAnnotationResponseSchema.nullable().optional(),
  warmEpisode: marketChartWarmEpisodeAnnotationResponseSchema
    .nullable()
    .optional(),
}) satisfies z.ZodType<MarketChartAnnotationResponse>

export const marketChartEconomicCalendarEventStatusSchema = z.enum([
  "PENDING",
  "AVAILABLE",
]) satisfies z.ZodType<MarketChartEconomicCalendarEventStatus>

export const marketChartEconomicCalendarEventResponseSchema = z.object({
  id: z.number(),
  assetId: z.number(),
  time: z.string(),
  title: z.string().nullable().optional(),
  currencyCode: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  impact: z.string().nullable().optional(),
  forecastValue: z.string().nullable().optional(),
  previousValue: z.string().nullable().optional(),
  actualValue: z.string().nullable().optional(),
  revision: z.string().nullable().optional(),
  actualBetterWorse: z.string().nullable().optional(),
  revisionBetterWorse: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: marketChartEconomicCalendarEventStatusSchema,
  scheduledAt: z.string().nullable().optional(),
}) satisfies z.ZodType<MarketChartEconomicCalendarEventResponse>

export const marketChartCandleResponseSchema = z.object({
  provider: z.string().nullable().optional(),
  symbol: z.string().nullable().optional(),
  asset: marketChartAssetResponseSchema,
  timeframe: z.enum(MARKET_CHART_TIMEFRAMES),
  from: z.string().refine(isValidDateTime),
  to: z.string().refine(isValidDateTime),
  candles: z.array(marketChartCandleItemResponseSchema),
}) satisfies z.ZodType<MarketChartCandleResponse>

export const marketChartLiveStreamStateSchema = z.enum([
  "CONNECTING",
  "CONNECTED",
  "DISCONNECTED",
  "RECONNECTING",
  "SUBSCRIBED",
  "UNSUBSCRIBED",
  "STALE",
  "MARKET_CLOSED",
  "ERROR",
]) satisfies z.ZodType<MarketChartLiveStreamState>

export const marketChartLiveRequestSchema = z.object({
  assetId: z.number().int().positive(),
  timeframe: z.enum(MARKET_CHART_TIMEFRAMES),
}) satisfies z.ZodType<MarketChartLiveRequest>

export const marketChartLiveStatusResponseSchema = z.object({
  assetId: z.number(),
  symbol: z.string(),
  state: marketChartLiveStreamStateSchema,
  message: z.string().nullable().optional(),
  stale: z.boolean(),
  observedAt: z.string(),
}) satisfies z.ZodType<MarketChartLiveStatusResponse>

export const marketChartLiveQuoteResponseSchema = z.object({
  assetId: z.number(),
  symbol: z.string(),
  price: z.number(),
  volume: z.number().nullable().optional(),
  providerTime: z.string().nullable().optional(),
  receivedAt: z.string(),
  stale: z.boolean(),
}) satisfies z.ZodType<MarketChartLiveQuoteResponse>

export const marketChartLiveCandleResponseSchema = z.object({
  assetId: z.number(),
  symbol: z.string(),
  timeframe: z.enum(MARKET_CHART_TIMEFRAMES),
  time: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().nullable().optional(),
  updatedAt: z.string(),
  partial: z.literal(true),
}) satisfies z.ZodType<MarketChartLiveCandleResponse>

export const marketChartLiveSnapshotResponseSchema = z.object({
  asset: marketChartAssetResponseSchema,
  symbol: z.string(),
  timeframe: z.enum(MARKET_CHART_TIMEFRAMES),
  quote: marketChartLiveQuoteResponseSchema.nullable().optional(),
  candle: marketChartLiveCandleResponseSchema.nullable().optional(),
  status: marketChartLiveStatusResponseSchema,
}) satisfies z.ZodType<MarketChartLiveSnapshotResponse>

export const marketChartLiveErrorResponseSchema = z.object({
  assetId: z.number(),
  symbol: z.string(),
  message: z.string(),
  observedAt: z.string(),
}) satisfies z.ZodType<MarketChartLiveErrorResponse>

export function isMarketChartTimeframe(
  value: string
): value is MarketChartTimeframe {
  return MARKET_CHART_TIMEFRAMES.includes(value as MarketChartTimeframe)
}
