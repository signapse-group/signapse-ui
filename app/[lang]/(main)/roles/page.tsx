import { getRoles } from "@/app/api/roles/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { ROLE_READ_PERMISSION } from "@/app/lib/roles/permissions"
import type { RoleResponse } from "@/app/lib/roles/definitions"
import { AccessDenied } from "@/components/access-denied"

import { RoleListPage } from "./role-list"

export default async function RolesPage() {
  const [currentPermissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(currentPermissions, ROLE_READ_PERMISSION)) {
    return (
      <AccessDenied
        title={dictionary.errors.accessDeniedTitle}
        description={dictionary.roles.accessDeniedDescription}
        permission={ROLE_READ_PERMISSION}
      />
    )
  }

  let roles: RoleResponse[]
  try {
    roles = await getRoles()
  } catch (error) {
    const status =
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined

    if (status === 403) {
      return (
        <AccessDenied
          title={dictionary.errors.accessDeniedTitle}
          description={dictionary.roles.accessDeniedDescription}
          permission={ROLE_READ_PERMISSION}
        />
      )
    }

    throw error
  }

  return <RoleListPage roles={roles} />
}
