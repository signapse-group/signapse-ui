"use server"

import { revalidatePath } from "next/cache"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { ActionResult } from "@/app/lib/definitions"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { getRequestLocale } from "@/app/lib/i18n/server"
import {
  PermissionResponse,
  RoleResponse,
  UpdateRolePermissionsRequest,
  updateRolePermissionsRequestSchema,
} from "@/app/lib/roles/definitions"

export async function getRoles(): Promise<RoleResponse[]> {
  return fetchAuthenticated<RoleResponse[]>("/roles")
}

export async function getRoleByKey(roleKey: string): Promise<RoleResponse> {
  return fetchAuthenticated<RoleResponse>(
    `/roles/${encodeURIComponent(roleKey)}`
  )
}

export async function getPermissions(): Promise<PermissionResponse[]> {
  return fetchAuthenticated<PermissionResponse[]>("/permissions")
}

export async function updateRolePermissions(
  roleKey: string,
  request: UpdateRolePermissionsRequest
): Promise<ActionResult<RoleResponse>> {
  const parsedRequest = updateRolePermissionsRequestSchema.safeParse(request)
  if (!parsedRequest.success) {
    const dictionary = await getDictionary(await getRequestLocale())
    return { success: false, error: dictionary.roles.updateError }
  }

  try {
    const data = await fetchAuthenticated<RoleResponse>(
      `/roles/${encodeURIComponent(roleKey)}/permissions`,
      {
        method: "PUT",
        body: JSON.stringify(parsedRequest.data),
      }
    )

    revalidatePath("/roles")

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())

    return {
      success: false,
      error:
        error instanceof Error &&
        "status" in error &&
        typeof error.status === "number"
          ? error.message
          : dictionary.roles.updateError,
    }
  }
}
