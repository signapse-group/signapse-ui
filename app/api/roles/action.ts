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
  try {
    const data = await fetchAuthenticated<RoleResponse>(
      `/roles/${encodeURIComponent(roleKey)}/permissions`,
      {
        method: "PUT",
        body: JSON.stringify(request),
      }
    )

    revalidatePath("/roles")

    return { success: true, data }
  } catch (error: unknown) {
    const dictionary = await getDictionary(await getRequestLocale())

    return {
      success: false,
      error:
        error instanceof Error ? error.message : dictionary.roles.updateError,
    }
  }
}
