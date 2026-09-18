import type {
  FeedbackErrorKind,
  FeedbackLifecycleErrorCode,
} from "./definitions"

export interface FeedbackErrorDetails {
  status?: number
  code?: string
  name?: string
}

export interface NormalizedFeedbackError {
  status?: number
  code?: FeedbackLifecycleErrorCode
  kind: FeedbackErrorKind
  message: string
}

export function getFeedbackErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined
  }

  const status = error.status
  return typeof status === "number" ? status : undefined
}

function getStableCode(
  code: string | undefined
): FeedbackLifecycleErrorCode | undefined {
  if (
    code === "FEEDBACK_ALREADY_REVIEWED" ||
    code === "FEEDBACK_NO_LONGER_WITHDRAWABLE"
  ) {
    return code
  }
  return undefined
}

export function normalizeFeedbackError(
  details: FeedbackErrorDetails,
  message: string
): NormalizedFeedbackError {
  const code = getStableCode(details.code)
  let kind: FeedbackErrorKind

  if (code) kind = "lifecycle-conflict"
  else if (details.status === 400) kind = "validation"
  else if (details.status === 401) kind = "unauthenticated"
  else if (details.status === 403) kind = "forbidden"
  else if (details.status === 404) kind = "missing"
  else if (details.status === 413) kind = "payload-too-large"
  else if (details.status === 502) kind = "upstream"
  else if (details.name === "AbortError") kind = "timeout"
  else if (details.status === undefined) kind = "network"
  else kind = "server"

  return {
    message,
    status: details.status,
    code,
    kind,
  }
}
