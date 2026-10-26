"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated, type BackendApiError } from "@/app/api/auth/action"
import type { ActionResult } from "@/app/lib/definitions"
import { getServerDictionary } from "@/app/lib/i18n/server"
import {
  canReadSystemPrompts,
  canUpdateSystemPrompts,
} from "@/app/lib/system-prompts/permissions"
import {
  systemPromptContentResponseSchema,
  systemPromptListResponseSchema,
  updateSystemPromptContentRequestSchema,
  type SystemPromptContentResponse,
  type UpdateSystemPromptContentRequest,
} from "@/app/lib/system-prompts/definitions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"

const SYSTEM_PROMPT_LIST_URL = "/system-prompts?page=0&size=100"

function getSystemPromptPath(promptType: string) {
  return `/system-prompts/${encodeURIComponent(promptType)}`
}

function permissionDenied(message: string): BackendApiError {
  const error = new Error(message) as BackendApiError
  error.status = 403
  return error
}

export async function getSystemPrompts(): Promise<
  SystemPromptContentResponse[]
> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!canReadSystemPrompts(permissions)) {
    throw permissionDenied(dictionary.systemPrompts.readDenied)
  }

  let response: unknown
  try {
    response = await fetchAuthenticated<unknown>(SYSTEM_PROMPT_LIST_URL)
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error && error.status === 403) {
      throw permissionDenied(dictionary.systemPrompts.readDenied)
    }
    throw error
  }
  const parsed = systemPromptListResponseSchema.safeParse(response)

  if (!parsed.success) {
    throw new Error(dictionary.systemPrompts.responseInvalid)
  }

  return parsed.data.content
}

export async function getSystemPromptByType(
  promptType: string
): Promise<SystemPromptContentResponse> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!canReadSystemPrompts(permissions)) {
    throw permissionDenied(dictionary.systemPrompts.readDenied)
  }

  let response: unknown
  try {
    response = await fetchAuthenticated<unknown>(
      getSystemPromptPath(promptType)
    )
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error && error.status === 403) {
      throw permissionDenied(dictionary.systemPrompts.readDenied)
    }
    throw error
  }
  const parsed = systemPromptContentResponseSchema.safeParse(response)

  if (!parsed.success) {
    throw new Error(dictionary.systemPrompts.responseInvalid)
  }

  return parsed.data
}

export async function updateSystemPrompt(
  promptType: string,
  request: UpdateSystemPromptContentRequest
): Promise<ActionResult<SystemPromptContentResponse>> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])
  const t = dictionary.systemPrompts

  if (!canUpdateSystemPrompts(permissions)) {
    return { success: false, error: t.updateDenied }
  }

  const parsedRequest =
    updateSystemPromptContentRequestSchema.safeParse(request)

  if (!parsedRequest.success) {
    return {
      success: false,
      error: parsedRequest.error.issues.some(
        (issue) => issue.code === "too_big"
      )
        ? t.contentTooLong
        : t.contentRequired,
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      getSystemPromptPath(promptType),
      {
        method: "PUT",
        body: JSON.stringify(parsedRequest.data),
      }
    )
    const parsedResponse = systemPromptContentResponseSchema.safeParse(response)

    if (!parsedResponse.success) {
      return { success: false, error: t.responseInvalid }
    }

    revalidatePath("/system-prompts")
    revalidatePath("/system-prompts/[promptType]", "page")

    return { success: true, data: parsedResponse.data }
  } catch (error: unknown) {
    const status =
      error instanceof Error && "status" in error ? error.status : undefined
    return {
      success: false,
      error:
        status === 403
          ? t.updateDenied
          : status === 400 && error instanceof Error
            ? error.message
            : t.updateError,
    }
  }
}
