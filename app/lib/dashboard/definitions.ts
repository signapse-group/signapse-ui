import { z } from "zod"

import {
  narrativeAssetSummaryResponseSchema,
  type NarrativeAssetSummaryResponse,
} from "@/app/lib/narratives/definitions"

export const dashboardMetricStates = [
  "AVAILABLE",
  "EMPTY",
  "DENIED",
  "ERROR",
] as const

const dashboardMetricStateSchema = z.enum(dashboardMetricStates)
const dashboardTimeWindowResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
})

const dashboardMetricErrorCodeSchema = z.string().nullable()

export const dashboardNextKeyEventDataSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  currencyCode: z.string(),
  impact: z.string(),
  scheduledAt: z.string(),
})

export const dashboardNextKeyEventResponseSchema = z.object({
  state: dashboardMetricStateSchema,
  data: dashboardNextKeyEventDataSchema.nullable(),
  errorCode: dashboardMetricErrorCodeSchema,
})

export const dashboardCountMetricResponseSchema = z.object({
  state: dashboardMetricStateSchema,
  count: z.number().int().nullable(),
  window: dashboardTimeWindowResponseSchema.nullable(),
  errorCode: dashboardMetricErrorCodeSchema,
})

export const dashboardNarrativeMetricResponseSchema = z.object({
  state: dashboardMetricStateSchema,
  count: z.number().int().nullable(),
  statuses: z.array(z.string()),
  errorCode: dashboardMetricErrorCodeSchema,
})

const dashboardAssetTypeSchema = z.enum([
  "COMMODITY",
  "CRYPTO",
  "EQUITY",
  "ETF",
  "FX",
  "INDEX",
])

const dashboardEventThemeRelationTypeSchema = z.enum([
  "PRIMARY_THEME",
  "SECONDARY_THEME",
])

const dashboardEventAssetRelationTypeSchema = z.enum([
  "PRIMARY_SUBJECT",
  "AFFECTED_ASSET",
  "REFERENCE_ASSET",
])

export const dashboardRecentEventThemeSummarySchema = z.object({
  themeId: z.number().int().nullish(),
  themeTitle: z.string().nullish(),
  themeSlug: z.string().nullish(),
  relationType: dashboardEventThemeRelationTypeSchema.nullish(),
  weight: z.number().nullish(),
})

export const dashboardRecentEventAssetSummarySchema = z.object({
  assetId: z.number().int().nullish(),
  assetName: z.string().nullish(),
  assetSymbol: z.string().nullish(),
  assetType: dashboardAssetTypeSchema.nullish(),
  relationType: dashboardEventAssetRelationTypeSchema.nullish(),
  weight: z.number().nullish(),
})

export const dashboardRecentEventItemResponseSchema = z.object({
  id: z.number().int(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  occurredAt: z.string(),
  confidence: z.number().nullable(),
  themes: z.array(dashboardRecentEventThemeSummarySchema),
  affectedAssets: z.array(dashboardRecentEventAssetSummarySchema),
})

export const dashboardRecentEventsMetricResponseSchema = z.object({
  state: dashboardMetricStateSchema,
  items: z.array(dashboardRecentEventItemResponseSchema),
  errorCode: dashboardMetricErrorCodeSchema,
})

export const dashboardAssetFocusContextResponseSchema = z.object({
  title: z.string(),
  summary: z.string().nullable(),
  observedAt: z.string(),
})

export const dashboardAssetInFocusItemResponseSchema = z.object({
  assetId: z.number().int(),
  assetName: z.string(),
  assetSymbol: z.string(),
  assetType: dashboardAssetTypeSchema,
  context: dashboardAssetFocusContextResponseSchema,
})

export const dashboardAssetsInFocusMetricResponseSchema = z.object({
  state: dashboardMetricStateSchema,
  items: z.array(dashboardAssetInFocusItemResponseSchema).max(6),
  errorCode: dashboardMetricErrorCodeSchema,
})

export const dashboardMarketNarrativeStatuses = [
  "EMERGING",
  "WEAKENING",
  "ACTIVE",
] as const

const dashboardMarketNarrativeStatusSchema = z.enum(
  dashboardMarketNarrativeStatuses
)

export const dashboardMarketNarrativeThemeResponseSchema = z.object({
  themeId: z.number().int(),
  themeTitle: z.string().nullable(),
  themeSlug: z.string(),
})

export const dashboardMarketNarrativeItemResponseSchema = z.object({
  id: z.number().int(),
  title: z.string().nullable(),
  thesis: z.string().nullable(),
  status: dashboardMarketNarrativeStatusSchema,
  confidence: z.number().nullable(),
  lastUpdatedAt: z.string(),
  primaryTheme: dashboardMarketNarrativeThemeResponseSchema,
  assets: z.array(narrativeAssetSummaryResponseSchema),
})

export const dashboardMarketNarrativesMetricResponseSchema = z.object({
  state: dashboardMetricStateSchema,
  items: z.array(dashboardMarketNarrativeItemResponseSchema).max(3),
  errorCode: dashboardMetricErrorCodeSchema,
})

export const dashboardSummaryScopeResponseSchema = z.object({
  workspaceId: z.number().int(),
  watchlistAssetCount: z.number().int().nullable(),
})

export const dashboardSummaryResponseSchema = z.object({
  asOf: z.string(),
  timezone: z.string(),
  scope: dashboardSummaryScopeResponseSchema,
  nextKeyEvent: dashboardNextKeyEventResponseSchema,
  recentEvents: dashboardRecentEventsMetricResponseSchema,
  marketEvents24h: dashboardCountMetricResponseSchema,
  activeNarratives: dashboardNarrativeMetricResponseSchema,
  marketNarratives: dashboardMarketNarrativesMetricResponseSchema,
  latestNews6h: dashboardCountMetricResponseSchema,
  assetsInFocus: dashboardAssetsInFocusMetricResponseSchema,
})

export type DashboardMetricState = z.infer<typeof dashboardMetricStateSchema>
export type DashboardNextKeyEventData = z.infer<
  typeof dashboardNextKeyEventDataSchema
>
export type DashboardNextKeyEventResponse = z.infer<
  typeof dashboardNextKeyEventResponseSchema
>
export type DashboardCountMetricResponse = z.infer<
  typeof dashboardCountMetricResponseSchema
>
export type DashboardNarrativeMetricResponse = z.infer<
  typeof dashboardNarrativeMetricResponseSchema
>
export type DashboardRecentEventThemeSummary = z.infer<
  typeof dashboardRecentEventThemeSummarySchema
>
export type DashboardRecentEventAssetSummary = z.infer<
  typeof dashboardRecentEventAssetSummarySchema
>
export type DashboardRecentEventItemResponse = z.infer<
  typeof dashboardRecentEventItemResponseSchema
>
export type DashboardRecentEventsMetricResponse = z.infer<
  typeof dashboardRecentEventsMetricResponseSchema
>
export type DashboardAssetFocusContextResponse = z.infer<
  typeof dashboardAssetFocusContextResponseSchema
>
export type DashboardAssetInFocusItemResponse = z.infer<
  typeof dashboardAssetInFocusItemResponseSchema
>
export type DashboardAssetsInFocusMetricResponse = z.infer<
  typeof dashboardAssetsInFocusMetricResponseSchema
>
export type DashboardMarketNarrativeThemeResponse = z.infer<
  typeof dashboardMarketNarrativeThemeResponseSchema
>
export type DashboardMarketNarrativeItemResponse = z.infer<
  typeof dashboardMarketNarrativeItemResponseSchema
>
export type DashboardMarketNarrativesMetricResponse = z.infer<
  typeof dashboardMarketNarrativesMetricResponseSchema
>
export type { NarrativeAssetSummaryResponse }
export type DashboardSummaryScopeResponse = z.infer<
  typeof dashboardSummaryScopeResponseSchema
>
export type DashboardSummaryResponse = z.infer<
  typeof dashboardSummaryResponseSchema
>
