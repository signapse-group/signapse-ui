export interface MarketConversationSubmissionIdentity {
  message: string
  idempotencyKey: string
}

export function getMarketConversationSubmissionIdentity(
  existing: MarketConversationSubmissionIdentity | null,
  message: string,
  createIdempotencyKey: () => string = () => crypto.randomUUID()
): MarketConversationSubmissionIdentity {
  if (existing?.message === message) {
    return existing
  }

  return {
    message,
    idempotencyKey: createIdempotencyKey(),
  }
}
