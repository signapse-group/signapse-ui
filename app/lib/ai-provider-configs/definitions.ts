import * as z from "zod"

export const AI_PROVIDER_TYPES = [
  "DEEPSEEK",
  "GEMINI",
  "GROQ",
  "OPENAI",
  "ZAI",
] as const

export const SUPPORTED_AI_PROVIDER_TYPES = [
  "DEEPSEEK",
  "GEMINI",
  "OPENAI",
] as const

export const AI_PROVIDER_TASK_TYPES = [
  "NEWS_CONTENT_NORMALIZATION",
  "ECONOMIC_CALENDAR_DESCRIPTION_TRANSLATION",
  "NEWS_EVENT_EXTRACTION",
  "EVENT_ASSET_THEME_ENRICHMENT",
  "MARKET_REACTION_ANALYSIS",
  "MARKET_REACTION_SUMMARY",
  "EVENT_NARRATIVE_REFRESH",
  "WARM_ABSORPTION_DECISION",
  "MARKET_QUESTION_UNDERSTANDING",
  "MARKET_CONVERSATION_RESPONSE",
  "SCHEDULED_TELEGRAM_ANALYSIS",
] as const

export type AiProviderType = (typeof AI_PROVIDER_TYPES)[number]
export type SupportedAiProviderType =
  (typeof SUPPORTED_AI_PROVIDER_TYPES)[number]

const apiKeySchema = z.string().min(1).regex(/\S/)

export const aiProviderCredentialCreateRequestSchema = z
  .object({
    apiKey: apiKeySchema,
  })
  .strict()

export const aiProviderConfigCreateRequestSchema = z
  .object({
    providerType: z.enum(SUPPORTED_AI_PROVIDER_TYPES),
    description: z.string().nullable().optional(),
    baseUrl: z.string().nullable().optional(),
    credentials: z.array(aiProviderCredentialCreateRequestSchema).min(1),
  })
  .strict()

export type AiProviderCredentialCreateRequest = z.infer<
  typeof aiProviderCredentialCreateRequestSchema
>
export type AiProviderConfigCreateRequest = z.infer<
  typeof aiProviderConfigCreateRequestSchema
>

export const aiProviderConfigUpdateRequestSchema = z
  .object({
    description: z.string().optional(),
    baseUrl: z.string().nullable().optional(),
  })
  .strict()

export type AiProviderConfigUpdateRequest = z.infer<
  typeof aiProviderConfigUpdateRequestSchema
>

export const aiProviderCredentialUpdateRequestSchema = z
  .object({
    apiKey: apiKeySchema.optional(),
  })
  .strict()

export type AiProviderCredentialUpdateRequest = z.infer<
  typeof aiProviderCredentialUpdateRequestSchema
>

export const aiProviderCredentialResponseSchema = z
  .object({
    id: z.number().int(),
    keyPreview: z.string(),
    lastUsedDate: z.iso.datetime({ offset: true }).optional(),
    rateLimitedUntil: z.iso.datetime({ offset: true }).optional(),
    createdDate: z.iso.datetime({ offset: true }).optional(),
    lastModifiedDate: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()

export const aiTaskConfigurationReferenceSchema = z
  .object({
    task: z.enum(AI_PROVIDER_TASK_TYPES).optional(),
    model: z.string().optional(),
  })
  .strict()

export const aiProviderConfigResponseSchema = z
  .object({
    id: z.number().int(),
    providerType: z.enum(AI_PROVIDER_TYPES),
    description: z.string().optional(),
    baseUrl: z.string().optional(),
    defaultProvider: z.boolean(),
    credentials: z.array(aiProviderCredentialResponseSchema),
    taskReferences: z.array(aiTaskConfigurationReferenceSchema).optional(),
    createdDate: z.iso.datetime({ offset: true }).optional(),
    lastModifiedDate: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()

export const aiProviderConfigDetailResponseSchema =
  aiProviderConfigResponseSchema.extend({
    taskReferences: z.array(aiTaskConfigurationReferenceSchema),
  })

export type AiProviderCredentialResponse = z.infer<
  typeof aiProviderCredentialResponseSchema
>
export type AiTaskConfigurationReference = z.infer<
  typeof aiTaskConfigurationReferenceSchema
>
export type AiProviderConfigResponse = z.infer<
  typeof aiProviderConfigResponseSchema
>
export type AiProviderConfigListResponse = AiProviderConfigResponse
export type AiProviderConfigDetailResponse = z.infer<
  typeof aiProviderConfigDetailResponseSchema
>
const sortResponseSchema = z
  .object({
    sorted: z.boolean(),
    unsorted: z.boolean(),
    empty: z.boolean(),
  })
  .strict()

const pageableResponseSchema = z
  .object({
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    offset: z.number().int(),
    paged: z.boolean(),
    unpaged: z.boolean(),
    sort: sortResponseSchema,
  })
  .strict()

export const aiProviderConfigPageResponseSchema = z
  .object({
    content: z.array(aiProviderConfigResponseSchema),
    pageable: pageableResponseSchema,
    last: z.boolean(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    number: z.number().int().nonnegative(),
    first: z.boolean(),
    numberOfElements: z.number().int().nonnegative(),
    sort: sortResponseSchema,
    empty: z.boolean(),
  })
  .strict()

export const aiProviderModelCatalogRequestSchema = z
  .object({
    providerType: z.enum(SUPPORTED_AI_PROVIDER_TYPES),
    apiKey: apiKeySchema,
    baseUrl: z.string().nullable().optional(),
  })
  .strict()

export const aiProviderModelOptionResponseSchema = z
  .object({
    id: z.string(),
    label: z.string(),
  })
  .strict()

export const aiProviderModelCatalogResponseSchema = z
  .object({
    providerType: z.enum(SUPPORTED_AI_PROVIDER_TYPES),
    models: z.array(aiProviderModelOptionResponseSchema),
  })
  .strict()

export type AiProviderModelCatalogRequest = z.infer<
  typeof aiProviderModelCatalogRequestSchema
>
export type AiProviderModelOptionResponse = z.infer<
  typeof aiProviderModelOptionResponseSchema
>
export type AiProviderModelCatalogResponse = z.infer<
  typeof aiProviderModelCatalogResponseSchema
>
