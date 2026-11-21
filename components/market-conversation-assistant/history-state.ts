import type { SearchParams } from "@/app/lib/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import type {
  IdentifiedMarketConversationSummaryResponse,
  MarketChatMessageResponse,
} from "@/app/lib/market-query/definitions"

export const HISTORY_PAGE_SIZE = 10
export type DemoConversationLabels = Dictionary["demoConversation"]
const RESPONSE_REVEAL_MIN_DURATION_MS = 600
const RESPONSE_REVEAL_MAX_DURATION_MS = 4_000
const RESPONSE_REVEAL_MS_PER_GRAPHEME = 12

export function getConversationHistoryFilterFields(query: string) {
  return {
    "title[containsIgnoreCase]": query.trim(),
  }
}

export function shouldLoadConversationHistory({
  query,
  loadedQuery,
  isLoading,
  hasError,
}: {
  query: string
  loadedQuery: string | null
  isLoading: boolean
  hasError: boolean
}) {
  return loadedQuery !== query.trim() && !isLoading && !hasError
}

export function buildConversationHistorySearchParams(
  filter: string,
  page = 0
): SearchParams {
  return {
    filter,
    page,
    size: HISTORY_PAGE_SIZE,
    sort: [{ field: "lastModifiedDate", direction: "desc" }],
  }
}

export function mergeConversationHistory(
  current: IdentifiedMarketConversationSummaryResponse[],
  incoming: IdentifiedMarketConversationSummaryResponse[],
  page: number
): IdentifiedMarketConversationSummaryResponse[] {
  if (page === 0) {
    return incoming
  }

  const byId = new Map(
    current.map((conversation) => [conversation.id, conversation])
  )

  for (const conversation of incoming) {
    byId.set(conversation.id, conversation)
  }

  return [...byId.values()]
}

export function getMessageText(message: MarketChatMessageResponse) {
  return message.content ?? ""
}

export function shouldRenderAssistantMarkdown(
  message: MarketChatMessageResponse,
  isRevealing: boolean
) {
  return (
    message.role === "ASSISTANT" &&
    message.status === "COMPLETED" &&
    !isRevealing
  )
}

export function getRenderableConversationMessages(
  messages: MarketChatMessageResponse[]
): MarketChatMessageResponse[] {
  return messages.filter(
    (message) =>
      getMessageText(message).trim().length > 0 ||
      (message.role === "ASSISTANT" && message.status === "FAILED")
  )
}

export function getMessagePreviewText(
  message: MarketChatMessageResponse,
  failureFallback: string
) {
  return (
    getMessageText(message).trim() ||
    message.failureReason?.trim() ||
    failureFallback
  )
}

export function splitResponseIntoGraphemes(text: string) {
  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    ({ segment }) => segment
  )
}

export function getResponseRevealDuration(graphemeCount: number) {
  if (graphemeCount <= 0) return 0

  return Math.min(
    RESPONSE_REVEAL_MAX_DURATION_MS,
    Math.max(
      RESPONSE_REVEAL_MIN_DURATION_MS,
      graphemeCount * RESPONSE_REVEAL_MS_PER_GRAPHEME
    )
  )
}

export function getResponseRevealCount(
  elapsedMs: number,
  graphemeCount: number
) {
  if (graphemeCount <= 0) return 0

  const duration = getResponseRevealDuration(graphemeCount)
  const progress = Math.min(1, Math.max(0, elapsedMs) / duration)

  return Math.min(
    graphemeCount,
    Math.max(1, Math.ceil(graphemeCount * progress))
  )
}

export function getTrackingRailState({
  index,
  hoveredIndex,
  isActive,
  isVisible,
}: {
  index: number
  hoveredIndex: number | null
  isActive: boolean
  isVisible: boolean
}) {
  const distance = hoveredIndex === null ? null : Math.abs(index - hoveredIndex)
  const isHovered = distance === 0

  return {
    width: distance === null ? 6 : (([26, 20, 14, 10] as const)[distance] ?? 6),
    tone:
      isHovered || (isActive && hoveredIndex === null)
        ? "active"
        : isVisible
          ? "visible"
          : "idle",
  } as const
}
