"use server"

import { auth } from "@clerk/nextjs/server"
import { cookies, headers } from "next/headers"

import {
  isDevAuthModeEnabled,
  isP0FixtureModeEnabled,
} from "@/app/lib/dev-auth-mode"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  injectTraceContextForBackend,
  observeServerOperation,
  type ServerOperationController,
} from "@/app/lib/observability/server"
import {
  normalizeBackendRoute,
  OBSERVABILITY_OPERATIONS,
  type ObservabilityErrorType,
  type ObservabilityOutcome,
} from "@/app/lib/observability/semantic"

const API_TIMEOUT_MS = 60000
const TEST_RUN_ID_COOKIE = "signapse_test_run_id"
const TEST_RUN_ID_HEADER = "x-signapse-test-run-id"
export type BackendApiError = Error & {
  status?: number
  code?: string
  timestamp?: string
}

async function getFixtureTestRunHeaders(): Promise<Record<string, string>> {
  if (!isP0FixtureModeEnabled()) {
    return {}
  }

  try {
    const testRunId =
      (await cookies()).get(TEST_RUN_ID_COOKIE)?.value ??
      (await headers()).get(TEST_RUN_ID_HEADER)
    if (!testRunId || !/^[A-Za-z0-9._:-]+$/.test(testRunId)) {
      return {}
    }

    return { [TEST_RUN_ID_HEADER]: testRunId }
  } catch {
    return {}
  }
}

async function apiFetch<T>(
  urlPath: string,
  options: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase()
  const route = normalizeBackendRoute(urlPath)

  return observeServerOperation(
    OBSERVABILITY_OPERATIONS.backendRequest,
    { feature: "transport", method, route },
    async (operation) => {
      const locale = await getRequestLocale()
      const dictionary = await getDictionary(locale)
      const baseUrl = process.env.API_BASE_URL
      if (!baseUrl) {
        recordTransportFailure(operation, "error", "unknown")
        throw new Error(dictionary.errors.missingApiBaseUrl)
      }

      const abortController = new AbortController()
      let timedOut = false
      const timeout = setTimeout(() => {
        timedOut = true
        abortController.abort()
      }, timeoutMs)
      let failureRecorded = false

      try {
        const isFormData = options.body instanceof FormData
        const hasBody = options.body !== undefined && options.body !== null
        const defaultHeaders: Record<string, string> = {
          Accept: "application/json",
          "Accept-Language": locale,
          ...(await getFixtureTestRunHeaders()),
        }

        if (hasBody && !isFormData) {
          defaultHeaders["Content-Type"] = "application/json"
        }

        const fullUrl = `${baseUrl}${urlPath}`
        const finalHeaders: Record<string, string> = {
          ...defaultHeaders,
          ...((options.headers || {}) as Record<string, string>),
        }
        injectTraceContextForBackend(finalHeaders, fullUrl, baseUrl)

        const finalOptions: RequestInit = {
          method: "GET",
          cache: "no-store",
          ...options,
          headers: finalHeaders,
          signal: options.signal ?? abortController.signal,
          opentelemetry: {
            ignore: true,
            propagateContext: false,
          },
        }
        const response = await fetch(fullUrl, finalOptions)
        operation.addAttributes({ "http.status_code": response.status })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = dictionary.errors.generic
          let errorCode: string | undefined
          let errorTimestamp: string | undefined
          try {
            if (errorText) {
              const errorJson: unknown = JSON.parse(errorText)
              if (
                typeof errorJson === "object" &&
                errorJson !== null &&
                "message" in errorJson &&
                typeof errorJson.message === "string"
              ) {
                errorMessage = errorJson.message
              }
              if (
                typeof errorJson === "object" &&
                errorJson !== null &&
                "code" in errorJson &&
                typeof errorJson.code === "string"
              ) {
                errorCode = errorJson.code
              }
              if (
                typeof errorJson === "object" &&
                errorJson !== null &&
                "timestamp" in errorJson &&
                typeof errorJson.timestamp === "string"
              ) {
                errorTimestamp = errorJson.timestamp
              }
            }
          } catch {
            errorMessage = errorText || errorMessage
          }
          recordTransportFailure(operation, "http_error", "http", {
            "http.status_code": response.status,
          })
          failureRecorded = true
          const apiError = new Error(errorMessage) as BackendApiError
          apiError.status = response.status
          apiError.code = errorCode
          apiError.timestamp = errorTimestamp
          throw apiError
        }

        if (response.status === 204) {
          operation.setOutcome("empty")
          return null as T
        }

        const text = await response.text()
        if (!text) {
          operation.setOutcome("empty")
          return null as T
        }

        try {
          return JSON.parse(text) as T
        } catch (error) {
          recordTransportFailure(operation, "parse_error", "parse")
          failureRecorded = true
          throw error
        }
      } catch (error) {
        if (!failureRecorded) {
          const [outcome, errorType] = classifyTransportFailure(error, timedOut)
          recordTransportFailure(operation, outcome, errorType)
        }
        throw error
      } finally {
        clearTimeout(timeout)
      }
    }
  )
}

export async function getClerkToken(): Promise<string> {
  const { getToken, userId } = await auth()
  const dictionary = await getDictionary(await getRequestLocale())
  if (!userId) {
    throw new Error(dictionary.errors.unauthenticated)
  }
  const token = await getToken({ template: "signapse" })
  if (!token) {
    throw new Error(dictionary.errors.missingToken)
  }
  return token
}

export async function getBackendAuthHeaders(): Promise<Record<string, string>> {
  return observeServerOperation(
    OBSERVABILITY_OPERATIONS.authResolve,
    { feature: "auth" },
    async () => {
      const fixtureHeaders = await getFixtureTestRunHeaders()
      if (isDevAuthModeEnabled()) {
        return fixtureHeaders
      }

      const token = await getClerkToken()
      return {
        ...fixtureHeaders,
        Authorization: `Bearer ${token}`,
      }
    }
  )
}

export async function fetchAuthenticated<T>(
  urlPath: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getBackendAuthHeaders()

  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...((options.headers || {}) as Record<string, string>),
    },
  }

  return apiFetch<T>(urlPath, finalOptions)
}

function recordTransportFailure(
  operation: ServerOperationController,
  outcome: ObservabilityOutcome,
  errorType: ObservabilityErrorType,
  attributes: Record<string, unknown> = {}
): void {
  operation.setOutcome(outcome)
  operation.reportFailure(errorType, attributes)
}

function classifyTransportFailure(
  error: unknown,
  timedOut: boolean
): [ObservabilityOutcome, ObservabilityErrorType] {
  if (timedOut) {
    return ["timeout", "timeout"]
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return ["cancelled", "abort"]
  }
  return ["network_error", "network"]
}
