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

export interface UpdateRolePermissionsRequest {
  permissionKeys: string[]
}

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

export function mergePermissionsWithLegacy(
  availablePermissions: PermissionResponse[],
  selectedPermissions: PermissionResponse[]
): PermissionResponse[] {
  const availableByKey = new Map(
    availablePermissions.map((permission) => [permission.key, permission])
  )
  const mergedPermissions = [...availablePermissions]

  for (const permission of selectedPermissions) {
    if (!availableByKey.has(permission.key)) {
      mergedPermissions.push({
        ...permission,
        name: permission.name || permission.key,
      })
    }
  }

  return mergedPermissions
}
