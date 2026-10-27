"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getAiProviderConfigs } from "@/app/api/ai-provider-configs/action"
import type { ActionResult } from "@/app/lib/definitions"
import {
  AI_TASK_CONFIGURATION_READ_PERMISSION,
  AI_TASK_CONFIGURATION_UPDATE_PERMISSION,
  AI_TASK_MODEL_CATALOG_PERMISSION,
  AI_TASK_PROVIDER_READ_PERMISSION,
  AiTaskConfigurationSchema,
  AiTaskConfigurationsResponseSchema,
  AiTaskConnectionOptionSchema,
  AiTaskModelCatalogSchema,
  AiTaskOutputTokenRequestSchema,
  AiTaskSelectionRequestSchema,
  isAiTaskModelCatalogProviderType,
  AI_TASK_TYPES,
  type AiTaskConfiguration,
  type AiTaskConnectionOption,
  type AiTaskModelCatalog,
  type AiTaskType,
} from "@/app/lib/ai-task-configurations/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"

async function getAiTaskConfigurationDictionary() {
  return getDictionary(await getRequestLocale())
}

function revalidateAiTaskConfigurationPage() {
  revalidatePath("/[lang]/ai-task-configurations", "page")
}

function isAiTaskType(value: unknown): value is AiTaskType {
  return (
    typeof value === "string" && AI_TASK_TYPES.includes(value as AiTaskType)
  )
}

export async function getAiTaskConfigurations(): Promise<
  AiTaskConfiguration[]
> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getAiTaskConfigurationDictionary(),
  ])

  if (!hasPermission(permissions, AI_TASK_CONFIGURATION_READ_PERMISSION)) {
    throw new Error(dictionary.aiTaskConfigurations.readDenied)
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      "/ai-task-configurations"
    )
    const result = AiTaskConfigurationsResponseSchema.safeParse(response)

    if (!result.success) {
      throw new Error(dictionary.aiTaskConfigurations.invalidResponse)
    }

    return result.data
  } catch {
    throw new Error(dictionary.aiTaskConfigurations.loadError)
  }
}

export async function getAiTaskConfigurationConnections(): Promise<
  ActionResult<AiTaskConnectionOption[]>
> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getAiTaskConfigurationDictionary(),
  ])

  if (!hasPermission(permissions, AI_TASK_PROVIDER_READ_PERMISSION)) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.connectionReadDenied,
    }
  }

  try {
    const providerPage = await getAiProviderConfigs({
      page: 0,
      size: 2000,
      filter: "",
      sort: [],
    })
    const options = providerPage.content
      .filter((provider) =>
        isAiTaskModelCatalogProviderType(provider.providerType)
      )
      .map((provider) =>
        AiTaskConnectionOptionSchema.parse({
          id: provider.id,
          providerType: provider.providerType,
        })
      )

    return { success: true, data: options }
  } catch {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.connectionLoadError,
    }
  }
}

export async function getAiTaskModelCatalog(
  rawConnectionId: unknown
): Promise<ActionResult<AiTaskModelCatalog>> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getAiTaskConfigurationDictionary(),
  ])

  if (!hasPermission(permissions, AI_TASK_MODEL_CATALOG_PERMISSION)) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.modelCatalogDenied,
    }
  }

  const connectionId = Number(rawConnectionId)

  if (!Number.isSafeInteger(connectionId) || connectionId < 1) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.invalidConnection,
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      `/ai-provider-configs/${connectionId}/model-catalog`
    )
    const result = AiTaskModelCatalogSchema.safeParse(response)

    if (!result.success) {
      return {
        success: false,
        error: dictionary.aiTaskConfigurations.invalidModelCatalog,
      }
    }

    return { success: true, data: result.data }
  } catch {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.modelCatalogError,
    }
  }
}

export async function updateAiTaskSelection(
  rawTask: unknown,
  rawRequest: unknown
): Promise<ActionResult<AiTaskConfiguration>> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getAiTaskConfigurationDictionary(),
  ])

  if (!hasPermission(permissions, AI_TASK_CONFIGURATION_UPDATE_PERMISSION)) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.updateDenied,
    }
  }

  if (!isAiTaskType(rawTask)) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.invalidTask,
    }
  }

  const request = AiTaskSelectionRequestSchema.safeParse(rawRequest)

  if (!request.success) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.selectionValidationError,
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      `/ai-task-configurations/${rawTask}/selection`,
      {
        method: "PUT",
        body: JSON.stringify(request.data),
      }
    )
    const result = AiTaskConfigurationSchema.safeParse(response)

    if (
      !result.success ||
      result.data.task !== rawTask ||
      result.data.selectedConnectionId !== request.data.connectionId ||
      result.data.selectedModel !== request.data.model
    ) {
      return {
        success: false,
        error: dictionary.aiTaskConfigurations.invalidResponse,
      }
    }

    revalidateAiTaskConfigurationPage()
    return { success: true, data: result.data }
  } catch {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.selectionSaveError,
    }
  }
}

export async function updateAiTaskOutputTokens(
  rawTask: unknown,
  rawRequest: unknown
): Promise<ActionResult<AiTaskConfiguration>> {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getAiTaskConfigurationDictionary(),
  ])

  if (!hasPermission(permissions, AI_TASK_CONFIGURATION_UPDATE_PERMISSION)) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.updateDenied,
    }
  }

  if (!isAiTaskType(rawTask)) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.invalidTask,
    }
  }

  const request = AiTaskOutputTokenRequestSchema.safeParse(rawRequest)

  if (!request.success) {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.tokenValidationError,
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>(
      `/ai-task-configurations/${rawTask}/output-token`,
      {
        method: "PUT",
        body: JSON.stringify(request.data),
      }
    )
    const result = AiTaskConfigurationSchema.safeParse(response)

    if (
      !result.success ||
      result.data.task !== rawTask ||
      result.data.customOutputTokens !== request.data.maxOutputTokens
    ) {
      return {
        success: false,
        error: dictionary.aiTaskConfigurations.invalidResponse,
      }
    }

    revalidateAiTaskConfigurationPage()
    return { success: true, data: result.data }
  } catch {
    return {
      success: false,
      error: dictionary.aiTaskConfigurations.tokenSaveError,
    }
  }
}
