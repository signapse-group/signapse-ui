import {
  AI_PROVIDER_TYPES,
  AiProviderType,
  SUPPORTED_AI_PROVIDER_TYPES,
} from "@/app/lib/ai-provider-configs/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export const providerOptions: { value: AiProviderType; label: string }[] = [
  { value: "DEEPSEEK", label: "DeepSeek" },
  { value: "GEMINI", label: "Gemini" },
  { value: "GROQ", label: "Groq" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "ZAI", label: "ZAI" },
]

export const supportedProviderOptions = providerOptions.filter((provider) =>
  SUPPORTED_AI_PROVIDER_TYPES.includes(
    provider.value as (typeof SUPPORTED_AI_PROVIDER_TYPES)[number]
  )
)

export function getProviderOptionLabel(
  providerType: AiProviderType | undefined,
  dictionary: Dictionary
) {
  return (
    providerOptions.find((provider) => provider.value === providerType)
      ?.label ?? dictionary.aiProviderConfigs.unknownProvider
  )
}

export { AI_PROVIDER_TYPES }
