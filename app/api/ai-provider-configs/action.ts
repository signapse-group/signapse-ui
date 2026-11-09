"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"

import { fetchAuthenticated } from "@/app/api/auth/action"
import {
  aiProviderConfigUpdateRequestSchema,
  aiProviderConfigCreateRequestSchema,
  aiProviderConfigDetailResponseSchema,
  aiProviderConfigPageResponseSchema,
  aiProviderConfigResponseSchema,
  aiProviderCredentialCreateRequestSchema,
  aiProviderCredentialResponseSchema,
  aiProviderCredentialUpdateRequestSchema,
  aiProviderModelCatalogRequestSchema,
  aiProviderModelCatalogResponseSchema,
  type AiProviderConfigCreateRequest,
  type AiProviderConfigDetailResponse,
  type AiProviderConfigListResponse,
  type AiProviderConfigListItem,
  type AiProviderConfigUpdateRequest,
  type AiProviderCredentialCreateRequest,
  type AiProviderCredentialResponse,
  type AiProviderCredentialUpdateRequest,
  type AiProviderModelCatalogRequest,
  type AiProviderModelCatalogResponse,
} from "@/app/lib/ai-provider-configs/definitions"
import { AI_PROVIDER_CONFIG_PERMISSIONS } from "@/app/lib/ai-provider-configs/permissions"
import { ActionResult, Page, SearchParams } from "@/app/lib/definitions"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { queryParamsToString } from "@/app/lib/utils"

const aiProviderConfigListQuerySchema = z
  .object({
    filter: z.string(),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive().max(2000),
    sort: z.array(
      z.object({
        field: z.string().min(1),
        direction: z.enum(["asc", "desc"]),
      })
    ),
  })
  .strict()

const idSchema = z.number().int().positive()

function parseResponse<T>(
  schema: z.ZodType<T>,
  value: unknown,
  invalidMessage: string
): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new Error(invalidMessage)
  }
  return parsed.data
}

async function fetchAiProviderConfigDetail(
  id: number,
  invalidMessage: string
): Promise<AiProviderConfigDetailResponse> {
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    throw new Error(invalidMessage)
  }

  const value = await fetchAuthenticated<unknown>(
    `/ai-provider-configs/${parsedId.data}`
  )
  const detail = parseResponse(
    aiProviderConfigDetailResponseSchema,
    value,
    invalidMessage
  )
  if (detail.id !== parsedId.data) {
    throw new Error(invalidMessage)
  }

  return detail
}

function getSafeBackendError(
  error: unknown,
  fallback: string,
  secrets: readonly string[] = []
): string {
  if (
    !(error instanceof Error) ||
    typeof error !== "object" ||
    !("status" in error)
  ) {
    return fallback
  }

  const status = error.status
  if (typeof status !== "number" || status < 400 || status >= 500) {
    return fallback
  }

  let message = error.message.replace(/[\u0000-\u001f\u007f]/g, " ").trim()

  for (const secret of secrets) {
    if (secret) message = message.replaceAll(secret, "[redacted]")
  }

  if (!message || message.length > 240 || /\bat\s+\S+\s*\(/i.test(message)) {
    return fallback
  }

  return message
}

function revalidateAiProviderConfig(id?: number) {
  revalidatePath("/ai-provider-configs")

  if (id) {
    revalidatePath(`/ai-provider-configs/${id}`)
  }
}

async function fetchAiProviderConfigPage(searchParams: SearchParams): Promise<{
  page: Page<AiProviderConfigListResponse>
  invalidResponseMessage: string
}> {
  const dictionary = await getServerDictionary()
  const parsedSearchParams =
    aiProviderConfigListQuerySchema.safeParse(searchParams)

  if (!parsedSearchParams.success) {
    throw new Error(dictionary.aiProviderConfigs.listErrorDescription)
  }

  const value = await fetchAuthenticated<unknown>(
    `/ai-provider-configs?${queryParamsToString(parsedSearchParams.data)}`
  )

  return {
    page: parseResponse(
      aiProviderConfigPageResponseSchema,
      value,
      dictionary.aiProviderConfigs.responseInvalid
    ),
    invalidResponseMessage: dictionary.aiProviderConfigs.responseInvalid,
  }
}

export async function getAiProviderConfigs(
  searchParams: SearchParams
): Promise<Page<AiProviderConfigListItem>> {
  const { page, invalidResponseMessage } =
    await fetchAiProviderConfigPage(searchParams)

  return {
    ...page,
    content: await Promise.all(
      page.content.map(async (provider): Promise<AiProviderConfigListItem> => {
        try {
          const detail = await fetchAiProviderConfigDetail(
            provider.id,
            invalidResponseMessage
          )
          return {
            ...provider,
            taskReferences: detail.taskReferences,
            taskReferencesStatus: "loaded",
          }
        } catch {
          return {
            ...provider,
            taskReferences: undefined,
            taskReferencesStatus: "unavailable",
          }
        }
      })
    ),
  }
}

export async function getAiProviderConfigsRaw(
  searchParams: SearchParams
): Promise<Page<AiProviderConfigListResponse>> {
  const { page } = await fetchAiProviderConfigPage(searchParams)
  return page
}

export async function getAiProviderConfigById(
  id: number
): Promise<AiProviderConfigDetailResponse> {
  const dictionary = await getServerDictionary()
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    throw new Error(dictionary.aiProviderConfigs.detailErrorDescription)
  }

  return fetchAiProviderConfigDetail(
    parsedId.data,
    dictionary.aiProviderConfigs.responseInvalid
  )
}

export async function getAiProviderModelCatalog(
  request: AiProviderModelCatalogRequest
): Promise<ActionResult<AiProviderModelCatalogResponse>> {
  const dictionary = await getServerDictionary()
  const permissions = await getCurrentPermissions()
  if (
    !hasPermission(permissions, AI_PROVIDER_CONFIG_PERMISSIONS.modelCatalog)
  ) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.modelCatalogDenied,
    }
  }

  const parsedRequest = aiProviderModelCatalogRequestSchema.safeParse(request)
  if (!parsedRequest.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  let value: unknown
  try {
    value = await fetchAuthenticated<unknown>(
      "/ai-provider-configs/model-catalog",
      {
        method: "POST",
        body: JSON.stringify(parsedRequest.data),
      }
    )
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.modelCatalogError,
        [parsedRequest.data.apiKey]
      ),
    }
  }

  const parsedResponse = aiProviderModelCatalogResponseSchema.safeParse(value)
  if (!parsedResponse.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.responseInvalid,
    }
  }
  return { success: true, data: parsedResponse.data }
}

export async function createAiProviderConfig(
  request: AiProviderConfigCreateRequest
): Promise<ActionResult<z.infer<typeof aiProviderConfigResponseSchema>>> {
  const dictionary = await getServerDictionary()
  const parsedRequest = aiProviderConfigCreateRequestSchema.safeParse(request)

  if (!parsedRequest.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  let value: unknown
  try {
    value = await fetchAuthenticated<unknown>("/ai-provider-configs", {
      method: "POST",
      body: JSON.stringify(parsedRequest.data),
    })
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.createError,
        parsedRequest.data.credentials.map(({ apiKey }) => apiKey)
      ),
    }
  }

  const parsedResponse = aiProviderConfigResponseSchema.safeParse(value)
  if (!parsedResponse.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.responseInvalid,
    }
  }

  revalidateAiProviderConfig(parsedResponse.data.id)
  return { success: true, data: parsedResponse.data }
}

export async function updateAiProviderConfig(
  id: number,
  request: AiProviderConfigUpdateRequest
): Promise<ActionResult<AiProviderConfigDetailResponse>> {
  const dictionary = await getServerDictionary()
  if (
    !hasPermission(
      await getCurrentPermissions(),
      AI_PROVIDER_CONFIG_PERMISSIONS.update
    )
  ) {
    return { success: false, error: dictionary.aiProviderConfigs.updateDenied }
  }

  const parsedId = idSchema.safeParse(id)
  const parsedRequest = aiProviderConfigUpdateRequestSchema.safeParse(request)
  if (!parsedId.success || !parsedRequest.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  let value: unknown
  try {
    value = await fetchAuthenticated<unknown>(
      `/ai-provider-configs/${parsedId.data}`,
      {
        method: "PUT",
        body: JSON.stringify(parsedRequest.data),
      }
    )
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.updateError
      ),
    }
  }

  const parsedResponse = aiProviderConfigDetailResponseSchema.safeParse(value)
  if (!parsedResponse.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.responseInvalid,
    }
  }

  revalidateAiProviderConfig(parsedId.data)
  return { success: true, data: parsedResponse.data }
}

export async function createAiProviderCredential(
  id: number,
  request: AiProviderCredentialCreateRequest
): Promise<ActionResult<AiProviderCredentialResponse>> {
  const dictionary = await getServerDictionary()
  if (
    !hasPermission(
      await getCurrentPermissions(),
      AI_PROVIDER_CONFIG_PERMISSIONS.create
    )
  ) {
    return { success: false, error: dictionary.aiProviderConfigs.addKeyDenied }
  }

  const parsedId = idSchema.safeParse(id)
  const parsedRequest =
    aiProviderCredentialCreateRequestSchema.safeParse(request)
  if (!parsedId.success || !parsedRequest.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  let value: unknown
  try {
    value = await fetchAuthenticated<unknown>(
      `/ai-provider-configs/${parsedId.data}/credentials`,
      {
        method: "POST",
        body: JSON.stringify(parsedRequest.data),
      }
    )
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.addKeyError,
        [parsedRequest.data.apiKey]
      ),
    }
  }

  const parsedResponse = aiProviderCredentialResponseSchema.safeParse(value)
  if (!parsedResponse.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.responseInvalid,
    }
  }

  revalidateAiProviderConfig(parsedId.data)
  return { success: true, data: parsedResponse.data }
}

export async function updateAiProviderCredential(
  id: number,
  credentialId: number,
  request: AiProviderCredentialUpdateRequest
): Promise<ActionResult<AiProviderCredentialResponse>> {
  const dictionary = await getServerDictionary()
  if (
    !hasPermission(
      await getCurrentPermissions(),
      AI_PROVIDER_CONFIG_PERMISSIONS.update
    )
  ) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.updateDenied,
    }
  }

  const parsedId = idSchema.safeParse(id)
  const parsedCredentialId = idSchema.safeParse(credentialId)
  const parsedRequest =
    aiProviderCredentialUpdateRequestSchema.safeParse(request)
  if (
    !parsedId.success ||
    !parsedCredentialId.success ||
    !parsedRequest.success
  ) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  let value: unknown
  try {
    value = await fetchAuthenticated<unknown>(
      `/ai-provider-configs/${parsedId.data}/credentials/${parsedCredentialId.data}`,
      {
        method: "PUT",
        body: JSON.stringify(parsedRequest.data),
      }
    )
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.replaceKeyError,
        parsedRequest.data.apiKey ? [parsedRequest.data.apiKey] : []
      ),
    }
  }

  const parsedResponse = aiProviderCredentialResponseSchema.safeParse(value)
  if (!parsedResponse.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.responseInvalid,
    }
  }

  revalidateAiProviderConfig(parsedId.data)
  return { success: true, data: parsedResponse.data }
}

export async function deleteAiProviderCredential(
  id: number,
  credentialId: number
): Promise<ActionResult> {
  const dictionary = await getServerDictionary()
  if (
    !hasPermission(
      await getCurrentPermissions(),
      AI_PROVIDER_CONFIG_PERMISSIONS.delete
    )
  ) {
    return { success: false, error: dictionary.aiProviderConfigs.deleteDenied }
  }

  const parsedId = idSchema.safeParse(id)
  const parsedCredentialId = idSchema.safeParse(credentialId)
  if (!parsedId.success || !parsedCredentialId.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  try {
    await fetchAuthenticated<unknown>(
      `/ai-provider-configs/${parsedId.data}/credentials/${parsedCredentialId.data}`,
      { method: "DELETE" }
    )
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.deleteKeyError
      ),
    }
  }

  revalidateAiProviderConfig(parsedId.data)
  return { success: true, data: undefined }
}

export async function deleteAiProviderConfig(
  id: number
): Promise<ActionResult> {
  const dictionary = await getServerDictionary()
  if (
    !hasPermission(
      await getCurrentPermissions(),
      AI_PROVIDER_CONFIG_PERMISSIONS.delete
    )
  ) {
    return { success: false, error: dictionary.aiProviderConfigs.deleteDenied }
  }

  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return {
      success: false,
      error: dictionary.aiProviderConfigs.validationError,
    }
  }

  try {
    await fetchAuthenticated<unknown>(`/ai-provider-configs/${parsedId.data}`, {
      method: "DELETE",
    })
  } catch (error: unknown) {
    return {
      success: false,
      error: getSafeBackendError(
        error,
        dictionary.aiProviderConfigs.deleteConnectionError
      ),
    }
  }

  revalidateAiProviderConfig(parsedId.data)
  return { success: true, data: undefined }
}
