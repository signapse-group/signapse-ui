export type EventStatus =
  | "ENRICHMENT_PENDING"
  | "ENRICHED"
  | "ENRICHMENT_NO_MATCH"
  | "ENRICHMENT_FAILED"
  | "ARCHIVED"

export type EventEnrichmentStatus =
  "PENDING" | "SUCCESS" | "NO_MATCH" | "FAILED"

export type EventAssetType =
  "COMMODITY" | "CRYPTO" | "EQUITY" | "ETF" | "FX" | "INDEX"

export type EventMarketReactionDirection =
  "BULLISH" | "BEARISH" | "MIXED" | "NEUTRAL"

export type EventMarketReactionTimeHorizon =
  "INTRADAY" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM"

export type EventAssetRelationType =
  "PRIMARY_SUBJECT" | "AFFECTED_ASSET" | "REFERENCE_ASSET"

export type EventThemeRelationType = "PRIMARY_THEME" | "SECONDARY_THEME"

export type EventEvidenceRole =
  "PRIMARY" | "SUPPORTING" | "UPDATE" | "CONTRADICTING"

export type EventEnrichmentOutcome = EventStatus

export interface EventListResponse {
  id: number
  title: string
  canonicalKey?: string
  description?: string
  status: EventStatus
  confidence?: number
  occurredAt?: string
  createdDate: string
  lastModifiedDate?: string
}

export interface EventAssetSummaryResponse {
  assetId: number
  assetName: string
  assetSymbol: string
  assetType: EventAssetType
  relationType: EventAssetRelationType
  weight: number | null
}

export interface EventThemeSummaryResponse {
  themeId: number
  themeTitle: string | null
  themeSlug: string
  relationType: EventThemeRelationType
  weight: number | null
}

export interface EventEvidenceSummaryResponse {
  newsArticleId?: number
  newsArticleTitle?: string
  newsArticleUrl?: string
  sourceName?: string
  publishedAt?: string | null
  evidenceRole?: EventEvidenceRole
  confidence?: number
  evidenceNote?: string
}

export interface EventMarketReactionSummaryResponse {
  id: number
  assetId: number
  assetName: string
  assetSymbol: string
  assetType: EventAssetType
  direction: EventMarketReactionDirection
  timeHorizon: EventMarketReactionTimeHorizon
  confidence: number | null
  reasoning: string | null
  observedAt: string | null
}

export interface EventResponse extends EventListResponse {
  assets: EventAssetSummaryResponse[]
  themes: EventThemeSummaryResponse[]
  evidence: EventEvidenceSummaryResponse[]
  marketReactions: EventMarketReactionSummaryResponse[]
}

export interface EventEnrichmentResult {
  eventId?: number
  eventTitle?: string
  eventCanonicalKey?: string
  outcome: EventEnrichmentOutcome
  assetLinkCount?: number
  themeLinkCount?: number
  message?: string
}

export interface PendingEventEnrichmentBatchResult {
  requestedBatchSize?: number
  selectedCount?: number
  processedCount?: number
  skippedCount?: number
  deferredCount?: number
  enrichedCount?: number
  noMatchCount?: number
  failedCount?: number
  results?: EventEnrichmentResult[]
}

export interface EventMarketReactionDerivationResult {
  eventId?: number
  eventTitle?: string
  eventCanonicalKey?: string
  reactionCount?: number
  neutralCount?: number
  message?: string
}

export interface PendingEventMarketReactionDerivationBatchResult {
  requestedBatchSize?: number
  selectedCount?: number
  processedCount?: number
  skippedCount?: number
  derivedCount?: number
  neutralCount?: number
  failedCount?: number
  results?: EventMarketReactionDerivationResult[]
}
