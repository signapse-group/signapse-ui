import { z } from "zod"

import type { EventStatus } from "@/app/lib/events/definitions"

export const NEWS_ARTICLE_STATUSES = [
  "INGESTED",
  "DERIVATION_PENDING",
  "EVENT_RESOLVED",
  "NO_PRIMARY_EVENT",
  "CONTENT_FAILED",
  "DERIVATION_FAILED",
] as const

const newsArticleStatusSchema = z.enum(NEWS_ARTICLE_STATUSES)

export type NewsArticleStatus = z.infer<typeof newsArticleStatusSchema>

export type NewsPrimaryEventDerivationChangeType =
  "CREATED" | "UPDATED" | "NONE"

export type LinkedEventStatus = EventStatus

const linkedEventStatusSchema = z.enum([
  "ENRICHMENT_PENDING",
  "ENRICHED",
  "ENRICHMENT_NO_MATCH",
  "ENRICHMENT_FAILED",
  "ARCHIVED",
])

const linkedEventEvidenceRoleSchema = z.enum([
  "PRIMARY",
  "SUPPORTING",
  "UPDATE",
  "CONTRADICTING",
])

export type LinkedEventEvidenceRole = z.infer<
  typeof linkedEventEvidenceRoleSchema
>

export interface MediaResponse {
  id?: number
  name?: string
  altText?: string
  urlOriginal?: string
  urlLarge?: string
  urlMedium?: string
  urlThumbnail?: string
  size?: number
}

export interface MediaReferenceRequest {
  mediaId: number
}

export interface NewsArticleListResponse {
  id?: number
  title: string | null
  description: string | null
  url?: string
  featureImage: MediaResponse | null
  sourceName?: string
  publishedAt: string | null
  status?: NewsArticleStatus
  createdDate?: string
}

export interface LinkedEventSummaryResponse {
  eventId?: number
  eventTitle?: string
  eventCanonicalKey?: string
  eventStatus?: LinkedEventStatus
  evidenceRole?: LinkedEventEvidenceRole
  evidenceConfidence?: number
  evidenceNote?: string
}

const mediaResponseSchema = z
  .object({
    id: z.number().int().optional(),
    name: z.string().optional(),
    altText: z.string().optional(),
    urlOriginal: z.string().optional(),
    urlLarge: z.string().optional(),
    urlMedium: z.string().optional(),
    urlThumbnail: z.string().optional(),
    size: z.number().int().optional(),
  })
  .passthrough()

const linkedEventSummaryResponseSchema = z
  .object({
    eventId: z.number().int().optional(),
    eventTitle: z.string().optional(),
    eventCanonicalKey: z.string().optional(),
    eventStatus: linkedEventStatusSchema.optional(),
    evidenceRole: linkedEventEvidenceRoleSchema.optional(),
    evidenceConfidence: z.number().optional(),
    evidenceNote: z.string().optional(),
  })
  .passthrough()

export const newsArticleResponseSchema = z
  .object({
    createdDate: z.iso.datetime({ offset: true }).optional(),
    lastModifiedDate: z.iso.datetime({ offset: true }).optional(),
    id: z.number().int().optional(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    content: z.string().nullable(),
    url: z.string().optional(),
    featureImage: mediaResponseSchema.nullable(),
    sourceName: z.string().optional(),
    publishedAt: z.iso.datetime({ offset: true }).nullable(),
    status: newsArticleStatusSchema.optional(),
    linkedEvents: z.array(linkedEventSummaryResponseSchema).optional(),
  })
  .passthrough()

export interface NewsArticleResponse extends Omit<
  NewsArticleListResponse,
  "id"
> {
  id: number
  content: string | null
  linkedEvents?: LinkedEventSummaryResponse[]
  lastModifiedDate?: string
}

export interface NewsPrimaryEventDerivationResult {
  newsArticleId?: number
  newsArticleTitle?: string
  status?: NewsArticleStatus
  changeType?: NewsPrimaryEventDerivationChangeType
  eventId?: number
  eventCanonicalKey?: string
  message?: string
}

export interface PendingNewsEventDerivationBatchResult {
  requestedBatchSize?: number
  selectedCount?: number
  processedCount?: number
  skippedCount?: number
  createdCount?: number
  updatedCount?: number
  noEventCount?: number
  failedCount?: number
  results?: NewsPrimaryEventDerivationResult[]
}
