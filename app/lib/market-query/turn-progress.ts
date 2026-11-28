import {
  marketConversationTurnProgressStepResponseSchema,
  type MarketConversationTurnProgressStepResponse,
} from "@/app/lib/market-query/definitions"

export type CompleteMarketConversationTurnProgressStep =
  MarketConversationTurnProgressStepResponse & {
    stepId: string
    sequenceNumber: number
    stepType: "UNDERSTANDING" | "TOOL"
    status: "IN_PROGRESS" | "COMPLETED" | "FAILED"
  }

export function parseMarketConversationTurnProgressStep(
  value: unknown
): CompleteMarketConversationTurnProgressStep | null {
  const parsed =
    marketConversationTurnProgressStepResponseSchema.safeParse(value)

  if (
    !parsed.success ||
    !parsed.data.stepId?.trim() ||
    !Number.isSafeInteger(parsed.data.sequenceNumber) ||
    parsed.data.sequenceNumber! < 0 ||
    !parsed.data.stepType ||
    !parsed.data.status
  ) {
    return null
  }

  return {
    ...parsed.data,
    stepId: parsed.data.stepId,
    sequenceNumber: parsed.data.sequenceNumber!,
    stepType: parsed.data.stepType,
    status: parsed.data.status,
  }
}

export function upsertMarketConversationTurnProgressStep(
  current: readonly CompleteMarketConversationTurnProgressStep[],
  incoming: CompleteMarketConversationTurnProgressStep | null
) {
  if (!incoming) {
    return [...current]
  }

  const previous = current.find((step) => step.stepId === incoming.stepId)

  if (previous && incoming.sequenceNumber <= previous.sequenceNumber) {
    return [...current]
  }

  return [
    ...current.filter((step) => step.stepId !== incoming.stepId),
    incoming,
  ].sort((left, right) => left.sequenceNumber - right.sequenceNumber)
}
