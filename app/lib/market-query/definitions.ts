import { z } from "zod"

import {
  artifactTypes,
  type ArtifactType,
} from "@/app/lib/artifacts/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export type MarketQueryEvidenceRole =
  | "PRIMARY"
  | "SUPPORTING"
  | "UPDATE"
  | "CONTRADICTING"
  | "CONTEXT"

export interface MarketQueryRequest {
  question: string
  asOfTime?: string | null
}

export interface MarketQueryEvidenceResponse {
  eventId?: number
  eventTitle?: string
  newsArticleId?: number
  newsArticleTitle?: string
  newsArticleUrl?: string
  sourceName?: string
  publishedAt?: string | null
  artifactType?: ArtifactType
  evidenceRole?: MarketQueryEvidenceRole
  evidenceConfidence?: number
  evidenceNote?: string
}

export interface MarketQueryKeyEventResponse {
  id?: number
  title?: string
  description?: string
  occurredAt?: string | null
  confidence?: number
  assetSymbols?: string[]
  themeSlugs?: string[]
}

export interface MarketQueryKeyNarrativeResponse {
  id?: number
  title?: string
  thesis?: string
  status?: string
  confidence?: number
  primaryAssetSymbol?: string
  primaryThemeSlug?: string
  supportingEventIds?: number[]
}

export interface MarketQueryResponse {
  answer?: string
  reasoningChain?: string[]
  keyEvents?: MarketQueryKeyEventResponse[]
  keyNarratives?: MarketQueryKeyNarrativeResponse[]
  assetsConsidered?: string[]
  confidence?: number
  limitations?: string[]
  evidence?: MarketQueryEvidenceResponse[]
}

export type MarketChatMessageRole = "USER" | "ASSISTANT"
export type MarketChatMessageStatus = "COMPLETED" | "FAILED"

export interface CreateMarketConversationRequest {
  title: string
}

export interface MarketConversationSummaryResponse {
  id: number
  title: string
  workspaceId: number
  createdDate: string
  lastModifiedDate: string
}

export interface MarketChatMessageResponse {
  id: number
  role: MarketChatMessageRole
  status: MarketChatMessageStatus
  content: string | null
  failureReason: string | null
  createdDate: string
}

export interface MarketConversationDetailResponse extends MarketConversationSummaryResponse {
  messages: MarketChatMessageResponse[]
}

export interface MarketConversationMessagePageResponse {
  content: MarketChatMessageResponse[]
  hasMore: boolean
  nextBeforeMessageId?: number | null
}

export interface SubmitMarketConversationMessageRequest {
  message: string
}

export interface SubmitMarketConversationMessageResponse {
  userMessage: MarketChatMessageResponse
  assistantMessage: MarketChatMessageResponse
}

export function getMarketQueryRequestSchema(dictionary: Dictionary) {
  return z.object({
    question: z.string().trim().min(1, dictionary.marketQuery.questionRequired),
    asOfTime: z.string().datetime().nullish(),
  }) satisfies z.ZodType<MarketQueryRequest>
}

export const marketQueryEvidenceResponseSchema = z.object({
  eventId: z.number().int().optional(),
  eventTitle: z.string().optional(),
  newsArticleId: z.number().int().optional(),
  newsArticleTitle: z.string().optional(),
  newsArticleUrl: z.string().optional(),
  sourceName: z.string().optional(),
  publishedAt: z.string().nullish(),
  artifactType: z.enum(artifactTypes).optional(),
  evidenceRole: z
    .enum(["PRIMARY", "SUPPORTING", "UPDATE", "CONTRADICTING", "CONTEXT"])
    .optional(),
  evidenceConfidence: z.number().optional(),
  evidenceNote: z.string().optional(),
}) satisfies z.ZodType<MarketQueryEvidenceResponse>

export const marketQueryKeyEventResponseSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  occurredAt: z.string().nullish(),
  confidence: z.number().optional(),
  assetSymbols: z.array(z.string()).optional(),
  themeSlugs: z.array(z.string()).optional(),
}) satisfies z.ZodType<MarketQueryKeyEventResponse>

export const marketQueryKeyNarrativeResponseSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().optional(),
  thesis: z.string().optional(),
  status: z.string().optional(),
  confidence: z.number().optional(),
  primaryAssetSymbol: z.string().optional(),
  primaryThemeSlug: z.string().optional(),
  supportingEventIds: z.array(z.number().int()).optional(),
}) satisfies z.ZodType<MarketQueryKeyNarrativeResponse>

export const marketQueryResponseSchema = z.object({
  answer: z.string().optional(),
  reasoningChain: z.array(z.string()).optional(),
  keyEvents: z.array(marketQueryKeyEventResponseSchema).optional(),
  keyNarratives: z.array(marketQueryKeyNarrativeResponseSchema).optional(),
  assetsConsidered: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  limitations: z.array(z.string()).optional(),
  evidence: z.array(marketQueryEvidenceResponseSchema).optional(),
}) satisfies z.ZodType<MarketQueryResponse>

const nullableStringSchema = z.string().nullable()
const nullableNumberSchema = z.number().int().nullable()

export function getCreateMarketConversationSchema(dictionary: Dictionary) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, dictionary.marketConversations.titleRequired),
  }) satisfies z.ZodType<CreateMarketConversationRequest>
}

export function getSubmitMarketConversationMessageSchema(
  dictionary: Dictionary
) {
  return z.object({
    message: z
      .string()
      .trim()
      .min(1, dictionary.marketConversations.messageRequired),
  }) satisfies z.ZodType<SubmitMarketConversationMessageRequest>
}

export function getSubmitMarketConversationIdempotencyKeySchema(
  dictionary: Dictionary
) {
  return (
    z
      .string()
      .trim()
      .min(1, dictionary.marketConversations.idempotencyKeyInvalid)
      .max(255, dictionary.marketConversations.idempotencyKeyInvalid)
  ) satisfies z.ZodType<string>
}

export const marketChatMessageResponseSchema = z.object({
  id: z.number().int(),
  role: z.enum(["USER", "ASSISTANT"]),
  status: z.enum(["COMPLETED", "FAILED"]),
  content: nullableStringSchema,
  failureReason: nullableStringSchema,
  createdDate: z.string(),
}) satisfies z.ZodType<MarketChatMessageResponse>

export const marketConversationSummaryResponseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  workspaceId: z.number().int(),
  createdDate: z.string(),
  lastModifiedDate: z.string(),
}) satisfies z.ZodType<MarketConversationSummaryResponse>

export const marketConversationDetailResponseSchema =
  marketConversationSummaryResponseSchema.extend({
    messages: z.array(marketChatMessageResponseSchema),
  }) satisfies z.ZodType<MarketConversationDetailResponse>

export const marketConversationMessagePageResponseSchema = z
  .object({
    content: z.array(marketChatMessageResponseSchema),
    hasMore: z.boolean(),
    nextBeforeMessageId: nullableNumberSchema.optional(),
  })
  .superRefine((page, context) => {
    if (page.hasMore && page.nextBeforeMessageId == null) {
      context.addIssue({
        code: "custom",
        path: ["nextBeforeMessageId"],
        message: "A next cursor is required when more messages are available.",
      })
    }
  }) satisfies z.ZodType<MarketConversationMessagePageResponse>

export const submitMarketConversationMessageResponseSchema = z.object({
  userMessage: marketChatMessageResponseSchema,
  assistantMessage: marketChatMessageResponseSchema,
}) satisfies z.ZodType<SubmitMarketConversationMessageResponse>

export const pageMarketConversationSummaryResponseSchema = z.object({
  content: z.array(marketConversationSummaryResponseSchema),
  pageable: z.object({
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    offset: z.number().int(),
    paged: z.boolean(),
    unpaged: z.boolean(),
  }),
  last: z.boolean(),
  totalElements: z.number().int(),
  totalPages: z.number().int(),
  size: z.number().int(),
  number: z.number().int(),
  first: z.boolean(),
  numberOfElements: z.number().int(),
  empty: z.boolean(),
})

export function deriveMarketConversationTitle(
  question: string,
  maxLength = 80
): string {
  const normalized = question.trim().replace(/\s+/g, " ")

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(1, maxLength - 3)).trimEnd()}...`
}

export function normalizeMarketConversationMessages(
  messages: readonly MarketChatMessageResponse[]
): MarketChatMessageResponse[] {
  return [...messages].sort((left, right) => left.id - right.id)
}

export function reconcileMarketConversationMessages(
  current: readonly MarketChatMessageResponse[],
  incoming: readonly MarketChatMessageResponse[]
): MarketChatMessageResponse[] {
  const messagesById = new Map(
    current.map((message) => [message.id, message] as const)
  )

  for (const message of incoming) {
    messagesById.set(message.id, message)
  }

  return normalizeMarketConversationMessages([...messagesById.values()])
}

export function getMarketQueryArtifactTypeLabels(
  dictionary: Dictionary
): Record<ArtifactType, string> {
  return dictionary.marketQuery.artifactTypes
}

export function getMarketQueryEvidenceRoleLabels(
  dictionary: Dictionary
): Record<MarketQueryEvidenceRole, string> {
  return dictionary.marketQuery.evidenceRoles
}
