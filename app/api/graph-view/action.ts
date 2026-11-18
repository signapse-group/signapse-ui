"use server"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getMe } from "@/app/api/user/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  graphViewDaysSchema,
  GraphViewResponse,
  graphViewResponseSchema,
  type GraphViewDays,
  type GraphViewWorkspaceIdentity,
  type GraphViewWorkspaceLoadResult,
} from "@/app/lib/graph-view/definitions"
import type { BackendMeResponse } from "@/app/lib/users/definitions"

const GRAPH_VIEW_VALIDATION_ISSUE_LIMIT = 12

function formatGraphViewValidationPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "<root>"
  }

  return path
    .map((segment) =>
      typeof segment === "number" ? `[${segment}]` : String(segment)
    )
    .join(".")
    .replace(".[", "[")
}

function summarizeGraphViewValidationIssues(
  issues: Array<{
    code: string
    message: string
    path: PropertyKey[]
  }>
) {
  return issues.slice(0, GRAPH_VIEW_VALIDATION_ISSUE_LIMIT).map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: formatGraphViewValidationPath(issue.path),
  }))
}

export async function getGraphView(
  days: GraphViewDays = 7
): Promise<GraphViewResponse> {
  const dictionary = await getDictionary(await getRequestLocale())
  const parsedDays = graphViewDaysSchema.safeParse(days)
  if (!parsedDays.success) {
    throw new Error(dictionary.graphView.timeRangeInvalid)
  }

  const query = new URLSearchParams({ days: String(parsedDays.data) })
  const response = await fetchAuthenticated<unknown>(`/graph-view?${query}`)
  const parsedResponse = graphViewResponseSchema.safeParse(response)

  if (!parsedResponse.success) {
    const issues = parsedResponse.error.issues
    const validationSummary = {
      issueCount: issues.length,
      issues: summarizeGraphViewValidationIssues(issues),
      truncated: issues.length > GRAPH_VIEW_VALIDATION_ISSUE_LIMIT,
    }

    console.error(
      `Graph view response validation failed ${JSON.stringify(validationSummary)}`
    )
    throw new Error(dictionary.graphView.responseInvalid)
  }

  return parsedResponse.data
}

export async function getGraphViewForWorkspace(
  days: GraphViewDays,
  expected: GraphViewWorkspaceIdentity
): Promise<GraphViewWorkspaceLoadResult> {
  const parsedDays = graphViewDaysSchema.safeParse(days)
  if (!parsedDays.success) return { kind: "error" }

  try {
    const current = await getMe()
    const currentState = getWorkspaceState(current, expected)
    if (currentState) return currentState

    const graphView = await getGraphView(parsedDays.data)
    const latest = await getMe()
    const latestState = getWorkspaceState(latest, expected)
    if (latestState) return latestState

    return { kind: "success", graphView }
  } catch (error: unknown) {
    let latest: BackendMeResponse
    try {
      latest = await getMe()
    } catch {
      return { kind: "error" }
    }

    const latestState = getWorkspaceState(latest, expected)
    if (latestState) return latestState

    if (error instanceof Error && "status" in error && error.status === 403) {
      return { kind: "permission-denied" }
    }

    return { kind: "error" }
  }
}

function getWorkspaceState(
  me: BackendMeResponse,
  expected: GraphViewWorkspaceIdentity
): GraphViewWorkspaceLoadResult | null {
  if (!me.currentWorkspace) return { kind: "workspace-required" }
  if (
    me.id !== expected.userId ||
    me.currentWorkspace.id !== expected.workspaceId
  ) {
    return { kind: "workspace-changed" }
  }

  return null
}
