import { z } from "zod"

import {
  AI_PROVIDER_TYPES,
  type AiProviderType,
} from "@/app/lib/ai-provider-configs/definitions"

export const AI_TASK_MODEL_CATALOG_PROVIDER_TYPES = [
  "DEEPSEEK",
  "GEMINI",
  "OPENAI",
] as const

export type AiTaskModelCatalogProviderType =
  (typeof AI_TASK_MODEL_CATALOG_PROVIDER_TYPES)[number]

export function isAiTaskModelCatalogProviderType(
  providerType: AiProviderType
): providerType is AiTaskModelCatalogProviderType {
  return AI_TASK_MODEL_CATALOG_PROVIDER_TYPES.some(
    (supportedType) => supportedType === providerType
  )
}

export const AI_TASK_TYPES = [
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

export type AiTaskType = (typeof AI_TASK_TYPES)[number]

export const AI_TASK_PROMPT_REFERENCE_TYPES = [
  "FIRECRAWL_SOURCE_DOCUMENT_FILTER",
  "ECONOMIC_CALENDAR_ENTRY_TEXT_LOCALIZATION",
  "NEWS_ARTICLE_CONTENT_LOCALIZATION",
  "NEWS_PRIMARY_EVENT_DERIVATION",
  "EVENT_ASSET_THEME_ENRICHMENT",
  "EVENT_MARKET_REACTION_DERIVATION",
  "MARKET_REACTION_OUTCOME_SUMMARY",
  "WARM_ABSORPTION_EVENT_ASSET_DECISION",
  "EVENT_NARRATIVE_REFRESH",
  "MARKET_QUESTION_UNDERSTANDING",
  "MARKET_QUERY_CONVERSATION_ORCHESTRATION",
  "TELEGRAM_MARKET_ANALYSIS",
  "TELEGRAM_MARKET_ANALYSIS_TEXT_PATCH",
  "TELEGRAM_MARKET_ANALYSIS_ASSESSMENT",
  "TELEGRAM_MARKET_ANALYSIS_SCALPING",
  "TELEGRAM_MARKET_ANALYSIS_EXPLANATION",
] as const

export type AiTaskPromptReferenceType =
  (typeof AI_TASK_PROMPT_REFERENCE_TYPES)[number]

export const AI_TASK_CONFIGURATION_READ_PERMISSION =
  "ai-task-configuration:read" as const
export const AI_TASK_CONFIGURATION_UPDATE_PERMISSION =
  "ai-task-configuration:update" as const
export const AI_TASK_PROVIDER_READ_PERMISSION =
  "ai-provider-config:read" as const
export const AI_TASK_MODEL_CATALOG_PERMISSION =
  "ai-provider-config:model-catalog" as const

const positiveInt32Schema = z.number().int().positive().max(2_147_483_647)

export const AiTaskConfigurationSchema = z
  .object({
    task: z.enum(AI_TASK_TYPES),
    feature: z.string().min(1),
    purpose: z.string(),
    defaultOutputTokens: positiveInt32Schema.nullable(),
    promptTypes: z.array(z.enum(AI_TASK_PROMPT_REFERENCE_TYPES)),
    configured: z.boolean(),
    selectedConnectionId: z.number().int().positive().nullable(),
    selectedProviderType: z.enum(AI_PROVIDER_TYPES).nullable(),
    selectedModel: z.string().min(1).nullable(),
    customOutputTokens: positiveInt32Schema.nullable(),
    effectiveOutputTokens: positiveInt32Schema.nullable(),
  })
  .superRefine((configuration, context) => {
    const hasCompleteSelection =
      configuration.selectedConnectionId !== null &&
      configuration.selectedProviderType !== null &&
      configuration.selectedModel !== null

    if (configuration.configured !== hasCompleteSelection) {
      context.addIssue({
        code: "custom",
        message:
          "Configured state must match the explicit connection and model selection.",
        path: ["configured"],
      })
    }

    if (
      configuration.effectiveOutputTokens !==
      (configuration.customOutputTokens ?? configuration.defaultOutputTokens)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Effective output tokens must match the custom value or task default.",
        path: ["effectiveOutputTokens"],
      })
    }
  })

export type AiTaskConfiguration = z.infer<typeof AiTaskConfigurationSchema>

export const AiTaskConfigurationsResponseSchema = z
  .array(AiTaskConfigurationSchema)
  .superRefine((configurations, context) => {
    const actualTasks = configurations.map(({ task }) => task)
    const expectedTasks = new Set<string>(AI_TASK_TYPES)
    const actualTaskSet = new Set(actualTasks)

    if (actualTasks.length !== AI_TASK_TYPES.length) {
      context.addIssue({
        code: "custom",
        message: "The task catalog must contain exactly eleven configurations.",
      })
    }

    if (actualTaskSet.size !== actualTasks.length) {
      context.addIssue({
        code: "custom",
        message: "The task catalog must not contain duplicate tasks.",
      })
    }

    if (
      actualTaskSet.size !== expectedTasks.size ||
      [...expectedTasks].some((task) => !actualTaskSet.has(task as AiTaskType))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "The task catalog does not contain the published eleven tasks.",
      })
    }
  })

export const AiTaskSelectionRequestSchema = z.object({
  connectionId: z.number().int().positive(),
  model: z.string().min(1),
})

export type AiTaskSelectionRequest = z.infer<
  typeof AiTaskSelectionRequestSchema
>

export const AiTaskOutputTokenRequestSchema = z.object({
  maxOutputTokens: positiveInt32Schema.nullable(),
})

export type AiTaskOutputTokenRequest = z.infer<
  typeof AiTaskOutputTokenRequestSchema
>

export const AiTaskConnectionOptionSchema = z.object({
  id: z.number().int().positive(),
  providerType: z.enum(AI_TASK_MODEL_CATALOG_PROVIDER_TYPES),
})

export type AiTaskConnectionOption = z.infer<
  typeof AiTaskConnectionOptionSchema
>

export const AiTaskModelCatalogSchema = z.object({
  providerType: z.enum(AI_TASK_MODEL_CATALOG_PROVIDER_TYPES),
  models: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })
  ),
})

export type AiTaskModelCatalog = z.infer<typeof AiTaskModelCatalogSchema>
