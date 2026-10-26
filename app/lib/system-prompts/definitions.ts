import { z } from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export const SYSTEM_PROMPT_MAX_CONTENT_LENGTH = 10_000

export const systemPromptContentResponseSchema = z.object({
  promptType: z.string().min(1),
  name: z.string(),
  content: z.string().max(SYSTEM_PROMPT_MAX_CONTENT_LENGTH),
  requiredVariables: z.array(z.string()),
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
