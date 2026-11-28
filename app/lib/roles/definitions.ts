import { z } from "zod"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export interface PermissionResponse {
  id: number
  key: string
  name: string
  description: string | null
}

export interface RoleResponse {
  id: number
  key: string
  name: string
  description: string | null
  permissions: PermissionResponse[]
}

export const updateRolePermissionsRequestSchema = z.object({
  permissionKeys: z
    .array(z.string())
    .refine(
      (permissionKeys) => new Set(permissionKeys).size === permissionKeys.length
    ),
})

export type UpdateRolePermissionsRequest = z.infer<
  typeof updateRolePermissionsRequestSchema
>

export interface PermissionGroup {
  key: string
  title: string
  permissions: PermissionResponse[]
}

const LEGACY_PERMISSION_GROUP_KEY = "legacy"

function getPermissionGroupKey(permissionKey: string): string {
  const separatorIndex = permissionKey.indexOf(":")
  if (separatorIndex <= 0) return LEGACY_PERMISSION_GROUP_KEY

  return (
    permissionKey.slice(0, separatorIndex).trim() || LEGACY_PERMISSION_GROUP_KEY
  )
}

function formatPermissionGroupTitle(
  groupKey: string,
  dictionary: Dictionary
): string {
  const labels = dictionary.roles.permissionGroups as Record<string, string>
  const label = Object.prototype.hasOwnProperty.call(labels, groupKey)
    ? labels[groupKey]
    : undefined

  return (
    label ??
    dictionary.roles.unknownPermissionGroup.replace("{group}", groupKey)
  )
}

export function groupPermissionsByResource(
  permissions: PermissionResponse[],
  dictionary: Dictionary
): PermissionGroup[] {
  const grouped = new Map<string, PermissionResponse[]>()

  for (const permission of permissions) {
    const groupKey = getPermissionGroupKey(permission.key)
    const currentPermissions = grouped.get(groupKey) ?? []
    currentPermissions.push(permission)
    grouped.set(groupKey, currentPermissions)
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => {
      if (left === LEGACY_PERMISSION_GROUP_KEY) return 1
      if (right === LEGACY_PERMISSION_GROUP_KEY) return -1
      return left.localeCompare(right)
    })
    .map(([key, groupedPermissions]) => ({
      key,
      title: formatPermissionGroupTitle(key, dictionary),
      permissions: [...groupedPermissions].sort((left, right) =>
        left.key.localeCompare(right.key)
      ),
    }))
}
