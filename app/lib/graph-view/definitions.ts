import { z } from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export type GraphViewNodeKind = "event" | "asset" | "news-article" | "narrative"

export type GraphViewEdgeKind =
  "event-asset" | "news-article-event" | "narrative-event" | "narrative-asset"

export type GraphViewAssetType =
  "COMMODITY" | "CRYPTO" | "EQUITY" | "ETF" | "FX" | "INDEX"

export type GraphViewEventStatus =
  | "ENRICHMENT_PENDING"
  | "ENRICHED"
  | "ENRICHMENT_NO_MATCH"
  | "ENRICHMENT_FAILED"
  | "ARCHIVED"

export type GraphViewNarrativeStatus =
  "EMERGING" | "ACTIVE" | "WEAKENING" | "INVALIDATED" | "ARCHIVED"

export type GraphViewEdgeRelationType =
  | "PRIMARY_SUBJECT"
  | "AFFECTED_ASSET"
  | "REFERENCE_ASSET"
  | "PRIMARY"
  | "SUPPORTING"
  | "UPDATE"
  | "CONTRADICTING"
  | "DRIVER"
  | "AFFECTED"

export type GraphViewThemeRelationType = "PRIMARY_THEME" | "SECONDARY_THEME"

export interface GraphViewNodeThemeMetadata {
  title: string
  relationType: GraphViewThemeRelationType | null
}

export interface GraphViewNodeMetadata {
  slug: string | null
  canonicalKey: string | null
  symbol: string | null
  assetType: GraphViewAssetType | null
  sourceName: string | null
  url: string | null
  occurredAt: string | null
  publishedAt: string | null
  status: GraphViewEventStatus | null
  narrativeStatus: GraphViewNarrativeStatus | null
  confidence: number | null
  thesis: string | null
  themes: GraphViewNodeThemeMetadata[] | null
}

export interface GraphViewNode {
  id: string
  kind: GraphViewNodeKind
  label: string
  secondaryLabel: string | null
  metadata: GraphViewNodeMetadata
}

export interface GraphViewEdge {
  id: string
  kind: GraphViewEdgeKind
  sourceNodeId: string
  targetNodeId: string
  relationType: GraphViewEdgeRelationType
  weight: number | null
  confidence: number | null
  note: string | null
}

export interface GraphViewResponse {
  nodes: GraphViewNode[]
  edges: GraphViewEdge[]
}

export interface GraphViewEntityReference {
  kind: GraphViewNodeKind
  entityId: number
}

const graphViewNodeKindSchema = z.enum([
  "event",
  "asset",
  "news-article",
  "narrative",
])

const graphViewEdgeKindSchema = z.enum([
  "event-asset",
  "news-article-event",
  "narrative-event",
  "narrative-asset",
])

export const graphViewNodeThemeMetadataSchema = z.object({
  title: z.string(),
  relationType: z.enum(["PRIMARY_THEME", "SECONDARY_THEME"]).nullable(),
}) satisfies z.ZodType<GraphViewNodeThemeMetadata>

export const graphViewNodeMetadataSchema = z.object({
  slug: z.string().nullable(),
  canonicalKey: z.string().nullable(),
  symbol: z.string().nullable(),
  assetType: z
    .enum(["COMMODITY", "CRYPTO", "EQUITY", "ETF", "FX", "INDEX"])
    .nullable(),
  sourceName: z.string().nullable(),
  url: z.string().nullable(),
  occurredAt: z.iso.datetime({ offset: true }).nullable(),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  status: z
    .enum([
      "ENRICHMENT_PENDING",
      "ENRICHED",
      "ENRICHMENT_NO_MATCH",
      "ENRICHMENT_FAILED",
      "ARCHIVED",
    ])
    .nullable(),
  narrativeStatus: z
    .enum(["EMERGING", "ACTIVE", "WEAKENING", "INVALIDATED", "ARCHIVED"])
    .nullable(),
  confidence: z.number().nullable(),
  thesis: z.string().nullable(),
  themes: z.array(graphViewNodeThemeMetadataSchema).nullable(),
}) satisfies z.ZodType<GraphViewNodeMetadata>

export const graphViewNodeSchema = z.object({
  id: z.string().min(1),
  kind: graphViewNodeKindSchema,
  label: z.string().min(1),
  secondaryLabel: z.string().nullable(),
  metadata: graphViewNodeMetadataSchema,
}) satisfies z.ZodType<GraphViewNode>

export const graphViewEdgeSchema = z.object({
  id: z.string().min(1),
  kind: graphViewEdgeKindSchema,
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  relationType: z.enum([
    "PRIMARY_SUBJECT",
    "AFFECTED_ASSET",
    "REFERENCE_ASSET",
    "PRIMARY",
    "SUPPORTING",
    "UPDATE",
    "CONTRADICTING",
    "DRIVER",
    "AFFECTED",
  ]),
  weight: z.number().nullable(),
  confidence: z.number().nullable(),
  note: z.string().nullable(),
}) satisfies z.ZodType<GraphViewEdge>

export const graphViewResponseSchema = z.object({
  nodes: z.array(graphViewNodeSchema),
  edges: z.array(graphViewEdgeSchema),
}) satisfies z.ZodType<GraphViewResponse>

const graphNodeIdPattern = /^(event|asset|news-article|narrative):(\d+)$/

export function parseGraphViewNodeId(
  nodeId: string
): GraphViewEntityReference | null {
  const match = graphNodeIdPattern.exec(nodeId)

  if (!match) {
    return null
  }

  const [, kind, rawEntityId] = match
  const entityId = Number(rawEntityId)

  if (!Number.isInteger(entityId) || entityId <= 0) {
    return null
  }

  return {
    kind: kind as GraphViewNodeKind,
    entityId,
  }
}

export function getGraphViewNodeEntityId(
  nodeId: string,
  kind?: GraphViewNodeKind
): number | null {
  const parsed = parseGraphViewNodeId(nodeId)

  if (!parsed) {
    return null
  }

  if (kind && parsed.kind !== kind) {
    return null
  }

  return parsed.entityId
}

export function getGraphViewRelationLabel(
  relationType: GraphViewEdgeRelationType | GraphViewThemeRelationType,
  dictionary: Dictionary
): string {
  const relationLabels = dictionary.graphView.relationTypes as Record<
    string,
    string
  >
  return relationLabels[relationType] || relationType
}
