"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  getSmtpConfigurationRequestSchema,
  getSmtpConfigurationVersionRequestSchema,
  smtpConfigurationResponseSchema,
  type SmtpConfigurationActionResult,
  type SmtpConfigurationRequest,
  type SmtpConfigurationResponse,
  type SmtpConfigurationVersionRequest,
} from "@/app/lib/smtp-configuration/definitions"

async function getSmtpDictionary() {
  return getDictionary(await getRequestLocale())
}

function getValidationError(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

function getBackendError(error: unknown, fallback: string) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined

  return {
    error: error instanceof Error ? error.message : fallback,
    ...(code ? { code } : {}),
  }
}

function getRequestSchema(dictionary: Dictionary) {
  return getSmtpConfigurationRequestSchema(
    dictionary.smtpConfiguration.validation
  )
}

function getVersionRequestSchema(dictionary: Dictionary) {
  return getSmtpConfigurationVersionRequestSchema(
    dictionary.smtpConfiguration.validation
  )
}

function parseConfigurationResponse(
  response: unknown,
  dictionary: Dictionary
): SmtpConfigurationResponse {
  const parsed = smtpConfigurationResponseSchema.safeParse(response)
  if (!parsed.success) {
    throw new Error(dictionary.smtpConfiguration.responseInvalid)
  }
  return parsed.data
}

export async function getSmtpConfiguration(): Promise<SmtpConfigurationResponse> {
  const dictionary = await getSmtpDictionary()
  const response = await fetchAuthenticated<unknown>("/smtp-configuration")
  return parseConfigurationResponse(response, dictionary)
}

export async function saveSmtpConfiguration(
  request: SmtpConfigurationRequest
): Promise<SmtpConfigurationActionResult<SmtpConfigurationResponse>> {
  const dictionary = await getSmtpDictionary()
  const parsed = getRequestSchema(dictionary).safeParse(request)

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(
        parsed.error,
        dictionary.smtpConfiguration.validation.invalidRequest
      ),
    }
  }

  try {
    const response = await fetchAuthenticated<unknown>("/smtp-configuration", {
      method: "PUT",
      body: JSON.stringify(parsed.data),
    })
    const data = parseConfigurationResponse(response, dictionary)
    revalidatePath("/email-delivery")
    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      ...getBackendError(error, dictionary.smtpConfiguration.saveError),
    }
  }
}

export async function testSmtpConfiguration(
  request: SmtpConfigurationRequest
): Promise<SmtpConfigurationActionResult> {
  const dictionary = await getSmtpDictionary()
  const parsed = getRequestSchema(dictionary).safeParse(request)

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(
        parsed.error,
        dictionary.smtpConfiguration.validation.invalidRequest
      ),
    }
  }

  try {
    await fetchAuthenticated<void>("/smtp-configuration/test", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })
    return { success: true, data: undefined }
  } catch (error: unknown) {
    return {
      success: false,
      ...getBackendError(error, dictionary.smtpConfiguration.testError),
    }
  }
}

function validateVersionRequest(
  request: SmtpConfigurationVersionRequest,
  dictionary: Dictionary
) {
  const parsed = getVersionRequestSchema(dictionary).safeParse(request)
  if (!parsed.success) {
    return {
      success: false as const,
      error: getValidationError(
        parsed.error,
        dictionary.smtpConfiguration.validation.versionRequired
      ),
    }
  }
  return { success: true as const, data: parsed.data }
}

async function updateDeliveryState(
  path: "/smtp-configuration/enable" | "/smtp-configuration/disable",
  request: SmtpConfigurationVersionRequest
): Promise<SmtpConfigurationActionResult<SmtpConfigurationResponse>> {
  const dictionary = await getSmtpDictionary()
  const errorMessage = path.endsWith("/enable")
    ? dictionary.smtpConfiguration.enableError
    : dictionary.smtpConfiguration.disableError
  const parsed = validateVersionRequest(request, dictionary)
  if (!parsed.success) return parsed

  try {
    const response = await fetchAuthenticated<unknown>(path, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })
    const data = parseConfigurationResponse(response, dictionary)
    revalidatePath("/email-delivery")
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, ...getBackendError(error, errorMessage) }
  }
}

export async function enableSmtpConfiguration(
  request: SmtpConfigurationVersionRequest
) {
  return updateDeliveryState("/smtp-configuration/enable", request)
}

export async function disableSmtpConfiguration(
  request: SmtpConfigurationVersionRequest
) {
  return updateDeliveryState("/smtp-configuration/disable", request)
}

export async function deleteSmtpConfiguration(
  request: SmtpConfigurationVersionRequest
): Promise<SmtpConfigurationActionResult> {
  const dictionary = await getSmtpDictionary()
  const parsed = await validateVersionRequest(request, dictionary)
  if (!parsed.success) return parsed

  try {
    await fetchAuthenticated<void>("/smtp-configuration", {
      method: "DELETE",
      body: JSON.stringify(parsed.data),
    })
    revalidatePath("/email-delivery")
    return { success: true, data: undefined }
  } catch (error: unknown) {
    return {
      success: false,
      ...getBackendError(error, dictionary.smtpConfiguration.deleteError),
    }
  }
}
