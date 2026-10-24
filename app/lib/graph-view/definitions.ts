import { z } from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export type GraphViewNodeKind = "event" | "asset" | "news-article" | "narrative"

export type GraphViewEdgeKind =
  "event-asset" | "news-article-event" | "narrative-event" | "narrative-asset"

export interface GraphViewNodeThemeMetadata {
  title?: string | null
  relationType?: string | null
}

export interface GraphViewNodeMetadata {
  slug?: string | null
  canonicalKey?: string | null
  symbol?: string | null
  assetType?: string | null
  sourceName?: string | null
  url?: string | null
  occurredAt?: string | null
  publishedAt?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  status?: string | null
  knowledgeLayer?: string | null
  narrativeStatus?: string | null
  active?: boolean | null
  confidence?: number | null
  thesis?: string | null
  themes?: GraphViewNodeThemeMetadata[] | null
}

export interface GraphViewNode {
  id: string
  kind: GraphViewNodeKind
  label: string
  secondaryLabel?: string | null
  metadata?: GraphViewNodeMetadata
}

export interface GraphViewEdge {
  id: string
  kind: GraphViewEdgeKind
  sourceNodeId: string
  targetNodeId: string
  relationType: string
  weight?: number | null
  confidence?: number | null
  note?: string | null
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
  title: z.string().nullish(),
  relationType: z.string().nullish(),
}) satisfies z.ZodType<GraphViewNodeThemeMetadata>

export const graphViewNodeMetadataSchema = z.object({
  slug: z.string().nullish(),
  canonicalKey: z.string().nullish(),
  symbol: z.string().nullish(),
  assetType: z.string().nullish(),
  sourceName: z.string().nullish(),
  url: z.string().nullish(),
  occurredAt: z.string().nullish(),
  publishedAt: z.string().nullish(),
  periodStart: z.string().nullish(),
  periodEnd: z.string().nullish(),
  status: z.string().nullish(),
  knowledgeLayer: z.string().nullish(),
  narrativeStatus: z.string().nullish(),
  active: z.boolean().nullish(),
  confidence: z.number().nullish(),
  thesis: z.string().nullish(),
  themes: z.array(graphViewNodeThemeMetadataSchema).nullish(),
}) satisfies z.ZodType<GraphViewNodeMetadata>

export const graphViewNodeSchema = z.object({
  id: z.string().min(1),
  kind: graphViewNodeKindSchema,
  label: z.string().min(1),
  secondaryLabel: z.string().nullish(),
  metadata: graphViewNodeMetadataSchema.optional(),
}) satisfies z.ZodType<GraphViewNode>

export const graphViewEdgeSchema = z.object({
  id: z.string().min(1),
  kind: graphViewEdgeKindSchema,
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  relationType: z.string().min(1),
  weight: z.number().nullish(),
  confidence: z.number().nullish(),
  note: z.string().nullish(),
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
  relationType: string,
  dictionary: Dictionary
): string {
  const relationLabels = dictionary.graphView.relationTypes as Record<
    string,
    string
  >
  return relationLabels[relationType] || relationType
}
