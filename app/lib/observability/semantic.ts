export const OBSERVABILITY_OPERATIONS = {
  authResolve: "signapse.auth.resolve",
  backendRequest: "signapse.backend.request",
  dashboardLoad: "signapse.dashboard.load",
  usageLimitsLoad: "signapse.usage_limits.load",
  marketChartInitialLoad: "signapse.market_chart.initial_load",
  marketChartLiveConnect: "signapse.market_chart.live_connect",
  marketChartFirstLiveData: "signapse.market_chart.first_live_data",
  marketAssistantSubmit: "signapse.market_assistant.submit",
} as const

export type ObservabilityOperation =
  (typeof OBSERVABILITY_OPERATIONS)[keyof typeof OBSERVABILITY_OPERATIONS]

export const OBSERVABILITY_OUTCOMES = [
  "success",
  "empty",
  "http_error",
  "timeout",
  "cancelled",
  "network_error",
  "parse_error",
  "validation_error",
  "invalid_payload",
  "closed",
  "stale",
  "error",
] as const

export type ObservabilityOutcome = (typeof OBSERVABILITY_OUTCOMES)[number]

export const OBSERVABILITY_ERROR_TYPES = [
  "http",
  "timeout",
  "abort",
  "network",
  "parse",
  "validation",
  "invalid_payload",
  "unknown",
] as const

export type ObservabilityErrorType = (typeof OBSERVABILITY_ERROR_TYPES)[number]

export const OBSERVABILITY_ATTRIBUTE_KEYS = [
  "feature",
  "operation",
  "method",
  "route",
  "http.status_code",
  "outcome",
  "error.type",
  "locale",
  "environment",
  "connection.kind",
  "conversation.kind",
  "market.event_kind",
  "duration_ms",
  "trace_id",
  "validation.issue_count",
  "validation.issue_codes",
  "validation.issue_paths",
] as const

export type ObservabilityAttributeKey =
  (typeof OBSERVABILITY_ATTRIBUTE_KEYS)[number]
export type ObservabilityAttributeValue = string | number | boolean
export type ObservabilityAttributes = Partial<
  Record<ObservabilityAttributeKey, ObservabilityAttributeValue>
>

const ATTRIBUTE_KEY_ALLOWLIST = new Set<string>(OBSERVABILITY_ATTRIBUTE_KEYS)
const SENSITIVE_RESOURCE_SEGMENTS = new Set([
  "ai-provider-configs",
  "asset",
  "assets",
  "blogs",
  "conversation",
  "conversations",
  "credential",
  "credentials",
  "cronjobs",
  "economic-calendar",
  "events",
  "key",
  "keys",
  "message",
  "messages",
  "narratives",
  "news-articles",
  "news-outlets",
  "personal-notes",
  "prompt",
  "prompts",
  "roles",
  "session",
  "sessions",
  "system-prompts",
  "topics",
  "token",
  "tokens",
  "user",
  "users",
  "watchlists",
  "workspace",
  "workspaces",
])
const UUID_OR_LONG_IDENTIFIER =
  /^(?:[0-9a-f]{8}-[0-9a-f-]{18,}|[0-9a-f]{16,}|[A-Za-z0-9_-]{24,})$/i
const SAFE_VALUE_PATTERN = /^[A-Za-z0-9_.:/\[\],-]{0,256}$/

export function sanitizeObservabilityAttributes(
  attributes: Record<string, unknown>
): ObservabilityAttributes {
  const sanitized: ObservabilityAttributes = {}

  for (const [key, value] of Object.entries(attributes)) {
    if (!ATTRIBUTE_KEY_ALLOWLIST.has(key)) {
      continue
    }
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      continue
    }
    if (typeof value === "string" && !SAFE_VALUE_PATTERN.test(value)) {
      continue
    }

    sanitized[key as ObservabilityAttributeKey] = value
  }

  return sanitized
}

export function normalizeBackendRoute(input: string): string {
  let pathname = "/"
  try {
    const parsed = new URL(input, "https://signapse.invalid")
    pathname = parsed.pathname
  } catch {
    pathname = input.split(/[?#]/, 1)[0] || "/"
  }

  let previousSegment = ""
  const normalizedSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((rawSegment) => {
      let segment = rawSegment
      try {
        segment = decodeURIComponent(rawSegment)
      } catch {
        return ":id"
      }

      const shouldRedact =
        SENSITIVE_RESOURCE_SEGMENTS.has(previousSegment.toLowerCase()) ||
        /^\d+$/.test(segment) ||
        UUID_OR_LONG_IDENTIFIER.test(segment) ||
        segment.includes("@") ||
        segment.includes(":") ||
        !/^[A-Za-z0-9._~-]+$/.test(segment)
      previousSegment = segment
      return shouldRedact ? ":id" : segment
    })

  return normalizedSegments.length > 0
    ? `/${normalizedSegments.join("/")}`
    : "/"
}

export interface ValidationIssueLike {
  code?: unknown
  path?: unknown
}

export function summarizeValidationIssues(
  issues: readonly ValidationIssueLike[],
  maxIssues = 5
): ObservabilityAttributes {
  const boundedIssues = issues.slice(0, Math.max(0, maxIssues))
  const codes = boundedIssues
    .map((issue) =>
      typeof issue.code === "string" && /^[a-z0-9_]{1,40}$/i.test(issue.code)
        ? issue.code
        : "unknown"
    )
    .join(",")
  const paths = boundedIssues
    .map((issue) => normalizeValidationPath(issue.path))
    .join(",")

  return sanitizeObservabilityAttributes({
    "validation.issue_count": Math.min(issues.length, 999),
    "validation.issue_codes": codes,
    "validation.issue_paths": paths,
  })
}

function normalizeValidationPath(path: unknown): string {
  if (!Array.isArray(path)) {
    return "unknown"
  }

  const normalized = path.slice(0, 6).map((segment) => {
    if (typeof segment === "number" || /^\d+$/.test(String(segment))) {
      return "[]"
    }
    const value = String(segment)
    return /^[A-Za-z_][A-Za-z0-9_-]{0,39}$/.test(value) ? value : ":field"
  })

  return normalized.length > 0 ? normalized.join(".") : "root"
}
