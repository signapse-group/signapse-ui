"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { canReadSystemPrompts } from "@/app/lib/system-prompts/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import {
  CreateSystemPromptRequest,
  SystemPromptContentResponseSchema,
  SystemPromptResponse,
  SystemPromptContentResponse,
  SystemPromptType,
  UpdateSystemPromptRequest,
  isSystemPromptContentType,
} from "@/app/lib/system-prompts/definitions"
import { queryParamsToString } from "@/app/lib/utils"

function getSystemPromptPath(promptType: string) {
  return `/system-prompts/${encodeURIComponent(promptType)}`
}

function revalidateSystemPromptRoutes(promptType?: string) {
  revalidatePath("/system-prompts")

  if (promptType) {
    revalidatePath(getSystemPromptPath(promptType))
    return
  }

  revalidatePath("/system-prompts/[promptType]", "page")
}

async function getSystemPromptsDictionary() {
  return getDictionary(await getRequestLocale())
}

export async function getSystemPrompts(
  searchParams: SearchParams
): Promise<Page<SystemPromptResponse>> {
  return fetchAuthenticated<Page<SystemPromptResponse>>(
    `/system-prompts?${queryParamsToString(searchParams)}`
  )
}

export async function getSystemPromptByType(
  promptType: SystemPromptType
): Promise<SystemPromptResponse> {
  return fetchAuthenticated<SystemPromptResponse>(
    getSystemPromptPath(promptType)
  )
}

export async function getSystemPromptContentByType(
  rawPromptType: string
): Promise<SystemPromptContentResponse> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getSystemPromptsDictionary(),
  ])

  if (!canReadSystemPrompts(permissions)) {
    throw new Error(dictionary.systemPrompts.readDenied)
  }

  if (!isSystemPromptContentType(rawPromptType)) {
    throw new Error(dictionary.systemPrompts.unsupportedPrompt)
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      `/system-prompts/${encodeURIComponent(rawPromptType)}`
    )
    const result = SystemPromptContentResponseSchema.safeParse(response)

    if (!result.success || result.data.promptType !== rawPromptType) {
      throw new Error(dictionary.systemPrompts.viewError)
    }

    return result.data
  } catch {
    throw new Error(dictionary.systemPrompts.viewError)
  }
}

export async function createSystemPrompt(
  request: CreateSystemPromptRequest
): Promise<ActionResult<SystemPromptResponse>> {
  try {
    const data = await fetchAuthenticated<SystemPromptResponse>(
      "/system-prompts",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    )

    revalidateSystemPromptRoutes(request.promptType)

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getSystemPromptsDictionary()

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.systemPrompts.createError,
    }
  }
}

export async function updateSystemPrompt(
  promptType: SystemPromptType,
  request: UpdateSystemPromptRequest
): Promise<ActionResult<SystemPromptResponse>> {
  try {
    const data = await fetchAuthenticated<SystemPromptResponse>(
      getSystemPromptPath(promptType),
      {
        method: "PUT",
        body: JSON.stringify(request),
      }
    )

    revalidateSystemPromptRoutes(promptType)

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getSystemPromptsDictionary()

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.systemPrompts.updateError,
    }
  }
}

export async function deleteSystemPrompt(
  promptType: SystemPromptType
): Promise<ActionResult> {
  try {
    await fetchAuthenticated<void>(getSystemPromptPath(promptType), {
      method: "DELETE",
    })

    revalidateSystemPromptRoutes(promptType)

    return { success: true, data: undefined }
  } catch (error: unknown) {
    const dictionary = await getSystemPromptsDictionary()

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : dictionary.systemPrompts.deleteError,
    }
  }
}
