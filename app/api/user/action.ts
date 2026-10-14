"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult, SearchParams } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  UpdatePreferredLanguageRequestSchema,
  type UpdatePreferredLanguageRequest,
} from "@/app/lib/languages/definitions"
import {
  BackendMeResponse,
  UpdateManagedUserRequest,
  UpdateUserProfileRequest,
  UserResponse,
  UserSearchResponse,
} from "@/app/lib/users/definitions"
import { queryParamsToString } from "@/app/lib/utils"

export async function getMe(): Promise<BackendMeResponse> {
  return fetchAuthenticated<BackendMeResponse>("/me")
}

export async function getUsers(
  request: SearchParams
): Promise<UserSearchResponse> {
  const query = queryParamsToString(request)

  return fetchAuthenticated<UserSearchResponse>(
    `/users${query ? `?${query}` : ""}`
  )
}

export async function updateManagedUser(
  id: number,
  request: UpdateManagedUserRequest
): Promise<ActionResult<UserResponse>> {
  try {
    const user = await fetchAuthenticated<UserResponse>(
      `/users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(request),
      }
    )

    revalidatePath("/users")

    return { success: true, data: user }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    const errorMessage =
      error instanceof Error ? error.message : dictionary.users.updateError

    return { success: false, error: errorMessage }
  }
}

export async function updateMyProfile(
  request: UpdateUserProfileRequest
): Promise<ActionResult<BackendMeResponse>> {
  try {
    const profile = await fetchAuthenticated<BackendMeResponse>("/me", {
      method: "PATCH",
      body: JSON.stringify(request),
    })

    revalidatePath("/account")
    revalidatePath("/", "layout")

    return { success: true, data: profile }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())
    const errorMessage =
      error instanceof Error
        ? error.message
        : dictionary.accountProfile.updateError

    return { success: false, error: errorMessage }
  }
}

export async function updateMyPreferredLanguage(
  request: UpdatePreferredLanguageRequest
): Promise<ActionResult<UserResponse>> {
  const dictionary = await getDictionary(await getRequestLocale())
  const parsed = UpdatePreferredLanguageRequestSchema.safeParse(request)

  if (!parsed.success) {
    return {
      success: false as const,
      error: dictionary.accountTelegramLanguage.saveError,
    }
  }

  try {
    const user = await fetchAuthenticated<UserResponse>(
      "/me/preferred-language",
      {
        method: "PATCH",
        body: JSON.stringify(parsed.data),
      }
    )

    if (user.preferredLanguage?.isoCode !== parsed.data.isoCode) {
      return {
        success: false,
        error: dictionary.accountTelegramLanguage.saveError,
      }
    }

    revalidatePath("/account")

    return { success: true as const, data: user }
  } catch {
    return {
      success: false as const,
      error: dictionary.accountTelegramLanguage.saveError,
    }
  }
}
