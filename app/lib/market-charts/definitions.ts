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

const MARKET_CHART_ANNOTATION_DIRECTIONS = [
  "BULLISH",
  "BEARISH",
  "MIXED",
  "NEUTRAL",
] as const

const MARKET_CHART_ANNOTATION_EVIDENCE_ROLES = [
  "PRIMARY",
  "SUPPORTING",
  "UPDATE",
  "CONTRADICTING",
] as const
const MARKET_CHART_ANNOTATION_TIME_HORIZONS = [
  "INTRADAY",
  "SHORT_TERM",
  "MEDIUM_TERM",
  "LONG_TERM",
] as const
const MARKET_CHART_WARM_EPISODE_RELATION_TYPES = [
  "PRIMARY_SUBJECT",
  "AFFECTED_ASSET",
  "REFERENCE_ASSET",
] as const

export type MarketChartAnnotationDirection =
  (typeof MARKET_CHART_ANNOTATION_DIRECTIONS)[number]

export type MarketChartAnnotationType = "HOT_EVENT" | "WARM_EPISODE"

export type MarketChartAnnotationEvidenceRole =
  (typeof MARKET_CHART_ANNOTATION_EVIDENCE_ROLES)[number]
export type MarketChartAnnotationTimeHorizon =
  (typeof MARKET_CHART_ANNOTATION_TIME_HORIZONS)[number]
export type MarketChartWarmEpisodeRelationType =
  (typeof MARKET_CHART_WARM_EPISODE_RELATION_TYPES)[number]

export interface MarketChartAnnotationEvidenceResponse {
  newsArticleId: number
  title: string | null
  publisher: string
  url: string
  publishedAt: string | null
  evidenceRole: MarketChartAnnotationEvidenceRole
  confidence: number | null
  evidenceNote: string | null
}

export interface MarketChartAnnotationLinksResponse {
  eventDetail: string
}

export interface MarketChartAnnotationOutcomeResponse {
  anchorTime: string | null
  anchorPrice: number | null
  evaluationTime: string | null
  evaluationPrice: number | null
  realizedReturn: number | null
  actualDirection: MarketChartAnnotationDirection | null
  alignment: string | null
  evaluatedAt: string | null
  summary: string | null
}

export interface MarketChartAnnotationReactionResponse {
  id: number | null
  direction: MarketChartAnnotationDirection | null
  timeHorizon: MarketChartAnnotationTimeHorizon | null
  confidence: number | null
  reasoning: string | null
  observedAt: string | null
  outcome: MarketChartAnnotationOutcomeResponse | null
}

export interface MarketChartHotEventAnnotationResponse {
  eventId: number
  severity: string | null
  direction: MarketChartAnnotationDirection | null
  title: string | null
  summary: string | null
  confidence: number | null
  topMarketReaction: MarketChartAnnotationReactionResponse | null
  marketReactions: MarketChartAnnotationReactionResponse[]
  evidence: MarketChartAnnotationEvidenceResponse[]
  links: MarketChartAnnotationLinksResponse
}

export interface MarketChartWarmEpisodeEventAnnotationResponse {
  warmEpisodeEventId: number
  time: string
  severity: string | null
  direction: MarketChartAnnotationDirection | null
  title: string | null
  summary: string | null
  confidence: number | null
  relationType: MarketChartWarmEpisodeRelationType | null
  reaction: MarketChartAnnotationReactionResponse | null
}

export interface MarketChartWarmEpisodeAnnotationResponse {
  warmEpisodeId: number
  periodStart: string
  periodEnd: string
  direction: MarketChartAnnotationDirection | null
  summary: string | null
  outcome: MarketChartAnnotationOutcomeResponse | null
  events: MarketChartWarmEpisodeEventAnnotationResponse[]
}

interface MarketChartAnnotationBaseResponse {
  id: string
  assetId: number
  time: string
}

export type MarketChartAnnotationResponse =
  | (MarketChartAnnotationBaseResponse & {
      annotationType: "HOT_EVENT"
      hotEvent: MarketChartHotEventAnnotationResponse
      warmEpisode: null
    })
  | (MarketChartAnnotationBaseResponse & {
      annotationType: "WARM_EPISODE"
      hotEvent: null
      warmEpisode: MarketChartWarmEpisodeAnnotationResponse
    })

export type MarketChartEconomicCalendarEventStatus = "PENDING" | "AVAILABLE"

export interface MarketChartEconomicCalendarEventResponse {
  id?: number
  assetId?: number
  time?: string
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
  status?: MarketChartEconomicCalendarEventStatus
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
  | "RECONNECTING"
  | "SUBSCRIBED"
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
  message: string | null
  stale: boolean
  observedAt: string
}

export interface MarketChartLiveQuoteResponse {
  assetId: number
  symbol: string
  price: number
  receivedAt: string
  stale: boolean
}

export interface MarketChartLiveSnapshotResponse {
  asset: MarketChartAssetResponse
  symbol: string
  timeframe: MarketChartTimeframe
  quote: MarketChartLiveQuoteResponse | null
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

const marketChartAnnotationDateTimeSchema = z.string().refine(isValidDateTime)

export const marketChartAnnotationEvidenceResponseSchema = z.object({
  newsArticleId: z.number().int(),
  title: z.string().nullable(),
  publisher: z.string(),
  url: z.string(),
  publishedAt: marketChartAnnotationDateTimeSchema.nullable(),
  evidenceRole: z.enum(MARKET_CHART_ANNOTATION_EVIDENCE_ROLES),
  confidence: z.number().nullable(),
  evidenceNote: z.string().nullable(),
}) satisfies z.ZodType<MarketChartAnnotationEvidenceResponse>

export const marketChartAnnotationLinksResponseSchema = z.object({
  eventDetail: z.string(),
}) satisfies z.ZodType<MarketChartAnnotationLinksResponse>

export const marketChartAnnotationOutcomeResponseSchema = z.object({
  anchorTime: marketChartAnnotationDateTimeSchema.nullable(),
  anchorPrice: z.number().nullable(),
  evaluationTime: marketChartAnnotationDateTimeSchema.nullable(),
  evaluationPrice: z.number().nullable(),
  realizedReturn: z.number().nullable(),
  actualDirection: z.enum(MARKET_CHART_ANNOTATION_DIRECTIONS).nullable(),
  alignment: z.string().nullable(),
  evaluatedAt: marketChartAnnotationDateTimeSchema.nullable(),
  summary: z.string().nullable(),
}) satisfies z.ZodType<MarketChartAnnotationOutcomeResponse>

export const marketChartAnnotationReactionResponseSchema = z.object({
  id: z.number().int().nullable(),
  direction: z.enum(MARKET_CHART_ANNOTATION_DIRECTIONS).nullable(),
  timeHorizon: z.enum(MARKET_CHART_ANNOTATION_TIME_HORIZONS).nullable(),
  confidence: z.number().nullable(),
  reasoning: z.string().nullable(),
  observedAt: marketChartAnnotationDateTimeSchema.nullable(),
  outcome: marketChartAnnotationOutcomeResponseSchema.nullable(),
}) satisfies z.ZodType<MarketChartAnnotationReactionResponse>

export const marketChartHotEventAnnotationResponseSchema = z.object({
  eventId: z.number().int(),
  severity: z.string().nullable(),
  direction: z.enum(MARKET_CHART_ANNOTATION_DIRECTIONS).nullable(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  confidence: z.number().nullable(),
  topMarketReaction: marketChartAnnotationReactionResponseSchema.nullable(),
  marketReactions: z.array(marketChartAnnotationReactionResponseSchema),
  evidence: z.array(marketChartAnnotationEvidenceResponseSchema),
  links: marketChartAnnotationLinksResponseSchema,
}) satisfies z.ZodType<MarketChartHotEventAnnotationResponse>

export const marketChartWarmEpisodeEventAnnotationResponseSchema = z.object({
  warmEpisodeEventId: z.number().int(),
  time: marketChartAnnotationDateTimeSchema,
  severity: z.string().nullable(),
  direction: z.enum(MARKET_CHART_ANNOTATION_DIRECTIONS).nullable(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  confidence: z.number().nullable(),
  relationType: z.enum(MARKET_CHART_WARM_EPISODE_RELATION_TYPES).nullable(),
  reaction: marketChartAnnotationReactionResponseSchema.nullable(),
}) satisfies z.ZodType<MarketChartWarmEpisodeEventAnnotationResponse>

export const marketChartWarmEpisodeAnnotationResponseSchema = z.object({
  warmEpisodeId: z.number().int(),
  periodStart: marketChartAnnotationDateTimeSchema,
  periodEnd: marketChartAnnotationDateTimeSchema,
  direction: z.enum(MARKET_CHART_ANNOTATION_DIRECTIONS).nullable(),
  summary: z.string().nullable(),
  outcome: marketChartAnnotationOutcomeResponseSchema.nullable(),
  events: z.array(marketChartWarmEpisodeEventAnnotationResponseSchema),
}) satisfies z.ZodType<MarketChartWarmEpisodeAnnotationResponse>

const marketChartAnnotationBaseSchema = {
  id: z.string(),
  assetId: z.number().int(),
  time: marketChartAnnotationDateTimeSchema,
}

export const marketChartAnnotationResponseSchema = z.discriminatedUnion(
  "annotationType",
  [
    z.object({
      ...marketChartAnnotationBaseSchema,
      annotationType: z.literal("HOT_EVENT"),
      hotEvent: marketChartHotEventAnnotationResponseSchema,
      warmEpisode: z.null(),
    }),
    z.object({
      ...marketChartAnnotationBaseSchema,
      annotationType: z.literal("WARM_EPISODE"),
      hotEvent: z.null(),
      warmEpisode: marketChartWarmEpisodeAnnotationResponseSchema,
    }),
  ]
) satisfies z.ZodType<MarketChartAnnotationResponse>

export const marketChartEconomicCalendarEventStatusSchema = z.enum([
  "PENDING",
  "AVAILABLE",
]) satisfies z.ZodType<MarketChartEconomicCalendarEventStatus>

export const marketChartEconomicCalendarEventResponseSchema = z.object({
  id: z.number().optional(),
  assetId: z.number().optional(),
  time: z.string().optional(),
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
  status: marketChartEconomicCalendarEventStatusSchema.optional(),
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
  "RECONNECTING",
  "SUBSCRIBED",
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
  message: z.string().nullable(),
  stale: z.boolean(),
  observedAt: z.string(),
}) satisfies z.ZodType<MarketChartLiveStatusResponse>

export const marketChartLiveQuoteResponseSchema = z.object({
  assetId: z.number(),
  symbol: z.string(),
  price: z.number(),
  receivedAt: z.string(),
  stale: z.boolean(),
}) satisfies z.ZodType<MarketChartLiveQuoteResponse>

export const marketChartLiveSnapshotResponseSchema = z.object({
  asset: marketChartAssetResponseSchema,
  symbol: z.string(),
  timeframe: z.enum(MARKET_CHART_TIMEFRAMES),
  quote: marketChartLiveQuoteResponseSchema.nullable(),
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
