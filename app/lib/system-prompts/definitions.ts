import { z } from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export const SYSTEM_PROMPT_MAX_CONTENT_LENGTH = 10_000

export const SYSTEM_PROMPT_CONTENT_TYPES = [
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
  "TELEGRAM_MARKET_ANALYSIS_ASSESSMENT",
  "TELEGRAM_MARKET_ANALYSIS_SCALPING",
  "TELEGRAM_MARKET_ANALYSIS_EXPLANATION",
] as const

export type SystemPromptContentType =
  (typeof SYSTEM_PROMPT_CONTENT_TYPES)[number]

const promptContentFields = {
  name: z.string(),
  content: z.string().max(SYSTEM_PROMPT_MAX_CONTENT_LENGTH),
  requiredVariables: z.array(z.string()),
}

export const SystemPromptContentResponseSchema = z.object({
  promptType: z.enum(SYSTEM_PROMPT_CONTENT_TYPES),
  ...promptContentFields,
})

export function isSystemPromptContentType(
  value: string
): value is SystemPromptContentType {
  return SYSTEM_PROMPT_CONTENT_TYPES.includes(value as SystemPromptContentType)
}

export const systemPromptContentResponseSchema = z.object({
  promptType: z.string().min(1),
  ...promptContentFields,
})

export const systemPromptListResponseSchema = z
  .object({
    content: z.array(systemPromptContentResponseSchema),
  })
  .passthrough()

export const updateSystemPromptContentRequestSchema = z
  .object({
    content: z.string().max(SYSTEM_PROMPT_MAX_CONTENT_LENGTH).regex(/\S/),
  })
  .strict()

export type SystemPromptContentResponse = z.infer<
  typeof systemPromptContentResponseSchema
>
export type UpdateSystemPromptContentRequest = z.infer<
  typeof updateSystemPromptContentRequestSchema
>

export function getSystemPromptWorkflowGroup(
  promptType: string,
  dictionary: Dictionary
) {
  const workflows = dictionary.systemPrompts.workflowGroups

  if (promptType.startsWith("TELEGRAM_")) return workflows.telegram
  if (promptType.startsWith("ECONOMIC_CALENDAR_")) return workflows.calendar
  if (promptType.startsWith("NEWS_ARTICLE_")) return workflows.news
  if (promptType.includes("REACTION")) return workflows.reactions
  if (promptType.startsWith("WARM_")) return workflows.warm
  if (/^MARKET_(QUESTION|QUERY)_/.test(promptType)) return workflows.assistant
  if (promptType.includes("NARRATIVE")) return workflows.narratives
  if (
    promptType.startsWith("EVENT_") ||
    promptType.startsWith("NEWS_PRIMARY_EVENT_")
  ) {
    return workflows.events
  }

  return workflows.other
}
