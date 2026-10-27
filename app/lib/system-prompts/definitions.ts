import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { formatMessage } from "@/app/lib/i18n/messages"
import { z } from "zod"

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

export const SystemPromptContentResponseSchema = z.object({
  promptType: z.enum(SYSTEM_PROMPT_CONTENT_TYPES),
  name: z.string(),
  content: z.string().max(10_000),
  requiredVariables: z.array(z.string()),
})

export type SystemPromptContentResponse = z.infer<
  typeof SystemPromptContentResponseSchema
>

export function isSystemPromptContentType(
  value: string
): value is SystemPromptContentType {
  return SYSTEM_PROMPT_CONTENT_TYPES.includes(value as SystemPromptContentType)
}

export const SYSTEM_PROMPT_TYPES = [
  "FIRECRAWL_SOURCE_DOCUMENT_FILTER",
  "NEWS_ARTICLE_CONTENT_LOCALIZATION",
  "NEWS_PRIMARY_EVENT_DERIVATION",
  "EVENT_ASSET_THEME_ENRICHMENT",
  "EVENT_MARKET_REACTION_DERIVATION",
  "EVENT_NARRATIVE_REFRESH",
  "EVENT_GROUNDED_MARKET_QUERY_SYNTHESIS",
  "TELEGRAM_CALENDAR_ALERT_ASSESSMENT",
  "TELEGRAM_NEWS_ALERT_ASSESSMENT",
  "TELEGRAM_MARKET_ANALYSIS",
] as const

export type SystemPromptType = (typeof SYSTEM_PROMPT_TYPES)[number]
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type LocalizedNames = Record<string, string>

export interface SystemPromptResponse {
  id: number
  promptType: SystemPromptType
  name?: string
  content: string
  responseSchema?: JsonValue
  localizedNames?: LocalizedNames
  createdDate?: string
  lastModifiedDate?: string
}

export interface CreateSystemPromptRequest {
  promptType: SystemPromptType
  content: string
  responseSchema: JsonValue
  localizedNames?: LocalizedNames
}

export interface UpdateSystemPromptRequest {
  content?: string
  responseSchema?: JsonValue
  localizedNames?: LocalizedNames
}

export function isSystemPromptType(value: string): value is SystemPromptType {
  return SYSTEM_PROMPT_TYPES.includes(value as SystemPromptType)
}

export function getSystemPromptTypeLabel(
  promptType: string,
  dictionary: Dictionary
) {
  if (isSystemPromptType(promptType)) {
    return dictionary.systemPrompts.typeLabels[promptType]
  }

  return promptType
}

export function getSystemPromptDisplayName(
  prompt: Pick<SystemPromptResponse, "promptType" | "name" | "localizedNames">,
  dictionary: Dictionary,
  locale?: string
) {
  const localizedName = locale ? prompt.localizedNames?.[locale]?.trim() : ""

  if (localizedName) {
    return localizedName
  }

  if (prompt.name?.trim()) {
    return prompt.name
  }

  return getSystemPromptTypeLabel(prompt.promptType, dictionary)
}

export function getSystemPromptWorkflowGroup(
  promptType: string,
  dictionary: Dictionary
) {
  if (isSystemPromptType(promptType)) {
    return dictionary.systemPrompts.workflowGroups[promptType]
  }

  return dictionary.systemPrompts.otherGroup
}

export function getSystemPromptTypeOptions(dictionary: Dictionary) {
  return SYSTEM_PROMPT_TYPES.map((type) => ({
    value: type,
    label: dictionary.systemPrompts.typeLabels[type],
    group: dictionary.systemPrompts.workflowGroups[type],
  }))
}

export function formatSystemPromptContentLength(
  content: string | undefined,
  dictionary: Dictionary,
  formatNumber: (value: number) => string = String
) {
  const length = content?.length ?? 0
  return formatMessage(dictionary.systemPrompts.contentLength, {
    count: formatNumber(length),
  })
}
