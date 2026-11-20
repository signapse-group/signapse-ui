import type { CSSProperties } from "react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatMessage } from "@/app/lib/i18n/messages"
import {
  EventEnrichmentResult,
  EventEnrichmentStatus,
  EventMarketReactionDerivationResult,
  EventMarketReactionDirection,
  EventMarketReactionTimeHorizon,
  EventAssetSummaryResponse,
  EventAssetRelationType,
  EventStatus,
  PendingEventMarketReactionDerivationBatchResult,
  PendingEventEnrichmentBatchResult,
} from "@/app/lib/events/definitions"

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "info"
  | "warning"
  | "active"

export function selectQuickEventAssets(
  assets: readonly EventAssetSummaryResponse[] | null | undefined,
  watchlistAssetIds: readonly number[] = []
) {
  const seenAssetIds = new Set<number>()
  const uniqueAssets = (assets ?? []).filter((asset) => {
    if (seenAssetIds.has(asset.assetId)) {
      return false
    }

    seenAssetIds.add(asset.assetId)
    return true
  })

  if (watchlistAssetIds.length === 0) {
    return uniqueAssets.slice(0, 4)
  }

  const watchlist = new Set(watchlistAssetIds)
  const watchlistAssets = uniqueAssets.filter((asset) =>
    watchlist.has(asset.assetId)
  )

  if (watchlistAssets.length === 0) {
    return uniqueAssets.slice(0, 4)
  }

  const otherAssets = uniqueAssets.filter(
    (asset) => !watchlist.has(asset.assetId)
  )

  return [...watchlistAssets, ...otherAssets].slice(0, 4)
}

export function getEventStatusLabel(
  status: EventStatus | undefined,
  dictionary: Dictionary
) {
  if (!status) {
    return dictionary.common.notAvailable
  }

  return dictionary.events.statusLabels[status]
}

export function getEventStatusVariant(status?: string): BadgeVariant {
  switch (status) {
    case "ENRICHED":
      return "default"
    case "ENRICHMENT_PENDING":
      return "secondary"
    case "ENRICHMENT_FAILED":
      return "destructive"
    case "ENRICHMENT_NO_MATCH":
    case "ARCHIVED":
    default:
      return "outline"
  }
}

export function getEventAssetRelationVariant(
  relationType: EventAssetRelationType
): Exclude<BadgeVariant, "default" | "destructive"> {
  switch (relationType) {
    case "PRIMARY_SUBJECT":
      return "info"
    case "AFFECTED_ASSET":
      return "secondary"
    case "REFERENCE_ASSET":
      return "outline"
  }
}

export function getEventEnrichmentLabel(
  status: EventEnrichmentStatus | undefined,
  dictionary: Dictionary
) {
  if (!status) {
    return dictionary.events.enrich
  }

  return dictionary.events.enrichmentLabels[status]
}

export function getEventEnrichmentVariant(
  status?: EventEnrichmentStatus
): Exclude<BadgeVariant, "default"> {
  if (status === "FAILED") {
    return "destructive"
  }

  if (status === "SUCCESS") {
    return "secondary"
  }

  return "outline"
}

export function isEventEnrichmentFailure(result: EventEnrichmentResult) {
  return result.outcome === "ENRICHMENT_FAILED"
}

export function buildEventEnrichmentSummary(
  result: EventEnrichmentResult,
  dictionary: Dictionary,
  formatNumberValue: (value: number) => string = String
) {
  const parts: string[] = []
  const summary = dictionary.events.enrichmentSummary

  switch (result.outcome) {
    case "ENRICHED":
      parts.push(summary.enriched)
      break
    case "ENRICHMENT_NO_MATCH":
      parts.push(summary.noMatch)
      break
    case "ENRICHMENT_PENDING":
      parts.push(summary.pending)
      break
    case "ENRICHMENT_FAILED":
      parts.push(summary.failed)
      break
    case "ARCHIVED":
      parts.push(summary.archived)
      break
  }

  if (
    typeof result.assetLinkCount === "number" ||
    typeof result.themeLinkCount === "number"
  ) {
    parts.push(
      formatMessage(summary.counts, {
        assets: formatNumberValue(result.assetLinkCount ?? 0),
        themes: formatNumberValue(result.themeLinkCount ?? 0),
      })
    )
  }

  if (result.message?.trim()) {
    parts.push(result.message.trim())
  }

  return parts.join(" ")
}

export function hasOnlyFailedPendingEventEnrichment(
  result: PendingEventEnrichmentBatchResult
) {
  return (
    (result.failedCount ?? 0) > 0 &&
    (result.enrichedCount ?? 0) === 0 &&
    (result.noMatchCount ?? 0) === 0 &&
    (result.deferredCount ?? 0) === 0
  )
}

export function buildPendingEventEnrichmentSummary(
  result: PendingEventEnrichmentBatchResult,
  dictionary: Dictionary,
  formatNumberValue: (value: number) => string = String
) {
  const selectedCount = result.selectedCount ?? 0

  if (selectedCount === 0) {
    return dictionary.events.enrichmentSummary.noPending
  }

  return formatMessage(dictionary.events.enrichmentSummary.batch, {
    processed: formatNumberValue(result.processedCount ?? 0),
    selected: formatNumberValue(selectedCount),
    enriched: formatNumberValue(result.enrichedCount ?? 0),
    noMatch: formatNumberValue(result.noMatchCount ?? 0),
    skipped: formatNumberValue(result.skippedCount ?? 0),
    deferred: formatNumberValue(result.deferredCount ?? 0),
    failed: formatNumberValue(result.failedCount ?? 0),
  })
}

export function getEventMarketReactionDirectionLabel(
  direction: EventMarketReactionDirection,
  dictionary: Dictionary
) {
  return dictionary.events.marketDirectionLabels[direction]
}

export function getEventMarketReactionDirectionVariant(
  direction: EventMarketReactionDirection
): BadgeVariant {
  switch (direction) {
    case "BULLISH":
      return "secondary"
    case "BEARISH":
      return "destructive"
    case "MIXED":
      return "warning"
    case "NEUTRAL":
      return "secondary"
  }
}

export function getEventMarketReactionDirectionStyle(
  direction: EventMarketReactionDirection
): CSSProperties | undefined {
  if (direction !== "BULLISH") {
    return undefined
  }

  return {
    backgroundColor: "var(--market-reaction-bullish-bg)",
    color: "var(--market-reaction-bullish-fg)",
  }
}

export function getEventMarketReactionTimeHorizonLabel(
  timeHorizon: EventMarketReactionTimeHorizon,
  dictionary: Dictionary
) {
  return dictionary.events.marketTimeHorizonLabels[timeHorizon]
}

export function buildEventMarketReactionDerivationSummary(
  result: EventMarketReactionDerivationResult,
  dictionary: Dictionary,
  formatNumberValue: (value: number) => string = String
) {
  const message = result.message?.trim()

  return [
    formatMessage(dictionary.events.marketReactionSummary.derived, {
      reactions: formatNumberValue(result.reactionCount ?? 0),
      neutral: formatNumberValue(result.neutralCount ?? 0),
    }),
    message,
  ]
    .filter(Boolean)
    .join(" ")
}

export function hasOnlyFailedPendingEventMarketReactionDerivation(
  result: PendingEventMarketReactionDerivationBatchResult
) {
  return (
    (result.failedCount ?? 0) > 0 &&
    (result.derivedCount ?? 0) === 0 &&
    (result.neutralCount ?? 0) === 0
  )
}

export function buildPendingEventMarketReactionDerivationSummary(
  result: PendingEventMarketReactionDerivationBatchResult,
  dictionary: Dictionary,
  formatNumberValue: (value: number) => string = String
) {
  const selectedCount = result.selectedCount ?? 0

  if (selectedCount === 0) {
    return dictionary.events.marketReactionSummary.noPending
  }

  return formatMessage(dictionary.events.marketReactionSummary.batch, {
    processed: formatNumberValue(result.processedCount ?? 0),
    selected: formatNumberValue(selectedCount),
    derived: formatNumberValue(result.derivedCount ?? 0),
    neutral: formatNumberValue(result.neutralCount ?? 0),
    skipped: formatNumberValue(result.skippedCount ?? 0),
    failed: formatNumberValue(result.failedCount ?? 0),
  })
}
